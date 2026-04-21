/**
 * walletService.ts — Agent 3 (Business & Wallet)
 *
 * Core wallet operations: balance queries, deposits, withdrawals, transactions.
 * All money values use Prisma Decimal (C-02). Balance = Σ transactions (C-01).
 */

import { prisma } from '@config/prisma.js';
import { Decimal } from '@prisma/client/runtime/library.js';
import { Prisma } from '@prisma/client';
import { DomainError } from '../types/errors.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface WalletBalanceResult {
  available: string;
  locked: string;
  total: string;
}

export interface CreateDepositResult {
  id: string;
  type: string;
  amount: string;
  status: string;
  createdAt: string;
}

export interface CreateWithdrawalResult {
  id: string;
  type: string;
  amount: string;
  fee: string;
  netAmount: string;
  status: string;
  createdAt: string;
}

export interface TransactionRow {
  id: string;
  type: string;
  amount: string;
  reference: string | null;
  metadata: unknown;
  createdAt: string;
}

export interface PaginatedTransactions {
  items: TransactionRow[];
  nextCursor: string | null;
  total: number;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function decimalToString(d: Decimal | null | undefined): string {
  if (!d) return '0';
  return d.toFixed(8);
}

// ---------------------------------------------------------------------------
// Ensure wallet
// ---------------------------------------------------------------------------

export async function ensureWallet(userId: string): Promise<string> {
  const existing = await prisma.wallet.findUnique({ where: { userId } });
  if (existing) return existing.id;

  const wallet = await prisma.wallet.create({
    data: { userId, balance: new Decimal('0'), currency: 'USD' },
  });
  return wallet.id;
}

// ---------------------------------------------------------------------------
// Get balance
// ---------------------------------------------------------------------------

export async function getBalance(userId: string): Promise<WalletBalanceResult> {
  const walletId = await ensureWallet(userId);

  // C-01: balance = Σ transactions
  const aggregations = await prisma.transaction.aggregate({
    _sum: { amount: true },
    where: { walletId },
  });

  const total = aggregations._sum.amount ?? new Decimal('0');
  // For now, locked = 0 (no position locking logic yet)
  const locked = new Decimal('0');
  const available = total.minus(locked);

  return {
    available: decimalToString(available),
    locked: decimalToString(locked),
    total: decimalToString(total),
  };
}

// ---------------------------------------------------------------------------
// Deposit
// ---------------------------------------------------------------------------

export async function createDeposit(
  userId: string,
  amount: string,
  reference?: string,
  metadata?: Record<string, unknown>,
): Promise<CreateDepositResult> {
  const walletId = await ensureWallet(userId);
  const amountD = new Decimal(amount);

  if (amountD.lte(new Decimal('0'))) {
    throw new DomainError('USER_INPUT', 'Deposit amount must be positive');
  }

  // Use a transaction to ensure C-01 invariant
  const txn = await prisma.$transaction(async (tx) => {
    // Create the transaction record
    const transaction = await tx.transaction.create({
      data: {
        walletId,
        amount: amountD,
        type: 'DEPOSIT',
        reference: reference ?? null,
        metadata: (metadata ?? {}) as Prisma.InputJsonValue,
      },
    });

    // Update wallet balance
    await tx.wallet.update({
      where: { id: walletId },
      data: { balance: { increment: amountD } },
    });

    return transaction;
  });

  return {
    id: txn.id,
    type: txn.type,
    amount: decimalToString(txn.amount),
    status: 'CONFIRMED',
    createdAt: txn.createdAt.toISOString(),
  };
}

// ---------------------------------------------------------------------------
// Withdraw
// ---------------------------------------------------------------------------

export async function createWithdrawal(
  userId: string,
  amount: string,
  fee: string,
  reference?: string,
  metadata?: Record<string, unknown>,
): Promise<CreateWithdrawalResult> {
  const walletId = await ensureWallet(userId);
  const amountD = new Decimal(amount);
  const feeD = new Decimal(fee);
  const totalDeduction = amountD.plus(feeD);

  if (amountD.lte(new Decimal('0'))) {
    throw new DomainError('USER_INPUT', 'Withdrawal amount must be positive');
  }

  if (feeD.lt(new Decimal('0'))) {
    throw new DomainError('USER_INPUT', 'Fee cannot be negative');
  }

  const txn = await prisma.$transaction(async (tx) => {
    const wallet = await tx.wallet.findUniqueOrThrow({ where: { id: walletId } });

    if (wallet.balance.lt(totalDeduction)) {
      throw new DomainError('BUSINESS_RULE', 'Insufficient balance');
    }

    // Create withdrawal transaction (negative amount)
    const transaction = await tx.transaction.create({
      data: {
        walletId,
        amount: totalDeduction.negated(),
        type: 'WITHDRAWAL',
        reference: reference ?? null,
        metadata: {
          grossAmount: amountD.toFixed(8),
          fee: feeD.toFixed(8),
          netAmount: amountD.toFixed(8),
          ...(metadata ?? {}),
        },
      },
    });

    // Deduct from wallet
    await tx.wallet.update({
      where: { id: walletId },
      data: { balance: { decrement: totalDeduction } },
    });

    return transaction;
  });

  return {
    id: txn.id,
    type: txn.type,
    amount: amountD.toFixed(8),
    fee: feeD.toFixed(8),
    netAmount: amountD.toFixed(8),
    status: 'PENDING',
    createdAt: txn.createdAt.toISOString(),
  };
}

// ---------------------------------------------------------------------------
// List transactions
// ---------------------------------------------------------------------------

export async function listTransactions(
  userId: string,
  opts: {
    type?: string;
    cursor?: string;
    limit?: number;
  } = {},
): Promise<PaginatedTransactions> {
  const walletId = await ensureWallet(userId);
  const limit = opts.limit ?? 20;

  const where: Record<string, unknown> = { walletId };
  if (opts.type) where.type = opts.type;

  const [items, total] = await Promise.all([
    prisma.transaction.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit + 1,
      ...(opts.cursor
        ? { cursor: { id: opts.cursor }, skip: 1 }
        : {}),
    }),
    prisma.transaction.count({ where }),
  ]);

  const hasNext = items.length > limit;
  const sliced = hasNext ? items.slice(0, limit) : items;

  return {
    items: sliced.map((t: { id: string; type: string; amount: Decimal; reference: string | null; metadata: unknown; createdAt: Date }) => ({
      id: t.id,
      type: t.type,
      amount: decimalToString(t.amount),
      reference: t.reference,
      metadata: t.metadata,
      createdAt: t.createdAt.toISOString(),
    })),
    nextCursor: hasNext ? sliced[sliced.length - 1].id : null,
    total,
  };
}
