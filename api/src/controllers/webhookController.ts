import { randomUUID } from 'crypto';
import type { FastifyRequest, FastifyReply } from 'fastify';
import { asyncErrorWrapper } from '../utils/asyncErrorWrapper.js';
import { copyRelationService } from '../services/copyRelationService.js';
import type { EquityProtectorWebhookPayload, WebhookAckResponse } from '../contracts/routes.js';

/** POST /webhooks/equity-protector — HMAC-validated by CopyPro */
export const webhookController = {
  equityProtector: asyncErrorWrapper(
    async (req: FastifyRequest, reply: FastifyReply): Promise<void> => {
      const payload = req.body as EquityProtectorWebhookPayload;

      switch (payload.event) {
        case 'DRAWDOWN_BREACHED':
          // C-30: emit audit event before closing
          console.log(`[EquityProtector] DRAWDOWN_BREACHED copyRelationId=${payload.copyRelationId} equity=${payload.currentEquity} drawdown=${payload.drawdownPct}%`);
          // TODO: close relation and notify user
          break;

        case 'EQUITY_RESTORED':
          console.log(`[EquityProtector] EQUITY_RESTORED copyRelationId=${payload.copyRelationId} equity=${payload.currentEquity}`);
          // TODO: re-evaluate state
          break;

        case 'COPY_STOPPED':
          console.log(`[EquityProtector] COPY_STOPPED copyRelationId=${payload.copyRelationId}`);
          // CopyPro stopped; may need to update status
          break;

        case 'COPY_STARTED':
          console.log(`[EquityProtector] COPY_STARTED copyRelationId=${payload.copyRelationId}`);
          break;

        default:
          console.warn(`[EquityProtector] Unknown event type: ${(payload as { event: string }).event}`);
      }

      const ack: WebhookAckResponse = { received: true };
      reply.send(ack);
    },
  ),
};