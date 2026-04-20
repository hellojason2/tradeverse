# Tradeverse 2.0 — File Ownership

> **Rule:** Every file has exactly one owner. If you need to change a file outside your ownership, STOP. Write a coordination request in `COORDINATION_REQUESTS.md` instead.
> **Last updated:** 2026-04-20

---

## Worktree Map

| Worktree | Branch | Agent | Owns |
|----------|--------|-------|------|
| `TV-2.0-foundation/` | `feat/foundation` | Agent 1 | Shared types, Prisma schema, server bootstrap, auth, config, env |
| `TV-2.0-copy-engine/` | `feat/copy-engine` | Agent 2 | CopyPro HTTP client, MT account CRUD, copier start/stop, trade log polling, equity webhooks |
| `TV-2.0-business-wallet/` | `feat/business-wallet` | Agent 3 | Strategies, subscriptions, wallet, Atlas Gold, admin routes, notifications, CSV export |
| `TV-2.0-frontend/` | `feat/frontend` | Agent 4 | React pages, components, stores, services, API client wiring, UI implementation |

---

## Backend (`api/`)

### Agent 1 — Foundation (SOLO until types locked)

**Owns:**
- `api/package.json` (initial setup)
- `api/tsconfig.json`
- `api/.env.example`
- `api/.gitignore`
- `api/src/server.ts` (route auto-discovery only)
- `api/src/config/` — env.ts, prisma.ts
- `api/src/types/errors.ts`
- `api/src/utils/asyncErrorWrapper.ts`
- `api/src/utils/password.ts`
- `api/src/services/jwtService.ts`
- `api/src/middleware/auth.ts`
- `api/prisma/schema.prisma` **— NOBODY ELSE WRITES HERE**
- `api/prisma/migrations/` **— NOBODY ELSE WRITES HERE**
- `api/prisma/seed.ts`
- `api/prisma/seed-test.ts`

**Reads but NEVER writes:**
- Any file owned by Agent 2, 3, or 4.

### Agent 2 — Copy Engine

**Owns:**
- `api/src/services/copyProClient.ts`
- `api/src/services/mtAccountService.ts`
- `api/src/services/copyRelationService.ts`
- `api/src/controllers/mtAccountController.ts`
- `api/src/controllers/copyRelationController.ts`
- `api/src/controllers/webhookController.ts`
- `api/src/routes/mtAccountRoutes.ts`
- `api/src/routes/copyRelationRoutes.ts`
- `api/src/routes/webhookRoutes.ts`
- `api/src/repositories/mtAccountRepository.ts`
- `api/src/repositories/copyRelationRepository.ts`
- `api/src/repositories/tradeRepository.ts`

**Reads but NEVER writes:**
- `api/prisma/schema.prisma` (reads for model reference)
- `api/src/types/errors.ts`
- `api/src/config/env.ts`
- `api/src/middleware/auth.ts`

### Agent 3 — Business & Wallet

**Owns:**
- `api/src/services/strategyService.ts`
- `api/src/services/subscriptionService.ts`
- `api/src/services/walletService.ts`
- `api/src/services/atlasGoldService.ts`
- `api/src/services/tradeStatsService.ts`
- `api/src/services/exportService.ts`
- `api/src/services/notificationService.ts`
- `api/src/controllers/strategyController.ts`
- `api/src/controllers/subscriptionController.ts`
- `api/src/controllers/walletController.ts`
- `api/src/controllers/notificationController.ts`
- `api/src/controllers/managerController.ts`
- `api/src/routes/strategyRoutes.ts`
- `api/src/routes/subscriptionRoutes.ts`
- `api/src/routes/walletRoutes.ts`
- `api/src/routes/notificationRoutes.ts`
- `api/src/routes/managerRoutes.ts`
- `api/src/repositories/strategyRepository.ts`
- `api/src/repositories/walletRepository.ts`
- `api/src/repositories/insurancePoolRepository.ts`
- `api/src/repositories/notificationRepository.ts`
- `api/src/middleware/admin.ts`

**Reads but NEVER writes:**
- `api/prisma/schema.prisma` (reads for model reference)
- `api/src/types/errors.ts`
- `api/src/config/env.ts`
- `api/src/middleware/auth.ts`
- `api/src/services/copyProClient.ts` (imports the client)

---

## Frontend (`app/`)

### Agent 4 — Frontend

**Owns:**
- `app/src/pages/*.tsx` (all page components)
- `app/src/components/**/*.tsx` (all UI components)
- `app/src/stores/*.ts` (Zustand stores)
- `app/src/services/*.ts` (frontend API services)
- `app/src/lib/api.ts` (fetch wrapper)
- `app/src/hooks/*.ts` (custom React hooks)
- `app/tailwind.config.ts` (theme extensions)
- `app/src/index.css` (global styles, CSS variables)

**Reads but NEVER writes:**
- `design.md` (reference only)
- `app/vite.config.ts` (reads for aliases)

---

## Shared Infrastructure

### Agent 1 owns, others READ-ONLY:
- `design.md`
- `.agents/skills/tradeverse-dev-standards/SKILL.md`
- `docs/external/copypro-api-documentation.md`
- `docs/external/copypro-integration-architecture.md`
- `docs/blueprint/CONFIG_CATALOG.md`
- `docs/blueprint/BEHAVIOR.md`
- `.claude/TASKS.md`
- `.claude/ralph-state.md`
- `.claude/ralph-spec.md`

### Append-only (all agents may add, none edit existing rows):
- `docs/blueprint/CONFIG_CATALOG.md` — append new config keys only
- `COORDINATION_REQUESTS.md` — append requests only

---

## Shared Files Requiring Coordination

| File | Rule |
|------|------|
| `api/package.json` | Agent 1 owns. If Agent 2/3/4 need a new dependency, add it to `COORDINATION_REQUESTS.md`. |
| `api/src/server.ts` | Agent 1 owns. Route auto-discovery means agents 2/3 never need to touch it. |
| `api/prisma/schema.prisma` | Agent 1 owns. Schema changes are requested via `COORDINATION_REQUESTS.md`. |
| `app/package.json` | Agent 4 owns. |

---

## Coordination Protocol

1. **Need a new type or schema change?** → Write in `COORDINATION_REQUESTS.md`. Tag `@agent1`.
2. **Need a new backend dependency?** → Write in `COORDINATION_REQUESTS.md`. Tag `@agent1`.
3. **Need a new API endpoint from another agent?** → Write in `COORDINATION_REQUESTS.md`. Tag the owner.
4. **Found a bug in another agent's code?** → Write in `COORDINATION_REQUESTS.md`. Tag the owner. Do NOT fix it yourself.

**Never modify a file outside your ownership. Never. The merge conflict you prevent today saves 3 hours tomorrow.**
