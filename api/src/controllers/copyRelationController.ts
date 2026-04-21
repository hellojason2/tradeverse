import type { FastifyRequest, FastifyReply } from 'fastify';
import { asyncErrorWrapper } from '../utils/asyncErrorWrapper.js';
import { copyRelationService } from '../services/copyRelationService.js';
import type {
  SubscribeRequest,
  CopyRelationPathParams,
  CloseCopyRelationRequest,
  UpdateRiskCapitalRequest,
  GetCopyRelationsQuery,
} from '../contracts/routes.js';
import type { AuthenticatedUser } from '../contracts/auth.js';

const mapToApiEnvelope = <T>(data: T) => ({ data });

const send = (reply: FastifyReply, data: unknown, status = 200) =>
  reply.status(status).send(mapToApiEnvelope(data));

function requireUser(req: FastifyRequest, reply: FastifyReply): AuthenticatedUser {
  if (!req.user) {
    reply.status(401).send({
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
    });
    throw new Error('UNREACHABLE'); // ensures TypeScript knows flow stops
  }
  return req.user as AuthenticatedUser;
}

export const copyRelationController = {
  /** POST /api/copy-relations/subscribe */
  subscribe: asyncErrorWrapper(async (req: FastifyRequest, reply: FastifyReply) => {
    const user = requireUser(req, reply);
    const body = req.body as SubscribeRequest;
    const relation = await copyRelationService.subscribe(user, body);
    send(reply, relation, 201);
  }),

  /** POST /api/copy-relations/:id/activate */
  activate: asyncErrorWrapper(async (req: FastifyRequest, reply: FastifyReply) => {
    const params = req.params as CopyRelationPathParams;
    const relation = await copyRelationService.activate(req.user as AuthenticatedUser, params.id);
    send(reply, relation);
  }),

  /** POST /api/copy-relations/:id/pause */
  pause: asyncErrorWrapper(async (req: FastifyRequest, reply: FastifyReply) => {
    const user = requireUser(req, reply);
    const params = req.params as CopyRelationPathParams;
    const relation = await copyRelationService.pause(user, params.id);
    send(reply, relation);
  }),

  /** POST /api/copy-relations/:id/resume */
  resume: asyncErrorWrapper(async (req: FastifyRequest, reply: FastifyReply) => {
    const user = requireUser(req, reply);
    const params = req.params as CopyRelationPathParams;
    const relation = await copyRelationService.resume(user, params.id);
    send(reply, relation);
  }),

  /** POST /api/copy-relations/:id/close */
  close: asyncErrorWrapper(async (req: FastifyRequest, reply: FastifyReply) => {
    const user = requireUser(req, reply);
    const params = req.params as CopyRelationPathParams;
    const body = req.body as CloseCopyRelationRequest | undefined;
    const relation = await copyRelationService.close(user, params.id, body?.reason);
    send(reply, relation);
  }),

  /** GET /api/copy-relations */
  list: asyncErrorWrapper(async (req: FastifyRequest, reply: FastifyReply) => {
    const user = requireUser(req, reply);
    const query = req.query as GetCopyRelationsQuery | undefined;
    const { items, nextCursor } = await copyRelationService.listRelations(user, query);
    send(reply, { items, nextCursor });
  }),

  /** GET /api/copy-relations/:id */
  getById: asyncErrorWrapper(async (req: FastifyRequest, reply: FastifyReply) => {
    const user = requireUser(req, reply);
    const params = req.params as CopyRelationPathParams;
    const relation = await copyRelationService.getRelation(user, params.id);
    send(reply, relation);
  }),

  /** PATCH /api/copy-relations/:id/risk-capital */
  updateRiskCapital: asyncErrorWrapper(async (req: FastifyRequest, reply: FastifyReply) => {
    const user = requireUser(req, reply);
    const params = req.params as CopyRelationPathParams;
    const body = req.body as UpdateRiskCapitalRequest;
    const relation = await copyRelationService.updateRiskCapital(user, params.id, body);
    send(reply, relation);
  }),
};