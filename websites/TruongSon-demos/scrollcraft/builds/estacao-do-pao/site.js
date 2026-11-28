/* Estação do Pão, the steam table. One fixed stage; scroll only drives motion. Nothing fades: each scene's
   end builds the next one's start. The photo frames are the pans of their buffet: they split, regroup and refill.
   1 hero: their three pão de queijo breathe in front of a giant plum "Estação", leaning to the cursor
   2 the trio splits; the first ball grows into a tall pan of their bread; the bakery list with prices sets in
   3 peak: the pan drops into the first slot of a steam table; eleven more slide out of it one by one and get served
     their dishes; then every pan flips over like a station board and the gaps close into the photo of their real line
   4 the line folds back into one tall pan; their pudim, maracujá and chocolate cake roll through it; sweets list
   5 the pan opens wide into their studio spread; tags pin to the food; kitchen, café colonial, catering
   6 the spread drops into a row and breaks into seven pans, one per day, each rolls up to its hours; the word and the
     trio come back beside the order card. Holds.
   ?p=0.4 jumps there. */
(() => {
  const $ = (s) => document.getElementById(s);
  const root = document.documentElement;
  const SZ = window.SIZES;
  const stage = $('stage'), bar = $('bar');
  const word = $('word'), chars = [...word.querySelectorAll('.ch')], word2 = $('word2');
  const heroL = $('heroL'), heroR = $('heroR');
  const balls = [$('b1'), $('b2'), $('b3')], trioSh = $('trioSh'), emp = $('emp');
  const frame = $('frame'), fImgs = [...frame.querySelectorAll('img')];
  const bakery = $('bakery'), bkH = bakery.querySelector('h2'), bkRows = [...bakery.querySelectorAll('li')];
  const peakCopy = $('peakCopy');
  const pans = [...document.querySelectorAll('.pan')];
  const panFr = pans.map((p) => p.querySelector('.fr img')), panBk = pans.map((p) => p.querySelector('.bk img'));
  const big = $('big'), bImgs = [...big.querySelectorAll('img')];
  const sweets = $('sweets'), swH = sweets.querySelector('h2'), swRows = [...sweets.querySelectorAll('li')];
  const tags = [...document.querySelectorAll('.tag')], notes = $('notes'), noteEls = [...notes.querySelectorAll('.note')];
  const daysWrap = $('days'), days = [...document.querySelectorAll('.day')], dayImg = days.map((d) => d.querySelector('img'));
  const card = $('card'), cta = $('cta'), slot = $('ctaSlot');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');

  const clamp = (v, a = 0, b = 1) => (v < a ? a : v > b ? b : v);
  const seg = (p, a, b) => clamp((p - a) / (b - a));
  const E3 = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const EO = (t) => 1 - Math.pow(1 - t, 3);
  const lerp = (a, b, t) => a + (b - a) * t;
  const r1 = (v) => Math.round(v * 10) / 10;
  const put = (el, k, v) => { const c = el._c || (el._c = {}); if (c[k] !== v) { c[k] = v; el.style[k] = v; } };
  const at = (el, x, y, s = 1, extra = '') => put(el, 'transform', `translate3d(${r1(x)}px,${r1(y)}px,0)${s !== 1 ? ` scale(${s.toFixed(4)})` : ''}${extra}`);
  const vis = (el, on) => put(el, 'visibility', on ? 'visible' : 'hidden');
  const R = (x, y, w, h) => ({ x, y, w, h });
  const rl = (a, b, t) => R(lerp(a.x, b.x, t), lerp(a.y, b.y, t), lerp(a.w, b.w, t), lerp(a.h, b.h, t));
  // a box, sized and placed by width/height and a translate, so the photos inside keep their own object-fit
  const box = (el, r, radius) => {
    put(el, 'width', `${r1(r.w)}px`); put(el, 'height', `${r1(r.h)}px`); at(el, r.x, r.y);
    if (radius !== undefined) put(el, 'borderRadius', `${r1(radius)}px`);
  };
  // a photo layer rolling down into its frame (inset from the bottom shrinks to 0)
  // (clip only: a child set to visibility:visible would show through a hidden parent)
  const roll = (img, t) => { put(img, 'clipPath', t >= 1 ? 'none' : `inset(0 0 ${r1((1 - t) * 100)}% 0)`); };
  // object-fit: cover, as numbers: where a photo of iw x ih lands when it covers rect r (focus fx, fy)
  const cover = (r, iw, ih, fx = 0.5, fy = 0.5) => {
    const s = Math.max(r.w / iw, r.h / ih), w = iw * s, h = ih * s;
    return { x: r.x + (r.w - w) * fx, y: r.y + (r.h - h) * fy, w, h, s };
  };

  // the score
  const T = {
    split: [0.045, 0.13], bkIn: [0.1, 0.19], roll1: [0.162, 0.19], roll2: [0.2, 0.228],
    toPan: [0.262, 0.3], bkOut: [0.252, 0.29], deal: [0.3, 0.44], pkIn: [0.29, 0.34],
    flip: [0.455, 0.515], shut: [0.515, 0.55],
    toSweet: [0.585, 0.63], pkOut: [0.585, 0.615], swIn: [0.61, 0.67], s2: [0.665, 0.69], s3: [0.705, 0.73],
    toSpread: [0.74, 0.785], swOut: [0.738, 0.765], tags: [0.775, 0.825], notes: [0.785, 0.835],
    toRow: [0.86, 0.895], open: [0.895, 0.925], dayRoll: [0.915, 0.958], back: [0.865, 0.94], cta: [0.945, 0.985],
  };
  const LINE = SZ.line, SPREAD = SZ.spread, TRIO = SZ.trio;
  const today = (() => { try { const d = new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', weekday: 'short' }).format(new Date()); return ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].indexOf(d); } catch (e) { return -1; } })();
  if (today >= 0) days[today].classList.add('today');

  let VW = 0, VH = 0, TOP = 66, mob = false, L = {};
  let p = 0, pT = 0, t0 = performance.now(), forced = null, running = false;
  let lean = { x: 0, y: 0 }, leanT = { x: 0, y: 0 };
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  const q = new URLSearchParams(location.search).get('p');
  if (q !== null && !isNaN(+q)) forced = clamp(+q);

  function capH(fs) {
    const c = document.createElement('canvas').getContext('2d');
    c.font = `400 ${fs}px Gloock, Georgia, serif`;
    return c.measureText('E').actualBoundingBoxAscent || fs * 0.7;
  }
  // the trio as a small pile: two balls side by side, the first resting on top between them. d = ball height
  function trioAt(cx, bottom, d) {
    const a = TRIO.balls.map((b) => b.w / b.h);
    const top = R(cx - d * a[0] / 2, bottom - d * 1.78, d * a[0], d);
    const right = R(cx - d * 0.06, bottom - d, d * a[1], d);
    const left = R(cx + d * 0.06 - d * a[2], bottom - d * 1.02, d * a[2], d);
    return [top, right, left];
  }
  function grid(r, cols, rows, gap) {
    const cw = (r.w - gap * (cols - 1)) / cols, ch = (r.h - gap * (rows - 1)) / rows, out = [];
    for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) out.push(R(r.x + i * (cw + gap), r.y + j * (ch + gap), cw, ch));
    return out;
  }
  const fitW = (el, w) => { put(el, 'width', `${r1(w)}px`); };

  function layout() {
    [...stage.querySelectorAll('*')].forEach((el) => { el._c = {}; el.style.transform = ''; el.style.visibility = ''; el.style.clipPath = ''; });
    VW = root.clientWidth; VH = stage.clientHeight; mob = VW <= 760;
    // big screens: type and the text blocks grow with the width (up to 1.3x), the photos already do
    const K = mob ? 1 : clamp(Math.min(VW / 1440, VH / 860), 1, 1.3); L.K = K;
    root.style.fontSize = `${16 * K}px`;
    TOP = bar.offsetHeight;
    const pad = mob ? 16 : Math.min(56, Math.max(24, VW * 0.035)); L.pad = pad;
    const AV = VH - TOP;

    // ---- hero: the word, the trio in front of its lower half, copy under it
    word.style.fontSize = '200px';
    let fs = (VW - pad * 2) * (mob ? 0.96 : 0.84) / word.scrollWidth * 200;
    fs = Math.min(fs, AV * (mob ? 0.2 : 0.34) / 0.7);
    word.style.fontSize = `${fs}px`; L.fs = fs; L.cap = capH(fs);
    L.bl = word.querySelector('.bl').offsetTop;
    L.ww = word.scrollWidth;
    L.wx = (VW - L.ww) / 2;
    heroL.classList.remove('m'); fitW(heroL, mob ? VW - pad * 2 : Math.min(430 * K, VW * 0.3));
    const hlH = heroL.offsetHeight, hrH = heroR.offsetHeight;
    let D;
    if (mob) {
      L.BY = TOP + AV * 0.2 + L.cap * 0.5;
      // the pile sits under the word, the top ball just over the letters' feet, so the word stays readable
      D = Math.max(56, Math.min(VW * 0.3, (VH - L.BY + L.cap * 0.22 - hlH - hrH - 60) / 1.78));
      L.trioBottom = L.BY - L.cap * 0.22 + D * 1.78;
      L.heroL = { x: pad, y: L.trioBottom + 18 };
      L.heroR = { x: pad, y: L.heroL.y + hlH + 12, left: true };
    } else {
      L.BY = TOP + AV * 0.47;
      D = Math.min(AV * 0.3, VW * 0.16, (VH - 50 - L.BY) / 1.25);
      L.trioBottom = L.BY + D * 1.25;
      L.heroL = { x: pad, y: VH - 40 - hlH };
      L.heroR = { x: VW - pad - heroR.offsetWidth, y: VH - 40 - hrH };
    }
    heroR.style.textAlign = mob ? 'left' : ''; heroR.querySelectorAll('div').forEach((d) => { d.style.justifyContent = mob ? 'flex-start' : ''; });
    L.D = D;
    L.trio0 = trioAt(VW / 2, L.trioBottom, D);
    at(word, L.wx, L.BY - L.bl);
    word2.style.fontSize = `${r1(fs * 0.24)}px`;
    L.w2 = { x: L.wx + L.ww - word2.offsetWidth - fs * 0.02, y: L.BY + fs * 0.06 };
    if (mob) L.w2 = { x: L.wx + L.ww - word2.offsetWidth, y: L.BY - L.cap - word2.offsetHeight - 8 };
    const tx0 = L.trio0[0].x, tx1 = L.trio0[0].x + L.trio0[0].w;
    L.covered = chars.map((c) => { const a = L.wx + c.offsetLeft, b = a + c.offsetWidth; return b > tx0 + 10 && a < tx1 - 10; });

    // ---- bakery: one tall pan of bread, the list beside or under it
    bakery.classList.remove('compact'); sweets.classList.remove('compact');
    if (mob) {
      fitW(bakery, VW - pad * 2); bakery.classList.add('compact');
      const lh = bakery.offsetHeight;
      const fh = Math.max(120, Math.min(AV * 0.36, VH - TOP - 16 - lh - 24));
      L.bf = R(pad, TOP + 8, VW - pad * 2, fh);
      L.bk = { x: pad, y: L.bf.y + fh + 16, s: Math.min(1, (VH - (L.bf.y + fh + 16) - 30) / lh) };
    } else {
      const fh = AV - 64, fw = Math.min(fh * 0.75, VW * 0.36);
      L.bf = R(pad + VW * 0.03, TOP + 24, fw, fh);
      const lx = L.bf.x + fw + VW * 0.06, lw = Math.min(540 * K, VW - lx - pad);
      fitW(bakery, lw);
      let lh = bakery.offsetHeight;
      if (lh > AV - 40) { bakery.classList.add('compact'); lh = bakery.offsetHeight; }
      const s = Math.min(1, (AV - 30) / lh);
      L.bk = { x: lx, y: TOP + Math.max(10, (AV - lh * s) / 2), s };
    }

    // ---- peak: copy and a steam table of twelve pans
    peakCopy.classList.remove('compact');
    if (mob) {
      fitW(peakCopy, VW - pad * 2); peakCopy.classList.add('compact');
      const ph = peakCopy.offsetHeight;
      L.pk = { x: pad, y: TOP + 6 };
      const gy = TOP + 6 + ph + 14, gh = VH - gy - 22;
      L.grid = R(pad, gy, VW - pad * 2, gh); L.cols = 3; L.rows = 4; L.gap = 8;
    } else {
      const cw = Math.min(390 * K, VW * 0.27);
      fitW(peakCopy, cw);
      const gx = pad + cw + VW * 0.045, gw = VW - pad - gx;
      let gh = Math.min(AV - 48, (gw - 36) / 4 * 0.8 * 3 + 24);
      L.grid = R(gx, TOP + (AV - gh) / 2, gw, gh); L.cols = 4; L.rows = 3; L.gap = 12;
      L.pk = { x: pad, y: TOP + Math.max(16, (AV - peakCopy.offsetHeight) / 2) };
    }
    L.cells = grid(L.grid, L.cols, L.rows, L.gap);
    L.cells0 = grid(L.grid, L.cols, L.rows, 0);
    L.lineCover = cover(L.grid, LINE[0], LINE[1], 0.5, 0.58);
    panBk.forEach((im) => { put(im, 'width', `${r1(L.lineCover.w)}px`); put(im, 'height', `${r1(L.lineCover.h)}px`); });

    // ---- sweets: one tall pan on the other side, list beside or under it
    if (mob) {
      fitW(sweets, VW - pad * 2); sweets.classList.add('compact');
      const lh = sweets.offsetHeight;
      const fh = Math.max(120, Math.min(AV * 0.4, VH - TOP - 16 - lh - 24));
      L.sf = R(pad, TOP + 8, VW - pad * 2, fh);
      L.sw = { x: pad, y: L.sf.y + fh + 16, s: Math.min(1, (VH - (L.sf.y + fh + 16) - 30) / lh) };
    } else {
      const fh = AV - 64, fw = Math.min(fh * 0.75, VW * 0.36);
      L.sf = R(VW - pad - VW * 0.03 - fw, TOP + 24, fw, fh);
      const lw = Math.min(540 * K, L.sf.x - VW * 0.06 - pad);
      fitW(sweets, lw);
      let lh = sweets.offsetHeight;
      if (lh > AV - 40) { sweets.classList.add('compact'); lh = sweets.offsetHeight; }
      const s = Math.min(1, (AV - 30) / lh);
      L.sw = { x: L.sf.x - VW * 0.06 - lw, y: TOP + Math.max(10, (AV - lh * s) / 2), s };
    }

    // ---- kitchen: the spread, wide; notes under it
    notes.classList.toggle('compact', mob);
    fitW(notes, mob ? VW - pad * 2 : Math.min(1100 * K, VW - pad * 2));
    const nh = notes.offsetHeight;
    if (mob) {
      const sh = Math.min((VW - pad * 2) * 0.92, VH - TOP - nh - 70);
      L.sp = R(pad, TOP + 12, VW - pad * 2, sh);
      L.nt = { x: pad, y: L.sp.y + sh + 26 };
    } else {
      const sh = Math.min(AV - nh - 96, (VW - pad * 2) * 9 / 16), sw = sh * 16 / 9;
      L.sp = R((VW - sw) / 2, TOP + 10, sw, sh);
      L.nt = { x: (VW - notes.offsetWidth) / 2, y: L.sp.y + sh + 30 };
    }
    L.spCover = cover(L.sp, SPREAD[0], SPREAD[1]);
    const placed = [];
    L.tags = tags.map((t) => {
      const x = L.spCover.x + +t.dataset.x * L.spCover.w, y = L.spCover.y + +t.dataset.y * L.spCover.h;
      const w = t.offsetWidth, h = t.offsetHeight;
      const g = { x: clamp(x - w / 2, pad, VW - pad - w), y: Math.max(L.sp.y + 6, y - h - 14), w, h };
      g.ok = x > L.sp.x + 20 && x < L.sp.x + L.sp.w - 20 && !placed.some((o) => g.x < o.x + o.w + 8 && o.x < g.x + w + 8 && g.y < o.y + o.h + 6 && o.y < g.y + h + 6);
      if (g.ok) placed.push(g);
      return g;
    });

    // ---- close: seven day pans along the bottom; the card; the word and the trio come home
    daysWrap.classList.toggle('small', mob);
    if (mob) {
      const dh = 54, g = 6, rowW = VW - pad * 2;
      L.row = R(pad, VH - 26 - dh * 2 - g, rowW, dh * 2 + g);
      const w4 = (rowW - g * 3) / 4, w3 = (rowW - g * 2) / 3;
      L.dayR = days.map((d, i) => (i < 4 ? R(pad + i * (w4 + g), L.row.y, w4, dh) : R(pad + (i - 4) * (w3 + g), L.row.y + dh + g, w3, dh)));
      L.dayR0 = days.map((d, i) => (i < 4 ? R(pad + i * rowW / 4, L.row.y, rowW / 4, dh + g / 2) : R(pad + (i - 4) * rowW / 3, L.row.y + dh + g / 2, rowW / 3, dh + g / 2)));
    } else {
      const dh = Math.min(96, AV * 0.12), g = 12;
      L.row = R(pad, VH - 30 - dh, VW - pad * 2, dh);
      L.dayR = grid(L.row, 7, 1, g); L.dayR0 = grid(L.row, 7, 1, 0);
    }
    L.rowCover = cover(L.row, SPREAD[0], SPREAD[1]);
    dayImg.forEach((im) => { put(im, 'width', `${r1(L.rowCover.w)}px`); put(im, 'height', `${r1(L.rowCover.h)}px`); });

    const cardW = mob ? VW - pad * 2 : Math.min(440 * K, VW * 0.36);
    put(card, 'width', `${cardW}px`); card.classList.remove('compact');
    let ch = card.offsetHeight;
    if (mob) {
      const top = TOP + 4 + 96, avail = L.row.y - 12 - top;
      if (ch > avail) { card.classList.add('compact'); ch = card.offsetHeight; }
      L.cardS = Math.min(1, avail / ch);
      L.card = { x: pad, y: top };
      // the word small, top left; the trio top right
      L.cfs = Math.min(fs, (VW * 0.58) / L.ww * fs);
      L.wEnd = { x: pad, y: TOP + 4 + 60 , s: L.cfs / fs };
      L.trio2 = trioAt(VW - pad - 52, TOP + 4 + 94, 50);
    } else {
      const avail = L.row.y - 24 - (TOP + 18);
      if (ch > avail) { card.classList.add('compact'); ch = card.offsetHeight; }
      L.cardS = Math.min(1, avail / ch);
      L.card = { x: pad + VW * 0.03, y: TOP + 18 + Math.max(0, (avail - ch * L.cardS) / 2) };
      const rx0 = L.card.x + cardW * L.cardS + VW * 0.05, rw = VW - pad - rx0;
      const s = Math.min(1, rw * 0.92 / L.ww);
      const by = TOP + (L.row.y - TOP) * 0.5;
      L.wEnd = { x: rx0 + (rw - L.ww * s) / 2, y: by, s };
      const d = Math.min((L.row.y - TOP) * 0.24, rw * 0.2, (L.row.y - 16 - by) / 1.25);
      L.trio2 = trioAt(rx0 + rw / 2, by + d * 1.25, d);
    }
    L.cardH = ch * L.cardS;

    // ---- the balls between scenes: small, parked in blank space, overlapping a frame edge where they rest
    const bs = mob ? 58 : Math.min(120, VW * 0.08);
    L.bs = bs;
    const sq = (cx, cy) => R(cx - bs / 2, cy - bs / 2, bs, bs);
    if (mob) {
      L.park = {
        bakery: [null, sq(VW - pad - 18, L.bf.y + 22), sq(pad + 22, L.bf.y + L.bf.h - 26)],
        peak: [null, sq(VW - pad - 14, L.grid.y + L.grid.h - 18), sq(pad + 14, L.grid.y + L.grid.h - 8)],
        sweets: [null, sq(pad + 22, L.sf.y + L.sf.h - 26), sq(VW - pad - 18, L.sf.y + 22)],
        kitchen: [null, sq(VW - pad - 18, L.sp.y + L.sp.h - 14), sq(pad + 18, L.sp.y + L.sp.h - 6)],
      };
    } else {
      L.park = {
        bakery: [null, sq(L.bf.x + L.bf.w - 4, L.bf.y + 34), sq(VW - pad - 30, VH - 70)],
        peak: [null, sq(pad + bs * 0.6, VH - bs * 1.05), sq(pad + bs * 1.55, VH - bs * 0.9)],
        sweets: [null, sq(L.sf.x + 4, L.sf.y + L.sf.h - 50), sq(L.sf.x + L.sf.w - 10, L.sf.y + 40)],
        kitchen: [null, sq(L.sp.x - 6, L.sp.y + L.sp.h - 30), sq(L.sp.x + L.sp.w + 4, L.sp.y + L.sp.h * 0.42)],
      };
    }
    // the empadas plate: beside the bread pan
    const eh = mob ? 96 : Math.min(230, AV * 0.28);
    L.emp = mob ? R(pad - 8, L.bf.y - 10, eh, eh) : R(L.bf.x - eh * 0.38, Math.min(VH - eh - 10, L.bf.y + L.bf.h - eh * 0.78), eh, eh);

    // the one CTA: its home in the bar, and its slot in the card
    cta.classList.remove('travel'); ['left', 'top', 'width', 'height', 'fontSize'].forEach((k) => { cta.style[k] = ''; }); cta._c = {};
    const hr = cta.getBoundingClientRect();
    L.ctaHome = { x: hr.left, y: hr.top, w: hr.width, h: hr.height };
    L.slot = { dx: slot.offsetLeft * L.cardS, dy: slot.offsetTop * L.cardS, w: slot.offsetWidth * L.cardS, h: slot.offsetHeight * L.cardS };
    draw(p, (performance.now() - t0) / 1000);
  }

  function frameLoop(now) {
    const doc = root.scrollHeight - innerHeight;
    pT = forced !== null ? forced : clamp(scrollY / Math.max(1, doc));
    p += (pT - p) * (forced !== null || reduced.matches ? 1 : 0.14);
    if (Math.abs(pT - p) < 0.0003) p = pT;
    lean.x += (leanT.x - lean.x) * 0.12; lean.y += (leanT.y - lean.y) * 0.12;
    draw(p, (now - t0) / 1000);
    requestAnimationFrame(frameLoop);
  }

  // a list: heading and rows slide in from one side, leave to the other
  function listMove(el, h, rows, pos, tin, tout, from, to) {
    const off = (v) => v * VW;
    at(el, pos.x, pos.y, pos.s);
    put(h, 'transform', `translateX(${r1((1 - E3(clamp(tin * 2.2))) * off(from) + E3(clamp(tout * 2)) * off(to))}px)`);
    rows.forEach((row, i) => {
      const a = E3(clamp(tin * 2.2 - 0.3 - i * 0.12)), b = E3(clamp(tout * 2 - 0.1 - i * 0.07));
      put(row, 'transform', `translateX(${r1((1 - a) * off(from) + b * off(to))}px)`);
    });
    vis(el, tin > 0 && tout < 1);
  }

  function draw(p, time) {
    if (!L.cells) return;
    const still = reduced.matches, pad = L.pad;
    const sp = E3(seg(p, ...T.split)), tp = E3(seg(p, ...T.toPan)), back = E3(seg(p, ...T.back));
    const ts = E3(seg(p, ...T.toSweet)), tsp = E3(seg(p, ...T.toSpread)), tr = E3(seg(p, ...T.toRow));
    const breath = still ? 0 : Math.sin(time * 1.5);

    // ---- the word: still in the hero, the covered letters sway; slides left under the bread pan; returns at the close
    const wOut = sp, wBack = back;
    let wx = L.wx - wOut * VW * 0.75, wy = L.BY - L.bl, ws = 1;
    if (wBack > 0) { const e = L.wEnd; wx = lerp(-L.ww * e.s - 40, e.x, wBack); wy = e.y - L.bl * e.s; ws = e.s; }
    put(word, 'transformOrigin', '0 0');
    at(word, wx, wy, ws);
    vis(word, (wOut < 1 || wBack > 0));
    chars.forEach((c, i) => {
      const on = L.covered[i] && !still && (wOut === 0 || wBack >= 1);
      put(c, 'transform', on ? `rotate(${(Math.sin(time * 1.3 + i * 0.9) * 2.2).toFixed(2)}deg)` : '');
    });
    {
      let x = L.w2.x - wOut * VW * 0.75, y = L.w2.y;
      if (wBack > 0) {
        const e = L.wEnd, wr = e.x + L.ww * e.s;
        const tx = mob ? e.x : wr - word2.offsetWidth * e.s, ty = mob ? e.y + L.fs * e.s * 0.1 : e.y + L.fs * e.s * 0.08;
        x = lerp(-300, tx, wBack); y = ty;
        put(word2, 'transformOrigin', '0 0'); at(word2, x, y, e.s);
      } else at(word2, x, y);
      vis(word2, wOut < 1 || wBack > 0);
    }
    // hero copy: out to the sides as the bakery comes in
    at(heroL, L.heroL.x - E3(clamp(sp * 1.4)) * VW * 0.7, L.heroL.y);
    at(heroR, L.heroR.x + (L.heroR.left ? -1 : 1) * E3(clamp(sp * 1.4 - 0.1)) * VW * 0.7, L.heroR.y);
    vis(heroL, sp < 1); vis(heroR, sp < 1);

    // ---- the balls
    const lx = still || mob ? 0 : lean.x, ly = still || mob ? 0 : lean.y;
    const hold = sp === 0 || back >= 1;
    const bob = (i) => (still ? 0 : Math.sin(time * 0.9 + i * 2.1) * 6);
    const parkAt = (i) => {
      // where ball i rests for the current scene, with hand-offs between scenes
      const P = L.park;
      if (p < T.toPan[0]) return P.bakery[i];
      if (p < T.toSweet[0]) return rl(P.bakery[i], P.peak[i], E3(seg(p, T.toPan[0], T.pkIn[1])));
      if (p < T.toSpread[0]) return rl(P.peak[i], P.sweets[i], ts);
      return rl(P.sweets[i], P.kitchen[i], tsp);
    };
    balls.forEach((b, i) => {
      let r;
      const home = back > 0 ? L.trio2[i] : L.trio0[i];
      if (i === 0) {
        // ball 1 becomes the bread pan: hidden once the pan has grown over it; drops back in at the close
        if (back > 0) r = rl(R(home.x, -home.h - 40, home.w, home.h), home, EO(clamp(back * 1.15)));
        else r = L.trio0[0];
        put(b, 'zIndex', sp > 0 && back === 0 ? '3' : '11');   // on top of the pile; under the pan that grows out of it
        vis(b, sp < 0.45 || back > 0);
      } else {
        const dep = parkAt(i);
        if (back > 0) r = rl(dep, home, back);
        else if (sp < 1) r = rl(L.trio0[i], dep, E3(clamp(sp * 1.25 - 0.1 * i)));
        else r = dep;
        if (sp > 0 && back < 1) r = R(r.x, r.y + bob(i) * Math.min(1, sp * 2) * (1 - back), r.w, r.h);
        vis(b, true);
      }
      put(b, 'width', `${r1(r.w)}px`);
      const breathe = hold && !still ? 1 + breath * 0.012 : 1;
      let extra = '';
      if (hold && !mob && !still) extra = ` perspective(1100px) rotateX(${(-ly * 8).toFixed(2)}deg) rotateY(${(lx * 11).toFixed(2)}deg)`;
      const spin = !hold && !still ? ` rotate(${(Math.sin(time * 0.5 + i) * 6).toFixed(2)}deg)` : '';
      put(b, 'transformOrigin', '50% 50%');
      put(b, 'transform', `translate3d(${r1(r.x)}px,${r1(r.y)}px,0)${extra}${spin}${breathe !== 1 ? ` scale(${breathe.toFixed(4)})` : ''}`);
    });
    {
      const T0 = back > 0 ? L.trio2 : L.trio0;
      const x0 = T0[2].x, x1 = T0[1].x + T0[1].w, w = (x1 - x0) * 0.92, by = T0[1].y + T0[1].h;
      put(trioSh, 'width', `${r1(w)}px`); put(trioSh, 'height', `${r1(w * 0.12)}px`);
      at(trioSh, (x0 + x1) / 2 - w / 2, by - w * 0.07);
      vis(trioSh, sp === 0 || back >= 1);
    }

    // ---- the bread pan: grows out of ball 1, rolls through their breads, drops into the first slot of the steam table
    const ball1 = L.trio0[0];
    let F;
    if (tp > 0) F = rl(L.bf, L.cells[0], tp);
    else F = rl(R(ball1.x + ball1.w / 2, ball1.y + ball1.h / 2, 0, 0), L.bf, sp);
    const fr = lerp(Math.min(F.w, F.h) / 2, 22, clamp(sp * 1.6));
    box(frame, F, tp > 0 ? lerp(22, mob ? 12 : 16, tp) : fr);
    roll(fImgs[0], 1);
    roll(fImgs[1], E3(seg(p, ...T.roll1)));
    roll(fImgs[2], E3(seg(p, ...T.roll2)));
    roll(fImgs[3], tp);
    vis(frame, sp > 0 && tp < 1);

    // the empadas plate slides in under the pan's corner; leaves down as the pans deal
    {
      const inn = EO(seg(p, T.split[1] - 0.03, T.bkIn[1])), out = E3(seg(p, T.toPan[0] - 0.01, T.toPan[1]));
      const e = L.emp;
      put(emp, 'width', `${r1(e.w)}px`);
      put(emp, 'transformOrigin', '50% 50%');
      put(emp, 'transform', `translate3d(${r1(e.x + (1 - inn) * VW * 0.4)}px,${r1(e.y + out * VH * 0.8)}px,0) rotate(${r1((1 - inn) * 40 + (still ? 0 : Math.sin(time * 0.6) * 3))}deg)`);
      vis(emp, inn > 0 && out < 1);
    }

    // ---- bakery list
    listMove(bakery, bkH, bkRows, L.bk, seg(p, ...T.bkIn), seg(p, ...T.bkOut), 1, 1);

    // ---- the steam table: the pans deal out of the first one, each gets served, then all flip and shut
    const fl = seg(p, ...T.flip), sh = E3(seg(p, ...T.shut));
    const n = pans.length, dealSpan = T.deal[1] - T.deal[0];
    const gapK = 1 - sh;
    const rad = (mob ? 12 : 16) * gapK;
    pans.forEach((pan, i) => {
      const cell = rl(L.cells0[i], L.cells[i], gapK);
      let r = cell, served = 1, shown = true;
      if (i === 0) { shown = tp >= 1; served = 1; }
      else {
        const d0 = T.deal[0] + (i - 1) * dealSpan / (n - 1) * 0.86, d1 = d0 + dealSpan * 0.085;
        const m = E3(seg(p, d0, d1));
        r = rl(L.cells[i - 1], L.cells[i], m);
        served = E3(seg(p, d1 - 0.004, d1 + 0.012));
        shown = m > 0;
      }
      box(pan, r, rad);
      put(pan, 'zIndex', String(n - i));
      roll(panFr[i], served);
      // the flip: a wave from the top left corner
      const col = i % L.cols, row = Math.floor(i / L.cols);
      const k = (col + row) / (L.cols + L.rows - 2);
      const f = E3(clamp(fl * 1.8 - k * 0.8));
      put(pan, 'transform', `translate3d(${r1(r.x)}px,${r1(r.y)}px,0) perspective(${r1(Math.max(600, r.h * 5))}px) rotateX(${r1(f * 180)}deg)`);
      vis(pan, shown && sh < 1 && p < T.toSweet[0] + 0.001);
    });
    // the back faces: each shows its own slice of their real line (back face turned 180deg + pan turned 180deg = upright)
    pans.forEach((pan, i) => {
      const r = rl(L.cells0[i], L.cells[i], gapK), c = L.lineCover;
      put(panBk[i], 'transform', `translate3d(${r1(c.x - r.x)}px,${r1(c.y - r.y)}px,0)`);
    });

    // ---- the big pan: their real line once the pans shut, then sweets, then the spread, then the row of days
    let B = L.grid, bRad = 0;
    if (ts > 0) { B = rl(L.grid, L.sf, ts); bRad = 22 * ts; }
    if (tsp > 0) { B = rl(L.sf, L.sp, tsp); bRad = 22; }
    if (tr > 0) { B = rl(L.sp, L.row, tr); bRad = lerp(22, mob ? 14 : 16, tr); }
    box(big, B, bRad);
    roll(bImgs[0], 1);
    roll(bImgs[1], ts);
    roll(bImgs[2], E3(seg(p, ...T.s2)));
    roll(bImgs[3], E3(seg(p, ...T.s3)));
    roll(bImgs[4], tsp);
    const op = E3(seg(p, ...T.open));
    vis(big, sh >= 1 && op <= 0);

    // ---- peak copy: in from the left with the deal, out to the left as the line folds
    {
      const a = E3(seg(p, ...T.pkIn)), b = E3(seg(p, ...T.pkOut));
      at(peakCopy, L.pk.x - (1 - a) * VW * 0.6 - b * VW * 0.6, L.pk.y);
      vis(peakCopy, a > 0 && b < 1);
    }

    // ---- sweets list
    listMove(sweets, swH, swRows, L.sw, seg(p, ...T.swIn), seg(p, ...T.swOut), mob ? 1 : -1, mob ? -1 : -1);

    // ---- tags pin to the spread, notes set in under it; both leave as the spread drops into the row
    // tags ride with the spread when it drops into the row, and fold shut on the way
    const tg = seg(p, ...T.tags), outK = E3(seg(p, T.toRow[0], T.toRow[0] + 0.018));
    tags.forEach((t, i) => {
      const r = E3(clamp(tg * 2.2 - i * 0.35)) * (1 - outK), g = L.tags[i];
      const k = B.w / L.sp.w;
      at(t, B.x + (g.x - L.sp.x) * k, B.y + (g.y - L.sp.y) * (B.h / L.sp.h));
      put(t, 'clipPath', `inset(0 ${r1((1 - r) * 100)}% 0 0 round 999px)`);
      vis(t, g.ok && r > 0.001);
    });
    {
      const a = seg(p, ...T.notes), b = E3(seg(p, T.toRow[0] - 0.01, T.toRow[0] + 0.025));
      at(notes, L.nt.x, L.nt.y + b * VH * 0.6);
      noteEls.forEach((el, i) => put(el, 'transform', `translateY(${r1((1 - E3(clamp(a * 2 - i * 0.3))) * VH * 0.5)}px)`));
      vis(notes, a > 0 && b < 1);
    }

    // ---- the days: the row breaks into seven pans, each rolls up to its hours
    const dr = seg(p, ...T.dayRoll);
    days.forEach((d, i) => {
      const r = rl(L.dayR0[i], L.dayR[i], op);
      box(d, r, lerp(0, mob ? 12 : 16, op));
      const c = L.rowCover;
      at(dayImg[i], c.x - r.x - (L.dayR0[i].x - r.x) * 0, c.y - r.y);
      const k = E3(clamp(dr * 2.4 - i * 0.2));
      put(dayImg[i], 'clipPath', k <= 0 ? 'none' : `inset(0 0 ${r1(k * 100)}% 0)`);
      vis(d, op > 0);
    });

    // ---- the card
    const cardIn = E3(seg(p, T.back[0], T.back[1] - 0.01));
    at(card, L.card.x - (1 - cardIn) * VW * (mob ? 1.1 : 0.7), L.card.y, L.cardS);
    vis(card, cardIn > 0);

    // the one CTA leaves the bar's corner and lands in the card's slot once the card is in
    const tk = E3(seg(p, ...T.cta));
    if (tk <= 0) {
      if (cta.classList.contains('travel')) { cta.classList.remove('travel'); ['left', 'top', 'width', 'height', 'fontSize'].forEach((x) => { cta.style[x] = ''; }); cta._c = {}; }
    } else {
      if (!cta.classList.contains('travel')) cta.classList.add('travel');
      const h0 = L.ctaHome, sx = L.card.x + L.slot.dx, sy = L.card.y + L.slot.dy;
      const arc = Math.sin(tk * Math.PI) * Math.min(90, VW * 0.06);
      put(cta, 'left', `${r1(lerp(h0.x, sx, tk) - arc)}px`); put(cta, 'top', `${r1(lerp(h0.y, sy, tk))}px`);
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
    if (!running) { running = true; requestAnimationFrame(frameLoop); }
  }

  // open now, from their Google hours (Mon to Thu 6am to 9pm, Fri and Sat 6am to 10pm, Sun 7am to 9pm), Boca Raton time
  (function openNow() {
    try {
      const f = new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', weekday: 'short', hour: 'numeric', minute: 'numeric', hour12: false });
      const x = Object.fromEntries(f.formatToParts(new Date()).map((o) => [o.type, o.value]));
      const h = (+x.hour % 24) + +x.minute / 60, d = x.weekday;
      const HRS = { Sun: [7, 21], Mon: [6, 21], Tue: [6, 21], Wed: [6, 21], Thu: [6, 21], Fri: [6, 22], Sat: [6, 22] };
      const [o, c] = HRS[d] || [6, 21];
      const fmt = (v) => (v > 12 ? `${v - 12}pm` : `${v}am`);
      const next = { Sun: 'Mon', Mon: 'Tue', Tue: 'Wed', Wed: 'Thu', Thu: 'Fri', Fri: 'Sat', Sat: 'Sun' }[d];
      const txt = h >= o && h < c ? `Open now until ${fmt(c)}` : h < o ? `Opens today at ${fmt(o)}` : `Closed now. Opens at ${fmt(HRS[next][0])}`;
      document.querySelectorAll('.open-now').forEach((el) => { el.textContent = txt; });
    } catch (e) { /* keep the static line */ }
  })();

  addEventListener('pointermove', (e) => { if (e.pointerType === 'mouse') { leanT.x = (e.clientX / innerWidth - 0.5) * 2; leanT.y = (e.clientY / innerHeight - 0.5) * 2; } }, { passive: true });
  let rz = 0;
  addEventListener('resize', () => { cancelAnimationFrame(rz); rz = requestAnimationFrame(layout); });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(layout);
  addEventListener('load', layout);
  start();
  stage.querySelectorAll('img').forEach((im) => { im.loading = 'eager'; if (im.decode) im.decode().catch(() => {}); });
  addEventListener('DOMContentLoaded', () => { if (window.LiquidGlass) LiquidGlass.cursorBall(); });
})();
