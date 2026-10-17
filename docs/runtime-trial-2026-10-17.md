# Portfolio Bun and Elysia trial — 2026-10-17

Portfolio keeps Next.js 16.3.8 for rendering and runs its standalone production server on Bun 1.4.2.
The public search and database-health APIs use Elysia 1.4.30 inside Next.js Route Handlers. Studio
authentication, content writes and uploads retain their existing handlers. The build uses Node.js
24.21.0; only Portfolio selects the Bun runtime target in the shared deployment repository.

## Controlled origin measurements

Tested the production code at `0495494`, then the Elysia change, on the same VPS. Temporary containers
had the same application environment, database and limits (one CPU, 384 MB), with equal warm-up.
The original Bun control reused the Node image with the pinned Bun binary added; the Elysia
variants used the same compiled app with separate Node and Bun runtime image targets.
Requests went directly to the private container address, without Cloudflare or TLS. Each table entry
contains 180 GET requests at concurrency 2, split into three rounds with reversed runtime order.

| Variant | Home p50 / p95 (ms) | Blog p50 / p95 (ms) | Search API p50 / p95 (ms) | Health API p50 / p95 (ms) |
| --- | --- | --- | --- | --- |
| Node.js, original API | 21.79 / 64.73 | 123.25 / 293.97 | 19.91 / 88.90 | 7.94 / 64.82 |
| Bun, original API | 13.73 / 43.54 | 125.90 / 280.26 | 27.49 / 94.78 | 8.50 / 35.67 |
| Node.js, Elysia API | 22.79 / 64.71 | 116.95 / 281.20 | 20.91 / 97.19 | 8.24 / 75.72 |
| Bun, Elysia API | 15.57 / 48.74 | 115.77 / 255.75 | 16.95 / 83.61 | 10.12 / 30.55 |

Paths: `/en`, `/en/blog?q=runtime-trial`, `/api/search?locale=en`, `/api/health`.

| Variant | Median sampled working memory (MiB) | Working memory after idle (MiB) | Highest sampled working memory (MiB) | CPU time for all 720 requests (ms) |
| --- | --- | --- | --- | --- |
| Node.js, original API | 125.1 | 125.0 | 139.3 | 20058.9 |
| Bun, original API | 241.7 | 237.7 | 259.5 | 19098.2 |
| Node.js, Elysia API | 130.2 | 112.0 | 140.4 | 19791.5 |
| Bun, Elysia API | 238.8 | 234.5 | 260.5 | 18747.6 |

Working memory is the cgroup charge minus inactive file cache. Samples cover the request rounds and
a 15-second idle interval. These are samples, not a continuous peak-memory trace. Long-running
production memory can differ from freshly started test containers.

In this run, Bun + Elysia reduced median home, blog and search latency by about 29%, 6% and 15%
respectively, compared with the original Node.js server. Health-check median latency increased.
Total CPU time fell by about 7%, while working memory increased by roughly 114 MiB. An earlier
Node/Bun-only run gave a different search result, so the API measurements should not be treated as
a repeatable speed multiplier. Adding Elysia alone did not give a consistent improvement.

This measures origin response latency under a small controlled load. It does not measure browser
LCP, public-network latency, a sustained traffic peak or a long-running memory leak. Keep the rollout
limited to Portfolio and observe it under normal traffic before considering other applications.

## Validation before rollout

- 24 unit tests passed on Node.js and 24 on Bun, including locale fallback, duplicate query values,
  index ordering and shape, cache headers, HEAD, database health and non-disclosure of internal errors.
- TypeScript, ESLint on changed files and the standalone production build passed. Both Node and Bun
  candidate images were built from the same output.
- Read-only checks passed in all four variants for all three search locales, invalid-locale fallback,
  existing view reads, Auth.js session reads, unauthorized studio API access, public pages, studio login,
  sitemap, LLM index, 404s and native share-image rendering.
- The search response bodies matched byte-for-byte. The Elysia routes retained their cache headers
  and HEAD behavior. Search still returned the published corpus rather than an empty fallback.
- Authenticated studio rendering and tag reads passed with a synthetic session signed using a random
  secret and allowlist used only by the isolated trial containers. The real GitHub OAuth login flow
  was not exercised. No production session credential was used.
- Trial containers were outside the public proxy and removed after checking. No analytics events,
  view increments, content writes, notifications, schema changes or extra weather forecasts were sent.

Dependency pins: Bun 1.4.2 (2026-09-05), Elysia 1.4.30 (2026-08-26), file-type 22.1.1 (2026-09-17),
and the strtok3 10.3.5 override (2026-03-21). New lockfile packages were checked against the 14-day
minimum age rule; existing dependency versions were retained.
