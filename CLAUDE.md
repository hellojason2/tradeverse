# Tradeverse 2.0 — Agent 2: Copy Engine

## Current Session Status
✅ BUILD CLEAN — TypeScript compiles without errors.

## What's Implemented

### Services
- `src/services/copyProClient.ts` — HTTP client with circuit breaker, timeout, retry
- `src/services/mtAccountService.ts` — MT account CRUD with CopyPro binding
- `src/services/copyRelationService.ts` — full copy relation lifecycle (subscribe/activate/pause/resume/close/risk-capital)

### Repositories
- `src/repositories/mtAccountRepository.ts` — Prisma ORM wrapper for MtAccount
- `src/repositories/copyRelationRepository.ts` — Prisma ORM wrapper for CopyRelation (always includes strategy.name)
- `src/repositories/tradeRepository.ts` — Prisma ORM wrapper for Trade

### Controllers
- `src/controllers/mtAccountController.ts` — 5 endpoints (create/list/get/delete/balance)
- `src/controllers/copyRelationController.ts` — 8 endpoints (subscribe/activate/pause/resume/close/list/getById/risk-capital)
- `src/controllers/webhookController.ts` — equity protector webhook handler

### Routes
- `src/routes/copyRelationRoutes.ts` — mounts all copy relation endpoints
- `src/routes/webhookRoutes.ts` — mounts equity protector webhook
- `src/routes/index.ts` — central aggregator

### Supporting Infrastructure
- `src/types/errors.ts` — DomainError with FORBIDDEN/NOT_FOUND codes + HttpStatusMap
- `src/utils/asyncErrorWrapper.ts` — error boundary for all route handlers
- `src/modules/copy/__stubs__/authStub.ts` — stub requireRole (replace when Agent 1 ships auth)
- `src/modules/copy/__stubs__/configStub.ts` — stub configGet (reads from CONFIG_CATALOG)

### Prisma Schema
- `api/prisma/schema/copy.prisma` — already includes MtAccount, Strategy, CopyRelation, Trade, AuditLog

## What's Pending

### Wave 3 (D3) — Balance Polling Service
- `balancePollingService.ts` — poll CopyPro for equity/balance and update local DB
- Scheduled job (via node-cron or similar) — run on configurable interval
- Updates `MtAccount.balance` and `MtAccount.equity` from CopyPro AccountSummary

### Wave 4 (D5) — Trade Log Polling Worker
- `tradeLogWorker.ts` — poll CopyPro `TradeLogs` endpoint
- Deduplicate by (ticket + copyRelationId) per C-12
- Persist new trades to `Trade` table via tradeRepository.createMany
- Store master ticket, copyRelationId, strategyId from copierId→copyRelationId lookup

### Wave 4 (D6) — Equity Protector Webhook
- Implement full breach/close logic in webhookController
- Update CopyRelation status to BREACHED on DRAWDOWN_BREACHED
- Send user notification (notificationService TBD by Agent 3)

## Critical Rules
1. **Never call CopyPro inside a DB transaction** — external calls happen outside Prisma transactions
2. **Read `COPYPRO_BASE_URL` from `env.ts`** — do not hardcode `copyback3.mrpc.pro`
3. **One master per strategy, one slave per copy relation** — enforced in service logic
4. **Split snapshots are frozen at creation** (C-20) — immutable after CopyRelation.activatedAt

## Auth Status
Auth middleware is stub. All routes pass through. Real auth (`requireRole`) comes from Agent 1's `@middleware/auth.ts`.

## Config Status
Config stub reads from `CONFIG_CATALOG`. Real configService comes from Agent 1.

## Build Verification
```
cd api && npm run build  # must be clean with no TS errors
```

## Branch
`feat/copy-engine` — push when ready for PR.