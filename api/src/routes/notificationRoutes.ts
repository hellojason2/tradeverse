/**
 * notificationRoutes.ts — Agent 3 (Business & Wallet)
 *
 * Notification endpoints. Delegates to notificationController.
 */

import type { FastifyInstance } from 'fastify';
import { asyncErrorWrapper } from '@utils/asyncErrorWrapper.js';
import * as ctrl from '@controllers/notificationController.js';

export async function notificationRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', async (req, _reply) => {
    if (!req.user) {
      return _reply.status(401).send({ error: { code: 'UNAUTHORIZED', message: 'Authentication required' } });
    }
  });

  app.get('/api/notifications', asyncErrorWrapper(ctrl.listNotifications));
  app.post('/api/notifications/:id/read', asyncErrorWrapper(ctrl.markRead));
  app.post('/api/notifications/read-all', asyncErrorWrapper(ctrl.markAllRead));
}
