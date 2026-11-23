/* Brazilian Taste: one unbroken white world.
   One fixed stage, one timeline p (0..1) driven by smoothed scroll.
   Moving things get transform / opacity / clip-path only, written only when they change.
   Layout is measured once per resize, never inside the frame loop.
   Test switch: ?p=0.42 jumps the camera to that point on load. */
(() => {
  const AR = 3210 / 1200;                  // wordmark box (their avatar letters, 3x)
  const GAP_C = 1650.5 / 3210;             // between the "i" and the "l" of Brazi|lian
  const GAP_H = 41.5 / 3210;
  const GLYPH_T = 0.0375, GLYPH_B = 0.925; // letter tops and baseline inside the box

  const $ = (s) => document.querySelector(s);
  const stage = $('#stage'), spacer = $('#spacer'), bar = $('#bar');
  const wm = $('#wm'), wmL = $('#wmL'), wmR = $('#wmR');
  const heroCopy = $('#heroCopy'), openPh = $('#openPh');
  const week = $('#week'), ph0 = $('.ph0'), cnt = $('#cnt');
  const labs = [...document.querySelectorAll('.lab')], weekH = $('.week-h'), note = $('.note');
  const fills = [...document.querySelectorAll('.day .ph img')];
  const ways = $('#ways'), strips = [...document.querySelectorAll('.strip')], nums = [...document.querySelectorAll('.num')];
  const band = $('#band'), steps = [...document.querySelectorAll('.steps li')], lift = $('#lift');
  const close = $('#close');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');

  const clamp = (v, a = 0, b = 1) => (v < a ? a : v > b ? b : v);
  const seg = (p, a, b) => clamp((p - a) / (b - a));
  const E = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const lerp = (a, b, t) => a + (b - a) * t;
  const r1 = (v) => Math.round(v * 10) / 10;

  // write a style only when its value changed
  const put = (el, prop, val) => {
    const c = el._c || (el._c = {});
    if (c[prop] !== val) { c[prop] = val; el.style[prop] = val; }
  };
  const show = (el, on) => put(el, 'visibility', on ? 'visible' : 'hidden');

  let VW = 0, VH = 0, mobile = false, L = {};

  function layout() {
    VW = document.documentElement.clientWidth;
    VH = stage.clientHeight;
    mobile = VW <= 760;
    const wmW = mobile ? VW - 32 : Math.min(VW * 0.9, VH * 0.5 * AR, 1500);
    const wmH = wmW / AR;
    const wmX = (VW - wmW) / 2;
    const wmY = (mobile ? 0.3 : 0.38) * VH - wmH / 2;
    Object.assign(wm.style, { left: wmX + 'px', top: wmY + 'px', width: wmW + 'px', height: wmH + 'px' });
    const below = wmY + wmH + (mobile ? 22 : VH * 0.045);
    heroCopy.style.top = below + 'px';
    close.style.top = below + 'px';

    // Monday cell, measured with the week layer at rest
    const prev = week.style.transform; week.style.transform = 'none';
    const r = ph0.getBoundingClientRect();
    week.style.transform = prev;
    const s = Math.max(r.width / VW, r.height / VH);
    L = {
      wmW, wmH, wmX, wmY,
      gc: wmX + wmW * GAP_C, gh: wmW * GAP_H,
      gT: wmY + wmH * GLYPH_T, gB: VH - (wmY + wmH * GLYPH_B),
      cell: { s, tx: r.left + r.width / 2 - (VW * s) / 2, ty: r.top + r.height / 2 - (VH * s) / 2,
              ix: (VW - r.width / s) / 2, iy: (VH - r.height / s) / 2 },
      liftH: lift.offsetHeight,
      track: spacer.offsetHeight - innerHeight,
    };
    for (const el of [wmL, wmR, openPh, week, ways, band, lift, close, heroCopy, ...strips, ...nums, ...fills, ...steps, ...labs]) el._c = {};
    dirty = true;
  }

  function render(p) {
    const { wmH, gc, gh, gT, gB, cell } = L;

    // 1-2. the split: Brazi | lian part, their bowls open in the gap
    const s1 = E(seg(p, 0.03, 0.17));
    const back = E(seg(p, 0.91, 0.985));
    const dx = p < 0.5 ? s1 * VW * 0.8 : (1 - back) * VW * 0.8;
    put(wmL, 'transform', `translate3d(${r1(-dx)}px,0,0)`);
    put(wmR, 'transform', `translate3d(${r1(dx)}px,0,0)`);
    show(wm, dx < VW * 0.75);

    const hc = seg(p, 0.015, 0.07);
    put(heroCopy, 'opacity', String(1 - hc));
    put(heroCopy, 'transform', `translate3d(0,${r1(-24 * hc)}px,0)`);
    show(heroCopy, hc < 1);

    // the photo: slit -> full bleed -> Monday -> carried off with the week
    const w = E(seg(p, 0.53, 0.61));
    const wy = -w * VH * 1.05;
    if (p < 0.18) {
      if (s1 <= 0) {
        put(openPh, 'clipPath', 'inset(50% 50% 50% 50%)');
      } else {
        const hg = gh + dx;
        const t2 = E(seg(p, 0.075, 0.17));
        const cl = Math.max(0, gc - hg), cr = Math.max(0, VW - (gc + hg));
        put(openPh, 'clipPath', `inset(${r1(lerp(gT, 0, t2))}px ${r1(cr)}px ${r1(lerp(gB, 0, t2))}px ${r1(cl)}px)`);
      }
      put(openPh, 'transform', 'translate3d(0,0,0) scale(1)');
    } else {
      const m = E(seg(p, 0.18, 0.26));
      const sc = lerp(1, cell.s, m);
      put(openPh, 'transform', `translate3d(${r1(lerp(0, cell.tx, m))}px,${r1(lerp(0, cell.ty, m) + wy)}px,0) scale(${sc.toFixed(4)})`);
      put(openPh, 'clipPath', `inset(${r1(lerp(0, cell.iy, m))}px ${r1(lerp(0, cell.ix, m))}px)`);
    }
    show(openPh, s1 > 0 && w < 1);

    // 3. the week
    const wk = seg(p, 0.17, 0.24);
    put(week, 'opacity', String(wk));
    put(week, 'transform', `translate3d(0,${r1(wy)}px,0)`);
    show(week, wk > 0 && w < 1);
    const lo = seg(p, 0.2, 0.27);
    labs.forEach((l) => put(l, 'opacity', String(lo)));
    put(weekH, 'opacity', String(lo)); put(note, 'opacity', String(lo));
    let done = 1;
    fills.forEach((img, i) => {
      const a = 0.26 + i * 0.036;
      const f = E(seg(p, a, a + 0.05));
      if (f > 0.5) done++;
      put(img, 'clipPath', `inset(${r1((1 - f) * 100)}% 0 0 0)`);
      put(img, 'transform', `scale(${(1.12 - 0.12 * f).toFixed(4)})`);
    });
    if (cnt._n !== done) { cnt._n = done; cnt.textContent = String(done); }

    // 4. three ways
    const up = E(seg(p, 0.53, 0.61));
    const out = E(seg(p, 0.78, 0.87));
    put(ways, 'transform', `translate3d(0,${r1(lerp(VH, 0, up) - out * VH * 0.45)}px,0)`);
    put(ways, 'opacity', String(1 - seg(p, 0.81, 0.87)));
    show(ways, up > 0 && out < 1);
    strips.forEach((st, i) => {
      const h = E(seg(p, 0.58 + i * 0.05, 0.66 + i * 0.05));
      const side = mobile ? (i % 2 ? 1 : -1) : (i % 2 ? 1 : -1);
      put(st, 'transform', `translate3d(${r1((1 - h) * side * VW * 0.75)}px,0,0)`);
      const n = nums[i];
      put(n, 'opacity', String(h));
      put(n, 'transform', `translate3d(0,${r1((1 - h) * 40)}px,0)`);
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
      put(li, 'transform', `translate3d(0,${r1((1 - t) * 26)}px,0)`);
    });
    const liftY = bandTop - L.liftH * 0.55 - E(seg(p, 0.84, 0.9)) * VH * 0.04;
    put(lift, 'transform', `translate3d(0,${r1(liftY)}px,0)`);
    show(lift, b > 0 && liftY + L.liftH > 0);

    // 6. close: Brazilian closes again, the button holds
    const k = E(seg(p, 0.95, 1));
    put(close, 'opacity', String(k));
    put(close, 'transform', `translate3d(0,${r1((1 - k) * 24)}px,0)`);
    show(close, k > 0);

    bar.classList.toggle('on', p > 0.06 && p < 0.93);
  }

  // smoothed scroll
  let cur = 0, target = 0, last = 0, dirty = true, running = false;
  const readTarget = () => { target = L.track > 0 ? clamp(scrollY / L.track) : 0; };
  function frame(t) {
    const dt = last ? Math.min(64, t - last) : 16.7; last = t;
    const k = reduced.matches ? 1 : 1 - Math.pow(1 - 0.12, dt / 16.7);
    const d = target - cur;
    cur = Math.abs(d) < 0.00002 ? target : cur + d * k;
    if (dirty || d !== 0) { render(cur); dirty = false; }
    if (cur !== target) requestAnimationFrame(frame); else { running = false; last = 0; }
  }
  const kick = () => { readTarget(); if (!running) { running = true; requestAnimationFrame(frame); } };

  layout();
  const qp = /[?&]p=([\d.]+)/.exec(location.search);
  if (qp) { scrollTo(0, clamp(+qp[1]) * L.track); readTarget(); cur = target; }
  render(cur);
  addEventListener('scroll', kick, { passive: true });
  addEventListener('resize', () => { layout(); kick(); });
  document.fonts && document.fonts.ready.then(() => { layout(); kick(); });

  // decode every photo early so no beat waits on a decode
  document.querySelectorAll('.stage img').forEach((img) => { if (img.decode) img.decode().catch(() => {}); });

  // liquid glass: cursor lens and glass buttons (no venom)
  if (window.LiquidGlass) { LiquidGlass.cursorBall(); LiquidGlass.glassify('.lg-glass'); }
})();
