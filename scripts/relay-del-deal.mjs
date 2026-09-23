#!/usr/bin/env node
// Delete ONE deal by id. Guarded + dry-run by default. Usage: node scripts/relay-del-deal.mjs <dealId> --commit
import { existsSync, readFileSync } from 'node:fs'
import { createClient } from '@supabase/supabase-js'
function loadEnvFile(p){ if(!existsSync(p))return; for(const raw of readFileSync(p,'utf8').split(/\r?\n/)){const l=raw.trim(); if(!l||l.startsWith('#'))continue; const e=l.indexOf('='); if(e===-1)continue; const k=l.slice(0,e).trim(); let v=l.slice(e+1).trim(); if((v.startsWith('"')&&v.endsWith('"'))||(v.startsWith("'")&&v.endsWith("'")))v=v.slice(1,-1); if(k&&process.env[k]===undefined)process.env[k]=v } }
loadEnvFile('.env.local'); loadEnvFile('.env')
const id = process.argv[2]
const COMMIT = process.argv.includes('--commit')
if (!id || id.startsWith('--')) { console.error('usage: relay-del-deal.mjs <dealId> --commit'); process.exit(1) }
const svc = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } })
const { data: d, error } = await svc.from('deals').select('id,company_id,stage,list_cohort,notes,created_at').eq('id', id).maybeSingle()
if (error) { console.error(error.message); process.exit(1) }
if (!d) { console.log('No deal with id ' + id); process.exit(0) }
const { data: co } = await svc.from('companies').select('name').eq('id', d.company_id).maybeSingle()
console.log('target deal:', JSON.stringify({ ...d, company: co?.name }))
if (!COMMIT) { console.log('DRY RUN. add --commit to delete.'); process.exit(0) }
const { error: delErr } = await svc.from('deals').delete().eq('id', id)
if (delErr) { console.error('delete failed:', delErr.message); process.exit(1) }
const { count } = await svc.from('deals').select('*', { count:'exact', head:true })
console.log('DELETED. deals now ' + count)
