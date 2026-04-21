/**
 * tradeLogWorker.ts — Polls CopyPro for new trade logs and persists them locally.
 *
 * C-10: CopyPro calls happen OUTSIDE Prisma transactions.
 * C-12: Deduplication via unique(ticket, copyRelationId) on Trade table.
 *
 * @ownership Agent 2 (copy-engine)
 */

import { CopyProClientImpl } from './copyProClient.js';
import { tradeRepository } from '../repositories/tradeRepository.js';
import { copyRelationRepository } from '../repositories/copyRelationRepository.js';
import { findActiveCopyRelationsWithCopierId } from '../repositories/copyRelationRepoExtended.js';
import { prisma } from '../config/prisma.js';
import type { TradeLogEntry } from '../contracts/copyPro.js';
import type { CopyRelationWithStrategy } from '../repositories/copyRelationRepository.js';

interface SyncResult {
  copierId: string;
  newTrades: number;
  errors: number;
}

/**
 * Polls all active CopyRelations for new trade logs from CopyPro.
 * Persists trades using upsert (safe for deduplication via C-12 unique index).
 *
 * @returns Array of sync results per copier
 */
export async function pollAllTradeLogs(): Promise<SyncResult[]> {
  const activeRelations = await findActiveCopyRelationsWithCopierId();

  const results = await Promise.allSettled(
    activeRelations.map(async (relation: { copyProCopierId: string | null; id: string; followerUserId: string }) => {
      return syncTradeLogsForCopier(
        relation.copyProCopierId!,
        relation.id,
        relation.followerUserId,
      );
    }),
  );

  return (results as PromiseSettledResult<SyncResult>[])
    .filter((r): r is PromiseFulfilledResult<SyncResult> => r.status === 'fulfilled')
    .map((r) => r.value);
}

async function syncTradeLogsForCopier(
  copierId: string,
  copyRelationId: string,
  followerUserId: string,
): Promise<SyncResult> {
  const client = new CopyProClientImpl({ userKey: followerUserId });
  let newTrades = 0;
  let errors = 0;

  try {
    const logs = await client.getTradeLogs({ copierId, limit: 100 });

    for (const log of logs) {
      try {
        await upsertTrade(log, copyRelationId);
        newTrades++;
      } catch (err) {
        // Unique constraint violation is expected for already-synced trades (C-12)
        if (err instanceof Error && err.message.includes('Unique constraint')) {
          // Already synced — skip
        } else {
          console.error(`[TradeLogWorker] Failed to persist trade ticket=${log.slaveOrder?.ticket}:`, err);
          errors++;
        }
      }
    }
  } catch (err) {
    console.error(`[TradeLogWorker] Failed to fetch logs for copier ${copierId}:`, err);
    errors++;
  }

  return { copierId, newTrades, errors };
}

/**
 * Upserts a single trade log entry into the Trade table.
 * Uses raw SQL upsert to handle the unique(ticket, copyRelationId) constraint safely.
 * C-12: Duplicate tickets for the same copyRelationId are silently ignored.
 */
async function upsertTrade(log: TradeLogEntry, copyRelationId: string): Promise<void> {
  const openedAt = new Date(log.timeUTC);
  const closedAt = log.slaveOrder?.closeTime ? new Date(log.slaveOrder?.closeTime) : null;

  await prisma.$executeRaw`
    INSERT INTO "trades" (
      id,
      "copy_relation_id",
      ticket,
      symbol,
      type,
      lots,
      "open_price",
      "close_price",
      profit,
      "opened_at",
      "closed_at",
      "created_at"
    )
    VALUES (
      gen_random_uuid()::text,
      ${copyRelationId},
      ${log.slaveOrder?.ticket},
      ${log.slaveOrder?.symbol},
      ${log.slaveOrder?.type},
      ${log.slaveOrder?.lots},
      ${log.slaveOrder?.openPrice},
      ${log.slaveOrder?.closePrice ?? null},
      ${log.slaveOrder?.profit ?? null},
      ${openedAt},
      ${closedAt},
      NOW()
    )
    ON CONFLICT (ticket, "copy_relation_id")
    DO NOTHING
  `;
}

/** Finds active CopyRelations that have a CopyPro copier ID. */
async function findActiveCopiers(): Promise<{ id: string; copyProCopierId: string; followerUserId: string }[]> {
  const result = await prisma.$queryRaw<{ id: string; copyProCopierId: string; followerUserId: string }[]>`
    SELECT cr.id, cr."copy_pro_copier_id" as "copyProCopierId", cr."follower_user_id" as "followerUserId"
    FROM copy_relations cr
    WHERE cr.status = 'ACTIVE'
      AND cr."copy_pro_copier_id" IS NOT NULL
  `;
  return result;
}

// Export for health checks / manual trigger
export { findActiveCopiers };

/** Runs a single poll cycle. Useful for manual trigger endpoints. */
export async function runTradeLogCycle(): Promise<SyncResult[]> {
  return pollAllTradeLogs();
}

/** Starts the recurring trade log polling loop. */
export function startTradeLogWorker(intervalMs?: number): NodeJS.Timeout {
  const interval = intervalMs ?? 60_000;

  console.log(`[TradeLogWorker] Starting — interval=${interval}ms`);

  // Run immediately on start
  pollAllTradeLogs()
    .then((results) =>
      results.forEach((r) =>
        console.log(`[TradeLogWorker] Initial sync copier=${r.copierId} new=${r.newTrades} errors=${r.errors}`),
      ),
    )
    .catch(console.error);

  return setInterval(async () => {
    try {
      const results = await pollAllTradeLogs();
      for (const r of results) {
        if (r.errors > 0) {
          console.warn(`[TradeLogWorker] copier=${r.copierId} new=${r.newTrades} errors=${r.errors}`);
        }
      }
    } catch (err) {
      console.error('[TradeLogWorker] Cycle failed:', err);
    }
  }, interval);
}