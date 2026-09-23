'use client'

import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useTranslations } from 'next-intl'
import { useReducedMotion } from 'motion/react'
import { LayoutGrid, Orbit, Pause, Play, ZoomIn, ZoomOut } from 'lucide-react'
import { Link } from '@/i18n/navigation'
import { tagSlug } from '@/lib/search'
import type { TopicLayer, TopicMap } from '@/lib/topics'
import { cn } from '@/lib/utils'

/**
 * The topics as an orb: articles' tags on an inner sphere, projects' on an
 * outer shell, a line wherever two were used on the same piece. It turns on its
 * own, drags to turn, pinches or scrolls to zoom, and unfolds into a grid of
 * the two layers with the same lines still drawn between them.
 *
 * DOM nodes rather than a canvas, because every node is a link: focusable, a
 * real `href`, text that selects and translates. Positions are written straight
 * to `style.transform` from one animation frame loop — React renders the nodes
 * once and never re-renders them for motion. Written by hand rather than with a
 * 3D library: the projection is four lines of arithmetic.
 */

type Mode = 'orb' | 'grid'
type Filter = 'all' | TopicLayer

/** Shell radii, in units of the stage's scale. */
const RADIUS: Record<TopicLayer, number> = { inner: 1, outer: 1.7 }
/** Camera distance, same units. Smaller exaggerates the perspective. */
const CAMERA = 4.2
const TILT = 0.38
const ORB_HEIGHT = { narrow: 380, wide: 460 }
const ROW = 44
const CELL = 150

interface Point {
  x: number
  y: number
  /** 0 at the back of the orb, 1 at the front. */
  depth: number
  scale: number
}

function columns(width: number) {
  return Math.max(2, Math.floor((width - 32) / CELL))
}

/** Top of a layer's band in the grid view. The outer band starts below the inner one's rows. */
function bandTop(layer: TopicLayer, width: number, innerCount: number) {
  if (layer === 'inner') return 40
  return 40 + 44 + Math.max(1, Math.ceil(innerCount / columns(width))) * ROW + 32
}

/** An even scatter over a sphere from the index alone, so server and client agree. */
function onSphere(index: number, total: number, radius: number, twist: number): [number, number, number] {
  const y = total === 1 ? 0 : 1 - (index / (total - 1)) * 2
  const r = Math.sqrt(Math.max(0, 1 - y * y))
  const theta = index * 2.399963229728653 + twist
  return [Math.cos(theta) * r * radius, y * radius, Math.sin(theta) * r * radius]
}

export function TagOrb({ map }: { map: TopicMap }) {
  const t = useTranslations('home')
  const reduce = useReducedMotion()
  const [mode, setMode] = useState<Mode>('orb')
  const [filter, setFilter] = useState<Filter>('all')
  const [paused, setPaused] = useState(false)
  const [height, setHeight] = useState(ORB_HEIGHT.wide)
  const [width, setWidth] = useState(0)

  const stage = useRef<HTMLDivElement>(null)
  const nodeEls = useRef<(HTMLAnchorElement | null)[]>([])
  const edgeEls = useRef<(SVGLineElement | null)[]>([])
  const ringEls = useRef<(SVGPathElement | null)[]>([])
  const bandEls = useRef<(HTMLParagraphElement | null)[]>([])

  // Everything the frame loop reads lives here, so changing it never re-renders.
  const live = useRef({
    rx: TILT,
    ry: 0,
    zoom: 1,
    blend: 0,
    mode: 'orb' as Mode,
    filter: 'all' as Filter,
    spinning: true,
    hovered: -1,
    width: 0,
    height: ORB_HEIGHT.wide,
    /** The orb keeps its own height while the grid grows the stage around it. */
    orbHeight: ORB_HEIGHT.wide,
    visible: false,
    kick: () => {},
  })

  const { nodes, edges } = map
  const layers = { inner: nodes.filter((n) => n.layer === 'inner'), outer: nodes.filter((n) => n.layer === 'outer') }

  // Sync React state into the loop's view of the world.
  useEffect(() => {
    const s = live.current
    s.mode = mode
    s.filter = filter
    s.spinning = !paused && !reduce
    if (reduce) s.blend = mode === 'grid' ? 1 : 0
    s.kick()
  }, [mode, filter, paused, reduce])

  // The grid needs more height than the orb once there are many rows.
  useLayoutEffect(() => {
    const el = stage.current
    if (!el) return
    const measure = () => {
      const width = el.clientWidth
      const rows = Math.max(1, Math.ceil(layers.outer.length / columns(width)))
      const grid = bandTop('outer', width, layers.inner.length) + 44 + rows * ROW
      const orb = width < 640 ? ORB_HEIGHT.narrow : ORB_HEIGHT.wide
      const next = mode === 'grid' ? Math.max(orb, grid) : orb
      live.current.width = width
      live.current.height = next
      live.current.orbHeight = orb
      setWidth(width)
      setHeight(next)
      live.current.kick()
    }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(el)
    return () => observer.disconnect()
  }, [mode, layers.inner.length, layers.outer.length])

  // The loop. It stops itself whenever nothing is moving or the orb is off
  // screen — an animation nobody can see still costs a phone its main thread.
  useEffect(() => {
    const el = stage.current
    if (!el) return
    const s = live.current
    let frame = 0
    let last = 0
    let running = false

    // Where each node sits on its shell before any rotation.
    const seen = { inner: 0, outer: 0 }
    const base = nodes.map((node) => {
      const i = seen[node.layer]++
      return onSphere(i, layers[node.layer].length, RADIUS[node.layer], node.layer === 'outer' ? 1.3 : 0)
    })

    const gridPoint = (index: number): Point => {
      const node = nodes[index]
      const list = layers[node.layer]
      const i = list.indexOf(node)
      const cols = columns(s.width)
      const cell = (s.width - 32) / cols
      return {
        x: 16 + cell * (i % cols) + cell / 2,
        y: bandTop(node.layer, s.width, layers.inner.length) + 44 + Math.floor(i / cols) * ROW,
        depth: 1,
        scale: 1,
      }
    }

    const orbPoint = ([x0, y0, z0]: [number, number, number]): Point => {
      const cy = Math.cos(s.ry), sy = Math.sin(s.ry), cx = Math.cos(s.rx), sx = Math.sin(s.rx)
      const x1 = x0 * cy + z0 * sy
      const z1 = -x0 * sy + z0 * cy
      const y2 = y0 * cx - z1 * sx
      const z2 = y0 * sx + z1 * cx
      const unit = Math.min(s.width, s.orbHeight) * 0.27 * s.zoom
      const p = CAMERA / (CAMERA + z2)
      return {
        x: s.width / 2 + x1 * unit * p,
        y: s.orbHeight / 2 + y2 * unit * p,
        depth: (RADIUS.outer - z2) / (2 * RADIUS.outer),
        scale: p,
      }
    }

    const shown = (layer: TopicLayer) => s.filter === 'all' || s.filter === layer
    const ease = (v: number) => v * v * (3 - 2 * v)

    const draw = () => {
      const k = ease(s.blend)
      const points = nodes.map((_, i) => {
        const a = orbPoint(base[i])
        if (k === 0) return a
        const b = gridPoint(i)
        return {
          x: a.x + (b.x - a.x) * k,
          y: a.y + (b.y - a.y) * k,
          depth: a.depth + (b.depth - a.depth) * k,
          scale: a.scale + (b.scale - a.scale) * k,
        }
      })

      const hover = s.hovered
      const linked = new Set<number>()
      if (hover >= 0) {
        linked.add(hover)
        for (const [a, b] of edges) {
          if (a === hover) linked.add(b)
          if (b === hover) linked.add(a)
        }
      }

      points.forEach((point, i) => {
        const el = nodeEls.current[i]
        if (!el) return
        const visible = shown(nodes[i].layer)
        let opacity = 0.3 + 0.7 * point.depth
        if (hover >= 0 && !linked.has(i)) opacity *= 0.35
        if (!visible) opacity = 0.08
        el.style.transform = `translate3d(${point.x}px, ${point.y}px, 0) translate(-50%, -50%) scale(${point.scale})`
        el.style.opacity = String(opacity)
        el.style.zIndex = String(Math.round(point.depth * 100))
        el.style.pointerEvents = visible ? 'auto' : 'none'
        el.tabIndex = visible ? 0 : -1
      })

      edges.forEach(([a, b], i) => {
        const line = edgeEls.current[i]
        if (!line) return
        const pa = points[a], pb = points[b]
        line.setAttribute('x1', String(pa.x))
        line.setAttribute('y1', String(pa.y))
        line.setAttribute('x2', String(pb.x))
        line.setAttribute('y2', String(pb.y))
        const visible = shown(nodes[a].layer) && shown(nodes[b].layer)
        const touches = hover >= 0 && (a === hover || b === hover)
        let opacity = 0.1 + 0.25 * Math.min(pa.depth, pb.depth)
        if (touches) opacity = 0.9
        else if (hover >= 0) opacity *= 0.4
        line.style.opacity = String(visible ? opacity : 0.02)
      })

      // The two orbits, drawn in the same projection so they turn with the orb.
      ;(['inner', 'outer'] as const).forEach((layer, r) => {
        const ring = ringEls.current[r]
        if (!ring) return
        let d = ''
        for (let step = 0; step <= 72; step++) {
          const angle = (step / 72) * Math.PI * 2
          const radius = RADIUS[layer] * (layer === 'outer' ? 0.98 : 1.04)
          const lean = layer === 'outer' ? 0.35 : -0.2
          const x = Math.cos(angle) * radius
          const z = Math.sin(angle) * radius
          const p = orbPoint([x, z * Math.sin(lean), z * Math.cos(lean)])
          d += `${step ? 'L' : 'M'}${p.x.toFixed(1)} ${p.y.toFixed(1)}`
        }
        ring.setAttribute('d', d)
        ring.style.opacity = String((1 - k) * (shown(layer) ? 0.45 : 0.08))
      })

      bandEls.current.forEach((band) => {
        if (band) band.style.opacity = String(k)
      })
    }

    const tick = (now: number) => {
      const dt = last ? Math.min(0.05, (now - last) / 1000) : 0.016
      last = now
      const target = s.mode === 'grid' ? 1 : 0
      if (s.blend !== target) {
        const step = dt * 2.6
        s.blend = target > s.blend ? Math.min(target, s.blend + step) : Math.max(target, s.blend - step)
      }
      if (s.spinning && s.mode === 'orb') s.ry += dt * 0.18
      draw()
      const moving = s.blend !== target || (s.spinning && s.mode === 'orb')
      if (moving && s.visible && !document.hidden) frame = requestAnimationFrame(tick)
      else {
        running = false
        last = 0
      }
    }

    s.kick = () => {
      if (running) return
      if (!s.visible) {
        draw()
        return
      }
      running = true
      frame = requestAnimationFrame(tick)
    }

    const io = new IntersectionObserver(([entry]) => {
      s.visible = entry.isIntersecting
      s.kick()
    })
    io.observe(el)
    const onVisibility = () => s.kick()
    document.addEventListener('visibilitychange', onVisibility)
    draw()

    return () => {
      cancelAnimationFrame(frame)
      io.disconnect()
      document.removeEventListener('visibilitychange', onVisibility)
      s.kick = () => {}
    }
    // `nodes`, `edges` and `layers` come from props that do not change after mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Drag to turn, two fingers or a wheel to zoom. The wheel only zooms once the
  // reader has pressed on the orb, so scrolling past it never gets captured.
  useEffect(() => {
    const el = stage.current
    if (!el) return
    const s = live.current
    const pointers = new Map<number, { x: number; y: number }>()
    let engaged = false
    let travelled = 0
    let spread = 0

    const zoomBy = (factor: number) => {
      s.zoom = Math.min(2.4, Math.max(0.6, s.zoom * factor))
      s.kick()
      // One frame even when the loop is idle (grid mode, or paused).
      requestAnimationFrame(() => s.kick())
    }

    const down = (event: PointerEvent) => {
      engaged = true
      travelled = 0
      pointers.set(event.pointerId, { x: event.clientX, y: event.clientY })
      if (pointers.size === 2) {
        const [a, b] = [...pointers.values()]
        spread = Math.hypot(a.x - b.x, a.y - b.y)
      }
    }
    const move = (event: PointerEvent) => {
      const prev = pointers.get(event.pointerId)
      if (!prev || s.mode !== 'orb') return
      const next = { x: event.clientX, y: event.clientY }
      pointers.set(event.pointerId, next)
      if (pointers.size === 2) {
        const [a, b] = [...pointers.values()]
        const now = Math.hypot(a.x - b.x, a.y - b.y)
        if (spread) zoomBy(now / spread)
        spread = now
        return
      }
      const dx = next.x - prev.x
      const dy = next.y - prev.y
      travelled += Math.abs(dx) + Math.abs(dy)
      if (travelled > 4) el.setPointerCapture?.(event.pointerId)
      s.ry += dx * 0.006
      s.rx = Math.min(1.2, Math.max(-1.2, s.rx + dy * 0.006))
      if (!s.spinning) s.kick()
      requestAnimationFrame(() => s.kick())
    }
    const up = (event: PointerEvent) => {
      pointers.delete(event.pointerId)
      spread = 0
    }
    // A drag that ends on a node must not also open it.
    const click = (event: MouseEvent) => {
      if (travelled > 4) {
        event.preventDefault()
        event.stopPropagation()
      }
    }
    const wheel = (event: WheelEvent) => {
      if (!engaged || s.mode !== 'orb') return
      event.preventDefault()
      zoomBy(Math.exp(-event.deltaY * 0.0015))
    }
    const leave = () => {
      engaged = false
    }

    el.addEventListener('pointerdown', down)
    el.addEventListener('pointermove', move)
    el.addEventListener('pointerup', up)
    el.addEventListener('pointercancel', up)
    el.addEventListener('pointerleave', leave)
    el.addEventListener('click', click, true)
    el.addEventListener('wheel', wheel, { passive: false })
    return () => {
      el.removeEventListener('pointerdown', down)
      el.removeEventListener('pointermove', move)
      el.removeEventListener('pointerup', up)
      el.removeEventListener('pointercancel', up)
      el.removeEventListener('pointerleave', leave)
      el.removeEventListener('click', click, true)
      el.removeEventListener('wheel', wheel)
    }
  }, [])

  const hover = (index: number) => {
    live.current.hovered = index
    live.current.kick()
    requestAnimationFrame(() => live.current.kick())
  }

  const zoom = (factor: number) => {
    const s = live.current
    s.zoom = Math.min(2.4, Math.max(0.6, s.zoom * factor))
    s.kick()
    requestAnimationFrame(() => s.kick())
  }

  const segment = (on: boolean) =>
    cn(
      'inline-flex h-9 items-center gap-1.5 px-2.5 font-mono text-[0.7rem] uppercase transition-colors sm:px-3',
      on ? 'bg-brand text-brand-ink' : 'text-ink-soft hover:text-brand-strong',
    )

  return (
    <div className="border-line bg-surface relative overflow-hidden border">
      <div aria-hidden className="star-grid pointer-events-none absolute inset-0" />
      <div
        ref={stage}
        role="group"
        aria-label={t('orbLabel')}
        // Clipped: zoomed in, the outer shell reaches past the stage, and the
        // nodes' depth z-index would otherwise lift them over the controls.
        className={cn('relative overflow-hidden select-none', mode === 'orb' ? 'cursor-grab active:cursor-grabbing' : '')}
        style={{ height, touchAction: mode === 'orb' ? 'pan-y' : 'auto', transition: 'height 300ms ease' }}
      >
        <svg aria-hidden className="pointer-events-none absolute inset-0 size-full">
          <path ref={(el) => { ringEls.current[0] = el }} fill="none" stroke="var(--brand-strong)" strokeWidth="1" />
          <path ref={(el) => { ringEls.current[1] = el }} fill="none" stroke="var(--accent-2)" strokeWidth="1" />
          {edges.map(([a, b], i) => (
            <line
              key={`${a}-${b}`}
              ref={(el) => { edgeEls.current[i] = el }}
              stroke={
                nodes[a].layer !== nodes[b].layer
                  ? 'var(--muted)'
                  : nodes[a].layer === 'inner'
                    ? 'var(--brand-strong)'
                    : 'var(--accent-2)'
              }
              strokeWidth="1"
            />
          ))}
        </svg>

        {(['inner', 'outer'] as const).map((layer, i) => (
          <p
            key={layer}
            ref={(el) => { bandEls.current[i] = el }}
            aria-hidden
            style={{ opacity: 0, top: bandTop(layer, width, layers.inner.length) - 16 }}
            className={cn(
              'label-mono border-line pointer-events-none absolute inset-x-4 border-b pb-1.5',
              layer === 'inner' ? 'text-brand-strong' : 'text-accent-2',
            )}
          >
            {t(layer === 'inner' ? 'orbInnerBand' : 'orbOuterBand')}
          </p>
        ))}

        {nodes.map((node, i) => (
          <Link
            key={node.tag}
            ref={(el) => { nodeEls.current[i] = el }}
            href={`/topics/${tagSlug(node.tag)}`}
            title={`${node.tag} · ${node.count}`}
            draggable={false}
            onPointerEnter={() => hover(i)}
            onPointerLeave={() => hover(-1)}
            onFocus={() => hover(i)}
            onBlur={() => hover(-1)}
            // Parked off-stage until the first frame places it.
            style={{ transform: 'translate3d(-9999px, 0, 0)' }}
            className={cn(
              'bg-surface absolute top-0 left-0 inline-flex max-w-[140px] items-center gap-1.5 border px-2 py-1 text-xs whitespace-nowrap no-underline',
              'hover:bg-brand-soft focus-visible:bg-brand-soft',
              node.layer === 'inner' ? 'border-brand-strong/40' : 'border-accent-2/40',
            )}
          >
            <span
              aria-hidden
              className={cn('size-1.5 shrink-0 rounded-full', node.layer === 'inner' ? 'bg-brand-strong' : 'bg-accent-2')}
            />
            <span className="truncate">{node.tag}</span>
          </Link>
        ))}
      </div>

      {/* Controls, like the reference: view · layers · zoom · motion. */}
      <div className="border-line bg-surface relative z-10 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 border-t px-2 py-2">
        <div className="border-line flex border">
          <button type="button" aria-pressed={mode === 'orb'} onClick={() => setMode('orb')} className={segment(mode === 'orb')}>
            <Orbit aria-hidden className="size-3.5" />
            <span className="hidden sm:inline">{t('orbView3d')}</span>
            <span className="sr-only sm:hidden">{t('orbView3d')}</span>
          </button>
          <button type="button" aria-pressed={mode === 'grid'} onClick={() => setMode('grid')} className={segment(mode === 'grid')}>
            <LayoutGrid aria-hidden className="size-3.5" />
            <span className="hidden sm:inline">{t('orbViewGrid')}</span>
            <span className="sr-only sm:hidden">{t('orbViewGrid')}</span>
          </button>
        </div>

        <div className="flex">
          {(['all', 'inner', 'outer'] as const).map((value) => (
            <button key={value} type="button" aria-pressed={filter === value} onClick={() => setFilter(value)} className={segment(filter === value)}>
              {value !== 'all' && (
                <span aria-hidden className={cn('size-1.5 rounded-full', value === 'inner' ? 'bg-brand-strong' : 'bg-accent-2', filter === value && 'bg-brand-ink')} />
              )}
              {t(value === 'all' ? 'orbAll' : value === 'inner' ? 'orbInner' : 'orbOuter')}
            </button>
          ))}
        </div>

        {mode === 'orb' && (
          <div className="flex">
            <button type="button" onClick={() => zoom(1.2)} aria-label={t('orbZoomIn')} className={segment(false)}>
              <ZoomIn aria-hidden className="size-3.5" />
            </button>
            <button type="button" onClick={() => zoom(1 / 1.2)} aria-label={t('orbZoomOut')} className={segment(false)}>
              <ZoomOut aria-hidden className="size-3.5" />
            </button>
            {!reduce && (
              <button
                type="button"
                onClick={() => setPaused((v) => !v)}
                aria-label={paused ? t('orbPlay') : t('orbPause')}
                className={segment(false)}
              >
                {paused ? <Play aria-hidden className="size-3.5" /> : <Pause aria-hidden className="size-3.5" />}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
