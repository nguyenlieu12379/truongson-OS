# El Budare Café (spec demo)

Scroll-craft build, 2026-11-25, for El Budare Café (Jackson Heights, Queens: Venezuelan restaurant, two spots on Roosevelt Ave, one open 24 hours; orders on WhatsApp; no real website). **Failed** (Son, 2026-11-25: "this site looks no serious and slops"). Taken offline; recorded in `.claude/skills/site-building/FAILURES.md` (2). Kept as the example of what not to do.

One fixed stage on a clean off-white ground. Their cachapa de pabellón sits on the screen's right edge in front of a giant "BudaRe"; the covered letters sizzle. The word docks in the bar and a giant clock rolls from noon to 11 AM the next day as you scroll; a dish lands for each stretch of the day and flies into a row of tickets when its hours are over. "Morning. Still open." The tickets ring up into the clock chip, the holidays are dealt (pernil, hallacas, party tray), then fold into their storefront while the cachapa slides back in front of it and the order card rises. Brief, colour split and failure checks: `BRIEF.md`. Answers: `PREFS.md`. Photo sources: `assets/source/SOURCES.md`.

## Files

- `index.html`: markup, theme toggle script inline in the head (key `el-budare-theme`).
- `site.css`: tokens at the top. Light: `#FAF9F6` 60, logo black `#1A140E` 30, flag red `#D21034` 10 (button only). Dark: `#0E1014` ground, cream type. Lilita One + Bricolage Grotesque.
- `site.js`: one timeline `p` (0..1) from smoothed scroll; transform, opacity and clip-path only, written on change. The map iframe loads only near the end.
- `liquid-glass.css`, `liquid-glass.js`: stage 3 kit (Vivace cursor ball, glass button, magnet, theme sweep).
- `assets/`: web photos, `cut-hero.webp`, logo and icons; cutout original in `source/`.

## Run it

```powershell
powershell -ExecutionPolicy Bypass -File serve.ps1 -Root . -Port 4512
```

Test switch: `?p=0.5` jumps to that point of the timeline.
