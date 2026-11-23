/* Brazilian Passion Foods. Bespoke page code: per-act progress, bites, the fryer, the pan. */
(function () {
  "use strict";
  var reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  var SVGNS = "http://www.w3.org/2000/svg";
  var acts = [].slice.call(document.querySelectorAll("[data-act]"));
  var byName = {}; acts.forEach(function (a) { byName[a.dataset.act] = a; });

  // ---- 1 BITE: holes appear in the word as you scroll ----------------------
  var holes = document.getElementById("bite-holes"), bites = [];
  (function makeBites() {
    // seeded so every visit eats the word the same way
    var s = 7; function rnd() { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; }
    var N = 16;
    for (var i = 0; i < N; i++) {
      var g = document.createElementNS(SVGNS, "g");
      var cx = 90 + (i / (N - 1)) * 1020 + (rnd() - 0.5) * 60, cy = 95 + rnd() * 200, r = 46 + rnd() * 30;
      // a bite: one big circle plus a scallop of small ones on its rim (teeth)
      var parts = [[0, 0, 1]];
      for (var k = 0; k < 5; k++) { var a = (k / 5) * Math.PI * 2 + rnd(); parts.push([Math.cos(a) * r * 0.86, Math.sin(a) * r * 0.86, 0.32]); }
      parts.forEach(function (p) {
        var c = document.createElementNS(SVGNS, "circle");
        c.setAttribute("cx", (cx + p[0]).toFixed(1)); c.setAttribute("cy", (cy + p[1]).toFixed(1)); c.setAttribute("r", "0");
        c._r = r * p[2]; g.appendChild(c);
      });
      g._at = 0.06 + (order(i, N) / N) * 0.62; // when it lands, shuffled
      holes.appendChild(g); bites.push(g);
    }
    function order(i, n) { return (i * 7) % n; }
  })();
  var lastBite = -1;
  function drawBites(p) {
    var q = Math.round(p * 200); if (q === lastBite) return; lastBite = q;
    bites.forEach(function (g) {
      var t = Math.max(0, Math.min(1, (p - g._at) / 0.07));
      var e = t < 1 ? 1 - Math.pow(1 - t, 3) : 1;
      for (var c = g.firstChild; c; c = c.nextSibling) c.setAttribute("r", (c._r * e).toFixed(1));
    });
  }

  // ---- 3 FRY: bubbles, colour, crack ---------------------------------------
  var fry = byName.fry, bubbleBox = fry.querySelector(".bubbles"), bubbles = [];
  (function makeBubbles() {
    var s = 3; function rnd() { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; }
    for (var i = 0; i < 34; i++) {
      var b = document.createElement("i");
      var ang = rnd() * Math.PI * 2, rad = Math.sqrt(rnd()) * 44;
      b.style.setProperty("--x", (50 + Math.cos(ang) * rad).toFixed(1) + "%");
      b.style.setProperty("--y", (50 + Math.sin(ang) * rad).toFixed(1) + "%");
      b.style.setProperty("--s", (6 + rnd() * 18).toFixed(0) + "px");
      b._ph = rnd(); b._sp = 0.6 + rnd() * 1.2;
      bubbleBox.appendChild(b); bubbles.push(b);
    }
  })();
  var steps = [].slice.call(fry.querySelectorAll(".fry-steps li"));
  var heat = 0, fryP = 0;
  function setFry(p) {
    fryP = p;
    var sink = smooth((p - 0.18) / 0.16);        // dough drops into the pan
    var cook = smooth((p - 0.3) / 0.38);          // raw to golden
    var lift = smooth((p - 0.7) / 0.08);          // comes out
    var crack = smooth((p - 0.76) / 0.16);        // cut photo opens from the middle
    heat = smooth((p - 0.22) / 0.1) * (1 - smooth((p - 0.72) / 0.08));
    var st = fry.style;
    st.setProperty("--dy", (-110 + sink * 72 - lift * 30).toFixed(2) + "%");
    st.setProperty("--rot", (-6 + sink * 6 + Math.sin(p * 60) * heat * 1.2).toFixed(2) + "deg");
    st.setProperty("--ds", (1 - sink * 0.12 + lift * 0.1).toFixed(3));
    st.setProperty("--raw", (1 - cook).toFixed(3));
    st.setProperty("--gold", cook.toFixed(3));
    st.setProperty("--heat", heat.toFixed(3));
    st.setProperty("--crack", crack.toFixed(3));
    st.setProperty("--dop", (1 - smooth((p - 0.76) / 0.06)).toFixed(3));
    st.setProperty("--fp", Math.min(1, p / 0.74).toFixed(3));
    steps.forEach(function (li) { li.classList.toggle("on", p >= +li.dataset.from && p < +li.dataset.to); });
  }
  function smooth(t) { t = t < 0 ? 0 : t > 1 ? 1 : t; return t * t * (3 - 2 * t); }
  // bubbles boil on their own clock while the oil is hot (cheap: transform + opacity only)
  function boil(now) {
    if (heat > 0.01 && fryVisible) {
      var t = now / 1000;
      for (var i = 0; i < bubbles.length; i++) {
        var b = bubbles[i], c = (t * b._sp + b._ph) % 1;
        b.style.opacity = (heat * (1 - c) * 0.95).toFixed(2);
        b.style.transform = "translateY(" + (-c * 26).toFixed(1) + "px) scale(" + (0.3 + c * heat).toFixed(2) + ")";
      }
      bubblesOn = true;
    } else if (bubblesOn) {
      bubbles.forEach(function (b) { b.style.opacity = "0"; }); bubblesOn = false;
    }
    requestAnimationFrame(boil);
  }
  var bubblesOn = false, fryVisible = false;

  // ---- 4 MENU: sideways pan -----------------------------------------------
  var menu = byName.menu, track = menu.querySelector(".track"), trackOver = 0;
  function measureMenu() {
    trackOver = Math.max(0, track.scrollWidth - innerWidth);
    // the act is only as long as the sideways travel needs; no dead scroll when the cards already fit
    if (!reduce) menu.style.height = Math.round(innerHeight * 1.15 + trackOver * 1.3) + "px";
  }

  // ---- 5 BOARD: flip in once ---------------------------------------------
  var stops = document.querySelector(".stops");
  [].forEach.call(stops.children, function (li, i) { li.style.setProperty("--i", i); });
  if ("IntersectionObserver" in window && !reduce) {
    new IntersectionObserver(function (es, io) { es.forEach(function (e) { if (e.isIntersecting) { stops.classList.add("in"); io.disconnect(); } }); }, { threshold: 0.3 }).observe(stops);
  } else stops.classList.add("in");

  if (reduce) { drawBites(1); setFry(1); return; }

  // ---- the loop: read all rects first, then write -------------------------
  var ticking = false, vh = innerHeight;
  function progress(el) {
    var r = el.getBoundingClientRect(), span = r.height - vh;
    if (span <= 0) { span = r.height + vh; return { p: clamp((vh - r.top) / span), vis: r.bottom > 0 && r.top < vh }; }
    return { p: clamp(-r.top / span), vis: r.bottom > 0 && r.top < vh };
  }
  function clamp(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }
  function update() {
    ticking = false;
    var b = progress(byName.bite), t = progress(byName.truck), f = progress(fry), m = progress(menu);
    if (b.vis) { byName.bite.style.setProperty("--p", b.p.toFixed(4)); drawBites(b.p); }
    if (t.vis) byName.truck.style.setProperty("--p", t.p.toFixed(4));
    fryVisible = f.vis; if (f.vis) setFry(f.p);
    if (m.vis) track.style.setProperty("--tx", (-m.p * trackOver).toFixed(1) + "px");
  }
  function onScroll() { if (!ticking) { ticking = true; requestAnimationFrame(update); } }
  addEventListener("scroll", onScroll, { passive: true });
  addEventListener("resize", function () { vh = innerHeight; measureMenu(); onScroll(); });
  addEventListener("load", function () { measureMenu(); onScroll(); });
  measureMenu(); update(); requestAnimationFrame(boil);
})();
