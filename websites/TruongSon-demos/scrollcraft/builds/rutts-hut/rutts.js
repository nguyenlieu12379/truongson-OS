/* Rutt's Hut: page-local behaviour. The scroll-craft engine is untouched.

   1. Hero planes: sky, word, sign and roof drift at different rates as the
      hero leaves, so the roof (nearest) climbs past the sign. Pointer lean on
      fine pointers.
   2. The fryer (signature): fixed chrome that unfurls from the bar over the
      four doneness cuts. Page scroll drops the dog in, floats it, rips it,
      browns it, chars it. Pick a doneness (fryer buttons or the button in
      each cut) and it becomes your order. Default: Ripper, the house dog.
   3. The order name is carried into the bar and the close. */
(function () {
  'use strict';
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  var fine = window.matchMedia('(hover: hover) and (pointer: fine)');
  var NAMES = ['In-and-Outer', 'Ripper', 'Weller', 'Cremator'];
  var ARTICLE = ['an', 'a', 'a', 'a'];

  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function mix(c1, c2, t) {
    var a = parseInt(c1.slice(1), 16), b = parseInt(c2.slice(1), 16);
    var r = Math.round(lerp(a >> 16, b >> 16, t)), g = Math.round(lerp((a >> 8) & 255, (b >> 8) & 255, t)), bl = Math.round(lerp(a & 255, b & 255, t));
    return '#' + ((1 << 24) | (r << 16) | (g << 8) | bl).toString(16).slice(1);
  }
  // Skin colour stops, u from -1 (just dropped) to 3 (Cremator).
  var SKIN = [[-1, '#D98472'], [0, '#C96B4E'], [1, '#A2482A'], [2, '#5E2A12'], [3, '#24140B']];
  function skinAt(u) {
    for (var i = 1; i < SKIN.length; i++) {
      if (u <= SKIN[i][0]) { var a = SKIN[i - 1], b = SKIN[i]; return mix(a[1], b[1], clamp((u - a[0]) / (b[0] - a[0]), 0, 1)); }
    }
    return SKIN[SKIN.length - 1][1];
  }

  /* ------------------------------------------------------------ order -- */
  var order = 1, locked = false;
  try { var saved = localStorage.getItem('rutts-order'); if (saved !== null && NAMES[+saved]) { order = +saved; locked = true; } } catch (e) {}

  var nameEls = document.querySelectorAll('[data-order-name]');
  var stageBtns = document.querySelectorAll('.fryer__stages button');
  var pickBtns = document.querySelectorAll('[data-pick]');
  var barBtn = document.querySelector('.bar__order');
  var miniDog = document.querySelector('.mini-dog');
  var miniRip = document.querySelector('.mini-rip');

  function renderOrder() {
    nameEls.forEach(function (el) { el.textContent = NAMES[order]; });
    stageBtns.forEach(function (b) { b.setAttribute('aria-pressed', String(+b.dataset.stage === order)); });
    pickBtns.forEach(function (b) {
      var on = +b.dataset.pick === order && locked;
      b.textContent = on ? 'Your order' : 'Make it ' + ARTICLE[+b.dataset.pick] + ' ' + NAMES[+b.dataset.pick];
      b.classList.toggle('btn--line', on);
    });
    if (barBtn) barBtn.setAttribute('aria-label', 'Your order: ' + NAMES[order] + '. Change it at the fryer.');
    if (miniDog) miniDog.setAttribute('fill', skinAt(order));
    if (miniRip) miniRip.setAttribute('opacity', order === 0 ? '0' : '1');
  }
  function setOrder(i, lock) {
    order = i; if (lock) locked = true;
    if (lock) { try { localStorage.setItem('rutts-order', String(i)); } catch (e) {} }
    renderOrder();
  }
  function jumpTo(i) {
    var s = document.getElementById('fry-' + i); if (!s) return;
    var y = s.getBoundingClientRect().top + window.scrollY + s.offsetHeight / 2 - window.innerHeight / 2;
    window.scrollTo({ top: y, behavior: reduce.matches ? 'auto' : 'smooth' });
  }
  stageBtns.forEach(function (b) { b.addEventListener('click', function () { setOrder(+b.dataset.stage, true); jumpTo(+b.dataset.stage); }); });
  pickBtns.forEach(function (b) { b.addEventListener('click', function () { setOrder(+b.dataset.pick, true); }); });
  if (barBtn) barBtn.addEventListener('click', function () { jumpTo(order); });
  renderOrder();

  /* ----------------------------------------------------------- hero -- */
  var hero = document.getElementById('hero');
  var planes = hero ? Array.prototype.slice.call(hero.querySelectorAll('[data-depth]')) : [];
  var LEAN = { '0.5': 4, '0.32': 8, '0.16': 12, '0': 18 };
  var mx = 0, my = 0, tx = 0, ty = 0;
  if (hero) hero.addEventListener('pointermove', function (e) {
    if (!fine.matches || reduce.matches) return;
    var r = hero.getBoundingClientRect();
    tx = (e.clientX - r.left) / r.width - 0.5; ty = (e.clientY - r.top) / r.height - 0.5;
  });
  if (hero) hero.addEventListener('pointerleave', function () { tx = 0; ty = 0; });

  /* --------------------------------------------------------- fryer -- */
  var fryer = document.getElementById('fryer');
  var fry = [0, 1, 2, 3].map(function (i) { return document.getElementById('fry-' + i); });
  var dog = document.getElementById('dog');
  var body = document.getElementById('dog-body');
  var skin = document.getElementById('dog-skin');
  var shine = document.getElementById('dog-shine');
  var rips = document.getElementById('dog-rips');
  var charG = document.getElementById('dog-char');
  var bubbles = document.getElementById('bubbles');
  var nowHere = -1, lastU = null;

  function fryState() {
    var vh = window.innerHeight, vc = vh / 2;
    var r0 = fry[0].getBoundingClientRect(), r3 = fry[3].getBoundingClientRect();
    var c = fry.map(function (s) { var r = s.getBoundingClientRect(); return r.top + r.height / 2; });
    // u: -1 one viewport before the first cut is centred, then 0..3 between centres
    var u;
    if (vc <= c[0]) u = clamp(-1 + (vc - (c[0] - vh * 0.6)) / (vh * 0.6), -1, 0);
    else if (vc >= c[3]) u = 3;
    else { for (var i = 0; i < 3; i++) if (vc < c[i + 1]) { u = i + (vc - c[i]) / (c[i + 1] - c[i]); break; } }
    var open = Math.min(clamp((vh * 0.75 - r0.top) / (vh * 0.5), 0, 1), clamp((r3.bottom - vh * 0.12) / (vh * 0.45), 0, 1));
    return { u: u, open: open };
  }

  function drawDog(u) {
    // Position: dropped at the surface, sinks to the floor, floats back up by
    // In-and-Outer (u = 0), then rides the surface.
    var y;
    if (reduce.matches) y = 128;
    else if (u < -0.5) y = lerp(110, 290, (u + 1) / 0.5);
    else if (u < 0) y = lerp(290, 128, (u + 0.5) / 0.5);
    else y = 128;
    var shrink = clamp(u - 2, 0, 1);
    var sx = lerp(1, 0.84, shrink), sy = lerp(1, 0.8, shrink), rot = lerp(0, -4, shrink);
    dog.setAttribute('transform', 'translate(300 ' + y.toFixed(1) + ') rotate(' + rot.toFixed(2) + ') scale(' + sx.toFixed(3) + ' ' + sy.toFixed(3) + ')');
    skin.setAttribute('fill', skinAt(u));
    var ripT = clamp((u - 0.35) / 0.65, 0, 1);
    rips.setAttribute('opacity', ripT.toFixed(2));
    rips.setAttribute('stroke-width', (2 + ripT * 6 + clamp(u - 1, 0, 2) * 2).toFixed(1));
    rips.setAttribute('stroke', mix('#F4BE95', '#3A1A0B', clamp((u - 1.4) / 1.6, 0, 1)));
    shine.setAttribute('opacity', lerp(1, 0.15, clamp((u + 1) / 4, 0, 1)).toFixed(2));
    charG.setAttribute('opacity', clamp((u - 2) / 1, 0, 1).toFixed(2));
    bubbles.style.setProperty('--heat', clamp(u + 1, 0, 1).toFixed(2));
  }

  function tick() {
    var vh = window.innerHeight, y = window.scrollY;

    // hero planes
    if (hero && y < vh * 1.2) {
      mx += (tx - mx) * 0.08; my += (ty - my) * 0.08;
      planes.forEach(function (p) {
        var d = parseFloat(p.dataset.depth);
        var lean = reduce.matches ? 0 : LEAN[p.dataset.depth] || 0;
        var dy = reduce.matches ? 0 : y * d;
        p.style.transform = 'translate3d(' + (-mx * lean).toFixed(2) + 'px,' + (dy - my * lean * 0.5).toFixed(2) + 'px,0)';
      });
    }

    // fryer
    var s = fryState();
    fryer.style.setProperty('--open', s.open.toFixed(3));
    fryer.classList.toggle('is-live', s.open > 0.001);
    fryer.toggleAttribute('inert', s.open < 0.5);
    if (lastU === null || Math.abs(s.u - lastU) > 0.002) { drawDog(s.u); lastU = s.u; }
    fryer.setAttribute('data-sc-verify-state', s.open.toFixed(2) + '|' + s.u.toFixed(2));
    var here = s.open > 0.5 && s.u >= -0.25 ? Math.round(clamp(s.u, 0, 3)) : -1;
    if (here !== nowHere) {
      nowHere = here;
      stageBtns.forEach(function (b) { b.classList.toggle('is-here', +b.dataset.stage === here); });
    }
    requestAnimationFrame(tick);
  }

  requestAnimationFrame(tick);
})();
