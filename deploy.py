#!/usr/bin/env python3
"""Deploy to Vercel + set env vars."""
import os, sys, json, secrets, subprocess, urllib.request

# Read VERCEL_TOKEN
vercel_token = None
with open(os.path.expanduser('~/.hermes/.env')) as f:
    for line in f:
        if line.startswith('VERCEL') and 'TOKEN' in line and '=' in line:
            parts = line.split('=', 1)
            if len(parts) == 2 and len(parts[1].strip()) > 20:
                vercel_token = parts[1].strip()
                break

env_vars = os.environ.copy()
env_vars['VERCEL_TOKEN'] = vercel_token

pj = json.loads(open('.vercel/project.json').read())
project_id = pj['projectId']

# 1. Set SESSION_PASSWORD env var (random 64-char secret)
# Read existing env vars
req = urllib.request.Request(
    f'https://api.vercel.com/v9/projects/{project_id}/env',
    headers={'Authorization': f'Bearer {vercel_token}'}
)
with urllib.request.urlopen(req) as r:
    existing = json.loads(r.read()).get('envs', [])

has_session = any(e['key'] == 'SESSION_PASSWORD' for e in existing)
print(f"SESSION_PASSWORD already set: {has_session}")

if not has_session:
    # Generate a strong secret
    new_secret = secrets.token_urlsafe(48)  # ~64 chars
    body = json.dumps({
        'key': 'SESSION_PASSWORD',
        'value': new_secret,
        'type': 'encrypted',
        'target': ['production'],
    }).encode()
    req2 = urllib.request.Request(
        f'https://api.vercel.com/v10/projects/{project_id}/env',
        data=body,
        headers={
            'Authorization': f'Bearer {vercel_token}',
            'Content-Type': 'application/json',
        },
        method='POST'
    )
    try:
        with urllib.request.urlopen(req2) as r:
            d = json.loads(r.read())
        print(f"✓ SESSION_PASSWORD set: {d.get('key')} (id: {d.get('id')})")
    except urllib.error.HTTPError as e:
        print(f"Failed: {e.code} {e.reason}")
        print(e.read().decode()[:300])

# 2. Deploy
print("\n=== Deploying ===")
r = subprocess.run(
    'vercel deploy --prod --yes --force',
    shell=True, env=env_vars, capture_output=True, text=True
)
# Find the URL in output
url = None
for line in r.stdout.split('\n'):
    if 'vercel.app' in line and 'http' in line:
        url = line.strip()
        break
print(f"URL: {url}")
if r.returncode != 0:
    print('STDERR:')
    print(r.stderr[-1500:])
    sys.exit(r.returncode)
