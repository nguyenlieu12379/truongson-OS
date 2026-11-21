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

## Primary demo

**Espresso Vivace** is the primary demo we show prospects (Son, 2026-11-20: "the best site I've built"). Its style belongs to Vivace only: don't copy it to other sites.

- Live: https://nguyenlieu12379.github.io/truongson-OS/espresso-vivace/
- Folder: `websites/TruongSon-demos/scrollcraft/builds/espresso-vivace/` (its README lists sources and what to update each season)
- Its style (Vivace only): short and practical. Hero with live open-now status and Order, then menu, locations with storefront photo and maps, ordering. Looping pour video, vector logo, subtle appear-on-scroll. Facts only from the business's own site or listings; no invented prices.

## Sites

| Owner | Site | Status | Path |
| --- | --- | --- | --- |
| TruongSon-demos | **Espresso Vivace (primary demo)**, practical cafe concept (menu, live open-now, maps, ordering) | Live at https://nguyenlieu12379.github.io/truongson-OS/espresso-vivace/ | `websites/TruongSon-demos/scrollcraft/builds/espresso-vivace/` |
| TruongSon-demos | Tōv Coffee, Portland. Egyptian coffee shop with no website (scroll-craft build) | In progress | `websites/TruongSon-demos/scrollcraft/builds/tov-coffee/` |

Scroll-craft builds live in `websites/TruongSon-demos/scrollcraft/builds/` (set by `.scrollcraft.json`), next to the skill's `FINGERPRINTS.md` registry.

## New F&B client sites

Build each one with scroll-craft (`/scroll-craft`), with its own vibe from that business's brand, photos and story. Don't copy layout, code or style from another client's site, Vivace included: what fits one business may not fit the next.

## Add a site

Create `websites/<owner>/<site-name>/`, add a row above, and give the site its own README.

Deploys: `.github/workflows/deploy-pages.yml` builds GitHub Pages from `main`. Add a copy step there to publish another site.
