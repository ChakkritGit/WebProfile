'use client'

import { useEffect, useId, useSyncExternalStore } from 'react'
import { useTranslations } from 'next-intl'
import { Image as ImageIcon, ImageOff } from 'lucide-react'
import { DESIGNS, H, W, full, random } from './hero-designs'

/**
 * The picture behind the home page's first screen: one full-bleed image from
 * the collection in `hero-designs.tsx`, a new one every time the page is
 * opened — the seed picks the design and varies it.
 *
 * Chosen in the browser, so it cannot be in the server's markup: until it is
 * drawn the hero shows a dark ground under the same scrim, so the white text
 * is right from the first frame and only the picture arrives, fading in.
 *
 * On by default. The reader can switch it off for the page grid, and that is
 * remembered: `HeroArtScript` applies it before paint, so someone who turned it
 * off never sees it flash in.
 */

const KEY = 'hero-art'

function Artwork({ seed }: { seed: number }) {
  const uid = useId().replace(/:/g, '')
  const rnd = random(seed)
  const design = DESIGNS[seed % DESIGNS.length]
  return (
    <svg aria-hidden viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid slice" className="hero-art-in absolute inset-0 size-full">
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

/* One seed per visit: made on first read, dropped when the hero unmounts, so
   coming back to the page draws a new picture. */
let visitSeed: number | null = null
const noSubscribe = () => () => {}
const readSeed = () => (visitSeed ??= Math.floor(Math.random() * 2 ** 31))

export function HeroArt() {
  const t = useTranslations('home')
  const on = useSyncExternalStore(subscribe, isOn, () => true)
  const seed = useSyncExternalStore(noSubscribe, readSeed, () => null)
  useEffect(
    () => () => {
      visitSeed = null
    },
    [],
  )

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
      <div
        data-art
        data-busy={seed !== null && DESIGNS[seed % DESIGNS.length].busy ? '' : undefined}
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[#0b0b12]"
      >
        {seed !== null && <Artwork seed={seed} />}
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
