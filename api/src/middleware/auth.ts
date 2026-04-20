import type { FastifyRequest, FastifyReply, HookHandlerDoneFunction } from 'fastify';

export interface AuthenticatedRequest extends FastifyRequest {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

export const authMiddleware = (
  req: AuthenticatedRequest,
  reply: FastifyReply,
  done: HookHandlerDoneFunction,
) => {
  // Stub: will be implemented in C5
  done();
};
