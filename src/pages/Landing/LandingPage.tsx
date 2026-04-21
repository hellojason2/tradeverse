import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';

/* ───────────────────────────────────────────────
   Tradeverse Landing Page
   Replicated from design/Tv 2.0/Landing Page.html
   ─────────────────────────────────────────────── */

/* ─── Stream Canvas ─── */
function StreamCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let W = 0, H = 0;
    const DPR = Math.min(window.devicePixelRatio || 1, 2);
    let animationId = 0;

    function resize() {
      const rect = canvas!.parentElement!.getBoundingClientRect();
      W = rect.width; H = rect.height;
      canvas!.width = W * DPR; canvas!.height = H * DPR;
      canvas!.style.width = W + 'px'; canvas!.style.height = H + 'px';
      ctx!.setTransform(DPR, 0, 0, DPR, 0, 0);
    }

    const particles: {
      u: number; progress: number; speed: number; size: number; hueShift: number; flicker: number;
    }[] = [];

    function spawnParticles() {
      particles.length = 0;
      const n = 180;
      for (let i = 0; i < n; i++) {
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
        if (p.progress > 1) {
          Object.assign(p, {
            u: Math.random() * 2 - 1,
            progress: 0,
            speed: 0.12 + Math.random() * 0.35,
            size: 0.6 + Math.random() * 1.6,
            hueShift: (Math.random() - 0.5) * 20,
            flicker: Math.random() * Math.PI * 2,
          });
        }
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

    const onResize = () => { resize(); spawnStars(); spawnParticles(); };
    window.addEventListener('resize', onResize);
    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', onResize);
    };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full block" />;
}

/* ─── P/L Flow Phone ─── */
const SHIELD_SVG = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l7 3v5c0 4.2-2.9 8-7 9.4-4.1-1.4-7-5.2-7-9.4V6z"/><path d="m9 12 2 2 4-4"/></svg>`;

const POOL = [
  +243.50, -112.00, +87.20, +412.40, -48.90, +156.25,
  -204.80, +312.55, +91.10, -66.40, +528.00, +72.15,
  -18.35, +204.00, -128.70, +847.20, +44.60, -52.35,
  +168.90, -96.00, +312.00, +55.40, -184.25, +220.10,
];

function fmtPl(v: number) {
  return (v >= 0 ? '+' : '-') + '\$' + Math.abs(v).toFixed(2);
}

interface FlowNum {
  el: HTMLDivElement;
  v: number;
  t: number;
  state: 'raw' | 'sec';
  speed: number;
}

function PhoneFlow() {
  const stageRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const pRawRef = useRef<SVGPathElement>(null);
  const pSecRef = useRef<SVGPathElement>(null);
  const pDashRef = useRef<SVGPathElement>(null);
  const pillRef = useRef<HTMLDivElement>(null);
  const totalRef = useRef<HTMLDivElement>(null);
  const countRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const stage = stageRef.current!;
    const svg = svgRef.current!;
    const pRaw = pRawRef.current!;
    const pSec = pSecRef.current!;
    const pDash = pDashRef.current!;
    const pill = pillRef.current!;
    if (!stageRef.current || !svgRef.current || !pRawRef.current || !pSecRef.current || !pDashRef.current || !pillRef.current) return;

    let W = 0, H = 0;
    let P: { x: number; y: number }[] = [];
    const nums: FlowNum[] = [];
    let poolIdx = 0;
    const SPEED = 0.075;
    const CROSS_FLASH_MS = 260;
    let securedCount = 0;
    let securedTotal = 0;
    let lastPulse = 0;
    let rafId = 0;
    let last = performance.now();

    function nextVal() {
      const v = POOL[poolIdx % POOL.length];
      poolIdx++;
      return +(v + (Math.random() - 0.5) * 6).toFixed(2);
    }

    function pointAt(t: number) {
      const [p0, p1, p2, p3] = P;
      const u = 1 - t;
      const x = u * u * u * p0.x + 3 * u * u * t * p1.x + 3 * u * t * t * p2.x + t * t * t * p3.x;
      const y = u * u * u * p0.y + 3 * u * u * t * p1.y + 3 * u * t * t * p2.y + t * t * t * p3.y;
      return { x, y };
    }

    function splitPathD(tStart: number, tEnd: number) {
      const N = 30;
      let d = '';
      for (let i = 0; i <= N; i++) {
        const t = tStart + (tEnd - tStart) * (i / N);
        const p = pointAt(t);
        d += (i === 0 ? 'M ' : 'L ') + p.x.toFixed(1) + ' ' + p.y.toFixed(1) + ' ';
      }
      return d;
    }

    function setPath() {
      const r = stage.getBoundingClientRect();
      W = r.width; H = r.height;
      svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
      const padX = 14, padY = 14;
      const p0 = { x: padX, y: padY };
      const p1 = { x: W * 0.85, y: H * 0.18 };
      const p2 = { x: W * 0.15, y: H * 0.82 };
      const p3 = { x: W - padX, y: H - padY };
      P = [p0, p1, p2, p3];
      const d = `M ${p0.x} ${p0.y} C ${p1.x} ${p1.y}, ${p2.x} ${p2.y}, ${p3.x} ${p3.y}`;
      pRaw.setAttribute('d', d);
      pSec.setAttribute('d', splitPathD(0.5, 1));
      pDash.setAttribute('d', splitPathD(0.5, 1));
      const mid = pointAt(0.5);
      pill.style.left = mid.x + 'px';
      pill.style.top = mid.y + 'px';
    }

    function spawnOne(t0: number): FlowNum {
      const v = nextVal();
      const el = document.createElement('div');
      el.className = 'pl-num raw ' + (v >= 0 ? 'up' : 'dn');
      el.innerHTML = `<span class="pl-shield">${SHIELD_SVG}</span><span class="pl-val">${fmtPl(v)}</span>`;
      stage.appendChild(el);
      return { el, v, t: t0, state: 'raw', speed: SPEED * (0.85 + Math.random() * 0.35) };
    }

    function seed() {
      nums.forEach(n => n.el.remove());
      nums.length = 0;
      const COUNT = 9;
      for (let i = 0; i < COUNT; i++) nums.push(spawnOne(i / COUNT));
    }

    function updateHeader() {
      if (totalRef.current) {
        totalRef.current.textContent = fmtPl(securedTotal);
        (totalRef.current as HTMLElement).style.color = securedTotal >= 0 ? 'oklch(0.88 0.16 145)' : 'oklch(0.82 0.2 25)';
      }
      if (countRef.current) countRef.current.textContent = securedCount + ' trades shielded';
    }

    function pulsePill() {
      const now = performance.now();
      if (now - lastPulse < 180) return;
      lastPulse = now;
      pill.classList.add('pulse');
      setTimeout(() => pill.classList.remove('pulse'), 380);
    }

    function tick(now: number) {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;

      for (let i = nums.length - 1; i >= 0; i--) {
        const n = nums[i];
        n.t += n.speed * dt;

        if (n.state === 'raw' && n.t >= 0.5) {
          n.state = 'sec';
          n.el.classList.remove('raw');
          n.el.classList.add('sec', 'crossing');
          setTimeout(() => n.el.classList.remove('crossing'), CROSS_FLASH_MS);
          pulsePill();
          securedCount++;
          securedTotal += n.v;
          updateHeader();
        }

        if (n.t >= 1) {
          n.el.remove();
          nums.splice(i, 1);
          continue;
        }

        let opacity = 1;
        if (n.t < 0.06) opacity = n.t / 0.06;
        else if (n.t > 0.94) opacity = (1 - n.t) / 0.06;
        const dist = Math.abs(n.t - 0.5);
        if (dist < 0.04) opacity *= (dist / 0.04);

        const p = pointAt(n.t);
        n.el.style.opacity = String(opacity);
        n.el.style.transform = `translate(${p.x}px, ${p.y}px) translate(-50%, -50%)`;
      }

      const minT = nums.reduce((m, n) => Math.min(m, n.t), Infinity);
      if (minT > 1 / 9 || nums.length < 8) {
        nums.push(spawnOne(0));
      }

      rafId = requestAnimationFrame(tick);
    }

    function start() {
      setPath();
      seed();
      securedCount = 0; securedTotal = 0;
      nums.forEach(n => {
        if (n.t >= 0.5) {
          n.state = 'sec';
          n.el.classList.remove('raw');
          n.el.classList.add('sec');
          securedCount++;
          securedTotal += n.v;
        }
      });
      updateHeader();
      last = performance.now();
      rafId = requestAnimationFrame(tick);
    }

    rafId = requestAnimationFrame(start);

    let resizeT: ReturnType<typeof setTimeout>;
    const onResize = () => {
      clearTimeout(resizeT);
      resizeT = setTimeout(() => setPath(), 150);
    };
    window.addEventListener('resize', onResize);

    return () => {
      cancelAnimationFrame(rafId);
      clearTimeout(resizeT);
      window.removeEventListener('resize', onResize);
      nums.forEach(n => n.el.remove());
    };
  }, []);

  return (
    <div className="player phone-wrap" style={{ background: 'transparent', border: 'none', boxShadow: 'none', padding: 0, backdropFilter: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="phone" style={{
        position: 'relative', zIndex: 1,
        width: 380, height: 660,
        background: 'linear-gradient(180deg, #111827, #0a0f20)',
        borderRadius: 46,
        border: '1px solid rgba(120,160,255,0.22)',
        boxShadow: '0 40px 100px -20px rgba(0,0,0,0.7), 0 0 80px -10px oklch(0.55 0.22 260 / 0.35), inset 0 0 0 3px rgba(255,255,255,0.04), inset 0 1px 0 rgba(255,255,255,0.08)',
        padding: 12,
        display: 'flex', flexDirection: 'column',
      }}>
        <div className="phone-notch" style={{
          position: 'absolute', top: 12, left: '50%', transform: 'translateX(-50%)',
          width: 110, height: 28, borderRadius: 999, background: '#000',
          border: '1px solid rgba(255,255,255,0.06)', zIndex: 3,
        }} />
        <div className="phone-home" style={{
          position: 'absolute', bottom: 8, left: '50%', transform: 'translateX(-50%)',
          width: 120, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.3)',
        }} />
        <div className="phone-screen" style={{
          flex: 1, borderRadius: 34,
          background: 'radial-gradient(ellipse at 50% 0%, oklch(0.22 0.06 260) 0%, oklch(0.12 0.04 260) 60%, oklch(0.06 0.02 260) 100%)',
          overflow: 'hidden', position: 'relative',
          display: 'flex', flexDirection: 'column',
          padding: '44px 0 20px',
        }}>
          {/* Top bar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12, color: 'var(--ink-2)', margin: '0 16px 6px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontFamily: "'JetBrains Mono', monospace", letterSpacing: '0.04em', color: 'var(--ink-1)', fontSize: 10, textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><path d="M15 18l-6-6 6-6" /></svg>
              <span>Live P/L Flow</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontFamily: "'JetBrains Mono', monospace", fontSize: 10, letterSpacing: '0.08em', color: 'oklch(0.85 0.15 245)', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'oklch(0.8 0.18 245)', boxShadow: '0 0 8px oklch(0.8 0.18 245)' }} />
              Insuring
            </div>
          </div>

          {/* Balance */}
          <div style={{ margin: '10px 16px 14px', paddingBottom: 14, borderBottom: '1px solid var(--line)' }}>
            <div style={{ fontSize: 10, color: 'var(--ink-3)', letterSpacing: '0.16em', textTransform: 'uppercase', fontFamily: "'JetBrains Mono', monospace" }}>Secured P/L</div>
            <div ref={totalRef} style={{ fontFamily: "'Instrument Serif', serif", fontSize: 34, color: 'oklch(0.88 0.16 145)', marginTop: 4, letterSpacing: '-0.01em', lineHeight: 1 }}>+$0.00</div>
            <div ref={countRef} style={{ fontSize: 10, color: 'var(--ink-3)', letterSpacing: '0.08em', marginTop: 6, fontFamily: "'JetBrains Mono', monospace" }}>0 trades shielded</div>
          </div>

          {/* Flow stage */}
          <div ref={stageRef} className="flow-stage" style={{ position: 'relative', flex: 1, overflow: 'hidden', margin: '4px 0 0' }}>
            <svg ref={svgRef} className="flow-svg" preserveAspectRatio="none" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 1, overflow: 'visible' }}>
              <defs>
                <linearGradient id="secGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="oklch(0.55 0.22 262)" />
                  <stop offset="50%" stopColor="oklch(0.78 0.18 255)" />
                  <stop offset="100%" stopColor="oklch(0.55 0.22 262)" />
                </linearGradient>
              </defs>
              <path ref={pRawRef} className="flow-path-raw" fill="none" stroke="rgba(160,180,220,0.22)" strokeWidth={1.5} strokeLinecap="round" d="" />
              <path ref={pSecRef} className="flow-path-sec" fill="none" stroke="url(#secGrad)" strokeWidth={2.5} strokeLinecap="round" style={{ filter: 'drop-shadow(0 0 6px oklch(0.7 0.2 255 / 0.8))' }} d="" />
              <path ref={pDashRef} className="flow-path-dash" fill="none" stroke="oklch(0.95 0.1 255 / 0.9)" strokeWidth={2.5} strokeLinecap="round" strokeDasharray="4 14" style={{ animation: 'dashFlow 1.6s linear infinite' }} d="" />
            </svg>

            {/* TV Pill at midpoint */}
            <div ref={pillRef} className="tv-pill" style={{ position: 'absolute', top: 0, left: 0, zIndex: 5, pointerEvents: 'none', transform: 'translate(-50%, -50%)', width: 76, height: 82, display: 'grid', placeItems: 'center' }}>
              <div className="tv-shield" aria-hidden="true" style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', filter: 'drop-shadow(0 0 18px oklch(0.7 0.2 255 / 0.9))', transition: 'transform .3s cubic-bezier(.4,2,.6,1), filter .3s ease' }}>
                <svg viewBox="0 0 76 82" preserveAspectRatio="xMidYMid meet" style={{ width: '100%', height: '100%' }}>
                  <defs>
                    <linearGradient id="shieldFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="oklch(0.42 0.18 262)" />
                      <stop offset="55%" stopColor="oklch(0.28 0.16 265)" />
                      <stop offset="100%" stopColor="oklch(0.14 0.08 262)" />
                    </linearGradient>
                  </defs>
                  <path style={{ fill: 'url(#shieldFill)', stroke: 'oklch(0.88 0.15 245 / 0.9)', strokeWidth: 1.2 }} d="M38 3 L70 12 L70 42 C70 58 56 72 38 79 C20 72 6 58 6 42 L6 12 Z" />
                </svg>
              </div>
              <div className="tv-pill-inner" style={{ position: 'relative', zIndex: 2, width: 40, height: 40, display: 'grid', placeItems: 'center', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.45))', transition: 'transform .3s cubic-bezier(.4,2,.6,1)' }}>
                <div className="w-[34px] h-[34px] rounded-[10px] bg-[linear-gradient(135deg,oklch(0.62_0.22_260),oklch(0.45_0.23_268))] border border-[oklch(0.45_0.23_268/0.4)] flex items-center justify-center text-white font-serif text-[18px]"
                  style={{ boxShadow: '0 6px 16px -4px oklch(0.5 0.22 262 / 0.4)' }}
                >TV</div>
              </div>
            </div>
          </div>

          {/* Legend */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '10px 16px 0', fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: 'var(--ink-3)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'rgba(160,180,220,0.4)' }} />
              Raw P/L
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'oklch(0.7 0.2 255)', boxShadow: '0 0 6px oklch(0.7 0.2 255 / 0.9)' }} />
              Insured by TradeVerse
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .pl-num {
          position: absolute;
          top: 0; left: 0;
          font-family: 'JetBrains Mono', monospace;
          font-size: 13px;
          font-weight: 600;
          letter-spacing: 0.01em;
          white-space: nowrap;
          will-change: transform, opacity;
          display: inline-flex;
          align-items: center;
          gap: 5px;
          z-index: 2;
        }
        .pl-num.raw.up { color: oklch(0.78 0.15 145 / 0.7); }
        .pl-num.raw.dn { color: oklch(0.72 0.18 25 / 0.7); }
        .pl-num.raw .pl-shield { display: none; }
        .pl-num.sec {
          padding: 3px 9px 3px 6px;
          border-radius: 999px;
          background: linear-gradient(180deg, oklch(0.16 0.04 260), oklch(0.08 0.03 260));
          border: 1px solid oklch(0.6 0.22 262 / 0.6);
          box-shadow: 0 0 0 1px oklch(0.8 0.18 245 / 0.25), 0 4px 14px -2px oklch(0.6 0.22 262 / 0.55), inset 0 0 10px -2px oklch(0.85 0.17 245 / 0.25);
          font-weight: 700;
        }
        .pl-num.sec.up { color: oklch(0.9 0.18 145); text-shadow: 0 0 10px oklch(0.8 0.2 145 / 0.5); }
        .pl-num.sec.dn { color: oklch(0.84 0.2 25); text-shadow: 0 0 10px oklch(0.75 0.22 25 / 0.5); }
        .pl-num.sec .pl-shield {
          width: 14px; height: 14px;
          display: grid; place-items: center;
          color: oklch(0.9 0.15 245);
          filter: drop-shadow(0 0 4px oklch(0.8 0.18 245 / 0.9));
          flex-shrink: 0;
        }
        .pl-num.sec .pl-shield svg { width: 14px; height: 14px; }
        .pl-num.crossing { filter: blur(0.5px) brightness(1.4); }
        .tv-pill.pulse .tv-shield { transform: scale(1.08); filter: drop-shadow(0 0 28px oklch(0.78 0.2 255 / 1)); }
        .tv-pill.pulse .tv-pill-inner { transform: scale(1.06); }
      `}</style>
    </div>
  );
}

/* ─── Featured Drops ─── */
const DROPS = [
  { title: 'Obsidian Bloom', bpm: 92, tag: 'Ambient', c1: '#24306b', c2: '#0a1230' },
  { title: 'Sol Fracture', bpm: 124, tag: 'Synthwave', c1: '#3a1760', c2: '#0a0a2a' },
  { title: 'Velvet Current', bpm: 78, tag: 'Lo-fi', c1: '#1f4b6e', c2: '#081325' },
  { title: 'Aurora Cut', bpm: 140, tag: 'Cinematic', c1: '#0f5a66', c2: '#041225' },
  { title: 'Paper Comet', bpm: 102, tag: 'Indie', c1: '#5e2a6e', c2: '#10122c' },
  { title: 'Midnight Relay', bpm: 120, tag: 'House', c1: '#1a3e8a', c2: '#050a24' },
  { title: 'Halogen Glow', bpm: 86, tag: 'Downtempo', c1: '#2b1f6e', c2: '#08082a' },
  { title: 'Copper Static', bpm: 132, tag: 'Techno', c1: '#6e3b1f', c2: '#1c0f22' },
];

function FeaturedDrops() {
  return (
    <section className="section" style={{ position: 'relative', zIndex: 2, padding: '40px 48px 120px', maxWidth: 1440, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 28 }}>
        <div>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><circle cx="12" cy="12" r="9" /><path d="m8 12 3 3 5-6" /></svg>
            <h2 style={{ fontFamily: "'Instrument Serif', serif", fontWeight: 400, fontSize: 32, margin: 0, letterSpacing: '-0.01em', color: 'var(--ink-0)' }}>Featured drops</h2>
          </div>
          <div style={{ color: 'var(--ink-2)', fontSize: 14, maxWidth: 520, marginTop: 6 }}>Handpicked instrumentals and atmospheres tuned for creators, streamers and storytellers.</div>
        </div>
        <span style={{ color: 'var(--ink-1)', fontSize: 13, display: 'inline-flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
          View all
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><path d="M5 12h14M13 5l7 7-7 7" /></svg>
        </span>
      </div>

      <div className="drops-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
        {DROPS.map((d) => (
          <div key={d.title} className="drop" style={{
            position: 'relative', padding: 18, borderRadius: 18,
            background: 'linear-gradient(180deg, rgba(14,20,44,0.6), rgba(8,12,28,0.4))',
            border: '1px solid var(--line)', overflow: 'hidden', cursor: 'pointer',
            transition: 'all .25s ease',
          }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.borderColor = 'rgba(120,160,255,0.3)';
              (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.borderColor = 'var(--line)';
              (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
            }}
          >
            <div style={{
              aspectRatio: '1', borderRadius: 12, marginBottom: 14,
              position: 'relative', overflow: 'hidden',
              background: `linear-gradient(135deg, ${d.c1}, ${d.c2})`,
            }}>
              <div style={{
                position: 'absolute', inset: 0,
                background: 'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.25), transparent 50%), repeating-linear-gradient(0deg, transparent 0 3px, rgba(0,0,0,0.1) 3px 4px)',
                mixBlendMode: 'overlay',
              }} />
              <div style={{ position: 'absolute', left: 14, right: 14, bottom: 14, display: 'flex', alignItems: 'flex-end', gap: 3, height: 36 }}>
                {Array.from({ length: 7 }).map((_, i) => (
                  <span key={i} style={{
                    flex: 1, background: 'rgba(255,255,255,0.85)', borderRadius: 2,
                    animation: 'eqDance 1.2s ease-in-out infinite',
                    animationDelay: `-${[0.3, 0.6, 0.1, 0.8, 0.2, 0.5, 0.4][i]}s`,
                    height: '20%',
                  }} />
                ))}
              </div>
            </div>
            <h3 style={{ fontSize: 15, margin: '0 0 4px', fontWeight: 600, color: 'var(--ink-0)' }}>{d.title}</h3>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12, color: 'var(--ink-2)', fontFamily: "'JetBrains Mono', monospace" }}>
              <span>{d.bpm} BPM</span>
              <span style={{ padding: '3px 8px', borderRadius: 999, background: 'rgba(255,255,255,0.05)', border: '1px solid var(--line)', fontSize: 10, letterSpacing: '0.05em', textTransform: 'uppercase', color: 'var(--ink-1)' }}>{d.tag}</span>
            </div>
          </div>
        ))}
      </div>

      <style>{`
        @keyframes eqDance { 0%,100%{height:20%} 50%{height:90%} }
        @media (max-width: 1024px) {
          .drops-grid { grid-template-columns: repeat(2, 1fr) !important; }
        }
        @media (max-width: 640px) {
          .drops-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </section>
  );
}

/* ─── Nav icons ─── */
const NavIconTracks = <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" style={{ width: 14, height: 14 }}><circle cx="6" cy="18" r="3" /><path d="M9 18V5l12-2v13" /><circle cx="18" cy="16" r="3" /></svg>;
const NavIconSoundscapes = <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" style={{ width: 14, height: 14 }}><path d="M3 12h2l2-7 3 14 3-10 2 6h6" /></svg>;
const NavIconSpotlight = <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ width: 14, height: 14 }}><path d="M12 3 L14 10 L21 12 L14 14 L12 21 L10 14 L3 12 L10 10 Z" /></svg>;
const NavIconCreators = <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" style={{ width: 14, height: 14 }}><circle cx="9" cy="8" r="3" /><path d="M3 20c0-3 3-5 6-5s6 2 6 5" /><circle cx="17" cy="7" r="2.5" /><path d="M15 15c3 0 6 2 6 5" /></svg>;
const NavIconPricing = <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ width: 14, height: 14 }}><path d="M20 12 12 20 3 11V3h8z" /><circle cx="8" cy="8" r="1.2" fill="currentColor" /></svg>;
const IconSearch = <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" style={{ width: 14, height: 14 }}><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>;
const IconUser = <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" style={{ width: 14, height: 14 }}><circle cx="12" cy="9" r="3.5" /><path d="M4 20c0-4 4-6 8-6s8 2 8 6" /></svg>;
const IconArrow = <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" style={{ width: 16, height: 16 }}><path d="M5 12h14M13 5l7 7-7 7" /></svg>;
const IconPlay = <svg viewBox="0 0 24 24" fill="currentColor" style={{ width: 16, height: 16 }}><path d="M8 5v14l11-7z" /></svg>;

/* ─── Landing Page ─── */
export default function LandingPage() {
  useDocumentTitle('TradeVerse — Insured trading for every position');
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinkClass = 'flex items-center gap-2 px-[14px] py-[9px] rounded-full text-[14px] font-medium transition-all duration-200 no-underline';
  const btnBase = 'inline-flex items-center gap-2 px-4 py-[10px] rounded-full text-[14px] font-semibold cursor-pointer transition-all duration-180 no-underline';

  return (
    <div className="min-h-dvh overflow-x-hidden" style={{ background: 'var(--bg-0)', color: 'var(--ink-0)', fontFamily: "'Inter', system-ui, sans-serif", WebkitFontSmoothing: 'antialiased' }}>
      {/* Nav */}
      <nav style={{ position: 'relative', zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '22px 48px', maxWidth: 1440, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div className="w-[38px] h-[38px] grid place-items-center"
            style={{ filter: 'drop-shadow(0 0 14px oklch(0.68 0.2 255 / 0.55))' }}
          >
            <div className="w-[34px] h-[34px] rounded-[10px] bg-[linear-gradient(135deg,oklch(0.62_0.22_260),oklch(0.45_0.23_268))] border border-[oklch(0.45_0.23_268/0.4)] flex items-center justify-center text-white font-serif text-[18px]"
              style={{ boxShadow: '0 6px 16px -4px oklch(0.5 0.22 262 / 0.4)' }}
            >TV</div>
          </div>
          <div>
            <div style={{ fontFamily: "'Instrument Serif', serif", fontSize: 22, letterSpacing: '0.02em', lineHeight: 1 }}>TradeVerse</div>
            <div style={{ fontSize: 9, letterSpacing: '0.45em', color: 'var(--ink-2)', marginTop: 4, fontWeight: 500 }}>INSURED</div>
          </div>
        </div>

        <div className="nav-links hidden lg:flex" style={{ gap: 8, alignItems: 'center' }}>
          <a href="#" className={navLinkClass} style={{ color: 'var(--ink-1)', textDecoration: 'none' }} onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.05)', e.currentTarget.style.color = 'var(--ink-0)')} onMouseLeave={e => (e.currentTarget.style.background = 'transparent', e.currentTarget.style.color = 'var(--ink-1)')}>
            {NavIconTracks} Tracks
          </a>
          <a href="#" className={navLinkClass} style={{ color: 'var(--ink-1)', textDecoration: 'none' }} onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.05)', e.currentTarget.style.color = 'var(--ink-0)')} onMouseLeave={e => (e.currentTarget.style.background = 'transparent', e.currentTarget.style.color = 'var(--ink-1)')}>
            {NavIconSoundscapes} Soundscapes
          </a>
          <a href="#" className={navLinkClass} style={{ color: 'var(--ink-1)', textDecoration: 'none' }} onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.05)', e.currentTarget.style.color = 'var(--ink-0)')} onMouseLeave={e => (e.currentTarget.style.background = 'transparent', e.currentTarget.style.color = 'var(--ink-1)')}>
            {NavIconSpotlight} Spotlight
          </a>
          <a href="#" className={navLinkClass} style={{ color: 'var(--ink-1)', textDecoration: 'none' }} onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.05)', e.currentTarget.style.color = 'var(--ink-0)')} onMouseLeave={e => (e.currentTarget.style.background = 'transparent', e.currentTarget.style.color = 'var(--ink-1)')}>
            {NavIconCreators} For creators
          </a>
          <a href="#" className={navLinkClass} style={{ color: 'var(--ink-1)', textDecoration: 'none' }} onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.05)', e.currentTarget.style.color = 'var(--ink-0)')} onMouseLeave={e => (e.currentTarget.style.background = 'transparent', e.currentTarget.style.color = 'var(--ink-1)')}>
            {NavIconPricing} Pricing
          </a>
        </div>

        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <button className={`${btnBase} hidden sm:inline-flex`} style={{ border: '1px solid var(--line-2)', background: 'rgba(255,255,255,0.03)', color: 'var(--ink-0)' }} onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.07)')} onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.03)')}>
            {IconSearch} Search library
          </button>
          <button className={btnBase} style={{
            background: 'linear-gradient(180deg, oklch(0.7 0.2 255), oklch(0.52 0.22 262))',
            boxShadow: '0 1px 0 rgba(255,255,255,0.3) inset, 0 8px 24px -6px oklch(0.5 0.22 262 / 0.55)',
            color: 'white', border: 'none',
          }} onClick={() => navigate('/login')} onMouseEnter={e => (e.currentTarget.style.filter = 'brightness(1.08)')} onMouseLeave={e => (e.currentTarget.style.filter = 'none')}>
            {IconUser} Sign in
          </button>
          <button className="lg:hidden inline-flex items-center justify-center w-10 h-10 rounded-full border border-line-2 bg-[rgba(255,255,255,0.03)] text-ink-1" onClick={() => setMobileMenuOpen(o => !o)}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><path d="M4 6h16M4 12h16M4 18h16" /></svg>
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden" style={{ position: 'relative', zIndex: 10, padding: '0 48px 20px', maxWidth: 1440, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 4 }}>
          {['Tracks', 'Soundscapes', 'Spotlight', 'For creators', 'Pricing'].map((label) => (
            <a key={label} href="#" className="text-[14px] font-medium py-2" style={{ color: 'var(--ink-1)' }}>{label}</a>
          ))}
        </div>
      )}

      {/* Hero */}
      <section style={{ position: 'relative', minHeight: 780, padding: '20px 48px 80px', maxWidth: 1440, margin: '0 auto' }}>
        <div style={{ position: 'absolute', inset: '-80px -60px 0 -60px', zIndex: 0, pointerEvents: 'none', overflow: 'hidden' }}>
          <StreamCanvas />
          <div style={{
            position: 'absolute', top: 0, bottom: 0, left: '50%', width: 2, transform: 'translateX(-50%)',
            background: 'linear-gradient(180deg, transparent 0%, oklch(0.85 0.12 230 / 0.15) 8%, oklch(0.92 0.1 230 / 0.9) 35%, oklch(1 0.05 230 / 1) 55%, oklch(0.92 0.1 230 / 0.9) 70%, transparent 100%)',
            filter: 'blur(0.6px)',
            boxShadow: '0 0 40px 8px oklch(0.7 0.2 240 / 0.4), 0 0 120px 20px oklch(0.55 0.22 255 / 0.3)',
            mixBlendMode: 'screen',
          }} />
          <div style={{
            position: 'absolute', inset: 0, pointerEvents: 'none',
            background: 'radial-gradient(ellipse at 50% 100%, oklch(0.55 0.22 260 / 0.25), transparent 55%), radial-gradient(ellipse at 50% 0%, transparent 40%, var(--bg-0) 100%)',
          }} />
        </div>

        <div className="hero-inner" style={{ position: 'relative', zIndex: 2, display: 'grid', gridTemplateColumns: '1.1fr 1fr', gap: 48, paddingTop: 40, alignItems: 'start' }}>
          <div>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 10,
              padding: '6px 14px 6px 6px', borderRadius: 999,
              background: 'rgba(255,255,255,0.04)', border: '1px solid var(--line-2)',
              fontSize: 13, color: 'var(--ink-1)', backdropFilter: 'blur(10px)',
            }}>
              <span style={{
                display: 'inline-grid', placeItems: 'center',
                width: 22, height: 22, borderRadius: 999,
                background: 'linear-gradient(135deg, var(--blue), var(--deep))',
                fontSize: 10, fontWeight: 700, letterSpacing: '0.05em', color: 'white',
              }}>NEW</span>
              Every trade insured the moment it opens
            </div>

            <h1 style={{
              fontFamily: "'Instrument Serif', serif", fontWeight: 400,
              fontSize: 'clamp(48px, 6.4vw, 92px)', lineHeight: 0.98,
              letterSpacing: '-0.02em', margin: '28px 0 26px', textWrap: 'pretty',
            }}>
              Trade with<br />
              <em style={{
                fontStyle: 'italic',
                background: 'linear-gradient(100deg, oklch(0.78 0.17 245), oklch(0.62 0.21 260) 50%, oklch(0.82 0.14 220))',
                WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent',
              }}>every position</em><br />
              insured
            </h1>

            <p style={{ color: 'var(--ink-1)', fontSize: 17, lineHeight: 1.55, maxWidth: 520, margin: '0 0 32px' }}>
              TradeVerse routes your live P/L through an on-chain shield the moment a trade is opened — so profits and drawdowns are protected end to end. Connect your broker, set your coverage, and watch every trade clear the shield in real time.
            </p>

            <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 18 }}>
              <button className={btnBase} style={{
                padding: '14px 22px', fontSize: 15,
                background: 'linear-gradient(180deg, oklch(0.7 0.2 255), oklch(0.52 0.22 262))',
                boxShadow: '0 1px 0 rgba(255,255,255,0.3) inset, 0 8px 24px -6px oklch(0.5 0.22 262 / 0.55)',
                color: 'white', border: 'none',
              }} onClick={() => navigate('/login')} onMouseEnter={e => (e.currentTarget.style.filter = 'brightness(1.08)')} onMouseLeave={e => (e.currentTarget.style.filter = 'none')}>
                Insure your trades {IconArrow}
              </button>
              <button className={btnBase} style={{ padding: '14px 22px', fontSize: 15, border: '1px solid var(--line-2)', background: 'rgba(255,255,255,0.03)', color: 'var(--ink-0)' }} onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.07)')} onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.03)')}>
                {IconPlay} See it live
              </button>
            </div>

            <div style={{ fontSize: 12, color: 'var(--ink-3)', letterSpacing: '0.01em' }}>
              Works with MT4, MT5 &amp; cTrader <span style={{ opacity: 0.5, margin: '0 8px' }}>·</span> Payouts in under 24h <span style={{ opacity: 0.5, margin: '0 8px' }}>·</span> 14-day free trial
            </div>
          </div>

          <PhoneFlow />
        </div>
      </section>

      <FeaturedDrops />

      <style>{`
        @media (max-width: 1024px) {
          .hero-inner { grid-template-columns: 1fr !important; }
          .phone-wrap { justify-self: center !important; }
        }
        @media (max-width: 640px) {
          .hero-inner { padding-top: 20px !important; }
        }
      `}</style>
    </div>
  );
}
