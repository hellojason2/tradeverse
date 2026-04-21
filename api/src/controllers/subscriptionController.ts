/**
 * subscriptionController.ts — Agent 3 (Business & Wallet)
 *
 * Controller for subscription endpoints.
 */

import * as subscriptionService from '@services/subscriptionService.js';
import type { FastifyRequest, FastifyReply } from 'fastify';

export async function subscribe(req: FastifyRequest, reply: FastifyReply) {
  const body = req.body as { strategyId?: string; copyRelationId?: string };
  if (!body.strategyId || !body.copyRelationId) {
    return reply.status(400).send({
      error: { code: 'USER_INPUT', message: 'strategyId and copyRelationId are required' },
    });
  }

  const result = await subscriptionService.subscribe(
    req.user!.id,
    body.strategyId,
    body.copyRelationId,
  );

  return reply.status(201).send({ data: result });
}

export async function listSubscriptions(req: FastifyRequest, reply: FastifyReply) {
  const query = req.query as { cursor?: string; limit?: string };
  const result = await subscriptionService.listSubscriptions(req.user!.id, {
    cursor: query.cursor,
    limit: query.limit ? parseInt(query.limit, 10) : undefined,
  });

  return reply.send({ data: result });
}

export async function unsubscribe(req: FastifyRequest, reply: FastifyReply) {
  const params = req.params as { id: string };
  const deleted = await subscriptionService.unsubscribe(req.user!.id, params.id);

  if (!deleted) {
    return reply.status(404).send({ error: { code: 'USER_INPUT', message: 'Subscription not found' } });
  }

  return reply.send({ data: { success: true } });
}
