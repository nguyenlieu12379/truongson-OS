# Writes index.html. Bump V on every change to site.css or site.js.
# Run from the build folder: python lab/make_html.py
V = 8
WA = "https://wa.me/15084109302?text=Ol%C3%A1%21%20I%27d%20like%20to%20order%20from%20CB%20Bakery."
ICON = ('<svg class="wa" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3.2a8.7 8.7 0 0 0-7.5 13.2L3.3 20.8l4.5-1.2A8.7 8.7 0 1 0 12 3.2Z" '
        'fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/><circle class="d d1" cx="8.4" cy="12" r="1.15"/>'
        '<circle class="d d2" cx="12" cy="12" r="1.15"/><circle class="d d3" cx="15.6" cy="12" r="1.15"/></svg>')
head = open("lab/head.html", encoding="utf-8").read()

# the counter line: four words on one baseline. word index, word
WORDS = ["BAKERY", "SALGADOS", "SWEETS", "FOOD"]

def word(i, w):
    chars = "".join(f'<span class="ch">{c}</span>' for c in w)
    return f'      <p class="w" data-w="{i}" aria-hidden="true">{chars}<i class="bl"></i></p>'

# pastries that stand on the letters: key, word, first letter, last letter, image, alt, name, price
ITEMS = [
    ("catarina", 1, 0, 1, "catarina", "Catarina, a braided pastry filled with ham and cheese", "Catarina, ham &amp; cheese", "$5.99"),
    ("empadinha", 1, 4, 5, "empadinha", "Empadinha de frango, a small chicken pie", "Empadinha de frango", "$6.50"),
    ("box", 1, 6, 7, "coxinhas-box", "A bowl of mini coxinhas", "Coxinhas box", "$27.00"),
    ("quindim", 2, 0, 1, "quindim", "Quindim, a glossy yellow coconut custard", "Quindim", "$6.00"),
    ("tortinha", 2, 2, 3, "tortinha", "Tortinha de morango, a strawberry cream tart", "Tortinha de morango", "$6.50"),
    ("brigadeiro", 2, 4, 5, "brigadeiro", "Three chocolate brigadeiros", "Brigadeiro", "$3.00 each"),
]
items_html = "\n".join(
    f'      <figure class="it" data-k="{k}" data-w="{w}" data-a="{a}" data-b="{b}"><img src="assets/{img}.webp" alt="{alt}" decoding="async"><span class="sh"></span></figure>'
    for k, w, a, b, img, alt, _, _ in ITEMS)
tags = ITEMS[:0]
tag_html = "\n".join(
    f'      <p class="tag" data-for="{k}"><b>{n}</b><span>{pr}</span></p>' for k, _, _, _, _, _, n, pr in ITEMS)
tag_html += '\n      <p class="tag" data-for="coxinha"><b>Coxinha</b><span>$5.00</span></p>'
tag_html += '\n      <p class="tag wide" data-for="plate"><b>Chicken plate</b><span>rice, beans, chicken, salad</span></p>'
tag_html += '\n      <p class="tag wide" data-for="steak"><b>Steak plate</b><span>steak, egg, rice, beans, salad</span></p>'

LABELS = [("rice", "Rice", "white, fluffy"), ("beans", "Beans", "slow cooked"),
          ("chicken", "Chicken", "roasted golden"), ("salad", "Salad", "creamy, with greens")]
label_html = "\n".join(f'      <p class="lab" data-l="{k}"><i></i><b>{n}</b><span>{d}</span></p>' for k, n, d in LABELS)

KITCHEN = [("Frango grelhado", "grilled chicken with fries", "$16.00"),
           ("Carne de sol com mandioca", "sun-dried beef with cassava", "$18.00"),
           ("Feijão tropeiro", "beans with farofa and sausage", "$10.50"),
           ("Caldo misto", "chicken and bean soup", "$10.99"),
           ("X-Tudo", "the Brazilian burger with everything", "$17.50"),
           ("Misto quente especial", "#1 most liked on Uber Eats", "$6.50")]
kitchen_html = "\n".join(f'        <li><span class="n"><b>{n}</b><small>{d}</small></span><span class="p">{p}</span></li>' for n, d, p in KITCHEN)

html = f'''<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="robots" content="noindex, nofollow">
<meta name="theme-color" content="#F7F5F2">
<title>CB Bakery · Brazilian bakery &amp; restaurant in Worcester</title>
<meta name="description" content="Brazilian bakery and restaurant at 108 Belmont St, Worcester. Coxinha, salgados, Brazilian sweets and lunch plates. Open 5am Monday to Saturday. Order on WhatsApp.">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;800&family=Figtree:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<link rel="preload" as="image" href="assets/coxinha.webp">
<link rel="preload" as="image" href="assets/plate.webp">
{head}
<link rel="stylesheet" href="liquid-glass.css?v={V}">
<link rel="stylesheet" href="site.css?v={V}">
</head>
<body>
<header class="bar" id="bar">
  <a class="mark" href="#top" aria-label="CB Bakery"><b>CB</b><i>Bakery</i></a>
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
    <h1 class="sr">CB Bakery, Brazilian bakery and restaurant in Worcester, MA</h1>
    <div class="line" id="line">
{chr(10).join(word(i, w) for i, w in enumerate(WORDS))}
{items_html}
      <div class="tags" id="tags">
{tag_html}
      </div>

      <div class="copy hero-l" data-w="0">
        <p class="lead">Brazilian bakery &amp; restaurant on Belmont St, <em>Worcester.</em></p>
        <p class="sub">Salgados, breads, sweets and lunch plates, from 5 in the morning.</p>
      </div>
      <dl class="copy hero-r" data-w="0">
        <div><dt>Open</dt><dd>Mon to Sat 5am to 9:30pm · Sun 7am to 7pm</dd></div>
        <div><dt>Call</dt><dd><a href="tel:+15087929333">(508) 792-9333</a></dd></div>
        <div><dt>Rated</dt><dd>4.6 on Uber Eats, 900+ ratings</dd></div>
      </dl>
      <section class="copy" data-w="1" aria-labelledby="h1s">
        <h2 id="h1s">Salgados, <em>fried and baked all day.</em></h2>
        <p>Coxinha, empada, catarina, pão de queijo from $1. Get a box for the party.</p>
      </section>
      <section class="copy" data-w="2" aria-labelledby="h2s">
        <h2 id="h2s">Brazilian sweets, <em>by the piece.</em></h2>
        <p>Quindim, tortinhas, brigadeiros, and cake by the slice: carrot, fubá, banana, coconut.</p>
      </section>
      <section class="copy" data-w="3" aria-labelledby="h3s">
        <h2 id="h3s">And a real lunch. <em>Look at the O&rsquo;s.</em></h2>
        <p>Plates from the kitchen: rice, beans, meat and salad, the way it&rsquo;s done in Brazil.</p>
      </section>
    </div>

    <img class="cox" id="cox" src="assets/coxinha.webp" alt="A golden coxinha, the shredded chicken croquette" fetchpriority="high">
    <span class="cox-sh" id="coxSh" aria-hidden="true"></span>
    <img class="plate" id="plate" src="assets/plate.webp" alt="Lunch plate: white rice, beans, roast chicken and salad" decoding="async">
    <img class="steak" id="steak" src="assets/steak.webp" alt="Steak plate: grilled steak with onions, fried egg, rice, beans, tomato and lettuce" decoding="async">

    <div class="labels" id="labels">
{label_html}
    </div>

    <section class="kitchen" id="kitchen" aria-labelledby="kh">
      <h2 id="kh">From the kitchen, <em>all day.</em></h2>
      <ol>
{kitchen_html}
      </ol>
      <blockquote class="quote"><p>&ldquo;Taste so authentic and home made.&rdquo;</p><cite>Divine E., on the caldo misto, DoorDash</cite></blockquote>
    </section>

    <figure class="room" id="room"><img src="assets/room.webp" alt="Inside CB Bakery: glass cases of cakes and pastries, tables, Brazil flags along the ceiling" decoding="async"></figure>

    <section class="card" id="card" aria-labelledby="cardH">
      <img class="logo" src="assets/logo.webp" alt="CB Bakery logo: Brazilian. Bread, sweets, food" width="800" height="800">
      <p class="open" id="openNow">Open Mon to Sat from 5am</p>
      <h2 id="cardH">Come early. <em>We open at 5.</em></h2>
      <p class="story">Brazilian bakery and restaurant on Belmont St. Latino-owned.</p>
      <dl>
        <div><dt>Where</dt><dd>108 Belmont St, Worcester, MA 01605 · <a href="https://www.google.com/maps/search/?api=1&amp;query=CB+Bakery+108+Belmont+St+Worcester+MA" target="_blank" rel="noopener">Directions</a></dd></div>
        <div><dt>Hours</dt><dd>Mon to Sat 5am to 9:30pm · Sun 7am to 7pm</dd></div>
        <div><dt>Call</dt><dd><a href="tel:+15087929333">(508) 792-9333</a></dd></div>
        <div><dt>Rated</dt><dd>4.6 Uber Eats (900+) · 4.5 Google (199)</dd></div>
      </dl>
      <div class="cta-slot" id="ctaSlot" aria-hidden="true"></div>
    </section>
  </div>
  <div class="spacer" id="spacer" aria-hidden="true"></div>
</main>
<p class="demo">Demo site. Photos from CB Bakery&rsquo;s own Google, DoorDash and Uber Eats pages.</p>
<script src="liquid-glass.js?v={V}" defer></script>
<script src="site.js?v={V}" defer></script>
</body>
</html>
'''
open("index.html", "w", encoding="utf-8").write(html)
print("index.html v", V)
