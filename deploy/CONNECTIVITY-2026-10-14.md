# Connectivity investigation — 2026-10-14

## Verified observations

- The apex and `www` resolve to `45.156.185.150`; no AAAA record is configured.
- Both names present a valid Let's Encrypt certificate covering both hostnames,
  valid from 2026-10-14 12:19:16 UTC to 2027-01-12 12:19:15 UTC.
- The complete certificate chain is served, ending in the cross-sign from ISRG
  Root X1. Verified TLS 1.2 and TLS 1.3 handshakes both succeed locally.
- HTTP and HTTPS `www` redirect to `https://shabeghahremanan.ir/`.
- Twelve independent local HTTPS requests succeeded (164–391 ms).
- Twelve DNS queries across Cloudflare, Google and both authoritative Arvan
  nameservers returned the correct origin IP.
- All twelve JavaScript/CSS assets referenced by the homepage returned HTTP 200.
  No HTTP asset URLs or browser console errors were found in the inspected page.
- The application has no automatic restarts, no recent OOM events, and ample free
  memory. Host firewall policies permit traffic.

## Confirmed network difference

Globalping measurement: `2Z4vTGeFKMnq2inQn00021Jcj`.
Results: https://api.globalping.io/v1/measurements/2Z4vTGeFKMnq2inQn00021Jcj

| Probe | DNS | TCP/TLS/HTTP |
| --- | --- | --- |
| Tehran, Arvan, AS202468 | Correct origin IP | Valid TLS, HTTP 200, 29 ms total |
| Falkenstein, Hetzner, AS24940 | Correct origin IP | TCP connection timed out after 15 s |
| Buffalo, HostPapa, AS36352 | Correct origin IP | TCP connection timed out after 15 s |

These observations confirm a network-path reachability problem to the origin
from the tested foreign networks. They do not establish the exact cause on the
affected laptops or prove that every external network is blocked. The provider's
upstream filtering/routing cannot be diagnosed solely from these measurements.

The reported browser "Not secure" warning has not been reproduced on the secure
domain. Its exact URL/error code on an affected laptop is still unknown. The
certificate does not cover the bare origin IP, so an HTTPS bookmark to the IP
would fail hostname verification; that remains a possibility, not a confirmed
explanation for the user's report.

## Prepared mitigation

Arvan already has a valid managed edge certificate. Edge HTTPS and the CDN proxy
were disabled at inspection time. Proposed change: enable HTTPS on both hops,
redirect HTTP to HTTPS, and proxy both apex and `www` through Arvan. Bypass caching
for admin/API traffic and verify real client IP forwarding using only official
Arvan network ranges. Re-run local and geographically distributed measurements
before declaring the reachability issue resolved.

Official real-IP integration: https://github.com/arvancloud/ar-ngxrealip
Validated current IP feed: https://www.arvancloud.ir/en/ips.txt

Raw diagnostic output is saved in the Git-ignored `data/deployment-proof/` folder.

## Applied mitigation and verification

The user approved CDN activation and traffic forwarding through Arvan. Enabled
the proxy for apex and `www`, edge HTTPS with the existing managed certificate,
HTTP-to-HTTPS redirection, and explicit HTTPS to the origin. Installed the official
Arvan real-IP trust ranges in Nginx and validated/reloaded the configuration.
Global CDN caching is disabled; anonymous admin data requests consistently return
401 with `Cache-Control: no-store` and `X-Cache: BYPASS`. The existing authenticated
admin session was restored successfully through the CDN in the browser.

After-change measurement: `2bqDESnMgJCMDsCB300021Jd4`.
Results: https://api.globalping.io/v1/measurements/2bqDESnMgJCMDsCB300021Jd4

| Probe | HTTPS response | Certificate validation | Total |
| --- | --- | --- | --- |
| Tehran, Arvan | 200 | Valid | 35 ms |
| Falkenstein, Hetzner | 200 | Valid | 332 ms |
| Buffalo, HostPapa | 200 | Valid | 997 ms |

All three resolved the Arvan edge address `185.143.233.132`. The public domain
now resolves to `185.143.233.132` and `185.143.234.132`; the origin remains
`45.156.185.150`. This resolves the reachability failure on the tested paths.
It does not retroactively identify the exact warning seen on an uninspected laptop.
