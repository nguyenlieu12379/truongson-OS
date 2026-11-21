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
- **v3.4 (current, 2026-11-21):** logo is now a vector trace of the Vivace badge Son supplied ("espresso / tradizione nord Italia"), saved as `assets/logo.svg` and used in the header (36px), footer and favicon. Recolored as Son asked: ring and script red-orange (#E8471F), the crosshatched cup kept red (#D91E26). Traced from a 316px image at 4x with potrace, so edges are smooth but follow that source; re-trace from their original file if they sign. Kaushan Script font dropped.

## Verified (2026-11-20, headless Chrome)

- Desktop 1280 and phone 390: no horizontal scroll, no console errors, both Google Maps embeds load with the right pins. Pour video autoplays (desktop clip on desktop, portrait crop on phone); with reduced motion it stays paused on the finished-cup still.
- Open-now logic tested at fixed times: weekday open, Friday after Alley 24 closes, late night, Thanksgiving (Brix 8am to 2pm, Alley 24 closed), Sunday before opening.

**Not verified:** a real iPhone.

## Run locally

```bash
node ../../../../../.claude/skills/scroll-craft/scripts/serve.mjs --root . --port 4500
```

Deployed by `.github/workflows/deploy-pages.yml` on push to `main` (`README.md`, `BRIEF.md`, `verify/` are stripped).
