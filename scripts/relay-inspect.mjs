#!/usr/bin/env node
// READ ONLY. Samples what's already in the reused project so Cal can decide.
import { existsSync, readFileSync } from 'node:fs'
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

async function sample(table, cols, limit = 4) {
  const { data, error } = await svc.from(table).select(cols).limit(limit)
  if (error) { console.log('\n' + table + ': ERROR ' + (error.message || error.code)); return }
  console.log('\n' + table + ' (sample ' + data.length + '):')
  for (const r of data) console.log('  ' + JSON.stringify(r))
}
async function count(table, filterFn) {
  let q = svc.from(table).select('*', { count: 'exact', head: true })
  if (filterFn) q = filterFn(q)
  const { count, error } = await q
  return error ? 'err' : count
}

console.log('project:', (process.env.NEXT_PUBLIC_SUPABASE_URL || '').replace('https://', '').split('.')[0])

// who can log in
await sample('profiles', 'email,name,role,is_active', 10)

// what the 1334 are
await sample('companies', 'name,county,segment,source,client_since', 6)
await sample('contacts', 'name,email,do_not_email', 4)

// deals: try the known enrichment columns, fall back to * if they don't exist
{ const { error } = await svc.from('deals').select('work_first,segment,source,verdict,stage,outcome').limit(1)
  await sample('deals', error ? '*' : 'work_first,segment,source,verdict,stage,outcome', 6) }

// email logs
await sample('email_logs', '*', 6)

// work_first distribution (the 52 vs the rest) - try on deals then companies
console.log('\ncounts:')
console.log('  deals total:', await count('deals'))
console.log('  deals work_first=true:', await count('deals', q => q.eq('work_first', true)))
console.log('  companies total:', await count('companies'))
console.log('  companies work_first=true:', await count('companies', q => q.eq('work_first', true)))
console.log('  contacts do_not_email=true:', await count('contacts', q => q.eq('do_not_email', true)))
console.log('')
