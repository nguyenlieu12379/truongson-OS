"""Build a single-story elevated coastal cottage in Blender.

Footprint from a published plan: 50' W x 54'10" D, max ridge 27'8", 2 bed, single story.
Room layout below is our own interpretation (room sizes weren't published).

Run:  python build_cottage.py            (needs `pip install bpy`)
  or: blender -b -P build_cottage.py
Outputs coastal_cottage.blend + renders next to this file.
"""
import math
import os
import sys

import bpy

OUT = os.path.dirname(os.path.abspath(__file__))
RENDER = "--no-render" not in sys.argv
FT = 0.3048

# ---------- dimensions (feet) ----------
W, D = 50.0, 54.0 + 10 / 12        # overall footprint incl. porches
FLOOR_Z = 8.0                       # elevated on pilings (flood zone)
CEIL = 10.0
WALL_T = 0.5
EXT_T = 0.6
BODY_Y0, BODY_Y1 = 8.0, 42.0        # heated box; front porch y<8, rear lanai y>42
RIDGE_Z = 27.0 + 8 / 12

# ---------- scene reset ----------
bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene
scene.unit_settings.system = "IMPERIAL"
scene.unit_settings.length_unit = "FEET"

collections = {}


def coll(name):
    if name not in collections:
        c = bpy.data.collections.new(name)
        scene.collection.children.link(c)
        collections[name] = c
    return collections[name]


def mat(name, color, rough=0.6, metal=0.0, alpha=1.0, transmission=0.0):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    b = m.node_tree.nodes["Principled BSDF"]
    b.inputs["Base Color"].default_value = (*color, 1)
    b.inputs["Roughness"].default_value = rough
    b.inputs["Metallic"].default_value = metal
    if transmission:
        b.inputs["Transmission Weight"].default_value = transmission
        b.inputs["IOR"].default_value = 1.45
    if alpha < 1:
        b.inputs["Alpha"].default_value = alpha
    return m


M = {
    "siding": mat("Siding_White", (0.86, 0.87, 0.85), 0.7),
    "trim": mat("Trim_White", (0.95, 0.95, 0.94), 0.5),
    "int_wall": mat("Interior_Wall", (0.92, 0.90, 0.85), 0.8),
    "floor": mat("Oak_Floor", (0.55, 0.40, 0.26), 0.45),
    "tile": mat("Bath_Tile", (0.80, 0.84, 0.86), 0.3),
    "deck": mat("Deck_Wood", (0.42, 0.33, 0.25), 0.7),
    "roof": mat("Metal_Roof", (0.30, 0.38, 0.42), 0.35, 0.8),
    "piling": mat("Piling", (0.50, 0.48, 0.45), 0.9),
    "glass": mat("Glass", (0.75, 0.88, 0.95), 0.02, transmission=1.0),
    "door": mat("Door_Blue", (0.12, 0.30, 0.45), 0.4),
    "sand": mat("Sand", (0.85, 0.76, 0.58), 0.95),
    "water": mat("Ocean", (0.05, 0.30, 0.38), 0.05, transmission=0.3),
    "grass": mat("Dune_Grass", (0.45, 0.50, 0.28), 0.9),
    "counter": mat("Counter", (0.93, 0.93, 0.92), 0.2),
    "cabinet": mat("Cabinet", (0.35, 0.48, 0.52), 0.5),
    "fabric": mat("Sofa", (0.78, 0.74, 0.66), 0.9),
    "bed": mat("Bedding", (0.96, 0.96, 0.96), 0.9),
}


def box(name, x0, y0, z0, x1, y1, z1, material, collection="House"):
    """Axis-aligned box from two corners, given in feet."""
    if x1 < x0:
        x0, x1 = x1, x0
    if y1 < y0:
        y0, y1 = y1, y0
    bpy.ops.mesh.primitive_cube_add(size=1)
    o = bpy.context.active_object
    o.name = name
    o.location = ((x0 + x1) / 2 * FT, (y0 + y1) / 2 * FT, (z0 + z1) / 2 * FT)
    o.scale = ((x1 - x0) * FT, (y1 - y0) * FT, (z1 - z0) * FT)
    bpy.ops.object.transform_apply(scale=True)
    o.data.materials.append(material)
    for c in o.users_collection:
        c.objects.unlink(o)
    coll(collection).objects.link(o)
    return o


def wall(name, a, b, t, openings=(), material=None, collection="Walls", glass=True):
    """Straight wall from point a to b (axis-aligned). openings: (center_offset, width, sill, head, kind)."""
    material = material or M["int_wall"]
    (x0, y0), (x1, y1) = a, b
    horiz = y0 == y1
    length = abs(x1 - x0) if horiz else abs(y1 - y0)
    start = min(x0, x1) if horiz else min(y0, y1)
    z0, z1 = FLOOR_Z, FLOOR_Z + CEIL

    def seg(s0, s1, za, zb, m, nm):
        if s1 - s0 < 0.01 or zb - za < 0.01:
            return
        if horiz:
            box(nm, start + s0, y0 - t / 2, za, start + s1, y0 + t / 2, zb, m, collection)
        else:
            box(nm, x0 - t / 2, start + s0, za, x0 + t / 2, start + s1, zb, m, collection)

    ops = sorted(openings, key=lambda o: o[0])
    cur = 0.0
    for i, (c, w, sill, head, kind) in enumerate(ops):
        o0, o1 = c - w / 2, c + w / 2
        seg(cur, o0, z0, z1, material, f"{name}_s{i}")
        seg(o0, o1, z0, z0 + sill, material, f"{name}_sill{i}")
        seg(o0, o1, z0 + head, z1, material, f"{name}_head{i}")
        if kind == "window" and glass:
            gt = 0.08
            if horiz:
                box(f"{name}_glass{i}", start + o0, y0 - gt, z0 + sill, start + o1, y0 + gt,
                    z0 + head, M["glass"], "Glass")
            else:
                box(f"{name}_glass{i}", x0 - gt, start + o0, z0 + sill, x0 + gt, start + o1,
                    z0 + head, M["glass"], "Glass")
        if kind == "slider" and glass:
            gt = 0.08
            if horiz:
                box(f"{name}_slider{i}", start + o0, y0 - gt, z0, start + o1, y0 + gt,
                    z0 + head, M["glass"], "Glass")
            else:
                box(f"{name}_slider{i}", x0 - gt, start + o0, z0, x0 + gt, start + o1,
                    z0 + head, M["glass"], "Glass")
        if kind == "front_door":
            if horiz:
                box(f"{name}_door{i}", start + o0, y0 - 0.1, z0, start + o1, y0 + 0.1,
                    z0 + head, M["door"], "House")
        cur = o1
    seg(cur, length, z0, z1, material, f"{name}_end")


def win(c, w=3.0):
    return (c, w, 2.5, 8.0, "window")


def door(c, w=3.0):
    return (c, w, 0.0, 7.0, "door")


def slider(c, w=8.0):
    return (c, w, 0.0, 8.0, "slider")


# ---------- foundation: pilings + floor platform ----------
for x in (1, 13, 25, 37, 49):
    for y in (1, 8, 18, 28, 38, 42, D - 1):
        box(f"Piling_{x}_{y}", x - 0.5, y - 0.5, -3, x + 0.5, y + 0.5, FLOOR_Z - 1, M["piling"],
            "Structure")
box("Floor_Beams", 0, 0, FLOOR_Z - 1.0, W, D, FLOOR_Z - 0.35, M["trim"], "Structure")
box("Subfloor_Interior", 0, BODY_Y0, FLOOR_Z - 0.35, W, BODY_Y1, FLOOR_Z, M["floor"], "Floors")
box("Deck_FrontPorch", 10, 0, FLOOR_Z - 0.35, 40, BODY_Y0, FLOOR_Z - 0.1, M["deck"], "Floors")
box("Deck_RearLanai", 0, BODY_Y1, FLOOR_Z - 0.35, W, D, FLOOR_Z - 0.1, M["deck"], "Floors")

# Tile floor in baths
box("Tile_MasterBath", 0.3, 14, FLOOR_Z, 10, 26, FLOOR_Z + 0.02, M["tile"], "Floors")
box("Tile_Bath2", 36, 20, FLOOR_Z, 44, 28, FLOOR_Z + 0.02, M["tile"], "Floors")
box("Tile_Laundry", 0.3, BODY_Y0 + 0.3, FLOOR_Z, 16, 14, FLOOR_Z + 0.02, M["tile"], "Floors")

# Front stairs (down to grade from porch, centered)
steps = 11
rise = FLOOR_Z / steps
for i in range(steps):
    z = FLOOR_Z - (i + 1) * rise
    box(f"Stair_{i}", 22, -(i + 1) * 0.92, z, 28, -i * 0.92, z + 0.15, M["deck"], "Structure")
for side in (21.8, 28.2):
    box(f"Stringer_{side}", side - 0.2, -steps * 0.92, -0.2, side + 0.2, 0, 0.4, M["trim"],
        "Structure")

# Railings around porches
def rail(x0, y0, x1, y1, name):
    box(name + "_top", x0, y0, FLOOR_Z + 3.0, x1, y1, FLOOR_Z + 3.25, M["trim"], "Structure")
    n = int(max(abs(x1 - x0), abs(y1 - y0)) / 0.45)
    for i in range(n + 1):
        t = i / n
        px, py = x0 + (x1 - x0) * t, y0 + (y1 - y0) * t
        box(f"{name}_b{i}", px - 0.07, py - 0.07, FLOOR_Z, px + 0.07, py + 0.07, FLOOR_Z + 3.0,
            M["trim"], "Structure")


rail(10, 0.15, 21.8, 0.25, "Rail_Front_L")
rail(28.2, 0.15, 40, 0.25, "Rail_Front_R")
rail(10.1, 0, 10.2, BODY_Y0, "Rail_Front_SideL")
rail(39.8, 0, 39.9, BODY_Y0, "Rail_Front_SideR")
rail(0, D - 0.2, W, D - 0.1, "Rail_Lanai_Back")
rail(0.1, BODY_Y1, 0.2, D, "Rail_Lanai_L")
rail(W - 0.2, BODY_Y1, W - 0.1, D, "Rail_Lanai_R")

# Porch / lanai columns
for x in (10.3, 21.5, 28.5, 39.7):
    box(f"Col_Front_{x}", x - 0.4, 0.2, FLOOR_Z, x + 0.4, 1.0, FLOOR_Z + CEIL, M["trim"], "Structure")
for x in (0.6, 12.5, 25, 37.5, 49.4):
    box(f"Col_Lanai_{x}", x - 0.4, D - 1.0, FLOOR_Z, x + 0.4, D - 0.2, FLOOR_Z + CEIL, M["trim"],
        "Structure")

# ---------- exterior walls ----------
S = M["siding"]
# Front (y=8) faces street. Runs x 0..50.
wall("Ext_Front", (0, BODY_Y0), (W, BODY_Y0), EXT_T,
     [win(8, 3), win(20, 4), (26, 3.5, 0, 7.5, "front_door"), win(32.5, 4), win(43, 4)],
     S, "Exterior")
# Rear (y=42) faces the ocean: big glass.
wall("Ext_Rear", (0, BODY_Y1), (W, BODY_Y1), EXT_T,
     [win(5, 5), slider(12, 6), slider(21, 9), slider(31, 9), win(43, 6)], S, "Exterior")
wall("Ext_Left", (0, BODY_Y0), (0, BODY_Y1), EXT_T,
     [win(11, 2.5), win(20, 3), win(30, 4)], S, "Exterior")
wall("Ext_Right", (W, BODY_Y0), (W, BODY_Y1), EXT_T,
     [win(6, 4), win(16, 2.5), win(27, 4)], S, "Exterior")

# ---------- interior walls (positions in plan feet) ----------
I = M["int_wall"]
# Left wing x 0..16: laundry (y8-14), master bath + WIC (y14-26), master bed (y26-42)
wall("Int_LeftWing", (16, BODY_Y0), (16, BODY_Y1), WALL_T,
     [door(3), door(9), door(14)])                                  # laundry / WIC / master
wall("Int_Laundry_N", (0, 14), (16, 14), WALL_T)
wall("Int_Master_S", (0, 26), (16, 26), WALL_T, [door(5)])          # bed -> bath
wall("Int_Bath_WIC", (10, 14), (10, 26), WALL_T)
# Right wing x 36..50: study (y8-20), bath2 + linen (y20-28), bedroom 2 (y28-42)
wall("Int_RightWing", (36, BODY_Y0), (36, BODY_Y1), WALL_T,
     [door(6), door(16), door(23)])                                 # study / bath / bed2
wall("Int_Study_N", (36, 20), (W, 20), WALL_T)
wall("Int_Bed2_S", (36, 28), (W, 28), WALL_T)
wall("Int_Bath2_Linen", (44, 20), (44, 28), WALL_T, [door(4, 2.5)])

# Ceiling (hidden in plan render)
box("Ceiling", 0, BODY_Y0, FLOOR_Z + CEIL, W, BODY_Y1, FLOOR_Z + CEIL + 0.3, M["trim"], "Ceiling")

# ---------- hip roof over full footprint ----------
OH = 1.5
x0, x1, y0, y1 = -OH, W + OH, -OH, D + OH
zb = FLOOR_Z + CEIL + 0.3
half = (x1 - x0) / 2
verts = [(x0, y0, zb), (x1, y0, zb), (x1, y1, zb), (x0, y1, zb),
         (x0 + half, y0 + half, RIDGE_Z), (x0 + half, y1 - half, RIDGE_Z)]
faces = [(0, 1, 4), (1, 2, 5, 4), (2, 3, 5), (3, 0, 4, 5)]
me = bpy.data.meshes.new("Roof")
me.from_pydata([(vx * FT, vy * FT, vz * FT) for vx, vy, vz in verts], [], faces)
roof = bpy.data.objects.new("Roof_Hip_Metal", me)
coll("Roof").objects.link(roof)
roof.data.materials.append(M["roof"])
sol = roof.modifiers.new("Thickness", "SOLIDIFY")
sol.thickness = 0.35 * FT
sol.offset = 1
# fascia
box("Fascia_F", x0, y0, zb - 0.8, x1, y0 + 0.3, zb, M["trim"], "Roof")
box("Fascia_B", x0, y1 - 0.3, zb - 0.8, x1, y1, zb, M["trim"], "Roof")
box("Fascia_L", x0, y0, zb - 0.8, x0 + 0.3, y1, zb, M["trim"], "Roof")
box("Fascia_R", x1 - 0.3, y0, zb - 0.8, x1, y1, zb, M["trim"], "Roof")

# ---------- furniture blocks ----------
F, Z = "Furniture", FLOOR_Z
# Kitchen (x16-28, y8-22): back counter on front wall + island
box("Kitchen_Counter", 16.3, 8.3, Z, 28, 10.5, Z + 3, M["cabinet"], F)
box("Kitchen_Counter_Top", 16.3, 8.3, Z + 3, 28, 10.7, Z + 3.15, M["counter"], F)
box("Kitchen_Upper", 16.3, 8.3, Z + 5, 19, 9.6, Z + 8, M["cabinet"], F)
box("Fridge", 16.3, 10.7, Z, 19, 13.5, Z + 7, M["counter"], F)
box("Island", 19.5, 15, Z, 27, 18.5, Z + 3, M["cabinet"], F)
box("Island_Top", 19.3, 14.8, Z + 3, 27.2, 18.7, Z + 3.15, M["counter"], F)
# Dining (x28-36, y12-20)
box("Dining_Table", 29.5, 13, Z + 2.4, 34.5, 18, Z + 2.6, M["deck"], F)
box("Dining_Base", 31.5, 15, Z, 32.5, 16, Z + 2.4, M["deck"], F)
# Great room (x16-36, y22-42)
box("Sofa", 20, 28, Z, 31, 31, Z + 2.6, M["fabric"], F)
box("Sofa_Back", 20, 27.3, Z, 31, 28, Z + 3.2, M["fabric"], F)
box("Coffee_Table", 22.5, 32.5, Z, 28.5, 35, Z + 1.4, M["deck"], F)
box("Rug", 19, 26.5, Z, 32, 38, Z + 0.03, M["sand"], F)
box("Media_Wall", 17, 23, Z, 33, 24.5, Z + 2.2, M["cabinet"], F)
# Master bedroom (x0-16, y26-42), bed against left wall, faces ocean side
box("Master_Bed", 1, 30, Z, 8, 36.5, Z + 2, M["bed"], F)
box("Master_Headboard", 0.4, 29.5, Z, 1, 37, Z + 4.2, M["deck"], F)
# Master bath (x0-10, y14-26)
box("MBath_Vanity", 0.4, 16, Z, 2.4, 23, Z + 3, M["counter"], F)
box("MBath_Tub", 6, 22.5, Z, 9.6, 25.6, Z + 1.8, M["counter"], F)
# Walk-in closet shelving (x10-16, y14-26)
box("WIC_Shelf", 10.4, 15, Z, 11.6, 25.5, Z + 7, M["deck"], F)
# Laundry
box("Washer", 1, 8.6, Z, 3.5, 11, Z + 3, M["counter"], F)
box("Dryer", 3.8, 8.6, Z, 6.3, 11, Z + 3, M["counter"], F)
# Bedroom 2 (x36-50, y28-42)
box("Bed2", 42, 33, Z, 49.5, 38, Z + 2, M["bed"], F)
box("Bed2_Headboard", 49.4, 32.5, Z, 49.7, 38.5, Z + 4, M["deck"], F)
# Bath 2 (x36-44, y20-28)
box("Bath2_Vanity", 36.5, 20.4, Z, 41, 22.2, Z + 3, M["counter"], F)
box("Bath2_Shower", 40, 24.5, Z, 43.6, 27.6, Z + 0.3, M["tile"], F)
# Study (x36-50, y8-20)
box("Desk", 45, 9, Z, 49.5, 11.5, Z + 2.5, M["deck"], F)
box("Daybed", 37, 15, Z, 43.5, 19.5, Z + 1.8, M["fabric"], F)
# Lanai furniture
box("Lanai_Table", 20, 46, Z, 26, 50, Z + 2.5, M["deck"], F)
for i, x in enumerate((4, 9)):
    box(f"Lounger_{i}", x, 46, Z, x + 2.5, 52, Z + 1.2, M["fabric"], F)

# ---------- site: beach, dunes, ocean ----------
box("Sand", -150, -60, -3.2, 200, 170, -3, M["sand"], "Site")
box("Ocean", -400, 170, -3.4, 450, 900, -3.1, M["water"], "Site")
box("Driveway", 20, -60, -3, 30, -10, -2.95, M["trim"], "Site")
for i, (x, y, r) in enumerate([(-20, 80, 10), (10, 90, 12), (45, 85, 9), (75, 95, 11), (-45, 100, 8)]):
    bpy.ops.mesh.primitive_uv_sphere_add(radius=r * FT, location=(x * FT, y * FT, -3 * FT))
    d = bpy.context.active_object
    d.name = f"Dune_{i}"
    d.scale.z = 0.35
    d.data.materials.append(M["grass"])
    for c in d.users_collection:
        c.objects.unlink(d)
    coll("Site").objects.link(d)

# ---------- world + light ----------
world = bpy.data.worlds.new("Sky")
scene.world = world
world.use_nodes = True
nt = world.node_tree
sky = nt.nodes.new("ShaderNodeTexSky")
try:
    sky.sky_type = "MULTIPLE_SCATTERING"
except TypeError:
    sky.sky_type = "NISHITA"
sky.sun_elevation = math.radians(35)
sky.sun_rotation = math.radians(210)
nt.links.new(sky.outputs["Color"], nt.nodes["Background"].inputs["Color"])
nt.nodes["Background"].inputs["Strength"].default_value = 0.35

sun = bpy.data.objects.new("Sun", bpy.data.lights.new("Sun", "SUN"))
sun.data.energy = 4
sun.data.angle = math.radians(2)
sun.rotation_euler = (math.radians(50), math.radians(10), math.radians(-35))
scene.collection.objects.link(sun)

# ---------- room labels (text, for plan view) ----------
rooms = [
    ("GREAT ROOM\n20' x 20'", 26, 37), ("KITCHEN\n12' x 14'", 22, 20.5), ("DINING", 32, 11),
    ("MASTER\n16' x 16'", 8, 39.5), ("M. BATH", 5, 19.5), ("WIC", 13, 21),
    ("LAUNDRY", 10, 12.3), ("BED 2\n14' x 14'", 39.5, 30.5), ("BATH 2", 39, 25.5),
    ("STUDY\n14' x 12'", 41, 13), ("REAR LANAI  50' x 12'10\"", 36, 51.5),
    ("FRONT PORCH  30' x 8'", 25, 3.5), ("FOYER", 26, 9.5),
]
lab = mat("Label", (0.05, 0.05, 0.05), 0.9)
for txt, x, y in rooms:
    cu = bpy.data.curves.new(f"lbl_{txt[:8]}", "FONT")
    cu.body = txt
    cu.size = 1.1 * FT
    cu.align_x = "CENTER"
    cu.align_y = "CENTER"
    o = bpy.data.objects.new(f"Label_{txt.split()[0]}", cu)
    o.location = (x * FT, y * FT, (FLOOR_Z + 0.1) * FT)
    o.data.materials.append(lab)
    coll("Labels").objects.link(o)


# ---------- cameras + renders ----------
def look_at(cam, target):
    from mathutils import Vector
    d = Vector(target) - cam.location
    cam.rotation_euler = d.to_track_quat("-Z", "Y").to_euler()


def camera(name, loc_ft, target_ft, lens=35, ortho=None):
    c = bpy.data.objects.new(name, bpy.data.cameras.new(name))
    scene.collection.objects.link(c)
    c.location = tuple(v * FT for v in loc_ft)
    look_at(c, tuple(v * FT for v in target_ft))
    c.data.lens = lens
    if ortho:
        c.data.type = "ORTHO"
        c.data.ortho_scale = ortho * FT
    c.data.clip_end = 2000
    return c


cams = {
    "front_street": camera("Cam_Front", (-38, -62, 14), (25, 22, 14), 30),
    "ocean_side": camera("Cam_Ocean", (70, 150, 6), (25, 30, 16), 32),
    "plan_cutaway": camera("Cam_Plan", (25, D / 2, 120), (25, D / 2, 0), ortho=64),
    "aerial_cutaway": camera("Cam_Aerial", (85, -35, 75), (25, 26, 6), 32),
}


def hide(names, state):
    for n in names:
        c = collections.get(n)
        if c:
            c.hide_render = state
            c.hide_viewport = state


scene.render.engine = "CYCLES"
scene.cycles.device = "CPU"
scene.cycles.samples = 48
scene.cycles.use_denoising = True
scene.render.resolution_x = 1600
scene.render.resolution_y = 1000
scene.view_settings.view_transform = "AgX"
scene.view_settings.look = "AgX - Medium High Contrast"
scene.view_settings.exposure = -2.2

hide(["Labels"], True)

if RENDER:
    for key, cam in cams.items():
        cut = key in ("plan_cutaway", "aerial_cutaway")
        hide(["Roof", "Ceiling"], cut)
        hide(["Labels"], key != "plan_cutaway")
        if key == "plan_cutaway":
            scene.render.resolution_x, scene.render.resolution_y = 1200, 1300
        else:
            scene.render.resolution_x, scene.render.resolution_y = 1600, 1000
        scene.camera = cam
        scene.render.filepath = os.path.join(OUT, f"render_{key}.png")
        bpy.ops.render.render(write_still=True)
        print("rendered", key, flush=True)

# leave file in the "finished house" state
hide(["Roof", "Ceiling"], False)
hide(["Labels"], True)
scene.camera = cams["front_street"]
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(OUT, "coastal_cottage.blend"))
try:
    bpy.ops.export_scene.gltf(filepath=os.path.join(OUT, "coastal_cottage.glb"), export_format="GLB")
except Exception as e:  # glTF addon may be missing in some bpy builds
    print("glb export skipped:", e)
print("done")
