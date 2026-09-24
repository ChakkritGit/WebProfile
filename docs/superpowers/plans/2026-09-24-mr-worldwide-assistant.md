# Mr. Worldwide Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Put Mr. Worldwide — a walking, warping hologram globe — on every public page of chakkritton.com, and let visitors ask him about the site's projects and articles through a Cloudflare Worker running Qwen 3 on Workers AI.

**Architecture:** The portfolio (Next.js on Vercel) publishes a compact content index (`/ai/index.json`) and per-item text (`/ai/item/…/{slug}.txt`). A Cloudflare Worker on the zone route `chakkritton.com/api/assistant*` ranks items for a question, prompts `@cf/qwen/qwen3-30b-a3b-fp8`, and streams the answer back as Server-Sent Events. On the page, a lazily loaded three.js engine (ported from the approved prototype) draws the character on a fixed strip at the bottom of the viewport, and a native `<dialog>` is the hologram screen he talks through.

**Tech Stack:** Next.js 16 (App Router), React 19, TypeScript, three.js, Cloudflare Workers + Workers AI + Rate Limiting binding, Wrangler 4, `node:test` via `npx tsx --test`, Playwright (library) for browser checks.

**Spec:** `docs/superpowers/specs/2026-09-24-mr-worldwide-assistant-design.md`
**Visual reference (the character's source code):** `docs/superpowers/prototypes/mr-worldwide/index.html` (v18). Tasks 7–8 port it; line numbers below refer to that file.

## Global Constraints

- Model: `@cf/qwen/qwen3-30b-a3b-fp8`, `max_tokens: 400`, streamed; `/no_think` appended to the last user message.
- Request body: `{ messages: [{ role: 'user' | 'assistant', content }], lang: 'th' | 'en' }`; last 8 messages, each ≤ 1,000 characters.
- Rate limit: 8 requests per IP per 60 seconds (Workers Rate Limiting binding).
- Allowed origins: `ALLOWED_ORIGINS` var; production `https://chakkritton.com`.
- Error codes: `rate_limited` (+ `retryAfter` seconds), `quota`, `upstream`, `bad_request`.
- Item ids: `${kind}:${locale}:${slug}` with `kind` `post` | `project`, `locale` `th` | `en`.
- Colour: body amber `#FF8A3D`; hologram opacity 0.78.
- Tests follow the repo pattern: `node:test` + `node:assert/strict`, run with `npx tsx --test <file>`; a `// Run:` comment on the first line.
- Code style: single quotes, no semicolons, 2-space indent, width ~120 (Prettier flags: `--single-quote --no-semi --print-width 120`).
- Never modify `src/proxy.ts`. Commit to `main` per task; push only where a task says so.
- The character never blocks clicks on the page; no layout shift; nothing of it in the first load.
- Not rendered under `/studio`. Reduced motion: no walking, no warping.

## Review Focus

1. **A reply that mentions `CARDS:` in normal prose, or a `CARDS` line split across stream chunks** — the text must not lose words and the ids must still be parsed. Pinned in Task 3 (`reply filter` tests: split line, inline word).
2. **Thai questions with no spaces** ("อยากดูโปรเจคไวท์บอร์ด") — must still find the Thai item. Pinned in Task 2 (`rank` Thai test).
3. **The model naming an item that does not exist** — no card, no broken link. Pinned in Task 4 (`toClientStream` drops unknown ids).
4. **Clicking a link that sits under the character's strip while he is elsewhere** — the click must reach the link. Pinned in Task 11 (Playwright: link under the strip is clickable).
5. **A second message sent while the first is still streaming** — the first is cancelled; no interleaved text. Pinned in Task 6 (`useAssistant` aborts the previous request; test on `ask` with an aborted signal).

---

## File map

Portfolio (Next.js):
- Create `src/lib/ai-index.ts` — pure: records → `AiItem[]`. Test `src/lib/ai-index.test.ts`.
- Create `src/app/ai/index.json/route.ts` — the index endpoint.
- Create `src/app/ai/item/[kind]/[locale]/[slug]/route.ts` — one item's text.
- Create `src/lib/assistant-client.ts` — SSE parser + `ask()`. Test `src/lib/assistant-client.test.ts`.
- Create `src/components/assistant/use-assistant.ts` — conversation state, sessionStorage.
- Create `src/components/assistant/engine/shaders.ts`, `figure.ts`, `motion.ts`, `engine.ts` — the character.
- Create `src/assets/ai/land.png` — world land mask (copied from the prototype).
- Create `src/components/assistant/mr-worldwide.tsx` — idle-loaded mount.
- Create `src/components/assistant/stage.tsx` — canvas, pointer routing, fallback, chat host.
- Create `src/components/assistant/hologram-chat.tsx` — the dialog.
- Modify `src/app/[locale]/layout.tsx` — mount `<MrWorldwide />`.
- Modify `src/app/globals.css` — hologram screen styles.
- Modify `src/messages/{th,en,ja}.json` — `assistant` namespace.
- Modify `tsconfig.json`, `eslint.config.mjs` — exclude `worker/`.
- Create `scripts/check-assistant.mjs` — Playwright checks.

Worker (`worker/`, its own package):
- `package.json`, `tsconfig.json`, `wrangler.toml`
- `src/types.ts` — `Item`, `Msg`, `Env`.
- `src/rank.ts` + `test/rank.test.ts`
- `src/prompt.ts` + `test/prompt.test.ts`
- `src/filter.ts` + `test/filter.test.ts`
- `src/stream.ts` + `test/stream.test.ts`
- `src/index.ts` (handler) + `test/handler.test.ts`

---

### Task 1: Content index endpoints

**Files:**
- Create: `src/lib/ai-index.ts`, `src/lib/ai-index.test.ts`, `src/app/ai/index.json/route.ts`, `src/app/ai/item/[kind]/[locale]/[slug]/route.ts`

**Interfaces:**
- Consumes: `listPosts`, `listProjects`, `getPost`, `getProject` (`src/lib/content.ts`), `documentToText` (`src/lib/editor.ts`), `absoluteUrl` (`src/lib/seo.ts`), `decodeParam` (`src/lib/slug.ts`), `PostRecord`/`ProjectRecord` (`src/lib/content-types.ts`; both have `readingMinutes`, `coverImage`, `status`, `locale`).
- Produces: `interface AiItem { id; kind: 'post'|'project'; locale: 'th'|'en'; slug; url; title; summary; tags: string[]; stack: string[]; minutes: number; cover: string|null }`, `toAiItems(posts, projects): AiItem[]`; `GET /ai/index.json` → `{ items: AiItem[] }`; `GET /ai/item/{kind}/{locale}/{slug}.txt` → `text/plain`.

- [ ] **Step 1: Write the failing test** — `src/lib/ai-index.test.ts`

```ts
// Run: npx tsx --test src/lib/ai-index.test.ts
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { toAiItems } from './ai-index'

const base = {
  translationKey: null, coverImage: null, content: { time: 0, blocks: [], version: '2' }, featured: false,
  publishedAt: '2026-09-01T00:00:00Z', updatedAt: '2026-09-01T00:00:00Z', views: 0, readingMinutes: 3,
}
const post = (over: object) => ({ ...base, id: 'p', slug: 'hello', locale: 'th', title: 'สวัสดี', summary: 's', tags: ['AI'], status: 'PUBLISHED', ...over })
const project = (over: object) => ({ ...post({}), role: null, stack: ['Next.js'], year: 2026, liveUrl: null, repoUrl: null, sortOrder: 0, ...over })

test('published posts and projects become items with ids and page urls', () => {
  const items = toAiItems([post({})] as never, [project({ slug: 'board', locale: 'en', title: 'Board' })] as never)
  assert.deepEqual(items.map((i) => i.id), ['post:th:hello', 'project:en:board'])
  assert.equal(items[0].url, 'https://chakkritton.com/blog/hello')
  assert.equal(items[1].url, 'https://chakkritton.com/en/projects/board')
  assert.deepEqual(items[1].stack, ['Next.js'])
  assert.equal(items[0].minutes, 3)
})

test('drafts never appear, and the same record twice appears once', () => {
  const items = toAiItems([post({}), post({}), post({ slug: 'wip', status: 'DRAFT' })] as never, [])
  assert.deepEqual(items.map((i) => i.id), ['post:th:hello'])
})

test('only th and en records are indexed', () => {
  assert.equal(toAiItems([post({ locale: 'ja' })] as never, []).length, 0)
})
```

- [ ] **Step 2: Run it to see it fail**

Run: `npx tsx --test src/lib/ai-index.test.ts`
Expected: FAIL — `Cannot find module './ai-index'`.

- [ ] **Step 3: Implement** — `src/lib/ai-index.ts`

```ts
import { absoluteUrl } from './seo'
import type { PostRecord, ProjectRecord } from './content-types'

/**
 * The site as Mr. Worldwide knows it: one line of facts per published article
 * and project, in each language it exists in. The Worker ranks these for a
 * question and turns the chosen ids into cards.
 */
export interface AiItem {
  id: string
  kind: 'post' | 'project'
  locale: 'th' | 'en'
  slug: string
  url: string
  title: string
  summary: string
  tags: string[]
  stack: string[]
  minutes: number
  cover: string | null
}

const LOCALES = new Set(['th', 'en'])

function item(kind: AiItem['kind'], r: PostRecord | ProjectRecord): AiItem {
  const locale = r.locale as AiItem['locale']
  return {
    id: `${kind}:${locale}:${r.slug}`,
    kind,
    locale,
    slug: r.slug,
    url: absoluteUrl(`/${kind === 'post' ? 'blog' : 'projects'}/${r.slug}`, locale),
    title: r.title,
    summary: r.summary ?? '',
    tags: r.tags,
    stack: 'stack' in r ? r.stack : [],
    minutes: r.readingMinutes,
    cover: r.coverImage,
  }
}

export function toAiItems(posts: PostRecord[], projects: ProjectRecord[]): AiItem[] {
  const seen = new Map<string, AiItem>()
  const add = (kind: AiItem['kind'], r: PostRecord | ProjectRecord) => {
    if (r.status !== 'PUBLISHED' || !LOCALES.has(r.locale)) return
    const it = item(kind, r)
    if (!seen.has(it.id)) seen.set(it.id, it)
  }
  posts.forEach((p) => add('post', p))
  projects.forEach((p) => add('project', p))
  return [...seen.values()]
}
```

- [ ] **Step 4: Run the test** — `npx tsx --test src/lib/ai-index.test.ts` → PASS (3 tests).

- [ ] **Step 5: The index route** — `src/app/ai/index.json/route.ts`

```ts
import { listPosts, listProjects } from '@/lib/content'
import { toAiItems } from '@/lib/ai-index'

// Per request, like the feed and the sitemap; the CDN keeps it a minute and the
// Worker five, so a publish reaches the chat within about five minutes.
export const dynamic = 'force-dynamic'

export async function GET(): Promise<Response> {
  // Each listing collapses translations to the best language for its locale;
  // together they hold every published record in both languages.
  const [thPosts, enPosts, thProjects, enProjects] = await Promise.all([
    listPosts({ locale: 'th' }),
    listPosts({ locale: 'en' }),
    listProjects({ locale: 'th' }),
    listProjects({ locale: 'en' }),
  ])
  return Response.json(
    { items: toAiItems([...thPosts, ...enPosts], [...thProjects, ...enProjects]) },
    { headers: { 'Cache-Control': 'public, max-age=0, s-maxage=60, stale-while-revalidate=300' } },
  )
}
```

- [ ] **Step 6: The item route** — `src/app/ai/item/[kind]/[locale]/[slug]/route.ts`

```ts
import { getPost, getProject } from '@/lib/content'
import { documentToText } from '@/lib/editor'
import { decodeParam } from '@/lib/slug'

export const dynamic = 'force-dynamic'

const MAX = 6000

/** One published item's words as plain text, for the Worker to quote from. */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ kind: string; locale: string; slug: string }> },
): Promise<Response> {
  const { kind, locale, slug: raw } = await params
  const slug = decodeParam(raw).replace(/\.txt$/, '')
  if ((kind !== 'post' && kind !== 'project') || (locale !== 'th' && locale !== 'en')) {
    return new Response('Not found', { status: 404 })
  }
  const record = kind === 'post' ? await getPost(slug, locale) : await getProject(slug, locale)
  // getPost/getProject fall back to another language; the index asked for this one.
  if (!record || record.locale !== locale) return new Response('Not found', { status: 404 })
  const text = [record.title, record.summary ?? '', documentToText(record.content)].join('\n\n').slice(0, MAX)
  return new Response(text, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=0, s-maxage=60, stale-while-revalidate=300',
    },
  })
}
```

- [ ] **Step 7: Check against the dev server** (running at `http://localhost:3100`; start `npx next dev -p 3100` if not)

```bash
curl -s localhost:3100/ai/index.json | python3 -c "import json,sys;d=json.load(sys.stdin);print(len(d['items']),[i['id'] for i in d['items']][:6])"
curl -s -o /dev/null -w "%{http_code} %{content_type}\n" "localhost:3100/ai/item/project/th/smtrack-plus.txt"
curl -s -o /dev/null -w "%{http_code}\n" "localhost:3100/ai/item/project/th/does-not-exist.txt"
```

Expected: a count ≥ 7 with ids like `project:th:smtrack-plus`; `200 text/plain; charset=utf-8`; `404`.

- [ ] **Step 8: Typecheck, lint, commit, push** (the Worker in Task 5 reads these from production)

```bash
npx tsc --noEmit 2>&1 | grep -v '^\.next' ; npx eslint src/lib/ai-index.ts src/app/ai
git add src/lib/ai-index.ts src/lib/ai-index.test.ts src/app/ai
git commit -m "feat(ai): content index and item text for the site's guide"
git push origin main
```

---

### Task 2: Worker package and ranking

**Files:**
- Create: `worker/package.json`, `worker/tsconfig.json`, `worker/src/types.ts`, `worker/src/rank.ts`, `worker/test/rank.test.ts`
- Modify: `tsconfig.json` (exclude `worker`), `eslint.config.mjs` (ignore `worker/**`)

**Interfaces:**
- Produces: `Item` (same fields as `AiItem`), `Msg = { role: 'user' | 'assistant'; content: string }`, `Lang = 'th' | 'en'`, `rank(items: Item[], query: string, lang: Lang): Item[]` (best first; only items scoring ≥ 1).

- [ ] **Step 1: Scaffold** — `worker/package.json`

```json
{
  "name": "mr-worldwide",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "wrangler dev",
    "deploy": "wrangler deploy",
    "test": "tsx --test test/*.test.ts",
    "typecheck": "tsc --noEmit"
  },
  "devDependencies": {
    "@cloudflare/workers-types": "^4",
    "tsx": "^4",
    "typescript": "^5",
    "wrangler": "^4"
  }
}
```

`worker/tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ES2022",
    "moduleResolution": "Bundler",
    "lib": ["ES2022"],
    "types": ["@cloudflare/workers-types"],
    "strict": true,
    "noEmit": true,
    "skipLibCheck": true
  },
  "include": ["src", "test"]
}
```

Run: `cd worker && npm install`.

Root `tsconfig.json`: change `"exclude": ["node_modules"]` to `"exclude": ["node_modules", "worker"]`.
Root `eslint.config.mjs`: add `"worker/**",` to the `globalIgnores([...])` list.

`worker/src/types.ts`

```ts
export interface Item {
  id: string
  kind: 'post' | 'project'
  locale: 'th' | 'en'
  slug: string
  url: string
  title: string
  summary: string
  tags: string[]
  stack: string[]
  minutes: number
  cover: string | null
}
export type Lang = 'th' | 'en'
export interface Msg {
  role: 'user' | 'assistant'
  content: string
}
export interface Env {
  AI: Ai
  LIMITER: RateLimit
  SITE: string
  ALLOWED_ORIGINS: string
}
```

- [ ] **Step 2: Failing tests** — `worker/test/rank.test.ts`

```ts
// Run: npx tsx --test test/rank.test.ts   (from worker/)
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { rank } from '../src/rank'
import type { Item } from '../src/types'

const it = (id: string, over: Partial<Item>): Item => ({
  id, kind: 'project', locale: 'en', slug: id, url: '', title: '', summary: '', tags: [], stack: [], minutes: 1, cover: null, ...over,
})
const items = [
  it('project:en:smtrack', { title: 'SMTrack+', tags: ['IoT', 'MQTT'], summary: 'Live fridge temperatures' }),
  it('project:th:board', { locale: 'th', title: 'สร้าง Whiteboard ด้วย Claude Code', summary: 'ไวท์บอร์ดออนไลน์ที่ไม่ต้องสมัคร' }),
  it('post:en:llms', { kind: 'post', title: 'What is llms.txt?', tags: ['AI', 'SEO'] }),
]

test('an English keyword finds the item tagged with it', () => {
  assert.equal(rank(items, 'anything on IoT?', 'en')[0].id, 'project:en:smtrack')
})

test('a Thai question without spaces still finds the Thai item', () => {
  assert.equal(rank(items, 'อยากดูโปรเจคไวท์บอร์ดหน่อย', 'th')[0].id, 'project:th:board')
})

test('dots and cases in a term do not stop a match', () => {
  assert.equal(rank(items, 'LLMS.TXT', 'en')[0].id, 'post:en:llms')
})

test('an unrelated question finds nothing', () => {
  assert.deepEqual(rank(items, 'what is the weather', 'en'), [])
})

test('the reader’s language wins a tie', () => {
  const pair = [it('a', { locale: 'th', title: 'Docker' }), it('b', { locale: 'en', title: 'Docker' })]
  assert.equal(rank(pair, 'docker', 'en')[0].id, 'b')
})
```

- [ ] **Step 3: Run** — `cd worker && npx tsx --test test/rank.test.ts` → FAIL (module missing).

- [ ] **Step 4: Implement** — `worker/src/rank.ts`

```ts
import type { Item, Lang } from './types'

const THAI = /[\u0E00-\u0E7F]+/g
// Words every question has; matching on them made "what is the weather" find "What is llms.txt?".
const STOP = new Set('a an and any are about can do does for from has have how in is it me my of on or so some that the there this to what which who why with you your'.split(' '))

/** Latin words, and three-letter pieces of every Thai run (Thai has no spaces). */
function terms(text: string) {
  const lower = text.toLowerCase()
  const words = new Set(lower.replace(THAI, ' ').split(/[^\p{L}\p{N}.+#]+/u).filter((w) => w.length >= 2 && !STOP.has(w)))
  const grams = new Set<string>()
  for (const run of lower.match(THAI) ?? []) for (let i = 0; i + 3 <= run.length; i++) grams.add(run.slice(i, i + 3))
  return { words, grams }
}

function overlap(q: ReturnType<typeof terms>, field: string): number {
  const f = terms(field)
  let n = 0
  for (const w of q.words) if (f.words.has(w) || (w.length >= 4 && [...f.words].some((x) => x.startsWith(w)))) n += 1
  for (const g of q.grams) if (f.grams.has(g)) n += 0.34
  return n
}

/** Items that match the question, best first: title counts most, then tags, then summary. */
export function rank(items: Item[], query: string, lang: Lang): Item[] {
  const q = terms(query)
  return items
    .map((it) => ({
      it,
      score:
        3 * overlap(q, it.title) +
        2 * overlap(q, [...it.tags, ...it.stack].join(' ')) +
        overlap(q, it.summary) +
        (it.locale === lang ? 0.25 : 0),
    }))
    .filter((x) => x.score >= 1)
    .sort((a, b) => b.score - a.score)
    .map((x) => x.it)
}
```

- [ ] **Step 5: Run** — `npx tsx --test test/rank.test.ts` → PASS (5). Then from the repo root: `npx tsc --noEmit 2>&1 | grep -v '^\.next'` prints nothing (worker excluded).

- [ ] **Step 6: Commit**

```bash
git add worker/package.json worker/package-lock.json worker/tsconfig.json worker/src/types.ts worker/src/rank.ts worker/test/rank.test.ts tsconfig.json eslint.config.mjs
git commit -m "feat(worker): scaffold and rank the site's items for a question"
```

---

### Task 3: Prompt and reply filter

**Files:**
- Create: `worker/src/prompt.ts`, `worker/src/filter.ts`, `worker/test/prompt.test.ts`, `worker/test/filter.test.ts`

**Interfaces:**
- Consumes: `Item`, `Msg`, `Lang` (Task 2).
- Produces:
  - `indexLine(it: Item): string`
  - `buildMessages(o: { items: Item[]; details: { item: Item; text: string }[]; history: Msg[]; lang: Lang }): { role: 'system' | 'user' | 'assistant'; content: string }[]`
  - `createReplyFilter(): { push(delta: string): string; end(): { text: string; ids: string[] } }`

- [ ] **Step 1: Failing tests** — `worker/test/prompt.test.ts`

```ts
// Run: npx tsx --test test/prompt.test.ts   (from worker/)
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { buildMessages, indexLine } from '../src/prompt'
import type { Item, Msg } from '../src/types'

const item: Item = { id: 'project:en:smtrack', kind: 'project', locale: 'en', slug: 'smtrack', url: 'https://chakkritton.com/en/projects/smtrack', title: 'SMTrack+', summary: 'Live fridge temperatures', tags: ['IoT'], stack: ['MQTT'], minutes: 5, cover: null }

test('an index line carries the id, kind, title and tags', () => {
  const line = indexLine(item)
  for (const part of ['[project:en:smtrack]', 'Project', 'SMTrack+', 'IoT', 'MQTT']) assert.ok(line.includes(part), part)
})

test('the system prompt holds the persona, the rules and every index line', () => {
  const [system] = buildMessages({ items: [item], details: [], history: [{ role: 'user', content: 'hi' }], lang: 'en' })
  assert.equal(system.role, 'system')
  assert.ok(system.content.includes('Mr. Worldwide'))
  assert.ok(system.content.includes('CARDS:'))
  assert.ok(system.content.includes(indexLine(item)))
})

test('details are quoted, history is kept to the last 8, and thinking is switched off', () => {
  const history: Msg[] = Array.from({ length: 11 }, (_, i) => ({ role: i % 2 ? 'assistant' : 'user', content: `m${i}` }))
  const out = buildMessages({ items: [item], details: [{ item, text: 'Full text here' }], history, lang: 'th' })
  assert.ok(out[0].content.includes('Full text here'))
  assert.equal(out.length, 1 + 8)
  assert.ok(out.at(-1)!.content.endsWith('/no_think'))
  assert.ok(out[0].content.includes('Thai'))
})
```

`worker/test/filter.test.ts`

```ts
// Run: npx tsx --test test/filter.test.ts   (from worker/)
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createReplyFilter } from '../src/filter'

const run = (chunks: string[]) => {
  const f = createReplyFilter()
  const shown = chunks.map((c) => f.push(c)).join('')
  const { text, ids } = f.end()
  return { shown: shown + text, ids }
}

test('plain text passes through untouched', () => {
  assert.deepEqual(run(['Hello ', 'there!']), { shown: 'Hello there!', ids: [] })
})

test('a CARDS line split across chunks is removed and parsed', () => {
  const r = run(['Try this one.\nCAR', 'DS: project:en:a, post:th:b'])
  assert.equal(r.shown.trim(), 'Try this one.')
  assert.deepEqual(r.ids, ['project:en:a', 'post:th:b'])
})

test('the word "cards" inside a sentence is text, not a command', () => {
  assert.equal(run(['These cards: ', 'are nice']).shown, 'These cards: are nice')
})

test('a think block, even split, never reaches the reader', () => {
  assert.equal(run(['<thi', 'nk>plan</th', 'ink>Hi']).shown, 'Hi')
})
```

- [ ] **Step 2: Run** — `npx tsx --test test/prompt.test.ts test/filter.test.ts` → FAIL (modules missing).

- [ ] **Step 3: Implement** — `worker/src/prompt.ts`

```ts
import type { Item, Lang, Msg } from './types'

type Out = { role: 'system' | 'user' | 'assistant'; content: string }

export function indexLine(it: Item): string {
  const kind = it.kind === 'post' ? 'Article' : 'Project'
  const tags = [...it.tags, ...it.stack].join(', ')
  return `[${it.id}] ${kind} (${it.locale}, ${it.minutes} min) — ${it.title} — ${it.summary.slice(0, 160)} — tags: ${tags}`
}

const PERSONA = `You are Mr. Worldwide, a cheerful hologram globe who guides visitors around chakkritton.com — Chakkrit Laolit's portfolio of articles and projects.
Voice: warm, playful, a little teasing, never rude. Short: two to four sentences.
Rules:
- Talk only about this site's articles, projects, tags and Chakkrit's work. Politely steer anything else back to them.
- Only mention items from the INDEX below. Never invent a title, link, number or fact.
- When you recommend items, end your reply with one final line exactly like: CARDS: id1, id2 (ids from the INDEX, at most three). Otherwise write no CARDS line.
- Do not write URLs; the cards carry the links.`

export function buildMessages(o: { items: Item[]; details: { item: Item; text: string }[]; history: Msg[]; lang: Lang }): Out[] {
  const language = o.lang === 'th' ? 'Thai' : 'English'
  const details = o.details.map((d) => `### ${d.item.id}\n${d.text}`).join('\n\n')
  const system = [
    PERSONA,
    `Reply in ${language} unless the visitor clearly writes in another language.`,
    `INDEX:\n${o.items.map(indexLine).join('\n')}`,
    details ? `DETAILS (quote from these when asked):\n${details}` : '',
  ].filter(Boolean).join('\n\n')
  const history = o.history.slice(-8).map((m) => ({ role: m.role, content: m.content }))
  const last = history.at(-1)
  if (last && last.role === 'user') last.content = `${last.content} /no_think`
  return [{ role: 'system', content: system }, ...history]
}
```

`worker/src/filter.ts`

```ts
const TAG = 'CARDS:'

/**
 * Streams the model's text through, holding back two things the reader must
 * never see: a <think>…</think> block, and the final `CARDS: …` line, whose ids
 * become cards. Either may arrive split across chunks, so an unfinished line
 * that could still turn into `CARDS:` is held until it can't.
 */
export function createReplyFilter() {
  let buf = ''
  let inThink = false

  const stripThink = () => {
    let out = ''
    for (;;) {
      if (inThink) {
        const close = buf.indexOf('</think>')
        // Keep a tail that may be the start of "</think>" split across chunks.
        if (close < 0) { buf = buf.slice(-7); return out }
        buf = buf.slice(close + 8); inThink = false
      }
      const open = buf.indexOf('<think>')
      if (open < 0) {
        // Hold a trailing piece that might be the start of "<think>".
        const lt = buf.lastIndexOf('<')
        if (lt >= 0 && '<think>'.startsWith(buf.slice(lt))) { out += buf.slice(0, lt); buf = buf.slice(lt); return out }
        out += buf; buf = ''; return out
      }
      out += buf.slice(0, open); buf = buf.slice(open + 7); inThink = true
    }
  }

  let pending = ''   // text already free of think blocks, not yet shown
  const mayBeCards = (line: string) => {
    const head = line.trimStart().toUpperCase()
    return head.length < TAG.length ? TAG.startsWith(head) : head.startsWith(TAG)
  }

  return {
    push(delta: string): string {
      buf += delta
      pending += stripThink()
      const nl = pending.lastIndexOf('\n')
      const done = pending.slice(0, nl + 1)
      const tail = pending.slice(nl + 1)
      // Whole lines go out unless one is the CARDS line (kept for end()).
      const lines = done.split('\n')
      let shown = ''
      let kept = ''
      lines.forEach((l, i) => {
        if (i === lines.length - 1) return
        if (mayBeCards(l) && l.trimStart().toUpperCase().startsWith(TAG)) kept += l + '\n'
        else shown += l + '\n'
      })
      if (tail && !mayBeCards(tail)) { shown += tail; pending = kept }
      else pending = kept + tail
      return shown
    },
    end(): { text: string; ids: string[] } {
      pending += stripThink() + (inThink ? '' : buf)
      buf = ''
      const ids: string[] = []
      const text = pending
        .split('\n')
        .filter((l) => {
          const m = /^\s*CARDS:\s*(.*)$/i.exec(l)
          if (m) m[1].split(',').map((s) => s.trim()).filter(Boolean).forEach((id) => ids.push(id))
          return !m
        })
        .join('\n')
      pending = ''
      return { text, ids }
    },
  }
}
```

- [ ] **Step 4: Run** — `npx tsx --test test/prompt.test.ts test/filter.test.ts` → PASS (7).

- [ ] **Step 5: Commit**

```bash
git add worker/src/prompt.ts worker/src/filter.ts worker/test/prompt.test.ts worker/test/filter.test.ts
git commit -m "feat(worker): the persona prompt, and a filter that keeps CARDS and thinking out of the text"
```

---

### Task 4: Streaming, the handler and Wrangler config

**Files:**
- Create: `worker/src/stream.ts`, `worker/src/index.ts`, `worker/wrangler.toml`, `worker/test/stream.test.ts`, `worker/test/handler.test.ts`

**Interfaces:**
- Consumes: `rank` (Task 2), `buildMessages`, `createReplyFilter` (Task 3), `Env`, `Item`, `Msg`.
- Produces:
  - `toClientStream(upstream: ReadableStream<Uint8Array>, valid: Set<string>): ReadableStream<Uint8Array>` — emits SSE events `text` (`{"t": string}`), `cards` (`{"ids": string[]}`), `done` (`{}`), and on a broken stream `error` (`{"code":"upstream"}`).
  - `parseBody(raw: string): { messages: Msg[]; lang: Lang } | null`
  - `errorCode(err: unknown): 'quota' | 'upstream'`
  - default export `{ fetch(req, env, ctx) }`.
  - HTTP: `POST /api/assistant` → `200 text/event-stream`; errors → JSON `{ code, retryAfter? }` with 400/403/405/429/502/503.

- [ ] **Step 1: Failing tests** — `worker/test/stream.test.ts`

```ts
// Run: npx tsx --test test/stream.test.ts   (from worker/)
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { toClientStream } from '../src/stream'

const enc = new TextEncoder()
const upstream = (chunks: string[]) =>
  new ReadableStream<Uint8Array>({
    start(c) {
      for (const ch of chunks) c.enqueue(enc.encode(ch))
      c.close()
    },
  })
const sse = (t: string) => `data: ${JSON.stringify({ response: t })}\n\n`
async function read(s: ReadableStream<Uint8Array>) {
  const text = await new Response(s).text()
  return text.split('\n\n').filter(Boolean).map((e) => {
    const ev = /event: (\w+)/.exec(e)![1]
    return [ev, JSON.parse(/data: (.*)/.exec(e)![1])] as const
  })
}

test('text streams out, the CARDS line becomes a cards event with only known ids', async () => {
  const out = await read(toClientStream(upstream([sse('Try SMT'), sse('rack+!\nCARDS: project:en:a, project:en:ghost'), 'data: [DONE]\n\n']), new Set(['project:en:a'])))
  const text = out.filter(([e]) => e === 'text').map(([, d]) => d.t).join('')
  assert.equal(text.trim(), 'Try SMTrack+!')
  assert.deepEqual(out.find(([e]) => e === 'cards')![1], { ids: ['project:en:a'] })
  assert.equal(out.at(-1)![0], 'done')
})

test('an SSE event split across network chunks is still read whole', async () => {
  const whole = sse('Hello')
  const out = await read(toClientStream(upstream([whole.slice(0, 9), whole.slice(9), 'data: [DONE]\n\n']), new Set()))
  assert.equal(out.filter(([e]) => e === 'text').map(([, d]) => d.t).join(''), 'Hello')
})
```

`worker/test/handler.test.ts`

```ts
// Run: npx tsx --test test/handler.test.ts   (from worker/)
import { test } from 'node:test'
import assert from 'node:assert/strict'
import worker, { errorCode, parseBody } from '../src/index'

test('parseBody accepts a small conversation and rejects anything else', () => {
  assert.deepEqual(parseBody(JSON.stringify({ messages: [{ role: 'user', content: 'hi' }], lang: 'en' })), { messages: [{ role: 'user', content: 'hi' }], lang: 'en' })
  assert.equal(parseBody('not json'), null)
  assert.equal(parseBody(JSON.stringify({ messages: [], lang: 'en' })), null)
  assert.equal(parseBody(JSON.stringify({ messages: [{ role: 'system', content: 'x' }], lang: 'en' })), null)
  assert.equal(parseBody(JSON.stringify({ messages: [{ role: 'user', content: 'x'.repeat(1001) }], lang: 'en' })), null)
  assert.equal(parseBody(JSON.stringify({ messages: [{ role: 'user', content: 'hi' }], lang: 'ja' })), null)
})

test('keeps only the last 8 messages', () => {
  const messages = Array.from({ length: 12 }, (_, i) => ({ role: i % 2 ? 'assistant' : 'user', content: `${i}` }))
  assert.equal(parseBody(JSON.stringify({ messages, lang: 'th' }))!.messages.length, 8)
})

test('a used-up daily allowance is "quota", anything else "upstream"', () => {
  assert.equal(errorCode(new Error('4006: you have used up your daily free allocation of 10,000 neurons')), 'quota')
  assert.equal(errorCode(new Error('socket hang up')), 'upstream')
})

const env = (over: object = {}) => ({
  SITE: 'https://chakkritton.com',
  ALLOWED_ORIGINS: 'https://chakkritton.com',
  LIMITER: { limit: async () => ({ success: true }) },
  AI: { run: async () => { throw new Error('unused') } },
  ...over,
}) as never
const post = (body: unknown, origin = 'https://chakkritton.com') =>
  new Request('https://chakkritton.com/api/assistant', { method: 'POST', headers: { Origin: origin, 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
const ctx = { waitUntil() {}, passThroughOnException() {} } as never

test('a foreign origin is refused', async () => {
  const r = await worker.fetch(post({}, 'https://evil.example'), env(), ctx)
  assert.equal(r.status, 403)
})

test('over the limit answers 429 with rate_limited and a wait', async () => {
  const r = await worker.fetch(post({ messages: [{ role: 'user', content: 'hi' }], lang: 'en' }), env({ LIMITER: { limit: async () => ({ success: false }) } }), ctx)
  assert.equal(r.status, 429)
  assert.deepEqual(await r.json(), { code: 'rate_limited', retryAfter: 60 })
})

test('a bad body answers 400 bad_request', async () => {
  const r = await worker.fetch(post({ nope: true }), env(), ctx)
  assert.equal(r.status, 400)
})
```

- [ ] **Step 2: Run** — `npx tsx --test test/stream.test.ts test/handler.test.ts` → FAIL (modules missing).

- [ ] **Step 3: Implement** — `worker/src/stream.ts`

```ts
import { createReplyFilter } from './filter'

const enc = new TextEncoder()
const event = (name: string, data: unknown) => enc.encode(`event: ${name}\ndata: ${JSON.stringify(data)}\n\n`)

/**
 * Workers AI streams `data: {"response": "…"}` events. This reads them (whole
 * events only — a network chunk can end mid-event), runs the text through the
 * reply filter, and emits the page's own events: text, cards, done.
 */
export function toClientStream(upstream: ReadableStream<Uint8Array>, valid: Set<string>): ReadableStream<Uint8Array> {
  const filter = createReplyFilter()
  const dec = new TextDecoder()
  let carry = ''
  return new ReadableStream<Uint8Array>({
    async start(c) {
      const reader = upstream.getReader()
      try {
        for (;;) {
          const { value, done } = await reader.read()
          if (done) break
          carry += dec.decode(value, { stream: true })
          const parts = carry.split('\n\n')
          carry = parts.pop() ?? ''
          for (const part of parts) {
            const data = part.split('\n').find((l) => l.startsWith('data: '))?.slice(6)
            if (!data || data === '[DONE]') continue
            const delta = (JSON.parse(data) as { response?: string }).response ?? ''
            const shown = filter.push(delta)
            if (shown) c.enqueue(event('text', { t: shown }))
          }
        }
        const { text, ids } = filter.end()
        if (text) c.enqueue(event('text', { t: text }))
        const known = [...new Set(ids)].filter((id) => valid.has(id)).slice(0, 3)
        if (known.length) c.enqueue(event('cards', { ids: known }))
        c.enqueue(event('done', {}))
      } catch {
        c.enqueue(event('error', { code: 'upstream' }))
      } finally {
        c.close()
      }
    },
  })
}
```

`worker/src/index.ts`

```ts
import { buildMessages } from './prompt'
import { rank } from './rank'
import { toClientStream } from './stream'
import type { Env, Item, Lang, Msg } from './types'

const MODEL = '@cf/qwen/qwen3-30b-a3b-fp8'
const CACHE = { cf: { cacheTtl: 300, cacheEverything: true } } as RequestInit

export function parseBody(raw: string): { messages: Msg[]; lang: Lang } | null {
  let b: unknown
  try { b = JSON.parse(raw) } catch { return null }
  const o = b as { messages?: unknown; lang?: unknown }
  if (o?.lang !== 'th' && o?.lang !== 'en') return null
  if (!Array.isArray(o.messages) || o.messages.length === 0) return null
  const messages: Msg[] = []
  for (const m of o.messages.slice(-8)) {
    const { role, content } = (m ?? {}) as { role?: unknown; content?: unknown }
    if ((role !== 'user' && role !== 'assistant') || typeof content !== 'string' || !content.trim() || content.length > 1000) return null
    messages.push({ role, content })
  }
  if (messages.at(-1)!.role !== 'user') return null
  return { messages, lang: o.lang }
}

export function errorCode(err: unknown): 'quota' | 'upstream' {
  const text = String((err as Error)?.message ?? err)
  return /allocation|neuron|quota|4006/i.test(text) ? 'quota' : 'upstream'
}

function cors(origin: string | null, env: Env): Record<string, string> {
  if (!origin || !env.ALLOWED_ORIGINS.split(',').map((s) => s.trim()).includes(origin)) return {}
  return { 'Access-Control-Allow-Origin': origin, 'Access-Control-Allow-Headers': 'Content-Type', 'Access-Control-Allow-Methods': 'POST', Vary: 'Origin' }
}
const json = (body: unknown, status: number, headers: Record<string, string>) =>
  new Response(JSON.stringify(body), { status, headers: { ...headers, 'Content-Type': 'application/json' } })

async function loadIndex(env: Env): Promise<Item[]> {
  const r = await fetch(`${env.SITE}/ai/index.json`, CACHE)
  if (!r.ok) throw new Error(`index ${r.status}`)
  return ((await r.json()) as { items: Item[] }).items
}
async function loadText(env: Env, it: Item): Promise<string> {
  const r = await fetch(`${env.SITE}/ai/item/${it.kind}/${it.locale}/${encodeURIComponent(it.slug)}.txt`, CACHE)
  return r.ok ? r.text() : ''
}

export default {
  async fetch(req: Request, env: Env, _ctx: ExecutionContext): Promise<Response> {
    const url = new URL(req.url)
    if (url.pathname !== '/api/assistant') return fetch(req)
    const origin = req.headers.get('Origin')
    const h = cors(origin, env)
    if (req.method === 'OPTIONS') return new Response(null, { status: Object.keys(h).length ? 204 : 403, headers: h })
    if (req.method !== 'POST') return json({ code: 'bad_request' }, 405, h)
    if (!Object.keys(h).length) return json({ code: 'bad_request' }, 403, h)

    const ip = req.headers.get('CF-Connecting-IP') ?? 'anonymous'
    if (!(await env.LIMITER.limit({ key: ip })).success) return json({ code: 'rate_limited', retryAfter: 60 }, 429, h)

    const body = parseBody(await req.text())
    if (!body) return json({ code: 'bad_request' }, 400, h)

    try {
      const items = await loadIndex(env)
      const question = body.messages.at(-1)!.content
      const picked = rank(items, question, body.lang).slice(0, 2)
      const details = await Promise.all(picked.map(async (item) => ({ item, text: await loadText(env, item) })))
      const messages = buildMessages({ items, details: details.filter((d) => d.text), history: body.messages, lang: body.lang })
      const upstream = (await env.AI.run(MODEL as never, { messages, stream: true, max_tokens: 400 } as never)) as ReadableStream<Uint8Array>
      return new Response(toClientStream(upstream, new Set(items.map((i) => i.id))), {
        headers: { ...h, 'Content-Type': 'text/event-stream; charset=utf-8', 'Cache-Control': 'no-store' },
      })
    } catch (err) {
      const code = errorCode(err)
      return json({ code }, code === 'quota' ? 503 : 502, h)
    }
  },
}
```

`worker/wrangler.toml`

```toml
name = "mr-worldwide"
main = "src/index.ts"
compatibility_date = "2026-09-01"
routes = [{ pattern = "chakkritton.com/api/assistant*", zone_name = "chakkritton.com" }]

[vars]
SITE = "https://chakkritton.com"
ALLOWED_ORIGINS = "https://chakkritton.com"

[ai]
binding = "AI"

[[ratelimits]]
name = "LIMITER"
namespace_id = "1001"
simple = { limit = 8, period = 60 }
```

- [ ] **Step 4: Run all Worker tests and typecheck** — `npm test && npm run typecheck` (in `worker/`) → all PASS, no type errors.

- [ ] **Step 5: Commit**

```bash
git add worker/src/stream.ts worker/src/index.ts worker/wrangler.toml worker/test/stream.test.ts worker/test/handler.test.ts
git commit -m "feat(worker): stream Qwen's answer as text and card events behind a rate limit"
```

---

### Task 5: Deploy the Worker (needs the user)

**Files:** none (deploy only; `worker/.wrangler/` is added to `.gitignore`).

- [ ] **Step 1: Ask the user to log in** — they run, in this session: `! cd worker && npx wrangler login` (a browser page opens for their Cloudflare account). Then `npx wrangler whoami` shows the account.

- [ ] **Step 2: Deploy** — `cd worker && npx wrangler deploy`. Expected: `Deployed mr-worldwide` with the route `chakkritton.com/api/assistant*`.

- [ ] **Step 3: Smoke test production**

```bash
curl -sN -X POST https://chakkritton.com/api/assistant -H 'Origin: https://chakkritton.com' -H 'Content-Type: application/json' \
  -d '{"messages":[{"role":"user","content":"มีโปรเจค IoT ไหม"}],"lang":"th"}' | head -c 1500; echo
curl -s -o /dev/null -w "%{http_code}\n" -X POST https://chakkritton.com/api/assistant -H 'Origin: https://evil.example' -d '{}'
```

Expected: `event: text` lines in Thai mentioning SMTrack+, an `event: cards` with `project:th:smtrack-plus`, then `event: done`; the second prints `403`.

- [ ] **Step 4: Rate limit check** — send 9 requests in a loop with the good origin; the 9th prints `429`.

- [ ] **Step 5: Commit** — `echo 'worker/.wrangler/' >> .gitignore && git add .gitignore && git commit -m "chore: ignore wrangler state"`

---

### Task 6: Assistant client and conversation state

**Files:**
- Create: `src/lib/assistant-client.ts`, `src/lib/assistant-client.test.ts`, `src/components/assistant/use-assistant.ts`

**Interfaces:**
- Consumes: the SSE events of Task 4; `AiItem` (Task 1).
- Produces:
  - `createSseParser(on: (event: string, data: unknown) => void): (chunk: string) => void`
  - `ask(o: { url: string; messages: ChatMsg[]; lang: 'th' | 'en'; signal: AbortSignal; onText(t: string): void; onCards(ids: string[]): void }): Promise<{ ok: true } | { ok: false; code: ErrorCode; retryAfter?: number }>`
  - `type ErrorCode = 'rate_limited' | 'quota' | 'upstream' | 'bad_request' | 'network'`
  - `type ChatMsg = { role: 'user' | 'assistant'; content: string; cards?: string[] }`
  - `useAssistant(lang): { messages; status: 'idle' | 'thinking' | 'talking' | 'error'; error: { code: ErrorCode; retryAfter?: number } | null; send(text: string): void; retry(): void; items: Map<string, AiItem> }`

- [ ] **Step 1: Failing tests** — `src/lib/assistant-client.test.ts`

```ts
// Run: npx tsx --test src/lib/assistant-client.test.ts
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { ask, createSseParser } from './assistant-client'

test('events split across chunks come out whole, in order', () => {
  const got: [string, unknown][] = []
  const push = createSseParser((e, d) => got.push([e, d]))
  push('event: text\ndata: {"t":"Hel')
  push('lo"}\n\nevent: cards\ndata: {"ids":["a"]}\n\nevent: do')
  push('ne\ndata: {}\n\n')
  assert.deepEqual(got, [['text', { t: 'Hello' }], ['cards', { ids: ['a'] }], ['done', {}]])
})

const stream = (s: string) => new Response(new ReadableStream({ start(c) { c.enqueue(new TextEncoder().encode(s)); c.close() } }), { headers: { 'Content-Type': 'text/event-stream' } })

test('ask streams text and cards and reports ok', async () => {
  globalThis.fetch = async () => stream('event: text\ndata: {"t":"Hi"}\n\nevent: cards\ndata: {"ids":["x"]}\n\nevent: done\ndata: {}\n\n')
  let text = ''
  let cards: string[] = []
  const r = await ask({ url: '/api/assistant', messages: [{ role: 'user', content: 'hi' }], lang: 'en', signal: new AbortController().signal, onText: (t) => (text += t), onCards: (c) => (cards = c) })
  assert.deepEqual(r, { ok: true })
  assert.equal(text, 'Hi')
  assert.deepEqual(cards, ['x'])
})

test('an error status becomes its code', async () => {
  globalThis.fetch = async () => Response.json({ code: 'rate_limited', retryAfter: 60 }, { status: 429 })
  const r = await ask({ url: '/x', messages: [{ role: 'user', content: 'hi' }], lang: 'en', signal: new AbortController().signal, onText() {}, onCards() {} })
  assert.deepEqual(r, { ok: false, code: 'rate_limited', retryAfter: 60 })
})

test('an aborted request reports nothing and stops', async () => {
  const c = new AbortController()
  globalThis.fetch = async (_u, init) => { c.abort(); throw Object.assign(new Error('aborted'), { name: 'AbortError' }) }
  const r = await ask({ url: '/x', messages: [{ role: 'user', content: 'hi' }], lang: 'en', signal: c.signal, onText() {}, onCards() {} })
  assert.deepEqual(r, { ok: true })
})

test('a stream that ends without done is a network error', async () => {
  globalThis.fetch = async () => stream('event: text\ndata: {"t":"Hi"}\n\n')
  const r = await ask({ url: '/x', messages: [{ role: 'user', content: 'hi' }], lang: 'en', signal: new AbortController().signal, onText() {}, onCards() {} })
  assert.deepEqual(r, { ok: false, code: 'network' })
})
```

- [ ] **Step 2: Run** — `npx tsx --test src/lib/assistant-client.test.ts` → FAIL.

- [ ] **Step 3: Implement** — `src/lib/assistant-client.ts`

```ts
export type ErrorCode = 'rate_limited' | 'quota' | 'upstream' | 'bad_request' | 'network'
export type ChatMsg = { role: 'user' | 'assistant'; content: string; cards?: string[] }
type Result = { ok: true } | { ok: false; code: ErrorCode; retryAfter?: number }

/** Server-Sent Events, fed chunk by chunk; calls back once per whole event. */
export function createSseParser(on: (event: string, data: unknown) => void) {
  let carry = ''
  return (chunk: string) => {
    carry += chunk
    const parts = carry.split('\n\n')
    carry = parts.pop() ?? ''
    for (const part of parts) {
      const name = /^event: (.*)$/m.exec(part)?.[1]
      const data = /^data: (.*)$/m.exec(part)?.[1]
      if (name && data !== undefined) on(name, JSON.parse(data))
    }
  }
}

export async function ask(o: {
  url: string
  messages: ChatMsg[]
  lang: 'th' | 'en'
  signal: AbortSignal
  onText(t: string): void
  onCards(ids: string[]): void
}): Promise<Result> {
  try {
    const res = await fetch(o.url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: o.messages.map(({ role, content }) => ({ role, content })), lang: o.lang }),
      signal: o.signal,
    })
    if (!res.ok || !res.body) {
      const body = (await res.json().catch(() => ({}))) as { code?: ErrorCode; retryAfter?: number }
      return { ok: false, code: body.code ?? 'upstream', ...(body.retryAfter ? { retryAfter: body.retryAfter } : {}) }
    }
    let done = false
    let failed: ErrorCode | null = null
    const push = createSseParser((event, data) => {
      if (event === 'text') o.onText((data as { t: string }).t)
      else if (event === 'cards') o.onCards((data as { ids: string[] }).ids)
      else if (event === 'done') done = true
      else if (event === 'error') failed = (data as { code: ErrorCode }).code
    })
    const reader = res.body.pipeThrough(new TextDecoderStream()).getReader()
    for (;;) {
      const { value, done: end } = await reader.read()
      if (end) break
      push(value)
    }
    if (failed) return { ok: false, code: failed }
    return done ? { ok: true } : { ok: false, code: 'network' }
  } catch (err) {
    // A newer question replaced this one: not an error the reader should see.
    if (o.signal.aborted || (err as Error).name === 'AbortError') return { ok: true }
    return { ok: false, code: 'network' }
  }
}
```

- [ ] **Step 4: Run** — `npx tsx --test src/lib/assistant-client.test.ts` → PASS (5).

- [ ] **Step 5: The hook** — `src/components/assistant/use-assistant.ts`

```ts
'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { ask, type ChatMsg, type ErrorCode } from '@/lib/assistant-client'
import type { AiItem } from '@/lib/ai-index'

const KEY = 'mw-chat-v1'
const URL_ = process.env.NEXT_PUBLIC_ASSISTANT_URL ?? '/api/assistant'
export type Status = 'idle' | 'thinking' | 'talking' | 'error'

const load = (): ChatMsg[] => {
  try { return JSON.parse(sessionStorage.getItem(KEY) ?? '[]') as ChatMsg[] } catch { return [] }
}

/** The conversation for this tab: kept in sessionStorage, never on a server. */
export function useAssistant(lang: 'th' | 'en') {
  const [messages, setMessages] = useState<ChatMsg[]>([])
  const [status, setStatus] = useState<Status>('idle')
  const [error, setError] = useState<{ code: ErrorCode; retryAfter?: number } | null>(null)
  const [items, setItems] = useState<Map<string, AiItem>>(new Map())
  const current = useRef<AbortController | null>(null)
  const latest = useRef<ChatMsg[]>([])
  useEffect(() => { latest.current = messages }, [messages])

  useEffect(() => { setMessages(load()) }, [])
  useEffect(() => {
    try { sessionStorage.setItem(KEY, JSON.stringify(messages.slice(-20))) } catch { /* private mode */ }
  }, [messages])
  useEffect(() => {
    fetch('/ai/index.json').then((r) => r.json()).then((d: { items: AiItem[] }) => setItems(new Map(d.items.map((i) => [i.id, i])))).catch(() => {})
  }, [])

  const run = useCallback(async (history: ChatMsg[]) => {
    current.current?.abort()     // a newer question replaces an unfinished one
    const ctrl = new AbortController()
    current.current = ctrl
    setError(null)
    setStatus('thinking')
    setMessages([...history, { role: 'assistant', content: '' }])
    const r = await ask({
      url: URL_, messages: history, lang, signal: ctrl.signal,
      onText: (t) => {
        setStatus('talking')
        setMessages((m) => { const next = m.slice(); const last = next.at(-1)!; next[next.length - 1] = { ...last, content: last.content + t }; return next })
      },
      onCards: (ids) => setMessages((m) => { const next = m.slice(); next[next.length - 1] = { ...next.at(-1)!, cards: ids }; return next }),
    })
    if (ctrl !== current.current) return
    if (r.ok) setStatus('idle')
    else { setStatus('error'); setError({ code: r.code, retryAfter: r.retryAfter }) }
  }, [lang])

  // The request is started here, never inside a state updater: React may run an
  // updater twice in development, which would send the question twice.
  const send = useCallback((text: string) => {
    const content = text.trim().slice(0, 1000)
    if (!content) return
    void run([...latest.current.filter((x) => x.content), { role: 'user', content }])
  }, [run])

  const retry = useCallback(() => {
    const history = latest.current.filter((x) => x.content)
    while (history.length && history.at(-1)!.role === 'assistant') history.pop()
    if (history.length) void run(history)
  }, [run])

  useEffect(() => () => current.current?.abort(), [])
  return { messages, status, error, send, retry, items }
}
```

- [ ] **Step 6: Typecheck and lint** — `npx tsc --noEmit 2>&1 | grep -v '^\.next'` (nothing), `npx eslint src/lib/assistant-client.ts src/components/assistant/use-assistant.ts` (clean).

- [ ] **Step 7: Commit**

```bash
git add src/lib/assistant-client.ts src/lib/assistant-client.test.ts src/components/assistant/use-assistant.ts
git commit -m "feat(assistant): stream answers from the Worker and keep the conversation per tab"
```

---

### Task 7: Engine — shaders and the figure

**Files:**
- Create: `src/components/assistant/engine/shaders.ts`, `src/components/assistant/engine/figure.ts`, `src/assets/ai/land.png`
- Modify: `package.json` (add `three`, `@types/three`)

**Interfaces:**
- Produces:
  - `shaders.ts`: `export const VORTEX, VERT, TOON, LINE_VERT, LINE_FRAG, PASS_VERT, PASS_FRAG: string`
  - `figure.ts`: `export interface Uniforms { uTime, uColor, uOpacity, uBoost, uWarpC, uTwist, uPinch, uLight, uLand, uRes, uLine: THREE.IUniform }`, `export function createUniforms(land: THREE.Texture): Uniforms`, `export interface Figure { figure, turn, bodyG, torso, globe, face: THREE.Group | THREE.Mesh; eyes: { gaze: THREE.Group; lid: THREE.Mesh; glint: THREE.Mesh }[]; brows: { mesh: THREE.Mesh; s: number }[]; mouth: THREE.Mesh; mouthHole: THREE.Mesh; hands: THREE.Group[]; shoes: THREE.Group[]; limbs: THREE.Mesh[]; fx: THREE.Scene; puddle: THREE.Mesh; core, streak, ring: THREE.Sprite; mouthCurve(w: number, d: number): THREE.Curve<THREE.Vector3>; onSphere(x: number, y: number, lift?: number): THREE.Vector3; hose(mesh, pts, r): void; legHose(mesh, curve): void }`, `export function buildFigure(scene: THREE.Scene, U: Uniforms): Figure`

- [ ] **Step 1: Dependencies and the map** — `npm install three && npm install -D @types/three`; `mkdir -p src/assets/ai && cp docs/superpowers/prototypes/mr-worldwide/files/land.png src/assets/ai/land.png`.

- [ ] **Step 2: `shaders.ts`** — move the template strings verbatim from the prototype: `VORTEX` (lines 82–96), `VERT` (97–106), `TOON` (107–121), `LINE_VERT` (122–133), `LINE_FRAG` (134–137). Add the hologram pass shaders taken from the `holoPass` material (lines 262–278):

```ts
export const PASS_VERT = 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }'
export const PASS_FRAG = /* the fragmentShader string of holoPass, lines 266–277, verbatim */ ``
```

(Copy the string contents exactly; `${VORTEX}` interpolations stay as template interpolation of the exported `VORTEX`.)

- [ ] **Step 3: `figure.ts`** — a module wrapping prototype lines 139–257 inside `buildFigure(scene, U)`:
  - `createUniforms(land)` returns the object from prototype lines 69–75 with `uColor` = `new THREE.Color('#ff8a3d')`, `uOpacity` 0.78, `uLand` = `land`, plus `uRes: { value: new THREE.Vector2(1, 1) }` and `uLine: { value: 2.6 }` (prototype lines ~138).
  - Inside `buildFigure`: the material helpers `toon`, `LINE`, `FINE`, `holo`, `flat`, `INK`, `WHITE`, `SOLE` (139–150), then everything from `const figure = new THREE.Group(); scene.add(figure)` (153) to `const core = spr(coreTex), streak = spr(streakTex), ring = spr(ringTex)` (257) including `ink(bodyG)` and `hands.forEach((h) => ink(h, FINE))`. `V` is `(x, y, z) => new THREE.Vector3(x, y, z)`.
  - Replace `document.createElement('canvas')` texture makers unchanged (they run in the browser).
  - Return every name listed in **Produces**.
  - Types: annotate function parameters; `mouthCurve` returns `THREE.CatmullRomCurve3`.

- [ ] **Step 4: Check it builds** — `npx tsc --noEmit 2>&1 | grep -v '^\.next'` prints nothing; `npx eslint src/components/assistant/engine` clean.

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json src/assets/ai/land.png src/components/assistant/engine/shaders.ts src/components/assistant/engine/figure.ts
git commit -m "feat(assistant): Mr. Worldwide's shaders and figure, ported from the approved prototype"
```

---

### Task 8: Engine — motion and the public API

**Files:**
- Create: `src/components/assistant/engine/motion.ts`, `src/components/assistant/engine/engine.ts`

**Interfaces:**
- Consumes: `buildFigure`, `createUniforms`, `Figure`, `Uniforms` (Task 7); shader strings (Task 7).
- Produces (`engine.ts`):

```ts
export type Act = 'hips' | 'think' | 'talk' | 'point' | null
export interface EngineOptions { mobile: boolean; reducedMotion: boolean; rightReserve: number /* px kept clear at the right */ }
export interface Engine {
  setAct(act: Act): void
  wave(): void
  warp(): void
  setPointer(clientX: number, clientY: number): void
  clearPointer(): void
  hitTest(clientX: number, clientY: number): boolean
  anchor(): { x: number; y: number }          // viewport px of the top of his head
  setOptions(o: Partial<EngineOptions>): void
  setBusy(busy: boolean): void                 // chat open: full frame rate, no auto-warp, no walking
  dispose(): void
}
export function createEngine(canvas: HTMLCanvasElement, land: string, o: EngineOptions): Engine
```

- [ ] **Step 1: `motion.ts`** — the state and the per-frame update, moved from the prototype:
  - `export function createState()` → the `st` object (lines 289–296) plus fields `busy: false`, `nextWarp: 40 + Math.random() * 50`, `mobile: false`, `reduced: false`.
  - `ease`, `backOut`, `c01`, `handFrame`, `waveState` (297–314) as module functions.
  - `export type State = ReturnType<typeof createState>`
  - `export function step(F: Figure, U: Uniforms, st: State, dt: number, t: number, world: { halfW: number; minX: number; maxX: number }): { full: boolean }` — the body of `frame()` (lines 318–562) without the three `renderer.*` calls and without `requestAnimationFrame`. Changes while moving it:
    1. Replace `halfW` bounds with `world.minX`/`world.maxX` (walking turns at these).
    2. `if (st.reduced || st.mobile || st.busy)` → `wantV = 0` and the idle pause timer is used instead of walking (`st.mode` stays `'pause'`/`'act'`/`'notice'`).
    3. Auto-warp: in `'walk'` mode, `st.nextWarp -= dt`; when `< 0` and not `reduced`/`mobile`/`busy`, set `st.target` to a random x in `[minX, maxX]` at least a third of the range away, `st.mode = 'out'`, `st.modeT = 0`, `st.nextWarp = 40 + Math.random() * 50`.
    4. Return `{ full }` where `full` is `true` for modes `out`, `in`, `wave`, `notice`, `act`, or `st.busy`; otherwise `false` (the loop then draws at 30 fps).
- [ ] **Step 2: `engine.ts`** — renderer, camera, passes, loop, API:

```ts
import * as THREE from 'three'
import { buildFigure, createUniforms } from './figure'
import { PASS_FRAG, PASS_VERT } from './shaders'
import { createState, step } from './motion'

export type Act = 'hips' | 'think' | 'talk' | 'point' | null
export interface EngineOptions { mobile: boolean; reducedMotion: boolean; rightReserve: number }
export interface Engine {
  setAct(act: Act): void
  wave(): void
  warp(): void
  setPointer(clientX: number, clientY: number): void
  clearPointer(): void
  hitTest(clientX: number, clientY: number): boolean
  anchor(): { x: number; y: number }
  setOptions(o: Partial<EngineOptions>): void
  setBusy(busy: boolean): void
  dispose(): void
}

export function createEngine(canvas: HTMLCanvasElement, landUrl: string, o: EngineOptions): Engine {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true })
  renderer.setPixelRatio(Math.min(2, devicePixelRatio))
  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(28, 1, 0.1, 100)
  camera.position.set(0, 2.35, 13)
  camera.lookAt(0, 1.7, 0)
  const U = createUniforms(new THREE.TextureLoader().load(landUrl))
  const F = buildFigure(scene, U)
  const st = createState()
  let opts = { ...o }

  const rt = new THREE.WebGLRenderTarget(1, 1, { samples: 4 })
  const pass = new THREE.Mesh(
    new THREE.PlaneGeometry(2, 2),
    new THREE.ShaderMaterial({
      uniforms: { tDraw: { value: rt.texture }, uTime: U.uTime, uOpacity: U.uOpacity, uRes: U.uRes },
      vertexShader: PASS_VERT, fragmentShader: PASS_FRAG, transparent: true, depthTest: false, depthWrite: false,
    }),
  )
  const passScene = new THREE.Scene()
  passScene.add(pass)
  const passCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1)

  // World units across the canvas at the figure's depth; he walks between minX and maxX.
  const world = { halfW: 5, minX: -4, maxX: 4 }
  const unitsPerPx = () => (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * camera.position.z) / canvas.clientHeight
  function resize() {
    const w = canvas.clientWidth, h = canvas.clientHeight
    renderer.setSize(w, h, false)
    camera.aspect = w / h
    camera.updateProjectionMatrix()
    const dpr = renderer.getPixelRatio()
    rt.setSize(w * dpr, h * dpr)
    U.uRes.value.set(w * dpr, h * dpr)
    world.halfW = (w / 2) * unitsPerPx()
    world.minX = -world.halfW + 1.8
    world.maxX = world.halfW - 1.8 - opts.rightReserve * unitsPerPx()
    const scale = opts.mobile ? 0.72 : 1
    F.figure.scale.setScalar(scale)
    if (opts.mobile) st.x = world.minX
    st.x = Math.min(Math.max(st.x, world.minX), world.maxX)
  }
  const ro = new ResizeObserver(resize)
  ro.observe(canvas)
  resize()

  const clock = new THREE.Clock()
  let raf = 0, last = 0, visible = !document.hidden
  const onVis = () => { visible = !document.hidden; if (visible) { clock.getDelta(); loop(performance.now()) } }
  document.addEventListener('visibilitychange', onVis)

  function draw() {
    renderer.setRenderTarget(rt); renderer.setClearColor(0x000000, 0); renderer.clear(); renderer.render(scene, camera)
    renderer.setRenderTarget(null); renderer.clear()
    renderer.autoClear = false
    renderer.render(F.fx, camera)
    renderer.render(passScene, passCam)
    renderer.render(F.fx, camera)
    renderer.autoClear = true
  }
  function loop(now: number) {
    if (!visible) return
    raf = requestAnimationFrame(loop)
    const dt = Math.min(0.05, clock.getDelta())
    U.uTime.value = clock.elapsedTime
    st.mobile = opts.mobile; st.reduced = opts.reducedMotion
    const { full } = step(F, U, st, dt, clock.elapsedTime, world)
    if (!full && now - last < 30) return   // idling: 30 fps is enough
    last = now
    draw()
  }
  raf = requestAnimationFrame(loop)

  const ray = new THREE.Raycaster()
  const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), -0.6)
  const toNdc = (x: number, y: number) => {
    const r = canvas.getBoundingClientRect()
    return new THREE.Vector2(((x - r.left) / r.width) * 2 - 1, -((y - r.top) / r.height) * 2 + 1)
  }
  const project = (v: THREE.Vector3) => {
    const p = v.clone().project(camera), r = canvas.getBoundingClientRect()
    return { x: r.left + ((p.x + 1) / 2) * r.width, y: r.top + ((1 - p.y) / 2) * r.height }
  }

  return {
    setAct: (act) => { st.act = act; st.actUntil = 0 },
    wave: () => { if (st.mode !== 'out' && st.mode !== 'in') { st.mode = 'wave'; st.modeT = 0 } },
    warp: () => { st.nextWarp = 0 },
    setPointer: (x, y) => {
      ray.setFromCamera(toNdc(x, y), camera)
      st.cursor = ray.ray.intersectPlane(plane, new THREE.Vector3())
      st.cursorAt = clock.elapsedTime
    },
    clearPointer: () => { st.cursor = null },
    hitTest: (x, y) => {
      // The globe's projected circle, plus a box round the legs and shoes.
      const s = F.figure.scale.x, cx = st.x, lift = F.figure.position.y
      const c = project(new THREE.Vector3(cx, (2.0 * s) + lift, 0))
      const edge = project(new THREE.Vector3(cx + 1.15 * s, (2.0 * s) + lift, 0))
      const rad = Math.abs(edge.x - c.x)
      if (Math.hypot(x - c.x, y - c.y) <= rad) return true
      const feet = project(new THREE.Vector3(cx, lift, 0))
      return Math.abs(x - c.x) <= rad * 0.6 && y >= c.y && y <= feet.y + 8
    },
    anchor: () => project(new THREE.Vector3(st.x, 3.2 * F.figure.scale.x + F.figure.position.y, 0)),
    setOptions: (p) => { opts = { ...opts, ...p }; resize() },
    setBusy: (busy) => { st.busy = busy },
    dispose: () => {
      cancelAnimationFrame(raf); ro.disconnect(); document.removeEventListener('visibilitychange', onVis)
      renderer.dispose(); rt.dispose()
    },
  }
}
```

- [ ] **Step 3: Check it builds** — `npx tsc --noEmit 2>&1 | grep -v '^\.next'` prints nothing; eslint clean on `src/components/assistant/engine`.

- [ ] **Step 4: Commit**

```bash
git add src/components/assistant/engine/motion.ts src/components/assistant/engine/engine.ts
git commit -m "feat(assistant): the motion and the engine API he is driven through"
```

---

### Task 9: The stage — idle loading, pointer routing, mobile, fallback

**Files:**
- Create: `src/components/assistant/mr-worldwide.tsx`, `src/components/assistant/assistant.tsx`, `src/components/assistant/stage.tsx`
- Modify: `src/app/[locale]/layout.tsx` (mount next to `<QuickContactDock />`), `src/app/globals.css`

**Interfaces:**
- Consumes: `createEngine`, `Engine`, `Act` (Task 8); `land.png` via `import land from '@/assets/ai/land.png'` (`land.src`).
- Produces: `<MrWorldwide />` (no props, idle-loads `assistant.tsx`); `assistant.tsx` default export `Assistant()` (owns `open` and the engine; Task 10 adds the chat); `stage.tsx` default export `Stage({ onReady, onOpen, busy }: { onReady(e: Engine | null): void; onOpen(): void; busy: boolean })` — canvas, or the fallback button without WebGL; clicking him calls `engine.wave()` then `onOpen()`.

- [ ] **Step 1: `mr-worldwide.tsx`**

```tsx
'use client'

import dynamic from 'next/dynamic'
import { useEffect, useState } from 'react'
import { usePathname } from '@/i18n/navigation'

// Nothing of him is in the first load: the chunk is fetched once the page is idle.
const Assistant = dynamic(() => import('./assistant'), { ssr: false })

export function MrWorldwide() {
  const pathname = usePathname()
  const [ready, setReady] = useState(false)
  useEffect(() => {
    const go = () => setReady(true)
    const id = 'requestIdleCallback' in window ? window.requestIdleCallback(go, { timeout: 4000 }) : window.setTimeout(go, 2500)
    return () => ('cancelIdleCallback' in window ? window.cancelIdleCallback(id as number) : clearTimeout(id as number))
  }, [])
  if (!ready || pathname.startsWith('/studio')) return null
  return <Assistant />
}
```

Create `src/components/assistant/assistant.tsx` (the lazily loaded root that owns chat state; Task 10 fills in the chat):

```tsx
'use client'

import { useState } from 'react'
import Stage from './stage'
import type { Engine } from './engine/engine'

export default function Assistant() {
  const [engine, setEngine] = useState<Engine | null>(null)
  const [open, setOpen] = useState(false)
  return <Stage onReady={setEngine} onOpen={() => setOpen(true)} busy={open} />
}
```

- [ ] **Step 2: `stage.tsx`**

```tsx
'use client'

import { useEffect, useRef, useState } from 'react'
import land from '@/assets/ai/land.png'
import { createEngine, type Engine } from './engine/engine'

const DOCK_PX = 72   // the quick-contact dock's column at the right (quick-contact.tsx)

function webgl() {
  try { return !!document.createElement('canvas').getContext('webgl2') } catch { return false }
}

export default function Stage({ onReady, onOpen, busy }: { onReady(e: Engine | null): void; onOpen(): void; busy: boolean }) {
  const canvas = useRef<HTMLCanvasElement>(null)
  const engine = useRef<Engine | null>(null)
  const [fallback, setFallback] = useState(false)
  const [hidden, setHidden] = useState(false)

  useEffect(() => {
    if (!canvas.current || !webgl()) { setFallback(true); onReady(null); return }
    const mobile = matchMedia('(max-width: 639px)')
    const reduce = matchMedia('(prefers-reduced-motion: reduce)')
    const e = createEngine(canvas.current, land.src, { mobile: mobile.matches, reducedMotion: reduce.matches, rightReserve: DOCK_PX })
    engine.current = e
    onReady(e)
    const opts = () => e.setOptions({ mobile: mobile.matches, reducedMotion: reduce.matches })
    mobile.addEventListener('change', opts); reduce.addEventListener('change', opts)

    // The canvas never takes clicks unless the pointer is over him.
    const move = (ev: PointerEvent) => {
      e.setPointer(ev.clientX, ev.clientY)
      const over = e.hitTest(ev.clientX, ev.clientY)
      canvas.current!.style.pointerEvents = over ? 'auto' : 'none'
      canvas.current!.style.cursor = over ? 'pointer' : ''
    }
    const leave = () => e.clearPointer()
    addEventListener('pointermove', move, { passive: true })
    document.addEventListener('pointerleave', leave)

    // Phones: out of the way while scrolling down, back when it stops.
    let lastY = scrollY, timer = 0
    const scroll = () => {
      if (!mobile.matches) return
      if (scrollY > lastY + 4) setHidden(true)
      lastY = scrollY
      clearTimeout(timer); timer = window.setTimeout(() => setHidden(false), 600)
    }
    addEventListener('scroll', scroll, { passive: true })
    return () => {
      removeEventListener('pointermove', move); document.removeEventListener('pointerleave', leave)
      removeEventListener('scroll', scroll); mobile.removeEventListener('change', opts); reduce.removeEventListener('change', opts)
      e.dispose(); engine.current = null; onReady(null)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => engine.current?.setBusy(busy), [busy])

  if (fallback) {
    return (
      <button type="button" onClick={onOpen} aria-label="Mr. Worldwide" className="mw-fallback fixed bottom-4 left-4 z-30 grid size-12 place-items-center rounded-full">
        <span aria-hidden>🌍</span>
      </button>
    )
  }
  return (
    <canvas
      ref={canvas}
      role="button"
      tabIndex={0}
      aria-label="Mr. Worldwide — ask about this site"
      onClick={() => { engine.current?.wave(); onOpen() }}
      onKeyDown={(ev) => { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); engine.current?.wave(); onOpen() } }}
      className={`mw-stage pointer-events-none fixed inset-x-0 bottom-0 z-30 h-[300px] w-full transition-transform duration-300 max-sm:h-[210px] ${hidden ? 'translate-y-full' : ''}`}
    />
  )
}
```

`globals.css` — append:

```css
/* Mr. Worldwide's glow: the canvas is transparent, the glow follows his shape. */
.mw-stage {
  filter: drop-shadow(0 0 10px rgb(255 138 61 / 0.85)) drop-shadow(0 0 28px rgb(255 138 61 / 0.45));
}
.mw-stage:focus-visible { outline: 2px solid var(--brand-strong); outline-offset: -4px; }
.mw-fallback { background: #ff8a3d; color: #1a0d05; box-shadow: 0 0 18px rgb(255 138 61 / 0.7); }
```

- [ ] **Step 3: Mount** — in `src/app/[locale]/layout.tsx` import `{ MrWorldwide } from '@/components/assistant/mr-worldwide'` and render `<MrWorldwide />` directly after `<QuickContactDock />`.

- [ ] **Step 4: Look at it** — with `npx next dev -p 3100` open `/en` in Playwright (headful, GPU), wait 5 s, screenshot the bottom 320 px: he walks, amber, outlined; move the pointer near him → he stops and turns; `/en/studio` shows no canvas. Check a link under the strip still receives a click (`page.click` on a footer link near the bottom-left while he is at the right). With `page.emulateMedia({ reducedMotion: 'reduce' })`, two screenshots 3 s apart show him in the same place (breathing and blinking only). At 390 px wide he stands small in the bottom-left corner, clear of the quick-contact dock, and slides away while scrolling down.

- [ ] **Step 5: Commit**

```bash
git add src/components/assistant/mr-worldwide.tsx src/components/assistant/assistant.tsx src/components/assistant/stage.tsx src/app/[locale]/layout.tsx src/app/globals.css
git commit -m "feat(assistant): Mr. Worldwide walks the bottom of every page, idle-loaded"
```

---

### Task 10: The hologram screen

**Files:**
- Create: `src/components/assistant/hologram-chat.tsx`
- Modify: `src/components/assistant/assistant.tsx`, `src/app/globals.css`, `src/messages/th.json`, `src/messages/en.json`, `src/messages/ja.json`

**Interfaces:**
- Consumes: `useAssistant` (Task 6), `Engine`/`Act` (Task 8), `AiItem` (Task 1).
- Produces: `HologramChat({ open, onClose, engine }: { open: boolean; onClose(): void; engine: Engine | null })`.

- [ ] **Step 1: Copy** — add an `assistant` namespace to each messages file.

`en.json`:
```json
"assistant": {
  "title": "Mr. Worldwide",
  "greeting": "Hey there! I know every project and article on this site. What are you curious about?",
  "suggest1": "What's the best project?",
  "suggest2": "Any articles about AI?",
  "suggest3": "What does Chakkrit build with?",
  "placeholder": "Ask about a project or an article…",
  "send": "Send",
  "close": "Close",
  "retry": "Try again",
  "project": "Project",
  "post": "Article",
  "minutes": "{n} min",
  "err_rate_limited": "Whoa, slow down! Give me {s} seconds to catch my breath.",
  "err_quota": "I've talked the whole day away — I'm resting now. Come back tomorrow!",
  "err_upstream": "My signal flickered. Try that again?",
  "err_network": "Lost you for a second there. Try again?",
  "err_bad_request": "I couldn't read that one. Could you ask it another way?"
}
```

`th.json`:
```json
"assistant": {
  "title": "Mr. Worldwide",
  "greeting": "หวัดดี! ผมรู้จักทุกโปรเจคและทุกบทความในเว็บนี้ อยากรู้เรื่องอะไรถามมาได้เลย",
  "suggest1": "โปรเจคไหนเด็ดสุด?",
  "suggest2": "มีบทความเรื่อง AI ไหม?",
  "suggest3": "จักรกริชใช้อะไรทำงานบ้าง?",
  "placeholder": "ถามเรื่องโปรเจคหรือบทความ…",
  "send": "ส่ง",
  "close": "ปิด",
  "retry": "ลองอีกครั้ง",
  "project": "โปรเจค",
  "post": "บทความ",
  "minutes": "{n} นาที",
  "err_rate_limited": "ช้าหน่อยๆ! ขอพักหายใจ {s} วินาทีนะ",
  "err_quota": "วันนี้คุยจนหมดแรงแล้ว ขอพักก่อน พรุ่งนี้มาใหม่นะ!",
  "err_upstream": "สัญญาณผมกะพริบไปแป๊บ ลองถามอีกทีได้ไหม?",
  "err_network": "หลุดไปแป๊บนึง ลองอีกครั้งนะ",
  "err_bad_request": "อ่านข้อความนี้ไม่ออก ลองถามแบบอื่นได้ไหม?"
}
```

`ja.json`: the English block (Japanese is UI-only on this site; answers are in English).

- [ ] **Step 2: `hologram-chat.tsx`**

```tsx
'use client'

import { useEffect, useRef, useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { useAssistant } from './use-assistant'
import type { Engine } from './engine/engine'

export function HologramChat({ open, onClose, engine }: { open: boolean; onClose(): void; engine: Engine | null }) {
  const t = useTranslations('assistant')
  const locale = useLocale()
  const lang = locale === 'th' ? 'th' : 'en'
  const { messages, status, error, send, retry, items } = useAssistant(lang)
  const dialog = useRef<HTMLDialogElement>(null)
  const log = useRef<HTMLDivElement>(null)
  const [draft, setDraft] = useState('')

  useEffect(() => {
    const d = dialog.current
    if (!d) return
    if (open && !d.open) d.showModal()
    if (!open && d.open) d.close()
  }, [open])

  // He acts out the conversation.
  useEffect(() => {
    if (!engine) return
    const last = messages.at(-1)
    if (status === 'thinking') engine.setAct('think')
    else if (status === 'talking') engine.setAct('talk')
    else if (last?.cards?.length) engine.setAct('point')
    else engine.setAct(null)
  }, [engine, status, messages])

  useEffect(() => { log.current?.scrollTo({ top: log.current.scrollHeight }) }, [messages])

  const submit = (text: string) => { send(text); setDraft('') }
  const errorText = error && t(`err_${error.code}`, { s: error.retryAfter ?? 60 })

  return (
    <dialog
      ref={dialog}
      className="mw-screen"
      aria-label={t('title')}
      onClose={() => { onClose(); engine?.setAct(null); engine?.wave() }}
      onClick={(e) => { if (e.target === dialog.current) dialog.current?.close() }}
    >
      <div className="mw-screen-head">
        <span className="mw-dot" aria-hidden /> {t('title')}
        <button type="button" className="mw-close" onClick={() => dialog.current?.close()} aria-label={t('close')}>×</button>
      </div>
      <div ref={log} className="mw-log" aria-live="polite">
        <p className="mw-him">&gt; {t('greeting')}</p>
        {messages.length === 0 && (
          <div className="mw-chips">
            {(['suggest1', 'suggest2', 'suggest3'] as const).map((k) => (
              <button key={k} type="button" onClick={() => submit(t(k))}>{t(k)}</button>
            ))}
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={m.role === 'user' ? 'mw-me' : 'mw-him'}>
            {m.role === 'assistant' ? '> ' : ''}{m.content || (status === 'thinking' && i === messages.length - 1 ? '…' : '')}
            {m.cards?.map((id) => {
              const it = items.get(id)
              if (!it) return null
              return (
                <a key={id} href={it.url} className="mw-card">
                  {it.cover ? <img src={it.cover} alt="" loading="lazy" /> : <span className="mw-card-blank" aria-hidden />}
                  <span><b>{it.title}</b><small>{t(it.kind)} · {t('minutes', { n: it.minutes })}</small></span>
                </a>
              )
            })}
          </div>
        ))}
        {errorText && (
          <p className="mw-him mw-err">&gt; {errorText} {error!.code !== 'quota' && error!.code !== 'rate_limited' && <button type="button" onClick={retry}>{t('retry')}</button>}</p>
        )}
      </div>
      <form className="mw-input" onSubmit={(e) => { e.preventDefault(); submit(draft) }}>
        <span aria-hidden>▌</span>
        <input value={draft} onChange={(e) => setDraft(e.target.value)} maxLength={1000} placeholder={t('placeholder')} aria-label={t('placeholder')} />
        <button type="submit" disabled={!draft.trim()}>{t('send')}</button>
      </form>
    </dialog>
  )
}
```

- [ ] **Step 3: Wire into `assistant.tsx`**

```tsx
'use client'

import { useState } from 'react'
import Stage from './stage'
import { HologramChat } from './hologram-chat'
import type { Engine } from './engine/engine'

export default function Assistant() {
  const [engine, setEngine] = useState<Engine | null>(null)
  const [open, setOpen] = useState(false)
  return (
    <>
      <Stage onReady={setEngine} onOpen={() => setOpen(true)} busy={open} />
      <HologramChat open={open} onClose={() => setOpen(false)} engine={engine} />
    </>
  )
}
```

- [ ] **Step 4: Styles** — append to `globals.css` (the amber screen of the approved mock-up C):

```css
.mw-screen {
  width: min(560px, calc(100vw - 32px)); max-height: min(560px, calc(100dvh - 260px));
  margin: auto auto 250px; padding: 0; display: flex; flex-direction: column;
  background: #0b0b12; color: #f2e6dc; border: 1px solid #ff8a3d;
  box-shadow: 0 0 24px rgb(255 138 61 / 0.45); font-family: var(--font-mono), ui-monospace, monospace; font-size: 14px;
  animation: mw-on 380ms steps(6, end);
}
.mw-screen[open] { display: flex; }
.mw-screen::backdrop { background: rgb(5 5 8 / 0.6); }
@keyframes mw-on { 0% { opacity: 0; transform: scaleY(0.02); } 40% { opacity: 1; transform: scaleY(0.02); } 100% { transform: none; } }
.mw-screen-head { display: flex; align-items: center; gap: 8px; padding: 10px 12px; border-bottom: 1px solid rgb(255 138 61 / 0.35); color: #ffb27a; letter-spacing: 0.06em; text-transform: uppercase; font-size: 12px; }
.mw-dot { width: 8px; height: 8px; border-radius: 50%; background: #ff8a3d; box-shadow: 0 0 8px #ff8a3d; }
.mw-close { margin-left: auto; font-size: 18px; line-height: 1; }
.mw-log { flex: 1; overflow-y: auto; padding: 12px; display: grid; gap: 10px; align-content: start; }
.mw-him { color: #ffd2b0; border: 1px solid rgb(255 138 61 / 0.35); padding: 8px 10px; white-space: pre-wrap; }
.mw-me { justify-self: end; max-width: 85%; background: var(--brand); color: #fff; padding: 8px 10px; white-space: pre-wrap; }
.mw-err button, .mw-chips button { border: 1px solid #ff8a3d; color: #ffb27a; padding: 4px 8px; margin: 4px 6px 0 0; }
.mw-chips { display: flex; flex-wrap: wrap; }
.mw-card { display: flex; gap: 10px; align-items: center; margin-top: 8px; border: 1px solid rgb(255 138 61 / 0.35); padding: 6px; color: #f2e6dc; text-decoration: none; }
.mw-card img, .mw-card-blank { width: 64px; height: 40px; object-fit: cover; background: linear-gradient(135deg, #0000ff, #7a7aff); flex: none; }
.mw-card small { display: block; opacity: 0.7; font-size: 11px; }
.mw-input { display: flex; align-items: center; gap: 8px; padding: 10px 12px; border-top: 1px solid rgb(255 138 61 / 0.35); }
.mw-input input { flex: 1; background: transparent; outline: none; color: #fff; }
.mw-input button { background: var(--brand); color: #fff; padding: 4px 10px; }
.mw-input button:disabled { opacity: 0.4; }
@media (max-width: 639px) { .mw-screen { width: 100vw; height: 100dvh; max-height: none; margin: 0; } }
```

- [ ] **Step 5: Try it end to end** — set `NEXT_PUBLIC_ASSISTANT_URL=https://chakkritton.com/api/assistant` in `.env.local` and add `http://localhost:3100` to the Worker's `ALLOWED_ORIGINS` (`wrangler.toml`, redeploy) — or leave the default and test against production after pushing. Open `/en`, click him: he waves, the screen switches on, the chips show; ask "Any IoT projects?": he THINKS, then TALKS as the text streams, then POINTS; a card for SMTrack+ links to its page; Esc closes and he waves; focus returns to the canvas. Repeat on `/` (Thai) and at 390 px width (full screen).

- [ ] **Step 6: Commit**

```bash
git add src/components/assistant src/app/globals.css src/messages
git commit -m "feat(assistant): the hologram screen — ask Mr. Worldwide about the site"
```

---

### Task 11: Verification and ship

**Files:**
- Create: `scripts/check-assistant.mjs`

- [ ] **Step 1: The browser checks** — `scripts/check-assistant.mjs`

```js
// Run against a production build: npx next build && npx next start -p 3941, then node scripts/check-assistant.mjs
import { chromium } from 'playwright'

const BASE = process.env.BASE ?? 'http://localhost:3941'
const fail = []
const ok = (cond, msg) => { if (!cond) fail.push(msg) }
const stub = (page) =>
  page.route('**/api/assistant', (r) =>
    r.fulfill({ status: 200, headers: { 'Content-Type': 'text/event-stream' }, body: 'event: text\ndata: {"t":"SMTrack+ is the one!"}\n\nevent: cards\ndata: {"ids":["project:en:smtrack-plus"]}\n\nevent: done\ndata: {}\n\n' }),
  )

const browser = await chromium.launch({ headless: false, args: ['--window-position=3000,3000'] })
for (const [label, viewport] of [['desktop', { width: 1440, height: 900 }], ['mobile', { width: 390, height: 844 }]]) {
  const page = await browser.newPage({ viewport })
  const errors = []
  page.on('pageerror', (e) => errors.push(e.message))
  await stub(page)
  await page.goto(`${BASE}/en/blog`, { waitUntil: 'networkidle' })
  await page.waitForSelector('canvas.mw-stage', { timeout: 10000 })
  await page.waitForTimeout(1500)

  // A link under the strip, away from him, still takes the click.
  const hit = await page.evaluate(() => {
    const c = document.querySelector('canvas.mw-stage').getBoundingClientRect()
    const x = window.innerWidth / 2, y = c.top + 20
    return document.elementFromPoint(x, y)?.tagName
  })
  ok(hit !== 'CANVAS', `${label}: the strip blocks the page (${hit})`)

  // Open, ask, see a card, close with Esc.
  await page.evaluate(() => document.querySelector('canvas.mw-stage').click())
  await page.waitForSelector('dialog.mw-screen[open]')
  await page.fill('.mw-input input', 'Any IoT projects?')
  await page.keyboard.press('Enter')
  await page.waitForSelector('.mw-card', { timeout: 5000 })
  ok((await page.textContent('.mw-log')).includes('SMTrack+'), `${label}: answer text missing`)
  await page.keyboard.press('Escape')
  ok(!(await page.$('dialog.mw-screen[open]')), `${label}: Esc did not close`)
  ok(errors.length === 0, `${label}: page errors ${errors.join(' | ')}`)

  // No layout shift from him.
  const cls = await page.evaluate(() => new Promise((res) => { let v = 0; new PerformanceObserver((l) => { for (const e of l.getEntries()) if (!e.hadRecentInput) v += e.value }).observe({ type: 'layout-shift', buffered: true }); setTimeout(() => res(v), 500) }))
  ok(cls < 0.01, `${label}: CLS ${cls}`)
  await page.close()
}

// No WebGL: the fallback button.
const noGl = await chromium.launch({ args: ['--disable-webgl', '--disable-3d-apis'] })
const p2 = await noGl.newPage()
await p2.goto(`${BASE}/en`, { waitUntil: 'networkidle' })
await p2.waitForTimeout(3000)
ok(!!(await p2.$('.mw-fallback')), 'no-WebGL fallback missing')
await noGl.close()

// Studio has no Mr. Worldwide.
const p3 = await browser.newPage()
await p3.goto(`${BASE}/en/studio/login`, { waitUntil: 'networkidle' })
await p3.waitForTimeout(3000)
ok(!(await p3.$('canvas.mw-stage')), 'studio shows the character')
await browser.close()

console.log(fail.length ? `FAIL\n- ${fail.join('\n- ')}` : 'all assistant checks passed')
process.exit(fail.length ? 1 : 0)
```

- [ ] **Step 2: Run it** — `npm run build && (npx next start -p 3941 &) && sleep 8 && node scripts/check-assistant.mjs` → `all assistant checks passed`. Stop the server.

- [ ] **Step 3: Performance** — with the same build, run Lighthouse (`CHROME_PATH=$(node -e "console.log(require('playwright').chromium.executablePath())") npx -y lighthouse@12 http://localhost:3941/en --preset=desktop --only-categories=performance --quiet --output=json --output-path=/tmp/lh-mw.json`) and the mobile run; compare with the numbers before this work (desktop 0.96, mobile 0.76): neither may drop. Confirm the `three` chunk is not in the page's initial `<script>` tags: `curl -s localhost:3941/en | grep -c three` prints `0`.

- [ ] **Step 4: Ship** — commit the script, push `main`, then open https://chakkritton.com/en after the deploy and talk to him in both languages.

```bash
git add scripts/check-assistant.mjs
git commit -m "test(assistant): browser checks for Mr. Worldwide"
git push origin main
```

- [ ] **Step 5: Record** — update `/Users/chakkrit/.claude/projects/-Volumes-SSD256GB-WebProfile/memory/portfolio-neo-editorial.md` (or a new `mr-worldwide.md` memory) with: the Worker's name and route, that deploys run from `worker/` with Wrangler, the free-allowance behaviour, and that the character's reference is `docs/superpowers/prototypes/mr-worldwide/`.
