# Standing build preferences

Defaults that pre-build offers for every new client site. Learned from Son's answers on the Delícias build (2026-11-22/23). Update this file when an answer changes a default for all future builds, not just one client.

## Who and process
- Ask "Son or Truong?" at the start. Tag the answers with the name.
- Show photo picks before saving anything.
- Commit, push and merge to main when asked.
- Deploy: go live on GitHub Pages (noindex) when the build is done (Son, 2026-11-25). Before that date it needed an explicit "make it live".

## Photos and assets
- Cutouts only from photos where the whole dish is in frame with nothing in front of it (no fries, hands, glasses, frame edge). View the cutout alone at full size on white and on black and compare every edge with the original before using it. Missing parts = pick another photo (Son, 2026-11-25, El Budare).
- Real photos only, from the client's own Instagram (via Claude in Chrome, signed in). No generated images unless asked.
- No photos of customers, their families or kids. No graphics with text baked in. No cut-out "stock looking" product shots.
- Never drawn "plastic" graphic objects (CSS/SVG props such as pans, bubbles, cartoon food). Son, 2026-11-23: "always stay away from the plastic graphics objects at all cost". Effects must come from real photos or footage.
- Hero food must be high resolution. If the grid only gives 640px, get the full post image or a frame from their video.
- Keep a `SOURCES.md` with the post URL for every photo.
- Photos are Claude's call by default (Son, 2026-11-25): high res, and the object inside must fit the shape of the frame it's cut to. Never crop through the dish; pick the frame shape from the photo, not the other way round.

## Hero
- Cut the hero from a high-res photo of their signature item (clip along its real edge), like the Delícias pudim. A flat photo hero reads as "too simple" (Son, 2026-11-24).
- Food in the hero is never covered by letters. Type can sit around it, not over it (Son, 2026-11-23).
- The hero is the product the client posts most, a real cutout (not a 3D or low-poly replica).
- The product sits one layer in front of a giant brand word. The letters it covers animate (Delícias: they wobble with the product).
- The headline stays readable.
- Hero cutout and the cursor (Son, 2026-11-24, Pakachi): it leans toward the pointer around its own centre, about 8deg up/down and 11deg sideways. Direct: no inertia or spring, no light sheen, no slide, and the wordmark behind it stays still. Keep enough overscan that cut edges never show.

## Style and world
- Hero: centre focus with constant motion. The hero subject sits in the middle and keeps moving even with no scroll (breathing, bobbing, slight lean), like Brazilian Taste, Pakachi and Sweets. An off-centre hero with a text column on the side reads "a little off" (Gochón, 2026-11-25).
- No fades between scenes. Each scene's end builds the next one's start: a frame grows out of an object in the last scene, a label slides onto its next anchor, a pan carries on, a photo rolls up over the last. Fading things in and out reads as cuts (Gochón, 2026-11-25).
- No instant pops either. Nothing may vanish or appear from one frame to the next (a visibility switch, a swap of one element for another that doesn't match pixel for pixel). Every piece leaves or arrives by motion: slides off an edge, rolls out, shrinks into or grows out of another object, or is covered by something that moves over it. Estação do Pão went to A for this (Son, 2026-11-28).
- Prefer real cutouts over a line of copy where a list of products would go (Gochón: the five pieces with name and price replaced the "Tequeños, empanadas..." sentence).
- Fill blank space with a few real product cutouts drifting slowly through each scene, placed clear of text. Not a nav, not widgets (Gochón, 2026-11-25).
- No header nav of blocky tags or a progress timeline: "useless". The bar is wordmark, CTA, theme toggle (Gochón, 2026-11-25).
- Serious business, not playful: confident text faces, no novelty or cartoon display fonts, brand colour used with restraint (Son, 2026-11-25, El Budare).
- Value before motion: every scene answers a customer question (what to order with real names and prices, hours, where, why people come back). Motion and widgets without content read as empty (Son, 2026-11-25).
- Frame shapes follow the dish: tall frames for dishes shot vertical (lunch boxes, long tables), wide for tray rows, square for bowls. Never crop everything to one landscape shape (Son, 2026-11-24).
- "Unbroken" means each scene turns into the next (cells fly apart, photos grow into the next layout). A layer that just scrolls up out of view is a break (Son, 2026-11-24).
- Add related motion so it isn't boring: real cutouts drifting, dish-name lines, counters, lines drawing in. Never drawn props.
- Background: a light, clean ground nobody notices (neutral off-white, not beige; near-black in dark mode). No saturated or shifting background colour: "the background mustn't be noticable color, make it light, so it looks clean, not AI slops" (Son, 2026-11-25, El Budare). Brand colour lives in the photos, the type at full strength and the CTA.
- Colour split 60/30/10 (Son, 2026-11-23): 60% background, 30% most type and objects, 10% the one must-see thing (the CTA). Taken from the client's own logo, sign or avatar. Ask it in pre-build every time.
- Match the client's Instagram vibe (Delícias: "soft, cute, juicy", playful pink).
- One unbroken world (one fixed stage, the camera travels, no sections). Default (Son, 2026-11-25): "zero cut, zero scrolling, just motion graphics". Nothing ever scrolls up the page; scroll only drives motion on a fixed stage.
- Four must-haves from `websites/README.md`: one engineered peak, layered hero, real photos, no AI tells.

## UI material
- CTA buttons carry a little motion: a light sweep across the pill every few seconds and a WhatsApp bubble with typing dots (Gochón, 2026-11-25).
- The light/dark toggle always sits in the bar's far corner. The travelling button docks beside it, so the toggle never floats mid-bar when the button is elsewhere (Son, 2026-11-25).
- Cursor ball: the Espresso Vivace ball, exactly: its size (112px), its style (rim, highlight, dark inner edge, gloss, drop shadow) and its motion (spring stiffness 0.14, damping 0.72, stretch speed x 0.018, max 0.42; see `builds/espresso-vivace/site.js`). The Brazilian Taste drag is no longer the default: "too fluid" (2026-11-24, Sweets by Carla G pre-build). Don't resize, restyle or re-tune it unless asked. Liquid glass with a clear lens plus this ball is the default UI material (Son, 2026-11-25).
- No glass venom strands (Son removed them, 2026-11-23).
- Liquid glass on every block (buttons, text cards, nav): a clear refractive lens that magnifies and bends what's behind it along the edges and corners, with a thin specular rim. No blur, no frost.
- A lens follows the cursor and bends the light under it; the rim light follows the cursor; buttons lean toward it.
- Buttons may keep a colour tint so the label reads.

## Motion and performance
- Spins, rolls and carousels glide continuously: ease in, build, ease out, at most a slight slow-down at each item. Never turn-stop-turn steps ("stiff"). Give a fast peak more scroll room so it reads at normal scroll speed (Sweets by Carla G, 2026-11-24).
- Size tweaks asked as "bigger" mean a little, not a redesign ("no not that dramatic, just slightly bigger", 2026-11-24).
- Super smooth, never stiff, is the default for every build (Son, 2026-11-25).
- Smooth beats effects. If it lags, cut the effect's cost before cutting the effect.
- No per-frame layout reads after style writes; no animated SVG filters; no backdrop filters on moving elements.
- Check on a real phone before the client sees it.

## Facts
- English only on the page by default (Son, 2026-11-25).
- Only facts from the client's own listing or Instagram. No invented prices or stats.
- Flag any conflict (Delícias: two WhatsApp numbers, two sets of hours) for confirmation.

## Deploy
- GitHub Pages via `.github/workflows/deploy-pages.yml`, one folder per site, `noindex` until the client signs.
