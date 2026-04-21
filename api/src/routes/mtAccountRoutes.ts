import type { FastifyInstance } from 'fastify';
import { mtAccountController } from '../controllers/mtAccountController.js';
import {
  POST_ACCOUNTS,
  GET_ACCOUNTS,
  GET_ACCOUNT_BY_ID,
  DELETE_ACCOUNT,
  GET_ACCOUNT_BALANCE,
} from '../contracts/routes.js';

export const mtAccountRoutes = async (app: FastifyInstance) => {
  app.post(POST_ACCOUNTS, mtAccountController.create);
  app.get(GET_ACCOUNTS, mtAccountController.list);
  app.get(GET_ACCOUNT_BY_ID, mtAccountController.getById);
  app.delete(DELETE_ACCOUNT, mtAccountController.delete);
  app.get(GET_ACCOUNT_BALANCE, mtAccountController.getBalance);
};