/* Tardes Caleñas: one fixed stage, one timeline p (0..1) from smoothed scroll, plus a clock for idle motion.
   Nothing fades between scenes: each scene's end builds the next one's start.
   1 hero: their Bandeja Paisa centred, breathing, leaning to the cursor; "Tardes" above it, "Caleñas" below,
     the letters it covers sway
   2 the words slide off, the plate grows to the left; leader lines draw to what's on it
   3 the pass: the bandeja carries out left; four plates glide through the centre one after another,
     each with its name, what it is and its price
   4 peak, the table: the picada drops into the middle and every plate that passed comes back round it
   5 the table opens out to the edges; the five nights of the week slide in
   6 the nights carry on out; the bandeja comes back, the reservation card slides in. Holds.
   ?p=0.6 jumps there. */
(() => {
  const $ = (s) => document.getElementById(s);
  const root = document.documentElement;
  const stage = $('stage'), spacer = $('spacer');
  const W1 = document.querySelector('.word.w1'), W2 = document.querySelector('.word.w2');
  const heroLine = $('heroLine'), anHead = $('anHead'), passHead = $('passHead'), tableHead = $('tableHead');
  const nights = $('nights'), card = $('reserve'), svg = $('leaders');
  const NL = [...nights.querySelectorAll('li')];
  const PASS = ['sancocho', 'lomo', 'chuleta', 'arrozpollo'];
  const RING = ['bandeja', 'sancocho', 'lomo', 'chuleta', 'arrozpollo'];
  const KEYS = RING.concat('picada');
  const P = Object.fromEntries(KEYS.map((k) => [k, $(`pl-${k}`)]));
  const TG = Object.fromEntries(KEYS.map((k) => [k, $(`tg-${k}`)]));
  const DR = [$('dr-tost')];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');

  // the bandeja cutout: crop box inside the 1600x900 photo, and where each part sits in that photo
  const SHADOW_PAD = 48;   // lab/shadow.py pads every cutout by this much for its baked shadow
  const BAND = { x0: 194 - SHADOW_PAD, y0: 118 - SHADOW_PAD, w: 1253 + SHADOW_PAD * 2, h: 732 + SHADOW_PAD * 2 };
  const ANAT = {
    steak: [420, 420], chich: [745, 190], egg: [810, 420], chorizo: [1068, 300],
    plantain: [1370, 225], beans: [1215, 560], arepa: [905, 770],
  };
  const AN = Object.fromEntries(Object.keys(ANAT).map((k) => [k, $(`an-${k}`)]));

  const clamp = (v, a = 0, b = 1) => (v < a ? a : v > b ? b : v);
  const seg = (p, a, b) => clamp((p - a) / (b - a));
  const E = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const O = (t) => 1 - Math.pow(1 - t, 3);
  const lerp = (a, b, t) => a + (b - a) * t;
  const r1 = (v) => Math.round(v * 10) / 10;
  const put = (el, prop, val) => { const c = el._c || (el._c = {}); if (c[prop] !== val) { c[prop] = val; el.style[prop] = val; } };
  const at = (el, x, y, s = 1, extra = '') => put(el, 'transform', `translate3d(${r1(x)}px,${r1(y)}px,0)${s !== 1 ? ` scale(${s.toFixed(4)})` : ''}${extra}`);
  const centre = (el, cx, cy, s = 1, extra = '') => at(el, cx - el._w / 2, cy - el._h / 2, s, extra);
  const vis = (el, on) => put(el, 'visibility', on ? 'visible' : 'hidden');
  const op = (el, o) => put(el, 'opacity', o >= 0.999 ? '' : o.toFixed(3));
  const size = (el, w) => { put(el, 'width', `${Math.round(w)}px`); };

  // timeline windows
  const T = {
    heroOut: [0.05, 0.12], labels: [0.105, 0.175], labelsOut: [0.19, 0.22], bandOut: [0.2, 0.27],
    pass: [0.27, 0.335, 0.4, 0.465], passSpan: 0.075,
    drop: [0.485, 0.55], gather: [0.545, 0.68], open: [0.74, 0.81], nights: [0.76, 0.84], close: [0.855, 0.93],
  };

  let VW = 0, VH = 0, mobile = false, R = {};
  let lean = { x: 0, y: 0 }, leanT = { x: 0, y: 0 };

  // ---- layout (measured once per resize) --------------------------------------------
  function layout() {
    VW = root.clientWidth; VH = stage.clientHeight; mobile = VW <= 760;
    [...stage.querySelectorAll('*')].forEach((el) => { el._c = {}; el.style.transform = ''; el.style.opacity = ''; });
    const pad = mobile ? 16 : Math.min(64, Math.max(24, VW * 0.035));
    R.pad = pad;
    const ar = (k) => P[k].querySelector('img').naturalHeight / P[k].querySelector('img').naturalWidth || 1;

    // the bandeja: its base size is its largest (anatomy), every other state scales down from it
    const bAR = ar('bandeja');
    R.anW = mobile ? VW * 0.96 : Math.min(VW * 0.56, (VH - 90) / bAR);
    R.heroW = mobile ? VW * 0.9 : Math.min(VW * 0.5, VH * 0.56 / bAR);
    size(P.bandeja, R.anW); P.bandeja._w = R.anW; P.bandeja._h = R.anW * bAR;
    R.heroC = mobile ? [VW / 2, VH * 0.45] : [VW / 2, VH * 0.53];
    R.anC = mobile ? [VW / 2, VH * 0.5] : [pad + R.anW / 2 + VW * 0.02, VH * 0.54];

    // hero words: "Tardes" over the plate's top left, "Caleñas" under its bottom right
    const fs = mobile ? VW * 0.25 : Math.min(VW * 0.16, VH * 0.3);
    [W1, W2].forEach((w) => { w.style.fontSize = `${fs}px`; w._w = w.offsetWidth; w._h = w.offsetHeight; });
    const hs = R.heroW / R.anW, hw = R.heroW, hh = R.heroW * bAR;
    const pl = R.heroC[0] - hw / 2, pt = R.heroC[1] - hh / 2, pr = pl + hw, pb = pt + hh;
    R.hs = hs;
    R.w1 = [clamp(pl - fs * 0.35, pad * 0.5, VW - W1._w - pad * 0.5), Math.max(-fs * 0.05, pt - W1._h * 0.8)];
    R.w2 = [clamp(pr - W2._w + fs * 0.35, pad * 0.5, VW - W2._w - pad * 0.5), Math.min(VH - W2._h * 0.98, pb - W2._h * 0.22)];
    // which letters the plate covers
    const plateBox = { l: pl + hw * 0.03, r: pr - hw * 0.03, t: pt + hh * 0.04, b: pb - hh * 0.03 };
    [W1, W2].forEach((w, wi) => {
      const o = wi ? R.w2 : R.w1;
      [...w.children].forEach((ch) => {
        const l = o[0] + ch.offsetLeft, t = o[1] + ch.offsetTop, r = l + ch.offsetWidth, b = t + ch.offsetHeight * 0.8;
        ch._cov = l < plateBox.r && r > plateBox.l && t < plateBox.b && b > plateBox.t;
        ch.style.transform = '';
      });
    });
    size(heroLine, mobile ? VW - 32 : Math.min(420, VW * 0.3));
    heroLine._w = heroLine.offsetWidth; heroLine._h = heroLine.offsetHeight;
    R.heroLine = mobile ? [16, VH - heroLine._h - 18] : [pad, VH - heroLine._h - pad * 0.8];

    // anatomy heading and labels
    size(anHead, mobile ? VW - 32 : Math.min(440, VW - (R.anC[0] + R.anW / 2) - pad * 2));
    anHead._h = anHead.offsetHeight;
    R.anHead = mobile ? [16, 12] : [VW - pad - anHead.offsetWidth, VH - anHead._h - pad];
    const s = R.anW / BAND.w, bx = R.anC[0] - R.anW / 2, by = R.anC[1] - R.anW * bAR / 2;
    R.anat = {};
    Object.entries(ANAT).forEach(([k, [x, y]]) => {
      const ax = bx + (x - BAND.x0) * s, ay = by + (y - BAND.y0) * s;
      const el = AN[k]; el._w = el.offsetWidth; el._h = el.offsetHeight;
      let lx, ly;
      if (mobile) {           // phones: two rows of labels above the plate, one below
        const top = by + R.anW * bAR * 0.06, bot = by + R.anW * bAR * 0.94, rowH = el._h + 8;
        const SL = { chich: [0, top - rowH * 2], plantain: [1, top - rowH * 2], egg: [0, top - rowH], chorizo: [1, top - rowH],
          steak: [0, bot + 8], arepa: [0.5, bot + 8], beans: [1, bot + 8] }[k];
        lx = SL[0] === 0 ? 12 : SL[0] === 1 ? VW - el._w - 12 : (VW - el._w) / 2; ly = SL[1];
      } else {
        const dx = ax - R.anC[0], dy = ay - R.anC[1], d = Math.hypot(dx, dy) || 1;
        const ex = R.anW / 2 + 36, ey = R.anW * bAR / 2 + 26;
        const k2 = Math.min(ex / Math.abs(dx || 1e-3), ey / Math.abs(dy || 1e-3));
        lx = R.anC[0] + dx * k2 + (dx > 0 ? 6 : -el._w - 6); ly = R.anC[1] + dy * k2 - el._h / 2;
        lx = clamp(lx, 8, VW - el._w - 8); ly = clamp(ly, 6, VH - el._h - 6);
      }
      R.anat[k] = { ax, ay, lx, ly };
    });

    // pass and table sizes
    KEYS.forEach((k) => { if (k === 'bandeja') return; const a = ar(k); const w = mobile ? VW * 0.74 : Math.min(VH * 0.6, VW * 0.36) * (k === 'picada' ? 1.1 : 1); size(P[k], w); P[k]._w = w; P[k]._h = w * a; });
    R.passC = mobile ? [VW / 2, VH * 0.4] : [VW * 0.4, VH * 0.54];
    size(passHead, mobile ? VW - 32 : 380); passHead._h = passHead.offsetHeight;
    R.passHead = mobile ? [16, 12] : [pad, pad * 0.9];
    KEYS.forEach((k) => { TG[k].classList.remove('small'); TG[k]._w = TG[k].offsetWidth; TG[k]._h = TG[k].offsetHeight; });

    // the table: picada in the middle, the five plates round it
    const pk = mobile ? VW * 0.5 : Math.min(VH * 0.46, VW * 0.27);
    const rs = pk * 0.6;
    R.tableC = mobile ? [VW / 2, VH * 0.58] : [VW * 0.6, VH * 0.53];
    R.pkS = pk / P.picada._w;
    const rx = mobile ? VW * 0.34 : pk * 1.22, ry = mobile ? VH * 0.25 : Math.min(pk * 0.85, VH / 2 - rs / 2 - 24);
    const ANG = mobile ? [-90, -25, 35, 145, 205] : [-108, -28, 22, 78, 150];
    R.ring = {};
    RING.forEach((k, i) => {
      const a = ANG[i] * Math.PI / 180, cx = R.tableC[0] + rx * Math.cos(a), cy = R.tableC[1] + ry * Math.sin(a);
      const target = k === 'bandeja' ? rs * 1.45 : rs;
      R.ring[k] = { cx, cy, s: target / P[k]._w, a };
    });
    size(tableHead, mobile ? VW - 32 : Math.min(400, VW * 0.27)); tableHead._h = tableHead.offsetHeight;
    R.tableHead = mobile ? [16, 12] : [pad, pad * 0.9];

    // nights and the card
    size(nights, mobile ? VW - 32 : Math.min(760, VW * 0.6)); nights._w = nights.offsetWidth; nights._h = nights.offsetHeight;
    R.nights = mobile ? [16, Math.max(12, (VH - nights._h) / 2)] : [(VW - nights._w) / 2, (VH - nights._h) / 2];
    size(card, mobile ? VW - 32 : 440); card._w = card.offsetWidth; card._h = card.offsetHeight;
    R.card = mobile ? [16, VH - card._h - 14] : [VW - pad - card._w - VW * 0.04, (VH - card._h) / 2];
    R.closeBand = mobile ? { cx: VW / 2, cy: Math.max(80, (VH - card._h - 14) / 2), w: Math.min(VW * 0.9, ((VH - card._h - 30) * 0.9) / bAR) }
      : { cx: (R.card[0]) / 2, cy: VH * 0.52, w: Math.min(R.card[0] - pad * 2, VH * 0.7 / bAR) };

    // drifters
    DR.forEach((d) => { const w = mobile ? 64 : Math.min(130, VW * 0.08); d.style.width = `${w}px`; d._w = w; d._h = w * (d.naturalHeight / d.naturalWidth || 1); });

    spacer.style.height = `${Math.round(VH * (mobile ? 11 : 10) + (innerHeight - VH))}px`;
  }

  // ---- one frame ----------------------------------------------------------------------
  function frame(p, t) {
    const heroK = E(seg(p, ...T.heroOut));
    const still = reduced.matches ? 0 : 1;

    // hero words slide off their corners
    at(W1, R.w1[0] - heroK * (R.w1[0] + W1._w + 40), R.w1[1] - heroK * VH * 0.25);
    at(W2, R.w2[0] + heroK * (VW - R.w2[0] + 40), R.w2[1] + heroK * VH * 0.25);
    vis(W1, heroK < 1); vis(W2, heroK < 1);
    if (heroK < 1) {
      [W1, W2].forEach((w, wi) => [...w.children].forEach((ch, i) => {
        if (!ch._cov) return;
        const sw = Math.sin(t * 2.4 + i * 0.9 + wi * 2) * still;
        put(ch, 'transform', `translateY(${r1(sw * 5)}px) rotate(${(sw * 3.5).toFixed(2)}deg)`);
      }));
    }
    at(heroLine, R.heroLine[0] - heroK * (heroLine._w + R.heroLine[0] + 30), R.heroLine[1]);
    vis(heroLine, heroK < 1);

    // the bandeja: hero, anatomy, out left, back to the table, out, back for the close
    const B = P.bandeja;
    let bx = lerp(R.heroC[0], R.anC[0], heroK), by = lerp(R.heroC[1], R.anC[1], heroK), bs = lerp(R.hs, 1, heroK);
    const out = E(seg(p, ...T.bandOut));
    if (out > 0) { bx = lerp(bx, -B._w * 0.6, out); bs = lerp(bs, 0.6, out); }
    const ring = R.ring.bandeja;
    const g = gatherK(0, p);
    if (g > 0) { const q = arc(-B._w * 0.6, by, ring.cx, ring.cy, g); bx = q[0]; by = q[1]; bs = lerp(0.6, ring.s, g); }
    const opn = E(seg(p, ...T.open));
    if (opn > 0) { const e = openOut(ring, opn); bx = e[0]; by = e[1]; bs = lerp(ring.s, ring.s * 0.8, opn); }
    const cl = E(seg(p, ...T.close));
    if (cl > 0) { const e = openOut(ring, 1); const c = R.closeBand; bx = lerp(e[0], c.cx, cl); by = lerp(e[1], c.cy, cl); bs = lerp(ring.s * 0.8, c.w / B._w, cl); }
    // idle: breathe, and lean to the cursor (hero and close only)
    const leanK = (1 - heroK) + cl;
    lean.x += (leanT.x - lean.x) * 1; lean.y += (leanT.y - lean.y) * 1;
    const breath = 1 + Math.sin(t * 1.5) * 0.012 * still * leanK;
    const img = B.firstElementChild;
    put(img, 'transform', leanK > 0.01 && still ? `perspective(1400px) rotateX(${(-lean.y * 8 * leanK).toFixed(2)}deg) rotateY(${(lean.x * 11 * leanK).toFixed(2)}deg)` : '');
    centre(B, bx, by, bs * breath);

    // anatomy: labels draw out of the plate
    const lin = seg(p, ...T.labels), lout = seg(p, ...T.labelsOut);
    at(anHead, R.anHead[0] + (1 - O(seg(p, 0.08, 0.13))) * (VW - R.anHead[0]) - lout * (VW * 0.6), R.anHead[1]);
    vis(anHead, p > 0.07 && p < 0.235);
    let d = '', dots = '';
    const keys = Object.keys(ANAT);
    keys.forEach((k, i) => {
      const a = R.anat[k], el = AN[k];
      const kin = O(clamp((lin - i * 0.08) / 0.44)), k2 = kin * (1 - O(lout));
      vis(el, k2 > 0.01);
      if (k2 <= 0.01) return;
      const ex = a.lx + (a.lx < a.ax ? el._w : 0), ey = a.ly + el._h / 2;
      const ext = mobile ? [a.lx + el._w / 2, a.ly + (a.ly < a.ay ? el._h : 0)] : [ex, ey];
      const px = lerp(a.ax, ext[0], k2), py = lerp(a.ay, ext[1], k2);
      d += `M${r1(a.ax)} ${r1(a.ay)}L${r1(px)} ${r1(py)}`;
      dots += `<circle cx="${r1(a.ax)}" cy="${r1(a.ay)}" r="${r1(4 * Math.min(1, k2 * 3))}"/>`;
      at(el, lerp(a.ax - el._w / 2, a.lx, k2), lerp(a.ay - el._h / 2, a.ly, k2), 0.6 + 0.4 * k2);
      op(el, Math.min(1, k2 * 2));
    });
    if (svg._d !== d + dots) { svg._d = d + dots; svg.innerHTML = d ? `<path d="${d}"/>${dots}` : ''; }

    // the pass
    const ph = O(seg(p, 0.23, 0.29)) * (1 - E(seg(p, 0.46, 0.5)));
    at(passHead, R.passHead[0] - (1 - O(seg(p, 0.23, 0.29))) * (passHead.offsetWidth + 60), R.passHead[1] - E(seg(p, 0.46, 0.5)) * (passHead._h + 80));
    vis(passHead, ph > 0.001);
    PASS.forEach((k, i) => {
      const el = P[k], tg = TG[k], u = (p - T.pass[i]) / T.passSpan;
      let x, y, s = 1;
      const span = VW * (mobile ? 1.35 : 0.9);
      const uc = clamp(u, -1.25, 1.25);
      x = R.passC[0] - span * (0.55 * uc + 0.45 * uc * uc * uc);
      y = R.passC[1];
      // passed plates wait off the left edge, then come back to the table
      const gk = gatherK(i + 1, p);
      if (u > 1.25 && gk <= 0) { x = -el._w; }
      const rg = R.ring[k];
      if (gk > 0) { const q = arc(-el._w, R.passC[1], rg.cx, rg.cy, gk); x = q[0]; y = q[1]; s = lerp(1, rg.s, gk); }
      const o2 = E(seg(p, ...T.open));
      if (o2 > 0) { const e = openOut(rg, o2); x = e[0]; y = e[1]; s = lerp(rg.s, rg.s * 0.8, o2); }
      const c2 = E(seg(p, ...T.close));
      if (c2 > 0) { const e = openOut(rg, 1); const fly = offEdge(rg); x = lerp(e[0], fly[0], c2); y = lerp(e[1], fly[1], c2); }
      // plates stay painted while they wait off the stage, so none pops in late
      if (!(u > -1.3 || gk > 0)) { x = VW + el._w; y = R.passC[1]; }
      centre(el, x, y, s * (1 + Math.sin(t * 1.3 + i) * 0.006 * still));
      placeTag(k, tg, x, y, s, u, gk, o2);
    });
    placeTag('bandeja', TG.bandeja, bx, by, bs, 9, g, opn);

    // the picada drops into the middle of the table
    const pk = P.picada, dk = E(seg(p, ...T.drop));
    if (dk <= 0) centre(pk, R.tableC[0], -pk._h, R.pkS);
    if (dk > 0) {
      let x = R.tableC[0], y = lerp(-pk._h, R.tableC[1], dk), s = R.pkS * lerp(1.25, 1, dk);
      if (opn > 0) { x = lerp(x, VW + pk._w * 0.75, opn); y = lerp(y, VH * 1.05, opn); }
      centre(pk, x, y, s * (1 + Math.sin(t * 1.2) * 0.008 * still));
      placeTag('picada', TG.picada, x, y, s, 9, dk, opn);
    } else vis(TG.picada, false);
    const th = O(seg(p, 0.48, 0.54)), thOut = E(seg(p, ...T.open));
    at(tableHead, R.tableHead[0] - (1 - th) * (tableHead.offsetWidth + 60), R.tableHead[1] - thOut * (tableHead._h + 80));
    vis(tableHead, th > 0.001 && thOut < 1);

    // the nights slide in, line by line, and carry on out for the close
    const nk = seg(p, ...T.nights), nOut = E(seg(p, 0.85, 0.91));
    vis(nights, nk > 0 && nOut < 1);
    if (nk > 0) {
      at(nights, R.nights[0] - nOut * (R.nights[0] + nights._w + 40), R.nights[1]);
      const h2 = nights.firstElementChild;
      put(h2, 'transform', `translateX(${r1(-(1 - O(clamp(nk / 0.4))) * VW * 0.7)}px)`);
      NL.forEach((li, i) => put(li, 'transform', `translateX(${r1((1 - O(clamp((nk - 0.1 - i * 0.09) / 0.42))) * VW * 0.9)}px)`));
      put(nights.lastElementChild, 'transform', `translateX(${r1(-(1 - O(clamp((nk - 0.55) / 0.4))) * VW * 0.7)}px)`);
    }

    // the card slides in and holds
    const ck = E(seg(p, 0.87, 0.94));
    vis(card, ck > 0);
    if (ck > 0) at(card, lerp(VW + 20, R.card[0], ck) , R.card[1]);

    // a small plate of tostones drifts through the blank space of each scene
    DR.forEach((el, i) => {
      const SLOT = mobile
        ? [[0.86, 0.1], [0.86, 0.94], [0.86, 0.94], [0.1, 0.94], [0.1, 0.94], [-0.3, 0.94]]
        : [[0.88, 0.22], [0.9, 0.2], [0.92, 0.2], [0.06, 0.88], [0.06, 0.88], [0.05, 0.12]];
      const sc = p < 0.08 ? 0 : p < 0.22 ? 1 : p < 0.5 ? 2 : p < 0.74 ? 3 : p < 0.86 ? 4 : 5;
      const nx = SLOT[sc][0] * VW + Math.sin(t * 0.4 + i * 2) * 18, ny = SLOT[sc][1] * VH + Math.cos(t * 0.33 + i) * 14;
      el._x = el._x == null ? nx : el._x + (nx - el._x) * 0.03;
      el._y = el._y == null ? ny : el._y + (ny - el._y) * 0.03;
      at(el, el._x - el._w / 2, el._y - el._h / 2, 1, ` rotate(${(t * 6 + i * 90) % 360}deg)`);
    });
  }

  function gatherK(i, p) { return E(clamp((p - T.gather[0] - i * 0.022) / (T.gather[1] - T.gather[0] - 4 * 0.022))); }
  function arc(x0, y0, x1, y1, k) { const mx = (x0 + x1) / 2, my = Math.min(y0, y1) - VH * 0.12; const a = 1 - k; return [a * a * x0 + 2 * a * k * mx + k * k * x1, a * a * y0 + 2 * a * k * my + k * k * y1]; }
  function openOut(rg, k) { const f = lerp(1, mobile ? 3.2 : 2.7, k); return [R.tableC[0] + (rg.cx - R.tableC[0]) * f, R.tableC[1] + (rg.cy - R.tableC[1]) * f]; }
  function offEdge(rg) { const dx = rg.cx - R.tableC[0], dy = rg.cy - R.tableC[1], d = Math.hypot(dx, dy) || 1; return [R.tableC[0] + dx / d * VW, R.tableC[1] + dy / d * VW]; }

  // tags ride with their plate: beside it in the pass, small and outside it at the table
  function placeTag(k, tg, x, y, s, u, gk, opn) {
    const el = P[k];
    if (mobile && k !== 'picada' && gk > 0.6) { vis(tg, false); return; }
    if (gk > 0.6 && opn < 0.3) {
      if (!tg.classList.contains('small')) { tg.classList.add('small'); tg._sw = tg.offsetWidth; tg._sh = tg.offsetHeight; }
      const rg = R.ring[k] || { a: Math.PI / 2 };
      const hw = el._w * s / 2, hh = el._h * s / 2;
      let tx, ty;
      if (k === 'picada') { tx = x - hw * 0.82 - tg._sw; ty = y - tg._sh / 2; }
      else if (mobile) { const sn = Math.sin(rg.a); tx = x - tg._sw / 2; ty = sn < 0 ? y - hh * 0.8 - tg._sh : y + hh * 0.8; }
      else {
        const c = Math.cos(rg.a); tx = c >= 0 ? x + hw * 0.8 + 6 : x - hw * 0.8 - 6 - tg._sw; ty = y - tg._sh / 2;
        if (tx + tg._sw > VW - 8 || tx < 8) { tx = x - tg._sw / 2; ty = Math.sin(rg.a) < 0 ? y - hh * 0.8 - tg._sh : y + hh * 0.8; }   // no room beside it: above or below
      }
      at(tg, clamp(tx, 6, VW - tg._sw - 6), clamp(ty, 4, VH - tg._sh - 4));
      vis(tg, true); op(tg, clamp((gk - 0.6) / 0.3) * (1 - clamp(opn / 0.3)));
      return;
    }
    if (tg.classList.contains('small')) tg.classList.remove('small');
    const a = Math.abs(u);
    if (a > 1 || k === 'bandeja' || k === 'picada') { vis(tg, false); return; }
    const o = 1 - clamp((a - 0.28) / 0.3);
    vis(tg, o > 0.01); op(tg, o);
    if (mobile) at(tg, x - tg._w / 2, y + el._h / 2 + 14);
    else at(tg, x + el._w / 2 + 34, y - tg._h / 2);
  }

  // ---- scroll and clock -----------------------------------------------------------------
  let p = 0, pT = 0, last = performance.now(), t = 0;
  const target = () => { const m = spacer.offsetHeight - innerHeight + (innerHeight - VH); return m > 0 ? clamp(scrollY / (document.documentElement.scrollHeight - innerHeight)) : 0; };
  function tick(now) {
    const dt = Math.min(0.05, (now - last) / 1000); last = now; t += dt;
    pT = target();
    const k = reduced.matches ? 1 : 1 - Math.pow(0.0009, dt);
    p += (pT - p) * k; if (Math.abs(pT - p) < 0.00005) p = pT;
    frame(p, t);
    requestAnimationFrame(tick);
  }
  addEventListener('pointermove', (e) => { if (e.pointerType !== 'mouse') return; leanT.x = (e.clientX / innerWidth - 0.5) * 2; leanT.y = (e.clientY / innerHeight - 0.5) * 2; }, { passive: true });
  document.addEventListener('mouseleave', () => { leanT.x = 0; leanT.y = 0; });
  document.querySelector('.brand').addEventListener('click', (e) => { e.preventDefault(); scrollTo({ top: 0, behavior: 'smooth' }); });
  document.querySelector('.skip').addEventListener('click', (e) => { e.preventDefault(); scrollTo({ top: document.documentElement.scrollHeight, behavior: 'smooth' }); card.querySelector('.cta').focus({ preventScroll: true }); });
  // keyboard focus inside the card jumps to the close
  card.addEventListener('focusin', () => { if (target() < 0.95) scrollTo({ top: document.documentElement.scrollHeight }); });

  function start() {
    layout();
    const q = new URLSearchParams(location.search).get('p');
    if (q != null) { const h = document.documentElement.scrollHeight - innerHeight; scrollTo(0, h * clamp(parseFloat(q))); p = pT = target(); }
    else p = pT = target();
    requestAnimationFrame((n) => { last = n; tick(n); stage.classList.add('ready'); });
  }
  let rz; addEventListener('resize', () => { clearTimeout(rz); rz = setTimeout(layout, 120); });
  const imgs = [...document.querySelectorAll('.plate img, .drift')];
  let started = false; const go = () => { if (!started) { started = true; start(); } };
  Promise.all(imgs.map((i) => (i.decode ? i.decode().catch(() => 0) : 0)).concat(document.fonts ? document.fonts.ready : 0)).then(go);
  setTimeout(go, 3000);   // never leave the stage hidden
})();
