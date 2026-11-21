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

**Espresso Vivace** is the primary demo and the reference style for new sites (Son, 2026-11-20: "the best site I've built").

- Live: https://nguyenlieu12379.github.io/truongson-OS/espresso-vivace/
- Folder: `websites/TruongSon-demos/scrollcraft/builds/espresso-vivace/` (its README lists sources and what to update each season)
- The style: short and practical. Hero with live open-now status and Order, then menu, locations with storefront photo and maps, ordering. Looping pour video, vector logo, subtle appear-on-scroll. Facts only from the business's own site or listings; no invented prices.

## Sites

| Owner | Site | Status | Path |
| --- | --- | --- | --- |
| TruongSon-demos | **Espresso Vivace (primary demo)**, practical cafe concept (menu, live open-now, maps, ordering) | Live at https://nguyenlieu12379.github.io/truongson-OS/espresso-vivace/ | `websites/TruongSon-demos/scrollcraft/builds/espresso-vivace/` |

Scroll-craft builds live in `websites/TruongSon-demos/scrollcraft/builds/` (set by `.scrollcraft.json`), next to the skill's `FINGERPRINTS.md` registry.

## Template for new F&B sites

`websites/templates/fnb-practical/` turns one data file into a site in the Espresso Vivace style. Steps, schema and checks: its `README.md`. Start every new F&B prospect site there.

## Add a site

Create `websites/<owner>/<site-name>/`, add a row above, and give the site its own README.

Deploys: `.github/workflows/deploy-pages.yml` builds GitHub Pages from `main`. Add a copy step there to publish another site.
