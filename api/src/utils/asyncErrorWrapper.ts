import type { FastifyReply, FastifyRequest, RouteGenericInterface } from 'fastify';
import { DomainError, HttpStatusMap } from '../types/errors.js';

/**
 * Generic Fastify route handler compatible with typed schema interfaces.
 * Uses `unknown` for generic params so that `FastifyRequest<RouteGenericInterface>` works
 * correctly when combined with module augmentation (req.user is always available on
 * authenticated routes after the auth decoration is applied).
 */
export type FastifyRouteHandler<T extends RouteGenericInterface = RouteGenericInterface> = (
  req: FastifyRequest<T>,
  reply: FastifyReply,
) => Promise<void>;

export const asyncErrorWrapper = <T extends RouteGenericInterface>(
  fn: FastifyRouteHandler<T>,
): FastifyRouteHandler<T> => {
  return async (req: FastifyRequest<T>, reply: FastifyReply) => {
    try {
      await fn(req, reply);
    } catch (err) {
      if (err instanceof DomainError) {
        req.log.warn({ err, code: err.code, meta: err.meta }, 'DomainError');
        return reply.status(HttpStatusMap[err.code]).send({
          success: false,
          error: {
            code: err.code,
            message: err.message,
            ...(err.meta ? { meta: err.meta } : {}),
          },
        });
      }

      req.log.error({ err }, 'Unhandled error');
      return reply.status(500).send({
        success: false,
        error: {
          code: 'SYSTEM_ERROR',
          message: 'Something went wrong. We\'ve been notified.',
        },
      });
    }
  };
};