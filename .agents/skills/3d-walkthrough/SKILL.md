---
name: 3d-walkthrough
description: Use when someone asks for a scroll-based 3D walkthrough website of a F&B, or BnBs, rentals, contructions, building, . Get a 3-style switch (modern, Scandinavian, warm luxury). Inputs are a floor plan, photos and footage, building context, and a walkthrough guide (a line drawn on the plan, or text describing the scroll POV). Unbuilt property with no photos is built from the floor plan alone, with interior design. The place is always modelled in Blender. The site loads the exported model, and the same Blender scene can render a walkthrough film (MP4) whose start, route and end come from the walkthrough guide. Use it when someone asks for a 3D walkthrough site, to build a house or place in Blender, or for a walkthrough video. Also runs as /3d-walkthrough.
argument-hint: "[place name] [floor plan] [photos/footage + manifest] [context] [walkthrough guide]"
---

# 3D Walkthrough

Build a scroll-driven 3D website of a building, house, construction, etc. As the visitor scrolls, the camera walks them through the building, and each room gets text and one animated moment.

**One method: Blender.** The building is modelled in Blender from a Python script (`assets/blender/build_model.py`) and exported as `model.glb`. The website loads that model with three.js and walks the camera through it. The same Blender scene renders the film. Where the client has real photos, they go onto the surfaces they show, in Blender, so the scene looks like the real place.

Reference build: the template's example (`assets/template/`, a coastal cottage) and its film, `projects/coastal-cottage/`. `websites/TruongSon-demos/forno-notte/` is an older site built the previous, code-only way. Do not copy its method.

## 0. Load the design skill. Every run.

Before writing any code, read the design-skills pack. It sets the quality bar for type, motion and UI on these sites.

1. `.agents/skills/design-skills/skills/emil-design-eng/SKILL.md` (entry point)
2. `.agents/skills/design-skills/skills/apple-design/SKILL.md` (springs, materials, typography, reduced motion)
3. `.agents/skills/design-skills/skills/choreograph/SKILL.md` (sequencing panels and scene beats)
4. `.agents/skills/design-skills/skills/animate/SKILL.md` (motion for panels, the hero objects, and interactions)
5. `.agents/skills/design-skills/skills/animation-vocabulary/SKILL.md` (naming and choosing the right motion)
6. `.agents/skills/design-skills/skills/animation-performance/SKILL.md` (keeping scroll-driven 3D smooth on laptops and phones)
7. `.agents/skills/design-skills/ui-cheatsheet.md` and `performance-cheatsheet.md`

Use `review-animations` in step 7. Apply what they say over anything in this file that conflicts.

## 1. Collect the inputs

| Input | Required | Notes |
| --- | --- | --- |
| **Floor plan** | Yes | Image or PDF. Any sketch works. If it has no scale, ask for one known measurement (door width, room length). |
| **Walkthrough guide** | Yes | Either a line drawn on the floor plan, or text describing how the scroll POV should move ("enter, turn left to the bar, then the patio"). It sets the camera stops. |
| **Photos and footage** | Yes for a built place. Optional for unbuilt real estate. | Outside frontage, entrance, each room, the hero spot (oven, bar, bed, chair). |
| **Photo manifest** | When photos exist | One line per photo: which file, which surface it goes on (for example `front-wall`, `counter-left`, `floor-cafe`). Tagged by the user. |
| **Building context** | No | Name, type, hours, address, price, booking link, 3 facts worth bragging about. Used for the copy and the sign. |
| **Brand** | No | Logo, colours, fonts. |
| **Mood** | No | Time of day (`dusk`, `night`, `day`, `golden`) and street or garden frontage. |

Ask for what is missing with the host's question tool, a few questions at a time. Never invent facts like prices, hours or addresses. Use clearly marked placeholders (`TODO: hours`) and list them at the end.

Also ask, if not obvious: owner folder name for `websites/<owner>/<site>/`, and who is asking (Son or Truong) for any decision logging.

### Pick the opening mode

Set `spec.mode` from what the place is.

- **`dollhouse-open`**: real estate, rentals, a home for sale or let. The scroll opens on a high overview of the whole home, then the camera descends to the front door and walks room by room. This is the only mode that gets the style switch.
- **`street-open`**: any one-floor business (cafe, shop, restaurant, bar, bnb, salon, studio). The scroll starts on the street, walks to the front door, then goes in. No dollhouse.
- or anything user mention in the walkthrough guide

If the place type is unclear, ask.

### Pick the output

Every output starts with the Blender model (steps 4 and 5).

- **`site`** (default): the scroll-driven website that loads the model. Steps 4 to 8.
- **`film`**: an MP4 rendered from the model. Steps 4, 5 and 9.
- **`both`**: one model, both outputs. Steps 4 to 9.

If the user says "Blender", "video", "film", "render" or "animation", the output is `film`. Otherwise ask, with `site` as the recommended option.

For `film`, the walkthrough guide sets where the film starts, the route, and where it ends. Ask for it before building if it is missing. Do not assume the reference build's story.

### Unbuilt real estate (no photos)

When the property is not built yet and there are no photos, build from the floor plan alone. Rooms are furnished and styled using step 3 (interior design). The photo manifest is not needed. Say so in the final message, and list which finishes and furniture are assumptions.

## 2. Study the place

Look at every image. For footage, pull frames first into the scratchpad:

```bash
mkdir -p <scratchpad>/frames && ffmpeg -i <video> -vf "fps=1/2,scale=1280:-1" <scratchpad>/frames/<name>_%03d.jpg
```

Then write `brief.md` in the site folder, one section per place:
- Rough size (metres) and ceiling height
- Floor, wall and ceiling finishes, with hex colours sampled from the photos (or chosen for unbuilt property)
- Furniture and fixtures with rough positions (left wall, centre, by the window)
- Light sources and their colour (warm pendants, daylight windows, neon)
- The **hero object** of the room and the scroll moment for it (pizza built and baked, cup filling, bed turned down, door opening to the patio)
- Which photo (from the manifest) goes on which surface, and the crop or straightening it needs

Keep it short. It is the checklist you build against and verify against.

### Read the plan (no code yet)

Read the floor plan carefully before building.

- List every room with its approximate size (ft or m, as drawn).
- List every door, window and stair, with its wall.
- Assume a wall height of 9 ft (2.7 m) unless the plan says otherwise. State the assumption.
- Point out anything unclear, such as a missing dimension, a door swing, or an unlabelled room. Ask only if it blocks the build. Otherwise make a stated assumption and move on.

Stop here only if the plan cannot be read at all.

## 3. Plan and route, confirmed before building

Turn the floor plan, the walkthrough guide and (where they exist) the photos into a build plan: what goes in the Blender model, and the route.

- **Model (Blender):** every wall and opening, rooms and finishes, furniture, lights, photos on surfaces, the site around the building. See [Blender model](references/blender-model.md).
- **Route (`assets/spec.js`):** camera stops, door timing, styles, sky. See [spec reference](references/spec-reference.md).

Route rules:
- Coordinates are the model's, in metres: x right, y up, z toward the street. Blender (x, y, z) becomes (x, z, -y). The front is the max z edge.
- Camera stops follow the walkthrough guide. Eye height 1.6 to 1.8 m above the floor. Pass through door centres. Keep the camera at least 0.6 m from walls.
- **Human eye view only.** No 360 pictures, no panoramas, no bubble around the camera. The camera is an ordinary lens at eye height, about 52 degrees on desktop and 68 on portrait phones (engine default).
- **Turning the view.** Each stop has a `look` point, so to turn the head, add a stop where the look point points to the new angle. Keep stops 0.08 to 0.15 of progress apart so the turn stays smooth. Turn 90 degrees or less between neighbouring stops.
- **Dollhouse opening stays** for real estate. It is an overview, not a human-eye view. Only the room views are human eye.
- The camera moves along the stops only. There is no free walking, so collision only needs to hold along that path.
- **`dollhouse-open`:** the first one or two stops are a high overview of the whole home, above the roof, then the path descends to the front door.
- **`street-open`:** the first stops are outside on the street, then the path reaches the front door, then goes in.

Interior design (in Blender). Furnish each room to fit its size:
- Bed in the bedroom, made with pillows and a folded throw.
- Table and chairs in the dining room, set.
- Kitchen counter, sink, hob, island.
- Sofa and TV in the living room, with rugs.
- Art on walls, lamps, plants, pendants.
- Realism comes from real photos on surfaces plus furniture that matches their layout and palette.

For real estate, plan three `styles`. Each recolours the materials named `wall`, `floor`, `ceiling`, `fabric`, `wood` and `accent`. Furniture that should change per style gets a `style` extra in Blender.

Show the user a top-down sketch of the plan with the route before building: a small SVG or ASCII plan with walls, doors and numbered stops. Get a yes or corrections. This is the cheapest place to catch a wrong layout.

## 4. Scaffold and set up Blender

```bash
cp -R .agents/skills/3d-walkthrough/assets/template websites/<owner>/<site-name>
mkdir -p websites/<owner>/<site-name>/blender && cp .agents/skills/3d-walkthrough/assets/blender/build_model.py websites/<owner>/<site-name>/blender/
python3 -m venv <scratchpad>/bl && <scratchpad>/bl/bin/pip install bpy pillow
```

For a film with no site, use `projects/<place-name>/` for the scripts instead and skip the template.

Template files:
- `index.html`: text panels with `data-in` / `data-out` scroll ranges, brand in the nav
- `assets/model.glb`: the building, exported from Blender. Replace with the client's
- `assets/spec.js`: `mode`, model path, sky, camera stops (chapters come from stops with `chapter`), doors, styles
- `assets/site.js`: per-room scroll animations on the loaded model
- `assets/engine.js`: loads the model, camera spring, panels, dollhouse opening, doors, style switch, reduced motion. Do not fork per site unless a feature is missing; if it is, add it to the template engine too so the next build gets it.
- `assets/style.css`: set `--accent` and `--accent-2` from the brand
- `assets/three.module.min.js`, `GLTFLoader.js`, `BufferGeometryUtils.js`: vendored three.js r169 (MIT)

Replace the example cottage completely: model, spec, copy. Put the client's photos (cropped and straightened) in `blender/photos/`.

## 5. Build the scene in Blender

Edit `blender/build_model.py`. Work outside in, following the route. Read [Blender model](references/blender-model.md) first.

1. Dimensions at the top (feet), then the site: ground, street or garden, sea, whatever the frontage photo shows.
2. Walls and openings from the plan with `wall()`. Doors and sliders on the route get `make_door()`.
3. Floors, ceilings and finishes from `brief.md`. Use the role material names so the style switch works.
4. **Photos on surfaces** with `photo()`. Only on surfaces the photo shows straight on.
5. Furniture per room (boxes in the `Furniture` collection), to the photo's layout and palette, not every object.
6. Room point lights in the `Lights` collection.
7. Run it, read the four renders, fix, repeat. Then copy `model.glb` to the site's `assets/`.
8. In `spec.js`: stops, `doors` timing, `styles`, `sky`, `lightScale`.
9. One hero moment per major room in `site.js`'s update function, driven by scroll progress `p` (use `seg`, `smooth`, `easeOut`). Animate model objects with `ctx.get('Name')` (keep them separate in Blender), or add small extras with `glow` and `light`. Small, physical, readable.

Lessons that save time are in [build notes](references/build-notes.md). Read them before step 5.

## 6. Write the copy

One panel per stop group: hero, approach, entrance, each room, final call to action. Short headlines, one line of support, real facts. Stats cards and step lists that light up (`data-at`) work well. For a client, match their voice from their materials. For unbuilt property, write the copy from the plan and the building context only, with no invented facts.

This copy is external content. Show the user the draft headlines before treating them as final.

## 7. Verify

Serve and screenshot every stop at desktop and phone sizes:

```bash
cd websites/<owner>/<site-name> && python3 -m http.server 8000
node .agents/skills/3d-walkthrough/scripts/shoot.cjs http://localhost:8000/ <scratchpad>/shots
node .agents/skills/3d-walkthrough/scripts/shoot.cjs http://localhost:8000/ <scratchpad>/shots 0,0.3,0.6,1 390 844
```

Read every screenshot. Fix and reshoot until all pass:
- No console errors
- Each stop matches the plan and, where there are photos, the photo (layout, palette, hero object visible)
- Photos sit on the right surface and are not stretched or cut wrong
- `model.glb` loads (no 404, no loader error) and stays under about 5 MB
- Camera never clips through a wall or furniture; doors open before the camera reaches them
- `dollhouse-open`: the overview shows the rooms from above, and the roof is gone from that view
- Real estate: each style button recolours walls, floors, ceiling, fabric and wood, and swaps per-style furniture. Check all three styles, and that the switch works with no console errors
- No room is too dark or blown out; text is readable over the scene
- Panels do not overlap each other or the hero object on phone
- Run the `review-animations` checklist from design-skills on the motion

Headless rendering uses software GL and is slow; the script waits for the camera to settle. Say plainly that real-device testing was not done.

## 8. Deliver

1. Write the site `README.md`: what it is, the route, how to run, how to edit (copy, stops, photos, animations).
2. Add a row to `websites/README.md`.
3. Send the user key screenshots and list any placeholders still open, plus every assumption made (wall height, finishes, furniture for unbuilt property).
4. Ask before publishing. If yes: add a copy step for the site to `.github/workflows/deploy-pages.yml` (`_site/<site-name>/`), keep the existing sites, and go through a PR to `main`. Do not change the root redirect unless asked.
5. Commit on the working branch. Suggest a `decisions/log.md` entry for any choice worth keeping.

## 9. Blender film (output `film` or `both`)

The model from step 5 is the film's set. Read [Blender film](references/blender-film.md) first. It has an example beat sheet, the script API, the match cut maths and every mistake already made. Reference build: `projects/coastal-cottage/`.

1. **Copy** `assets/blender/build_film.py` next to `build_model.py`. It runs the model script first, then animates it.
2. **Check the model** renders (step 5) if it was built for the film only.
3. **Doors**: the film opens the doors made with `make_door()` (`Door_Front`, `Door_Rear_Slider` in the example). Point it at the doors on the route.
4. **Route** in `build_film.py`: write the `shots` list from the walkthrough guide: its start, every stop in order, and its end shot. Add or drop beats (plan on a table, build-up, dollhouse, roof landing) only as the guide asks. Show the user the plan with numbered stops before rendering, as in step 3.
5. **Test** with `--test`: read the stills as one contact sheet. Fix framing, exposure, clipping and anything blocking the end shot. Repeat until clean.
6. **Render** the full film detached, with a Monitor on progress and errors (1,040 frames take about 3.5 hours at 720p in the cloud). Meanwhile, send the user the `.blend` so they can play it in Blender right away.
7. **Deliver**: `film.mp4`, `film.blend`, `model.blend`, `floor_plan.png`, stills, and a `README.md` with this film's beats and rebuild commands. Commit on the working branch. List every assumption (room layout, finishes, site dressing).

## Rules

- Stick to the floor plan. Do not add rooms that are not drawn.
- Use placeholders for any missing contact or price details. Never invent them.
- Do not write em dashes in on-screen copy. Keep text short.
- Do not publish anywhere. The user decides when to share.
- Say what is assumed in the final message.
