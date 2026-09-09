#!/usr/bin/env node
// READ ONLY. Profiles the researched company data so we can isolate the work-first solar 52.
import { existsSync, readFileSync } from 'node:fs'
import { createClient } from '@supabase/supabase-js'
function loadEnvFile(p){ if(!existsSync(p))return; for(const raw of readFileSync(p,'utf8').split(/\r?\n/)){const l=raw.trim(); if(!l||l.startsWith('#'))continue; const e=l.indexOf('='); if(e===-1)continue; const k=l.slice(0,e).trim(); let v=l.slice(e+1).trim(); if((v.startsWith('"')&&v.endsWith('"'))||(v.startsWith("'")&&v.endsWith("'")))v=v.slice(1,-1); if(k&&process.env[k]===undefined)process.env[k]=v } }
loadEnvFile('.env.local'); loadEnvFile('.env')
const svc = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } })

// pull the small research columns for all companies
const cols = 'id,name,segment,scope,energy_type,entity_type,product_fit,priority,lead_source,status,installs_per_year,counties'
const rows = []
for (let from = 0; ; from += 1000) {
  const { data, error } = await svc.from('companies').select(cols).range(from, from + 999)
  if (error) { console.log('companies error:', error.message); process.exit(1) }
  rows.push(...data); if (data.length < 1000) break
}
console.log('companies total:', rows.length)
function dist(field) {
  const m = {}
  for (const r of rows) { const k = r[field] === null || r[field] === undefined || r[field] === '' ? '(blank)' : String(r[field]); m[k] = (m[k]||0)+1 }
  const pairs = Object.entries(m).sort((a,b)=>b[1]-a[1])
  console.log('\nby ' + field + ':')
  for (const [k,v] of pairs.slice(0,15)) console.log('  ' + String(v).padStart(5) + '  ' + k)
  if (pairs.length > 15) console.log('  ... +' + (pairs.length-15) + ' more values')
}
for (const f of ['energy_type','segment','scope','entity_type','product_fit','status','lead_source']) dist(f)

// priority ordering
const withPriority = rows.filter(r => r.priority !== null && r.priority !== undefined && r.priority !== '')
console.log('\npriority: ' + withPriority.length + ' of ' + rows.length + ' have a priority value')
const sorted = [...withPriority].sort((a,b)=> (Number(a.priority)||1e9) - (Number(b.priority)||1e9))
console.log('top 12 by priority (name | segment | energy_type | product_fit | priority):')
for (const r of sorted.slice(0,12)) console.log('  ' + [r.name, r.segment, r.energy_type, r.product_fit, r.priority].map(x=>x??'-').join(' | '))

// contacts reachability
const { count: cWithEmail } = await svc.from('contacts').select('*',{count:'exact',head:true}).not('email','is',null)
const { count: cWithPhone } = await svc.from('contacts').select('*',{count:'exact',head:true}).not('phone','is',null)
console.log('\ncontacts with email:', cWithEmail, ' with phone:', cWithPhone)
console.log('')
