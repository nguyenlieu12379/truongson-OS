/* Cantinho Brasileiro, the table. One fixed stage; scroll only drives motion. Nothing fades: each scene's end
   builds the next one's start.
   1 hero: their prato feito centred in front of a navy CANTINHO, breathing, leaning to the cursor; the letters
     it covers sway
   2 peak: the camera pulls back. The plate is a detail of their real table photo (same pixels), so the photo
     opens around it and the stage dollies out until it is one of six plates; four labels pin to the food
   3 the table carries off left and the hot line comes in behind it: six real buffet trays pan under the scroll
   4 the feijoada tray grows into their Saturday plate; the week's dishes set in beside it
   5 their green sign rolls up over it, the plate comes back on its corner, the card arrives. Holds.
   ?p=0.3 jumps there. */
(() => {
  const $ = (s) => document.getElementById(s);
  const root = document.documentElement;
  const stage = $('stage'), bar = $('bar');
  const E = {
    word: $('word'), script: $('script'), heroL: $('heroL'), heroR: $('heroR'), pf: $('pf'), sh: $('pfShadow'),
    table: $('table'), tableCopy: $('tableCopy'), line: $('line'), sat: $('sat'), week: $('week'), card: $('card'),
  };
  const cta = $('cta'), slot = $('ctaSlot');
  const chars = [...E.word.querySelectorAll('.ch')];
  const labs = [...document.querySelectorAll('.lab')];
  const trays = [...document.querySelectorAll('.tray')];
  const rows = [...E.week.querySelectorAll('li')];
  const satT = E.sat.querySelector('.sat-t'), satF = E.sat.querySelector('.sat-f'), satS = E.sat.querySelector('.sat-s');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');

  // the table photo and where the prato feito sits in it (lab/cuts.json)
  const PH = { w: 2560, h: 1440 }, PF = { x: 867, y: 277, s: 796 }, PFC = { x: 1265, y: 675 }, SHADOW_PAD = 60;
  // label targets on the food, photo pixels
  const TGT = { beans: [1085, 455], meat: [1985, 985], side: [470, 1095], salad: [2070, 335] };

  const clamp = (v, a = 0, b = 1) => (v < a ? a : v > b ? b : v);
  const seg = (p, a, b) => clamp((p - a) / (b - a));
  const E3 = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const lerp = (a, b, t) => a + (b - a) * t;
  const r1 = (v) => Math.round(v * 10) / 10;
  const put = (el, k, v) => { const c = el._c || (el._c = {}); if (c[k] !== v) { c[k] = v; el.style[k] = v; } };
  const at = (el, x, y, s = 1, extra = '') => put(el, 'transform', `translate3d(${r1(x)}px,${r1(y)}px,0)${extra}${s !== 1 ? ` scale(${s.toFixed(4)})` : ''}`);
  const vis = (el, on) => put(el, 'visibility', on ? 'visible' : 'hidden');
  const rect = (a, b, t) => ({ x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t), w: lerp(a.w, b.w, t), h: lerp(a.h, b.h, t) });

  const T = {
    pull: [0.05, 0.25], labs: [0.23, 0.35], toLine: [0.39, 0.47], pan: [0.47, 0.61],
    grow: [0.61, 0.69], week: [0.66, 0.77], toClose: [0.80, 0.9],
  };
  const LAB_ORDER = ['beans', 'meat', 'side', 'salad'];

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

    // --- hero
    E.word.style.fontSize = '200px';
    const ww = E.word.scrollWidth;
    const fs = mob ? (VW - pad * 2) / ww * 200 : Math.min((VW - pad * 2) / ww * 200, VH * 0.36);
    E.word.style.fontSize = `${fs}px`;
    L.wordW = E.word.scrollWidth; L.wordH = E.word.offsetHeight;
    L.chx = chars.map((c) => c.offsetLeft + c.offsetWidth / 2);
    E.script.style.fontSize = `${Math.max(26, fs * 0.3)}px`;
    L.scriptW = E.script.offsetWidth; L.scriptH = E.script.offsetHeight;
    L.hlH = E.heroL.offsetHeight; L.hrH = E.heroR.offsetHeight; L.hrW = E.heroR.offsetWidth;
    if (mob) {
      L.word = { x: (VW - L.wordW) / 2, y: TOP + 6 };
      L.s0 = Math.min(VW * 0.84, VH * 0.4);
      L.c0 = { x: VW / 2, y: L.word.y + L.wordH + L.scriptH + 8 + L.s0 / 2 };
      L.script = { x: VW - pad - L.scriptW, y: L.word.y + L.wordH + 2 };
      L.hl = { x: pad, y: L.c0.y + L.s0 / 2 + 18 };
      L.hr = { x: pad, y: L.hl.y + L.hlH + 14 };
    } else {
      L.s0 = Math.min(VH * 0.6, VW * 0.35);
      L.c0 = { x: VW / 2, y: TOP + (VH - TOP) * 0.46 };
      L.word = { x: (VW - L.wordW) / 2, y: L.c0.y - L.wordH * 0.55 };
      L.script = { x: L.word.x + L.wordW - L.scriptW, y: L.word.y + L.wordH + 4 };
      L.hl = { x: pad, y: VH - L.hlH - 30 };
      L.hr = { x: VW - pad - L.hrW, y: VH - L.hrH - 30 };
    }

    // --- the table, pulled back
    L.copyW = mob ? VW - pad * 2 : Math.min(400, VW * 0.32);
    put(E.tableCopy, 'width', `${L.copyW}px`);
    L.copyH = E.tableCopy.offsetHeight;
    if (mob) {
      L.k1 = VW * 2.05 / PH.w;
      L.oy1 = Math.max(TOP + 10 + L.copyH + 16, (VH - PH.h * L.k1) / 2 + 40);
      L.ox1 = VW / 2 - PFC.x * L.k1;
      L.copy = { x: pad, y: TOP + 8 };
    } else {
      L.k1 = Math.max(VW / PH.w, VH / PH.h);
      L.ox1 = (VW - PH.w * L.k1) / 2; L.oy1 = (VH - PH.h * L.k1) / 2;
      L.copy = { x: pad, y: TOP + 14 };
    }
    L.k0 = L.s0 / PF.s;
    // labels: measure, decide stem direction and side
    labs.forEach((el) => {
      const k = el.dataset.l; el.classList.remove('down', 'right');
      const [tx, ty] = TGT[k];
      el._w = el.offsetWidth; el._h = el.offsetHeight;
      const stem = mob ? 26 : 44; el.style.setProperty('--stem', `${stem}px`); el._stem = stem;
      const sy = L.oy1 + ty * L.k1;
      el._down = sy - stem - el._h < (mob ? L.oy1 + 4 : TOP + 12) || (!mob && k === 'beans' && false);
      if (el._down) el.classList.add('down');
      const sx = (mob ? 0 : L.ox1) + tx * L.k1;
      el._right = !mob && sx - 17 + el._w > VW - pad;
      if (el._right) el.classList.add('right');
      const ox = el._right ? el._w - 17 : 17, oy = el._down ? -stem : el._h + stem;
      put(el, 'transformOrigin', `${ox}px ${oy}px`);
      el._ox = ox; el._oy = oy;
    });

    // --- the hot line
    L.lineW = mob ? VW - pad * 2 : Math.min(520, VW * 0.44);
    put(E.line, 'width', `${L.lineW}px`);
    L.lineH = E.line.offsetHeight;
    L.lineXY = { x: pad, y: TOP + (mob ? 10 : 26) };
    L.tH = mob ? Math.min(VH * 0.34, (VW - pad * 2) * 0.72) : Math.min(VH * 0.44, 400);
    L.tW = L.tH * 0.94; L.gap = mob ? 14 : 26;
    L.rowY = mob ? L.lineXY.y + L.lineH + 22 : Math.max(L.lineXY.y + L.lineH + 34, (VH - L.tH - 50) / 2 + 40);
    trays.forEach((t) => { put(t, 'width', `${L.tW}px`); put(t.querySelector('.tf'), 'height', `${L.tH}px`); });
    L.rowX0 = mob ? pad : VW * 0.36;
    L.panLen = L.rowX0 + (trays.length - 1) * (L.tW + L.gap) - pad;

    // --- Saturday frame and the week beside it
    if (mob) {
      L.sat = { x: pad, y: TOP + 8, w: VW - pad * 2, h: VH * 0.3 };
      L.satC = { x: pad, y: TOP + 8, w: VW - pad * 2, h: VH * 0.24 };
    } else {
      const h = VH - TOP - 44, w = Math.min(VW * 0.42, h * 0.86);
      L.sat = { x: pad, y: TOP + 18, w, h };
      L.satC = L.sat;
    }
    L.weekW = mob ? VW - pad * 2 : Math.min(560, VW - L.sat.x - L.sat.w - pad * 2 - VW * 0.04);
    put(E.week, 'width', `${L.weekW}px`);
    L.weekH = E.week.offsetHeight;
    L.weekXY = mob ? { x: pad, y: L.sat.y + L.sat.h + 18 } : { x: L.sat.x + L.sat.w + Math.max(pad, VW * 0.05), y: Math.max(TOP + 10, (VH - L.weekH) / 2 + 10) };

    // --- close
    L.cardW = mob ? VW - pad * 2 : Math.min(450, L.weekW);
    put(E.card, 'width', `${L.cardW}px`);
    // the card must fit the screen: tighten it, shorten the sign, then (last resort) scale it
    E.card.classList.remove('compact');
    L.cardH = E.card.offsetHeight;
    const TUCK = 26;
    let signH = Math.min(170, VH * 0.2);
    const avail = mob ? VH - (L.satC.y + L.satC.h + 16) - 12 : VH - TOP - 24;
    const need = () => L.cardH + (mob ? 0 : signH - TUCK);
    if (need() > avail) { E.card.classList.add('compact'); L.cardH = E.card.offsetHeight; }
    if (!mob) signH = Math.max(84, Math.min(signH, avail - L.cardH + TUCK));
    L.cardS = Math.min(1, (avail - (mob ? 0 : signH - TUCK)) / L.cardH);
    const cw = L.cardW * L.cardS, ch = L.cardH * L.cardS;
    if (mob) L.cardXY = { x: pad, y: Math.min(L.satC.y + L.satC.h + 16, VH - ch - 12) };
    else {
      // desktop close: their sign sits on top of the card as its header, the card tucks over its lower edge
      const groupH = signH - TUCK + ch, top = TOP + 12 + Math.max(0, (VH - TOP - 24 - groupH) / 2);
      L.cardXY = { x: VW - pad - cw - VW * 0.03, y: top + signH - TUCK };
      L.satC = { x: L.cardXY.x, y: top, w: cw, h: signH };
    }
    L.cardH = ch;
    // the one CTA: its home in the bar, and its slot in the card
    cta.classList.remove('travel'); ['left', 'top', 'width', 'height', 'fontSize'].forEach((k) => { cta.style[k] = ''; }); cta._c = {};
    const hr = cta.getBoundingClientRect();
    L.ctaHome = { x: hr.left, y: hr.top, w: hr.width, h: hr.height };
    L.slot = { dx: slot.offsetLeft * L.cardS, dy: slot.offsetTop * L.cardS, w: slot.offsetWidth * L.cardS, h: slot.offsetHeight * L.cardS };
    // phone close: the plate is served under the card, in the space left at the bottom
    const below = VH - (L.cardXY.y + L.cardH) - 18;
    L.s4 = mob ? (below < 80 ? -1 : Math.min(VW * 0.4, below)) : 0;
    L.c4 = mob ? { x: VW / 2, y: Math.min(VH - L.s4 / 2 - 8, L.cardXY.y + L.cardH + 10 + L.s4 / 2) } : { x: 0, y: 0 };
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

  function draw(p, time) {
    const { pad } = L, still = reduced.matches;
    const u = E3(seg(p, ...T.pull)), e = E3(seg(p, ...T.toLine)), pan = seg(p, ...T.pan), g = E3(seg(p, ...T.grow)), c = E3(seg(p, ...T.toClose));
    const panE = pan < 0.5 ? 2 * pan * pan + pan * 0 : pan;   // eased start, linear run
    const breathe = still ? 1 : 1 + Math.sin(time * 1.5) * 0.014;

    // --- the camera: table photo scale and offset
    const k = Math.exp(lerp(Math.log(L.k0), Math.log(L.k1), u));
    const cx = lerp(L.c0.x, L.ox1 + PFC.x * L.k1, u), cy = lerp(L.c0.y, L.oy1 + PFC.y * L.k1, u);
    let ox = cx - PFC.x * k, oy = cy - PFC.y * k;
    // phone: after the pull-back the camera pans the table, left plates first, then right
    if (mob && u >= 1) {
      const lp = seg(p, T.labs[0], T.toLine[0]);
      const left = 0, right = VW - PH.w * L.k1, mid = L.ox1;
      ox = lp < 0.25 ? lerp(mid, left, E3(lp / 0.25)) : lerp(left, right, E3((lp - 0.25) / 0.75));
    }
    let carry = -e * VW * 1.08;   // the table carries off left, uncovering the hot line
    const back = !mob && c > 0;    // and slides back in under the close
    if (back) { ox = L.ox1; oy = L.oy1; carry = -(1 - c) * VW * 1.08; }
    const tableOn = (u > 0 && e < 1) || back;
    const ins = (1 - u);
    put(E.table, 'clipPath', u >= 1 ? 'none' : `inset(${r1(PF.y * ins)}px ${r1((PH.w - PF.x - PF.s) * ins)}px ${r1((PH.h - PF.y - PF.s) * ins)}px ${r1(PF.x * ins)}px round ${r1(70 * ins + 4)}px)`);
    at(E.table, ox + carry, oy, k);
    vis(E.table, tableOn);

    // --- the plate: the hero, the pull-back (same pixels as the photo), then home on the close
    let P = null, lean3 = '';
    if (u < 1) P = { x: ox + PF.x * k, y: oy + PF.y * k, s: PF.s * k * (u === 0 ? breathe : 1) };
    if (c > 0 && mob) {
      const s = L.s4 * (c >= 1 ? breathe : 1);
      P = { x: L.c4.x - s / 2, y: lerp(VH + 40, L.c4.y - s / 2, c), s };
    } else if (back) {
      // home: the plate rides in with the table and sits in its own spot, breathing
      const s = PF.s * L.k1, b2 = c >= 1 ? breathe : 1;
      P = { x: L.ox1 + carry + PF.x * L.k1 - s * (b2 - 1) / 2, y: L.oy1 + PF.y * L.k1 - s * (b2 - 1) / 2, s: s * b2 };
    }
    const leanOn = !still && !mob && (u === 0 || c >= 1);
    if (leanOn) lean3 = ` perspective(1200px) rotateX(${(-lean.y * 8).toFixed(2)}deg) rotateY(${(lean.x * 11).toFixed(2)}deg)`;
    if (P) {
      const sc = P.s / PF.s, half = P.s / 2;
      put(E.pf, 'transform', `translate3d(${r1(P.x + half)}px,${r1(P.y + half)}px,0)${lean3} scale(${sc.toFixed(4)}) translate(-${PF.s / 2}px,-${PF.s / 2}px)`);
      const shOn = u < 0.7 || (c > 0 && mob && L.s4 > 0);
      put(E.sh, 'transform', `translate3d(${r1(P.x + half)}px,${r1(P.y + half)}px,0) scale(${sc.toFixed(4)}) translate(-${PF.s / 2 + SHADOW_PAD}px,-${PF.s / 2 + SHADOW_PAD}px)`);
      vis(E.sh, shOn);
    } else vis(E.sh, false);
    vis(E.pf, !!P && !(mob && c > 0 && L.s4 < 0));
    bar.classList.toggle('on-photo', (tableOn && u > 0.8 && !mob && e < 0.6) || (back && c > 0.4));

    // --- hero type: the photo grows over it; on the phone it steps aside
    const heroOn = u < 1 || mob && u < 1;
    const wy = L.word.y - (mob ? u * (L.word.y + L.wordH + 20) : 0);
    at(E.word, L.word.x, wy);
    at(E.script, L.script.x, L.script.y - (mob ? u * VH * 0.5 : 0));
    vis(E.word, heroOn); vis(E.script, heroOn);
    if (u === 0 && !still && P) {
      const pl = P.x, pr = P.x + P.s;
      chars.forEach((ch, i) => {
        const x = L.word.x + L.chx[i];
        put(ch, 'transform', x > pl && x < pr ? `translateY(${(Math.sin(time * 2.2 + i * 0.8) * L.wordH * 0.03).toFixed(1)}px)` : '');
      });
    }
    at(E.heroL, L.hl.x, L.hl.y + u * VH * 0.6);
    at(E.heroR, L.hr.x, L.hr.y + u * VH * 0.6);
    vis(E.heroL, u < 1); vis(E.heroR, u < 1);

    // --- labels pin to the food, one after another; the table copy slides in with them
    const lw = seg(p, ...T.labs);
    LAB_ORDER.forEach((key, i) => {
      const el = labs.find((l) => l.dataset.l === key);
      const r = E3(clamp(lw * 4 - i * 0.8));
      const [tx, ty] = TGT[key];
      const sx = ox + carry + tx * L.k1, sy = oy + ty * L.k1;
      at(el, sx - el._ox, sy - el._oy, Math.max(0.001, r));
      vis(el, r > 0 && tableOn && e < 1 && u >= 1 && sx > -40 && sx < VW + 40);
    });
    const cr = E3(clamp(lw * 3));
    at(E.tableCopy, L.copy.x - (1 - cr) * (L.copyW + 40) + carry, L.copy.y);
    vis(E.tableCopy, cr > 0 && e < 1);

    // --- the hot line: copy and trays come in from the right behind the table, then pan
    const rowShift = -panE * L.panLen;
    const lineX = L.lineXY.x - g * VW;
    at(E.line, lineX, L.lineXY.y);
    vis(E.line, e > 0 && g < 1);
    trays.forEach((t, i) => {
      const last = i === trays.length - 1;
      const x = L.rowX0 + i * (L.tW + L.gap) + rowShift - (last ? 0 : g * VW);
      at(t, x, L.rowY);
      vis(t, e > 0 && x < VW + 10 && x > -L.tW - 10 && !(last && g > 0));
    });

    // --- Saturday: the feijoada tray grows into their plate photo; the storefront rolls up over it on the close
    const from = { x: L.rowX0 + (trays.length - 1) * (L.tW + L.gap) - L.panLen, y: L.rowY, w: L.tW, h: L.tH };
    const R = c > 0 ? rect(L.sat, L.satC, c) : rect(from, L.sat, g);
    put(E.sat, 'width', `${r1(R.w)}px`); put(E.sat, 'height', `${r1(R.h)}px`);
    at(E.sat, R.x, R.y);
    vis(E.sat, g > 0);
    const fr = E3(seg(p, T.grow[0] + 0.03, T.grow[1] + 0.02));
    put(satF, 'clipPath', `inset(${r1((1 - fr) * 100)}% 0 0 0)`);
    put(satS, 'clipPath', `inset(${r1((1 - c) * 100)}% 0 0 0)`);
    vis(satT, g > 0 && fr < 1); vis(satF, g > 0 && fr > 0 && c < 1); vis(satS, c > 0);

    // --- the week sets in line by line, then carries off right as the card comes in
    const wk = seg(p, ...T.week);
    const wOut = c * VW;
    const hr = E3(clamp(wk * 3));
    at(E.week, L.weekXY.x + wOut, L.weekXY.y);
    put(E.week.querySelector('h2'), 'transform', `translateX(${r1((1 - hr) * VW * 0.6)}px)`);
    rows.forEach((row, i) => { const rr = E3(clamp(wk * 2.2 - 0.3 - i * 0.28)); put(row, 'transform', `translateX(${r1((1 - rr) * VW * 0.7)}px)`); });
    put(E.week.querySelector('.note'), 'transform', `translateX(${r1((1 - E3(clamp(wk * 2 - 1))) * VW * 0.7)}px)`);
    vis(E.week, wk > 0 && c < 1);

    const cardX = L.cardXY.x + (1 - c) * VW * 0.7;
    at(E.card, cardX, L.cardXY.y, L.cardS);
    vis(E.card, c > 0);

    // the one CTA leaves the bar's corner and lands in the card's slot once the card is in
    const tk = E3(seg(p, 0.87, 0.95));
    if (tk <= 0) {
      if (cta.classList.contains('travel')) { cta.classList.remove('travel'); ['left', 'top', 'width', 'height', 'fontSize'].forEach((k) => { cta.style[k] = ''; }); cta._c = {}; }
    } else {
      if (!cta.classList.contains('travel')) cta.classList.add('travel');
      const h = L.ctaHome, sx = cardX + L.slot.dx, sy = L.cardXY.y + L.slot.dy;
      const arc = Math.sin(tk * Math.PI) * Math.min(90, VW * 0.06);   // swings out a little, not a straight slide
      put(cta, 'left', `${r1(lerp(h.x, sx, tk) + arc)}px`); put(cta, 'top', `${r1(lerp(h.y, sy, tk))}px`);
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

  // open now, from their hours (11am to 10pm every day), Philadelphia time
  (function openNow() {
    const el = $('openNow');
    try {
      const f = new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', hour: 'numeric', minute: 'numeric', hour12: false });
      const x = Object.fromEntries(f.formatToParts(new Date()).map((o) => [o.type, o.value]));
      const h = (+x.hour % 24) + +x.minute / 60;
      el.textContent = h >= 11 && h < 22 ? 'Open now until 10pm' : h < 11 ? 'Opens today at 11am' : 'Closed now. Opens 11am';
    } catch (e) { /* keep the static line */ }
  })();

  addEventListener('pointermove', (e) => { if (e.pointerType === 'mouse') { leanT.x = (e.clientX / innerWidth - 0.5) * 2; leanT.y = (e.clientY / innerHeight - 0.5) * 2; } }, { passive: true });
  let rz = 0;
  addEventListener('resize', () => { cancelAnimationFrame(rz); rz = requestAnimationFrame(layout); });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(layout);
  addEventListener('load', layout);
  start();
  // decode the big table photo early so the pull-back never shows an empty frame
  const tImg = E.table.querySelector('img'); if (tImg.decode) tImg.decode().catch(() => {});
  addEventListener('DOMContentLoaded', () => { if (window.LiquidGlass) LiquidGlass.cursorBall(); });
})();
