---
name: 3d-walkthrough-2
description: Demo. Turns a 2D floor plan (photo or PDF) into one self-contained Three.js HTML file that a buyer can walk through in first person (WASD + mouse), switch to a dollhouse view, change furniture style, scrub a sunset-to-night light slider, and take a guided tour with room labels and code-made background music. Also makes it client-ready (welcome screen, level switch, contact button, phone touch controls, floor plan check). Use when someone asks for a 3D home tour, walkthrough, or virtual tour from a floor plan. Also runs as /3d-walkthrough-2.
argument-hint: "[floor plan path or photo] [style: modern | scandinavian | warm luxury] [project name, address, price, contact (optional)]"
---

# 3D Walkthrough 2 (demo)

Built from a 6-step prompt series: plan, build, style, light, tour, share. Output is one HTML file, no build step, no model files, no sound files. Everything is drawn in code.

This is a demo skill. Keep changes small and test each input before adding features.

## Inputs

| Input | Required | Notes |
| --- | --- | --- |
| Floor plan | Yes | Photo or PDF of a 2D plan. Read it with the image or PDF tools. |
| Style | No | Default `modern`. Options: `modern`, `scandinavian`, `warm luxury`. |
| Project name, address, price | No | Used on the welcome screen. If missing, use clearly marked placeholders like `[Project name]`. Never invent a real address or price. |
| Contact name and phone | No | Used on the contact button. If missing, use placeholders and say so. |
| Output folder | No | Default `websites/TruongSon-demos/<project-slug>/`. Write `index.html` there. |

## Step 1: Read the plan (no code yet)

Read the floor plan carefully and write a short plan before building. Show it to the user.

- List every room with its approximate size (ft or m, as drawn).
- List every door, window, and stair, with its wall.
- Assume a wall height of 9 ft (2.7 m) unless the plan says otherwise, and state that assumption.
- Point out anything unclear, such as a missing dimension, a door swing, or a room with no label. Ask about these only if they block the build. Otherwise, make a stated assumption and move on.
- Plan the walkthrough path from the front door through each room in order.
- Plan the style and materials for each room, the lighting, and the furniture.

Stop here only if the plan cannot be read at all. Otherwise continue.

## Step 2: Build the home in 3D

Write one HTML file using Three.js. Match the plan to scale.

- Load Three.js from unpkg with an import map. Pin the exact version, for example `three@0.160.0`. Do not use an unpinned or latest URL.
- Build walls from the plan's coordinates, with openings cut for doors and windows.
- Build floors and ceilings per room. Use simple procedural materials (canvas-drawn wood or tile patterns) for a realistic feel.
- Controls:
  - First person: WASD to move, mouse to look (Pointer Lock). Keep the camera at eye height (about 5.5 ft or 1.7 m).
  - Dollhouse: one button toggles a top-down view with the roof removed. Roof and upper walls fade out in this mode.
- Add soft daylight coming through the windows.
- Add collision with walls so the camera cannot walk through them.

## Step 3: Furnish in a style, with a style switch

- Furnish every room to fit its size: a bed in the bedroom, a table and chairs in the dining room, a kitchen counter and sink, sofa and TV in the living room, and so on.
- Add rugs, art on walls, plants, lamps, and a set dining table with made beds and kitchen details.
- Materials should feel real: wood grain, stone counters, soft fabric. Use canvas textures, not photos.
- Add a style switch with three buttons (`Modern`, `Scandinavian`, `Warm luxury`). Each changes the colors, materials, and furniture set. One click updates the whole home.

## Step 4: Time of day and light

- Add a time-of-day slider from morning to sunset to night.
- Move the sun through the windows as the slider moves. Sunlight should be warm and golden at sunset.
- At night, turn off sunlight and turn on lamps and ceiling lights with a soft glow.
- Add soft shadows and a light reflection on floors and glass.
- Keep it smooth on a normal laptop. Use a limited shadow map size, few shadow-casting lights, and no per-frame allocations. Target 60 fps on a laptop, and fall back gracefully.

## Step 5: Guided tour for buyers

- Add a `Start Tour` button. The camera walks slowly from the front door through every room in order.
- Pause in each room with a small label showing: the room name, its size in square feet (convert metres if needed), and one selling point.
- Add background music made with code, using the Web Audio API. No sound files. Add a mute button.
- At the end, rise to the dollhouse view of the whole home.
- Stop the tour on any user input so buyers stay in control.

## Step 6: Make it client-ready

- Welcome screen with project name, address, and price, and a `Start` button.
- A level switch if the plan has more than one floor. For a single floor, hide it.
- A contact button with the contact name and phone. Use a `tel:` link.
- Touch controls for phones: an on-screen joystick for movement and drag-to-look. Hide the WASD hint on touch devices.
- Check every room against the floor plan. List what you checked and fix anything that does not match: wall lengths, door positions, window positions, room sizes.
- Test layout at phone width (16px side gutter, no horizontal scroll).

## Output and checks

1. Write `index.html` to the output folder. Keep everything in that one file.
2. Open it in the Playwright browser and check:
   - No console errors.
   - WASD moves the camera and the mouse looks around.
   - Dollhouse toggle works.
   - Style switch changes the look.
   - Time slider changes the light.
   - Tour runs and ends in the dollhouse view.
   - Layout works at phone width.
3. Report what passed and what did not. Do not claim something works without a check.
4. Tell the user the output path and the list of assumptions you made.

## Rules

- Stick to the floor plan. Do not add rooms that are not drawn.
- Use placeholders for any missing contact or price details. Never invent them.
- Do not write em dashes in on-screen copy. Keep text short.
- Do not publish anywhere. The user decides when to share.
- This is a demo. If something is unclear, state the assumption in the final message.
