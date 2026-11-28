# Brief: CB Bakery

Answers: [PREFS.md](PREFS.md) (Son, all defaults, 2026-11-28, "go on your own, dont ask for anything"). Journey, feeling, signature and style were delegated ("u decide"), so those parts are **authored** under explicit creative delegation. Facts: [RESEARCH.md](RESEARCH.md).

## The eight topics
1. **Vibe:** match their IG and logo as a serious, busy bakery (open 5am, 900+ ratings). Authored words: early, generous, Brazilian, steady. References: a Brazilian padaria counter at 6am; the type on their own logo ("Bread · Sweets · Food").
2. **Journey (authored):** the coxinha you came for > the salgados beside it > the sweets case > lunch, a real plate > what the kitchen makes and costs > where, when, order.
3. **Energy:** calm hero, steady pans, a lift when the O's turn into plates, the biggest move at the push into the plate, calm list, calm close.
4. **Feeling and the one moment:** see the curve below.
5. **Signature move (authored):** the O's in FOOD are their lunch plates. The page then pushes into one until it fills the screen.
6. **Style:** serious editorial. Playfair Display for the giant words (it echoes the serif "CB" on their logo), Figtree for text. Maroon at full strength in the words, gold on the button only.
7. **World:** one unbroken world on a fixed stage. Nothing scrolls up; scroll pans the counter line and drives the motion.
8. **Assets:** their own Google owner photos, DoorDash header and Uber Eats menu photos. See `assets/source/SOURCES.md`.

## Colour 60/30/10 (from their logo)
- 60: off-white ground #F7F5F2 (dark #121010).
- 30: logo maroon #6D2425 for the giant words, headings, tags (dark mode: warm off-white type).
- 10: logo gold #DB9637 on the CTA only, maroon label.

## Grammar: the counter line (type as the shelf)
One fixed stage. The page is one long line of giant serif words, BAKERY, SALGADOS, SWEETS, FOOD, set on a shared baseline. The letters are the counter: their real pastries stand on the tops of the letters with contact shadows, names and prices hang under the baseline. Scroll moves the camera along the line. Why not the others: the pass, the comal, the flag and the table are taken (tardes, el-salvadoreno, cantinho); counter catalog needs a tag-bearing case and footage; filmic one-shot needs footage we don't have. Their logo is literally three words, so the words carry the menu.

## Feeling curve
| Act | Feeling | Cause |
|---|---|---|
| 1 Hero | appetite, welcome | their coxinha standing on top of a maroon BAKERY, breathing; the letters under it give a little |
| 2 Salgados | craving, plenty | the line pans, the coxinha hops onto the G of SALGADOS, catarina, empadinha and the coxinha box drop onto the other letters with prices |
| 3 Sweets | delight | quindim, morango tortinha and brigadeiros land on SWEETS |
| 4 Food | surprise | the O's of FOOD turn into two of their lunch plates |
| 5 The plate (peak) | hunger, being there | the page pushes into the chicken plate until it fills the screen; four labels pin to the food |
| 6 Kitchen list | practical confidence | the plate steps aside; the hot food list with real prices sets in, with a real review |
| 7 Close | trust, ready to go | their room rolls up, the card arrives, the coxinha stands on the card's top edge |

**The peak:** "The O's in FOOD were plates, and then it zooms into one." Act 5, largest span (about 23% of the scroll), after the quieter FOOD reveal.

**Tell someone:** "It's the site where the pastries stand on the letters and the O's in FOOD are lunch plates."

Authored silence: the short hold on the full plate with labels set, before it steps aside.

## Score
| Act | Device | Why |
|---|---|---|
| Hero | layered hero (word, shadow, cutout) + lean | standing preference: centred, constant motion |
| Salgados | pan + drop | lateral travel reads as a counter; things land where they're sold |
| Sweets | pan + drop | same counter, the next case (kept short) |
| Food | grow (O to plate) | the twist: a letter becomes the food |
| Peak | scale push-in + pinned labels | the biggest change of distance on the page |
| Kitchen list | kinetic list | facts set in line by line |
| Close | roll-up wipe + static | holds |

Device families: layered/lean, pan, drop, grow, scale, kinetic list, wipe. No family twice in a row except the two pans, which are split by drops.

## Failure checks (FAILURES.md)
1. **Picture + letter on a side:** no. Every scene is giant type with real food standing on it; only the kitchen list puts a photo beside text, and it grows out of the peak.
2. **Washed beige / blur fill:** no blur anywhere. Neutral off-white ground; maroon at full strength in giant type.
3. **Objects sitting with no relationship:** every pastry stands on a specific letter with a contact shadow, its tag hangs under that letter. The plates *are* the O's. The coxinha at the close stands on the card's edge.
4. **Same label + sentence on every beat:** tags under letters, pinned food labels, a price list, a card. Four forms.
5. **Playful font / novelty mechanic (El Budare):** Playfair Display and Figtree, no cartoon type. The mechanic is type and their own food, not a gadget.
6. **Toggle mid-bar:** toggle in the far corner; the CTA sits before it and docks in the card at the close.
7. **Empty of value:** every scene answers something: real item names and prices, what's on the plate, the kitchen menu with prices, a real review, hours, address, call, ratings.
8. **Cutout never whole:** each cutout checked on white, black and the ground (`lab/check/`). The coxinha (1800x2400 owner photo) is whole with nothing in front. Plates are cut on their fitted ellipse. Risole and mini pudim dropped: neighbours or the frame cut them.
9. **Giant wordmark + cutout hero again:** the coxinha stands *on* the word, not in front of it. No letters are covered.
10. **Blank space holding small UI:** the bottom band always holds real copy; no chips or pills.
11. **Owner of a 900-review bakery would show this?** Their food, their prices, their hours, calm type.

## Fingerprint gate
Grammar (type as the shelf, camera along one line of words) is new. Hero device (cutout standing on the word) is new. Sequence (pan, drops, O-to-plate, push-in, list, close) is new. Signature (letters become plates) is new. Nav (plain bar) matches gochon v2, tardes, el-salvadoreno, cantinho. Close (photo + card) is near cantinho's and gochon's. So it differs on at least 4 of 6 from every row. Length about 10.5 viewport heights, 7 acts (outside the 6-7 acts at 13.6-13.8vh band).
