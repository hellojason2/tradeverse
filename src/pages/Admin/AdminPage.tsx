import { useState } from 'react';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { cn } from '@/lib/utils';

/* ─── Stat Card ─── */
function StatCard({
  label,
  value,
  trend,
  trendType,
  iconBg,
  iconColor,
  iconPath,
}: {
  label: string;
  value: string;
  trend: string;
  trendType: 'up' | 'down';
  iconBg: string;
  iconColor: string;
  iconPath: string;
}) {
  return (
    <div className="bg-[var(--ad-bg-primary)] border border-[var(--ad-border-color)] rounded-[12px] p-5 transition-all duration-150 hover:shadow-md hover:-translate-y-[2px]">
      <div className="flex justify-between items-start mb-3">
        <div
          className="w-10 h-10 rounded-[8px] flex items-center justify-center"
          style={{ background: iconBg, color: iconColor }}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
            <path d={iconPath} />
          </svg>
        </div>
        <span
          className={cn(
            'text-[12px] font-medium flex items-center gap-1',
            trendType === 'up' ? 'text-[var(--ad-success)]' : 'text-[var(--ad-danger)]'
          )}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-[14px] h-[14px]">
            {trendType === 'up' ? (
              <path d="M7 17l5-5 5-5M7 7l5 5 5-5" />
            ) : (
              <path d="M7 7l5 5 5-5M7 17l5-5 5-5" />
            )}
          </svg>
          {trend}
        </span>
      </div>
      <div className="text-[28px] font-bold tracking-tight text-[var(--ad-text-primary)] mb-1">{value}</div>
      <div className="text-[13px] text-[var(--ad-text-tertiary)]">{label}</div>
    </div>
  );
}

/* ─── Status Badge ─── */
function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    Active: 'bg-[var(--ad-success-bg)] text-[var(--ad-success)]',
    Completed: 'bg-[var(--ad-success-bg)] text-[var(--ad-success)]',
    Pending: 'bg-[var(--ad-warning-bg)] text-[var(--ad-warning)]',
    Failed: 'bg-[var(--ad-danger-bg)] text-[var(--ad-danger)]',
    New: 'bg-[var(--ad-accent-secondary)] text-[var(--ad-accent-primary)]',
    Verified: 'bg-[var(--ad-success-bg)] text-[var(--ad-success)]',
  };
  return (
    <span className={cn('inline-flex px-[10px] py-[4px] rounded-full text-[12px] font-medium', styles[status] || styles.New)}>
      {status}
    </span>
  );
}

/* ─── User Cell ─── */
function UserCell({ initials_, name, email, color }: { initials_: string; name: string; email: string; color: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-9 h-9 rounded-full flex items-center justify-center font-semibold text-[13px] text-white shrink-0" style={{ background: color }}>
        {initials_}
      </div>
      <div>
        <div className="font-medium text-[14px] text-[var(--ad-text-primary)]">{name}</div>
        <div className="text-[12px] text-[var(--ad-text-tertiary)]">{email}</div>
      </div>
    </div>
  );
}

/* ─── Action Button ─── */
function ActionBtn() {
  return (
    <button className="w-8 h-8 border border-[var(--ad-border-color)] bg-[var(--ad-bg-primary)] rounded-[6px] flex items-center justify-center hover:bg-[var(--ad-bg-tertiary)] transition-all"
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 text-[var(--ad-text-secondary)]">
        <circle cx="12" cy="12" r="1" /><circle cx="19" cy="12" r="1" /><circle cx="5" cy="12" r="1" />
      </svg>
    </button>
  );
}

/* ─── Chart Placeholder (line) ─── */
function LineChartPlaceholder() {
  return (
    <div className="w-full h-[280px] relative">
      <svg className="w-full h-full" viewBox="0 0 520 280" preserveAspectRatio="none">
        <defs>
          <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(10, 114, 239, 0.3)" />
            <stop offset="100%" stopColor="rgba(10, 114, 239, 0)" />
          </linearGradient>
        </defs>
        <path
          d="M0 220 C60 180,100 200,160 150 C220 100,280 140,340 100 C400 60,460 80,520 40 L520 280 L0 280 Z"
          fill="url(#chartGrad)"
        />
        <path
          d="M0 220 C60 180,100 200,160 150 C220 100,280 140,340 100 C400 60,460 80,520 40"
          fill="none"
          stroke="#0a72ef"
          strokeWidth="2"
        />
      </svg>
    </div>
  );
}

/* ─── Donut Chart ─── */
function DonutChart() {
  const data = [
    { label: 'Traders', value: 45, color: '#0a72ef' },
    { label: 'Copy Traders', value: 30, color: '#10b981' },
    { label: 'Signals', value: 15, color: '#f59e0b' },
    { label: 'Admins', value: 10, color: '#ef4444' },
  ];
  const total = data.reduce((s, d) => s + d.value, 0);
  let acc = 0;
  const r = 70;
  const cx = 90;
  const cy = 90;
  const paths = data.map((d) => {
    const start = (acc / total) * Math.PI * 2 - Math.PI / 2;
    acc += d.value;
    const end = (acc / total) * Math.PI * 2 - Math.PI / 2;
    const x1 = cx + r * Math.cos(start);
    const y1 = cy + r * Math.sin(start);
    const x2 = cx + r * Math.cos(end);
    const y2 = cy + r * Math.sin(end);
    const largeArc = end - start > Math.PI ? 1 : 0;
    return { d: `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`, color: d.color, label: d.label, value: d.value };
  });

  return (
    <div className="flex flex-col items-center justify-center h-full">
      <div className="w-[180px] h-[180px] relative">
        <svg viewBox="0 0 180 180" className="w-full h-full">
          {paths.map((p, i) => (
            <path key={i} d={p.d} fill={p.color} />
          ))}
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
            <span className="w-2 h-2 rounded-full shrink-0" style={{ background: d.color }} />
            {d.label} {d.value}%
          </div>
        ))}
      </div>
    </div>
  );
}

export function AdminPage() {
  useDocumentTitle('Admin');
  const [chartPeriod, setChartPeriod] = useState('24h');

  return (
    <div className="animate-[pgIn_0.35s_ease-out]">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          label="Total Users"
          value="24,521"
          trend="+12.5%"
          trendType="up"
          iconBg="var(--ad-accent-secondary)"
          iconColor="var(--ad-accent-primary)"
          iconPath="M17 21v-2a4 4 0 00-8 0v-2M9 11l-4 4-1-6 7 7 3-4M14 10V5a2 2 0 00-4 0v6"
        />
        <StatCard
          label="Trading Volume"
          value="$1.24M"
          trend="+8.3%"
          trendType="up"
          iconBg="var(--ad-success-bg)"
          iconColor="var(--ad-success)"
          iconPath="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"
        />
        <StatCard
          label="Active Signals"
          value="1,847"
          trend="-3.2%"
          trendType="down"
          iconBg="var(--ad-warning-bg)"
          iconColor="var(--ad-warning)"
          iconPath="M22 12h-4l-3 9L9 3 6 12H2"
        />
        <StatCard
          label="Open Tickets"
          value="342"
          trend="+5.7%"
          trendType="up"
          iconBg="var(--ad-danger-bg)"
          iconColor="var(--ad-danger)"
          iconPath="M12 22s8-4 8-10V7l-8-5-8-5v5l8 4 8 11z"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2 bg-[var(--ad-bg-primary)] border border-[var(--ad-border-color)] rounded-[12px] p-5">
          <div className="flex items-center justify-between mb-5">
            <div className="text-[16px] font-semibold text-[var(--ad-text-primary)]">Trading Volume Overview</div>
            <div className="flex gap-2">
              {['24h', '7d', '30d'].map((p) => (
                <button
                  key={p}
                  onClick={() => setChartPeriod(p)}
                  className={cn(
                    'px-3 py-[6px] text-[13px] rounded-[6px] border transition-all',
                    chartPeriod === p
                      ? 'bg-[var(--ad-accent-primary)] text-white border-[var(--ad-accent-primary)]'
                      : 'bg-[var(--ad-bg-primary)] text-[var(--ad-text-secondary)] border-[var(--ad-border-color)] hover:bg-[var(--ad-bg-tertiary)]'
                  )}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
          <LineChartPlaceholder />
        </div>

        <div className="bg-[var(--ad-bg-primary)] border border-[var(--ad-border-color)] rounded-[12px] p-5">
          <div className="text-[16px] font-semibold text-[var(--ad-text-primary)] mb-5">User Distribution</div>
          <DonutChart />
        </div>
      </div>

      {/* Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Users */}
        <div className="bg-[var(--ad-bg-primary)] border border-[var(--ad-border-color)] rounded-[12px] overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--ad-border-color)]">
            <div className="text-[16px] font-semibold text-[var(--ad-text-primary)]">Recent Users</div>
            <span className="text-[13px] text-[var(--ad-accent-primary)] cursor-pointer hover:underline">View All</span>
          </div>
          <table className="w-full">
            <thead>
              <tr className="text-left">
                {['User', 'Status', 'Type', 'Action'].map((h) => (
                  <th key={h} className="text-[11px] font-semibold uppercase tracking-[0.05em] text-[var(--ad-text-tertiary)] bg-[var(--ad-bg-tertiary)] px-5 py-3 border-b border-[var(--ad-border-color)]">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                { name: 'Maria Kowalski', email: 'maria.k@ex.com', initials: 'MK', color: '#0a72ef', status: 'Active', type: 'Trader' },
                { name: 'James Liu', email: 'j.liu@trade.io', initials: 'JL', color: '#10b981', status: 'Pending', type: 'Copy Trader' },
                { name: 'Sara Ng', email: 'sng@fin.xyz', initials: 'SN', color: '#f59e0b', status: 'Active', type: 'Signal Provider' },
                { name: 'Alex Kim', email: 'akim@tradeco.io', initials: 'AK', color: '#ef4444', status: 'New', type: 'Trader' },
              ].map((u, i) => (
                <tr key={i} className="border-b border-[var(--ad-border-color)] last:border-b-0">
                  <td className="px-5 py-[14px]">
                    <UserCell initials_={u.initials} name={u.name} email={u.email} color={u.color} />
                  </td>
                  <td className="px-5 py-[14px]"><StatusBadge status={u.status} /></td>
                  <td className="px-5 py-[14px] text-[14px] text-[var(--ad-text-primary)]">{u.type}</td>
                  <td className="px-5 py-[14px]"><ActionBtn /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Recent Transactions */}
        <div className="bg-[var(--ad-bg-primary)] border border-[var(--ad-border-color)] rounded-[12px] overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--ad-border-color)]">
            <div className="text-[16px] font-semibold text-[var(--ad-text-primary)]">Recent Transactions</div>
            <span className="text-[13px] text-[var(--ad-accent-primary)] cursor-pointer hover:underline">View All</span>
          </div>
          <table className="w-full">
            <thead>
              <tr className="text-left">
                {['ID', 'Amount', 'Status', 'Action'].map((h) => (
                  <th key={h} className="text-[11px] font-semibold uppercase tracking-[0.05em] text-[var(--ad-text-tertiary)] bg-[var(--ad-bg-tertiary)] px-5 py-3 border-b border-[var(--ad-border-color)]">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                { id: '#TXN-8847', amount: '2.45 ETH', status: 'Completed' },
                { id: '#TXN-8846', amount: '$1,250.00', status: 'Pending' },
                { id: '#TXN-8845', amount: '0.82 BTC', status: 'Completed' },
                { id: '#TXN-8844', amount: '$890.00', status: 'Failed' },
              ].map((tx, i) => (
                <tr key={i} className="border-b border-[var(--ad-border-color)] last:border-b-0">
                  <td className="px-5 py-[14px] text-[14px] text-[var(--ad-text-primary)]">{tx.id}</td>
                  <td className="px-5 py-[14px] text-[14px] font-medium text-[var(--ad-text-primary)]">{tx.amount}</td>
                  <td className="px-5 py-[14px]"><StatusBadge status={tx.status} /></td>
                  <td className="px-5 py-[14px]"><ActionBtn /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
