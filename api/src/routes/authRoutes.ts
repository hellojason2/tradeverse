import type { FastifyInstance } from 'fastify';
import { register, login, refresh, logout, me } from '@controllers/authController.js';
import { requireAuth } from '@middleware/auth.js';
import { asyncErrorWrapper } from '@utils/asyncErrorWrapper.js';

export default async function authRoutes(fastify: FastifyInstance) {
  fastify.post('/api/auth/register', asyncErrorWrapper(register));
  fastify.post('/api/auth/login', asyncErrorWrapper(login));
  fastify.post('/api/auth/refresh', asyncErrorWrapper(refresh));
  fastify.post('/api/auth/logout', { preHandler: requireAuth }, asyncErrorWrapper(logout));
  fastify.get('/api/auth/me', { preHandler: requireAuth }, asyncErrorWrapper(me));
}
