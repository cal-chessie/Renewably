const { spawn } = require('child_process');
const fs = require('fs');
const http = require('http');

const PID_FILE = '/home/z/my-project/.zscripts/dev.pid';
const PROJECT_DIR = '/home/z/my-project';

function startServer() {
  const child = spawn('bun', ['run', 'dev'], {
    detached: true,
    stdio: ['ignore', 'pipe', 'pipe'],
    cwd: PROJECT_DIR,
    env: { ...process.env }
  });

  fs.writeFileSync(PID_FILE, String(child.pid));
  child.unref();
  console.log(`[${new Date().toISOString()}] Started dev server PID: ${child.pid}`);
  return child.pid;
}

function checkServer() {
  return new Promise((resolve) => {
    const req = http.get('http://localhost:3000', (res) => {
      resolve(res.statusCode === 200);
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

  while (true) {
    await new Promise(r => setTimeout(r, 15000));

    try {
      const pid = parseInt(fs.readFileSync(PID_FILE, 'utf8').trim());
      const alive = isProcessAlive(pid);

      if (!alive) {
        console.log(`[${new Date().toISOString()}] Server PID ${pid} is dead, restarting...`);
        startServer();
        // Wait for server to come up
        await new Promise(r => setTimeout(r, 10000));
        const up = await checkServer();
        if (up) {
          console.log(`[${new Date().toISOString()}] Server restarted successfully`);
        } else {
          console.log(`[${new Date().toISOString()}] Server restart failed, will retry in 15s`);
        }
      } else {
        const up = await checkServer();
        if (!up) {
          console.log(`[${new Date().toISOString()}] Process alive but not responding, killing and restarting...`);
          try { process.kill(pid, 'SIGKILL'); } catch {}
          startServer();
          await new Promise(r => setTimeout(r, 10000));
        }
      }
    } catch (e) {
      console.error(`[${new Date().toISOString()}] Check error: ${e.message}`);
      startServer();
      await new Promise(r => setTimeout(r, 10000));
    }
  }
}

main();
