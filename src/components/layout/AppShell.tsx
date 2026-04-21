import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Menu } from 'lucide-react';
import { ClientSidebar, AdminSidebar } from './Sidebar';
import { ClientTopbar, AdminTopbar } from './Topbar';
import { useUIStore } from '@/stores/ui-store';
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';

const clientPageTitles: Record<string, string> = {
  '/dashboard': 'Overview',
  '/portfolio': 'My Portfolio',
  '/strategies': 'Signal Plaza',
  '/copy-trading': 'Trade',
  '/atlas-gold': 'Trail Mode',
  '/wallet': 'Wallet',
  '/history': 'History',
  '/referral': 'Referrals',
  '/activities': 'Activities',
  '/community': 'Community',
  '/notifications': 'Notifications',
  '/settings': 'Settings',
};

export function AppShell() {
  const location = useLocation();
  const isAdmin = location.pathname.startsWith('/admin');
  const sidebarCollapsed = useUIStore((s) => s.sidebarCollapsed);
  const [mobileOpen, setMobileOpen] = useState(false);

  const sidebarWidth = sidebarCollapsed ? (isAdmin ? 72 : 64) : (isAdmin ? 260 : 240);

  if (isAdmin) {
    return (
      <div className="flex min-h-dvh bg-bg-0 text-ink-0">
        {/* Desktop sidebar */}
        <aside
          className="hidden md:flex flex-col h-dvh shrink-0 transition-all duration-[280ms]"
          style={{
            width: sidebarWidth,
            background: 'var(--ad-bg-primary)',
            borderRight: '1px solid var(--ad-border-color)',
          }}
        >
          <AdminSidebar />
        </aside>

        {/* Content area */}
        <div className="flex-1 flex flex-col min-w-0 transition-all duration-[280ms]">
          {/* Mobile header */}
          <header
            className="md:hidden flex items-center justify-between px-4 h-[60px] shrink-0"
            style={{
              borderBottom: '1px solid var(--ad-border-color)',
              background: 'var(--ad-bg-primary)',
            }}
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-[8px] bg-[linear-gradient(135deg,#0a72ef,#0a5ce0)] flex items-center justify-center text-white font-bold text-sm">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M13 10V3a3 3 0 00-6 0v7M6 17v-7a3 3 0 016 0v7M3 10V3a3 3 0 016 0v7M16 10V3a3 3 0 015 0v7M6 6h12M6 18h12M10 3a3 3 0 015 0M8 21a3 3 0 016 0M3 3h18v18H3z" />
                </svg>
              </div>
              <span className="text-[18px] font-semibold text-[var(--ad-text-primary)] tracking-tight">Admin</span>
            </div>
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon" className="bg-transparent text-[var(--ad-text-secondary)] border-[var(--ad-border-color)] hover:border-[var(--ad-border-hover)] hover:text-[var(--ad-text-primary)]">
                  <Menu className="w-5 h-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-60 p-0 border-r border-[var(--ad-border-color)]" style={{ background: 'var(--ad-bg-primary)' }}>
                <SheetTitle className="sr-only">Navigation</SheetTitle>
                <AdminSidebar onNavigate={() => setMobileOpen(false)} />
              </SheetContent>
            </Sheet>
          </header>

          {/* Topbar */}
          <div className="hidden md:block">
            <AdminTopbar />
          </div>

          <main className="flex-1 overflow-x-hidden" style={{ padding: '24px' }}>
            <Outlet />
          </main>
        </div>
      </div>
    );
  }

  const pageTitle = clientPageTitles[location.pathname] || 'Overview';

  return (
    <>
      {/* Desktop sidebar */}
      <ClientSidebar />

      {/* Main column */}
      <div className="main">
        {/* Mobile header */}
        <header className="md:hidden flex items-center justify-between px-4 h-[56px] border-b border-[var(--border)]"
          style={{ background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(20px)' }}
        >
          <div className="text-[14px] font-semibold text-[var(--txt)]">{pageTitle}</div>
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="bg-transparent text-[var(--txt2)] border-[var(--border)] hover:border-[var(--border2)] hover:text-[var(--txt)]"
              >
                <Menu className="w-5 h-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[250px] p-0 border-r border-[var(--border)]" style={{ background: '#fff' }}>
              <SheetTitle className="sr-only">Navigation</SheetTitle>
              <ClientSidebar onNavigate={() => setMobileOpen(false)} className="!relative !transform-none !w-full" />
            </SheetContent>
          </Sheet>
        </header>

        {/* Topbar */}
        <div className="hidden md:block">
          <ClientTopbar />
        </div>

        {/* Content */}
        <div className="content">
          <Outlet />
        </div>
      </div>
    </>
  );
}
