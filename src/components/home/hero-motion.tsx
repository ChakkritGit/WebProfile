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

/** A sine swell across twice the width, so sliding it one width loops seamlessly. */
function swell(rnd: Rnd, amp: number, waves: number) {
  const W = 3200
  const H = 200
  const phase = rnd() * Math.PI * 2
  let d = `M0 ${H}`
  for (let x = 0; x <= W; x += 20) {
    const y = H * 0.5 + Math.sin((x / W) * Math.PI * 2 * waves + phase) * amp + Math.sin((x / W) * Math.PI * 2 * waves * 3) * amp * 0.25
    d += `L${x} ${y.toFixed(1)}`
  }
  return `${d}L${W} ${H}Z`
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
      <div className={layer} style={{ background: sky }}>
        {tones.map((tone, i) => (
          <div key={tone} className="absolute inset-x-0 overflow-hidden" style={{ bottom: 0, height: `${34 - i * 5}%` }}>
            <svg
              viewBox="0 0 3200 200"
              preserveAspectRatio="none"
              className="hero-anim-drift absolute bottom-0 left-0 h-full w-[200%]"
              style={{ animationDuration: `${28 - i * 4}s`, animationDirection: i % 2 ? 'reverse' : 'normal' }}
            >
              <path d={swell(rnd, 16 + i * 6, 4 + i)} fill={tone} />
            </svg>
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
            left: '-20%',
            right: '-20%',
            top: `${8 + i * 9}%`,
            height: '38%',
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
    const cols = Array.from({ length: 44 }, (_, i) => ({
      x: (i / 44) * 100,
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
            style={{ left: `${c.x}%`, opacity: c.o, animationDuration: `${c.dur}s`, animationDelay: `${c.delay}s` }}
          >
            {c.text}
          </div>
        ))}
      </div>
    )
  },
  // A radar scope, sweeping.
  (rnd) => {
    const cx = 62 + rnd() * 18
    return (
      <div className={`${layer} overflow-hidden`} style={{ background: '#031a12' }}>
        <svg viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice" className={layer}>
          <g fill="none" stroke="#22c55e" strokeOpacity="0.45">
            {[1, 2, 3, 4, 5].map((k) => (
              <circle key={k} cx={(cx / 100) * 1600} cy="450" r={k * 110} />
            ))}
            <path d={`M${(cx / 100) * 1600 - 560} 450H${(cx / 100) * 1600 + 560}M${(cx / 100) * 1600} -110V1010`} />
          </g>
          {Array.from({ length: 9 }, (_, i) => {
            const a = rnd() * Math.PI * 2
            const d = rnd() * 500
            return <circle key={i} cx={(cx / 100) * 1600 + Math.cos(a) * d} cy={450 + Math.sin(a) * d} r="6" fill="#86efac" opacity={0.4 + rnd() * 0.6} />
          })}
        </svg>
        <div
          className="hero-anim-spin absolute aspect-square"
          style={{
            width: '72vmax',
            left: `calc(${cx}% - 36vmax)`,
            top: 'calc(50% - 36vmax)',
            background: 'conic-gradient(from 0deg, #22c55e66, transparent 22%)',
            borderRadius: '50%',
            animationDuration: '6s',
          }}
        />
      </div>
    )
  },
]
