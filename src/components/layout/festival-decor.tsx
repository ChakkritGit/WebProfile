'use client'

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

const GLYPHS: Record<FestivalId, (key: number) => React.ReactNode> = {
  christmas: (k) => (
    <svg key={k} viewBox="0 0 16 16" className="size-full text-[#6fb3e0]">
      <g stroke="currentColor" strokeWidth="1.6" {...S}>
        <path d="M8 2v12M2.8 5l10.4 6M13.2 5 2.8 11" />
      </g>
    </svg>
  ),
  'new-year': (k) => (
    <svg key={k} viewBox="0 0 16 16" className="size-full text-[#e0a020]">
      <path
        d="M8 1.6c.4 3.2 1.9 4.7 5.1 5.1-3.2.4-4.7 1.9-5.1 5.1-.4-3.2-1.9-4.7-5.1-5.1C6.1 6.3 7.6 4.8 8 1.6Z"
        fill="currentColor"
      />
    </svg>
  ),
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

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <div
        className="absolute inset-x-0 top-0 h-full"
        style={{ background: `linear-gradient(to bottom, ${festival.wash}, transparent 78%)` }}
      />
      {!reduce &&
        LANES.map((left, i) => (
          <span
            key={left}
            className={`festival-glyph festival-${festival.motion} absolute block`}
            style={{
              left: `${left}%`,
              width: i % 3 === 0 ? 16 : i % 3 === 1 ? 11 : 13,
              height: i % 3 === 0 ? 16 : i % 3 === 1 ? 11 : 13,
              animationDelay: `${(i * 1.37) % 9}s`,
              animationDuration: `${8 + (i % 5) * 1.6}s`,
            }}
          >
            {glyph(i)}
          </span>
        ))}
    </div>
  )
}

/* ---------------------------- the logo ornament ---------------------------- */

/** Rides on top of the logo mark. Sized to the 48-unit mark viewBox. */
export function FestivalOrnament({ id }: { id: FestivalId }) {
  const common = { className: 'pointer-events-none absolute -top-2 -right-1.5 size-5' as const }

  if (id === 'christmas')
    return (
      <svg viewBox="0 0 24 24" {...common}>
        <path d="M4 17c1-7 5-11 11-12 2.2-.3 3.4.8 3.6 2.6.3 3-2.6 6-6.6 7.4L4 17Z" fill="#e0362f" stroke="var(--line)" strokeWidth="1.6" strokeLinejoin="round" />
        <ellipse cx="5" cy="18.4" rx="4.2" ry="2" fill="#fffcf7" stroke="var(--line)" strokeWidth="1.6" />
        <circle cx="18.6" cy="6.6" r="2.6" fill="#fffcf7" stroke="var(--line)" strokeWidth="1.6" />
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
      <svg viewBox="0 0 24 24" {...common}>
        <path d="M12 3c2.6 3 4 5.3 4 7a4 4 0 0 1-8 0c0-1.7 1.4-4 4-7Z" fill="#ffc46b" stroke="var(--line)" strokeWidth="1.7" strokeLinejoin="round" />
        <path d="M4.5 16.5h15c-1 2.8-3.8 4.2-7.5 4.2s-6.5-1.4-7.5-4.2Z" fill="#8fd6a8" stroke="var(--line)" strokeWidth="1.7" strokeLinejoin="round" />
      </svg>
    )
  return (
    <svg viewBox="0 0 24 24" {...common}>
      <path d="M2 9.6c2.4-.6 3.6-2.1 4.2-3.9 1 2 2.6 3 4.5 3 .8 0 1.4.6 1.8 1.5.4-.9 1-1.5 1.8-1.5 1.9 0 3.5-1 4.5-3 .6 1.8 1.8 3.3 4.2 3.9-2.1.7-3 2.4-3.3 4.5-1.4-1.4-2.9-1.8-4.5-1.4-1 .3-2 1.1-2.7 2.3-.7-1.2-1.7-2-2.7-2.3-1.6-.4-3.1 0-4.5 1.4-.3-2.1-1.2-3.8-3.3-4.5Z" fill="#c9a8ff" stroke="var(--line)" strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  )
}
