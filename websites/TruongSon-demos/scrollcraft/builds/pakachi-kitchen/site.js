/* Pakachi Kitchen: one fixed stage, one timeline p (0..1) from smoothed scroll.
   Every scene hands its layers to the next; nothing fades in or out:
   hero tray -> card 1 of a dealt hand -> the hand doubles -> the hand turns away,
   the haleem card opens into the catering band -> their gold rises -> tightens into the ticket,
   the hand fans back in behind it.
   Moving things get transform / clip-path only, written only when they change.
   Layout is measured once per resize. Test switch: ?p=0.42 jumps to that point. */
(() => {
  const TRAY_AR = 1152 / 1755;                 // cut-tray.webp
  const RICE = [0.46, 0.5];                    // centre of the rice inside the tray image
  const RING_R = 0.48;                         // ring radius as a share of logo-ring.webp's width

  const $ = (s) => document.querySelector(s);
  const $$ = (s) => [...document.querySelectorAll(s)];
  const root = document.documentElement;
  const stage = $('#stage'), spacer = $('#spacer'), bar = $('#bar');
  const wm = $('#wm'), letters = $$('.wm .l');
  const ring = $('#ring'), tray = $('#tray'), trayTilt = $('#trayTilt');
  const heroIn = $('#heroIn'), marquee = $('#marquee');
  const dealIn = $('#dealIn'), rollWord = $('#rollWord'), rollTen = $('#rollTen');
  const cards = $$('.card'), twins = $$('.twin'), nums = $$('.nums b');
  const haleem = $('#haleemCard'), track = $('#track'), figs = $$('#track figure');
  const caterH = $('#caterH'), caterP = $('#caterP'), caps = $('#caps'), capsBox = $('.cater-caps'), capLis = $$('#caps li');
  const panel = $('#panel'), stepsWrap = $('#stepsWrap'), stepLis = $$('.steps li'), ticket = $('#ticket'), tkIn = $('#tkIn');
  const lemons = $$('.lemon'), fanKeyIn = $('#fanKeyIn');
  const ctaFly = $('#ctaFly'), cta = ctaFly.firstElementChild;
  const slotHero = $('#slotHero'), slotBar = $('#slotBar'), slotClose = $('#slotClose');
  const threadFill = $('#threadFill'), threadBtns = $$('.thread button');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');

  const clamp = (v, a = 0, b = 1) => (v < a ? a : v > b ? b : v);
  const seg = (p, a, b) => clamp((p - a) / (b - a));
  const E = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const O = (t) => 1 - Math.pow(1 - t, 3);
  const lerp = (a, b, t) => a + (b - a) * t;
  const r1 = (v) => Math.round(v * 10) / 10;
  const put = (el, prop, val) => { const c = el._c || (el._c = {}); if (c[prop] !== val) { c[prop] = val; el.style[prop] = val; } };
  const show = (el, on) => put(el, 'visibility', on ? 'visible' : 'hidden');
  const box = (el, x, y, w, h) => Object.assign(el.style, { left: x + 'px', top: y + 'px', width: w + 'px', height: h + 'px' });
  const DEG = 180 / Math.PI;

  let VW = 0, VH = 0, mobile = false, L = {}, dirty = true;

  function layout() {
    VW = root.clientWidth;
    VH = stage.clientHeight;
    mobile = VW <= 760;
    const barH = bar.offsetHeight;
    $$('.stage *, .cta-fly').forEach((el) => { el._c = {}; });

    // ---- wordmark: as wide as the screen allows
    wm.style.fontSize = '100px';
    const w100 = wm.scrollWidth;
    const fs = Math.min((mobile ? VW * 0.94 : VW * 0.9) / w100 * 100, VH * (mobile ? 0.2 : 0.36));
    wm.style.fontSize = fs + 'px';
    const wmW = wm.scrollWidth, wmH = fs * 0.8;
    const wmX = (VW - wmW) / 2, wmY = (mobile ? 0.52 : 0.31) * VH - wmH / 2;
    wm.style.left = wmX + 'px'; wm.style.top = wmY + 'px';

    // ---- hero tray: rises from the bottom right corner; its cut edges stay off screen
    const over = 48;
    const tH = mobile ? VH * 0.47 + over : VH * 0.68 + over;
    const tW = tH * TRAY_AR;
    const tX = VW + over * 0.8 - tW, tY = VH + over - tH;
    box(tray, tX, tY, tW, tH);
    tray.style.transformOrigin = `${r1(tW * RICE[0])}px ${r1(tH * RICE[1])}px`;
    // letters the tray really covers get the shimmer
    // PAKA leaves left, CHI leaves right; each group moves as one so letters never cross
    let k = 0;
    const rects = letters.map((l) => { l.style.transform = 'none'; return l.getBoundingClientRect(); });
    const outL = rects[3].right + 40, outR = VW - rects[4].left + 40;
    letters.forEach((l, i) => {
      const b = rects[i];
      const cov = b.right > tX + tW * 0.1 && b.bottom > tY + tH * 0.04;
      l.classList.toggle('cov', cov);
      if (cov) l.style.setProperty('--k', k++);
      l._dir = i < 4 ? -1 : 1;
      l._out = i < 4 ? outL : outR;
      l._d = i < 4 ? i * 0.012 : (6 - i) * 0.012;   // the outer letter leads
    });

    // ---- hero copy
    const hc = $('#heroCopy');
    hc.style.top = (mobile ? barH + VH * 0.06 : wmY + wmH + VH * 0.07) + 'px';

    // ---- the hand: a fan on the arc of their ring
    // laid out under the measured deal heading, so nothing in the hand ever sits on it
    const dealEl = $('.deal');
    dealEl.style.top = barH + (mobile ? 8 : Math.min(VH * 0.03, 24)) + 'px';
    const headBottom = dealEl.offsetTop + dealEl.offsetHeight;
    const numH = mobile ? 40 : 58;                       // the numbers above the cards
    const R = mobile ? VH * 0.78 : VH * 0.98;
    const keyH = mobile ? 54 : 0;                        // the dish key under the fan on phones
    const spread = (c) => (mobile ? Math.min(c * 0.72 * 0.5, (VW - c * 0.72 - 64) / 5) : c * 0.72 * 0.74) / R;
    const extent = (c) => {                              // top of the middle cards to the lowest corner of the outer ones
      const t = 2.5 * spread(c), w = c * 0.72;
      return c * 1.07 + R * (1 - Math.cos(t)) + (w / 2) * Math.sin(t) + (c / 2) * (1 - Math.cos(t));
    };
    let ch = mobile ? Math.min(VH * 0.24, 200) : Math.min(VH * 0.36, 330);
    const room = VH - headBottom - numH - keyH - (mobile ? 14 : 22);
    while (ch > 90 && extent(ch) > room) ch -= 4;
    const cw = ch * 0.72;
    const fanCy = headBottom + numH + ch * 0.57;         // the middle cards' centre (0.07ch spare for the doubled twins)
    const pivot = { x: VW / 2 - (mobile ? cw * 0.1 : 0), y: fanCy + R };
    const step = spread(ch);
    const key = $('#fanKey');
    key.style.top = fanCy + ch / 2 + 30 + 'px';
    const theta = [0, 1, 2, 3, 4, 5].map((i) => (i - 2.5) * step);
    const closeLift = mobile ? VH * 0.32 : VH * 0.25;  // the fan rises behind the ticket at the close

    // band (the haleem card opens into it)
    const bw = mobile ? VW - 28 : Math.min(VW * 0.74, 1180);
    const bh = mobile ? VH * 0.36 : VH * 0.46;
    const bandC = { x: VW / 2, y: mobile ? VH * 0.5 : VH * 0.53 };

    cards.forEach((c, i) => {
      if (c === haleem) { c.style.width = bw + 'px'; c.style.height = bh + 'px'; }
      else { c.style.width = cw + 'px'; c.style.height = ch + 'px'; }
    });
    twins.forEach((t) => { t.style.width = cw + 'px'; t.style.height = ch + 'px'; });
    figs.forEach((f) => { f.style.width = bw + 'px'; });
    track.style.width = bw * figs.length + 'px';

    // the window the haleem card shows while it is a card
    const win = { t: (bh - ch) / 2, l: (bw - cw) / 2 };

    // tray as card 1: the frame closes around the rice
    const sc = ch / (tH * 0.6);
    const wW = cw / sc, wH = ch / sc;
    const ox = tW * RICE[0], oy = tH * RICE[1];
    const trayWin = { t: oy - wH / 2, b: tH - (oy + wH / 2), l: ox - wW / 2, r: tW - (ox + wW / 2) };

    // catering copy
    const bandTop = bandC.y - bh / 2, bandL = bandC.x - bw / 2;
    const ch2 = $('.cater-h');
    ch2.style.top = Math.max(barH + 6, bandTop - (mobile ? 92 : Math.min(130, VH * 0.15))) + 'px';
    ch2.style.paddingLeft = ch2.style.paddingRight = bandL + 'px';
    Object.assign(capsBox.style, { left: bandL + 'px', top: bandTop + bh + 14 + 'px', width: bw + 'px' });
    capLis.forEach((li) => { li.style.width = bw + 'px'; });
    Object.assign(caterP.style, mobile
      ? { left: bandL + 'px', top: bandTop + bh + 44 + 'px', right: 'auto', textAlign: 'left', maxWidth: bw + 'px' }
      : { right: bandL + 'px', left: 'auto', top: bandTop - 62 + 'px', textAlign: 'right' });

    // order panel and ticket
    const panelH = VH - barH + 2;
    panel.style.top = '0px'; panel.style.height = panelH + 'px';
    // the travelling button: its slots are sized first, so the ticket can be measured with the button in it
    const bwid = cta.offsetWidth, bhei = cta.offsetHeight;
    const sHero = mobile ? 0.92 : 1, sBar = mobile ? 0.6 : 0.66, sClose = 1;
    Object.assign(slotHero.style, { width: bwid * sHero + 'px', height: bhei * sHero + 'px' });
    Object.assign(slotBar.style, { width: bwid * sBar + 'px', height: bhei * sBar + 'px' });
    Object.assign(slotClose.style, { width: bwid * sClose + 'px', height: bhei * sClose + 'px' });

    // ticket: as tall as its own content (with the button's slot), never squeezed
    const tw = mobile ? VW - 32 : Math.min(560, Math.max(VW * 0.42, 480));
    ticket.style.width = tw + 'px';
    tkIn.style.position = 'relative'; tkIn.style.inset = 'auto';
    const th = Math.min(VH - barH - 24, tkIn.offsetHeight + 8);
    tkIn.style.position = ''; tkIn.style.inset = '';
    const tcy = Math.min(mobile ? VH * 0.66 : VH * 0.63, VH - 12 - th / 2);
    const tLocal = { x: (VW - tw) / 2, y: tcy - th / 2 - barH, w: tw, h: th };
    box(ticket, tLocal.x, tLocal.y, tw, th);

    heroIn.style.transform = 'none'; tkIn.style.transform = 'none'; panel.style.transform = 'none'; panel.style.clipPath = 'none';
    const rh = slotHero.getBoundingClientRect(), rb = slotBar.getBoundingClientRect(), rc = slotClose.getBoundingClientRect();
    // the close slot, read where the ticket really holds it (the panel rests at the bar's height)
    const C = { hero: { x: rh.left, y: rh.top, s: sHero }, bar: { x: rb.left, y: rb.top, s: sBar }, close: { x: rc.left, y: rc.top + barH, s: sClose } };

    // ring: base size, scaled per scene
    const ringBase = 1000;
    box(ring, 0, 0, ringBase, ringBase);

    L = { barH, headBottom, tX, tY, tW, tH, ox, oy, sc, trayWin, cw, ch, R, pivot, theta, closeLift, bw, bh, bandC, win,
      panelH, tLocal, tcy, C, ringBase, wmY, wmH, track: spacer.offsetHeight - innerHeight };
    root.classList.add('ready');
    dirty = true;
  }

  // centre and angle of fan slot i, with the wheel turned by w and the fan lifted by lift
  const slot = (i, w, lift, r = L.R) => {
    const a = L.theta[i] + w;
    return { x: L.pivot.x + r * Math.sin(a), y: L.pivot.y - lift - r * Math.cos(a), a };
  };
  // the same, while being dealt: from below the screen up the radius, with a spin that settles
  const dealt = (i, d, w, lift) => {
    const e = O(d), r = lerp(L.R * 0.3, L.R, e);
    const s = slot(i, w, lift, r);
    s.a += (1 - e) * (i % 2 ? 0.5 : -0.5);
    return s;
  };

  function render(p) {
    const { cw, ch, bw, bh, bandC, barH } = L;

    // ---- 1. hero exits: letters part, copy and marquee slide away
    letters.forEach((l) => {
      const t = E(seg(p, 0.03 + l._d, 0.11 + l._d));
      put(l, 'transform', t ? `translate3d(${r1(l._dir * l._out * t)}px,0,0)` : 'none');
      show(l, t < 1);
    });
    const hc = E(seg(p, 0.012, 0.07));
    put(heroIn, 'transform', `translate3d(0,${r1(hc * 110)}%,0)`);
    show(heroIn, hc < 1);
    put(marquee, 'transform', `translate3d(0,${r1(E(seg(p, 0.02, 0.07)) * 100)}%,0)`);
    show(marquee, p < 0.07);

    // ---- the wheel: the hand turns away for catering, and back for the close
    const W_OUT = -2.05;
    const wOut = E(seg(p, 0.535, 0.64)), wBack = E(seg(p, 0.865, 0.955));
    const w = p < 0.75 ? W_OUT * wOut : W_OUT * (1 - wBack);
    const lift = L.closeLift * E(seg(p, 0.86, 0.95));
    const dbl = E(seg(p, 0.43, 0.49));                  // the hand doubles

    // ---- the tray: hero -> card 1
    const m = E(seg(p, 0.05, 0.17));
    const s0 = slot(0, w, lift);
    {
      const { tX, tY, ox, oy, sc, trayWin: tw } = L;
      const dx = lerp(0, s0.x - (tX + ox), m), dy = lerp(0, s0.y - (tY + oy), m);
      const s = lerp(1, sc, m), a = lerp(0, s0.a, m);
      put(tray, 'transform', m ? `translate3d(${r1(dx)}px,${r1(dy)}px,0) rotate(${(a * DEG).toFixed(2)}deg) scale(${s.toFixed(4)})` : 'none');
      put(tray, 'clipPath', m ? `inset(${r1(tw.t * m)}px ${r1(tw.r * m)}px ${r1(tw.b * m)}px ${r1(tw.l * m)}px round ${r1(14 / sc * m)}px)` : 'none');
      const onScreen = s0.y - ch < VH && s0.x + cw > 0;
      show(tray, m < 1 || onScreen);
      tiltOn = m === 0;
    }

    // ---- 2-3. the hand: dealt from below, then doubled
    cards.forEach((c, i) => {
      const d = i === 0 ? seg(p, 0.15, 0.17) : seg(p, 0.14 + i * 0.045, 0.22 + i * 0.045);
      let s = d < 1 ? dealt(i, d, w, lift) : slot(i, w, lift);
      let hm = 0;
      if (c === haleem) {
        // the haleem card opens into the catering band, and closes back for the reprise
        const open = E(seg(p, 0.535, 0.625)), shut = E(seg(p, 0.87, 0.95));
        hm = p < 0.75 ? open : 1 - shut;
        const home = p < 0.75 ? slot(i, 0, 0) : slot(i, w, lift);
        const push = bandPush(p);
        s = hm ? { x: lerp(home.x, bandC.x, hm), y: lerp(home.y, bandC.y + push, hm), a: lerp(home.a, 0, hm) } : s;
        const it = r1(L.win.t * (1 - hm)), il = r1(L.win.l * (1 - hm));
        put(c, 'clipPath', `inset(${it}px ${il}px round ${r1(14 + (1 - hm) * 0)}px)`);
        put(c, 'transform', `translate3d(${r1(s.x - bw / 2)}px,${r1(s.y - bh / 2)}px,0) rotate(${(s.a * DEG).toFixed(2)}deg)`);
        c.style.setProperty('--capx', il + 'px');
        c.style.setProperty('--capb', r1(L.win.t * (1 - hm) - hm * 70) + 'px');
        // the band pans through their catering trays
        const pan = panPos(p);
        put(track, 'transform', `translate3d(${r1(-pan * bw)}px,0,0)`);
        put(caps, 'transform', `translate3d(${r1(-pan * bw)}px,0,0)`);
        show(c, d > 0 && (s.y + bh / 2 > 0));
      } else {
        put(c, 'transform', `translate3d(${r1(s.x - cw / 2)}px,${r1(s.y - ch / 2)}px,0) rotate(${(s.a * DEG).toFixed(2)}deg)`);
        show(c, i === 0 ? m >= 1 && s.y - ch < VH : d > 0 && s.y - ch < VH && s.x + cw > -40);
      }
      // caption slides up inside the card once it lands
      const capT = i === 0 ? seg(p, 0.165, 0.2) : seg(p, 0.19 + i * 0.045, 0.24 + i * 0.045);
      const cap = c.querySelector('.cap');
      put(cap, 'transform', `translate3d(0,${r1((1 - E(capT)) * 100)}%,0)`);

      // twin: behind its card, slides out when the hand doubles
      const tw = twins[i];
      const ts = c === haleem ? (d < 1 ? dealt(i, d, w, lift) : slot(i, w, lift)) : s;
      const ux = cw * 0.2 * dbl, uy = -ch * 0.07 * dbl, ua = ts.a + dbl * 0.1;
      const cx = ts.x + ux * Math.cos(ts.a) - uy * Math.sin(ts.a), cy = ts.y + ux * Math.sin(ts.a) + uy * Math.cos(ts.a);
      put(tw, 'transform', `translate3d(${r1(cx - cw / 2)}px,${r1(cy - ch / 2)}px,0) rotate(${(ua * DEG).toFixed(2)}deg)`);
      show(tw, dbl > 0 && (i === 0 ? m >= 1 : d >= 1) && ts.y - ch < VH && ts.x + cw > -60);

      // number above the card, wiped in as it lands
      const n = nums[i], nt = i === 0 ? E(seg(p, 0.16, 0.2)) : E(seg(p, 0.2 + i * 0.045, 0.24 + i * 0.045));
      const ns = c === haleem ? ts : s, off = ch / 2 + (mobile ? 18 : 28);
      put(n, 'transform', `translate3d(${r1(ns.x + off * Math.sin(ns.a))}px,${r1(ns.y - off * Math.cos(ns.a) - 15)}px,0) rotate(${(ns.a * DEG).toFixed(2)}deg)`);
      put(n, 'clipPath', `inset(${r1((1 - nt) * 100)}% 0 0 0)`);
      show(n, nt > 0 && ns.y - ch < VH && ns.x > -40);
    });

    // ---- the ring: behind the tray -> the fan's rim -> round the ticket
    {
      const B = L.ringBase;
      // never much bigger than the file itself (900px), so the gold line stays sharp
      const heroC = { x: L.tX + L.ox, y: L.tY + L.oy * 0.9 }, heroD = Math.min(L.tH * 1.02, 940);
      const fanD = Math.min(mobile ? VW * 0.98 : VH * 0.8, 940);
      const fanC = { x: VW / 2, y: Math.max(L.pivot.y - L.R + L.ch * 0.28, L.headBottom + 10 + fanD / 2) };   // ring top stays under the heading
      const bandC = { x: L.bandC.x, y: L.bandC.y + bandPush(p) }, bandD = L.bh * 0.92;
      const tkC = { x: VW / 2, y: L.tcy }, tkD = Math.min(Math.max(L.tLocal.w, L.tLocal.h) * 1.32, 940);
      const g = E(seg(p, 0.06, 0.19)), cb = E(seg(p, 0.54, 0.62)), z = E(seg(p, 0.88, 0.97));
      let cx = lerp(heroC.x, fanC.x, g), cy = lerp(heroC.y, fanC.y, g), D = lerp(heroD, fanD, g);
      if (cb) { cx = lerp(cx, bandC.x, cb); cy = lerp(cy, bandC.y, cb); D = lerp(D, bandD, cb); }
      if (z) { cx = lerp(cx, tkC.x, z); cy = lerp(cy, tkC.y, z); D = lerp(D, tkD, z); }
      put(ring, 'transform', `translate3d(${r1(cx - B / 2)}px,${r1(cy - B / 2)}px,0) scale(${(D / B).toFixed(4)}) rotate(${(w * DEG).toFixed(2)}deg)`);
    }

    // ---- deal header and the price roll
    const dIn = E(seg(p, 0.12, 0.2)), dOut = E(seg(p, 0.535, 0.59));
    put(dealIn, 'transform', `translate3d(0,${r1((-(1 - dIn) - dOut) * 110)}%,0)`);
    show(dealIn, dIn > 0 && dOut < 1);
    if (mobile) {
      const kIn = E(seg(p, 0.36, 0.42));
      put(fanKeyIn, 'transform', `translate3d(0,${r1((1 - kIn + dOut) * 105)}%,0)`);
      show(fanKeyIn, kIn > 0 && dOut < 1);
    }
    const rp = E(seg(p, 0.445, 0.49));
    put(rollWord, 'transform', `translate3d(0,${r1(-rp * 1.2)}em,0)`);
    put(rollTen, 'transform', `translate3d(0,${r1(-rp)}em,0)`);

    // ---- 4. catering copy: rises in, then is pushed up by the gold
    const push = bandPush(p);
    const hIn = E(seg(p, 0.585, 0.65));
    put(caterH, 'transform', `translate3d(0,${r1((1 - hIn) * 110)}%,0)`);
    put(caterH.parentElement, 'transform', `translate3d(0,${r1(push)}px,0)`);
    const pIn = E(seg(p, 0.6, 0.66));
    put(caterP, 'transform', `translate3d(0,${r1(push + (1 - pIn) * 30)}px,0)`);
    put(caterP, 'clipPath', `inset(0 0 ${r1((1 - pIn) * 100)}% 0)`);
    put(capsBox, 'transform', `translate3d(0,${r1(push)}px,0)`);
    put(capsBox, 'clipPath', `inset(0 ${r1((1 - E(seg(p, 0.6, 0.66))) * 100)}% 0 0)`);
    const caterOn = p > 0.58 && p < 0.9;
    show(caterH, caterOn); show(caterP, caterOn); show(capsBox, caterOn);

    // ---- 5. the gold rises; 6. it tightens into the ticket
    const top = panelTop(p);
    put(panel, 'transform', `translate3d(0,${r1(top)}px,0)`);
    show(panel, top < VH);
    stepLis.forEach((li, i) => {
      const t = E(seg(p, 0.81 + i * 0.016, 0.85 + i * 0.016));
      put(li, 'transform', `translate3d(0,${r1((1 - t) * 60)}px,0)`);
      put(li, 'clipPath', `inset(0 0 ${r1((1 - t) * 100)}% 0)`);
    });
    const z = E(seg(p, 0.885, 0.955));
    const T = L.tLocal;
    put(panel, 'clipPath', z ? `inset(${r1(T.y * z)}px ${r1((VW - T.x - T.w) * z)}px ${r1((L.panelH - T.y - T.h) * z)}px ${r1(T.x * z)}px round ${r1(22 * z)}px)` : 'none');
    const sx = E(seg(p, 0.875, 0.925));
    put(stepsWrap, 'transform', `translate3d(0,${r1(-sx * VH * 0.75)}px,0)`);
    show(stepsWrap, sx < 1);
    const k = E(seg(p, 0.91, 0.975));
    put(tkIn, 'transform', `translate3d(0,${r1((1 - k) * 105)}%,0)`);
    show(ticket, k > 0);

    // ---- lemons: out of the haleem photo, riding each scene
    lemons.forEach((el, i) => {
      const q = lemonAt(i, p, top);
      put(el, 'transform', `translate3d(${r1(q.x - q.s / 2)}px,${r1(q.y - q.s / 2)}px,0) scale(${(q.s / 200).toFixed(4)})`);
    });

    // ---- the travelling button
    const C = L.C, up = E(seg(p, 0.015, 0.075)), down = E(seg(p, 0.935, 0.995));
    const A = p < 0.5 ? C.hero : C.bar, Z = p < 0.5 ? C.bar : C.close, t = p < 0.5 ? up : down;
    const arc = Math.sin(t * Math.PI) * (p < 0.5 ? -50 : 50);
    put(ctaFly, 'transform', `translate3d(${r1(lerp(A.x, Z.x, t) + arc)}px,${r1(lerp(A.y, Z.y, t))}px,0) scale(${lerp(A.s, Z.s, t).toFixed(4)})`);

    // ---- thread
    put(threadFill, 'transform', `scaleY(${p.toFixed(4)})`);
    let on = 0; threadBtns.forEach((b, i) => { if (p >= +b.dataset.p - 0.03) on = i; });
    threadBtns.forEach((b, i) => b.classList.toggle('on', i === on));
  }

  // band shift: the rising gold pushes the band and its copy up and out
  const panelTop = (p) => {
    const rise = E(seg(p, 0.775, 0.855));
    return lerp(VH + 20, L.barH, rise);
  };
  const bandPush = (p) => {
    const bandBottom = L.bandC.y + L.bh / 2 + (mobile ? 120 : 70);
    // pushed by the gold's edge, then carried right off the top
    return Math.min(0, panelTop(p) - bandBottom) - E(seg(p, 0.8, 0.86)) * (L.barH + 60);
  };
  // pan with a short hold on each tray
  const panPos = (p) => {
    const t = seg(p, 0.645, 0.775) * (figs.length - 1);
    const k = Math.min(figs.length - 2, Math.floor(t));
    return k + E(clamp(t - k));
  };

  // lemon anchors per scene: [x, y] as shares of the screen, size as share of min(VW, VH)
  const LEM = {
    hero: [[0.43, 0.54, 0.13], [0.62, 0.7, 0.1], [0.3, 0.86, 0.11]],
    heroM: [[0.86, 0.33, 0.2], [0.12, 0.63, 0.17], [0.42, 0.9, 0.18]],
    deal: [[0.07, 0.22, 0.1], [0.91, 0.2, 0.08], [0.95, 0.93, 0.1]],
    dealM: [[0.08, 0.31, 0.15], [0.93, 0.33, 0.13], [0.9, 0.95, 0.16]],
  };
  function lemonAt(i, p, top) {
    const mn = Math.min(VW, VH);
    const H = (mobile ? LEM.heroM : LEM.hero)[i], D = (mobile ? LEM.dealM : LEM.deal)[i];
    const g = E(seg(p, 0.08, 0.2));
    let x = lerp(H[0], D[0], g) * VW, y = lerp(H[1], D[1], g) * VH, s = lerp(H[2], D[2], g) * mn;
    // catering: out of the band's corners (their haleem), pushed up with it
    const bl = L.bandC.x - L.bw / 2, bt = L.bandC.y - L.bh / 2 + bandPush(p);
    const cat = [[bl + L.bw * 0.02, bt + 6, 0.13], [bl + L.bw * 0.97, bt + L.bh * 0.12, 0.1], [bl + L.bw * 0.9, bt + L.bh, 0.12]][i];
    const c = E(seg(p, 0.56, 0.64));
    x = lerp(x, cat[0], c); y = lerp(y, cat[1], c); s = lerp(s, cat[2] * mn, c);
    // order: they ride the gold's top edge
    const o = E(seg(p, 0.79, 0.85));
    const ox = (mobile ? [0.09, 0.36, 0.6] : [0.12, 0.48, 0.72])[i] * VW, os = (mobile ? 0.17 : 0.1) * mn;
    x = lerp(x, ox, o); s = lerp(s, os, o); y = lerp(y, top - os * 0.34, o);
    // close: round the ticket
    const z = E(seg(p, 0.89, 0.965));
    const T = L.tLocal, tx0 = T.x, ty0 = T.y + L.barH;
    const cl = [[tx0 - (mobile ? 4 : 26), ty0 + T.h * 0.18, 0.13], [tx0 + T.w + (mobile ? 2 : 24), ty0 + T.h * 0.3, 0.1], [tx0 + T.w * 0.92, ty0 + T.h + 6, 0.12]][i];
    x = lerp(x, cl[0], z); y = lerp(y, cl[1], z); s = lerp(s, cl[2] * mn * (mobile ? 1.3 : 1), z);
    return { x, y, s };
  }

  // smoothed scroll
  let cur = 0, target = 0, last = 0, running = false;
  const REC = /[?&]rec(?:[&=]|$)/.test(location.search);
  const readTarget = () => { target = L.track > 0 ? clamp(scrollY / L.track) : 0; };
  function frame(t) {
    const dt = last ? Math.min(64, t - last) : 16.7; last = t;
    const kk = reduced.matches || REC ? 1 : 1 - Math.pow(1 - 0.1, dt / 16.7);
    const d = target - cur;
    cur = Math.abs(d) < 0.00002 ? target : cur + d * kk;
    if (dirty || d !== 0) { render(cur); dirty = false; }
    if (cur !== target) requestAnimationFrame(frame); else { running = false; last = 0; }
  }
  const kick = () => { readTarget(); if (!running) { running = true; requestAnimationFrame(frame); } };

  // the tray leans toward the cursor while it is the hero
  let tiltOn = true, tx = 0, ty = 0, gx = 0, gy = 0, tiltRun = false;
  function tilt() {
    if (!tiltOn) { tx = ty = 0; }
    gx += (tx - gx) * 0.08; gy += (ty - gy) * 0.08;
    trayTilt.style.transform = `rotateX(${gx.toFixed(2)}deg) rotateY(${gy.toFixed(2)}deg)`;
    if (Math.abs(tx - gx) > 0.02 || Math.abs(ty - gy) > 0.02) requestAnimationFrame(tilt); else tiltRun = false;
  }
  if (!reduced.matches && matchMedia('(hover: hover) and (pointer: fine)').matches) {
    addEventListener('pointermove', (e) => {
      tx = tiltOn ? -(e.clientY / VH - 0.5) * 10 : 0; ty = tiltOn ? (e.clientX / VW - 0.5) * 14 : 0;
      if (!tiltRun) { tiltRun = true; requestAnimationFrame(tilt); }
    }, { passive: true });
  }

  layout();
  const qp = /[?&]p=([\d.]+)/.exec(location.search);
  if (qp) { scrollTo(0, clamp(+qp[1]) * L.track); readTarget(); cur = target; }
  render(cur);
  addEventListener('scroll', kick, { passive: true });
  addEventListener('resize', () => { layout(); kick(); });
  document.fonts && document.fonts.ready.then(() => { layout(); kick(); });
  $$('.stage img').forEach((img) => { if (img.decode) img.decode().catch(() => {}); });
  $('.brand').addEventListener('click', (e) => { e.preventDefault(); scrollTo({ top: 0, behavior: reduced.matches ? 'auto' : 'smooth' }); });
  threadBtns.forEach((b) => b.addEventListener('click', () => scrollTo({ top: +b.dataset.p * L.track, behavior: reduced.matches ? 'auto' : 'smooth' })));

  // liquid glass: the default cursor ball, glass button, the button leans toward the cursor
  if (window.LiquidGlass) {
    LiquidGlass.cursorBall();
    LiquidGlass.glassify('.lg-glass');
    LiquidGlass.magnet('.cta-fly .cta', { reach: 'page', curve: 2.2, pull: 0.6, max: 46 });
  }
})();
