/**
 * Extended MT account repository methods.
 *
 * @ownership Agent 2 (copy-engine)
 */

import { prisma } from '../config/prisma.js';
import { Decimal } from '@prisma/client/runtime/library';
import type { MtAccount } from '@prisma/client';

/** Returns all ACTIVE MT accounts with a CopyPro account ID. */
export async function findAllActiveMtAccounts(): Promise<MtAccount[]> {
  return prisma.mtAccount.findMany({
    where: { status: 'ACTIVE', copyProAccountId: { not: null } },
  });
}

/** Updates equity and balance for an MT account. */
export async function updateMtAccountBalance(
  id: string,
  data: { equity?: number; balance?: number },
): Promise<MtAccount> {
  return prisma.mtAccount.update({
    where: { id },
    data: {
      equity:
        data.equity !== undefined
          ? new Decimal(data.equity.toString())
          : undefined,
      balance:
        data.balance !== undefined
          ? new Decimal(data.balance.toString())
          : undefined,
    },
  });
}
