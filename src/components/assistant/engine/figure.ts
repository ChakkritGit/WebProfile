import * as THREE from 'three'
import { LINE_FRAG, LINE_VERT, TOON, VERT } from './shaders'

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
  hands.forEach((h) => ink(h, FINE))
  ink(bodyG)
  const core = spr(coreTex), streak = spr(streakTex), ring = spr(ringTex)

  return {
    figure, turn, bodyG, torso, globe, face, eyes, brows, mouth, mouthHole, hands, shoes, limbs, fx, puddle,
    core, streak, ring, mouthCurve, onSphere, hose, legHose,
  }
}
