# El Salvadoreño Restaurant & Grill (Kendall, Miami, FL)

Prospect demo for a Salvadoran restaurant and grill at 10855 SW 72nd St. v2, rebuilt 2026-11-27 with `/site-building` (pre-build, scroll-craft, liquid glass) after the five-pattern skill update was reverted. v1 ("the comal") was judged too simple; it's in git history (a92eacf, 4f85fbc).

**The flag.** One fixed stage of three bands, blue, white, blue, like the Salvadoran flag on their avatar. The bands never leave; they change proportion to frame each scene.
- **Hero:** "EL SALVADOREÑO" fills the top band. Their pupusa sits centred on the white band like the flag's emblem, breathing and leaning to the cursor; the letters it covers ripple. A jamaica glass drifts in the blank space.
- **Pupusas:** the bands pull back to stripes and the pupusa slides left beside the twelve pupusas and their prices.
- **Peak:** the bands open, the pupusa shrinks into the white band and leads the kitchen across it (ranchera, chicharrones, jamaica, chuleta, camarones, pargo, each with name and price). Categories run left in the top band, and the hours and order line run right in the bottom band.
- **Party tray:** the band text hands over to "Party trays" and their 25-pupusa tray opens from the centre of the white band.
- **Close:** the tray slides off and the flag returns with the emblem on the left and the order card across the top band's edge. It holds there.

- Brief, colour split, failure checks: `BRIEF.md`. Answers: `PREFS.md`. Facts: `RESEARCH.md`.
- Photos: their own SkyTab menu photos (all of them in `assets/source/all/`, contact sheet `all-sheet.jpg`). Sources: `assets/source/SOURCES.md`.
- Cutouts: `lab/cut.py` (the pupusa off its plate), `lab/cut3.py` (whole plates: a fitted ellipse or rectangle for the plate, unioned with the food, then checked on off-white and blue in `lab/cuts-sheet.png`). Plates that touched the photo edge were dropped.
- Markup: `lab/make_html.py` writes `index.html` (bump `V` on every change to `site.css` or `site.js`).
- Colours: off-white (the flag's white), flag blue #1F4FA8 at full strength in the bands, navy text, avatar gold #E5B53A on the CTA only.
- CTA: Order on WhatsApp (786-606-1159), with a light sweep and a typing bubble.
- Jump to a moment: `?p=0.4`.

## Checked

- Built-in browser at 1440x860 (light) and 390x844 (dark) at p = 0, 0.16, 0.3, 0.38, 0.42, 0.45, 0.64, 0.72, 1. No console errors, no sideways scroll, every image loads, the cursor ball is there.
- Not checked: a real phone, Safari and Firefox, the skill's `shoot.mjs` and `verify.cjs` harness (`playwright-core` is not installed).

## Run

```
node .claude/skills/site-building/scripts/serve.mjs --root websites/TruongSon-demos/scrollcraft/builds/el-salvadoreno --port 4515
```
