// STYLES: one call re-dresses the whole scene in another look, without touching the scene code.
//   lit   the film as you built it (default)
//   clay  every surface one matte ivory clay under the same light: a sculpted maquette
//   toon  cel shading in three hard bands, bolder colours, black ink outlines
//   neon  the same room at night: cold moonlight, a coral neon tube on the wall, strong glow
// Screens (MeshBasicMaterial) stay screens in every look, so text on them still reads.
//
// Use (film.js does this already):  setStyle('toon', { scene, key: sun, fill: sky, bloom, neonAt: new THREE.Vector3(...) })
// Pick it from the URL: index.html?style=toon   or render with   node render.mjs --style=toon ...
// Rule 1 still holds: materials are made once and cached, so to flip looks inside one film you can call
// setStyle(styleAt(t), ...) at the top of renderAt. The picture still depends only on t.
import * as THREE from 'three';
import { mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';

export const STYLES = ['lit', 'clay', 'toon', 'neon'];

// Tuning in one place. Light values are multipliers on your own key / fill, so they work in any scene.
export const LOOK = {
  lit: { bloom: null },
  clay: { color: [0.92, 0.89, 0.83], rough: 0.88, key: 0.62, keyColor: [1.0, 0.88, 0.74], fill: 1.5, bloom: 0.12, dust: false },
  toon: { key: 0.42, keyColor: [1.0, 0.95, 0.86], fill: 2.2, sat: 1.5, light: 1.1, ink: [0.012, 0.011, 0.016], outline: 0.0028, bloom: 0, dust: false },
  neon: { key: 0.1, keyColor: [0.42, 0.55, 1.0], fill: 0.35, fillColor: [0.2, 0.26, 0.6], bg: [0.006, 0.008, 0.02],
    coral: [1.0, 0.34, 0.27], tube: [3.2, 0.9, 0.62], glow: 0.35, wallGlow: 0.12, bloom: 0.5, dust: true },
};

const isScreen = (m) => m.isMeshBasicMaterial;                 // screens and bulbs: leave them alone
const lum = (c) => 0.2126 * c.r + 0.7152 * c.g + 0.0722 * c.b;

function clayOf(lit) {
  if (isScreen(lit)) return lit;
  const L = LOOK.clay, c = lit.color ?? new THREE.Color(1, 1, 1);
  const col = new THREE.Color().setRGB(...L.color, THREE.SRGBColorSpace).multiplyScalar(0.88 + 0.12 * Math.min(1, Math.sqrt(lum(c))));   // a hint of the old values so objects still part
  return new THREE.MeshStandardMaterial({ color: col, roughness: L.rough, metalness: 0, side: lit.side, transparent: lit.transparent, opacity: lit.opacity });
}

const TOON_BANDS = (() => {                                     // three hard bands: shadow, mid, light
  const t = new THREE.DataTexture(new Uint8Array([70, 70, 70, 255, 160, 160, 160, 255, 255, 255, 255, 255]), 3, 1);
  t.minFilter = t.magFilter = THREE.NearestFilter; t.generateMipmaps = false; t.needsUpdate = true; return t;
})();
function toonOf(lit) {
  if (isScreen(lit)) return lit;
  const L = LOOK.toon, col = (lit.color ?? new THREE.Color(1, 1, 1)).clone(), hsl = {};
  col.getHSL(hsl, THREE.SRGBColorSpace);
  col.setHSL(hsl.h, Math.min(1, hsl.s * L.sat + 0.08), Math.min(0.85, hsl.l * L.light + 0.04), THREE.SRGBColorSpace);
  return new THREE.MeshToonMaterial({ color: col, gradientMap: TOON_BANDS, side: lit.side, transparent: lit.transparent, opacity: lit.opacity });
}

// Ink outlines = the "inverted hull": a black copy of each mesh, drawn back faces only, pushed out along smoothed
// normals by a constant width on screen. Works with InstancedMesh, needs no extra render pass.
const hullGeo = new Map();
function smoothCopy(g) {
  if (hullGeo.has(g)) return hullGeo.get(g);
  let h = g.clone(); for (const k of Object.keys(h.attributes)) if (k !== 'position') h.deleteAttribute(k);
  h = mergeVertices(h, 1e-4); h.computeVertexNormals(); hullGeo.set(g, h); return h;   // averaged normals: no gaps at box corners
}
const inkMat = () => new THREE.ShaderMaterial({
  uniforms: { width: { value: LOOK.toon.outline }, ink: { value: new THREE.Color(...LOOK.toon.ink) } },
  vertexShader: `uniform float width;
    void main() {
      mat4 im = mat4(1.0);
      #ifdef USE_INSTANCING
        im = instanceMatrix;
      #endif
      vec4 mv = modelViewMatrix * im * vec4(position, 1.0);
      vec3 n = normalize(normalMatrix * (mat3(im) * normal));
      mv.xyz += n * width * -mv.z;                                // the same width in pixels near and far
      gl_Position = projectionMatrix * mv; }`,
  fragmentShader: 'uniform vec3 ink; void main() { gl_FragColor = vec4(ink, 1.0); }',
  side: THREE.BackSide,
});
function addOutline(mesh) {
  if (mesh.userData.hull !== undefined) return mesh.userData.hull;
  const g = mesh.geometry, flat = g.type === 'PlaneGeometry' || mesh.userData.noOutline;
  if (flat || isScreen(Array.isArray(mesh.material) ? mesh.material[0] : mesh.material)) return (mesh.userData.hull = null);
  const hull = mesh.isInstancedMesh ? new THREE.InstancedMesh(smoothCopy(g), inkMat(), mesh.count) : new THREE.Mesh(smoothCopy(g), inkMat());
  if (mesh.isInstancedMesh) hull.instanceMatrix = mesh.instanceMatrix;   // shares the instances, follows every change
  hull.castShadow = hull.receiveShadow = false; hull.userData.isHull = true; hull.frustumCulled = false;
  mesh.add(hull); return (mesh.userData.hull = hull);
}

let neonRig = null;
function buildNeon(scene, at) {
  const L = LOOK.neon, g = new THREE.Group(), pts = [];
  for (let i = 0; i <= 48; i++) { const u = i / 48; pts.push(new THREE.Vector3(u * 0.42 - 0.21, 0.03 * Math.sin(u * Math.PI * 3), 0)); }
  g.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 160, 0.005, 10), new THREE.MeshBasicMaterial({ color: new THREE.Color(...L.tube) })));
  const wall = new THREE.PointLight(new THREE.Color(...L.coral), L.wallGlow, 0, 2); wall.position.set(0, 0, 0.06); g.add(wall);   // lights the wall around the tube
  const room = new THREE.PointLight(new THREE.Color(...L.coral), L.glow, 0, 2); room.position.set(0, -0.25, 0.7); g.add(room);   // spills onto the desk
  g.position.copy(at); g.visible = false; scene.add(g); return g;
}

const saved = { done: false };
export function setStyle(name = 'lit', { scene, key, fill, bloom, neonAt } = {}) {
  if (!STYLES.includes(name)) { console.warn(`unknown style "${name}", using lit. Styles: ${STYLES.join(', ')}`); name = 'lit'; }
  if (!saved.done) {                                            // remember the film as built, once
    saved.done = true; saved.bg = scene.background?.clone?.() ?? scene.background; saved.bloom = bloom?.strength;
    if (key) saved.key = { c: key.color.clone(), i: key.intensity };
    if (fill) saved.fill = { c: fill.color.clone(), i: fill.intensity };
  }
  const L = LOOK[name];
  scene.traverse((o) => {
    if (o.userData.isHull) return;
    if (o.isPoints) { o.visible = name === 'lit' || !!L.dust; return; }   // dust reads as specks in clay and toon
    if (!o.isMesh) return;
    o.userData.lit ??= o.material;
    const lit = o.userData.lit, map = (f) => (Array.isArray(lit) ? lit.map(f) : f(lit));
    if (name === 'clay') o.material = map((m) => (m.userData.clay ??= clayOf(m)));
    else if (name === 'toon') o.material = map((m) => (m.userData.toon ??= toonOf(m)));
    else o.material = lit;
    if (o.userData.hull !== undefined || name === 'toon') { const h = name === 'toon' ? addOutline(o) : o.userData.hull; if (h) h.visible = name === 'toon'; }
  });
  if (name === 'neon' && !neonRig) neonRig = buildNeon(scene, neonAt ?? new THREE.Vector3(0, 0.6, -0.85));
  if (neonRig) neonRig.visible = name === 'neon';
  scene.background = name === 'neon' ? new THREE.Color(...L.bg) : saved.bg;
  if (key && saved.key) { key.color.copy(L.keyColor ? new THREE.Color(...L.keyColor) : saved.key.c); key.intensity = saved.key.i * (L.key ?? 1); }
  if (fill && saved.fill) { fill.color.copy(L.fillColor ? new THREE.Color(...L.fillColor) : saved.fill.c); fill.intensity = saved.fill.i * (L.fill ?? 1); }
  if (bloom) bloom.strength = L.bloom ?? saved.bloom;
  return name;
}
