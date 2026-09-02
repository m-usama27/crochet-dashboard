#!/usr/bin/env python3
import os, sys, json, urllib.request

# Find token
vercel_token = None
with open(os.path.expanduser('~/.hermes/.env')) as f:
    for line in f:
        if line.startswith('VERCEL') and 'TOKEN' in line and '=' in line:
            parts = line.split('=', 1)
            if len(parts) == 2 and len(parts[1].strip()) > 20:
                vercel_token = parts[1].strip()
                break

pj = json.loads(open('.vercel/project.json').read())
project_id = pj['projectId']

# Trigger a fresh deploy
req = urllib.request.Request(
    f'https://api.vercel.com/v13/deployments?projectId={project_id}&forceNew=1',
    headers={
        'Authorization': f'Bearer {vercel_token}',
        'Content-Type': 'application/json',
    },
    data=json.dumps({
        'name': pj.get('projectName'),
        'target': 'production',
    }).encode(),
    method='POST'
)
try:
    with urllib.request.urlopen(req) as r:
        d = json.loads(r.read())
    print(f"Deploy triggered: {d.get('id')}")
    print(f"URL: https://{d.get('url')}")
    print(f"State: {d.get('readyState')}")
except urllib.error.HTTPError as e:
    print(f"Failed: {e.code} {e.reason}")
    print(e.read().decode()[:500])
