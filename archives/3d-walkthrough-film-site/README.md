# 3d-walkthrough: film-playback site (archived)

Archived 2026-11-15. The skill now builds a live 3D site with baked lighting. This was the previous method: render the Blender film, then play its frames as you scroll.

Why it was dropped: weight and smoothness. At 24 fps the frames are 17 to 29 MB and very slow scrolls show blended steps. At 90 fps they'd be about 110 MB plus a 13 to 18 hour render. Baked live 3D is smooth at any speed in about 5 to 15 MB.

- `template/`: the film site (`film.js` engine, panels, loader). Smoothness fixes are in its header comment.
- `scripts/make_frames.sh`: PNG frames to WebP desktop and phone sets.
- `scripts/shoot.cjs`: screenshots for the film site.
- `references/film-site.md`: how it works.
- Live example (until it's replaced): `websites/TruongSon-demos/coastal-cottage/`.
