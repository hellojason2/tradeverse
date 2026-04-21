import type { FastifyReply, FastifyRequest } from 'fastify';
import { DomainError, AppError } from '../types/errors.js';

export type FastifyRouteHandler<T extends FastifyRequest = FastifyRequest> = (
  req: T,
  reply: FastifyReply,
) => Promise<void>;

export const asyncErrorWrapper = <T extends FastifyRequest = FastifyRequest>(fn: FastifyRouteHandler<T>) => {
  return async (req: T, reply: FastifyReply) => {
    try {
      await fn(req, reply);
    } catch (err) {
      if (err instanceof DomainError) {
        req.log.warn({ err, code: err.code, meta: err.meta }, 'DomainError');
        return reply.status(err.statusCode).send({
          success: false,
          error: {
            code: err.code,
            message: err.message,
            ...(err.meta ? { meta: err.meta } : {}),
          },
        });
      }

      if (err instanceof AppError) {
        req.log.warn({ err, code: err.code }, 'AppError');
        return reply.status(err.statusCode).send({
          success: false,
          error: {
            code: err.code,
            message: err.message,
            ...(('fields' in err && err.fields) ? { fields: err.fields } : {}),
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
