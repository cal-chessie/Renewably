#!/usr/bin/env node
// ============================================================================
// Relay preflight - READ ONLY. Writes nothing.
// ----------------------------------------------------------------------------
// Cal is reusing the EXISTING renewably Supabase project (not a fresh one).
// Before pasting the canonical schema (scripts/setup-relay-db.sql) into that
// project's SQL editor, this probe reports, for every table the schema touches:
//   - does it already exist in the project?
//   - can the ANON (public) role currently read it?
// The only real risk of applying the schema to a live project is enabling RLS
// + REVOKE anon on a table the live site currently reads via the anon key.
// This probe surfaces exactly that, so we apply with eyes open. No mutations.
//
// Usage:  node scripts/relay-preflight.mjs      (reads .env.local / .env)
// ============================================================================
import { existsSync, readFileSync } from 'node:fs'
import { createClient } from '@supabase/supabase-js'

function loadEnvFile(path) {
  if (!existsSync(path)) return
  for (const raw of readFileSync(path, 'utf8').split(/\r?\n/)) {
    const line = raw.trim()
    if (!line || line.startsWith('#')) continue
    const eq = line.indexOf('=')
    if (eq === -1) continue
    const key = line.slice(0, eq).trim()
    let val = line.slice(eq + 1).trim()
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) val = val.slice(1, -1)
    if (key && process.env[key] === undefined) process.env[key] = val
  }
}
loadEnvFile('.env.local')
loadEnvFile('.env')

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !serviceKey) {
  console.error('\n  Missing env. Need NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local')
  console.error('  (NEXT_PUBLIC_SUPABASE_ANON_KEY is optional here but lets me check public read access.)\n')
  process.exit(1)
}

const ref = (url.match(/https?:\/\/([a-z0-9]+)\.supabase\.co/) || [])[1] || url
const svc = createClient(url, serviceKey, { auth: { persistSession: false } })
const anon = anonKey ? createClient(url, anonKey, { auth: { persistSession: false } }) : null

// Every table scripts/setup-relay-db.sql creates or alters.
const TABLES = [
  'companies', 'contacts', 'deals', 'deal_activities', 'notes',
  'proposals', 'proposal_line_items', 'invoices', 'invoice_line_items',
  'payments', 'email_logs', 'profiles', 'onboarding_templates', 'onboarding_runs',
]

const ABSENT = new Set(['42P01', 'PGRST205', 'PGRST204'])
function isAbsent(err) {
  if (!err) return false
  if (err.code && ABSENT.has(err.code)) return true
  return /does not exist|schema cache|could not find the table/i.test(err.message || '')
}
function isDenied(err) {
  if (!err) return false
  if (err.code === '42501' || err.code === 'PGRST301' || err.code === '401') return true
  return /permission denied|jwt|not authorized|row-level security/i.test(err.message || '')
}

async function probe(client, table) {
  const { count, error } = await client.from(table).select('*', { count: 'exact', head: true })
  return { count: count ?? null, error }
}

const results = []
for (const t of TABLES) {
  const s = await probe(svc, t)
  const exists = !isAbsent(s.error)
  let anonState = 'n/a'
  if (exists && anon) {
    const a = await probe(anon, t)
    if (isDenied(a.error)) anonState = 'locked'
    else if (!a.error) anonState = 'READABLE'
    else if (isAbsent(a.error)) anonState = 'absent'
    else anonState = 'err:' + (a.error.code || '?')
  } else if (!exists) {
    anonState = '-'
  }
  results.push({ table: t, exists, rows: exists ? s.count : null, anon: anonState, note: exists && s.error ? (s.error.code || s.error.message) : '' })
}

const existing = results.filter(r => r.exists)
const anonReadable = existing.filter(r => r.anon === 'READABLE')

console.log('\n  Relay preflight  (READ ONLY - nothing was written)')
console.log('  project: ' + ref + '\n')
console.log('  table                     exists   rows    anon-read')
console.log('  ' + '-'.repeat(56))
for (const r of results) {
  const exists = r.exists ? 'yes' : 'no '
  const rows = r.exists ? String(r.rows ?? '?').padStart(5) : '    -'
  console.log('  ' + r.table.padEnd(24) + '  ' + exists.padEnd(6) + '  ' + rows + '   ' + r.anon)
}
console.log('  ' + '-'.repeat(56))

console.log('\n  Read-back:')
if (existing.length === 0) {
  console.log('  * None of the Relay tables exist yet. The schema will CREATE them fresh.')
  console.log('  * ZERO interaction with any existing live-site table. Safe to apply.')
} else {
  console.log('  * ' + existing.length + ' of ' + TABLES.length + ' tables already exist in this project:')
  console.log('      ' + existing.map(r => r.table + '(' + (r.rows ?? '?') + ')').join(', '))
  if (anonReadable.length) {
    console.log('\n  !! REVIEW: these existing tables are readable by the public (anon) role RIGHT NOW:')
    console.log('       ' + anonReadable.map(r => r.table).join(', '))
    console.log('     Applying the schema enables RLS + REVOKE anon on them. If the live')
    console.log('     renewably.ie site reads any of these with the anon key, that read will')
    console.log('     start returning empty. Confirm the live site uses the service client for')
    console.log('     these (it does for the contact form) before applying.')
  } else {
    console.log('  * None of the existing tables are anon-readable, so enabling RLS changes nothing public-facing.')
    console.log('  * The schema is idempotent (CREATE IF NOT EXISTS / ADD COLUMN IF NOT EXISTS); safe to apply.')
  }
}
console.log('')
