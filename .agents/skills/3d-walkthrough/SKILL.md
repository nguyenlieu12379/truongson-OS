---
name: 3d-walkthrough
description: Use when someone asks for a scroll-based 3D walkthrough website of a one-floor place. Real estate and rentals open on a dollhouse overview of the whole home, then descend to the front door. Businesses (cafe, shop, restaurant, bar, bnb, salon, studio) open on the street, walk to the front door, then go in. Inputs are a floor plan, photos and footage, building context, and a walkthrough guide (a line drawn on the plan, or text describing the scroll POV). Unbuilt property with no photos is built from the floor plan alone, with interior design. Also runs as /3d-walkthrough.
argument-hint: "[place name] [floor plan] [photos/footage + manifest] [context] [walkthrough guide]"
---

# 3D Walkthrough

Build a scroll-driven 3D website of a one-floor place. As the visitor scrolls, the camera walks them through the building, and each room gets text and one animated moment. The building is modelled in code with three.js. Where the client has real photos, those photos go onto the surfaces they show, so the scene looks like the real place.

Reference build: `websites/TruongSon-demos/forno-notte/` (pizzeria, street to oven). The starter template in `assets/template/` is a generalised version of it.

## 0. Load the design skill. Every run.

Before writing any code, read the design-skills pack. It sets the quality bar for type, motion and UI on these sites.

1. `.claude/skills/design-skills/skills/emil-design-eng/SKILL.md` (entry point)
2. `.claude/skills/design-skills/skills/apple-design/SKILL.md` (springs, materials, typography, reduced motion)
3. `.claude/skills/design-skills/skills/choreograph/SKILL.md` (sequencing panels and scene beats)
4. `.claude/skills/design-skills/ui-cheatsheet.md` and `performance-cheatsheet.md`

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

- **`dollhouse-open`**: real estate, rentals, a home for sale or let. The scroll opens on a high overview of the whole home, then the camera descends to the front door and walks room by room.
- **`street-open`**: any one-floor business (cafe, shop, restaurant, bar, bnb, salon, studio). The scroll starts on the street, walks to the front door, then goes in. No dollhouse.

If the place type is unclear, ask.

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
- The camera moves along the stops only. There is no free walking, so collision only needs to hold along that path.
- **`dollhouse-open`:** the first one or two stops are a high overview of the whole home, above the roof, then the path descends to the front door.
- **`street-open`:** the first stops are outside on the street, then the path reaches the front door, then goes in.

Interior design for unbuilt property follows step 3 of the original 3d-walkthrough-2 method: furnish each room to fit its size (bed in the bedroom, table and chairs in the dining room, kitchen counter and sink, sofa and TV in the living room). Add rugs, art, plants and lamps. Materials should feel real, drawn in code. The style switch is not part of this skill.

Show the user a top-down sketch of the plan with the route before building: a small SVG or ASCII plan with walls, doors and numbered stops. Get a yes or corrections. This is the cheapest place to catch a wrong layout.

## 4. Scaffold

```bash
cp -R .claude/skills/3d-walkthrough/assets/template websites/<owner>/<site-name>
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

Lessons that save time are in [build notes](references/build-notes.md). Read them before step 5.

## 6. Write the copy

One panel per stop group: hero, approach, entrance, each room, final call to action. Short headlines, one line of support, real facts. Stats cards and step lists that light up (`data-at`) work well. For a client, match their voice from their materials. For unbuilt property, write the copy from the plan and the building context only, with no invented facts.

This copy is external content. Show the user the draft headlines before treating them as final.

## 7. Verify

Serve and screenshot every stop at desktop and phone sizes:

```bash
cd websites/<owner>/<site-name> && python3 -m http.server 8000
node .claude/skills/3d-walkthrough/scripts/shoot.cjs http://localhost:8000/ <scratchpad>/shots
node .claude/skills/3d-walkthrough/scripts/shoot.cjs http://localhost:8000/ <scratchpad>/shots 0,0.3,0.6,1 390 844
```

Read every screenshot. Fix and reshoot until all pass:
- No console errors
- Each stop matches the plan and, where there are photos, the photo (layout, palette, hero object visible)
- Photos sit on the right surface and are not stretched or cut wrong
- Camera never clips through a wall or furniture; doors open before the camera reaches them
- `dollhouse-open`: the overview shows the rooms from above, and the roof is gone from that view
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

## Rules

- Stick to the floor plan. Do not add rooms that are not drawn.
- Use placeholders for any missing contact or price details. Never invent them.
- Do not write em dashes in on-screen copy. Keep text short.
- Do not publish anywhere. The user decides when to share.
- Say what is assumed in the final message.
