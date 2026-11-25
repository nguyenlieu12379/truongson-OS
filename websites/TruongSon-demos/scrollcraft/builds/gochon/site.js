/* Gochón: one fixed stage, one timeline p (0..1) from smoothed scroll, plus a clock for idle motion.
   Nothing fades between scenes: every scene's end builds the next one's start.
   1 hero: their tray, centred, the three pieces breathing on it; the five pieces of the counter float
     around it with names and prices
   2 the tray drops away, the pieces lift; three of the floaters fly into them, two drift to the margins;
     labels grow out of the pieces
   3 the counter grows out from behind the pieces while they shrink into it; the Papitas label slides
     onto its shelf tag, the Mandocas label waits at the tag's height until the camera reaches it.
     Peak: the pan along their case, scrubbed, labels pinned to the printed tags
   4 the pan carries on into three party boxes; the right box grows into the full box (wholesale)
   5 a tequeño pulled apart rolls up over the box
   6 it slides across onto the storefront and rolls up to reveal it; the order card slides in. Holds.
   Five real cutouts drift through the blank space of every scene. ?p=0.42 jumps there. */
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
  const KEYS = ['tequeno', 'papita', 'mandoca', 'empanada', 'pastelito'];
  const D = Object.fromEntries(KEYS.map((k) => [k, $(`d-${k}`)]));
  const C = Object.fromEntries(KEYS.map((k) => [k, $(`c-${k}`)]));
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');

  const clamp = (v, a = 0, b = 1) => (v < a ? a : v > b ? b : v);
  const seg = (p, a, b) => clamp((p - a) / (b - a));
  const E = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const O = (t) => 1 - Math.pow(1 - t, 3);
  const lerp = (a, b, t) => a + (b - a) * t;
  const r1 = (v) => Math.round(v * 10) / 10;
  const put = (el, prop, val) => { const c = el._c || (el._c = {}); if (c[prop] !== val) { c[prop] = val; el.style[prop] = val; } };
  const move = (el, x, y, s = 1, extra = '') => put(el, 'transform', `translate3d(${r1(x)}px,${r1(y)}px,0)${s !== 1 ? ` scale(${s.toFixed(4)})` : ''}${extra}`);
  const vis = (el, on) => put(el, 'visibility', on ? 'visible' : 'hidden');
  const clip = (el, t, r, b, l) => put(el, 'clipPath', `inset(${r1(t)}% ${r1(r)}% ${r1(b)}% ${r1(l)}%)`);
  const size = (el, w, h) => { put(el, 'width', `${Math.round(w)}px`); if (h != null) put(el, 'height', `${Math.round(h)}px`); };

  const PLATE = { w: 1080, h: 1500 }, CUT = { x: 260, y: 209, w: 735, h: 597 };
  const ANCH = { mandoca: [0.50, 0.10], papita: [0.22, 0.70], tequeno: [0.83, 0.40] };
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
  // timeline windows: when each scene hands over to the next
  const T = { lift: [0.04, 0.15], label: [0.13, 0.18], counter: [0.205, 0.27], scrub: [0.27, 0.56], pan: [0.565, 0.63], grow: [0.68, 0.745], pull: [0.785, 0.84], slide: [0.875, 0.915], roll: [0.915, 0.955] };
  const SCENE_AT = [0, T.lift, T.counter, T.pan, T.grow, T.slide]; // drifter slot sets change on these windows

  let VW = 0, VH = 0, mobile = false, R = {}, dur = 4.6;
  let lean = { x: 0, y: 0 }, leanT = { x: 0, y: 0 };
  const cover = (r, iw, ih) => { const s = Math.max(r.w / iw, r.h / ih); return { s, x: r.x + (r.w - iw * s) / 2, y: r.y + (r.h - ih * s) / 2 }; };
  const rect = (x, y, w, h) => ({ x, y, w, h });

  // ---- layout (measured once per resize) --------------------------------------------
  function layout() {
    VW = root.clientWidth; VH = stage.clientHeight; mobile = VW <= 760;
    [...stage.querySelectorAll('*')].forEach((el) => { el._c = {}; el.style.transform = ''; el.style.clipPath = ''; });
    const pad = mobile ? 16 : clamp(VW * 0.04, 16, 64), gap = mobile ? 12 : clamp(VH * 0.035, 14, 32);
    const H = VH - gap * 2;

    // hero: title on top, the tray centred under it, the five pieces around (desktop) or below (phone)
    size(heroCopy, Math.min(1100, VW - pad * 2));
    R.heroCopy = { x: (VW - heroCopy.offsetWidth) / 2, y: mobile ? 10 : 14 };
    const top = R.heroCopy.y + heroCopy.offsetHeight + (mobile ? 12 : 20);
    const bottom = mobile ? VH - 118 : VH - gap;
    let fh = bottom - top, fw = fh * 0.72;
    if (fw > VW * (mobile ? 0.78 : 0.34)) { fw = VW * (mobile ? 0.78 : 0.34); fh = fw / 0.72; }
    R.hero = rect((VW - fw) / 2, top + (bottom - top - fh) / 2, fw, fh);
    const pm = cover(R.hero, PLATE.w, PLATE.h), pop = 1.16;   // the pieces break out of the frame a little
    R.rest = { cx: pm.x + (CUT.x + CUT.w / 2) * pm.s, cy: pm.y + (CUT.y + CUT.h / 2) * pm.s, w: CUT.w * pm.s * pop };
    size(pieces, R.rest.w, R.rest.w * CUT.h / CUT.w);
    R.lift = mobile ? { cx: VW * 0.5, cy: VH * 0.42, w: VW * 0.82 } : { cx: VW * 0.53, cy: VH * 0.56, w: Math.min(VW * 0.40, VH * 0.6 * CUT.w / CUT.h) };

    // the five pieces: their own size, a hero slot each
    const ds = mobile ? Math.min(62, VW / 6.4) : clamp(VW * 0.085, 96, 150);
    KEYS.forEach((k) => { const el = D[k]; const ar = el.height / el.width; el._s = ar > 1 ? ds / ar : ds; size(el, el._s, el._s * ar); el._w = el._s; el._h = el._s * ar; C[k]._w = C[k].offsetWidth; C[k]._h = C[k].offsetHeight; });
    const heroSlots = mobile
      ? KEYS.map((k, i) => [(i + 0.5) / 5 * VW, VH - 78])
      : [[0.23, 0.40], [0.13, 0.66], [0.78, 0.36], [0.88, 0.60], [0.75, 0.82]].map(([x, y]) => [x * VW, top + y * (VH - top)]);
    R.slots = [heroSlots];

    R.oneHead = { x: mobile ? 16 : pad, y: gap + (mobile ? 4 : 8) };
    const ch = mobile ? Math.min(VH * 0.72, (VW - 32) * 16 / 9) : H, cw = mobile ? VW - 32 : ch * 9 / 16;
    R.case = rect(mobile ? 16 : (VW - cw) / 2, gap, cw, ch);
    size(caseHead, mobile ? VW - 32 : Math.min(400, VW - (R.case.x + cw + 56) - pad));
    R.caseHead = mobile ? { x: 16, y: R.case.y + R.case.h + 14 } : { x: R.case.x + cw + 56, y: VH - caseHead.offsetHeight - gap - 10 };

    if (!mobile) {
      const bw = Math.min(VW * 0.5, H * 0.92 * 720 / 620), bh = bw * 620 / 720;
      R.boxes = rect(pad + VW * 0.02, (VH - bh) / 2, bw, bh);
      size(boxesCopy, Math.min(440, VW - (R.boxes.x + bw + 64) - pad));
      R.boxesCopy = { x: R.boxes.x + bw + 64, y: (VH - boxesCopy.offsetHeight) / 2 };
      const tw = H * 0.5625;
      R.box = rect(VW - pad - tw - VW * 0.05, gap, tw, H);
      size(bulkCopy, Math.min(520, R.box.x - pad - 80)); size(pullCopy, Math.min(520, R.box.x - pad - 80));
      R.bulkCopy = { x: pad + VW * 0.04, y: (VH - bulkCopy.offsetHeight) / 2 };
      R.pullCopy = { x: pad + VW * 0.04, y: (VH - pullCopy.offsetHeight) / 2 };
      R.store = rect(pad, gap, Math.min(H * 1080 / 1400, VW * 0.48), H);
      const cw2 = Math.min(460, VW - (pad + R.store.w + 56) - pad);
      size(card, cw2);
      R.card = { x: pad + R.store.w + Math.max(56, (VW - pad - R.store.w - cw2 - pad) / 2), y: (VH - card.offsetHeight) / 2 };
    } else {
      const fw2 = VW - 32;
      R.boxes = rect(16, gap, fw2, fw2 * 620 / 720);
      size(boxesCopy, fw2); R.boxesCopy = { x: 16, y: R.boxes.y + R.boxes.h + 14 };
      R.box = rect(16, gap, fw2, VH * 0.5);
      size(bulkCopy, fw2); size(pullCopy, fw2);
      R.bulkCopy = { x: 16, y: R.box.y + R.box.h + 14 }; R.pullCopy = { x: 16, y: R.box.y + R.box.h + 14 };
      size(card, fw2);
      R.store = rect(16, gap, fw2, Math.max(150, VH - gap * 3 - card.offsetHeight));
      R.card = { x: 16, y: R.store.y + R.store.h + gap };
    }
    [['hero', heroFrame], ['case', caseFrame], ['boxes', boxesFrame], ['box', boxFrame], ['box', pullFrame], ['store', storeFrame]]
      .forEach(([k, el]) => size(el, R[k].w, R[k].h));
    Object.values(LB).concat(Object.values(TG)).forEach((el) => { el._w = el.offsetWidth; el._h = el.offsetHeight; });
    R.oneHeadH = oneHead.offsetHeight;

    // drifter slots for the later scenes: blank space only (shares of the stage)
    const off = (i) => [VW * (0.2 + 0.15 * i), VH + 140];      // phones: the pieces leave downward
    const sl = (pts) => (mobile ? KEYS.map((_, i) => off(i)) : pts.map(([x, y]) => [x * VW, y * VH]));
    const cR = R.case.x + R.case.w, bR = R.boxes.x + R.boxes.w;
    R.slots.push(sl([[0.93, 0.12], [0.06, 0.86], [0.90, 0.84], [0.08, 0.30], [0.95, 0.42]]));               // pieces scene
    R.slots.push(sl([[0.08, 0.84], [0.2, 0.92], [(cR / VW + 1) / 2, 0.40], [0.1, 0.66], [0.95, 0.09]])); // counter
    R.slots.push(sl([[bR / VW + 0.06, 0.16], [bR / VW + 0.16, 0.12], [0.93, 0.86], [0.10, 0.08], [bR / VW + 0.26, 0.88]]));  // boxes
    R.slots.push(sl([[0.56, 0.16], [0.62, 0.46], [0.52, 0.74], [0.6, 0.92], [0.08, 0.1]]));                 // box / pull
    R.slots.push(sl([[(R.store.x + R.store.w) / VW + 0.06, 0.1], [0.95, 0.12], [(R.store.x + R.store.w) / VW + 0.05, 0.9], [0.95, 0.88], [0.78, 0.06]])); // store
    spacer.style.height = `${Math.round(VH * (mobile ? 11 : 10.5) + (innerHeight - VH))}px`;
    loadClip(mobile ? 'assets/case-m.mp4' : 'assets/case.mp4');
  }

  // ---- leaders -------------------------------------------------------------------------
  let lines = '';
  function drawLeaders(list) {
    const html = list.map(([x1, y1, x2, y2, o]) => `<g opacity="${o.toFixed(3)}"><line x1="${r1(x1)}" y1="${r1(y1)}" x2="${r1(x2)}" y2="${r1(y2)}"/><circle cx="${r1(x2)}" cy="${r1(y2)}" r="4.5"/></g>`).join('');
    if (html !== lines) { svg.innerHTML = html; lines = html; }
  }

  // ---- open now ------------------------------------------------------------------------
  function openState() {
    const parts = new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', weekday: 'short', hour: 'numeric', minute: 'numeric', hour12: false }).formatToParts(new Date());
    const g = (t) => parts.find((x) => x.type === t).value;
    const day = g('weekday'), h = (+g('hour') % 24) + (+g('minute')) / 60;
    const close = day === 'Sun' ? 16 : 19, isOpen = h >= 7 && h < close;
    const txt = isOpen ? `Open now, until ${close === 16 ? '4' : '7'} PM` : (h < 7 ? 'Opens today at 7 AM' : 'Closed now, opens 7 AM');
    [['openLine', 'openText'], ['openLine2', 'openText2']].forEach(([l, t]) => { $(l).classList.toggle('is-open', isOpen); $(t).textContent = txt; });
  }

  // ---- the clip -------------------------------------------------------------------------
  let clipSrc = '', seekBusy = false, wantT = 0, haveFrame = false;
  function loadClip(src) {
    if (src === clipSrc) return; clipSrc = src; haveFrame = false;
    fetch(src).then((r) => r.blob()).then((b) => { if (clipSrc !== src) return; video.src = URL.createObjectURL(b); video.load(); }).catch(() => { video.src = src; });
  }
  video.addEventListener('loadedmetadata', () => { dur = video.duration || 4.6; });
  video.addEventListener('loadeddata', () => { haveFrame = true; });
  video.addEventListener('seeked', () => { seekBusy = false; if (Math.abs(video.currentTime - wantT) > 0.02) seek(wantT); });
  function seek(t) { wantT = t; if (seekBusy || video.readyState < 1) return; if (Math.abs(video.currentTime - t) < 0.012) return; seekBusy = true; try { video.currentTime = t; } catch (e) { seekBusy = false; } }
  const unlock = () => { video.play().then(() => video.pause()).catch(() => {}); removeEventListener('touchstart', unlock); };
  addEventListener('touchstart', unlock, { passive: true });

  // where a shelf-tag label sits for frame f (both the tag labels and the hand-off use this)
  function tagSpot(k, f, shift = 0) {
    const vm = cover(R.case, 1080, 1920), el = TG[k], Tk = TAGK[k], [nx, ny] = kAt(Tk.k, f);
    const tx = vm.x + nx * 1080 * vm.s + shift, ty = vm.y + ny * 1920 * vm.s;
    let lx, ly;
    if (!mobile) { lx = Tk.side < 0 ? R.case.x + shift - 56 - el._w : R.case.x + R.case.w + shift + 56; ly = ty - el._h / 2; }
    else { lx = clamp(Tk.side < 0 ? tx + 22 : tx - el._w - 22, 20, VW - 20 - el._w); ly = ty + 24; }
    return { tx, ty, lx, ly: clamp(ly, 8, VH - el._h - 8) };
  }

  // ---- render -----------------------------------------------------------------------------
  function render(p, t) {
    const idle = reduced.matches ? 0 : 1;
    const bob = (ph, a) => Math.sin(t * 1.1 + ph) * a * idle;
    const leaders = [];

    // 1 hero: title rises away under the bar, tray drops away, pieces lift ------------------
    const lift = E(seg(p, ...T.lift));
    move(heroCopy, R.heroCopy.x, R.heroCopy.y - lift * (R.heroCopy.y + heroCopy.offsetHeight + 90));
    move(heroFrame, R.hero.x, R.hero.y + lift * (VH - R.hero.y + 40), 1, ` rotate(${(lift * 4).toFixed(2)}deg)`);
    vis(heroFrame, lift < 1);
    // 2 pieces; 3 they shrink into the counter that grows out from behind them
    const ci = E(seg(p, ...T.counter));
    const lw = lerp(R.rest.w, R.lift.w, lift) * lerp(1, 0.18, ci);
    const caseC = { x: R.case.x + R.case.w / 2, y: R.case.y + R.case.h * 0.42 };
    const cx = lerp(lerp(R.rest.cx, R.lift.cx, lift), caseC.x, ci) + bob(0, 3) * (1 - ci);
    const cy = lerp(lerp(R.rest.cy, R.lift.cy, lift), caseC.y, ci) + bob(1.3, 7) * (1 - ci);
    const s = lw / R.rest.w, ph = R.rest.w * CUT.h / CUT.w;
    const L = lean.x * (1 - ci), U = lean.y * (1 - ci);
    move(pieces, cx - R.rest.w / 2, cy - ph / 2, s, ` perspective(900px) rotateX(${(-U * 8 + bob(2, 1.2)).toFixed(2)}deg) rotateY(${(L * 11).toFixed(2)}deg) rotate(${bob(0.6, 1.4).toFixed(2)}deg)`);
    vis(pieces, ci < 0.995);
    const pw = lw, phh = lw * CUT.h / CUT.w, px0 = cx - pw / 2, py0 = cy - phh / 2;

    // one-of-each heading: slides down from under the bar, then back up under it
    const hIn = O(seg(p, 0.12, 0.17)), hOut = E(seg(p, 0.2, 0.24));
    move(oneHead, R.oneHead.x, R.oneHead.y - (1 - hIn + hOut) * (R.oneHead.y + R.oneHeadH + 30));

    // labels grow out of the pieces; papitas and mandocas hand over to their shelf tags
    const hand = E(seg(p, ...T.pan));
    const caseShift = -hand * (R.case.x + R.case.w + 60);
    Object.entries(LB).forEach(([k, el], i) => {
      const g = O(seg(p, T.label[0] + i * 0.012, T.label[1] + i * 0.012));
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
      // hand-off during the counter's arrival
      let to = null, showLine = true;
      if (k === 'papita') to = tagSpot('p', 0);
      else if (k === 'mandoca' && !mobile) to = tagSpot('m', TAGK.m.win[0]);
      if (to) { lx = lerp(lx, to.lx, ci); ly = lerp(ly, to.ly, ci); }
      else { lx += ci * (VW - lx + 40); }                       // the others leave by the right edge
      const done = k === 'papita' ? ci >= 1 : (k === 'mandoca' && !mobile ? seg(p, ...T.scrub) * FRAMES >= TAGK.m.win[0] : ci >= 1);
      const sc = lerp(0.001, 1, g);
      put(el, 'transformOrigin', lx + el._w / 2 < ax ? '100% 50%' : '0% 50%');
      move(el, lx, ly, 1, ` scaleX(${sc.toFixed(3)})`);
      vis(el, g > 0.01 && !done && p < T.pan[1]);
      if (k === 'mandoca' && ci > 0) showLine = false;
      if (g > 0.05 && ci < 1 && showLine) {
        const tx = to ? lerp(ax, to.tx, ci) : ax, ty = to ? lerp(ay, to.ty, ci) : ay;
        leaders.push([lx + el._w / 2 < tx ? lx + el._w * sc : lx, ly + el._h / 2, tx, ty, g * (k === 'tequeno' ? 1 - ci : 1)]);
      }
    });

    // 3 the counter ----------------------------------------------------------------------------
    // grows from a card the size of the pieces to the full case, centred on the pieces
    const k0 = (R.lift.w * 0.9 * CUT.h / CUT.w) / R.case.h;
    const ks = lerp(k0, 1, ci);
    const fromX = R.lift.cx - R.case.w / 2, fromY = R.lift.cy - R.case.h / 2;
    put(caseFrame, 'transformOrigin', '50% 50%');
    move(caseFrame, lerp(fromX, R.case.x, ci) + caseShift, lerp(fromY, R.case.y, ci), ks);
    vis(caseFrame, ci > 0 && hand < 1);
    const sc = seg(p, ...T.scrub), f = sc * FRAMES;
    if (ci > 0 && hand < 1) seek(Math.min(dur - 0.04, sc * dur));
    put(poster, 'opacity', haveFrame ? '0' : '1');
    const chIn = O(seg(p, 0.25, 0.29)), chOut = mobile ? E(seg(hand, 0, 0.6)) : E(seg(p, 0.395, 0.425));
    move(caseHead, R.caseHead.x + (mobile ? -chOut * (VW + 40) : (1 - chIn + chOut) * (VW - R.caseHead.x + 40)), R.caseHead.y + (mobile ? (1 - chIn) * 60 : 0));
    vis(caseHead, chIn > 0 && chOut < 1);
    Object.entries(TG).forEach(([k, el]) => {
      const Tk = TAGK[k], sp = tagSpot(k, f, caseShift);
      // grows out of the tag as it enters, pulled back into it as it leaves
      let g = clamp((f - Tk.win[0]) / 1.5) * clamp((Tk.win[1] - f) / 1.5);
      if (k === 'p') g = clamp((Tk.win[1] - f) / 1.5);             // arrives already open (handed over)
      if (k === 'm' && !mobile) g = clamp((Tk.win[1] - f) / 1.5) * (f >= Tk.win[0] ? 1 : 0);
      const on = p >= T.scrub[0] && g > 0.01 && hand < 0.999;
      const scx = O(g);
      put(el, 'transformOrigin', Tk.side < 0 && !mobile ? '100% 50%' : (mobile ? (Tk.side < 0 ? '0% 50%' : '100% 50%') : '0% 50%'));
      move(el, sp.lx, sp.ly, 1, ` scaleX(${Math.max(0.001, scx).toFixed(3)})`);
      vis(el, on);
      const inFrame = sp.tx > R.case.x + caseShift && sp.tx < R.case.x + R.case.w + caseShift;
      if (on && inFrame) leaders.push([sp.lx + el._w / 2 < sp.tx ? sp.lx + el._w * scx : sp.lx + el._w * (1 - scx), sp.ly + el._h / 2, sp.tx, sp.ty, 1]);
    });

    // 4 the pan carries on into the boxes; the right box grows into the full box ------------------
    const grow = E(seg(p, ...T.grow));
    const bx = lerp(VW + 40, R.boxes.x, hand) - grow * (R.boxes.x + R.boxes.w + 60);
    move(boxesFrame, bx, R.boxes.y, 1 + grow * 0.25);
    put(boxesFrame, 'transformOrigin', '100% 55%');
    vis(boxesFrame, hand > 0 && grow < 1);
    const bcIn = hand, bcOut = E(seg(p, 0.665, 0.7));
    move(boxesCopy, R.boxesCopy.x + (mobile ? (1 - bcIn) * (VW + 40) : bx - R.boxes.x) + bcOut * (VW - R.boxesCopy.x + 60), R.boxesCopy.y);
    vis(boxesCopy, bcIn > 0 && bcOut < 1 && (mobile || bx < VW));
    // the right box of the three (as it sits on screen) becomes the full box frame
    const sub = { x: bx + R.boxes.w * 0.68, y: R.boxes.y + R.boxes.h * 0.12, w: R.boxes.w * 0.32, h: R.boxes.h * 0.62 };
    const pull = E(seg(p, ...T.pull)), slide = E(seg(p, ...T.slide)), roll = E(seg(p, ...T.roll));
    const k1 = sub.w / R.box.w, ksb = lerp(k1, 1, grow);
    const visH = lerp(Math.min(1, sub.h / (R.box.h * k1)), 1, grow);
    move(boxFrame, lerp(sub.x + sub.w / 2 - R.box.w / 2, R.box.x, grow), lerp(sub.y + sub.h / 2 - R.box.h / 2, R.box.y, grow), ksb);
    put(boxFrame, 'transformOrigin', '50% 50%');
    clip(boxFrame, (1 - visH) * 50, 0, (1 - visH) * 50, 0);
    vis(boxFrame, grow > 0 && pull < 1);
    const blIn = O(seg(p, 0.71, 0.75)), blOut = E(seg(p, 0.77, 0.8));
    move(bulkCopy, R.bulkCopy.x - (1 - blIn) * (R.bulkCopy.x + bulkCopy.offsetWidth + 40), R.bulkCopy.y - blOut * (R.bulkCopy.y + bulkCopy.offsetHeight + 40));
    vis(bulkCopy, blIn > 0 && blOut < 1);

    // 5 the cheese pull rolls up over the box --------------------------------------------------
    const slideX = lerp(R.box.x, R.store.x + (R.store.w - R.box.w) / 2, slide);
    move(pullFrame, slideX, R.box.y);
    clip(pullFrame, (1 - pull) * 100, 0, roll * 100, 0);
    vis(pullFrame, pull > 0 && roll < 1);
    const puIn = O(seg(p, 0.8, 0.85)), puOut = E(seg(p, 0.86, 0.89));
    move(pullCopy, R.pullCopy.x, R.pullCopy.y + (1 - puIn) * (VH - R.pullCopy.y + 40) - puOut * (R.pullCopy.y + pullCopy.offsetHeight + 40));
    vis(pullCopy, puIn > 0 && puOut < 1);

    // 6 it slides onto the storefront and rolls up to reveal it; the card slides in --------------
    move(storeFrame, R.store.x, R.store.y);
    clip(storeFrame, 0, 0, 0, 0);
    vis(storeFrame, roll > 0);
    const cIn = O(seg(p, 0.9, 0.95));
    move(card, R.card.x + (1 - cIn) * (VW - R.card.x + 60), R.card.y);
    vis(card, cIn > 0);
    put(card, 'pointerEvents', cIn > 0.9 ? 'auto' : 'none');

    // the five pieces: hero slots, then they drift through the blank space of each scene ----------
    const absorb = { tequeno: 'tequeno', papita: 'papita', mandoca: 'mandoca' };
    KEYS.forEach((k, i) => {
      const el = D[k], cap = C[k];
      // which two slot sets are we between
      let a = R.slots[0], b = R.slots[0], tt = 0;
      for (let s2 = 1; s2 < SCENE_AT.length; s2++) {
        const w = SCENE_AT[s2];
        if (p >= w[0]) { a = R.slots[s2 - 1]; b = R.slots[s2]; tt = E(seg(p, w[0], w[1])); }
      }
      let x = lerp(a[i][0], b[i][0], tt), y = lerp(a[i][1], b[i][1], tt), sc2 = 1;
      // three of them fly into the big pieces during the lift, and come back out as the pieces shrink
      if (absorb[k] && !mobile) {
        const ax = px0 + ANCH[k][0] * pw, ay = py0 + ANCH[k][1] * phh;
        const into = E(seg(p, T.lift[0], T.lift[1] - 0.02)) * (1 - E(seg(p, T.counter[0], T.counter[1])));
        x = lerp(x, ax, into); y = lerp(y, ay, into); sc2 = lerp(1, 0.2, into);
      }
      const dx = bob(i * 1.7, 6), dy = bob(i * 2.3 + 1, 9), rot = bob(i * 0.9, 7);
      const s3 = sc2 * (p > 0.12 && !mobile ? 0.78 : 1);
      move(el, x - el._w / 2 + dx, y - el._h / 2 + dy, s3, ` rotate(${rot.toFixed(2)}deg)`);
      vis(el, sc2 > 0.22 || !absorb[k]);
      // captions: only in the hero; they drop away with the tray
      const hs = R.slots[0][i], capDrop = E(seg(p, T.lift[0], T.lift[0] + 0.05));
      move(cap, hs[0] - cap._w / 2 + dx * 0.5, hs[1] + el._h / 2 + (mobile ? 6 : 10) + dy * 0.6 + capDrop * (VH - hs[1] + 60), 1);
      vis(cap, capDrop < 1);
    });

    drawLeaders(leaders);
    root.classList.toggle('at-end', p > 0.97);
  }

  // ---- loop: smoothed scroll + idle clock ------------------------------------------------------
  let target = 0, cur = 0;
  const readScroll = () => { target = clamp(scrollY / Math.max(1, document.documentElement.scrollHeight - innerHeight)); };
  let last = performance.now(), clock = 0, running = true;
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000); last = now; clock += dt;
    const k = reduced.matches ? 1 : 1 - Math.pow(1 - 0.16, dt * 60);
    cur += (target - cur) * k; if (Math.abs(target - cur) < 0.00005) cur = target;
    lean.x += (leanT.x - lean.x) * 0.2; lean.y += (leanT.y - lean.y) * 0.2;
    render(cur, clock);
    if (running) requestAnimationFrame(frame);
  }
  document.addEventListener('visibilitychange', () => { running = !document.hidden; if (running) { last = performance.now(); requestAnimationFrame(frame); } });
  addEventListener('scroll', readScroll, { passive: true });
  addEventListener('resize', () => { layout(); readScroll(); });
  addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse' || reduced.matches) return;
    leanT.x = clamp((e.clientX - VW / 2) / (VW * 0.5), -1, 1);
    leanT.y = clamp((e.clientY - VH / 2) / (VH * 0.5), -1, 1);
  }, { passive: true });
  document.querySelectorAll('[data-go]').forEach((el) => el.addEventListener('click', (e) => {
    e.preventDefault();
    scrollTo({ top: +el.dataset.go * (document.documentElement.scrollHeight - innerHeight), behavior: reduced.matches ? 'auto' : 'smooth' });
  }));

  function start() {
    layout(); openState(); setInterval(openState, 60000);
    const q = new URLSearchParams(location.search).get('p');
    if (q !== null) { scrollTo(0, clamp(+q) * (document.documentElement.scrollHeight - innerHeight)); }
    readScroll(); cur = target; requestAnimationFrame(frame);
  }
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(start); else addEventListener('load', start);
})();
