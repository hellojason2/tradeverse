# CONTRACTS.md — Tradeverse Invariants

> **These are hard rules. If any PR violates a contract, the PR is rejected.**
> **Each contract is binary: it either holds or it doesn't.**
> **Last updated:** 2026-04-20

---

## Financial Correctness

### C-01: Wallet balance must equal Σ(Transaction.amount) for that wallet
```
wallet.balance == SUM(transaction.amount WHERE transaction.walletId = wallet.id)
```
**Enforced by:** `walletService.ts` — every deposit/withdrawal creates a Transaction row AND updates balance in the same operation (not a transaction — sequential but atomic via application logic).
**Verify with:** `SELECT w.balance - SUM(t.amount) FROM Wallet w JOIN Transaction t ON t.walletId = w.id GROUP BY w.id HAVING ABS(diff) > 0.00000001;` must return 0 rows.
**Violation:** Creating a Transaction without updating Wallet.balance, or updating balance without creating a Transaction.

### C-02: No arithmetic on money uses JavaScript number
**Rule:** All monetary values use `Decimal` (Prisma `@db.Decimal(19,8)`). Frontend displays use `toFixed(2)` or `toFixed(8)` depending on context.
**Enforced by:** TypeScript — `Decimal` type from `@prisma/client/runtime/library`. Any `number` type in a money path is a type error.
**Verify with:** grep for `: number` in files touching `wallet`, `trade`, `copyRelation`, `transaction`. Should be zero matches for money fields.
**Allowed types:** `Decimal` (DB), `string` (API serialization), `BigInt` (never — use Decimal).

### C-03: Settlement splits must sum to 1.00 exactly (±1e-9)
**Rule:** `followerPct + traderPct + insuranceInvestorPct + platformPct == 1.00`
**Enforced by:** `configService.ts` validation on config write.
**Verify with:** Unit test in `utils/splits.test.ts` (to be created).
**Violation:** Config seed with incorrect values, or manual DB edit breaking the sum.

### C-04: Risk capital must be within global limits
**Rule:** `minRiskCapital <= riskCapital <= maxRiskCapital` for every subscription.
**Enforced by:** `subscriptionService.ts` on create.
**Verify with:** POST /copy-relations/subscribe with riskCapital = 50 → 400 error. With 100 → 201. With 50001 → 400.
**Violation:** Skipping validation, or reading limits from hardcoded values instead of config.

---

## Copy Engine

### C-10: Never call CopyPro inside a DB transaction
**Rule:** External HTTP calls happen OUTSIDE Prisma transactions.
**Why:** CopyPro latency (200ms-2s) would hold DB connections open, exhausting the pool.
**Enforced by:** Code review. Any `$transaction` block containing `copyProClient.*` is rejected.
**Pattern:**
```typescript
// WRONG
await prisma.$transaction(async (tx) => {
  await tx.copyRelation.create({...});
  await copyProClient.start(...); // ❌ external call in tx
});

// RIGHT
const relation = await prisma.copyRelation.create({...});
await copyProClient.start(...); // ✅ outside tx
```

### C-11: One master per strategy, one slave per master
**Rule:** A Strategy has exactly one master MtAccount. A CopyRelation has exactly one slave MtAccount.
**Enforced by:** `strategyService.ts` on create, `copyRelationService.ts` on subscribe.
**Verify with:** Try to create Strategy with masterAccountId pointing to an account already used as master → 409 error.
**Violation:** Schema allows it (foreign key only), but business logic must reject.

### C-12: Every trade mirrored is deduplicated by (ticket, copyRelationId)
**Rule:** `Trade` table has unique constraint on `(ticket, copyRelationId)`.
**Why:** Polling race conditions or duplicate webhooks could create duplicate trade rows.
**Enforced by:** Prisma schema unique index.
**Verify with:** Try to insert two Trade rows with same ticket + copyRelationId → Prisma unique constraint error.

### C-13: CopyPro callback URL must be HTTPS in production
**Rule:** `equityProtectorUrl` passed to CopyPro must start with `https://` when `NODE_ENV=production`.
**Enforced by:** `copyRelationService.ts` on activation.
**Violation:** Passing `http://` or `localhost` in production.

---

## Config

### C-20: Settlement code reads from entity snapshot columns, never from config.get()
**Rule:** Once a CopyRelation is created, its split percentages are frozen. Settlement uses `copyRelation.followerSplitPctSnapshot`, not `config.get('strategy.split.default.follower_pct')`.
**Enforced by:** Code review. grep for `config.get` in `settlement/`, `subscription/`, `copyRelation/` paths.
**Verify with:** Change CONFIG_CATALOG default split. Existing CopyRelations must still use old values.

### C-21: Every new config key has a default value matching current PRD behavior
**Rule:** When adding a key to CONFIG_CATALOG, the default must reflect the behavior described in the PRD at that moment.
**Enforced by:** PR review. Config additions without PRD reference are rejected.
**Verify with:** `seed.ts` test that all CONFIG_CATALOG keys have non-null defaults.

---

## Data & Audit

### C-30: Every state transition on CopyRelation emits an audit event
**Rule:** When CopyRelation status changes (PENDING → ACTIVE → PAUSED → CLOSED → BREACHED), a row is created in a log table before the update returns.
**Enforced by:** `copyRelationService.ts` — every status change method creates an audit row.
**Verify with:** Query audit log for a CopyRelation. Should have one row per status change.
**Violation:** Direct `prisma.copyRelation.update()` bypassing the service layer.

### C-31: Deleted users' PII is anonymized, financial records retained
**Rule:** On user deletion (soft delete), `email`, `name`, `phone` are hashed/anonymized. Wallet, Transaction, Trade records are retained for 7 years.
**Enforced by:** `userService.ts` (to be created) soft delete method.
**Verify with:** Deleted user's email becomes `deleted-{id}@anonymized.tradeverse`. Their trades still exist.

---

## Frontend

### C-40: All number displays use JetBrains Mono
**Rule:** Prices, balances, percentages, lot sizes, timestamps — anything that is data, not prose — uses `font-mono` (JetBrains Mono).
**Enforced by:** Code review. `@apply font-mono` or `className="font-mono"` on all data elements.
**Verify with:** Visual inspection of any page with prices. All numbers should be monospace.

### C-41: Dark mode is default; light mode must be explicitly opted in
**Rule:** First visit = dark mode. `localStorage.theme === 'light'` required for light. No system preference detection (trading users prefer dark).
**Enforced by:** `app/src/stores/uiStore.ts` initialization.
**Violation:** Using `prefers-color-scheme` to auto-detect.
