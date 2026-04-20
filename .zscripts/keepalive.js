const { spawn, execSync } = require('child_process');
const fs = require('fs');
const http = require('http');

const PID_FILE = '/home/z/my-project/.zscripts/dev.pid';
const PROJECT_DIR = '/home/z/my-project';

let currentChild = null;

function startServer() {
  // Kill any existing server
  if (currentChild) {
    try { currentChild.kill('SIGKILL'); } catch {}
  }

  const logFd = fs.openSync('/tmp/bundev-keepalive.log', 'a');

  const child = spawn('bun', ['run', 'dev'], {
    cwd: PROJECT_DIR,
    stdio: ['ignore', logFd, logFd],
    env: { ...process.env },
    detached: false,
  });

  currentChild = child;

  child.on('exit', (code, sig) => {
    const ts = new Date().toISOString();
    fs.appendFileSync('/tmp/keepalive-exit.log',
      `[${ts}] Server exited code:${code} signal:${sig} pid:${child.pid}\n`);
    currentChild = null;
  });

  try {
    fs.writeFileSync(PID_FILE, String(child.pid));
  } catch {}

  console.log(`[${new Date().toISOString()}] Started bun dev PID: ${child.pid}`);
  return child.pid;
}

function checkServer() {
  return new Promise((resolve) => {
    const req = http.get('http://localhost:3000', (res) => {
      // Consume data to free up the socket
      res.on('data', () => {});
      res.on('end', () => resolve(res.statusCode >= 200 && res.statusCode < 500));
    });
    req.on('error', () => resolve(false));
    req.setTimeout(5000, () => { req.destroy(); resolve(false); });
  });
}

function isProcessAlive(pid) {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

async function main() {
  console.log(`[${new Date().toISOString()}] Keepalive watcher started`);

  // Initial start
  startServer();
  // Wait for Turbopack to compile first page (~15s)
  await new Promise(r => setTimeout(r, 20000));

  while (true) {
    await new Promise(r => setTimeout(r, 10000)); // Check every 10s

    try {
      let pid;
      try {
        pid = parseInt(fs.readFileSync(PID_FILE, 'utf8').trim());
      } catch {
        pid = currentChild ? currentChild.pid : 0;
      }

      const alive = pid && isProcessAlive(pid);

      if (!alive) {
        console.log(`[${new Date().toISOString()}] Server dead, restarting...`);
        startServer();
        await new Promise(r => setTimeout(r, 15000));
        const up = await checkServer();
        console.log(`[${new Date().toISOString()}] Restart ${up ? 'OK' : 'FAILED'}`);
      } else {
        // Quick health check
        const up = await checkServer();
        if (!up) {
          console.log(`[${new Date().toISOString()}] Not responding, killing and restarting...`);
          try { process.kill(pid, 'SIGKILL'); } catch {}
          await new Promise(r => setTimeout(r, 2000));
          startServer();
          await new Promise(r => setTimeout(r, 15000));
          const up2 = await checkServer();
          console.log(`[${new Date().toISOString()}] Restart ${up2 ? 'OK' : 'FAILED'}`);
        }
      }
    } catch (e) {
      console.error(`[${new Date().toISOString()}] Check error: ${e.message}`);
      startServer();
      await new Promise(r => setTimeout(r, 15000));
    }
  }
}

main();
