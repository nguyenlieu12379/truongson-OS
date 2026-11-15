// Scroll walkthrough engine. Loads the building modelled in Blender (spec.model, a .glb from
// assets/blender/build_model.py) and walks the camera through it as the page scrolls.
// spec.js holds the route, door timing and styles; site.js holds per-room scroll animation.
//
// Coordinates: metres. x = right, y = up, z = toward the street / front of the building.
// The front facade sits on the building's max z edge. The camera starts outside at +z.
import * as THREE from './three.module.min.js';
import { GLTFLoader } from './GLTFLoader.js';

export { THREE };
export const V = (x, y, z) => new THREE.Vector3(x, y, z);
const rand = (a, b) => a + Math.random() * (b - a);
const clamp01 = (x) => Math.min(1, Math.max(0, x));
export const seg = (p, a, b) => clamp01((p - a) / (b - a));
export const smooth = (a, b, x) => { const t = seg(x, a, b); return t * t * (3 - 2 * t); };
export const easeOut = (t) => 1 - (1 - t) ** 3;

// ---------------------------------------------------------------------------
// Procedural textures
// ---------------------------------------------------------------------------
export function canvasTex(w, h, draw, repeat = [1, 1]) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(repeat[0], repeat[1]);
  t.anisotropy = 4;
  return t;
}
const hex = (c) => '#' + c.getHexString();
const jitter = (base, h = 0.01, s = 0.06, l = 0.05) => hex(new THREE.Color(base).offsetHSL(rand(-h, h), rand(-s, s), rand(-l, l)));

export const TEX = {
  glow: () => canvasTex(128, 128, (g, w) => {
    const r = g.createRadialGradient(w / 2, w / 2, 0, w / 2, w / 2, w / 2);
    r.addColorStop(0, 'rgba(255,255,255,1)');
    r.addColorStop(0.2, 'rgba(255,255,255,0.55)');
    r.addColorStop(0.5, 'rgba(255,255,255,0.12)');
    r.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = r; g.fillRect(0, 0, w, w);
  }),
  brick: (base = '#7a3a28') => canvasTex(512, 512, (g, w, h) => {
    g.fillStyle = '#2a1712'; g.fillRect(0, 0, w, h);
    for (let y = 0, row = 0; y < h; y += 32, row++) for (let x = row % 2 ? -48 : 0; x < w; x += 96) {
      g.fillStyle = jitter(base, 0.015, 0.08, 0.06); g.fillRect(x + 3, y + 3, 90, 26);
    }
  }),
  wood: (base = '#6a4528') => canvasTex(512, 512, (g, w, h) => {
    for (let x = 0; x < w; x += 64) {
      g.fillStyle = jitter(base, 0, 0.05, 0.06); g.fillRect(x, 0, 64, h);
      g.strokeStyle = 'rgba(0,0,0,0.22)';
      for (let i = 0; i < 6; i++) { const gx = x + rand(6, 58); g.beginPath(); g.moveTo(gx, 0); g.bezierCurveTo(gx + rand(-6, 6), h / 3, gx + rand(-6, 6), h * 0.66, gx, h); g.stroke(); }
      g.fillStyle = 'rgba(0,0,0,0.45)'; g.fillRect(x, 0, 2, h); g.fillRect(x, rand(0, h), 64, 2);
    }
  }),
  tile: (base = '#e9e4da', grout = '#b9b1a3', n = 8) => canvasTex(512, 512, (g, w, h) => {
    g.fillStyle = grout; g.fillRect(0, 0, w, h);
    const s = w / n;
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) { g.fillStyle = jitter(base, 0, 0, 0.025); g.fillRect(x * s + 2, y * s + 2, s - 4, s - 4); }
  }),
  checker: (a = '#f2ede4', b = '#1e1b18', n = 8) => canvasTex(256, 256, (g, w) => {
    const s = w / n;
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) { g.fillStyle = (x + y) % 2 ? a : b; g.fillRect(x * s, y * s, s, s); }
  }),
  concrete: (base = '#8d8b86') => canvasTex(512, 512, (g, w, h) => {
    g.fillStyle = base; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 6000; i++) { g.fillStyle = `rgba(0,0,0,${rand(0, 0.08)})`; g.fillRect(rand(0, w), rand(0, h), 2, 2); }
  }),
  plaster: (base = '#e8e1d4') => canvasTex(256, 256, (g, w, h) => {
    g.fillStyle = base; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 2500; i++) { g.fillStyle = `rgba(0,0,0,${rand(0, 0.03)})`; g.fillRect(rand(0, w), rand(0, h), 3, 3); }
  }),
  marble: () => canvasTex(512, 256, (g, w, h) => {
    g.fillStyle = '#ecebe8'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 40; i++) {
      g.strokeStyle = `rgba(120,120,130,${rand(0.05, 0.25)})`; g.lineWidth = rand(0.5, 2);
      let x = rand(0, w), y = rand(0, h); g.beginPath(); g.moveTo(x, y);
      for (let k = 0; k < 6; k++) { x += rand(-60, 80); y += rand(-30, 30); g.lineTo(x, y); }
      g.stroke();
    }
  }),
  grass: () => canvasTex(512, 512, (g, w, h) => {
    g.fillStyle = '#3d5a2a'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 9000; i++) { g.fillStyle = `hsla(${rand(80, 110)},40%,${rand(20, 40)}%,0.6)`; g.fillRect(rand(0, w), rand(0, h), 1.5, 4); }
  }),
  asphalt: () => canvasTex(512, 512, (g, w, h) => {
    g.fillStyle = '#1b1c20'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 9000; i++) { const v = rand(15, 60) | 0; g.fillStyle = `rgba(${v},${v},${v + 4},${rand(0.2, 0.6)})`; g.fillRect(rand(0, w), rand(0, h), 1.5, 1.5); }
  }),
  windows: (cols, rows, lit = 0.45) => canvasTex(256, 512, (g, w, h) => {
    g.fillStyle = '#000'; g.fillRect(0, 0, w, h);
    const cw = w / cols, rh = h / rows;
    for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
      if (Math.random() > lit) continue;
      g.fillStyle = Math.random() > 0.3 ? `hsl(${rand(28, 42)},90%,${rand(45, 70)}%)` : `hsl(${rand(200, 220)},50%,${rand(50, 70)}%)`;
      g.fillRect(x * cw + cw * 0.22, y * rh + rh * 0.2, cw * 0.56, rh * 0.55);
    }
  }),
  // Text sign (neon or painted). style: 'neon' | 'paint'
  sign: (text, { sub = '', color = '#ffb27a', glowColor = '#ff6a2b', font = 'italic 600 128px Georgia, serif', style = 'neon' } = {}) =>
    canvasTex(1024, 256, (g, w, h) => {
      g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = font;
      if (style === 'neon') {
        g.shadowColor = glowColor;
        for (const b of [40, 20, 8]) { g.shadowBlur = b; g.fillStyle = color; g.fillText(text, w / 2, h / 2 - (sub ? 10 : 0)); }
        g.shadowBlur = 0; g.fillStyle = '#fff6ec';
      } else g.fillStyle = color;
      g.fillText(text, w / 2, h / 2 - (sub ? 10 : 0));
      if (sub) { g.font = '600 28px -apple-system, Helvetica, Arial, sans-serif'; g.fillStyle = 'rgba(255,235,215,0.9)'; g.fillText(sub, w / 2, h - 30); }
    }),
  // Board with title + lines (menu, house rules, price list)
  board: (title, lines = [], { bg = '#16191a', ink = '#f3ead8', frame = '#6b5a3f' } = {}) => canvasTex(512, 640, (g, w, h) => {
    g.fillStyle = bg; g.fillRect(0, 0, w, h);
    g.strokeStyle = frame; g.lineWidth = 14; g.strokeRect(7, 7, w - 14, h - 14);
    g.fillStyle = ink; g.textAlign = 'center'; g.font = 'italic 56px Georgia, serif'; g.fillText(title, w / 2, 100);
    g.font = '30px Georgia, serif';
    lines.forEach((l, i) => {
      const [a, b] = Array.isArray(l) ? l : [l, ''];
      g.textAlign = 'left'; g.fillText(a, 60, 190 + i * 70);
      if (b !== '') { g.textAlign = 'right'; g.fillText(String(b), w - 60, 190 + i * 70); }
    });
  }),
};

// Named materials for spec strings like "wood", "tile:#2b2b2e", "brick:#8a4a32", "#d9cdb8".
const MAT_CACHE = new Map();
export function material(def, repeat = [1, 1]) {
  if (def && typeof def === 'object' && def.isMaterial) return def;
  const key = `${def}|${repeat}`;
  if (MAT_CACHE.has(key)) return MAT_CACHE.get(key);
  const m = makeMaterial(def, repeat);
  MAT_CACHE.set(key, m);
  return m;
}
function makeMaterial(def, repeat) {
  const [kind, arg] = String(def || '#cccccc').split(':');
  const std = (o) => new THREE.MeshStandardMaterial(o);
  let m;
  switch (kind) {
    case 'wood': m = std({ map: TEX.wood(arg), roughness: 0.55 }); break;
    case 'tile': m = std({ map: TEX.tile(arg || '#e9e4da', '#9d968a', 10), roughness: 0.35 }); break;
    case 'darktile': m = std({ map: TEX.tile(arg || '#2b2b2e', '#141416', 10), roughness: 0.4 }); break;
    case 'checker': m = std({ map: TEX.checker(), roughness: 0.5 }); break;
    case 'brick': m = std({ map: TEX.brick(arg), roughness: 0.9 }); break;
    case 'concrete': m = std({ map: TEX.concrete(arg), roughness: 0.85 }); break;
    case 'plaster': m = std({ map: TEX.plaster(arg), roughness: 0.95 }); break;
    case 'marble': m = std({ map: TEX.marble(), roughness: 0.2 }); break;
    case 'grass': m = std({ map: TEX.grass(), roughness: 1 }); break;
    case 'brass': m = std({ color: 0xb08a4a, roughness: 0.35, metalness: 0.8 }); break;
    case 'steel': m = std({ color: 0xc9ced3, roughness: 0.28, metalness: 0.55 }); break;
    case 'black': m = std({ color: 0x1b1b1d, roughness: 0.4, metalness: 0.6 }); break;
    case 'photo': {
      // Real photo on a surface. spec string: 'photo:assets/photos/<file>.jpg'. The photo is
      // cropped and straightened to the surface beforehand, so it is mapped once (no tiling).
      const tex = new THREE.TextureLoader().load(arg);
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.anisotropy = 4;
      tex.userData.photo = true;
      return std({ map: tex, roughness: 0.75 });
    }
    default: m = std({ color: new THREE.Color(kind), roughness: 0.85 });
  }
  if (m.map) m.map.repeat.set(repeat[0], repeat[1]);
  return m;
}

// ---------------------------------------------------------------------------
// Engine
// ---------------------------------------------------------------------------
export async function createWalkthrough({ canvas, spec, site }) {
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = spec.exposure ?? 1.05;

  const scene = new THREE.Scene();
  const theme = { ...SKY[spec.sky || 'day'], ...(spec.theme || {}) };
  const OUT_FOG = new THREE.Color(theme.fogOutside), IN_FOG = new THREE.Color(theme.fogInside);
  scene.fog = new THREE.FogExp2(OUT_FOG.clone(), theme.fogDensity);
  const camera = new THREE.PerspectiveCamera(52, 1, 0.05, 1500);
  const glowTex = TEX.glow();
  
  // ---- helpers handed to site.js
  function box(x0, x1, y0, y1, z0, z1, mat, parent = scene) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(Math.abs(x1 - x0), Math.abs(y1 - y0), Math.abs(z1 - z0)), material(mat));
    m.position.set((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2);
    parent.add(m);
    return m;
  }
  function glow(color, size, pos, opacity = 1, parent = scene) {
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color, transparent: true, opacity, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false, fog: false }));
    s.scale.set(size, size, 1); s.position.copy(pos); parent.add(s);
    return s;
  }
  function light(color, intensity, distance, pos) {
    const l = new THREE.PointLight(color, intensity, distance, 2);
    l.position.copy(pos); scene.add(l);
    return l;
  }
  function plane(w, h, mat, pos, rot = [0, 0, 0], parent = scene) {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), material(mat));
    m.position.copy(pos); m.rotation.set(...rot); parent.add(m);
    return m;
  }

  // ---- sky
  const sky = new THREE.Mesh(new THREE.SphereGeometry(1000, 32, 16), new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false,
    uniforms: { top: { value: new THREE.Color(theme.skyTop) }, mid: { value: new THREE.Color(theme.skyMid) }, hor: { value: new THREE.Color(theme.skyHorizon) } },
    vertexShader: 'varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0); }',
    fragmentShader: `uniform vec3 top, mid, hor; varying vec3 vP;
      void main(){ float h = clamp(vP.y,-0.2,1.0);
        vec3 c = mix(hor, mid, smoothstep(0.0,0.18,h)); c = mix(c, top, smoothstep(0.15,0.6,h));
        c = mix(vec3(0.03,0.03,0.05), c, smoothstep(-0.06,0.01,h));
        gl_FragColor = vec4(c,1.0); }`,
  }));
  scene.add(sky);
  if (theme.stars) {
    const n = 400, pos = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) { const th = rand(0, 6.283), ph = rand(0.25, 1.3); pos.set([Math.cos(th) * Math.cos(ph) * 900, Math.sin(ph) * 900, Math.sin(th) * Math.cos(ph) * 900], i * 3); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    scene.add(new THREE.Points(g, new THREE.PointsMaterial({ color: 0xffffff, size: 3, fog: false, transparent: true, opacity: 0.7 })));
  }
  const hemi = new THREE.HemisphereLight(theme.hemiSky, theme.hemiGround, theme.hemiIntensity);
  scene.add(hemi);
  if (theme.sun) {
    const sun = new THREE.DirectionalLight(0xfff1d8, theme.sun);
    sun.position.set(-20, 30, 25); scene.add(sun);
  }

  // ---- the building: one glTF exported from Blender (assets/blender/build_model.py).
  // Walls, floors, furniture, ground, photos on surfaces and room lights all come from the model.
  const gltf = await new GLTFLoader().loadAsync(spec.model);
  const model = gltf.scene;
  scene.add(model);
  const byName = new Map();
  const upper = [];        // role 'upper' (roof, ceilings): hidden while the dollhouse camera is above
  const styleMats = new Map();  // materials named after a style key (wall, floor, ceiling, fabric, wood, accent)
  const styleObjs = [];    // objects with a 'style' extra, shown only in that style
  const glass = new THREE.MeshPhysicalMaterial({ color: 0x9fb7c9, roughness: 0.05, transparent: true, opacity: 0.12, depthWrite: false });
  const roleOf = (o) => { for (let n = o; n; n = n.parent) if (n.userData?.role) return n.userData.role; return undefined; };
  model.traverse((o) => {
    if (o.name) byName.set(o.name, o);
    if (o.userData.role === 'upper') upper.push(o);
    if (o.userData.style) styleObjs.push(o);
    if (o.isLight) { o.intensity *= spec.lightScale ?? 1; o.castShadow = false; if (!o.distance) o.distance = spec.lightDistance ?? 9; }
    if (!o.isMesh) return;
    const mats = Array.isArray(o.material) ? o.material : [o.material];
    const swapped = mats.map((m) => {
      const key = (m.name || '').toLowerCase();
      if (key.startsWith('glass')) return glass;
      if (STYLE_KEYS.includes(key) && !styleMats.has(key)) styleMats.set(key, m);
      return m;
    });
    o.material = Array.isArray(o.material) ? swapped : swapped[0];
  });

  // ---- bounds of the building (everything except the site ground and sea), and ceiling height
  const box3 = new THREE.Box3(), tmpBox = new THREE.Box3();
  model.updateMatrixWorld(true);
  model.traverse((o) => { if (o.isMesh && roleOf(o) !== 'site') box3.union(tmpBox.setFromObject(o)); });
  const B = { x0: box3.min.x, x1: box3.max.x, z0: box3.min.z, z1: box3.max.z, y0: box3.min.y, y1: box3.max.y };
  let H = spec.ceilingY;
  if (H === undefined) { H = Infinity; for (const u of upper) H = Math.min(H, tmpBox.setFromObject(u).min.y); if (!isFinite(H)) H = box3.max.y; }

  // ---- doors: model objects with role 'door' (origin on the hinge). Timing lives in spec.doors.
  // { Door_Front: { opensAt: [0.22, 0.31], angle: 1.6 } } swings about the hinge (+angle opens inward);
  // { Door_Rear_Slider: { opensAt: [...], slide: -2.3 } } slides along x by that many metres.
  const doors = [];
  for (const [name, d] of Object.entries(spec.doors || {})) {
    const o = byName.get(name);
    if (!o) { console.warn(`spec.doors: no object named ${name} in the model`); continue; }
    doors.push({ o, ...d, rot0: o.rotation.y, x0: o.position.x });
  }

  // ---- site-specific animation (site.js). The model is already built, so site.js only animates it.
  const initialStyle = spec.styles ? Object.keys(spec.styles)[0] : undefined;
  const ctx = { THREE, scene, camera, spec, model, get: (n) => byName.get(n), V, H, B, seg, smooth, easeOut, reduceMotion, TEX, material, box, glow, light, plane, style: initialStyle };
  const siteUpdate = site?.build?.(ctx) || (() => {});

  // Style switch: recolour the style materials and show only that style's objects.
  function applyStyle(name) {
    const s = spec.styles?.[name];
    if (!s) return;
    for (const [key, m] of styleMats) if (s[key]) m.color.set(s[key]);
    for (const o of styleObjs) o.visible = o.userData.style === name;
    ctx.style = name;
    site?.style?.(ctx, name);
  }
  applyStyle(initialStyle);
  // Short fade between styles (same .cut class as reduced motion). Instant with reduced motion.
  function setStyle(name) {
    if (!spec.styles?.[name] || name === ctx.style) return;
    if (reduceMotion) { applyStyle(name); return; }
    canvas.classList.add('cut');
    setTimeout(() => { applyStyle(name); canvas.classList.remove('cut'); }, 170);
  }

  // ---- camera path from spec.stops
  const stops = spec.stops;
  const posCurve = new THREE.CatmullRomCurve3(stops.map((s) => V(...s.pos)), false, 'centripetal');
  const lookCurve = new THREE.CatmullRomCurve3(stops.map((s) => V(...s.look)), false, 'centripetal');
  const tmpP = new THREE.Vector3(), tmpL = new THREE.Vector3();
  const curveU = (p) => {
    const n = stops.length;
    if (p <= stops[0].p) return 0;
    if (p >= stops[n - 1].p) return 1;
    let i = 0;
    while (i < n - 2 && p > stops[i + 1].p) i++;
    const t = (p - stops[i].p) / (stops[i + 1].p - stops[i].p);
    return (i + (t * t * (3 - 2 * t) * 0.35 + t * 0.65)) / (n - 1);
  };
  const insideFrom = spec.insideAt ?? [0.3, 0.42];

  // ---- scroll spring (critically damped, interruptible, carries velocity)
  const spring = { x: 0, v: 0, target: 0 };
  const RESPONSE = 0.55, K = (2 * Math.PI / RESPONSE) ** 2, C = 2 * Math.sqrt(K);
  const readScroll = () => {
    const max = document.documentElement.scrollHeight - innerHeight;
    spring.target = max > 0 ? clamp01(scrollY / max) : 0;
  };
  addEventListener('scroll', readScroll, { passive: true });

  // Reduced motion: cut between the stops with a short cross-fade instead of travelling.
  const SHOTS = stops.map((s) => s.p);
  let shownShot = 0;
  const shotFor = (p) => { let s = 0; SHOTS.forEach((sp, i) => { if (p >= sp - 0.02) s = i; }); return s; };

  // ---- UI
  const panels = [...document.querySelectorAll('.panel')].map((el) => ({ el, a: +el.dataset.in, b: +el.dataset.out }));
  const steps = [...document.querySelectorAll('[data-at]')].map((el) => ({ el, at: +el.dataset.at }));
  const chapterBtns = [...document.querySelectorAll('.chapters button')];
  const bar = document.querySelector('.progress i');
  const FADE = 0.025;
  function updateUI(p) {
    if (bar) bar.style.transform = `scaleX(${p})`;
    for (const pn of panels) {
      const aIn = pn.a <= 0 ? 1 : smooth(pn.a - FADE, pn.a + FADE, p);
      const aOut = pn.b >= 1 ? 1 : 1 - smooth(pn.b - FADE, pn.b + FADE, p);
      const o = Math.min(aIn, aOut), dir = aIn < 1 ? 1 : -1, s = pn.el.style;
      s.opacity = o.toFixed(3);
      s.visibility = o > 0.001 ? 'visible' : 'hidden';
      if (reduceMotion) { s.transform = 'none'; s.filter = 'none'; } else {
        s.transform = `translateY(${(dir * (1 - o) * 28).toFixed(1)}px) scale(${(0.98 + o * 0.02).toFixed(4)})`;
        s.filter = o < 0.999 ? `blur(${((1 - o) * 10).toFixed(1)}px)` : 'none';
      }
      pn.el.classList.toggle('live', o > 0.5);
    }
    for (const st of steps) st.el.classList.toggle('on', p >= st.at);
    let cur = 0;
    chapterBtns.forEach((b, i) => { if (p >= +b.dataset.jump - 0.03) cur = i; });
    chapterBtns.forEach((b, i) => b.setAttribute('aria-current', String(i === cur)));
  }
  document.querySelectorAll('[data-jump]').forEach((el) => el.addEventListener('click', (e) => {
    e.preventDefault();
    const max = document.documentElement.scrollHeight - innerHeight;
    scrollTo({ top: +el.dataset.jump * max, behavior: reduceMotion ? 'auto' : 'smooth' });
  }));

  // ---- style switch (only when spec.styles exists; see index.html .styles)
  const styleBar = document.querySelector('.styles');
  const styleBtns = [...document.querySelectorAll('[data-style]')];
  if (styleBar) styleBar.hidden = !spec.styles;
  const markStyle = (name) => styleBtns.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.style === name)));
  styleBtns.forEach((b) => b.addEventListener('click', () => { setStyle(b.dataset.style); markStyle(b.dataset.style); }));
  markStyle(ctx.style);

  // ---- resize + loop
  function resize() {
    renderer.setSize(innerWidth, innerHeight, false);
    camera.aspect = innerWidth / innerHeight;
    camera.fov = camera.aspect < 0.8 ? 68 : 52;
    camera.updateProjectionMatrix();
  }
  addEventListener('resize', () => { resize(); readScroll(); });
  resize(); readScroll(); spring.x = spring.target;

  const clock = new THREE.Clock();
  let first = true;
  function frame() {
    const dt = Math.min(clock.getDelta(), 1 / 30), time = clock.elapsedTime;
    if (reduceMotion) { spring.x = spring.target; spring.v = 0; } else {
      for (let i = 0, h = dt / 4; i < 4; i++) { const a = -K * (spring.x - spring.target) - C * spring.v; spring.v += a * h; spring.x += spring.v * h; }
    }
    const p = clamp01(spring.x);
    let camP = p;
    if (reduceMotion) {
      const s = shotFor(p);
      if (s !== shownShot) { canvas.classList.add('cut'); setTimeout(() => { shownShot = s; canvas.classList.remove('cut'); }, 170); }
      camP = SHOTS[shownShot];
    }
    const u = curveU(camP);
    posCurve.getPoint(u, tmpP); lookCurve.getPoint(u, tmpL);
    if (!reduceMotion) tmpP.y += Math.sin(time * 1.3) * 0.012;
    camera.position.copy(tmpP); camera.lookAt(tmpL);
    if (spec.mode === 'dollhouse-open') { const above = tmpP.y > H + 0.5; for (const m of upper) m.visible = !above; }

    for (const d of doors) {
      const t = d.opensAt ? easeOut(seg(p, d.opensAt[0], d.opensAt[1])) : 1;
      if (d.slide !== undefined) d.o.position.x = d.x0 + d.slide * t;
      else d.o.rotation.y = d.rot0 + (d.angle ?? 1.5) * t;
    }
    const inside = smooth(insideFrom[0], insideFrom[1], p);
    scene.fog.color.copy(OUT_FOG).lerp(IN_FOG, inside);
    scene.fog.density = theme.fogDensity * (1 - inside * 0.6);
    hemi.intensity = theme.hemiIntensity * (1 - inside * 0.55);

    siteUpdate(p, time, dt);
    updateUI(p);
    renderer.render(scene, camera);
    if (first) { first = false; canvas.classList.add('ready'); }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
  return ctx;
}

// ---------------------------------------------------------------------------
// Sky presets
// ---------------------------------------------------------------------------
const SKY = {
  dusk: { skyTop: '#05070f', skyMid: '#2e2152', skyHorizon: '#f26b38', fogOutside: '#0b1020', fogInside: '#1a0f08', fogDensity: 0.02, hemiSky: '#5a6aa8', hemiGround: '#1a120c', hemiIntensity: 0.9, stars: true },
  night: { skyTop: '#02030a', skyMid: '#0b1030', skyHorizon: '#2a2a50', fogOutside: '#06080f', fogInside: '#140d08', fogDensity: 0.022, hemiSky: '#3a4470', hemiGround: '#0e0a08', hemiIntensity: 0.6, stars: true },
  day: { skyTop: '#3d7fd6', skyMid: '#8fc1f0', skyHorizon: '#f3efe6', fogOutside: '#cfe0ee', fogInside: '#efe6d8', fogDensity: 0.008, hemiSky: '#cfe6ff', hemiGround: '#8a7a64', hemiIntensity: 1.6, sun: 2.4, stars: false },
  golden: { skyTop: '#2c4f8a', skyMid: '#c98a6a', skyHorizon: '#ffc27a', fogOutside: '#c99a7a', fogInside: '#3a2414', fogDensity: 0.012, hemiSky: '#ffd6a8', hemiGround: '#3a2a1a', hemiIntensity: 1.2, sun: 1.6, stars: false },
};

const STYLE_KEYS = ['wall', 'floor', 'ceiling', 'fabric', 'wood', 'accent'];
