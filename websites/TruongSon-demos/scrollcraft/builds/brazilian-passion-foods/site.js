/* Brazilian Passion Foods. One stage, one camera: their own kitchen clip scrubbed by the scroll,
   held on their high-res photos at the beats that matter. Bespoke page code, no engine edits. */
(function () {
  "use strict";
  var reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  var SNAP = /[?&]snap\b/.test(location.search);   // test switch: no smoothing
  var track = document.getElementById("track");
  var reel = document.querySelector(".reel"), cv = document.querySelector(".reel-canvas"), ctx = cv.getContext("2d");
  var amb = document.querySelector(".ambient"), actx = amb.getContext("2d");
  var loupe = document.querySelector(".loupe");
  var cps = [].slice.call(document.querySelectorAll(".cp"));
  var fill = document.querySelector(".tl-fill"), gos = [].slice.call(document.querySelectorAll(".timeline [data-go]"));

  // ---- assets ---------------------------------------------------------------
  var N = 172, STEP = 0.25, T0 = 0.25;            // frames f000..f171 = video 0.25s..43s
  var frames = new Array(N);
  function still(src) { var i = new Image(); i.decoding = "async"; i.src = src; return i; }
  var S = { basket: still("assets/basket.jpg"), sweet: still("assets/sweet.jpg"), truck: still("assets/truck.jpg") };
  // load coarse to fine so scrubbing works early and sharpens as more frames arrive
  (function preload() {
    var order = [], seen = {};
    [16, 8, 4, 2, 1].forEach(function (s) { for (var i = 0; i < N; i += s) if (!seen[i]) { seen[i] = 1; order.push(i); } });
    var k = 0, live = 0;
    function next() {
      while (live < 6 && k < order.length) {
        (function (i) {
          var im = new Image(); live++;
          im.onload = function () { frames[i] = im; live--; dirty = true; next(); };
          im.onerror = function () { live--; next(); };
          im.src = "assets/fry/f" + ("00" + i).slice(-3) + ".jpg";
        })(order[k++]);
      }
    }
    next();
  })();
  function frameAt(t) {
    var i = Math.max(0, Math.min(N - 1, Math.round((t - T0) / STEP)));
    for (var d = 0; d < N; d++) { if (frames[i - d]) return frames[i - d]; if (frames[i + d]) return frames[i + d]; }
    return null;
  }

  // ---- the timeline: scroll position -> what the camera shows -----------------
  // video keyframes [p, t]: the cards sit on these spans
  var VK = [[0.085, 0.25], [0.17, 4.5], [0.30, 13], [0.45, 26], [0.56, 37]];
  var VK2 = [[0.68, 37], [0.72, 43]];
  function lerpKeys(keys, p) {
    for (var i = 0; i < keys.length - 1; i++) {
      var a = keys[i], b = keys[i + 1];
      if (p <= b[0]) return a[1] + (b[1] - a[1]) * Math.max(0, (p - a[0]) / (b[0] - a[0]));
    }
    return keys[keys.length - 1][1];
  }
  function ramp(p, a, b) { return Math.max(0, Math.min(1, (p - a) / (b - a))); }
  // returns [primary, secondary, mix, zoom]
  function shot(p) {
    if (p < 0.07) return [S.basket, null, 0, 1 + p * 0.5];
    if (p < 0.085) return [S.basket, frameAt(T0), ramp(p, 0.07, 0.085), 1.035];
    if (p < 0.56) return [frameAt(lerpKeys(VK, p)), null, 0, 1];
    if (p < 0.585) return [frameAt(37), S.basket, ramp(p, 0.56, 0.585), 1];
    if (p < 0.68) return [S.basket, null, 0, 1];
    if (p < 0.72) return [frameAt(lerpKeys(VK2, p)), null, 0, 1];
    if (p < 0.74) return [frameAt(43), S.sweet, ramp(p, 0.72, 0.74), 1];
    if (p < 0.79) return [S.sweet, null, 0, 1 + ramp(p, 0.74, 0.79) * 0.04];
    if (p < 0.815) return [S.sweet, S.truck, ramp(p, 0.79, 0.815), 1.04];
    return [S.truck, null, 0, 1 + ramp(p, 0.815, 1) * 0.06];
  }

  // ---- drawing ---------------------------------------------------------------
  var W = 0, H = 0, dirty = true;
  function size() {
    var r = reel.getBoundingClientRect(), dpr = Math.min(2, window.devicePixelRatio || 1);
    W = cv.width = Math.round(r.width * dpr); H = cv.height = Math.round(r.height * dpr); dirty = true;
  }
  function cover(c, im, w, h, z) {
    if (!im || !im.naturalWidth) return false;
    var s = Math.max(w / im.naturalWidth, h / im.naturalHeight) * (z || 1);
    var dw = im.naturalWidth * s, dh = im.naturalHeight * s;
    c.drawImage(im, (w - dw) / 2, (h - dh) / 2, dw, dh); return true;
  }
  var lastKey = "";
  function draw(p) {
    var s = shot(p), key = (s[0] && s[0].src) + "|" + (s[1] && s[1].src) + "|" + s[2].toFixed(3) + "|" + s[3].toFixed(4);
    if (!dirty && key === lastKey) return;
    lastKey = key; dirty = false;
    ctx.globalAlpha = 1;
    if (!cover(ctx, s[0], W, H, s[3])) return;
    if (s[1] && s[2] > 0) { ctx.globalAlpha = s[2]; cover(ctx, s[1], W, H, s[3]); ctx.globalAlpha = 1; }
    // ambient: the same frame shrunk to 27x48 and stretched back up, a free soft blur of real colour
    actx.globalAlpha = 1; cover(actx, s[2] > 0.5 && s[1] ? s[1] : s[0], 27, 48, 1);
  }

  // ---- the signature: a loupe over their real crust ---------------------------
  var inLoupe = false, px = null, py = null, ZOOM = 2.6;
  reel.addEventListener("pointermove", function (e) { var r = reel.getBoundingClientRect(); px = e.clientX - r.left; py = e.clientY - r.top; placeLoupe(); });
  reel.addEventListener("pointerleave", function () { px = py = null; placeLoupe(); });
  function placeLoupe(autoT) {
    var r = reel.getBoundingClientRect(), im = S.basket;
    if (!inLoupe || !im.naturalWidth) { loupe.classList.remove("on"); return; }
    var x = px, y = py;
    if (x == null) { // no pointer (touch, or mouse elsewhere): drift along the three pastéis with the scroll
      var t = autoT == null ? 0.5 : autoT;
      x = r.width * (0.18 + 0.64 * t); y = r.height * (0.47 + 0.06 * Math.sin(t * Math.PI * 2));
    }
    var s = Math.max(r.width / im.naturalWidth, r.height / im.naturalHeight), dw = im.naturalWidth * s, dh = im.naturalHeight * s;
    var ox = (r.width - dw) / 2, oy = (r.height - dh) / 2, size = loupe.offsetWidth / 2;
    loupe.style.left = x + "px"; loupe.style.top = y + "px";
    loupe.style.backgroundSize = (dw * ZOOM) + "px " + (dh * ZOOM) + "px";
    loupe.style.backgroundPosition = (-(x - ox) * ZOOM + size) + "px " + (-(y - oy) * ZOOM + size) + "px";
    loupe.classList.add("on");
  }

  // ---- scroll -> p (smoothed) -------------------------------------------------
  var target = 0, cur = 0, running = false;
  function readP() { var span = track.offsetHeight - innerHeight; return span > 0 ? Math.max(0, Math.min(1, scrollY / span)) : 0; }
  function apply(p) {
    draw(p);
    for (var i = 0; i < cps.length; i++) { var c = cps[i], on = p >= +c.dataset.a && p < +c.dataset.b; if (c._on !== on) { c._on = on; c.classList.toggle("on", on); } }
    fill.style.setProperty("--tp", p.toFixed(4));
    var best = null, bd = 9; gos.forEach(function (g) { var d = Math.abs(+g.dataset.go - p); if (d < bd) { bd = d; best = g; } });
    gos.forEach(function (g) { g.setAttribute("aria-current", g === best ? "true" : "false"); });
    var nowLoupe = p >= 0.585 && p < 0.68;
    if (nowLoupe !== inLoupe) { inLoupe = nowLoupe; }
    placeLoupe(ramp(p, 0.585, 0.68));
  }
  function tick() {
    var d = target - cur;
    cur = reduce || SNAP || Math.abs(d) < 0.00005 ? target : cur + d * 0.2;
    apply(cur);
    if (cur !== target || dirty) requestAnimationFrame(tick); else running = false;
  }
  function kick() { target = readP(); if (!running) { running = true; requestAnimationFrame(tick); } }
  addEventListener("scroll", kick, { passive: true });
  addEventListener("resize", function () { size(); kick(); });
  document.addEventListener("click", function (e) {
    var b = e.target.closest && e.target.closest("[data-go]"); if (!b) return;
    e.preventDefault();
    var span = track.offsetHeight - innerHeight;
    scrollTo({ top: Math.round(+b.dataset.go * span), behavior: reduce ? "auto" : "smooth" });
  });
  // redraw as stills arrive
  Object.keys(S).forEach(function (k) { S[k].onload = function () { dirty = true; kick(); }; });
  setInterval(function () { if (dirty) kick(); }, 250);
  size(); cur = target = readP(); apply(cur);
})();
