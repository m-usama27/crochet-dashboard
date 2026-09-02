#!/bin/bash
set -e
VERCEL_TOKEN=*** -E '^VERCEL_TOKEN=*** ~/.hermes/.env | tail -1 | cut -d= -f2-)
export VERCEL_TOKEN
echo "Authenticated as: $(vercel whoami 2>&1 | tail -1)"
echo ""
echo "=== Deploying (this auto-creates the Vercel project if needed) ==="
vercel deploy --prod --yes 2>&1 | tail -25
