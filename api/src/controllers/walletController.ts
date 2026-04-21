/**
 * walletController.ts — Agent 3 (Business & Wallet)
 *
 * Controller for wallet endpoints: balance, deposit, withdraw, transactions.
 */

import * as walletService from '@services/walletService.js';
import type { FastifyRequest, FastifyReply } from 'fastify';

export async function getBalance(req: FastifyRequest, reply: FastifyReply) {
  const balance = await walletService.getBalance(req.user!.id);
  return reply.send({ data: balance });
}

export async function deposit(req: FastifyRequest, reply: FastifyReply) {
  const body = req.body as { amount?: string; network?: string; txHash?: string };
  if (!body.amount) {
    return reply.status(400).send({ error: { code: 'USER_INPUT', message: 'amount is required' } });
  }

  const result = await walletService.createDeposit(
    req.user!.id,
    body.amount,
    body.txHash,
    { network: body.network },
  );

  return reply.status(201).send({ data: result });
}

export async function withdraw(req: FastifyRequest, reply: FastifyReply) {
  const body = req.body as { amount?: string; toAddress?: string; network?: string; twoFaCode?: string };
  if (!body.amount || !body.toAddress || !body.network) {
    return reply.status(400).send({
      error: { code: 'USER_INPUT', message: 'amount, toAddress, and network are required' },
    });
  }

  const feeMap: Record<string, string> = {
    ERC20: '5.00',
    TRC20: '1.00',
    BEP20: '0.50',
  };
  const fee = feeMap[body.network] ?? '5.00';

  const result = await walletService.createWithdrawal(
    req.user!.id,
    body.amount,
    fee,
    undefined,
    { toAddress: body.toAddress, network: body.network },
  );

  return reply.status(201).send({ data: result });
}

export async function listTransactions(req: FastifyRequest, reply: FastifyReply) {
  const query = req.query as {
    type?: string;
    cursor?: string;
    limit?: string;
  };

  const result = await walletService.listTransactions(req.user!.id, {
    type: query.type,
    cursor: query.cursor,
    limit: query.limit ? parseInt(query.limit, 10) : undefined,
  });

  return reply.send({ data: result });
}
