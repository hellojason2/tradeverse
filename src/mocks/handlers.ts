import { http, HttpResponse, delay } from 'msw';
import type {
  UserProfile,
  LoginResponse,
  RegisterResponse,
  RefreshResponse,
  Strategy,
  CopyRelation,
  WalletBalance,
  Transaction,
  AtlasGoldBalance,
  AtlasGoldTransaction,
  Notification,
  AdminUserDetail,
  ConfigEntry,
  ApiSuccess,
  Paginated,
} from '@contracts/routes';

const mockUser: UserProfile = {
  id: 'u-001',
  email: 'trader@tradeverse.io',
  displayName: 'Alex Morgan',
  avatarUrl: null,
  role: 'USER',
  status: 'ACTIVE',
  kycStatus: 'VERIFIED',
  phone: null,
  referralCode: 'ALEX2026',
  twoFaEnabled: false,
  createdAt: '2025-11-15T10:00:00Z',
  emailVerifiedAt: '2025-11-15T10:05:00Z',
};

const mockAdminUser: AdminUserDetail = {
  ...mockUser,
  lockedUntil: null,
  lastLoginAt: '2026-04-21T08:00:00Z',
  lastLoginIp: '192.168.1.1',
  walletBalance: '105847.32',
  referredByUserId: null,
  activeSessionCount: 2,
};

const mockUsers: AdminUserDetail[] = [
  mockAdminUser,
  {
    ...mockUser,
    id: 'u-002',
    email: 'jane@example.com',
    displayName: 'Jane Smith',
    role: 'PROVIDER',
    status: 'ACTIVE',
    walletBalance: '45230.00',
    lockedUntil: null,
    lastLoginAt: '2026-04-20T12:00:00Z',
    lastLoginIp: '10.0.0.2',
    referredByUserId: null,
    activeSessionCount: 1,
  },
  {
    ...mockUser,
    id: 'u-003',
    email: 'bob@example.com',
    displayName: 'Bob Wilson',
    role: 'ADMIN',
    status: 'ACTIVE',
    walletBalance: '234567.89',
    lockedUntil: null,
    lastLoginAt: '2026-04-21T06:00:00Z',
    lastLoginIp: '10.0.0.3',
    referredByUserId: null,
    activeSessionCount: 3,
  },
  {
    ...mockUser,
    id: 'u-004',
    email: 'eve@example.com',
    displayName: 'Eve Davis',
    role: 'USER',
    status: 'SUSPENDED',
    kycStatus: 'PENDING',
    walletBalance: '1234.56',
    lockedUntil: null,
    lastLoginAt: '2026-04-18T09:00:00Z',
    lastLoginIp: '10.0.0.4',
    referredByUserId: null,
    activeSessionCount: 0,
  },
];

const mockStrategies: Strategy[] = [
  {
    id: 's-001',
    providerId: 'u-002',
    providerName: 'Jane Smith',
    providerAvatarUrl: null,
    name: 'Momentum Scalper',
    description: 'High-frequency scalping on major forex pairs using momentum indicators.',
    tags: ['SCALPING', 'FOREX'],
    status: 'ACTIVE',
    fundraisingTarget: '100000.00',
    fundraisingRaised: '0.00',
    aum: '523400.00',
    profitSharePct: '20.00',
    winRate: '72.30',
    maxDrawdown: '8.40',
    tradeCount: 847,
    followerCount: 34,
    masterAccountId: 'ma-001',
    fundraisingExpiresAt: null,
    createdAt: '2025-08-10T10:00:00Z',
  },
  {
    id: 's-002',
    providerId: 'u-002',
    providerName: 'Jane Smith',
    providerAvatarUrl: null,
    name: 'Trend Rider Pro',
    description: 'Trend following on crypto with strict risk management.',
    tags: ['TREND', 'CRYPTO'],
    status: 'ACTIVE',
    fundraisingTarget: '200000.00',
    fundraisingRaised: '50000.00',
    aum: '1456700.00',
    profitSharePct: '25.00',
    winRate: '64.80',
    maxDrawdown: '12.10',
    tradeCount: 234,
    followerCount: 89,
    masterAccountId: 'ma-002',
    fundraisingExpiresAt: '2026-05-01T00:00:00Z',
    createdAt: '2025-06-01T10:00:00Z',
  },
  {
    id: 's-003',
    providerId: 'u-002',
    providerName: 'Jane Smith',
    providerAvatarUrl: null,
    name: 'Range Master',
    description: 'Range trading on volatile JPY pairs.',
    tags: ['RANGE', 'JPY'],
    status: 'PAUSED',
    fundraisingTarget: '50000.00',
    fundraisingRaised: '0.00',
    aum: '123400.00',
    profitSharePct: '15.00',
    winRate: '58.90',
    maxDrawdown: '18.30',
    tradeCount: 567,
    followerCount: 12,
    masterAccountId: 'ma-003',
    fundraisingExpiresAt: null,
    createdAt: '2025-09-20T10:00:00Z',
  },
];

const mockCopyRelations: CopyRelation[] = [
  {
    id: 'cr-001',
    userId: 'u-001',
    strategyId: 's-001',
    strategyName: 'Momentum Scalper',
    slaveAccountId: 'sa-001',
    status: 'ACTIVE',
    riskCapital: '5000.00',
    followerSplitPctSnapshot: '0.60',
    traderSplitPctSnapshot: '0.20',
    insuranceSplitPctSnapshot: '0.15',
    platformSplitPctSnapshot: '0.05',
    createdAt: '2026-03-15T10:00:00Z',
    activatedAt: '2026-03-15T10:05:00Z',
    closedAt: null,
  },
  {
    id: 'cr-002',
    userId: 'u-001',
    strategyId: 's-002',
    strategyName: 'Trend Rider Pro',
    slaveAccountId: 'sa-002',
    status: 'PAUSED',
    riskCapital: '3000.00',
    followerSplitPctSnapshot: '0.60',
    traderSplitPctSnapshot: '0.20',
    insuranceSplitPctSnapshot: '0.15',
    platformSplitPctSnapshot: '0.05',
    createdAt: '2026-04-01T10:00:00Z',
    activatedAt: '2026-04-01T10:05:00Z',
    closedAt: null,
  },
];

const mockWalletBalance: WalletBalance = {
  available: '89234.56',
  locked: '16612.76',
  total: '105847.32',
};

const mockTransactions: Transaction[] = [
  { id: 'tx-001', userId: 'u-001', type: 'DEPOSIT', amount: '10000.00', fee: '0.00', netAmount: '10000.00', network: 'ERC20', txHash: '0xabc123def456', status: 'CONFIRMED', confirmations: 12, requiredConfirmations: 12, fromAddress: null, toAddress: '0x742d...2bD68', createdAt: '2026-04-20T14:30:00Z', updatedAt: '2026-04-20T14:30:00Z' },
  { id: 'tx-002', userId: 'u-001', type: 'WITHDRAWAL', amount: '-2500.00', fee: '5.00', netAmount: '-2505.00', network: 'TRC20', txHash: '0x789abc123def', status: 'CONFIRMED', confirmations: 24, requiredConfirmations: 24, fromAddress: null, toAddress: 'TJYSq...9cVPn', createdAt: '2026-04-19T10:15:00Z', updatedAt: '2026-04-19T10:15:00Z' },
  { id: 'tx-003', userId: 'u-001', type: 'DEPOSIT', amount: '5000.00', fee: '0.00', netAmount: '5000.00', network: 'BEP20', txHash: '0xdef456abc789', status: 'CONFIRMED', confirmations: 20, requiredConfirmations: 20, fromAddress: null, toAddress: '0x8ba1...DBA72', createdAt: '2026-04-18T08:45:00Z', updatedAt: '2026-04-18T08:45:00Z' },
  { id: 'tx-004', userId: 'u-001', type: 'WITHDRAWAL', amount: '-1200.00', fee: '1.00', netAmount: '-1201.00', network: 'ERC20', txHash: '0x111222333444', status: 'PENDING', confirmations: 0, requiredConfirmations: 12, fromAddress: null, toAddress: '0x742d...2bD68', createdAt: '2026-04-20T16:00:00Z', updatedAt: '2026-04-20T16:00:00Z' },
];

const mockAtlasGoldBalance: AtlasGoldBalance = {
  grams: '45.6789',
  usdtValue: '2842.43',
  spotPricePerGram: '62.23',
  priceUpdatedAt: '2026-04-21T10:00:00Z',
};

const mockAtlasGoldHistory: AtlasGoldTransaction[] = [
  { id: 'agt-001', userId: 'u-001', type: 'BUY', grams: '10.0000', usdtAmount: '580.00', pricePerGram: '58.00', createdAt: '2026-04-10T10:00:00Z' },
  { id: 'agt-002', userId: 'u-001', type: 'BUY', grams: '20.0000', usdtAmount: '1200.00', pricePerGram: '60.00', createdAt: '2026-04-15T10:00:00Z' },
  { id: 'agt-003', userId: 'u-001', type: 'REDEEM', grams: '5.0000', usdtAmount: '310.00', pricePerGram: '62.00', createdAt: '2026-04-18T10:00:00Z' },
];

const mockNotifications: Notification[] = [
  { id: 'n-001', userId: 'u-001', category: 'TRADE', title: 'Strategy Update', body: 'Momentum Scalper closed 3 positions with +2.4% profit.', payload: {}, isRead: false, createdAt: '2026-04-20T15:30:00Z', archivedAt: null },
  { id: 'n-002', userId: 'u-001', category: 'COPY_RELATION', title: 'Copy Trade Opened', body: 'CryptoWhale opened EUR/USD BUY 0.5 lots.', payload: {}, isRead: false, createdAt: '2026-04-20T14:15:00Z', archivedAt: null },
  { id: 'n-003', userId: 'u-001', category: 'STRATEGY', title: 'Drawdown Alert', body: 'Range Master hit 15% drawdown. Consider pausing.', payload: {}, isRead: false, createdAt: '2026-04-20T12:00:00Z', archivedAt: null },
  { id: 'n-004', userId: 'u-001', category: 'WALLET', title: 'Deposit Confirmed', body: '10,000 USDT deposit confirmed on ERC20.', payload: {}, isRead: true, createdAt: '2026-04-19T14:30:00Z', archivedAt: null },
  { id: 'n-005', userId: 'u-001', category: 'SYSTEM', title: 'New Follower', body: 'JohnDoe started copying your Trend Rider Pro strategy.', payload: {}, isRead: true, createdAt: '2026-04-18T10:00:00Z', archivedAt: null },
];

const mockConfig: ConfigEntry[] = [
  { key: 'strategy.split.default.follower_pct', value: '0.60', description: 'Default follower share in Atlas Gold strategies', updatedAt: '2026-04-01T00:00:00Z', updatedByUserId: 'u-003' },
  { key: 'strategy.split.default.trader_pct', value: '0.20', description: 'Default trader share in Atlas Gold', updatedAt: '2026-04-01T00:00:00Z', updatedByUserId: 'u-003' },
  { key: 'strategy.split.default.insurance_investor_pct', value: '0.15', description: 'Default insurance investor share', updatedAt: '2026-04-01T00:00:00Z', updatedByUserId: 'u-003' },
  { key: 'strategy.split.default.platform_pct', value: '0.05', description: 'Default platform share', updatedAt: '2026-04-01T00:00:00Z', updatedByUserId: 'u-003' },
  { key: 'strategy.limits.min_risk_capital', value: '100.00', description: 'Global minimum risk capital (USDT)', updatedAt: '2026-04-01T00:00:00Z', updatedByUserId: null },
  { key: 'strategy.limits.max_risk_capital', value: '50000.00', description: 'Global maximum risk capital per user per strategy', updatedAt: '2026-04-01T00:00:00Z', updatedByUserId: null },
];

function success<T>(data: T): ApiSuccess<T> {
  return { data };
}

function paginated<T>(items: T[]): Paginated<T> {
  return { items, nextCursor: null, total: items.length };
}

export const handlers = [
  // Auth
  http.post('/api/auth/login', async ({ request }) => {
    await delay(300);
    const body = (await request.json()) as { identifier?: string; password?: string };
    if (body?.identifier === 'trader@tradeverse.io' && body?.password === 'password') {
      const res: LoginResponse = {
        accessToken: 'mock-jwt-access-token',
        refreshToken: 'mock-jwt-refresh-token',
        expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
        user: mockUser,
      };
      return HttpResponse.json(success(res));
    }
    return HttpResponse.json({ error: { code: 'INVALID_CREDENTIALS', message: 'Invalid credentials' } }, { status: 401 });
  }),

  http.post('/api/auth/register', async ({ request }) => {
    await delay(300);
    const _body = (await request.json()) as { email?: string; password?: string; confirmPassword?: string; acceptedTerms?: boolean };
    void _body;
    const res: RegisterResponse = {
      userId: 'u-new',
      accessToken: 'mock-jwt-access-new',
      refreshToken: 'mock-jwt-refresh-new',
      expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
    };
    return HttpResponse.json(success(res));
  }),

  http.get('/api/auth/me', async () => {
    await delay(100);
    return HttpResponse.json(success(mockUser));
  }),

  http.post('/api/auth/refresh', async () => {
    await delay(100);
    const res: RefreshResponse = {
      accessToken: 'mock-jwt-refreshed',
      refreshToken: 'mock-jwt-refresh-new',
      expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
    };
    return HttpResponse.json(success(res));
  }),

  http.post('/api/auth/oauth/:provider', async ({ params }) => {
    await delay(500);
    const res: LoginResponse = {
      accessToken: 'mock-oauth-access',
      refreshToken: 'mock-oauth-refresh',
      expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
      user: { ...mockUser, displayName: `${params.provider} User` },
    };
    return HttpResponse.json(success(res));
  }),

  // Strategies
  http.get('/api/strategies', async ({ request }) => {
    await delay(200);
    const url = new URL(request.url);
    const status = url.searchParams.get('status');
    let items = [...mockStrategies];
    if (status) items = items.filter((s) => s.status === status);
    return HttpResponse.json(success(paginated(items)));
  }),

  http.get('/api/strategies/:id', async ({ params }) => {
    await delay(150);
    const strategy = mockStrategies.find((s) => s.id === params.id);
    if (!strategy) return HttpResponse.json({ error: { code: 'NOT_FOUND', message: 'Strategy not found' } }, { status: 404 });
    return HttpResponse.json(success(strategy));
  }),

  http.post('/api/strategies', async () => {
    await delay(300);
    return HttpResponse.json(success(mockStrategies[0]), { status: 201 });
  }),

  http.patch('/api/strategies/:id', async ({ params }) => {
    await delay(200);
    const strategy = mockStrategies.find((s) => s.id === params.id);
    if (!strategy) return HttpResponse.json({ error: { code: 'NOT_FOUND', message: 'Strategy not found' } }, { status: 404 });
    return HttpResponse.json(success(strategy));
  }),

  http.delete('/api/strategies/:id', async () => {
    await delay(200);
    return HttpResponse.json(success({ success: true as const }));
  }),

  // Copy Relations
  http.get('/api/copy-relations', async ({ request }) => {
    await delay(200);
    const url = new URL(request.url);
    const status = url.searchParams.get('status');
    let items = [...mockCopyRelations];
    if (status) items = items.filter((r) => r.status === status);
    return HttpResponse.json(success(paginated(items)));
  }),

  http.get('/api/copy-relations/:id', async ({ params }) => {
    await delay(150);
    const rel = mockCopyRelations.find((r) => r.id === params.id);
    if (!rel) return HttpResponse.json({ error: { code: 'NOT_FOUND', message: 'Not found' } }, { status: 404 });
    return HttpResponse.json(success(rel));
  }),

  http.post('/api/copy-relations/subscribe', async () => {
    await delay(300);
    return HttpResponse.json(success(mockCopyRelations[0]), { status: 201 });
  }),

  http.post('/api/copy-relations/:id/activate', async ({ params }) => {
    await delay(200);
    const rel = mockCopyRelations.find((r) => r.id === params.id);
    if (!rel) return HttpResponse.json({ error: { code: 'NOT_FOUND', message: 'Not found' } }, { status: 404 });
    return HttpResponse.json(success({ ...rel, status: 'ACTIVE' as const }));
  }),

  http.post('/api/copy-relations/:id/pause', async ({ params }) => {
    await delay(200);
    const rel = mockCopyRelations.find((r) => r.id === params.id);
    if (!rel) return HttpResponse.json({ error: { code: 'NOT_FOUND', message: 'Not found' } }, { status: 404 });
    return HttpResponse.json(success({ ...rel, status: 'PAUSED' as const }));
  }),

  http.post('/api/copy-relations/:id/resume', async ({ params }) => {
    await delay(200);
    const rel = mockCopyRelations.find((r) => r.id === params.id);
    if (!rel) return HttpResponse.json({ error: { code: 'NOT_FOUND', message: 'Not found' } }, { status: 404 });
    return HttpResponse.json(success({ ...rel, status: 'ACTIVE' as const }));
  }),

  http.post('/api/copy-relations/:id/close', async ({ params }) => {
    await delay(200);
    const rel = mockCopyRelations.find((r) => r.id === params.id);
    if (!rel) return HttpResponse.json({ error: { code: 'NOT_FOUND', message: 'Not found' } }, { status: 404 });
    return HttpResponse.json(success({ ...rel, status: 'CLOSED' as const, closedAt: new Date().toISOString() }));
  }),

  http.patch('/api/copy-relations/:id/risk-capital', async ({ params }) => {
    await delay(200);
    const rel = mockCopyRelations.find((r) => r.id === params.id);
    if (!rel) return HttpResponse.json({ error: { code: 'NOT_FOUND', message: 'Not found' } }, { status: 404 });
    return HttpResponse.json(success(rel));
  }),

  // Wallet
  http.get('/api/wallet/balance', async () => {
    await delay(200);
    return HttpResponse.json(success(mockWalletBalance));
  }),

  http.get('/api/wallet/transactions', async ({ request }) => {
    await delay(200);
    const url = new URL(request.url);
    const type = url.searchParams.get('type');
    let items = [...mockTransactions];
    if (type) items = items.filter((t) => t.type === type);
    return HttpResponse.json(success(paginated(items)));
  }),

  http.post('/api/wallet/deposit', async () => {
    await delay(500);
    const tx: Transaction = {
      id: 'tx-new',
      userId: 'u-001',
      type: 'DEPOSIT',
      amount: '1000.00',
      fee: '0.00',
      netAmount: '1000.00',
      network: 'ERC20',
      txHash: '0xnewtxhash',
      status: 'PENDING',
      confirmations: 0,
      requiredConfirmations: 12,
      fromAddress: null,
      toAddress: '0x742d...2bD68',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    return HttpResponse.json(success(tx), { status: 201 });
  }),

  http.post('/api/wallet/withdraw', async () => {
    await delay(500);
    const tx: Transaction = {
      id: 'tx-new',
      userId: 'u-001',
      type: 'WITHDRAWAL',
      amount: '-500.00',
      fee: '5.00',
      netAmount: '-505.00',
      network: 'ERC20',
      txHash: '0xnewtxhash',
      status: 'PENDING',
      confirmations: 0,
      requiredConfirmations: 0,
      fromAddress: null,
      toAddress: '0x742d...2bD68',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    return HttpResponse.json(success(tx), { status: 201 });
  }),

  http.post('/api/wallet/transactions/:id/cancel', async ({ params }) => {
    await delay(200);
    const tx = mockTransactions.find((t) => t.id === params.id) ?? mockTransactions[0];
    return HttpResponse.json(success({ ...tx, status: 'CANCELLED' as const }));
  }),

  // Atlas Gold
  http.get('/api/atlas-gold/balance', async () => {
    await delay(200);
    return HttpResponse.json(success(mockAtlasGoldBalance));
  }),

  http.get('/api/atlas-gold/history', async () => {
    await delay(200);
    return HttpResponse.json(success(paginated(mockAtlasGoldHistory)));
  }),

  http.post('/api/atlas-gold/buy', async ({ request }) => {
    await delay(500);
    const body = (await request.json()) as { usdtAmount?: string };
    const tx: AtlasGoldTransaction = {
      id: 'agt-new',
      userId: 'u-001',
      type: 'BUY',
      grams: String(Number(body?.usdtAmount ?? '0') / 62.23),
      usdtAmount: body?.usdtAmount ?? '0',
      pricePerGram: '62.23',
      createdAt: new Date().toISOString(),
    };
    return HttpResponse.json(success(tx), { status: 201 });
  }),

  http.post('/api/atlas-gold/redeem', async ({ request }) => {
    await delay(500);
    const body = (await request.json()) as { grams?: string };
    const tx: AtlasGoldTransaction = {
      id: 'agt-new',
      userId: 'u-001',
      type: 'REDEEM',
      grams: body?.grams ?? '0',
      usdtAmount: String(Number(body?.grams ?? '0') * 62.23),
      pricePerGram: '62.23',
      createdAt: new Date().toISOString(),
    };
    return HttpResponse.json(success(tx), { status: 201 });
  }),

  // Notifications
  http.get('/api/notifications', async () => {
    await delay(150);
    return HttpResponse.json(success(paginated(mockNotifications)));
  }),

  http.post('/api/notifications/:id/read', async ({ params }) => {
    await delay(100);
    const n = mockNotifications.find((x) => x.id === params.id) ?? mockNotifications[0];
    return HttpResponse.json(success({ ...n, isRead: true }));
  }),

  http.post('/api/notifications/read-all', async () => {
    await delay(100);
    return HttpResponse.json(success({ count: mockNotifications.filter((n) => !n.isRead).length }));
  }),

  // Admin
  http.get('/api/admin/users', async ({ request }) => {
    await delay(200);
    const url = new URL(request.url);
    const role = url.searchParams.get('role');
    const status = url.searchParams.get('status');
    let items = [...mockUsers];
    if (role) items = items.filter((u) => u.role === role);
    if (status) items = items.filter((u) => u.status === status);
    return HttpResponse.json(success(paginated(items)));
  }),

  http.get('/api/admin/users/:id', async ({ params }) => {
    await delay(150);
    const user = mockUsers.find((u) => u.id === params.id);
    if (!user) return HttpResponse.json({ error: { code: 'NOT_FOUND', message: 'Not found' } }, { status: 404 });
    return HttpResponse.json(success(user));
  }),

  http.post('/api/admin/users/:id/suspend', async ({ params }) => {
    await delay(200);
    const user = mockUsers.find((u) => u.id === params.id);
    if (!user) return HttpResponse.json({ error: { code: 'NOT_FOUND', message: 'Not found' } }, { status: 404 });
    return HttpResponse.json(success({ ...user, status: 'SUSPENDED' as const }));
  }),

  http.post('/api/admin/users/:id/unsuspend', async ({ params }) => {
    await delay(200);
    const user = mockUsers.find((u) => u.id === params.id);
    if (!user) return HttpResponse.json({ error: { code: 'NOT_FOUND', message: 'Not found' } }, { status: 404 });
    return HttpResponse.json(success({ ...user, status: 'ACTIVE' as const }));
  }),

  http.post('/api/admin/users/:id/ban', async ({ params }) => {
    await delay(200);
    const user = mockUsers.find((u) => u.id === params.id);
    if (!user) return HttpResponse.json({ error: { code: 'NOT_FOUND', message: 'Not found' } }, { status: 404 });
    return HttpResponse.json(success({ ...user, status: 'BANNED' as const }));
  }),

  http.post('/api/admin/users/:id/kyc/approve', async ({ params }) => {
    await delay(200);
    const user = mockUsers.find((u) => u.id === params.id);
    if (!user) return HttpResponse.json({ error: { code: 'NOT_FOUND', message: 'Not found' } }, { status: 404 });
    return HttpResponse.json(success({ ...user, kycStatus: 'VERIFIED' as const }));
  }),

  http.post('/api/admin/users/:id/kyc/reject', async ({ params }) => {
    await delay(200);
    const user = mockUsers.find((u) => u.id === params.id);
    if (!user) return HttpResponse.json({ error: { code: 'NOT_FOUND', message: 'Not found' } }, { status: 404 });
    return HttpResponse.json(success({ ...user, kycStatus: 'REJECTED' as const }));
  }),

  http.get('/api/admin/config', async () => {
    await delay(200);
    return HttpResponse.json(success(mockConfig));
  }),

  http.patch('/api/admin/config/:key', async ({ params }) => {
    await delay(200);
    const cfg = mockConfig.find((c) => c.key === params.key) ?? mockConfig[0];
    return HttpResponse.json(success(cfg));
  }),

  http.get('/api/admin/withdrawals', async ({ request }) => {
    await delay(200);
    const url = new URL(request.url);
    const status = url.searchParams.get('status');
    let items = mockTransactions.filter((t) => t.type === 'WITHDRAWAL');
    if (status) items = items.filter((t) => t.status === status);
    return HttpResponse.json(success(paginated(items)));
  }),

  http.post('/api/admin/withdrawals/:id/approve', async ({ params }) => {
    await delay(200);
    const tx = mockTransactions.find((t) => t.id === params.id) ?? mockTransactions[0];
    return HttpResponse.json(success({ ...tx, status: 'CONFIRMED' as const }));
  }),

  http.post('/api/admin/withdrawals/:id/reject', async ({ params }) => {
    await delay(200);
    const tx = mockTransactions.find((t) => t.id === params.id) ?? mockTransactions[0];
    return HttpResponse.json(success({ ...tx, status: 'FAILED' as const }));
  }),

  // Copy Trading leaderboard (auxiliary endpoint)
  http.get('/api/copy-trading/leaderboard', async ({ request }) => {
    await delay(200);
    const url = new URL(request.url);
    const sort = url.searchParams.get('sort') ?? 'roi';
    const leaderboard = [
      { id: 't-001', name: 'CryptoWhale', avatar: null, roi: 342.5, monthlyRoi: 28.4, winRate: 71.2, maxDrawdown: 8.1, followers: 234, riskScore: 5, totalTrades: 1234, avgHoldTime: '4h 23m', strategy: 'Momentum Scalper' },
      { id: 't-002', name: 'ForexKing', avatar: null, roi: 256.8, monthlyRoi: 22.1, winRate: 68.9, maxDrawdown: 10.3, followers: 189, riskScore: 6, totalTrades: 892, avgHoldTime: '2h 15m', strategy: 'Trend Rider' },
      { id: 't-003', name: 'GoldenTrader', avatar: null, roi: 198.3, monthlyRoi: 18.7, winRate: 65.4, maxDrawdown: 12.5, followers: 156, riskScore: 7, totalTrades: 567, avgHoldTime: '8h 42m', strategy: 'Gold Breakout' },
      { id: 't-004', name: 'SwingPro', avatar: null, roi: 167.2, monthlyRoi: 15.3, winRate: 62.1, maxDrawdown: 14.8, followers: 98, riskScore: 6, totalTrades: 345, avgHoldTime: '2d 5h', strategy: 'ETH Swing' },
      { id: 't-005', name: 'ScalpMaster', avatar: null, roi: 145.9, monthlyRoi: 13.8, winRate: 74.3, maxDrawdown: 6.2, followers: 312, riskScore: 4, totalTrades: 2345, avgHoldTime: '12m 45s', strategy: 'Quick Scalp' },
      { id: 't-006', name: 'RangeKing', avatar: null, roi: 123.4, monthlyRoi: 11.2, winRate: 59.8, maxDrawdown: 16.7, followers: 67, riskScore: 8, totalTrades: 456, avgHoldTime: '6h 30m', strategy: 'Range Master' },
    ];
    const sorted = [...leaderboard].sort((a, b) => {
      if (sort === 'winRate') return b.winRate - a.winRate;
      if (sort === 'followers') return b.followers - a.followers;
      return b.roi - a.roi;
    });
    return HttpResponse.json({ data: sorted, total: sorted.length });
  }),

  // Dashboard (aggregate endpoint — not in routes contract but used by UI)
  http.get('/api/dashboard', async () => {
    await delay(200);
    return HttpResponse.json({
      portfolioValue: 105847.32,
      totalPnl: 12453.87,
      pnlPercent: 13.34,
      activeStrategies: 3,
      openPositions: 7,
      copyRelations: 2,
      winRate: 68.5,
      todayPnl: 847.23,
      todayPnlPercent: 0.81,
      weeklyPnl: 3421.56,
      monthlyPnl: 12453.87,
      equityCurve: Array.from({ length: 30 }, (_, i) => ({
        date: new Date(Date.now() - (29 - i) * 86400000).toISOString().split('T')[0],
        value: 80000 + Math.random() * 30000 + i * 500,
      })),
      portfolioAllocation: [
        { label: 'Forex', value: 42, color: '#4f8eff' },
        { label: 'Crypto', value: 31, color: '#7ee8ff' },
        { label: 'Commodities', value: 18, color: '#c77dff' },
        { label: 'Indices', value: 9, color: '#ffd166' },
      ],
      recentActivity: [
        { id: 'ra-1', type: 'TRADE_CLOSE', description: 'Closed EUR/USD BUY +1.2%', amount: 847.23, timestamp: '2026-04-20T15:30:00Z' },
        { id: 'ra-2', type: 'COPY_TRADE', description: 'Copied CryptoWhale: BTC/USDT SELL', amount: -500.00, timestamp: '2026-04-20T14:15:00Z' },
        { id: 'ra-3', type: 'DEPOSIT', description: 'USDT deposit confirmed', amount: 10000, timestamp: '2026-04-20T14:30:00Z' },
        { id: 'ra-4', type: 'TRADE_OPEN', description: 'Opened XAU/USD SELL 0.3 lots', amount: 0, timestamp: '2026-04-20T12:00:00Z' },
        { id: 'ra-5', type: 'WITHDRAW', description: 'USDT withdrawal processed', amount: -2500, timestamp: '2026-04-19T10:15:00Z' },
      ],
    });
  }),
];
