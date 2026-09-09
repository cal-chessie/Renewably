#!/usr/bin/env node
/**
 * import-relay-list.mjs - Relay Work-First (SOLAR only) importer
 * ------------------------------------------------------------------
 * Repeatable, idempotent importer for Cal's "Work First" 52 firms.
 *
 *   Source (preferred): the RELAY v4 call-list xlsx, sheet "Work First"
 *                       (header row 5, 52 firms).
 *   Source (fallback):  the normalized JSON committed at
 *                       scripts/data/relay-workfirst-v4.json
 *
 * It maps each firm to the canonical Relay CRM shape and UPSERTS via the
 * @supabase/supabase-js service client. Dedup keys make re-runs safe:
 *   - company  by  lower(name)
 *   - contact  by  company_id + phone (digits)
 *   - deal     by  company_id + product='relay'  (one work-first card/firm)
 *   - note     by  deal_id + author='relay-import'
 *
 * Every deal is tagged: work_first=true, source='relay-list-v4',
 * stage='new_lead', product='relay'. do_not_email is respected (no email
 * is ever sent, and DNE firms carry no email address + the flag set true).
 *
 * SAFETY: DRY-RUN by default - it prints exactly what it would write.
 *         Pass --commit to actually write.
 *
 * Usage:
 *   node scripts/import-relay-list.mjs               # dry run
 *   node scripts/import-relay-list.mjs --commit      # write
 *   node scripts/import-relay-list.mjs --limit 5     # first 5 firms
 *   node scripts/import-relay-list.mjs --file /path/to/list.xlsx
 *   node scripts/import-relay-list.mjs --json        # force JSON fallback
 *   node scripts/import-relay-list.mjs --owner cal@renewably.ie
 *
 * Env (required for --commit; optional for dry-run classification):
 *   NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 *   RELAY_OWNER_EMAIL (default cal@renewably.ie)
 *   RELAY_XLSX (override source xlsx path)
 *   RELAY_WORKFIRST_JSON (override fallback json path)
 * ------------------------------------------------------------------
 */

import { readFileSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve, join } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const REPO_ROOT = resolve(__dirname, '..')

// ─── Constants (the canonical Relay tags) ────────────────────────────────────
const PRODUCT = 'relay'
const SOURCE = 'relay-list-v4'
const STAGE = 'new_lead'
const NOTE_AUTHOR = 'relay-import'
const SHEET_NAME = 'Work First'
const HEADER_ROW = 5 // 1-indexed; data starts row 6

const DEFAULT_XLSX =
  '/Users/calchesters/Desktop/SONSSONS/COMH/RENEWABLY/outbound/Ireland_Renewable_Call_List_RELAY_v4.xlsx'
const SEED_JSON = join(__dirname, 'data', 'relay-workfirst-v4.json')
const SCRATCH_JSON =
  '/private/tmp/claude-501/-Users-calchesters-Desktop-SONSSONS/3d042ec7-755b-4d74-b313-efbdaaf7d5c4/scratchpad/workfirst.json'

// ─── Tiny arg parser ─────────────────────────────────────────────────────────
function parseArgs(argv) {
  const a = { commit: false, json: false, quiet: false, limit: 0, file: '', owner: '' }
  for (let i = 0; i < argv.length; i++) {
    const t = argv[i]
    if (t === '--commit') a.commit = true
    else if (t === '--json') a.json = true
    else if (t === '--quiet') a.quiet = true
    else if (t === '--limit') a.limit = parseInt(argv[++i] || '0', 10) || 0
    else if (t.startsWith('--limit=')) a.limit = parseInt(t.split('=')[1] || '0', 10) || 0
    else if (t === '--file') a.file = argv[++i] || ''
    else if (t.startsWith('--file=')) a.file = t.split('=')[1] || ''
    else if (t === '--owner') a.owner = argv[++i] || ''
    else if (t.startsWith('--owner=')) a.owner = t.split('=')[1] || ''
    else if (t === '-h' || t === '--help') a.help = true
  }
  return a
}

// ─── Minimal .env loader (no dotenv dependency) ──────────────────────────────
function loadEnvFile(path) {
  if (!existsSync(path)) return
  const text = readFileSync(path, 'utf8')
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim()
    if (!line || line.startsWith('#')) continue
    const eq = line.indexOf('=')
    if (eq === -1) continue
    const key = line.slice(0, eq).trim()
    let val = line.slice(eq + 1).trim()
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1)
    }
    if (key && process.env[key] === undefined) process.env[key] = val
  }
}

// ─── String / phone helpers ──────────────────────────────────────────────────
// Cal's standing rule: no em-dash / en-dash / unicode ellipsis in anything he
// (or a customer) sees. The source list contains them, so every string written
// to the CRM is normalized here (meaning-preserving: dash -> " - ", "…" -> "...").
function deSlop(s) {
  if (typeof s !== 'string') return s
  return s
    .replace(/ /g, ' ') // non-breaking space -> space
    .replace(/\s*[—–]\s*/g, ' - ') // em/en dash -> spaced hyphen
    .replace(/…/g, '...') // unicode ellipsis -> three dots
    .replace(/[ \t]{2,}/g, ' ')
    .trimEnd()
}
function cleanRow(row) {
  const out = {}
  for (const [k, v] of Object.entries(row)) out[k] = typeof v === 'string' ? deSlop(v) : v
  return out
}
const norm = (s) => String(s ?? '').trim().toLowerCase().replace(/\s+/g, ' ')
const normDigits = (s) => {
  const d = String(s ?? '').replace(/\D/g, '')
  return d.length ? d : null
}
const escIlike = (s) => String(s ?? '').replace(/([%_\\])/g, '\\$1')
const isUrl = (s) => /^https?:\/\//i.test(String(s ?? '').trim())
const isIrishMobileDigits = (d) => /^(?:353)?0?8[35679]/.test(String(d ?? ''))

function splitPhones(raw) {
  const parts = String(raw ?? '')
    .split(/[/;]|,|\band\b/i)
    .map((s) => s.trim())
    .filter(Boolean)
  if (parts.length === 0) return { phone: null, mobile: null, numberType: null, primaryDigits: null }
  const phone = parts[0]
  const mobile = parts.find((p) => isIrishMobileDigits(normDigits(p))) || null
  const primaryDigits = normDigits(phone)
  const numberType = primaryDigits
    ? isIrishMobileDigits(primaryDigits)
      ? 'mobile'
      : 'landline'
    : null
  return { phone, mobile, numberType, primaryDigits }
}

function firstSentence(text) {
  const t = String(text ?? '').trim()
  if (!t) return null
  const s = t.split(/(?<=[.!?])\s+/)[0] || t
  return s.length > 180 ? s.slice(0, 177).trimEnd() + '...' : s
}

function toDateOnly(v) {
  if (v === null || v === undefined || v === '') return null
  if (v instanceof Date && !isNaN(v)) return v.toISOString().slice(0, 10)
  const d = new Date(v)
  return isNaN(d) ? null : d.toISOString().slice(0, 10)
}

function deriveSegment(lists) {
  const l = norm(lists)
  if (l.includes('call first')) return 'call-first-rehearsal'
  if (l.includes('broken front door')) return 'broken-front-door'
  return 'work-first'
}

function deriveFitScore(rec, seg) {
  let s = seg === 'broken-front-door' ? 80 : seg === 'call-first-rehearsal' ? 60 : 70
  const l = norm(rec.lists)
  if (l.includes('top 40')) s += 10
  if (!rec.dne && rec.email) s += 2 // reachable by phone AND email
  return Math.max(0, Math.min(100, s))
}

function deriveVerdict(seg) {
  if (seg === 'broken-front-door') return 'Broken front door - SEAI-register leads are being lost'
  if (seg === 'call-first-rehearsal') return 'Rehearsal call - practice plus market intel'
  return 'Work-first call'
}

function composeNote(rec, seg) {
  const lines = [
    'Imported from the Relay Work-First list (v4).',
    `Segment: ${seg}`,
    `Action: ${rec.action || '-'}`,
    `Channel: ${rec.channel || '-'}`,
    `Lists: ${rec.lists || '-'}`,
    `Angle: ${rec.angle || '-'}`,
    `Site / status: ${rec.status || '-'}`,
    `Contact: ${rec.greeting || '-'} | ${rec.phone || '-'}${rec.dne ? ' | DO NOT EMAIL' : ''}`,
  ]
  return lines.join('\n')
}

// ─── Source loading ──────────────────────────────────────────────────────────
function headerKey(label) {
  const s = norm(label)
  if (!s) return null
  if (s.includes('company')) return 'company'
  if (s.includes('greeting')) return 'greeting'
  if (s.includes('phone') || s.includes('mobile')) return 'phone'
  if (s.includes('email')) return 'email'
  if (s.includes('website') || s.includes('status')) return 'status'
  if (s.includes('angle')) return 'angle'
  if (s.includes('channel')) return 'channel'
  if (s.includes('list')) return 'lists'
  if (s.includes('action')) return 'action'
  if (s.includes('contacted')) return 'contacted'
  if (s.includes('outcome')) return 'outcome'
  if (s.includes('next')) return 'nextTouch'
  if (s.includes('do first')) return 'doFirst'
  return null
}

function normalizeRawRow(obj) {
  const emailCell = String(obj.email ?? '')
  const channel = String(obj.channel ?? '')
  const looksEmail = /@/.test(emailCell) && !/do\s*not\s*email/i.test(emailCell)
  const dne =
    /do\s*not\s*email/i.test(emailCell) ||
    /do\s*not\s*email/i.test(channel) ||
    /phone\s*only/i.test(channel)
  const company = String(obj.company ?? '').trim()
  if (!company) return null
  return {
    company,
    greeting: String(obj.greeting ?? '').trim() || null,
    phone: String(obj.phone ?? '').trim() || null,
    action: String(obj.action ?? '').trim() || null,
    channel: channel.trim() || null,
    lists: String(obj.lists ?? '').trim() || null,
    angle: String(obj.angle ?? '').trim() || null,
    status: String(obj.status ?? '').trim() || null,
    dne: !!dne,
    email: looksEmail ? emailCell.trim() : '',
    contacted: obj.contacted ?? null,
    outcome: obj.outcome ?? null,
    nextTouch: obj.nextTouch ?? null,
  }
}

/** Rows from a matrix (array of arrays) given a detected header row. */
function rowsFromMatrix(matrix) {
  let headerIdx = -1
  for (let i = 0; i < matrix.length; i++) {
    const cells = (matrix[i] || []).map((c) => norm(c))
    if (cells.includes('company') && cells.includes('greeting')) {
      headerIdx = i
      break
    }
  }
  if (headerIdx === -1) throw new Error(`Could not find header row (looking for Company + Greeting) in sheet "${SHEET_NAME}"`)
  const header = matrix[headerIdx].map(headerKey)
  const out = []
  for (let r = headerIdx + 1; r < matrix.length; r++) {
    const row = matrix[r] || []
    const obj = {}
    let any = false
    for (let c = 0; c < header.length; c++) {
      const key = header[c]
      if (!key) continue
      const val = row[c]
      if (val !== null && val !== undefined && String(val).trim() !== '') any = true
      obj[key] = val
    }
    if (!any) continue
    const rec = normalizeRawRow(obj)
    if (rec) out.push(rec)
  }
  return out
}

async function loadFromXlsxSheetJS(path) {
  let XLSX
  try {
    XLSX = await import('xlsx')
  } catch {
    return null // package not installed
  }
  const mod = XLSX.default || XLSX
  const wb = mod.readFile(path, { cellDates: true })
  const ws = wb.Sheets[SHEET_NAME]
  if (!ws) throw new Error(`Sheet "${SHEET_NAME}" not found in ${path}`)
  const matrix = mod.utils.sheet_to_json(ws, { header: 1, defval: null, blankrows: false, raw: false })
  return rowsFromMatrix(matrix)
}

async function loadFromXlsxExcelJS(path) {
  let ExcelJS
  try {
    ExcelJS = await import('exceljs')
  } catch {
    return null // package not installed
  }
  const mod = ExcelJS.default || ExcelJS
  const wb = new mod.Workbook()
  await wb.xlsx.readFile(path)
  const ws = wb.getWorksheet(SHEET_NAME)
  if (!ws) throw new Error(`Sheet "${SHEET_NAME}" not found in ${path}`)
  const matrix = []
  ws.eachRow({ includeEmpty: true }, (row) => {
    // row.values is 1-indexed (index 0 is undefined) - drop the leading slot
    const vals = Array.isArray(row.values) ? row.values.slice(1) : []
    matrix.push(vals.map((v) => (v && typeof v === 'object' && 'text' in v ? v.text : v)))
  })
  return rowsFromMatrix(matrix)
}

function loadFromJson(path) {
  const data = JSON.parse(readFileSync(path, 'utf8'))
  if (!Array.isArray(data)) throw new Error(`Expected a JSON array in ${path}`)
  return data.map(normalizeRawRow).filter(Boolean)
}

async function loadRecords(args) {
  // 1. XLSX (only if a spreadsheet package is installed and file present)
  const xlsxPath = args.file || process.env.RELAY_XLSX || DEFAULT_XLSX
  if (!args.json && existsSync(xlsxPath)) {
    for (const loader of [loadFromXlsxSheetJS, loadFromXlsxExcelJS]) {
      try {
        const rows = await loader(xlsxPath)
        if (rows && rows.length) return { records: rows, source: `xlsx (${loader.name.replace('loadFromXlsx', '')}) ${xlsxPath}` }
      } catch (e) {
        console.warn(`  ! xlsx read via ${loader.name} failed: ${e.message}`)
      }
    }
  }
  // 2. JSON fallback chain
  const jsonCandidates = [
    process.env.RELAY_WORKFIRST_JSON,
    args.file && args.file.endsWith('.json') ? args.file : null,
    SEED_JSON,
    SCRATCH_JSON,
  ].filter(Boolean)
  for (const p of jsonCandidates) {
    if (existsSync(p)) return { records: loadFromJson(p), source: `json ${p}` }
  }
  throw new Error(
    'No source found. Install "xlsx" or "exceljs" for the spreadsheet, or provide a JSON fallback ' +
      `(checked: ${jsonCandidates.join(', ')}).`,
  )
}

// ─── Canonical row builders ──────────────────────────────────────────────────
function buildCompanyInsert(rec) {
  return {
    // base columns the app already writes (keep NOT NULL columns satisfied)
    name: rec.company,
    counties: '',
    seai_reg: '',
    team_size: 1,
    installs_per_year: 0,
    status: 'prospect',
    logo_url: null,
    website: isUrl(rec.status) ? rec.status : null,
    notes: null,
    // Work-First list fields
    web_presence_tier: 'broken-front-door',
    site_status: rec.status || null,
    based_in: null,
    counties_served: null,
    size_signal: null,
    google_reviews: null,
    what_they_install: 'Solar PV',
    solar_confirmed: true,
    tooling: null,
    published_hours: null,
    how_leads_reach: rec.dne ? 'phone only (published email dead)' : 'phone or email',
    seai_contacts: rec.email || null,
  }
}

// On update we refresh only the list-derived fields; we never clobber
// operator-owned base fields (status, counties, notes, team_size).
function buildCompanyUpdate(rec) {
  return {
    website: isUrl(rec.status) ? rec.status : null,
    web_presence_tier: 'broken-front-door',
    site_status: rec.status || null,
    what_they_install: 'Solar PV',
    solar_confirmed: true,
    how_leads_reach: rec.dne ? 'phone only (published email dead)' : 'phone or email',
    seai_contacts: rec.email || null,
  }
}

function buildContactInsert(rec, companyId, phones) {
  return {
    company_id: companyId,
    name: rec.greeting || rec.company, // SINGLE name column (not first/last); NOT NULL in schema
    greeting_name: rec.greeting || null,
    phone: phones.phone,
    mobile: phones.mobile,
    number_type: phones.numberType,
    email: rec.dne ? null : rec.email || null,
    do_not_email: !!rec.dne,
    is_decision_maker: true,
    role: null,
    name_check: null,
    notes: null,
  }
}

function buildContactUpdate(rec, phones) {
  return {
    greeting_name: rec.greeting || null,
    mobile: phones.mobile,
    number_type: phones.numberType,
    do_not_email: !!rec.dne,
    email: rec.dne ? null : rec.email || null,
  }
}

function buildDealInsert(rec, companyId, contactId, seg, ownerEmail) {
  return {
    company_id: companyId,
    contact_id: contactId,
    product: PRODUCT,
    segment: seg,
    fit_score: deriveFitScore(rec, seg),
    verdict: deriveVerdict(seg),
    action: rec.action || null,
    channel: rec.channel || null,
    angle: rec.angle || null,
    hook: firstSentence(rec.angle),
    signals: rec.lists || null,
    stage: STAGE,
    work_first: true,
    source: SOURCE,
    contacted_date: toDateOnly(rec.contacted),
    outcome: rec.outcome ? String(rec.outcome) : null,
    next_touch: toDateOnly(rec.nextTouch),
    owner: ownerEmail || null,
    value: 0,
    mrr: 0,
    notes: null,
  }
}

// On update we refresh the static intel but preserve operator progress
// (stage, outcome, contacted_date, next_touch, value, mrr).
function buildDealUpdate(rec, contactId, seg, ownerEmail) {
  return {
    contact_id: contactId,
    segment: seg,
    fit_score: deriveFitScore(rec, seg),
    verdict: deriveVerdict(seg),
    action: rec.action || null,
    channel: rec.channel || null,
    angle: rec.angle || null,
    hook: firstSentence(rec.angle),
    signals: rec.lists || null,
    work_first: true,
    source: SOURCE,
    product: PRODUCT,
    owner: ownerEmail || null,
  }
}

function buildNote(rec, seg, ids, userId) {
  const text = composeNote(rec, seg)
  return {
    // The canonical schema keeps BOTH: `content` is what the CRM note UI reads,
    // `body` is the model field. Populate both with the same text.
    content: text,
    body: text,
    author: NOTE_AUTHOR,
    company_id: ids.companyId,
    deal_id: ids.dealId,
    contact_id: ids.contactId,
    user_id: userId,
  }
}

// ─── Supabase lookups ────────────────────────────────────────────────────────
async function findCompany(sb, name) {
  const { data, error } = await sb.from('companies').select('id,name').ilike('name', escIlike(name))
  if (error) throw new Error(`companies lookup: ${error.message}`)
  return (data || []).find((c) => norm(c.name) === norm(name)) || null
}
async function findContact(sb, companyId, primaryDigits, name) {
  const { data, error } = await sb.from('contacts').select('id,phone,name').eq('company_id', companyId)
  if (error) throw new Error(`contacts lookup: ${error.message}`)
  const rows = data || []
  let m = null
  if (primaryDigits) m = rows.find((r) => normDigits(r.phone) === primaryDigits)
  if (!m && name) m = rows.find((r) => norm(r.name) === norm(name))
  return m || null
}
async function findDeal(sb, companyId) {
  const { data, error } = await sb
    .from('deals')
    .select('id,product,source,work_first')
    .eq('company_id', companyId)
    .eq('product', PRODUCT)
  if (error) throw new Error(`deals lookup: ${error.message}`)
  const rows = data || []
  return rows.find((d) => d.source === SOURCE || d.work_first === true) || rows[0] || null
}
async function findImportNote(sb, dealId) {
  const { data, error } = await sb.from('notes').select('id').eq('deal_id', dealId).eq('author', NOTE_AUTHOR)
  if (error) throw new Error(`notes lookup: ${error.message}`)
  return (data || [])[0] || null
}
async function resolveOwnerId(sb, email) {
  if (!sb || !email) return null
  try {
    const { data } = await sb.from('profiles').select('id,email').ilike('email', escIlike(email)).limit(1)
    return data && data[0] ? data[0].id : null
  } catch {
    return null
  }
}

// ─── Main ────────────────────────────────────────────────────────────────────
async function main() {
  const args = parseArgs(process.argv.slice(2))
  if (args.help) {
    console.log(readFileSync(fileURLToPath(import.meta.url), 'utf8').split('*/')[0].replace(/^\/\*+/, ''))
    return
  }

  loadEnvFile(join(REPO_ROOT, '.env.local'))
  loadEnvFile(join(REPO_ROOT, '.env'))

  const ownerEmail = args.owner || process.env.RELAY_OWNER_EMAIL || 'cal@renewably.ie'
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  console.log('Relay Work-First importer (SOLAR only)')
  console.log('  mode:   ', args.commit ? 'COMMIT (writing)' : 'DRY RUN (no writes)')
  console.log('  product:', PRODUCT, '| source:', SOURCE, '| stage:', STAGE, '| owner:', ownerEmail)

  // Load source records
  const { records, source } = await loadRecords(args)
  console.log('  source: ', source)
  let list = records
  if (args.limit > 0) list = list.slice(0, args.limit)
  console.log(`  firms:   ${list.length}${args.limit ? ` (limited from ${records.length})` : ''}`)
  console.log('')

  // Supabase client - required to write; optional for dry-run classification
  let sb = null
  if (url && serviceKey) {
    const { createClient } = await import('@supabase/supabase-js')
    sb = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } })
  } else if (args.commit) {
    console.error('ERROR: --commit needs NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (checked .env.local/.env).')
    process.exit(1)
  } else {
    console.log('  (no Supabase credentials found - dry run will mark every row as a fresh INSERT)\n')
  }

  const ownerId = await resolveOwnerId(sb, ownerEmail)
  if (sb && args.commit && !ownerId) {
    console.log(`  note: no active profile for ${ownerEmail}; notes will be stored with a null author id.\n`)
  }

  const counts = {
    company: { insert: 0, update: 0 },
    contact: { insert: 0, update: 0 },
    deal: { insert: 0, update: 0 },
    note: { insert: 0, update: 0 },
    dne: 0,
    failed: 0,
  }
  const failures = []

  let idx = 0
  for (const rec of list) {
    idx++
    const seg = deriveSegment(rec.lists)
    const phones = splitPhones(rec.phone)
    if (rec.dne) counts.dne++

    // Plan actions (read-only classification when a client is available)
    let companyRow = null
    let contactRow = null
    let dealRow = null
    let noteRow = null
    let actions = { company: 'INSERT', contact: 'INSERT', deal: 'INSERT', note: 'INSERT' }

    try {
      if (sb) {
        companyRow = await findCompany(sb, rec.company)
        actions.company = companyRow ? 'UPDATE' : 'INSERT'
      }

      // COMMIT: company
      let companyId = companyRow?.id || null
      if (args.commit) {
        if (companyRow) {
          const { error } = await sb.from('companies').update(cleanRow(buildCompanyUpdate(rec))).eq('id', companyRow.id)
          if (error) throw new Error(`company update: ${error.message}`)
        } else {
          const { data, error } = await sb
            .from('companies')
            .insert(cleanRow(buildCompanyInsert(rec)))
            .select('id')
            .single()
          if (error) throw new Error(`company insert: ${error.message}`)
          companyId = data.id
        }
      }
      counts.company[actions.company === 'UPDATE' ? 'update' : 'insert']++

      // contact
      if (sb && companyId) {
        contactRow = await findContact(sb, companyId, phones.primaryDigits, rec.greeting)
        actions.contact = contactRow ? 'UPDATE' : 'INSERT'
      }
      let contactId = contactRow?.id || null
      if (args.commit && companyId) {
        if (contactRow) {
          const { error } = await sb.from('contacts').update(cleanRow(buildContactUpdate(rec, phones))).eq('id', contactRow.id)
          if (error) throw new Error(`contact update: ${error.message}`)
        } else {
          const { data, error } = await sb
            .from('contacts')
            .insert(cleanRow(buildContactInsert(rec, companyId, phones)))
            .select('id')
            .single()
          if (error) throw new Error(`contact insert: ${error.message}`)
          contactId = data.id
        }
      }
      counts.contact[actions.contact === 'UPDATE' ? 'update' : 'insert']++

      // deal
      if (sb && companyId) {
        dealRow = await findDeal(sb, companyId)
        actions.deal = dealRow ? 'UPDATE' : 'INSERT'
      }
      let dealId = dealRow?.id || null
      if (args.commit && companyId) {
        if (dealRow) {
          const { error } = await sb
            .from('deals')
            .update(cleanRow(buildDealUpdate(rec, contactId, seg, ownerEmail)))
            .eq('id', dealRow.id)
          if (error) throw new Error(`deal update: ${error.message}`)
        } else {
          const { data, error } = await sb
            .from('deals')
            .insert(cleanRow(buildDealInsert(rec, companyId, contactId, seg, ownerEmail)))
            .select('id')
            .single()
          if (error) throw new Error(`deal insert: ${error.message}`)
          dealId = data.id
        }
      }
      counts.deal[actions.deal === 'UPDATE' ? 'update' : 'insert']++

      // note (provenance / call context)
      if (sb && dealId) {
        const existingNote = await findImportNote(sb, dealId)
        actions.note = existingNote ? 'UPDATE' : 'INSERT'
        if (args.commit) {
          const payload = cleanRow(buildNote(rec, seg, { companyId, dealId, contactId }, ownerId))
          if (existingNote) {
            const { error } = await sb.from('notes').update(payload).eq('id', existingNote.id)
            if (error) throw new Error(`note update: ${error.message}`)
          } else {
            const { error } = await sb.from('notes').insert(payload)
            if (error) throw new Error(`note insert: ${error.message}`)
          }
        }
      }
      counts.note[actions.note === 'UPDATE' ? 'update' : 'insert']++

      if (!args.quiet) {
        const tag = rec.dne ? ' [DNE]' : ''
        console.log(
          `[${String(idx).padStart(2, '0')}] ${rec.company}${tag}\n` +
            `     company:${actions.company} contact:${actions.contact} deal:${actions.deal} note:${actions.note}` +
            `  | seg=${seg} fit=${deriveFitScore(rec, seg)} phone=${phones.phone || '-'}${phones.mobile ? ' mob=' + phones.mobile : ''}`,
        )
      }

      // Show the full mapped payload for the first firm (cleaned, exactly as written).
      if (idx === 1 && !args.quiet) {
        console.log('\n     --- sample mapped payload (firm 1, cleaned) ---')
        console.log('     company:', JSON.stringify(cleanRow(buildCompanyInsert(rec))))
        console.log('     contact:', JSON.stringify(cleanRow(buildContactInsert(rec, '<company_id>', phones))))
        console.log('     deal:   ', JSON.stringify(cleanRow(buildDealInsert(rec, '<company_id>', '<contact_id>', seg, ownerEmail))))
        console.log('     note:   ', JSON.stringify(cleanRow(buildNote(rec, seg, { companyId: '<c>', dealId: '<d>', contactId: '<ct>' }, ownerId))))
        console.log('     ----------------------------------------------\n')
      }
    } catch (e) {
      counts.failed++
      failures.push({ firm: rec.company, error: e.message })
      console.error(`[${String(idx).padStart(2, '0')}] ${rec.company}  FAILED: ${e.message}`)
    }
  }

  // Summary
  console.log('\n============ SUMMARY ============')
  console.log(`mode:       ${args.commit ? 'COMMIT' : 'DRY RUN'}`)
  console.log(`firms:      ${list.length}   (do-not-email: ${counts.dne})`)
  console.log(`companies:  +${counts.company.insert} insert  ~${counts.company.update} update`)
  console.log(`contacts:   +${counts.contact.insert} insert  ~${counts.contact.update} update`)
  console.log(`deals:      +${counts.deal.insert} insert  ~${counts.deal.update} update   (all product=${PRODUCT}, work_first=true, source=${SOURCE}, stage=${STAGE})`)
  console.log(`notes:      +${counts.note.insert} insert  ~${counts.note.update} update`)
  console.log(`failed:     ${counts.failed}`)
  if (failures.length) {
    console.log('\nfailures:')
    for (const f of failures) console.log(`  - ${f.firm}: ${f.error}`)
  }
  if (!args.commit) {
    console.log('\nDRY RUN only - nothing was written. Re-run with --commit to apply.')
  } else {
    console.log('\nDone.')
  }
  process.exit(counts.failed > 0 ? 1 : 0)
}

main().catch((e) => {
  console.error('FATAL:', e.message)
  process.exit(1)
})
