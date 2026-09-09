#!/usr/bin/env node
// READ ONLY full export of the reused project to local JSON. Writes nothing to the DB.
// Safety net before any schema/data change on what turns out to be a live project.
import { existsSync, readFileSync, mkdirSync, writeFileSync } from 'node:fs'
import { createClient } from '@supabase/supabase-js'
function loadEnvFile(path) {
  if (!existsSync(path)) return
  for (const raw of readFileSync(path, 'utf8').split(/\r?\n/)) {
    const line = raw.trim()
    if (!line || line.startsWith('#')) continue
    const eq = line.indexOf('='); if (eq === -1) continue
    const k = line.slice(0, eq).trim(); let v = line.slice(eq + 1).trim()
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1)
    if (k && process.env[k] === undefined) process.env[k] = v
  }
}
loadEnvFile('.env.local'); loadEnvFile('.env')
const svc = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } })

const OUT = process.argv[2] || './relay-backup'
mkdirSync(OUT, { recursive: true })

const TABLES = [
  'companies', 'contacts', 'deals', 'deal_activities', 'notes', 'proposals',
  'proposal_line_items', 'invoices', 'invoice_line_items', 'payments', 'email_logs',
  'profiles', 'onboarding_templates', 'onboarding_runs',
  'onboarding', 'onboarding_submissions', // old-schema extras seen in the live routes
]

async function dumpAll(table) {
  const rows = []
  const page = 1000
  for (let from = 0; ; from += page) {
    const { data, error } = await svc.from(table).select('*').range(from, from + page - 1)
    if (error) return { table, error: error.message || error.code }
    rows.push(...data)
    if (data.length < page) break
  }
  writeFileSync(OUT + '/' + table + '.json', JSON.stringify(rows, null, 2))
  return { table, rows: rows.length }
}

const summary = []
for (const t of TABLES) summary.push(await dumpAll(t))
writeFileSync(OUT + '/_manifest.json', JSON.stringify({ project: (process.env.NEXT_PUBLIC_SUPABASE_URL||'').split('//')[1], at: new Date().toISOString(), tables: summary }, null, 2))
console.log('backup dir:', OUT)
for (const s of summary) console.log('  ' + s.table.padEnd(22) + (s.error ? 'skip (' + s.error + ')' : s.rows + ' rows'))
