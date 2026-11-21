# Tōv Coffee (concept demo)

A short, practical site for **Tōv Coffee**, an Egyptian coffee shop at 3639 SE Hawthorne Blvd, Portland, Oregon. Built from the F&B template (`websites/templates/fnb-practical/`) as a free demo. No AI generation, no spend.

- **Status:** built and checked locally. Not published yet.
- **Why this prospect:** Tōv has no website, just a Linktree pointing to Instagram. Its hours on Yelp changed at least three times in 2026, so customers can't find the current hours from Tōv itself. They have a strong story (opened in 2015 in a red double-decker bus, featured on Netflix's *Somebody Feed Phil*), 4.7 stars from 989 Google reviews and a DoorDash listing.

## Sources (checked 2026-11-21)

| Fact | Source |
|---|---|
| Drink list and descriptions, sizes, "can take up to 20 minutes" | Tōv's printed in-shop menu, in a Commons photo from June 2025 |
| Hours (9:30am to 5pm, closed Wednesdays), phone | Yelp listing, Nov 2026 snapshot. **Not from Tōv**: confirm before pitching. Other listings disagree. |
| Address | Yelp, Wikipedia, Google Maps embed |
| DoorDash link | Search result for Tōv's DoorDash store. Bot-blocked here, so not opened. Check it in a browser. |
| Instagram @tovcoffee_co, email | Tōv's Linktree (linktr.ee/tovcoffee) |
| History (2015 bus, Joseph Nazir, moved 2023) | Wikipedia |
| Photos | Wikimedia Commons, Another Believer, CC BY-SA 4.0 (see `credits.html`) |

**Prices are not shown on purpose.** The menu photo has prices, but it's from June 2025.

## Not done

- **No logo.** Their "TōV" calligraphy mark appears only on the menu photo (angled, glossy). The header uses the name in text. Trace it with `tools/trace_logo.py` if we get a clean image.
- **No video.** The hero is the lounge photo.
- **Not checked on a real phone.**

## Edit and rebuild

Edit `site.json`, then:

```bash
node websites/templates/fnb-practical/build.mjs websites/TruongSon-demos/tov-coffee/site.json websites/TruongSon-demos/tov-coffee
```

## Verified (2026-11-21, headless Chrome)

`tools/verify.cjs` passed all 22 checks at desktop and phone sizes: open-now status, drink buttons, cart, checkout routes, phone swipe menu, no console errors. The Google Map shows the right pin. Screenshots are in `verify/`.
