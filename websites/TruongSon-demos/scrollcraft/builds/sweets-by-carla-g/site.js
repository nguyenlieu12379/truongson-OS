/* Sweets by Carla G: one fixed stage, one timeline p (0..1) from smoothed scroll.
   hero (flamingo cake in front of "Sweets") -> "Sweets" docks in the bar, the cake drops onto a turntable
   -> eight custom cakes orbit it -> peak: one fast turn, theme names roll behind -> the orbit gathers under
   the cake, the camera dives into its sugar hibiscus (iris into the macro) -> the macro closes into the
   first of four treats, three more are served -> treats fly into the order card's thumbnails, the cake
   rises back and "Sweets" undocks behind it. Holds.
   Moving things get transform / clip-path only, written only when they change. Layout measured once per
   resize. Test switch: ?p=0.42 jumps to that point. */
(() => {
  const CAKE_AR = 1328 / 997;                  // cut-hero.webp
  const BOARD = [0.498, 0.846];                // centre of the cake board inside the cutout
  // where their close-up photo sits on the cutout (matched on the flamingo's eye and the top flower's stamen):
  // left, top and size of the square, all as shares of the cutout's width
  const MAC = { u: 0.3652, v: -0.0023, k: 0.4187 };

  const $ = (s) => document.querySelector(s);
  const $$ = (s) => [...document.querySelectorAll(s)];
  const root = document.documentElement;
  const stage = $('#stage'), spacer = $('#spacer'), bar = $('#bar');
  const wm = $('#wm'), letters = $$('.wm .l'), slotWord = $('#slotWord');
  const cake = $('#cake'), cakeTilt = $('#cakeTilt');
  const heroIn = $('#heroIn'), heroCopy = $('#heroCopy');
  const turn = $('#turn'), names = $('#names'), namesCol = $('#namesCol');
  const ocIn = $('#ocIn'), orbitCopy = $('#orbitCopy');
  const cards = $$('.card');
  const fls = $$('.fl');
  const macro = $('#macro'), macroCap = $('#macroCap'), macroIn = $('#macroIn');
  const treatsBox = $('#treats'), trHead = $('#trHead'), treats = $$('.treat');
  const order = $('#order'), odIn = $('#odIn'), thumbs = $$('#thumbs i');
  const mapFrame = $('#mapFrame');
  const ctaFly = $('#ctaFly'), cta = ctaFly.firstElementChild;
  const slotHero = $('#slotHero'), slotBar = $('#slotBar'), slotClose = $('#slotClose');
  const roller = $('#roller'), railBtns = $$('.rail button');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');

  const clamp = (v, a = 0, b = 1) => (v < a ? a : v > b ? b : v);
  const seg = (p, a, b) => clamp((p - a) / (b - a));
  const E = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const O = (t) => 1 - Math.pow(1 - t, 3);
  const lerp = (a, b, t) => a + (b - a) * t;
  const r1 = (v) => Math.round(v * 10) / 10;
  const put = (el, prop, val) => { const c = el._c || (el._c = {}); if (c[prop] !== val) { c[prop] = val; el.style[prop] = val; } };
  const show = (el, on) => put(el, 'visibility', on ? 'visible' : 'hidden');
  const tf = (x, y, s = 1, rot = 0) => `translate3d(${r1(x)}px,${r1(y)}px,0) scale(${s.toFixed(4)})${rot ? ` rotate(${rot.toFixed(2)}deg)` : ''}`;
  const TAU = Math.PI * 2;

  // the names that roll at the peak: one per card position the spin passes, then "Yours."
  const NAMES = cards.map((c) => c.dataset.name);
  const SPIN_FROM = 2, SPIN_TO = 10;
  namesCol.innerHTML = Array.from({ length: SPIN_TO + 1 }, (_, k) => `<b>${NAMES[k % NAMES.length]}</b>`).join('') + '<b>Yours.</b>';
  const nameEls = $$('#namesCol b');

  let VW = 0, VH = 0, mobile = false, L = {}, dirty = true;

  function layout() {
    VW = root.clientWidth;
    VH = stage.clientHeight;
    mobile = VW <= 760;
    const barH = bar.offsetHeight;
    $$('.stage *, .cta-fly, .rail *').forEach((el) => { el._c = {}; });
    [wm, cake, heroIn, ocIn, turn, namesCol, macro, macroIn, trHead, order, ctaFly].forEach((el) => { el.style.transform = 'none'; el.style.clipPath = 'none'; });
    cards.forEach((c) => { c.style.transform = 'none'; });
    treats.forEach((t) => { t.style.transform = 'none'; t.style.clipPath = 'none'; });

    // ---- wordmark: as wide as the screen allows
    wm.style.fontSize = '100px';
    const w100 = wm.scrollWidth;
    const fs = Math.min((mobile ? 0.9 : 0.8) * VW / w100 * 100, VH * (mobile ? 0.24 : 0.46));
    wm.style.fontSize = fs + 'px';
    const wmW = wm.scrollWidth, wmH = fs;
    const wmX = (VW - wmW) / 2, wmY = mobile ? barH + VH * 0.03 : Math.max(barH - 8, VH * 0.05);

    // ---- hero cake: one layer in front of the lower half of the word
    let cW, cX, cY;
    if (mobile) {
      cW = Math.min(VW * 0.96, VH * 0.36 * CAKE_AR);
      cX = (VW - cW) / 2;
      cY = wmY + wmH * 0.52;
    } else {
      cW = Math.min(VW * 0.5, VH * 0.66 * CAKE_AR);
      cX = Math.min(VW * 0.6 - cW / 2, VW - cW - 24);
      cY = VH - 70 - cW / CAKE_AR;
    }
    const cH = cW / CAKE_AR;
    const hero = { x: cX, y: cY, w: cW };

    // letters the cake really covers bob like piped icing
    let k = 0;
    letters.forEach((l) => {
      const b = l.getBoundingClientRect();
      const bx = b.left + wmX, by = wmY + b.height;
      const cov = bx + b.width > cX + cW * 0.12 && bx < cX + cW * 0.88 && by > cY + cH * 0.06;
      l.classList.toggle('cov', cov);
      if (cov) l.style.setProperty('--k', k++);
    });

    // ---- hero copy
    if (mobile) {
      Object.assign(heroCopy.style, { left: '18px', width: VW - 36 + 'px', top: cY + cH + 14 + 'px' });
    } else {
      Object.assign(heroCopy.style, { left: Math.max(18, VW * 0.04) + 'px', width: Math.min(380, cX - VW * 0.04 - 24) + 'px', top: 'auto' });
      heroCopy.style.top = VH - 70 - heroCopy.offsetHeight + 'px';
    }

    // ---- dock slot in the bar
    const slotH = mobile ? 34 : 40;
    const dockS = slotH / wmH;
    slotWord.style.width = wmW * dockS + 'px';
    slotWord.style.height = slotH + 'px';

    // ---- the turntable and orbit: always fits under the heading (nothing of the orbit sits under its type)
    orbitCopy.style.top = barH + (mobile ? 4 : 10) + 'px';
    const ocBottom = orbitCopy.offsetTop + orbitCopy.offsetHeight + (mobile ? 14 : 18);
    const floor = VH - 64 - 26;                     // above the rail, room for the front label
    let Rx = mobile ? VW * 0.41 : Math.min(VW * 0.4, 620);
    let ch = mobile ? Math.min(VH * 0.125, 104) : Math.min(VH * 0.26, 250);
    const ryK = mobile ? 0.98 : 0.4, oK = mobile ? 1.45 : 0.95;
    const upOf = (rx, c) => Math.max(rx * oK / CAKE_AR * BOARD[1], rx * ryK + c * 0.52);   // above the centre
    const downOf = (rx) => rx * ryK + 10;                                                 // below the centre
    for (let k = 0; k < 40 && upOf(Rx, ch) + downOf(Rx) > floor - ocBottom; k++) { Rx *= 0.96; ch *= 0.96; }
    const Ry = Rx * ryK;
    const oc = { x: VW / 2, y: Math.max(ocBottom + upOf(Rx, ch), mobile ? floor - downOf(Rx) : Math.min(VH * 0.56, floor - downOf(Rx))) };
    cards.forEach((c) => {
      const im = c.querySelector('img');
      const ar = im.naturalWidth ? im.naturalWidth / im.naturalHeight : 1;
      c._w = ch * ar; c.style.width = c._w + 'px'; c.style.height = ch + 'px';
    });
    const oW = Rx * oK;
    const orb = { x: oc.x - oW * BOARD[0], y: oc.y - (oW / CAKE_AR) * BOARD[1], w: oW };

    // the names band: exactly where the heading was, one line, no taller
    const nTop = orbitCopy.offsetTop, nH = orbitCopy.offsetHeight + (mobile ? 8 : 12);
    names.style.top = nTop + 'px'; names.style.height = nH + 'px';
    const nfs = Math.min(nH * 0.86, mobile ? VW * 0.16 : VW * 0.1);
    // each name gets a taller line than the band, so the next name's tall script letters never peek in
    const nLine = nH * 1.7;
    nameEls.forEach((b) => { b.style.fontSize = nfs + 'px'; b.style.lineHeight = nLine + 'px'; });
    namesCol.style.marginTop = -(nLine - nH) / 2 + 'px';

    // ---- the macro: a square frame at the photo's own shape (never cropped to the screen)
    const mS = mobile ? Math.min(VW - 24, VH * 0.58) : Math.min(VH - barH - 110, VW * 0.6);
    const M = { x: mobile ? (VW - mS) / 2 : Math.min(VW * 0.57 - mS / 2, VW - mS - 24), y: barH + Math.max(0, (VH - barH - 64 - mS) / 2), s: mS };
    Object.assign(macro.style, { left: M.x + 'px', top: M.y + 'px', width: mS + 'px', height: mS + 'px' });
    const capW = macroCap.offsetWidth, capH = macroCap.offsetHeight;
    const cap = mobile
      ? { x: 12, y: Math.min(M.y + mS - 22, VH - 70 - capH) }
      : { x: Math.max(16, M.x - capW + 36), y: M.y + mS - capH - 26 };
    Object.assign(macroCap.style, { left: cap.x + 'px', top: cap.y + 'px' });

    // ---- treats: four frames, each at its own photo's shape
    trHead.parentElement.style.top = barH + (mobile ? 4 : 10) + 'px';
    const headBottom = trHead.parentElement.offsetTop + trHead.parentElement.offsetHeight;
    const ars = treats.map((t) => +t.dataset.ar);
    const T = [];
    if (mobile) {
      const g = 14, capH = 30;
      const rows = [[0, 1], [2, 3]];
      const avail = VH - headBottom - 70 - capH * 2 - g * 2;
      let h = Math.min(avail / 2, Math.min(...rows.map((r) => (VW - 32 - g) / (ars[r[0]] + ars[r[1]]))));
      let y = headBottom + 14;
      rows.forEach((r) => {
        const w0 = h * ars[r[0]], w1 = h * ars[r[1]];
        let x = (VW - w0 - w1 - g) / 2;
        T[r[0]] = { x, y, w: w0, h }; x += w0 + g;
        T[r[1]] = { x, y, w: w1, h };
        y += h + capH + g;
      });
    } else {
      const g = Math.max(18, VW * 0.018);
      const sum = ars.reduce((a, b) => a + b, 0);
      const h = Math.min(VH * 0.44, (VW * 0.86 - 3 * g) / sum, VH - headBottom - 150);
      let x = (VW - (sum * h + 3 * g)) / 2;
      const off = [-0.025, 0.03, -0.012, 0.022];
      const cy = (headBottom + VH - 70) / 2 - 14;
      ars.forEach((ar, i) => { T[i] = { x, y: cy - h / 2 + off[i] * VH, w: h * ar, h }; x += h * ar + g; });
    }
    treats.forEach((t, i) => { t.style.width = T[i].w + 'px'; t.style.height = T[i].h + 'px'; });

    // ---- order card and the close
    const odW = mobile ? VW - 24 : Math.min(450, Math.max(380, VW * 0.34));
    order.style.width = odW + 'px';
    const odH = order.offsetHeight;
    const od = mobile
      ? { x: 12, y: VH - 58 - odH }
      : { x: VW - Math.max(24, VW * 0.05) - odW, y: Math.max(barH + 8, (VH - odH) / 2 + 6) };
    order.style.left = od.x + 'px'; order.style.top = od.y + 'px';
    // close: the word and the cake reassemble in the space the card leaves
    let close;
    {
      const ax = mobile ? 0 : 0, aw = mobile ? VW : od.x - 24;
      const top = barH + (mobile ? 4 : 18), bottom = mobile ? od.y - 8 : VH - 86;
      const zoneH = bottom - top;
      const cw = Math.min(aw * (mobile ? 0.62 : 0.72), zoneH * 0.74 * CAKE_AR);
      const ch2 = cw / CAKE_AR;
      const ws = Math.min(aw * 0.86 / wmW, zoneH * 0.42 / wmH);
      const wx = ax + (aw - wmW * ws) / 2;
      const wy = Math.max(top, bottom - ch2 - wmH * ws * 0.62);
      close = { wm: { x: wx, y: wy, s: ws }, cake: { x: ax + (aw - cw) / 2, y: bottom - ch2, w: cw } };
    }

    // ---- button slots (measured where they really sit)
    const bw = cta.offsetWidth, bh = cta.offsetHeight;
    const sHero = mobile ? 0.94 : 1, sBar = mobile ? 0.62 : 0.7, sClose = 1;
    Object.assign(slotHero.style, { width: bw * sHero + 'px', height: bh * sHero + 'px' });
    Object.assign(slotBar.style, { width: bw * sBar + 'px', height: bh * sBar + 'px' });
    Object.assign(slotClose.style, { width: bw * sClose + 'px', height: bh * sClose + 'px' });
    const rh = slotHero.getBoundingClientRect(), rb = slotBar.getBoundingClientRect(), rc = slotClose.getBoundingClientRect(), rw = slotWord.getBoundingClientRect();
    const C = { hero: { x: rh.left, y: rh.top, s: sHero }, bar: { x: rb.left, y: rb.top, s: sBar }, close: { x: rc.left, y: rc.top, s: sClose } };
    const thumbR = thumbs.map((t) => t.getBoundingClientRect());

    // ---- the rail: stop centres
    const railR = $('#rail').getBoundingClientRect();
    const stops = railBtns.map((b) => { const r = b.getBoundingClientRect(); return { p: +b.dataset.p, x: r.left + r.width / 2 - railR.left }; });

    L = { barH, fs, wmX, wmY, wmW, wmH, hero, cH, M, dock: { x: rw.left, y: rw.top, s: dockS }, oc, Rx, Ry, ch, orb,
      T, od, odH, close, C, thumbR, stops, track: spacer.offsetHeight - innerHeight };
    root.classList.add('ready');
    dirty = true;
  }

  // cake rect (x, y, w) by phase
  function cakeAt(p) {
    const { hero, orb, close } = L;
    const d = E(seg(p, 0.05, 0.15));
    let x = lerp(hero.x, orb.x, d), y = lerp(hero.y, orb.y, d), w = lerp(hero.w, orb.w, d);
    // the push-in: the flamingo and the top flowers grow until they fill the close-up's square exactly
    const z = E(seg(p, 0.645, 0.735));
    if (z > 0) {
      const M = L.M, tw = M.s / MAC.k;
      x = lerp(x, M.x - MAC.u * tw, z); y = lerp(y, M.y - MAC.v * tw, z); w = lerp(w, tw, z);
    }
    // the close: rises back from below
    const c = E(seg(p, 0.885, 0.955));
    if (c > 0) { x = close.cake.x; w = close.cake.w; y = lerp(VH + 40, close.cake.y, c); }
    return { x, y, w };
  }

  // orbit rotation in card units: slow turn, the fast full turn (peak), then held
  // the fast turn goes cake by cake: each step turns, then holds so its name can be read
  const rotAt = (p) => {
    if (p < 0.4) return SPIN_FROM * E(seg(p, 0.15, 0.4));
    const n = SPIN_TO - SPIN_FROM, t = seg(p, 0.4, 0.6) * n, k = Math.min(n - 1, Math.floor(t));
    return SPIN_FROM + k + E(clamp((t - k - 0.12) / 0.6));
  };

  // scroll -> timeline: the turntable scenes (p 0.36 to 0.64) get about 1.5x the scroll of the rest
  const KS = [0, 0.28, 0.62, 1], KP = [0, 0.36, 0.64, 1];
  const mapK = (v, A, B) => { let i = 0; while (i < A.length - 2 && v > A[i + 1]) i++; return B[i] + (B[i + 1] - B[i]) * clamp((v - A[i]) / (A[i + 1] - A[i])); };
  const sToP = (s) => mapK(s, KS, KP), pToS = (p) => mapK(p, KP, KS);

  function render(p) {
    const { oc, Rx, Ry, ch, barH } = L;

    // ---- 1. the wordmark: hero -> docked in the bar -> back behind the cake
    {
      const d = E(seg(p, 0.035, 0.12)), u = E(seg(p, 0.89, 0.965));
      let x = lerp(L.wmX, L.dock.x, d), y = lerp(L.wmY, L.dock.y, d), s = lerp(1, L.dock.s, d);
      if (u > 0) { x = lerp(L.dock.x, L.close.wm.x, u); y = lerp(L.dock.y, L.close.wm.y, u); s = lerp(L.dock.s, L.close.wm.s, u); }
      put(wm, 'transform', tf(x, y, s));
      put(wm, 'zIndex', p > 0.13 && p < 0.885 ? '14' : '3');
      wm.classList.toggle('bob', p < 0.03 || p > 0.97);
      bar.classList.toggle('docked', p > 0.11 && p < 0.9);
    }

    // ---- hero copy leaves downward
    const hc = E(seg(p, 0.012, 0.07));
    put(heroIn, 'transform', `translate3d(0,${r1(hc * 112)}%,0)`);
    show(heroIn, hc < 1);

    // ---- the cake
    const ck = cakeAt(p);
    {
      put(cake, 'transform', tf(ck.x, ck.y));
      put(cake, 'width', r1(ck.w) + 'px'); put(cake, 'height', r1(ck.w / CAKE_AR) + 'px');
      show(cake, p < 0.745 || p > 0.885);
      // the push-in frames itself: the screen edges pull in to the close-up's square
      const fr = E(seg(p, 0.645, 0.735));
      if (fr > 0 && p < 0.745) {
        const M = L.M, chh = ck.w / CAKE_AR, c0 = (v) => r1(Math.max(0, v) * fr);
        put(cake, 'clipPath', `inset(${c0(M.y - ck.y)}px ${c0(ck.x + ck.w - M.x - M.s)}px ${c0(ck.y + chh - M.y - M.s)}px ${c0(M.x - ck.x)}px round ${r1(18 * fr)}px)`);
      } else put(cake, 'clipPath', 'none');
      const flat = p > 0.645 && p < 0.885;              // no drop shadow on the giant zoomed cake (costly)
      if (cake._flat !== flat) { cake._flat = flat; cake.classList.toggle('flat', flat); }
      tiltOn = p < 0.035 || p > 0.97;
      if (!tiltOn && cakeTilt.style.transform) cakeTilt.style.transform = '';
    }

    // ---- the turntable ellipse: grows under the cake, gathers back into it for the dive
    {
      const g = E(seg(p, 0.08, 0.16)) * (1 - E(seg(p, 0.63, 0.69)));
      const ex = Rx * 1.1 * g, ey = Ry * 1.12 * g;
      put(turn, 'transform', `translate3d(${r1(oc.x - ex)}px,${r1(oc.y - ey + Ry * 0.06)}px,0) scale(${(ex * 2 / 1000).toFixed(4)},${(ey * 2 / 1000).toFixed(4)})`);
      show(turn, g > 0.001);
    }

    // ---- 3-4. the orbit
    const r = rotAt(p);
    const gather = E(seg(p, 0.625, 0.685));
    cards.forEach((c, i) => {
      const th = ((i - r) / cards.length) * TAU;
      const depth = Math.cos(th);
      let x = oc.x + Rx * Math.sin(th), y = oc.y + Ry * depth;
      let s = 0.52 + 0.48 * (depth + 1) / 2;
      // rise onto the ellipse, one after another
      const up = O(seg(p, 0.1 + i * 0.012, 0.17 + i * 0.012));
      x = lerp(oc.x, x, up); y = lerp(oc.y + 30, y, up); s *= lerp(0.15, 1, up);
      // gather under the cake for the dive
      if (gather) { x = lerp(x, oc.x, gather); y = lerp(y, oc.y, gather); s *= 1 - gather * 0.85; }
      put(c, 'transform', `translate3d(${r1(x - c._w / 2)}px,${r1(y - ch)}px,0) scale(${s.toFixed(4)})`);
      put(c, 'zIndex', String(depth > 0 ? 7 + Math.round(depth * 3) : 3 + Math.round(depth + 1)));
      show(c, up > 0 && gather < 1);
    });

    // orbit copy: in after the dock, out for the peak
    {
      const a = E(seg(p, 0.13, 0.2)), b = E(seg(p, 0.37, 0.41));
      put(ocIn, 'transform', `translate3d(0,${r1((1 - a) * 110 - b * 110)}%,0)`);
      show(orbitCopy, a > 0 && b < 1);
    }
    // the names: roll with the spin, settle on "Yours."
    {
      const a = E(seg(p, 0.385, 0.42)), b = E(seg(p, 0.64, 0.68));
      const k = p < 0.6 ? Math.max(0, r - SPIN_FROM) + SPIN_FROM : SPIN_TO + E(seg(p, 0.6, 0.625));
      const lineH = parseFloat(nameEls[0].style.lineHeight) || 100;
      put(namesCol, 'transform', `translate3d(0,${r1(-k * lineH + (1 - a) * lineH - b * lineH)}px,0)`);
      show(names, a > 0 && b < 1);
    }

    // ---- 5. the push-in: the cutout, now lined up with their close-up, turns into it in place
    {
      const M = L.M;
      const t = E(seg(p, 0.712, 0.742));
      put(macro, 'opacity', t.toFixed(3));
      const close = E(seg(p, 0.765, 0.81));          // the square shrinks into the first treat's frame
      if (close > 0) {
        const f = L.T[0], s1 = f.h / M.s, sc = lerp(1, s1, close);
        const cx = lerp(M.x + M.s / 2, f.x + f.w / 2, close), cy = lerp(M.y + M.s / 2, f.y + f.h / 2, close);
        put(macro, 'transform', `translate3d(${r1(cx - M.s * sc / 2 - M.x)}px,${r1(cy - M.s * sc / 2 - M.y)}px,0) scale(${sc.toFixed(4)})`);
        const ix = r1(Math.max(0, (M.s - f.w / s1) / 2) * close);
        put(macro, 'clipPath', `inset(0 ${ix}px round ${r1(18 / sc)}px)`);
      } else {
        put(macro, 'transform', 'none');
        put(macro, 'clipPath', 'none');
      }
      show(macro, t > 0 && p < 0.83);
      const ci = E(seg(p, 0.715, 0.75)), co = E(seg(p, 0.765, 0.79));
      put(macroIn, 'transform', `translate3d(0,${r1((1 - ci) * 110 + co * 110)}%,0)`);
      show(macroCap, ci > 0 && co < 1);
    }

    // ---- 6. treats, and 7. into the order card's thumbnails
    {
      const hIn = E(seg(p, 0.785, 0.83)), hOut = E(seg(p, 0.875, 0.905));
      put(trHead, 'transform', `translate3d(0,${r1((1 - hIn) * 110 - hOut * 110)}%,0)`);
      show(treatsBox, hIn > 0 && hOut < 1);
      treats.forEach((el, i) => {
        const f = L.T[i];
        let x = f.x, y = f.y, s = 1, rot = 0, clip = 'none', on = true;
        if (i === 0) {
          // revealed inside the macro's frame, wiping up over it
          const w = E(seg(p, 0.8, 0.83));
          clip = `inset(${r1((1 - w) * 100)}% 0 0 0 round 14px)`;
          on = w > 0;
        } else {
          const t = O(seg(p, 0.795 + i * 0.018, 0.85 + i * 0.018));
          x = lerp(VW + 60 + i * 40, f.x, t); rot = (1 - t) * (8 + i * 3); y = f.y - (1 - t) * 40;
          on = t > 0;
        }
        // into the thumbnails: square clip, scaled down to the slot
        const q = E(seg(p, 0.885 + i * 0.012, 0.945 + i * 0.012));
        if (q > 0) {
          const tr = L.thumbR[i], od = cardY(p);
          const side = Math.min(f.w, f.h), sc = lerp(1, tr.width / side, q);
          const cx = (f.w - side) / 2 * q, cy = (f.h - side) / 2 * q;
          const tx = tr.left - cx * sc, ty = tr.top + od - cy * sc;
          x = lerp(f.x, tx, q); y = lerp(f.y, ty, q); s = sc; rot = 0;
          clip = `inset(${r1(cy)}px ${r1(cx)}px ${r1(cy)}px ${r1(cx)}px round ${r1(14 + q * 6)}px)`;
        }
        put(el, 'transform', tf(x, y, s, rot));
        put(el, 'clipPath', clip);
        put(el, 'zIndex', q > 0 ? '15' : '12');
        el.classList.toggle('in-thumb', q > 0.6);
        show(el, on && p > 0.79);
      });
    }

    // ---- 7. the order card rises
    {
      const dy = cardY(p);
      put(order, 'transform', `translate3d(0,${r1(dy)}px,0)`);
      show(order, dy < VH);
      if (p > 0.78 && !mapFrame.src) mapFrame.src = mapFrame.dataset.src;
    }

    // ---- flowers: around the hero, on the turntable's rim, blown past the camera, around the close
    fls.forEach((el, i) => {
      const q = flowerAt(i, p, ck);
      put(el, 'transform', `translate3d(${r1(q.x - q.s / 2)}px,${r1(q.y - q.s / 2)}px,0) scale(${(q.s / 200).toFixed(4)})`);
      show(el, q.on);
    });

    // ---- the travelling button
    {
      const C = L.C, up = E(seg(p, 0.015, 0.075)), down = E(seg(p, 0.935, 0.99));
      const A = p < 0.5 ? C.hero : C.bar, Z = p < 0.5 ? C.bar : C.close, t = p < 0.5 ? up : down;
      const arc = Math.sin(t * Math.PI) * (p < 0.5 ? -40 : 40);
      const zy = p < 0.5 ? 0 : cardY(p);
      put(ctaFly, 'transform', `translate3d(${r1(lerp(A.x, Z.x, t) + arc)}px,${r1(lerp(A.y, Z.y + zy, t))}px,0) scale(${lerp(A.s, Z.s, t).toFixed(4)})`);
    }

    // ---- the rail: their logo rolls to the current stop
    {
      const S = L.stops;
      let j = 0; while (j < S.length - 2 && p > S[j + 1].p) j++;
      const x = lerp(S[j].x, S[j + 1].x, clamp((p - S[j].p) / (S[j + 1].p - S[j].p)));
      put(roller, 'transform', `translate3d(${r1(x)}px,0,0) rotate(${(x / 13 * 57.3).toFixed(1)}deg)`);
      let on = 0; S.forEach((s, i) => { if (p >= s.p - 0.03) on = i; });
      railBtns.forEach((b, i) => b.classList.toggle('on', i === on));
    }
  }

  const cardY = (p) => lerp(VH - L.od.y + 30, 0, E(seg(p, 0.885, 0.95)));

  // flower anchors: [x, y] as shares of the screen, size as a share of min(VW, VH)
  const FL = {
    hero: [[0.3, 0.42, 0.11], [0.93, 0.36, 0.08], [0.95, 0.8, 0.09]],
    heroM: [[0.86, 0.36, 0.17], [0.1, 0.4, 0.13], [0.9, 0.86, 0.15]],
  };
  function flowerAt(i, p, ck) {
    const mn = Math.min(VW, VH), { oc, Rx, Ry } = L;
    const H = (mobile ? FL.heroM : FL.hero)[i];
    let x = H[0] * VW, y = H[1] * VH, s = H[2] * mn;
    // on the turntable's rim
    const R = [[oc.x - Rx * 1.18, oc.y + Ry * 0.1, 0.07], [oc.x + Rx * 1.16, oc.y - Ry * 0.2, 0.06], [oc.x + Rx * 0.35, oc.y + Ry * 1.3, 0.065]][i];
    const g = E(seg(p, 0.07, 0.17));
    x = lerp(x, R[0], g); y = lerp(y, R[1], g); s = lerp(s, R[2] * mn * (mobile ? 1.5 : 1), g);
    // the turntable carries them round a little
    const a = (rotAt(p) / 8) * TAU * 0.25;
    const dx = x - oc.x, dy = (y - oc.y) / (Ry / Rx || 1);
    if (g > 0) { const ca = Math.cos(a * g), sa = Math.sin(a * g); x = oc.x + dx * ca - dy * sa; y = oc.y + (dx * sa + dy * ca) * (Ry / Rx); }
    // the dive: blown outward past the camera
    const d = E(seg(p, 0.655, 0.72));
    if (d > 0) { const vx = x - VW / 2, vy = y - VH / 2, n = Math.hypot(vx, vy) || 1; x += (vx / n) * VW * 0.9 * d; y += (vy / n) * VH * 0.9 * d; s *= 1 + d * 3; }
    // the close: back in, round the cake
    const c = E(seg(p, 0.9, 0.97));
    if (c > 0) {
      const cw = L.close.cake.w, cx = L.close.cake.x, cy = L.close.cake.y, chh = cw / CAKE_AR;
      const Z = [[cx - cw * 0.04, cy + chh * 0.35, 0.1], [cx + cw * 1.02, cy + chh * 0.15, 0.08], [cx + cw * 0.98, cy + chh * 0.66, 0.07]][i];
      const zs = Z[2] * mn * (mobile ? 1.2 : 1);
      x = lerp(x, Z[0], c); y = lerp(y, Z[1], c); s = lerp(s, zs, c);
    }
    return { x, y, s, on: d < 1 || c > 0 };
  }

  // smoothed scroll
  let cur = 0, target = 0, last = 0, running = false;
  const readTarget = () => { target = L.track > 0 ? sToP(clamp(scrollY / L.track)) : 0; };
  function frame(t) {
    const dt = last ? Math.min(64, t - last) : 16.7; last = t;
    const kk = reduced.matches ? 1 : 1 - Math.pow(1 - 0.1, dt / 16.7);
    const d = target - cur;
    cur = Math.abs(d) < 0.00002 ? target : cur + d * kk;
    if (dirty || d !== 0) { render(cur); dirty = false; }
    if (cur !== target) requestAnimationFrame(frame); else { running = false; last = 0; }
  }
  const kick = () => { readTarget(); if (!running) { running = true; requestAnimationFrame(frame); } };

  // the cake leans toward the cursor around its own centre (8deg / 11deg), direct: no inertia, no sheen
  let tiltOn = true, tx = 0, ty = 0, tiltRun = false;
  function tilt() {
    tiltRun = false;
    const x = tiltOn ? tx : 0, y = tiltOn ? ty : 0;
    cakeTilt.style.transform = `rotateX(${(x * 8).toFixed(2)}deg) rotateY(${(y * 11).toFixed(2)}deg)`;
  }
  const kickTilt = () => { if (!tiltRun) { tiltRun = true; requestAnimationFrame(tilt); } };
  if (!reduced.matches && matchMedia('(hover: hover) and (pointer: fine)').matches) {
    addEventListener('pointermove', (e) => {
      tx = -(e.clientY / VH - 0.5) * 2; ty = (e.clientX / VW - 0.5) * 2;
      if (tiltOn) kickTilt();
    }, { passive: true });
  }

  function start() {
    layout();
    const qp = /[?&]p=([\d.]+)/.exec(location.search);
    if (qp) { scrollTo(0, pToS(clamp(+qp[1])) * L.track); readTarget(); cur = target; }
    render(cur);
  }
  start();
  addEventListener('scroll', kick, { passive: true });
  // re-measure and draw at once (a hidden tab gets no rAF, and layout() resets every transform)
  const relayout = () => { layout(); readTarget(); if (!running) cur = target; render(cur); dirty = false; kick(); };
  addEventListener('resize', relayout);
  document.fonts && document.fonts.ready.then(relayout);
  addEventListener('load', relayout);
  $$('.stage img').forEach((img) => { if (img.decode) img.decode().catch(() => {}); });
  $('.brand').addEventListener('click', (e) => { e.preventDefault(); scrollTo({ top: 0, behavior: reduced.matches ? 'auto' : 'smooth' }); });
  railBtns.forEach((b) => b.addEventListener('click', () => scrollTo({ top: pToS(+b.dataset.p) * L.track, behavior: reduced.matches ? 'auto' : 'smooth' })));

  // liquid glass: the Vivace cursor ball, glass button, the button leans toward the cursor
  if (window.LiquidGlass) {
    LiquidGlass.cursorBall();
    LiquidGlass.glassify('.lg-glass');
    LiquidGlass.magnet('.cta-fly .cta', { reach: 'page', curve: 2.2, pull: 0.6, max: 46 });
  }
})();
