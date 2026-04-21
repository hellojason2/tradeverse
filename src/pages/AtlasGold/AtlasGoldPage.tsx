import { useState } from 'react';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useAtlasGoldBalance, useAtlasGoldHistory, useBuyAtlasGold, useRedeemAtlasGold } from '@/hooks/useAtlasGold';
import { useWalletBalance } from '@/hooks/useWallet';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/utils';
import { Scale, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import type { AtlasGoldTransaction } from '@contracts/routes';

export function AtlasGoldPage() {
  useDocumentTitle('Atlas Gold');
  const { data: balanceData, isLoading: balanceLoading } = useAtlasGoldBalance();
  const { data: historyData, isLoading: historyLoading } = useAtlasGoldHistory();
  const { data: walletData } = useWalletBalance();
  const buy = useBuyAtlasGold();
  const redeem = useRedeemAtlasGold();
  const [buyAmount, setBuyAmount] = useState('');
  const [redeemAmount, setRedeemAmount] = useState('');

  const balance = (balanceData as { data?: { grams: string; usdtValue: string; spotPricePerGram: string } } | undefined)?.data;
  const history = ((historyData as { data?: { items?: AtlasGoldTransaction[] } } | undefined)?.data?.items) ?? [];
  const wallet = (walletData as { data?: { available: string } } | undefined)?.data;

  const handleBuy = () => {
    if (!buyAmount) return;
    buy.mutate({ usdtAmount: buyAmount });
    setBuyAmount('');
  };

  const handleRedeem = () => {
    if (!redeemAmount) return;
    redeem.mutate({ grams: redeemAmount });
    setRedeemAmount('');
  };

  return (
    <div className="p-6 pb-16 animate-[pgIn_0.35s_ease-out]">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <Scale className="w-5 h-5 text-[#ffd166]" />
          <h1 className="text-[26px] text-[#f5f7ff] font-serif leading-tight">Atlas Gold</h1>
        </div>
        <p className="text-[13px] text-[#8892b0]">Gold-backed holdings and redemption</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        {/* Holdings Card */}
        <Card className="lg:col-span-1 bg-[linear-gradient(180deg,rgba(14,20,44,0.55),rgba(8,12,28,0.55))] backdrop-blur-[20px] border-white/[0.08] rounded-[14px]">
          <CardHeader>
            <CardTitle className="text-[20px] text-[#f5f7ff] font-serif">Your Holdings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {balanceLoading ? (
              <>
                <Skeleton className="h-8 w-32" />
                <Skeleton className="h-6 w-24" />
                <Skeleton className="h-6 w-40" />
              </>
            ) : (
              <>
                <div>
                  <div className="text-[11px] font-mono uppercase tracking-[0.08em] text-[#545d78] mb-1">Gold Balance</div>
                  <div className="text-[28px] font-mono font-medium text-[#f5f7ff]">{balance ? `${Number(balance.grams).toFixed(4)} g` : '0.0000 g'}</div>
                </div>
                <div>
                  <div className="text-[11px] font-mono uppercase tracking-[0.08em] text-[#545d78] mb-1">USDT Value</div>
                  <div className="text-[20px] font-mono font-medium text-[#ffd166]">{balance ? formatCurrency(balance.usdtValue) : '$0.00'}</div>
                </div>
                <div className="pt-3 border-t border-white/[0.08]">
                  <div className="text-[11px] font-mono uppercase tracking-[0.08em] text-[#545d78] mb-1">Spot Price</div>
                  <div className="text-[14px] font-mono text-[#c9d1e8]">{balance ? `${formatCurrency(balance.spotPricePerGram)} / g` : '-'}</div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Price Chart Placeholder */}
        <Card className="lg:col-span-2 bg-[linear-gradient(180deg,rgba(14,20,44,0.55),rgba(8,12,28,0.55))] backdrop-blur-[20px] border-white/[0.08] rounded-[14px]">
          <CardHeader>
            <CardTitle className="text-[20px] text-[#f5f7ff] font-serif">Price History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="w-full h-[200px] bg-white/[0.02] border border-white/[0.08] rounded-[10px] flex items-end p-4 gap-[3px] overflow-hidden">
              {Array.from({ length: 40 }).map((_, i) => {
                const h = 20 + Math.random() * 70;
                return (
                  <div
                    key={i}
                    className={`flex-1 min-h-[3px] rounded-t-[2px] ${i % 2 === 0 ? 'bg-[linear-gradient(to_top,#ffd166,oklch(0.82_0.15_85/0.2))]' : 'bg-[linear-gradient(to_top,#c77dff,oklch(0.7_0.2_300/0.2))]'}`}
                    style={{ height: `${h}%` }}
                  />
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Buy / Redeem Forms */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <Card className="bg-[linear-gradient(180deg,rgba(14,20,44,0.55),rgba(8,12,28,0.55))] backdrop-blur-[20px] border-white/[0.08] rounded-[14px]">
          <CardHeader>
            <CardTitle className="text-[20px] text-[#f5f7ff] font-serif flex items-center gap-2">
              <ArrowUpRight className="w-5 h-5 text-[#3ddc84]" /> Buy Gold
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-[11px] font-mono uppercase tracking-[0.08em] text-[#8892b0]">USDT Amount</Label>
              <Input
                type="number"
                placeholder="100.00"
                value={buyAmount}
                onChange={(e) => setBuyAmount(e.target.value)}
                className="mt-1.5 bg-white/[0.03] border-white/[0.08] focus:border-[rgba(120,160,255,0.22)] font-mono"
              />
              <p className="mt-1 text-[11px] text-[#545d78] font-mono">Available: {wallet ? formatCurrency(wallet.available) : '$0.00'}</p>
            </div>
            <Button
              className="w-full bg-[linear-gradient(180deg,oklch(0.76_0.18_155),oklch(0.55_0.17_150))] text-white border-0 hover:brightness-110"
              onClick={handleBuy}
              disabled={buy.isPending || !buyAmount}
            >
              {buy.isPending ? 'Processing...' : 'Buy Atlas Gold'}
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-[linear-gradient(180deg,rgba(14,20,44,0.55),rgba(8,12,28,0.55))] backdrop-blur-[20px] border-white/[0.08] rounded-[14px]">
          <CardHeader>
            <CardTitle className="text-[20px] text-[#f5f7ff] font-serif flex items-center gap-2">
              <ArrowDownRight className="w-5 h-5 text-[#ff5555]" /> Redeem Gold
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-[11px] font-mono uppercase tracking-[0.08em] text-[#8892b0]">Grams</Label>
              <Input
                type="number"
                placeholder="1.0000"
                value={redeemAmount}
                onChange={(e) => setRedeemAmount(e.target.value)}
                className="mt-1.5 bg-white/[0.03] border-white/[0.08] focus:border-[rgba(120,160,255,0.22)] font-mono"
              />
              <p className="mt-1 text-[11px] text-[#545d78] font-mono">Balance: {balance ? `${Number(balance.grams).toFixed(4)} g` : '0.0000 g'}</p>
            </div>
            <Button
              className="w-full bg-[linear-gradient(180deg,oklch(0.72_0.22_25),oklch(0.55_0.22_20))] text-white border-0 hover:brightness-110"
              onClick={handleRedeem}
              disabled={redeem.isPending || !redeemAmount}
            >
              {redeem.isPending ? 'Processing...' : 'Redeem to USDT'}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Transaction History */}
      <Card className="bg-[linear-gradient(180deg,rgba(14,20,44,0.55),rgba(8,12,28,0.55))] backdrop-blur-[20px] border-white/[0.08] rounded-[14px]">
        <CardHeader>
          <CardTitle className="text-[20px] text-[#f5f7ff] font-serif">Transaction History</CardTitle>
        </CardHeader>
        <CardContent>
          {historyLoading ? (
            <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
          ) : history.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Scale className="w-8 h-8 text-[#545d78] mb-3" />
              <p className="text-[13px] text-[#8892b0]">No transactions yet</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-white/[0.08] hover:bg-transparent">
                  <TableHead className="text-[10px] font-mono uppercase tracking-[0.1em] text-[#545d78]">Type</TableHead>
                  <TableHead className="text-[10px] font-mono uppercase tracking-[0.1em] text-[#545d78]">Grams</TableHead>
                  <TableHead className="text-[10px] font-mono uppercase tracking-[0.1em] text-[#545d78]">USDT Amount</TableHead>
                  <TableHead className="text-[10px] font-mono uppercase tracking-[0.1em] text-[#545d78]">Price / g</TableHead>
                  <TableHead className="text-[10px] font-mono uppercase tracking-[0.1em] text-[#545d78]">Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {history.map((tx) => (
                  <TableRow key={tx.id} className="border-white/[0.04]">
                    <TableCell>
                      <Badge variant="outline" className={`text-[9px] font-mono ${
                        tx.type === 'BUY' ? 'text-[#3ddc84] border-[oklch(0.72_0.17_150/0.3)]' : 'text-[#ff5555] border-[oklch(0.68_0.22_20/0.3)]'
                      }`}>
                        {tx.type}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-[12px] text-[#f5f7ff]">{Number(tx.grams).toFixed(4)} g</TableCell>
                    <TableCell className="font-mono text-[12px] text-[#c9d1e8]">{formatCurrency(tx.usdtAmount)}</TableCell>
                    <TableCell className="font-mono text-[12px] text-[#c9d1e8]">{formatCurrency(tx.pricePerGram)}</TableCell>
                    <TableCell className="text-[11px] text-[#545d78]">{new Date(tx.createdAt).toLocaleDateString()}</TableCell>
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
