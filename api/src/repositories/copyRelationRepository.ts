import { prisma } from '../config/prisma.js';
import type { CopyRelation, Prisma } from '@prisma/client';

export type CreateCopyRelationInput = Prisma.CopyRelationCreateInput;
export type UpdateCopyRelationInput = Prisma.CopyRelationUpdateInput;

/** Always includes strategy.name for response building */
export type CopyRelationWithStrategy = CopyRelation & {
  strategy: { name: string } | null;
};

export const copyRelationRepository = {
  async create(data: CreateCopyRelationInput): Promise<CopyRelationWithStrategy> {
    return prisma.copyRelation.create({
      data,
      include: { strategy: { select: { name: true } } },
    }) as Promise<CopyRelationWithStrategy>;
  },

  async findById(id: string): Promise<CopyRelationWithStrategy | null> {
    return prisma.copyRelation.findUnique({
      where: { id },
      include: { strategy: { select: { name: true } } },
    }) as Promise<CopyRelationWithStrategy | null>;
  },

  async findBySlaveAccountId(slaveAccountId: string): Promise<CopyRelationWithStrategy | null> {
    return prisma.copyRelation.findUnique({
      where: { slaveAccountId },
      include: { strategy: { select: { name: true } } },
    }) as Promise<CopyRelationWithStrategy | null>;
  },

  async findByCopyProCopierId(copyProCopierId: string): Promise<CopyRelationWithStrategy | null> {
    return prisma.copyRelation.findFirst({
      where: { copyProCopierId },
      include: { strategy: { select: { name: true } } },
    }) as Promise<CopyRelationWithStrategy | null>;
  },

  async findByFollowerUserId(
    followerUserId: string,
    opts?: { status?: string; cursor?: string; limit?: number },
  ): Promise<CopyRelationWithStrategy[]> {
    const results = await prisma.copyRelation.findMany({
      where: {
        followerUserId,
        ...(opts?.status ? { status: opts.status as CopyRelation['status'] } : {}),
        ...(opts?.cursor ? { id: { gt: opts.cursor } } : {}),
      },
      take: opts?.limit ?? 50,
      orderBy: { createdAt: 'desc' },
      include: { strategy: { select: { name: true } } },
    });
    return results as CopyRelationWithStrategy[];
  },

  async findByStrategyId(
    strategyId: string,
    opts?: { status?: string; cursor?: string; limit?: number },
  ): Promise<CopyRelationWithStrategy[]> {
    const results = await prisma.copyRelation.findMany({
      where: {
        strategyId,
        ...(opts?.status ? { status: opts.status as CopyRelation['status'] } : {}),
        ...(opts?.cursor ? { id: { gt: opts.cursor } } : {}),
      },
      take: opts?.limit ?? 50,
      orderBy: { createdAt: 'desc' },
      include: { strategy: { select: { name: true } } },
    });
    return results as CopyRelationWithStrategy[];
  },

  async update(id: string, data: UpdateCopyRelationInput): Promise<CopyRelationWithStrategy> {
    return prisma.copyRelation.update({
      where: { id },
      data,
      include: { strategy: { select: { name: true } } },
    }) as Promise<CopyRelationWithStrategy>;
  },

  async countActiveByStrategyId(strategyId: string): Promise<number> {
    return prisma.copyRelation.count({
      where: {
        strategyId,
        status: { in: ['PENDING', 'ACTIVE', 'PAUSED'] as CopyRelation['status'][] },
      },
    });
  },

  async hasActiveOrPendingRelation(slaveAccountId: string): Promise<boolean> {
    const count = await prisma.copyRelation.count({
      where: {
        slaveAccountId,
        status: { in: ['PENDING', 'ACTIVE'] as CopyRelation['status'][] },
      },
    });
    return count > 0;
  },
};