/**
 * adminController.ts — Agent 3 (Business & Wallet)
 *
 * Controller for admin endpoints: config, withdrawal approval/rejection.
 * Uses Prisma Config model (Fix 4) and DomainError (Fix 6).
 */

import { prisma } from '@config/prisma.js';
import { Decimal } from '@prisma/client/runtime/library.js';
import { CONFIG_CATALOG, type ConfigKey } from '../../contracts/config-catalog.js';
import type { ApiSuccess, ApiError } from '../../contracts/routes.js';
import type { FastifyRequest, FastifyReply } from 'fastify';
import { DomainError } from '../../types/errors.js';

// Seed config from catalog if DB row is missing (idempotent)
async function getOrCreateConfigValue(key: string): Promise<string> {
  const row = await prisma.config.findUnique({ where: { key } });
  if (row) return JSON.stringify(row.value);

  const entry = CONFIG_CATALOG[key as ConfigKey];
  if (!entry) throw new DomainError('USER_INPUT', `Unknown config key: ${key}`);

  const defaultVal = entry.default;
  const serialized = defaultVal instanceof Decimal ? defaultVal.toFixed(8) : String(defaultVal);
  await prisma.config.upsert({
    where: { key },
    update: {},
    create: {
      key,
      value: JSON.stringify(serialized),
      description: entry.description,
    },
  });
  return JSON.stringify(serialized);
}

export async function getConfig(_req: FastifyRequest, reply: FastifyReply) {
  const entries = [];
  for (const [key, entry] of Object.entries(CONFIG_CATALOG)) {
    await getOrCreateConfigValue(key);
    const row = await prisma.config.findUnique({ where: { key } });
    entries.push({
      key,
      value: row?.value ?? null,
      description: entry?.description ?? '',
      updatedAt: row?.updatedAt?.toISOString() ?? new Date().toISOString(),
      updatedByUserId: null,
    });
  }
  const body: ApiSuccess<typeof entries> = { data: entries };
  return reply.send(body);
}

export async function updateConfig(req: FastifyRequest, reply: FastifyReply) {
  const params = req.params as { key: string };
  const body = req.body as { value?: string };

  if (!body.value) {
    const err: ApiError = { error: { code: 'USER_INPUT', message: 'value is required' } };
    return reply.status(400).send(err);
  }

  const key = params.key as ConfigKey;
  if (!CONFIG_CATALOG[key]) {
    const err: ApiError = { error: { code: 'USER_INPUT', message: 'Config key not found' } };
    return reply.status(404).send(err);
  }

  const updated = await prisma.config.upsert({
    where: { key },
    update: { value: JSON.stringify(body.value) },
    create: {
      key,
      value: JSON.stringify(body.value),
      description: CONFIG_CATALOG[key].description,
    },
  });

  const resp = {
    data: {
      key,
      value: updated.value,
      description: CONFIG_CATALOG[key].description,
      updatedAt: new Date(updated.updatedAt.toISOString()),
      updatedByUserId: req.user!.id,
    },
  };
  return reply.send(resp);
}

export async function listWithdrawals(req: FastifyRequest, reply: FastifyReply) {
  const query = req.query as { status?: string; cursor?: string; limit?: string };
  const limit = query.limit ? parseInt(query.limit, 10) : 20;

  const where: Record<string, unknown> = { type: 'WITHDRAWAL' };

  const transactions = await prisma.transaction.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: limit + 1,
    ...(query.cursor ? { cursor: { id: query.cursor }, skip: 1 } : {}),
  });

  const hasNext = transactions.length > limit;
  const sliced = hasNext ? transactions.slice(0, limit) : transactions;

  const resp: ApiSuccess<{ items: unknown[]; nextCursor: string | null }> = {
    data: {
      items: sliced.map((t: { id: string; type: string; amount: Decimal; reference: string | null; metadata: unknown; createdAt: Date }) => ({
        id: t.id,
        type: t.type,
        amount: t.amount.toFixed(8),
        reference: t.reference,
        metadata: t.metadata,
        createdAt: t.createdAt.toISOString(),
      })),
      nextCursor: hasNext ? sliced[sliced.length - 1].id : null,
    },
  };
  return reply.send(resp);
}

export async function approveWithdrawal(req: FastifyRequest, reply: FastifyReply) {
  const params = req.params as { id: string };

  const txn = await prisma.transaction.findUnique({ where: { id: params.id } });
  if (!txn || txn.type !== 'WITHDRAWAL') {
    const err: ApiError = { error: { code: 'USER_INPUT', message: 'Withdrawal not found' } };
    return reply.status(404).send(err);
  }

  const existingMeta = (txn.metadata as Record<string, unknown>) ?? {};
  const updated = await prisma.transaction.update({
    where: { id: params.id },
    data: {
      metadata: {
        ...existingMeta,
        approvedBy: req.user!.id,
        approvedAt: new Date().toISOString(),
        status: 'CONFIRMED',
      },
    },
  });

  const resp = {
    data: {
      id: updated.id,
      type: updated.type,
      amount: new Decimal(updated.amount.toFixed(8)),
      status: 'CONFIRMED',
      createdAt: new Date(updated.createdAt.toISOString()),
    },
  };
  return reply.send(resp);
}

export async function rejectWithdrawal(req: FastifyRequest, reply: FastifyReply) {
  const params = req.params as { id: string };
  const body = req.body as { reason?: string };

  const txn = await prisma.transaction.findUnique({ where: { id: params.id } });
  if (!txn || txn.type !== 'WITHDRAWAL') {
    const err: ApiError = { error: { code: 'USER_INPUT', message: 'Withdrawal not found' } };
    return reply.status(404).send(err);
  }

  const existingMeta = (txn.metadata as Record<string, unknown>) ?? {};

  await prisma.$transaction(async (tx) => {
    await tx.wallet.update({
      where: { id: txn.walletId },
      data: { balance: { increment: txn.amount.abs() } },
    });

    await tx.transaction.update({
      where: { id: params.id },
      data: {
        metadata: {
          ...existingMeta,
          rejectedBy: req.user!.id,
          rejectedAt: new Date().toISOString(),
          rejectionReason: body.reason,
          status: 'CANCELLED',
        },
      },
    });

    await tx.transaction.create({
      data: {
        walletId: txn.walletId,
        amount: txn.amount.abs(),
        type: 'REFUND',
        reference: `refund:${params.id}`,
        metadata: { originalTxnId: params.id, reason: body.reason },
      },
    });
  });

  const resp: ApiSuccess<{ id: string; status: string }> = {
    data: {
      id: params.id,
      status: 'CANCELLED',
    },
  };
  return reply.send(resp);
}
