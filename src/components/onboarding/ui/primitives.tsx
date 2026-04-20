'use client';

import React from 'react';

// ─── Form primitives ────────────────────────────────────────────────────
export function Field({ label, hint, required, children, mono }: {
  label: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
  mono?: boolean;
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
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  mono?: boolean;
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

// ─── Selector ────────────────────────────────────────────────────────────
export function Selector({ value, options, onChange }: {
  value: string;
  options: string[];
  onChange: (v: string) => void;
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

// ─── Button ─────────────────────────────────────────────────────────────
export function Button({ onClick, children, disabled, variant = 'primary', size = 'md', full, icon }: {
  onClick?: () => void;
  children: React.ReactNode;
  disabled?: boolean;
  variant?: 'primary' | 'ghost' | 'quiet';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  full?: boolean;
  icon?: React.ReactNode;
}) {
  const [hover, setHover] = React.useState(false);
  const sizes = {
    sm: { pad: '7px 14px', fs: 12, gap: 6 },
    md: { pad: '11px 18px', fs: 13, gap: 8 },
    lg: { pad: '14px 22px', fs: 14, gap: 10 },
    xl: { pad: '16px 28px', fs: 15, gap: 10 },
  };
  const sz = sizes[size];
  const variants = {
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

// ─── Card ───────────────────────────────────────────────────────────────
export function Card({ children, style, tone = 'default', interactive, onClick }: {
  children: React.ReactNode;
  style?: React.CSSProperties;
  tone?: 'default' | 'raised' | 'solar';
  interactive?: boolean;
  onClick?: () => void;
}) {
  const [hover, setHover] = React.useState(false);
  const tones = {
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
        padding: 18,
        cursor: interactive ? 'pointer' : 'default',
        transition: 'border-color 160ms ease, transform 160ms ease',
        ...style,
      }}
    >
      {children}
    </div>
  );
}

// ─── Badge ──────────────────────────────────────────────────────────────
export function Badge({ children, tone = 'neutral' }: {
  children: React.ReactNode;
  tone?: 'neutral' | 'solar' | 'green';
}) {
  const tones = {
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

// ─── Section header ─────────────────────────────────────────────────────
export function SectionHead({ eyebrow, title, desc }: {
  eyebrow?: string;
  title: string;
  desc?: string;
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

// ─── Footer bar ──────────────────────────────────────────────────────────
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
