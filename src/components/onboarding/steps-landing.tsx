'use client';

import { SunMark, Badge, Button, Icon } from './ui';

// ─── Landing ──────────────────────────────────────────────────────────────

export function Landing({ onStart, onDemo }: { onStart: () => void; onDemo: () => void }) {
  return (
    <div className="fade-up" style={{ padding: '8px 0' }}>
      {/* Hero row */}
      <div className="ob-hero-grid" style={{ display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', gap: 40, alignItems: 'center', marginBottom: 48 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 28 }}>
            <SunMark size={40} />
            <div>
              <div style={{ fontSize: 18, fontWeight: 600, letterSpacing: '-0.02em' }}>SolarPilot</div>
              <div className="mono" style={{ fontSize: 9.5, color: 'var(--ink-4)', letterSpacing: '0.14em', textTransform: 'uppercase', marginTop: 1, whiteSpace: 'nowrap' }}>
                by Renewably · Ireland
              </div>
            </div>
          </div>

          <div style={{ marginBottom: 18 }}>
            <div style={{ whiteSpace: 'nowrap', display: 'inline-block' }}>
              <Badge tone="solar">
                <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--solar)' }} />
                SEAI-aligned · Q2 2026 release
              </Badge>
            </div>
          </div>

          <h1 className="ob-hero-title" style={{
            fontSize: 48, fontWeight: 600,
            letterSpacing: '-0.035em', lineHeight: 1.02,
            margin: '0 0 18px',
          }}>
            Run your solar<br/>business on <span style={{ color: 'var(--solar)' }}>autopilot</span>.
          </h1>

          <p className="ob-hero-desc" style={{
            color: 'var(--ink-3)', fontSize: 15, lineHeight: 1.55,
            margin: '0 0 28px', maxWidth: 460,
          }}>
            Operating software for Irish solar installers. Qualified leads, grant paperwork, homeowner proposals and recurring PPA earnings — in one portal.
          </p>

          <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 18 }}>
            <Button onClick={onStart} size="xl" icon={<Icon.Arrow size={14} />}>
              Start free trial
            </Button>
            <Button variant="ghost" size="xl" onClick={onDemo}>
              Book a demo
            </Button>
          </div>

          <div className="mono" style={{ fontSize: 10.5, color: 'var(--ink-4)', letterSpacing: '0.06em' }}>
            No card required · 14-day trial · Setup in under 10 minutes
          </div>
        </div>

        {/* Hero artwork — robot mascot */}
        <HeroArt />
      </div>

      {/* Value prop strip */}
      <div className="ob-value-props" style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        borderTop: '1px solid var(--line-soft)',
        borderBottom: '1px solid var(--line-soft)',
        margin: '0 0 48px',
      }}>
        {[
          { stat: '20–30', unit: 'leads / mo', label: 'Qualified homeowners, routed to your territory' },
          { stat: '€84', unit: '/ home / yr', label: 'Passive PPA earnings, paid quarterly' },
          { stat: '11 min', unit: 'avg. setup', label: 'From signup to live portal with team + integrations' },
        ].map((v, i) => (
          <div key={i} style={{
            padding: '22px 24px',
            borderRight: i < 2 ? '1px solid var(--line-soft)' : 'none',
            minWidth: 0,
          }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
              <div className="tabular" style={{ fontSize: 30, fontWeight: 600, letterSpacing: '-0.03em', color: 'var(--solar)', lineHeight: 1, whiteSpace: 'nowrap' }}>
                {v.stat}
              </div>
              <div className="mono" style={{ fontSize: 10, color: 'var(--ink-4)', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>
                {v.unit}
              </div>
            </div>
            <div style={{ fontSize: 12.5, color: 'var(--ink-3)', lineHeight: 1.45, textWrap: 'pretty' }}>
              {v.label}
            </div>
          </div>
        ))}
      </div>

      {/* Social proof */}
      <div style={{ marginBottom: 16 }}>
        <div className="mono" style={{ fontSize: 10, color: 'var(--ink-4)', letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 14 }}>
          Trusted by installers across
        </div>
        <div className="ob-social-tags" style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {['Dublin', 'Cork', 'Galway', 'Limerick', 'Waterford', 'Kildare', 'Meath', 'Wicklow', '+ 24 more'].map(c => (
            <span key={c} className="mono" style={{
              fontSize: 11, color: 'var(--ink-3)',
              padding: '5px 10px',
              border: '1px solid var(--line-soft)',
              borderRadius: 4,
              background: 'var(--bg-1)',
              whiteSpace: 'nowrap',
            }}>
              {c}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

function HeroArt() {
  return (
    <div style={{
      position: 'relative', height: 420,
      borderRadius: 12,
      background: 'var(--solar)',
      border: '1px solid oklch(0.70 0.17 95 / 0.4)',
      overflow: 'hidden',
    }}>
      <img src="/onboarding/robot-laptop.jpg" alt="SolarPilot AI Co-Pilot" style={{
        position: 'absolute', inset: 0,
        width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'right center',
      }} />
      <div style={{
        position: 'absolute', bottom: 16, left: 16, right: 16,
        display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6,
      }}>
        <div style={{
          background: 'rgba(10,10,10,0.82)', backdropFilter: 'blur(8px)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 8, padding: '10px 12px',
        }}>
          <div className="mono" style={{ fontSize: 9, color: 'oklch(0.72 0.008 85)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
            AI Co-Pilot
          </div>
          <div className="tabular" style={{ fontSize: 15, fontWeight: 600, color: 'white', marginTop: 2 }}>
            3 proposals drafted
          </div>
        </div>
        <div style={{
          background: 'rgba(10,10,10,0.82)', backdropFilter: 'blur(8px)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 8, padding: '10px 12px',
        }}>
          <div className="mono" style={{ fontSize: 9, color: 'oklch(0.72 0.008 85)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
            Pipeline
          </div>
          <div className="tabular" style={{ fontSize: 15, fontWeight: 600, color: 'var(--solar)', marginTop: 2 }}>
            €247k · this quarter
          </div>
        </div>
      </div>
    </div>
  );
}
