'use client'

import { useSyncExternalStore } from 'react'
import { useReducedMotion } from 'motion/react'
import { festivalById, festivalOn, type Festival, type FestivalId } from '@/config/festivals'
import { useIsMounted } from '@/lib/hooks'

/**
 * Seasonal dressing for the navbar — and only the navbar: a drifting layer of
 * glyphs, a tint, and an ornament on the logo. The full-screen greeting and the
 * closing scenes that used to play over the home page are gone on purpose.
 *
 * The date is read **after mount**, never during render. Pages here are
 * prerendered at build time, so a server-side check would freeze whatever
 * festival was running the day the site was deployed — and would disagree with
 * the client's clock, which is a hydration error. Nothing renders until the
 * effect has run, so the first paint is always the plain header.
 *
 * `?festival=christmas` forces one, which is the only practical way to look at
 * December in April.
 */
export function useFestival(): Festival | null {
  // The existing hydration-safe flag rather than an effect that sets state: the
  // server snapshot is `false`, so the markup React renders on both sides matches
  // and the dressing only appears once the client's own clock is available.
  const mounted = useIsMounted()
  // Subscribed so a choice in the picker redraws the header straight away; the
  // URL it writes is not something React can see change.
  useFestivalPlayKey()
  if (!mounted) return null

  return festivalById(forcedId()) ?? festivalOn(new Date())
}

/* ------------------------- playing one on demand ------------------------- */

/**
 * A counter the picker bumps to replay whatever is in the URL.
 *
 * Setting `?festival=` to the value it already had changes nothing React can see,
 * so pressing the same festival twice would do nothing. The count is the thing
 * that changes, and `useFestival` subscribes to it.
 */
let playCount = 0
const playListeners = new Set<() => void>()

function subscribePlay(notify: () => void) {
  playListeners.add(notify)
  return () => {
    playListeners.delete(notify)
  }
}

/** Put a festival in the URL and play it. An empty id hands the page back to the
 *  calendar. */
export function playFestival(id: string) {
  const url = new URL(window.location.href)
  if (id) url.searchParams.set('festival', id)
  else url.searchParams.delete('festival')
  // The hash can carry one too — see `forcedId` — so it has to be cleared from
  // there as well, or a stale override would win over the choice just made.
  url.hash = url.hash.split('?')[0]
  window.history.replaceState(null, '', url)

  playCount += 1
  playListeners.forEach((notify) => notify())
}

export function useFestivalPlayKey() {
  return useSyncExternalStore(
    subscribePlay,
    () => playCount,
    () => 0,
  )
}

/**
 * The `festival` override, from wherever it ended up in the URL.
 *
 * It belongs in the query string, but a heading link on an article already ends
 * in a `#fragment`, and appending `?festival=…` to that puts the whole thing
 * inside the hash where `location.search` cannot see it. Since this only exists
 * to preview a season out of season, it reads both rather than being right and
 * unhelpful.
 */
function forcedId(): string {
  const fromQuery = new URLSearchParams(window.location.search).get('festival')
  if (fromQuery) return fromQuery
  const hash = window.location.hash
  const at = hash.indexOf('?')
  return at === -1 ? '' : (new URLSearchParams(hash.slice(at + 1)).get('festival') ?? '')
}

/* ------------------------------ the glyphs ------------------------------ */

const S = { fill: 'none', strokeLinecap: 'round', strokeLinejoin: 'round' } as const

/** What a firework opens into. Rotated per shell so no two look alike. */
const FIREWORK_HUES = ['#ffd166', '#ff6b8a', '#4fc3f7', '#7c5cff', '#5ddba4', '#ff9f45']

/**
 * A shell that climbs and then opens into colours.
 *
 * Two layers on one clock: the rocket is a bright head with a short tail, and it
 * is switched off at the exact frame the shell starts to open — see the
 * `festival-launch` rules, where both children take their timing from the
 * parent.
 */
/** The open shell, in a 32-unit box. Shared by the header and the finale. */
function shellPaths(seed: number) {
  return (
    <>
      <g strokeLinecap="round">
        {Array.from({ length: 12 }, (_, i) => {
          const a = ((i * 30 + seed * 11) * Math.PI) / 180
          const len = i % 2 ? 11 : 14
          const hue = FIREWORK_HUES[(i + seed) % FIREWORK_HUES.length]
          return (
            <g key={i} stroke={hue} fill={hue}>
              <path
                strokeWidth={i % 2 ? 1.4 : 1.9}
                d={`M${16 + Math.cos(a) * 4} ${16 + Math.sin(a) * 4}L${16 + Math.cos(a) * len} ${16 + Math.sin(a) * len}`}
              />
              <circle cx={16 + Math.cos(a) * (len + 1.7)} cy={16 + Math.sin(a) * (len + 1.7)} r={i % 2 ? 0.9 : 1.3} stroke="none" />
            </g>
          )
        })}
      </g>
      <circle cx="16" cy="16" r="2.3" fill="#fffbe8" />
    </>
  )
}

function Firework({ seed }: { seed: number }) {
  const head = FIREWORK_HUES[seed % FIREWORK_HUES.length]

  return (
    <>
      <svg viewBox="-2 -2 36 36" className="fw-rocket absolute inset-0 size-full">
        <path d="M16 11v8" stroke={head} strokeWidth="1.6" strokeLinecap="round" opacity="0.5" />
        <circle cx="16" cy="10" r="1.7" fill={head} />
      </svg>
      <svg viewBox="-2 -2 36 36" className="fw-shell absolute inset-0 size-full">
        {shellPaths(seed)}
      </svg>
    </>
  )
}

const GLYPHS: Record<FestivalId, (key: number) => React.ReactNode> = {
  christmas: (k) => (
    <svg key={k} viewBox="0 0 16 16" className="size-full text-[#6fb3e0]">
      <g stroke="currentColor" strokeWidth="1.6" {...S}>
        <path d="M8 2v12M2.8 5l10.4 6M13.2 5 2.8 11" />
      </g>
    </svg>
  ),
  'new-year': (k) => <Firework key={k} seed={k} />,
  valentine: (k) => (
    <svg key={k} viewBox="0 0 16 16" className="size-full text-[#ff5a6e]">
      <path
        d="M8 14 2.6 8.6a3.3 3.3 0 0 1 4.7-4.7l.7.7.7-.7a3.3 3.3 0 1 1 4.7 4.7L8 14Z"
        fill="currentColor"
      />
    </svg>
  ),
  // Blossom and water together: April is the month the golden shower flowers, and
  // it is the water that makes it Songkran. Every third lane gets a drop, which
  // on thirteen lanes comes out four to nine — enough water to read as water
  // without the flowers losing the header.
  songkran: (k) =>
    k % 3 === 1 ? (
      <svg key={k} viewBox="0 0 16 16" className="size-full text-[#3fa0ff]">
        <path d="M8 1.8c2.9 3.7 4.4 6.3 4.4 8a4.4 4.4 0 0 1-8.8 0c0-1.7 1.5-4.3 4.4-8Z" fill="currentColor" />
        <path d="M5.9 10.6c.1-1 .5-2 1.2-2.9" fill="none" stroke="#fffcf7" strokeWidth="1.3" strokeLinecap="round" opacity="0.75" />
      </svg>
    ) : (
      <svg key={k} viewBox="0 0 16 16" className="size-full text-[#f2c53d]">
        {[0, 72, 144, 216, 288].map((deg) => (
          <ellipse key={deg} cx="8" cy="3.9" rx="2.5" ry="3.5" transform={`rotate(${deg} 8 8)`} fill="currentColor" />
        ))}
        <circle cx="8" cy="8" r="1.6" fill="#e08b1a" />
      </svg>
    ),
  'loy-krathong': (k) => (
    // A sky lantern, which is what actually goes up on the night — the krathong
    // is the thing that goes on the water, and it has the finale to itself.
    <svg key={k} viewBox="0 0 16 16" className="size-full text-[#ffb02e]">
      <path d="M8 1.4c3.1 0 4.9 2.1 4.9 4.6 0 2.1-1.1 3.9-2 5.2H5.1C4.2 9.9 3.1 8.1 3.1 6c0-2.5 1.8-4.6 4.9-4.6Z" fill="currentColor" />
      <rect x="5.2" y="10.8" width="5.6" height="1.6" rx="0.8" fill="#d9711a" />
      <circle cx="8" cy="8.4" r="1.4" fill="#fff3c4" />
    </svg>
  ),
  halloween: (k) => (
    <svg key={k} viewBox="0 0 16 16" className="size-full text-[#7c5cff]">
      <path
        d="M1 6.4c1.6-.4 2.4-1.4 2.8-2.6.7 1.3 1.7 2 3 2 .5 0 .9.4 1.2 1 .3-.6.7-1 1.2-1 1.3 0 2.3-.7 3-2 .4 1.2 1.2 2.2 2.8 2.6-1.4.5-2 1.6-2.2 3-.9-.9-1.9-1.2-3-.9-.7.2-1.3.7-1.8 1.5-.5-.8-1.1-1.3-1.8-1.5-1.1-.3-2.1 0-3 .9-.2-1.4-.8-2.5-2.2-3Z"
        fill="currentColor"
      />
    </svg>
  ),
}

/** How many glyphs, and where. Fixed so the layout never shifts between renders. */
const LANES = [4, 12, 19, 27, 35, 43, 51, 58, 66, 73, 81, 89, 95]

/** Heights, as a share of the header, for the motions that do not travel through
 *  it vertically. Kept inside the band the edge mask leaves fully opaque. */
const BURST_LANES = [16, 38, 24, 50, 32]
const DRIFT_LANES = [24, 44, 32, 52, 38]

export function FestivalDecor({ festival }: { festival: Festival }) {
  const reduce = useReducedMotion()
  const glyph = GLYPHS[festival.id]
  const burst = festival.motion === 'burst'
  const drift = festival.motion === 'drift'

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <div
        className="absolute inset-x-0 top-0 h-full"
        style={{ background: `linear-gradient(to bottom, ${festival.wash}, transparent 78%)` }}
      />
      {/* The glyphs live behind a mask that fades out at the top and bottom of the
          header. Without it they were sliced flat by the clip edge — a heart cut
          in half along a straight line reads as a rendering fault, not as one
          drifting out of view. The wash is deliberately outside it: masking that
          too would have eaten the tint at the top, which is the part you see. */}
      <div className="festival-lane absolute inset-0">
      {!reduce &&
        LANES.map((left, i) => {
          const size = (i % 3 === 0 ? 16 : i % 3 === 1 ? 11 : 13) * (burst ? 1.7 : 1)
          return (
            <span
              key={left}
              className={`festival-glyph festival-${burst ? 'launch' : festival.motion} absolute block`}
              style={{
                left: `${left}%`,
                // A firework ends up where it exploded and a drifting glyph
                // crosses at whatever height it was given, so both need a lane of
                // their own. The falling and rising ones are parked above or
                // below the header by their motion class and travel the whole way
                // through it.
                ...(burst || drift ? { top: `${(burst ? BURST_LANES : DRIFT_LANES)[i % 5]}%` } : null),
                width: size,
                height: size,
                // A firework that took nine seconds to go up would not read as
                // one. They run a much shorter cycle, spread across it so some
                // are always climbing while others open.
                animationDelay: burst ? `${(i * 0.83) % 4.5}s` : `${(i * 1.37) % 9}s`,
                animationDuration: burst ? `${3.6 + (i % 5) * 0.6}s` : `${8 + (i % 5) * 1.6}s`,
              }}
            >
              {glyph(i)}
            </span>
          )
        })}
      </div>
    </div>
  )
}

/* ---------------------------- the logo ornament ---------------------------- */

/** Rides on top of the logo mark. Sized to the 48-unit mark viewBox. */
export function FestivalOrnament({ id }: { id: FestivalId }) {
  const common = { className: 'pointer-events-none absolute -top-2.5 -right-2 size-6' as const }

  if (id === 'christmas')
    return (
      <svg viewBox="0 0 24 24" className="pointer-events-none absolute -top-3 -right-2.5 size-7">
        {/* One cone, one band, one pom — the fur band was hidden behind the mark
            before, which left the hat reading as a red blob with a dot. */}
        <path
          d="M4.5 15.8C5.8 9.4 9.6 5 15 4.2c2.4-.4 3.9 1.1 3.6 3.3-.4 3.4-3.6 6.9-8 8.3H4.5Z"
          fill="#e0362f"
          stroke="var(--line)"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
        <rect x="2.6" y="14.8" width="11.4" height="4.8" rx="2.4" fill="#fffcf7" stroke="var(--line)" strokeWidth="1.8" />
        <circle cx="19.2" cy="5.8" r="3.2" fill="#fffcf7" stroke="var(--line)" strokeWidth="1.8" />
      </svg>
    )
  if (id === 'valentine')
    return (
      <svg viewBox="0 0 24 24" {...common}>
        <path d="M12 21 3.6 12.6a5.2 5.2 0 0 1 7.4-7.3l1 1 1-1a5.2 5.2 0 1 1 7.4 7.3L12 21Z" fill="#ff6b81" stroke="var(--line)" strokeWidth="1.8" strokeLinejoin="round" />
      </svg>
    )
  if (id === 'songkran')
    return (
      // One blossom caught on the mark, matching the ones coming down behind it.
      <svg viewBox="0 0 24 24" {...common}>
        {[0, 72, 144, 216, 288].map((deg) => (
          <ellipse
            key={deg}
            cx="12"
            cy="5.6"
            rx="3.7"
            ry="5.2"
            transform={`rotate(${deg} 12 12)`}
            fill="#f2c53d"
            stroke="var(--line)"
            strokeWidth="1.6"
          />
        ))}
        <circle cx="12" cy="12" r="2.6" fill="#e08b1a" stroke="var(--line)" strokeWidth="1.6" />
      </svg>
    )
  if (id === 'new-year')
    return (
      <svg viewBox="0 0 24 24" {...common}>
        <path d="M12 1.8c.6 4.8 2.9 7.1 7.7 7.7-4.8.6-7.1 2.9-7.7 7.7-.6-4.8-2.9-7.1-7.7-7.7C9.1 8.9 11.4 6.6 12 1.8Z" fill="#ffd166" stroke="var(--line)" strokeWidth="1.6" strokeLinejoin="round" />
      </svg>
    )
  if (id === 'loy-krathong')
    return (
      <svg viewBox="0 0 24 24" className="pointer-events-none absolute -top-3 -right-2 size-7">
        {/* The lotus krathong the finale floats, cut down to what survives at this
            size: a flame, one ring of petals and the cup they sit in. */}
        <path d="M12 2.4c1.8 2.3 2.7 3.8 2.7 4.9a2.7 2.7 0 0 1-5.4 0c0-1.1.9-2.6 2.7-4.9Z" fill="#ffb02e" stroke="var(--line)" strokeWidth="1.7" strokeLinejoin="round" />
        {[-58, -29, 0, 29, 58].map((deg) => (
          <path
            key={deg}
            transform={`translate(12 14.6) rotate(${deg})`}
            d="M0 0Q-3.6-4.6 0-8.4Q3.6-4.6 0 0Z"
            fill="#f9b8ce"
            stroke="var(--line)"
            strokeWidth="1.6"
            strokeLinejoin="round"
          />
        ))}
        <path d="M3 14.4h18c-1.2 4.4-4.4 6.6-9 6.6s-7.8-2.2-9-6.6Z" fill="#ec7fa8" stroke="var(--line)" strokeWidth="1.8" strokeLinejoin="round" />
      </svg>
    )
  return (
    <svg viewBox="0 0 24 24" {...common}>
      <path d="M2 9.6c2.4-.6 3.6-2.1 4.2-3.9 1 2 2.6 3 4.5 3 .8 0 1.4.6 1.8 1.5.4-.9 1-1.5 1.8-1.5 1.9 0 3.5-1 4.5-3 .6 1.8 1.8 3.3 4.2 3.9-2.1.7-3 2.4-3.3 4.5-1.4-1.4-2.9-1.8-4.5-1.4-1 .3-2 1.1-2.7 2.3-.7-1.2-1.7-2-2.7-2.3-1.6-.4-3.1 0-4.5 1.4-.3-2.1-1.2-3.8-3.3-4.5Z" fill="#c9a8ff" stroke="var(--line)" strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  )
}
