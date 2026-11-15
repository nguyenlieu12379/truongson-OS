# Baking (live 3D that looks like the render)

The site is live 3D (three.js): smooth at any scroll speed and light to load. On its own, a browser can only do simple lighting, so the Blender look is **baked**: Cycles computes the light once (soft shadows, bounce light, lamp glow, the golden-hour tint) and paints it, together with the materials (wood, tile, siding, fabric), into image textures on the model. The browser just shows those textures.

Status: **not yet run in this setup.** The first build is the coastal cottage (`projects/coastal-cottage/`). Update this page with what actually worked.

## What carries over, what doesn't

| Carries over | Doesn't |
| --- | --- |
| Materials (planks, tile, siding, metal roof, fabric) | Moving reflections (water, glossy door, marble, glass) |
| Soft shadows, ambient occlusion, bounce light | The live sky and clouds (they become a painted backdrop) |
| Lamp glow on nearby surfaces, sunset tint | Light changing over time (it's frozen) |
| The colour of each room | The film's colour grade and softness, unless matched in the engine |

## Steps (in Blender, after design and lighting)

Put them in `blender/bake_web.py`, run after `build_model.py`.

1. **Freeze the design.** Apply modifiers. Decide the **bake groups**: join static meshes per construction phase and room (pilings, floor, walls, roof, kitchen furniture, great room furniture...). Doors, sliders and anything the site animates stay separate objects. Phases stay separate so the site can still play the build-up opening.
2. **Bake UVs.** Add a second UV map named `Bake` on each group (Smart UV Project, island margin about 0.02, or Lightmap Pack). Keep the original UVs for the materials.
3. **Images.** One image per group, 2048 px (4096 for the biggest floors and walls). Aim for even detail: a sofa should not get more pixels per metre than the floor.
4. **Bake.** Cycles, bake type `DIFFUSE` with direct, indirect and colour (no glossy: it depends on where you stand). 128 to 256 samples. Lamps and glowing shades: bake `EMIT` into the same image or set them unlit in the site. Denoise the baked images (compositor Denoise node) if they're grainy.
5. **Swap materials.** Each group gets one simple material whose base colour is its baked image, on the `Bake` UVs.
6. **Sky.** Render the world as a panorama (equirectangular camera at the house's centre, eye height) to `sky.webp`. The site shows it on a background sphere.
7. **Export** `model.glb` with WebP textures (`export_image_format='WEBP'`). Target 5 to 15 MB in total.

Glass is not baked: the site swaps any `Glass*` material for its cheap transparent glass. Water can stay baked (static) or get a simple animated shader in the site.

## In the site (engine changes needed on the first build)

- `spec.baked = true`: the engine uses unlit materials (`MeshBasicMaterial` with the baked map) and skips the model's point lights and the sky light, so light isn't added twice.
- `spec.skyImage`: the baked panorama as the background.
- Build-up opening: animate the phase groups (grow from the ground, pop furniture) on scroll, then the dollhouse overview and the walk.
- Colour: AgX-like tone mapping off for unlit maps (the bake already holds the final colour), `outputColorSpace = SRGB`.
- Style switch: recolouring breaks baked light. Each style needs its own bake. Off by default.

## Mistakes to avoid

- **Light leaking** through thin walls and under floors. Walls need real thickness and closed ends; check corners in the bake.
- **Seams and black edges** on islands: raise the island margin and the bake margin (16 px).
- **Blurry or blocky surfaces:** uneven texel density. Fix the UV scale before raising image size.
- **Bake time:** hours on the cloud CPU. Bake at low samples first to check UVs and leaks, then the final bake detached with a monitor.

## Check

- `scripts/perf.cjs`: slow scroll holds 60 fps at 1920x1080 at 2x (median 16.7 ms, nothing over 25 ms).
- `scripts/shoot.cjs`: screenshots at every stop, desktop and phone. Compare each to a Cycles still from the same camera.
- `model.glb` plus `sky.webp` under about 15 MB.
