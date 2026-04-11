#!/bin/bash
cd /home/z/my-project
while true; do
  bun run dev
  echo "$(date): Server crashed, restarting in 3s..." >> /tmp/next-dev.log
  sleep 3
done
