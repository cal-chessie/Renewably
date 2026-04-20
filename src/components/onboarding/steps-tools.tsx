'use client';

import { useState } from 'react';
import { SectionHead, Card, Button, FooterBar, Icon } from './ui';

// ─── Step 4 · Integrations ────────────────────────────────────────────────

interface StepIntegrationsProps {
  onNext: (d?: Record<string, unknown>) => void;
  onBack: () => void;
  initialData?: Record<string, unknown>;
}

export function StepIntegrations({ onNext, onBack, initialData }: StepIntegrationsProps) {
  const savedConnected = Array.isArray(initialData?.connectedIds) ? (initialData.connectedIds as string[]) : [];
  const [conn, setConn] = useState<Record<string, string>>(
    () => {
      const initial: Record<string, string> = { seai: 'done' };
      savedConnected.forEach(id => { if (id !== 'seai') initial[id] = 'done'; });
      return initial;
    }
  );
  const [filter, setFilter] = useState('All');
  const items = [
    { id: 'seai', name: 'SEAI Grant Portal', desc: 'Homeowner grant applications & BER submissions', cat: 'Grants', domain: 'seai.ie', popular: true, fee: 0 },
    { id: 'esb',  name: 'ESB Networks NC6', desc: 'Micro-generation export notifications', cat: 'Grants', domain: 'esbnetworks.ie', popular: true, fee: 120 },
    { id: 'mprn', name: 'MPRN Lookup', desc: 'Verify meter numbers against ESB register', cat: 'Grants', domain: 'mprnsearch.ie', fee: 40 },
    { id: 'solis',     name: 'Solis Cloud',         desc: 'Monitor installed Solis inverters', cat: 'Hardware', domain: 'solisinverters.com', popular: true, fee: 180 },
    { id: 'solaredge', name: 'SolarEdge Monitoring', desc: 'Optimiser-level performance data', cat: 'Hardware', domain: 'solaredge.com', popular: true, fee: 220 },
    { id: 'fronius',   name: 'Fronius Solar.web',   desc: 'Fronius inverter fleet & alerts', cat: 'Hardware', domain: 'fronius.com', fee: 180 },
    { id: 'huawei',    name: 'Huawei FusionSolar',  desc: 'Residential & battery monitoring', cat: 'Hardware', domain: 'solar.huawei.com', fee: 180 },
    { id: 'growatt',   name: 'Growatt ShinePhone',  desc: 'Entry-tier inverter monitoring', cat: 'Hardware', domain: 'growatt.com', fee: 140 },
    { id: 'tesla',     name: 'Tesla Powerwall',     desc: 'Battery status via Tesla API', cat: 'Hardware', domain: 'tesla.com', fee: 260 },
    { id: 'aurora',    name: 'Aurora Solar', desc: 'Roof design, shading, performance sims', cat: 'Design', domain: 'aurorasolar.com', popular: true, fee: 280 },
    { id: 'openSolar', name: 'OpenSolar',    desc: 'Free 3D proposal & design tool', cat: 'Design', domain: 'opensolar.com', fee: 120 },
    { id: 'nearmap',   name: 'Nearmap',      desc: 'High-res aerial imagery of Irish rooftops', cat: 'Design', domain: 'nearmap.com', fee: 160 },
    { id: 'xero',       name: 'Xero',            desc: 'Accounting + VAT 3 / RCT returns', cat: 'Finance', domain: 'xero.com', popular: true, fee: 150 },
    { id: 'surf',       name: 'Surf Accounts',   desc: 'Irish SME accounting, CSO-aligned', cat: 'Finance', domain: 'surfaccounts.com', fee: 150 },
    { id: 'sage',       name: 'Sage Business',   desc: 'Payroll + accounting suite', cat: 'Finance', domain: 'sage.com', fee: 180 },
    { id: 'stripe',     name: 'Stripe',          desc: 'Deposits, subscriptions, refunds', cat: 'Finance', domain: 'stripe.com', popular: true, fee: 90 },
    { id: 'gocardless', name: 'GoCardless',      desc: 'SEPA direct debit for PPA customers', cat: 'Finance', domain: 'gocardless.com', fee: 110 },
    { id: 'revenue',    name: 'ROS (Revenue.ie)', desc: 'RCT subbie notifications, VAT returns', cat: 'Finance', domain: 'revenue.ie', fee: 240 },
    { id: 'hubspot',    name: 'HubSpot',    desc: 'Sync contacts, pipelines, sequences', cat: 'CRM', domain: 'hubspot.com', fee: 200 },
    { id: 'pipedrive',  name: 'Pipedrive',  desc: 'Deal pipeline + activities', cat: 'CRM', domain: 'pipedrive.com', fee: 180 },
    { id: 'salesforce', name: 'Salesforce', desc: 'Enterprise CRM sync', cat: 'CRM', domain: 'salesforce.com', fee: 420 },
    { id: 'gmail',    name: 'Google Workspace', desc: 'Gmail, Calendar, Drive, Meet', cat: 'Comms', domain: 'workspace.google.com', popular: true, fee: 60 },
    { id: 'ms365',    name: 'Microsoft 365',    desc: 'Outlook, Teams, SharePoint', cat: 'Comms', domain: 'microsoft365.com', fee: 80 },
    { id: 'whatsapp', name: 'WhatsApp Business', desc: 'Homeowner messaging on the channel they use', cat: 'Comms', domain: 'business.whatsapp.com', popular: true, fee: 140 },
    { id: 'twilio',   name: 'Twilio SMS',       desc: 'Appointment + install-day reminders', cat: 'Comms', domain: 'twilio.com', fee: 110 },
    { id: 'postmark', name: 'Postmark',         desc: 'Transactional email delivery', cat: 'Comms', domain: 'postmarkapp.com', fee: 60 },
    { id: 'servicem8',  name: 'ServiceM8',    desc: 'Install scheduling & job sheets', cat: 'Field ops', domain: 'servicem8.com', fee: 160 },
    { id: 'fergus',     name: 'Fergus',       desc: 'Job management for trades', cat: 'Field ops', domain: 'fergus.com', fee: 160 },
    { id: 'companycam', name: 'CompanyCam',   desc: 'Time-stamped site + install photos', cat: 'Field ops', domain: 'companycam.com', fee: 90 },
  ];
  const cats = ['All', 'Grants', 'Hardware', 'Design', 'Finance', 'CRM', 'Comms', 'Field ops'];
  const doConn = (id: string) => {
    setConn(c => ({ ...c, [id]: 'busy' }));
    setTimeout(() => setConn(c => ({ ...c, [id]: 'done' })), 700 + Math.random() * 400);
  };

  const connectedCount = Object.values(conn).filter(v => v === 'done').length;
  const setupTotal = items.reduce((sum, it) => conn[it.id] === 'done' ? sum + it.fee : sum, 0);
  const filtered = filter === 'All' ? items : items.filter(i => i.cat === filter);
  const counts = cats.reduce((acc, c) => {
    acc[c] = c === 'All' ? items.length : items.filter(i => i.cat === c).length;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="fade-up">
      <SectionHead eyebrow="04 · Tools" title="Connect your stack" desc="Each integration includes a one-off setup fee covering migration, field mapping, and go-live testing. SEAI is pre-linked via your RGI registration." />

      {/* Category tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 14, flexWrap: 'wrap', padding: 3, background: 'var(--bg-1)', border: '1px solid var(--line-soft)', borderRadius: 8 }}>
        {cats.map(c => {
          const on = filter === c;
          return (
            <button key={c} type="button" onClick={() => setFilter(c)} style={{
              padding: '6px 11px',
              background: on ? 'var(--bg-3)' : 'transparent',
              color: on ? 'var(--ink)' : 'var(--ink-4)',
              border: 'none', borderRadius: 5,
              fontSize: 11.5, fontWeight: on ? 500 : 400,
              cursor: 'pointer', fontFamily: 'inherit',
              display: 'inline-flex', alignItems: 'center', gap: 6,
              whiteSpace: 'nowrap',
            }}>
              {c}
              <span className="mono" style={{ fontSize: 10, color: on ? 'var(--ink-4)' : 'var(--ink-5)' }}>{counts[c]}</span>
            </button>
          );
        })}
      </div>

      <div style={{ display: 'grid', gap: 6, marginBottom: 16 }}>
        {filtered.map(it => {
          const state = conn[it.id];
          return (
            <div key={it.id} className="ob-integ-row" style={{
              display: 'grid', gridTemplateColumns: '32px 1fr auto auto',
              alignItems: 'center', gap: 12,
              padding: '10px 14px',
              background: 'var(--bg-1)',
              border: '1px solid var(--line-soft)',
              borderRadius: 8,
            }}>
              <div style={{
                width: 32, height: 32,
                background: '#fff',
                border: '1px solid var(--line-soft)',
                borderRadius: 6,
                display: 'grid', placeItems: 'center',
                overflow: 'hidden',
                position: 'relative',
              }}>
                <img
                  src={`https://www.google.com/s2/favicons?sz=64&domain=${it.domain}`}
                  alt=""
                  width="22" height="22"
                  style={{ display: 'block', objectFit: 'contain' }}
                  onError={e => {
                    const el = e.currentTarget as HTMLImageElement;
                    el.style.display = 'none';
                    const fb = el.nextElementSibling as HTMLElement;
                    if (fb) fb.style.display = 'grid';
                  }}
                />
                <span style={{
                  display: 'none',
                  position: 'absolute', inset: 0,
                  placeItems: 'center',
                  color: 'var(--ink-2)', background: 'var(--bg-2)',
                  fontFamily: 'Geist Mono, monospace',
                  fontSize: 12, fontWeight: 600,
                }}>
                  {it.name[0]}
                </span>
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 500, letterSpacing: '-0.01em', display: 'flex', alignItems: 'center', gap: 8 }}>
                  {it.name}
                  {it.popular && <span className="mono" style={{ fontSize: 9, color: 'var(--solar)', letterSpacing: '0.08em', textTransform: 'uppercase', padding: '1px 5px', border: '1px solid oklch(0.70 0.17 95 / 0.3)', borderRadius: 3, background: 'var(--solar-soft)' }}>Popular</span>}
                </div>
                <div style={{ fontSize: 11.5, color: 'var(--ink-4)', marginTop: 1 }}>{it.desc}</div>
              </div>
              <div className="ob-integ-fee" style={{ textAlign: 'right' }}>
                <div className="mono tabular" style={{
                  fontSize: 12.5, fontWeight: 500,
                  color: it.fee === 0 ? 'var(--green)' : 'var(--ink-2)',
                  letterSpacing: '-0.01em',
                }}>
                  {it.fee === 0 ? 'Free' : `\u20AC${it.fee}`}
                </div>
                <div className="mono" style={{ fontSize: 9, color: 'var(--ink-5)', letterSpacing: '0.08em', textTransform: 'uppercase', marginTop: 2 }}>
                  {it.fee === 0 ? 'Included' : 'one-off'}
                </div>
              </div>
              <button type="button" onClick={() => state !== 'done' && doConn(it.id)} disabled={!!state}
                style={{
                  background: state === 'done' ? 'var(--green-soft)' : 'transparent',
                  color: state === 'done' ? 'var(--green)' : 'var(--ink-2)',
                  border: `1px solid ${state === 'done' ? 'oklch(0.76 0.17 145 / 0.3)' : 'var(--line-soft)'}`,
                  borderRadius: 6,
                  padding: '6px 12px',
                  fontSize: 11.5, fontWeight: 500,
                  cursor: state ? 'default' : 'pointer',
                  fontFamily: 'inherit',
                  minWidth: 100,
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  transition: 'all 160ms',
                }}>
                {state === 'done' ? (<><Icon.Check size={11} /> Connected</>) : state === 'busy' ? (<span className="pulse">Connecting...</span>) : 'Connect'}
              </button>
            </div>
          );
        })}
      </div>

      <div className="ob-integ-summary" style={{
        display: 'grid', gridTemplateColumns: '1fr auto', gap: 20, alignItems: 'center',
        padding: '14px 16px',
        background: 'var(--bg-2)', border: '1px solid var(--line-soft)',
        borderRadius: 10,
        marginBottom: 16,
      }}>
        <div>
          <div className="mono" style={{ fontSize: 10, color: 'var(--ink-4)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 4 }}>
            Setup summary
          </div>
          <div style={{ fontSize: 12.5, color: 'var(--ink-3)', lineHeight: 1.45 }}>
            <span style={{ color: 'var(--green)' }}>&#9679;</span> {connectedCount} of {items.length} connected
            <span style={{ color: 'var(--ink-5)', margin: '0 8px' }}>&middot;</span>
            Setup fees cover white-glove migration, field-mapping &amp; go-live testing per integration.
            <span style={{ color: 'var(--ink-5)', margin: '0 6px' }}>&middot;</span>
            <span style={{ color: 'var(--ink-4)' }}>Billed once, after go-live.</span>
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div className="mono" style={{ fontSize: 10, color: 'var(--ink-4)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 2 }}>
            One-off setup total
          </div>
          <div className="mono tabular" style={{ fontSize: 22, fontWeight: 600, color: 'var(--ink)', letterSpacing: '-0.02em' }}>
            &euro;{setupTotal.toLocaleString('en-IE')}
          </div>
          <div className="mono" style={{ fontSize: 10, color: 'var(--ink-5)', letterSpacing: '0.06em', marginTop: 1 }}>
            + &euro;149/mo base &middot; incl. VAT
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', marginBottom: 16 }}>
        <div className="mono" style={{ color: 'var(--ink-5)', fontSize: 10.5, letterSpacing: '0.06em' }}>
          Don&apos;t see yours? <span style={{ color: 'var(--solar)', textDecoration: 'underline', cursor: 'pointer' }}>Request an integration</span>
        </div>
      </div>

      <FooterBar>
        <Button variant="ghost" onClick={onBack}>Back</Button>
        <Button variant="quiet" onClick={() => onNext({ setupTotal: 0, connectedIds: [] })}>Skip for now</Button>
        <Button onClick={() => onNext({ setupTotal, connectedIds: Object.keys(conn).filter(k => conn[k] === 'done') })} icon={<Icon.Arrow size={14} />}>Continue</Button>
      </FooterBar>
    </div>
  );
}
