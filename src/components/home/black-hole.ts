import * as THREE from 'three'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js'
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js'
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js'
import { createDebris, type Shot } from './black-hole-debris'

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
 *
 * Then a camera tour: a while at the wide angle, then a run of close shots in
 * the disk among its dust and rocks (black-hole-debris.ts), dissolving from
 * one to the next, and back out.
 */
const FRAG = /* glsl */ `
precision highp float;
uniform vec2 uRes;
uniform float uTime;
uniform vec3 uCamPos;
uniform mat3 uCamRot;
uniform float uFov;
uniform vec4 uPlanet;
uniform float uMass;    // 0 → 1: the Schwarzschild radius, as it grows
uniform float uForm;    // 0 → 1: the disk gathering, outside in
uniform float uPhase;   // the disk's turn, integrated (it spins fast while forming)
uniform vec3 uFlash;    // birth: point glow, shock-ring radius (rad), ring glow
uniform float uNear;    // 1 on the close shots: the dust round the camera is marched (VOL, at half size)
uniform sampler2D uNearTex;
varying vec2 vUv;

const float DISK_IN = 2.6, DISK_OUT = 14.0, DOPPLER = 0.25, GAIN = 1.0, DUST = 1.0;
const int STEPS = 320;

float hash(vec3 p) { p = fract(p * 0.3183099 + 0.1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
float noise(vec3 x) {
  vec3 i = floor(x), f = fract(x);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(mix(hash(i), hash(i + vec3(1,0,0)), f.x), mix(hash(i + vec3(0,1,0)), hash(i + vec3(1,1,0)), f.x), f.y),
             mix(mix(hash(i + vec3(0,0,1)), hash(i + vec3(1,0,1)), f.x), mix(hash(i + vec3(0,1,1)), hash(i + vec3(1,1,1)), f.x), f.y), f.z);
}
float fbm(vec3 p) { float v = 0.0, a = 0.5; for (int i = 0; i < 5; i++) { v += a * noise(p); p *= 2.03; a *= 0.5; } return v; }

// How much of the disk has gathered at r: matter arrives from outside, a front
// sweeping in to the inner edge.
float formed(float r) { float front = mix(DISK_OUT * 1.1, DISK_IN - 0.5, uForm); return smoothstep(front - 0.6, front + 1.4, r) * uForm; }

// The accretion disk where a ray crosses its plane.
vec4 disk(vec3 p, vec3 dir) {
  float r = length(p.xz);
  float edge = smoothstep(DISK_IN, DISK_IN + 0.35, r) * (1.0 - smoothstep(DISK_OUT * 0.55, DISK_OUT, r)) * formed(r);
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

// --- the dust the disk sits in, close to the camera: a thick, billowing layer of
// fine gas, lit from within by the disk, that turns with it (and so shears into
// streaks). Marched straight — over a few units the light barely bends — up to
// the shadow, and faded out with distance, so only the near field carries it.
vec2 rot2(vec2 v, float a) { float c = cos(a), s = sin(a); return mat2(c, -s, s, c) * v; }
float fbm3(vec3 p) { return 0.57 * noise(p) + 0.29 * noise(p * 2.03) + 0.14 * noise(p * 4.1); } // (cheaper: it runs per step)
vec4 dustVol(vec3 ro, vec3 rd) {
  float tMax = 8.0;
  float b = dot(ro, rd), h = b * b - (dot(ro, ro) - 7.3 * uMass * uMass);
  if (h > 0.0) { float t0 = -b - sqrt(h); if (t0 > 0.0) tMax = min(tMax, t0); }
  vec3 emit = vec3(0.0);
  float T = 1.0, dt = tMax / 28.0, j = hash(vec3(gl_FragCoord.xy, fract(uTime) * 61.0));
  for (int i = 0; i < 28; i++) {
    float t = (float(i) + j) * dt;
    vec3 p = ro + rd * t;
    float r = length(p.xz), H = 0.1 + 0.045 * r;
    float layer = exp(-p.y * p.y / (H * H)) * smoothstep(2.9, 4.2, r) * (1.0 - smoothstep(10.0, 15.0, r)) * smoothstep(8.0, 4.5, t) * formed(r);
    if (layer < 0.01) continue;
    vec2 xz = rot2(p.xz, uPhase / (r * sqrt(r)));
    vec3 q = vec3(xz.x, p.y * 2.6, xz.y);
    // big billows, then grain
    float n = fbm3(q * 0.8 + 3.0), fine = noise(q * 8.0) * 0.6 + noise(q * 21.0) * 0.4;
    float dens = layer * pow(max(0.0, n * 1.6 - 0.62 + (fine - 0.5) * 0.5), 1.4) * 5.0 * DUST;
    if (dens <= 0.001) continue;
    // lit from the hot inner disk: a second look a step toward the light says how
    // much cloud is in the way, so billows get bright edges and dark hearts
    vec3 L = normalize(vec3(-p.x, -p.y * 2.0, -p.z));
    vec3 q2 = q + vec3(rot2(L.xz, uPhase / (r * sqrt(r))), L.y * 2.6).xzy * 0.22;
    float occl = max(0.0, (0.67 * noise(q2 * 0.8 + 3.0) + 0.33 * noise(q2 * 1.62 + 3.0)) * 1.6 - 0.62);
    float temp = pow(2.6 / r, 0.9), lit = (0.25 + 0.75 * exp(-abs(p.y) / H)) * exp(-occl * 3.5);
    // amber in the body of the cloud, gold toward the hot inside
    vec3 ecol = mix(vec3(0.95, 0.38, 0.07), vec3(1.0, 0.72, 0.36), smoothstep(0.25, 0.95, temp)) * (0.3 + 3.2 * temp * temp);
    float a = 1.0 - exp(-dens * dt * 2.2);
    emit += T * a * ecol * (0.08 + lit); // a little glow even in the shade
    T *= exp(-dens * dt * 2.6); // and it hides what is behind: dark lanes against the glow
    if (T < 0.02) break;
  }
  return vec4(emit, T);
}

void main() {
  vec2 uv = (vUv - 0.5) * vec2(uRes.x / uRes.y, 1.0); // (the camera itself rolls, so the debris lines up)
  vec3 dir = normalize(uCamRot * vec3(uv * tan(uFov * 0.5) * 2.0, -1.0));
  vec3 pos = uCamPos, vel = dir;
  float h2 = dot(cross(pos, vel), cross(pos, vel));
  vec3 dir0 = dir;
  vec4 near = uNear > 0.0 ? texture2D(uNearTex, vUv) : vec4(0.0, 0.0, 0.0, 1.0);

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
  col = near.rgb + near.a * col;
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
uniform float uT, uBirth, uAspect, uPicAspect, uScale;
uniform vec2 uFocus;
varying vec2 vUv;
float h1(float n) { return fract(sin(n) * 43758.5453); }
// noise round the circle in n cells, so there is no seam where the angle wraps
float pnoise(float a, float n) {
  float x = (a / 6.2831853 + 0.5) * n, i = floor(x), f = fract(x);
  f = f * f * (3.0 - 2.0 * f);
  return mix(h1(mod(i, n)), h1(mod(i + 1.0, n)), f);
}
// object-fit: cover, at the picture's object-position and its drift's scale
vec4 pic(vec2 s) {
  s = (s - 0.5) / uScale + 0.5;
  vec2 win = uAspect > uPicAspect ? vec2(1.0, uPicAspect / uAspect) : vec2(uAspect / uPicAspect, 1.0);
  vec2 uv = (1.0 - win) * vec2(uFocus.x, 1.0 - uFocus.y) + s * win;
  // soft edges, so the picture's border falling in is not a hard line across the screen
  vec2 e = smoothstep(0.0, 0.04, s) * smoothstep(0.0, 0.04, 1.0 - s);
  float inside = e.x * e.y;
  vec3 c = texture2D(uPic, uv).rgb;
  float g = clamp((dot(c, vec3(0.2126, 0.7152, 0.0722)) - 0.5) * 1.1 + 0.5, 0.0, 1.0);
  return vec4(g, g, 1.0, inside);                          // grayscale, screened with #0000ff
}
// Radial free fall from rest: material starting at r0 is at
// r0 (1 - tau^2)^(2/3) after time t, tau = t / T(r0), with the fall time
// T = k r0^1.5 (Kepler) — so it leaves slowly, speeds up, and the inside goes
// first. For a pixel at r, find by bisection the r0 whose material is there.
float fallenFrom(float r, float t, float k) {
  float lo = max(r, pow(t / k, 0.6667)), hi = lo + 2.5;
  for (int i = 0; i < 13; i++) {
    float mid = 0.5 * (lo + hi), tau = t / (k * pow(mid, 1.5));
    float at = mid * pow(max(1.0 - tau * tau, 0.0), 0.6667);
    if (at < r) lo = mid; else hi = mid;
  }
  return 0.5 * (lo + hi);
}
void main() {
  vec4 base = texture2D(tDiffuse, vUv);
  vec2 d = (vUv - 0.5) * vec2(uAspect, 1.0);
  float r = max(length(d), 1e-3), a = atan(d.y, d.x);
  // The mass is forming, so its pull switches on gradually: time runs as t²/B.
  float t = uT * uT / uBirth;
  // Clumps: each thin wedge falls at its own pace, which tears the picture into strands.
  float k = uBirth * (0.8 + 0.45 * (pnoise(a, 36.0) * 0.7 + pnoise(a, 96.0) * 0.3));
  // Each wavelength bends a little differently (dispersion), more the deeper
  // it falls, so the strands' edges split into a rainbow.
  float p = uT / uBirth;
  vec3 col = vec3(0.0), cover = vec3(0.0), wsum = vec3(0.0);
  for (int w = 0; w < 5; w++) {
    float x = (float(w) + 0.5) / 5.0;
    vec3 hue = clamp(vec3(abs(x * 6.0 - 3.0) - 1.0, 2.0 - abs(x * 6.0 - 2.0), 2.0 - abs(x * 6.0 - 4.0)), 0.0, 1.0);
    float disp = (x - 0.5) * 0.65 * p;
    for (int j = 0; j < 3; j++) {
      float tj = t * (1.0 - 0.06 * float(j));               // a little earlier on the path: motion blur
      float r0 = fallenFrom(r, tj, k * (1.0 + disp));
      float ratio = r0 / r;
      // A little angular momentum, conserved: it winds up as it closes in.
      float a0 = a - min(0.22 * (pow(ratio, 1.5) - 1.0), 40.0) + disp * 0.9;
      vec4 c = pic(vec2(cos(a0), sin(a0)) * r0 / vec2(uAspect, 1.0) + 0.5);
      // Sinking: the deeper into the well, the darker — the middle caves in
      // first — and only the very last of it, crushed, glows hot.
      float depth = log(ratio);
      c.rgb *= 1.0 - 0.8 * smoothstep(0.05, 1.3, depth);
      c.rgb += vec3(1.0, 0.7, 0.45) * smoothstep(1.6, 2.6, depth) * 0.9;
      c.a *= 1.0 - smoothstep(2.3, 3.1, depth);             // and then it is gone
      col += hue * c.rgb * c.a;
      cover += hue * c.a;
      wsum += hue;
    }
  }
  col /= wsum;
  cover /= wsum;
  // where the colours part, let them show: saturate the fringes
  float grey = dot(col, vec3(0.3333));
  col = max(mix(vec3(grey), col, 1.0 + 1.4 * length(cover - dot(cover, vec3(0.3333))) * 4.0), 0.0);
  float fade = smoothstep(0.0, 0.025, r) * (1.0 - smoothstep(0.9, 1.0, p));
  gl_FragColor = vec4(base.rgb * (1.0 - cover * fade) + col * fade, 1.0);
}
`

// The near dust on its own (see dustVol): the shared uniforms and functions, and
// a main that marches it for each pixel's straight ray.
const VOL =
  FRAG.slice(0, FRAG.indexOf('\nvoid main() {')) +
  `
void main() {
  vec2 uv = (vUv - 0.5) * vec2(uRes.x / uRes.y, 1.0);
  gl_FragColor = dustVol(uCamPos, normalize(uCamRot * vec3(uv * tan(uFov * 0.5) * 2.0, -1.0)));
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

  const camera = new THREE.PerspectiveCamera(38, 1, 0.02, 1000) // near, for the debris close up
  const uniforms = {
    uRes: { value: new THREE.Vector2() },
    uTime: { value: 0 },
    uCamPos: { value: new THREE.Vector3() },
    uCamRot: { value: new THREE.Matrix3() },
    uFov: { value: THREE.MathUtils.degToRad(camera.fov) },
    uPlanet: { value: new THREE.Vector4() },
    uMass: { value: 1 },
    uForm: { value: 1 },
    uPhase: { value: 0 },
    uFlash: { value: new THREE.Vector3() },
    uNear: { value: 0 },
    uNearTex: { value: null as THREE.Texture | null },
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
        depthWrite: false,
      }),
    ),
  )
  const debris = createDebris(uniforms)
  // The dust round the camera, marched at half size — it is soft, and costs as
  // much as the rest of the frame at full — then laid over it by the main pass.
  const nearRT = new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType })
  uniforms.uNearTex.value = nearRT.texture
  const volScene = new THREE.Scene().add(
    new THREE.Mesh(
      new THREE.PlaneGeometry(2, 2),
      new THREE.ShaderMaterial({
        uniforms,
        fragmentShader: VOL,
        vertexShader: 'varying vec2 vUv; void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }',
        depthTest: false,
        depthWrite: false,
      }),
    ),
  )

  // HDR frame → film bloom → tone-mapped.
  const composer = new EffectComposer(renderer, new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType }))
  composer.addPass(new RenderPass(scene, new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1)))
  const debrisPass = new RenderPass(debris.scene, camera)
  debrisPass.clear = false // drawn over the lensed frame
  debrisPass.clearDepth = true
  composer.addPass(debrisPass)
  const bloom = new UnrealBloomPass(new THREE.Vector2(1, 1), 0.85, 0.5, 0.75)
  composer.addPass(bloom)
  composer.addPass(new OutputPass())
  const pull = new ShaderPass({
    uniforms: {
      tDiffuse: { value: null },
      uPic: { value: null },
      uT: { value: 0 },
      uBirth: { value: 0 },
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
    debris.setPx((h * pr) / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2))))
    nearRT.setSize(Math.ceil((w * pr) / 2), Math.ceil((h * pr) / 2))
    const size = renderer.getDrawingBufferSize(new THREE.Vector2())
    still.tex?.dispose()
    still.tex = new THREE.FramebufferTexture(size.x, size.y)
    overlay.material.uniforms.map.value = still.tex
  }

  // The dissolve between camera angles: the old shot's last frame, kept in a
  // texture, fading off over the new one.
  const still: { tex: THREE.FramebufferTexture | null } = { tex: null }
  const overlay = new THREE.Mesh(
    new THREE.PlaneGeometry(2, 2),
    new THREE.ShaderMaterial({
      uniforms: { map: { value: null as THREE.Texture | null }, uOp: { value: 0 } },
      vertexShader: 'varying vec2 vUv; void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }',
      fragmentShader: 'uniform sampler2D map; uniform float uOp; varying vec2 vUv; void main() { gl_FragColor = vec4(texture2D(map, vUv).rgb, uOp); }',
      transparent: true,
      depthTest: false,
      depthWrite: false,
    }),
  )
  const overlayScene = new THREE.Scene().add(overlay), overlayCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1)

  // --- The tour. After the birth, a good while at the home angle; then a run of
  // 3–5 random close shots in the disk, each starting a little back and easing
  // in the whole time it's up, one dissolving into the next; then home again.
  const FIRST = 16, WAIT = 20, HOLD = 10, FADE = 1.6, SPIN = 0.9, ROLL = -0.18
  type TourShot = Shot & { backR: number; backY: number; look: 'flow' | 'hole' | 'down'; ahead: number; off: number; roll: number }
  const tour = { close: false, at: FIRST - WAIT, left: 0, shot: null as TourShot | null, cut: false, fadeAt: -99 }
  const rnd = (a: number, b: number) => a + Math.random() * (b - a)
  const kep = (r: number) => SPIN / (r * Math.sqrt(r)) // the disk's turn rate at r
  function makeShot(prev: TourShot | null): TourShot {
    const kinds = (['skim', 'ring', 'down'] as const).filter((k) => k !== prev?.kind)
    const kind = kinds[Math.floor(Math.random() * kinds.length)], a0 = rnd(0, Math.PI * 2)
    const base = { kind, a0, ahead: 1, off: 0 }
    if (kind === 'skim') {
      // sinks down into the dust just over the disk, going with it but slower, so it overtakes you
      const r = rnd(5.2, 8.5), y = rnd(0.16, 0.4) * (Math.random() < 0.5 ? 1 : -1)
      return { ...base, r, y, backR: 1.2, backY: Math.sign(y) * 0.9, w: 0.55 * kep(r), look: 'flow', ahead: Math.random() < 0.5 ? 1 : -1, roll: rnd(-0.25, 0.25) }
    }
    if (kind === 'ring') {
      const r = rnd(7, 10)
      return { ...base, r, y: rnd(0.3, 0.75), backR: 3.5, backY: 0.5, w: 0.3 * kep(r), look: 'hole', off: rnd(-2, 2), roll: rnd(-0.15, 0.15) }
    }
    // high over the disk, looking down across it at the hole (any closer and the glow whites it out)
    const r = rnd(7.5, 9.5)
    return { ...base, r, y: rnd(1.1, 1.7), backR: 2.5, backY: 1.1, w: 0.5 * kep(r), look: 'down', roll: rnd(-0.2, 0.2) }
  }
  const rig = new THREE.Camera(), target = new THREE.Vector3() // a camera's lookAt turns -z to the target
  function shotPose(s: TourShot, u: number) {
    const k = Math.min(1, u / (HOLD + FADE)), e = 1 - (1 - k) * (1 - k) // easing in the whole time, settling
    const a = s.a0 - s.w * u, r = s.r + s.backR * (1 - e)
    camera.position.set(Math.cos(a) * r, s.y + s.backY * (1 - e), Math.sin(a) * r)
    if (s.look === 'flow') { const b = a - 0.9 * s.ahead; target.set(Math.cos(b) * r * 0.75, 0, Math.sin(b) * r * 0.75) }
    else if (s.look === 'hole') target.set(-Math.sin(a) * s.off, 0, Math.cos(a) * s.off)
    else target.set(Math.cos(a) * r * 0.4, 0, Math.sin(a) * r * 0.4)
    rig.position.copy(camera.position)
    rig.lookAt(target)
    rig.rotateZ(s.roll - ROLL)
    camera.quaternion.copy(rig.quaternion)
  }
  function cut(t: number) {
    // from home, a run of close shots; after the last of them, home
    if (!tour.close) { tour.close = true; tour.left = 3 + Math.floor(Math.random() * 3) }
    if (tour.left-- > 0) {
      tour.shot = makeShot(tour.shot)
      debris.crowd(tour.shot, SPIN, HOLD + FADE)
    } else tour.close = false
    tour.at = t
    tour.fadeAt = t
    tour.cut = false
  }

  const clamp01 = (x: number) => Math.min(1, Math.max(0, x))
  const smooth = (x: number) => (x = clamp01(x)) * x * x * (x * (x * 6 - 15) + 10)
  let last = 0
  // The birth, in seconds from the first frame (reduced motion starts at the end).
  const BIRTH = 2.2
  let born = false
  function frame(t: number) {
    uniforms.uTime.value = t
    const since = t - BIRTH
    pull.uniforms.uT.value = t
    pull.uniforms.uBirth.value = BIRTH
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
    uniforms.uPhase.value += (t - last) * SPIN * (1 + 5 * (1 - form))
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
    if (tour.cut) cut(t)
    if (tour.close && tour.shot) shotPose(tour.shot, t - tour.at)
    else {
      camera.position.set(
        Math.sin(az) * Math.cos(el) * dist + jx * shake * 0.5,
        Math.sin(el) * dist + jy * shake * 0.5,
        Math.cos(az) * Math.cos(el) * dist,
      )
      camera.lookAt(0, 0, 0)
      camera.rotateZ(-(ROLL + Math.sin(t * 71) * shake * 0.02))
    }
    uniforms.uNear.value = tour.close ? 1 : 0 // (the wide shot is too far off for it)
    camera.updateMatrixWorld()
    uniforms.uCamPos.value.copy(camera.position)
    uniforms.uCamRot.value.setFromMatrix4(camera.matrixWorld)
    const a = t * 0.015 + 2.36
    uniforms.uPlanet.value.set(Math.cos(a) * 11.3, 1.4, Math.sin(a) * 11.3, 0.35)
    debris.update(t, camera.position)
    if (tour.close) {
      renderer.setRenderTarget(nearRT)
      renderer.render(volScene, overlayCam)
      renderer.setRenderTarget(null)
    }
    composer.render()
    const f = 1 - smooth((t - tour.fadeAt) / FADE)
    if (f > 0 && still.tex) {
      overlay.material.uniforms.uOp.value = f
      renderer.autoClear = false
      renderer.render(overlayScene, overlayCam)
      renderer.autoClear = true
    }
    // a change of angle is due: keep this frame, to dissolve from
    if (!reducedMotion && still.tex && t - tour.at >= (tour.close ? HOLD : WAIT)) {
      renderer.copyFramebufferToTexture(still.tex)
      tour.cut = true
    }
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
    debris.dispose()
    nearRT.dispose()
    still.tex?.dispose()
    overlay.geometry.dispose()
    overlay.material.dispose()
    renderer.dispose()
  }
}
