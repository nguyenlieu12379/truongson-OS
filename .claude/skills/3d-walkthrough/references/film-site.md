# Film site

How the website is built from the rendered film. Template: `assets/film-site/`. Example: `websites/TruongSon-demos/coastal-cottage/`.

## Why film, not live 3D

A browser loads a `.glb`, which only keeps plain colours and image textures. Blender's designed materials are recipes computed at render time, and Cycles traces real light (bounce, glow, reflections). Neither survives the export. The film frames look exactly like the render, and a phone only has to show images.

## Make the frames

Keep Blender's PNG frames from the full render, then:

```bash
.claude/skills/3d-walkthrough/scripts/make_frames.sh <png_dir> websites/<owner>/<site> 2
```

- Every 2nd frame (step 2): 520 frames from a 1,040-frame film. The engine blends neighbouring frames, so scrubbing stays smooth.
- Desktop set 1280 wide (WebP q72, about 25 KB a frame, about 15 MB). Phone set 854 wide (q70, about 8 MB).
- Put the printed frame count in `assets/beats.js`.

## Panels

- One panel per beat. Take the ranges from the film's beat sheet (frame / total frames).
- Leave gaps between panels so the film plays on its own for a moment.
- Never cover the hero view. Check the end shot at the last frames too: the camera keeps moving, so the hero (the sun, a counter) can drift under the text.
- `center` panels get a soft dark backdrop. `left` / `right` sit low, over the bottom shade.
- The last panel's `data-out` goes past 1 so it stays at the end.

## How the engine plays it

- Frames load coarse first (1 in 32, then 16, 8, 4, 2, 1). The loader hides after the 1-in-16 pass. Missing frames fall back to the nearest loaded one.
- The canvas is pinned. Scroll progress picks the frame, followed by a short critically damped spring (85 ms) so wheel steps don't stutter. Reduced motion follows exactly, with no panel slide.
- Landscape screens cover. Portrait screens show the 16:9 film large in the upper part, with the panels on the background colour below.
- Phones, save-data and 2G connections get the phone set.
- Only `transform` and `opacity` animate on panels and bars.

## Check

```bash
node .claude/skills/3d-walkthrough/scripts/shoot.cjs http://localhost:8000/ <scratchpad>/shots
node .claude/skills/3d-walkthrough/scripts/shoot.cjs http://localhost:8000/ <scratchpad>/shots 0,0.3,0.6,1 390 844
```

It waits for every frame to load and reports console errors, failed requests and 404s.
