# Writes index.html. Bump V on every change to site.css or site.js.
# Run from the build folder: python lab/make_html.py
import json
V = 3
WA = "https://wa.me/15613459964?text=Ol%C3%A1%21%20I%27d%20like%20to%20order%20from%20Esta%C3%A7%C3%A3o%20do%20P%C3%A3o."
ICON = ('<svg class="wa" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3.2a8.7 8.7 0 0 0-7.5 13.2L3.3 20.8l4.5-1.2A8.7 8.7 0 1 0 12 3.2Z" '
        'fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/><circle class="d d1" cx="8.4" cy="12" r="1.15"/>'
        '<circle class="d d2" cx="12" cy="12" r="1.15"/><circle class="d d3" cx="15.6" cy="12" r="1.15"/></svg>')
head = open("lab/head.html", encoding="utf-8").read()
S = json.load(open("lab/sizes.json"))

word = "".join(f'<span class="ch">{c}</span>' for c in "Estação")

BAKERY = [("Pão de queijo", "Brazilian cheese bread", "$1.61"),
          ("Coxinha", "chicken croquette with cream cheese", "$5.99"),
          ("Empada de frango", "chicken pie", "$5.49"),
          ("Empada de palmito", "heart of palm pie", "$5.49"),
          ("Kibe", "fried ground beef and bulgur", "$5.49"),
          ("Risoles de carne", "beef croquette", "$5.49"),
          ("Pão francês", "Brazilian rolls, 3 for", "$1.35"),
          ("Pão doce", "sweet bread", "$2.60")]
SWEETS = [("Flan", "pudim, in caramel", "$5.99"),
          ("Bolo no pote", "cake in a jar", "$10.50"),
          ("Cake by the slice", "corn, yuca or chocolate", "$6.25"),
          ("Mousse de maracujá", "passion fruit mousse", "$7.99"),
          ("Carrot cake", "the square box", "$12.99"),
          ("Brigadeiro", "chocolate truffle, each", "$2.99")]
rows = lambda L: "\n".join(f'        <li><span class="n"><b>{n}</b><small>{d}</small></span><span class="p">{p}</span></li>' for n, d, p in L)

# tags pinned to the studio spread: key, x, y (fractions of the photo), name, price
TAGS = [("pdq", 0.135, 0.20, "Pão de queijo", "$1.61"), ("fish", 0.50, 0.27, "Isca de peixe", "$18.99"),
        ("emp", 0.835, 0.34, "Empada de frango", "$5.49"), ("shrimp", 0.585, 0.80, "Camarão empanado", "$19.99")]
tag_html = "\n".join(f'    <p class="tag" data-x="{x}" data-y="{y}"><i></i><b>{n}</b><span>{p}</span></p>' for _, x, y, n, p in TAGS)

PANS = ["White rice", "Chicken with okra", "Pumpkin, baked whole", "Shrimp with peppers", "Eggs, sausage, tomato",
        "Fried fish fillets", "Roast pumpkin", "Greens with olives and egg", "Watercress over potatoes",
        "Fish with spinach and tomato", "Boiled cassava and potatoes", "Salad with eggs"]
pan_html = "\n".join(
    f'    <div class="pan" data-i="{i}"><div class="face fr"><img src="assets/pan{i+1}.webp" alt="{a}, on their buffet" decoding="async"></div>'
    f'<div class="face bk"><img src="assets/line.webp" alt="" decoding="async"></div></div>' for i, a in enumerate(PANS))

DAYS = [("Mon", "6am to 9pm"), ("Tue", "6am to 9pm"), ("Wed", "6am to 9pm"), ("Thu", "6am to 9pm"),
        ("Fri", "6am to 10pm"), ("Sat", "6am to 10pm"), ("Sun", "7am to 9pm")]
day_html = "\n".join(f'    <div class="day" data-d="{i}"><b>{d}</b><span>{h}</span><img src="assets/spread.webp" alt="" decoding="async"></div>' for i, (d, h) in enumerate(DAYS))

html = f'''<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="robots" content="noindex, nofollow">
<meta name="theme-color" content="#F5F5F1">
<title>Estação do Pão · Brazilian bakery, buffet and café in Boca Raton</title>
<meta name="description" content="Brazilian bakery and restaurant at 23269 State Road 7, Boca Raton. Pão de queijo from 6am, a buffet by the pound every day, cakes and café colonial. Order on WhatsApp.">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Gloock&family=Albert+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<link rel="preload" as="image" href="assets/pdq1.webp">
<link rel="preload" as="image" href="assets/pdq2.webp">
<link rel="preload" as="image" href="assets/pdq3.webp">
{head}
<link rel="stylesheet" href="liquid-glass.css?v={V}">
<link rel="stylesheet" href="site.css?v={V}">
</head>
<body>
<header class="bar" id="bar">
  <a class="mark" href="#top" aria-label="Estação do Pão"><img class="av" src="assets/avatar.webp" alt="" width="160" height="160"><b>Estação</b><i>do Pão</i></a>
  <div class="bar-end">
    <a class="cta" id="cta" href="{WA}" target="_blank" rel="noopener">{ICON}<span class="lbl">Order<span class="opt"> on WhatsApp</span></span></a>
    <button class="lg-theme-btn" type="button" aria-pressed="false" aria-label="Dark mode">
      <svg class="lg-i-moon" viewBox="0 0 24 24" aria-hidden="true"><path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>
      <svg class="lg-i-sun" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M12 2.5v2.2M12 19.3v2.2M2.5 12h2.2M19.3 12h2.2M5.3 5.3l1.6 1.6M17.1 17.1l1.6 1.6M5.3 18.7l1.6-1.6M17.1 6.9l1.6-1.6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>
    </button>
  </div>
</header>

<main id="top">
  <div class="stage" id="stage">
    <h1 class="sr">Estação do Pão, Brazilian bakery, buffet and café in Boca Raton, FL</h1>
    <p class="word" id="word" aria-hidden="true">{word}<i class="bl"></i></p>
    <p class="word2" id="word2" aria-hidden="true">do Pão</p>

    <div class="hero-l" id="heroL">
      <p class="lead">Brazilian bakery, buffet and café in <em>Boca Raton.</em></p>
      <p class="sub">Pão de queijo from 6am, a buffet by the pound every day, cakes to take home.</p>
    </div>
    <dl class="hero-r" id="heroR">
      <div><dt>Today</dt><dd class="open-now">Open daily from 6am</dd></div>
      <div><dt>Call</dt><dd><a href="tel:+15616171574">(561) 617-1574</a></dd></div>
      <div><dt>Rated</dt><dd>4.4 on Google, 662 reviews</dd></div>
    </dl>

    <img class="emp" id="emp" src="assets/empadas.webp" alt="Three chicken pies in paper cups on a white plate" decoding="async">
    <span class="trio-sh" id="trioSh" aria-hidden="true"></span>
    <img class="ball" id="b1" src="assets/pdq1.webp" alt="Pão de queijo, Brazilian cheese bread" fetchpriority="high">
    <img class="ball" id="b2" src="assets/pdq2.webp" alt="" fetchpriority="high">
    <img class="ball" id="b3" src="assets/pdq3.webp" alt="" fetchpriority="high">

    <figure class="frame" id="frame">
      <img src="assets/bread1.webp" alt="Braided cheese breads, fresh from their oven" decoding="async">
      <img src="assets/bread2.webp" alt="Sesame rolls on the bakery counter" decoding="async">
      <img src="assets/bread3.webp" alt="Glazed sweet buns" decoding="async">
      <img src="assets/pan1.webp" alt="" decoding="async">
    </figure>

    <section class="list bakery" id="bakery" aria-labelledby="bkH">
      <h2 id="bkH">From the oven, <em>from 6am.</em></h2>
      <ol>
{rows(BAKERY)}
      </ol>
    </section>

    <section class="peak-copy" id="peakCopy" aria-labelledby="pkH">
      <h2 id="pkH">A buffet by the pound. <em>Every day.</em></h2>
      <p>Homemade Brazilian dishes and BBQ grilled fresh, all day. Fill your plate, pay by weight.</p>
      <blockquote class="quote"><p>&ldquo;White rice, beans, pasta, salad, ribs, all of it on point!&rdquo;</p><cite>Michelle L., Google review</cite></blockquote>
    </section>

    <div class="pans" id="pans">
{pan_html}
    </div>

    <figure class="big" id="big">
      <img src="assets/line.webp" alt="Their buffet line: steel pans of greens, potatoes, steak with onions and stewed beef" decoding="async">
      <img src="assets/sweet1.webp" alt="Pudim, a glossy Brazilian flan, in caramel" decoding="async">
      <img src="assets/sweet2.webp" alt="Passion fruit pudim with seeds on top" decoding="async">
      <img src="assets/sweet3.webp" alt="Chocolate ring cake crowned with strawberries" decoding="async">
      <img src="assets/spread.webp" alt="Their kitchen from above: pão de queijo, crispy fish, chicken pies, crispy shrimp, a burger and açaí" decoding="async">
    </figure>

    <section class="list sweets" id="sweets" aria-labelledby="swH">
      <h2 id="swH">Cakes and sweets, <em>by the slice.</em></h2>
      <ol>
{rows(SWEETS)}
      </ol>
    </section>

    <div class="tags" id="tags">
{tag_html}
    </div>
    <section class="notes" id="notes" aria-label="More from the kitchen">
      <div class="note"><h3>From the kitchen</h3><p>X-Tudo $15.99, pastel $9.80, frango a passarinho $17.99, isca de picanha $26.99.</p></div>
      <div class="note"><h3>Café colonial on weekends</h3><p>A long table of breads, cakes, cheeses and fruit. Bring the family.</p></div>
      <div class="note"><h3>Catering</h3><p>Trays for the office and for parties. Ask on WhatsApp.</p></div>
    </section>

    <div class="days" id="days" aria-label="Opening hours">
{day_html}
    </div>

    <section class="card" id="card" aria-labelledby="cardH">
      <p class="open open-now" id="openNow">Open daily from 6am</p>
      <h2 id="cardH">Pão de queijo is out <em>at 6am.</em></h2>
      <p class="story">Brazilian bakery, buffet by the pound and café on State Road 7. Women-owned and Latino-owned.</p>
      <dl>
        <div><dt>Where</dt><dd>23269 FL-7, Ste 107, Boca Raton, FL 33428 · <a href="https://www.google.com/maps/search/?api=1&amp;query=Esta%C3%A7%C3%A3o+do+P%C3%A3o+23269+FL-7+Boca+Raton" target="_blank" rel="noopener">Directions</a></dd></div>
        <div><dt>Call</dt><dd><a href="tel:+15616171574">(561) 617-1574</a></dd></div>
        <div><dt>Rated</dt><dd>4.4 on Google, 662 reviews</dd></div>
        <div><dt>Delivery</dt><dd>Uber Eats and DoorDash</dd></div>
      </dl>
      <div class="cta-slot" id="ctaSlot" aria-hidden="true"></div>
    </section>
  </div>
  <div class="spacer" id="spacer" aria-hidden="true"></div>
</main>
<p class="demo">Demo site. Photos from Estação do Pão&rsquo;s own Google, DoorDash and Instagram pages.</p>
<script>window.SIZES = {json.dumps(S)};</script>
<script src="liquid-glass.js?v={V}" defer></script>
<script src="site.js?v={V}" defer></script>
</body>
</html>
'''
open("index.html", "w", encoding="utf-8").write(html)
print("index.html v", V)
