import type { ReactNode } from 'react'

/**
 * The collection behind the home hero: every design a function of a seeded
 * random stream, so one design is many pictures. Landscapes, space, cities,
 * retro, geometric art, materials, and a few from the machine room.
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

/** A smooth rolling line closed down to the bottom edge. */
function rolling(rnd: Rnd, base: number, amp: number) {
  let d = `M-40 ${n(base)}`
  for (let x = -40; x <= W + 120; x += 120) d += `Q${n(x + 60)} ${n(base - amp * (0.4 + rnd()))} ${n(x + 120)} ${n(base + (rnd() - 0.5) * amp * 0.5)}`
  return `${d}L${W + 120} ${H + 40}L-40 ${H + 40}Z`
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
  // Rust-coloured rock under a black sky.
  (rnd, id, seed) => {
    const base = H * (0.45 + rnd() * 0.2)
    let line = `M-20 ${n(base)}`
    for (let x = 0; x <= W + 40; x += 18 + rnd() * 30) line += `L${n(x)} ${n(base + (rnd() - 0.5) * 110)}`
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
        <path d={`${line}L${W + 40} ${H + 20}L-20 ${H + 20}Z`} fill="#000" filter={`url(#${id}-rock)`} />
      </>
    )
  },
  // Dunes rolling back into haze.
  (rnd) => {
    const bands = ['#f3c98b', '#e59a5a', '#c8643a', '#8e3b22', '#4a1d12']
    return (
      <>
        <rect {...full} fill="#f7e2bf" />
        {bands.map((color, i) => (
          <path key={color} d={rolling(rnd, H * (0.35 + i * 0.13), 110)} fill={color} />
        ))}
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
  // Clouds in a clear sky.
  (rnd, id, seed) => (
    <>
      <defs>
        <Gradient id={`${id}-sky`} stops={pick(rnd, [['#3a7bd5', '#9cc9f5'], ['#ff9a8b', '#ffd6a5'], ['#6a82fb', '#fc5c7d']])} />
        <filter id={`${id}-cloud`} x="0" y="0" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency={`${0.002 + rnd() * 0.002} ${0.004 + rnd() * 0.004}`} numOctaves={5} seed={seed % 1000} />
          <feColorMatrix type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  2.2 0 0 0 -1.05" />
        </filter>
      </defs>
      <rect {...full} fill={`url(#${id}-sky)`} />
      <rect {...full} filter={`url(#${id}-cloud)`} />
    </>
  ),

  /* -------------------------------- space --------------------------------- */

  // Aurora over a dark ridge.
  (rnd, id) => (
    <>
      <defs>
        <Gradient id={`${id}-night`} stops={['#020617', '#0b1b2e']} />
        <filter id={`${id}-blur`} x="-20%" y="-50%" width="140%" height="200%">
          <feGaussianBlur stdDeviation="38" />
        </filter>
      </defs>
      <rect {...full} fill={`url(#${id}-night)`} />
      {stars(rnd, 160, H * 0.7)}
      <g filter={`url(#${id}-blur)`} opacity="0.75" fill="none" strokeWidth="90" strokeLinecap="round">
        {['#34d399', '#22d3ee', '#a78bfa'].map((color, i) => {
          const y = H * (0.2 + i * 0.1 + rnd() * 0.1)
          return <path key={color} d={`M-100 ${n(y)}C${n(W * 0.3)} ${n(y - 200 * rnd())} ${n(W * 0.6)} ${n(y + 200 * rnd())} ${W + 100} ${n(y - 80)}`} stroke={color} />
        })}
      </g>
      <path d={ridge(rnd, H * 0.85, 120, 45)} fill="#020409" />
    </>
  ),
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

  /* --------------------------------- city --------------------------------- */

  // A skyline at dusk, windows lit.
  (rnd, id) => {
    const building = (base: number, min: number, max: number, color: string, windows: boolean) => {
      const out: ReactNode[] = []
      for (let x = -20; x < W + 40; ) {
        const w = 50 + rnd() * 90
        const h = min + rnd() * (max - min)
        out.push(<rect key={`b${x}`} x={n(x)} y={n(base - h)} width={n(w)} height={n(h + 40)} fill={color} />)
        if (windows)
          for (let wy = base - h + 16; wy < base - 10; wy += 22)
            for (let wx = x + 10; wx < x + w - 12; wx += 16)
              if (rnd() < 0.35) out.push(<rect key={`w${n(wx)}-${n(wy)}`} x={n(wx)} y={n(wy)} width="6" height="9" fill="#ffd27a" opacity={n(0.5 + rnd() * 0.5)} />)
        x += w + 4
      }
      return out
    }
    return (
      <>
        <defs>
          <Gradient id={`${id}-dusk`} stops={['#1b1035', '#6b2d5c', '#f28f3b']} />
        </defs>
        <rect {...full} fill={`url(#${id}-dusk)`} />
        {building(H * 0.82, 180, 420, '#3a2150', false)}
        {building(H + 10, 160, 380, '#120a1e', true)}
      </>
    )
  },
  // Synthwave: a striped sun over a neon grid.
  (rnd, id) => {
    const horizon = H * 0.58
    const vx = W * (0.5 + (rnd() - 0.5) * 0.3)
    return (
      <>
        <defs>
          <Gradient id={`${id}-sky`} stops={['#140028', '#5b0a6b', '#ff2e88']} />
          <Gradient id={`${id}-sun`} stops={['#ffe36e', '#ff4d8d']} />
          <mask id={`${id}-cut`}>
            <rect {...full} fill="#fff" />
            {Array.from({ length: 8 }, (_, i) => (
              <rect key={i} x="0" y={n(horizon - 150 + i * 20)} width={W} height={n(2 + i * 1.6)} fill="#000" />
            ))}
          </mask>
        </defs>
        <rect x="0" y="0" width={W} height={horizon} fill={`url(#${id}-sky)`} />
        <circle cx={n(vx)} cy={n(horizon - 30)} r="230" fill={`url(#${id}-sun)`} mask={`url(#${id}-cut)`} />
        <rect x="0" y={horizon} width={W} height={H - horizon} fill="#0d0221" />
        <g stroke="#ff2ecb" strokeOpacity="0.75" strokeWidth="2">
          {Array.from({ length: 14 }, (_, i) => {
            const y = horizon + Math.pow(i / 13, 2) * (H - horizon)
            return <line key={`h${i}`} x1="0" y1={n(y)} x2={W} y2={n(y)} />
          })}
          {Array.from({ length: 31 }, (_, i) => {
            const x = (i - 15) * 160
            return <line key={`v${i}`} x1={n(vx)} y1={n(horizon)} x2={n(vx + x * 3)} y2={H} />
          })}
        </g>
      </>
    )
  },

  /* ------------------------------ geometric ------------------------------- */

  // Bauhaus: primaries on a grid of cells.
  busy((rnd) => {
    const colors = ['#d62828', '#1d3557', '#f4a300', '#111111']
    const cw = W / 6
    const ch = H / 3
    const cells: ReactNode[] = []
    for (let r = 0; r < 3; r++)
      for (let c = 0; c < 6; c++) {
        const x = c * cw
        const y = r * ch
        const color = pick(rnd, colors)
        const k = Math.floor(rnd() * 6)
        const key = `${r}-${c}`
        if (k === 0) cells.push(<circle key={key} cx={x + cw / 2} cy={y + ch / 2} r={Math.min(cw, ch) * 0.42} fill={color} />)
        if (k === 1) cells.push(<path key={key} d={`M${x} ${y + ch}A${cw / 2} ${cw / 2} 0 0 1 ${x + cw} ${y + ch}Z`} fill={color} />)
        if (k === 2) cells.push(<rect key={key} x={x + cw * 0.15} y={y + ch * 0.15} width={cw * 0.7} height={ch * 0.7} fill={color} />)
        if (k === 3) cells.push(<path key={key} d={`M${x} ${y + ch}L${x + cw / 2} ${y}L${x + cw} ${y + ch}Z`} fill={color} />)
        if (k === 4) cells.push(<path key={key} d={`M${x} ${y}L${x + cw} ${y}A${cw} ${ch} 0 0 1 ${x} ${y + ch}Z`} fill={color} />)
      }
    return (
      <>
        <rect {...full} fill="#efe7d6" />
        {cells}
      </>
    )
  }),
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
  // Memphis: confetti of shapes on a pastel ground.
  busy((rnd) => {
    const ground = pick(rnd, ['#ffd6e0', '#c1f0e8', '#fff1b8', '#d7d4ff'])
    const inks = ['#111', '#ff4f7b', '#2ec4b6', '#ffbf00', '#3a86ff']
    return (
      <>
        <rect {...full} fill={ground} />
        {Array.from({ length: 70 }, (_, i) => {
          const x = rnd() * W
          const y = rnd() * H
          const s = 14 + rnd() * 38
          const c = pick(rnd, inks)
          const k = Math.floor(rnd() * 4)
          if (k === 0) return <circle key={i} cx={n(x)} cy={n(y)} r={n(s / 2)} fill={c} />
          if (k === 1) return <path key={i} d={`M${n(x)} ${n(y)}l${n(s)} 0l${n(-s / 2)} ${n(-s)}Z`} fill="none" stroke={c} strokeWidth="5" />
          if (k === 2) return <path key={i} d={`M${n(x)} ${n(y)}l12 -12l12 12l12 -12l12 12l12 -12`} fill="none" stroke={c} strokeWidth="5" strokeLinejoin="round" />
          return <rect key={i} x={n(x)} y={n(y)} width={n(s)} height={n(s * 0.4)} fill={c} transform={`rotate(${n(rnd() * 90)} ${n(x)} ${n(y)})`} />
        })}
      </>
    )
  }),
  // Soft gradient blobs, blurred into a mesh.
  (rnd, id) => {
    const pal = pick(rnd, [
      ['#0b0f2b', '#ff6b6b', '#4d7cff', '#ffd93d', '#6bffb8'],
      ['#f4f1ea', '#ff9ec7', '#7ad3ff', '#ffe29a', '#b8a7ff'],
      ['#12001f', '#8b5cf6', '#ec4899', '#06b6d4', '#f59e0b'],
    ])
    return (
      <>
        <defs>
          <filter id={`${id}-blur`} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="110" />
          </filter>
        </defs>
        <rect {...full} fill={pal[0]} />
        <g filter={`url(#${id}-blur)`}>
          {pal.slice(1).map((c) => (
            <circle key={c} cx={n(rnd() * W)} cy={n(rnd() * H)} r={n(230 + rnd() * 220)} fill={c} />
          ))}
        </g>
      </>
    )
  },
  // Bold diagonal bands, Swiss poster style.
  busy((rnd) => {
    const pal = pick(rnd, [
      ['#f4efe4', '#e63946', '#1d3557', '#111'],
      ['#111', '#ff5a1f', '#f4efe4', '#0000ff'],
      ['#fef3c7', '#0f766e', '#f97316', '#1f2937'],
    ])
    let x = -900
    const bands: ReactNode[] = []
    while (x < W + 900) {
      const w = 40 + rnd() * 220
      bands.push(<rect key={x} x={n(x)} y="-600" width={n(w)} height={H + 1200} fill={pick(rnd, pal.slice(1))} />)
      x += w + 20 + rnd() * 160
    }
    return (
      <>
        <rect {...full} fill={pal[0]} />
        <g transform={`rotate(${n(-25 - rnd() * 20)} ${W / 2} ${H / 2})`}>{bands}</g>
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
  // A pixel mosaic shaped by smooth noise.
  busy((rnd) => {
    const pal = pick(rnd, [
      ['#0b132b', '#1c2541', '#3a506b', '#5bc0be', '#e0fbfc'],
      ['#2b0f0e', '#6b2d1a', '#c8553d', '#f28f3b', '#ffd5c2'],
      ['#10002b', '#3c096c', '#7b2cbf', '#c77dff', '#e0aaff'],
    ])
    const f = field(rnd)
    const size = 40
    const cells: ReactNode[] = []
    for (let y = 0; y < H; y += size)
      for (let x = 0; x < W; x += size) {
        const v = (f(x, y) + 1) / 2
        cells.push(<rect key={`${x}-${y}`} x={x} y={y} width={size} height={size} fill={pal[Math.min(4, Math.floor(v * 5))]} />)
      }
    return <>{cells}</>
  }),

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
  // A sheet of coloured paper with pencil marks on it.
  (rnd) => {
    const paper = pick(rnd, ['#f2c230', '#e4572e', '#e9e2cf', '#1c1c1c'])
    const pen = paper === '#1c1c1c' ? '#f4efe4' : INK
    return (
      <>
        <rect {...full} fill={paper} />
        {Array.from({ length: 5 + Math.floor(rnd() * 6) }, (_, i) => {
          const sx = rnd() * W
          const sy = rnd() * H
          const len = 80 + rnd() * 380
          const d =
            rnd() < 0.5
              ? `M${n(sx)} ${n(sy)}q${n((rnd() - 0.5) * 10)} ${n(len / 2)} ${n((rnd() - 0.5) * 8)} ${n(len)}`
              : `M${n(sx)} ${n(sy)}q${n(len / 2)} ${n((rnd() - 0.5) * 14)} ${n(len)} ${n((rnd() - 0.5) * 10)}`
          return <path key={i} d={d} fill="none" stroke={pen} strokeOpacity={0.7} strokeWidth={n(0.8 + rnd() * 1.8)} strokeLinecap="round" />
        })}
      </>
    )
  },
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
  // Wood grain.
  (rnd, id, seed) => (
    <>
      <defs>
        <filter id={`${id}-wood`} x="0" y="0" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency={`${0.0012 + rnd() * 0.001} ${0.03 + rnd() * 0.03}`} numOctaves={4} seed={seed % 1000} />
          <feColorMatrix type="saturate" values="0" />
          <feComponentTransfer>
            <feFuncR type="table" tableValues="0.32 0.55 0.72 0.5 0.66 0.45" />
            <feFuncG type="table" tableValues="0.16 0.32 0.46 0.3 0.42 0.26" />
            <feFuncB type="table" tableValues="0.08 0.16 0.24 0.14 0.22 0.12" />
          </feComponentTransfer>
        </filter>
      </defs>
      <rect {...full} filter={`url(#${id}-wood)`} />
    </>
  ),
  // Terrazzo: chips set in a pale ground.
  busy((rnd) => {
    const chips = ['#d9825b', '#6c8a7a', '#2f3e46', '#e8b4a6', '#c9a227', '#8d99ae']
    return (
      <>
        <rect {...full} fill="#ece6da" />
        {Array.from({ length: 220 }, (_, i) => {
          const cx = rnd() * W
          const cy = rnd() * H
          const r = 5 + rnd() * rnd() * 34
          const k = 4 + Math.floor(rnd() * 3)
          let d = ''
          for (let s = 0; s < k; s++) {
            const a = (s / k) * Math.PI * 2 + rnd() * 0.6
            const rr = r * (0.6 + rnd() * 0.6)
            d += `${s ? 'L' : 'M'}${n(cx + Math.cos(a) * rr)} ${n(cy + Math.sin(a) * rr)}`
          }
          return <path key={i} d={`${d}Z`} fill={pick(rnd, chips)} />
        })}
      </>
    )
  }),

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
  // Falling glyphs, frozen mid-fall.
  busy((rnd) => {
    const glyphs = '01アイウエオカキクケコサシスセソタチツテトナニヌネノ'
    const cols: ReactNode[] = []
    for (let x = 12; x < W; x += 34) {
      const top = rnd() * H - 200
      const len = 6 + Math.floor(rnd() * 18)
      cols.push(
        <text key={x} x={x} y={n(top)} fontFamily="monospace" fontSize="24" fill="#22c55e" opacity={n(0.35 + rnd() * 0.65)}>
          {Array.from({ length: len }, (_, i) => (
            <tspan key={i} x={x} dy="28" fill={i === len - 1 ? '#d1fae5' : undefined}>
              {pick(rnd, [...glyphs])}
            </tspan>
          ))}
        </text>,
      )
    }
    return (
      <>
        <rect {...full} fill="#020a04" />
        {cols}
      </>
    )
  }),
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
  // A radar scope, mid-sweep.
  (rnd, id) => {
    const cx = W * (0.62 + rnd() * 0.2)
    const cy = H * 0.5
    const R = 520
    const a = rnd() * Math.PI * 2
    const wedge = `M${n(cx)} ${n(cy)}L${n(cx + Math.cos(a) * R)} ${n(cy + Math.sin(a) * R)}A${R} ${R} 0 0 0 ${n(cx + Math.cos(a - 0.6) * R)} ${n(cy + Math.sin(a - 0.6) * R)}Z`
    return (
      <>
        <defs>
          <radialGradient id={`${id}-scope`} cx="0.5" cy="0.5" r="0.5">
            <stop offset="0" stopColor="#0b3a24" />
            <stop offset="1" stopColor="#031a12" />
          </radialGradient>
        </defs>
        <rect {...full} fill="#031a12" />
        <circle cx={n(cx)} cy={n(cy)} r={R} fill={`url(#${id}-scope)`} />
        <g fill="none" stroke="#22c55e" strokeOpacity="0.5">
          {[1, 2, 3, 4, 5].map((k) => (
            <circle key={k} cx={n(cx)} cy={n(cy)} r={(R / 5) * k} />
          ))}
          <path d={`M${n(cx - R)} ${n(cy)}H${n(cx + R)}M${n(cx)} ${n(cy - R)}V${n(cy + R)}`} />
        </g>
        <path d={wedge} fill="#22c55e" opacity="0.28" />
        {Array.from({ length: 9 }, (_, i) => {
          const b = rnd() * Math.PI * 2
          const d = rnd() * R * 0.9
          return <circle key={i} cx={n(cx + Math.cos(b) * d)} cy={n(cy + Math.sin(b) * d)} r="6" fill="#86efac" opacity={n(0.4 + rnd() * 0.6)} />
        })}
      </>
    )
  },
]
