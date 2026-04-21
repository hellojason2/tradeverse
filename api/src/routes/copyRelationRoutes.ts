import type { FastifyInstance } from 'fastify';
import { authMiddleware } from '../middleware/auth.js';
import { copyRelationController } from '../controllers/copyRelationController.js';
import { POST_COPY_RELATIONS_SUBSCRIBE, POST_COPY_RELATION_ACTIVATE, POST_COPY_RELATION_PAUSE, POST_COPY_RELATION_RESUME, POST_COPY_RELATION_CLOSE, GET_COPY_RELATIONS, GET_COPY_RELATION_BY_ID, PATCH_COPY_RELATION_RISK_CAPITAL } from '../contracts/routes.js';

export const copyRelationRoutes = async (app: FastifyInstance) => {
  app.addHook('preHandler', authMiddleware);
  // Subscribe — user auth required
  app.post(POST_COPY_RELATIONS_SUBSCRIBE, copyRelationController.subscribe);

  // Activate — admin or system
  app.post(POST_COPY_RELATION_ACTIVATE, copyRelationController.activate);

  // Pause — owner or admin
  app.post(POST_COPY_RELATION_PAUSE, copyRelationController.pause);

  // Resume — owner or admin
  app.post(POST_COPY_RELATION_RESUME, copyRelationController.resume);

  // Close — owner or admin
  app.post(POST_COPY_RELATION_CLOSE, copyRelationController.close);

  // List relations — authenticated user
  app.get(GET_COPY_RELATIONS, copyRelationController.list);

  // Get single relation — owner or admin
  app.get(GET_COPY_RELATION_BY_ID, copyRelationController.getById);

  // Update risk capital — owner only
  app.patch(PATCH_COPY_RELATION_RISK_CAPITAL, copyRelationController.updateRiskCapital);
};