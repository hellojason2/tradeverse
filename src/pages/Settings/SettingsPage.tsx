import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { initials } from '@/lib/utils';
import { User, Shield, Bell, Palette, Save, LogOut } from 'lucide-react';

export function SettingsPage() {
  const { user, logout } = useAuth();

  return (
    <div className="p-6 pb-16 animate-[pgIn_0.35s_ease-out]">
      <div className="mb-6">
        <h1 className="text-[26px] text-[#f5f7ff] font-serif leading-tight">Settings</h1>
        <p className="text-[13px] text-[#8892b0] mt-1">Manage your account preferences</p>
      </div>

      <Tabs defaultValue="profile" className="max-w-2xl">
        <TabsList className="bg-white/[0.03] border-white/[0.08] mb-6">
          <TabsTrigger value="profile" className="text-[12px] gap-1.5"><User className="w-3.5 h-3.5" />Profile</TabsTrigger>
          <TabsTrigger value="security" className="text-[12px] gap-1.5"><Shield className="w-3.5 h-3.5" />Security</TabsTrigger>
          <TabsTrigger value="notifications" className="text-[12px] gap-1.5"><Bell className="w-3.5 h-3.5" />Notifications</TabsTrigger>
          <TabsTrigger value="appearance" className="text-[12px] gap-1.5"><Palette className="w-3.5 h-3.5" />Appearance</TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <Card className="bg-[linear-gradient(180deg,rgba(14,20,44,0.55),rgba(8,12,28,0.55))] backdrop-blur-[20px] border-white/[0.08] rounded-[14px]">
            <CardHeader><CardTitle className="text-[18px] text-[#f5f7ff] font-serif">Profile Information</CardTitle></CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-xl bg-[linear-gradient(135deg,oklch(0.5_0.2_280),oklch(0.6_0.2_260))] flex items-center justify-center text-white text-xl font-mono font-bold">
                  {user ? initials(user.displayName) : '?'}
                </div>
                <div>
                  <div className="text-[15px] font-medium text-[#f5f7ff]">{user?.displayName ?? 'Unknown'}</div>
                  <div className="text-[12px] text-[#545d78] font-mono">{user?.email ?? ''}</div>
                  <Badge variant="outline" className="text-[9px] font-mono text-[#7aadff] border-[rgba(120,160,255,0.22)] mt-1">{user?.role ?? 'USER'}</Badge>
                </div>
              </div>
              <Separator className="bg-white/[0.06]" />
              <div className="grid grid-cols-2 gap-4">
                <div><Label className="text-[11px] font-mono uppercase tracking-[0.08em] text-[#8892b0]">Display Name</Label><Input defaultValue={user?.displayName ?? ''} className="bg-white/[0.03] border-white/[0.08] mt-1" /></div>
                <div><Label className="text-[11px] font-mono uppercase tracking-[0.08em] text-[#8892b0]">Email</Label><Input defaultValue={user?.email ?? ''} className="bg-white/[0.03] border-white/[0.08] mt-1" /></div>
              </div>
              <Button className="bg-[linear-gradient(180deg,oklch(0.7_0.2_255),oklch(0.52_0.22_262))] text-white border-0 hover:brightness-110">
                <Save className="w-4 h-4" /> Save Changes
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security">
          <Card className="bg-[linear-gradient(180deg,rgba(14,20,44,0.55),rgba(8,12,28,0.55))] backdrop-blur-[20px] border-white/[0.08] rounded-[14px]">
            <CardHeader><CardTitle className="text-[18px] text-[#f5f7ff] font-serif">Security Settings</CardTitle></CardHeader>
            <CardContent className="space-y-6">
              <div><Label className="text-[11px] font-mono uppercase tracking-[0.08em] text-[#8892b0]">Current Password</Label><Input type="password" className="bg-white/[0.03] border-white/[0.08] mt-1" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label className="text-[11px] font-mono uppercase tracking-[0.08em] text-[#8892b0]">New Password</Label><Input type="password" className="bg-white/[0.03] border-white/[0.08] mt-1" /></div>
                <div><Label className="text-[11px] font-mono uppercase tracking-[0.08em] text-[#8892b0]">Confirm Password</Label><Input type="password" className="bg-white/[0.03] border-white/[0.08] mt-1" /></div>
              </div>
              <Separator className="bg-white/[0.06]" />
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-[14px] font-medium text-[#f5f7ff]">Two-Factor Authentication</div>
                  <div className="text-[12px] text-[#8892b0]">Add an extra layer of security to your account</div>
                </div>
                <Badge className="bg-[rgba(255,209,102,0.14)] text-[#ffd166] border-[oklch(0.82_0.15_85/0.3)]">Not Enabled</Badge>
              </div>
              <Button className="bg-[linear-gradient(180deg,oklch(0.7_0.2_255),oklch(0.52_0.22_262))] text-white border-0 hover:brightness-110">
                <Shield className="w-4 h-4" /> Update Security
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications">
          <Card className="bg-[linear-gradient(180deg,rgba(14,20,44,0.55),rgba(8,12,28,0.55))] backdrop-blur-[20px] border-white/[0.08] rounded-[14px]">
            <CardHeader><CardTitle className="text-[18px] text-[#f5f7ff] font-serif">Notification Preferences</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {['Trade Executions', 'Strategy Updates', 'Copy Trade Alerts', 'Deposit/Withdrawal', 'Security Alerts', 'Marketing'].map((label) => (
                <div key={label} className="flex items-center justify-between py-2">
                  <div>
                    <div className="text-[13px] font-medium text-[#f5f7ff]">{label}</div>
                    <div className="text-[11px] text-[#545d78]">Receive notifications for {label.toLowerCase()}</div>
                  </div>
                  <Badge variant="outline" className="text-[10px] font-mono bg-[rgba(61,220,132,0.14)] text-[#3ddc84] border-[oklch(0.72_0.17_150/0.3)]">On</Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="appearance">
          <Card className="bg-[linear-gradient(180deg,rgba(14,20,44,0.55),rgba(8,12,28,0.55))] backdrop-blur-[20px] border-white/[0.08] rounded-[14px]">
            <CardHeader><CardTitle className="text-[18px] text-[#f5f7ff] font-serif">Appearance</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between py-2">
                <div>
                  <div className="text-[13px] font-medium text-[#f5f7ff]">Theme</div>
                  <div className="text-[11px] text-[#545d78]">Choose your preferred theme</div>
                </div>
                <Badge className="bg-[oklch(0.55_0.22_260/0.25)] text-[#7aadff] border-[rgba(120,160,255,0.22)]">Dark</Badge>
              </div>
              <div className="flex items-center justify-between py-2">
                <div>
                  <div className="text-[13px] font-medium text-[#f5f7ff]">Compact Sidebar</div>
                  <div className="text-[11px] text-[#545d78]">Minimize sidebar for more screen space</div>
                </div>
                <Badge variant="outline" className="text-[10px] font-mono text-[#8892b0] border-white/[0.14]">Off</Badge>
              </div>
            </CardContent>
          </Card>

          <div className="mt-6">
            <Button variant="outline" className="bg-[rgba(255,85,85,0.08)] text-[#ff5555] border-[oklch(0.68_0.22_20/0.3)] hover:bg-[rgba(255,85,85,0.14)]" onClick={logout}>
              <LogOut className="w-4 h-4" /> Sign Out
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
