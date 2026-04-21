/**
 * strategyController.ts — Agent 3 (Business & Wallet)
 *
 * Controller for strategy read endpoints.
 */

import * as strategyService from '@services/strategyService.js';
import type { FastifyRequest, FastifyReply } from 'fastify';

export async function listStrategies(req: FastifyRequest, reply: FastifyReply) {
  const query = req.query as {
    status?: string;
    search?: string;
    cursor?: string;
    limit?: string;
  };

  const result = await strategyService.listStrategies({
    status: query.status,
    search: query.search,
    cursor: query.cursor,
    limit: query.limit ? parseInt(query.limit, 10) : undefined,
  });

  return reply.send({ data: result });
}

export async function getStrategy(req: FastifyRequest, reply: FastifyReply) {
  const params = req.params as { id: string };
  const strategy = await strategyService.getStrategyById(params.id);

  if (!strategy) {
    return reply.status(404).send({ error: { code: 'USER_INPUT', message: 'Strategy not found' } });
  }

  return reply.send({ data: strategy });
}
