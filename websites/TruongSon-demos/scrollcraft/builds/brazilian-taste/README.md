# Brazilian Taste (spec demo)

Scroll-craft build, 2026-11-23, for Brazilian Taste (Dallas, TX: premade meals, catering, personal chef; orders on WhatsApp, no website). Local only: not deployed until Son says live.

One unbroken white world. Their real "Brazilian" wordmark splits open, their bowls appear in the gap, the photo becomes Monday in a 7-day grid that fills with their trays, then three ways to order, a green "how to order" band, and the wordmark closes again over the button. Brief, colour split and failure checks: `BRIEF.md`. Answers: `PREFS.md`. Photo sources: `assets/source/SOURCES.md`.

## Files

- `index.html`: markup. The wordmark is 9 letters + "TASTE" cut from their avatar (`assets/wm-*.png`, used as masks, coloured by CSS).
- `site.css`: tokens at the top (white 60, green `#29400E` 30, yellow `#F8E04A` 10 on the CTA only). Instrument Serif + Inter Tight.
- `site.js`: one timeline `p` (0..1) from smoothed scroll; transforms, opacity and clip-path only, written on change.
- `liquid-glass.css`, `liquid-glass.js`: the stage 3 kit (cursor lens, glass buttons). No venom, no theme toggle.

## Run it

```powershell
powershell -ExecutionPolicy Bypass -File serve.ps1 -Root . -Port 4503
```

Test switch: `?p=0.5` jumps the camera to that point of the timeline.
