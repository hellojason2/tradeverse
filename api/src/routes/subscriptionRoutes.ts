/**
 * subscriptionRoutes.ts — Agent 3 (Business & Wallet)
 *
 * Subscription endpoints. Delegates to subscriptionController.
 */

import type { FastifyInstance } from 'fastify';
import { asyncErrorWrapper } from '@utils/asyncErrorWrapper.js';
import * as ctrl from '@controllers/subscriptionController.js';

export default async function subscriptionRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', async (req, _reply) => {
    if (!req.user) {
      return _reply.status(401).send({ error: { code: 'UNAUTHORIZED', message: 'Authentication required' } });
    }
  });

  app.post('/api/subscriptions', asyncErrorWrapper(ctrl.subscribe));
  app.get('/api/subscriptions', asyncErrorWrapper(ctrl.listSubscriptions));
  app.delete('/api/subscriptions/:id', asyncErrorWrapper(ctrl.unsubscribe));
}
