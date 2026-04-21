/**
 * strategyService.ts — Agent 3 (Business & Wallet)
 *
 * Strategy read endpoints. Uses Prisma raw queries since Strategy model
 * is owned by Agent 1 (core.prisma) and may not be in the generated client.
 */

import { prisma } from '@config/prisma.js';
import { Decimal } from '@prisma/client/runtime/library.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface StrategyRow {
  id: string;
  providerId: string;
  name: string;
  description: string;
  status: string;
  fundraisingTarget: string;
  fundraisingRaised: string;
  aum: string;
  profitSharePct: string;
  createdAt: string;
}

export interface PaginatedStrategies {
  items: StrategyRow[];
  nextCursor: string | null;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function d2s(d: Decimal | null | undefined): string {
  if (!d) return '0';
  return d.toFixed(8);
}

interface RawStrategyRow {
  id: string;
  provider_id: string;
  name: string;
  description: string;
  status: string;
  fundraising_target: Decimal;
  fundraising_raised: Decimal;
  aum: Decimal;
  profit_share_pct: Decimal;
  created_at: Date;
}

function mapRow(s: RawStrategyRow): StrategyRow {
  return {
    id: s.id,
    providerId: s.provider_id,
    name: s.name,
    description: s.description,
    status: s.status,
    fundraisingTarget: d2s(s.fundraising_target),
    fundraisingRaised: d2s(s.fundraising_raised),
    aum: d2s(s.aum),
    profitSharePct: d2s(s.profit_share_pct),
    createdAt: new Date(s.created_at).toISOString(),
  };
}

// ---------------------------------------------------------------------------
// List strategies
// ---------------------------------------------------------------------------

export async function listStrategies(
  opts: {
    status?: string;
    search?: string;
    cursor?: string;
    limit?: number;
  } = {},
): Promise<PaginatedStrategies> {
  const limit = opts.limit ?? 20;

  const conditions: string[] = ['1=1'];
  const params: unknown[] = [];

  if (opts.status) {
    conditions.push(`s.status = $${params.length + 1}`);
    params.push(opts.status);
  }

  if (opts.search) {
    conditions.push(`(s.name ILIKE $${params.length + 1} OR s.description ILIKE $${params.length + 1})`);
    params.push(`%${opts.search}%`);
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const items = await prisma.$queryRawUnsafe<RawStrategyRow[]>(
    `SELECT id, provider_id, name, description, status,
            fundraising_target, fundraising_raised, aum,
            profit_share_pct, created_at
     FROM strategies s
     ${where}
     ORDER BY s.created_at DESC
     LIMIT $${params.length + 1}`,
    ...params,
    limit + 1,
  );

  const hasNext = items.length > limit;
  const sliced = hasNext ? items.slice(0, limit) : items;

  return {
    items: sliced.map(mapRow),
    nextCursor: hasNext ? sliced[sliced.length - 1].id : null,
  };
}

// ---------------------------------------------------------------------------
// Get strategy by ID
// ---------------------------------------------------------------------------

export async function getStrategyById(id: string): Promise<StrategyRow | null> {
  const rows = await prisma.$queryRawUnsafe<RawStrategyRow[]>(
    `SELECT id, provider_id, name, description, status,
            fundraising_target, fundraising_raised, aum,
            profit_share_pct, created_at
     FROM strategies WHERE id = $1`,
    id,
  );

  const s = rows[0];
  if (!s) return null;

  return mapRow(s);
}
