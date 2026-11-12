# Build notes

What worked on Forno Notte and the template cafe. Read before building a scene.

## Camera and pacing

- Total scroll is `1000vh` (`.spacer` in style.css). About 8 to 11 stops fits that well.
- Outside: start wide and slightly high (y 2.4, 25+ m out), then come down to eye height at the door.
- Indoors, eye height 1.6 to 1.8 m. Drop to 1.3 to 1.5 for close-ups of a counter or table.
- Go through door centres. A door that opens over `[0.22, 0.31]` should be fully open before the camera reaches it.
- Look targets lead the walk: aim the look 3 to 5 m ahead, toward the next room.
- If a turn feels whippy, add a stop in between or move the look target, rather than slowing the spring.
- The camera spring (critically damped, response 0.55 s) is what makes it feel Apple-smooth. Keep it.

## Light

- Physical point lights (decay 2). Useful intensities: room fill 8 to 16, pendant accent 6, street lamp 26, oven or fire 20 to 30.
- Keep total point lights under about 14. Each one costs every pixel.
- Glow sprites (`glow`) fake bloom for bulbs, candles, neon and fire. They are cheap; use them generously.
- Colour carries mood: warm interior (`#ffd2a0`) against a cool dusk exterior is the strongest contrast.
- A very bright light near a tiled or white wall blows out. Lower it before raising exposure.

## Matching the photos

- Get the palette right first (floor, walls, main furniture). It sells the place more than object count.
- Then the hero object. Model it with the most care: it is where the camera ends up.
- Skip clutter. Two or three props per zone that match the photo beat twenty that do not.
- Signage and menu boards (`TEX.sign`, `TEX.board`) make it feel like the real business fast.

## Hero moments

- One per major room, tied to scroll, reversible. Scrolling back must undo it.
- Use `seg(p, a, b)` for a 0 to 1 ramp and `easeOut` for landings. Stagger items by small offsets.
- Pair each moment with a panel that lists its steps using `data-at` so text and scene stay in sync.
- Time-based loops (flicker, steam, embers) are decoration only. Turn them off or down when `reduceMotion` is true.

## Panels

- `data-in` / `data-out` ranges should sit between the camera stops they describe. Avoid two panels visible at once.
- Hero and final panels are centred. Others alternate left and right so they do not cover the hero object.
- The final panel needs `data-in` at least 0.04 before 1, or the spring never fully reveals it.

## Performance

- Pixel ratio capped at 1.75. Canvas textures are cached per material string, so reuse strings.
- Avoid real-time shadows. Contact darkness comes from fog, vignette and light falloff.
- Keep geometry simple. The template cafe renders at 60 fps on a laptop.

## Testing

- `scripts/shoot.cjs` uses software GL (SwiftShader). It is slow, so it waits 4 s per stop.
- Check phone size (390 x 844): wider FOV kicks in under 0.8 aspect, and panels stack at the bottom.
- Common bugs: a wall face showing the wrong finish (wall traced the wrong direction), the camera clipping a wall at a turn, a door opening outward (flip `swing`), a dark room (missing room light or a light outside the rect).
