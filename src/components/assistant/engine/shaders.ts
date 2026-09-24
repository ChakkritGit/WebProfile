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
  uniform sampler2D tDraw; uniform float uTime, uOpacity; uniform vec2 uRes; varying vec2 vUv;
  void main() {
    vec2 px = 1.0 / uRes;
    vec4 c = texture2D(tDraw, vUv);
    float r = texture2D(tDraw, vUv + vec2(1.5, 0.0) * px).r, b = texture2D(tDraw, vUv - vec2(1.5, 0.0) * px).b;
    float a = max(c.a, max(texture2D(tDraw, vUv + vec2(1.5, 0.0) * px).a, texture2D(tDraw, vUv - vec2(1.5, 0.0) * px).a));
    float scan = 0.8 + 0.2 * sin(gl_FragCoord.y * 1.3 - uTime * 9.0);
    float flick = 0.93 + 0.07 * sin(uTime * 37.0) * sin(uTime * 3.1);
    vec3 col = vec3(r, c.g, b) * (0.9 + 0.25 * scan);
    gl_FragColor = vec4(col, a * uOpacity * scan * flick);
  }`
