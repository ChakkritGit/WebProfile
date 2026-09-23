'use client'

import { useId, useSyncExternalStore } from 'react'
import { useTranslations } from 'next-intl'
import { Image as ImageIcon, ImageOff } from 'lucide-react'

/**
 * The picture behind the home page's first screen: one full-bleed image drawn
 * from a collection — a horizon, rust rock, brushed waves, halftone, blueprint,
 * paper, dunes, a setting sun, blue static — with the seed picking the design
 * and varying it. The seed comes from the server, so the picture is in the
 * first paint rather than swapped in after hydration, and the page regenerates
 * with a new one every minute.
 *
 * On by default. The reader can switch it off for the page grid, and that is
 * remembered: `HeroArtScript` applies it before paint, so someone who turned it
 * off never sees it flash in.
 *
 * All of it is SVG from noise and gradients — nothing to license or download.
 */

const KEY = 'hero-art'
const W = 1600
const H = 900

/** Small, fast, seedable. Mulberry32. */
function random(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const INK = '#141414'
const full = { x: 0, y: 0, width: W, height: H }

type Design = (rnd: () => number, id: string, seed: number) => React.ReactNode

const DESIGNS: Design[] = [
  // A horizon at dusk, from high altitude.
  (rnd, id) => {
    const at = 0.5 + rnd() * 0.15
    return (
      <>
        <defs>
          <linearGradient id={`${id}-sky`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#0b1428" />
            <stop offset={at * 0.45} stopColor="#2f5f9e" />
            <stop offset={at * 0.8} stopColor="#8c9ccc" />
            <stop offset={at * 0.95} stopColor="#f08a3e" />
            <stop offset={at} stopColor="#ff4a1c" />
            <stop offset={at + 0.02} stopColor="#3a1a12" />
            <stop offset="1" stopColor="#120c0c" />
          </linearGradient>
        </defs>
        <rect {...full} fill={`url(#${id}-sky)`} />
      </>
    )
  },
  // Rust-coloured rock under a black sky.
  (rnd, id, seed) => {
    const base = H * (0.45 + rnd() * 0.2)
    let ridge = `M-20 ${base}`
    for (let x = 0; x <= W + 40; x += 18 + rnd() * 30) ridge += `L${x.toFixed(1)} ${(base + (rnd() - 0.5) * 110).toFixed(1)}`
    return (
      <>
        <defs>
          <filter id={`${id}-rock`} x="0" y="0" width="100%" height="100%">
            <feTurbulence type="fractalNoise" baseFrequency={`${0.008 + rnd() * 0.012} ${0.03 + rnd() * 0.04}`} numOctaves={5} seed={seed % 1000} />
            <feColorMatrix type="saturate" values="0" />
            <feComponentTransfer>
              <feFuncR type="table" tableValues="0.08 0.45 0.78 0.98 1" />
              <feFuncG type="table" tableValues="0.02 0.16 0.34 0.62 0.85" />
              <feFuncB type="table" tableValues="0.02 0.06 0.14 0.3 0.55" />
            </feComponentTransfer>
          </filter>
        </defs>
        <rect {...full} fill="#0c0b0a" />
        <path d={`${ridge}L${W + 40} ${H + 20}L-20 ${H + 20}Z`} fill="#000" filter={`url(#${id}-rock)`} />
      </>
    )
  },
  // Brushed ink waves on cream paper.
  (rnd, id, seed) => (
    <>
      <defs>
        <pattern id={`${id}-stripes`} width="40" height={24 + rnd() * 20} patternUnits="userSpaceOnUse">
          <rect width="40" height={7 + rnd() * 7} fill={INK} />
        </pattern>
        <filter id={`${id}-brush`}>
          <feTurbulence type="fractalNoise" baseFrequency={`${0.003 + rnd() * 0.003} ${0.015 + rnd() * 0.02}`} numOctaves={3} seed={seed % 1000} />
          <feDisplacementMap in="SourceGraphic" scale={60 + rnd() * 60} />
        </filter>
      </defs>
      <rect {...full} fill="#ddd6c6" />
      <rect {...full} fill={`url(#${id}-stripes)`} filter={`url(#${id}-brush)`} opacity={0.55} />
    </>
  ),
  // Halftone dots in the brand blue, fading from one point.
  (rnd, id) => (
    <>
      <defs>
        <pattern id={`${id}-dots`} width="12" height="12" patternUnits="userSpaceOnUse" patternTransform={`rotate(${rnd() * 45})`}>
          <circle cx="6" cy="6" r="3.2" fill="#0000ff" />
        </pattern>
        <radialGradient id={`${id}-fade`} cx={0.3 + rnd() * 0.5} cy={0.3 + rnd() * 0.4} r="0.75">
          <stop offset="0" stopColor="#fff" />
          <stop offset="1" stopColor="#000" />
        </radialGradient>
        <mask id={`${id}-mask`}>
          <rect {...full} fill={`url(#${id}-fade)`} />
        </mask>
      </defs>
      <rect {...full} fill="#f4f2ec" />
      <rect {...full} fill={`url(#${id}-dots)`} mask={`url(#${id}-mask)`} />
    </>
  ),
  // A blueprint: grid, rings and cross-hairs on blue.
  (rnd, id) => {
    const cx = W * (0.45 + rnd() * 0.4)
    const cy = H * (0.3 + rnd() * 0.4)
    return (
      <>
        <defs>
          <pattern id={`${id}-grid`} width="32" height="32" patternUnits="userSpaceOnUse">
            <path d="M32 0H0V32" fill="none" stroke="#ffffff" strokeOpacity="0.22" strokeWidth="1" />
          </pattern>
        </defs>
        <rect {...full} fill="#0000ff" />
        <rect {...full} fill={`url(#${id}-grid)`} />
        {[1, 2, 3, 4].map((k) => (
          <circle key={k} cx={cx} cy={cy} r={k * (70 + rnd() * 40)} fill="none" stroke="#fff" strokeOpacity="0.6" strokeWidth="1.2" />
        ))}
        <path d={`M0 ${cy}H${W}M${cx} 0V${H}`} stroke="#fff" strokeOpacity="0.6" strokeWidth="1" />
      </>
    )
  },
  // A sheet of coloured paper with pencil marks on it.
  (rnd) => {
    const papers = ['#f2c230', '#e4572e', '#e9e2cf', '#1c1c1c']
    const paper = papers[Math.floor(rnd() * papers.length)]
    const pen = paper === '#1c1c1c' ? '#f4efe4' : INK
    const marks = Array.from({ length: 5 + Math.floor(rnd() * 6) }, () => {
      const sx = rnd() * W
      const sy = rnd() * H
      const len = 80 + rnd() * 380
      return rnd() < 0.5
        ? `M${sx} ${sy}q${(rnd() - 0.5) * 10} ${len / 2} ${(rnd() - 0.5) * 8} ${len}`
        : `M${sx} ${sy}q${len / 2} ${(rnd() - 0.5) * 14} ${len} ${(rnd() - 0.5) * 10}`
    })
    return (
      <>
        <rect {...full} fill={paper} />
        {marks.map((d, i) => (
          <path key={i} d={d} fill="none" stroke={pen} strokeOpacity={0.7} strokeWidth={0.8 + rnd() * 1.8} strokeLinecap="round" />
        ))}
      </>
    )
  },
  // Dunes: ridges stepping back into haze.
  (rnd) => {
    const bands = ['#f3c98b', '#e59a5a', '#c8643a', '#8e3b22', '#4a1d12']
    return (
      <>
        <rect {...full} fill="#f7e2bf" />
        {bands.map((color, i) => {
          const base = H * (0.35 + i * 0.13)
          let d = `M-20 ${base}`
          for (let x = 0; x <= W + 60; x += 60) d += `Q${x + 30} ${(base - 40 - rnd() * 90).toFixed(1)} ${x + 60} ${(base + (rnd() - 0.5) * 40).toFixed(1)}`
          return <path key={color} d={`${d}L${W + 60} ${H + 20}L-20 ${H + 20}Z`} fill={color} />
        })}
      </>
    )
  },
  // A setting sun cut by lines, on a warm gradient.
  (rnd, id) => {
    const cx = W * (0.55 + rnd() * 0.3)
    const cy = H * (0.45 + rnd() * 0.15)
    const r = 180 + rnd() * 140
    return (
      <>
        <defs>
          <linearGradient id={`${id}-dusk`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#1a0f3a" />
            <stop offset="0.6" stopColor="#b8324a" />
            <stop offset="1" stopColor="#f29e4c" />
          </linearGradient>
          <mask id={`${id}-cut`}>
            <rect {...full} fill="#fff" />
            {Array.from({ length: 7 }, (_, i) => (
              <rect key={i} x={0} y={cy + i * 26 + 4} width={W} height={3 + i * 2.2} fill="#000" />
            ))}
          </mask>
        </defs>
        <rect {...full} fill={`url(#${id}-dusk)`} />
        <circle cx={cx} cy={cy} r={r} fill="#ffd166" mask={`url(#${id}-cut)`} />
      </>
    )
  },
  // Blue static, like the Hermes prints: noise in two inks.
  (rnd, id, seed) => (
    <>
      <defs>
        <filter id={`${id}-static`} x="0" y="0" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency={`${0.002 + rnd() * 0.004} ${0.004 + rnd() * 0.01}`} numOctaves={4} seed={seed % 1000} />
          <feColorMatrix type="saturate" values="0" />
          <feComponentTransfer>
            <feFuncR type="table" tableValues="0 0 0.2 0.9 1" />
            <feFuncG type="table" tableValues="0 0 0.2 0.9 1" />
            <feFuncB type="table" tableValues="0.55 1 1 1 1" />
          </feComponentTransfer>
        </filter>
      </defs>
      <rect {...full} fill="#000" filter={`url(#${id}-static)`} />
    </>
  ),
]

function Artwork({ seed }: { seed: number }) {
  const uid = useId().replace(/:/g, '')
  const rnd = random(seed)
  const design = DESIGNS[seed % DESIGNS.length]
  return (
    <svg aria-hidden viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid slice" className="absolute inset-0 size-full">
      <defs>
        <filter id={`${uid}-grain`} x="0" y="0" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves={2} seed={seed % 997} stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
        </filter>
      </defs>
      {design(rnd, `${uid}-d`, seed)}
      {/* Printed-matter grain over everything. */}
      <rect {...full} filter={`url(#${uid}-grain)`} opacity="0.2" style={{ mixBlendMode: 'overlay' }} />
    </svg>
  )
}

/* The on/off state lives on <html> (so the pre-paint script can set it) and in
   localStorage (so it is remembered). */
const listeners = new Set<() => void>()
const subscribe = (notify: () => void) => {
  listeners.add(notify)
  return () => {
    listeners.delete(notify)
  }
}
const isOn = () => document.documentElement.dataset.heroArt !== 'off'

export function HeroArt({ seed }: { seed: number }) {
  const t = useTranslations('home')
  const on = useSyncExternalStore(subscribe, isOn, () => true)

  function toggle() {
    const next = on ? 'off' : 'on'
    document.documentElement.dataset.heroArt = next
    try {
      localStorage.setItem(KEY, next)
    } catch {
      // Private mode: it just will not be remembered.
    }
    listeners.forEach((notify) => notify())
  }

  return (
    <>
      <div data-grid aria-hidden className="star-grid pointer-events-none absolute inset-0" />
      <div data-art aria-hidden className="pointer-events-none absolute inset-0">
        <Artwork seed={seed} />
        {/* A scrim under the text column, so white type reads on any design. */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/45 to-black/10" />
      </div>
      {/* Bottom-left: the quick-contact dock owns the bottom-right corner of the
          screen, and scrolled a little it lands right over this spot. */}
      <button
        type="button"
        onClick={toggle}
        aria-pressed={on}
        className="bg-surface/90 text-ink-soft hover:text-brand-strong border-line absolute start-4 bottom-4 z-10 inline-flex h-9 items-center gap-1.5 border px-3 font-mono text-[0.7rem] uppercase backdrop-blur transition-colors sm:start-6"
      >
        {on ? <ImageOff aria-hidden className="size-3.5" /> : <ImageIcon aria-hidden className="size-3.5" />}
        {t(on ? 'bgOff' : 'bgOn')}
      </button>
    </>
  )
}

/** Runs before paint, so a reader who switched the picture off never sees it. */
export function HeroArtScript() {
  return (
    <script
      dangerouslySetInnerHTML={{
        __html: `try{if(localStorage.getItem('${KEY}')==='off')document.documentElement.dataset.heroArt='off'}catch(e){}`,
      }}
    />
  )
}
