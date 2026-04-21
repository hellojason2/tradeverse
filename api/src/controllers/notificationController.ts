/**
 * notificationController.ts — Agent 3 (Business & Wallet)
 *
 * Controller for notification endpoints: list, mark read, mark all read.
 */

import * as notificationService from '@services/notificationService.js';
import type { FastifyRequest, FastifyReply } from 'fastify';

export async function listNotifications(req: FastifyRequest, reply: FastifyReply) {
  const query = req.query as {
    isRead?: string;
    category?: string;
    cursor?: string;
    limit?: string;
  };

  const result = await notificationService.listNotifications(req.user!.id, {
    isRead: query.isRead === 'true' ? true : query.isRead === 'false' ? false : undefined,
    type: query.category,
    cursor: query.cursor,
    limit: query.limit ? parseInt(query.limit, 10) : undefined,
  });

  return reply.send({ data: result });
}

export async function markRead(req: FastifyRequest, reply: FastifyReply) {
  const params = req.params as { id: string };
  const result = await notificationService.markRead(req.user!.id, params.id);
  return reply.send({ data: result });
}

export async function markAllRead(req: FastifyRequest, reply: FastifyReply) {
  const count = await notificationService.markAllRead(req.user!.id);
  return reply.send({ data: { count } });
}
