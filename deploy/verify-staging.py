"""Verify the isolated test deployment and remove only this run's QA records."""
import getpass
import hashlib
import json
from pathlib import Path
import shlex
import sys
from urllib.request import urlopen

import paramiko


class PinnedHost(paramiko.MissingHostKeyPolicy):
    def missing_host_key(self, client, hostname, key):
        if key.get_fingerprint().hex() != 'a1f925b828da200e26fff2e39b047737':
            raise paramiko.SSHException('Host key mismatch')


client = paramiko.SSHClient()
client.set_missing_host_key_policy(PinnedHost())
client.connect('45.156.185.150', port=9011, username='root',
               password=getpass.getpass('SSH password (hidden): '),
               look_for_keys=False, allow_agent=False, timeout=20)


def run(command):
    _, out, err = client.exec_command(command, timeout=60)
    output = out.read().decode('utf-8', errors='replace')
    error = err.read().decode('utf-8', errors='replace')
    if out.channel.recv_exit_status():
        raise RuntimeError(output + '\n' + error)
    return output.strip()


qa_id = '4c768d60-96a9-4dc5-bf01-b72e2f3122da'
cleanup = f"""BEGIN;
DELETE FROM management_notes WHERE entity='subscriptions' AND entity_id='{qa_id}';
DELETE FROM registration_requests WHERE id='{qa_id}' AND full_name='آزمون اتصال پنل تست' AND phone='09120000000';
DELETE FROM gym_members WHERE phone='09120000000' AND name='آزمون اتصال پنل تست'
 AND NOT EXISTS(SELECT 1 FROM registration_requests WHERE phone='09120000000')
 AND NOT EXISTS(SELECT 1 FROM gym_attendance WHERE phone='09120000000');
COMMIT;"""
print(run('runuser -u postgres -- psql -v ON_ERROR_STOP=1 gym_stage -c ' + shlex.quote(cleanup)))
record = json.loads(Path('deploy/staging-manifest.json').read_text(encoding='utf-8'))
assert run('readlink -f /srv/gym-test/current') == record['release']
assert run('readlink -f /srv/gym/current') == record['production_source']
sftp = client.open_sftp()
for name, expected in record['files'].items():
    assert hashlib.sha256(Path(name).read_bytes()).hexdigest() == expected, name + ' local mismatch'
    with sftp.open(record['release'] + '/' + name, 'rb') as stream:
        assert hashlib.sha256(stream.read()).hexdigest() == expected, name + ' remote mismatch'
print('Source hashes match all deployed files. Production release is unchanged.')
for origin in ['https://test.shabeghahremanan.ir', 'https://shabeghahremanan.ir']:
    with urlopen(origin + '/api/health', timeout=30) as response:
        assert response.status == 200
        assert json.load(response)['status'] == 'ok'
        print(origin + ': health passed')
with urlopen('https://test.shabeghahremanan.ir/api/catalog', timeout=30) as response:
    catalog = json.load(response)
    assert 'noindex' in response.headers['X-Robots-Tag']
    assert 'no-store' in response.headers['Cache-Control']
    print('Test response headers verified; catalog available.')
print(run('systemctl is-active gym-test gym; df -h /srv/gym-test | tail -1'))
if '--prune-qa-releases' in sys.argv:
    # These are the two superseded releases created by this implementation run.
    # Retain both the active release and the previous release for rollback.
    prune = """from pathlib import Path
import shutil
root = Path('/srv/gym-test/releases').resolve(strict=True)
current = Path('/srv/gym-test/current').resolve(strict=True)
keep = {current, Path(PREVIOUS).resolve(strict=True)}
for name in ['20261101T224055Z', '20261101T225738Z']:
    candidate = root / name
    if not candidate.exists():
        continue
    resolved = candidate.resolve(strict=True)
    assert not candidate.is_symlink() and resolved.parent == root
    assert resolved not in keep and str(resolved) == '/srv/gym-test/releases/' + name
    shutil.rmtree(resolved)
    print('Removed superseded QA release: ' + name)
""".replace('PREVIOUS', repr(record['previous']))
    print(run('python3 -c ' + shlex.quote(prune)))
    print(run('df -h /srv/gym-test | tail -1'))
sftp.close()
client.close()
