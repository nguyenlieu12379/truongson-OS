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
