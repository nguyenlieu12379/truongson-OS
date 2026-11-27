# El Salvadoreño Restaurant & Grill (Kendall, Miami, FL)

Prospect demo for a Salvadoran restaurant and grill at 10855 SW 72nd St. Built 2026-11-27 with `/site-building` (pre-build, scroll-craft, liquid glass). It's the first build on the five-pattern update (`references/conversion.md`).

**The comal.** One fixed stage, scroll only drives motion, one real pupusa as the thread. The hero has the headline, proof and CTA readable at first paint, with the pupusa in front of a still "Salvadoreño". The pupusa then travels left beside the 11 fillings and their real prices. Peak: it shrinks into the centre cell, 24 copies step out into a 5 by 5 grid as the count rolls to 25, and the moment the 25th lands their real 25-pupusa tray wipes open over it ($99.99, 50 for $172.99). Next, four plates come in as a spread. Then comes the order builder (the free sample), and the close card with live open status, hours, address and the review quote.

- Brief, first screen copy, free sample, failure checks: `BRIEF.md`. Answers: `PREFS.md`. Facts and what to confirm: `RESEARCH.md`.
- Photos: their own SkyTab menu photos. Sources: `assets/source/SOURCES.md`. Cutout: `lab/cut.py` (checked on white and black: `lab/check-pupusa.png`).
- Markup: `lab/make_html.py` writes `index.html` and inlines the skill's `head.html` (theme and motion toggle). Bump `V` there on every change to `site.css` or `site.js`.
- Colours: off-white ground, avatar navy #1C3A7A (type, rules, fills), avatar gold #E5B53A (CTA only).
- CTA everywhere: Order on WhatsApp (786-606-1159). The builder writes the order into the WhatsApp message.
- Jump to a moment: `?p=0.5`.

## Conversion check (references/conversion.md)

| # | Check | Result |
|---|---|---|
| 1 | Mirror | Pass. The first screen shows "Pupusas and Salvadoran plates, made fresh in Kendall.", what you get (hot, big plates, open 8am, 4.6 from 1,500+), and the CTA. All real text, no scroll needed, at 1440x860 and 390x844. |
| 2 | Highlighter | Pass. Gold appears only on the CTA buttons. Links are navy and underlined; headings, icons and fills are navy. On the first screen the gold button is the only saturated colour. |
| 3 | Layers | Pass on desktop. Back: the still word. Middle: copy. Front: the pupusa, and the CTA with the only button shadow. On desktop the pupusa sits on the builder and close cards' left edge, and the spread's plates step down alternately. Phone: the pupusa leaves before the builder (no room), so those two screens are flat cards. |
| 4 | Motion | Pass. One mover per screen: hero (the pupusa breathes), fillings (still), peak (the copies), spread (still), builder and close (still). The first-screen text never animates. Motion off (toggle or system setting) switches to the static stacked layout. Checked: toggle off, layout static, toggle on, fixed stage. |
| 5 | Free sample | Pass. Pupusa builder with real prices: 3 taps show "3 pupusas $15.75" and write the WhatsApp message. At 20 or more it points to the 25-for-$99.99 tray. Works in both layouts. |

## Checked

- Built-in browser at 1440x860 (light) and 390x844, at p = 0, 0.2, 0.4, 0.57, 0.71, 0.84, 1. No console errors, no sideways scroll, every image loads.
- Builder maths and WhatsApp text, open-now line, motion toggle both ways, cursor ball present on desktop.
- Not checked: a real phone, Safari and Firefox, the skill's `shoot.mjs` and `verify.cjs` harness (`playwright-core` is not installed), dark mode at every position.

## Run

```
node .claude/skills/site-building/scripts/serve.mjs --root websites/TruongSon-demos/scrollcraft/builds/el-salvadoreno --port 4515
```

Or `preview_start` with the `el-salvadoreno` entry in `.claude/launch.json`.
