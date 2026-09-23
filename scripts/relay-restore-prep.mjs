#!/usr/bin/env node
// READ ONLY. Finds the duplicate deal, and gathers what is needed to restore
// the accidentally-deleted T Nolan deal.
import { existsSync, readFileSync } from 'node:fs'
import { createClient } from '@supabase/supabase-js'
function loadEnvFile(p){ if(!existsSync(p))return; for(const raw of readFileSync(p,'utf8').split(/\r?\n/)){const l=raw.trim(); if(!l||l.startsWith('#'))continue; const e=l.indexOf('='); if(e===-1)continue; const k=l.slice(0,e).trim(); let v=l.slice(e+1).trim(); if((v.startsWith('"')&&v.endsWith('"'))||(v.startsWith("'")&&v.endsWith("'")))v=v.slice(1,-1); if(k&&process.env[k]===undefined)process.env[k]=v } }
loadEnvFile('.env.local'); loadEnvFile('.env')
const svc = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } })

// deals per company
const { data: deals } = await svc.from('deals').select('id,company_id,stage,list_cohort,created_at,notes')
const byCo = {}
for (const d of deals) { (byCo[d.company_id] ||= []).push(d) }
const dups = Object.entries(byCo).filter(([, ds]) => ds.length > 1)
console.log('companies with >1 deal:', dups.length)
for (const [cid, ds] of dups) {
  const { data: co } = await svc.from('companies').select('name').eq('id', cid).maybeSingle()
  console.log('  ' + (co?.name || cid) + ' has ' + ds.length + ' deals:')
  for (const d of ds) console.log('     - ' + d.id + ' | stage=' + d.stage + ' | cohort=' + (d.list_cohort||'(none)') + ' | ' + (d.created_at||'').slice(0,10) + ' | ' + (d.notes||'').slice(0,40).replace(/\n/g,' '))
}

// T Nolan: company + contact + confirm no deal
const norm = s => (s||'').toLowerCase().replace(/\s+/g,' ').trim()
const { data: companies } = await svc.from('companies').select('id,name,priority,product_fit,energy_type,counties')
const nolan = companies.find(c => norm(c.name).includes('t nolan'))
console.log('\nT Nolan company:', nolan ? JSON.stringify(nolan) : 'NOT FOUND')
if (nolan) {
  const { data: contacts } = await svc.from('contacts').select('id,name,greeting_name,phone,email,do_not_email').eq('company_id', nolan.id)
  console.log('T Nolan contacts:', JSON.stringify(contacts))
  console.log('T Nolan current deals:', (byCo[nolan.id]||[]).length)
}
// json record
const list = JSON.parse(readFileSync('scripts/data/relay-workfirst-v4.json','utf8'))
const rec = list.find(r => norm(r.company).includes('t nolan'))
console.log('\nT Nolan v4 record:', JSON.stringify(rec))
