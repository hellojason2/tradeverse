/**
 * adminController.ts — Agent 3 (Business & Wallet)
 *
 * Controller for admin endpoints: config, withdrawal approval/rejection.
 */

import { prisma } from '@config/prisma.js';
import { Decimal } from '@prisma/client/runtime/library.js';
import { CONFIG_CATALOG, type ConfigKey } from '../contracts/config-catalog.js';
import type { FastifyRequest, FastifyReply } from 'fastify';

// In-memory config store — in production this would be DB-backed
const configStore = new Map<string, string>();

for (const [key, entry] of Object.entries(CONFIG_CATALOG)) {
  const val = entry.default;
  configStore.set(key, val instanceof Decimal ? val.toFixed(8) : String(val));
}

export async function getConfig(_req: FastifyRequest, reply: FastifyReply) {
  const entries = Array.from(configStore.entries()).map(([key, value]) => {
    const catalogEntry = CONFIG_CATALOG[key as ConfigKey];
    return {
      key,
      value,
      description: catalogEntry?.description ?? '',
      updatedAt: new Date().toISOString(),
      updatedByUserId: null,
    };
  });
  return reply.send({ data: entries });
}

export async function updateConfig(req: FastifyRequest, reply: FastifyReply) {
  const params = req.params as { key: string };
  const body = req.body as { value?: string };

  if (!body.value) {
    return reply.status(400).send({ error: { code: 'USER_INPUT', message: 'value is required' } });
  }

  const key = params.key as ConfigKey;
  if (!CONFIG_CATALOG[key]) {
    return reply.status(404).send({ error: { code: 'USER_INPUT', message: 'Config key not found' } });
  }

  configStore.set(key, body.value);

  return reply.send({
    data: {
      key,
      value: body.value,
      description: CONFIG_CATALOG[key].description,
      updatedAt: new Date().toISOString(),
      updatedByUserId: req.user!.id,
    },
  });
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

  return reply.send({
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
  });
}

export async function approveWithdrawal(req: FastifyRequest, reply: FastifyReply) {
  const params = req.params as { id: string };

  const txn = await prisma.transaction.findUnique({ where: { id: params.id } });
  if (!txn || txn.type !== 'WITHDRAWAL') {
    return reply.status(404).send({ error: { code: 'USER_INPUT', message: 'Withdrawal not found' } });
  }

  const existingMeta = (txn.metadata as Record<string, unknown> ?? {});
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

  return reply.send({
    data: {
      id: updated.id,
      type: updated.type,
      amount: updated.amount.toFixed(8),
      status: 'CONFIRMED',
      createdAt: updated.createdAt.toISOString(),
    },
  });
}

export async function rejectWithdrawal(req: FastifyRequest, reply: FastifyReply) {
  const params = req.params as { id: string };
  const body = req.body as { reason?: string };

  const txn = await prisma.transaction.findUnique({ where: { id: params.id } });
  if (!txn || txn.type !== 'WITHDRAWAL') {
    return reply.status(404).send({ error: { code: 'USER_INPUT', message: 'Withdrawal not found' } });
  }

  const existingMeta = (txn.metadata as Record<string, unknown> ?? {});

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

  return reply.send({
    data: {
      id: params.id,
      status: 'CANCELLED',
    },
  });
}
