"""Surroundings for the coastal cottage: a Miami-style beach town behind the house (the road,
shops, street furniture, cars and the beach dressing are in town.py), a hill rising behind the
town, neighbour houses along the beach and up the hill, shade trees and palms.

Plan axes (feet): x across the front, y from the street (y = 0) toward the beach (+y),
z up. The ground is at z = -3. The beach and ocean are at +y, so the hill is at -y.

Call add(design_pass) after the golden-hour scene is loaded.
"""
import math
import random

import bmesh
import bpy
from mathutils import Euler, Matrix, Vector

import town

FT = 0.3048
GROUND = -3.0
R = random.Random(11)


def hill_z(x, y):
    """Ground height (ft) at plan point x, y. Flat near the house, rising behind the street."""
    t = min(1.0, max(0.0, (-y - 165.0) / 260.0))     # 0 at y=-165 (behind the town), 1 at y=-425
    rise = 95.0 * t * t * (3 - 2 * t)                 # smoothstep up to +95 ft
    swell = 6.0 * math.sin(x * 0.021) * math.sin(y * 0.017) * t
    return GROUND + rise + swell


def hill_mesh(name, mat, x0=-700, x1=760, y0=-640, y1=-150, step=16.0):
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
          facing=1, stories=1, shutter_m=None, skirt_m=None):
    """A neighbour house: stilts with a lattice skirt, lap siding, hip roof, windows with trim and
    shutters, a porch with railings. facing=+1 front faces -y (street), -1 faces +y."""
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
                p.box(x - 1.9, yy + off - 0.2, z0 + 4.2, x + 1.9, yy + off + 0.2, z0 + 4.6, trim_m)
                if shutter_m:
                    for sd in (-1, 1):
                        p.box(x + sd * 2.6 - 0.7, yy + off - 0.2, z0, x + sd * 2.6 + 0.7, yy + off + 0.2,
                              z0 + 4.2, shutter_m)
    p.box(cx - 1.6, fy - facing * 0.2 - 0.15, floor, cx + 1.6, fy - facing * 0.2 + 0.15, floor + 7, door_m)
    p.box(cx - w / 2 - 0.3, cy - d / 2 - 0.3, floor + h - 0.8, cx + w / 2 + 0.3, cy + d / 2 + 0.3,
          floor + h, trim_m)
    # a front porch deck with a few posts
    py = fy - facing * 4
    p.box(cx - w / 3, min(fy, py), floor - 0.6, cx + w / 3, max(fy, py), floor, deck_m)
    if stilts:
        for sx in (-w / 3 + 0.5, w / 3 - 0.5):
            p.box(cx + sx - 0.4, py - 0.4, base_z, cx + sx + 0.4, py + 0.4, floor, deck_m)
        if skirt_m:                                       # lattice skirt between the stilts
            for yy in (cy - d / 2 + 1, cy + d / 2 - 1):
                p.box(cx - w / 2 + 1, yy - 0.15, base_z, cx + w / 2 - 1, yy + 0.15, floor - 1.2, skirt_m)
    # porch railing: posts, top rail, a roof over the porch on two more posts
    for sx in (-w / 3, w / 3):
        p.box(cx + sx - 0.3, py - 0.3, floor, cx + sx + 0.3, py + 0.3, floor + 9.0, trim_m)
    for sx0, sx1 in ((-w / 3, -2.2), (2.2, w / 3)):
        p.box(cx + sx0, py - 0.2, floor + 3.0, cx + sx1, py + 0.2, floor + 3.3, trim_m)
        k = sx0
        while k < sx1:
            p.box(cx + k - 0.08, py - 0.08, floor, cx + k + 0.08, py + 0.08, floor + 3.0, trim_m)
            k += 1.1
    p.obox((cx, (py + fy) / 2, floor + 9.3), (w * 2 / 3 + 1.5, abs(fy - py) + 1.5, 0.35), roof_m,
           rot=(facing * 8, 0, 0))
    return p.build(0.0)


def leaf_material(dp, name, dark, light):
    """Foliage: clumps of leaves in varied greens (Voronoi cells), darker gaps between them."""
    m = dp.get_mat(name)
    n, b = dp.fresh(m)
    co = dp.objcoord(n)
    vo = n.new("ShaderNodeTexVoronoi", Scale=9.0)
    n.link(co, vo.inputs["Vector"])
    nz = n.new("ShaderNodeTexNoise", Scale=3.0, Detail=6.0)
    n.link(co, nz.inputs["Vector"])
    mix = n.math("ADD", n.math("MULTIPLY", vo.outputs["Distance"], 0.9),
                 n.math("MULTIPLY", nz.outputs["Fac"], 0.6))
    ramp = n.new("ShaderNodeValToRGB")
    ramp.color_ramp.elements[0].position = 0.15
    ramp.color_ramp.elements[0].color = (*light, 1)
    ramp.color_ramp.elements[1].position = 0.95
    ramp.color_ramp.elements[1].color = (*dark, 1)
    n.link(mix, ramp.inputs["Fac"])
    n.link(ramp.outputs["Color"], b.inputs["Base Color"])
    b.inputs["Roughness"].default_value = 0.7
    dp.bump(n, b, vo.outputs["Distance"], 0.6, 0.03)
    return m


def frond_material(dp, name, dark, light):
    """Palm frond: pinnate leaflets as diagonal stripes from the midrib out (UV: u along, v across),
    with dark gaps between them and lighter tips."""
    m = dp.get_mat(name)
    n, b = dp.fresh(m)
    uv = n.new("ShaderNodeTexCoord").outputs["UV"]
    u, v = n.xyz(uv)[0], n.xyz(uv)[1]
    across = n.math("ABSOLUTE", n.math("SUBTRACT", v, 0.5))
    stripe = n.math("FRACT", n.math("ADD", n.math("MULTIPLY", u, 46.0), n.math("MULTIPLY", across, 7.0)))
    gap = n.math("GREATER_THAN", stripe, 0.8)            # thin dark gap between leaflets
    ramp = n.new("ShaderNodeValToRGB")
    ramp.color_ramp.elements[0].color = (*light, 1)
    ramp.color_ramp.elements[1].color = (*dark, 1)
    tipish = n.math("MULTIPLY", n.math("SUBTRACT", 1.0, n.math("MULTIPLY", across, 2.0)), 0.6)
    n.link(n.math("ADD", n.math("MULTIPLY", gap, 0.8), n.math("MULTIPLY", tipish, 0.4)), ramp.inputs["Fac"])
    n.link(ramp.outputs["Color"], b.inputs["Base Color"])
    b.inputs["Roughness"].default_value = 0.6
    return m


def lumpy(p, c, r, mat, squash=0.8):
    """A leaf clump: an icosphere with its surface jittered, so the canopy isn't smooth balls."""
    mx = Matrix.Translation(Vector(c) * FT) @ Matrix.Diagonal((r * FT, r * FT, r * squash * FT, 1))
    res = bmesh.ops.create_icosphere(p.bm, subdivisions=2, radius=1.0, matrix=mx)
    cen = Vector(c) * FT
    for v in res["verts"]:
        d = v.co - cen
        v.co = cen + d * R.uniform(0.82, 1.18)
    p._tag(res, mat, True)


def tree(dp, name, x, y, z, h, crown, trunk_m, leaf_m):
    """Shade tree (live oak / sea grape): trunk, a few branches, and a dense crown of 15-20 lumpy
    leaf clumps, so light and shadow break up between them like a real canopy."""
    p = dp.Piece(name, "Env")
    top = z + h * 0.5
    p.cyl(x, y, z - 0.5, top, 0.95, trunk_m, 0.6, seg=8)
    base = z + h * 0.62
    for k in range(R.randint(3, 4)):                    # branches fanning up into the crown
        a = R.uniform(0, 2 * math.pi)
        ex = x + math.cos(a) * crown * 0.45
        ey = y + math.sin(a) * crown * 0.45
        d = Vector((ex - x, ey - y, base - top + h * 0.12))
        q = d.normalized().to_track_quat("Z", "Y")
        mx = Matrix.Translation((Vector((x, y, top)) + d / 2) * FT) @ q.to_matrix().to_4x4()
        res = bmesh.ops.create_cone(p.bm, cap_ends=True, segments=6, radius1=0.45 * FT, radius2=0.25 * FT,
                                    depth=d.length * FT, matrix=mx)
        p._tag(res, trunk_m, True)
    n = R.randint(15, 20)
    for k in range(n):
        # points in an oblate dome: wider than tall, fuller at the bottom edge
        a = R.uniform(0, 2 * math.pi)
        rr = crown * math.sqrt(R.uniform(0.0, 1.0)) * 0.85
        zz = base + h * R.uniform(-0.05, 0.42) * (1 - 0.5 * rr / crown)
        lumpy(p, (x + math.cos(a) * rr, y + math.sin(a) * rr, zz), crown * R.uniform(0.32, 0.46), leaf_m)
    return p.build(0.0)


def palm(dp, name, x, y, z, height, lean, trunk, frond):
    """Fuller palm than design_pass.palm: ~22 drooping fronds plus a tuft of young upright ones."""
    p = dp.Piece(name, "Env" if name.startswith("Env_") else "Site")
    segs = 10
    lx, ly = math.cos(lean[1]) * lean[0], math.sin(lean[1]) * lean[0]
    pts = [(x + lx * (i / segs) ** 2, y + ly * (i / segs) ** 2, z + height * i / segs) for i in range(segs + 1)]
    for i in range(segs):
        a_, b_ = Vector(pts[i]), Vector(pts[i + 1])
        d = b_ - a_
        q = d.normalized().to_track_quat("Z", "Y")
        r0 = 0.62 - 0.26 * i / segs
        mx = Matrix.Translation((a_ + b_) / 2 * FT) @ q.to_matrix().to_4x4()
        res = bmesh.ops.create_cone(p.bm, cap_ends=True, segments=10, radius1=r0 * FT, radius2=r0 * 0.88 * FT,
                                    depth=(d.length + 0.1) * FT, matrix=mx)
        p._tag(res, trunk, True)
    top = Vector(pts[-1])

    uvl = p.bm.loops.layers.uv.verify()

    def frond_(az, L, droop, rise, width):
        """One frond: a long tapering leaf, folded into a shallow V along its midrib, arching
        down. UVs run along (u) and across (v) it, for the leaflet stripes in the material."""
        pos = top.copy()
        dirv = Vector((math.cos(az), math.sin(az), rise))
        side = Vector((-math.sin(az), math.cos(az), 0))
        st = 10
        rows = []
        for k in range(st + 1):
            t = k / st
            w = width * (math.sin(math.pi * min(1.0, t * 1.15 + 0.05)) ** 0.7) * (1 - 0.15 * t)
            down = Vector((0, 0, -w * 0.45))
            rows.append([p.bm.verts.new((pos + side * w + down) * FT), p.bm.verts.new(pos * FT),
                         p.bm.verts.new((pos - side * w + down) * FT)])
            dirv.z -= 0.1 + droop / 380
            pos = pos + dirv.normalized() * (L / st)
        for k in range(st):
            for j in range(2):
                f = p.bm.faces.new((rows[k][j], rows[k][j + 1], rows[k + 1][j + 1], rows[k + 1][j]))
                f.material_index = p._mi(frond)
                f.smooth = True
                for loop in f.loops:
                    kk = next(i for i in (k, k + 1) if loop.vert in rows[i])
                    jj = rows[kk].index(loop.vert)
                    loop[uvl].uv = (kk / st, jj / 2)
    n = 22
    for i in range(n):
        frond_(i * 2 * math.pi / n + R.uniform(-0.12, 0.12), R.uniform(8.0, 10.5), R.uniform(25, 70),
               math.tan(math.radians(R.uniform(10, 30))), R.uniform(1.2, 1.6))
    for i in range(7):                                  # young fronds in the centre, pointing up
        frond_(i * 2 * math.pi / 7 + R.uniform(-0.2, 0.2), R.uniform(4.5, 6.0), R.uniform(0, 10),
               math.tan(math.radians(R.uniform(55, 70))), 0.9)
    p.ell(tuple(top), (0.8, 0.8, 0.7), trunk, seg=10)
    return p.build(0.0)


BEACH_HOUSES = [(-80, 42, 46, 1), (-150, 46, 40, 2), (130, 44, 44, 1), (200, 40, 48, 2), (-228, 40, 44, 2),
                (-300, 44, 42, 1), (270, 42, 44, 1), (340, 46, 40, 2), (410, 40, 46, 1), (-372, 42, 44, 2),
                (480, 44, 42, 2)]
HILL_HOUSES = [(-120, -205, 36, 30), (-30, -230, 40, 32), (70, -210, 38, 30), (160, -235, 36, 34),
               (-220, -250, 34, 30), (20, -300, 40, 32), (120, -310, 36, 30), (-330, -230, 38, 30),
               (260, -220, 40, 32), (360, -260, 36, 30), (-420, -280, 36, 32), (450, -230, 38, 30),
               (-140, -320, 36, 30), (240, -330, 38, 32)]


# the cottage's own palms (design_pass.apply), rebuilt fuller in the same spots
SITE_PALMS = [(-22, 18, 30, (3, 2.6)), (-18, 46, 36, (5, 2.2)), (-26, 64, 26, (4, 1.6)), (74, 14, 32, (4, 0.4)),
              (70, 50, 38, (6, 0.9)), (78, 70, 28, (3, 0.5)), (5, -23, 24, (2, 3.6)), (46, -25, 27, (3, -0.4)),
              (-35, 120, 34, (6, 2.0)), (88, 128, 30, (5, 1.0))]


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
    roof_grey = dp.standing_seam("Roof_Grey", (0.38, 0.40, 0.41))
    roof_dark = dp.standing_seam("Roof_Dark", (0.20, 0.22, 0.25))
    trim = bpy.data.materials["Trim_White"]
    win = dp.plain("Window_Dark", (0.05, 0.07, 0.09), 0.1)
    door = bpy.data.materials["Door_Blue"]
    deck = bpy.data.materials["Deck_Wood"]
    bodies = [dp.lap_siding(nm, c) for nm, c in (("Siding_Sky", (0.52, 0.62, 0.66)),
                                                    ("Siding_Sage", (0.55, 0.60, 0.52)),
                                                    ("Siding_Sand", (0.76, 0.69, 0.56)),
                                                    ("Siding_Coral", (0.76, 0.56, 0.48)),
                                                    ("Siding_Grey", (0.64, 0.65, 0.64)),
                                                    ("Siding_White", (0.80, 0.79, 0.76)))]
    bark = dp.plain("Bark", (0.20, 0.15, 0.11), 0.9)
    leaf_dark = leaf_material(dp, "Leaf_Oak", (0.05, 0.09, 0.03), (0.16, 0.24, 0.07))
    leaf_light = leaf_material(dp, "Leaf_Grape", (0.09, 0.14, 0.04), (0.26, 0.34, 0.10))
    palm_trunk = bpy.data.materials.get("Palm_Trunk") or bark
    frond = frond_material(dp, "Palm_Frond_Full", (0.05, 0.11, 0.03), (0.20, 0.32, 0.08))
    for i, (x, y, hh, lean) in enumerate(SITE_PALMS):  # replace the cottage's thinner palms
        o = bpy.data.objects.get(f"Palm_{i}")
        if o:
            bpy.data.objects.remove(o, do_unlink=True)
        palm(dp, f"Palm_{i}", x, y, -3, hh, lean, palm_trunk, frond)

    # the hill behind the town; the street, the shops, street furniture, cars and the beach
    # dressing come from town.py
    hill_mesh("Env_Hill", grass)
    town.add(dp, drives=[(cx, 25 - d / 2) for cx, w, d, st in BEACH_HOUSES])
    shutter = dp.plain("Shutter_Dark", (0.10, 0.16, 0.18), 0.6)
    skirt = dp.plain("Lattice_White", (0.70, 0.69, 0.66), 0.8)

    # beach neighbours, on stilts, facing the street like the cottage, both ways along the beach
    for i, (cx, w, d, st) in enumerate(BEACH_HOUSES):
        house(dp, f"Env_House_Beach_{i}", cx, 25, w, d, GROUND, 8.0, bodies[i % len(bodies)],
              roof_grey if i % 2 else roof_dark, trim, win, door, deck, facing=1, stories=st,
              shutter_m=shutter if i % 3 else None, skirt_m=skirt)
    # houses up the hill behind the town, facing down toward the beach
    for i, (cx, cy, w, d) in enumerate(HILL_HOUSES):
        z = min(hill_z(cx + sx, cy + sy) for sx in (-w / 2, w / 2) for sy in (-d / 2, d / 2))
        house(dp, f"Env_House_Hill_{i}", cx, cy, w, d, z - 1.0, 1.0, bodies[(i + 2) % len(bodies)],
              roof_dark if i % 2 else roof_grey, trim, win, door, deck, facing=-1, stories=1 + (i % 2),
              shutter_m=shutter if i % 2 else None)

    # shade trees on the hill, royal palms down both sidewalks
    spots = []
    while len(spots) < 46:
        x, y = R.uniform(-640, 700), R.uniform(-420, -172)
        if any(abs(x - hx) < 30 and abs(y - hy) < 28 for hx, hy, *_ in HILL_HOUSES):
            continue
        spots.append((x, y))
    for i, (x, y) in enumerate(spots):
        tree(dp, f"Env_Tree_{i}", x, y, hill_z(x, y), R.uniform(18, 30), R.uniform(9, 14), bark,
             leaf_dark if i % 3 else leaf_light)
    k = 0
    for x in range(-590, 680, 62):                                  # town side, between the lights
        if any(abs(x - c) < 30 for c in town.CROSS):
            continue
        palm(dp, f"Env_Palm_T{k}", x, -84, GROUND + 0.45, R.uniform(30, 40),
             (R.uniform(1, 3), R.uniform(0, 6.28)), palm_trunk, frond)
        k += 1
    for i, x in enumerate((-560, -470, -380, -290, -200, -112, -12, 66, 160, 300, 390, 520, 610)):
        palm(dp, f"Env_Palm_{i}", x, -27, GROUND + 0.45, R.uniform(26, 36),
             (R.uniform(2, 5), R.uniform(0, 6.28)), palm_trunk, frond)
    for i, (x, y) in enumerate(((-110, 70), (-185, 60), (95, 72), (170, 68), (240, 40), (-265, 66),
                                (-345, 58), (305, 64), (375, 70), (445, 60))):
        palm(dp, f"Env_BeachPalm_{i}", x, y, GROUND, R.uniform(26, 36),
             (R.uniform(3, 6), R.uniform(0, 6.28)), palm_trunk, frond)
