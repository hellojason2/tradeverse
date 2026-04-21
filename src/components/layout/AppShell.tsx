import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Menu } from 'lucide-react';
import { ClientSidebar, AdminSidebar } from './Sidebar';
import { ClientTopbar, AdminTopbar } from './Topbar';
import { useUIStore } from '@/stores/ui-store';
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';

export function AppShell() {
  const location = useLocation();
  const isAdmin = location.pathname.startsWith('/admin');
  const sidebarCollapsed = useUIStore((s) => s.sidebarCollapsed);
  const [mobileOpen, setMobileOpen] = useState(false);

  const sidebarWidth = sidebarCollapsed ? (isAdmin ? 72 : 64) : (isAdmin ? 260 : 240);

  return (
    <div className="flex min-h-dvh bg-bg-0 text-ink-0">
      {/* Desktop sidebar */}
      <aside
        className="hidden md:flex flex-col h-dvh shrink-0 transition-all duration-[280ms]"
        style={{
          width: sidebarWidth,
          ...(isAdmin
            ? {
                background: 'var(--ad-bg-primary)',
                borderRight: '1px solid var(--ad-border-color)',
              }
            : {
                background: 'linear-gradient(180deg, rgba(255,255,255,0.92), rgba(244,247,253,0.92))',
                borderRight: '1px solid var(--line)',
                backdropFilter: 'blur(24px)',
              }),
        }}
      >
        {isAdmin ? <AdminSidebar /> : <ClientSidebar />}
      </aside>

      {/* Content area — no margin-left; flexbox places it adjacent to sidebar */}
      <div className="flex-1 flex flex-col min-w-0 transition-all duration-[280ms]">
        {/* Mobile header */}
        <header
          className="md:hidden flex items-center justify-between px-4 h-[60px] shrink-0"
          style={{
            borderBottom: '1px solid var(--line)',
            background: isAdmin ? 'var(--ad-bg-primary)' : 'var(--bg-1)',
          }}
        >
          <div className="flex items-center gap-3">
            {isAdmin ? (
              <>
                <div className="w-8 h-8 rounded-[8px] bg-[linear-gradient(135deg,#0a72ef,#0a5ce0)] flex items-center justify-center text-white font-bold text-sm">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M13 10V3a3 3 0 00-6 0v7M6 17v-7a3 3 0 016 0v7M3 10V3a3 3 0 016 0v7M16 10V3a3 3 0 015 0v7M6 6h12M6 18h12M10 3a3 3 0 015 0M8 21a3 3 0 016 0M3 3h18v18H3z"/></svg>
                </div>
                <span className="text-[18px] font-semibold text-[var(--ad-text-primary)] tracking-tight">Admin</span>
              </>
            ) : (
              <>
                <div className="w-[34px] h-[34px] rounded-[10px] bg-[linear-gradient(135deg,oklch(0.62_0.22_260),oklch(0.45_0.23_268))] border border-[oklch(0.45_0.23_268/0.4)] flex items-center justify-center text-white font-serif text-[18px]">
                  TV
                </div>
                <span className="text-[20px] text-ink-0 font-serif tracking-tight">Tradeverse</span>
              </>
            )}
          </div>
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="bg-transparent text-ink-2 border-line hover:border-line-3 hover:text-ink-0">
                <Menu className="w-5 h-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-60 p-0 border-r border-line" style={{ background: isAdmin ? 'var(--ad-bg-primary)' : 'linear-gradient(180deg, rgba(255,255,255,0.92), rgba(244,247,253,0.92))' }}>
              <SheetTitle className="sr-only">Navigation</SheetTitle>
              {isAdmin ? (
                <AdminSidebar onNavigate={() => setMobileOpen(false)} />
              ) : (
                <ClientSidebar onNavigate={() => setMobileOpen(false)} />
              )}
            </SheetContent>
          </Sheet>
        </header>

        {/* Topbar */}
        <div className="hidden md:block">
          {isAdmin ? <AdminTopbar /> : <ClientTopbar />}
        </div>

        <main className="flex-1 overflow-x-hidden" style={{ padding: isAdmin ? '24px' : '24px 28px 60px' }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
