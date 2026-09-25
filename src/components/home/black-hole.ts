import * as THREE from 'three'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js'
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js'
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js'

/**
 * Gargantua, after Interstellar — the hero's easter egg (type "ton"). Every
 * pixel's ray of light is bent by a Schwarzschild black hole on its way through
 * the scene, so the disk behind it shows above and below, a photon ring
 * circles the shadow and the stars smear round it. Units: the Schwarzschild
 * radius is 1 (horizon r = 1, photon sphere 1.5, innermost stable orbit 3).
 * Prototype and tuning panel: ../blackhole next to this repo.
 *
 * It is born on screen. First the hero's own picture is torn into strands
 * and pulled in, whirling (spaghettification); then a flash and a shock ring,
 * then the mass grows from
 * nothing — the stars bend more and more, the shadow opens from a point — and
 * the disk gathers from the outside in, spinning hard until it settles.
 */
const FRAG = /* glsl */ `
precision highp float;
uniform vec2 uRes;
uniform float uTime;
uniform vec3 uCamPos;
uniform mat3 uCamRot;
uniform float uFov;
uniform float uRoll;
uniform vec4 uPlanet;
uniform float uMass;    // 0 → 1: the Schwarzschild radius, as it grows
uniform float uForm;    // 0 → 1: the disk gathering, outside in
uniform float uPhase;   // the disk's turn, integrated (it spins fast while forming)
uniform vec3 uFlash;    // birth: point glow, shock-ring radius (rad), ring glow
varying vec2 vUv;

const float DISK_IN = 2.6, DISK_OUT = 14.0, DOPPLER = 0.25, GAIN = 1.0;
const int STEPS = 320;

float hash(vec3 p) { p = fract(p * 0.3183099 + 0.1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
float noise(vec3 x) {
  vec3 i = floor(x), f = fract(x);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(mix(hash(i), hash(i + vec3(1,0,0)), f.x), mix(hash(i + vec3(0,1,0)), hash(i + vec3(1,1,0)), f.x), f.y),
             mix(mix(hash(i + vec3(0,0,1)), hash(i + vec3(1,0,1)), f.x), mix(hash(i + vec3(0,1,1)), hash(i + vec3(1,1,1)), f.x), f.y), f.z);
}
float fbm(vec3 p) { float v = 0.0, a = 0.5; for (int i = 0; i < 5; i++) { v += a * noise(p); p *= 2.03; a *= 0.5; } return v; }

// The accretion disk where a ray crosses its plane.
vec4 disk(vec3 p, vec3 dir) {
  float r = length(p.xz);
  float edge = smoothstep(DISK_IN, DISK_IN + 0.35, r) * (1.0 - smoothstep(DISK_OUT * 0.55, DISK_OUT, r));
  // Matter arrives from outside: a front sweeping in to the inner edge.
  float front = mix(DISK_OUT * 1.1, DISK_IN - 0.5, uForm);
  edge *= smoothstep(front - 0.6, front + 1.4, r) * uForm;
  if (edge <= 0.0) return vec4(0.0);
  // Keplerian: inner rings turn faster. Sampling round a small circle in angle
  // and finely in radius draws the long filaments.
  float ang = atan(p.z, p.x) + uPhase / (r * sqrt(r));
  vec3 q = vec3(cos(ang) * 2.2, sin(ang) * 2.2, r * 4.5);
  float streak = fbm(q) * 0.75 + fbm(q * vec3(1.0, 1.0, 3.1) + 7.0) * 0.45;
  float dens = edge * clamp(streak * 1.35 - 0.2, 0.0, 1.0);
  float T = pow(DISK_IN / r, 0.9);
  vec3 hot = vec3(1.0, 0.93, 0.8), warm = vec3(1.0, 0.55, 0.18), deep = vec3(0.75, 0.22, 0.05);
  vec3 col = mix(mix(deep, warm, smoothstep(0.15, 0.55, T)), hot, smoothstep(0.55, 1.0, T));
  // Relativistic beaming, mostly off as in the film, and gravitational redshift.
  float beta = sqrt(0.5 * uMass / max(r - uMass, 0.2));
  vec3 v = normalize(vec3(-p.z, 0.0, p.x));
  float D = 1.0 / (inversesqrt(1.0 - beta * beta) * (1.0 - beta * dot(v, -dir)));
  float boost = mix(1.0, pow(D, 3.0), DOPPLER) * sqrt(max(1.0 - uMass / r, 0.0));
  return vec4(col * (0.35 + 2.6 * T * T) * boost * GAIN, clamp(dens * 1.1, 0.0, 1.0));
}

// Round stars: the angle to a jittered point in each cell, so they are not
// streaks on the sphere (the streaks near the hole are the lensing).
vec3 sky(vec3 d) {
  vec3 c = vec3(0.0);
  for (int i = 0; i < 2; i++) {
    float s = i == 0 ? 180.0 : 420.0;
    vec3 cell = floor(d * s);
    float h = hash(cell);
    vec3 cp = normalize(cell + 0.5 + (vec3(hash(cell + 1.3), hash(cell + 2.7), hash(cell + 4.1)) - 0.5) * 0.7);
    float star = step(0.993 - float(i) * 0.004, h) * smoothstep(0.22, 0.0, length(d - cp) * s);
    c += star * mix(vec3(1.0, 0.85, 0.7), vec3(0.7, 0.8, 1.0), hash(cell + 3.1)) * (0.6 + 1.6 * hash(cell + 9.7));
  }
  float band = exp(-pow(d.y * 3.0 + 0.4 * sin(d.x * 2.0), 2.0)) * fbm(d * 6.0);
  return c + band * vec3(0.05, 0.035, 0.03);
}

void main() {
  vec2 uv = (vUv - 0.5) * vec2(uRes.x / uRes.y, 1.0);
  float c = cos(uRoll), s = sin(uRoll);
  uv = mat2(c, -s, s, c) * uv;
  vec3 dir = normalize(uCamRot * vec3(uv * tan(uFov * 0.5) * 2.0, -1.0));
  vec3 pos = uCamPos, vel = dir;
  float h2 = dot(cross(pos, vel), cross(pos, vel));
  vec3 dir0 = dir;

  vec3 col = vec3(0.0);
  float alpha = 0.0;
  bool escaped = false;
  for (int i = 0; i < STEPS; i++) {
    float r2 = dot(pos, pos), r = sqrt(r2);
    if (r < uMass) break;                                    // into the horizon
    if (r > 60.0 && dot(pos, vel) > 0.0) { escaped = true; break; }
    float dt = clamp(0.07 * r, 0.03, 1.5);
    vec3 prev = pos;
    vel += -1.5 * uMass * h2 * pos / (r2 * r2 * r) * dt;    // light bends round the mass
    pos += vel * dt;
    if (prev.y * pos.y < 0.0) {
      vec3 hit = mix(prev, pos, prev.y / (prev.y - pos.y));
      vec4 d = disk(hit, normalize(vel));
      col += (1.0 - alpha) * d.rgb * d.a;
      alpha += (1.0 - alpha) * d.a;
      if (alpha > 0.99) break;
    }
    // a small planet, lensed like everything else
    vec3 seg = pos - prev, oc = prev - uPlanet.xyz;
    float a = dot(seg, seg), b = dot(oc, seg), cc = dot(oc, oc) - uPlanet.w * uPlanet.w, disc = b * b - a * cc;
    if (disc > 0.0) {
      float t = (-b - sqrt(disc)) / a;
      if (t >= 0.0 && t <= 1.0) {
        vec3 n = normalize(prev + seg * t - uPlanet.xyz);
        float lit = max(dot(n, normalize(-uPlanet.xyz)), 0.0);
        col += (1.0 - alpha) * (vec3(0.05, 0.045, 0.04) + vec3(1.0, 0.6, 0.3) * lit * 0.9);
        alpha = 1.0;
        break;
      }
    }
  }
  if (escaped) col += (1.0 - alpha) * sky(normalize(vel));
  // The birth: a point of light at the centre and a shock ring racing out.
  float ang0 = acos(clamp(dot(dir0, normalize(-uCamPos)), -1.0, 1.0));
  col += vec3(1.0, 0.85, 0.65) * (uFlash.x * exp(-ang0 * ang0 * 900.0) + uFlash.x * 0.15 * exp(-ang0 * 25.0));
  col += vec3(1.0, 0.75, 0.5) * uFlash.z * exp(-pow((ang0 - uFlash.y) / 0.012, 2.0));
  col *= 1.0 - 0.35 * dot(vUv - 0.5, vUv - 0.5) * 2.0;
  gl_FragColor = vec4(col, 1.0);
}
`

// The picture that was on screen, drawn in display space (after tone mapping)
// with the page's duotone, so the hand-over from the DOM is seamless — then
// stretched, torn and wound into the centre.
const PULL = /* glsl */ `
uniform sampler2D tDiffuse;
uniform sampler2D uPic;
uniform float uSuck, uAspect, uPicAspect, uScale;
uniform vec2 uFocus;
varying vec2 vUv;
float h1(float n) { return fract(sin(n) * 43758.5453); }
float vnoise(float x) { float i = floor(x), f = fract(x); f = f * f * (3.0 - 2.0 * f); return mix(h1(i), h1(i + 1.0), f); }
// object-fit: cover, at the picture's object-position and its drift's scale
vec4 pic(vec2 s) {
  s = (s - 0.5) / uScale + 0.5;
  vec2 win = uAspect > uPicAspect ? vec2(1.0, uPicAspect / uAspect) : vec2(uAspect / uPicAspect, 1.0);
  vec2 uv = (1.0 - win) * vec2(uFocus.x, 1.0 - uFocus.y) + s * win;
  float inside = step(0.0, s.x) * step(s.x, 1.0) * step(0.0, s.y) * step(s.y, 1.0);
  vec3 c = texture2D(uPic, uv).rgb;
  float g = clamp((dot(c, vec3(0.2126, 0.7152, 0.0722)) - 0.5) * 1.1 + 0.5, 0.0, 1.0);
  return vec4(g, g, 1.0, inside);                          // grayscale, screened with #0000ff
}
void main() {
  vec4 base = texture2D(tDiffuse, vUv);
  float p = uSuck;
  vec2 d = (vUv - 0.5) * vec2(uAspect, 1.0);
  float r = length(d), a = atan(d.y, d.x);
  // Torn into strands: each thin wedge of angle falls at its own pace.
  float strand = vnoise(a * 40.0 + 3.0) * 0.65 + vnoise(a * 110.0 + 9.0) * 0.35;
  float fall = p * p * (0.9 + 1.3 * strand) * (0.35 + 0.18 / (r + 0.1)); // faster near the centre: stretched
  float wind = p * p * 2.8 / (r + 0.1);                                   // inner parts wind faster: spirals
  vec4 acc = vec4(0.0);
  for (int k = 0; k < 8; k++) {
    float tt = float(k) / 7.0;                             // smeared along the flow: streaks
    float rs = r + fall + tt * 0.12 * p;
    float as_ = a - wind - tt * 0.25 * p / (r + 0.2);
    vec2 s = vec2(cos(as_), sin(as_)) * rs / vec2(uAspect, 1.0) + 0.5;
    acc += pic(s);
  }
  acc /= 8.0;
  // heated as it falls, swallowed at the centre, gone by the birth
  acc.rgb = mix(acc.rgb, vec3(1.0, 0.86, 0.7), clamp(p * exp(-r * 7.0) * 1.6, 0.0, 1.0));
  acc.a *= smoothstep(0.0, 0.03 + 0.12 * p * p, r) * (1.0 - smoothstep(0.82, 1.0, p));
  gl_FragColor = vec4(mix(base.rgb, acc.rgb, acc.a), 1.0);
}
`

export interface Picture {
  src: string
  /** CSS object-position, as fractions. */
  focus: [number, number]
  /** The drift's current scale (Ken Burns), so the hand-over does not jump. */
  scale: number
}

export function createBlackHole(
  canvas: HTMLCanvasElement,
  {
    reducedMotion,
    picture,
    onReady,
    onBirth,
  }: { reducedMotion: boolean; picture: Picture | null; onReady?: () => void; onBirth?: () => void },
) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance' })
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 1.05

  const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 1000)
  const uniforms = {
    uRes: { value: new THREE.Vector2() },
    uTime: { value: 0 },
    uCamPos: { value: new THREE.Vector3() },
    uCamRot: { value: new THREE.Matrix3() },
    uFov: { value: THREE.MathUtils.degToRad(camera.fov) },
    uRoll: { value: -0.18 },
    uPlanet: { value: new THREE.Vector4() },
    uMass: { value: 1 },
    uForm: { value: 1 },
    uPhase: { value: 0 },
    uFlash: { value: new THREE.Vector3() },
  }
  const scene = new THREE.Scene()
  scene.add(
    new THREE.Mesh(
      new THREE.PlaneGeometry(2, 2),
      new THREE.ShaderMaterial({
        uniforms,
        fragmentShader: FRAG,
        vertexShader: 'varying vec2 vUv; void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }',
        depthTest: false,
      }),
    ),
  )

  // HDR frame → film bloom → tone-mapped.
  const composer = new EffectComposer(renderer, new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType }))
  composer.addPass(new RenderPass(scene, new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1)))
  const bloom = new UnrealBloomPass(new THREE.Vector2(1, 1), 0.85, 0.5, 0.75)
  composer.addPass(bloom)
  composer.addPass(new OutputPass())
  const pull = new ShaderPass({
    uniforms: {
      tDiffuse: { value: null },
      uPic: { value: null },
      uSuck: { value: 0 },
      uAspect: { value: 1 },
      uPicAspect: { value: 1 },
      uScale: { value: picture?.scale ?? 1 },
      uFocus: { value: new THREE.Vector2(...(picture?.focus ?? [0.5, 0.5])) },
    },
    vertexShader: 'varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: PULL,
  })
  pull.enabled = false
  composer.addPass(pull)

  function resize() {
    const w = canvas.clientWidth, h = canvas.clientHeight
    if (!w || !h) return
    // ponytail: capped at 1.25× — the march is per pixel; lift it if a 2× screen looks soft.
    const pr = Math.min(devicePixelRatio, 1.25)
    renderer.setPixelRatio(pr)
    renderer.setSize(w, h, false)
    composer.setPixelRatio(pr)
    composer.setSize(w, h)
    camera.aspect = w / h
    camera.updateProjectionMatrix()
    uniforms.uRes.value.set(w * pr, h * pr)
    pull.uniforms.uAspect.value = w / h
  }

  const clamp01 = (x: number) => Math.min(1, Math.max(0, x))
  const smooth = (x: number) => (x = clamp01(x)) * x * x * (x * (x * 6 - 15) + 10)
  let last = 0
  // The birth, in seconds from the first frame (reduced motion starts at the end).
  const BIRTH = 1.5
  let born = false
  function frame(t: number) {
    uniforms.uTime.value = t
    const since = t - BIRTH
    pull.uniforms.uSuck.value = clamp01(t / (BIRTH - 0.05))
    pull.enabled = !!pull.uniforms.uPic.value && since < 0.1
    if (since >= 0 && !born) {
      born = true
      onBirth?.()
    }
    const mass = smooth(since / 3)
    const form = smooth((since - 0.8) / 4.2)
    uniforms.uMass.value = Math.max(mass, 1e-4)
    uniforms.uForm.value = form
    // spins hard while it gathers, then settles to its own pace
    uniforms.uPhase.value += (t - last) * 0.9 * (1 + 5 * (1 - form))
    last = t
    const glow = since < 0 ? 6 * Math.pow(clamp01(1 + since / 0.5), 3) : 18 * Math.exp(-since * 3.2)
    uniforms.uFlash.value.set(glow, since > 0 ? since * 0.95 : 0, since > 0 ? 5 * Math.exp(-since * 1.6) : 0)
    bloom.strength = 0.85 + Math.min(2, glow * 0.12)

    // Comes in from far off as it forms, then drifts slowly round and up and back.
    const arrive = smooth(t / 7)
    const dist = 46 - 18 * arrive + 2.5 * Math.sin(t * 0.05)
    const az = 0.3 * Math.sin(t * 0.03) - 0.3 * (1 - arrive)
    const el = 0.05 + 0.05 * Math.sin(t * 0.045 + 1)
    // The camera shakes: a rumble building as the picture is pulled in, a
    // hard jolt at the birth, dying away as the mass settles.
    const shake = since < 0 ? 0.35 * clamp01(1 + since / 0.8) ** 2 : 1.6 * Math.exp(-since * 2.2)
    const jx = Math.sin(t * 47) + 0.5 * Math.sin(t * 83 + 2), jy = Math.sin(t * 59 + 1) + 0.5 * Math.sin(t * 97)
    camera.position.set(
      Math.sin(az) * Math.cos(el) * dist + jx * shake * 0.5,
      Math.sin(el) * dist + jy * shake * 0.5,
      Math.cos(az) * Math.cos(el) * dist,
    )
    uniforms.uRoll.value = -0.18 + Math.sin(t * 71) * shake * 0.02
    camera.lookAt(0, 0, 0)
    camera.updateMatrixWorld()
    uniforms.uCamPos.value.copy(camera.position)
    uniforms.uCamRot.value.setFromMatrix4(camera.matrixWorld)
    const a = t * 0.015 + 2.36
    uniforms.uPlanet.value.set(Math.cos(a) * 11.3, 1.4, Math.sin(a) * 11.3, 0.35)
    composer.render()
  }

  // Draws only while on screen and the tab is visible; reduced motion gets one still frame.
  let visible = true
  const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting))
  io.observe(canvas)
  const ro = new ResizeObserver(() => {
    resize()
    if (reducedMotion) frame(12)
  })
  ro.observe(canvas)
  resize()
  let gone = false
  const start = () => {
    if (gone) return
    if (reducedMotion) {
      frame(12)
      onReady?.()
      return
    }
    let t0 = -1
    renderer.setAnimationLoop((now) => {
      const first = t0 < 0
      if (first) t0 = now
      if (visible && !document.hidden) frame((now - t0) / 1000)
      if (first) onReady?.()
    })
  }
  // The picture is loaded before the first frame, so the hand-over shows it.
  let texture: THREE.Texture | null = null
  if (picture && !reducedMotion)
    new THREE.TextureLoader().load(
      picture.src,
      (tex) => {
        texture = tex
        pull.uniforms.uPic.value = tex
        pull.uniforms.uPicAspect.value = tex.image.width / tex.image.height
        start()
      },
      undefined,
      start,
    )
  else start()

  return () => {
    gone = true
    texture?.dispose()
    renderer.setAnimationLoop(null)
    ro.disconnect()
    io.disconnect()
    composer.dispose()
    renderer.dispose()
  }
}
