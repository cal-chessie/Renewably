'use client';

import React from 'react';
import { Field, Input, Button, Card, Badge, Selector } from '../ui/primitives';
import { IconArrow, IconCheck } from '../ui/icons';
import { TIME_SLOTS, FOCUS_OPTIONS, addMins } from '../onboarding-data';

export default function BookDemo({ onBack, onDone }: { onBack: () => void; onDone: () => void }) {
  const [stage, setStage] = React.useState<'form' | 'confirmed'>('form');
  const [form, setForm] = React.useState({
    name: 'Sean Power',
    email: 'sean@powersolarltd.ie',
    company: 'Power Solar Ltd',
    phone: '087 123 4567',
    size: '6-15',
    role: 'Founder',
    focus: ['Lead generation', 'Grant paperwork'],
  });
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));
  const togFocus = (v: string) => setForm(f => ({ ...f, focus: f.focus.includes(v) ? f.focus.filter(x => x !== v) : [...f.focus, v] }));

  const today = new Date();
  const [monthOffset, setMonthOffset] = React.useState(0);
  const viewMonth = new Date(today.getFullYear(), today.getMonth() + monthOffset, 1);
  const monthName = viewMonth.toLocaleDateString('en-IE', { month: 'long', year: 'numeric' });
  const daysInMonth = new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 0).getDate();
  const firstDay = (viewMonth.getDay() + 6) % 7;
  const [selDate, setSelDate] = React.useState<number | null>(null);
  const [selTime, setSelTime] = React.useState<string | null>(null);

  const isAvailable = (d: number) => {
    const date = new Date(viewMonth.getFullYear(), viewMonth.getMonth(), d);
    if (date < new Date(today.getFullYear(), today.getMonth(), today.getDate())) return false;
    const dow = date.getDay();
    if (dow === 0 || dow === 6) return false;
    return (d * 7 + viewMonth.getMonth()) % 5 !== 0;
  };

  const canConfirm = selDate !== null && selTime !== null && form.name && form.email && form.company;

  const confirm = () => {
    if (!canConfirm) return;
    setStage('confirmed');
  };

  const selectedDateStr = selDate ? new Date(viewMonth.getFullYear(), viewMonth.getMonth(), selDate).toLocaleDateString('en-IE', { weekday: 'long', month: 'long', day: 'numeric' }) : '';

  const monthBtnStyle = (disabled: boolean): React.CSSProperties => ({
    width: 28, height: 28,
    background: 'var(--bg-2)', border: '1px solid var(--line-soft)',
    color: disabled ? 'var(--ink-5)' : 'var(--ink-2)',
    borderRadius: 5, cursor: disabled ? 'not-allowed' : 'pointer',
    fontSize: 14, fontFamily: 'inherit',
    opacity: disabled ? 0.4 : 1,
  });

  if (stage === 'confirmed') {
    return (
      <div className="fade-up" style={{ padding: '20px 0' }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{
            display: 'inline-grid', placeItems: 'center',
            width: 64, height: 64, borderRadius: '50%',
            background: 'var(--solar-soft)', border: '1px solid oklch(0.70 0.17 95 / 0.3)',
            marginBottom: 16, color: 'var(--solar)',
          }}>
            <IconCheck size={26} />
          </div>
          <div className="mono" style={{ fontSize: 10.5, color: 'var(--solar)', letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 8, fontWeight: 500 }}>
            Demo booked
          </div>
          <h1 style={{ fontSize: 32, fontWeight: 600, letterSpacing: '-0.03em', margin: '0 0 8px', lineHeight: 1.1 }}>
            See you {selectedDateStr.split(',')[0]}, <span style={{ color: 'var(--solar)' }}>{form.name.split(' ')[0]}</span>.
          </h1>
          <p style={{ fontSize: 14, color: 'var(--ink-3)', margin: 0, maxWidth: 440, marginLeft: 'auto', marginRight: 'auto', lineHeight: 1.5 }}>
            A calendar invite is on its way to {form.email}. We&apos;ll tailor the demo around {form.focus.slice(0, 2).join(' and ').toLowerCase()}.
          </p>
        </div>

        <Card tone="raised" style={{ marginBottom: 16 }}>
          <div className="ob-confirmed-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div>
              <div className="mono" style={{ fontSize: 10, color: 'var(--ink-4)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 8 }}>When</div>
              <div style={{ fontSize: 15, fontWeight: 500, marginBottom: 4 }}>{selectedDateStr}</div>
              <div className="mono tabular" style={{ fontSize: 13, color: 'var(--solar)' }}>{selTime} — {addMins(selTime!, 30)} IST</div>
            </div>
            <div>
              <div className="mono" style={{ fontSize: 10, color: 'var(--ink-4)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 8 }}>Host</div>
              <div style={{ fontSize: 15, fontWeight: 500, marginBottom: 4 }}>Aoife Ní Bhriain</div>
              <div style={{ fontSize: 12, color: 'var(--ink-4)' }}>Senior Solutions Engineer · Renewably</div>
            </div>
          </div>
          <div style={{ height: 1, background: 'var(--line-soft)', margin: '18px 0' }} />
          <div className="ob-confirmed-meta" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
            {[
              { l: 'Format', v: 'Google Meet · 30 min' },
              { l: 'Language', v: 'English / Gaeilge' },
              { l: 'Attendees', v: `${form.name} + 1` },
            ].map(x => (
              <div key={x.l}>
                <div className="mono" style={{ fontSize: 9.5, color: 'var(--ink-5)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 3 }}>{x.l}</div>
                <div style={{ fontSize: 12.5, color: 'var(--ink-2)' }}>{x.v}</div>
              </div>
            ))}
          </div>
        </Card>

        <Card style={{ marginBottom: 24 }}>
          <div className="mono" style={{ fontSize: 10, color: 'var(--ink-4)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 10 }}>
            While you wait
          </div>
          <div style={{ display: 'grid', gap: 6 }}>
            {[
              'Watch a 3-min product overview video',
              'Browse the SEAI grant integration docs',
              'Invite a colleague to join the call',
            ].map((item, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 10px', borderRadius: 5 }}>
                <span className="mono" style={{ fontSize: 10, color: 'var(--solar)', letterSpacing: '0.04em' }}>
                  {String(i + 1).padStart(2, '0')}
                </span>
                <span style={{ fontSize: 13, color: 'var(--ink-2)' }}>{item}</span>
                <span style={{ marginLeft: 'auto', color: 'var(--ink-4)' }}><IconArrow size={12} /></span>
              </div>
            ))}
          </div>
        </Card>

        <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
          <Button variant="ghost" onClick={onBack}>Back to site</Button>
          <Button onClick={onDone} icon={<IconArrow size={14} />}>Or start a free trial now</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="fade-up" style={{ padding: '8px 0' }}>
      <div style={{ marginBottom: 28, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 20 }}>
        <div>
          <div className="mono" style={{ fontSize: 10, color: 'var(--solar)', letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 10, fontWeight: 500 }}>
            Book a demo
          </div>
          <h1 style={{ fontSize: 36, fontWeight: 600, letterSpacing: '-0.03em', margin: '0 0 10px', lineHeight: 1.05 }}>
            See SolarPilot in action.
          </h1>
          <p style={{ fontSize: 14, color: 'var(--ink-3)', margin: 0, maxWidth: 460, lineHeight: 1.5 }}>
            30 minutes with a Solutions Engineer. We&apos;ll walk through your pipeline, grant flow, and PPA earnings — tailored to your business.
          </p>
        </div>
        <Button variant="ghost" onClick={onBack}>← Back</Button>
      </div>

      <div className="ob-demo-grid" style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 18, marginBottom: 20 }}>
        {/* Calendar + time */}
        <Card style={{ padding: 18 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, gap: 10 }}>
            <div style={{ minWidth: 0 }}>
              <div className="mono" style={{ fontSize: 10, color: 'var(--ink-4)', letterSpacing: '0.12em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
                Pick a date · IST
              </div>
              <div style={{ fontSize: 14, fontWeight: 500, marginTop: 4, whiteSpace: 'nowrap' }}>{monthName}</div>
            </div>
            <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
              <button type="button" onClick={() => setMonthOffset(Math.max(0, monthOffset - 1))} disabled={monthOffset === 0} style={monthBtnStyle(monthOffset === 0)}>‹</button>
              <button type="button" onClick={() => setMonthOffset(Math.min(3, monthOffset + 1))} style={monthBtnStyle(false)}>›</button>
            </div>
          </div>

          <div className="mono" style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, marginBottom: 4 }}>
            {['M','T','W','T','F','S','S'].map((d, i) => (
              <div key={i} style={{ fontSize: 9.5, color: 'var(--ink-5)', textAlign: 'center', letterSpacing: '0.1em', padding: '4px 0' }}>{d}</div>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
            {Array.from({ length: firstDay }).map((_, i) => <div key={'b' + i} />)}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const d = i + 1;
              const avail = isAvailable(d);
              const on = selDate === d;
              return (
                <button key={d} type="button" disabled={!avail}
                  onClick={() => { setSelDate(d); setSelTime(null); }}
                  aria-label={avail ? `${monthName} ${d}` : undefined}
                  style={{
                    aspectRatio: '1',
                    background: on ? 'var(--solar)' : avail ? 'var(--bg-2)' : 'transparent',
                    color: on ? 'var(--bg)' : avail ? 'var(--ink-2)' : 'var(--ink-5)',
                    border: `1px solid ${on ? 'var(--solar)' : avail ? 'var(--line-soft)' : 'transparent'}`,
                    borderRadius: 5,
                    fontSize: 12.5, fontWeight: on ? 600 : 400,
                    cursor: avail ? 'pointer' : 'default',
                    fontFamily: 'Geist Mono, monospace',
                    fontVariantNumeric: 'tabular-nums',
                    transition: 'all 120ms ease',
                    opacity: avail ? 1 : 0.35,
                  }}>
                  {d}
                </button>
              );
            })}
          </div>

          <div style={{ marginTop: 16, paddingTop: 14, borderTop: '1px solid var(--line-soft)' }}>
            <div className="mono" style={{ fontSize: 10, color: 'var(--ink-4)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 10 }}>
              Available times {selDate ? `· ${selectedDateStr}` : ''}
            </div>
            {!selDate ? (
              <div className="mono" style={{ fontSize: 11, color: 'var(--ink-5)', padding: '20px 0', textAlign: 'center' }}>
                Select a date to see times
              </div>
            ) : (
            <div className="ob-grid-3" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
                {TIME_SLOTS.map(t => {
                  const on = selTime === t;
                  return (
                    <button key={t} type="button" onClick={() => setSelTime(t)}
                      className="mono tabular"
                      style={{
                        padding: '9px 6px',
                        background: on ? 'var(--solar-soft)' : 'var(--bg-2)',
                        border: `1px solid ${on ? 'var(--solar)' : 'var(--line-soft)'}`,
                        borderRadius: 6,
                        color: on ? 'var(--solar)' : 'var(--ink-2)',
                        fontSize: 12, fontWeight: 500,
                        cursor: 'pointer',
                      }}>
                      {t}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </Card>

        {/* Details */}
        <Card>
          <div className="mono" style={{ fontSize: 10, color: 'var(--ink-4)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 14 }}>
            Your details
          </div>
          <div style={{ display: 'grid', gap: 10 }}>
            <Field label="Full name" required><Input value={form.name} onChange={v => set('name', v)} /></Field>
            <Field label="Work email" required><Input value={form.email} onChange={v => set('email', v)} type="email" /></Field>
            <div className="ob-grid-2" style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 8 }}>
              <Field label="Company" required><Input value={form.company} onChange={v => set('company', v)} /></Field>
              <Field label="Phone"><Input value={form.phone} onChange={v => set('phone', v)} /></Field>
            </div>
            <div className="ob-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <Field label="Role">
                <Selector value={form.role} options={['Founder', 'Operations', 'Sales', 'Installer']} onChange={v => set('role', v)} />
              </Field>
              <Field label="Team size">
                <Selector value={form.size} options={['1-5', '6-15', '16-30', '30+']} onChange={v => set('size', v)} />
              </Field>
            </div>
          </div>

          <div style={{ marginTop: 16, paddingTop: 14, borderTop: '1px solid var(--line-soft)' }}>
            <div className="mono" style={{ fontSize: 10, color: 'var(--ink-4)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 10 }}>
              What do you want to see?
            </div>
            <div className="ob-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
              {FOCUS_OPTIONS.map(o => {
                const on = form.focus.includes(o);
                return (
                  <label key={o} style={{
                    display: 'flex', alignItems: 'center', gap: 7,
                    padding: '7px 8px',
                    border: `1px solid ${on ? 'oklch(0.70 0.17 95 / 0.35)' : 'var(--line-soft)'}`,
                    background: on ? 'var(--solar-soft)' : 'var(--bg-1)',
                    borderRadius: 5, cursor: 'pointer',
                    fontSize: 11.5,
                    color: on ? 'var(--solar-ink)' : 'var(--ink-3)',
                    transition: 'all 120ms',
                  }}>
                    <input type="checkbox" checked={on} onChange={() => togFocus(o)} />
                    {o}
                  </label>
                );
              })}
            </div>
          </div>
        </Card>
      </div>

      {/* Summary + submit */}
      <div className="ob-booking-bar" style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '14px 18px',
        background: 'var(--bg-2)', border: '1px solid var(--line-soft)',
        borderRadius: 10, gap: 16,
      }}>
        <div style={{ fontSize: 13, color: 'var(--ink-2)', minWidth: 0 }}>
          {selDate && selTime ? (
            <>
              <span className="mono" style={{ fontSize: 10, color: 'var(--ink-4)', letterSpacing: '0.08em', textTransform: 'uppercase', marginRight: 8 }}>Booking</span>
              {selectedDateStr.split(',')[0]}, <span className="mono" style={{ color: 'var(--solar)' }}>{selTime} IST</span> · 30 min · Google Meet
            </>
          ) : (
            <span style={{ color: 'var(--ink-4)' }}>Select a date and time to continue</span>
          )}
        </div>
        <div style={{ flexShrink: 0 }}>
          <Button onClick={confirm} disabled={!canConfirm} icon={<IconArrow size={14} />}>
            Confirm booking
          </Button>
        </div>
      </div>
    </div>
  );
}
