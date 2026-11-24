/* liquid-glass.js: refractive "liquid glass" for plain HTML sites.
   Load with defer, after head.html is in <head>. No dependencies.

     LiquidGlass.cursorBall()          glass ball that springs after the mouse
     LiquidGlass.cursorPinch()         no ball: the page pinches toward the pointer
     LiquidGlass.glassify(".lg-glass") rounded-rect glass panels and buttons
     LiquidGlass.magnet(".cta")        buttons slide toward a nearby cursor
     LiquidGlass.lensMap(...)          the displacement map all of these use

   The theme switch (toggle + circle-lens transition) lives in head.html, not
   here, so a stale cached copy of this file can never leave the toggle dead.

   How the bending works: an SVG feDisplacementMap reads a small canvas
   image. R = horizontal pull, G = vertical pull, 128 = none. The pull points
   inward, so the edge samples from inside the shape: content bends around
   the rim like light through a thick lens.

   Rules that each cost a debugging round (see 03-liquid-glass.md):
   - Position backdrop-filter elements with left/top or layout, never with
     transform: translate. Transforms only for stretch/scale.
   - color-interpolation-filters="sRGB" on every primitive, or 128 is not
     neutral and the whole lens shifts by ~10px.
   - The pull must grow slower than the distance it acts over (slope < 1),
     or content folds over itself and thin text smears into blobs.
   - backdrop-filter: url(#svg) is Chromium only. Elsewhere you get the rim
     and highlight, no bending. */
(function (root) {
  "use strict";
  var SVGNS = "http://www.w3.org/2000/svg";
  var uid = 0;

  function chromium() {
    var b = (navigator.userAgentData && navigator.userAgentData.brands) || [];
    return b.some(function (x) { return /Chromium|Google Chrome|Microsoft Edge|Opera|Brave/.test(x.brand); });
  }
  function smooth(t) { t = t < 0 ? 0 : t > 1 ? 1 : t; return t * t * (3 - 2 * t); }

  // A displacement map for a rounded rectangle (a circle when w == h and
  // radius >= w/2). Returns { url, scale } for feImage href and the
  // feDisplacementMap scale attribute.
  //   push       max inward pull at the very edge, px
  //   band       how far in from the edge the bend reaches, px
  //   interior   share of the pull spread evenly toward the middle (0..1):
  //              a little gives a soft magnifier, 0 keeps the middle flat
  function lensMap(o) {
    var w = o.width, h = o.height, rad = Math.min(o.radius == null ? Math.min(w, h) / 2 : o.radius, Math.min(w, h) / 2);
    var band = o.band || Math.min(w, h) * 0.25;
    var push = o.push == null ? band * 0.56 : o.push;          // 0.56 keeps slope < 1 with smoothstep
    var interior = o.interior == null ? 0.2 : o.interior;
    var k = o.resolution || Math.max(1, Math.round(Math.max(w, h) / 120));  // px per map cell
    var mw = Math.max(2, Math.ceil(w / k)), mh = Math.max(2, Math.ceil(h / k));
    var S = push * 2.2;
    var cv = document.createElement("canvas"); cv.width = mw; cv.height = mh;
    var g = cv.getContext("2d"), img = g.createImageData(mw, mh), px = img.data;
    var hx = w / 2, hy = h / 2, inner = Math.min(hx, hy);
    for (var y = 0; y < mh; y++) for (var x = 0; x < mw; x++) {
      var X = (x + 0.5) * w / mw - hx, Y = (y + 0.5) * h / mh - hy;
      // signed distance to the rounded rect edge (negative inside)
      var qx = Math.abs(X) - (hx - rad), qy = Math.abs(Y) - (hy - rad);
      var ox = Math.max(qx, 0), oy = Math.max(qy, 0);
      var sd = Math.sqrt(ox * ox + oy * oy) + Math.min(Math.max(qx, qy), 0) - rad;
      // outward normal: from the corner arc, or straight out of the flat side
      var nx, ny;
      if (qx > 0 && qy > 0) { var l = Math.sqrt(ox * ox + oy * oy) || 1; nx = ox / l * Math.sign(X); ny = oy / l * Math.sign(Y); }
      else if (qx > qy) { nx = Math.sign(X); ny = 0; } else { nx = 0; ny = Math.sign(Y); }
      var i = (y * mw + x) * 4, R = 128, G = 128;
      if (sd < 0) {
        var depth = -sd;                                       // px in from the edge
        var rim = smooth(1 - depth / band);                   // 1 at the edge, 0 past the band
        var mid = 1 - Math.min(1, depth / inner);              // soft ramp across the whole shape
        var m = push * ((1 - interior) * rim + interior * mid);
        R = 128 - nx * m / S * 255; G = 128 - ny * m / S * 255;
      }
      px[i] = R; px[i + 1] = G; px[i + 2] = 128; px[i + 3] = 255;
    }
    g.putImageData(img, 0, 0);
    return { url: cv.toDataURL(), scale: S };
  }

  // Build an SVG filter that applies a map. Returns its id.
  var defs = null;
  function filterFor(map, w, h) {
    if (!defs) {
      var svg = document.createElementNS(SVGNS, "svg");
      svg.setAttribute("aria-hidden", "true"); svg.setAttribute("focusable", "false");
      svg.style.cssText = "position:absolute;width:0;height:0;overflow:hidden;pointer-events:none";
      defs = document.createElementNS(SVGNS, "defs"); svg.appendChild(defs); document.body.appendChild(svg);
    }
    var id = "lg-lens-" + (++uid);
    var f = document.createElementNS(SVGNS, "filter");
    f.setAttribute("id", id); f.setAttribute("x", "0"); f.setAttribute("y", "0");
    f.setAttribute("width", "100%"); f.setAttribute("height", "100%");
    f.setAttribute("color-interpolation-filters", "sRGB");
    var im = document.createElementNS(SVGNS, "feImage");
    [["href", map.url], ["x", 0], ["y", 0], ["width", w], ["height", h], ["preserveAspectRatio", "none"],
     ["color-interpolation-filters", "sRGB"], ["result", "map"]].forEach(function (a) { im.setAttribute(a[0], a[1]); });
    var dm = document.createElementNS(SVGNS, "feDisplacementMap");
    [["in", "SourceGraphic"], ["in2", "map"], ["scale", map.scale.toFixed(1)], ["xChannelSelector", "R"],
     ["yChannelSelector", "G"], ["color-interpolation-filters", "sRGB"]].forEach(function (a) { dm.setAttribute(a[0], a[1]); });
    f.appendChild(im); f.appendChild(dm); defs.appendChild(f);
    return id;
  }

  // ---- cursor ball ------------------------------------------------------
  // Glass ball that springs after the mouse, stretches along its velocity
  // and wobbles back to round. Mouse/trackpad only; off with reduced motion.
  function cursorBall(opt) {
    opt = opt || {};
    if (!matchMedia("(hover: hover) and (pointer: fine)").matches) return null;
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return null;
    var size = opt.size || 56;
    var ball = document.createElement("div");
    ball.className = "lg-ball"; ball.setAttribute("aria-hidden", "true");
    ball.style.setProperty("--lg-size", size + "px");
    document.body.appendChild(ball);
    if (chromium()) {
      var id = filterFor(lensMap({ width: size, height: size, band: size * 0.25, push: size * 0.14, interior: 0.22 }), size, size);
      ball.style.backdropFilter = ball.style.webkitBackdropFilter = "url(#" + id + ") saturate(1.15)";
      ball.classList.add("is-lens");
    }
    var K = opt.stiffness || 0.14, D = opt.damping || 0.72, hoverGrow = opt.hoverGrow || 1.28;
    var tx = -500, ty = -500, x = tx, y = ty, vx = 0, vy = 0, grow = 1, gT = 1, running = false;
    function frame() {
      vx = (vx + (tx - x) * K) * D; vy = (vy + (ty - y) * K) * D; x += vx; y += vy;
      grow += (gT - grow) * 0.18;
      var sp = Math.sqrt(vx * vx + vy * vy), st = Math.min(opt.maxStretch || 0.42, sp * (opt.stretch || 0.018));
      var ang = st < 0.004 ? 0 : Math.atan2(vy, vx) * 180 / Math.PI;
      ball.style.left = x.toFixed(1) + "px"; ball.style.top = y.toFixed(1) + "px";   // never translate
      // stretch along the motion with no net rotation, so the round map lines up
      ball.style.transform = "rotate(" + ang.toFixed(1) + "deg) scale(" + ((1 + st) * grow).toFixed(3) + "," +
        ((1 - st * 0.55) * grow).toFixed(3) + ") rotate(" + (-ang).toFixed(1) + "deg)";
      if (sp > 0.02 || Math.abs(tx - x) > 0.1 || Math.abs(gT - grow) > 0.002) requestAnimationFrame(frame); else running = false;
    }
    function kick() { if (!running) { running = true; requestAnimationFrame(frame); } }
    document.addEventListener("pointermove", function (e) {
      if (e.pointerType !== "mouse") return;
      if (!ball.classList.contains("is-on")) { x = tx = e.clientX; y = ty = e.clientY; ball.classList.add("is-on"); }
      tx = e.clientX; ty = e.clientY;
      gT = e.target.closest && e.target.closest(opt.grows || "a, button, summary, label, input, select, textarea") ? hoverGrow : 1;
      kick();
    }, { passive: true });
    document.documentElement.addEventListener("pointerleave", function () { ball.classList.remove("is-on"); });
    window.addEventListener("blur", function () { ball.classList.remove("is-on"); });
    return ball;
  }

  // ---- glass panels and buttons ------------------------------------------
  // Any element matching the selector gets a lens sized to its own box and
  // border-radius. Re-runs on resize. Put it over something worth bending
  // (a photo, a pattern, type); over a flat colour glass shows nothing.
  function glassify(selector, opt) {
    opt = opt || {};
    var els = Array.prototype.slice.call(document.querySelectorAll(selector || ".lg-glass"));
    if (!els.length || !chromium()) return els;
    function apply(el) {
      var r = el.getBoundingClientRect(), w = Math.round(r.width), h = Math.round(r.height);
      if (!w || !h || (el._lgW === w && el._lgH === h)) return;
      el._lgW = w; el._lgH = h;
      var rad = parseFloat(getComputedStyle(el).borderTopLeftRadius) || 0;
      var band = opt.band || Math.min(w, h) * 0.32;
      var id = filterFor(lensMap({ width: w, height: h, radius: rad, band: band, push: opt.push || band * 0.5, interior: opt.interior == null ? 0.12 : opt.interior }), w, h);
      el.style.backdropFilter = el.style.webkitBackdropFilter = "url(#" + id + ") " + (opt.extra || "saturate(1.2) brightness(1.04)");
      el.classList.add("is-lens");
    }
    els.forEach(apply);
    if (window.ResizeObserver) { var ro = new ResizeObserver(function (en) { en.forEach(function (e) { apply(e.target); }); }); els.forEach(function (el) { ro.observe(el); }); }
    return els;
  }

  // ---- magnet buttons ------------------------------------------------------
  // Within reach, a button slides toward the cursor and springs back when it
  // leaves. Moves with left/top (position: relative), never transform, so a
  // glass lens on the button stays aligned. Mouse/trackpad only.
  //   reach: px from the button's edge where the pull starts (default 140),
  //          or "page": every button follows the cursor anywhere on screen
  //   curve: how fast the pull grows as the cursor gets closer (1 = linear, 2 = much stronger up close)
  //   pull:  share of the cursor offset the button follows (default 0.35)
  //   max:   cap on the travel in px (default 26)
  function magnet(selector, opt) {
    opt = opt || {};
    var els = Array.prototype.slice.call(document.querySelectorAll(selector));
    if (!els.length || !matchMedia("(hover: hover) and (pointer: fine)").matches) return els;
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return els;
    var page = opt.reach === "page", reach = page ? 0 : (opt.reach || 140), curve = opt.curve || 1, pull = opt.pull || 0.35, max = opt.max || 26, K = opt.stiffness || 0.16;
    var st = els.map(function (el) {
      if (getComputedStyle(el).position === "static") el.style.position = "relative";
      return { el: el, x: 0, y: 0, tx: 0, ty: 0 };
    });
    var mx = -1e4, my = -1e4, running = false;
    function aim() {
      st.forEach(function (s) {
        var r = s.el.getBoundingClientRect();
        if (!r.width || getComputedStyle(s.el).visibility === "hidden") { s.tx = s.ty = 0; return; }
        // the resting box: undo our own offset
        var cx = r.left - s.x + r.width / 2, cy = r.top - s.y + r.height / 2;
        var ex = Math.max(0, Math.abs(mx - cx) - r.width / 2), ey = Math.max(0, Math.abs(my - cy) - r.height / 2);
        var d = Math.sqrt(ex * ex + ey * ey), R = page ? Math.sqrt(innerWidth * innerWidth + innerHeight * innerHeight) : reach;
        if (d >= R) { s.tx = s.ty = 0; return; }
        // travel grows as the cursor closes in (max at the edge), never past pull x the distance
        var vx = mx - cx, vy = my - cy, D = Math.sqrt(vx * vx + vy * vy) || 1;
        var mag = Math.min(max * Math.pow(1 - d / R, curve), D * pull);
        s.tx = vx / D * mag; s.ty = vy / D * mag;
      });
    }
    function frame() {
      var moving = false;
      st.forEach(function (s) {
        s.x += (s.tx - s.x) * K; s.y += (s.ty - s.y) * K;
        if (Math.abs(s.tx - s.x) < 0.05 && Math.abs(s.ty - s.y) < 0.05) { s.x = s.tx; s.y = s.ty; } else moving = true;
        s.el.style.left = s.x.toFixed(2) + "px"; s.el.style.top = s.y.toFixed(2) + "px";
      });
      if (moving) requestAnimationFrame(frame); else running = false;
    }
    function kick() { aim(); if (!running) { running = true; requestAnimationFrame(frame); } }
    document.addEventListener("pointermove", function (e) { if (e.pointerType !== "mouse") return; mx = e.clientX; my = e.clientY; kick(); }, { passive: true });
    window.addEventListener("scroll", kick, { passive: true });
    document.documentElement.addEventListener("pointerleave", function () { mx = my = -1e4; kick(); });
    return els;
  }

  // ---- cursor pinch ---------------------------------------------------------
  // No ball. A round area glued to the pointer (no spring, no lag) where the
  // page is pulled in toward the cursor point: hardest close to the cursor,
  // fading to nothing at the area's edge, so there's no visible rim.
  //   size:     diameter, px (default 150)
  //   strength: how hard the centre pulls, 0..2.8 (default 2.2). Above 3 the
  //             content folds over itself.
  function pinchMap(size, strength) {
    var R = size / 2, A = strength * R, n = Math.max(2, Math.round(size));
    var peak = A * (1 / 3) * (4 / 9), S = peak * 2.2;
    var cv = document.createElement("canvas"); cv.width = n; cv.height = n;
    var g = cv.getContext("2d"), img = g.createImageData(n, n), px = img.data;
    for (var y = 0; y < n; y++) for (var x = 0; x < n; x++) {
      var X = (x + 0.5) * size / n - R, Y = (y + 0.5) * size / n - R, r = Math.sqrt(X * X + Y * Y), u = r / R;
      var i = (y * n + x) * 4, Rc = 128, Gc = 128;
      if (u < 1 && r > 0) {
        // sample further out than we draw: content looks pulled toward the centre.
        // d(u) = A u (1-u)^2: zero at the cursor and at the edge, strongest near the cursor
        var d = A * u * (1 - u) * (1 - u);
        Rc = 128 + (X / r) * d / S * 255; Gc = 128 + (Y / r) * d / S * 255;
      }
      px[i] = Rc; px[i + 1] = Gc; px[i + 2] = 128; px[i + 3] = 255;
    }
    g.putImageData(img, 0, 0);
    return { url: cv.toDataURL(), scale: S };
  }
  function cursorPinch(opt) {
    opt = opt || {};
    if (!matchMedia("(hover: hover) and (pointer: fine)").matches) return null;
    if (matchMedia("(prefers-reduced-motion: reduce)").matches || !chromium()) return null;
    var size = opt.size || 150, half = size / 2;
    var el = document.createElement("div");
    el.className = "lg-pinch"; el.setAttribute("aria-hidden", "true");
    el.style.cssText = "position:fixed;left:-9999px;top:-9999px;width:" + size + "px;height:" + size + "px;border-radius:50%;" +
      "pointer-events:none;z-index:2147483000;opacity:0;transition:opacity 200ms ease";
    var id = filterFor(pinchMap(size, opt.strength == null ? 2.2 : opt.strength), size, size);
    el.style.backdropFilter = el.style.webkitBackdropFilter = "url(#" + id + ")";
    document.body.appendChild(el);
    // position straight from the event: the area sits exactly on the pointer, every move
    document.addEventListener("pointermove", function (e) {
      if (e.pointerType !== "mouse") return;
      el.style.left = (e.clientX - half) + "px"; el.style.top = (e.clientY - half) + "px";
      if (el.style.opacity !== "1") el.style.opacity = "1";
    }, { passive: true });
    document.documentElement.addEventListener("pointerleave", function () { el.style.opacity = "0"; });
    window.addEventListener("blur", function () { el.style.opacity = "0"; });
    return el;
  }

  root.LiquidGlass = { lensMap: lensMap, filterFor: filterFor, cursorBall: cursorBall, cursorPinch: cursorPinch, glassify: glassify, magnet: magnet, chromium: chromium };
})(window);
