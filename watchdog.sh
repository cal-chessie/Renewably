#!/bin/bash
# SolarPilot CRM — Server Watchdog
# Checks every 5s, restarts if dead.

cd /home/z/my-project

while true; do
  if ! curl -s -o /dev/null http://localhost:3000/crm/login 2>/dev/null; then
    echo "[$(date)] Server down — restarting" >> /tmp/watchdog.log
    pkill -9 -f "next-server" 2>/dev/null
    pkill -9 -f "bun.*dev" 2>/dev/null
    sleep 3
    NODE_OPTIONS="--max-old-space-size=512" nohup bun run dev > /tmp/dev.log 2>&1 &
    echo "[$(date)] Started PID $!" >> /tmp/watchdog.log
    # Wait for server to be ready
    for i in $(seq 1 30); do
      sleep 2
      if curl -s -o /dev/null http://localhost:3000/crm/login 2>/dev/null; then
        echo "[$(date)] Server ready" >> /tmp/watchdog.log
        break
      fi
    done
  fi
  sleep 5
done
