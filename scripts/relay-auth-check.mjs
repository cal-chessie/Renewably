#!/usr/bin/env node
// READ ONLY. Does an Auth user exist for the owner email, and is the profiles row linked to it?
import { existsSync, readFileSync } from 'node:fs'
import { createClient } from '@supabase/supabase-js'
function loadEnvFile(p){ if(!existsSync(p))return; for(const raw of readFileSync(p,'utf8').split(/\r?\n/)){const l=raw.trim(); if(!l||l.startsWith('#'))continue; const e=l.indexOf('='); if(e===-1)continue; const k=l.slice(0,e).trim(); let v=l.slice(e+1).trim(); if((v.startsWith('"')&&v.endsWith('"'))||(v.startsWith("'")&&v.endsWith("'")))v=v.slice(1,-1); if(k&&process.env[k]===undefined)process.env[k]=v } }
loadEnvFile('.env.local'); loadEnvFile('.env')
const email = (process.env.RELAY_OWNER_EMAIL || 'cal@renewably.ie').toLowerCase()
const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } })

// auth user?
let authUser = null
for (let page=1; page<=10; page++){
  const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 })
  if (error){ console.log('listUsers error:', error.message); break }
  authUser = data.users.find(u => (u.email||'').toLowerCase() === email)
  if (authUser || data.users.length < 200) break
}
console.log('auth.users total-scan for', email + ':', authUser ? ('FOUND id=' + authUser.id + ' last_sign_in=' + (authUser.last_sign_in_at||'never')) : 'NOT FOUND')

// profiles row(s)
const { data: profs, error: pErr } = await admin.from('profiles').select('id,user_id,email,role,is_active')
if (pErr){ console.log('profiles error:', pErr.message); process.exit(0) }
console.log('\nprofiles rows:', profs.length)
for (const p of profs) console.log('  ', JSON.stringify(p))

const mine = profs.find(p => (p.email||'').toLowerCase() === email)
console.log('\nVERDICT:')
if (!authUser) console.log('  No Supabase Auth user for ' + email + ' -> login will FAIL until one is created/linked.')
else if (!mine) console.log('  Auth user exists but no profiles row for that email -> login 403 (no profile).')
else if (mine.user_id === authUser.id) console.log('  LINKED correctly (profiles.user_id == auth id) and is_active=' + mine.is_active + ' -> login works once password is known.')
else console.log('  MISMATCH: profiles.user_id (' + mine.user_id + ') != auth id (' + authUser.id + ') -> login gets a 403/empty profile. Needs relinking.')
console.log('')
