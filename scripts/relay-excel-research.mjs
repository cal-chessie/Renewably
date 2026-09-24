#!/usr/bin/env node
// READ ONLY. Shows what research is in the Excel vs what is in the DB / shown.
import { existsSync, readFileSync } from 'node:fs'
import { createClient } from '@supabase/supabase-js'
import XLSX from 'xlsx'
function loadEnvFile(p){ if(!existsSync(p))return; for(const raw of readFileSync(p,'utf8').split(/\r?\n/)){const l=raw.trim(); if(!l||l.startsWith('#'))continue; const e=l.indexOf('='); if(e===-1)continue; const k=l.slice(0,e).trim(); let v=l.slice(e+1).trim(); if((v.startsWith('"')&&v.endsWith('"'))||(v.startsWith("'")&&v.endsWith("'")))v=v.slice(1,-1); if(k&&process.env[k]===undefined)process.env[k]=v } }
loadEnvFile('.env.local'); loadEnvFile('.env')

const XL = '/Users/calchesters/Desktop/SONSSONS/COMH/RENEWABLY/outbound/Ireland_Renewable_Call_List_RELAY_v4.xlsx'
const wb = XLSX.readFile(XL, { cellDates: true })
console.log('SHEETS:', wb.SheetNames.join(' | '))
function dump(name, n=2) {
  const ws = wb.Sheets[name]; if (!ws) { console.log('\n['+name+'] not found'); return }
  const rows = XLSX.utils.sheet_to_json(ws, { header:1, defval:null, blankrows:false, raw:false })
  const hi = rows.findIndex(r => Array.isArray(r) && r.some(c=>/company/i.test(String(c))))
  console.log('\n=== ' + name + ' === headers:'); console.log('  ' + JSON.stringify(rows[hi]))
  for (let i=1;i<=n;i++) if (rows[hi+i]) console.log('  row'+i+': ' + JSON.stringify(rows[hi+i]))
}
dump('Work First', 2)
dump('Relay Segments', 1)

const svc = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } })
const { data: cos } = await svc.from('companies').select('name,notes').not('notes','is',null).limit(3)
console.log('\n=== DB companies.notes samples ===')
for (const c of (cos||[])) console.log('  ' + c.name + ': ' + JSON.stringify(c.notes))
const { data: ds } = await svc.from('deals').select('angle,channel,next_action,notes').limit(2)
console.log('\n=== DB deals research (angle/channel/next_action/notes) ===')
for (const d of (ds||[])) console.log('  ' + JSON.stringify(d))
