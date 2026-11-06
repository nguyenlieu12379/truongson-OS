# Forno Notte (3D scroll demo)

Virtual wood-fired pizzeria. A portfolio piece to show F&B prospects what a scroll-driven 3D site feels like.

## The scroll story

1. **Street** at dusk: road, crosswalk, neon sign, a car passing.
2. **Door** swings open as you reach it.
3. **Dining room**: tables, pendants, candles, wine wall.
4. **Kitchen**: the pizza builds as you scroll (dough stretch, sauce, fior di latte, basil).
5. **Oven**: pizza rides the peel into the fire and bakes. Final reserve card.

## How it works

- `index.html`: text panels. Each has `data-in` / `data-out` scroll progress (0 to 1).
- `assets/app.js`: three.js scene, all procedural (no model files). Camera follows keyframes in `KEYS`. Scroll drives a critically damped spring (Apple-style, interruptible).
- `assets/style.css`: SF type, glass nav, panel styles.
- `assets/three.module.min.js`: vendored three.js r169 (MIT).
- Respects `prefers-reduced-motion` (cuts between fixed shots with a cross-fade), `prefers-reduced-transparency`, and `prefers-contrast`.

## Run locally

```bash
cd websites/TruongSon-demos/forno-notte && python3 -m http.server 8000
```

Then open http://localhost:8000. Needs a server (ES modules), not `file://`.

## Edit

- Copy: change text in `index.html`. Keep `data-in`/`data-out` ranges from overlapping.
- Camera moves: edit `KEYS` in `assets/app.js` (`[progress, position, lookAt]`).
- Pizza timing: `applyProgress()` in `assets/app.js`.
