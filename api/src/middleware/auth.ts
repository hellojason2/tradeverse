import type { FastifyRequest, FastifyReply, HookHandlerDoneFunction } from 'fastify';
import type { AuthMiddleware } from '../contracts/auth.js';

// Re-export contract types for consumers who import from this module.
export type { AuthenticatedRequest, AuthenticatedUser, UserRole } from '../contracts/auth.js';

export const authMiddleware: AuthMiddleware = (
  _req: FastifyRequest,
  _reply: FastifyReply,
  done: HookHandlerDoneFunction,
) => {
  // Stub: will be implemented in C5
  done();
};
