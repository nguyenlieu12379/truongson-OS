/* Espresso Vivace concept: hero pour video + live "open now" status in Seattle time.
   Hours and holiday hours from espressovivace.com, checked 2026-11-20. */
(function () {
  "use strict";

  // Hero pour: portrait crop on phones; motion off shows the finished cup as a still.
  var v = document.querySelector("video.pour");
  if (v) {
    var phone = window.matchMedia("(max-width: 860px)").matches;
    var still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (phone) {
      v.poster = v.getAttribute("data-poster-mobile");
      v.src = v.getAttribute("data-src-mobile");
    }
    if (still) {
      v.removeAttribute("autoplay");
      v.pause();
      v.removeAttribute("src");
      v.load();
      v.poster = v.getAttribute(phone ? "data-final-mobile" : "data-final");
    }
  }

  // Regular hours: [open, close] in minutes after midnight, by weekday (0 = Sunday).
  var HOURS = {
    brix:  { all: [360, 1140] },                                 // 6am to 7pm daily
    alley: { weekday: [360, 960], weekend: [420, 1020] }        // 6am to 4pm, 7am to 5pm
  };
  // Holiday overrides, "YYYY-MM-DD": null (closed) or [open, close].
  var HOLIDAYS = {
    brix: {
      "2026-11-26": [480, 840], "2026-12-08": [360, 900], "2026-12-24": [360, 960],
      "2026-12-25": null, "2026-12-31": [360, 1140], "2027-01-01": [480, 1140]
    },
    alley: {
      "2026-11-26": null, "2026-12-08": [360, 900], "2026-12-24": [420, 840],
      "2026-12-25": null, "2026-12-31": [360, 960], "2027-01-01": [480, 960]
    }
  };

  var fmt = function (m) {
    var h = Math.floor(m / 60), mm = m % 60, ap = h >= 12 ? "pm" : "am";
    h = h % 12 || 12;
    return h + (mm ? ":" + String(mm).padStart(2, "0") : "") + ap;
  };

  var seattleNow = function () {
    var parts = new Intl.DateTimeFormat("en-US", {
      timeZone: "America/Los_Angeles", year: "numeric", month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit", hourCycle: "h23", weekday: "short"
    }).formatToParts(new Date());
    var o = {};
    parts.forEach(function (p) { o[p.type] = p.value; });
    var days = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
    return { key: o.year + "-" + o.month + "-" + o.day, dow: days[o.weekday], min: (+o.hour) * 60 + (+o.minute) };
  };

  var hoursFor = function (id, key, dow) {
    if (HOLIDAYS[id] && Object.prototype.hasOwnProperty.call(HOLIDAYS[id], key)) return HOLIDAYS[id][key];
    var h = HOURS[id];
    return h.all || (dow === 0 || dow === 6 ? h.weekend : h.weekday);
  };

  var update = function () {
    var now = seattleNow();
    document.querySelectorAll("[data-status]").forEach(function (el) {
      var id = el.getAttribute("data-status");
      var today = hoursFor(id, now.key, now.dow);
      var t = el.querySelector(".status__t");
      var open = !!today && now.min >= today[0] && now.min < today[1];
      el.setAttribute("data-open", String(open));
      if (open) t.textContent = "Open now, until " + fmt(today[1]);
      else if (today && now.min < today[0]) t.textContent = "Closed, opens " + fmt(today[0]) + " today";
      else {
        // Next opening within the coming week.
        var d = new Date(now.key + "T12:00:00Z"), label = "tomorrow";
        for (var i = 1; i <= 7; i++) {
          d.setUTCDate(d.getUTCDate() + 1);
          var k = d.toISOString().slice(0, 10), h = hoursFor(id, k, d.getUTCDay());
          if (h) {
            if (i > 1) label = d.toLocaleDateString("en-US", { weekday: "long", timeZone: "UTC" });
            t.textContent = "Closed, opens " + fmt(h[0]) + " " + label;
            break;
          }
        }
      }
    });
  };

  // Appear on scroll: tag groups, stagger children, reveal once on entry.
  var groups = [
    [".hero__text > *", 70, 0], [".hero__img", 0, 160],
    [".block__head", 0, 0], [".menu__col", 90, 0], [".outside", 0, 0],
    [".place", 110, 0], [".holiday", 0, 0], [".order__card", 90, 0],
    [".foot > *", 70, 0]
  ];
  var tagged = [];
  groups.forEach(function (g) {
    var els = document.querySelectorAll(g[0]);
    Array.prototype.forEach.call(els, function (el, i) {
      el.classList.add("rv");
      if (el.matches(".hero__img, .outside, .place")) el.classList.add("rv--scale");
      el.style.setProperty("--d", (g[2] + i * g[1]) + "ms");
      tagged.push(el);
    });
  });
  // Menu items cascade inside each column after the column lands.
  Array.prototype.forEach.call(document.querySelectorAll(".menu__col"), function (col) {
    Array.prototype.forEach.call(col.querySelectorAll("li"), function (li, i) {
      li.classList.add("rv");
      li.style.setProperty("--d", Math.min(i * 35, 420) + "ms");
      tagged.push(li);
    });
  });
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
      });
    }, { rootMargin: "0px 0px -10% 0px", threshold: 0.01 });
    tagged.forEach(function (el) { io.observe(el); });
  } else {
    tagged.forEach(function (el) { el.classList.add("in"); });
  }

  if (window.Intl && Intl.DateTimeFormat) {
    update();
    setInterval(update, 60000);
  }
})();
