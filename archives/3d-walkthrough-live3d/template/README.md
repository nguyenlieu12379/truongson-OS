# <Site name> (scroll walkthrough)

Scroll-driven 3D walkthrough built with the `3d-walkthrough` skill. The building is modelled in Blender and loaded as `assets/model.glb`.

## Route

1. Overview (real estate) or street (business)
2. Front door
3. <rooms...>

## Run locally

```bash
python3 -m http.server 8000
```

Open http://localhost:8000 (ES modules and the .glb need a server, not `file://`).

## Edit

- The building: edit `blender/build_model.py`, run it, copy the new `model.glb` into `assets/`.
- Copy: `index.html` panels. Keep `data-in` / `data-out` ranges from overlapping.
- Camera stops, door timing, styles: `assets/spec.js`.
- Scroll animations: `assets/site.js`.
- Brand colour: `--accent` in `assets/style.css`.
- Engine (shared across sites): `assets/engine.js`. Fix bugs in the skill template too.
