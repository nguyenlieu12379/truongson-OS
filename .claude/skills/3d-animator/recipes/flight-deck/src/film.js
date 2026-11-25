// CAMERA FILM engine. 1920x1080, 30 fps. Contract with render.mjs: window.total, window.renderAt(t, n).
// Every frame is a pure function of t: no clocks, no Math.random(), nothing carried over from the previous frame.
// Clean engine written for this film (21 Nov 2026): renderer, thin-lens camera, sub-frame accumulation (motion blur + focus),
// bloom, one grade. It holds NO props and NO transitions; everything you see belongs to a shot module in src/shots/.
import * as THREE from 'three';
import { FullScreenQuad } from 'three/addons/postprocessing/Pass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { W, H, clamp, lerp, seg, smooth, easeOut, easeInOut, backOut, spring, halton, hash } from './lib.js';

const FPS = 30;
const SHUTTER = 0.5 / 30;
const V = (x, y, z) => new THREE.Vector3(x, y, z);
const D2R = Math.PI / 180;

// ---------- fonts (loaded before __ready) ----------
const FONTS = [['DINC', 'DINCondensed-Bold.ttf'], ['DINA', 'DINAlternate-Bold.ttf'], ['Anton', 'Anton-Regular.ttf'], ['Archivo', 'ArchivoBlack-Regular.ttf']];
await Promise.all(FONTS.map(async ([name, file]) => { const f = new FontFace(name, `url(./src/fonts/${file})`); await f.load(); document.fonts.add(f); }));

// ---------- renderer: linear HDR, graded once at the end ----------
const stage = document.getElementById('stage');
const renderer = new THREE.WebGLRenderer({ canvas: stage, antialias: false, preserveDrawingBuffer: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(1); renderer.setSize(W, H, false);
renderer.toneMapping = THREE.NoToneMapping; renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
const rt = new THREE.WebGLRenderTarget(W, H, { type: THREE.HalfFloatType, samples: 4 });
const accum = new THREE.WebGLRenderTarget(W, H, { type: THREE.HalfFloatType, depthBuffer: false });
const ANISO = renderer.capabilities.getMaxAnisotropy();

const BG = new THREE.Color(0.0035, 0.0045, 0.006);
const scene = new THREE.Scene();
scene.background = BG; scene.fog = new THREE.FogExp2(BG, 0.03);

// environment from a list of softboxes: [w, h, [r, g, b], [x, y, z]]. A shot passes its own list and gets a PMREM texture back.
function makeEnv(panels, base = [0.003, 0.004, 0.005]) {
  const es = new THREE.Scene(); es.background = new THREE.Color(...base);
  for (const [w, h, c, p] of panels) { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: new THREE.Color(...c), side: THREE.DoubleSide })); m.position.set(...p); m.lookAt(0, 0, 0); es.add(m); }
  const pm = new THREE.PMREMGenerator(renderer); const env = pm.fromScene(es, 0.02).texture; pm.dispose(); return env;
}
const ENV0 = makeEnv([[4, 3, [1.2, 1.2, 1.3], [0, 6, 2]]]);
scene.environment = ENV0; scene.environmentIntensity = 0.3;

// ---------- helpers ----------
const std = (color, metalness, roughness, extra = {}) => new THREE.MeshStandardMaterial({ color, metalness, roughness, ...extra });
function mesh(geo, mat, x = 0, y = 0, z = 0, parent = null) { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); if (parent) parent.add(m); return m; }
function rrect(w, h, r) { const s = new THREE.Shape(), x = -w / 2, y = -h / 2; s.moveTo(x + r, y); s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r); s.lineTo(x + w, y + h - r); s.quadraticCurveTo(x + w, y + h, x + w - r, y + h); s.lineTo(x + r, y + h); s.quadraticCurveTo(x, y + h, x, y + h - r); s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y); return s; }
function canvasTex(c, srgb = true) { const t = new THREE.CanvasTexture(c); if (srgb) t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = ANISO; return t; }
const pointLight = (parent, color, intensity, x, y, z, dist = 0) => { const L = new THREE.PointLight(color, intensity, dist, 2); L.position.set(x, y, z); parent.add(L); return L; };

// =====================================================================================
// camera: keys [t, eye, look, rollDeg] sampled densely by the shot (linear between samples), thin lens
// =====================================================================================
const camera = new THREE.PerspectiveCamera(40, W / H, 0.01, 80);
const _e = V(0, 0, 0), _l = V(0, 0, 0), _f = V(0, 0, 0), _r = V(0, 0, 0), _u = V(0, 0, 0);
function camKeys(keys, t) {
  let lo = 0, hi = keys.length - 2;                          // binary search: shots give hundreds of samples
  while (lo < hi) { const m = (lo + hi + 1) >> 1; if (keys[m][0] <= t) lo = m; else hi = m - 1; }
  const a = keys[lo], b = keys[lo + 1], p = seg(t, a[0], b[0]);
  _e.set(lerp(a[1][0], b[1][0], p), lerp(a[1][1], b[1][1], p), lerp(a[1][2], b[1][2], p));
  _l.set(lerp(a[2][0], b[2][0], p), lerp(a[2][1], b[2][1], p), lerp(a[2][2], b[2][2], p));
  return lerp(a[3], b[3], p);
}
function shoot(keys, t, k, n, lens) {
  const roll = camKeys(keys, t);
  camera.position.copy(_e); _f.copy(_l).sub(_e).normalize();
  camera.up.set(0, 1, 0).applyAxisAngle(_f, roll * D2R); camera.lookAt(_l); camera.updateMatrixWorld(); camera.updateProjectionMatrix();
  if (n === 1) return;
  const F = _e.distanceTo(_l), a = Math.sqrt(halton(k + 1, 2)) * lens, b = halton(k + 1, 3) * Math.PI * 2, lx = Math.cos(b) * a, ly = Math.sin(b) * a;
  _r.setFromMatrixColumn(camera.matrixWorld, 0); _u.setFromMatrixColumn(camera.matrixWorld, 1);
  camera.position.addScaledVector(_r, lx).addScaledVector(_u, ly); camera.updateMatrixWorld();
  const e = camera.projectionMatrix.elements, jx = halton(k + 1, 5) - 0.5, jy = halton(k + 1, 7) - 0.5;
  e[8] += -e[0] * lx / F + 2 * jx / W; e[9] += -e[5] * ly / F + 2 * jy / H;
  camera.projectionMatrixInverse.copy(camera.projectionMatrix).invert();
}

// =====================================================================================
// post: add the sub-frames, bloom, then one grade (fringe, ACES, vignette, sRGB, grain)
// =====================================================================================
const vert = 'varying vec2 vUv; void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }';
const addPass = new FullScreenQuad(new THREE.ShaderMaterial({ uniforms: { tex: { value: null }, w: { value: 1 } }, vertexShader: vert,
  fragmentShader: 'uniform sampler2D tex; uniform float w; varying vec2 vUv; void main() { gl_FragColor = vec4(texture2D(tex, vUv).rgb * w, 1.0); }',
  blending: THREE.CustomBlending, blendSrc: THREE.OneFactor, blendDst: THREE.OneFactor, blendEquation: THREE.AddEquation, depthTest: false, depthWrite: false, transparent: true }));
const bloom = new UnrealBloomPass(new THREE.Vector2(W, H), 0.45, 0.55, 0.9);
const grade = new FullScreenQuad(new THREE.ShaderMaterial({
  uniforms: { tex: { value: accum.texture }, seed: { value: 0 }, exposure: { value: 1 }, vig: { value: 0.5 } }, vertexShader: vert,
  fragmentShader: `uniform sampler2D tex; uniform float seed, exposure, vig; varying vec2 vUv;
    float h(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233)) + seed) * 43758.5453); }
    vec3 aces(vec3 x) { return clamp(x * (2.51 * x + 0.03) / (x * (2.43 * x + 0.59) + 0.14), 0.0, 1.0); }
    vec3 srgb(vec3 c) { return mix(c * 12.92, 1.055 * pow(max(c, vec3(0.0)), vec3(1.0 / 2.4)) - 0.055, step(0.0031308, c)); }
    void main() {
      vec2 d = vUv - 0.5; float ca = dot(d, d) * 0.010;
      vec3 c = vec3(texture2D(tex, vUv + d * ca).r, texture2D(tex, vUv).g, texture2D(tex, vUv - d * ca).b) * exposure;
      c = aces(c);
      c *= mix(1.0, 1.0 - vig, smoothstep(0.3, 0.95, length(d * vec2(1.0, 0.85)) * 1.45));
      c = srgb(c);
      c += (h(vUv * 1000.0) - 0.5) * 0.03 * (1.0 - 0.5 * dot(c, vec3(0.33)));
      gl_FragColor = vec4(c, 1.0); }`, depthTest: false, depthWrite: false }));

// =====================================================================================
// shots: one module per shot in src/shots/. build(K) returns
// { id, t0, t1, groups, keys, fov, lens, shutter, fog, env, envMap, exposure, bloom: [strength, radius, threshold], fastf: {frame: multiplier}, pose(t) }
// =====================================================================================
const K = {
  THREE, RoundedBoxGeometry, W, H, FPS, V, D2R, clamp, lerp, seg, smooth, easeOut, easeInOut, backOut, spring, halton, hash,
  renderer, scene, std, mesh, rrect, canvasTex, ANISO, pointLight, makeEnv,
};
const ORDER = ['flight'];      // the film. The 3-second camera test: --shots=deck
const SHOTS = [], BYID = {}, ALLGROUPS = new Set();
async function loadShot(id) {
  if (BYID[id]) return;
  const mod = await import(`./shots/${id}.js`);
  const s = await mod.build(K);
  s.id = s.id || id; BYID[s.id] = s; SHOTS.push(s);
  for (const g of s.groups) ALLGROUPS.add(g);
}
const WANT = new URLSearchParams(location.search).get('shots');
for (const id of (WANT ? WANT.split(',') : ORDER)) await loadShot(id);
SHOTS.sort((a, b) => a.t0 - b.t0);
const shotAt = (t) => SHOTS.find((s) => t < s.t1) || SHOTS[SHOTS.length - 1];
window.__shots = SHOTS.map((s) => s.id);
export const total = SHOTS[SHOTS.length - 1].t1;

export function renderAt(t, n = 1) {
  const shot = shotAt(t), f = Math.round(t * FPS);
  if (n > 1 && shot.fastf && shot.fastf[f]) n *= shot.fastf[f];
  renderer.setRenderTarget(accum); renderer.setClearColor(0x000000, 1); renderer.clear();
  for (const g of ALLGROUPS) g.visible = false;
  for (const g of shot.groups) g.visible = true;
  camera.fov = shot.fov ?? 40; scene.fog.density = shot.fog ?? 0.03;
  scene.environment = shot.envMap || ENV0; scene.environmentIntensity = shot.env ?? 0.3;
  for (let k = 0; k < n; k++) {
    const ts = n === 1 ? t : t + ((k + 0.5) / n - 0.5) * (typeof shot.shutter === 'function' ? shot.shutter(t) : (shot.shutter ?? SHUTTER));
    shot.pose(ts); shoot(shot.keys, ts, k, n, typeof shot.lens === 'function' ? shot.lens(ts) : (shot.lens ?? 0));
    renderer.setRenderTarget(rt); renderer.render(scene, camera);
    addPass.material.uniforms.tex.value = rt.texture; addPass.material.uniforms.w.value = (shot.exposure ?? 1) / n;
    renderer.setRenderTarget(accum); renderer.autoClear = false; addPass.render(renderer); renderer.autoClear = true;
  }
  if (shot.bloom) { bloom.strength = shot.bloom[0]; bloom.radius = shot.bloom[1]; bloom.threshold = shot.bloom[2]; }
  bloom.render(renderer, accum, accum, 0, false);
  const u = grade.material.uniforms; u.seed.value = (t * 30) % 97; u.exposure.value = 1.0; u.vig.value = shot.vig ?? 0.5;
  renderer.setRenderTarget(null); grade.render(renderer);
}
window.renderAt = renderAt; window.total = total;
window.__cam = { camera, _e, _l };     // the real camera, for tools/cam_stats.mjs
