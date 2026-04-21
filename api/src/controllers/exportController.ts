/**
 * exportController.ts — Agent 3 (Business & Wallet)
 *
 * Controller for CSV export endpoints.
 */

import * as exportService from '@services/exportService.js';
import type { FastifyRequest, FastifyReply } from 'fastify';

export async function exportTransactions(req: FastifyRequest, reply: FastifyReply) {
  const query = req.query as {
    type?: string;
    fromDate?: string;
    toDate?: string;
  };

  const csv = await exportService.exportTransactionsCsv(req.user!.id, {
    type: query.type,
    fromDate: query.fromDate,
    toDate: query.toDate,
  });

  const date = new Date().toISOString().slice(0, 10);
  reply.header('Content-Type', 'text/csv');
  reply.header('Content-Disposition', `attachment; filename="transactions-${date}.csv"`);

  return reply.send(csv);
}
