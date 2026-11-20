# Corner Crema walkthrough mockup

Reference build for step 7 of `/3d-walkthrough`: what the final F&B site does. Corner Crema is a sample name, not a real venue. The footage is grey clay (structure only); in a real build each chapter is the AI clip painted from the venue's own photos.

- **Route:** 4 chapters, Street, Door, Inside, Counter. One 2 to 2.5 s clip each in `clips/` (960 px wide, every frame a keyframe, about 0.4 MB each, 1.6 MB total).
- **Playback:** scroll triggers each clip (not scrubbed). Clips queue in route order and speed up (1x plus 0.75x per chapter still to go, max 3x) when the visitor scrolls ahead or back. Turning around mid-clip reverses from that frame. Hand-off is a hard cut once the next clip's first frame is painted. Reverse steps `currentTime` back on the real clock. Clips load into memory as blob URLs so seeking works on any host.
- **Build notes box:** top right, shows the clip, size, direction and speed. Hide it for a client demo.
- **Reduced motion:** cuts straight to each chapter's still.

## Run

```bash
cd websites/TruongSon-demos/corner-crema-mockup && python3 -m http.server 8000
```

## Swap in a real venue

1. Replace the four clips in `clips/` (same names, or edit `CH` in the script): each clip must start on the exact frame where the previous one ends, at the same walking speed.
2. Edit the chapter text in `CH`, the hero text in `HERO`, and the Visit block. Keep `TODO:` for any fact the owner hasn't confirmed.
3. Change the brand name in the header and the `--tile` / `--crema` colours in `:root`.

Not published. Not tested on real devices.
