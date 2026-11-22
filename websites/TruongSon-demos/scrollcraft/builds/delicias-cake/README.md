# Delícias Cake & Bakery (spec demo)

Scroll-craft build, 2026-11-23. Live (noindex): https://nguyenlieu12379.github.io/truongson-OS/delicias-cake/ (deployed by `.github/workflows/deploy-pages.yml` on push to main).

One unbroken world: a camera flies through pink space past their real photos, through the front door, and lands at the counter. Brief, feeling curve and peak: `BRIEF.md`. Facts and sources: `RESEARCH.md`, `assets/source/SOURCES.md`.

## Files

- `index.html`: markup. Every place is a `.it` item with `data-z` (depth), `data-x`/`data-y` (vw/vh), `data-w` (vw). `data-mx`/`data-my`/`data-mw` override on phones.
- `site.css`: tokens at the top (pink canvas, cocoa ink, hot-pink accent; Bricolage Grotesque + Outfit).
- `site.js`: the camera, copy windows, map, and the pudim wobble. Bespoke page code (the kit engine's worldflight mode needs video clips; this world is stills).
- `lab/`: test pages only (`cut.html` calibrates the pudim cutout, `phone.html` shows 5 phone frames). Not part of the site.

## Run it

```powershell
powershell -ExecutionPolicy Bypass -File serve.ps1 -Root . -Port 4501
```

(Any static server works. Test switches: `?snap` lands the camera instantly, `?still` forces the reduced-motion version.)

## Edit

- Copy: the `.cp` blocks in `index.html`. `data-win="a b"` is the camera range where a block shows.
- Pudim cutout: `<clipPath id="pudim-cut">`, in the photo's own pixels.
- Places: change `data-z`. Map buttons jump to `GOTO` in `site.js`; the highlight follows `WAYPOINTS`.

## Before showing the client

- Confirm the WhatsApp number. Instagram graphics show (781) 365-0181; RESEARCH.md also lists (781) 661-8417.
- Confirm hours (Instagram post vs Google listing differ).
- Not tested on a real phone. Check the scroll on an iPhone before the meeting.
