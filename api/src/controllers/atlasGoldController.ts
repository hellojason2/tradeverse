/**
 * atlasGoldController.ts — Agent 3 (Business & Wallet)
 *
 * Controller for Atlas Gold endpoints: balance, buy, redeem, history.
 */

import * as atlasGoldService from '@services/atlasGoldService.js';
import type { FastifyRequest, FastifyReply } from 'fastify';

export async function getBalance(req: FastifyRequest, reply: FastifyReply) {
  const balance = await atlasGoldService.getAtlasGoldBalance(req.user!.id);
  return reply.send({ data: balance });
}

export async function buy(req: FastifyRequest, reply: FastifyReply) {
  const body = req.body as { usdtAmount?: string };
  if (!body.usdtAmount) {
    return reply.status(400).send({ error: { code: 'USER_INPUT', message: 'usdtAmount is required' } });
  }

  const result = await atlasGoldService.buyAtlasGold(req.user!.id, body.usdtAmount);
  return reply.status(201).send({ data: result });
}

export async function redeem(req: FastifyRequest, reply: FastifyReply) {
  const body = req.body as { grams?: string };
  if (!body.grams) {
    return reply.status(400).send({ error: { code: 'USER_INPUT', message: 'grams is required' } });
  }

  const result = await atlasGoldService.redeemAtlasGold(req.user!.id, body.grams);
  return reply.status(201).send({ data: result });
}

export async function getHistory(req: FastifyRequest, reply: FastifyReply) {
  const query = req.query as {
    type?: 'BUY' | 'REDEEM';
    cursor?: string;
    limit?: string;
  };

  const result = await atlasGoldService.listAtlasGoldHistory(req.user!.id, {
    type: query.type,
    cursor: query.cursor,
    limit: query.limit ? parseInt(query.limit, 10) : undefined,
  });

  return reply.send({ data: result });
}
