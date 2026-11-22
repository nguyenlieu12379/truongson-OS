/* Delícias Cake: one unbroken world.
   One fixed stage. Every place is mounted at its own depth (data-z, world units).
   Scroll moves a single camera forward along z. Nothing in document flow but the spacer.
   Bespoke page code: the kit's worldflight mode needs scrub clips, and this world is stills. */
(() => {
  const ZMAX = 14000;            // camera z at the end of the track
  const Z_PER_VH = 1500;         // one pace for the whole flight
  const P = 900;                 // focal length, world units
  const FAR = 9500;              // beyond this, a thing is too far to draw
  const WAYPOINTS = [0, 2000, 4500, 7000, 9500, 12400, 14000];
  const GOTO = [0, 2800, 5400, 7900, 10400, 12650, 14000];   // where a map click lands: the middle of each place, copy fully in
  const SNAP = /[?&]snap\b/.test(location.search);   // test switch: camera lands instantly, for screenshots
  const FORCE_STILL = /[?&]still\b/.test(location.search);  // test switch: render the reduced-motion version

  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const root = document.documentElement;
  const spacer = document.getElementById('spacer');
  const room = document.querySelector('.room');
  const routeBtns = [...document.querySelectorAll('.route button')];
  const gotos = [...document.querySelectorAll('[data-goto]')];

  /* ---------- sprinkles: the air of the world, seeded so every load is the same ---------- */
  let seed = 7;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  const sprHost = document.getElementById('sprinkles');
  const colours = ['#D61F69', '#FFFFFF', '#5A2A22', '#E8A33D', '#FF8FB4'];
  for (let i = 0; i < 46; i++) {
    const el = document.createElement('span');
    el.className = 'it spr';
    const side = rnd() < 0.5 ? -1 : 1;
    const nearHero = i < 12;
    el.dataset.z = String(nearHero ? 120 + rnd() * 600 : 900 + rnd() * 12000);
    el.dataset.x = String(side * (26 + rnd() * 26));
    el.dataset.y = String((rnd() * 2 - 1) * 44);
    el.dataset.rot = String(Math.round(rnd() * 180));
    el.dataset.spr = '1';
    el.style.background = colours[i % colours.length];
    sprHost.appendChild(el);
  }

  /* ---------- items ---------- */
  const items = [...document.querySelectorAll('.stage .it')].map((el) => ({
    el,
    z: +el.dataset.z,
    x: +el.dataset.x || 0, y: +el.dataset.y || 0,
    mx: el.dataset.mx, my: el.dataset.my,
    w: el.dataset.w ? +el.dataset.w : null,
    mw: el.dataset.mw ? +el.dataset.mw : null,
    g: el.dataset.g != null ? +el.dataset.g : -1,
    rot: el.dataset.rot ? +el.dataset.rot : 0,
    spr: !!el.dataset.spr,
    door: el.id === 'door',
    // near fade: gone at nf0, full at nf1 (distance ahead of the camera). far fade: full until far-1200, gone at far.
    nf0: el.dataset.nf0 ? +el.dataset.nf0 : -180,
    nf1: el.dataset.nf1 ? +el.dataset.nf1 : 280,
    far: el.dataset.far ? +el.dataset.far : (el.classList.contains('ph') ? 2700 : FAR),
    late: el.id === 'pudim2',
    shown: true,
    tf: '', op: '',
  }));
  // depth order never changes as the camera only moves forward, so stacking is set once, not every frame
  items.forEach((it) => { it.el.style.zIndex = String(Math.round(20000 - it.z)); });
  // write a style only when the value actually changed
  const setT = (it, v) => { if (it.tf !== v) { it.el.style.transform = v; it.tf = v; } };
  const setO = (it, v) => { if (it.op !== v) { it.el.style.opacity = v; it.op = v; } };

  /* ---------- the word, split so each letter can wobble ---------- */
  const word = document.getElementById('word');
  const letters = [...word.textContent].map((ch) => {
    const s = document.createElement('span');
    s.className = 'l';
    s.setAttribute('aria-hidden', 'true');
    s.textContent = ch;
    return s;
  });
  word.textContent = '';
  letters.forEach((s) => word.appendChild(s));

  const pudims = [document.querySelector('#pudim .pudim'), document.querySelector('#pudim2 .pudim')];

  /* Bake the pudim cutout into a transparent image once, so the wobble is a pure GPU transform
     (an SVG clip-path on a moving element gets re-rasterised). Same canvas size as the photo, so layout is unchanged. */
  (function bakeCutout() {
    const src = pudims[0].querySelector('img');
    const go = () => {
      const c = document.createElement('canvas'); c.width = 1350; c.height = 1687;
      const x = c.getContext('2d');
      x.beginPath();
      x.ellipse(682, 1010, 652, 255, 0, 0, Math.PI * 2);
      x.moveTo(228, 690); x.lineTo(1165, 690); x.lineTo(1288, 1010); x.lineTo(112, 1010); x.closePath();
      x.moveTo(1167, 660); x.ellipse(697, 660, 470, 135, 0, 0, Math.PI * 2);
      x.clip('nonzero');
      x.drawImage(src, 0, 0, 1350, 1687);
      c.toBlob((b) => {
        if (!b) return;
        const url = URL.createObjectURL(b);
        pudims.forEach((p) => { const im = p.querySelector('img'); im.src = url; im.style.clipPath = 'none'; });
      }, 'image/png');
    };
    if (src.complete && src.naturalWidth) go(); else src.addEventListener('load', go, { once: true });
  })();
  const pudimItem = document.getElementById('pudim');

  /* ---------- copy windows ---------- */
  const copies = [...document.querySelectorAll('.cp')].map((el) => {
    const w = el.dataset.win.split(' ');
    let a, b, rin, rout;
    if (w[0] === 'hero') { a = -1; b = 1300; rin = 1; rout = 700; }
    else if (w[0] === 'finale') { a = 13550; b = 1e9; rin = 400; rout = 1; }
    else { a = +w[0]; b = +w[1]; rin = w[2] ? +w[2] : (b - a) * 0.22; rout = w[3] ? +w[3] : (b - a) * 0.22; }
    return { el, a, b, rin, rout, still: el.classList.contains('cp--counter'), on: null, live: null };
  });

  /* ---------- helpers ---------- */
  const clamp = (v, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, v));
  const smooth = (e0, e1, v) => { const t = clamp((v - e0) / (e1 - e0)); return t * t * (3 - 2 * t); };
  let vw = innerWidth / 100, vh = innerHeight / 100, narrow = false;

  function layout() {
    vw = innerWidth / 100; vh = innerHeight / 100;
    narrow = innerWidth / innerHeight < 0.8 || innerWidth < 700;
    spacer.style.height = Math.round((ZMAX / Z_PER_VH + 1) * innerHeight) + 'px';
    items.forEach((it) => {
      const w = narrow ? (it.mw != null ? it.mw : it.w != null ? it.w * 1.6 : null) : it.w;
      if (w != null) it.el.style.width = (w * vw) + 'px';
    });
  }
  const track = () => Math.max(1, spacer.offsetHeight - innerHeight);
  const targetZ = () => clamp(scrollY / track()) * ZMAX;

  /* ---------- the signature: a jelly spring the scroll kicks ---------- */
  const spring = { x: 0, v: 0, y: 0, yv: 0 };
  function kick(amount) { spring.v += amount; spring.yv += Math.abs(amount) * 0.7; }
  pudims.forEach((p) => {
    const host = p.parentElement;
    host.addEventListener('click', () => kick(0.09));
    host.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse') kick(0.04); });
  });

  /* ---------- liquid glass: cursor tracking ---------- */
  const glass = [...document.querySelectorAll('.glass:not(.ph)')];   // photo frames keep a fixed rim highlight
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const pointer = { x: -9999, y: -9999, on: false, moved: false, settling: 0 };
  addEventListener('pointermove', (e) => { if (e.pointerType === 'mouse') { pointer.x = e.clientX; pointer.y = e.clientY; pointer.on = true; pointer.moved = true; pointer.settling = 30; } }, { passive: true });
  document.addEventListener('pointerleave', () => { pointer.x = pointer.y = -9999; });

  /* ---------- liquid glass: real refraction ----------
     Each pane gets its own SVG filter used as a backdrop-filter (Chromium only):
     an edge map that bends the background only near the pane's rounded rim and corners,
     plus a round lens that follows the cursor and bends the light under it.
     Displacement maps are neutral at 50% grey; red pushes x, green pushes y. */
  const SVGNS = 'http://www.w3.org/2000/svg';
  const filterHost = document.getElementById('glass-filters');
  const brands = navigator.userAgentData && navigator.userAgentData.brands;
  const chromium = brands ? brands.some((b) => /Chromium/.test(b.brand)) : /Chrome\//.test(navigator.userAgent);
  const LENS = 170;
  // scale: max displacement range in px (±scale/2). mag: whole-pane magnification. bend: extra px the rim pulls inward. bezel: rim width.
  const KIND = {
    card:  { scale: 120, mag: 1.07, bend: 30, bezel: 30 },
    btn:   { scale: 60,  mag: 1.06, bend: 14, bezel: 16 },
    route: { scale: 60,  mag: 1.04, bend: 12, bezel: 14 },
  };

  function mapCanvas(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }

  // Clear lens: every point samples a little closer to the centre (magnifies), and within the rim the
  // sample is pulled further inward along the edge normal (light bends at the edges and corners). No blur anywhere.
  function edgeMap(W, H, R, cfg) {
    const k = 0.5, cw = Math.max(2, Math.ceil(W * k)), ch = Math.max(2, Math.ceil(H * k));
    const c = mapCanvas(cw, ch), ctx = c.getContext('2d'), img = ctx.createImageData(cw, ch), px = img.data;
    const hx = W / 2, hy = H / 2, r = Math.min(R, hx, hy), half = cfg.scale / 2, shrink = 1 - 1 / cfg.mag;
    for (let y = 0; y < ch; y++) {
      for (let x = 0; x < cw; x++) {
        const X = (x + 0.5) / k - hx, Y = (y + 0.5) / k - hy;
        const qx = Math.abs(X) - (hx - r), qy = Math.abs(Y) - (hy - r);
        const ox = Math.max(qx, 0), oy = Math.max(qy, 0);
        const d = -(Math.hypot(ox, oy) + Math.min(Math.max(qx, qy), 0) - r);   // distance in from the rim
        let dx = -X * shrink, dy = -Y * shrink;                                // magnification
        if (d >= 0 && d < cfg.bezel) {
          const t = 1 - d / cfg.bezel, m = t * t * (3 - 2 * t);               // strongest at the rim
          let nx = 0, ny = 0;
          if (qx > 0 && qy > 0) { const L = Math.hypot(ox, oy) || 1; nx = Math.sign(X) * ox / L; ny = Math.sign(Y) * oy / L; }
          else if (qx > qy) nx = Math.sign(X); else ny = Math.sign(Y);
          dx -= nx * cfg.bend * m; dy -= ny * cfg.bend * m;
        }
        const i = (y * cw + x) * 4;
        px[i] = 128 + clamp(dx / half, -1, 1) * 127;
        px[i + 1] = 128 + clamp(dy / half, -1, 1) * 127;
        px[i + 2] = 128; px[i + 3] = 255;
      }
    }
    ctx.putImageData(img, 0, 0);
    return c.toDataURL();
  }

  // Cursor lens: pulls samples toward its centre, so what is under the cursor is magnified and bent at the lens edge.
  function lensMap(S) {
    const c = mapCanvas(S, S), ctx = c.getContext('2d'), img = ctx.createImageData(S, S), px = img.data, h = S / 2;
    for (let y = 0; y < S; y++) {
      for (let x = 0; x < S; x++) {
        const vx = (x + 0.5 - h) / h, vy = (y + 0.5 - h) / h, d2 = vx * vx + vy * vy;
        let dx = 0, dy = 0;
        if (d2 < 1) { const m = (1 - d2) * (1 - d2) * 0.42; dx = -vx * m; dy = -vy * m; }
        const i = (y * S + x) * 4;
        px[i] = 128 + dx * 127;
        px[i + 1] = 128 + dy * 127;
        px[i + 2] = 128; px[i + 3] = 255;
      }
    }
    ctx.putImageData(img, 0, 0);
    return c.toDataURL();
  }

  const lensURL = chromium ? lensMap(LENS) : null;
  const el = (tag, attrs, parent) => { const n = document.createElementNS(SVGNS, tag); for (const k in attrs) n.setAttribute(k, attrs[k]); if (parent) parent.appendChild(n); return n; };

  // every glass pane except the moving photo frames (those get the thin specular rim only)
  const panes = [...document.querySelectorAll('.glass:not(.ph)')].map((node, i) => ({
    node, id: 'lg' + i, kind: node.classList.contains('btn') ? 'btn' : node.classList.contains('route') ? 'route' : 'card',
    W: 0, H: 0, filter: null, edge: null, lens: null, lensX: null, lensY: null, cp: node.classList.contains('cp'),
  }));

  function buildPane(p) {
    const W = Math.round(p.node.offsetWidth), H = Math.round(p.node.offsetHeight);
    if (!W || !H || (W === p.W && H === p.H)) return;
    p.W = W; p.H = H;
    const cfg = KIND[p.kind];
    const R = parseFloat(getComputedStyle(p.node).borderTopLeftRadius) || 0;
    if (!p.filter) {
      p.filter = el('filter', { id: p.id, filterUnits: 'userSpaceOnUse', primitiveUnits: 'userSpaceOnUse', 'color-interpolation-filters': 'sRGB' }, filterHost);
      p.edge = el('feImage', { x: 0, y: 0, preserveAspectRatio: 'none', result: 'edge' }, p.filter);
      el('feFlood', { 'flood-color': 'rgb(128,128,128)', result: 'flat' }, p.filter);
      p.lens = el('feImage', { href: lensURL, width: LENS, height: LENS, x: -9999, y: -9999, preserveAspectRatio: 'none', result: 'lensRaw' }, p.filter);
      const merge = el('feMerge', { result: 'lens' }, p.filter);
      el('feMergeNode', { in: 'flat' }, merge); el('feMergeNode', { in: 'lensRaw' }, merge);
      el('feComposite', { in: 'edge', in2: 'lens', operator: 'arithmetic', k1: 0, k2: 1, k3: 1, k4: -0.5, result: 'map' }, p.filter);
      el('feDisplacementMap', { in: 'SourceGraphic', in2: 'map', scale: cfg.scale, xChannelSelector: 'R', yChannelSelector: 'G' }, p.filter);
    }
    p.filter.setAttribute('x', 0); p.filter.setAttribute('y', 0);
    p.filter.setAttribute('width', W); p.filter.setAttribute('height', H);
    p.edge.setAttribute('width', W); p.edge.setAttribute('height', H);
    p.edge.setAttribute('href', edgeMap(W, H, R, cfg));
    // re-assigning the backdrop-filter makes Chromium pick up the new map. Refraction only: no blur, no frost.
    p.node.style.backdropFilter = '';
    p.node.style.backdropFilter = `url(#${p.id})`;
  }

  panes.forEach((p) => { p.node.__pane = p; });
  if (chromium) {
    panes.forEach(buildPane);
    const ro = new ResizeObserver((entries) => entries.forEach((e) => { const p = panes.find((q) => q.node === e.target); if (p) buildPane(p); }));
    panes.forEach((p) => ro.observe(p.node));
  }

  /* ---------- groups for reduced motion: each place shown still, crossfaded ---------- */
  function groupOpacity(g, cam) {
    if (g < 0) return 0;
    const a = g === 0 ? -1e9 : WAYPOINTS[g] - 700;
    const b = g === WAYPOINTS.length - 1 ? 1e9 : WAYPOINTS[g + 1] - 700;
    return smooth(a, a + 400, cam) * (1 - smooth(b - 400, b, cam));
  }
  const REDUCED_ANCHOR = [0, 2600, 4900, 7400, 9500, 12100, 14000];

  /* ---------- frame ---------- */
  let cam = targetZ(), lastTarget = cam, t0 = performance.now(), lastWp = -1, drawnCam = -1, forceDraw = true, letterCov = null, coverCam = -1;
  addEventListener('resize', () => { forceDraw = true; });

  function frame(now) {
    const t = (now - t0) / 1000;
    const tgt = targetZ();
    const still = reduced.matches || FORCE_STILL;

    /* ---- reads first: every measurement uses last frame's layout, before any style is written this frame ---- */
    const heroLive = !still && cam < 1600 && pudimItem.style.visibility !== 'hidden';
    if (heroLive && (Math.abs(cam - coverCam) > 0.5 || !letterCov)) {
      coverCam = cam;
      const pr = pudimItem.getBoundingClientRect();
      const top = pr.top + pr.height * 0.31, bottom = pr.top + pr.height * 0.75;
      const left = pr.left + pr.width * 0.16, right = pr.right - pr.width * 0.14;
      letterCov = letters.map((l) => {
        const r = l.getBoundingClientRect();
        const ix = Math.max(0, Math.min(r.right, right) - Math.max(r.left, left));
        const iy = Math.max(0, Math.min(r.bottom - r.height * 0.18, bottom) - Math.max(r.top + r.height * 0.18, top));
        return clamp((ix * iy) / Math.max(1, r.width * r.height * 0.64) * 2.2);
      });
    }
    const glassLive = finePointer && pointer.on && (pointer.moved || pointer.settling > 0 || Math.abs(tgt - cam) > 0.5);
    const glassRects = glassLive ? glass.map((g) => (g.classList.contains('cp') && !g.classList.contains('is-on') ? null : g.getBoundingClientRect())) : null;

    /* ---- writes ---- */
    cam = still || SNAP ? tgt : cam + (tgt - cam) * 0.12;

    // spring
    if (!still) {
      const dv = tgt - lastTarget;
      spring.v += clamp(dv * 0.00011, -0.03, 0.03);
      spring.yv += clamp(Math.abs(dv) * 0.00005, 0, 0.02);
      spring.v += -0.07 * spring.x - 0.11 * spring.v;
      spring.yv += -0.09 * spring.y - 0.13 * spring.yv;
      spring.x = clamp(spring.x + spring.v, -0.3, 0.3);
      spring.y = clamp(spring.y + spring.yv, -0.12, 0.12);
    } else { spring.x = spring.y = 0; }
    lastTarget = tgt;

    const idle = still ? 0 : Math.sin(t * 1.9) * 0.006;
    const pudimT = `skewX(${((spring.x + idle) * 13).toFixed(3)}deg) scale(${(1 + spring.y * 0.45).toFixed(4)}, ${(1 - spring.y).toFixed(4)})`;
    pudims.forEach((p) => { p.style.transform = pudimT; });

    // world: redraw only when the camera actually moved
    const moved = forceDraw || Math.abs(cam - drawnCam) > 0.05;
    if (moved) {
    drawnCam = cam; forceDraw = false;
    const cx = innerWidth / 2, cy = innerHeight / 2;
    let doorRect = null, doorO = 1;
    for (const it of items) {
      const camE = still ? REDUCED_ANCHOR[Math.max(0, it.g)] : cam;
      const d = it.z - camE;
      let o;
      if (still) o = it.spr ? 0 : groupOpacity(it.g, cam);
      else if (it.door) o = clamp((d + 10) / 110) * clamp((it.far - d) / 1400);
      else o = clamp((d - it.nf0) / (it.nf1 - it.nf0)) * clamp((it.far - d) / 1200);
      if (it.late) o *= smooth(13380, 13700, cam);
      if (d > it.far || d < -0.8 * P || o <= 0.003) {
        if (it.shown) { it.el.style.visibility = 'hidden'; it.shown = false; }
        if (it.door && !still) { doorO = 0; doorRect = rectFor(it, d, cx, cy); }
        continue;
      }
      if (!it.shown) { it.el.style.visibility = 'visible'; it.shown = true; }
      const s = P / (P + d);
      const x = (narrow && it.mx != null ? +it.mx : it.x) * vw * s;
      const y = (narrow && it.my != null ? +it.my : it.y) * vh * s;
      setT(it, `translate(-50%, -50%) translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0) scale(${s.toFixed(4)})${it.rot ? ` rotate(${it.rot}deg)` : ''}`);
      setO(it, o.toFixed(2));
      if (it.door) { doorO = o; doorRect = rectFor(it, d, cx, cy); }
    }

    // the room behind the door, revealed through the doorway
    const roomOn = smooth(12900, 13250, cam);
    room.style.opacity = roomOn.toFixed(3);
    if (doorRect && !still && roomOn > 0) {
      const { l, r, tp, b } = doorRect;
      const insetT = Math.max(0, tp), insetB = Math.max(0, innerHeight - b);
      const insetL = Math.max(0, l), insetR = Math.max(0, innerWidth - r);
      const full = insetT + insetB + insetL + insetR < 1 || doorO === 0 && d0(doorRect);
      room.style.clipPath = full ? 'none' : `inset(${insetT.toFixed(0)}px ${insetR.toFixed(0)}px ${insetB.toFixed(0)}px ${insetL.toFixed(0)}px round 34px)`;
    } else room.style.clipPath = 'none';

    // copy
    for (const c of copies) {
      let o = smooth(c.a, c.a + c.rin, cam) * (1 - smooth(c.b - c.rout, c.b, cam));
      if (c.a < 0) o = 1 - smooth(c.b - c.rout, c.b, cam);
      c.el.style.opacity = o.toFixed(3);
      if (!c.still && !still && c.b < 1e8) {
        const prog = clamp((cam - c.a) / (c.b - c.a));
        c.el.style.transform = `translate3d(0, ${((1 - 2 * prog) * 2 * vh).toFixed(1)}px, 0)`;
      }
      const on = o > 0.01, live = o > 0.5;
      if (on !== c.on) { c.el.classList.toggle('is-on', on); c.on = on; }
      if (live !== c.live) { c.el.classList.toggle('is-live', live); c.live = live; }
    }
    }

    // letters the pudim covers wobble with it.
    // Coverage is measured only when the camera moved (measuring every frame forced a layout per frame).
    if (heroLive && letterCov) {
      letters.forEach((l, i) => {
        const cov = letterCov[i];
        if (cov < 0.01) { if (l.style.transform) l.style.transform = ''; return; }
        const sk = (spring.x * 34 + Math.sin(t * 2.7 + i * 0.9) * 4) * cov;
        const sq = Math.sin(t * 3.3 + i * 1.4) * 0.045 * cov + spring.y * 0.8 * cov;
        const ty = Math.sin(t * 2.4 + i * 0.7) * 0.025 * cov;
        l.style.transform = `translateY(${ty.toFixed(3)}em) skewX(${sk.toFixed(2)}deg) scale(${(1 - sq * 0.5).toFixed(4)}, ${(1 + sq).toFixed(4)})`;
      });
    }

    // liquid glass: the light follows the cursor, the lens bends it, buttons lean toward it.
    // Only when the pointer or the world moved, and only for panes that are on screen.
    if (glassRects) {
      pointer.moved = false;
      pointer.settling = Math.max(0, pointer.settling - 1);
      for (let gi = 0; gi < glass.length; gi++) {
        const g = glass[gi], r = glassRects[gi];
        if (!r || r.width === 0 || r.bottom < 0 || r.top > innerHeight) continue;
        const p = g.__pane;
        if (p && p.lens) {
          // the lens sits under the cursor while it is over the pane (in the pane's own pixels, before any scale)
          const sx = p.W / r.width || 1, sy = p.H / r.height || 1;
          const over = pointer.x > r.left - 20 && pointer.x < r.right + 20 && pointer.y > r.top - 20 && pointer.y < r.bottom + 20;
          const lx = over ? Math.round((pointer.x - r.left) * sx - LENS / 2) : -9999;
          const ly = over ? Math.round((pointer.y - r.top) * sy - LENS / 2) : -9999;
          if (lx !== p.lensX || ly !== p.lensY) { p.lens.setAttribute('x', lx); p.lens.setAttribute('y', ly); p.lensX = lx; p.lensY = ly; }
        }
        const lx = pointer.x - r.left, ly = pointer.y - r.top;
        const dx = Math.max(r.left - pointer.x, 0, pointer.x - r.right);
        const dy = Math.max(r.top - pointer.y, 0, pointer.y - r.bottom);
        const reach = 90 + Math.min(r.width, r.height) * 0.6;
        const gp = clamp(1 - Math.hypot(dx, dy) / reach);
        const st = g.__gs || (g.__gs = { x: lx, y: ly, p: 0, mx: 0, my: 0 });
        st.x += (lx - st.x) * 0.22; st.y += (ly - st.y) * 0.22; st.p += (gp - st.p) * 0.15;
        g.style.setProperty('--gx', st.x.toFixed(1) + 'px');
        g.style.setProperty('--gy', st.y.toFixed(1) + 'px');
        g.style.setProperty('--gp', st.p.toFixed(3));
        if (g.classList.contains('btn') && !still) {
          const inside = gp > 0.55;
          const tx = inside ? clamp((lx - r.width / 2) * 0.16, -7, 7) : 0;
          const ty = inside ? clamp((ly - r.height / 2) * 0.22, -5, 5) : 0;
          st.mx += (tx - st.mx) * 0.2; st.my += (ty - st.my) * 0.2;
          g.style.setProperty('--mgx', st.mx.toFixed(2) + 'px');
          g.style.setProperty('--mgy', st.my.toFixed(2) + 'px');
        }
      }
    }

    // route map
    let wp = 0;
    WAYPOINTS.forEach((z, i) => { if (cam >= z - 500) wp = i; });
    if (wp !== lastWp) {
      routeBtns.forEach((b, i) => b.setAttribute('aria-current', String(i === wp)));
      root.classList.toggle('at-counter', wp === WAYPOINTS.length - 1);
      lastWp = wp;
    }

    requestAnimationFrame(frame);
  }

  function rectFor(it, d, cx, cy) {
    const s = P / (P + d);
    const wpx = parseFloat(it.el.style.width) * s;
    const hpx = wpx * (1920 / 1080);
    const x = cx + (narrow && it.mx != null ? +it.mx : it.x) * vw * s;
    const y = cy + (narrow && it.my != null ? +it.my : it.y) * vh * s;
    return { l: x - wpx / 2, r: x + wpx / 2, tp: y - hpx / 2, b: y + hpx / 2 };
  }
  function d0(r) { return r.l <= 0 && r.tp <= 0 && r.r >= innerWidth && r.b >= innerHeight; }

  /* ---------- the map is clickable ---------- */
  gotos.forEach((b) => b.addEventListener('click', (e) => {
    e.preventDefault();
    const z = GOTO[+b.dataset.goto];
    scrollTo({ top: (z / ZMAX) * track(), behavior: reduced.matches ? 'auto' : 'smooth' });
  }));

  /* ---------- decode every photo up front, so the first fly-past doesn't stall on decoding ---------- */
  addEventListener('load', () => {
    const imgs = [...document.querySelectorAll('.stage img, .room img')];
    const next = () => { const im = imgs.shift(); if (!im) return; (im.decode ? im.decode() : Promise.resolve()).catch(() => {}).then(() => setTimeout(next, 0)); };
    next();
  });

  /* ---------- size once, then again when the window and fonts settle ---------- */
  layout();
  addEventListener('resize', layout);
  addEventListener('load', layout);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(layout);
  requestAnimationFrame(frame);
})();
