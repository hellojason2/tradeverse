import type { FastifyInstance } from 'fastify';
import { webhookController } from '../controllers/webhookController.js';
import { POST_WEBHOOK_EQUITY_PROTECTOR } from '../contracts/routes.js';

export const webhookRoutes = async (app: FastifyInstance) => {
  /** HMAC-validated equity protection callback from CopyPro */
  app.post(POST_WEBHOOK_EQUITY_PROTECTOR, webhookController.equityProtector);
};