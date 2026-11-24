# Brazilian Passion Foods (spec demo)

**Marked a failure by Son, 2026-11-23: "looks AI slop".** Kept as a reference for what not to do. See `.claude/skills/site-building/FAILURES.md`.

Pastel food truck, Orlando. Taken offline and all Instagram images deleted on 2026-11-23 at Son's request. The code stays as a reference; the page will not render without the images.

One unbroken stage: the scroll scrubs their own kitchen clip, holds on full-res photos, ends at the truck and the WhatsApp button. Brief: `BRIEF.md`. Son's answers: `PREFS.md`. Sources: `assets/source/SOURCES.md`.

Run locally: `powershell -ExecutionPolicy Bypass -File serve.ps1 -Root . -Port 4502` (or "bpf" in `.claude/launch.json`). Test switch: `?snap` turns off scroll smoothing.

Edit:
- Copy: the `.cp` blocks in `index.html`; `data-a`/`data-b` are the scroll range (0 to 1).
- What the camera shows: `shot()` and the `VK` keyframes in `site.js`.

Before showing the client:
- Confirm WhatsApp (689) 305-0044.
- Check on a real phone (frame scrub, 7.9 MB of frames).
