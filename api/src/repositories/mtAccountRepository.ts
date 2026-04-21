import { prisma } from '../config/prisma.js';
import { Decimal } from '@prisma/client/runtime/library';
import type { MtAccount, Prisma } from '@prisma/client';

export type CreateMtAccountInput = Prisma.MtAccountCreateInput;
export type UpdateMtAccountInput = Prisma.MtAccountUpdateInput;

export const mtAccountRepository = {
  async create(data: CreateMtAccountInput): Promise<MtAccount> {
    return prisma.mtAccount.create({ data });
  },

  async findById(id: string): Promise<MtAccount | null> {
    return prisma.mtAccount.findUnique({ where: { id } });
  },

  async findByUserId(userId: string): Promise<MtAccount[]> {
    return prisma.mtAccount.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  },

  async findByCopyProAccountId(copyProAccountId: string): Promise<MtAccount | null> {
    return prisma.mtAccount.findFirst({
      where: { copyProAccountId },
    });
  },

  async update(id: string, data: UpdateMtAccountInput): Promise<MtAccount> {
    return prisma.mtAccount.update({ where: { id }, data });
  },

  async delete(id: string): Promise<MtAccount> {
    return prisma.mtAccount.delete({ where: { id } });
  },

  async countByUserId(userId: string): Promise<number> {
    return prisma.mtAccount.count({ where: { userId } });
  },

  async findMasterAccount(strategyId: string): Promise<MtAccount | null> {
    const strategy = await prisma.strategy.findUnique({
      where: { id: strategyId },
    });
    if (!strategy) return null;
    return prisma.mtAccount.findUnique({
      where: { id: strategy.masterAccountId },
    });
  },
  async findAllActive(): Promise<MtAccount[]> {
    return prisma.mtAccount.findMany({
      where: { status: 'ACTIVE', copyProAccountId: { not: null } },
    });
  },
  async updateBalance(
    id: string,
    data: { equity?: number; balance?: number },
  ): Promise<MtAccount> {
    return prisma.mtAccount.update({
      where: { id },
      data: {
        equity: data.equity !== undefined ? new Decimal(data.equity.toString()) : undefined,
        balance: data.balance !== undefined ? new Decimal(data.balance.toString()) : undefined,
      },
    });
  },
};
