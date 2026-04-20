# CONFIG_CATALOG.md — Tradeverse Configurable Values

**Purpose:** The authoritative catalog of every configurable value in Tradeverse. Every PR that introduces a new configurable adds a row here. Every PR that deprecates one marks it.

**Rules:**
- Every row has a **default value** that matches current PRD-specified behavior.
- Every row is classified as `snapshot` or `always-current` (see `BEHAVIOR.md §20.2`).
- Every row is categorized as `money-affecting` or `operational`.
- When a PR introduces a new configurable, it adds the row **before merge**.
- Rows are never deleted. Deprecated keys get a `[DEPRECATED in PR #X]` suffix but remain in the catalog for audit history.

---

## External Service URLs (operational)

> **NOTE:** These URLs are the single source of truth for all external integrations. Change them here and in the environment file (`.env` / `api/.env.example`) — no other file should hardcode these values.

| Key | Type | Default | Classification | Description | Added in |
|---|---|---|---|---|---|
| `copy_engine.base_url` | string | `https://copyback3.mrpc.pro` | always-current | CopyPro REST API base URL (backend calls this) | v2.0 seed |
| `copy_engine.frontend_url` | string | `https://copy3.mrpc.pro` | always-current | CopyPro Blazor UI reference URL (for manual verification) | v2.0 seed |
| `copy_engine.manager_key` | string | *(env)* | always-current | CopyPro manager userKey for admin endpoints | v2.0 seed |

---

## Strategy splits & limits (money-affecting)

| Key | Type | Default | Classification | Sum group | Description | Added in |
|---|---|---|---|---|---|---|
| `strategy.split.default.follower_pct` | decimal | 0.60 | snapshot | atlas_gold_default | Default follower share in Atlas Gold strategies | v2.0 seed |
| `strategy.split.default.trader_pct` | decimal | 0.20 | snapshot | atlas_gold_default | Default trader share in Atlas Gold | v2.0 seed |
| `strategy.split.default.insurance_investor_pct` | decimal | 0.15 | snapshot | atlas_gold_default | Default insurance investor share | v2.0 seed |
| `strategy.split.default.platform_pct` | decimal | 0.05 | snapshot | atlas_gold_default | Default platform share | v2.0 seed |
| `strategy.split.traditional.follower_pct` | decimal | 0.70 | snapshot | traditional_default | Follower share in traditional (non-insurance) strategies | v2.0 seed |
| `strategy.split.traditional.trader_pct` | decimal | 0.30 | snapshot | traditional_default | Trader share in traditional strategies | v2.0 seed |
| `strategy.limits.min_risk_capital` | decimal | 100.00 | always-current | — | Global minimum risk capital (USDT) for any subscription | v2.0 seed |
| `strategy.limits.max_risk_capital` | decimal | 50000.00 | always-current | — | Global maximum risk capital per user per strategy | v2.0 seed |
| `strategy.limits.max_drawdown_cap_pct` | decimal | 0.30 | snapshot | — | Max drawdown cap for a CopyRelation (30% default) | v2.0 seed |
| `strategy.limits.absolute_loss_cap_pct` | decimal | 0.50 | snapshot | — | Absolute loss floor — triggers emergency close | v2.0 seed |
| `strategy.limits.max_followers_per_strategy` | int | 500 | always-current | — | Max active CopyRelations per strategy (0 = unlimited) | v2.0 seed |
| `strategy.fundraising.countdown_days` | int | 14 | snapshot | — | Days before fundraising expires if target not met | v2.0 seed |

## Atlas Gold insurance (money-affecting)

| Key | Type | Default | Classification | Description | Added in |
|---|---|---|---|---|---|
| `atlas_gold.coverage_ratio_default` | decimal | 0.30 | snapshot | Default coverage ratio — % of follower loss covered by insurance | v2.0 seed |
| `atlas_gold.min_investor_deposit` | decimal | 500.00 | always-current | Min USDT to become an Insurance Investor | v2.0 seed |
| `atlas_gold.max_investor_exposure_per_strategy_pct` | decimal | 0.20 | always-current | Single investor concentration limit per strategy | v2.0 seed |
| `atlas_gold.global_investor_exposure_cap_pct` | decimal | 0.30 | always-current | Single investor cap on global Atlas Gold pool | v2.0 seed |
| `atlas_gold.withdrawal_max_queue_days` | int | 90 | always-current | Max days an investor withdrawal can stay queued | v2.0 seed |

## Trail Mode (money-affecting)

| Key | Type | Default | Classification | Description | Added in |
|---|---|---|---|---|---|
| `trail_mode.price_usdt` | decimal | 99.99 | snapshot | Subscription price in USDT | v2.0 seed |
| `trail_mode.initial_balance` | decimal | 10000.00 | snapshot | Starting simulated balance | v2.0 seed |
| `trail_mode.level_1.required_trades` | int | 10 | snapshot | Trades needed to pass Level 1 | v2.0 seed |
| `trail_mode.level_1.required_win_rate` | decimal | 0.60 | snapshot | Win rate needed to pass Level 1 | v2.0 seed |
| `trail_mode.level_2.required_trades` | int | 20 | snapshot | Trades needed to pass Level 2 | v2.0 seed |
| `trail_mode.level_2.required_win_rate` | decimal | 0.65 | snapshot | Win rate needed to pass Level 2 | v2.0 seed |
| `trail_mode.max_drawdown_pct` | decimal | 0.15 | snapshot | Auto-fail drawdown threshold | v2.0 seed |
| `trail_mode.countdown_days` | int | 30 | snapshot | Days before expiry (resets on each trade) | v2.0 seed |
| `trail_mode.cooldown_after_fail_days` | int | 7 | always-current | Cooldown before retry after fail/expire | v2.0 seed |

## Prop Firm (money-affecting)

| Key | Type | Default | Classification | Description | Added in |
|---|---|---|---|---|---|
| `prop_firm.tier_1.funded_balance` | decimal | 10000.00 | snapshot | Tier 1 funded account balance | v2.0 seed |
| `prop_firm.tier_2.funded_balance` | decimal | 25000.00 | snapshot | Tier 2 funded account balance | v2.0 seed |
| `prop_firm.tier_3.funded_balance` | decimal | 50000.00 | snapshot | Tier 3 funded account balance | v2.0 seed |
| `prop_firm.tier_4.funded_balance` | decimal | 100000.00 | snapshot | Tier 4 funded account balance | v2.0 seed |
| `prop_firm.tier_default.trader_split_pct` | decimal | 0.80 | snapshot | Trader's share of real profits | v2.0 seed |
| `prop_firm.tier_default.platform_split_pct` | decimal | 0.20 | snapshot | Platform's share (sum must equal 1.0 with trader) | v2.0 seed |
| `prop_firm.max_drawdown_pct` | decimal | 0.10 | snapshot | Breach threshold — account closed | v2.0 seed |
| `prop_firm.daily_loss_limit_pct` | decimal | 0.05 | snapshot | Daily loss limit — warning, 3 = breach | v2.0 seed |
| `prop_firm.min_trading_days_per_month` | int | 5 | snapshot | Min days traded per month | v2.0 seed |
| `prop_firm.payout.min_amount` | decimal | 100.00 | always-current | Minimum withdrawal request | v2.0 seed |
| `prop_firm.payout.cycle_days` | int | 14 | always-current | Days between payout requests | v2.0 seed |
| `prop_firm.payout.first_payout_account_age_days` | int | 30 | always-current | Min account age for first payout | v2.0 seed |
| `prop_firm.payout.manual_review_threshold` | decimal | 5000.00 | always-current | Admin review required above this amount | v2.0 seed |
| `prop_firm.scaling.consecutive_profitable_cycles` | int | 4 | always-current | Cycles required to scale up | v2.0 seed |
| `prop_firm.scaling.required_total_return_pct` | decimal | 0.10 | always-current | Total return required to scale up | v2.0 seed |
| `prop_firm.cooldown_after_breach_days` | int | 30 | always-current | Days before new Trail Mode after breach | v2.0 seed |

## Referral (money-affecting)

| Key | Type | Default | Classification | Description | Added in |
|---|---|---|---|---|---|
| `referral.rate.level_1` | decimal | 0.20 | snapshot | Direct referral commission rate | v2.0 seed |
| `referral.rate.level_2` | decimal | 0.10 | snapshot | Sub-referral (1 hop) commission rate | v2.0 seed |
| `referral.rate.level_3` | decimal | 0.05 | snapshot | Deep (2 hops) commission rate | v2.0 seed |
| `referral.dispute_window_days` | int | 7 | always-current | Days commission stays PENDING before PAID | v2.0 seed |
| `referral.code_regen_cooldown_days` | int | 30 | always-current | Days between code regenerations | v2.0 seed |
| `referral.clawback_window_days` | int | 30 | always-current | Days after signup during which commissions claw back on ban | v2.0 seed |
| `referral.max_accounts_per_household` | int | 3 | always-current | Max accounts from same IP/device/household | v2.0 seed |

## Wallet & transactions (money-affecting)

| Key | Type | Default | Classification | Description | Added in |
|---|---|---|---|---|---|
| `wallet.fee.withdrawal.erc20` | decimal | 5.00 | always-current | ERC20 withdrawal fee in USD | v2.0 seed |
| `wallet.fee.withdrawal.trc20` | decimal | 1.00 | always-current | TRC20 withdrawal fee in USD | v2.0 seed |
| `wallet.fee.withdrawal.bep20` | decimal | 0.50 | always-current | BEP20 withdrawal fee in USD | v2.0 seed |
| `wallet.limit.daily_withdrawal.default` | decimal | 50000.00 | always-current | Default daily withdrawal limit | v2.0 seed |
| `wallet.limit.min_withdrawal` | decimal | 10.00 | always-current | Minimum withdrawal amount | v2.0 seed |
| `wallet.limit.auto_approval_threshold` | decimal | 1000.00 | always-current | Auto-approve threshold (requires 2FA) | v2.0 seed |
| `wallet.limit.dual_approval_threshold` | decimal | 10000.00 | always-current | Requires 2 admin signatures | v2.0 seed |
| `wallet.deposit.confirmations.erc20` | int | 12 | always-current | ERC20 blocks to confirm | v2.0 seed |
| `wallet.deposit.confirmations.trc20` | int | 24 | always-current | TRC20 blocks to confirm | v2.0 seed |
| `wallet.deposit.confirmations.bep20` | int | 20 | always-current | BEP20 blocks to confirm | v2.0 seed |
| `wallet.deposit.timeout_hours` | int | 72 | always-current | Hours before unconfirmed deposit auto-cancels | v2.0 seed |
| `wallet.kyc.threshold_requires_verified` | decimal | 1000.00 | always-current | Withdrawals above this require KYC VERIFIED | v2.0 seed |

## Trading fees (money-affecting)

| Key | Type | Default | Classification | Description | Added in |
|---|---|---|---|---|---|
| `trading.fee.maker` | decimal | 0.001 | snapshot | Maker fee (0.1%) | v2.0 seed |
| `trading.fee.taker` | decimal | 0.0015 | snapshot | Taker fee (0.15%) | v2.0 seed |
| `trading.fee.liquidation` | decimal | 0.005 | snapshot | Liquidation fee (0.5%) | v2.0 seed |

## Authentication & sessions (operational)

| Key | Type | Default | Classification | Description | Added in |
|---|---|---|---|---|---|
| `auth.access_token_ttl_minutes` | int | 15 | always-current | Access token expiration | v2.0 seed |
| `auth.refresh_token_ttl_days` | int | 7 | always-current | Refresh token expiration | v2.0 seed |
| `auth.max_concurrent_sessions` | int | 5 | always-current | Max active sessions per user | v2.0 seed |
| `auth.brute_force.login_lockout_attempts` | int | 5 | always-current | Failed logins before 15-min lockout | v2.0 seed |
| `auth.brute_force.login_lockout_minutes` | int | 15 | always-current | Login lockout duration | v2.0 seed |
| `auth.brute_force.twofa_lockout_attempts` | int | 3 | always-current | Failed 2FA attempts before lockout | v2.0 seed |
| `auth.brute_force.twofa_lockout_hours` | int | 24 | always-current | 2FA lockout duration | v2.0 seed |
| `auth.password.min_length` | int | 12 | always-current | Min password length | v2.0 seed |
| `auth.password.history_blocked` | int | 5 | always-current | Blocks reusing last N passwords | v2.0 seed |

## Copy engine operational (operational)

| Key | Type | Default | Classification | Description | Added in |
|---|---|---|---|---|---|
| `ops.balance_poller.interval_minutes` | int | 30 | always-current | BalancePoller cron interval | v2.0 seed |
| `ops.balance_poller.max_retries` | int | 3 | always-current | Failures before marking DEGRADED | v2.0 seed |
| `ops.equity_protector.margin_warning_threshold` | int | 150 | always-current | Margin level that triggers warning notification | v2.0 seed |
| `ops.equity_protector.margin_emergency_threshold` | int | 110 | always-current | Margin level that triggers force close | v2.0 seed |
| `ops.equity_protector.ws_reconnect_timeout_seconds` | int | 60 | always-current | Seconds before falling back to polling | v2.0 seed |
| `ops.equity_protector.ws_poll_fallback_seconds` | int | 10 | always-current | Poll interval when WS disconnected | v2.0 seed |
| `ops.equity_protector.persist_interval_seconds` | int | 5 | always-current | How often to persist state to Postgres | v2.0 seed |
| `ops.copypro.circuit_breaker.fail_threshold` | int | 5 | always-current | Consecutive fails before opening | v2.0 seed |
| `ops.copypro.circuit_breaker.window_seconds` | int | 60 | always-current | Window for fail threshold | v2.0 seed |
| `ops.copypro.circuit_breaker.reset_seconds` | int | 30 | always-current | Half-open probe interval | v2.0 seed |
| `ops.copypro.start_timeout_seconds` | int | 10 | always-current | Timeout for /Start calls | v2.0 seed |
| `ops.copypro.read_timeout_seconds` | int | 5 | always-current | Timeout for read operations | v2.0 seed |
| `ops.copypro.closed_orders_sync_seconds` | int | 60 | always-current | Polling interval for /ClosedOrdersAll | v2.0 seed |
| `ops.mtapi.token_refresh_minutes` | int | 55 | always-current | Token refresh before 60-min broker timeout | v2.0 seed |

## Chat (operational)

| Key | Type | Default | Classification | Description | Added in |
|---|---|---|---|---|---|
| `ops.chat.rate_limit.normal_user.per_min` | int | 10 | always-current | Messages per minute (normal user) | v2.0 seed |
| `ops.chat.rate_limit.normal_user.per_hour` | int | 50 | always-current | Messages per hour (normal user) | v2.0 seed |
| `ops.chat.rate_limit.trader.per_min` | int | 30 | always-current | Messages per minute (trader in own room) | v2.0 seed |
| `ops.chat.rate_limit.trader.per_hour` | int | 200 | always-current | Messages per hour (trader) | v2.0 seed |
| `ops.chat.rate_limit.dm.per_min` | int | 30 | always-current | DM messages per minute per pair | v2.0 seed |
| `ops.chat.edit_window_minutes` | int | 15 | always-current | Minutes allowed to edit/delete | v2.0 seed |
| `ops.chat.auto_hide_report_count` | int | 3 | always-current | Distinct reports that trigger auto-hide | v2.0 seed |
| `ops.chat.message_max_length.community` | int | 4000 | always-current | Community/strategy max message length | v2.0 seed |
| `ops.chat.message_max_length.dm` | int | 10000 | always-current | DM max message length | v2.0 seed |
| `ops.chat.dm.max_pending_requests` | int | 10 | always-current | Max outbound DM requests pending | v2.0 seed |

## Notifications (operational)

| Key | Type | Default | Classification | Description | Added in |
|---|---|---|---|---|---|
| `ops.notification.digest_interval_minutes` | int | 15 | always-current | Email digest batch interval | v2.0 seed |
| `ops.notification.dedup_window_minutes` | int | 5 | always-current | Identical notifications dedup window | v2.0 seed |
| `ops.notification.auto_archive_days` | int | 30 | always-current | Days before read notifications archive | v2.0 seed |

## Support tickets (operational)

| Key | Type | Default | Classification | Description | Added in |
|---|---|---|---|---|---|
| `ops.tickets.sla_response_hours` | int | 24 | always-current | Response SLA | v2.0 seed |
| `ops.tickets.sla_escalation_hours` | int | 48 | always-current | Auto-escalation threshold | v2.0 seed |
| `ops.tickets.auto_close_days` | int | 7 | always-current | Days of inactivity before auto-close | v2.0 seed |
| `ops.tickets.reopen_window_days` | int | 14 | always-current | Days after resolution reopen is allowed | v2.0 seed |

## Activities & rewards (operational)

| Key | Type | Default | Classification | Description | Added in |
|---|---|---|---|---|---|
| `ops.activities.streak_max_days` | int | 365 | always-current | Max streak counter | v2.0 seed |
| `ops.activities.reward_claim_window_days` | int | 7 | always-current | Days to claim before forfeit | v2.0 seed |

## Data retention (compliance)

| Key | Type | Default | Classification | Description | Added in |
|---|---|---|---|---|---|
| `compliance.retention.audit_log_years` | int | 7 | always-current | Audit log retention | v2.0 seed |
| `compliance.retention.chat_messages_years` | int | 2 | always-current | Chat message retention | v2.0 seed |
| `compliance.retention.banned_pii_anonymize_days` | int | 90 | always-current | Days before banned user PII is anonymized | v2.0 seed |
| `compliance.retention.erasure_processing_days` | int | 30 | always-current | Right-to-erasure processing window | v2.0 seed |

---

## Sum groups (validation-enforced)

These groups must total exactly 1.00 on every change. `config.set()` rejects any write that breaks the sum.

| Sum group | Keys | Must total |
|---|---|---|
| `atlas_gold_default` | follower_pct + trader_pct + insurance_investor_pct + platform_pct | 1.00 |
| `traditional_default` | follower_pct + trader_pct | 1.00 |
| `prop_firm_tier_default_split` | trader_split_pct + platform_split_pct | 1.00 |

Any new Atlas Gold strategy created by admin inherits a new sum_group: `atlas_gold_<strategy_key>`.

---

## Deprecation log

*(empty)*

---

**End of CONFIG_CATALOG.md — initial seed.**
Every PR introducing or removing a configurable updates this file.
