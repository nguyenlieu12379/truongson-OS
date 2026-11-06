// Forno Notte: scroll-driven 3D walk from the street into the kitchen.
// Everything is procedural (no model files). three.js is vendored in ./three.module.min.js.
import * as THREE from './three.module.min.js';

const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const canvas = document.getElementById('scene');

// ---------------------------------------------------------------------------
// Renderer, scene, camera
// ---------------------------------------------------------------------------
let renderer;
try {
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
} catch (e) {
  document.body.insertAdjacentHTML('beforeend', '<p class="noscript">WebGL is not available in this browser.</p>');
  throw e;
}
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;

const scene = new THREE.Scene();
const OUT_FOG = new THREE.Color(0x0b1020);
const IN_FOG = new THREE.Color(0x1a0f08);
scene.fog = new THREE.FogExp2(OUT_FOG.clone(), 0.02);

const camera = new THREE.PerspectiveCamera(55, 1, 0.05, 400);

// ---------------------------------------------------------------------------
// Canvas textures (procedural)
// ---------------------------------------------------------------------------
function canvasTex(w, h, draw, { repeat = [1, 1], srgb = true } = {}) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(repeat[0], repeat[1]);
  t.anisotropy = 4;
  return t;
}
const rand = (a, b) => a + Math.random() * (b - a);

const glowTex = canvasTex(128, 128, (g, w) => {
  const r = g.createRadialGradient(w / 2, w / 2, 0, w / 2, w / 2, w / 2);
  r.addColorStop(0, 'rgba(255,255,255,1)');
  r.addColorStop(0.2, 'rgba(255,255,255,0.55)');
  r.addColorStop(0.5, 'rgba(255,255,255,0.12)');
  r.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = r; g.fillRect(0, 0, w, w);
});

const flameTex = canvasTex(128, 256, (g, w, h) => {
  const r = g.createRadialGradient(w / 2, h * 0.72, 4, w / 2, h * 0.62, h * 0.5);
  r.addColorStop(0, 'rgba(255,250,220,1)');
  r.addColorStop(0.25, 'rgba(255,190,80,0.9)');
  r.addColorStop(0.55, 'rgba(255,90,20,0.45)');
  r.addColorStop(1, 'rgba(255,40,0,0)');
  g.fillStyle = r;
  g.beginPath();
  g.moveTo(w / 2, 0);
  g.bezierCurveTo(w * 0.95, h * 0.45, w, h * 0.9, w / 2, h);
  g.bezierCurveTo(0, h * 0.9, w * 0.05, h * 0.45, w / 2, 0);
  g.fill();
});

const brickTex = (base = '#6b2f22') => canvasTex(512, 512, (g, w, h) => {
  g.fillStyle = '#2a1712'; g.fillRect(0, 0, w, h);
  const bh = 32, bw = 96;
  for (let y = 0, row = 0; y < h; y += bh, row++) {
    for (let x = row % 2 ? -bw / 2 : 0; x < w; x += bw) {
      const c = new THREE.Color(base).offsetHSL(rand(-0.015, 0.015), rand(-0.08, 0.05), rand(-0.07, 0.05));
      g.fillStyle = '#' + c.getHexString();
      g.fillRect(x + 3, y + 3, bw - 6, bh - 6);
    }
  }
}, { repeat: [3, 2] });

const woodTex = canvasTex(512, 512, (g, w, h) => {
  const pw = 64;
  for (let x = 0; x < w; x += pw) {
    const c = new THREE.Color('#5a3a22').offsetHSL(0, rand(-0.05, 0.05), rand(-0.06, 0.05));
    g.fillStyle = '#' + c.getHexString();
    g.fillRect(x, 0, pw, h);
    g.strokeStyle = 'rgba(0,0,0,0.25)';
    for (let i = 0; i < 6; i++) {
      g.beginPath();
      const gx = x + rand(6, pw - 6);
      g.moveTo(gx, 0);
      g.bezierCurveTo(gx + rand(-6, 6), h / 3, gx + rand(-6, 6), (2 * h) / 3, gx, h);
      g.stroke();
    }
    g.fillStyle = 'rgba(0,0,0,0.5)';
    g.fillRect(x, 0, 2, h);
    g.fillRect(x, rand(0, h), pw, 2);
  }
}, { repeat: [4, 4] });

const tileTex = (a = '#e9e4da', grout = '#b9b1a3', n = 8) => canvasTex(512, 512, (g, w, h) => {
  g.fillStyle = grout; g.fillRect(0, 0, w, h);
  const s = w / n;
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
    const c = new THREE.Color(a).offsetHSL(0, 0, rand(-0.03, 0.02));
    g.fillStyle = '#' + c.getHexString();
    g.fillRect(x * s + 2, y * s + 2, s - 4, s - 4);
  }
}, { repeat: [4, 2] });

const checkerTex = canvasTex(256, 256, (g, w) => {
  const n = 8, s = w / n;
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
    g.fillStyle = (x + y) % 2 ? '#f2ede4' : '#1e1b18';
    g.fillRect(x * s, y * s, s, s);
  }
}, { repeat: [3, 3] });

const marbleTex = canvasTex(512, 256, (g, w, h) => {
  g.fillStyle = '#ecebe8'; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 40; i++) {
    g.strokeStyle = `rgba(120,120,130,${rand(0.05, 0.25)})`;
    g.lineWidth = rand(0.5, 2);
    g.beginPath();
    let x = rand(0, w), y = rand(0, h);
    g.moveTo(x, y);
    for (let k = 0; k < 6; k++) { x += rand(-60, 80); y += rand(-30, 30); g.lineTo(x, y); }
    g.stroke();
  }
});

const asphaltTex = canvasTex(512, 512, (g, w, h) => {
  g.fillStyle = '#1b1c20'; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 9000; i++) {
    const v = rand(15, 60) | 0;
    g.fillStyle = `rgba(${v},${v},${v + 4},${rand(0.2, 0.6)})`;
    g.fillRect(rand(0, w), rand(0, h), 1.5, 1.5);
  }
}, { repeat: [16, 3] });

const windowsTex = (cols, rows, lit = 0.45) => canvasTex(256, 512, (g, w, h) => {
  g.fillStyle = '#000'; g.fillRect(0, 0, w, h);
  const cw = w / cols, rh = h / rows;
  for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
    if (Math.random() > lit) continue;
    const warm = Math.random() > 0.3;
    g.fillStyle = warm ? `hsl(${rand(28, 42)},90%,${rand(45, 70)}%)` : `hsl(${rand(200, 220)},50%,${rand(50, 70)}%)`;
    g.fillRect(x * cw + cw * 0.22, y * rh + rh * 0.2, cw * 0.56, rh * 0.55);
  }
});

const neonTex = canvasTex(1024, 256, (g, w, h) => {
  g.clearRect(0, 0, w, h);
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.font = 'italic 600 128px Georgia, "Times New Roman", serif';
  g.shadowColor = '#ff6a2b';
  for (const blur of [40, 20, 8]) {
    g.shadowBlur = blur;
    g.fillStyle = '#ffb27a';
    g.fillText('Forno Notte', w / 2, h / 2 - 10);
  }
  g.shadowBlur = 0;
  g.fillStyle = '#fff3e6';
  g.fillText('Forno Notte', w / 2, h / 2 - 10);
  g.font = '600 28px -apple-system, Helvetica, Arial, sans-serif';
  g.fillStyle = 'rgba(255,220,190,0.9)';
  g.fillText('P I Z Z E R I A   ·   L E G N A', w / 2, h - 30);
});

const menuTex = canvasTex(512, 640, (g, w, h) => {
  g.fillStyle = '#16191a'; g.fillRect(0, 0, w, h);
  g.strokeStyle = '#6b5a3f'; g.lineWidth = 14; g.strokeRect(7, 7, w - 14, h - 14);
  g.fillStyle = '#f3ead8';
  g.textAlign = 'center';
  g.font = 'italic 56px Georgia, serif';
  g.fillText('Le Pizze', w / 2, 100);
  g.font = '30px Georgia, serif';
  const items = [['Margherita', 16], ['Marinara', 13], ['Diavola', 18], ['Funghi', 17], ['Quattro Formaggi', 19], ['Bianca', 15]];
  items.forEach(([n, p], i) => {
    g.textAlign = 'left'; g.fillText(n, 60, 190 + i * 70);
    g.textAlign = 'right'; g.fillText('$' + p, w - 60, 190 + i * 70);
  });
});

const ovenMouthTex = canvasTex(256, 128, (g, w, h) => {
  const r = g.createRadialGradient(w / 2, h, 4, w / 2, h, w * 0.6);
  r.addColorStop(0, '#fff2c0');
  r.addColorStop(0.25, '#ffae3d');
  r.addColorStop(0.6, '#c2370c');
  r.addColorStop(1, '#2a0a02');
  g.fillStyle = r; g.fillRect(0, 0, w, h);
}, { repeat: [1, 1] });

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const M = (o) => new THREE.MeshStandardMaterial(o);
function box(x0, x1, y0, y1, z0, z1, mat, parent = scene) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(x1 - x0, y1 - y0, z1 - z0), mat);
  m.position.set((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2);
  parent.add(m);
  return m;
}
function glow(color, size, pos, opacity = 1, parent = scene) {
  const s = new THREE.Sprite(new THREE.SpriteMaterial({
    map: glowTex, color, transparent: true, opacity, blending: THREE.AdditiveBlending,
    depthWrite: false, toneMapped: false, fog: false,
  }));
  s.scale.set(size, size, 1);
  s.position.copy(pos);
  parent.add(s);
  return s;
}
function pointLight(color, intensity, distance, pos) {
  const l = new THREE.PointLight(color, intensity, distance, 2);
  l.position.copy(pos);
  scene.add(l);
  return l;
}
const V = (x, y, z) => new THREE.Vector3(x, y, z);

// ---------------------------------------------------------------------------
// Sky
// ---------------------------------------------------------------------------
const sky = new THREE.Mesh(
  new THREE.SphereGeometry(200, 32, 16),
  new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false,
    uniforms: {},
    vertexShader: 'varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0); }',
    fragmentShader: `varying vec3 vP;
      void main(){
        float h = clamp(vP.y, -0.2, 1.0);
        vec3 horizon = vec3(0.95, 0.42, 0.22);
        vec3 mid = vec3(0.18, 0.13, 0.32);
        vec3 top = vec3(0.02, 0.03, 0.08);
        vec3 c = mix(horizon, mid, smoothstep(0.0, 0.18, h));
        c = mix(vec3(0.03,0.03,0.05), c, smoothstep(-0.06, 0.01, h));
        c = mix(c, top, smoothstep(0.15, 0.6, h));
        gl_FragColor = vec4(c, 1.0);
      }`,
  }),
);
scene.add(sky);

// Stars
{
  const n = 400, pos = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    const th = rand(0, Math.PI * 2), ph = rand(0.25, 1.3);
    pos.set([Math.cos(th) * Math.cos(ph) * 180, Math.sin(ph) * 180, Math.sin(th) * Math.cos(ph) * 180], i * 3);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  scene.add(new THREE.Points(g, new THREE.PointsMaterial({ color: 0xffffff, size: 0.6, sizeAttenuation: true, fog: false, transparent: true, opacity: 0.7 })));
}

// ---------------------------------------------------------------------------
// Street
// ---------------------------------------------------------------------------
const hemi = new THREE.HemisphereLight(0x5a6aa8, 0x1a120c, 0.9);
scene.add(hemi);

const concrete = M({ color: 0x55565c, roughness: 0.9 });
{
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(400, 400), M({ color: 0x15161a, roughness: 1 }));
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.02;
  scene.add(ground);
}
box(-60, 60, 0, 0.15, 0, 7.5, concrete);                       // near sidewalk
box(-60, 60, 0, 0.15, 19, 26, concrete);                       // far sidewalk
box(-60, 60, 0.0, 0.17, 7.35, 7.55, M({ color: 0x77787d, roughness: 0.8 })); // curb

const road = new THREE.Mesh(
  new THREE.PlaneGeometry(120, 11.5),
  M({ map: asphaltTex, color: 0x9a9aa2, roughness: 0.38, metalness: 0.1 }),
);
road.rotation.x = -Math.PI / 2;
road.position.set(0, 0.01, 13.25);
scene.add(road);
const dashMat = new THREE.MeshBasicMaterial({ color: 0xd8c27a });
for (let x = -58; x < 58; x += 5) {
  const d = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 0.14), dashMat);
  d.rotation.x = -Math.PI / 2;
  d.position.set(x, 0.02, 13.25);
  scene.add(d);
}
// Crosswalk leading to the door
const zebraMat = new THREE.MeshStandardMaterial({ color: 0xcfd0d4, roughness: 0.6 });
for (let i = -3; i <= 3; i++) {
  const z = new THREE.Mesh(new THREE.PlaneGeometry(0.55, 10.5), zebraMat);
  z.rotation.x = -Math.PI / 2;
  z.position.set(i * 1.0, 0.02, 13.25);
  scene.add(z);
}

// Street lamps
const lampMat = M({ color: 0x1c1d20, roughness: 0.5, metalness: 0.6 });
function streetLamp(x, z, facing) {
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.1, 5.2, 10), lampMat);
  pole.position.set(x, 2.6, z);
  scene.add(pole);
  const arm = box(x - 0.05, x + 0.05, 5.1, 5.18, z, z + facing * 1.1, lampMat);
  arm.position.z = z + facing * 0.55;
  const head = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.35, 0.25, 16), lampMat);
  head.position.set(x, 5.0, z + facing * 1.1);
  scene.add(head);
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.12, 12, 8), new THREE.MeshBasicMaterial({ color: 0xffe2b0 }));
  bulb.position.set(x, 4.88, z + facing * 1.1);
  scene.add(bulb);
  glow(0xffc27a, 3.2, V(x, 4.85, z + facing * 1.1), 0.8);
  return pointLight(0xffc98a, 30, 18, V(x, 4.7, z + facing * 1.1));
}
streetLamp(-11, 6.8, 1);
streetLamp(11, 6.8, 1);
streetLamp(-4, 19.8, -1);

// Neighbouring buildings
function building(x0, x1, h, depth, color, cols, rows) {
  const tex = windowsTex(cols, rows);
  const mat = M({ color, roughness: 0.85, emissive: 0xffffff, emissiveMap: tex, emissiveIntensity: 0.9 });
  const front = M({ color, roughness: 0.85 });
  const b = new THREE.Mesh(new THREE.BoxGeometry(x1 - x0, h, depth), [front, front, front, front, mat, front]);
  b.position.set((x0 + x1) / 2, h / 2, -depth / 2);
  scene.add(b);
}
building(-26, -8.4, 14, 14, 0x3a3236, 6, 10);
building(-40, -26.4, 10, 12, 0x2c2f38, 5, 7);
building(8.4, 22, 12, 14, 0x34363c, 5, 8);
building(22.4, 40, 16, 12, 0x2f2a2e, 6, 11);
// Across the street (behind the start camera, visible on the way in from an angle)
{
  const t = windowsTex(8, 6, 0.35);
  const b = new THREE.Mesh(new THREE.BoxGeometry(80, 12, 4), M({ color: 0x24262c, emissive: 0xffffff, emissiveMap: t, emissiveIntensity: 0.6 }));
  b.position.set(0, 6, 46);
  scene.add(b);
}

// Passing car (decorative, time-based)
const car = new THREE.Group();
{
  const body = M({ color: 0x8a1c1c, roughness: 0.3, metalness: 0.6 });
  box(-2.1, 2.1, 0.3, 1.0, -0.9, 0.9, body, car);
  box(-1.1, 1.2, 1.0, 1.55, -0.8, 0.8, M({ color: 0x121418, roughness: 0.1, metalness: 0.9 }), car);
  const wheelM = M({ color: 0x0c0c0c, roughness: 0.9 });
  for (const [x, z] of [[-1.35, -0.9], [1.35, -0.9], [-1.35, 0.9], [1.35, 0.9]]) {
    const w = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.36, 0.25, 16), wheelM);
    w.rotation.x = Math.PI / 2; w.position.set(x, 0.36, z); car.add(w);
  }
  glow(0xfff1d6, 1.6, V(2.15, 0.7, -0.6), 1, car);
  glow(0xfff1d6, 1.6, V(2.15, 0.7, 0.6), 1, car);
  glow(0xff2a2a, 0.9, V(-2.15, 0.7, -0.6), 1, car);
  glow(0xff2a2a, 0.9, V(-2.15, 0.7, 0.6), 1, car);
  car.position.set(-50, 0, 15.8);
  scene.add(car);
}

// ---------------------------------------------------------------------------
// Facade (z = 0). Openings: window L, door, window R.
// ---------------------------------------------------------------------------
const facadeMat = M({ color: 0x1d2a24, roughness: 0.7 });  // deep green storefront
const trimMat = M({ color: 0xb08a4a, roughness: 0.35, metalness: 0.8 }); // brass
const brickFront = M({ map: brickTex('#7a3a28'), roughness: 0.9 });
brickFront.map.repeat.set(4, 1.6);
const ZF0 = -0.35, ZF1 = 0;
// lower storefront (green)
box(-8.2, -6, 0.9, 3.5, ZF0, ZF1, facadeMat);
box(-2.1, -1.1, 0.9, 3.5, ZF0, ZF1, facadeMat);
box(1.1, 2.1, 0.9, 3.5, ZF0, ZF1, facadeMat);
box(6, 8.2, 0.9, 3.5, ZF0, ZF1, facadeMat);
box(-8.2, -1.1, 0, 0.9, ZF0, ZF1, facadeMat);
box(1.1, 8.2, 0, 0.9, ZF0, ZF1, facadeMat);
box(-1.1, 1.1, 3.2, 3.5, ZF0, ZF1, facadeMat);
// sign band + upper brick
box(-8.2, 8.2, 3.5, 4.9, ZF0 - 0.02, ZF1 + 0.08, M({ color: 0x0f1512, roughness: 0.6 }));
box(-8.2, 8.2, 4.9, 11, ZF0, ZF1, brickFront);
box(-8.25, 8.25, 3.46, 3.54, ZF0, ZF1 + 0.12, trimMat);
box(-8.25, 8.25, 4.86, 4.94, ZF0, ZF1 + 0.12, trimMat);
// window glass + mullions
const glassMat = new THREE.MeshPhysicalMaterial({ color: 0x9fb7c9, roughness: 0.05, metalness: 0, transparent: true, opacity: 0.12, depthWrite: false });
for (const [x0, x1] of [[-6, -2.1], [2.1, 6]]) {
  const gl = new THREE.Mesh(new THREE.PlaneGeometry(x1 - x0, 2.6), glassMat);
  gl.position.set((x0 + x1) / 2, 2.2, -0.15);
  scene.add(gl);
  box((x0 + x1) / 2 - 0.03, (x0 + x1) / 2 + 0.03, 0.9, 3.5, -0.2, -0.1, trimMat);
  box(x0, x1, 2.55, 2.6, -0.2, -0.1, trimMat);
}
// upper-floor windows (lit)
const upWin = M({ color: 0x111111, emissive: 0xffb36b, emissiveIntensity: 0.28 });
for (const x of [-5.5, -1.8, 1.8, 5.5]) {
  box(x - 0.8, x + 0.8, 6, 8.2, 0.0, 0.03, upWin);
  box(x - 0.9, x + 0.9, 5.9, 6.0, 0.0, 0.18, M({ color: 0x9a948a, roughness: 0.8 }));
}
// neon sign
const neon = new THREE.Mesh(new THREE.PlaneGeometry(6.2, 1.55), new THREE.MeshBasicMaterial({ map: neonTex, transparent: true, toneMapped: false, depthWrite: false }));
neon.position.set(0, 4.2, 0.12);
scene.add(neon);
const neonGlow = glow(0xff7a3a, 9, V(0, 4.2, 0.6), 0.45);
const neonLight = pointLight(0xff8a4a, 14, 12, V(0, 4.1, 1.5));
// awnings
const awningMat = M({ color: 0x173326, roughness: 0.8, side: THREE.DoubleSide });
for (const cx of [-4.05, 4.05]) {
  const a = new THREE.Mesh(new THREE.PlaneGeometry(4.4, 1.6), awningMat);
  a.position.set(cx, 3.15, 0.65);
  a.rotation.x = -Math.PI / 2 + 0.55;
  scene.add(a);
}
// door (hinged on the left jamb, swings inward)
const doorPivot = new THREE.Group();
doorPivot.position.set(-1.1, 0, -0.18);
scene.add(doorPivot);
{
  const doorFrame = M({ color: 0x1d2a24, roughness: 0.5 });
  box(0, 0.12, 0, 3.2, -0.05, 0.05, doorFrame, doorPivot);
  box(2.08, 2.2, 0, 3.2, -0.05, 0.05, doorFrame, doorPivot);
  box(0, 2.2, 0, 0.35, -0.05, 0.05, doorFrame, doorPivot);
  box(0, 2.2, 3.05, 3.2, -0.05, 0.05, doorFrame, doorPivot);
  const dg = new THREE.Mesh(new THREE.PlaneGeometry(1.96, 2.7), glassMat);
  dg.position.set(1.1, 1.7, 0);
  doorPivot.add(dg);
  box(1.85, 1.92, 1.1, 2.1, 0.05, 0.12, trimMat, doorPivot); // handle
}
// warm light spilling from the door area
pointLight(0xffb070, 10, 10, V(0, 2.8, 1.2));
// planters with small trees either side of the door
for (const x of [-7.2, 7.2]) {
  box(x - 0.45, x + 0.45, 0.15, 0.9, 0.6, 1.5, M({ color: 0x2a2a2c, roughness: 0.6 }));
  const tree = new THREE.Mesh(new THREE.IcosahedronGeometry(0.75, 1), M({ color: 0x1f3a22, roughness: 0.9, flatShading: true }));
  tree.position.set(x, 1.7, 1.05);
  scene.add(tree);
}

// ---------------------------------------------------------------------------
// Dining room (z 0 → -14, x -7 → 7)
// ---------------------------------------------------------------------------
const floor = new THREE.Mesh(new THREE.PlaneGeometry(14, 14), M({ map: woodTex, roughness: 0.55 }));
floor.rotation.x = -Math.PI / 2;
floor.position.set(0, 0.005, -7);
scene.add(floor);
const ceil = new THREE.Mesh(new THREE.PlaneGeometry(14, 14), M({ color: 0x1a1210, roughness: 1 }));
ceil.rotation.x = Math.PI / 2;
ceil.position.set(0, 4.3, -7);
scene.add(ceil);
const brickIn = M({ map: brickTex('#8a4a32'), roughness: 0.95 });
brickIn.map.repeat.set(5, 1.6);
for (const s of [-1, 1]) {
  const w = new THREE.Mesh(new THREE.PlaneGeometry(14, 4.3), brickIn);
  w.position.set(s * 7, 2.15, -7);
  w.rotation.y = -s * Math.PI / 2;
  scene.add(w);
}
// wainscot
for (const s of [-1, 1]) box(s * 7 - 0.05, s * 7 + 0.05, 0, 1.1, -14, 0, M({ color: 0x1d2a24, roughness: 0.6 }));
// back wall with a wide opening into the kitchen
const backMat = M({ color: 0xd9cdb8, roughness: 0.9 });
box(-7, -3, 0, 4.3, -14.2, -14, backMat);
box(3, 7, 0, 4.3, -14.2, -14, backMat);
box(-3, 3, 3.2, 4.3, -14.2, -14, backMat);
box(-3.1, 3.1, 3.15, 3.25, -14.25, -13.95, trimMat);
// menu board on the right wall
{
  const mb = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 1.75), new THREE.MeshStandardMaterial({ map: menuTex, roughness: 0.8 }));
  mb.position.set(6.94, 2.2, -8.5);
  mb.rotation.y = -Math.PI / 2;
  scene.add(mb);
}
// wine shelves on the left wall
{
  const shelfM = M({ color: 0x3b2618, roughness: 0.7 });
  const bottleMs = [0x2c4a2a, 0x4a1a22, 0x1e2a3a].map((c) => new THREE.MeshPhysicalMaterial({ color: c, roughness: 0.15, transmission: 0, clearcoat: 1 }));
  const bottleG = new THREE.CylinderGeometry(0.07, 0.07, 0.38, 10);
  for (const y of [1.6, 2.3, 3.0]) {
    box(-7, -6.7, y - 0.03, y, -11.5, -6.5, shelfM);
    for (let z = -11.3; z < -6.6; z += 0.24) {
      const b = new THREE.Mesh(bottleG, bottleMs[(Math.random() * 3) | 0]);
      b.position.set(-6.85, y + 0.19, z);
      scene.add(b);
    }
  }
}
// tables, chairs, pendants
const clothMat = M({ map: checkerTex, roughness: 0.9 });
const tableLeg = M({ color: 0x1b1b1d, roughness: 0.4, metalness: 0.7 });
const chairMat = M({ color: 0x3a2416, roughness: 0.6 });
const shadeMat = M({ color: 0x2a2018, roughness: 0.35, metalness: 0.85, side: THREE.DoubleSide });
const bulbMat = new THREE.MeshBasicMaterial({ color: 0xffe0a8, toneMapped: false });
const candles = [];
function table(x, z) {
  const top = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.62, 0.05, 28), clothMat);
  top.position.set(x, 0.76, z);
  scene.add(top);
  const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.74, 8), tableLeg);
  leg.position.set(x, 0.37, z);
  scene.add(leg);
  const foot = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.03, 16), tableLeg);
  foot.position.set(x, 0.015, z);
  scene.add(foot);
  for (const a of [0, Math.PI]) {
    const cx = x + Math.cos(a) * 0.9, cz = z + Math.sin(a) * 0.9;
    box(cx - 0.22, cx + 0.22, 0.44, 0.48, cz - 0.22, cz + 0.22, chairMat);
    const bx = cx + Math.cos(a) * 0.2;
    box(bx - 0.03, bx + 0.03, 0.48, 1.0, cz - 0.2, cz + 0.2, chairMat);
    for (const [dx, dz] of [[-0.18, -0.18], [0.18, -0.18], [-0.18, 0.18], [0.18, 0.18]]) box(cx + dx - 0.02, cx + dx + 0.02, 0, 0.44, cz + dz - 0.02, cz + dz + 0.02, chairMat);
  }
  // candle
  const c = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.12, 10), M({ color: 0xf2ead8 }));
  c.position.set(x, 0.85, z);
  scene.add(c);
  candles.push(glow(0xffb45a, 0.5, V(x, 0.95, z), 0.9));
  // pendant
  const cord = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 1.5, 4), tableLeg);
  cord.position.set(x, 3.55, z);
  scene.add(cord);
  const shade = new THREE.Mesh(new THREE.ConeGeometry(0.32, 0.3, 24, 1, true), shadeMat);
  shade.position.set(x, 2.68, z);
  scene.add(shade);
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.07, 12, 8), bulbMat);
  bulb.position.set(x, 2.55, z);
  scene.add(bulb);
  glow(0xffc27a, 1.4, V(x, 2.5, z), 0.75);
}
for (const z of [-3.5, -7.2, -10.9]) for (const x of [-4.4, 4.4]) table(x, z);
pointLight(0xffb36b, 16, 11, V(-4.4, 2.4, -5.3));
pointLight(0xffb36b, 16, 11, V(4.4, 2.4, -5.3));
pointLight(0xffb36b, 16, 11, V(0, 2.6, -10.5));

// ---------------------------------------------------------------------------
// Kitchen (z -14 → -23)
// ---------------------------------------------------------------------------
const kFloor = new THREE.Mesh(new THREE.PlaneGeometry(14, 9), M({ map: tileTex('#2b2b2e', '#141416', 10), roughness: 0.4 }));
kFloor.material.map.repeat.set(4, 3);
kFloor.rotation.x = -Math.PI / 2;
kFloor.position.set(0, 0.006, -18.5);
scene.add(kFloor);
const kWall = M({ map: tileTex('#efece6', '#c9c3b8', 12), roughness: 0.35 });
kWall.map.repeat.set(5, 2);
const kBack = new THREE.Mesh(new THREE.PlaneGeometry(14, 4.3), kWall);
kBack.position.set(0, 2.15, -23);
scene.add(kBack);
for (const s of [-1, 1]) {
  const w = new THREE.Mesh(new THREE.PlaneGeometry(9, 4.3), kWall);
  w.position.set(s * 7, 2.15, -18.5);
  w.rotation.y = -s * Math.PI / 2;
  scene.add(w);
}
const kCeil = new THREE.Mesh(new THREE.PlaneGeometry(14, 9), M({ color: 0x1c1a18, roughness: 1 }));
kCeil.rotation.x = Math.PI / 2;
kCeil.position.set(0, 4.3, -18.5);
scene.add(kCeil);
// marble prep counter
const steel = M({ color: 0x9aa0a6, roughness: 0.3, metalness: 0.9 });
box(-2.6, 2.6, 0, 0.86, -17.2, -15.8, steel);
const marble = box(-2.7, 2.7, 0.86, 0.93, -17.3, -15.7, M({ map: marbleTex, roughness: 0.2 }));
marble.material.map.repeat.set(1, 1);
// prep bowls on the counter
const bowlM = M({ color: 0xf4f1ea, roughness: 0.3 });
const bowlFill = [0xb3200f, 0xf6f1e4, 0x2f7a2a];
[-1.7, -1.15, 1.6].forEach((x, i) => {
  const b = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.15, 0.14, 20, 1, true), bowlM);
  b.position.set(x, 1.0, -16.9);
  scene.add(b);
  const f = new THREE.Mesh(new THREE.CircleGeometry(0.2, 20), M({ color: bowlFill[i], roughness: 0.6 }));
  f.rotation.x = -Math.PI / 2;
  f.position.set(x, 1.05, -16.9);
  scene.add(f);
});
// flour dust patch
{
  const f = new THREE.Mesh(new THREE.CircleGeometry(0.9, 32), new THREE.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: 0.35, roughness: 1, depthWrite: false }));
  f.rotation.x = -Math.PI / 2;
  f.position.set(0.1, 0.932, -16.5);
  scene.add(f);
}
// hanging copper pans on the right wall
{
  const copper = M({ color: 0xb8643a, roughness: 0.25, metalness: 1 });
  box(6.95, 7, 3.0, 3.06, -21, -16, steel);
  for (let i = 0; i < 4; i++) {
    const pan = new THREE.Mesh(new THREE.CylinderGeometry(0.28 - i * 0.03, 0.24 - i * 0.03, 0.12, 24), copper);
    pan.rotation.z = Math.PI / 2;
    pan.position.set(6.9, 2.5, -20.2 + i * 1.1);
    scene.add(pan);
  }
}
// shelf with jars on the left wall
{
  box(-7, -6.6, 2.4, 2.45, -21.5, -16.5, steel);
  const jarCols = [0xc23a1a, 0xe6d6a0, 0x3d6b2f, 0xd9a441];
  for (let z = -21.3; z < -16.6; z += 0.42) {
    const j = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.32, 12), M({ color: jarCols[(Math.random() * 4) | 0], roughness: 0.3 }));
    j.position.set(-6.8, 2.62, z);
    scene.add(j);
  }
}
pointLight(0xfff0dc, 18, 9, V(0, 3.6, -16.2));

// Wood-fired oven
const oven = new THREE.Group();
oven.position.set(0, 0, -21.2);
scene.add(oven);
const ovenBrick = M({ map: brickTex('#9b4a2c'), roughness: 0.9 });
ovenBrick.map.repeat.set(6, 2);
box(-2.1, 2.1, 0, 1.0, -1.8, 1.9, M({ color: 0x2a2624, roughness: 0.9 }), oven);
box(-2.15, 2.15, 0.96, 1.04, -1.85, 1.95, M({ color: 0x5b5752, roughness: 0.8 }), oven); // hearth slab
const dome = new THREE.Mesh(new THREE.SphereGeometry(1.85, 40, 20, 0, Math.PI * 2, 0, Math.PI / 2), ovenBrick);
dome.scale.set(1, 0.8, 1);
dome.position.set(0, 1.0, 0);
oven.add(dome);
// mouth arch (front of dome), glowing interior
{
  const shape = new THREE.Shape();
  shape.moveTo(-0.72, 0);
  shape.lineTo(-0.72, 0.38);
  shape.absarc(0, 0.38, 0.72, Math.PI, 0, true);
  shape.lineTo(0.72, 0);
  shape.lineTo(-0.72, 0);
  const g = new THREE.ShapeGeometry(shape, 24);
  const uv = g.attributes.uv;
  const pos = g.attributes.position;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, (pos.getX(i) + 0.72) / 1.44, pos.getY(i) / 1.1);
  const mouth = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ map: ovenMouthTex, toneMapped: false }));
  mouth.position.set(0, 1.04, 1.86);
  oven.add(mouth);
  const arch = new THREE.Mesh(new THREE.TorusGeometry(0.8, 0.1, 10, 30, Math.PI), ovenBrick);
  arch.position.set(0, 1.42, 1.86);
  oven.add(arch);
  for (const s of [-1, 1]) box(s * 0.8 - 0.1, s * 0.8 + 0.1, 1.04, 1.42, 1.78, 1.96, ovenBrick, oven);
}
// chimney
{
  const ch = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.32, 2.4, 16), M({ color: 0x2a2624, roughness: 0.6, metalness: 0.4 }));
  ch.position.set(0, 3.3, 0.6);
  oven.add(ch);
}
// flames and glow
const flames = [];
for (let i = 0; i < 7; i++) {
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: flameTex, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false, fog: false }));
  s.position.set(rand(-0.5, 0.5), 1.25, 1.9 + rand(0, 0.04));
  s.userData = { base: rand(0.28, 0.46), phase: rand(0, 10), x: s.position.x };
  oven.add(s);
  flames.push(s);
}
const ovenGlow = glow(0xff7a2a, 5.5, V(0, 1.4, 2.2), 0.55, oven);
const fireLight = pointLight(0xff7a30, 24, 12, V(0, 1.4, -19.0));
// embers
const EMBERS = 140;
const emberGeo = new THREE.BufferGeometry();
const emberPos = new Float32Array(EMBERS * 3);
const emberVel = new Float32Array(EMBERS);
function resetEmber(i, spread = true) {
  emberPos[i * 3] = rand(-0.6, 0.6);
  emberPos[i * 3 + 1] = spread ? rand(1.1, 3.6) : 1.1;
  emberPos[i * 3 + 2] = -19.2 + rand(-0.05, 0.4);
  emberVel[i] = rand(0.25, 0.8);
}
for (let i = 0; i < EMBERS; i++) resetEmber(i);
emberGeo.setAttribute('position', new THREE.BufferAttribute(emberPos, 3));
const embers = new THREE.Points(emberGeo, new THREE.PointsMaterial({
  color: 0xffa040, size: 0.045, map: glowTex, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false,
}));
scene.add(embers);

// ---------------------------------------------------------------------------
// The pizza (assembled by scroll)
// ---------------------------------------------------------------------------
const pizza = new THREE.Group();
const PIZZA_HOME = V(0, 0.935, -16.5);
pizza.position.copy(PIZZA_HOME);
scene.add(pizza);
const doughMat = M({ color: 0xead9b5, roughness: 0.85 });
const dough = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.04, 48), doughMat);
dough.position.y = 0.02;
pizza.add(dough);
const crust = new THREE.Mesh(new THREE.TorusGeometry(0.5, 0.05, 12, 48), doughMat);
crust.rotation.x = Math.PI / 2;
crust.position.y = 0.045;
pizza.add(crust);
const sauceMat = M({ color: 0xb3200f, roughness: 0.55 });
const sauce = new THREE.Mesh(new THREE.CircleGeometry(0.46, 48), sauceMat);
sauce.rotation.x = -Math.PI / 2;
sauce.position.y = 0.043;
pizza.add(sauce);
const cheeseMat = M({ color: 0xfbf6e8, roughness: 0.5 });
const cheese = [];
for (let i = 0; i < 13; i++) {
  const a = (i / 13) * Math.PI * 2 + rand(-0.2, 0.2);
  const r = i === 0 ? 0 : rand(0.17, 0.34);
  const m = new THREE.Mesh(new THREE.SphereGeometry(rand(0.055, 0.075), 16, 10), cheeseMat);
  m.scale.y = 0.35;
  m.userData = { x: Math.cos(a) * r, z: Math.sin(a) * r, i };
  pizza.add(m);
  cheese.push(m);
}
const basilMat = M({ color: 0x2f7a2a, roughness: 0.45, side: THREE.DoubleSide });
const basil = [];
for (let i = 0; i < 6; i++) {
  const g = new THREE.CircleGeometry(0.07, 16);
  g.scale(1, 0.55, 1);
  const m = new THREE.Mesh(g, basilMat);
  const a = (i / 6) * Math.PI * 2 + 0.4;
  const r = rand(0.12, 0.3);
  m.userData = { x: Math.cos(a) * r, z: Math.sin(a) * r, rot: rand(0, Math.PI) };
  pizza.add(m);
  basil.push(m);
}
// peel under the pizza while it travels to the oven
const peel = new THREE.Group();
{
  const wood = M({ color: 0xa87a4a, roughness: 0.7 });
  const blade = new THREE.Mesh(new THREE.CylinderGeometry(0.58, 0.58, 0.02, 40), wood);
  peel.add(blade);
  box(-0.04, 0.04, -0.01, 0.01, 0.55, 1.9, wood, peel);
  peel.visible = false;
  scene.add(peel);
}
const pizzaGlow = glow(0xffb070, 1.6, V(0, 0.4, 0), 0, pizza);

// ---------------------------------------------------------------------------
// Camera path: keyframes [progress, position, lookAt]
// ---------------------------------------------------------------------------
const KEYS = [
  [0.00, V(0, 2.6, 36), V(0, 3.6, 0)],
  [0.12, V(-3.5, 2.1, 25), V(0, 3.2, 0)],
  [0.24, V(0, 1.8, 10), V(0, 3.0, 0)],
  [0.33, V(0, 1.7, 3.0), V(0, 1.6, -4)],
  [0.42, V(0.2, 1.7, -2.0), V(-1.2, 1.5, -8)],
  [0.50, V(2.4, 1.9, -6.2), V(-3.5, 1.3, -9)],
  [0.58, V(0, 2.0, -10.6), V(0, 1.2, -16.5)],
  [0.66, V(0, 2.25, -14.7), V(0, 0.95, -16.5)],
  [0.80, V(0.45, 1.95, -15.05), V(0, 0.95, -16.55)],
  [0.90, V(1.6, 1.7, -16.6), V(0, 1.1, -19.4)],
  [1.00, V(0.0, 1.55, -16.4), V(0, 1.15, -19.4)],
];
const posCurve = new THREE.CatmullRomCurve3(KEYS.map((k) => k[1]), false, 'centripetal');
const lookCurve = new THREE.CatmullRomCurve3(KEYS.map((k) => k[2]), false, 'centripetal');
const tmpP = new THREE.Vector3(), tmpL = new THREE.Vector3();
function curveU(p) {
  const n = KEYS.length;
  if (p <= 0) return 0;
  if (p >= 1) return 1;
  let i = 0;
  while (i < n - 2 && p > KEYS[i + 1][0]) i++;
  const t = (p - KEYS[i][0]) / (KEYS[i + 1][0] - KEYS[i][0]);
  const e = t * t * (3 - 2 * t) * 0.35 + t * 0.65; // soften the start/stop of each leg slightly
  return (i + e) / (n - 1);
}

// ---------------------------------------------------------------------------
// Scroll → spring (critically damped, interruptible, carries velocity)
// ---------------------------------------------------------------------------
const spring = { x: 0, v: 0, target: 0 };
const RESPONSE = 0.55; // seconds
const K = (2 * Math.PI / RESPONSE) ** 2;
const C = 2 * Math.sqrt(K); // damping ratio 1.0
function readScroll() {
  const max = document.documentElement.scrollHeight - innerHeight;
  spring.target = max > 0 ? Math.min(1, Math.max(0, scrollY / max)) : 0;
}
addEventListener('scroll', readScroll, { passive: true });

// Reduced motion: no camera travel; cut between fixed shots with a short cross-fade.
const SHOTS = [0, 0.24, 0.42, 0.58, 0.72, 0.9, 1];
let shownShot = 0;
function shotFor(p) { let s = 0; for (let i = 0; i < SHOTS.length; i++) if (p >= SHOTS[i] - 0.02) s = i; return s; }

// ---------------------------------------------------------------------------
// UI: panels, steps, chapters, progress
// ---------------------------------------------------------------------------
const panels = [...document.querySelectorAll('.panel')].map((el) => ({ el, a: +el.dataset.in, b: +el.dataset.out }));
const steps = [...document.querySelectorAll('.steps li')].map((el) => ({ el, at: +el.dataset.at }));
const chapterBtns = [...document.querySelectorAll('.chapters button')];
const bar = document.querySelector('.progress i');
const FADE = 0.025;
const smooth = (e0, e1, x) => { const t = Math.min(1, Math.max(0, (x - e0) / (e1 - e0))); return t * t * (3 - 2 * t); };

function updateUI(p) {
  bar.style.transform = `scaleX(${p})`;
  for (const pn of panels) {
    const aIn = pn.a <= 0 ? 1 : smooth(pn.a - FADE, pn.a + FADE, p);
    const aOut = pn.b >= 1 ? 1 : 1 - smooth(pn.b - FADE, pn.b + FADE, p);
    const o = Math.min(aIn, aOut);
    const dir = aIn < 1 ? 1 : -1; // enter from below, exit upward
    const s = pn.el.style;
    s.opacity = o.toFixed(3);
    s.visibility = o > 0.001 ? 'visible' : 'hidden';
    if (reduceMotion) { s.transform = 'none'; s.filter = 'none'; }
    else {
      s.transform = `translateY(${(dir * (1 - o) * 28).toFixed(1)}px) scale(${(0.98 + o * 0.02).toFixed(4)})`;
      s.filter = o < 0.999 ? `blur(${((1 - o) * 10).toFixed(1)}px)` : 'none';
    }
    pn.el.classList.toggle('live', o > 0.5);
  }
  for (const st of steps) st.el.classList.toggle('on', p >= st.at);
  const marks = chapterBtns.map((b) => +b.dataset.jump);
  let cur = 0;
  marks.forEach((m, i) => { if (p >= m - 0.03) cur = i; });
  chapterBtns.forEach((b, i) => b.setAttribute('aria-current', String(i === cur)));
}

document.querySelectorAll('[data-jump]').forEach((el) => {
  el.addEventListener('click', (e) => {
    e.preventDefault();
    const max = document.documentElement.scrollHeight - innerHeight;
    scrollTo({ top: +el.dataset.jump * max, behavior: reduceMotion ? 'auto' : 'smooth' });
  });
});

// ---------------------------------------------------------------------------
// Scene state driven by progress
// ---------------------------------------------------------------------------
const easeOut = (t) => 1 - (1 - t) ** 3;
const seg = (p, a, b) => Math.min(1, Math.max(0, (p - a) / (b - a)));
const raw = new THREE.Color(0xead9b5), baked = new THREE.Color(0xc98a3e);
const cheeseRaw = new THREE.Color(0xfbf6e8), cheeseBaked = new THREE.Color(0xf3d9a0);
const sauceRaw = new THREE.Color(0xb3200f), sauceBaked = new THREE.Color(0x8e1a0b);

function applyProgress(p, time) {
  // Door swings open as you reach it.
  doorPivot.rotation.y = -easeOut(seg(p, 0.25, 0.34)) * 1.55;

  // Fog and ambient shift from cool street to warm room.
  const inside = smooth(0.3, 0.42, p);
  scene.fog.color.copy(OUT_FOG).lerp(IN_FOG, inside);
  scene.fog.density = 0.02 - inside * 0.012;
  hemi.intensity = 0.9 - inside * 0.55;
  hemi.color.setHex(0x5a6aa8).lerp(new THREE.Color(0xffc89a), inside);

  // Pizza assembly
  const stretch = easeOut(seg(p, 0.6, 0.67));
  const sc = 0.55 + stretch * 0.45;
  dough.scale.set(sc, 1, sc);
  crust.scale.set(sc, sc, 1);
  pizza.rotation.y = stretch * Math.PI * 1.5 + seg(p, 0.67, 0.84) * 0.6;
  const sp = easeOut(seg(p, 0.67, 0.72));
  sauce.scale.setScalar(Math.max(0.001, sp * sc));
  sauce.visible = sp > 0.001;
  cheese.forEach((m) => {
    const t = seg(p, 0.71 + m.userData.i * 0.006, 0.745 + m.userData.i * 0.006);
    const e = easeOut(t);
    m.visible = t > 0;
    m.position.set(m.userData.x, 0.05 + (1 - e) * 0.9, m.userData.z);
    const squash = 0.35 + (1 - e) * 0.5;
    m.scale.set(1, squash, 1);
  });
  basil.forEach((m, i) => {
    const t = seg(p, 0.775 + i * 0.008, 0.81 + i * 0.008);
    const e = easeOut(t);
    m.visible = t > 0;
    m.position.set(m.userData.x, 0.075 + (1 - e) * 0.7, m.userData.z);
    m.rotation.set(-Math.PI / 2 + (1 - e) * 1.8, 0, m.userData.rot + (1 - e) * 3);
  });

  // Travel to the oven on the peel
  const travel = smooth(0.84, 0.93, p);
  const dest = V(0, 1.06, -19.55);
  pizza.position.lerpVectors(PIZZA_HOME, dest, travel);
  pizza.position.y += Math.sin(travel * Math.PI) * 0.35;
  peel.visible = travel > 0.001 && travel < 1;
  peel.position.copy(pizza.position).add(V(0, -0.02, 0));
  peel.rotation.y = 0;

  // Bake
  const bake = smooth(0.92, 0.99, p);
  doughMat.color.copy(raw).lerp(baked, bake);
  cheeseMat.color.copy(cheeseRaw).lerp(cheeseBaked, bake * 0.7);
  sauceMat.color.copy(sauceRaw).lerp(sauceBaked, bake);
  pizzaGlow.material.opacity = bake * 0.55;

  // Fire grows as the pizza goes in
  const fire = 1 + travel * 0.2 + bake * 0.1;
  const flick = reduceMotion ? 1 : 0.85 + 0.1 * Math.sin(time * 11.3) + 0.06 * Math.sin(time * 23.7 + 1.3);
  fireLight.intensity = 24 * fire * flick;
  ovenGlow.material.opacity = 0.38 * fire * flick;
  flames.forEach((f) => {
    const u = f.userData;
    const k = reduceMotion ? 1 : 0.8 + 0.25 * Math.sin(time * 7 + u.phase) + 0.1 * Math.sin(time * 17 + u.phase * 2);
    const h = u.base * k * fire;
    f.scale.set(h * 0.55, h, 1);
    f.position.y = 1.08 + h / 2;
    f.position.x = u.x + (reduceMotion ? 0 : Math.sin(time * 3 + u.phase) * 0.03);
  });
  neonGlow.material.opacity = 0.42 + (reduceMotion ? 0 : 0.03 * Math.sin(time * 40) * (Math.sin(time * 0.7) > 0.96 ? 4 : 0));
  candles.forEach((c, i) => { c.material.opacity = 0.8 + (reduceMotion ? 0 : 0.15 * Math.sin(time * 9 + i * 2)); });
}

// ---------------------------------------------------------------------------
// Resize + loop
// ---------------------------------------------------------------------------
function resize() {
  const w = innerWidth, h = innerHeight;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.fov = w / h < 0.8 ? 68 : 52;
  camera.updateProjectionMatrix();
}
addEventListener('resize', () => { resize(); readScroll(); });
resize();
readScroll();
spring.x = spring.target;

const clock = new THREE.Clock();
let first = true;
function frame() {
  const dt = Math.min(clock.getDelta(), 1 / 30);
  const time = clock.elapsedTime;

  // Spring step (semi-implicit Euler, substepped for stability)
  if (reduceMotion) { spring.x = spring.target; spring.v = 0; }
  else {
    const n = 4, h = dt / n;
    for (let i = 0; i < n; i++) {
      const a = -K * (spring.x - spring.target) - C * spring.v;
      spring.v += a * h;
      spring.x += spring.v * h;
    }
  }
  const p = Math.min(1, Math.max(0, spring.x));

  // Camera
  let camP = p;
  if (reduceMotion) {
    const s = shotFor(p);
    if (s !== shownShot) {
      canvas.classList.add('cut');
      setTimeout(() => { shownShot = s; canvas.classList.remove('cut'); }, 170);
    }
    camP = SHOTS[shownShot];
  }
  const u = curveU(camP);
  posCurve.getPoint(u, tmpP);
  lookCurve.getPoint(u, tmpL);
  if (!reduceMotion) {
    // tiny breathing sway, like a handheld walk
    tmpP.y += Math.sin(time * 1.3) * 0.015 + Math.sin(spring.x * 260) * 0.01 * Math.min(1, Math.abs(spring.v) * 6);
  }
  camera.position.copy(tmpP);
  camera.lookAt(tmpL);

  applyProgress(p, time);
  updateUI(p);

  // Car loops along the road
  if (!reduceMotion) car.position.x = ((time * 9) % 110) - 55;
  car.visible = !reduceMotion && p < 0.4;

  // Embers
  if (p > 0.55) {
    for (let i = 0; i < EMBERS; i++) {
      emberPos[i * 3 + 1] += emberVel[i] * dt * (reduceMotion ? 0.2 : 1);
      emberPos[i * 3] += Math.sin(time * 2 + i) * 0.002;
      if (emberPos[i * 3 + 1] > 3.8) resetEmber(i, false);
    }
    emberGeo.attributes.position.needsUpdate = true;
  }

  renderer.render(scene, camera);
  if (first) { first = false; canvas.classList.add('ready'); }
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
