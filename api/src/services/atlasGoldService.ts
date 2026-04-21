/**
 * atlasGoldService.ts — Agent 3 (Business & Wallet)
 *
 * Atlas Gold operations: balance queries, buy, redeem, history.
 * All money/grams use Prisma Decimal (C-02).
 */

import { prisma } from '@config/prisma.js';
import { Decimal } from '@prisma/client/runtime/library.js';
import { DomainError } from '../types/errors.js';
import { ensureWallet } from './walletService.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface AtlasGoldBalanceResult {
  grams: string;
  usdtValue: string;
  spotPricePerGram: string;
  priceUpdatedAt: string;
}

export interface AtlasGoldTxResult {
  id: string;
  type: string;
  grams: string;
  usdtAmount: string;
  pricePerGram: string;
  createdAt: string;
}

export interface PaginatedAtlasGoldTx {
  items: AtlasGoldTxResult[];
  nextCursor: string | null;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function d2s(d: Decimal | null | undefined): string {
  if (!d) return '0';
  return d.toFixed(8);
}

// Placeholder spot price — in production this would fetch from an oracle/API
const MOCK_SPOT_PRICE = new Decimal('65.50'); // USDT per gram

// ---------------------------------------------------------------------------
// Ensure holding
// ---------------------------------------------------------------------------

async function ensureHolding(userId: string): Promise<string> {
  const existing = await prisma.atlasGoldHolding.findUnique({ where: { userId } });
  if (existing) return existing.id;

  const holding = await prisma.atlasGoldHolding.create({
    data: { userId, balance: new Decimal('0') },
  });
  return holding.id;
}

// ---------------------------------------------------------------------------
// Get balance
// ---------------------------------------------------------------------------

export async function getAtlasGoldBalance(userId: string): Promise<AtlasGoldBalanceResult> {
  const holdingId = await ensureHolding(userId);
  const holding = await prisma.atlasGoldHolding.findUniqueOrThrow({ where: { id: holdingId } });

  const usdtValue = holding.balance.mul(MOCK_SPOT_PRICE);

  return {
    grams: d2s(holding.balance),
    usdtValue: d2s(usdtValue),
    spotPricePerGram: d2s(MOCK_SPOT_PRICE),
    priceUpdatedAt: new Date().toISOString(),
  };
}

// ---------------------------------------------------------------------------
// Buy Atlas Gold
// ---------------------------------------------------------------------------

export async function buyAtlasGold(
  userId: string,
  usdtAmount: string,
): Promise<AtlasGoldTxResult> {
  const usdtD = new Decimal(usdtAmount);

  if (usdtD.lte(new Decimal('0'))) {
    throw new DomainError('USER_INPUT', 'USDT amount must be positive');
  }

  // Ensure wallet and holding exist before the transaction
  const walletId = await ensureWallet(userId);
  const holdingId = await ensureHolding(userId);
  const grams = usdtD.div(MOCK_SPOT_PRICE);

  const txResult = await prisma.$transaction(async (tx) => {
    // Check wallet balance
    const wallet = await tx.wallet.findUniqueOrThrow({ where: { id: walletId } });
    if (wallet.balance.lt(usdtD)) {
      throw new DomainError('BUSINESS_RULE', 'Insufficient USDT balance');
    }

    // Deduct from wallet
    await tx.wallet.update({
      where: { id: walletId },
      data: { balance: { decrement: usdtD } },
    });
    await tx.transaction.create({
      data: {
        walletId,
        amount: usdtD.negated(),
        type: 'ATLAS_GOLD_PURCHASE',
        metadata: { usdtAmount: usdtD.toFixed(8), pricePerGram: MOCK_SPOT_PRICE.toFixed(8) },
      },
    });

    // Credit gold holding
    const goldTx = await tx.atlasGoldTransaction.create({
      data: {
        holdingId,
        amount: grams,
        type: 'BUY',
      },
    });

    await tx.atlasGoldHolding.update({
      where: { id: holdingId },
      data: { balance: { increment: grams } },
    });

    return goldTx;
  });

  return {
    id: txResult.id,
    type: txResult.type,
    grams: d2s(txResult.amount),
    usdtAmount: d2s(usdtD),
    pricePerGram: d2s(MOCK_SPOT_PRICE),
    createdAt: txResult.createdAt.toISOString(),
  };
}

// ---------------------------------------------------------------------------
// Redeem Atlas Gold
// ---------------------------------------------------------------------------

export async function redeemAtlasGold(
  userId: string,
  grams: string,
): Promise<AtlasGoldTxResult> {
  const gramsD = new Decimal(grams);

  if (gramsD.lte(new Decimal('0'))) {
    throw new DomainError('USER_INPUT', 'Grams must be positive');
  }

  const walletId = await ensureWallet(userId);
  const holdingId = await ensureHolding(userId);
  const usdtAmount = gramsD.mul(MOCK_SPOT_PRICE);

  const txResult = await prisma.$transaction(async (tx) => {
    const holding = await tx.atlasGoldHolding.findUniqueOrThrow({ where: { id: holdingId } });

    if (holding.balance.lt(gramsD)) {
      throw new DomainError('BUSINESS_RULE', 'Insufficient gold balance');
    }

    // Deduct gold
    const goldTx = await tx.atlasGoldTransaction.create({
      data: {
        holdingId,
        amount: gramsD.negated(),
        type: 'REDEEM',
      },
    });

    await tx.atlasGoldHolding.update({
      where: { id: holdingId },
      data: { balance: { decrement: gramsD } },
    });

    // Credit wallet
    await tx.wallet.update({
      where: { id: walletId },
      data: { balance: { increment: usdtAmount } },
    });
    await tx.transaction.create({
      data: {
        walletId,
        amount: usdtAmount,
        type: 'ATLAS_GOLD_REDEEM',
        metadata: { grams: gramsD.toFixed(8), pricePerGram: MOCK_SPOT_PRICE.toFixed(8) },
      },
    });

    return goldTx;
  });

  return {
    id: txResult.id,
    type: txResult.type,
    grams: d2s(gramsD),
    usdtAmount: d2s(usdtAmount),
    pricePerGram: d2s(MOCK_SPOT_PRICE),
    createdAt: txResult.createdAt.toISOString(),
  };
}

// ---------------------------------------------------------------------------
// History
// ---------------------------------------------------------------------------

export async function listAtlasGoldHistory(
  userId: string,
  opts: {
    type?: 'BUY' | 'REDEEM';
    cursor?: string;
    limit?: number;
  } = {},
): Promise<PaginatedAtlasGoldTx> {
  const holding = await prisma.atlasGoldHolding.findUnique({ where: { userId } });
  if (!holding) {
    return { items: [], nextCursor: null };
  }

  const limit = opts.limit ?? 20;
  const where: Record<string, unknown> = { holdingId: holding.id };
  if (opts.type) where.type = opts.type;

  const items = await prisma.atlasGoldTransaction.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: limit + 1,
    ...(opts.cursor ? { cursor: { id: opts.cursor }, skip: 1 } : {}),
  });

  const hasNext = items.length > limit;
  const sliced = hasNext ? items.slice(0, limit) : items;

  return {
    items: sliced.map((t: { id: string; type: string; amount: Decimal; createdAt: Date }) => ({
      id: t.id,
      type: t.type,
      grams: d2s(t.amount),
      usdtAmount: d2s(t.amount.abs().mul(MOCK_SPOT_PRICE)),
      pricePerGram: d2s(MOCK_SPOT_PRICE),
      createdAt: t.createdAt.toISOString(),
    })),
    nextCursor: hasNext ? sliced[sliced.length - 1].id : null,
  };
}
