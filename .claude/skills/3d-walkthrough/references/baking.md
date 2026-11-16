# Baking (live 3D that looks like the render)

The site is live 3D (three.js): smooth at any scroll speed and light to load. On its own, a browser can only do simple lighting, so the Blender look is **baked**: Cycles computes the light once (sun, sky, bounce, lamp glow, soft shadows) and stores it, together with the materials (wood, tile, siding, fabric), in textures on the model. The browser shows those textures.

Reference build: the coastal cottage. Script: `projects/coastal-cottage/bake_web.py` (copy and adapt it). Surroundings: `projects/coastal-cottage/environment.py` (hill, neighbour houses, trees, palms) and `town.py` (the Miami-style road, shops, street furniture, parked cars and the beach dressing). Site: `websites/TruongSon-demos/coastal-cottage/`.

## What carries over, what doesn't

| Carries over | Doesn't |
| --- | --- |
| Materials (planks, tile, siding, metal roof, fabric) | Glossy reflections on furniture, the glossy door, marble |
| Soft shadows, bounce light, lamp glow, the golden-hour tint | Light changing over time (it's frozen) |
| The colour of each room, the sky and sun (as a panorama) | The exact film grade (matched closely, not exactly) |
| Water reflecting the sky (the site adds this live) | Shadows on things the site moves (doors, build-up) |

## How it works: two textures per bake group

- **Albedo** (sharp, sRGB, 8-bit): the material colour only. Bake type `DIFFUSE`, pass `COLOR`, 4 samples. Metals get metallic 0 for this pass, or they bake black.
- **Lightmap** (a third of the size, HDR): the light only. Bake type `DIFFUSE`, passes `DIRECT` + `INDIRECT`, 384 samples inside (192 outside). Blurred inside its islands (normalized Gaussian), then stored 8-bit as `(L / scale)` with the sRGB curve. `scale` is the 98th percentile x 1.25, so lamp hot spots clip and the rest keeps its precision. It rides in the material extras as `lm_scale`.

The site multiplies them: `MeshBasicMaterial({ map: albedo, lightMap, lightMapIntensity: lm_scale * PI })`. In the glTF, the lightmap travels as the emissive texture (glTF has no lightmap slot), and the engine moves it.

Why two textures and not one: one fully lit texture needs high resolution and lots of samples to be both sharp and noise-free. Split, the albedo is sharp with 4 samples and the lightmap can be small, smooth and blurred.

## Steps in bake_web.py

1. **Open the film's `.blend` and freeze it** at a frame where the house is complete and the doors are shut (`FREEZE = 600`): store each object's world matrix and render visibility, clear the animation, put them back. Delete film-only pieces (table, labels, camera).
2. **Add the surroundings** (`environment.add`), and cut huge ground boxes into a near piece (sharp, 4096 x 2048) and far pieces (soft).
3. **Bake groups**: per construction phase and room (structure, floors, walls, ceiling, roof, furniture inside / outside, site, near sand, far sand, hill, neighbour houses, trees), plus each door on its own.
4. **Join each group into one object with an identity transform** before baking. This is the big one: Cycles bakes selected objects one at a time at about 4 s each, so 337 pilings took 21 minutes, joined it took 7 seconds. Most pieces have their origin at the world origin, so object-space procedural textures don't move.
5. **Decimate foliage** before UVs and baking (site 0.35, trees 0.35, outdoor furniture 0.5, indoor furniture 0.6). The bake then matches the lighter mesh.
6. **UVs**: a `Bake` UV map, Smart UV Project (60 degrees; 80 for foliage), Pack Islands with a margin of 4 px (2 px for foliage). Texture size from surface area x density, rounded to the nearest power of two. Foliage gets at least 2048 px: thousands of tiny islands plus margins eat a small atlas (at 256 px, 90% of it was empty and the plants rendered black).
7. **Bake** albedo then lightmap per group (`bake_target` puts an active image node in every material of the group).
8. **Sky**: render the world (plus the ocean) as an equirect panorama from the house, 4096 x 2048, Standard view transform, to EXR. Store it like a lightmap with scale = the 99.995th percentile, so the sun disc keeps its brightness. Record which way round the sun sits (`sky_dir`) in `bake.json`.
9. **Swap materials** to one baked material per group (albedo as base colour, lightmap as emission), remove the other UV maps, join, set the origin to the bottom centre (for the grow animation), tag roles (`upper`, `site`, `door`).
10. **Glass**: join all panes into `G_Glass` (it rises with the walls). Keep the slider separate (the site animates it).
11. **Export** `model.glb` without normals (unlit materials don't need them; the engine rebuilds them for water and glass), WebP textures at quality 82, plus `sky.webp` and `bake.json`.
12. **Draco-compress** both models with gltf-transform (`npx @gltf-transform/cli@4.1.1 draco`, positions and UVs at 14 bits). Blender's pip `bpy` has no Draco library, so its own Draco option silently does nothing. The engine loads Draco models with `DRACOLoader`; the decoder is vendored in `assets/draco/`. A town is mostly geometry: 9 MB raw, about 1 MB compressed.

`--quick` runs the whole thing at low resolution in about 2 minutes. Use it to check UVs, coverage and the site before the full bake.

## In the site (spec.js)

```js
baked: true,
skyImage: 'assets/sky.webp',
bakeInfo: 'assets/bake.json',            // sky_scale and sky_dir from the bake
exposure: 0.85, insideBoost: 0.82,       // the film's exposure outside, and inside relative to it
grade: { tint: [1.08, 1.0, 0.86], power: 1.08, sat: 1.05 },   // white balance + a light 'Punchy' look
build: [{ name: 'G_Walls', at: [0.08, 0.17], how: 'grow' }, ...],   // grow | drop | pop | show
lightUp: [0.15, 0.24],                   // flat light during the build-up, then the baked light comes on
planUntil: [0.34, 0.42],                 // the floor plan on the sand fades out
doors: { Ext_Front_door2: { opensAt: [...], angle: 1.75 }, Ext_Rear_slider2: { opensAt: [...], shrink: 0.06 } },
```

The engine's tone mapping is Blender's AgX with an adjustable 'Punchy' look (three's `CustomToneMapping`). Full Punchy (power 1.35, saturation 1.4) came out far redder and more contrasty than Blender's; power 1.08 and saturation 1.05 with a warm tint matched the film best. Compare a site screenshot with a film still from the same camera before settling it.

## The build-up and baked light

The bake is of the finished house, so surfaces hidden in it (the deck under the floors, the floor under walls and furniture, the sand under the house) are dark. During a build-up opening they show as black patches. `spec.lightUp` fixes it: baked surfaces show flat light (a plain model) until the house is up, then the baked light fades in. It reads as the golden hour switching on.

For end shots with the hero view centred (a sunset), put the final card at the side: `class="panel final side"`.

## Film-style build-up (what the cottage does)

- **Floor board by board:** the bake renders a floor order map (`floor_order.png`): one grey value per board or tile, from the same plank maths as the material (`order_material` in `bake_web.py`), front boards dark, back boards light, a little random. `build: [{ name: 'G_Floors', how: 'reveal', map: 'assets/floor_order.png', at: [...] }]` discards every pixel whose value is above the scroll position, so boards appear one by one with exact edges.
- **Furniture piece by piece:** furniture is baked joined (fast), then split back into its pieces for export (a `piece` face attribute set before the join), each named `Furn_<name>` with its origin at its base. `{ prefix: 'Furn_', how: 'pop', at: [...], each: 0.2 }` pops them front to back, staggered, like the film.
- **Roof drop in view:** `dollhouseUntil` stops the dollhouse from hiding the roof, so its `drop` plays while the camera orbits. Show the ceiling as it lands.
- **Opening at about 45 degrees,** not straight down: from above, the build-up reads flat.

## Phones

The bake also writes `model_mobile.glb` (every baked texture at half size: a quarter of the GPU memory) and `sky_mobile.webp`. The engine loads them on touch screens or screens under 600 px (`spec.modelMobile`, `spec.skyImageMobile`), with a pixel ratio of 1.5 and no MSAA. The page's scroll length uses `lvh`, so it doesn't jump while the iPhone address bar hides. Check at 440 x 956 (iPhone Pro Max size).

## A town around the house

What makes surroundings read as a real place, cheaply (all boxes, cylinders and spheres):

- **Layout first, in plan feet:** beach sidewalk, road with parking lanes both sides and a double yellow, town sidewalk, a shoulder-to-shoulder shop row, cross streets with crosswalks, then the hill behind. Keep the approach camera's line of sight clear of cars and poles.
- **Shops:** a stucco box per shop, muted pastels (not toy colours), storefront glass with mullions, a kickplate, a door, a striped awning, a sign band with blocks that read as lettering, roof AC units. Three styles mixed: Art Deco (eyebrows over the windows, a vertical fin, a stepped parapet), Mediterranean (shutters, a barrel-tile pent roof) and convenience stores (one storey, wide lit glass, a big sign band, a flat canopy, an ice chest).
- **Street furniture:** cobra-head street lights, traffic lights with mast arms at the crossings, a bus shelter, benches, bins, hydrants, parking meters, café tables with parasols, planters. Palms down both sidewalks.
- **Beach dressing:** large umbrellas with mats and towels, and things on them (bags, hats, sandals, books, bottles, coolers), folding chairs, surfboards flat and stuck upright, lifeguard towers, a volleyball net. Put a deliberate cluster in the final view: random placement over a long beach left it empty on camera.
- **Shadows and shade** come from the bake for free. Give each kind its own group so the density fits: street 20 px/m, props 26, beach items 44, shops 11.
- **Cars are not boxes** (`cars.py`): loft the body from a side profile (bumper, hood, windshield, roof, rear window, trunk) with rounded cross-sections, a tapered glass greenhouse with a painted roof skin, wheels standing proud of dark arch discs, rims with spokes, lights, grille, bumpers, mirrors, door seams, plates. Four kinds (sedan, hatch, SUV, pickup) in the colours real cars come in (mostly white, silver, grey, black). Render a test row in Cycles before the bake.
- **What makes it look like Google 3D, not a toy:** variety and wear. Windows that differ pane to pane (sky reflection, dark room, curtains: Voronoi cells about a window wide), frames and mullions set proud of the wall, rain streaks and grime on the stucco, flat roofs with membrane, parapets, AC units, vents, bulkheads, solar panels and tanks (aerial views see roofs most), patched asphalt with manholes, drains, oil stains and worn paint, a grass verge.
- **Many small boxes break the atlas:** tens of thousands of tiny faces with a 4 px margin each left the town atlas 90% empty, and the town baked black. Pack those groups as rectangles (`shape_method="AABB"`) with a 1 px margin and at least 2048 px. The bake logs each group's atlas coverage; under about 20% for a group of small parts means trouble.
- **Fog:** lower it (0.0009) when the town runs a long way, or the far end turns to haze.

## Foliage that looks real

- **Shade trees:** a trunk, 3 or 4 branches, and 15 to 20 lumpy leaf clumps (jittered icospheres) in an oblate crown, with a Voronoi leaf material. The light breaking up between clumps is what sells it.
- **Palms:** each frond is one long, tapering, V-folded leaf with UVs along and across it, and a material with diagonal leaflet stripes. A chain of round blobs looks like a mushroom, and it was 6 times the faces.
- Thin foliage before the bake at 0.5. At 0.35 the crowns turned to lollipops.

## Mistakes we already made

- **Furniture exported off to the side of the house:** `matrix_world` is only refreshed on a depsgraph update, so reading it right after changing a location returns the old one. Use `matrix_basis` for objects without parents. The bake now checks every split piece against where it stood in the scene, and stops if one moved.

- **Blender's Draco option did nothing**: the pip `bpy` build lacks the Draco library and only logs an error. Compress with gltf-transform after the export.
- **Black patches during the build-up**: see above. Use `lightUp`.

- **Baking objects one by one** (21 min for one group). Join first.
- **Black plants and palms**: the foliage atlas was 90% empty margin. Bigger atlas, looser unwrap angle, smaller margin.
- **No sun disc**: the sky scale clipped the sun to the same level as its glow. Keep headroom (99.995th percentile).
- **Lightmap scale blown by a lantern**: one hot spot set the scale to 26 and the rest went dark and banded. Use the 98th percentile.
- **Black floor plan**: unbaked materials render black in baked mode (there are no lights). Give them an unlit material.
- **Shader error in the sky**: three already adds the tone-mapping and colour-space functions to a ShaderMaterial; including them again breaks the compile.
- **Blender 5**: the film leaves `image_settings.media_type` on `VIDEO`; set `IMAGE` before choosing EXR.
- **Light leaking** through thin walls: walls need real thickness and closed ends. Check corners in the bake.

## Check

- `scripts/shoot.cjs`: screenshots at every stop, desktop and phone. Compare to Cycles stills from the same camera.
- `scripts/perf.cjs`: slow scroll holds 60 fps at 1920x1080 at 2x.
- `model.glb` plus `sky.webp` under about 15 MB.
