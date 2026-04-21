/**
 * tradeStatsService.ts — Agent 3 (Business & Wallet)
 *
 * Trade statistics aggregation: trade counts, win rate, drawdown, P/L.
 * Reads from raw SQL since Trade model is owned by Agent 2 (copy.prisma).
 */

import { prisma } from '@config/prisma.js';
import { Decimal } from '@prisma/client/runtime/library.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface TradeStats {
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  winRate: string;
  /** Money — total realized P/L */
  totalPl: string;
  /** Percentage — max drawdown */
  maxDrawdown: string;
  /** Average P/L per trade */
  avgPlPerTrade: string;
}

export interface StrategyTradeStats extends TradeStats {
  strategyId: string;
  strategyName: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function d2s(d: Decimal | null | undefined): string {
  if (!d) return '0';
  return d.toFixed(8);
}

// ---------------------------------------------------------------------------
// Get aggregated trade stats for a user
// ---------------------------------------------------------------------------

export async function getUserTradeStats(userId: string): Promise<TradeStats> {
  const rows = await prisma.$queryRawUnsafe<Array<{
    total_trades: bigint;
    winning_trades: bigint;
    losing_trades: bigint;
    total_pl: Decimal | null;
    max_drawdown_pct: Decimal | null;
  }>>(
    `SELECT
       COUNT(*)                           AS total_trades,
       COUNT(*) FILTER (WHERE realized_pl > 0) AS winning_trades,
       COUNT(*) FILTER (WHERE realized_pl < 0) AS losing_trades,
       COALESCE(SUM(realized_pl), 0)      AS total_pl,
       COALESCE(MAX(ABS(drawdown_pct)), 0) AS max_drawdown_pct
     FROM trades
     WHERE user_id = $1 AND status = 'CLOSED'`,
    userId,
  );

  const row = rows[0];
  const totalTrades = Number(row?.total_trades ?? 0);
  const winningTrades = Number(row?.winning_trades ?? 0);
  const totalPl = row?.total_pl ?? new Decimal('0');

  const winRate = totalTrades > 0
    ? new Decimal(winningTrades).div(totalTrades).mul(100).toFixed(2)
    : '0.00';

  const avgPl = totalTrades > 0
    ? totalPl.div(totalTrades).toFixed(8)
    : '0';

  return {
    totalTrades,
    winningTrades,
    losingTrades: Number(row?.losing_trades ?? 0),
    winRate,
    totalPl: d2s(totalPl),
    maxDrawdown: d2s(row?.max_drawdown_pct ?? new Decimal('0')),
    avgPlPerTrade: avgPl,
  };
}

// ---------------------------------------------------------------------------
// Get trade stats grouped by strategy
// ---------------------------------------------------------------------------

export async function getStrategyTradeStats(
  userId: string,
  opts: { limit?: number } = {},
): Promise<StrategyTradeStats[]> {
  const limit = opts.limit ?? 20;

  const rows = await prisma.$queryRawUnsafe<Array<{
    strategy_id: string;
    strategy_name: string;
    total_trades: bigint;
    winning_trades: bigint;
    losing_trades: bigint;
    total_pl: Decimal | null;
    max_drawdown_pct: Decimal | null;
  }>>(
    `SELECT
       t.strategy_id,
       COALESCE(s.name, 'Unknown') AS strategy_name,
       COUNT(*)                              AS total_trades,
       COUNT(*) FILTER (WHERE t.realized_pl > 0) AS winning_trades,
       COUNT(*) FILTER (WHERE t.realized_pl < 0) AS losing_trades,
       COALESCE(SUM(t.realized_pl), 0)       AS total_pl,
       COALESCE(MAX(ABS(t.drawdown_pct)), 0) AS max_drawdown_pct
     FROM trades t
     LEFT JOIN strategies s ON s.id = t.strategy_id
     WHERE t.user_id = $1 AND t.status = 'CLOSED' AND t.strategy_id IS NOT NULL
     GROUP BY t.strategy_id, s.name
     ORDER BY total_trades DESC
     LIMIT $2`,
    userId,
    limit,
  );

  return rows.map((r) => {
    const totalTrades = Number(r.total_trades);
    const winningTrades = Number(r.winning_trades);
    const totalPl = r.total_pl ?? new Decimal('0');

    const winRate = totalTrades > 0
      ? new Decimal(winningTrades).div(totalTrades).mul(100).toFixed(2)
      : '0.00';

    const avgPl = totalTrades > 0
      ? totalPl.div(totalTrades).toFixed(8)
      : '0';

    return {
      strategyId: r.strategy_id,
      strategyName: r.strategy_name,
      totalTrades,
      winningTrades,
      losingTrades: Number(r.losing_trades),
      winRate,
      totalPl: d2s(totalPl),
      maxDrawdown: d2s(r.max_drawdown_pct ?? new Decimal('0')),
      avgPlPerTrade: avgPl,
    };
  });
}
