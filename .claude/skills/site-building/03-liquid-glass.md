# Liquid glass

Clear glass that **bends** what is behind it, like a thick lens. Not frosted, not blurred. First built on Espresso Vivace (`websites/TruongSon-demos/scrollcraft/builds/espresso-vivace/`, v3.7 to v4.0); this skill is that work made reusable.

How to describe it to anyone (designer, client, another AI): *"Liquid glass effect: a clear refractive lens that magnifies and bends the content behind it along its edge, with a thin specular highlight on the rim. No blur, no frost."* Without "no blur, no frost" people build glassmorphism.

## What is in the kit

| Piece | File | What it does |
|---|---|---|
| Theme toggle + glass sweep | `assets/head.html` (inline in `<head>`) | Saved theme applied before first paint. Toggle click: the new theme grows as a circle from the button; its edge is a lens ring that bends the page, with a bright rim. |
| Cursor ball | `assets/liquid-glass.js` `LiquidGlass.cursorBall()` | Glass ball (56px, half the Vivace ball) springs after the mouse, stretches along its motion, wobbles back to round, grows over links. Clicks pass through. |
| Glass buttons / panels | `LiquidGlass.glassify(".lg-glass")` | Any element gets a lens fitted to its own size and border-radius. |
| The lens itself | `LiquidGlass.lensMap()` | The displacement map all of the above use. |
| Styles | `assets/liquid-glass.css` | Toggle, sweep, ball, glass button styles; theme-token pattern. |
| Demo | `examples/demo.html` | Everything on one page. Serve the skill folder and open it. |
| Checks | `scripts/verify.cjs` | Headless checks: lens alignment, toggle, reload, click-through, touch. |

## The prompt (do this, in order)

1. **Ask only what you can't default.** Which site (path)? Which pieces (sweep, ball, buttons; default all three)? Sweep length (default 1400ms; 4000 to 7000 is a "show" and blocks the page while it runs, say so)? If the site has no dark theme yet, say you'll add one.
2. **Read the site first.** Its CSS colours, its head, where the bar/nav is, what's behind any element that will become glass. Glass over a flat colour shows nothing; it needs type, a photo, or a pattern behind it.
3. **Tokens before effects.** Every colour the page uses becomes a CSS custom property with a dark set (pattern at the top of `liquid-glass.css`). Hard-coded hex values are the usual misses (card backgrounds, hover colours, shadows, video backgrounds). Text-red on dark needs its own lighter token, separate from fill-red, to keep 4.5:1.
4. **Copy, don't link.** Copy `assets/liquid-glass.css` and `assets/liquid-glass.js` into the site. Paste `assets/head.html` into `<head>` and set `CONFIG.key` (unique per site), `CONFIG.colors`, `CONFIG.duration`. Then:
   ```html
   <button class="lg-theme-btn" type="button" aria-pressed="false" aria-label="Dark mode">
     <svg class="lg-i-moon" viewBox="0 0 24 24" aria-hidden="true"><path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>
     <svg class="lg-i-sun" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M12 2.5v2.2M12 19.3v2.2M2.5 12h2.2M19.3 12h2.2M5.3 5.3l1.6 1.6M17.1 17.1l1.6 1.6M5.3 18.7l1.6-1.6M17.1 6.9l1.6-1.6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>
   </button>
   ...
   <script src="liquid-glass.js?v=1" defer></script>
   <script>addEventListener("DOMContentLoaded", function () { LiquidGlass.cursorBall(); LiquidGlass.glassify(".lg-glass"); });</script>
   ```
   Keep `aria-label` constant; `aria-pressed` carries the state.
5. **Version every asset URL** (`site.css?v=N`, `liquid-glass.js?v=N`) and bump N on every change. A returning visitor's cached old script once left the Vivace toggle dead while every test passed.
6. **Fit the header.** The toggle adds about 40px; check 390, 360 and 320px widths for wrapping or sideways scroll.
7. **Verify** (below), look at the screenshots, then commit. Ask before publishing.

No venom. Son removed the glass venom strands on 2026-11-23; don't add them back.

## Rules that each cost a debugging round

- **Position glass with `left`/`top` or layout, never `transform: translate`.** Use transforms only for stretch and scale. For the ball's stretch, rotate, scale, then rotate back (no net rotation), so the round lens map stays aligned.
- **`color-interpolation-filters="sRGB"` on the filter and on every primitive.** Otherwise 128 is not "no bend" and the whole lens shifts about 10px.
- **No folding.** The pull must grow slower than the distance it acts over (slope under 1px per px). If it doesn't, content folds back on itself and thin letters smear into dark blobs. `lensMap()` defaults keep the slope near 0.66. If you raise `push`, widen `band` too.
- **Browser reach.** The live-page bending (`backdrop-filter: url(#svg)`, used by the ball and buttons) is Chromium only (Chrome, Edge, Opera, Brave). Safari and Firefox get the rim, highlight and a light frost. The theme sweep uses View Transitions plus `filter` on the snapshots: Chromium and Safari 18+. Elsewhere it's a 0.7s colour fade.
- **Reduced motion:** the sweep is instant and there's no ball. **Touch:** no ball.
- **Inline the toggle code** (`head.html`), so a stale cached script can't break it.
- **Contrast on glass:** labels on glass over busy imagery can fail. Put glass buttons over calm areas, keep the text shadow, and check the label against the brightest frame behind it.
- **Sweep cost:** the sweep repaints a full-screen filter every frame. Fine on desktop GPUs. Long sweeps (4 to 7s) may drop frames on older phones, so check a real device.

## Verify

```bash
node .claude/skills/site-building/scripts/serve.mjs --root <site folder> --port 4600 &
node .claude/skills/site-building/scripts/verify.cjs http://localhost:4600/ <scratch dir>
```

It checks that the ball appears and that its rim bends a test grid while the centre stays clear, that the toggle flips the theme and survives a reload, that clicks reach the element under the ball, that the ball is hidden on touch, and that there are no page errors. Then look at the screenshots it writes (`ball-lens.png`, `sweep-mid.png`, `after-toggle.png`), plus the real page in light and dark at phone width.

Not covered by the script: Safari and Firefox fallbacks, real phones and real trackpads. Say so in the report.

## Tuning

| Want | Change |
|---|---|
| Slower or faster sweep | `CONFIG.duration` in `head.html` |
| Wider or stronger sweep edge | `band`, `push` in `glassSwitch` (keep `push` at about 0.42 × `band`) |
| Bigger ball | `LiquidGlass.cursorBall({ size: 140 })` |
| Lazier or snappier ball | `stiffness` (0.14), `damping` (0.72) |
| Longer drag (more stretch on fast moves) | `stretch` (0.018 per px/frame), `maxStretch` (0.42). Brazilian Taste: `{ size: 104, stiffness: 0.055, damping: 0.86, stretch: 0.03, maxStretch: 0.7 }` |
| Ball doesn't grow on links | `hoverGrow: 1` |
| Buttons pulled toward a nearby cursor | `LiquidGlass.magnet(".cta", { reach: 140, pull: 0.35, max: 26 })`. Moves with left/top so the lens stays aligned. Brazilian Taste: reach 150, pull 0.38, max 28 |
| Flatter or rounder buttons | `glassify(sel, { band, push, interior })`; `interior: 0` keeps the middle flat |
