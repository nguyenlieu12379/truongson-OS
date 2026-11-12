---
name: scroll-base-walkthrough
description: Use when someone asks to build a scroll-based 3D walkthrough website for a one-floor building (restaurant, cafe, bar, bnb, house, shop, salon, studio), where scrolling walks the visitor from outside, through the door, room by room. Inputs are an optional floor plan, photos or footage of each place, and a walkthrough guide (text or a line drawn on the plan). Also runs as /scroll-base-walkthrough.
argument-hint: "[business name] [paths to floor plan, photos, footage, or walkthrough notes]"
---

# Scroll-Base Walkthrough

Build a scroll-driven 3D website of a real one-floor building. The visitor starts outside, walks in, and moves room by room as they scroll. Each room gets text panels and one animated hero moment. The whole building is modelled in code with three.js, using the client's photos and footage as reference. No model files, no photo textures pasted on walls.

Reference build: `websites/TruongSon-demos/forno-notte/` (pizzeria, street to oven). The starter template in `assets/template/` is a generalised version of it.

## 0. Load the design skill. Every run.

Before writing any code, read the design-skills pack. It sets the quality bar for type, motion and UI on these sites.

1. `.claude/skills/design-skills/skills/emil-design-eng/SKILL.md` (entry point)
2. `.claude/skills/design-skills/skills/apple-design/SKILL.md` (springs, materials, typography, reduced motion)
3. `.claude/skills/design-skills/skills/choreograph/SKILL.md` (sequencing panels and scene beats)
4. `.claude/skills/design-skills/ui-cheatsheet.md` and `performance-cheatsheet.md`

Use `review-animations` in step 7. Apply what they say over anything in this file that conflicts.

## 1. Collect the inputs

Required:
- **Photos or footage of every place on the route.** Outside frontage, entrance, each room, the hero spot (oven, bar, bed, chair).
- **Walkthrough guide.** Either text ("enter, turn left to the bar, then the patio") or a line drawn on the floor plan.

Optional but useful:
- **Floor plan** (image or PDF). Any sketch works. If it has no scale, ask for one known measurement (door width, room length).
- **Brand:** logo, colours, fonts.
- **Facts for the copy:** hours, address, menu or rooms with prices, booking link, 3 numbers worth bragging about.
- **Mood:** time of day (`dusk`, `night`, `day`, `golden`) and street or garden frontage.

Ask for what is missing with the host's question tool, a few questions at a time. Never invent facts like prices, hours or addresses. Use clearly marked placeholders (`TODO: hours`) and list them at the end.

Also ask, if not obvious: owner folder name for `websites/<owner>/<site>/` and who is asking (Son or Truong) for any decision logging.

## 2. Study the place

Look at every image. For footage, pull frames first into the scratchpad:

```bash
mkdir -p <scratchpad>/frames && ffmpeg -i <video> -vf "fps=1/2,scale=1280:-1" <scratchpad>/frames/<name>_%03d.jpg
```

Then write `brief.md` in the site folder, one section per place:
- Rough size (metres) and ceiling height
- Floor, wall and ceiling finishes, with hex colours sampled from the photos
- Furniture and fixtures with rough positions (left wall, centre, by the window)
- Light sources and their colour (warm pendants, daylight windows, neon)
- The **hero object** of the room and the scroll moment for it (pizza built and baked, cup filling, bed turned down, door opening to the patio)

Keep it short. It is the checklist you build against and verify against.

## 3. Plan and route, confirmed before building

Turn the floor plan (or, without one, the photos plus guide) into `assets/spec.js`. Read [spec reference](references/spec-reference.md) for the format. Key rules:
- Units are metres. x right, z toward the street, y up. The front facade is the max z edge.
- Walls are segments. Trace the outer walls counter-clockwise seen from above with the street at the bottom. Openings are `door`, `window` or `pass`.
- Rooms are floor rectangles with finishes and light colour.
- Camera stops follow the walkthrough guide. Eye height 1.6 to 1.8 m. Pass through door centres. Keep the camera at least 0.6 m from walls.

Show the user a top-down sketch of the plan with the route before building: a small SVG or ASCII plan with walls, doors and numbered stops. Get a yes or corrections. This is the cheapest place to catch a wrong layout.

## 4. Scaffold

```bash
cp -R .claude/skills/scroll-base-walkthrough/assets/template websites/<owner>/<site-name>
```

Template files:
- `index.html`: text panels with `data-in` / `data-out` scroll ranges, brand in the nav
- `assets/spec.js`: floor plan, rooms, exterior, camera stops (chapters in the nav come from stops with `chapter`)
- `assets/site.js`: furniture, props and per-room scroll animations
- `assets/engine.js`: builds the building, camera spring, panels, reduced motion. Do not fork per site unless a feature is missing; if it is, add it to the template engine too so the next build gets it.
- `assets/style.css`: set `--accent` and `--accent-2` from the brand
- `assets/three.module.min.js`: vendored three.js r169 (MIT)

Replace the example cafe completely. Nothing from "Little Hour Coffee" should survive.

## 5. Build the scene

Work outside in, following the route:
1. Exterior: kind, sky, facade, sign text. Match the frontage photo.
2. Walls and openings from the plan. Check the doors open at the right scroll range.
3. Rooms: finishes and lights from `brief.md`.
4. Props from the prop library (`ctx.props`: tables, chairs, counters, shelves, sofas, beds, plants, pendants, rugs, wall boards, espresso machine). Build custom pieces with `box`, `cyl`, `glow` when the library lacks one. Aim for the photo's layout and palette, not every object.
5. One hero moment per major room in `site.js`'s update function, driven by scroll progress `p` (use `seg`, `smooth`, `easeOut`). Small, physical, readable.

Lessons that save time are in [build notes](references/build-notes.md). Read them before step 5.

## 6. Write the copy

One panel per stop group: hero, approach, entrance, each room, final call to action. Short headlines, one line of support, real facts. Stats cards and step lists that light up (`data-at`) work well. Match `references/voice.md` for our own work; for a client, match their voice from their materials.

This copy is external content. Show the user the draft headlines before treating them as final.

## 7. Verify

Serve and screenshot every stop at desktop and phone sizes:

```bash
cd websites/<owner>/<site-name> && python3 -m http.server 8000
node .claude/skills/scroll-base-walkthrough/scripts/shoot.cjs http://localhost:8000/ <scratchpad>/shots
node .claude/skills/scroll-base-walkthrough/scripts/shoot.cjs http://localhost:8000/ <scratchpad>/shots 0,0.3,0.6,1 390 844
```

Read every screenshot. Fix and reshoot until all pass:
- No console errors
- Each stop looks like its photo (layout, palette, hero object visible)
- Camera never clips through a wall or furniture; doors open before the camera reaches them
- No room is too dark or blown out; text is readable over the scene
- Panels do not overlap each other or the hero object on phone
- Run the `review-animations` checklist from design-skills on the motion

Headless rendering uses software GL and is slow; the script waits for the camera to settle. Say plainly that real-device testing was not done.

## 8. Deliver

1. Write the site `README.md`: what it is, the route, how to run, how to edit (copy, stops, animations).
2. Add a row to `websites/README.md`.
3. Send the user key screenshots and list any placeholders still open.
4. Ask before publishing. If yes: add a copy step for the site to `.github/workflows/deploy-pages.yml` (`_site/<site-name>/`), keep the existing sites, and go through a PR to `main`. Do not change the root redirect unless asked.
5. Commit on the working branch. Suggest a `decisions/log.md` entry for any choice worth keeping.
