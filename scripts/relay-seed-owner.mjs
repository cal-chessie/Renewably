#!/usr/bin/env node
// ============================================================================
// Relay owner seed - creates Cal's login + active owner profile. Idempotent.
// ----------------------------------------------------------------------------
// The cockpit login (src/app/api/crm/auth/login) does supabase.auth
// signInWithPassword, then REQUIRES a matching profiles row with is_active=true.
// This script provisions both against the reused renewably Supabase project:
//   1. an auth.users record for RELAY_OWNER_EMAIL (default cal@renewably.ie)
//   2. a profiles row (role=owner, is_active=true) keyed to that user
// Re-running is safe: it finds-or-creates the user and upserts the profile.
//
// The password NEVER passes through chat. Put it in .env.local:
//   RELAY_OWNER_EMAIL=cal@renewably.ie
//   RELAY_OWNER_PASSWORD=<a password you choose>
//   RELAY_OWNER_NAME=Cal            (optional)
//
// Run AFTER scripts/setup-relay-db.sql has been applied (profiles must exist).
// Usage:  node scripts/relay-seed-owner.mjs
// ============================================================================
import { existsSync, readFileSync } from 'node:fs'
import { createClient } from '@supabase/supabase-js'

function loadEnvFile(path) {
  if (!existsSync(path)) return
  for (const raw of readFileSync(path, 'utf8').split(/\r?\n/)) {
    const line = raw.trim()
    if (!line || line.startsWith('#')) continue
    const eq = line.indexOf('=')
    if (eq === -1) continue
    const key = line.slice(0, eq).trim()
    let val = line.slice(eq + 1).trim()
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) val = val.slice(1, -1)
    if (key && process.env[key] === undefined) process.env[key] = val
  }
}
loadEnvFile('.env.local')
loadEnvFile('.env')

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const email = (process.env.RELAY_OWNER_EMAIL || 'cal@renewably.ie').trim().toLowerCase()
const password = process.env.RELAY_OWNER_PASSWORD
const name = process.env.RELAY_OWNER_NAME || 'Cal'

if (!url || !serviceKey) {
  console.error('\n  Missing NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY in .env.local\n')
  process.exit(1)
}
if (!password || password.length < 8) {
  console.error('\n  Set RELAY_OWNER_PASSWORD in .env.local (8+ chars). It stays in that file; it is never printed.\n')
  process.exit(1)
}

const admin = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } })

async function findUserByEmail(target) {
  for (let page = 1; page <= 20; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 })
    if (error) throw error
    const hit = data.users.find(u => (u.email || '').toLowerCase() === target)
    if (hit) return hit
    if (data.users.length < 200) break
  }
  return null
}

async function main() {
  // 1. Auth user (find or create)
  let user = await findUserByEmail(email)
  if (user) {
    console.log('  auth user: already exists (' + email + '), updating password + confirming')
    const { error } = await admin.auth.admin.updateUserById(user.id, { password, email_confirm: true })
    if (error) throw error
  } else {
    const { data, error } = await admin.auth.admin.createUser({ email, password, email_confirm: true })
    if (error) throw error
    user = data.user
    console.log('  auth user: created (' + email + ')')
  }

  // 2. Profile row (find or create), active owner
  const { data: existing, error: selErr } = await admin
    .from('profiles').select('id').eq('user_id', user.id).maybeSingle()
  if (selErr && !/does not exist|schema cache/i.test(selErr.message || '')) throw selErr
  if (selErr) {
    console.error('\n  profiles table not found. Apply scripts/setup-relay-db.sql first, then re-run.\n')
    process.exit(1)
  }

  if (existing) {
    const { error } = await admin.from('profiles')
      .update({ email, name, role: 'owner', is_active: true }).eq('id', existing.id)
    if (error) throw error
    console.log('  profile: updated (owner, active)')
  } else {
    const { error } = await admin.from('profiles')
      .insert({ user_id: user.id, email, name, role: 'owner', is_active: true })
    if (error) throw error
    console.log('  profile: created (owner, active)')
  }

  console.log('\n  Done. Log in at /crm with ' + email + ' and your RELAY_OWNER_PASSWORD.\n')
}

main().catch(err => { console.error('\n  FAILED:', err.message || err, '\n'); process.exit(1) })
