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

Only sites that worked: approved by Son or Truong. No primary demo; pick the one that fits the prospect. Failed builds never go in this table. They are recorded in `.claude/skills/site-building/FAILURES.md` and kept offline (Son, 2026-11-24).

| Owner | Site | Status | Path |
| --- | --- | --- | --- |
| TruongSon-demos | **Espresso Vivace**, practical cafe concept (menu, live open-now, maps, ordering). Its style is Vivace-only | Live at https://nguyenlieu12379.github.io/truongson-OS/espresso-vivace/ | `websites/TruongSon-demos/scrollcraft/builds/espresso-vivace/` |
| TruongSon-demos | **Delícias Cake & Bakery**, Burlington MA prospect. Unbroken pink world: wobbling pudim hero, fly through their front door to the counter | Live (noindex) at https://nguyenlieu12379.github.io/truongson-OS/delicias-cake/ | `websites/TruongSon-demos/scrollcraft/builds/delicias-cake/` |
| TruongSon-demos | **Brazilian Taste**, Dallas TX prospect (meal prep, WhatsApp only). White world: their own wordmark splits open on their bowls, then a 7-day grid fills with their trays | Live (noindex) at https://nguyenlieu12379.github.io/truongson-OS/brazilian-taste/ | `websites/TruongSon-demos/scrollcraft/builds/brazilian-taste/` |
| TruongSon-demos | **Pakachi Kitchen**, Herndon VA prospect (Pakistani halal, weekly 6-dish deal, WhatsApp only). Black or white and gold: their biryani tray over a giant PAKACHI becomes card 1 of a dealt hand that doubles ($90 to $130), then a catering band and an order ticket | Live (noindex) at https://nguyenlieu12379.github.io/truongson-OS/pakachi-kitchen/ | `websites/TruongSon-demos/scrollcraft/builds/pakachi-kitchen/` |

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
