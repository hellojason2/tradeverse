import { useLocation } from 'react-router-dom';
import { Search, Bell, Sun, Moon } from 'lucide-react';
import { useUIStore } from '@/stores/ui-store';
import { useAuthStore } from '@/stores/auth-store';
import { initials } from '@/lib/utils';

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

export function ClientTopbar() {
  const location = useLocation();
  const pageTitle = clientPageTitles[location.pathname] || 'Overview';

  return (
    <header className="topbar">
      <div className="tb-left">
        <div>
          <div className="tb-title">{pageTitle}</div>
          <div className="tb-bread">
            Portal / <span>{pageTitle}</span>
          </div>
        </div>
      </div>

      <div className="tb-right">
        <div className="tb-search">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input placeholder="Search..." />
          <kbd>⌘K</kbd>
        </div>

        <div className="tb-btn">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
          <span className="dot"></span>
        </div>

        <div className="tb-btn">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9c.26.604.852.997 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
        </div>
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
      className="sticky top-0 h-16 z-[50] flex items-center justify-between px-6 gap-4"
      style={{
        background: 'var(--ad-bg-primary)',
        borderBottom: '1px solid var(--ad-border-color)',
      }}
    >
      <div className="flex items-center gap-4 min-w-0">
        <h1 className="text-[18px] font-semibold text-[var(--ad-text-primary)] tracking-tight truncate">
          {pageTitle}
        </h1>
        <div
          className="hidden md:flex items-center gap-2 bg-[var(--ad-bg-tertiary)] border border-[var(--ad-border-color)] rounded-[8px] px-3 py-2 w-[280px] flex-shrink-0 transition-all duration-150"
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
          <Search className="w-4 h-4 text-[var(--ad-text-tertiary)] flex-shrink-0" />
          <input
            placeholder="Search users, transactions..."
            className="bg-transparent border-none outline-none text-[var(--ad-text-primary)] text-sm w-full font-sans placeholder:text-[var(--ad-text-tertiary)]"
          />
        </div>
      </div>

      <div className="flex items-center gap-3 flex-shrink-0">
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
