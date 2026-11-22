# Delícias Cake & Bakery: brief

Interviewed 2026-11-22 in chat (who answered, Son or Truong, not stated). Topics marked **authored** were delegated ("u decide") and written by Claude.

Spec demo only. Not deployed until Delícias says yes.

## The eight topics

1. **Vibe:** "soft, cute, juicy". References: none given. **Authored:** their own Instagram grid (pink swirls, glossy close-ups, script logo); a Brazilian padaria counter at 7am.
2. **Journey:** "the first thing is the cake that you think they love the most, make it nearer layer from the rest, dont build a low poly replica, just real product, the cake must be one layer closer to the text behind it, and add animation to the covered part of the letter. and you descide the rest of the scroll"
   - Hero cake: **the pudim** (Brazilian flan). Posted 3+ times ("The classic that melts in your mouth"), and the only full silhouette on a clean background in their feed.
   - "Animation on the covered part of the letter": the letters the pudim covers wobble like jelly, in sync with the pudim's own wobble. Letters it doesn't touch stay still.
   - **Authored rest:** hero, sweets in the air, the morning counter, cakes for parties, a quiet pink beat, through the front door, arrival at the counter.
3. **Energy:** "u decide". **Authored:** bouncy open, calm middle, one loud moment (the front door), calm landing.
4. **Feeling + one moment:** "u decide". **Authored:** see feeling curve and peak below.
5. **The thing no site does:** "u decide". **Authored:** the pudim wobbles like a real pudim when you scroll, and pulls the letters behind it into the wobble.
6. **Range:** "the style must fits their vibe on IG". Their IG is playful-maximalist: hot pink, soft pink, cocoa, glossy food close-ups, big rounded type, swirl shapes. So: **playful**, pink-forward, not premium-minimal, not cream-and-brass.
7. **World:** "unbroken". One continuous space, no sections.
8. **Assets:** 14 real photos from @deliciascakee (`assets/source/SOURCES.md`). No generated assets.

## Feeling curve (authored)

| # | Waypoint | Feeling | What on screen causes it |
|---|---|---|---|
| 1 | Pudim | Appetite | The real pudim in front of a giant "Delícias", wobbling when you move, the letters behind it wobbling too |
| 2 | Sweets | Delight | Truffles, cupcakes, rocambole drifting past at different depths as the camera flies in |
| 3 | Morning | Warmth | Pão de queijo in the basket, sweet bread, coffee. Slower, closer, "from 6am" |
| 4 | Parties | Pride | Strawberry cake and dessert cups, cakes for birthdays, weddings and chás |
| 5 | Winn St | Anticipation (authored silence) | Almost empty pink space, one small line: the address. Intentional, not dead scroll |
| 6 | Front door | Awe, the peak | The real storefront sign rushes in until the camera goes through it |
| 7 | Counter | Belonging, resolve | Inside, at the display case. The pudim is waiting on the counter. Hours, WhatsApp, directions. Holds |

## The peak

> "you scroll and the whole thing flies right through their pink front door and you're standing at the counter"

Lives at waypoint 6. Gets the longest stretch of track and the quiet beat (5) before it.

## Tell-someone sentence

> It's the site where the pudim wobbles when you scroll, then you fly through the bakery's front door and the pudim is waiting for you at the counter.

## Authored silence

Waypoint 5 (Winn St) is deliberately near-empty pink with one line of copy. Verification should not count it as dead scroll.

## Revisions

- 2026-11-23: "make every blocks glass liquid, add liqiud glass like apple design on iphone and mac, add cursor tracing animation to those glasses too (the liquid glass is added to everything: buttons, text box, ...)". Done: buttons, text cards, hero card, map pill and photo frames are liquid glass (frost + SVG refraction in Chromium, plain frost elsewhere), rim and inner light follow the cursor, buttons lean toward it. Touch screens get a fixed highlight. This overrides the taste floor's "no decorative glass" default because the brief asked for it.

- 2026-11-23: "make the glass clearer, and the liquid must bend the light behing it at the edges and corners, and the light also bends (like the edges) when the cursor go into it. btw, the site is laggy". Done: clearer tint; per-pane edge refraction maps (rim and corners only) plus a magnifying lens under the cursor, on the text cards and their buttons (Chromium). Lag: removed the animated noise filter, took backdrop filters off the 11 moving photo frames, baked the pudim cutout to a transparent image, letter coverage measured only on camera moves, redraw skipped when nothing moved, fewer sprinkles, photos decoded at load.

- 2026-11-23: "make it smoother, still lil llagg. btw, Liquid glass effect: a clear refractive lens that magnifies and bends the content behind it along its edge, with a thin specular highlight on the rim. No blur, no frost". Done: glass is a clear lens (magnifies the whole pane, bends harder at edges and corners, cursor lens magnifies under the pointer), 1px specular rim, no blur, no frost, no tint (buttons keep a pink tint so white text reads). Smoothness: stacking order set once instead of every frame, all measurements moved before style writes, styles written only on change, grain layer 4x smaller, photo frames have no filter.

## Facts used (from RESEARCH.md and their Instagram)

- 45 Winn St, Burlington, MA 01803
- Mon-Sat 6am-10pm, Sun 7am-5pm (Instagram "We are open" post)
- WhatsApp or text: (781) 365-0181 (Instagram graphics). RESEARCH.md also lists (781) 661-8417 as WhatsApp. **Confirm before showing the client.**
- By Roseli (Roseli Reis)
- Custom cakes for birthdays, weddings, showers (chás), corporate events
- No prices. No stats.
