# Film site template

The scroll website for 3d-walkthrough. The background is the rendered Blender film: scroll down plays it forward, scroll up plays it back. Example build: `websites/TruongSon-demos/coastal-cottage/`.

- `index.html`: nav, loader, and one `<section class="panel">` per beat. Replace the example copy. `data-in` / `data-out` = 0 to 1 of the film.
- `assets/beats.js`: frame count, frame folders, scroll length, background colour. Edit per site.
- `assets/film.js`: the engine (frame loading, pinned canvas, blend between frames, panels, progress line, reduced motion). Copy as is. If a feature is missing, add it here so the next build gets it.
- `assets/style.css`: set `--accent` and the fonts from the brand.
- `frames/`: not in the template. Make it with `scripts/make_frames.sh`.
