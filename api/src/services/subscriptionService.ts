/**
 * subscriptionService.ts — Agent 3 (Business & Wallet)
 *
 * Subscription management: subscribe to strategy, list subscriptions.
 */

import { prisma } from '@config/prisma.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SubscriptionRow {
  id: string;
  userId: string;
  strategyId: string;
  copyRelationId: string;
  createdAt: string;
}

export interface PaginatedSubscriptions {
  items: SubscriptionRow[];
  nextCursor: string | null;
  total: number;
}

// ---------------------------------------------------------------------------
// Subscribe
// ---------------------------------------------------------------------------

export async function subscribe(
  userId: string,
  strategyId: string,
  copyRelationId: string,
): Promise<SubscriptionRow> {
  // Check for duplicate
  const existing = await prisma.subscription.findFirst({
    where: { userId, strategyId },
  });

  if (existing) {
    throw new Error('Already subscribed to this strategy');
  }

  const subscription = await prisma.subscription.create({
    data: {
      userId,
      strategyId,
      copyRelationId,
    },
  });

  return {
    id: subscription.id,
    userId: subscription.userId,
    strategyId: subscription.strategyId,
    copyRelationId: subscription.copyRelationId,
    createdAt: subscription.createdAt.toISOString(),
  };
}

// ---------------------------------------------------------------------------
// List subscriptions
// ---------------------------------------------------------------------------

export async function listSubscriptions(
  userId: string,
  opts: {
    cursor?: string;
    limit?: number;
  } = {},
): Promise<PaginatedSubscriptions> {
  const limit = opts.limit ?? 20;

  const where: Record<string, unknown> = { userId };

  const [items, total] = await Promise.all([
    prisma.subscription.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit + 1,
      ...(opts.cursor ? { cursor: { id: opts.cursor }, skip: 1 } : {}),
    }),
    prisma.subscription.count({ where }),
  ]);

  const hasNext = items.length > limit;
  const sliced = hasNext ? items.slice(0, limit) : items;

  return {
    items: sliced.map((s: { id: string; userId: string; strategyId: string; copyRelationId: string; createdAt: Date }) => ({
      id: s.id,
      userId: s.userId,
      strategyId: s.strategyId,
      copyRelationId: s.copyRelationId,
      createdAt: s.createdAt.toISOString(),
    })),
    nextCursor: hasNext ? sliced[sliced.length - 1].id : null,
    total,
  };
}

// ---------------------------------------------------------------------------
// Unsubscribe
// ---------------------------------------------------------------------------

export async function unsubscribe(userId: string, subscriptionId: string): Promise<boolean> {
  const sub = await prisma.subscription.findFirst({
    where: { id: subscriptionId, userId },
  });

  if (!sub) return false;

  await prisma.subscription.delete({ where: { id: subscriptionId } });
  return true;
}
