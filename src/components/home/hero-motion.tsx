import type { CSSProperties, ReactNode } from 'react'
import { random } from './hero-designs'

/**
 * The hero designs that move. Each is stacked HTML layers whose motion is a
 * CSS transform or opacity — work the compositor does on its own, frame after
 * frame, without repainting. (Animating shapes inside one big SVG would repaint
 * the whole screen every frame.) Keyframes live in globals.css under
 * `hero-anim-*`; they stop for reduced motion and while the hero is off screen.
 */

type Rnd = () => number
export type MotionDesign = (rnd: Rnd) => ReactNode

const pick = <T,>(rnd: Rnd, list: readonly T[]) => list[Math.floor(rnd() * list.length)]
const layer = 'absolute inset-0'

/**
 * One tile of swell, as a data URI: a fixed 800×120 wave that repeats across
 * the screen at its own size, so the sea looks the same on a phone and on an
 * ultrawide. (A single path stretched to the width made the waves long on wide
 * screens and cramped on tall ones.) The tile starts and ends at the same
 * height, so sliding a whole tile loops without a seam.
 */
const TILE = 800
function swellTile(rnd: Rnd, amp: number, color: string) {
  const H = 120
  const k = 1 + Math.floor(rnd() * 2)
  const phase = rnd() * Math.PI * 2
  let d = `M0 ${H}`
  for (let x = 0; x <= TILE; x += 10) {
    const t = (x / TILE) * Math.PI * 2
    const y = H * 0.45 + Math.sin(t * k + phase) * amp + Math.sin(t * k * 3 + phase * 2) * amp * 0.22
    d += `L${x} ${y.toFixed(1)}`
  }
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${TILE}" height="${H}" viewBox="0 0 ${TILE} ${H}" preserveAspectRatio="none"><path d="${d}L${TILE} ${H}Z" fill="${color}"/></svg>`
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`
}

function Stars({ rnd, count, style }: { rnd: Rnd; count: number; style?: CSSProperties }) {
  return (
    <svg viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice" className={layer} style={style}>
      {Array.from({ length: count }, (_, i) => (
        <circle key={i} cx={(rnd() * 1600).toFixed(1)} cy={(rnd() * 900).toFixed(1)} r={(0.5 + rnd() * rnd() * 2).toFixed(2)} fill="#fff" />
      ))}
    </svg>
  )
}

export const MOTION_DESIGNS: MotionDesign[] = [
  // The sea, swell after swell rolling in.
  (rnd) => {
    const sky = pick(rnd, [
      'linear-gradient(#0b1d3a, #3d6ea5 55%, #f3b27a)',
      'linear-gradient(#1a1030, #7b3f6e 55%, #f7a86b)',
      'linear-gradient(#0c2a3f, #5aa0c8 60%, #dfeef5)',
    ])
    const tones = ['#1d4e7a', '#153c61', '#0f2f4d', '#0a233a', '#061827']
    return (
      <div className={`${layer} overflow-hidden`} style={{ background: sky }}>
        {tones.map((tone, i) => (
          // Each layer: a band of fixed height from the bottom, its tile
          // repeated across a strip one tile wider than the screen, slid by
          // exactly one tile.
          <div key={tone} className="absolute inset-x-0" style={{ bottom: `${(4 - i) * 5}vh`, height: 120 }}>
            <div
              className="hero-anim-drift-tile absolute inset-y-0 left-0"
              style={{
                width: `calc(100% + ${TILE}px)`,
                backgroundImage: swellTile(rnd, 14 + i * 4, tone),
                backgroundRepeat: 'repeat-x',
                backgroundSize: `${TILE}px 120px`,
                animationDuration: `${26 - i * 4}s`,
                animationDirection: i % 2 ? 'reverse' : 'normal',
              }}
            />
            {/* The water below the wave line, to the bottom of the screen. */}
            <div className="absolute inset-x-0 top-full" style={{ height: '100vh', background: tone }} />
          </div>
        ))}
      </div>
    )
  },
  // A night sky: the field turning slowly about the pole, stars twinkling.
  (rnd) => {
    const seed = Math.floor(rnd() * 1e6)
    return (
      <div className={layer} style={{ background: 'radial-gradient(ellipse at 70% 20%, #1c2447, #05060f 70%)' }}>
        <div className="hero-anim-spin absolute -inset-[60%]" style={{ animationDuration: '240s' }}>
          <Stars rnd={random(seed)} count={260} />
        </div>
        {[0, 1, 2].map((k) => (
          <div key={k} className="hero-anim-twinkle absolute inset-0" style={{ animationDelay: `${k * 1.3}s`, animationDuration: `${3.5 + k}s` }}>
            <Stars rnd={random(seed + k + 1)} count={40} />
          </div>
        ))}
      </div>
    )
  },
  // Aurora, the curtains swaying.
  (rnd) => (
    <div className={layer} style={{ background: 'linear-gradient(#020617, #0b1b2e 70%, #020409)' }}>
      <Stars rnd={rnd} count={140} style={{ opacity: 0.8 }} />
      {['#34d399', '#22d3ee', '#a78bfa'].map((color, i) => (
        <div
          key={color}
          className="hero-anim-sway absolute"
          style={{
            // In vmax, centred: sized off the longer side, a tall phone still
            // gets wide curtains rather than one round glow.
            left: '50%',
            marginLeft: '-90vmax',
            width: '180vmax',
            top: `${8 + i * 9}%`,
            height: '34vh',
            background: `radial-gradient(ellipse at 50% 50%, ${color}99, ${color}33 45%, transparent 70%)`,
            animationDuration: `${9 + i * 3}s`,
            animationDelay: `${-i * 2}s`,
            mixBlendMode: 'screen',
          }}
        />
      ))}
    </div>
  ),
  // Glyphs falling, column by column.
  (rnd) => {
    const glyphs = [...'01アイウエオカキクケコサシスセソタチツテトナニヌネノ']
    // Columns every 30px from the left, enough for a 2700px-wide screen; the
    // ones past the edge are clipped. A fixed count spread by percent piled
    // them on top of each other on a phone and left gaps on an ultrawide.
    const cols = Array.from({ length: 90 }, (_, i) => ({
      x: i * 30,
      text: Array.from({ length: 14 + Math.floor(rnd() * 14) }, () => pick(rnd, glyphs)).join('\n'),
      dur: 6 + rnd() * 10,
      delay: -rnd() * 16,
      o: 0.35 + rnd() * 0.65,
    }))
    return (
      <div className={`${layer} overflow-hidden`} style={{ background: '#020a04' }}>
        {cols.map((c, i) => (
          <div
            key={i}
            className="hero-anim-fall absolute top-0 font-mono text-[18px] leading-[24px] whitespace-pre text-[#22c55e]"
            style={{ left: c.x, opacity: c.o, animationDuration: `${c.dur}s`, animationDelay: `${c.delay}s` }}
          >
            {c.text}
          </div>
        ))}
      </div>
    )
  },
  // A radar scope, sweeping. Rings, blips and sweep share one square box, so
  // they stay concentric at any aspect; centred on a tall screen, off to the
  // right on a wide one (see .hero-radar in globals.css).
  (rnd) => {
    const cx = 62 + rnd() * 18
    return (
      <div className={`${layer} overflow-hidden`} style={{ background: '#031a12' }}>
        <div className="hero-radar absolute aspect-square" style={{ '--cx': `${cx}%` } as CSSProperties}>
          <svg viewBox="0 0 100 100" className="absolute inset-0 size-full">
            <g fill="none" stroke="#22c55e" strokeOpacity="0.45" strokeWidth="0.15">
              {[1, 2, 3, 4, 5].map((k) => (
                <circle key={k} cx="50" cy="50" r={k * 9.6} />
              ))}
              <path d="M2 50H98M50 2V98" />
            </g>
            {Array.from({ length: 9 }, (_, i) => {
              const a = rnd() * Math.PI * 2
              const d = rnd() * 44
              return <circle key={i} cx={50 + Math.cos(a) * d} cy={50 + Math.sin(a) * d} r="0.55" fill="#86efac" opacity={0.4 + rnd() * 0.6} />
            })}
          </svg>
          <div
            className="hero-anim-spin absolute inset-0 rounded-full"
            style={{ background: 'conic-gradient(from 0deg, #22c55e66, transparent 22%)', animationDuration: '6s' }}
          />
        </div>
      </div>
    )
  },
]
