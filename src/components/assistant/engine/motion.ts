import * as THREE from 'three'
import type { Figure, Uniforms } from './figure'

/* How Mr. Worldwide moves, one frame at a time. Ported from the prototype's
   frame() (docs/superpowers/prototypes/mr-worldwide/index.html), without the
   rendering, and with the site's limits: he turns before the quick-contact dock,
   stands still on phones, for reduced motion and while the chat is open, and
   warps on his own now and then. */

const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z)

export type Mode = 'walk' | 'pause' | 'wave' | 'notice' | 'act' | 'out' | 'in'
export type ActName = 'hips' | 'think' | 'talk' | 'point' | 'search' | 'glitch' | 'stretch' | 'dizzy' | 'hop' | 'dance' | 'browse' | 'singularity'

export function createState() {
  return {
    x: -2,
    dir: 1,
    v: 0,
    ph: 0,
    face: 0.5,
    faceV: 0,
    mode: 'walk' as Mode,
    act: null as ActName | null,
    actW: 0,
    lastAct: null as ActName | null,
    actUntil: 0,
    cursor: null as THREE.Vector3 | null,
    cursorAt: 0,
    modeT: 0,
    nextPause: 6 + Math.random() * 6,
    target: 0,
    look: V(0, 0, 0),
    lookTo: V(0, 0, 0),
    nextLook: 1,
    blinkT: 3,
    blink: 0,
    busy: false,
    nextWarp: 40 + Math.random() * 50,
    mobile: false,
    parked: false,
    reduced: false,
    actT: 0,
    nextGlance: 4 + Math.random() * 4,
    glanceT: 0,
    mood: { brow: 0, tilt: 0, lid: 0, smile: 0.1, width: 0, open: 0, skew: 0, head: 0 },
    filesSide: 1,
    drumW: 0,
    flickF: 0,
  }
}
export type State = ReturnType<typeof createState>

export const ease = (k: number) => k * k * (3 - 2 * k)
// Overshoot, then settle.
const backOut = (k: number) => {
  const c = 1.9
  return 1 + (c + 1) * Math.pow(k - 1, 3) + c * Math.pow(k - 1, 2)
}
export const c01 = (k: number) => Math.min(1, Math.max(0, k))

// The glove's orientation from where its fingers point, against the camera axis.
const handFrame = (dir: THREE.Vector3) => {
  const yAx = dir.clone().negate(), xAx = new THREE.Vector3().crossVectors(V(0, 0, 1), yAx)
  if (xAx.lengthSq() < 1e-4) xAx.set(1, 0, 0)
  xAx.normalize()
  const zAx = new THREE.Vector3().crossVectors(xAx, yAx).normalize()
  return new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(xAx, yAx, zAx))
}

// The wave, as one pose over time: raise (with overshoot), waves that swell and
// fade, lower (with a small drop). k is how far into the waving pose he is.
const waveState = (T: number) => {
  const raise = backOut(c01(T / 0.34)), lower = ease(c01((T - 1.7) / 0.38))
  const drop = Math.sin(c01((T - 1.7) / 0.5) * Math.PI) * 0.06
  return { k: raise * (1 - lower), amp: ease(c01((T - 0.22) / 0.25)) * (1 - ease(c01((T - 1.45) / 0.3))), drop }
}

interface Pose {
  E: THREE.Vector3
  H: THREE.Vector3
  dir: THREE.Vector3
  curl: number
  index?: boolean
  /** How much of it, over the act's time (1 when left out). */
  w?: number
  /** A turn of the hand about its own length: π shows the palm up. */
  roll?: number
}

/** The idle acts, and how long each runs (s). */
const IDLE: [ActName, number, number][] = [
  // act, weight, seconds
  ['hips', 0.18, 2.6],
  ['search', 0.16, 4.2],
  ['think', 0.08, 2.6],
  ['glitch', 0.12, 2.4],
  ['stretch', 0.1, 3.0],
  ['dizzy', 0.1, 3.4],
  ['hop', 0.12, 1.7],
  ['dance', 0.14, 4.2],
  ['browse', 0.12, 4.3],
  ['singularity', 0.12, 4.2],
]
const gh = (n: number) => { const x = Math.sin(n) * 43758.5453; return x - Math.floor(x) }
const bell = (k: number) => Math.sin(Math.PI * c01(k))

type Mood = { brow: number; tilt: number; lid: number; smile: number; width: number; open: number; skew: number; head: number }
const CALM: Mood = { brow: 0, tilt: 0, lid: 0, smile: 0.1, width: 0, open: 0, skew: 0, head: 0 }

/** The face through an idle act, T seconds in. */
function actMood(act: ActName, T: number, t: number): Mood {
  const m = CALM
  switch (act) {
    case 'hop':
      return { ...m, brow: 0.08, lid: -0.5, smile: 0.2, width: 0.04, open: 0.35 * bell((T - 0.28) / 0.45) }
    case 'dance':
      return { ...m, brow: 0.04, lid: -0.9, smile: 0.18, width: 0.03, head: 0.05 * Math.sin(Math.PI * T * 4) }
    case 'stretch': {
      const a = ease(c01((T - 0.1) / 0.6)) * (1 - ease(c01((T - 1.9) / 0.5))), yawn = bell((T - 0.5) / 1.3)
      return { ...m, brow: 0.06 * a, lid: -3.2 * yawn - 0.3 * a, smile: 0.1 - 0.08 * yawn, width: -0.08 * yawn, open: 0.95 * yawn }
    }
    case 'dizzy': {
      const spinning = bell((T - 0.25) / 1.1), wob = T > 1.35 ? Math.exp(-(T - 1.35) * 1.4) : 0
      return { ...m, brow: 0.06 * spinning, tilt: 0.9 * wob, lid: -0.25 * wob, smile: 0.05 + 0.15 * spinning, open: 0.35 * spinning, skew: 0.45 * wob * Math.sin(T * 3) }
    }
    case 'glitch':
      if (T < 0.9) return { ...m, brow: 0.1, lid: 1, smile: 0.03, width: -0.06, open: 0.4 } // startled
      if (T < 1.6) return { ...m, brow: -0.03, tilt: 0.6, smile: 0.04, skew: 0.35 } // annoyed
      return { ...m, brow: 0.05, lid: -0.3, smile: 0.16 } // fixed it
    case 'singularity':
      if (T < 0.5) return { ...m, brow: 0.02, smile: 0.1 }
      if (T < 1.4) return { ...m, brow: 0.1, lid: 0.9, open: 0.35, smile: 0.04, width: -0.05 } // whoa
      if (T < 2.9) return { ...m, brow: 0.05, lid: 0.25, smile: 0.16, width: 0.02 } // delighted
      if (T < 3.4) return { ...m, brow: -0.02, smile: 0.08 } // and... closed
      return { ...m, brow: 0.03, tilt: 0.4, lid: -0.35, smile: 0.15, skew: -0.25 } // pleased with himself
    case 'browse':
      if (T < 1.8) return { ...m, brow: -0.02, lid: -0.1, smile: 0.06, skew: 0.2 } // typing
      if (T < 3.2) return { ...m, brow: 0.02, smile: 0.08, head: 0.02 * Math.sin(t * 3) } // reading
      if (T < 3.7) return { ...m, brow: 0.1, lid: 0.6, open: 0.3, smile: 0.14 } // aha
      return { ...m, brow: 0.04, lid: -0.3, smile: 0.16 }
    default:
      return m
  }
}

/** Key poses in time, each eased into the next over its first 0.18 s. */
function keyed(keys: [number, Pose][], T: number): Pose {
  let i = 0
  while (i + 1 < keys.length && T >= keys[i + 1][0]) i++
  const [t0, a] = keys[i], prev = keys[Math.max(0, i - 1)][1]
  const k = i === 0 ? 1 : ease(c01((T - t0) / 0.18))
  return {
    E: prev.E.clone().lerp(a.E, k),
    H: prev.H.clone().lerp(a.H, k),
    dir: prev.dir.clone().lerp(a.dir, k),
    curl: THREE.MathUtils.lerp(prev.curl, a.curl, k),
    index: k > 0.5 ? a.index : prev.index,
    roll: THREE.MathUtils.lerp(prev.roll ?? 0, a.roll ?? 0, k),
  }
}

// A walking foot's place in its cycle: planted for STANCE of it (heel strike at
// 0), swinging through the rest.
const STANCE = 0.6
const cyc = (a: number) => (((a / (Math.PI * 2)) % 1) + 1) % 1

/** Advance one frame. `full` is false while he only idles or cruises (the loop then draws at 30 fps). */
export function step(
  F: Figure,
  U: Uniforms,
  st: State,
  dt: number,
  t: number,
  world: { halfW: number; minX: number; maxX: number; camZ: number },
): { full: boolean } {
  const { figure, turn, bodyG, torso, globe, face, eyes, brows, mouth, mouthHole, hands, shoes, limbs, puddle, core, streak, ring, files, drum, cards } = F
  const canWalk = !(st.reduced || st.mobile || st.parked || st.busy)
  st.modeT += dt

  // --- where he is going, and how fast
  let wantV = 0
  if (st.mode === 'walk') {
    if (canWalk) {
      wantV = 1
      const edge = st.dir > 0 ? world.maxX : -world.minX
      const ahead = st.x * st.dir
      if (ahead > edge - 0.2) wantV = 0 // ease into the edge
      if (ahead > edge - 0.5) wantV = Math.min(wantV, (edge - ahead) / 0.3)
      if (ahead > edge - 0.3 && st.v < 0.08) st.dir *= -1 // then turn round
      // Now and then he warps somewhere else along the floor.
      st.nextWarp -= dt
      if (st.nextWarp < 0 && world.maxX - world.minX > 3) {
        st.nextWarp = 40 + Math.random() * 50
        let to = st.x
        for (let i = 0; i < 8 && Math.abs(to - st.x) < (world.maxX - world.minX) / 3; i++) {
          to = world.minX + Math.random() * (world.maxX - world.minX)
        }
        st.target = to
        st.mode = 'out'
        st.modeT = 0
        st.v = 0
      }
    }
    if (!st.reduced) st.nextPause -= dt
    if (st.mode === 'walk' && st.nextPause < 0) {
      st.nextPause = 8 + Math.random() * 8
      // An idle fidget: stand and look about, hands on hips, a think, or a
      // flick through the files.
      if (Math.random() < 0.22) {
        st.mode = 'pause'
        st.modeT = 0
      } else {
        let r = Math.random() * IDLE.reduce((a, [, w]) => a + w, 0)
        const [name, , secs] = IDLE.find(([, w]) => (r -= w) < 0) ?? IDLE[0]
        st.act = name
        st.actUntil = t + secs
      }
    }
    // Now and then, strolling, he glances out at you.
    st.nextGlance -= dt
    if (st.nextGlance < 0) {
      st.nextGlance = 5 + Math.random() * 6
      st.glanceT = 1.4
    }
  } else if (st.mode === 'pause' && st.modeT > 2.4) {
    st.mode = 'walk'
    st.modeT = 0
  }
  st.glanceT = Math.max(0, st.glanceT - dt)
  // Someone's pointer comes close: he stops and turns to see who it is.
  const near = !!st.cursor && Math.abs(st.cursor.x - st.x) < 2.3 && t - st.cursorAt < 1.2
  if (near && (st.mode === 'walk' || st.mode === 'pause')) {
    st.mode = 'notice'
    st.modeT = 0
  }
  if (st.mode === 'notice' && !near && st.modeT > 0.8) {
    st.mode = 'walk'
    st.modeT = 0
  }
  if (st.act && st.actUntil && t > st.actUntil) {
    st.act = null
    st.actUntil = 0
  }
  if (st.act && (st.mode === 'walk' || st.mode === 'pause' || st.mode === 'notice')) {
    st.mode = 'act'
    st.modeT = 0
  }
  if (st.mode === 'act' && !st.act && st.actW < 0.03) {
    st.mode = 'walk'
    st.modeT = 0
  } else if (st.mode === 'wave' && st.modeT > 2.15) {
    st.mode = 'walk'
    st.modeT = 0
  }
  st.v += (Math.max(0, wantV) - st.v) * Math.min(1, dt * 2.6)
  if (st.act && st.act !== st.lastAct) st.actT = 0
  if (st.act) st.lastAct = st.act
  st.actT += dt
  st.actW += ((st.act ? 1 : 0) - st.actW) * Math.min(1, dt * 5)
  const aw = ease(c01(st.actW)), act = st.lastAct
  st.x += st.dir * st.v * dt * 1.15
  const s = st.v

  // --- facing: a damped spring, so the turn overshoots a touch and settles.
  // The camera is in perspective and he walks the width of the screen: seen
  // from off to one side, "facing the way he walks" would show his back near
  // the edges. The view's own angle to him is added, so what you see is right
  // wherever he is on the screen.
  const walking = st.mode === 'walk' && canWalk
  const facingTarget = walking ? st.dir * 1.05 : 0
  st.faceV += (38 * (facingTarget - st.face) - 8.5 * st.faceV) * dt
  st.face += st.faceV * dt
  const view = Math.atan2(-st.x * figure.scale.x, world.camZ)
  turn.rotation.y = st.face + view
  figure.position.x = st.x

  // --- the gait. Cadence follows speed; the planted foot slides back exactly
  // as fast as he goes forward, so it stays put on the floor (no skating).
  // Turning on the spot, he takes small steps round.
  const turning = Math.min(1, Math.abs(st.faceV) / 3) * (1 - s)
  st.ph += (s * 6.2 + turning * 7) * dt
  const ph = st.ph
  const yaw = Math.max(0.45, Math.abs(Math.sin(turn.rotation.y)))
  const A = Math.max((0.35 / yaw) * Math.min(1, s * 2.5), 0.1 * turning)
  const uL = cyc(ph), uR = cyc(ph + Math.PI)
  // Lowest just after each heel strike (taking the weight), highest as the legs pass.
  const bob = -0.06 * s * 0.5 * (1 - Math.cos(4 * Math.PI * (uL - 0.3)))
  const overL = Math.cos(2 * Math.PI * (uL - 0.3)) // +1 over the left foot, -1 over the right
  const breathe = Math.sin(t * 1.9) * 0.018 * (1 - s)
  bodyG.position.set(-0.045 * s * overL, bob, 0) // weight over the standing foot
  torso.position.y = 2.0 + breathe
  torso.scale.setScalar(1 + breathe * 0.4)
  // lean into the walk; roll over the standing foot; shoulders twist against the hips
  torso.rotation.set(0.1 * s, -0.08 * s * Math.cos(2 * Math.PI * uL), 0.035 * s * overL)
  globe.rotation.y += dt * (0.12 + 0.35 * s)

  // --- mood: what the face is doing, eased toward the moment's expression
  const cur = st.cursor && t - st.cursorAt < 1.2 ? st.cursor : null
  const glance = walking ? ease(c01(Math.min(st.glanceT, 1.4 - st.glanceT) / 0.3)) : 0
  const W = { brow: 0, tilt: 0, lid: 0, smile: 0.1, width: 0, open: 0, skew: 0, head: 0 }
  if (st.mode === 'notice') {
    const jolt = 1 - c01((st.modeT - 0.3) / 0.35) // surprised, then curious
    Object.assign(W, { brow: 0.1 * jolt + 0.05 * (1 - jolt), lid: 1 * jolt, open: 0.45 * jolt, smile: 0.12 - 0.1 * jolt, width: -0.06 * jolt, head: 0.1 * (1 - jolt) })
  } else if (st.mode === 'wave') Object.assign(W, { brow: 0.06, lid: -0.4, smile: 0.18, width: 0.03 })
  else if (st.mode === 'pause') Object.assign(W, { brow: 0.02 + Math.sin(st.modeT * 2) * 0.015, head: 0.05 * Math.sin(st.modeT * 1.3) })
  else if (walking && glance > 0) Object.assign(W, { brow: 0.03 * glance, smile: 0.1 + 0.06 * glance })
  if (act && aw > 0) {
    const M: Mood =
      act === 'search' ? { brow: -0.035, tilt: 0.9, lid: -0.15, smile: 0.03, width: -0.06, skew: 0.35, head: 0.04, open: 0 }
      : act === 'think' ? { brow: 0.02, tilt: -0.6, lid: 0, smile: 0.03, width: -0.04, skew: -0.3, head: -0.06, open: 0 }
      : act === 'talk' ? { brow: 0.02 + 0.03 * Math.max(0, Math.sin(t * 4.1)), tilt: 0, lid: 0.1, smile: 0.11, width: 0, skew: 0, head: 0.03 * Math.sin(t * 2.3), open: 0 }
      : act === 'point' ? { brow: 0.05, tilt: 0, lid: 0.2, smile: 0.15, width: 0.02, skew: 0, head: 0.05, open: 0 }
      : act === 'hips' ? { brow: 0.03, tilt: 0, lid: 0, smile: 0.13, width: 0, skew: 0, head: 0.04, open: 0 } // pleased with himself
      : actMood(act, st.actT, t)
    for (const k of Object.keys(M) as (keyof typeof M)[]) W[k] += (M[k] - W[k]) * aw
  }
  for (const k of Object.keys(W) as (keyof typeof W)[]) st.mood[k] += (W[k] - st.mood[k]) * Math.min(1, dt * 9)
  const mood = st.mood
  torso.rotation.z += mood.head // a tilt of the head (he is all head)

  // The face slides round the globe: toward the way he walks (glancing out at
  // you now and then), toward your pointer, toward the files he is searching.
  const faceY =
    walking ? -st.dir * (0.45 + 0.6 * glance) * Math.min(1, s * 3)
    : cur ? THREE.MathUtils.clamp((cur.x - st.x) * 0.09, -0.5, 0.5)
    : act === 'search' || act === 'browse' ? st.filesSide * 0.38 * aw
    : 0
  const faceX = !walking && cur ? THREE.MathUtils.clamp(-(cur.y - 2.0) * 0.07, -0.3, 0.25) : act === 'think' ? -0.12 * aw : act === 'search' ? 0.08 * aw : 0
  face.rotation.y += (faceY - face.rotation.y) * Math.min(1, dt * 6)
  face.rotation.x += (faceX - face.rotation.x) * Math.min(1, dt * 6)
  if (st.mode === 'wave') {
    const w = waveState(st.modeT)
    torso.rotation.z = 0.09 * w.k + 0.02 * w.amp * Math.sin(st.modeT * 11 - 1.2) // leans away, swayed by the arm
    torso.rotation.x = -0.05 * w.k // and back a little
    bodyG.position.y += 0.05 * Math.sin(c01(st.modeT / 0.3) * Math.PI) // a small bounce as it starts
  }
  if (st.mode === 'notice') bodyG.position.y += 0.06 * Math.sin(c01(st.modeT / 0.28) * Math.PI) // a start

  // --- the idle acts' whole-body moves
  const T = st.actT
  let jump = 0, squash = 1, toes = 0, spin = 0
  const footUp = [0, 0], stepX = [0, 0]
  let wob = 0
  if (act && aw > 0.001) {
    if (act === 'hop') {
      // crouch, spring up with the arms thrown up, land into the knees, a little one more
      const crouch = T < 0.22 ? ease(T / 0.22) : 1 - c01((T - 0.22) / 0.08)
      const k = c01((T - 0.28) / 0.45), k2 = c01((T - 0.95) / 0.3)
      jump = 1.0 * Math.sin(Math.PI * k) + 0.35 * Math.sin(Math.PI * k2)
      squash = 1 - 0.16 * crouch + 0.08 * bell(k) - 0.13 * bell((T - 0.73) / 0.22) - 0.07 * bell((T - 1.25) / 0.18)
      footUp[0] = footUp[1] = 0.2 * bell(k) + 0.08 * bell(k2)
    } else if (act === 'dance') {
      // a groove at 120 bpm: down on every beat, hips side to side, stepping out
      const beat = T * 2
      bodyG.position.y += -0.06 * 0.5 * (1 - Math.cos(2 * Math.PI * beat))
      bodyG.position.x += 0.1 * Math.sin(Math.PI * beat)
      torso.rotation.z += 0.08 * Math.sin(Math.PI * beat)
      footUp[0] = 0.14 * Math.max(0, Math.sin(Math.PI * beat))
      footUp[1] = 0.14 * Math.max(0, -Math.sin(Math.PI * beat))
      stepX[0] = -0.08 * Math.max(0, Math.sin(Math.PI * beat))
      stepX[1] = 0.08 * Math.max(0, -Math.sin(Math.PI * beat))
    } else if (act === 'stretch') {
      // up on the toes, reaching high, a yawn; then down again
      const a2 = ease(c01((T - 0.1) / 0.6)) * (1 - ease(c01((T - 1.9) / 0.5)))
      squash = 1 + 0.07 * a2
      toes = 0.45 * a2
      jump = 0.06 * a2
      torso.rotation.x -= 0.1 * a2
    } else if (act === 'dizzy') {
      // wind up, spin twice with the arms flung out, then reel
      squash = 1 - 0.08 * bell(T / 0.3)
      spin = Math.PI * 4 * ease(c01((T - 0.25) / 1.1))
      wob = T > 1.35 ? Math.exp(-(T - 1.35) * 1.4) : 0
      torso.rotation.z += 0.16 * wob * Math.sin((T - 1.35) * 7)
      bodyG.position.x += 0.1 * wob * Math.sin((T - 1.35) * 5)
      footUp[0] = 0.1 * Math.max(0, Math.sin(T * 14)) * bell((T - 0.25) / 1.1)
      footUp[1] = 0.1 * Math.max(0, -Math.sin(T * 14)) * bell((T - 0.25) / 1.1)
    } else if (act === 'glitch') {
      // the signal breaks up; he jumps, taps the side of his head, and it clears
      const g = T < 0.9 ? 0.55 + 0.45 * Math.round(gh(Math.floor(T * 14))) : T < 1.6 ? 0.6 * (1 - c01((T - 0.9) / 0.7)) * Math.round(gh(Math.floor(T * 20) + 3)) : 0
      U.uGlitch.value = g * aw
      if (g > 0.3) bodyG.position.x += (gh(Math.floor(T * 24) + 9) - 0.5) * 0.16 * g
      jump = 0.08 * bell(T / 0.25)
      // his workings spill out round him: binary behind, a stack trace in front
      F.code.draw(T) // scrolling: redrawn every frame it shows
      const tick = Math.floor(T * 14)
      const shown = T < 0.9 ? 0.95 : 0.95 * (1 - c01((T - 0.9) / 0.75))
      F.code.mats.forEach((m, i) => (m.opacity = aw * shown * (0.6 + 0.4 * gh(tick * 3 + i))))
    }
    jump *= aw
    squash = 1 + (squash - 1) * aw
    toes *= aw
    spin *= aw
  }
  if (act !== 'glitch' || !st.act) {
    U.uGlitch.value *= Math.exp(-dt * 12)
    F.code.mats.forEach((m) => (m.opacity *= Math.exp(-dt * 12)))
  }
  F.code.group.visible = F.code.mats[0].opacity > 0.01
  turn.rotation.y += spin

  // --- legs: heel strike, weight onto a flat foot, heel up, toe-off, swing through
  for (const side of [-1, 1]) {
    const u = side < 0 ? uL : uR
    let fz: number, lift = 0, pitch: number
    if (u < STANCE) {
      const k = u / STANCE
      fz = A * (1 - 2 * k)
      pitch = -0.32 * (1 - ease(c01(k / 0.2))) + 0.5 * ease(c01((k - 0.6) / 0.4)) // toe up at the strike, heel up at the push
    } else {
      const k = (u - STANCE) / (1 - STANCE)
      fz = A * (-1 + 2 * ease(k))
      lift = (0.1 + 0.28 * A) * Math.pow(Math.sin(Math.PI * k), 0.8)
      pitch = THREE.MathUtils.lerp(0.5, -0.32, ease(k)) // toes trail, then lift for the next strike
    }
    pitch *= Math.min(1, A / 0.25)
    const fi = side < 0 ? 0 : 1
    const hip = V(0.27 * side, 1.18, 0)
    const foot = V(0.33 * side + stepX[fi] * aw, 0.1 + lift + footUp[fi] * aw - bob, fz)
    pitch += toes
    // The shoe first: it rocks on the heel as it lands (toe up) and on the toe
    // as it pushes off (heel up), so whichever end is on the floor stays there.
    const shoe = shoes[side < 0 ? 0 : 1]
    if (act === 'think' && side > 0) pitch -= 0.3 * aw * Math.max(0, Math.sin(t * 8)) // tapping, heel down
    const rock = new THREE.Quaternion().setFromAxisAngle(V(1, 0, 0), pitch)
    const pivot = pitch < 0 ? V(0, 0, 0) : V(0, 0, 0.48)
    shoe.quaternion.copy(rock)
    shoe.position.copy(foot).add(V(0, -0.06, -0.12)).add(pivot.clone().sub(pivot.clone().applyQuaternion(rock)))
    // Then the leg: a rubber hose, one smooth arc from hip to the shoe's opening
    // wherever the shoe now is, bowed forward by as much as the foot has come in
    // from the leg's full length — straight when stretched, bent when under.
    const ankle = V(0, 0.16, 0.1).applyQuaternion(rock).add(shoe.position)
    const span = ankle.clone().sub(hip), d = span.length(), LEG = 1.08
    const sag = Math.sqrt(Math.max(0, LEG * LEG - d * d)) * 0.55
    const along = span.clone().normalize()
    const fwd = V(0, 0, 1).sub(along.clone().multiplyScalar(along.z)).normalize()
    const ctrl = hip.clone().lerp(ankle, 0.5).add(fwd.multiplyScalar(sag)).add(V(0.03 * side, 0, 0))
    F.legHose(limbs[side < 0 ? 2 : 3], new THREE.QuadraticBezierCurve3(hip, ctrl, ankle))
  }

  // --- the files: a rolodex on whichever side has room, flicked round
  const searching = act === 'search' ? aw : 0
  const props = act === 'search' || act === 'browse'
  if (props && aw > 0.001 && st.actT < 0.05) st.filesSide = st.x > (world.minX + world.maxX) / 2 ? -1 : 1
  const fs = st.filesSide
  const pop = act === 'search' && st.act ? backOut(c01(st.actT / 0.4)) : searching
  files.visible = pop > 0.01
  // set a little back, so the hand can rest in front of it at an arm's easy reach
  const FS = 1.25, FX = 2.0 * fs, FY = 1.55, FZ = -0.38
  if (files.visible) {
    files.position.set(FX, FY, FZ)
    files.scale.set(pop * FS, Math.max(0.02, pop) * FS, pop * FS)
    st.drumW *= Math.exp(-dt * 1.5)
    drum.rotation.y += (st.drumW + 0.25 * fs) * dt
    cards.forEach((c, i) => (c.rotation.x = Math.sin(t * 17 + i * 1.7) * Math.min(0.25, Math.abs(st.drumW) * 0.03)))
  }
  // the search page: switches on like his screen (in steps), off by folding up
  const browsing = act === 'browse' && aw > 0.001
  F.browser.visible = browsing
  if (browsing) {
    const T2 = st.actT
    const on = Math.floor(c01(T2 / 0.35) * 6) / 6, off = ease(c01((T2 - 3.85) / 0.3))
    F.browser.position.set(2.05 * fs, 2.2, 0.35)
    F.browser.rotation.set(0, -fs * 0.32, 0)
    F.browser.scale.set(Math.max(0.02, 1 - off), Math.max(0.02, (on < 0.4 ? 0.02 : on) * (1 - off * 0.98)), 1)
    const typed = Math.floor(c01((T2 - 0.45) / 1.1) * F.chars.length)
    F.chars.forEach((c, i) => (c.visible = i < typed))
    F.caret.visible = T2 > 0.35 && T2 < 1.75 && Math.sin(T2 * 12) > 0
    F.caret.position.x = -0.355 + typed * 0.052
    F.rows.forEach((r, i) => (r.scale.x = Math.max(0.001, ease(c01((T2 - 1.95 - i * 0.2) / 0.28)))))
  }

  // --- arms: each swings with the opposite leg, a beat behind it, on an arc
  for (const side of [-1, 1]) {
    const uArm = cyc((side < 0 ? ph + Math.PI : ph) - 0.35)
    const swing = Math.cos(2 * Math.PI * uArm) // +1 forward
    const shoulder = V(0.88 * side, 1.87, 0)
    const hz = 0.36 * s * swing
    let hand = V(
      (1.22 - 0.06 * s * Math.max(0, swing)) * side, // forward, it comes in toward the middle
      1.23 + 0.5 * hz * hz, // a pendulum's arc
      hz + 0.05 + 0.03 * Math.sin(t * 1.3 + side) * (1 - s),
    )
    let up: THREE.Vector3 | null = null, k = 0
    const wave = st.mode === 'wave' && side > 0
    // At rest the arm hangs straight — the elbow on the line from shoulder to hand,
    // so the hose has no kink; it bends only for the poses below.
    let elbow = shoulder.clone().lerp(hand, 0.5).add(V(0.02 * side, 0, 0))
    const restDir = hand.clone().sub(elbow).normalize().lerp(V(0, -1, 0), 0.4).normalize()
    if (wave) {
      // Upper arm out and up, held; the forearm swings from the elbow; the
      // wrist follows a beat behind (follow-through).
      const w = waveState(st.modeT), T = st.modeT
      const sw = 0.42 * w.amp * Math.sin(T * 11)
      const E = V(1.42, 2.25 - w.drop, 0.22)
      const H = E.clone().add(V(Math.sin(sw) * 0.62, Math.cos(sw) * 0.62, 0.12))
      elbow = elbow.lerp(E, w.k)
      hand = hand.lerp(H, w.k)
      const wrist = 0.35 * w.amp * Math.sin(T * 11 - 0.7)
      up = V(Math.sin(sw + wrist), Math.cos(sw + wrist), 0.15).normalize()
      k = c01(w.k)
    }
    // Acts: whole-arm poses blended in over the walk. Each gives an elbow, a hand,
    // where the fingers point, and how curled they are.
    let pose: Pose | null = null
    if (aw > 0.001 && act) {
      const hips: Pose = { E: V(1.55 * side, 1.78, -0.12), H: V(1.03 * side, 1.42, 0.12), dir: V(-side * 0.8, -0.45, 0.15), curl: 0.55 }
      if (act === 'hips') pose = hips
      else if (act === 'think')
        pose = side > 0 ? { E: V(0.95, 1.0, 0.75), H: V(0.28, 1.2, 1.02), dir: V(-0.2, 0.9, 0.35), curl: 1.05 } : hips // knuckles to the chin
      else if (act === 'talk') {
        const beat = Math.sin(t * 5.2 + side * 1.7), lift = 0.12 * beat
        pose = { E: V(1.32 * side, 1.52, 0.3), H: V((0.98 - 0.06 * beat) * side, 1.58 + lift, 0.78), dir: V(side * 0.35, 0.3, 0.88), curl: 0.12 }
      } else if (act === 'point') {
        const d = V(0.45, 0.85, 0.3).normalize()
        pose = side > 0
          ? { E: shoulder.clone().add(d.clone().multiplyScalar(0.55)), H: shoulder.clone().add(d.clone().multiplyScalar(1.12)), dir: d, curl: 1.4, index: true }
          : hips
      } else if (act === 'search') {
        if (side === fs) {
          // Leafing through a rolodex, as in the reference: the arm held still
          // at an easy reach, the hand resting in front of the drum; only the
          // wrist works — cocked back so the fingertip is on the cards, a quick
          // flick that pushes them round, then an easy return. The arm gives a
          // little with each flick, no more.
          const T2 = Math.max(0, st.actT - 0.45), f = cyc(((T2 / 1.3) % 1) * Math.PI * 2)
          const cocked = V(0.6 * fs, -0.1, -0.65).normalize(), out = V(fs, -0.1, 0.15).normalize()
          const w =
            f < 0.3 ? 0.35 * (1 - ease(f / 0.3)) // settle back onto the cards
            : f < 0.42 ? ease((f - 0.3) / 0.12) // the flick
            : 1 - ease((f - 0.42) / 0.58) * 0.65 // and ease back
          const d = cocked.clone().lerp(out, w).normalize()
          const give = f >= 0.3 && f < 0.6 ? bell((f - 0.3) / 0.3) : 0
          const H = V((1.5 + 0.05 * give) * fs, FY + 0.05 + 0.02 * give, 0.75 - 0.02 * give)
          if (st.actT > 0.45 && f >= 0.34 && st.flickF < 0.34) st.drumW += 7 * fs // the flick: the front goes his way
          st.flickF = f
          pose = { E: shoulder.clone().lerp(H, 0.5).add(V(0.04 * fs, -0.12, 0.02)), H, dir: d, curl: 1.3, index: true, roll: -fs * Math.PI / 2 }
        } else pose = hips
      } else if (act === 'hop') {
        const upW = Math.min(1, 1.3 * (bell((T - 0.28) / 0.45) + 0.6 * bell((T - 0.95) / 0.3)))
        pose = { E: V(1.25 * side, 2.45, 0.1), H: V(1.4 * side, 3.0, 0.2), dir: V(0.2 * side, 1, 0.1), curl: 0.15, w: upW }
      } else if (act === 'dance') {
        if (side > 0) {
          // disco: up to the corner, down across, on the beat
          const k = ease(0.5 + 0.5 * Math.sin(Math.PI * T * 2))
          pose = { E: V(1.2, 2.2, 0.3), H: V(0.6, 1.2, 0.6).lerp(V(1.6, 3.0, 0.3), k), dir: V(-0.4, -1, 0.3).lerp(V(0.45, 1, 0.2), k), curl: 1.3, index: true }
        } else pose = { E: V(-1.3, 1.5, 0.3), H: V(-0.75, 1.7 + 0.12 * Math.sin(4 * Math.PI * T), 0.75), dir: V(0.3, 0.4, 0.9), curl: 1.2 }
      } else if (act === 'stretch') {
        const a2 = ease(c01((T - 0.1) / 0.6)) * (1 - ease(c01((T - 1.9) / 0.5)))
        pose = { E: V(0.8 * side, 2.75, -0.05), H: V(0.32 * side, 3.4, 0), dir: V(0, 1, 0), curl: 0.35, w: a2 }
      } else if (act === 'dizzy') {
        pose = { E: V(1.3 * side, 1.95, 0.05), H: V(1.8 * side, 1.95 + 0.1 * Math.sin(T * 9 + side), 0.15), dir: V(side, 0.1, 0), curl: 0.15, w: bell((T - 0.2) / 1.25) }
      } else if (act === 'glitch') {
        if (side > 0) {
          // taps the side of his head, like a set on the blink
          const tap = T > 0.9 && T < 1.6 ? 0.07 * Math.abs(Math.sin((T - 0.9) * 14)) : 0
          pose = { E: V(1.05, 2.55, 0.4), H: V(0.66, 2.95 + tap, 0.55), dir: V(-0.45, -1, 0.1), curl: 0.55, w: c01((T - 0.75) / 0.2) * (1 - c01((T - 1.75) / 0.25)) }
        } else pose = { E: V(-1.25, 1.7, 0.25), H: V(-1.35, 2.05, 0.45), dir: V(-0.3, 0.6, 0.7), curl: 0.1, w: bell(T / 0.9) } // startled
      } else if (act === 'singularity') {
        // opens his hand, palm up; the hole comes and goes above it; he closes on it
        // fingers out to his side, palm turned up (so you see the open hand side-on)
        const palm: Pose = { E: V(1.3, 1.45, 0.3), H: V(1.55, 1.3, 0.6), dir: V(1, 0.12, 0.2), curl: 0.03 + 0.08 * Math.max(0, Math.sin(T * 23)) * bell((T - 0.9) / 2), roll: Math.PI / 2 }
        pose =
          side > 0
            ? keyed([
                [0, palm],
                [2.9, { ...palm, curl: 1.55 }],
                [3.45, { E: V(1.2, 1.45, 0.2), H: V(1.12, 1.28, 0.42), dir: V(0, -1, 0.3), curl: 0.5 }],
              ], T)
            : { E: V(-1.2, 1.55, 0.2), H: V(-1.12, 1.25, 0.35), dir: V(0.2, -1, 0.3), curl: 0.3 }
        if (side > 0) face.rotation.y += (0.3 * aw - face.rotation.y) * Math.min(1, dt * 4) // turned to it
      } else if (act === 'browse') {
        const type = (sd: number): Pose => ({ E: V(1.1 * sd, 1.45, 0.55), H: V(0.42 * sd, 1.62 + 0.045 * Math.max(0, Math.sin(T * 22 + sd * 1.6)), 0.95), dir: V(0, -0.5, 1), curl: 0.55 })
        const bx = 2.05 * fs
        pose =
          side === fs
            ? keyed([
                [0, type(side)],
                [1.62, { E: V(1.2 * fs, 1.85, 0.35), H: V(bx - 0.62 * fs, 2.2, 0.62), dir: V(0.9 * fs, 0.05, 0.3), curl: 1.25, index: true }], // enter
                [1.9, hips],
                [3.55, { E: V(1.35 * fs, 2.1, 0.35), H: V(bx - 0.4 * fs, 2.35, 0.7), dir: V(0.5 * fs, 0.7, 0.4), curl: 0.1 }],
                [3.8, { E: V(1.5 * fs, 2.05, 0.35), H: V(bx + 0.5 * fs, 2.2, 0.7), dir: V(0.8 * fs, 0.4, 0.3), curl: 0.1 }], // swipes it shut
                [4.1, hips],
              ], T)
            : keyed([
                [0, type(side)],
                [1.62, hips],
                [1.9, { E: V(1.0 * side, 1.0, 0.75), H: V(0.3 * side, 1.2, 1.02), dir: V(-0.2 * side, 0.9, 0.35), curl: 1.05 }], // chin in hand, reading
                [3.5, hips],
              ], T)
      }
    }
    const pw = pose ? aw * (pose.w ?? 1) : 0
    if (pose) {
      elbow = elbow.lerp(pose.E, pw)
      hand = hand.lerp(pose.H, pw)
    }
    F.hose(limbs[side < 0 ? 0 : 1], [shoulder, elbow, hand], 0.07)
    const g = hands[side < 0 ? 0 : 1]
    g.position.copy(hand)
    // Two whole orientations, blended by rotation (slerp): hanging — palm to the
    // thigh, thumb forward, wrist trailing the swing — and waving, palm to you.
    const drag = -Math.sin(2 * Math.PI * uArm) * s // the swing's velocity: the wrist trails it
    const qRest = handFrame(restDir).multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(0.3 * drag, -side * 1.25, 0, 'YXZ')))
    g.quaternion.copy(up ? qRest.slerp(handFrame(up), k) : qRest)
    if (pose) g.quaternion.slerp(handFrame(pose.dir.clone().normalize()).multiply(new THREE.Quaternion().setFromAxisAngle(V(0, 1, 0), pose.roll ?? 0)), pw)
    if (side > 0) {
      // the palm's black hole: over the open hand, sized by how open it still is
      const T2 = st.actT
      const grow = act === 'singularity' && aw > 0.01 ? backOut(c01((T2 - 0.5) / 0.45)) * (1 - ease(c01((T2 - 2.9) / 0.25))) * (1 + 0.03 * Math.sin(T2 * 20)) : 0
      F.hole.visible = grow > 0.01
      F.hole.material.uniforms.uGrow.value = grow * 1.35
      F.hole.position.copy(hand).add(V(0.3, 0.72, 0.12))
    }
    const open = wave ? waveState(st.modeT).k : 0
    // At rest a hand is open and loose: fingers together and gently curved, the
    // little finger a touch more, curling a little as the swing drags them.
    const rest = 0.22 + 0.08 * drag + 0.03 * Math.sin(t * 0.9 + side)
    const indexI = side > 0 ? 0 : 3
    const { fingers, thumb } = g.userData as { fingers: THREE.Group[]; thumb: THREE.Group }
    fingers.forEach((f, i) => {
      let x = THREE.MathUtils.lerp(rest + (side > 0 ? 3 - i : i) * 0.05, 0.02, open)
      if (pose) x = THREE.MathUtils.lerp(x, pose.index && i === indexI ? 0 : pose.curl + (i === indexI ? -0.15 : 0.05 * i), pw)
      f.rotation.x = x
      const spread = act === 'singularity' && side > 0 && pose ? pw * c01(1 - pose.curl * 1.5) : 0
      f.rotation.z = THREE.MathUtils.lerp((i - 1.5) * 0.04, (i - 1.5) * 0.2, Math.max(open, spread))
    })
    thumb.rotation.x = THREE.MathUtils.lerp(THREE.MathUtils.lerp(0.25, 0, open), pose ? (pose.curl > 0.9 ? 0.9 : 0.2) : 0.25, pw)
    thumb.rotation.z = -side * THREE.MathUtils.lerp(0.45, 1.0, open)
  }

  // --- eyes: saccades, blinks at random; lids, brows and mouth from the mood
  st.nextLook -= dt
  if (st.nextLook < 0) {
    st.nextLook = 0.8 + Math.random() * 2.2
    st.lookTo.set(st.mode === 'walk' ? 0.03 * st.dir + (Math.random() - 0.5) * 0.04 : (Math.random() - 0.5) * 0.09, (Math.random() - 0.5) * 0.06, 0)
    if (st.mode === 'wave') st.lookTo.set(0, 0, 0)
  }
  if (walking && glance > 0.5) st.lookTo.set(-0.05 * st.dir, 0.01, 0) // at you
  if (!walking && cur) st.lookTo.set(THREE.MathUtils.clamp((cur.x - st.x) * 0.02, -0.07, 0.07), THREE.MathUtils.clamp((cur.y - 2.0) * 0.025, -0.05, 0.06), 0)
  if (act === 'think' && aw > 0.5) st.lookTo.set(-0.06, 0.055, 0)
  if (act === 'point' && aw > 0.5) st.lookTo.set(0.06, 0.05, 0)
  if (act === 'singularity' && aw > 0.5 && st.actT > 0.45 && st.actT < 3.3) st.lookTo.set(0.07, -0.01, 0) // at the hole in his hand
  if (act === 'dizzy' && aw > 0.5 && st.actT > 1.3) st.lookTo.set(0.07 * Math.cos(t * 10), 0.05 * Math.sin(t * 10), 0) // seeing stars
  if (act === 'browse' && aw > 0.5) {
    const T2 = st.actT
    // at the box while typing, then line by line down the results
    if (T2 < 1.9) st.lookTo.set(0.07 * fs, 0.03, 0)
    else if (T2 < 3.5) st.lookTo.set(0.05 * fs + 0.025 * Math.sin(T2 * 7), 0.02 - 0.02 * ((T2 - 1.9) / 1.6), 0)
    else st.lookTo.set(0.02 * fs, 0.01, 0)
  }
  // searching, the eyes follow the cards going past
  if (act === 'search' && aw > 0.5) st.lookTo.set(0.075 * fs + 0.012 * Math.sin(t * 9), -0.015 + 0.01 * Math.sin(t * 5), 0)
  st.look.lerp(st.lookTo, Math.min(1, dt * 14))
  st.blinkT -= dt
  if (st.blinkT < 0) {
    st.blink = 0.14
    st.blinkT = 2 + Math.random() * 4 + (Math.random() < 0.2 ? -1.8 : 0) // sometimes a double blink
  }
  st.blink = Math.max(0, st.blink - dt)
  const shut = st.blink > 0 ? Math.sin((1 - st.blink / 0.14) * Math.PI) : 0
  eyes.forEach(({ gaze, lid, glint }) => {
    gaze.rotation.set(-st.look.y * 5, st.look.x * 6, 0)
    // wide open when surprised, a little shut when smiling hard or concentrating
    lid.rotation.x = Math.min(0.35, -1.25 - mood.lid * 0.3 + shut * 1.6)
    glint.visible = shut < 0.6
  })
  const talking = act === 'talk' ? aw : 0
  const syll = talking * Math.max(0, Math.sin(t * 13) * 0.6 + Math.sin(t * 7.3) * 0.4) // uneven, like speech
  brows.forEach(({ mesh, s: sx }) => {
    // tilt: one brow up, the other down (considering, concentrating)
    const r = mood.brow + mood.tilt * (sx > 0 ? 0.06 : -0.025)
    mesh.position.copy(F.onSphere(0.26 * sx, 0.39 + r, 0.03))
    mesh.rotation.z = Math.PI / 2 - sx * (0.12 + r * 1.5)
  })
  const open = Math.max(syll, mood.open)
  mouthHole.scale.set(0.9 - mood.open * 0.35, Math.max(0.001, open * 0.8), 0.25)
  mouthHole.visible = open > 0.02
  mouth.rotation.z = mood.skew * 0.25 // a sideways, thinking mouth
  const smile = mood.smile - syll * 0.06
  const width = 0.2 + (smile - 0.1) * 0.5 + mood.width
  // Rebuilt only when the smile changes shape; it holds still most of the time.
  if (Math.abs(smile - (mouth.userData.smile ?? -1)) > 0.003 || Math.abs(width - (mouth.userData.width ?? -1)) > 0.003) {
    mouth.userData.smile = smile
    mouth.userData.width = width
    mouth.geometry.dispose()
    mouth.geometry = new THREE.TubeGeometry(F.mouthCurve(width, smile), 16, 0.024, 6)
    if (mouth.userData.line) (mouth.userData.line as THREE.Mesh).geometry = mouth.geometry
  }

  // --- the warp. Out: crouch, hop, whirl fast into light at the top, gone.
  // In: a point of light unwinds into him, then a landing.
  let hop = 0, sqY = 1
  let lights = { core: [0, 0.1], streak: [0, 0.1], ring: [0, 0.1] }
  if (st.mode === 'out') {
    const T = st.modeT
    const crouch = c01(T / 0.14), air = c01((T - 0.14) / 0.22)
    sqY = T < 0.14 ? 1 - 0.14 * ease(crouch) : 0.86 + 0.26 * ease(air)
    hop = T < 0.14 ? 0 : 0.85 * Math.sin((air * Math.PI) / 2)
    const w = c01((T - 0.3) / 0.38)
    U.uTwist.value = w * w * Math.PI * 7
    U.uPinch.value = Math.pow(w, 1.4)
    U.uLight.value = c01((T - 0.34) / 0.22)
    U.uBoost.value = 1 + 3 * w
    // Collapsed: the light gathers to a hot point, flares, and snaps shut.
    const g = c01((T - 0.6) / 0.14), off = c01((T - 0.74) / 0.16)
    lights = { core: [g * (1 - off), 0.9 * (1 - off * off) + 0.04], streak: [g * (1 - off), 3.2 * g * (1 - off)], ring: [off > 0 ? 0.7 * (1 - off) : 0, 0.3 + 2.4 * off] }
    if (T > 0.95) {
      st.x = st.target
      st.mode = 'in'
      st.modeT = 0
    }
  } else if (st.mode === 'in') {
    const T = st.modeT
    const spark = c01(T / 0.22), u = c01((T - 0.18) / 0.42), e = 1 - Math.pow(1 - u, 2)
    hop = T < 0.6 ? 0.7 : 0.7 * (1 - ease(c01((T - 0.6) / 0.18)))
    U.uTwist.value = -(1 - e) * Math.PI * 7
    U.uPinch.value = 1 - e
    U.uLight.value = 1 - c01((T - 0.3) / 0.3)
    U.uBoost.value = 1 + 3 * (1 - e)
    // The reverse: a ring closes in, a point flares, and he unwinds out of it.
    const close = c01(T / 0.16), fade = c01((T - 0.22) / 0.2)
    lights = {
      ring: [0.7 * close * (1 - c01((T - 0.12) / 0.06)), 2.7 - 2.4 * close],
      core: [Math.min(1, spark * 1.6) * (1 - fade), 0.1 + 0.9 * spark],
      streak: [spark * (1 - fade), 3.2 * spark * (1 - fade)],
    }
    const land = c01((T - 0.78) / 0.25)
    sqY = T < 0.78 ? 1.06 : 1 - 0.14 * Math.sin(land * Math.PI) * (1 - land * 0.4)
    if (T > 1.05) {
      st.mode = 'walk'
      st.modeT = 0
      U.uTwist.value = 0
      U.uPinch.value = 0
      U.uBoost.value = 1
      U.uLight.value = 0
    }
  }
  figure.position.y = hop + jump
  const sq = sqY * squash
  bodyG.scale.set(1 + (1 - sq) * 0.6, sq, 1 + (1 - sq) * 0.6)
  const scale = figure.scale.x
  U.uWarpC.value.set(st.x, (1.7 + hop) * scale, 0)
  // Exactly the vortex's centre, depth included: in front of it, perspective
  // pushed the light off the point he collapsed into.
  const at = U.uWarpC.value.clone()
  core.position.copy(at)
  core.material.opacity = lights.core[0]
  core.scale.setScalar(Math.max(0.01, lights.core[1] * scale))
  streak.position.copy(at)
  streak.material.opacity = lights.streak[0]
  streak.scale.set(Math.max(0.01, lights.streak[1] * scale), 0.22 * scale, 1)
  ring.position.copy(at)
  ring.material.opacity = lights.ring[0]
  ring.scale.setScalar(Math.max(0.01, lights.ring[1] * scale))
  puddle.position.x = st.x
  puddle.scale.setScalar(scale)
  puddle.material.opacity = 0.32 * (1 - U.uPinch.value)
  puddle.material.color.copy(U.uColor.value)

  // Warps, waves, noticing, acts and an open chat get every frame; strolling and idling get 30 fps.
  return { full: st.busy || files.visible || F.browser.visible || F.hole.visible || (st.mode !== 'walk' && st.mode !== 'pause') }
}
