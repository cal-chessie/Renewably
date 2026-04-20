'use client';

import React from 'react';
import { SectionHead, Input, Selector, Button, Card, FooterBar } from '../ui/primitives';
import { IconArrow, IconPlus } from '../ui/icons';

export default function StepTechnical({ onNext, onBack }: { onNext: () => void; onBack: () => void }) {
  const [team, setTeam] = React.useState([
    { n: 'Sean Power', e: 'sean@powersolarltd.ie', r: 'Admin' },
    { n: 'Emma Byrne', e: 'emma@powersolarltd.ie', r: 'Consultant' },
  ]);
  const [ints, setInts] = React.useState(['Solis', 'Stripe', 'Google Workspace']);
  const [sec, setSec] = React.useState(['Audit logs', 'SSO required']);
  const [retention, setRetention] = React.useState(24);

  const allInts = ['Solis','Enphase','SolarEdge','Stripe','QuickBooks','Xero','Google Workspace','Slack','Zapier','HubSpot'];
  const allSec = [
    { v: 'SSO required', d: 'Require Google / Microsoft SSO' },
    { v: 'IP whitelisting', d: 'Restrict logins to office IPs' },
    { v: 'Audit logs', d: 'Track every data change for 12 mo' },
    { v: 'Custom roles', d: 'Define per-team permissions' },
    { v: '2FA enforcement', d: 'Require 2FA for all seats' },
  ];

  const togI = (v: string) => setInts(l => l.includes(v) ? l.filter(x => x !== v) : [...l, v]);
  const togS = (v: string) => setSec(l => l.includes(v) ? l.filter(x => x !== v) : [...l, v]);
  const addSeat = () => setTeam(t => [...t, { n: '', e: '', r: 'Consultant' }]);
  const rmSeat = (i: number) => setTeam(t => t.filter((_, idx) => idx !== i));

  return (
    <div className="fade-up">
      <SectionHead eyebrow="07 · Tech" title="Technical setup" desc="Team seats, integrations, and security posture. All adjustable later." />

      {/* Team */}
      <Card style={{ marginBottom: 18 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div className="mono" style={{ fontSize: 10, color: 'var(--ink-4)', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
            Team · {team.length} seats
          </div>
          <div className="mono" style={{ fontSize: 10, color: 'var(--ink-5)' }}>
            5 included · €29/seat after
          </div>
        </div>
        <div style={{ display: 'grid', gap: 6 }}>
          {team.map((u, i) => (
            <div key={i} className="ob-team-row" style={{
              display: 'grid', gridTemplateColumns: '1.2fr 1.4fr 140px 32px', gap: 6,
              alignItems: 'center',
            }}>
              <Input value={u.n} onChange={v => setTeam(t => t.map((x, idx) => idx === i ? { ...x, n: v } : x))} placeholder="Full name" />
              <Input value={u.e} onChange={v => setTeam(t => t.map((x, idx) => idx === i ? { ...x, e: v } : x))} placeholder="email@company.ie" />
              <Selector value={u.r} options={['Admin', 'Consultant', 'Viewer']} onChange={v => setTeam(t => t.map((x, idx) => idx === i ? { ...x, r: v } : x))} />
              <button type="button" onClick={() => rmSeat(i)} disabled={i === 0} style={{
                background: 'transparent', border: '1px solid var(--line-soft)',
                color: 'var(--ink-4)', borderRadius: 6, width: 32, height: 32,
                cursor: i === 0 ? 'not-allowed' : 'pointer', opacity: i === 0 ? 0.3 : 1,
                display: 'grid', placeItems: 'center', fontSize: 14,
              }}>×</button>
            </div>
          ))}
        </div>
        <button type="button" onClick={addSeat} style={{
          marginTop: 10, padding: '8px 12px',
          background: 'transparent', border: '1px dashed var(--line)',
          color: 'var(--ink-3)', borderRadius: 6,
          fontSize: 12, fontWeight: 500, cursor: 'pointer',
          fontFamily: 'inherit', width: '100%',
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
        }}>
          <IconPlus size={11} /> Add team member
        </button>
      </Card>

      <div className="ob-grid-intsec" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 18 }}>
        {/* Integrations */}
        <Card>
          <div className="mono" style={{ fontSize: 10, color: 'var(--ink-4)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 12 }}>
            Integrations ({ints.length})
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
            {allInts.map(o => {
              const on = ints.includes(o);
              return (
                <label key={o} style={{
                  display: 'flex', alignItems: 'center', gap: 7,
                  padding: '6px 8px', borderRadius: 5,
                  fontSize: 11.5, cursor: 'pointer',
                  color: on ? 'var(--ink)' : 'var(--ink-3)',
                  background: on ? 'var(--bg-2)' : 'transparent',
                  transition: 'all 120ms',
                }}>
                  <input type="checkbox" checked={on} onChange={() => togI(o)} />
                  {o}
                </label>
              );
            })}
          </div>
        </Card>

        {/* Security */}
        <Card>
          <div className="mono" style={{ fontSize: 10, color: 'var(--ink-4)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 12 }}>
            Security ({sec.length})
          </div>
          <div style={{ display: 'grid', gap: 4 }}>
            {allSec.map(o => {
              const on = sec.includes(o.v);
              return (
                <label key={o.v} style={{
                  display: 'flex', alignItems: 'flex-start', gap: 8,
                  padding: '7px 8px', borderRadius: 5,
                  cursor: 'pointer',
                  background: on ? 'var(--bg-2)' : 'transparent',
                  transition: 'all 120ms',
                }}>
                  <input type="checkbox" checked={on} onChange={() => togS(o.v)} style={{ marginTop: 2 }} />
                  <div>
                    <div style={{ fontSize: 11.5, color: on ? 'var(--ink)' : 'var(--ink-2)', fontWeight: on ? 500 : 400 }}>{o.v}</div>
                    <div style={{ fontSize: 10.5, color: 'var(--ink-4)', marginTop: 1 }}>{o.d}</div>
                  </div>
                </label>
              );
            })}
          </div>
        </Card>
      </div>

      {/* Data retention */}
      <Card style={{ marginBottom: 18 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <div className="mono" style={{ fontSize: 10, color: 'var(--ink-4)', letterSpacing: '0.12em', textTransform: 'uppercase' }}>Data retention</div>
          <div className="mono tabular" style={{ fontSize: 12, color: 'var(--solar)', fontWeight: 500 }}>{retention} months</div>
        </div>
        <input type="range" min={6} max={84} step={6} value={retention}
          onChange={e => setRetention(parseInt(e.target.value))}
          style={{ width: '100%' }} />
        <div className="mono" style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9.5, color: 'var(--ink-5)', marginTop: 4 }}>
          <span>6 mo</span><span>GDPR min. 24 mo</span><span>84 mo</span>
        </div>
      </Card>

      <FooterBar>
        <Button variant="ghost" onClick={onBack}>Back</Button>
        <Button onClick={onNext} icon={<IconArrow size={14} />}>Complete setup</Button>
      </FooterBar>
    </div>
  );
}
