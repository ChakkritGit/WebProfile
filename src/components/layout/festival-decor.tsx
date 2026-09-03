'use client'

import { useEffect, useState, type ReactNode } from 'react'
import { useTranslations } from 'next-intl'
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
    // Square, and wider than the others: the embers throw 67 from a centre at
    // x=60, which ran off both sides of the 120-wide box the rest of the
    // greeters use.
    <svg viewBox="-16 -8 152 152" className="size-full text-[#e0a020]">
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
/** What the burst throws out, one per festival. Small enough to read at 18px. */
const CONFETTI: Record<FestivalId, ReactNode> = {
  halloween: (
    <path d="M1 6.4c1.6-.4 2.4-1.4 2.8-2.6.7 1.3 1.7 2 3 2 .5 0 .9.4 1.2 1 .3-.6.7-1 1.2-1 1.3 0 2.3-.7 3-2 .4 1.2 1.2 2.2 2.8 2.6-1.4.5-2 1.6-2.2 3-.9-.9-1.9-1.2-3-.9-.7.2-1.3.7-1.8 1.5-.5-.8-1.1-1.3-1.8-1.5-1.1-.3-2.1 0-3 .9-.2-1.4-.8-2.5-2.2-3Z" fill="#7c5cff" />
  ),
  valentine: (
    <path d="M8 14 2.6 8.6a3.3 3.3 0 0 1 4.7-4.7l.7.7.7-.7a3.3 3.3 0 1 1 4.7 4.7L8 14Z" fill="#ff5a6e" />
  ),
  songkran: (
    <path d="M8 1.8c2.9 3.7 4.4 6.3 4.4 8a4.4 4.4 0 0 1-8.8 0c0-1.7 1.5-4.3 4.4-8Z" fill="#3fa0ff" />
  ),
  christmas: (
    <g stroke="#8fd0f5" strokeWidth="1.7" strokeLinecap="round">
      <path d="M8 1.6v12.8M2.5 4.8l11 6.4M13.5 4.8l-11 6.4" />
    </g>
  ),
  'new-year': (
    <g stroke="#ffd166" strokeWidth="1.8" strokeLinecap="round">
      <path d="M8 1.5v4M8 10.5v4M1.5 8h4M10.5 8h4" />
    </g>
  ),
  'loy-krathong': (
    <path d="M8 1.8c2.4 3 3.7 5.1 3.7 6.7a3.7 3.7 0 0 1-7.4 0c0-1.6 1.3-3.7 3.7-6.7Z" fill="#ffb02e" />
  ),
}

/** [angle°, distance, size, spin°]. Hand picked so the spread is uneven — an even
 *  fan reads as a machine, not a burst. */
type Fling = [number, number, number, number]

/** Straight out from the middle: sparks and bats. */
const FLING_OUT: Fling[] = [
  [-88, 214, 20, 40], [-58, 176, 14, -70], [-31, 232, 22, 25], [-6, 188, 16, 90],
  [17, 240, 19, -35], [43, 170, 13, 60], [68, 226, 21, -20], [92, 182, 15, 75],
  [117, 236, 18, -55], [141, 174, 12, 30], [166, 222, 20, -85], [-165, 190, 16, 45],
  [-138, 234, 21, -30], [-113, 178, 14, 65],
]

/** Up and apart: hearts and flames, which climb rather than scatter. */
const FLING_UP: Fling[] = [
  [-96, 300, 18, 30], [-70, 250, 13, -50], [-114, 272, 20, 20], [-58, 306, 15, 60],
  [-128, 238, 12, -35], [-84, 342, 22, 15], [-104, 212, 14, -60], [-46, 262, 17, 45],
  [-140, 288, 19, -25], [-76, 224, 12, 55], [-118, 320, 21, -40], [-62, 198, 14, 30],
  [-92, 258, 16, -20], [-108, 232, 13, 50],
]

/** Out sideways and then down, for the things gravity gets: snow and water. */
const FLING_DOWN: Fling[] = [
  [84, 302, 18, 40], [56, 248, 13, -60], [104, 280, 20, 25], [40, 322, 15, 70],
  [126, 236, 12, -30], [96, 344, 22, 20], [68, 210, 14, -55], [22, 268, 17, 50],
  [146, 300, 19, -20], [76, 228, 12, 60], [112, 330, 21, -45], [50, 196, 14, 35],
  [90, 256, 16, -25], [132, 220, 13, 55],
]

/**
 * How each festival arrives, and what its confetti does afterwards.
 *
 * No two share a motion. A firework has to climb before it opens, a heart beats,
 * a drop falls and squashes on landing, a krathong comes up on the water, a
 * ghost does not arrive at all but appears, and the tree is drawn on the way
 * everything else on this site is drawn.
 */
const STAGING: Record<FestivalId, { enter: string; fling: string; list: Fling[]; wish: number }> = {
  'new-year': { enter: 'greet-in-burst', fling: 'fling-out', list: FLING_OUT, wish: 1.15 },
  valentine: { enter: 'greet-in-beat', fling: 'fling-rise', list: FLING_UP, wish: 0.95 },
  songkran: { enter: 'greet-in-drop', fling: 'fling-fall', list: FLING_DOWN, wish: 1.0 },
  'loy-krathong': { enter: 'greet-in-float', fling: 'fling-rise', list: FLING_UP, wish: 1.1 },
  halloween: { enter: 'greet-in-haunt', fling: 'fling-out', list: FLING_OUT, wish: 1.5 },
  christmas: { enter: 'greet-in-draw', fling: 'fling-fall', list: FLING_DOWN, wish: 0.85 },
}

/**
 * A one-off hello in the middle of the screen when the page loads during a
 * festival.
 *
 * Three beats rather than one entrance: the character is wiped on as though a pen
 * were passing over it, it throws a handful of confetti, and the wish writes
 * itself underneath. A single sticker sliding in was the whole thing before, and
 * it read as decoration; a greeting that says something is what a festival
 * actually wants from a page.
 *
 * It plays per page load, not per navigation: this lives in the header, which
 * survives client-side route changes, so moving between pages does not replay
 * it — only a real load or refresh does. It removes itself from the DOM
 * afterwards rather than sitting there invisible, and never takes a pointer
 * event, so a click landing mid-greeting still reaches the page underneath.
 */
export function FestivalGreeting({ festival }: { festival: Festival }) {
  const t = useTranslations('festival')
  const reduce = useReducedMotion()
  const [done, setDone] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setDone(true), 3400)
    return () => clearTimeout(timer)
  }, [])

  // Halloween turns the lights out for the length of its scene and puts them
  // back afterwards. A reader already in the dark gets nothing to undo, and the
  // class is removed on unmount as well as on the timer, so a navigation part way
  // through cannot leave the site stuck in a theme nobody chose.
  useEffect(() => {
    if (festival.id !== 'halloween' || reduce) return
    const root = document.documentElement
    if (root.classList.contains('dark')) return

    root.classList.add('theme-xfade')

    // Two frames, then read the colour back, and only then change the theme.
    // This runs at hydration, which can land before the browser has painted at
    // all: a transition needs a previously rendered value to move away from, and
    // without one the lights went out in a single frame. Waiting for a paint
    // gives it that value, and the read makes sure the style is computed with the
    // transition already in place.
    let dropped = false
    const frame = requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        if (dropped) return
        void getComputedStyle(document.body).backgroundColor
        root.classList.add('dark')
      }),
    )

    const back = setTimeout(() => root.classList.remove('dark'), 3400 + (AFTER_MS.halloween ?? 0))
    const settle = setTimeout(() => root.classList.remove('theme-xfade'), 4200 + (AFTER_MS.halloween ?? 0))

    return () => {
      dropped = true
      cancelAnimationFrame(frame)
      clearTimeout(back)
      clearTimeout(settle)
      root.classList.remove('dark', 'theme-xfade')
    }
  }, [festival.id, reduce])

  // Where the ghost shows up on each failed attempt at appearing. Rolled once, on
  // mount, so it is a different haunting every load — and only here, because
  // nothing renders on the server (see `useFestival`), so there is no markup for
  // a random number to disagree with.
  //
  // The reach is worked out from the size it happens to be that time, not fixed
  // in viewport units: a big appearance needs to stay closer to the middle than a
  // small one, and a fixed range clipped it off the edge of a phone.
  const [haunt] = useState(() => {
    const between = (min: number, max: number) => min + Math.random() * (max - min)
    const either = () => (Math.random() < 0.5 ? -1 : 1)
    const box = window.innerWidth >= 640 ? 208 : 160 // the w-40 / sm:w-52 glyph
    const tall = box * (140 / 120) // the greeters' viewBox is taller than it is wide

    return Array.from({ length: 3 }, () => {
      const scale = between(0.5, 1.45)
      const reachX = Math.max(0, window.innerWidth / 2 - (box * scale) / 2 - 12)
      const reachY = Math.max(0, window.innerHeight / 2 - (tall * scale) / 2 - 12)
      return {
        x: `${Math.round(either() * between(reachX * 0.4, reachX))}px`,
        y: `${Math.round(either() * between(reachY * 0.35, reachY))}px`,
        s: scale.toFixed(2),
      }
    })
  })

  const stage = STAGING[festival.id]

  // Reduced motion opts out of the whole flourish, the afterpiece included.
  if (reduce) return null
  if (done) return <FestivalAfter id={festival.id} />

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-[70] grid place-items-center">
      <div className="festival-veil absolute inset-0 bg-black/45" />

      <div className="festival-greet relative flex flex-col items-center gap-5">
        <div className="relative">
          {/* The shell climbing to the middle, on the one festival that needs a
              launch before there is anything to look at. */}
          {festival.id === 'new-year' && (
            <span className="greet-rocket absolute start-1/2 top-1/2 h-16 w-1.5 -translate-x-1/2 rounded-full bg-[#ffd166]" />
          )}
          <div
            className={`greet-ink ${stage.enter} w-40 sm:w-52`}
            style={
              festival.id === 'halloween'
                ? (Object.fromEntries(
                    haunt.flatMap((h, i) => [
                      [`--hx${i + 1}`, h.x],
                      [`--hy${i + 1}`, h.y],
                      [`--hs${i + 1}`, h.s],
                    ]),
                  ) as React.CSSProperties)
                : undefined
            }
          >
            {GREETERS[festival.id]}
          </div>

          {/* Thrown from behind the character, so the first frames are hidden by
              it and the confetti appears to come out rather than start beside. */}
          <div className="pointer-events-none absolute inset-0 -z-10 grid place-items-center">
            {stage.list.map(([deg, dist, size, spin], i) => {
              const a = (deg * Math.PI) / 180
              return (
                <svg
                  key={i}
                  viewBox="0 0 16 16"
                  className={`greet-confetti ${stage.fling} absolute`}
                  style={
                    {
                      width: size,
                      height: size,
                      '--dx': `${Math.cos(a) * dist}px`,
                      '--dy': `${Math.sin(a) * dist}px`,
                      '--spin': `${spin}deg`,
                      animationDelay: `${stage.wish - 0.35 + (i % 5) * 0.045}s`,
                    } as React.CSSProperties
                  }
                >
                  {CONFETTI[festival.id]}
                </svg>
              )
            })}
          </div>
        </div>

        <p
          className="greet-wish font-display text-center text-2xl font-bold text-[#fffcf7] sm:text-3xl"
          style={{ animationDelay: `${stage.wish}s` }}
        >
          {t(festival.id)}
        </p>
      </div>
    </div>
  )
}

/**
 * The ghost that stays behind, leaning out from the left edge of the screen.
 *
 * It comes out far enough to turn and face you — the whole face on screen, not a
 * profile — holds your eye for a second, blinks twice and ducks back. Only the
 * trailing edge of it stays off screen, which is what keeps it reading as
 * something leaning out from behind rather than a sticker parked in the corner.
 */
function GhostPeek() {
  // Leans out, looks at you, blinks twice, ducks back — and that is the last of
  // it. `FestivalAfter` owns how long it lives; a second timer here only made two
  // clocks to keep in step with the CSS.
  return (
    <div aria-hidden className="ghost-peek pointer-events-none fixed top-[46%] left-0 z-40 w-24 sm:w-32">
      <svg viewBox="0 0 120 140" className="size-full">
        <path
          d="M60 8c24 0 41 19 41 44v70c0 4-4 6-7 3l-9-9-9 9c-2 2-5 2-7 0l-9-9-9 9c-2 2-5 2-7 0l-9-9-9 9c-3 3-7 1-7-3V52C19 27 36 8 60 8Z"
          fill="#fffcf7"
          stroke="var(--line)"
          strokeWidth="4"
          strokeLinejoin="round"
        />
        <g className="ghost-eyes">
          <ellipse cx="46" cy="52" rx="7" ry="9" fill="var(--line)" />
          <ellipse cx="76" cy="52" rx="7" ry="9" fill="var(--line)" />
        </g>
        <path d="M49 78c4 6 8 9 12 9s8-3 12-9" fill="none" stroke="var(--line)" strokeWidth="4" strokeLinecap="round" />
      </svg>
    </div>
  )
}

/* ---------------------------- the afterpieces ---------------------------- */

/** How long each festival's closing scene runs before it unmounts for good. */
const AFTER_MS: Partial<Record<FestivalId, number>> = {
  halloween: 6000,
  'new-year': 7000,
  valentine: 7000,
  songkran: 7400,
  christmas: 8200,
}

/**
 * What each festival leaves behind once the greeting has gone.
 *
 * Every one of them plays out and then removes itself — none of them stay. They
 * unmount on the clock their own exit finishes on, so nothing is left parked
 * off-screen for a resize to find.
 */
function FestivalAfter({ id }: { id: FestivalId }) {
  const [gone, setGone] = useState(false)
  const ms = AFTER_MS[id]

  useEffect(() => {
    if (!ms) return
    const timer = setTimeout(() => setGone(true), ms)
    return () => clearTimeout(timer)
  }, [ms])

  if (!ms || gone) return null
  if (id === 'halloween') return <GhostPeek />
  if (id === 'new-year') return <FireworkFinale />
  if (id === 'valentine') return <HeartBalloon />
  if (id === 'songkran') return <SandPagodas />
  return <SnowmenChase />
}

/** A layer that covers the screen, takes no input, and clips whatever leaves it. */
function Stage({ children }: { children: ReactNode }) {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-40 overflow-hidden">
      {children}
    </div>
  )
}

/* --- New Year: two mortars at the bottom corners, firing until they stop --- */

/** [side, rise (vh), drift (px), delay (s), shell seed]. */
const SHOTS: [0 | 1, number, number, number, number][] = [
  [0, 48, 130, 0.25, 1],
  [1, 54, -160, 0.7, 3],
  [0, 40, 220, 1.5, 5],
  [1, 46, -95, 1.95, 0],
  [0, 57, 65, 2.7, 2],
  [1, 42, -240, 3.1, 4],
]

function Mortar({ side }: { side: 0 | 1 }) {
  return (
    <svg
      viewBox="0 0 40 60"
      className={`ny-tube absolute -bottom-2 w-11 sm:w-14 ${side ? 'right-[4%]' : 'left-[4%]'}`}
      style={{ transform: `rotate(${side ? 9 : -9}deg)` }}
    >
      <rect x="8" y="10" width="24" height="50" rx="4" fill="#c0392b" stroke="var(--line)" strokeWidth="3" />
      <ellipse cx="20" cy="11" rx="12" ry="4.5" fill="#7e2018" stroke="var(--line)" strokeWidth="3" />
      <rect x="5" y="28" width="30" height="9" rx="3.5" fill="#ffd166" stroke="var(--line)" strokeWidth="3" />
    </svg>
  )
}

function FireworkFinale() {
  return (
    <Stage>
      <Mortar side={0} />
      <Mortar side={1} />
      {SHOTS.map(([side, rise, drift, delay, seed], i) => (
        <span
          key={i}
          className="ny-shot absolute bottom-11"
          style={
            {
              [side ? 'right' : 'left']: '6%',
              '--rise': `${rise}vh`,
              '--drift': `${drift}px`,
              animationDelay: `${delay}s`,
            } as React.CSSProperties
          }
        >
          <span className="ny-trail" style={{ animationDelay: `${delay}s` }} />
          <svg viewBox="-2 -2 36 36" className="ny-burst" style={{ animationDelay: `${delay}s` }}>
            {shellPaths(seed)}
          </svg>
        </span>
      ))}
    </Stage>
  )
}

/* --- Valentine: a balloon on a string, until the knot gives --------------- */

function HeartBalloon() {
  return (
    <Stage>
      <div className="vt-balloon absolute bottom-0 left-[7%] w-24 sm:w-28">
        <svg viewBox="0 0 100 224" className="size-full">
          <path d="M50 100q12 36-4 62t3 60" fill="none" stroke="var(--line)" strokeWidth="3" strokeLinecap="round" />
          <path d="M36 220h28" stroke="var(--line)" strokeWidth="7" strokeLinecap="round" />
          <path
            d="M50 100 11 60a22 22 0 0 1 31-31l8 8 8-8a22 22 0 1 1 31 31L50 100Z"
            fill="#ff5a6e"
            stroke="var(--line)"
            strokeWidth="4.5"
            strokeLinejoin="round"
          />
          <path d="M28 46a13 13 0 0 1 10-12" fill="none" stroke="#fffcf7" strokeWidth="4.5" strokeLinecap="round" opacity="0.85" />
        </svg>
      </div>
    </Stage>
  )
}

/* --- Songkran: sand pagodas in both corners, under a string of flags ------ */

const BUNTING_HUES = ['#ff3d7f', '#00b74a', '#1a3fd0', '#d81b23', '#ffc300']

/** Triangles hanging from a sagging line, the way a swag actually hangs. */
function Bunting({ sag, drop, className }: { sag: number; drop: number; className: string }) {
  const at = (t: number) => ({
    x: 2 * (1 - t) * t * 600 + t * t * 1200,
    y: (1 - t) * (1 - t) * 16 + 2 * (1 - t) * t * sag + t * t * 16,
  })
  const flags = Array.from({ length: 21 }, (_, i) => at(0.03 + (i * 0.94) / 20))

  return (
    <svg viewBox="0 0 1200 200" preserveAspectRatio="none" className={className}>
      <path d={`M0 16Q600 ${sag} 1200 16`} fill="none" stroke="var(--line)" strokeWidth="4" strokeLinecap="round" />
      {flags.map((f, i) => (
        <path
          key={i}
          d={`M${f.x - 17} ${f.y} L${f.x + 17} ${f.y} L${f.x} ${f.y + drop} Z`}
          fill={BUNTING_HUES[i % BUNTING_HUES.length]}
          stroke="var(--line)"
          strokeWidth="3"
          strokeLinejoin="round"
        />
      ))}
    </svg>
  )
}

/** [left/right offset %, width px, delay s]. Uneven heights, like a real row. */
const PAGODAS: [0 | 1, number, number, number][] = [
  [0, 4, 132, 0.1],
  [0, 19, 96, 0.28],
  [0, 31, 74, 0.44],
  [1, 4, 140, 0.16],
  [1, 20, 104, 0.34],
  [1, 32, 78, 0.5],
]

function Pagoda({ width }: { width: number }) {
  return (
    <svg viewBox="0 -16 100 122" style={{ width }} className="block">
      <path d="M50 6 94 104H6L50 6Z" fill="#e6c68a" stroke="var(--line)" strokeWidth="3.5" strokeLinejoin="round" />
      <path d="M24 76h52M32 54h36M40 32h20" fill="none" stroke="var(--line)" strokeWidth="3" strokeLinecap="round" opacity="0.45" />
      <path d="M50 6V-14" stroke="var(--line)" strokeWidth="3" strokeLinecap="round" />
      <path d="M50-14 78-7 50 0Z" fill="#e0362f" stroke="var(--line)" strokeWidth="2.5" strokeLinejoin="round" />
    </svg>
  )
}

function SandPagodas() {
  return (
    <Stage>
      <Bunting sag={210} drop={44} className="sk-bunting absolute bottom-[19%] left-0 h-28 w-full sm:h-36" />
      <Bunting sag={140} drop={38} className="sk-bunting sk-bunting--back absolute bottom-[27%] left-0 h-24 w-full sm:h-32" />
      {PAGODAS.map(([side, offset, width, delay], i) => (
        <div
          key={i}
          className="sk-pagoda absolute bottom-0"
          // Two animations on this element, so two delays: a single value would
          // be reused for both and start the sink at the same moment as the rise.
          style={{ [side ? 'right' : 'left']: `${offset}%`, animationDelay: `${delay}s, 6.2s` }}
        >
          <Pagoda width={width} />
        </div>
      ))}
    </Stage>
  )
}

/* --- Christmas: one snowman trips, the other finds it funny --------------- */

function SnowBall({ r, cx, cy, fill = '#fffcf7' }: { r: number; cx: number; cy: number; fill?: string }) {
  return <circle cx={cx} cy={cy} r={r} fill={fill} stroke="var(--line)" strokeWidth="4" />
}

function SnowmenChase() {
  return (
    <Stage>
      {/* The one in front, which does not make it. */}
      <div className="xm-runner absolute bottom-2 left-0 w-24 sm:w-28">
        <div className="xm-runner-bob">
          <svg viewBox="0 0 100 150" className="size-full overflow-visible">
            <g className="xm-base">
              <SnowBall cx={50} cy={116} r={30} />
            </g>
            <g className="xm-mid">
              <SnowBall cx={50} cy={72} r={23} />
              <path d="M28 66 6 50M72 66l22-16" stroke="var(--line)" strokeWidth="4" strokeLinecap="round" fill="none" />
              <circle cx="50" cy="66" r="3.4" fill="var(--line)" />
              <circle cx="50" cy="80" r="3.4" fill="var(--line)" />
            </g>
            <g className="xm-head">
              <SnowBall cx={50} cy={33} r={18} />
              <circle cx="43" cy="29" r="2.8" fill="var(--line)" />
              <circle cx="56" cy="29" r="2.8" fill="var(--line)" />
              <path d="M50 35 62 39l-12 4Z" fill="#ff8c1a" stroke="var(--line)" strokeWidth="2.5" strokeLinejoin="round" />
              <path d="M34 18h32M40 18V6h20v12" fill="#2f2a3d" stroke="var(--line)" strokeWidth="4" strokeLinejoin="round" />
            </g>
          </svg>
        </div>
      </div>

      {/* The one behind, which stops to enjoy it. */}
      <div className="xm-chaser absolute bottom-2 left-0 w-24 sm:w-28">
        <div className="xm-chaser-bob">
          <svg viewBox="0 0 100 150" className="size-full overflow-visible">
            <SnowBall cx={50} cy={116} r={30} />
            <SnowBall cx={50} cy={72} r={23} />
            <path d="M28 66 6 52M72 66l22-14" stroke="var(--line)" strokeWidth="4" strokeLinecap="round" fill="none" />
            <circle cx="50" cy="66" r="3.4" fill="var(--line)" />
            <circle cx="50" cy="80" r="3.4" fill="var(--line)" />
            <SnowBall cx={50} cy={33} r={18} />
            {/* Eyes shut and mouth wide — the face of something enjoying itself. */}
            <path d="M38 28q5-5 10 0M52 28q5-5 10 0" fill="none" stroke="var(--line)" strokeWidth="3.4" strokeLinecap="round" />
            <ellipse cx="50" cy="41" rx="7" ry="5.5" fill="var(--line)" />
            <path d="M34 18h32M40 18V6h20v12" fill="#c0392b" stroke="var(--line)" strokeWidth="4" strokeLinejoin="round" />
          </svg>
        </div>
      </div>
    </Stage>
  )
}
