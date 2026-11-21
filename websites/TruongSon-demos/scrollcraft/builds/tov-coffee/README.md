# Tōv Coffee (concept demo, scroll-craft)

A scroll-craft page for **Tōv Coffee**, an Egyptian coffee shop at 3639 SE Hawthorne Blvd, Portland. Its own design, built from Tōv's own room, menu and story. Nothing copied from Espresso Vivace or any other build.

- **Status:** built and verified locally. Not published.
- **Why this prospect:** no website (a Linktree to Instagram only), Yelp hours changed several times in 2026, strong story (2015 double-decker bus, Netflix's *Somebody Feed Phil*), 4.7 stars from 989 Google reviews.
- **Brief, grammar, curve, score:** `BRIEF.md` (self-authored under Son's delegation).

## The page

| Stop | What happens |
|---|---|
| SE Hawthorne | A violet wall with a gold-trimmed arch. Scroll and the wall, the doorway's depth and the room move at different rates: you walk through the arch into the lounge. |
| Made slow | Their own menu line, set big on gold: your latte may take up to 20 minutes. |
| The menu | 7 house drinks, the basics and the no-caffeine list slide past on framed plates. Ends with DoorDash and the phone number. |
| The house | The hall, counter and window seat, each wiped in. |
| Since 2015 | The red bus. |
| 3639 SE Hawthorne | Address, live open-now (Portland time), the week, directions, DoorDash, phone, Instagram, map, storefront photo ("look for the gold door"). |

**Signature move:** the navigation is a bus destination blind. It rolls to the stop you're at and opens into the list of stops. At the last stop it shows whether Tōv is open right now.

## Files

| File | What |
|---|---|
| `index.html` | The page and its styles. |
| `tov.js` | The blind, the stop list, open-now and the week strip, keyboard focus in the menu rail, the doorway's pointer lean. |
| `scrollcraft.js`, `scrollcraft.css` | The scroll-craft engine, unedited. |
| `credits.html` | Photo credits (all Commons, Another Believer, CC BY-SA 4.0). |
| `assets/` | room (hero), house-hall, house-counter, house-window, bus, storefront. WebP. |
| `BRIEF.md` | Brief, grammar, feeling curve, layer contract, sources. |

## Sources (checked 2026-11-21)

- Drinks and descriptions: Tōv's printed menu (Commons photo, June 2025). Prices left out on purpose (old).
- Hours (9:30am to 5pm, closed Wednesdays) and phone: Yelp, Nov 2026. **Not from Tōv; confirm before pitching.** Hours live in `tov.js` (`WEEK`).
- DoorDash link: from search results. DoorDash blocks automated visits, so it wasn't opened. Check it in a browser.
- History: Wikipedia.

## Verified (2026-11-21, headless Chrome)

- scroll-craft harness (`shoot.mjs`) at 1280x800, 390x844 and reduced motion: no dead scroll, every cue clears 4.5:1 contrast at its worst frame, no console errors. Contact sheets read by eye.
- Doorway checked at opening, mid and resolved positions, desktop and phone (phone has its own arch position and crop).
- Blind: rolls per stop, opens, jumps, closes on Esc and returns focus. Keyboard tab order is sensible; focus inside the menu rail scrolls the plate into view.
- Open-now and the week strip render in Portland time.
- Reduced motion: the doorway is a still arch with the room behind it, the menu is a sideways scroll region one screen tall.

**Feel check:** intended curiosity, transport, amusement, appetite, warmth, nostalgia, arrival. Felt: curiosity, transport (strong), amusement, browsing, warmth, nostalgia, arrival. The menu reads as browsing more than appetite because there are no drink photos. Real photos of their signature drinks (their Instagram has them) would fix that if they sign.

**Not verified:** a real phone (iOS Safari), and the DoorDash link.

## Run locally

```bash
node ../../../../../.claude/skills/scroll-craft/scripts/serve.mjs --root . --port 4530
```
