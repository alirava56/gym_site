# CHAMPIONS NIGHT — Persian blog integration

## Scope and audit

- Audited the existing Next.js 16.3.4 App Router project, local Next.js guides, global CSS, Vazirmatn fonts, shared UI, navigation, footer, booking dialogs, metadata, robots, sitemap and VPS deployment configuration before implementation.
- The existing live origin is `https://shabeghahremanan.ir`. The site runs as `gym.service` behind Nginx and Arvan CDN, with PostgreSQL persistence.
- The original navigation used homepage-only buttons. Navigation now exposes crawlable links, retains homepage interactions and reaches the appropriate homepage section from articles.
- Existing uncommitted work was preserved. Deployment uses an overlay of this task's 27 application/content/test/image files on a copy of the current production release. Seven modified existing files were compared with their production baselines; differences belong to this integration.
- Read and extracted all six ZIP entries. All six extracted files were verified byte-for-byte against the supplied ZIP. Instructions in the publication documents were treated as source guidance, not additional user authorization or a replacement for the requested task.

## Pages and behavior

- `/blog`: responsive Persian RTL magazine listing using the existing black/gold theme, local fonts, logos, header, mobile menu and footer.
- `/blog/beginner-workout-plan-3-days`: complete original beginner article, four tables, FAQs, sources and related article navigation.
- `/blog/fat-loss-without-muscle-loss`: complete original fat-loss article, two tables, FAQs, sources and related article navigation.
- Each article has exactly one H1, logical H2/H3 headings, an accessible table of contents, keyboard-focusable table scroll regions, table captions and column/row headers.
- Articles are statically generated with all text in initial HTML. Unknown slugs return 404. Raw Markdown HTML is never executed, and link protocols are restricted.
- Booking CTAs reach `/#trainers-section`; membership CTAs reach `/#plans-section`. Both use the actual homepage experience. Cross-page links also support the existing dashboard and virtual tour.
- The homepage links directly to both articles and the magazine. Desktop/mobile navigation and the shared footer include the magazine.

## SEO and images

- Unique supplied title/description per article, production canonical URL, article Open Graph, Twitter large-image cards, BlogPosting and BreadcrumbList JSON-LD.
- The listing includes Blog and BreadcrumbList JSON-LD. Sitemap includes the homepage, listing and both articles; existing robots rules allow crawling them.
- JSON-LD escapes `<` before insertion. No FAQ rich-result markup, fabricated author, reviewer, credentials, dates, testimonials or new scientific claims were added.
- Original article text and editorial notes remain intact. No author or publication date was supplied; those optional schema fields are omitted instead of guessed. Google documents these as recommended fields, without required Article properties: https://developers.google.com/search/docs/appearance/structured-data/article
- The ZIP contains no cover photographs. Existing gym photographs were resized to 1200 × 630 WebP (100,812 and 91,046 bytes), with factual alt text describing the actual rooms. Display images use Next Image responsive optimization, reserved dimensions and eager loading for article covers.
- Scientific references were checked against the linked ACSM/PubMed, WHO, CDC and ISSN records. This is source verification, not a claim that a trainer, doctor or nutritionist has personally reviewed either article.

## Changed files

Existing files modified:

- `src/app/globals.css`
- `src/app/layout.tsx`
- `src/app/page.tsx`
- `src/app/sitemap.ts`
- `src/components/experience/experience-provider.tsx`
- `src/components/layout/site-header.tsx`
- `src/components/layout/site-footer.tsx`

New application and test files:

- `src/app/blog/layout.tsx`
- `src/app/blog/page.tsx`
- `src/app/blog/[slug]/page.tsx`
- `src/app/blog/not-found.tsx`
- `src/app/blog/blog.css`
- `src/components/blog/article-content.tsx`
- `src/components/blog/blog-components.tsx`
- `src/components/sections/blog-preview-section.tsx`
- `src/lib/blog.ts`
- `src/lib/blog-markdown.ts`
- `src/shared/site.ts`
- `tests/blog.test.ts`

New images and unchanged source copies:

- `public/images/blog/beginner-workout-plan-3-days.webp`
- `public/images/blog/fat-loss-without-muscle-loss.webp`
- `content/blog/source/seo-brief.json`
- `content/blog/source/README-SEO.md`
- `content/blog/source/PUBLISH-CHECKLIST.md`
- `content/blog/source/articles/01-beginner-workout-plan-3-days.md`
- `content/blog/source/articles/02-fat-loss-without-muscle-loss.md`
- `content/blog/source/implementation/next-app-router-seo-example.tsx`
- This report, `BLOG-INTEGRATION-REPORT.md`, is a local handoff document.
- `deploy/README.md` records the active blog release and rollback target.
- `deploy/blog-release-manifest.json` records the deployed application/content/test/image hashes and validation results.

The tracked TypeScript incremental cache was also regenerated by the required typecheck. Package dependencies and lockfile were not changed by this task.

## Completed checks

- `npm run check`: architecture boundaries, ESLint, TypeScript, tests and production build passed locally; ESLint produced zero warnings.
- Local tests: 14 passed, 3 database-dependent tests skipped because no disposable local PostgreSQL instance was configured.
- Added tests verify exact source hashes, complete text/table/list/FAQ preservation, canonical/schema/sitemap/cross-link consistency, rejection of unknown/path-traversal slugs and unsafe Markdown link protocols.
- HTTP checks: both articles and listing return 200; initial HTML includes article text; canonical, Open Graph, Twitter, JSON-LD, CTAs, table counts and optimized image endpoints passed; sitemap and robots return 200.
- Browser QA: magazine and both articles inspected on mobile and desktop; no horizontal page overflow at inspected 390, 1024 and 1440 widths; tables scroll independently; TOC links reach headings below the sticky header; article CTA reaches trainer cards and opens the existing reservation dialog.

## Server validation and publication

- Published on 2026-11-02 (Asia/Tehran). Active release: `/srv/gym/releases/20261101T212236Z-blog`. Previous/rollback release: `/srv/gym/releases/20261021-membership`.
- The isolated Linux release passed architecture checks, ESLint, TypeScript and production build. The full test suite then passed **17/17, zero skipped**, including opt-in membership persistence, admin session/credential lifecycle and booking concurrency/ownership tests, against a newly created disposable database. The database was removed after validation.
- Preflight verified the homepage, magazine, both articles, sitemap, robots, database health and all linked CSS/JS static assets on loopback before activation, then repeated those checks after activation.
- An encrypted backup was created using the existing backup service before the current-release symlink was switched and `gym.service` restarted. Gym, Nginx and PostgreSQL are active. The preflight service was stopped.
- Public HTTPS checks passed: listing/articles/sitemap/robots/health return 200; an unknown article returns 404; anonymous admin data remains 401; both cover image optimization endpoints return valid images.
- Public browser QA confirmed the magazine, article navigation, desktop/mobile menus, dashboard access from the magazine, logo return from dashboard, and article → trainer → reservation dialog flow. The real four available time ranges loaded from the production database. No production reservation or membership was created by verification.
- Screenshots are saved locally in `out/blog-verification/live-blog-desktop.jpg` and `out/blog-verification/live-article-mobile.jpg`.

## Remaining considerations and future deployment requirements

- A named professional content review has not been provided. The original educational/editorial notes remain visible; no professional approval is claimed.
- Google indexing, rankings, rich-result display and Search Console processing cannot be guaranteed by deployment. Submit/inspect the sitemap and article URLs using the owner's Search Console account after publication. No Search Console or analytics account was modified.
- The small Markdown renderer supports the syntax in the supplied articles. Adding different Markdown features requires extending the renderer and its preservation test or adopting a maintained Markdown library.
- Future builds must include `content/blog/source/articles` in the release and keep it available during build. No new npm dependency, database migration or environment variable is required for the blog.
- The blog is already published; no further deployment step or DNS change is required for this delivery.
- Production retains its existing PostgreSQL and admin environment configuration. Do not run database-changing tests against the production database; use a disposable database ending in `_test` and run integration files serially.
- Future publication should build in a separate release, validate it on loopback, preserve a rollback target, create the existing encrypted database backup, switch `/srv/gym/current`, restart `gym.service` and verify public HTTPS, articles, assets and booking availability.
- The existing deployment documentation reports manual certificate renewal before 2027-01-12. That pre-existing operational requirement was not changed by this work.

## Requested UI follow-up — 2026-11-02

Removed the book icon and the introductory tagline above the blog listing title. Only `src/app/blog/page.tsx` and `src/app/blog/blog.css` changed in the application. Targeted lint, TypeScript and production build passed. The change was built in an isolated release, validated on loopback, activated and checked again. Active release: `/srv/gym/releases/20261101T214835Z-blog-intro`; rollback: `/srv/gym/releases/20261101T212236Z-blog`. The earlier integration validation above remains the record for the original publication.
