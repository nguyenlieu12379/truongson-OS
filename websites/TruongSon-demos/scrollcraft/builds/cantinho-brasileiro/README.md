# Cantinho Brasileiro (Philadelphia, PA)

Prospect demo for a Brazilian (comida mineira) self-service restaurant at 7536 Castor Ave, Northeast Philadelphia: Dona Terezinha's kitchen, 20+ years open, feijoada on Saturdays, marmita delivery from 6pm. Built 2026-11-27 with `/site-building` (pre-build, scroll-craft, liquid glass). Lead #9.

**The table.** One fixed stage, scroll only drives motion. Their prato feito sits in front of a navy CANTINHO. Peak: the plate is a detail of their own overhead table photo, so the photo opens around it and the camera pulls back until it is one of six plates; four labels pin to the food. The table slides off and uncovers the hot line (six real buffet trays pan past), the feijoada tray grows into their Saturday plate beside the week's dishes, then their sign rolls up, the table slides back and the order card holds.

- Brief, colour split, failure checks: `BRIEF.md`. Answers: `PREFS.md`. Facts and what to confirm: `RESEARCH.md`.
- Photos: their DoorDash studio photo and frames from their Instagram reels. Sources: `assets/source/SOURCES.md`.
- Cutout: `lab/cut.py`. The plate's box in the photo (`lab/cuts.json`) is `PF` in `site.js`; keep them in sync or the pull-back won't line up.
- Markup: `lab/make_html.py` writes `index.html` (bump `V` there on every change to `site.css` or `site.js`).
- Colours from their logo: off-white ground, navy #081C65 (type), yellow #EFDF21 (CTA only).
- CTA: Order on WhatsApp (302) 569-7265, the number on all their posts.
- Jump to a moment: `?p=0.3`.

## Run

```
node .claude/skills/site-building/scripts/serve.mjs --root websites/TruongSon-demos/scrollcraft/builds/cantinho-brasileiro --port 4516
```

Or `preview_start` with the `cantinho-brasileiro` entry in `.claude/launch.json`.

## Checked

- Headless Chrome, 1440x860 light and dark, 390x844, 320x640: scroll positions across every scene, no page errors, no sideways scroll. Sheets in `lab/sheet-*.jpg`.
- Liquid glass `verify.cjs`: ball, lens, toggle, reload, click-through, touch all pass.
- Not checked: a real phone, Safari and Firefox fallbacks.

## To confirm with the owner
- Hours: Google and Yelp say 11am to 10pm daily; DoorDash shows 11am to 9:40pm.
- "By the pound": not on their own pages. The site says self-service.
- Sunday family lunch and Saturday feijoada are from their posts; confirm they are weekly.
