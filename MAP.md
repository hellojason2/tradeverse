# MAP.md — Tradeverse 2.0 Code Map

> **Updated by the orchestrator after every merge.**
> **READ THIS before claiming any module is missing or needs to be created.**
> **Last updated:** 2026-04-20

---

## How to use this file

1. Before creating a new module, search this file for the pattern you need.
2. If a similar module exists, extend it instead of creating new.
3. If you MUST create new, add it to this file in the correct section.

---

## Backend Modules

### Foundation (Agent 1)

| File | What it does | Calls | Called by |
|------|-------------|-------|-----------|
| `api/src/server.ts` | Fastify bootstrap, route auto-discovery, middleware wiring | `config/env.ts`, `middleware/auth.ts` | (entry point) |
| `api/src/config/env.ts` | Zod-validated env loader | — | Everything |
| `api/src/config/prisma.ts` | PrismaClient singleton | — | Repositories |
| `api/src/types/errors.ts` | DomainError class (4 codes) | — | Services, middleware |
| `api/src/utils/asyncErrorWrapper.ts` | Catches async errors, maps to HTTP status | `errors.ts` | Routes |
| `api/src/utils/password.ts` | bcryptjs hash/verify | — | `authService.ts` |
| `api/src/services/jwtService.ts` | Sign/verify access + refresh tokens | `config/env.ts` | `authController.ts`, `auth.ts` |
| `api/src/middleware/auth.ts` | Verify Bearer, attach `req.user` | `jwtService.ts` | Routes (via `onRequest`) |
| `api/src/routes/authRoutes.ts` | POST /register, POST /login, POST /refresh | `authController.ts` | `server.ts` (auto-discovered) |
| `api/src/controllers/authController.ts` | Auth orchestration | `authService.ts` | `authRoutes.ts` |
| `api/src/services/authService.ts` | Register, login, refresh logic | `password.ts`, `jwtService.ts`, `userRepository.ts` | `authController.ts` |
| `api/src/repositories/userRepository.ts` | Prisma User queries | `prisma.ts` | `authService.ts` |
| `api/src/services/configService.ts` | Load/save CONFIG_CATALOG values | `configRepository.ts` | Business services |
| `api/src/repositories/configRepository.ts` | Prisma ConfigSetting queries | `prisma.ts` | `configService.ts` |

### Copy Engine (Agent 2)

| File | What it does | Calls | Called by |
|------|-------------|-------|-----------|
| `api/src/services/copyProClient.ts` | Typed REST client for CopyPro API | `fetch` (external) | `mtAccountService.ts`, `copyRelationService.ts` |
| `api/src/services/mtAccountService.ts` | Add/remove MT accounts, poll balance | `copyProClient.ts`, `mtAccountRepository.ts` | `mtAccountController.ts` |
| `api/src/services/copyRelationService.ts` | Subscribe, activate, close, poll trades | `copyProClient.ts`, `copyRelationRepository.ts`, `tradeRepository.ts` | `copyRelationController.ts`, `webhookController.ts` |
| `api/src/controllers/mtAccountController.ts` | MT account CRUD orchestration | `mtAccountService.ts` | `mtAccountRoutes.ts` |
| `api/src/controllers/copyRelationController.ts` | Copier orchestration | `copyRelationService.ts` | `copyRelationRoutes.ts` |
| `api/src/controllers/webhookController.ts` | Equity protector callback handler | `copyRelationService.ts` | `webhookRoutes.ts` |
| `api/src/routes/mtAccountRoutes.ts` | POST/GET/DELETE /api/accounts | `mtAccountController.ts` | `server.ts` |
| `api/src/routes/copyRelationRoutes.ts` | POST /subscribe, /activate, /close, /poll-trades | `copyRelationController.ts` | `server.ts` |
| `api/src/routes/webhookRoutes.ts` | POST /webhooks/equity-protector | `webhookController.ts` | `server.ts` |
| `api/src/repositories/mtAccountRepository.ts` | Prisma MtAccount queries | `prisma.ts` | `mtAccountService.ts` |
| `api/src/repositories/copyRelationRepository.ts` | Prisma CopyRelation queries | `prisma.ts` | `copyRelationService.ts` |
| `api/src/repositories/tradeRepository.ts` | Prisma Trade queries | `prisma.ts` | `copyRelationService.ts`, `tradeStatsService.ts` |

### Business & Wallet (Agent 3)

| File | What it does | Calls | Called by |
|------|-------------|-------|-----------|
| `api/src/services/strategyService.ts` | Strategy CRUD with snapshot splits | `configService.ts`, `strategyRepository.ts` | `strategyController.ts` |
| `api/src/services/subscriptionService.ts` | Risk capital validation, subscription lifecycle | `configService.ts`, `copyRelationService.ts` | `subscriptionController.ts` |
| `api/src/services/walletService.ts` | Balance tracking, deposit, withdrawal | `walletRepository.ts`, `configService.ts` | `walletController.ts` |
| `api/src/services/atlasGoldService.ts` | Insurance pool, coverage, payouts | `insurancePoolRepository.ts`, `configService.ts` | `subscriptionService.ts` |
| `api/src/services/tradeStatsService.ts` | Aggregate trades by strategy/relation | `tradeRepository.ts` | `copyRelationController.ts` |
| `api/src/services/exportService.ts` | CSV export for trades/transactions | `tradeRepository.ts`, `walletRepository.ts` | `managerController.ts` |
| `api/src/services/notificationService.ts` | In-app notifications | `notificationRepository.ts` | `webhookController.ts`, `walletService.ts` |
| `api/src/controllers/strategyController.ts` | Strategy orchestration | `strategyService.ts` | `strategyRoutes.ts` |
| `api/src/controllers/subscriptionController.ts` | Subscription orchestration | `subscriptionService.ts` | `subscriptionRoutes.ts` |
| `api/src/controllers/walletController.ts` | Wallet orchestration | `walletService.ts` | `walletRoutes.ts` |
| `api/src/controllers/notificationController.ts` | Notification list/mark-read | `notificationService.ts` | `notificationRoutes.ts` |
| `api/src/controllers/managerController.ts` | CopyPro manager proxy, admin reports | `copyProClient.ts`, `exportService.ts` | `managerRoutes.ts` |
| `api/src/routes/strategyRoutes.ts` | POST/GET/PUT/DELETE /api/strategies | `strategyController.ts` | `server.ts` |
| `api/src/routes/subscriptionRoutes.ts` | POST /subscribe, /activate, /close | `subscriptionController.ts` | `server.ts` |
| `api/src/routes/walletRoutes.ts` | GET /wallet, POST /deposit, /withdraw, GET /transactions | `walletController.ts` | `server.ts` |
| `api/src/routes/notificationRoutes.ts` | GET /notifications, POST /mark-read | `notificationController.ts` | `server.ts` |
| `api/src/routes/managerRoutes.ts` | GET /manager/users, /manager/copiers, /manager/export | `managerController.ts` | `server.ts` |
| `api/src/repositories/strategyRepository.ts` | Prisma Strategy queries | `prisma.ts` | `strategyService.ts` |
| `api/src/repositories/walletRepository.ts` | Prisma Wallet + Transaction queries | `prisma.ts` | `walletService.ts` |
| `api/src/repositories/insurancePoolRepository.ts` | Prisma InsurancePool queries | `prisma.ts` | `atlasGoldService.ts` |
| `api/src/repositories/notificationRepository.ts` | Prisma Notification queries | `prisma.ts` | `notificationService.ts` |
| `api/src/middleware/admin.ts` | Role-based access control (ADMIN only) | — | Admin routes (via `onRequest`) |

---

## Frontend Modules (Agent 4)

### Pages

| File | Route | What it shows |
|------|-------|--------------|
| `app/src/pages/DashboardPage.tsx` | `/` | Portfolio stats, account overview, quick actions |
| `app/src/pages/AccountsPage.tsx` | `/accounts` | MT account list, add account form, balance polling |
| `app/src/pages/SignalPlazaPage.tsx` | `/strategies` | Strategy discovery cards, subscribe modal |
| `app/src/pages/CopyTradingPage.tsx` | `/copy-trading` | Active copy relations, P&L, trade history |
| `app/src/pages/WalletPage.tsx` | `/wallet` | Balance, deposit/withdraw modals, transactions |
| `app/src/pages/TradeLogsPage.tsx` | `/trade-logs` | Paginated trade history with filters |
| `app/src/pages/SettingsPage.tsx` | `/settings` | Profile, security, preferences, KYC |
| `app/src/pages/AdminPage.tsx` | `/admin` | Manager dashboard, user list, copier overview |

### Components

| File | What it is | Used by |
|------|-----------|---------|
| `app/src/components/ui/Sidebar.tsx` | Fixed nav sidebar | All pages |
| `app/src/components/ui/Topbar.tsx` | Sticky header with search/notifications | All pages |
| `app/src/components/ui/Card.tsx` | Base glassmorphism card | Multiple |
| `app/src/components/ui/StatCard.tsx` | Number + label + trend badge | DashboardPage |
| `app/src/components/ui/Button.tsx` | Base button variants | Multiple |
| `app/src/components/ui/Badge.tsx` | Status/tag badges | Multiple |
| `app/src/components/ui/Input.tsx` | Form inputs with validation | Multiple |
| `app/src/components/ui/Modal.tsx` | Dialog overlay | Multiple |
| `app/src/components/ui/Toast.tsx` | Notification toast | All pages (portal) |
| `app/src/components/ui/Table.tsx` | Data table with sorting | Multiple |
| `app/src/components/signals/StrategyCard.tsx` | Strategy listing card | SignalPlazaPage |
| `app/src/components/trading/PositionList.tsx` | Active copy relation list | CopyTradingPage |
| `app/src/components/trading/TradeHistory.tsx` | Paginated trade log table | CopyTradingPage, TradeLogsPage |
| `app/src/components/wallet/DepositModal.tsx` | Deposit request modal | WalletPage |
| `app/src/components/wallet/WithdrawModal.tsx` | Withdrawal request modal | WalletPage |

### Stores

| File | State |
|------|-------|
| `app/src/stores/authStore.ts` | JWT, user, login/logout, refresh |
| `app/src/stores/mtAccountStore.ts` | Account list, balance polling |
| `app/src/stores/strategyStore.ts` | Strategy list, selected strategy |
| `app/src/stores/copyRelationStore.ts` | Active relations, trade logs |
| `app/src/stores/walletStore.ts` | Balance, transactions |
| `app/src/stores/uiStore.ts` | Theme, sidebar collapsed, toasts |

### Services

| File | Backend API |
|------|------------|
| `app/src/services/auth.ts` | POST /auth/register, /auth/login, /auth/refresh |
| `app/src/services/mtAccount.ts` | POST/GET/DELETE /accounts, POST /accounts/:id/poll-balance |
| `app/src/services/strategy.ts` | GET /strategies, POST /strategies, GET /strategies/:id |
| `app/src/services/copyRelation.ts` | POST /copy-relations/subscribe, /activate, /close, GET /stats |
| `app/src/services/wallet.ts` | GET /wallet, POST /wallet/deposit, /withdraw, GET /transactions |
| `app/src/services/notification.ts` | GET /notifications, POST /notifications/mark-read |

---

## Database Schema

| Model | What it stores | Key relations |
|-------|---------------|---------------|
| `User` | Auth, profile, role | → MtAccount[], CopyRelation[], Wallet |
| `MtAccount` | MT4/MT5 account credentials | → User, CopyRelation (master/slave) |
| `Strategy` | Strategy config, snapshot splits | → CopyRelation[] |
| `CopyRelation` | Subscription state, risk capital, copierId | → User, MtAccount (master+slave), Strategy |
| `Trade` | Individual trade log (polled from CopyPro) | → CopyRelation |
| `Wallet` | User balance | → User, Transaction[] |
| `Transaction` | Deposit/withdrawal audit trail | → Wallet |
| `InsurancePool` | Atlas Gold pool deposits | → User, Strategy |
| `ConfigSetting` | CONFIG_CATALOG rows | — |
| `Notification` | In-app notifications | → User |

---

## Known Gaps / TODOs

- [ ] `api/src/services/exportService.ts` — Prop Firm export path not implemented
- [ ] `app/src/components/chat/ChatInput.tsx` — mentions autocomplete missing
- [ ] `api/src/services/copyRelationService.ts` — batch trade polling (currently single)

---

## Before Creating Any Component or Function

1. Search this file for the pattern you need.
2. If a similar module exists: extend it.
3. If you still need new: add it to this file in the correct section.
4. **Never create a duplicate.** If two files expose similar symbols, flag it here.
