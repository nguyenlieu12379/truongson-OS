# Estação do Pão (Boca Raton, FL)

Prospect demo for a Brazilian bakery and restaurant at 23269 State Road 7, Boca Raton: breads and salgados from 6am, a buffet by the pound every day, cakes and sweets, weekend café colonial. Built 2026-11-28 with `/site-building` (pre-build, scroll-craft, liquid glass). Lead #12.

**The steam table.** One fixed stage, scroll only drives motion. The photo frames are the pans of their buffet: they split, regroup and refill to frame each scene. Their three pão de queijo sit in a pile in front of a giant plum "Estação". The top one opens into a tall pan of their bread with the bakery list beside it. Peak: that pan drops into the first slot of a steam table, eleven more slide out of it one by one and get served their dishes, then every pan flips over like a station board and the gaps close into the photo of their real buffet line. The line folds back into one pan for the sweets, opens wide into their studio spread with prices pinned to the food, then drops into a row that breaks into seven pans, one per day with its hours. The word and the pile come back beside the order card.

- Brief, colour split, failure checks: `BRIEF.md`. Answers: `PREFS.md`. Facts and what to confirm: `RESEARCH.md`.
- Photos: their DoorDash studio spread and Google owner photos. Sources: `assets/source/SOURCES.md`.
- Cutouts: `lab/cut.py` (check sheets in `lab/check/`), then `lab/prep.py` exports every web image and `lab/sizes.json`.
- Markup: `lab/make_html.py` writes `index.html` (bump `V` there on every change to `site.css` or `site.js`).
- Colours from their sign: off-white ground, plum #4B3A52 (the script on their sign, type and word), sign yellow #F2C53D (CTA only).
- CTA: Order on WhatsApp (561) 345-9964, the number in their Instagram bio. Call (561) 617-1574 on the hero and the card.
- Jump to a moment: `?p=0.5`. Contact sheets: `python lab/shots.py <name> <w> <h> [light|dark] [p,p,...]` with the server running.

## Run

```
node .claude/skills/site-building/scripts/serve.mjs --root websites/TruongSon-demos/scrollcraft/builds/estacao-do-pao --port 4519
```

Or `preview_start` with the `estacao-do-pao` entry in `.claude/launch.json`.

## Checked

- Headless Chrome: 1920x1080, 1440x860 light and dark, 1280x680, 390x844, 360x640, 320x640, reduced motion. Every scene and the in-between frames, no page errors, no sideways scroll. Sheets in `lab/sheet-*.jpg`.
- Liquid glass `verify.cjs`: ball, lens, toggle, reload, click-through, touch all pass.
- Not checked: a real phone, Safari and Firefox fallbacks.

## To confirm with the owner
- Prices are from their Uber Eats menu; in-store prices may be lower.
- Buffet price per pound: not on the page (only an undated "$7.99/lb" post found).
- Café colonial days and hours ("weekends" in their post).
- WhatsApp orders go to 561-345-9964.
