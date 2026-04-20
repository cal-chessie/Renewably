'use client';

import React from 'react';
import { Card, Button } from '../ui/primitives';
import { IconCheck, IconArrow } from '../ui/icons';

interface StepCompleteData {
  email?: string;
  contact_name?: string;
  counties?: string[];
}

export default function StepComplete({ data }: { data: StepCompleteData }) {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const [checks, setChecks] = React.useState<string[]>([]);
  const items = [
    'Log in to your portal',
    'Add remaining team members',
    'Upload your past clients (CSV)',
    'Connect inverter APIs',
    'Book kick-off training call',
  ];
  const togCheck = (item: string) => setChecks(c => c.includes(item) ? c.filter(x => x !== item) : [...c, item]);

  // Confetti
  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const parent = canvas.parentElement;
    try {
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      const W = canvas.width = parent.offsetWidth;
      const H = canvas.height = parent.offsetHeight;
      const colors = ['#F2CC2E', 'oklch(0.76 0.17 145)', 'oklch(0.78 0.13 65)', '#F2CC2E', '#ffffff'];
      const parts = Array.from({ length: 80 }, () => ({
        x: W / 2 + (Math.random() - 0.5) * 300, y: H * 0.2,
        vx: (Math.random() - 0.5) * 10, vy: -Math.random() * 14 - 4,
        s: Math.random() * 6 + 3, c: colors[Math.floor(Math.random() * colors.length)],
        r: Math.random() * 360, rv: (Math.random() - 0.5) * 10, life: 1,
      }));
      let raf = 0;
      const go = () => {
        ctx.clearRect(0, 0, W, H);
        let alive = false;
        for (const p of parts) {
          if (p.life <= 0) continue;
          alive = true;
          p.vy += 0.32; p.x += p.vx; p.y += p.vy;
          p.r += p.rv; p.life -= 0.008;
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(p.r * Math.PI / 180);
          ctx.globalAlpha = Math.max(0, p.life);
          ctx.fillStyle = p.c;
          ctx.fillRect(-p.s / 2, -p.s / 2, p.s, p.s * 0.6);
          ctx.restore();
        }
        if (alive) raf = requestAnimationFrame(go);
      };
      const t = setTimeout(go, 200);
      return () => { clearTimeout(t); cancelAnimationFrame(raf); };
    } catch {
      // ignore canvas errors
    }
  }, []);

  return (
    <div className="fade-up" style={{ position: 'relative' }}>
      <canvas ref={canvasRef} style={{
        position: 'absolute', top: 0, left: 0, width: '100%', height: 320,
        pointerEvents: 'none', zIndex: 5,
      }} />

      <div style={{ textAlign: 'center', marginBottom: 28, position: 'relative' }}>
        <div style={{
          display: 'inline-grid', placeItems: 'center',
          width: 72, height: 72, borderRadius: '50%',
          background: 'var(--solar-soft)', border: '1px solid oklch(0.70 0.17 95 / 0.3)',
          marginBottom: 16,
          color: 'var(--solar)',
        }}>
          <IconCheck size={28} />
        </div>
        <div className="mono" style={{ fontSize: 10.5, color: 'var(--solar)', letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 8, fontWeight: 500 }}>
          Setup complete
        </div>
        <h1 style={{ fontSize: 36, fontWeight: 600, letterSpacing: '-0.03em', margin: '0 0 8px', lineHeight: 1.1 }}>
          You&apos;re all set, <span style={{ color: 'var(--solar)' }}>{(data.contact_name || 'Sean').split(' ')[0]}</span>.
        </h1>
        <p style={{ fontSize: 14, color: 'var(--ink-3)', margin: 0, maxWidth: 400, marginLeft: 'auto', marginRight: 'auto', lineHeight: 1.5 }}>
          Your SolarPilot portal is provisioned and your first qualified leads are being routed.
        </p>
      </div>

      {/* Portal handoff */}
      <Card tone="raised" style={{ marginBottom: 16 }}>
        <div className="ob-portal-handoff" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, alignItems: 'center' }}>
          <div>
            <div className="mono" style={{ fontSize: 10, color: 'var(--ink-4)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 6 }}>Your portal</div>
            <div className="mono" style={{ fontSize: 15, color: 'var(--solar)', fontWeight: 500, letterSpacing: '-0.005em' }}>
              app.solarpilot.renewably.ie
            </div>
            <div style={{ fontSize: 11.5, color: 'var(--ink-4)', marginTop: 4 }}>
              Login link sent to {data.email || 'sean@powersolarltd.ie'}
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button size="lg" icon={<IconArrow size={14} />}>Open my portal</Button>
          </div>
        </div>
      </Card>

      {/* Stats tiles */}
      <div className="ob-stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, marginBottom: 16 }}>
        {[
          { k: 'Counties', v: (data.counties || ['Dublin','Kildare','Meath','Wicklow','Wexford','Louth']).length, u: 'service area' },
          { k: 'Team seats', v: 2, u: 'provisioned' },
          { k: 'Plan', v: 'Pro', u: 'annual · €3,490/yr' },
        ].map((s, i) => (
          <Card key={i} style={{ padding: 18 }}>
            <div className="mono" style={{ fontSize: 9.5, color: 'var(--ink-4)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6 }}>{s.k}</div>
            <div className="tabular" style={{ fontSize: 22, fontWeight: 600, letterSpacing: '-0.025em' }}>{s.v}</div>
            <div style={{ fontSize: 10.5, color: 'var(--ink-4)', marginTop: 2 }}>{s.u}</div>
          </Card>
        ))}
      </div>

      {/* Checklist */}
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div className="mono" style={{ fontSize: 10, color: 'var(--ink-4)', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
            Next steps · first week
          </div>
          <div className="mono" style={{ fontSize: 10, color: 'var(--solar)' }}>
            {checks.length} / {items.length} done
          </div>
        </div>
        <div style={{ display: 'grid', gap: 2 }}>
          {items.map((item, i) => {
            const on = checks.includes(item);
            return (
              <label key={item} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '9px 10px',
                borderRadius: 5, cursor: 'pointer',
                background: on ? 'var(--bg-2)' : 'transparent',
                transition: 'background 140ms',
              }}>
                <input type="checkbox" checked={on} onChange={() => togCheck(item)} />
                <span className="mono" style={{ fontSize: 10.5, color: 'var(--ink-5)', letterSpacing: '0.04em' }}>
                  {String(i + 1).padStart(2, '0')}
                </span>
                <span style={{
                  fontSize: 13,
                  color: on ? 'var(--ink-4)' : 'var(--ink-2)',
                  textDecoration: on ? 'line-through' : 'none',
                  textDecorationColor: 'var(--ink-4)',
                }}>
                  {item}
                </span>
              </label>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
