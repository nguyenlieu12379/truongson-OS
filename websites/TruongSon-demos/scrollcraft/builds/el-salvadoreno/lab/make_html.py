"""v2 (the flag). Writes index.html with the skill's head.html (theme sweep) inlined.
Bump V on every change to site.css or site.js. Run from the build folder: python -X utf8 lab/make_html.py"""
import pathlib

V = 13
HERE = pathlib.Path(__file__).resolve().parent.parent
HEAD = (HERE.parents[4] / ".claude/skills/site-building/assets/head.html").read_text(encoding="utf8")
HEAD = HEAD.replace('key: "site-theme",            ', 'key: "el-salvadoreno-theme",  ') \
           .replace('colors: { light: "#F1EFEA", dark: "#161311" }', 'colors: { light: "#F7F6F2", dark: "#0F1218" }')
assert "el-salvadoreno-theme" in HEAD and "#0F1218" in HEAD

WA = "https://wa.me/17866061159?text=" + "Hola%21%20I%27d%20like%20to%20order%20from%20El%20Salvadore%C3%B1o."
WAICON = ('<svg class="wa" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3.2a8.7 8.7 0 0 0-7.5 13.2L3.3 20.8l4.5-1.2A8.7 8.7 0 1 0 12 3.2Z" '
          'fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/><circle class="d d1" cx="8.4" cy="12" r="1.15"/>'
          '<circle class="d d2" cx="12" cy="12" r="1.15"/><circle class="d d3" cx="15.6" cy="12" r="1.15"/></svg>')

FILL = [("Frijol", "5.00"), ("Queso", "5.25"), ("Revuelta", "5.25"), ("Chicharrón", "5.25"), ("Mixta", "5.25"),
        ("Arroz", "5.50"), ("Loroco y queso", "5.75"), ("Pollo y queso", "5.75"), ("Zucchini", "5.75"),
        ("Espinaca", "5.75"), ("Jalapeño y queso", "5.75"), ("Carnavalera", "6.50")]
# the kitchen that rides the white band (SkyTab prices, 2026-11-27). The pupusa itself leads it.
KITCHEN = [
    ("pupusa-ranchera", "Pupusa Ranchera", "with ranchera sauce and cheese", "12.50"),
    ("chicharrones", "Chicharrones Salvadoreños", "with yuca, curtido and lime", "15.99"),
    ("jamaica", "Jamaica", "house hibiscus drink", "6.50"),
    ("chuleta-cerdo", "Chuleta Encebollada", "pork chop, onions, maduros, rice", "20.99"),
    ("camarones-jalapeno", "Camarones en Salsa Blanca", "shrimp in jalapeño cream", "26.99"),
    ("pargo-chicharron", "Pargo en Chicharrones", "crispy snapper bites", "42.99"),
]

def cta(cls, label='Order<span class="opt"> on WhatsApp</span>'):
    return f'<a class="cta {cls}" href="{WA}" target="_blank" rel="noopener">{WAICON}<span class="lbl">{label}</span></a>'

word = "".join(f'<span class="ch">{c if c != " " else "&nbsp;"}</span>' for c in "EL SALVADOREÑO")
fill_li = "\n".join(f'        <li><span>{n}</span><b>${p}</b></li>' for n, p in FILL)
dishes = "\n".join(
    f'''      <figure class="dish" data-k="{k}"><img src="assets/c-{k}.webp" alt="{n}" decoding="async">
        <figcaption><b>{n}</b><span>{d}</span><em>${p}</em></figcaption></figure>''' for k, n, d, p in KITCHEN)
CATS = "PUPUSAS · DESAYUNOS · CARNES ASADAS · MARISCOS · PARRILLADAS · ANTOJITOS · SOPAS · POSTRES · "
LINE = "OPEN 8AM EVERY DAY · 10855 SW 72ND ST, KENDALL · ORDER ON WHATSAPP (786) 606-1159 · "

html = f'''<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="robots" content="noindex, nofollow">
<meta name="theme-color" content="#F7F6F2">
<title>El Salvadoreño Restaurant &amp; Grill · Salvadoran food in Kendall, Miami</title>
<meta name="description" content="Pupusas, Salvadoran breakfast, carnes and mariscos on SW 72nd St, Kendall. Open 8am every day. Order on WhatsApp.">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@600;700;800&family=DM+Serif+Display:ital@0;1&family=Manrope:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<link rel="preload" as="image" href="assets/pupusa.webp">
{HEAD.strip()}
<link rel="stylesheet" href="liquid-glass.css?v={V}">
<link rel="stylesheet" href="site.css?v={V}">
</head>
<body>
<header class="bar" id="bar">
  <a class="mark" href="#top" aria-label="El Salvadoreño Restaurant and Grill"><b>El Salvadoreño</b><small>Restaurant &amp; Grill</small></a>
  <div class="bar-end">
    {cta("")}
    <button class="lg-theme-btn" type="button" aria-pressed="false" aria-label="Dark mode">
      <svg class="lg-i-moon" viewBox="0 0 24 24" aria-hidden="true"><path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>
      <svg class="lg-i-sun" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M12 2.5v2.2M12 19.3v2.2M2.5 12h2.2M19.3 12h2.2M5.3 5.3l1.6 1.6M17.1 17.1l1.6 1.6M5.3 18.7l1.6-1.6M17.1 6.9l1.6-1.6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>
    </button>
  </div>
</header>

<main id="top">
  <div class="stage" id="stage">
    <div class="band b-top" id="bTop">
      <h1 class="word" id="word" aria-label="El Salvadoreño">{word}</h1>
      <p class="run" id="runTop" aria-hidden="true"><span>{CATS * 3}</span></p>
      <p class="btxt" id="trayTop">Party trays</p>
    </div>
    <div class="band b-mid" id="bMid">
      <div class="tray" id="tray"><img src="assets/pupusas-25.webp" alt="A tray of 25 pupusas" decoding="async"></div>
      <p class="side s-l" id="sideL">Sabor único<br>e inigualable</p>
      <p class="side s-r" id="sideR"><b>4.6</b> on Uber Eats<br>1,500+ ratings</p>
    </div>
    <div class="band b-bot" id="bBot">
      <div class="hero-line" id="heroLine">
        <p class="eyebrow">Restaurant &amp; Grill · Kendall, Miami</p>
        <p class="tag">Pupusas, Salvadoran breakfast and the grill. Open 8am every day.</p>
      </div>
      <p class="run" id="runBot" aria-hidden="true"><span>{LINE * 3}</span></p>
      <p class="btxt" id="trayBot"><b>25 pupusas $99.99</b> · <b>50 pupusas $172.99</b> · ready in about 30 minutes</p>
    </div>

    <section class="fill" id="fill" aria-labelledby="fillH">
      <h2 id="fillH">Twelve pupusas,<br><em>made on the comal.</em></h2>
      <p class="sub">Every pupusa is patted by hand and griddled to order. Served with curtido and salsa.</p>
      <ul>
{fill_li}
      </ul>
    </section>

    <section class="kitchen" id="kitchen" aria-label="From the kitchen">
{dishes}
    </section>

    <figure class="pup" id="pup"><img src="assets/pupusa.webp" alt="Pupusa de queso, $5.25" width="496" height="498" fetchpriority="high">
      <figcaption id="pupCap"><b>Pupusa de Queso</b><span>the one everyone orders</span><em>$5.25</em></figcaption></figure>
    <img class="drift" id="drift" src="assets/c-jamaica.webp" alt="" aria-hidden="true">

    <section class="card" id="card" aria-labelledby="cardH">
      <p class="open" id="openNow">Open today 8am to 9pm</p>
      <h2 id="cardH">Come hungry.</h2>
      <blockquote>&ldquo;Everything was beyond delicious. The outside doesn&rsquo;t look like much but inside is nice and roomy.&rdquo;<cite>Yelp review</cite></blockquote>
      <dl>
        <div><dt>Where</dt><dd>10855 SW 72nd St, Suite 28, Miami, FL 33173 · <a href="https://www.google.com/maps/search/?api=1&amp;query=10855+SW+72nd+St+Suite+28+Miami+FL+33173" target="_blank" rel="noopener">Directions</a></dd></div>
        <div><dt>Hours</dt><dd>Sun to Thu 8am to 9pm · Fri and Sat 8am to 10pm</dd></div>
        <div><dt>Nights</dt><dd>Karaoke Friday and Saturday, 7 to 10pm</dd></div>
        <div><dt>Call</dt><dd><a href="tel:+13052713101">(305) 271-3101</a></dd></div>
      </dl>
      {cta("big", "Order on WhatsApp")}
    </section>
  </div>
  <div class="spacer" id="spacer" aria-hidden="true"></div>
</main>
<p class="demo">Demo site. Photos and prices from El Salvadoreño&rsquo;s own online menu.</p>
<script src="liquid-glass.js?v={V}" defer></script>
<script src="site.js?v={V}" defer></script>
</body>
</html>
'''
(HERE / "index.html").write_text(html, encoding="utf8", newline="\n")
print("index.html", len(html))
