# Pakachi Kitchen: brief

Pre-build answers: [PREFS.md](PREFS.md) (Son, 2026-11-24). Topics 6, 7, 8, 13 and 14 were delegated ("you decide") and are **authored** below.

Spec demo. Goes live with noindex when done (Son: "go live when done"). Not shown to the client yet.

## Who they are (their own IG and FB only)

- Pakachi Kitchen LLC, Herndon, VA 20171. "Soul of Karachi" (their logo). Pakistani, Karachi and Delhi style, halal. Certified Food Protection Manager.
- Weekly menu deal, posted for Tuesday and Thursday: 6 dishes, single servings $90, double servings $130. Free pickup, or delivery for $5. No minimum for pickup; any dish on its own in single or double servings. Uber Courier outside their delivery zone.
- Catering for groups (weekend catering posts: biryani trays, haleem, bun kabab sliders, fajita subs, corn soup).
- Call/text +1 (571) 341-0009. WhatsApp wa.me/15713410009 (same number, from their captions). They also run a WhatsApp community (not linked on the page: it's an invite link).
- Their look: black meal-prep trays and foil catering trays shot close, warm curry oranges, white basmati. Logo: a gold ring with a wheat sprig and a gold cloche, serif caps.

## Colour split (Son: 60 black or white, 30 gold, 10 the button)

| Share | Dark mode | Light mode | Where |
|---|---|---|---|
| 60 | Black `#0C0B0A` | White `#FBFAF7` | the stage |
| 30 | Gold `#C4A469` (their logo, sampled `#A2895A` to `#C1A871`) | Deep gold `#86672F` (text on white, 5:1) | the wordmark, all type, hairlines, the ring, the order panel |
| 10 | Pakistan green `#0F7A46`, cream label `#FBF3DF` (4.9:1) | same | "Order on WhatsApp" only. Saffron, then Guards Red, then green (Son, 2026-11-24: "red looks ugly in this site") |

## Photos

All from their Facebook page (2048px originals; Instagram only serves 1080). Picked for no text on the food. See `assets/source/SOURCES.md`.

## Journey and feeling (authored)

One fixed stage, one scroll timeline. Nothing scrolls in document flow. Nothing pops in or out: every entrance and exit is a move, a wipe or a turn (Son: "no disappear-appear, no single cut").

| # | Beat | On screen | Feeling |
|---|---|---|---|
| 1 | Hero | Giant gold PAKACHI. Their full foil tray of Karachi biryani, cut from its photo, rises from the bottom right, one layer in front of "CHI". The letters behind it shimmer like heat off the rice. Their logo ring turns slowly behind the tray. Real lemon slices (cut from their haleem photo) drift. | Appetite, and "this is serious food". |
| 2 | The deal | The letters part off both sides. The tray flies to the centre and the frame closes around it: it becomes card 1. Five more of their dishes are dealt out of it into a fanned hand, along the arc of their logo ring, which has grown into the fan's rim. | Anticipation building, card by card. |
| 3 | Double (peak) | Every card slides a twin out from behind it. "Single servings, $90" rolls to "Double servings, $130". | The peak: "the whole hand doubles". |
| 4 | Catering | The hand turns like a wheel and leaves left. The haleem card opens into a wide band; its lemons fly out of it. The band pans through their catering trays. | Abundance. |
| 5 | How to order | Their gold rises from below and pushes the band up. Three steps. | Ease. |
| 6 | Close | The gold panel tightens into an order ticket. The hand fans back in behind it, the tray first. The button lands on the ticket. Holds. | Resolve: "I know exactly what to do". |

**Peak:** "You scroll and the whole hand of dishes doubles, and the price rolls from 90 to 130." Lives in beat 3, which gets the most scroll room with the deal before it.

**Signature move (authored):** the dealt hand that doubles. It shows their actual offer (6 dishes, single or double) and only makes sense for this kitchen.

**Tell-someone sentence:** "It's the site where their biryani tray turns into a hand of six dishes, and the whole hand doubles when you keep scrolling."

**Authored silence:** a short hold after the double (p 0.50 to 0.53) and at the end. Both are intentional.

## Grammar and gate

- Grammar: stage choreography (one fixed 2D stage, layers handed from beat to beat). Not chaptered editorial (Vivace), not a z-camera worldflight (Delícias).
- Nav: a gold thread down the right edge that fills as you scroll, five clickable stops. Bar with logo, theme toggle and the travelling button.
- Hero: product cutout in front of a giant wordmark with covered letters animating. **Same as Delícias, on Son's explicit request** ("covering a huge PAKACHI").
- Act sequence: hero > fan deal > double > wheel exit + band pan > rising panel > ticket with the hand reprised.
- Close: the order panel tightens into a ticket, the hand fans back in behind it. Holds.
- Signature: the hand that doubles.
- Gate: differs from Delícias on grammar, nav, act sequence, close, signature (5 of 6). From Vivace on all 6. From Brazilian Taste (not in the registry yet): its signature was a 7-day grid filling, so the deal here is a fanned hand on an arc, not a grid, and it doubles instead of counting days.

## How this build avoids every pattern in FAILURES.md

| Failure | This build |
|---|---|
| One photo panel plus a text column for the whole scroll | No layout repeats: wordmark + cutout, fanned hand, wide band pan, full-width panel, centred ticket. |
| Blurred-photo or gradient fill backgrounds | Flat black or white. No blur behind anything. The only gradient is a short scrim under each card caption. |
| Floating cards and pills with no reason | The cards are the deal. They sit on the ring's arc and overlap like a held hand. Lemons come out of the haleem photo they were cut from. |
| Muted beige palette with a thin brand accent | Their gold carries 30%: the wordmark, every line of type, the ring, the order panel. Saffron only on the button. |
| Same small label + big sentence every beat | Copy changes shape: wordmark, a price that rolls, captions on cards, a panned caption row, three numbered steps, a ticket. |
| Plastic drawn props | None. Every object is their photo or their logo. The only drawn things are hairlines and type. |
| "Would this fit any other business?" | No: their tray, their 6-dish deal and its two prices, their ring. |

Food is never under letters: the tray is in front of PAKACHI; captions sit on a scrim at a card's bottom edge, below the food.

## UI material

- Liquid glass full stack (stage 3): theme toggle with the glass sweep, the default cursor ball (112px Vivace ball, Brazilian Taste drag), glass buttons, the button leans toward the cursor.
- Two themes: black and gold, white and gold. Device default, toggle remembers.

## Motion budget (Son: "super smooth, no single lag")

- One rAF loop on smoothed scroll. Transforms and clip-path only on moving things, written only when they change. Layout measured once per resize.
- No opacity fades for entrances or exits. No filters on moving photos.
- Images decoded before first paint. Cutouts as WebP.
- Real phone check before the client sees it.

## Facts used

- All from their IG and FB captions: name, Herndon VA 20171, Soul of Karachi, halal, Certified Food Protection Manager, the deal and prices, pickup/delivery/Uber Courier, Tuesday and Thursday menus, the phone and WhatsApp number, dish names on the photos.
- **To confirm with the client:** delivery zone, order cut-off times, whether the prices still hold.

## Revisions

- 2026-11-24 (Son): "just need the CTA button guards red. and in the end frame, i can see it sitting on other letters"
  - The button is Guards Red `#D2001F` with a white label, everywhere it travels (hero, bar, ticket).
  - The ticket is now measured from its own content, button slot included, and the button lands in that slot. Checked at 1280x720, 1440x900, 1920x1080, 390x844 and 360x640: no ticket line under the button.
- 2026-11-24 (Son): "red looks ugly in this site. so pick another color, contrast, but still links to this accent"
  - The button is Pakistan green `#0F7A46` with a cream label `#FBF3DF` (4.9:1). Why green: green and gold is the classic luxury pair, it's the flag of the "Soul of Karachi", and it's the green of the chillies and coriander on their food. It still stands apart from black (3.7:1), white (5.2:1) and the gold ticket.
- 2026-11-24 (Son): "make these green too: side bar, "Karachi" at the opening, "single servings $90", "double serving $130". the catch is in the "Six dishes. One weekly deal." scene, most of objects in the center is ovelapping"
  - Green as type and lines: `--green` `#0F7A46` on white (5.2:1), `#33A86B` on black (6.5:1). Used on the thread, "Karachi" in the hero line and the price line. The button keeps `#0F7A46`.
  - The hand is now laid out under the measured height of the deal heading: card size shrinks until the numbers, the doubled twins and the lowest corner of the outer cards fit between the heading and the bottom of the screen, and the ring's top stays under the heading. Checked at 1770x740, 1280x650, 1440x900, 1920x1080, 390x844, 360x640.
- 2026-11-24 (Son): "make this thing react more obvious when i move the cursor" (the hero tray)
  - About 2.5x the tilt (16deg / 22deg), the tray slides up to 22px toward the cursor, PAKACHI drifts the other way for depth, and a soft light sheen (masked to the tray's own cutout) follows the pointer across the rice. Faster follow (0.14). Overscan raised to 84px so the cut edges never show. Mouse only; touch and reduced motion get the still tray.
- 2026-11-24 (Son): "i saw the tray rotate, up, down, side, circle or whatever the cursor's direction move, i need you to make that more dramatically"
  - The tray now reacts to how the cursor moves, not only where it is: each move kicks a spring (stiffness 0.07, damping 0.16) that overshoots and settles, so flicks swing it and circling the cursor rolls it round. Range up to 32deg back, 38deg sideways, 8deg roll; tipping toward the viewer is capped at 14deg so it never covers the copy.
  - It pivots on its own bottom-right corner (off screen, perspective from that corner), so the photo's cut edges stay hidden in every pose. PAKACHI counter-drifts up to 30px.
- 2026-11-24 (Son): "nah, less dramatic" and "the pakachi hero dont move"
  - About half: lean 13deg / 16deg, max 18deg back, 20deg sideways, 4deg roll, 8deg toward the viewer; kicks halved, damping 0.22 (less bounce), slide 14px. PAKACHI no longer drifts: it stays still while the tray moves.
- 2026-11-24 (Son): "no inertia, no glossing, just slightly moving"
  - The tray only leans toward where the cursor is: up to 4deg up/down and 6deg sideways, set on the next frame (no spring, no lag, no roll, no slide). The light sheen is removed. Still pivots on the hidden bottom-right corner; flat as soon as the page scrolls.
- 2026-11-24 (Son): "the animation looks good now, but the its center rotation"
  - The lean now turns around the tray's centre (transform and perspective origin 50% 50%) instead of its hidden corner. At 4deg / 6deg the edges move about 6px, well inside the 84px overscan, so the cut edges stay off screen.
