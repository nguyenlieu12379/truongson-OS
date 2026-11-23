# Liquid glass

Clear glass that **bends** what is behind it, like a thick lens. Not frosted, not blurred. First built on Espresso Vivace (`websites/TruongSon-demos/scrollcraft/builds/espresso-vivace/`, v3.7 to v4.0); this skill is that work made reusable.

How to describe it to anyone (designer, client, another AI): *"Liquid glass effect: a clear refractive lens that magnifies and bends the content behind it along its edge, with a thin specular highlight on the rim. No blur, no frost."* Without "no blur, no frost" people build glassmorphism.

## What is in the kit

| Piece | File | What it does |
|---|---|---|
| Theme toggle + glass sweep | `assets/head.html` (inline in `<head>`) | Saved theme applied before first paint. Toggle click: the new theme grows as a circle from the button; its edge is a lens ring that bends the page, with a bright rim. |
| Cursor ball | `assets/liquid-glass.js` `LiquidGlass.cursorBall()` | Glass ball (56px, half the Vivace ball) springs after the mouse, stretches along its motion, wobbles back to round, grows over links. Clicks pass through. |
| Glass buttons / panels | `LiquidGlass.glassify(".lg-glass")` | Any element gets a lens fitted to its own size and border-radius. |
| Glass venom | `LiquidGlass.venom("button.lg-glass, a.lg-glass")` | Within reach of a button, wiry strands in the button's colour sprout from its edge, sag, whip toward the mouse and latch on. Pulls back when the mouse leaves. Optional; see "Glass venom". |
| The lens itself | `LiquidGlass.lensMap()` | The displacement map all of the above use. |
| Styles | `assets/liquid-glass.css` | Toggle, sweep, ball, glass button styles; theme-token pattern. |
| Demo | `examples/demo.html` | Everything on one page. Serve the skill folder and open it. |
| Checks | `scripts/verify.cjs` | Headless checks: lens alignment, toggle, reload, click-through, touch, venom. |

## The prompt (do this, in order)

1. **Ask only what you can't default.** Which site (path)? Which pieces (sweep, ball, buttons; default all three; venom only if asked, and which buttons)? Sweep length (default 1400ms; 4000 to 7000 is a "show" and blocks the page while it runs, say so)? If the site has no dark theme yet, say you'll add one.
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
   <script>addEventListener("DOMContentLoaded", function () { LiquidGlass.cursorBall(); LiquidGlass.glassify(".lg-glass"); LiquidGlass.venom("button.lg-glass, a.lg-glass"); });</script>
   ```
   Keep `aria-label` constant; `aria-pressed` carries the state. Leave out the `venom` call unless venom was asked for.
5. **Version every asset URL** (`site.css?v=N`, `liquid-glass.js?v=N`) and bump N on every change. A returning visitor's cached old script once left the Vivace toggle dead while every test passed.
6. **Fit the header.** The toggle adds about 40px; check 390, 360 and 320px widths for wrapping or sideways scroll.
7. **Verify** (below), look at the screenshots, then commit. Ask before publishing.

## Glass venom

Optional. Modelled on the Venom button reference (a black pill that sends out wiry strands toward a cursor hand):

1. **Idle.** Nothing shows.
2. **In reach.** Once the mouse is within reach of a button's edge, strands sprout from the edge facing the mouse, sag under gravity, and whip toward the pointer. Each strand is a short chain with a wobble, so the bundle moves like hair, not like a rigid rod.
3. **Latched.** When the bundle reaches the pointer, a glass head of the same colour sits on the cursor. `html.lg-venom-latched` hides the cursor ball while this lasts.
4. **Retract.** When the mouse leaves reach (or moves onto the button), the strands draw back into the button and the head sinks in.

Colour: the strands and head take the button's colour. The order: `--lg-venom` on the button, then its solid background, then its text colour. A glass button with a translucent background falls through to its text colour, so for a strong colour give the button a solid background or set `--lg-venom`. `venom(sel, { color: "#B11F24" })` overrides everything.

Rules:
- **Reach is in cursor-ball widths.** `reach: 5` (the default) means 5 × 56px = 280px from the button's edge. On a busy page use 2 or 3. Say which one you used.
- **Only the nearest button in reach is active.** Several buttons never reach at once.
- **Buttons only.** The strands start from a button edge. Don't point them at panels or large glass.
- **Keep the CTA inside the viewport when testing.** Pointer events outside the window never arrive, so the effect retracts.
- **Mouse and trackpad only.** Off on touch and with reduced motion, the same as the ball.
- **Bending needs Chromium.** Elsewhere the head is translucent glass with a rim and no bend. Strands are drawn the same everywhere.
- **Position with `left`/`top`; the head uses `scale` only.** Same rule as the ball.

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
node .claude/skills/build/scripts/serve.mjs --root <site folder> --port 4600 &
node .claude/skills/build/scripts/verify.cjs http://localhost:4600/ <scratch dir>
```

It checks that the ball appears and that its rim bends a test grid while the centre stays clear, that the toggle flips the theme and survives a reload, that clicks reach the element under the ball, that the ball is hidden on touch, and that there are no page errors. Venom: no strands when the mouse is far, strands within reach, strands in the CTA's own colour, a latch onto the pointer that hides the ball, and a retract when the mouse leaves. Then look at the screenshots it writes (`ball-lens.png`, `sweep-mid.png`, `after-toggle.png`, `venom-crawl.png`, `venom-latched.png`), plus the real page in light and dark at phone width. The lens test forces the ball visible on purpose, because venom can hide it near a button.

Not covered by the script: Safari and Firefox fallbacks (including venom without a bend), the strand look against a real photo, real phones, real trackpads, and whether the venom crawl feels right to the client. Say so in the report.

## Tuning

| Want | Change |
|---|---|
| Slower or faster sweep | `CONFIG.duration` in `head.html` |
| Wider or stronger sweep edge | `band`, `push` in `glassSwitch` (keep `push` at about 0.42 × `band`) |
| Bigger ball | `LiquidGlass.cursorBall({ size: 140 })` |
| Lazier or snappier ball | `stiffness` (0.14), `damping` (0.72) |
| Ball doesn't grow on links | `hoverGrow: 1` |
| Venom reach (default 5 cursor-widths, 280px) | `LiquidGlass.venom(sel, { reach: 3 })` |
| Strand colour | `--lg-venom` on the button, or `venom(sel, { color })` |
| Strands per button (from the button's width, 4 to 10) | `venom(sel, { strands: 8 })` |
| When it latches (0.35 widths from the pointer) | `catch` |
| Strand speed | `stiffness` (0.07) |
| Strand thickness | the widths in `outline()` in `liquid-glass.js` (1.9px at the root, 0.7px at the tip) |
| Flatter or rounder buttons | `glassify(sel, { band, push, interior })`; `interior: 0` keeps the middle flat |
