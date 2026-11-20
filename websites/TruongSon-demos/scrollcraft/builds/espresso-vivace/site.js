/* Espresso Vivace concept: page-owned behaviour. The engine stays untouched.
   1. The scroll-poured rosetta (signature move, the peak).
   2. The folio: names the chapter in the margin. */
(function () {
  "use strict";
  var NS = "http://www.w3.org/2000/svg";
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ------------------------------------------------------------ rosetta -- */
  var act = document.getElementById("pour");
  var milk = document.getElementById("milk");
  var pull = document.getElementById("pull");
  var stream = document.getElementById("stream");

  if (act && milk) {
    // Leaves from the base (near the drinker, bottom) to the tip (top).
    // Each is a crescent that bows toward the base, the way a wiggled pour
    // folds the foam back on itself.
    var N = 11;
    var leaves = [];
    for (var i = 0; i < N; i++) {
      var t = i / (N - 1);                                   // 0 base .. 1 tip
      var y = 122 - t * 252;                                 // 122 .. -130
      var w = t < 0.25 ? 96 + (t / 0.25) * 30 : 126 * (1 - ((t - 0.25) / 0.75) * 0.8);
      var a = w * 0.24;                                      // arch height
      var d = w * 0.38;                                      // arms fall back toward the base
      var th = 24 - t * 11;                                  // thickness at the spine; tips pinch to points
      var skew = (i % 2 ? -1 : 1) * w * 0.04;                // a hand pour is never symmetric
      var f = function (v) { return v.toFixed(1); };
      var path = "M " + f(-w) + " " + f(d) +
        " Q " + f(-w * 0.62) + " " + f(-a) + " " + f(skew) + " " + f(-a * 0.72) +
        " Q " + f(w * 0.62) + " " + f(-a) + " " + f(w) + " " + f(d) +
        " Q " + f(w * 0.6) + " " + f(-a + th * 1.25) + " " + f(skew) + " " + f(-a * 0.72 + th) +
        " Q " + f(-w * 0.6) + " " + f(-a + th * 1.25) + " " + f(-w) + " " + f(d) + " Z";
      var p = document.createElementNS(NS, "path");
      p.setAttribute("d", path);
      milk.appendChild(p);
      leaves.push({ el: p, y: y, w: w, wob: (i % 2 ? -1 : 1) * (6 - t * 4) });
    }
    // The heart dropped at the tip before the pull-through.
    var heart = document.createElementNS(NS, "circle");
    heart.setAttribute("cy", "-150");
    milk.appendChild(heart);

    var clamp = function (v, a, b) { return v < a ? a : v > b ? b : v; };
    var seg = function (p, a, b) { return clamp((p - a) / (b - a), 0, 1); };
    var easeOut = function (x) { return 1 - Math.pow(1 - x, 3); };

    var render = function (p) {
      // 0.00-0.12  stream arrives, pool blooms at the base
      // 0.10-0.66  leaves fold in, base to tip, pour point walks back
      // 0.62-0.72  heart drops at the tip
      // 0.70-0.86  pull-through: stream lifts, line cuts tip to base
      var pourY = 140;
      for (var i = 0; i < leaves.length; i++) {
        var L = leaves[i];
        var a = 0.03 + i * 0.061;
        var k = easeOut(seg(p, a, a + 0.12));
        // Leaves drift slightly toward the base as later ones push in.
        var settle = seg(p, a + 0.05, 0.8) * 10;
        var wob = Math.sin(k * Math.PI) * L.wob * 2.2;
        L.el.setAttribute("transform",
          "translate(" + wob.toFixed(2) + " " + (L.y + settle).toFixed(2) + ") scale(" + (0.2 + k * 0.8).toFixed(3) + " " + (0.5 + k * 0.5).toFixed(3) + ")");
        L.el.style.opacity = k > 0.001 ? Math.min(1, k * 2) : 0;
        if (k > 0 && k < 1) pourY = L.y;
        if (k >= 1) pourY = Math.min(pourY, L.y - 8);
      }
      var hk = easeOut(seg(p, 0.72, 0.8));
      heart.setAttribute("r", String(4 + hk * 15));
      heart.style.opacity = hk > 0 ? 1 : 0;
      if (hk > 0 && hk < 1) pourY = -150;

      // Pull-through: draw from tip to base.
      var pk = easeOut(seg(p, 0.8, 0.94));
      pull.style.strokeDashoffset = String(1 - pk);
      if (pk > 0) pourY = -176 + pk * 344;

      // Stream: falls from above the cup to the pour point, thins and lifts at the end.
      var on = seg(p, 0.0, 0.05);
      var off = seg(p, 0.92, 0.97);
      var vis = on * (1 - off);
      var width = 12 - pk * 7;
      stream.setAttribute("x", String(-width / 2));
      stream.setAttribute("width", String(width));
      stream.setAttribute("y", String(-900));
      stream.setAttribute("height", String(Math.max(0, 900 + pourY - off * 400)));
      stream.style.opacity = vis.toFixed(3);
    };

    if (reduce) {
      render(1);
    } else {
      var last = -1;
      var tick = function () {
        var r = act.getBoundingClientRect();
        var travel = Math.max(r.height - window.innerHeight, 1);
        var p = clamp(-r.top / travel, 0, 1);
        if (Math.abs(p - last) > 0.0005) { render(p); last = p; }
        requestAnimationFrame(tick);
      };
      render(0);
      requestAnimationFrame(tick);
    }
  }

  /* -------------------------------------------------------------- folio -- */
  var n = document.querySelector(".folio__n");
  var t = document.querySelector(".folio__t");
  var box = document.querySelector(".folio__ch");
  var folio = document.querySelector(".folio");
  var secs = document.querySelectorAll("[data-folio]");
  var current = null;
  var set = function (el) {
    if (el === current) return;
    current = el;
    var nn = el.getAttribute("data-folio") || " ";
    var tt = el.getAttribute("data-folio-t") || "";
    var g = el.classList.contains("ch--dark") || el.classList.contains("pour") ? "dark" : el.classList.contains("ch--yellow") ? "yellow" : "paper";
    folio.setAttribute("data-ground", g);
    if (reduce) { n.textContent = nn; t.textContent = tt; return; }
    box.classList.add("is-swap");
    setTimeout(function () { n.textContent = nn; t.textContent = tt; box.classList.remove("is-swap"); }, 160);
  };
  if ("IntersectionObserver" in window && secs.length) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) set(e.target); });
    }, { rootMargin: "-12% 0px -86% 0px" });
    secs.forEach(function (s) { io.observe(s); });
  }
})();
