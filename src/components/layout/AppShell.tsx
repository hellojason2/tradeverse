import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Menu } from 'lucide-react';
import { SidebarContent } from './Sidebar';
import { useUIStore } from '@/stores/ui-store';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';

export function AppShell() {
  const sidebarCollapsed = useUIStore((s) => s.sidebarCollapsed);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex min-h-dvh bg-[#030611] text-[#f5f7ff]">
      {/* Desktop sidebar */}
      <aside
        className="hidden md:flex flex-col h-dvh shrink-0 transition-all duration-[280ms] border-r border-white/[0.08] bg-[linear-gradient(180deg,rgba(10,15,30,0.85),rgba(6,10,24,0.85))] backdrop-blur-[24px]"
        style={{ width: sidebarCollapsed ? 64 : 240 }}
      >
        <SidebarContent />
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile header */}
        <header className="md:hidden flex items-center justify-between px-4 h-16 border-b border-white/[0.08] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-[34px] h-[34px] rounded-[9px] bg-[linear-gradient(135deg,oklch(0.7_0.2_255),oklch(0.5_0.22_262))] border border-white/20 flex items-center justify-center text-white font-mono font-bold text-sm">
              TV
            </div>
            <span className="text-[18px] text-[#f5f7ff] font-serif tracking-tight">Tradeverse</span>
          </div>
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="bg-white/[0.03] text-[#8892b0] border-white/[0.08] hover:border-[rgba(120,160,255,0.22)] hover:text-[#f5f7ff]">
                <Menu className="w-5 h-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-60 p-0 border-r border-white/[0.08] bg-[linear-gradient(180deg,rgba(10,15,30,0.85),rgba(6,10,24,0.85))] backdrop-blur-[24px]">
              <SidebarContent onNavigate={() => setMobileOpen(false)} />
            </SheetContent>
          </Sheet>
        </header>

        <main className="flex-1 p-4 md:p-6 overflow-x-hidden">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
