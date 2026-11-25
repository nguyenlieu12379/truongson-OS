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

Three tiers (2026-11-25). No primary demo; pick the one that fits the prospect, best first.

### Best sites

The reference set: start a new build from what these do (centred moving hero, unbroken hand-offs, real cutouts).

| Owner | About | WhatsApp | Status | Path |
| --- | --- | --- | --- | --- |
| TruongSon-demos | **Gochón** · 7868 NW 52nd St, Doral, FL 33166 · Venezuelan pasapalos counter: tequeños, empanadas, pastelitos, papitas, mandocas ($1.50 to $2.00 a piece), party boxes (50 for $38, 100 for $72), frozen pieces wholesale · Mon to Sat 7 AM to 7 PM, Sun 7 AM to 4 PM · orders on WhatsApp, Uber pickup, DoorDash · @gochondoral (45.6K), 4.3 on Google (260 reviews) | [(786) 670-5020](https://wa.me/17866705020) (phone 305-631-2248) | Live (noindex) at https://nguyenlieu12379.github.io/truongson-OS/gochon/ | `websites/TruongSon-demos/scrollcraft/builds/gochon/` |
| TruongSon-demos | **Brazilian Taste** · Dallas, TX · Chef Clécia · Brazilian premade meals (weekly trays, ready to heat), catering, personal chef · orders on WhatsApp · @braziliantastetx | [(682) 862-9545](https://wa.me/16828629545) | Live (noindex) at https://nguyenlieu12379.github.io/truongson-OS/brazilian-taste/ | `websites/TruongSon-demos/scrollcraft/builds/brazilian-taste/` |
| TruongSon-demos | **Pakachi Kitchen LLC** · Herndon, VA 20171 · Pakistani halal home cooking: weekly 6-dish deal ($90 single, $130 double), catering · pickup in Herndon or $5 delivery · orders on WhatsApp or phone · Certified Food Protection Manager | [(571) 341-0009](https://wa.me/15713410009) (same number for call/text) | Live (noindex) at https://nguyenlieu12379.github.io/truongson-OS/pakachi-kitchen/ | `websites/TruongSon-demos/scrollcraft/builds/pakachi-kitchen/` |
| TruongSon-demos | **Sweets by Carla G** · Homestead, FL · home bakery by a certified baker: custom celebration cakes, desserts, cookies, Peruvian alfajores · orders by Instagram DM or WhatsApp · @sweetsby_carlag | [(305) 399-1386](https://wa.me/13053991386) | Live (noindex) at https://nguyenlieu12379.github.io/truongson-OS/sweets-by-carla-g/ | `websites/TruongSon-demos/scrollcraft/builds/sweets-by-carla-g/` |

### Normal sites

Approved and live, but not the bar to aim for.

| Owner | About | WhatsApp | Status | Path |
| --- | --- | --- | --- | --- |
| TruongSon-demos | **Espresso Vivace** · Seattle, WA · espresso bar with two locations (Brix and Alley 24): espresso drinks, beans · orders through Grubhub (Alley 24) or by phone · concept demo, not a prospect | None (concept demo, not a WhatsApp business) | Live at https://nguyenlieu12379.github.io/truongson-OS/espresso-vivace/ | `websites/TruongSon-demos/scrollcraft/builds/espresso-vivace/` |
| TruongSon-demos | **Delícias Cake & Bakery** · 45 Winn St, Burlington, MA 01803 · owner Roseli Reis · Brazilian bakery: custom cakes (birthdays, weddings, showers, corporate), Brazilian breakfast, sandwiches, pão de queijo, fresh juices, sweets · Mon to Sat 6 AM to 10 PM, Sun 7 AM to 5 PM (to confirm) · 4.4 on Google · @deliciascakee | [(781) 365-0181](https://wa.me/17813650181) (used on the site, from their Instagram graphics). Their research also lists (781) 661-8417: to confirm | Live (noindex) at https://nguyenlieu12379.github.io/truongson-OS/delicias-cake/ | `websites/TruongSon-demos/scrollcraft/builds/delicias-cake/` |

### Failures

Marked failed by Son or Truong. Kept offline as examples of what not to do; never deployed. Full reasons in `.claude/skills/site-building/FAILURES.md`.

| Owner | About | Why it failed | Status | Path |
| --- | --- | --- | --- | --- |
| TruongSon-demos | **Brazilian Passion Foods** · Orlando, FL · pastel food truck: pastéis, coxinha, cheese bolinhas, sweets · order ahead for pickup at the truck; catering, events and festivals · WhatsApp (689) 305-0044 · @brazilianpassionfoods | "Looks AI slop": picture plus a text column for the whole page, washed beige colours, layers stacked with no relationship. v1 also used drawn plastic props | Offline | `websites/TruongSon-demos/scrollcraft/builds/brazilian-passion-foods/` |
| TruongSon-demos | **El Budare Café** · Roosevelt Ave, Jackson Heights, Queens, NY · Venezuelan restaurant, two spots: the café ((718) 899-2404) and the arepera at 94-06 Roosevelt Ave, open 24 hours ((718) 255-6695) · arepas, cachapas, pabellón, pepitos, tequeños, holiday pernil and hallacas · orders on WhatsApp · 2,000+ Google reviews | "Not serious and slops": playful font and colour, toggle stranded mid-bar, motion with no real value, a cutout missing part of the dish | Offline | `websites/TruongSon-demos/scrollcraft/builds/el-budare-cafe/` |

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
