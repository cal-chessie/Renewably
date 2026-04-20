'use client';

import React from 'react';
import { SectionHead, Button, Card, FooterBar } from '../ui/primitives';
import { IconArrow, IconCheck } from '../ui/icons';
import { INTEGRATIONS, INTEGRATION_CATS, IntegrationItem } from '../onboarding-data';

export default function StepIntegrations({ onNext, onBack }: { onNext: (data: { setupTotal: number; connectedIds: string[] }) => void; onBack: () => void }) {
  const [conn, setConn] = React.useState<Record<string, 'busy' | 'done'>>({ seai: 'done' });
  const [filter, setFilter] = React.useState('All');

  const doConn = (id: string) => {
    setConn(c => ({ ...c, [id]: 'busy' }));
    setTimeout(() => setConn(c => ({ ...c, [id]: 'done' })), 700 + Math.random() * 400);
  };

  const connectedCount = Object.values(conn).filter(v => v === 'done').length;
  const setupTotal = INTEGRATIONS.reduce((sum, it) => conn[it.id] === 'done' ? sum + it.fee : sum, 0);
  const filtered = filter === 'All' ? INTEGRATIONS : INTEGRATIONS.filter(i => i.cat === filter);
  const counts = INTEGRATION_CATS.reduce((acc, c) => {
    acc[c] = c === 'All' ? INTEGRATIONS.length : INTEGRATIONS.filter(i => i.cat === c).length;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="fade-up">
      <SectionHead eyebrow="04 · Tools" title="Connect your stack" desc="Each integration includes a one-off setup fee covering migration, field mapping, and go-live testing. SEAI is pre-linked via your RGI registration." />

      {/* Category tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 14, flexWrap: 'wrap', padding: 3, background: 'var(--bg-1)', border: '1px solid var(--line-soft)', borderRadius: 8 }}>
        {INTEGRATION_CATS.map(c => {
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

      <div style={{ display: 'grid', gap: 6, marginBottom: 16, maxHeight: 400, overflowY: 'auto' }}>
        {filtered.map((it: IntegrationItem) => {
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
                    const fb = el.nextElementSibling;
                    if (fb) (fb as HTMLElement).style.display = 'grid';
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
                <div className="mono tabular" style={{ fontSize: 12.5, fontWeight: 500, color: it.fee === 0 ? 'var(--green)' : 'var(--ink-2)', letterSpacing: '-0.01em' }}>
                  {it.fee === 0 ? 'Free' : `€${it.fee}`}
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
                {state === 'done' ? (<><IconCheck size={11} /> Connected</>) : state === 'busy' ? (<span className="pulse">Connecting…</span>) : 'Connect'}
              </button>
            </div>
          );
        })}
      </div>

      <div className="ob-integ-summary" style={{
        display: 'grid', gridTemplateColumns: '1fr auto', gap: 20, alignItems: 'center',
        padding: '14px 16px',
        background: 'var(--bg-2)',
        border: '1px solid var(--line-soft)',
        borderRadius: 10,
        marginBottom: 16,
      }}>
        <div>
          <div className="mono" style={{ fontSize: 10, color: 'var(--ink-4)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 4 }}>Setup summary</div>
          <div style={{ fontSize: 12.5, color: 'var(--ink-3)', lineHeight: 1.45 }}>
            <span style={{ color: 'var(--green)' }}>●</span> {connectedCount} of {INTEGRATIONS.length} connected
            <span style={{ color: 'var(--ink-5)', margin: '0 8px' }}>·</span>
            Setup fees cover white-glove migration, field-mapping & go-live testing per integration.
            <span style={{ color: 'var(--ink-5)', margin: '0 6px' }}>·</span>
            <span style={{ color: 'var(--ink-4)' }}>Billed once, after go-live.</span>
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div className="mono" style={{ fontSize: 10, color: 'var(--ink-4)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 2 }}>One-off setup total</div>
          <div className="mono tabular" style={{ fontSize: 22, fontWeight: 600, color: 'var(--ink)', letterSpacing: '-0.02em' }}>
            €{setupTotal.toLocaleString('en-IE')}
          </div>
          <div className="mono" style={{ fontSize: 10, color: 'var(--ink-5)', letterSpacing: '0.06em', marginTop: 1 }}>+ €149/mo base · incl. VAT</div>
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
        <Button onClick={() => onNext({ setupTotal, connectedIds: Object.keys(conn).filter(k => conn[k] === 'done') })} icon={<IconArrow size={14} />}>Continue</Button>
      </FooterBar>
    </div>
  );
}
