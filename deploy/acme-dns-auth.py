#!/usr/bin/env python3
"""Certbot manual DNS hook: publish the requested TXT through the DNS provider UI.

An operator creates the matching .ready file after verifying the TXT record.
The hook does not store or grant access to the provider account.
"""
import hashlib
import json
import os
from pathlib import Path
import time

domain = os.environ['CERTBOT_DOMAIN']
if domain not in {'shabeghahremanan.ir', 'www.shabeghahremanan.ir'}:
    raise SystemExit('Unexpected domain')
value = os.environ['CERTBOT_VALIDATION']
directory = Path('/root/gym-acme-dns')
directory.mkdir(mode=0o700, exist_ok=True)
identifier = hashlib.sha256(value.encode()).hexdigest()
challenge = {'domain': domain, 'name': '_acme-challenge.' + domain, 'value': value, 'ready': str(directory / (identifier + '.ready'))}
pending = directory / 'pending.json'
pending.write_text(json.dumps(challenge))
pending.chmod(0o600)
print(json.dumps(challenge), flush=True)
deadline = time.monotonic() + 1200
while not Path(challenge['ready']).exists():
    if time.monotonic() > deadline:
        raise SystemExit('Timed out waiting for DNS challenge publication')
    time.sleep(5)
