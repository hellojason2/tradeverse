/**
 * copyPro.ts — CopyPro Client Contract
 *
 * Single source of truth for all types used when calling the CopyPro trade-copier API.
 * Agent 2 (copy engine) implements `CopyProClient`. Agent 3 (business/wallet) imports
 * and stubs it. Neither agent should need to modify this file.
 *
 * API Base URL: configurable via COPYPRO_BASE_URL environment variable.
 * Production value is https://copyback3.mrpc.pro — do NOT hardcode elsewhere.
 *
 * All money/lot values returned by CopyPro are `number` (IEEE 754 double).
 * At the Tradeverse persistence boundary, callers must convert to `Decimal` via
 * `new Decimal(value)` before writing to Postgres. Internal service types that cross
 * the persistence layer use `Decimal`; raw CopyPro wire types use `number`.
 */

import type { Decimal } from '@prisma/client/runtime/library.js';

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

/**
 * Runtime configuration for the CopyPro HTTP client (unit D1).
 * All values are read from environment/config — never hardcoded.
 *
 * Production baseUrl example: https://copyback3.mrpc.pro
 * (see docs/blueprint/CONFIG_CATALOG.md → copy_engine.base_url)
 */
export interface CopyProConfig {
  /** Base URL of the CopyPro backend, e.g. process.env.COPYPRO_BASE_URL. */
  baseUrl: string;
  /** Manager API key for protected copier operations. */
  managerKey: string;
  /** Per-user key from users.mtapi.io. */
  userKey: string;
  /** Request timeout in milliseconds (default: 10_000). */
  timeoutMs: number;
  /**
   * Number of consecutive failures before the circuit breaker opens.
   * When open, calls fail fast without hitting the upstream.
   */
  circuitBreakerThreshold: number;
  /**
   * Webhook URL CopyPro POSTs to when equity protection fires.
   * Must be HTTPS in production (enforced by copyRelationService, see C-13).
   */
  callbackUrl: string;
}

// ---------------------------------------------------------------------------
// Enums
// ---------------------------------------------------------------------------

/**
 * Live status of a CopyPro copier session.
 * Maps to the `paused` / `pauseReason` fields on the CopyService model.
 */
export enum CopierStatus {
  /** Copier is running and actively copying trades. */
  ACTIVE = 'ACTIVE',
  /** Copier is paused (user-initiated or equity-protection-initiated). */
  PAUSED = 'PAUSED',
  /** Copier was removed. No further trade copying occurs. */
  STOPPED = 'STOPPED',
  /** Equity protection triggered a drawdown breach. */
  BREACHED = 'BREACHED',
}

/**
 * MT account role in a copier relationship.
 * Maps to the CopyPro `type` field on Account / CopyService models.
 */
export enum AccountType {
  /** Source account whose trades are mirrored. */
  MASTER = 'MASTER',
  /** Destination account that receives copied trades. */
  SLAVE = 'SLAVE',
}

/** MT trading platform version. Maps to CopyPro `type` field on Account. */
export type MtPlatform = 'MT4' | 'MT5';

/**
 * Trade direction. Maps to CopyPro Order `type` field (simplified).
 * See `CopyProOrderType` for the full discriminated union.
 */
export enum TradeDirection {
  BUY = 'Buy',
  SELL = 'Sell',
}

/**
 * Risk sizing method for a copier.
 * @see GET /StartByAccountId — riskType parameter
 */
export type RiskType =
  | 'FixedLot'
  | 'LotMultiplier'
  | 'BalanceMultiplier'
  | 'FixedBalanceMultiplier'
  | 'EquityMultiplier';

/**
 * Full order type enum from CopyPro Order model.
 * Used in TradeLog entries and open/closed order responses.
 */
export type CopyProOrderType =
  | 'Buy'
  | 'Sell'
  | 'BuyLimit'
  | 'SellLimit'
  | 'BuyStop'
  | 'SellStop'
  | 'BuyStopLimit'
  | 'SellStopLimit'
  | 'CloseBy'
  | 'Balance'
  | 'Credit';

/**
 * Trade log update type — what action triggered the TradeLog entry.
 * @see TradeLogEntry.updateType
 */
export type TradeLogUpdateType =
  | 'PendingClose'
  | 'MarketOpen'
  | 'PendingOpen'
  | 'MarketClose'
  | 'PartialClose'
  | 'Started'
  | 'Filled'
  | 'Cancelling'
  | 'MarketModify'
  | 'PendingModify'
  | 'OnStopLoss'
  | 'OnTakeProfit'
  | 'OnStopOut'
  | 'Balance'
  | 'Expired'
  | 'Rejected'
  | 'MarketCloseBy'
  | 'MarketCloseNotFound';

/** Reason a copier was paused. Maps to CopyService.pauseReason. */
export type CopierPauseReason =
  | 'None'
  | 'WrongMasterPassword'
  | 'ByUser'
  | 'EquityProtection'
  | 'ConnotConnectMaster'
  | 'WrongSlavePassword'
  | 'ConnotConnectSlave'
  | 'MasterAccountDisable'
  | 'SlaveAccountDisable';

/** Magic number handling mode on a copier. */
export type CopyMagicNumberMode = 'No' | 'Yes' | 'Custom';

/** Comment/magic number filter mode on a copier. */
export type FilterOption = 'None' | 'Copy' | 'Ignore';

/** Trade direction filter on a copier. */
export type FilterSide = 'CopyAll' | 'CopyBuyOnly' | 'CopySellOnly';

// ---------------------------------------------------------------------------
// Error types
// ---------------------------------------------------------------------------

/**
 * Discriminated union of all errors the CopyPro client can surface.
 * Callers should switch on `kind` to handle each case.
 *
 * Note: CopyPro HTTP 201 responses carry `ExceptionResult` arrays.
 * The client implementation must map these to the appropriate error kind.
 */
export type CopyProError =
  | { kind: 'NETWORK_TIMEOUT'; message: string; cause?: unknown }
  | { kind: 'CIRCUIT_OPEN'; message: string }
  | { kind: 'INVALID_CREDENTIALS'; message: string; code?: string }
  | { kind: 'ACCOUNT_NOT_FOUND'; message: string; accountId?: string }
  | { kind: 'UPSTREAM_5XX'; message: string; status: number; body?: string }
  | { kind: 'RATE_LIMITED'; message: string; retryAfterMs?: number }
  | { kind: 'INVALID_REQUEST'; message: string; code?: string; details?: string };

// ---------------------------------------------------------------------------
// Shared sub-types (wire format — number, not Decimal)
// ---------------------------------------------------------------------------

/**
 * Exception payload returned by CopyPro on HTTP 201 responses.
 * The client implementation maps these to `CopyProError` before returning.
 */
export interface CopyProExceptionResult {
  message: string;
  code: string;
  stackTrace?: string;
}

/**
 * Live balance/equity summary for a trading account.
 * All money values are raw `number` from CopyPro wire format.
 * Callers that persist or compare these values must convert to `Decimal`.
 *
 * @see GET /AccountWithSummary
 */
export interface AccountSummary {
  /** Account balance in account currency. */
  balance: number;
  credit: number;
  profit: number;
  /** Equity = balance + floating P&L. */
  equity: number;
  margin: number;
  freeMargin: number;
  marginLevel: number;
  leverage: number;
  currency: string;
  /** Account type string from broker (e.g. "Real", "Demo"). */
  type: string;
  isInvestor: boolean;
}

/**
 * Equity protector configuration as returned by CopyPro.
 * All monetary thresholds are raw `number`.
 *
 * @see GET /UpdateEquityProtector
 */
export interface EquityProtectorConfig {
  enabled: boolean;
  /** Reset drawdown tracking at start of each day. */
  dailyReset: boolean;
  /** Send alert notification when triggered. */
  alert: boolean;
  /** Disable the copier when triggered. */
  disableCopier: boolean;
  /** Close only copier-placed trades when triggered. */
  closeCopiedTrades: boolean;
  /** Close all account trades when triggered. */
  closeAllTrades: boolean;
  /** Percentage-based drawdown trigger (e.g. 0.30 = 30%). */
  stopLossPercent?: number;
  /** Fixed monetary drawdown amount that triggers protection. */
  stopLossValue?: number;
  /** Minimum absolute equity floor in account currency. */
  stopLossAbsolute?: number;
  /** Percentage-based take-profit trigger. */
  takeProfitPercent?: number;
  /** Fixed monetary take-profit amount trigger. */
  takeProfitValue?: number;
  /** Maximum absolute equity ceiling trigger. */
  takeProfitAbsolute?: number;
  /**
   * Webhook URL. CopyPro POSTs a TradeLog payload here when triggered.
   * Must be HTTPS in production (C-13). Set via UpdateEquityProtectorCallback.
   */
  callbackUrl?: string;
  /** Balance at the time protection was enabled. */
  startBalance?: number;
}

/**
 * A single order (open or closed) from a MT4/MT5 account.
 * All price/lot/money values are raw `number`.
 *
 * @see GET /OpenOrders, GET /ClosedOrders
 */
export interface CopyProOrder {
  ticket: number;
  openTime: string;
  /** Populated for closed/history orders only. */
  closeTime?: string;
  /** Expiry for pending orders. */
  expiration?: string;
  type: CopyProOrderType;
  /** Lot size. Some brokers use non-standard lots. */
  lots: number;
  symbol: string;
  openPrice: number;
  stopLoss: number;
  takeProfit: number;
  closePrice?: number;
  magicNumber: number;
  swap: number;
  commission: number;
  comment?: string;
  /** Net profit in base currency (excludes swap/commission). */
  profit: number;
  /** Decimal digits in symbol price. */
  digits?: number;
}

/**
 * A single message within a TradeLog entry.
 */
export interface TradeLogMessage {
  timeUTC: string;
  level: 'Verbose' | 'Debug' | 'Information' | 'Warning' | 'Error' | 'Fatal';
  message: string;
}

/**
 * A trade log entry from CopyPro.
 * Represents one copy-action event (open, close, modify, etc.).
 * Tradeverse normalises these into the local `Trade` table.
 *
 * @see GET /TradeLogs, GET /TradeLogsAll
 */
export interface TradeLogEntry {
  id: string;
  copierId: string;
  userKey: string;
  timeUTC: string;
  timeDoneUTC?: string;
  updateType: TradeLogUpdateType;
  success: boolean;
  /** Unique trade ID across copier restarts. */
  uniqueTradeId?: string;
  /** Slave ticket number — used for deduplication (C-12). */
  slaveTicket?: string;
  masterUser?: string;
  masterServer?: string;
  masterName?: string;
  masterOrder?: CopyProOrder;
  masterApiType?: MtPlatform;
  masterApiId?: string;
  slaveUser?: string;
  slaveServer?: string;
  slaveName?: string;
  slaveSymbol?: string;
  /** Lot size used on slave. Raw number — convert to Decimal before persisting. */
  slaveLots?: number;
  slaveOrderType?: CopyProOrderType;
  slaveApiType?: MtPlatform;
  slaveApiId?: string;
  slaveOrder?: CopyProOrder;
  slaveType?: string;
  slaveBrokerCompany?: string;
  tradeReason?: 'NewSignal' | 'PeriodicCheck' | 'EquityProtector' | 'MasterConnectFail' | 'CopierRemove';
  exceptionMessage?: string;
  exceptionCode?: string;
  exceptionStackTrace?: string;
  messages?: TradeLogMessage[];
  url?: string;
  masterSlaveDelayOpen?: number;
  masterSlaveDelayClose?: number;
}

/**
 * Full account entity as returned by CopyPro account endpoints.
 *
 * @see GET /Accounts, GET /GetAccount
 */
export interface CopyProAccount {
  id: string;
  name: string;
  userKey: string;
  managerKey?: string;
  apiId?: string;
  type: MtPlatform;
  /** MT account number. */
  user: number;
  server: string;
  enabled: boolean;
  considerAccountBalance: boolean;
  equityProtector?: EquityProtectorConfig;
}

/**
 * Account with connection test result and live summary.
 * Returned by AccountWithSummary — used for display-only balance polling.
 * Balance is NOT snapshotted from this response (see integration architecture).
 *
 * @see GET /AccountWithSummary
 */
export interface AccountWithSummaryResult extends CopyProAccount {
  connected: boolean;
  connectError?: CopyProExceptionResult;
  accountSummary?: AccountSummary;
}

/**
 * Active copier session as returned by CopyPro.
 *
 * @see GET /UserCopiers, GET /GetCopier
 */
export interface CopierStatusResponse {
  id: string;
  userKey: string;
  managerKey?: string;
  masterAccountId: string;
  slaveAccountId: string;
  /** Unique hash for the master/slave pairing — stable across restarts. */
  uniqueCopierId?: string;
  masterType: MtPlatform;
  masterUser: number;
  masterServer: string;
  masterName?: string;
  masterApiId?: string;
  slaveType: MtPlatform;
  slaveUser: number;
  slaveServer: string;
  slaveName?: string;
  slaveApiId?: string;
  riskType: RiskType;
  riskValue: number;
  copySL: boolean;
  copyTP: boolean;
  fixedSlPips?: number;
  fixedTpPips?: number;
  copyPendingOrders: boolean;
  reverseCopy: boolean;
  stopLossRefinementPips?: number;
  takeProfitRefinementPips?: number;
  fixedMasterBalance?: number;
  forceMinLot: boolean;
  forceMaxLot: boolean;
  copyExistingTrades: boolean;
  contractAlignment: boolean;
  copyExpiryTime: boolean;
  strictClose: boolean;
  copyMagicNumber: CopyMagicNumberMode;
  magicNumber?: number;
  tradeDelayMs?: number;
  lotRefiner?: number;
  filterMagicOption: FilterOption;
  filterMagicValue?: number;
  filterCommentOption: FilterOption;
  filterCommentValue?: string;
  filterSide: FilterSide;
  filterLotEnabled: boolean;
  filterLotMin?: number;
  filterLotMax?: number;
  paused: boolean;
  pauseReason?: CopierPauseReason;
  loaded: boolean;
  tradeLogCallbackUrl?: string;
  masterAccountSummary?: AccountSummary;
  slaveAccountSummary?: AccountSummary;
  equityProtector?: EquityProtectorConfig;
  timeLoadingStarted?: string;
  timeLoaded?: string;
  lastLoadFailedUtc?: string;
  lastDailyResetUtc?: string;
}

/**
 * Result returned by StartByAccountId on success.
 *
 * @see GET /StartByAccountId
 */
export interface StartCopierResult {
  /** The new copier's ID — store in CopyRelation.copyProCopierId. */
  copierId: string;
  masterAccountId: string;
  slaveAccountId: string;
  /** Alias for slaveAccountId (CopyPro field: srcId). */
  srcId?: string;
  /** Alias for slaveAccountId (CopyPro field: dstId). */
  dstId?: string;
}

// ---------------------------------------------------------------------------
// Request DTOs
// ---------------------------------------------------------------------------

/**
 * Parameters for registering a new MT account in CopyPro.
 *
 * @see GET /AddAccount
 */
export interface AddAccountRequest {
  /** Human-readable display name, e.g. "default" or "Atlas Gold Master". */
  name: string;
  type: MtPlatform;
  /** MT account number (login). */
  user: number;
  password: string;
  /** Server name as shown in the MT terminal, e.g. "FreshForex-Demo". */
  server: string;
  /** Optional external API ID for cross-system correlation. */
  apiId?: string;
}

/**
 * Parameters for updating an existing account's metadata.
 *
 * @see GET /UpdateAccount
 */
export interface UpdateAccountRequest {
  accountId: string;
  accountName: string;
  considerAccountBalance: boolean;
}

/**
 * Parameters for starting a copier between two registered accounts.
 * All optional parameters default to CopyPro server-side defaults when omitted.
 *
 * @see GET /StartByAccountId
 */
export interface StartCopierRequest {
  masterAccountId: string;
  slaveAccountId: string;
  riskType: RiskType;
  /**
   * Numeric value interpreted by riskType:
   * - FixedLot: exact lot size
   * - LotMultiplier: base lot x multiplier
   * - BalanceMultiplier: balance-proportional sizing
   *
   * CopyPro accepts a double; callers must convert from Decimal at call site.
   */
  riskValue: number;
  copySL?: boolean;
  copyTP?: boolean;
  fixedSlPips?: number;
  fixedTpPips?: number;
  copyPendingOrders?: boolean;
  fixedMasterBalance?: number;
  reverseCopy?: boolean;
  stopLossRefinementPips?: number;
  takeProfitRefinementPips?: number;
  forceMinLot?: boolean;
  forceMaxLot?: boolean;
  copyExistingTrades?: boolean;
  contractAlignment?: boolean;
  copyExpiryTime?: boolean;
  strictClose?: boolean;
  copyMagicNumber?: CopyMagicNumberMode;
  magicNumber?: number;
  tradeDelayMs?: number;
  lotRefiner?: number;
  filterMagicOption?: FilterOption;
  filterMagicValue?: number;
  filterCommentOption?: FilterOption;
  filterCommentValue?: string;
  filterSide?: FilterSide;
  filterLotEnabled?: boolean;
  filterLotMin?: number;
  filterLotMax?: number;
}

/**
 * Parameters for updating equity protector settings on a registered account.
 *
 * @see GET /UpdateEquityProtector
 */
export interface UpdateEquityProtectorRequest {
  accountId: string;
  enabled?: boolean;
  dailyReset?: boolean;
  alert?: boolean;
  disableCopier?: boolean;
  closeCopiedTrades?: boolean;
  closeAllTrades?: boolean;
  /** Percentage-based drawdown trigger (e.g. 0.30 for 30%). */
  stopLossPercent?: number;
  stopLossValue?: number;
  stopLossAbsolute?: number;
  takeProfitPercent?: number;
  takeProfitValue?: number;
  takeProfitAbsolute?: number;
}

/**
 * Parameters for setting the equity protector callback URL separately.
 *
 * @see GET /UpdateEquityProtectorCallback
 */
export interface UpdateEquityProtectorCallbackRequest {
  accountId: string;
  /**
   * Webhook URL. CopyPro POSTs a TradeLog payload here on equity breach.
   * Must start with https:// in production (C-13).
   */
  callbackUrl: string;
}

/**
 * Parameters for updating live copier settings.
 * Fields not provided retain their current values.
 *
 * @see GET /UpdateCopier
 */
export interface UpdateCopierRequest {
  copierId: string;
  riskType?: RiskType;
  riskValue?: number;
  copySL?: boolean;
  copyTP?: boolean;
  fixedSlPips?: number;
  fixedTpPips?: number;
  copyPendingOrders?: boolean;
  reverseCopy?: boolean;
  stopLossRefinementPips?: number;
  takeProfitRefinementPips?: number;
  forceMinLot?: boolean;
  forceMaxLot?: boolean;
  filterSide?: FilterSide;
  filterLotEnabled?: boolean;
  filterLotMin?: number;
  filterLotMax?: number;
  filterMagicOption?: FilterOption;
  filterMagicValue?: number;
  filterCommentOption?: FilterOption;
  filterCommentValue?: string;
}

/**
 * Parameters for fetching trade logs for a single copier.
 *
 * @see GET /TradeLogs
 */
export interface GetTradeLogsRequest {
  copierId: string;
  /**
   * Maximum number of records to return.
   * When omitted, CopyPro returns all records.
   * Use a finite limit in production to avoid unbounded payloads.
   */
  limit?: number;
}

/**
 * Parameters for fetching trade logs across all copiers for a user.
 *
 * @see GET /TradeLogsAll
 */
export interface GetAllTradeLogsRequest {
  limit?: number;
}

/**
 * Parameters for setting the trade log callback URL on a copier.
 *
 * @see GET /SetTradeLogCallback
 */
export interface SetTradeLogCallbackRequest {
  copierId: string;
  /** URL that receives POST with TradeLog payload on each copy event. */
  callbackUrl: string;
}

// ---------------------------------------------------------------------------
// Response wrapper — Tradeverse internal types (Decimal at boundary)
// ---------------------------------------------------------------------------

/**
 * Tradeverse-internal representation of live account balance/equity.
 * These are the Decimal-typed versions of AccountSummary for use in
 * services that persist or compare monetary values.
 *
 * Transformation: `new Decimal(accountSummary.balance)` at the client boundary.
 */
export interface AccountBalanceSnapshot {
  /** Account UUID from Tradeverse MtAccount table. */
  traderverseAccountId: string;
  /** CopyPro account ID (MongoDB ID). */
  copyProAccountId: string;
  balance: Decimal;
  equity: Decimal;
  margin: Decimal;
  freeMargin: Decimal;
  currency: string;
  /** UTC timestamp of when this snapshot was taken. */
  snapshotAt: Date;
}

// ---------------------------------------------------------------------------
// Main client interface
// ---------------------------------------------------------------------------

/**
 * CopyPro HTTP client interface.
 *
 * Agent 2 (copy engine) provides the concrete implementation.
 * Agent 3 (business/wallet) imports this interface and injects a stub.
 *
 * All methods are async. On failure, implementations MUST throw a `CopyProError`
 * (using `throw error as CopyProError`) rather than returning null or undefined.
 *
 * IMPORTANT (C-10): Never call these methods inside a Prisma `$transaction` block.
 * CopyPro latency (200ms-2s) would exhaust the connection pool.
 */
export interface CopyProClient {

  // -------------------------------------------------------------------------
  // Account lifecycle
  // -------------------------------------------------------------------------

  /**
   * Register a new MT4/MT5 trading account in CopyPro.
   * Returns the CopyPro-assigned account ID (MongoDB document ID).
   * Tradeverse stores this in `MtAccount.copyProAccountId`.
   *
   * @see GET /AddAccount
   */
  createAccount(req: AddAccountRequest): Promise<{ accountId: string; apiId?: string }>;

  /**
   * Update an account's display name and balance consideration flag.
   * Also updates associated copier names via CopyPro's UpdateAccountName endpoint.
   *
   * @see GET /UpdateAccount
   */
  updateAccount(req: UpdateAccountRequest): Promise<void>;

  /**
   * Remove a trading account by its CopyPro account ID.
   * Throws ACCOUNT_NOT_FOUND if the account does not exist.
   *
   * @see GET /RemoveAccount
   */
  removeAccount(accountId: string): Promise<void>;

  /**
   * Remove a trading account by its external API ID.
   * Throws ACCOUNT_NOT_FOUND if the account does not exist.
   *
   * @see GET /RemoveAccountByApiId
   */
  removeAccountByApiId(apiId: string): Promise<void>;

  /**
   * List all accounts registered under the configured userKey.
   * Does NOT test connection for each account (fast path).
   *
   * @see GET /Accounts
   */
  listAccounts(): Promise<CopyProAccount[]>;

  /**
   * Retrieve a single account by its CopyPro account ID.
   * Does NOT test connection.
   *
   * @see GET /GetAccount
   */
  getAccountById(accountId: string): Promise<CopyProAccount>;

  // -------------------------------------------------------------------------
  // Balance / equity polling
  // -------------------------------------------------------------------------

  /**
   * Retrieve an account with a live connection test and AccountSummary.
   * Use this for displaying live balance/equity on the strategy page.
   * Do NOT persist the balance from this call — it is display-only (see architecture doc).
   *
   * @see GET /AccountWithSummary
   */
  getAccountWithSummary(accountId: string): Promise<AccountWithSummaryResult>;

  /**
   * Convenience accessor: returns only the balance field from AccountSummary.
   * Internally calls getAccountWithSummary.
   * Returns a raw number — callers must convert to Decimal before persisting.
   */
  getAccountBalance(accountId: string): Promise<number>;

  /**
   * Convenience accessor: returns only the equity field from AccountSummary.
   * Internally calls getAccountWithSummary.
   * Returns a raw number — callers must convert to Decimal before persisting.
   */
  getAccountEquity(accountId: string): Promise<number>;

  // -------------------------------------------------------------------------
  // Copier lifecycle
  // -------------------------------------------------------------------------

  /**
   * Start a new copier between a master and slave account.
   * Returns the new copierId — store in `CopyRelation.copyProCopierId`.
   *
   * riskValue must be provided as a JavaScript `number` (convert from Decimal at call site).
   * Do NOT call this inside a Prisma transaction (C-10).
   *
   * @see GET /StartByAccountId
   */
  startCopierByAccountId(req: StartCopierRequest): Promise<StartCopierResult>;

  /**
   * Retrieve a running copier's full configuration and status.
   *
   * @see GET /GetCopier
   */
  getCopierById(copierId: string): Promise<CopierStatusResponse>;

  /**
   * List all active copier sessions for the configured userKey.
   *
   * @see GET /UserCopiers
   */
  listCopiers(): Promise<CopierStatusResponse[]>;

  /**
   * Update a live copier's settings. CopyPro notifies the running instance immediately.
   * Only the fields provided in the request are changed.
   *
   * @see GET /UpdateCopier
   */
  updateCopier(req: UpdateCopierRequest): Promise<void>;

  /**
   * Pause or resume a copier instance.
   * When paused, no new trades are copied until resumed.
   *
   * @see GET /CopierPause
   */
  pauseCopier(copierId: string, paused: boolean, reason?: CopierPauseReason): Promise<void>;

  /**
   * Stop and remove a copier permanently.
   * Existing open trades on the slave remain unless closeTrades is true.
   * Do NOT call this inside a Prisma transaction (C-10).
   *
   * @see GET /Remove
   */
  removeCopier(copierId: string, closeTrades?: boolean): Promise<void>;

  // -------------------------------------------------------------------------
  // Equity protector
  // -------------------------------------------------------------------------

  /**
   * Configure equity protection parameters for an account.
   * Call this immediately after startCopierByAccountId during activation (Phase 3).
   *
   * @see GET /UpdateEquityProtector
   */
  updateEquityProtector(req: UpdateEquityProtectorRequest): Promise<void>;

  /**
   * Set the webhook URL that CopyPro calls when equity protection fires.
   * Separate from updateEquityProtector — call once on account setup.
   * URL must be HTTPS in production (C-13).
   *
   * @see GET /UpdateEquityProtectorCallback
   */
  updateEquityProtectorCallback(req: UpdateEquityProtectorCallbackRequest): Promise<void>;

  // -------------------------------------------------------------------------
  // Trade logs
  // -------------------------------------------------------------------------

  /**
   * Fetch trade logs for a single copier session.
   * Used by the background cron (every ops.copypro.closed_orders_sync_seconds)
   * to mirror trades into the local `Trade` table.
   *
   * CopyPro does NOT paginate — use `limit` to cap payload size.
   * Note: cursor-based pagination is not natively supported by CopyPro;
   * Tradeverse implements deduplication via (ticket, copyRelationId) unique index (C-12).
   *
   * @see GET /TradeLogs
   */
  getTradeLogs(req: GetTradeLogsRequest): Promise<TradeLogEntry[]>;

  /**
   * Fetch trade logs across all copiers for the configured userKey.
   *
   * @see GET /TradeLogsAll
   */
  getAllTradeLogs(req: GetAllTradeLogsRequest): Promise<TradeLogEntry[]>;

  /**
   * Set the trade-log callback URL on a copier.
   * CopyPro POSTs TradeLog entries to this URL in real-time on each copy event.
   *
   * @see GET /SetTradeLogCallback
   */
  setTradeLogCallback(req: SetTradeLogCallbackRequest): Promise<void>;
}
