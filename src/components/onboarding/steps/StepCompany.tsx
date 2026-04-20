'use client';

import React from 'react';
import { SectionHead, Field, Input, Selector, Button, FooterBar } from '../ui/primitives';
import { IconArrow } from '../ui/icons';

export default function StepCompany({ onNext, onBack }: { onNext: (data: Record<string, string>) => void; onBack: () => void }) {
  const [d, setD] = React.useState({
    company_name: 'Power Solar Ltd',
    contact_name: 'Sean Power',
    phone: '087 123 4567',
    vat: 'IE9876543A',
    address: 'Unit 4, Sandyford Industrial Estate',
    city: 'Dublin',
    eircode: 'D18 FX78',
    size: '6-15',
    founded: '2019',
  });
  const set = (k: string, v: string) => setD(x => ({ ...x, [k]: v }));
  const [busy, setBusy] = React.useState(false);

  const go = () => {
    setBusy(true);
    setTimeout(() => { setBusy(false); onNext({ company_name: d.company_name, contact_name: d.contact_name }); }, 400);
  };

  return (
    <div className="fade-up">
      <SectionHead eyebrow="02 · Company" title="Tell us about your company" desc="This appears on client invoices, grant applications, and PPA contracts. You can edit it anytime." />

      <div style={{ display: 'grid', gap: 14 }}>
        <div className="ob-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <Field label="Company name" required><Input value={d.company_name} onChange={v => set('company_name', v)} /></Field>
          <Field label="Primary contact" required><Input value={d.contact_name} onChange={v => set('contact_name', v)} /></Field>
        </div>
        <div className="ob-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <Field label="Phone" required><Input value={d.phone} onChange={v => set('phone', v)} /></Field>
          <Field label="VAT number" hint="IE format"><Input value={d.vat} onChange={v => set('vat', v)} mono /></Field>
        </div>
        <Field label="Business address" required><Input value={d.address} onChange={v => set('address', v)} /></Field>
        <div className="ob-grid-2" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 10 }}>
          <Field label="City"><Input value={d.city} onChange={v => set('city', v)} /></Field>
          <Field label="Eircode"><Input value={d.eircode} onChange={v => set('eircode', v)} mono /></Field>
        </div>
        <div className="ob-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <Field label="Team size">
            <Selector value={d.size} options={['1-5', '6-15', '16-30', '31-50', '50+']} onChange={v => set('size', v)} />
          </Field>
          <Field label="Founded"><Input value={d.founded} onChange={v => set('founded', v)} mono /></Field>
        </div>
      </div>

      <FooterBar>
        <Button variant="ghost" onClick={onBack}>Back</Button>
        <Button onClick={go} disabled={busy} icon={<IconArrow size={14} />}>
          {busy ? 'Saving…' : 'Continue'}
        </Button>
      </FooterBar>
    </div>
  );
}
