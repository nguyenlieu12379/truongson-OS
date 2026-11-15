# Baking (live 3D that looks like the render)

The site is live 3D (three.js): smooth at any scroll speed and light to load. On its own, a browser can only do simple lighting, so the Blender look is **baked**: Cycles computes the light once (sun, sky, bounce, lamp glow, soft shadows) and stores it, together with the materials (wood, tile, siding, fabric), in textures on the model. The browser shows those textures.

Reference build: the coastal cottage. Script: `projects/coastal-cottage/bake_web.py` (copy and adapt it). Surroundings: `projects/coastal-cottage/environment.py`. Site: `websites/TruongSon-demos/coastal-cottage/`.

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

## Mistakes we already made

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
