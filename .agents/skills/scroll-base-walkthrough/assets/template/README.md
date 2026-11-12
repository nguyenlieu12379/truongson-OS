# <Site name> (scroll walkthrough)

Scroll-driven 3D walkthrough built with the `scroll-base-walkthrough` skill.

## Route

1. Outside
2. Entrance
3. <rooms...>

## Run locally

```bash
python3 -m http.server 8000
```

Open http://localhost:8000 (ES modules need a server, not `file://`).

## Edit

- Copy: `index.html` panels. Keep `data-in` / `data-out` ranges from overlapping.
- Floor plan, rooms, camera stops: `assets/spec.js`.
- Furniture and scroll animations: `assets/site.js`.
- Brand colour: `--accent` in `assets/style.css`.
- Engine (shared across sites): `assets/engine.js`. Fix bugs in the skill template too.
