/* Tōv Coffee: page-only behaviour.
   1. The destination blind: rolls to the stop you are at, opens into the route.
   2. Open-now at the terminus (Portland time).
   3. A small pointer lean on the doorway (fine pointers only, motion on). */
(function () {
  "use strict";
  var reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------------------------------------------------------- hours */
  // Yelp, Nov 2026 snapshot. 0 = Sunday. Minutes after midnight, or null.
  var OPEN = 9 * 60 + 30, CLOSE = 17 * 60;
  var WEEK = [[OPEN, CLOSE], [OPEN, CLOSE], [OPEN, CLOSE], null, [OPEN, CLOSE], [OPEN, CLOSE], [OPEN, CLOSE]];
  var DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  function portlandNow() {
    var parts = new Intl.DateTimeFormat("en-US", {
      timeZone: "America/Los_Angeles", weekday: "short", hour: "numeric", minute: "numeric", hourCycle: "h23"
    }).formatToParts(new Date());
    var o = {};
    parts.forEach(function (p) { o[p.type] = p.value; });
    var day = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(o.weekday);
    return { day: day, min: (+o.hour % 24) * 60 + +o.minute };
  }
  function clock(m) {
    var h = Math.floor(m / 60), mm = m % 60, ap = h >= 12 ? "pm" : "am";
    h = h % 12 || 12;
    return h + (mm ? ":" + String(mm).padStart(2, "0") : "") + ap;
  }
  function status() {
    var n = portlandNow(), t = WEEK[n.day];
    if (t && n.min >= t[0] && n.min < t[1]) return { open: true, long: "Open now, until " + clock(t[1]), short: "Open now, till " + clock(t[1]) };
    if (t && n.min < t[0]) return { open: false, long: "Closed now. Opens today at " + clock(t[0]), short: "Opens today " + clock(t[0]) };
    for (var k = 1; k <= 7; k++) {
      var d = (n.day + k) % 7;
      if (WEEK[d]) {
        var when = k === 1 ? "tomorrow" : DAYS[d];
        return { open: false, long: "Closed now. Opens " + when + " at " + clock(WEEK[d][0]), short: "Opens " + (k === 1 ? "tomorrow" : DAYS[d].slice(0, 3)) + " " + clock(WEEK[d][0]) };
      }
    }
  }
  var st = status();
  var statusEl = document.getElementById("status");
  if (statusEl && st) { statusEl.textContent = st.long; statusEl.dataset.open = String(st.open); }
  var today = portlandNow().day;
  var hours = document.getElementById("hours");
  if (hours) {
    var order = [1, 2, 3, 4, 5, 6, 0];
    hours.innerHTML = order.map(function (i) {
      var t = WEEK[i], cls = (t ? "" : "shut") + (i === today ? " today" : "");
      return '<li class="' + cls.trim() + '"><b>' + DAYS[i].slice(0, 3) + "</b><span>" +
        (t ? clock(t[0]).replace("am", "") + "<br>to " + clock(t[1]).replace("pm", "") : "Closed") + "</span></li>";
    }).join("");
  }
  var terminus = document.getElementById("terminus");
  if (terminus && st) terminus.setAttribute("data-via", st.short);

  /* ---------------------------------------------------------- blind */
  var stops = Array.prototype.slice.call(document.querySelectorAll("[data-stop]"));
  var roll = document.querySelector(".blind__roll");
  var now = document.querySelector(".blind__now");
  var btn = document.querySelector(".blind__btn");
  var route = document.getElementById("route");
  var list = route.querySelector("ol");

  stops.forEach(function (s, i) {
    if (!s.id) s.id = "stop-" + i;
    var line = document.createElement("span");
    line.className = "blind__stop";
    line.innerHTML = '<span class="blind__dest"></span><span class="blind__via"></span>';
    line.firstChild.textContent = s.dataset.stop;
    line.lastChild.textContent = s.dataset.via || "";
    roll.appendChild(line);

    var li = document.createElement("li");
    var a = document.createElement("a");
    a.href = "#" + s.id;
    a.innerHTML = "<b></b>";
    a.querySelector("b").textContent = s.dataset.stop;
    li.appendChild(a);
    list.appendChild(li);
  });
  var links = list.querySelectorAll("a");

  function lineH() { return roll.firstChild ? roll.firstChild.getBoundingClientRect().height : 48; }

  // Float stop index: whole while you are inside a stop, rolling over the
  // last 30% of a screen before the next stop reaches the trigger line.
  function targetIndex() {
    var vh = innerHeight, trig = vh * 0.42, zone = vh * 0.3, idx = 0;
    for (var i = 1; i < stops.length; i++) {
      var top = stops[i].getBoundingClientRect().top;
      if (top <= trig) idx = i;
      else if (top < trig + zone) { idx = i - 1 + (1 - (top - trig) / zone); break; }
      else break;
    }
    // The terminus is short; land on it once the page bottom is reached.
    if (innerHeight + scrollY >= document.documentElement.scrollHeight - 4) idx = stops.length - 1;
    return idx;
  }

  var cur = targetIndex(), shown = -1, raf = 0;
  function paint() {
    var t = Math.round(targetIndex());
    cur = reduce ? Math.round(t) : cur + (t - cur) * 0.16;
    if (Math.abs(t - cur) < 0.002) cur = t;
    roll.style.transform = "translate3d(0," + (-cur * lineH()).toFixed(2) + "px,0)";
    var i = Math.round(cur);
    if (i !== shown) {
      shown = i;
      now.textContent = stops[i].dataset.stop;
      for (var k = 0; k < links.length; k++) {
        if (k === i) links[k].setAttribute("aria-current", "step"); else links[k].removeAttribute("aria-current");
      }
    }
    raf = Math.abs(t - cur) > 0.001 ? requestAnimationFrame(paint) : 0;
  }
  function kick() { if (!raf) raf = requestAnimationFrame(paint); }
  addEventListener("scroll", kick, { passive: true });
  addEventListener("resize", kick);
  paint();

  function setOpen(open) {
    btn.setAttribute("aria-expanded", String(open));
    route.hidden = !open;
    if (open) {
      var c = list.querySelector('[aria-current="step"]') || links[0];
      c.focus();
    }
  }
  btn.addEventListener("click", function () { setOpen(route.hidden); });
  list.addEventListener("click", function (e) { if (e.target.closest("a")) setOpen(false); });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && !route.hidden) { setOpen(false); btn.focus(); }
  });
  document.addEventListener("pointerdown", function (e) {
    if (!route.hidden && !e.target.closest(".blind")) setOpen(false);
  });

  /* ---------------------------------------------------------- rail focus */
  // Keyboard focus inside the sideways menu scrolls the page to where the
  // pan shows that plate, so a focused link is never off screen.
  var menu = document.getElementById("menu"), rail = menu && menu.querySelector(".rail");
  if (rail && !reduce) {
    rail.addEventListener("focusin", function (e) {
      var item = e.target.closest(".rail > *");
      if (!item) return;
      var travel = menu.offsetHeight - innerHeight, over = rail.scrollWidth - innerWidth;
      if (travel <= 0 || over <= 0) return;
      var f = Math.min(1, Math.max(0, (item.offsetLeft + item.offsetWidth - innerWidth * 0.9) / over));
      var top = menu.getBoundingClientRect().top + scrollY;
      scrollTo({ top: top + f * travel, behavior: "instant" });
    });
  }

  /* ---------------------------------------------------------- lean */
  var door = document.getElementById("doorway");
  if (!reduce && matchMedia("(hover: hover) and (pointer: fine)").matches && door) {
    var tx = 0, ty = 0, x = 0, y = 0, lr = 0;
    door.addEventListener("pointermove", function (e) {
      tx = (e.clientX / innerWidth) * 2 - 1; ty = (e.clientY / innerHeight) * 2 - 1;
      if (!lr) lr = requestAnimationFrame(lean);
    });
    door.addEventListener("pointerleave", function () { tx = 0; ty = 0; if (!lr) lr = requestAnimationFrame(lean); });
    function lean() {
      x += (tx - x) * 0.08; y += (ty - y) * 0.08;
      door.style.setProperty("--mx", x.toFixed(3));
      door.style.setProperty("--my", y.toFixed(3));
      lr = (Math.abs(tx - x) > 0.002 || Math.abs(ty - y) > 0.002) ? requestAnimationFrame(lean) : 0;
    }
  }
})();
