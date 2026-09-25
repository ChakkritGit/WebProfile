import * as THREE from 'three'
import { mergeVertices } from 'three/examples/jsm/utils/BufferGeometryUtils.js'

/**
 * Dust and rocks in Gargantua's disk (black-hole.ts), on Keplerian orbits, drawn
 * over the lensed frame. Close up their own bending is slight; what matters is
 * that nothing shows through the hole, so anything behind its shadow is hidden.
 * They turn with the disk (its integrated phase) and gather with it. Units as
 * there: the Schwarzschild radius is 1.
 */

/** A close shot of the camera tour: where it sits in the disk, and how it drifts. */
export interface Shot {
  kind: 'skim' | 'ring' | 'down'
  r: number
  a0: number
  y: number
  /** Its turn rate round the hole (slower than the disk's, so debris overtakes it). */
  w: number
}

const SHADOW = 2.7 // the shadow's radius (the capture impact parameter is 2.6)
const DUST = 70000, ROCKS = 200, NEAR_DUST = 25000, NEAR_ROCKS = 25
const gauss = () => Math.sqrt(-2 * Math.log(1 - Math.random())) * Math.cos(2 * Math.PI * Math.random())
const orbitR = () => 2.8 + 10.5 * Math.pow(Math.random(), 1.5) // thicker toward the inside
const thick = (r: number) => gauss() * (0.04 + 0.018 * r)
const c01 = (x: number) => Math.min(1, Math.max(0, x))

// value noise, for the rocks' shape
const vhash = (x: number, y: number, z: number) => { const h = Math.sin(x * 127.1 + y * 311.7 + z * 74.7) * 43758.5453; return h - Math.floor(h) }
function vnoise(x: number, y: number, z: number) {
  const X = Math.floor(x), Y = Math.floor(y), Z = Math.floor(z), fx = x - X, fy = y - Y, fz = z - Z
  const u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy), w = fz * fz * (3 - 2 * fz)
  const L = (a: number, b: number, k: number) => a + (b - a) * k, c = (i: number, j: number, k: number) => vhash(X + i, Y + j, Z + k)
  return L(L(L(c(0, 0, 0), c(1, 0, 0), u), L(c(0, 1, 0), c(1, 1, 0), u), v), L(L(c(0, 0, 1), c(1, 0, 1), u), L(c(0, 1, 1), c(1, 1, 1), u), v), w)
}

export function createDebris(uniforms: { uPhase: { value: number }; uForm: { value: number }; uCamPos: { value: THREE.Vector3 } }) {
  const scene = new THREE.Scene()

  // Dust: fine grains, lit like the disk round them.
  const orbit = new Float32Array(DUST * 4) // r, angle at phase 0, height, size
  for (let i = 0; i < DUST; i++) {
    const r = orbitR()
    orbit.set([r, Math.random() * Math.PI * 2, thick(r), 0.0012 + 0.0035 * Math.random() ** 2], i * 4)
  }
  const dustGeo = new THREE.BufferGeometry()
  dustGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(DUST * 3), 3))
  dustGeo.setAttribute('aOrbit', new THREE.BufferAttribute(orbit, 4))
  const dustMat = new THREE.ShaderMaterial({
    uniforms: { uPhase: uniforms.uPhase, uForm: uniforms.uForm, uCamPos: uniforms.uCamPos, uPx: { value: 1 } },
    vertexShader: /* glsl */ `
      uniform float uPhase, uForm, uPx;
      uniform vec3 uCamPos;
      attribute vec4 aOrbit;
      varying vec3 vCol;
      varying float vA;
      void main() {
        float r = aOrbit.x, a = aOrbit.y - uPhase / (r * sqrt(r)); // the way the disk's pattern turns
        vec3 p = vec3(cos(a) * r, aOrbit.z, sin(a) * r);
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        float dist = -mv.z;
        vec3 d = p - uCamPos; float L = length(d); vec3 n = d / L; float tc = -dot(uCamPos, n);
        float hid = tc > 0.0 && tc < L && length(uCamPos + n * tc) < ${SHADOW.toFixed(2)} ? 0.0 : 1.0;
        float size = aOrbit.w * uPx / max(dist, 0.02);
        gl_PointSize = clamp(size, 0.0, 7.0) * hid; // grains, not blobs
        float front = mix(15.4, 2.1, uForm); // gathers with the disk
        vA = hid * smoothstep(0.0, 1.6, size) * smoothstep(0.05, 0.3, dist) * smoothstep(front - 0.6, front + 1.4, r) * uForm;
        float T = pow(2.6 / r, 0.9);
        vCol = mix(vec3(1.0, 0.42, 0.12), vec3(1.0, 0.86, 0.66), smoothstep(0.3, 1.0, T)) * (0.25 + 1.1 * T);
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: /* glsl */ `
      varying vec3 vCol;
      varying float vA;
      void main() {
        vec2 q = gl_PointCoord - 0.5;
        float a = exp(-dot(q, q) * 18.0) * vA;
        if (a < 0.004) discard;
        gl_FragColor = vec4(vCol, a);
      }`,
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  })
  const dust = new THREE.Points(dustGeo, dustMat)
  dust.frustumCulled = false
  scene.add(dust)

  // Rocks: one finely divided sphere pushed about by layered noise — big lumps,
  // then dents and grit — with smooth normals; stretched and turned per rock.
  const rockGeo = mergeVertices(new THREE.IcosahedronGeometry(1, 12))
  {
    const pos = rockGeo.attributes.position, v = new THREE.Vector3()
    for (let i = 0; i < pos.count; i++) {
      v.fromBufferAttribute(pos, i)
      let k = 1, amp = 0.32, f = 1.3
      for (let o = 0; o < 5; o++, amp *= 0.45, f *= 2.1) k += (vnoise(v.x * f + 7, v.y * f, v.z * f) - 0.5) * amp
      v.multiplyScalar(k)
      pos.setXYZ(i, v.x, v.y, v.z)
    }
    rockGeo.computeVertexNormals()
  }
  const rockMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.95 })
  const rocks = new THREE.InstancedMesh(rockGeo, rockMat, ROCKS)
  rocks.frustumCulled = false
  const rockData = Array.from({ length: ROCKS }, () => {
    const r = orbitR(), size = 0.008 + 0.035 * Math.random() ** 3 + (Math.random() < 0.03 ? 0.06 : 0)
    return {
      r, a0: Math.random() * Math.PI * 2, y: thick(r),
      scale: new THREE.Vector3(size, size * (0.55 + 0.45 * Math.random()), size * (0.6 + 0.4 * Math.random())),
      axis: new THREE.Vector3(gauss(), gauss(), gauss()).normalize(), tumble: (0.2 + Math.random()) * (Math.random() < 0.5 ? -1 : 1),
    }
  })
  // each its own shade of dark, dusty brown
  for (let i = 0; i < ROCKS; i++) rocks.setColorAt(i, new THREE.Color().setHSL(0.06 + 0.03 * Math.random(), 0.25 + 0.2 * Math.random(), 0.12 + 0.12 * Math.random()))
  scene.add(rocks)
  // lit by the disk: hot light from the inner edge, a warm glow off the disk plane
  scene.add(new THREE.PointLight(0xffd2a0, 90, 0, 1.3))
  scene.add(new THREE.HemisphereLight(0x1a1218, 0xff8a3d, 1.1))

  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), p = new THREE.Vector3(), s = new THREE.Vector3(), d = new THREE.Vector3(), zero = new THREE.Vector3()
  return {
    scene,
    /** Pixels per unit of size at distance 1, for the grains. */
    setPx(px: number) {
      dustMat.uniforms.uPx.value = px
    },
    update(t: number, cam: THREE.Vector3) {
      const phase = uniforms.uPhase.value, form = uniforms.uForm.value
      for (let i = 0; i < ROCKS; i++) {
        const k = rockData[i], a = k.a0 - phase / (k.r * Math.sqrt(k.r))
        const gathered = form * c01((k.r - (15.4 - 13.3 * form) + 0.6) / 2)
        p.set(Math.cos(a) * k.r, k.y, Math.sin(a) * k.r)
        d.copy(p).sub(cam)
        const L = d.length(), tc = -cam.dot(d.divideScalar(L))
        // behind the shadow it shrinks away over its edge, rather than blink out
        const miss = tc > 0 && tc < L ? s.copy(cam).addScaledVector(d, tc).length() : Infinity
        const shown = c01((miss - SHADOW) / 0.4)
        // far off they'd only speckle the disk; right at the lens they'd fill the frame
        const far = c01((L - 8) / 6), close = c01((L - 0.3) / 0.6)
        const size = (1 - far * far * (3 - 2 * far)) * close * close * (3 - 2 * close) * gathered * shown
        q.setFromAxisAngle(k.axis, k.tumble * t)
        m4.compose(p, q, size <= 0 ? zero : s.copy(k.scale).multiplyScalar(size))
        rocks.setMatrixAt(i, m4)
      }
      rocks.instanceMatrix.needsUpdate = true
    },
    /**
     * Brings a share of the debris onto orbits along a close shot's path, so some
     * always drifts right past the lens; `span` is how long the shot runs.
     */
    crowd(shot: Shot, spin: number, span: number) {
      const near = (clear = 0) => {
        let r: number, y: number
        do { // rocks keep clear of the camera's path: close, but never through the lens
          r = Math.max(3, shot.r + gauss() * 0.7)
          y = shot.kind === 'down' ? gauss() * 0.25 : shot.y + gauss() * 0.3
        } while (Math.hypot(r - shot.r, y - shot.y) < clear)
        const u = 1 + Math.random() * span // when it passes the camera
        return { r, y, a0: shot.a0 - shot.w * u + (uniforms.uPhase.value + spin * u) / (r * Math.sqrt(r)) + gauss() * 0.12 }
      }
      for (let i = 0; i < NEAR_DUST; i++) {
        const { r, y, a0 } = near()
        orbit.set([r, a0, y], i * 4)
      }
      dustGeo.attributes.aOrbit.needsUpdate = true
      for (let i = 0; i < NEAR_ROCKS; i++) Object.assign(rockData[i], near(0.35 + 4 * rockData[i].scale.x))
    },
    dispose() {
      dustGeo.dispose()
      dustMat.dispose()
      rockGeo.dispose()
      rockMat.dispose()
      rocks.dispose()
    },
  }
}
