/* liquid-glass.js: refractive "liquid glass" for plain HTML sites.
   Load with defer, after head.html is in <head>. No dependencies.

     LiquidGlass.cursorBall()          glass ball that springs after the mouse
     LiquidGlass.glassify(".lg-glass") rounded-rect glass panels and buttons
     LiquidGlass.venom("button.lg-glass") glass goo that oozes out of a button,
                                       crawls to the mouse and latches on
     LiquidGlass.lensMap(...)          the displacement map all of these use

   The theme switch (toggle + circle-lens transition) lives in head.html, not
   here, so a stale cached copy of this file can never leave the toggle dead.

   How the bending works: an SVG feDisplacementMap reads a small canvas
   image. R = horizontal pull, G = vertical pull, 128 = none. The pull points
   inward, so the edge samples from inside the shape: content bends around
   the rim like light through a thick lens.

   Rules that each cost a debugging round (see SKILL.md):
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
    var size = opt.size || 112;
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
      var sp = Math.sqrt(vx * vx + vy * vy), st = Math.min(0.42, sp * 0.018);
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

  // ---- glass venom --------------------------------------------------------
  // Glass goo oozes out of a button once the mouse is within reach, crawls
  // toward the pointer like a slithering tongue, and latches onto it. The
  // latched blob takes the cursor's place (the ball hides). When the mouse
  // leaves reach the goo pulls back into the button. Only the nearest button
  // in reach is active. Mouse/trackpad only; off with reduced motion.
  //   reach     how far from a button's edge the crawl starts, in cursor-ball
  //             widths (default 5)
  //   unit      px per cursor-ball width (default 112, match cursorBall size)
  //   headSize  px, the blob at rest (default 64)
  //   catch     latch when the head is this many widths from the pointer (0.35)
  function venom(selector, opt) {
    opt = opt || {};
    if (!matchMedia("(hover: hover) and (pointer: fine)").matches) return null;
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return null;
    var els = Array.prototype.slice.call(document.querySelectorAll(selector || "button.lg-glass, a.lg-glass"));
    if (!els.length) return null;
    var unit = opt.unit || 112, reach = (opt.reach || 5) * unit, catchR = (opt.catch || 0.35) * unit;
    var headSize = opt.headSize || 64, latchScale = unit / headSize;
    var K = opt.stiffness || 0.07, D = opt.damping || 0.8;
    var lensed = chromium();
    // one SVG layer for all the tongues; no viewBox, so its units are client px
    var svg = document.createElementNS(SVGNS, "svg");
    svg.setAttribute("class", "lg-venom-svg"); svg.setAttribute("aria-hidden", "true");
    document.body.appendChild(svg);
    var ptr = { x: 0, y: 0, has: false }, active = null, running = false;
    var list = els.map(function (el) {
      var path = document.createElementNS(SVGNS, "path");
      path.setAttribute("class", "lg-venom-tail"); svg.appendChild(path);
      var head = document.createElement("div");
      head.className = "lg-venom-head"; head.setAttribute("aria-hidden", "true");
      head.style.setProperty("--lg-vh", headSize + "px");
      document.body.appendChild(head);
      if (lensed) {
        var id = filterFor(lensMap({ width: headSize, height: headSize, band: headSize * 0.25, push: headSize * 0.14, interior: 0.22 }), headSize, headSize);
        head.style.backdropFilter = head.style.webkitBackdropFilter = "url(#" + id + ") saturate(1.15)";
        head.classList.add("is-lens");
      }
      return { el: el, path: path, head: head, r: null, cx: 0, cy: 0, d: Infinity,
               hx: 0, hy: 0, hvx: 0, hvy: 0, amt: 0, sc: 0.3, latched: false, placed: false };
    });

    // distance from a point to a rectangle (0 when inside)
    function rectDist(r, x, y) {
      var dx = Math.max(r.left - x, 0, x - r.right), dy = Math.max(r.top - y, 0, y - r.bottom);
      return Math.sqrt(dx * dx + dy * dy);
    }
    // the tongue: a tapered band from the button's edge to the head, with a
    // travelling wave so it slithers. Width and wave scale with amt (0..1).
    function tongue(s, t) {
      var r = s.r, hx = s.hx, hy = s.hy;
      var ax = Math.min(Math.max(hx, r.left), r.right), ay = Math.min(Math.max(hy, r.top), r.bottom);
      var dx = hx - ax, dy = hy - ay, L = Math.sqrt(dx * dx + dy * dy);
      if (L < 1.5 || s.amt < 0.01) return "";
      var ux = dx / L, uy = dy / L, nx = -uy, ny = ux;
      var neck = Math.min(26, Math.max(12, Math.min(r.width, r.height) * 0.45));
      var headR = headSize * 0.5 * s.sc * 0.9;
      var amp = Math.min(24, L * 0.12) * s.amt, N = 24, left = [], right = [];
      for (var i = 0; i <= N; i++) {
        var u = i / N, sm = u * u * (3 - 2 * u);
        var w = (neck + (headR - neck) * sm) * s.amt * (1 + 0.08 * Math.sin(t * 0.02 - u * 9));
        var b = amp * Math.sin(Math.PI * u) * Math.sin(u * 6.5 - t * 0.009);
        var px = ax + dx * u + nx * b, py = ay + dy * u + ny * b;
        left.push(px + nx * w, py + ny * w); right.push(px - nx * w, py - ny * w);
      }
      var d = "M" + left[0].toFixed(1) + " " + left[1].toFixed(1);
      for (var j = 2; j < left.length; j += 2) d += "L" + left[j].toFixed(1) + " " + left[j + 1].toFixed(1);
      for (var k = right.length - 2; k >= 0; k -= 2) d += "L" + right[k].toFixed(1) + " " + right[k + 1].toFixed(1);
      return d + "Z";
    }

    function frame(t) {
      var has = ptr.has, px = ptr.x, py = ptr.y, busy = false;
      list.forEach(function (s) {
        s.r = s.el.getBoundingClientRect();
        s.cx = (s.r.left + s.r.right) / 2; s.cy = (s.r.top + s.r.bottom) / 2;
        if (!s.placed) { s.hx = s.cx; s.hy = s.cy; s.placed = true; }   // first sight: the head starts in its button
        s.d = has ? rectDist(s.r, px, py) : Infinity;   // 0 = pointer is on the button
      });
      // keep the current button while in reach (with a little hysteresis), else take the nearest in reach
      var next = (active && active.d > 0 && active.d < reach * 1.08) ? active : null;
      if (!next) { var bestD = Infinity; list.forEach(function (s) { if (s.d > 0 && s.d < reach && s.d < bestD) { next = s; bestD = s.d; } }); }
      active = next;

      list.forEach(function (s) {
        var on = s === active, want = on ? 1 : 0;
        if (!on) s.latched = false;
        else if (!s.latched && Math.hypot(s.hx - px, s.hy - py) < catchR) s.latched = true;
        s.amt += (want - s.amt) * (on ? 0.14 : 0.1);
        if (!on && s.amt < 0.002) s.amt = 0;
        // idle: the head rests in the button, so it starts from the button's current centre
        if (!on && s.amt === 0) { s.hx = s.cx; s.hy = s.cy; s.hvx = s.hvy = 0; }
        var tx = on ? px : s.cx, ty = on ? py : s.cy;
        var k = s.latched ? 0.22 : (on ? K : 0.1), dmp = s.latched ? 0.7 : D;
        s.hvx = (s.hvx + (tx - s.hx) * k) * dmp; s.hvy = (s.hvy + (ty - s.hy) * k) * dmp;
        s.hx += s.hvx; s.hy += s.hvy;
        var scT = s.latched ? latchScale : (on ? 1 : 0.3);
        s.sc += (scT - s.sc) * 0.18;
        s.head.style.left = s.hx.toFixed(1) + "px"; s.head.style.top = s.hy.toFixed(1) + "px";
        s.head.style.transform = "scale(" + s.sc.toFixed(3) + ")";
        s.head.style.opacity = s.amt < 0.002 ? "0" : Math.min(1, s.amt * 2.5).toFixed(3);
        s.path.setAttribute("d", tongue(s, t));
        if (Math.abs(want - s.amt) > 0.002 || Math.abs(s.hvx) + Math.abs(s.hvy) > 0.05 ||
            Math.abs(tx - s.hx) + Math.abs(ty - s.hy) > 0.5 || Math.abs(scT - s.sc) > 0.002) busy = true;
      });
      var anyLatched = list.some(function (s) { return s.latched; });
      document.documentElement.classList.toggle("lg-venom-latched", anyLatched);
      if (busy) requestAnimationFrame(frame); else running = false;
    }
    function kick() { if (!running) { running = true; requestAnimationFrame(frame); } }

    document.addEventListener("pointermove", function (e) {
      if (e.pointerType !== "mouse") return;
      ptr.x = e.clientX; ptr.y = e.clientY; ptr.has = true; kick();
    }, { passive: true });
    document.documentElement.addEventListener("pointerleave", function () { ptr.has = false; kick(); });
    window.addEventListener("blur", function () { ptr.has = false; kick(); });
    window.addEventListener("scroll", kick, { passive: true });
    return els;
  }

  root.LiquidGlass = { lensMap: lensMap, filterFor: filterFor, cursorBall: cursorBall, glassify: glassify, venom: venom, chromium: chromium };
})(window);
