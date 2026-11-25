/* Gochón: one fixed stage, one timeline p (0..1) from smoothed scroll.
   1 hero: their paper tray (clean plate) with the mandoca, papita and tequeño cut out on top
   2 the pieces lift off the tray and get named and priced ("One of each, $5.50")
   3 peak: the pan along their display case is scrubbed by scroll; a label slides out of each printed
     shelf tag (tracked per frame) with the price
   4 the pan carries on into three open party boxes (50 / 100), then into one full box (wholesale)
   5 the box wipes up into a tequeño pulled apart (Google rating, followers)
   6 the storefront and the order card. Holds.
   Moving things get transform / clip-path / opacity only, written only when they change.
   Layout is measured once per resize. Test switch: ?p=0.42 jumps there. */
(() => {
  const $ = (s) => document.getElementById(s);
  const root = document.documentElement;
  const stage = $('stage'), spacer = $('spacer');
  const heroCopy = $('heroCopy'), heroFrame = $('heroFrame'), pieces = $('pieces');
  const oneHead = $('oneHead');
  const LB = { mandoca: $('lbMandoca'), papita: $('lbPapita'), tequeno: $('lbTequeno') };
  const caseFrame = $('caseFrame'), video = $('caseVideo'), poster = $('casePoster'), caseHead = $('caseHead');
  const TG = { p: $('tgPapitas'), e: $('tgEmpanadas'), pa: $('tgPastel'), m: $('tgMandocas') };
  const boxesFrame = $('boxesFrame'), boxesCopy = $('boxesCopy'), boxFrame = $('boxFrame'), bulkCopy = $('bulkCopy');
  const pullFrame = $('pullFrame'), pullCopy = $('pullCopy'), storeFrame = $('storeFrame'), card = $('order');
  const svg = $('leaders');
  const stops = [...document.querySelectorAll('.line .stop')], SP = stops.map((b) => +b.dataset.p);
  const lineFill = $('lineFill'), lineHead = $('lineHead'), rail = document.querySelector('.line .rail');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');

  const clamp = (v, a = 0, b = 1) => (v < a ? a : v > b ? b : v);
  const seg = (p, a, b) => clamp((p - a) / (b - a));
  const E = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const O = (t) => 1 - Math.pow(1 - t, 3);
  const lerp = (a, b, t) => a + (b - a) * t;
  const r1 = (v) => Math.round(v * 10) / 10;
  const put = (el, prop, val) => { const c = el._c || (el._c = {}); if (c[prop] !== val) { c[prop] = val; el.style[prop] = val; } };
  const move = (el, x, y, s = 1, extra = '') => put(el, 'transform', `translate3d(${r1(x)}px,${r1(y)}px,0)${s !== 1 ? ` scale(${s.toFixed(4)})` : ''}${extra}`);
  const fade = (el, o) => { put(el, 'opacity', o.toFixed(3)); put(el, 'visibility', o > 0.004 ? 'visible' : 'hidden'); };
  const clip = (el, t, r, b, l) => put(el, 'clipPath', `inset(${r1(t)}% ${r1(r)}% ${r1(b)}% ${r1(l)}%)`);
  const size = (el, w, h) => { put(el, 'width', `${Math.round(w)}px`); if (h != null) put(el, 'height', `${Math.round(h)}px`); };

  // the pieces cutout sits at 260,209 (735x597) on the 1080x1500 plate
  const PLATE = { w: 1080, h: 1500 }, CUT = { x: 260, y: 209, w: 735, h: 597 };
  const ANCH = { mandoca: [0.50, 0.10], papita: [0.22, 0.70], tequeno: [0.83, 0.40] };
  // shelf tags in the case clip (frame at 10 fps, x, y as shares of the 1080x1920 frame), measured per frame
  const TAGK = {
    p:  { side: -1, win: [0, 15], k: [[0, .638, .159], [5, .482, .160], [11, .286, .166], [16, .13, .17], [19, .04, .17]] },
    e:  { side: -1, win: [0, 14], k: [[0, .59, .499], [5, .4525, .49], [9, .332, .484], [16, .11, .49]] },
    pa: { side: 1, win: [27, 48], k: [[26, .969, .584], [30, .822, .577], [34, .679, .568], [38, .537, .563], [42, .409, .56], [46, .29, .553], [48, .245, .55]] },
    m:  { side: 1, win: [35, 48], k: [[34, .98, .19], [38, .86, .19], [41, .71, .193], [43, .63, .194], [48, .44, .197]] },
  };
  const FRAMES = 46;
  const kAt = (k, f) => {
    if (f <= k[0][0]) return [k[0][1], k[0][2]];
    for (let i = 1; i < k.length; i++) if (f <= k[i][0]) { const t = (f - k[i - 1][0]) / (k[i][0] - k[i - 1][0]); return [lerp(k[i - 1][1], k[i][1], t), lerp(k[i - 1][2], k[i][2], t)]; }
    const l = k[k.length - 1]; return [l[1], l[2]];
  };

  let VW = 0, VH = 0, mobile = false, R = {}, dirty = true, dur = 4.6;
  let px = 0, py = 0, lean = { x: 0, y: 0 }, leanT = { x: 0, y: 0 };

  // where an image of iw x ih lands inside a rect with object-fit: cover
  const cover = (r, iw, ih) => { const s = Math.max(r.w / iw, r.h / ih); return { s, x: r.x + (r.w - iw * s) / 2, y: r.y + (r.h - ih * s) / 2 }; };
  const rect = (x, y, w, h) => ({ x, y, w, h });

  function layout() {
    VW = root.clientWidth; VH = stage.clientHeight; mobile = VW <= 760;
    [...stage.querySelectorAll('*')].forEach((el) => { el._c = {}; el.style.transform = ''; });
    const pad = mobile ? 16 : clamp(VW * 0.04, 16, 64), gap = mobile ? 12 : clamp(VH * 0.035, 14, 32);
    const H = VH - gap * 2;

    if (!mobile) {
      let hw = H * 0.72, hh = H; if (hw > VW * 0.46) { hw = VW * 0.46; hh = hw / 0.72; }
      R.hero = rect(VW - pad - hw, (VH - hh) / 2, hw, hh);
      size(heroCopy, Math.min(640, R.hero.x - pad - 56));
      R.heroCopy = { x: pad, y: (VH - heroCopy.offsetHeight) / 2 };
      const pw = Math.min(VW * 0.40, VH * 0.6 * CUT.w / CUT.h);
      R.lift = { cx: VW * 0.53, cy: VH * 0.56, w: pw };
      R.oneHead = { x: pad, y: gap + 8 };
      const ch = H, cw = ch * 9 / 16;
      R.case = rect((VW - cw) / 2, gap, cw, ch);
      size(caseHead, Math.min(420, VW - (R.case.x + cw + 56) - pad));
      R.caseHead = { x: R.case.x + cw + 56, y: gap + 10 };
      let bw = Math.min(VW * 0.5, H * 0.92 * 720 / 620), bh = bw * 620 / 720;
      R.boxes = rect(pad + VW * 0.02, (VH - bh) / 2, bw, bh);
      size(boxesCopy, Math.min(440, VW - (R.boxes.x + bw + 64) - pad));
      R.boxesCopy = { x: R.boxes.x + bw + 64, y: (VH - boxesCopy.offsetHeight) / 2 };
      const tw = H * 0.5625;
      R.box = rect(VW - pad - tw - VW * 0.05, gap, tw, H);
      size(bulkCopy, Math.min(520, R.box.x - pad - 80)); size(pullCopy, Math.min(520, R.box.x - pad - 80));
      R.bulkCopy = { x: pad + VW * 0.04, y: (VH - bulkCopy.offsetHeight) / 2 };
      R.pullCopy = { x: pad + VW * 0.04, y: (VH - pullCopy.offsetHeight) / 2 };
      const sw = Math.min(H * 1080 / 1400, VW * 0.48);
      R.store = rect(pad, gap, sw, H);
      const cw2 = Math.min(460, VW - (pad + sw + 56) - pad);
      size(card, cw2);
      R.card = { x: pad + sw + Math.max(56, (VW - pad - sw - cw2 - pad) / 2), y: (VH - card.offsetHeight) / 2 };
    } else {
      const fw = VW - 32;
      R.hero = rect(16, gap, fw, Math.min(fw / 0.72, VH * 0.56));
      size(heroCopy, fw);
      R.heroCopy = { x: 16, y: R.hero.y + R.hero.h + 16 };
      R.lift = { cx: VW * 0.5, cy: VH * 0.42, w: VW * 0.82 };
      R.oneHead = { x: 16, y: gap + 4 };
      R.case = rect(16, gap, fw, Math.min(VH * 0.72, fw * 16 / 9));
      size(caseHead, fw);
      R.caseHead = { x: 16, y: R.case.y + R.case.h + 14 };
      R.boxes = rect(16, gap, fw, fw * 620 / 720);
      size(boxesCopy, fw);
      R.boxesCopy = { x: 16, y: R.boxes.y + R.boxes.h + 14 };
      R.box = rect(16, gap, fw, VH * 0.5);
      size(bulkCopy, fw); size(pullCopy, fw);
      R.bulkCopy = { x: 16, y: R.box.y + R.box.h + 14 };
      R.pullCopy = { x: 16, y: R.box.y + R.box.h + 14 };
      R.store = rect(16, gap, fw, Math.max(150, VH - gap * 3 - (() => { size(card, fw); return card.offsetHeight; })()));
      R.card = { x: 16, y: R.store.y + R.store.h + gap };
    }
    [['hero', heroFrame], ['case', caseFrame], ['boxes', boxesFrame], ['box', boxFrame], ['box', pullFrame], ['store', storeFrame]]
      .forEach(([k, el]) => size(el, R[k].w, R[k].h));
    // the pieces keep their rest size; scale handles the lift
    const pm = cover(R.hero, PLATE.w, PLATE.h);
    R.rest = { cx: pm.x + (CUT.x + CUT.w / 2) * pm.s, cy: pm.y + (CUT.y + CUT.h / 2) * pm.s, w: CUT.w * pm.s };
    size(pieces, R.rest.w, R.rest.w * CUT.h / CUT.w);
    Object.values(LB).concat(Object.values(TG)).forEach((el) => { el._w = el.offsetWidth; el._h = el.offsetHeight; });
    R.oneHeadH = oneHead.offsetHeight;
    R.railW = rail.offsetWidth; lineHead._c = {}; lineFill._c = {};
    spacer.style.height = `${Math.round(VH * (mobile ? 11 : 10.5) + (innerHeight - VH))}px`;
    loadClip(mobile ? 'assets/case-m.mp4' : 'assets/case.mp4');
    dirty = true;
  }

  // ---- leaders: one line + dot per visible label --------------------------------
  let lines = [];
  function drawLeaders(list) {
    const html = list.map(([x1, y1, x2, y2, o]) =>
      `<g opacity="${o.toFixed(3)}"><line x1="${r1(x1)}" y1="${r1(y1)}" x2="${r1(x2)}" y2="${r1(y2)}"/><circle cx="${r1(x2)}" cy="${r1(y2)}" r="4.5"/></g>`).join('');
    if (html !== lines) { svg.innerHTML = html; lines = html; }
  }

  // ---- open now ------------------------------------------------------------------
  function openState() {
    const parts = new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', weekday: 'short', hour: 'numeric', minute: 'numeric', hour12: false }).formatToParts(new Date());
    const g = (t) => parts.find((x) => x.type === t).value;
    const day = g('weekday'), h = (+g('hour') % 24) + (+g('minute')) / 60;
    const close = day === 'Sun' ? 16 : 19, isOpen = h >= 7 && h < close;
    const txt = isOpen ? `Open now, until ${close === 16 ? '4' : '7'} PM` : (h < 7 ? 'Opens today at 7 AM' : 'Closed now, opens 7 AM');
    [['openLine', 'openText'], ['openLine2', 'openText2']].forEach(([l, t]) => { $(l).classList.toggle('is-open', isOpen); $(t).textContent = txt + (l === 'openLine' ? '. Mon to Sat 7 to 7, Sun 7 to 4' : ''); });
  }

  // the clip is loaded whole into memory so every seek is local (any server, iOS)
  let clipSrc = '';
  function loadClip(src) {
    if (src === clipSrc) return; clipSrc = src; haveFrame = false;
    fetch(src).then((r) => r.blob()).then((b) => { if (clipSrc !== src) return; video.src = URL.createObjectURL(b); video.load(); }).catch(() => { video.src = src; });
  }

  // ---- the frame -------------------------------------------------------------------
  let seekBusy = false, wantT = 0, haveFrame = false;
  video.addEventListener('loadedmetadata', () => { dur = video.duration || 4.6; });
  video.addEventListener('loadeddata', () => { haveFrame = true; dirty = true; });
  video.addEventListener('seeked', () => { seekBusy = false; if (Math.abs(video.currentTime - wantT) > 0.02) seek(wantT); });
  function seek(t) { wantT = t; if (seekBusy || video.readyState < 1) return; if (Math.abs(video.currentTime - t) < 0.012) return; seekBusy = true; try { video.currentTime = t; } catch (e) { seekBusy = false; } }
  // iOS will not paint seeks until the element has played once
  const unlock = () => { video.play().then(() => video.pause()).catch(() => {}); removeEventListener('touchstart', unlock); };
  addEventListener('touchstart', unlock, { passive: true });

  function render(p) {
    // 1 hero ----------------------------------------------------------------
    const out = seg(p, 0.045, 0.12);
    move(heroCopy, R.heroCopy.x - (mobile ? 0 : 70) * E(out), R.heroCopy.y + (mobile ? 40 : 0) * E(out));
    fade(heroCopy, 1 - out);
    const lift = E(seg(p, 0.04, 0.15));
    // tray drifts down and is clipped away under the rising pieces
    move(heroFrame, R.hero.x, R.hero.y + lift * VH * 0.12 + p * 40);
    fade(heroFrame, 1 - seg(p, 0.05, 0.12));
    // 2 pieces lift and get labels ----------------------------------------
    const go = E(seg(p, 0.215, 0.27));
    const lw = lerp(R.rest.w, R.lift.w, lift) * (1 - 0.45 * go);
    const cx = lerp(R.rest.cx, R.lift.cx, lift) - go * (mobile ? VW * 0.9 : VW * 0.42);
    const cy = lerp(R.rest.cy, R.lift.cy, lift) - p * 30 * (1 - lift);
    const s = lw / R.rest.w, ph = R.rest.w * CUT.h / CUT.w;
    const L = lean.x * (1 - go), U = lean.y * (1 - go);
    move(pieces, cx - R.rest.w / 2, cy - ph / 2, s, ` perspective(900px) rotateX(${(-U * 8).toFixed(2)}deg) rotateY(${(L * 11).toFixed(2)}deg)`);
    fade(pieces, 1 - seg(p, 0.245, 0.275));
    const hd = seg(p, 0.12, 0.17) * (1 - seg(p, 0.205, 0.235));
    move(oneHead, R.oneHead.x, R.oneHead.y + (1 - O(seg(p, 0.12, 0.17))) * 24); fade(oneHead, hd);
    const pw = lw, phh = lw * CUT.h / CUT.w, px0 = cx - pw / 2, py0 = cy - phh / 2;
    const leaders = [];
    const la = seg(p, 0.13, 0.18) * (1 - seg(p, 0.2, 0.225));
    Object.entries(LB).forEach(([k, el], i) => {
      const a = seg(p, 0.13 + i * 0.012, 0.175 + i * 0.012) * (1 - seg(p, 0.2, 0.225));
      const ax = px0 + ANCH[k][0] * pw, ay = py0 + ANCH[k][1] * phh;
      let lx, ly;
      if (!mobile) {
        if (k === 'mandoca') { lx = px0 + pw + 48; ly = py0 + phh * 0.02; }
        else if (k === 'papita') { lx = px0 - el._w - 70; ly = ay - el._h / 2; }
        else { lx = px0 + pw + 48; ly = Math.max(ay + 36, py0 + phh * 0.02 + LB.mandoca._h + 22); }
      } else {
        if (k === 'mandoca') { lx = VW - 16 - el._w; ly = py0 - el._h - 12; }
        else if (k === 'papita') { lx = 16; ly = py0 + phh + 18; }
        else { lx = VW - 16 - el._w; ly = py0 + phh + 18 + el._h + 10; }
      }
      ly = Math.max(ly, R.oneHead.y + R.oneHeadH + 14);
      move(el, lx, ly + (1 - O(a)) * 14); fade(el, a);
      if (a > 0.01 && la >= 0) {
        const ex = lx + el._w / 2 < ax ? lx + el._w : lx, ey = ly + el._h / 2;
        leaders.push([ex, ey, ax, ay, a]);
      }
    });

    // 3 the counter ------------------------------------------------------------
    const ci = E(seg(p, 0.205, 0.27));
    const hand = E(seg(p, 0.565, 0.63));
    const caseShift = -hand * (R.case.x + R.case.w + 60);
    move(caseFrame, R.case.x + caseShift, R.case.y);
    clip(caseFrame, 0, 0, 0, (1 - ci) * 100);
    put(caseFrame, 'visibility', ci > 0 && hand < 1 ? 'visible' : 'hidden');
    const sc = seg(p, 0.27, 0.56), f = sc * FRAMES;
    if (ci > 0 && hand < 1) seek(Math.min(dur - 0.04, sc * dur));
    fade(poster, haveFrame ? 0 : 1);
    const chA = seg(p, 0.25, 0.29) * (mobile ? 1 - seg(hand, 0, 0.5) : 1 - seg(p, 0.395, 0.425));
    move(caseHead, R.caseHead.x, R.caseHead.y + (1 - O(seg(p, 0.25, 0.29))) * 20); fade(caseHead, chA);
    const vm = cover(R.case, 1080, 1920);
    Object.entries(TG).forEach(([k, el]) => {
      const T = TAGK[k], [nx, ny] = kAt(T.k, f);
      const vis = clamp((f - T.win[0]) / 1.5) * clamp((T.win[1] - f) / 1.5) * seg(p, 0.27, 0.285) * (1 - seg(hand, 0, 0.45));
      const tx = vm.x + nx * 1080 * vm.s + caseShift, ty = vm.y + ny * 1920 * vm.s;
      let lx, ly;
      if (!mobile) { lx = T.side < 0 ? R.case.x + caseShift - 56 - el._w : R.case.x + R.case.w + caseShift + 56; ly = ty - el._h / 2; }
      else { lx = clamp(T.side < 0 ? tx + 22 : tx - el._w - 22, 20, VW - 20 - el._w); ly = ty + (k === 'e' || k === 'pa' ? 26 : 24); }
      ly = clamp(ly, 8, VH - el._h - 8);
      move(el, lx, ly); fade(el, vis);
      const inFrame = tx > R.case.x + caseShift && tx < R.case.x + R.case.w + caseShift;
      if (vis > 0.01 && inFrame) leaders.push([lx + el._w / 2 < tx ? lx + el._w : lx, ly + el._h / 2, tx, ty, vis]);
    });

    // 4 boxes, then one box --------------------------------------------------------
    const push = E(seg(p, 0.68, 0.745));
    move(boxesFrame, lerp(VW + 40, R.boxes.x, hand) - push * (R.boxes.x + R.boxes.w + 60), R.boxes.y);
    put(boxesFrame, 'visibility', hand > 0 && push < 1 ? 'visible' : 'hidden');
    const bcA = seg(p, 0.605, 0.645) * (1 - seg(p, 0.67, 0.7));
    move(boxesCopy, R.boxesCopy.x + (1 - O(seg(p, 0.605, 0.645))) * 30, R.boxesCopy.y); fade(boxesCopy, bcA);
    const pull = E(seg(p, 0.785, 0.84)), close = E(seg(p, 0.875, 0.94));
    const exitX = close * (VW - R.box.x + 40);
    move(boxFrame, R.box.x + exitX, R.box.y);
    clip(boxFrame, 0, 0, 0, (1 - push) * 100);
    put(boxFrame, 'visibility', push > 0 && pull < 1 ? 'visible' : 'hidden');
    const blA = seg(p, 0.72, 0.76) * (1 - seg(p, 0.77, 0.79));
    move(bulkCopy, R.bulkCopy.x, R.bulkCopy.y + (1 - O(seg(p, 0.72, 0.76))) * 24); fade(bulkCopy, blA);

    // 5 inside -------------------------------------------------------------------
    move(pullFrame, R.box.x + exitX, R.box.y);
    clip(pullFrame, (1 - pull) * 100, 0, 0, 0);
    put(pullFrame, 'visibility', pull > 0 && close < 1 ? 'visible' : 'hidden');
    const puA = seg(p, 0.815, 0.855) * (1 - seg(p, 0.86, 0.885));
    move(pullCopy, R.pullCopy.x, R.pullCopy.y + (1 - O(seg(p, 0.815, 0.855))) * 24); fade(pullCopy, puA);

    // 6 visit --------------------------------------------------------------------
    move(storeFrame, R.store.x, R.store.y);
    clip(storeFrame, 0, (1 - close) * 100, 0, 0);
    put(storeFrame, 'visibility', close > 0 ? 'visible' : 'hidden');
    const cA = seg(p, 0.905, 0.95);
    move(card, R.card.x, R.card.y + (1 - O(cA)) * 30); fade(card, cA);
    put(card, 'pointerEvents', cA > 0.5 ? 'auto' : 'none');

    drawLeaders(leaders);
    root.classList.toggle('at-end', p > 0.97);

    // header timeline: stops are evenly spaced, so map p between the stop values
    let k = 0; while (k < SP.length - 2 && p >= SP[k + 1]) k++;
    const pos = clamp((k + clamp((p - SP[k]) / (SP[k + 1] - SP[k]))) / (SP.length - 1));
    put(lineFill, 'transform', `scaleX(${pos.toFixed(4)})`);
    put(lineHead, 'transform', `translateX(${r1(pos * R.railW)}px)`);
    const nowI = SP.reduce((acc, v, i) => (p >= v - 0.02 ? i : acc), 0);
    stops.forEach((b, i) => { b.classList.toggle('past', i < nowI || p >= 0.995); b.classList.toggle('now', i === nowI); if (i === nowI) b.setAttribute('aria-current', 'step'); else b.removeAttribute('aria-current'); });
  }

  // ---- loop: smoothed scroll ---------------------------------------------------------
  let target = 0, cur = 0, raf = 0;
  const readScroll = () => { target = clamp(scrollY / Math.max(1, document.documentElement.scrollHeight - innerHeight)); };
  function frame() {
    raf = 0;
    const k = reduced.matches ? 1 : 0.16;
    cur += (target - cur) * k; if (Math.abs(target - cur) < 0.00005) cur = target;
    lean.x += (leanT.x - lean.x) * 0.2; lean.y += (leanT.y - lean.y) * 0.2;
    if (dirty || true) { render(cur); dirty = false; }
    if (cur !== target || Math.abs(leanT.x - lean.x) > 0.001 || Math.abs(leanT.y - lean.y) > 0.001) raf = requestAnimationFrame(frame);
  }
  const kick = () => { if (!raf) raf = requestAnimationFrame(frame); };
  addEventListener('scroll', () => { readScroll(); kick(); }, { passive: true });
  addEventListener('resize', () => { layout(); readScroll(); kick(); });
  addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse' || reduced.matches) return;
    const r = pieces.getBoundingClientRect();
    leanT.x = clamp((e.clientX - (r.left + r.width / 2)) / (VW * 0.5), -1, 1);
    leanT.y = clamp((e.clientY - (r.top + r.height / 2)) / (VH * 0.5), -1, 1);
    kick();
  }, { passive: true });

  // jump links: index tags and the brand
  document.querySelectorAll('[data-go]').forEach((el) => el.addEventListener('click', (e) => {
    e.preventDefault();
    const go = +el.dataset.go, y = go * (document.documentElement.scrollHeight - innerHeight);
    scrollTo({ top: y, behavior: reduced.matches ? 'auto' : 'smooth' });
  }));

  function start() {
    layout(); openState(); setInterval(openState, 60000);
    const q = new URLSearchParams(location.search).get('p');
    if (q !== null) { const y = clamp(+q) * (document.documentElement.scrollHeight - innerHeight); scrollTo(0, y); target = cur = clamp(+q); }
    readScroll(); cur = target; render(cur); kick();
  }
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(start); else addEventListener('load', start);
})();
