# Coastal Cottage: scroll walkthrough

A scroll-driven walkthrough of the golden-hour coastal cottage film. The background is the rendered Blender film, not live 3D: scrolling down plays it forward, scrolling up plays it back. Six text panels fade in over the film's beats.

Film and Blender scene: `projects/coastal-cottage/` (`coastal_cottage_walkthrough_golden.mp4`, built by `build_walkthrough.py` + `design_pass.py`).

## Beats

| Panel | Film range | Shows |
| --- | --- | --- |
| Hero | 0 to 0.05 | The floor plan on the table |
| 01 The plan | 0.065 to 0.115 | Close on the plan |
| 02 The build | 0.17 to 0.33 | The house rising from the ground |
| 03 Every room | 0.37 to 0.45 | Dollhouse view, roof off |
| 04 Arrival | 0.53 to 0.66 | Up the stairs, front door opens |
| 05 Inside | 0.71 to 0.85 | Foyer, dining, great room |
| 06 The lanai | 0.9 to 1 | Golden hour on the beach, call to action |

## Run

```bash
python3 -m http.server 8000 --directory websites/TruongSon-demos/coastal-cottage
```

Open http://localhost:8000. It needs a server (ES modules), not a file:// open.

## Edit

- **Copy:** the `<section class="panel">` blocks in `index.html`. `data-in` / `data-out` set where each shows (0 to 1 of the film). `left`, `right` or `center` sets the side.
- **Settings:** `assets/beats.js` (frame count, scroll length, background colour).
- **New render:** re-make the frames from the PNG frames Blender wrote:
  `.claude/skills/3d-walkthrough/scripts/make_frames.sh <png_dir> websites/TruongSon-demos/coastal-cottage 2`
- `assets/film.js` is the shared engine from the skill template. Don't fork it per site.

## Weight

520 frames (every 2nd film frame), WebP. Desktop set 1280 wide, about 15 MB. Phone set 854 wide, about 8 MB. A coarse pass (1 in 16) loads first, then the rest fills in while you scroll.

## Open items

- `TODO: contact link` on the "Get one for your place" button.
- Tested headless in Chromium at 1280x760 and 390x844. Not tested on real phones or Safari.
