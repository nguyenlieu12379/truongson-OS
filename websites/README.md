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
| TruongSon-demos | Espresso Vivace, practical cafe concept (menu, live open-now, maps, ordering) | Live at https://nguyenlieu12379.github.io/truongson-OS/espresso-vivace/ | `websites/TruongSon-demos/scrollcraft/builds/espresso-vivace/` |

Scroll-craft builds live in `websites/TruongSon-demos/scrollcraft/builds/` (set by `.scrollcraft.json`), next to the skill's `FINGERPRINTS.md` registry.

## Add a site

Create `websites/<owner>/<site-name>/`, add a row above, and give the site its own README.

Deploys: `.github/workflows/deploy-pages.yml` builds GitHub Pages from `main`. Add a copy step there to publish another site.
