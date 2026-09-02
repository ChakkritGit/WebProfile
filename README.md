# chakkritton.com

Personal site for **Chakkrit Laolit (จักรกริช เหล่าฤทธิ์)** — portfolio, project write-ups
and a blog, with a private studio for authoring content.

Thai and English, light and dark, Next.js 16 App Router on Supabase Postgres.

---

## Stack

| | |
| --- | --- |
| Framework | Next.js 16.3.4 (App Router, React 19.2) |
| Language | TypeScript 5, `strict` |
| Styling | Tailwind CSS v4 (CSS-variable theming, no config file) |
| i18n | next-intl 4 — Thai at `/`, English at `/en/…`, Japanese at `/ja/…` |
| Database | Supabase Postgres via Prisma 7 (`@prisma/adapter-pg`) |
| Auth | Auth.js v5 (`next-auth@5 beta`) — GitHub, single-owner allowlist |
| Editor | Editor.js 2.31 — header, list, checklist, quote, code (language-aware), table, image, embed, link, warning, alert, colour/highlight, marker, underline, inline-code, delimiter, alignment tune |
| Highlighting | Shiki, rendered on the server with dual light/dark themes |
| Storage | Supabase Storage (public bucket) |
| Animation | `motion` 13 |

---

## Routes

**Public** — Thai unprefixed, English under `/en`, Japanese under `/ja`

```
/                     intro, stats, skills, featured work, latest posts
/about                full profile: experience, education, skills, languages
/projects             searchable + filterable grid, paginated
/projects/[slug]      project detail with sticky table of contents
/blog                 searchable + filterable grid, paginated
/blog/[slug]          article with sticky table of contents
/contact              direct channels + mailto composer
/topics               every tag and technology used across the site
/topics/[tag]         everything sharing one tag
/[...rest]            catch-all → themed 404
```

**Studio** (owner only)

```
/studio/login         GitHub sign-in
/studio               dashboard — tabbed, searchable, filterable, paginated
/studio/posts/new     · /studio/posts/[id]
/studio/projects/new  · /studio/projects/[id]
```

**API**

```
POST   /api/content/[kind]              create   (kind = posts | projects)
PATCH  /api/content/[kind]/[id]         update
DELETE /api/content/[kind]/[id]         delete
POST   /api/content/[kind]/[id]/publish toggle draft ⇄ published
POST   /api/upload                      image upload → Supabase Storage
POST   /api/views                       record one view (public, no identifiers)
GET    /api/link-preview?url=…          OG metadata for the editor's link tool
GET    /api/tags · POST · DELETE        master tag vocabulary
       /api/auth/[...nextauth]          Auth.js handlers
```

**Generated** — `sitemap.xml` (with hreflang alternates), `robots.txt`,
`feed.xml` (RSS), `manifest.webmanifest`, per-page OpenGraph images.

---

## Quick start

```bash
npm install
cp .env.example .env    # fill in the values below
npm run dev             # http://localhost:3000
```

The site **runs without a database** — reads fall back to the bundled sample
content in `src/content/seed.ts`, so a fresh clone renders immediately. Configure
Supabase when you want the studio to persist anything.

---

## Configuration

### 1 · Supabase

Create a project at [supabase.com](https://supabase.com) (free tier, no VM required).

**Project Settings → Database → Connection string.** Copy both:

```bash
# Transaction pooler, port 6543 — the app at runtime
DATABASE_URL="postgresql://postgres.<ref>:<password>@aws-0-<region>.pooler.supabase.com:6543/postgres?pgbouncer=true"
# Session pooler, port 5432 — Prisma migrations (they cannot run through pgbouncer)
DIRECT_URL="postgresql://postgres.<ref>:<password>@aws-0-<region>.pooler.supabase.com:5432/postgres"
```

> Do **not** use the legacy `db.<ref>.supabase.co` host — Supabase moved direct
> connections to IPv6-only and it no longer resolves on most networks. The
> pooler hostnames above are the working path.

**Storage → New bucket** → name it `media`, mark it **public**. Editor images and
cover uploads land there.

**Project Settings → API keys** → copy the **secret** key (`sb_secret_…`), not the
publishable one. The publishable key is blocked by row-level security and uploads
will fail with `new row violates row-level security policy`.

```bash
npm run db:push     # create the tables
npm run db:seed     # load the sample content (idempotent upsert)
```

### 2 · GitHub sign-in

Either an **OAuth App** or a **GitHub App** works — Auth.js uses the same
`/login/oauth/*` endpoints for both.

- OAuth App: *Settings → Developer settings → OAuth Apps*
- GitHub App: *Settings → Developer settings → GitHub Apps* → set **Callback URL**
  under *General → Identifying and authorizing users*

Callback URL:

```
http://localhost:3000/api/auth/callback/github      # development
https://chakkritton.com/api/auth/callback/github    # production
```

Use the **Client ID** (`Iv23li…` for a GitHub App), *not* the numeric App ID.

```bash
npx auth secret     # writes AUTH_SECRET
```

> A GitHub App ignores the `scope` parameter — permissions come from the App's
> own settings. That is fine here: access is gated on `profile.login` only, and
> the email is never read.

### 3 · Environment

```bash
NEXT_PUBLIC_SITE_URL="https://chakkritton.com"   # canonical URLs, sitemap, OG, webring anchor

DATABASE_URL=""                 # Supabase transaction pooler (6543)
DIRECT_URL=""                   # Supabase session pooler (5432)

NEXT_PUBLIC_SUPABASE_URL=""     # https://<ref>.supabase.co
SUPABASE_SERVICE_ROLE_KEY=""    # sb_secret_… — server-only, never expose
SUPABASE_STORAGE_BUCKET="media"

AUTH_SECRET=""
AUTH_GITHUB_ID=""               # Client ID
AUTH_GITHUB_SECRET=""
STUDIO_GITHUB_LOGINS="ChakkritGit"   # comma-separated allowlist
```

`STUDIO_GITHUB_LOGINS` is a strict allowlist. **An empty value locks the studio
for everyone rather than opening it up** — rejection happens in the `signIn`
callback, so a disallowed account never receives a session at all.

---

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Development server |
| `npm run build` · `start` | Production build / serve |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint |
| `npm run db:push` | Push the schema to Supabase (no migration files) |
| `npm run db:migrate` | Create a migration (development) |
| `npm run db:deploy` | Apply migrations (production / CI) |
| `npm run db:seed` | Upsert the bundled sample content |
| `npm run db:studio` | Prisma Studio |
| `npm run icons` | Regenerate the favicon / PWA icon set |

---

## Layout

```
prisma/schema.prisma        Post, Project (Editor.js JSON in `content`, `views`) + Tag vocabulary
prisma/seed.ts              upserts src/content/seed.ts into Supabase
src/
├─ app/
│  ├─ [locale]/             every page, plus per-route opengraph-image
│  │  ├─ studio/            login (public) + (protected)/ CRUD screens
│  │  └─ [...rest]/         catch-all so unmatched URLs hit the themed 404
│  ├─ api/                  auth · content CRUD · upload
│  ├─ sitemap.ts · robots.ts · manifest.ts · feed.xml/
│  ├─ icon.svg              source of the favicon + OG mark
│  └─ globals.css           design tokens + sticker/star-grid utilities
├─ components/
│  ├─ ui/                   button, dialog, select, badge, sticker card, decor
│  ├─ motion/               scroll reveals, typewriter, marquee
│  ├─ layout/               header, footer, theme + locale toggles, webring
│  ├─ content/              block renderer, TOC, cards, search, pagination
│  ├─ studio/               Editor.js integration, forms, content manager
│  └─ brand/                logo mark, cartoon avatar (unused, kept for reuse)
├─ config/site.ts           ← all personal data lives here
├─ content/seed.ts          bundled sample content (also the DB seed source)
├─ lib/                     content repo, editor helpers, slugs, SEO, search
├─ i18n/ + messages/        routing config and th/en/ja catalogues (kept in parity)
└─ generated/prisma/        Prisma client — git-ignored, built by `postinstall`
```

### Where to change things

- **Personal details, links, skills, jobs** → `src/config/site.ts`
- **Any UI copy** → `src/messages/{th,en,ja}.json` (all three kept key-for-key in parity)
- **Colours, spacing, sticker styles** → the token block atop `src/app/globals.css`
- **Navigation** → `src/config/nav.ts`
- **Items per page** → `PER_PAGE` in `src/components/studio/content-manager.tsx` (8)
  and in `src/app/[locale]/{blog,projects}/page.tsx` (9)

---

## Notes worth knowing

**Drafts.** Save and Publish are separate. Saving keeps `status: DRAFT` however many
times you press it; drafts never appear on public pages, in the sitemap or in the
RSS feed. Unpublishing preserves the original `publishedAt` so re-publishing does
not reset the date.

**Japanese is a UI translation, not a content one.** All 261 interface strings are
translated, but articles and projects are written in Thai and English only, so
`contentLocaleFor()` (`src/i18n/routing.ts`) maps `ja` onto the English corpus.
Without that the Japanese site would render a complete interface around empty
lists.

**Technology marks are drawn, not fetched.** `src/components/brand/tech-icons.tsx`
holds simplified geometric versions of each logo — legible at 14px, no licensing
or network fetch, and the officially monochrome ones use `currentColor` so they
invert with the theme. Unknown names simply render no icon.

**Code is highlighted on the server.** `src/lib/highlight.ts` runs Shiki during
render, so no highlighter ships to the browser. It emits `--shiki-light` /
`--shiki-dark` custom properties rather than baking one theme in, so the page's
own theme toggle drives the colours. The language list is curated — importing
`codeToHtml` from the shiki entrypoint would pull in every grammar and theme.

**Views are a popularity signal, not analytics.** `/api/views` increments a
counter on published records only; nothing identifying is stored. The client
sends it once per session per item after a 1.5s dwell, so reloads don't inflate
it. The home page's "most read" strip mixes posts and projects, ranked by count,
and hides anything never opened.

**Two StrictMode traps, same shape.** React runs effects twice in development. In
both `editor-core.tsx` and `view-tracker.tsx` the first pass claimed a resource
and its cleanup undid the pending work, leaving the second pass with nothing to
do — a blank editor and a view that never counted. Both now commit the guard at
the moment the work actually happens, not when the effect starts.

**Route params arrive percent-encoded.** A Thai slug reaches the page as
`%E0%B8%97…` and never matches the stored value, so every dynamic route decodes
via `decodeParam()` (`src/lib/slug.ts`). Seed content uses ASCII slugs, which is
why this stayed hidden until real Thai titles were written.

**Tags are a shared vocabulary.** The `Tag` table backs the pickers in the studio;
posts and projects still store a denormalised `tags` array for querying. Typing a
name that doesn't exist offers to add it, so the next form already knows it. The
old comma-separated field silently created a new tag on every typo.

**The link tool needs `/api/link-preview`.** Editor.js can't resolve a page title
itself — without an endpoint it only reports "Couldn't get this link data". The
route is owner-gated, restricted to `http(s)` and refuses loopback/private hosts
so it can't be used to probe internal addresses.

**Editor.js content is never injected as raw HTML.** `src/components/content/rich-text.tsx`
tokenises the inline subset the editor produces (bold, italic, marker, inline
code, links, colours) into React elements, drops unknown tags and rejects any link
scheme outside `http(s)` / `mailto` / `tel`. Inline colours are copied through only
when the value is a literal hex/rgb/hsl triple, so a `style` attribute can't smuggle
in `url()`, `expression()` or another property. Stored content cannot execute script.

**Reading time counts Thai characters and Latin words separately**
(`src/lib/editor.ts`). Thai has no word spacing, so a naive word count reports
every Thai article as one minute.

**The résumé opens inline.** A download makes a visitor commit to a file before
knowing whether it's worth reading. `ResumeButton` previews the PDF in a modal,
with download still one click away — and falls back to the browser's own viewer
on small screens, where iframed PDFs don't render.

**Filters keep your place.** Searching, tag filtering and paging use
`scroll: false` plus `pinScroll()` (`src/lib/pin-scroll.ts`), which re-asserts the
scroll position for a few frames — Next resets scroll on navigation and the
browser re-anchors on its own. A deliberate wheel or touch cancels the pin.

**Editor.js lifecycle.** Creation and teardown are serialised in
`src/components/studio/editor-core.tsx`. Without that, React StrictMode's double
mount lets the first instance's async `destroy()` land after the second has
rendered, wiping the editor DOM — a blank canvas with no error anywhere.

**An empty query result is a real answer.** Seed content is a fallback only for an
*unavailable* database. An earlier version fell back whenever a query returned zero
rows, which meant "nothing is featured" and "that slug was deleted" both resurrected
sample content over live data.

**Language switch scrolls to the top.** Restoring the exact reading position across
languages is not achievable: the translations differ in length, so any restored
offset drops the reader into a different section. One predictable jump beats a
drifting viewport.

**`scroll-behavior: smooth` is deliberately not set globally.** Next resets scroll on
every navigation, and a global smooth rule turns that reset into a long visible
scroll animation. The table of contents and back-to-top request smoothing per call.

---

## Deploying

1. Import the repo on Vercel.
2. Add every variable from `.env.example` to the project environment.
3. Add the production callback URL to the GitHub App/OAuth App.
4. Run `npm run db:deploy` against the production database.

`postinstall` runs `prisma generate`, so the client is always built for the target
platform.

### Known advisory

`npm audit` reports findings in `mysql2`, a transitive dependency of the **Prisma
CLI** (`devDependencies`). This project uses PostgreSQL, so that code path never
executes, and the CLI is not part of the deployed bundle.

---

## Webring

This site is a member of [วงแหวนเว็บ](https://webring.wonderful.software) — a ring of
personal sites by Thai artists, designers and developers. The badge in the footer
links to `webring.wonderful.software#<domain>`, where the domain is derived from
`NEXT_PUBLIC_SITE_URL`.

---

© Chakkrit Laolit. The written content, résumé and personal imagery are not
licensed for reuse.
