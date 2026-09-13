#!/usr/bin/env node
// READ ONLY. Confirms the 52 loaded correctly with their outreach layer.
import { existsSync, readFileSync } from 'node:fs'
import { createClient } from '@supabase/supabase-js'
function loadEnvFile(p){ if(!existsSync(p))return; for(const raw of readFileSync(p,'utf8').split(/\r?\n/)){const l=raw.trim(); if(!l||l.startsWith('#'))continue; const e=l.indexOf('='); if(e===-1)continue; const k=l.slice(0,e).trim(); let v=l.slice(e+1).trim(); if((v.startsWith('"')&&v.endsWith('"'))||(v.startsWith("'")&&v.endsWith("'")))v=v.slice(1,-1); if(k&&process.env[k]===undefined)process.env[k]=v } }
loadEnvFile('.env.local'); loadEnvFile('.env')
const svc = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } })

const { data: deals } = await svc.from('deals').select('id,stage,product,list_cohort,angle,channel,next_action,company_id,contact_id,notes')
console.log('deals total:', deals.length)
const withCohort = deals.filter(d => d.list_cohort)
console.log('deals with a list_cohort (the loaded 52):', withCohort.length)
const cohorts = {}
for (const d of deals) { const k = d.list_cohort || '(none)'; cohorts[k] = (cohorts[k]||0)+1 }
console.log('by list_cohort:'); for (const [k,v] of Object.entries(cohorts)) console.log('  ' + v + '  ' + k)
const tests = deals.filter(d => /test/i.test(d.notes||'') || !d.list_cohort)
console.log('\npossible test / non-cohort deals:', tests.length)
for (const d of tests.slice(0,5)) console.log('  ', d.stage, '|', (d.notes||'').slice(0,60).replace(/\n/g,' '))

// sample 4 real cohort deals with company + contact
console.log('\nsample loaded leads:')
for (const d of withCohort.slice(0,4)) {
  const { data: co } = await svc.from('companies').select('name,energy_type,priority,product_fit').eq('id', d.company_id).maybeSingle()
  const { data: ct } = d.contact_id ? await svc.from('contacts').select('name,greeting_name,phone,email,do_not_email').eq('id', d.contact_id).maybeSingle() : { data: null }
  console.log('  •', co?.name || '?', '| energy:', co?.energy_type, '| pri:', co?.priority, '| fit:', co?.product_fit)
  console.log('     greet:', ct?.greeting_name, '| phone:', ct?.phone, '| dne:', ct?.do_not_email, '| email:', ct?.email || '(none)')
  console.log('     channel:', d.channel, '| angle:', (d.angle||'').slice(0,70))
}

// energy_type of the loaded 52 (should be solar, not heat pump)
const cohortCompanyIds = withCohort.map(d => d.company_id).filter(Boolean)
let solar=0, other=0
for (const id of cohortCompanyIds) {
  const { data: co } = await svc.from('companies').select('energy_type').eq('id', id).maybeSingle()
  if (/solar pv/i.test(co?.energy_type||'')) solar++; else other++
}
console.log('\nloaded 52 energy mix: Solar PV =', solar, ', other =', other)
