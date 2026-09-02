'use client';

import { useState } from 'react';
import { SectionHead, Field, Input, Button, Icon } from './ui';

// ─── Step 1 · Your details ────────────────────────────────────────────────
// Lead capture, not account creation. No password is collected here - installers
// do not sign in to the CRM; the team provisions any access after setup.

interface StepAccountProps {
  onNext: (d?: Record<string, unknown>) => void;
  initialData?: Record<string, unknown>;
}

export function StepAccount({ onNext, initialData }: StepAccountProps) {
  const [email, setEmail] = useState((initialData?.email as string) || '');
  const [busy, setBusy] = useState(false);
  const [agree, setAgree] = useState(false);

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

  const go = () => {
    if (!emailValid) return;
    setBusy(true);
    setTimeout(() => { setBusy(false); onNext({ email: email.trim() }); }, 320);
  };

  return (
    <div className="fade-up">
      <SectionHead eyebrow="01 · Your details" title="Let's get you set up" desc="Tell us where to reach you. We'll take you through a few quick questions, then our team gets in touch to set everything up. No card needed." />

      <div style={{ display: 'grid', gap: 14, marginBottom: 18 }}>
        <Field label="Work email" required>
          <Input value={email} onChange={setEmail} type="email" placeholder="you@company.ie" />
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
        <Button onClick={go} disabled={busy || !agree || !emailValid} size="lg" icon={<Icon.Arrow size={14} />}>
          {busy ? 'One sec...' : 'Continue'}
        </Button>
        <div className="mono" style={{ fontSize: 10.5, color: 'var(--ink-4)', letterSpacing: '0.04em' }}>
          Takes about two minutes.
        </div>
      </div>
    </div>
  );
}
