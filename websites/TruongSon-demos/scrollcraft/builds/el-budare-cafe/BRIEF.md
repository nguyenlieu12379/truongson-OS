# El Budare Café: brief

Pre-build answers: [PREFS.md](PREFS.md) (2026-11-25, Son). Topics 1 to 9 and 14 were delegated ("you handle") and are **authored** below. Spec demo, live on GitHub Pages with noindex (PREFS 15). Not shown to the client yet.

## Who they are (their Instagram, Linktree and Google listing only)

- El Budare Café, a Venezuelan restaurant in Jackson Heights, Queens. Two spots on Roosevelt Ave: the café at 87-21 and the 24-hour arepera at 94-06 (opened 2025, "the first 24-hour arepera in NY" per their own posts). 5th anniversary in 2026.
- Their posts sell arepas, cachapas, pabellón, tequeños, pepitos, shakes, karaoke and game nights, and holiday hallacas, pernil and party trays (combos for 6).
- WhatsApp (718) 899-2404 (Linktree button and every order post). 94-06 also lists (718) 255-6695.
- 17.5K Instagram followers, 4.6 on Google with about 2,083 reviews (2026-11-25).
- No website: the Linktree has only Instagram, a menu QR link and WhatsApp. Google lists budarecafe.com, which sits behind a Cloudflare check and its /menu link is a 404. **To confirm with the client.**
- Look: round yellow and black logo, a red-brown sign with white rounded lettering ("El BudaRe Cafe", capital R), a Venezuelan flag in every room.

## Colour split (authored, PREFS 4 + Son's correction)

Son, 2026-11-25, after the first preview: "the background mustn't be noticable color, make it light, so it looks clean, not AI slops". The first version ran the sky through flag yellow, blue and navy; it is now one flat ground.

| Share | Light | Dark | Where |
|---|---|---|---|
| 60 | Clean off-white `#FAF9F6` (no tint) | `#0E1014` | the stage, all the way through |
| 30 | Logo black `#1A140E`; their food photos | Cream `#F4F1EA` | wordmark, clock, all type; the photos carry the colour |
| 10 | Flag red `#D21034`, white label | same | "Order on WhatsApp" and the accent word in the order card only |

## Photos (PREFS 2)

Their own Instagram posts and reels, full size (1080 to 3072px source). Chosen for no people and no text on the food; every frame keeps the photo's own shape. Hero: their cachapa de pabellón cut along its real edge (GrabCut with hand-placed seeds). The photo ends at the cachapa's right side, so the cutout always sits on the screen's right edge, never mid-screen. Sources: `assets/source/SOURCES.md`.

## Journey and feeling (authored)

One fixed stage, zero scrolling: the scroll only drives motion (PREFS 10).

| # | Beat | On screen | Feeling |
|---|---|---|---|
| 1 | Hero | Giant "BudaRe" in their own spelling. Their cachapa de pabellón sits on the right edge, one layer in front of "Re"; the covered letters sizzle. "One bite and you're home." (their caption, "Un mordisco y vuelves a casa", in English). The cachapa leans to the cursor. | Hunger, warmth. |
| 2 | Dock | The word shrinks into the bar; the cachapa slides off the right edge; a giant clock rolls up at "12 PM". | Something's starting. |
| 3 | The 24 hours (peak) | The scroll is the clock: it rolls from noon to 11 AM the next day, gliding and slowing on each hour. A dish arrives for each stretch of the day (noon pepito, 3 PM pabellón, 6 PM cachapa with chicharrón, 9 PM shake, midnight tequeños, 3 AM the big stack). When its hours are over it flies down into a row of tickets. Ends on "Morning. Still open." | The peak: "you scroll and the clock runs through the whole night, and the food keeps coming". |
| 4 | Rung up | The day's tickets fly into the clock chip on the day bar. | A breath. |
| 5 | Holidays | "Hallacas season." Pernil, hallacas and a party tray are dealt in at their own shapes. | Family, abundance. |
| 6 | Order | The three photos fold into the frame of their storefront; the cachapa slides back in front of it; "BudaRe" undocks above it; the order card rises with WhatsApp, both addresses, 24 hours, a live map. Holds. | Resolve: "I know where to go". |

**Peak:** "It's 3 AM on the clock and they're still sending out food." Beat 3, nearly half the scroll.

**Signature move (authored):** the scroll is a 24-hour clock. It is their real claim (the 24-hour arepera) and the page proves it by running a full day.

**Tell-someone sentence:** "It's the site where you scroll through a whole day and night and the arepas never stop."

**Authored silence:** "Morning. Still open." holds before the holidays; the close holds.

## Grammar and gate

- Grammar: **Clock stage**. One fixed stage; time is the axis. A rolling hour column, one subject at a time on the stage, and a ticket row that keeps what has passed. No orbit, no lateral pan, no z flythrough, no sections in flow.
- Nav: a day bar at the bottom; a clock chip rides it showing the live hour (Open, 1 PM ... 11 AM, Holidays, Order). Bar: "BudaRe" docks in it, theme toggle, travelling button.
- Hero: product cutout in front of a giant wordmark with covered letters animating (standing hero preference, same device as Delícias, Pakachi and Sweets). This one is anchored to the screen edge.
- Act sequence: hero > dock + clock rolls up > 24-hour roll with six dishes into tickets (peak) > tickets rung up > holidays dealt > fold into the storefront + order card. About 15vh desktop.
- Close: storefront photo with the cachapa in front, word above, order card with two addresses and a map. Holds.
- Signature: the 24-hour clock.
- Gate: vs Sweets by Carla G: grammar, nav, act sequence, close, signature (5 of 6). vs Pakachi: grammar, nav, act sequence, close, signature (5 of 6). vs Delícias: grammar, nav, act sequence, close, signature (5 of 6). vs Brazilian Passion Foods v2 and Vivace: all 6.

## How this build avoids every pattern in FAILURES.md

| Failure | This build |
|---|---|
| One photo panel plus a text column for the whole scroll | No layout repeats: wordmark + edge cutout, a clock with one dish at a time, a ticket row, three dealt frames, a storefront with the cutout in front and a card. |
| Blurred-photo or gradient fill backgrounds | One flat clean ground. Nothing blurred behind anything. |
| Floating cards and pills with no reason | Dishes fly into tickets (the day's orders); the tickets ring up into the clock; the holiday photos fold into the storefront; the cachapa overlaps the shop it comes from. |
| Muted beige palette with a thin brand accent | Son asked for a light, unnoticed ground. The colour is in their food photos at full strength and their red on the one button; type is their logo black at full weight. |
| Same small label + big sentence every beat | Giant wordmark, a rolling clock, time + dish labels, a large "Still open.", a holiday headline, an order card. |
| Plastic drawn props | None. Food, storefront and logo are theirs. The only drawn things are lines, dots and type. |
| "Would this fit any other business?" | No: their 24-hour arepera, their dishes by the hour, their hallacas, their storefront. |

## UI material (PREFS 11, 12)

- Liquid glass: theme toggle with the glass sweep, the Vivace 112px cursor ball (spring 0.14 / 0.72), glass button that leans to the cursor.
- Two themes: clean off-white (light), near-black (dark). Device default, toggle remembers.
- Motion budget: one rAF loop on smoothed scroll; transform, opacity and clip-path only, written on change; layout measured once per resize; the clock is one translated column (no text redraws); the map loads only near the end.

## Facts used and to confirm

- Used: name, both addresses, WhatsApp (718) 899-2404, (718) 255-6695 at 94-06, 94-06 open 24 hours, holiday combos for 6, 4.6 on Google with 2,000+ reviews, the dishes shown in their posts.
- **To confirm:** whether budarecafe.com is a live site; hours for 87-21 (one post says open till 1 AM); dish names for "The big one" stack (named by us from the photo); whether they want the Google rating shown.
