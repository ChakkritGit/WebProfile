import * as THREE from 'three'
import { HOLE_FRAG, HOLE_VERT, LINE_FRAG, LINE_VERT, TOON, VERT } from './shaders'

/* Mr. Worldwide's body: an amber globe with the world's land on it, a face that
   slides round it, rubber-hose limbs, five-finger gloves and white cartoon
   sneakers. Ported from docs/superpowers/prototypes/mr-worldwide/index.html. */

const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z)

export interface Uniforms {
  [name: string]: THREE.IUniform
  uTime: THREE.IUniform<number>
  uColor: THREE.IUniform<THREE.Color>
  uOpacity: THREE.IUniform<number>
  uBoost: THREE.IUniform<number>
  uWarpC: THREE.IUniform<THREE.Vector3>
  uTwist: THREE.IUniform<number>
  uPinch: THREE.IUniform<number>
  uLight: THREE.IUniform<number>
  uLand: THREE.IUniform<THREE.Texture>
  uRes: THREE.IUniform<THREE.Vector2>
  uLine: THREE.IUniform<number>
  uGlitch: THREE.IUniform<number>
}

export function createUniforms(land: THREE.Texture): Uniforms {
  return {
    uTime: { value: 0 },
    uColor: { value: new THREE.Color('#ff8a3d') },
    uOpacity: { value: 0.78 },
    uBoost: { value: 1 },
    uWarpC: { value: V(0, 1.7, 0) },
    uTwist: { value: 0 },
    uPinch: { value: 0 },
    uLight: { value: 0 },
    // Natural Earth 1:50m land (public domain), equirectangular — the globe's own map.
    uLand: { value: land },
    uRes: { value: new THREE.Vector2(1, 1) },
    uLine: { value: 2.6 },
    uGlitch: { value: 0 },
  }
}

export interface Eye {
  gaze: THREE.Group
  lid: THREE.Mesh
  glint: THREE.Mesh
}

export interface Figure {
  figure: THREE.Group
  turn: THREE.Group
  bodyG: THREE.Group
  torso: THREE.Group
  globe: THREE.Mesh
  face: THREE.Group
  eyes: Eye[]
  brows: { mesh: THREE.Mesh; s: number }[]
  mouth: THREE.Mesh
  mouthHole: THREE.Mesh
  hands: THREE.Group[]
  shoes: THREE.Group[]
  limbs: THREE.Mesh[]
  /** The rolodex of files he searches (hidden until then): the drum turns, the cards flutter. */
  files: THREE.Group
  drum: THREE.Group
  cards: THREE.Group[]
  /** A search page he opens in the air, types into, reads and closes (hidden until then). */
  browser: THREE.Group
  chars: THREE.Mesh[]
  caret: THREE.Mesh
  rows: THREE.Group[]
  /** A projected keyboard under his hands while he types the search (hidden until then). */
  keyboard: THREE.Group
  keys: THREE.Mesh[]
  /** A black hole to hold in his palm (a billboard; hidden until then). */
  hole: THREE.Mesh<THREE.PlaneGeometry, THREE.ShaderMaterial>
  /** The glitch's error dump: code and binary behind him and in front (hidden until then). */
  code: { group: THREE.Group; mats: THREE.MeshBasicMaterial[]; draw(time: number): void }
  fx: THREE.Scene
  puddle: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial>
  core: THREE.Sprite
  streak: THREE.Sprite
  ring: THREE.Sprite
  mouthCurve(w: number, d: number): THREE.CatmullRomCurve3
  onSphere(x: number, y: number, lift?: number): THREE.Vector3
  hose(mesh: THREE.Mesh, pts: THREE.Vector3[], r: number): void
  legHose(mesh: THREE.Mesh, curve: THREE.Curve<THREE.Vector3>): void
}

export function buildFigure(scene: THREE.Scene, U: Uniforms): Figure {
  const toon = ({ globe = false, tint = 1, white = 0, fixed = null as string | null } = {}) =>
    new THREE.ShaderMaterial({
      uniforms: {
        ...U,
        uGlobe: { value: globe ? 1 : 0 },
        uTint: { value: tint },
        uWhite: { value: white },
        uUseFixed: { value: fixed ? 1 : 0 },
        uFixed: { value: new THREE.Color(fixed ?? '#000') },
      },
      vertexShader: VERT,
      fragmentShader: TOON,
    })
  const LINE = new THREE.ShaderMaterial({ uniforms: U, vertexShader: LINE_VERT, fragmentShader: LINE_FRAG, side: THREE.BackSide })
  // Fingers are a few pixels across: the full line swamped them and shimmered.
  const FINE = new THREE.ShaderMaterial({ uniforms: { ...U, uLine: { value: 1.4 } }, vertexShader: LINE_VERT, fragmentShader: LINE_FRAG, side: THREE.BackSide })
  const flat = (hex: string) => toon({ fixed: hex })
  const INK = flat('#2a150a'), WHITE = toon({ white: 1 })

  const figure = new THREE.Group()
  scene.add(figure) // x on the floor
  const turn = new THREE.Group()
  figure.add(turn) // facing (springy)
  const bodyG = new THREE.Group()
  turn.add(bodyG) // sway and bob
  const torso = new THREE.Group()
  torso.position.y = 2.0
  bodyG.add(torso) // lean, roll, twist
  const globe = new THREE.Mesh(new THREE.SphereGeometry(1, 64, 48), toon({ globe: true }))
  torso.add(globe)
  globe.rotation.y = 2.97 // start with Asia, Thailand in it, to the front

  // Face: on the front of the sphere, not turning with the globe.
  const face = new THREE.Group()
  torso.add(face)
  const onSphere = (x: number, y: number, lift = 0) => {
    const z = Math.sqrt(Math.max(0, 1 - x * x - y * y))
    return V(x, y, z).multiplyScalar(1 + lift)
  }
  const eyes: Eye[] = [], brows: { mesh: THREE.Mesh; s: number }[] = []
  const LID = toon({ tint: 1.0 })
  for (const sx of [-1, 1]) {
    const socket = new THREE.Group()
    socket.position.copy(onSphere(0.25 * sx, 0.1, -0.06))
    socket.lookAt(socket.position.clone().multiplyScalar(3))
    face.add(socket)
    const ball = new THREE.Mesh(new THREE.SphereGeometry(0.2, 32, 24), WHITE)
    ball.scale.set(0.88, 1.18, 0.8)
    socket.add(ball)
    // The gaze turns the pupil about the eyeball's centre, so it rolls over the curve.
    const gaze = new THREE.Group()
    socket.add(gaze)
    const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.1, 24, 16), INK)
    pupil.scale.set(0.78, 1.12, 0.28)
    pupil.position.z = 0.152
    gaze.add(pupil)
    // The highlight belongs to the light, not the eye: it stays put while the eye moves.
    const glint = new THREE.Mesh(new THREE.SphereGeometry(0.028, 10, 8), WHITE)
    glint.position.set(0.045, 0.075, 0.172)
    glint.userData.noLine = true
    socket.add(glint)
    // Upper lid: a shell over the top of the eyeball that swings down to blink.
    const lid = new THREE.Mesh(new THREE.SphereGeometry(0.212, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2), LID)
    lid.scale.set(0.9, 1.2, 0.84)
    lid.userData.noLine = true
    socket.add(lid)
    eyes.push({ gaze, lid, glint })
    // A thick, short brow: he is a he.
    const brow = new THREE.Mesh(new THREE.CapsuleGeometry(0.035, 0.2, 4, 10), INK)
    brow.rotation.z = Math.PI / 2 - sx * 0.12
    face.add(brow)
    brows.push({ mesh: brow, s: sx })
  }
  const mouthCurve = (w: number, d: number) =>
    new THREE.CatmullRomCurve3([onSphere(-w, -0.3, 0.02), onSphere(0, -0.3 - d, 0.02), onSphere(w, -0.3, 0.02)])
  const mouth = new THREE.Mesh(new THREE.TubeGeometry(mouthCurve(0.2, 0.1), 16, 0.024, 6), INK)
  face.add(mouth)
  // Open, for talking: a dark oval that grows under the smile with each syllable.
  const mouthHole = new THREE.Mesh(new THREE.SphereGeometry(0.1, 20, 12), flat('#3a0f06'))
  mouthHole.position.copy(onSphere(0, -0.37, -0.005))
  mouthHole.lookAt(mouthHole.position.clone().multiplyScalar(2))
  face.add(mouthHole)

  // Glove: palm, four fingers and a thumb, a rolled cuff. Built pointing down (-y).
  function glove(side: number) {
    const g = new THREE.Group(), fingers: THREE.Group[] = []
    const cuff = new THREE.Mesh(new THREE.TorusGeometry(0.11, 0.045, 10, 20), WHITE)
    cuff.rotation.x = Math.PI / 2
    cuff.position.y = 0.02
    g.add(cuff)
    const palm = new THREE.Mesh(new THREE.SphereGeometry(0.14, 18, 14), WHITE)
    palm.scale.set(1.05, 1, 0.62)
    palm.position.y = -0.13
    g.add(palm)
    for (let i = 0; i < 4; i++) {
      const knuckle = new THREE.Group()
      knuckle.position.set(-0.09 + i * 0.06, -0.22, 0)
      g.add(knuckle)
      const f = new THREE.Mesh(new THREE.CapsuleGeometry(0.036, 0.1 + (i === 1 || i === 2 ? 0.03 : 0), 4, 10), WHITE)
      f.position.y = -0.07
      knuckle.add(f)
      knuckle.rotation.z = (i - 1.5) * 0.12
      fingers.push(knuckle)
    }
    // The thumb on the side toward the body — mirrored for the left hand — and a
    // touch toward the palm (-z), which is the side the fingers bend to.
    const thumb = new THREE.Group()
    thumb.position.set(-0.12 * side, -0.1, -0.03)
    g.add(thumb)
    const tm = new THREE.Mesh(new THREE.CapsuleGeometry(0.038, 0.08, 4, 10), WHITE)
    tm.position.y = -0.05
    thumb.add(tm)
    g.userData = { fingers, thumb, side }
    return g
  }

  // A cartoon sneaker, all white and closed: one turned shape, narrow at the
  // heel and swelling to a round toe, with the ankle opening near the heel that
  // the leg goes into. Heel at the origin, toe along +z.
  const SHOE_GEO = (() => {
    const prof = [[0, 0], [0.085, 0.01], [0.105, 0.07], [0.1, 0.17], [0.125, 0.27], [0.145, 0.36], [0.132, 0.44], [0.085, 0.5], [0, 0.52]]
    const g = new THREE.LatheGeometry(prof.map(([r, y]) => new THREE.Vector2(r, y)), 28)
    g.rotateX(Math.PI / 2) // the lathe's axis, y, becomes the foot's length, z
    g.scale(1, 0.72, 1) // flatter than it is wide
    g.translate(0, 0.104, -0.02) // resting on the floor
    g.computeVertexNormals()
    return g
  })()
  function sneaker() {
    const g = new THREE.Group()
    g.add(new THREE.Mesh(SHOE_GEO, WHITE))
    const opening = new THREE.Mesh(new THREE.CircleGeometry(0.06, 20), INK) // where the leg goes in
    opening.rotation.x = -Math.PI / 2 + 0.25
    opening.position.set(0, 0.2, 0.1)
    opening.scale.set(1, 1.35, 1)
    opening.userData.noLine = true
    g.add(opening)
    const cuff = new THREE.Mesh(new THREE.TorusGeometry(0.068, 0.018, 8, 20), WHITE)
    cuff.rotation.x = -Math.PI / 2 + 0.25
    cuff.position.set(0, 0.205, 0.1)
    cuff.scale.set(1, 1.35, 1)
    g.add(cuff)
    for (let i = 0; i < 2; i++) {
      const lace = new THREE.Mesh(new THREE.CapsuleGeometry(0.008, 0.07, 4, 6), INK)
      lace.rotation.z = Math.PI / 2
      lace.position.set(0, 0.19 - i * 0.012, 0.2 + i * 0.05)
      lace.userData.noLine = true
      g.add(lace)
    }
    return g
  }
  const hands = [glove(-1), glove(1)], shoes = [sneaker(), sneaker()]
  hands.forEach((h) => bodyG.add(h))
  shoes.forEach((s) => bodyG.add(s))
  const armMat = toon({ tint: 1.1 })
  const limbs = [armMat, armMat, INK, INK].map((m) => {
    const mesh = new THREE.Mesh(new THREE.BufferGeometry(), m)
    bodyG.add(mesh)
    return mesh
  })
  // The legs are ink already — a single clean line, like the reference; an outline
  // round them only fattened them.
  limbs[2].userData.noLine = limbs[3].userData.noLine = true
  const legHose = (mesh: THREE.Mesh, curve: THREE.Curve<THREE.Vector3>) => {
    mesh.geometry.dispose()
    mesh.geometry = new THREE.TubeGeometry(curve, 24, 0.038, 8)
  }
  const hose = (mesh: THREE.Mesh, pts: THREE.Vector3[], r: number) => {
    mesh.geometry.dispose()
    mesh.geometry = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 20, r, 8)
    if (mesh.userData.line) (mesh.userData.line as THREE.Mesh).geometry = mesh.geometry
  }
  const ink = (root: THREE.Object3D, mat: THREE.Material = LINE) => {
    root.traverse((o) => {
      const m = o as THREE.Mesh
      if (!m.isMesh || m.userData.line || m.userData.noLine || m.material === LINE || m.material === FINE) return
      const line = new THREE.Mesh(m.geometry, mat)
      line.userData.noLine = true
      m.userData.line = line
      m.add(line)
    })
  }

  // A glow he casts on the floor — the grounding a hologram gets instead of a shadow.
  const tex = (size: number, draw: (g: CanvasRenderingContext2D) => void) => {
    const c = document.createElement('canvas')
    c.width = c.height = size
    draw(c.getContext('2d')!)
    return new THREE.CanvasTexture(c)
  }
  const puddleTex = tex(64, (g) => {
    const r = g.createRadialGradient(32, 32, 0, 32, 32, 32)
    r.addColorStop(0, 'rgba(255,255,255,.9)')
    r.addColorStop(1, 'rgba(255,255,255,0)')
    g.fillStyle = r
    g.fillRect(0, 0, 64, 64)
  })
  const puddle = new THREE.Mesh(
    new THREE.PlaneGeometry(2.6, 0.9),
    new THREE.MeshBasicMaterial({ map: puddleTex, color: U.uColor.value, transparent: true, opacity: 0.35, depthWrite: false }),
  )
  puddle.rotation.x = -Math.PI / 2
  puddle.position.y = 0.005
  const fx = new THREE.Scene()
  fx.add(puddle)
  // The hologram switching off: a white-hot core, a thin horizontal flare, a ring.
  const coreTex = tex(128, (g) => {
    const r = g.createRadialGradient(64, 64, 0, 64, 64, 64)
    r.addColorStop(0, 'rgba(255,255,255,1)')
    r.addColorStop(0.12, 'rgba(255,248,230,1)')
    r.addColorStop(0.3, 'rgba(255,190,110,.55)')
    r.addColorStop(1, 'rgba(255,140,40,0)')
    g.fillStyle = r
    g.fillRect(0, 0, 128, 128)
  })
  const streakTex = tex(128, (g) => {
    const r = g.createLinearGradient(0, 0, 128, 0)
    r.addColorStop(0, 'rgba(255,170,80,0)')
    r.addColorStop(0.5, 'rgba(255,255,255,1)')
    r.addColorStop(1, 'rgba(255,170,80,0)')
    g.fillStyle = r
    g.fillRect(0, 60, 128, 8)
  })
  const ringTex = tex(128, (g) => {
    g.strokeStyle = 'rgba(255,220,170,1)'
    g.lineWidth = 3
    g.shadowColor = 'rgba(255,160,60,1)'
    g.shadowBlur = 10
    g.beginPath()
    g.arc(64, 64, 52, 0, Math.PI * 2)
    g.stroke()
  })
  const spr = (map: THREE.Texture) => {
    const m = new THREE.Sprite(
      new THREE.SpriteMaterial({ map, transparent: true, depthWrite: false, opacity: 0, blending: THREE.AdditiveBlending }),
    )
    fx.add(m)
    return m
  }
  // The site's files, projected beside him when he searches: folders standing
  // round a drum, like a rolodex, that he flicks round with one finger.
  const files = new THREE.Group()
  files.visible = false
  bodyG.add(files)
  const drum = new THREE.Group()
  files.add(drum)
  const cardMats = [toon({ tint: 1.3 }), toon({ tint: 1.05 })]
  const cardGeo = new THREE.BoxGeometry(0.5, 0.42, 0.02)
  const tabGeo = new THREE.BoxGeometry(0.15, 0.07, 0.02)
  const labelGeo = new THREE.BoxGeometry(0.24, 0.02, 0.024)
  const cards: THREE.Group[] = []
  for (let i = 0; i < 18; i++) {
    const holder = new THREE.Group()
    holder.rotation.y = (i / 18) * Math.PI * 2
    drum.add(holder)
    // A card stands in the plane of the axle and the radius: its width runs outward.
    const card = new THREE.Group()
    card.position.x = 0.46
    holder.add(card)
    card.add(new THREE.Mesh(cardGeo, cardMats[i % 2]))
    const tab = new THREE.Mesh(tabGeo, cardMats[i % 2])
    tab.position.set(-0.12 + (i % 3) * 0.12, 0.24, 0)
    card.add(tab)
    for (const y of [0.08, 0.02]) {
      const label = new THREE.Mesh(labelGeo, INK)
      label.position.set(0.03, y, 0)
      label.scale.x = y > 0.05 ? 1 : 0.7
      label.userData.noLine = true
      card.add(label)
    }
    cards.push(card)
  }
  for (const y of [-0.24, 0.24]) {
    const rim = new THREE.Mesh(new THREE.TorusGeometry(0.46, 0.018, 8, 48), cardMats[0])
    rim.rotation.x = Math.PI / 2
    rim.position.y = y
    drum.add(rim)
  }
  const axle = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.62, 10), cardMats[1])
  drum.add(axle)

  // A search page, projected: a window with a title bar, a little globe for a
  // logo, a search box he types into, and results that arrive row by row.
  const browser = new THREE.Group()
  browser.visible = false
  bodyG.add(browser)
  const dim = toon({ tint: 0.85 }), bright = toon({ tint: 1.35 })
  const box = (w: number, h: number, d: number, m: THREE.Material, x: number, y: number, z = 0, parent: THREE.Object3D = browser) => {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m)
    mesh.position.set(x, y, z)
    parent.add(mesh)
    return mesh
  }
  box(1.25, 0.95, 0.02, dim, 0, 0)
  box(1.25, 0.12, 0.03, bright, 0, 0.415)
  for (let i = 0; i < 3; i++) {
    const dot = new THREE.Mesh(new THREE.SphereGeometry(0.02, 10, 8), INK)
    dot.position.set(-0.55 + i * 0.06, 0.415, 0.02)
    dot.userData.noLine = true
    browser.add(dot)
  }
  const logo = new THREE.Mesh(new THREE.SphereGeometry(0.075, 20, 14), bright)
  logo.position.set(0, 0.23, 0.02)
  browser.add(logo)
  const orbit = new THREE.Mesh(new THREE.TorusGeometry(0.11, 0.008, 6, 32), bright)
  orbit.position.copy(logo.position)
  orbit.rotation.set(1.2, 0, 0.35)
  browser.add(orbit)
  box(0.95, 0.11, 0.03, WHITE, 0, 0.05)
  const lens = new THREE.Mesh(new THREE.TorusGeometry(0.022, 0.006, 6, 16), INK)
  lens.position.set(-0.41, 0.057, 0.02)
  lens.userData.noLine = true
  browser.add(lens)
  const chars: THREE.Mesh[] = []
  for (let i = 0; i < 9; i++) {
    const c = box(0.036, 0.048, 0.036, INK, -0.33 + i * 0.052, 0.05, 0.005)
    c.userData.noLine = true
    chars.push(c)
  }
  const caret = box(0.008, 0.07, 0.038, INK, -0.35, 0.05, 0.005)
  caret.userData.noLine = true
  const rows: THREE.Group[] = []
  for (let i = 0; i < 3; i++) {
    // pivoted at the left edge, so a row can draw in from the left
    const row = new THREE.Group()
    row.position.set(-0.45, -0.12 - i * 0.14, 0.012)
    browser.add(row)
    box(0.5, 0.036, 0.03, bright, 0.25, 0.03, 0, row)
    const l1 = box(0.86, 0.016, 0.03, INK, 0.43, -0.015, 0, row)
    const l2 = box(0.6, 0.016, 0.03, INK, 0.3, -0.045, 0, row)
    l1.userData.noLine = l2.userData.noLine = true
    rows.push(row)
  }

  // The glitch's error dump: a wall of binary and hex behind him, a few lines
  // of a stack trace in front, redrawn as it scrolls.
  const LINES = [
    'TypeError: cannot read properties of undefined (reading \'globe\')',
    '    at render (hologram.ts:214:17)',
    '    at warp (motion.ts:88:9)',
    '    at step (engine.ts:116:12)',
    'ERR_SIGNAL_LOST  0x7F3A  retrying...',
    'Uncaught RangeError: Maximum call stack size exceeded',
    'segfault at 0000DEAD ip 0000BEEF',
    'WARN: face.rotation.y = NaN',
    '> reboot --hologram --force',
    'FATAL: world.map is not a function',
  ]
  const codeCanvas = (w: number, h: number) => {
    const c = document.createElement('canvas')
    c.width = w
    c.height = h
    const tex = new THREE.CanvasTexture(c)
    // drawn straight into his (linear, unconverted) render target: no colour-space trip, or it comes out dim
    tex.colorSpace = THREE.NoColorSpace
    const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide })
    return { c, g: c.getContext('2d')!, tex, mat }
  }
  const back = codeCanvas(512, 384), front = codeCanvas(512, 256)
  const code = new THREE.Group()
  code.visible = false
  figure.add(code)
  const backMesh = new THREE.Mesh(new THREE.PlaneGeometry(4.4, 3.3), back.mat)
  backMesh.position.set(0, 2.1, -1.2)
  const frontMesh = new THREE.Mesh(new THREE.PlaneGeometry(3.4, 1.7), front.mat)
  frontMesh.position.set(0.3, 1.45, 1.3)
  code.add(backMesh, frontMesh)
  const rnd = (n: number) => { const x = Math.sin(n * 91.7) * 43758.5453; return x - Math.floor(x) }
  // His own source (the gait, from motion.ts), scrolling up the wall behind him
  // with line numbers and a little colour; the trace and the bits in front.
  const SOURCE: string[] = [
    "// --- legs: heel strike, weight onto a flat foot, heel up, to",
    "for (const side of [-1, 1]) {",
    "  const u = side < 0 ? uL : uR",
    "  let fz: number, lift = 0, pitch: number",
    "  if (u < STANCE) {",
    "    const k = u / STANCE",
    "    fz = A * (1 - 2 * k)",
    "    pitch = -0.32 * (1 - ease(c01(k / 0.2))) + 0.5 * ease(c01(",
    "  } else {",
    "    const k = (u - STANCE) / (1 - STANCE)",
    "    fz = A * (-1 + 2 * ease(k))",
    "    lift = (0.1 + 0.28 * A) * Math.pow(Math.sin(Math.PI * k), ",
    "    pitch = THREE.MathUtils.lerp(0.5, -0.32, ease(k)) // toes ",
    "  }",
    "  pitch *= Math.min(1, A / 0.25)",
    "  const fi = side < 0 ? 0 : 1",
    "  const hip = V(0.27 * side, 1.18, 0)",
    "  const foot = V(0.33 * side + stepX[fi] * aw, 0.1 + lift + fo",
    "  pitch += toes",
    "  // The shoe first: it rocks on the heel as it lands (toe up)",
    "  // as it pushes off (heel up), so whichever end is on the fl",
    "  const shoe = shoes[side < 0 ? 0 : 1]",
    "  if (act === 'think' && side > 0) pitch -= 0.3 * aw * Math.ma",
    "  const rock = new THREE.Quaternion().setFromAxisAngle(V(1, 0,",
    "  const pivot = pitch < 0 ? V(0, 0, 0) : V(0, 0, 0.48)",
    "  shoe.quaternion.copy(rock)",
    "  shoe.position.copy(foot).add(V(0, -0.06, -0.12)).add(pivot.c",
    "  // Then the leg: a rubber hose, one smooth arc from hip to t",
    "  // wherever the shoe now is, bowed forward by as much as the",
    "  // from the leg's full length — straight when stretched, ben",
    "  const ankle = V(0, 0.16, 0.1).applyQuaternion(rock).add(shoe",
    "  const span = ankle.clone().sub(hip), d = span.length(), LEG ",
    "  const sag = Math.sqrt(Math.max(0, LEG * LEG - d * d)) * 0.55",
    "  const along = span.clone().normalize()",
    "  const fwd = V(0, 0, 1).sub(along.clone().multiplyScalar(alon",
    "  const ctrl = hip.clone().lerp(ankle, 0.5).add(fwd.multiplySc",
    "  F.legHose(limbs[side < 0 ? 2 : 3], new THREE.QuadraticBezier",
    "}",
    "",
    "// --- the files: a rolodex on whichever side has room, flicke",
    "const searching = act === 'search' ? aw : 0",
    "const props = act === 'search' || act === 'browse'",
    "if (props && aw > 0.001 && st.actT < 0.05) st.filesSide = st.x",
    "const fs = st.filesSide",
    "const pop = act === 'search' && st.act ? backOut(c01(st.actT /",
    "files.visible = pop > 0.01",
    "const FS = 1.25, FX = 2.25 * fs, FY = 1.55, FZ = 0.3",
    "if (files.visible) {"
  ]
  const KW = /\b(const|let|if|else|for|of|return|new|Math|THREE)\b/g
  const drawCode = (time: number) => {
    const b = back.g, LH = 18, top = time * 60
    b.clearRect(0, 0, 512, 384)
    b.font = '600 14px ui-monospace, Menlo, monospace'
    const first = Math.floor(top / LH)
    for (let row = 0; row < 24; row++) {
      const n = first + row, text = SOURCE[n % SOURCE.length], y = 16 + row * LH - (top % LH)
      b.fillStyle = 'rgba(255,178,122,0.45)'
      b.fillText(String(392 + (n % SOURCE.length)).padStart(3, ' '), 6, y)
      const comment = text.trimStart().startsWith('//')
      let x = 44
      for (const part of text.split(KW)) {
        b.fillStyle = comment ? 'rgba(255,196,150,0.55)' : /^(const|let|if|else|for|of|return|new|Math|THREE)$/.test(part) ? 'rgba(255,120,80,1)' : /^[\d.]+$/.test(part.trim()) ? 'rgba(255,236,190,1)' : 'rgba(255,214,176,0.92)'
        b.fillText(part, x, y)
        x += b.measureText(part).width
      }
    }
    // a red band: the line it broke on
    const hot = 7 + Math.floor(time * 3) % 10
    b.fillStyle = 'rgba(255,60,40,0.22)'
    b.fillRect(0, 3 + hot * LH - (top % LH), 512, LH)
    const f = front.g
    f.clearRect(0, 0, 512, 256)
    f.font = '800 17px ui-monospace, Menlo, monospace'
    const tick = Math.floor(time * 6)
    for (let row = 0; row < 4; row++) {
      const text = LINES[Math.floor(rnd(row * 3 + tick * 0.5) * LINES.length)]
      f.fillStyle = row === 0 || rnd(row + tick * 2) > 0.7 ? 'rgba(255,96,72,1)' : 'rgba(255,232,205,1)'
      f.fillText(text, 6 + (rnd(row + tick) - 0.5) * 14, 26 + row * 30)
    }
    // the bits streaming past underneath
    f.font = '700 15px ui-monospace, Menlo, monospace'
    for (let row = 0; row < 4; row++) {
      let bits = ''
      for (let k = 0; k < 44; k++) bits += rnd(k * 7 + row * 131 + Math.floor(time * 20 + k * 0.3)) > 0.5 ? '1' : '0'
      f.fillStyle = 'rgba(255,196,140,0.8)'
      f.fillText(bits.replace(/(.{8})/g, '$1 '), 6 - ((time * 90 + row * 40) % 45), 150 + row * 26)
    }
    back.tex.needsUpdate = front.tex.needsUpdate = true
  }

  // The keyboard he types the search on: a slab of light and three rows of keys.
  const keyboard = new THREE.Group()
  keyboard.visible = false
  bodyG.add(keyboard)
  box(1.05, 0.03, 0.4, dim, 0, 0, 0, keyboard)
  const keys: THREE.Mesh[] = []
  for (let r = 0; r < 3; r++)
    for (let c = 0; c < 10 - r; c++) {
      const k = box(0.075, 0.03, 0.075, bright, -0.4 + c * 0.09 + r * 0.045, 0.03, -0.11 + r * 0.11, keyboard)
      keys.push(k)
    }
  box(0.45, 0.03, 0.06, bright, 0, 0.03, 0.16, keyboard) // the space bar

  const hole = new THREE.Mesh(
    new THREE.PlaneGeometry(1.1, 1.1),
    new THREE.ShaderMaterial({ uniforms: { uTime: U.uTime, uGrow: { value: 0 } }, vertexShader: HOLE_VERT, fragmentShader: HOLE_FRAG, transparent: true, depthWrite: false }),
  )
  hole.visible = false
  hole.userData.noLine = true
  hole.renderOrder = 2
  bodyG.add(hole)

  hands.forEach((h) => ink(h, FINE))
  ink(browser, FINE)
  ink(keyboard, FINE)
  ink(files, FINE)
  ink(bodyG)
  const core = spr(coreTex), streak = spr(streakTex), ring = spr(ringTex)

  return {
    figure, turn, bodyG, torso, globe, face, eyes, brows, mouth, mouthHole, hands, shoes, limbs, files, drum, cards, browser, chars, caret, rows, keyboard, keys, hole, fx, puddle,
    code: { group: code, mats: [back.mat, front.mat], draw: drawCode },
    core, streak, ring, mouthCurve, onSphere, hose, legHose,
  }
}
