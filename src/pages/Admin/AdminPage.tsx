import { useState } from 'react';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useAdminUsers, useAdminConfig, useAdminWithdrawals, useApproveWithdrawal, useRejectWithdrawal, useSuspendUser, useUnsuspendUser, useKycApprove } from '@/hooks/useAdmin';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { formatCurrency, initials } from '@/lib/utils';
import { Shield, Users, DollarSign, CheckCircle, XCircle, Settings, AlertTriangle, UserCheck } from 'lucide-react';
import type { AdminUserDetail, ConfigEntry, Transaction } from '@contracts/routes';

function ConfigEditor() {
  const { data, isLoading } = useAdminConfig();
  const updateConfig = useUpdateConfig('');
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const configs = (data as { data?: ConfigEntry[] } | undefined)?.data ?? [];

  const handleSave = (_key: string) => {
    updateConfig.mutate({ value: editValue });
    setEditingKey(null);
  };

  return (
    <Card className="bg-[linear-gradient(180deg,rgba(14,20,44,0.55),rgba(8,12,28,0.55))] backdrop-blur-[20px] border-white/[0.08] rounded-[14px]">
      <CardHeader>
        <CardTitle className="text-[20px] text-[#f5f7ff] font-serif flex items-center gap-2">
          <Settings className="w-5 h-5 text-[#4f8eff]" /> Platform Config
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="border-white/[0.08] hover:bg-transparent">
                <TableHead className="text-[10px] font-mono uppercase tracking-[0.1em] text-[#545d78]">Key</TableHead>
                <TableHead className="text-[10px] font-mono uppercase tracking-[0.1em] text-[#545d78]">Value</TableHead>
                <TableHead className="text-[10px] font-mono uppercase tracking-[0.1em] text-[#545d78]">Description</TableHead>
                <TableHead className="text-right"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {configs.map((cfg) => (
                <TableRow key={cfg.key} className="border-white/[0.04]">
                  <TableCell className="font-mono text-[12px] text-[#c9d1e8]">{cfg.key}</TableCell>
                  <TableCell>
                    {editingKey === cfg.key ? (
                      <Input
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        className="h-8 bg-white/[0.03] border-white/[0.08] text-[13px]"
                      />
                    ) : (
                      <span className="text-[13px] text-[#f5f7ff]">{cfg.value}</span>
                    )}
                  </TableCell>
                  <TableCell className="text-[12px] text-[#8892b0] max-w-[300px] truncate">{cfg.description}</TableCell>
                  <TableCell className="text-right">
                    {editingKey === cfg.key ? (
                      <div className="flex gap-2 justify-end">
                        <Button size="sm" className="h-7 text-[11px] bg-[#3ddc84] text-[#030611] hover:brightness-110" onClick={() => handleSave(cfg.key)}>Save</Button>
                        <Button size="sm" variant="outline" className="h-7 text-[11px]" onClick={() => setEditingKey(null)}>Cancel</Button>
                      </div>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-[11px] bg-white/[0.02] text-[#8892b0] border-white/[0.08] hover:border-[rgba(120,160,255,0.22)]"
                        onClick={() => { setEditingKey(cfg.key); setEditValue(cfg.value); }}
                      >
                        Edit
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

function WithdrawalQueue() {
  const { data, isLoading } = useAdminWithdrawals({ status: 'PENDING' });
  const approve = useApproveWithdrawal();
  const reject = useRejectWithdrawal();
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const txs = ((data as { data?: { items?: Transaction[] } } | undefined)?.data?.items) ?? [];

  return (
    <Card className="bg-[linear-gradient(180deg,rgba(14,20,44,0.55),rgba(8,12,28,0.55))] backdrop-blur-[20px] border-white/[0.08] rounded-[14px]">
      <CardHeader>
        <CardTitle className="text-[20px] text-[#f5f7ff] font-serif flex items-center gap-2">
          <DollarSign className="w-5 h-5 text-[#ffd166]" /> Withdrawal Approvals
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
        ) : txs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <CheckCircle className="w-8 h-8 text-[#3ddc84] mb-3" />
            <p className="text-[13px] text-[#8892b0]">No pending withdrawals</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="border-white/[0.08] hover:bg-transparent">
                <TableHead className="text-[10px] font-mono uppercase tracking-[0.1em] text-[#545d78]">ID</TableHead>
                <TableHead className="text-[10px] font-mono uppercase tracking-[0.1em] text-[#545d78]">Amount</TableHead>
                <TableHead className="text-[10px] font-mono uppercase tracking-[0.1em] text-[#545d78]">Network</TableHead>
                <TableHead className="text-[10px] font-mono uppercase tracking-[0.1em] text-[#545d78]">To Address</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {txs.map((tx) => (
                <TableRow key={tx.id} className="border-white/[0.04]">
                  <TableCell className="font-mono text-[12px] text-[#c9d1e8]">{tx.id}</TableCell>
                  <TableCell className="font-mono text-[13px] text-[#f5f7ff]">{formatCurrency(tx.amount)}</TableCell>
                  <TableCell><Badge variant="outline" className="text-[9px] font-mono">{tx.network}</Badge></TableCell>
                  <TableCell className="font-mono text-[11px] text-[#545d78]">{tx.toAddress ?? '-'}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex gap-2 justify-end">
                      <Button
                        size="sm"
                        className="h-7 text-[11px] bg-[#3ddc84] text-[#030611] hover:brightness-110"
                        onClick={() => approve.mutate(tx.id)}
                        disabled={approve.isPending}
                      >
                        <CheckCircle className="w-3 h-3 mr-1" /> Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-[11px] bg-white/[0.02] text-[#ff5555] border-[oklch(0.68_0.22_20/0.3)] hover:bg-[rgba(255,85,85,0.08)]"
                        onClick={() => setRejectId(tx.id)}
                      >
                        <XCircle className="w-3 h-3 mr-1" /> Reject
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        <Dialog open={Boolean(rejectId)} onOpenChange={() => setRejectId(null)}>
          <DialogContent className="bg-[linear-gradient(180deg,rgba(14,20,44,0.9),rgba(8,12,28,0.9))] border-white/[0.14]">
            <DialogHeader>
              <DialogTitle className="text-[20px] text-[#f5f7ff] font-serif">Reject Withdrawal</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <Label className="text-[11px] font-mono uppercase tracking-[0.08em] text-[#8892b0]">Reason</Label>
              <Input
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Enter rejection reason"
                className="mt-1.5 bg-white/[0.03] border-white/[0.08]"
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setRejectId(null)} className="bg-white/[0.02]">Cancel</Button>
              <Button
                className="bg-[#ff5555] text-white hover:brightness-110"
                onClick={() => {
                  if (rejectId) reject.mutate({ id: rejectId, reason: rejectReason });
                  setRejectId(null);
                  setRejectReason('');
                }}
                disabled={reject.isPending || !rejectReason}
              >
                Confirm Reject
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}

import { useUpdateConfig } from '@/hooks/useAdmin';
import { Label } from '@/components/ui/label';

export function AdminPage() {
  useDocumentTitle('Admin');
  const { data, isLoading } = useAdminUsers();
  const suspend = useSuspendUser();
  const unsuspend = useUnsuspendUser();
  const kycApprove = useKycApprove();
  const users = ((data as { data?: { items?: AdminUserDetail[] } } | undefined)?.data?.items) ?? [];

  return (
    <div className="p-6 pb-16 animate-[pgIn_0.35s_ease-out]">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <Shield className="w-5 h-5 text-[#c77dff]" />
          <h1 className="text-[26px] text-[#f5f7ff] font-serif leading-tight">Admin Panel</h1>
        </div>
        <p className="text-[13px] text-[#8892b0]">Platform management and user administration</p>
      </div>

      <Tabs defaultValue="users" className="space-y-6">
        <TabsList className="bg-white/[0.03] border border-white/[0.08]">
          <TabsTrigger value="users" className="text-[12px] data-[state=active]:bg-[linear-gradient(180deg,oklch(0.55_0.22_260/0.3),oklch(0.55_0.22_260/0.1))] data-[state=active]:text-[#f5f7ff]">Users</TabsTrigger>
          <TabsTrigger value="withdrawals" className="text-[12px] data-[state=active]:bg-[linear-gradient(180deg,oklch(0.55_0.22_260/0.3),oklch(0.55_0.22_260/0.1))] data-[state=active]:text-[#f5f7ff]">Withdrawals</TabsTrigger>
          <TabsTrigger value="config" className="text-[12px] data-[state=active]:bg-[linear-gradient(180deg,oklch(0.55_0.22_260/0.3),oklch(0.55_0.22_260/0.1))] data-[state=active]:text-[#f5f7ff]">Config</TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-4">
          <Card className="bg-[linear-gradient(180deg,rgba(14,20,44,0.55),rgba(8,12,28,0.55))] backdrop-blur-[20px] border-white/[0.08] rounded-[14px]">
            <CardHeader>
              <CardTitle className="text-[20px] text-[#f5f7ff] font-serif flex items-center gap-2">
                <Users className="w-5 h-5 text-[#c77dff]" /> User Management
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="border-white/[0.08] hover:bg-transparent">
                      <TableHead className="text-[10px] font-mono uppercase tracking-[0.1em] text-[#545d78]">User</TableHead>
                      <TableHead className="text-[10px] font-mono uppercase tracking-[0.1em] text-[#545d78]">Role</TableHead>
                      <TableHead className="text-[10px] font-mono uppercase tracking-[0.1em] text-[#545d78]">KYC</TableHead>
                      <TableHead className="text-[10px] font-mono uppercase tracking-[0.1em] text-[#545d78]">Balance</TableHead>
                      <TableHead className="text-[10px] font-mono uppercase tracking-[0.1em] text-[#545d78]">Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user.id} className="border-white/[0.04]">
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-[linear-gradient(135deg,oklch(0.5_0.2_280),oklch(0.6_0.2_260))] flex items-center justify-center text-white text-[10px] font-mono font-bold">
                              {initials(user.displayName)}
                            </div>
                            <div>
                              <div className="text-[13px] font-medium text-[#f5f7ff]">{user.displayName}</div>
                              <div className="text-[11px] text-[#545d78] font-mono">{user.email}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell><Badge variant="outline" className="text-[9px] font-mono text-[#c77dff] border-[oklch(0.6_0.2_300/0.3)]">{user.role}</Badge></TableCell>
                        <TableCell>
                          <Badge variant="outline" className={`text-[9px] font-mono ${
                            user.kycStatus === 'VERIFIED' ? 'text-[#3ddc84] border-[oklch(0.72_0.17_150/0.3)]' :
                            user.kycStatus === 'PENDING' ? 'text-[#ffd166] border-[oklch(0.82_0.15_85/0.3)]' :
                            'text-[#ff5555] border-[oklch(0.68_0.22_20/0.3)]'
                          }`}>{user.kycStatus}</Badge>
                        </TableCell>
                        <TableCell className="font-mono text-[12px] text-[#c9d1e8]">{formatCurrency(user.walletBalance)}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={`text-[9px] font-mono ${
                            user.status === 'ACTIVE' ? 'text-[#3ddc84] border-[oklch(0.72_0.17_150/0.3)]' :
                            user.status === 'SUSPENDED' ? 'text-[#ffd166] border-[oklch(0.82_0.15_85/0.3)]' :
                            'text-[#ff5555] border-[oklch(0.68_0.22_20/0.3)]'
                          }`}>{user.status}</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex gap-2 justify-end">
                            {user.kycStatus === 'PENDING' && (
                              <Button size="sm" className="h-7 text-[10px] bg-[#3ddc84] text-[#030611] hover:brightness-110" onClick={() => kycApprove.mutate(user.id)}>
                                <UserCheck className="w-3 h-3 mr-1" /> KYC
                              </Button>
                            )}
                            {user.status === 'ACTIVE' ? (
                              <Button size="sm" variant="outline" className="h-7 text-[10px] bg-white/[0.02] text-[#ffd166] border-[oklch(0.82_0.15_85/0.3)] hover:bg-[rgba(255,209,102,0.08)]" onClick={() => suspend.mutate({ id: user.id, reason: 'Admin action' })}>
                                <AlertTriangle className="w-3 h-3 mr-1" /> Suspend
                              </Button>
                            ) : (
                              <Button size="sm" variant="outline" className="h-7 text-[10px] bg-white/[0.02] text-[#3ddc84] border-[oklch(0.72_0.17_150/0.3)] hover:bg-[rgba(61,220,132,0.08)]" onClick={() => unsuspend.mutate(user.id)}>
                                <CheckCircle className="w-3 h-3 mr-1" /> Unsuspend
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="withdrawals">
          <WithdrawalQueue />
        </TabsContent>

        <TabsContent value="config">
          <ConfigEditor />
        </TabsContent>
      </Tabs>
    </div>
  );
}
