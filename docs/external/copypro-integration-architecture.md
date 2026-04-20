# CopyPro Integration Architecture — Tradeverse 2.0

> **Status:** Design confirmed by product owner  
> **Last updated:** 2026-04-20

---

## URL Change Notice

If the CopyPro backend URL changes in the future, update **only** these two places:

1. **`docs/blueprint/CONFIG_CATALOG.md`** — change `copy_engine.base_url` and `copy_engine.frontend_url`
2. **`api/.env.example` (and your live `.env`)** — change `COPYPRO_BASE_URL` and `COPYPRO_FRONTEND_URL`

The CopyPro HTTP client (unit D1) reads from environment/config only. Do not hardcode URLs in service code.

---

## Philosophy

Tradeverse owns the business layer (users, subscriptions, strategies, wallet).  
CopyPro owns the execution layer (copying, equity protection, drawdown).  
Tradeverse orchestrates CopyPro via REST API calls. Tradeverse does **not** reimplement copying logic.

---

## Data Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           TRADEVERSE 2.0                                    │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌──────────────────┐  │
│  │   Users     │  │ Strategies  │  │Subscriptions│  │  Wallet / Crypto │  │
│  │  (PostgreSQL)│  │  (PostgreSQL)│  │  (PostgreSQL)│  │   (PostgreSQL)   │  │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └────────┬─────────┘  │
│         │                │                │                  │            │
│         └────────────────┴────────────────┴──────────────────┘            │
│                                    │                                       │
│                         ┌──────────▼──────────┐                           │
│                         │  Tradeverse Backend │                           │
│                         │   (Fastify + TS)    │                           │
│                         └──────────┬──────────┘                           │
│                                    │                                       │
│                    ┌───────────────┼───────────────┐                       │
│                    │               │               │                       │
│              Add Account     Start/Stop      Update Equity                │
│              Pull Balance    Copier          Protector                    │
│              Trade Logs      Remove Copier   Configure                    │
│                    │               │               │                       │
└────────────────────┼───────────────┼───────────────┼───────────────────────┘
                     │               │               │
                     └───────────────┼───────────────┘
                                     │
                     ┌───────────────▼───────────────┐
                     │         CopyPro API           │
                     │    (copyback3.mrpc.pro)       │
                     │         MongoDB               │
                     └───────────────┬───────────────┘
                                     │
                     ┌───────────────┼───────────────┐
                     │               │               │
                  MT4 REST        MT5 REST       Manager
                  (port 5004)    (port 5005)    Endpoints
                     │               │               │
                     └───────────────┼───────────────┘
                                     │
                              MetaTrader
                              Terminals
```

---

## Phase 1 — Account Onboarding (Pre-Subscription)

### Master Account (Strategy Provider)
1. Admin adds MT5 master account via Tradeverse UI.
2. Tradeverse backend calls `GET /AddAccount` on CopyPro.
   - Params: `name`, `userKey`, `type=MT5`, `user`, `password`, `server`
3. CopyPro returns `apiId` and `accountId`.
4. Tradeverse stores `copyProAccountId`, `copyProApiId`, `type`, `server` in `MtAccount` table.
5. Tradeverse polls `GET /AccountWithSummary` to show live balance/equity on the strategy page.
6. This balance is **display only**. It is NOT stored as a snapshot.

### Slave Account (Follower)
1. User adds their MT5 account via Tradeverse UI (Settings → Trading Accounts).
2. Same `AddAccount` flow as master.
3. Tradeverse stores in `MtAccount` linked to the `User`.
4. Balance polled for display but not snapshotted yet.

---

## Phase 2 — Subscription (Risk Capital Snapshot)

1. User browses strategy page. Sees master live balance from CopyPro poll.
2. User clicks **Subscribe**.
3. Tradeverse prompts: "Enter risk capital (USDT)"
   - Min: `strategy.limits.min_risk_capital` (CONFIG_CATALOG)
   - Max: `strategy.limits.max_risk_capital` (CONFIG_CATALOG)
4. User selects amount (e.g., $5,000).
5. Tradeverse creates a `CopyRelation` row:
   - `riskCapitalSnapshot: 5000.00` (money-affecting, locked at creation)
   - `strategyId`, `followerId`, `slaveAccountId`
   - `status: PENDING`
6. Wallet check: ensure user has sufficient balance. Deduct subscription fee if applicable.

---

## Phase 3 — Activation (CopyPro Starts)

1. Admin or automated cron activates the `CopyRelation`.
2. Tradeverse backend calls CopyPro:
   - `GET /StartByAccountId`
     - `masterAccountId` → from strategy's `MtAccount`
     - `slaveAccountId` → from follower's `MtAccount`
     - `riskType` → per strategy config (e.g., `BalanceMultiplier`)
     - `riskValue` → computed from `riskCapitalSnapshot` / master balance
     - `copySL`, `copyTP` → per strategy settings
     - `copyPendingOrders` → per strategy settings
   - `GET /UpdateEquityProtector`
     - `enabled: true`
     - `stopLossPercent: 0.30` (from `strategy.limits.max_drawdown_cap_pct`)
     - `stopLossAbsolute: minimum equity floor`
     - `closeCopiedTrades: true`
     - `callbackUrl: https://api.tradeverse.io/webhooks/equity-protector`
3. CopyPro returns `copierId`.
4. Tradeverse updates `CopyRelation`:
   - `copyProCopierId: <copierId>`
   - `status: ACTIVE`
   - `activatedAt: now()`
5. From this point forward, CopyPro handles:
   - All trade copying (open, modify, close)
   - All equity protection / drawdown logic
   - All SL/TP management

---

## Phase 4 — Live Trade Logging (Tradeverse Polling)

While `CopyRelation.status === ACTIVE`:

1. Background cron (every `ops.copypro.closed_orders_sync_seconds: 60`) calls:
   - `GET /TradeLogs?copierId=<copierId>&limit=100`
2. Tradeverse normalizes each `TradeLog` into local `Trade` table:
   - `ticket`, `symbol`, `type`, `lots`, `openPrice`, `closePrice`
   - `profit`, `swap`, `commission`, `openTime`, `closeTime`
   - `copyRelationId` (our local FK)
3. Used for:
   - Follower P&L dashboard
   - Strategy performance stats
   - Commission / split calculations (Atlas Gold, Traditional)
   - Trade history export

**Important:** Tradeverse never places or closes trades directly. CopyPro does. We only observe and log.

---

## Phase 5 — Deactivation / Drawdown / Termination

### Normal Termination
1. User cancels subscription, or subscription period ends.
2. Tradeverse calls `GET /Remove?id=<copierId>`.
3. CopyPro stops copying. Existing trades remain open on slave (or closed per CopyPro config).
4. Tradeverse updates `CopyRelation.status: CLOSED`.

### Equity Protector Trigger
1. CopyPro detects drawdown breach.
2. CopyPro closes trades (per `closeCopiedTrades` setting).
3. CopyPro sends callback to Tradeverse webhook.
4. Tradeverse updates `CopyRelation.status: BREACHED`.
5. Tradeverse may call `GET /Remove` to fully detach.

### Manual Pause (Admin)
1. Tradeverse calls `GET /CopierPause` or `GET /UpdateCopier`.
2. Status updated locally.

---

## What Tradeverse Stores Locally (PostgreSQL)

| Table | Purpose |
|-------|---------|
| `MtAccount` | CopyPro account references (`accountId`, `apiId`, type, server, connection status) |
| `Strategy` | Strategy config, master account link, split rules (from snapshot) |
| `CopyRelation` | Follower subscription: risk capital snapshot, copierId, status, timestamps |
| `Trade` | Local mirror of trades from CopyPro `TradeLogs`, denormalized for querying |
| `EquitySnapshot` | Periodic balance/equity snapshots for charting |

## What CopyPro Stores (MongoDB)

- Account credentials and connection state
- Active copier configurations
- Real-time trade execution state
- Equity protector state

**Tradeverse does not read from CopyPro's MongoDB.** We use the REST API only.

---

## Key Constraints (from product owner)

- **One master per strategy.**
- **One slave can follow one master at a time.** (One active `CopyRelation` per slave `MtAccount`)
- **Risk capital is snapshotted** at subscription time. CONFIG_CATALOG classification: `snapshot`.
- **All drawdown / equity protection** is handled by CopyPro. Tradeverse configures it but does not reimplement it.
- **Trade logging is pull-only.** Tradeverse polls CopyPro, never receives pushes (except equity protector callback).

---

## Webhook Endpoint Required

`POST /webhooks/equity-protector`

Payload shape from CopyPro callback (TBD — needs testing against live API).
Expected fields: `accountId`, `copierId`, `triggerType` (StopLoss / TakeProfit), `equityAtTrigger`, `timestamp`.

---

## Configuration Mapping (CONFIG_CATALOG → CopyPro)

| Tradeverse Config | CopyPro Param | Endpoint |
|-------------------|---------------|----------|
| `strategy.limits.max_drawdown_cap_pct` | `stopLossPercent` | `/UpdateEquityProtector` |
| `strategy.limits.absolute_loss_cap_pct` | `stopLossAbsolute` | `/UpdateEquityProtector` |
| `strategy.split.*` | N/A — computed in Tradeverse for payouts | — |
| `ops.copypro.closed_orders_sync_seconds` | Poll interval for `/TradeLogs` | Cron config |

