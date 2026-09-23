#!/usr/bin/env node
// READ ONLY. Tries to read sensitive tables using the PUBLIC (anon) key - the
// same key shipped in the website bundle. Before lockdown: readable (the leak).
// After lockdown: blocked/empty. Proves the hole is closed without guessing.
import { existsSync, readFileSync } from 'node:fs'
import { createClient } from '@supabase/supabase-js'
function loadEnvFile(p){ if(!existsSync(p))return; for(const raw of readFileSync(p,'utf8').split(/\r?\n/)){const l=raw.trim(); if(!l||l.startsWith('#'))continue; const e=l.indexOf('='); if(e===-1)continue; const k=l.slice(0,e).trim(); let v=l.slice(e+1).trim(); if((v.startsWith('"')&&v.endsWith('"'))||(v.startsWith("'")&&v.endsWith("'")))v=v.slice(1,-1); if(k&&process.env[k]===undefined)process.env[k]=v } }
loadEnvFile('.env.local'); loadEnvFile('.env')
const anon = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, { auth: { persistSession: false } })
console.log('probing with the PUBLIC anon key:\n')
for (const t of ['contacts', 'companies', 'deals', 'email_logs', 'profiles']) {
  const { data, count, error } = await anon.from(t).select('*', { count: 'exact' }).limit(1)
  if (error) console.log('  ' + t.padEnd(14) + 'BLOCKED  (' + (error.message || error.code) + ')')
  else if (!data || data.length === 0) console.log('  ' + t.padEnd(14) + 'empty    (RLS filtered, count=' + count + ')')
  else console.log('  ' + t.padEnd(14) + 'READABLE (' + count + ' rows) e.g. ' + JSON.stringify(data[0]).slice(0, 80))
}
console.log('')
