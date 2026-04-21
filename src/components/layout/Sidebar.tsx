import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Wallet,
  Bell,
  Settings,
  Shield,
  ChevronLeft,
  ChevronRight,
  BarChart3,
  Activity,
  Zap,
  MessageCircle,
  ScrollText,
  Gift,
  TrendingUp,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUIStore } from '@/stores/ui-store';
import { useAuthStore } from '@/stores/auth-store';
import { initials } from '@/lib/utils';

/* ─── Client Nav ─── */
const clientSections = [
  {
    label: 'Dashboard',
    items: [
      { to: '/dashboard', icon: LayoutDashboard, label: 'Overview' },
      { to: '/portfolio', icon: BarChart3, label: 'Portfolio' },
    ],
  },
  {
    label: 'Trading',
    items: [
      { to: '/strategies', icon: Zap, label: 'Signal Plaza', badge: '12' },
      { to: '/copy-trading', icon: TrendingUp, label: 'Trade' },
      { to: '/atlas-gold', icon: Gift, label: 'Trail Mode' },
    ],
  },
  {
    label: 'Finance',
    items: [
      { to: '/wallet', icon: Wallet, label: 'Wallet' },
      { to: '/history', icon: ScrollText, label: 'History' },
    ],
  },
  {
    label: 'Engage',
    items: [
      { to: '/referral', icon: Users, label: 'Referrals' },
      { to: '/activities', icon: Activity, label: 'Activities' },
      { to: '/community', icon: MessageCircle, label: 'Community' },
    ],
  },
  {
    label: 'Account',
    items: [
      { to: '/notifications', icon: Bell, label: 'Notifications', badge: '3' },
      { to: '/settings', icon: Settings, label: 'Settings' },
    ],
  },
];

/* ─── Admin Nav ─── */
const adminSections = [
  {
    label: 'Main',
    items: [
      { to: '/admin', icon: LayoutDashboard, label: 'Dashboard' },
      { to: '/admin/analytics', icon: BarChart3, label: 'Analytics', badge: '3' },
    ],
  },
  {
    label: 'Management',
    items: [
      { to: '/admin/users', icon: Users, label: 'Users' },
      { to: '/admin/transactions', icon: Wallet, label: 'Transactions' },
      { to: '/admin/kyc', icon: Shield, label: 'KYC Review', badge: '5' },
    ],
  },
  {
    label: 'Settings',
    items: [
      { to: '/admin/settings', icon: Settings, label: 'Settings' },
      { to: '/admin/security', icon: Shield, label: 'Security' },
    ],
  },
];

export interface SidebarProps {
  onNavigate?: () => void;
  className?: string;
}

export function ClientSidebar({ onNavigate, className }: SidebarProps) {
  const { sidebarCollapsed, toggleCollapsed } = useUIStore();
  const user = useAuthStore((s) => s.user);
  const location = useLocation();

  return (
    <div className={cn('flex flex-col h-full relative', className)}>
      {/* Logo */}
      <div className="flex items-center gap-3 px-[18px] h-[60px] border-b border-line">
        <div className="w-[34px] h-[34px] rounded-[10px] bg-[linear-gradient(135deg,oklch(0.62_0.22_260),oklch(0.45_0.23_268))] border border-[oklch(0.45_0.23_268/0.4)] flex items-center justify-center text-white font-serif text-[18px] shrink-0"
          style={{ boxShadow: '0 6px 16px -4px oklch(0.5 0.22 262 / 0.4)' }}
        >
          TV
        </div>
        {!sidebarCollapsed && (
          <span className="text-[20px] text-ink-0 font-serif tracking-[0.01em] whitespace-nowrap transition-opacity duration-[280ms]">
            Tradeverse
          </span>
        )}
      </div>

      {/* Toggle */}
      <button
        onClick={toggleCollapsed}
        className="absolute -right-3 top-[22px] w-6 h-6 rounded-full bg-bg-1 border border-line-2 flex items-center justify-center text-ink-2 hover:text-blue-2 hover:border-blue transition-all duration-[280ms] z-5"
        style={{ boxShadow: '0 4px 12px -4px rgba(11,18,40,0.18)' }}
      >
        {sidebarCollapsed ? (
          <ChevronRight className="w-[11px] h-[11px]" />
        ) : (
          <ChevronLeft className="w-[11px] h-[11px]" />
        )}
      </button>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-[10px] px-2">
        {clientSections.map((section) => (
          <div key={section.label} className="mb-[6px]">
            {!sidebarCollapsed && (
              <div className="px-3 pt-[10px] pb-1 text-[9px] font-semibold uppercase tracking-[0.18em] text-ink-3 whitespace-nowrap transition-opacity duration-[280ms]">
                {section.label}
              </div>
            )}
            <div>
              {section.items.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.to;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={onNavigate}
                    className={cn(
                      'flex items-center gap-3 px-3 py-[9px] rounded-[9px] transition-all duration-[280ms] text-[13px] font-medium relative whitespace-nowrap my-[1px]',
                      isActive
                        ? 'bg-[linear-gradient(90deg,oklch(0.58_0.22_262/0.12),oklch(0.58_0.22_262/0.02))] text-blue-2'
                        : 'text-ink-2 hover:bg-[rgba(60,100,220,0.06)] hover:text-ink-0'
                    )}
                    style={isActive ? { boxShadow: 'inset 0 0 0 1px oklch(0.58 0.22 262 / 0.2)' } : undefined}
                  >
                    {isActive && (
                      <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-[3px] h-[18px] bg-blue rounded-r-[3px]"
                        style={{ boxShadow: '0 0 8px oklch(0.58 0.22 262 / 0.6)' }}
                      />
                    )}
                    <Icon className="w-[17px] h-[17px] shrink-0" strokeWidth={1.8} />
                    {!sidebarCollapsed && (
                      <span className="transition-opacity duration-[280ms] text-[13px]">{item.label}</span>
                    )}
                    {!sidebarCollapsed && item.badge && (
                      <span className="ml-auto bg-[linear-gradient(135deg,var(--blue),var(--blue-3))] text-white text-[9px] font-bold px-[6px] py-[2px] rounded-[8px] min-w-[18px] text-center font-mono">
                        {item.badge}
                      </span>
                    )}
                  </NavLink>
                );
              })}
            </div>
          </div>
        ))}

        {/* Admin link (conditional) */}
        {user?.role === 'ADMIN' && (
          <div className="mb-[6px]">
            {!sidebarCollapsed && (
              <div className="px-3 pt-[10px] pb-1 text-[9px] font-semibold uppercase tracking-[0.18em] text-ink-3 whitespace-nowrap transition-opacity duration-[280ms]">
                Admin
              </div>
            )}
            <NavLink
              to="/admin"
              onClick={onNavigate}
              className={cn(
                'flex items-center gap-3 px-3 py-[9px] rounded-[9px] transition-all duration-[280ms] text-[13px] font-medium relative whitespace-nowrap my-[1px]',
                location.pathname === '/admin'
                  ? 'bg-[linear-gradient(90deg,oklch(0.58_0.22_262/0.12),oklch(0.58_0.22_262/0.02))] text-blue-2'
                  : 'text-ink-2 hover:bg-[rgba(60,100,220,0.06)] hover:text-ink-0'
              )}
            >
              <Shield className="w-[17px] h-[17px] shrink-0" strokeWidth={1.8} />
              {!sidebarCollapsed && <span className="transition-opacity duration-[280ms] text-[13px]">Admin</span>}
            </NavLink>
          </div>
        )}
      </nav>

      {/* User */}
      <div className="border-t border-line px-3 py-3">
        <div className="flex items-center gap-[10px] p-2 rounded-[9px] hover:bg-[rgba(60,100,220,0.06)] transition-colors cursor-pointer">
          <div className="w-8 h-8 rounded-[9px] bg-[linear-gradient(135deg,oklch(0.7_0.18_300),oklch(0.55_0.22_262))] flex items-center justify-center text-white font-bold text-[12px] shrink-0">
            {user ? initials(user.displayName ?? '') : '?'}
          </div>
          {!sidebarCollapsed && user && (
            <div className="min-w-0 overflow-hidden transition-opacity duration-[280ms]">
              <div className="text-[12px] text-ink-0 font-semibold whitespace-nowrap">{user.displayName}</div>
              <div className="text-[10px] text-ink-3 whitespace-nowrap uppercase tracking-[0.05em] mt-[2px]">{user.role}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function AdminSidebar({ onNavigate, className }: SidebarProps) {
  const { sidebarCollapsed, toggleCollapsed } = useUIStore();
  const location = useLocation();

  return (
    <div className={cn('flex flex-col h-full', className)}>
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 h-16 border-b border-[var(--ad-border-color)]">
        <div className="w-8 h-8 rounded-[8px] bg-[linear-gradient(135deg,#0a72ef,#0a5ce0)] flex items-center justify-center text-white shrink-0">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M13 10V3a3 3 0 00-6 0v7M6 17v-7a3 3 0 016 0v7M3 10V3a3 3 0 016 0v7M16 10V3a3 3 0 015 0v7M6 6h12M6 18h12M10 3a3 3 0 015 0M8 21a3 3 0 016 0M3 3h18v18H3z" />
          </svg>
        </div>
        {!sidebarCollapsed && (
          <span className="text-[18px] font-semibold text-[var(--ad-text-primary)] tracking-tight whitespace-nowrap overflow-hidden transition-opacity duration-200">
            Admin Panel
          </span>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-3 px-3">
        {adminSections.map((section) => (
          <div key={section.label} className="mb-6">
            {!sidebarCollapsed && (
              <div className="px-3 mb-1 text-[11px] font-semibold uppercase tracking-[0.05em] text-[var(--ad-text-tertiary)] whitespace-nowrap overflow-hidden">
                {section.label}
              </div>
            )}
            <div>
              {section.items.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.to || (item.to !== '/admin' && location.pathname.startsWith(item.to));
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={onNavigate}
                    className={cn(
                      'flex items-center gap-3 px-3 py-[10px] rounded-[8px] transition-all duration-150 text-[13px] cursor-pointer relative mb-[2px]',
                      isActive
                        ? 'bg-[var(--ad-accent-secondary)] text-[var(--ad-accent-primary)] font-medium'
                        : 'text-[var(--ad-text-secondary)] hover:bg-[var(--ad-bg-tertiary)] hover:text-[var(--ad-text-primary)]'
                    )}
                  >
                    <Icon className="w-5 h-5 shrink-0" />
                    {!sidebarCollapsed && <span className="whitespace-nowrap overflow-hidden">{item.label}</span>}
                    {!sidebarCollapsed && item.badge && (
                      <span className="ml-auto bg-[var(--ad-danger)] text-white text-[11px] font-semibold px-[8px] py-[2px] rounded-full">
                        {item.badge}
                      </span>
                    )}
                  </NavLink>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Toggle */}
      <div className="px-5 py-3 border-t border-[var(--ad-border-color)] flex justify-end">
        <button
          onClick={toggleCollapsed}
          className="w-8 h-8 border border-[var(--ad-border-color)] bg-[var(--ad-bg-primary)] rounded-[8px] flex items-center justify-center text-[var(--ad-text-secondary)] hover:bg-[var(--ad-bg-tertiary)] transition-all"
        >
          {sidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}
