#!/usr/bin/env node
// READ ONLY. Compares the 52 Work First leads (source of truth = the v4 json)
// against what is in the DB now, to find any lead deleted by accident.
import { existsSync, readFileSync } from 'node:fs'
import { createClient } from '@supabase/supabase-js'
function loadEnvFile(p){ if(!existsSync(p))return; for(const raw of readFileSync(p,'utf8').split(/\r?\n/)){const l=raw.trim(); if(!l||l.startsWith('#'))continue; const e=l.indexOf('='); if(e===-1)continue; const k=l.slice(0,e).trim(); let v=l.slice(e+1).trim(); if((v.startsWith('"')&&v.endsWith('"'))||(v.startsWith("'")&&v.endsWith("'")))v=v.slice(1,-1); if(k&&process.env[k]===undefined)process.env[k]=v } }
loadEnvFile('.env.local'); loadEnvFile('.env')
const svc = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } })

const list = JSON.parse(readFileSync('scripts/data/relay-workfirst-v4.json', 'utf8'))
const norm = s => (s || '').toLowerCase().replace(/[—–]/g, '-').replace(/\s+/g, ' ').trim()

const { data: companies } = await svc.from('companies').select('id,name')
const { data: deals } = await svc.from('deals').select('company_id')
const { count: contactCount } = await svc.from('contacts').select('*', { count: 'exact', head: true })
const dbByName = new Map(companies.map(c => [norm(c.name), c]))
const dealCompanyIds = new Set(deals.map(d => d.company_id).filter(Boolean))

console.log('NOW in DB: companies', companies.length, '| deals', deals.length, '| contacts', contactCount)
console.log('Source list (Work First v4):', list.length, 'firms\n')

const missingCompany = [], missingDeal = []
for (const r of list) {
  const co = dbByName.get(norm(r.company))
  if (!co) missingCompany.push(r)
  else if (!dealCompanyIds.has(co.id)) missingDeal.push({ ...r, _id: co.id })
}

if (!missingCompany.length && !missingDeal.length) {
  console.log('All 52 present with a deal. Nothing deleted.')
} else {
  if (missingCompany.length) {
    console.log('DELETED ENTIRELY (company gone) - ' + missingCompany.length + ':')
    for (const r of missingCompany) console.log('  • ' + r.company + '  | ' + (r.greeting||'') + ' ' + (r.phone||'') + ' | ' + (r.channel||'') + ' | angle: ' + (r.angle||'').slice(0,60))
  }
  if (missingDeal.length) {
    console.log('DEAL DELETED (company/contact remain, dropped off the queue) - ' + missingDeal.length + ':')
    for (const r of missingDeal) console.log('  • ' + r.company + '  | ' + (r.greeting||'') + ' ' + (r.phone||''))
  }
}
console.log('')
