# Coastal Cottage: baked live-3D walkthrough

Written as a vacation rental listing, as if for a rental business client (a demo; the client details are placeholders).

A scroll walkthrough of the golden-hour coastal cottage in live 3D (three.js), with Blender's lighting and materials baked into the model. Smooth at any scroll speed.

- **Model:** `assets/model.glb` (6.2 MB), sky `assets/sky.webp`, bake info `assets/bake.json`. Made by `projects/coastal-cottage/bake_web.py` from the golden-hour film scene plus the surroundings in `environment.py`: the street, a hill behind it, neighbour houses on the beach and up the hill, and trees.
- **Route** (`assets/spec.js`), the film's camera path:
  1. the floor plan on the sand
  2. the house rises as a plain model, then the golden-hour light comes on
  3. dollhouse orbit
  4. the roof lands
  5. up the stairs and through the front door
  6. dining, then the great room
  7. the rear slider opens to the lanai and the sunset
- **Engine:** `assets/engine.js` is the skill template's engine in baked mode. See `.claude/skills/3d-walkthrough/references/baking.md`.

## Run

```bash
python3 -m http.server 8000 --directory websites/TruongSon-demos/coastal-cottage
```

Open http://localhost:8000. It needs a server, not a file:// open.

## Edit

- **Copy:** the `.panel` sections in `index.html`. `data-in` / `data-out` set where each one shows, from 0 to 1 of the scroll.
- **Camera, build-up, doors, grade:** `assets/spec.js`.
- **Re-bake after a design change:** `python projects/coastal-cottage/bake_web.py` (about 20 minutes; add `--quick` for a 2-minute low-quality check). Needs `pip install bpy pillow`.

## Open items

- Placeholders: the town, guests / sleeps, nightly price, booking link (`#TODO-booking`) and the rental company name.
- Tested in headless Chromium at 1280x720 and 390x844. Not tested on real phones or Safari.
