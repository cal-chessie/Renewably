'use client';

import React, { useState } from 'react';

// ─── Wordmark / Sun mark ──────────────────────────────────────────────────

export function SunMark({ size = 18 }: { size?: number }) {
  return (
    <div style={{
      width: size, height: size,
      borderRadius: Math.max(4, size * 0.18),
      background: 'var(--solar)',
      display: 'grid', placeItems: 'center',
      overflow: 'hidden',
      flexShrink: 0,
    }}>
      <img src="/onboarding/renewably-logo.png" alt="Renewably" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
    </div>
  );
}

export function Wordmark({ small }: { small?: boolean }) {
  const s = small ? 24 : 30;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <div style={{
        width: s, height: s, borderRadius: 6,
        background: 'var(--solar)',
        display: 'grid', placeItems: 'center',
        overflow: 'hidden',
      }}>
        <img src="/onboarding/renewably-logo.png" alt="Renewably" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      </div>
      <div>
        <div style={{ fontSize: small ? 14 : 16, fontWeight: 600, letterSpacing: '-0.02em' }}>
          SolarPilot
        </div>
        {!small && (
          <div className="mono" style={{ fontSize: 9, color: 'var(--ink-4)', letterSpacing: '0.1em', textTransform: 'uppercase', marginTop: 1 }}>
            by Renewably
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Form primitives ──────────────────────────────────────────────────────

export function Field({ label, hint, required, children, mono }: {
  label: string; hint?: string; required?: boolean; children: React.ReactNode; mono?: boolean;
}) {
  return (
    <label style={{ display: 'block' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 6 }}>
        <span className={mono ? 'mono' : ''} style={{
          fontSize: 11, color: 'var(--ink-3)',
          letterSpacing: mono ? '0.08em' : '0',
          textTransform: mono ? 'uppercase' : 'none',
          fontWeight: 500, whiteSpace: 'nowrap',
        }}>
          {label}{required && <span style={{ color: 'var(--solar)', marginLeft: 3 }}>*</span>}
        </span>
        {hint && <span className="mono" style={{ fontSize: 10, color: 'var(--ink-5)' }}>{hint}</span>}
      </div>
      {children}
    </label>
  );
}

export function Input({ value, onChange, placeholder, type, mono }: {
  value: string; onChange: (v: string) => void; placeholder?: string; type?: string; mono?: boolean;
}) {
  return (
    <input
      type={type || 'text'}
      value={value}
      onChange={e => onChange && onChange(e.target.value)}
      placeholder={placeholder}
      className={mono ? 'mono' : ''}
      style={{
        width: '100%',
        padding: '10px 12px',
        background: 'var(--bg-1)',
        border: '1px solid var(--line-soft)',
        borderRadius: 8,
        color: 'var(--ink)',
        fontSize: 14,
        letterSpacing: '-0.005em',
        transition: 'border-color 140ms ease, background 140ms ease',
      }}
      onFocus={e => { e.currentTarget.style.borderColor = 'var(--solar)'; e.currentTarget.style.background = 'var(--bg-2)'; }}
      onBlur={e => { e.currentTarget.style.borderColor = 'var(--line-soft)'; e.currentTarget.style.background = 'var(--bg-1)'; }}
    />
  );
}

// ─── Selector ─────────────────────────────────────────────────────────────

export function Selector({ value, options, onChange }: {
  value: string; options: string[]; onChange: (v: string) => void;
}) {
  return (
    <div style={{ display: 'flex', gap: 4, padding: 3, background: 'var(--bg-1)', border: '1px solid var(--line-soft)', borderRadius: 8 }}>
      {options.map(o => (
        <button key={o} type="button" onClick={() => onChange(o)}
          className={value === o ? '' : 'mono'}
          style={{
            flex: 1, padding: '7px 8px',
            background: value === o ? 'var(--bg-3)' : 'transparent',
            color: value === o ? 'var(--ink)' : 'var(--ink-4)',
            border: 'none', borderRadius: 5,
            fontSize: value === o ? 12.5 : 11.5,
            fontWeight: value === o ? 500 : 400,
            cursor: 'pointer',
            transition: 'all 140ms ease',
            whiteSpace: 'nowrap',
            minWidth: 0,
          }}>
          {o}
        </button>
      ))}
    </div>
  );
}

// ─── Button ───────────────────────────────────────────────────────────────

export function Button({ onClick, children, disabled, variant = 'primary', size = 'md', full, icon }: {
  onClick?: () => void; children: React.ReactNode; disabled?: boolean;
  variant?: 'primary' | 'ghost' | 'quiet'; size?: 'sm' | 'md' | 'lg' | 'xl';
  full?: boolean; icon?: React.ReactNode;
}) {
  const [hover, setHover] = useState(false);
  const sizes: Record<string, { pad: string; fs: number; gap: number }> = {
    sm: { pad: '7px 14px', fs: 12, gap: 6 },
    md: { pad: '11px 18px', fs: 13, gap: 8 },
    lg: { pad: '14px 22px', fs: 14, gap: 10 },
    xl: { pad: '16px 28px', fs: 15, gap: 10 },
  };
  const sz = sizes[size];
  const variants: Record<string, { bg: string; color: string; border: string; shadow: string }> = {
    primary: {
      bg: hover && !disabled ? 'oklch(0.90 0.17 95)' : 'var(--solar)',
      color: 'var(--bg)',
      border: '1px solid var(--solar)',
      shadow: hover && !disabled ? '0 8px 24px -8px oklch(0.85 0.17 95 / 0.5)' : 'none',
    },
    ghost: {
      bg: hover && !disabled ? 'var(--bg-2)' : 'transparent',
      color: 'var(--ink-2)',
      border: '1px solid var(--line-soft)',
      shadow: 'none',
    },
    quiet: {
      bg: 'transparent',
      color: 'var(--ink-3)',
      border: '1px solid transparent',
      shadow: 'none',
    },
  };
  const v = variants[variant];
  return (
    <button
      type="button"
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        background: v.bg,
        color: v.color,
        border: v.border,
        borderRadius: 8,
        padding: sz.pad,
        fontSize: sz.fs,
        fontWeight: 600,
        letterSpacing: '-0.005em',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.4 : 1,
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        gap: sz.gap,
        width: full ? '100%' : 'auto',
        transition: 'all 160ms cubic-bezier(.2,.7,.2,1)',
        boxShadow: v.shadow,
      }}
    >
      {children}
      {icon && <span style={{ marginLeft: 2 }}>{icon}</span>}
    </button>
  );
}

// ─── Card ─────────────────────────────────────────────────────────────────

export function Card({ children, style, tone = 'default', interactive, onClick }: {
  children: React.ReactNode; style?: React.CSSProperties;
  tone?: 'default' | 'raised' | 'solar'; interactive?: boolean; onClick?: () => void;
}) {
  const [hover, setHover] = useState(false);
  const tones: Record<string, { bg: string; border: string }> = {
    default: { bg: 'var(--bg-1)', border: 'var(--line-soft)' },
    raised: { bg: 'var(--bg-2)', border: 'var(--line)' },
    solar: { bg: 'var(--solar-soft)', border: 'oklch(0.70 0.17 95 / 0.35)' },
  };
  const t = tones[tone];
  return (
    <div
      onClick={onClick}
      onMouseEnter={interactive ? () => setHover(true) : undefined}
      onMouseLeave={interactive ? () => setHover(false) : undefined}
      style={{
        background: t.bg,
        border: `1px solid ${hover ? 'var(--line)' : t.border}`,
        borderRadius: 10,
        padding: 16,
        cursor: interactive ? 'pointer' : 'default',
        transition: 'border-color 160ms ease, transform 160ms ease',
        ...style,
      }}
    >
      {children}
    </div>
  );
}

// ─── Badge ────────────────────────────────────────────────────────────────

export function Badge({ children, tone = 'neutral' }: {
  children: React.ReactNode; tone?: 'neutral' | 'solar' | 'green';
}) {
  const tones: Record<string, { bg: string; color: string; border: string }> = {
    neutral: { bg: 'var(--bg-2)', color: 'var(--ink-3)', border: 'var(--line-soft)' },
    solar: { bg: 'var(--solar-soft)', color: 'var(--solar-ink)', border: 'oklch(0.70 0.17 95 / 0.3)' },
    green: { bg: 'var(--green-soft)', color: 'var(--green)', border: 'oklch(0.76 0.17 145 / 0.3)' },
  };
  const t = tones[tone];
  return (
    <span className="mono" style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      fontSize: 9.5, fontWeight: 500,
      letterSpacing: '0.08em',
      textTransform: 'uppercase',
      padding: '3px 7px',
      borderRadius: 4,
      background: t.bg,
      color: t.color,
      border: `1px solid ${t.border}`,
      lineHeight: 1.2,
    }}>
      {children}
    </span>
  );
}

// ─── Section header ───────────────────────────────────────────────────────

export function SectionHead({ eyebrow, title, desc }: {
  eyebrow?: string; title: string; desc?: string;
}) {
  return (
    <div style={{ marginBottom: 22 }}>
      {eyebrow && (
        <div className="mono" style={{
          fontSize: 10, color: 'var(--solar)',
          letterSpacing: '0.14em', textTransform: 'uppercase',
          marginBottom: 10, fontWeight: 500,
        }}>
          {eyebrow}
        </div>
      )}
      <h2 style={{
        fontSize: 26, fontWeight: 600,
        letterSpacing: '-0.025em',
        margin: 0, lineHeight: 1.1,
        color: 'var(--ink)',
      }}>
        {title}
      </h2>
      {desc && (
        <p style={{
          color: 'var(--ink-3)', fontSize: 13.5,
          margin: '8px 0 0', lineHeight: 1.5,
          maxWidth: 460,
        }}>
          {desc}
        </p>
      )}
    </div>
  );
}

// ─── Footer bar ───────────────────────────────────────────────────────────

export function FooterBar({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      display: 'flex', gap: 10, alignItems: 'center',
      paddingTop: 20, marginTop: 20,
      borderTop: '1px solid var(--line-soft)',
      justifyContent: 'flex-end',
    }}>
      {children}
    </div>
  );
}

// ─── Icons (minimal, line-style) ──────────────────────────────────────────

export const Icon = {
  Arrow: ({ size = 14 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 14 14" fill="none">
      <path d="M3 7h8m-3-3l3 3-3 3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  Check: ({ size = 12 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 12 12" fill="none">
      <path d="M2 6l3 3 5-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  Plus: ({ size = 12 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 12 12" fill="none">
      <path d="M6 2v8M2 6h8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  ),
  Doc: ({ size = 14 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 14 14" fill="none">
      <path d="M3 1h5l3 3v9H3V1z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/>
      <path d="M8 1v3h3M5 7h4M5 10h4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  ),
  Lock: ({ size = 14 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 14 14" fill="none">
      <rect x="3" y="6" width="8" height="6" rx="1" stroke="currentColor" strokeWidth="1.2" />
      <path d="M5 6V4a2 2 0 014 0v2" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  ),
  Zap: ({ size = 14 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 14 14" fill="none">
      <path d="M8 1L3 8h3l-1 5 5-7H7l1-5z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
    </svg>
  ),
  Map: ({ size = 14 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 14 14" fill="none">
      <path d="M1 3l4-2 4 2 4-2v10l-4 2-4-2-4 2V3z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/>
      <path d="M5 1v10M9 3v10" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  ),
  Plug: ({ size = 14 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 14 14" fill="none">
      <path d="M5 1v3M9 1v3M3 4h8v3a4 4 0 01-8 0V4zM7 11v2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  Euro: ({ size = 14 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 14 14" fill="none">
      <path d="M11 3a4 4 0 100 8M2 6h7M2 8h6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  ),
  Shield: ({ size = 14 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 14 14" fill="none">
      <path d="M7 1l5 2v4c0 3-2 5.5-5 6-3-.5-5-3-5-6V3l5-2z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/>
    </svg>
  ),
  Book: ({ size = 14 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 14 14" fill="none">
      <path d="M2 2h4a2 2 0 012 2v8a2 2 0 00-2-2H2V2zM12 2H8a2 2 0 00-2 2v8a2 2 0 012-2h4V2z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/>
    </svg>
  ),
  User: ({ size = 14 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 14 14" fill="none">
      <circle cx="7" cy="5" r="2.5" stroke="currentColor" strokeWidth="1.2"/>
      <path d="M2 13c0-2.5 2.2-4 5-4s5 1.5 5 4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
    </svg>
  ),
  Office: ({ size = 14 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 14 14" fill="none">
      <path d="M2 13V3h10v10M5 6h1M8 6h1M5 9h1M8 9h1M6 13v-2h2v2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  Mail: ({ size = 14 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 14 14" fill="none">
      <rect x="1" y="3" width="12" height="8" rx="1" stroke="currentColor" strokeWidth="1.2"/>
      <path d="M1 4l6 4 6-4" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/>
    </svg>
  ),
  Card: ({ size = 14 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 14 14" fill="none">
      <rect x="1" y="3" width="12" height="8" rx="1" stroke="currentColor" strokeWidth="1.2"/>
      <path d="M1 6h12M3 9h2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
    </svg>
  ),
  Team: ({ size = 14 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 14 14" fill="none">
      <circle cx="5" cy="5" r="2" stroke="currentColor" strokeWidth="1.2"/>
      <circle cx="10" cy="5" r="1.5" stroke="currentColor" strokeWidth="1.2"/>
      <path d="M1 12c0-2 1.8-3 4-3s4 1 4 3M9 9c1.8 0 4 1 4 3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
    </svg>
  ),
  Send: ({ size = 14 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 14 14" fill="none">
      <path d="M13 1L1 6l5 2 2 5 5-12zM6 8l4-4" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" strokeLinecap="round"/>
    </svg>
  ),
  Chart: ({ size = 14 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 14 14" fill="none">
      <path d="M1 13V1M13 13H1M3 10l3-4 3 2 4-6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
};
