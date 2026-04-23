/**
 * Tradeverse 2.0 — API Routes Contract
 *
 * AUTHORITATIVE source for all request/response shapes.
 * - Agent 2 (copy-engine) implements against this contract.
 * - Agent 3 (business-wallet) implements against this contract.
 * - Agent 4 (frontend) derives MSW mocks from this contract.
 *
 * Rules (from CONTRACTS.md):
 *   C-02: All money fields are `string` in JSON (Decimal → string at boundary).
 *         Receive as string in requests, send as string in responses.
 *   C-04: riskCapital must be within [minRiskCapital, maxRiskCapital] config values.
 *   Timestamps: ISO 8601 strings everywhere.
 *   Idempotency-Key header (UUID v4) required on all financial mutation endpoints.
 */

// ---------------------------------------------------------------------------
// 0. Shared envelope & utility types
// ---------------------------------------------------------------------------

/** Standard success envelope. */
export type ApiSuccess<T> = { data: T };

/** Standard error envelope. */
export type ApiError = {
  error: {
    /** Machine-readable error code, e.g. "INVALID_CREDENTIALS", "INSUFFICIENT_BALANCE". */
    code: string;
    /** Human-readable message. */
    message: string;
    /** Field-level validation errors. Key = field path, value = message. */
    fields?: Record<string, string>;
  };
};

/** Either success or error. Use this as the HTTP response type. */
export type ApiResponse<T> = ApiSuccess<T> | ApiError;

/** Cursor-based paginated list. */
export type Paginated<T> = {
  items: T[];
  /** Opaque cursor for the next page. Null when no more pages. */
  nextCursor: string | null;
  /** Total count (optional — expensive queries may omit). */
  total?: number;
};

// ---------------------------------------------------------------------------
// 1. Auth
// ---------------------------------------------------------------------------

/** POST /api/auth/register */
export const POST_AUTH_REGISTER = '/api/auth/register';

export interface RegisterRequest {
  email: string;
  password: string;
  confirmPassword: string;
  referralCode?: string;
  /** Must be true to proceed. */
  acceptedTerms: boolean;
}

export interface RegisterResponse {
  /** Newly created user id. */
  userId: string;
  /** JWT access token (expires in 15 min). */
  accessToken: string;
  /** Opaque refresh token (expires in 7 days). */
  refreshToken: string;
  /** ISO 8601 */
  expiresAt: string;
}

// ---

/** POST /api/auth/login — Auth: none */
export const POST_AUTH_LOGIN = '/api/auth/login';

export interface LoginRequest {
  /** Email or phone number. */
  identifier: string;
  password: string;
}

// TODO: migrate to auth.ts when available
export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  /** ISO 8601 */
  expiresAt: string;
  user: UserSummary;
}

// ---

/** POST /api/auth/refresh — Auth: none (send refreshToken in body) */
export const POST_AUTH_REFRESH = '/api/auth/refresh';

export interface RefreshRequest {
  refreshToken: string;
}

export interface RefreshResponse {
  accessToken: string;
  refreshToken: string;
  /** ISO 8601 */
  expiresAt: string;
}

// ---

/** GET /api/auth/me — Auth: Bearer */
export const GET_AUTH_ME = '/api/auth/me';

// Response: ApiResponse<UserProfile>

// ---

/** POST /api/auth/logout — Auth: Bearer */
export const POST_AUTH_LOGOUT = '/api/auth/logout';

export interface LogoutRequest {
  /** Logout only this session (default) or all sessions. */
  allSessions?: boolean;
}

export interface LogoutResponse {
  success: true;
}

// ---

/** POST /api/auth/password-reset/request — Auth: none */
export const POST_AUTH_PASSWORD_RESET_REQUEST = '/api/auth/password-reset/request';

export interface PasswordResetRequestBody {
  email: string;
}

export interface PasswordResetRequestResponse {
  /** Intentionally vague for security. */
  message: string;
}

// ---

/** POST /api/auth/password-reset/confirm — Auth: none */
export const POST_AUTH_PASSWORD_RESET_CONFIRM = '/api/auth/password-reset/confirm';

export interface PasswordResetConfirmRequest {
  token: string;
  newPassword: string;
  confirmPassword: string;
}

export interface PasswordResetConfirmResponse {
  success: true;
}

// ---

/** POST /api/auth/oauth/:provider — Auth: none. provider = "google" | "apple" | "telegram" */
export const POST_AUTH_OAUTH = '/api/auth/oauth/:provider';

export interface OAuthRequest {
  /** Provider-specific auth code or token. */
  code: string;
  /** Required for Telegram; object with all Telegram auth fields. */
  telegramData?: Record<string, unknown>;
}

// Response: ApiResponse<LoginResponse>

// ---------------------------------------------------------------------------
// 1.5 Shared User types
// ---------------------------------------------------------------------------

export type UserRole = 'USER' | 'TRADER' | 'ADMIN' | 'MANAGER' | 'SUPER_ADMIN';
export type UserStatus = 'NOT_VERIFIED' | 'ACTIVE' | 'SUSPENDED' | 'BANNED' | 'DELETED';
export type KycStatus = 'NOT_STARTED' | 'PENDING' | 'VERIFIED' | 'REJECTED';

export interface UserSummary {
  id: string;
  email: string;
  displayName: string;
  avatarUrl: string | null;
  role: UserRole;
  status: UserStatus;
  kycStatus: KycStatus;
}

export interface UserProfile extends UserSummary {
  phone: string | null;
  referralCode: string;
  twoFaEnabled: boolean;
  /** ISO 8601 */
  createdAt: string;
  /** ISO 8601 */
  emailVerifiedAt: string | null;
}

// ---------------------------------------------------------------------------
// 2. MT Accounts
// ---------------------------------------------------------------------------

export type MtAccountStatus = 'ACTIVE' | 'INACTIVE' | 'ERROR';

export interface MtAccount {
  id: string;
  userId: string;
  login: string;
  server: string;
  platform: 'MT4' | 'MT5';
  label: string | null;
  status: MtAccountStatus;
  /** Money — string per C-02 */
  balance: string;
  /** Money — string per C-02 */
  equity: string;
  /** ISO 8601 */
  createdAt: string;
}

/**
 * POST /api/accounts — Auth: Bearer
 * Bind a new MT4/MT5 account.
 */
export const POST_ACCOUNTS = '/api/accounts';

export interface CreateMtAccountRequest {
  login: string;
  password: string;
  server: string;
  platform: 'MT4' | 'MT5';
  label?: string;
}

// Response: ApiResponse<MtAccount>

/**
 * GET /api/accounts — Auth: Bearer
 * List all MT accounts for the authenticated user.
 */
export const GET_ACCOUNTS = '/api/accounts';

export interface GetAccountsQuery {
  status?: MtAccountStatus;
}

// Response: ApiResponse<MtAccount[]>

/**
 * GET /api/accounts/:id — Auth: Bearer
 * Get a single MT account by id.
 */
export const GET_ACCOUNT_BY_ID = '/api/accounts/:id';

export interface AccountPathParams {
  id: string;
}

// Response: ApiResponse<MtAccount>

/**
 * DELETE /api/accounts/:id — Auth: Bearer
 * Unlink an MT account. Fails if account is used as master in an active strategy.
 */
export const DELETE_ACCOUNT = '/api/accounts/:id';

// Response: ApiResponse<{ success: true }>

/**
 * GET /api/accounts/:id/balance — Auth: Bearer
 * Fetch live balance/equity from MT bridge (bypasses cache).
 */
export const GET_ACCOUNT_BALANCE = '/api/accounts/:id/balance';

export interface MtAccountBalance {
  /** Money — string per C-02 */
  balance: string;
  /** Money — string per C-02 */
  equity: string;
  /** Money — string per C-02 */
  margin: string;
  /** Money — string per C-02 */
  freeMargin: string;
  /** Fetched from MT bridge at this time. ISO 8601 */
  fetchedAt: string;
}

// ---------------------------------------------------------------------------
// 3. Strategies
// ---------------------------------------------------------------------------

export type StrategyStatus =
  | 'PENDING'
  | 'FUNDRAISING'
  | 'ACTIVE'
  | 'PAUSED'
  | 'COMPLETED'
  | 'CLOSED';

export interface Strategy {
  id: string;
  providerId: string;
  providerName: string;
  providerAvatarUrl: string | null;
  name: string;
  description: string;
  tags: string[];
  status: StrategyStatus;
  /** Money — string per C-02 */
  fundraisingTarget: string;
  /** Money — string per C-02 */
  fundraisingRaised: string;
  /** Money — string per C-02 */
  aum: string;
  /** Percentage as decimal string, e.g. "20.00" means 20% */
  profitSharePct: string;
  /** Percentage, e.g. "65.50" */
  winRate: string;
  /** Percentage, e.g. "12.30" */
  maxDrawdown: string;
  tradeCount: number;
  followerCount: number;
  masterAccountId: string;
  /** ISO 8601 — fundraising expiry */
  fundraisingExpiresAt: string | null;
  /** ISO 8601 */
  createdAt: string;
}

/**
 * POST /api/strategies — Auth: Bearer (PROVIDER or ADMIN role)
 * Create a new strategy.
 * C-11: masterAccountId must not already be master in another strategy.
 */
export const POST_STRATEGIES = '/api/strategies';

export interface CreateStrategyRequest {
  name: string;
  description: string;
  tags?: string[];
  masterAccountId: string;
  /** Money string per C-02 */
  fundraisingTarget: string;
  /** Percentage string, e.g. "20" */
  profitSharePct: string;
}

// Response: ApiResponse<Strategy>

/**
 * GET /api/strategies — Auth: none (public) or Bearer (to include user subscription status)
 * List strategies with optional filters.
 */
export const GET_STRATEGIES = '/api/strategies';

export interface GetStrategiesQuery {
  status?: StrategyStatus;
  search?: string;
  /** comma-separated */
  tags?: string;
  /** "winRate" | "aum" | "createdAt" | "drawdown" */
  sortBy?: string;
  /** "asc" | "desc" */
  sortDir?: string;
  cursor?: string;
  limit?: number;
}

// Response: ApiResponse<Paginated<Strategy>>

/**
 * GET /api/strategies/:id — Auth: none (public)
 * Get strategy detail.
 */
export const GET_STRATEGY_BY_ID = '/api/strategies/:id';

export interface StrategyPathParams {
  id: string;
}

// Response: ApiResponse<Strategy>

/**
 * PATCH /api/strategies/:id — Auth: Bearer (owner PROVIDER or ADMIN)
 * Update strategy metadata. Cannot change masterAccountId after creation.
 */
export const PATCH_STRATEGY = '/api/strategies/:id';

export interface UpdateStrategyRequest {
  name?: string;
  description?: string;
  tags?: string[];
  /** PROVIDER can pause; ADMIN can change to any status. */
  status?: Extract<StrategyStatus, 'PAUSED' | 'ACTIVE'>;
}

// Response: ApiResponse<Strategy>

/**
 * DELETE /api/strategies/:id — Auth: Bearer (ADMIN only)
 * Soft-delete a strategy. Fails if status = ACTIVE.
 */
export const DELETE_STRATEGY = '/api/strategies/:id';

// Response: ApiResponse<{ success: true }>

// ---------------------------------------------------------------------------
// 4. Copy Relations / Subscriptions
// ---------------------------------------------------------------------------

export type CopyRelationStatus =
  | 'PENDING'
  | 'ACTIVE'
  | 'PAUSED'
  | 'CLOSED'
  | 'BREACHED';

export interface CopyRelation {
  id: string;
  userId: string;
  strategyId: string;
  strategyName: string;
  slaveAccountId: string;
  status: CopyRelationStatus;
  /** Money — string per C-02. Must be within [minRiskCapital, maxRiskCapital] per C-04. */
  riskCapital: string;
  /** Snapshot at creation per C-20 — immutable after creation */
  followerSplitPctSnapshot: string;
  /** Snapshot at creation per C-20 */
  traderSplitPctSnapshot: string;
  /** Snapshot at creation per C-20 */
  insuranceSplitPctSnapshot: string;
  /** Snapshot at creation per C-20 */
  platformSplitPctSnapshot: string;
  /** ISO 8601 */
  createdAt: string;
  /** ISO 8601 */
  activatedAt: string | null;
  /** ISO 8601 */
  closedAt: string | null;
}

/**
 * POST /api/copy-relations/subscribe — Auth: Bearer
 * Create a new copy relation (subscribe to a strategy).
 * Requires Idempotency-Key header.
 * C-04: riskCapital validated against config [minRiskCapital, maxRiskCapital].
 * C-11: slaveAccountId must not be slave in another ACTIVE/PENDING relation.
 */
export const POST_COPY_RELATIONS_SUBSCRIBE = '/api/copy-relations/subscribe';

export interface SubscribeRequest {
  strategyId: string;
  slaveAccountId: string;
  /** Money string per C-02. Min $100, max $50,000 per business-logic PRD. */
  riskCapital: string;
}

// Response: ApiResponse<CopyRelation>

/**
 * POST /api/copy-relations/:id/activate — Auth: Bearer (ADMIN or system)
 * Activate a PENDING copy relation. Triggers CopyPro start (outside any DB tx per C-10).
 */
export const POST_COPY_RELATION_ACTIVATE = '/api/copy-relations/:id/activate';

export interface CopyRelationPathParams {
  id: string;
}

// Response: ApiResponse<CopyRelation>

/**
 * POST /api/copy-relations/:id/pause — Auth: Bearer (owner or ADMIN)
 * Pause an ACTIVE copy relation.
 */
export const POST_COPY_RELATION_PAUSE = '/api/copy-relations/:id/pause';

// Response: ApiResponse<CopyRelation>

/**
 * POST /api/copy-relations/:id/resume — Auth: Bearer (owner or ADMIN)
 * Resume a PAUSED copy relation.
 */
export const POST_COPY_RELATION_RESUME = '/api/copy-relations/:id/resume';

// Response: ApiResponse<CopyRelation>

/**
 * POST /api/copy-relations/:id/close — Auth: Bearer (owner or ADMIN)
 * Close a copy relation. Final state — cannot be reopened.
 * C-30: Emits audit event before update returns.
 */
export const POST_COPY_RELATION_CLOSE = '/api/copy-relations/:id/close';

export interface CloseCopyRelationRequest {
  /** Optional reason for audit log. */
  reason?: string;
}

// Response: ApiResponse<CopyRelation>

/**
 * GET /api/copy-relations — Auth: Bearer
 * List copy relations for the authenticated user (or all, for ADMIN).
 */
export const GET_COPY_RELATIONS = '/api/copy-relations';

export interface GetCopyRelationsQuery {
  status?: CopyRelationStatus;
  strategyId?: string;
  cursor?: string;
  limit?: number;
}

// Response: ApiResponse<Paginated<CopyRelation>>

/**
 * GET /api/copy-relations/:id — Auth: Bearer (owner or ADMIN)
 */
export const GET_COPY_RELATION_BY_ID = '/api/copy-relations/:id';

// Response: ApiResponse<CopyRelation>

/**
 * PATCH /api/copy-relations/:id/risk-capital — Auth: Bearer (owner)
 * Update risk capital on a PAUSED copy relation.
 * Requires Idempotency-Key header.
 */
export const PATCH_COPY_RELATION_RISK_CAPITAL = '/api/copy-relations/:id/risk-capital';

export interface UpdateRiskCapitalRequest {
  /** Money string per C-02. */
  riskCapital: string;
}

// Response: ApiResponse<CopyRelation>

// ---------------------------------------------------------------------------
// 5. Wallet
// ---------------------------------------------------------------------------

export type TransactionType = 'DEPOSIT' | 'WITHDRAWAL' | 'TRANSFER' | 'FEE' | 'COMMISSION' | 'REWARD';
export type TransactionStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'FAILED';
export type NetworkType = 'ERC20' | 'TRC20' | 'BEP20';

export interface WalletBalance {
  /** Money — string per C-02 */
  available: string;
  /** Money — string per C-02. Locked in active positions, pending withdrawals, etc. */
  locked: string;
  /** Money — string per C-02. available + locked */
  total: string;
}

export interface Transaction {
  id: string;
  userId: string;
  type: TransactionType;
  /** Money — string per C-02 */
  amount: string;
  /** Money — string per C-02 */
  fee: string;
  /** Money — string per C-02. amount - fee for withdrawals */
  netAmount: string;
  network: NetworkType | null;
  txHash: string | null;
  status: TransactionStatus;
  confirmations: number;
  requiredConfirmations: number;
  fromAddress: string | null;
  toAddress: string | null;
  /** ISO 8601 */
  createdAt: string;
  /** ISO 8601 */
  updatedAt: string;
}

/**
 * GET /api/wallet/balance — Auth: Bearer
 * Get current wallet balance breakdown.
 */
export const GET_WALLET_BALANCE = '/api/wallet/balance';

// Response: ApiResponse<WalletBalance>

/**
 * POST /api/wallet/deposit — Auth: Bearer
 * Generate a deposit address or submit a TX hash.
 */
export const POST_WALLET_DEPOSIT = '/api/wallet/deposit';

export interface DepositRequest {
  network: NetworkType;
  /** If provided, submits TX hash for tracking. Otherwise returns deposit address. */
  txHash?: string;
}

export interface DepositAddressResponse {
  address: string;
  network: NetworkType;
  /** Minimum deposit in USDT — string per C-02 */
  minimumAmount: string;
  requiredConfirmations: number;
  /** ISO 8601 — address valid until */
  expiresAt: string | null;
}

// Response: ApiResponse<DepositAddressResponse | Transaction>
// When txHash provided: returns Transaction. Otherwise: returns DepositAddressResponse.

/**
 * POST /api/wallet/withdraw — Auth: Bearer
 * Submit a withdrawal request.
 * Requires Idempotency-Key header.
 * Auto-approved if <= $1000 and 2FA verified. Otherwise queued for manual review.
 */
export const POST_WALLET_WITHDRAW = '/api/wallet/withdraw';

export interface WithdrawRequest {
  /** Money string per C-02. Min $10. */
  amount: string;
  toAddress: string;
  network: NetworkType;
  /** 6-digit TOTP code from Google Authenticator */
  twoFaCode: string;
}

// Response: ApiResponse<Transaction>

/**
 * GET /api/wallet/transactions — Auth: Bearer
 * Paginated transaction history.
 */
export const GET_WALLET_TRANSACTIONS = '/api/wallet/transactions';

export interface GetTransactionsQuery {
  type?: TransactionType;
  status?: TransactionStatus;
  /** ISO 8601 date */
  fromDate?: string;
  /** ISO 8601 date */
  toDate?: string;
  cursor?: string;
  limit?: number;
}

// Response: ApiResponse<Paginated<Transaction>>

/**
 * POST /api/wallet/transactions/:id/cancel — Auth: Bearer (owner)
 * Cancel a PENDING withdrawal. Deposits cannot be cancelled.
 */
export const POST_WALLET_TRANSACTION_CANCEL = '/api/wallet/transactions/:id/cancel';

export interface TransactionPathParams {
  id: string;
}

// Response: ApiResponse<Transaction>

// ---------------------------------------------------------------------------
// 6. Atlas Gold
// ---------------------------------------------------------------------------

export type AtlasGoldTxType = 'BUY' | 'REDEEM';

export interface AtlasGoldBalance {
  /** Grams of gold — string for precision */
  grams: string;
  /** Equivalent USDT value — string per C-02 */
  usdtValue: string;
  /** Current spot price per gram — string per C-02 */
  spotPricePerGram: string;
  /** ISO 8601 */
  priceUpdatedAt: string;
}

export interface AtlasGoldTransaction {
  id: string;
  userId: string;
  type: AtlasGoldTxType;
  /** Grams */
  grams: string;
  /** USDT spent or received — string per C-02 */
  usdtAmount: string;
  /** Price per gram at time of transaction — string per C-02 */
  pricePerGram: string;
  /** ISO 8601 */
  createdAt: string;
}

/**
 * GET /api/atlas-gold/balance — Auth: Bearer
 * Get current Atlas Gold holdings.
 */
export const GET_ATLAS_GOLD_BALANCE = '/api/atlas-gold/balance';

// Response: ApiResponse<AtlasGoldBalance>

/**
 * POST /api/atlas-gold/buy — Auth: Bearer
 * Buy Atlas Gold using USDT from wallet.
 * Requires Idempotency-Key header.
 */
export const POST_ATLAS_GOLD_BUY = '/api/atlas-gold/buy';

export interface BuyAtlasGoldRequest {
  /** USDT amount to spend — string per C-02 */
  usdtAmount: string;
}

// Response: ApiResponse<AtlasGoldTransaction>

/**
 * POST /api/atlas-gold/redeem — Auth: Bearer
 * Redeem Atlas Gold back to USDT.
 * Requires Idempotency-Key header.
 */
export const POST_ATLAS_GOLD_REDEEM = '/api/atlas-gold/redeem';

export interface RedeemAtlasGoldRequest {
  /** Grams to redeem */
  grams: string;
}

// Response: ApiResponse<AtlasGoldTransaction>

/**
 * GET /api/atlas-gold/history — Auth: Bearer
 * Paginated Atlas Gold transaction history.
 */
export const GET_ATLAS_GOLD_HISTORY = '/api/atlas-gold/history';

export interface GetAtlasGoldHistoryQuery {
  type?: AtlasGoldTxType;
  cursor?: string;
  limit?: number;
}

// Response: ApiResponse<Paginated<AtlasGoldTransaction>>

// ---------------------------------------------------------------------------
// 7. Trades
// ---------------------------------------------------------------------------

export type TradeSide = 'BUY' | 'SELL';
export type TradeStatus = 'OPEN' | 'CLOSED' | 'CANCELLED';

export interface Trade {
  id: string;
  /** MT ticket number. Unique per (ticket, copyRelationId) per C-12. */
  ticket: string;
  copyRelationId: string | null;
  strategyId: string | null;
  userId: string;
  pair: string;
  side: TradeSide;
  /** Money — string per C-02 */
  entryPrice: string;
  /** Money — string per C-02. Null if open. */
  exitPrice: string | null;
  /** Lot size */
  volume: string;
  /** Realized P/L — string per C-02. Null if open. */
  realizedPl: string | null;
  /** Unrealized P/L from last poll — string per C-02. Null if closed. */
  unrealizedPl: string | null;
  /** Fee — string per C-02 */
  commission: string;
  status: TradeStatus;
  /** ISO 8601 */
  openedAt: string;
  /** ISO 8601 */
  closedAt: string | null;
}

/**
 * GET /api/trades — Auth: Bearer
 * List trades with filters.
 */
export const GET_TRADES = '/api/trades';

export interface GetTradesQuery {
  strategyId?: string;
  copyRelationId?: string;
  status?: TradeStatus;
  pair?: string;
  /** ISO 8601 */
  fromDate?: string;
  /** ISO 8601 */
  toDate?: string;
  cursor?: string;
  limit?: number;
}

// Response: ApiResponse<Paginated<Trade>>

/**
 * GET /api/trades/:id — Auth: Bearer
 */
export const GET_TRADE_BY_ID = '/api/trades/:id';

export interface TradePathParams {
  id: string;
}

// Response: ApiResponse<Trade>

// ---------------------------------------------------------------------------
// 8. Notifications
// ---------------------------------------------------------------------------

export type NotificationCategory =
  | 'TRADE'
  | 'WALLET'
  | 'COPY_RELATION'
  | 'STRATEGY'
  | 'SYSTEM'
  | 'SECURITY'
  | 'REWARD'
  | 'REFERRAL';

export interface Notification {
  id: string;
  userId: string;
  category: NotificationCategory;
  title: string;
  body: string;
  /** Arbitrary JSON payload for deep-linking or rendering. */
  payload: Record<string, unknown>;
  isRead: boolean;
  /** ISO 8601 */
  createdAt: string;
  /** ISO 8601. Auto-archived after 30 days per business-logic PRD. */
  archivedAt: string | null;
}

/**
 * GET /api/notifications — Auth: Bearer
 * List notifications for authenticated user.
 */
export const GET_NOTIFICATIONS = '/api/notifications';

export interface GetNotificationsQuery {
  isRead?: boolean;
  category?: NotificationCategory;
  cursor?: string;
  limit?: number;
}

// Response: ApiResponse<Paginated<Notification>>

/**
 * POST /api/notifications/:id/read — Auth: Bearer
 * Mark a single notification as read.
 */
export const POST_NOTIFICATION_READ = '/api/notifications/:id/read';

export interface NotificationPathParams {
  id: string;
}

// Response: ApiResponse<Notification>

/**
 * POST /api/notifications/read-all — Auth: Bearer
 * Mark ALL unread notifications as read.
 */
export const POST_NOTIFICATIONS_READ_ALL = '/api/notifications/read-all';

// Response: ApiResponse<{ count: number }>

// ---------------------------------------------------------------------------
// 9. Admin
// ---------------------------------------------------------------------------

// All admin routes require role = ADMIN or MANAGER.

export interface AdminUserDetail extends UserProfile {
  /** ISO 8601. 15-minute lockout after 5 failed login attempts. */
  lockedUntil: string | null;
  /** ISO 8601 */
  lastLoginAt: string | null;
  lastLoginIp: string | null;
  /** Money — string per C-02 */
  walletBalance: string;
  referredByUserId: string | null;
  activeSessionCount: number;
}

/**
 * GET /api/admin/users — Auth: Bearer (ADMIN | MANAGER)
 * List all users with search and filter.
 */
export const GET_ADMIN_USERS = '/api/admin/users';

export interface GetAdminUsersQuery {
  search?: string;
  role?: UserRole;
  status?: UserStatus;
  kycStatus?: KycStatus;
  cursor?: string;
  limit?: number;
}

// Response: ApiResponse<Paginated<AdminUserDetail>>

/**
 * GET /api/admin/users/:id — Auth: Bearer (ADMIN | MANAGER)
 */
export const GET_ADMIN_USER_BY_ID = '/api/admin/users/:id';

export interface AdminUserPathParams {
  id: string;
}

// Response: ApiResponse<AdminUserDetail>

/**
 * POST /api/admin/users/:id/suspend — Auth: Bearer (ADMIN)
 * Suspend a user. Preserves data, blocks all actions. C-31 applies.
 */
export const POST_ADMIN_USER_SUSPEND = '/api/admin/users/:id/suspend';

export interface SuspendUserRequest {
  reason: string;
}

// Response: ApiResponse<AdminUserDetail>

/**
 * POST /api/admin/users/:id/unsuspend — Auth: Bearer (ADMIN)
 */
export const POST_ADMIN_USER_UNSUSPEND = '/api/admin/users/:id/unsuspend';

// Response: ApiResponse<AdminUserDetail>

/**
 * POST /api/admin/users/:id/ban — Auth: Bearer (ADMIN)
 * Ban a user. Invalidates sessions, freezes balances, archives PII after 90 days per C-31.
 */
export const POST_ADMIN_USER_BAN = '/api/admin/users/:id/ban';

export interface BanUserRequest {
  reason: string;
}

// Response: ApiResponse<AdminUserDetail>

/**
 * POST /api/admin/users/:id/kyc/approve — Auth: Bearer (ADMIN)
 */
export const POST_ADMIN_KYC_APPROVE = '/api/admin/users/:id/kyc/approve';

// Response: ApiResponse<AdminUserDetail>

/**
 * POST /api/admin/users/:id/kyc/reject — Auth: Bearer (ADMIN)
 */
export const POST_ADMIN_KYC_REJECT = '/api/admin/users/:id/kyc/reject';

export interface KycRejectRequest {
  reason: string;
}

// Response: ApiResponse<AdminUserDetail>

/**
 * GET /api/admin/config — Auth: Bearer (ADMIN)
 * List all platform config keys with current values.
 */
export const GET_ADMIN_CONFIG = '/api/admin/config';

// Response: ApiResponse<ConfigEntry[]>

export interface ConfigEntry {
  key: string;
  value: string;
  /** Human-readable description of the config key. */
  description: string;
  /** ISO 8601 */
  updatedAt: string;
  updatedByUserId: string | null;
}

/**
 * PATCH /api/admin/config/:key — Auth: Bearer (ADMIN)
 * Update a single config value.
 * C-21: New keys must have defaults matching current PRD behavior.
 * C-03: Settlement split keys validated to sum to 1.00 exactly.
 */
export const PATCH_ADMIN_CONFIG = '/api/admin/config/:key';

export interface ConfigKeyPathParams {
  key: string;
}

export interface UpdateConfigRequest {
  value: string;
}

// Response: ApiResponse<ConfigEntry>

/**
 * GET /api/admin/withdrawals — Auth: Bearer (ADMIN | MANAGER)
 * Manual approval queue for withdrawals > $1000.
 */
export const GET_ADMIN_WITHDRAWALS = '/api/admin/withdrawals';

export interface GetAdminWithdrawalsQuery {
  status?: TransactionStatus;
  cursor?: string;
  limit?: number;
}

// Response: ApiResponse<Paginated<Transaction>>

/**
 * POST /api/admin/withdrawals/:id/approve — Auth: Bearer (ADMIN)
 * Approve a pending withdrawal. Dual-approval required for > $10,000 (enforced server-side).
 */
export const POST_ADMIN_WITHDRAWAL_APPROVE = '/api/admin/withdrawals/:id/approve';

// Response: ApiResponse<Transaction>

/**
 * POST /api/admin/withdrawals/:id/reject — Auth: Bearer (ADMIN)
 */
export const POST_ADMIN_WITHDRAWAL_REJECT = '/api/admin/withdrawals/:id/reject';

export interface RejectWithdrawalRequest {
  reason: string;
}

// Response: ApiResponse<Transaction>

// --- Manager-specific routes (MANAGER role can read but not approve) ---

/**
 * GET /api/manager/strategies — Auth: Bearer (MANAGER | ADMIN)
 * Operational view of all strategies with subscriber counts and health.
 */
export const GET_MANAGER_STRATEGIES = '/api/manager/strategies';

// Response: ApiResponse<Paginated<Strategy>>

/**
 * GET /api/manager/copy-relations — Auth: Bearer (MANAGER | ADMIN)
 * Operational view of all copy relations.
 */
export const GET_MANAGER_COPY_RELATIONS = '/api/manager/copy-relations';

export interface GetManagerCopyRelationsQuery {
  status?: CopyRelationStatus;
  strategyId?: string;
  cursor?: string;
  limit?: number;
}

// Response: ApiResponse<Paginated<CopyRelation>>

// ---------------------------------------------------------------------------
// 10. Webhooks (CopyPro callbacks)
// ---------------------------------------------------------------------------

/**
 * POST /webhooks/equity-protector — Auth: HMAC signature (X-CopyPro-Signature header)
 * Receives equity protection events from CopyPro.
 * C-13: equityProtectorUrl must be HTTPS in production.
 * No auth middleware — validated by HMAC.
 */
export const POST_WEBHOOK_EQUITY_PROTECTOR = '/webhooks/equity-protector';

export type EquityProtectorEvent =
  | 'DRAWDOWN_BREACHED'
  | 'EQUITY_RESTORED'
  | 'COPY_STOPPED'
  | 'COPY_STARTED';

export interface EquityProtectorWebhookPayload {
  event: EquityProtectorEvent;
  copyRelationId: string;
  /** Master login */
  masterLogin: string;
  /** Slave login */
  slaveLogin: string;
  /** Current equity — string per C-02 */
  currentEquity: string;
  /** Drawdown percentage — string */
  drawdownPct: string;
  /** ISO 8601 */
  timestamp: string;
}

// Response: 200 OK — CopyPro does not parse response body.
export interface WebhookAckResponse {
  received: true;
}

// ---------------------------------------------------------------------------
// 11. Export (CSV downloads)
// ---------------------------------------------------------------------------

/**
 * GET /api/export/transactions — Auth: Bearer
 * Download transaction history as CSV.
 * Response: text/csv with Content-Disposition: attachment; filename="transactions-{date}.csv"
 */
export const GET_EXPORT_TRANSACTIONS = '/api/export/transactions';

export interface ExportTransactionsQuery {
  type?: TransactionType;
  status?: TransactionStatus;
  /** ISO 8601 */
  fromDate?: string;
  /** ISO 8601 */
  toDate?: string;
}

/**
 * GET /api/export/trades — Auth: Bearer
 * Download trade history as CSV.
 * Response: text/csv with Content-Disposition: attachment; filename="trades-{date}.csv"
 */
export const GET_EXPORT_TRADES = '/api/export/trades';

export interface ExportTradesQuery {
  strategyId?: string;
  copyRelationId?: string;
  status?: TradeStatus;
  /** ISO 8601 */
  fromDate?: string;
  /** ISO 8601 */
  toDate?: string;
}

// ---------------------------------------------------------------------------
// 12. Profile & Settings (user self-service)
// ---------------------------------------------------------------------------

/**
 * PATCH /api/profile — Auth: Bearer
 * Update own profile (displayName, avatarUrl, phone).
 */
export const PATCH_PROFILE = '/api/profile';

export interface UpdateProfileRequest {
  displayName?: string;
  avatarUrl?: string;
  phone?: string;
}

// Response: ApiResponse<UserProfile>

/**
 * POST /api/profile/change-password — Auth: Bearer
 * Requires current password + 2FA. Invalidates all other sessions.
 */
export const POST_PROFILE_CHANGE_PASSWORD = '/api/profile/change-password';

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
  twoFaCode: string;
}

// Response: ApiResponse<{ success: true }>

/**
 * POST /api/profile/2fa/enable — Auth: Bearer
 * Step 1: Generate TOTP secret + QR code URI.
 */
export const POST_2FA_ENABLE = '/api/profile/2fa/enable';

export interface TwoFaEnableResponse {
  /** otpauth:// URI for QR code. */
  otpauthUri: string;
  /** 10 single-use backup codes. Store securely. */
  backupCodes: string[];
}

/**
 * POST /api/profile/2fa/verify — Auth: Bearer
 * Step 2: Confirm TOTP setup with a valid code.
 */
export const POST_2FA_VERIFY = '/api/profile/2fa/verify';

export interface TwoFaVerifyRequest {
  code: string;
}

// Response: ApiResponse<{ success: true }>

/**
 * POST /api/profile/2fa/disable — Auth: Bearer
 * Disable 2FA. Requires password + current 2FA code.
 */
export const POST_2FA_DISABLE = '/api/profile/2fa/disable';

export interface TwoFaDisableRequest {
  password: string;
  twoFaCode: string;
}

// Response: ApiResponse<{ success: true }>

/**
 * GET /api/profile/sessions — Auth: Bearer
 * List all active sessions.
 */
export const GET_PROFILE_SESSIONS = '/api/profile/sessions';

export interface SessionInfo {
  id: string;
  /** True if this is the current session. */
  isCurrent: boolean;
  deviceInfo: string;
  ipAddress: string;
  /** ISO 8601 */
  createdAt: string;
  /** ISO 8601 */
  lastSeenAt: string;
}

// Response: ApiResponse<SessionInfo[]>

/**
 * DELETE /api/profile/sessions/:id — Auth: Bearer
 * Revoke a specific session (logout device).
 */
export const DELETE_PROFILE_SESSION = '/api/profile/sessions/:id';

export interface SessionPathParams {
  id: string;
}

// Response: ApiResponse<{ success: true }>

/**
 * DELETE /api/profile/sessions — Auth: Bearer
 * Revoke all sessions except the current one.
 */
export const DELETE_PROFILE_SESSIONS_ALL = '/api/profile/sessions';

// Response: ApiResponse<{ revokedCount: number }>

// ---------------------------------------------------------------------------
// 13. Referral System
// ---------------------------------------------------------------------------

export type CommissionStatus = 'PENDING' | 'PAID' | 'CLAWED_BACK';

export interface ReferralStats {
  referralCode: string;
  /** Money — string per C-02 */
  totalEarnings: string;
  /** Money — string per C-02 */
  pendingEarnings: string;
  directReferrals: number;
  activeReferrals: number;
}

export interface CommissionRecord {
  id: string;
  referrerId: string;
  referredUserId: string;
  referredUserDisplayName: string;
  level: 1 | 2 | 3;
  activityType: 'TRADE_FEE' | 'SUBSCRIPTION' | 'DEPOSIT_BONUS';
  /** Money — string per C-02 */
  commissionAmount: string;
  /** Percentage — string */
  commissionPct: string;
  status: CommissionStatus;
  /** ISO 8601 */
  createdAt: string;
  /** ISO 8601 — when status moved to PAID */
  paidAt: string | null;
}

/**
 * GET /api/referral/stats — Auth: Bearer
 */
export const GET_REFERRAL_STATS = '/api/referral/stats';

// Response: ApiResponse<ReferralStats>

/**
 * GET /api/referral/commissions — Auth: Bearer
 * Paginated commission history.
 */
export const GET_REFERRAL_COMMISSIONS = '/api/referral/commissions';

export interface GetReferralCommissionsQuery {
  status?: CommissionStatus;
  cursor?: string;
  limit?: number;
}

// Response: ApiResponse<Paginated<CommissionRecord>>

// ---------------------------------------------------------------------------
// Endpoint inventory (for MSW mock generation and test coverage)
// ---------------------------------------------------------------------------

/**
 * Complete list of all route path constants, grouped by domain.
 * Agent 4 uses this to generate MSW handlers.
 */
export const ALL_ROUTES = {
  auth: [
    POST_AUTH_REGISTER,
    POST_AUTH_LOGIN,
    POST_AUTH_REFRESH,
    GET_AUTH_ME,
    POST_AUTH_LOGOUT,
    POST_AUTH_PASSWORD_RESET_REQUEST,
    POST_AUTH_PASSWORD_RESET_CONFIRM,
    POST_AUTH_OAUTH,
  ],
  mtAccounts: [
    POST_ACCOUNTS,
    GET_ACCOUNTS,
    GET_ACCOUNT_BY_ID,
    DELETE_ACCOUNT,
    GET_ACCOUNT_BALANCE,
  ],
  strategies: [
    POST_STRATEGIES,
    GET_STRATEGIES,
    GET_STRATEGY_BY_ID,
    PATCH_STRATEGY,
    DELETE_STRATEGY,
  ],
  copyRelations: [
    POST_COPY_RELATIONS_SUBSCRIBE,
    POST_COPY_RELATION_ACTIVATE,
    POST_COPY_RELATION_PAUSE,
    POST_COPY_RELATION_RESUME,
    POST_COPY_RELATION_CLOSE,
    GET_COPY_RELATIONS,
    GET_COPY_RELATION_BY_ID,
    PATCH_COPY_RELATION_RISK_CAPITAL,
  ],
  wallet: [
    GET_WALLET_BALANCE,
    POST_WALLET_DEPOSIT,
    POST_WALLET_WITHDRAW,
    GET_WALLET_TRANSACTIONS,
    POST_WALLET_TRANSACTION_CANCEL,
  ],
  atlasGold: [
    GET_ATLAS_GOLD_BALANCE,
    POST_ATLAS_GOLD_BUY,
    POST_ATLAS_GOLD_REDEEM,
    GET_ATLAS_GOLD_HISTORY,
  ],
  trades: [
    GET_TRADES,
    GET_TRADE_BY_ID,
  ],
  notifications: [
    GET_NOTIFICATIONS,
    POST_NOTIFICATION_READ,
    POST_NOTIFICATIONS_READ_ALL,
  ],
  admin: [
    GET_ADMIN_USERS,
    GET_ADMIN_USER_BY_ID,
    POST_ADMIN_USER_SUSPEND,
    POST_ADMIN_USER_UNSUSPEND,
    POST_ADMIN_USER_BAN,
    POST_ADMIN_KYC_APPROVE,
    POST_ADMIN_KYC_REJECT,
    GET_ADMIN_CONFIG,
    PATCH_ADMIN_CONFIG,
    GET_ADMIN_WITHDRAWALS,
    POST_ADMIN_WITHDRAWAL_APPROVE,
    POST_ADMIN_WITHDRAWAL_REJECT,
    GET_MANAGER_STRATEGIES,
    GET_MANAGER_COPY_RELATIONS,
  ],
  webhooks: [
    POST_WEBHOOK_EQUITY_PROTECTOR,
  ],
  export: [
    GET_EXPORT_TRANSACTIONS,
    GET_EXPORT_TRADES,
  ],
  profile: [
    PATCH_PROFILE,
    POST_PROFILE_CHANGE_PASSWORD,
    POST_2FA_ENABLE,
    POST_2FA_VERIFY,
    POST_2FA_DISABLE,
    GET_PROFILE_SESSIONS,
    DELETE_PROFILE_SESSION,
    DELETE_PROFILE_SESSIONS_ALL,
  ],
  referral: [
    GET_REFERRAL_STATS,
    GET_REFERRAL_COMMISSIONS,
  ],
} as const;
