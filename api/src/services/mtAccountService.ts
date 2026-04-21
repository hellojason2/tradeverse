import { Decimal } from '@prisma/client/runtime/library';
import { DomainError } from '../types/errors.js';
import { prisma } from '../config/prisma.js';
import { mtAccountRepository } from '../repositories/mtAccountRepository.js';
import { CopyProClientImpl } from './copyProClient.js';
import type { CreateMtAccountRequest, MtAccount } from '../contracts/routes.js';
import type { AuthenticatedUser } from '../contracts/auth.js';
import type { MtPlatform } from '../contracts/copyPro.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function mapDbToApi(account: {
  id: string;
  userId: string;
  accountNumber: string;
  server: string;
  platform: string;
  status: string;
  balance: Decimal | null;
  equity: Decimal | null;
  createdAt: Date;
}): MtAccount {
  return {
    id: account.id,
    userId: account.userId,
    login: account.accountNumber,
    server: account.server,
    platform: account.platform as 'MT4' | 'MT5',
    label: null,
    status: account.status as 'ACTIVE' | 'INACTIVE' | 'ERROR',
    balance: account.balance?.toFixed(8) ?? '0',
    equity: account.equity?.toFixed(8) ?? '0',
    createdAt: account.createdAt.toISOString(),
  };
}

function createCopyProClientForUser(userKey: string): CopyProClientImpl {
  return new CopyProClientImpl({ userKey });
}

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

export const mtAccountService = {
  async bindAccount(
    user: AuthenticatedUser,
    req: CreateMtAccountRequest,
  ): Promise<MtAccount> {
    // 1. Validate platform
    if (req.platform !== 'MT4' && req.platform !== 'MT5') {
      throw new DomainError('USER_INPUT', 'Platform must be MT4 or MT5');
    }

    // 2. Register account in CopyPro (outside any DB tx per C-10)
    const copyProClient = createCopyProClientForUser(user.id);
    const copyProResult = await copyProClient.createAccount({
      name: req.label ?? 'default',
      type: req.platform as MtPlatform,
      user: Number(req.login),
      password: req.password,
      server: req.server,
    });

    // 3. Persist in Tradeverse DB
    const dbAccount = await mtAccountRepository.create({
      userId: user.id,
      accountNumber: req.login,
      broker: req.server, // initial broker name from server
      platform: req.platform as 'MT4' | 'MT5',
      accountType: 'real',
      status: 'ACTIVE',
      copyProAccountId: copyProResult.accountId,
      copyProApiId: copyProResult.apiId ?? null,
      password: req.password,
      server: req.server,
    });

    return mapDbToApi(dbAccount);
  },

  async listAccounts(user: AuthenticatedUser): Promise<MtAccount[]> {
    const accounts = await mtAccountRepository.findByUserId(user.id);
    return accounts.map(mapDbToApi);
  },

  async getAccount(user: AuthenticatedUser, id: string): Promise<MtAccount> {
    const account = await mtAccountRepository.findById(id);
    if (!account) {
      throw new DomainError('USER_INPUT', 'Account not found');
    }
    if (account.userId !== user.id) {
      throw new DomainError('FORBIDDEN', 'Account does not belong to user');
    }
    return mapDbToApi(account);
  },

  async deleteAccount(user: AuthenticatedUser, id: string): Promise<void> {
    const account = await mtAccountRepository.findById(id);
    if (!account) {
      throw new DomainError('USER_INPUT', 'Account not found');
    }
    if (account.userId !== user.id) {
      throw new DomainError('FORBIDDEN', 'Account does not belong to user');
    }

    // Check if account is master in any active strategy (C-11)
    const activeStrategy = await prisma.strategy.findFirst({
      where: {
        masterAccountId: id,
        status: { in: ['ACTIVE', 'PAUSED', 'DRAFT'] },
      },
    });
    if (activeStrategy) {
      throw new DomainError(
        'BUSINESS_RULE',
        'Cannot delete account that is master in an active strategy',
      );
    }

    // Check if account is slave in any active/pending relation
    const activeRelation = await prisma.copyRelation.findFirst({
      where: {
        slaveAccountId: id,
        status: { in: ['PENDING', 'ACTIVE', 'PAUSED'] },
      },
    });
    if (activeRelation) {
      throw new DomainError(
        'BUSINESS_RULE',
        'Cannot delete account that is used in an active copy relation',
      );
    }

    // Remove from CopyPro first (outside tx per C-10)
    if (account.copyProAccountId) {
      const copyProClient = createCopyProClientForUser(user.id);
      try {
        await copyProClient.removeAccount(account.copyProAccountId);
      } catch (err) {
        // Log but continue — DB is source of truth for linkage
        console.warn('Failed to remove CopyPro account:', err);
      }
    }

    await mtAccountRepository.delete(id);
  },

  async getLiveBalance(user: AuthenticatedUser, id: string): Promise<{
    balance: string;
    equity: string;
    margin: string;
    freeMargin: string;
    fetchedAt: string;
  }> {
    const account = await mtAccountRepository.findById(id);
    if (!account) {
      throw new DomainError('USER_INPUT', 'Account not found');
    }
    if (account.userId !== user.id) {
      throw new DomainError('FORBIDDEN', 'Account does not belong to user');
    }
    if (!account.copyProAccountId) {
      throw new DomainError('USER_STATE', 'Account is not linked to CopyPro');
    }

    const copyProClient = createCopyProClientForUser(user.id);
    const summary = await copyProClient.getAccountWithSummary(account.copyProAccountId);

    if (!summary.accountSummary) {
      throw new DomainError('SYSTEM_ERROR', 'Unable to fetch live balance from CopyPro');
    }

    return {
      balance: new Decimal(summary.accountSummary.balance).toFixed(8),
      equity: new Decimal(summary.accountSummary.equity).toFixed(8),
      margin: new Decimal(summary.accountSummary.margin).toFixed(8),
      freeMargin: new Decimal(summary.accountSummary.freeMargin).toFixed(8),
      fetchedAt: new Date().toISOString(),
    };
  },
};
