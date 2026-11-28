# Cardamom (Niles, IL)

Prospect demo for a Hyderabadi (100% Zabiha halal) restaurant at 7742 N Milwaukee Ave, Niles: biryani, Hyderabadi starters, open late, dine-in, catering and banquet. Built 2026-11-28 with `/site-building` (pre-build, scroll-craft, liquid glass). Lead #11.

**Google shows them as temporarily closed.** Confirm before the call (see `RESEARCH.md`).

**The sign.** One fixed stage, scroll only drives motion. Their biryani breathes over a deep green "cardamom". The word parts and the plate steps into a frame beside the menu (real names and Uber Eats prices); each dish's photo from their own table rolls up as its row comes up. The last row is Irani chai, and its photo is their storefront with the neon off. Peak: the frame grows, the page goes to night and their green sign switches on letter by letter. The dining room grows out of the lit window (dine-in, catering, banquet, halal), then the word comes back in neon with the plate and the order card holds.

- Brief, colour split, failure checks: `BRIEF.md`. Answers: `PREFS.md`. Facts and what to confirm: `RESEARCH.md`.
- Photos: their reel frames and one poster dish. Sources: `assets/source/SOURCES.md`.
- Cutout: `lab/cut.py` (needs `lab/posts/`, re-download by shortcode). Web assets: `lab/export.py` (sign off version, plate shadow, crops). Letter boxes of the sign: `lab/sign.json`.
- Markup: `lab/make_html.py` writes `index.html` (bump `V` there on every change to `site.css` or `site.js`).
- Colours: off-white ground, their green (type), gold #E2B04A (CTA only), neon #7FE05F on the night scenes.
- CTA: Order on WhatsApp (773) 273-5730.
- Jump to a moment: `?p=0.6`.

## Run

```
node .claude/skills/site-building/scripts/serve.mjs --root websites/TruongSon-demos/scrollcraft/builds/cardamom --port 4518
```

Or `preview_start` with the `cardamom` entry in `.claude/launch.json`.

## Checked

- Headless Chrome at 1440x860, 1280x680, 1920x1080, 390x844 and 320x640, light and dark: every scene, no page errors, no sideways scroll. Sheets in `lab/sheet-*.jpg`.
- Liquid glass `verify.cjs`: ball, lens, toggle, reload, click-through, touch all pass.
- Not checked: a real phone, Safari and Firefox fallbacks.

## To confirm with the owner
- Open or temporarily closed.
- Hours (2pm to 2am, Wednesday from 5pm, from Yelp; Apple Maps differs).
- Prices are their Uber Eats prices; in-house may be lower.
