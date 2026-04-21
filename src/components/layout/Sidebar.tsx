import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Brain,
  Users,
  Wallet,
  Bell,
  Settings,
  Shield,
  Crown,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUIStore } from '@/stores/ui-store';
import { useAuthStore } from '@/stores/auth-store';
import { initials } from '@/lib/utils';

const navSections = [
  {
    label: 'Main',
    items: [
      { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
      { to: '/strategies', icon: Brain, label: 'Strategies' },
      { to: '/copy-trading', icon: Users, label: 'Copy Trading' },
      { to: '/wallet', icon: Wallet, label: 'Wallet' },
    ],
  },
  {
    label: 'Account',
    items: [
      { to: '/notifications', icon: Bell, label: 'Notifications' },
      { to: '/settings', icon: Settings, label: 'Settings' },
    ],
  },
  {
    label: 'Premium',
    items: [
      { to: '/atlas-gold', icon: Crown, label: 'Atlas Gold' },
    ],
  },
];

export interface SidebarContentProps {
  onNavigate?: () => void;
  className?: string;
}

export function SidebarContent({ onNavigate, className }: SidebarContentProps) {
  const { sidebarCollapsed, toggleCollapsed } = useUIStore();
  const user = useAuthStore((s) => s.user);
  const location = useLocation();

  return (
    <div className={cn('flex flex-col h-full', className)}>
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 h-16 border-b border-white/[0.08]">
        <div className="w-[34px] h-[34px] rounded-[9px] bg-[linear-gradient(135deg,oklch(0.7_0.2_255),oklch(0.5_0.22_262))] border border-white/20 flex items-center justify-center text-white font-mono font-bold text-sm shrink-0">
          TV
        </div>
        {!sidebarCollapsed && (
          <span className="text-[20px] text-[#f5f7ff] font-serif tracking-tight whitespace-nowrap">
            Tradeverse
          </span>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-2">
        {navSections.map((section) => (
          <div key={section.label} className="mb-6">
            {!sidebarCollapsed && (
              <div className="px-3 mb-2 text-[9px] font-mono font-semibold uppercase tracking-[0.18em] text-[#545d78]">
                {section.label}
              </div>
            )}
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.to;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={onNavigate}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2 rounded-[9px] transition-all duration-[280ms] text-[13px] font-medium relative',
                      isActive
                        ? 'bg-[linear-gradient(90deg,oklch(0.55_0.22_260/0.22),oklch(0.55_0.22_260/0.05))] text-[#f5f7ff] shadow-[inset_0_0_0_1px_rgba(120,160,255,0.18)]'
                        : 'text-[#8892b0] hover:bg-white/[0.06] hover:text-[#f5f7ff]'
                    )}
                  >
                    {isActive && (
                      <div className="absolute left-0 w-[3px] h-6 rounded-r-full bg-[#7aadff]" />
                    )}
                    <Icon className="w-[18px] h-[18px] shrink-0" />
                    {!sidebarCollapsed && <span>{item.label}</span>}
                  </NavLink>
                );
              })}
            </div>
          </div>
        ))}

        {/* Admin link (conditional) */}
        {user?.role === 'ADMIN' && (
          <div className="mb-6">
            {!sidebarCollapsed && (
              <div className="px-3 mb-2 text-[9px] font-mono font-semibold uppercase tracking-[0.18em] text-[#545d78]">
                Admin
              </div>
            )}
            <NavLink
              to="/admin"
              onClick={onNavigate}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-[9px] transition-all duration-[280ms] text-[13px] font-medium relative',
                location.pathname === '/admin'
                  ? 'bg-[linear-gradient(90deg,oklch(0.55_0.22_260/0.22),oklch(0.55_0.22_260/0.05))] text-[#f5f7ff]'
                  : 'text-[#8892b0] hover:bg-white/[0.06] hover:text-[#f5f7ff]'
              )}
            >
              <Shield className="w-[18px] h-[18px] shrink-0" />
              {!sidebarCollapsed && <span>Admin</span>}
            </NavLink>
          </div>
        )}
      </nav>

      {/* User */}
      <div className="border-t border-white/[0.08] px-3 py-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[linear-gradient(135deg,oklch(0.5_0.2_280),oklch(0.6_0.2_260))] flex items-center justify-center text-white text-[10px] font-mono font-bold shrink-0">
            {user ? initials(user.displayName ?? '') : '?'}
          </div>
          {!sidebarCollapsed && user && (
            <div className="min-w-0">
              <div className="text-[12px] text-[#f5f7ff] font-medium truncate">{user.displayName}</div>
              <div className="text-[10px] text-[#545d78] font-mono uppercase tracking-wider">{user.role}</div>
            </div>
          )}
        </div>
      </div>

      {/* Toggle */}
      <button
        onClick={toggleCollapsed}
        className="absolute -right-3 top-20 w-6 h-6 rounded-full bg-[#0b1228] border border-white/[0.14] flex items-center justify-center text-[#8892b0] hover:text-[#7aadff] hover:border-[rgba(120,160,255,0.22)] transition-colors"
      >
        {sidebarCollapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
      </button>
    </div>
  );
}

export function Sidebar() {
  const { sidebarCollapsed } = useUIStore();

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 h-full z-[100] transition-all duration-[280ms]',
        'border-r border-white/[0.08]',
        'bg-[linear-gradient(180deg,rgba(10,15,30,0.85),rgba(6,10,24,0.85))]',
        'backdrop-blur-[24px]',
        sidebarCollapsed ? 'w-16' : 'w-60'
      )}
    >
      <SidebarContent />
    </aside>
  );
}
