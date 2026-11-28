/* CB Bakery, the counter line. One fixed stage; scroll only drives motion. Nothing fades: each scene's
   end builds the next one's start.
   The page is one line of giant serif words on a shared baseline: BAKERY, SALGADOS, SWEETS, FOOD.
   The letters are the counter. Their real pastries stand on the letter tops; names and prices hang
   under the baseline. Scroll moves the camera along the line.
   1 hero: their coxinha stands on BAKERY, breathing, leaning to the cursor; the letters under it give
   2 the line pans; the coxinha hops onto the G of SALGADOS; three more salgados drop onto their letters
   3 the line pans to SWEETS; three sweets drop
   4 the line pans to FOOD; the O's turn into two of their lunch plates
   5 peak: the page pushes into the chicken plate until it fills the screen; four labels pin to the food
   6 the plate steps aside; the kitchen list with prices sets in
   7 their room rolls up over the plate, the card arrives, the coxinha stands on the card's edge. Holds.
   ?p=0.3 jumps there. */
(() => {
  const $ = (s) => document.getElementById(s);
  const root = document.documentElement;
  const stage = $('stage'), bar = $('bar'), line = $('line');
  const words = [...line.querySelectorAll('.w')];
  const chars = words.map((w) => [...w.querySelectorAll('.ch')]);
  const items = [...line.querySelectorAll('.it')];
  const tags = Object.fromEntries([...line.querySelectorAll('.tag')].map((t) => [t.dataset.for, t]));
  const copies = [...line.querySelectorAll('.copy')];
  const cox = $('cox'), coxSh = $('coxSh'), plate = $('plate'), steak = $('steak');
  const labs = [...document.querySelectorAll('.lab')];
  const kitchen = $('kitchen'), rows = [...kitchen.querySelectorAll('li')], kH = kitchen.querySelector('h2'), quote = kitchen.querySelector('.quote');
  const room = $('room'), roomImg = room.querySelector('img'), card = $('card');
  const cta = $('cta'), slot = $('ctaSlot');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');

  // natural sizes of the cut images
  const AR = { cox: 795 / 1188, plate: 1456 / 1161, steak: 587 / 481 };
  // label targets on the plate photo, as fractions of the cut (lab/cuts.json "plate")
  const TGT = { rice: [0.30, 0.48], beans: [0.58, 0.72], chicken: [0.77, 0.45], salad: [0.60, 0.16] };
  const LAB_ORDER = ['rice', 'beans', 'chicken', 'salad'];

  const clamp = (v, a = 0, b = 1) => (v < a ? a : v > b ? b : v);
  const seg = (p, a, b) => clamp((p - a) / (b - a));
  const E3 = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const EO = (t) => 1 - Math.pow(1 - t, 3);
  const lerp = (a, b, t) => a + (b - a) * t;
  const r1 = (v) => Math.round(v * 10) / 10;
  const put = (el, k, v) => { const c = el._c || (el._c = {}); if (c[k] !== v) { c[k] = v; el.style[k] = v; } };
  const at = (el, x, y, s = 1, extra = '') => put(el, 'transform', `translate3d(${r1(x)}px,${r1(y)}px,0)${extra}${s !== 1 ? ` scale(${s.toFixed(4)})` : ''}`);
  const vis = (el, on) => put(el, 'visibility', on ? 'visible' : 'hidden');
  const rect = (a, b, t) => ({ x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t), w: lerp(a.w, b.w, t), h: lerp(a.h, b.h, t) });

  // the score. pans move the camera one word along the line
  const T = {
    pan1: [0.05, 0.125], drop1: [0.11, 0.19], pan2: [0.215, 0.285], drop2: [0.27, 0.34],
    pan3: [0.365, 0.42], plates: [0.425, 0.475], push: [0.495, 0.62], labs: [0.6, 0.685],
    list: [0.725, 0.78], rows: [0.755, 0.83], close: [0.855, 0.93], cta: [0.925, 0.975],
  };
  const DROPS = { catarina: 0, empadinha: 1, box: 2, quindim: 0, tortinha: 1, brigadeiro: 2 };

  let VW = 0, VH = 0, TOP = 66, mob = false, L = {};
  let p = 0, pT = 0, t0 = performance.now(), forced = null, running = false;
  let lean = { x: 0, y: 0 }, leanT = { x: 0, y: 0 };
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  const q = new URLSearchParams(location.search).get('p');
  if (q !== null && !isNaN(+q)) forced = clamp(+q);

  function capHeight(fs) {
    const c = document.createElement('canvas').getContext('2d');
    c.font = `800 ${fs}px "Playfair Display", Georgia, serif`;
    const m = c.measureText('H');
    return m.actualBoundingBoxAscent || fs * 0.708;
  }

  function layout() {
    [...stage.querySelectorAll('*')].forEach((el) => { el._c = {}; el.style.transform = ''; el.style.visibility = ''; el.style.clipPath = ''; });
    VW = root.clientWidth; VH = stage.clientHeight; mob = VW <= 760; TOP = bar.offsetHeight;
    const pad = mob ? 16 : Math.min(56, Math.max(24, VW * 0.035));
    L.pad = pad;

    // --- the counter: one font size for every word, sized so SALGADOS fills the width
    words.forEach((w) => { w.style.fontSize = '200px'; });
    const longest = Math.max(...words.map((w) => w.scrollWidth));
    let fs = (VW - pad * 2) * (mob ? 1 : 0.94) / longest * 200;
    fs = Math.min(fs, (VH - TOP) * (mob ? 0.2 : 0.3) / 0.708);
    words.forEach((w) => { w.style.fontSize = `${fs}px`; });
    L.fs = fs; L.cap = capHeight(fs);
    L.bl = words[0].querySelector('.bl').offsetTop;      // baseline inside the word box
    L.BY = TOP + (VH - TOP) * (mob ? 0.5 : 0.63);          // the baseline on screen
    L.capTop = L.BY - L.cap;
    L.ww = words.map((w) => w.scrollWidth);
    L.wx = words.map((w, i) => i * VW + (VW - L.ww[i]) / 2);
    L.lt = chars.map((cs, i) => cs.map((c) => ({ x: L.wx[i] + c.offsetLeft, w: c.offsetWidth })));
    words.forEach((w, i) => at(w, L.wx[i], L.BY - L.bl));
    [1, 2].forEach((i) => put(chars[3][i], 'transformOrigin', `50% ${r1(L.bl - L.cap / 2)}px`));   // the O's shrink about their own centre

    // --- pastries: each stands on its letters, centred over them
    const maxH = L.capTop - TOP - (mob ? 14 : 26);
    L.it = {};
    items.forEach((el) => {
      const wi = +el.dataset.w, a = +el.dataset.a, b = +el.dataset.b, img = el.querySelector('img');
      const ar = (img.naturalWidth || 400) / (img.naturalHeight || 300);
      const x0 = L.lt[wi][a].x, x1 = L.lt[wi][b].x + L.lt[wi][b].w;
      let w = (x1 - x0) * (mob ? 1.02 : 0.9), h = w / ar;
      if (h > maxH * 0.82) { h = maxH * 0.82; w = h * ar; }
      put(el, 'width', `${r1(w)}px`);
      L.it[el.dataset.k] = { x: (x0 + x1) / 2 - w / 2, y: L.capTop - h + h * 0.03, w, h, wi, a, b };
    });

    // --- the coxinha: big on BAKERY (between K and E), then smaller on the G of SALGADOS
    const K = L.lt[0][2], E = L.lt[0][3];
    const h0 = Math.min(maxH, mob ? VW * 0.95 / AR.cox * 0.55 : VH * 0.5);
    L.cox0 = { cx: (K.x + K.w + E.x) / 2, h: h0 };
    const G = L.lt[1][3];
    const h1 = Math.min(maxH * 0.86, G.w * (mob ? 1.35 : 1.18) / AR.cox);
    L.cox1 = { cx: G.x + G.w / 2, h: h1 };
    put(cox, 'width', `${r1(h0 * AR.cox)}px`); put(cox, 'height', `${r1(h0)}px`);
    put(coxSh, 'width', `${r1(h0 * AR.cox * 0.86)}px`);

    // --- FOOD: the O's become plates. F, plate, plate, D, spaced so the plates fit
    const F = L.lt[3][0], O1 = L.lt[3][1], O2 = L.lt[3][2], D = L.lt[3][3];
    const ph = L.cap * 1.12, p1w = ph * AR.plate, p2w = ph * AR.steak, gap = L.cap * 0.08;
    const total = F.w + p1w + p2w + D.w + gap * 3;
    const fx = 3 * VW + (VW - total) / 2;
    L.food = {
      F: fx - F.x, D: fx + F.w + p1w + p2w + gap * 3 - D.x,
      p1: { x: fx + F.w + gap, y: L.BY - ph + L.cap * 0.04, w: p1w, h: ph, from: O1 },
      p2: { x: fx + F.w + p1w + gap * 2, y: L.BY - ph + L.cap * 0.04, w: p2w, h: ph, from: O2 },
    };

    // --- the peak: the chicken plate fills the screen
    if (mob) { const w = VW * 1.06; L.peak = { x: (VW - w) / 2, y: TOP + (VH - TOP - w / AR.plate) / 2, w, h: w / AR.plate }; }
    else {
      let h = (VH - TOP) * 0.9, w = h * AR.plate;
      if (w > VW * 0.9) { w = VW * 0.9; h = w / AR.plate; }
      L.peak = { x: (VW - w) / 2, y: TOP + (VH - TOP - h) / 2 + 6, w, h };
    }
    put(plate, 'width', `${r1(L.peak.w)}px`); put(plate, 'height', `${r1(L.peak.h)}px`);
    put(steak, 'width', `${r1(L.food.p2.w)}px`); put(steak, 'height', `${r1(L.food.p2.h)}px`);
    labs.forEach((el) => {
      const k = el.dataset.l; el.classList.remove('down', 'right');
      el._w = el.offsetWidth; el._h = el.offsetHeight;
      const stem = mob ? 24 : 40; el.style.setProperty('--stem', `${stem}px`);
      const sx = L.peak.x + TGT[k][0] * L.peak.w, sy = L.peak.y + TGT[k][1] * L.peak.h;
      el._down = sy - stem - el._h < TOP + 6;
      if (el._down) el.classList.add('down');
      el._right = sx - 17 + el._w > VW - pad;
      if (el._right) el.classList.add('right');
      el._ox = el._right ? el._w - 17 : 17; el._oy = el._down ? -stem : el._h + stem;
      put(el, 'transformOrigin', `${el._ox}px ${el._oy}px`);
    });

    // --- tags under the baseline, under their letters
    const tagY = L.BY + L.cap * (mob ? 0.12 : 0.1) + (mob ? 6 : 10);
    const tagAt = (k, cx, w) => {
      const t = tags[k]; if (!t) return;
      put(t, 'width', mob && w ? `${r1(w)}px` : ''); put(t, 'whiteSpace', mob && w ? 'normal' : '');
      t._x = cx - t.offsetWidth / 2; t._y = tagY; t._h = t.offsetHeight;
    };
    const spanW = (wi, a, b) => L.lt[wi][b].x + L.lt[wi][b].w - L.lt[wi][a].x - 4;
    Object.entries(L.it).forEach(([k, r]) => tagAt(k, r.x + r.w / 2, spanW(r.wi, r.a, r.b)));
    tagAt('coxinha', L.cox1.cx, L.lt[1][3].w + 6);
    tagAt('plate', L.food.p1.x + L.food.p1.w / 2, L.food.p1.w - 4); tagAt('steak', L.food.p2.x + L.food.p2.w / 2, L.food.p2.w - 4);
    L.tagBottom = tagY + Math.max(...Object.values(tags).map((t) => t._h || 0));

    // --- copy in the band under the counter, travelling with its word
    copies.forEach((el) => {
      const i = +el.dataset.w; el._h = el.offsetHeight; el._w = el.offsetWidth;
      let y = Math.min(L.tagBottom + (mob ? 16 : 26), VH - el._h - (mob ? 14 : 30));
      let x = i * VW + pad;
      if (el.classList.contains('hero-r')) { x = mob ? pad : VW - pad - el._w; }
      if (el.classList.contains('hero-l') || el.classList.contains('hero-r')) {
        y = mob ? L.BY + 18 + (el.classList.contains('hero-r') ? copies[0].offsetHeight + 12 : 0) : VH - el._h - 30;
        if (!mob) y = Math.max(y, L.BY + 26);
      }
      el._x = x; el._y = y;
    });

    // --- the kitchen list beside the plate
    if (mob) {
      const w = VW * 0.6;
      L.lp = { x: (VW - w) / 2, y: TOP + 6, w, h: w / AR.plate };
      put(kitchen, 'width', `${VW - pad * 2}px`);
      L.kx = pad; L.ky = L.lp.y + L.lp.h + 10;
    } else {
      let h = (VH - TOP) * 0.66, w = h * AR.plate;
      if (w > VW * 0.42) { w = VW * 0.42; h = w / AR.plate; }
      L.lp = { x: VW - pad - w - VW * 0.02, y: TOP + (VH - TOP - h) / 2, w, h };
      put(kitchen, 'width', `${Math.min(560, L.lp.x - pad - VW * 0.05)}px`);
      L.kx = pad; L.ky = Math.max(TOP + 10, (VH - kitchen.offsetHeight) / 2 + TOP / 3);
    }

    // --- the close: their room, the card; the coxinha stands on the card's top edge
    const cardW = mob ? VW - pad * 2 : Math.min(450, VW * 0.4);
    put(card, 'width', `${cardW}px`); card.classList.remove('compact');
    L.cardH = card.offsetHeight;
    if (mob) {
      L.room = { x: pad, y: TOP + 6, w: VW - pad * 2, h: Math.max(110, VH * 0.22) };
      const coxH = 74, avail = VH - (L.room.y + L.room.h + 12 + coxH) - 10;
      if (L.cardH > avail) { card.classList.add('compact'); L.cardH = card.offsetHeight; }
      L.cardS = Math.min(1, avail / L.cardH);
      L.card = { x: pad, y: L.room.y + L.room.h + 12 + coxH };
      L.cox2 = { cx: L.card.x + cardW * L.cardS - 60, h: coxH };
    } else {
      const coxH = Math.min(150, VH * 0.17), avail = VH - TOP - 30 - coxH;
      if (L.cardH > avail) { card.classList.add('compact'); L.cardH = card.offsetHeight; }
      L.cardS = Math.min(1, avail / L.cardH);
      const ch = L.cardH * L.cardS, groupTop = TOP + 12 + Math.max(0, (VH - TOP - 24 - ch - coxH) / 2);
      L.card = { x: VW - pad - cardW * L.cardS - VW * 0.04, y: groupTop + coxH };
      const rh = VH - TOP - 44;
      L.room = { x: Math.max(pad, L.card.x - VW * 0.05 - rh * 0.78), y: TOP + 18, w: Math.min(rh * 0.78, L.card.x - VW * 0.05 - pad), h: rh };
      L.cox2 = { cx: L.card.x + cardW * L.cardS * 0.72, h: coxH };
    }
    L.cardH *= L.cardS;
    // the one CTA: its home in the bar, and its slot in the card
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

  // a letter gives a little when something lands on it: a short dip that springs back
  const bump = (q) => (q <= 0 || q >= 1 ? 0 : Math.sin(q * Math.PI) * (1 - q * 0.4));

  function draw(p, time) {
    const { pad } = L, still = reduced.matches;
    const e1 = E3(seg(p, ...T.pan1)), e2 = E3(seg(p, ...T.pan2)), e3 = E3(seg(p, ...T.pan3));
    const cam = e1 + e2 + e3;
    const pl = E3(seg(p, ...T.plates)), u = E3(seg(p, ...T.push)), k = E3(seg(p, ...T.list)), c = E3(seg(p, ...T.close));
    const camX = -cam * VW;
    at(line, camX, 0);
    const breath = still ? 0 : Math.sin(time * 1.5);
    const dips = {};   // word:letter -> px
    const dip = (wi, li, v) => { const key = wi + ':' + li; dips[key] = (dips[key] || 0) + v; };

    // --- the coxinha: hero on BAKERY, hops onto SALGADOS' G, then rides with the line; drops onto the card at the close
    const H0 = L.cox0.h, ctop = L.capTop;
    let cx, h, bottom, onScreen = true, leanOn = false;
    if (c > 0.35) {
      const cc = E3(seg(c, 0.35, 1));
      h = L.cox2.h; cx = L.cox2.cx + (1 - c) * VW * 0.7;
      bottom = lerp(-20, L.card.y + 4, cc);
      leanOn = cc >= 1;
    } else if (e1 < 1) {
      cx = lerp(L.cox0.cx, L.cox1.cx, e1) + camX;   // line x, carried by the camera
      h = lerp(H0, L.cox1.h, e1);
      bottom = ctop + h * 0.02 - Math.sin(e1 * Math.PI) * VH * 0.14;
      leanOn = e1 === 0;
      if (e1 === 0) { const g = breath * 1.2; dip(0, 2, g + 1.2); dip(0, 3, g + 1.2); }
      if (e1 > 0.94) dip(1, 3, bump(seg(e1, 0.94, 1)) * 6);
    } else {
      h = L.cox1.h; cx = L.cox1.cx + camX; bottom = ctop + h * 0.02;
      onScreen = cx > -h && cx < VW + h;
    }
    const bs = e1 === 0 && !still ? 1 + breath * 0.014 : 1;
    const hh = h * bs, ww = hh * AR.cox;
    let lean3 = '';
    if (leanOn && !still && !mob) lean3 = ` perspective(1200px) rotateX(${(-lean.y * 8).toFixed(2)}deg) rotateY(${(lean.x * 11).toFixed(2)}deg)`;
    put(cox, 'transformOrigin', '50% 100%');
    put(cox, 'transform', `translate3d(${r1(cx - H0 * AR.cox / 2)}px,${r1(bottom - H0)}px,0)${lean3} scale(${(hh / H0).toFixed(4)})`);
    const shOn = onScreen && (e1 === 0 || e1 === 1 || c > 0.35);
    const shW = ww * 0.86;
    at(coxSh, cx - shW / 2, bottom - 9, 1);
    put(coxSh, 'width', `${r1(shW)}px`);
    vis(coxSh, shOn); vis(cox, onScreen);

    // --- pastries drop onto their letters, one after another; the letters give as they land
    items.forEach((el) => {
      const key = el.dataset.k, r = L.it[key], win = r.wi === 1 ? T.drop1 : T.drop2;
      const n = DROPS[key], span = (win[1] - win[0]), d0 = win[0] + n * span * 0.26, d1 = d0 + span * 0.42;
      const dq = EO(seg(p, d0, d1));
      const y = lerp(-r.h - 40 - (r.y + L.BY) * 0.2, r.y, dq);
      at(el, r.x, y);
      const land = seg(p, d1, d1 + 0.02);
      if (land > 0) for (let li = r.a; li <= r.b; li++) dip(r.wi, li, bump(land) * 7);
      const sx = r.x + camX;
      vis(el, dq > 0 && sx > -r.w - 20 && sx < VW + 20);
      const t = tags[key];
      if (t) { at(t, t._x, t._y); put(t, 'clipPath', `inset(0 0 ${r1((1 - E3(clamp(land * 1.6))) * 100)}% 0)`); vis(t, land > 0 && sx > -300 && sx < VW + 300); }
    });
    { const t = tags.coxinha, land = e1 >= 1 ? 1 : 0; at(t, t._x, t._y); put(t, 'clipPath', `inset(0 0 ${r1((1 - E3(seg(p, T.pan1[1], T.pan1[1] + 0.03))) * 100)}% 0)`); vis(t, land > 0); }

    // --- FOOD: F and D step apart, the O's shrink as the plates grow out of them. The push throws them off
    const fc = chars[3];
    const outL = u * VW * 0.75, outR = u * VW * 0.85, sink = u * VH * 0.12;
    put(fc[0], 'transform', `translate3d(${r1(L.food.F * pl - outL)}px,${r1(sink)}px,0)`);
    put(fc[3], 'transform', `translate3d(${r1(L.food.D * pl + outR)}px,${r1(sink)}px,0)`);
    [1, 2].forEach((i) => put(fc[i], 'transform', `scale(${Math.max(0.001, 1 - pl).toFixed(3)})`));
    const P1 = L.food.p1, P2 = L.food.p2;
    const grow = (P, s) => {
      const fx = P.from.x + P.from.w / 2, cxp = lerp(fx, P.x + P.w / 2, s), cyp = lerp(L.BY - L.cap / 2, P.y + P.h / 2, s);
      return { x: cxp - P.w * s / 2, y: cyp - P.h * s / 2, w: P.w * s, h: P.h * s };
    };
    // steak plate: grows in, rides out right on the push
    const S2 = grow(P2, pl);
    at(steak, S2.x + camX + outR, S2.y + sink, Math.max(0.001, pl));
    vis(steak, pl > 0 && u < 1);
    // chicken plate: FOOD > peak > beside the list > under the room
    const S1 = grow(P1, pl), foodR = { x: S1.x + camX, y: S1.y, w: S1.w, h: S1.h };
    let R = u > 0 ? rect(foodR, L.peak, u) : foodR;
    if (k > 0) R = rect(L.peak, L.lp, k);
    const pOut = c * VW * 0.6;
    at(plate, R.x + pOut, R.y, Math.max(0.001, R.w / L.peak.w));
    vis(plate, pl > 0 && c < 1);
    ['plate', 'steak'].forEach((key) => {
      const t = tags[key];
      at(t, t._x + (key === 'plate' ? -outL * 0 : outR), t._y + sink * 2.5);
      put(t, 'clipPath', `inset(0 0 ${r1((1 - E3(seg(p, T.plates[1] - 0.01, T.plates[1] + 0.03))) * 100)}% 0)`);
      vis(t, pl > 0.6 && u < 0.3);
    });

    // --- letters: dips from landings, everything else still
    chars.forEach((cs, wi) => cs.forEach((ch, li) => {
      if (wi === 3) return;
      const d = dips[wi + ':' + li] || 0;
      put(ch, 'transform', d ? `translateY(${r1(d)}px)` : '');
    }));
    words.forEach((w, i) => { const sx = L.wx[i] + camX; vis(w, sx < VW + 20 && sx + L.ww[i] > -VW * 0.9); });

    // --- copy travels with its word; FOOD's copy sinks away on the push
    copies.forEach((el) => {
      const i = +el.dataset.w;
      at(el, el._x - (i === 3 ? u * VW * 0.9 : 0), el._y);
      const sx = el._x + camX; vis(el, sx < VW + 20 && sx + el._w > -20 && !(i === 3 && u >= 1));
    });

    // --- the peak: labels pin to the food one after another
    const lw = seg(p, ...T.labs);
    LAB_ORDER.forEach((key, i) => {
      const el = labs.find((l) => l.dataset.l === key);
      const r = E3(clamp(lw * 4 - i * 0.8)) * (1 - E3(clamp(k * 3)));
      const sx = L.peak.x + TGT[key][0] * L.peak.w, sy = L.peak.y + TGT[key][1] * L.peak.h;
      at(el, sx - el._ox, sy - el._oy, Math.max(0.001, r));
      vis(el, r > 0.001);
    });

    // --- the kitchen list sets in beside the plate; leaves left as the room rolls up
    const rk = seg(p, ...T.rows);
    at(kitchen, L.kx - c * VW, L.ky);
    put(kH, 'transform', `translateX(${r1(-(1 - E3(clamp(rk * 3))) * VW * 0.7)}px)`);
    rows.forEach((row, i) => { const rr = E3(clamp(rk * 2.4 - 0.25 - i * 0.2)); put(row, 'transform', `translateX(${r1(-(1 - rr) * VW * 0.75)}px)`); });
    put(quote, 'transform', `translateX(${r1(-(1 - E3(clamp(rk * 2 - 1))) * VW * 0.75)}px)`);
    vis(kitchen, rk > 0 && c < 1);

    // --- close: the room rolls up in a frame that grows out of the plate's spot; the card comes in
    const RR = rect(L.lp, L.room, c);
    put(room, 'width', `${r1(RR.w)}px`); put(room, 'height', `${r1(RR.h)}px`);
    at(room, RR.x, RR.y);
    put(room, 'clipPath', c >= 1 ? 'none' : `inset(${r1((1 - c) * 100)}% 0 -80px 0 round 24px)`);
    vis(room, c > 0);
    const cardX = L.card.x + (1 - c) * VW * 0.7;
    at(card, cardX, L.card.y, L.cardS);
    vis(card, c > 0);

    // the one CTA leaves the bar's corner and lands in the card's slot once the card is in
    const tk = E3(seg(p, ...T.cta));
    if (tk <= 0) {
      if (cta.classList.contains('travel')) { cta.classList.remove('travel'); ['left', 'top', 'width', 'height', 'fontSize'].forEach((x) => { cta.style[x] = ''; }); cta._c = {}; }
    } else {
      if (!cta.classList.contains('travel')) cta.classList.add('travel');
      const h0 = L.ctaHome, sx = cardX + L.slot.dx, sy = L.card.y + L.slot.dy;
      const arc = Math.sin(tk * Math.PI) * Math.min(90, VW * 0.06);
      put(cta, 'left', `${r1(lerp(h0.x, sx, tk) + arc)}px`); put(cta, 'top', `${r1(lerp(h0.y, sy, tk))}px`);
      put(cta, 'width', `${r1(lerp(h0.w, L.slot.w, tk))}px`); put(cta, 'height', `${r1(lerp(h0.h, L.slot.h, tk))}px`);
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

  // open now, from their hours (Mon to Sat 5am to 9:30pm, Sun 7am to 7pm), Worcester time
  (function openNow() {
    const el = $('openNow');
    try {
      const f = new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', weekday: 'short', hour: 'numeric', minute: 'numeric', hour12: false });
      const x = Object.fromEntries(f.formatToParts(new Date()).map((o) => [o.type, o.value]));
      const h = (+x.hour % 24) + +x.minute / 60, sun = x.weekday === 'Sun';
      const [o, cl, cls] = sun ? [7, 19, '7pm'] : [5, 21.5, '9:30pm'];
      el.textContent = h >= o && h < cl ? `Open now until ${cls}` : h < o ? `Opens today at ${sun ? '7am' : '5am'}` : 'Closed now. Opens at 5am';
      if (h >= cl && x.weekday === 'Sat') el.textContent = 'Closed now. Opens Sunday 7am';
    } catch (e) { /* keep the static line */ }
  })();

  addEventListener('pointermove', (e) => { if (e.pointerType === 'mouse') { leanT.x = (e.clientX / innerWidth - 0.5) * 2; leanT.y = (e.clientY / innerHeight - 0.5) * 2; } }, { passive: true });
  let rz = 0;
  addEventListener('resize', () => { cancelAnimationFrame(rz); rz = requestAnimationFrame(layout); });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(layout);
  addEventListener('load', layout);
  start();
  // decode every photo early so no scene ever shows an empty frame
  stage.querySelectorAll('img').forEach((im) => { im.loading = 'eager'; if (im.decode) im.decode().catch(() => {}); });
  addEventListener('DOMContentLoaded', () => { if (window.LiquidGlass) LiquidGlass.cursorBall(); });
})();
