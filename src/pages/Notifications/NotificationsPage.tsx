import { useNotifications, useMarkNotificationRead, useMarkAllNotificationsRead } from '@/hooks/useNotifications';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { CheckCheck, AlertTriangle, TrendingUp, Wallet, Copy, Shield, Bell, Gift } from 'lucide-react';
import type { Notification, NotificationCategory } from '@contracts/routes';

function categoryIcon(category: NotificationCategory) {
  switch (category) {
    case 'TRADE': return <TrendingUp className="w-4 h-4 text-[#3ddc84]" />;
    case 'WALLET': return <Wallet className="w-4 h-4 text-[#4f8eff]" />;
    case 'COPY_RELATION': return <Copy className="w-4 h-4 text-[#7ee8ff]" />;
    case 'STRATEGY': return <AlertTriangle className="w-4 h-4 text-[#ffd166]" />;
    case 'SECURITY': return <Shield className="w-4 h-4 text-[#ff5555]" />;
    case 'REWARD': return <Gift className="w-4 h-4 text-[#c77dff]" />;
    default: return <Bell className="w-4 h-4 text-[#4f8eff]" />;
  }
}

function categoryBg(category: NotificationCategory) {
  switch (category) {
    case 'TRADE': return 'bg-[rgba(61,220,132,0.14)]';
    case 'WALLET': return 'bg-[rgba(79,142,255,0.14)]';
    case 'COPY_RELATION': return 'bg-[rgba(126,232,255,0.14)]';
    case 'STRATEGY': return 'bg-[rgba(255,209,102,0.14)]';
    case 'SECURITY': return 'bg-[rgba(255,85,85,0.14)]';
    case 'REWARD': return 'bg-[rgba(199,125,255,0.14)]';
    default: return 'bg-[rgba(79,142,255,0.14)]';
  }
}

export function NotificationsPage() {
  const { data, isLoading } = useNotifications();
  const markRead = useMarkNotificationRead();
  const markAll = useMarkAllNotificationsRead();

  const notifications = ((data as { data?: { items?: Notification[] } } | undefined)?.data?.items) ?? [];
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="p-6 pb-16 animate-[pgIn_0.35s_ease-out]">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-[26px] text-[#f5f7ff] font-serif leading-tight">Notifications</h1>
          <p className="text-[13px] text-[#8892b0] mt-1">Stay updated with your trading activity</p>
        </div>
        <Button variant="outline" className="bg-white/[0.02] text-[#c9d1e8] border-white/[0.14] hover:border-[rgba(120,160,255,0.22)]" onClick={() => markAll.mutate()}>
          <CheckCheck className="w-4 h-4" /> Mark all read
        </Button>
      </div>

      {unreadCount > 0 && (
        <div className="mb-4">
          <Badge className="bg-[oklch(0.55_0.22_260/0.25)] text-[#7aadff] border-[rgba(120,160,255,0.22)]">
            {unreadCount} unread
          </Badge>
        </div>
      )}

      <Card className="bg-[linear-gradient(180deg,rgba(14,20,44,0.55),rgba(8,12,28,0.55))] backdrop-blur-[20px] border-white/[0.08] rounded-[14px]">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="divide-y divide-white/[0.04]">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 p-4"><Skeleton className="w-9 h-9 rounded-full" /><div className="flex-1"><Skeleton className="h-4 w-48 mb-1" /><Skeleton className="h-3 w-72" /></div></div>
              ))}
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Bell className="w-8 h-8 text-[#545d78] mb-3" />
              <p className="text-[13px] text-[#8892b0]">No notifications yet</p>
            </div>
          ) : (
            <div className="divide-y divide-white/[0.04]">
              {notifications.map((notif) => (
                <div
                  key={notif.id}
                  className={cn(
                    'flex items-start gap-4 p-4 transition-colors hover:bg-white/[0.02] cursor-pointer',
                    !notif.isRead && 'bg-white/[0.02]'
                  )}
                  onClick={() => {
                    if (!notif.isRead) markRead.mutate(notif.id);
                  }}
                >
                  <div className={cn('w-9 h-9 rounded-full flex items-center justify-center shrink-0 mt-0.5', categoryBg(notif.category))}>
                    {categoryIcon(notif.category)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className={cn('text-[13px] font-medium', notif.isRead ? 'text-[#8892b0]' : 'text-[#f5f7ff]')}>
                        {notif.title}
                      </span>
                      {!notif.isRead && <div className="w-1.5 h-1.5 rounded-full bg-[#4f8eff]" />}
                    </div>
                    <p className={cn('text-[12px] leading-relaxed', notif.isRead ? 'text-[#545d78]' : 'text-[#8892b0]')}>
                      {notif.body}
                    </p>
                    <div className="text-[10px] font-mono text-[#3e4663] mt-1.5">
                      {new Date(notif.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </div>
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
