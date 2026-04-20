# Tradeverse 2.0 — Business Logic PRD

**Document Type:** Product Requirements Document (Business Logic & Rules Engine)
**Version:** 2.2
**Scope:** Backend business rules, state machines, calculations, workflows, validation constraints, and automated processes across five core modules: Copy Trading (TCE, via CopyPro), Atlas Gold Insurance, Prop Firm, Referral System, and Mimity Chat.
**Configurability:** Every numeric and policy value in this PRD is a configurable, not a constant. See §20 and `BEHAVIOR.md §20` for the architectural rule.
**Out of scope:** UI/frontend implementation details (covered in BEHAVIOR.md), infrastructure deployment, DevOps.
**Companion documents:** `BEHAVIOR.md` (user-feedback patterns, configurability rule), `CONFIG_CATALOG.md` (running catalog of every config key).

---

## 1. Scope & Core Principles

### 1.1 Purpose

Single source of truth for the deterministic business rules, calculation methodologies, state transitions, and workflow logic that govern all Tradeverse 2.0 platform operations.

### 1.2 Design Principles

- **Deterministic** — Identical inputs always produce identical outputs. All split calculations are pure functions.
- **Idempotent** — Repeated API calls with the same `Idempotency-Key` must not cause duplicate state changes or financial movements. Critical lesson from production: `OrderSend` (not Safe variants) + idempotency keys prevent duplicate trades.
- **Atomic** — Financial and state-changing operations succeed completely or roll back entirely. Postgres advisory locks on all settlement operations.
- **Traceable** — Every state transition, calculation, and automated action generates a ledger entry and audit log entry. Double-entry accounting throughout.
- **Fail-Safe** — System defaults to restrictive states (funds locked, withdrawals paused, copy halted) on ambiguity or failure.
- **Versioned Rules** — Profit splits, fee tables, and commission rates are versioned. Historical settlements reference the rule version in effect at the time of trade close, not the current version.

### 1.3 Module Map

| Module | Purpose | Section |
|---|---|---|
| **Copy Engine (TCE)** | Mirror signal provider trades via CopyPro (vendor service on mtapi.io) + BalancePoller + EquityProtector | §5 |
| **Atlas Gold Insurance** | Four-party insurance-backed profit-sharing with dynamic splits | §6 |
| **Prop Firm** | Funded trading phase following Trail Mode evaluation | §7 |
| **Referral System** | Multi-tier commission tree | §8 |
| **Mimity Chat** | Multi-channel chat (community + per-strategy rooms + DMs) | §9 |

---

## 2. Core Entity Model

### 2.1 Entity Relationships

| Entity | Key Business Attributes | Relationship Rules |
|---|---|---|
| `User` | `id, role, status, kyc_status, balance, locked_balance, referral_code, referred_by_id` | One User → 0/1 `SignalProvider`, 0/1 `TrailChallenge`, 0/1 `PropFirmAccount`, many `Position`, many `Transaction` |
| `MT5Account` | `id, user_id, broker_name, login, password_enc, server_host, server_port, mtapi_token, copypro_account_id, copypro_user_key, symbol_suffix, status, last_error` | One User → many MT5Accounts. Token refreshed every 55 min. status ∈ `{UNLINKED, VALIDATING, LINKED, DEGRADED, BLOCKED, INVALID}`. |
| `AccountSnapshot` | `id, mt5_account_id, taken_at, balance, equity, margin, free_margin, margin_level, currency, profit, credit, source` | 30-minute poller + WebSocket-driven updates. Immutable history. Indexed on `(mt5_account_id, taken_at DESC)`. |
| `EquityProtectorState` | `id, copy_relation_id, mt5_account_id, peak_equity, current_equity, drawdown_pct, margin_level, last_ws_heartbeat_at, triggered_at, trigger_reason` | One row per active CopyRelation. Persisted every 5s from WS stream. Triggers force-close on threshold breach. |
| `SignalProvider` | `user_id, status, aum, win_rate, max_drawdown, fundraising_target, fundraising_raised, profit_split_rule_version` | AUM computed: `Σ(active CopyRelation.invested_amount)`. Status transitions require admin or system-triggered events. |
| `SignalStrategy` | `id, provider_id, strategy_type, status, profit_split_config, max_lot_size, allowed_symbols[]` | strategy_type ∈ `{traditional, atlas_gold}`. `profit_split_config` is a FK to versioned `SettlementRule`. |
| `SettlementRule` | `id, strategy_id, version, follower_pct, trader_pct, insurance_investor_pct, platform_pct, effective_from, effective_until` | Immutable after creation. Splits must sum to 1.00 (validated). Every Settlement snapshots the rule_id in effect. |
| `CopyRelation` | `id, follower_id, strategy_id, risk_capital, lot_mode, max_drawdown_cap_pct, absolute_loss_cap_pct, copypro_copier_id, status` | lot_mode ∈ `{proportional, fixed_lot, risk_pct}`. `risk_capital` is the amount passed to CopyPro as `fixedMasterBalance`. `copypro_copier_id` returned by `/Start`. Unlocks funds on status=`closed`. |
| `Position` | `user_id, strategy_id, copy_relation_id, type, investment_amount, current_pl, status, locked` | type ∈ `{traditional, atlas_gold}`. locked=true when status ∈ `{fundraising, active}`. |
| `Trade` | `id, mt5_account_id, broker_ticket, symbol_raw, symbol_normalized, side, volume, entry_price, exit_price, pnl, fee, source_trade_id, status` | source_trade_id = parent trade from signal provider (null for originals). Mirrors 1:N (one provider trade → many follower copies). |
| `Settlement` | `id, trade_id, settlement_rule_id, gross_pnl, follower_share, trader_share, insurance_investor_share, platform_share, status` | Created on trade close. Triggers N `LedgerEntry` rows (one per party, double-entry). |
| `LedgerEntry` | `id, settlement_id, user_id, entry_type, debit, credit, balance_after, related_entry_id` | Every money movement = exactly two entries (debit + credit). `related_entry_id` links the pair. Immutable after commit. |
| `InsuranceInvestor` | `user_id, atlas_gold_deposit, coverage_allocated, coverage_available, cumulative_payouts_received, cumulative_coverage_consumed` | Separate role from follower. Subscribes capital to Atlas Gold pool per strategy. |
| `InsuranceCoverage` | `id, copy_relation_id, investor_id, amount_allocated, amount_consumed, status` | Links a specific investor's capital to a specific copy relation. FIFO consumption on loss events. |
| `TrailChallenge` | `user_id, initial_balance, current_balance, peak_balance, level, status, drawdown_current, trade_count, win_count, started_at, expires_at, subscription_tx_id` | Auto-fails if `drawdown_current ≥ 15%` or `expires_at < now()`. On completion → unlocks `PropFirmAccount` eligibility. |
| `PropFirmAccount` | `user_id, source_challenge_id, funded_balance, tier, profit_split_pct, status, total_withdrawn, total_pnl` | Created only on TrailChallenge.status = COMPLETED. Tier-based funded balance + profit split. |
| `Transaction` | `user_id, type, amount, fee, network, tx_hash, status, confirmations, idempotency_key` | Double-entry enforced. PENDING funds are reserved (locked_balance), not available. |
| `Referral` | `referrer_id, referred_id, level (1/2/3), commission_pct, commission_amount, status, event_type, event_id` | 3-tier tree. Triggers on trading fees, subscription payments, deposit campaigns. |
| `Notification` | `user_id, type, category, payload, is_read, channel` | Dedup: identical triggers within 5 min window → single notification. |
| `ChatChannel` | `id, type, scope_id, name, is_public, member_count` | type ∈ `{community, strategy_room, dm}`. strategy_room.scope_id = strategy_id; dm.scope_id = conversation_id. |
| `ChatMessage` | `id, channel_id, user_id, body, edited_at, deleted_at, report_count, is_hidden` | Edit/delete within 15 min. Immutable after. ≥3 reports auto-hides pending review. |

### 2.2 Symbol Normalization Table

Production lesson: every broker has different symbol suffixes. The copy engine normalizes before matching.

| Broker | BTC Symbol | Gold Symbol | Notes |
|---|---|---|---|
| Monaxa | `BTCUSD^` | `XAUUSD^` | Blocks US Hostinger IPs — use FXVM/BeeksFX |
| GTCGlobalSA | `BTCUSD.c` | `XAUUSD.c` | Works from Hostinger |
| GTCGlobalTrade | `BTCUSD.c` | `XAUUSD.c` | Works from Hostinger |
| Exness | `BTCUSDm` | `XAUUSDm` | `m` = mini suffix for retail accounts |
| PUPrime | `BTCUSD` | `XAUUSD` | Blocks US Hostinger IPs — use FXVM/BeeksFX |
| RGGroup | `BTCUSD` | `XAUUSD` | Works from Hostinger |

All incoming and outgoing trades reference **`symbol_normalized`** (e.g., `BTCUSD`). The copy engine resolves broker-specific symbols at `OrderSend` time via the `SymbolMap` service.

---

## 3. Authentication & Authorization

### 3.1 Session & Token Lifecycle

- Access tokens expire after 15 minutes. Refresh tokens expire after 7 days.
- Refresh token rotation: each refresh invalidates the old refresh token and issues a new one.
- Concurrent sessions: max 5 active per user. Exceeding limit revokes oldest.
- **mtapi.io tokens** (separate from platform auth): refreshed every 55 minutes per MT5Account by the BalancePoller and EquityProtector services. Ghost-session cleanup runs on BalancePoller and EquityProtector startup (call `disconnect_all()` before reconnecting). CopyPro manages its own mtapi tokens internally for the trade-mirroring path.

### 3.2 RBAC Matrix

| Action | USER | TRADER | INSURANCE_INVESTOR | ADMIN |
|---|---|---|---|---|
| View own portfolio | ✅ | ✅ | ✅ | ✅ |
| Subscribe to strategy (follower) | ✅ | ✅ | ✅ | ❌ |
| Create/manage signal strategy | ❌ | ✅ | ❌ | override |
| Allocate capital to Atlas Gold pool | ❌ | ❌ | ✅ | ❌ |
| Enter Trail Mode | ✅ | ✅ | ✅ | ❌ |
| Access Prop Firm account | ❌ | ✅ (after challenge pass) | ❌ | ❌ |
| Approve KYC | ❌ | ❌ | ❌ | ✅ |
| Approve withdrawal > $5k | ❌ | ❌ | ❌ | ✅ |
| Modify SettlementRule | ❌ | ❌ | ❌ | ✅ (creates new version) |
| Ban user | ❌ | ❌ | ❌ | ✅ |
| View audit logs | ❌ | ❌ | ❌ | ✅ |

Roles are **additive**: a user can be simultaneously a follower, a trader (signal provider), and an insurance investor. Each role carries its own wallet sub-ledger.

### 3.3 Security Enforcement

- Password: min 12 chars, 1 upper, 1 lower, 1 number, 1 special. Last 5 passwords blocked.
- 2FA required for: withdrawals, password changes, API key generation, MT5Account credential updates, Atlas Gold capital deposits/withdrawals.
- Brute force: 5 failed logins → 15 min lock. 3 failed 2FA → 24h lock.
- Session invalidation: immediate on password change, 2FA disable, or admin ban.

---

## 4. User Accounts & Onboarding

### 4.1 Registration & KYC

- Email must be unique. Referral code validated at signup (invalid → silent fallback to no referral).
- Email verification token: 24h TTL. Verified status required before first deposit.
- KYC workflow: `NOT_STARTED → PENDING → VERIFIED | REJECTED`. VERIFIED unlocks withdrawals > $1k. REJECTED allows retry after 7 days.

### 4.2 Account Status State Machine

```
ACTIVE ──admin suspend──▶ SUSPENDED ──admin ban──▶ BANNED (terminal)
  ▲                          │                        │
  └──admin reinstate─────────┘                        └─▶ PII anonymized after 90d
```

- **SUSPENDED**: retains data, blocks trades/withdrawals/copy, allows view-only login.
- **BANNED**: hard block, sessions invalidated, funds frozen. PII anonymized after 90 days; financial audit records retained 7 years.

### 4.3 Wallet Sub-Ledgers (per role)

A single user may hold three simultaneous sub-balances:
- **Follower wallet** — free capital available to subscribe to strategies
- **Trader wallet** — earnings from their own signal strategy (post-split)
- **Insurance Investor wallet** — capital deposited into Atlas Gold pool + returns earned

Each sub-ledger is an independent `LedgerEntry` namespace. Transfers between sub-ledgers require explicit user action and are themselves logged as double-entry movements.

---

## 5. Copy Engine (TCE — Tradeverse Copy Engine)

### 5.1 Architecture — Three-Layer Model

Tradeverse v2 adopts a **three-layer copy engine architecture** that delegates raw trade mirroring to the CopyPro service (mtapi.io's prebuilt copier product) while retaining full ownership of business logic, balance tracking, and equity protection.

```
┌───────────────────────────────────────────────────────────────────┐
│  LAYER 3 — TRADEVERSE BUSINESS LOGIC (FastAPI, Postgres)          │
│  Owns: Users, Strategies, CopyRelations, Atlas Gold, Ledger,      │
│        Settlements, Prop Firm, Referrals                          │
│  Calls out to Layer 2 to activate/deactivate copiers              │
└───────────────────────────────────────────────────────────────────┘
              │                    │                    │
              ▼                    ▼                    ▼
┌──────────────────┐  ┌──────────────────┐  ┌──────────────────────┐
│  LAYER 2a        │  │  LAYER 2b        │  │  LAYER 2c            │
│  CopyPro         │  │  BalancePoller   │  │  EquityProtector     │
│  (3rd party)     │  │  (Tradeverse)    │  │  (Tradeverse)        │
│                  │  │                  │  │                      │
│ Trade mirroring: │  │ Balance snapshot │  │ Real-time DD monitor │
│  • /Start        │  │  • Every 30 min  │  │  • WSS /OnOrderProfit│
│  • /Remove       │  │  • All linked    │  │  • Per active copy   │
│  • /OpenOrders   │  │    MT5 accounts  │  │  • On breach:        │
│  • /ClosedOrders │  │  • Writes        │  │    → call CopyPro    │
│  • /TradeLogsAll │  │    AccountSnap   │  │      /Remove         │
│  • Symbol map    │  │    to Postgres   │  │    → force close     │
│  • Lot scaling   │  │                  │  │      open positions  │
│  Stores in Mongo │  │ Writes to Postgres│ │ Writes to Postgres   │
└────────┬─────────┘  └────────┬─────────┘  └──────────┬───────────┘
         │                     │                       │
         └─────────────────────┼───────────────────────┘
                               ▼
                  ┌─────────────────────────┐
                  │  LAYER 1 — mtapi.io     │
                  │  bridges (mt4rest,      │
                  │  mt5rest)               │
                  └────────────┬────────────┘
                               ▼
                   Broker MT4/MT5 servers
```

**Rationale:** CopyPro's `/Start` endpoint supports `fixedMasterBalance` — exactly matching Tradeverse's business rule of "slave's committed risk amount drives lot scaling." Using CopyPro eliminates 2–4 weeks of master/slave binding, ticket mapping, reconnect, and symbol-mapping work. Tradeverse retains control of the two pieces CopyPro does not provide (periodic balance snapshots, equity protection) by building them as thin sibling services on raw mtapi endpoints.

### 5.2 Layer 2a — CopyPro Integration

**Deployment:** Docker container on VPS-2, isolated network namespace. Not publicly exposed. Tradeverse backend is the sole caller.

**Base URL (internal):** `http://copyback.internal.tradeverse:5020`

**Key endpoints used by Tradeverse backend:**

| Endpoint | Purpose | Called when |
|---|---|---|
| `GET /SignUp` | Provision a CopyPro userKey (one per Tradeverse user with MT account) | User first links any MT4/MT5 account |
| `GET /AddAccount` | Register a broker account in CopyPro | User links an MT5Account in Tradeverse |
| `GET /Start` | Activate a master→slave copy relation with risk params | User subscribes to a strategy |
| `GET /Remove` | Deactivate a copy relation | User unsubscribes, breach, admin action |
| `GET /OpenOrdersAll` | Reconcile currently-open positions | Nightly audit, on-demand dashboard refresh |
| `GET /ClosedOrdersAll` | Fetch closed trades for settlement | Trade close event (webhook or polling) |
| `GET /TradeLogsAll` | Fetch trade lifecycle logs | Debugging, audit log enrichment |
| `GET /AddSymbolMapping` | Register broker-specific symbol aliases per copier | On CopyRelation create, per broker symbol map |
| `GET /TradeStatsByAccountId` | Pull win rate, drawdown, PnL stats | Dashboard metrics, §5.6 |

**Critical parameter mapping (Tradeverse → CopyPro `/Start`):**

| Tradeverse concept | CopyPro `/Start` parameter | Value semantics |
|---|---|---|
| Signal provider's MT5Account | `masterUser`, `masterPassword`, `masterServer`, `masterType` | The trader's broker credentials (encrypted at rest, decrypted just-in-time for this call) |
| Follower's MT5Account | `slaveUser`, `slavePassword`, `slaveServer`, `slaveType` | The follower's broker credentials |
| CopyRelation.risk_capital | `fixedMasterBalance` | **This is the key insight — we pass the follower's committed risk as the reference balance, so lots scale off `risk_capital` not actual balance** |
| CopyRelation.lot_mode | `riskType`, `riskValue`, `riskMultiply` | Maps to CopyPro's risk calc modes |
| Strategy.copy_sl | `copySL` | Copy stop-loss from master |
| Strategy.copy_tp | `copyTP` | Copy take-profit from master |
| Strategy.copy_pending | `copyPendingOrders` | Whether pending orders get mirrored |

**Tradeverse stores** the returned `copierId` on the CopyRelation row and treats it as the handle for all subsequent CopyPro operations.

### 5.3 Layer 2b — BalancePoller Service

**Requirement:** Every linked MT5Account (whether actively copying or idle) must have its balance snapshotted every **30 minutes**.

**Service design:**

- FastAPI async worker, deployed as sibling container to Tradeverse backend
- Runs as cron-driven async job: every 30 min, batch all `MT5Account.status=LINKED` rows
- For each account: call raw mtapi `GET /AccountSummary?id=<token>` (not via CopyPro — CopyPro doesn't expose this)
- Persist result as `AccountSnapshot` row in Postgres:

```
AccountSnapshot {
  id, mt5_account_id, taken_at (indexed),
  balance, equity, margin, free_margin, margin_level,
  currency, profit, credit,
  source (= 'poller_30m' | 'equity_protector_ws' | 'on_demand')
}
```

- Publishes to Redis pub/sub `balance:updated:{user_id}` for WebSocket fanout to frontend dashboards
- On fetch failure: log, mark MT5Account.last_error, retry with exponential backoff (1m, 5m, 15m)
- After 3 consecutive failures: mark MT5Account.status = `DEGRADED`, emit `behavior.notify.mt5_disconnected` event (see BEHAVIOR.md)

**Rate limit protection:** requests are spread across the 30-min window to avoid thundering-herd against mtapi. If 300 accounts are linked, poller dispatches 10/min for 30 min.

### 5.4 Layer 2c — EquityProtector Service

**Requirement:** Continuous equity monitoring with auto-close on drawdown breach.

**Service design:**

- One persistent WebSocket connection to mtapi `/OnOrderProfit?id=<token>` per MT5Account with active `CopyRelation`
- Receives real-time `ProfitUpdate` messages: `{balance, equity, margin, freeMargin, profit, marginLevel, orders[]}`
- Maintains in-memory state per account:

```
EquityState {
  mt5_account_id,
  risk_capital,           # locked at subscription time
  peak_equity,            # ratcheted upward only
  current_equity,
  drawdown_pct,           # (peak - current) / peak × 100
  max_drawdown_cap_pct,   # from CopyRelation
  margin_level,
  last_update_at
}
```

- Persisted to Postgres `EquityProtectorState` table every 5s (or on state-change-of-concern, whichever sooner)
- **Trigger conditions (per CopyRelation):**

| Condition | Action |
|---|---|
| `margin_level < 150` and `> 110` | Emit `behavior.notify.margin_warning` (user pop-up), log event, no trade action |
| `margin_level < 110` | Emergency mode: call CopyPro `/Remove` + force-close all positions via mtapi `OrderClose` |
| `drawdown_pct >= max_drawdown_cap_pct` | Protector trigger: same emergency close + mark CopyRelation.status = `STOPPED_BY_PROTECTOR` |
| `equity <= risk_capital × (1 - absolute_loss_cap)` | Absolute loss floor hit — emergency close |
| WebSocket disconnected > 60s | Fallback to `/AccountSummary` polling every 10s until reconnect |

- All trigger firings emit a `ProtectorEvent` row for audit and user notification

### 5.5 Linking Account Lifecycle

```
UNLINKED (user has no broker account on file)
  ▼ user enters broker credentials
VALIDATING (Tradeverse calls CopyPro /AddAccount + raw mtapi /Connect test)
  ├──▶ LINKED (credentials valid, token stored, BalancePoller starts tracking)
  └──▶ INVALID (auth failed, emit behavior.notify.broker_login_failed)

LINKED
  ├──▶ DEGRADED (3 consecutive poller failures — see §5.3)
  └──▶ BLOCKED (broker IP restriction, e.g. Monaxa blocks Hostinger IPs)

LINKED + CopyRelation.status=ACTIVE
  → EquityProtector attaches WebSocket
  → CopyPro /Start called
  → trades mirror

LINKED + no active CopyRelation
  → balance polled every 30 min
  → no WebSocket overhead
```

### 5.6 Provider Lifecycle (Signal Provider / Strategy)

```
PENDING (provider applied)
  ▼
APPROVED (admin ok)
  ▼
FUNDRAISING (countdown 14 days, target = configurable)
  ▼                    ▼
TARGET_MET      TARGET_MISSED
  ▼                    ▼
ACTIVE          CLOSED (funds refunded pro-rata within 24h)
  │
  ├──▶ PAUSED (manual, trading halted, positions preserved)
  │      │
  │      └──▶ ACTIVE (resume) or COMPLETED (final)
  │
  └──▶ COMPLETED (manual close, final settlement)
```

### 5.7 Subscription (CopyRelation) Rules

- Min investment: per-strategy `min_risk_capital` (default $100 USDT; e.g., premium strategies may require $2,000+)
- Max investment per user per strategy: $50,000 USDT (configurable per strategy)
- Funds lock immediately on subscription success (→ `locked_balance`)
- `risk_capital` committed at subscription = `fixedMasterBalance` passed to CopyPro `/Start`
- `lot_mode` options (maps to CopyPro risk params):
  - `proportional` → CopyPro `riskType=Proportional` with `fixedMasterBalance=risk_capital`
  - `fixed_lot` → CopyPro `riskType=FixedLot`, `riskValue=<lot>`
  - `risk_pct` → CopyPro `riskType=RiskPercent`, `riskValue=<pct>`

**Validation gate (enforced before calling CopyPro /Start):**

```
if risk_capital < strategy.min_risk_capital:
  reject with BEHAVIOR.block.insufficient_risk_capital  # subscribe button stays disabled
if user.available_balance < risk_capital:
  reject with BEHAVIOR.block.insufficient_balance
if strategy.status != ACTIVE:
  reject with BEHAVIOR.block.strategy_not_active
if user has existing active CopyRelation for this strategy:
  reject with BEHAVIOR.block.duplicate_subscription
if atlas_gold and insurance_coverage_available < required:
  reject with BEHAVIOR.block.insufficient_coverage
```

All rejections emit structured errors consumed by the frontend per BEHAVIOR.md patterns.

### 5.8 Trade Mirroring Flow

**Tradeverse no longer implements low-level mirroring.** CopyPro handles the master→slave loop. Tradeverse wraps it:

```
1. User subscribes → Tradeverse validates gates (§5.7)
2. Tradeverse locks follower capital (LedgerEntry pair)
3. Tradeverse calls CopyPro /AddSymbolMapping for each broker-specific symbol needed
4. Tradeverse calls CopyPro /Start with fixedMasterBalance=risk_capital
5. CopyPro returns copierId → stored on CopyRelation
6. EquityProtector attaches WebSocket to the slave account
7. Trades begin mirroring automatically (CopyPro-managed)
8. Trade close events reach Tradeverse via:
   a. Polling /ClosedOrdersAll (default: every 60s)
   b. OR CopyPro webhook (if enabled in deployment)
9. On each closed trade → Tradeverse runs Settlement (§6 for Atlas Gold, §5.9 for Traditional)
10. On user unsubscribe → Tradeverse calls CopyPro /Remove, releases locked capital
```

**Deduplication:** Tradeverse keeps its own `Trade` table keyed on `(copierId, broker_ticket)` and uses it as an idempotency guard — if `/ClosedOrdersAll` returns a ticket we've already settled, skip.

### 5.9 Traditional Strategy Settlement

- Default split (configurable per strategy, versioned via SettlementRule):
  - 70% follower / 30% trader
  - Platform fee comes from trader's share (not follower's) — trader sees gross 30%, nets 30% minus platform fee
- On trade close:
  1. Fetch closed trade from CopyPro `/ClosedOrdersAll`
  2. Compute `gross_pnl = close_price - open_price ... - broker_fees` (use CopyPro-reported PnL where available)
  3. If `gross_pnl > 0`: apply split via SettlementRule active at trade open time
  4. If `gross_pnl ≤ 0`: entire loss absorbed by follower (traditional strategies have no insurance)
  5. Emit `LedgerEntry` pairs for each party
  6. Emit `behavior.notify.trade_closed` event with breakdown for follower pop-up

### 5.10 AUM & Performance Metrics

- `aum = Σ(CopyRelation.risk_capital WHERE status=active)`
- `win_rate = closed_winning_trades / total_closed_trades` (rolling 90-day window)
- `max_drawdown = max((peak_equity - current_equity) / peak_equity) × 100` over trailing 180 days
- Metrics recomputed nightly via cron; supplemented with on-demand `/TradeStatsByAccountId` calls for live dashboards
- Published only after 90-day minimum track record

### 5.11 CopyPro Operational Invariants

- **CopyPro is treated as a vendor service**, not a Tradeverse-owned component. All interactions go through a single `CopyProClient` wrapper with:
  - Retry with exponential backoff on 5xx
  - Circuit breaker (open after 5 consecutive failures in 60s; half-open after 30s)
  - Timeout: 10s for `/Start`, 5s for read operations
- **Credentials boundary:** broker passwords are encrypted at rest in Tradeverse Postgres (AES-GCM, KMS-managed key). Decrypted only at the moment of a CopyPro call and zeroed from memory after.
- **Mongo (CopyPro's store) is not Tradeverse's source of truth for anything.** If Mongo loses state, Tradeverse rehydrates from Postgres by re-calling `/Start` for active CopyRelations.
- **Latency SLA:** copy fill target < 2s p95 (master fill → slave fill). Measured via `OpenOrdersAll` polling timestamps. Breach → alert, investigate CopyPro health.
- **License compliance:** mtapi commercial license required for production. Trial is 14 days. Legal to verify before launch.

---

## 6. Atlas Gold — Insurance-Backed Strategies

### 6.1 Concept

Atlas Gold is Tradeverse's flagship premium product. A **four-party profit-sharing** model where an insurance pool absorbs a portion of follower losses in exchange for a share of follower profits. Enables conservative users to follow aggressive strategies with a downside floor.

### 6.2 The Four Parties

| Party | Role | Capital at Risk | Earns |
|---|---|---|---|
| **Follower** | Subscribes capital to a strategy | Their investment (minus insurance coverage) | Majority share of profits |
| **Trader** | The signal provider | No capital; runs the strategy | Performance fee share of profits |
| **Insurance Investor** | Allocates capital to Atlas Gold pool | Pool capital (FIFO consumption on follower losses) | Risk-adjusted return from profit share |
| **Platform** | Tradeverse operator | None | Platform fee share |

### 6.3 Dynamic Split Configuration

Every Atlas Gold strategy defines its own split via `SettlementRule`. The generic example split is **60/15/20/5** (Follower / Insurance Investor / Trader / Platform) but all strategies configure their own:

```
SettlementRule {
  strategy_id: <uuid>,
  version: 3,
  follower_pct: 0.60,
  insurance_investor_pct: 0.15,
  trader_pct: 0.20,
  platform_pct: 0.05,
  effective_from: "2026-04-01T00:00:00Z",
  effective_until: null  // open-ended; closed when superseded
}
```

**Validation rules:**
- All four pcts must sum to exactly 1.00 (epsilon 1e-9 for float safety, but stored as `Decimal(10,9)`)
- Platform pct minimum 0.03 (floor)
- Follower pct minimum 0.50 (consumer protection floor)
- New SettlementRule versions are additive — old rules remain in DB, never mutated

### 6.4 Insurance Coverage Allocation

When a follower subscribes to an Atlas Gold strategy:
1. System queries available `InsuranceCoverage` across all active `InsuranceInvestor` accounts (FIFO by deposit date).
2. Allocates coverage equal to `invested_amount × coverage_ratio` where `coverage_ratio` is per-strategy (e.g., 0.30 = covers first 30% of losses).
3. Creates `InsuranceCoverage` rows linking specific investor capital to this specific CopyRelation.
4. `InsuranceInvestor.coverage_available -= allocated_amount`, `coverage_allocated += allocated_amount`.

**Coverage exhaustion rule:** If pool cannot fully cover the requested amount, subscription either (a) fails with `INSUFFICIENT_COVERAGE` error, or (b) proceeds with partial coverage if user opted in during subscription flow.

### 6.5 Settlement On Trade Close (Atlas Gold)

**On profit (`gross_pnl > 0`):**
1. Compute shares from SettlementRule in effect at trade open time.
2. Emit 4 `LedgerEntry` debits (from a platform "gross_profit" clearing account) to:
   - Follower wallet (+follower_share)
   - Trader wallet (+trader_share)
   - Insurance Investor wallet(s) (+insurance_investor_share, distributed pro-rata across all investors who covered this CopyRelation)
   - Platform reserve (+platform_share)
3. Release equivalent `InsuranceCoverage.amount_consumed` back to each investor's `coverage_available` (coverage is only consumed on actual loss events).

**On loss (`gross_pnl < 0`):**
1. Compute covered portion: `covered_loss = min(|gross_pnl|, total_coverage_for_position)`
2. Uncovered portion: `uncovered_loss = |gross_pnl| - covered_loss`
3. Emit LedgerEntry pairs:
   - Follower wallet: -uncovered_loss (follower eats the uncovered portion)
   - Insurance investor wallets: -covered_loss (pro-rata across covering investors)
   - InsuranceCoverage.amount_consumed += covered_loss per investor
4. If `covered_loss == 0` (no coverage available), full loss hits follower.

**On breakeven (`gross_pnl == 0`):** No settlement emitted. Close out locked capital only.

### 6.6 Insurance Investor Return Model

Insurance investors earn by taking risk. Their expected return = `E[follower_profits × insurance_investor_pct] - E[covered_losses]`. Reporting dashboard shows:
- Realized ROI per strategy
- Coverage utilization rate (% of deposited capital currently allocated)
- Loss ratio (cumulative covered losses / cumulative profit share)

### 6.7 Insurance Investor Withdrawal Rules

- Deposit has no lock-up
- Withdrawal constrained to `coverage_available` (capital not currently allocated to active CopyRelations)
- Requested withdrawal > available → queued. Capital released as CopyRelations close and coverage is freed.
- Maximum queue wait: 90 days. If not released by then, admin override forces close of oldest allocations to fulfill (last-resort).

---

## 7. Trail Mode → Prop Firm

### 7.1 Two-Phase Model

```
┌─────────────────────┐         ┌──────────────────────┐
│    TRAIL MODE       │ passes  │    PROP FIRM         │
│    (Evaluation)     │────────▶│    (Funded Phase)    │
│    $99.99 USDT      │         │    Real capital      │
│    Simulated        │         │    Profit split      │
└─────────────────────┘         └──────────────────────┘
```

Trail Mode is the **evaluation phase** (replaces the standalone "Trail Mode" from v1). Passing the evaluation unlocks a Prop Firm funded account.

### 7.2 Trail Mode (Evaluation) — State Machine

```
NOT_STARTED (user not enrolled)
  ▼ user pays $99.99 USDT subscription
CREATED
  ▼ first trade executed
ACTIVE (Level 1)
  ├──▶ LEVEL_1_PASSED (10 trades, ≥60% win rate)
  │      ▼
  │    ACTIVE (Level 2)
  │      ├──▶ COMPLETED (20 trades, ≥65% win rate) → refund issued, PropFirm unlocked
  │      ├──▶ FAILED (drawdown ≥ 15%) → no refund, 7d cooldown
  │      └──▶ EXPIRED (countdown hit 0) → no refund, 7d cooldown
  ├──▶ FAILED (drawdown ≥ 15%)
  └──▶ EXPIRED (countdown hit 0)
```

### 7.3 Trail Mode Rules

| Rule | Value |
|---|---|
| Entry cost | $99.99 USDT (refunded on COMPLETED, forfeit on FAIL/EXPIRE) |
| Initial simulated balance | Configurable per tier (default $10,000) |
| Level 1 pass | 10 trades AND ≥60% win rate |
| Level 2 pass | 20 trades AND ≥65% win rate |
| Max drawdown | 15% (peak-to-current) — auto-fail |
| Countdown | 30 days, **resets on each trade execution** (active traders get indefinite time) |
| Cooldown after failure | 7 days before new Trail Mode purchase |
| Prerequisites | KYC VERIFIED, no active challenge, no active cooldown |
| Expires at | `00:00:00 UTC` on expiry date |

### 7.4 Trail Mode Trade Counting

- Trade count increments on order **close** (filled or cancelled-with-partial-execution).
- Pure cancels (no fill) don't count.
- `win_count` increments when `trade.pnl > 0` at close.
- `win_rate = round(win_count / trade_count, 4)` — computed fresh on each close, stored as percentage to 2 decimals.

### 7.5 Drawdown Monitor

- Peak balance tracked continuously across all challenge trades (including open unrealized).
- `drawdown_current = (peak_balance - current_balance) / peak_balance × 100` (2 decimals)
- Monitored every 10 seconds via cron job.
- **Atomic auto-fail**: if drawdown crosses threshold mid-tick with multiple trades open, the state transition is wrapped in a Postgres advisory lock. Subsequent fill events on the failed challenge are rejected.

### 7.6 Prop Firm (Funded Phase)

Created automatically on `TrailChallenge.status = COMPLETED`:

```
PropFirmAccount {
  user_id: <follower_id>,
  source_challenge_id: <trail_challenge_id>,
  tier: TIER_1 | TIER_2 | TIER_3 | TIER_4,  // based on challenge performance
  funded_balance: <tier-dependent, e.g. $10k / $25k / $50k / $100k>,
  profit_split_pct: 0.80,  // trader's share — configurable per tier
  status: ACTIVE,
  max_drawdown_pct: 0.10,  // stricter than evaluation (10% vs 15%)
  daily_loss_limit_pct: 0.05,
  min_trading_days_per_month: 5
}
```

### 7.7 Prop Firm Profit Split

Default: **80% trader / 20% platform** on real-money profits. Configurable per tier.

Payout cycle:
- Trader can request withdrawal of their profit share every 14 days
- Minimum withdrawal: $100
- First payout: after 30 days of activity
- Scaling plan: after 4 consecutive profitable payout cycles with ≥10% total return, eligible for next tier (2× funded balance)

### 7.8 Prop Firm Rule Violations

| Violation | Action |
|---|---|
| Max drawdown exceeded (10%) | Account BREACHED → closed, no further payouts |
| Daily loss limit exceeded (5%) | Trading locked for 24h, warning issued |
| 3 daily limit warnings in 30 days | Account BREACHED |
| Inactive > 30 days without notice | Account SUSPENDED, require reactivation review |
| Copy trading detected | Account BREACHED (prop capital must be self-traded) |

Breach triggers:
- Immediate position close at market
- Account status → BREACHED (terminal)
- Trader retains already-withdrawn profits
- Platform retains remaining balance
- 30-day cooldown before new Trail Mode purchase

---

## 8. Wallet, Deposits & Withdrawals

### 8.1 Ledger Model

**Strict double-entry accounting.** Every money movement produces exactly two `LedgerEntry` rows: a debit from one account and a credit to another. Every settlement, fee, commission, and transfer is ledger-native.

Accounts hierarchy:
- User wallets (per role sub-ledger)
- Platform reserves (fee pool, clearing accounts, insurance pool)
- External clearing (blockchain pending, blockchain confirmed)

**Invariant:** `Σ(debits) == Σ(credits)` at every commit boundary. Enforced via Postgres constraint + nightly reconciliation job.

### 8.2 Deposit Flow

```
1. User requests deposit → system generates unique address per user/network
2. Blockchain listener detects incoming TX → creates Transaction row, status=PENDING, confirmations=0
3. Each new block → confirmations++
4. When confirmations ≥ network threshold:
   a. status → CONFIRMED (atomic with ledger entries)
   b. LedgerEntry: +amount to user.available_balance, -amount from blockchain_pending
   c. Fee deducted if applicable
5. First deposit triggers welcome bonus eligibility check
```

Network confirmation thresholds:
- ERC20: 12 blocks
- TRC20: 24 blocks
- BEP20: 20 blocks

### 8.3 Withdrawal Flow

```
1. User submits request → status=PENDING
2. System validates:
   - Available balance ≥ amount + fee
   - Daily limit not exceeded
   - 2FA code valid
   - Destination address format valid for network
   - Address whitelisted (or new-address email confirmation flow)
3. Lock funds: available -= amount, locked += amount (LedgerEntry pair)
4. Auto-approve if amount ≤ $1,000 AND 2FA verified
5. Manual approval if amount > $1,000 OR new address OR flagged
6. On approval:
   - status → PROCESSING
   - Broadcast to blockchain
   - On TX confirm: status → CONFIRMED, locked funds released (LedgerEntry: -locked, +external_out)
7. Cancellation allowed only while status=PENDING
```

### 8.4 Limits & Fees

| Parameter | Default | Notes |
|---|---|---|
| Daily withdrawal limit | $50,000 USD equiv | Configurable per KYC tier |
| Min withdrawal | $10 USD equiv | |
| Withdrawal fee (ERC20) | $5 | Deducted from amount |
| Withdrawal fee (TRC20) | $1 | |
| Withdrawal fee (BEP20) | $0.50 | |
| Dual approval threshold | $10,000 | Requires 2 admin signatures |

### 8.5 Transaction State Machine

```
PENDING ──timeout 72h──▶ CANCELLED (deposits only)
   │
   │ user cancels (withdrawals only, before processing)
   ▼
CANCELLED

PENDING ──confirmed──▶ CONFIRMED ──blockchain reverts──▶ FAILED (rare, reconciled manually)

PROCESSING ──broadcast success──▶ CONFIRMED
PROCESSING ──broadcast fail──▶ FAILED (locked funds released)
```

---

## 9. Referral System

### 9.1 Code Generation

- 8-character alphanumeric, URL-safe, uniqueness-enforced per user.
- Regeneration allowed once per 30 days (prevents exploitation).
- Legacy codes remain valid indefinitely when regenerated.

### 9.2 Three-Tier Commission Structure

| Tier | Relationship | Default Commission | Notes |
|---|---|---|---|
| Level 1 | Direct referral | 20% of referred user's platform fees | Configurable per campaign |
| Level 2 | Sub-referral (1 hop) | 10% | |
| Level 3 | Deep (2 hops) | 5% | |

**Example:** User A refers B. User B refers C. C trades and pays $10 platform fee.
- C → platform fee: $10
- B (Level 1 from C): $2.00
- A (Level 2 from C): $1.00
- Platform retains: $6.80 (platform keeps $10 - L1 - L2 - anything above L3)

### 9.3 Trigger Events

Commission accrues on referred user's fee-generating events:
- Trade execution platform fees (traditional + atlas_gold)
- Trail Mode subscription payment ($99.99)
- Prop Firm profit split (platform's 20% portion)
- Deposit bonus campaigns (if active)

### 9.4 Accrual Lifecycle

```
Event occurs → Referral row created (status=PENDING, 7-day dispute window)
  ▼ 7 days elapsed, no dispute
Status → PAID, LedgerEntry credits referrer.available_balance
```

### 9.5 Fraud Prevention

- Self-referral blocked: same IP (last 30 days), device fingerprint, email hash, or phone number → reject.
- Max 3 accounts per household (IP + device combo).
- Clawback window: if referred account is banned within 30 days of referral, all pending commissions canceled; already-paid commissions reversed via LedgerEntry reversal.
- Circular referral detection: graph-walk at signup time; reject if loop detected.

---

## 10. Mimity Chat (Multi-Channel)

### 10.1 Channel Types

| Type | Scope | Access | Purpose |
|---|---|---|---|
| `community` | Global (platform-wide) | All authenticated users | Public discussion, announcements |
| `strategy_room` | Per SignalStrategy | Trader + all active followers of that strategy | Trader communicates with their subscribers |
| `dm` | 1-to-1 | Two users (mutual consent) | Private conversations |

### 10.2 Community Channels

- Created by admins. Examples: `#general`, `#trading-discussion`, `#announcements`, `#support`.
- All users can post (subject to rate limits and moderation).
- Admins can pin messages, close channels, mute users.

### 10.3 Strategy Rooms

- Auto-created on `SignalStrategy` activation.
- Membership = trader (admin of room) + all users with active `CopyRelation` to the strategy.
- Follower leaves room automatically when they close their CopyRelation.
- Trader can post; followers can post only if trader enables follower-posting.
- Trader-only announcements are a distinct post type (pinned, highlighted).

### 10.4 Direct Messages (DMs)

- User A sends DM request to User B → User B must accept before conversation opens.
- Once accepted, bidirectional.
- Blocked users cannot DM. Admin-banned users cannot DM anyone.
- DM history retained 2 years; user-initiated deletion supported.

### 10.5 Message Lifecycle

| State | Transition | Rule |
|---|---|---|
| `active` | Created | Immediately visible to channel members |
| `edited` | User edits within 15 min | Edit timestamp recorded; `edit_history` retained |
| `deleted_soft` | User deletes within 15 min | Hidden from UI, retained for moderation |
| `hidden_auto` | ≥3 reports | Auto-hidden pending admin review |
| `hidden_admin` | Admin action | Hidden, may escalate to user sanction |
| `immutable` | > 15 min old | Cannot be edited or user-deleted |

### 10.6 Moderation Actions

| Action | Trigger | Effect |
|---|---|---|
| Warn | Admin manual | User receives notification; logged |
| Mute (short) | Admin manual OR auto on rate-limit breach | 24h — cannot post, can read |
| Mute (long) | Admin manual | 7 days — cannot post, can read |
| Mute (permanent) | Admin manual | Cannot post until admin unmutes |
| Ban | §4.2 account ban | Cannot access chat at all |

### 10.7 Rate Limits

- **Normal users:** 10 messages/minute, 50/hour per channel.
- **Traders in their own strategy room:** 30 messages/minute, 200/hour.
- **DMs:** 30 messages/minute between a given pair.
- Breach → temporary 1-hour mute in affected channel (auto).

### 10.8 Content Safety

- Profanity filter (toggleable per channel).
- Link detection: external links require user trust score ≥ threshold OR admin approval for community channels.
- Phone number / email PII detection: auto-redact in community channels, allowed in DMs.
- No financial advice disclaimer auto-injected in community channels on first post per day.

---

## 11. Financial & Trading Calculation Engine

### 11.1 Core Formulas

| Calculation | Formula | Precision |
|---|---|---|
| Win rate | `(win_count / trade_count) × 100` | 2 decimals |
| Max drawdown | `((peak_balance - trough_balance) / peak_balance) × 100` | 2 decimals |
| Commission | `fee_amount × commission_pct` | 8 decimals (crypto) |
| Traditional split | `gross_pnl × SettlementRule.party_pct` per party | 8 decimals |
| Atlas Gold split | Same as Traditional, over 4 parties (follower/trader/investor/platform) | 8 decimals |
| Insurance coverage consumed | `min(\|gross_loss\|, allocated_coverage)` | 8 decimals |
| Net withdrawal | `gross_amount - network_fee - platform_fee` | 2 fiat / 8 crypto |
| P/L percentage | `((exit_value - entry_value) / entry_value) × 100` | 2 decimals |

### 11.2 Precision & Rounding

- All monetary values stored as `Decimal(20,8)` in Postgres.
- **No floating-point arithmetic anywhere in settlement path.** Use `decimal.Decimal` in Python, `dinero.js` or `decimal.js` in TypeScript.
- UI display rounds: HALF_UP to 2 decimals (fiat) or 6-8 decimals (crypto).
- Ledger entries: TRUNCATE (never round up) to prevent creating money.
- Split sum verification: `Σ(party_shares) == gross_pnl` (exact equality required; any residual from rounding goes to platform_share).

### 11.3 Fee Hierarchy (Applied In Order)

1. Network fee (blockchain) — deducted from withdrawal gross
2. Platform trading fee (maker/taker, 0.1%/0.15% default, configurable) — deducted from trade proceeds
3. Profit split (traditional: 70/30 default; atlas_gold: per-strategy SettlementRule)
4. Referral commission — paid from platform fee pool, never from follower's principal

**Insufficient balance rule:** if any step fails the balance check, the entire transaction rejects and compensating entries reverse any partial movements.

### 11.4 Idempotency

All money-moving endpoints **require** `Idempotency-Key` header (UUIDv4). Keys stored in Redis for 24h with response cached. Duplicate key → return cached response, no state change. Key expiration → treated as new request.

Mandatory endpoints:
- `POST /deposits`
- `POST /withdrawals`
- `POST /copy-relations` (subscription)
- `POST /atlas-gold/allocate-capital`
- `POST /trail-mode/enroll`
- `POST /prop-firm/request-payout`
- `POST /trades` (internal copy-engine calls)

---

## 12. Automated Processes & Cron Jobs

| Job | Frequency | Logic |
|---|---|---|
| Drawdown Monitor (Trail) | Every 10s | Recalculate peak/current for active challenges. Auto-fail if threshold breached (advisory-locked transition). |
| Drawdown Monitor (Prop) | Every 10s | Same as Trail but stricter 10% threshold. On breach → BREACHED state. |
| Trail Countdown | Every 60s | Check `expires_at` for active challenges. Transition to EXPIRED if passed. |
| mtapi Token Refresh | Every 55 min | Refresh mtapi.io tokens for all active MT5Accounts. Log failures for manual re-auth. |
| BalancePoller Run | Every 30 min | For all MT5Accounts.status=LINKED, call `/AccountSummary` → write `AccountSnapshot` row + pub/sub broadcast. Spread across the window to avoid thundering herd. |
| EquityProtector Heartbeat | Every 30s | Verify WebSocket connection to `/OnOrderProfit` for each active CopyRelation. Reconnect if stale. Fallback to `/AccountSummary` polling at 10s if WS down > 60s. |
| Ghost Session Cleanup | On BalancePoller/EquityProtector startup | Call `disconnect_all()` before establishing new sessions. |
| CopyPro Closed Orders Sync | Every 60s | Poll `/ClosedOrdersAll` for each active copier. For new ticket: run Settlement. Deduplicate via `Trade` table idempotency. |
| CopyPro Health Check | Every 60s | Ping CopyPro `/Headers` endpoint. On 3 consecutive fails → trip circuit breaker, mark CopyPro status=DEGRADED, alert admin. |
| Deposit Confirmation Poller | Block polling per network | Check pending transactions against blockchain. Update confirmations. |
| Commission Payout | Daily 00:00 UTC | Move PENDING commissions > 7 days old to PAID. Emit LedgerEntry pairs. |
| Prop Firm Payout Eligibility | Daily 00:00 UTC | Check active Prop accounts for 14-day payout cycle eligibility. |
| Streak Reset | Daily 00:00 UTC | Check last-login per user. Reset streak if gap > 1 day. |
| Notification Digest | Every 15 min | Batch non-critical notifications. Send email digest per user opted-in. |
| Ledger Reconciliation | Nightly | Verify `Σ(debits) == Σ(credits)` across entire ledger. Alert on any discrepancy. |
| Strategy Metrics Recompute | Nightly | Recompute win_rate, max_drawdown, Sharpe per strategy over trailing windows. |
| Insurance Coverage Audit | Nightly | Verify `Σ(InsuranceCoverage.amount_allocated) ≤ Σ(InsuranceInvestor.atlas_gold_deposit)`. |
| Expired Order Cleanup | Every 10 min | Cancel limit orders > 30 days old. Release locked funds. |
| Chat Rate Limit Reset | Every 1 min | Decay rate-limit counters per user per channel. |

---

## 13. Event-Driven Triggers

| Event | Triggers |
|---|---|
| `trade.executed` | Update Position P/L, emit WebSocket notification, accrue referral commission, update strategy metrics |
| `trade.closed` | Compute Settlement (traditional or atlas_gold), emit LedgerEntry pairs, update coverage (if applicable), notify all parties |
| `deposit.confirmed` | Update available_balance, trigger welcome bonus if first deposit, notify user |
| `withdrawal.approved` | Lock funds, broadcast blockchain TX, notify user |
| `challenge.completed` | Issue $99.99 refund, create PropFirmAccount, send congratulations |
| `challenge.failed` / `challenge.expired` | Notify user, archive challenge, apply 7-day cooldown |
| `prop_firm.breached` | Force-close positions, mark BREACHED, notify user |
| `prop_firm.payout_requested` | Validate eligibility, trigger manual admin review if > $5k |
| `insurance.coverage_exhausted` | Notify affected followers, prevent new subscriptions to underfunded strategies |
| `user.banned` | Invalidate sessions, freeze balances, clawback recent referral commissions, archive PII after 90d |
| `strategy.settlement_rule_changed` | New SettlementRule version created; takes effect for new trades only (existing open positions use old version) |
| `chat.message.reported` (3rd report) | Auto-hide message, queue for admin review |

---

## 14. Validation & Business Rules Reference

### 14.1 Subscription & Copy Trading

- `invested_amount` must be ≥ $100 and ≤ $50,000 USD equiv
- Strategy must be in status ACTIVE
- User's available balance must be ≥ `invested_amount`
- For Atlas Gold: available insurance coverage must satisfy the strategy's `coverage_ratio`, OR user explicitly opts into partial coverage
- User cannot subscribe to same strategy twice (existing active CopyRelation must be closed first)

### 14.2 Atlas Gold Capital Allocation (Insurance Investor)

- Minimum deposit: $500 USD equiv
- Maximum single investor exposure per strategy: 20% of strategy's `fundraising_target` (concentration limit)
- Global investor exposure cap: 30% of platform's total Atlas Gold pool (prevents pool monopolization)

### 14.3 Trail Mode

- KYC VERIFIED required
- No active challenge (status NOT in `{ACTIVE, LEVEL_1_PASSED}`)
- No active cooldown (no failed/expired challenge within last 7 days)
- Subscription payment of $99.99 USDT must settle before challenge activates

### 14.4 Prop Firm

- Source `TrailChallenge.status` must be COMPLETED
- No active Prop account (one-per-user rule; must breach or voluntarily close before new)
- Must accept Prop Firm Terms (separate agreement, signed digitally)
- Withdrawal requests require: account age ≥ 30 days, cycle ≥ 14 days since last payout, min $100

### 14.5 Password & 2FA

- Password: min 12 chars, 1 upper, 1 lower, 1 number, 1 special. Cannot match last 5 passwords.
- 2FA code: 30-second window with ±1 period tolerance (90s total acceptance).
- Recovery codes: 10 single-use. Regeneration invalidates old codes.

### 14.6 Referral

- Referral code must exist and belong to active (non-banned) user.
- Referrer ≠ referred (self-referral blocked).
- Referrer and referred must not share: IP (30-day window), device fingerprint, email hash, phone.
- Max 3 accounts per household.

### 14.7 Chat

- Message length: 1-4000 chars for community/strategy, 1-10000 for DMs.
- Link posting: trust score ≥ threshold (based on account age + KYC status) for community channels.
- DM request: max 10 pending outbound requests at a time.

---

## 15. Concurrency Control

### 15.1 Postgres Advisory Locks

Used for critical sections:
- Trail Mode drawdown auto-fail (prevents race between multiple fills and the state transition)
- Settlement emission (prevents double-settlement on same trade)
- Atlas Gold coverage allocation (prevents over-allocation when multiple subscriptions race)
- Prop Firm payout eligibility check (prevents double-payout in same cycle)
- Withdrawal approval (prevents double-broadcast)

Lock key convention: `hashtext('namespace') | entity_id`. Always acquired in consistent order across code paths to prevent deadlocks.

### 15.2 Optimistic Locking

Used for high-volume, low-contention updates:
- User balance updates (version column)
- Strategy AUM updates
- Chat message reaction counters

Retry up to 3 times with exponential backoff. Fail hard after 3.

### 15.3 Queue-Based Processing

- Trade execution per (strategy_id, symbol) pair → FIFO queue (prevents reordering)
- Notification delivery → work queue with per-user throttling
- Commission payout → batch queue, processed in daily cron

---

## 16. Error Handling & Recovery

### 16.1 Failure States

| Scenario | System Behavior | Recovery |
|---|---|---|
| mtapi.io outage | BalancePoller + EquityProtector mark affected MT5Accounts as `DEGRADED`. New trade mirrors paused via CopyPro `/Remove`. Existing open trades monitored via last-known state. | Auto-retry token refresh + websocket reconnect. User notified if > 5 min. Escalate to admin if > 30 min. |
| CopyPro outage | Circuit breaker trips after 5 fails in 60s. Tradeverse blocks new subscriptions (behavior.notify.copy_engine_maintenance). Existing copiers continue running inside CopyPro independently. | Half-open probe after 30s. On recovery, resume. If > 30 min, freeze all copy subscriptions, alert on-call. |
| Mongo (CopyPro store) corruption | Not Tradeverse's source of truth. Loss event: delete Mongo, re-seed by iterating active CopyRelations in Postgres and re-calling `/Start` for each. | Runbook in ops/mongo-recovery.md. Target RTO: 15 min. |
| Broker IP blocked | Mark MT5Account as `BLOCKED`. Prompt user to re-add via different VPN/proxy. | Manual user action. Platform offers FXVM/BeeksFX VPN recommendation. |
| Double trade mirror (same source_trade_id) | Idempotency key catches. Second attempt returns cached response, no new order. | Automatic. Log event for audit. |
| Blockchain reorg | Deposit tx reverted to PENDING, confirmations reset. User notified. | Automatic; blockchain listener handles reorgs natively. |
| Settlement computation fails | Trade marked SETTLEMENT_PENDING. No ledger entries emitted. Alert admin. | Manual review; rerun settlement job once fixed. |
| Insurance coverage underflow | Reject subscription with INSUFFICIENT_COVERAGE. Prompt user to retry or opt into partial. | User action. |
| Two followers race for last coverage slot | Advisory lock serializes. Loser gets INSUFFICIENT_COVERAGE. | Automatic. |
| Refund on challenge completion fails (platform insufficient USDT) | Challenge stays in COMPLETED state. Refund queued. Alert admin. | Admin tops up platform wallet; scheduled job retries. |
| Prop Firm breach + open positions | Close all positions at market (emergency close). Mark BREACHED. | Automatic. |
| WebSocket disconnect (user-facing) | Client reconnects with exponential backoff. Server replays missed events using last_event_id. | Automatic. |

### 16.2 Compensation (Saga Pattern)

Multi-step workflows use sagas with compensating actions:

**Example: Subscribe to Atlas Gold strategy**
1. Lock follower capital → `unlock_capital()` compensation
2. Allocate insurance coverage → `release_coverage()` compensation
3. Create CopyRelation → `cancel_copy_relation()` compensation
4. Notify trader → (no compensation needed; idempotent notify)

If step 3 fails, compensations 2 and 1 run in reverse order. Every compensation is a LedgerEntry (undo = new entry, never mutation).

### 16.3 Ledger Reconciliation

- Nightly job: `Σ(debits) == Σ(credits)` across entire ledger; page admin on any discrepancy.
- Per-user sub-ledger check: `user.balance == Σ(LedgerEntry WHERE user_id = u)` for all users.
- Atlas Gold pool check: `Σ(InsuranceInvestor.atlas_gold_deposit) == Σ(LedgerEntry for insurance pool account)`.
- Any break = page on-call + freeze withdrawals until resolved.

---

## 17. Audit & Compliance

### 17.1 Audit Log

Every state-changing action generates an `AuditLog` entry:
```
{
  timestamp, actor_id, actor_role, action, entity_type, entity_id,
  before_state (JSONB), after_state (JSONB),
  ip_address, user_agent, request_id, idempotency_key
}
```
Immutable append-only table. Retention: 7 years. Real-time stream to SIEM.

### 17.2 Data Retention

- Active user data: indefinite
- Banned user PII: anonymized after 90 days; financial audit records retained 7 years
- Chat messages: 2 years; user-deletion request anonymizes content, retains metadata for audit
- Blockchain TX records: permanent
- Right-to-erasure: 30-day processing window, excludes financial + audit records (regulatory)

### 17.3 Regulatory Alignment

- KYC thresholds aligned to FATF Travel Rule (> $1k requires VERIFIED; > $10k triggers enhanced review)
- AML monitoring: structuring detection (repeated deposits just under $10k), rapid in/out patterns, blacklist sanctions check on addresses
- 1099-equivalent reporting for referral commissions (jurisdictional export available to admins)
- Trail Mode refund explicitly classified as **service reversal**, not gambling payout (legal distinction)
- Atlas Gold insurance is **profit-sharing**, not regulated insurance product — no insurance license required; clearly disclosed to users

---

## 18. Edge Case Matrix

| Scenario | Expected Behavior |
|---|---|
| User subscribes to strategy, then requests withdrawal | Withdrawal accepts only the non-locked portion. Locked balance unavailable until CopyRelation closes. |
| Signal provider places trade, but follower has insufficient margin | Skip that follower's mirror, log event, notify follower. Other followers' mirrors proceed. |
| Two trades execute simultaneously, pushing Trail drawdown past 15% | Advisory lock serializes. First trade stands. Second trade's fill still recorded but challenge transitions to FAILED atomically after. |
| Referral chain A → B → C. C trades. | A earns L2 (10%), B earns L1 (20%). C pays $0 extra; platform takes the rest of its normal fee. |
| Admin bans signal provider mid-fundraising | Strategy status → CLOSED. Follower funds refunded within 24h. Insurance coverage released back to investors. |
| Admin bans follower with active Atlas Gold subscription | CopyRelation force-closed. Insurance coverage released. Follower wallet frozen; remaining balance held pending compliance review. |
| SettlementRule changed mid-trade lifecycle | Trade uses rule active at trade **open** time. New rule applies only to trades opened after rule becomes effective. |
| Insurance investor requests withdrawal exceeding coverage_available | Withdrawal queued. Processed incrementally as coverage releases. Alert user of queue position. |
| User in Prop Firm exceeds daily loss limit | Trading locked for 24h. Positions preserved. User gets warning. 3 warnings in 30d = BREACHED. |
| Prop trader tries to copy trades on funded account | Detected by source_trade_id check on incoming trades. Account BREACHED immediately. |
| Broker symbol mismatch (provider trades `BTCUSD`, follower's broker uses `BTCUSD.c`) | SymbolMap resolves automatically. Mirrors to `BTCUSD.c` on follower account. |
| mtapi.io session goes stale mid-trade | Affects only BalancePoller/EquityProtector (CopyPro manages its own). They detect on next event, reconnect via `disconnect_all()` cycle. For active protected accounts, EquityProtector falls back to 10s polling during reconnect. No trades are missed because CopyPro owns mirroring. |
| Two followers simultaneously claim the last slot of insurance coverage | Advisory lock serializes. First wins. Second receives INSUFFICIENT_COVERAGE and subscription rollback (saga compensation). |
| Platform wallet runs out of USDT for challenge refund | Refund queued. Admin alerted. Resolved via platform top-up; scheduled job drains queue. |
| Chat user posts external link in community channel | If trust score < threshold: auto-held for admin review. Otherwise: published. |
| User reports a message 3 times rapidly (same user) | System counts distinct reporters, not report actions. Duplicate reports from same user don't accumulate. |
| Ledger reconciliation breaks overnight | Page on-call. Freeze all withdrawals. Investigate discrepancy. Never auto-adjust ledger. |

---

## 20. Configurability Invariant

**Every numeric threshold, ratio, fee, limit, duration, and policy knob in this PRD is a configurable value, not a hardcoded constant.** This applies to every default shown throughout the document (the 60/15/20/5 Atlas Gold split, the $99.99 Trail Mode fee, the 15% drawdown cap, the 20/10/5 referral rates, the $5/$1/$0.50 withdrawal fees, every limit, every interval).

**Admins can change any value** via the platform configuration system without a code deploy. Single-admin approval suffices.

### 20.1 Snapshot discipline (non-negotiable)

Values consumed by running entities are **snapshotted at entity creation time**. When admin changes a config:

- **In-flight entities keep their original snapshotted values.** A CopyRelation subscribed under 60/15/20/5 splits continues settling at that ratio forever, even if admin changes the default.
- **New entities created after the change pick up the new value.** A CopyRelation created the moment after admin changes splits to 55/15/20/10 snapshots at the new ratio.
- **No retroactive effect.** Admin changes are forward-only. This is the same principle as the `SettlementRule` versioning model (§6.3, Appendix B), generalized to every configurable.

### 20.2 Snapshot vs. always-current classification

Every configurable is one of two types:

- **Snapshot** — the user committed to the value when they took an action. Stored on the entity row with `_snapshot` suffix. Read from the entity, never from live config. Applies to: profit splits, Trail Mode rules, Prop Firm rules, referral rates at commission time, trading fees at trade time.
- **Always-current** — the value applies at the moment of an action. Read fresh from config on every use. Applies to: withdrawal fees, daily limits, validation thresholds (min/max subscription), chat rate limits, poll intervals, circuit breakers.

The complete classification table lives in `BEHAVIOR.md §20.2`. Agents must consult it before adding a new configurable.

### 20.3 Implementation summary

- Storage: `platform_config` table in Postgres (`key, value_json, default_value_json, description, category, updated_by, updated_at`)
- Reading: `config.get(key)` helper with 60s Redis cache
- Writing: `config.set(key, value, admin_id, reason)` helper with required justification
- Audit: immutable `config_audit_log` table
- Catalog: every key lives in `CONFIG_CATALOG.md` in the repo root, introduced by the PR that adds it
- Admin UI: not built in v2.0 (CLI-only). Architecture supports adding UI later without refactoring.

### 20.4 Snapshot column conventions

Entity tables that hold snapshots MUST use the `_snapshot` suffix:

```
CopyRelation {
  id, follower_id, strategy_id, risk_capital,
  follower_pct_snapshot,           # from strategy.split.<id>.follower_pct at creation
  trader_pct_snapshot,             # from strategy.split.<id>.trader_pct
  insurance_investor_pct_snapshot, # from strategy.split.<id>.insurance_investor_pct
  platform_pct_snapshot,           # from strategy.split.<id>.platform_pct
  max_drawdown_cap_pct_snapshot,   # from strategy.limits.<id>.max_drawdown_cap_pct
  ...
}

TrailChallenge {
  id, user_id, initial_balance,
  price_paid_snapshot,                # from trail_mode.price_usdt at purchase time
  level_1_required_trades_snapshot,   # from trail_mode.level_1.required_trades
  level_1_required_win_rate_snapshot, # from trail_mode.level_1.required_win_rate
  level_2_required_trades_snapshot,
  level_2_required_win_rate_snapshot,
  max_drawdown_pct_snapshot,
  countdown_days_snapshot,
  ...
}

PropFirmAccount {
  id, user_id, source_challenge_id,
  funded_balance_snapshot,         # from prop_firm.tier_N.funded_balance
  trader_split_pct_snapshot,       # from prop_firm.tier_N.trader_split_pct
  max_drawdown_pct_snapshot,
  daily_loss_limit_pct_snapshot,
  ...
}

Referral {
  id, referrer_id, referred_id, level, event_id,
  commission_pct_snapshot,         # from referral.rate.level_N at event time
  commission_amount,               # computed from pct_snapshot × fee
  ...
}

Trade {
  id, copy_relation_id, ...,
  settlement_rule_id,              # FK to SettlementRule version at open time (existing pattern, §6)
  maker_fee_pct_snapshot,          # from trading.fee.maker at open time
  taker_fee_pct_snapshot,          # from trading.fee.taker at open time
  ...
}
```

### 20.5 Cross-reference

- Agent implementation rules: `BEHAVIOR.md §20`
- Naming convention: `BEHAVIOR.md §20.6`
- Validation at config-write time: `BEHAVIOR.md §20.8`
- Anti-patterns: `BEHAVIOR.md §20.12`
- Agent checklist: `BEHAVIOR.md §20.13`

---

## Appendix A — Glossary

| Term | Definition |
|---|---|
| **TCE** | Tradeverse Copy Engine — the trade-mirroring subsystem built on mtapi.io |
| **Atlas Gold** | Tradeverse's insurance-backed profit-sharing strategy product |
| **AUM** | Assets Under Management — sum of active investments in a strategy |
| **CopyRelation** | A follower's subscription to a specific strategy, with lot mode and risk parameters |
| **SettlementRule** | Versioned profit-split configuration for a strategy |
| **InsuranceCoverage** | Specific investor capital earmarked to cover a specific follower's CopyRelation |
| **Trail Mode** | $99.99 evaluation challenge — passes unlock Prop Firm |
| **Prop Firm** | Funded trading account granted on Trail Mode completion |
| **Drawdown** | Peak-to-trough decline in balance |
| **Idempotency-Key** | UUIDv4 ensuring repeated requests don't cause duplicate state changes |
| **SymbolMap** | Service translating normalized symbols to broker-specific variants |
| **Mimity** | Tradeverse's multi-channel chat product |
| **Saga** | Distributed transaction pattern with compensating actions |
| **DEGRADED** | mtapi.io availability state when service is impaired but not fully down |
| **BREACHED** | Terminal Prop Firm state triggered by rule violation |
| **Snapshot** | A config value stored on an entity at creation time; immutable thereafter. Used for values the user committed to. See §20.2. |
| **Always-current** | A config value read fresh on every use; applies at the moment of an action. See §20.2. |
| **CONFIG_CATALOG.md** | Repo-root file listing every config key, its default, and its classification |

---

## Appendix B — SettlementRule Versioning Example

```
Strategy: atlas-gold-momentum-v1

SettlementRule v1 (effective 2026-01-01 to 2026-03-31):
  Follower: 70% | InsuranceInvestor: 15% | Trader: 10% | Platform: 5%

SettlementRule v2 (effective 2026-04-01 to now):
  Follower: 60% | InsuranceInvestor: 15% | Trader: 20% | Platform: 5%

Trade T1: opened 2026-03-15, closed 2026-03-20 → settled with rule v1
Trade T2: opened 2026-03-28, closed 2026-04-05 → settled with rule v1 (opened under v1)
Trade T3: opened 2026-04-02, closed 2026-04-05 → settled with rule v2
```

Rule: **Opening timestamp determines rule version, not closing timestamp.**

---

## Document Approval

| Role | Name | Date |
|---|---|---|
| Product Owner | Thuan Le | _____________ |
| Lead Engineer | _____________ | _____________ |
| Compliance Officer | _____________ | _____________ |

**This PRD governs all backend business logic for Tradeverse 2.0. Frontend implementations must reflect these rules exactly. Deviations require a change request approval and a new PRD version.**
