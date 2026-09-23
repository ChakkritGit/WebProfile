'use client'

import { Fragment, useId, useState } from 'react'
import { useTranslations } from 'next-intl'
import { LayoutGrid, Shuffle } from 'lucide-react'

/**
 * The home page's first screen, behind the text: the page grid by default, or
 * a collage generated on demand — torn paper, a horizon, rust-coloured rock,
 * brushed waves, halftone, blueprint — cut into panels and grained over, the
 * way a printed collage is. Every press is a new seed, so it never repeats.
 *
 * All of it is SVG made from noise and gradients: no photographs to license,
 * nothing to download, and it costs nothing until someone asks for it.
 */

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

const W = 1600
const H = 900

type Texture = 'paper' | 'horizon' | 'rock' | 'waves' | 'halftone' | 'blueprint'
const TEXTURES: Texture[] = ['paper', 'horizon', 'rock', 'waves', 'halftone', 'blueprint']
const PAPERS = ['#f2c230', '#e9e2cf', '#d8d2c2', '#0000ff', '#161616', '#e4572e', '#f4efe4']
const INK = '#141414'

/** A vertical torn edge from top to bottom around `x`: small jitter, the odd notch. */
function tornVertical(rnd: () => number, x: number) {
  const points: [number, number][] = []
  for (let y = -10; y <= H + 10; y += 9 + rnd() * 10) {
    const notch = rnd() < 0.06 ? (rnd() - 0.5) * 22 : 0
    points.push([x + (rnd() - 0.5) * 7 + notch, y])
  }
  return points
}

/** A horizontal torn edge across a panel, gently wavy. */
function tornHorizontal(rnd: () => number, x0: number, x1: number, y: number) {
  const points: [number, number][] = []
  const lean = (rnd() - 0.5) * 60
  for (let x = x0 - 10; x <= x1 + 10; x += 8 + rnd() * 10) {
    const t = (x - x0) / Math.max(1, x1 - x0)
    points.push([x, y + lean * t + (rnd() - 0.5) * 6])
  }
  return points
}

const line = (points: [number, number][]) => points.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`).join('')

interface Region {
  /** Closed paths the texture is clipped to — all of them, intersected. */
  clips: string[]
  /** Bounds, for textures that place things. */
  x0: number
  x1: number
  y0: number
  y1: number
  texture: Texture
  paper: string
  seed: number
}

function layout(seed: number): { regions: Region[]; edges: string[] } {
  const rnd = random(seed)
  const pick = <T,>(list: T[]) => list[Math.floor(rnd() * list.length)]
  const columns = 2 + Math.floor(rnd() * 3)
  // Uneven widths — equal columns read as a layout, not a collage.
  const weights = Array.from({ length: columns }, () => 0.6 + rnd())
  const total = weights.reduce((a, b) => a + b, 0)
  const cuts = weights.slice(0, -1).map((_, i) => (weights.slice(0, i + 1).reduce((a, b) => a + b, 0) / total) * W)

  const regions: Region[] = []
  const edges: string[] = []
  const bounds = [0, ...cuts, W]
  const seams = cuts.map((x) => tornVertical(rnd, x))

  for (let c = 0; c < columns; c++) {
    const x0 = bounds[c]
    const x1 = bounds[c + 1]
    const left = c === 0 ? [[-20, -20], [-20, H + 20]] as [number, number][] : seams[c - 1]
    const right = c === columns - 1 ? [[W + 20, -20], [W + 20, H + 20]] as [number, number][] : seams[c]
    const column = `${line(left)}L${line([...right].reverse()).slice(1)}Z`

    const split = rnd() < 0.45
    if (!split) {
      regions.push({ clips: [column], x0, x1, y0: 0, y1: H, texture: pick(TEXTURES), paper: pick(PAPERS), seed: Math.floor(rnd() * 1e6) })
      continue
    }
    // Two pieces in the column: the whole column, then a lower piece torn
    // along a wavy line and laid on top of it.
    const y = H * (0.35 + rnd() * 0.3)
    const tear = tornHorizontal(rnd, x0, x1, y)
    const below = `${line(tear)}L${x1 + 30} ${H + 30}L${x0 - 30} ${H + 30}Z`
    regions.push({ clips: [column], x0, x1, y0: 0, y1: H, texture: pick(TEXTURES), paper: pick(PAPERS), seed: Math.floor(rnd() * 1e6) })
    regions.push({ clips: [column, below], x0, x1, y0: y - 40, y1: H, texture: pick(TEXTURES), paper: pick(PAPERS), seed: Math.floor(rnd() * 1e6) })
    edges.push(line(tear))
  }
  seams.forEach((s) => edges.push(line(s)))
  return { regions, edges }
}

function Region({ region, id }: { region: Region; id: string }) {
  const { x0, x1, y0, y1, texture, paper, seed } = region
  const w = x1 - x0 + 40
  const h = y1 - y0 + 40
  const rnd = random(seed)
  const box = { x: x0 - 20, y: y0 - 20, width: w, height: h }

  switch (texture) {
    case 'horizon': {
      const at = 0.45 + rnd() * 0.2
      return (
        <>
          <defs>
            <linearGradient id={`${id}-sky`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#0d1830" />
              <stop offset={at * 0.45} stopColor="#2f5f9e" />
              <stop offset={at * 0.8} stopColor="#8c9ccc" />
              <stop offset={at * 0.95} stopColor="#f08a3e" />
              <stop offset={at} stopColor="#ff4a1c" />
              <stop offset={at + 0.02} stopColor="#3a1a12" />
              <stop offset="1" stopColor="#140d0d" />
            </linearGradient>
          </defs>
          <rect {...box} fill={`url(#${id}-sky)`} />
        </>
      )
    }
    case 'rock': {
      const ridge: [number, number][] = []
      const base = y0 + (y1 - y0) * (0.35 + rnd() * 0.3)
      for (let x = x0 - 20; x <= x1 + 20; x += 14 + rnd() * 20) ridge.push([x, base + (rnd() - 0.5) * 70])
      return (
        <>
          <defs>
            <filter id={`${id}-rock`} x="0" y="0" width="100%" height="100%">
              <feTurbulence type="fractalNoise" baseFrequency={`${0.01 + rnd() * 0.02} ${0.04 + rnd() * 0.05}`} numOctaves={5} seed={seed % 1000} />
              <feColorMatrix type="saturate" values="0" />
              <feComponentTransfer>
                <feFuncR type="table" tableValues="0.08 0.45 0.78 0.98 1" />
                <feFuncG type="table" tableValues="0.02 0.16 0.34 0.62 0.85" />
                <feFuncB type="table" tableValues="0.02 0.06 0.14 0.3 0.55" />
                <feFuncA type="table" tableValues="1 1" />
              </feComponentTransfer>
            </filter>
          </defs>
          <rect {...box} fill="#0e0d0c" />
          <path d={`${line(ridge)}L${x1 + 20} ${y1 + 20}L${x0 - 20} ${y1 + 20}Z`} fill="#000" filter={`url(#${id}-rock)`} />
        </>
      )
    }
    case 'waves':
      return (
        <>
          <defs>
            <pattern id={`${id}-stripes`} width="40" height={22 + rnd() * 18} patternUnits="userSpaceOnUse">
              <rect width="40" height={6 + rnd() * 6} fill={INK} />
            </pattern>
            <filter id={`${id}-brush`}>
              <feTurbulence type="fractalNoise" baseFrequency={`${0.004 + rnd() * 0.004} ${0.02 + rnd() * 0.02}`} numOctaves={3} seed={seed % 1000} />
              <feDisplacementMap in="SourceGraphic" scale={50 + rnd() * 50} />
            </filter>
          </defs>
          <rect {...box} fill="#ddd6c6" />
          <rect {...box} fill={`url(#${id}-stripes)`} filter={`url(#${id}-brush)`} opacity={0.85} />
        </>
      )
    case 'halftone':
      return (
        <>
          <defs>
            <pattern id={`${id}-dots`} width="10" height="10" patternUnits="userSpaceOnUse" patternTransform={`rotate(${rnd() * 45})`}>
              <circle cx="5" cy="5" r="2.6" fill="#0000ff" />
            </pattern>
            <radialGradient id={`${id}-fade`} cx={0.3 + rnd() * 0.4} cy={0.3 + rnd() * 0.4} r="0.8">
              <stop offset="0" stopColor="#fff" />
              <stop offset="1" stopColor="#000" />
            </radialGradient>
            <mask id={`${id}-mask`}>
              <rect {...box} fill={`url(#${id}-fade)`} />
            </mask>
          </defs>
          <rect {...box} fill="#f4f2ec" />
          <rect {...box} fill={`url(#${id}-dots)`} mask={`url(#${id}-mask)`} />
        </>
      )
    case 'blueprint': {
      const cx = x0 + (x1 - x0) * (0.3 + rnd() * 0.4)
      const cy = y0 + (y1 - y0) * (0.3 + rnd() * 0.4)
      return (
        <>
          <defs>
            <pattern id={`${id}-grid`} width="32" height="32" patternUnits="userSpaceOnUse">
              <path d="M32 0H0V32" fill="none" stroke="#ffffff" strokeOpacity="0.25" strokeWidth="1" />
            </pattern>
          </defs>
          <rect {...box} fill="#0000ff" />
          <rect {...box} fill={`url(#${id}-grid)`} />
          {[80, 150, 230].map((r) => (
            <circle key={r} cx={cx} cy={cy} r={r * (0.6 + rnd() * 0.6)} fill="none" stroke="#fff" strokeOpacity="0.7" strokeWidth="1.2" />
          ))}
          <path d={`M${x0 - 20} ${cy}H${x1 + 20}M${cx} ${y0 - 20}V${y1 + 20}`} stroke="#fff" strokeOpacity="0.7" strokeWidth="1" />
        </>
      )
    }
    default: {
      // Plain paper, with a few marks made on it.
      const marks = Array.from({ length: 2 + Math.floor(rnd() * 4) }, () => {
        const sx = x0 + rnd() * (x1 - x0)
        const sy = y0 + rnd() * (y1 - y0)
        const vertical = rnd() < 0.5
        const len = 60 + rnd() * 260
        return vertical
          ? `M${sx} ${sy}q${(rnd() - 0.5) * 8} ${len / 2} ${(rnd() - 0.5) * 6} ${len}`
          : `M${sx} ${sy}q${len / 2} ${(rnd() - 0.5) * 10} ${len} ${(rnd() - 0.5) * 8}`
      })
      const dark = paper === '#161616' || paper === '#0000ff'
      return (
        <>
          <rect {...box} fill={paper} />
          {marks.map((d, i) => (
            <path key={i} d={d} fill="none" stroke={dark ? '#f4efe4' : INK} strokeOpacity={0.7} strokeWidth={0.8 + rnd() * 1.6} strokeLinecap="round" />
          ))}
        </>
      )
    }
  }
}

function Collage({ seed }: { seed: number }) {
  const uid = useId().replace(/:/g, '')
  const { regions, edges } = layout(seed)
  return (
    <svg
      aria-hidden
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="xMidYMid slice"
      className="animate-[collage-in_500ms_ease] absolute inset-0 size-full"
    >
      <defs>
        <filter id={`${uid}-grain`} x="0" y="0" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves={2} seed={seed % 997} stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        {regions.flatMap((region, i) =>
          region.clips.map((d, j) => (
            <clipPath key={`${i}-${j}`} id={`${uid}-clip-${i}-${j}`}>
              <path d={d} />
            </clipPath>
          )),
        )}
      </defs>
      {regions.map((region, i) => (
        // Nested groups intersect their clips: a lower piece is both inside
        // its column and below its tear.
        <Fragment key={i}>
          {region.clips.reduceRight(
            (inner, _, j) => <g clipPath={`url(#${uid}-clip-${i}-${j})`}>{inner}</g>,
            <Region region={region} id={`${uid}-r${i}`} />,
          )}
        </Fragment>
      ))}
      {/* The torn edges catch the light: a thin pale line along each tear. */}
      {edges.map((d, i) => (
        <path key={i} d={d} fill="none" stroke="#f4efe4" strokeOpacity="0.55" strokeWidth="2" />
      ))}
      <rect width={W} height={H} filter={`url(#${uid}-grain)`} opacity="0.22" style={{ mixBlendMode: 'overlay' }} />
    </svg>
  )
}

export function CollageBackdrop() {
  const t = useTranslations('home')
  const [seed, setSeed] = useState<number | null>(null)

  const button =
    'bg-surface/90 text-ink-soft hover:text-brand-strong border-line inline-flex h-9 items-center gap-1.5 border px-3 font-mono text-[0.7rem] uppercase backdrop-blur transition-colors'

  return (
    <>
      {seed === null ? (
        <div aria-hidden className="star-grid pointer-events-none absolute inset-0" />
      ) : (
        <div data-art aria-hidden className="pointer-events-none absolute inset-0">
          <Collage key={seed} seed={seed} />
          {/* A scrim under the text column, so white type reads on any draw. */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-black/10" />
        </div>
      )}
      {/* Bottom-left: the quick-contact dock owns the bottom-right corner of the
          screen, and scrolled a little it lands right over this spot. */}
      <div className="absolute start-4 bottom-4 z-10 flex gap-2 sm:start-6">
        <button type="button" onClick={() => setSeed(Math.floor(Math.random() * 2 ** 31))} className={button}>
          <Shuffle aria-hidden className="size-3.5" />
          {t('bgShuffle')}
        </button>
        {seed !== null && (
          <button type="button" onClick={() => setSeed(null)} className={button}>
            <LayoutGrid aria-hidden className="size-3.5" />
            {t('bgGrid')}
          </button>
        )}
      </div>
    </>
  )
}
