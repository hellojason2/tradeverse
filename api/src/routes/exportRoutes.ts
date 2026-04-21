/**
 * exportRoutes.ts — Agent 3 (Business & Wallet)
 *
 * CSV export endpoints. Delegates to exportController.
 */

import type { FastifyInstance } from 'fastify';
import { asyncErrorWrapper } from '@utils/asyncErrorWrapper.js';
import * as ctrl from '@controllers/exportController.js';

export async function exportRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', async (req, _reply) => {
    if (!req.user) {
      return _reply.status(401).send({ error: { code: 'UNAUTHORIZED', message: 'Authentication required' } });
    }
  });

  app.get('/api/export/transactions', asyncErrorWrapper(ctrl.exportTransactions));
}
