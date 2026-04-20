#!/usr/bin/env node
// SolarPilot CRM — Dev Server Keepalive + Route Pre-warming
// Auto-restarts on crash and pre-warms critical routes on boot.

const { spawn } = require('child_process')
const http = require('http')

function sleep(ms) { return new Promise(r => setTimeout(r, ms)) }

function request(path, method = 'GET', body = null) {
  return new Promise((resolve) => {
    const opts = { hostname: 'localhost', port: 3000, path, method, timeout: 15000, headers: {} }
    if (body) { opts.headers['Content-Type'] = 'application/json'; opts.method = 'POST' }
    const req = http.request(opts, (res) => {
      let data = ''
      res.on('data', chunk => data += chunk)
      res.on('end', () => resolve({ ok: true, status: res.statusCode, data }))
    })
    req.on('error', () => resolve({ ok: false }))
    req.on('timeout', () => { req.destroy(); resolve({ ok: false }) })
    if (body) req.write(JSON.stringify(body))
    req.end()
  })
}

async function warmup() {
  console.log('[keepalive] Pre-warming routes...')
  
  // 1. Warm the login page (lightweight)
  const login = await request('/crm/login')
  console.log(`[keepalive] /crm/login → ${login.ok ? login.status : 'FAIL'}`)
  
  // 2. Warm the auth API route (heavy — Prisma + Redis + crypto)
  await sleep(2000) // breathe between compilations
  const authGet = await request('/api/crm/auth')
  console.log(`[keepalive] GET /api/crm/auth → ${authGet.ok ? authGet.status : 'FAIL'}`)
  
  // 3. Warm the login POST to pre-compile the full auth chain
  await sleep(2000)
  const authPost = await request('/api/crm/auth', 'POST', { email: '_warmup', password: '_warmup' })
  console.log(`[keepalive] POST /api/crm/auth → ${authPost.ok ? authPost.status : 'FAIL'}`)
  
  console.log('[keepalive] Pre-warming complete.')
}

function start() {
  const ts = new Date().toISOString()
  console.log(`[${ts}] Starting dev server...`)
  
  const child = spawn('bun', ['run', 'dev'], {
    stdio: 'inherit',
    env: { ...process.env, NODE_OPTIONS: '--max-old-space-size=768' }
  })

  child.on('exit', (code) => {
    const ts = new Date().toISOString()
    console.log(`[${ts}] Server exited (code: ${code}). Restarting in 5s...`)
    setTimeout(start, 5000)
  })
}

// Start server
start()

// Pre-warm after server is ready
;(async () => {
  for (let i = 0; i < 45; i++) {
    await sleep(2000)
    const res = await request('/crm/login')
    if (res.ok) {
      await warmup()
      break
    }
  }
})()
