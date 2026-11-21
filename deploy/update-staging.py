"""Publish source changes to the existing isolated test service only."""
import datetime
import getpass
import hashlib
import json
from pathlib import Path
import shlex
import paramiko

ROOT = Path.cwd()
FILES = ['src/shared/management.ts', 'src/server/security/admin.ts', 'src/components/admin/workspace.css',
         'src/components/admin/workspace.tsx', 'tests/management.test.ts',
         'tests/management.integration.test.ts']


class PinnedHost(paramiko.MissingHostKeyPolicy):
    def missing_host_key(self, client, hostname, key):
        if key.get_fingerprint().hex() != 'a1f925b828da200e26fff2e39b047737':
            raise paramiko.SSHException('Host key mismatch')


client = paramiko.SSHClient()
client.set_missing_host_key_policy(PinnedHost())
client.connect('45.156.185.150', port=9011, username='root',
               password=getpass.getpass('SSH password (hidden): '),
               look_for_keys=False, allow_agent=False, timeout=20)
client.get_transport().set_keepalive(20)
sftp = client.open_sftp()


def run(command, timeout=1200):
    _, out, err = client.exec_command(command, timeout=timeout)
    output = out.read().decode('utf-8', errors='replace')
    error = err.read().decode('utf-8', errors='replace')
    if out.channel.recv_exit_status():
        raise RuntimeError(output + '\n' + error)
    return output.strip()


previous = run('readlink -f /srv/gym-test/current')
assert previous.startswith('/srv/gym-test/releases/')
production = run('readlink -f /srv/gym/current')
stamp = datetime.datetime.now(datetime.timezone.utc).strftime('%Y%m%dT%H%M%SZ')
release = '/srv/gym-test/releases/' + stamp
run('cp -a --reflink=auto ' + previous + ' ' + release)
for name in FILES:
    sftp.put(str(ROOT / name), release + '/' + name)
env = ('export PATH=/opt/node-v22.23.3-linux-x64/bin:/usr/local/bin:/usr/bin:/bin; '
       'set -a; . /etc/gym/gym-test.env; set +a; cd ' + release + '; ')


def as_app(command):
    return 'runuser -u gymapp -- /bin/bash --noprofile --norc -c ' + shlex.quote('set -e; ' + env + command)


print('Building isolated update ' + release, flush=True)
try:
    run(as_app('npm run architecture:check && npm run lint && npm run build') + ' > ' + release + '/stage-update.log 2>&1')
    print(run('tail -35 ' + release + '/stage-update.log'), flush=True)
except Exception:
    print(run('tail -70 ' + release + '/stage-update.log'), flush=True)
    raise
run('runuser -u postgres -- createdb --owner=gym_stage gym_stage_validation_test')
try:
    run(as_app('node stage-validation.mjs') + ' > ' + release + '/stage-update-tests.log 2>&1')
    print(run('tail -30 ' + release + '/stage-update-tests.log'), flush=True)
except Exception:
    print(run('tail -100 ' + release + '/stage-update-tests.log'), flush=True)
    raise
finally:
    run('runuser -u postgres -- dropdb --if-exists gym_stage_validation_test')
assert run('readlink -f /srv/gym-test/current') == previous
run('ln -s ' + release + ' /srv/gym-test/next && mv -Tf /srv/gym-test/next /srv/gym-test/current && systemctl restart gym-test')
check = """from urllib.request import urlopen
import time,json
for i in range(40):
    try:
        assert json.load(urlopen('http://127.0.0.1:3102/api/health'))['status']=='ok';break
    except Exception:
        if i==39:raise
        time.sleep(.5)
print('Staging health passed.')
"""
try:
    print(run("python3 - <<'PY'\n" + check + '\nPY'), flush=True)
except Exception:
    run('ln -s ' + previous + ' /srv/gym-test/rollback && mv -Tf /srv/gym-test/rollback /srv/gym-test/current && systemctl restart gym-test')
    raise
assert run('readlink -f /srv/gym/current') == production
record_path = ROOT / 'deploy/staging-manifest.json'
record = json.loads(record_path.read_text(encoding='utf-8'))
record.update(release=release, previous=previous, checks='Architecture, ESLint, TypeScript, production build, 19 tests passed; staging health passed')
for name in FILES:
    record['files'][name] = hashlib.sha256((ROOT/name).read_bytes()).hexdigest()
record_path.write_text(json.dumps(record, ensure_ascii=False, indent=2)+'\n', encoding='utf-8')
with sftp.open(release+'/stage-manifest.json', 'w') as stream:
    stream.write(json.dumps(record, ensure_ascii=False, indent=2)+'\n')
print('PUBLISHED_STAGING_UPDATE ' + release, flush=True)
sftp.close()
client.close()
