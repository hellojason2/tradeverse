/**
 * notificationService.ts — Agent 3 (Business & Wallet)
 *
 * Notification CRUD: list, mark read, mark all read, create.
 */

import { prisma } from '@config/prisma.js';
import { Prisma } from '@prisma/client';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface NotificationRow {
  id: string;
  userId: string;
  type: string;
  payload: unknown;
  readAt: string | null;
  createdAt: string;
}

export interface PaginatedNotifications {
  items: NotificationRow[];
  nextCursor: string | null;
  total: number;
}

// ---------------------------------------------------------------------------
// List
// ---------------------------------------------------------------------------

export async function listNotifications(
  userId: string,
  opts: {
    isRead?: boolean;
    type?: string;
    cursor?: string;
    limit?: number;
  } = {},
): Promise<PaginatedNotifications> {
  const limit = opts.limit ?? 20;

  const where: Record<string, unknown> = { userId };
  if (opts.type) where.type = opts.type;
  if (opts.isRead === true) where.readAt = { not: null };
  if (opts.isRead === false) where.readAt = null;

  const [items, total] = await Promise.all([
    prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit + 1,
      ...(opts.cursor ? { cursor: { id: opts.cursor }, skip: 1 } : {}),
    }),
    prisma.notification.count({ where }),
  ]);

  const hasNext = items.length > limit;
  const sliced = hasNext ? items.slice(0, limit) : items;

  return {
    items: sliced.map((n: { id: string; userId: string; type: string; payload: unknown; readAt: Date | null; createdAt: Date }) => ({
      id: n.id,
      userId: n.userId,
      type: n.type,
      payload: n.payload,
      readAt: n.readAt?.toISOString() ?? null,
      createdAt: n.createdAt.toISOString(),
    })),
    nextCursor: hasNext ? sliced[sliced.length - 1].id : null,
    total,
  };
}

// ---------------------------------------------------------------------------
// Mark read
// ---------------------------------------------------------------------------

export async function markRead(userId: string, notificationId: string): Promise<NotificationRow> {
  const notification = await prisma.notification.findFirst({
    where: { id: notificationId, userId },
  });

  if (!notification) {
    throw new Error('Notification not found');
  }

  const updated = await prisma.notification.update({
    where: { id: notificationId },
    data: { readAt: new Date() },
  });

  return {
    id: updated.id,
    userId: updated.userId,
    type: updated.type,
    payload: updated.payload,
    readAt: updated.readAt?.toISOString() ?? null,
    createdAt: updated.createdAt.toISOString(),
  };
}

// ---------------------------------------------------------------------------
// Mark all read
// ---------------------------------------------------------------------------

export async function markAllRead(userId: string): Promise<number> {
  const result = await prisma.notification.updateMany({
    where: { userId, readAt: null },
    data: { readAt: new Date() },
  });

  return result.count;
}

// ---------------------------------------------------------------------------
// Create notification (for internal use by other services)
// ---------------------------------------------------------------------------

export async function createNotification(
  userId: string,
  type: string,
  payload: Record<string, unknown>,
): Promise<NotificationRow> {
  const notification = await prisma.notification.create({
    data: { userId, type, payload: payload as Prisma.InputJsonValue },
  });

  return {
    id: notification.id,
    userId: notification.userId,
    type: notification.type,
    payload: notification.payload,
    readAt: notification.readAt?.toISOString() ?? null,
    createdAt: notification.createdAt.toISOString(),
  };
}
