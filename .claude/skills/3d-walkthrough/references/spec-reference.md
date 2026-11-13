# spec.js reference

`assets/spec.js` exports one object. The engine (`assets/engine.js`) reads it to build the building, the exterior and the camera path. The example in the template is a complete, working cafe.

## Coordinates

- Metres. `x` = right, `y` = up, `z` = toward the street.
- The building's front facade is its max `z` edge. The camera starts outside at larger `z`.
- Put the entrance near `x = 0` and the front at `z = 0`. Rooms then sit at negative `z`.

## Top level

| Key | Type | Notes |
| --- | --- | --- |
| `name` | string | Business name |
| `mode` | string | `'street-open'` (default): the scroll starts outside and walks to the front door, then in. `'dollhouse-open'`: the scroll starts on a high overview of the whole home, then descends to the front door. The roof and ceilings hide while the camera is above the roof. Walls stay full height. |
| `wallHeight` | number | Default 3.2 |
| `wallThickness` | number | Default 0.2 |
| `exposure` | number | Tone-mapping exposure, default 1.05 |
| `roof` | material | Roof slab seen from outside |
| `exterior` | object | See below |
| `insideAt` | `[p0, p1]` | Scroll range where fog and ambient shift from outside to inside |
| `theme` | object | Overrides the sky preset (see `SKY` in engine.js) |
| `styles` | object | Real estate only. Named looks for the style switch. See [styles](#styles). |
| `rooms` | array | Floors, ceilings, lights |
| `walls` | array | Wall segments with openings |
| `stops` | array | Camera path |

## Materials

Anywhere a material is taken, pass a string:
- A colour: `'#e8dcc8'`
- A procedural texture, optionally with a base colour: `'wood'`, `'wood:#5a3c26'`, `'brick:#8a4a32'`, `'tile:#efece6'`, `'darktile'`, `'plaster:#e8e1d4'`, `'concrete:#8d8b86'`, `'marble'`, `'checker'`, `'grass'`
- A finish: `'brass'`, `'steel'`, `'black'`
- A real photo, cropped and straightened to the surface first: `'photo:assets/photos/<file>.jpg'`. Mapped once, no tiling. Use it for the surfaces a photo shows straight on.
- Or a `THREE.Material` object.

## exterior

| Key | Values |
| --- | --- |
| `kind` | `'street'` (sidewalk, road, crosswalk, neighbour buildings, street lamps) or `'garden'` (lawn, path, trees, fence, path lights) |
| `sky` | `'dusk'`, `'night'`, `'day'`, `'golden'` |
| `facade` | Material of the band above the front wall |
| `parapet` | Height of that band, default 1.6 |
| `doorX` | x of the entrance (warm light spill) |
| `pathX` | Garden path x |
| `streetLights`, `neighbours`, `crosswalk` | booleans |
| `sign` | `{ text, sub, style: 'neon' or 'paint', color, glowColor, width, x, y, board }` |

## rooms

```js
{ id: 'cafe', name: 'Cafe', rect: [x0, z0, x1, z1], floor: 'wood', ceiling: '#221a15', light: '#ffd2a0', lightIntensity: 12 }
```

One point light is added per ~30 m² near the ceiling. Add pendants and accent lights in `site.js`.

## walls

```js
{ from: [x, z], to: [x, z], inside: material, outside: material, material: material, height, thickness, openings: [...] }
```

- Outer walls: trace counter-clockwise seen from above with the street at the bottom. Front left to right, right side front to back, back right to left, left side back to front. Then `outside` faces out.
- Interior walls: just `material`.
- Openings, `at` = distance in metres from `from` to the opening centre:
  - `{ type: 'door', at, width, height, glass, material, hinge: 'left'|'right', swing: 1|-1, opensAt: [p0, p1], openAngle }`. With `swing: 1` the door opens away from the `outside` face.
  - `{ type: 'window', at, width, sill, height, frame }`
  - `{ type: 'pass', at, width, height }` (open doorway, arch, service pass)

## stops

```js
{ p: 0.44, pos: [x, y, z], look: [x, y, z], chapter: 'Cafe' }
```

- `p` must increase from 0 to 1. Leave 0.08 to 0.15 between stops.
- Human eye only. The camera is a normal lens at eye height. To turn the view, add a stop whose `look` points to the new angle. Turn 90 degrees or less between neighbouring stops.
- The path is a smooth curve through all stops. Look targets are curved too.
- Stops with `chapter` become nav buttons and reduced-motion shots.

## site.js context (`ctx`)

`build(ctx)` runs once and returns `update(p, time, dt)`.

| Name | Use |
| --- | --- |
| `THREE`, `scene`, `camera` | three.js |
| `box(x0, x1, y0, y1, z0, z1, mat, parent?)` | Axis-aligned box |
| `plane(w, h, mat, pos, rot?, parent?)` | Plane |
| `glow(color, size, pos, opacity?, parent?)` | Additive glow sprite (fake bloom) |
| `light(color, intensity, distance, pos)` | Point light, physical falloff |
| `material(def, repeat?)`, `TEX` | Materials and canvas textures (`TEX.board(title, lines)`, `TEX.sign(text, opts)`) |
| `V(x, y, z)` | Vector3 |
| `H`, `B` | Wall height, building bounds `{x0, x1, z0, z1}` |
| `seg(p, a, b)`, `smooth(a, b, p)`, `easeOut(t)` | Scroll-range helpers |
| `reduceMotion` | Skip time-based motion when true |
| `props` | Prop library below |

## Props (`ctx.props`)

All take `(x, z, opts)` and sit on the floor. `rot` turns around y in radians.

- `table`, `rectTable`, `tableSet` (table plus two chairs), `chair`, `stool`
- `counter` (bar, kitchen island, reception desk), `shelf` (`items: 'bottles' | 'jars' | 'books'`)
- `sofa`, `bed`, `rug`, `plant`
- `pendant` (glow, optional real light with `lightOn`)
- `wallBoard(x, y, z, { normal: 'n'|'s'|'e'|'w', tex })` for menus, art, house rules
- `espressoMachine`
- `art(x, y, z, { normal, w, h, tex, color, frame })`: framed art. Place x, y, z just in front of the wall. `normal` as `wallBoard`.
- `tableLamp(x, z, { y, shade, base, on })`: lamp on a table. `y` is the table top height.
- `kitchenDetails(x, z, { w, top, rot })`: sink, hob, cutting board and fruit bowl for a counter. `top` is the counter surface height.
- `bed` already has pillows and a folded throw. Use it for made beds.
- `candles` (array of glow sprites to flicker in `update`)

## styles

Real estate only (`mode: 'dollhouse-open'`). Each key is a look. The first key is the default. The engine adds three buttons, `[data-style]`, in `index.html`. Their labels must match the keys.

```js
styles: {
  modern:        { wall: '#ecebe8', floor: 'concrete:#8d8b86', ceiling: '#f4f3f0', accent: 'black', fabric: '#3c3c3e', wood: 'wood:#6b5440' },
  scandinavian:  { wall: '#f3efe6', floor: 'wood:#d8c09a',     ceiling: '#fbfaf6', accent: '#8fa3a0', fabric: '#c9c2b4', wood: 'wood:#e0cfb0' },
  'warm luxury': { wall: '#e9dccb', floor: 'marble',           ceiling: '#f2e9dc', accent: 'brass',   fabric: '#7a3f2a', wood: 'wood:#4a2f1e' },
}
```

| Key | Used for |
| --- | --- |
| `wall` | Every wall, both faces |
| `floor` | Every room floor (tiled to room size) |
| `ceiling` | Every room ceiling |
| `accent`, `fabric`, `wood` | Passed to `site.build(ctx, style)` through `ctx.spec.styles[style]` |

What the engine does on a switch: the walls, floors and ceilings take the new palette, the furniture is removed, and `site.build(ctx, style)` runs again. The change fades over about 160 ms, or cuts with reduced motion.

`site.js` contract:
- `build(ctx, style)` gets the style name. It must put all furniture on `ctx.root`, and use `ctx.props`, `ctx.box`, `ctx.glow` and `ctx.light`, which all default to `ctx.root`.
- `ctx.style` is the current style name.
- Anything added to `ctx.scene` directly stays on screen after a switch, and is added again each time. Keep it out of `build`.
