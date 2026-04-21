import { useLocation } from 'react-router-dom';
import { Search, Bell, Settings, Sun, Moon } from 'lucide-react';
import { useUIStore } from '@/stores/ui-store';
import { useAuthStore } from '@/stores/auth-store';
import { initials } from '@/lib/utils';

const clientPageTitles: Record<string, string> = {
  '/': 'Overview',
  '/portfolio': 'Portfolio',
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

export function ClientTopbar() {
  const location = useLocation();
  const theme = useUIStore((s) => s.theme);
  const setTheme = useUIStore((s) => s.setTheme);
  const pageTitle = clientPageTitles[location.pathname] || 'Overview';

  return (
    <header
      className="sticky top-0 h-[60px] z-[100] flex items-center justify-between px-7"
      style={{
        background: 'rgba(255,255,255,0.82)',
        backdropFilter: 'blur(24px)',
        borderBottom: '1px solid var(--line)',
      }}
    >
      <div className="flex items-center gap-3">
        <div>
          <div className="font-serif text-[22px] leading-none tracking-[-0.01em] text-ink-0">
            {pageTitle}
          </div>
          <div className="text-[11px] text-ink-3 uppercase tracking-[0.08em] font-mono mt-[3px]">
            Portal / <span className="text-ink-2">{pageTitle}</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {/* Search */}
        <div
          className="hidden md:flex items-center gap-2 bg-bg-1 border border-line rounded-[9px] px-3 py-[7px] w-[260px] transition-all duration-[280ms]"
          style={{
            borderColor: 'var(--line)',
          }}
          onFocus={(e) => {
            const target = e.currentTarget;
            target.style.borderColor = 'var(--line-3)';
            target.style.boxShadow = '0 0 0 3px oklch(0.58 0.22 262 / 0.12)';
          }}
          onBlur={(e) => {
            const target = e.currentTarget;
            target.style.borderColor = 'var(--line)';
            target.style.boxShadow = 'none';
          }}
        >
          <Search className="w-[14px] h-[14px] text-ink-3" />
          <input
            placeholder="Search markets, signals, orders..."
            className="bg-transparent border-none outline-none text-ink-0 text-[12px] w-full font-sans placeholder:text-ink-3"
          />
          <kbd className="text-[10px] px-[6px] py-[1px] bg-bg-2 border border-line-2 rounded text-ink-2 font-mono">
            ⌘K
          </kbd>
        </div>

        {/* Theme Toggle */}
        <button
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="w-9 h-9 rounded-[9px] bg-bg-1 border border-line flex items-center justify-center text-ink-2 hover:text-blue-2 hover:border-line-3 hover:bg-[oklch(0.95_0.04_260)] transition-all duration-[280ms] relative"
        >
          {theme === 'dark' ? <Moon className="w-[15px] h-[15px]" /> : <Sun className="w-[15px] h-[15px]" />}
        </button>

        {/* Notifications */}
        <button
          className="w-9 h-9 rounded-[9px] bg-bg-1 border border-line flex items-center justify-center text-ink-2 hover:text-blue-2 hover:border-line-3 hover:bg-[oklch(0.95_0.04_260)] transition-all duration-[280ms] relative"
        >
          <Bell className="w-[15px] h-[15px]" />
          <span className="absolute top-[6px] right-[6px] w-[7px] h-[7px] bg-blue rounded-full border-2 border-bg-1" style={{ boxShadow: '0 0 6px var(--blue)' }} />
        </button>

        {/* Settings */}
        <button
          className="w-9 h-9 rounded-[9px] bg-bg-1 border border-line flex items-center justify-center text-ink-2 hover:text-blue-2 hover:border-line-3 hover:bg-[oklch(0.95_0.04_260)] transition-all duration-[280ms]"
        >
          <Settings className="w-[15px] h-[15px]" />
        </button>
      </div>
    </header>
  );
}

const adminPageTitles: Record<string, string> = {
  '/admin': 'Dashboard Overview',
  '/admin/analytics': 'Analytics',
  '/admin/users': 'User Management',
  '/admin/transactions': 'Transactions',
  '/admin/kyc': 'KYC Review',
  '/admin/settings': 'Settings',
  '/admin/security': 'Security',
};

export function AdminTopbar() {
  const location = useLocation();
  const theme = useUIStore((s) => s.theme);
  const setTheme = useUIStore((s) => s.setTheme);
  const user = useAuthStore((s) => s.user);
  const pageTitle = adminPageTitles[location.pathname] || 'Dashboard Overview';

  return (
    <header
      className="sticky top-0 h-16 z-[50] flex items-center justify-between px-6"
      style={{
        background: 'var(--ad-bg-primary)',
        borderBottom: '1px solid var(--ad-border-color)',
      }}
    >
      <div className="flex items-center gap-4">
        <h1 className="text-[18px] font-semibold text-[var(--ad-text-primary)] tracking-tight">
          {pageTitle}
        </h1>
        <div
          className="hidden md:flex items-center gap-2 bg-[var(--ad-bg-tertiary)] border border-[var(--ad-border-color)] rounded-[8px] px-3 py-2 w-[280px] transition-all duration-150"
          onFocus={(e) => {
            const target = e.currentTarget;
            target.style.borderColor = 'var(--ad-accent-primary)';
            target.style.boxShadow = '0 0 0 3px var(--ad-accent-secondary)';
          }}
          onBlur={(e) => {
            const target = e.currentTarget;
            target.style.borderColor = 'var(--ad-border-color)';
            target.style.boxShadow = 'none';
          }}
        >
          <Search className="w-4 h-4 text-[var(--ad-text-tertiary)]" />
          <input
            placeholder="Search users, transactions..."
            className="bg-transparent border-none outline-none text-[var(--ad-text-primary)] text-sm w-full font-sans placeholder:text-[var(--ad-text-tertiary)]"
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Theme Toggle */}
        <button
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="w-10 h-10 border border-[var(--ad-border-color)] bg-[var(--ad-bg-primary)] rounded-[8px] flex items-center justify-center text-[var(--ad-text-secondary)] hover:bg-[var(--ad-bg-tertiary)] transition-all"
        >
          {theme === 'dark' ? <Moon className="w-[18px] h-[18px]" /> : <Sun className="w-[18px] h-[18px]" />}
        </button>

        {/* Notifications */}
        <button className="w-10 h-10 border border-[var(--ad-border-color)] bg-[var(--ad-bg-primary)] rounded-[8px] flex items-center justify-center text-[var(--ad-text-secondary)] hover:bg-[var(--ad-bg-tertiary)] transition-all relative">
          <Bell className="w-[18px] h-[18px]" />
          <span className="absolute -top-1 -right-1 w-[18px] h-[18px] bg-[var(--ad-danger)] text-white text-[10px] font-semibold rounded-full flex items-center justify-center">
            3
          </span>
        </button>

        {/* User Avatar */}
        <div className="w-9 h-9 rounded-full bg-[linear-gradient(135deg,#0a72ef,#0a5ce0)] flex items-center justify-center text-white font-semibold text-sm cursor-pointer">
          {user ? initials(user.displayName ?? '') : 'AD'}
        </div>
      </div>
    </header>
  );
}
