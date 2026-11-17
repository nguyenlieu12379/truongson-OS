# Haulover Beach Cafe: resume note

Asked by Son, 2026-11-17: pick a Miami coastal cafe with no (or a bad) website, build it in Blender so it
looks like Google Maps 3D, then build the site with /3d-walkthrough. Son chose: **Google 3D Tiles only**,
**public on our Pages**, and don't ask more questions.

## Venue
- The food and beverage concession at **Haulover Park beach, 10800 Collins Ave, Miami Beach** (listed on
  a review aggregator as "B&B Haulover Beach Cafe Kiosk": food-truck style, burgers, nachos, smoothies).
- No website found. Miami-Dade's park page only says the beach has a food concession. Operator, name,
  hours and menu are unconfirmed, so they stay TODO on the site.
- Start point 25.9045, -80.1203 is approximate. `./run.sh survey` renders a top view to find the
  building, then set LAT/LON on it.

## Pipeline (built and tested with a synthetic tile)
1. `fetch_tiles.py`: walks Google's 3D Tiles tree around a point, sharp near, coarse far, carries the
   session token, saves the .glb tiles and a manifest with Google's data credits.
2. `tiles_to_blend.py`: imports into Blender (ECEF), moves to local metres (east, north, up; cafe at the
   origin, ground 0), crops, tags materials `photo`, top-view preview, exports model.glb and
   model_mobile.glb (WebP, Draco) and tiles_credit.json into the site.
3. Engine: materials with `extras.photo` render unlit with their own colours (template and site).
4. Site: `websites/TruongSon-demos/haulover-beach-cafe/`, with a concept-demo note, the Google credit
   (required), noindex, and TODOs for unconfirmed facts. The camera stops in `spec.js` are placeholders:
   set them on the real tiles (aerial from the land side, lot, walk to the counter, turn to the ocean).

## Blocked on
The Map Tiles API key. Son adds it in the environment settings as a network secret: host
`tile.googleapis.com`, header `X-Goog-Api-Key`. Google Cloud project with billing on and the Map Tiles
API enabled, and no key restrictions.

## When the key works
`./run.sh survey`, look at `work/survey_top.png`, then `LAT=.. LON=.. ./run.sh build`, set the
stops, check with shoot.cjs on desktop and phone, publish (PR and merge), send screenshots and the link.
Keep the model under about 25 MB desktop (lower --keep, --tex or raise --near-error if not).
