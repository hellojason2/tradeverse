/**
 * walletRoutes.ts — Agent 3 (Business & Wallet)
 *
 * Wallet endpoints. Delegates to walletController.
 */

import type { FastifyInstance } from 'fastify';
import { asyncErrorWrapper } from '@utils/asyncErrorWrapper.js';
import { authMiddleware } from '@middleware/auth.js';
import * as ctrl from '@controllers/walletController.js';

export default async function walletRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', authMiddleware);

  app.get('/api/wallet/balance', asyncErrorWrapper(ctrl.getBalance));
  app.post('/api/wallet/deposit', asyncErrorWrapper(ctrl.deposit));
  app.post('/api/wallet/withdraw', asyncErrorWrapper(ctrl.withdraw));
  app.get('/api/wallet/transactions', asyncErrorWrapper(ctrl.listTransactions));
}
