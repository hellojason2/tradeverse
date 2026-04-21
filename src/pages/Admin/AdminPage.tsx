import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { cn } from '@/lib/utils';

function StatCard({ label, value, trend, trendType, iconBg, iconColor, iconPath }: {
  label: string; value: string; trend: string; trendType: 'up' | 'down'; iconBg: string; iconColor: string; iconPath: string;
}) {
  return (
    <div className="bg-[var(--ad-bg-primary)] border border-[var(--ad-border-color)] rounded-[12px] p-5 transition-all duration-150 hover:shadow-md hover:-translate-y-[2px]">
      <div className="flex justify-between items-start mb-3">
        <div className="w-10 h-10 rounded-[8px] flex items-center justify-center" style={{ background: iconBg, color: iconColor }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><path d={iconPath} /></svg>
        </div>
        <span className={cn('text-[12px] font-medium flex items-center gap-1', trendType === 'up' ? 'text-[var(--ad-success)]' : 'text-[var(--ad-danger)]')}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-[14px] h-[14px]">
            <path d={trendType === 'up' ? 'M7 17l5-5 5-5' : 'M7 7l5 5 5 5'} />
          </svg>
          {trend}
        </span>
      </div>
      <div className="text-[28px] font-bold tracking-tight text-[var(--ad-text-primary)] mb-1">{value}</div>
      <div className="text-[13px] text-[var(--ad-text-tertiary)]">{label}</div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const s: Record<string, string> = {
    Active: 'bg-[var(--ad-success-bg)] text-[var(--ad-success)]',
    Pending: 'bg-[var(--ad-warning-bg)] text-[var(--ad-warning)]',
    Failed: 'bg-[var(--ad-danger-bg)] text-[var(--ad-danger)]',
    New: 'bg-[var(--ad-accent-secondary)] text-[var(--ad-accent-primary)]',
  };
  return <span className={cn('inline-flex px-[10px] py-[4px] rounded-full text-[12px] font-medium', s[status] || s.New)}>{status}</span>;
}

function UserCell({ init, name, email, color }: { init: string; name: string; email: string; color: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-9 h-9 rounded-full flex items-center justify-center font-semibold text-[13px] text-white shrink-0" style={{ background: color }}>{init}</div>
      <div><div className="font-medium text-[14px] text-[var(--ad-text-primary)]">{name}</div><div className="text-[12px] text-[var(--ad-text-tertiary)]">{email}</div></div>
    </div>
  );
}

function ActionBtn() {
  return (
    <button className="w-8 h-8 border border-[var(--ad-border-color)] bg-[var(--ad-bg-primary)] rounded-[6px] flex items-center justify-center hover:bg-[var(--ad-bg-tertiary)] transition-all">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 text-[var(--ad-text-secondary)]"><circle cx="12" cy="12" r="1" /><circle cx="19" cy="12" r="1" /><circle cx="5" cy="12" r="1" /></svg>
    </button>
  );
}

function LineChartPlaceholder() {
  return (
    <div className="w-full h-[260px] relative">
      <svg className="w-full h-full" viewBox="0 0 520 260" preserveAspectRatio="none">
        <defs><linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="rgba(10,114,239,0.3)" /><stop offset="100%" stopColor="rgba(10,114,239,0)" /></linearGradient></defs>
        <path d="M0 200 C60 170,100 190,160 140 C220 90,280 130,340 90 C400 50,460 70,520 30 L520 260 L0 260 Z" fill="url(#chartGrad)" />
        <path d="M0 200 C60 170,100 190,160 140 C220 90,280 130,340 90 C400 50,460 70,520 30" fill="none" stroke="#0a72ef" strokeWidth="2" />
      </svg>
    </div>
  );
}

function DonutChart() {
  const data = [
    { label: 'Traders', value: 45, color: '#0a72ef' },
    { label: 'Copy Traders', value: 30, color: '#10b981' },
    { label: 'Signals', value: 15, color: '#f59e0b' },
    { label: 'Admins', value: 10, color: '#ef4444' },
  ];
  const total = data.reduce((s, d) => s + d.value, 0);
  let acc = 0;
  const r = 70, cx = 90, cy = 90;
  const paths = data.map((d) => {
    const start = (acc / total) * Math.PI * 2 - Math.PI / 2;
    acc += d.value;
    const end = (acc / total) * Math.PI * 2 - Math.PI / 2;
    const x1 = cx + r * Math.cos(start), y1 = cy + r * Math.sin(start);
    const x2 = cx + r * Math.cos(end), y2 = cy + r * Math.sin(end);
    const la = end - start > Math.PI ? 1 : 0;
    return { d: 'M ' + cx + ' ' + cy + ' L ' + x1 + ' ' + y1 + ' A ' + r + ' ' + r + ' 0 ' + la + ' 1 ' + x2 + ' ' + y2 + ' Z', color: d.color, label: d.label, value: d.value };
  });
  return (
    <div className="flex flex-col items-center justify-center h-full">
      <div className="w-[180px] h-[180px] relative">
        <svg viewBox="0 0 180 180" className="w-full h-full">
          {paths.map((p, i) => <path key={i} d={p.d} fill={p.color} />)}
          <circle cx={cx} cy={cy} r="40" fill="var(--ad-bg-primary)" />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="text-[24px] font-bold text-[var(--ad-text-primary)]">24.5k</div>
          <div className="text-[12px] text-[var(--ad-text-tertiary)]">Users</div>
        </div>
      </div>
      <div className="flex flex-wrap gap-3 mt-4 justify-center">
        {data.map((d, i) => (
          <div key={i} className="flex items-center gap-[6px] text-[12px] text-[var(--ad-text-secondary)]">
            <span className="w-2 h-2 rounded-full shrink-0" style={{ background: d.color }} />{d.label} {d.value}%
          </div>
        ))}
      </div>
    </div>
  );
}

const NAV_ITEMS = [
  { icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0v-6a1 1 0 011-1h2a1 1 0 011 1v6m-6 0h6', path: '/admin', key: 'dashboard' },
  { icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6m6 0V5l12-2v13m-6 0v4a2 2 0 002 2h2a2 2 0 002-2v-4', path: '/admin/analytics', key: 'analytics' },
  { icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z', path: '/admin/users', key: 'users' },
  { icon: 'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z', path: '/admin/transactions', key: 'transactions' },
  { icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-2.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z', path: '/admin/kyc', key: 'kyc' },
  { icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z', path: '/admin/settings', key: 'settings' },
  { icon: 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z', path: '/admin/security', key: 'security' },
];

function AdminSidebar({ collapsed, onToggle }: { collapsed: boolean; onToggle: () => void }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  return (
    <aside className={cn('fixed left-0 top-0 bottom-0 bg-[var(--ad-bg-primary)] border-r border-[var(--ad-border-color)] flex flex-col z-[100] transition-[width] duration-200', collapsed ? 'w-[72px]' : 'w-[260px]')}>
      <div className="h-16 flex items-center gap-3 px-5 border-b border-[var(--ad-border-color)] shrink-0">
        <div className="w-8 h-8 rounded-lg bg-[linear-gradient(135deg,#0a72ef,#0a5ce0)] flex items-center justify-center text-white font-bold text-sm shrink-0">TV</div>
        {!collapsed && <span className="font-bold text-lg tracking-tight text-[var(--ad-text-primary)]">TradeVerse</span>}
      </div>
      <nav className="flex-1 overflow-y-auto py-3 px-3">
        <div className={cn('text-[11px] font-semibold uppercase tracking-[0.05em] text-[var(--ad-text-tertiary)] px-3 py-2 mb-1', collapsed && 'opacity-0')}>{t('admin.nav.overview')}</div>
        {NAV_ITEMS.map((item) => {
          const active = location.pathname === item.path;
          return (
            <button key={item.key} onClick={() => navigate(item.path)} className={cn('w-full flex items-center gap-3 px-3 py-[10px] rounded-lg text-[13px] font-medium mb-[2px] transition-all cursor-pointer', active ? 'bg-[var(--ad-accent-secondary)] text-[var(--ad-accent-primary)]' : 'text-[var(--ad-text-secondary)] hover:bg-[var(--ad-bg-tertiary)] hover:text-[var(--ad-text-primary)]')}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-5 h-5 shrink-0"><path d={item.icon} /></svg>
              {!collapsed && <span className="whitespace-nowrap">{t('admin.nav.' + item.key)}</span>}
            </button>
          );
        })}
      </nav>
      <div className={cn('py-3 px-5 border-t border-[var(--ad-border-color)] flex', collapsed ? 'justify-center' : 'justify-end')}>
        <button onClick={onToggle} className="w-8 h-8 border border-[var(--ad-border-color)] bg-[var(--ad-bg-primary)] rounded-lg flex items-center justify-center cursor-pointer hover:bg-[var(--ad-bg-tertiary)] transition-all">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={cn('w-4 h-4 text-[var(--ad-text-secondary)] transition-transform', collapsed && 'rotate-180')}><path d="M15 19l-7-7 7-7" /></svg>
        </button>
      </div>
    </aside>
  );
}

function AdminTopbar() {
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const titles: Record<string, string> = {
    '/admin': t('admin.title'), '/admin/analytics': t('admin.nav.analytics'), '/admin/users': t('admin.nav.users'),
    '/admin/transactions': t('admin.nav.transactions'), '/admin/kyc': t('admin.nav.kyc'),
    '/admin/settings': t('admin.nav.settings'), '/admin/security': t('admin.nav.security'),
  };
  return (
    <header className="sticky top-0 h-16 z-50 flex items-center justify-between px-6 gap-4 bg-[var(--ad-bg-primary)] border-b border-[var(--ad-border-color)]">
      <div className="flex items-center gap-4 min-w-0">
        <h1 className="text-[18px] font-semibold text-[var(--ad-text-primary)] tracking-tight truncate">{titles[location.pathname] || t('admin.title')}</h1>
        <div className="hidden md:flex items-center gap-2 bg-[var(--ad-bg-tertiary)] border border-[var(--ad-border-color)] rounded-lg px-3 py-2 w-[280px] shrink-0">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 text-[var(--ad-text-tertiary)] shrink-0"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
          <input placeholder={t('admin.search')} className="bg-transparent border-none outline-none text-[var(--ad-text-primary)] text-sm w-full font-sans placeholder:text-[var(--ad-text-tertiary)]" />
        </div>
      </div>
      <div className="flex items-center gap-3 shrink-0">
        {[{code:'en',label:'EN'},{code:'vi',label:'VI'}].map((l) => (
          <button key={l.code} onClick={() => i18n.changeLanguage(l.code)} className={cn('px-2 py-1 text-[11px] font-semibold rounded-md transition-all cursor-pointer', i18n.language?.startsWith(l.code) ? 'bg-[var(--ad-accent-primary)] text-white' : 'text-[var(--ad-text-tertiary)] hover:text-[var(--ad-text-primary)]')}>{l.label}</button>
        ))}
        <button className="w-10 h-10 border border-[var(--ad-border-color)] bg-[var(--ad-bg-primary)] rounded-lg flex items-center justify-center text-[var(--ad-text-secondary)] hover:bg-[var(--ad-bg-tertiary)] transition-all relative">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-[18px] h-[18px]"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 01-3.46 0" /></svg>
          <span className="absolute -top-1 -right-1 w-[18px] h-[18px] bg-[var(--ad-danger)] text-white text-[10px] font-semibold rounded-full flex items-center justify-center">3</span>
        </button>
        <button onClick={() => navigate('/dashboard')} className="h-10 px-3 border border-[var(--ad-border-color)] bg-[var(--ad-bg-primary)] rounded-lg flex items-center justify-center gap-2 text-[var(--ad-text-secondary)] hover:bg-[var(--ad-bg-tertiary)] hover:text-[var(--ad-text-primary)] transition-all text-[12px] font-medium cursor-pointer">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
          Client
        </button>
        <div className="w-9 h-9 rounded-full bg-[linear-gradient(135deg,#0a72ef,#0a5ce0)] flex items-center justify-center text-white font-semibold text-sm cursor-pointer">AD</div>
      </div>
    </header>
  );
}

const MOCK_USERS = [
  { init: 'JD', name: 'John Doe', email: 'john@example.com', color: '#0a72ef', role: 'Trader', status: 'Active', joined: 'Apr 15, 2026' },
  { init: 'JS', name: 'Jane Smith', email: 'jane@example.com', color: '#10b981', role: 'Signal Provider', status: 'Active', joined: 'Apr 12, 2026' },
  { init: 'RJ', name: 'Robert Johnson', email: 'robert@example.com', color: '#f59e0b', role: 'Copy Trader', status: 'Pending', joined: 'Apr 10, 2026' },
  { init: 'EW', name: 'Emily Wilson', email: 'emily@example.com', color: '#ef4444', role: 'Trader', status: 'Active', joined: 'Apr 8, 2026' },
  { init: 'MB', name: 'Michael Brown', email: 'michael@example.com', color: '#8b5cf6', role: 'Trader', status: 'Failed', joined: 'Apr 5, 2026' },
];

const MOCK_TXNS = [
  { id: 'TXN-001', user: 'John Doe', type: 'Deposit', amount: '$10,000.00', status: 'Completed', date: 'Apr 20, 2026' },
  { id: 'TXN-002', user: 'Jane Smith', type: 'Withdrawal', amount: '$2,500.00', status: 'Pending', date: 'Apr 19, 2026' },
  { id: 'TXN-003', user: 'Robert Johnson', type: 'Deposit', amount: '$5,000.00', status: 'Completed', date: 'Apr 18, 2026' },
  { id: 'TXN-004', user: 'Emily Wilson', type: 'Withdrawal', amount: '$1,200.00', status: 'Failed', date: 'Apr 17, 2026' },
  { id: 'TXN-005', user: 'Michael Brown', type: 'Deposit', amount: '$8,000.00', status: 'Completed', date: 'Apr 16, 2026' },
];

export function AdminPage() {
  useDocumentTitle('Admin — TradeVerse');
  const { t } = useTranslation();
  const [period, setPeriod] = useState('24h');
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-[var(--ad-bg-secondary)]" style={{ fontFamily: "'Geist', system-ui, sans-serif" }}>
      <AdminSidebar collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
      <div className="transition-[margin-left] duration-200" style={{ marginLeft: collapsed ? 72 : 260 }}>
        <AdminTopbar />
        <main className="p-6">
          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <StatCard label={t('admin.totalUsers')} value="24,521" trend="+12.5%" trendType="up" iconBg="var(--ad-accent-secondary)" iconColor="var(--ad-accent-primary)" iconPath="M17 21v-2a4 4 0 00-8 0v-2M9 11l-4 4-1-6 7 7 3-4" />
            <StatCard label={t('admin.tradingVolume')} value="$1.24M" trend="+8.3%" trendType="up" iconBg="var(--ad-success-bg)" iconColor="var(--ad-success)" iconPath="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H9" />
            <StatCard label={t('admin.activeSignals')} value="1,247" trend="+3.2%" trendType="up" iconBg="var(--ad-warning-bg)" iconColor="var(--ad-warning)" iconPath="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            <StatCard label={t('admin.openTickets')} value="23" trend="-5.1%" trendType="down" iconBg="var(--ad-danger-bg)" iconColor="var(--ad-danger)" iconPath="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-6 mb-6">
            <div className="bg-[var(--ad-bg-primary)] border border-[var(--ad-border-color)] rounded-[12px] p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-[16px] font-semibold text-[var(--ad-text-primary)]">{t('admin.volumeOverview')}</h2>
                <div className="flex gap-1">
                  {['24h', '7d', '30d'].map((p) => (
                    <button key={p} onClick={() => setPeriod(p)} className={cn('px-3 py-1 text-[12px] font-medium rounded-md transition-all cursor-pointer', period === p ? 'bg-[var(--ad-accent-primary)] text-white' : 'text-[var(--ad-text-tertiary)] hover:text-[var(--ad-text-primary)] hover:bg-[var(--ad-bg-tertiary)]')}>
                      {t('admin.period' + p.charAt(0).toUpperCase() + p.slice(1))}
                    </button>
                  ))}
                </div>
              </div>
              <LineChartPlaceholder />
            </div>
            <div className="bg-[var(--ad-bg-primary)] border border-[var(--ad-border-color)] rounded-[12px] p-5">
              <h2 className="text-[16px] font-semibold text-[var(--ad-text-primary)] mb-4">{t('admin.userDistribution')}</h2>
              <DonutChart />
            </div>
          </div>

          {/* Recent Users */}
          <div className="bg-[var(--ad-bg-primary)] border border-[var(--ad-border-color)] rounded-[12px] mb-6 overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-[var(--ad-border-color)]">
              <h2 className="text-[16px] font-semibold text-[var(--ad-text-primary)]">{t('admin.recentUsers')}</h2>
              <button className="text-[13px] font-medium text-[var(--ad-accent-primary)] hover:underline cursor-pointer">{t('admin.viewAll')}</button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead><tr className="border-b border-[var(--ad-border-color)]">
                  <th className="px-5 py-3 text-[12px] font-medium text-[var(--ad-text-tertiary)]">{t('admin.users')}</th>
                  <th className="px-5 py-3 text-[12px] font-medium text-[var(--ad-text-tertiary)]">{t('admin.type')}</th>
                  <th className="px-5 py-3 text-[12px] font-medium text-[var(--ad-text-tertiary)]">{t('admin.status')}</th>
                  <th className="px-5 py-3 text-[12px] font-medium text-[var(--ad-text-tertiary)]">Joined</th>
                  <th className="px-5 py-3 text-[12px] font-medium text-[var(--ad-text-tertiary)]">{t('admin.action')}</th>
                </tr></thead>
                <tbody>
                  {MOCK_USERS.map((u, i) => (
                    <tr key={i} className="border-b border-[var(--ad-border-color)] last:border-0 hover:bg-[var(--ad-bg-secondary)] transition-colors">
                      <td className="px-5 py-4"><UserCell init={u.init} name={u.name} email={u.email} color={u.color} /></td>
                      <td className="px-5 py-4 text-[13px] text-[var(--ad-text-secondary)]">{u.role}</td>
                      <td className="px-5 py-4"><StatusBadge status={u.status} /></td>
                      <td className="px-5 py-4 text-[13px] text-[var(--ad-text-tertiary)]">{u.joined}</td>
                      <td className="px-5 py-4"><ActionBtn /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Recent Transactions */}
          <div className="bg-[var(--ad-bg-primary)] border border-[var(--ad-border-color)] rounded-[12px] overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-[var(--ad-border-color)]">
              <h2 className="text-[16px] font-semibold text-[var(--ad-text-primary)]">{t('admin.recentTransactions')}</h2>
              <button className="text-[13px] font-medium text-[var(--ad-accent-primary)] hover:underline cursor-pointer">{t('admin.viewAll')}</button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead><tr className="border-b border-[var(--ad-border-color)]">
                  <th className="px-5 py-3 text-[12px] font-medium text-[var(--ad-text-tertiary)]">ID</th>
                  <th className="px-5 py-3 text-[12px] font-medium text-[var(--ad-text-tertiary)]">{t('admin.users')}</th>
                  <th className="px-5 py-3 text-[12px] font-medium text-[var(--ad-text-tertiary)]">{t('admin.type')}</th>
                  <th className="px-5 py-3 text-[12px] font-medium text-[var(--ad-text-tertiary)]">{t('admin.amount')}</th>
                  <th className="px-5 py-3 text-[12px] font-medium text-[var(--ad-text-tertiary)]">{t('admin.status')}</th>
                  <th className="px-5 py-3 text-[12px] font-medium text-[var(--ad-text-tertiary)]">Date</th>
                  <th className="px-5 py-3 text-[12px] font-medium text-[var(--ad-text-tertiary)]">{t('admin.action')}</th>
                </tr></thead>
                <tbody>
                  {MOCK_TXNS.map((tx, i) => (
                    <tr key={i} className="border-b border-[var(--ad-border-color)] last:border-0 hover:bg-[var(--ad-bg-secondary)] transition-colors">
                      <td className="px-5 py-4 text-[13px] font-medium text-[var(--ad-accent-primary)]">{tx.id}</td>
                      <td className="px-5 py-4 text-[13px] text-[var(--ad-text-primary)]">{tx.user}</td>
                      <td className="px-5 py-4 text-[13px] text-[var(--ad-text-secondary)]">{tx.type}</td>
                      <td className="px-5 py-4 text-[13px] font-medium text-[var(--ad-text-primary)]">{tx.amount}</td>
                      <td className="px-5 py-4"><StatusBadge status={tx.status} /></td>
                      <td className="px-5 py-4 text-[13px] text-[var(--ad-text-tertiary)]">{tx.date}</td>
                      <td className="px-5 py-4"><ActionBtn /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
