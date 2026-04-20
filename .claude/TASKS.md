# Tradeverse 2.0 — Modular Task Decomposition

> **Purpose:** Small, parallelizable units that multiple agents can execute simultaneously.  
> **Format:** Ralph Loop compatible. Each unit has What, Files, Test, DependsOn.  
> **Total Units:** 48  
> **Parallel Groups:** 8

---

## How to Use This File

1. Pick a unit from any parallel group.
2. Verify all `DependsOn` units are PASSED.
3. Execute the unit (write code → run test).
4. Mark PASSED or FAILED in `ralph-state.md`.
5. Pick another unit from the same or a different parallel group.

**Parallel Group Legend:**
- 🔵 Group A — Backend foundation (no deps)
- 🟢 Group B — Database & config (depends on A)
- 🟡 Group C — Auth & users (depends on A, B)
- 🟠 Group D — CopyPro integration (depends on A, B)
- 🔴 Group E — Business logic: strategies, subscriptions (depends on C, D)
- 🟣 Group F — Wallet & transactions (depends on B, C)
- ⚫ Group G — Frontend API wiring (depends on C)
- ⚪ Group H — Admin, reporting, polish (depends on E, F)

---

## 🔵 Group A — Backend Foundation (Parallel, no deps)

### A1: Project Scaffolding
- **What:** Create Fastify project with TypeScript, ESM, path aliases.
- **Files:**
  - `api/package.json`
  - `api/tsconfig.json`
  - `api/.env.example`
  - `api/.gitignore`
- **Test:** `cd api && npm install && npx tsc --noEmit` returns 0.
- **DependsOn:** —

### A2: Environment Config
- **What:** Zod-validated env loader with sensible defaults.
- **Files:**
  - `api/src/config/env.ts`
- **Test:** `NODE_ENV=test npx tsx -e "import {env} from './src/config/env.js'; console.log(env.PORT)"` prints 3001.
- **DependsOn:** A1

### A3: Error Types & Wrapper
- **What:** DomainError (4 codes) + asyncErrorWrapper for routes.
- **Files:**
  - `api/src/types/errors.ts`
  - `api/src/utils/asyncErrorWrapper.ts`
- **Test:** Unit test: throw DomainError('BUSINESS_RULE','x') → wrapper maps to 422.
- **DependsOn:** A1

### A4: Server Bootstrap
- **What:** Fastify instance with CORS, helmet, rate-limit, health check.
- **Files:**
  - `api/src/server.ts`
  - `api/src/middleware/auth.ts` (stub)
- **Test:** `npm run dev` starts; `curl http://localhost:3001/health` returns `{"status":"ok"}`.
- **DependsOn:** A2, A3

### A5: Prisma Setup
- **What:** PrismaClient singleton, schema file with first 3 models.
- **Files:**
  - `api/prisma/schema.prisma` (User, MtAccount, Strategy)
  - `api/src/config/prisma.ts`
- **Test:** `npx prisma generate` succeeds; `prisma.user.findMany()` returns `[]`.
- **DependsOn:** A1

---

## 🟢 Group B — Database & Config (Parallel, depends on A)

### B1: Full Schema
- **What:** All 11 Prisma models with enums, indexes, relations.
- **Files:**
  - `api/prisma/schema.prisma` (complete)
- **Test:** `npx prisma validate` returns 0.
- **DependsOn:** A5

### B2: Initial Migration
- **What:** Generate first migration, create DB tables.
- **Files:**
  - `api/prisma/migrations/20260420_init/migration.sql`
- **Test:** `npx prisma migrate deploy` applies without errors; `\dt` in psql shows all tables.
- **DependsOn:** B1

### B3: Config Service
- **What:** Load/save CONFIG_CATALOG values; enforce sum groups.
- **Files:**
  - `api/src/services/configService.ts`
  - `api/src/repositories/configRepository.ts`
- **Test:** `configService.get('strategy.limits.min_risk_capital')` returns 100.00.
- **DependsOn:** B2

### B4: Seed Config
- **What:** Seed all 80+ CONFIG_CATALOG rows into `config_settings` table.
- **Files:**
  - `api/prisma/seed.ts`
- **Test:** After seed, `SELECT COUNT(*) FROM config_settings` returns >= 80.
- **DependsOn:** B3

### B5: Seed Test Data
- **What:** Seed test users, strategies, and MT accounts for local dev.
- **Files:**
  - `api/prisma/seed-test.ts`
- **Test:** `npx prisma db seed` creates 1 admin user, 1 trader, 1 follower, 1 strategy.
- **DependsOn:** B2

---

## 🟡 Group C — Auth & Users (Parallel, depends on A, B)

### C1: Password Hashing
- **What:** bcryptjs wrapper for hash/verify.
- **Files:**
  - `api/src/utils/password.ts`
- **Test:** `hash('password')` produces string starting with `$2a$`; `verify('password', hash)` returns true.
- **DependsOn:** A1

### C2: JWT Service
- **What:** Sign/verify access + refresh tokens.
- **Files:**
  - `api/src/services/jwtService.ts`
- **Test:** Sign payload → verify returns original payload; verify with wrong secret throws.
- **DependsOn:** A2

### C3: Register Route
- **What:** POST /api/auth/register — validate, hash, create user.
- **Files:**
  - `api/src/routes/authRoutes.ts`
  - `api/src/controllers/authController.ts`
  - `api/src/services/authService.ts`
  - `api/src/repositories/userRepository.ts`
- **Test:** `curl -X POST -d '{"email":"test@test.com","password":"password123","name":"Test"}' http://localhost:3001/api/auth/register` returns 201 + user object (no passwordHash).
- **DependsOn:** B2, C1

### C4: Login Route
- **What:** POST /api/auth/login — verify password, return JWT pair.
- **Files:**
  - Same files as C3 (extend)
- **Test:** `curl -X POST -d '{"email":"test@test.com","password":"password123"}' http://localhost:3001/api/auth/login` returns 200 + `{token, refreshToken, user}`.
- **DependsOn:** C3

### C5: Auth Middleware
- **What:** Verify Bearer token, attach `req.user`.
- **Files:**
  - `api/src/middleware/auth.ts` (full implementation)
- **Test:** Request with valid token → `req.user` populated; invalid token → 401.
- **DependsOn:** C2, C4

### C6: Refresh Token Route
- **What:** POST /api/auth/refresh — rotate access token.
- **Files:**
  - Extend `authRoutes.ts`, `authService.ts`
- **Test:** `curl -X POST -d '{"refreshToken":"..."}' .../auth/refresh` returns new token.
- **DependsOn:** C4

---

## 🟠 Group D — CopyPro Integration (Parallel, depends on A, B)

### D1: CopyPro HTTP Client
- **What:** Typed REST client for CopyPro API with timeout/circuit breaker.
- **Files:**
  - `api/src/services/copyProClient.ts`
- **Test:** Unit test with nock: `addAccount` mocks 200 → returns `{accountId, apiId}`.
- **DependsOn:** A2

### D2: CopyPro Account Routes
- **What:** CRUD for MT accounts via CopyPro.
- **Files:**
  - `api/src/routes/mtAccountRoutes.ts`
  - `api/src/controllers/mtAccountController.ts`
  - `api/src/services/mtAccountService.ts`
  - `api/src/repositories/mtAccountRepository.ts`
- **Test:** POST `/api/accounts` with valid body → creates row in `mt_accounts` + calls CopyPro mock.
- **DependsOn:** D1, B2, C5

### D3: Balance Polling Service
- **What:** Poll CopyPro `AccountWithSummary` and update local balance.
- **Files:**
  - Extend `mtAccountService.ts`
- **Test:** POST `/api/accounts/:id/poll-balance` → returns `{balance, equity}` + updates DB.
- **DependsOn:** D2

### D4: CopyPro Start/Stop Copier
- **What:** Orchestrate `StartByAccountId`, `Remove`, `UpdateEquityProtector`.
- **Files:**
  - `api/src/services/copyRelationService.ts`
  - `api/src/repositories/copyRelationRepository.ts`
  - `api/src/controllers/copyRelationController.ts`
  - `api/src/routes/copyRelationRoutes.ts`
- **Test:** Full flow: subscribe → activate → copierId saved → equity protector configured.
- **DependsOn:** D1, B2, C5

### D5: Trade Log Polling
- **What:** Poll `TradeLogs` and persist to `trades` table.
- **Files:**
  - Extend `copyRelationService.ts`
  - `api/src/repositories/tradeRepository.ts`
- **Test:** POST `/api/copy-relations/:id/poll-trades` → creates rows in `trades` with correct tickets.
- **DependsOn:** D4

### D6: Equity Protector Webhook
- **What:** Handle CopyPro callback, mark CopyRelation BREACHED.
- **Files:**
  - `api/src/routes/webhookRoutes.ts`
  - `api/src/controllers/webhookController.ts`
- **Test:** POST `/webhooks/equity-protector` with payload → copyRelation.status becomes `BREACHED`.
- **DependsOn:** D4

---

## 🔴 Group E — Business Logic (Parallel, depends on C, D)

### E1: Strategy CRUD
- **What:** Admin/trader creates strategy with snapshot splits.
- **Files:**
  - `api/src/routes/strategyRoutes.ts`
  - `api/src/controllers/strategyController.ts`
  - `api/src/services/strategyService.ts`
  - `api/src/repositories/strategyRepository.ts`
- **Test:** POST `/api/strategies` → creates strategy with followerSplitPct snapshotted from config.
- **DependsOn:** C5, B3

### E2: Subscription Flow
- **What:** Follower subscribes with risk capital, validates limits.
- **Files:**
  - Extend `copyRelationService.ts`, `copyRelationController.ts`, `copyRelationRoutes.ts`
- **Test:** POST `/api/copy-relations/subscribe` → CopyRelation created with `PENDING` + snapshot values.
- **DependsOn:** E1, D2

### E3: Subscription Activation
- **What:** Admin activates → calls CopyPro Start → configures equity protector.
- **Files:**
  - Extend `copyRelationService.ts`, `copyRelationController.ts`
- **Test:** POST `/api/copy-relations/:id/activate` → status `ACTIVE`, copierId set, equity protector callback URL configured.
- **DependsOn:** E2, D4

### E4: Subscription Closure
- **What:** User/admin closes → stops CopyPro copier.
- **Files:**
  - Extend `copyRelationService.ts`
- **Test:** POST `/api/copy-relations/:id/close` → calls CopyPro `/Remove`, status `CLOSED`.
- **DependsOn:** E3

### E5: Trade Statistics
- **What:** Aggregate trades by strategy/copy relation for dashboard.
- **Files:**
  - `api/src/services/tradeStatsService.ts`
  - `api/src/repositories/tradeRepository.ts` (extend)
- **Test:** GET `/api/copy-relations/:id/stats` returns `{totalTrades, winRate, profit, drawdown}`.
- **DependsOn:** D5

### E6: Atlas Gold Insurance Logic
- **What:** Insurance investor deposit, coverage calculation, payout rules.
- **Files:**
  - `api/src/services/atlasGoldService.ts`
  - `api/src/repositories/insurancePoolRepository.ts`
- **Test:** Investor deposits 500 USDT → pool increases, exposure tracked.
- **DependsOn:** B2

---

## 🟣 Group F — Wallet & Transactions (Parallel, depends on B, C)

### F1: Wallet Foundation
- **What:** Wallet per user, balance tracking.
- **Files:**
  - `api/src/services/walletService.ts`
  - `api/src/repositories/walletRepository.ts`
  - `api/src/routes/walletRoutes.ts`
- **Test:** GET `/api/wallet` → returns `{balance, currency}` for authenticated user.
- **DependsOn:** B2, C5

### F2: Deposit Flow
- **What:** Create deposit request, generate address, track confirmation.
- **Files:**
  - Extend `walletService.ts`, `walletRoutes.ts`
- **Test:** POST `/api/wallet/deposit` → creates Transaction row with `PENDING` status.
- **DependsOn:** F1

### F3: Withdrawal Flow
- **What:** Validate balance, fee, KYC, create withdrawal request.
- **Files:**
  - Extend `walletService.ts`, `walletRoutes.ts`
- **Test:** POST `/api/wallet/withdraw` → balance reduced, Transaction `PENDING`, auto-approve if below threshold.
- **DependsOn:** F2

### F4: Transaction History
- **What:** Paginated, filterable transaction list.
- **Files:**
  - `api/src/controllers/walletController.ts`
  - Extend `walletRoutes.ts`
- **Test:** GET `/api/wallet/transactions?page=1&limit=10` → returns paginated list.
- **DependsOn:** F1

---

## ⚫ Group G — Frontend API Wiring (Parallel, depends on C)

### G1: Real API Client
- **What:** Replace mock authService with real fetch wrapper.
- **Files:**
  - `app/src/lib/api.ts`
  - `app/src/services/auth.ts` (rewrite)
- **Test:** Login with real backend → JWT stored, subsequent requests include Bearer header.
- **DependsOn:** C4

### G2: Auth Store Real Integration
- **What:** Zustand auth store calls real API, handles refresh token.
- **Files:**
  - `app/src/stores/authStore.ts` (rewrite)
- **Test:** `useAuthStore.getState().login(email, pass)` → sets token + user; `logout()` clears.
- **DependsOn:** G1

### G3: MT Account UI
- **What:** Add Account form, list accounts, poll balance button.
- **Files:**
  - `app/src/pages/AccountsPage.tsx` (new)
  - `app/src/services/mtAccountService.ts`
  - `app/src/stores/mtAccountStore.ts`
- **Test:** Add account → appears in list; poll balance → balance updates in UI.
- **DependsOn:** G2, D2

### G4: Strategy Discovery UI
- **What:** Signal Plaza page with strategy cards, subscribe modal.
- **Files:**
  - `app/src/pages/SignalPlazaPage.tsx`
  - `app/src/components/signals/StrategyCard.tsx`
  - `app/src/services/strategyService.ts`
- **Test:** Browse strategies → cards render; click subscribe → modal opens with risk capital input.
- **DependsOn:** G2, E1

### G5: Copy Trading Dashboard
- **What:** My copy relations, active trades, P&L display.
- **Files:**
  - `app/src/pages/CopyTradingPage.tsx`
  - `app/src/components/trading/PositionList.tsx`
  - `app/src/services/copyRelationService.ts`
- **Test:** Active copy relation shows master name, risk capital, current P&L.
- **DependsOn:** G4, E3

### G6: Wallet UI
- **What:** Wallet page with deposit/withdraw modals, transaction history.
- **Files:**
  - `app/src/pages/WalletPage.tsx`
  - `app/src/components/wallet/DepositModal.tsx`
  - `app/src/components/wallet/WithdrawModal.tsx`
  - `app/src/services/walletService.ts`
- **Test:** Deposit flow opens modal → creates request; transaction history shows entries.
- **DependsOn:** G2, F1

### G7: Trade History UI
- **What:** Paginated trade logs with filters.
- **Files:**
  - `app/src/components/trading/TradeHistory.tsx`
- **Test:** Trade history loads from `/api/copy-relations/:id/trades`, renders table.
- **DependsOn:** G5, D5

---

## ⚪ Group H — Admin, Reporting, Polish (Parallel, depends on E, F)

### H1: Admin Middleware
- **What:** Role-based access control (ADMIN only routes).
- **Files:**
  - `api/src/middleware/admin.ts`
- **Test:** Non-admin hits `/api/admin/users` → 403; admin → 200.
- **DependsOn:** C5

### H2: Manager Endpoints
- **What:** CopyPro manager endpoints proxied (/Manager/Users, /Manager/Copiers).
- **Files:**
  - `api/src/routes/managerRoutes.ts`
  - `api/src/controllers/managerController.ts`
- **Test:** GET `/api/manager/copiers` returns list of all copiers across users.
- **DependsOn:** H1, D1

### H3: CSV Export
- **What:** Trade reports, transaction reports exportable.
- **Files:**
  - `api/src/services/exportService.ts`
- **Test:** GET `/api/copy-relations/:id/export` returns CSV with trade data.
- **DependsOn:** E5, F4

### H4: Notification System
- **What:** In-app notifications for trades, deposits, breaches.
- **Files:**
  - `api/src/services/notificationService.ts`
  - `api/src/repositories/notificationRepository.ts`
  - `api/src/routes/notificationRoutes.ts`
- **Test:** Equity breach webhook → creates notification row; GET `/api/notifications` returns it.
- **DependsOn:** D6, H1

### H5: Docker Compose
- **What:** One-command startup: Postgres, backend, (optional Mongo for CopyPro).
- **Files:**
  - `docker-compose.yml`
  - `api/Dockerfile`
  - `.dockerignore`
- **Test:** `docker compose up --build` → health checks pass on all services.
- **DependsOn:** A4, B2

### H6: Integration Tests
- **What:** End-to-end flow: register → add account → create strategy → subscribe → activate → poll trades.
- **Files:**
  - `api/tests/integration/fullFlow.test.ts`
- **Test:** `npm run test:integration` passes.
- **DependsOn:** All previous units

---

## Execution Order for Maximum Parallelism

| Wave | Units | Agents |
|------|-------|--------|
| 1 | A1-A5 | 1-3 |
| 2 | B1-B5, C1-C2, D1 | 4-6 |
| 3 | B4-B5, C3-C6, D2-D3, F1, G1-G2 | 6-8 |
| 4 | D4-D6, E1-E3, F2-F4, G3-G5 | 6-8 |
| 5 | E4-E6, G6-G7, H1-H4 | 4-6 |
| 6 | H5-H6 | 1-2 |

**Minimum agents for fastest completion:** 6  
**Recommended:** 8 (2 per wave)

---

## Ralph Loop Integration Notes

To plug this into the existing Ralph Loop:

1. **Update `ralph-state.md` frontmatter:**
   ```yaml
   phase: BUILD
   current_unit: 1
   total_units: 48
   iteration: 0
   max_iterations: 100
   ```

2. **Unit Status table format:**
   ```markdown
   | Unit | Status | Attempts | Notes |
   |------|--------|----------|-------|
   | A1 | PENDING | 0 | |
   | A2 | PENDING | 0 | |
   ...
   ```

3. **When all units PASSED:** set `phase: INTEGRATE`, run H6.

4. **When H6 passes:** set `phase: DELIVER`, output `<promise>SPEC COMPLETE</promise>`.

---

## Files Preserved from Research

These docs are already local and should be referenced by agents:

| File | Purpose |
|------|---------|
| `docs/external/copypro-api-documentation.md` | Complete CopyPro REST API reference |
| `docs/external/copypro-integration-architecture.md` | How Tradeverse orchestrates CopyPro |
| `.agents/skills/tradeverse-dev-standards/SKILL.md` | Coding standards for all agents |
| `docs/blueprint/CONFIG_CATALOG.md` | All configurable values |
| `docs/blueprint/BEHAVIOR.md` | Error taxonomy, user feedback patterns |

