/**
 * exportService.ts — Agent 3 (Business & Wallet)
 *
 * CSV export for transactions.
 */

import { prisma } from '@config/prisma.js';
import { Decimal } from '@prisma/client/runtime/library.js';

// ---------------------------------------------------------------------------
// Export transactions as CSV
// ---------------------------------------------------------------------------

export async function exportTransactionsCsv(
  userId: string,
  opts: {
    type?: string;
    fromDate?: string;
    toDate?: string;
  } = {},
): Promise<string> {
  const wallet = await prisma.wallet.findUnique({ where: { userId } });
  if (!wallet) return '';

  const where: Record<string, unknown> = { walletId: wallet.id };
  if (opts.type) where.type = opts.type;
  if (opts.fromDate || opts.toDate) {
    const created: Record<string, Date> = {};
    if (opts.fromDate) created.gte = new Date(opts.fromDate);
    if (opts.toDate) created.lte = new Date(opts.toDate);
    where.createdAt = created;
  }

  const transactions = await prisma.transaction.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: 10000, // safety limit
  });

  const header = 'id,type,amount,reference,created_at';
  const rows = transactions.map((t: { id: string; type: string; amount: Decimal; reference: string | null; createdAt: Date }) =>
    [
      t.id,
      t.type,
      t.amount.toFixed(8),
      t.reference ?? '',
      t.createdAt.toISOString(),
    ].join(','),
  );

  return [header, ...rows].join('\n');
}
