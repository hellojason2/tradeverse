import type { FastifyRequest, FastifyReply } from 'fastify';
import { asyncErrorWrapper } from '../utils/asyncErrorWrapper.js';
import { mtAccountService } from '../services/mtAccountService.js';
import type {
  CreateMtAccountRequest,
  GetAccountsQuery,
  AccountPathParams,
} from '../contracts/routes.js';
import type { AuthenticatedUser } from '../contracts/auth.js';

const mapToApiEnvelope = <T>(data: T) => ({ data });

const send = (reply: FastifyReply, data: unknown, status = 200) =>
  reply.status(status).send(mapToApiEnvelope(data));

export const mtAccountController = {
  create: asyncErrorWrapper(async (req: FastifyRequest, reply: FastifyReply) => {
    if (!req.user) {
      return reply.status(401).send({ success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } });
    }
    const body = req.body as CreateMtAccountRequest;
    const account = await mtAccountService.bindAccount(req.user as AuthenticatedUser, body);
    send(reply, account, 201);
  }),

  list: asyncErrorWrapper(async (req: FastifyRequest, reply: FastifyReply) => {
    if (!req.user) {
      return reply.status(401).send({ success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } });
    }
    const accounts = await mtAccountService.listAccounts(req.user as AuthenticatedUser);
    send(reply, accounts);
  }),

  getById: asyncErrorWrapper(async (req: FastifyRequest, reply: FastifyReply) => {
    if (!req.user) {
      return reply.status(401).send({ success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } });
    }
    const params = req.params as AccountPathParams;
    const account = await mtAccountService.getAccount(req.user as AuthenticatedUser, params.id);
    send(reply, account);
  }),

  delete: asyncErrorWrapper(async (req: FastifyRequest, reply: FastifyReply) => {
    if (!req.user) {
      return reply.status(401).send({ success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } });
    }
    const params = req.params as AccountPathParams;
    await mtAccountService.deleteAccount(req.user as AuthenticatedUser, params.id);
    send(reply, { success: true });
  }),

  getBalance: asyncErrorWrapper(async (req: FastifyRequest, reply: FastifyReply) => {
    if (!req.user) {
      return reply.status(401).send({ success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } });
    }
    const params = req.params as AccountPathParams;
    const balance = await mtAccountService.getLiveBalance(req.user as AuthenticatedUser, params.id);
    send(reply, balance);
  }),
};