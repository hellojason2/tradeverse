import { useState } from 'react';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useTranslation } from 'react-i18next';
import { useCopyRelations } from '@/hooks/useCopyRelations';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn, formatCurrency } from '@/lib/utils';
import { Trophy, Copy, Users } from 'lucide-react';
import type { CopyRelation } from '@contracts/routes';

// Legacy leaderboard hook using apiClient directly
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/services/api-client';

function useCopyTraders(params?: Record<string, string>) {
  const qs = params ? '?' + new URLSearchParams(params).toString() : '';
  return useQuery({
    queryKey: ['copy-traders', params],
    queryFn: () => apiClient.get(`/copy-trading/leaderboard${qs}`),
    staleTime: 30_000,
  });
}

export function CopyTradingPage() {
  const { t } = useTranslation();
  useDocumentTitle(t('copyTrading.title') + ' — TradeVerse');
  const [sortBy, setSortBy] = useState('roi');
  const { data: leaderboardData, isLoading } = useCopyTraders({ sort: sortBy });
  const { data: relationsData } = useCopyRelations();

  const leaderboard = (leaderboardData as { data?: Array<Record<string, unknown>> } | undefined)?.data ?? [];
  const relations = (relationsData as { data?: { items?: CopyRelation[] } } | undefined)?.data?.items ?? [];

  return (
    <div className="p-6 pb-16 animate-[pgIn_0.35s_ease-out]">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-[26px] text-foreground font-serif leading-tight">Copy Trading</h1>
          <p className="text-[13px] text-muted-foreground mt-1">Follow top traders and mirror their strategies</p>
        </div>
      </div>

      {relations.length > 0 && (
        <div className="mb-6">
          <h2 className="text-[16px] font-medium text-foreground mb-3">Your Active Copies</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {relations.map((rel) => (
              <Card key={rel.id} className="bg-[linear-gradient(180deg,rgba(14,20,44,0.55),rgba(8,12,28,0.55))] backdrop-blur-[14px] border-border rounded-[14px]">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-[14px] font-medium text-foreground">{rel.strategyName}</div>
                      <Badge
                        variant="outline"
                        className={cn(
                          'text-[9px] font-mono mt-1',
                          rel.status === 'ACTIVE'
                            ? 'bg-[rgba(61,220,132,0.14)] text-[#3ddc84] border-[oklch(0.72_0.17_150/0.3)]'
                            : rel.status === 'PAUSED'
                              ? 'bg-[rgba(255,209,102,0.14)] text-[#ffd166] border-[oklch(0.82_0.15_85/0.3)]'
                              : 'bg-[rgba(255,85,85,0.14)] text-[#ff5555] border-[oklch(0.68_0.22_20/0.3)]'
                        )}
                      >
                        {rel.status}
                      </Badge>
                    </div>
                    <div className="text-right">
                      <div className="text-[16px] font-mono font-medium text-foreground">
                        {formatCurrency(rel.riskCapital)}
                      </div>
                      <div className="text-[11px] font-mono text-muted-foreground">Risk Capital</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      <Card className="bg-card border-border rounded-[14px]">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <CardTitle className="text-[20px] text-foreground font-serif flex items-center gap-2">
              <Trophy className="w-5 h-5 text-[#ffd166]" />
              Leaderboard
            </CardTitle>
            <Tabs value={sortBy} onValueChange={setSortBy}>
              <TabsList className="bg-muted/30 border-border">
                <TabsTrigger value="roi" className="text-[11px]">ROI</TabsTrigger>
                <TabsTrigger value="winRate" className="text-[11px]">Win Rate</TabsTrigger>
                <TabsTrigger value="followers" className="text-[11px]">Followers</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead className="text-[10px] font-mono uppercase tracking-[0.1em] text-muted-foreground">#</TableHead>
                  <TableHead className="text-[10px] font-mono uppercase tracking-[0.1em] text-muted-foreground">Trader</TableHead>
                  <TableHead className="text-[10px] font-mono uppercase tracking-[0.1em] text-muted-foreground">ROI</TableHead>
                  <TableHead className="text-[10px] font-mono uppercase tracking-[0.1em] text-muted-foreground">Win Rate</TableHead>
                  <TableHead className="text-[10px] font-mono uppercase tracking-[0.1em] text-muted-foreground">Risk</TableHead>
                  <TableHead className="text-[10px] font-mono uppercase tracking-[0.1em] text-muted-foreground">Followers</TableHead>
                  <TableHead className="text-[10px] font-mono uppercase tracking-[0.1em] text-muted-foreground text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leaderboard.map((trader, i) => (
                  <TableRow key={trader.id as string} className="border-border">
                    <TableCell className="font-mono text-[12px] text-muted-foreground font-bold">
                      {i + 1}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-[linear-gradient(135deg,oklch(0.5_0.2_280),oklch(0.6_0.2_260))] flex items-center justify-center text-white text-[10px] font-mono font-bold">
                          {(trader.name as string).slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="text-[13px] font-medium text-foreground">{trader.name as string}</div>
                          <div className="text-[11px] text-muted-foreground font-mono">{trader.strategy as string}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-[13px] font-semibold text-[#3ddc84]">
                      +{(trader.roi as number).toFixed(1)}%
                    </TableCell>
                    <TableCell className="font-mono text-[12px] text-foreground">
                      {(trader.winRate as number).toFixed(1)}%
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[9px] font-mono text-muted-foreground border-border">
                        {(trader.riskScore as number)}/10
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-[12px] text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {trader.followers as number}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        className="text-[11px] bg-muted/30 text-muted-foreground border border-border hover:bg-muted/30 hover:text-foreground hover:border-[rgba(120,160,255,0.22)]"
                        variant="outline"
                        onClick={() => console.log('Copy', trader.id)}
                      >
                        <Copy className="w-3 h-3" />
                        Copy
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
