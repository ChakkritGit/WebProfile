'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslations } from 'next-intl'
import type { Act } from './engine/engine'
import type { Actor } from './hologram-chat'

const INK = '#3b2612' // sepia, ink on parchment
const EDGE = '#8d6634'

/**
 * Mr. Worldwide as a parchment scroll, fixed in the bottom-right corner; while
 * the quick-contact dock is out it steps aside for it (globals.css). Clicking it
 * unrolls the chat. It acts the conversation
 * out as the globe did - rolling itself up while it thinks, writing while it
 * answers, opening wide when it has something to recommend - with SVG and CSS
 * alone (the acts are keyed off `data-act` in globals.css), so no three.js is
 * fetched for it.
 */
export function ScrollGuide({ onReady, onOpen }: { onReady(actor: Actor | null): void; onOpen(): void }) {
  const t = useTranslations('assistant')
  const button = useRef<HTMLButtonElement>(null)
  const [act, setAct] = useState<Act>(null)
  // Bumped to replay the hop: its wrapper is keyed on it.
  const [hops, setHops] = useState(0)
  const [away, setAway] = useState(false)

  const actor = useMemo<Actor>(
    () => ({
      setAct,
      wave: () => setHops((n) => n + 1),
      anchor: () => {
        const r = button.current?.getBoundingClientRect()
        return r ? { x: r.left + r.width / 2, y: r.top } : { x: innerWidth / 2, y: innerHeight }
      },
    }),
    [],
  )
  useEffect(() => {
    onReady(actor)
    return () => onReady(null)
  }, [actor, onReady])

  // Phones: out of the way while scrolling down, back when it stops.
  useEffect(() => {
    const mobile = matchMedia('(max-width: 639px)')
    let lastY = scrollY
    let timer = 0
    const scroll = () => {
      if (!mobile.matches) return
      if (scrollY > lastY + 4) setAway(true)
      lastY = scrollY
      clearTimeout(timer)
      timer = window.setTimeout(() => setAway(false), 600)
    }
    addEventListener('scroll', scroll, { passive: true })
    return () => {
      removeEventListener('scroll', scroll)
      clearTimeout(timer)
    }
  }, [])

  return (
    <button
      ref={button}
      type="button"
      onClick={() => {
        actor.wave()
        onOpen()
      }}
      aria-label={`${t('title')} - ${t('placeholder')}`}
      data-act={act ?? 'idle'}
      className={away ? 'sg sg-away' : 'sg'}
    >
      <span className="sg-in">
        <span key={hops} className="sg-hop" data-hop={hops > 0 ? '' : undefined}>
          <Figure />
        </span>
      </span>
    </button>
  )
}

const f = (n: number) => n.toFixed(1)

/**
 * The open end of a roll: paper wound inward, seen at an angle (squashed to an
 * ellipse). Half-turns alternately about the centre and a point half a gap to
 * its left, each a little smaller, so the line winds in like rolled paper.
 */
function spiral(cx: number, cy: number, r: number, squash: number, gap: number) {
  const h = gap / 2
  let d = `M${f(cx + r * squash)} ${f(cy)}`
  for (let i = 0, rr = r; rr > h; i++, rr -= h) {
    const end = i % 2 === 0 ? -rr : -h + rr
    d += `A${f(rr * squash)} ${f(rr)} 0 0 1 ${f(cx + end * squash)} ${f(cy)}`
  }
  return d
}

/** The sheet's outline: old paper, its edges a little wavy and worn. */
const SHEET =
  'M46 50C42 78 50 104 44 132C42 146 47 150 43 160C40 182 49 200 45 214L44 238L172 236C170 220 176 202 171 184C168 170 174 160 170 146C166 126 175 106 170 92C168 76 174 62 172 48Z'

/** One roll lying on its side, its open end at the left showing the paper wound up inside. */
function Roll({ d, cx, cy, rx, ry, highlight, className }: { d: string; cx: number; cy: number; rx: number; ry: number; highlight: string; className: string }) {
  const wound = spiral(cx, cy, ry - 2.5, rx / ry, 4.2)
  return (
    <g className={className}>
      <path d={d} fill="url(#sg-roll)" stroke={EDGE} strokeWidth="1.6" strokeLinejoin="round" />
      <path d={highlight} stroke="#fff8e4" strokeOpacity="0.8" strokeWidth="2.4" strokeLinecap="round" fill="none" />
      <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill="url(#sg-hollow)" stroke={EDGE} strokeWidth="1.6" />
      {/* The layers: dark gaps, and the paper's edges catching the light. */}
      <path d={wound} fill="none" stroke="#4a2f12" strokeOpacity="0.8" strokeWidth="2.6" />
      <path d={wound} fill="none" stroke="#efdcb2" strokeWidth="1.2" />
    </g>
  )
}

/**
 * The scroll, after the reference the user chose: old parchment hanging from a
 * roll curled back at the top, rolled toward you at the bottom, with a face
 * drawn on it in sepia ink.
 */
function Figure() {
  return (
    <svg viewBox="0 0 200 260" className="sg-fig" aria-hidden focusable="false">
      <defs>
        {/* Darker toward the edges, where old paper browns first. */}
        <linearGradient id="sg-paper" x1="0" x2="1">
          <stop offset="0" stopColor="#c39556" />
          <stop offset="0.13" stopColor="#e2c794" />
          <stop offset="0.5" stopColor="#f4e6c4" />
          <stop offset="0.86" stopColor="#e4ca97" />
          <stop offset="1" stopColor="#be8f50" />
        </linearGradient>
        {/* Shade under the top roll and over the bottom one. */}
        <linearGradient id="sg-shade" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#5e3d17" stopOpacity="0.5" />
          <stop offset="0.13" stopColor="#5e3d17" stopOpacity="0" />
          <stop offset="0.84" stopColor="#5e3d17" stopOpacity="0" />
          <stop offset="1" stopColor="#5e3d17" stopOpacity="0.45" />
        </linearGradient>
        {/* A roll on its side: lit from above, a dark core, some light bounced back underneath. */}
        <linearGradient id="sg-roll" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#dcc08a" />
          <stop offset="0.22" stopColor="#fbf0d5" />
          <stop offset="0.48" stopColor="#e6cd98" />
          <stop offset="0.82" stopColor="#ad8146" />
          <stop offset="1" stopColor="#c59e64" />
        </linearGradient>
        <radialGradient id="sg-hollow" cx="0.55" cy="0.5" r="0.6">
          <stop offset="0" stopColor="#4f3314" />
          <stop offset="0.7" stopColor="#8a6234" />
          <stop offset="1" stopColor="#b58d55" />
        </radialGradient>
        {/* Foxing: the brown spots old paper gathers. */}
        <radialGradient id="sg-spot">
          <stop offset="0" stopColor="#9c6524" stopOpacity="0.42" />
          <stop offset="1" stopColor="#9c6524" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="sg-feather" x1="0" y1="1" x2="1" y2="0">
          <stop offset="0" stopColor="#d9d2c4" />
          <stop offset="0.5" stopColor="#ffffff" />
          <stop offset="1" stopColor="#eee8dc" />
        </linearGradient>
        {/* Grain: fine noise, browned. */}
        <filter id="sg-grain" x="0" y="0" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed="7" />
          <feColorMatrix values="0 0 0 0 0.38  0 0 0 0 0.25  0 0 0 0 0.1  0.75 0 0 0 -0.22" />
        </filter>
        <filter id="sg-blur" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="5" />
        </filter>
        <clipPath id="sg-clip">
          <path d={SHEET} />
        </clipPath>
      </defs>

      <g className="sg-sheet">
        <path d={SHEET} fill="url(#sg-paper)" />
        <g clipPath="url(#sg-clip)">
          <rect x="38" y="44" width="142" height="200" filter="url(#sg-grain)" />
          <ellipse cx="150" cy="82" rx="24" ry="17" fill="url(#sg-spot)" />
          <ellipse cx="98" cy="64" rx="14" ry="8" fill="url(#sg-spot)" />
          <ellipse cx="62" cy="206" rx="15" ry="10" fill="url(#sg-spot)" />
          <ellipse cx="160" cy="196" rx="10" ry="8" fill="url(#sg-spot)" />
          {/* The edges browned inward. */}
          <path d={SHEET} fill="none" stroke="#7a4c1c" strokeOpacity="0.6" strokeWidth="16" filter="url(#sg-blur)" />
          <rect x="38" y="44" width="142" height="200" fill="url(#sg-shade)" />
        </g>
        <path d={SHEET} fill="none" stroke={EDGE} strokeOpacity="0.85" strokeWidth="1.4" />
        {/* What is written on it, in a running hand; written again while it answers. */}
        <path
          className="sg-lines"
          d="M64 170q4-5 8 0t8 0t8 0t8 0t8 0M112 170q4-5 8 0t8 0t8 0t8 0M64 183q4-5 8 0t8 0t8 0t8 0t8 0t8 0t8 0"
          stroke={INK}
          strokeOpacity="0.5"
          strokeWidth="2"
          strokeLinecap="round"
          fill="none"
        />
      </g>

      <g className="sg-face">
        <path d="M78 98q9-5 18 0M120 98q9-5 18 0" stroke={INK} strokeWidth="3.4" strokeLinecap="round" fill="none" />
        <g className="sg-eyes">
          <g className="sg-eyes-open">
            <ellipse cx="87" cy="116" rx="6.6" ry="9.4" fill={INK} />
            <ellipse cx="129" cy="116" rx="6.6" ry="9.4" fill={INK} />
            <circle cx="89.6" cy="112.6" r="2.3" fill="#fffaf0" />
            <circle cx="131.6" cy="112.6" r="2.3" fill="#fffaf0" />
          </g>
          <path className="sg-eyes-happy" d="M78.5 120q8.5-11 17 0M120.5 120q8.5-11 17 0" stroke={INK} strokeWidth="4" strokeLinecap="round" fill="none" />
        </g>
        <circle cx="70" cy="136" r="6.5" fill="#d07a5e" opacity="0.4" />
        <circle cx="146" cy="136" r="6.5" fill="#d07a5e" opacity="0.4" />
        <path className="sg-smile" d="M97 138q11 9.5 22 0" stroke={INK} strokeWidth="3.8" strokeLinecap="round" fill="none" />
        <ellipse className="sg-mouth" cx="108" cy="142" rx="6.8" ry="6.2" fill={INK} />
      </g>

      {/* Curled back at the top, its open end out past the sheet at the left. */}
      <Roll
        className="sg-top"
        d="M30 20C70 17 140 19 178 24A7 20 0 0 1 178 64C140 60 70 60 30 62Z"
        cx={30}
        cy={41}
        rx={14}
        ry={21}
        highlight="M44 27C80 25 130 26 170 30"
      />
      {/* Rolled toward you at the bottom, a little further right, as in the reference. */}
      <Roll
        className="sg-bottom"
        d="M50 214C90 211 150 210 186 210A6 18 0 0 1 186 246C150 247 90 249 50 250Z"
        cx={50}
        cy={232}
        rx={11}
        ry={18}
        highlight="M62 220C100 217 150 216 180 216"
      />

      {/* A white quill, out only while it answers; its nib on the line it writes. */}
      <g transform="translate(150 184)">
        <g className="sg-pen">
          <path d="M8 -6C16 -26 34 -46 56 -58C50 -40 36 -22 12 -4Z" fill="url(#sg-feather)" stroke="#9a8a72" strokeWidth="1" />
          <path d="M18 -14l6 -1M24 -22l7 -1M31 -30l7 -2M38 -38l7 -2M45 -46l6 -2" stroke="#b9ab92" strokeWidth="0.9" strokeLinecap="round" />
          <path d="M0 0L54 -57" stroke="#6d5532" strokeWidth="1.6" strokeLinecap="round" />
          <path d="M0 0L5 -2L2 -5Z" fill="#24170a" />
        </g>
      </g>
    </svg>
  )
}
