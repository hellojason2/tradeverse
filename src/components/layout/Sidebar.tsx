import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Wallet,
  Settings,
  Shield,
  ChevronLeft,
  ChevronRight,
  BarChart3,
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
      {
        to: '/dashboard',
        label: 'Overview',
        icon: (
          <>
            <rect x="3" y="3" width="7" height="7" />
            <rect x="14" y="3" width="7" height="7" />
            <rect x="14" y="14" width="7" height="7" />
            <rect x="3" y="14" width="7" height="7" />
          </>
        ),
      },
      {
        to: '/portfolio',
        label: 'My Portfolio',
        icon: (
          <>
            <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
            <polyline points="17 6 23 6 23 12" />
          </>
        ),
      },
    ],
  },
  {
    label: 'Trading',
    items: [
      {
        to: '/client/signals',
        label: 'Signal Plaza',
        badge: '12',
        icon: <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />,
      },
      {
        to: '/copy-trading',
        label: 'Trade',
        icon: (
          <>
            <line x1="12" y1="1" x2="12" y2="23" />
            <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
          </>
        ),
      },
      {
        to: '/atlas-gold',
        label: 'Trail Mode',
        icon: (
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        ),
      },
    ],
  },
  {
    label: 'Finance',
    items: [
      {
        to: '/wallet',
        label: 'Wallet',
        icon: (
          <>
            <rect x="1" y="4" width="22" height="16" rx="2" />
            <line x1="1" y1="10" x2="23" y2="10" />
          </>
        ),
      },
      {
        to: '/history',
        label: 'History',
        icon: (
          <>
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </>
        ),
      },
    ],
  },
  {
    label: 'Engage',
    items: [
      {
        to: '/referrals',
        label: 'Referrals',
        icon: (
          <>
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </>
        ),
      },
      {
        to: '/activities',
        label: 'Activities',
        icon: (
          <>
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </>
        ),
      },
      {
        to: '/community',
        label: 'Community',
        icon: <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />,
      },
    ],
  },
  {
    label: 'Account',
    items: [
      {
        to: '/notifications',
        label: 'Notifications',
        badge: '3',
        icon: (
          <>
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </>
        ),
      },
      {
        to: '/settings',
        label: 'Settings',
        icon: (
          <>
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9c.26.604.852.997 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </>
        ),
      },
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

  return (
    <aside className={cn('sidebar', sidebarCollapsed && 'c', className)}>
      <div className="sb-head">
        <div className="sb-logo">TV</div>
        <span className="sb-brand">Tradeverse</span>
      </div>

      <div className="sb-toggle" onClick={toggleCollapsed} role="button" tabIndex={0}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="15 18 9 12 15 6" />
        </svg>
      </div>

      <nav className="sb-nav">
        {clientSections.map((section) => (
          <div className="nav-sec" key={section.label}>
            <div className="nav-sec-t">{section.label}</div>
            <div>
              {section.items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={onNavigate}
                  end
                  className={({ isActive }) => cn('nav-i', isActive && 'act')}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    {item.icon}
                  </svg>
                  <span className="nav-i-t">{item.label}</span>
                  {item.badge && <span className="nav-badge">{item.badge}</span>}
                </NavLink>
              ))}
            </div>
          </div>
        ))}

        {/* Admin link (conditional) */}
        {user?.role === 'ADMIN' && (
          <div className="nav-sec">
            <div className="nav-sec-t">Admin</div>
            <NavLink
              to="/admin"
              onClick={onNavigate}
              className={({ isActive }) => cn('nav-i', isActive && 'act')}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
              <span className="nav-i-t">Admin</span>
            </NavLink>
          </div>
        )}
      </nav>

      <div className="sb-foot">
        <div className="sb-user">
          <div className="sb-u-av">{user ? initials(user.displayName ?? '') : '?'}</div>
          <div className="sb-u-info">
            <div className="sb-u-nm">{user?.displayName ?? 'John Doe'}</div>
            <div className="sb-u-rl">{user?.role ?? 'Premium Member'}</div>
          </div>
        </div>
      </div>
    </aside>
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
