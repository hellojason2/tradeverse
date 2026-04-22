import { useState } from 'react';

type Provider = {
  n: string;
  i: string;
  c: string;
  s: string;
  wr: string;
  dd: string;
  aum: string;
  fol: string;
  ps: string;
  st: 'Active' | 'Fundraising';
  sc: 'b-green' | 'b-yellow';
};

const PROVIDERS: Provider[] = [
  { n: 'AlphaSignal', i: 'AS', c: 'oklch(0.68 0.19 255),oklch(0.86 0.12 220)', s: 'Momentum Trading', wr: '72%', dd: '8.3%', aum: '$124K', fol: '2,400', ps: '20%', st: 'Active', sc: 'b-green' },
  { n: 'QuantFlow', i: 'QF', c: 'oklch(0.7 0.2 300),oklch(0.68 0.22 340)', s: 'Mean Reversion', wr: '65%', dd: '12.1%', aum: '$45K', fol: '890', ps: '15%', st: 'Fundraising', sc: 'b-yellow' },
  { n: 'TrendMaster', i: 'TM', c: 'oklch(0.72 0.17 150),oklch(0.86 0.12 220)', s: 'Scalping Pro', wr: '58%', dd: '14.7%', aum: '$340K', fol: '5,100', ps: '25%', st: 'Active', sc: 'b-green' },
  { n: 'CryptoRider', i: 'CR', c: 'oklch(0.82 0.15 85),oklch(0.74 0.17 55)', s: 'Swing Trading', wr: '78%', dd: '6.2%', aum: '$890K', fol: '8,200', ps: '30%', st: 'Active', sc: 'b-green' },
  { n: 'SignalWhale', i: 'SW', c: 'oklch(0.86 0.12 220),oklch(0.68 0.19 255)', s: 'Arbitrage', wr: '52%', dd: '18.4%', aum: '$67K', fol: '340', ps: '15%', st: 'Fundraising', sc: 'b-yellow' },
  { n: 'TradeLeader', i: 'TL', c: 'oklch(0.68 0.22 340),oklch(0.7 0.2 300)', s: 'DCA Strategy', wr: '69%', dd: '9.8%', aum: '$210K', fol: '3,600', ps: '20%', st: 'Active', sc: 'b-green' },
];

const TABS = ['All', 'Copy Trading', 'Insurance'] as const;

export function SignalPlazaPage() {
  const [activeTab, setActiveTab] = useState<(typeof TABS)[number]>('All');

  return (
    <div className="pv act">
      <div className="flex aic jcb mb6" style={{ flexWrap: 'wrap', gap: 12 }}>
        <div className="flex aic gap3">
          <input className="fi" placeholder="Search signal providers..." style={{ width: 280 }} />
          <select className="fi fs" style={{ width: 160 }}>
            <option>All Status</option>
            <option>Fundraising</option>
            <option>Active</option>
          </select>
          <select className="fi fs" style={{ width: 180 }}>
            <option>Sort: Performance</option>
            <option>Sort: AUM</option>
            <option>Sort: Newest</option>
          </select>
        </div>
        <div className="tabs">
          {TABS.map((t) => (
            <div
              key={t}
              className={activeTab === t ? 'tab act' : 'tab'}
              onClick={() => setActiveTab(t)}
            >
              {t}
            </div>
          ))}
        </div>
      </div>
      <div className="g3 mb6">
        {PROVIDERS.map((p) => {
          const ddRed = parseFloat(p.dd) > 10;
          const dotCls = p.st === 'Active' ? 's-dot green' : 's-dot yellow';
          const btnCls = p.st === 'Active' ? 'btn btn-outline btn-sm' : 'btn btn-green btn-sm';
          const btnLabel = p.st === 'Active' ? 'View' : 'Subscribe';
          return (
            <div className="sig-card" key={p.n}>
              <div className="flex aic gap3 mb4">
                <div className="av" style={{ background: `linear-gradient(135deg,${p.c})` }}>
                  {p.i}
                </div>
                <div style={{ flex: 1 }}>
                  <div className="f6" style={{ fontSize: 15 }}>{p.n}</div>
                  <div className="fs11 t3 mt2 mono" style={{ letterSpacing: '0.06em', textTransform: 'uppercase' }}>{p.s}</div>
                </div>
                <span className={`badge ${p.sc}`}>
                  <span className={dotCls}></span>
                  {p.st}
                </span>
              </div>
              <div className="g2 mb4" style={{ gap: 10 }}>
                <div style={{ padding: '10px 12px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--line)', borderRadius: 8 }}>
                  <div className="fs11 t3 mono" style={{ letterSpacing: '0.06em', textTransform: 'uppercase' }}>Win Rate</div>
                  <div className="f6 tg mono mt2" style={{ fontSize: 15 }}>{p.wr}</div>
                </div>
                <div style={{ padding: '10px 12px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--line)', borderRadius: 8 }}>
                  <div className="fs11 t3 mono" style={{ letterSpacing: '0.06em', textTransform: 'uppercase' }}>Max DD</div>
                  <div className={`f6 ${ddRed ? 'tr' : 'tg'} mono mt2`} style={{ fontSize: 15 }}>{p.dd}</div>
                </div>
                <div style={{ padding: '10px 12px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--line)', borderRadius: 8 }}>
                  <div className="fs11 t3 mono" style={{ letterSpacing: '0.06em', textTransform: 'uppercase' }}>AUM</div>
                  <div className="f6 mono mt2" style={{ fontSize: 15 }}>{p.aum}</div>
                </div>
                <div style={{ padding: '10px 12px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--line)', borderRadius: 8 }}>
                  <div className="fs11 t3 mono" style={{ letterSpacing: '0.06em', textTransform: 'uppercase' }}>Followers</div>
                  <div className="f6 mono mt2" style={{ fontSize: 15 }}>{p.fol}</div>
                </div>
              </div>
              <div className="flex aic jcb">
                <span className="fs11 t3 mono">Profit share: {p.ps}</span>
                <button className={btnCls}>{btnLabel}</button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default SignalPlazaPage;
