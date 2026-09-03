'use client'

import { useEffect, useState, type ReactNode } from 'react'
import { useReducedMotion } from 'motion/react'
import { festivalById, festivalOn, type Festival, type FestivalId } from '@/config/festivals'
import { useIsMounted } from '@/lib/hooks'

/**
 * Seasonal dressing for the header: a drifting layer of glyphs, a tint, and an
 * ornament on the logo.
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
  if (!mounted) return null

  return festivalById(forcedId()) ?? festivalOn(new Date())
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
function Firework({ seed }: { seed: number }) {
  const head = FIREWORK_HUES[seed % FIREWORK_HUES.length]

  return (
    <>
      <svg viewBox="0 0 32 32" className="fw-rocket absolute inset-0 size-full">
        <path d="M16 11v8" stroke={head} strokeWidth="1.6" strokeLinecap="round" opacity="0.5" />
        <circle cx="16" cy="10" r="1.7" fill={head} />
      </svg>
      <svg viewBox="0 0 32 32" className="fw-shell absolute inset-0 size-full">
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
  songkran: (k) => (
    <svg key={k} viewBox="0 0 16 16" className="size-full text-[#3fa0ff]">
      <path d="M8 1.8c2.9 3.7 4.4 6.3 4.4 8a4.4 4.4 0 0 1-8.8 0c0-1.7 1.5-4.3 4.4-8Z" fill="currentColor" />
    </svg>
  ),
  'loy-krathong': (k) => (
    <svg key={k} viewBox="0 0 16 16" className="size-full text-[#e09a2c]">
      <path d="M8 2.4c1.7 2 2.6 3.5 2.6 4.6a2.6 2.6 0 0 1-5.2 0c0-1.1.9-2.6 2.6-4.6Z" fill="currentColor" />
      <path d="M3.4 11.4h9.2c-.6 1.7-2.3 2.6-4.6 2.6s-4-.9-4.6-2.6Z" fill="currentColor" opacity="0.75" />
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

export function FestivalDecor({ festival }: { festival: Festival }) {
  const reduce = useReducedMotion()
  const glyph = GLYPHS[festival.id]
  const burst = festival.motion === 'burst'

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
                // A firework ends up where it exploded, so each needs its own
                // apex; the others are parked above or below the header by their
                // motion class and travel the whole way across.
                ...(burst ? { top: `${[16, 38, 24, 50, 32][i % 5]}%` } : null),
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
      <svg viewBox="0 0 24 24" {...common}>
        <path d="M12 2.5c4.4 5.6 6.6 9.4 6.6 11.9a6.6 6.6 0 0 1-13.2 0C5.4 11.9 7.6 8.1 12 2.5Z" fill="#6cc6ff" stroke="var(--line)" strokeWidth="1.8" strokeLinejoin="round" />
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
        {/* A flame over a lotus cup. The candle, the leaf folds and the rim petals
            of the first version were invisible at this size and only muddied it. */}
        <path d="M12 2.2c2 2.5 3 4.4 3 5.7a3 3 0 0 1-6 0c0-1.3 1-3.2 3-5.7Z" fill="#ffb02e" stroke="var(--line)" strokeWidth="1.8" strokeLinejoin="round" />
        <path d="M2.6 12.4h18.8c-1.2 4.6-4.6 6.9-9.4 6.9s-8.2-2.3-9.4-6.9Z" fill="#8fd6a8" stroke="var(--line)" strokeWidth="1.8" strokeLinejoin="round" />
      </svg>
    )
  return (
    <svg viewBox="0 0 24 24" {...common}>
      <path d="M2 9.6c2.4-.6 3.6-2.1 4.2-3.9 1 2 2.6 3 4.5 3 .8 0 1.4.6 1.8 1.5.4-.9 1-1.5 1.8-1.5 1.9 0 3.5-1 4.5-3 .6 1.8 1.8 3.3 4.2 3.9-2.1.7-3 2.4-3.3 4.5-1.4-1.4-2.9-1.8-4.5-1.4-1 .3-2 1.1-2.7 2.3-.7-1.2-1.7-2-2.7-2.3-1.6-.4-3.1 0-4.5 1.4-.3-2.1-1.2-3.8-3.3-4.5Z" fill="#c9a8ff" stroke="var(--line)" strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  )
}

/* -------------------------- the hello on load --------------------------- */

/** [angle°, length] — picked by hand so no two spokes match. Even spokes read
 *  as a sun rather than a burst. */
const SPARKS: [number, number][] = [
  [4, 46], [26, 33], [49, 50], [71, 35], [93, 47], [116, 31], [138, 49], [161, 36],
  [183, 45], [206, 34], [228, 48], [251, 33], [272, 46], [295, 38], [317, 50], [340, 32],
]

/** [angle°, distance, radius] — sparks that broke away from the shell. */
const EMBERS: [number, number, number][] = [
  [14, 60, 4], [57, 66, 3], [129, 62, 4.5], [197, 64, 3.5], [268, 59, 4], [331, 67, 3],
]

/** [x, y, scale] for the drops flying off the splash. */
const SPLASH: [number, number, number][] = [
  [97, 26, 0.5],
  [104, 74, 0.38],
  [26, 34, 0.42],
]

/** The character that comes out to say hello, one per festival. */
const GREETERS: Record<FestivalId, ReactNode> = {
  halloween: (
    <svg viewBox="0 0 120 140" className="size-full">
      <path
        d="M60 8c24 0 41 19 41 44v70c0 4-4 6-7 3l-9-9-9 9c-2 2-5 2-7 0l-9-9-9 9c-2 2-5 2-7 0l-9-9-9 9c-3 3-7 1-7-3V52C19 27 36 8 60 8Z"
        fill="#fffcf7"
        stroke="var(--line)"
        strokeWidth="4"
        strokeLinejoin="round"
      />
      <ellipse cx="45" cy="52" rx="7" ry="9" fill="var(--line)" />
      <ellipse cx="75" cy="52" rx="7" ry="9" fill="var(--line)" />
      <path d="M48 78c4 6 8 9 12 9s8-3 12-9" fill="none" stroke="var(--line)" strokeWidth="4" strokeLinecap="round" />
    </svg>
  ),
  christmas: (
    <svg viewBox="0 0 120 140" className="size-full">
      <path
        d="M60 20 88 60H72l20 30H74l19 28H27l19-28H28l20-30H32L60 20Z"
        fill="#2f9e6b"
        stroke="var(--line)"
        strokeWidth="4"
        strokeLinejoin="round"
      />
      <rect x="51" y="116" width="18" height="18" rx="3" fill="#8a5a34" stroke="var(--line)" strokeWidth="4" />
      <path
        d="M60 2 62.7 9.3 70.5 9.6 64.4 14.4 66.5 21.9 60 17.6 53.5 21.9 55.6 14.4 49.5 9.6 57.3 9.3Z"
        fill="#ffd166"
        stroke="var(--line)"
        strokeWidth="3.5"
        strokeLinejoin="round"
      />
      <circle cx="47" cy="72" r="5" fill="#e0362f" />
      <circle cx="74" cy="70" r="5" fill="#e0362f" />
      <circle cx="60" cy="98" r="5" fill="#ffd166" />
      <circle cx="44" cy="106" r="4.5" fill="#e0362f" />
    </svg>
  ),
  'new-year': (
    <svg viewBox="0 0 120 140" className="size-full text-[#e0a020]">
      {/* the trail it went up on */}
      <path
        d="M26 136q8-26 26-42"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeDasharray="1 10"
        opacity="0.65"
      />
      <g strokeLinecap="round">
        {SPARKS.map(([deg, len], i) => {
          const a = (deg * Math.PI) / 180
          return (
            <path
              key={i}
              stroke={FIREWORK_HUES[i % FIREWORK_HUES.length]}
              strokeWidth={len > 40 ? 4.5 : 3}
              d={`M${60 + Math.cos(a) * 13} ${68 + Math.sin(a) * 13}L${60 + Math.cos(a) * len} ${68 + Math.sin(a) * len}`}
            />
          )
        })}
      </g>
      <g>
        {EMBERS.map(([deg, dist, r], i) => {
          const a = (deg * Math.PI) / 180
          return (
            <circle key={i} cx={60 + Math.cos(a) * dist} cy={68 + Math.sin(a) * dist} r={r} fill={FIREWORK_HUES[(i + 2) % FIREWORK_HUES.length]} />
          )
        })}
        <circle cx="60" cy="68" r="6" fill="#fffbe8" stroke="var(--line)" strokeWidth="2.5" />
      </g>
    </svg>
  ),
  valentine: (
    <svg viewBox="0 0 120 140" className="size-full">
      <path
        d="M60 128 14 82a28 28 0 0 1 40-39l6 6 6-6a28 28 0 1 1 40 39l-46 46Z"
        fill="#ff5a6e"
        stroke="var(--line)"
        strokeWidth="4.5"
        strokeLinejoin="round"
      />
    </svg>
  ),
  songkran: (
    <svg viewBox="0 0 120 140" className="size-full">
      <path
        d="M56 22c24 32 36 52 36 66a36 36 0 0 1-72 0c0-14 12-34 36-66Z"
        fill="#3fa0ff"
        stroke="var(--line)"
        strokeWidth="4.5"
        strokeLinejoin="round"
      />
      <path d="M42 84c-4 6-6 11-5 17" fill="none" stroke="#fffcf7" strokeWidth="6" strokeLinecap="round" />
      {/* the water thrown off it, so it reads as a splash and not one drop */}
      {SPLASH.map(([x, y, scale], i) => (
        <path
          key={i}
          transform={`translate(${x} ${y}) scale(${scale})`}
          d="M0 0c6 8 9 13 9 16a9 9 0 0 1-18 0c0-3 3-8 9-16Z"
          fill="#3fa0ff"
          stroke="var(--line)"
          strokeWidth={4.5 / scale}
          strokeLinejoin="round"
        />
      ))}
    </svg>
  ),
  'loy-krathong': (
    <svg viewBox="0 0 120 140" className="size-full">
      {/* lotus petals fanned out behind the float */}
      <g stroke="var(--line)" strokeWidth="4" strokeLinejoin="round">
        {[-62, -33, 0, 33, 62].map((deg) => (
          <path key={deg} transform={`translate(60 96) rotate(${deg})`} d="M0 0Q-10-20 0-34Q10-20 0 0Z" fill="#8fd6a8" />
        ))}
      </g>
      {/* the candle it carries */}
      <rect x="54" y="58" width="12" height="30" rx="3" fill="#fffcf7" stroke="var(--line)" strokeWidth="4" />
      <path
        d="M60 32c7 9 10 14 10 18a10 10 0 0 1-20 0c0-4 3-9 10-18Z"
        fill="#ffb02e"
        stroke="var(--line)"
        strokeWidth="4"
        strokeLinejoin="round"
      />
      {/* the banana-leaf bowl */}
      <path d="M16 96c0 17 20 28 44 28s44-11 44-28Z" fill="#5fb885" stroke="var(--line)" strokeWidth="4.5" strokeLinejoin="round" />
      <ellipse cx="60" cy="96" rx="44" ry="12" fill="#8fd6a8" stroke="var(--line)" strokeWidth="4.5" />
      {/* the river it floats away on */}
      <path
        d="M10 130q9-7 18 0t18 0t18 0t18 0t18 0"
        fill="none"
        stroke="#3fa0ff"
        strokeWidth="4"
        strokeLinecap="round"
        opacity="0.75"
      />
    </svg>
  ),
}

/**
 * A one-off hello in the middle of the screen when the page loads during a
 * festival.
 *
 * It plays per page load, not per navigation: this lives in the header, which
 * survives client-side route changes, so moving between pages does not replay
 * it — only a real load or refresh does. It removes itself from the DOM
 * afterwards rather than sitting there invisible, and never takes a pointer
 * event, so a click landing mid-greeting still reaches the page underneath.
 */
export function FestivalGreeting({ festival }: { festival: Festival }) {
  const reduce = useReducedMotion()
  const [done, setDone] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setDone(true), 2600)
    return () => clearTimeout(timer)
  }, [])

  if (done || reduce) return null

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-[70] grid place-items-center">
      <div className="festival-veil absolute inset-0 bg-black/45" />
      <div className="festival-greet relative w-40 sm:w-52">{GREETERS[festival.id]}</div>
    </div>
  )
}
