'use client';

import React from 'react';
import { SectionHead, Button, Card, Badge, FooterBar } from '../ui/primitives';
import { IconArrow, IconCheck, IconDoc } from '../ui/icons';
import { DOCS } from '../onboarding-data';

interface DocItem {
  id: string;
  name: string;
  desc: string;
  pages: number;
}

export default function StepLegal({ onNext, onBack }: { onNext: () => void; onBack: () => void }) {
  const [signed, setSigned] = React.useState<Record<string, boolean>>({});
  const [busy, setBusy] = React.useState(false);
  const [viewingDoc, setViewingDoc] = React.useState<DocItem | null>(null);
  const allDone = DOCS.every(d => signed[d.id]);

  const signAll = () => {
    setBusy(true);
    let i = 0;
    const timer = setInterval(() => {
      if (i >= DOCS.length) {
        clearInterval(timer);
        setBusy(false);
        return;
      }
      const doc = DOCS[i];
      i++;
      setSigned(s => ({ ...s, [doc.id]: true }));
      if (i >= DOCS.length) {
        clearInterval(timer);
        setBusy(false);
      }
    }, 380);
  };

  return (
    <div className="fade-up">
      <SectionHead eyebrow="05 · Legal" title="Legal agreements" desc="Review and sign to proceed. Copies will be sent to your email and stored in your portal under Settings → Documents." />

      <div style={{ display: 'grid', gap: 8, marginBottom: 18 }}>
        {DOCS.map(doc => {
          const isSigned = signed[doc.id];
          return (
            <div key={doc.id} className="ob-doc-row" style={{
              display: 'grid', gridTemplateColumns: '36px 1fr auto auto',
              alignItems: 'center', gap: 14,
              padding: '12px 14px',
              background: isSigned ? 'var(--green-soft)' : 'var(--bg-1)',
              border: `1px solid ${isSigned ? 'oklch(0.76 0.17 145 / 0.25)' : 'var(--line-soft)'}`,
              borderRadius: 8,
              transition: 'all 300ms ease',
            }}>
              <div style={{
                width: 36, height: 36, borderRadius: 4,
                background: 'var(--bg-2)',
                border: '1px solid var(--line-soft)',
                display: 'grid', placeItems: 'center',
                color: isSigned ? 'var(--green)' : 'var(--ink-3)',
              }}>
                <IconDoc size={16} />
              </div>
              <div>
                <div style={{ fontSize: 13.5, fontWeight: 500, letterSpacing: '-0.01em', display: 'flex', alignItems: 'center', gap: 8 }}>
                  {doc.name}
                  {isSigned && <Badge tone="green"><IconCheck size={9} /> Signed</Badge>}
                </div>
                <div style={{ fontSize: 11.5, color: 'var(--ink-4)', marginTop: 2 }}>{doc.desc}</div>
              </div>
              <div className="ob-doc-pp mono" style={{ fontSize: 10, color: 'var(--ink-5)' }}>{doc.pages} pp</div>
              <button type="button" onClick={() => setViewingDoc(doc)}
                style={{
                  background: 'transparent', border: '1px solid var(--line-soft)',
                  color: 'var(--ink-2)', borderRadius: 6,
                  padding: '6px 12px', fontSize: 12, fontWeight: 500, cursor: 'pointer',
                  fontFamily: 'inherit',
                }}>
                Preview
              </button>
            </div>
          );
        })}
      </div>

      {viewingDoc && (
        <div onClick={() => setViewingDoc(null)} style={{
          position: 'fixed', inset: 0, zIndex: 100,
          background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)',
          display: 'grid', placeItems: 'center',
          animation: 'obFadeUp 200ms ease',
        }}>
          <div onClick={e => e.stopPropagation()} style={{
            width: 520, maxHeight: '80vh',
            background: 'var(--bg-1)', border: '1px solid var(--line)',
            borderRadius: 10, overflow: 'hidden',
            display: 'flex', flexDirection: 'column',
          }}>
            <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--line-soft)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 500 }}>{viewingDoc.name}</div>
                <div className="mono" style={{ fontSize: 10, color: 'var(--ink-4)' }}>{viewingDoc.pages} pages · Rev. Apr 2026</div>
              </div>
              <button type="button" onClick={() => setViewingDoc(null)}
                style={{ background: 'transparent', border: 'none', color: 'var(--ink-3)', fontSize: 18, cursor: 'pointer' }}>×</button>
            </div>
            <div style={{ padding: 20, overflowY: 'auto', fontSize: 11.5, color: 'var(--ink-3)', lineHeight: 1.7 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink)', marginBottom: 10 }}>1. Definitions</div>
              <p style={{ margin: '0 0 12px' }}>In this Agreement, &quot;Service&quot; means the SolarPilot platform provided by Renewably Ltd to the Customer under the terms hereof…</p>
              <div className="img-placeholder" style={{ height: 60, marginBottom: 12 }}>DOCUMENT BODY · PLACEHOLDER</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink)', marginBottom: 10 }}>2. Term and termination</div>
              <p style={{ margin: '0 0 12px' }}>This Agreement shall commence on the Effective Date and continue until terminated in accordance with clause 8…</p>
              <div className="img-placeholder" style={{ height: 80 }}>DOCUMENT BODY · PLACEHOLDER</div>
            </div>
            <div style={{ padding: 14, borderTop: '1px solid var(--line-soft)', display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <Button variant="ghost" size="sm" onClick={() => setViewingDoc(null)}>Close</Button>
              <Button size="sm" onClick={() => { setSigned(s => ({ ...s, [viewingDoc.id]: true })); setViewingDoc(null); }}>
                Agree &amp; sign
              </Button>
            </div>
          </div>
        </div>
      )}

      <FooterBar>
        <Button variant="ghost" onClick={onBack}>Back</Button>
        {allDone
          ? <Button onClick={onNext} icon={<IconArrow size={14} />}>Continue to finance</Button>
          : <Button onClick={signAll} disabled={busy} icon={<IconCheck size={12} />}>
              {busy ? 'Signing…' : `Sign all ${DOCS.length} documents`}
            </Button>
        }
      </FooterBar>
    </div>
  );
}
