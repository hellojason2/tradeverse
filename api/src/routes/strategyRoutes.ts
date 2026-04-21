/**
 * strategyRoutes.ts — Agent 3 (Business & Wallet)
 *
 * Strategy read endpoints. Delegates to strategyController.
 */

import type { FastifyInstance } from 'fastify';
import { asyncErrorWrapper } from '@utils/asyncErrorWrapper.js';
import * as ctrl from '@controllers/strategyController.js';

export async function strategyRoutes(app: FastifyInstance): Promise<void> {
  // Public routes — no auth required

  app.get('/api/strategies', asyncErrorWrapper(ctrl.listStrategies));
  app.get('/api/strategies/:id', asyncErrorWrapper(ctrl.getStrategy));
}
