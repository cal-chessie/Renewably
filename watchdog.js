#!/usr/bin/env node
// SolarPilot Server Watchdog — keeps the production server alive
const { execSync, spawn } = require('child_process')
const http = require('http')

const PORT = 3000
const CHECK_INTERVAL = 5000 // check every 5s
const STARTUP_WAIT = 3000 // wait 3s for server to start
const MAX_RETRIES = 3
const WARMUP_PATHS = ['/crm/login', '/api/crm/auth']

let retries = 0

function checkServer() {
  return new Promise((resolve) => {
    const req = http.get(`http://localhost:${PORT}/`, { timeout: 3000 }, (res) => {
      resolve(res.statusCode >= 200 && res.statusCode < 500)
    })
    req.on('error', () => resolve(false))
    req.on('timeout', () => { req.destroy(); resolve(false) })
  })
}

function startServer() {
  console.log(`[${new Date().toISOString()}] Starting server...`)
  const child = spawn('node', ['.next/standalone/server.js', '-p', String(PORT)], {
    cwd: __dirname,
    env: { ...process.env, NODE_ENV: 'production' },
    stdio: ['ignore', 'pipe', 'pipe'],
    detached: false,
  })

  child.stdout?.on('data', (d) => process.stdout.write(d))
  child.stderr?.on('data', (d) => process.stderr.write(d))

  child.on('exit', (code) => {
    console.log(`[${new Date().toISOString()}] Server exited with code ${code}`)
  })

  return child
}

function warmup() {
  WARMUP_PATHS.forEach((path) => {
    try {
      http.get(`http://localhost:${PORT}${path}`, { timeout: 5000 }).on('error', () => {})
    } catch {}
  })
}

async function main() {
  console.log(`[${new Date().toISOString()}] Watchdog started - watching port ${PORT}`)

  // Kill any existing processes on our port
  try {
    execSync(`fuser -k ${PORT}/tcp 2>/dev/null || true`, { timeout: 3000 })
  } catch {}

  let server = startServer()

  // Warmup after startup
  setTimeout(warmup, STARTUP_WAIT)

  setInterval(async () => {
    const alive = await checkServer()
    if (!alive) {
      console.log(`[${new Date().toISOString()}] Server not responding!`)
      retries++
      if (retries > MAX_RETRIES) {
        retries = 0 // reset retry counter after max
      }
      try {
        if (server && !server.killed) {
          server.kill('SIGTERM')
          setTimeout(() => { try { server.kill('SIGKILL') } catch {} }, 2000)
        }
      } catch {}
      // Kill anything on the port
      try {
        execSync(`fuser -k ${PORT}/tcp 2>/dev/null || true`, { timeout: 3000 })
      } catch {}
      await new Promise((r) => setTimeout(r, 1000))
      server = startServer()
      retries = 0
      setTimeout(warmup, STARTUP_WAIT)
    } else {
      retries = 0
    }
  }, CHECK_INTERVAL)

  // Keep process alive
  process.on('SIGTERM', () => {
    console.log('Watchdog shutting down...')
    if (server && !server.killed) server.kill()
    process.exit(0)
  })
}

main().catch(console.error)
