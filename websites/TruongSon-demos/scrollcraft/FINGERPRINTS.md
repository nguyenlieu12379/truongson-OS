# Fingerprints

Every site you build with **scroll-craft** gets one row here, appended after it
ships. The registry exists so your next build can prove it is a different page
rather than a re-skin of one you already made.

This file is **yours**. It starts empty on purpose: the gate is about not
repeating *yourself*, so it has nothing to say until you have built something.

The rules and the gate live in the skill's
`references/uniqueness.md`. Short version:

**A new build must differ from EVERY row below on at least 4 of the 6
dimensions.** Four against each row individually, not four on average across the
table. If a planned build fails, change the plan. Never edit a row to make room
for it.

The six dimensions are: **grammar**, **nav treatment**, **hero device**,
**act-sequence shape**, **close pattern**, **signature move**.

Dimension 6 is free, because a signature move is unique by definition. So the
gate really asks for three more out of the remaining five, and a build that
changes only grammar and world will fail it.

---

## The registry

| Build | Grammar | Nav treatment | Hero device | Act-sequence shape | Close pattern | Signature move | World | Port |
|---|---|---|---|---|---|---|---|---|
| espresso-vivace (2026-11-20) | Chaptered editorial | Fixed folio band: wordmark left, roman chapter + title right, band takes the chapter ground colour | Title page: type only on paper, no media above the fold | flow(title) > flow+reveal > flow+parallax column > flow intertitle (authored silence) > pin 3.0 (bespoke) > flow iris reveal > flow+parallax on yellow > count (outside acts) > flow colophon. 9 sections, ~11.2vh, 5 engine acts | Colophon: two addresses as plain text with Directions links, sign photo, demo note + photo credits. CTA is running text, no button | Scroll-poured latte-art rosetta (SVG, page JS) that wipes into a real photo of the same drink | Real Commons photography, paper / dark / poster-wall yellow grounds, Newsreader + Archivo, Vivace red | 4500 |
| espresso-vivace v2 (2026-11-20, amends row above) | same | same | same | Peak changed: pin 3.0 bespoke SVG became scrub 2.8 (real pour clip in the editorial media column). ~11vh | same | Real pour scrubbed by hand, resolved by an iris wipe to the cafe's own latte (kit scrub + bespoke pairing; SVG rosetta retired) | same + one Mixkit clip | 4500 |
| espresso-vivace v3 (2026-11-20, retires rows above) | Not a scroll-craft page anymore: practical cafe site (menu, open-now, maps, order) | Sticky bar: wordmark, Menu, Locations, Order pill | Headline + live open-now status + Order button + photo | Static sections, no acts | Order cards | None (open-now status is a utility, not a signature) | Paper, Vivace red | 4500 |
| delicias-cake (2026-11-23) | Continuous world (bespoke stills variant: one fixed stage, page-JS camera along z, photo planes, no video legs) | Route map: floating pink pill of 7 clickable places (Pudim to Counter), current place filled; dots + current label on phones. Wordmark top-left, Order pill top-right | Real pudim cutout (SVG clip on their photo) one layer in front of a giant "Delícias", glow plane behind, sprinkle foreground; covered letters wobble | Worldflight-style track: hero > sweets > morning > parties > authored silence (address + far door) > peak: fly through the storefront into the shop > counter. 7 places, ~10.3vh, one pace | Arrival inside the shop (blurred display case), the same pudim waiting on the counter, card with hours, WhatsApp order, call, directions. Holds | Jelly pudim: scroll speed kicks a spring that wobbles the real pudim and the letters it covers; tap to poke | Real @deliciascakee photos, soft pink / cocoa / hot pink, Bricolage Grotesque + Outfit, playful | 4501 |


---

## What is taken

Add a bullet here whenever a build claims something a later build should avoid
reusing: a grammar, a nav treatment, a close pattern, a signature move, an
act-count-and-length band. The shared columns are what the next build inherits
as a constraint, so writing them down is the whole point.

Nothing is taken yet.


- **Chaptered editorial** with roman folios and a ground-coloured folio band (espresso-vivace).
- **Title page with no media** as the hero (espresso-vivace).
- **Draw-then-reveal-the-real-photo** peak: an illustration completed by scroll, then wiped to the photograph (espresso-vivace).
- **Colophon close with addresses as running text** (espresso-vivace).
- **Continuous world on stills** with a page-JS z-camera and a clickable route pill (delicias-cake).
- **Product cutout in front of a giant wordmark with covered letters animating** as the hero (delicias-cake).
- **Fly-through-the-storefront** peak into an arrival screen (delicias-cake).
- **Jelly wobble** driven by scroll velocity (delicias-cake).

---

## Appending a row

After shipping, add one line to the table and one bullet to **What is taken** if
the build claimed something new. Fill every column. Say what the build shares
with existing rows.

Rows are append-only. A build that has been superseded stays in the table,
because the space it occupies is still occupied.

---

## Worked example

The skill's author kept a registry of twelve builds across eight page grammars.
If you want to see what a filled-in table looks like, and which shapes tend to
collide, read `EXAMPLES.md` in the scroll-craft repository. Treat it as
illustration only: those rows are somebody else's builds and they do **not**
constrain yours.
| brazilian-passion-foods (2026-11-23) | Scene sequence (separate acts, no shared world): poster scenes in the truck's own colours | Plain fixed bar: br foods mark left, theme toggle + Order pill right. No chapter or route UI | Giant "PASTEL" in wrap yellow on truck green; scroll takes seeded bites out of the word and the real truck shows through; pastel photo as a white-bordered sticker in front | pin 2.2 (bites) > flow+parallax (truck) > peak pin 3.6 (fryer) > pan (menu, length fitted to overflow) > flow kinetic flip board (stops) > static close. 6 acts, ~10vh desktop | Booking card beside the truck-side photo: catering/events/festivals, WhatsApp CTA, call link. Holds | Scroll is the fryer: pale dough sinks into oil, bubbles boil with heat, turns golden, lifts out, cut photo cracks open from the middle | Real @brazilianpassionfoods photos (truck) + pastel crops from their flyers, green/yellow/cream, Bowlby One + DM Sans | 4502 |
| brazilian-passion-foods v2 (2026-11-23, retires row above) | Continuous world, footage variant: one fixed stage, the scroll scrubs one real phone clip (172 frames) with crossfades into full-res stills | Bottom timeline bar: thin progress line + 6 jump labels (Fryer to Order). Wordmark left, Order pill right | Full-res photo of their three pastéis in the fryer basket in a 9:16 reel panel, headline left, footage colour spread soft behind (no drawn layers) | basket still > scrub (fryer, filling, oil, out) > hold + loupe (peak) > scrub > sweet still > truck still > order. One stage, 11.5vh | Order card over their truck photo: WhatsApp, call, catering. Holds | Scroll plays their own kitchen clip; at the peak it stops on the full-res photo and a glass loupe magnifies the crust under the cursor (drifts with scroll on touch) | Real @brazilianpassionfoods reel frames, warm off-white / green-black, Schibsted Grotesk + Inter, brand colour as accent only | 4502 |
