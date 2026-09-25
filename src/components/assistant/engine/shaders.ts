/*
 * The look is a drawing, not a render: flat fills with one hard shadow step,
 * and an ink line of the same pixel width round every part (an inverted hull
 * pushed out in screen space). The figure is drawn solid into a texture; the
 * hologram — see-through, scanlines, fringe, flicker — is laid over that one
 * picture, so parts never show through one another. Every stage shares the
 * vortex, so the warp twists fills and lines together.
 *
 * Ported from docs/superpowers/prototypes/mr-worldwide/index.html (v18).
 */

export const VORTEX = `
  uniform vec3 uWarpC; uniform float uTwist, uPinch;
  vec3 vortex(vec3 wp) {
    vec2 d = wp.xy - uWarpC.xy;
    float r = length(d);
    float f = 1.0 - smoothstep(0.0, 2.6, r);
    float a = uTwist * (0.35 + 1.3 * f);
    float s = sin(a), c = cos(a);
    d = vec2(c * d.x - s * d.y, s * d.x + c * d.y);
    float k = 1.0 - uPinch;
    d *= k * (0.55 + 0.45 * k);
    wp.xy = uWarpC.xy + d;
    wp.z = mix(wp.z, uWarpC.z, uPinch);
    return wp;
  }`

export const VERT = `
  ${VORTEX}
  varying vec3 vN; varying vec2 vUv;
  void main() {
    vUv = uv;
    vec4 wp = modelMatrix * vec4(position, 1.0);
    wp.xyz = vortex(wp.xyz);
    vN = normalize(mat3(viewMatrix) * mat3(modelMatrix) * normal);
    gl_Position = projectionMatrix * viewMatrix * wp;
  }`

export const TOON = `
  uniform vec3 uColor, uFixed; uniform float uTint, uWhite, uUseFixed, uGlobe, uLight;
  uniform sampler2D uLand;
  varying vec3 vN; varying vec2 vUv;
  void main() {
    vec3 fill = uUseFixed > 0.5 ? uFixed : mix(uColor * uTint, vec3(1.0, 0.97, 0.92), uWhite);
    if (uGlobe > 0.5) {
      float m = texture2D(uLand, vUv).r;
      fill = mix(fill, fill * vec3(0.78, 0.62, 0.5), step(0.5, m));                          // flat land
      fill = mix(fill, vec3(0.16, 0.08, 0.04), 1.0 - smoothstep(0.0, 0.09, abs(m - 0.5)));  // inked shore
    }
    float lit = dot(normalize(vN), normalize(vec3(-0.45, 0.6, 1.0)));
    fill *= lit > 0.12 ? 1.0 : 0.8;                                                              // one cel step
    gl_FragColor = vec4(mix(fill, vec3(1.0, 0.96, 0.88) * 1.6, uLight), 1.0);
  }`

export const LINE_VERT = `
  ${VORTEX}
  uniform vec2 uRes; uniform float uLine;
  void main() {
    vec4 wp = modelMatrix * vec4(position, 1.0);
    wp.xyz = vortex(wp.xyz);
    vec4 clip = projectionMatrix * viewMatrix * wp;
    vec3 nv = normalize(mat3(viewMatrix) * mat3(modelMatrix) * normal);
    vec2 nc = (projectionMatrix * vec4(nv, 0.0)).xy;
    clip.xy += normalize(nc + 1e-6) * uLine * 2.0 * clip.w / uRes;
    gl_Position = clip;
  }`

export const LINE_FRAG = `
  uniform float uLight;
  void main() { gl_FragColor = vec4(mix(vec3(0.13, 0.06, 0.03), vec3(1.0, 0.96, 0.88) * 1.6, uLight), 1.0); }`

/** The hologram pass: the drawing, see-through, with scanlines, an RGB fringe and flicker. */
export const PASS_VERT = 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }'

export const PASS_FRAG = `
  uniform sampler2D tDraw; uniform float uTime, uOpacity, uGlitch; uniform vec2 uRes; varying vec2 vUv;
  float gh(float n) { return fract(sin(n) * 43758.5453); }
  void main() {
    vec2 px = 1.0 / uRes;
    // A bad signal (uGlitch): bands of him slip sideways, the colours split
    // wide and the picture stutters off for a frame or two.
    vec2 uv = vUv;
    float tick = floor(uTime * 18.0), band = floor(uv.y * 26.0) + tick * 7.0;
    uv.x += (gh(band) - 0.5) * step(0.55, gh(band + 3.1)) * uGlitch * 0.1;
    float sp = 1.5 + uGlitch * 10.0;
    vec4 c = texture2D(tDraw, uv);
    float r = texture2D(tDraw, uv + vec2(sp, 0.0) * px).r, b = texture2D(tDraw, uv - vec2(sp, 0.0) * px).b;
    float a = max(c.a, max(texture2D(tDraw, uv + vec2(sp, 0.0) * px).a, texture2D(tDraw, uv - vec2(sp, 0.0) * px).a));
    float scan = 0.8 + 0.2 * sin(gl_FragCoord.y * 1.3 - uTime * 9.0);
    float flick = (0.93 + 0.07 * sin(uTime * 37.0) * sin(uTime * 3.1)) * (1.0 - uGlitch * 0.7 * step(0.82, gh(tick + 0.5)));
    vec3 col = vec3(r, c.g, b) * (0.9 + 0.25 * scan);
    gl_FragColor = vec4(col, a * uOpacity * scan * flick);
  }`

/* A black hole he holds in his palm: a billboard drawn like Gargantua — the
   shadow, the photon ring, the disk nearly edge-on, and the disk's far side
   lensed into an arc over the top. uGrow brings it in and out. */
export const HOLE_VERT = `
  uniform float uGrow; varying vec2 vUv;
  void main() {
    vUv = uv * 2.0 - 1.0;
    vec4 c = modelViewMatrix * vec4(0.0, 0.0, 0.0, 1.0);
    c.xy += position.xy * uGrow;
    gl_Position = projectionMatrix * c;
  }`

export const HOLE_FRAG = `
  uniform float uTime, uGrow; varying vec2 vUv;
  float h(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
  float n(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
    return mix(mix(h(i), h(i + vec2(1, 0)), f.x), mix(h(i + vec2(0, 1)), h(i + vec2(1, 1)), f.x), f.y); }
  vec3 heat(float x) { return mix(vec3(1.0, 0.42, 0.1), vec3(1.0, 0.95, 0.85), clamp(x, 0.0, 1.0)); }
  void main() {
    vec2 p = vUv;
    float r = length(p);
    // the disk, nearly edge-on, turning (inner rings faster)
    vec2 q = vec2(p.x, p.y / 0.24);
    float rd = length(q), ang = atan(q.y, q.x);
    float band = smoothstep(0.34, 0.42, rd) * (1.0 - smoothstep(0.6, 0.98, rd));
    float swirl = 0.45 + 0.55 * n(vec2(ang * 4.0 - uTime * 5.0 / max(rd, 0.3), rd * 16.0));
    vec3 diskC = heat(0.8 - (rd - 0.4) * 1.9) * (0.6 + 0.5 * swirl);
    float diskA = band * swirl;
    // the far side, lensed into an arc over the shadow; the photon ring
    float arc = smoothstep(0.36, 0.42, r) * (1.0 - smoothstep(0.48, 0.7, r)) * smoothstep(-0.02, 0.14, p.y);
    arc *= 0.55 + 0.45 * n(vec2(atan(p.y, p.x) * 5.0 + uTime * 3.0, r * 20.0));
    float ring = exp(-pow((r - 0.305) / 0.014, 2.0));
    float shadow = 1.0 - smoothstep(0.26, 0.29, r);
    float front = step(p.y, 0.0);
    // back to front: arc, ring and the disk behind; the shadow; the disk in front
    vec3 col = heat(0.75) * 0.95 * arc + vec3(1.0, 0.9, 0.75) * ring + diskC * diskA * (1.0 - front);
    float a = max(max(arc, ring), diskA * (1.0 - front));
    col = mix(col, vec3(0.0), shadow);
    a = max(a, shadow);
    col = mix(col, diskC, diskA * front);
    a = max(a, diskA * front);
    float glow = 0.3 * exp(-r * 3.5) * (1.0 - shadow);
    col += heat(0.2) * glow;
    a = max(a, glow);
    gl_FragColor = vec4(col, a * (1.0 - smoothstep(0.9, 1.0, r)) * clamp(uGrow * 2.0, 0.0, 1.0));
  }`
