#!/usr/bin/env python3
"""Create encrypted local backups; copy backups and key to offsite storage separately."""
import datetime
import os
from pathlib import Path
import secrets
import subprocess
import tempfile

base = Path('/var/backups/gym')
base.mkdir(mode=0o700, exist_ok=True)
key = Path('/etc/gym/backup.key')
if not key.exists():
    with key.open('x') as file:
        file.write(secrets.token_hex(48))
    key.chmod(0o600)

today = datetime.date.today()
with tempfile.TemporaryDirectory(prefix='gym-backup-') as directory:
    os.chmod(directory, 0o755)
    dump = Path(directory) / 'gym.dump'
    with dump.open('wb') as output:
        subprocess.run(
            ['runuser', '-u', 'postgres', '--', 'pg_dump', '--format=custom', 'gym'],
            stdout=output, check=True,
        )
    subprocess.run(['pg_restore', '--list', str(dump)], stdout=subprocess.DEVNULL, check=True)
    destination = base / f'gym-{today.isoformat()}.dump.enc'
    partial = destination.with_suffix('.partial')
    subprocess.run([
        'openssl', 'enc', '-aes-256-cbc', '-salt', '-pbkdf2', '-iter', '200000',
        '-pass', f'file:{key}', '-in', str(dump), '-out', str(partial),
    ], check=True)
    partial.chmod(0o600)
    partial.replace(destination)
    monthly = base / f'monthly-{today:%Y-%m}.dump.enc'
    if not monthly.exists():
        monthly.write_bytes(destination.read_bytes())
        monthly.chmod(0o600)

for pattern, count in [('gym-*.dump.enc', 14), ('monthly-*.dump.enc', 3)]:
    for expired in sorted(base.glob(pattern), reverse=True)[count:]:
        expired.unlink()
print(f'Encrypted backup created: {destination.name}')
