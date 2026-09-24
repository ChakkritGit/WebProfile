# Mr. Worldwide — the site's AI guide

Status: design approved in conversation on 2026-09-24; this document awaits review.
Visual source of truth: `docs/superpowers/prototypes/mr-worldwide/index.html` (v18).

## What it is, and why

A character who lives on every public page of chakkritton.com and answers
questions about the site: which projects and articles exist, what they cover,
which to read for a given interest, what a tag means here. Visitors click him and
talk to him; he recommends real pages with cards that link to them.

Success means:

- A visitor can ask in Thai or English and get a short, correct answer about
  this site's content, with links to real pages — never an invented one.
- The character feels alive (walks, reacts, warps) without slowing the site:
  no change to LCP, CLS or the PageSpeed score, and no blocked clicks.
- It costs nothing at this traffic: it runs inside Workers AI's free daily
  allowance, and says so kindly when that runs out.

Out of scope: answering general questions unrelated to the site, remembering
visitors across sessions, any server-side storage of conversations, the studio.

## The character (settled)

An original globe character in the 1930s rubber-hose cartoon style, projected
as a hologram. Male, named **Mr. Worldwide**. Inspired by Miss Minute's look but
copying none of her design.

- Amber `#FF8A3D` body; the real world map (Natural Earth 1:50m land, public
  domain) as flat land fills with inked coastlines; turns slowly on his axis.
- Flat cel shading with one hard shadow step; an ink line of constant pixel
  width round every part (finer on the fingers).
- Drawn solid into a texture, then made a hologram as one picture:
  see-through (~0.78), rolling scanlines, a slight RGB fringe, flicker, and an
  amber glow. Parts never show through one another.
- Face that slides round the globe; 3D eyeballs with rolling pupils, lids that
  blink, a fixed highlight; thick brows; a mouth that opens to talk.
- Five-finger gloves with the thumb on the inner side; relaxed open hands at
  rest. Thin ink rubber-hose legs; all-white cartoon sneakers that rock on the
  heel or the toe, the leg always entering the ankle opening.

Behaviour:

- **Walk:** one gait cycle drives everything (footfall dip, weight shift, hip
  and shoulder counter-rotation, arms trailing legs, heel strike, toe-off).
  Eases into turns with a spring; body faces the way he walks, face slides
  toward the viewer.
- **Warp:** crouch, hop, a fast vortex into white light, a point with a
  horizontal flare and a fading ring; the reverse to arrive, then a landing.
- **Reactions:** notices a nearby pointer (stops, brows up, eyes and face
  follow it); wave on click (raise with overshoot, forearm swings from the
  elbow, wrist follows, body leans away); idle pauses and hands-on-hips;
  THINKING (hand to chin, one brow up, foot tap); TALKING (syllable mouth,
  palm-up gestures); POINTING (index finger, eyes follow).

## Architecture

```
browser ──POST /api/assistant──▶ Cloudflare Worker "mr-worldwide" ──▶ Workers AI (qwen3-30b)
   ▲          (zone route, same origin)        │
   │                                           └─GET /ai/index.json, /ai/item/… (cached)
   └── stream: text + card ids                         ▲
                                                Next.js on Vercel (content from Postgres)
```

The Worker is a route on the chakkritton.com zone, so it answers
`/api/assistant` before the request reaches Vercel: same origin, no CORS.

### 1. Content endpoints (portfolio, Next.js)

- `GET /ai/index.json` — every published post and project in th and en:
  `{ id, kind, locale, slug, url, title, summary, tags, stack?, minutes, cover }`.
  Built with `listPosts`/`listProjects` (published only), like `llms.txt`.
  Rendered per request (`force-dynamic`), CDN `s-maxage=60`, like the feed.
- `GET /ai/item/{kind}/{locale}/{slug}.txt` — one published item's full text as
  plain text (Editor.js to text via the existing `documentToText`), capped at
  ~6,000 characters. 404 for drafts or unknown items.
- The Worker caches both for 5 minutes, so a publish reaches the chat within
  about five minutes. No change to `revalidateContent()`.
- Both live in `src/app/ai/` (outside `[locale]`). Each path contains a dot, so
  the proxy's matcher (`.*\\.[^/]*$`) already passes them through unlocalised;
  the proxy itself is not changed.

### 2. The Worker (`worker/` in the portfolio repo, deployed with Wrangler)

- **Request:** `POST /api/assistant` with
  `{ messages: [{ role, content }] (last 8, each ≤ 1,000 chars), lang: 'th' | 'en' }`.
  Anything else is 400. Only origins in the `ALLOWED_ORIGINS` var are accepted
  (production: `https://chakkritton.com`; add `http://localhost:3000` while
  developing, with CORS answered for those origins only). The page reads the
  endpoint from `NEXT_PUBLIC_ASSISTANT_URL`, defaulting to `/api/assistant`.
- **Index:** fetched from `/ai/index.json` through the Cloudflare cache
  (`cf.cacheTtl` 300 s).
- **Retrieval:** score each item against the latest user message by
  title, tag, stack and summary term overlap (Thai matched on substrings, since
  it has no word spaces). The top two items (score above a floor) get their
  full text from `/ai/item/…/{slug}.txt`; every item goes in as one compact index line.
- **Model:** `@cf/qwen/qwen3-30b-a3b-fp8`, max 400 output tokens, streamed.
  System prompt sets the persona — a cheerful, playful, slightly teasing host,
  short answers, replies in the user's language, talks only about this site,
  never names a page that is not in the index, and ends recommendations with a
  machine-readable line `CARDS: id1,id2`.
- **Response:** Server-Sent Events: `text` deltas, then one `cards` event with
  ids validated against the index (unknown ids dropped), then `done`. The
  `CARDS:` line is stripped from the text.
- **Limits:** Workers Rate Limiting binding, 8 requests per IP per 60 seconds
  (the binding's windows are 10 s or 60 s only).
- **Errors → codes** the page turns into lines in his voice: `rate_limited`
  (with seconds to wait), `quota` (daily allowance used), `upstream` (model
  failed), `bad_request`.

### 3. The page (portfolio, Next.js client)

- `<MrWorldwide />` mounted in `src/app/[locale]/layout.tsx` next to
  `QuickContactDock`; not rendered under `/studio`.
- Loaded with `next/dynamic` after `requestIdleCallback`, so none of it is in
  the first load. three.js is imported only inside it.
- **Stage:** a fixed, transparent canvas along the bottom of the viewport,
  `pointer-events: none` except when the pointer is over him — tested against
  his projected outline (the globe's circle plus a box round the legs), not by
  reading pixels back from the GPU, which would stall a frame — so it never
  blocks the page.
- **Desktop:** walks the bottom edge, turning before the Quick Contact dock at
  the right; warps to a new spot every 40–90 s.
- **Mobile (< 640px):** smaller, standing in the bottom-left corner; hides on
  scroll down, returns when scrolling stops.
- **Reduced motion:** stands still, breathing and blinking only; no walk, no
  warp.
- Rendering pauses while the tab is hidden or the stage is off screen, and
  draws at 30fps while he only idles or cruises (60fps for warps, waves,
  pointer reactions and the chat), as the tag orb does.
- **No WebGL:** a small 2D globe button in the same place opens the chat.

### 4. The hologram screen (the chat)

- Opening: he waves, the page dims, and an amber screen projects above him
  with a switch-on flicker. On mobile it fills the viewport.
- A greeting and three suggested questions (in the page language).
- Messages stream in; while waiting he THINKS, while text streams he TALKS,
  when cards arrive he POINTS toward them. Closing: he waves goodbye.
- Cards: cover, title, kind, reading time; each links to the page.
- A real modal dialog: focus trapped, Esc closes, focus returns to him;
  messages announced through a polite live region.
- Conversation kept in `sessionStorage` for the tab; nothing on a server.
- Copy for the screen lives in `src/messages/{th,en,ja}.json` under `assistant`.

## Error handling

| Case | Behaviour |
|---|---|
| Daily AI allowance used | "I'm resting today — come back tomorrow" in his voice |
| Rate limited | Asks the visitor to wait, with a countdown |
| Off-topic question | Steers back to projects and articles (system prompt) |
| Stream drops mid-answer | Keeps the partial text, shows "Try again" |
| Index or item fetch fails | Answers from what it has; if the index is missing, `upstream` |
| Model names an unknown page | Card dropped by the Worker's id check |
| No WebGL | 2D globe button fallback |

## Testing

- Worker (vitest): scoring and selection, prompt building (persona, language,
  index lines), `CARDS:` parsing and id validation, request validation, error
  code mapping. The Workers AI binding is faked.
- Portfolio: `/ai/index.json` contains no drafts; `/ai/item/….txt` 404s for drafts.
- Playwright, desktop and mobile widths:
  - page links under the character's canvas stay clickable;
  - clicking him opens the dialog; Esc closes it; focus returns;
  - a streamed answer (Worker stubbed) renders text and cards;
  - WebGL disabled shows the fallback button;
  - reduced motion: no walking;
  - CLS stays 0 and main-thread time is within 10% of today's home page.
- Before merge: a production build and a PageSpeed run on `/en`; the score
  must not drop.

## Operations

- One-time: install Wrangler, `wrangler login` (the user runs it), deploy the
  Worker, add the zone route `chakkritton.com/api/assistant*`.
- Workers AI free allowance: 10,000 Neurons/day; at ~25 Neurons per message
  that is roughly 400 messages a day.
- The prototype stays in `docs/superpowers/prototypes/mr-worldwide/` as the
  reference for the character.
