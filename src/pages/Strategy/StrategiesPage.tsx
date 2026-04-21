import { useState } from 'react';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useTranslation } from 'react-i18next';
import { useStrategies } from '@/hooks/useStrategies';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatCurrency, cn } from '@/lib/utils';
import { Search, Plus, Users } from 'lucide-react';
import type { Strategy, StrategyStatus } from '@contracts/routes';

const statusFilters: Array<StrategyStatus | 'ALL'> = ['ALL', 'ACTIVE', 'PAUSED', 'CLOSED', 'FUNDRAISING'];

export function StrategiesPage() {
  const { t } = useTranslation();
  useDocumentTitle(t('strategies.title') + ' — TradeVerse');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StrategyStatus | 'ALL'>('ALL');
  const { data, isLoading } = useStrategies(
    statusFilter !== 'ALL' ? { status: statusFilter } : undefined
  );

  const strategies = (data as { data?: { items?: Strategy[] } } | undefined)?.data?.items ?? [];
  const filtered = strategies.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.description.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 pb-16 animate-[pgIn_0.35s_ease-out]">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-[26px] text-foreground font-serif leading-tight">Signal Plaza</h1>
          <p className="text-[13px] text-muted-foreground mt-1">Manage and explore trading strategies</p>
        </div>
        <Button className="bg-[linear-gradient(180deg,oklch(0.7_0.2_255),oklch(0.52_0.22_262))] text-white border-0 shadow-[inset_0_1px_0_rgba(255,255,255,0.15),0_2px_4px_rgba(0,0,0,0.2)] hover:brightness-110">
          <Plus className="w-4 h-4" />
          New Strategy
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search strategies..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 text-[13px]"
          />
        </div>
        <Tabs value={statusFilter} onValueChange={(v) => setStatusFilter(v as StrategyStatus | 'ALL')}>
          <TabsList className="">
            {statusFilters.map((s) => (
              <TabsTrigger key={s} value={s} className="text-[12px]">
                {s === 'ALL' ? 'All' : s.charAt(0) + s.slice(1).toLowerCase()}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="rounded-[14px]">
              <CardContent className="p-5">
                <Skeleton className="h-5 w-32 mb-3" />
                <Skeleton className="h-4 w-20 mb-4" />
                <div className="grid grid-cols-3 gap-3">
                  <Skeleton className="h-12" />
                  <Skeleton className="h-12" />
                  <Skeleton className="h-12" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((strategy) => {
            const isFundraising = strategy.status === 'FUNDRAISING';
            const raised = Number(strategy.fundraisingRaised);
            const target = Number(strategy.fundraisingTarget);
            const pct = target > 0 ? (raised / target) * 100 : 0;
            return (
              <Card
                key={strategy.id}
                className="group cursor-pointer bg-card border-border rounded-[14px] hover:border-primary/30 hover:-translate-y-0.5 hover:shadow-[0_12px_30px_-10px_oklch(0.5_0.22_262/0.3)] transition-all duration-[280ms]"
              >
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-[16px] font-medium text-foreground mb-1">{strategy.name}</h3>
                      <div className="flex items-center gap-2 flex-wrap">
                        {strategy.tags.map((tag) => (
                          <span key={tag} className="text-[10px] font-mono text-muted-foreground uppercase bg-muted px-1.5 py-0.5 rounded">{tag}</span>
                        ))}
                      </div>
                    </div>
                    <Badge
                      variant="outline"
                      className={cn(
                        'text-[10px] font-mono px-2 py-0.5',
                        strategy.status === 'ACTIVE'
                          ? 'bg-[rgba(61,220,132,0.14)] text-[#3ddc84] border-[oklch(0.72_0.17_150/0.3)]'
                          : strategy.status === 'PAUSED'
                            ? 'bg-[rgba(255,209,102,0.14)] text-[#ffd166] border-[oklch(0.82_0.15_85/0.3)]'
                            : strategy.status === 'FUNDRAISING'
                              ? 'bg-[rgba(199,125,255,0.14)] text-[#c77dff] border-[oklch(0.7_0.2_300/0.3)]'
                              : 'bg-white/[0.06] text-[#8892b0] border-white/[0.14]'
                      )}
                    >
                      {strategy.status}
                    </Badge>
                  </div>

                  <div className="mb-4">
                    <div className="text-[22px] font-mono font-medium text-foreground">
                      {formatCurrency(strategy.aum)}
                    </div>
                    <div className="text-[12px] font-mono text-muted-foreground">AUM · {strategy.profitSharePct}% profit share</div>
                  </div>

                  {isFundraising && target > 0 && (
                    <div className="mb-3">
                      <div className="flex justify-between text-[11px] font-mono text-muted-foreground mb-1">
                        <span>Fundraising</span>
                        <span>{pct.toFixed(1)}%</span>
                      </div>
                      <div className="w-full h-[5px] bg-muted rounded-[3px] overflow-hidden">
                        <div className="h-full rounded-[3px] bg-[#c77dff] transition-[width] duration-1000" style={{ width: `${Math.min(pct, 100)}%` }} />
                      </div>
                      <div className="text-[10px] font-mono text-muted-foreground mt-1">{formatCurrency(strategy.fundraisingRaised)} of {formatCurrency(strategy.fundraisingTarget)}</div>
                    </div>
                  )}

                  <div className="grid grid-cols-3 gap-2 pt-3 border-t border-border">
                    <div>
                      <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mb-1">Win Rate</div>
                      <div className="text-[13px] font-mono text-foreground">{Number(strategy.winRate).toFixed(1)}%</div>
                    </div>
                    <div>
                      <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mb-1">Trades</div>
                      <div className="text-[13px] font-mono text-foreground">{strategy.tradeCount}</div>
                    </div>
                    <div>
                      <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mb-1">Drawdown</div>
                      <div className="text-[13px] font-mono text-foreground">{Number(strategy.maxDrawdown).toFixed(1)}%</div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
                    <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                      <Users className="w-3 h-3" />
                      {strategy.followerCount} followers
                    </div>
                    <Badge variant="outline" className="text-[9px] font-mono text-muted-foreground">
                      {strategy.providerName}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
