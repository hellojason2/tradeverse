/**
 * subscriptionRoutes.ts — Agent 3 (Business & Wallet)
 *
 * Subscription endpoints. Delegates to subscriptionController.
 */

import type { FastifyInstance } from 'fastify';
import { asyncErrorWrapper } from '@utils/asyncErrorWrapper.js';
import { authMiddleware } from '@middleware/auth.js';
import * as ctrl from '@controllers/subscriptionController.js';

export default async function subscriptionRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', authMiddleware);

  app.post('/api/subscriptions', asyncErrorWrapper(ctrl.subscribe));
  app.get('/api/subscriptions', asyncErrorWrapper(ctrl.listSubscriptions));
  app.delete('/api/subscriptions/:id', asyncErrorWrapper(ctrl.unsubscribe));
}
