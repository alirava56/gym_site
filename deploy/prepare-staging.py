"""Build and activate the isolated test site; production is only a source template.

The SSH password is read interactively and never stored. Run from the repo root.
"""
import datetime
import getpass
import hashlib
import json
from pathlib import Path
import shlex
import tarfile
import tempfile

import paramiko

ROOT = Path.cwd()
FILES = [
    'migrations/004_management.sql', 'src/shared/management.ts',
    'src/server/domain/management.ts', 'src/server/database/management.ts',
    'src/server/database/registration-requests.ts', 'src/server/database/bookings.ts',
    'src/server/domain/gym.ts', 'src/app/api/catalog/route.ts',
    'src/app/api/admin/workspace/route.ts', 'src/app/api/bookings/route.ts',
    'src/app/api/bookings/availability/route.ts', 'src/app/api/subscription/route.ts',
    'src/components/experience/catalog-provider.tsx', 'src/components/experience/experience-provider.tsx',
    'src/components/sections/membership-pricing-dialog.tsx', 'src/components/sections/registration-form.tsx',
    'src/components/sections/coaches-section.tsx', 'src/components/sections/hero-section.tsx',
    'src/components/layout/site-footer.tsx', 'src/components/admin/workspace.tsx',
    'src/components/admin/workspace.css', 'src/app/admin/page.tsx', 'src/shared/site.ts',
    'src/app/layout.tsx', 'src/app/robots.ts', 'tests/management.test.ts',
    'tests/management.integration.test.ts', 'tests/blog.test.ts',
]


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
    _, stdout, stderr = client.exec_command(command, timeout=timeout)
    output = stdout.read().decode('utf-8', errors='replace')
    error = stderr.read().decode('utf-8', errors='replace')
    if stdout.channel.recv_exit_status():
        raise RuntimeError(output + '\n' + error)
    return output.strip()


def write(destination, value):
    with sftp.open(destination, 'w') as stream:
        stream.write(value)


base = run('readlink -f /srv/gym/current')
assert base.startswith('/srv/gym/releases/')
stamp = datetime.datetime.now(datetime.timezone.utc).strftime('%Y%m%dT%H%M%SZ')
release = '/srv/gym-test/releases/' + stamp
archive = Path(tempfile.gettempdir()) / 'gym-stage-source.tar.gz'
with tarfile.open(archive, 'w:gz') as package:
    for name in FILES:
        package.add(ROOT / name, arcname=name)
run('install -d -m 755 /srv/gym-test/releases; cp -a --reflink=auto ' + base + ' ' + release)
sftp.put(str(archive), '/tmp/gym-stage-source.tar.gz')
run('tar -xzf /tmp/gym-stage-source.tar.gz -C ' + release)

initialize = r"""
import pathlib,secrets,subprocess,re,os,grp
p=pathlib.Path('/etc/gym/gym-test.env')
if not p.exists():
    password=secrets.token_hex(32)
    sql="CREATE ROLE gym_stage LOGIN PASSWORD '"+password+"';"
    subprocess.run(['runuser','-u','postgres','--','psql','-v','ON_ERROR_STOP=1'],input=sql,text=True,check=True,stdout=subprocess.DEVNULL)
    subprocess.run(['runuser','-u','postgres','--','createdb','--owner=gym_stage','gym_stage'],check=True)
    value=pathlib.Path('/etc/gym/gym.env').read_text()
    value=re.sub(r'^DATABASE_URL=.*$',"DATABASE_URL='postgresql://gym_stage:"+password+"@127.0.0.1:5432/gym_stage'",value,flags=re.M)
    value=re.sub(r'^AUTH_SECRET=.*$',"AUTH_SECRET="+secrets.token_hex(32),value,flags=re.M)
    value+='\nGYM_MANAGEMENT=true\nGYM_ENVIRONMENT=test\nNEXT_PUBLIC_SITE_URL=https://test.shabeghahremanan.ir\n'
    p.write_text(value);os.chmod(p,0o640);os.chown(p,0,grp.getgrnam('gymapp').gr_gid)
    print('Created isolated staging database, role and runtime configuration.')
else:
    print('Reusing isolated staging configuration.')
"""
print(run("python3 - <<'PY'\n" + initialize + '\nPY'), flush=True)
run('chown -R gymapp:gymapp ' + release)
environment = ('export PATH=/opt/node-v22.23.3-linux-x64/bin:/usr/local/bin:/usr/bin:/bin; '
               'set -a; . /etc/gym/gym-test.env; set +a; cd ' + release + '; ')


def as_app(command):
    return 'runuser -u gymapp -- /bin/bash --noprofile --norc -c ' + shlex.quote('set -e; ' + environment + command)


print('Migrating staging database and building ' + release, flush=True)
try:
    run(as_app('npm run db:migrate && npm run architecture:check && npm run lint && npm run build') +
        ' > ' + release + '/stage-build.log 2>&1')
except Exception:
    print(run('tail -75 ' + release + '/stage-build.log'), flush=True)
    raise
print(run('tail -40 ' + release + '/stage-build.log'), flush=True)
# Copy only the administrator identity. Customer data and sessions stay isolated.
run("runuser -u postgres -- pg_dump --data-only --table=admin_account gym | "
    "runuser -u postgres -- psql -v ON_ERROR_STOP=1 gym_stage > /dev/null")
runner = """import {spawnSync} from 'node:child_process';import fs from 'node:fs';
const url=new URL(process.env.DATABASE_URL);url.pathname='/gym_stage_validation_test';process.env.DATABASE_URL=url.toString();process.env.GYM_MEMBERSHIP_DB_TEST='1';
for(const args of [['scripts/migrate.mjs'],['--conditions=react-server','--test','--test-concurrency=1','--import','tsx',...fs.readdirSync('tests').filter(f=>f.endsWith('.test.ts')).map(f=>'tests/'+f)]]){const r=spawnSync(process.execPath,args,{stdio:'inherit',env:process.env});if(r.status)process.exit(r.status);}
"""
write(release + '/stage-validation.mjs', runner)
run('chmod 644 ' + release + '/stage-validation.mjs')
run('runuser -u postgres -- createdb --owner=gym_stage gym_stage_validation_test')
try:
    run(as_app('node stage-validation.mjs') + ' > ' + release + '/stage-tests.log 2>&1')
    print(run('tail -32 ' + release + '/stage-tests.log'), flush=True)
except Exception:
    print(run('tail -100 ' + release + '/stage-tests.log'), flush=True)
    raise
finally:
    run('runuser -u postgres -- dropdb --if-exists gym_stage_validation_test')
record = {'release': release, 'production_source': base, 'domain': 'test.shabeghahremanan.ir',
          'database': 'gym_stage', 'files': {name: hashlib.sha256((ROOT / name).read_bytes()).hexdigest() for name in FILES}}
(ROOT / 'deploy/staging-manifest.json').write_text(json.dumps(record, ensure_ascii=False, indent=2)+'\n', encoding='utf-8')
write(release+'/stage-manifest.json', json.dumps(record, ensure_ascii=False, indent=2)+'\n')
print('STAGING_READY ' + release, flush=True)
assert input('Activation action: ').strip() == 'activate'
assert run('test -f /etc/letsencrypt/live/test.shabeghahremanan.ir/fullchain.pem && echo yes') == 'yes'
write('/etc/systemd/system/gym-test.service', (ROOT / 'deploy/gym-test.service').read_text(encoding='utf-8'))
write('/etc/nginx/sites-available/gym-test', (ROOT / 'deploy/nginx-test.conf').read_text(encoding='utf-8'))
run('ln -s ' + release + ' /srv/gym-test/current; '
    'ln -s /etc/nginx/sites-available/gym-test /etc/nginx/sites-enabled/gym-test; '
    'nginx -t; systemctl daemon-reload; systemctl enable --now gym-test; systemctl reload nginx')
check = """from urllib.request import urlopen
import time,json
for i in range(40):
    try:
        assert json.load(urlopen('http://127.0.0.1:3102/api/health'))['status']=='ok';break
    except Exception:
        if i==39:raise
        time.sleep(.5)
print('Staging database health passed.')
"""
print(run("python3 - <<'PY'\n"+check+'\nPY'), flush=True)
print(run('curl -fsS --resolve test.shabeghahremanan.ir:443:127.0.0.1 https://test.shabeghahremanan.ir/api/health; '
          'systemctl is-active gym-test gym nginx postgresql'), flush=True)
print('PUBLISHED_STAGING ' + release, flush=True)
sftp.close()
client.close()
