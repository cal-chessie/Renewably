#!/usr/bin/env node
// READ ONLY. Runs the exact pipeline enrichment select to prove it no longer 500s
// and that the 52 come back with their call scripts wired through.
import { existsSync, readFileSync } from 'node:fs'
import { createClient } from '@supabase/supabase-js'
function loadEnvFile(p){ if(!existsSync(p))return; for(const raw of readFileSync(p,'utf8').split(/\r?\n/)){const l=raw.trim(); if(!l||l.startsWith('#'))continue; const e=l.indexOf('='); if(e===-1)continue; const k=l.slice(0,e).trim(); let v=l.slice(e+1).trim(); if((v.startsWith('"')&&v.endsWith('"'))||(v.startsWith("'")&&v.endsWith("'")))v=v.slice(1,-1); if(k&&process.env[k]===undefined)process.env[k]=v } }
loadEnvFile('.env.local'); loadEnvFile('.env')
const svc = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } })

const SELECT = `
  id, company_id, contact_id, product, channel, angle, next_action, list_cohort,
  next_touch, mrr, setup_fee, stage, value, notes, updated_at, created_at,
  companies!company_id (
    id, name, counties, status, segment, product_fit, priority, lead_source,
    contacts!company_id (id, company_id, name, greeting_name, email, phone, role, do_not_email, is_decision_maker)
  ),
  deal_activities!deal_id ( id, deal_id, user_id, type, title, content, created_at )
`
const OPEN = ['new_lead','contacted','discovery_call','demo_booked','demo_done','proposal_sent','negotiation']
const { data, error } = await svc.from('deals').select(SELECT).in('stage', OPEN).order('updated_at',{ascending:false}).limit(500)
if (error) { console.log('\n  PIPELINE QUERY STILL 500s:', error.message, '\n'); process.exit(1) }
console.log('\n  Pipeline query OK. open deals returned:', data.length)
const wf = data.filter(d => d.list_cohort)
console.log('  with a work-first list_cohort:', wf.length)
console.log('\n  sample 3 (as the cockpit will see them):')
for (const d of wf.slice(0,3)) {
  const co = d.companies, c = (co?.contacts||[])[0]
  console.log('   - ' + (co?.name||'?'))
  console.log('       greeting=' + (c?.greeting_name||'-') + '  phone=' + (c?.phone||'-') + '  do_not_email=' + (c?.do_not_email))
  console.log('       segment=' + (co?.segment||'-') + '  priority=' + (co?.priority||'-') + '  product_fit=' + (co?.product_fit||'-'))
  console.log('       channel=' + (d.channel||'-'))
  console.log('       angle=' + (d.angle||'-').slice(0,80))
}
console.log('')
