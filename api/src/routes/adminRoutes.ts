/**
 * adminRoutes.ts — Agent 3 (Business & Wallet)
 *
 * Admin endpoints. Delegates to adminController.
 */

import type { FastifyInstance } from 'fastify';
import { asyncErrorWrapper } from '@utils/asyncErrorWrapper.js';
import { authMiddleware } from '@middleware/auth.js';
import * as ctrl from '@controllers/adminController.js';

export default async function adminRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', authMiddleware);
  app.addHook('preHandler', async (req, reply) => {
    if (req.user?.role !== 'ADMIN') {
      return reply.status(403).send({ error: { code: 'FORBIDDEN', message: 'Insufficient permissions' } });
    }
  });

  // Config
  app.get('/api/admin/config', asyncErrorWrapper(ctrl.getConfig));
  app.patch('/api/admin/config/:key', asyncErrorWrapper(ctrl.updateConfig));

  // Withdrawal approval
  app.get('/api/admin/withdrawals', asyncErrorWrapper(ctrl.listWithdrawals));
  app.post('/api/admin/withdrawals/:id/approve', asyncErrorWrapper(ctrl.approveWithdrawal));
  app.post('/api/admin/withdrawals/:id/reject', asyncErrorWrapper(ctrl.rejectWithdrawal));
}
