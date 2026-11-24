# Pakachi Kitchen (spec demo)

Scroll-craft build, 2026-11-24, for Pakachi Kitchen LLC (Herndon, VA: Pakistani halal home cooking, a 6-dish weekly menu deal, catering; orders by WhatsApp and phone, no website). Live (noindex): https://nguyenlieu12379.github.io/truongson-OS/pakachi-kitchen/ (deployed by `.github/workflows/deploy-pages.yml` on push to main). Not in the approved Sites list until Son or Truong approves it.

One fixed stage. Their biryani tray, cut from their photo, sits in front of a giant gold PAKACHI. It becomes card 1 of a hand of six of their dishes dealt along the arc of their logo ring; the whole hand doubles as "$90" rolls to "$130". The hand turns away, the haleem card opens into a catering band that pans through their trays, their gold rises with three steps, then tightens into an order ticket with the hand fanned behind it. Brief, colour split and failure checks: `BRIEF.md`. Answers: `PREFS.md`. Photo sources: `assets/source/SOURCES.md`.

## Files

- `index.html`: markup, theme toggle script inline in the head (key `pakachi-theme`).
- `site.css`: tokens at the top. Dark: black `#0C0B0A` 60, gold `#C4A469` 30, saffron `#F4A000` 10 (button only). Light: white `#FBFAF7`, deep gold `#86672F`, saffron. Cinzel, Cormorant Garamond, Manrope.
- `site.js`: one timeline `p` (0..1) from smoothed scroll; transforms and clip-path only, written on change. No opacity fades.
- `liquid-glass.css`, `liquid-glass.js`: stage 3 kit (default cursor ball, glass button, magnet, theme sweep).
- `assets/`: web photos (from their Facebook, 2048px originals in `source/`), `cut-tray.webp`, two lemon cutouts, `logo-gold.webp`, `logo-ring.webp`, icons.

## Run it

```powershell
powershell -ExecutionPolicy Bypass -File serve.ps1 -Root . -Port 4510
```

Test switch: `?p=0.5` jumps to that point of the timeline.
