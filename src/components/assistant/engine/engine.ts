import * as THREE from 'three'
import { buildFigure, createUniforms } from './figure'
import { createState, step, type ActName } from './motion'
import { PASS_FRAG, PASS_VERT } from './shaders'

export type Act = ActName | null
export interface EngineOptions {
  mobile: boolean
  reducedMotion: boolean
  /** Pixels kept clear at the right edge (the quick-contact dock). */
  rightReserve: number
}
export interface Engine {
  setAct(act: Act): void
  wave(): void
  warp(): void
  setPointer(clientX: number, clientY: number): void
  clearPointer(): void
  hitTest(clientX: number, clientY: number): boolean
  /** Viewport pixels of the top of his head, for placing the screen he talks through. */
  anchor(): { x: number; y: number }
  setOptions(o: Partial<EngineOptions>): void
  /** The chat is open: full frame rate, no walking, no warps. */
  setBusy(busy: boolean): void
  dispose(): void
}

export function createEngine(canvas: HTMLCanvasElement, landUrl: string, o: EngineOptions): Engine {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true })
  renderer.setPixelRatio(Math.min(2, devicePixelRatio))
  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(28, 1, 0.1, 100)
  camera.position.set(0, 2.35, 13)
  camera.lookAt(0, 1.7, 0)
  const U = createUniforms(new THREE.TextureLoader().load(landUrl))
  const F = buildFigure(scene, U)
  const st = createState()
  let opts = { ...o }

  // The figure is drawn solid into this texture, then laid over the page as a hologram.
  const rt = new THREE.WebGLRenderTarget(1, 1, { samples: 4 })
  const pass = new THREE.Mesh(
    new THREE.PlaneGeometry(2, 2),
    new THREE.ShaderMaterial({
      uniforms: { tDraw: { value: rt.texture }, uTime: U.uTime, uOpacity: U.uOpacity, uRes: U.uRes },
      vertexShader: PASS_VERT,
      fragmentShader: PASS_FRAG,
      transparent: true,
      depthTest: false,
      depthWrite: false,
    }),
  )
  const passScene = new THREE.Scene()
  passScene.add(pass)
  const passCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1)

  // World units across the canvas at the figure's depth; he walks between minX and maxX.
  const world = { halfW: 5, minX: -4, maxX: 4 }
  const unitsPerPx = () => (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * camera.position.z) / Math.max(1, canvas.clientHeight)
  function resize() {
    const w = canvas.clientWidth, h = canvas.clientHeight
    if (!w || !h) return
    renderer.setSize(w, h, false)
    camera.aspect = w / h
    camera.updateProjectionMatrix()
    const dpr = renderer.getPixelRatio()
    rt.setSize(w * dpr, h * dpr)
    U.uRes.value.set(w * dpr, h * dpr)
    const scale = opts.mobile ? 0.72 : 1
    F.figure.scale.setScalar(scale)
    world.halfW = (w / 2) * unitsPerPx()
    world.minX = -world.halfW + 1.8 * scale
    world.maxX = world.halfW - 1.8 * scale - opts.rightReserve * unitsPerPx()
    if (opts.mobile) st.x = world.minX
    st.x = Math.min(Math.max(st.x, world.minX), world.maxX)
  }
  const ro = new ResizeObserver(resize)
  ro.observe(canvas)
  resize()

  const clock = new THREE.Clock()
  let raf = 0, last = 0, visible = !document.hidden
  const onVis = () => {
    visible = !document.hidden
    if (visible) {
      clock.getDelta()
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(loop)
    }
  }
  document.addEventListener('visibilitychange', onVis)

  function draw() {
    renderer.setRenderTarget(rt)
    renderer.setClearColor(0x000000, 0)
    renderer.clear()
    renderer.render(scene, camera)
    renderer.setRenderTarget(null)
    renderer.clear()
    renderer.autoClear = false
    renderer.render(F.fx, camera) // the glow on the floor, and the warp's light
    renderer.render(passScene, passCam) // the drawing, as a hologram
    renderer.render(F.fx, camera)
    renderer.autoClear = true
  }
  function loop(now: number) {
    if (!visible) return // resumed by onVis; a hidden tab costs nothing
    raf = requestAnimationFrame(loop)
    const dt = Math.min(0.05, clock.getDelta())
    U.uTime.value = clock.elapsedTime
    st.mobile = opts.mobile
    st.reduced = opts.reducedMotion
    const { full } = step(F, U, st, dt, clock.elapsedTime, world)
    if (!full && now - last < 30) return // idling: 30 fps is enough
    last = now
    draw()
  }
  raf = requestAnimationFrame(loop)

  const ray = new THREE.Raycaster()
  const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), -0.6)
  const toNdc = (x: number, y: number) => {
    const r = canvas.getBoundingClientRect()
    return new THREE.Vector2(((x - r.left) / r.width) * 2 - 1, -((y - r.top) / r.height) * 2 + 1)
  }
  const project = (v: THREE.Vector3) => {
    const p = v.clone().project(camera), r = canvas.getBoundingClientRect()
    return { x: r.left + ((p.x + 1) / 2) * r.width, y: r.top + ((1 - p.y) / 2) * r.height }
  }

  return {
    setAct: (act) => {
      st.act = act
      st.actUntil = 0
    },
    wave: () => {
      if (st.mode !== 'out' && st.mode !== 'in') {
        st.mode = 'wave'
        st.modeT = 0
      }
    },
    warp: () => {
      st.nextWarp = 0
    },
    setPointer: (x, y) => {
      ray.setFromCamera(toNdc(x, y), camera)
      st.cursor = ray.ray.intersectPlane(plane, new THREE.Vector3())
      st.cursorAt = clock.elapsedTime
    },
    clearPointer: () => {
      st.cursor = null
    },
    hitTest: (x, y) => {
      // The globe's projected circle, plus a box round the legs and shoes.
      const s = F.figure.scale.x, lift = F.figure.position.y
      const c = project(new THREE.Vector3(st.x, 2.0 * s + lift, 0))
      const edge = project(new THREE.Vector3(st.x + 1.15 * s, 2.0 * s + lift, 0))
      const rad = Math.abs(edge.x - c.x)
      if (Math.hypot(x - c.x, y - c.y) <= rad) return true
      const feet = project(new THREE.Vector3(st.x, lift, 0))
      return Math.abs(x - c.x) <= rad * 0.6 && y >= c.y && y <= feet.y + 8
    },
    anchor: () => project(new THREE.Vector3(st.x, 3.2 * F.figure.scale.x + F.figure.position.y, 0)),
    setOptions: (p) => {
      opts = { ...opts, ...p }
      resize()
    },
    setBusy: (busy) => {
      st.busy = busy
    },
    dispose: () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      document.removeEventListener('visibilitychange', onVis)
      renderer.dispose()
      rt.dispose()
    },
  }
}
