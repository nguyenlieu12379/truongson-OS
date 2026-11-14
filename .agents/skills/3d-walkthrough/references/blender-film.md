# Blender film

How to turn a floor plan into a rendered MP4 walkthrough with Blender. Use it when the output is `film` or `both`.

Reference build: `projects/coastal-cottage/` (elevated beach cottage, 43 s film). The templates in `assets/blender/` are generalised copies of it.

## Example beat sheet

The film's start, route and end come from the walkthrough guide, asked for before building. This is not a fixed story. Below is what the coastal cottage guide asked for, to show pacing and the techniques the template already has. Use only the beats the guide calls for, in the guide's order.

| Beat | Frames @24fps | What happens |
| --- | --- | --- |
| 1. Plan on the table | 1-119 | The drawn floor plan sits on a desk with props (pencil, ruler, mug, trace roll). The camera starts at a 3/4 angle, then pushes down until the sheet fills the frame. |
| 2. Match cut | 120 | Hard cut to the same plan, full size on the site ground, framed the same. Feels like the paper became the site. |
| 3. Build up | 120-360 | Pilings or footings rise out of the ground, then the floor sweeps front to back, then walls rise (staggered), then glass and doors, stairs step by step, railings and columns, then furniture pops in. The camera lifts from top-down into an aerial orbit. |
| 4. Dollhouse | 360-470 | Orbit with no roof and no ceiling, so every room reads from above. |
| 5. Roof lands | 470-520 | Roof drops in from above. Ceiling and plan decal switch at the same time. |
| 6. Approach | 520-710 | Fly down to the street, along the path, up the stairs, and the front door swings in. |
| 7. Walk in | 710-905 | Eye height, through the rooms in the walkthrough guide's order. Doors and sliders open before the camera reaches them. |
| 8. End shot | 905-1040 | Hold on the hero view (for a beach house, the lanai and the ocean). Hold at least 2 s. |

If the guide gives no start or end, ask. Do not fill the gap with this example.

## Setup (cloud or local)

```bash
python3 -m venv <scratchpad>/bl && <scratchpad>/bl/bin/pip install bpy pillow
```

- `bpy` is Blender as a Python module (5.3 at the time of writing, about 400 MB). It must match the Python version (bpy 5.x needs Python 3.13). No Blender app needed.
- EEVEE does not render headless in the cloud container (no EGL or GPU). Use Cycles on CPU. On the user's own PC with a GPU, EEVEE is fine and much faster.
- Video output in Blender 5: set `image_settings.media_type = "VIDEO"` before `file_format = "FFMPEG"`. Older versions only need the second line. The template handles both.

## Scripts

Copy both into the project folder (`projects/<place-name>/` for a film on its own, or `websites/<owner>/<site>/film/` next to a site):

```bash
mkdir -p projects/<place-name> && cp .agents/skills/3d-walkthrough/assets/blender/*.py projects/<place-name>/
```

### `build_model.py`: the house

Everything is in feet at the top (`W`, `D`, `FLOOR_Z`, `CEIL`, body extents, ridge). Edit these, then the sections in order:

- `box(name, x0, y0, z0, x1, y1, z1, material, collection)`: axis-aligned box in feet. Every part of the house is one of these.
- `wall(name, a, b, thickness, openings, material, collection)`: straight wall from point a to b. Openings are `win(center, width)`, `door(center, width)`, `slider(center, width)` or `(center, width, sill, head, "front_door")`. The wall is split into segments around each opening, and glass panes go in the window and slider gaps.
- Plan axes: x across the front, y from the street (y=0) toward the back, z up. Opposite from the website spec, which uses z toward the street.
- Collections matter. The film script animates by collection: `Structure`, `Floors`, `Exterior`, `Walls`, `Glass`, `House` (front door), `Furniture`, `Roof`, `Ceiling`, `Site`, `Labels`.
- `rooms` list: label text and position for each room. Used for the 3D labels and the 2D plan drawing.
- Renders four stills (front, back, plan cutaway, aerial cutaway) and saves `model.blend` plus `model.glb`. The `.glb` can feed a three.js site.

### `build_film.py`: the animation

Runs `build_model.py` first, then adds:

1. **2D plan drawing** (Pillow), made from the model's own geometry. Walls cut at 4 ft above the floor become solid black, glass becomes thin blue lines, furniture becomes outlines, decks get board lines. Room labels, title block, scale bar. Saved as `floor_plan.png`. It always matches the model, so never draw it by hand.
2. **Table scene** far from the site (`TX, TY`), with the plan at 1:30 on the desk.
3. **Plan decal** on the site ground at full size.
4. **Construction keyframes**: `grow(obj, axis, start, frames)` (scale from one face), `pop(obj, start)` (scale from nothing), `show_from(obj, frame)` / `hide_from(obj, frame)` (hide_render keys).
5. **Interior area lights** per room at ceiling height, hidden from the camera.
6. **Camera**: one camera with a Track To constraint on an empty. The `shots` list is `(frame, camera xyz ft, target xyz ft, interpolation)`. Lens and exposure are keyed too.

Edit for a new place:
- `shots`: the camera path from the walkthrough guide. Eye height `F + 5.5` ft. Go through door centres.
- The front door and slider names (`Ext_Front_door2`, `Ext_Rear_slider2`): names come from the wall name plus opening index, sorted by centre. Change them to the doors on the route.
- Room light positions and power.
- Site dressing (boardwalk, dunes, street) to fit the place.

## Match cut maths

The table shot and the site shot must frame the sheet the same way. With a 16:9 frame and the default sensor (36 mm wide), the vertical half-angle is `atan(10.125 / lens)`. The camera height that fills the frame with the sheet is:

```
FILL = (sheet_height / 2) / tan(vertical_half_angle) * 1.04
```

Table camera height = `FILL / K` above the paper (K = drawing scale, 30). Site camera = `FILL` above the decal. Set the frame before the cut to `CONSTANT` interpolation so the camera jumps instead of flying across.

## Mistakes we already made

- **Roof never landed.** Keying `o.location.z + 45` and then `o.location.z` keys the same raised value twice, because the first key changed the location. Store `z0` first.
- **Ghost walls in the plan shot.** Objects scaled to 0.001 on z still show their full footprint from above. Hide every object until its grow starts (`grow` calls `show_from`).
- **Black corners in aerial shots.** The ground ran out. Make the sand and ocean huge (thousands of ft). Scaling a box about its centre also moves its edges; rebuild it instead.
- **Ocean too far away.** The sand box covered the ocean after scaling. Keep the shoreline 100 to 150 ft past the back of the house so the end shot shows water, not just sand.
- **Column in the middle of the end shot.** Check the final frame first. Frame the view between columns, and move furniture out of the foreground.
- **Washed-out renders.** Sky texture plus sun is very bright. Use the AgX view transform, Medium High Contrast look, and exposure about -2.2 outside, -0.9 inside, -2.6 for the table. Key exposure between them.
- **Walk path clipping.** Low furniture is fine at eye height. Tall pieces (walls, fridges, media walls) are not. Shorten or move them off the path.

## Render

- Check composition first with `--test` (13 stills at half size, about 1 min). Read them as a contact sheet before any full render.
- Cycles CPU, 8 samples, OpenImageDenoise, 1280x720: about 12 s a frame on 4 cores, so 1,040 frames take about 3.5 hours. 8 samples looks as clean as 16 after denoising.
- A run longer than the 2 hour background limit must be started detached (`setsid nohup <script> &`), then watched with a Monitor that also reports errors and a missing process, not only success.
- The render writes PNG frames to the scratchpad. Encode with:

```bash
ffmpeg -y -framerate 24 -i <frames>/%04d.png -c:v libx264 -pix_fmt yuv420p -crf 18 -movflags +faststart <project>/film.mp4
```

- Send the user the `.blend` while the render runs. On their PC: open it, Numpad 0 for the film camera, Space to play, Ctrl+F12 to render (switch to EEVEE for speed).
- Add `*.blend1`, `frames/` and `test/` to the project's `.gitignore`. Re-running the script re-saves the `.blend`, so commit it again after a render run.

## Getting the floor plan

- If the user gives no plan, search for one. House-plan sites (architecturaldesigns.com, lovehomedesigns.com) were blocked by the cloud network. Search results can still give overall width, depth, ridge height and room count. Ask to allow the site, or ask the user for an image.
- When only the footprint is known, lay out the rooms yourself and say so plainly in the final message. List the room sizes you chose.
