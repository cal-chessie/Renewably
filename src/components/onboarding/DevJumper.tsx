'use client';

import React from 'react';

export default function DevJumper({ step, setStep }: { step: number; setStep: (s: number) => void }) {
  const [open, setOpen] = React.useState(false);
  const labels = ['Landing', 'Account', 'Company', 'Territory', 'Tools', 'Legal', 'Finance', 'Tech', 'Training', 'Complete'];
  return (
    <div style={{ position: 'fixed', bottom: 16, right: 16, zIndex: 30 }}>
      {open && (
        <div style={{
          position: 'absolute', bottom: 44, right: 0,
          background: 'var(--bg-2)', border: '1px solid var(--line)',
          borderRadius: 10, padding: 8, minWidth: 180,
          boxShadow: '0 16px 40px -8px rgba(0,0,0,0.5)',
        }}>
          <div className="mono" style={{ fontSize: 9.5, color: 'var(--ink-4)', letterSpacing: '0.12em', textTransform: 'uppercase', padding: '4px 8px 8px' }}>
            Jump to step
          </div>
          {labels.map((l, i) => (
            <button key={i} type="button" onClick={() => { setStep(i); setOpen(false); }}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                width: '100%', padding: '7px 8px', textAlign: 'left',
                background: step === i ? 'var(--bg-3)' : 'transparent',
                border: 'none', borderRadius: 5, cursor: 'pointer',
                color: step === i ? 'var(--solar)' : 'var(--ink-2)',
                fontSize: 12, fontFamily: 'inherit',
              }}>
              <span className="mono" style={{ fontSize: 10, color: 'var(--ink-5)', width: 16 }}>{String(i).padStart(2, '0')}</span>
              {l}
            </button>
          ))}
        </div>
      )}
      <button type="button" onClick={() => setOpen(o => !o)} style={{
        background: 'var(--bg-2)', border: '1px solid var(--line)',
        color: 'var(--ink-3)', borderRadius: 8,
        padding: '7px 12px', fontSize: 11, fontFamily: 'Geist Mono, monospace',
        cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
        letterSpacing: '0.06em',
      }}>
        <span>STEP {String(step).padStart(2, '0')}</span>
        <span style={{ color: 'var(--ink-5)' }}>▾</span>
      </button>
    </div>
  );
}
