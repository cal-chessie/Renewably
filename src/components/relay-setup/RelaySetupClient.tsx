'use client'

import { useEffect, useMemo, useState } from 'react'

import { GROUP_TITLES, INTAKE_FIELDS, INTAKE_STAGES } from '@/lib/relay-setup-fields'
import { WEBSITE_DELIVERY_CHECKLIST, type RelaySetupAsset } from '@/lib/relay-setup'

type Answers = Record<string, string | boolean>

interface Props {
  token: string
  companyName: string
  contactName: string
  preview?: boolean
}

export default function RelaySetupClient({ token, companyName, contactName, preview = false }: Props) {
  const [stage, setStage] = useState(1)
  const [answers, setAnswers] = useState<Answers>({})
  const [assets, setAssets] = useState<RelaySetupAsset[]>([])
  const [loading, setLoading] = useState(!preview)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (preview) return
    fetch(`/api/relay-setup/${token}`)
      .then(async (response) => response.ok ? response.json() : Promise.reject())
      .then((data) => {
        setStage(data.currentStage || 1)
        setAnswers(data.answers || {})
        setAssets(data.assets || [])
      })
      .catch(() => setError('This setup link is unavailable. Please contact Renewably.'))
      .finally(() => setLoading(false))
  }, [preview, token])

  const current = INTAKE_STAGES[stage - 1]
  const fields = useMemo(() => INTAKE_FIELDS.filter((field) => current.groups.includes(field.group)), [current])
  const completeCount = INTAKE_FIELDS.filter((field) => field.control === 'confirm' ? answers[field.id] === true : Boolean(answers[field.id])).length

  function updateAnswer(id: string, value: string | boolean) {
    setAnswers((currentAnswers) => ({ ...currentAnswers, [id]: value }))
    setMessage('')
  }

  function answerText(id: string): string {
    const answer = answers[id]
    return typeof answer === 'string' ? answer : ''
  }

  async function save(nextStage = stage) {
    if (preview) {
      setMessage('Preview only — no client data has been saved.')
      return true
    }
    setSaving(true); setError(''); setMessage('')
    try {
      const response = await fetch(`/api/relay-setup/${token}/progress`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ currentStage: nextStage, answers }),
      })
      if (!response.ok) throw new Error()
      setMessage('Saved securely. You can return to this link at any time before it expires.')
      return true
    } catch {
      setError('We could not save that just now. Your answers remain on this screen; please try again.')
      return false
    } finally { setSaving(false) }
  }

  async function next() {
    if (stage < 8 && await save(stage + 1)) setStage(stage + 1)
  }

  async function upload(file: File) {
    if (preview) {
      setAssets((currentAssets) => [...currentAssets, { id: crypto.randomUUID(), originalName: file.name, mimeType: file.type, sizeBytes: file.size, storagePath: '', uploadedAt: new Date().toISOString() }])
      return
    }
    setSaving(true); setError('')
    const body = new FormData(); body.append('file', file)
    try {
      const response = await fetch(`/api/relay-setup/${token}/assets`, { method: 'POST', body })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error)
      setAssets((currentAssets) => [...currentAssets, data.asset])
      setMessage('File added securely.')
    } catch (caught) { setError(caught instanceof Error ? caught.message : 'Could not upload that file.') }
    finally { setSaving(false) }
  }

  async function submit() {
    if (preview) { setMessage('Preview only — a real submission creates a human-review handover, never a live deployment.'); return }
    setSaving(true); setError(''); setMessage('')
    try {
      const response = await fetch(`/api/relay-setup/${token}/submit`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ answers }) })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Could not submit setup')
      setMessage('Received. Your Builder Handover is now waiting for human review. Nothing is live yet.')
    } catch (caught) { setError(caught instanceof Error ? caught.message : 'Could not submit setup.') }
    finally { setSaving(false) }
  }

  if (loading) return <main style={shell}><p style={{ color: '#f6f0df' }}>Opening your private Relay setup…</p></main>

  return <main style={shell}>
    <section style={card}>
      <p style={eyebrow}>RENEWABLY RELAY · PRIVATE SETUP</p>
      <h1 style={{ margin: '0 0 12px', fontSize: 'clamp(30px, 5vw, 50px)', letterSpacing: '-.05em' }}>Build the front desk around how {companyName} actually works.</h1>
      <p style={lede}>Hi {contactName}. Start with what you have. Upload source material first, answer in your own words, and save whenever you need. This creates a reviewed setup brief—not a live system.</p>
      <div style={notice}><strong>Relay starts with a PA and Chief of Staff.</strong> Other capabilities remain future options until there is a clear use case, safety boundary and your approval.</div>

      <div aria-label="Setup progress" style={progressWrap}>
        <div style={{ ...progressFill, width: `${Math.round((completeCount / INTAKE_FIELDS.length) * 100)}%` }} />
      </div>
      <p style={{ margin: '9px 0 0', color: '#706b60', fontSize: 13 }}>{completeCount} of {INTAKE_FIELDS.length} required items complete</p>
    </section>

    <section style={{ ...card, marginTop: 18 }}>
      <nav aria-label="Setup sections" style={steps}>
        {INTAKE_STAGES.map((item, index) => <button key={item.key} type="button" onClick={() => setStage(index + 1)} style={{ ...stepButton, ...(stage === index + 1 ? activeStep : {}) }}>{index + 1}. {item.label}</button>)}
      </nav>

      <p style={eyebrow}>SECTION {stage} OF 8</p>
      <h2 style={{ margin: '0 0 8px', fontSize: 28, letterSpacing: '-.035em' }}>{current.title}</h2>
      <p style={{ color: '#5e594f', marginTop: 0 }}>{current.description}</p>

      {(current.groups.includes('WEB') || current.groups.includes('ACC')) && <aside style={digitalEstate}>
        <strong>Website &amp; Digital Estate</strong>
        <p>Use this section to give us the map of your digital front door. We need ownership, links and approval routes—not passwords or API keys.</p>
        <ul>{WEBSITE_DELIVERY_CHECKLIST.map((item) => <li key={item}>{item}</li>)}</ul>
      </aside>}

      {stage === 1 && <section style={rawDrop}>
        <strong>Start with a RAW materials drop</strong>
        <p>Upload existing brochures, policies, lead-process notes, brand files, website copy, screenshots or a CSV. We will use them to reduce rework—not treat them as automatic approval.</p>
        <label style={uploadButton}>Add files<input aria-label="Add setup material" type="file" accept=".pdf,.docx,.csv,image/jpeg,image/png,image/webp" hidden onChange={(event) => event.target.files?.[0] && upload(event.target.files[0])} /></label>
        {assets.length > 0 && <ul style={{ marginBottom: 0 }}>{assets.map((asset) => <li key={asset.id}>{asset.originalName}</li>)}</ul>}
      </section>}

      {current.groups.map((group) => <fieldset key={group} style={groupBox}>
        <legend style={legend}>{GROUP_TITLES[group]}</legend>
        {fields.filter((field) => field.group === group).map((field) => <label key={field.id} style={fieldLabel}>
          <span><b>{field.id}</b> — {field.prompt}</span>
          {field.control === 'confirm'
            ? <input type="checkbox" checked={answers[field.id] === true} onChange={(event) => updateAnswer(field.id, event.target.checked)} style={{ width: 20, height: 20, marginTop: 10 }} />
            : field.control === 'textarea'
              ? <textarea value={answerText(field.id)} onChange={(event) => updateAnswer(field.id, event.target.value)} rows={4} style={inputStyle} />
              : <input value={answerText(field.id)} onChange={(event) => updateAnswer(field.id, event.target.value)} style={inputStyle} />}
        </label>)}
      </fieldset>)}

      {error && <p role="alert" style={{ color: '#a62b1f' }}>{error}</p>}
      {message && <p role="status" style={{ color: '#24653b' }}>{message}</p>}
      <footer style={actions}>
        <button type="button" disabled={stage === 1 || saving} onClick={() => setStage(stage - 1)} style={secondary}>Back</button>
        <button type="button" disabled={saving} onClick={() => save()} style={secondary}>{saving ? 'Saving…' : 'Save and return later'}</button>
        {stage < 8 ? <button type="button" disabled={saving} onClick={next} style={primary}>Save and continue</button> : <button type="button" disabled={saving} onClick={submit} style={primary}>Submit for human review</button>}
      </footer>
      <p style={{ color: '#706b60', fontSize: 12, marginBottom: 0 }}>No customer messages are sent, no system is activated and no production access is granted from this form.</p>
    </section>
  </main>
}

const shell = { minHeight: '100vh', padding: 'clamp(20px, 5vw, 72px)', background: '#191917', color: '#1d1a15', fontFamily: 'Arial, sans-serif' } as const
const card = { maxWidth: 1120, margin: '0 auto', padding: 'clamp(22px, 4vw, 54px)', background: '#f6f0df', borderRadius: 28 } as const
const eyebrow = { color: '#756b2a', letterSpacing: '.12em', fontSize: 11, fontWeight: 800, margin: '0 0 16px' } as const
const lede = { maxWidth: 720, color: '#5e594f', fontSize: 17, lineHeight: 1.55 } as const
const notice = { marginTop: 22, padding: '16px 18px', borderRadius: 14, background: '#e9dc72', lineHeight: 1.5 } as const
const progressWrap = { overflow: 'hidden', height: 8, marginTop: 30, borderRadius: 999, background: '#dfd7c4' } as const
const progressFill = { height: '100%', borderRadius: 999, background: '#a69522', transition: 'width .2s ease' } as const
const steps = { display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 22, marginBottom: 28, borderBottom: '1px solid #ddd4c1' } as const
const stepButton = { flex: '0 0 auto', border: '1px solid #d1c7b0', borderRadius: 999, padding: '8px 11px', background: 'transparent', color: '#4e493f', cursor: 'pointer', fontWeight: 700, fontSize: 12 } as const
const activeStep = { background: '#1d1a15', borderColor: '#1d1a15', color: '#fff' } as const
const digitalEstate = { margin: '28px 0', padding: 20, borderRadius: 16, background: '#e3efe8', lineHeight: 1.55 } as const
const rawDrop = { margin: '28px 0', padding: 22, border: '2px dashed #a69522', borderRadius: 16, background: '#fffaf0', lineHeight: 1.5 } as const
const uploadButton = { display: 'inline-block', marginTop: 10, padding: '10px 14px', borderRadius: 10, background: '#1d1a15', color: '#fff', cursor: 'pointer', fontWeight: 700 } as const
const groupBox = { margin: '26px 0', padding: '20px clamp(14px, 3vw, 30px)', border: '1px solid #d8cdb7', borderRadius: 18 } as const
const legend = { padding: '0 8px', color: '#756b2a', fontWeight: 800 } as const
const fieldLabel = { display: 'block', margin: '20px 0', color: '#38342d', fontSize: 14, lineHeight: 1.45 } as const
const inputStyle = { display: 'block', boxSizing: 'border-box', width: '100%', marginTop: 9, padding: 12, border: '1px solid #bfb49d', borderRadius: 10, background: '#fffdf7', color: '#1d1a15', font: 'inherit' } as const
const actions = { display: 'flex', justifyContent: 'flex-end', gap: 10, flexWrap: 'wrap', marginTop: 30 } as const
const secondary = { padding: '12px 16px', border: '1px solid #857b68', borderRadius: 10, background: 'transparent', color: '#1d1a15', cursor: 'pointer', fontWeight: 800 } as const
const primary = { padding: '12px 16px', border: '1px solid #1d1a15', borderRadius: 10, background: '#1d1a15', color: '#fff', cursor: 'pointer', fontWeight: 800 } as const
