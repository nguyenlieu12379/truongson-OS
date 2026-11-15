---
name: 3d-walkthrough
description: Use when someone asks for a scroll-based 3D walkthrough website of a F&B, or BnBs, rentals, contructions, building, . Get a 3-style switch (modern, Scandinavian, warm luxury). Inputs are a floor plan, photos and footage, building context, a walkthrough guide (a line drawn on the plan, or a prompt describing the scroll POV) and a design guide. With no photos or footage, or for an unbuilt place, everything is self-designed in Blender from the design guide (materials, furniture, items, surroundings, sky, terrain). With a floor plan, it opens on the plan lying on a surface, then the house is built from the ground up. The place is always modelled in Blender. The website is live 3D with the Blender lighting baked into the model, so it looks close to the render and stays smooth at any scroll speed. The same scene can render a walkthrough film (MP4) whose start, route and end come from the walkthrough guide. Use it when someone asks for a 3D walkthrough site, to build a house or place in Blender, or for a walkthrough video. Also runs as /3d-walkthrough.
argument-hint: "[place name] [floor plan] [photos/footage + manifest] [context] [walkthrough guide] [design guide]"
---

# 3D Walkthrough

Build a scroll-driven 3D walkthrough website of a building, house, construction, etc. The site is **live 3D**: as the visitor scrolls, the camera walks them through the building, smooth at any speed, and each room gets text and one animated moment.

**One method: Blender, baked.** The building is modelled and designed in Blender from Python scripts (`assets/blender/build_model.py`). Blender then **bakes** its lighting and materials into textures on the model (soft shadows, bounce light, lamp glow, wood, tile, siding), and exports `model.glb`. The website loads it with three.js and shows the baked textures, so it looks close to the render without the browser computing light. The same scene can render a film. **Design:** where the client has real photos, they go onto the surfaces they show, in Blender, so the scene looks like the real place. With no footage or images, or for an unbuilt structure, design everything in Blender from the design guide: materials, furniture, items, surrounding environment, sky and terrain.

Why baked live 3D: a film played by scroll looks exact but weighs 17 to 110 MB and steps on slow scrolls. Plain live 3D is light and smooth but looks flat. Baked live 3D is smooth at any speed in about 5 to 15 MB and keeps most of the render's look. See [Baking](references/baking.md) for what carries over and what doesn't.

Reference builds: `projects/coastal-cottage/` (model, design pass, film). The template's example (`assets/template/`) is the cottage as plain live 3D. The film-playback site is archived in `archives/3d-walkthrough-film-site/`. `websites/TruongSon-demos/forno-notte/` is an older code-only site. Do not copy its method.

**Status:** the bake step has not been run in this setup yet. The first baked build is the coastal cottage. Update [Baking](references/baking.md) with what worked.

## 0. Load the design skill. Every run.

Before writing any code, read the design-skills pack. It sets the quality bar for type, motion and UI on these sites.

1. `.claude/skills/design-skills/skills/emil-design-eng/SKILL.md` (entry point)
2. `.claude/skills/design-skills/skills/apple-design/SKILL.md` (springs, materials, typography, reduced motion)
3. `.claude/skills/design-skills/skills/choreograph/SKILL.md` (sequencing panels and scene beats)
4. `.claude/skills/design-skills/skills/animate/SKILL.md` (motion for panels, the hero objects, and interactions)
5. `.claude/skills/design-skills/skills/animation-vocabulary/SKILL.md` (naming and choosing the right motion)
6. `.claude/skills/design-skills/skills/animation-performance/SKILL.md` (keeping scroll-driven 3D smooth on laptops and phones)
7. `.claude/skills/design-skills/ui-cheatsheet.md` and `performance-cheatsheet.md`

Use `review-animations` in step 10. Apply what they say over anything in this file that conflicts.

## 1. Collect the inputs

| Input | Required | Notes |
| --- | --- | --- |
| **Floor plan** | Yes | Image or PDF. Any sketch works. If it has no scale, ask for one known measurement (door width, room length). |
| **Walkthrough guide** | Yes | Either a line drawn on the floor plan, or a prompt describing how the scroll POV should move ("enter, turn left to the bar, then the patio"). It sets the camera stops, the start and the end. |
| **Photos and footage** | Yes for a built place. Optional for unbuilt real estate. | Outside frontage, entrance, each room, the hero spot (oven, bar, bed, chair). |
| **Design guide** (self-design) | When no photos or footage exist, or for an unbuilt place | A prompt for the look. Follow it to design the materials, furniture, items, surrounding environment, sky and terrain. Ask for it if missing. |
| **Photo manifest** | When photos exist | One line per photo: which file, which surface it goes on (for example `front-wall`, `counter-left`, `floor-cafe`). Tagged by the user. |
| **Building context** | No | Name, type, hours, address, price, booking link, 3 facts worth bragging about. Used for the copy and the sign. |
| **Brand** | No | Logo, colours, fonts. |
| **Mood** | No | Time of day (`dusk`, `night`, `day`, `golden`) and street or garden frontage. Can be part of the design guide. |

Ask for what is missing with the host's question tool, a few questions at a time. Never invent facts like prices, hours or addresses. Use clearly marked placeholders (`TODO: hours`) and list them at the end.

Also ask, if not obvious: owner folder name for `websites/<owner>/<site>/`, and who is asking (Son or Truong) for any decision logging.

### Pick the opening mode

Set `spec.mode` from what the place is.

- **`dollhouse-open`**: real estate, rentals, a home for sale or let. The scroll opens on a high overview of the whole home, then the camera descends to the front door and walks room by room. Optional 3-style switch (modern, Scandinavian, warm luxury): baked light means one bake per style, so it's off unless asked.
  - **With a floor plan (or plans):** start the frame on the floor plan lying on a surface, then the house is built brick by brick from the ground up, then the overview and the walk as above. The film script already has this (plan on the table, match cut, build-up). The site plays it live from the bake groups.
- **`street-open`**: any one-floor business (cafe, shop, restaurant, bar, bnb, salon, studio). The scroll starts on the street, walks to the front door, then goes in. No dollhouse.
- or anything user mention in the walkthrough guide

If the place type is unclear, ask.

### Pick the output

Every output starts with the Blender model.

- **`site`** (default): the baked live-3D scroll website. Steps 4 to 11.
- **`film`**: an MP4 rendered from the model. Steps 4, 5 and 7.
- **`both`**: one model, both outputs. All steps.

If the user says "Blender", "video", "film", "render" or "animation" and nothing about a website, the output is `film`. Otherwise ask, with `site` as the recommended option.

The walkthrough guide sets where the walkthrough starts, the route, and where it ends. Ask for it before building if it is missing. Do not assume the reference build's story.

### Self-design (no photos, or unbuilt)

When there are no photos or footage, or the property is not built yet, build from the floor plan and design everything from the design guide (step 5, Design). The photo manifest is not needed. Say so in the final message, and list every finish, furniture and site choice as an assumption.

## 2. Study the place

Look at every image. For footage, pull frames first into the scratchpad:

```bash
mkdir -p <scratchpad>/frames && ffmpeg -i <video> -vf "fps=1/2,scale=1280:-1" <scratchpad>/frames/<name>_%03d.jpg
```

Then write `brief.md` in the site folder, one section per place:
- Rough size (metres) and ceiling height
- Floor, wall and ceiling finishes, with hex colours sampled from the photos (or chosen from the design guide when there are no photos)
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
- **Route (`assets/spec.js`):** camera stops, door timing, sky. See [spec reference](references/spec-reference.md).

Route rules:
- Coordinates are the model's, in metres: x right, y up, z toward the street. Blender (x, y, z) becomes (x, z, -y). The front is the max z edge.
- Camera stops follow the walkthrough guide. Eye height 1.6 to 1.8 m above the floor. Pass through door centres. Keep the camera at least 0.6 m from walls.
- **Human eye view only.** No 360 pictures, no panoramas, no bubble around the camera. An ordinary lens at eye height, about 52 degrees on desktop and 68 on portrait phones (engine default).
- **Turning the view.** Each stop has a `look` point. Keep stops 0.08 to 0.15 of progress apart, and turn 90 degrees or less between neighbouring stops.
- **Dollhouse opening stays** for real estate. It is an overview, not a human-eye view.
- The camera moves along the stops only. There is no free walking, so collision only needs to hold along that path. Baked light is frozen, so it looks right from every point on the path.
- **`dollhouse-open`:** with a floor plan, the plan on a surface and the build-up first, then a high overview of the whole home, then down to the front door.
- **`street-open`:** the first stops are outside on the street, then the front door, then inside.

Interior design (in Blender). Furnish each room to fit its size, in the look the photos or the design guide set:
- Bed in the bedroom, made with pillows and a folded throw.
- Table and chairs in the dining room, set.
- Kitchen counter, sink, hob, island.
- Sofa and TV in the living room, with rugs.
- Art on walls, lamps, plants, pendants.
- Realism comes from real photos on surfaces plus furniture that matches their layout and palette. With no photos, it comes from real materials, decor and the light the design guide asks for, baked in.

Show the user a top-down sketch of the plan with the route before building: a small SVG or ASCII plan with walls, doors and numbered stops. Get a yes or corrections. This is the cheapest place to catch a wrong layout.

## 4. Scaffold and set up Blender

```bash
cp -R .claude/skills/3d-walkthrough/assets/template websites/<owner>/<site-name>
mkdir -p websites/<owner>/<site-name>/blender && cp .claude/skills/3d-walkthrough/assets/blender/build_model.py websites/<owner>/<site-name>/blender/
python3 -m venv <scratchpad>/bl && <scratchpad>/bl/bin/pip install bpy pillow
```

For a film with no site, use `projects/<place-name>/` for the scripts instead and skip the template. Put the client's photos (cropped and straightened) in `blender/photos/`.

Template files:
- `index.html`: text panels with `data-in` / `data-out` scroll ranges, brand in the nav
- `assets/model.glb`: the building, exported (baked) from Blender. Replace with the client's
- `assets/spec.js`: `mode`, model path, sky, camera stops (chapters come from stops with `chapter`), doors, styles
- `assets/site.js`: per-room scroll animations on the loaded model
- `assets/engine.js`: loads the model, camera spring, panels, dollhouse opening, doors, reduced motion. Do not fork per site unless a feature is missing; if it is, add it to the template engine too so the next build gets it. The first baked build adds `spec.baked`, `spec.skyImage` and the live build-up opening (see [Baking](references/baking.md)).
- `assets/style.css`: set `--accent` and `--accent-2` from the brand
- `assets/three.module.min.js`, `GLTFLoader.js`, `BufferGeometryUtils.js`: vendored three.js r169 (MIT)

## 5. Build the scene in Blender

Edit `blender/build_model.py`. Work outside in, following the route. Read [Blender model](references/blender-model.md) first.

1. Dimensions at the top (feet), then the site and terrain: ground, street or garden, sea, whatever the frontage photo or the design guide shows.
2. Walls and openings from the plan with `wall()`. Walls get real thickness and closed ends, or the bake leaks light. Doors and sliders on the route get `make_door()` (origin on the hinge).
3. **Design**, picked by what the client gave:
   - **With photos or footage:** client photos on surfaces with `photo()` (only surfaces the photo shows straight on), then finishes, furniture and palette matched to them.
   - **Self-design** (no photos or footage, or an unbuilt place): follow the prompt (design guide) and design everything in Blender. Real materials (siding, wood floors, tile, stone, metal roof, fabrics), real furniture shapes, decor items, plants, the surrounding environment and terrain, and the sky. Reference: `projects/coastal-cottage/design_pass.py`.
4. **Lighting and mood** from the design guide (day, golden hour, dusk, night): sun, sky, warm room lights, colour grade. Reference: `golden_hour()` in `projects/coastal-cottage/design_pass.py`.
5. **Opening** (floor plan given): the plan on a surface, then the house built from the ground up. Keep each construction phase (pilings, floor, walls, roof, furniture per room) its own object group so the site can animate it.
6. Run it, read the four check renders (front, back, plan cutaway, aerial), fix, repeat.

## 6. Bake and export

Read [Baking](references/baking.md) first. In `blender/bake_web.py`:

1. Join static meshes into bake groups per phase and room. Doors and animated pieces stay separate.
2. Add a `Bake` UV map to each group.
3. Bake diffuse (direct, indirect, colour) into one image per group, 2048 px (4096 for the biggest surfaces). Test at low samples first for leaks and seams, then the final bake detached with a monitor.
4. Swap each group to a simple material showing its baked image. Render the sky as a panorama to `sky.webp`.
5. Export `model.glb` with WebP textures to the site's `assets/`. Target 5 to 15 MB with the sky.
6. Compare: a Cycles still and a site screenshot from the same camera should look alike.

## 7. Blender film (output `film` or `both`)

The model from step 5 is the film's set. Read [Blender film](references/blender-film.md) first. It has an example beat sheet, the script API, the match cut maths and every mistake already made.

1. **Copy** `assets/blender/build_film.py` next to `build_model.py`. It runs the model script first, then animates it.
2. **Doors**: point it at the doors on the route (made with `make_door()`).
3. **Shots** from the walkthrough guide: its start, every stop in order, and its end shot. With a floor plan, open on the plan on a surface and the build-up. Add or drop other beats only as the guide asks. Show the user the plan with numbered stops before rendering.
4. **Test** with `--test`: read the stills as one contact sheet. Then 3 full-size look-dev stills (overview, a room, the end shot) for a yes.
5. **Render** detached, with a monitor on progress and errors (1,040 frames at 720p take about 3.5 to 4.5 hours in the cloud). Send the `.blend` meanwhile.
6. **Deliver**: `film.mp4`, the `.blend`, `floor_plan.png`, stills, and a README with the beats and rebuild commands.

## 8. Set up the site

1. In `spec.js`: `mode`, `baked: true`, `skyImage`, stops, `doors` timing, `sky`. Styles only if asked (one bake per style).
2. The build-up opening on scroll (with a floor plan): animate the phase groups, then the dollhouse overview, then the walk.
3. One hero moment per major room in `site.js`'s update function, driven by scroll progress `p` (use `seg`, `smooth`, `easeOut`). Animate model objects with `ctx.get('Name')` (keep them separate in Blender). Small, physical, readable.

Lessons that save time are in [build notes](references/build-notes.md).

## 9. Write the copy

One panel per stop group: hero, the plan and build (if any), approach, entrance, each room, final call to action. Short headlines, one line of support, real facts. For a client, match their voice from their materials. For unbuilt property, write the copy from the plan and the building context only, with no invented facts.

This copy is external content. Show the user the draft headlines before treating them as final.

## 10. Verify

Serve and check every stop at desktop and phone sizes:

```bash
cd websites/<owner>/<site-name> && python3 -m http.server 8000
node .claude/skills/3d-walkthrough/scripts/shoot.cjs http://localhost:8000/ <scratchpad>/shots
node .claude/skills/3d-walkthrough/scripts/shoot.cjs http://localhost:8000/ <scratchpad>/shots 0,0.3,0.6,1 390 844
node .claude/skills/3d-walkthrough/scripts/perf.cjs http://localhost:8000/ 1920 1080 2
```

Read every screenshot. Fix and reshoot until all pass:
- No console errors; `model.glb` and `sky.webp` load and stay under about 15 MB together
- Each stop matches its Cycles still: materials, shadows, glow. No light leaks, black seams or blurry surfaces
- Camera never clips through a wall or furniture; doors open before the camera reaches them
- `dollhouse-open`: the build-up plays, the overview shows the rooms from above, and the roof is gone from that view
- Slow scroll holds 60 fps at 1920x1080 at 2x (`perf.cjs`: median 16.7 ms, nothing over 25 ms)
- Text is readable over the scene; panels don't cover the hero object or each other on phone
- Run the `review-animations` checklist from design-skills on the motion

Headless WebGL is software rendered and slow. Say plainly that real-device testing was not done.

## 11. Deliver

1. Write the site `README.md`: what it is, the route, how to run, how to edit (copy, stops, re-baking).
2. Add a row to `websites/README.md`.
3. Send the user key screenshots and list any placeholders still open, plus every assumption made (wall height, finishes, furniture for unbuilt property).
4. Ask before publishing. If yes: add a copy step for the site to `.github/workflows/deploy-pages.yml` (`_site/<site-name>/`), keep the existing sites, and go through a PR to `main`. Do not change the root redirect unless asked.
5. Commit on the working branch. Suggest a `decisions/log.md` entry for any choice worth keeping.

## Rules

- Stick to the floor plan. Do not add rooms that are not drawn.
- Use placeholders for any missing contact or price details. Never invent them.
- Do not write em dashes in on-screen copy. Keep text short.
- Do not publish anywhere. The user decides when to share.
- Say what is assumed in the final message.
