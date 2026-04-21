/**
 * exportRoutes.ts — Agent 3 (Business & Wallet)
 *
 * CSV export endpoints. Delegates to exportController.
 */

import type { FastifyInstance } from 'fastify';
import { asyncErrorWrapper } from '@utils/asyncErrorWrapper.js';
import { authMiddleware } from '@middleware/auth.js';
import * as ctrl from '@controllers/exportController.js';

export default async function exportRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', authMiddleware);

  app.get('/api/export/transactions', asyncErrorWrapper(ctrl.exportTransactions));
}
