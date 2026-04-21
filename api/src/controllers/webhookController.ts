/**
 * webhookController.ts — Handles CopyPro equity protection callback webhooks.
 *
 * Route: POST /webhooks/equity-protector
 * Auth: COPYPRO_MANAGER_KEY HMAC validation done by the caller infrastructure.
 * C-10: CopyPro calls happen OUTSIDE Prisma transactions.
 * C-30: Every status transition emits an audit event.
 *
 * @ownership Agent 2 (copy-engine)
 */

import type { FastifyRequest, FastifyReply } from 'fastify';
import { asyncErrorWrapper } from '../utils/asyncErrorWrapper.js';
import { copyRelationRepository } from '../repositories/copyRelationRepository.js';
import { markBreachedCopyRelation } from '../repositories/copyRelationRepoExtended.js';
import { CopyProClientImpl } from '../services/copyProClient.js';
import { prisma } from '../config/prisma.js';
import type {
  EquityProtectorWebhookPayload,
  WebhookAckResponse,
} from '../contracts/routes.js';

export const webhookController = {
  /**
   * Equity protector callback from CopyPro.
   * Route: POST /webhooks/equity-protector
   */
  equityProtector: asyncErrorWrapper(
    async (req: FastifyRequest, reply: FastifyReply): Promise<void> => {
      const payload = req.body as EquityProtectorWebhookPayload;
      const ack: WebhookAckResponse = { received: true };

      switch (payload.event) {
        case 'DRAWDOWN_BREACHED': {
          const { copyRelationId, currentEquity, drawdownPct } = payload;
          console.log(
            `[EquityWebhook] DRAWDOWN_BREACHED relation=${copyRelationId} equity=${currentEquity} drawdown=${drawdownPct}%`,
          );

          const relation = await copyRelationRepository.findById(copyRelationId);
          if (!relation) {
            console.warn(
              `[EquityWebhook] Relation not found: ${copyRelationId}`,
            );
            return reply.send(ack);
          }

          if (relation.status !== 'ACTIVE') {
            console.warn(
              `[EquityWebhook] Relation ${copyRelationId} not ACTIVE (status=${relation.status}) — skipping breach.`,
            );
            return reply.send(ack);
          }

          // Remove copier from CopyPro (outside TX per C-10)
          if (relation.copyProCopierId) {
            try {
              const client = new CopyProClientImpl({
                userKey: relation.followerUserId,
              });
              await client.pauseCopier(
                relation.copyProCopierId,
                true,
                'EquityProtection',
              );
              await client.removeCopier(relation.copyProCopierId, false);
            } catch (err) {
              console.error(
                `[EquityWebhook] Failed to remove copier ${relation.copyProCopierId}:`,
                err,
              );
              // Continue — mark breached anyway
            }
          }

          // Mark breached in DB (outside TX per C-10)
          await markBreachedCopyRelation(copyRelationId);

          // Emit audit event (C-30)
          try {
            await prisma.auditLog.create({
              data: {
                entityType: 'CopyRelation',
                entityId: copyRelationId,
                action: 'EQUITY_BREACHED',
                after: {
                  equity: currentEquity,
                  drawdownPct,
                },
              },
            });
          } catch {
            // Non-fatal
          }

          console.log(
            `[EquityWebhook] Relation ${copyRelationId} marked BREACHED`,
          );
          return reply.send(ack);
        }

        case 'EQUITY_RESTORED': {
          const { copyRelationId } = payload;
          console.log(
            `[EquityWebhook] EQUITY_RESTORED relation=${copyRelationId}`,
          );
          return reply.send(ack);
        }

        case 'COPY_STOPPED': {
          const { copyRelationId } = payload;
          console.log(
            `[EquityWebhook] COPY_STOPPED relation=${copyRelationId}`,
          );
          return reply.send(ack);
        }

        case 'COPY_STARTED': {
          const { copyRelationId } = payload;
          console.log(
            `[EquityWebhook] COPY_STARTED relation=${copyRelationId}`,
          );
          return reply.send(ack);
        }

        default: {
          // Exhaustiveness: if a new event is added to EquityProtectorEvent
          // but not handled here, TypeScript will warn at compile time.
          const _exhaustive: never = payload.event;
          void _exhaustive;
          return reply.send(ack);
        }
      }
    },
  ),
};
