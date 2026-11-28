# CB Bakery (Worcester, MA)

Prospect demo for a Brazilian bakery and restaurant at 108 Belmont St, Worcester: salgados, breads, Brazilian sweets and lunch plates, open 5am Monday to Saturday. Built 2026-11-28 with `/site-building` (pre-build, scroll-craft, liquid glass). Lead #10.

**The counter line.** One fixed stage, scroll only drives motion. The page is one line of giant maroon serif words on a shared baseline: BAKERY, SALGADOS, SWEETS, FOOD. The letters are the counter: their real pastries stand on the letter tops, names and prices hang under the baseline. Their coxinha stands on BAKERY, hops onto the G of SALGADOS as the line pans, the salgados and sweets drop onto their letters. Peak: the O's of FOOD grow into two of their lunch plates, then the page pushes into the chicken plate until it fills the screen and four labels pin to the food. The plate steps aside for the kitchen list with prices, their room rolls up out of the plate's spot, the order card holds with the coxinha standing on its edge.

- Brief, colour split, failure checks: `BRIEF.md`. Answers: `PREFS.md`. Facts and what to confirm: `RESEARCH.md`.
- Photos: their Google owner photos, DoorDash header and Uber Eats menu photos. Sources: `assets/source/SOURCES.md`.
- Cutouts: `lab/cut.py` (check sheets in `lab/check/`). Label targets on the plate (`TGT` in `site.js`) are fractions of the plate cut.
- Markup: `lab/make_html.py` writes `index.html` (bump `V` there on every change to `site.css` or `site.js`).
- Colours from their logo: off-white ground, maroon #6D2425 (type), gold #DB9637 (CTA only).
- CTA: Order on WhatsApp (508) 410-9302, the number on their posts. Call (508) 792-9333 is on the hero and the card.
- Jump to a moment: `?p=0.6`.

## Run

```
node .claude/skills/site-building/scripts/serve.mjs --root websites/TruongSon-demos/scrollcraft/builds/cb-bakery --port 4517
```

Or `preview_start` with the `cb-bakery` entry in `.claude/launch.json`.

## Checked

- Headless Chrome, 1440x860 light and dark, 1280x680, 390x844, 320x640: every scene and the in-between frames, no page errors, no sideways scroll. Sheets in `lab/sheet-*.jpg`.
- Liquid glass `verify.cjs`: ball, lens, toggle, reload, click-through, touch all pass.
- Not checked: a real phone, Safari and Firefox fallbacks.

## To confirm with the owner
- WhatsApp orders: their bio says "Call to order, no DMs". The button goes to WhatsApp 508-410-9302.
- Hours: IG bio Mon to Sat 5am to 9:30pm, Sun 7am to 7pm. Uber and DoorDash show shorter delivery hours.
- The two lunch plates have no price on the current menu, so the page names what's on them only.
