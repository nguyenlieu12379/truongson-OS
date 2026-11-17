"""Il Dante Caffe, 760 Ocean Dr, Miami Beach: the cafe, its building and the block, from Google Maps
photos and Street View (refs: see README.md). Modelled to match what the photos show:

- The building: a two-storey white Streamline corner block on Ocean Dr and 8th St. Rounded corner, a
  continuous upper balcony with pipe rails, white storefronts, a blue awning on the Ocean Dr side
  (a bar), a rooftop terrace with umbrellas and tall twisted metal sculptures.
- The cafe (8th St side): a narrow white room. Long pale-wood bar on the left wall under a big
  rounded-corner wood-framed mirror, wooden stools, monstera in an amber vase. At the back right a
  curved counter of white subway tile with a wood top, a pastry case, a card terminal and a big
  fiddle-leaf fig. Behind it the espresso bar on a dark green tiled wall, white bell pendants, a
  black letter-board menu, a glass-door drinks fridge, wood-look plank floor.
- The block: 8th St with News Cafe's building across it, the pastel Starlite Hotel to the south with
  its yellow umbrellas and wicker chairs, Ocean Drive (pink pavers, yellow kerbs, green bike lane),
  Lummus Park (lawn, hedges, rows of coconut palms, a pink path), dunes, beach and the ocean.

Plan axes (feet): x = east (toward the ocean), y = north, z = up, ground z = 0.
The building's NE corner (Ocean Dr / 8th St) is at (0, 0).
Run:  python build_scene.py --out work/il_dante.blend
"""
import math
import os
import random
import sys

import bpy  # first
import bmesh
from mathutils import Matrix, Vector

HERE = os.path.dirname(os.path.abspath(__file__))
COT = os.path.join(HERE, "..", "coastal-cottage")
sys.path.insert(0, COT)
import design_pass as dp  # noqa: E402
import environment as env  # noqa: E402
import town  # noqa: E402
import cars  # noqa: E402

FT = 0.3048
R = random.Random(760)
OUT = sys.argv[sys.argv.index("--out") + 1] if "--out" in sys.argv else os.path.join(HERE, "work", "il_dante.blend")

bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene
COLLS = ["Bldg", "Interior", "Furn", "Street", "Park", "Beach", "Neighbors", "Props", "Trees", "Glass", "Door", "Site"]
for c in COLLS:
    scene.collection.children.link(bpy.data.collections.new(c))
# design_pass / environment put palms and trees in "Env" and "Site"
scene.collection.children.link(bpy.data.collections.new("Env"))
scene.collection.children.link(bpy.data.collections.new("Furniture"))


def P(name, coll):
    return dp.Piece(name, coll)


def prism(p, pts, z0, z1, mat):
    """Vertical prism from a convex-or-not footprint (list of (x, y) in feet)."""
    bm = p.bm
    bot = [bm.verts.new((x * FT, y * FT, z0 * FT)) for x, y in pts]
    top = [bm.verts.new((x * FT, y * FT, z1 * FT)) for x, y in pts]
    mi = p._mi(mat)
    n = len(pts)
    for i in range(n):
        f = bm.faces.new((bot[i], bot[(i + 1) % n], top[(i + 1) % n], top[i]))
        f.material_index = mi
    for ring in (top, bot[::-1]):
        f = bm.faces.new(ring)
        f.material_index = mi


def arc(cx, cy, r, a0, a1, n=10):
    return [(cx + r * math.cos(a0 + (a1 - a0) * i / n), cy + r * math.sin(a0 + (a1 - a0) * i / n)) for i in range(n + 1)]


def tube_along(p, pts, z, r, mat, seg=6):
    """A round rail following a polyline at height z."""
    for (x0, y0), (x1, y1) in zip(pts, pts[1:]):
        L = math.hypot(x1 - x0, y1 - y0)
        if L < 1e-3:
            continue
        ang = math.degrees(math.atan2(y1 - y0, x1 - x0))
        mx = (Matrix.Translation(Vector(((x0 + x1) / 2, (y0 + y1) / 2, z)) * FT)
              @ Matrix.Rotation(math.radians(ang), 4, "Z") @ Matrix.Rotation(math.radians(90), 4, "Y"))
        res = bmesh.ops.create_cone(p.bm, cap_ends=False, segments=seg, radius1=r * FT, radius2=r * FT,
                                    depth=(L + 0.05) * FT, matrix=mx)
        p._tag(res, mat, True)


# ======================================================================= materials
TEXD = os.path.join(HERE, "textures")          # fetch_assets.py: CC0 photo textures and sky from Poly Haven


def pbr(name, key, size_m, tint=(1, 1, 1), nor=1.0, rough_mul=1.0, sat=1.0):
    """A photo-scanned material (Poly Haven, CC0): colour, roughness and normal maps, box-projected in
    object space every size_m metres and tinted to the colour in the reference photos. Real texture
    detail and roughness variation are what stop surfaces looking like plastic."""
    m = dp.get_mat(name)
    n, b = dp.fresh(m)
    co = n.new("ShaderNodeTexCoord").outputs["Object"]
    mp = n.new("ShaderNodeMapping")
    mp.inputs["Scale"].default_value = (1 / size_m, 1 / size_m, 1 / size_m)
    n.link(co, mp.inputs["Vector"])

    def img(kind, color):
        t = n.new("ShaderNodeTexImage")
        t.image = bpy.data.images.load(os.path.join(TEXD, f"{key}_{kind}.jpg"), check_existing=True)
        t.image.colorspace_settings.name = "sRGB" if color else "Non-Color"
        t.projection = "BOX"
        t.projection_blend = 0.25
        n.link(mp.outputs[0], t.inputs["Vector"])
        return t.outputs["Color"]
    col = img("diff", True)
    if sat != 1.0:
        hs = n.new("ShaderNodeHueSaturation")
        hs.inputs["Saturation"].default_value = sat
        n.link(col, hs.inputs["Color"])
        col = hs.outputs[0]
    n.link(n.mix(1.0, col, tint, "MULTIPLY"), b.inputs["Base Color"])
    n.link(n.math("MULTIPLY", n.xyz(img("rough", False))[0], rough_mul, clamp=True), b.inputs["Roughness"])
    nm = n.new("ShaderNodeNormalMap")
    nm.inputs["Strength"].default_value = nor
    n.link(img("nor", False), nm.inputs["Color"])
    n.link(nm.outputs[0], b.inputs["Normal"])
    return m


def pane(name, top, bottom, noise=0.25):
    """Window glass as a photo shows it from outside: the sky reflected light at the top, darker toward
    the bottom, with soft unevenness (no hard blotches)."""
    m = dp.get_mat(name)
    n, b = dp.fresh(m)
    z = n.xyz(n.new("ShaderNodeTexCoord").outputs["Object"])[2]
    f = n.math("FRACT", n.math("DIVIDE", z, 3.2))               # per storey
    nz = n.new("ShaderNodeTexNoise", Scale=0.7, Detail=3.0)
    n.link(n.new("ShaderNodeTexCoord").outputs["Object"], nz.inputs["Vector"])
    t = n.math("ADD", f, n.math("MULTIPLY", n.math("SUBTRACT", nz.outputs["Fac"], 0.5), noise), clamp=True)
    n.link(n.ramp(t, [(0.0, bottom), (0.55, tuple((a + c) / 2 for a, c in zip(top, bottom))), (1.0, top)]), b.inputs["Base Color"])
    b.inputs["Roughness"].default_value = 0.05
    return m


M = {}
M["white"] = pbr("Stucco_Bright", "stucco", 2.5, (1.08, 1.08, 1.06), sat=0.3)
M["white_in"] = pbr("Wall_White_In", "plaster_in", 2.0, (1.28, 1.28, 1.26), nor=0.5, sat=0.0)
M["ceiling"] = pbr("Ceiling_White", "plaster_in", 2.5, (1.32, 1.32, 1.30), nor=0.3, sat=0.0)
M["trim"] = dp.plain("Trim_White", (0.90, 0.90, 0.88), 0.5)
M["teal"] = dp.plain("Deco_Teal", (0.36, 0.68, 0.66), 0.6)
M["pink"] = dp.plain("Deco_Pink", (0.86, 0.62, 0.64), 0.6)
M["awning_blue"] = dp.fabric("Awning_Blue", (0.04, 0.14, 0.50))
M["frame_white"] = dp.plain("Frame_White", (0.84, 0.84, 0.82), 0.35)
M["frame_dark"] = dp.plain("Frame_Dark", (0.08, 0.08, 0.09), 0.4)
M["shutter"] = dp.plain("Rolldown_Shutter", (0.74, 0.74, 0.72), 0.5)
M["rail"] = dp.plain("Rail_Silver", (0.62, 0.63, 0.64), 0.3)
M["bronze"] = dp.plain("Sculpture_Bronze", (0.38, 0.27, 0.16), 0.35)
M["umb_blue"] = dp.fabric("Umb_Royal", (0.10, 0.22, 0.62))
M["umb_yellow"] = dp.fabric("Umb_Gold", (0.86, 0.66, 0.16))
M["umb_cream"] = dp.fabric("Umb_Cream", (0.88, 0.84, 0.72))
M["shopglass"] = pane("Glass_Shopfront", (0.55, 0.62, 0.68), (0.10, 0.12, 0.13))  # Glass_ -> clear engine glass
M["shopwin"] = pane("Shop_Window", (0.46, 0.54, 0.60), (0.06, 0.07, 0.08))      # other shops: baked reflection look
M["window"] = pane("Window_Upper", (0.52, 0.62, 0.70), (0.10, 0.13, 0.16))
M["roof"] = town.roof_membrane(dp, "Roof_Membrane")
M["ac"] = dp.plain("AC_Unit", (0.62, 0.63, 0.62), 0.6)
# interior
M["floor"] = pbr("Floor_WoodTile", "floor", 2.4, (0.95, 0.9, 0.86))
M["butcher"] = pbr("Butcher_Block", "oak", 1.2, (1.15, 1.02, 0.86))
M["stool"] = pbr("Stool_Wood", "oak", 0.8, (1.18, 1.04, 0.88))
M["frame_wood"] = pbr("Mirror_Frame_Oak", "oak", 0.8, (1.0, 0.82, 0.62))
M["mirror"] = dp.plain("Mirror_Silver", (0.62, 0.66, 0.66), 0.05)
M["subway"] = pbr("Subway_White", "subway", 1.8, (1.12, 1.12, 1.10), sat=0.1)
M["greentile"] = pbr("Tile_Green", "subway", 1.2, (0.16, 0.42, 0.30), sat=0.0)
M["steel"] = dp.plain("Steel", (0.62, 0.62, 0.63), 0.3)
M["black"] = dp.plain("Matte_Black", (0.025, 0.025, 0.028), 0.6)
M["menuboard"] = dp.plain("Letterboard", (0.03, 0.03, 0.035), 0.7)
M["menu_letters"] = dp.plain("Letterboard_Letters", (0.85, 0.85, 0.82), 0.6)
M["amber"] = dp.plain("Glass_Amber_Vase", (0.18, 0.08, 0.02), 0.1)
M["leaf"] = dp.plain("Monstera_Leaf", (0.06, 0.20, 0.06), 0.5)
M["leaf_fig"] = dp.plain("Fig_Leaf", (0.10, 0.26, 0.07), 0.5)
M["pot_white"] = dp.plain("Pot_White", (0.86, 0.86, 0.84), 0.5)
M["pendant"] = dp.plain("Pendant_White", (0.90, 0.90, 0.88), 0.4)
M["pastry"] = dp.plain("Pastry_Gold", (0.70, 0.45, 0.20), 0.6)
M["pastry2"] = dp.plain("Pastry_Choc", (0.30, 0.17, 0.08), 0.6)
M["cups"] = dp.plain("Cups_White", (0.90, 0.90, 0.88), 0.4)
M["kraft"] = dp.plain("Kraft_Bag", (0.62, 0.48, 0.32), 0.8)
M["fridge_glass"] = dp.plain("Glass_Fridge", (0.5, 0.55, 0.55), 0.05)
M["can_red"] = dp.plain("Can_Red", (0.62, 0.05, 0.05), 0.4)
M["can_green"] = dp.plain("Can_Green", (0.05, 0.42, 0.18), 0.4)
M["can_pink"] = dp.plain("Can_Pink", (0.80, 0.30, 0.55), 0.4)
M["bottle_clear"] = dp.plain("Bottle_Water", (0.62, 0.72, 0.76), 0.2)
M["bottle_green"] = dp.plain("Bottle_Green", (0.06, 0.30, 0.10), 0.2)
M["bottle_orange"] = dp.plain("Bottle_Orange", (0.80, 0.40, 0.06), 0.3)
# street
M["paver"] = pbr("Paver_Pink", "pavers", 1.6, (1.15, 0.80, 0.76), sat=0.4)
M["paver_grey"] = pbr("Paver_Grey", "concrete", 2.5)
M["asphalt"] = pbr("Road_Asphalt", "asphalt", 4.0, (0.9, 0.9, 0.92))
M["kerb_yellow"] = dp.plain("Kerb_Yellow", (0.80, 0.58, 0.10), 0.7)
M["kerb"] = dp.plain("Kerb_Concrete", (0.66, 0.65, 0.62), 0.8)
M["bike_green"] = town.worn_paint(dp, "Bike_Lane_Green", (0.10, 0.42, 0.22), road=(0.16, 0.16, 0.165))
M["paint_white"] = town.worn_paint(dp, "Paint_White", (0.78, 0.78, 0.75), road=(0.16, 0.16, 0.165))
M["paint_yellow"] = town.worn_paint(dp, "Paint_Yellow", (0.72, 0.52, 0.10), road=(0.16, 0.16, 0.165))
M["planter"] = dp.plain("Planter_White", (0.86, 0.86, 0.84), 0.5)
M["snake"] = dp.plain("Snake_Plant", (0.14, 0.30, 0.10), 0.5)
M["bin"] = dp.plain("Bin_Green", (0.05, 0.24, 0.12), 0.5)
M["hydrant"] = dp.plain("Hydrant_Yellow", (0.80, 0.62, 0.08), 0.5)
M["pole"] = dp.plain("Pole_Grey", (0.36, 0.37, 0.38), 0.5)
M["wicker"] = dp.planks("Wicker", 0, 2, 0.02, 0.2, (0.62, 0.44, 0.24), (0.44, 0.30, 0.15), rough=0.8)
M["table_red"] = dp.plain("Table_Red", (0.62, 0.06, 0.05), 0.4)
M["tabletop"] = dp.plain("Tabletop_White", (0.88, 0.88, 0.86), 0.4)
# park and beach
M["lawn"] = pbr("Lawn", "grass", 2.5, (0.85, 0.95, 0.7))
M["hedge"] = env.leaf_material(dp, "Hedge_Leaf", (0.04, 0.12, 0.03), (0.12, 0.26, 0.06))
M["sand"] = pbr("Sand", "sand", 3.0, (1.12, 1.06, 0.95))
M["wet"] = pbr("Wet_Sand", "sand", 3.0, (0.7, 0.64, 0.56), rough_mul=0.5)
M["dune"] = env.leaf_material(dp, "Sea_Grape", (0.08, 0.16, 0.04), (0.22, 0.30, 0.08))
M["coral"] = town.slabs(dp, "Coral_Stone", (0.78, 0.72, 0.60), size_ft=1.5, var=0.3)
M["ocean"] = dp.ocean("Ocean")
M["bark"] = pbr("Palm_Trunk_Grey", "bark", 1.2, (1.05, 1.0, 0.95), sat=0.5)
M["frond"] = env.frond_material(dp, "Palm_Frond", (0.06, 0.13, 0.04), (0.28, 0.38, 0.10))
M["leaf_tree"] = env.leaf_material(dp, "Leaf_Buttonwood", (0.10, 0.16, 0.10), (0.36, 0.44, 0.32))


# ======================================================================= the building (760 Ocean Dr)
BX0, BY0 = -100.0, -62.0      # west and south edges; east (x=0) on Ocean Dr, north (y=0) on 8th St
H1, H2 = 13.5, 25.0           # top of ground floor slab, roof
RC = 10.0                     # radius of the rounded NE corner
CAFE = (-47.0, -27.0)         # the cafe's party walls (x)
CAFE_D = -41.0                # its back wall (y)


def footprint(inset=0.0, r=RC, x0=BX0, y0=BY0):
    pts = [(x0 + inset, y0 + inset), (0 - inset, y0 + inset)]
    pts += arc(-r, -r, r - inset, 0, math.pi / 2, 8)
    pts += [(x0 + inset, 0 - inset)]
    return pts


p = P("Bldg_760", "Bldg")
# ground floor: solid where there are other shops, hollow for the cafe
prism(p, [(BX0, BY0), (CAFE[0], BY0), (CAFE[0], 0), (BX0, 0)], 0, H1, M["white"])
prism(p, [(CAFE[0], BY0), (CAFE[1], BY0), (CAFE[1], CAFE_D), (CAFE[0], CAFE_D)], 0, H1, M["white"])
prism(p, [(CAFE[1], BY0), (0, BY0)] + arc(-RC, -RC, RC, 0, math.pi / 2, 8) + [(CAFE[1], 0)], 0, H1, M["white"])
# upper floor, set back 1 ft behind the balcony line, and the roof parapet
prism(p, footprint(1.0), H1, H2, M["white"])
prism(p, footprint(0.0), H2, H2 + 0.6, M["trim"])
# streamline bands: three thin teal lines wrapping the corner at the top of the upper floor
for k, zz in enumerate((H2 - 1.6, H2 - 1.1)):
    prism(p, footprint(0.85), zz, zz + 0.2, M["teal"])
p.box(BX0 + 0.6, BY0 + 0.6, H2 + 0.6, -0.6, -0.6, H2 + 0.7, M["roof"])
# balcony slab wrapping 8th St and Ocean Dr, rounded with the corner, projecting 6 ft
outer = arc(-RC, -RC, RC + 6, 0, math.pi / 2, 10)                    # from east side round to north
slab_pts = [(0, BY0 + 8), (6.0, BY0 + 8)] + outer + [(BX0 + 20, 6.0), (BX0 + 20, 0)] + \
           arc(-RC, -RC, RC, math.pi / 2, 0, 10)
prism(p, slab_pts, H1 - 0.6, H1 + 0.3, M["trim"])
rail_line = [(5.6, BY0 + 8.4)] + arc(-RC, -RC, RC + 5.6, 0, math.pi / 2, 12) + [(BX0 + 20, 5.6)]
for zz in (H1 + 1.4, H1 + 2.3, H1 + 3.2):
    tube_along(p, rail_line, zz, 0.09, M["rail"])
tube_along(p, rail_line, H1 + 3.6, 0.14, M["rail"])
for (x, y) in rail_line[::2]:
    p.cyl(x, y, H1 + 0.3, H1 + 3.6, 0.07, M["rail"], seg=6)
# ground-floor columns under the balcony edge on 8th St (the photos show slim white piers)
for x in (-80, -62, -47.5, -26.5, -14):
    p.box(x - 0.6, 5.0, 0, x + 0.6, 6.0, H1 - 0.6, M["white"])
# upper floor glazing all along both street faces
for x in range(int(BX0) + 22, int(-RC), 6):
    p.box(x, -0.95, H1 + 1.5, x + 5.2, -0.7, H2 - 2.0, M["window"])
for y in range(int(BY0) + 9, int(-RC), 6):
    p.box(-0.95, y, H1 + 1.5, -0.7, y + 5.2, H2 - 2.0, M["window"])
# Ocean Dr ground floor: the bar's roll-down shutters, piers and the long blue awning
for y in range(int(BY0) + 4, -12, 10):
    p.box(0.0, y, 0, 0.3, y + 8.6, 10.2, M["shutter"])
    p.box(-0.5, y + 8.6, 0, 0.3, y + 10, 11.0, M["white"])
p.obox((1.2, (BY0 + 4 - 12) / 2, 11.4), (2.6, -12 - BY0 - 4, 0.25), M["awning_blue"], rot=(0, 20, 0))
p.box(2.3, BY0 + 4, 10.6, 2.6, -12, 11.4, M["awning_blue"])
# 8th St storefronts (other shops: dark shopfront glass)
for x0, x1 in ((-90, -70), (-70, CAFE[0] - 0.5), (CAFE[1] + 0.5, -12)):
    p.box(x0 + 0.5, 0.0, 0, x1 - 0.5, 0.4, 1.0, M["white"])
    p.box(x0 + 0.5, 0.0, 1.0, x1 - 0.5, 0.12, 10.0, M["shopwin"])
    k = x0 + 0.5
    while k <= x1 - 0.4:
        p.box(k - 0.12, 0.0, 1.0, k + 0.12, 0.35, 10.0, M["frame_dark"])
        k += 5.0
# shop sign lettering blocks over the shops (not real names)
for x0, x1 in ((-66, -52), (-24, -14)):
    xx = x0
    while xx < x1:
        w = R.uniform(0.6, 1.3)
        p.box(xx, 0.05, 10.8, xx + w, 0.25, 12.0, M["frame_dark"])
        xx += w + 0.35
# exterior stair at the west end of 8th St up to the balcony
for i in range(20):
    p.box(-99.5, 0.5 + i * 0.0, i * 0.68, -95.5, 6.0, i * 0.68 + 0.15, M["trim"])
p.obox((-97.5, 3.2, H1 / 2), (4.0, 5.6, 0.4), M["trim"], rot=(0, 0, 0))
# rooftop terrace on the Ocean Dr half: railing, umbrellas, the twisted metal sculptures
for zz in (H2 + 1.6, H2 + 3.0):
    tube_along(p, [(-0.5, BY0 + 2)] + arc(-RC, -RC, RC - 0.5, 0, math.pi / 2, 8) + [(-40, -0.5)], zz, 0.08, M["rail"])
for k, (x, y) in enumerate(((-12, -30), (-18, -44), (-10, -50), (-26, -20), (-30, -38))):
    p.cyl(x, y, H2 + 0.7, H2 + 9.0, 0.1, M["rail"], seg=6)
    p.cyl(x, y, H2 + 7.6, H2 + 9.2, 4.5, M["umb_blue"] if k % 2 else M["umb_yellow"], 0.2, seg=12)
for k, (x, y) in enumerate(((-4, -20), (-4, -40), (-20, -4), (-38, -4))):
    p.cyl(x, y, H2 + 0.7, H2 + 14, 0.25, M["bronze"], 0.12, seg=6)
    for j in range(6):                                                     # twisted petals
        a = j * math.pi / 3 + k
        p.ell((x + 1.6 * math.cos(a), y + 1.6 * math.sin(a), H2 + 14 + 0.6 * math.sin(j)),
              (1.8, 0.35, 0.9), M["bronze"], rot=(30, 20, math.degrees(a)))
for k in range(3):
    ax, ay = -70 + k * 12, -40
    p.box(ax, ay, H2 + 0.7, ax + 4, ay + 3.5, H2 + 3.4, M["ac"])
bldg = p.build(0.025)

# ---------------------------------------------------------------- the cafe shell (inside surfaces)
q = P("Cafe_Shell", "Interior")
X0, X1, YB = CAFE[0] + 0.5, CAFE[1] - 0.5, CAFE_D + 0.5       # inner faces of the cafe's walls
q.box(X0, YB, -0.2, X1, 0.0, 0.0, M["floor"])                    # floor
q.box(X0, YB, 11.0, X1, 0.0, 11.3, M["ceiling"])                 # ceiling (slab above to H1)
q.box(X0 - 0.01, YB, 0, X0, 0, 11, M["white_in"])
q.box(X1, YB, 0, X1 + 0.01, 0, 11, M["white_in"])
q.box(X0, YB - 0.01, 0, X1, YB, 11, M["white_in"])
q.box(X0, -0.4, 10.0, X1, 0.2, 11.3, M["white"])                 # header over the storefront
q.box(X0 - 0.5, YB - 0.5, 11.3, X1 + 0.5, 0.2, H1, M["white"])     # slab between the ceiling and the floor above
# storefront: kickplate, frames, door
q.box(X0, -0.4, 0, X1, 0.2, 0.8, M["frame_white"])
for x in (X0 + 0.1, -40.0, -34.0, X1 - 0.1):
    q.box(x - 0.15, -0.4, 0.8, x + 0.15, 0.2, 10.0, M["frame_white"])
q.box(X0, -0.4, 7.6, X1, 0.2, 7.9, M["frame_white"])             # transom bar
cafe_shell = q.build(0.008)
g = P("Glass_Cafe_Front", "Glass")
g.box(X0, -0.15, 0.8, -40.15, -0.05, 10.0, M["shopglass"])
g.box(-39.85, -0.15, 7.9, -34.15, -0.05, 10.0, M["shopglass"])
g.box(-33.85, -0.15, 0.8, X1, -0.05, 10.0, M["shopglass"])
g.build(0)
door = P("Cafe_Door", "Door")                                     # the glass door (opens on scroll)
for a in ((-39.85, -39.5), (-34.5, -34.15)):
    door.box(a[0], -0.25, 0.05, a[1], -0.05, 7.55, M["frame_white"])
door.box(-39.5, -0.25, 0.05, -34.5, -0.05, 0.6, M["frame_white"])
door.box(-39.5, -0.25, 7.2, -34.5, -0.05, 7.55, M["frame_white"])
door.box(-39.5, -0.2, 0.6, -34.5, -0.1, 7.2, M["shopglass"])
door.box(-35.2, 0.0, 3.2, -35.0, 0.35, 4.6, M["steel"])
door_o = door.build(0.005)

# ---------------------------------------------------------------- cafe furniture (from the photos)
f = P("Cafe_Furn", "Furn")
# left wall (east, x = X1): long butcher-block bar 1.4 ft deep at 3.4 ft, on brackets
f.box(X1 - 1.5, -26, 3.3, X1, -3, 3.5, M["butcher"])
for y in (-24, -15, -6):
    f.box(X1 - 1.2, y - 0.1, 2.6, X1, y + 0.1, 3.3, M["black"])
# four wooden stools under it
for y in (-22, -17.5, -13, -8.5):
    sx = X1 - 2.6
    f.box(sx - 0.7, y - 0.7, 2.25, sx + 0.7, y + 0.7, 2.45, M["stool"])
    for lx, ly in ((-0.55, -0.55), (0.55, -0.55), (-0.55, 0.55), (0.55, 0.55)):
        f.obox((sx + lx, y + ly, 1.12), (0.14, 0.14, 2.3), M["stool"], rot=(-4 * (1 if ly > 0 else -1), 4 * (1 if lx > 0 else -1), 0))
    f.box(sx - 0.6, y - 0.07, 0.8, sx + 0.6, y + 0.07, 0.95, M["stool"])
# the big mirror with rounded corners and an oak frame
my0, my1, mz0, mz1, mr = -25.5, -4.0, 4.4, 7.4, 1.0
pts = arc(my1 - mr, mz1 - mr, mr, 0, math.pi / 2, 6) + arc(my0 + mr, mz1 - mr, mr, math.pi / 2, math.pi, 6) + \
      arc(my0 + mr, mz0 + mr, mr, math.pi, 1.5 * math.pi, 6) + arc(my1 - mr, mz0 + mr, mr, 1.5 * math.pi, 2 * math.pi, 6)
for inset, mat, dx in ((0.0, M["frame_wood"], 0.25), (0.25, M["mirror"], 0.3)):
    ring = [(y + (-inset if y > (my0 + my1) / 2 else inset), z + (-inset if z > (mz0 + mz1) / 2 else inset)) for y, z in pts]
    bm = f.bm
    a = [bm.verts.new(((X1 - dx * 0.3) * FT, yy * FT, zz * FT)) for yy, zz in ring]
    b = [bm.verts.new(((X1 - dx) * FT, yy * FT, zz * FT)) for yy, zz in ring]
    mi = f._mi(mat)
    for i in range(len(ring)):
        fc = bm.faces.new((a[i], a[(i + 1) % len(ring)], b[(i + 1) % len(ring)], b[i]))
        fc.material_index = mi
    fc = bm.faces.new(b)
    fc.material_index = mi
# monstera in an amber vase, napkin box, a little plant
f.cyl(X1 - 0.75, -21, 3.5, 4.6, 0.32, M["amber"], 0.22, seg=12)
for k in range(5):
    a = k * 1.3
    f.ell((X1 - 0.9 + 0.7 * math.cos(a), -21 + 0.7 * math.sin(a), 5.4 + 0.25 * k % 2), (0.9, 0.12, 0.7), M["leaf"],
          rot=(60, 10 * k, math.degrees(a)))
f.box(X1 - 1.0, -12.6, 3.5, X1 - 0.3, -11.6, 4.3, M["frame_wood"])
f.cyl(X1 - 0.6, -9.5, 3.5, 3.9, 0.2, M["black"], seg=10)
# right side back: curved service counter of white subway tile, butcher-block top
cx0, cy0, cy1 = X0 + 1.5, -30.0, -23.0
q2 = [(X0, cy0), (-36.5, cy0)] + arc(-36.5, (cy0 + cy1) / 2, (cy1 - cy0) / 2, -math.pi / 2, math.pi / 2, 10) + [(X0, cy1)]
prism(f, q2, 0, 3.4, M["subway"])
q3 = [(X0, cy0 - 0.2), (-36.5, cy0 - 0.2)] + arc(-36.5, (cy0 + cy1) / 2, (cy1 - cy0) / 2 + 0.25, -math.pi / 2, math.pi / 2, 10) + [(X0, cy1 + 0.2)]
prism(f, q3, 3.4, 3.6, M["butcher"])
# pastry case on the counter: a glass box with tiers of pastries
f.box(-42.5, -26.5, 3.6, -38.5, -24.0, 3.7, M["frame_white"])
for lvl, z in enumerate((3.7, 4.5, 5.3)):
    f.box(-42.4, -26.4, z, -38.6, -24.1, z + 0.06, M["frame_white"])
    for i in range(6):
        f.ell((-42.0 + i * 0.62, -25.3 + (i % 2) * 0.5, z + 0.2), (0.24, 0.16, 0.12), M["pastry" if (i + lvl) % 3 else "pastry2"])
gp = P("Glass_Pastry_Case", "Glass")
gp.box(-42.5, -26.5, 3.7, -38.5, -24.0, 6.2, M["shopglass"])
gp.build(0)
# card terminal, cups, a big fiddle-leaf fig at the counter's end
f.box(-37.6, -27.5, 3.6, -36.6, -26.8, 4.1, M["cups"])
f.obox((-37.1, -27.15, 4.3), (0.7, 0.08, 0.5), M["black"], rot=(70, 0, 0))
for i in range(4):
    f.cyl(-44.5 + i * 0.5, -23.7, 3.6, 4.4 - i * 0.1, 0.16, M["cups"], 0.18, seg=8)
f.cyl(-35.0, -21.0, 0, 1.6, 0.9, M["pot_white"], 0.75, seg=12)
f.cyl(-35.0, -21.0, 1.6, 6.5, 0.07, M["stool"], seg=5)
for k in range(26):
    a, h = k * 2.4, 2.5 + (k % 9) * 0.5
    f.ell((-35.0 + math.cos(a) * (0.6 + (k % 3) * 0.35), -21.0 + math.sin(a) * (0.6 + (k % 3) * 0.35), h),
          (0.55, 0.35, 0.08), M["leaf_fig"], rot=(R.uniform(-40, 40), R.uniform(-30, 30), math.degrees(a)))
# back bar: dark green tile wall, steel counter, espresso machine, grinder, shelf with bottles and bags
f.box(X0, YB, 0, -35.0, YB + 0.15, 9.0, M["greentile"])
f.box(X0, YB + 0.15, 0, -35.5, YB + 2.4, 3.0, M["steel"])
f.box(X0, YB + 0.15, 3.0, -35.5, YB + 2.4, 3.15, M["butcher"])
f.box(-44.5, YB + 0.6, 3.15, -40.0, YB + 2.1, 4.6, M["steel"])                    # espresso machine body
f.box(-44.4, YB + 0.7, 4.6, -40.1, YB + 2.0, 4.75, M["black"])
for x in (-43.6, -42.2, -40.8):
    f.cyl(x, YB + 2.15, 3.8, 4.1, 0.2, M["black"], seg=8)
f.cyl(-38.8, YB + 1.3, 3.15, 4.5, 0.35, M["black"], 0.25, seg=10)                  # grinder
f.cyl(-38.8, YB + 1.3, 4.5, 5.1, 0.3, M["amber"], 0.35, seg=10)
f.box(-46.0, YB + 0.15, 6.4, -36.0, YB + 1.2, 6.55, M["butcher"])                  # shelf
for i in range(14):
    x = -45.6 + i * 0.68
    f.cyl(x, YB + 0.7, 6.55, 6.55 + (0.9 if i % 3 else 0.6), 0.16, M["bottle_clear" if i % 4 else "amber"], seg=8)
for i in range(5):
    f.box(-45.5 + i * 1.1, YB + 0.3, 7.6, -44.8 + i * 1.1, YB + 1.0, 8.6, M["kraft"])
# black letter-board menu on the back wall, right of the green tile
f.box(-34.0, YB, 6.0, -29.5, YB + 0.12, 8.6, M["menuboard"])
for row in range(7):
    w = R.uniform(1.6, 3.4)
    f.box(-33.7, YB + 0.12, 8.2 - row * 0.32, -33.7 + w, YB + 0.16, 8.32 - row * 0.32, M["menu_letters"])
    f.box(-30.4, YB + 0.12, 8.2 - row * 0.32, -29.9, YB + 0.16, 8.32 - row * 0.32, M["menu_letters"])
f.box(-33.5, YB, 4.3, -30.0, YB + 1.0, 4.45, M["butcher"])                         # little floating shelf
f.cyl(-32.8, YB + 0.5, 4.45, 5.1, 0.3, M["pot_white"], seg=10)
f.ell((-32.8, YB + 0.5, 5.5), (0.6, 0.5, 0.5), M["leaf"])
# glass-door drinks fridge on the right wall near the front
f.box(X0, -12.5, 0, X0 + 2.6, -6.5, 7.0, M["steel"])
for s, zz in enumerate((1.0, 2.4, 3.8, 5.2)):
    f.box(X0 + 0.3, -12.2, zz, X0 + 2.4, -6.8, zz + 0.06, M["frame_white"])
    cols = [M["can_red"], M["can_green"], M["can_pink"], M["bottle_orange"], M["bottle_clear"], M["bottle_green"]]
    for i in range(9):
        f.cyl(X0 + 1.9, -11.9 + i * 0.6, zz + 0.06, zz + (0.55 if s < 2 else 0.9), 0.2, cols[(i + s) % 6], seg=8)
gf = P("Glass_Fridge_Door", "Glass")
gf.box(X0 + 2.6, -12.4, 0.3, X0 + 2.7, -6.6, 6.8, M["fridge_glass"])
gf.build(0)
# a small two-top by the front window and two chairs
f.cyl(-44.0, -4.0, 0, 2.5, 0.12, M["black"], seg=8)
f.cyl(-44.0, -4.0, 2.5, 2.6, 1.2, M["butcher"], seg=16)
for dy in (-1.6, 1.6):
    f.box(-44.6, -4.0 + dy - 0.6, 1.5, -43.4, -4.0 + dy + 0.6, 1.6, M["black"])
    f.box(-44.6, -4.0 + dy + (0.55 if dy > 0 else -0.65), 1.6, -43.4, -4.0 + dy + (0.65 if dy > 0 else -0.55), 3.0, M["black"])
    for lx in (-0.5, 0.5):
        for ly in (-0.5, 0.5):
            f.cyl(-44.0 + lx, -4.0 + dy + ly, 0, 1.5, 0.05, M["black"], seg=4)
# white bell pendants over the bar and the counter
for (x, y) in ((-29.5, -20), (-29.5, -12), (-29.5, -6), (-40.5, -26.5), (-38.0, -24.0)):
    f.cyl(x, y, 8.2, 11.0, 0.02, M["black"], seg=4)
    f.cyl(x, y, 7.4, 8.2, 0.75, M["pendant"], 0.2, seg=14)
cafe_furn = f.build(0.006)

# lights in the cafe (warm, like the photos): ceiling cans and the pendants
for (x, y) in ((-41, -6), (-33, -6), (-41, -16), (-33, -16), (-41, -30), (-33, -33)):
    L = bpy.data.objects.new("Can", bpy.data.lights.new("Can", "AREA"))
    L.data.energy, L.data.size, L.data.color = 120, 0.5, (1.0, 0.86, 0.70)
    L.location = Vector((x, y, 10.9)) * FT
    scene.collection.objects.link(L)
for (x, y) in ((-29.5, -20), (-29.5, -12), (-29.5, -6), (-40.5, -26.5), (-38.0, -24.0)):
    L = bpy.data.objects.new("Pend", bpy.data.lights.new("Pend", "POINT"))
    L.data.energy, L.data.shadow_soft_size, L.data.color = 35, 0.1, (1.0, 0.84, 0.66)
    L.location = Vector((x, y, 7.3)) * FT
    scene.collection.objects.link(L)

# ======================================================================= streets
s = P("Street", "Street")
# 8th St: building-side sidewalk y 0..12, road 12..40, north sidewalk 40..52
# (no two slabs overlap: coplanar overlapping solids shadow each other black in the bake)
s.box(-260, 0, -0.3, 0, 11.6, 0.5, M["paver"])
s.box(-260, 12, -0.3, 0, 40, 0.0, M["asphalt"])
s.box(-260, 40.4, -0.3, 0, 52, 0.5, M["paver"])
for y0, y1 in ((11.6, 12.0), (40.0, 40.4)):
    s.box(-260, y0, 0.0, 0, y1, 0.55, M["kerb_yellow"])
s.box(-260, 25.8, 0.0, 60, 26.2, 0.03, M["paint_yellow"])
# Ocean Dr: sidewalk x 0..16 (with palm planting strip), road 16..56, bike lane, park side kerb
s.box(0, -420, -0.3, 15.6, 12, 0.5, M["paver"])
s.box(0, 40, -0.3, 15.6, 440, 0.5, M["paver"])
s.box(0, 12, -0.3, 16, 40, 0.0, M["asphalt"])                    # 8th St's mouth, kerb to kerb
s.box(16, -420, -0.3, 64, 440, 0.0, M["asphalt"])
s.box(15.6, -420, 0.0, 16.0, 12, 0.55, M["kerb_yellow"])
s.box(15.6, 40, 0.0, 16.0, 440, 0.55, M["kerb_yellow"])
s.box(54, -420, 0.0, 61, 440, 0.03, M["bike_green"])
s.box(61, -420, 0.0, 61.3, 440, 0.04, M["paint_white"])
s.box(64, -420, -0.3, 64.4, 440, 0.65, M["kerb"])
for y in range(-420, 440, 22):                                   # parking stall ticks on the west side
    if not 6 < y < 46:
        s.box(16, y - 0.2, 0.0, 24, y + 0.2, 0.03, M["paint_white"])
s.box(24.2, -420, 0.0, 24.6, 440, 0.03, M["paint_white"])
s.box(38.8, -420, 0.0, 39.2, 440, 0.03, M["paint_yellow"])
for k in range(9):                                               # crosswalk over Ocean Dr at 8th St
    s.box(18 + k * 5, 18, 0.0, 20.5 + k * 5, 34, 0.03, M["paint_white"])
for k in range(4):                                               # and over 8th St at Ocean Ct
    pass
street = s.build(0)

# ======================================================================= Lummus Park, dunes, beach, ocean
pk = P("Park", "Park")
pk.box(64.4, -420, -0.3, 300, 440, 0.6, M["lawn"])
# the serpentine pink path that runs the length of the park
pts = [(78 + 10 * math.sin(y / 60.0), y) for y in range(-420, 441, 10)]
for (x0, y0), (x1, y1) in zip(pts, pts[1:]):
    L = math.hypot(x1 - x0, y1 - y0)
    pk.obox(((x0 + x1) / 2, (y0 + y1) / 2, 0.62), (12, L + 0.5, 0.1), M["paver"],
            rot=(0, 0, math.degrees(math.atan2(y1 - y0, x1 - x0)) - 90))
pk.box(70, 22, 0.6, 140, 30, 0.72, M["paver"])                  # path from 8th St into the park
for y0 in range(-420, 440, 60):                                  # low hedge along the park edge
    if not 10 < y0 + 30 < 50:
        pk.box(66, y0 + 4, 0.6, 69.5, y0 + 56, 3.2, M["hedge"])
pk.box(300, -420, 0.6, 304, 440, 3.0, M["coral"])                # coral-stone wall at the dune line
park = pk.build(0)
bc = P("Beach", "Beach")
bc.box(304, -420, -0.3, 420, 440, 0.4, M["sand"])
bc.box(420, -420, -0.6, 470, 440, 0.0, M["sand"])
bc.box(470, -420, -0.9, 500, 440, -0.4, M["wet"])
beach = bc.build(0)
dn = P("Dunes", "Park")
for k in range(70):
    y = -420 + k * 12.5 + R.uniform(-3, 3)
    env.lumpy(dn, (318 + R.uniform(-6, 10), y, 1.4), R.uniform(3.5, 6.0), M["dune"], squash=0.55)
dn.build(0)
me = bpy.data.meshes.new("Ocean")
me.from_pydata([(490 * FT, -6000 * FT, -0.8 * FT), (30000 * FT, -6000 * FT, -0.8 * FT),
                (30000 * FT, 6000 * FT, -0.8 * FT), (490 * FT, 6000 * FT, -0.8 * FT)], [], [(0, 1, 2, 3)])
me.materials.append(M["ocean"])
oc = bpy.data.objects.new("Ocean", me)
bpy.data.collections["Site"].objects.link(oc)

# ======================================================================= neighbours
nb_mats = [pbr(n, "stucco", 2.5, c, sat=0.2) for n, c in (("Deco_Mint", (0.76, 0.92, 0.86)), ("Deco_Peach", (1.04, 0.86, 0.72)),
                                                ("Deco_Lilac", (0.90, 0.84, 0.95)), ("Deco_Cream", (1.02, 0.97, 0.84)),
                                                ("Deco_Sky", (0.80, 0.92, 1.0)), ("Deco_White", (1.0, 1.0, 0.97)))]
accents = [M["teal"], M["pink"], dp.plain("Deco_Yellow", (0.86, 0.70, 0.22), 0.6), dp.plain("Deco_Navy", (0.10, 0.18, 0.36), 0.6)]


def deco_block(name, y0, y1, depth, floors, body, acc, sign=False, porch=None):
    """An Ocean Drive Art Deco hotel facing east (x = 0 plane): stacked windows with eyebrows,
    a central vertical fin over the parapet, pastel trim, a lit name sign, a cafe porch below."""
    b = P(name, "Neighbors")
    H = 4 + floors * 10.5
    b.box(-depth, y0, 0, 0, y1, H, body)
    yc = (y0 + y1) / 2
    w = y1 - y0
    for fl in range(1, floors):
        z = 4 + fl * 10.5
        for k in range(max(2, int((w - 8) / 8))):
            yy = y0 + 5 + k * ((w - 10) / max(1, int((w - 8) / 8) - 1))
            b.box(0.0, yy - 1.8, z, 0.3, yy + 1.8, z + 5.0, M["window"])
            b.box(0.0, yy - 2.1, z + 5.2, 1.4, yy + 2.1, z + 5.5, acc)            # eyebrow
    b.box(-3, yc - 2.5, H, 0.8, yc + 2.5, H + 12, body)                          # fin
    b.box(0.8, yc - 1.0, H - 20, 1.2, yc + 1.0, H + 11, acc)
    b.box(-depth, y0, H, 0, y1, H + 1.0, M["trim"])
    b.box(0.0, y0 + 1, 2.5, 0.3, y1 - 1, 12.0, M["shopwin"])
    b.box(0.0, y0, 12.0, 1.5, y1, 13.0, acc)
    if sign:                                                                    # lettering on the fascia
        yy = y0 + 4
        while yy < y1 - 4:
            ww = R.uniform(1.4, 2.4)
            b.box(1.5, yy, 13.4, 1.8, yy + ww, 16.0, acc)
            yy += ww + 0.8
    if porch:                                                                   # sidewalk cafe
        for k in range(int((y1 - y0 - 6) / 7)):
            yy = y0 + 4 + k * 7
            for dx in (5, 11):
                b.cyl(dx, yy, 0.5, 3.1, 0.1, M["table_red"], seg=6)
                b.cyl(dx, yy, 3.1, 3.2, 1.3, M["tabletop"], seg=12)
                for a in (0, 180):
                    cx = dx + 1.9 * math.cos(math.radians(a))
                    b.box(cx - 0.8, yy - 0.8, 0.5, cx + 0.8, yy + 0.8, 2.0, M["wicker"])
                    b.box(cx - 0.8 if a else cx + 0.6, yy - 0.8, 2.0, cx - 0.6 if a else cx + 0.8, yy + 0.8, 3.6, M["wicker"])
            b.cyl(8, yy + 3.5, 0.5, 8.5, 0.08, M["pole"], seg=6)
            b.cyl(8, yy + 3.5, 7.4, 8.8, 5.0, porch, 0.2, seg=12)
    return b.build(0.03)


# the Starlite Hotel, right south of 760: three floors, cream with teal and pink, yellow umbrellas
deco_block("Starlite", -132, -62, 70, 3, nb_mats[5], M["teal"], sign=True, porch=M["umb_yellow"])
# News Cafe's building across 8th St: four floors, white, with green awnings and a porch cafe
deco_block("Tony_Hotel", 52, 140, 90, 4, nb_mats[5], dp.plain("Awning_Green", (0.06, 0.30, 0.16), 0.6),
           sign=True, porch=M["umb_cream"])
y = 140
k = 0
while y < 430:                                                   # the rest of Ocean Drive, north
    w = R.uniform(55, 95)
    deco_block(f"Deco_N{k}", y + 2, y + w, R.uniform(60, 100), R.choice((2, 3, 3, 4)), nb_mats[k % len(nb_mats)],
               accents[k % len(accents)], sign=k % 2 == 0, porch=M["umb_cream"] if k % 3 == 0 else None)
    y += w + R.choice((0, 0, 10))
    k += 1
y = -132
while y > -420:
    w = R.uniform(55, 95)
    deco_block(f"Deco_S{k}", y - w, y - 2, R.uniform(60, 100), R.choice((2, 3, 3, 4)), nb_mats[k % len(nb_mats)],
               accents[k % len(accents)], sign=k % 2 == 1, porch=M["umb_yellow"] if k % 3 == 1 else None)
    y -= w + R.choice((0, 0, 10))
    k += 1
# the block behind 760 (across Ocean Ct, the alley), lower and plainer
for k, y0 in enumerate((-130, -60, 52, 140)):
    b = P(f"Back_{k}", "Neighbors")
    b.box(-230, y0, 0, -118, y0 + (70 if y0 < 0 else 86), 30 + (k % 2) * 12, nb_mats[(k + 2) % len(nb_mats)])
    b.build(0)

# ======================================================================= props, cars, trees
pr = P("Props", "Props")
for y in list(range(-410, -64, 26)) + list(range(54, 430, 26)) + [-50, -30]:     # white planters + snake plants
    pr.box(12, y - 3, 0.5, 15.5, y + 3, 2.6, M["planter"])
    for k in range(9):
        pr.obox((13.75 + R.uniform(-1, 1), y + R.uniform(-2.4, 2.4), 3.6), (0.25, 0.5, 2.4), M["snake"],
                rot=(R.uniform(-12, 12), R.uniform(-12, 12), R.uniform(0, 180)))
for (x, y) in ((13, 8), (13, -60), (13, 60), (-30, 10), (-70, 10)):
    pr.cyl(x, y, 0.5, 3.8, 1.1, M["bin"], seg=12)
pr.cyl(14, 4, 0.5, 2.6, 0.45, M["hydrant"], seg=10)
pr.ell((14, 4, 2.8), (0.45, 0.45, 0.35), M["hydrant"])
for (x, y) in ((14, 13), (14, 38), (62, 13), (62, 38)):                           # street signs and lights
    pr.cyl(x, y, 0.5, 11, 0.12, M["pole"], seg=6)
    pr.box(x - 0.1, y - 1.5, 9.2, x + 0.1, y + 1.5, 10.2, dp.plain("Sign_Green", (0.03, 0.30, 0.14), 0.5))
for y in range(-400, 430, 80):
    pr.cyl(66, y, 0.6, 20, 0.25, M["pole"], seg=8)
    pr.ell((66, y, 20.5), (0.9, 0.9, 1.2), M["frame_white"])
props = pr.build(0.01)
cm = cars.materials(dp)
paints = [dp.plain(n, c, 0.35) for n, c in (("Car_White", (0.80, 0.80, 0.78)), ("Car_Black", (0.03, 0.03, 0.035)),
                                              ("Car_Silver", (0.50, 0.51, 0.52)), ("Car_Grey", (0.24, 0.25, 0.26)),
                                              ("Car_Blue", (0.06, 0.14, 0.32)), ("Car_Red", (0.45, 0.04, 0.04)))]
cp = P("Cars", "Props")
for y in range(-400, 420, 22):
    if -8 < y < 56 or R.random() < 0.25:
        continue
    cars.car(cp, cm, 20.0, y + 11, 90 + R.uniform(-2, 2), R.choices(("sedan", "suv", "hatch", "pickup"), (4, 4, 2, 1))[0],
             paints[R.choices(range(6), (5, 4, 3, 3, 1, 1))[0]])
for x in (-160, -136, -112, -230):
    cars.car(cp, cm, x, 15.5, 0, R.choice(("sedan", "suv")), paints[R.randrange(6)])
cp.build(0)

trunk = M["bark"]
for k, y in enumerate([y for y in range(-410, 430, 24) if not -4 < y < 50]):        # palms along Ocean Dr sidewalk
    env.palm(dp, f"Env_Palm_Walk_{k}", 9.0, y, 0.5, R.uniform(30, 40), (R.uniform(1, 3), R.uniform(0, 6.28)), trunk, M["frond"])
k = 0
for row_x in (84, 110, 140, 175, 210, 245, 280):                                     # Lummus Park: rows of palms
    for y in range(-410, 430, R.choice((26, 30, 34))):
        if abs(y - 26) < 10 and row_x < 150:
            continue
        env.palm(dp, f"Env_Palm_Park_{k}", row_x + R.uniform(-5, 5), y + R.uniform(-6, 6), 0.6, R.uniform(32, 48),
                 (R.uniform(2, 7), R.uniform(0, 6.28)), trunk, M["frond"])
        k += 1
for k, (x, y) in enumerate(((11, 54), (-60, 48), (-200, 6))):                       # buttonwood / sea grape trees
    env.tree(dp, f"Env_Tree_{k}", x, y, 0.5, 20, 9, trunk, M["leaf_tree"])
for o in list(bpy.data.collections["Env"].objects):                                 # move to Trees
    bpy.data.collections["Env"].objects.unlink(o)
    bpy.data.collections["Trees"].objects.link(o)

# ======================================================================= daylight: a real sky (HDRI)
# A photographed clear sky (Poly Haven, CC0) lights everything; its own sun gives the shadows. Turn it so
# the sun stands east-south-east over the ocean, like a Miami morning.
world = bpy.data.worlds.new("Miami_Morning")
scene.world = world
world.use_nodes = True
nt = world.node_tree
for n_ in list(nt.nodes):
    nt.nodes.remove(n_)
out = nt.nodes.new("ShaderNodeOutputWorld")
bg = nt.nodes.new("ShaderNodeBackground")
env_t = nt.nodes.new("ShaderNodeTexEnvironment")
env_t.image = bpy.data.images.load(os.path.join(TEXD, "sky.hdr"))
mp = nt.nodes.new("ShaderNodeMapping")
tc = nt.nodes.new("ShaderNodeTexCoord")
nt.links.new(tc.outputs["Generated"], mp.inputs["Vector"])
nt.links.new(mp.outputs[0], env_t.inputs["Vector"])
nt.links.new(env_t.outputs[0], bg.inputs[0])
nt.links.new(bg.outputs[0], out.inputs[0])
# where is the sun in the HDR? Cycles' equirect: u = -atan2(y, x)/2pi + 0.5, v = atan2(z, r)/pi + 0.5
import numpy as _np  # noqa: E402
w_, h_ = env_t.image.size
px = _np.empty(w_ * h_ * 4, dtype=_np.float32)
env_t.image.pixels.foreach_get(px)
lum = px.reshape(h_, w_, 4)[..., :3].sum(-1)
row, col = _np.unravel_index(_np.argmax(lum), lum.shape)     # rows bottom-up in Blender
u, v = (col + 0.5) / w_, (row + 0.5) / h_
hdr_az = -(u - 0.5) * 2 * math.pi                              # azimuth from +x toward +y
SUN_EL = (v - 0.5) * math.pi
WANT_AZ = math.radians(-25)                                    # east-south-east
rot = WANT_AZ - hdr_az
mp.inputs["Rotation"].default_value[2] = -rot                  # turn the lookup the other way to turn the sky by +rot
d = Vector((math.cos(WANT_AZ) * math.cos(SUN_EL), math.sin(WANT_AZ) * math.cos(SUN_EL), math.sin(SUN_EL)))
scene["sun_dir"] = list(d)
print(f"HDR sun at elevation {math.degrees(SUN_EL):.0f}, turned {math.degrees(rot):.0f} deg to the east-south-east")
bg.inputs[1].default_value = 1.0
vs = scene.view_settings
vs.view_transform = "AgX"
vs.look = "AgX - Base Contrast" if "AgX - Base Contrast" in [l.identifier for l in
                                                              type(vs).bl_rna.properties["look"].enum_items] else "None"
os.makedirs(os.path.dirname(os.path.abspath(OUT)), exist_ok=True)
bpy.ops.wm.save_as_mainfile(filepath=os.path.abspath(OUT))
print("saved", OUT, {c: len(bpy.data.collections[c].objects) for c in COLLS + ["Env", "Furniture"]})
