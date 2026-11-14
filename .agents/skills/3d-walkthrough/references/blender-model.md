# Blender model

Every output starts here. The building is modelled once, in Blender, from a Python script (`assets/blender/build_model.py`). The website loads the exported `model.glb`. The film animates the same scene. There is no other way to build the place.

Example: the template ships the coastal cottage (`3d/coastal-cottage/` is the full film build of it).

## Setup

```bash
python3 -m venv <scratchpad>/bl && <scratchpad>/bl/bin/pip install bpy pillow
```

- `bpy` is Blender as a Python module (5.3 at the time of writing, about 400 MB). It must match the Python version (bpy 5.x needs Python 3.13). No Blender app needed.
- Cycles renders on CPU in the cloud. EEVEE does not run headless there (no EGL or GPU).
- The user can open any `.blend` in their own Blender (File, Open).

## Where the scripts go

```bash
mkdir -p websites/<owner>/<site>/blender && cp .agents/skills/3d-walkthrough/assets/blender/build_model.py websites/<owner>/<site>/blender/
```

For a film add `build_film.py` next to it. For a film with no site, use `3d/<place-name>/` instead.

Run it:

```bash
cd websites/<owner>/<site>/blender && <scratchpad>/bl/bin/python build_model.py
```

It writes four check renders, `model.blend` and `model.glb`. Copy `model.glb` to the site's `assets/`. Use `--no-render` while iterating.

## Building blocks

Everything is in feet at the top (`W`, `D`, `FLOOR_Z`, `CEIL`, body extents, ridge) and converted with `FT`, so Blender units are metres.

- `box(name, x0, y0, z0, x1, y1, z1, material, collection)`: axis-aligned box in feet. Most of the house is these.
- `wall(name, a, b, thickness, openings, material, collection)`: straight wall from plan point a to b. Openings are `win(center, width)`, `door(center, width)`, `slider(center, width)` or `(center, width, sill, head, "front_door")`. The wall is split around each opening and glass goes in window and slider gaps.
- `photo(name, image_path, a, b, z0, z1)`: a client photo on a wall, from plan point a to b, z0 to z1 feet high. Crop and straighten the photo to that rectangle first. It is packed into the `.glb`.
- `rooms`: label text and position per room. Used for the plan drawing and the 3D labels.
- Furniture: boxes in the `Furniture` collection, sized to the room (bed with pillows, dining table and chairs, kitchen counter and island, sofa and TV wall, rugs). Read the photos for layout and palette.
- `make_door(old_name, new_name)`: renames a door or slider and moves its origin onto the hinge.
- Point lights in the `Lights` collection, one or more per room, near the ceiling.

Plan axes: x across the front, y from the street (y = 0) toward the back, z up.

## Conventions the website relies on

| Thing | Rule | Why |
| --- | --- | --- |
| Axes | Blender (x, y, z) becomes (x, z, -y) in the site | The street side ends up at max z, matching spec.js |
| Style materials | Name them exactly `wall`, `floor`, `ceiling`, `fabric`, `wood`, `accent` | The style switch recolours materials by these names |
| Glass | Material name starts with `Glass` | The site swaps it for a cheap transparent glass |
| Roof and ceilings | `obj["role"] = "upper"` | Hidden while the dollhouse camera is above the roof |
| Ground, sea, street | `obj["role"] = "site"` | Left out of the building bounds |
| Doors and sliders | `obj["role"] = "door"`, origin on the hinge (use `make_door`) | spec.doors swings or slides them by name |
| Per-style furniture | `obj["style"] = "modern"` (a style key) | Shown only in that style |
| Anything site.js animates | Keep it a separate object with a clear name | Static meshes are joined on export |
| Lights | Point lights only | Area lights and the sun are not exported. The site adds sky light |

`export_web_glb()` joins static meshes per collection and material (hundreds of boxes become a few dozen meshes), then exports with extras and lights. It runs after `model.blend` is saved, because the film needs the objects separate.

## Mistakes we already made

- **Door pivoting around the world origin.** `box()` bakes the location into the mesh, so every origin is at (0, 0, 0). A door rotated without moving its origin swings in a huge arc. Always use `make_door`.
- **Ghost walls, roof that never lands, black ground edges**: see [Blender film](blender-film.md).
- **Lights too bright or too dim on the site.** Export uses the COMPAT lighting mode (watts / 4π). Tune with `spec.lightScale` instead of re-exporting.
- **Missing room in the site.** Check the plan cutaway render against the floor plan before exporting.

## Check before exporting

Read the four renders (front, back, plan cutaway, aerial cutaway):
- Every room, door, window and stair from the plan is there, in the right place.
- Furniture fits each room and leaves the walk path clear (tall pieces off the route).
- Photos sit on the right surfaces, not stretched.
- The `.glb` stays under about 5 MB (photos are most of it; resize them to about 2048 px).
