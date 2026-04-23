import type { FastifyRequest, FastifyReply, HookHandlerDoneFunction } from 'fastify';
import type { AuthMiddleware, UserRole } from '@/contracts/auth.js';
import { verifyAccessToken } from '@/services/jwtService.js';
import { AuthError } from '@/types/errors.js';

// Re-export contract types for consumers who import from this module.
export type { AuthenticatedRequest, AuthenticatedUser, UserRole } from '@/contracts/auth.js';

export const authMiddleware: AuthMiddleware = (
  req: FastifyRequest,
  _reply: FastifyReply,
  done: HookHandlerDoneFunction,
) => {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return done(new AuthError('TOKEN_MISSING', 'Authorization header missing or malformed', 401));
  }

  const token = header.slice(7);
  try {
    const payload = verifyAccessToken(token);
    if (payload.type !== 'access') {
      return done(new AuthError('TOKEN_INVALID', 'Token type is not access', 401));
    }
    req.user = { id: payload.sub, email: payload.email, role: payload.role };
    done();
  } catch (err) {
    if (err instanceof Error && err.name === 'TokenExpiredError') {
      return done(new AuthError('TOKEN_EXPIRED', 'Access token expired', 401));
    }
    return done(new AuthError('TOKEN_INVALID', 'Invalid access token', 401));
  }
};

export function requireAuth(req: FastifyRequest, reply: FastifyReply, done: HookHandlerDoneFunction) {
  authMiddleware(req, reply, done);
}

export function requireRole(allowed: UserRole | UserRole[]) {
  const roles = Array.isArray(allowed) ? allowed : [allowed];
  return (req: FastifyRequest, reply: FastifyReply, done: HookHandlerDoneFunction) => {
    if (!req.user) {
      reply.status(401).send({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
      });
      return;
    }
    if (!roles.includes(req.user.role)) {
      reply.status(403).send({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Insufficient permissions' },
      });
      return;
    }
    done();
  };
}
