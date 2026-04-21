import { prisma } from '../config/prisma.js';
import type { Trade, Prisma } from '@prisma/client';

export type CreateTradeInput = Prisma.TradeCreateInput;
export type UpdateTradeInput = Prisma.TradeUpdateInput;

export const tradeRepository = {
  async create(data: CreateTradeInput): Promise<Trade> {
    return prisma.trade.create({ data });
  },

  async createMany(data: CreateTradeInput[]): Promise<Prisma.BatchPayload> {
    return prisma.trade.createMany({ data: data as unknown as Prisma.TradeCreateManyInput[] });
  },

  async findById(id: string): Promise<Trade | null> {
    return prisma.trade.findUnique({ where: { id } });
  },

  async findByCopyRelationId(
    copyRelationId: string,
    opts?: { status?: string; cursor?: string; limit?: number },
  ): Promise<Trade[]> {
    return prisma.trade.findMany({
      where: {
        copyRelationId,
        ...(opts?.status ? { status: opts.status } : {}),
        ...(opts?.cursor ? { id: { gt: opts.cursor } } : {}),
      },
      take: opts?.limit ?? 50,
      orderBy: { openedAt: 'desc' },
    });
  },

  async findByTicketAndCopyRelationId(ticket: string, copyRelationId: string): Promise<Trade | null> {
    return prisma.trade.findUnique({
      where: {
        ticket_copyRelationId: {
          ticket,
          copyRelationId,
        },
      },
    });
  },

  async update(id: string, data: UpdateTradeInput): Promise<Trade> {
    return prisma.trade.update({ where: { id }, data });
  },

  async upsertByTicket(
    ticket: string,
    copyRelationId: string,
    create: CreateTradeInput,
    update: UpdateTradeInput,
  ): Promise<Trade> {
    return prisma.trade.upsert({
      where: {
        ticket_copyRelationId: {
          ticket,
          copyRelationId,
        },
      },
      create,
      update,
    });
  },

  async countByCopyRelationId(copyRelationId: string): Promise<number> {
    return prisma.trade.count({ where: { copyRelationId } });
  },
};
