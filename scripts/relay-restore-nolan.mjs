#!/usr/bin/env node
// Restore the accidentally-deleted T Nolan deal by mirroring a sibling Work First
// deal's shape and filling in T Nolan's own call-sheet from the v4 list.
// Dry-run by default; pass --commit to insert. Guarded: refuses if a deal exists.
import { existsSync, readFileSync } from 'node:fs'
import { createClient } from '@supabase/supabase-js'
function loadEnvFile(p){ if(!existsSync(p))return; for(const raw of readFileSync(p,'utf8').split(/\r?\n/)){const l=raw.trim(); if(!l||l.startsWith('#'))continue; const e=l.indexOf('='); if(e===-1)continue; const k=l.slice(0,e).trim(); let v=l.slice(e+1).trim(); if((v.startsWith('"')&&v.endsWith('"'))||(v.startsWith("'")&&v.endsWith("'")))v=v.slice(1,-1); if(k&&process.env[k]===undefined)process.env[k]=v } }
loadEnvFile('.env.local'); loadEnvFile('.env')
const COMMIT = process.argv.includes('--commit')
const deSlop = s => typeof s === 'string' ? s.replace(/ /g,' ').replace(/\s*[—–]\s*/g,' - ').replace(/…/g,'...').replace(/[ \t]{2,}/g,' ').trim() : s
const svc = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } })

const COMPANY_ID = '0a216ef8-29d0-4cf6-8de3-249f6a60d91c'
const CONTACT_ID = 'cf27a313-6a34-414a-be1a-4bd55c917fe9'

// guard
const { data: existing } = await svc.from('deals').select('id').eq('company_id', COMPANY_ID)
if (existing && existing.length) { console.log('ABORT: T Nolan already has ' + existing.length + ' deal(s). Nothing to restore.'); process.exit(0) }

// mirror a sibling Broken Front Door deal for the money/stage shape
const { data: sib } = await svc.from('deals').select('product,mrr,setup_fee,value,stage').eq('list_cohort','Broken Front Door').neq('company_id',COMPANY_ID).limit(1).maybeSingle()
const list = JSON.parse(readFileSync('scripts/data/relay-workfirst-v4.json','utf8'))
const rec = list.find(r => /t nolan/i.test(r.company))

const row = {
  company_id: COMPANY_ID,
  contact_id: CONTACT_ID,
  product: sib?.product ?? 'relay',
  mrr: sib?.mrr ?? 0,
  setup_fee: sib?.setup_fee ?? 0,
  value: sib?.value ?? 0,
  stage: 'new_lead',
  list_cohort: 'Broken Front Door',
  angle: deSlop(rec?.angle || ''),
  channel: deSlop(rec?.channel || ''),
  next_action: deSlop(rec?.action || ''),
}
console.log('sibling shape:', JSON.stringify(sib))
console.log('would insert:', JSON.stringify(row, null, 2))

if (!COMMIT) { console.log('\nDRY RUN. Re-run with --commit to restore.'); process.exit(0) }
const { data: ins, error } = await svc.from('deals').insert(row).select('id').single()
if (error) { console.error('INSERT FAILED:', error.message); process.exit(1) }
const { count } = await svc.from('deals').select('*', { count:'exact', head:true })
console.log('\nRESTORED. new deal id ' + ins.id + ' | deals now ' + count)
