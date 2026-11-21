# Rutt's Hut: brief

**Self-authored under explicit creative delegation.** Request (2026-11-21): "Find an f&b brand that have terrible website and build website for them using scroll-craft. Full auto, find related inputs on the web." No interview. Every answer below is an authored decision, built on the research in "Evidence".

## Why this business

Rutt's Hut, 417 River Road, Clifton, NJ. Deep-fried hot dog stand opened in 1928. Their site (ruttshut.com, checked 2026-11-21):

- Mobile: the round logo sits on top of the menu button. The first screen is a blurry hot dog photo with nothing to read.
- Desktop: the "Established 1928, Clifton, NJ" line is covered by the Order Online button.
- No hours, address or phone anywhere on the home page. The contact form shows "Please go back and check form" before anyone types.
- Footer stuck at "Copyright © 2019".
- The best story they have (four ways to order the same dog, named by how long it fries) isn't on the site at all.

## Evidence (what is real)

| Fact | Source |
|---|---|
| Opened 1928 as a roadside stand by Royal "Abe" Rutt and Anna Rutt | Wikipedia; their own site says 1928 |
| Sold in late 1974 to the current owners | Wikipedia |
| Building split in two: restaurant and bar, take-out counter | Wikipedia; Commons/Flickr photos of both doors |
| Frying makes the casing crack and split, hence "Rippers" | Their own site |
| In-and-Outer: only in the oil briefly. Weller: well-done. Cremator: charred black | Wikipedia; cooksinfo.com |
| Dogs sink when dropped in, float when they reach in-and-outer | cooksinfo.com (search summary) |
| Relish: secret blend of mustard and spices (their words); pickle relish, mustard and cabbage (Wikipedia) | Their site; Wikipedia |
| Menu items used: Hot Dog, Hot Dog Platter with Potato Salad and Cole Slaw, French Fries with Gravy, Onion Rings | ruttshut.com/menu (no prices shown, none used) |
| PBS "A Hot Dog Program"; "1,000 Places to See in the USA and Canada Before You Die" | Their own site |
| Address 417 River Rd, Clifton, NJ 07014. Phone (973) 779-8615 | Yelp, Tripadvisor, Restaurantji |
| Hours 8am to 10pm Sun to Thu, 8am to 11pm Fri and Sat | Restaurantji + menu aggregator. **Not from Rutt's. Confirm before pitching.** |
| Online ordering: order.online/business/Ruttshut-16988327 | The Order Online button on their own site |

No invented numbers, prices, quotes or reviews.

## The eight topics (authored)

1. **Vibe:** loud, greasy, Jersey roadside, 1928 and proud of it. References: the enamel box letters on their own rooftop sign; a diner order ticket on a spike; a fry cook calling numbers.
2. **Journey:** see the sign on the roof. Learn what a Ripper is. Two doors (counter, bar). Pick how long it fries. The relish. The sides. Since 1928. Order.
3. **Energy curve:** loud open, fast cuts, one quiet beat, the fryer (peak), fast again, abrupt loud end.
4. **Feeling:** see the curve below. The one moment: watching the dog crack open in the oil as you scroll.
5. **What no other site does:** scrolling fries the hot dog. You pick the doneness you want, and that becomes your order.
6. **Range:** Retro, specifically mid-century roadside: enamel white, sky cobalt, relish mustard, fryer black. Loud type. Not premium-minimal.
7. **One world or scenes:** distinct scenes, hard cuts.
8. **Assets:** no client assets. Real photos of the place under CC BY / CC BY-SA (Ken Lund, tweber1, William J Sisti on Flickr/Commons). No generation, no spend.

## Grammar: Rhythmic cutlist

A take-out counter is a rhythm: order, drop, pull, next. Short hard cuts fit the place. Why not the others:

- Filmic one-shot: nothing about a hot dog stand is a slow continuous film.
- Chaptered editorial: taken by Vivace; also too polite for this place.
- Live surface: not software.
- Continuous world: no journey through geography, and not enough photos for one.
- Typographic poster: close second (type does a lot here), but they have real food and a real sign, which beat type alone.
- Gallery / catalog: the menu is long, but nobody comes for the menu. They come for one dog.
- Split stage: no two-sided argument.
- Route line: taken by Tōv.

**Peak in the chrome.** The cutlist bans pin and dwell, so the fryer holds in the fixed bar layer, driven by page scroll, while the four cuts under it keep moving.

**One deliberate exception.** The hero planes move at different rates on the hero's exit (page JS, not `data-sc-parallax`). The standing hero-depth preference outranks the grammar's parallax ban for the hero only. No parallax anywhere else.

## Journey

1. Recognition: that sign on River Road.
2. Definition: what a Ripper is, in one line.
3. Place: take-out counter on one side, bar and dining room on the other.
4. Choice: how long it stays in. (peak)
5. Substance: relish, sides.
6. Lineage: 1928, the Rutts, 1974.
7. Commitment: your order, the address, order online.

## Feeling curve

| # | Cut | Feeling | Cause |
|---|---|---|---|
| 1 | Sign | Recognition | The real rooftop sign; the roof rises and the sign sinks behind it as you scroll |
| 2 | Rip | Appetite | One loud line on mustard: dropped in hot oil until the casing rips |
| 3 | Counter | Familiarity | The take-out counter photo, wiped in |
| 4 | Two doors | Amusement | Bar and dining room is a separate door, right next to it |
| 5 | Quiet | Anticipation | Authored silence: dark ground, one small question |
| 6-9 | The fryer | Delight, then mock horror | The bar unfurls into a fryer. Scroll drops the dog in, it floats, cracks open, browns, then chars black |
| 10 | Relish | Craving | The relish line and the real Rippers-with-rings photo |
| 11 | Sides | Comfort | Gravy fries and the platter, side by side |
| 12 | 1928 | Respect | The building, the Rutts, 1974 |
| 13 | Order | Resolve | Full-bleed mustard: your doneness, set huge, Order online |

**Peak:** "you scroll and the hot dog actually fries, the skin rips, and if you keep going it burns." Lives in cuts 6 to 9 (4 viewport-heights, the largest run on the page).

**Silence:** cut 5 is meant to be mostly empty. It is not dead scroll.

**Tell-someone:** "It's the site where you fry the hot dog yourself, watch the skin rip, and pick how done you want it. That's your order at the end."

(First version auto-ordered wherever you stopped scrolling. Dropped on verification: everybody's last stop is Cremator, so it ordered Cremator for nearly everyone.)

## Layer contract (hero)

| Plane | Asset | Movement on exit | Rule |
|---|---|---|---|
| Sky | CSS gradient matched to the photo's sky | Slowest | Clean plate, so no duplicate sign |
| Headline "RIPPERS" | Real `<h1>` text | Medium | Sits behind the sign: the sign covers part of the last letters, the word stays readable |
| Sign + lattice | Keyed cutout from Ken Lund's photo | Sinks slightly | Legs always hidden behind the roof line |
| Roof, dish, vents | Keyed cutout, same photo | Rises fastest (nearest) | Solid to the bottom edge, fades into the next ground |
| Small copy + Order online | HTML | Normal scroll | Always readable |

Opening: sign on the roof against blue sky, RIPPERS behind it. Midpoint: roof climbs, sign sinks, word slides. Exit: hard cut to mustard.

Mobile: plane scaled to 58vh tall and cropped on the sign; RIPPERS above the sign rather than behind it.

## Score

| Cut | Device | Why |
|---|---|---|
| Sign | bespoke layered planes (hero) | Depth from the real sign and roof |
| Rip | flow + kinetic (words) | One loud line landing |
| Counter | flow + reveal (left) | A door opening onto the room |
| Two doors | flow + in | Quick fact, quick cut |
| Quiet | flow, one cue | Silence before the peak |
| Fryer x4 | bespoke fixed chrome + flow + in under it | The peak, held in the bar |
| Relish | flow + reveal (iris, once) | The thing that makes it Rutt's |
| Sides | flow + in, two photos | Fast |
| 1928 | flow + reveal (up) | History, plain |
| Order | flow, hold | Abrupt, full bleed, resolves |

13 sections, about 12.8 viewport-heights, no pinned acts.
