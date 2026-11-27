# Sources

All from Cantinho Brasileiro's own channels. Saved 2026-11-27 with Son's OK on the picks.

| File | What | Source |
|---|---|---|
| dd-header.jpg | Studio overhead of six plates on wood (2560x1440). Hero cutout `assets/pf.webp` and the table `assets/table.webp` | Their DoorDash store header, doordash.com/store/cantinho-brasileiro-philadelphia-30996697, doordash-static.s3.amazonaws.com/media/store/header/6ab4d066-95d1-45e9-8cfd-4e5634afc69e.jpg |
| frames/tray-*.jpg | Six buffet trays (lasanha, arroz, feijoada, milanesa, batata, legumes), cropped below their caption | Reel instagram.com/reel/DcMeeqVP-rO ("POV: Você encontrou a comida brasileira mais gostosa na Philadelphia"), 1080x1920, frames at 1, 11, 12.5, 3, 7, 9 s |
| frames/feijoada.jpg | Saturday feijoada plate (top half of the split frame) | Reel instagram.com/reel/DcoOf-JB3mF, 8 s |
| frames/storefront.jpg | Their green sign "Cantinho Brasileiro, Brazilian Cuisine", Castor Ave, cropped above the caption | Reel instagram.com/reel/DZs58AHhYMY, 20.5 s |
| frames/endcard.jpg | Logo end card: navy #081C65, yellow #EFDF21. Cropped to `assets/logo.webp` | Reel instagram.com/reel/DcoOf-JB3mF, last frame |

Not used: their DoorDash dessert photos (look like stock), Instagram graphics with baked-in text, any photo of people.

Cut: `lab/cut.py` (rim mask, holes filled, convex hull). Box of the plate in the table photo is in `lab/cuts.json` and in `site.js` (`PF`). Exports: inline Python in the build log; shadow is a separate layer (`assets/pf-shadow.webp`, pad 60).
