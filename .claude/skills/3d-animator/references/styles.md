# Styles: clay, toon, neon

`kit/styles.js` re-dresses the whole scene in another look with one call. The scene code doesn't change.

| style | what it does | good for |
| --- | --- | --- |
| `lit` | the film as you built it (default) | the real thing |
| `clay` | every surface one matte ivory clay, same light | a maquette look, product shapes, "before the paint" |
| `toon` | three hard light bands, bolder colours, black ink outlines | cartoon, playful brands |
| `neon` | the same room at night: cold moonlight, a coral neon tube on the wall, strong glow | moody endings, night versions |

Screens (`MeshBasicMaterial`) stay screens in every look, so text on them still reads.

## Switch the look

When the user says "make it clay / toon / neon / at night", use the style. Don't rebuild the scene.

```bash
node render.mjs --stills=0.5,2.5,4.5 --n=16 --style=toon --out=stills_toon   # check stills first
node render.mjs --video --n=4 --style=toon --out=out/preview_toon.mp4
node render.mjs --video --n=48 --style=toon --out=out/final_toon.mp4
```

Live in the browser: `index.html?play=1&style=neon`, or `?t=2.5&style=clay` for one frame.

## In your own scene

`film.js` already calls it after the lights and the bloom are made:

```js
import { setStyle } from './styles.js';
setStyle(styleName, { scene, key: sun, fill: sky, bloom, neonAt: V(0.52, 0.5, -0.88) });
```

- `key` is your main light, `fill` the soft one. Their brightness is scaled per look, so it works in any scene.
- `neonAt` is a point on a wall the camera can see. The tube is about 40 cm wide. Put it off to one side of the
  hero object, not straight behind it.
- Give a mesh `userData.noOutline = true` to skip its ink line (big walls, floors, glass). Planes are skipped already.

## Flip looks inside one film (the "change the style" moment)

Pick the look from `t` at the top of `renderAt`. It stays a pure function of time because the materials are cached:

```js
const styleAt = (t) => (t < 4 ? 'lit' : t < 5 ? 'clay' : t < 6 ? 'toon' : 'neon');
export function renderAt(t, n = 1) { setStyle(styleAt(t), { scene, key: sun, fill: sky, bloom, neonAt }); ... }
```

Land each flip on a beat or on the word ("...change the **style**"), with a short whoosh or click. For a wipe instead
of a cut, render two clips and join them with `ffmpeg ... -filter_complex xfade=transition=wipeleft:duration=0.3:offset=<t>`.

## Tuning

All numbers are in the `LOOK` table at the top of `styles.js`:

- clay too bright: lower `clay.key`. Too flat: lower `clay.fill`.
- toon lines too thin or thick: `toon.outline` (0.0028 is about 3 px at 1080p). Colours too loud: lower `toon.sat`.
- neon too dark: raise `neon.fill`. Tube glow too big: lower `neon.tube` or `neon.bloom`. Colour: `neon.coral`.

## A new style the user asks for

Add a name to `STYLES`, a row to `LOOK`, and a branch in `setStyle` that swaps materials (like `clayOf` / `toonOf`) or
adds a rig (like `buildNeon`). Keep screens readable, render the 3 stills, and show them before a full render.
Ideas that fit this kit: paper (flat colour + paper texture), blueprint (white lines on blue), golden hour (warmer,
lower key), wireframe (`material.wireframe = true` on a copy).
