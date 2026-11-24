/* Brazilian Taste: one unbroken white world.
   One fixed stage, one timeline p (0..1) driven by smoothed scroll. Nothing scrolls past:
   every scene turns into the next (split -> Monday -> mosaic -> three strips -> green band -> close).
   Moving things get transform / opacity / clip-path only, written only when they change.
   Layout is measured once per resize, never inside the frame loop.
   Test switch: ?p=0.42 jumps the camera to that point on load. */
(() => {
  const AR = 3210 / 1200;                  // wordmark box (their avatar letters, 3x)
  const GAP_C = 1650.5 / 3210;             // between the "i" and the "l" of Brazi|lian
  const GAP_H = 41.5 / 3210;
  const GLYPH_T = 0.0375, GLYPH_B = 0.925; // letter tops and baseline inside the box
  const TRAY_AR = 1348 / 1435;             // cut-tray.webp
  const LETTERS = [[0.654, 10.405], [13.988, 9.408], [24.611, 9.439], [35.639, 9.751], [46.978, 3.146],
                   [52.71, 2.928], [58.224, 3.146], [63.676, 9.439], [75.857, 9.875], [86.449, 13.551]];

  const $ = (s) => document.querySelector(s);
  const $$ = (s) => [...document.querySelectorAll(s)];
  const root = document.documentElement;
  const stage = $('#stage'), spacer = $('#spacer'), bar = $('#bar');
  const wm = $('#wm'), wmL = $('#wmL'), wmR = $('#wmR'), letters = $$('.wm .l');
  const tray = $('#tray'), trayTilt = $('#trayTilt'), fruits = $$('.fruit');
  const heroCopy = $('#heroCopy'), marquee = $('#marquee'), openPh = $('#openPh');
  const week = $('#week'), weekH = $('#weekH'), ph0 = $('.ph0'), odo = $('#odo');
  const days = $$('.day'), lns = $$('.ln');
  const fillDays = days.filter((d) => d.querySelector('.ph img'));          // Tue..Sun, in order
  const ways = $('#ways'), slots = $$('.slot'), nums = $$('.num'), flyers = $$('.flyer');
  const band = $('#band'), steps = $$('.steps li'), lift = $('#lift');
  const close = $('#close');
  const ctaFly = $('#ctaFly'), cta = ctaFly.firstElementChild, slotHero = $('#slotHero'), slotClose = $('#slotClose');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');

  const clamp = (v, a = 0, b = 1) => (v < a ? a : v > b ? b : v);
  const seg = (p, a, b) => clamp((p - a) / (b - a));
  const E = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const lerp = (a, b, t) => a + (b - a) * t;
  const r1 = (v) => Math.round(v * 10) / 10;
  const put = (el, prop, val) => { const c = el._c || (el._c = {}); if (c[prop] !== val) { c[prop] = val; el.style[prop] = val; } };
  const show = (el, on) => put(el, 'visibility', on ? 'visible' : 'hidden');
  const box = (el, x, y, w, h) => Object.assign(el.style, { left: x + 'px', top: y + 'px', width: w + 'px', height: h + 'px' });

  // fruit spots: [x of VW, y of VH, size as share of the wordmark height, exit direction x, y]
  const FRUIT_D = [[0.2, 0.05, 0.3, -1, -0.6], [0.83, 0.07, 0.22, 1, -0.7], [0.66, 0.6, 0.36, 0.6, 1]];
  const FRUIT_M = [[0.06, 0.06, 0.42, -1, -0.6], [0.78, 0.075, 0.32, 1, -0.7], [0.74, 0.43, 0.5, 1, 0.4]];

  let VW = 0, VH = 0, mobile = false, L = {};

  function layout() {
    VW = root.clientWidth;
    VH = stage.clientHeight;
    mobile = VW <= 760;
    // clear moving transforms so every measurement is the resting layout
    const moved = [week, ways, ...days, ...nums];
    moved.forEach((el) => { el.style.transform = 'none'; el._c = {}; });

    const wmW = mobile ? VW - 32 : Math.min(VW * 0.88, VH * 0.4 * AR, 1500);
    const wmH = wmW / AR;
    const wmX = (VW - wmW) / 2;
    const wmY = (mobile ? 0.22 : 0.33) * VH - wmH / 2;
    box(wm, wmX, wmY, wmW, wmH);

    // the tray, in front of the middle letters
    const tH = wmH * (mobile ? 1.45 : 1.05), tW = tH * TRAY_AR;
    const tCx = wmX + wmW * GAP_C, tCy = wmY + wmH * (mobile ? 1.28 : 0.95);
    box(tray, tCx - tW / 2, tCy - tH / 2, tW, tH);
    // letters the tray really covers (inner 80% of its box) get the wobble
    const ix0 = tCx - tW * 0.4, ix1 = tCx + tW * 0.4, iy0 = tCy - tH * 0.4;
    letters.forEach((l, i) => {
      const x0 = wmX + wmW * LETTERS[i][0] / 100, x1 = x0 + wmW * LETTERS[i][1] / 100;
      l.classList.toggle('cov', x1 > ix0 && x0 < ix1 && iy0 < wmY + wmH * GLYPH_B);
    });

    (mobile ? FRUIT_M : FRUIT_D).forEach((f, i) => {
      const s = Math.max(40, wmH * f[2] * (mobile ? 1.6 : 1));
      box(fruits[i], VW * f[0] - s / 2, VH * f[1], s, s);
      fruits[i]._v = [f[3], f[4]];
    });

    // Monday cell, and the fly-apart vectors of the mosaic
    const r = ph0.getBoundingClientRect();
    const s = Math.max(r.width / VW, r.height / VH);
    const cx = VW / 2, cy = VH * 0.55;
    days.forEach((d, i) => {
      const b = d.getBoundingClientRect();
      const dx = b.left + b.width / 2 - cx, dy = b.top + b.height / 2 - cy, n = Math.hypot(dx, dy) || 1;
      d._v = [dx / n, dy / n, (i % 2 ? 1 : -1) * (6 + (i % 3) * 3)];
    });
    const hb = weekH.getBoundingClientRect();
    weekH._v = [-0.3, -1, -4];

    // three way flyers: from their mosaic cell to their strip
    flyers.forEach((f, i) => {
      const cell = days.find((d) => d.dataset.way === String(i)).querySelector('.ph').getBoundingClientRect();
      const sl = slots[i].getBoundingClientRect();
      box(f, sl.left, sl.top, sl.width, sl.height);
      const s0 = Math.max(cell.width / sl.width, cell.height / sl.height);
      f._g = { s0, tx0: cell.left + cell.width / 2 - (sl.width * s0) / 2 - sl.left, ty0: cell.top + cell.height / 2 - (sl.height * s0) / 2 - sl.top,
               ix0: (sl.width - cell.width / s0) / 2, iy0: (sl.height - cell.height / s0) / 2 };
      f._c = {};
    });

    // the travelling button: its full size is the close size; hero and header are scaled-down copies of it
    const bw = cta.offsetWidth, bh = cta.offsetHeight, bf = parseFloat(getComputedStyle(cta).fontSize);
    const sHero = 17 / bf, sBar = (mobile ? 13.5 : 14.5) / bf;
    Object.assign(slotHero.style, { width: bw * sHero + 'px', height: bh * sHero + 'px' });
    Object.assign(slotClose.style, { width: bw + 'px', height: bh + 'px' });
    heroCopy.style.transform = 'none'; close.style.transform = 'none';
    const rh = slotHero.getBoundingClientRect(), rc = slotClose.getBoundingClientRect();
    const barH = bar.offsetHeight, pad = Math.max(16, VW * 0.03);
    const C = {
      hero: { x: rh.left, y: rh.top, s: sHero },
      bar: { x: VW - pad - bw * sBar, y: (barH - bh * sBar) / 2, s: sBar },
      close: { x: rc.left, y: rc.top, s: 1 },
    };
    L = {
      wmH, C, barH, gc: wmX + wmW * GAP_C, gh: wmW * GAP_H,
      gT: wmY + wmH * GLYPH_T, gB: VH - (wmY + wmH * GLYPH_B),
      cell: { s, tx: r.left + r.width / 2 - (VW * s) / 2, ty: r.top + r.height / 2 - (VH * s) / 2,
              ix: (VW - r.width / s) / 2, iy: (VH - r.height / s) / 2 },
      mon: days[0]._v,
      liftH: lift.offsetHeight,
      track: spacer.offsetHeight - innerHeight,
    };
    for (const el of [ctaFly, bar, wmL, wmR, tray, openPh, ways, band, lift, close, heroCopy, marquee, weekH, ...fruits, ...letters, ...lns, ...steps,
      ...days.map((d) => d.querySelector('.ph img')).filter(Boolean), ...flyers.map((f) => f.querySelector('img'))]) el._c = {};
    moved.forEach((el) => { el._c = {}; });
    root.classList.add('ready');
    dirty = true;
  }

  function render(p) {
    const { gc, gh, gT, gB, cell } = L;

    // 1. hero -> 2. split. Same moves played backwards for the close.
    const s1 = E(seg(p, 0.03, 0.17));
    const back = E(seg(p, 0.91, 0.985));
    const open = p < 0.5 ? s1 : 1 - back;                  // 0 = hero composition, 1 = everything parted
    const dx = open * VW * 0.8;
    put(wmL, 'transform', `translate3d(${r1(-dx)}px,0,0)`);
    put(wmR, 'transform', `translate3d(${r1(dx)}px,0,0)`);
    show(wm, dx < VW * 0.75);

    // the tray lifts toward the camera and out; fruit scatters
    const te = p < 0.5 ? E(seg(p, 0.02, 0.13)) : 1 - E(seg(p, 0.9, 0.975));
    put(tray, 'transform', `translate3d(0,${r1(-te * VH * 0.95)}px,0) scale(${(1 + te * 0.7).toFixed(3)}) rotate(${r1(te * 16)}deg)`);
    put(tray, 'opacity', String(1 - clamp((te - 0.45) / 0.4)));
    show(tray, te < 0.85);
    fruits.forEach((f) => {
      const [vx, vy] = f._v;
      put(f, 'transform', `translate3d(${r1(vx * te * VW * 0.5)}px,${r1(vy * te * VH * 0.6)}px,0) scale(${(1 + te * 0.5).toFixed(3)})`);
      show(f, te < 0.95);
    });

    const hc = seg(p, 0.015, 0.07);
    const k = E(seg(p, 0.95, 1));
    put(heroCopy, 'opacity', String(1 - hc));
    put(heroCopy, 'transform', `translate3d(0,${r1(24 * hc)}px,0)`);
    show(heroCopy, hc < 1);
    const mq = Math.max(1 - hc, k);
    put(marquee, 'opacity', String(mq)); show(marquee, mq > 0);

    // the bowls open in the gap, go full bleed, then become Monday, then fly off with the mosaic
    const mf = E(seg(p, 0.5, 0.58));
    if (p < 0.18) {
      if (s1 <= 0) put(openPh, 'clipPath', 'inset(50% 50% 50% 50%)');
      else {
        const hg = gh + dx, t2 = E(seg(p, 0.075, 0.17));
        put(openPh, 'clipPath', `inset(${r1(lerp(gT, 0, t2))}px ${r1(Math.max(0, VW - (gc + hg)))}px ${r1(lerp(gB, 0, t2))}px ${r1(Math.max(0, gc - hg))}px)`);
      }
      put(openPh, 'transform', 'translate3d(0,0,0) scale(1)');
      put(openPh, 'opacity', '1');
    } else {
      const m = E(seg(p, 0.18, 0.26));
      const fx = L.mon[0] * mf * VW * 0.9, fy = L.mon[1] * mf * VH * 0.9;
      put(openPh, 'transform', `translate3d(${r1(lerp(0, cell.tx, m) + fx)}px,${r1(lerp(0, cell.ty, m) + fy)}px,0) scale(${(lerp(1, cell.s, m) * (1 - mf * 0.25)).toFixed(4)})`);
      put(openPh, 'clipPath', `inset(${r1(lerp(0, cell.iy, m))}px ${r1(lerp(0, cell.ix, m))}px)`);
      put(openPh, 'opacity', String(1 - mf));
    }
    show(openPh, s1 > 0 && mf < 1);

    // 3. the week fills, cell by cell, each from its own side
    const wk = seg(p, 0.17, 0.24);
    put(week, 'opacity', String(wk));
    show(week, wk > 0 && mf < 1);
    lns.forEach((ln, i) => put(ln, 'transform', `scaleX(${E(seg(p, 0.2 + i * 0.012, 0.27 + i * 0.012)).toFixed(3)})`));
    put(weekH, 'opacity', String(seg(p, 0.2, 0.26) * (1 - mf)));
    put(weekH, 'transform', `translate3d(${r1(weekH._v[0] * mf * VW * 0.4)}px,${r1(weekH._v[1] * mf * VH * 0.4)}px,0)`);
    let done = 1;
    fillDays.forEach((d, i) => {
      const img = d.querySelector('.ph img');
      const a = 0.25 + i * 0.036, f = E(seg(p, a, a + 0.05)), o = r1((1 - f) * 100);
      if (f > 0.5) done++;
      const dir = +d.dataset.dir;
      put(img, 'clipPath', dir === 0 ? `inset(${o}% 0 0 0)` : dir === 1 ? `inset(0 ${o}% 0 0)` : dir === 2 ? `inset(0 0 ${o}% 0)` : `inset(0 0 0 ${o}%)`);
      put(img, 'transform', `scale(${(1.14 - 0.14 * f).toFixed(4)})`);
      show(img, !(d.dataset.way && p >= 0.5));
    });
    if (odo._n !== done) { odo._n = done; odo.style.transform = `translateY(${-(done - 1)}em)`; }

    // 4. the mosaic flies apart, Wed / Sat / Sun become the three strips
    days.forEach((d, i) => {
      if (d.dataset.way) { put(d, 'opacity', String(1 - seg(p, 0.5, 0.53))); return; }
      const f = E(seg(p, 0.5 + (i % 4) * 0.008, 0.58 + (i % 4) * 0.008));
      const [vx, vy, rot] = d._v;
      put(d, 'transform', f ? `translate3d(${r1(vx * f * VW * 0.9)}px,${r1(vy * f * VH * 0.9)}px,0) rotate(${r1(rot * f)}deg) scale(${(1 - f * 0.25).toFixed(3)})` : 'none');
      put(d, 'opacity', String(1 - f));
    });

    const out = E(seg(p, 0.78, 0.87)), wy2 = -out * VH * 0.45, wo = 1 - seg(p, 0.81, 0.87);
    put(ways, 'transform', `translate3d(0,${r1(wy2)}px,0)`);
    put(ways, 'opacity', String(wo));
    show(ways, p >= 0.5 && out < 1);
    flyers.forEach((fl, i) => {
      const g = fl._g, m = E(seg(p, 0.5 + i * 0.015, 0.61 + i * 0.015)), sc = lerp(g.s0, 1, m);
      put(fl, 'transform', `translate3d(${r1(lerp(g.tx0, 0, m))}px,${r1(lerp(g.ty0, 0, m) + wy2)}px,0) scale(${sc.toFixed(4)})`);
      put(fl, 'clipPath', `inset(${r1(lerp(g.iy0, 0, m))}px ${r1(lerp(g.ix0, 0, m))}px)`);
      put(fl, 'opacity', String(wo));
      put(fl.firstElementChild, 'transform', `translate3d(0,${r1((p - 0.69) * -120)}px,0) scale(1.1)`);
      show(fl, p >= 0.5 && out < 1);
      const n = nums[i], t = E(seg(p, 0.56 + i * 0.03, 0.64 + i * 0.03));
      const sp = n.firstElementChild, tx = n.lastElementChild;
      put(sp, 'clipPath', `inset(${r1((1 - t) * 100)}% 0 0 0)`);
      put(sp, 'transform', `translate3d(0,${r1((1 - t) * 30)}%,0)`);
      put(tx, 'opacity', String(t));
      put(tx, 'transform', `translate3d(0,${r1((1 - t) * 24)}px,0)`);
    });

    // 5. how to order: their green rises, the lunch box rides its edge
    const b = E(seg(p, 0.77, 0.86));
    const c = E(seg(p, 0.9, 0.97));
    const rest = VH * (mobile ? 0.36 : 0.4);
    const bandTop = lerp(VH, rest, b) - c * (rest + VH * 1.02);
    put(band, 'transform', `translate3d(0,${r1(bandTop)}px,0)`);
    show(band, b > 0 && c < 1);
    steps.forEach((li, i) => {
      const t = E(seg(p, 0.83 + i * 0.018, 0.865 + i * 0.018));
      put(li, 'opacity', String(t));
      put(li, 'transform', `translate3d(${r1((1 - t) * -40)}px,0,0)`);
    });
    // the lunch box starts below the fold and is dragged up onto the band's edge
    const lp = E(seg(p, 0.82, 0.9));
    const rise = E(seg(p, 0.775, 0.875));
    const liftY = lerp(VH + 40, bandTop - L.liftH * 0.58, rise) - lp * VH * 0.05;
    put(lift, 'transform', `translate3d(0,${r1(liftY)}px,0) rotate(${r1(-14 + lp * 8)}deg)`);
    show(lift, b > 0 && liftY + L.liftH > 0);

    // 6. close: Brazilian closes, the tray drops back in, the button holds
    put(close, 'opacity', String(k));
    put(close, 'transform', `translate3d(0,${r1((1 - k) * 24)}px,0)`);
    show(close, k > 0);

    // the header bar slides in and out with the scroll, so the button lands in it
    const bIn = E(seg(p, 0.03, 0.065)), bOut = E(seg(p, 0.925, 0.96));
    put(bar, 'transform', `translate3d(0,${r1(-(1 - bIn + bOut) * (L.barH + 40))}px,0)`);
    // one button: hero (bottom right) -> header (top right) -> close (bottom right, growing)
    const C = L.C, up = E(seg(p, 0.015, 0.07)), down = E(seg(p, 0.925, 0.99));
    const A = p < 0.5 ? C.hero : C.bar, Z = p < 0.5 ? C.bar : C.close, t = p < 0.5 ? up : down;
    // arc a little on the way, so it travels instead of sliding on a rail
    const arc = Math.sin(t * Math.PI) * (p < 0.5 ? -40 : 40);
    put(ctaFly, 'transform', `translate3d(${r1(lerp(A.x, Z.x, t) + arc)}px,${r1(lerp(A.y, Z.y, t))}px,0) scale(${lerp(A.s, Z.s, t).toFixed(4)})`);
    tiltOn = te < 0.5;
  }

  // smoothed scroll
  let cur = 0, target = 0, last = 0, dirty = true, running = false;
  // scroll -> timeline. The first 77% of the story keeps its old pace; "how to order" to the
  // close gets 2.7x more scroll (Son: "much slower"). S0 = share of the scroll before that part.
  const P0 = 0.77, S0 = 0.55;
  const toP = (s) => (s < S0 ? (s / S0) * P0 : P0 + ((s - S0) / (1 - S0)) * (1 - P0));
  const toS = (q) => (q < P0 ? (q / P0) * S0 : S0 + ((q - P0) / (1 - P0)) * (1 - S0));
  const REC = /[?&]rec(?:[&=]|$)/.test(location.search);   // recording switch: no smoothing, the recorder drives the scroll
  const readTarget = () => { target = L.track > 0 ? toP(clamp(scrollY / L.track)) : 0; };
  function frame(t) {
    const dt = last ? Math.min(64, t - last) : 16.7; last = t;
    const k = reduced.matches || REC ? 1 : 1 - Math.pow(1 - 0.12, dt / 16.7);
    const d = target - cur;
    cur = Math.abs(d) < 0.00002 ? target : cur + d * k;
    if (dirty || d !== 0) { render(cur); dirty = false; }
    if (cur !== target) requestAnimationFrame(frame); else { running = false; last = 0; }
  }
  const kick = () => { readTarget(); if (!running) { running = true; requestAnimationFrame(frame); } };

  // the tray leans toward the cursor (its own tiny loop, only while it's on screen)
  let tiltOn = true, tx = 0, ty = 0, gx = 0, gy = 0, tiltRun = false;
  function tilt() {
    gx += (tx - gx) * 0.08; gy += (ty - gy) * 0.08;
    trayTilt.style.transform = `rotateX(${gx.toFixed(2)}deg) rotateY(${gy.toFixed(2)}deg)`;
    if (Math.abs(tx - gx) > 0.02 || Math.abs(ty - gy) > 0.02) requestAnimationFrame(tilt); else tiltRun = false;
  }
  if (!reduced.matches && matchMedia('(hover: hover) and (pointer: fine)').matches) {
    addEventListener('pointermove', (e) => {
      if (!tiltOn) return;
      tx = -(e.clientY / VH - 0.5) * 18; ty = (e.clientX / VW - 0.5) * 26;
      if (!tiltRun) { tiltRun = true; requestAnimationFrame(tilt); }
    }, { passive: true });
  }

  layout();
  const qp = /[?&]p=([\d.]+)/.exec(location.search);
  if (qp) { scrollTo(0, toS(clamp(+qp[1])) * L.track); readTarget(); cur = target; }
  render(cur);
  addEventListener('scroll', kick, { passive: true });
  addEventListener('resize', () => { layout(); kick(); });
  document.fonts && document.fonts.ready.then(() => { layout(); kick(); });
  document.querySelectorAll('.stage img').forEach((img) => { if (img.decode) img.decode().catch(() => {}); });

  // liquid glass: pinch lens on the pointer, glass buttons, magnet (no venom)
  if (window.LiquidGlass) {
    LiquidGlass.cursorPull({ size: 240, strength: 4, focus: 3 });   // no ball: a 240px area on the pointer pulls the page in, hardest right at the cursor
    LiquidGlass.glassify('.lg-glass');
    LiquidGlass.magnet('.cta-fly .cta', { reach: 'page', curve: 2.2, pull: 0.6, max: 46 });   // the yellow buttons lean toward the cursor wherever it is, harder as it gets close
  }
})();
