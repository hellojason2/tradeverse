# Tradeverse 2.0 — Business Logic PRD

> **Document Type:** Product Requirements Document (Business Logic & Rules Engine)
> **Version:** 1.0
> **Scope:** Backend business rules, state machines, calculations, workflows, validation constraints, and automated processes. Excludes UI, frontend architecture, infrastructure, and deployment.

---

## 1. Scope & Core Principles

### 1.1 Purpose

Define the deterministic business rules, calculation methodologies, state transitions, and workflow logic that govern all platform operations. This document serves as the single source of truth for backend engineers, product managers, and compliance auditors.

### 1.2 Design Principles

- **Deterministic:** Identical inputs must always produce identical outputs.
- **Idempotent:** Repeated API calls with the same payload must not cause duplicate state changes or financial movements.
- **Atomic:** Financial and state-changing operations must succeed completely or roll back entirely.
- **Traceable:** Every state transition, calculation, and automated action must generate an audit log entry.
- **Fail-Safe:** System defaults to restrictive states (e.g., funds locked, withdrawals paused) on ambiguity or failure.

---

## 2. Core Entity Model & Business Relationships

| Entity | Key Business Attributes | Relationship Rules |
|---|---|---|
| **User** | `id`, `role`, `status`, `kyc_status`, `balance`, `locked_balance`, `referral_code`, `referred_by_id` | One User → Zero/One SignalProvider, Zero/One TrailChallenge, Many Position, Many Transaction, Many Trade |
| **SignalProvider** | `user_id`, `status`, `aum`, `win_rate`, `max_drawdown`, `profit_share_pct`, `fundraising_target`, `fundraising_raised` | Status transitions require admin or system-triggered events. `aum = Σ(active position investments)`. |
| **Position** | `user_id`, `provider_id`, `type` (copy/insurance), `investment_amount`, `current_pl`, `status`, `locked` | `locked=true` when `status=fundraising` or `active`. Unlocks on `closed/failed`. |
| **Trade** | `user_id`, `pair`, `type`, `side`, `entry_price`, `exit_price`, `amount`, `pl`, `fee`, `status` | P/L calculated at close. Fee deducted from `available_balance` at execution. |
| **Transaction** | `user_id`, `type`, `amount`, `fee`, `network`, `tx_hash`, `status`, `confirmations`, `required_confirmations` | Double-entry ledger: `user_balance` adjusts only on `CONFIRMED`. `PENDING` funds are reserved. |
| **TrailChallenge** | `user_id`, `initial_balance`, `current_balance`, `level`, `status`, `drawdown_current`, `drawdown_max`, `trade_count`, `win_count`, `started_at`, `expires_at` | Auto-fails if `drawdown_current ≥ drawdown_max` or `expires_at < now()`. |
| **Referral** | `referrer_id`, `referred_id`, `level`, `commission_pct`, `commission_amount`, `status`, `activity_type` | 3-tier tree. Commission triggers on referred user's fee-generating events. |
| **Notification** | `user_id`, `type`, `category`, `payload`, `is_read`, `channel` | Routed based on user preferences. Deduplicated per 5-minute window. |
| **SupportTicket** | `user_id`, `priority`, `category`, `status`, `assigned_to`, `escalated` | SLA timers start on creation. Auto-escalate if `status=open > 24h`. |

---

## 3. Authentication & Authorization Logic

### 3.1 Session & Token Lifecycle

- Access tokens expire after **15 minutes**. Refresh tokens expire after **7 days**.
- **Refresh token rotation:** On each refresh, old refresh token is invalidated and a new one issued.
- **Concurrent sessions:** Max 5 active sessions per user. Exceeding limit revokes oldest session.
- **IP/device binding:** Optional. If enabled, login from new device requires email verification.

### 3.2 Role-Based Access Control (RBAC) Matrix

| Action | USER | PROVIDER | ADMIN |
|---|:-:|:-:|:-:|
| View own portfolio | ✅ | ✅ | ✅ |
| Subscribe to signal | ✅ | ✅ | ❌ |
| Create/manage signal | ❌ | ✅ | ✅ (override) |
| Approve KYC | ❌ | ❌ | ✅ |
| Approve withdrawal > $5k | ❌ | ❌ | ✅ |
| Ban user | ❌ | ❌ | ✅ |
| View audit logs | ❌ | ❌ | ✅ |
| Modify platform config | ❌ | ❌ | ✅ |

### 3.3 Security Enforcement Rules

- **Password policy:** Min 12 chars, 1 uppercase, 1 lowercase, 1 number, 1 special. Blocked common passwords.
- **2FA enforcement:** Required for withdrawals, password changes, and API key generation.
- **Brute force:** Account locks for 15 minutes after 5 failed login attempts. Locks for 24 hours after 3 failed 2FA attempts.
- **Session invalidation:** Immediate revocation on password change, 2FA disable, or admin ban.

---

## 4. Module-by-Module Business Logic

### 4.1 Authentication & Onboarding

- **Registration:** Email must be unique. Referral code validated at signup. Invalid code → fallback to no referral.
- **Email Verification:** Token expires in 24h. Verified status required before first deposit.
- **KYC Workflow:**
  - `NOT_STARTED` → User uploads docs → `PENDING`
  - Admin review → `VERIFIED` (unlocks withdrawals > $1k) or `REJECTED` (allows retry after 7 days)
- **Account Status:** `ACTIVE` (default), `SUSPENDED` (admin trigger, retains data, blocks trades), `BANNED` (hard block, data archived after 90 days).

### 4.2 Dashboard & Portfolio

- **Balance Calculation:** `total_balance = available_balance + locked_balance`
- **Locked Balance Rules:** Funds lock when subscribed to fundraising position, pending withdrawal, or active margin trade.
- **P/L Aggregation:** Realized P/L sums closed trades. Unrealized P/L recalculated every 1s via WebSocket using mark price.
- **Data Freshness:** Portfolio data cached for 30s. Force refresh on trade execution or deposit confirmation.

### 4.3 Signal Plaza & Copy Trading

- **Provider Lifecycle:**
  - `PENDING` → Admin approves → `FUNDRAISING` → Target reached or timer expires → `ACTIVE` → Manual pause → `COMPLETED`
- **Subscription Rules:**
  - Min investment: **$100 USDT**
  - Max investment per user: **$50,000 USDT** (configurable)
  - Funds lock immediately on subscription success
  - Profit share deducted from user's P/L before payout
- **Fundraising Mechanics:**
  - Countdown: **14 days** from creation
  - If target not met by expiry: Status → `CLOSED`, funds refunded pro-rata within 24h
  - If target met early: Status → `ACTIVE`, trading begins immediately
- **AUM Tracking:** `aum = Σ(investment_amount)` where `position.status = ACTIVE`

### 4.4 Trail Mode (Challenge Engine)

- **Entry Requirements:** KYC `VERIFIED`, subscription paid ($99.99 USDT), no active challenge.
- **Challenge State Machine:**
  - `CREATED` → `ACTIVE` → (`LEVEL_2` or `FAILED` or `COMPLETED`)
- **Progression Rules:**
  - **Level 1:** 10 trades, ≥60% win rate
  - **Level 2:** 20 trades, ≥65% win rate
  - Trade count increments on order close (filled or cancelled with execution)
  - Win rate = `win_count / trade_count` (rounded to 2 decimals)
- **Drawdown Calculation:**
  - Peak balance tracked continuously
  - `drawdown_current = (peak_balance - current_balance) / peak_balance * 100`
  - Auto-fail if `drawdown_current ≥ 15%`
- **Countdown Logic:**
  - Initial: 30 days from activation
  - Resets to 30 days on each trade execution
  - Expires at `00:00:00 UTC` on expiry date
  - Expiry without completion → `FAILED`, no refund
- **Refund Logic:**
  - Trigger: `status = COMPLETED`
  - Refund amount = subscription price
  - Processed within 24h to user wallet
  - One-time per user

### 4.5 Wallet & Transactions

- **Ledger Model:** Double-entry. Every deposit/withdrawal creates two ledger entries (user balance + platform reserve).
- **Deposit Flow:**
  1. Generate unique deposit address per user/network
  2. Blockchain listener detects incoming TX
  3. TX status → `PENDING` with `confirmations = 0`
  4. On each block confirmation: increment `confirmations`
  5. When `confirmations ≥ required_confirmations`: status → `CONFIRMED`, `available_balance += amount`, fee deducted
  - **Network thresholds:** ERC20=12, TRC20=24, BEP20=20
- **Withdrawal Flow:**
  1. User submits request → `PENDING`
  2. System validates: balance, daily limit, 2FA, address whitelist
  3. Auto-approve if ≤ $1,000 and 2FA verified
  4. Manual approval required if > $1,000 or new address
  5. On approval: status → `PROCESSING` → blockchain broadcast → `CONFIRMED`
  - Cancellation allowed only while status = `PENDING`
- **Limits & Fees:**
  - Daily withdrawal limit: $50,000 (default, configurable per KYC tier)
  - Withdrawal fee: Network-dependent (ERC20=$5, TRC20=$1, BEP20=$0.5)
  - Fee deducted from withdrawal amount (`net = gross - fee`)

### 4.6 Referral System

- **Code Generation:** 8-char alphanumeric, URL-safe, unique per user. Regeneration allowed once per 30 days.
- **Commission Tiers:**
  - **Level 1 (Direct):** 20% of referred user's trading fees
  - **Level 2 (Sub-referral):** 10%
  - **Level 3 (Deep):** 5%
- **Trigger Events:** Commission accrues on:
  - Trade execution fee
  - Subscription payment
  - Deposit (bonus campaigns)
- **Accrual Logic:**
  - Commission calculated at event time
  - Status → `PENDING` for 7 days (dispute window)
  - After 7 days → `PAID`, added to referrer's `available_balance`
- **Fraud Prevention:**
  - Self-referral blocked (same IP/device/email hash)
  - Max 3 accounts per household/IP
  - Commission clawback if referred account banned within 30 days

### 4.7 Activities & Rewards

- **Streak Tracking:** Consecutive days with ≥1 login. Resets on miss. Max streak capped at 365.
- **Task Completion:**
  - Daily login: Auto-detected on session creation
  - First trade: Detected on trade close
  - Referral actions: Webhook from referral engine
- **Reward Claiming:**
  - Claim window: 7 days from completion
  - Expired rewards → forfeited
  - Claim triggers ledger credit + notification
- **Milestone Badges:** Unlocked permanently. No downgrade on inactivity.

### 4.8 Community & Moderation

- **Message Lifecycle:**
  - Edit allowed within 15 minutes of creation
  - Delete allowed within 15 minutes (soft delete, retained for moderation)
  - After 15 minutes: immutable
- **Report Workflow:**
  - ≥3 reports → auto-hides message pending review
  - Admin action: Warn, Mute (24h/7d/permanent), Ban
  - Muted users cannot post but can read
- **Rate Limits:** 10 messages/minute, 50/hour. Exceed → temporary mute.

### 4.9 Trading Engine

- **Order Types:**
  - **MARKET:** Executes immediately at best available price. Slippage tolerance: 2%
  - **LIMIT:** Executes only at specified price or better. Expires after 30 days or manual cancel
  - **STOP:** Triggers market order when stop price reached. Used for risk management
- **Matching & Fills:**
  - Partial fills allowed. Remaining quantity stays open
  - Fill priority: Price → Time
  - Fee: **0.1% maker, 0.15% taker** (deducted from quote currency)
- **Position P/L:**
  - `realized_pl = (exit_price - entry_price) * amount * direction - fees`
  - `unrealized_pl = (mark_price - entry_price) * amount * direction`
- **Liquidation Logic:**
  - Margin ratio = `equity / required_margin`
  - Warning at 150%, liquidation at 110%
  - Liquidation executes market order, closes position, deducts liquidation fee (0.5%)

### 4.10 Notifications

- **Trigger Conditions:**
  - Trade executed, order filled/cancelled
  - Deposit/withdrawal status change
  - Price alert threshold crossed
  - Referral activity, reward claimable
  - System maintenance, security alert
- **Delivery Rules:**
  - Real-time via WebSocket for in-app
  - Email batched every 15 minutes (unless critical)
  - Push notifications respect OS-level permissions
  - Deduplication: Identical triggers within 5-minute window → single notification
- **Read State:** `is_read` updated on view. Auto-archive after 30 days.

### 4.11 Settings & Profile

- **Profile Updates:** Name/avatar immediate. Email change requires verification of new address.
- **Password Change:** Requires current password + 2FA. Invalidates all sessions except current.
- **2FA Lifecycle:**
  - **Enable:** Generate secret → verify 2 codes → activate
  - **Disable:** Requires password + 2FA code + email confirmation
  - **Recovery:** 10 backup codes, single-use each. Regeneration invalidates old codes.
- **Preference Inheritance:** Defaults from platform config. User overrides persist. Reset to default clears override.

### 4.12 Admin Operations

- **User Moderation:** Suspend preserves data, blocks actions. Ban archives after 90 days, anonymizes PII.
- **KYC Review:** SLA: 24h. Auto-escalate to senior reviewer if pending > 48h.
- **Withdrawal Approval:** Manual review queue. Dual-approval required for > $10,000.
- **Ticket Management:** Assignment round-robin. Auto-close after 7 days inactivity. Reopen allowed within 14 days.
- **System Health Thresholds:**
  - API latency > 500ms → alert
  - DB connection pool > 80% → alert
  - WebSocket disconnect rate > 5%/min → alert
  - Auto-scaling triggers at 70% CPU for 5 minutes

---

## 5. Financial & Trading Calculation Engine

### 5.1 Core Formulas

| Calculation | Formula | Precision |
|---|---|---|
| Win Rate | `(win_count / trade_count) * 100` | 2 decimals |
| Max Drawdown | `((peak_balance - trough_balance) / peak_balance) * 100` | 2 decimals |
| Commission | `fee_amount * commission_pct` | 8 decimals (crypto standard) |
| Liquidation Price | `entry_price * (1 - (initial_margin - maintenance_margin) / leverage)` | 8 decimals |
| Net Withdrawal | `gross_amount - network_fee - platform_fee` | 2 decimals (fiat), 8 (crypto) |
| P/L Percentage | `((exit_value - entry_value) / entry_value) * 100` | 2 decimals |

### 5.2 Rounding & Precision Rules

- All monetary values stored as `DECIMAL(20,8)`
- UI display rounds to 2 decimals (fiat) or 6–8 (crypto)
- Calculations use exact decimal arithmetic. No floating point.
- Rounding mode: `HALF_UP` for display, `TRUNCATE` for ledger entries.

### 5.3 Fee Hierarchy

1. Network fee (blockchain)
2. Platform trading fee (maker/taker)
3. Signal profit share (deducted from P/L)
4. Referral commission (from platform fee pool)

Fees applied in order. Insufficient balance → transaction rejected.

---

## 6. State Machines & Workflow Transitions

### 6.1 User Account

```
NOT_VERIFIED → ACTIVE → (SUSPENDED ⇄ ACTIVE) → BANNED
```

- `BANNED` is terminal. Data archival after 90 days.
- `SUSPENDED → ACTIVE` requires admin action.

### 6.2 Position

```
PENDING → FUNDRAISING → ACTIVE → (CLOSED | FAILED | COMPLETED)
```

- `FUNDRAISING → REFUNDED` if target not met
- `ACTIVE → FAILED` if provider banned or system error
- `CLOSED → COMPLETED` after P/L settlement

### 6.3 Transaction

```
PENDING → (CONFIRMED | CANCELLED | FAILED)
```

- `PENDING → CANCELLED` only by user (withdrawals) or timeout (deposits > 72h)
- `CONFIRMED → FAILED` on blockchain revert or insufficient platform liquidity

### 6.4 Trail Challenge

```
CREATED → ACTIVE → LEVEL_1_PASSED → LEVEL_2_ACTIVE → (COMPLETED | FAILED | EXPIRED)
```

- Single path. No rollback. `FAILED/EXPIRED` are terminal.
- New challenge requires new subscription.

### 6.5 Support Ticket

```
OPEN → IN_PROGRESS → (RESOLVED | ESCALATED) → CLOSED
```

- Auto-escalate: `OPEN > 24h`
- Auto-close: `RESOLVED > 7 days`
- Reopen window: 14 days from resolution

---

## 7. Automated Processes & Event Triggers

### 7.1 Cron Jobs & Scheduled Tasks

| Job | Frequency | Logic |
|---|---|---|
| Drawdown Monitor | Every 10s | Recalculates peak/trough for active challenges. Triggers auto-fail if threshold breached. |
| Trail Countdown | Every 1s | Decrements timer. Resets on trade execution. Expires challenges. |
| Deposit Confirmation | Block polling | Checks blockchain nodes. Updates confirmations. Confirms when threshold met. |
| Commission Payout | Daily 00:00 UTC | Moves `PENDING` commissions > 7 days to `PAID`. Credits referrer balance. |
| Streak Reset | Daily 00:00 UTC | Checks last login date. Resets streak if gap > 1 day. |
| Notification Digest | Every 15 min | Batches non-critical notifications. Sends email digest. |
| Ticket SLA Checker | Every 5 min | Flags tickets exceeding response/resolution SLAs. Escalates. |
| System Health Check | Every 1 min | Pings services, DB, cache. Triggers alerts on threshold breach. |
| Expired Order Cleanup | Every 10 min | Cancels limit orders older than 30 days. Releases locked funds. |

### 7.2 Event-Driven Triggers

- `trade.executed` → Update position P/L, trigger notifications, accrue referral commission
- `deposit.confirmed` → Update available balance, trigger welcome/reward if first deposit
- `withdrawal.approved` → Lock funds, broadcast to blockchain, trigger notification
- `challenge.failed` → Notify user, archive challenge data, block re-entry for 7 days
- `user.banned` → Invalidate sessions, freeze balances, archive PII, notify compliance

---

## 8. Validation, Constraints & Idempotency

### 8.1 Business Validation Rules

- Subscription investment must be ≥ $100 and ≤ $50,000
- Withdrawal amount must be ≥ $10 and ≤ daily limit
- Trail trade size must be ≥ 0.001 BTC equivalent
- Referral code cannot match existing email, phone, or IP hash
- Password cannot match last 5 passwords
- 2FA code valid for 30s window. Tolerance: ±1 period

### 8.2 Idempotency Enforcement

- All financial endpoints require `Idempotency-Key` header (UUID v4)
- Key stored with response for 24 hours
- Duplicate key → return cached response, no state change
- Key expiration → treat as new request

### 8.3 Concurrency Control

- Optimistic locking via `version` column on balance/position tables
- Withdrawals: `SELECT ... FOR UPDATE` on balance row during processing
- Trade execution: Queue-based processing per pair. FIFO order.
- Challenge drawdown: Atomic increment/decrement with database transactions

---

## 9. Error Handling & Recovery Logic

### 9.1 Failure States & Recovery

| Scenario | System Behavior | Recovery Action |
|---|---|---|
| Blockchain node down | Pause deposit confirmations, queue TX hashes | Auto-retry on node recovery. Notify users if > 1h delay. |
| Double TX detected | Flag as duplicate, credit only once | Manual review queue. Refund duplicate within 24h. |
| Price feed gap > 5s | Freeze new orders, mark price stale | Use last known price with warning. Resume on feed restore. |
| Database transaction deadlock | Retry up to 3 times with exponential backoff | Log error, alert if persistent. Fail open to safe state. |
| WebSocket disconnect | Graceful degradation to polling (5s interval) | Auto-reconnect. Sync missed updates on reconnect. |
| Commission calculation overflow | Cap at available fee pool, log discrepancy | Reconcile daily. Adjust platform reserve. |

### 9.2 Rollback & Compensation

- Sagas pattern for multi-step workflows (e.g., subscription + lock funds + notify)
- Each step has compensating action (e.g., unlock funds, send reversal notification)
- Compensation logged to `audit_log` with `compensation_for` reference
- Manual reconciliation dashboard for failed compensations

---

## 10. Compliance & Audit Rules

### 10.1 Audit Logging

- All state changes, financial movements, admin actions, and config changes logged
- Log structure: `timestamp`, `actor_id`, `action`, `entity_type`, `entity_id`, `before_state`, `after_state`, `ip_address`, `user_agent`
- Immutable storage. Retention: 7 years.
- Real-time stream to SIEM (Splunk/Datadog)

### 10.2 Data Retention & Privacy

- Active user data: Retained indefinitely
- Banned user PII: Anonymized after 90 days
- Transaction logs: 7 years (financial compliance)
- Chat messages: 2 years. User deletion request → anonymize content, retain metadata
- Right to erasure: 30-day processing window. Excludes financial/audit records.

### 10.3 Regulatory Alignment

- KYC thresholds aligned with FATF Travel Rule
- Withdrawal monitoring for AML patterns (structuring, rapid in/out)
- Commission payouts reported for tax documentation (1099/KYC export)
- Challenge refund treated as service reversal, not gambling payout

---

## Appendix A: Glossary

| Term | Definition |
|---|---|
| AUM | Assets Under Management. Total active investments in a signal. |
| Drawdown | Peak-to-trough decline in challenge balance. |
| Idempotency-Key | UUID ensuring duplicate requests don't cause duplicate effects. |
| Mark Price | Real-time fair value used for unrealized P/L calculation. |
| Maker/Taker | Liquidity provider vs liquidity consumer. Fee differential applies. |
| Saga | Distributed transaction pattern with compensating actions. |
| SLA | Service Level Agreement. Max time before escalation. |

---

## Appendix B: Edge Case Matrix

| Scenario | Expected Behavior |
|---|---|
| User subscribes, then immediately requests withdrawal | Withdrawal queued until position unlocks or closed. Balance shows locked. |
| Two trades execute simultaneously, pushing drawdown past 15% | Atomic check fails second trade. Challenge fails. First trade stands. |
| Referral chain: A→B→C. C trades. Who gets commission? | A gets L3 (5%), B gets L1 (20%). Platform keeps remainder. |
| Blockchain reorg invalidates deposit TX | TX status reverted to `PENDING`. Confirmations reset. User notified. |
| Admin bans provider mid-fundraising | Status → `CLOSED`. Funds refunded. Challenge participants unaffected. |
| User claims reward, then account suspended | Reward credited before suspension. No clawback unless fraud proven. |
| WebSocket price feed shows $0 due to bug | System falls back to last valid price. Alerts trigger. Trading paused. |
| Two users claim same limited reward simultaneously | Database constraint prevents duplicate. Second request fails gracefully. |

---

## Document Approval

- **Product Owner:** _______________  Date: _________
- **Lead Engineer:** _______________  Date: _________
- **Compliance Officer:** _______________  Date: _________

> This PRD governs all backend business logic. Frontend implementations must reflect these rules exactly. Deviations require change request approval.
