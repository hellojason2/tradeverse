import { Decimal } from '@prisma/client/runtime/library';
import { env } from '../config/env.js';
import type {
  CopyProClient,
  CopyProConfig,
  CopyProError,
  AddAccountRequest,
  UpdateAccountRequest,
  StartCopierRequest,
  StartCopierResult,
  UpdateCopierRequest,
  UpdateEquityProtectorRequest,
  UpdateEquityProtectorCallbackRequest,
  GetTradeLogsRequest,
  GetAllTradeLogsRequest,
  SetTradeLogCallbackRequest,
  CopyProAccount,
  AccountWithSummaryResult,
  CopierStatusResponse,
  TradeLogEntry,
  CopyProExceptionResult,
  CopierPauseReason,
} from '../contracts/copyPro.js';

// ---------------------------------------------------------------------------
// Circuit breaker
// ---------------------------------------------------------------------------

type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

class CircuitBreaker {
  private state: CircuitState = 'CLOSED';
  private failures = 0;
  private lastFailureTime = 0;
  private readonly threshold: number;
  private readonly resetTimeoutMs: number;

  constructor(threshold = 5, resetTimeoutMs = 30000) {
    this.threshold = threshold;
    this.resetTimeoutMs = resetTimeoutMs;
  }

  canExecute(): boolean {
    if (this.state === 'CLOSED') return true;
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailureTime >= this.resetTimeoutMs) {
        this.state = 'HALF_OPEN';
        return true;
      }
      return false;
    }
    return true; // HALF_OPEN
  }

  recordSuccess(): void {
    this.failures = 0;
    this.state = 'CLOSED';
  }

  recordFailure(): void {
    this.failures++;
    this.lastFailureTime = Date.now();
    if (this.failures >= this.threshold) {
      this.state = 'OPEN';
    }
  }
}

// ---------------------------------------------------------------------------
// Helper: build URL with query params
// ---------------------------------------------------------------------------

function buildUrl(base: string, path: string, params?: Record<string, string | number | boolean | undefined>): string {
  const url = new URL(path, base);
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null) {
        url.searchParams.set(key, String(value));
      }
    }
  }
  return url.toString();
}

// ---------------------------------------------------------------------------
// Helper: parse CopyPro error response (HTTP 201 carries ExceptionResult[])
// ---------------------------------------------------------------------------

function parseCopyProError(status: number, body: unknown): CopyProError {
  if (status === 201 && Array.isArray(body)) {
    const first = body[0] as CopyProExceptionResult | undefined;
    if (first) {
      return {
        kind: 'INVALID_REQUEST',
        message: first.message,
        code: first.code,
      };
    }
  }
  if (status >= 500) {
    return {
      kind: 'UPSTREAM_5XX',
      message: `CopyPro returned ${status}`,
      status,
      body: JSON.stringify(body),
    };
  }
  return {
    kind: 'INVALID_REQUEST',
    message: `CopyPro returned ${status}: ${JSON.stringify(body)}`,
  };
}

// ---------------------------------------------------------------------------
// CopyPro HTTP client implementation
// ---------------------------------------------------------------------------

export class CopyProClientImpl implements CopyProClient {
  private readonly baseUrl: string;
  private readonly managerKey: string;
  private readonly userKey: string;
  private readonly timeoutMs: number;
  private readonly circuit: CircuitBreaker;

  constructor(config?: Partial<CopyProConfig>) {
    this.baseUrl = config?.baseUrl ?? env.COPYPRO_BASE_URL;
    this.managerKey = config?.managerKey ?? env.COPYPRO_MANAGER_KEY ?? '';
    this.userKey = config?.userKey ?? '';
    this.timeoutMs = config?.timeoutMs ?? 10_000;
    const cbThreshold = config?.circuitBreakerThreshold ?? 5;
    this.circuit = new CircuitBreaker(cbThreshold, 30_000);
  }

  private async fetchJson<T>(path: string, params?: Record<string, string | number | boolean | undefined>): Promise<T> {
    if (!this.circuit.canExecute()) {
      throw { kind: 'CIRCUIT_OPEN', message: 'CopyPro circuit breaker is open' } as CopyProError;
    }

    const url = buildUrl(this.baseUrl, path, params);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await fetch(url, {
        method: 'GET',
        signal: controller.signal,
      });
      clearTimeout(timeout);

      const body = await response.json().catch(() => null);

      if (!response.ok || response.status === 201) {
        const error = parseCopyProError(response.status, body);
        this.circuit.recordFailure();
        throw error;
      }

      this.circuit.recordSuccess();
      return body as T;
    } catch (err) {
      clearTimeout(timeout);
      if (err && typeof err === 'object' && 'kind' in err) {
        throw err;
      }
      if (err instanceof Error && err.name === 'AbortError') {
        this.circuit.recordFailure();
        throw { kind: 'NETWORK_TIMEOUT', message: 'CopyPro request timed out', cause: err } as CopyProError;
      }
      this.circuit.recordFailure();
      throw {
        kind: 'UPSTREAM_5XX',
        message: err instanceof Error ? err.message : 'Unknown network error',
        status: 0,
      } as CopyProError;
    }
  }

  // -------------------------------------------------------------------------
  // Account lifecycle
  // -------------------------------------------------------------------------

  async createAccount(req: AddAccountRequest): Promise<{ accountId: string; apiId?: string }> {
    const result = await this.fetchJson<{ accountId: string; apiId?: string }>('/AddAccount', {
      managerKey: this.managerKey,
      name: req.name,
      userKey: this.userKey,
      type: req.type,
      user: req.user,
      password: req.password,
      server: req.server,
      apiId: req.apiId,
    });
    return result;
  }

  async updateAccount(req: UpdateAccountRequest): Promise<void> {
    await this.fetchJson<unknown>('/UpdateAccount', {
      accountId: req.accountId,
      accountName: req.accountName,
      considerAccountBalance: req.considerAccountBalance,
    });
  }

  async removeAccount(accountId: string): Promise<void> {
    await this.fetchJson<unknown>('/RemoveAccount', {
      accountId,
      userKey: this.userKey,
    });
  }

  async removeAccountByApiId(apiId: string): Promise<void> {
    await this.fetchJson<unknown>('/RemoveAccountByApiId', {
      apiId,
      userKey: this.userKey,
    });
  }

  async listAccounts(): Promise<CopyProAccount[]> {
    return this.fetchJson<CopyProAccount[]>('/Accounts', {
      userKey: this.userKey,
    });
  }

  async getAccountById(accountId: string): Promise<CopyProAccount> {
    return this.fetchJson<CopyProAccount>('/GetAccount', {
      accountId,
    });
  }

  // -------------------------------------------------------------------------
  // Balance / equity polling
  // -------------------------------------------------------------------------

  async getAccountWithSummary(accountId: string): Promise<AccountWithSummaryResult> {
    return this.fetchJson<AccountWithSummaryResult>('/AccountWithSummary', {
      userKey: this.userKey,
      accountId,
    });
  }

  async getAccountBalance(accountId: string): Promise<number> {
    const summary = await this.getAccountWithSummary(accountId);
    return summary.accountSummary?.balance ?? 0;
  }

  async getAccountEquity(accountId: string): Promise<number> {
    const summary = await this.getAccountWithSummary(accountId);
    return summary.accountSummary?.equity ?? 0;
  }

  // -------------------------------------------------------------------------
  // Copier lifecycle
  // -------------------------------------------------------------------------

  async startCopierByAccountId(req: StartCopierRequest): Promise<StartCopierResult> {
    const result = await this.fetchJson<StartCopierResult>('/StartByAccountId', {
      managerKey: this.managerKey,
      userKey: this.userKey,
      masterAccountId: req.masterAccountId,
      slaveAccountId: req.slaveAccountId,
      riskType: req.riskType,
      riskValue: req.riskValue,
      copySL: req.copySL,
      copyTP: req.copyTP,
      fixedSlPips: req.fixedSlPips,
      fixedTpPips: req.fixedTpPips,
      copyPendingOrders: req.copyPendingOrders,
      fixedMasterBalance: req.fixedMasterBalance,
      reverseCopy: req.reverseCopy,
      stopLossRefinementPips: req.stopLossRefinementPips,
      takeProfitRefinementPips: req.takeProfitRefinementPips,
      forceMinLot: req.forceMinLot,
      forceMaxLot: req.forceMaxLot,
      copyExistingTrades: req.copyExistingTrades,
      contractAlignment: req.contractAlignment,
      copyExpiryTime: req.copyExpiryTime,
      strictClose: req.strictClose,
      copyMagicNumber: req.copyMagicNumber,
      magicNumber: req.magicNumber,
      tradeDelayMs: req.tradeDelayMs,
      lotRefiner: req.lotRefiner,
      filterMagicOption: req.filterMagicOption,
      filterMagicValue: req.filterMagicValue,
      filterCommentOption: req.filterCommentOption,
      filterCommentValue: req.filterCommentValue,
      filterSide: req.filterSide,
      filterLotEnabled: req.filterLotEnabled,
      filterLotMin: req.filterLotMin,
      filterLotMax: req.filterLotMax,
    });
    return result;
  }

  async getCopierById(copierId: string): Promise<CopierStatusResponse> {
    return this.fetchJson<CopierStatusResponse>('/GetCopier', {
      id: copierId,
    });
  }

  async listCopiers(): Promise<CopierStatusResponse[]> {
    return this.fetchJson<CopierStatusResponse[]>('/UserCopiers', {
      userKey: this.userKey,
    });
  }

  async updateCopier(req: UpdateCopierRequest): Promise<void> {
    await this.fetchJson<unknown>('/UpdateCopier', {
      id: req.copierId,
      userKey: this.userKey,
      riskType: req.riskType,
      riskValue: req.riskValue,
      copySL: req.copySL,
      copyTP: req.copyTP,
      fixedSlPips: req.fixedSlPips,
      fixedTpPips: req.fixedTpPips,
      copyPendingOrders: req.copyPendingOrders,
      reverseCopy: req.reverseCopy,
      stopLossRefinementPips: req.stopLossRefinementPips,
      takeProfitRefinementPips: req.takeProfitRefinementPips,
      forceMinLot: req.forceMinLot,
      forceMaxLot: req.forceMaxLot,
      filterSide: req.filterSide,
      filterLotEnabled: req.filterLotEnabled,
      filterLotMin: req.filterLotMin,
      filterLotMax: req.filterLotMax,
      filterMagicOption: req.filterMagicOption,
      filterMagicValue: req.filterMagicValue,
      filterCommentOption: req.filterCommentOption,
      filterCommentValue: req.filterCommentValue,
    });
  }

  async pauseCopier(copierId: string, paused: boolean, reason?: CopierPauseReason): Promise<void> {
    await this.fetchJson<unknown>('/CopierPause', {
      id: copierId,
      paused,
      reason,
    });
  }

  async removeCopier(copierId: string, closeTrades?: boolean): Promise<void> {
    await this.fetchJson<unknown>('/Remove', {
      id: copierId,
      closeTrades,
    });
  }

  // -------------------------------------------------------------------------
  // Equity protector
  // -------------------------------------------------------------------------

  async updateEquityProtector(req: UpdateEquityProtectorRequest): Promise<void> {
    await this.fetchJson<unknown>('/UpdateEquityProtector', {
      accountId: req.accountId,
      enabled: req.enabled,
      dailyReset: req.dailyReset,
      alert: req.alert,
      disableCopier: req.disableCopier,
      closeCopiedTrades: req.closeCopiedTrades,
      closeAllTrades: req.closeAllTrades,
      stopLossPercent: req.stopLossPercent,
      stopLossValue: req.stopLossValue,
      stopLossAbsolute: req.stopLossAbsolute,
      takeProfitPercent: req.takeProfitPercent,
      takeProfitValue: req.takeProfitValue,
      takeProfitAbsolute: req.takeProfitAbsolute,
    });
  }

  async updateEquityProtectorCallback(req: UpdateEquityProtectorCallbackRequest): Promise<void> {
    await this.fetchJson<unknown>('/UpdateEquityProtectorCallback', {
      accountId: req.accountId,
      callbackUrl: req.callbackUrl,
    });
  }

  // -------------------------------------------------------------------------
  // Trade logs
  // -------------------------------------------------------------------------

  async getTradeLogs(req: GetTradeLogsRequest): Promise<TradeLogEntry[]> {
    return this.fetchJson<TradeLogEntry[]>('/TradeLogs', {
      copierId: req.copierId,
      limit: req.limit,
    });
  }

  async getAllTradeLogs(req: GetAllTradeLogsRequest): Promise<TradeLogEntry[]> {
    return this.fetchJson<TradeLogEntry[]>('/TradeLogsAll', {
      userKey: this.userKey,
      limit: req.limit,
    });
  }

  async setTradeLogCallback(req: SetTradeLogCallbackRequest): Promise<void> {
    await this.fetchJson<unknown>('/SetTradeLogCallback', {
      id: req.copierId,
      callbackUrl: req.callbackUrl,
    });
  }
}

// ---------------------------------------------------------------------------
// Factory for per-user instances
// ---------------------------------------------------------------------------

export function createCopyProClient(userKey: string): CopyProClient {
  return new CopyProClientImpl({
    baseUrl: env.COPYPRO_BASE_URL,
    managerKey: env.COPYPRO_MANAGER_KEY,
    userKey,
    timeoutMs: 10_000,
    circuitBreakerThreshold: 5,
    callbackUrl: '',
  });
}
