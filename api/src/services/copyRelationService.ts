import { Decimal } from '@prisma/client/runtime/library';
import { DomainError } from '../types/errors.js';
import { prisma } from '../config/prisma.js';
import { copyRelationRepository } from '../repositories/copyRelationRepository.js';
import { mtAccountRepository } from '../repositories/mtAccountRepository.js';
import { CopyProClientImpl } from './copyProClient.js';
import { configGet } from '../modules/copy/__stubs__/configStub.js';
import type { AuthenticatedUser } from '../contracts/auth.js';
import type {
  CopyRelation,
  SubscribeRequest,
  UpdateRiskCapitalRequest,
} from '../contracts/routes.js';
import type { CopierPauseReason } from '../contracts/copyPro.js';
import { env } from '../config/env.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function mapDbToApi(relation: {
  id: string;
  followerUserId: string;
  strategyId: string;
  status: string;
  slaveAccountId: string;
  riskCapital: Decimal;
  followerSplitPctSnapshot: Decimal;
  traderSplitPctSnapshot: Decimal;
  insuranceSplitPctSnapshot: Decimal;
  platformSplitPctSnapshot: Decimal;
  activatedAt: Date | null;
  closedAt: Date | null;
  createdAt: Date;
  strategy?: { name: string } | null;
}): CopyRelation {
  return {
    id: relation.id,
    userId: relation.followerUserId,
    strategyId: relation.strategyId,
    strategyName: relation.strategy?.name ?? '',
    slaveAccountId: relation.slaveAccountId,
    status: relation.status as CopyRelation['status'],
    riskCapital: relation.riskCapital.toFixed(8),
    followerSplitPctSnapshot: relation.followerSplitPctSnapshot.toFixed(4),
    traderSplitPctSnapshot: relation.traderSplitPctSnapshot.toFixed(4),
    insuranceSplitPctSnapshot: relation.insuranceSplitPctSnapshot.toFixed(4),
    platformSplitPctSnapshot: relation.platformSplitPctSnapshot.toFixed(4),
    createdAt: relation.createdAt.toISOString(),
    activatedAt: relation.activatedAt?.toISOString() ?? null,
    closedAt: relation.closedAt?.toISOString() ?? null,
  };
}

function createCopyProClientForUser(userKey: string): CopyProClientImpl {
  return new CopyProClientImpl({ userKey });
}

async function writeAuditLog(
  entityId: string,
  action: string,
  before: unknown,
  after: unknown,
  userId?: string,
): Promise<void> {
  await prisma.auditLog.create({
    data: {
      userId: userId ?? null,
      entityType: 'CopyRelation',
      entityId,
      action,
      before: before ? JSON.parse(JSON.stringify(before)) : null,
      after: after ? JSON.parse(JSON.stringify(after)) : null,
    },
  });
}

function getCallbackUrl(): string {
  const host = env.NODE_ENV === 'production'
    ? 'https://api.tradeverse.app'
    : `http://localhost:${env.PORT}`;
  return `${host}/webhooks/equity-protector`;
}

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

export const copyRelationService = {
  async subscribe(
    user: AuthenticatedUser,
    req: SubscribeRequest,
  ): Promise<CopyRelation> {
    // 1. Validate risk capital bounds (C-04)
    const riskCapitalDecimal = new Decimal(req.riskCapital);
    const [minCapital, maxCapital] = await Promise.all([
      configGet('strategy.limits.min_risk_capital'),
      configGet('strategy.limits.max_risk_capital'),
    ]);

    if (riskCapitalDecimal.lt(minCapital) || riskCapitalDecimal.gt(maxCapital)) {
      throw new DomainError(
        'USER_INPUT',
        `riskCapital must be between ${minCapital.toFixed(2)} and ${maxCapital.toFixed(2)}`,
      );
    }

    // 2. Validate strategy exists and is active
    const strategy = await prisma.strategy.findUnique({
      where: { id: req.strategyId },
    });
    if (!strategy) {
      throw new DomainError('USER_INPUT', 'Strategy not found');
    }
    if (strategy.status !== 'ACTIVE' && strategy.status !== 'DRAFT') {
      throw new DomainError('USER_STATE', 'Strategy is not accepting subscriptions');
    }

    // 3. Validate slave account belongs to user
    const slaveAccount = await mtAccountRepository.findById(req.slaveAccountId);
    if (!slaveAccount) {
      throw new DomainError('USER_INPUT', 'Slave account not found');
    }
    if (slaveAccount.userId !== user.id) {
      throw new DomainError('FORBIDDEN', 'Slave account does not belong to user');
    }

    // 4. Validate slave is not already used in active relation (C-11)
    const alreadySlave = await copyRelationRepository.hasActiveOrPendingRelation(req.slaveAccountId);
    if (alreadySlave) {
      throw new DomainError(
        'BUSINESS_RULE',
        'Slave account is already used in an active copy relation',
      );
    }

    // 5. Validate follower count limit
    const maxFollowers = await configGet('strategy.limits.max_followers_per_strategy');
    if (maxFollowers > 0) {
      const currentFollowers = await copyRelationRepository.countActiveByStrategyId(req.strategyId);
      if (currentFollowers >= maxFollowers) {
        throw new DomainError('BUSINESS_RULE', 'Strategy has reached maximum follower count');
      }
    }

    // 6. Read split snapshots from config (frozen at creation per C-20)
    const followerPct = strategy.followerSplitPct;
    const traderPct = new Decimal(1).minus(followerPct); // simplified — Atlas Gold vs traditional
    const insurancePct = new Decimal(0);
    const platformPct = new Decimal(0);

    // 7. Create CopyRelation in DB
    const relation = await copyRelationRepository.create({
      slaveAccountId: req.slaveAccountId,
      strategy: { connect: { id: req.strategyId } },
      followerUserId: user.id,
      status: 'PENDING',
      riskCapital: riskCapitalDecimal,
      followerSplitPctSnapshot: followerPct,
      traderSplitPctSnapshot: traderPct,
      insuranceSplitPctSnapshot: insurancePct,
      platformSplitPctSnapshot: platformPct,
    });

    await writeAuditLog(relation.id, 'SUBSCRIBE', null, { status: 'PENDING' }, user.id);

    return mapDbToApi({ ...relation, strategy: { name: strategy.name } });
  },

  async activate(
    _adminUser: AuthenticatedUser,
    id: string,
  ): Promise<CopyRelation> {
    const relation = await copyRelationRepository.findById(id);
    if (!relation) {
      throw new DomainError('USER_INPUT', 'Copy relation not found');
    }
    if (relation.status !== 'PENDING') {
      throw new DomainError('USER_STATE', 'Copy relation is not in PENDING status');
    }

    const strategy = await prisma.strategy.findUnique({
      where: { id: relation.strategyId },
    });
    if (!strategy) {
      throw new DomainError('SYSTEM_ERROR', 'Strategy not found for copy relation');
    }

    // 1. Fetch master and slave accounts
    const masterAccount = await mtAccountRepository.findById(strategy.masterAccountId);
    const slaveAccount = await mtAccountRepository.findById(relation.slaveAccountId);
    if (!masterAccount || !slaveAccount) {
      throw new DomainError('SYSTEM_ERROR', 'Master or slave account not found');
    }
    if (!masterAccount.copyProAccountId || !slaveAccount.copyProAccountId) {
      throw new DomainError('USER_STATE', 'Accounts are not linked to CopyPro');
    }

    // 2. Start copier in CopyPro (OUTSIDE DB tx per C-10)
    const copyProClient = createCopyProClientForUser(relation.followerUserId);
    const startResult = await copyProClient.startCopierByAccountId({
      masterAccountId: masterAccount.copyProAccountId,
      slaveAccountId: slaveAccount.copyProAccountId,
      riskType: 'BalanceMultiplier',
      riskValue: 1,
    });

    // 3. Set equity protector callback (C-13: HTTPS enforced in production)
    const callbackUrl = getCallbackUrl();
    if (env.NODE_ENV === 'production' && !callbackUrl.startsWith('https://')) {
      throw new DomainError('SYSTEM_ERROR', 'Equity protector callback must be HTTPS in production');
    }
    await copyProClient.updateEquityProtectorCallback({
      accountId: slaveAccount.copyProAccountId,
      callbackUrl,
    });

    // 4. Update CopyRelation with copier ID and activate
    const updated = await copyRelationRepository.update(id, {
      status: 'ACTIVE',
      copyProCopierId: startResult.copierId,
      activatedAt: new Date(),
    });

    await writeAuditLog(
      id,
      'ACTIVATE',
      { status: 'PENDING' },
      { status: 'ACTIVE', copyProCopierId: startResult.copierId },
      relation.followerUserId,
    );

    return mapDbToApi({ ...updated, strategy: { name: strategy.name } });
  },

  async pause(
    user: AuthenticatedUser,
    id: string,
  ): Promise<CopyRelation> {
    const relation = await copyRelationRepository.findById(id);
    if (!relation) {
      throw new DomainError('USER_INPUT', 'Copy relation not found');
    }
    if (relation.followerUserId !== user.id && user.role !== 'ADMIN') {
      throw new DomainError('FORBIDDEN', 'Not authorized to pause this relation');
    }
    if (relation.status !== 'ACTIVE') {
      throw new DomainError('USER_STATE', 'Copy relation is not active');
    }

    if (relation.copyProCopierId) {
      const copyProClient = createCopyProClientForUser(relation.followerUserId);
      await copyProClient.pauseCopier(relation.copyProCopierId, true, 'ByUser');
    }

    const updated = await copyRelationRepository.update(id, {
      status: 'PAUSED',
    });

    await writeAuditLog(
      id,
      'PAUSE',
      { status: 'ACTIVE' },
      { status: 'PAUSED' },
      user.id,
    );

    return mapDbToApi({ ...updated, strategy: relation.strategy });
  },

  async resume(
    user: AuthenticatedUser,
    id: string,
  ): Promise<CopyRelation> {
    const relation = await copyRelationRepository.findById(id);
    if (!relation) {
      throw new DomainError('USER_INPUT', 'Copy relation not found');
    }
    if (relation.followerUserId !== user.id && user.role !== 'ADMIN') {
      throw new DomainError('FORBIDDEN', 'Not authorized to resume this relation');
    }
    if (relation.status !== 'PAUSED') {
      throw new DomainError('USER_STATE', 'Copy relation is not paused');
    }

    if (relation.copyProCopierId) {
      const copyProClient = createCopyProClientForUser(relation.followerUserId);
      await copyProClient.pauseCopier(relation.copyProCopierId, false, 'None');
    }

    const updated = await copyRelationRepository.update(id, {
      status: 'ACTIVE',
    });

    await writeAuditLog(
      id,
      'RESUME',
      { status: 'PAUSED' },
      { status: 'ACTIVE' },
      user.id,
    );

    return mapDbToApi({ ...updated, strategy: relation.strategy });
  },

  async close(
    user: AuthenticatedUser,
    id: string,
    reason?: string,
  ): Promise<CopyRelation> {
    const relation = await copyRelationRepository.findById(id);
    if (!relation) {
      throw new DomainError('USER_INPUT', 'Copy relation not found');
    }
    if (relation.followerUserId !== user.id && user.role !== 'ADMIN') {
      throw new DomainError('FORBIDDEN', 'Not authorized to close this relation');
    }
    if (relation.status === 'CLOSED' || relation.status === 'BREACHED') {
      throw new DomainError('USER_STATE', 'Copy relation is already in final state');
    }

    // Remove copier from CopyPro first (outside tx per C-10)
    if (relation.copyProCopierId) {
      const copyProClient = createCopyProClientForUser(relation.followerUserId);
      try {
        await copyProClient.removeCopier(relation.copyProCopierId, false);
      } catch (err) {
        console.warn('Failed to remove CopyPro copier:', err);
      }
    }

    const updated = await copyRelationRepository.update(id, {
      status: 'CLOSED',
      closedAt: new Date(),
    });

    await writeAuditLog(
      id,
      'CLOSE',
      { status: relation.status },
      { status: 'CLOSED', reason: reason ?? null },
      user.id,
    );

    return mapDbToApi({ ...updated, strategy: relation.strategy });
  },

  async updateRiskCapital(
    user: AuthenticatedUser,
    id: string,
    req: UpdateRiskCapitalRequest,
  ): Promise<CopyRelation> {
    const relation = await copyRelationRepository.findById(id);
    if (!relation) {
      throw new DomainError('USER_INPUT', 'Copy relation not found');
    }
    if (relation.followerUserId !== user.id) {
      throw new DomainError('FORBIDDEN', 'Not authorized to update this relation');
    }
    if (relation.status !== 'PAUSED') {
      throw new DomainError('USER_STATE', 'Risk capital can only be updated on PAUSED relations');
    }

    const riskCapitalDecimal = new Decimal(req.riskCapital);
    const [minCapital, maxCapital] = await Promise.all([
      configGet('strategy.limits.min_risk_capital'),
      configGet('strategy.limits.max_risk_capital'),
    ]);

    if (riskCapitalDecimal.lt(minCapital) || riskCapitalDecimal.gt(maxCapital)) {
      throw new DomainError(
        'USER_INPUT',
        `riskCapital must be between ${minCapital.toFixed(2)} and ${maxCapital.toFixed(2)}`,
      );
    }

    const updated = await copyRelationRepository.update(id, {
      riskCapital: riskCapitalDecimal,
    });

    await writeAuditLog(
      id,
      'UPDATE_RISK_CAPITAL',
      { riskCapital: relation.riskCapital.toFixed(8) },
      { riskCapital: riskCapitalDecimal.toFixed(8) },
      user.id,
    );

    return mapDbToApi({ ...updated, strategy: relation.strategy });
  },

  async listRelations(
    user: AuthenticatedUser,
    opts?: { status?: string; cursor?: string; limit?: number },
  ): Promise<{ items: CopyRelation[]; nextCursor: string | null }> {
    const relations = await copyRelationRepository.findByFollowerUserId(user.id, opts);
    const items = relations.map(mapDbToApi);
    const nextCursor = relations.length === (opts?.limit ?? 50)
      ? relations[relations.length - 1]?.id ?? null
      : null;
    return { items, nextCursor };
  },

  async getRelation(user: AuthenticatedUser, id: string): Promise<CopyRelation> {
    const relation = await copyRelationRepository.findById(id);
    if (!relation) {
      throw new DomainError('USER_INPUT', 'Copy relation not found');
    }
    if (relation.followerUserId !== user.id && user.role !== 'ADMIN') {
      throw new DomainError('FORBIDDEN', 'Not authorized to view this relation');
    }
    return mapDbToApi(relation);
  },
};
