#!/usr/bin/env node
// F&B practical site builder.
//   node build.mjs <data.json> <out-dir>
// Writes <out-dir>/index.html, credits.html, site.css, site.js. Put photos, video and logo
// in <out-dir>/assets/ yourself; the data file points at them. No dependencies.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const [dataPath, outDir] = process.argv.slice(2);
if (!dataPath || !outDir) { console.error("usage: node build.mjs <data.json> <out-dir>"); process.exit(1); }
const d = JSON.parse(fs.readFileSync(dataPath, "utf8"));

// ---------------------------------------------------------------- helpers
const esc = (s) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const q = (s) => encodeURIComponent(s).replace(/%20/g, "+").replace(/%2C/g, ",");
const req = (cond, msg) => { if (!cond) { console.error("data error: " + msg); process.exit(1); } };
const toMin = (hhmm) => { const [h, m] = hhmm.split(":").map(Number); return h * 60 + m; };
// "06:00-19:00" -> [360, 1140]; "closed" / null -> null
const span = (v) => (!v || v === "closed") ? null : v.split("-").map(toMin);
const fmt = (m) => { let h = Math.floor(m / 60); const mm = m % 60, ap = h >= 12 ? "pm" : "am"; h = h % 12 || 12; return h + (mm ? ":" + String(mm).padStart(2, "0") : "") + ap; };
const spanText = (v) => { const s = span(v); return s ? `${fmt(s[0])} to ${fmt(s[1])}` : "Closed"; };
const DAYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];

// ---------------------------------------------------------------- checks
req(d.slug && /^[a-z0-9-]+$/.test(d.slug), "slug (lowercase, dashes)");
req(d.name, "name");
req(Array.isArray(d.locations) && d.locations.length, "at least one location");
for (const l of d.locations) {
  req(l.id && l.name && l.address, `location id/name/address (${l.name || "?"})`);
  req(l.week && DAYS.every((k) => k in l.week), `location ${l.id}: week needs sun..sat ("06:00-19:00" or "closed")`);
}
req(d.menu && Array.isArray(d.menu.sections), "menu.sections");

// ---------------------------------------------------------------- data for site.js
const hours = {}, holidays = {};
for (const l of d.locations) {
  hours[l.id] = DAYS.map((k) => span(l.week[k]));
  holidays[l.id] = {};
}
for (const row of d.holidays || []) for (const l of d.locations) {
  if (row.hours && l.id in row.hours) holidays[l.id][row.date] = span(row.hours[l.id]);
}
const opts = d.options || {};
const siteData = { slug: d.slug, tz: d.tz || "America/Los_Angeles", hours, holidays,
  options: { milkDrinks: opts.milkDrinks || [], pairs: opts.pairs || [], noSize: opts.noSize || [] } };

// ---------------------------------------------------------------- page parts
const c = d.colors || {};
const colorVars = Object.entries({ "--red": c.accent, "--red-ink": c.accentInk, "--paper": c.paper, "--ink": c.ink, "--ink-soft": c.inkSoft })
  .filter(([, v]) => v).map(([k, v]) => `${k}: ${v};`).join(" ");
const logoSm = d.logo ? `<img class="mark mark--sm" src="${esc(d.logo)}" width="36" height="36" alt="">` : "";
const favicon = d.logo ? `<link rel="icon" type="image/svg+xml" href="${esc(d.logo)}">` : "";
const multi = d.locations.length > 1;

const statusList = d.locations.map((l) =>
  `        <li data-status="${esc(l.id)}"><span class="dot"></span><b>${esc(l.name)}</b> <span class="status__t">${esc(l.hoursText.join(", "))}</span></li>`).join("\n");

const h = d.hero || {};
let heroMedia = "";
if (h.video) {
  const v = h.video;
  heroMedia = `    <figure class="hero__img hero__img--video">
      <video class="pour" src="${esc(v.src)}" data-src-mobile="${esc(v.srcMobile || v.src)}" poster="${esc(v.poster)}" data-poster-mobile="${esc(v.posterMobile || v.poster)}" data-final="${esc(v.final || v.poster)}" data-final-mobile="${esc(v.finalMobile || v.final || v.poster)}" muted loop playsinline autoplay preload="metadata" aria-label="${esc(v.alt)}"></video>
    </figure>`;
} else if (h.image) {
  const i = h.image;
  heroMedia = `    <figure class="hero__img">
      <img src="${esc(i.src)}" width="${i.w}" height="${i.h}" alt="${esc(i.alt)}" fetchpriority="high">
    </figure>`;
}

const item = (it) => {
  const o = typeof it === "string" ? { name: it } : it;
  return `          <li>${esc(o.name)}${o.note ? ` <span class="m">${esc(o.note)}</span>` : ""}</li>`;
};
const menuCols = d.menu.sections.map((s, i) => {
  const extra = (i === d.menu.sections.length - 1 && d.menu.extra) ? `
        <h3 class="menu__beans">${esc(d.menu.extra.title)}</h3>
        <p>${esc(d.menu.extra.text)}</p>${d.menu.extra.link ? `
        <a class="link" href="${esc(d.menu.extra.link.href)}" rel="noopener">${esc(d.menu.extra.link.label)}</a>` : ""}` : "";
  return `      <div class="menu__col">
        <h3>${esc(s.title)}</h3>
        <ul>
${s.items.map(item).join("\n")}
        </ul>${extra}
      </div>`;
}).join("\n");

const tel = (p) => `<a class="link" href="tel:${esc(p.phone)}">${esc(p.phoneLabel || p.phone)}</a>`;
const places = d.locations.map((l) => `      <article class="place">
        <iframe class="place__map" title="Map: ${esc(l.name)}, ${esc(l.address)}" loading="lazy" referrerpolicy="no-referrer-when-downgrade"
          src="https://www.google.com/maps?q=${q(l.mapQuery || d.name + ", " + l.address)}&amp;z=15&amp;output=embed"></iframe>
        <div class="place__body">
          <h3>${esc(l.name)}${l.area ? ` <span class="place__area">${esc(l.area)}</span>` : ""}</h3>
          <p class="place__open" data-status="${esc(l.id)}"><span class="dot"></span><span class="status__t">${esc(l.hoursText[0])}</span></p>
          <dl>
            <dt>Hours</dt><dd>${l.hoursText.map(esc).join("<br>")}</dd>
            <dt>Address</dt><dd>${esc(l.address)}</dd>${l.phone ? `
            <dt>Phone</dt><dd>${tel(l)}</dd>` : ""}
          </dl>
          <a class="btn" href="https://www.google.com/maps/dir/?api=1&amp;destination=${q(l.mapQuery || d.name + " " + l.address)}" rel="noopener">Directions</a>
        </div>
      </article>`).join("\n");

const outside = d.outsidePhoto ? `    <figure class="outside">
      <img src="${esc(d.outsidePhoto.src)}" width="${d.outsidePhoto.w}" height="${d.outsidePhoto.h}" loading="lazy" alt="${esc(d.outsidePhoto.alt)}">${d.outsidePhoto.caption ? `
      <figcaption>${esc(d.outsidePhoto.caption)}</figcaption>` : ""}
    </figure>
` : "";

const holidayTable = (d.holidays && d.holidays.length) ? `    <details class="holiday">
      <summary>Holiday hours</summary>
      <table>
        <thead><tr><th scope="col">Day</th>${d.locations.map((l) => `<th scope="col">${esc(l.name)}</th>`).join("")}</tr></thead>
        <tbody>
${d.holidays.map((r) => `          <tr><th scope="row">${esc(r.label)}</th>${d.locations.map((l) => `<td>${esc(r.hours && l.id in r.hours ? spanText(r.hours[l.id]) : "Regular hours")}</td>`).join("")}</tr>`).join("\n")}
        </tbody>
      </table>
    </details>
` : "";

const phonesLine = d.locations.filter((l) => l.phone).map((l) => `${multi ? esc(l.name) + " " : ""}${tel(l)}`).join("<br>");
const orderCards = (d.order?.cards || []).filter((card) => card.type !== "phones" || phonesLine).map((card) => {
  if (card.type === "phones") return `      <div class="order__card">
        <h3>${esc(card.title || "Call ahead")}</h3>
        <p>${phonesLine}</p>
      </div>`;
  return `      <div class="order__card">
        <h3>${esc(card.title)}</h3>
        <p>${esc(card.text)}</p>${card.button ? `
        <a class="btn${card.button.primary ? " btn--primary" : ""}" href="${esc(card.button.href)}" rel="noopener">${esc(card.button.label)}</a>` : ""}
      </div>`;
}).join("\n");

const chips = (name, values, checked) => values.map((v) =>
  `        <label><input type="radio" name="${name}" value="${esc(v)}"${v === checked ? " checked" : ""}><span>${esc(v)}</span></label>`).join("\n");
const sizes = opts.sizes || ["Small", "Medium", "Large"];
const milks = opts.milks || ["Whole", "Nonfat"];
const routes = (d.checkout?.routes || []).map((r) => `          <li>${esc(r.text)}: <a class="link" href="${esc(r.href)}" rel="noopener">${esc(r.label)}</a></li>`)
  .concat(d.locations.filter((l) => l.phone).map((l) => `          <li>Call ${esc(l.name)}: ${tel(l)}</li>`)).join("\n");

const credits = d.credits || [];
const creditLine = d.footer?.credits || (credits.length ? `${h.video ? "Photo and video" : "Photo"} credits: <a class="link" href="credits.html">credits</a>.` : "");

// ---------------------------------------------------------------- index.html
const html = `<!doctype html>
<html lang="${esc(d.lang || "en")}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(d.title || d.name)}</title>
<meta name="description" content="${esc(d.description || "")}">
${d.demo !== false ? '<meta name="robots" content="noindex">\n' : ""}${favicon}
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Archivo:wght@400;500;600&family=Newsreader:ital,opsz,wght@0,6..72,400;0,6..72,500;1,6..72,400&display=swap" rel="stylesheet">
<link rel="stylesheet" href="site.css?v=${esc(d.version || "1")}">
${colorVars ? `<style>:root { ${colorVars} }</style>\n` : ""}<script>document.documentElement.classList.add("js")</script>
</head>
<body>

<a class="skip" href="#menu">Skip to menu</a>

<header class="bar">
  <a class="bar__mark" href="#top">${logoSm}<span>${esc(d.name)}</span></a>
  <nav class="bar__nav" aria-label="Sections">
    <a href="#menu">Menu</a>
    <a href="#visit">${multi ? "Locations" : "Visit"}</a>
    <a class="bar__cta" href="#menu">Order</a>
  </nav>
</header>

<main id="top">

  <section class="hero">
    <div class="hero__text">
      <h1>${esc(h.title || d.name)}${h.titleEm ? `<br><em>${esc(h.titleEm)}</em>` : ""}</h1>
      <p class="hero__sub">${esc(h.sub || "")}</p>
      <ul class="status" aria-live="polite">
${statusList}
      </ul>
      <div class="hero__actions">
        <a class="btn" href="#menu">See the menu</a>
      </div>
    </div>
${heroMedia}
  </section>

  <section class="block" id="menu" aria-labelledby="menu-h">
    <div class="block__head">
      <div class="menu__title">
        <h2 id="menu-h">Menu</h2>
        <button class="cart-btn" type="button" aria-haspopup="dialog" aria-controls="cart" aria-label="Cart, 0 items">
          <svg width="26" height="26" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 7h12l-1.2 12.1a1.6 1.6 0 0 1-1.6 1.4H8.8a1.6 1.6 0 0 1-1.6-1.4L6 7Z" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/><path d="M9 9.5V6.8a3 3 0 0 1 6 0v2.7" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>
          <span class="cart-btn__n" aria-hidden="true">0</span>
        </button>
      </div>
      <p class="note">${esc(d.menu.note || "Tap a drink to add it.")}</p>
    </div>
    <div class="menu" tabindex="-1">
${menuCols}
    </div>
  </section>

  <section class="block" id="visit" aria-labelledby="visit-h">
    <div class="block__head">
      <h2 id="visit-h">${multi ? "Locations" : "Visit"}</h2>${d.locationsNote ? `
      <p class="note">${esc(d.locationsNote)}</p>` : ""}
    </div>
${outside}    <div class="places">
${places}
    </div>
${holidayTable}  </section>

  <section class="block order" id="order" aria-labelledby="order-h">
    <div class="block__head">
      <h2 id="order-h">Order</h2>
    </div>
    <div class="order__grid">
${orderCards}
    </div>
  </section>

</main>

<dialog class="sheet" id="add" aria-labelledby="add-h">
  <form class="sheet__in" method="dialog" id="add-form">
    <header class="sheet__head">
      <h2 id="add-h">Drink</h2>
      <button class="x" type="button" data-close aria-label="Close">&times;</button>
    </header>
    <fieldset class="opt">
      <legend>Quantity</legend>
      <div class="qty">
        <button type="button" class="qty__b" data-step="-1" aria-label="One less">&minus;</button>
        <output id="add-qty" aria-live="polite">1</output>
        <button type="button" class="qty__b" data-step="1" aria-label="One more">+</button>
      </div>
    </fieldset>
    <fieldset class="opt" data-opt="size">
      <legend>Size</legend>
      <div class="chips">
${chips("size", sizes, sizes[Math.floor(sizes.length / 2)])}
      </div>
    </fieldset>
    <fieldset class="opt" data-opt="temp">
      <legend>Hot or iced</legend>
      <div class="chips">
${chips("temp", ["Hot", "Iced"], "Hot")}
      </div>
    </fieldset>
    <fieldset class="opt" data-opt="milk">
      <legend>Milk</legend>
      <div class="chips">
${chips("milk", milks, milks[0])}
      </div>
    </fieldset>
    <label class="opt notes">
      <span class="legend">Notes <span class="m">optional</span></span>
      <input type="text" name="notes" maxlength="80" placeholder="Extra hot, half sweet..." autocomplete="off">
    </label>
    <button class="btn btn--primary btn--block" type="submit">Add to cart</button>
  </form>
</dialog>

<dialog class="sheet" id="cart" aria-labelledby="cart-h">
  <div class="sheet__in">
    <header class="sheet__head">
      <h2 id="cart-h">Your order</h2>
      <button class="x" type="button" data-close aria-label="Close">&times;</button>
    </header>
    <p class="cart__empty">Nothing here yet. Tap a drink on the menu to add it.</p>
    <ul class="cart__list"></ul>
    <div class="cart__foot">
      <button class="btn btn--primary btn--block" type="button" id="checkout">${esc(d.checkout?.button || "Order ahead (demo)")}</button>
      <div class="cart__demo" id="demo-note" hidden>
        <p>${d.checkout?.note || "<strong>Online ordering isn't connected yet.</strong> This is a concept demo. " + (routes ? "To order now:" : "Order at the counter.")}</p>${routes ? `
        <ul>
${routes}
        </ul>` : ""}
      </div>
    </div>
  </div>
</dialog>

<footer class="foot">
${d.logo ? `  <img class="mark mark--lg" src="${esc(d.logo)}" width="160" height="160" alt="${esc(d.name)} logo">\n` : ""}${d.footer?.line ? `  <p class="foot__line">${esc(d.footer.line)}</p>\n` : ""}  <p class="foot__small">${d.demo !== false ? `<strong>Concept demo by TruongSon.</strong> Not made by or affiliated with ${esc(d.name)}. ` : ""}${d.footer?.sources ? esc(d.footer.sources) + " " : ""}${creditLine}</p>
</footer>

<script type="application/json" id="site-data">${JSON.stringify(siteData).replace(/</g, "\\u003c")}</script>
<script src="site.js?v=${esc(d.version || "1")}"></script>
</body>
</html>
`;

// ---------------------------------------------------------------- credits.html
const creditsHtml = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">${d.demo !== false ? '<meta name="robots" content="noindex">' : ""}
<title>Credits · ${esc(d.name)}</title>
<style>:root{--paper:${c.paper || "#F1EFEA"};--ink:${c.ink || "#171514"};--soft:${c.inkSoft || "#5B554D"};--red:${c.accent || "#B11F24"}}body{margin:0;background:var(--paper);color:var(--ink);font:16px/1.6 system-ui,sans-serif;padding:clamp(1.5rem,6vw,5rem) clamp(1rem,5vw,4rem)}main{max-width:62ch}h1{font:400 2.4rem/1.05 Georgia,serif;letter-spacing:-.02em;margin:0 0 1rem}li{margin:.75rem 0}.where{display:block;font-size:.8rem;letter-spacing:.08em;text-transform:uppercase;color:var(--soft)}a{color:var(--red);text-underline-offset:.2em}a:focus-visible{outline:2px solid var(--red);outline-offset:3px}p{color:var(--soft)}</style></head>
<body><main><h1>Credits</h1><p>${d.demo !== false ? `Concept demo by TruongSon. Not made by or affiliated with ${esc(d.name)}. ` : ""}Used under the licenses listed.</p><ul>${credits.map((cr) =>
  `<li><span class="where">${esc(cr.where)}</span> <a href="${esc(cr.href)}">${esc(cr.title)}</a>${cr.author ? ` by ${esc(cr.author)}` : ""}, ${cr.licenseHref ? `<a href="${esc(cr.licenseHref)}">${esc(cr.license)}</a>` : esc(cr.license)}.${cr.changes ? " " + esc(cr.changes) : ""}</li>`).join("")}</ul><p><a href="./">Back to the page</a></p></main></body></html>
`;

fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, "index.html"), html);
if (credits.length) fs.writeFileSync(path.join(outDir, "credits.html"), creditsHtml);
for (const f of ["site.css", "site.js"]) fs.copyFileSync(path.join(HERE, "template", f), path.join(outDir, f));
const missing = [d.logo, h.video?.src, h.video?.srcMobile, h.video?.poster, h.image?.src, d.outsidePhoto?.src]
  .filter(Boolean).filter((p) => !fs.existsSync(path.join(outDir, p)));
console.log(`built ${path.join(outDir, "index.html")}  (${d.locations.length} location(s), ${d.menu.sections.reduce((n, s) => n + s.items.length, 0)} drinks)`);
if (missing.length) console.log("missing assets (add them to the out dir): " + missing.join(", "));
