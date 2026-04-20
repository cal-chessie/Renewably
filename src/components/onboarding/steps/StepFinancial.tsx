'use client';

import React from 'react';
import { SectionHead, Field, Input, Button, Card, Badge, FooterBar } from '../ui/primitives';
import { IconArrow, IconCheck, IconLock } from '../ui/icons';
import { PLANS } from '../onboarding-data';

interface StepFinancialData {
  setupTotal?: number;
  connectedIds?: string[];
}

export default function StepFinancial({ onNext, onBack, data }: { onNext: () => void; onBack: () => void; data: StepFinancialData }) {
  const [sub, setSub] = React.useState(1);
  const [plan, setPlan] = React.useState('pro');
  const [billing, setBilling] = React.useState<'monthly' | 'annual'>('annual');
  const setupTotal = data?.setupTotal || 0;
  const connectedIds = data?.connectedIds || [];

  const selectedPlan = PLANS.find(p => p.id === plan)!;
  const annualMult = billing === 'annual' ? 10 : 12;

  if (sub === 1) return (
    <div className="fade-up">
      <SectionHead eyebrow="06 · Finance · 1 of 3" title="Select a plan" desc="Change or cancel anytime. Annual billing saves you two months." />

      <div className="ob-plans" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 18 }}>
        {PLANS.map(p => {
          const active = plan === p.id;
          return (
            <div key={p.id} onClick={() => setPlan(p.id)} style={{
              position: 'relative',
              background: active ? 'var(--bg-2)' : 'var(--bg-1)',
              border: `1px solid ${active ? 'var(--solar)' : 'var(--line-soft)'}`,
              borderRadius: 10, padding: 18,
              cursor: 'pointer',
              transition: 'all 180ms ease',
              boxShadow: active ? '0 0 0 3px oklch(0.85 0.17 95 / 0.1)' : 'none',
            }}>
              {p.popular && (
                <div style={{
                  position: 'absolute', top: -1, right: 14,
                  background: 'var(--solar)', color: 'var(--bg)',
                  fontSize: 9, fontWeight: 600, letterSpacing: '0.08em',
                  padding: '3px 7px', borderRadius: '0 0 3px 3px',
                  fontFamily: 'Geist Mono, monospace',
                  textTransform: 'uppercase',
                }}>
                  Most popular
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 500, letterSpacing: '-0.01em' }}>{p.name}</div>
                  <div className="mono" style={{ fontSize: 10, color: 'var(--ink-4)', marginTop: 2, letterSpacing: '0.04em' }}>{p.tagline}</div>
                </div>
                <div style={{
                  width: 16, height: 16, borderRadius: '50%',
                  border: `1px solid ${active ? 'var(--solar)' : 'var(--line)'}`,
                  background: active ? 'var(--solar)' : 'transparent',
                  display: 'grid', placeItems: 'center',
                  transition: 'all 140ms ease',
                }}>
                  {active && <div style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--bg)' }} />}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 14 }}>
                <span className="tabular" style={{ fontSize: 30, fontWeight: 600, letterSpacing: '-0.03em', color: active ? 'var(--solar)' : 'var(--ink)' }}>
                  €{p.price}
                </span>
                <span className="mono" style={{ fontSize: 11, color: 'var(--ink-4)' }}>/mo</span>
              </div>
              <div style={{ height: 1, background: 'var(--line-soft)', marginBottom: 12 }} />
              <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
                {p.feat.map(f => (
                  <li key={f} style={{ display: 'flex', gap: 8, fontSize: 11.5, color: 'var(--ink-3)', marginBottom: 6, lineHeight: 1.35 }}>
                    <span style={{ color: active ? 'var(--solar)' : 'var(--ink-4)', flexShrink: 0, marginTop: 2 }}><IconCheck size={10} /></span>
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>

      <Card style={{ marginBottom: 18 }}>
        <div className="mono" style={{ fontSize: 10, color: 'var(--ink-4)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 10 }}>Billing cycle</div>
        <div className="ob-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {[
            { v: 'monthly' as const, l: 'Monthly', sub: `€${selectedPlan.price}/mo, billed monthly`, savings: null },
            { v: 'annual' as const, l: 'Annual', sub: `€${selectedPlan.price * 10}/yr, billed up front`, savings: `Save €${selectedPlan.price * 2}/yr` },
          ].map(b => {
            const on = billing === b.v;
            return (
              <label key={b.v} style={{
                display: 'flex', gap: 10, alignItems: 'flex-start',
                padding: '12px 14px',
                background: on ? 'var(--solar-soft)' : 'var(--bg-1)',
                border: `1px solid ${on ? 'oklch(0.70 0.17 95 / 0.35)' : 'var(--line-soft)'}`,
                borderRadius: 8, cursor: 'pointer',
                transition: 'all 140ms',
              }}>
                <input type="radio" name="billing" checked={on} onChange={() => setBilling(b.v)} style={{ marginTop: 2 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 13, fontWeight: 500 }}>{b.l}</span>
                    {b.savings && <Badge tone="solar">{b.savings}</Badge>}
                  </div>
                  <div className="mono" style={{ fontSize: 10.5, color: 'var(--ink-4)', marginTop: 3 }}>{b.sub}</div>
                </div>
              </label>
            );
          })}
        </div>
      </Card>

      <FooterBar>
        <Button variant="ghost" onClick={onBack}>Back</Button>
        <Button onClick={() => setSub(2)} icon={<IconArrow size={14} />}>Continue to billing</Button>
      </FooterBar>
    </div>
  );

  if (sub === 2) return (
    <div className="fade-up">
      <SectionHead eyebrow="06 · Finance · 2 of 3" title="Billing details" desc="Used for invoices and VAT compliance." />

      <div style={{ display: 'grid', gap: 14, marginBottom: 18 }}>
        <div className="ob-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 10 }}>
          <Field label="VAT number"><Input value="IE9876543A" onChange={() => {}} mono /></Field>
          <Field label="Invoice email" required><Input value="accounts@powersolarltd.ie" onChange={() => {}} /></Field>
        </div>
        <Field label="Billing address" required><Input value="Unit 4, Sandyford Industrial Estate" onChange={() => {}} /></Field>
        <div className="ob-county-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
          <Field label="City"><Input value="Dublin" onChange={() => {}} /></Field>
          <Field label="County"><Input value="Dublin" onChange={() => {}} /></Field>
          <Field label="Eircode"><Input value="D18 FX78" onChange={() => {}} mono /></Field>
        </div>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
          <input type="checkbox" defaultChecked />
          <span style={{ fontSize: 12, color: 'var(--ink-3)' }}>Billing address is the same as business address</span>
        </label>
      </div>

      <FooterBar>
        <Button variant="ghost" onClick={() => setSub(1)}>Back</Button>
        <Button onClick={() => setSub(3)} icon={<IconArrow size={14} />}>Continue to payment</Button>
      </FooterBar>
    </div>
  );

  // sub 3 — payment
  return (
    <div className="fade-up">
      <SectionHead eyebrow="06 · Finance · 3 of 3" title="Payment method" desc="Securely processed by Stripe. You won't be charged until your trial ends on 3 May 2026." />

      <div className="ob-finance-grid" style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 16, marginBottom: 18 }}>
        <Card style={{ padding: 18 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div className="mono" style={{ fontSize: 10, color: 'var(--ink-4)', letterSpacing: '0.12em', textTransform: 'uppercase' }}>Card details</div>
            <Badge tone="neutral"><IconLock size={9} /> Stripe-secured</Badge>
          </div>
          <div style={{ display: 'grid', gap: 10 }}>
            <Field label="Card number" mono>
              <Input value="4242 4242 4242 4242" onChange={() => {}} mono aria-label="Card number (demo)" />
              <div className="ob-placeholder-note">Demo card — no real payment</div>
            </Field>
            <div className="ob-grid-3" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
              <Field label="Expiry" mono><Input value="12 / 28" onChange={() => {}} mono /></Field>
              <Field label="CVC" mono><Input value="•••" onChange={() => {}} mono /></Field>
              <Field label="Country"><Input value="Ireland" onChange={() => {}} /></Field>
            </div>
            <Field label="Name on card"><Input value="Sean Power" onChange={() => {}} /></Field>
          </div>
        </Card>

        <Card tone="raised" style={{ padding: 18, display: 'flex', flexDirection: 'column' }}>
          <div className="mono" style={{ fontSize: 10, color: 'var(--ink-4)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 12 }}>Order summary</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
            <span style={{ fontSize: 13 }}>{selectedPlan.name} · {billing}</span>
            <span className="tabular" style={{ fontSize: 13, fontWeight: 500 }}>€{selectedPlan.price * annualMult}</span>
          </div>
          {setupTotal > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
              <span style={{ fontSize: 13 }}>Integration setup <span className="mono" style={{ fontSize: 10, color: 'var(--ink-5)', marginLeft: 4 }}>× {connectedIds.length}</span></span>
              <span className="tabular" style={{ fontSize: 13, fontWeight: 500 }}>€{setupTotal.toLocaleString('en-IE')}</span>
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
            <span className="mono" style={{ fontSize: 11, color: 'var(--ink-4)' }}>VAT (23%)</span>
            <span className="tabular mono" style={{ fontSize: 11, color: 'var(--ink-3)' }}>€{Math.round((selectedPlan.price * annualMult + setupTotal) * 0.23)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 12 }}>
            <span className="mono" style={{ fontSize: 11, color: 'var(--ink-4)' }}>Trial credit (14 d)</span>
            <span className="tabular mono" style={{ fontSize: 11, color: 'var(--green)' }}>−€{Math.round(selectedPlan.price * annualMult * 0.23 / 3)}</span>
          </div>
          <div style={{ height: 1, background: 'var(--line-soft)', marginBottom: 12 }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}>
            <span style={{ fontSize: 13, fontWeight: 500 }}>Total today</span>
            <span className="tabular" style={{ fontSize: 22, fontWeight: 600, color: 'var(--solar)' }}>€0.00</span>
          </div>
          <div className="mono" style={{ fontSize: 10, color: 'var(--ink-4)' }}>
            First charge 19 May 2026
            {setupTotal > 0 && <> · Setup billed after go-live</>}
          </div>
          <div style={{ flex: 1 }} />
          <div style={{ height: 1, background: 'var(--line-soft)', margin: '14px 0' }} />
          <div style={{ fontSize: 11, color: 'var(--ink-4)', lineHeight: 1.5 }}>
            Cancel anytime from Settings. Unused trial time is never charged.
          </div>
        </Card>
      </div>

      <FooterBar>
        <Button variant="ghost" onClick={() => setSub(2)}>Back</Button>
        <Button onClick={onNext} icon={<IconArrow size={14} />}>Confirm &amp; start trial</Button>
      </FooterBar>
    </div>
  );
}
