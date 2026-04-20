'use client';

import { useState } from 'react';
import { SectionHead, Field, Input, Button, Icon } from './ui';

// ─── Step 1 · Account ─────────────────────────────────────────────────────

interface StepAccountProps {
  onNext: (d?: Record<string, unknown>) => void;
  initialData?: Record<string, unknown>;
}

export function StepAccount({ onNext, initialData }: StepAccountProps) {
  const [email, setEmail] = useState((initialData?.email as string) || '');
  const [pw, setPw] = useState(''); // Never pre-fill password for security
  const [busy, setBusy] = useState(false);
  const [agree, setAgree] = useState(false);

  const strength = pw.length < 6 ? 1 : pw.length < 10 ? 2 : /[A-Z]/.test(pw) && /\d/.test(pw) && /[!@#$%]/.test(pw) ? 4 : 3;
  const strengthLabels = ['', 'Weak', 'Fair', 'Good', 'Strong'];
  const strengthColors = ['', 'var(--red)', 'oklch(0.78 0.13 65)', 'var(--solar)', 'var(--green)'];

  const go = () => {
    if (!email || pw.length < 8) return;
    setBusy(true);
    setTimeout(() => { setBusy(false); onNext({ email, password: pw }); }, 480);
  };

  return (
    <div className="fade-up">
      <SectionHead eyebrow="01 · Account" title="Create your account" desc="Free for 14 days. No credit card. You can cancel anytime, and we'll export your data." />

      <div style={{ display: 'grid', gap: 14, marginBottom: 18 }}>
        <Field label="Email address" required>
          <Input value={email} onChange={setEmail} type="email" placeholder="you@company.ie" />
        </Field>
        <Field label="Password" required hint={strength ? strengthLabels[strength] : ''}>
          <Input value={pw} onChange={setPw} type="password" placeholder="Minimum 8 characters" />
          <div style={{ display: 'flex', gap: 3, marginTop: 6 }}>
            {[1,2,3,4].map(i => (
              <div key={i} style={{
                flex: 1, height: 2, borderRadius: 1,
                background: i <= strength ? strengthColors[strength] : 'var(--line-soft)',
                transition: 'background 160ms ease',
              }} />
            ))}
          </div>
        </Field>

        <label style={{ display: 'flex', alignItems: 'flex-start', gap: 8, cursor: 'pointer', marginTop: 4 }}>
          <input type="checkbox" checked={agree} onChange={e => setAgree(e.target.checked)} style={{ marginTop: 2 }} />
          <span style={{ fontSize: 12, color: 'var(--ink-3)', lineHeight: 1.5 }}>
            I agree to the <span style={{ color: 'var(--ink-2)', textDecoration: 'underline', textDecorationColor: 'var(--line)' }}>Renewably Terms</span> and acknowledge the{' '}
            <span style={{ color: 'var(--ink-2)', textDecoration: 'underline', textDecorationColor: 'var(--line)' }}>Privacy Notice</span>.
          </span>
        </label>
      </div>

      <div style={{ display: 'flex', gap: 10, alignItems: 'center', paddingTop: 14, borderTop: '1px solid var(--line-soft)' }}>
        <Button onClick={go} disabled={busy || !agree || !email || pw.length < 8} size="lg" icon={<Icon.Arrow size={14} />}>
          {busy ? 'Creating account...' : 'Continue'}
        </Button>
        <div className="mono" style={{ fontSize: 10.5, color: 'var(--ink-4)', letterSpacing: '0.04em' }}>
          Already a customer? <span style={{ color: 'var(--ink-2)', textDecoration: 'underline' }}>Sign in</span>
        </div>
      </div>
    </div>
  );
}
