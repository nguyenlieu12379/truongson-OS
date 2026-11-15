"""Surroundings for the coastal cottage: a street behind the house, a hill rising on the
side away from the beach, neighbour houses (two each side on the beach, a few up the hill),
and trees. Kept to what the walkthrough camera actually sees, so it stays light to bake
and to load on the web.

Plan axes (feet): x across the front, y from the street (y = 0) toward the beach (+y),
z up. The ground is at z = -3. The beach and ocean are at +y, so the hill is at -y.

Call add(design_pass) after the golden-hour scene is loaded.
"""
import math
import random

import bmesh
import bpy
from mathutils import Matrix, Vector

FT = 0.3048
GROUND = -3.0
R = random.Random(11)


def hill_z(x, y):
    """Ground height (ft) at plan point x, y. Flat near the house, rising behind the street."""
    t = min(1.0, max(0.0, (-y - 55.0) / 260.0))      # 0 at y=-55, 1 at y=-315
    rise = 95.0 * t * t * (3 - 2 * t)                 # smoothstep up to +95 ft
    swell = 6.0 * math.sin(x * 0.021) * math.sin(y * 0.017) * t
    return GROUND + rise + swell


def hill_mesh(name, mat, x0=-420, x1=470, y0=-520, y1=-40, step=14.0):
    bm = bmesh.new()
    nx, ny = int((x1 - x0) / step) + 1, int((y1 - y0) / step) + 1
    verts = []
    for j in range(ny):
        row = []
        for i in range(nx):
            x, y = x0 + i * step, y0 + j * step
            row.append(bm.verts.new((x * FT, y * FT, (hill_z(x, y) + 0.05) * FT)))
        verts.append(row)
    for j in range(ny - 1):
        for i in range(nx - 1):
            f = bm.faces.new((verts[j][i], verts[j][i + 1], verts[j + 1][i + 1], verts[j + 1][i]))
            f.smooth = True
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me)
    bm.free()
    me.materials.append(mat)
    o = bpy.data.objects.new(name, me)
    bpy.data.collections["Env"].objects.link(o)
    return o


def house(dp, name, cx, cy, w, d, base_z, stilts, body_m, roof_m, trim_m, win_m, door_m, deck_m,
          facing=1, stories=1):
    """A simple neighbour house. facing=+1 front faces -y (street), -1 faces +y."""
    p = dp.Piece(name, "Env")
    floor = base_z + stilts
    h = 10.0 * stories
    if stilts:
        for sx in (-w / 2 + 1, -w / 6, w / 6, w / 2 - 1):
            for sy in (-d / 2 + 1, 0, d / 2 - 1):
                p.box(cx + sx - 0.5, cy + sy - 0.5, base_z, cx + sx + 0.5, cy + sy + 0.5, floor, deck_m)
        p.box(cx - w / 2, cy - d / 2, floor - 0.8, cx + w / 2, cy + d / 2, floor, deck_m)
    p.box(cx - w / 2, cy - d / 2, floor, cx + w / 2, cy + d / 2, floor + h, body_m)
    # hip roof: a 4-sided cone scaled to the footprint
    rh = 0.32 * min(w, d) + 2
    mx = (Matrix.Translation(Vector((cx, cy, floor + h + rh / 2)) * FT)
          @ Matrix.Diagonal(((w + 3) / math.sqrt(2) * FT, (d + 3) / math.sqrt(2) * FT, 1, 1))
          @ Matrix.Rotation(math.radians(45), 4, "Z"))
    res = bmesh.ops.create_cone(p.bm, cap_ends=True, segments=4, radius1=1.0, radius2=0.0,
                                depth=rh * FT, matrix=mx)
    p._tag(res, roof_m)
    # windows and a door on the street and beach faces, trim band at the eaves
    fy, by = cy - facing * d / 2, cy + facing * d / 2
    for s in range(stories):
        z0 = floor + 3 + s * 10
        for k in range(-2, 3):
            if k == 0 and s == 0:
                continue
            x = cx + k * w / 5.2
            for yy in (fy, by):
                off = -facing * 0.15 if yy == fy else facing * 0.15
                p.box(x - 1.6, yy + off - 0.15, z0, x + 1.6, yy + off + 0.15, z0 + 4.2, win_m)
                p.box(x - 1.9, yy + off - 0.2, z0 - 0.3, x + 1.9, yy + off + 0.2, z0, trim_m)
    p.box(cx - 1.6, fy - facing * 0.2 - 0.15, floor, cx + 1.6, fy - facing * 0.2 + 0.15, floor + 7, door_m)
    p.box(cx - w / 2 - 0.3, cy - d / 2 - 0.3, floor + h - 0.8, cx + w / 2 + 0.3, cy + d / 2 + 0.3,
          floor + h, trim_m)
    # a front porch deck with a few posts
    py = fy - facing * 4
    p.box(cx - w / 3, min(fy, py), floor - 0.6, cx + w / 3, max(fy, py), floor, deck_m)
    if stilts:
        for sx in (-w / 3 + 0.5, w / 3 - 0.5):
            p.box(cx + sx - 0.4, py - 0.4, base_z, cx + sx + 0.4, py + 0.4, floor, deck_m)
    return p.build(0.0)


def tree(dp, name, x, y, z, h, crown, trunk_m, leaf_m):
    """Round-crowned shade tree (live oak / sea grape look): trunk + 4 to 6 overlapping blobs."""
    p = dp.Piece(name, "Env")
    p.cyl(x, y, z - 0.5, z + h * 0.55, 0.9, trunk_m, 0.55, seg=8)
    for k in range(R.randint(4, 6)):
        a = R.uniform(0, 2 * math.pi)
        r = R.uniform(0.2, 0.5) * crown
        c = (x + math.cos(a) * r, y + math.sin(a) * r, z + h * R.uniform(0.6, 0.85))
        s = crown * R.uniform(0.45, 0.65)
        p.ell(c, (s, s, s * 0.75), leaf_m, rot=(0, 0, R.uniform(0, 360)), seg=10)
    return p.build(0.0)


def add(dp):
    """Build the surroundings. dp = the design_pass module (materials and mesh helpers)."""
    if "Env" not in bpy.data.collections:
        c = bpy.data.collections.new("Env")
        bpy.context.scene.collection.children.link(c)

    # materials
    grass = dp.get_mat("Hill_Grass")
    n, b = dp.fresh(grass)
    nz = n.new("ShaderNodeTexNoise", Scale=0.08, Detail=8.0)
    n.link(dp.objcoord(n), nz.inputs["Vector"])
    ramp = n.new("ShaderNodeValToRGB")
    ramp.color_ramp.elements[0].color = (0.16, 0.20, 0.08, 1)
    ramp.color_ramp.elements[1].color = (0.40, 0.38, 0.20, 1)
    n.link(nz.outputs["Fac"], ramp.inputs["Fac"])
    n.link(ramp.outputs["Color"], b.inputs["Base Color"])
    b.inputs["Roughness"].default_value = 0.95
    asphalt = dp.plain("Asphalt", (0.07, 0.07, 0.075), 0.85, noise_bump=0.1)
    curb = dp.plain("Curb", (0.62, 0.61, 0.58), 0.8)
    roof_grey = dp.standing_seam("Roof_Grey", (0.38, 0.40, 0.41))
    roof_dark = dp.standing_seam("Roof_Dark", (0.20, 0.22, 0.25))
    trim = bpy.data.materials["Trim_White"]
    win = dp.plain("Window_Dark", (0.05, 0.07, 0.09), 0.1)
    door = bpy.data.materials["Door_Blue"]
    deck = bpy.data.materials["Deck_Wood"]
    bodies = [dp.lap_siding(nm, c) for nm, c in (("Siding_Sky", (0.55, 0.70, 0.78)),
                                                    ("Siding_Sage", (0.60, 0.68, 0.58)),
                                                    ("Siding_Sand", (0.86, 0.78, 0.62)),
                                                    ("Siding_Coral", (0.86, 0.62, 0.52)),
                                                    ("Siding_Grey", (0.70, 0.71, 0.70)))]
    bark = dp.plain("Bark", (0.20, 0.15, 0.11), 0.9)
    leaf_dark = dp.plain("Leaf_Oak", (0.10, 0.17, 0.07), 0.8, sss=0.05)
    leaf_light = dp.plain("Leaf_Grape", (0.20, 0.30, 0.10), 0.8, sss=0.05)
    palm_trunk = bpy.data.materials.get("Palm_Trunk") or bark
    frond = bpy.data.materials.get("Palm_Frond") or leaf_light

    # the hill behind the street, and the street itself
    hill_mesh("Env_Hill", grass)
    p = dp.Piece("Env_Street", "Env")
    p.box(-420, -46, GROUND - 0.1, 470, -30, GROUND + 0.04, asphalt)
    p.box(-420, -30, GROUND - 0.1, 470, -29, GROUND + 0.35, curb)
    p.box(-420, -47, GROUND - 0.1, 470, -46, GROUND + 0.35, curb)
    for k in range(-420, 470, 22):                                  # centre line dashes
        p.box(k, -38.3, GROUND + 0.04, k + 10, -37.7, GROUND + 0.06, curb)
    p.box(22, -29, GROUND - 0.1, 30, -6, GROUND + 0.05, curb)        # path to the stairs
    p.build(0)

    # beach neighbours, on stilts, facing the street like the cottage
    for i, (cx, w, d, st) in enumerate(((-80, 42, 46, 1), (-150, 46, 40, 2), (130, 44, 44, 1),
                                        (200, 40, 48, 2))):
        house(dp, f"Env_House_Beach_{i}", cx, 25, w, d, GROUND, 8.0, bodies[i % len(bodies)],
              roof_grey if i % 2 else roof_dark, trim, win, door, deck, facing=1, stories=st)
    # houses up the hill, facing down toward the beach
    for i, (cx, cy, w, d) in enumerate(((-120, -95, 36, 30), (-30, -120, 40, 32), (70, -100, 38, 30),
                                        (160, -125, 36, 34), (-200, -150, 34, 30), (20, -205, 40, 32),
                                        (120, -215, 36, 30))):
        z = min(hill_z(cx + sx, cy + sy) for sx in (-w / 2, w / 2) for sy in (-d / 2, d / 2))
        house(dp, f"Env_House_Hill_{i}", cx, cy, w, d, z - 1.0, 1.0, bodies[(i + 2) % len(bodies)],
              roof_dark if i % 2 else roof_grey, trim, win, door, deck, facing=-1, stories=1 + (i % 2))

    # trees: shade trees on the hill and along the street, a few palms by the street
    spots = []
    while len(spots) < 34:
        x, y = R.uniform(-380, 430), R.uniform(-330, -50)
        if any(abs(x - hx) < 30 and abs(y - hy) < 28 for hx, hy, *_ in
               ((-120, -95), (-30, -120), (70, -100), (160, -125), (-200, -150), (20, -205), (120, -215))):
            continue
        if -30 < x < 80 and y > -60:                                # keep the approach view open
            continue
        spots.append((x, y))
    for i, (x, y) in enumerate(spots):
        tree(dp, f"Env_Tree_{i}", x, y, hill_z(x, y), R.uniform(18, 30), R.uniform(9, 14), bark,
             leaf_dark if i % 3 else leaf_light)
    for i, x in enumerate((-60, -12, 66, 104, 150)):
        dp.palm(f"Env_Palm_{i}", x, -52, hill_z(x, -52), R.uniform(24, 34),
                (R.uniform(2, 5), R.uniform(0, 6.28)), palm_trunk, frond, coll="Env")
    for i, (x, y) in enumerate(((-110, 70), (-185, 60), (95, 72), (170, 68), (240, 40))):
        dp.palm(f"Env_BeachPalm_{i}", x, y, GROUND, R.uniform(26, 36),
                (R.uniform(3, 6), R.uniform(0, 6.28)), palm_trunk, frond, coll="Env")
