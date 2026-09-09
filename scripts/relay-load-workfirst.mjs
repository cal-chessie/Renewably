#!/usr/bin/env node
// ============================================================================
// Relay: load the "Work First" 52 into the live CRM, mapped to the REAL schema.
// ----------------------------------------------------------------------------
// Source of truth: the Work First sheet of
//   COMH/RENEWABLY/outbound/Ireland_Renewable_Call_List_RELAY_v4.xlsx
// Behaviour:
//   - Matches each firm to a company already in the DB by normalized name
//     (the 52 are a curated subset of the ~1,334 SEAI-imported companies, so
//     most already exist). Unmatched firms are created.
//   - Upserts the contact (greeting_name, phone, email, do_not_email).
//   - Upserts ONE outbound deal per firm carrying the call script
//     (angle, channel, next_action, list_cohort). Re-running updates in place.
//   - deSlop: no em/en dashes reach the CRM.
// DRY RUN BY DEFAULT. Pass --commit to write. Requires the outreach-columns
// migration (scripts/relay-outreach-columns.sql) to have been applied first.
//
//   node scripts/relay-load-workfirst.mjs            # dry run (matching report)
//   node scripts/relay-load-workfirst.mjs --commit    # write
// ============================================================================
import { existsSync, readFileSync } from 'node:fs'
import { createClient } from '@supabase/supabase-js'
import XLSX from 'xlsx'

function loadEnvFile(p){ if(!existsSync(p))return; for(const raw of readFileSync(p,'utf8').split(/\r?\n/)){const l=raw.trim(); if(!l||l.startsWith('#'))continue; const e=l.indexOf('='); if(e===-1)continue; const k=l.slice(0,e).trim(); let v=l.slice(e+1).trim(); if((v.startsWith('"')&&v.endsWith('"'))||(v.startsWith("'")&&v.endsWith("'")))v=v.slice(1,-1); if(k&&process.env[k]===undefined)process.env[k]=v } }
loadEnvFile('.env.local'); loadEnvFile('.env')

const COMMIT = process.argv.includes('--commit')
const XLSX_PATH = process.env.RELAY_XLSX || '/Users/calchesters/Desktop/SONSSONS/COMH/RENEWABLY/outbound/Ireland_Renewable_Call_List_RELAY_v4.xlsx'
const SHEET = 'Work First'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !serviceKey) { console.error('\n  Missing NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY in .env.local\n'); process.exit(1) }
const svc = createClient(url, serviceKey, { auth: { persistSession: false } })

// no em/en dash, no nbsp, no unicode ellipsis reaches the CRM
const deSlop = (s) => typeof s === 'string'
  ? s.replace(/ /g,' ').replace(/\s*[—–]\s*/g,' - ').replace(/…/g,'...').replace(/[ \t]{2,}/g,' ').trim()
  : s
const norm = (s) => (s||'').toString().toLowerCase()
  .replace(/[.,]/g,' ').replace(/&/g,' and ')
  .replace(/\b(ltd|limited|plc|t\/a|ta|uc|dac)\b/g,' ')
  .replace(/[^a-z0-9 ]/g,' ').replace(/\s+/g,' ').trim()
const isEmail = (s) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test((s||'').trim())

// ── read the Work First sheet ────────────────────────────────────────────────
const wb = XLSX.readFile(XLSX_PATH, { cellDates: true })
const ws = wb.Sheets[SHEET]
if (!ws) { console.error('  Sheet "' + SHEET + '" not found. Sheets: ' + wb.SheetNames.join(', ')); process.exit(1) }
const matrix = XLSX.utils.sheet_to_json(ws, { header: 1, defval: null, blankrows: false, raw: false })
const hi = matrix.findIndex(r => Array.isArray(r) && r.some(c=>/company/i.test(String(c))) && r.some(c=>/greeting/i.test(String(c))))
if (hi === -1) { console.error('  Could not find header row (Company + Greeting)'); process.exit(1) }
const headers = matrix[hi].map(h => String(h||'').trim())
const col = (re) => headers.findIndex(h => re.test(h))
const C = {
  company: col(/^company$/i), greeting: col(/greeting/i), phone: col(/phone/i),
  email: col(/^email/i), website: col(/website|status/i), angle: col(/angle|lead with/i),
  action: col(/^action$/i), channel: col(/channel/i), lists: col(/which list|^on which|lists/i),
}
const rows = matrix.slice(hi+1)
  .map(r => ({
    company: deSlop(r[C.company]), greeting: deSlop(r[C.greeting]), phone: deSlop(r[C.phone]),
    emailRaw: deSlop(r[C.email]), website: deSlop(r[C.website]), angle: deSlop(r[C.angle]),
    action: deSlop(r[C.action]), channel: deSlop(r[C.channel]), lists: deSlop(r[C.lists]),
  }))
  .filter(r => r.company && r.company.length > 1)

console.log('\n  Work First rows parsed:', rows.length, COMMIT ? '(COMMIT)' : '(dry run)')

// ── build the company match map from the DB ──────────────────────────────────
const companies = []
for (let from=0; ; from+=1000){ const { data, error } = await svc.from('companies').select('id,name').range(from,from+999); if(error){console.error('  companies read error:',error.message);process.exit(1)} companies.push(...data); if(data.length<1000)break }
const byNorm = new Map()
for (const c of companies) { const n = norm(c.name); if (!byNorm.has(n)) byNorm.set(n, c) }
console.log('  companies in DB:', companies.length)

let matched = 0, unmatched = 0, dne = 0
const plan = []
for (const r of rows) {
  const email = isEmail(r.emailRaw) ? r.emailRaw.trim() : null
  const doNotEmail = /do not email/i.test(r.channel||'') || /do not email/i.test(r.emailRaw||'') || !email
  if (doNotEmail) dne++
  const hit = byNorm.get(norm(r.company))
  if (hit) matched++; else unmatched++
  plan.push({ ...r, email, doNotEmail, companyId: hit?.id || null, matchedName: hit?.name || null })
}
console.log('  matched to existing companies:', matched, ' | to create:', unmatched, ' | do-not-email:', dne)
console.log('\n  first 8 planned:')
for (const p of plan.slice(0,8)) console.log('   ' + (p.companyId?'[match] ':'[new]   ') + (p.company||'').padEnd(34) + ' greet=' + (p.greeting||'-') + ' phone=' + (p.phone||'-') + ' dne=' + p.doNotEmail)
if (unmatched) { console.log('\n  UNMATCHED (will be created on commit):'); for (const p of plan.filter(x=>!x.companyId)) console.log('   - ' + p.company) }

if (!COMMIT) { console.log('\n  Dry run only. Re-run with --commit to write.\n'); process.exit(0) }

// ── write ─────────────────────────────────────────────────────────────────────
let cCreated=0, contactsUp=0, dealsUp=0
for (const p of plan) {
  let companyId = p.companyId
  if (!companyId) {
    const { data, error } = await svc.from('companies').insert({ name: p.company, website: p.website || null, status: 'prospect', lead_source: 'workfirst', energy_type: 'Solar PV' }).select('id').single()
    if (error) { console.error('  company insert failed for ' + p.company + ':', error.message); continue }
    companyId = data.id; cCreated++
  }
  // contact: reuse the company's first contact if present, else create
  const { data: existingContacts } = await svc.from('contacts').select('id').eq('company_id', companyId).limit(1)
  const contactPayload = { greeting_name: p.greeting || null, phone: p.phone || null, email: p.email, do_not_email: p.doNotEmail }
  let contactId
  if (existingContacts && existingContacts.length) {
    contactId = existingContacts[0].id
    const { error } = await svc.from('contacts').update(contactPayload).eq('id', contactId)
    if (!error) contactsUp++
  } else {
    const { data, error } = await svc.from('contacts').insert({ company_id: companyId, name: p.greeting || p.company, ...contactPayload }).select('id').single()
    if (error) { console.error('  contact insert failed for ' + p.company + ':', error.message); continue }
    contactId = data.id; contactsUp++
  }
  // deal: reuse an existing outbound deal for this company (list_cohort set), else insert
  const { data: existingDeals } = await svc.from('deals').select('id').eq('company_id', companyId).not('list_cohort','is',null).limit(1)
  // product: the DB check constraint allows solarpilot|ai_workforce|both; the whole
  // app maps 'solarpilot' -> "Relay" at display time, so this shows as Relay.
  const dealPayload = { contact_id: contactId, product: 'solarpilot', angle: p.angle || null, channel: p.channel || null, next_action: p.action || null, list_cohort: p.lists || 'Work First', updated_at: new Date().toISOString() }
  if (existingDeals && existingDeals.length) {
    const { error } = await svc.from('deals').update(dealPayload).eq('id', existingDeals[0].id)
    if (!error) dealsUp++
  } else {
    const { error } = await svc.from('deals').insert({ company_id: companyId, stage: 'new_lead', mrr: 0, setup_fee: 0, value: 0, ...dealPayload })
    if (error) { console.error('  deal insert failed for ' + p.company + ':', error.message); continue }
    dealsUp++
  }
}
console.log('\n  DONE. companies created:', cCreated, ' contacts upserted:', contactsUp, ' deals upserted:', dealsUp, '\n')
