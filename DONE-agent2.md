# DONE — Agent 2 (Copy-Engine)

**Date:** 2026-04-21
**Branch:** `feat/copy-engine` (worktree: TV-2.0-copy-engine)
**Commit:** `cb416c8`

## Status: WAITING FOR AGENT 1 MIGRATION

Agent 2 (copy-engine) has completed its implementation on `feat/copy-engine`.
Per the Migration Serialization Protocol, Agent 1 must run `prisma migrate dev` for `copy.prisma`
before Agent 2 can safely rebase and remove stubs.

---

## What Was Built

### Controllers (D1)
- `controllers/mtAccountController.ts` — 5 MT account endpoints (create, list, getById, delete, getBalance)
- `controllers/copyRelationController.ts` — 8 copy-relation endpoints (subscribe, activate, pause, resume, close, list, getById, updateRiskCapital)
- `controllers/webhookController.ts` — Equity protector webhook handler (DRAWDOWN_BREACHED, EQUITY_RESTORED, COPY_STOPPED, COPY_STARTED)

### Services (D3-D5)
- `services/balancePollingService.ts` — Polls CopyPro for equity/balance, updates MtAccount (C-10 outside Prisma TX)
- `services/tradeLogWorker.ts` — Polls CopyPro TradeLogs, raw SQL upsert for C-12 deduplication

### Repositories
- `repositories/copyRelationRepository.ts` — Original 10 methods (untouched — clean)
- `repositories/mtAccountRepository.ts` — Added `findAllActive`, `updateBalance` with Decimal conversion
- `repositories/copyRelationRepoExtended.ts` — `markBreachedCopyRelation`, `findActiveCopyRelationsWithCopierId` (standalone functions to avoid TS 5.9 parser edge-cases)
- `repositories/mtAccountExtended.ts` — `findAllActiveMtAccounts`, `updateMtAccountBalance`

### Routes
- `routes/mtAccountRoutes.ts` — 5 MT account routes
- `routes/copyRelationRoutes.ts` — 8 copy-relation routes
- `routes/webhookRoutes.ts` — POST /webhooks/equity-protector
- `routes/index.ts` — Central aggregator registering all copy-engine routes

### Server
- `server.ts` — Wires `registerCopyEngineRoutes`, `startBalancePoller`, `startTradeLogWorker`

### Tests
- `tests/copyRelation.test.ts` — Unit tests for all 8 copy-relation repository methods
- `tests/balancePollingService.test.ts` — Unit tests for balance polling

## Compliance Summary
| Rule | Status |
|------|--------|
| C-02: All money fields as `string` in JSON | ✅ `Decimal` → `string` at boundary |
| C-10: CopyPro calls outside Prisma TX | ✅ All external calls happen before/after DB ops |
| C-11: Idempotency key on all financial mutations | ✅ Stub in place (requires real auth) |
| C-12: Trade dedup via unique(ticket, copyRelationId) | ✅ Raw SQL `ON CONFLICT DO NOTHING` |
| C-30: Audit events on all status transitions | ✅ `prisma.auditLog.create` after DB writes |
| TypeScript strict mode | ✅ 0 errors |

## Build
```bash
cd api && npm run build  # ✅ 0 errors
```

## Next Steps
1. Agent 1 runs `prisma migrate dev` for `copy.prisma` (coordinate via COORDINATION_REQUESTS.md)
2. Agent 2 rebases onto main to pick up generated migration + Prisma client types
3. Agent 2 removes `modules/copy/__stubs__/` and wires real imports
4. Final build pass + push + DONE-agent2.md finalization

## Stub Locations (to be removed after migration)
- `modules/copy/__stubs__/authStub.ts` — Auth guard stub (replace with real auth)
- `modules/copy/__stubs__/configStub.ts` — Env/config stub (replace with real env.ts)
