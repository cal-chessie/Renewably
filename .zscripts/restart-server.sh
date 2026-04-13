#!/bin/bash
# Kill any existing server
fuser -k 3000/tcp 2>/dev/null
sleep 1
# Start fresh
cd /home/z/my-project
bun run dev > /tmp/nextdev.log 2>&1 &
echo $! > /home/z/my-project/.zscripts/dev.pid
