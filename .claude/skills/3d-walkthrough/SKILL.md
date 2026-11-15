---
name: 3d-walkthrough
description: Use when someone asks for a scroll-based 3D walkthrough website of a F&B, or BnBs, rentals, contructions, building, . Get a 3-style switch (modern, Scandinavian, warm luxury). Inputs are a floor plan, photos and footage, building context, a walkthrough guide (a line drawn on the plan, or a prompt describing the scroll POV) and a design guide. With no photos or footage, or for an unbuilt place, everything is self-designed in Blender from the design guide (materials, furniture, items, surroundings, sky, terrain). With a floor plan, it opens on the plan lying on a surface, then the house is built from the ground up. The place is always modelled in Blender. Blender renders a walkthrough film (MP4) whose start, route and end come from the walkthrough guide, and the website is built from that film, which plays as you scroll. Use it when someone asks for a 3D walkthrough site, to build a house or place in Blender, or for a walkthrough video. Also runs as /3d-walkthrough.
argument-hint: "[place name] [floor plan] [photos/footage + manifest] [context] [walkthrough guide] [design guide]"
---

# 3D Walkthrough

Build a scroll-driven 3D walkthrough website of a building, house, construction, etc. The background is the rendered film, not live 3D: as the visitor scrolls, the film plays (down plays forward, up plays back), and each beat gets a short text panel.

**One method: Blender.** The building is modelled in Blender from a Python script (`assets/blender/build_model.py`) and animated by `assets/blender/build_film.py`. Blender renders the film. The website is built from the film's frames. **Design:** where the client has real photos, they go onto the surfaces they show, in Blender, so the scene looks like the real place. With no footage or images, or for an unbuilt structure, design everything in Blender from the design guide: materials, furniture, items, surrounding environment, sky and terrain.

Why film and not live 3D: a browser can't show Blender's materials (they are recipes computed at render time, not images) or its traced light. The film frames look exactly like the render.

Reference build: `projects/coastal-cottage/` (model, design pass, film) and its site `websites/TruongSon-demos/coastal-cottage/`. The old live-3D template is in `archives/3d-walkthrough-live3d/`. `websites/TruongSon-demos/forno-notte/` is an older code-only site. Do not copy either method.

## 0. Load the design skill. Every run.

Before writing any code, read the design-skills pack. It sets the quality bar for type, motion and UI on these sites.

1. `.claude/skills/design-skills/skills/emil-design-eng/SKILL.md` (entry point)
2. `.claude/skills/design-skills/skills/apple-design/SKILL.md` (springs, materials, typography, reduced motion)
3. `.claude/skills/design-skills/skills/choreograph/SKILL.md` (sequencing panels and scene beats)
4. `.claude/skills/design-skills/skills/animate/SKILL.md` (motion for panels, the hero objects, and interactions)
5. `.claude/skills/design-skills/skills/animation-vocabulary/SKILL.md` (naming and choosing the right motion)
6. `.claude/skills/design-skills/skills/animation-performance/SKILL.md` (keeping scroll-driven 3D smooth on laptops and phones)
7. `.claude/skills/design-skills/ui-cheatsheet.md` and `performance-cheatsheet.md`

Use `review-animations` in step 9. Apply what they say over anything in this file that conflicts.

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

Pick from what the place is. It sets the film's opening beats.

- **`dollhouse-open`**: real estate, rentals, a home for sale or let. The scroll opens on a high overview of the whole home, then the camera descends to the front door and walks room by room. Optional 3-style switch (modern, Scandinavian, warm luxury): one film render per style.
  - **With a floor plan (or plans):** start the frame on the floor plan lying on a surface, then the house is built brick by brick from the ground up, then the overview and the walk as above. The film template already has this (plan on the table, match cut, build-up).
- **`street-open`**: any one-floor business (cafe, shop, restaurant, bar, bnb, salon, studio). The scroll starts on the street, walks to the front door, then goes in. No dollhouse.
- or anything user mention in the walkthrough guide

If the place type is unclear, ask.

### Pick the output

Every output starts with the Blender model and the film.

- **`site`** (default): the scroll website, built from the rendered film. Steps 4 to 10.
- **`film`**: the MP4 only. Steps 4 to 6, then deliver.
- **`both`**: the film plus its site. Same steps as `site`; deliver the MP4 too.

If the user says "Blender", "video", "film", "render" or "animation" and nothing about a website, the output is `film`. Otherwise ask, with `site` as the recommended option.

The walkthrough guide sets where the film starts, the route, and where it ends. Ask for it before building if it is missing. Do not assume the reference build's story.

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

Turn the floor plan, the walkthrough guide and (where they exist) the photos into a build plan: what goes in the Blender model, and the camera route.

- **Model (Blender):** every wall and opening, rooms and finishes, furniture, lights, photos on surfaces, the site around the building. See [Blender model](references/blender-model.md).
- **Route:** the camera shots in `build_film.py`. See [Blender film](references/blender-film.md).

Route rules:
- Camera stops follow the walkthrough guide. Eye height 1.6 to 1.8 m (about `F + 5.5` ft) above the floor. Pass through door centres. Keep the camera at least 0.6 m from walls.
- **Human eye view only** in rooms. No 360 pictures, no panoramas. An ordinary lens at eye height.
- Turn 90 degrees or less between neighbouring stops, and aim the look 3 to 5 m ahead toward the next room.
- **Dollhouse opening** for real estate. It is an overview, not a human-eye view. Only the room views are human eye.
- **`dollhouse-open`:** with a floor plan, the plan on a surface and the build-up first, then a high overview of the whole home, then down to the front door.
- **`street-open`:** the first shots are outside on the street, then the front door, then inside.
- The film holds the end shot at least 2 s so the site's last panel has room.

Interior design (in Blender). Furnish each room to fit its size, in the look the photos or the design guide set:
- Bed in the bedroom, made with pillows and a folded throw.
- Table and chairs in the dining room, set.
- Kitchen counter, sink, hob, island.
- Sofa and TV in the living room, with rugs.
- Art on walls, lamps, plants, pendants.
- Realism comes from real photos on surfaces plus furniture that matches their layout and palette. With no photos, it comes from real materials, decor and the light the design guide asks for.

Show the user a top-down sketch of the plan with the route before building: a small SVG or ASCII plan with walls, doors and numbered stops. Get a yes or corrections. This is the cheapest place to catch a wrong layout.

## 4. Scaffold and set up Blender

```bash
mkdir -p websites/<owner>/<site-name>/blender
cp .claude/skills/3d-walkthrough/assets/blender/build_model.py .claude/skills/3d-walkthrough/assets/blender/build_film.py websites/<owner>/<site-name>/blender/
python3 -m venv <scratchpad>/bl && <scratchpad>/bl/bin/pip install bpy pillow
```

For a film with no site, use `projects/<place-name>/` for the scripts instead. Put the client's photos (cropped and straightened) in `blender/photos/`.

## 5. Build the scene in Blender

Edit `blender/build_model.py`. Work outside in, following the route. Read [Blender model](references/blender-model.md) first.

1. Dimensions at the top (feet), then the site and terrain: ground, street or garden, sea, whatever the frontage photo or the design guide shows.
2. Walls and openings from the plan with `wall()`. Doors and sliders on the route get `make_door()` (origin on the hinge).
3. **Design**, picked by what the client gave:
   - **With photos or footage:** client photos on surfaces with `photo()` (only surfaces the photo shows straight on), then finishes, furniture and palette matched to them.
   - **Self-design** (no photos or footage, or an unbuilt place): follow the prompt (design guide) and design everything in Blender. Real materials (siding, wood floors, tile, stone, metal roof, fabrics), real furniture shapes, decor items, plants, the surrounding environment and terrain, and the sky. Reference: `projects/coastal-cottage/design_pass.py`.
4. **Lighting and mood** from the design guide (day, golden hour, dusk, night): sun, sky, warm room lights, colour grade. Reference: `golden_hour()` in `projects/coastal-cottage/design_pass.py`.
5. **Opening** (floor plan given): the plan on a surface, then the house built brick by brick from the ground up, before the walkthrough. The build-up keyframes are in `build_film.py`.
6. Run it, read the four check renders (front, back, plan cutaway, aerial), fix, repeat.

## 6. Render the film

The site needs it, so every output renders it. Read [Blender film](references/blender-film.md) first. It has an example beat sheet, the script API, the match cut maths and every mistake already made.

1. **Doors**: point `build_film.py` at the doors on the route (made with `make_door()`).
2. **Shots**: write the `shots` list from the walkthrough guide: its start, every stop in order, and its end shot. With a floor plan, open on the plan on a surface and the build-up. Add or drop other beats (dollhouse, roof landing) only as the guide asks. Show the user the plan with numbered stops before rendering.
3. **Test** with `--test`: read the stills as one contact sheet. Fix framing, exposure, clipping and anything blocking the end shot.
4. **Look-dev stills**: render 3 full-size stills (overview, a room, the end shot) and send them for a yes before the full render.
5. **Render** the full film detached, with a monitor on progress and errors (1,040 frames at 720p take about 3.5 to 4.5 hours in the cloud). Keep the PNG frames: the site is built from them. Meanwhile, send the user the `.blend`.
6. For a style switch, render once per style.

## 7. Build the site from the film

Read [Film site](references/film-site.md) first. Template: `assets/film-site/`.

1. Copy the template into the site folder: `cp -R .claude/skills/3d-walkthrough/assets/film-site/. websites/<owner>/<site-name>/`
2. Turn the film's frames into web images with `scripts/make_frames.sh`: every frame, WebP, a desktop set (1280 wide) and a phone set (854 wide). About 28 KB a frame, so a 1,040-frame film is about 29 MB on desktop and 17 MB on phone. Every frame matters: with every 2nd frame, slow scrolling looks like a slideshow.
3. In `assets/beats.js`: the frame count and one entry per beat (start and end as a share of the film, from the beat sheet).
4. The film stays pinned full screen and plays as you scroll, with a soft blend between frames. Text panels fade in over their beat.

## 8. Write the copy

One panel per beat: hero, the plan, the build, the overview, the approach, each room, the end shot with the call to action. Short headlines, one line of support, real facts. For a client, match their voice from their materials. For unbuilt property, write the copy from the plan and the building context only, with no invented facts.

This copy is external content. Show the user the draft headlines before treating them as final.

## 9. Verify

Serve the site and screenshot it at several scroll points, desktop and phone:

```bash
cd websites/<owner>/<site-name> && python3 -m http.server 8000
node .claude/skills/3d-walkthrough/scripts/shoot.cjs http://localhost:8000/ <scratchpad>/shots
node .claude/skills/3d-walkthrough/scripts/shoot.cjs http://localhost:8000/ <scratchpad>/shots 0,0.3,0.6,1 390 844
```

Read every screenshot. Fix and reshoot until all pass:
- No console errors, no missing frames (404)
- Slow scroll holds 60 fps on a high-DPI screen (1920x1080 at 2x): see the perf check in [Film site](references/film-site.md)
- The film shows the right frame for each scroll point, forward and back
- Text is readable over every frame; panels never cover the hero view
- Panels do not overlap each other on phone
- Run the `review-animations` checklist from design-skills on the motion

Say plainly that real-device testing was not done.

## 10. Deliver

1. Write the site `README.md`: what it is, the beats, how to run, how to edit (copy, beats, re-making frames from a new render).
2. Add a row to `websites/README.md`.
3. Send the user key screenshots and list any placeholders still open, plus every assumption made (wall height, finishes, furniture for unbuilt property).
4. For `film` and `both`: also deliver `film.mp4`, the `.blend`, `floor_plan.png`, stills, and a README with the beats and rebuild commands.
5. Ask before publishing. If yes: add a copy step for the site to `.github/workflows/deploy-pages.yml` (`_site/<site-name>/`), keep the existing sites, and go through a PR to `main`. Do not change the root redirect unless asked.
6. Commit on the working branch. Suggest a `decisions/log.md` entry for any choice worth keeping.

## Rules

- Stick to the floor plan. Do not add rooms that are not drawn.
- Use placeholders for any missing contact or price details. Never invent them.
- Do not write em dashes in on-screen copy. Keep text short.
- Do not publish anywhere. The user decides when to share.
- Say what is assumed in the final message.
