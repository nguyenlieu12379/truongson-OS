# Standing build preferences

Defaults that pre-build offers for every new client site. Learned from Son's answers on the Delícias build (2026-11-22/23). Update this file when an answer changes a default for all future builds, not just one client.

## Who and process
- Ask "Son or Truong?" at the start. Tag the answers with the name.
- Show photo picks before saving anything.
- Commit, push and merge to main when asked. Deploy only on an explicit "make it live".

## Photos and assets
- Real photos only, from the client's own Instagram (via Claude in Chrome, signed in). No generated images unless asked.
- No photos of customers, their families or kids. No graphics with text baked in. No cut-out "stock looking" product shots.
- Never drawn "plastic" graphic objects (CSS/SVG props such as pans, bubbles, cartoon food). Son, 2026-11-23: "always stay away from the plastic graphics objects at all cost". Effects must come from real photos or footage.
- Hero food must be high resolution. If the grid only gives 640px, get the full post image or a frame from their video.
- Keep a `SOURCES.md` with the post URL for every photo.

## Hero
- Food in the hero is never covered by letters. Type can sit around it, not over it (Son, 2026-11-23).
- The hero is the product the client posts most, a real cutout (not a 3D or low-poly replica).
- The product sits one layer in front of a giant brand word. The letters it covers animate (Delícias: they wobble with the product).
- The headline stays readable.

## Style and world
- Colour split 60/30/10 (Son, 2026-11-23): 60% background, 30% most type and objects, 10% the one must-see thing (the CTA). Taken from the client's own logo, sign or avatar. Ask it in pre-build every time.
- Match the client's Instagram vibe (Delícias: "soft, cute, juicy", playful pink).
- One unbroken world (one fixed stage, the camera travels, no sections).
- Four must-haves from `websites/README.md`: one engineered peak, layered hero, real photos, no AI tells.

## UI material
- No glass venom strands (Son removed them, 2026-11-23).
- Liquid glass on every block (buttons, text cards, nav): a clear refractive lens that magnifies and bends what's behind it along the edges and corners, with a thin specular rim. No blur, no frost.
- A lens follows the cursor and bends the light under it; the rim light follows the cursor; buttons lean toward it.
- Buttons may keep a colour tint so the label reads.

## Motion and performance
- Smooth beats effects. If it lags, cut the effect's cost before cutting the effect.
- No per-frame layout reads after style writes; no animated SVG filters; no backdrop filters on moving elements.
- Check on a real phone before the client sees it.

## Facts
- Only facts from the client's own listing or Instagram. No invented prices or stats.
- Flag any conflict (Delícias: two WhatsApp numbers, two sets of hours) for confirmation.

## Deploy
- GitHub Pages via `.github/workflows/deploy-pages.yml`, one folder per site, `noindex` until the client signs.
