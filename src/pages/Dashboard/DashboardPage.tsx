import { useAuth } from '@/hooks/useAuth';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useDashboard } from '@/hooks/useApi';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { formatCurrency, formatPercent } from '@/lib/utils';
import {
  TrendingUp,
  TrendingDown,
  Brain,
  Users,
  Target,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';

function StatCard({
  label,
  value,
  change,
  changeLabel,
  icon: Icon,
}: {
  label: string;
  value: string;
  change?: number;
  changeLabel?: string;
  icon: React.ElementType;
}) {
  const isPositive = change !== undefined && change >= 0;
  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardDescription className="text-[11px] font-mono font-semibold uppercase tracking-[0.08em] text-[#545d78]">{label}</CardDescription>
          <Icon className="w-4 h-4 text-[#545d78]" />
        </div>
        <CardTitle className="text-[28px] font-mono font-medium text-[#f5f7ff] tracking-tight leading-none">{value}</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        {change !== undefined && (
          <Badge
            variant="outline"
            className={
              isPositive
                ? 'bg-[rgba(61,220,132,0.14)] text-[#3ddc84] border-[oklch(0.72_0.17_150/0.3)] text-[11px] font-mono gap-1 px-2 py-0.5'
                : 'bg-[rgba(255,85,85,0.14)] text-[#ff5555] border-[oklch(0.68_0.22_20/0.3)] text-[11px] font-mono gap-1 px-2 py-0.5'
            }
          >
            {isPositive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
            {formatPercent(change)} {changeLabel}
          </Badge>
        )}
      </CardContent>
    </Card>
  );
}

import { cn } from '@/lib/utils';

export function DashboardPage() {
  useDocumentTitle('Dashboard');
  const { user } = useAuth();
  const { data, isLoading, error } = useDashboard();

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="w-12 h-12 rounded-full bg-[#ff5555]/10 flex items-center justify-center mb-4">
          <BarChart3 className="w-5 h-5 text-[#ff5555]" />
        </div>
        <h3 className="font-serif text-lg text-[#f5f7ff] mb-1">Failed to load dashboard</h3>
        <p className="text-[13px] text-[#8892b0]">Please try refreshing the page.</p>
      </div>
    );
  }

  return (
    <div className="animate-[pgIn_0.35s_ease-out]">
      {/* Welcome Banner */}
      <div className="relative rounded-[18px] p-8 mb-6 border border-white/[0.14] bg-[linear-gradient(140deg,#0a1230_0%,#050a1e_60%,#0a1a38_100%)] overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_0%,oklch(0.3_0.15_260/0.35),transparent)] pointer-events-none" />
        <div className="relative z-10">
          <Badge className="bg-[oklch(0.55_0.22_260/0.25)] text-[#7aadff] border-[rgba(120,160,255,0.22)] mb-4">
            <TrendingUp className="w-3 h-3 mr-1" />
            Trading Dashboard
          </Badge>
          <h2 className="text-[clamp(28px,3vw,38px)] text-[#f5f7ff] font-serif leading-[0.98] mb-3">
            Welcome back,{' '}
            <em className="bg-gradient-to-r from-[#7aadff] to-[#c77dff] bg-clip-text text-transparent not-italic">
              {user?.displayName ?? 'Trader'}
            </em>
          </h2>
          <p className="text-[14px] text-[#8892b0] max-w-lg">
            Your portfolio is performing well. Here's your market overview for today.
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      {isLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="shadow-sm">
              <CardContent className="p-5">
                <Skeleton className="h-3 w-20 mb-3" />
                <Skeleton className="h-8 w-32 mb-2" />
                <Skeleton className="h-5 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatCard
            label="Portfolio Value"
            value={formatCurrency(data?.portfolioValue ?? 0)}
            change={data?.pnlPercent}
            changeLabel="total"
            icon={TrendingUp}
          />
          <StatCard
            label="Today P&L"
            value={formatCurrency(data?.todayPnl ?? 0)}
            change={data?.todayPnlPercent}
            changeLabel="today"
            icon={BarChart3}
          />
          <StatCard
            label="Active Strategies"
            value={String(data?.activeStrategies ?? 0)}
            icon={Brain}
          />
          <StatCard
            label="Win Rate"
            value={`${(data?.winRate ?? 0).toFixed(1)}%`}
            icon={Target}
          />
        </div>
      )}

      {/* Charts + Activity Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        {/* Equity Chart */}
        <Card className="lg:col-span-2 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-[20px] text-[#f5f7ff] font-serif">Equity Curve</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-[170px] w-full rounded-[10px]" />
            ) : (
              <div className="w-full h-[170px] bg-white/[0.02] border border-white/[0.08] rounded-[10px] flex items-end p-4 gap-[3px] overflow-hidden">
                {data?.equityCurve?.map((point, i) => {
                  const minVal = Math.min(...(data?.equityCurve?.map((p) => p.value) ?? [0]));
                  const maxVal = Math.max(...(data?.equityCurve?.map((p) => p.value) ?? [100]));
                  const range = maxVal - minVal || 1;
                  const height = ((point.value - minVal) / range) * 100;
                  return (
                    <div
                      key={i}
                      className={cn(
                        'flex-1 min-h-[3px] rounded-t-[2px] transition-all',
                        i % 2 === 0
                          ? 'bg-[linear-gradient(to_top,#4f8eff,oklch(0.8_0.16_235/0.2))]'
                          : 'bg-[linear-gradient(to_top,#7ee8ff,oklch(0.86_0.12_220/0.2))]'
                      )}
                      style={{ height: `${Math.max(height, 3)}%` }}
                    />
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Portfolio Allocation */}
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-[20px] text-[#f5f7ff] font-serif">Allocation</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-4 w-full" />
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {data?.portfolioAllocation?.map((item) => (
                  <div key={item.label}>
                    <div className="flex justify-between mb-1.5">
                      <span className="text-[12px] text-[#c9d1e8]">{item.label}</span>
                      <span className="text-[12px] font-mono text-[#f5f7ff]">{item.value}%</span>
                    </div>
                    <div className="w-full h-[5px] bg-white/[0.06] rounded-[3px] overflow-hidden">
                      <div
                        className="h-full rounded-[3px] transition-[width] duration-1000 ease-out"
                        style={{ width: `${item.value}%`, backgroundColor: item.color }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card className="shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-[20px] text-[#f5f7ff] font-serif">Recent Activity</CardTitle>
            <Badge variant="outline" className="text-[11px] font-mono text-[#545d78] border-white/[0.14]">
              Last 7 days
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : (
            <div className="space-y-1">
              {data?.recentActivity?.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-center gap-3.5 px-3 py-2.5 rounded-[10px] hover:bg-white/[0.05] transition-colors"
                >
                  <div className="w-9 h-9 rounded-[10px] bg-white/[0.03] border border-white/[0.08] flex items-center justify-center shrink-0">
                    {activity.type === 'DEPOSIT' || activity.type === 'TRADE_CLOSE' ? (
                      <TrendingUp className="w-4 h-4 text-[#3ddc84]" />
                    ) : activity.type === 'WITHDRAW' ? (
                      <TrendingDown className="w-4 h-4 text-[#ff5555]" />
                    ) : (
                      <Users className="w-4 h-4 text-[#4f8eff]" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-medium text-[#f5f7ff]">{activity.description}</div>
                    <div className="text-[11px] text-[#545d78] mt-0.5">
                      {new Date(activity.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                  <div
                    className={cn(
                      'font-mono text-[13px] font-semibold',
                      activity.amount >= 0 ? 'text-[#3ddc84]' : 'text-[#ff5555]'
                    )}
                  >
                    {activity.amount >= 0 ? '+' : ''}{formatCurrency(activity.amount)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
