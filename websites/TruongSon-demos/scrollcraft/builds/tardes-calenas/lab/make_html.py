# Builds index.html (run from the repo root). Kept so the markup can be regenerated after copy edits.
B = 'websites/TruongSon-demos/scrollcraft/builds/tardes-calenas'
head = open('.claude/skills/site-building/assets/head.html', encoding='utf-8').read()
head = head[head.index('<script>'):]
head = head.replace('key: "site-theme"', 'key: "tardes-calenas-theme"').replace(
    'colors: { light: "#F1EFEA", dark: "#161311" }', 'colors: { light: "#F7F6F3", dark: "#121110" }')
WA = 'https://wa.me/19549402515?text=Hi%20Tardes%20Cale%C3%B1as%2C%20I%27d%20like%20to%20reserve%20a%20table'
WA_ICON = ('<svg class="wa" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3.2a8.7 8.7 0 0 0-7.5 13.2L3.3 20.8l4.5-1.2A8.7 8.7 0 1 0 12 3.2Z" '
           'fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/><circle class="d d1" cx="8.4" cy="12" r="1.15"/>'
           '<circle class="d d2" cx="12" cy="12" r="1.15"/><circle class="d d3" cx="15.6" cy="12" r="1.15"/></svg>')


def word(w, cls):
    return f'<span class="word {cls}" aria-hidden="true">' + ''.join(f'<span class="ch">{c}</span>' for c in w) + '</span>'


DISHES = [
    ('bandeja', 'Bandeja Paisa', 'Steak, chicharrón, fried egg on rice, chorizo, sweet plantain, beans and arepa.', '$21.99'),
    ('sancocho', 'Sancocho de Costilla', 'Beef rib soup with yuca, potato and corn.', '$19.99'),
    ('lomo', 'Lomo Salteado', 'Sautéed loin with onion and tomato, fries and rice.', '$19.99'),
    ('chuleta', 'Chuleta Caleña', 'The Cali pork chop, with rice and beans.', '$16.99'),
    ('arrozpollo', 'Arroz con Pollo', 'Rice with chicken, served with fries.', '$16.99'),
    ('picada', 'Picada', 'The sampler for the table: beef, pork, sausage, morcilla, plantain and arepa.', '$34.99'),
]
plates = ''.join(f'''
  <div class="plate" id="pl-{k}"><img src="assets/{k}.webp" alt="" decoding="async"></div>
  <div class="tag" id="tg-{k}"><b>{n}</b><span>{d}</span><i>{p}</i></div>''' for k, n, d, p in DISHES)
ANAT = [('steak', 'Grilled steak'), ('chich', 'Chicharrón'), ('egg', 'Fried egg on rice'), ('chorizo', 'Chorizo'),
        ('plantain', 'Sweet plantain'), ('beans', 'Beans'), ('arepa', 'Arepa')]
anat = ''.join(f'<span class="an" id="an-{k}">{t}</span>' for k, t in ANAT)
NIGHTS = [('Wednesday', 'Romántico'), ('Thursday', 'Vallenato'), ('Friday', 'Salsa'), ('Saturday', 'Crossover'), ('Sunday', 'Viejoteca')]
nights = ''.join(f'<li><span class="day">{d}</span><span class="gen">{g}</span></li>' for d, g in NIGHTS)
menu = ''.join(f'<li>{n}, {p}. {d}</li>' for k, n, d, p in DISHES)
THEME_BTN = '''<button class="lg-theme-btn" type="button" aria-pressed="false" aria-label="Dark mode">
      <svg class="lg-i-moon" viewBox="0 0 24 24" aria-hidden="true"><path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>
      <svg class="lg-i-sun" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M12 2.5v2.2M12 19.3v2.2M2.5 12h2.2M19.3 12h2.2M5.3 5.3l1.6 1.6M17.1 17.1l1.6 1.6M5.3 18.7l1.6-1.6M17.1 6.9l1.6-1.6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>
    </button>'''
V = 7
html = f'''<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="robots" content="noindex, nofollow">
<meta name="theme-color" content="#F7F6F3">
<title>Tardes Caleñas · Colombian bar and restaurant · Hollywood, FL</title>
<meta name="description" content="Bandeja paisa, sancocho, picadas and salsa caleña on Hollywood Blvd. Kitchen open every day 11AM to 4AM. Reserve on WhatsApp.">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Archivo:wdth,wght@62..125,500..900&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
<link rel="preload" as="image" href="assets/bandeja.webp">
{head}
<link rel="stylesheet" href="liquid-glass.css?v=1">
<link rel="stylesheet" href="site.css?v={V}">
</head>
<body>
<a class="skip" href="#reserve">Skip to reservations</a>

<header class="bar" id="bar">
  <a class="brand" href="#top" aria-label="Tardes Caleñas, back to the top"><span class="wm">Tardes Caleñas</span><span class="brand-sub">Bar · Restaurant · Hollywood FL</span></a>
  <div class="bar-end">
    <a class="cta lg-glass" href="{WA}" target="_blank" rel="noopener">{WA_ICON}<span class="lbl">Reserve<span class="opt"> on WhatsApp</span></span></a>
    {THEME_BTN}
  </div>
</header>

<main class="stage" id="stage">
  <h1 class="sr-only" id="top">Tardes Caleñas, Colombian bar and restaurant in Hollywood, FL</h1>
  {word("Tardes", "w1")}
  {word("Caleñas", "w2")}
  <p class="hero-line" id="heroLine">Colombian kitchen and salsa bar on Hollywood Blvd. <b>Kitchen open every day until 4AM.</b></p>

  <img class="drift" id="dr-tost" src="assets/tostones.webp" alt="">
{plates}

  <div class="scene-head" id="anHead"><h2>The plate Hollywood orders most.</h2><p>Bandeja Paisa, <b>$21.99</b>. Number one on the menu.</p></div>
  <div class="anat" id="anat">{anat}</div>
  <svg class="leaders" id="leaders" aria-hidden="true"></svg>

  <div class="scene-head" id="passHead"><h2>From the kitchen.</h2><p>Colombian plates, made to order.</p></div>

  <div class="scene-head" id="tableHead"><h2>A table at 2AM.</h2><p><b>Kitchen open every day, 11AM to 4AM.</b> Order the picada and share it.</p></div>

  <section class="nights" id="nights" aria-labelledby="hNights">
    <h2 id="hNights">Five nights of music, every week.</h2>
    <ol class="night-list">{nights}</ol>
    <p class="years">15 years of salsa caleña in Hollywood.</p>
  </section>

  <section class="card" id="reserve" aria-labelledby="hReserve">
    <h2 id="hReserve">Get a table.</h2>
    <p class="note">Reservations are on WhatsApp. Send the day, the time and how many.</p>
    <table class="hours">
      <tr><th scope="row">Kitchen</th><td>Every day, 11AM to 4AM</td></tr>
      <tr><th scope="row">Music</th><td>Wednesday to Sunday</td></tr>
    </table>
    <p class="addr">2025 Hollywood Blvd, Hollywood, FL 33020 · <a href="https://www.google.com/maps/dir/?api=1&amp;destination=2025+Hollywood+Blvd+Hollywood+FL+33020" target="_blank" rel="noopener">Directions</a></p>
    <a class="cta big lg-glass" href="{WA}" target="_blank" rel="noopener">{WA_ICON}<span class="lbl">Reserve on WhatsApp</span></a>
    <p class="alt">954-940-2515 on WhatsApp · Call <a href="tel:+19543917542">954-391-7542</a> · <a href="https://www.instagram.com/tardes_calenas/" target="_blank" rel="noopener">@tardes_calenas</a></p>
  </section>

  <section class="sr-only" aria-label="Menu"><h2>Menu highlights</h2><ul>{menu}</ul></section>
</main>
<div class="spacer" id="spacer" aria-hidden="true"></div>
<p class="demo-note">Concept site prepared for Tardes Caleñas. Photos from their own menu.</p>

<script src="liquid-glass.js?v=1" defer></script>
<script src="site.js?v={V}" defer></script>
<script>addEventListener("DOMContentLoaded", function () {{ if (window.LiquidGlass) {{ LiquidGlass.cursorBall(); LiquidGlass.glassify(".lg-glass"); }} }});</script>
</body>
</html>
'''
open(B + '/index.html', 'w', encoding='utf-8').write(html)
print('index.html', len(html))
