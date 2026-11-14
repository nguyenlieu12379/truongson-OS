# Coastal Cottage (Blender)

Single-story elevated beach cottage built in Blender from a script.

- **Source footprint:** published single-story 2-bed coastal cottage plan, 50' W x 54'10" D, 27'8" max ridge (lovehomedesigns.com plan 6376). Room sizes weren't public, so the room layout is our own.
- **Layout:** front porch 30'x8', foyer, kitchen 12'x14' with island, dining, great room 20'x20', master 16'x16' + bath + WIC, bed 2 14'x14', bath 2, study 14'x12', laundry, rear lanai 50'x12'10" with sliders to the ocean. Raised 8' on pilings, 10' ceilings, hip metal roof.
- **Files:** `coastal_cottage.blend` (organized in collections: Walls, Exterior, Roof, Furniture, Labels...), `coastal_cottage.glb` (web/three.js), `render_*.png`.
- **Rebuild:** `pip install bpy` then `python build_cottage.py` (or `blender -b -P build_cottage.py`). Add `--no-render` to skip renders. All dimensions are in feet at the top of the script.
