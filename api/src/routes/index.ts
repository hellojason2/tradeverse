/**
 * Central route aggregator — mounts all domain route modules.
 * Auth middleware hooks (requireRole) are applied here once Agent 1 ships
 * the full auth implementation.
 *
 * @ownership Agent 2 (copy-engine)
 */

import type { FastifyInstance } from 'fastify';
import { copyRelationRoutes } from './copyRelationRoutes.js';
import { mtAccountRoutes } from './mtAccountRoutes.js';
import { webhookRoutes } from './webhookRoutes.js';

/** Mounts all copy-engine routes onto the Fastify instance */
export async function registerCopyEngineRoutes(app: FastifyInstance): Promise<void> {
  await app.register(copyRelationRoutes);
  await app.register(mtAccountRoutes);
  await app.register(webhookRoutes);
}