# Writes index.html. Bump V on every change to site.css or site.js.
# Run from the build folder: python lab/make_html.py
V = 8
WA = "https://wa.me/13025697265?text=Ol%C3%A1%21%20I%27d%20like%20to%20order%20from%20Cantinho%20Brasileiro."
ICON = ('<svg class="wa" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3.2a8.7 8.7 0 0 0-7.5 13.2L3.3 20.8l4.5-1.2A8.7 8.7 0 1 0 12 3.2Z" '
        'fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/><circle class="d d1" cx="8.4" cy="12" r="1.15"/>'
        '<circle class="d d2" cx="12" cy="12" r="1.15"/><circle class="d d3" cx="15.6" cy="12" r="1.15"/></svg>')
head = open("lab/head.html", encoding="utf-8").read()

word = "".join(f'<span class="ch">{c}</span>' for c in "CANTINHO")

trays = [("lasanha", "Lasanha", "baked in the tray"), ("arroz", "Arroz", "white rice, every day"),
         ("milanesa", "À milanesa", "breaded and fried"), ("batata", "Batatas", "fried golden"),
         ("legumes", "Legumes", "peppers, onions, carrots"), ("feijoada-tray", "Feijoada", "black beans and pork")]
tray_html = "\n".join(
    f'      <figure class="tray" data-t="{k}"><div class="tf"><img src="assets/t-{k}.webp" alt="{n} on the buffet" decoding="async"></div>'
    f'<figcaption><b>{n}</b><span>{d}</span></figcaption></figure>' for k, n, d in trays)

labels = [("beans", "Arroz e feijão", "on every plate, every day"), ("meat", "Carnes", "bife, frango, carne de panela"),
          ("side", "Acompanhamentos", "macarrão, angu, ovo"), ("salad", "Saladas", "lettuce, tomato, beet, cucumber")]
label_html = "\n".join(f'      <p class="lab" data-l="{k}"><i></i><b>{n}</b><span>{d}</span></p>' for k, n, d in labels)

html = f'''<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="robots" content="noindex, nofollow">
<meta name="theme-color" content="#F6F4EF">
<title>Cantinho Brasileiro · Brazilian food in Northeast Philadelphia</title>
<meta name="description" content="Comida mineira from Dona Terezinha's kitchen on Castor Ave. Self-service lunch every day, feijoada on Saturdays, marmita delivery from 6pm. Order on WhatsApp.">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Hanken+Grotesk:wght@400;500;600;700;800;900&family=Newsreader:ital,opsz,wght@1,6..72,500;1,6..72,600&display=swap" rel="stylesheet">
<link rel="preload" as="image" href="assets/pf.webp">
<link rel="preload" as="image" href="assets/table.webp">
{head}
<link rel="stylesheet" href="liquid-glass.css?v={V}">
<link rel="stylesheet" href="site.css?v={V}">
</head>
<body>
<header class="bar" id="bar">
  <a class="mark" href="#top" aria-label="Cantinho Brasileiro"><b>Cantinho</b><i>Brasileiro</i></a>
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
    <h1 class="word" id="word" aria-label="Cantinho Brasileiro">{word}</h1>
    <p class="script" id="script" aria-hidden="true">Brasileiro</p>
    <div class="hero-l" id="heroL">
      <p class="lead">Minas Gerais home cooking, <em>Dona Terezinha&rsquo;s way.</em></p>
      <p class="sub">Self-service lunch and dinner on Castor Ave, Northeast Philadelphia. 20+ years.</p>
    </div>
    <dl class="hero-r" id="heroR">
      <div><dt>Open</dt><dd>Every day, 11am to 10pm</dd></div>
      <div><dt>Saturday</dt><dd>Feijoada da Dona Terezinha</dd></div>
      <div><dt>Delivery</dt><dd>Marmita $14, from 6pm</dd></div>
    </dl>

    <img class="pf-shadow" id="pfShadow" src="assets/pf-shadow.webp" alt="" aria-hidden="true">
    <div class="table" id="table"><img src="assets/table.webp" alt="Six plates on a wooden table: prato feito, frango with okra and angu, salad, spaghetti, carne de panela with beans, fried eggs" decoding="async"></div>
    <img class="pf" id="pf" src="assets/pf.webp" alt="Prato feito: rice, beans, salad, tomato and steak with onions" fetchpriority="high">

    <section class="tablecopy" id="tableCopy" aria-labelledby="tableH">
      <h2 id="tableH">One plate. <em>Then the whole table.</em></h2>
      <p>Self-service mineiro: fill your plate with what Dona Terezinha cooked today.</p>
    </section>
    <div class="labels" id="labels">
{label_html}
    </div>

    <section class="line" id="line" aria-labelledby="lineH">
      <h2 id="lineH">The hot line, <em>cooked the same day.</em></h2>
      <p>Walk the line and build your plate. Arroz, feijão, carnes, acompanhamentos and saladas.</p>
    </section>
    <div class="trays" id="trays">
{tray_html}
    </div>

    <figure class="sat" id="sat"><img class="sat-t" src="assets/t-feijoada-tray.webp" alt="" aria-hidden="true" decoding="async"><img class="sat-f" src="assets/feijoada.webp" alt="Feijoada with rice, couve, farofa and vinagrete" decoding="async"><img class="sat-s" src="assets/storefront.webp" alt="Cantinho Brasileiro storefront, green sign on Castor Ave" decoding="async"></figure>

    <section class="week" id="week" aria-labelledby="weekH">
      <h2 id="weekH">Every day <em>has its dish.</em></h2>
      <ol>
        <li><span class="d">Thursday</span><span class="w">Canjiquinha da Dona Terezinha</span><b>$6</b></li>
        <li><span class="d">Saturday</span><span class="w">Feijoada, with rice, couve, farofa and vinagrete</span></li>
        <li><span class="d">Sunday</span><span class="w">Family lunch. Bring everyone.</span></li>
        <li><span class="d">Every day, 6pm</span><span class="w">Marmita delivery: 2 meats, rice, beans, salad, 1 side</span><b>$14</b></li>
      </ol>
      <p class="note">Parties and family dinners: order trays on WhatsApp.</p>
    </section>

    <section class="card" id="card" aria-labelledby="cardH">
      <img class="logo" src="assets/logo.webp" alt="Cantinho Brasileiro, Dona Terezinha" width="690" height="580">
      <p class="open" id="openNow">Open every day 11am to 10pm</p>
      <h2 id="cardH">Pull up a chair.</h2>
      <p class="story">Dona Terezinha&rsquo;s recipes, 20+ years on Castor Ave. Seen on Rede Globo&rsquo;s <i>&Eacute; de Casa</i>.</p>
      <dl>
        <div><dt>Where</dt><dd>7536 Castor Ave, Philadelphia, PA 19152 · <a href="https://www.google.com/maps/search/?api=1&amp;query=7536+Castor+Ave+Philadelphia+PA+19152" target="_blank" rel="noopener">Directions</a></dd></div>
        <div><dt>Hours</dt><dd>Every day, 11am to 10pm</dd></div>
        <div><dt>Delivery</dt><dd>Marmita $14 + delivery fee, every day from 6pm</dd></div>
        <div><dt>Call</dt><dd><a href="tel:+12157451381">(215) 745-1381</a></dd></div>
      </dl>
      <div class="cta-slot" id="ctaSlot" aria-hidden="true"></div>
    </section>
  </div>
  <div class="spacer" id="spacer" aria-hidden="true"></div>
</main>
<p class="demo">Demo site. Photos from Cantinho Brasileiro&rsquo;s own DoorDash page and Instagram.</p>
<script src="liquid-glass.js?v={V}" defer></script>
<script src="site.js?v={V}" defer></script>
</body>
</html>
'''
open("index.html", "w", encoding="utf-8").write(html)
print("index.html v", V)
