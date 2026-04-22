import { useEffect, useMemo, useRef, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useAuth } from '@/hooks/useAuth';
import { LanguageSwitcher } from '@/components/layout/LanguageSwitcher';
import { ThemeToggle } from '@/components/layout/ThemeToggle';
import { formatCurrency, formatPercent } from '@/lib/format';

export function DashboardPage() {
  useDocumentTitle('Overview');
  const { t } = useTranslation('dashboard');
  const { user } = useAuth();
  const displayName = user?.displayName?.split(' ')[0] ?? 'Alex';
  const initials = user?.displayName
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2) ?? 'JD';

  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Force light theme for ported overview layout
  useEffect(() => {
    const prev = document.documentElement.getAttribute('data-theme');
    document.documentElement.setAttribute('data-theme', 'light');
    document.body.style.background = 'var(--bg-0)';
    document.body.style.color = 'var(--ink-0)';
    return () => {
      // Restore previous theme on unmount
      if (prev) {
        document.documentElement.setAttribute('data-theme', prev);
      }
      document.body.style.background = '';
      document.body.style.color = '';
    };
  }, []);

  // Animated stream canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const cvs = canvas;
    const c = ctx;
    const DPR = Math.min(window.devicePixelRatio || 1, 2);
    let W = 0;
    let H = 0;
    let raf = 0;

    function resize() {
      const parent = cvs.parentElement;
      if (!parent) return;
      const r = parent.getBoundingClientRect();
      W = r.width;
      H = r.height;
      cvs.width = W * DPR;
      cvs.height = H * DPR;
      cvs.style.width = W + 'px';
      cvs.style.height = H + 'px';
      c.setTransform(DPR, 0, 0, DPR, 0, 0);
    }

    const particles: {
      u: number;
      progress: number;
      speed: number;
      size: number;
      flicker: number;
    }[] = [];
    function newP(life: number) {
      return {
        u: Math.random() * 2 - 1,
        progress: life,
        speed: 0.15 + Math.random() * 0.45,
        size: 0.5 + Math.random() * 1.4,
        flicker: Math.random() * Math.PI * 2,
      };
    }
    function spawn() {
      particles.length = 0;
      for (let i = 0; i < 120; i++) particles.push(newP(Math.random()));
    }

    function frame(t: number) {
      c.clearRect(0, 0, W, H);
      const vpY = H * 0.45;
      const zoneStart = W * 0.48;
      const zoneEnd = W * 1.02;
      const zoneSpan = zoneEnd - zoneStart;

      for (let i = 0; i < 35; i++) {
        const x = zoneStart + ((i * 97.3) % zoneSpan);
        const y = (i * 53.7) % H;
        const a = 0.2 + 0.4 * Math.sin(t * 0.002 + i);
        c.fillStyle = 'rgba(200,220,255,' + a * 0.3 + ')';
        c.fillRect(x, y, 1, 1);
      }

      c.save();
      c.beginPath();
      c.rect(zoneStart, 0, W - zoneStart, H);
      c.clip();

      for (let i = 0; i < 12; i++) {
        const phase = (i / 12 + t * 0.00018) % 1;
        const eased = Math.pow(phase, 2.0);
        const x = zoneStart + (1 - eased) * zoneSpan * 0.9;
        const spread = (1 - eased) * H * 0.55;
        const alpha = 0.22 * Math.min(1, (1 - eased) * 2) * eased;
        c.strokeStyle = 'oklch(0.78 0.16 255 / ' + alpha + ')';
        c.lineWidth = 1 + (1 - eased) * 1.2;
        c.beginPath();
        c.moveTo(x, vpY - spread);
        c.lineTo(x, vpY + spread);
        c.stroke();
      }

      c.globalCompositeOperation = 'lighter';
      for (const p of particles) {
        p.progress += p.speed * 0.008;
        if (p.progress > 1) Object.assign(p, newP(0));
        const eased = Math.pow(p.progress, 1.8);
        const x = zoneStart + eased * zoneSpan;
        const spreadFactor = 1 - eased;
        const y = vpY + p.u * spreadFactor * H * 0.55;
        const leftFade = Math.min(1, eased * 2.5);
        const a = Math.min(1, eased * 2.2) * (0.35 + 0.65 * Math.sin(p.flicker + t * 0.005)) * leftFade;
        const size = p.size * (0.4 + eased * 3);
        const tailProg = Math.max(0, p.progress - 0.05);
        const tailE = Math.pow(tailProg, 1.8);
        const tailX = zoneStart + tailE * zoneSpan;
        const tailSpread = 1 - tailE;
        const tailY = vpY + p.u * tailSpread * H * 0.55;
        const grad = c.createLinearGradient(tailX, tailY, x, y);
        grad.addColorStop(0, 'oklch(0.82 0.18 250 / 0)');
        grad.addColorStop(1, 'oklch(0.82 0.18 250 / ' + a * 0.85 + ')');
        c.strokeStyle = grad;
        c.lineWidth = Math.max(0.5, size * 0.55);
        c.lineCap = 'round';
        c.beginPath();
        c.moveTo(tailX, tailY);
        c.lineTo(x, y);
        c.stroke();
        c.fillStyle = 'oklch(0.85 0.18 250 / ' + a + ')';
        c.beginPath();
        c.arc(x, y, size, 0, Math.PI * 2);
        c.fill();
      }

      c.globalCompositeOperation = 'lighter';
      const g = c.createRadialGradient(zoneEnd - W * 0.05, vpY, 0, zoneEnd - W * 0.05, vpY, H * 0.9);
      g.addColorStop(0, 'oklch(0.78 0.2 250 / 0.35)');
      g.addColorStop(0.4, 'oklch(0.55 0.22 260 / 0.1)');
      g.addColorStop(1, 'transparent');
      c.fillStyle = g;
      c.fillRect(zoneStart, 0, W - zoneStart, H);

      c.restore();
      raf = requestAnimationFrame(frame);
    }

    resize();
    spawn();
    const onResize = () => {
      resize();
      spawn();
    };
    window.addEventListener('resize', onResize);
    raf = requestAnimationFrame(frame);
    return () => {
      window.removeEventListener('resize', onResize);
      cancelAnimationFrame(raf);
    };
  }, []);

  /* Generate chart bars matching the reference renderChart() logic */
  const chartBars = useMemo(
    () =>
      Array.from({ length: 36 }, (_, i) => 30 + Math.sin(i * 0.4) * 15 + Math.random() * 35).map((h, i) => (
        <div key={i} className="chart-b" style={{ height: `${h}%` }} />
      )),
    []
  );

  const sbClass = ['sidebar', collapsed ? 'c' : '', mobileOpen ? 'mo' : ''].filter(Boolean).join(' ');

  return (
    <>
      <div
        className={mobileOpen ? 'sb-backdrop on' : 'sb-backdrop'}
        onClick={() => setMobileOpen(false)}
        aria-hidden="true"
      />
      {/* SIDEBAR */}
      <aside className={sbClass} id="sb">
        <div className="sb-head">
          <div className="sb-logo">TV</div>
          <span className="sb-brand">Tradeverse</span>
        </div>
        <div className="sb-toggle" onClick={() => setCollapsed((v) => !v)}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </div>
        <nav className="sb-nav">
          <div className="nav-sec">
            <div className="nav-sec-t">{t('sidebar.sections.dashboard')}</div>
            <NavLink to="/dashboard" end className={({ isActive }) => `nav-i${isActive ? ' act' : ''}`}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="7" height="7" />
                <rect x="14" y="3" width="7" height="7" />
                <rect x="14" y="14" width="7" height="7" />
                <rect x="3" y="14" width="7" height="7" />
              </svg>
              <span className="nav-i-t">{t('sidebar.nav.overview')}</span>
            </NavLink>
            <NavLink to="/portfolio" className={({ isActive }) => `nav-i${isActive ? ' act' : ''}`}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
                <polyline points="17 6 23 6 23 12" />
              </svg>
              <span className="nav-i-t">{t('sidebar.nav.portfolio')}</span>
            </NavLink>
          </div>
          <div className="nav-sec">
            <div className="nav-sec-t">{t('sidebar.sections.trading')}</div>
            <NavLink to="/client/signals" className={({ isActive }) => `nav-i${isActive ? ' act' : ''}`}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
              </svg>
              <span className="nav-i-t">{t('sidebar.nav.signalPlaza')}</span>
              <span className="nav-badge">12</span>
            </NavLink>
            <NavLink to="/copy-trading" className={({ isActive }) => `nav-i${isActive ? ' act' : ''}`}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="1" x2="12" y2="23" />
                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
              </svg>
              <span className="nav-i-t">{t('sidebar.nav.trade')}</span>
            </NavLink>
            <NavLink to="/atlas-gold" className={({ isActive }) => `nav-i${isActive ? ' act' : ''}`}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
              <span className="nav-i-t">{t('sidebar.nav.trailMode')}</span>
            </NavLink>
          </div>
          <div className="nav-sec">
            <div className="nav-sec-t">{t('sidebar.sections.finance')}</div>
            <NavLink to="/wallet" className={({ isActive }) => `nav-i${isActive ? ' act' : ''}`}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
                <rect x="1" y="4" width="22" height="16" rx="2" />
                <line x1="1" y1="10" x2="23" y2="10" />
              </svg>
              <span className="nav-i-t">{t('sidebar.nav.wallet')}</span>
            </NavLink>
            <NavLink to="/history" className={({ isActive }) => `nav-i${isActive ? ' act' : ''}`}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
              <span className="nav-i-t">{t('sidebar.nav.history')}</span>
            </NavLink>
          </div>
          <div className="nav-sec">
            <div className="nav-sec-t">{t('sidebar.sections.engage')}</div>
            <NavLink to="/referrals" className={({ isActive }) => `nav-i${isActive ? ' act' : ''}`}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
              <span className="nav-i-t">{t('sidebar.nav.referrals')}</span>
            </NavLink>
            <NavLink to="/activities" className={({ isActive }) => `nav-i${isActive ? ' act' : ''}`}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              <span className="nav-i-t">{t('sidebar.nav.activities')}</span>
            </NavLink>
            <NavLink to="/community" className={({ isActive }) => `nav-i${isActive ? ' act' : ''}`}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
              <span className="nav-i-t">{t('sidebar.nav.community')}</span>
            </NavLink>
          </div>
          <div className="nav-sec">
            <div className="nav-sec-t">{t('sidebar.sections.account')}</div>
            <NavLink to="/notifications" className={({ isActive }) => `nav-i${isActive ? ' act' : ''}`}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
              <span className="nav-i-t">{t('sidebar.nav.notifications')}</span>
              <span className="nav-badge">3</span>
            </NavLink>
            <NavLink to="/settings" className={({ isActive }) => `nav-i${isActive ? ' act' : ''}`}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9c.26.604.852.997 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
              </svg>
              <span className="nav-i-t">{t('sidebar.nav.settings')}</span>
            </NavLink>
          </div>
        </nav>
        <div className="sb-foot">
          <div className="sb-user">
            <div className="sb-u-av">{initials}</div>
            <div className="sb-u-info">
              <div className="sb-u-nm">{user?.displayName ?? 'John Doe'}</div>
              <div className="sb-u-rl">{t('sidebar.footer.premium')}</div>
            </div>
          </div>
        </div>
      </aside>

      {/* MAIN */}
      <div className="main" id="main">
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
              <div className="tb-title" id="pgTitle">
                {t('topbar.title')}
              </div>
              <div className="tb-bread">
                {t('topbar.breadcrumb')}
              </div>
            </div>
          </div>
          <div className="tb-right">
            <div className="tb-search">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input placeholder={t('topbar.searchPlaceholder')} />
              <kbd>⌘K</kbd>
            </div>
            <LanguageSwitcher />
            <ThemeToggle className="tb-btn" />
            <div className="tb-btn">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
              <span className="dot" />
            </div>
            <div className="tb-btn">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9c.26.604.852.997 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
              </svg>
            </div>
          </div>
        </header>
        <div className="content" id="contentArea">
          {/* OVERVIEW */}
          <div className="pv act" id="pg-overview" data-screen-label="Overview">
            <div className="welcome">
              <canvas ref={canvasRef} id="streamCanvas" />
              <div className="welcome-beam" />
              <div className="welcome-content">
                <div className="welcome-pill">
                  <span className="welcome-pill-badge">TV</span> {t('hero.sessionStatus')}
                </div>
                <h2>
                  {t('hero.greeting', { name: displayName })}<br />
                  {t('hero.tagline')} <em>{t('hero.taglineAccent')}</em>
                </h2>
                <p>
                  {t('hero.summary', { activePositions: 3, rewards: 2, level: 2 })}
                </p>
                <div className="welcome-stats">
                  <div className="welcome-stat">
                    <div className="val mono">{formatCurrency(48293)}</div>
                    <div className="lbl">{t('hero.stats.balance')}</div>
                  </div>
                  <div className="welcome-stat">
                    <div className="val mono" style={{ color: 'oklch(0.92 0.1 150)' }}>
                      {formatPercent(12.5)}
                    </div>
                    <div className="lbl">{t('hero.stats.thisMonth')}</div>
                  </div>
                  <div className="welcome-stat">
                    <div className="val mono">03</div>
                    <div className="lbl">{t('hero.stats.positions')}</div>
                  </div>
                  <div className="welcome-stat">
                    <div className="val mono">14d</div>
                    <div className="lbl">{t('hero.stats.streak')}</div>
                  </div>
                </div>
              </div>
            </div>
            <div className="g4 mb6">
              <div className="stat-card">
                <div className="stat-label">{t('kpis.totalBalance')}</div>
                <div className="stat-val">
                  {formatCurrency(48293.57)}
                </div>
                <div className="stat-chg up">{t('kpis.badges.mtd', { amount: formatCurrency(5340) })}</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">{t('kpis.brokerAccount')}</div>
                <div className="stat-val">{formatCurrency(32450)}</div>
                <div className="stat-chg up">{t('kpis.badges.invested', { percent: formatPercent(72) })}</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">{t('kpis.walletUsdt')}</div>
                <div className="stat-val">{formatCurrency(12843)}</div>
                <div className="stat-chg up">{t('kpis.badges.available')}</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">{t('kpis.trialBalance')}</div>
                <div className="stat-val">{formatCurrency(10000)}</div>
                <div className="stat-chg up">{t('kpis.badges.daysLeft', { count: 23 })}</div>
              </div>
            </div>
            <div className="g2 mb6">
              <div className="card">
                <div className="card-h">
                  <div>
                    <div className="card-t">{t('performance.title')}</div>
                    <div className="card-st">{t('performance.subtitle')}</div>
                  </div>
                  <div className="tabs">
                    <div className="tab act">{t('performance.ranges.30d')}</div>
                    <div className="tab">{t('performance.ranges.90d')}</div>
                    <div className="tab">{t('performance.ranges.1y')}</div>
                  </div>
                </div>
                <div className="chart-ph" id="ovChart">
                  {chartBars}
                </div>
              </div>
              <div className="card">
                <div className="card-h">
                  <div>
                    <div className="card-t">{t('activity.title')}</div>
                  </div>
                  <button className="btn btn-ghost btn-sm">{t('activity.viewAll')}</button>
                </div>
                <div className="act-i">
                  <div className="act-ic" style={{ background: 'var(--green-l)', color: 'var(--green)' }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>
                  <div className="act-info">
                    <div className="act-t">{t('activity.positionClosed', { name: 'BTC/USD Momentum' })}</div>
                    <div className="act-d">{t('activity.profitRealized', { time: '2 hours ago' })}</div>
                  </div>
                  <div className="act-amt">+$847</div>
                </div>
                <div className="act-i">
                  <div className="act-ic" style={{ background: 'var(--blue-l)', color: 'var(--blue-2)' }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="12" y1="1" x2="12" y2="23" />
                      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                    </svg>
                  </div>
                  <div className="act-info">
                    <div className="act-t">{t('activity.depositConfirmed')}</div>
                    <div className="act-d">{t('activity.depositVia', { amount: 500, asset: 'USDT', network: 'TRC-20', time: '5 hours ago' })}</div>
                  </div>
                  <div className="act-amt">+$500</div>
                </div>
                <div className="act-i">
                  <div className="act-ic" style={{ background: 'var(--purple-l)', color: 'var(--purple)' }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                    </svg>
                  </div>
                  <div className="act-info">
                    <div className="act-t">{t('activity.loginReward')}</div>
                    <div className="act-d">{t('activity.streakBonus', { days: 7, time: 'Yesterday' })}</div>
                  </div>
                  <div className="act-amt">+$5</div>
                </div>
              </div>
            </div>
            <div className="sec">
              <div className="sec-h">
                <div className="sec-t">
                  {t('positions.title')} <em>{t('positions.titleAccent')}</em>
                </div>
                <button className="btn btn-outline btn-sm">{t('positions.viewAll')}</button>
              </div>
              <div className="g3">
                <div className="pos-card">
                  <div className="flex aic jcb mb3">
                    <div className="flex aic gap2">
                      <div
                        className="av av-sm"
                        style={{
                          background: 'linear-gradient(135deg,oklch(0.68 0.19 255),oklch(0.86 0.12 220))',
                        }}
                      >
                        AS
                      </div>
                      <div>
                        <div className="f6 fs12">AlphaSignal</div>
                        <div className="fs11 t3">Momentum Trading</div>
                      </div>
                    </div>
                    <span className="badge b-green">
                      <span className="s-dot green" />
                      {t('positions.status.active')}
                    </span>
                  </div>
                  <div className="g3 mb3">
                    <div>
                      <div className="fs11 t3 mono" style={{ letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                        {t('positions.labels.invested')}
                      </div>
                      <div className="f6 fs12 mono mt2">$5,000</div>
                    </div>
                    <div>
                      <div className="fs11 t3 mono" style={{ letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                        {t('positions.labels.pl')}
                      </div>
                      <div className="f6 fs12 tg mono mt2">+$847</div>
                    </div>
                    <div>
                      <div className="fs11 t3 mono" style={{ letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                        {t('positions.labels.win')}
                      </div>
                      <div className="f6 fs12 mono mt2">72%</div>
                    </div>
                  </div>
                  <div className="flex aic jcb">
                    <div className="fs11 t3 mono">{t('positions.followers', { count: 2400 })}</div>
                    <button className="btn btn-outline btn-sm">{t('positions.actions.close')}</button>
                  </div>
                </div>
                <div className="pos-card">
                  <div className="flex aic jcb mb3">
                    <div className="flex aic gap2">
                      <div
                        className="av av-sm"
                        style={{
                          background: 'linear-gradient(135deg,oklch(0.7 0.2 300),oklch(0.68 0.22 340))',
                        }}
                      >
                        QF
                      </div>
                      <div>
                        <div className="f6 fs12">QuantFlow</div>
                        <div className="fs11 t3">Mean Reversion</div>
                      </div>
                    </div>
                    <span className="badge b-yellow">
                      <span className="s-dot yellow" />
                      {t('positions.status.fundraising')}
                    </span>
                  </div>
                  <div className="g3 mb3">
                    <div>
                      <div className="fs11 t3 mono" style={{ letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                        {t('positions.labels.invested')}
                      </div>
                      <div className="f6 fs12 mono mt2">$3,200</div>
                    </div>
                    <div>
                      <div className="fs11 t3 mono" style={{ letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                        {t('positions.labels.pl')}
                      </div>
                      <div className="f6 fs12 tg mono mt2">+$234</div>
                    </div>
                    <div>
                      <div className="fs11 t3 mono" style={{ letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                        {t('positions.labels.win')}
                      </div>
                      <div className="f6 fs12 mono mt2">65%</div>
                    </div>
                  </div>
                  <div className="flex aic jcb">
                    <div className="fs11 t3 mono">{t('positions.followers', { count: 890 })}</div>
                    <button className="btn btn-green btn-sm">{t('positions.actions.addFunds')}</button>
                  </div>
                </div>
                <div className="pos-card">
                  <div className="flex aic jcb mb3">
                    <div className="flex aic gap2">
                      <div
                        className="av av-sm"
                        style={{
                          background: 'linear-gradient(135deg,oklch(0.72 0.17 150),oklch(0.86 0.12 220))',
                        }}
                      >
                        TM
                      </div>
                      <div>
                        <div className="f6 fs12">TrendMaster</div>
                        <div className="fs11 t3">Scalping Pro</div>
                      </div>
                    </div>
                    <span className="badge b-green">
                      <span className="s-dot green" />
                      {t('positions.status.active')}
                    </span>
                  </div>
                  <div className="g3 mb3">
                    <div>
                      <div className="fs11 t3 mono" style={{ letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                        {t('positions.labels.invested')}
                      </div>
                      <div className="f6 fs12 mono mt2">$8,500</div>
                    </div>
                    <div>
                      <div className="fs11 t3 mono" style={{ letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                        {t('positions.labels.pl')}
                      </div>
                      <div className="f6 fs12 tr mono mt2">-$412</div>
                    </div>
                    <div>
                      <div className="fs11 t3 mono" style={{ letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                        {t('positions.labels.win')}
                      </div>
                      <div className="f6 fs12 mono mt2">58%</div>
                    </div>
                  </div>
                  <div className="flex aic jcb">
                    <div className="fs11 t3 mono">{t('positions.followers', { count: 5100 })}</div>
                    <button className="btn btn-outline btn-sm">{t('positions.actions.close')}</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
