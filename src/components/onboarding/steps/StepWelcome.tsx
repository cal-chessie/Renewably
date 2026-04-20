'use client';

import React from 'react';
import { SectionHead, Card, Badge, Button, FooterBar } from '../ui/primitives';
import { IconArrow, IconByName } from '../ui/icons';

export default function StepWelcome({ onNext, onBack }: { onNext: () => void; onBack: () => void }) {
  const [leads, setLeads] = React.useState(30);
  const [installs, setInstalls] = React.useState(12);
  const [revenue, setRevenue] = React.useState(65000);

  const resources = [
    { t: 'Quick start guide', d: '15-min walkthrough — portal, pipeline, first proposal', icon: 'Book', time: '15 min' },
    { t: 'Video tutorials', d: 'Six short clips on AI Co-Pilot, grants, and PPA', icon: 'Chart', time: '32 min' },
    { t: 'API documentation', d: 'Webhooks, REST, and Solis ingestion', icon: 'Plug', time: 'Reference' },
    { t: '1-on-1 onboarding call', d: 'Book a 30-min session with your CSM', icon: 'Team', time: 'Bookable' },
  ];

  return (
    <div className="fade-up">
      <SectionHead eyebrow="08 · Training" title="Welcome aboard, Sean." desc="Resources to get the most out of SolarPilot. Your success metrics are stored to benchmark your trial." />

      <div className="ob-resources" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8, marginBottom: 18 }}>
        {resources.map(r => {
          const IconC = IconByName[r.icon];
          return (
            <Card key={r.t} interactive>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                <div style={{
                  width: 32, height: 32, borderRadius: 6,
                  background: 'var(--bg-2)', border: '1px solid var(--line-soft)',
                  display: 'grid', placeItems: 'center', color: 'var(--solar)',
                }}>
                  {IconC && <IconC size={14} />}
                </div>
                <Badge tone="neutral">{r.time}</Badge>
              </div>
              <div style={{ fontSize: 13.5, fontWeight: 500, letterSpacing: '-0.01em' }}>{r.t}</div>
              <div style={{ fontSize: 11.5, color: 'var(--ink-4)', marginTop: 4, lineHeight: 1.45 }}>{r.d}</div>
            </Card>
          );
        })}
      </div>

      <Card style={{ marginBottom: 18 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <div>
            <div className="mono" style={{ fontSize: 10, color: 'var(--ink-4)', letterSpacing: '0.12em', textTransform: 'uppercase' }}>Your success metrics</div>
            <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 4 }}>We&apos;ll check in weekly against these targets.</div>
          </div>
          <Badge tone="solar">Editable</Badge>
        </div>
        <div className="ob-metrics" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
          {[
            { label: 'Lead target', val: leads, setter: setLeads, unit: '/ month', min: 5, max: 200, step: 5 },
            { label: 'Installs', val: installs, setter: setInstalls, unit: '/ month', min: 1, max: 60, step: 1 },
            { label: 'Revenue', val: revenue, setter: setRevenue, unit: '€ / month', min: 10000, max: 500000, step: 5000 },
          ].map((m, i) => (
            <div key={i}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
                <span className="mono" style={{ fontSize: 10, color: 'var(--ink-4)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>{m.label}</span>
                <span className="mono" style={{ fontSize: 9, color: 'var(--ink-5)' }}>{m.unit}</span>
              </div>
              <div className="tabular" style={{ fontSize: 26, fontWeight: 600, letterSpacing: '-0.025em', color: 'var(--solar)', marginBottom: 8 }}>
                {m.val.toLocaleString()}
              </div>
              <input type="range" min={m.min} max={m.max} step={m.step} value={m.val}
                onChange={e => m.setter(parseInt(e.target.value))}
                style={{ width: '100%' }} />
            </div>
          ))}
        </div>
      </Card>

      <FooterBar>
        <Button variant="ghost" onClick={onBack}>Back</Button>
        <Button onClick={onNext} icon={<IconArrow size={14} />}>Continue to portal</Button>
      </FooterBar>
    </div>
  );
}
