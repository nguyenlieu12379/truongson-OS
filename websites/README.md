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

| Owner | Site | Status | Path |
| --- | --- | --- | --- |
| TruongSon-demos | Forno Notte, 3D scroll pizzeria demo | Live at https://nguyenlieu12379.github.io/truongson-OS/forno-notte/ | `websites/TruongSon-demos/forno-notte/` |
| TruongSon-demos | Coastal Cottage, baked live-3D walkthrough (golden hour) | Live at https://nguyenlieu12379.github.io/truongson-OS/coastal-cottage/ (after merge) | `websites/TruongSon-demos/coastal-cottage/` |
| TruongSon-demos | Corner Crema, walkthrough mockup (clay clips, queued playback); reference for `/3d-walkthrough` step 7 | Not published | `websites/TruongSon-demos/corner-crema-mockup/` |
| TruongSon-demos | Espresso Vivace, scroll-craft editorial concept (real Commons photos, scroll-poured rosetta) | Not published | `websites/TruongSon-demos/scrollcraft/builds/espresso-vivace/` |

Scroll-craft builds live in `websites/TruongSon-demos/scrollcraft/builds/` (set by `.scrollcraft.json`), next to the skill's `FINGERPRINTS.md` registry.

## Add a site

Create `websites/<owner>/<site-name>/`, add a row above, and give the site its own README.

Deploys: `.github/workflows/deploy-pages.yml` builds GitHub Pages from `main`. Add a copy step there to publish another site.
