/**
 * Extended copy relation repository methods.
 *
 * @ownership Agent 2 (copy-engine)
 */

import { prisma } from '../config/prisma.js';
import type { CopyRelation } from '@prisma/client';

export type CopyRelationWithStrategy = CopyRelation & {
  strategy: { name: string } | null;
};

type RawCopyRelation = {
  id: string;
  copyProCopierId: string | null;
  followerUserId: string;
  strategyId: string | null;
  slaveAccountId: string;
  status: string;
  equity: unknown;
  balance: unknown;
  minEquityPct: unknown;
  maxEquityPct: unknown;
  stopLossPct: unknown;
  profitSharingPct: unknown;
  copyProMasterLogin: unknown;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
  closedAt: Date | null;
  copyProMasterAccountId: string | null;
  strategyName: string | null;
};

/** Marks a copy relation as BREACHED (equity protector triggered). */
export async function markBreachedCopyRelation(
  id: string,
): Promise<CopyRelationWithStrategy | null> {
  await prisma.$executeRaw`
    UPDATE copy_relations
    SET status = 'BREACHED', "closed_at" = NOW()
    WHERE id = ${id}
  `;

  const rows = await prisma.$queryRaw<RawCopyRelation[]>`
    SELECT
      id, "copy_pro_copier_id" as "copyProCopierId",
      "follower_user_id" as "followerUserId", "strategy_id" as "strategyId",
      "slave_account_id" as "slaveAccountId", status,
      equity, balance, "min_equity_pct" as "minEquityPct",
      "max_equity_pct" as "maxEquityPct", "stop_loss_pct" as "stopLossPct",
      "profit_sharing_pct" as "profitSharingPct",
      "copy_pro_master_login" as "copyProMasterLogin",
      "user_id" as "userId", "created_at" as "createdAt",
      "updated_at" as "updatedAt", "closed_at" as "closedAt",
      "copy_pro_master_account_id" as "copyProMasterAccountId"
    FROM copy_relations
    WHERE id = ${id}
    LIMIT 1
  `;

  const row = rows[0];
  if (!row) return null;

  if (row.strategyId) {
    const strat = await (prisma as any).strategy.findUnique({
      where: { id: row.strategyId },
      select: { name: true },
    });
    return { ...row, strategy: strat } as unknown as CopyRelationWithStrategy;
  }
  return { ...row, strategy: null } as unknown as CopyRelationWithStrategy;
}

/** Returns all ACTIVE copy relations with a CopyPro copier ID. */
export async function findActiveCopyRelationsWithCopierId(): Promise<
  CopyRelationWithStrategy[]
> {
  const rows = await prisma.$queryRaw<RawCopyRelation[]>`
    SELECT
      cr.id, cr."copy_pro_copier_id" as "copyProCopierId",
      cr."follower_user_id" as "followerUserId",
      cr."strategy_id" as "strategyId", cr."slave_account_id" as "slaveAccountId",
      cr.status, cr.equity, cr.balance, cr."min_equity_pct" as "minEquityPct",
      cr."max_equity_pct" as "maxEquityPct", cr."stop_loss_pct" as "stopLossPct",
      cr."profit_sharing_pct" as "profitSharingPct",
      cr."copy_pro_master_login" as "copyProMasterLogin",
      cr."user_id" as "userId", cr."created_at" as "createdAt",
      cr."updated_at" as "updatedAt", cr."closed_at" as "closedAt",
      cr."copy_pro_master_account_id" as "copyProMasterAccountId",
      s.name as "strategyName"
    FROM copy_relations cr
    LEFT JOIN strategies s ON s.id = cr."strategy_id"
    WHERE cr.status = 'ACTIVE' AND cr."copy_pro_copier_id" IS NOT NULL
  `;

  return rows.map(row => ({
    ...row,
    strategy: row.strategyName ? { name: row.strategyName } : null,
  })) as unknown as CopyRelationWithStrategy[];
}
