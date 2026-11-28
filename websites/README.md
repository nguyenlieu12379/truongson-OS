# Websites

Every website project lives in its own folder, named after its owner:

```
websites/
  <owner>/
    <site-name>/
      README.md    # what it is, how to edit, how to deploy
      index.html
      assets/
```

## Sites

Ranked S, A, B, C by Son and Truong (2026-11-27). The rank replaces the old Best, Normal and Failures tiers, and the same rank is the lead's status in `prospects/leads.csv` (`built-S`, `built-A`, `built-B`, `built-C`). No primary demo; pick the one that fits the prospect, highest rank first.

### S

The reference set: start a new build from what these do (centred moving hero, unbroken hand-offs, real cutouts).

| # | About | WhatsApp | Status | Path |
| --- | --- | --- | --- | --- |
| 1 | 1. **Gochón**<br>2. Doral, FL<br>3. Venezuelan pasapalos (tequeños, empanadas, pastelitos) by the piece or the party box | [(786) 670-5020](https://wa.me/17866705020) (phone 305-631-2248) | Live (noindex) at https://nguyenlieu12379.github.io/truongson-OS/gochon/ | `websites/TruongSon-demos/scrollcraft/builds/gochon/` |
| 2 | 1. **Brazilian Taste**<br>2. Dallas, TX<br>3. Brazilian premade meals for the week | [(682) 862-9545](https://wa.me/16828629545) | Live (noindex) at https://nguyenlieu12379.github.io/truongson-OS/brazilian-taste/ | `websites/TruongSon-demos/scrollcraft/builds/brazilian-taste/` |
| 3 | 1. **Pakachi Kitchen**<br>2. Herndon, VA<br>3. Pakistani halal home cooking, a weekly 6-dish deal | [(571) 341-0009](https://wa.me/15713410009) (same number for call/text) | Live (noindex) at https://nguyenlieu12379.github.io/truongson-OS/pakachi-kitchen/ | `websites/TruongSon-demos/scrollcraft/builds/pakachi-kitchen/` |
| 4 | 1. **Tardes Caleñas**<br>2. Hollywood, FL<br>3. Colombian bar and restaurant, kitchen open until 4AM, salsa nights | [(954) 940-2515](https://wa.me/19549402515) (reservations; landline 954-391-7542) | Live (noindex) at https://nguyenlieu12379.github.io/truongson-OS/tardes-calenas/ | `websites/TruongSon-demos/scrollcraft/builds/tardes-calenas/` |
| 5 | 1. **Cantinho Brasileiro**<br>2. Philadelphia, PA<br>3. Brazilian comida mineira, self-service lunch, feijoada Saturdays, marmita delivery | [(302) 569-7265](https://wa.me/13025697265) (phone 215-745-1381) | Live (noindex) at https://nguyenlieu12379.github.io/truongson-OS/cantinho-brasileiro/ | `websites/TruongSon-demos/scrollcraft/builds/cantinho-brasileiro/` |
| 6 | 1. **CB Bakery**<br>2. Worcester, MA<br>3. Brazilian bakery and restaurant: salgados, sweets, lunch plates, open 5am | [(508) 410-9302](https://wa.me/15084109302) (call to order 508-792-9333) | Live (noindex) at https://nguyenlieu12379.github.io/truongson-OS/cb-bakery/ | `websites/TruongSon-demos/scrollcraft/builds/cb-bakery/` |

### A

Strong and live, one step below S.

| # | About | WhatsApp | Status | Path |
| --- | --- | --- | --- | --- |
| 1 | 1. **Sweets by Carla G**<br>2. Homestead, FL<br>3. Custom celebration cakes | [(305) 399-1386](https://wa.me/13053991386) | Live (noindex) at https://nguyenlieu12379.github.io/truongson-OS/sweets-by-carla-g/ | `websites/TruongSon-demos/scrollcraft/builds/sweets-by-carla-g/` |
| 2 | 1. **El Salvadoreño Restaurant & Grill**<br>2. Kendall, Miami, FL<br>3. Salvadoran pupusas, grill, breakfast, party trays | [(786) 606-1159](https://wa.me/17866061159) (phone 305-271-3101) | Live (noindex) at https://nguyenlieu12379.github.io/truongson-OS/el-salvadoreno/ (v2, the flag) | `websites/TruongSon-demos/scrollcraft/builds/el-salvadoreno/` |

### B

Approved and live, but not the bar to aim for.

| # | About | WhatsApp | Status | Path |
| --- | --- | --- | --- | --- |
| 1 | 1. **Espresso Vivace**<br>2. Seattle, WA<br>3. Espresso and latte art | None (concept demo, not a WhatsApp business) | Live at https://nguyenlieu12379.github.io/truongson-OS/espresso-vivace/ | `websites/TruongSon-demos/scrollcraft/builds/espresso-vivace/` |
| 2 | 1. **Delícias Cake & Bakery**<br>2. Burlington, MA<br>3. Brazilian custom cakes and breakfast | [(781) 365-0181](https://wa.me/17813650181) (used on the site, from their Instagram graphics). Their research also lists (781) 661-8417: to confirm | Live (noindex) at https://nguyenlieu12379.github.io/truongson-OS/delicias-cake/ | `websites/TruongSon-demos/scrollcraft/builds/delicias-cake/` |

### C

Marked failed by Son or Truong. Kept offline as examples of what not to do; never deployed. Full reasons in `.claude/skills/site-building/FAILURES.md`.

| # | About | Why it ranks C | Status | Path |
| --- | --- | --- | --- | --- |
| 1 | 1. **Brazilian Passion Foods**<br>2. Orlando, FL<br>3. Pastéis from a food truck | "Looks AI slop": picture plus a text column for the whole page, washed beige colours, layers stacked with no relationship. v1 also used drawn plastic props | Offline | `websites/TruongSon-demos/scrollcraft/builds/brazilian-passion-foods/` |
| 2 | 1. **El Budare Café**<br>2. Jackson Heights, Queens, NY<br>3. Venezuelan arepas and cachapas, open 24 hours | "Not serious and slops": playful font and colour, toggle stranded mid-bar, motion with no real value, a cutout missing part of the dish | Offline | `websites/TruongSon-demos/scrollcraft/builds/el-budare-cafe/` |

Scroll-craft builds live in `websites/TruongSon-demos/scrollcraft/builds/` (set by `.scrollcraft.json`), next to the skill's `FINGERPRINTS.md` registry.

## New F&B client sites

Build each one with the site-building skill (`/site-building`: pre-build, then scroll-craft), with its own vibe from that business's brand, photos and story. Don't copy layout, code or style from another client's site, Vivace included: what fits one business may not fit the next.

## Must-haves on every client site

Son, 2026-11-22. Check all four before a client sees the site.

- [ ] **One engineered peak.** A feeling curve (one emotion per section) with one "remember this" moment. It gets the most scroll room, the biggest asset budget and a quieter section before it.
- [ ] **Layered hero.** Background, subject, foreground and atmosphere planes that move at different rates, with real cutouts and overlap. A flat photo with fading text does not pass. See `.claude/skills/site-building/references/hero-depth.md`.
- [ ] **Real photos by default.** The client's own food and space first. Generate only to fill gaps, with one shared style prompt. No clay or low-poly look. Plan clean-background shots so the hero can be cut into layers.
- [ ] **No AI tells.** None of these: scroll cue or arrow, `01 / 06` counters, an eyebrow on every heading, em dashes, centred copy in every section, gradient text or neon glow, invented stats, a full-frame dark overlay for contrast, an ending that fades into a footer.

## Add a site

Create `websites/<owner>/<site-name>/` and give the site its own README. Add it to the Sites table only once Son or Truong approve it.

Deploys: `.github/workflows/deploy-pages.yml` builds GitHub Pages from `main`. Add a copy step there to publish another site.
