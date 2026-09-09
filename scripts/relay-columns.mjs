#!/usr/bin/env node
// READ ONLY. Prints the actual column names of each table (from a 1-row sample).
import { existsSync, readFileSync } from 'node:fs'
import { createClient } from '@supabase/supabase-js'
function loadEnvFile(p){ if(!existsSync(p))return; for(const raw of readFileSync(p,'utf8').split(/\r?\n/)){const l=raw.trim(); if(!l||l.startsWith('#'))continue; const e=l.indexOf('='); if(e===-1)continue; const k=l.slice(0,e).trim(); let v=l.slice(e+1).trim(); if((v.startsWith('"')&&v.endsWith('"'))||(v.startsWith("'")&&v.endsWith("'")))v=v.slice(1,-1); if(k&&process.env[k]===undefined)process.env[k]=v } }
loadEnvFile('.env.local'); loadEnvFile('.env')
const svc = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } })
const TABLES = ['companies','contacts','deals','deal_activities','notes','proposals','proposal_line_items','invoices','invoice_line_items','payments','email_logs','profiles','onboarding','onboarding_submissions']
for (const t of TABLES) {
  const { data, error } = await svc.from(t).select('*').limit(1)
  if (error) { console.log('\n' + t + ': (missing) ' + (error.message||error.code)); continue }
  if (!data.length) { console.log('\n' + t + ': EXISTS but empty - columns not visible via API'); continue }
  console.log('\n' + t + ' columns:\n  ' + Object.keys(data[0]).join(', '))
}
console.log('')
