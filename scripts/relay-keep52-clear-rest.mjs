#!/usr/bin/env node
// Keep only the working set (companies that have a deal = your 52); clear the rest.
// DRY-RUN by default. Pass --commit to actually delete. Full backup exists at
// scratchpad/relay-backup-grkqdzz and the master list is in the RELAY v4 xlsx,
// so this is reversible (re-import for the Relay Segments phase).
import { existsSync, readFileSync } from 'node:fs'
import { createClient } from '@supabase/supabase-js'
function loadEnvFile(p){ if(!existsSync(p))return; for(const raw of readFileSync(p,'utf8').split(/\r?\n/)){const l=raw.trim(); if(!l||l.startsWith('#'))continue; const e=l.indexOf('='); if(e===-1)continue; const k=l.slice(0,e).trim(); let v=l.slice(e+1).trim(); if((v.startsWith('"')&&v.endsWith('"'))||(v.startsWith("'")&&v.endsWith("'")))v=v.slice(1,-1); if(k&&process.env[k]===undefined)process.env[k]=v } }
loadEnvFile('.env.local'); loadEnvFile('.env')
const COMMIT = process.argv.includes('--commit')
const svc = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } })

// keep = every company that has at least one deal (your loaded 52)
const { data: deals, error: dErr } = await svc.from('deals').select('company_id')
if (dErr) { console.error('deals read failed:', dErr.message); process.exit(1) }
const keep = [...new Set(deals.map(d => d.company_id).filter(Boolean))]

// SAFETY: never mass-delete if the keep set looks wrong
if (keep.length < 40 || keep.length > 100) {
  console.error(`ABORT: keep-set is ${keep.length} companies (expected ~52). Refusing to delete.`)
  process.exit(1)
}

const { count: coTotal } = await svc.from('companies').select('*', { count: 'exact', head: true })
const { count: ctTotal } = await svc.from('contacts').select('*', { count: 'exact', head: true })
const inList = '(' + keep.join(',') + ')'
const { count: ctKeep } = await svc.from('contacts').select('*', { count: 'exact', head: true }).in('company_id', keep)

console.log('KEEP (companies with a deal):', keep.length)
console.log('companies: total', coTotal, '-> would delete', coTotal - keep.length, ', keep', keep.length)
console.log('contacts:  total', ctTotal, '-> would delete', ctTotal - (ctKeep || 0), ', keep', ctKeep)
console.log('deals: untouched (' + deals.length + ')')

if (!COMMIT) {
  console.log('\nDRY RUN. Nothing deleted. Re-run with --commit to execute.')
  process.exit(0)
}

console.log('\n--commit: deleting non-working-set rows in FK-safe order...')
// 1) contacts of non-keep companies (delete children before parents)
{ const { error } = await svc.from('contacts').delete().not('company_id', 'in', inList)
  if (error) { console.error('contacts delete failed:', error.message); process.exit(1) } }
// 2) onboarding of non-keep companies (guarded: table may hold rows)
{ const { error } = await svc.from('onboarding').delete().not('company_id', 'in', inList)
  if (error && !/does not exist/i.test(error.message)) console.warn('onboarding delete warn:', error.message) }
// 3) the companies themselves
{ const { error } = await svc.from('companies').delete().not('id', 'in', inList)
  if (error) { console.error('companies delete failed:', error.message); process.exit(1) } }

const { count: coAfter } = await svc.from('companies').select('*', { count: 'exact', head: true })
const { count: ctAfter } = await svc.from('contacts').select('*', { count: 'exact', head: true })
const { count: dAfter } = await svc.from('deals').select('*', { count: 'exact', head: true })
console.log('\nDONE. companies now', coAfter, '| contacts now', ctAfter, '| deals now', dAfter)
