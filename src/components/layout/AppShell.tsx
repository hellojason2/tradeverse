import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { useUIStore } from '@/stores/ui-store';

export function AppShell() {
  const sidebarCollapsed = useUIStore((s) => s.sidebarCollapsed);

  return (
    <div className="min-h-screen bg-[#030611] text-[#f5f7ff]">
      <Sidebar />
      <main
        className="transition-all duration-[280ms] min-h-screen"
        style={{ marginLeft: sidebarCollapsed ? 64 : 240 }}
      >
        <Outlet />
      </main>
    </div>
  );
}
