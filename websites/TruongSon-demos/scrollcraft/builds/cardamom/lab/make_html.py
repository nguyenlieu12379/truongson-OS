# Writes index.html. Bump V on every change to site.css or site.js.
# Run from the build folder: python lab/make_html.py
import json
V = 6
WA = "https://wa.me/17732735730?text=Hi%21%20I%27d%20like%20to%20order%20from%20Cardamom."
ICON = ('<svg class="wa" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3.2a8.7 8.7 0 0 0-7.5 13.2L3.3 20.8l4.5-1.2A8.7 8.7 0 1 0 12 3.2Z" '
        'fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/><circle class="d d1" cx="8.4" cy="12" r="1.15"/>'
        '<circle class="d d2" cx="12" cy="12" r="1.15"/><circle class="d d3" cx="15.6" cy="12" r="1.15"/></svg>')
head = open("lab/head.html", encoding="utf-8").read()
sign = json.load(open("lab/sign.json"))

word = "".join(f'<span class="ch">{c}</span>' for c in "cardamom")

# the menu: (photo, name, what it is, price). Prices as listed on their Uber Eats menu.
MENU = [
    ("plate", "Hyderabadi Chicken Biryani", "The chef&rsquo;s special. Dum cooked, Hyderabad style.", "21.99"),
    ("bowls", "Goat Biryani", "Their best seller.", "21.99"),
    ("bowls", "Chicken 65 Biryani", "Biryani with their Chicken 65.", "19.99"),
    ("apps", "Chicken 65", "Spicy fried chicken, curry leaf tempering.", "20.99"),
    ("apps", "Majestic Chicken", "Hyderabadi special: yogurt and herb sauce.", "21.99"),
    ("curries", "Nizami Goat Kadai", "Tender goat in a rich kadai masala.", "22.99"),
    ("curries", "Butter Chicken", "Creamy, mild. Butter naan $4.49.", "20.99"),
    ("meetha", "Double ka Meetha", "Hyderabadi bread pudding.", "9.99"),
    ("night", "Irani Chai", "The one on the sign in their window.", "2.49"),
]
rows = "\n".join(
    f'        <li data-ph="{ph}"><span class="n">{n}</span><span class="d">{d}</span><b>${p}</b></li>' for ph, n, d, p in MENU)
FR = [("bowls", "Biryani bowls and Chicken 65 on a tray at their table"),
      ("apps", "Chicken 65, Chicken Manchurian and Majestic Chicken in boat dishes, naan behind"),
      ("curries", "Butter chicken, Nizami goat kadai, salan and naan"),
      ("meetha", "Double ka meetha on a black plate"),
      ("night", "")]
frames = "\n".join(
    (f'      <img class="fr fr-{k}" data-k="{k}" src="assets/f-{k}.webp" alt="{alt}" decoding="async">' if k != "night" else
     '      <img class="fr fr-night" data-k="night" src="assets/night-off.webp" alt="Cardamom storefront at night, 7742 N Milwaukee Ave, with the IRANI CHAI sign in the window" decoding="async">')
    for k, alt in FR)
W, H = sign["size"]; y0, y1 = sign["y"]
letters = "\n".join(
    f'      <span class="lt" style="left:{a / W * 100:.3f}%;top:{y0 / H * 100:.3f}%;width:{(b - a) / W * 100:.3f}%;height:{(y1 - y0) / H * 100:.3f}%">'
    f'<img src="assets/night-on.webp" alt="" style="width:{W / (b - a) * 100:.3f}%;left:{-a / (b - a) * 100:.3f}%;top:{-y0 / (y1 - y0) * 100:.3f}%"></span>'
    for a, b in sign["letters"])

html = f'''<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="robots" content="noindex, nofollow">
<meta name="theme-color" content="#F6F5F1">
<title>Cardamom · Hyderabadi restaurant in Niles, IL</title>
<meta name="description" content="Authentic Hyderabadi biryani, 100% Zabiha halal, on Milwaukee Ave in Niles. Dine-in, takeout, catering and banquet. Open late. Order on WhatsApp.">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,500;0,9..144,600;1,9..144,500&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<link rel="preload" as="image" href="assets/plate.webp">
{head}
<link rel="stylesheet" href="liquid-glass.css?v={V}">
<link rel="stylesheet" href="site.css?v={V}">
</head>
<body>
<header class="bar" id="bar">
  <a class="mark" href="#top" aria-label="Cardamom">cardamom</a>
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
    <div class="night" id="night" aria-hidden="true"></div>
    <h1 class="word" id="word" aria-label="Cardamom, Hyderabadi restaurant in Niles">{word}</h1>
    <div class="hero-l" id="heroL">
      <p class="lead">Hyderabadi biryani, <em>slow cooked in Niles.</em></p>
      <p class="sub">100% Zabiha halal. Dine-in, takeout, catering and banquet on Milwaukee Ave.</p>
    </div>
    <dl class="hero-r" id="heroR">
      <div><dt>Google</dt><dd>4.6 from 390 reviews</dd></div>
      <div><dt>Halal</dt><dd>100% Zabiha</dd></div>
      <div><dt>Hours</dt><dd>Open late, till 2am</dd></div>
    </dl>

    <img class="plate-sh" id="plateSh" src="assets/plate-shadow.webp" alt="" aria-hidden="true">
    <img class="plate" id="plate" src="assets/plate.webp" alt="Hyderabadi chicken biryani on a copper plate, two chicken pieces, onion ring and coriander" fetchpriority="high">

    <div class="frame" id="frame">
{frames}
      <div class="sign" id="sign" aria-hidden="true">
{letters}
      </div>
    </div>
    <img class="room" id="room" src="assets/f-room.webp" alt="Cardamom dining room: wooden tables and chairs, warm wall lamps" decoding="async">

    <section class="menu" id="menu" aria-labelledby="menuH">
      <h2 id="menuH">What to order <em>first.</em></h2>
      <ol id="menuList">
{rows}
      </ol>
      <p class="note">Prices as listed on their Uber Eats menu.</p>
    </section>

    <section class="late" id="late" aria-labelledby="lateH">
      <h2 id="lateH">The sign stays on <em>till 2am.</em></h2>
      <p>When the rest of Milwaukee Ave is closed, the biryani is still coming out of the kitchen.</p>
      <dl>
        <div><dt>Most days</dt><dd>2pm to 2am</dd></div>
        <div><dt>Wednesday</dt><dd>5pm to 2am</dd></div>
      </dl>
    </section>

    <section class="inside" id="inside" aria-labelledby="insideH">
      <h2 id="insideH">Bring the <em>whole family.</em></h2>
      <ul>
        <li><b>Dine-in</b><span>A full dining room, tables for big groups.</span></li>
        <li><b>Catering</b><span>Free delivery on all catering orders.</span></li>
        <li><b>Banquet</b><span>Birthdays, Eid, graduations. Ask on WhatsApp.</span></li>
        <li><b>Halal</b><span>100% Zabiha, every dish.</span></li>
      </ul>
    </section>

    <section class="card" id="card" aria-labelledby="cardH">
      <p class="stars"><b>4.6</b> on Google &middot; 390 reviews</p>
      <h2 id="cardH">Biryani tonight?</h2>
      <p class="story">Authentic Hyderabadi cooking, 100% Zabiha halal, on Milwaukee Ave in Niles.</p>
      <dl>
        <div><dt>Where</dt><dd>7742 N Milwaukee Ave, Niles, IL 60714 &middot; <a href="https://www.google.com/maps/search/?api=1&amp;query=Cardamom+7742+N+Milwaukee+Ave+Niles+IL+60714" target="_blank" rel="noopener">Directions</a></dd></div>
        <div><dt>Hours</dt><dd>2pm to 2am, Wednesday from 5pm</dd></div>
        <div><dt>Call</dt><dd><a href="tel:+18474107335">(847) 410-7335</a></dd></div>
        <div><dt>WhatsApp</dt><dd><a href="{WA}" target="_blank" rel="noopener">(773) 273-5730</a></dd></div>
      </dl>
      <div class="cta-slot" id="ctaSlot" aria-hidden="true"></div>
    </section>
  </div>
  <div class="spacer" id="spacer" aria-hidden="true"></div>
</main>
<p class="demo">Demo site. Photos from Cardamom&rsquo;s own Instagram.</p>
<script src="liquid-glass.js?v={V}" defer></script>
<script src="site.js?v={V}" defer></script>
</body>
</html>
'''
open("index.html", "w", encoding="utf-8").write(html)
print("index.html v", V)
