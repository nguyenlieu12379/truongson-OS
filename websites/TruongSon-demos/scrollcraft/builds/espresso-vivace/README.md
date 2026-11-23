# Espresso Vivace (concept demo)

A short, practical site for **Espresso Vivace**, Seattle: menu, live open-now status, two locations with maps, and ordering. Built as a free demo (no AI generation, no spend).

- **Live:** https://nguyenlieu12379.github.io/truongson-OS/espresso-vivace/ (`noindex`, labeled as a concept, not affiliated with Vivace).
- **Why this prospect:** a real, open business whose homepage is a looping espresso video with nav only: no headline, no menu, no hours or addresses on the first screen.

## What a drink buyer gets

1. **First screen:** what it is, both bars with live "open now / opens at" status (Seattle time), Order and Menu buttons, and a looping latte-art pour video (muted; a still of the finished cup when motion is off).
2. **Menu:** drink names in three groups, plus beans.
3. **Locations:** the Brix storefront photo, then map, hours, address, tap-to-call, directions for each bar. Holiday hours in a fold-out.
4. **Order:** Grubhub (Alley 24 pickup or delivery), call ahead, beans shop.

## Sources (checked 2026-11-20)

| Fact | Source |
|---|---|
| Hours, holiday hours, phones, addresses, cashless | espressovivace.com/retail/brix/ and /retail/alley-24/ |
| Drink list | Vivace's Grubhub listing for Alley 24 (via Allmenus, (c) 2023) |
| Grubhub ordering link | grubhub.com listing for Alley 24 (returns 200) |
| Founding, latte art credit | Wikipedia |
| Storefront photo | Wikimedia Commons, "Seattle in October 2022 - 168.jpg" |

**Prices are not shown on purpose.** The only priced list is from 2023 ($3.75 latte) and recent reviews say about $6. Get the current menu from the owner before any real use. No drink ordering found for Brix, so the page offers a phone number for it.

**Holiday hours are hard-coded** in `site.js` (`HOLIDAYS`) and the table in `index.html`. Update both each season.

## Files

| File | What |
|---|---|
| `index.html` | The page. |
| `site.css` | Styles. |
| `site.js` | Hero video source per device, demo cart (drink buttons, add-to-cart panel, cart, localStorage), appear-on-scroll animations, open-now status (Seattle time). Drink option rules (milk drinks, hot/iced pairs, no-size drinks) are the `MILK`, `PAIRS`, `NO_SIZE` lists at the top of the cart code. |
| `assets/logo.svg` | Vivace badge, traced to vector from the image Son supplied, recolored. |
| `credits.html` | Credits for the storefront photo and pour video. |
| `assets/pour*.mp4`, `pour-poster*`, `pour-final*` | Pour video (Mixkit "Latte art" #810, free license, not filmed at Vivace): 1280x720 desktop, 576x720 phone crop, first/last-frame posters. |
| `assets/brix-outside.webp` | Brix storefront, Oct 2022 (Commons, Another Believer, CC BY-SA 4.0). 960px: full size was rate-limited. |
| `verify/` | Screenshots from the last check. |
| `BRIEF.md` | History: the earlier scroll-craft editorial version and why it changed. |

## History

- **v1:** scroll-craft chaptered editorial page with an SVG rosetta drawn by scroll.
- **v2:** the drawing swapped for a real Mixkit pour video scrubbed by scroll.
- **v3 (2026-11-20):** Son asked for less fluff: just what a drink buyer needs (menu, map, ordering). Story chapters, scroll effects and the video were removed.
- **v3.1 (2026-11-20):** Son asked to add the pour video and a cafe exterior photo. The pour loops in the hero (replacing the latte photo); the Brix storefront heads the Locations section. Earlier versions are in git history.
- **v3.2 (2026-11-20):** appear-on-scroll animations (fade + 14px rise, staggered, once; plain fade under reduced motion; nothing hidden without JS) and a vector redraw of the round Vivace sign as the brand mark (header, footer, favicon). It is our SVG approximation of their sign, set in Kaushan Script and Archivo, not their artwork: swap in their real logo file if they sign.
- **v3.3 (, 2026-11-21, 4am UTC+7 as Son scheduled):** order flow. The hero Order button is removed; the header Order goes to the menu. Every drink is a button that opens an add-to-cart panel (quantity, size, hot/iced where the menu has both, milk for milk drinks, notes; bottom sheet on phone, side panel on laptop). A cart icon with a count badge sits beside the Menu heading; the cart keeps items in localStorage and lets you change quantity or remove. No prices and no payment: "Order ahead (demo)" says ordering isn't connected and links Grubhub and both phone numbers. On phones the menu sections swipe sideways, each about two-thirds of the screen.
- **v3.4 (2026-11-21):** logo is now a vector trace of the Vivace badge Son supplied ("espresso / tradizione nord Italia"), saved as `assets/logo.svg` and used in the header (36px), footer and favicon. Recolored as Son asked: ring and script red-orange (#E8471F), the crosshatched cup kept red (#D91E26). Traced from a 316px image at 4x with potrace, so edges are smooth but follow that source; re-trace from their original file if they sign. Kaushan Script font dropped.
- **v3.5 (2026-11-22):** dark mode. Follows the device setting by default; a moon/sun button in the bar switches it and remembers the choice (localStorage `vivace-theme`, applied in `<head>` before first paint so there's no flash). Dark palette: espresso-brown ground, lighter red for text and links so they stay readable, brighter green for "open now". Colors live as tokens at the top of `site.css`. Phone header tightened so the extra button fits down to 320px.
- **v3.6 (2026-11-22):** fixed the dark-mode button doing nothing for returning visitors: their browser kept the cached `site.js?v=3.4`, which had no toggle code. The toggle now lives in the inline script in `<head>` (a stale `site.js` can't break it) and asset versions are bumped to `?v=3.6`. **Bump the `?v=` on `site.css` and `site.js` in `index.html` on every change.** Added the switch animation: the new theme grows as a circle out of the button (View Transitions); browsers without that get a 0.4s colour cross-fade; reduced motion switches instantly. The icon turns in.
- **v3.7 (2026-11-22):** the theme switch is a glass lens: the new theme grows from the button over 5s (1.4s in v3.7, 4s in v3.8, 7s in v3.9 to v4.0), and its edge is a ring that magnifies and bends the page behind it, with a thin bright rim. SVG displacement filter on the View Transition snapshots; the lens map is redrawn each frame from a small canvas (`glassSwitch` in the `<head>` script, filters `#glass-new` / `#glass-old` at the top of `<body>`). Without View Transitions: a 0.7s colour fade. Reduced motion: instant.
- **v4.0 (current, 2026-11-22):** (the glass pieces are now a reusable skill: `.claude/skills/build/` (stage 3)) liquid glass ball that follows the cursor (mouse and trackpad only; off on touch and with reduced motion). It trails the cursor on a spring, stretches along its direction of travel and wobbles back to round, and grows a little over links and buttons. Clicks pass through it. In Chrome and Edge it refracts the live page (`backdrop-filter` with the SVG lens `#ball-lens`, map drawn once in `site.js`); Safari and Firefox get the glass rim and highlight without the bending. Two Chrome rules learned the hard way: position it with `left`/`top`, not `translate`, and keep the lens pull gentler than its rim width or thin text folds into blobs.

## Verified (2026-11-22, v4.0, Chrome)

- Lens alignment measured on test grids (both axes, fixed and in-flow content); bends smoothly with no folding. Text, button and photo checked light and dark.
- Stretches along motion; clicks pass through; 60fps while moving; hidden on touch.
- Not checked: Safari and Firefox fallback in a real browser, a real trackpad.

## Verified (2026-11-22, v3.7, Chrome)

- Lens bends text, nav and the pour video along the edge, light to dark and back, desktop and phone. No console errors.
- Headless Chrome (no GPU): median 60fps with some dropped frames on desktop. Check smoothness on a real phone.

## Verified (2026-11-22, v3.6, Chrome)

- Button works with the old pre-dark-mode `site.js` forced in (the returning-visitor case).
- Circle reveal light to dark and back; fallback fade with View Transitions removed; reduced motion is instant.

## Verified (2026-11-22, dark mode, Chrome)

- Device dark at 1280 and 390: whole page, add-to-cart panel and Google Maps render correctly.
- Device light, toggle to dark, reload (stays dark), toggle back. `aria-pressed` follows.
- Header: no horizontal scroll at 390, 360 and 320.

## Verified (2026-11-20, headless Chrome)

- Desktop 1280 and phone 390: no horizontal scroll, no console errors, both Google Maps embeds load with the right pins. Pour video autoplays (desktop clip on desktop, portrait crop on phone); with reduced motion it stays paused on the finished-cup still.
- Open-now logic tested at fixed times: weekday open, Friday after Alley 24 closes, late night, Thanksgiving (Brix 8am to 2pm, Alley 24 closed), Sunday before opening.

**Not verified:** a real iPhone.

## Run locally

```bash
node ../../../../../.claude/skills/build/scripts/serve.mjs --root . --port 4500
```

Deployed by `.github/workflows/deploy-pages.yml` on push to `main` (`README.md`, `BRIEF.md`, `verify/` are stripped).
