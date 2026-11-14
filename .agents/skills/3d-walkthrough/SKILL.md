---
name: 3d-walkthrough
description: Use when someone asks for a scroll-based 3D walkthrough website of a F&B, or BnBs, rentals, contructions, building, . Get a 3-style switch (modern, Scandinavian, warm luxury). Inputs are a floor plan, photos and footage, building context, and a walkthrough guide (a line drawn on the plan, or text describing the scroll POV). Unbuilt property with no photos is built from the floor plan alone, with interior design. Can also (or instead) produce a Blender film: an MP4 that starts on the floor plan on a table, builds the house from the ground up, shows a dollhouse, lands the roof, then walks in the front door to the hero view. Use it when someone asks to build a house or place in Blender or wants a walkthrough video. Also runs as /3d-walkthrough.
argument-hint: "[place name] [floor plan] [photos/footage + manifest] [context] [walkthrough guide]"
---

# 3D Walkthrough

Build a scroll-driven 3D website of a building, house, construction, etc. As the visitor scrolls, the camera walks them through the building, and each room gets text and one animated moment. The building is modelled in code with three.js. Where the client has real photos, those photos go onto the surfaces they show, so the scene looks like the real place.

Reference build: `websites/TruongSon-demos/forno-notte/` (pizzeria, street to oven). The starter template in `assets/template/` is a generalised version of it.

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

- **`site`** (default): the scroll-driven three.js website. Steps 4 to 8.
- **`film`**: a Blender scene and a rendered MP4. Skip steps 4 to 7 and go to step 9.
- **`both`**: build the film from the same plan and route, and use its `model.glb` as a check on the site's layout.

If the user says "Blender", "video", "film", "render" or "animation", the output is `film`. Otherwise ask, with `site` as the recommended option.

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

Turn the floor plan, the walkthrough guide and (where they exist) the photos into `assets/spec.js`. Read [spec reference](references/spec-reference.md) for the format. Key rules:
- Units are metres. x right, z toward the street, y up. The front facade is the max z edge.
- Walls are segments. Trace the outer walls counter-clockwise seen from above with the street at the bottom. Openings are `door`, `window` or `pass`.
- Rooms are floor rectangles with finishes and light colour.
- Camera stops follow the walkthrough guide. Eye height 1.6 to 1.8 m. Pass through door centres. Keep the camera at least 0.6 m from walls.
- **Human eye view only.** No 360 pictures, no panoramas, no bubble around the camera. The camera is an ordinary lens at eye height, about 52 degrees on desktop and 68 on portrait phones (engine default).
- **Turning the view.** The camera turns as the visitor scrolls. Each stop has a `look` point, so to turn the head, add a stop where the look point points to the new angle. Keep stops 0.08 to 0.15 of progress apart so the turn stays smooth. Turn 90 degrees or less between neighbouring stops.
- **Dollhouse opening stays** for real estate. It is an overview, not a human-eye view. Only the room views are human eye.
- **Realism comes from** real photos on surfaces (`photo:` materials, see step 5) plus furniture built as 3D shapes.
- The camera moves along the stops only. There is no free walking, so collision only needs to hold along that path.
- **`dollhouse-open`:** the first one or two stops are a high overview of the whole home, above the roof, then the path descends to the front door.
- **`street-open`:** the first stops are outside on the street, then the path reaches the front door, then goes in.

Interior design follows step 3 of the original 3d-walkthrough-2 method. Furnish each room to fit its size:
- Bed in the bedroom, made with pillows and a folded throw (`P.bed`).
- Table and chairs in the dining room, a set dining table (`P.tableSet`).
- Kitchen counter, sink, hob, cutting board, fruit bowl (`P.counter` and `P.kitchenDetails`).
- Sofa and TV in the living room, with rugs (`P.sofa`, `P.rug`).
- Art on walls (`P.art`), table lamps (`P.tableLamp`), plants (`P.plant`), pendants.
- Materials should feel real, drawn in code.

For real estate, add `styles` to the spec (see [spec reference](references/spec-reference.md#styles)). Each style sets wall, floor, ceiling, accent, fabric and wood. Write the furniture set for each style in `site.js` so the switch changes the whole home, not only the walls.

Show the user a top-down sketch of the plan with the route before building: a small SVG or ASCII plan with walls, doors and numbered stops. Get a yes or corrections. This is the cheapest place to catch a wrong layout.

## 4. Scaffold

```bash
cp -R .agents/skills/3d-walkthrough/assets/template websites/<owner>/<site-name>
```

Template files:
- `index.html`: text panels with `data-in` / `data-out` scroll ranges, brand in the nav
- `assets/spec.js`: floor plan, rooms, exterior, `mode`, camera stops (chapters in the nav come from stops with `chapter`)
- `assets/site.js`: furniture, props and per-room scroll animations
- `assets/engine.js`: builds the building, camera spring, panels, photo textures, dollhouse opening, reduced motion. Do not fork per site unless a feature is missing; if it is, add it to the template engine too so the next build gets it.
- `assets/style.css`: set `--accent` and `--accent-2` from the brand
- `assets/three.module.min.js`: vendored three.js r169 (MIT)

Replace the example cafe completely. Nothing from "Little Hour Coffee" should survive. Put the client's photos in `assets/photos/`.

## 5. Build the scene

Work outside in, following the route. For `dollhouse-open`, start at the overview and work down to the door.

1. Exterior (`street-open`): kind, sky, facade, sign text. Match the frontage photo. For `dollhouse-open`, use the garden or street kind that fits the property.
2. Walls and openings from the plan. Check the doors open at the right scroll range.
3. Rooms: finishes and lights from `brief.md`.
4. **Photos on surfaces.** Where the manifest tags a photo to a surface, set that surface's material to `'photo:assets/photos/<file>.jpg'`. The photo must already be cropped and straightened to the surface. Do not use photos on surfaces they do not show straight on.
5. Props from the prop library (`ctx.props`: tables, chairs, counters, shelves, sofas, beds, plants, pendants, rugs, wall boards, espresso machine). Build custom pieces with `box`, `cyl`, `glow` when the library lacks one. Aim for the photo's layout and palette, not every object.
6. One hero moment per major room in `site.js`'s update function, driven by scroll progress `p` (use `seg`, `smooth`, `easeOut`). Small, physical, readable.
7. **Style switch (real estate only).** `site.build(ctx, style)` runs again on every style change. Read `ctx.spec.styles[style]` for the fabric, wood and accent colours, and put all furniture on `ctx.props` (which already sits under `ctx.root`). Add furniture to `ctx.root`, not to `scene`, or it will duplicate on each switch. The engine swaps walls, floors and ceilings itself. Set the button labels in `index.html` to match the style keys.

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
- Camera never clips through a wall or furniture; doors open before the camera reaches them
- `dollhouse-open`: the overview shows the rooms from above, and the roof is gone from that view
- Real estate: each style button changes the walls, floors, ceiling and furniture together. Check all three styles, and that the switch works with no console errors
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

Read [Blender film](references/blender-film.md) first. It has the beat sheet, the setup, the script API, the match cut maths and every mistake already made. Reference build: `3d/coastal-cottage/`.

1. **Set up Blender.** `pip install bpy pillow` in a venv in the scratchpad. Cycles on CPU in the cloud; EEVEE does not run headless there.
2. **Copy the templates** from `assets/blender/` (`build_model.py`, `build_film.py`) into `3d/<place-name>/`, or `websites/<owner>/<site>/film/` for `both`.
3. **Model** in `build_model.py`: dimensions in feet at the top, walls with openings, rooms, furniture, roof, site. Keep the collection names; the film animates by collection. Run it with `--no-render` until it builds clean, then render the four stills and read them. Check the plan cutaway against the floor plan.
4. **Route** in `build_film.py`: write the `shots` list from the walkthrough guide (table, match cut, build, dollhouse, roof, approach, walk in, end shot). Point the door and slider names at the doors on the route. Show the user the plan with numbered stops before rendering, as in step 3.
5. **Test** with `--test`: read the stills as one contact sheet. Fix framing, exposure, clipping and anything blocking the end shot. Repeat until clean.
6. **Render** the full film detached, with a Monitor on progress and errors (1,040 frames take about 3.5 hours at 720p in the cloud). Meanwhile, send the user the `.blend` so they can play it in Blender right away.
7. **Deliver**: `film.mp4`, `film.blend`, `model.blend`, `model.glb`, `floor_plan.png`, stills, and a `README.md` with the beat sheet and rebuild commands. Commit on the working branch. List every assumption (room layout, finishes, site dressing).

## Rules

- Stick to the floor plan. Do not add rooms that are not drawn.
- Use placeholders for any missing contact or price details. Never invent them.
- Do not write em dashes in on-screen copy. Keep text short.
- Do not publish anywhere. The user decides when to share.
- Say what is assumed in the final message.
