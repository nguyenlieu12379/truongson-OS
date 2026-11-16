"""The beach town around the coastal cottage, Miami coastal-road style: a two-lane road with
parking both sides, sidewalks, a row of Art Deco / Mediterranean shopfronts and convenience
stores across the road, street lights, traffic lights, palms, parked cars, and a beach dressed
with umbrellas, mats, towels, surfboards and lifeguard towers. No people.

Plan axes (feet), as environment.py: x across, y from the street (y = 0) toward the beach (+y),
z up, ground z = -3. Called from environment.add().

Layout (y): beach sidewalk -34..-20 | road -76..-34 (parking 8 ft each side, a travel lane each
way, double yellow at -55) | town sidewalk -92..-76 | shops from -92 back | town ground to -160,
then the hill. Cross streets at x = -150 and x = 200. The approach camera stands near
x = 25, y = -48: keep x -30..80 by the beach kerb clear of cars.
"""
import math
import random

import bpy
from mathutils import Vector

FT = 0.3048
G = -3.0
R = random.Random(23)

X0, X1 = -620.0, 680.0                  # how far the town runs either way
BEACH_WALK = (-34.0, -20.0)
ROAD = (-76.0, -34.0)
TOWN_WALK = (-92.0, -76.0)
FRONT = -92.0                            # shop fronts
BACK = -160.0                            # town ground ends, hill begins
CROSS = (-150.0, 200.0)                  # cross streets (centre x), 36 ft wide
CW = 18.0


# ------------------------------------------------------------------ materials
def slabs(dp, name, color, size_ft=5.0, var=0.12):
    """Concrete sidewalk: square slabs with dark joints, a little stained."""
    m = dp.get_mat(name)
    n, b = dp.fresh(m)
    co = n.xyz(dp.objcoord(n))
    s = size_ft * FT
    gx = n.math("FRACT", n.math("DIVIDE", co[0], s))
    gy = n.math("FRACT", n.math("DIVIDE", co[1], s))
    joint = n.math("MAXIMUM", n.math("LESS_THAN", gx, 0.012), n.math("LESS_THAN", gy, 0.012))
    nz = n.new("ShaderNodeTexNoise", Scale=1.2, Detail=6.0)
    n.link(dp.objcoord(n), nz.inputs["Vector"])
    stain = n.mix(n.math("MULTIPLY", nz.outputs["Fac"], var * 4), color, tuple(c * 0.78 for c in color))
    col = n.mix(n.math("MULTIPLY", joint, 0.7), stain, tuple(c * 0.4 for c in color))
    n.link(col, b.inputs["Base Color"])
    b.inputs["Roughness"].default_value = 0.9
    dp.bump(n, b, n.math("SUBTRACT", 1.0, joint), 0.4, 0.004)
    return m


def asphalt(dp, name, color):
    """Sun-bleached asphalt with darker patches and tyre tracks."""
    m = dp.get_mat(name)
    n, b = dp.fresh(m)
    nz = n.new("ShaderNodeTexNoise", Scale=0.6, Detail=8.0)
    n.link(dp.objcoord(n), nz.inputs["Vector"])
    grit = n.new("ShaderNodeTexNoise", Scale=220.0, Detail=2.0)
    n.link(dp.objcoord(n), grit.inputs["Vector"])
    col = n.mix(n.maprange(nz.outputs["Fac"], 0.4, 0.65), color, tuple(c * 0.62 for c in color))
    col = n.mix(n.math("MULTIPLY", grit.outputs["Fac"], 0.35), col, tuple(min(1, c * 1.5) for c in color))
    n.link(col, b.inputs["Base Color"])
    b.inputs["Roughness"].default_value = 0.88
    dp.bump(n, b, grit.outputs["Fac"], 0.3, 0.002)
    return m


def stucco(dp, name, color):
    """Painted stucco: soft trowel noise and a slightly dirtier base."""
    m = dp.get_mat(name)
    n, b = dp.fresh(m)
    co = dp.objcoord(n)
    nz = n.new("ShaderNodeTexNoise", Scale=14.0, Detail=6.0)
    n.link(co, nz.inputs["Vector"])
    z = n.xyz(dp.objcoord(n))[2]
    grime = n.maprange(z, -0.9, 0.2, 1.0, 0.0)          # darker near the pavement
    col = n.mix(n.math("ADD", n.math("MULTIPLY", nz.outputs["Fac"], 0.25), n.math("MULTIPLY", grime, 0.35)),
                color, tuple(c * 0.72 for c in color))
    n.link(col, b.inputs["Base Color"])
    b.inputs["Roughness"].default_value = 0.85
    dp.bump(n, b, nz.outputs["Fac"], 0.25, 0.003)
    return m


def barrel_tile(dp, name, color):
    """Terracotta barrel tiles (Mediterranean revival): ridges along y, rows along the slope."""
    m = dp.get_mat(name)
    n, b = dp.fresh(m)
    co = n.xyz(dp.objcoord(n))
    f = n.math("FRACT", n.math("DIVIDE", co[0], 0.26))
    ridge = n.math("ABSOLUTE", n.math("SUBTRACT", f, 0.5))
    nz = n.new("ShaderNodeTexNoise", Scale=5.0, Detail=4.0)
    n.link(dp.objcoord(n), nz.inputs["Vector"])
    col = n.mix(n.math("ADD", n.math("MULTIPLY", ridge, 0.9), n.math("MULTIPLY", nz.outputs["Fac"], 0.3)),
                color, tuple(c * 0.55 for c in color))
    n.link(col, b.inputs["Base Color"])
    b.inputs["Roughness"].default_value = 0.75
    dp.bump(n, b, ridge, 0.8, 0.02)
    return m


class M:
    """The town's materials, made once."""

    def __init__(self, dp):
        p = dp.plain
        self.walk = slabs(dp, "Sidewalk", (0.50, 0.48, 0.44))
        self.plaza = slabs(dp, "Town_Paving", (0.44, 0.42, 0.38), size_ft=10.0, var=0.2)
        self.road = asphalt(dp, "Road_Asphalt", (0.10, 0.10, 0.105))
        self.curb = p("Curb_Concrete", (0.58, 0.57, 0.53), 0.85)
        self.white = p("Paint_White", (0.70, 0.70, 0.67), 0.7)
        self.yellow = p("Paint_Yellow", (0.62, 0.44, 0.10), 0.7)
        self.red_curb = p("Paint_Red", (0.45, 0.10, 0.08), 0.7)
        self.pole = p("Pole_Grey", (0.30, 0.31, 0.31), 0.5)
        self.dark = p("Metal_Dark", (0.05, 0.05, 0.055), 0.5)
        self.signal = p("Signal_Yellow", (0.55, 0.42, 0.06), 0.5)
        self.lamp = p("Lamp_Lens", (0.85, 0.80, 0.66), 0.3)
        self.green = p("Sign_Green", (0.03, 0.22, 0.10), 0.5)
        self.glass = p("Shop_Glass", (0.035, 0.045, 0.05), 0.15)
        self.glass_lit = p("Shop_Glass_Lit", (0.20, 0.17, 0.12), 0.2)   # shelves and lights behind it
        self.frame = p("Storefront_Frame", (0.62, 0.62, 0.60), 0.4)
        self.frame_dk = p("Storefront_Dark", (0.10, 0.10, 0.10), 0.4)
        self.trim = p("Deco_Trim", (0.86, 0.85, 0.81), 0.7)
        self.ac = p("AC_Unit", (0.60, 0.61, 0.60), 0.6)
        self.tile = barrel_tile(dp, "Roof_Terracotta", (0.55, 0.26, 0.15))
        # muted pastels, as Miami Beach repaints them (not toy colours)
        self.walls = [stucco(dp, nm, c) for nm, c in (
            ("Stucco_Cream", (0.80, 0.75, 0.63)), ("Stucco_Mint", (0.58, 0.70, 0.64)),
            ("Stucco_Salmon", (0.80, 0.58, 0.50)), ("Stucco_Sky", (0.60, 0.70, 0.76)),
            ("Stucco_Lemon", (0.82, 0.74, 0.50)), ("Stucco_White", (0.82, 0.81, 0.77)),
            ("Stucco_Lilac", (0.68, 0.62, 0.70)), ("Stucco_Sand", (0.72, 0.64, 0.52)))]
        self.accents = [p(nm, c, 0.7) for nm, c in (
            ("Accent_Teal", (0.12, 0.42, 0.44)), ("Accent_Coral", (0.70, 0.32, 0.26)),
            ("Accent_Navy", (0.08, 0.14, 0.28)), ("Accent_Turq", (0.20, 0.55, 0.58)),
            ("Accent_Pink", (0.78, 0.44, 0.52)))]
        self.awnings = [dp.fabric(nm, c, stripe=s, stripe_scale=7.0) for nm, c, s in (
            ("Awning_RedWhite", (0.78, 0.76, 0.72), (0.55, 0.08, 0.07)),
            ("Awning_TealWhite", (0.78, 0.76, 0.72), (0.05, 0.36, 0.38)),
            ("Awning_Navy", (0.06, 0.10, 0.22), None), ("Awning_Green", (0.06, 0.26, 0.14), None),
            ("Awning_Yellow", (0.80, 0.62, 0.16), (0.78, 0.76, 0.72)))]
        self.signs = [p(nm, c, 0.5) for nm, c in (
            ("Sign_Red", (0.60, 0.06, 0.05)), ("Sign_Blue", (0.04, 0.16, 0.45)),
            ("Sign_GreenStore", (0.04, 0.38, 0.16)), ("Sign_Orange", (0.80, 0.34, 0.05)),
            ("Sign_White", (0.84, 0.84, 0.82)))]
        self.letters = p("Sign_Letters", (0.88, 0.87, 0.84), 0.5)
        self.letters_dk = p("Sign_Letters_Dark", (0.06, 0.06, 0.07), 0.5)
        self.cars = [p(nm, c, 0.35) for nm, c in (
            ("Car_White", (0.78, 0.78, 0.76)), ("Car_Silver", (0.48, 0.49, 0.50)),
            ("Car_Black", (0.03, 0.03, 0.035)), ("Car_Red", (0.45, 0.04, 0.04)),
            ("Car_Blue", (0.05, 0.14, 0.32)), ("Car_Grey", (0.22, 0.23, 0.24)),
            ("Car_Teal", (0.10, 0.36, 0.38)), ("Car_Sand", (0.62, 0.55, 0.42)))]
        self.car_glass = p("Car_Glass", (0.03, 0.035, 0.04), 0.1)
        self.tyre = p("Tyre", (0.025, 0.025, 0.025), 0.9)
        self.rim = p("Rim", (0.45, 0.45, 0.45), 0.4)
        self.tail = p("Tail_Light", (0.45, 0.03, 0.02), 0.3)
        self.wood = bpy.data.materials.get("Teak") or p("Bench_Wood", (0.40, 0.27, 0.16), 0.7)
        self.bin = p("Bin_Green", (0.06, 0.20, 0.13), 0.6)
        self.hydrant = p("Hydrant_Red", (0.60, 0.07, 0.04), 0.5)
        self.cafe = [dp.fabric("Parasol_Cream", (0.80, 0.76, 0.66)), dp.fabric("Parasol_Teal", (0.08, 0.38, 0.40))]
        self.planter = p("Planter_Concrete", (0.55, 0.53, 0.49), 0.85)
        self.shrub = bpy.data.materials.get("Leaf_Grape")


# ------------------------------------------------------------------ the street
def street(dp, m, drives=()):
    p = dp.Piece("Env_Street", "Env")
    rx0, rx1 = X0, X1
    p.box(rx0, ROAD[0], G - 0.2, rx1, ROAD[1], G + 0.04, m.road)
    # kerbs and sidewalks either side
    p.box(rx0, ROAD[1], G - 0.2, rx1, ROAD[1] + 0.6, G + 0.5, m.curb)
    p.box(rx0, ROAD[0] - 0.6, G - 0.2, rx1, ROAD[0], G + 0.5, m.curb)
    p.box(rx0, ROAD[1] + 0.6, G - 0.2, rx1, BEACH_WALK[1], G + 0.45, m.walk)
    p.box(rx0, TOWN_WALK[0], G - 0.2, rx1, ROAD[0] - 0.6, G + 0.45, m.walk)
    # a low sea wall where the beach sidewalk meets the sand
    p.box(rx0, BEACH_WALK[1], G - 0.2, rx1, BEACH_WALK[1] + 0.8, G + 1.6, m.curb)
    # markings: double yellow, parking lines, crosswalks, stop bars
    for yc in (-55.55, -54.45):
        p.box(rx0, yc - 0.2, G + 0.04, rx1, yc + 0.2, G + 0.07, m.yellow)
    for yl in (-68.0, -42.0):                                   # parking lane edge lines
        p.box(rx0, yl - 0.2, G + 0.04, rx1, yl + 0.2, G + 0.07, m.white)
    for x in range(int(rx0), int(rx1), 22):                    # stall ticks
        if any(abs(x - cx) < CW + 14 for cx in CROSS):
            continue
        for y0, y1 in ((-76.0, -68.0), (-42.0, -34.0)):
            p.box(x - 0.2, y0, G + 0.04, x + 0.2, y1, G + 0.07, m.white)
    for cx in CROSS:
        for k in range(10):                                    # continental crosswalk bars
            y = ROAD[0] + 1.5 + k * 4.0
            for side in (-1, 1):
                x = cx + side * (CW + 6)
                p.box(x - 5, y, G + 0.04, x + 5, y + 2.0, G + 0.07, m.white)
        for side in (-1, 1):
            x = cx + side * (CW + 13)
            y0, y1 = (ROAD[0], -55.6) if side > 0 else (-54.4, ROAD[1])
            p.box(x - 0.6, y0, G + 0.04, x + 0.6, y1, G + 0.07, m.white)
        # red kerb either side of the corner
        for x in (cx - CW - 30, cx + CW + 18):
            p.box(x, ROAD[0] - 0.65, G + 0.5, x + 12, ROAD[0] + 0.05, G + 0.55, m.red_curb)
    # town ground behind the shops, cross streets cut through it
    for xa, xb in _spans(rx0, rx1):
        p.box(xa, BACK, G - 0.2, xb, TOWN_WALK[0], G + 0.12, m.plaza)
    for cx in CROSS:
        p.box(cx - CW, BACK, G - 0.2, cx + CW, ROAD[0], G + 0.04, m.road)
        for side in (-1, 1):                                   # side-street kerbs
            x = cx + side * CW
            p.box(x - 0.3, BACK, G - 0.2, x + 0.3, TOWN_WALK[1], G + 0.5, m.curb)
        p.box(cx - 0.2, BACK, G + 0.04, cx + 0.2, ROAD[0] - 10, G + 0.07, m.yellow)
    # the cottage path and a driveway for each beach neighbour
    p.box(22, BEACH_WALK[1] + 0.8, G - 0.1, 30, -6, G + 0.08, m.walk)
    for cx, y_house in drives:
        p.box(cx - 6, BEACH_WALK[1] + 0.8, G - 0.1, cx + 6, y_house, G + 0.08, m.walk)
    return p.build(0)


def _spans(a, b):
    """x spans of the town ground, between the cross streets."""
    cuts = sorted(CROSS)
    out, x = [], a
    for c in cuts:
        out.append((x, c - CW))
        x = c + CW
    out.append((x, b))
    return out


# ------------------------------------------------------------------ shops
def _lettering(p, m, x0, x1, y, z0, z1, mat):
    """Blocks that read as shop lettering from across the road."""
    h = (z1 - z0) * 0.55
    zc = (z0 + z1) / 2
    w = x1 - x0
    words = R.randint(1, 2)
    total = w * R.uniform(0.45, 0.7)
    x = (x0 + x1) / 2 - total / 2
    n = max(3, int(total / 1.5))
    for k in range(n):
        lw = total / n * R.uniform(0.55, 0.8)
        if words == 2 and k == n // 2:
            x += total / n * 0.6
            continue
        p.box(x, y, zc - h / 2, x + lw, y + 0.12, zc + h / 2, mat)
        x += total / n


def shop(dp, m, name, x0, x1, depth, stories, style):
    p = dp.Piece(name, "Env")
    fy = FRONT
    w = x1 - x0
    xc = (x0 + x1) / 2
    wall = R.choice(m.walls)
    acc = R.choice(m.accents)
    h1 = 15.0 if style == "conv" else 13.5
    H = h1 + 10.5 * (stories - 1) + 2.5
    p.box(x0, fy - depth, G, x1, fy, G + H, wall)
    # roof: parapet cap all round, AC units and a stair hut on top
    p.box(x0 - 0.3, fy - 0.9, G + H, x1 + 0.3, fy + 0.35, G + H + 0.5, m.trim)
    for k in range(R.randint(1, 3)):
        ax = R.uniform(x0 + 5, x1 - 9)
        ay = R.uniform(fy - depth + 6, fy - 10)
        p.box(ax, ay, G + H, ax + 4, ay + 3.5, G + H + 3, m.ac)
    # ground floor: kickplate, glass, mullions, door, sign band
    gl = m.glass_lit if style == "conv" or R.random() < 0.5 else m.glass
    fr = m.frame if style != "med" else m.frame_dk
    gx0, gx1 = x0 + 2.0, x1 - 2.0
    top_g = G + h1 - 4.2
    p.box(gx0, fy, G, gx1, fy + 0.45, G + 1.4, acc if style != "conv" else m.frame)
    p.box(gx0, fy, G + 1.4, gx1, fy + 0.2, top_g, gl)
    k = gx0
    while k <= gx1 + 0.01:
        p.box(k - 0.18, fy, G + 1.4, k + 0.18, fy + 0.4, top_g, fr)
        k += 6.0 if style != "conv" else 8.0
    p.box(gx0, fy, top_g, gx1, fy + 0.4, top_g + 0.35, fr)
    dx = xc + R.choice((-1, 1)) * (w / 4 if w > 30 else 0)
    p.box(dx - 1.8, fy, G, dx + 1.8, fy + 0.5, G + 8.0, fr)
    p.box(dx - 1.4, fy + 0.3, G + 0.3, dx + 1.4, fy + 0.55, G + 7.6, m.glass)
    if style == "conv":
        # convenience store: a big lit sign band across the front, ice chest and a bin by the door
        sign = R.choice(m.signs[:4])
        p.box(x0 + 0.5, fy, top_g + 0.4, x1 - 0.5, fy + 1.2, G + h1 + 1.5, sign)
        _lettering(p, m, x0 + 3, x1 - 3, fy + 1.2, top_g + 0.6, G + h1 + 1.3, m.letters)
        p.box(dx + 3, fy + 0.5, G + 0.45, dx + 8, fy + 3.0, G + 4.2, m.signs[4])
        _lettering(p, m, dx + 3.6, dx + 7.4, fy + 3.0, G + 2.6, G + 3.8, m.signs[1])
        p.box(dx - 6.5, fy + 0.6, G + 0.45, dx - 4.5, fy + 2.6, G + 3.8, m.bin)
        # flat canopy with downlights
        p.box(x0, fy, G + h1 - 0.3, x1, fy + 6.0, G + h1 + 0.4, m.trim)
    else:
        aw = R.choice(m.awnings)
        if R.random() < 0.75:
            p.obox((xc, fy + 2.6, top_g + 1.6), (w - 3.0, 5.6, 0.2), aw, rot=(-22, 0, 0))
            p.box(gx0 - 0.2, fy + 5.1, top_g - 0.2, gx1 + 0.2, fy + 5.3, top_g + 0.8, aw)
        sb0 = top_g + 2.9
        sign = R.choice(m.signs)
        sw = min(w - 6, R.uniform(16, 30))
        p.box(xc - sw / 2, fy, sb0, xc + sw / 2, fy + 0.5, sb0 + 2.4, sign)
        _lettering(p, m, xc - sw / 2 + 1, xc + sw / 2 - 1, fy + 0.5, sb0 + 0.2, sb0 + 2.2,
                   m.letters_dk if sign is m.signs[4] else m.letters)
    # upper floors
    for s in range(1, stories):
        z0 = G + h1 + (s - 1) * 10.5 + 2.6
        nwin = max(2, int((w - 6) / 7.5))
        step = (w - 6) / nwin
        for i in range(nwin):
            x = x0 + 3 + step * (i + 0.5)
            ww = 3.8 if style != "med" else 3.0
            p.box(x - ww / 2, fy, z0, x + ww / 2, fy + 0.15, z0 + 5.2, m.glass)
            p.box(x - ww / 2 - 0.3, fy, z0 - 0.4, x + ww / 2 + 0.3, fy + 0.6, z0, m.trim)
            if style == "med":
                for sd in (-1, 1):                              # shutters
                    p.box(x + sd * (ww / 2 + 0.2) - 0.9, fy, z0, x + sd * (ww / 2 + 0.2) + 0.9, fy + 0.3,
                          z0 + 5.2, acc)
        if style == "deco":                                     # the Deco 'eyebrows'
            p.box(x0 + 1, fy, z0 + 5.5, x1 - 1, fy + 1.8, z0 + 5.85, m.trim)
    if style == "deco":
        # stepped parapet, a vertical fin and racing stripes
        p.box(xc - w / 5, fy - 4, G + H, xc + w / 5, fy, G + H + 3.0, wall)
        p.box(xc - w / 9, fy - 3, G + H + 3.0, xc + w / 9, fy, G + H + 5.0, wall)
        p.box(xc - 1.1, fy, G + h1 - 0.5, xc + 1.1, fy + 1.4, G + H + 7.5, acc)
        for zz in (0.8, 1.6):
            p.box(x0 + 0.6, fy, G + H - zz - 0.25, x1 - 0.6, fy + 0.2, G + H - zz, acc)
    elif style == "med":
        # a pent roof of barrel tiles across the front, on little corbels
        p.obox((xc, fy + 0.6, G + H + 0.9), (w + 1.0, 4.4, 0.4), m.tile, rot=(-24, 0, 0))
        for k in range(int(w / 5)):
            x = x0 + 2.5 + k * 5
            p.box(x - 0.3, fy, G + H - 0.6, x + 0.3, fy + 1.4, G + H, m.trim)
    return p.build(0)


def shops(dp, m):
    """The shop row across the road: Deco, Mediterranean and convenience stores, shoulder to shoulder."""
    out = []
    i = 0
    for xa, xb in _spans(X0, X1):
        x = xa + 1.0
        while x < xb - 20:
            w = R.uniform(26, 58)
            if xb - (x + w) < 22:
                w = xb - 1 - x
            r = R.random()
            style = "conv" if r < 0.3 else ("deco" if r < 0.7 else "med")
            stories = 1 if style == "conv" else R.choice((1, 2, 2, 3, 3, 4))
            out.append(shop(dp, m, f"Env_Shop_{i}", x, x + w, R.uniform(45, 62), stories, style))
            i += 1
            x += w + R.choice((0.0, 0.0, 0.0, 4.0))
    return out


# ------------------------------------------------------------------ street furniture
def street_light(p, m, x, y, facing):
    """Cobra-head street light. facing = +1 reaches over the road toward +y, -1 toward -y."""
    p.cyl(x, y, G + 0.45, G + 1.5, 0.8, m.pole, 0.6, seg=10)
    p.cyl(x, y, G + 1.5, G + 27, 0.35, m.pole, 0.22, seg=10)
    p.obox((x, y + facing * 4.0, G + 27.2), (0.35, 8.0, 0.35), m.pole, rot=(facing * -6, 0, 0))
    p.ell((x, y + facing * 8.4, G + 27.4), (0.9, 1.6, 0.45), m.pole, seg=8)
    p.ell((x, y + facing * 8.4, G + 27.0), (0.7, 1.3, 0.2), m.lamp, seg=8)


def traffic_light(p, m, x, y, facing, arm=26.0):
    p.cyl(x, y, G + 0.45, G + 22, 0.55, m.pole, 0.45, seg=12)
    p.obox((x, y + facing * arm / 2, G + 20.5), (0.4, arm, 0.4), m.pole)
    for k in (0.45, 0.85):
        hy = y + facing * arm * k
        p.box(x - 0.7, hy - 0.6, G + 16.6, x + 0.7, hy + 0.6, G + 20.3, m.signal)
        for zz in (17.3, 18.4, 19.5):
            p.cyl(x - 0.75, hy, G + zz - 0.4, G + zz + 0.4, 0.38, m.dark, seg=8, rot=(0, 90, 0))
    # street name sign
    p.box(x - 0.1, y + facing * 3, G + 21.0, x + 0.1, y + facing * 9, G + 22.2, m.green)
    p.box(x - 0.15, y + facing * 3.3, G + 21.3, x + 0.15, y + facing * 8.7, G + 21.9, m.white)


def bench(p, m, x, y, rot_z=0):
    w, d = 6.0, 1.8
    p.obox((x, y, G + 2.0), (w, d, 0.25), m.wood, rot=(0, 0, rot_z))
    ox, oy = math.sin(math.radians(rot_z)) * -0.8, math.cos(math.radians(rot_z)) * -0.8
    p.obox((x + ox, y + oy, G + 3.1), (w, 0.2, 1.4), m.wood, rot=(10, 0, rot_z))
    for s in (-1, 1):
        cx = x + s * (w / 2 - 0.5) * math.cos(math.radians(rot_z))
        cy = y + s * (w / 2 - 0.5) * math.sin(math.radians(rot_z))
        p.obox((cx, cy, G + 1.2), (0.25, 1.6, 1.6), m.dark, rot=(0, 0, rot_z))


def cafe_set(p, m, x, y):
    p.cyl(x, y, G + 0.45, G + 3.0, 0.12, m.dark, seg=8)
    p.cyl(x, y, G + 3.0, G + 3.15, 1.4, m.trim, seg=16)
    for a in (0, 180):
        cx, cy = x + 2.4 * math.cos(math.radians(a)), y + 2.4 * math.sin(math.radians(a))
        p.box(cx - 0.8, cy - 0.8, G + 2.0, cx + 0.8, cy + 0.8, G + 2.2, m.dark)
        p.box(cx - 0.8 if a else cx + 0.6, cy - 0.8, G + 2.2, cx - 0.6 if a else cx + 0.8, cy + 0.8, G + 4.2,
              m.dark)
        for lx in (-0.7, 0.7):
            for ly in (-0.7, 0.7):
                p.cyl(cx + lx, cy + ly, G + 0.45, G + 2.0, 0.06, m.dark, seg=4)
    p.cyl(x, y, G + 3.15, G + 8.0, 0.08, m.dark, seg=6)
    p.cyl(x, y, G + 7.0, G + 8.4, 4.0, R.choice(m.cafe), 0.1, seg=12)


def bus_shelter(p, m, x, y):
    p.box(x - 7, y - 3.2, G + 8.6, x + 7, y + 2.2, G + 9.0, m.trim)
    p.box(x - 6.8, y - 3.1, G + 0.45, x + 6.8, y - 2.9, G + 8.6, m.glass)
    for sx in (-6.8, 6.8):
        p.box(x + sx - 0.2, y - 3.2, G + 0.45, x + sx + 0.2, y - 2.8, G + 8.6, m.pole)
        p.box(x + sx - 0.1, y - 2.8, G + 0.45, x + sx + 0.1, y + 1.0, G + 8.6, m.glass)
    p.box(x - 5, y - 2.8, G + 2.0, x + 5, y - 1.4, G + 2.3, m.wood)
    p.box(x + 4.2, y + 1.6, G + 0.45, x + 4.6, y + 2.0, G + 9.6, m.pole)
    p.box(x + 3.6, y + 1.65, G + 9.6, x + 5.2, y + 1.95, G + 11.0, m.signs[1])


def street_props(dp, m):
    p = dp.Piece("Env_Prop_Street", "Env")
    for i, x in enumerate(range(int(X0) + 30, int(X1), 95)):
        if not any(abs(x - cx) < CW + 6 for cx in CROSS):
            if not 5 < x < 45:
                street_light(p, m, x, ROAD[1] + 2.2, -1)
            street_light(p, m, x + 47, ROAD[0] - 2.2, 1)
    for cx in CROSS:
        traffic_light(p, m, cx - CW - 3, ROAD[0] - 3, 1)
        traffic_light(p, m, cx + CW + 3, ROAD[1] + 3, -1)
    # benches facing the sea along the beach walk, bins, hydrants
    for x in (-430, -330, -230, -95, 110, 240, 360, 480, 590):
        bench(p, m, x, -24.5, 0)
        p.cyl(x + 5.5, -24.5, G + 0.45, G + 3.6, 1.0, m.bin, seg=10)
    for x in (-500, -260, -40, 150, 330, 560):
        p.cyl(x, ROAD[0] - 1.6, G + 0.45, G + 2.6, 0.5, m.hydrant, seg=10)
        p.ell((x, ROAD[0] - 1.6, G + 2.7), (0.5, 0.5, 0.35), m.hydrant)
        p.cyl(x, ROAD[0] - 1.6, G + 1.9, G + 2.1, 0.75, m.hydrant, seg=8, rot=(90, 0, 0))
    bus_shelter(p, m, -60, -27.5)
    # parking meters along the town kerb
    for x in range(int(X0) + 40, int(X1), 44):
        if any(abs(x - cx) < CW + 14 for cx in CROSS):
            continue
        p.cyl(x, ROAD[0] - 1.4, G + 0.45, G + 4.0, 0.12, m.pole, seg=6)
        p.box(x - 0.35, ROAD[0] - 1.7, G + 4.0, x + 0.35, ROAD[0] - 1.1, G + 5.0, m.dark)
    return p.build(0)


def cafes(dp, m, shop_objs):
    """Café tables and planters on the town sidewalk in front of some shops."""
    p = dp.Piece("Env_Prop_Cafe", "Env")
    for o in shop_objs:
        xs = [(o.matrix_basis @ v.co).x / FT for v in o.data.vertices]
        x0, x1 = min(xs), max(xs)
        r = R.random()
        if r < 0.35 and x1 - x0 > 30:
            for k in range(int((x1 - x0 - 10) / 11)):
                cafe_set(p, m, x0 + 8 + k * 11, FRONT + 8.0)
        elif r < 0.6:
            for x in (x0 + 4, x1 - 4):
                p.box(x - 1.5, FRONT + 1.5, G + 0.45, x + 1.5, FRONT + 4.5, G + 2.6, m.planter)
                if m.shrub:
                    p.ell((x, FRONT + 3.0, G + 3.4), (1.8, 1.8, 1.4), m.shrub)
    return p.build(0)


# ------------------------------------------------------------------ cars
def car(p, m, x, y, along_x=True, kind="sedan", paint=None):
    paint = paint or R.choice(m.cars)
    L, W = {"sedan": (15.5, 6.1), "suv": (16.0, 6.5), "van": (17.5, 6.6)}[kind]
    zb = G + 1.0
    bodyh = {"sedan": 2.4, "suv": 3.0, "van": 3.4}[kind]
    rot = 0 if along_x else 90
    d = 1 if R.random() < 0.5 else -1

    def at(lx, ly):                                             # car-local to plan
        if along_x:
            return x + lx * d, y + ly
        return x + ly, y + lx * d

    def b(c, size, mat):
        cx, cy = at(c[0], c[1])
        p.obox((cx, cy, c[2]), size, mat, rot=(0, 0, rot))

    b((0, 0, zb + bodyh / 2), (L, W, bodyh), paint)
    cab_l = {"sedan": 8.2, "suv": 10.5, "van": 13.0}[kind]
    cab_h = {"sedan": 1.9, "suv": 2.5, "van": 2.8}[kind]
    off = {"sedan": -0.6, "suv": -1.6, "van": -1.8}[kind]
    b((off, 0, zb + bodyh + cab_h / 2), (cab_l, W - 0.5, cab_h), m.car_glass)
    b((off, 0, zb + bodyh + cab_h + 0.12), (cab_l - 0.8, W - 0.7, 0.25), paint)
    for s in (-1, 1):
        b((L / 2 - 0.05, s * (W / 2 - 0.9), zb + bodyh - 0.6), (0.2, 1.2, 0.5), m.lamp)
        b((-L / 2 + 0.05, s * (W / 2 - 0.9), zb + bodyh - 0.6), (0.2, 1.2, 0.5), m.tail)
    for lx in (L / 2 - 3.0, -L / 2 + 3.0):
        for s in (-1, 1):
            cx, cy = at(lx, s * (W / 2 - 0.4))
            p.cyl(cx, cy, G + 1.15 - 0.4, G + 1.15 + 0.4, 1.15, m.tyre, seg=8,
                  rot=(90, 0, 0) if along_x else (0, 90, 0))
            cx, cy = at(lx, s * (W / 2 - 0.3))
            p.cyl(cx, cy, G + 1.15 - 0.45, G + 1.15 + 0.45, 0.6, m.rim, seg=6,
                  rot=(90, 0, 0) if along_x else (0, 90, 0))


def parked_cars(dp, m):
    p = dp.Piece("Env_Car_Parked", "Env")
    n = 0
    for yc, keep_clear in ((-38.0, True), (-72.0, False)):
        x = X0 + 10
        while x < X1 - 20:
            x += 22
            if any(abs(x - cx) < CW + 16 for cx in CROSS):
                continue
            if keep_clear and -40 < x < 95:                      # the approach view to the cottage
                continue
            if R.random() < 0.28:                               # empty stall
                continue
            kind = R.choice(("sedan", "sedan", "sedan", "suv", "suv", "van"))
            car(p, m, x - 11 + R.uniform(-0.6, 0.6), yc + R.uniform(-0.3, 0.3), True, kind)
            n += 1
    # a few in the side streets, nose to kerb
    for cx in CROSS:
        for k in range(3):
            car(p, m, cx - CW + 4.5, -110 - k * 18, False, R.choice(("sedan", "suv")))
    return p.build(0)


# ------------------------------------------------------------------ beach
def _rot(mx, my, a, lx, ly):
    ca, sa = math.cos(a), math.sin(a)
    return mx + lx * ca - ly * sa, my + lx * sa + ly * ca


class BeachM:
    def __init__(self, dp):
        f, p = dp.fabric, dp.plain
        self.umbrellas = [f(nm, c, stripe=s, stripe_scale=5.0) for nm, c, s in (
            ("Umb_RedWhite", (0.82, 0.80, 0.74), (0.62, 0.10, 0.08)),
            ("Umb_BlueWhite", (0.82, 0.80, 0.74), (0.08, 0.25, 0.55)),
            ("Umb_Yellow", (0.85, 0.66, 0.15), (0.82, 0.80, 0.74)),
            ("Umb_Teal", (0.10, 0.45, 0.46), None), ("Umb_Coral", (0.82, 0.42, 0.32), None),
            ("Umb_Navy", (0.06, 0.10, 0.25), (0.82, 0.80, 0.74)))]
        self.towels = [f(nm, c, stripe=s, stripe_scale=9.0) for nm, c, s in (
            ("Towel_Turq", (0.15, 0.55, 0.60), (0.85, 0.84, 0.80)),
            ("Towel_Pink", (0.82, 0.45, 0.55), (0.88, 0.85, 0.75)),
            ("Towel_Yellow", (0.88, 0.70, 0.20), (0.85, 0.40, 0.20)),
            ("Towel_Navy", (0.08, 0.12, 0.30), (0.85, 0.84, 0.80)),
            ("Towel_White", (0.86, 0.85, 0.80), (0.20, 0.40, 0.65)),
            ("Towel_Green", (0.20, 0.50, 0.30), None))]
        self.mats = [f(nm, c, stripe=s, stripe_scale=14.0) for nm, c, s in (
            ("Mat_Straw", (0.72, 0.62, 0.42), (0.55, 0.45, 0.28)),
            ("Mat_Blue", (0.30, 0.52, 0.70), (0.85, 0.84, 0.80)))]
        self.pole = p("Umb_Pole", (0.82, 0.81, 0.78), 0.5)
        self.wood = bpy.data.materials.get("Teak") or p("Beach_Wood", (0.45, 0.32, 0.20), 0.7)
        self.frame = p("Chair_Alu", (0.62, 0.63, 0.63), 0.4)
        self.boards = [p(nm, c, 0.3) for nm, c in (
            ("Board_White", (0.86, 0.86, 0.83)), ("Board_Teal", (0.12, 0.55, 0.58)),
            ("Board_Yellow", (0.88, 0.72, 0.18)), ("Board_Coral", (0.85, 0.40, 0.30)),
            ("Board_Blue", (0.12, 0.30, 0.65)))]
        self.stuff = [p(nm, c, 0.5) for nm, c in (
            ("Bag_Canvas", (0.78, 0.72, 0.58)), ("Bag_Red", (0.62, 0.12, 0.10)),
            ("Cooler_Blue", (0.10, 0.30, 0.62)), ("Cooler_White", (0.86, 0.86, 0.84)),
            ("Book_Orange", (0.85, 0.42, 0.12)), ("Bottle_Clear", (0.55, 0.70, 0.72)),
            ("Hat_Straw", (0.80, 0.68, 0.42)), ("Sandal_Black", (0.05, 0.05, 0.05)),
            ("Ball_White", (0.88, 0.88, 0.86)))]
        self.tower = [p(nm, c, 0.6) for nm, c in (
            ("Tower_Pink", (0.85, 0.50, 0.58)), ("Tower_Turq", (0.25, 0.65, 0.66)),
            ("Tower_Yellow", (0.88, 0.75, 0.30)))]
        self.tower_trim = p("Tower_Trim", (0.86, 0.86, 0.83), 0.6)
        self.flag = p("Flag_Red", (0.70, 0.08, 0.06), 0.7)
        self.net = p("Net_Dark", (0.08, 0.08, 0.08), 0.8)


def umbrella(p, bm, x, y, r=5.5, h=9.0, mat=None):
    mat = mat or R.choice(bm.umbrellas)
    p.cyl(x, y, G - 0.8, G + h + 0.4, 0.09, bm.pole, seg=8)
    p.cyl(x, y, G + h - 1.9, G + h, r, mat, 0.18, seg=16)       # canopy
    p.cyl(x, y, G + h - 2.35, G + h - 1.9, r, mat, r, seg=16)    # valance
    p.ell((x, y, G + h + 0.45), (0.2, 0.2, 0.2), bm.pole, seg=8)


def towel(p, bm, x, y, a, mat=None, big=False):
    mat = mat or R.choice(bm.towels + (bm.mats if big else []))
    L, W = (6.5, 3.4) if big else (5.6, 2.6)
    p.obox((x, y, G + 0.04), (W, L, 0.08), mat, rot=(0, 0, math.degrees(a)))
    return L, W


def items_on(p, bm, x, y, a, L, W):
    """A few things lying on a towel or mat: a bag, a hat, sandals, a book, a bottle, a cooler."""
    S = bm.stuff
    picks = R.sample(range(6), R.randint(2, 4))
    for k in picks:
        lx, ly = R.uniform(-W / 3, W / 3), R.uniform(-L / 3, L / 3)
        cx, cy = _rot(x, y, a, lx, ly)
        deg = math.degrees(a) + R.uniform(-30, 30)
        if k == 0:                                                   # beach bag with a handle
            p.obox((cx, cy, G + 0.75), (1.6, 0.7, 1.4), R.choice(S[:2]), rot=(0, 0, deg))
            p.obox((cx, cy, G + 1.6), (1.2, 0.1, 0.3), R.choice(S[:2]), rot=(0, 0, deg))
        elif k == 1:                                                 # straw hat
            p.cyl(cx, cy, G + 0.08, G + 0.16, 0.9, S[6], seg=16)
            p.ell((cx, cy, G + 0.3), (0.45, 0.45, 0.3), S[6], seg=10)
        elif k == 2:                                                 # sandals
            for s in (-0.25, 0.25):
                sx, sy = _rot(cx, cy, a, s, 0)
                p.obox((sx, sy, G + 0.12), (0.35, 0.95, 0.08), S[7], rot=(0, 0, deg))
        elif k == 3:                                                 # a book, open face down
            p.obox((cx, cy, G + 0.12), (1.0, 0.7, 0.1), S[4], rot=(0, 0, deg))
        elif k == 4:                                                 # bottle lying down
            p.cyl(cx, cy, G + 0.08, G + 0.38, 0.15, S[5], seg=8, rot=(90, 0, deg))
        else:                                                        # cooler by the towel
            ox, oy = _rot(x, y, a, W / 2 + 1.0, R.uniform(-L / 3, L / 3))
            col = R.choice(S[2:4])
            p.obox((ox, oy, G + 0.8), (1.4, 2.2, 1.6), col, rot=(0, 0, deg))
            p.obox((ox, oy, G + 1.68), (1.5, 2.3, 0.18), S[3], rot=(0, 0, deg))


def beach_chair(p, bm, x, y, a):
    """Low folding beach chair, facing the sea (+y) turned by a."""
    deg = math.degrees(a)
    mat = R.choice(bm.towels)
    p.obox((x, y, G + 0.9), (2.0, 1.8, 0.12), mat, rot=(0, 0, deg))
    bx, by = _rot(x, y, a, 0, -1.1)
    p.obox((bx, by, G + 1.9), (2.0, 0.12, 2.0), mat, rot=(-22, 0, deg))
    for sx in (-1.0, 1.0):
        fx, fy = _rot(x, y, a, sx, 0)
        p.obox((fx, fy, G + 0.5), (0.1, 2.4, 0.1), bm.frame, rot=(25, 0, deg))
        p.obox((fx, fy, G + 0.5), (0.1, 2.4, 0.1), bm.frame, rot=(-25, 0, deg))


def surfboard(p, bm, x, y, a, upright=False):
    mat = R.choice(bm.boards)
    L = R.uniform(6.5, 9.0)
    if upright:                                    # stuck nose-up in the sand, leaning a little
        p.ell((x, y, G + L / 2 - 0.6), (0.95, 0.12, L / 2), mat, rot=(R.uniform(-8, 8), R.uniform(-8, 8),
                                                                       math.degrees(a)), seg=16)
    else:
        p.ell((x, y, G + 0.12), (0.95, L / 2, 0.12), mat, rot=(0, 0, math.degrees(a)), seg=16)
        p.obox(_rot(x, y, a, 0, -L / 2 + 0.6) + (G + 0.24,), (0.5, 0.05, 0.25), bm.boards[0],
               rot=(0, 0, math.degrees(a)))                         # fin


def lifeguard_tower(p, bm, x, y, k):
    col = bm.tower[k % len(bm.tower)]
    for sx in (-4, 4):
        for sy in (-4, 4):
            p.cyl(x + sx, y + sy, G - 1, G + 7.0, 0.3, bm.tower_trim, seg=8)
    p.box(x - 6.5, y - 5.5, G + 7.0, x + 6.5, y + 5.5, G + 7.5, bm.tower_trim)
    p.box(x - 4.5, y - 4.0, G + 7.5, x + 4.5, y + 3.0, G + 15.0, col)
    p.box(x - 3.5, y + 2.9, G + 10.5, x + 3.5, y + 3.15, G + 13.8, bm.stuff[5])   # sea-facing window
    for zz in (9.2, 12.6):
        p.box(x - 4.6, y - 4.1, G + zz, x + 4.6, y + 3.1, G + zz + 0.6, bm.tower_trim)
    p.obox((x, y - 0.5, G + 15.8), (11.0, 9.5, 0.5), bm.tower_trim, rot=(-8, 0, 0))
    p.box(x - 6.5, y + 4.8, G + 7.5, x + 6.5, y + 5.2, G + 10.0, bm.tower_trim)    # railing
    p.obox((x, y - 10.0, G + 3.6), (3.0, 12.5, 0.3), bm.tower_trim, rot=(36, 0, 0))   # ramp
    p.cyl(x + 5.6, y + 4.6, G + 7.5, G + 21, 0.08, bm.pole, seg=6)
    p.box(x + 5.7, y + 4.55, G + 18.8, x + 8.7, y + 4.65, G + 20.8, bm.flag)


def beach(dp):
    """Fill the sand: umbrella setups with towels, mats, chairs and their things; surfboards;
    two lifeguard towers and a volleyball net. Clear of the boardwalk, the dune grass and
    the cottage's own umbrella."""
    bm = BeachM(dp)
    p = dp.Piece("Env_Beach_Items", "Env")
    blocked = [(30, 140, 10), (-35, 120, 6), (88, 128, 6), (-110, 70, 6), (-185, 60, 6), (95, 72, 6),
               (170, 68, 6), (240, 40, 6)]

    def free(x, y, r):
        if -62 < x < 112 and y < 116:                    # the dune grass in front of the cottage
            return False
        if 34 < x < 52 and y < 120:                      # the boardwalk
            return False
        if -105 < x < 235 and y < 55:                    # under the beach houses
            return False
        return all(math.hypot(x - bx, y - by) > r + br for bx, by, br in blocked)

    # a cluster in the lanai's sunset view first, then the rest of the beach at random
    spots = [(-52, 130), (-20, 141), (8, 125), (60, 133), (100, 145), (122, 124), (-78, 146), (-88, 122)]
    blocked += [(x, y, 9) for x, y in spots]
    tries = 0
    while len(spots) < 30 and tries < 4000:
        tries += 1
        x, y = R.uniform(-380, 470), R.uniform(60, 146)
        if free(x, y, 9):
            spots.append((x, y))
            blocked.append((x, y, 9))
    for i, (x, y) in enumerate(spots):
        umbrella(p, bm, x, y, r=R.uniform(4.8, 6.2), h=R.uniform(8.5, 10.0))
        n = R.randint(1, 3)
        for k in range(n):
            a = R.uniform(-0.35, 0.35) + (math.pi if R.random() < 0.15 else 0)
            tx, ty = x + (k - (n - 1) / 2) * 4.2 + R.uniform(-0.6, 0.6), y + R.uniform(-1.5, 1.5)
            L, W = towel(p, bm, tx, ty, a, big=k == 0)
            items_on(p, bm, tx, ty, a, L, W)
        if R.random() < 0.5:
            beach_chair(p, bm, x + R.uniform(-5, 5), y + 5.5, R.uniform(-0.3, 0.3))
            beach_chair(p, bm, x + R.uniform(-5, 5), y + 5.5, R.uniform(-0.3, 0.3))
        if R.random() < 0.35:
            surfboard(p, bm, x + R.choice((-7, 7)), y + R.uniform(-3, 3), R.uniform(-0.3, 0.3), upright=True)
        elif R.random() < 0.4:
            surfboard(p, bm, x + R.uniform(-4, 4), y - 6, R.uniform(-0.4, 0.4))
    # loose towels with no umbrella, and boards near the water
    extra = 0
    while extra < 16 and tries < 8000:
        tries += 1
        x, y = R.uniform(-380, 470), R.uniform(70, 148)
        if free(x, y, 4):
            a = R.uniform(-0.4, 0.4)
            L, W = towel(p, bm, x, y, a)
            items_on(p, bm, x, y, a, L, W)
            blocked.append((x, y, 4))
            extra += 1
    for x, y in ((-12, 146), (66, 147), (128, 144), (-150, 147)):
        if free(x, y, 3):
            surfboard(p, bm, x, y, R.uniform(-0.6, 0.6))
    # a board rack by the walk, three boards leaning in it
    for k in range(3):
        surfboard(p, bm, -230 + k * 2.2, 52, 0.0, upright=True)
    lifeguard_tower(p, bm, -140, 104, 0)
    lifeguard_tower(p, bm, 205, 104, 1)
    # volleyball net
    for x in (-300, -270):
        p.cyl(x, 90, G - 1, G + 8.5, 0.15, bm.pole, seg=6)
    p.box(-300, 89.95, G + 5.0, -270, 90.05, G + 8.0, bm.net)
    p.ell((-283, 96, G + 0.75), (0.75, 0.75, 0.75), bm.stuff[8], seg=12)
    return p.build(0)


def add(dp, drives=()):
    """drives: (x, y of the house front) for a driveway from the beach walk to each beach house."""
    m = M(dp)
    street(dp, m, drives)
    sh = shops(dp, m)
    street_props(dp, m)
    cafes(dp, m, sh)
    parked_cars(dp, m)
    beach(dp)
    return m
