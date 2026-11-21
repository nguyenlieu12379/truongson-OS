/* F&B practical site template (from the Espresso Vivace demo).
   All business data comes from <script id="site-data" type="application/json">, written by build.mjs.
   Hero video source per device, live open-now status, demo cart, appear-on-scroll. */
(function () {
  "use strict";
  var DATA = {};
  try { DATA = JSON.parse(document.getElementById("site-data").textContent); } catch (e) { /* page still works without the cart */ }

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

  // Regular hours: per location, 7 entries Sun..Sat of [open, close] minutes or null (closed).
  var HOURS = DATA.hours || {};
  // Holiday overrides: per location, "YYYY-MM-DD": null (closed) or [open, close].
  var HOLIDAYS = DATA.holidays || {};

  var fmt = function (m) {
    var h = Math.floor(m / 60), mm = m % 60, ap = h >= 12 ? "pm" : "am";
    h = h % 12 || 12;
    return h + (mm ? ":" + String(mm).padStart(2, "0") : "") + ap;
  };

  var localNow = function () {
    var parts = new Intl.DateTimeFormat("en-US", {
      timeZone: DATA.tz || "America/Los_Angeles", year: "numeric", month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit", hourCycle: "h23", weekday: "short"
    }).formatToParts(new Date());
    var o = {};
    parts.forEach(function (p) { o[p.type] = p.value; });
    var days = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
    return { key: o.year + "-" + o.month + "-" + o.day, dow: days[o.weekday], min: (+o.hour) * 60 + (+o.minute) };
  };

  var hoursFor = function (id, key, dow) {
    if (HOLIDAYS[id] && Object.prototype.hasOwnProperty.call(HOLIDAYS[id], key)) return HOLIDAYS[id][key];
    return HOURS[id] ? HOURS[id][dow] : null;
  };

  var update = function () {
    var now = localNow();
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


  /* ===================== v3.3: order flow (demo cart, no prices, no payment) ===================== */
  var O = DATA.options || {};
  var MILK = O.milkDrinks || [];
  // Drinks the menu lists both hot and iced: [hot name, iced name].
  var PAIRS = O.pairs || [];
  var NO_SIZE = O.noSize || [];
  var KEY = (DATA.slug || "site") + "-cart-v1";

  var pairOf = function (name) {
    for (var i = 0; i < PAIRS.length; i++) {
      if (PAIRS[i][0] === name) return { base: PAIRS[i][0], temp: "Hot" };
      if (PAIRS[i][1] === name) return { base: PAIRS[i][0], temp: "Iced" };
    }
    return null;
  };
  var load = function () { try { var v = JSON.parse(localStorage.getItem(KEY) || "[]"); return Array.isArray(v) ? v : []; } catch (e) { return []; } };
  var save = function () { try { localStorage.setItem(KEY, JSON.stringify(cart)); } catch (e) { /* private mode: cart lives for this visit */ } };
  var cart = load();

  var addDlg = document.getElementById("add");
  var cartDlg = document.getElementById("cart");
  var cartBtn = document.querySelector(".cart-btn");
  var form = document.getElementById("add-form");
  var qtyOut = document.getElementById("add-qty");
  var current = null, opener = null, qty = 1;

  var open = function (dlg, from) {
    opener = from || document.activeElement;
    if (typeof dlg.showModal === "function") dlg.showModal(); else dlg.setAttribute("open", "");
  };
  var close = function (dlg) { if (dlg.open) dlg.close(); };
  [addDlg, cartDlg].forEach(function (dlg) {
    if (!dlg) return;
    dlg.addEventListener("close", function () { if (opener && document.contains(opener)) opener.focus(); });
    // Keep Tab inside the open panel (native modals let it escape to the browser UI).
    dlg.addEventListener("keydown", function (e) {
      if (e.key !== "Tab") return;
      var f = Array.prototype.filter.call(dlg.querySelectorAll('button, [href], input, [tabindex]:not([tabindex="-1"])'), function (el) {
        return !el.disabled && el.offsetParent !== null && !el.closest("[hidden]") && !(el.type === "radio" && !el.checked);
      });
      if (!f.length) return;
      var first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    });
    dlg.addEventListener("click", function (e) {
      if (e.target === dlg) close(dlg);                       // tap on the backdrop
      if (e.target.closest("[data-close]")) close(dlg);
    });
  });

  // Turn each menu line into a button.
  Array.prototype.forEach.call(document.querySelectorAll(".menu li"), function (li) {
    var note = li.querySelector(".m");
    var name = li.firstChild.textContent.trim();
    var b = document.createElement("button");
    b.type = "button"; b.className = "drink"; b.setAttribute("aria-haspopup", "dialog");
    b.setAttribute("aria-label", "Add " + name);
    b.innerHTML = '<span class="drink__name"></span><span class="drink__plus" aria-hidden="true">+</span>';
    b.firstChild.textContent = name;
    if (note) { b.firstChild.appendChild(document.createTextNode(" ")); b.firstChild.appendChild(note); }
    b.dataset.drink = name;
    li.textContent = ""; li.appendChild(b);
    b.addEventListener("click", function () { startAdd(name, b); });
  });

  var setQty = function (n) {
    qty = Math.max(1, Math.min(10, n)); qtyOut.textContent = qty;
    form.querySelector('[data-step="-1"]').disabled = qty <= 1;
    form.querySelector('[data-step="1"]').disabled = qty >= 10;
  };
  form.querySelectorAll("[data-step]").forEach(function (s) {
    s.addEventListener("click", function () { setQty(qty + Number(s.dataset.step)); });
  });
  var show = function (opt, on) { form.querySelector('[data-opt="' + opt + '"]').hidden = !on; };

  var startAdd = function (name, from) {
    var p = pairOf(name);
    current = { name: p ? p.base : name };
    document.getElementById("add-h").textContent = p ? p.base : name;
    form.reset(); setQty(1);
    show("size", NO_SIZE.indexOf(name) < 0);
    show("temp", !!p);
    if (p) form.querySelector('input[name="temp"][value="' + p.temp + '"]').checked = true;
    current.milkFor = function (temp) {
      var n = p ? (temp === "Iced" ? PAIRS.filter(function (x) { return x[0] === p.base; })[0][1] : p.base) : name;
      return MILK.indexOf(n) >= 0;
    };
    show("milk", current.milkFor(p ? p.temp : null));
    open(addDlg, from);
  };
  form.querySelectorAll('input[name="temp"]').forEach(function (r) {
    r.addEventListener("change", function () { if (current) show("milk", current.milkFor(r.value)); });
  });

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var fd = new FormData(form);
    var vis = function (opt) { return !form.querySelector('[data-opt="' + opt + '"]').hidden; };
    var temp = vis("temp") ? fd.get("temp") : null;
    var item = {
      name: temp === "Iced" ? PAIRS.filter(function (x) { return x[0] === current.name; })[0][1] : current.name,
      size: vis("size") ? fd.get("size") : null,
      milk: vis("milk") ? fd.get("milk") : null,
      notes: String(fd.get("notes") || "").trim().slice(0, 80) || null,
      qty: qty
    };
    var same = cart.filter(function (c) { return c.name === item.name && c.size === item.size && c.milk === item.milk && c.notes === item.notes; })[0];
    if (same) same.qty = Math.min(10, same.qty + item.qty); else cart.push(item);
    save(); render(true);
    close(addDlg);
  });

  var count = function () { return cart.reduce(function (n, c) { return n + c.qty; }, 0); };
  var list = cartDlg.querySelector(".cart__list");
  var render = function (bump) {
    var n = count();
    cartBtn.querySelector(".cart-btn__n").textContent = n;
    cartBtn.classList.toggle("has", n > 0);
    cartBtn.setAttribute("aria-label", "Cart, " + n + (n === 1 ? " item" : " items"));
    if (bump) { cartBtn.classList.remove("bump"); void cartBtn.offsetWidth; cartBtn.classList.add("bump"); }
    cartDlg.querySelector(".cart__empty").hidden = n > 0;
    cartDlg.querySelector(".cart__foot").hidden = n === 0;
    list.textContent = "";
    cart.forEach(function (c, i) {
      var li = document.createElement("li"); li.className = "cart__item";
      var opts = [c.size, c.milk && c.milk + " milk", c.notes && "“" + c.notes + "”"].filter(Boolean).join(" · ");
      li.innerHTML = '<span class="cart__name"></span><span class="cart__opts"></span>' +
        '<span class="cart__ctrl"><span class="qty"><button type="button" class="qty__b" data-d="-1"></button><span class="n"></span>' +
        '<button type="button" class="qty__b" data-d="1"></button></span><button type="button" class="rm">Remove</button></span>';
      li.querySelector(".cart__name").textContent = c.name;
      li.querySelector(".cart__opts").textContent = opts;
      li.querySelector(".n").textContent = c.qty;
      var minus = li.querySelector('[data-d="-1"]'), plus = li.querySelector('[data-d="1"]');
      minus.textContent = "−"; plus.textContent = "+";
      minus.setAttribute("aria-label", "One less " + c.name); plus.setAttribute("aria-label", "One more " + c.name);
      plus.disabled = c.qty >= 10;
      li.querySelector(".rm").setAttribute("aria-label", "Remove " + c.name);
      minus.addEventListener("click", function () { if (c.qty > 1) { c.qty--; } else { cart.splice(i, 1); } save(); render(); focusIn(i, ".qty__b"); });
      plus.addEventListener("click", function () { c.qty = Math.min(10, c.qty + 1); save(); render(); focusIn(i, '[data-d="1"]'); });
      li.querySelector(".rm").addEventListener("click", function () { cart.splice(i, 1); save(); render(); focusIn(i, ".rm"); });
      list.appendChild(li);
    });
  };
  // Keep keyboard focus somewhere sensible after the list re-renders.
  var focusIn = function (i, sel) {
    var items = list.querySelectorAll(".cart__item");
    var target = items[Math.min(i, items.length - 1)];
    var el = target ? target.querySelector(sel) : cartDlg.querySelector(".x");
    if (el && !el.disabled) el.focus(); else if (target) target.querySelector(".rm").focus(); else cartDlg.querySelector(".x").focus();
  };
  cartBtn.addEventListener("click", function () { document.getElementById("demo-note").hidden = true; open(cartDlg, cartBtn); });
  document.getElementById("checkout").addEventListener("click", function () {
    var note = document.getElementById("demo-note"); note.hidden = false;
    var first = note.querySelector("a");
    if (first) first.focus(); else { note.setAttribute("tabindex", "-1"); note.focus(); }
  });
  render(false);

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
