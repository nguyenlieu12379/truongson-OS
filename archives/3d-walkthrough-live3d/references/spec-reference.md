# spec.js reference

`assets/spec.js` exports one object. The building is not in it: walls, rooms, furniture, finishes, photos and room lights all live in `assets/model.glb`, modelled in Blender (see [Blender model](blender-model.md)). The spec holds the route, door timing, styles and mood. The template's example is a working coastal cottage.

## Coordinates

- The model's own coordinates, in metres. `x` = right, `y` = up, `z` = toward the street.
- Blender (x, y, z) shows up here as (x, z, -y). With the street at Blender y = 0, the front of the building is at z = 0 and rooms sit at negative z.
- Eye height is the floor height plus 1.6 to 1.8. For a house raised on pilings, add the floor height (the cottage floor is at y = 2.44).

## Top level

| Key | Type | Notes |
| --- | --- | --- |
| `name` | string | Place name |
| `mode` | string | `'dollhouse-open'`: starts on a high overview of the whole home, roof and ceilings hidden while the camera is above them. `'street-open'`: starts on the street, walks to the front door, then in. |
| `model` | string | Path to the glTF, normally `'assets/model.glb'` |
| `sky` | string | `'day'` (default), `'golden'`, `'dusk'` or `'night'`. Sets sky colours, fog and ambient light |
| `theme` | object | Optional overrides for the sky preset (`skyTop`, `fogDensity`, `hemiIntensity`, `sun`, ...) |
| `exposure` | number | Tone-mapping exposure, default 1.05 |
| `lightScale` | number | Multiplies every point light from the model. Start at 3 and adjust |
| `lightDistance` | number | Range of model lights with no range set, default 9 m |
| `ceilingY` | number | Height where the dollhouse hides the roof. Default: the lowest `upper` object |
| `insideAt` | [a, b] | Scroll range where fog and ambient shift from outside to inside |
| `doors` | object | See below |
| `styles` | object | See below. Real estate only |
| `stops` | array | See below |

## doors

Keys are object names from the model (objects with `role = "door"`, origin on the hinge).

```js
doors: {
  Door_Front: { opensAt: [0.33, 0.4], angle: 1.7 },        // swings about the hinge, + opens inward
  Door_Rear_Slider: { opensAt: [0.74, 0.82], slide: -2.5 }, // slides along x, metres
}
```

A door with no `opensAt` stays open. It should be fully open before the camera reaches it.

## styles

Real estate only. Each key is a style; each value recolours the model's style materials (named `wall`, `floor`, `ceiling`, `fabric`, `wood`, `accent` in Blender). Objects with a `style` extra are shown only in that style, so a style can swap furniture too.

```js
styles: {
  modern: { wall: '#eceae6', floor: '#9a7a5a', ceiling: '#f4f3f0', fabric: '#8c8c88', wood: '#3a3532', accent: '#2f3b40' },
  scandinavian: { ... },
  'warm luxury': { ... },
}
```

The button labels in `index.html` (`data-style`) must match the keys. The first style is the default.

## stops

```js
{ p: 0.47, pos: [7.92, 4.14, -3.6], look: [10.2, 3.4, -4.7], chapter: 'Inside' }
```

- `p`: scroll progress 0 to 1. Keep 0.08 to 0.15 between stops.
- `pos`, `look`: camera position and the point it looks at. Turn 90 degrees or less between stops.
- `chapter`: optional label for the nav.
- The path is a smooth curve through the stops. It only needs to be clear of walls and furniture along that curve.

## site.js context (`ctx`)

`site.build(ctx)` runs once after the model loads and returns `update(p, time, dt)`. Optional `site.style(ctx, name)` runs on every style switch.

| Key | What |
| --- | --- |
| `model`, `get(name)` | The loaded glTF scene, and an object by its Blender name |
| `THREE`, `scene`, `camera`, `spec` | three.js and the scene |
| `V(x, y, z)` | Vector3 shortcut |
| `H`, `B` | Ceiling height, and building bounds `{x0, x1, y0, y1, z0, z1}` |
| `seg`, `smooth`, `easeOut` | Scroll helpers: `seg(p, a, b)` is a 0 to 1 ramp |
| `glow(color, size, pos, opacity)` | Additive sprite for bulbs, candles, sun, fire |
| `light(color, intensity, distance, pos)` | Extra point light |
| `box`, `plane`, `material`, `TEX` | Small extras for hero moments only. The building and furniture belong in Blender |
| `reduceMotion`, `style` | Reduced-motion flag, and the current style |

Joined meshes are named `<Collection>_<material>`. Anything you animate must stay a separate object in Blender (give it a role or a style extra, or add it to the keep-separate rule in `export_web_glb`).
