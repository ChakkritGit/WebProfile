'use client'

import { useCallback, useEffect, useId, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { motion, useReducedMotion } from 'motion/react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useScrollLock } from '@/lib/hooks'

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
  const reduce = useReducedMotion()
  // Shared by the card and the expanded surface: the same box in two places, so
  // Motion animates one into the other instead of cutting between them.
  const morphId = useId()

  // Everything the animation touches lives in refs: it runs sixty times a
  // second and must not re-render React to do it.
  const bodies = useRef<Body[]>([])
  const hoverRef = useRef<string | null>(null)
  const pointer = useRef<{ x: number; y: number } | null>(null)
  const spin = useRef({ angle: 0, tilt: -0.22, drag: null as null | { x: number; y: number } })

  /**
   * How far the pointer travelled between press and release.
   *
   * Turning the graph and opening a piece are the same gesture until this is
   * measured: press on a node, move a little, let go, and without it the click
   * lands. Measured before it existed — a 4px drag and a 10px drag both
   * navigated, and only a 25px one got away, because escaping meant leaving the
   * node's hit radius rather than meaning anything. Six pixels is the usual
   * tolerance for a click that was not quite still.
   */
  const travel = useRef(0)

  /**
   * Touch has no hover, so a tap has to do both jobs in turn.
   *
   * On a phone the first tap on a node lights it and its neighbours — the thing
   * the graph is for — and only a second tap on the same node opens it. With one
   * tap doing both, the connections could never be seen at all: the page had
   * already changed.
   */
  const armed = useRef<string | null>(null)
  const touching = useRef(false)

  /**
   * What is under a point, answered now rather than next frame.
   *
   * The draw loop used to be the only thing that hit-tested, which is fine for a
   * mouse — it has been moving for frames before you click — and useless for a
   * tap, which can begin and end inside a single frame. Measured: a tap on a
   * node did nothing at all, neither lighting it nor opening it.
   */
  const hitAt = useCallback((x: number, y: number) => {
    let best = Infinity
    let found: string | null = null
    for (const body of bodies.current) {
      const d = Math.hypot(body.sx - x, body.sy - y)
      // A finger is blunter than a cursor, so it gets a wider target.
      if (d < body.r + 16 && d < best) {
        best = d
        found = body.node.id
      }
    }
    return found
  }, [])

  /**
   * Bigger, without leaving the page.
   *
   * The Fullscreen API was asked for first and has been dropped: on a desktop it
   * takes over the whole screen and hides the browser with it, which is a larger
   * thing to happen than pressing an expand button on a widget suggests, and on
   * iOS it is not available for an ordinary element at all — so the two devices
   * did different things from the same button. Filling the window is what the
   * button meant, and it is the same everywhere.
   */
  const onFullscreen = useCallback(() => setFull((open) => !open), [])

  // Expanded it covers the screen, and the page underneath was still taking the
  // wheel.
  useScrollLock(full)

  // Escape closes it, since there is no browser control to leave by.
  useEffect(() => {
    if (!full) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setFull(false)
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

    // The page's own stack, not a guess at one. A canvas resolves `font` against
    // nothing but the string it is given, so a hard-coded `system-ui` had no
    // Thai face behind it and the labels came out in whatever the system chose —
    // which is not the face the rest of the page is set in.
    const family = getComputedStyle(document.body).fontFamily || 'system-ui, sans-serif'

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

      // A finger leaves as soon as it lifts, so on touch the selection is what
      // keeps a node lit; a mouse just hovers. Without this the highlight
      // appeared for the length of the tap and went out again.
      const lit = hoverRef.current ?? armed.current
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
          ctx.font = `${isLit ? 700 : 500} ${size}px ${family}`
          const label =
            body.node.title.length > 38 ? `${body.node.title.slice(0, 36)}…` : body.node.title
          const w = ctx.measureText(label).width
          // Right of the node normally, left when that would run off the edge —
          // a label half off the screen names nothing.
          const flip = body.sx + body.r + 7 + w > width - 6
          const x = flip ? Math.max(6, body.sx - body.r - 7 - w) : body.sx + body.r + 7
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
    // `full` is a dependency because expanding moves this through a portal: React
    // takes the old canvas out of the document and puts a new one in, so the refs
    // this effect captured point at a node nobody can see any more. Without it the
    // loop went on drawing into the detached canvas — the graph came up blank and
    // nothing could be tapped, since hit-testing reads the positions that loop
    // writes.
  }, [nodes, full])

  const onPointerMove = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = event.currentTarget.getBoundingClientRect()
    pointer.current = { x: event.clientX - rect.left, y: event.clientY - rect.top }
    const held = spin.current.drag
    if (held) {
      travel.current += Math.hypot(event.clientX - held.x, event.clientY - held.y)
      spin.current.angle += (event.clientX - held.x) * 0.006
      spin.current.tilt = Math.max(-1.1, Math.min(1.1, spin.current.tilt + (event.clientY - held.y) * 0.005))
      spin.current.drag = { x: event.clientX, y: event.clientY }
    }
  }

  if (nodes.length === 0) return null

  const view = (
    <motion.div
      ref={frame}
      layoutId={morphId}
      transition={reduce ? { duration: 0 } : { type: 'spring', stiffness: 210, damping: 26 }}
      className={
        full
          ? 'bg-surface fixed inset-0 z-[100] isolate h-dvh w-screen overflow-hidden'
          // No fill in the card: the hero's star grid runs through the graph, which
          // is the sky the thing is drawn in. Expanded it keeps a solid surface —
          // full-screen over a page that is still there behind it needs one.
          : 'sticker relative isolate aspect-square w-full overflow-hidden'
      }
    >
      <canvas
        ref={canvas}
        // Out of flow on purpose. `resize()` writes the box's pixel size onto
        // the canvas, and in flow that size is the container's min-content: after
        // one trip through full screen the canvas came back carrying 1280px, the
        // hero's grid gave its column the 26rem cap to fit it, and the card sat
        // 46px wider than it started for the rest of the session. Measured on the
        // live site before this line existed: 370px before, 416px after.
        className="absolute inset-0 size-full touch-none"
        style={{ cursor: hovered ? 'pointer' : 'grab' }}
        onPointerMove={onPointerMove}
        onPointerDown={(event) => {
          event.currentTarget.setPointerCapture(event.pointerId)
          spin.current.drag = { x: event.clientX, y: event.clientY }
          travel.current = 0
          touching.current = event.pointerType === 'touch'
          const rect = event.currentTarget.getBoundingClientRect()
          const at = { x: event.clientX - rect.left, y: event.clientY - rect.top }
          pointer.current = at
          // Answered here, because a tap can be over before the next frame runs.
          const id = hitAt(at.x, at.y)
          hoverRef.current = id
          setHovered(id ?? armed.current)
        }}
        onPointerUp={() => {
          spin.current.drag = null
        }}
        onPointerLeave={() => {
          pointer.current = null
          spin.current.drag = null
        }}
        onClick={() => {
          if (travel.current > 6) return
          const id = hoverRef.current
          if (!id) {
            // A tap on nothing puts the graph back to all of it.
            armed.current = null
            setHovered(null)
            return
          }
          if (touching.current && armed.current !== id) {
            armed.current = id
            setHovered(id)
            return
          }
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
    </motion.div>
  )

  /**
   * Expanded, it hangs off the body.
   *
   * `position: fixed` and a z-index are only as tall as the stacking context
   * they are in, and this one lives inside the hero — which framer-motion gives
   * a transform, and a transform makes a context. Measured: expanded on a phone,
   * the close button sat at (342, 12) underneath the site header, which is
   * `z-50` but at the top level. A portal takes it out of the box it was in.
   *
   * The canvas re-mounts on the way through and the layout settles again, which
   * costs a hundred and twenty steps before the first frame and looks like the
   * graph arriving rather than moving.
   */
  if (!full) return view

  return (
    <>
      {/* The card's own space, held while its contents are away: without it the
          hero column collapses, the page behind reflows, and the box the graph
          has to come home to is somewhere else by the time it is closed. */}
      <div aria-hidden className="aspect-square w-full" />
      {createPortal(view, document.body)}
    </>
  )
}
