# Coastal Cottage (Blender)

Single-story elevated beach cottage built in Blender from a script.

- **Source footprint:** published single-story 2-bed coastal cottage plan, 50' W x 54'10" D, 27'8" max ridge (lovehomedesigns.com plan 6376). Room sizes weren't public, so the room layout is our own.
- **Layout:** front porch 30'x8', foyer, kitchen 12'x14' with island, dining, great room 20'x20', master 16'x16' + bath + WIC, bed 2 14'x14', bath 2, study 14'x12', laundry, rear lanai 50'x12'10" with sliders to the ocean. Raised 8' on pilings, 10' ceilings, hip metal roof.
- **Files:** `coastal_cottage.blend` (organized in collections: Walls, Exterior, Roof, Furniture, Labels...), `coastal_cottage.glb` (web/three.js), `render_*.png`.
- **Rebuild:** `pip install bpy` then `python build_cottage.py` (or `blender -b -P build_cottage.py`). Add `--no-render` to skip renders. All dimensions are in feet at the top of the script.

## Walkthrough film

`coastal_cottage_walkthrough.blend`: a 1,040-frame (43 s @ 24 fps) animation.
1. Floor plan on an architect's table (frames 1-119)
2. Match cut to the same plan on the sand, house builds ground up: pilings, floor, walls, glass, stairs, furniture (120-360)
3. Dollhouse orbit, roof off (360-470), then the roof lands (470-520)
4. Fly down to the street, up the stairs, front door opens (520-710)
5. Foyer, dining, great room, rear slider opens (710-905)
6. Out to the rear lanai, ending on the beach view (905-1040)

Open it in Blender and press Space to play, or Ctrl+F12 to render an MP4 next to the file. Cycles, 8 samples, 1280x720. Switch Render Engine to EEVEE for a much faster render on a GPU.
Rebuild: `python build_walkthrough.py` (needs `pip install bpy pillow`). `--test` renders stills; `--render --frames 1-1040 --out DIR` renders PNG frames.
