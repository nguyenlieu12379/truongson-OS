/* Espresso Vivace concept: page-owned behaviour. The engine stays untouched.
   The folio: names the chapter in the margin. */
(function () {
  "use strict";
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

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
