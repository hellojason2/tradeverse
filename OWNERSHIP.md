# Tradeverse 2.0 — File Ownership

> **Rule:** Every file has exactly one owner. If you need to change a file outside your ownership, STOP. Write a coordination request in `COORDINATION_REQUESTS.md` instead.
> **Last updated:** 2026-04-20 (Wave 2 parallel restructure)

---

## Parallel Architecture (Wave 2+)

All 4 agents now run in parallel without blocking on each other. Three serialization fixes make this possible:

1. **Prisma schema fragments** — The single `schema.prisma` has been split into per-domain files under `api/prisma/schema/<domain>.prisma`, enabled via the `prismaSchemaFolder` preview feature. Each agent owns exactly one fragment. Agent 1 owns the generator/datasource root, `_shared.prisma` (cross-cutting enums), and `core.prisma` (auth domain models). Agent 2 owns `copy.prisma`. Agent 3 owns `wallet.prisma`. Agents never write into another agent's fragment.

2. **Types-only contracts layer** (`api/src/contracts/*.ts`) — Agent 1 maintains a set of shared TypeScript types, enums, and route-shape definitions that all other agents import but never edit. These files are the single source of truth for cross-domain interfaces. All proposed changes go through `COORDINATION_REQUESTS.md` tagged `@agent1`. Contracts are READ-ONLY for Agents 2, 3, and 4.

3. **Local stubs in `__stubs__/` folders** — Each agent may create stub implementations of types it needs from other domains (using the contract types as the interface). Stubs live under `api/src/modules/<domain>/__stubs__/`. They are development scaffolding only and **NEVER merge to main**. Before merging a feature branch, all stubs must be replaced with real imports from the owning module.

---

## Worktree Map

| Worktree | Branch | Agent | Owns |
|----------|--------|-------|------|
| `TV-2.0-foundation/` | `feat/foundation` | Agent 1 | Shared types, Prisma schema fragments (`_shared`, `core`), server bootstrap, auth, config, env, contracts layer |
| `TV-2.0-copy-engine/` | `feat/copy-engine` | Agent 2 | CopyPro HTTP client, MT account CRUD, copier start/stop, trade log polling, equity webhooks, `copy.prisma` fragment |
| `TV-2.0-business-wallet/` | `feat/business-wallet` | Agent 3 | Strategies, subscriptions, wallet, Atlas Gold, admin routes, notifications, CSV export, `wallet.prisma` fragment |
| `TV-2.0-frontend/` | `feat/frontend` | Agent 4 | React pages, components, stores, services, API client wiring, UI implementation, MSW mocks |

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
- `api/prisma/schema/schema.prisma` (generator + datasource only — Agent 1)
- `api/prisma/schema/_shared.prisma` (cross-cutting enums — Agent 1)
- `api/prisma/schema/core.prisma` (User, Session, Config, AuditLog — Agent 1)
- `api/prisma/migrations/` **— NOBODY ELSE WRITES HERE** — Agent 1 runs all migrations
- `api/prisma/seed.ts`
- `api/prisma/seed-test.ts`
- `api/src/contracts/auth.ts`
- `api/src/contracts/config-catalog.ts`
- `api/src/contracts/copyPro.ts`
- `api/src/contracts/routes.ts`
  _(Agent 1 is primary maintainer; all changes to contracts require a COORDINATION_REQUESTS.md entry describing impact on other agents)_

**Reads but NEVER writes:**
- Any file owned by Agent 2, 3, or 4.

### Agent 2 — Copy Engine

**Owns:**
- `api/prisma/schema/copy.prisma` (MtAccount, Strategy, CopyRelation, Trade — Agent 2)
- `api/src/modules/copy/__stubs__/` (local auth/config stubs — dev only, never merges to main)
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
- `api/src/contracts/*.ts` (READ ONLY — change requests via COORDINATION_REQUESTS.md tagged `@agent1`)
- `api/prisma/schema/core.prisma`, `api/prisma/schema/_shared.prisma` (may read for FK references, never write)
- `api/prisma/schema/wallet.prisma` (may read for FK references, never write)
- `api/src/types/errors.ts`
- `api/src/config/env.ts`
- `api/src/middleware/auth.ts`

### Agent 3 — Business & Wallet

**Owns:**
- `api/prisma/schema/wallet.prisma` (Wallet, Transaction, Subscription, AtlasGoldHolding, AtlasGoldTransaction, Notification — Agent 3)
- `api/src/modules/business/__stubs__/` (local auth/copy stubs — dev only, never merges to main)
- `api/src/modules/wallet/__stubs__/` (local stubs — dev only, never merges to main)
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
- `api/src/contracts/*.ts` (READ ONLY — change requests via COORDINATION_REQUESTS.md tagged `@agent1`)
- `api/prisma/schema/core.prisma`, `api/prisma/schema/_shared.prisma` (may read for FK references, never write)
- `api/prisma/schema/copy.prisma` (may read for FK references, never write)
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
- `app/src/mocks/` (MSW handlers derived from `api/src/contracts/routes.ts`)
- `app/tailwind.config.ts` (theme extensions)
- `app/src/index.css` (global styles, CSS variables)

**Reads but NEVER writes:**
- `design.md` (reference only)
- `app/vite.config.ts` (reads for aliases)
- `api/src/contracts/routes.ts` (derives MSW handler shapes — READ ONLY)

---

## Shared Infrastructure

### Agent 1 owns, others READ-ONLY:
- `design.md`
- `api/src/contracts/auth.ts`
- `api/src/contracts/config-catalog.ts`
- `api/src/contracts/copyPro.ts`
- `api/src/contracts/routes.ts`
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

| File / Pattern | Rule |
|----------------|------|
| `api/package.json` | Agent 1 owns. If Agent 2/3/4 need a new dependency, add it to `COORDINATION_REQUESTS.md`. |
| `api/src/server.ts` | Agent 1 owns. Route auto-discovery means agents 2/3 never need to touch it. |
| `api/prisma/schema/*.prisma` (fragments) | Each agent owns exactly one fragment. To add a FK into another agent's model, file a COORDINATION_REQUESTS.md entry. Migrations run only through Agent 1 — see Migration Serialization Protocol in COORDINATION_REQUESTS.md. |
| `api/src/contracts/*.ts` | Agent 1 owns. All changes require a COORDINATION_REQUESTS.md entry with impact description. Other agents READ ONLY. |
| `app/package.json` | Agent 4 owns. |

---

## Coordination Protocol

1. **Need a new type or schema change?** → Write in `COORDINATION_REQUESTS.md`. Tag `@agent1`.
2. **Need a new backend dependency?** → Write in `COORDINATION_REQUESTS.md`. Tag `@agent1`.
3. **Need a new API endpoint from another agent?** → Write in `COORDINATION_REQUESTS.md`. Tag the owner.
4. **Found a bug in another agent's code?** → Write in `COORDINATION_REQUESTS.md`. Tag the owner. Do NOT fix it yourself.
5. **Schema fragment ready for migration?** → Follow the Migration Serialization Protocol in `COORDINATION_REQUESTS.md`.

**Never modify a file outside your ownership. Never. The merge conflict you prevent today saves 3 hours tomorrow.**
