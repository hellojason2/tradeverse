# Tradeverse 2.0 — Coordination Requests

> **How to use this file:** Append your request to the bottom. Tag the owner agent. Do not edit existing entries.
> **When an entry is resolved:** The owner moves it to the "Resolved" section with a date and commit hash.
> **Last updated:** 2026-04-20

---

## Open Requests

| # | Date | From | To | Request | Status |
|---|------|------|----|---------|--------|

---

## Resolved Requests

| # | Date | From | To | Request | Resolution |
|---|------|------|----|---------|------------|

---

## Migration Serialization Protocol

Prisma migrations cannot be parallelized. Agent 1 runs every migration against main. Agents 2 and 3 add models to their fragments, then signal readiness as follows:

1. Agent 2/3 commits the completed fragment changes to their feature branch.
2. Agent 2/3 appends a row to the Open Requests table below tagged `@agent1`:
   `| NEXT | YYYY-MM-DD | @agentN | @agent1 | MIGRATION READY: <domain>.prisma revision <commit-sha>. Changes: <one-line summary>. | OPEN |`
3. Agent 1 (or the orchestrator in daily triage) runs:
   - Merges the fragment via a fast-forward or cherry-pick of the model-only commit(s).
   - Executes `cd api && npx prisma migrate dev --name <feature_name> --schema=prisma/schema`.
   - Commits both the fragment change and the generated migration SQL to main.
   - Pushes main.
   - Marks the request RESOLVED with the migration commit hash.
4. Agents 2/3 rebase their feature branch onto main to pick up the generated migration + regenerated Prisma client types.

**Do NOT** run `prisma migrate dev` from a feature worktree. Only Agent 1 runs migrations. Running parallel migrations creates conflicting migration files that are painful to untangle.

### Example Migration Request Row

| NEXT | 2026-04-21 | @agent2 | @agent1 | MIGRATION READY: copy.prisma revision abc1234. Changes: Add MtAccount, CopyRelation, Trade models. | OPEN |

---

## Template for New Requests

Copy this block to the Open Requests table:

```
| NEXT | YYYY-MM-DD | @agentN | @agentM | DESCRIPTION: What you need, why you need it, where it will be used. Be specific. Include file paths if known. | OPEN |
```

---

## Request Categories

### Schema Change Request
```
| # | YYYY-MM-DD | @agentN | @agent1 |
**Schema Change:** Add `equityProtectorUrl` field to `CopyRelation` model.
**Why:** CopyPro equity protector webhook needs to store the callback URL.
**Usage:** `api/src/services/copyRelationService.ts`, method `activateSubscription()`.
**Suggested Type:** `String?` (optional, set on activation).
```

### Dependency Request
```
| # | YYYY-MM-DD | @agentN | @agent1 |
**Dependency:** Need `bullmq` package for background job queue.
**Why:** Trade log polling should run as a scheduled job, not inline.
**Usage:** `api/src/services/copyRelationService.ts`.
**Version:** `^5.0.0`.
```

### API Contract Request
```
| # | YYYY-MM-DD | @agentN | @agentM |
**API Contract:** Need `POST /api/copy-relations/:id/poll-trades` endpoint.
**Why:** Frontend needs a button to manually trigger trade log polling.
**Expected Shape:** `{ ticket: number, symbol: string, lots: Decimal, profit: Decimal, openTime: DateTime, closeTime: DateTime | null }[]`
**Usage:** `app/src/pages/CopyTradingPage.tsx`.
```

### Type Addition Request
```
| # | YYYY-MM-DD | @agentN | @agent1 |
**Type Addition:** Need `SubscriptionStatus` enum with values: PENDING, ACTIVE, PAUSED, CLOSED, BREACHED.
**Why:** Strategy subscription lifecycle states.
**Usage:** `api/src/services/subscriptionService.ts`, `app/src/components/trading/PositionList.tsx`.
```

| NEXT | 2026-04-21 | @agent2 | @agent1 | Register copy-engine workers (startBalancePoller, startTradeLogWorker) via Fastify plugin during server bootstrap — see api/src/server.ts lines 12-13. Workers are already imported but not called. | OPEN |
| NEXT | 2026-04-21 | @agent2 | @agent1 | Add COPYPRO_WEBHOOK_SECRET to env.ts schema (already added on Agent 2 side): `COPYPRO_WEBHOOK_SECRET: z.string().min(16).optional()` — coordinate final placement in shared env schema. | OPEN |
| NEXT | 2026-04-21 | @agent2 | @agent1 | Add FastifyRequest.user type augmentation (already declared in contracts/auth.ts:135 — verify it's picked up by tsc via server.ts and routes). If not, add `declare module 'fastify' { interface FastifyRequest { user?: AuthenticatedUser } }` to your Fastify plugin. Until confirmed, Agent 2 keeps `as AuthenticatedUser` cast at controller entry point (copyRelationController.ts:41). | OPEN |

---

## Agent 3 Migration Request — 2026-04-21

| NEXT | 2026-04-21 | @agent3 | @agent1 | MIGRATION READY: wallet.prisma revision f97c70f. Changes: 6 models — Wallet, Transaction, Subscription, AtlasGoldHolding, AtlasGoldTransaction, Notification. All money fields use Decimal(19,8) per C-02. Cross-schema uses loose string IDs per OWNERSHIP protocol. TxnType enum already in _shared.prisma. | OPEN |
