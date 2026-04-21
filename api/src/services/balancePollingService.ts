/**
 * balancePollingService.ts — Syncs MT account balances from CopyPro into local DB.
 *
 * C-10: CopyPro calls happen OUTSIDE Prisma transactions.
 *
 * @ownership Agent 2 (copy-engine)
 */

import { CopyProClientImpl } from './copyProClient.js';
import { findAllActiveMtAccounts, updateMtAccountBalance } from '../repositories/mtAccountExtended.js';
import { env } from '../config/env.js';

/** Polls every active MtAccount and updates local balance + equity. */
export async function pollAllBalances(): Promise<{ updated: number; errors: number }> {
  const accounts = await findAllActiveMtAccounts();
  let updated = 0;
  let errors = 0;

  await Promise.allSettled(
    accounts.map(async (account) => {
      if (!account.copyProAccountId) return;

      const client = new CopyProClientImpl({ userKey: account.userId });
      try {
        const summary = await client.getAccountWithSummary(account.copyProAccountId);
        const equity = summary.accountSummary?.equity;
        const balance = summary.accountSummary?.balance;

        if (equity !== undefined || balance !== undefined) {
          await updateMtAccountBalance(account.id, {
            equity: equity ?? undefined,
            balance: balance ?? undefined,
          });
          updated++;
        }
      } catch (err) {
        console.error(`[BalancePoller] Failed for account ${account.id}:`, err);
        errors++;
      }
    }),
  );

  return { updated, errors };
}

/** Starts a recurring balance polling job using setInterval. */
export function startBalancePoller(intervalMs?: number): NodeJS.Timeout {
  const interval = intervalMs ?? (env.NODE_ENV === 'test' ? 60_000 : 60_000);

  console.log(`[BalancePoller] Starting — interval=${interval}ms`);

  // Run immediately on start
  pollAllBalances().catch(console.error);

  return setInterval(async () => {
    try {
      const result = await pollAllBalances();
      console.log(
        `[BalancePoller] Cycle complete — updated=${result.updated} errors=${result.errors}`,
      );
    } catch (err) {
      console.error('[BalancePoller] Cycle failed:', err);
    }
  }, interval);
}