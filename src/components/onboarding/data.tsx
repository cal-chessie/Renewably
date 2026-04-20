'use client';

import { Icon } from './ui';

// ─── Static Data ──────────────────────────────────────────────────────────

export const COUNTIES = ["Carlow","Cavan","Clare","Cork","Donegal","Dublin","Galway","Kerry","Kildare","Kilkenny","Laois","Leitrim","Limerick","Longford","Louth","Mayo","Meath","Monaghan","Offaly","Roscommon","Sligo","Tipperary","Waterford","Westmeath","Wexford","Wicklow"];

export const PROVINCES: Record<string, string[]> = {
  Connacht: ["Galway","Leitrim","Mayo","Roscommon","Sligo"],
  Leinster: ["Carlow","Dublin","Kildare","Kilkenny","Laois","Longford","Louth","Meath","Offaly","Westmeath","Wexford","Wicklow"],
  Munster: ["Clare","Cork","Kerry","Limerick","Tipperary","Waterford"],
  Ulster: ["Cavan","Donegal","Monaghan"]
};

export const PLANS = [
  { id: "starter", name: "Starter", price: 199, tagline: "Solo installers",
    feat: ["Up to 30 jobs / month", "Basic pipeline reporting", "Email support (48h)"] },
  { id: "pro", name: "Pro", price: 349, tagline: "Small teams", popular: true,
    feat: ["Unlimited jobs", "API access + webhooks", "PPA earnings dashboard", "Priority support (4h)", "AI Co-Pilot for proposals"] },
  { id: "enterprise", name: "Enterprise", price: 699, tagline: "Multi-region",
    feat: ["Custom SLA + uptime", "White-label homeowner portal", "Dedicated CSM", "Audit + SSO"] }
];

export const DOCS = [
  { id: "msa", name: "Master Service Agreement", desc: "Legal terms of your subscription", pages: 12 },
  { id: "nda", name: "Non-Disclosure Agreement", desc: "Protects confidential information", pages: 4 },
  { id: "dpa", name: "Data Processing Agreement", desc: "GDPR compliance for client data", pages: 8 },
  { id: "tos", name: "Terms of Service", desc: "Acceptable use of SolarPilot", pages: 6 }
];

export const STEPS = [
  { key: 'account', label: 'Account', icon: 'User' },
  { key: 'company', label: 'Company', icon: 'Office' },
  { key: 'territory', label: 'Territory', icon: 'Map' },
  { key: 'tools', label: 'Tools', icon: 'Plug' },
  { key: 'legal', label: 'Legal', icon: 'Doc' },
  { key: 'finance', label: 'Finance', icon: 'Euro' },
  { key: 'tech', label: 'Tech', icon: 'Shield' },
  { key: 'welcome', label: 'Training', icon: 'Book' },
];

// ─── Stepper ───────────────────────────────────────────────────────────────

interface StepperProps {
  step: number;
}

export function Stepper({ step }: StepperProps) {
  return (
    <div style={{ marginBottom: 32 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <div className="mono" style={{ fontSize: 10, color: 'var(--ink-4)', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
          Step <span style={{ color: 'var(--ink-2)' }}>{String(step).padStart(2, '0')}</span> / {String(STEPS.length).padStart(2, '0')}
        </div>
        <div className="mono" style={{ fontSize: 10, color: 'var(--ink-4)', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
          Est. <span style={{ color: 'var(--ink-2)' }}>{Math.max(1, 10 - step)} min</span> remaining
        </div>
      </div>

      <div style={{ position: 'relative', height: 28 }}>
        {/* base line */}
        <div style={{
          position: 'absolute', top: 14, left: 0, right: 0, height: 1,
          background: 'var(--line-soft)',
        }} />
        {/* progress line */}
        <div style={{
          position: 'absolute', top: 14, left: 0,
          width: `${((step - 1) / (STEPS.length - 1)) * 100}%`,
          height: 1, background: 'var(--solar)',
          transition: 'width 520ms cubic-bezier(.2,.7,.2,1)',
        }} />
        {/* nodes */}
        <div style={{ display: 'flex', justifyContent: 'space-between', position: 'relative' }}>
          {STEPS.map((s, i) => {
            const num = i + 1;
            const done = step > num;
            const cur = step === num;
            return (
              <div key={s.key} style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{
                  width: 28, height: 28,
                  borderRadius: '50%',
                  display: 'grid', placeItems: 'center',
                  background: done ? 'var(--solar)' : cur ? 'var(--bg-2)' : 'var(--bg-1)',
                  border: `1px solid ${done ? 'var(--solar)' : cur ? 'var(--solar)' : 'var(--line-soft)'}`,
                  color: done ? 'var(--bg)' : cur ? 'var(--solar)' : 'var(--ink-5)',
                  transition: 'all 320ms ease',
                  boxShadow: cur ? '0 0 0 4px oklch(0.85 0.17 95 / 0.12)' : 'none',
                }}>
                  {done
                    ? <Icon.Check size={11} />
                    : cur
                      ? <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--solar)' }} />
                      : <span className="mono" style={{ fontSize: 10, fontWeight: 500 }}>{num}</span>
                  }
                </div>
                <div className="mono" style={{
                  position: 'absolute', top: 36,
                  fontSize: 9.5,
                  color: cur ? 'var(--ink-2)' : done ? 'var(--ink-3)' : 'var(--ink-5)',
                  letterSpacing: '0.06em', textTransform: 'uppercase',
                  fontWeight: 500, whiteSpace: 'nowrap',
                  transition: 'color 220ms ease',
                }}>
                  {s.label}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Ambient grid backdrop ────────────────────────────────────────────────

export function Backdrop() {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none',
      backgroundImage: `
        linear-gradient(var(--line-soft) 1px, transparent 1px),
        linear-gradient(90deg, var(--line-soft) 1px, transparent 1px)
      `,
      backgroundSize: '56px 56px',
      backgroundPosition: '-1px -1px',
      opacity: 0.25,
      maskImage: 'radial-gradient(ellipse at 50% 0%, black 0%, transparent 70%)',
      WebkitMaskImage: 'radial-gradient(ellipse at 50% 0%, black 0%, transparent 70%)',
    }} />
  );
}
