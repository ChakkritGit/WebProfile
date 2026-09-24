import * as THREE from 'three'
import type { Figure, Uniforms } from './figure'

/* How Mr. Worldwide moves, one frame at a time. Ported from the prototype's
   frame() (docs/superpowers/prototypes/mr-worldwide/index.html), without the
   rendering, and with the site's limits: he turns before the quick-contact dock,
   stands still on phones, for reduced motion and while the chat is open, and
   warps on his own now and then. */

const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z)

export type Mode = 'walk' | 'pause' | 'wave' | 'notice' | 'act' | 'out' | 'in'
export type ActName = 'hips' | 'think' | 'talk' | 'point'

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
    reduced: false,
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
}

/** Advance one frame. `full` is false while he only idles or cruises (the loop then draws at 30 fps). */
export function step(
  F: Figure,
  U: Uniforms,
  st: State,
  dt: number,
  t: number,
  world: { halfW: number; minX: number; maxX: number },
): { full: boolean } {
  const { figure, turn, bodyG, torso, globe, face, eyes, brows, mouth, mouthHole, hands, shoes, limbs, puddle, core, streak, ring } = F
  const canWalk = !(st.reduced || st.mobile || st.busy)
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
      // An idle fidget: half the time he just stands and looks about; otherwise
      // hands on hips for a moment (the reference's own stance).
      if (Math.random() < 0.5) {
        st.mode = 'pause'
        st.modeT = 0
      } else {
        st.act = 'hips'
        st.actUntil = t + 2.6
      }
    }
  } else if (st.mode === 'pause' && st.modeT > 2.4) {
    st.mode = 'walk'
    st.modeT = 0
  }
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
  if (st.act) st.lastAct = st.act
  st.actW += ((st.act ? 1 : 0) - st.actW) * Math.min(1, dt * 5)
  const aw = ease(c01(st.actW)), act = st.lastAct
  st.x += st.dir * st.v * dt * 1.15
  st.ph += st.v * dt * 6.2 // cadence follows speed: no sliding feet
  const s = st.v

  // --- facing: a damped spring, so the turn overshoots a touch and settles
  const walking = st.mode === 'walk' && canWalk
  const facingTarget = walking ? st.dir * 1.25 : 0
  st.faceV += (38 * (facingTarget - st.face) - 8.5 * st.faceV) * dt
  st.face += st.faceV * dt
  turn.rotation.y = st.face
  figure.position.x = st.x

  // --- the body: dip on each footfall, weight over the standing leg, lean in
  const ph = st.ph
  const breathe = Math.sin(t * 1.9) * 0.018 * (1 - s)
  const bob = -0.075 * s * (0.5 + 0.5 * Math.cos(2 * ph))
  bodyG.position.set(0.05 * s * Math.sin(ph), bob, 0)
  torso.position.y = 2.0 + breathe
  torso.scale.setScalar(1 + breathe * 0.4)
  torso.rotation.set(0.1 * s, 0.09 * s * Math.sin(ph), 0.05 * s * Math.sin(ph))
  globe.rotation.y += dt * (0.12 + 0.35 * s)
  // The face slides round the globe: toward the way he walks, or toward you.
  const cur = st.cursor && t - st.cursorAt < 1.2 ? st.cursor : null
  const faceY = walking ? -st.dir * 0.55 * Math.min(1, s * 3) : cur ? THREE.MathUtils.clamp((cur.x - st.x) * 0.09, -0.5, 0.5) : 0
  const faceX = !walking && cur ? THREE.MathUtils.clamp(-(cur.y - 2.0) * 0.07, -0.3, 0.25) : act === 'think' ? -0.12 * aw : 0
  face.rotation.y += (faceY - face.rotation.y) * Math.min(1, dt * 5)
  face.rotation.x += (faceX - face.rotation.x) * Math.min(1, dt * 5)
  if (st.mode === 'pause') torso.rotation.z = Math.sin(st.modeT * 1.6) * 0.04
  if (st.mode === 'wave') {
    const w = waveState(st.modeT)
    torso.rotation.z = 0.09 * w.k + 0.02 * w.amp * Math.sin(st.modeT * 11 - 1.2) // leans away, swayed by the arm
    torso.rotation.x = -0.05 * w.k // and back a little
    bodyG.position.y += 0.05 * Math.sin(c01(st.modeT / 0.3) * Math.PI) // a small bounce as it starts
  }

  // --- legs: heel strike in front, toe-off behind, knee lifts through the swing
  for (const side of [-1, 1]) {
    const phi = ph + (side > 0 ? Math.PI : 0)
    const fz = 0.42 * s * Math.sin(phi)
    const swing = Math.max(0, Math.cos(phi))
    const lift = 0.22 * s * Math.pow(swing, 1.5)
    const hip = V(0.27 * side, 1.18, 0)
    const foot = V(0.33 * side, 0.1 + lift - bob, fz)
    // The shoe first: it rocks on the heel as it lands (toe up) and on the toe
    // as it pushes off (heel up), so whichever end is on the floor stays there.
    const shoe = shoes[side < 0 ? 0 : 1]
    let pitch = -0.42 * s * Math.sin(phi) * (1 - swing * 0.4)
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

  // --- arms: against the legs, a beat behind them; wrists a beat behind that
  for (const side of [-1, 1]) {
    const phi = ph + (side > 0 ? 0 : Math.PI) - 0.35
    const shoulder = V(0.88 * side, 1.87, 0)
    let hand = V(
      (1.22 + 0.05 * Math.abs(Math.sin(phi))) * side,
      1.23 + 0.12 * s * Math.max(0, Math.sin(phi)),
      0.38 * s * Math.sin(phi) + 0.05 + 0.03 * Math.sin(t * 1.3 + side) * (1 - s),
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
      const swing = 0.42 * w.amp * Math.sin(T * 11)
      const E = V(1.42, 2.25 - w.drop, 0.22)
      const H = E.clone().add(V(Math.sin(swing) * 0.62, Math.cos(swing) * 0.62, 0.12))
      elbow = elbow.lerp(E, w.k)
      hand = hand.lerp(H, w.k)
      const wrist = 0.35 * w.amp * Math.sin(T * 11 - 0.7)
      up = V(Math.sin(swing + wrist), Math.cos(swing + wrist), 0.15).normalize()
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
      }
    }
    if (pose) {
      elbow = elbow.lerp(pose.E, aw)
      hand = hand.lerp(pose.H, aw)
    }
    F.hose(limbs[side < 0 ? 0 : 1], [shoulder, elbow, hand], 0.07)
    const g = hands[side < 0 ? 0 : 1]
    g.position.copy(hand)
    // Two whole orientations, blended by rotation (slerp): hanging — palm to the
    // thigh, thumb forward, wrist trailing the swing — and waving, palm to you.
    const qRest = handFrame(restDir).multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(0.35 * s * Math.sin(phi - 0.5), -side * 1.25, 0, 'YXZ')))
    g.quaternion.copy(up ? qRest.slerp(handFrame(up), k) : qRest)
    if (pose) g.quaternion.slerp(handFrame(pose.dir.clone().normalize()), aw)
    const open = wave ? waveState(st.modeT).k : 0
    // At rest a hand is open and loose: fingers together and gently curved, the
    // little finger a touch more, moving a little with the swing.
    const rest = 0.22 + 0.06 * Math.sin(phi) * s + 0.03 * Math.sin(t * 0.9 + side)
    const indexI = side > 0 ? 0 : 3
    const { fingers, thumb } = g.userData as { fingers: THREE.Group[]; thumb: THREE.Group }
    fingers.forEach((f, i) => {
      let x = THREE.MathUtils.lerp(rest + (side > 0 ? 3 - i : i) * 0.05, 0.02, open)
      if (pose) x = THREE.MathUtils.lerp(x, pose.index && i === indexI ? 0 : pose.curl + (i === indexI ? -0.15 : 0.05 * i), aw)
      f.rotation.x = x
      f.rotation.z = THREE.MathUtils.lerp((i - 1.5) * 0.04, (i - 1.5) * 0.2, open)
    })
    thumb.rotation.x = THREE.MathUtils.lerp(THREE.MathUtils.lerp(0.25, 0, open), pose ? (pose.curl > 0.9 ? 0.9 : 0.2) : 0.25, pose ? aw : 0)
    thumb.rotation.z = -side * THREE.MathUtils.lerp(0.45, 1.0, open)
  }

  // --- eyes: saccades, blinks at random, brows that move with the mood
  st.nextLook -= dt
  if (st.nextLook < 0) {
    st.nextLook = 0.8 + Math.random() * 2.2
    st.lookTo.set(st.mode === 'walk' ? 0.03 * st.dir + (Math.random() - 0.5) * 0.04 : (Math.random() - 0.5) * 0.09, (Math.random() - 0.5) * 0.06, 0)
    if (st.mode === 'wave') st.lookTo.set(0, 0, 0)
  }
  if (!walking && cur) st.lookTo.set(THREE.MathUtils.clamp((cur.x - st.x) * 0.02, -0.07, 0.07), THREE.MathUtils.clamp((cur.y - 2.0) * 0.025, -0.05, 0.06), 0)
  if (act === 'think' && aw > 0.5) st.lookTo.set(-0.06, 0.055, 0)
  if (act === 'point' && aw > 0.5) st.lookTo.set(0.06, 0.05, 0)
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
    lid.rotation.x = -1.25 + shut * 1.6
    glint.visible = shut < 0.6
  })
  const talking = act === 'talk' ? aw : 0
  const syll = talking * Math.max(0, Math.sin(t * 13) * 0.6 + Math.sin(t * 7.3) * 0.4) // uneven, like speech
  const raise =
    st.mode === 'wave' ? 0.07
    : st.mode === 'notice' ? 0.06 * ease(c01(st.modeT / 0.25))
    : st.mode === 'pause' ? 0.03 + Math.sin(st.modeT * 2) * 0.015
    : talking * 0.02 * Math.sin(t * 4.1)
  brows.forEach(({ mesh, s: sx }) => {
    const r = raise + (act === 'think' ? aw * (sx > 0 ? 0.07 : -0.02) : 0) // one brow up: considering
    mesh.position.copy(F.onSphere(0.26 * sx, 0.39 + r, 0.03))
    mesh.rotation.z = Math.PI / 2 - sx * (0.12 + r * 1.5)
  })
  mouthHole.scale.set(0.9, Math.max(0.001, syll * 0.8), 0.25)
  mouthHole.visible = syll > 0.02
  const smile = st.mode === 'wave' ? 0.16 : act === 'think' ? THREE.MathUtils.lerp(0.1, 0.02, aw) : 0.1 - syll * 0.06
  // Rebuilt only when the smile changes shape; it holds still most of the time.
  if (Math.abs(smile - (mouth.userData.smile ?? -1)) > 0.002) {
    mouth.userData.smile = smile
    mouth.geometry.dispose()
    mouth.geometry = new THREE.TubeGeometry(F.mouthCurve(0.2 + (smile - 0.1) * 0.5, smile), 16, 0.024, 6)
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
  figure.position.y = hop
  bodyG.scale.set(1 + (1 - sqY) * 0.6, sqY, 1 + (1 - sqY) * 0.6)
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
  return { full: st.busy || (st.mode !== 'walk' && st.mode !== 'pause') }
}
