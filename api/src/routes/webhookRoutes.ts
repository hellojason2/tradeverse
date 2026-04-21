import type { FastifyInstance } from 'fastify';
import crypto from 'crypto';
import { webhookController } from '../controllers/webhookController.js';
import { POST_WEBHOOK_EQUITY_PROTECTOR } from '../contracts/routes.js';
import { env } from '../config/env.js';

export const webhookRoutes = async (app: FastifyInstance) => {
  /** HMAC-validated equity protection callback from CopyPro */
  app.post(
    POST_WEBHOOK_EQUITY_PROTECTOR,
    {
      preHandler: async (req, reply) => {
        const secret = env.COPYPRO_WEBHOOK_SECRET;
        if (!secret) {
          req.log.warn('COPYPRO_WEBHOOK_SECRET not set — webhook signature disabled');
          return; // skip verification in dev if secret not configured
        }
        const sig = req.headers['x-copypro-signature'];
        if (!sig || typeof sig !== 'string') {
          return reply.code(401).send({
            success: false,
            error: { code: 'MISSING_SIGNATURE', message: 'Webhook signature required' },
          });
        }
        // Use the raw JSON string for HMAC verification
        const bodyString = JSON.stringify(req.body);
        const expected = crypto
          .createHmac('sha256', secret)
          .update(bodyString, 'utf8')
          .digest('hex');
        if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) {
          return reply.code(401).send({
            success: false,
            error: { code: 'INVALID_SIGNATURE', message: 'Webhook signature invalid' },
          });
        }
      },
    },
    webhookController.equityProtector,
  );
};