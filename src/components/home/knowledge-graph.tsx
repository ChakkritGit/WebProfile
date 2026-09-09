'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'

/**
 * The work as a graph: every piece a node, every shared tag an edge.
 *
 * A portfolio is usually a list, and a list says only what order things were
 * made in. What is actually true about this work is that the same handful of
 * ideas keeps recurring — a project and an article three years apart turn out to
 * be about the same thing — and that is a shape, not a sequence. So the tags do
 * the drawing: two pieces that share one are tied together, and the clusters
 * that form are the subjects, arrived at rather than declared.
 *
 * Written against a canvas rather than a 3D library. three.js is most of a
 * megabyte to draw sixty dots and some lines, and everything here — the
 * projection, the layout, the depth ordering — is a few lines of arithmetic that
 * can then be tuned exactly. The cost is that it is arithmetic somebody has to
 * read, which is why it is spelled out below.
 */

export interface GraphNode {
  id: string
  title: string
  kind: 'post' | 'project'
  href: string
  tags: string[]
}

/** Layout state for one node: position and velocity in three dimensions. */
interface Body {
  x: number
  y: number
  z: number
  vx: number
  vy: number
  vz: number
  node: GraphNode
  /** Where it landed on screen last frame, for hit-testing. */
  sx: number
  sy: number
  sz: number
  r: number
}

/** How far the eye is from the middle of the cloud, in the same units. */
const FOV = 900
const SPREAD = 190

function edgesOf(nodes: GraphNode[]) {
  const edges: [number, number, number][] = []
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const shared = nodes[i].tags.filter((tag) => nodes[j].tags.includes(tag)).length
      if (shared > 0) edges.push([i, j, shared])
    }
  }
  return edges
}

/**
 * A deterministic scatter over a sphere.
 *
 * `Math.random` would put the cloud somewhere different on the server and in the
 * browser, and the first frame after hydration would jump. The golden-angle
 * spiral gives an even spread from the index alone.
 */
function seed(index: number, total: number): [number, number, number] {
  const y = 1 - (index / Math.max(1, total - 1)) * 2
  const radius = Math.sqrt(Math.max(0, 1 - y * y))
  const theta = index * 2.399963229728653
  return [Math.cos(theta) * radius * SPREAD, y * SPREAD, Math.sin(theta) * radius * SPREAD]
}

export function KnowledgeGraph({ nodes }: { nodes: GraphNode[] }) {
  const t = useTranslations('home')
  const router = useRouter()
  const frame = useRef<HTMLDivElement>(null)
  const canvas = useRef<HTMLCanvasElement>(null)
  const [hovered, setHovered] = useState<string | null>(null)
  const [full, setFull] = useState(false)

  // Everything the animation touches lives in refs: it runs sixty times a
  // second and must not re-render React to do it.
  const bodies = useRef<Body[]>([])
  const hoverRef = useRef<string | null>(null)
  const pointer = useRef<{ x: number; y: number } | null>(null)
  const spin = useRef({ angle: 0, tilt: -0.22, drag: null as null | { x: number; y: number } })

  /**
   * Full screen twice over.
   *
   * The Fullscreen API is asked first, because on a desktop it gives the real
   * thing — the browser chrome goes too. It is not available for an ordinary
   * element on iOS, and it can be refused anywhere, so the state that makes this
   * fill the window is set regardless and the API is treated as a bonus. That
   * way the button does what it says on every device, and on the ones that can
   * do better, it does better.
   */
  const onFullscreen = useCallback(() => {
    const node = frame.current
    setFull((open) => {
      if (open) {
        if (document.fullscreenElement) void document.exitFullscreen().catch(() => {})
        return false
      }
      void node?.requestFullscreen?.().catch(() => {})
      return true
    })
  }, [])

  useEffect(() => {
    // Leaving by Escape or the browser's own control has to bring the state back
    // with it, or the overlay would stay behind on its own.
    const onChange = () => {
      if (!document.fullscreenElement) setFull(false)
    }
    document.addEventListener('fullscreenchange', onChange)
    return () => document.removeEventListener('fullscreenchange', onChange)
  }, [])

  // Escape closes it, whichever kind of full screen it turned out to be. The
  // browser handles the key itself when the API is in play, but only when the
  // API is in play — leaving it to that alone left the overlay open on every
  // device that had fallen back to it.
  useEffect(() => {
    if (!full) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      if (document.fullscreenElement) void document.exitFullscreen().catch(() => {})
      setFull(false)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [full])

  useEffect(() => {
    const surface = canvas.current
    const box = frame.current
    if (!surface || !box || nodes.length === 0) return

    const ctx = surface.getContext('2d')
    if (!ctx) return

    const edges = edgesOf(nodes)
    const neighbours = new Map<string, Set<string>>()
    for (const [a, b] of edges) {
      if (!neighbours.has(nodes[a].id)) neighbours.set(nodes[a].id, new Set())
      if (!neighbours.has(nodes[b].id)) neighbours.set(nodes[b].id, new Set())
      neighbours.get(nodes[a].id)!.add(nodes[b].id)
      neighbours.get(nodes[b].id)!.add(nodes[a].id)
    }

    bodies.current = nodes.map((node, i) => {
      const [x, y, z] = seed(i, nodes.length)
      return { x, y, z, vx: 0, vy: 0, vz: 0, node, sx: 0, sy: 0, sz: 0, r: 0 }
    })

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let raf = 0
    let width = 0
    let height = 0

    const resize = () => {
      const rect = box.getBoundingClientRect()
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      width = rect.width
      height = rect.height
      surface.width = Math.round(width * dpr)
      surface.height = Math.round(height * dpr)
      surface.style.width = `${width}px`
      surface.style.height = `${height}px`
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    resize()
    const observer = new ResizeObserver(resize)
    observer.observe(box)

    /** One step of the layout: push everything apart, pull the tied together. */
    const settle = () => {
      const list = bodies.current
      for (let i = 0; i < list.length; i++) {
        const a = list[i]
        for (let j = i + 1; j < list.length; j++) {
          const b = list[j]
          const dx = b.x - a.x
          const dy = b.y - a.y
          const dz = b.z - a.z
          const distance = Math.max(24, Math.hypot(dx, dy, dz))
          const push = 26000 / (distance * distance)
          const ux = dx / distance
          const uy = dy / distance
          const uz = dz / distance
          a.vx -= ux * push
          a.vy -= uy * push
          a.vz -= uz * push
          b.vx += ux * push
          b.vy += uy * push
          b.vz += uz * push
        }
        // Home, so the cloud neither drifts off nor collapses.
        a.vx -= a.x * 0.0016
        a.vy -= a.y * 0.0016
        a.vz -= a.z * 0.0016
      }

      for (const [i, j, shared] of edges) {
        const a = list[i]
        const b = list[j]
        const dx = b.x - a.x
        const dy = b.y - a.y
        const dz = b.z - a.z
        const distance = Math.max(1, Math.hypot(dx, dy, dz))
        // More tags in common is a shorter spring, so the closest kin sit
        // closest together.
        const rest = 150 - Math.min(60, shared * 22)
        const pull = ((distance - rest) / distance) * 0.012
        a.vx += dx * pull
        a.vy += dy * pull
        a.vz += dz * pull
        b.vx -= dx * pull
        b.vy -= dy * pull
        b.vz -= dz * pull
      }

      let reach = 0
      for (const body of list) {
        body.vx *= 0.86
        body.vy *= 0.86
        body.vz *= 0.86
        body.x += body.vx
        body.y += body.vy
        body.z += body.vz
        reach = Math.max(reach, Math.hypot(body.x, body.y, body.z))
      }

      // Rescaled to a fixed reach every step, so the cloud fills the frame
      // whatever it contains. Repulsion against a handful of nodes pushes them
      // to the walls and against fifty packs them into the middle; tuning the
      // constants for one count would only move the problem to the other. The
      // shape the forces produce is the point, not the size they produce it at.
      if (reach > 1) {
        const fit = SPREAD / reach
        for (const body of list) {
          body.x *= fit
          body.y *= fit
          body.z *= fit
        }
      }
    }

    // A hundred steps before the first paint, so it opens as a graph rather than
    // as a ball of string untangling itself.
    for (let i = 0; i < 120; i++) settle()

    const style = getComputedStyle(document.documentElement)
    const token = (name: string, fallback: string) => style.getPropertyValue(name).trim() || fallback

    const draw = () => {
      const list = bodies.current
      const ink = token('--ink', '#241f2e')
      const brand = token('--brand', '#ff5a5f')
      const mint = token('--mint', '#22c7a9')
      const line = token('--line-soft', '#d8d4cd')
      const paper = token('--surface', '#ffffff')

      if (!spin.current.drag && !reduced) spin.current.angle += 0.0022
      const { angle, tilt } = spin.current
      const cos = Math.cos(angle)
      const sin = Math.sin(angle)
      const cosT = Math.cos(tilt)
      const sinT = Math.sin(tilt)
      const cx = width / 2
      const cy = height / 2
      const zoom = Math.min(width, height) / 520

      for (const body of list) {
        // Turn about the upright axis, then tip the whole cloud towards us.
        const x = body.x * cos - body.z * sin
        const z0 = body.x * sin + body.z * cos
        const y = body.y * cosT - z0 * sinT
        const z = body.y * sinT + z0 * cosT
        const depth = FOV / (FOV + z)
        body.sx = cx + x * depth * zoom
        body.sy = cy + y * depth * zoom
        body.sz = z
        body.r = Math.max(3, (body.node.kind === 'project' ? 7 : 5.5) * depth * zoom)
      }

      // Hit-testing here rather than in the pointer handler: the nodes move, so
      // what is under the cursor changes even when the cursor does not.
      let found: string | null = null
      if (pointer.current) {
        let best = Infinity
        for (const body of list) {
          const d = Math.hypot(body.sx - pointer.current.x, body.sy - pointer.current.y)
          if (d < body.r + 10 && d < best) {
            best = d
            found = body.node.id
          }
        }
      }
      if (found !== hoverRef.current) {
        hoverRef.current = found
        setHovered(found)
      }

      const lit = hoverRef.current
      const near = lit ? neighbours.get(lit) : null
      const related = (id: string) => !lit || id === lit || Boolean(near?.has(id))

      ctx.clearRect(0, 0, width, height)

      ctx.lineCap = 'round'
      for (const [i, j, shared] of edges) {
        const a = list[i]
        const b = list[j]
        const on = !lit || ((a.node.id === lit || b.node.id === lit) && true)
        ctx.globalAlpha = on ? 0.5 : 0.06
        ctx.strokeStyle = on && lit ? brand : line
        ctx.lineWidth = Math.min(2.4, 0.6 + shared * 0.5) * (on && lit ? 1.6 : 1)
        ctx.beginPath()
        ctx.moveTo(a.sx, a.sy)
        ctx.lineTo(b.sx, b.sy)
        ctx.stroke()
      }

      // Labels already on the canvas, so a later one can decline to overlap an
      // earlier one. Nearest first for the text pass, so when two collide it is
      // the one further away that gives up its name.
      const taken: { x: number; y: number; w: number; h: number }[] = []
      const room = (x: number, y: number, w: number, h: number) =>
        !taken.some((r) => x < r.x + r.w && x + w > r.x && y < r.y + r.h && y + h > r.y)

      // Far to near, so the near ones cover the far ones.
      for (const body of [...list].sort((a, b) => b.sz - a.sz)) {
        const on = related(body.node.id)
        ctx.globalAlpha = on ? 1 : 0.12
        ctx.fillStyle = body.node.kind === 'project' ? brand : mint
        ctx.beginPath()
        ctx.arc(body.sx, body.sy, body.r, 0, Math.PI * 2)
        ctx.fill()

        if (lit && body.node.id === lit) {
          ctx.globalAlpha = 0.28
          ctx.beginPath()
          ctx.arc(body.sx, body.sy, body.r + 8, 0, Math.PI * 2)
          ctx.fill()
        }

      }

      // A second pass for the text, so a label is never drawn under a node that
      // comes after it, and so the nearest names win the space.
      if (lit) {
        ctx.textBaseline = 'middle'
        for (const body of [...list].sort((a, b) => a.sz - b.sz)) {
          if (!related(body.node.id)) continue
          const isLit = body.node.id === lit
          const size = Math.max(11, 13 * (body.r / 7))
          ctx.font = `${isLit ? 700 : 500} ${size}px ui-sans-serif, system-ui, sans-serif`
          const label =
            body.node.title.length > 38 ? `${body.node.title.slice(0, 36)}…` : body.node.title
          const w = ctx.measureText(label).width
          const x = body.sx + body.r + 7
          const y = body.sy
          // The one being pointed at always gets its name; the rest take a turn
          // only if nothing is already there. All of them at once was a page of
          // overlapping text.
          if (!isLit && !room(x, y - size * 0.7, w, size * 1.4)) continue
          taken.push({ x, y: y - size * 0.7, w, h: size * 1.4 })

          ctx.globalAlpha = 0.82
          ctx.fillStyle = paper
          ctx.fillRect(x - 3, y - size * 0.72, w + 6, size * 1.44)
          ctx.globalAlpha = isLit ? 1 : 0.8
          ctx.fillStyle = ink
          ctx.fillText(label, x, y)
        }
      }
      ctx.globalAlpha = 1

      settle()
      raf = requestAnimationFrame(draw)
    }

    raf = requestAnimationFrame(draw)
    return () => {
      cancelAnimationFrame(raf)
      observer.disconnect()
    }
  }, [nodes])

  const onPointerMove = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = event.currentTarget.getBoundingClientRect()
    pointer.current = { x: event.clientX - rect.left, y: event.clientY - rect.top }
    const held = spin.current.drag
    if (held) {
      spin.current.angle += (event.clientX - held.x) * 0.006
      spin.current.tilt = Math.max(-1.1, Math.min(1.1, spin.current.tilt + (event.clientY - held.y) * 0.005))
      spin.current.drag = { x: event.clientX, y: event.clientY }
    }
  }

  if (nodes.length === 0) return null

  return (
    <div
      ref={frame}
      className={
        full
          ? 'bg-surface fixed inset-0 z-[100] isolate h-dvh w-screen overflow-hidden'
          : 'sticker bg-surface relative isolate aspect-square w-full overflow-hidden'
      }
    >
      <canvas
        ref={canvas}
        className="size-full touch-none"
        style={{ cursor: hovered ? 'pointer' : 'grab' }}
        onPointerMove={onPointerMove}
        onPointerDown={(event) => {
          event.currentTarget.setPointerCapture(event.pointerId)
          spin.current.drag = { x: event.clientX, y: event.clientY }
        }}
        onPointerUp={() => {
          spin.current.drag = null
        }}
        onPointerLeave={() => {
          pointer.current = null
          spin.current.drag = null
        }}
        onClick={() => {
          const id = hoverRef.current
          const target = nodes.find((node) => node.id === id)
          if (target) router.push(target.href)
        }}
      />

      <button
        type="button"
        data-graph-full=""
        onClick={onFullscreen}
        aria-label={full ? t('graphExit') : t('graphExpand')}
        title={full ? t('graphExit') : t('graphExpand')}
        className="sticker-sm bg-surface hover:bg-surface-2 absolute end-3 top-3 grid size-9 place-items-center transition-colors"
      >
        <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          {full ? <path d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5" /> : <path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" />}
        </svg>
      </button>

      <p className="text-muted pointer-events-none absolute inset-x-3 bottom-3 text-center text-xs">
        {t('graphHint')}
      </p>
    </div>
  )
}
