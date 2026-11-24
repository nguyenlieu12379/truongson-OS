# Sweets by Carla G (spec demo)

Scroll-craft build, 2026-11-24, for Sweets by Carla G (Homestead, FL: home bakery, custom celebration cakes, desserts, Peruvian alfajores; orders by Instagram DM or WhatsApp, no website). Live (noindex): https://nguyenlieu12379.github.io/truongson-OS/sweets-by-carla-g/ (deployed by `.github/workflows/deploy-pages.yml` on push to main). Approved 2026-11-24, and in the Sites list.

One fixed stage. Their flamingo cake, cut along its real edge, sits in front of a giant brush-script "Sweets"; the covered letters bob like piped icing. "Sweets" docks in the bar, the cake drops onto a turntable and eight of their custom cakes orbit it. At the peak the turntable spins a full turn and the theme names roll behind it, ending on "Yours." The orbit gathers under the cake, the camera pushes in on the flamingo and the top flowers and the cutout turns into their close-up in place, which shrinks into the first of four treats. The treats fly into the order card's thumbnails while the cake rises back and "Sweets" undocks behind it. Brief, colour split and failure checks: `BRIEF.md`. Answers: `PREFS.md`. Photo sources: `assets/source/SOURCES.md`.

## Files

- `index.html`: markup, theme toggle script inline in the head (key `sweets-carla-theme`).
- `site.css`: tokens at the top. Light: blush `#FBF1F0` 60, script black `#1D1112` and watercolour rose `#E4BFC5` 30, hibiscus rose `#C93765` 10 (button only). Dark: script black ground, blush type. Great Vibes, Fraunces, Manrope.
- `site.js`: one timeline `p` (0..1) from smoothed scroll; transforms and clip-path only, written on change. The map iframe loads only near the end.
- `liquid-glass.css`, `liquid-glass.js`: stage 3 kit (Vivace cursor ball, glass button, magnet, theme sweep).
- `assets/`: web photos, `cut-hero.webp`, `cut-flower.webp`, logo and icons; cutout originals in `source/`.

## Run it

```powershell
powershell -ExecutionPolicy Bypass -File serve.ps1 -Root . -Port 4511
```

Test switch: `?p=0.5` jumps to that point of the timeline.
