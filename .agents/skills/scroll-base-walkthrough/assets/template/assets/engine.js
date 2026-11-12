// Scroll walkthrough engine. Turns a floor-plan spec (spec.js) into a procedural three.js
// building and a scroll-driven camera walk. Site-specific furniture and animation live in site.js.
//
// Coordinates: metres. x = right, y = up, z = toward the street / front of the building.
// The front facade sits on the building's max z edge. The camera starts outside at +z.
import * as THREE from './three.module.min.js';

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
    default: m = std({ color: new THREE.Color(kind), roughness: 0.85 });
  }
  if (m.map) m.map.repeat.set(repeat[0], repeat[1]);
  return m;
}

// ---------------------------------------------------------------------------
// Engine
// ---------------------------------------------------------------------------
export function createWalkthrough({ canvas, spec, site }) {
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = spec.exposure ?? 1.05;

  const scene = new THREE.Scene();
  const theme = { ...SKY[spec.exterior?.sky || 'dusk'], ...(spec.theme || {}) };
  const OUT_FOG = new THREE.Color(theme.fogOutside), IN_FOG = new THREE.Color(theme.fogInside);
  scene.fog = new THREE.FogExp2(OUT_FOG.clone(), theme.fogDensity);
  const camera = new THREE.PerspectiveCamera(52, 1, 0.05, 400);
  const glowTex = TEX.glow();
  const H = spec.wallHeight ?? 3.2;
  const T = spec.wallThickness ?? 0.2;

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
  const sky = new THREE.Mesh(new THREE.SphereGeometry(200, 32, 16), new THREE.ShaderMaterial({
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
    for (let i = 0; i < n; i++) { const th = rand(0, 6.283), ph = rand(0.25, 1.3); pos.set([Math.cos(th) * Math.cos(ph) * 180, Math.sin(ph) * 180, Math.sin(th) * Math.cos(ph) * 180], i * 3); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    scene.add(new THREE.Points(g, new THREE.PointsMaterial({ color: 0xffffff, size: 0.6, fog: false, transparent: true, opacity: 0.7 })));
  }
  const hemi = new THREE.HemisphereLight(theme.hemiSky, theme.hemiGround, theme.hemiIntensity);
  scene.add(hemi);
  if (theme.sun) {
    const sun = new THREE.DirectionalLight(0xfff1d8, theme.sun);
    sun.position.set(-20, 30, 25); scene.add(sun);
  }

  // ---- bounds of the building
  const B = { x0: Infinity, x1: -Infinity, z0: Infinity, z1: -Infinity };
  for (const r of spec.rooms) { B.x0 = Math.min(B.x0, r.rect[0]); B.z0 = Math.min(B.z0, r.rect[1]); B.x1 = Math.max(B.x1, r.rect[2]); B.z1 = Math.max(B.z1, r.rect[3]); }

  // ---- exterior
  buildExterior(spec.exterior || {}, B, { box, glow, light, plane, scene, H });

  // ---- rooms: floor, ceiling, lights
  for (const r of spec.rooms) {
    const [x0, z0, x1, z1] = r.rect, w = x1 - x0, d = z1 - z0;
    const fm = material(r.floor || 'wood', [w / 3, d / 3]);
    plane(w, d, fm, V((x0 + x1) / 2, 0.006, (z0 + z1) / 2), [-Math.PI / 2, 0, 0]);
    plane(w, d, r.ceiling || '#1c1714', V((x0 + x1) / 2, H - 0.001, (z0 + z1) / 2), [Math.PI / 2, 0, 0]);
    const lc = r.light ?? '#ffcf9a';
    const n = Math.max(1, Math.round((w * d) / 30));
    for (let i = 0; i < n; i++) {
      const lx = x0 + (w * (i + 0.5)) / n, lz = (z0 + z1) / 2;
      light(lc, (r.lightIntensity ?? 14), Math.max(w, d) * 1.2, V(lx, H - 0.6, lz));
    }
  }
  // roof slab (seen from outside), sits above interior ceilings
  box(B.x0 - 0.3, B.x1 + 0.3, H, H + 0.35, B.z0 - 0.3, B.z1 + 0.3, spec.roof || '#2a2826');

  // ---- walls with openings
  const doors = [];
  const glass = new THREE.MeshPhysicalMaterial({ color: 0x9fb7c9, roughness: 0.05, transparent: true, opacity: 0.12, depthWrite: false });
  for (const wall of spec.walls) buildWall(wall);
  function buildWall(wall) {
    const [ax, az] = wall.from, [bx, bz] = wall.to;
    const len = Math.hypot(bx - ax, bz - az);
    const g = new THREE.Group();
    g.position.set(ax, 0, az);
    g.rotation.y = -Math.atan2(bz - az, bx - ax); // local +x runs from `from` to `to`
    scene.add(g);
    const th = wall.thickness ?? T, h = wall.height ?? H;
    // Two faces can have different finishes: inner/outer. Local -z side = "left" of the direction of travel.
    const mats = [material(wall.material || wall.inside || '#e8e1d4', [len / 3, h / 3]), material(wall.outside || wall.material || wall.inside || '#e8e1d4', [len / 3, h / 3])];
    const piece = (u0, u1, y0, y1) => {
      if (u1 - u0 < 0.001 || y1 - y0 < 0.001) return;
      const geo = new THREE.BoxGeometry(u1 - u0, y1 - y0, th);
      // box material order: +x, -x, +y, -y, +z, -z
      const m = new THREE.Mesh(geo, [mats[0], mats[0], mats[0], mats[0], mats[1], mats[0]]);
      m.position.set((u0 + u1) / 2, (y0 + y1) / 2, 0);
      g.add(m);
    };
    const ops = (wall.openings || []).map((o) => ({ ...o, u0: o.at - o.width / 2, u1: o.at + o.width / 2 })).sort((a, b) => a.u0 - b.u0);
    let u = 0;
    for (const o of ops) {
      piece(u, o.u0, 0, h);
      const top = o.height ?? (o.type === 'window' ? 2.4 : 2.2);
      const sill = o.type === 'window' ? (o.sill ?? 0.9) : 0;
      piece(o.u0, o.u1, top, h);
      if (sill > 0) piece(o.u0, o.u1, 0, sill);
      if (o.type === 'window') {
        const gl = new THREE.Mesh(new THREE.PlaneGeometry(o.width, top - sill), glass);
        gl.position.set(o.at, (sill + top) / 2, 0); g.add(gl);
        const frame = material(o.frame || 'black');
        const f = (x0, x1, y0, y1) => { const m = new THREE.Mesh(new THREE.BoxGeometry(x1 - x0, y1 - y0, th + 0.04), frame); m.position.set((x0 + x1) / 2, (y0 + y1) / 2, 0); g.add(m); };
        f(o.u0, o.u1, sill - 0.04, sill); f(o.u0, o.u1, top, top + 0.04); f(o.at - 0.025, o.at + 0.025, sill, top);
      }
      if (o.type === 'door') {
        // hinged leaf; opens over [opensAt[0], opensAt[1]] of scroll progress (or stays open)
        const pivot = new THREE.Group();
        pivot.position.set(o.hinge === 'right' ? o.u1 : o.u0, 0, 0);
        g.add(pivot);
        const leafW = o.width - 0.04;
        const dir = o.hinge === 'right' ? -1 : 1;
        const leafMat = material(o.material || '#2a221c');
        const leaf = new THREE.Group();
        pivot.add(leaf);
        const lb = (x0, x1, y0, y1, mat = leafMat) => { const m = new THREE.Mesh(new THREE.BoxGeometry(x1 - x0, y1 - y0, 0.05), mat); m.position.set(dir * (x0 + x1) / 2, (y0 + y1) / 2, 0); leaf.add(m); };
        if (o.glass) {
          lb(0, 0.1, 0, top); lb(leafW - 0.1, leafW, 0, top); lb(0, leafW, 0, 0.3); lb(0, leafW, top - 0.12, top);
          const dg = new THREE.Mesh(new THREE.PlaneGeometry(leafW - 0.2, top - 0.42), glass); dg.position.set(dir * leafW / 2, 0.3 + (top - 0.42) / 2, 0); leaf.add(dg);
        } else lb(0, leafW, 0, top);
        lb(leafW - 0.2, leafW - 0.14, 0.95, 1.1, material('brass'));
        doors.push({ pivot, dir, swing: o.swing ?? 1, opensAt: o.opensAt, angle: o.openAngle ?? 1.5 });
      }
      u = o.u1;
    }
    piece(u, len, 0, h);
  }

  // ---- site-specific content
  const ctx = { THREE, scene, camera, spec, box, glow, light, plane, material, TEX, V, H, B, seg, smooth, easeOut, reduceMotion, props: null };
  ctx.props = makeProps(ctx);
  const siteUpdate = site?.build?.(ctx) || (() => {});

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

    for (const d of doors) if (d.opensAt) d.pivot.rotation.y = d.dir * d.swing * easeOut(seg(p, d.opensAt[0], d.opensAt[1])) * d.angle;
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
  dusk: { skyTop: '#05070f', skyMid: '#2e2152', skyHorizon: '#f26b38', fogOutside: '#0b1020', fogInside: '#1a0f08', fogDensity: 0.02, hemiSky: '#5a6aa8', hemiGround: '#1a120c', hemiIntensity: 0.9, stars: true, streetLights: true },
  night: { skyTop: '#02030a', skyMid: '#0b1030', skyHorizon: '#2a2a50', fogOutside: '#06080f', fogInside: '#140d08', fogDensity: 0.022, hemiSky: '#3a4470', hemiGround: '#0e0a08', hemiIntensity: 0.6, stars: true, streetLights: true },
  day: { skyTop: '#3d7fd6', skyMid: '#8fc1f0', skyHorizon: '#f3efe6', fogOutside: '#cfe0ee', fogInside: '#efe6d8', fogDensity: 0.008, hemiSky: '#cfe6ff', hemiGround: '#8a7a64', hemiIntensity: 1.6, sun: 2.4, stars: false, streetLights: false },
  golden: { skyTop: '#2c4f8a', skyMid: '#c98a6a', skyHorizon: '#ffc27a', fogOutside: '#c99a7a', fogInside: '#3a2414', fogDensity: 0.012, hemiSky: '#ffd6a8', hemiGround: '#3a2a1a', hemiIntensity: 1.2, sun: 1.6, stars: false, streetLights: false },
};

// ---------------------------------------------------------------------------
// Exterior: 'street' (city frontage) or 'garden' (house / bnb with a lawn and path)
// ---------------------------------------------------------------------------
function buildExterior(ex, B, { box, glow, light, plane, scene, H }) {
  const kind = ex.kind || 'street';
  const cx = (B.x0 + B.x1) / 2;
  plane(400, 400, kind === 'garden' ? 'grass' : '#15161a', V(0, -0.02, 0), [-Math.PI / 2, 0, 0]).material.map?.repeat.set(60, 60);
  const lamps = ex.streetLights ?? !!(SKY[ex.sky || 'dusk'] || {}).streetLights;
  if (kind === 'street') {
    const front = B.z1;
    box(-60, 60, 0, 0.15, front, front + 6, 'concrete:#6a6a6e');
    const road = plane(120, 10, new THREE.MeshStandardMaterial({ map: TEX.asphalt(), color: 0x9a9aa2, roughness: 0.38, metalness: 0.1 }), V(0, 0.01, front + 11), [-Math.PI / 2, 0, 0]);
    road.material.map.repeat.set(16, 3);
    const dash = new THREE.MeshBasicMaterial({ color: 0xd8c27a });
    for (let x = -58; x < 58; x += 5) plane(2.4, 0.14, dash, V(x, 0.02, front + 11), [-Math.PI / 2, 0, 0]);
    box(-60, 60, 0, 0.15, front + 16, front + 22, 'concrete:#6a6a6e');
    if (ex.crosswalk !== false) for (let i = -3; i <= 3; i++) plane(0.55, 9, '#cfd0d4', V(cx + i, 0.02, front + 11), [-Math.PI / 2, 0, 0]);
    if (lamps) for (const lx of [B.x0 - 3, B.x1 + 3]) streetLamp(lx, front + 5.5, -1);
    if (ex.neighbours !== false) {
      const nb = (x0, x1, h, col) => {
        const em = new THREE.MeshStandardMaterial({ color: col, roughness: 0.85, emissive: 0xffffff, emissiveMap: TEX.windows(5, Math.round(h / 1.4)), emissiveIntensity: lamps ? 0.8 : 0.05 });
        const plain = new THREE.MeshStandardMaterial({ color: col, roughness: 0.85 });
        const m = new THREE.Mesh(new THREE.BoxGeometry(x1 - x0, h, 14), [plain, plain, plain, plain, em, plain]);
        m.position.set((x0 + x1) / 2, h / 2, front - 7); scene.add(m);
      };
      nb(B.x0 - 18.4, B.x0 - 0.4, 12, 0x3a3236); nb(B.x0 - 34, B.x0 - 18.8, 9, 0x2c2f38);
      nb(B.x1 + 0.4, B.x1 + 16, 11, 0x34363c); nb(B.x1 + 16.4, B.x1 + 34, 15, 0x2f2a2e);
    }
  } else {
    // garden: path to the door, hedges, a few trees, a fence line
    plane(1.4, 12, 'concrete:#b9b2a5', V(ex.pathX ?? cx, 0.01, B.z1 + 6), [-Math.PI / 2, 0, 0]);
    for (const s of [-1, 1]) for (let i = 0; i < 4; i++) {
      const t = new THREE.Mesh(new THREE.IcosahedronGeometry(rand(1, 1.6), 1), new THREE.MeshStandardMaterial({ color: 0x2c4a26, roughness: 0.9, flatShading: true }));
      t.position.set(cx + s * ((B.x1 - B.x0) / 2 + rand(3, 9)), rand(2, 3), B.z1 + rand(2, 14)); scene.add(t);
      box(t.position.x - 0.12, t.position.x + 0.12, 0, t.position.y - 0.8, t.position.z - 0.12, t.position.z + 0.12, '#4a3626');
    }
    for (let x = -20; x <= 20; x += 0.6) if (Math.abs(x - (ex.pathX ?? cx)) > 1.2) box(x - 0.04, x + 0.04, 0, 1, B.z1 + 12, B.z1 + 12.08, '#e8e2d6');
    if (lamps) for (const lx of [(ex.pathX ?? cx) - 1.2, (ex.pathX ?? cx) + 1.2]) {
      box(lx - 0.05, lx + 0.05, 0, 0.7, B.z1 + 3, B.z1 + 3.1, 'black');
      glow(0xffc27a, 0.8, V(lx, 0.75, B.z1 + 3.05), 0.9);
      light(0xffc98a, 3, 6, V(lx, 0.8, B.z1 + 3.05));
    }
  }
  // warm spill at the entrance
  light(0xffb070, 8, 9, V(ex.doorX ?? cx, 2.6, B.z1 + 1.2));
  if (ex.sign) {
    const s = ex.sign;
    const tex = TEX.sign(s.text, s);
    const m = new THREE.Mesh(new THREE.PlaneGeometry(s.width ?? 5, (s.width ?? 5) / 4), new THREE.MeshBasicMaterial({ map: tex, transparent: true, toneMapped: false, depthWrite: false }));
    m.position.set(s.x ?? cx, s.y ?? H + 0.9, B.z1 + 0.14); scene.add(m);
    if ((s.style ?? 'neon') === 'neon') { glow(new THREE.Color(s.glowColor || '#ff7a3a'), (s.width ?? 5) * 1.4, V(s.x ?? cx, s.y ?? H + 0.9, B.z1 + 0.6), 0.4); light(new THREE.Color(s.glowColor || '#ff8a4a'), 10, 10, V(s.x ?? cx, (s.y ?? H + 0.9) - 0.2, B.z1 + 1.4)); }
    else box((s.x ?? cx) - (s.width ?? 5) / 2 - 0.1, (s.x ?? cx) + (s.width ?? 5) / 2 + 0.1, (s.y ?? H + 0.9) - (s.width ?? 5) / 8 - 0.1, (s.y ?? H + 0.9) + (s.width ?? 5) / 8 + 0.1, B.z1 + 0.02, B.z1 + 0.1, s.board || '#1d2a24');
  }
  // facade parapet so the sign has a band to sit on
  box(B.x0 - 0.3, B.x1 + 0.3, H, H + (ex.parapet ?? 1.6), B.z1 - 0.2, B.z1 + 0.05, ex.facade || 'brick:#7a3a28').material.map?.repeat.set((B.x1 - B.x0) / 4, 1);

  function streetLamp(x, z, facing) {
    const mat = new THREE.MeshStandardMaterial({ color: 0x1c1d20, roughness: 0.5, metalness: 0.6 });
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.1, 5.2, 10), mat); pole.position.set(x, 2.6, z); scene.add(pole);
    const head = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.35, 0.25, 16), mat); head.position.set(x, 5.0, z + facing * 0.4); scene.add(head);
    glow(0xffc27a, 3, V(x, 4.85, z + facing * 0.4), 0.8);
    light(0xffc98a, 26, 16, V(x, 4.7, z + facing * 0.4));
  }
}

// ---------------------------------------------------------------------------
// Prop library. Every prop: (x, z, opts) placed on the floor, rot = rotation around y (radians).
// ---------------------------------------------------------------------------
function makeProps(ctx) {
  const { THREE, scene, glow, light, V } = ctx;
  const group = (x, z, rot = 0) => { const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = rot; scene.add(g); return g; };
  const b = (g, x0, x1, y0, y1, z0, z1, mat) => ctx.box(x0, x1, y0, y1, z0, z1, mat, g);
  const cyl = (g, r0, r1, h, mat, x, y, z, seg = 20) => { const m = new THREE.Mesh(new THREE.CylinderGeometry(r0, r1, h, seg), material(mat)); m.position.set(x, y, z); g.add(m); return m; };
  const candles = [];

  const P = {
    // round café/restaurant table with cloth or wood top
    table(x, z, { r = 0.6, top = 'checker', h = 0.76, candle = true, rot = 0 } = {}) {
      const g = group(x, z, rot);
      cyl(g, r, r, 0.05, top, 0, h, 0, 28); cyl(g, 0.05, 0.05, h - 0.02, 'black', 0, h / 2, 0, 8); cyl(g, 0.3, 0.3, 0.03, 'black', 0, 0.015, 0);
      if (candle) { cyl(g, 0.035, 0.035, 0.12, '#f2ead8', 0, h + 0.08, 0, 10); candles.push(glow(0xffb45a, 0.5, V(x, h + 0.2, z), 0.9)); }
      return g;
    },
    rectTable(x, z, { w = 1.4, d = 0.8, h = 0.76, top = 'wood', rot = 0 } = {}) {
      const g = group(x, z, rot);
      b(g, -w / 2, w / 2, h - 0.05, h, -d / 2, d / 2, top);
      for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) b(g, sx * (w / 2 - 0.08) - 0.03, sx * (w / 2 - 0.08) + 0.03, 0, h - 0.05, sz * (d / 2 - 0.08) - 0.03, sz * (d / 2 - 0.08) + 0.03, 'black');
      return g;
    },
    chair(x, z, { rot = 0, mat = '#3a2416' } = {}) {
      const g = group(x, z, rot);
      b(g, -0.22, 0.22, 0.44, 0.48, -0.22, 0.22, mat); b(g, -0.2, 0.2, 0.48, 1.0, 0.17, 0.23, mat);
      for (const [dx, dz] of [[-0.18, -0.18], [0.18, -0.18], [-0.18, 0.18], [0.18, 0.18]]) b(g, dx - 0.02, dx + 0.02, 0, 0.44, dz - 0.02, dz + 0.02, mat);
      return g;
    },
    // table with chairs on two sides (rot turns the whole set)
    tableSet(x, z, opts = {}) { const rot = opts.rot || 0; P.table(x, z, opts); for (const a of [0, Math.PI]) P.chair(x + Math.cos(a + rot) * 0.9, z - Math.sin(a + rot) * 0.9, { rot: a + rot + Math.PI / 2, mat: opts.chair }); },
    stool(x, z, { h = 0.75, mat = '#3a2416' } = {}) { const g = group(x, z); cyl(g, 0.18, 0.18, 0.05, mat, 0, h, 0); cyl(g, 0.025, 0.03, h, 'black', 0, h / 2, 0, 8); cyl(g, 0.2, 0.2, 0.02, 'black', 0, 0.01, 0); return g; },
    // counter / bar / kitchen island. length along local x
    counter(x, z, { w = 3, d = 0.7, h = 0.95, body = '#2a221c', top = 'marble', rot = 0 } = {}) {
      const g = group(x, z, rot); b(g, -w / 2, w / 2, 0, h - 0.05, -d / 2, d / 2, body); b(g, -w / 2 - 0.05, w / 2 + 0.05, h - 0.05, h, -d / 2 - 0.05, d / 2 + 0.05, top); return g;
    },
    shelf(x, z, { w = 2, levels = [1.4, 1.9, 2.4], rot = 0, items = 'bottles' } = {}) {
      const g = group(x, z, rot);
      const cols = items === 'bottles' ? [0x2c4a2a, 0x4a1a22, 0x1e2a3a] : items === 'jars' ? [0xc23a1a, 0xe6d6a0, 0x3d6b2f, 0xd9a441] : [0x8a5a3a, 0x2f4a6a, 0xd9c7a0, 0x6a2a2a];
      for (const y of levels) {
        b(g, -w / 2, w / 2, y - 0.03, y, -0.15, 0.15, '#3b2618');
        for (let u = -w / 2 + 0.12; u < w / 2 - 0.1; u += items === 'books' ? 0.07 : 0.22) {
          const c = new THREE.MeshStandardMaterial({ color: cols[(Math.random() * cols.length) | 0], roughness: items === 'bottles' ? 0.15 : 0.6 });
          if (items === 'books') { const hgt = rand(0.2, 0.3); b(g, u, u + 0.05, y, y + hgt, -0.1, 0.1, c); }
          else cyl(g, 0.07, 0.07, items === 'bottles' ? 0.36 : 0.26, c, u, y + (items === 'bottles' ? 0.18 : 0.13), 0, 10);
        }
      }
      return g;
    },
    pendant(x, z, { y = 2.5, color = 0xffc27a, ceiling = ctx.H, lightOn = false } = {}) {
      const g = group(x, z);
      cyl(g, 0.008, 0.008, ceiling - y - 0.15, 'black', 0, (ceiling + y + 0.15) / 2, 0, 4);
      const shade = new THREE.Mesh(new THREE.ConeGeometry(0.3, 0.28, 24, 1, true), new THREE.MeshStandardMaterial({ color: 0x2a2018, roughness: 0.35, metalness: 0.85, side: THREE.DoubleSide }));
      shade.position.set(0, y + 0.12, 0); g.add(shade);
      const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.07, 12, 8), new THREE.MeshBasicMaterial({ color: 0xffe0a8, toneMapped: false })); bulb.position.set(0, y, 0); g.add(bulb);
      glow(color, 1.3, V(x, y - 0.05, z), 0.75);
      if (lightOn) light(color, 6, 5, V(x, y - 0.2, z));
      return g;
    },
    plant(x, z, { size = 1, pot = '#c8b49a' } = {}) {
      const g = group(x, z);
      cyl(g, 0.22 * size, 0.17 * size, 0.4 * size, pot, 0, 0.2 * size, 0);
      const f = new THREE.Mesh(new THREE.IcosahedronGeometry(0.45 * size, 1), new THREE.MeshStandardMaterial({ color: 0x2f5a2a, roughness: 0.9, flatShading: true }));
      f.position.y = 0.85 * size; f.scale.y = 1.3; g.add(f);
      return g;
    },
    sofa(x, z, { w = 2.2, mat = '#6b6a5e', rot = 0 } = {}) {
      const g = group(x, z, rot);
      b(g, -w / 2, w / 2, 0.1, 0.45, -0.45, 0.45, mat); b(g, -w / 2, w / 2, 0.45, 0.9, 0.25, 0.45, mat);
      b(g, -w / 2, -w / 2 + 0.2, 0.45, 0.65, -0.45, 0.45, mat); b(g, w / 2 - 0.2, w / 2, 0.45, 0.65, -0.45, 0.45, mat);
      return g;
    },
    bed(x, z, { w = 1.6, l = 2.0, sheet = '#f1ede4', frame = '#5a3e28', throw: thr = '#a8643a', rot = 0 } = {}) {
      const g = group(x, z, rot);
      b(g, -w / 2, w / 2, 0, 0.3, -l / 2, l / 2, frame); b(g, -w / 2 + 0.03, w / 2 - 0.03, 0.3, 0.55, -l / 2 + 0.03, l / 2 - 0.03, sheet);
      b(g, -w / 2, w / 2, 0, 1.1, -l / 2 - 0.06, -l / 2, frame); // headboard at local -z
      b(g, -w / 2 + 0.1, -0.05, 0.55, 0.68, -l / 2 + 0.1, -l / 2 + 0.45, '#ffffff'); b(g, 0.05, w / 2 - 0.1, 0.55, 0.68, -l / 2 + 0.1, -l / 2 + 0.45, '#ffffff');
      b(g, -w / 2 - 0.01, w / 2 + 0.01, 0.4, 0.57, l / 2 - 0.6, l / 2 - 0.1, thr);
      return g;
    },
    rug(x, z, { w = 2.4, d = 1.6, color = '#8a5a3a', rot = 0 } = {}) { const g = group(x, z, rot); b(g, -w / 2, w / 2, 0.006, 0.016, -d / 2, d / 2, color); return g; },
    // framed board or art on a wall. normal = which way it faces: 'n','s','e','w'
    wallBoard(x, y, z, { w = 1.2, h = 1.5, normal = 's', tex = null, color = '#2a2a2a' } = {}) {
      const rot = { s: 0, n: Math.PI, e: Math.PI / 2, w: -Math.PI / 2 }[normal];
      const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshStandardMaterial({ map: tex, color: tex ? 0xffffff : color, roughness: 0.8 }));
      m.position.set(x, y, z); m.rotation.y = rot; scene.add(m);
      return m;
    },
    espressoMachine(x, z, { y = 0.95, rot = 0, body = '#b8bcc0' } = {}) {
      const g = group(x, z, rot); g.position.y = y;
      b(g, -0.38, 0.38, 0.02, 0.44, -0.24, 0.2, body);            // body
      b(g, -0.4, 0.4, 0, 0.03, -0.24, 0.3, 'black');               // drip tray
      b(g, -0.39, 0.39, 0.44, 0.47, -0.25, 0.21, 'black');         // cup warmer
      for (let i = 0; i < 4; i++) cyl(g, 0.035, 0.03, 0.06, '#f4f1ea', -0.27 + i * 0.18, 0.5, -0.05, 12);
      for (const sx of [-0.16, 0.16]) {
        cyl(g, 0.05, 0.05, 0.05, 'steel', sx, 0.3, 0.24, 16);      // group head
        const h = cyl(g, 0.015, 0.015, 0.22, 'black', sx, 0.26, 0.36, 8); h.rotation.x = Math.PI / 2; // portafilter handle
      }
      const wand = cyl(g, 0.008, 0.008, 0.3, 'steel', 0.34, 0.22, 0.24, 6); wand.rotation.z = 0.25;
      b(g, -0.36, 0.36, 0.12, 0.2, 0.2, 0.205, 'brass');           // badge strip
      return g;
    },
    candles,
  };
  return P;
}
