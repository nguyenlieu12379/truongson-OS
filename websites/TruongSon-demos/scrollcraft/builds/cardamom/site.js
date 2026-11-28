/* Cardamom, the sign. One fixed stage; scroll only drives motion. Nothing fades between scenes: each scene's
   end builds the next one's start.
   1 hero: their Hyderabadi chicken biryani centred over a deep green "cardamom", breathing, leaning to the
     cursor; the letters it covers sway
   2 menu: the word parts, the plate steps into a square frame beside the menu; the frame grows out of the
     plate and each dish's photo rolls up in it as its row comes up (real names, real prices)
   3 peak: the last row is Irani chai, and its photo is their storefront with IRANI CHAI in the window, sign
     off. The frame grows, the page goes to night and the neon sign switches on letter by letter
   4 the dining room grows out of the lit shop window: dine-in, catering, banquet, halal
   5 the room carries off, the word comes back in neon green with the plate in front, the order card arrives.
     Holds.
   ?p=0.5 jumps there. */
(() => {
  const $ = (s) => document.getElementById(s);
  const root = document.documentElement;
  const stage = $('stage'), bar = $('bar'), demo = document.querySelector('.demo');
  const E = {
    night: $('night'), word: $('word'), heroL: $('heroL'), heroR: $('heroR'), plate: $('plate'), sh: $('plateSh'),
    frame: $('frame'), room: $('room'), menu: $('menu'), late: $('late'), inside: $('inside'), card: $('card'),
  };
  const cta = $('cta'), slot = $('ctaSlot');
  const chars = [...E.word.querySelectorAll('.ch')];
  const rows = [...E.menu.querySelectorAll('li')];
  const list = $('menuList');
  const frs = Object.fromEntries([...E.frame.querySelectorAll('.fr')].map((f) => [f.dataset.k, f]));
  const lts = [...E.frame.querySelectorAll('.lt')];
  const insideRows = [...E.inside.querySelectorAll('li')];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');

  const PL = { w: 794, h: 420 }, SH_PAD = 50;
  // the lit shop window in the storefront photo (fractions of the square), where the dining room grows from
  const WIN = { x: 0.0, y: 0.355, w: 0.77, h: 0.31 };
  const PHOTO_ORDER = ['bowls', 'apps', 'curries', 'meetha', 'night'];
  const N = rows.length;

  const clamp = (v, a = 0, b = 1) => (v < a ? a : v > b ? b : v);
  const seg = (p, a, b) => clamp((p - a) / (b - a));
  const E3 = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const lerp = (a, b, t) => a + (b - a) * t;
  const r1 = (v) => Math.round(v * 10) / 10;
  const put = (el, k, v) => { const c = el._c || (el._c = {}); if (c[k] !== v) { c[k] = v; el.style[k] = v; } };
  const at = (el, x, y, s = 1) => put(el, 'transform', `translate3d(${r1(x)}px,${r1(y)}px,0)${s !== 1 ? ` scale(${s.toFixed(4)})` : ''}`);
  const vis = (el, on) => put(el, 'visibility', on ? 'visible' : 'hidden');
  const rect = (a, b, t) => ({ x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t), w: lerp(a.w, b.w, t), h: lerp(a.h, b.h, t) });
  const box = (el, R, rad) => { put(el, 'width', `${r1(R.w)}px`); put(el, 'height', `${r1(R.h)}px`); at(el, R.x, R.y); if (rad !== undefined) put(el, 'borderRadius', `${r1(rad)}px`); };

  const T = {
    part: [0.04, 0.13], menuIn: [0.06, 0.14], menu: [0.14, 0.42],
    grow: [0.43, 0.53], sign: [0.52, 0.64], lateIn: [0.47, 0.56],
    room: [0.69, 0.79], close: [0.83, 0.93], ctaGo: [0.9, 0.97],
  };

  let VW = 0, VH = 0, TOP = 66, mob = false, L = {};
  let p = 0, pT = 0, t0 = performance.now(), forced = null, running = false;
  let lean = { x: 0, y: 0 }, leanT = { x: 0, y: 0 };
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  const q = new URLSearchParams(location.search).get('p');
  if (q !== null && !isNaN(+q)) forced = clamp(+q);

  function layout() {
    [...stage.querySelectorAll('*')].forEach((el) => { el._c = {}; el.style.transform = ''; el.style.visibility = ''; el.style.clipPath = ''; });
    VW = root.clientWidth; VH = stage.clientHeight; mob = VW <= 760; TOP = bar.offsetHeight;
    const pad = mob ? 16 : Math.min(56, Math.max(24, VW * 0.035));
    L.pad = pad;

    // --- hero: the word fills the width; the plate sits over its lower half so the word still reads
    E.word.style.fontSize = '200px';
    const ww = E.word.scrollWidth;
    const fs = Math.min((VW - pad * 2) / ww * 200, mob ? 999 : VH * 0.36);
    E.word.style.fontSize = `${fs}px`;
    L.wordW = E.word.scrollWidth; L.wordH = E.word.offsetHeight;
    L.chx = chars.map((c) => c.offsetLeft + c.offsetWidth / 2);
    L.hlH = E.heroL.offsetHeight; L.hrH = E.heroR.offsetHeight; L.hrW = E.heroR.offsetWidth;
    if (mob) {
      L.word = { x: (VW - L.wordW) / 2, y: TOP + 18 };
      L.pw0 = VW * 0.92;
      L.pc0 = { x: VW / 2, y: L.word.y + L.wordH * 0.92 + (L.pw0 * PL.h / PL.w) * 0.42 };
      L.hl = { x: pad, y: L.pc0.y + (L.pw0 * PL.h / PL.w) * 0.55 + 16 };
      L.hr = { x: pad, y: L.hl.y + L.hlH + 12 };
    } else {
      L.word = { x: (VW - L.wordW) / 2, y: TOP + (VH - TOP) * 0.36 - L.wordH / 2 };
      L.pw0 = Math.min(VW * 0.44, 660, (VH - TOP) * 0.62 * PL.w / PL.h);
      L.pc0 = { x: VW / 2, y: L.word.y + L.wordH * 0.86 + (L.pw0 * PL.h / PL.w) * 0.18 };
      L.hl = { x: pad, y: VH - L.hlH - 34 };
      L.hr = { x: VW - pad - L.hrW, y: VH - L.hrH - 34 };
      // short screens: the plate must clear the hero copy under it
      const base = L.word.y + L.wordH * 0.86, lim = Math.min(L.hl.y, L.hr.y) - 14;
      const phMax = (lim - base) / 0.68;
      if (L.pw0 * PL.h / PL.w > phMax) {
        L.pw0 = Math.max(phMax, 120) * PL.w / PL.h;
        L.pc0.y = base + (L.pw0 * PL.h / PL.w) * 0.18;
      }
    }
    // letters the plate covers (by x), they sway with it
    const pl = L.pc0.x - L.pw0 / 2 - L.word.x, pr = L.pc0.x + L.pw0 / 2 - L.word.x;
    L.covered = L.chx.map((x) => x > pl && x < pr);

    // --- menu: square frame on the left, the list on the right (phone: frame on top, list under it)
    if (mob) {
      const S = Math.min(VW - pad * 2, (VH - TOP) * 0.5);
      L.fr = { x: (VW - S) / 2, y: TOP + 8, w: S, h: S };
      L.menuW = VW - pad * 2;
      L.menuXY = { x: pad, y: L.fr.y + S + 14 };
    } else {
      const S = Math.min(VH - TOP - 70, VW * 0.4);
      L.fr = { x: pad + VW * 0.02, y: TOP + (VH - TOP - S) / 2, w: S, h: S };
      const mx = L.fr.x + S + Math.max(40, VW * 0.05);
      L.menuW = Math.min(560, VW - mx - pad);
      L.menuXY = { x: mx, y: 0 };
    }
    put(E.menu, 'width', `${L.menuW}px`);
    L.menuH = E.menu.offsetHeight;
    L.rowY = rows.map((r) => r.offsetTop);
    L.rowH = rows.map((r) => r.offsetHeight);
    L.listTop = list.offsetTop;
    if (!mob) L.menuXY.y = Math.max(TOP + 10, TOP + (VH - TOP - L.menuH) / 2);
    // phone: the list scrolls under the frame so the current row stays in view
    L.listShift = (a) => {
      if (!mob) return 0;
      const room = VH - L.menuXY.y - L.listTop - 40;
      const i = clamp(a, 0, N - 1), y = lerp(L.rowY[Math.floor(i)], L.rowY[Math.min(N - 1, Math.floor(i) + 1)], i % 1);
      return -clamp(y + L.listTop - room * 0.45, 0, Math.max(0, L.listTop + L.rowY[N - 1] + L.rowH[N - 1] + 30 - (VH - L.menuXY.y)));
    };
    // the plate inside the frame for row 1
    L.pw1 = L.fr.w * 0.96;
    L.pc1 = { x: L.fr.x + L.fr.w / 2, y: L.fr.y + L.fr.h / 2 };

    // --- peak: the frame grows; the late copy sits beside it (phone: under it)
    if (mob) {
      const S = VW - pad * 2;
      L.pk = { x: pad, y: TOP + 8, w: S, h: S };
      L.lateW = VW - pad * 2;
      put(E.late, 'width', `${L.lateW}px`); put(E.inside, 'width', `${L.lateW}px`);
      L.lateXY = { x: pad, y: L.pk.y + S + 16 };
      L.insXY = { x: pad, y: L.pk.y + S + 16 };
      L.pkRm = L.pk;
    } else {
      const S = Math.min(VH - TOP - 36, VW * 0.56);
      L.pk = { x: VW - pad - S, y: TOP + (VH - TOP - S) / 2 + 4, w: S, h: S };
      L.lateW = Math.min(460, L.pk.x - pad * 2 - VW * 0.02);
      put(E.late, 'width', `${L.lateW}px`); put(E.inside, 'width', `${L.lateW}px`);
      L.lateXY = { x: pad + VW * 0.01, y: TOP + (VH - TOP - E.late.offsetHeight) / 2 };
      L.insXY = { x: pad + VW * 0.01, y: TOP + (VH - TOP - E.inside.offsetHeight) / 2 };
      L.pkRm = L.pk;
    }
    L.lateH = E.late.offsetHeight; L.insH = E.inside.offsetHeight;
    // shrink the phone copy if it runs off the bottom
    L.lateS = mob ? Math.min(1, (VH - L.lateXY.y - 10) / L.lateH) : 1;
    L.insS = mob ? Math.min(1, (VH - L.insXY.y - 10) / L.insH) : 1;
    put(E.late, 'transformOrigin', '0 0'); put(E.inside, 'transformOrigin', '0 0');

    // --- close: order card right (phone: bottom), word and plate back on the left (phone: above it)
    L.cardW = mob ? VW - pad * 2 : Math.min(440, VW * 0.36);
    put(E.card, 'width', `${L.cardW}px`);
    E.card.classList.remove('compact');
    L.cardH = E.card.offsetHeight;
    const avail = mob ? VH - TOP - 150 : VH - TOP - 30;
    if (L.cardH > avail) { E.card.classList.add('compact'); L.cardH = E.card.offsetHeight; }
    L.cardS = Math.min(1, avail / L.cardH);
    const cw = L.cardW * L.cardS, ch = L.cardH * L.cardS;
    L.cardXY = mob ? { x: pad, y: VH - ch - 12 } : { x: VW - pad - cw - VW * 0.02, y: TOP + (VH - TOP - ch) / 2 };
    L.cardHs = ch;
    if (mob) {
      const top = TOP + 6, bottom = L.cardXY.y - 10, h = bottom - top;
      L.wordC = { s: Math.min(1, (VW - pad * 2) / L.wordW), y: top };
      L.pw4 = Math.min(VW * 0.7, (h - L.wordH * L.wordC.s * 0.6) * PL.w / PL.h);
      L.pc4 = { x: VW / 2, y: Math.min(bottom - L.pw4 * PL.h / PL.w / 2, top + L.wordH * L.wordC.s * 0.92 + L.pw4 * PL.h / PL.w * 0.45) };
      L.wordC.x = (VW - L.wordW * L.wordC.s) / 2;
    } else {
      const areaW = L.cardXY.x - pad * 2;
      L.wordC = { s: Math.min(1, areaW / L.wordW) };
      L.wordC.x = pad + (areaW - L.wordW * L.wordC.s) / 2;
      L.wordC.y = TOP + (VH - TOP) * 0.36 - L.wordH * L.wordC.s / 2;
      L.pw4 = Math.min(areaW * 0.62, 600);
      L.pc4 = { x: pad + areaW / 2, y: Math.min(VH - L.pw4 * PL.h / PL.w * 0.55, L.wordC.y + L.wordH * L.wordC.s * 0.95 + L.pw4 * PL.h / PL.w * 0.38) };
    }
    cta.classList.remove('travel'); ['left', 'top', 'width', 'height', 'fontSize'].forEach((k) => { cta.style[k] = ''; }); cta._c = {};
    const hr = cta.getBoundingClientRect();
    L.ctaHome = { x: hr.left, y: hr.top, w: hr.width, h: hr.height };
    L.slot = { dx: slot.offsetLeft * L.cardS, dy: slot.offsetTop * L.cardS, w: slot.offsetWidth * L.cardS, h: slot.offsetHeight * L.cardS };
  }

  function frame(now) {
    const doc = root.scrollHeight - innerHeight;
    pT = forced !== null ? forced : clamp(scrollY / Math.max(1, doc));
    p += (pT - p) * (forced !== null || reduced.matches ? 1 : 0.14);
    if (Math.abs(pT - p) < 0.0003) p = pT;
    lean.x += (leanT.x - lean.x) * 0.12; lean.y += (leanT.y - lean.y) * 0.12;
    draw(p, (now - t0) / 1000);
    requestAnimationFrame(frame);
  }

  // a neon letter coming on: flickers twice on the way up (scroll-driven, so it runs backwards too)
  const flick = (t) => (t <= 0 ? 0 : t < 0.18 ? 1 : t < 0.32 ? 0.15 : t < 0.5 ? 0.9 : t < 0.6 ? 0.35 : 1);

  function plateAt(cx, cy, w, extra = '') {
    const s = w / PL.w;
    put(E.plate, 'transform', `translate3d(${r1(cx)}px,${r1(cy)}px,0)${extra} scale(${s.toFixed(4)}) translate(-${PL.w / 2}px,-${PL.h / 2}px)`);
    put(E.sh, 'transform', `translate3d(${r1(cx)}px,${r1(cy + w * 0.035)}px,0) scale(${s.toFixed(4)}) translate(-${PL.w / 2 + SH_PAD}px,-${PL.h / 2 + SH_PAD}px)`);
  }

  function draw(p, time) {
    const { pad } = L, still = reduced.matches;
    const part = E3(seg(p, ...T.part)), mIn = E3(seg(p, ...T.menuIn)), g = E3(seg(p, ...T.grow));
    const rm = E3(seg(p, ...T.room)), c = E3(seg(p, ...T.close));
    const breathe = still ? 1 : 1 + Math.sin(time * 1.5) * 0.016;
    const bob = still ? 0 : Math.sin(time * 1.5 + 0.6) * 3;

    // --- night: the ground goes dark as the storefront grows, and stays dark
    const n = g;
    put(E.night, 'opacity', n.toFixed(3));
    vis(E.night, n > 0);
    const isNight = n > 0.5;
    bar.classList.toggle('is-night', isNight); demo.classList.toggle('is-night', isNight);

    // --- menu progress: a runs 0..N-1 over the menu span
    const a = seg(p, ...T.menu) * (N - 1 + 0.6) - 0.3;
    const act = clamp(Math.round(a), 0, N - 1);
    rows.forEach((r, i) => r.classList.toggle('on', i === act && p < T.grow[1]));

    // --- the word: parts left and right off the stage; comes back for the close in neon green
    const wordOn = part < 1 || c > 0;
    if (c > 0) {
      const back = 1 - c;
      put(E.word, 'transform', `translate3d(${r1(L.wordC.x)}px,${r1(L.wordC.y)}px,0) scale(${L.wordC.s.toFixed(4)})`);
      put(E.word, 'transformOrigin', '0 0');
      chars.forEach((ch, i) => put(ch, 'transform', `translateX(${r1((i < 4 ? -1 : 1) * back * VW * 0.7)}px)`));
      put(E.word, 'color', 'var(--neon)');
    } else {
      at(E.word, L.word.x, L.word.y);
      put(E.word, 'color', '');
      chars.forEach((ch, i) => {
        const side = i < 4 ? -1 : 1;
        const sway = L.covered[i] && part === 0 && !still ? Math.sin(time * 1.5 + i * 0.7) * 2.2 : 0;
        put(ch, 'transform', `translate(${r1(side * part * VW * 0.75)}px,${r1(sway)}px)`);
      });
    }
    vis(E.word, wordOn);
    at(E.heroL, L.hl.x - (mob ? part * VW * 1.1 : 0), L.hl.y + (mob ? 0 : part * VH * 0.6));
    at(E.heroR, L.hr.x - (mob ? part * VW * 1.1 : 0), L.hr.y + (mob ? 0 : part * VH * 0.6));
    vis(E.heroL, part < 1); vis(E.heroR, part < 1);

    // --- the plate: hero, then into the frame slot (row 1), covered by the frame as it grows; back for the close
    const g0 = E3(clamp((a - 0.35) / 0.5));   // the frame grows out of the plate as row 2 comes up
    let P = null, lean3 = '';
    if (c > 0) P = { x: L.pc4.x, y: lerp(VH + L.pw4, L.pc4.y, c) + (c >= 1 ? bob : 0), w: L.pw4 * (c >= 1 ? breathe : 1) };
    else if (g0 < 1) P = { x: lerp(L.pc0.x, L.pc1.x, part), y: lerp(L.pc0.y, L.pc1.y, part) + (part === 0 ? bob : 0), w: lerp(L.pw0, L.pw1, part) * (part === 0 ? breathe : 1) };
    const leanOn = !still && !mob && (part === 0 || c >= 1);
    if (leanOn) lean3 = ` perspective(1200px) rotateX(${(-lean.y * 8).toFixed(2)}deg) rotateY(${(lean.x * 11).toFixed(2)}deg)`;
    if (P) plateAt(P.x, P.y, P.w, lean3);
    vis(E.plate, !!P); vis(E.sh, !!P);

    // --- the frame: grows out of the plate's box, photos roll up per row, then grows into the storefront
    const pr = { x: L.pc1.x - L.pw1 / 2, y: L.pc1.y - L.pw1 * PL.h / PL.w / 2, w: L.pw1, h: L.pw1 * PL.h / PL.w };
    let F = g0 < 1 ? rect(pr, L.fr, g0) : rect(L.fr, L.pk, g);
    let fOn = g0 > 0 && c < 1;
    if (rm > 0 || c > 0) F = L.pk;
    const carry = c * (mob ? -VW * 1.1 : VW * 0.75);   // the room and the storefront carry off for the close
    box(E.frame, { x: F.x + carry, y: F.y, w: F.w, h: F.h }, g0 < 1 ? lerp(90, 22, g0) : 22);
    vis(E.frame, fOn && rm < 1);
    // each photo rolls up from the bottom when its first row comes up
    PHOTO_ORDER.forEach((k, j) => {
      const first = rows.findIndex((r) => r.dataset.ph === k);
      const r = j === 0 ? 1 : E3(clamp((a - first + 0.45) / 0.5));
      put(frs[k], 'clipPath', r >= 1 ? 'none' : `inset(${r1((1 - r) * 100)}% 0 0 0)`);
      vis(frs[k], r > 0 && fOn && rm < 1);
    });
    // the sign: letters switch on one by one
    const sg = seg(p, ...T.sign);
    lts.forEach((el, i) => {
      const t = (sg * (lts.length + 1.2) - i) / 1.4;
      const o = flick(clamp(t, 0, 1.0001));
      put(el, 'opacity', o.toFixed(2));
    });

    // --- menu: slides in from the right as the word parts, carries off left as the storefront grows
    const mx = L.menuXY.x + (1 - mIn) * VW * 0.6 + g * (mob ? 0 : VW * 0.7);
    const my = L.menuXY.y + (mob ? g * VH + L.listShift(a) : 0);
    at(E.menu, mx, my);
    if (mob) put(E.menu, 'clipPath', `inset(${r1(Math.max(0, L.fr.y + L.fr.h + 6 - my))}px 0 0 0)`);
        vis(E.menu, mIn > 0 && g < 1);

    // --- late copy: in from the left with the night, out to the left as the room grows
    const li = E3(seg(p, ...T.lateIn));
    const lx = L.lateXY.x - (1 - li) * (L.lateW + pad * 2) - rm * (L.lateW + pad * 2 + VW * 0.1);
    put(E.late, 'transform', `translate3d(${r1(mob ? L.lateXY.x - rm * VW : lx)}px,${r1(mob ? L.lateXY.y + (1 - li) * VH * 0.6 : L.lateXY.y)}px,0) scale(${L.lateS.toFixed(3)})`);
    vis(E.late, li > 0 && rm < 1);

    // --- the room: grows out of the lit shop window to the storefront's box
    const win = { x: L.pk.x + WIN.x * L.pk.w, y: L.pk.y + WIN.y * L.pk.h, w: WIN.w * L.pk.w, h: WIN.h * L.pk.h };
    const R = rect(win, L.pkRm, rm);
    box(E.room, { x: R.x + carry, y: R.y, w: R.w, h: R.h }, lerp(4, 22, rm));
    vis(E.room, rm > 0 && c < 1);
    // inside copy: rows rise in after the room, carry off left for the close
    const ii = seg(p, T.room[0] + 0.03, T.room[1] + 0.03);
    const ix = L.insXY.x - c * (L.lateW + pad * 2 + VW * 0.1) * (mob ? 2 : 1);
    put(E.inside, 'transform', `translate3d(${r1(ix)}px,${r1(L.insXY.y)}px,0) scale(${L.insS.toFixed(3)})`);
    put(E.inside.querySelector('h2'), 'transform', `translateY(${r1((1 - E3(clamp(ii * 2.5))) * VH * 0.7)}px)`);
    insideRows.forEach((r, i) => put(r, 'transform', `translateY(${r1((1 - E3(clamp(ii * 2.2 - 0.25 - i * 0.22))) * VH * 0.8)}px)`));
    vis(E.inside, ii > 0 && c < 1);

    // --- close: the card comes in from the right (phone: from below)
    const cardX = L.cardXY.x + (mob ? 0 : (1 - c) * VW * 0.7), cardY = L.cardXY.y + (mob ? (1 - c) * VH : 0);
    at(E.card, cardX, cardY, L.cardS);
    vis(E.card, c > 0);

    // the one CTA leaves the bar's corner and lands in the card's slot
    const tk = E3(seg(p, ...T.ctaGo));
    if (tk <= 0) {
      if (cta.classList.contains('travel')) { cta.classList.remove('travel'); ['left', 'top', 'width', 'height', 'fontSize'].forEach((k) => { cta.style[k] = ''; }); cta._c = {}; }
    } else {
      if (!cta.classList.contains('travel')) cta.classList.add('travel');
      const h = L.ctaHome, sx = cardX + L.slot.dx, sy = cardY + L.slot.dy;
      const arc = Math.sin(tk * Math.PI) * Math.min(90, VW * 0.06);
      put(cta, 'left', `${r1(lerp(h.x, sx, tk) - arc)}px`); put(cta, 'top', `${r1(lerp(h.y, sy, tk))}px`);
      put(cta, 'width', `${r1(lerp(h.w, L.slot.w, tk))}px`); put(cta, 'height', `${r1(lerp(h.h, L.slot.h, tk))}px`);
      put(cta, 'fontSize', `${lerp(mob ? 14 : 15.2, 16.8 * Math.min(1, L.cardS + 0.1), tk).toFixed(2)}px`);
    }
  }

  function start() {
    layout();
    if (forced !== null) {
      const doc = root.scrollHeight - innerHeight; scrollTo(0, forced * doc);
      p = pT = forced; draw(p, 0); forced = null;
    }
    if (!running) { running = true; requestAnimationFrame(frame); }
  }

  addEventListener('pointermove', (e) => { if (e.pointerType === 'mouse') { leanT.x = (e.clientX / innerWidth - 0.5) * 2; leanT.y = (e.clientY / innerHeight - 0.5) * 2; } }, { passive: true });
  let rz = 0;
  addEventListener('resize', () => { cancelAnimationFrame(rz); rz = requestAnimationFrame(layout); });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(layout);
  addEventListener('load', layout);
  start();
  ['night-on', 'f-room'].forEach((n) => { const i = new Image(); i.src = `assets/${n}.webp`; if (i.decode) i.decode().catch(() => {}); });
  addEventListener('DOMContentLoaded', () => { if (window.LiquidGlass) LiquidGlass.cursorBall(); });
})();
