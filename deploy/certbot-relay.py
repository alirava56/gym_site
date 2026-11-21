"""Run VPS Certbot through an ephemeral, loopback-only SSH HTTPS relay.

Requires paramiko on the workstation. Private keys stay on the VPS and TLS
verification stays enabled. Supply the SSH password on stdin, never as an argument.
"""
import argparse
import select
import socket
import sys
import threading
import time
import json
from pathlib import Path
import subprocess

import paramiko

ALLOWED = {'acme-v02.api.letsencrypt.org', 'acme-staging-v02.api.letsencrypt.org'}


def relay(channel):
    upstream = None
    try:
        channel.settimeout(30)
        header = bytearray()
        while not header.endswith(b'\r\n\r\n') and len(header) < 8192:
            chunk = channel.recv(1)
            if not chunk:
                return
            header.extend(chunk)
        method, destination, _ = header.split(b'\r\n', 1)[0].decode('ascii').split()
        host, port = destination.rsplit(':', 1)
        if method != 'CONNECT' or host not in ALLOWED or port != '443':
            channel.sendall(b'HTTP/1.1 403 Forbidden\r\n\r\n')
            return
        upstream = socket.create_connection((host, 443), timeout=20)
        channel.sendall(b'HTTP/1.1 200 Connection Established\r\n\r\n')
        while True:
            readable, _, _ = select.select([channel, upstream], [], [], 120)
            if not readable:
                return
            for source in readable:
                data = source.recv(65536)
                if not data:
                    return
                (upstream if source is channel else channel).sendall(data)
    except Exception as error:
        print(f'Relay connection ended: {type(error).__name__}', flush=True)
    finally:
        if upstream:
            upstream.close()
        try:
            channel.close()
        except EOFError:
            pass


parser = argparse.ArgumentParser()
parser.add_argument('--mode', choices=['check', 'issue', 'issue-dns', 'renew-test'], default='check')
parser.add_argument('--wait-dns', action='store_true')
parser.add_argument('--install-https', action='store_true')
args = parser.parse_args()
password = sys.stdin.readline().strip()
if not password:
    raise SystemExit('SSH password is required on stdin.')
if args.wait_dns:
    deadline = time.monotonic() + 6 * 60 * 60
    while True:
        ready = True
        for resolver in ['1.1.1.1', '8.8.8.8']:
            for domain in ['shabeghahremanan.ir', 'www.shabeghahremanan.ir']:
                try:
                    query = (
                        "$ErrorActionPreference='Stop'; "
                        f"@(Resolve-DnsName '{domain}' -Server '{resolver}' -Type A "
                        "| Where-Object Type -eq 'A' | Select-Object -ExpandProperty IPAddress) "
                        '| ConvertTo-Json -Compress'
                    )
                    result = subprocess.run(
                        ['powershell.exe', '-NoProfile', '-Command', query],
                        capture_output=True, text=True, timeout=20,
                        creationflags=subprocess.CREATE_NO_WINDOW,
                    )
                    result.check_returncode()
                    addresses = json.loads(result.stdout)
                    answers = {addresses} if isinstance(addresses, str) else set(addresses)
                    ready = ready and answers == {'45.156.185.150'}
                except Exception:
                    ready = False
        if ready:
            print('Public DNS resolves both names to the VPS; requesting certificate.', flush=True)
            break
        if time.monotonic() > deadline:
            raise SystemExit('DNS did not propagate within six hours; rerun after propagation.')
        print('Waiting for public DNS propagation.', flush=True)
        time.sleep(60)
client = paramiko.SSHClient()
client.load_system_host_keys()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
try:
    client.connect('45.156.185.150', port=9011, username='root', password=password, timeout=20)
    # Pin the server key fingerprint observed during the original deployment.
    fingerprint = client.get_transport().get_remote_server_key().get_fingerprint().hex()
    if fingerprint != 'a1f925b828da200e26fff2e39b047737':
        raise RuntimeError('SSH server key changed; refusing to continue.')
    client.get_transport().request_port_forward(
        '127.0.0.1', 18888,
        handler=lambda channel, origin, destination: threading.Thread(
            target=relay, args=(channel,), daemon=True,
        ).start(),
    )
    proxy = 'HTTPS_PROXY=http://127.0.0.1:18888 '
    if args.mode == 'check':
        command = proxy + 'curl -fsS --max-time 30 https://acme-v02.api.letsencrypt.org/directory'
    elif args.mode in {'issue', 'issue-dns'}:
        command = proxy + ('certbot certonly --webroot -w /var/www/html '
                           '-d shabeghahremanan.ir -d www.shabeghahremanan.ir '
                           '--non-interactive --agree-tos --register-unsafely-without-email')
        if args.mode == 'issue-dns':
            command = proxy + ('certbot certonly --manual --preferred-challenges dns '
                               '--manual-auth-hook /usr/local/lib/gym/acme-dns-auth.py '
                               '-d shabeghahremanan.ir -d www.shabeghahremanan.ir '
                               '--non-interactive --agree-tos --register-unsafely-without-email')
    else:
        command = proxy + 'certbot renew --dry-run --cert-name shabeghahremanan.ir'
    _, output, errors = client.exec_command(command, timeout=600)
    for line in output:
        print(line, end='', flush=True)
    print(errors.read().decode(), flush=True)
    code = output.channel.recv_exit_status()
    if code:
        raise SystemExit(code)
    if args.install_https:
        sftp = client.open_sftp()
        source = Path(__file__).with_name('nginx-https.conf')
        sftp.put(str(source), '/etc/nginx/sites-available/gym-https')
        sftp.close()
        command = ('set -e; ln -sfn /etc/nginx/sites-available/gym-https /etc/nginx/sites-enabled/gym; '
                   'if ! nginx -t; then ln -sfn /etc/nginx/sites-available/gym /etc/nginx/sites-enabled/gym; exit 1; fi; '
                   'install -d /etc/letsencrypt/renewal-hooks/deploy; '
                   "printf '#!/bin/sh\\nnginx -t && systemctl reload nginx\\n' > /etc/letsencrypt/renewal-hooks/deploy/gym; "
                   'chmod 750 /etc/letsencrypt/renewal-hooks/deploy/gym; systemctl reload nginx; '
                   'systemctl enable --now certbot.timer; '
                   'curl -fsS --resolve shabeghahremanan.ir:443:127.0.0.1 https://shabeghahremanan.ir/api/health')
        _, output, errors = client.exec_command(command, timeout=60)
        print(output.read().decode(), errors.read().decode(), flush=True)
        code = output.channel.recv_exit_status()
        if code:
            raise SystemExit(code)
        print('HTTPS installed and verified; certbot renewal timer enabled.', flush=True)
finally:
    client.close()
