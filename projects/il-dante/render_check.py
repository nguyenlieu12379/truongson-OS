"""Quick Cycles stills from fixed cameras, to compare against the reference photos."""
import math, sys, os
import bpy
from mathutils import Vector
FT = 0.3048
bpy.ops.wm.open_mainfile(filepath=sys.argv[sys.argv.index("--blend") + 1])
out = sys.argv[sys.argv.index("--out") + 1]
samples = int(sys.argv[sys.argv.index("--samples") + 1]) if "--samples" in sys.argv else 24
sc = bpy.context.scene
sc.render.engine = "CYCLES"; sc.cycles.device = "CPU"; sc.cycles.samples = samples
sc.cycles.use_denoising = True
sc.render.resolution_x, sc.render.resolution_y = 1024, 640
VIEWS = {
    "inside": ((-38.5, -1.5, 5.4), (-33.0, -30.0, 4.4), 24),       # from the door, like the photos
    "counter": ((-30.5, -9.0, 5.2), (-42.0, -28.0, 4.0), 24),
    "corner": ((70.0, 60.0, 16.0), (-30.0, -20.0, 12.0), 30),     # from the park side, Ocean Dr / 8th
    "eighth": ((-36.0, 34.0, 5.5), (-37.0, -5.0, 6.0), 28),       # across 8th St at the storefront
    "aerial": ((260.0, 180.0, 210.0), (-20.0, -10.0, 0.0), 35),
}
os.makedirs(out, exist_ok=True)
for name, (pos, look, lens) in VIEWS.items():
    if "--only" in sys.argv and name not in sys.argv[sys.argv.index("--only") + 1].split(","): continue
    cam = bpy.data.objects.new(name, bpy.data.cameras.new(name)); sc.collection.objects.link(cam)
    cam.location = Vector(pos) * FT
    cam.rotation_euler = (Vector(look) * FT - cam.location).to_track_quat("-Z", "Y").to_euler()
    cam.data.lens = lens; cam.data.clip_end = 3000
    sc.camera = cam
    sc.render.filepath = os.path.join(out, name + ".png")
    bpy.ops.render.render(write_still=True)
    print("rendered", name, flush=True)
