'use client';

import { useState } from 'react';
import { SectionHead, Field, Input, Selector, Button, FooterBar, Icon } from './ui';

// ─── Step 2 · Company ─────────────────────────────────────────────────────

interface StepCompanyProps {
  onNext: (d?: Record<string, unknown>) => void;
  onBack: () => void;
  initialData?: Record<string, unknown>;
}

export function StepCompany({ onNext, onBack, initialData }: StepCompanyProps) {
  const [d, setD] = useState({
    company_name: (initialData?.company_name as string) || '',
    contact_name: (initialData?.contact_name as string) || '',
    phone: (initialData?.phone as string) || '',
    vat: (initialData?.vat as string) || '',
    address: (initialData?.address as string) || '',
    city: (initialData?.city as string) || '',
    eircode: (initialData?.eircode as string) || '',
    size: (initialData?.size as string) || '',
    founded: (initialData?.founded as string) || '',
  });
  const set = (k: string, v: string) => setD(x => ({ ...x, [k]: v }));
  const [busy, setBusy] = useState(false);

  const go = () => {
    if (!d.company_name || !d.contact_name) return;
    setBusy(true);
    setTimeout(() => {
      setBusy(false);
      onNext(d);
    }, 400);
  };

  return (
    <div className="fade-up">
      <SectionHead eyebrow="02 · Company" title="Tell us about your company" desc="This appears on client invoices, grant applications, and PPA contracts. You can edit it anytime." />

      <div style={{ display: 'grid', gap: 14 }}>
        <div className="ob-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <Field label="Company name" required><Input value={d.company_name} onChange={v => set('company_name', v)} placeholder="e.g. Power Solar Ltd" /></Field>
          <Field label="Primary contact" required><Input value={d.contact_name} onChange={v => set('contact_name', v)} placeholder="Full name" /></Field>
        </div>
        <div className="ob-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <Field label="Phone" required><Input value={d.phone} onChange={v => set('phone', v)} placeholder="087 123 4567" /></Field>
          <Field label="VAT number" hint="IE format"><Input value={d.vat} onChange={v => set('vat', v)} mono placeholder="IE9876543A" /></Field>
        </div>
        <Field label="Business address" required><Input value={d.address} onChange={v => set('address', v)} placeholder="Unit 4, Sandyford Industrial Estate" /></Field>
        <div className="ob-grid-2" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 10 }}>
          <Field label="City"><Input value={d.city} onChange={v => set('city', v)} placeholder="Dublin" /></Field>
          <Field label="Eircode"><Input value={d.eircode} onChange={v => set('eircode', v)} mono placeholder="D18 FX78" /></Field>
        </div>
        <div className="ob-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <Field label="Team size">
            <Selector value={d.size} options={['1-5', '6-15', '16-30', '31-50', '50+']} onChange={v => set('size', v)} />
          </Field>
          <Field label="Founded"><Input value={d.founded} onChange={v => set('founded', v)} mono placeholder="2019" /></Field>
        </div>
      </div>

      <FooterBar>
        <Button variant="ghost" onClick={onBack}>Back</Button>
        <Button onClick={go} disabled={busy || !d.company_name || !d.contact_name} icon={<Icon.Arrow size={14} />}>
          {busy ? 'Saving...' : 'Continue'}
        </Button>
      </FooterBar>
    </div>
  );
}
