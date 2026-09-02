# chakkritton.com

Personal portfolio, project showcase and blog for **Chakkrit Laolit** — built with
Next.js 16 (App Router), TypeScript, Tailwind CSS v4 and Prisma on Supabase.

Thai and English, light and dark, with a private studio for writing and publishing.

---

## Feature map

| Area | What it does |
| --- | --- |
| **Routes** | `/` (intro) · `/about` (full profile) · `/projects` · `/blog` · `/contact` |
| **i18n** | Thai (default, unprefixed) and English (`/en/…`) via `next-intl`, with `hreflang` + `x-default` |
| **Theming** | Light / dark / system via `next-themes`, driven by CSS custom properties |
| **Studio** | `/studio` — create, edit, publish and delete posts & projects (GitHub OAuth, single-owner allowlist) |
| **Editor** | Editor.js; output JSON is stored verbatim and rendered by the site's own themed components |
| **Reading** | Sticky right-hand table of contents with scroll-spy, anchor links and a progress bar |
| **SEO** | Per-route metadata, dynamic `sitemap.xml`, `robots.txt`, RSS `feed.xml`, JSON-LD, generated OG images |
| **Webring** | Member badge for [วงแหวนเว็บ](https://webring.wonderful.software) in the footer and on the home page |
| **Motion** | Scroll reveals, typewriter, marquee, floating stickers — all disabled under `prefers-reduced-motion` |

---

## Quick start

```bash
npm install
cp .env.example .env     # then fill in the values below
npm run dev              # http://localhost:3000
```

The site **runs immediately without a database** — it falls back to the bundled
sample content in `src/content/seed.ts`. Configure Supabase when you want the
studio to actually persist anything.

---

## Configuration

### 1. Supabase (database + image storage)

1. Create a project at [supabase.com](https://supabase.com) (free tier, no VM needed).
2. **Project Settings → Database → Connection string**, and copy both:
   - **Transaction pooler** (port `6543`) → `DATABASE_URL` — used by the app at runtime
   - **Direct connection** (port `5432`) → `DIRECT_URL` — used by Prisma migrations
     (migrations cannot run through pgbouncer)
3. **Storage → New bucket** → name it `media` and mark it **public**. This is where
   images dropped into the editor are uploaded.
4. **Project Settings → API** → copy the project URL and the `service_role` key.

```bash
npm run db:push     # create the tables
npm run db:seed     # load the sample posts & projects (idempotent)
```

> `service_role` bypasses row-level security. It is only ever read server-side in
> `src/lib/supabase.ts` and must never be exposed to the browser.

### 2. GitHub OAuth (studio login)

**GitHub → Settings → Developer settings → OAuth Apps → New OAuth App**

| Field | Value |
| --- | --- |
| Homepage URL | `http://localhost:3000` (prod: `https://chakkritton.com`) |
| Authorization callback URL | `http://localhost:3000/api/auth/callback/github` |

Then:

```bash
npx auth secret     # writes AUTH_SECRET
```

Set `AUTH_GITHUB_ID`, `AUTH_GITHUB_SECRET`, and:

```bash
STUDIO_GITHUB_LOGINS="ChakkritGit"
```

Only logins on that comma-separated list can sign in. An **empty** list locks the
studio for everyone — it never opens it up. Rejection happens in the `signIn`
callback, so an unauthorised account never receives a session at all.

### 3. Site URL

`NEXT_PUBLIC_SITE_URL` drives canonical URLs, the sitemap, OG tags **and the
webring anchor** (`webring.wonderful.software#<your-domain>`). Set it to
`https://chakkritton.com` in production.

---

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Development server |
| `npm run build` / `start` | Production build / serve |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint |
| `npm run db:push` | Push the Prisma schema to Supabase |
| `npm run db:migrate` | Create a migration (development) |
| `npm run db:deploy` | Apply migrations (production/CI) |
| `npm run db:seed` | Upsert the bundled sample content |
| `npm run db:studio` | Prisma Studio |
| `npm run icons` | Regenerate the favicon / PWA icon set |

---

## Project layout

```
src/
├─ app/
│  ├─ [locale]/            all localised pages + OG image
│  │  ├─ studio/           login (public) + (protected)/ CRUD screens
│  │  └─ …                 about · projects · blog · contact
│  ├─ api/
│  │  ├─ auth/…            Auth.js handlers
│  │  ├─ content/[kind]/   create · update · delete · publish
│  │  └─ upload/           Editor.js image uploads → Supabase Storage
│  ├─ sitemap.ts · robots.ts · manifest.ts · feed.xml/
│  └─ globals.css          design tokens + "sticker" utilities
├─ components/
│  ├─ ui/ motion/ layout/  design system, animation, chrome
│  ├─ content/             block renderer, TOC, cards, rich text
│  └─ studio/              Editor.js integration + editing forms
├─ config/site.ts          ← all personal data lives here
├─ content/seed.ts         bundled sample content (also the DB seed source)
├─ lib/                    content repository, editor helpers, slugs, SEO
├─ i18n/ + messages/       routing config and th/en catalogues
└─ generated/prisma/       Prisma client (git-ignored, built on install)
```

### Where to change things

- **Personal details, links, skills, jobs** → `src/config/site.ts`
- **Any UI copy** → `src/messages/th.json` + `src/messages/en.json` (keys are kept in parity)
- **Colours, spacing, sticker styles** → the token block at the top of `src/app/globals.css`
- **Navigation** → `src/config/nav.ts`

---

## Adding a new module

The content layer is generic on purpose. To add, say, a "talks" section:

1. Add the model to `prisma/schema.prisma` (copy `Post`; keep `content Json`).
2. Add read helpers to `src/lib/content.ts` following `listPosts` / `getPost`.
3. Add a zod schema in `src/lib/studio-schema.ts` and a branch in
   `src/app/api/content/[kind]/route.ts`.
4. Add the route under `src/app/[locale]/` and reuse `ArticleShell` — you get the
   themed renderer, the table of contents and the share bar for free.
5. Add a nav entry in `src/config/nav.ts` and the labels to both message files.

---

## Design notes

The visual language is "clean cartoon": warm paper, 2px ink outlines and hard
offset shadows (the `sticker` / `sticker-sm` / `sticker-lg` utilities), a small
candy accent palette, and generous rounding. Type is **Kanit** for display and
**IBM Plex Sans Thai** for body — both cover Thai and Latin, so the two locales
stay visually identical.

Two details worth knowing:

- **Reading time** counts Thai characters and Latin words separately
  (`src/lib/editor.ts`), because Thai has no word spacing and a naive word count
  would report every Thai article as one minute.
- **Editor.js inline HTML is never injected as raw HTML.** `src/components/content/rich-text.tsx`
  tokenises the allowed subset (bold, italic, marker, inline code, links…) into
  React elements, drops unknown tags and rejects non-`http/mailto/tel` link
  schemes, so stored content cannot execute script.

---

## Deploying

Vercel is the straightforward path:

1. Import the repo.
2. Add every variable from `.env.example` to the project's environment.
3. Update the GitHub OAuth app's callback URL to
   `https://chakkritton.com/api/auth/callback/github`.
4. Run `npm run db:deploy` against the production database.

`postinstall` runs `prisma generate`, so the client is always built for the target
platform.

### Known advisory

`npm audit` reports findings in `mysql2`, which ships inside the **Prisma CLI**
(`devDependencies`). This project uses PostgreSQL, so that code path is never
executed, and the CLI is not part of the deployed bundle.

---

© Chakkrit Laolit. Source layout and tooling are free to reuse; the written
content, résumé and personal imagery are not.
