#!/usr/bin/env python3
"""Deploy to Vercel using tokens from ~/.hermes/.env"""
import os
import re
import subprocess
import sys

# Read VERCEL_TOKEN
env = open(os.path.expanduser('~/.hermes/.env')).read()
m = re.search(r'^VERCEL_TOKEN=(.+)', env, re.MULTILINE)
if not m:
    print("VERCEL_TOKEN not found in ~/.hermes/.env")
    sys.exit(1)
vercel_token = m.group(1).strip()

# Read DATABASE_URL from project .env
proj_env = open('.env').read() if os.path.exists('.env') else ''
m2 = re.search(r'^DATABASE_URL=(.+)', proj_env, re.MULTILINE)
db_url = m2.group(1).strip() if m2 else ''

# Set env vars for subprocess
env_vars = os.environ.copy()
env_vars['VERCEL_TOKEN'] = vercel_token
# Pass DATABASE_URL too so the build can use it
env_vars['DATABASE_URL'] = db_url

def run(cmd, **kwargs):
    print(f"\n$ {cmd}")
    return subprocess.run(cmd, shell=True, env=env_vars, **kwargs)

# 1. Verify auth
run('vercel whoami')

# 2. Add DATABASE_URL to Vercel env (production). This is idempotent — if it
# already exists, Vercel will tell us. We pass it via stdin to avoid shell escaping.
print(f"\n=== Adding DATABASE_URL to Vercel production env (length: {len(db_url)}) ===")
add = subprocess.run(
    'vercel env add DATABASE_URL production --yes',
    shell=True, env=env_vars, input=db_url, capture_output=True, text=True
)
print(add.stdout[-500:] if add.stdout else '')
if add.stderr:
    print('STDERR:', add.stderr[-300:])

# 3. Deploy
print("\n=== Deploying to production ===")
deploy = subprocess.run(
    'vercel deploy --prod --yes',
    shell=True, env=env_vars, capture_output=True, text=True
)
print('STDOUT:')
print(deploy.stdout[-2500:] if deploy.stdout else '(empty)')
if deploy.returncode != 0:
    print('STDERR:')
    print(deploy.stderr[-1500:] if deploy.stderr else '(empty)')
    sys.exit(deploy.returncode)
