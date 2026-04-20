/**
 * config-catalog.ts
 *
 * Authoritative TypeScript contract for every configurable value in Tradeverse.
 * Source of truth: docs/blueprint/CONFIG_CATALOG.md
 *
 * SPLIT SUM VERIFICATION (C-03):
 *   atlas_gold_default:      follower(0.60) + trader(0.20) + insurance_investor(0.15) + platform(0.05) = 1.00 ✓
 *   traditional_default:     follower(0.70) + trader(0.30)                                              = 1.00 ✓
 *   prop_firm_tier_default:  trader(0.80)   + platform(0.20)                                            = 1.00 ✓
 *
 * RULES:
 * - All monetary/percentage values use Decimal (C-02 — never `number` for money).
 * - Settlement code reads from entity snapshot columns, never from config.get() (C-20).
 * - Every key has a non-null default matching PRD behavior (C-21).
 * - This file defines types and catalog constants only. No implementation.
 */

import { Decimal } from '@prisma/client/runtime/library';

// ---------------------------------------------------------------------------
// ConfigKey — literal union of every key in CONFIG_CATALOG.md
// ---------------------------------------------------------------------------

/**
 * Literal union of every config key in the Tradeverse platform.
 * Add new keys here AND in CONFIG_CATALOG.md — never one without the other.
 */
export type ConfigKey =
  // External Service URLs
  | 'copy_engine.base_url'
  | 'copy_engine.frontend_url'
  | 'copy_engine.manager_key'

  // Strategy splits — atlas_gold_default sum group (must total 1.00)
  | 'strategy.split.default.follower_pct'
  | 'strategy.split.default.trader_pct'
  | 'strategy.split.default.insurance_investor_pct'
  | 'strategy.split.default.platform_pct'

  // Strategy splits — traditional_default sum group (must total 1.00)
  | 'strategy.split.traditional.follower_pct'
  | 'strategy.split.traditional.trader_pct'

  // Strategy limits
  | 'strategy.limits.min_risk_capital'
  | 'strategy.limits.max_risk_capital'
  | 'strategy.limits.max_drawdown_cap_pct'
  | 'strategy.limits.absolute_loss_cap_pct'
  | 'strategy.limits.max_followers_per_strategy'
  | 'strategy.fundraising.countdown_days'

  // Atlas Gold insurance
  | 'atlas_gold.coverage_ratio_default'
  | 'atlas_gold.min_investor_deposit'
  | 'atlas_gold.max_investor_exposure_per_strategy_pct'
  | 'atlas_gold.global_investor_exposure_cap_pct'
  | 'atlas_gold.withdrawal_max_queue_days'

  // Trail Mode
  | 'trail_mode.price_usdt'
  | 'trail_mode.initial_balance'
  | 'trail_mode.level_1.required_trades'
  | 'trail_mode.level_1.required_win_rate'
  | 'trail_mode.level_2.required_trades'
  | 'trail_mode.level_2.required_win_rate'
  | 'trail_mode.max_drawdown_pct'
  | 'trail_mode.countdown_days'
  | 'trail_mode.cooldown_after_fail_days'

  // Prop Firm — funded balances
  | 'prop_firm.tier_1.funded_balance'
  | 'prop_firm.tier_2.funded_balance'
  | 'prop_firm.tier_3.funded_balance'
  | 'prop_firm.tier_4.funded_balance'

  // Prop Firm — default splits (prop_firm_tier_default_split sum group, must total 1.00)
  | 'prop_firm.tier_default.trader_split_pct'
  | 'prop_firm.tier_default.platform_split_pct'

  // Prop Firm — risk parameters
  | 'prop_firm.max_drawdown_pct'
  | 'prop_firm.daily_loss_limit_pct'
  | 'prop_firm.min_trading_days_per_month'

  // Prop Firm — payouts
  | 'prop_firm.payout.min_amount'
  | 'prop_firm.payout.cycle_days'
  | 'prop_firm.payout.first_payout_account_age_days'
  | 'prop_firm.payout.manual_review_threshold'

  // Prop Firm — scaling
  | 'prop_firm.scaling.consecutive_profitable_cycles'
  | 'prop_firm.scaling.required_total_return_pct'
  | 'prop_firm.cooldown_after_breach_days'

  // Referral
  | 'referral.rate.level_1'
  | 'referral.rate.level_2'
  | 'referral.rate.level_3'
  | 'referral.dispute_window_days'
  | 'referral.code_regen_cooldown_days'
  | 'referral.clawback_window_days'
  | 'referral.max_accounts_per_household'

  // Wallet — fees
  | 'wallet.fee.withdrawal.erc20'
  | 'wallet.fee.withdrawal.trc20'
  | 'wallet.fee.withdrawal.bep20'

  // Wallet — limits
  | 'wallet.limit.daily_withdrawal.default'
  | 'wallet.limit.min_withdrawal'
  | 'wallet.limit.auto_approval_threshold'
  | 'wallet.limit.dual_approval_threshold'

  // Wallet — deposit confirmations
  | 'wallet.deposit.confirmations.erc20'
  | 'wallet.deposit.confirmations.trc20'
  | 'wallet.deposit.confirmations.bep20'
  | 'wallet.deposit.timeout_hours'

  // Wallet — KYC
  | 'wallet.kyc.threshold_requires_verified'

  // Trading fees
  | 'trading.fee.maker'
  | 'trading.fee.taker'
  | 'trading.fee.liquidation'

  // Auth & sessions
  | 'auth.access_token_ttl_minutes'
  | 'auth.refresh_token_ttl_days'
  | 'auth.max_concurrent_sessions'
  | 'auth.brute_force.login_lockout_attempts'
  | 'auth.brute_force.login_lockout_minutes'
  | 'auth.brute_force.twofa_lockout_attempts'
  | 'auth.brute_force.twofa_lockout_hours'
  | 'auth.password.min_length'
  | 'auth.password.history_blocked'

  // Copy engine operational
  | 'ops.balance_poller.interval_minutes'
  | 'ops.balance_poller.max_retries'
  | 'ops.equity_protector.margin_warning_threshold'
  | 'ops.equity_protector.margin_emergency_threshold'
  | 'ops.equity_protector.ws_reconnect_timeout_seconds'
  | 'ops.equity_protector.ws_poll_fallback_seconds'
  | 'ops.equity_protector.persist_interval_seconds'
  | 'ops.copypro.circuit_breaker.fail_threshold'
  | 'ops.copypro.circuit_breaker.window_seconds'
  | 'ops.copypro.circuit_breaker.reset_seconds'
  | 'ops.copypro.start_timeout_seconds'
  | 'ops.copypro.read_timeout_seconds'
  | 'ops.copypro.closed_orders_sync_seconds'
  | 'ops.mtapi.token_refresh_minutes'

  // Chat
  | 'ops.chat.rate_limit.normal_user.per_min'
  | 'ops.chat.rate_limit.normal_user.per_hour'
  | 'ops.chat.rate_limit.trader.per_min'
  | 'ops.chat.rate_limit.trader.per_hour'
  | 'ops.chat.rate_limit.dm.per_min'
  | 'ops.chat.edit_window_minutes'
  | 'ops.chat.auto_hide_report_count'
  | 'ops.chat.message_max_length.community'
  | 'ops.chat.message_max_length.dm'
  | 'ops.chat.dm.max_pending_requests'

  // Notifications
  | 'ops.notification.digest_interval_minutes'
  | 'ops.notification.dedup_window_minutes'
  | 'ops.notification.auto_archive_days'

  // Support tickets
  | 'ops.tickets.sla_response_hours'
  | 'ops.tickets.sla_escalation_hours'
  | 'ops.tickets.auto_close_days'
  | 'ops.tickets.reopen_window_days'

  // Activities & rewards
  | 'ops.activities.streak_max_days'
  | 'ops.activities.reward_claim_window_days'

  // Compliance / data retention
  | 'compliance.retention.audit_log_years'
  | 'compliance.retention.chat_messages_years'
  | 'compliance.retention.banned_pii_anonymize_days'
  | 'compliance.retention.erasure_processing_days';

// ---------------------------------------------------------------------------
// ConfigValueType — per-key TypeScript type mapping
// ---------------------------------------------------------------------------

/**
 * Maps each ConfigKey to its TypeScript value type.
 *
 * Monetary and percentage values use `Decimal` per C-02.
 * Integer counts and durations use `number`.
 * URL / secret values use `string`.
 */
export type ConfigValueType = {
  // External Service URLs
  'copy_engine.base_url': string;
  'copy_engine.frontend_url': string;
  'copy_engine.manager_key': string;

  // Strategy splits — atlas_gold_default
  'strategy.split.default.follower_pct': Decimal;
  'strategy.split.default.trader_pct': Decimal;
  'strategy.split.default.insurance_investor_pct': Decimal;
  'strategy.split.default.platform_pct': Decimal;

  // Strategy splits — traditional_default
  'strategy.split.traditional.follower_pct': Decimal;
  'strategy.split.traditional.trader_pct': Decimal;

  // Strategy limits
  'strategy.limits.min_risk_capital': Decimal;
  'strategy.limits.max_risk_capital': Decimal;
  'strategy.limits.max_drawdown_cap_pct': Decimal;
  'strategy.limits.absolute_loss_cap_pct': Decimal;
  'strategy.limits.max_followers_per_strategy': number;
  'strategy.fundraising.countdown_days': number;

  // Atlas Gold insurance
  'atlas_gold.coverage_ratio_default': Decimal;
  'atlas_gold.min_investor_deposit': Decimal;
  'atlas_gold.max_investor_exposure_per_strategy_pct': Decimal;
  'atlas_gold.global_investor_exposure_cap_pct': Decimal;
  'atlas_gold.withdrawal_max_queue_days': number;

  // Trail Mode
  'trail_mode.price_usdt': Decimal;
  'trail_mode.initial_balance': Decimal;
  'trail_mode.level_1.required_trades': number;
  'trail_mode.level_1.required_win_rate': Decimal;
  'trail_mode.level_2.required_trades': number;
  'trail_mode.level_2.required_win_rate': Decimal;
  'trail_mode.max_drawdown_pct': Decimal;
  'trail_mode.countdown_days': number;
  'trail_mode.cooldown_after_fail_days': number;

  // Prop Firm — funded balances
  'prop_firm.tier_1.funded_balance': Decimal;
  'prop_firm.tier_2.funded_balance': Decimal;
  'prop_firm.tier_3.funded_balance': Decimal;
  'prop_firm.tier_4.funded_balance': Decimal;

  // Prop Firm — default splits
  'prop_firm.tier_default.trader_split_pct': Decimal;
  'prop_firm.tier_default.platform_split_pct': Decimal;

  // Prop Firm — risk parameters
  'prop_firm.max_drawdown_pct': Decimal;
  'prop_firm.daily_loss_limit_pct': Decimal;
  'prop_firm.min_trading_days_per_month': number;

  // Prop Firm — payouts
  'prop_firm.payout.min_amount': Decimal;
  'prop_firm.payout.cycle_days': number;
  'prop_firm.payout.first_payout_account_age_days': number;
  'prop_firm.payout.manual_review_threshold': Decimal;

  // Prop Firm — scaling
  'prop_firm.scaling.consecutive_profitable_cycles': number;
  'prop_firm.scaling.required_total_return_pct': Decimal;
  'prop_firm.cooldown_after_breach_days': number;

  // Referral
  'referral.rate.level_1': Decimal;
  'referral.rate.level_2': Decimal;
  'referral.rate.level_3': Decimal;
  'referral.dispute_window_days': number;
  'referral.code_regen_cooldown_days': number;
  'referral.clawback_window_days': number;
  'referral.max_accounts_per_household': number;

  // Wallet — fees
  'wallet.fee.withdrawal.erc20': Decimal;
  'wallet.fee.withdrawal.trc20': Decimal;
  'wallet.fee.withdrawal.bep20': Decimal;

  // Wallet — limits
  'wallet.limit.daily_withdrawal.default': Decimal;
  'wallet.limit.min_withdrawal': Decimal;
  'wallet.limit.auto_approval_threshold': Decimal;
  'wallet.limit.dual_approval_threshold': Decimal;

  // Wallet — deposit confirmations
  'wallet.deposit.confirmations.erc20': number;
  'wallet.deposit.confirmations.trc20': number;
  'wallet.deposit.confirmations.bep20': number;
  'wallet.deposit.timeout_hours': number;

  // Wallet — KYC
  'wallet.kyc.threshold_requires_verified': Decimal;

  // Trading fees
  'trading.fee.maker': Decimal;
  'trading.fee.taker': Decimal;
  'trading.fee.liquidation': Decimal;

  // Auth & sessions
  'auth.access_token_ttl_minutes': number;
  'auth.refresh_token_ttl_days': number;
  'auth.max_concurrent_sessions': number;
  'auth.brute_force.login_lockout_attempts': number;
  'auth.brute_force.login_lockout_minutes': number;
  'auth.brute_force.twofa_lockout_attempts': number;
  'auth.brute_force.twofa_lockout_hours': number;
  'auth.password.min_length': number;
  'auth.password.history_blocked': number;

  // Copy engine operational
  'ops.balance_poller.interval_minutes': number;
  'ops.balance_poller.max_retries': number;
  'ops.equity_protector.margin_warning_threshold': number;
  'ops.equity_protector.margin_emergency_threshold': number;
  'ops.equity_protector.ws_reconnect_timeout_seconds': number;
  'ops.equity_protector.ws_poll_fallback_seconds': number;
  'ops.equity_protector.persist_interval_seconds': number;
  'ops.copypro.circuit_breaker.fail_threshold': number;
  'ops.copypro.circuit_breaker.window_seconds': number;
  'ops.copypro.circuit_breaker.reset_seconds': number;
  'ops.copypro.start_timeout_seconds': number;
  'ops.copypro.read_timeout_seconds': number;
  'ops.copypro.closed_orders_sync_seconds': number;
  'ops.mtapi.token_refresh_minutes': number;

  // Chat
  'ops.chat.rate_limit.normal_user.per_min': number;
  'ops.chat.rate_limit.normal_user.per_hour': number;
  'ops.chat.rate_limit.trader.per_min': number;
  'ops.chat.rate_limit.trader.per_hour': number;
  'ops.chat.rate_limit.dm.per_min': number;
  'ops.chat.edit_window_minutes': number;
  'ops.chat.auto_hide_report_count': number;
  'ops.chat.message_max_length.community': number;
  'ops.chat.message_max_length.dm': number;
  'ops.chat.dm.max_pending_requests': number;

  // Notifications
  'ops.notification.digest_interval_minutes': number;
  'ops.notification.dedup_window_minutes': number;
  'ops.notification.auto_archive_days': number;

  // Support tickets
  'ops.tickets.sla_response_hours': number;
  'ops.tickets.sla_escalation_hours': number;
  'ops.tickets.auto_close_days': number;
  'ops.tickets.reopen_window_days': number;

  // Activities & rewards
  'ops.activities.streak_max_days': number;
  'ops.activities.reward_claim_window_days': number;

  // Compliance / data retention
  'compliance.retention.audit_log_years': number;
  'compliance.retention.chat_messages_years': number;
  'compliance.retention.banned_pii_anonymize_days': number;
  'compliance.retention.erasure_processing_days': number;
};

// ---------------------------------------------------------------------------
// ConfigEntry — shape for each catalog entry
// ---------------------------------------------------------------------------

/**
 * Classification drives snapshot vs always-current behavior per BEHAVIOR.md §20.2.
 * - `snapshot`: value is frozen on entity at creation (CopyRelation, TrailChallenge, etc.)
 * - `always-current`: value is read fresh from config store at each use
 */
export type ConfigClassification = 'snapshot' | 'always-current';

/** Broad domain grouping used for admin UI and audit filtering. */
export type ConfigCategory =
  | 'external-service'
  | 'strategy'
  | 'atlas-gold'
  | 'trail-mode'
  | 'prop-firm'
  | 'referral'
  | 'wallet'
  | 'trading'
  | 'auth'
  | 'ops'
  | 'compliance';

/**
 * A single entry in CONFIG_CATALOG.
 * The `default` field is typed via the K generic so callers get exact types.
 */
export interface ConfigEntry<K extends ConfigKey> {
  /** PRD-specified default value. Must be non-null (C-21). */
  readonly default: ConfigValueType[K];
  /** TypeScript type tag — matches the key in ConfigValueType. */
  readonly type: 'Decimal' | 'number' | 'string';
  /** snapshot = frozen on entity; always-current = read at use time (BEHAVIOR.md §20.2) */
  readonly classification: ConfigClassification;
  /** Domain grouping for admin tooling and domain-scoped imports. */
  readonly category: ConfigCategory;
  /** If this key belongs to a sum group, the group name. Config writes validate the sum. */
  readonly sumGroup?: string;
  /** Human-readable description matching CONFIG_CATALOG.md. */
  readonly description: string;
}

// ---------------------------------------------------------------------------
// CONFIG_CATALOG — the full catalog const
// ---------------------------------------------------------------------------

/**
 * The complete platform config catalog. Every configurable value in Tradeverse.
 *
 * Default values match current PRD behavior (C-21).
 * Monetary/percentage defaults use `new Decimal(...)` (C-02).
 *
 * Sum group verification (C-03):
 *   atlas_gold_default:     0.60 + 0.20 + 0.15 + 0.05 = 1.00 ✓
 *   traditional_default:    0.70 + 0.30               = 1.00 ✓
 *   prop_firm_tier_default: 0.80 + 0.20               = 1.00 ✓
 */
export const CONFIG_CATALOG = {
  // -------------------------------------------------------------------------
  // External Service URLs
  // -------------------------------------------------------------------------

  'copy_engine.base_url': {
    default: 'https://copyback3.mrpc.pro',
    type: 'string',
    classification: 'always-current',
    category: 'external-service',
    description: 'CopyPro REST API base URL (backend calls this)',
  },
  'copy_engine.frontend_url': {
    default: 'https://copy3.mrpc.pro',
    type: 'string',
    classification: 'always-current',
    category: 'external-service',
    description: 'CopyPro Blazor UI reference URL (for manual verification)',
  },
  'copy_engine.manager_key': {
    default: '',
    type: 'string',
    classification: 'always-current',
    category: 'external-service',
    description: 'CopyPro manager userKey for admin endpoints — set via env',
  },

  // -------------------------------------------------------------------------
  // Strategy splits — atlas_gold_default sum group
  // Sum: 0.60 + 0.20 + 0.15 + 0.05 = 1.00
  // -------------------------------------------------------------------------

  'strategy.split.default.follower_pct': {
    default: new Decimal('0.60'),
    type: 'Decimal',
    classification: 'snapshot',
    category: 'strategy',
    sumGroup: 'atlas_gold_default',
    description: 'Default follower share in Atlas Gold strategies',
  },
  'strategy.split.default.trader_pct': {
    default: new Decimal('0.20'),
    type: 'Decimal',
    classification: 'snapshot',
    category: 'strategy',
    sumGroup: 'atlas_gold_default',
    description: 'Default trader share in Atlas Gold',
  },
  'strategy.split.default.insurance_investor_pct': {
    default: new Decimal('0.15'),
    type: 'Decimal',
    classification: 'snapshot',
    category: 'strategy',
    sumGroup: 'atlas_gold_default',
    description: 'Default insurance investor share',
  },
  'strategy.split.default.platform_pct': {
    default: new Decimal('0.05'),
    type: 'Decimal',
    classification: 'snapshot',
    category: 'strategy',
    sumGroup: 'atlas_gold_default',
    description: 'Default platform share',
  },

  // -------------------------------------------------------------------------
  // Strategy splits — traditional_default sum group
  // Sum: 0.70 + 0.30 = 1.00
  // -------------------------------------------------------------------------

  'strategy.split.traditional.follower_pct': {
    default: new Decimal('0.70'),
    type: 'Decimal',
    classification: 'snapshot',
    category: 'strategy',
    sumGroup: 'traditional_default',
    description: 'Follower share in traditional (non-insurance) strategies',
  },
  'strategy.split.traditional.trader_pct': {
    default: new Decimal('0.30'),
    type: 'Decimal',
    classification: 'snapshot',
    category: 'strategy',
    sumGroup: 'traditional_default',
    description: 'Trader share in traditional strategies',
  },

  // -------------------------------------------------------------------------
  // Strategy limits
  // -------------------------------------------------------------------------

  'strategy.limits.min_risk_capital': {
    default: new Decimal('100.00'),
    type: 'Decimal',
    classification: 'always-current',
    category: 'strategy',
    description: 'Global minimum risk capital (USDT) for any subscription',
  },
  'strategy.limits.max_risk_capital': {
    default: new Decimal('50000.00'),
    type: 'Decimal',
    classification: 'always-current',
    category: 'strategy',
    description: 'Global maximum risk capital per user per strategy',
  },
  'strategy.limits.max_drawdown_cap_pct': {
    default: new Decimal('0.30'),
    type: 'Decimal',
    classification: 'snapshot',
    category: 'strategy',
    description: 'Max drawdown cap for a CopyRelation (30% default)',
  },
  'strategy.limits.absolute_loss_cap_pct': {
    default: new Decimal('0.50'),
    type: 'Decimal',
    classification: 'snapshot',
    category: 'strategy',
    description: 'Absolute loss floor — triggers emergency close',
  },
  'strategy.limits.max_followers_per_strategy': {
    default: 500,
    type: 'number',
    classification: 'always-current',
    category: 'strategy',
    description: 'Max active CopyRelations per strategy (0 = unlimited)',
  },
  'strategy.fundraising.countdown_days': {
    default: 14,
    type: 'number',
    classification: 'snapshot',
    category: 'strategy',
    description: 'Days before fundraising expires if target not met',
  },

  // -------------------------------------------------------------------------
  // Atlas Gold insurance
  // -------------------------------------------------------------------------

  'atlas_gold.coverage_ratio_default': {
    default: new Decimal('0.30'),
    type: 'Decimal',
    classification: 'snapshot',
    category: 'atlas-gold',
    description: 'Default coverage ratio — % of follower loss covered by insurance',
  },
  'atlas_gold.min_investor_deposit': {
    default: new Decimal('500.00'),
    type: 'Decimal',
    classification: 'always-current',
    category: 'atlas-gold',
    description: 'Min USDT to become an Insurance Investor',
  },
  'atlas_gold.max_investor_exposure_per_strategy_pct': {
    default: new Decimal('0.20'),
    type: 'Decimal',
    classification: 'always-current',
    category: 'atlas-gold',
    description: 'Single investor concentration limit per strategy',
  },
  'atlas_gold.global_investor_exposure_cap_pct': {
    default: new Decimal('0.30'),
    type: 'Decimal',
    classification: 'always-current',
    category: 'atlas-gold',
    description: 'Single investor cap on global Atlas Gold pool',
  },
  'atlas_gold.withdrawal_max_queue_days': {
    default: 90,
    type: 'number',
    classification: 'always-current',
    category: 'atlas-gold',
    description: 'Max days an investor withdrawal can stay queued',
  },

  // -------------------------------------------------------------------------
  // Trail Mode
  // -------------------------------------------------------------------------

  'trail_mode.price_usdt': {
    default: new Decimal('99.99'),
    type: 'Decimal',
    classification: 'snapshot',
    category: 'trail-mode',
    description: 'Subscription price in USDT',
  },
  'trail_mode.initial_balance': {
    default: new Decimal('10000.00'),
    type: 'Decimal',
    classification: 'snapshot',
    category: 'trail-mode',
    description: 'Starting simulated balance',
  },
  'trail_mode.level_1.required_trades': {
    default: 10,
    type: 'number',
    classification: 'snapshot',
    category: 'trail-mode',
    description: 'Trades needed to pass Level 1',
  },
  'trail_mode.level_1.required_win_rate': {
    default: new Decimal('0.60'),
    type: 'Decimal',
    classification: 'snapshot',
    category: 'trail-mode',
    description: 'Win rate needed to pass Level 1',
  },
  'trail_mode.level_2.required_trades': {
    default: 20,
    type: 'number',
    classification: 'snapshot',
    category: 'trail-mode',
    description: 'Trades needed to pass Level 2',
  },
  'trail_mode.level_2.required_win_rate': {
    default: new Decimal('0.65'),
    type: 'Decimal',
    classification: 'snapshot',
    category: 'trail-mode',
    description: 'Win rate needed to pass Level 2',
  },
  'trail_mode.max_drawdown_pct': {
    default: new Decimal('0.15'),
    type: 'Decimal',
    classification: 'snapshot',
    category: 'trail-mode',
    description: 'Auto-fail drawdown threshold',
  },
  'trail_mode.countdown_days': {
    default: 30,
    type: 'number',
    classification: 'snapshot',
    category: 'trail-mode',
    description: 'Days before expiry (resets on each trade)',
  },
  'trail_mode.cooldown_after_fail_days': {
    default: 7,
    type: 'number',
    classification: 'always-current',
    category: 'trail-mode',
    description: 'Cooldown before retry after fail/expire',
  },

  // -------------------------------------------------------------------------
  // Prop Firm — funded balances
  // -------------------------------------------------------------------------

  'prop_firm.tier_1.funded_balance': {
    default: new Decimal('10000.00'),
    type: 'Decimal',
    classification: 'snapshot',
    category: 'prop-firm',
    description: 'Tier 1 funded account balance',
  },
  'prop_firm.tier_2.funded_balance': {
    default: new Decimal('25000.00'),
    type: 'Decimal',
    classification: 'snapshot',
    category: 'prop-firm',
    description: 'Tier 2 funded account balance',
  },
  'prop_firm.tier_3.funded_balance': {
    default: new Decimal('50000.00'),
    type: 'Decimal',
    classification: 'snapshot',
    category: 'prop-firm',
    description: 'Tier 3 funded account balance',
  },
  'prop_firm.tier_4.funded_balance': {
    default: new Decimal('100000.00'),
    type: 'Decimal',
    classification: 'snapshot',
    category: 'prop-firm',
    description: 'Tier 4 funded account balance',
  },

  // -------------------------------------------------------------------------
  // Prop Firm — default splits (prop_firm_tier_default_split sum group)
  // Sum: 0.80 + 0.20 = 1.00
  // -------------------------------------------------------------------------

  'prop_firm.tier_default.trader_split_pct': {
    default: new Decimal('0.80'),
    type: 'Decimal',
    classification: 'snapshot',
    category: 'prop-firm',
    sumGroup: 'prop_firm_tier_default_split',
    description: "Trader's share of real profits",
  },
  'prop_firm.tier_default.platform_split_pct': {
    default: new Decimal('0.20'),
    type: 'Decimal',
    classification: 'snapshot',
    category: 'prop-firm',
    sumGroup: 'prop_firm_tier_default_split',
    description: "Platform's share (sum must equal 1.0 with trader)",
  },

  // -------------------------------------------------------------------------
  // Prop Firm — risk parameters
  // -------------------------------------------------------------------------

  'prop_firm.max_drawdown_pct': {
    default: new Decimal('0.10'),
    type: 'Decimal',
    classification: 'snapshot',
    category: 'prop-firm',
    description: 'Breach threshold — account closed',
  },
  'prop_firm.daily_loss_limit_pct': {
    default: new Decimal('0.05'),
    type: 'Decimal',
    classification: 'snapshot',
    category: 'prop-firm',
    description: 'Daily loss limit — warning, 3 = breach',
  },
  'prop_firm.min_trading_days_per_month': {
    default: 5,
    type: 'number',
    classification: 'snapshot',
    category: 'prop-firm',
    description: 'Min days traded per month',
  },

  // -------------------------------------------------------------------------
  // Prop Firm — payouts
  // -------------------------------------------------------------------------

  'prop_firm.payout.min_amount': {
    default: new Decimal('100.00'),
    type: 'Decimal',
    classification: 'always-current',
    category: 'prop-firm',
    description: 'Minimum withdrawal request',
  },
  'prop_firm.payout.cycle_days': {
    default: 14,
    type: 'number',
    classification: 'always-current',
    category: 'prop-firm',
    description: 'Days between payout requests',
  },
  'prop_firm.payout.first_payout_account_age_days': {
    default: 30,
    type: 'number',
    classification: 'always-current',
    category: 'prop-firm',
    description: 'Min account age for first payout',
  },
  'prop_firm.payout.manual_review_threshold': {
    default: new Decimal('5000.00'),
    type: 'Decimal',
    classification: 'always-current',
    category: 'prop-firm',
    description: 'Admin review required above this amount',
  },

  // -------------------------------------------------------------------------
  // Prop Firm — scaling
  // -------------------------------------------------------------------------

  'prop_firm.scaling.consecutive_profitable_cycles': {
    default: 4,
    type: 'number',
    classification: 'always-current',
    category: 'prop-firm',
    description: 'Cycles required to scale up',
  },
  'prop_firm.scaling.required_total_return_pct': {
    default: new Decimal('0.10'),
    type: 'Decimal',
    classification: 'always-current',
    category: 'prop-firm',
    description: 'Total return required to scale up',
  },
  'prop_firm.cooldown_after_breach_days': {
    default: 30,
    type: 'number',
    classification: 'always-current',
    category: 'prop-firm',
    description: 'Days before new Trail Mode after breach',
  },

  // -------------------------------------------------------------------------
  // Referral
  // -------------------------------------------------------------------------

  'referral.rate.level_1': {
    default: new Decimal('0.20'),
    type: 'Decimal',
    classification: 'snapshot',
    category: 'referral',
    description: 'Direct referral commission rate',
  },
  'referral.rate.level_2': {
    default: new Decimal('0.10'),
    type: 'Decimal',
    classification: 'snapshot',
    category: 'referral',
    description: 'Sub-referral (1 hop) commission rate',
  },
  'referral.rate.level_3': {
    default: new Decimal('0.05'),
    type: 'Decimal',
    classification: 'snapshot',
    category: 'referral',
    description: 'Deep (2 hops) commission rate',
  },
  'referral.dispute_window_days': {
    default: 7,
    type: 'number',
    classification: 'always-current',
    category: 'referral',
    description: 'Days commission stays PENDING before PAID',
  },
  'referral.code_regen_cooldown_days': {
    default: 30,
    type: 'number',
    classification: 'always-current',
    category: 'referral',
    description: 'Days between code regenerations',
  },
  'referral.clawback_window_days': {
    default: 30,
    type: 'number',
    classification: 'always-current',
    category: 'referral',
    description: 'Days after signup during which commissions claw back on ban',
  },
  'referral.max_accounts_per_household': {
    default: 3,
    type: 'number',
    classification: 'always-current',
    category: 'referral',
    description: 'Max accounts from same IP/device/household',
  },

  // -------------------------------------------------------------------------
  // Wallet — fees
  // -------------------------------------------------------------------------

  'wallet.fee.withdrawal.erc20': {
    default: new Decimal('5.00'),
    type: 'Decimal',
    classification: 'always-current',
    category: 'wallet',
    description: 'ERC20 withdrawal fee in USD',
  },
  'wallet.fee.withdrawal.trc20': {
    default: new Decimal('1.00'),
    type: 'Decimal',
    classification: 'always-current',
    category: 'wallet',
    description: 'TRC20 withdrawal fee in USD',
  },
  'wallet.fee.withdrawal.bep20': {
    default: new Decimal('0.50'),
    type: 'Decimal',
    classification: 'always-current',
    category: 'wallet',
    description: 'BEP20 withdrawal fee in USD',
  },

  // -------------------------------------------------------------------------
  // Wallet — limits
  // -------------------------------------------------------------------------

  'wallet.limit.daily_withdrawal.default': {
    default: new Decimal('50000.00'),
    type: 'Decimal',
    classification: 'always-current',
    category: 'wallet',
    description: 'Default daily withdrawal limit',
  },
  'wallet.limit.min_withdrawal': {
    default: new Decimal('10.00'),
    type: 'Decimal',
    classification: 'always-current',
    category: 'wallet',
    description: 'Minimum withdrawal amount',
  },
  'wallet.limit.auto_approval_threshold': {
    default: new Decimal('1000.00'),
    type: 'Decimal',
    classification: 'always-current',
    category: 'wallet',
    description: 'Auto-approve threshold (requires 2FA)',
  },
  'wallet.limit.dual_approval_threshold': {
    default: new Decimal('10000.00'),
    type: 'Decimal',
    classification: 'always-current',
    category: 'wallet',
    description: 'Requires 2 admin signatures',
  },

  // -------------------------------------------------------------------------
  // Wallet — deposit confirmations
  // -------------------------------------------------------------------------

  'wallet.deposit.confirmations.erc20': {
    default: 12,
    type: 'number',
    classification: 'always-current',
    category: 'wallet',
    description: 'ERC20 blocks to confirm',
  },
  'wallet.deposit.confirmations.trc20': {
    default: 24,
    type: 'number',
    classification: 'always-current',
    category: 'wallet',
    description: 'TRC20 blocks to confirm',
  },
  'wallet.deposit.confirmations.bep20': {
    default: 20,
    type: 'number',
    classification: 'always-current',
    category: 'wallet',
    description: 'BEP20 blocks to confirm',
  },
  'wallet.deposit.timeout_hours': {
    default: 72,
    type: 'number',
    classification: 'always-current',
    category: 'wallet',
    description: 'Hours before unconfirmed deposit auto-cancels',
  },

  // -------------------------------------------------------------------------
  // Wallet — KYC
  // -------------------------------------------------------------------------

  'wallet.kyc.threshold_requires_verified': {
    default: new Decimal('1000.00'),
    type: 'Decimal',
    classification: 'always-current',
    category: 'wallet',
    description: 'Withdrawals above this require KYC VERIFIED',
  },

  // -------------------------------------------------------------------------
  // Trading fees
  // -------------------------------------------------------------------------

  'trading.fee.maker': {
    default: new Decimal('0.001'),
    type: 'Decimal',
    classification: 'snapshot',
    category: 'trading',
    description: 'Maker fee (0.1%)',
  },
  'trading.fee.taker': {
    default: new Decimal('0.0015'),
    type: 'Decimal',
    classification: 'snapshot',
    category: 'trading',
    description: 'Taker fee (0.15%)',
  },
  'trading.fee.liquidation': {
    default: new Decimal('0.005'),
    type: 'Decimal',
    classification: 'snapshot',
    category: 'trading',
    description: 'Liquidation fee (0.5%)',
  },

  // -------------------------------------------------------------------------
  // Auth & sessions
  // -------------------------------------------------------------------------

  'auth.access_token_ttl_minutes': {
    default: 15,
    type: 'number',
    classification: 'always-current',
    category: 'auth',
    description: 'Access token expiration',
  },
  'auth.refresh_token_ttl_days': {
    default: 7,
    type: 'number',
    classification: 'always-current',
    category: 'auth',
    description: 'Refresh token expiration',
  },
  'auth.max_concurrent_sessions': {
    default: 5,
    type: 'number',
    classification: 'always-current',
    category: 'auth',
    description: 'Max active sessions per user',
  },
  'auth.brute_force.login_lockout_attempts': {
    default: 5,
    type: 'number',
    classification: 'always-current',
    category: 'auth',
    description: 'Failed logins before 15-min lockout',
  },
  'auth.brute_force.login_lockout_minutes': {
    default: 15,
    type: 'number',
    classification: 'always-current',
    category: 'auth',
    description: 'Login lockout duration',
  },
  'auth.brute_force.twofa_lockout_attempts': {
    default: 3,
    type: 'number',
    classification: 'always-current',
    category: 'auth',
    description: 'Failed 2FA attempts before lockout',
  },
  'auth.brute_force.twofa_lockout_hours': {
    default: 24,
    type: 'number',
    classification: 'always-current',
    category: 'auth',
    description: '2FA lockout duration',
  },
  'auth.password.min_length': {
    default: 12,
    type: 'number',
    classification: 'always-current',
    category: 'auth',
    description: 'Min password length',
  },
  'auth.password.history_blocked': {
    default: 5,
    type: 'number',
    classification: 'always-current',
    category: 'auth',
    description: 'Blocks reusing last N passwords',
  },

  // -------------------------------------------------------------------------
  // Copy engine operational
  // -------------------------------------------------------------------------

  'ops.balance_poller.interval_minutes': {
    default: 30,
    type: 'number',
    classification: 'always-current',
    category: 'ops',
    description: 'BalancePoller cron interval',
  },
  'ops.balance_poller.max_retries': {
    default: 3,
    type: 'number',
    classification: 'always-current',
    category: 'ops',
    description: 'Failures before marking DEGRADED',
  },
  'ops.equity_protector.margin_warning_threshold': {
    default: 150,
    type: 'number',
    classification: 'always-current',
    category: 'ops',
    description: 'Margin level that triggers warning notification',
  },
  'ops.equity_protector.margin_emergency_threshold': {
    default: 110,
    type: 'number',
    classification: 'always-current',
    category: 'ops',
    description: 'Margin level that triggers force close',
  },
  'ops.equity_protector.ws_reconnect_timeout_seconds': {
    default: 60,
    type: 'number',
    classification: 'always-current',
    category: 'ops',
    description: 'Seconds before falling back to polling',
  },
  'ops.equity_protector.ws_poll_fallback_seconds': {
    default: 10,
    type: 'number',
    classification: 'always-current',
    category: 'ops',
    description: 'Poll interval when WS disconnected',
  },
  'ops.equity_protector.persist_interval_seconds': {
    default: 5,
    type: 'number',
    classification: 'always-current',
    category: 'ops',
    description: 'How often to persist state to Postgres',
  },
  'ops.copypro.circuit_breaker.fail_threshold': {
    default: 5,
    type: 'number',
    classification: 'always-current',
    category: 'ops',
    description: 'Consecutive fails before opening',
  },
  'ops.copypro.circuit_breaker.window_seconds': {
    default: 60,
    type: 'number',
    classification: 'always-current',
    category: 'ops',
    description: 'Window for fail threshold',
  },
  'ops.copypro.circuit_breaker.reset_seconds': {
    default: 30,
    type: 'number',
    classification: 'always-current',
    category: 'ops',
    description: 'Half-open probe interval',
  },
  'ops.copypro.start_timeout_seconds': {
    default: 10,
    type: 'number',
    classification: 'always-current',
    category: 'ops',
    description: 'Timeout for /Start calls',
  },
  'ops.copypro.read_timeout_seconds': {
    default: 5,
    type: 'number',
    classification: 'always-current',
    category: 'ops',
    description: 'Timeout for read operations',
  },
  'ops.copypro.closed_orders_sync_seconds': {
    default: 60,
    type: 'number',
    classification: 'always-current',
    category: 'ops',
    description: 'Polling interval for /ClosedOrdersAll',
  },
  'ops.mtapi.token_refresh_minutes': {
    default: 55,
    type: 'number',
    classification: 'always-current',
    category: 'ops',
    description: 'Token refresh before 60-min broker timeout',
  },

  // -------------------------------------------------------------------------
  // Chat
  // -------------------------------------------------------------------------

  'ops.chat.rate_limit.normal_user.per_min': {
    default: 10,
    type: 'number',
    classification: 'always-current',
    category: 'ops',
    description: 'Messages per minute (normal user)',
  },
  'ops.chat.rate_limit.normal_user.per_hour': {
    default: 50,
    type: 'number',
    classification: 'always-current',
    category: 'ops',
    description: 'Messages per hour (normal user)',
  },
  'ops.chat.rate_limit.trader.per_min': {
    default: 30,
    type: 'number',
    classification: 'always-current',
    category: 'ops',
    description: 'Messages per minute (trader in own room)',
  },
  'ops.chat.rate_limit.trader.per_hour': {
    default: 200,
    type: 'number',
    classification: 'always-current',
    category: 'ops',
    description: 'Messages per hour (trader)',
  },
  'ops.chat.rate_limit.dm.per_min': {
    default: 30,
    type: 'number',
    classification: 'always-current',
    category: 'ops',
    description: 'DM messages per minute per pair',
  },
  'ops.chat.edit_window_minutes': {
    default: 15,
    type: 'number',
    classification: 'always-current',
    category: 'ops',
    description: 'Minutes allowed to edit/delete',
  },
  'ops.chat.auto_hide_report_count': {
    default: 3,
    type: 'number',
    classification: 'always-current',
    category: 'ops',
    description: 'Distinct reports that trigger auto-hide',
  },
  'ops.chat.message_max_length.community': {
    default: 4000,
    type: 'number',
    classification: 'always-current',
    category: 'ops',
    description: 'Community/strategy max message length',
  },
  'ops.chat.message_max_length.dm': {
    default: 10000,
    type: 'number',
    classification: 'always-current',
    category: 'ops',
    description: 'DM max message length',
  },
  'ops.chat.dm.max_pending_requests': {
    default: 10,
    type: 'number',
    classification: 'always-current',
    category: 'ops',
    description: 'Max outbound DM requests pending',
  },

  // -------------------------------------------------------------------------
  // Notifications
  // -------------------------------------------------------------------------

  'ops.notification.digest_interval_minutes': {
    default: 15,
    type: 'number',
    classification: 'always-current',
    category: 'ops',
    description: 'Email digest batch interval',
  },
  'ops.notification.dedup_window_minutes': {
    default: 5,
    type: 'number',
    classification: 'always-current',
    category: 'ops',
    description: 'Identical notifications dedup window',
  },
  'ops.notification.auto_archive_days': {
    default: 30,
    type: 'number',
    classification: 'always-current',
    category: 'ops',
    description: 'Days before read notifications archive',
  },

  // -------------------------------------------------------------------------
  // Support tickets
  // -------------------------------------------------------------------------

  'ops.tickets.sla_response_hours': {
    default: 24,
    type: 'number',
    classification: 'always-current',
    category: 'ops',
    description: 'Response SLA',
  },
  'ops.tickets.sla_escalation_hours': {
    default: 48,
    type: 'number',
    classification: 'always-current',
    category: 'ops',
    description: 'Auto-escalation threshold',
  },
  'ops.tickets.auto_close_days': {
    default: 7,
    type: 'number',
    classification: 'always-current',
    category: 'ops',
    description: 'Days of inactivity before auto-close',
  },
  'ops.tickets.reopen_window_days': {
    default: 14,
    type: 'number',
    classification: 'always-current',
    category: 'ops',
    description: 'Days after resolution reopen is allowed',
  },

  // -------------------------------------------------------------------------
  // Activities & rewards
  // -------------------------------------------------------------------------

  'ops.activities.streak_max_days': {
    default: 365,
    type: 'number',
    classification: 'always-current',
    category: 'ops',
    description: 'Max streak counter',
  },
  'ops.activities.reward_claim_window_days': {
    default: 7,
    type: 'number',
    classification: 'always-current',
    category: 'ops',
    description: 'Days to claim before forfeit',
  },

  // -------------------------------------------------------------------------
  // Compliance / data retention
  // -------------------------------------------------------------------------

  'compliance.retention.audit_log_years': {
    default: 7,
    type: 'number',
    classification: 'always-current',
    category: 'compliance',
    description: 'Audit log retention',
  },
  'compliance.retention.chat_messages_years': {
    default: 2,
    type: 'number',
    classification: 'always-current',
    category: 'compliance',
    description: 'Chat message retention',
  },
  'compliance.retention.banned_pii_anonymize_days': {
    default: 90,
    type: 'number',
    classification: 'always-current',
    category: 'compliance',
    description: 'Days before banned user PII is anonymized',
  },
  'compliance.retention.erasure_processing_days': {
    default: 30,
    type: 'number',
    classification: 'always-current',
    category: 'compliance',
    description: 'Right-to-erasure processing window',
  },
} as const satisfies { [K in ConfigKey]: ConfigEntry<K> };

// ---------------------------------------------------------------------------
// ConfigGet — typed helper interface (no implementation here — see configService)
// ---------------------------------------------------------------------------

/**
 * Typed config getter interface. Implementations (configService) must satisfy this.
 * Returns a Promise so implementations can be async (Redis/Postgres backed).
 *
 * Per C-20: settlement/subscription code must NOT call ConfigGet for split values.
 * Read from entity snapshot columns instead.
 */
export type ConfigGet = <K extends ConfigKey>(key: K) => Promise<ConfigValueType[K]>;

// ---------------------------------------------------------------------------
// Domain-scoped key sets — import only what you need
// ---------------------------------------------------------------------------

/**
 * All strategy-domain config keys.
 * Used by copy-relation, subscription, and settlement code.
 */
export const STRATEGY_KEYS = [
  'strategy.split.default.follower_pct',
  'strategy.split.default.trader_pct',
  'strategy.split.default.insurance_investor_pct',
  'strategy.split.default.platform_pct',
  'strategy.split.traditional.follower_pct',
  'strategy.split.traditional.trader_pct',
  'strategy.limits.min_risk_capital',
  'strategy.limits.max_risk_capital',
  'strategy.limits.max_drawdown_cap_pct',
  'strategy.limits.absolute_loss_cap_pct',
  'strategy.limits.max_followers_per_strategy',
  'strategy.fundraising.countdown_days',
] as const satisfies readonly ConfigKey[];

export type StrategyKey = (typeof STRATEGY_KEYS)[number];

/**
 * All copy-engine and trading-fee keys.
 * Used by copy-relation service and trade execution.
 */
export const COPY_KEYS = [
  'copy_engine.base_url',
  'copy_engine.frontend_url',
  'copy_engine.manager_key',
  'trading.fee.maker',
  'trading.fee.taker',
  'trading.fee.liquidation',
  'ops.balance_poller.interval_minutes',
  'ops.balance_poller.max_retries',
  'ops.equity_protector.margin_warning_threshold',
  'ops.equity_protector.margin_emergency_threshold',
  'ops.equity_protector.ws_reconnect_timeout_seconds',
  'ops.equity_protector.ws_poll_fallback_seconds',
  'ops.equity_protector.persist_interval_seconds',
  'ops.copypro.circuit_breaker.fail_threshold',
  'ops.copypro.circuit_breaker.window_seconds',
  'ops.copypro.circuit_breaker.reset_seconds',
  'ops.copypro.start_timeout_seconds',
  'ops.copypro.read_timeout_seconds',
  'ops.copypro.closed_orders_sync_seconds',
  'ops.mtapi.token_refresh_minutes',
] as const satisfies readonly ConfigKey[];

export type CopyKey = (typeof COPY_KEYS)[number];

/**
 * All wallet and transaction keys.
 * Agent 3 (wallet/business) imports only this group.
 */
export const WALLET_KEYS = [
  'wallet.fee.withdrawal.erc20',
  'wallet.fee.withdrawal.trc20',
  'wallet.fee.withdrawal.bep20',
  'wallet.limit.daily_withdrawal.default',
  'wallet.limit.min_withdrawal',
  'wallet.limit.auto_approval_threshold',
  'wallet.limit.dual_approval_threshold',
  'wallet.deposit.confirmations.erc20',
  'wallet.deposit.confirmations.trc20',
  'wallet.deposit.confirmations.bep20',
  'wallet.deposit.timeout_hours',
  'wallet.kyc.threshold_requires_verified',
  'referral.rate.level_1',
  'referral.rate.level_2',
  'referral.rate.level_3',
  'referral.dispute_window_days',
  'referral.code_regen_cooldown_days',
  'referral.clawback_window_days',
  'referral.max_accounts_per_household',
] as const satisfies readonly ConfigKey[];

export type WalletKey = (typeof WALLET_KEYS)[number];

/**
 * All Atlas Gold insurance keys.
 */
export const ATLAS_GOLD_KEYS = [
  'atlas_gold.coverage_ratio_default',
  'atlas_gold.min_investor_deposit',
  'atlas_gold.max_investor_exposure_per_strategy_pct',
  'atlas_gold.global_investor_exposure_cap_pct',
  'atlas_gold.withdrawal_max_queue_days',
] as const satisfies readonly ConfigKey[];

export type AtlasGoldKey = (typeof ATLAS_GOLD_KEYS)[number];

/**
 * All platform/operational keys (auth, ops, compliance, chat, notifications, etc.).
 * Used by auth service, notification service, support, and platform ops.
 */
export const PLATFORM_KEYS = [
  'auth.access_token_ttl_minutes',
  'auth.refresh_token_ttl_days',
  'auth.max_concurrent_sessions',
  'auth.brute_force.login_lockout_attempts',
  'auth.brute_force.login_lockout_minutes',
  'auth.brute_force.twofa_lockout_attempts',
  'auth.brute_force.twofa_lockout_hours',
  'auth.password.min_length',
  'auth.password.history_blocked',
  'ops.chat.rate_limit.normal_user.per_min',
  'ops.chat.rate_limit.normal_user.per_hour',
  'ops.chat.rate_limit.trader.per_min',
  'ops.chat.rate_limit.trader.per_hour',
  'ops.chat.rate_limit.dm.per_min',
  'ops.chat.edit_window_minutes',
  'ops.chat.auto_hide_report_count',
  'ops.chat.message_max_length.community',
  'ops.chat.message_max_length.dm',
  'ops.chat.dm.max_pending_requests',
  'ops.notification.digest_interval_minutes',
  'ops.notification.dedup_window_minutes',
  'ops.notification.auto_archive_days',
  'ops.tickets.sla_response_hours',
  'ops.tickets.sla_escalation_hours',
  'ops.tickets.auto_close_days',
  'ops.tickets.reopen_window_days',
  'ops.activities.streak_max_days',
  'ops.activities.reward_claim_window_days',
  'compliance.retention.audit_log_years',
  'compliance.retention.chat_messages_years',
  'compliance.retention.banned_pii_anonymize_days',
  'compliance.retention.erasure_processing_days',
] as const satisfies readonly ConfigKey[];

export type PlatformKey = (typeof PLATFORM_KEYS)[number];

/**
 * All Prop Firm and Trail Mode keys.
 */
export const PROP_TRAIL_KEYS = [
  'trail_mode.price_usdt',
  'trail_mode.initial_balance',
  'trail_mode.level_1.required_trades',
  'trail_mode.level_1.required_win_rate',
  'trail_mode.level_2.required_trades',
  'trail_mode.level_2.required_win_rate',
  'trail_mode.max_drawdown_pct',
  'trail_mode.countdown_days',
  'trail_mode.cooldown_after_fail_days',
  'prop_firm.tier_1.funded_balance',
  'prop_firm.tier_2.funded_balance',
  'prop_firm.tier_3.funded_balance',
  'prop_firm.tier_4.funded_balance',
  'prop_firm.tier_default.trader_split_pct',
  'prop_firm.tier_default.platform_split_pct',
  'prop_firm.max_drawdown_pct',
  'prop_firm.daily_loss_limit_pct',
  'prop_firm.min_trading_days_per_month',
  'prop_firm.payout.min_amount',
  'prop_firm.payout.cycle_days',
  'prop_firm.payout.first_payout_account_age_days',
  'prop_firm.payout.manual_review_threshold',
  'prop_firm.scaling.consecutive_profitable_cycles',
  'prop_firm.scaling.required_total_return_pct',
  'prop_firm.cooldown_after_breach_days',
] as const satisfies readonly ConfigKey[];

export type PropTrailKey = (typeof PROP_TRAIL_KEYS)[number];
