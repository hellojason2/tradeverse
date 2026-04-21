/**
 * Auth stub for copy-engine development.
 * NEVER MERGE TO MAIN — replace with real imports from @middleware/auth.ts
 * once Agent 1 implements role guards.
 *
 * @ownership Agent 2 (copy-engine)
 * @stubsUntil Agent 1 ships requireRole
 */

import type { FastifyRequest, FastifyReply, HookHandlerDoneFunction } from 'fastify';
import type { UserRole } from '../../../contracts/auth.js';

/**
 * Stub role-guard middleware.
 * In production this will be imported from @middleware/auth.js
 */
export const requireRole = (
  _allowed: UserRole | UserRole[],
) => {
  return (
    _req: FastifyRequest,
    _reply: FastifyReply,
    done: HookHandlerDoneFunction,
  ) => {
    // Stub: pass through during development
    done();
  };
};
