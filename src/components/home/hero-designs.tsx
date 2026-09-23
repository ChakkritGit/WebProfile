import type { ReactNode } from 'react'

/**
 * The collection behind the home hero: every design a function of a seeded
 * random stream, so one design is many pictures. Landscapes, space, geometric
 * art, materials, and a few from the machine room.
 *
 * Curated to the site: blue, monochrome or dark and quiet, so they sit with
 * the brand blue and with the found pictures (which are blended blue). Candy
 * palettes (Bauhaus primaries, Memphis, Swiss bands, synthwave, dunes, wood,
 * terrazzo…) were cut, and so were the still versions of the aurora, glyph
 * rain and radar, which exist as moving designs.
 *
 * All SVG: gradients, noise filters and shapes — nothing photographic, so
 * nothing to license and nothing to download. Each is drawn on a 1600×900
 * canvas and cropped to the hero with `slice`.
 */

export const W = 1600
export const H = 900
export const full = { x: 0, y: 0, width: W, height: H }

/** Small, fast, seedable. Mulberry32. */
export function random(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

type Rnd = () => number
export type Design = ((rnd: Rnd, id: string, seed: number) => ReactNode) & {
  /** Dense or bright enough that the orb's lines vanish into it; the orb
      gets a faint frosted card over these. */
  busy?: boolean
}

const busy = (design: Design): Design => Object.assign(design, { busy: true })

const INK = '#141414'
const n = (v: number) => v.toFixed(1)
const pick = <T,>(rnd: Rnd, list: readonly T[]) => list[Math.floor(rnd() * list.length)]

/** A jagged skyline closed down to the bottom edge. */
function ridge(rnd: Rnd, base: number, amp: number, step: number) {
  let d = `M-40 ${n(base)}`
  for (let x = -40; x <= W + 80; x += step * (0.5 + rnd())) d += `L${n(x)} ${n(base - rnd() * amp)}`
  return `${d}L${W + 80} ${H + 40}L-40 ${H + 40}Z`
}

function stars(rnd: Rnd, count: number, maxY = H) {
  return Array.from({ length: count }, (_, i) => (
    <circle key={i} cx={n(rnd() * W)} cy={n(rnd() * maxY)} r={n(0.4 + rnd() * rnd() * 2.2)} fill="#fff" opacity={n(0.3 + rnd() * 0.7)} />
  ))
}

/** Smooth noise from a few sines — enough to shape a field without a library. */
function field(rnd: Rnd) {
  const waves = Array.from({ length: 4 }, () => ({ fx: 0.001 + rnd() * 0.006, fy: 0.001 + rnd() * 0.006, p: rnd() * 6.28 }))
  return (x: number, y: number) => waves.reduce((s, w) => s + Math.sin(x * w.fx + y * w.fy + w.p), 0) / waves.length
}

function Gradient({ id, stops, vertical = true }: { id: string; stops: string[]; vertical?: boolean }) {
  return (
    <linearGradient id={id} x1="0" y1="0" x2={vertical ? '0' : '1'} y2={vertical ? '1' : '0'}>
      {stops.map((c, i) => (
        <stop key={i} offset={i / (stops.length - 1)} stopColor={c} />
      ))}
    </linearGradient>
  )
}

export const DESIGNS: Design[] = [
  /* ------------------------------ landscapes ------------------------------ */

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
  // Layered mountains stepping back into haze.
  (rnd, id) => {
    const pal = pick(rnd, [
      ['#fde2c8', '#f7a58a', '#c2667a', '#6b3b6e', '#2b1f3b'],
      ['#dbe9f4', '#9fbfd9', '#5f86ad', '#34507a', '#172642'],
      ['#f2e8cf', '#bcc9a8', '#7f9a76', '#4d6b54', '#223a2f'],
    ])
    return (
      <>
        <defs>
          <Gradient id={`${id}-sky`} stops={[pal[0], pal[1]]} />
        </defs>
        <rect {...full} fill={`url(#${id}-sky)`} />
        <circle cx={n(W * (0.55 + rnd() * 0.35))} cy={n(H * 0.3)} r={n(60 + rnd() * 50)} fill="#fff" opacity="0.7" />
        {[0, 1, 2, 3].map((i) => (
          <path key={i} d={ridge(rnd, H * (0.5 + i * 0.12), 170 - i * 25, 60)} fill={pal[i + 1]} />
        ))}
      </>
    )
  },
  // Sea and sky with the sun's path on the water.
  (rnd, id) => {
    const horizon = H * (0.5 + rnd() * 0.1)
    const sx = W * (0.5 + rnd() * 0.35)
    const sun = pick(rnd, ['#ffd166', '#ff8c61', '#fff1c1'])
    return (
      <>
        <defs>
          <Gradient id={`${id}-sky`} stops={pick(rnd, [['#1b1f4b', '#7a4b8a', '#f2a07b'], ['#0e3a5c', '#4f9ac2', '#ffd8a8'], ['#2a0f2f', '#b33f62', '#f9c784']])} />
          <Gradient id={`${id}-sea`} stops={['#0b2233', '#030b12']} />
        </defs>
        <rect x="0" y="0" width={W} height={horizon} fill={`url(#${id}-sky)`} />
        <circle cx={sx} cy={horizon} r={n(70 + rnd() * 60)} fill={sun} />
        <rect x="0" y={horizon} width={W} height={H - horizon} fill={`url(#${id}-sea)`} />
        {Array.from({ length: 26 }, (_, i) => {
          const y = horizon + 6 + i * 16
          const w = 220 * (1 - i / 30) * (0.5 + rnd())
          return <rect key={i} x={n(sx - w / 2 + (rnd() - 0.5) * 40)} y={n(y)} width={n(w)} height="3" fill={sun} opacity={n(0.8 - i / 34)} />
        })}
      </>
    )
  },
  // A pine forest in fog.
  (rnd, id) => {
    const tones = ['#9fb3b0', '#6f8986', '#46605e', '#243836']
    return (
      <>
        <defs>
          <Gradient id={`${id}-fog`} stops={['#dfe7e3', '#b9c8c3']} />
        </defs>
        <rect {...full} fill={`url(#${id}-fog)`} />
        {tones.map((tone, layer) => {
          const base = H * (0.5 + layer * 0.14)
          const size = 60 + layer * 45
          let d = ''
          for (let x = -40; x < W + 60; x += size * (0.35 + rnd() * 0.4)) {
            const h = size * (1.6 + rnd() * 1.4)
            const w = size * 0.45
            d += `M${n(x)} ${n(base - h)}L${n(x + w)} ${n(base)}L${n(x - w)} ${n(base)}Z`
          }
          return (
            <g key={tone} fill={tone}>
              <path d={d} />
              <rect x="0" y={n(base - 2)} width={W} height={n(H - base + 4)} />
            </g>
          )
        })}
      </>
    )
  },
  /* -------------------------------- space --------------------------------- */

  // A full moon among stars.
  (rnd, id) => {
    const cx = W * (0.55 + rnd() * 0.3)
    const cy = H * (0.25 + rnd() * 0.3)
    const r = 110 + rnd() * 70
    return (
      <>
        <defs>
          <radialGradient id={`${id}-night`} cx="0.7" cy="0.3" r="1">
            <stop offset="0" stopColor="#1c2447" />
            <stop offset="1" stopColor="#05060f" />
          </radialGradient>
          <filter id={`${id}-glow`} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="30" />
          </filter>
        </defs>
        <rect {...full} fill={`url(#${id}-night)`} />
        {stars(rnd, 220)}
        <circle cx={n(cx)} cy={n(cy)} r={n(r * 1.25)} fill="#f5f1e3" opacity="0.35" filter={`url(#${id}-glow)`} />
        <circle cx={n(cx)} cy={n(cy)} r={n(r)} fill="#f5f1e3" />
        {Array.from({ length: 7 }, (_, i) => {
          const a = rnd() * 6.28
          const d = rnd() * r * 0.7
          return <circle key={i} cx={n(cx + Math.cos(a) * d)} cy={n(cy + Math.sin(a) * d)} r={n(r * (0.06 + rnd() * 0.14))} fill="#d9d2bd" opacity="0.7" />
        })}
      </>
    )
  },
  // A nebula, coloured noise over a star field.
  (rnd, id, seed) => (
    <>
      <defs>
        <filter id={`${id}-neb`} x="0" y="0" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency={`${0.0015 + rnd() * 0.002}`} numOctaves={5} seed={seed % 1000} />
          <feColorMatrix type="matrix" values={pick(rnd, [
            '1.4 0 0 0 0  0 0.2 0 0 0  0 0 1.6 0 0  2 0 0 0 -0.9',
            '0.2 0 0 0 0  0 1 0 0 0  0 0 1.6 0 0  2 0 0 0 -0.9',
            '1.6 0 0 0 0  0 0.6 0 0 0  0 0 0.3 0 0  2 0 0 0 -0.9',
          ])} />
        </filter>
      </defs>
      <rect {...full} fill="#05010f" />
      {stars(rnd, 300)}
      <rect {...full} filter={`url(#${id}-neb)`} opacity="0.85" />
    </>
  ),
  // A ringed planet.
  (rnd, id) => {
    const cx = W * (0.6 + rnd() * 0.25)
    const cy = H * (0.45 + rnd() * 0.15)
    const r = 150 + rnd() * 90
    const tilt = -10 - rnd() * 20
    const [a, b] = pick(rnd, [['#f6c177', '#b4637a'], ['#9ccfd8', '#31748f'], ['#eb6f92', '#403d52']])
    return (
      <>
        <defs>
          <radialGradient id={`${id}-planet`} cx="0.35" cy="0.3" r="0.9">
            <stop offset="0" stopColor={a} />
            <stop offset="1" stopColor={b} />
          </radialGradient>
        </defs>
        <rect {...full} fill="#070712" />
        {stars(rnd, 240)}
        <g transform={`rotate(${n(tilt)} ${n(cx)} ${n(cy)})`}>
          <ellipse cx={n(cx)} cy={n(cy)} rx={n(r * 2)} ry={n(r * 0.45)} fill="none" stroke="#e9d8a6" strokeOpacity="0.55" strokeWidth="16" />
        </g>
        <circle cx={n(cx)} cy={n(cy)} r={n(r)} fill={`url(#${id}-planet)`} />
        <g transform={`rotate(${n(tilt)} ${n(cx)} ${n(cy)})`}>
          <path d={`M${n(cx - r * 2)} ${n(cy)}A${n(r * 2)} ${n(r * 0.45)} 0 0 0 ${n(cx + r * 2)} ${n(cy)}`} fill="none" stroke="#e9d8a6" strokeOpacity="0.8" strokeWidth="16" />
        </g>
      </>
    )
  },

  /* ------------------------------ geometric ------------------------------- */

  // Op art: two sets of rings interfering.
  busy((rnd) => {
    const rings = (cx: number, cy: number) =>
      Array.from({ length: 60 }, (_, i) => <circle key={i} cx={n(cx)} cy={n(cy)} r={12 + i * 22} fill="none" stroke="#fff" strokeOpacity="0.55" strokeWidth="9" />)
    return (
      <>
        <rect {...full} fill="#000" />
        <g>{rings(W * (0.3 + rnd() * 0.2), H * (0.3 + rnd() * 0.4))}</g>
        <g style={{ mixBlendMode: 'difference' }}>{rings(W * (0.55 + rnd() * 0.2), H * (0.3 + rnd() * 0.4))}</g>
      </>
    )
  }),
  // Isometric cubes.
  busy((rnd, id) => {
    const [top, left, right] = pick(rnd, [
      ['#f4efe4', '#9ca3af', '#374151'],
      ['#c7d2fe', '#6366f1', '#1e1b4b'],
      ['#fde68a', '#f97316', '#7c2d12'],
    ])
    return (
      <>
        <defs>
          <pattern id={`${id}-cube`} width="80" height="138.56" patternUnits="userSpaceOnUse">
            {[0, 1].map((k) => {
              const ox = k * 40
              const oy = k * 69.28
              return (
                <g key={k} transform={`translate(${ox} ${oy})`}>
                  <path d="M0 23.09L40 0L80 23.09L40 46.19Z" fill={top} />
                  <path d="M0 23.09L40 46.19L40 92.38L0 69.28Z" fill={left} />
                  <path d="M80 23.09L40 46.19L40 92.38L80 69.28Z" fill={right} />
                  <g transform="translate(-80 0)">
                    <path d="M80 23.09L40 46.19L40 92.38L80 69.28Z" fill={right} />
                  </g>
                </g>
              )
            })}
          </pattern>
        </defs>
        <rect {...full} fill={`url(#${id}-cube)`} />
      </>
    )
  }),
  // Topographic contours around a few peaks.
  (rnd) => {
    const dark = rnd() < 0.5
    const ink = dark ? '#7dd3a8' : '#8a5a3c'
    const peaks = Array.from({ length: 3 }, () => ({ x: rnd() * W, y: rnd() * H, p: Array.from({ length: 3 }, () => rnd() * 6.28) }))
    return (
      <>
        <rect {...full} fill={dark ? '#0f1e17' : '#f3efe6'} />
        <g fill="none" stroke={ink} strokeOpacity="0.6" strokeWidth="1.4">
          {peaks.flatMap((pk, i) =>
            Array.from({ length: 16 }, (_, k) => {
              const r0 = 20 + k * 30
              let d = ''
              for (let s = 0; s <= 72; s++) {
                const a = (s / 72) * Math.PI * 2
                const r = r0 * (1 + 0.18 * Math.sin(a * 2 + pk.p[0]) + 0.1 * Math.sin(a * 3 + pk.p[1] + k * 0.2) + 0.06 * Math.sin(a * 5 + pk.p[2]))
                d += `${s ? 'L' : 'M'}${n(pk.x + Math.cos(a) * r)} ${n(pk.y + Math.sin(a) * r * 0.8)}`
              }
              return <path key={`${i}-${k}`} d={`${d}Z`} />
            }),
          )}
        </g>
      </>
    )
  },
  // Halftone dots in the brand blue, fading from one point.
  busy((rnd, id) => (
    <>
      <defs>
        <pattern id={`${id}-dots`} width="12" height="12" patternUnits="userSpaceOnUse" patternTransform={`rotate(${n(rnd() * 45)})`}>
          <circle cx="6" cy="6" r="3.2" fill="#0000ff" />
        </pattern>
        <radialGradient id={`${id}-fade`} cx={n(0.3 + rnd() * 0.5)} cy={n(0.3 + rnd() * 0.4)} r="0.75">
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
  )),
  /* ------------------------------- materials ------------------------------ */

  // Brushed ink waves on cream paper.
  busy((rnd, id, seed) => (
    <>
      <defs>
        <pattern id={`${id}-stripes`} width="40" height={n(24 + rnd() * 20)} patternUnits="userSpaceOnUse">
          <rect width="40" height={n(7 + rnd() * 7)} fill={INK} />
        </pattern>
        <filter id={`${id}-brush`}>
          <feTurbulence type="fractalNoise" baseFrequency={`${0.003 + rnd() * 0.003} ${0.015 + rnd() * 0.02}`} numOctaves={3} seed={seed % 1000} />
          <feDisplacementMap in="SourceGraphic" scale={n(60 + rnd() * 60)} />
        </filter>
      </defs>
      <rect {...full} fill="#ddd6c6" />
      <rect {...full} fill={`url(#${id}-stripes)`} filter={`url(#${id}-brush)`} opacity={0.55} />
    </>
  )),
  // Marble: noise run through a vein curve.
  (rnd, id, seed) => (
    <>
      <defs>
        <filter id={`${id}-marble`} x="0" y="0" width="100%" height="100%">
          <feTurbulence type="turbulence" baseFrequency={`${0.002 + rnd() * 0.002} ${0.006 + rnd() * 0.006}`} numOctaves={6} seed={seed % 1000} />
          <feColorMatrix type="saturate" values="0" />
          <feComponentTransfer>
            {(['R', 'G', 'B'] as const).map((c) => {
              const Tag = `feFunc${c}` as 'feFuncR'
              return <Tag key={c} type="table" tableValues={pick(rnd, ['0.97 0.92 0.55 0.9 0.96', '0.96 0.88 0.4 0.86 0.95'])} />
            })}
          </feComponentTransfer>
        </filter>
      </defs>
      <rect {...full} fill="#fff" filter={`url(#${id}-marble)`} />
    </>
  ),
  /* ------------------------------ the machine ----------------------------- */

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
          <circle key={k} cx={n(cx)} cy={n(cy)} r={n(k * (70 + rnd() * 40))} fill="none" stroke="#fff" strokeOpacity="0.6" strokeWidth="1.2" />
        ))}
        <path d={`M0 ${n(cy)}H${W}M${n(cx)} 0V${H}`} stroke="#fff" strokeOpacity="0.6" strokeWidth="1" />
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
  // A circuit board.
  (rnd) => {
    const g = 40
    const traces: ReactNode[] = []
    for (let i = 0; i < 70; i++) {
      let x = Math.floor(rnd() * (W / g)) * g
      let y = Math.floor(rnd() * (H / g)) * g
      let d = `M${x} ${y}`
      for (let s = 0; s < 3 + Math.floor(rnd() * 4); s++) {
        const len = g * (1 + Math.floor(rnd() * 5))
        if (rnd() < 0.5) x += rnd() < 0.5 ? len : -len
        else y += rnd() < 0.5 ? len : -len
        d += `L${x} ${y}`
      }
      const o = n(0.45 + rnd() * 0.5)
      traces.push(<path key={`t${i}`} d={d} fill="none" stroke="#2bd67b" strokeOpacity={o} strokeWidth="2.5" />)
      traces.push(<circle key={`p${i}`} cx={x} cy={y} r="5" fill="#2bd67b" opacity={o} />)
    }
    return (
      <>
        <rect {...full} fill="#04140e" />
        {traces}
        {Array.from({ length: 5 }, (_, i) => (
          <rect key={`c${i}`} x={Math.floor(rnd() * 36) * g} y={Math.floor(rnd() * 20) * g} width={g * (2 + Math.floor(rnd() * 3))} height={g * 2} fill="#0b2a1d" stroke="#2bd67b" strokeOpacity="0.8" strokeWidth="2" />
        ))}
      </>
    )
  },
  // Wireframe terrain in perspective.
  (rnd, id) => {
    const f = field(rnd)
    const horizon = H * 0.35
    const rows: ReactNode[] = []
    for (let r = 0; r < 34; r++) {
      const t = r / 33
      const y0 = horizon + Math.pow(t, 1.8) * (H - horizon + 120)
      const lift = 30 + t * 220
      let d = ''
      for (let x = -40; x <= W + 40; x += 20) d += `${x === -40 ? 'M' : 'L'}${x} ${n(y0 - (f(x * (1.5 - t), r * 40) + 1) * lift * 0.5)}`
      rows.push(<path key={r} d={d} fill="none" stroke="#38bdf8" strokeOpacity={n(0.15 + t * 0.7)} strokeWidth={n(0.8 + t * 1.4)} />)
    }
    return (
      <>
        <defs>
          <Gradient id={`${id}-sky`} stops={['#020617', '#0f172a', '#1e1b4b']} />
        </defs>
        <rect {...full} fill={`url(#${id}-sky)`} />
        {stars(rnd, 90, horizon)}
        {rows}
      </>
    )
  },
]
