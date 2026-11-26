# Tardes Caleñas (Hollywood, FL)

Prospect demo for a Colombian bar and restaurant at 2025 Hollywood Blvd: 15 years open, salsa nights Wednesday to Sunday, kitchen open every day 11AM to 4AM. Built 2026-11-26 with `/site-building` (pre-build, scroll-craft, liquid glass).

**The pass.** One fixed stage, scroll only drives motion. Their Bandeja Paisa sits between a split "Tardes / Caleñas" (the covered letters sway), then grows and gets leader-line labels for everything on the plate. Four plates are served across the stage one at a time with name, what it is and price. Peak: the picada drops into the middle and every plate that passed comes back round it as a table at 2AM. The table opens out past the edges as the five music nights slide in, then the bandeja comes back beside the reservation card.

- Brief, colour split, failure checks: `BRIEF.md`. Answers: `PREFS.md`. Facts and what to confirm: `RESEARCH.md`.
- Photos: their own menu photos from their order.online page. Sources: `assets/source/SOURCES.md`.
- Cutouts: `lab/cut.py` (shape prior per plate, GrabCut or hand-traced outline), then `lab/shadow.py` bakes the contact shadow into each webp (48px pad, matches `SHADOW_PAD` in `site.js`). No CSS filter runs on a moving plate.
- Markup: `lab/make_html.py` writes `index.html` (bump `V` there on every change to `site.css` or `site.js`).
- Brand: their logo (from the IG avatar, cut by `lab/brand.py`) in the bar and on the card; the Cali cat from the logo sits beside "Tardes"; the logo's martini glass and cutlery drift through each scene. Hero words copy the logo's look: yellow letters, red outline, red drop.
- Colours, sampled from the logo: off-white ground, yellow #E9B721 (big type, marker bars, price chips), red #AF1813 (CTA, outlines, one key word per heading, leader dots).
- One CTA: the bar's Reserve button travels into the card's slot at the close.
- CTA: Reserve on WhatsApp (954-940-2515), their Linktree's only link is "Reservas" to that number.
- Jump to a moment: `?p=0.6`.

## Run

```
node .claude/skills/site-building/scripts/serve.mjs --root websites/TruongSon-demos/scrollcraft/builds/tardes-calenas --port 4514
```

Or `preview_start` with the `tardes-calenas` entry in `.claude/launch.json`.

## Checked

- Headless Chrome, 1440x860 light and dark, 390x844, 320x640: 15 scroll positions each, no page errors, no sideways scroll.
- Liquid glass `verify.cjs`: ball, lens, toggle, reload, touch all pass; click-through passes on the bar CTA (the default check picks the off-screen skip link).
- Not checked: a real phone, Safari and Firefox fallbacks.

## To confirm with the owner
- Hours: their IG says kitchen open until 4AM; online ordering closes 8:40PM.
- Reservation label: "Reserve on WhatsApp" (their own "Reservas" link).
