# Brazilian Taste: brief

Pre-build answers: [PREFS.md](PREFS.md) (Son, 2026-11-23). Topics marked **authored** were delegated and written by Claude.

Spec demo only. Local until Son says live. Not shown to the client yet.

## Who they are (from their Instagram only)

- Brazilian Taste, Dallas, Texas. Premade meals, catering, personal chef. Chef Clécia.
- Orders by WhatsApp: (682) 862-9545. No website, no Google listing, no Facebook page.
- Their own line: "More time for what matters." ("Brazilian Taste — More time for what matters.")
- Their look: dozens of black meal-prep trays in rows and grids, shot from above on a wooden table. Logo: tall condensed "Brazilian" in white on deep green, "TASTE" set vertically in yellow.

## Colour split (Son: 60/30/10)

| Share | Colour | Where |
|---|---|---|
| 60 | White `#FFFFFF` | the stage, every beat |
| 30 | Deep green `#29400E` (sampled from their avatar) | the wordmark, all type, hairlines, the green "order" band |
| 10 | Yellow `#F8E04A` (the "TASTE" letters in their avatar) | the "Order on WhatsApp" button only. Nothing else is yellow. |

## The beats (authored journey, one unbroken white world)

One fixed stage. Scroll drives one timeline. Nothing scrolls in document flow but a spacer.

| # | Beat | What's on screen | Feeling |
|---|---|---|---|
| 1 | Hero | Their real "Brazilian" letters, huge, green on white, "TASTE" upright beside them as in the logo. Their quote underneath: "More time for what matters." One yellow button. | Direct. You know who and what in one look. |
| 2 | The split | "Brazi" slides left, "lian" slides right. Their overhead photo of 20 bowls (feijão, farofa, couve, pork) opens in the gap, exactly as wide as the gap. The letters frame the food; they never sit on it. | Appetite. |
| 3 | The week | The photo shrinks into the Monday cell of a 7-day grid drawn in green hairlines. Tuesday to Sunday fill one by one with their trays as you scroll. A counter: "3 of 7 days cooked". | The peak: your week filling up. |
| 4 | Three ways | Premade meals, catering, personal chef. Each is a wide photo strip that enters from alternate sides. A giant green numeral sits in the white beside it, its baseline on the strip's bottom edge. | Range. |
| 5 | How to order | A deep green band rises. White type: "Message us. Get this week's menu. Pick your meals." Their lunchbox photo rides the band's top edge, half in, half out, like it's being lifted out of the bag. | Ease. |
| 6 | Close | The two halves of "Brazilian" slide back together. Big yellow "Order on WhatsApp", the number, Dallas, Instagram. Holds. | Resolve. |

**Signature move (authored):** the week fills up. Their own trays drop into Mon to Sun as you scroll. It only makes sense for a meal-prep kitchen, so it can't be swapped onto another business.

**Tell-someone sentence:** "Their logo splits open and the food is inside, then you watch your whole week of meals get packed."

**Hero animation (authored):** on load, the nine real letters rise from a baseline one after another and settle with a small stretch, like the condensed logo being pulled tall. "TASTE" drops in last, top to bottom.

## How this build avoids every pattern in FAILURES.md

| Failure (Brazilian Passion Foods) | This build |
|---|---|
| One photo panel plus a text column held for the whole scroll | No beat repeats a layout: split wordmark, 7-cell grid, alternating strips with numerals, green band, centred close. No persistent side panel. |
| Blurred-photo or soft-gradient backgrounds used to fill space | Background is flat white (60%). No blur, no gradients behind content. Photos are always sharp and whole. |
| Floating cards and pills dropped over content | No cards over photos. Every overlap has a job: letters frame the gap the photo opens in; numerals share the strip's bottom edge; the lunchbox crosses the band edge on purpose. |
| Muted beige or grey palette, brand colour only as a thin accent | Their deep green carries 30% at full strength: the wordmark, all type, the order band. Their yellow is the CTA. |
| Same small-label plus big-sentence card on every beat | Copy changes shape every beat: wordmark, day labels, counter, numerals, a three-line list, a phone number. |
| Drawn CSS/SVG props (v1) | None. Every image is their photo. The only drawn things are hairlines and type. |
| "Would this layout fit any other business with the photos swapped?" | No: the hero is their own wordmark, and the peak is a 7-day meal-prep grid. |

Son's extra rule: **food is never covered by letters.** Type sits around photos, never over them.

## UI material

- Liquid glass, clear lens, cursor lens (kit from stage 3). No venom. No theme toggle (not asked; the 60/30/10 is a light palette).
- The yellow CTA keeps its colour so the label reads.

## Motion budget (Son: "super smooth, like Delícias")

- One rAF loop, smoothed scroll, transforms and opacity only on moving things. Styles written only when they change.
- No filters or backdrop filters on moving photos. Images decoded before first paint of their beat.
- Real phone check before the client sees it.

## Facts used

- WhatsApp (682) 862-9545, wa.me/16828629545 (their captions). Dallas, Texas. Premade meals, catering, personal chef (bio). Chef Clécia (captions). "More time for what matters" (captions).
- Dish line for the Monday tray from their own caption: chicken thigh in chef's sauce, white rice, black bean stew, baked sweet potatoes.
- No prices, hours or delivery area: their IG doesn't state them. **To confirm with the client:** delivery or pickup, weekly order cut-off.
