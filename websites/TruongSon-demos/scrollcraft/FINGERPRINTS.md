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

| pakachi-kitchen (2026-11-24) | Stage choreography (one fixed 2D stage; layers handed scene to scene, page-JS transforms and clip-path only, no opacity fades) | Bar (logo, theme toggle, travelling button) + a gold thread down the right edge, five clickable stops, fills with scroll | Their biryani tray cut from its photo, bleeding in from the bottom right in front of a giant gold PAKACHI; covered letters shimmer; their logo ring turns behind it (same hero device as Delícias, on Son's request) | hero > tray becomes card 1, five dishes dealt into a fan on the ring's arc > peak: the hand doubles, $90 rolls to $130 > wheel turns the hand away, haleem card opens into a band that pans 5 catering trays > gold panel rises (3 steps) > ticket. ~11.5vh, 6 scenes | The gold panel tightens into an order ticket; the hand fans back in behind it, tray first; button lands on the ticket. Holds | The dealt hand that doubles: every card slides a twin out from behind it while the price rolls single $90 to double $130 | Their Facebook photos (2048px), black or white / their logo gold / saffron CTA, Cinzel + Cormorant Garamond + Manrope, two themes | 4510 |

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
- **Fanned hand of dish cards on an arc that doubles** (twins slide out, price rolls) (pakachi-kitchen).
- **Order panel that tightens into a ticket** with the hand reprised behind it (pakachi-kitchen).
- **Right-edge gold thread** nav (pakachi-kitchen).
- **Orbit stage** grammar: a turntable ellipse of photo cards around a centre cutout (sweets-by-carla-g).
- **Wordmark that docks into the bar** and undocks for the close (sweets-by-carla-g).
- **Logo rolling along a bottom rail** nav (sweets-by-carla-g).
- **Turntable spin with rolling names** peak, and the **dive into a detail through an iris** (sweets-by-carla-g).

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
| sweets-by-carla-g (2026-11-24) | Orbit stage (one fixed stage around a vertical axis; layers ride a 3D ellipse; page-JS transforms and clip-path only) | Bar ("Sweets" docks into it at beat 2, theme toggle, travelling button) + their round logo rolls along a thin bottom rail to the current of 5 clickable stops | Their flamingo cake cut along its real edge (board included) in front of a giant brush-script "Sweets"; covered letters bob like piped icing; cake leans to the cursor (same hero device as Delicias and Pakachi, by request) | hero > word docks + cake drops onto a turntable > orbit of 8 custom cakes > peak: one fast turn, theme names roll behind, ends "Yours." > orbit gathers, dive into the sugar hibiscus (iris into macro) > macro closes into treat 1, 3 more served > treats fly into the order card thumbnails. ~12vh, 7 scenes | Hero reassembles: cake rises back, "Sweets" undocks behind it, order card with WhatsApp and a live Google map beside. Holds | The cake turntable: scroll turns the stand and their themed cakes come round; at the peak it spins a full turn while the names roll | Real @sweetsby_carlag photos, blush / script black / hibiscus rose, Great Vibes + Fraunces + Manrope, two themes | 4511 |
| el-budare-cafe (2026-11-25) | Clock stage (one fixed stage; time is the axis: a rolling hour column, one subject at a time, a ticket row keeps what has passed; flat light ground) | Bar ("BudaRe" docks into it, theme toggle, travelling button) + a bottom day bar where a clock chip shows the live hour across 5 clickable stops | Their cachapa de pabellón cut along its real edge, anchored to the screen's right edge, in front of a giant "BudaRe"; covered letters sizzle; leans to the cursor (same hero device as Delicias, Pakachi, Sweets, by standing preference) | hero > word docks, cachapa slides off, clock rolls up > peak: noon to 11 AM, six dishes in and into tickets > "Morning. Still open." > tickets rung into the chip > holidays dealt (3 frames) > fold into storefront + order card. ~15vh, 6 scenes | Storefront photo with the cachapa back in front, word above, order card with WhatsApp, two addresses, 24 hours, live map. Holds | The 24-hour clock: scroll runs a full day and night and the food keeps coming | Real @elbudarecafe photos and reel frames, off-white / logo black / flag red, Lilita One + Bricolage Grotesque, two themes | 4512 |
| gochon (2026-11-25) | Counter catalog (one fixed stage; gallery label schema: name, what it is, price; labels belong to real objects, pointed at the pieces and pinned to printed shelf tags in their footage) | Bar with an index of the objects styled as their white printed shelf tags (Tequeños to Visit), current tag filled red; wordmark left, CTA + toggle in the corner | Their paper tray as a clean plate with the mandoca, papita and tequeño cut out on top; headline left; no giant wordmark | hero > pieces lift and get leader-line labels ("One of each, $5.50") > peak: scrub of their display-case pan with tag-pinned price labels > the pan carries on laterally into three party boxes > push into one box (wholesale) > wipe up into a cheese pull (rating) > storefront + order card. ~10.5vh, 6 scenes | Storefront photo with a solid order card: live open status, hours table, directions, WhatsApp CTA. Holds | Their own shelf tags become the menu: page labels slide out of the printed tags as the case footage pans under the scroll | Real @gochondoral reel frames, off-white / their red / fried-gold CTA, Instrument Sans + Inter, two themes | 4513 |

| gochon v2 (2026-11-25, amends row above, Son's notes) | same grammar | Plain bar: wordmark, animated WhatsApp CTA (light sweep, typing bubble), theme toggle in the corner. No nav: the shelf-tag index and the header timeline were both dropped | Centred: their tray with the three pieces breaking out of the frame and breathing; the five pieces (cutouts) float around it with names and prices; title centred on top | Unbroken, no fades: tray drops away as pieces lift > three floaters fly into the pieces > the counter grows from behind them as they shrink into it > Papitas/Mandocas labels slide onto their shelf tags > pan carries into the boxes > the right box grows into the full box > cheese pull rolls up over it > slides onto the storefront and rolls up. Five cutouts drift through every scene's blank space | same | same | same | 4513 |
| tardes-calenas (2026-11-26) | The pass (one fixed stage; plates are served across it one at a time like a kitchen pass, each stopping centre with name, contents, price; real cut plates with baked contact shadows on a light ground) | Plain bar: red wordmark, animated Reserve on WhatsApp CTA, theme toggle in the corner. No nav | Their Bandeja Paisa centred, breathing, leaning to the cursor, between a split yellow "Tardes" (above left) and "Caleñas" (below right); the covered letters sway | hero > words slide off, plate grows left, leader lines draw to 7 parts (#1, $21.99) > pass: 4 plates glide through with tags > peak: picada drops, every plate that passed returns round it as a table with name+price tags, hold > table opens past the edges, 5 music nights slide in as marker-bar type > nights carry out, bandeja returns beside the card. ~10vh, 6 scenes | Reservation card (WhatsApp, hours, music nights, address, call) beside their bandeja. Holds | The table builds itself: the menu that passed comes back and sets itself round the picada | Their own order-page menu photos (overhead, on wood), off-white / avatar yellow / avatar red, Archivo + Inter, two themes | 4514 |
| el-salvadoreno (2026-11-27) | The comal (one fixed stage; one real pupusa is the thread and changes job each scene: hero, list anchor, multiplier, card edge) | Plain bar: wordmark, gold Order on WhatsApp, motion toggle, theme toggle in the corner. No nav | Headline-led (mirror test): real headline, proof line and CTA readable at paint on the left; their pupusa cutout breathing on the right in front of a still pale "Salvadoreño". No covered letters animating | hero > pupusa travels left beside 11 fillings with prices > peak: shrinks into the centre cell, 24 copies step out into a 5x5 grid, count 1 to 25, real tray wipes open (circle) > tray carries out, 4-plate spread pans in > spread lifts, order builder rises > close card. ~11vh, 6 scenes | Close card: live open status, review quote, where/hours/call/nights, CTA; the pupusa sits on the card's edge. Holds | One becomes twenty-five: the pupusa multiplies into a 5x5 grid while the count rolls, then their real 25-pupusa tray wipes open over it | Their SkyTab studio menu photos, off-white / avatar navy / avatar gold CTA, DM Serif Display + Manrope, two themes, motion toggle | 4515 |
| el-salvadoreno v2 (2026-11-27, retires row above: v1 judged too simple) | The flag (one fixed stage of three bands, blue/white/blue; the bands never leave, they change proportion to frame each scene; type lives in the blue bands, food in the white) | Plain bar: condensed wordmark, animated gold Order on WhatsApp, theme toggle in the corner; text turns white over the blue band. No nav | Their pupusa centred on the white band as the flag's emblem, rim crossing both band edges, breathing and leaning to the cursor, under a full-width "EL SALVADOREÑO" in the top band; covered letters ripple | hero > bands pull back to stripes, pupusa left beside 12 pupusas with prices > peak: bands open, pupusa leads the kitchen across the white band (6 cut plates with tags) while categories and hours run opposite ways in the blue bands > runs hand over to party tray words, 25-pupusa tray opens from the band centre > tray off, flag returns, emblem left, card across the top band edge. ~10vh, 5 scenes | Flag reprise: word scaled into the top band's left, emblem on the white band, order card (open now, review, where/hours/karaoke/call, CTA) straddling the top band's edge; hero lines back in the bottom band. Holds | The flag carries the menu: the white band becomes a moving menu board under the scroll, the blue bands run the categories and the order line in opposite directions | Their SkyTab studio photos cut along fitted plate outlines, off-white / flag blue / gold CTA, Barlow Condensed + DM Serif Display + Manrope, two themes | 4515 |
| cantinho-brasileiro (2026-11-27) | The table (camera distance: one real overhead photo seen from different distances; the hero plate is a detail of it, same pixels) | Plain bar: wordmark, animated yellow Order on WhatsApp, theme toggle in the corner. No nav | Their prato feito (square plate) cut from the table photo, centred and breathing in front of a navy CANTINHO with italic Brasileiro; covered letters sway; leans to the cursor | hero > peak: the photo opens around the plate and the camera pulls back until it is one of six plates; table copy + 4 labels pinned to the food (phone pans the table) > table slides off left uncovering the hot line, 6 real buffet trays pan > feijoada tray grows into their Saturday plate, week of dishes with prices sets in > their sign rolls up, the table slides back in, card with the sign as its header. ~9.5vh, 5 scenes | The table returns full-bleed with the plate home in its spot; order card on the right with their green shop sign as its header (open status, story, where/hours/delivery/call, CTA). Holds | The pull-back: one plate becomes the whole table | Their DoorDash studio photo + reel frames, off-white / logo navy / logo yellow CTA, Hanken Grotesk + Newsreader italic, two themes | 4516 |
| cardamom (2026-11-28) | The sign (light as the axis: one fixed stage goes from day to night; their real neon sign switches on in their own storefront photo) | Plain bar: green serif wordmark (turns neon at night), animated gold Order on WhatsApp, theme toggle in the corner. No nav | Their Hyderabadi chicken biryani plate centred and breathing over the lower half of one unsplit deep-green "cardamom"; covered letters sway; leans to the cursor | hero > word parts, plate steps into a frame slot beside a 9-row menu with prices > frame grows out of the plate, each dish's reel photo rolls up as its row comes up > peak: last row Irani chai = their storefront, sign off; frame grows, page goes to night, neon switches on letter by letter > dining room grows out of the lit window, services list > word relit in neon with the plate, card. ~9vh, 5 scenes | Hero reprise at night: the word returns in their neon green with the plate in front, order card beside it (rating, where, hours, call, WhatsApp, CTA). Holds | The sign switches on: the page goes to night and their real neon lights letter by letter, flickering | Their IG reel frames + one poster dish, off-white / their green / gold CTA, night #090B09 with neon #7FE05F, Fraunces + Plus Jakarta Sans, two themes | 4518 |
| cb-bakery (2026-11-28) | The counter line (type as the shelf: one line of giant serif words, BAKERY, SALGADOS, SWEETS, FOOD, on one baseline; real pastries stand on the letter tops, names and prices hang under the baseline; the camera travels along the line) | Plain bar: serif CB wordmark, animated gold Order on WhatsApp, theme toggle in the corner. No nav | Their coxinha standing on top of a maroon BAKERY (on the word, not in front of it), centred, breathing, leaning to the cursor; the letters under it give a little | hero > pan, the coxinha hops onto SALGADOS' G, 3 salgados drop onto their letters with prices > pan, 3 sweets drop onto SWEETS > pan, the O's of FOOD grow into two lunch plates > peak: push into the chicken plate until it fills the screen, 4 labels pin > plate steps aside, kitchen list with prices + review > room rolls up from the plate's spot, card. ~10.5vh, 7 scenes | Their room photo beside the order card (open status, hours, where, call, ratings, CTA); the coxinha stands on the card's top edge. Holds | The O's in FOOD are their lunch plates, then the page pushes into one | Their Google owner photos, DoorDash header and Uber Eats menu photos cut along their edges (plates on fitted ellipses), off-white / logo maroon / logo gold CTA, Playfair Display + Figtree, two themes | 4517 |

- **Counter catalog** grammar: labels pinned to real objects and to printed tags tracked in footage (gochon).
- **Shelf-tag index** nav in the bar (gochon).
- **Tag-tracked labels over a scrubbed pan** as the peak (gochon).
- **Pieces that drift through every scene's blank space** and hand-offs where the next frame grows out of an object in the last one (gochon v2).
- **The pass** grammar: plates served one at a time across a fixed stage, then gathered into a table (tardes-calenas).
- **Menu gathers into a table** as the peak (tardes-calenas).
- **The comal** grammar: one object as the thread that changes job every scene (el-salvadoreno).
- **Multiply into the real product** peak: copies step out into a grid while a count rolls, then the real photo wipes over it (el-salvadoreno).
- **In-page order builder** that writes the WhatsApp message (el-salvadoreno).
- **The flag** grammar: three national-flag bands as the stage, changing proportion per scene (el-salvadoreno v2).
- **Dish as the flag's emblem** hero (el-salvadoreno v2).
- **Moving menu board**: the white band carries the plates while the blue bands run text in opposite directions (el-salvadoreno v2).
- **The table** grammar: one real overhead photo at different camera distances; the hero cutout is the same pixels as its spot in the photo (cantinho-brasileiro).
- **Pull-back** peak: the photo opens around the hero plate and the stage dollies out to the whole table (cantinho-brasileiro).
- **Tablecloth reveal**: the full-bleed photo slides off and uncovers the next scene laid out beneath it (cantinho-brasileiro).
- **The sign** grammar: light as the axis, the page goes from day to night (cardamom).
- **Neon switch-on** peak: the client's real sign lit letter by letter over an "off" copy of the same photo (cardamom).
- **Menu frame grown from the hero cutout**, photos rolling up per row (cardamom).
- **The counter line** grammar: giant words as the shelf, real cutouts standing on the letter tops, tags under the baseline (cb-bakery).
- **Letters become the food**: the O's of FOOD grow into plates, then the page pushes into one (cb-bakery).
