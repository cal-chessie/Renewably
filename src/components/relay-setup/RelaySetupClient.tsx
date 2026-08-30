'use client'

import { useEffect, useMemo, useState } from 'react'

import styles from './RelaySetupClient.module.css'
import { GROUP_TITLES, INTAKE_FIELDS, INTAKE_STAGES } from '@/lib/relay-setup-fields'
import { WEBSITE_DELIVERY_CHECKLIST, type RelaySetupAsset } from '@/lib/relay-setup'

type Answers = Record<string, string | boolean>

interface Props { token: string; companyName: string; contactName: string; preview?: boolean }

function Mark() { return <span className={styles.mark} aria-hidden="true"><i /><b /></span> }
function Arrow() { return <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3 8h9M8.5 3.5 13 8l-4.5 4.5" /></svg> }

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
      .then((data) => { setStage(data.currentStage || 1); setAnswers(data.answers || {}); setAssets(data.assets || []) })
      .catch(() => setError('This setup link is unavailable. Please contact Renewably.'))
      .finally(() => setLoading(false))
  }, [preview, token])

  const current = INTAKE_STAGES[stage - 1]
  const fields = useMemo(() => INTAKE_FIELDS.filter((field) => current.groups.includes(field.group)), [current])
  const completeCount = INTAKE_FIELDS.filter((field) => field.control === 'confirm' ? answers[field.id] === true : Boolean(answers[field.id])).length
  const progress = Math.round((completeCount / INTAKE_FIELDS.length) * 100)

  function updateAnswer(id: string, value: string | boolean) { setAnswers((currentAnswers) => ({ ...currentAnswers, [id]: value })); setMessage('') }
  function answerText(id: string): string { const answer = answers[id]; return typeof answer === 'string' ? answer : '' }

  async function save(nextStage = stage) {
    if (preview) { setMessage('Preview only — no client data has been saved.'); return true }
    setSaving(true); setError(''); setMessage('')
    try {
      const response = await fetch(`/api/relay-setup/${token}/progress`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ currentStage: nextStage, answers }) })
      if (!response.ok) throw new Error()
      setMessage('Saved securely. You can return to this link at any time before it expires.')
      return true
    } catch {
      setError('We could not save that just now. Your answers remain on this screen; please try again.')
      return false
    } finally { setSaving(false) }
  }

  async function next() { if (stage < INTAKE_STAGES.length && await save(stage + 1)) setStage(stage + 1) }
  async function upload(file: File) {
    if (preview) { setAssets((currentAssets) => [...currentAssets, { id: crypto.randomUUID(), originalName: file.name, mimeType: file.type, sizeBytes: file.size, storagePath: '', uploadedAt: new Date().toISOString() }]); return }
    setSaving(true); setError('')
    const body = new FormData(); body.append('file', file)
    try {
      const response = await fetch(`/api/relay-setup/${token}/assets`, { method: 'POST', body })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error)
      setAssets((currentAssets) => [...currentAssets, data.asset]); setMessage('File added securely.')
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

  if (loading) return <main className={styles.loading}><Mark /><p>Opening your private Relay workspace…</p></main>

  return <main id="main-content" className={styles.shell}>
    <div className={styles.grid} aria-hidden="true" />
    <header className={styles.header}>
      <div className={styles.brand}><Mark /><span>Renewably <em>Relay</em></span><small>Private setup</small></div>
      <div className={styles.headerStatus}><span className={styles.statusDot} />{preview ? 'Preview workspace' : 'Invite-only workspace'}</div>
    </header>
    <div className={styles.layout}>
      <aside className={styles.sidebar}>
        <div className={styles.sideIntro}><p className={styles.kicker}>YOUR SETUP</p><h1>One clear handover.<br /><span>Built around your business.</span></h1><p>Start with the material you already have. Save whenever you need; a person reviews every submission before any build begins.</p></div>
        <div className={styles.progressSummary}><div className={styles.progressTrack}><i style={{ width: `${progress}%` }} /></div><span>{completeCount} of {INTAKE_FIELDS.length} items added</span></div>
        <nav className={styles.stageNav} aria-label="Setup stages">
          {INTAKE_STAGES.map((item, index) => {
            const number = index + 1; const isCurrent = stage === number; const isPast = stage > number
            return <button key={item.key} type="button" onClick={() => setStage(number)} className={`${styles.stageButton} ${isCurrent ? styles.current : ''} ${isPast ? styles.past : ''}`}><span>{isPast ? '✓' : String(number).padStart(2, '0')}</span><b>{item.label}</b></button>
          })}
        </nav>
        <div className={styles.sideFoot}>No passwords. No live customer messages. No automatic launch.</div>
      </aside>
      <section className={styles.workspace}>
        <div className={styles.mobileSteps} aria-label="Setup progress">{INTAKE_STAGES.map((item, index) => <button key={item.key} type="button" onClick={() => setStage(index + 1)} aria-current={stage === index + 1 ? 'step' : undefined} className={stage === index + 1 ? styles.mobileCurrent : ''}>{index + 1}</button>)}</div>
        <div className={styles.workspaceHead}><div><p className={styles.kicker}>STAGE {String(stage).padStart(2, '0')} / 08</p><h2>{current.title}</h2><p>{current.description}</p></div><div className={styles.owner}><span>Prepared for</span><strong>{companyName}</strong><small>{contactName}</small></div></div>
        {stage === 1 && <section className={styles.rawCard}><div className={styles.rawIcon}>↗</div><div><p className={styles.kicker}>BEGIN WITH WHAT EXISTS</p><h3>Drop in the material that already tells your story.</h3><p>Brochures, policies, lead notes, brand files, website copy, screenshots and CSVs all reduce follow-up. They are reference material only—not automatic approval.</p></div><label className={styles.uploadButton}>Add materials <Arrow /><input aria-label="Add setup material" type="file" accept=".pdf,.docx,.csv,image/jpeg,image/png,image/webp" hidden onChange={(event) => event.target.files?.[0] && upload(event.target.files[0])} /></label>{assets.length > 0 && <ul className={styles.assets}>{assets.map((asset) => <li key={asset.id}><span>↳</span>{asset.originalName}</li>)}</ul>}</section>}
        {(current.groups.includes('WEB') || current.groups.includes('ACC')) && <aside className={styles.digitalEstate}><div><p className={styles.kicker}>DIGITAL ESTATE</p><h3>Map your digital front door.</h3><p>We need ownership, links and approval routes. Do not add passwords, API keys or identity documents here.</p></div><ul>{WEBSITE_DELIVERY_CHECKLIST.map((item) => <li key={item}>{item}</li>)}</ul></aside>}
        <div className={styles.formArea}>{current.groups.map((group) => <fieldset key={group} className={styles.group}><legend><span>{GROUP_TITLES[group]}</span><i>{fields.filter((field) => field.group === group).length} items</i></legend><div className={styles.fields}>{fields.filter((field) => field.group === group).map((field) => <label key={field.id} className={styles.field}><span className={styles.question}><b>{field.id}</b>{field.prompt}</span>{field.control === 'confirm' ? <span className={styles.checkControl}><input type="checkbox" checked={answers[field.id] === true} onChange={(event) => updateAnswer(field.id, event.target.checked)} /><i>I confirm this is accurate</i></span> : field.control === 'textarea' ? <textarea value={answerText(field.id)} onChange={(event) => updateAnswer(field.id, event.target.value)} rows={4} placeholder="Add what you know. You can return to this." /> : <input value={answerText(field.id)} onChange={(event) => updateAnswer(field.id, event.target.value)} placeholder="Add what you know" />}</label>)}</div></fieldset>)}</div>
        {error && <p role="alert" className={styles.error}>{error}</p>}{message && <p role="status" className={styles.message}>{message}</p>}
        <footer className={styles.actions}><button type="button" disabled={stage === 1 || saving} onClick={() => setStage(stage - 1)} className={styles.back}>Back</button><button type="button" disabled={saving} onClick={() => save()} className={styles.save}>{saving ? 'Saving…' : 'Save and return later'}</button>{stage < INTAKE_STAGES.length ? <button type="button" disabled={saving} onClick={next} className={styles.continue}>Save and continue <Arrow /></button> : <button type="button" disabled={saving} onClick={submit} className={styles.continue}>Submit for human review <Arrow /></button>}</footer>
        <p className={styles.disclaimer}>Submitting this setup does not send customer messages, grant system access or activate production. It creates a reviewed Builder Handover only.</p>
      </section>
    </div>
  </main>
}
