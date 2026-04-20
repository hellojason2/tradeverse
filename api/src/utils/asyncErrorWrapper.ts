import type { FastifyReply, FastifyRequest } from 'fastify';
import { DomainError, HttpStatusMap } from '@types/errors.js';

export type FastifyRouteHandler = (
  req: FastifyRequest,
  reply: FastifyReply,
) => Promise<void>;

export const asyncErrorWrapper = (fn: FastifyRouteHandler) => {
  return async (req: FastifyRequest, reply: FastifyReply) => {
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
