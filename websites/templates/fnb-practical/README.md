# F&B practical site template

The Espresso Vivace demo, turned into a template. One data file per business, one command, one static site in the same style: live open-now status, menu with a demo cart, locations with maps, ordering.

Built from the live Vivace site and proven equal to it: building `examples/espresso-vivace.json` gives a page that is pixel-identical to https://nguyenlieu12379.github.io/truongson-OS/espresso-vivace/ and passes the same cart tests.

## Make a new site (about 1 to 2 hours, most of it research)

1. **Pick the prospect.** Independent cafe, bakery or bar with a weak or missing website.
2. **Collect facts from their own sources only.** Hours, holiday hours, addresses, phone numbers: their website first, then their Google listing. Drink list: their menu or delivery listing (Grubhub, DoorDash, Toast). Ordering links: whatever they really use. Write down where each fact came from and the date.
   - No prices unless current and from them. No invented drinks, awards or quotes.
3. **Get images with a license.** Photos of the place: Wikimedia Commons (CC BY / CC BY-SA, credit the author) or their own (for a pitch). Hero video: Mixkit (free license). Note each one for `credits`.
4. **Logo.** Find their logo (sign, menu, Instagram). Trace it to vector with `tools/trace_logo.py` (read the header first). Use the biggest source image you can find.
5. **Fill the data.** Copy `examples/_starter.json` to `websites/TruongSon-demos/<slug>/site.json` and replace every `TODO`. `examples/espresso-vivace.json` is a complete worked example.
   - `week`: Sunday to Saturday, `"07:00-15:00"` or `"closed"`.
   - `holidays`: optional rows, each with a date, a label and hours per location id.
   - `options.milkDrinks`, `pairs` (hot name, iced name), `noSize`: control which choices the add-to-cart panel shows.
6. **Put assets** in `websites/TruongSon-demos/<slug>/assets/` (WebP photos about 1600px wide, `logo.svg`, optional video plus poster).
7. **Build:**

   ```bash
   node websites/templates/fnb-practical/build.mjs websites/TruongSon-demos/<slug>/site.json websites/TruongSon-demos/<slug>
   ```

   It lists any asset the data points at that is missing.
8. **Check it:**

   ```bash
   node .claude/skills/scroll-craft/scripts/serve.mjs --root websites/TruongSon-demos/<slug> --port 4500
   ```

   ```bash
   node websites/templates/fnb-practical/tools/verify.cjs http://localhost:4500/ /tmp
   ```

   Also look at it on a real phone before showing anyone.
9. **Publish** (when Son or Truong says so): add a copy step for `<slug>` to `.github/workflows/deploy-pages.yml`, add a row to `websites/README.md`, open a PR.

## What the template does

| Part | Detail |
|---|---|
| First screen | Headline, one-line sub, live open-now per location (in the business's time zone, holiday hours included), See the menu. Photo or looping video (`hero.image` or `hero.video`). |
| Header | Logo (36px), name, Menu, Locations/Visit, Order (goes to the menu). |
| Menu | Sections from the data. Every drink is a button: add-to-cart panel with quantity, size, hot/iced, milk, notes. Cart icon with count next to the heading. On phones the sections swipe sideways at about two-thirds width. |
| Cart | Saved in the browser. No prices, no payment: the final button explains ordering isn't connected and lists the real routes and phone numbers. |
| Locations | Optional storefront photo, then a card per location: Google map, hours, address, tap-to-call, directions. Holiday table if `holidays` is set. |
| Order | Cards from the data; `{"type": "phones"}` lists every phone number. |
| Footer | Logo, one true line, demo note and sources, link to `credits.html`. |
| Style | Newsreader + Archivo, colors from `colors`, appear-on-scroll (plain fade when motion is off; all content visible without JS). |

`"demo": true` adds `noindex` and the "Concept demo by TruongSon. Not affiliated" line. Set it to `false` only for a signed client's real site.

## Files

| Path | What |
|---|---|
| `build.mjs` | Data file in, static site out. No dependencies (Node 18+). |
| `template/site.css`, `template/site.js` | Copied into every site. Shared code: fix a bug here, rebuild each site. |
| `examples/espresso-vivace.json` | Full worked example (the live demo). |
| `examples/_starter.json` | Blank to copy. |
| `tools/verify.cjs` | End-to-end check at desktop and phone sizes. Exits non-zero on failure. |
| `tools/trace_logo.py` | Logo image to recolorable vector SVG. |

The live Vivace folder (`websites/TruongSon-demos/scrollcraft/builds/espresso-vivace/`) is still hand-maintained. Rebuilding it from `examples/espresso-vivace.json` gives the same page, so either way works.
