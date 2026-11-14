"""Coastal cottage film: floor plan on a table -> house builds from the ground up ->
dollhouse orbit -> roof lands -> walk up to the front door -> foyer -> dining ->
great room -> out to the rear lanai, ending on the beach view.

Builds on build_cottage.py (same folder).

Run:  python build_walkthrough.py                 save walkthrough .blend only
      python build_walkthrough.py --test          render a few stills at low res
      python build_walkthrough.py --render [--frames 1-1040] [--out DIR]
"""
import math
import os
import runpy
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ARGS = sys.argv[1:]
sys.argv = [sys.argv[0], "--no-render", "--no-save"]
G = runpy.run_path(os.path.join(HERE, "build_cottage.py"))
sys.argv = [sys.argv[0]] + ARGS

import bpy  # noqa: E402
from mathutils import Matrix  # noqa: E402
from PIL import Image, ImageDraw, ImageFont  # noqa: E402

FT = G["FT"]
W, D, F = G["W"], G["D"], G["FLOOR_Z"]
M, box, coll, collections = G["M"], G["box"], G["coll"], G["collections"]
scene = bpy.context.scene
FPS = 24
END = 1040

# ------------------------------------------------------------------
# 1. Draw a 2D architectural floor plan from the actual model geometry
# ------------------------------------------------------------------
X0, X1, Y0, Y1 = -6.0, 56.0, -12.0, D + 5.0      # plan sheet extents (feet)
S = 32                                             # pixels per foot
PW, PH = int((X1 - X0) * S), int((Y1 - Y0) * S)
CUT = F + 4.0                                      # horizontal section height


def px(x, y):
    return ((x - X0) * S, (Y1 - y) * S)


def bbox_ft(o):
    pts = [o.matrix_world @ v.co for v in o.data.vertices]
    xs, ys, zs = [p.x / FT for p in pts], [p.y / FT for p in pts], [p.z / FT for p in pts]
    return min(xs), min(ys), min(zs), max(xs), max(ys), max(zs)


def font(size, bold=False):
    name = "DejaVuSans-Bold.ttf" if bold else "DejaVuSans.ttf"
    for p in (f"/usr/share/fonts/truetype/dejavu/{name}", name):
        try:
            return ImageFont.truetype(p, size)
        except OSError:
            continue
    return ImageFont.load_default()


img = Image.new("RGB", (PW, PH), (246, 243, 234))
dr = ImageDraw.Draw(img)
for gx in range(int(X0), int(X1) + 1, 2):
    dr.line([px(gx, Y0), px(gx, Y1)], fill=(226, 232, 238), width=1)
for gy in range(int(Y0), int(Y1) + 1, 2):
    dr.line([px(X0, gy), px(X1, gy)], fill=(226, 232, 238), width=1)

# decks with board lines
for name in ("Deck_FrontPorch", "Deck_RearLanai"):
    x0, y0, _, x1, y1, _ = bbox_ft(bpy.data.objects[name])
    dr.rectangle([px(x0, y1), px(x1, y0)], fill=(236, 228, 212), outline=(120, 110, 95), width=3)
    xx = x0
    while xx < x1:
        dr.line([px(xx, y0), px(xx, y1)], fill=(214, 202, 182), width=1)
        xx += 0.5
# tile floors
for name in ("Tile_MasterBath", "Tile_Bath2", "Tile_Laundry"):
    x0, y0, _, x1, y1, _ = bbox_ft(bpy.data.objects[name])
    dr.rectangle([px(x0, y1), px(x1, y0)], fill=(232, 238, 240))
    t = x0
    while t < x1:
        dr.line([px(t, y0), px(t, y1)], fill=(210, 220, 224), width=1)
        t += 1
    t = y0
    while t < y1:
        dr.line([px(x0, t), px(x1, t)], fill=(210, 220, 224), width=1)
        t += 1
# stairs
for o in collections["Structure"].objects:
    if o.name.startswith("Stair_"):
        x0, y0, _, x1, y1, _ = bbox_ft(o)
        dr.rectangle([px(x0, y1), px(x1, y0)], outline=(90, 90, 90), width=2)
# furniture outlines
for o in collections["Furniture"].objects:
    x0, y0, z0, x1, y1, z1 = bbox_ft(o)
    if o.name in ("Rug",):
        dr.rectangle([px(x0, y1), px(x1, y0)], outline=(190, 180, 165), width=2)
        continue
    dr.rectangle([px(x0, y1), px(x1, y0)], fill=(250, 249, 245), outline=(110, 110, 110), width=2)
# glass (thin double line)
for o in collections["Glass"].objects:
    x0, y0, _, x1, y1, _ = bbox_ft(o)
    dr.rectangle([px(x0 - 0.12, y1 + 0.12), px(x1 + 0.12, y0 - 0.12)], fill=(255, 255, 255),
                 outline=(60, 110, 150), width=2)
# walls cut at CUT height = solid
for cname in ("Exterior", "Walls"):
    for o in collections[cname].objects:
        x0, y0, z0, x1, y1, z1 = bbox_ft(o)
        if z0 <= CUT <= z1:
            dr.rectangle([px(x0, y1), px(x1, y0)], fill=(32, 34, 38))
# front door swing
dr.arc([px(24.25 - 3.5, 8 + 3.5), px(24.25 + 3.5, 8 - 3.5)], 270, 360, fill=(90, 90, 90), width=2)
# columns
for o in collections["Structure"].objects:
    if o.name.startswith("Col_"):
        x0, y0, _, x1, y1, _ = bbox_ft(o)
        dr.rectangle([px(x0, y1), px(x1, y0)], fill=(32, 34, 38))
# labels
fb, fs = font(30, True), font(24)
for txt, x, y in G["rooms"]:
    lines = txt.split("\n")
    cx, cy = px(x, y)
    hh = 34 * len(lines)
    for i, ln in enumerate(lines):
        f = fb if i == 0 else fs
        w = dr.textlength(ln, font=f)
        dr.text((cx - w / 2, cy - hh / 2 + i * 34), ln, font=f, fill=(40, 40, 44))
# title block + scale + north
dr.text(px(-4.5, D + 3.8), "COASTAL COTTAGE", font=font(54, True), fill=(30, 50, 70))
dr.text(px(-4.5, D + 1.6), "FLOOR PLAN  ·  1,700 SF HEATED  ·  2 BED + STUDY  ·  2 BATH",
        font=font(26), fill=(60, 80, 100))
for i in range(5):
    fill = (40, 40, 44) if i % 2 == 0 else (246, 243, 234)
    dr.rectangle([px(36 + i * 2, -9), px(38 + i * 2, -9.6)], fill=fill, outline=(40, 40, 44))
dr.text(px(36, -10.2), "0      4      8     10'", font=font(20), fill=(40, 40, 44))
dr.text(px(51, -7), "STREET", font=font(22, True), fill=(90, 90, 90))
dr.text(px(51, D + 3.5), "BEACH", font=font(22, True), fill=(60, 110, 150))
dr.rectangle([px(X0 + 0.4, Y1 - 0.4), px(X1 - 0.4, Y0 + 0.4)], outline=(30, 50, 70), width=6)

PLAN_PNG = os.path.join(HERE, "floor_plan.png")
img.save(PLAN_PNG)
plan_img = bpy.data.images.load(PLAN_PNG)
plan_img.pack()


def plan_material(name):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    nt = m.node_tree
    bsdf = nt.nodes["Principled BSDF"]
    tex = nt.nodes.new("ShaderNodeTexImage")
    tex.image = plan_img
    tex.interpolation = "Cubic"
    nt.links.new(tex.outputs["Color"], bsdf.inputs["Base Color"])
    bsdf.inputs["Roughness"].default_value = 0.85
    return m


def plane(name, cx, cy, z, w, h, material, collection):
    bpy.ops.mesh.primitive_plane_add(size=1)
    o = bpy.context.active_object
    o.name = name
    o.location = (cx * FT, cy * FT, z * FT)
    o.scale = (w * FT, h * FT, 1)
    bpy.ops.object.transform_apply(scale=True)
    o.data.materials.append(material)
    for c in o.users_collection:
        c.objects.unlink(o)
    coll(collection).objects.link(o)
    return o


PCX, PCY = (X0 + X1) / 2, (Y0 + Y1) / 2
SHEET_W, SHEET_H = X1 - X0, Y1 - Y0

# ------------------------------------------------------------------
# 2. The architect's table (off to the side of the site)
# ------------------------------------------------------------------
TX, TY = -900.0, -900.0            # table location (feet)
TZ = 2.5                            # table top height
K = 30.0                            # paper is the plan at 1:30
wood = G["mat"]("Table_Walnut", (0.30, 0.18, 0.10), 0.35)
floorm = G["mat"]("Studio_Floor", (0.62, 0.58, 0.52), 0.6)
box("Studio_Floor", TX - 40, TY - 40, -0.2, TX + 40, TY + 40, 0, floorm, "Table")
box("Studio_Wall", TX - 40, TY + 12, 0, TX + 40, TY + 13, 14, M["int_wall"], "Table")
box("Table_Top", TX - 3.5, TY - 2.2, TZ - 0.15, TX + 3.5, TY + 2.2, TZ, wood, "Table")
for sx in (-3.2, 3.2):
    for sy in (-1.9, 1.9):
        box("Table_Leg", TX + sx - 0.12, TY + sy - 0.12, 0, TX + sx + 0.12, TY + sy + 0.12, TZ - 0.15,
            wood, "Table")
paper = plane("Plan_Paper", TX, TY, TZ + 0.005, SHEET_W / K, SHEET_H / K, plan_material("Plan_Paper"),
              "Table")
paper.rotation_euler.z = 0
# props: pencil, mug, scale ruler, roll of trace
box("Pencil", TX + 1.3, TY - 0.9, TZ, TX + 1.95, TY - 0.86, TZ + 0.035,
    G["mat"]("Pencil", (0.95, 0.75, 0.15), 0.4), "Table")
box("Ruler", TX - 1.6, TY - 1.25, TZ, TX - 0.35, TY - 1.12, TZ + 0.03, M["counter"], "Table")
bpy.ops.mesh.primitive_cylinder_add(radius=0.16 * FT, depth=0.38 * FT,
                                    location=((TX + 1.9) * FT, (TY + 0.9) * FT, (TZ + 0.19) * FT))
mug = bpy.context.active_object
mug.data.materials.append(G["mat"]("Mug", (0.15, 0.32, 0.45), 0.3))
bpy.ops.mesh.primitive_cylinder_add(radius=0.09 * FT, depth=2.2 * FT,
                                    location=((TX - 2.2) * FT, (TY + 1.2) * FT, (TZ + 0.09) * FT),
                                    rotation=(0, math.radians(90), math.radians(15)))
roll = bpy.context.active_object
roll.data.materials.append(G["mat"]("Trace_Roll", (0.93, 0.92, 0.86), 0.7))
for o in (mug, roll):
    for c in o.users_collection:
        c.objects.unlink(o)
    coll("Table").objects.link(o)
lamp = bpy.data.objects.new("Table_Lamp", bpy.data.lights.new("Table_Lamp", "AREA"))
lamp.data.energy = 40
lamp.data.size = 1.2
lamp.location = ((TX - 1) * FT, (TY - 1) * FT, (TZ + 4) * FT)
lamp.data.color = (1.0, 0.9, 0.78)
lamp.visible_camera = False
coll("Table").objects.link(lamp)

# Same plan, full size, painted on the sand where the house will rise
decal = plane("Plan_On_Site", PCX, PCY, -2.97, SHEET_W, SHEET_H, plan_material("Plan_Site"), "Site")

# bigger ground so aerial shots never see past the edge
for nm in ("Sand", "Ocean"):
    bpy.data.objects.remove(bpy.data.objects[nm])
box("Sand", -1500, -700, -3.2, 1500, 150, -3, M["sand"], "Site")
box("Wet_Sand", -1500, 150, -3.25, 1500, 175, -3.05, G["mat"]("Wet_Sand", (0.55, 0.47, 0.34), 0.25),
    "Site")
box("Surf", -1500, 172, -3.12, 1500, 180, -3.02, G["mat"]("Surf", (0.95, 0.96, 0.95), 0.6), "Site")
box("Ocean", -6000, 175, -3.4, 6000, 6000, -3.1, M["water"], "Site")
mo = bpy.data.objects["Lanai_Table"]
mo.location.x += 10 * FT
for o in list(collections["Site"].objects):
    if o.name.startswith("Dune_"):
        o.scale.z = 0.12
        o.data.materials[0] = G["mat"]("Dune_Sand", (0.78, 0.72, 0.52), 0.95)
# lanai stairs + boardwalk to the water (built with the deck)
for i in range(11):
    z = F - (i + 1) * (F + 3) / 11
    box(f"Stair_L{i:02d}", 40, D + i * 0.92, z, 46, D + (i + 1) * 0.92, z + 0.15, M["deck"], "Structure")
box("Boardwalk", 40, D + 10, -2.9, 46, 140, -2.6, M["deck"], "Site")
for y in range(int(D) + 12, 140, 8):
    box(f"BW_Post_{y}", 39.6, y, -3, 40, y + 0.4, 0.2, M["deck"], "Site")
    box(f"BW_PostR_{y}", 46, y, -3, 46.4, y + 0.4, 0.2, M["deck"], "Site")
# dining chairs
for i, (cx, cy) in enumerate([(30.5, 12.2), (33.5, 12.2), (30.5, 18.8), (33.5, 18.8)]):
    box(f"Chair_{i}", cx - 0.8, cy - 0.8, F, cx + 0.8, cy + 0.8, F + 1.5, M["fabric"], "Furniture")
    by = cy - 0.8 if cy < 15 else cy + 0.6
    box(f"ChairBack_{i}", cx - 0.8, by, F, cx + 0.8, by + 0.2, F + 3.0, M["fabric"], "Furniture")
box("Pendant", 31.7, 15.2, F + 6.5, 32.3, 15.8, F + 7.2, M["door"], "Furniture")

# ------------------------------------------------------------------
# 3. Construction animation
# ------------------------------------------------------------------
def key(o, path, frame, value, index=-1):
    if index >= 0:
        getattr(o, path)[index] = value
    else:
        setattr(o, path, value)
    o.keyframe_insert(path, index=index, frame=frame)


def set_origin(o, axis, side="min"):
    """Move the object's origin to the min (or max) face along axis, keeping it in place."""
    vs = [v.co[axis] for v in o.data.vertices]
    edge = min(vs) if side == "min" else max(vs)
    t = [0, 0, 0]
    t[axis] = -edge
    o.data.transform(Matrix.Translation(t))
    loc = list(o.location)
    loc[axis] += edge
    o.location = loc


def grow(o, axis, start, dur, side="min"):
    set_origin(o, axis, side)
    show_from(o, start)
    key(o, "scale", start, 0.001, axis)
    key(o, "scale", start + dur, 1.0, axis)


def pop(o, start, dur=10):
    o.scale = (0.001, 0.001, 0.001)
    o.keyframe_insert("scale", frame=start)
    o.scale = (1, 1, 1)
    o.keyframe_insert("scale", frame=start + dur)


def show_from(o, frame):
    o.hide_render = True
    o.hide_viewport = True
    o.keyframe_insert("hide_render", frame=frame - 1)
    o.keyframe_insert("hide_viewport", frame=frame - 1)
    o.hide_render = False
    o.hide_viewport = False
    o.keyframe_insert("hide_render", frame=frame)
    o.keyframe_insert("hide_viewport", frame=frame)


def hide_from(o, frame):
    o.hide_render = False
    o.keyframe_insert("hide_render", frame=frame - 1)
    o.hide_render = True
    o.keyframe_insert("hide_render", frame=frame)


objs = lambda c: list(collections[c].objects) if c in collections else []  # noqa: E731

# pilings rise out of the sand
pilings = sorted([o for o in objs("Structure") if o.name.startswith("Piling_")],
                 key=lambda o: o.location.x + o.location.y * 0.6)
for i, o in enumerate(pilings):
    s = 150 + int(i * 40 / len(pilings))
    z = o.location.z
    key(o, "location", s, z - 12 * FT, 2)
    key(o, "location", s + 14, z, 2)

# floor system sweeps from street side to ocean side
for o in [bpy.data.objects["Floor_Beams"]] + objs("Floors"):
    grow(o, 1, 195, 26)

# walls rise, front-left to back-right
walls = sorted(objs("Exterior") + objs("Walls"), key=lambda o: o.location.x * 0.4 + o.location.y)
for i, o in enumerate(walls):
    grow(o, 2, 225 + int(i * 55 / len(walls)), 16)
for o in objs("Glass") + [bpy.data.objects["Ext_Front_door2"]]:
    grow(o, 2, 285, 14)

# stairs, rails, columns
steps = sorted([o for o in objs("Structure") if o.name.startswith("Stair_")], key=lambda o: o.name)
for i, o in enumerate(steps):
    pop(o, 298 + i * 2, 8)
for o in objs("Structure"):
    if o.name.startswith(("Stringer_", "Col_")):
        grow(o, 2, 300, 16)
    elif o.name.startswith("Rail_"):
        grow(o, 2, 312, 12)

# furniture pops in
furn = sorted(objs("Furniture"), key=lambda o: o.location.y)
for i, o in enumerate(furn):
    pop(o, 330 + int(i * 30 / len(furn)), 10)

# roof lands after the dollhouse orbit
ROOF_T0, ROOF_T1 = 470, 520
for o in objs("Roof"):
    show_from(o, ROOF_T0)
    z0 = o.location.z
    key(o, "location", ROOF_T0, z0 + 45 * FT, 2)
    key(o, "location", ROOF_T1, z0, 2)
for o in objs("Ceiling"):
    show_from(o, ROOF_T1)
hide_from(decal, ROOF_T0)

# front door swings in, rear slider retracts into its pocket
door = bpy.data.objects["Ext_Front_door2"]
door.data.transform(Matrix.Translation((0, 0, 0)))
vx = [v.co.x for v in door.data.vertices]
hinge = min(vx)
door.data.transform(Matrix.Translation((-hinge, 0, 0)))
door.location.x += hinge
key(door, "rotation_euler", 668, 0.0, 2)
key(door, "rotation_euler", 706, math.radians(100), 2)
slider = bpy.data.objects["Ext_Rear_slider2"]
# slider already has a z-grow; add x retract (origin to its min x)
vxs = [v.co.x for v in slider.data.vertices]
sx0 = min(vxs)
slider.data.transform(Matrix.Translation((-sx0, 0, 0)))
slider.location.x += sx0
key(slider, "scale", 860, 1.0, 0)
key(slider, "scale", 900, 0.06, 0)

# keep labels out of the film
for o in objs("Labels"):
    o.hide_render = True

# soft interior lights (ceiling level), invisible to camera
for nm, x, y, e in [("Great", 26, 32, 260), ("Kitchen", 22, 15, 160), ("Dining", 32, 15, 120),
                    ("Master", 8, 34, 150), ("Bed2", 43, 35, 130), ("Study", 43, 14, 110),
                    ("MBath", 5, 20, 70), ("Bath2", 40, 24, 60), ("Laundry", 8, 11, 40)]:
    L = bpy.data.objects.new(f"Light_{nm}", bpy.data.lights.new(f"Light_{nm}", "AREA"))
    L.data.energy = e
    L.data.size = 1.8
    L.data.color = (1.0, 0.93, 0.84)
    L.location = (x * FT, y * FT, (F + 9.4) * FT)
    L.visible_camera = False
    coll("Lights").objects.link(L)

# ------------------------------------------------------------------
# 4. Camera
# ------------------------------------------------------------------
cam = bpy.data.objects.new("Cam_Film", bpy.data.cameras.new("Cam_Film"))
scene.collection.objects.link(cam)
cam.data.lens = 35
cam.data.clip_start = 0.03
cam.data.clip_end = 3000
tgt = bpy.data.objects.new("Cam_Target", None)
scene.collection.objects.link(tgt)
tc = cam.constraints.new("TRACK_TO")
tc.target = tgt
tc.track_axis = "TRACK_NEGATIVE_Z"
tc.up_axis = "UP_Y"
scene.camera = cam

# height that makes the plan sheet exactly fill the frame vertically (match cut)
vhalf = math.atan((36 * 9 / 16 / 2) / cam.data.lens)
FILL = (SHEET_H / 2) / math.tan(vhalf) * 1.04
EYE = F + 5.5

CUT = 120
shots = [
    # frame, camera (ft), target (ft), interpolation
    (1,   (TX - 4.5, TY - 6.0, TZ + 4.2), (TX + 0.2, TY + 0.4, TZ), "BEZIER"),
    (60,  (TX - 2.0, TY - 3.0, TZ + 3.4), (TX, TY + 0.1, TZ), "BEZIER"),
    (CUT - 1, (TX, TY - 0.02, TZ + FILL / K), (TX, TY, TZ), "CONSTANT"),
    (CUT, (PCX, PCY - 0.6, -3 + FILL), (PCX, PCY, -3), "BEZIER"),
    (150, (PCX, PCY - 1.0, -3 + FILL * 0.97), (PCX, PCY, -3), "BEZIER"),
    (240, (80, -40, 70), (25, 27, F), "BEZIER"),
    (330, (98, 45, 68), (25, 27, F), "BEZIER"),
    (400, (45, 105, 72), (25, 27, F), "BEZIER"),
    (470, (-35, 75, 66), (25, 27, F), "BEZIER"),
    (530, (-45, -20, 40), (25, 27, F + 6), "BEZIER"),
    (590, (25.5, -48, 7), (26, 8, F + 3), "BEZIER"),
    (640, (25.2, -14, 3.0), (26, 8, F + 4), "BEZIER"),
    (680, (25.6, -0.5, EYE), (26, 10, F + 5), "BEZIER"),
    (712, (26.0, 4.0, EYE), (26, 14, F + 5), "BEZIER"),
    (760, (26.0, 12.0, EYE), (33, 15, F + 3), "BEZIER"),
    (810, (30.5, 20.0, EYE), (28, 36, F + 4), "BEZIER"),
    (860, (32.5, 28.0, EYE), (22, 40, F + 4), "BEZIER"),
    (905, (24.0, 37.5, EYE), (21, 46, F + 4.5), "BEZIER"),
    (950, (21.0, 44.5, EYE), (24, 110, F + 1), "BEZIER"),
    (995, (19.5, 41.0, F + 6.0), (20, 100, F - 2), "BEZIER"),
    (END, (19.0, 39.6, F + 6.2), (20, 100, F - 2), "BEZIER"),
]
for f, c, t, interp in shots:
    cam.location = tuple(v * FT for v in c)
    tgt.location = tuple(v * FT for v in t)
    cam.keyframe_insert("location", frame=f)
    tgt.keyframe_insert("location", frame=f)


def all_fcurves(ob):
    act = ob.animation_data.action if ob.animation_data else None
    if act is None:
        return []
    if hasattr(act, "fcurves"):
        return list(act.fcurves)
    out = []  # Blender 4.4+/5.x layered actions
    for layer in act.layers:
        for strip in layer.strips:
            for bag in strip.channelbags:
                out.extend(bag.fcurves)
    return out


for ob in (cam, tgt):
    for fc in all_fcurves(ob):
        for kp in fc.keyframe_points:
            match = [s for s in shots if s[0] == int(round(kp.co.x))]
            if match:
                kp.interpolation = match[0][3]

for f, l in [(1, 35), (640, 35), (690, 24), (END, 24)]:
    cam.data.lens = l
    cam.data.keyframe_insert("lens", frame=f)
cam.data.lens = 35

# exposure: bright beach outside, opened up indoors
vs = scene.view_settings
for f, e in [(1, -2.6), (CUT - 1, -2.6), (CUT, -2.2), (680, -2.2), (730, -0.9), (890, -0.9),
             (950, -2.0), (END, -2.0)]:
    vs.exposure = e
    vs.keyframe_insert("exposure", frame=f)
for fc in (scene.animation_data.action and all_fcurves(scene)) or []:
    for kp in fc.keyframe_points:
        if int(round(kp.co.x)) == CUT - 1:
            kp.interpolation = "CONSTANT"

# ------------------------------------------------------------------
# 5. Render settings + save
# ------------------------------------------------------------------
scene.frame_start, scene.frame_end = 1, END
scene.render.fps = FPS
scene.render.resolution_x, scene.render.resolution_y = 1280, 720
scene.render.resolution_percentage = 100
scene.cycles.samples = int(next((a.split("=")[1] for a in ARGS if a.startswith("--samples=")), "8"))
scene.cycles.adaptive_threshold = 0.04
scene.cycles.use_denoising = True
scene.cycles.max_bounces = 4
scene.cycles.diffuse_bounces = 2
scene.cycles.glossy_bounces = 2
scene.cycles.transmission_bounces = 4
scene.render.use_persistent_data = True
# Saved file renders straight to MP4 with Ctrl+F12 (output next to the .blend)
if hasattr(scene.render.image_settings, "media_type"):   # Blender 5.x
    scene.render.image_settings.media_type = "VIDEO"
scene.render.image_settings.file_format = "FFMPEG"
scene.render.ffmpeg.format = "MPEG4"
scene.render.ffmpeg.codec = "H264"
scene.render.ffmpeg.constant_rate_factor = "HIGH"
scene.render.filepath = "//coastal_cottage_walkthrough_"
for c in ("Roof", "Ceiling"):
    collections[c].hide_render = False
    collections[c].hide_viewport = False

bpy.ops.wm.save_as_mainfile(filepath=os.path.join(HERE, "coastal_cottage_walkthrough.blend"))
print("saved walkthrough blend", flush=True)


def arg(name, default=None):
    return ARGS[ARGS.index(name) + 1] if name in ARGS else default


if "--test" in ARGS:
    scene.render.resolution_percentage = int(arg("--pct", "50"))
    if hasattr(scene.render.image_settings, "media_type"):
        scene.render.image_settings.media_type = "IMAGE"
    scene.render.image_settings.file_format = "PNG"
    out = arg("--out", os.path.join(HERE, "test"))
    os.makedirs(out, exist_ok=True)
    for f in [int(x) for x in arg("--at", "30,119,120,200,300,420,500,600,700,780,870,930,1040").split(",")]:
        scene.frame_set(f)
        scene.render.filepath = os.path.join(out, f"t_{f:04d}.png")
        bpy.ops.render.render(write_still=True)
        print("test", f, flush=True)

if "--render" in ARGS:
    a, b = (int(x) for x in arg("--frames", f"1-{END}").split("-"))
    scene.frame_start, scene.frame_end = a, b
    if hasattr(scene.render.image_settings, "media_type"):
        scene.render.image_settings.media_type = "IMAGE"
    scene.render.image_settings.file_format = "PNG"
    scene.render.filepath = os.path.join(arg("--out", os.path.join(HERE, "frames")), "")
    bpy.ops.render.render(animation=True)
    print("render done", flush=True)
