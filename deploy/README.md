# Production deployment

Server: `vm-261265`, Ubuntu 24.04, `45.156.185.150`, SSH port `9011`.
Target domain: `shabeghahremanan.ir` and `www.shabeghahremanan.ir`.

Updated on 2026-11-02 (Asia/Tehran): the Persian magazine at `/blog` and both
original fitness articles are deployed. The release passed architecture, lint,
TypeScript, production build, and all 17 tests against a disposable database.
Six supplied source files were retained exactly. Release provenance and all 27
overlaid file hashes are in `blog-release-manifest.json`; the integration report
is `../BLOG-INTEGRATION-REPORT.md`. No production database migration was needed.

Updated on 2026-10-21: single/family membership cards, all 42 package prices,
package selection and visit registration are deployed. The Linux production build,
TypeScript check and 10 unit tests passed. Internal preflight verified database
health, both membership cards, 15 static assets, unauthenticated admin rejection
and invalid registration rejection. An encrypted database backup was created
before activation. Public HTTPS and the package-to-form flow were verified after
activation; no test registration was written to production.

Verified on 2026-10-14: the homepage and `/api/health` return HTTP 200 from
the public IP. Production build and the isolated PostgreSQL integration test pass.
The application service and daily backup timer are enabled. The first encrypted
backup was decrypted and restored successfully into `gym_restore_check`.
Arvan's free base plan proxies the apex and `www` to origin `45.156.185.150`.
Public DNS returns Arvan edge IPs with an automatic TTL. IRNIC successfully
saved `i.ns.arvancdn.ir` and `x.ns.arvancdn.ir` as the domain's nameservers.
Public DNS now resolves both names correctly. HTTPS was issued using manual DNS
validation and installed successfully on 2026-10-14. HTTP and `www` redirect to
`https://shabeghahremanan.ir`. The certificate expires on 2027-01-12.

Topology: Arvan CDN (HTTPS) → Nginx (HTTPS) → Next.js on `127.0.0.1:3000` → PostgreSQL on localhost.
Next.js runs as the restricted `gymapp` system user under `gym.service`.
Node.js 22 is installed in `/opt/node-v22.23.3-linux-x64`.

## Files and commands

- Current release: `/srv/gym/current` → `/srv/gym/releases/20261101T214835Z-blog-intro`.
- Previous release: `/srv/gym/releases/20261101T212236Z-blog`.
- Release manifest and rollback target: `release-manifest.json` and
  `previous-release.txt` inside the current release directory.
- Production secrets: `/etc/gym/gym.env`, readable only by root and the application group.
- Initial admin credentials: `/root/gym-admin-credentials.txt`, readable only by root.
- Nginx configuration: `/etc/nginx/sites-available/gym`.
- Status: `systemctl status gym nginx postgresql`.
- Application logs: `journalctl -u gym -n 100 --no-pager`.
- Restart: `systemctl restart gym`.
- Health: `curl -fsS http://127.0.0.1:3000/api/health`.

The server cannot currently download from nodejs.org or registry.npmjs.org.
Official Node binaries and npm package tarballs were transferred from the workstation.
Node's SHA-256 was verified against the official release manifest, and npm verifies
package integrity from the lockfile. Future releases may need the same transfer path.

## Domain and HTTPS

The DNS provider, registry and HTTPS configuration are complete.
`nginx-https.conf` serves the apex over HTTPS and redirects HTTP and `www` to it.
Admin sessions and booking ownership cookies require HTTPS.
Arvan proxying is enabled for both the apex and `www` on the free base plan.
Edge HTTPS is enabled with Arvan's managed certificate, HTTP redirects to HTTPS,
and the origin protocol is explicitly HTTPS. Global CDN caching is disabled for
this initial deployment, protecting the admin/API responses from shared caching.
Anonymous `/api/admin/data` requests return 401 with `Cache-Control: no-store`
and `X-Cache: BYPASS` through the CDN.

`/etc/nginx/conf.d/gym-arvan-realip.conf` trusts `ar-real-ip` only from Arvan's
official CIDRs, preserving per-user rate limits. `deploy/arvan-realip.conf` is the
validated 2026-10-14 snapshot of https://www.arvancloud.ir/en/ips.txt. Refresh from
that official feed when Arvan changes its ranges; validate with `nginx -t` before
reloading. Direct untrusted clients cannot replace their source IP using this header.

The VPS also cannot currently reach Let's Encrypt directly. The workstation helper
`certbot-relay.py` exposes an ephemeral SSH-forwarded loopback HTTPS CONNECT relay,
restricted to the production and staging Let's Encrypt endpoints. TLS verification
remains enabled and private keys stay on the VPS. The SSH fingerprint is pinned.
It can wait up to six hours for both public Google and Cloudflare DNS resolvers to
return exactly the VPS address, then issue the certificate and install HTTPS:

```powershell
# Supply the existing SSH password on stdin, without storing it in this file.
python -u deploy/certbot-relay.py --mode issue --wait-dns --install-https
```

On successful installation it enables `certbot.timer` and an Nginx reload hook.
The active certificate uses DNS validation because Let's Encrypt's HTTP challenge
could not reach this VPS from its validation network. The DNS hook publishes the
required name/value into `/root/gym-acme-dns/pending.json` and waits for an operator
to add that TXT record through Arvan and create the exact `.ready` path listed in
the JSON. `--mode issue-dns --install-https` runs this flow through the relay.

The renewal timer alone is insufficient for unattended renewal in this topology:
the VPS cannot currently reach Let's Encrypt and the manual DNS hook needs an
operator. Renew before 2027-01-12 through the workstation relay and DNS validation,
or arrange outbound access plus securely scoped DNS API automation. Do not remove
certificate verification. The current Nginx deploy hook reloads renewed certificates.

## Encrypted backups

`gym-backup.timer` runs daily at 02:30 Asia/Tehran with up to five minutes of jitter.
It retains 14 daily backups and three monthly backups in `/var/backups/gym`.
Encryption uses OpenSSL AES-256-CBC with PBKDF2 (200,000 iterations).
The key is `/etc/gym/backup.key`; store an independent protected copy of the key
and encrypted backups outside this server to survive loss of the VPS.

Manual backup: `systemctl start gym-backup.service`.
Backup logs: `journalctl -u gym-backup.service --no-pager`.

Decrypt into a protected temporary file with:

```sh
umask 077
openssl enc -d -aes-256-cbc -pbkdf2 -iter 200000 \
  -pass file:/etc/gym/backup.key \
  -in /var/backups/gym/gym-YYYY-MM-DD.dump.enc -out /root/gym-restore.dump
```

Restore to a separate empty database using `pg_restore --no-owner --no-acl`.
Validate the restored data before choosing to replace production.

## Isolated management preview

The mirrored site and operational management workspace are deployed at
https://test.shabeghahremanan.ir/ and https://test.shabeghahremanan.ir/admin.
The `gym-test` service listens on loopback port 3102, uses the independent
`gym_stage` database and `/etc/gym/gym-test.env`, and runs releases beneath
`/srv/gym-test/releases`. All test responses disable indexing and caching.
Only the existing administrator identity was copied; customer records and
sessions are independent. See `STAGING-ADMIN-REPORT.md` for the delivered
features, verification, operating limits and certificate maintenance.

`prepare-staging.py` was used for initial provisioning and must not be rerun
against the provisioned environment. `update-staging.py` publishes the listed
source updates, builds and runs the disposable-database suite, then switches
the test symlink atomically. It leaves the production release unchanged and
records the active release and source hashes in `staging-manifest.json`.
`verify-staging.py` checks those hashes and both public health endpoints, and
removes only the specifically identified registration created during browser QA.

The main site's backup timer does not include `gym_stage`. Add a separately
encrypted backup before relying on test records for long-term operations.
The test origin certificate expires on 2027-01-30; its DNS authentication hook
is under `/usr/local/lib/gym-test` and uses `/root/gym-test-acme-dns`.
Renewal currently needs the workstation relay and an operator to update DNS.
