---
name: 3d-walkthrough
description: Use when someone asks for a scroll-based walkthrough website or walkthrough video of an F&B venue (restaurant, cafe, coffee shop, bar). The venue is always open and real. Blender builds only its structure as plain clay along a camera route (street, door, inside, hero spot). Real photos of every corner give the look; AI models paint the photos onto the clay clips so each clip looks like the real place. The website plays one short clip per chapter as the visitor scrolls. Also runs as /3d-walkthrough.
argument-hint: "[venue name] [route] [photos of every corner] [building context]"
---

# 3D Walkthrough (F&B)

Build a scroll-driven walkthrough of an F&B venue: street, door, inside, hero spot. Blender builds the shape, real photos give the look, AI renders the clips, the site plays them on scroll.

- **Clients:** F&B only (restaurants, cafes, coffee shops, bars), always open venues with real photos.
- **Blender = structure only.** Plain grey clay: walls, doors, furniture as simple blocks, and the camera route. No materials, textures, lights, sky or decor. This keeps the model light and quick to build.
- **Real photos = the design.** Every surface's look comes from photos of the venue.
- **AI models = the render.** An AI image model paints the photos onto a clay frame; an AI video model (Wan2.1 VACE on Kaggle's free GPU, step 6) carries that look through the clay clip.
- **Site = clips, not a film.** One short clip per chapter, triggered by scroll, so slow scrolls never stutter.

Reference: the Il Dante Caffe test (`projects/il-dante/`): clay clips from its model, Google Maps photos as the design wrap. The previous method (designed and baked in Blender, `references/baking.md`) and the film-frame site (`archives/3d-walkthrough-film-site/`) are kept for reference only.

## 0. Load the design skill

Before any site code, read the design-skills pack: `.claude/skills/design-skills/skills/emil-design-eng/SKILL.md`, then `apple-design`, `choreograph`, `animate`, `animation-performance`, and `ui-cheatsheet.md`. Use `review-animations` in step 9.

## 1. Collect

- **Route:** street, to the door, inside, to the hero spot (espresso machine, oven, bar). Ask for it if missing.
- **Google Maps satellite view** for the building footprint and the street around it.
- **Real photos of every corner:** street, frontage, entrance, dining room, bar or counter, patio, hero spot. Each shot of the route needs photos that show it. Sharp photos only: no text or stickers on glass, no heavy reflections, no people in front.
- **Building context:** name, hours, address, menu, booking link. Never invent these; use `TODO:` placeholders.
- **Output:** `site` (default), `film`, or `both`.

Where the photos come from:
- **Paying client:** send the owner `references/photo-brief.md` (a 10-minute phone shot list, walking order). Their photos are the only ones we publish.
- **Pitching a venue that isn't a client yet:** `node scripts/maps_photos.cjs "<venue and address>" <scratchpad>/photos` saves the photos Google Maps shows (signed out: a handful, mostly inside; no Street View). Tests and pitches only, never published.

Also ask, if not obvious: owner folder for `websites/<owner>/<site>/`, and who is asking (Son or Truong) for decision logging.

## 2. Plan the route

Draw a rough top-down layout from the photos and the satellite view (a small SVG or ASCII plan: walls, door, counter, seating). Mark numbered camera stops at eye height (1.6 to 1.7 m), at least 0.6 m from walls, turning 90 degrees or less between stops. Show it and get a yes before building.

## 3. Build the shape (Blender, clay only)

Write the scene as a script, `projects/<venue>/build_scene.py` (plain `bpy`), so it rebuilds the same way anywhere. Then run it one of two ways:

- **Blender MCP connected** (a local session on Son's or Truong's computer with the Blender desktop extension or `blender-mcp`; tools like `execute_blender_code`, `get_scene_info`, `get_viewport_screenshot`). Prefer this when the tools are present:
  1. Ask before touching the open Blender file: save it, or start a new file.
  2. Run the script inside that Blender: `execute_blender_code` with `exec(open(r"<absolute path to build_scene.py>").read())`. Keep each call short; for big scenes run the script in parts (site, building, interior, props).
  3. Check with `get_scene_info` and `get_viewport_screenshot` from the route's stops. Fix and rerun.
  4. Save to `projects/<venue>/work/<venue>_clay.blend`.
- **No Blender MCP** (cloud session, or Blender not connected): `python3 -m venv <scratchpad>/bl && <scratchpad>/bl/bin/pip install bpy`, then `<scratchpad>/bl/bin/python projects/<venue>/build_scene.py --out projects/<venue>/work/<venue>_clay.blend`.

Check which one the session has before step 3. Don't ask the user to switch: a cloud session handed off while their computer is off uses the second way.

- Street, sidewalk, the building and its neighbours as blocks; then walls, openings, door (origin on the hinge so it can swing), counter, bar, stools, tables, shelves, pendants, plants.
- Size everything from the photos with standard sizes: door 0.9 m wide and 2.1 m high, counter 1 m high, bar 1.05 m, bar stool 75 cm, table 75 cm, ceiling about 3 m.
- One clay material for everything. Glass is left out (openings read as open), so the inside shows through the storefront.
- Keep it light: low-poly plants and props, no bevels, no textures.

## 4. Render the clay clips

- Camera path through the stops (smooth curve, gentle ease in and out), 24 fps, 1280x720, about 52 degrees vertical field of view.
- Render with Workbench (flat clay with cavity and shadow).
    - **Blender MCP:** render in the user's Blender on their graphics card, a frame range per `execute_blender_code` call (about 24 to 48 frames, so no call times out): set `scene.frame_start`/`frame_end`, `render.filepath` to `projects/<venue>/work/clay/f_`, then `bpy.ops.render.render(animation=True)`. Seconds a frame or less.
    - **Headless (cloud):** `apt-get install -y libegl1 libegl-mesa0 libgl1-mesa-dri` and run with `EGL_PLATFORM=surfaceless`. About 10 s a frame on CPU, so a 10 s route takes about 40 minutes: fine for an unattended run.
- Render the whole route as **one continuous camera path**, then cut it into shots of 5 s or less (121 frames), one per stop pair: street to door, door to inside, inside to counter, and so on.
- **Clips must join cleanly.** Each clip starts on the exact frame where the previous one ends, at the same walking speed. No ease-out at the end of one clip and ease-in at the start of the next, and no overlap: either one reads as the camera stopping. If shots were rendered separately, find the matching frame (smallest image difference), cut there, and drop frames from any slow tail so the per-frame motion matches across the join. `ffmpeg -framerate 24 -i f_%04d.png -c:v libx264 -crf 16 -pix_fmt yuv420p shot.mp4`.
- Check a start, middle and end contact sheet of each shot: no jumps, no camera inside walls, furniture all there.

## 5. Paint the first frame

For each shot: first clay frame + the 2 or 3 real photos that show that spot, into an AI image model. Ask it to keep the clay frame's geometry and camera exactly and take materials, colours, finishes and light from the photos. Check the result against the photos: same layout, real look, no stray text or people.

## 6. Make the real clips

For each shot: the clay clip (motion and structure) + 1 to 3 real photos of that spot (look) + the painted first frame (optional) into the AI video model.

**Model: Wan2.1 VACE 1.3B** (`ali-vilab/VACE`, Apache-2.0) on Kaggle's free GPU (about 30 GPU hours a week). Scripts: `assets/vace/`.
- `run_vace.py` turns the clay clip into a depth video, uses it as the control (layout and camera move), takes the photos as reference images (materials, colours, light), and fixes frame 0 to the painted frame when given. Output: 832x480 at 16 fps.
- Job folder per shot: `clay.mp4`, `refs/*.jpg`, optional `first.png` and `prompt.txt` (one line about the place).
- Run: `bash assets/vace/push_and_fetch.sh <job_dir> <out_dir> <kaggle_username>`. It uploads the job as a private Kaggle dataset, runs `run_vace.py` on a GPU, waits, and downloads `out.mp4` and `depth.mp4`.
- One-time setup: a free Kaggle account with a verified phone (needed for GPU and internet), then an API token (Kaggle Settings, API, Create New Token). In cloud sessions, add the token through the secure credential form for `www.kaggle.com`, never in chat. `pip install kaggle`.
- Untested on Kaggle so far: the first real run is the test. If the T4 runs out of memory, pass `--offload` or fewer `--frames` (edit the kernel command in `run_vace.py`'s defaults).
- To swap models later, keep the job folder format and replace `run_vace.py`.

Check every clip against its photos and the clay clip: layout holds, nothing drifts or melts, the look matches the venue. Redo the ones that fail.

## 7. Build the site

Scroll triggers each clip, it doesn't scrub it. Reference build: `websites/TruongSon-demos/corner-crema-mockup/` (copy its script for the player).

- **One clip per chapter.** Scrolling into a chapter plays its clip at normal speed; scrolling back plays it in reverse.
- **Loaded per chapter.** 1 to 3 MB per clip, preload only the next one. About 10 to 20 MB in total.
- **Queued, never skipped.** Clips play in route order. When the visitor scrolls several chapters ahead (or back), each queued clip speeds up (1x plus 0.75x per chapter still to go, up to 3x) so the camera catches up without cutting. Turning around mid-clip reverses from that exact frame.
- **Seamless hand-off.** Each clip starts on the previous clip's last frame. Pre-seek the next clip, show it only once its first frame is painted (`requestVideoFrameCallback`, else the `playing` event), then hard-cut. No cross-fade: fading both videos shows the background between them.
- **Reverse by stepping.** Browsers don't play video backwards: step `currentTime` back each animation frame using the real clock (`performance.now()`), waiting while a seek is in flight.
- **Load clips into memory.** `fetch` each clip and play it from a blob URL. Seeking and reverse need byte-range support, which not every host gives; a blob always seeks.
- **Seek-ready encoding.** Every frame a keyframe (ffmpeg `-g 1`), so reverse and jumps are instant. A smaller set for phones (854 px wide).
- **Scrubbed hero moments only.** One or two moments tied 1:1 to scroll (the espresso pour, the door opening): add in-between frames with RIFE (24 to 60 fps) and play them as a preloaded WebP frame sequence on a canvas.
- **Reduced motion:** show each chapter's painted still instead of the video.
- One short text panel per chapter: name, what's there, the hero line. Show the user the draft headlines before treating them as final.

## 8. Film (output `film` or `both`)

Join the real clips in route order with short cross-fades: `ffmpeg` concat. Deliver the MP4 and the clay `.blend`.

## 9. Verify

Serve the site and check every chapter at desktop (1280x720) and phone (390x844): clips play and reverse smoothly, no console errors, text readable over the video, every clip matches its photos. Run the `review-animations` checklist. Say plainly that real-device testing was not done.

## 10. Deliver

Site `README.md` (route, clips, how to swap a clip), a row in `websites/README.md`, screenshots, open `TODO:` placeholders and assumptions. Show the client. Publish only after a yes, through a PR to `main`. Suggest a `decisions/log.md` entry for any choice worth keeping.

## Rules

- F&B venues only, always real and open. Every look comes from real photos.
- No design work in Blender: clay structure and the route only.
- Never invent prices, hours, phone numbers or addresses. Use `TODO:` placeholders.
- Never publish third-party photos or clips made from them.
- No em dashes in on-screen copy. Keep text short.
- Do not publish anywhere. The user decides when to share.
- List every assumption in the final message.
