/* El Salvadoreño: one fixed stage, one timeline p (0..1) from smoothed scroll. One mover per screen.
   1 hero: headline, line, proof, CTA readable at first paint; still "Salvadoreño" behind; the pupusa breathes
   2 fillings: the pupusa travels left and grows; the eleven fillings and prices sit beside it
   3 peak, one becomes twenty-five: the pupusa shrinks into the centre cell, copies step out into a 5x5 grid,
     the count rolls 1 to 25, and the moment the 25th lands their real tray wipes open over the grid
   4 the kitchen: the tray carries out left, four plates come in as one spread
   5 build your order: the spread lifts away, the builder card rises, the pupusa comes back and sits on its edge
   6 close: the builder carries out, the close card comes in, the pupusa stays on the card's edge. Holds.
   Motion off (toggle or system setting): the CSS static layout takes over and nothing here runs.
   ?p=0.6 jumps there. The builder works in both layouts. */
(() => {
  const $ = (s) => document.getElementById(s);
  const root = document.documentElement;
  const stage = $('stage');
  const E = {
    word: $('bgword'), hero: $('hero'), pup: $('pup'), fill: $('fill'), tray: $('tray'), grid: $('grid'),
    count: $('count'), countN: $('countN'), partyCopy: $('partyCopy'), spreadH: $('spreadH'),
    builder: $('builder'), close: $('close'),
  };
  const plates = [...document.querySelectorAll('.plate')];
  const copies = [...E.grid.querySelectorAll('img')];

  const clamp = (v, a = 0, b = 1) => (v < a ? a : v > b ? b : v);
  const seg = (p, a, b) => clamp((p - a) / (b - a));
  const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const out = (t) => 1 - Math.pow(1 - t, 3);
  const lerp = (a, b, t) => a + (b - a) * t;
  const r1 = (v) => Math.round(v * 10) / 10;
  const put = (el, k, v) => { const c = el._c || (el._c = {}); if (c[k] !== v) { c[k] = v; el.style[k] = v; } };
  const at = (el, x, y, s = 1) => put(el, 'transform', `translate3d(${r1(x)}px,${r1(y)}px,0)${s !== 1 ? ` scale(${s.toFixed(4)})` : ''}`);
  const vis = (el, on) => put(el, 'visibility', on ? 'visible' : 'hidden');

  // timeline windows
  const T = {
    toFill: [0.06, 0.16], toGrid: [0.25, 0.32], multiply: [0.32, 0.42], trayOpen: [0.42, 0.47],
    toSpread: [0.56, 0.64], toBuilder: [0.74, 0.8], toClose: [0.88, 0.94],
  };

  // ---- builder: works in both layouts --------------------------------------------------------
  const rows = [...document.querySelectorAll('.row')];
  const send = $('send'), tCount = $('tCount'), tPrice = $('tPrice'), tip = $('tip');
  const WA = send.getAttribute('href').split('?')[0];
  function sum() {
    let n = 0, total = 0; const lines = [];
    rows.forEach((r) => { const q = +r.dataset.q || 0; if (!q) return; n += q; total += q * +r.dataset.p; lines.push(`${q} x ${r.dataset.n}`); });
    tCount.textContent = `${n} pupusa${n === 1 ? '' : 's'}`;
    tPrice.textContent = `$${total.toFixed(2)}`;
    tip.hidden = n < 20;
    const msg = n
      ? `Hola! I'd like to order from El Salvadoreño:\n${lines.join('\n')}\nMenu total: $${total.toFixed(2)}${n >= 20 ? '\n(Or the 25 pupusa party tray if that works better.)' : ''}\nName:\nPickup time:`
      : "Hola! I'd like to order from El Salvadoreño.";
    send.href = `${WA}?text=${encodeURIComponent(msg)}`;
  }
  rows.forEach((r) => {
    r.dataset.q = 0;
    const set = (q) => { q = Math.max(0, Math.min(99, q)); r.dataset.q = q; r.querySelector('.qn').textContent = q; r.classList.toggle('on', q > 0); sum(); };
    r.querySelector('.plus').addEventListener('click', () => set(+r.dataset.q + 1));
    r.querySelector('.minus').addEventListener('click', () => set(+r.dataset.q - 1));
  });
  sum();

  // ---- open now (their hours, Miami time) -------------------------------------------------------
  (function openNow() {
    const el = $('openNow');
    try {
      const f = new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', weekday: 'short', hour: 'numeric', minute: 'numeric', hour12: false });
      const parts = Object.fromEntries(f.formatToParts(new Date()).map((x) => [x.type, x.value]));
      const day = parts.weekday, h = (+parts.hour % 24) + +parts.minute / 60;
      const closes = day === 'Fri' || day === 'Sat' ? 22 : 21;
      const label = closes === 22 ? '10pm' : '9pm';
      el.textContent = h >= 8 && h < closes ? `Open now until ${label}` : h < 8 ? `Opens today at 8am` : `Closed now. Opens tomorrow at 8am`;
    } catch (e) { /* keep the static line */ }
  })();

  // ---- motion layout ------------------------------------------------------------------------------
  const motionOn = () => root.classList.contains('js') && root.getAttribute('data-motion') === 'on';
  let VW = 0, VH = 0, TOP = 0, mob = false, L = {};
  let p = 0, pT = 0, running = false, t0 = performance.now(), forced = null;

  const q = new URLSearchParams(location.search).get('p');
  if (q !== null && !isNaN(+q)) forced = clamp(+q);

  function box(el) { return { w: el.offsetWidth, h: el.offsetHeight }; }

  function layout() {
    [...stage.querySelectorAll('*')].concat([...stage.children]).forEach((el) => { el._c = {}; el.style.transform = ''; el.style.visibility = ''; el.style.width = ''; el.style.clipPath = ''; el.style.maxHeight = ''; });
    if (!motionOn()) return;
    VW = root.clientWidth; VH = stage.clientHeight; mob = VW <= 760;
    TOP = document.querySelector('.bar').offsetHeight;
    const pad = mob ? 16 : Math.min(56, Math.max(24, VW * 0.04));
    const H = VH - TOP, midY = TOP + H / 2;
    L = { pad, H, midY };

    // widths first, then measure heights
    put(E.hero, 'width', `${mob ? VW - pad * 2 : Math.min(620, VW * 0.48)}px`);
    put(E.fill, 'width', `${mob ? VW - pad * 2 : Math.min(560, VW * 0.42)}px`);
    const cardW = mob ? VW - pad * 2 : Math.min(540, VW * 0.42);
    put(E.builder, 'width', `${cardW}px`); put(E.close, 'width', `${cardW}px`);
    E.builder.querySelector('.card').style.maxHeight = `${H - 24}px`;
    E.builder.querySelector('.card').style.overflowY = 'auto';

    // hero
    const hb = box(E.hero), wb = box(E.word);
    L.hero = { x: pad, y: mob ? TOP + 20 : midY - hb.h / 2 - H * 0.04 };
    L.word = { x: mob ? pad * 0.5 : pad * 0.6, y: VH - wb.h * (mob ? 0.92 : 0.86) };
    const S0 = mob ? Math.min(VW * 0.74, VH - (L.hero.y + hb.h) - 24) : Math.min(H * 0.66, VW * 0.42);
    L.s0 = { s: S0, cx: mob ? VW - pad - S0 / 2 + S0 * 0.06 : VW * 0.71, cy: mob ? L.hero.y + hb.h + 12 + S0 / 2 : midY + H * 0.03 };

    // fillings
    const fb = box(E.fill);
    const S1 = mob ? VW * 0.34 : Math.min(H * 0.7, VW * 0.4);
    L.s1 = { s: S1, cx: mob ? VW - pad - S1 / 2 : VW * 0.27, cy: mob ? TOP + 8 + S1 / 2 : midY };
    L.fill = { x: mob ? pad : VW * 0.52, y: mob ? TOP + 8 + S1 * 0.42 : midY - fb.h / 2 };

    // grid and tray (same square)
    const G = mob ? Math.min(VW - pad * 2, H * 0.52) : Math.min(H * 0.72, VW * 0.42);
    put(E.grid, 'width', `${G}px`); put(E.tray, 'width', `${G}px`);
    L.g = { s: G, x: mob ? (VW - G) / 2 : VW * 0.34 - G / 2, y: mob ? TOP + 12 : midY - G / 2 };
    const cell = G / 5;
    L.cell = cell;
    const cb = box(E.count), pb = box(E.partyCopy);
    L.count = { x: mob ? pad : VW * 0.6, y: mob ? L.g.y + G + 12 : midY - (cb.h + pb.h + 16) / 2 };
    put(E.partyCopy, 'width', `${mob ? VW - pad * 2 : Math.min(460, VW * 0.34)}px`);
    L.pcopy = { x: L.count.x, y: L.count.y + cb.h + 12 };
    // copy order: centre cell first, then outward
    const cells = [...Array(25).keys()].sort((a, b) => {
      const d = (i) => Math.hypot((i % 5) - 2, Math.floor(i / 5) - 2) + i * 1e-3; return d(a) - d(b);
    });
    L.cells = cells;

    // spread
    const sh = box(E.spreadH);
    const cols = mob ? 2 : 4, gap = mob ? 12 : 20;
    const pw = Math.min(mob ? 999 : 280, (VW - pad * 2 - gap * (cols - 1)) / cols);
    plates.forEach((pl) => { put(pl, 'width', `${pw}px`); pl.querySelector('span').style.display = mob ? 'none' : ''; });
    const ph = box(plates[0]).h;
    const totalW = pw * cols + gap * (cols - 1);
    L.spreadH = { x: mob ? pad : (VW - totalW) / 2, y: mob ? TOP + 12 : midY - (sh.h + 24 + ph) / 2 };
    L.plates = plates.map((_, i) => ({
      x: (mob ? pad : (VW - totalW) / 2) + (i % cols) * (pw + gap),
      y: L.spreadH.y + sh.h + (mob ? 14 : 24) + Math.floor(i / cols) * (ph + gap) + (!mob && i % 2 ? 28 : 0),
    }));

    // builder and close cards, pupusa sitting on the card's left edge
    const bb = box(E.builder), clb = box(E.close);
    const cx = mob ? pad : VW * 0.5 - cardW / 2 + VW * 0.07;
    L.builder = { x: cx, y: Math.max(TOP + 10, midY - bb.h / 2) };
    L.close = { x: cx, y: Math.max(TOP + 10, midY - clb.h / 2) };
    const S2 = mob ? 84 : Math.min(H * 0.42, 300, cx - pad);
    // desktop: the pupusa overlaps only the card's left padding, never its text. Phone: no room, it stays off stage.
    const edge = (y) => ({ s: S2, cx: mob ? VW + S2 : cx - S2 / 2 + 22, cy: y + S2 * 0.62 });
    L.s2 = edge(L.builder.y); L.s3 = edge(L.close.y);

    E.pup._base = 496;   // natural cutout width; scale from it
    put(E.pup, 'width', '496px');
    copies.forEach((c) => put(c, 'width', `${cell * 0.96}px`));
  }

  function pupAt(cx, cy, s) { at(E.pup, cx - 248, cy - 249, s / 496); }

  function frame(now) {
    if (!motionOn()) { running = false; return; }
    const doc = root.scrollHeight - innerHeight;
    pT = forced !== null ? forced : clamp(scrollY / Math.max(1, doc));
    p += (pT - p) * (forced !== null ? 1 : 0.14);
    if (Math.abs(pT - p) < 0.0004) p = pT;
    draw(p, (now - t0) / 1000);
    requestAnimationFrame(frame);
  }

  function draw(p, t) {
    const { pad } = L;
    // 1 > 2: hero copy slides up and off, the word slides left, the pupusa travels
    const a = ease(seg(p, ...T.toFill));
    at(E.hero, L.hero.x - a * (VW * 0.15), L.hero.y - a * (VH * 1.05));
    at(E.word, L.word.x - a * VW * 0.6, L.word.y);
    vis(E.word, a < 1); vis(E.hero, a < 1);
    at(E.fill, L.fill.x + (1 - a) * VW, L.fill.y);
    vis(E.fill, a > 0);

    // 2 > 3: fillings slide off right, pupusa shrinks into the centre cell
    const b = ease(seg(p, ...T.toGrid));
    if (b > 0) at(E.fill, L.fill.x + b * VW, L.fill.y);
    if (b >= 1) vis(E.fill, false);

    const m = seg(p, ...T.multiply);
    const landed = Math.max(1, Math.min(25, Math.floor(m * 25) + 1));
    const o = ease(seg(p, ...T.trayOpen));
    const sp = ease(seg(p, ...T.toSpread));
    const shift = -sp * VW * 1.1;

    // the pupusa itself
    const centre = { cx: L.g.x + L.g.s / 2, cy: L.g.y + L.g.s / 2, s: L.cell * 0.96 };
    let P;
    if (p < T.toGrid[0]) {
      const breathe = a === 0 && !document.hidden ? 1 + Math.sin(t * 1.6) * 0.012 : 1;
      P = { cx: lerp(L.s0.cx, L.s1.cx, a), cy: lerp(L.s0.cy, L.s1.cy, a), s: lerp(L.s0.s, L.s1.s, a) * breathe };
    } else {
      P = { cx: lerp(L.s1.cx, centre.cx, b), cy: lerp(L.s1.cy, centre.cy, b), s: lerp(L.s1.s, centre.s, b) };
    }
    const bk = ease(seg(p, ...T.toBuilder)), cl = ease(seg(p, ...T.toClose));
    if (p >= T.toSpread[0]) {
      // carried out with the tray, then back in to sit on the builder card's edge
      P = { cx: centre.cx + shift, cy: centre.cy, s: centre.s };
      if (bk > 0) P = { cx: lerp(-L.s2.s, L.s2.cx, bk), cy: lerp(L.s2.cy + VH * 0.3, L.s2.cy, bk), s: L.s2.s };
      if (cl > 0) P = { cx: lerp(L.s2.cx, L.s3.cx, cl), cy: lerp(L.s2.cy, L.s3.cy, cl), s: L.s2.s };
    }
    pupAt(P.cx, P.cy, P.s);
    // the copy in the centre cell takes over once the original lands there
    const gridOn = p >= T.multiply[0] && p < T.toBuilder[0] && o < 1;
    vis(E.pup, !(gridOn && b >= 1) || p >= T.toBuilder[0]);

    // 3 peak: copies step out of the centre into their cells
    vis(E.grid, gridOn);
    if (gridOn) {
      at(E.grid, L.g.x + shift, L.g.y);
      const cs = L.cell;
      L.cells.forEach((cellIdx, k) => {
        const c = copies[k];
        const tk = clamp(m * 25 - k);   // 0..1 for this copy
        const e = out(tk);
        const tx = (cellIdx % 5) * cs, ty = Math.floor(cellIdx / 5) * cs;
        const sx = 2 * cs, sy = 2 * cs;   // centre cell
        vis(c, k === 0 || tk > 0);
        at(c, lerp(sx, tx, e) + cs * 0.02, lerp(sy, ty, e) + cs * 0.02);
      });
    }
    E.countN.textContent = landed;
    E.count.querySelector('small').textContent = landed === 1 ? 'pupusa' : 'pupusas';
    const cIn = ease(seg(p, T.toGrid[0], T.multiply[0]));
    vis(E.count, cIn > 0 && sp < 1); vis(E.partyCopy, o > 0 && sp < 1);
    at(E.count, L.count.x + (1 - cIn) * VW * 0.5 + shift, L.count.y);
    at(E.partyCopy, L.pcopy.x + (1 - o) * VW * 0.5 + shift, L.pcopy.y);

    // their real tray wipes open over the grid from the centre: the 25 you watched become the 25 they sell
    vis(E.tray, o > 0 && sp < 1);
    at(E.tray, L.g.x + shift, L.g.y);
    put(E.tray, 'clipPath', `circle(${(o * 72).toFixed(2)}% at 50% 50%)`);

    // 4 spread: comes in from the right as one piece, lifts away for the builder
    const spIn = 1 - sp, spUp = bk * VH * 1.05;
    const spOn = sp > 0 && bk < 1;
    vis(E.spreadH, spOn); plates.forEach((pl) => vis(pl, spOn));
    at(E.spreadH, L.spreadH.x + spIn * VW, L.spreadH.y - spUp);
    plates.forEach((pl, i) => at(pl, L.plates[i].x + spIn * VW * (1 + i * 0.06), L.plates[i].y - spUp));

    // 5 builder rises, 6 carries out left as the close card comes in
    vis(E.builder, bk > 0 && cl < 1);
    at(E.builder, L.builder.x - cl * VW, L.builder.y + (1 - bk) * VH);
    vis(E.close, cl > 0);
    at(E.close, L.close.x + (1 - cl) * VW, L.close.y);

    root.classList.toggle('past-hero', p > T.toFill[0] + 0.02);
  }

  // static layout: the bar's CTA shows once the hero's own CTA has scrolled away
  function staticBar() { if (!motionOn()) root.classList.toggle('past-hero', E.hero.getBoundingClientRect().bottom < 60); }
  addEventListener('scroll', staticBar, { passive: true });

  function start() {
    layout();
    if (!motionOn()) { staticBar(); return; }
    if (forced !== null) {
      const doc = root.scrollHeight - innerHeight; scrollTo(0, forced * doc); forced = null; p = pT = clamp(scrollY / Math.max(1, doc));
    }
    if (!running) { running = true; requestAnimationFrame(frame); }
  }

  let rz = 0;
  addEventListener('resize', () => { cancelAnimationFrame(rz); rz = requestAnimationFrame(start); });
  document.addEventListener('lg:motion', () => { scrollTo(0, 0); p = pT = 0; start(); });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(start);
  addEventListener('load', start);
  start();

  addEventListener('DOMContentLoaded', () => { if (window.LiquidGlass) { LiquidGlass.cursorBall(); } });
})();
