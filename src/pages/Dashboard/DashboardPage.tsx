import { useEffect, useRef } from 'react';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

/* ─── Chart placeholder bars ─── */
function ChartPlaceholder() {
  const bars = Array.from({ length: 36 }, (_, i) =>
    30 + Math.sin(i * 0.4) * 15 + Math.random() * 35
  );
  return (
    <div className="w-full h-[170px] bg-[linear-gradient(180deg,oklch(0.98_0.02_260),#fff)] border border-line rounded-[10px] flex items-end p-[14px] gap-[3px] relative overflow-hidden"
      style={{
        backgroundImage:
          'repeating-linear-gradient(0deg, transparent 0 24px, rgba(11,18,40,0.04) 24px 25px)',
      }}
    >
      {bars.map((h, i) => (
        <div
          key={i}
          className={cn(
            'flex-1 rounded-t-[2px] min-h-[3px]',
            i % 2 === 0
              ? 'bg-[linear-gradient(to_top,var(--blue),oklch(0.7_0.2_255_/_0.5))]'
              : 'bg-[linear-gradient(to_top,var(--cyan),oklch(0.7_0.14_220_/_0.5))]'
          )}
          style={{ height: `${h}%` }}
        />
      ))}
    </div>
  );
}

/* ─── Stat Card ─── */
function StatCard({
  label,
  value,
  change,
  changeType = 'up',
}: {
  label: string;
  value: string;
  change: string;
  changeType?: 'up' | 'dn';
}) {
  return (
    <div className="relative bg-bg-1 border border-line rounded-[14px] p-5 transition-all duration-[280ms] overflow-hidden"
      style={{
        boxShadow: '0 1px 2px rgba(11,18,40,0.04), 0 4px 16px -8px rgba(11,18,40,0.08)',
      }}
    >
      <div className="absolute inset-0 rounded-[inherit] pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at top right, oklch(0.58 0.22 262 / 0.06), transparent 60%)',
        }}
      />
      <div className="relative">
        <div className="text-[11px] text-ink-3 mb-[10px] uppercase tracking-[0.1em] font-mono font-medium">
          {label}
        </div>
        <div className="font-serif text-[34px] font-normal tracking-[-0.02em] text-ink-0 leading-none">
          {value}
        </div>
        <div
          className={cn(
            'inline-flex items-center gap-1 text-[11px] font-semibold mt-[10px] px-[9px] py-[3px] rounded-[6px] font-mono tracking-[0.02em]',
            changeType === 'up'
              ? 'bg-green-l text-green border border-[oklch(0.72_0.17_150/0.3)]'
              : 'bg-red-l text-red border border-[oklch(0.68_0.22_20/0.3)]'
          )}
        >
          {changeType === 'up' ? '↑' : '↓'} {change}
        </div>
      </div>
    </div>
  );
}

/* ─── Activity Item ─── */
function ActivityItem({
  iconBg,
  iconColor,
  iconPath,
  title,
  desc,
  amount,
}: {
  iconBg: string;
  iconColor: string;
  iconPath: string;
  title: string;
  desc: string;
  amount?: string;
}) {
  return (
    <div className="flex items-center gap-[14px] px-[14px] py-3 rounded-[10px] hover:bg-[oklch(0.97_0.02_260)] transition-colors duration-[280ms]">
      <div
        className="w-[38px] h-[38px] rounded-[10px] flex items-center justify-center shrink-0 border border-line"
        style={{ background: iconBg, color: iconColor }}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
          <path d={iconPath} />
        </svg>
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[13px] font-semibold text-ink-0">{title}</div>
        <div className="text-[11px] text-ink-3 mt-[3px]">{desc}</div>
      </div>
      {amount && (
        <div className="font-mono text-[13px] font-semibold text-green">{amount}</div>
      )}
    </div>
  );
}

/* ─── Position Card ─── */
function PositionCard({
  initials_,
  gradient,
  name,
  strategy,
  status,
  statusColor,
  invested,
  pl,
  plPositive,
  winRate,
  followers,
  action,
}: {
  initials_: string;
  gradient: string;
  name: string;
  strategy: string;
  status: string;
  statusColor: string;
  invested: string;
  pl: string;
  plPositive: boolean;
  winRate: string;
  followers: string;
  action: string;
}) {
  return (
    <div className="bg-bg-1 border border-line rounded-[14px] p-[18px] transition-all duration-[280ms]"
      style={{ boxShadow: '0 1px 2px rgba(11,18,40,0.04)' }}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div
            className="w-7 h-7 rounded-[7px] flex items-center justify-center text-white font-bold text-[10px] font-mono"
            style={{ background: `linear-gradient(135deg,${gradient})` }}
          >
            {initials_}
          </div>
          <div>
            <div className="font-semibold text-[12px] text-ink-0">{name}</div>
            <div className="text-[11px] text-ink-3">{strategy}</div>
          </div>
        </div>
        <span
          className={cn(
            'inline-flex items-center gap-[5px] px-[9px] py-[3px] rounded-[6px] text-[10px] font-semibold font-mono uppercase tracking-[0.04em] border',
            statusColor === 'green' && 'bg-green-l text-green border-[oklch(0.72_0.17_150/0.3)]',
            statusColor === 'yellow' && 'bg-yellow-l text-yellow border-[oklch(0.82_0.15_85/0.3)]'
          )}
        >
          <span
            className={cn(
              'w-[7px] h-[7px] rounded-full inline-block',
              statusColor === 'green' && 'bg-green',
              statusColor === 'yellow' && 'bg-yellow'
            )}
            style={statusColor === 'green' ? { boxShadow: '0 0 6px var(--green)' } : { boxShadow: '0 0 6px var(--yellow)' }}
          />
          {status}
        </span>
      </div>
      <div className="grid grid-cols-3 gap-4 mb-3">
        <div>
          <div className="text-[11px] text-ink-3 uppercase tracking-[0.08em] font-mono">Invested</div>
          <div className="font-semibold text-[12px] text-ink-0 mt-2 font-mono">{invested}</div>
        </div>
        <div>
          <div className="text-[11px] text-ink-3 uppercase tracking-[0.08em] font-mono">P/L</div>
          <div className={cn('font-semibold text-[12px] mt-2 font-mono', plPositive ? 'text-green' : 'text-red')}>
            {pl}
          </div>
        </div>
        <div>
          <div className="text-[11px] text-ink-3 uppercase tracking-[0.08em] font-mono">Win</div>
          <div className="font-semibold text-[12px] text-ink-0 mt-2 font-mono">{winRate}</div>
        </div>
      </div>
      <div className="flex items-center justify-between">
        <div className="text-[11px] text-ink-3 font-mono">{followers} followers</div>
        <Button
          variant="outline"
          size="sm"
          className="h-7 text-[11px] bg-bg-1 border-line-2 text-ink-1 hover:border-line-3 hover:text-ink-0 hover:bg-[oklch(0.96_0.03_260)]"
        >
          {action}
        </Button>
      </div>
    </div>
  );
}

/* ─── Welcome Banner Canvas ─── */
function WelcomeBanner({ userName }: { userName: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let W = 0, H = 0, DPR = Math.min(window.devicePixelRatio || 1, 2);
    let animationId = 0;

    function resize() {
      const rect = canvas!.parentElement!.getBoundingClientRect();
      W = rect.width; H = rect.height;
      canvas!.width = W * DPR; canvas!.height = H * DPR;
      canvas!.style.width = W + 'px'; canvas!.style.height = H + 'px';
      ctx!.setTransform(DPR, 0, 0, DPR, 0, 0);
    }

    const particles: { u: number; progress: number; speed: number; size: number; hueShift: number; flicker: number }[] = [];
    function spawnParticles() {
      particles.length = 0;
      for (let i = 0; i < 180; i++) {
        particles.push({
          u: Math.random() * 2 - 1,
          progress: Math.random(),
          speed: 0.12 + Math.random() * 0.35,
          size: 0.6 + Math.random() * 1.6,
          hueShift: (Math.random() - 0.5) * 20,
          flicker: Math.random() * Math.PI * 2,
        });
      }
    }

    const stars: { x: number; y: number; s: number; tw: number }[] = [];
    function spawnStars() {
      stars.length = 0;
      for (let i = 0; i < 120; i++) {
        stars.push({
          x: Math.random() * W,
          y: Math.random() * (H * 0.5),
          s: Math.random() * 1.1 + 0.2,
          tw: Math.random() * Math.PI * 2,
        });
      }
    }

    function drawStars(t: number) {
      ctx!.save();
      for (const s of stars) {
        const a = 0.3 + 0.5 * Math.sin(t * 0.002 + s.tw);
        ctx!.fillStyle = `rgba(200,220,255,${a * 0.6})`;
        ctx!.beginPath(); ctx!.arc(s.x, s.y, s.s, 0, Math.PI * 2); ctx!.fill();
      }
      ctx!.restore();
    }

    function drawGrid(t: number) {
      const vpY = H * 0.36;
      const floorTop = H * 0.38;
      const cx = W / 2;
      ctx!.save();
      const rays = 30;
      for (let i = 0; i <= rays; i++) {
        const k = i / rays;
        const spread = (k - 0.5) * 2.2;
        const xEnd = cx + spread * W * 0.75;
        const alpha = 0.14 * (1 - Math.abs(spread) * 0.4);
        const hue = 255 + Math.abs(spread) * 10;
        ctx!.strokeStyle = `oklch(0.75 0.18 ${hue} / ${alpha})`;
        ctx!.lineWidth = 1;
        ctx!.beginPath();
        ctx!.moveTo(cx, vpY);
        ctx!.lineTo(xEnd, H + 20);
        ctx!.stroke();
      }
      const ribs = 18;
      for (let i = 0; i < ribs; i++) {
        const phase = ((i / ribs) + (t * 0.00012) % 1) % 1;
        const eased = Math.pow(phase, 2.4);
        const y = floorTop + eased * (H - floorTop + 40);
        const widthFactor = eased * 1.6 + 0.02;
        const alpha = 0.35 * Math.min(1, eased * 2.2) * (1 - phase * 0.6);
        ctx!.strokeStyle = `oklch(0.78 0.16 255 / ${alpha})`;
        ctx!.lineWidth = 1 + eased * 1.2;
        ctx!.beginPath();
        ctx!.moveTo(cx - W * 0.55 * widthFactor, y);
        ctx!.quadraticCurveTo(cx, y - eased * 8, cx + W * 0.55 * widthFactor, y);
        ctx!.stroke();
      }
      ctx!.restore();
    }

    function drawParticles(t: number) {
      const vpY = H * 0.36;
      const cx = W / 2;
      ctx!.save();
      ctx!.globalCompositeOperation = 'lighter';
      for (const p of particles) {
        p.progress += p.speed * 0.009 * 1.1;
        if (p.progress > 1) Object.assign(p, { u: Math.random() * 2 - 1, progress: 0, speed: 0.12 + Math.random() * 0.35, size: 0.6 + Math.random() * 1.6, hueShift: (Math.random() - 0.5) * 20, flicker: Math.random() * Math.PI * 2 });
        const eased = Math.pow(p.progress, 2.2);
        const y = vpY + eased * (H - vpY + 40);
        const spread = p.u * eased * W * 0.55;
        const x = cx + spread;
        const a = Math.min(1, eased * 2.2) * (0.35 + 0.65 * Math.sin(p.flicker + t * 0.005));
        const size = p.size * (0.4 + eased * 3.6);
        const hue = 255 + p.hueShift;
        const lum = 0.78 + eased * 0.1;
        const tailX = cx + p.u * Math.pow(Math.max(0, p.progress - 0.04), 2.2) * W * 0.55;
        const tailY = vpY + Math.pow(Math.max(0, p.progress - 0.04), 2.2) * (H - vpY + 40);
        const grad = ctx!.createLinearGradient(tailX, tailY, x, y);
        grad.addColorStop(0, `oklch(${lum} 0.2 ${hue} / 0)`);
        grad.addColorStop(1, `oklch(${lum} 0.2 ${hue} / ${a * 0.9})`);
        ctx!.strokeStyle = grad;
        ctx!.lineWidth = Math.max(0.5, size * 0.6);
        ctx!.lineCap = 'round';
        ctx!.beginPath();
        ctx!.moveTo(tailX, tailY);
        ctx!.lineTo(x, y);
        ctx!.stroke();
        ctx!.fillStyle = `oklch(${lum} 0.2 ${hue} / ${a})`;
        ctx!.beginPath();
        ctx!.arc(x, y, size, 0, Math.PI * 2);
        ctx!.fill();
      }
      ctx!.restore();
    }

    function drawBeamGlow(t: number) {
      const cx = W / 2;
      const pulse = 0.85 + 0.15 * Math.sin(t * 0.003);
      const g = ctx!.createRadialGradient(cx, H * 0.4, 0, cx, H * 0.4, H * 0.8);
      g.addColorStop(0, `oklch(0.78 0.2 255 / ${0.28 * pulse})`);
      g.addColorStop(0.4, `oklch(0.55 0.22 255 / ${0.1 * pulse})`);
      g.addColorStop(1, 'transparent');
      ctx!.fillStyle = g;
      ctx!.fillRect(0, 0, W, H);
    }

    function frame(t: number) {
      ctx!.clearRect(0, 0, W, H);
      const bg = ctx!.createLinearGradient(0, 0, 0, H);
      bg.addColorStop(0, '#030611');
      bg.addColorStop(0.5, '#05091a');
      bg.addColorStop(1, '#07102a');
      ctx!.fillStyle = bg;
      ctx!.fillRect(0, 0, W, H);
      drawStars(t);
      drawBeamGlow(t);
      drawGrid(t);
      drawParticles(t);
      animationId = requestAnimationFrame(frame);
    }

    resize();
    spawnStars();
    spawnParticles();
    animationId = requestAnimationFrame(frame);
    window.addEventListener('resize', resize);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <div
      className="relative rounded-[18px] px-[34px] py-[30px] overflow-hidden mb-6 min-h-[200px]"
      style={{
        border: '1px solid oklch(0.35 0.18 265 / 0.5)',
        background: 'linear-gradient(140deg, #0f1a45 0%, #0a1230 60%, #15266b 100%)',
        boxShadow: '0 20px 50px -16px oklch(0.35 0.2 260 / 0.45)',
      }}
    >
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
      <div
        className="absolute top-[-20px] bottom-[-20px] right-[12%] w-[2px]"
        style={{
          background:
            'linear-gradient(180deg, transparent, oklch(0.92 0.1 230 / 0.9), transparent)',
          boxShadow:
            '0 0 40px 8px oklch(0.7 0.2 240 / 0.35), 0 0 120px 20px oklch(0.55 0.22 255 / 0.25)',
          mixBlendMode: 'screen',
        }}
      />
      <div className="relative z-[2]">
        <div className="inline-flex items-center gap-[10px] px-[14px] py-[5px] pr-[14px] pl-[5px] rounded-full bg-[rgba(255,255,255,0.08)] border border-[rgba(255,255,255,0.15)] text-[11px] text-[rgba(255,255,255,0.9)] mb-4 backdrop-blur-[10px] font-mono tracking-[0.05em]"
        >
          <span className="w-[22px] h-[22px] rounded-full grid place-items-center bg-[linear-gradient(135deg,var(--blue),var(--blue-3))] text-[9px] font-bold text-white"
          >TV</span>
          Markets open · Low volatility session
        </div>
        <h2 className="font-serif text-[38px] font-normal leading-[1.05] tracking-[-0.02em] mb-[10px] text-white">
          Good morning, {userName}.<br />
          Your edge is{' '}
          <em className="italic bg-[linear-gradient(100deg,oklch(0.88_0.12_220),oklch(0.78_0.17_245))] bg-clip-text text-transparent"
          >compounding.</em>
        </h2>
        <p className="text-[14px] text-[rgba(255,255,255,0.75)] max-w-[520px] leading-[1.6]">
          3 active positions, 2 rewards to claim, and your Trail Mode challenge advances to Level 2 today.
        </p>
        <div className="flex gap-10 mt-5">
          <div>
            <div className="font-serif text-[28px] font-normal leading-none text-white font-mono">$48,293</div>
            <div className="text-[10px] text-[rgba(255,255,255,0.6)] uppercase tracking-[0.1em] mt-[5px] font-mono">Balance</div>
          </div>
          <div>
            <div className="font-serif text-[28px] font-normal leading-none text-white font-mono" style={{ color: 'oklch(0.92 0.1 150)' }}>
              +12.5%
            </div>
            <div className="text-[10px] text-[rgba(255,255,255,0.6)] uppercase tracking-[0.1em] mt-[5px] font-mono">This Month</div>
          </div>
          <div>
            <div className="font-serif text-[28px] font-normal leading-none text-white font-mono">03</div>
            <div className="text-[10px] text-[rgba(255,255,255,0.6)] uppercase tracking-[0.1em] mt-[5px] font-mono">Positions</div>
          </div>
          <div>
            <div className="font-serif text-[28px] font-normal leading-none text-white font-mono">14d</div>
            <div className="text-[10px] text-[rgba(255,255,255,0.6)] uppercase tracking-[0.1em] mt-[5px] font-mono">Streak</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function DashboardPage() {
  useDocumentTitle('Dashboard');
  const { user } = useAuth();

  return (
    <div className="animate-[pgIn_0.35s_ease-out]">
      {/* Welcome Banner */}
      <WelcomeBanner userName={user?.displayName?.split(' ')[0] ?? 'John'} />

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Total Balance" value="$48,293.57" change="$5,340 MTD" changeType="up" />
        <StatCard label="Broker Account" value="$32,450" change="72% invested" changeType="up" />
        <StatCard label="Wallet USDT" value="$12,843" change="Available" changeType="up" />
        <StatCard label="Trial Balance" value="$10,000" change="23 days left" changeType="up" />
      </div>

      {/* Charts + Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <div className="bg-bg-1 border border-line rounded-[14px] p-5 transition-all duration-[280ms]"
          style={{ boxShadow: '0 1px 2px rgba(11,18,40,0.04), 0 4px 16px -8px rgba(11,18,40,0.08)' }}
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="font-serif text-[20px] font-normal tracking-[-0.01em] text-ink-0 leading-[1.1]">Portfolio Performance</div>
              <div className="text-[11px] text-ink-3 mt-1 uppercase tracking-[0.05em] font-mono">Last 30 days</div>
            </div>
            <div className="flex gap-[2px] p-[3px] bg-bg-2 border border-line rounded-[9px] w-fit">
              {['30D', '90D', '1Y'].map((t, i) => (
                <div
                  key={t}
                  className={cn(
                    'px-[14px] py-[7px] rounded-[7px] text-[12px] font-medium cursor-pointer transition-all',
                    i === 0
                      ? 'bg-bg-1 text-blue-2'
                      : 'text-ink-2 hover:text-ink-0'
                  )}
                  style={i === 0 ? { boxShadow: '0 1px 3px rgba(11,18,40,0.08), inset 0 0 0 1px var(--line-3)' } : undefined}
                >
                  {t}
                </div>
              ))}
            </div>
          </div>
          <ChartPlaceholder />
        </div>

        <div className="bg-bg-1 border border-line rounded-[14px] p-5 transition-all duration-[280ms]"
          style={{ boxShadow: '0 1px 2px rgba(11,18,40,0.04), 0 4px 16px -8px rgba(11,18,40,0.08)' }}
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="font-serif text-[20px] font-normal tracking-[-0.01em] text-ink-0 leading-[1.1]">Recent Activity</div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-[11px] text-ink-2 hover:bg-[oklch(0.95_0.03_260)] hover:text-ink-0"
            >
              View all →
            </Button>
          </div>
          <ActivityItem
            iconBg="var(--green-l)"
            iconColor="var(--green)"
            iconPath="M20 6 9 17 4 12"
            title="Position closed — AlphaSignal"
            desc="Profit realized · 2 hours ago"
            amount="+$847"
          />
          <ActivityItem
            iconBg="var(--blue-l)"
            iconColor="var(--blue-2)"
            iconPath="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"
            title="Deposit confirmed"
            desc="500 USDT via TRC20 · 5 hours ago"
            amount="+$500"
          />
          <ActivityItem
            iconBg="var(--purple-l)"
            iconColor="var(--purple)"
            iconPath="M12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"
            title="Daily login reward"
            desc="7-day streak bonus · 1 day ago"
            amount="+$5"
          />
        </div>
      </div>

      {/* Active Positions */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="font-serif text-[26px] font-normal tracking-[-0.01em]">
            Active <em className="italic bg-[linear-gradient(100deg,oklch(0.78_0.17_245),oklch(0.62_0.21_260))] bg-clip-text text-transparent">positions</em>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-[11px] bg-bg-1 border-line-2 text-ink-1 hover:border-line-3 hover:text-ink-0 hover:bg-[oklch(0.96_0.03_260)]"
          >
            View all →
          </Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <PositionCard
            initials_="AS"
            gradient="oklch(0.68 0.19 255),oklch(0.86 0.12 220)"
            name="AlphaSignal"
            strategy="Momentum Trading"
            status="Active"
            statusColor="green"
            invested="$5,000"
            pl="+$847"
            plPositive={true}
            winRate="72%"
            followers="2,400"
            action="Close"
          />
          <PositionCard
            initials_="QF"
            gradient="oklch(0.7 0.2 300),oklch(0.68 0.22 340)"
            name="QuantFlow"
            strategy="Mean Reversion"
            status="Fundraising"
            statusColor="yellow"
            invested="$3,200"
            pl="+$234"
            plPositive={true}
            winRate="65%"
            followers="890"
            action="Add Funds"
          />
          <PositionCard
            initials_="TM"
            gradient="oklch(0.72 0.17 150),oklch(0.86 0.12 220)"
            name="TrendMaster"
            strategy="Scalping Pro"
            status="Active"
            statusColor="green"
            invested="$8,500"
            pl="-$412"
            plPositive={false}
            winRate="58%"
            followers="5,100"
            action="Close"
          />
        </div>
      </div>
    </div>
  );
}
