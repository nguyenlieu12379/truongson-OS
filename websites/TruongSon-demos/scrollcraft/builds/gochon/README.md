# Gochón (prospect demo)

Spec site for Gochón, a Venezuelan pasapalos counter at 7868 NW 52nd St, Doral FL. WhatsApp 786-670-5020. Built 2026-11-25 with `/site-building` (pre-build defaults, scroll-craft, liquid glass).

- Brief, grammar, feeling curve, gate: `BRIEF.md`. Preferences: `PREFS.md`. Facts and what to confirm: `RESEARCH.md`. Photo sources: `assets/source/SOURCES.md`.
- Live (noindex): https://nguyenlieu12379.github.io/truongson-OS/gochon/ after the Pages deploy. Not in the approved Sites list until Son or Truong approve it.

## Run locally

```powershell
node .claude/skills/site-building/scripts/serve.mjs --root websites/TruongSon-demos/scrollcraft/builds/gochon --port 4513
```

Open http://localhost:4513. `?p=0.42` jumps to any point of the timeline.

## How it works

- One fixed stage (`#stage`) and a tall spacer. `site.js` turns smoothed scroll into one progress value and moves layers with transform, clip-path and opacity only.
- The counter clip (`assets/case.mp4`, `case-m.mp4` on phones) is fetched whole and scrubbed. Shelf-tag positions per frame are in `TAGK` in `site.js` (measured from the footage).
- Hero: `tray-plate.jpg` is the frame with the pieces removed; `pieces.webp` sits on it at 260,209 (735x597 on the 1080x1500 plate).
- Edit copy in `index.html`. Colours and type are tokens at the top of `site.css`. Bump `?v=` on CSS/JS after changes.

## To confirm with the client
Prices (from their 2025 graphics), Sunday closing time (4 PM on IG, 3 PM on one Facebook post).
