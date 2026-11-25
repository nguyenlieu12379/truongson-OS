/* El Budare Café: one fixed stage, one timeline p (0..1) from smoothed scroll. Nothing scrolls; the scroll is a clock.
   hero (their patacón stack, cut along its real edge, one layer in front of "BudaRe") -> the word docks in the bar,
   the stack slides off -> the peak: a giant clock runs noon to noon; a dish lands for each stretch of the day and,
   when its hours are over, flies into the day's tickets -> the tickets are rung up into the clock chip -> holidays dealt
   -> the holiday photos fold into their storefront, the stack comes back in front of it, the order card rises. Holds.
   Moving things get transform / opacity / clip-path only, written only when they change. Layout measured once per resize.
   Test switch: ?p=0.42 jumps to that point. */
(() => {
  const HERO_AR = 2107 / 2729;                 // cut-hero.webp (width / height)
  const $ = (s) => document.querySelector(s);
  const $$ = (s) => [...document.querySelectorAll(s)];
  const root = document.documentElement;
  const stage = $('#stage'), spacer = $('#spacer'), bar = $('#bar');
  const wm = $('#wm'), letters = $$('.wm .l'), slotWord = $('#slotWord');
  const hero = $('#hero'), heroTilt = $('#heroTilt');
  const heroIn = $('#heroIn'), heroCopy = $('#heroCopy');
  const hours = $('#hours'), hoursCol = $('#hoursCol');
  const clockLine = $('#clockLine'), clockIn = $('#clockIn');
  const dishes = $$('.dish');
  const ticketsBox = $('#tickets'), tickets = $$('#tickets i');
  const holCopy = $('#holCopy'), holIn = $('#holIn'), hols = $$('.hol');
  const store = $('#store');
  const order = $('#order'), mapBox = $('#map'), mapFrame = $('#mapFrame');
  const ctaFly = $('#ctaFly'), cta = ctaFly.firstElementChild;
  const slotHero = $('#slotHero'), slotBar = $('#slotBar'), slotClose = $('#slotClose');
  const dayNav = $('#day'), dayFill = $('#dayFill'), chip = $('#chip'), dayBtns = $$('.day button');
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

  // the clock: noon to noon. The dishes' stretch (noon to 8 AM) gets most of the scroll; 8 AM to noon passes quickly
  const P0 = 0.13, PA = 0.55, P1 = 0.6, HA = 32, H1 = 36;
  const hourName = (h) => { const x = ((h % 24) + 24) % 24, n = x % 12 === 0 ? 12 : x % 12; return [n, x < 12 ? 'AM' : 'PM']; };
  hoursCol.innerHTML = Array.from({ length: H1 - 12 + 1 }, (_, i) => { const [n, ap] = hourName(12 + i); return `<b>${n}<small>${ap}</small></b>`; }).join('');
  const hourEls = $$('#hoursCol b');
  const Hraw = (p) => (p < PA ? 12 + (HA - 12) * (p - P0) / (PA - P0) : HA + (H1 - HA) * (p - PA) / (P1 - PA));
  const START = dishes.map((d) => +d.dataset.h);
  const WIN = 4;                                  // each dish has four hours on the stage

  let VW = 0, VH = 0, mobile = false, L = {}, dirty = true, dark = false;

  function layout() {
    VW = root.clientWidth;
    VH = stage.clientHeight;
    mobile = VW <= 760;
    dark = root.getAttribute('data-theme-now') === 'dark';
    const barH = bar.offsetHeight;
    const dayTop = VH - (mobile ? 58 : 62);      // top of the day bar's label row
    $$('.stage *, .cta-fly, .day *').forEach((el) => { el._c = {}; });
    [wm, hero, heroIn, hoursCol, clockIn, holIn, order, ctaFly, store].forEach((el) => { el.style.transform = 'none'; el.style.clipPath = 'none'; });
    dishes.concat(hols).forEach((el) => { el.style.transform = 'none'; el.style.clipPath = 'none'; });

    // ---- hero copy first (its height decides how big the word can be)
    const padX = Math.max(18, VW * 0.04);
    heroCopy.style.width = (mobile ? VW - 36 : Math.min(560, VW * 0.42)) + 'px';
    const copyH = heroCopy.offsetHeight;

    // ---- the stack: a real cutout, never clipped by the screen
    let sh, sx, sy;
    if (mobile) {
      sh = Math.min(VH * 0.42, (VW * 0.72) / HERO_AR);
      sx = VW - sh * HERO_AR - 6;
    } else {
      sh = Math.min(dayTop - barH - 16, (VW * 0.36) / HERO_AR);     // its foot stays above the day bar
      sx = VW - padX - sh * HERO_AR + VW * 0.01;
    }
    const sw = sh * HERO_AR;

    // ---- wordmark: in their sign's lettering, as big as the room allows; the stack overlaps its last letters
    wm.style.fontSize = '100px';
    const w100 = wm.scrollWidth;
    let fs;
    if (mobile) fs = Math.min(0.9 * VW / w100 * 100, VH * 0.2);
    else {
      const reach = sx + sw * 0.26 - padX;                       // the word runs in behind the stack's body
      fs = Math.min(reach / w100 * 100, (dayTop - 24 - copyH - barH) / 1.02, VH * 0.46);
    }
    wm.style.fontSize = fs + 'px';
    const wmW = wm.scrollWidth, wmH = fs;
    const wmX = mobile ? (VW - wmW) / 2 : padX - fs * 0.03;
    if (!mobile) sy = Math.max(barH + 6, Math.min(dayTop - 8 - sh, (VH - sh) / 2 + 12));
    // desktop: the word sits level with the stack's body (lettuce and cheese), so the stack really covers its last letters
    const wmY = mobile ? barH + 4 : Math.max(barH, Math.min(dayTop - 24 - copyH - wmH * 1.04, sy + sh * 0.58 - wmH / 2));
    if (mobile) sy = wmY + wmH * 0.62;
    // desktop: pull the stack in so its body covers the end of the word (the last letter sizzles behind it)
    if (!mobile) sx = Math.min(sx, wmX + wmW - sw * 0.24);
    const heroR = { x: sx, y: sy, w: sw };

    // copy under the word (desktop) or under the stack (phone): never over a letter
    const cTop = mobile ? Math.min(sy + sh + 8, dayTop - 14 - copyH) : wmY + wmH * 1.04;
    Object.assign(heroCopy.style, { left: (mobile ? 18 : padX) + 'px', top: cTop + 'px' });

    // letters the stack really covers sizzle
    let k = 0;
    letters.forEach((l) => {
      const b = l.getBoundingClientRect();
      const bx = b.left + wmX;
      const cov = bx + b.width > sx + sw * 0.06 && wmY + wmH > sy + sh * 0.04;
      l.classList.toggle('cov', cov);
      if (cov) l.style.setProperty('--k', k++);
    });

    // ---- dock slot in the bar
    const slotH = mobile ? 30 : 36;
    const dockS = slotH / wmH;
    slotWord.style.width = wmW * dockS + 'px';
    slotWord.style.height = slotH + 'px';

    // ---- the clock, the tickets and the dish zone
    const tk = mobile ? 38 : 50, tg = 8;
    tickets.forEach((t) => { t.style.width = tk + 'px'; t.style.height = tk + 'px'; });
    const tW = tickets.length * tk + (tickets.length - 1) * tg;
    let hfs, hX, hY, clY, tX, tY, Z;
    if (mobile) {
      hfs = Math.min(VW * 0.24, VH * 0.12);
      hX = (VW - hfs * 2.6) / 2; hY = barH;
      tX = (VW - tW) / 2; tY = dayTop - tk - 16;
      Z = { x0: 16, x1: VW - 16 };
    } else {
      // left column: the clock, its line, the tickets. Right: the dish, as big as the room allows
      hfs = Math.min(VH * 0.3, VW * 0.15);
      hX = padX;
      const colH = hfs * 1.12 + 30 + 26 + tk;
      hY = Math.max(barH + 10, (VH - colH) / 2 - 10);
      tX = padX; tY = hY + hfs * 1.12 + 30 + 26;
      Z = { x0: Math.max(padX + hfs * 2.9, VW * 0.4), x1: VW - padX };
    }
    const hLine = hfs * 1.5;
    const band = hfs * 1.12;                        // each hour sits centred in its own tall line; the band shows one
    Object.assign(hours.style, { left: hX + 'px', top: hY + 'px', height: band + 'px', width: (mobile ? hfs * 2.6 : Z.x0 - hX) + 'px' });
    hourEls.forEach((b) => { b.style.fontSize = hfs + 'px'; b.style.height = hLine + 'px'; if (mobile) b.style.justifyContent = 'center'; else b.style.justifyContent = ''; });
    hoursCol.style.marginTop = -(hLine - band) / 2 + 'px';
    if (mobile) { clockLine.style.left = '0px'; clockLine.style.width = VW + 'px'; clockLine.style.textAlign = 'center'; }
    else { clockLine.style.left = hX + 'px'; clockLine.style.width = 'auto'; clockLine.style.textAlign = 'left'; }
    clY = hY + band + 6; clockLine.style.top = clY + 'px';
    ticketsBox.style.left = tX + 'px'; ticketsBox.style.top = tY + 'px';
    const tickR = tickets.map((t, i) => ({ x: tX + i * (tk + tg), y: tY, s: tk }));

    const zTop = mobile ? clY + clockLine.offsetHeight + 16 : barH + 14;
    const zBot = mobile ? tY - 40 : dayTop - 40;
    const zH = zBot - zTop, zW = Z.x1 - Z.x0;
    const F = dishes.map((d) => {
      const ar = +d.dataset.ar;
      const h = Math.min(zH, zW / ar), w = h * ar;
      d.style.width = w + 'px'; d.style.height = h + 'px';
      return { x: Z.x0 + (zW - w) / 2, y: zTop + (zH - h) / 2, w, h };
    });

    // ---- holidays: three frames at their own shapes
    holCopy.style.top = barH + (mobile ? 4 : 10) + 'px';
    const hcBottom = holCopy.offsetTop + holCopy.offsetHeight;
    const ars = hols.map((h) => +h.dataset.ar);
    const HF = [];
    if (mobile) {
      const g = 12, capH = 26;
      const avail = dayTop - 16 - hcBottom - capH * 2 - g * 2;
      const h1 = Math.min((VW - 32 - g) / (ars[0] + ars[1]), avail * 0.56);
      const h2 = Math.min((VW - 32) / ars[2], avail - h1);
      let y = hcBottom + 12, x = (VW - (h1 * (ars[0] + ars[1]) + g)) / 2;
      HF[0] = { x, y, w: h1 * ars[0], h: h1 }; x += h1 * ars[0] + g;
      HF[1] = { x, y, w: h1 * ars[1], h: h1 };
      y += h1 + capH + g;
      HF[2] = { x: (VW - h2 * ars[2]) / 2, y, w: h2 * ars[2], h: h2 };
    } else {
      const g = Math.max(18, VW * 0.02);
      const sum = ars.reduce((a, b) => a + b, 0);
      const h = Math.min(VH * 0.56, (VW * 0.88 - 2 * g) / sum, dayTop - 40 - hcBottom - 20);
      let x = (VW - (sum * h + 2 * g)) / 2;
      const off = [-0.015, 0.02, -0.008];
      const cyy = (hcBottom + 16 + dayTop - 40) / 2;
      ars.forEach((ar, i) => { HF[i] = { x, y: cyy - h / 2 + off[i] * h, w: h * ar, h }; x += h * ar + g; });
    }
    hols.forEach((el, i) => { el.style.width = HF[i].w + 'px'; el.style.height = HF[i].h + 'px'; });

    // ---- the close: the order card must fit the screen (shrink the map, then drop the small line)
    const odW = mobile ? VW - 24 : Math.min(440, Math.max(360, VW * 0.3));
    order.style.width = odW + 'px';
    order.classList.remove('tight'); mapBox.style.height = '';
    const avail = mobile ? dayTop - barH - VH * 0.22 : dayTop - barH - 22;
    let odH = order.offsetHeight;
    if (odH > avail) { mapBox.style.height = Math.max(64, mapBox.offsetHeight - (odH - avail)) + 'px'; odH = order.offsetHeight; }
    if (odH > avail) { order.classList.add('tight'); odH = order.offsetHeight; }
    const od = mobile ? { x: 12, y: dayTop - 10 - odH } : { x: padX, y: barH + Math.max(6, (dayTop - 16 - barH - odH) / 2) };
    order.style.left = od.x + 'px'; order.style.top = od.y + 'px';
    const SAR = +store.dataset.ar;
    let close;
    if (mobile) {
      const top = barH + 4, bottom = od.y - 10, zh = bottom - top;
      const h = Math.min(zh, (VW - 24) / SAR), w = h * SAR;
      const S = { x: 12, y: top + (zh - h) / 2, w, h };
      const ch = Math.min(h * 0.86, VW * 0.4 / HERO_AR);
      close = { S, hero: { x: VW - ch * HERO_AR - 4, y: S.y + h - ch * 0.82, w: ch * HERO_AR }, wm: null };
    } else {
      const zx = od.x + odW + Math.max(40, VW * 0.04), zw = VW - zx - padX;
      const wmS = Math.min(zw * 0.7 / wmW, (VH * 0.17) / wmH);
      const wTop = barH - 4, sTop = wTop + wmH * wmS * 0.9, sBot = dayTop - 20;
      const h = Math.min(sBot - sTop, zw * 0.8 / SAR), w = h * SAR;
      const S = { x: zx + (zw - w) / 2 - zw * 0.08, y: sTop + (sBot - sTop - h) / 2, w, h };
      const ch = Math.min(h * 0.9, (VW - S.x - S.w * 0.72 - padX * 0.5) / HERO_AR);
      const cw = ch * HERO_AR;
      close = { S, hero: { x: Math.min(S.x + S.w - cw * 0.45, VW - cw - padX * 0.5), y: S.y + h - ch * 0.86, w: cw }, wm: { x: S.x + (S.w - wmW * wmS) / 2, y: wTop, s: wmS } };
    }
    Object.assign(store.style, { left: close.S.x + 'px', top: close.S.y + 'px', width: close.S.w + 'px', height: close.S.h + 'px' });

    // ---- button slots (measured where they really sit)
    const bw = cta.offsetWidth, bh = cta.offsetHeight;
    const sHero = mobile ? 0.94 : 1, sBar = mobile ? 0.62 : 0.7, sClose = 1;
    Object.assign(slotHero.style, { width: bw * sHero + 'px', height: bh * sHero + 'px' });
    Object.assign(slotBar.style, { width: bw * sBar + 'px', height: bh * sBar + 'px' });
    Object.assign(slotClose.style, { width: bw * sClose + 'px', height: bh * sClose + 'px' });
    const rh = slotHero.getBoundingClientRect(), rb = slotBar.getBoundingClientRect(), rc = slotClose.getBoundingClientRect(), rw = slotWord.getBoundingClientRect();
    const C = { hero: { x: rh.left, y: rh.top, s: sHero }, bar: { x: rb.left, y: rb.top, s: sBar }, close: { x: rc.left, y: rc.top, s: sClose } };

    // ---- the day bar: stop centres
    const dayR = dayNav.getBoundingClientRect();
    const stops = dayBtns.map((b) => { const r = b.getBoundingClientRect(); return { p: +b.dataset.p, x: r.left + r.width / 2 - dayR.left }; });

    L = { barH, wmX, wmY, wmW, wmH, heroR, dock: { x: rw.left, y: rw.top, s: dockS }, hLine, F, tickR, HF, od, close, C, stops,
      dayW: dayR.width, dayL: dayR.left, dayM: dayR.top + dayR.height / 2, track: spacer.offsetHeight - innerHeight };
    root.classList.add('ready');
    dirty = true;
  }

  let fgNow = '', chipX = 0;
  const chipAt = (p) => { const S = L.stops; let j = 0; while (j < S.length - 2 && p > S[j + 1].p) j++; return lerp(S[j].x, S[j + 1].x, clamp((p - S[j].p) / (S[j + 1].p - S[j].p))); };

  function render(p) {
    const { F, tickR, HF, close } = L;
    chipX = chipAt(p);
    const fg = dark ? 'var(--cream)' : 'var(--ink)';
    if (fg !== fgNow) { fgNow = fg; root.style.setProperty('--fg', fg); }

    // ---- the wordmark: hero -> docked in the bar -> back above the storefront
    {
      const d = E(seg(p, 0.03, 0.11)), u = close.wm ? E(seg(p, 0.86, 0.93)) : 0;
      let x = lerp(L.wmX, L.dock.x, d), y = lerp(L.wmY, L.dock.y, d), s = lerp(1, L.dock.s, d);
      if (u > 0) { x = lerp(L.dock.x, close.wm.x, u); y = lerp(L.dock.y, close.wm.y, u); s = lerp(L.dock.s, close.wm.s, u); }
      put(wm, 'transform', tf(x, y, s));
      put(wm, 'zIndex', p > 0.1 && p < 0.86 ? '21' : '3');
      wm.classList.toggle('sizzle', p < 0.03);
    }

    // ---- hero copy leaves downward
    const hc = E(seg(p, 0.012, 0.06));
    put(heroIn, 'transform', `translate3d(0,${r1(hc * 112)}%,0)`);
    show(heroIn, hc < 1);

    // ---- the stack: slides off to the right, comes back in front of the storefront
    {
      const H0 = L.heroR, out = E(seg(p, 0.035, 0.12)), back = E(seg(p, 0.865, 0.94));
      let x = lerp(H0.x, VW + 40, out), y = lerp(H0.y, H0.y + VH * 0.06, out), w = H0.w, rot = out * 8;
      if (back > 0) { const c = close.hero; x = lerp(VW + 40, c.x, back); y = lerp(c.y + VH * 0.05, c.y, back); w = c.w; rot = (1 - back) * 8; }
      put(hero, 'transform', tf(x, y, 1, rot));
      put(hero, 'width', r1(w) + 'px'); put(hero, 'height', r1(w / HERO_AR) + 'px');
      show(hero, out < 1 || back > 0);
      tiltOn = p < 0.03 || p > 0.95;
      if (!tiltOn && heroTilt.style.transform) heroTilt.style.transform = '';
    }

    // ---- the clock: rolls with the hours, never stops (it only slows on each hour)
    {
      const a = E(seg(p, 0.07, 0.13)), b = E(seg(p, 0.6, 0.64));
      const idx = clamp(Hraw(p) - 12, 0, H1 - 12);
      const roll = idx - Math.sin(idx * TAU) / TAU * 0.86;
      put(hoursCol, 'transform', `translate3d(0,${r1(-roll * L.hLine + (1 - a) * L.hLine * 0.8 - b * L.hLine * 1.2)}px,0)`);
      show(hours, a > 0 && b < 1);
      const ci = E(seg(p, 0.1, 0.14)), co = E(seg(p, 0.6, 0.625));
      put(clockIn, 'transform', `translate3d(0,${r1((1 - ci) * 110 - co * 110)}%,0)`);
      show(clockLine, ci > 0 && co < 1);
    }

    // ---- the dishes: in from the right as their hours start, into the tickets when they end
    {
      const H = Hraw(p);
      dishes.forEach((el, i) => {
        const f = F[i], hs = START[i];
        const inn = i === 0 ? O(seg(p, 0.095, 0.15)) : O(seg(H, hs - 0.9, hs + 0.2));
        const q = E(seg(H, hs + WIN - 0.95, hs + WIN - 0.05));      // into ticket i
        let x = lerp(VW + 40, f.x, inn), y = f.y + (1 - inn) * 30, s = 1, rot = (1 - inn) * 7, clip = 'none';
        if (q > 0) {
          const t = tickR[i], side = Math.min(f.w, f.h), sc = lerp(1, t.s / side, q);
          const cx = (f.w - side) / 2 * q, cy = (f.h - side) / 2 * q;
          x = lerp(f.x, t.x - cx * sc, q); y = lerp(f.y, t.y - cy * sc, q); s = sc; rot = 0;
          clip = `inset(${r1(cy)}px ${r1(cx)}px ${r1(cy)}px ${r1(cx)}px round ${r1(18 + q * 4 / sc)}px)`;
        }
        // end of the day: the tickets are rung up into the clock chip
        const rung = E(seg(p, 0.585 + i * 0.006, 0.625 + i * 0.006));
        if (rung > 0) { const cx0 = L.dayL + chipX, cy0 = L.dayM; s *= 1 - rung * 0.85; x = lerp(x, cx0 - (f.w * s) / 2, rung); y = lerp(y, cy0 - (f.h * s) / 2, rung); }
        put(el, 'transform', tf(x, y, s, rot));
        put(el, 'clipPath', clip);
        show(el, inn > 0 && rung < 1);
      });
      put(ticketsBox, 'opacity', (E(seg(p, 0.12, 0.16)) * (1 - E(seg(p, 0.585, 0.615)))).toFixed(3));
    }

    // ---- holidays: dealt in, then folded into the storefront
    {
      const hIn = E(seg(p, 0.645, 0.685)), hOut = E(seg(p, 0.79, 0.815));
      put(holIn, 'transform', `translate3d(0,${r1((1 - hIn) * 110 - hOut * 110)}%,0)`);
      show(holCopy, hIn > 0 && hOut < 1);
      const S = close.S;
      hols.forEach((el, i) => {
        const f = HF[i];
        const t = O(seg(p, 0.625 + i * 0.022, 0.69 + i * 0.022));
        let x = f.x, y = lerp(VH + 40 + i * 30, f.y, t), s = 1, rot = (1 - t) * (i === 1 ? -8 : 9), op = 1, clip = 'none';
        const m = E(seg(p, 0.8 + i * 0.008, 0.865 + i * 0.008));
        if (m > 0) {
          const sc = lerp(1, Math.max(S.w / f.w, S.h / f.h), m);
          const cx = Math.max(0, (f.w * sc - S.w) / 2 / sc) * m, cy = Math.max(0, (f.h * sc - S.h) / 2 / sc) * m;
          x = lerp(f.x, S.x - cx * sc, m); y = lerp(f.y, S.y - cy * sc, m); s = sc; rot = 0;
          clip = `inset(${r1(cy)}px ${r1(cx)}px ${r1(cy)}px ${r1(cx)}px round ${r1(18 / sc)}px)`;
          op = 1 - E(seg(p, 0.85, 0.875));
        }
        put(el, 'transform', tf(x, y, s, rot));
        put(el, 'clipPath', clip);
        put(el, 'opacity', op.toFixed(3));
        show(el, t > 0 && op > 0);
      });
    }

    // ---- the close: storefront fades up where the holiday photos folded, the card rises
    {
      const s = E(seg(p, 0.835, 0.87));
      put(store, 'opacity', s.toFixed(3));
      show(store, s > 0);
      const dy = cardY(p);
      put(order, 'transform', `translate3d(0,${r1(dy)}px,0)`);
      show(order, dy < VH);
      if (p > 0.78 && !mapFrame.src) mapFrame.src = mapFrame.dataset.src;
    }

    // ---- the travelling button
    {
      const C = L.C, up = E(seg(p, 0.015, 0.075)), down = E(seg(p, 0.925, 0.985));
      const A = p < 0.5 ? C.hero : C.bar, Z = p < 0.5 ? C.bar : C.close, t = p < 0.5 ? up : down;
      const arc = Math.sin(t * Math.PI) * (p < 0.5 ? -40 : 40);
      const zy = p < 0.5 ? 0 : cardY(p);
      put(ctaFly, 'transform', `translate3d(${r1(lerp(A.x, Z.x, t) + arc)}px,${r1(lerp(A.y, Z.y + zy, t))}px,0) scale(${lerp(A.s, Z.s, t).toFixed(4)})`);
    }

    // ---- the day bar: the clock chip rides the line
    {
      const S = L.stops, x = chipX;
      put(chip, 'transform', `translate3d(${r1(x)}px,-50%,0)`);
      put(dayFill, 'transform', `scaleX(${(x / L.dayW).toFixed(4)})`);
      let label;
      if (p < P0 - 0.02) label = 'Open';
      else if (p < 0.62) { const [n, ap] = hourName(Math.floor(clamp(Hraw(p), 12, H1) + 0.5)); label = `${n} ${ap}`; }
      else if (p < 0.82) label = 'Holidays';
      else label = 'Order';
      if (chip._t !== label) { chip._t = label; chip.textContent = label; }
      let on = 0; S.forEach((s, i) => { if (p >= s.p - 0.03) on = i; });
      dayBtns.forEach((b, i) => b.classList.toggle('on', i === on));
    }
  }

  const cardY = (p) => lerp(VH - L.od.y + 30, 0, E(seg(p, 0.845, 0.92)));

  // smoothed scroll
  let cur = 0, target = 0, last = 0, running = false;
  const readTarget = () => { target = L.track > 0 ? clamp(scrollY / L.track) : 0; };
  function frame(t) {
    const dt = last ? Math.min(64, t - last) : 16.7; last = t;
    const kk = reduced.matches ? 1 : 1 - Math.pow(1 - 0.1, dt / 16.7);
    const d = target - cur;
    cur = Math.abs(d) < 0.00002 ? target : cur + d * kk;
    if (dirty || d !== 0) { render(cur); dirty = false; }
    if (cur !== target) requestAnimationFrame(frame); else { running = false; last = 0; }
  }
  const kick = () => { readTarget(); if (!running) { running = true; requestAnimationFrame(frame); } };

  // the stack leans toward the cursor around its own centre (8deg / 11deg), direct: no inertia, no sheen
  let tiltOn = true, tx = 0, ty = 0, tiltRun = false;
  function tilt() {
    tiltRun = false;
    const x = tiltOn ? tx : 0, y = tiltOn ? ty : 0;
    heroTilt.style.transform = `rotateX(${(x * 8).toFixed(2)}deg) rotateY(${(y * 11).toFixed(2)}deg)`;
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
    if (qp) { scrollTo(0, clamp(+qp[1]) * L.track); readTarget(); cur = target; }
    render(cur);
  }
  start();
  addEventListener('scroll', kick, { passive: true });
  const relayout = () => { layout(); readTarget(); if (!running) cur = target; fgNow = ''; render(cur); dirty = false; kick(); };
  addEventListener('resize', relayout);
  root.addEventListener('themechange', () => { if (L.F) relayout(); });
  document.fonts && document.fonts.ready.then(relayout);
  addEventListener('load', relayout);
  $$('.stage img').forEach((img) => { if (img.decode) img.decode().catch(() => {}); });
  $('.brand').addEventListener('click', (e) => { e.preventDefault(); scrollTo({ top: 0, behavior: reduced.matches ? 'auto' : 'smooth' }); });
  dayBtns.forEach((b) => b.addEventListener('click', () => scrollTo({ top: +b.dataset.p * L.track, behavior: reduced.matches ? 'auto' : 'smooth' })));

  // liquid glass: the Vivace cursor ball, glass button, the button leans toward the cursor
  if (window.LiquidGlass) {
    LiquidGlass.cursorBall();
    LiquidGlass.glassify('.lg-glass');
    LiquidGlass.magnet('.cta-fly .cta', { reach: 'page', curve: 2.2, pull: 0.6, max: 46 });
  }
})();
