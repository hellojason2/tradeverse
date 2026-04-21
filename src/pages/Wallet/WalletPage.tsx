import { useState } from 'react';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useTranslation } from 'react-i18next';
import { useWalletBalance, useTransactions, useDeposit, useWithdraw } from '@/hooks/useWallet';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatCurrency, cn, formatAddress } from '@/lib/utils';
import { ArrowUpRight, ArrowDownLeft, CheckCircle, XCircle, Clock, ExternalLink } from 'lucide-react';
import type { Transaction, TransactionType, WalletBalance } from '@contracts/routes';

export function WalletPage() {
  const { t } = useTranslation();
  useDocumentTitle(t('wallet.title') + ' — TradeVerse');
  const [txFilter, setTxFilter] = useState<TransactionType | 'ALL'>('ALL');
  const { data: walletData, isLoading: walletLoading } = useWalletBalance();
  const { data: txData, isLoading: txLoading } = useTransactions(txFilter !== 'ALL' ? { type: txFilter } : undefined);
  const deposit = useDeposit();
  const withdraw = useWithdraw();

  const wallet = (walletData as { data?: WalletBalance } | undefined)?.data;
  const transactions = ((txData as { data?: { items?: Transaction[] } } | undefined)?.data?.items) ?? [];

  const [depositNetwork, setDepositNetwork] = useState<'ERC20' | 'TRC20' | 'BEP20'>('ERC20');
  const [depositTxHash, setDepositTxHash] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawAddress, setWithdrawAddress] = useState('');
  const [withdrawNetwork, setWithdrawNetwork] = useState<'ERC20' | 'TRC20' | 'BEP20'>('ERC20');
  const [withdrawTwoFa, setWithdrawTwoFa] = useState('');

  const statusIcon = (status: string) => {
    if (status === 'CONFIRMED') return <CheckCircle className="w-3.5 h-3.5 text-[#3ddc84]" />;
    if (status === 'FAILED' || status === 'CANCELLED') return <XCircle className="w-3.5 h-3.5 text-[#ff5555]" />;
    return <Clock className="w-3.5 h-3.5 text-[#ffd166]" />;
  };

  return (
    <div className="p-6 pb-16 animate-[pgIn_0.35s_ease-out]">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-[26px] text-foreground font-serif leading-tight">Wallet</h1>
          <p className="text-[13px] text-muted-foreground mt-1">Manage your funds and transactions</p>
        </div>
        <div className="flex gap-2">
          <Dialog>
            <DialogTrigger asChild>
              <Button className="bg-[linear-gradient(180deg,oklch(0.76_0.18_155),oklch(0.55_0.17_150))] text-white border-0 hover:brightness-110">
                <ArrowDownLeft className="w-4 h-4" /> Deposit
              </Button>
            </DialogTrigger>
            <DialogContent className="">
              <DialogHeader><DialogTitle className="font-serif">Deposit USDT</DialogTitle></DialogHeader>
              <div className="space-y-4 mt-4">
                <div>
                  <Label className="text-foreground">Network</Label>
                  <Select value={depositNetwork} onValueChange={(v) => setDepositNetwork(v as 'ERC20' | 'TRC20' | 'BEP20')}>
                    <SelectTrigger className="mt-1"><SelectValue placeholder="Select network" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ERC20">ERC20</SelectItem>
                      <SelectItem value="TRC20">TRC20</SelectItem>
                      <SelectItem value="BEP20">BEP20</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-foreground">TX Hash (optional)</Label>
                  <Input value={depositTxHash} onChange={(e) => setDepositTxHash(e.target.value)} placeholder="0x..." className="mt-1" />
                </div>
                <Button
                  className="w-full bg-[linear-gradient(180deg,oklch(0.76_0.18_155),oklch(0.55_0.17_150))] text-white border-0"
                  onClick={() => deposit.mutate({ network: depositNetwork, txHash: depositTxHash || undefined })}
                  disabled={deposit.isPending}
                >
                  Confirm Deposit
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" className="">
                <ArrowUpRight className="w-4 h-4" /> Withdraw
              </Button>
            </DialogTrigger>
            <DialogContent className="">
              <DialogHeader><DialogTitle className="font-serif">Withdraw USDT</DialogTitle></DialogHeader>
              <div className="space-y-4 mt-4">
                <div>
                  <Label className="text-foreground">Network</Label>
                  <Select value={withdrawNetwork} onValueChange={(v) => setWithdrawNetwork(v as 'ERC20' | 'TRC20' | 'BEP20')}>
                    <SelectTrigger className="mt-1"><SelectValue placeholder="Select network" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ERC20">ERC20</SelectItem>
                      <SelectItem value="TRC20">TRC20</SelectItem>
                      <SelectItem value="BEP20">BEP20</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div><Label className="text-foreground">Amount (USDT)</Label><Input type="number" value={withdrawAmount} onChange={(e) => setWithdrawAmount(e.target.value)} placeholder="0.00" className="mt-1" /></div>
                <div><Label className="text-foreground">Wallet Address</Label><Input value={withdrawAddress} onChange={(e) => setWithdrawAddress(e.target.value)} placeholder="0x..." className="mt-1" /></div>
                <div><Label className="text-foreground">2FA Code</Label><Input value={withdrawTwoFa} onChange={(e) => setWithdrawTwoFa(e.target.value)} placeholder="000000" className="mt-1" /></div>
                <Button
                  className="w-full bg-[linear-gradient(180deg,oklch(0.72_0.22_25),oklch(0.55_0.22_20))] text-white border-0"
                  onClick={() => withdraw.mutate({ amount: withdrawAmount, toAddress: withdrawAddress, network: withdrawNetwork, twoFaCode: withdrawTwoFa })}
                  disabled={withdraw.isPending}
                >
                  Confirm Withdrawal
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {walletLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-[14px]" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card className="rounded-[14px]">
            <CardContent className="p-5">
              <div className="text-[11px] font-mono uppercase tracking-[0.08em] text-muted-foreground mb-2">Total Balance</div>
              <div className="text-[26px] font-mono font-medium text-foreground">{formatCurrency(wallet?.total ?? '0')}</div>
              <div className="text-[12px] font-mono text-muted-foreground mt-1">USDT</div>
            </CardContent>
          </Card>
          <Card className="rounded-[14px]">
            <CardContent className="p-5">
              <div className="text-[11px] font-mono uppercase tracking-[0.08em] text-muted-foreground mb-2">Available</div>
              <div className="text-[26px] font-mono font-medium text-[#3ddc84]">{formatCurrency(wallet?.available ?? '0')}</div>
            </CardContent>
          </Card>
          <Card className="rounded-[14px]">
            <CardContent className="p-5">
              <div className="text-[11px] font-mono uppercase tracking-[0.08em] text-muted-foreground mb-2">Locked</div>
              <div className="text-[26px] font-mono font-medium text-[#ffd166]">{formatCurrency(wallet?.locked ?? '0')}</div>
            </CardContent>
          </Card>
        </div>
      )}

      <Card className="rounded-[14px]">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-[20px] font-serif">Transaction History</CardTitle>
            <Tabs value={txFilter} onValueChange={(v) => setTxFilter(v as TransactionType | 'ALL')}>
              <TabsList className="">
                <TabsTrigger value="ALL" className="text-[11px]">All</TabsTrigger>
                <TabsTrigger value="DEPOSIT" className="text-[11px]">Deposits</TabsTrigger>
                <TabsTrigger value="WITHDRAWAL" className="text-[11px]">Withdrawals</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardHeader>
        <CardContent>
          {txLoading ? (
            <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="text-[10px] font-mono uppercase tracking-[0.1em] text-muted-foreground">Status</TableHead>
                  <TableHead className="text-[10px] font-mono uppercase tracking-[0.1em] text-muted-foreground">Type</TableHead>
                  <TableHead className="text-[10px] font-mono uppercase tracking-[0.1em] text-muted-foreground">Amount</TableHead>
                  <TableHead className="text-[10px] font-mono uppercase tracking-[0.1em] text-muted-foreground">Network</TableHead>
                  <TableHead className="text-[10px] font-mono uppercase tracking-[0.1em] text-muted-foreground">Date</TableHead>
                  <TableHead className="text-[10px] font-mono uppercase tracking-[0.1em] text-muted-foreground">Tx Hash</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((tx) => (
                  <TableRow key={tx.id} className="">
                    <TableCell>{statusIcon(tx.status)}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={cn('text-[10px] font-mono', tx.type === 'DEPOSIT' ? 'text-[#3ddc84] border-[oklch(0.72_0.17_150/0.3)]' : tx.type === 'WITHDRAWAL' ? 'text-[#ff5555] border-[oklch(0.68_0.22_20/0.3)]' : 'text-[#8892b0] border-white/[0.14]')}>
                        {tx.type}
                      </Badge>
                    </TableCell>
                    <TableCell className={cn('font-mono text-[13px] font-semibold', Number(tx.amount) >= 0 ? 'text-[#3ddc84]' : 'text-[#ff5555]')}>
                      {Number(tx.amount) >= 0 ? '+' : ''}{formatCurrency(tx.amount)}
                    </TableCell>
                    <TableCell className="text-[12px] font-mono text-muted-foreground">{tx.network ?? '-'}</TableCell>
                    <TableCell className="text-[12px] text-muted-foreground">{new Date(tx.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-[11px] font-mono text-muted-foreground">
                        {tx.txHash ? formatAddress(tx.txHash, 4) : '-'}
                        {tx.txHash && <ExternalLink className="w-3 h-3" />}
                      </div>
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
