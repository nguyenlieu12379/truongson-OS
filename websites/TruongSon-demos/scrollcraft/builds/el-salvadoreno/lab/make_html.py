"""Writes index.html: the skill's head.html (theme + motion toggle) inlined, then the page.
Bump V on every change to site.css or site.js. Run from the build folder: python -X utf8 lab/make_html.py"""
import pathlib

V = 5
HERE = pathlib.Path(__file__).resolve().parent.parent
HEAD = (HERE.parents[4] / ".claude/skills/site-building/assets/head.html").read_text(encoding="utf8")
HEAD = HEAD.replace('key: "site-theme",            ', 'key: "el-salvadoreno-theme",  ') \
           .replace('colors: { light: "#F1EFEA", dark: "#161311" }', 'colors: { light: "#F7F6F2", dark: "#111318" }')
assert "el-salvadoreno-theme" in HEAD and "#111318" in HEAD

WA = "https://wa.me/17866061159"
MSG = "?text=" + "Hola!%20I%27d%20like%20to%20order%20from%20El%20Salvadore%C3%B1o."

FILL = [  # name, price, key (SkyTab menu, 2026-11-27)
    ("Frijol", 5.00, "frijol"), ("Queso", 5.25, "queso"), ("Revuelta", 5.25, "revuelta"),
    ("Chicharrón", 5.25, "chicharron"), ("Mixta", 5.25, "mixta"), ("Arroz", 5.50, "arroz"),
    ("Loroco y queso", 5.75, "loroco"), ("Pollo y queso", 5.75, "pollo"), ("Zucchini", 5.75, "zucchini"),
    ("Espinaca", 5.75, "espinaca"), ("Jalapeño y queso", 5.75, "jalapeno"),
]
PLATES = [
    ("desayuno-tipico", "Desayuno Típico", "Eggs, plantains, beans, cream, cheese", "12.99"),
    ("pupusa-ranchera", "Pupusa Ranchera", "Topped with ranchera sauce and cheese", "12.50"),
    ("tipico-guanaco", "Típico Guanaco", "12 oz New York steak, egg, avocado", "29.99"),
    ("parrillada-salvadorena", "Parrillada Salvadoreña", "Carne asada, pollo, chorizo, yuca, pupusa", "55.99"),
]

def money(v): return f"${v:.2f}"

fill_li = "\n".join(f'        <li><span>{n}</span><b>{money(p)}</b></li>' for n, p, k in FILL)
rows = "\n".join(
    f'''        <li class="row" data-k="{k}" data-n="{n}" data-p="{p:.2f}">
          <span class="rn">{n}</span><span class="rp">{money(p)}</span>
          <button type="button" class="q minus" aria-label="One less {n}">&minus;</button>
          <output class="qn" aria-live="polite">0</output>
          <button type="button" class="q plus" aria-label="One more {n}">+</button>
        </li>''' for n, p, k in FILL)
plates = "\n".join(
    f'''      <figure class="plate pl-{i}">
        <img src="assets/{f}.webp" alt="{n}" width="800" height="800" decoding="async">
        <figcaption><b>{n}</b><span>{d}</span><em>${p}</em></figcaption>
      </figure>''' for i, (f, n, d, p) in enumerate(PLATES))
copies = "".join('<img src="assets/pupusa-sm.webp" alt="" width="160" height="160" decoding="async">' for _ in range(25))

CTA = f'<a class="cta" href="{WA}{MSG}" target="_blank" rel="noopener">Order on WhatsApp</a>'

html = f'''<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="robots" content="noindex, nofollow">
<meta name="theme-color" content="#F7F6F2">
<title>El Salvadoreño Restaurant &amp; Grill · Pupusas in Kendall, Miami</title>
<meta name="description" content="Pupusas and Salvadoran plates, made fresh in Kendall. Open 8am every day. Order on WhatsApp.">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=Manrope:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<link rel="preload" as="image" href="assets/pupusa.webp">
{HEAD.strip()}
<link rel="stylesheet" href="liquid-glass.css?v={V}">
<link rel="stylesheet" href="site.css?v={V}">
</head>
<body>
<a class="skip" href="#builder">Skip to the order builder</a>
<header class="bar">
  <a class="mark" href="#top" aria-label="El Salvadoreño Restaurant and Grill, back to top"><b>El Salvadoreño</b><small>Restaurant &amp; Grill</small></a>
  <div class="bar-end">
    {CTA.replace('class="cta"', 'class="cta cta-bar"')}
    <button class="lg-motion-btn" type="button" aria-pressed="true" aria-label="Motion">
      <svg class="lg-i-move" viewBox="0 0 24 24" aria-hidden="true"><path d="M3 9c2.2-3 4.3-3 6.5 0s4.3 3 6.5 0 3.3-2.2 5-1.2M3 15c2.2-3 4.3-3 6.5 0s4.3 3 6.5 0 3.3-2.2 5-1.2" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>
      <svg class="lg-i-still" viewBox="0 0 24 24" aria-hidden="true"><path d="M3 9h18M3 15h18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>
    </button>
    <button class="lg-theme-btn" type="button" aria-pressed="false" aria-label="Dark mode">
      <svg class="lg-i-moon" viewBox="0 0 24 24" aria-hidden="true"><path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>
      <svg class="lg-i-sun" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M12 2.5v2.2M12 19.3v2.2M2.5 12h2.2M19.3 12h2.2M5.3 5.3l1.6 1.6M17.1 17.1l1.6 1.6M5.3 18.7l1.6-1.6M17.1 6.9l1.6-1.6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>
    </button>
  </div>
</header>

<main id="top">
  <div class="stage" id="stage">
    <p class="bgword" id="bgword" aria-hidden="true">Salvadoreño</p>

    <section class="hero" id="hero" aria-labelledby="h1">
      <h1 id="h1">Pupusas and Salvadoran plates, made fresh in Kendall.</h1>
      <p class="lead">Hot off the griddle, big plates, open 8am every day.</p>
      <p class="proof"><b>4.6</b> on Uber Eats from 1,500+ ratings</p>
      {CTA.replace('class="cta"', 'class="cta cta-hero"')}
    </section>

    <div class="pup" id="pup"><i class="shadow" aria-hidden="true"></i><img src="assets/pupusa.webp" alt="A pupusa de queso, fresh off the griddle" width="496" height="498" fetchpriority="high"></div>

    <section class="fill" id="fill" aria-labelledby="fillH">
      <h2 id="fillH">Eleven fillings.<br><em>From $5.00.</em></h2>
      <ul>
{fill_li}
      </ul>
    </section>

    <section class="party" id="party" aria-labelledby="partyH">
      <div class="tray" id="tray"><img src="assets/pupusas-25.webp" alt="A tray of 25 pupusas mixtas" width="800" height="800" decoding="async"></div>
      <div class="grid" id="grid" aria-hidden="true">{copies}</div>
      <p class="count" id="count" aria-hidden="true"><span id="countN">1</span><small>pupusa</small></p>
      <div class="party-copy" id="partyCopy">
        <h2 id="partyH">Feeding the whole family?</h2>
        <p><b>25 pupusas $99.99.</b> <b>50 for $172.99.</b> Ready in about 30 to 40 minutes.</p>
      </div>
    </section>

    <section class="spread" id="spread" aria-labelledby="spreadH">
      <h2 id="spreadH">Breakfast at 8.<br><em>The grill till close.</em></h2>
{plates}
    </section>

    <section class="builder" id="builder" aria-labelledby="buildH">
      <div class="card">
        <h2 id="buildH">Build your order</h2>
        <p class="hint">Tap + on the pupusas you want. We send it to WhatsApp, you confirm with them.</p>
        <ul class="rows">
{rows}
        </ul>
        <div class="sum">
          <p class="total"><span id="tCount">0 pupusas</span><b id="tPrice">$0.00</b></p>
          <p class="tip" id="tip" hidden>That many? The <b>25 for $99.99</b> party tray is cheaper. Say so in your message.</p>
          <a class="cta cta-send" id="send" href="{WA}{MSG}" target="_blank" rel="noopener">Order on WhatsApp</a>
          <p class="fine">Prices from their online menu. The restaurant confirms the total.</p>
        </div>
      </div>
    </section>

    <section class="close" id="close" aria-labelledby="closeH">
      <div class="card">
        <p class="open" id="openNow">Open today 8am to 9pm</p>
        <h2 id="closeH">Come hungry.</h2>
        <blockquote>&ldquo;Everything was beyond delicious.&rdquo; <cite>Yelp review</cite></blockquote>
        <dl>
          <div><dt>Where</dt><dd>10855 SW 72nd St, Suite 28<br>Kendall, Miami, FL 33173 · <a href="https://www.google.com/maps/search/?api=1&amp;query=10855+SW+72nd+St+Suite+28+Miami+FL+33173" target="_blank" rel="noopener">Directions</a></dd></div>
          <div><dt>Hours</dt><dd>Sun to Thu 8am to 9pm<br>Fri and Sat 8am to 10pm</dd></div>
          <div><dt>Call</dt><dd><a href="tel:+13052713101">(305) 271-3101</a></dd></div>
          <div><dt>Nights</dt><dd>Karaoke Fri and Sat, 7 to 10pm</dd></div>
        </dl>
        {CTA}
      </div>
    </section>
  </div>
  <div class="spacer" id="spacer" aria-hidden="true"></div>
</main>
<p class="demo">Demo site. Photos and prices from El Salvadoreño's own online menu.</p>
<script src="liquid-glass.js?v={V}" defer></script>
<script src="site.js?v={V}" defer></script>
</body>
</html>
'''
(HERE / "index.html").write_text(html, encoding="utf8", newline="\n")
print("index.html", len(html))
