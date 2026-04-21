'use client';

import React from 'react';
import { STEPS } from './onboarding-data';
import { Icon } from './ui';

export default function Stepper({ step }: { step: number }) {
  return (
    <div className="ob-stepper" style={{ marginBottom: 32 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <div className="mono" style={{ fontSize: 10, color: 'var(--ink-4)', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
          Step <span style={{ color: 'var(--ink-2)' }}>{String(step).padStart(2, '0')}</span> / {String(STEPS.length).padStart(2, '0')}
        </div>
        <div className="mono" style={{ fontSize: 10, color: 'var(--ink-4)', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
          Est. <span style={{ color: 'var(--ink-2)' }}>{Math.max(1, 10 - step)} min</span> remaining
        </div>
      </div>

      <div style={{ position: 'relative', height: 28 }}>
        <div style={{
          position: 'absolute', top: 14, left: 0, right: 0, height: 1,
          background: 'var(--line-soft)',
        }} />
        <div style={{
          position: 'absolute', top: 14, left: 0,
          width: `${((step - 1) / (STEPS.length - 1)) * 100}%`,
          height: 1, background: 'var(--solar)',
          transition: 'width 520ms cubic-bezier(.2,.7,.2,1)',
        }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', position: 'relative' }}>
          {STEPS.map((s, i) => {
            const num = i + 1;
            const done = step > num;
            const cur = step === num;
            return (
              <div key={s.key} style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center' }} aria-current={cur ? 'step' : undefined}>
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
                <div className="ob-stepper-label mono" style={{
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
