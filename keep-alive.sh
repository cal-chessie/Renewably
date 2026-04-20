#!/bin/bash
pkill -f "node.*next" 2>/dev/null
pkill -f "next dev" 2>/dev/null
sleep 1
cd /home/z/my-project
nohup npx next dev -H 0.0.0.0 -p 3000 > /tmp/next-dev.log 2>&1 &
