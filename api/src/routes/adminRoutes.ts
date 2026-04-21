/**
 * adminRoutes.ts — Agent 3 (Business & Wallet)
 *
 * Admin endpoints. Delegates to adminController.
 */

import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { asyncErrorWrapper } from '@utils/asyncErrorWrapper.js';
import * as ctrl from '@controllers/adminController.js';

function requireRole(...roles: string[]) {
  return async (req: FastifyRequest, reply: FastifyReply) => {
    if (!req.user) {
      return reply.status(401).send({ error: { code: 'UNAUTHORIZED', message: 'Authentication required' } });
    }
    if (!roles.includes(req.user.role)) {
      return reply.status(403).send({ error: { code: 'FORBIDDEN', message: 'Insufficient permissions' } });
    }
  };
}

export async function adminRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', requireRole('ADMIN'));

  // Config
  app.get('/api/admin/config', asyncErrorWrapper(ctrl.getConfig));
  app.patch('/api/admin/config/:key', asyncErrorWrapper(ctrl.updateConfig));

  // Withdrawal approval
  app.get('/api/admin/withdrawals', asyncErrorWrapper(ctrl.listWithdrawals));
  app.post('/api/admin/withdrawals/:id/approve', asyncErrorWrapper(ctrl.approveWithdrawal));
  app.post('/api/admin/withdrawals/:id/reject', asyncErrorWrapper(ctrl.rejectWithdrawal));
}
