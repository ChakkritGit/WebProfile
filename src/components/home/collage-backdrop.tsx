'use client'

import { useEffect, useId, useRef, useState, useSyncExternalStore } from 'react'
import { useTranslations } from 'next-intl'
import { useReducedMotion } from 'motion/react'
import { Image as ImageIcon, ImageOff } from 'lucide-react'
import { DESIGNS, H, W, full, random } from './hero-designs'
import { MOTION_DESIGNS } from './hero-motion'
import { PHOTOS, type HeroPhoto } from './hero-photos'
import type { Picture } from './black-hole'

/**
 * The picture behind the first screen, a new one every time the page is
 * opened, from three collections:
 *
 * - drawn designs (`hero-designs.tsx`) — SVG from noise and gradients,
 *   blended blue like everything else;
 * - moving designs (`hero-motion.tsx`) — composited layers in motion, blended
 *   blue the same way (the filter and the blend run on the GPU);
 * - found pictures (`hero-photos.ts`) — public-domain art and NASA imagery,
 *   blended blue like the article covers, drifting slowly (Ken Burns).
 *
 * It opens with a timelapse — a run of the found pictures, fast and then
 * slowing — before settling on the one chosen. Chosen in the browser, so it
 * cannot be in the server's markup: until then the hero is a dark ground under
 * the same scrim, so the white text is right from the first frame.
 *
 * On by default. The reader can switch it off for the page grid, and that is
 * remembered: `HeroArtScript` applies it before paint.
 *
 * Easter egg: typing "ton" (the keys, so a Thai layout works too) swaps the
 * picture for Gargantua, a ray-traced black hole (`black-hole.ts`, loaded only
 * then). "ton" again puts the picture back.
 */

const KEY = 'hero-art'

type Entry =
  | { kind: 'design'; index: number }
  | { kind: 'motion'; index: number }
  | { kind: 'photo'; photo: HeroPhoto }

const TOTAL = DESIGNS.length + MOTION_DESIGNS.length + PHOTOS.length

function entryFor(seed: number): Entry {
  let i = seed % TOTAL
  if (i < DESIGNS.length) return { kind: 'design', index: i }
  i -= DESIGNS.length
  if (i < MOTION_DESIGNS.length) return { kind: 'motion', index: i }
  return { kind: 'photo', photo: PHOTOS[i - MOTION_DESIGNS.length] }
}

function isBusy(entry: Entry) {
  if (entry.kind === 'design') return Boolean(DESIGNS[entry.index].busy)
  if (entry.kind === 'photo') return entry.photo.busy !== false
  return false
}

function Drawn({ seed, index }: { seed: number; index: number }) {
  const uid = useId().replace(/:/g, '')
  return (
    // Blended blue like the covers and the found pictures, so every picture in
    // the collection is in the site's one ink.
    <div className="duotone hero-art-in absolute inset-0">
    <svg aria-hidden viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid slice" className="absolute inset-0 size-full">
      <defs>
        <filter id={`${uid}-grain`} x="0" y="0" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves={2} seed={seed % 997} stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
        </filter>
      </defs>
      {DESIGNS[index](random(seed), `${uid}-d`, seed)}
      {/* Printed-matter grain over everything. */}
      <rect {...full} filter={`url(#${uid}-grain)`} opacity="0.2" style={{ mixBlendMode: 'overlay' }} />
    </svg>
    </div>
  )
}

/** A found picture, blended blue like the covers; `thumb` for the timelapse. */
function Photo({ photo, thumb = false }: { photo: HeroPhoto; thumb?: boolean }) {
  // A cached image can finish before hydration attaches `onLoad`, so the ref
  // checks `complete` too — otherwise it would stay invisible for ever.
  const shown = (el: HTMLImageElement | null) => {
    if (el?.complete) el.classList.add('is-loaded')
  }
  return (
    <div className="duotone absolute inset-0 overflow-hidden">
      {/* The drift is on a wrapper, not the image: the duotone's filter sits on
          the <img>, and Chrome will not run a transform animation on the
          compositor for an element that has a filter. On the image itself it
          ran on the main thread and the slow zoom stepped visibly. */}
      <div className={thumb ? 'absolute inset-0' : 'hero-anim-kenburns absolute inset-0'}>
        {/* eslint-disable-next-line @next/next/no-img-element -- a full-bleed
            background from /public, already sized; the optimiser adds nothing. */}
        <img
          ref={thumb ? undefined : shown}
          src={thumb ? `/hero/thumb/${photo.id}.webp` : `/hero/${photo.id}.webp`}
          alt=""
          onLoad={thumb ? undefined : (e) => e.currentTarget.classList.add('is-loaded')}
          className={thumb ? 'absolute inset-0 size-full object-cover' : 'hero-photo absolute inset-0 size-full object-cover'}
          style={{ objectPosition: photo.focus ?? '50% 50%' }}
        />
      </div>
    </div>
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

/** The easter egg's black hole: three.js, fetched the first time it is asked for. */
function Gargantua({
  reduce,
  picture,
  onReady,
  onBirth,
}: {
  reduce: boolean
  picture: Picture | null
  onReady: () => void
  onBirth: () => void
}) {
  const canvas = useRef<HTMLCanvasElement>(null)
  const hooks = useRef({ picture, onReady, onBirth })
  useEffect(() => {
    let dispose: (() => void) | undefined
    let gone = false
    const { picture, onReady, onBirth } = hooks.current
    import('./black-hole')
      .then(({ createBlackHole }) => {
        if (!gone && canvas.current) dispose = createBlackHole(canvas.current, { reducedMotion: reduce, picture, onReady, onBirth })
      })
      .catch(onBirth) // no WebGL: let the picture go; the dark ground stays
    return () => {
      gone = true
      dispose?.()
    }
  }, [reduce])
  return <canvas ref={canvas} className="absolute inset-0 size-full" />
}

/**
 * The picture on screen, for the black hole to tear apart: a found picture as
 * it is drawn (source, object-position, the drift's scale), or a drawn design's
 * SVG at its rendered size. The moving designs are live DOM and have no still;
 * they fade instead.
 */
function snapshot(root: HTMLElement | null): Picture | null {
  if (!root || root.querySelector('[data-motion]')) return null
  const img = root.querySelector('img')
  if (img?.complete && img.naturalWidth) {
    const [x = '50%', y = '50%'] = (img.style.objectPosition || '50% 50%').split(' ')
    const drift = getComputedStyle(img.parentElement!).transform
    return { src: img.currentSrc || img.src, focus: [parseFloat(x) / 100, parseFloat(y) / 100], scale: drift === 'none' ? 1 : new DOMMatrix(drift).a }
  }
  const svg = root.querySelector('svg')
  if (!svg) return null
  const still = svg.cloneNode(true) as SVGSVGElement
  still.setAttribute('width', String(root.clientWidth))
  still.setAttribute('height', String(root.clientHeight))
  return { src: `data:image/svg+xml;charset=utf-8,${encodeURIComponent(new XMLSerializer().serializeToString(still))}`, focus: [0.5, 0.5], scale: 1 }
}

const TON = ['KeyT', 'KeyO', 'KeyN']

/** The timelapse's pace: fast, then slowing into the final picture. */
const BEATS = [70, 70, 70, 75, 85, 100, 125, 160, 210, 280]

export function HeroArt() {
  const t = useTranslations('home')
  const reduce = useReducedMotion()
  const on = useSyncExternalStore(subscribe, isOn, () => true)
  const seed = useSyncExternalStore(noSubscribe, readSeed, () => null)
  const [frame, setFrame] = useState<HeroPhoto | null>(null)
  const [settled, setSettled] = useState(false)
  const [egg, setEgg] = useState(false)
  // While the black hole starts: the page's picture stays over it until the
  // first frame has the same picture ('hold'), or fades as it is born ('fade').
  const [cover, setCover] = useState<'hold' | 'fade' | null>(null)
  const [picture, setPicture] = useState<Picture | null>(null)
  const art = useRef<HTMLDivElement>(null)
  const eggNow = useRef(false)
  const quaking = useRef<ReturnType<typeof setTimeout>>(undefined)
  // The whole first screen shakes with the birth (see .egg-quake).
  const birth = () => {
    setCover(null)
    document.documentElement.dataset.quake = ''
    clearTimeout(quaking.current)
    quaking.current = setTimeout(() => delete document.documentElement.dataset.quake, 1300)
  }
  const reduceNow = useRef(reduce)
  useEffect(() => {
    reduceNow.current = reduce
  }, [reduce])

  // "ton", typed anywhere but a text field, toggles the black hole.
  useEffect(() => {
    let at = 0
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null
      if (e.metaKey || e.ctrlKey || e.altKey || e.repeat) return
      if (el?.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el?.tagName ?? '')) return
      at = e.code === TON[at] ? at + 1 : e.code === TON[0] ? 1 : 0
      if (at === 2) void import('./black-hole') // "to…": fetch it now, so the birth is on time
      if (at < TON.length) return
      at = 0
      const next = !(eggNow.current && isOn())
      if (!isOn()) {
        // The picture was switched off: show it for this, without remembering.
        document.documentElement.dataset.heroArt = 'on'
        listeners.forEach((notify) => notify())
      }
      eggNow.current = next
      const still = next && !reduceNow.current ? snapshot(art.current) : null
      setPicture(still)
      setCover(next && !reduceNow.current ? (still ? 'hold' : 'fade') : null)
      setEgg(next)
    }
    addEventListener('keydown', onKey)
    return () => {
      removeEventListener('keydown', onKey)
      clearTimeout(quaking.current)
      delete document.documentElement.dataset.quake
    }
  }, [])

  useEffect(
    () => () => {
      visitSeed = null
    },
    [],
  )

  // The opening timelapse. Its pictures are preloaded first (for at most
  // 700ms) so the run is pictures rather than blanks.
  useEffect(() => {
    if (seed === null) return
    const timers: ReturnType<typeof setTimeout>[] = []
    let cancelled = false
    if (reduce || !on) {
      timers.push(setTimeout(() => !cancelled && setSettled(true), 0))
      return () => {
        cancelled = true
        timers.forEach(clearTimeout)
      }
    }
    const rnd = random(seed ^ 0x5bd1e995)
    const run = [...PHOTOS].sort(() => rnd() - 0.5).slice(0, BEATS.length)
    const load = (p: HeroPhoto) =>
      new Promise<void>((resolve) => {
        const img = new Image()
        img.onload = img.onerror = () => resolve()
        img.src = `/hero/thumb/${p.id}.webp`
      })
    void Promise.race([Promise.all(run.map(load)), new Promise((r) => setTimeout(r, 700))]).then(() => {
      if (cancelled) return
      let at = 0
      run.forEach((p, i) => {
        timers.push(setTimeout(() => !cancelled && setFrame(p), at))
        at += BEATS[i]
      })
      timers.push(
        setTimeout(() => {
          if (cancelled) return
          setFrame(null)
          setSettled(true)
        }, at),
      )
    })
    return () => {
      cancelled = true
      timers.forEach(clearTimeout)
    }
    // Once per visit: `on` is read only to skip the run when the picture is off.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seed, reduce])

  // Motion stops while the hero is off screen.
  useEffect(() => {
    const el = art.current
    if (!el) return
    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) el.removeAttribute('data-paused')
      else el.setAttribute('data-paused', '')
    })
    io.observe(el)
    return () => io.disconnect()
  }, [])

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

  const entry = seed === null ? null : entryFor(seed)
  const photo = entry?.kind === 'photo' ? entry.photo : null

  return (
    <>
      <div data-grid aria-hidden className="star-grid pointer-events-none absolute inset-0" />
      <div
        ref={art}
        data-art
        data-busy={!egg && entry && settled && isBusy(entry) ? '' : undefined}
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[#0b0b12]"
      >
        {egg && (
          <Gargantua
            reduce={Boolean(reduce)}
            picture={picture}
            onReady={() => setCover((c) => (c === 'hold' ? null : c))}
            onBirth={birth}
          />
        )}
        {(!egg || cover) && (
          <div className={`absolute inset-0 ${cover === 'fade' ? 'egg-fade' : ''}`}>
            {frame && <Photo key={frame.id} photo={frame} thumb />}
            {!frame && settled && entry && seed !== null && (
              <>
                {entry.kind === 'design' && <Drawn seed={seed} index={entry.index} />}
                {entry.kind === 'motion' && (
                  <div className="duotone hero-art-in absolute inset-0">
                    <div data-motion className="absolute inset-0">
                      {MOTION_DESIGNS[entry.index](random(seed))}
                    </div>
                  </div>
                )}
                {entry.kind === 'photo' && <Photo photo={entry.photo} />}
              </>
            )}
          </div>
        )}
        {/* A scrim under the text column, so white type reads on any design.
            The black hole is its own dark ground: a lighter one lets it glow. */}
        <div
          className={`absolute inset-0 bg-gradient-to-r from-black/75 via-black/45 to-black/10 transition-opacity duration-[2500ms] ${egg ? 'opacity-0' : ''}`}
        />
        <div
          className={`absolute inset-0 bg-gradient-to-r from-black/55 via-black/10 to-transparent transition-opacity duration-[2500ms] ${egg ? '' : 'opacity-0'}`}
        />
      </div>
      {/* Bottom-left: the quick-contact dock owns the bottom-right corner of the
          screen, and scrolled a little it lands right over this spot. */}
      <div className="absolute start-4 end-4 bottom-4 z-10 flex items-center gap-3 sm:start-6">
        <button
          type="button"
          onClick={toggle}
          aria-pressed={on}
          className="bg-surface/90 text-ink-soft hover:text-brand-strong border-line inline-flex h-9 shrink-0 items-center gap-1.5 border px-3 font-mono text-[0.7rem] uppercase backdrop-blur transition-colors"
        >
          {on ? <ImageOff aria-hidden className="size-3.5" /> : <ImageIcon aria-hidden className="size-3.5" />}
          {t(on ? 'bgOff' : 'bgOn')}
        </button>
        {on && egg && <span className="min-w-0 truncate font-mono text-[0.7rem] text-white/75">{t('egg')}</span>}
        {on && !egg && photo && settled && (
          <a
            href={photo.url}
            target="_blank"
            rel="noreferrer noopener"
            className="min-w-0 truncate font-mono text-[0.7rem] text-white/75 no-underline hover:text-white"
            title={`${photo.title} — ${photo.by}${photo.date ? `, ${photo.date}` : ''} · ${photo.source}`}
          >
            {photo.title} — {photo.by}
            {photo.date ? `, ${photo.date}` : ''} · {photo.source}
          </a>
        )}
      </div>
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
