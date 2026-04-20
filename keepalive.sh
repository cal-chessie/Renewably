#!/bin/bash
# Auto-restart server if it dies
while true; do
  if ! ss -tlnp 2>/dev/null | grep -q ':3000'; then
    echo "$(date): Server not running, starting..."
    cd /home/z/my-project
    node /home/z/my-project/.next/standalone/server.js > /home/z/my-project/server.log 2>&1 &
    sleep 5
    # Verify it started
    if curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/ | grep -q "200"; then
      echo "$(date): Server started successfully"
    else
      echo "$(date): Server failed to start, retrying in 10s..."
      sleep 10
    fi
  fi
  sleep 10
done
