'use client';

import { useState } from 'react';
import { COUNTIES, PROVINCES } from './data';
import { SectionHead, Card, Button, FooterBar, Icon } from './ui';

// ─── Step 3 · Territory ───────────────────────────────────────────────────

interface StepTerritoryProps {
  onNext: (d?: Record<string, unknown>) => void;
  onBack: () => void;
  initialData?: Record<string, unknown>;
}

export function StepTerritory({ onNext, onBack, initialData }: StepTerritoryProps) {
  const [sel, setSel] = useState<string[]>(
    Array.isArray(initialData?.counties) ? (initialData.counties as string[]) : []
  );
  const [provFilter, setProvFilter] = useState('All');
  const tog = (c: string) => setSel(s => s.includes(c) ? s.filter(x => x !== c) : [...s, c]);
  const togProv = (p: string) => {
    const cs = PROVINCES[p];
    const allIn = cs.every(c => sel.includes(c));
    setSel(s => allIn ? s.filter(c => !cs.includes(c)) : Array.from(new Set([...s, ...cs])));
  };
  const togAll = () => setSel(s => s.length === COUNTIES.length ? [] : [...COUNTIES]);

  const visibleCounties = provFilter === 'All' ? COUNTIES : PROVINCES[provFilter];

  // Est. reach calc
  const reach = sel.length * 32;

  return (
    <div className="fade-up">
      <SectionHead eyebrow="03 · Territory" title="Where do you install?" desc="We'll route qualified homeowner leads to you within this service area. Expand or contract anytime." />

      {/* Province filter + stats */}
      <div className="ob-territory-grid" style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 20, alignItems: 'stretch', marginBottom: 14 }}>
        <Card tone="raised" style={{ padding: 14 }}>
          <div className="mono" style={{ fontSize: 10, color: 'var(--ink-4)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 10 }}>
            Provinces
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {['All', ...Object.keys(PROVINCES)].map(p => {
              const isAll = p === 'All';
              const cs = isAll ? COUNTIES : PROVINCES[p];
              const count = isAll ? sel.length : sel.filter(c => cs.includes(c)).length;
              const active = provFilter === p;
              return (
                <button key={p} type="button" onClick={() => setProvFilter(p)} style={{
                  padding: '6px 11px',
                  background: active ? 'var(--bg-3)' : 'var(--bg-1)',
                  border: `1px solid ${active ? 'var(--solar)' : 'var(--line-soft)'}`,
                  borderRadius: 6,
                  color: active ? 'var(--ink)' : 'var(--ink-3)',
                  fontSize: 12, fontWeight: 500,
                  cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 6,
                  transition: 'all 140ms',
                }}>
                  {p}
                  <span className="mono" style={{ fontSize: 9.5, color: active ? 'var(--solar)' : 'var(--ink-5)' }}>
                    {count}/{cs.length}
                  </span>
                </button>
              );
            })}
          </div>

          <div style={{ display: 'flex', gap: 8, marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--line-soft)' }}>
            <Button size="sm" variant="ghost" onClick={togAll}>
              {sel.length === COUNTIES.length ? 'Deselect all 26' : 'Select all 26'}
            </Button>
            {provFilter !== 'All' && (
              <Button size="sm" variant="ghost" onClick={() => togProv(provFilter)}>
                Toggle {provFilter}
              </Button>
            )}
          </div>
        </Card>

        <Card tone="solar" className="ob-territory-reach" style={{ width: 200, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div className="mono" style={{ fontSize: 9.5, color: 'var(--solar-ink)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 8 }}>
            Est. reach
          </div>
          <div className="tabular" style={{ fontSize: 38, fontWeight: 600, letterSpacing: '-0.035em', color: 'var(--solar-ink)', lineHeight: 1 }}>
            {sel.length}
          </div>
          <div style={{ fontSize: 11, color: 'var(--solar-ink)', opacity: 0.75, marginTop: 4, letterSpacing: '-0.005em' }}>
            counties &middot; ~{reach.toLocaleString()} homes/mo
          </div>
        </Card>
      </div>

      {/* County grid */}
      <Card style={{ marginBottom: 18, padding: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div className="mono" style={{ fontSize: 10, color: 'var(--ink-4)', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
            Counties {provFilter !== 'All' && `&middot; ${provFilter}`}
          </div>
          <div className="mono" style={{ fontSize: 10, color: 'var(--ink-5)' }}>
            {sel.filter(c => visibleCounties.includes(c)).length} of {visibleCounties.length} selected
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 4 }} className="ob-county-grid">
          {visibleCounties.map(c => {
            const on = sel.includes(c);
            return (
              <label key={c} style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '7px 10px',
                border: `1px solid ${on ? 'oklch(0.70 0.17 95 / 0.35)' : 'var(--line-soft)'}`,
                background: on ? 'var(--solar-soft)' : 'var(--bg-1)',
                borderRadius: 6, cursor: 'pointer',
                fontSize: 12,
                color: on ? 'var(--solar-ink)' : 'var(--ink-2)',
                transition: 'all 140ms ease',
              }}>
                <input type="checkbox" checked={on} onChange={() => tog(c)} />
                <span style={{ fontWeight: on ? 500 : 400 }}>{c}</span>
              </label>
            );
          })}
        </div>
      </Card>

      <FooterBar>
        <Button variant="ghost" onClick={onBack}>Back</Button>
        <Button onClick={() => onNext({ counties: sel })} disabled={sel.length === 0} icon={<Icon.Arrow size={14} />}>
          Continue with {sel.length} {sel.length === 1 ? 'county' : 'counties'}
        </Button>
      </FooterBar>
    </div>
  );
}
