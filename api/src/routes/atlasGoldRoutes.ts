/**
 * atlasGoldRoutes.ts — Agent 3 (Business & Wallet)
 *
 * Atlas Gold endpoints. Delegates to atlasGoldController.
 */

import type { FastifyInstance } from 'fastify';
import { asyncErrorWrapper } from '@utils/asyncErrorWrapper.js';
import * as ctrl from '@controllers/atlasGoldController.js';

export default async function atlasGoldRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', async (req, _reply) => {
    if (!req.user) {
      return _reply.status(401).send({ error: { code: 'UNAUTHORIZED', message: 'Authentication required' } });
    }
  });

  app.get('/api/atlas-gold/balance', asyncErrorWrapper(ctrl.getBalance));
  app.post('/api/atlas-gold/buy', asyncErrorWrapper(ctrl.buy));
  app.post('/api/atlas-gold/redeem', asyncErrorWrapper(ctrl.redeem));
  app.get('/api/atlas-gold/history', asyncErrorWrapper(ctrl.getHistory));
}
