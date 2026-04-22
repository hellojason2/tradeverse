import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import './layout.css';

const PAGES: Record<string, string> = {
  overview: 'Overview',
  portfolio: 'Portfolio',
  signals: 'Signal Plaza',
  trading: 'Trade',
  trail: 'Trail Mode',
  wallet: 'Wallet',
  history: 'History',
  referral: 'Referrals',
  activities: 'Activities',
  community: 'Community',
  notifications: 'Notifications',
  settings: 'Settings',
};

function navClass({ isActive }: { isActive: boolean }) {
  return isActive ? 'nav-i act' : 'nav-i';
}

export function ClientLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  const segs = location.pathname.split('/').filter(Boolean);
  const pageKey = segs[0] === 'client' && segs[1] ? segs[1] : 'overview';
  const title = PAGES[pageKey] ?? 'Overview';

  // Close mobile drawer on route change.
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const sidebarClass = ['sidebar', collapsed ? 'c' : '', mobileOpen ? 'mo' : '']
    .filter(Boolean)
    .join(' ');

  return (
    <div className="client-shell shell">
      <div
        className={mobileOpen ? 'sb-backdrop on' : 'sb-backdrop'}
        onClick={() => setMobileOpen(false)}
        aria-hidden="true"
      />
      <aside className={sidebarClass}>
        <div className="sb-head">
          <div className="sb-logo">TV</div>
          <span className="sb-brand">Tradeverse</span>
        </div>
        <div className="sb-toggle" onClick={() => setCollapsed((v) => !v)}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
        </div>
        <nav className="sb-nav">
          <div className="nav-sec">
            <div className="nav-sec-t">Dashboard</div>
            {/* TODO(route): restore when overview page lands */}
            <NavLink end to="/client/overview" className={navClass} aria-disabled="true" onClick={(e) => e.preventDefault()}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /></svg>
              <span className="nav-i-t">Overview</span>
            </NavLink>
            {/* TODO(route): restore when portfolio page lands */}
            <NavLink end to="/client/portfolio" className={navClass} aria-disabled="true" onClick={(e) => e.preventDefault()}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" /></svg>
              <span className="nav-i-t">Portfolio</span>
            </NavLink>
          </div>
          <div className="nav-sec">
            <div className="nav-sec-t">Trading</div>
            <NavLink end to="/client/signals" className={navClass}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></svg>
              <span className="nav-i-t">Signal Plaza</span>
              <span className="nav-badge">12</span>
            </NavLink>
            {/* TODO(route): restore when trading page lands */}
            <NavLink end to="/client/trading" className={navClass} aria-disabled="true" onClick={(e) => e.preventDefault()}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>
              <span className="nav-i-t">Trade</span>
            </NavLink>
            {/* TODO(route): restore when trail page lands */}
            <NavLink end to="/client/trail" className={navClass} aria-disabled="true" onClick={(e) => e.preventDefault()}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
              <span className="nav-i-t">Trail Mode</span>
            </NavLink>
          </div>
          <div className="nav-sec">
            <div className="nav-sec-t">Finance</div>
            {/* TODO(route): restore when wallet page lands */}
            <NavLink end to="/client/wallet" className={navClass} aria-disabled="true" onClick={(e) => e.preventDefault()}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" /><line x1="1" y1="10" x2="23" y2="10" /></svg>
              <span className="nav-i-t">Wallet</span>
            </NavLink>
            {/* TODO(route): restore when history page lands */}
            <NavLink end to="/client/history" className={navClass} aria-disabled="true" onClick={(e) => e.preventDefault()}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
              <span className="nav-i-t">History</span>
            </NavLink>
          </div>
          <div className="nav-sec">
            <div className="nav-sec-t">Engage</div>
            {/* TODO(route): restore when referral page lands */}
            <NavLink end to="/client/referral" className={navClass} aria-disabled="true" onClick={(e) => e.preventDefault()}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
              <span className="nav-i-t">Referrals</span>
            </NavLink>
            {/* TODO(route): restore when activities page lands */}
            <NavLink end to="/client/activities" className={navClass} aria-disabled="true" onClick={(e) => e.preventDefault()}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
              <span className="nav-i-t">Activities</span>
            </NavLink>
            {/* TODO(route): restore when community page lands */}
            <NavLink end to="/client/community" className={navClass} aria-disabled="true" onClick={(e) => e.preventDefault()}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
              <span className="nav-i-t">Community</span>
            </NavLink>
          </div>
          <div className="nav-sec">
            <div className="nav-sec-t">Account</div>
            {/* TODO(route): restore when client notifications page lands */}
            <NavLink end to="/client/notifications" className={navClass} aria-disabled="true" onClick={(e) => e.preventDefault()}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" /></svg>
              <span className="nav-i-t">Notifications</span>
              <span className="nav-badge">3</span>
            </NavLink>
            {/* TODO(route): restore when client settings page lands */}
            <NavLink end to="/client/settings" className={navClass} aria-disabled="true" onClick={(e) => e.preventDefault()}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9c.26.604.852.997 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" /></svg>
              <span className="nav-i-t">Settings</span>
            </NavLink>
          </div>
        </nav>
        <div className="sb-foot">
          <div className="sb-user">
            <div className="sb-u-av">JD</div>
            <div className="sb-u-info">
              <div className="sb-u-nm">John Doe</div>
              <div className="sb-u-rl">Premium</div>
            </div>
          </div>
        </div>
      </aside>

      <div className="main">
        <header className="topbar">
          <div className="tb-left">
            <button
              className="tb-menu-btn"
              onClick={() => setMobileOpen((v) => !v)}
              aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
              aria-expanded={mobileOpen}
              type="button"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                {mobileOpen ? (
                  <>
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </>
                ) : (
                  <>
                    <line x1="3" y1="6" x2="21" y2="6" />
                    <line x1="3" y1="12" x2="21" y2="12" />
                    <line x1="3" y1="18" x2="21" y2="18" />
                  </>
                )}
              </svg>
            </button>
            <div>
              <div className="tb-title">{title}</div>
              <div className="tb-bread">Portal / <span>{title}</span></div>
            </div>
          </div>
          <div className="tb-right">
            <div className="tb-search">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
              <input placeholder="Search markets, signals, orders..." />
              <kbd>⌘K</kbd>
            </div>
            <div className="tb-btn">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" /></svg>
              <span className="dot"></span>
            </div>
            <div className="tb-btn">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9c.26.604.852.997 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" /></svg>
            </div>
          </div>
        </header>
        <div className="content">
          <Outlet />
        </div>
      </div>
    </div>
  );
}

export default ClientLayout;
