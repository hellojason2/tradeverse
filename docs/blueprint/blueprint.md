# Tradeverse 2.0 — Complete Product & Engineering PRD
**Version:** 3.2 (Authoritative)  
**Audience:** AI Agents, Backend/Frontend Engineers, Product, Compliance  
**Companion Docs:** `BEHAVIOR.md`, `CONFIG_CATALOG.md`  
**Status:** Production Blueprint. Overrides all previous drafts.

---

## 1. Executive Summary & Core Principles

### 1.1 Purpose
Single source of truth for Tradeverse 2.0 architecture, business logic, UI behavior, database schema, API contracts, and deployment rules. Governs all client-facing portals, admin operations, copy engine integration, and financial settlements.

### 1.2 Non-Negotiable Principles
| Principle | Enforcement |
|-----------|-------------|
| **Deterministic** | Identical inputs → identical outputs. All splits/calculations are pure functions. |
| **Idempotent** | Repeated calls with same `Idempotency-Key` never duplicate state or money movements. |
| **Atomic** | Financial/state operations succeed completely or roll back. Postgres advisory locks on settlements. |
| **Traceable** | Every transition generates `LedgerEntry` + `AuditLog`. Double-entry accounting everywhere. |
| **Fail-Safe** | Ambiguity/failure → restrictive defaults (funds locked, copy halted, withdrawals paused). |
| **Config-Driven** | Zero hardcoded financials. All thresholds/splits/fees live in `platform_config`. |
| **Snapshot Discipline** | Running entities store `_snapshot` columns at creation. Admin changes are forward-only. |

---

## 2. System Architecture & File Structure

### 2.1 3-Layer Execution Model
```
L3: Tradeverse Business Logic (FastAPI/Next.js)
    → Owns: Users, Strategies, CopyRelations, Atlas Gold, Ledger, Trail, Referrals, Chat
    → Calls L2 to activate/deactivate copiers, read balances, monitor equity
      │
L2: Tradeverse Sibling Services
    → CopyPro (Vendor): /Start, /Remove, /ClosedOrdersAll, SymbolMap
    → BalancePoller: 30-min AccountSummary snapshots → AccountSnapshot
    → EquityProtector: WSS /OnOrderProfit → real-time DD monitoring → force-close
      │
L1: mtapi.io Broker Gateways
    → MT4/MT5 REST & WebSocket bridges → actual broker servers
```

### 2.2 Monorepo File Structure
```
tradeverse/
├── .github/workflows/          # CI, staging/prod deploy
├── docs/                       # PRD, ARCHITECTURE, API, DEPLOYMENT
├── packages/
│   ├── ui/                     # Shared atoms→molecules→organisms→layouts
│   ├── config/                 # Shared TS/ESLint/Tailwind presets
│   ├── types/                  # Shared TS interfaces (User, Trade, Config, etc.)
│   └── utils/                  # Formatting, validation, React hooks
├── apps/
│   ├── web/                    # Client Portal (Next.js App Router, Light Theme)
│   ├── admin/                  # Admin Panel (Next.js App Router, Dark Theme)
│   └── api/                    # Backend API (FastAPI/Express + Prisma)
│       ├── prisma/schema.prisma
│       └── src/{routes,controllers,services,middleware,validators}
├── scripts/                    # setup.sh, seed-db.ts, migrate.sh
├── docker/                     # docker-compose, Dockerfiles, nginx.conf
├── turbo.json                  # Turborepo orchestration
├── pnpm-workspace.yaml
├── BEHAVIOR.md                 # UI feedback & error taxonomy
├── CONFIG_CATALOG.md           # Running config key registry
└── README.md
```

---

## 3. Database Schema & Relationships

### 3.1 Core Entities & Snapshot Discipline
All money-affecting/policy values are stored twice: live config (`platform_config`) and entity snapshots (`_snapshot` columns). Snapshots are immutable after row insert.

```prisma
model User {
  id               UUID @id @default(uuid())
  email            String @unique
  password_hash    String
  role             Role @default(USER)
  status           UserStatus @default(ACTIVE)
  kyc_status       KycStatus @default(NOT_STARTED)
  balance          Decimal @default(0)
  locked_balance   Decimal @default(0)
  referral_code    String @unique
  referred_by_id   UUID?
  created_at       DateTime @default(now())
  
  mt5_accounts     MT5Account[]
  strategies       SignalStrategy[] @relation("ProviderStrategies")
  copy_relations   CopyRelation[] @relation("FollowerRelations")
  trail_challenge  TrailChallenge?
  insurance_investor InsuranceInvestor?
  transactions     Transaction[]
  ledger_entries   LedgerEntry[]
  chat_messages    ChatMessage[]
  referrals_sent   Referral[] @relation("Referrer")
  referrals_recv   Referral[] @relation("Referred")
}

model SignalStrategy {
  id                UUID @id @default(uuid())
  provider_id       UUID
  provider          User @relation("ProviderStrategies", fields: [provider_id], references: [id])
  name              String
  strategy_type     StrategyType // traditional | atlas_gold
  status            StrategyStatus // DRAFT | MASTER_LINKED | PUBLISHED | ACTIVE | PAUSED | COMPLETED
  master_account_id UUID?
  copypro_copier_ids String[]
  created_at        DateTime @default(now())
  
  copy_relations    CopyRelation[]
  settlement_rules  SettlementRule[]
}

model CopyRelation {
  id                         UUID @id @default(uuid())
  follower_id                UUID
  follower                   User @relation("FollowerRelations", fields: [follower_id], references: [id])
  strategy_id                UUID
  strategy                   SignalStrategy @relation(fields: [strategy_id], references: [id])
  risk_capital               Decimal
  lot_mode                   LotMode
  status                     CopyStatus // QUEUED | ACTIVE | PAUSED | CLOSED | STOPPED_BY_PROTECTOR
  copier_id                  String?
  
  // SNAPSHOT DISCIPLINE
  follower_pct_snapshot      Decimal
  trader_pct_snapshot        Decimal
  insurance_pct_snapshot     Decimal
  platform_pct_snapshot      Decimal
  max_drawdown_cap_snapshot  Decimal
  coverage_ratio_snapshot    Decimal
  created_at                 DateTime @default(now())
}

model SettlementRule {
  id                      UUID @id @default(uuid())
  strategy_id             UUID
  strategy                SignalStrategy @relation(fields: [strategy_id], references: [id])
  version                 Int
  follower_pct            Decimal
  trader_pct              Decimal
  insurance_investor_pct  Decimal
  platform_pct            Decimal
  effective_from          DateTime @default(now())
  
  @@unique([strategy_id, version])
}

model Trade {
  id                UUID @id @default(uuid())
  copy_relation_id  UUID
  copy_relation     CopyRelation @relation(fields: [copy_relation_id], references: [id])
  broker_ticket     String
  symbol_normalized String
  side              TradeSide
  volume            Decimal
  entry_price       Decimal
  exit_price        Decimal?
  pnl               Decimal?
  status            TradeStatus // OPEN | CLOSED | CANCELLED
  settlement_rule_id UUID?
  settlement        Settlement?
  created_at        DateTime @default(now())
}

model LedgerEntry {
  id             UUID @id @default(uuid())
  user_id        UUID
  user           User @relation(fields: [user_id], references: [id])
  entry_type     LedgerType // DEPOSIT | WITHDRAWAL | SPLIT_PROFIT | SPLIT_LOSS | FEE | REFERRAL | TRANSFER
  debit          Decimal @default(0)
  credit         Decimal @default(0)
  balance_after  Decimal
  related_entry_id UUID?
  created_at     DateTime @default(now())
}

model TrailChallenge {
  id                          UUID @id @default(uuid())
  user_id                     UUID @unique
  user                        User @relation(fields: [user_id], references: [id])
  status                      TrailStatus // CREATED | ACTIVE | LEVEL_1_PASSED | COMPLETED | FAILED | EXPIRED
  current_balance             Decimal
  peak_balance                Decimal
  trade_count                 Int @default(0)
  win_count                   Int @default(0)
  started_at                  DateTime @default(now())
  expires_at                  DateTime
  
  // SNAPSHOT DISCIPLINE
  price_paid_snapshot         Decimal
  level_1_trades_snapshot     Int
  level_1_wr_snapshot         Decimal
  level_2_trades_snapshot     Int
  level_2_wr_snapshot         Decimal
  max_dd_snapshot             Decimal
  countdown_days_snapshot     Int
}

model PlatformConfig {
  key             String @id
  value_json      Json
  default_json    Json
  classification  ConfigClass // snapshot | always-current
  sum_group       String?
  updated_by      UUID?
  updated_at      DateTime @default(now())
}
```

### 3.2 Relationship Map
- `User` 1→N `MT5Account`, `CopyRelation`, `Transaction`, `LedgerEntry`
- `SignalStrategy` 1→N `SettlementRule` (versioned), 1→N `CopyRelation`
- `CopyRelation` N→1 `TrailChallenge` (via follower), N→1 `SignalStrategy`
- `LedgerEntry` pairs enforce `Σ(debit) == Σ(credit)` per commit
- `PlatformConfig` drives all `_snapshot` population at entity creation

---

## 4. Backend Architecture & API Contracts

### 4.1 Canonical Error Response (BEHAVIOR.md §2)
```json
{
  "error": {
    "code": "U_RISK_CAPITAL_BELOW_MIN",
    "category": "USER_INPUT",
    "severity": "blocker",
    "title": "Below minimum investment",
    "message": "This strategy requires at least $2,000.",
    "details": { "entered": 1000, "required": 2000, "currency": "USDT" },
    "remediation": { "action": "increase_amount", "cta_label": "Add funds", "cta_url": "/wallet/deposit" },
    "trace_id": null,
    "docs_url": "/help/minimum-investment"
  }
}
```
- `trace_id` only on `SYSTEM_ERROR`
- `remediation` required for blockers
- Frontend maps `code` → UI pattern per BEHAVIOR.md §5

### 4.2 Core API Routes
| Domain | Endpoints | Auth | Idempotency |
|--------|-----------|------|-------------|
| `/auth` | `/register`, `/login`, `/refresh`, `/2fa/*` | Public | ❌ |
| `/users` | `/me`, `/mt5`, `/capabilities/:action` | JWT | ❌ |
| `/strategies` | `/`, `/ :id`, `/ :id/subscribe`, `/ :id/history` | JWT | ✅ (subscribe) |
| `/copy` | `/relations`, `/relations/ :id/close` | JWT | ✅ |
| `/wallet` | `/balance`, `/deposit`, `/withdraw`, `/transactions` | JWT + 2FA | ✅ |
| `/trail` | `/enroll`, `/status`, `/progress` | JWT | ✅ |
| `/referral` | `/code`, `/tree`, `/earnings` | JWT | ❌ |
| `/chat` | `/channels`, `/messages`, `/dm` | JWT | ❌ |
| `/admin` | `/users`, `/kyc`, `/strategies/*`, `/config/*`, `/audit` | Admin JWT | ✅ |
| `/config` | `/get`, `/set` (CLI only v2) | Admin | ✅ |

### 4.3 Capability Endpoint Pattern
Frontend never hardcodes gating. Calls:
`GET /api/users/capabilities/subscribe_to_strategy?strategy_id=...&amount=...`
Returns:
```json
{
  "allowed": false,
  "reason": "U_RISK_CAPITAL_BELOW_MIN",
  "remediation": { "cta_label": "Add funds", "cta_url": "/wallet/deposit" }
}
```

---

## 5. Core Engines & Business Logic

### 5.1 Copy Engine (TCE)
- Admin binds master MT5 → strategy status `MASTER_LINKED`
- Publish → `PUBLISHED` (subscriptions queue, copy NOT started)
- Start → `ACTIVE` → calls CopyPro `/Start` per queued relation, attaches EquityProtector WSS
- `/Start` params: `fixedMasterBalance = risk_capital`, lot_mode maps to CopyPro risk params
- Deduplication: `(copierId, broker_ticket)` idempotency guard

### 5.2 Atlas Gold Insurance
- 4-party split: Follower / Insurance Investor / Trader / Platform
- Coverage allocated FIFO from investor pool at subscription
- Profit: split per `SettlementRule` active at trade open
- Loss: `covered = min(|pnl|, allocated_coverage)`, uncovered hits follower
- Settlement emits 4 `LedgerEntry` pairs, updates `InsuranceCoverage.amount_consumed`

### 5.3 Trail Mode
- Entry: $99.99 USDT → `TrailChallenge` created with all `_snapshot` columns
- Progression: L1 (10 trades, ≥60% WR) → L2 (20 trades, ≥65% WR)
- Failure: `drawdown_current ≥ max_dd_snapshot` OR `expires_at < now()`
- Pass: Refund $99.99, unlock Prop Firm eligibility, status `COMPLETED`
- Cooldown: `config.get("trail_mode.cooldown_after_fail_days")`

### 5.4 Referral System
- 3-tier: L1=20%, L2=10%, L3=5% of platform fees
- Triggers on: trade fees, trail enrollment, prop payouts
- 7-day dispute window → `PENDING` → `PAID`
- Clawback if referred banned within 30 days

### 5.5 Mimity Chat
- 3 channel types: `community`, `strategy_room`, `dm`
- Edit/delete window: 15 min → immutable after
- ≥3 distinct reports → auto-hide pending review
- Rate limits: 10/min normal, 30/min traders, 30/min DM pairs

### 5.6 Ledger & Settlement
- Double-entry invariant enforced at DB constraint + nightly reconciliation
- Fee hierarchy: Network → Platform → Profit Split → Referral
- Idempotency keys required on all money endpoints
- Advisory locks on settlement, coverage allocation, payout eligibility

---

## 6. Admin Dashboard Page Map

| Page / Route | Core Modules & Components | Data Relationships | Underlying Engine / Logic |
|--------------|---------------------------|-------------------|---------------------------|
| `/admin/overview` | StatCards (Users, AUM, Volume, Revenue), RevenueChart, RecentUsersTable, AssetDistribution | `User`, `CopyRelation`, `Trade`, `LedgerEntry` | Nightly metrics cron, real-time pub/sub, aggregate queries |
| `/admin/users` | DataTable, Filters, KYCQueue, Ban/SuspendModals | `User`, `MT5Account`, `TrailChallenge`, `CopyRelation` | RBAC enforcement, advisory locks on status changes, audit logging |
| `/admin/kyc` | KycStepViewer, DocumentPreview, Approve/RejectButtons | `User`, `ConfigAuditLog` | Forward-only status transitions, SLA timers, PII encryption |
| `/admin/strategies` | StrategyWizard, MasterLinkVault, SplitCalculator, StatusToggles, Publish/StartButtons | `SignalStrategy`, `MT5Account`, `SettlementRule`, `CopyRelation` | CopyPro `/Start`/`/Remove` orchestration, symbol map validation, queue management |
| `/admin/copy-monitor` | CopierHealthGrid, ErrorQueue, CircuitBreakerStatus, RetryButtons | `CopyRelation`, `EquityProtectorState`, `PlatformConfig` | Circuit breaker state machine, retry backoff, WS reconnection logic |
| `/admin/atlas-gold` | InvestorPoolTable, CoverageAllocationMap, SplitEditor, WithdrawalQueue | `InsuranceInvestor`, `InsuranceCoverage`, `CopyRelation` | FIFO coverage allocation, sum-group validation (must total 1.00), pool reconciliation |
| `/admin/trail-config` | PhaseRuleEditor, PricingInputs, ThresholdSliders, PreviewSimulator | `TrailChallenge`, `PlatformConfig` | Snapshot population on enrollment, drawdown monitor (10s cron), countdown reset logic |
| `/admin/prop-firm` | `[TBD PLACEHOLDER]` Tier Templates, Phase Builder, Payout Cycles | `PropFirmAccount` (future) | Reserved schema space. Will follow snapshot discipline & sum-group rules when implemented. |
| `/admin/wallet` | TransactionTable, NetworkConfigCards, ApprovalQueue, LimitSettings | `Transaction`, `LedgerEntry`, `User` | Double-entry validation, dual-approval threshold, blockchain confirmation polling |
| `/admin/referrals` | CommissionTable, TreeViewer, ClawbackLog, RateEditor | `Referral`, `User` | 7-day dispute window, circular referral graph-walk, ledger reversal on clawback |
| `/admin/chat-mod` | MessageQueue, ReportTriage, Mute/BanControls, RateLimitStatus | `ChatMessage`, `ChatChannel`, `User` | Auto-hide on 3 reports, immutable after 15m, rate-limit decay cron |
| `/admin/notifications` | BroadcastComposer, TemplateEditor, DigestPreview | `Notification`, `User` | Dedup window (5m), digest batching (15m), channel routing per preference |
| `/admin/config` | ConfigCatalogUI, DeltaWarnings, AuditLogViewer, ForwardOnlyBanner | `PlatformConfig`, `ConfigAuditLog` | Redis cache invalidation, sum-group enforcement, type/bounds validation, CLI fallback |
| `/admin/audit-logs` | LogTable, FilterBar, ExportButton | `AuditLog`, `ConfigAuditLog`, `LedgerEntry` | Immutable append-only, 7-year retention, SIEM stream, read-only UI |
| `/admin/support` | TicketBoard, ReplyThread, SLATimers, EscalationToggle | `SupportTicket`, `User` | Auto-close (7d inactivity), reopen window (14d), round-robin assignment |

---

## 7. Client Dashboard Page Map

| Page / Route | Core Modules & Components | Data Relationships | Underlying Engine / Logic |
|--------------|---------------------------|-------------------|---------------------------|
| `/portal/overview` | WelcomeBanner, StatCards (Balance, Broker, Wallet, Trial), PortfolioChart, PositionCards, ActivityFeed | `User`, `CopyRelation`, `AccountSnapshot`, `LedgerEntry` | BalancePoller pub/sub, real-time P/L, capability endpoint for CTAs |
| `/portal/portfolio` | PositionTable, Filters, ClosePositionModal, P/LBreakdown, Chart | `CopyRelation`, `Trade`, `Settlement` | EquityProtector margin warnings, settlement rule snapshots, advisory lock on close |
| `/portal/signals` | SignalGrid, FilterSidebar, SortDropdown, SubscribeModal | `SignalStrategy`, `CopyRelation`, `InsuranceCoverage` | Fundraising countdown, coverage availability check, queue vs active status gating |
| `/portal/signals/:id` | ProviderProfile, PerformanceChart, HistoryTable, RiskMetrics, SubscribeCTA | `SignalStrategy`, `SettlementRule`, `Trade` | 90-day minimum track record, versioned settlement display, snapshot disclosure |
| `/portal/trade` | OrderEntry (Limit/Market/Stop), OrderBook, RecentTrades, OpenOrdersTable, SL/TPModal | `Trade`, `CopyRelation`, `MT5Account` | SymbolMap normalization, slippage tolerance (2%), idempotent order placement, liquidation thresholds |
| `/portal/trail` | ChallengeProgress (Level 1→2), DrawdownMeter, CountdownTimer, TradeLog, RefundStatus | `TrailChallenge`, `Trade`, `PlatformConfig` | 10s drawdown cron, trade count/WR calculation, cooldown enforcement, auto-refund on pass |
| `/portal/wallet` | BalanceCards, DepositForm (QR/Address), WithdrawForm (2FA/AddressBook), TransactionTable | `User`, `Transaction`, `LedgerEntry` | Network confirmation polling, auto/manual approval routing, double-entry ledger, fee hierarchy |
| `/portal/history` | TabbedTables (Trades, Deposits, Withdrawals), ExportButton, DateFilters | `Trade`, `Transaction`, `Settlement` | Idempotent settlement joins, status state machine, pagination with cursor |
| `/portal/referrals` | CodeBanner, TreeViewer, Leaderboard, EarningsTable, ShareModal | `Referral`, `User` | 3-tier commission calc, 7-day pending→paid transition, fraud detection (IP/device hash) |
| `/portal/activities` | LoginCalendar, TaskList, RewardClaims, BadgeGallery | `User`, `Config` | Streak reset cron, claim window (7d), milestone persistence, empty state rendering |
| `/portal/community` | NewsFeed, ChatWidget (Community/Strategy/DM), TelegramQR, ModerationBanner | `ChatChannel`, `ChatMessage`, `NewsSource` | Rate-limit enforcement, edit/delete window, report triage, auto-hide logic |
| `/portal/settings` | ProfileForm, SecurityPanel (2FA/Password/Sessions), PreferenceToggles, KYCStatus | `User`, `MT5Account`, `PlatformConfig` | Session invalidation on security change, refresh token rotation, preference inheritance |
| `/portal/notifications` | NotificationList, PreferenceToggles, MarkAllRead, ArchiveButton | `Notification`, `User` | Dedup window, channel routing, auto-archive (30d), WebSocket fanout |

---

## 8. Frontend Behavior & UI Standards (BEHAVIOR.md Summary)

| Pattern | Rule | Implementation |
|---------|------|----------------|
| **Error Taxonomy** | `U_` (Input), `S_` (State), `B_` (Business), `E_` (System) | Map `code` → inline/modal/toast/banner per §4 |
| **Affordance State** | Disabled controls MUST explain why + offer secondary CTA | Use `/capabilities/:action` endpoint, never hardcode |
| **Async Feedback** | <300ms none, 300ms-2s spinner, 2s-10s "Processing...", >10s progress/toast, >60s background task | Optimistic UI only for chat/profile. Never for money/trades. |
| **Confirmation Modals** | Required for subscriptions, withdrawals, 2FA changes, prop closure | 3-layer message, red destructive button with 1s delay |
| **Empty States** | Every list/table must have illustration + headline + CTA | Follow §10 structure, never show blank grids |
| **Accessibility** | ARIA live regions, keyboard trap in modals, WCAG AA contrast, color+icon pairing | Test with screen reader, haptic on mobile destructive |
| **Copy Voice** | Clear, respectful, action-oriented, specific, no exclamation in money contexts | Forbidden: "Oops", "Something went wrong", "Invalid input" |

---

## 9. Configurability & Admin Controls

### 9.1 Snapshot vs Always-Current Rule
| Config Type | Classification | Example |
|-------------|----------------|---------|
| Profit splits, trail rules, prop params, referral rates, trading fees | `snapshot` | Stored on entity `_snapshot` column at creation |
| Withdrawal fees, daily limits, min/max subscription, chat rate limits, poll intervals | `always-current` | Read fresh via `config.get()` at action time |

### 9.2 Admin Config Workflow
1. Admin edits key in `/admin/config`
2. Validation: type, bounds, sum-group (must total 1.00), delta warning (>±30%)
3. `config.set()` → writes Postgres, invalidates Redis cache, appends `config_audit_log`
4. Forward-only banner: `"⚠️ Changes apply to newly created entities only."`
5. Existing entities retain original `_snapshot` values forever

### 9.3 Key Naming Convention
`<domain>.<subcategory>.<specific>`  
Examples: `strategy.split.default.follower_pct`, `trail_mode.max_drawdown_pct`, `wallet.fee.withdrawal.erc20`

---

## 10. Prop Firm Placeholder (TBD)

| Aspect | Status | Notes |
|--------|--------|-------|
| **Schema** | Reserved | `PropFirmAccount` table created with `_snapshot` columns, status enum, payout tracking |
| **Config Keys** | Cataloged as TBD | `prop_firm.tier_*`, `prop_firm.phase_*`, `prop_firm.payout.*` marked `[TBD]` in `CONFIG_CATALOG.md` |
| **Logic** | Not implemented | Will follow snapshot discipline, sum-group validation, breach state machine, payout cycles when activated |
| **UI** | Placeholder route | `/admin/prop-firm` and `/portal/prop-firm` render "Coming Soon" with architecture notes |
| **Integration** | Trail Mode unlocks | `TrailChallenge.status = COMPLETED` → future flag `prop_firm_eligible = true` |

*Implementation will occur in Phase 4. All financial rules will adhere to §9 snapshot discipline and BEHAVIOR.md gating patterns.*

---

## 11. AI Agent Implementation Rules

### 11.1 Mandatory Pre-Build Checks
- [ ] Read `BEHAVIOR.md` before any UI code. Check error taxonomy, disabled states, empty states.
- [ ] Read `CONFIG_CATALOG.md` before any business logic. Identify snapshot vs always-current.
- [ ] No hardcoded financials. All numbers from `config.get()` or `_snapshot` columns.
- [ ] Use capability endpoints for gating. Never duplicate backend logic in frontend.
- [ ] Follow canonical error shape. Map `code` → UI pattern. Never show `trace_id` on non-system errors.

### 11.2 PR Rejection Criteria
❌ Hardcoded decimal literals in business logic  
❌ Reading current config for settlement calculations  
❌ Disabled buttons without tooltips/reasons  
❌ Showing `trace_id` for non-system errors  
❌ Optimistic UI for money movements  
❌ Mutating snapshot columns after creation  
❌ Missing empty states for lists/tables  
❌ New configurable not added to `CONFIG_CATALOG.md`  
❌ Sum groups not validated at write time  

### 11.3 Testing Requirements
- Unit tests for all atoms & settlement math
- Integration tests for copy engine activation gate
- E2E tests for subscription → copy → settlement flow
- Failure path tests: drawdown breach, insufficient coverage, duplicate subscription, WS disconnect
- Snapshot immutability tests: change config → verify existing entities unaffected

---

## 12. Compliance, Security & Audit

| Requirement | Implementation |
|-------------|----------------|
| **Audit Logging** | Immutable append-only table. 7-year retention. Real-time SIEM stream. Captures `before_state`/`after_state`. |
| **Data Retention** | Active data: indefinite. Banned PII: anonymize 90d. Chat: 2 years. Right-to-erasure: 30d window (excludes financial/audit). |
| **Encryption** | Broker credentials: AES-256-GCM, KMS-managed. Decrypted JIT for CopyPro calls, zeroed after use. |
| **KYC/AML** | FATF Travel Rule alignment. >$1k requires VERIFIED. >$10k triggers enhanced review. Structuring detection, sanctions check. |
| **Session Security** | JWT 15m access + 7d refresh. Rotation on refresh. Max 5 concurrent. Immediate invalidation on password/2FA change. |
| **Rate Limiting** | 100 req/min per IP. Burst protection. Differentiated by endpoint sensitivity. |
| **Disaster Recovery** | Daily DB backups (30d retention). RPO: 1h. RTO: 4h. CopyPro Mongo loss → rehydrate from Postgres via `/Start` replay. |

---

## Appendix A: Glossary
| Term | Definition |
|------|------------|
| **TCE** | Tradeverse Copy Engine — 3-layer architecture wrapping CopyPro vendor service |
| **Atlas Gold** | Insurance-backed 4-party profit-sharing strategy product |
| **Snapshot Discipline** | Entity stores config values at creation. Admin changes are forward-only. |
| **Capability Endpoint** | `/api/users/capabilities/:action` — single source of truth for UI gating |
| **Sum Group** | Set of config keys that must total exactly 1.00 (e.g., profit splits) |
| **Advisory Lock** | Postgres `pg_advisory_lock` for atomic state transitions (settlement, drawdown fail) |

## Appendix B: Quick Reference Checklist
**Before merging any PR:**
☐ No hardcoded financials  
☐ All configs classified snapshot/always-current  
☐ `_snapshot` columns populated & immutable  
☐ Sum groups validated  
☐ Error codes cataloged in BEHAVIOR.md §5  
☐ Disabled states explain why + offer CTA  
☐ Empty states implemented  
☐ Capability endpoints used for gating  
☐ Tests cover failure paths  
☐ `CONFIG_CATALOG.md` updated  
☐ Audit log entries added for state changes  

---
**Document Approval**  
Product Owner: Thuan Le | Date: _________  
Lead Engineer: _________ | Date: _________  
Compliance Officer: _________ | Date: _________  

*This PRD is the single source of truth for Tradeverse 2.0. All implementations must align with `BEHAVIOR.md`, `CONFIG_CATALOG.md`, and the snapshot discipline rule. Deviations require change request approval and version bump.*