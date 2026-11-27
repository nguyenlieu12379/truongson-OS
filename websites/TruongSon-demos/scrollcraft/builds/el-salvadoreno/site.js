/* El Salvadoreño v2, the flag: one fixed stage of three bands (blue, white, blue). The bands never leave;
   they change proportion to frame each scene. Nothing fades: every scene's end builds the next one's start.
   1 hero: "EL SALVADOREÑO" on the top band, their pupusa centred on the white band as the emblem, breathing,
     leaning to the cursor; the letters it covers ripple
   2 the bands pull back to stripes, the word lifts away, the pupusa slides left and grows; the twelve pupusas
     and their prices set beside it
   3 peak: the bands open, the pupusa shrinks into the white band and leads the kitchen across it;
     categories run left in the top band, hours and the order line run right in the bottom band
   4 the kitchen carries off; their 25-pupusa tray opens from the centre of the white band; party tray prices
   5 the tray slides off left, the flag returns, the pupusa comes back as the emblem, the order card sits
     across the top band's edge. Holds.
   ?p=0.4 jumps there. */
(() => {
  const $ = (s) => document.getElementById(s);
  const root = document.documentElement;
  const stage = $('stage'), bar = $('bar');
  const E = {
    top: $('bTop'), mid: $('bMid'), bot: $('bBot'), word: $('word'), runTop: $('runTop'), runBot: $('runBot'),
    trayTop: $('trayTop'), trayBot: $('trayBot'), heroLine: $('heroLine'), tray: $('tray'), sideL: $('sideL'), sideR: $('sideR'),
    fill: $('fill'), pup: $('pup'), pupCap: $('pupCap'), drift: $('drift'), card: $('card'),
  };
  const chars = [...E.word.querySelectorAll('.ch')];
  const dishes = [...document.querySelectorAll('.dish')];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');

  const clamp = (v, a = 0, b = 1) => (v < a ? a : v > b ? b : v);
  const seg = (p, a, b) => clamp((p - a) / (b - a));
  const E3 = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const lerp = (a, b, t) => a + (b - a) * t;
  const r1 = (v) => Math.round(v * 10) / 10;
  const put = (el, k, v) => { const c = el._c || (el._c = {}); if (c[k] !== v) { c[k] = v; el.style[k] = v; } };
  const at = (el, x, y, s = 1, rot = '') => put(el, 'transform', `translate3d(${r1(x)}px,${r1(y)}px,0)${s !== 1 ? ` scale(${s.toFixed(4)})` : ''}${rot}`);
  const vis = (el, on) => put(el, 'visibility', on ? 'visible' : 'hidden');

  const T = { toFill: [0.04, 0.13], toRails: [0.19, 0.27], rails: [0.27, 0.6], toTray: [0.6, 0.68], toClose: [0.76, 0.86] };

  let VW = 0, VH = 0, TOP = 64, mob = false, L = {};
  let p = 0, pT = 0, t0 = performance.now(), forced = null, running = false;
  let lean = { x: 0, y: 0 }, leanT = { x: 0, y: 0 };
  const q = new URLSearchParams(location.search).get('p');
  if (q !== null && !isNaN(+q)) forced = clamp(+q);

  // band states: [top, bottom] heights as a share of the screen (the white band is what is left)
  const BANDS = {
    hero: () => (mob ? [0.27, 0.27] : [0.35, 0.27]),
    fill: () => [10 / VH, 10 / VH],
    rails: () => (mob ? [0.2, 0.2] : [0.21, 0.21]),
    tray: () => [0.19, 0.19],
    close: () => (mob ? [0.17, 0.12] : [0.28, 0.2]),
  };

  function layout() {
    [...stage.querySelectorAll('*')].concat([...stage.children]).forEach((el) => { el._c = {}; el.style.transform = ''; el.style.visibility = ''; });
    VW = root.clientWidth; VH = stage.clientHeight; mob = VW <= 760; TOP = bar.offsetHeight;
    const pad = mob ? 16 : Math.min(56, Math.max(24, VW * 0.035));
    L.pad = pad;

    // the word fills the width; letters remember their centre for the ripple
    E.word.style.fontSize = '100px';
    const ww = E.word.scrollWidth;
    const fs = Math.min((VW - pad * 2) / ww * 100, VH * 0.2);
    E.word.style.fontSize = `${fs}px`;
    L.wordW = E.word.scrollWidth; L.wordH = E.word.offsetHeight;
    L.chx = chars.map((c) => c.offsetLeft + c.offsetWidth / 2);

    // the emblem
    const [h0t, h0b] = BANDS.hero(), midH0 = VH * (1 - h0t - h0b);
    L.s0 = mob ? Math.min(VW * 0.78, midH0 * 1.18) : Math.min(midH0 * 1.28, VW * 0.34);
    L.c0 = { x: VW / 2, y: VH * h0t + midH0 / 2 };

    // fillings
    put(E.fill, 'width', `${mob ? VW - pad * 2 : Math.min(540, VW * 0.42)}px`);
    L.fillH = E.fill.offsetHeight;
    L.s1 = mob ? Math.min(VW * 0.44, VH * 0.22) : Math.min(VH * 0.66, VW * 0.4);
    L.c1 = mob ? { x: VW / 2, y: TOP + 6 + L.s1 / 2 } : { x: VW * 0.27, y: VH / 2 + 10 };
    L.fill = mob ? { x: pad, y: TOP + 14 + L.s1 } : { x: VW * 0.52, y: (VH - L.fillH) / 2 + 10 };

    // the kitchen rail
    const [rt, rb] = BANDS.rails(), midR = VH * (1 - rt - rb);
    L.D = mob ? Math.min(VW * 0.58, midR - 96) : Math.min(midR - 104, VW * 0.22);
    L.gap = mob ? VW * 0.42 : L.D * 0.5;
    L.railY = VH * rt + (midR - L.D - 64) / 2;
    // every dish fits a D x D box (the tall jamaica glass gets its own narrower width)
    L.dw = dishes.map((d) => { const im = d.querySelector('img'); const ar = im.naturalWidth && im.naturalHeight ? im.naturalWidth / im.naturalHeight : 1; return L.D * Math.min(1, ar); });
    dishes.forEach((d, i) => put(d, 'width', `${L.dw[i]}px`));
    L.dx = []; let xx = L.D + L.gap;   // the pupusa takes slot 0
    L.dw.forEach((w, i) => { L.dx[i] = xx + (L.D - w) / 2; xx += L.D + L.gap; });
    E.pup.style.setProperty('--k', (L.D / 496).toFixed(4));
    L.railStart = VW / 2 - L.D / 2;   // where the pupusa sits when the rail starts
    L.railLen = (dishes.length + 1) * (L.D + L.gap) + VW / 2;

    // run text widths (one copy) for seamless loops
    L.runTopW = E.runTop.firstChild.getBoundingClientRect().width / 3 || VW; L.runBotW = E.runBot.firstChild.getBoundingClientRect().width / 3 || VW;
    L.runTopH = E.runTop.offsetHeight; L.runBotH = E.runBot.offsetHeight;

    // close: emblem left, card right across the top band's edge
    const [ct, cb] = BANDS.close();
    const cardW = mob ? VW - pad * 2 : Math.min(460, VW * 0.4);
    put(E.card, 'width', `${cardW}px`);
    L.cardH = E.card.offsetHeight;
    L.card = mob ? { x: pad, y: Math.max(TOP + 8, VH * ct - 46) } : { x: VW - pad - cardW - VW * 0.04, y: Math.max(TOP + 8, Math.min(VH * ct - 80, VH - L.cardH - 24)) };
    const midC = VH * (1 - ct - cb);
    L.s4 = mob ? L.s1 : Math.min(midC * 1.15, VW * 0.34, L.card.x - pad * 2);
    L.c4 = mob ? { x: VW + L.s4, y: VH / 2 } : { x: (L.card.x) / 2, y: VH * ct + midC / 2 };
    L.wordCloseS = mob ? 1 : Math.min(1, (L.card.x - pad * 2) / L.wordW);
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

  function bandsAt(p) {
    const a = E3(seg(p, ...T.toFill)), b = E3(seg(p, ...T.toRails)), c = E3(seg(p, ...T.toTray)), d = E3(seg(p, ...T.toClose));
    const H = BANDS.hero(), F = BANDS.fill(), R = BANDS.rails(), Y = BANDS.tray(), C = BANDS.close();
    let t = lerp(H[0], F[0], a), bo = lerp(H[1], F[1], a);
    if (b > 0) { t = lerp(F[0], R[0], b); bo = lerp(F[1], R[1], b); }
    if (c > 0) { t = lerp(R[0], Y[0], c); bo = lerp(R[1], Y[1], c); }
    if (d > 0) { t = lerp(Y[0], C[0], d); bo = lerp(Y[1], C[1], d); }
    return { t: t * VH, b: bo * VH, a, bb: b, c, d };
  }

  function draw(p, time) {
    const { pad } = L;
    const B = bandsAt(p), { a, bb: b, c, d } = B;
    const still = reduced.matches;
    at(E.top, 0, B.t - VH);
    at(E.bot, 0, VH - B.b);
    bar.classList.toggle('on-blue', B.t > bar.offsetHeight * 0.8);

    // --- the word: hero at the band's bottom, lifts away for the fillings, returns smaller at the close
    const wordY0 = VH - L.wordH * 0.86;   // in band coordinates: its foot sits on the band edge
    const wLift = a * (L.wordH * 1.2) * (1 - d);
    const ws = lerp(1, L.wordCloseS, d);
    const wx = lerp((VW - L.wordW) / 2, pad, d);
    at(E.word, wx, wordY0 + wLift, ws);
    put(E.word, 'transformOrigin', '0 100%');
    vis(E.word, a < 1 || d > 0);

    // --- the emblem and where it goes
    let P;
    const breathe = still ? 1 : 1 + Math.sin(time * 1.5) * 0.014;
    const railOff = seg(p, ...T.rails) * L.railLen;
    const railShift = -railOff - (c > 0 ? 0 : 0);
    if (p < T.toRails[0]) P = { x: lerp(L.c0.x, L.c1.x, a), y: lerp(L.c0.y, L.c1.y, a), s: lerp(L.s0, L.s1, a) * (a === 0 ? breathe : 1) };
    else {
      const rx = L.railStart + L.D / 2 + railShift, ry = L.railY + L.D / 2;
      P = { x: lerp(L.c1.x, rx, b), y: lerp(L.c1.y, ry, b), s: lerp(L.s1, L.D, b) };
    }
    if (d > 0) P = { x: lerp(-L.s4, L.c4.x, d), y: L.c4.y, s: L.s4 * (d >= 1 ? breathe : 1) };
    const leanOn = (p < T.toFill[0] + 0.01 || d >= 1) && !still;
    const rot = leanOn ? ` perspective(900px) rotateX(${(-lean.y * 8).toFixed(2)}deg) rotateY(${(lean.x * 11).toFixed(2)}deg)` : '';
    at(E.pup, P.x - 248, P.y - 249, P.s / 496, rot);
    put(E.pup, 'transformOrigin', '50% 50%');
    vis(E.pup, P.x > -P.s && P.x < VW + P.s);
    vis(E.pupCap, b >= 1 && c < 1);

    // the letters the emblem covers ripple (hero and close)
    const heroOn = a < 1 || d > 0;
    if (heroOn) {
      const pupL = P.x - P.s / 2, pupR = P.x + P.s / 2;
      const wordLeft = wx;
      chars.forEach((ch, i) => {
        const cx = wordLeft + L.chx[i] * ws;
        const under = cx > pupL && cx < pupR && !still;
        put(ch, 'transform', under ? `translateY(${(Math.sin(time * 2.4 + i * 0.7) * L.wordH * 0.035).toFixed(1)}px)` : '');
      });
    }

    // --- hero lines in the bottom band, side notes in the white band
    const hl = E.heroLine;
    // in the hero and again at the close (rising back in from below)
    at(hl, 0, (B.b - hl.offsetHeight) / 2 + (d > 0 ? (1 - d) * B.b * 1.5 : a * B.b * 1.5));
    vis(hl, a < 1 || d > 0);
    const midTop = B.t, midBot = VH - B.b;
    at(E.sideL, pad, midBot - E.sideL.offsetHeight - 18 - a * VH * 0.5);
    at(E.sideR, VW - pad - E.sideR.offsetWidth, midBot - E.sideR.offsetHeight - 18 - a * VH * 0.5);
    vis(E.sideL, a < 1); vis(E.sideR, a < 1);

    // a jamaica glass drifts through the white band's blank space in the hero
    const dx = VW * (mob ? 0.12 : 0.2) + Math.sin(time * 0.35) * 18, dy = midTop + (midBot - midTop) * 0.34 + Math.sin(time * 0.6) * 10;
    at(E.drift, dx - a * VW * 0.5, dy, mob ? 0.7 : 1, still ? '' : ` rotate(${(Math.sin(time * 0.5) * 6).toFixed(2)}deg)`);
    vis(E.drift, a < 1 && !mob);

    // --- fillings slide in from the right, out to the right when the bands open
    const fx = L.fill.x + (1 - a) * VW * 0.6 + b * VW;
    at(E.fill, fx, L.fill.y);
    vis(E.fill, a > 0 && b < 1);

    // --- the kitchen: dishes follow the pupusa across the white band
    dishes.forEach((dEl, i) => {
      const x = L.railStart + L.dx[i] + railShift + (1 - b) * VW * 0.3;
      at(dEl, x, L.railY);
      vis(dEl, b > 0 && c < 1 && x < VW && x > -L.D * 1.5);
    });

    // run text in the blue bands (top runs left, bottom runs right) during the rail and tray
    const runOn = b > 0 && d < 1;
    const off = (p - T.toRails[0]) * VW * 2.2;
    const tl = -((off % L.runTopW) + L.runTopW) % L.runTopW;
    const bl = -L.runBotW + (((off * 0.8) % L.runBotW) + L.runBotW) % L.runBotW;
    // the runs push out first, then the tray words follow them in from the same side
    const cOut = E3(clamp(c * 2)), cIn = E3(clamp(c * 2 - 1));
    at(E.runTop, tl - cOut * (VW + L.runTopW), VH - B.t / 2 - L.runTopH / 2);
    at(E.runBot, bl + cOut * (VW + L.runBotW), B.b / 2 - L.runBotH / 2);
    vis(E.runTop, runOn && cOut < 1); vis(E.runBot, runOn && cOut < 1);
    at(E.trayTop, pad + (1 - cIn) * VW - d * VW, VH - B.t / 2 - E.trayTop.offsetHeight / 2);
    at(E.trayBot, pad - (1 - cIn) * VW + d * VW, B.b / 2 - E.trayBot.offsetHeight / 2);
    vis(E.trayTop, cIn > 0 && d < 1); vis(E.trayBot, cIn > 0 && d < 1);

    // --- the tray opens from the centre of the white band, slides off left for the close
    const r = c * Math.hypot(VW, VH) * 0.6;
    put(E.tray, 'clipPath', `circle(${r1(r)}px at ${r1(VW / 2)}px ${r1(midTop + (midBot - midTop) / 2)}px)`);
    at(E.tray, -d * VW, 0);
    vis(E.tray, c > 0 && d < 1);

    // --- the close card rises across the top band's edge
    at(E.card, L.card.x + (1 - d) * VW * 0.5, L.card.y);
    vis(E.card, d > 0);
  }

  function start() {
    layout();
    if (forced !== null) {
      const doc = root.scrollHeight - innerHeight; scrollTo(0, forced * doc);
      p = pT = forced; draw(p, 0); forced = null;
    }
    if (!running) { running = true; requestAnimationFrame(frame); }
  }

  // open now, from their hours, Miami time
  (function openNow() {
    const el = $('openNow');
    try {
      const f = new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', weekday: 'short', hour: 'numeric', minute: 'numeric', hour12: false });
      const x = Object.fromEntries(f.formatToParts(new Date()).map((o) => [o.type, o.value]));
      const h = (+x.hour % 24) + +x.minute / 60, close = x.weekday === 'Fri' || x.weekday === 'Sat' ? 22 : 21;
      el.textContent = h >= 8 && h < close ? `Open now until ${close === 22 ? '10pm' : '9pm'}` : h < 8 ? 'Opens today at 8am' : 'Closed now. Opens 8am';
    } catch (e) { /* keep the static line */ }
  })();

  addEventListener('pointermove', (e) => { if (e.pointerType === 'mouse') { leanT.x = (e.clientX / innerWidth - 0.5) * 2; leanT.y = (e.clientY / innerHeight - 0.5) * 2; } }, { passive: true });
  let rz = 0;
  addEventListener('resize', () => { cancelAnimationFrame(rz); rz = requestAnimationFrame(layout); });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(layout);
  addEventListener('load', layout);
  start();
  addEventListener('DOMContentLoaded', () => { if (window.LiquidGlass) { LiquidGlass.cursorBall(); } });
})();
