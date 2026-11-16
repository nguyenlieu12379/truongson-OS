"""Bake the golden-hour coastal cottage for the live-3D website.

Opens coastal_cottage_walkthrough.blend (golden-hour design), freezes it at a frame where the
house is complete and the doors are shut, adds the surroundings (environment.py), then bakes
every static surface into two textures per bake group:

  albedo   (high-res, sRGB)   the material colour: planks, tile, siding, fabric...
  lightmap (lower-res, HDR)   the light: sun, sky, bounce, lamp glow, soft shadows

The site multiplies them (three.js map x lightMap), so materials stay sharp and the light stays
smooth. The lightmap is stored 8-bit as (L / scale) in sRGB; the scale rides in the material's
extras as lm_scale. The sky is rendered as an equirect panorama the same way.

Run:  python bake_web.py [--quick] [--site DIR] [--work DIR]
  --quick   low resolution and samples, to check UVs, leaks and the pipeline (minutes)
  --site    the site folder to write assets/model.glb and assets/sky.webp into
  --work    where baked images and the baked .blend go (default: ./bake_work)
"""
import math
import os
import sys
import time

import bpy  # first: it makes bmesh and mathutils importable
import bmesh  # noqa: F401
import numpy as np
from mathutils import Matrix, Vector

HERE = os.path.dirname(os.path.abspath(__file__))
ARGS = sys.argv[1:]
QUICK = "--quick" in ARGS


def arg(name, default):
    for i, a in enumerate(ARGS):
        if a == name and i + 1 < len(ARGS):
            return ARGS[i + 1]
    return default


SITE = os.path.abspath(arg("--site", os.path.join(HERE, "..", "..", "websites", "TruongSon-demos",
                                                  "coastal-cottage")))
WORK = os.path.abspath(arg("--work", os.path.join(HERE, "bake_work")))
os.makedirs(WORK, exist_ok=True)
os.makedirs(os.path.join(SITE, "assets"), exist_ok=True)
FT = 0.3048
T0 = time.time()


def log(*a):
    print(f"[bake {time.time() - T0:7.1f}s]", *a, flush=True)


# ------------------------------------------------------------------
# 1. Open the golden-hour scene and freeze it
# ------------------------------------------------------------------
bpy.ops.wm.open_mainfile(filepath=os.path.join(HERE, "coastal_cottage_walkthrough.blend"))
sys.path.insert(0, HERE)
import design_pass as dp  # noqa: E402
import environment as env  # noqa: E402

scene = bpy.context.scene
FREEZE = 600                        # built, roof on, ceiling in, doors shut
scene.frame_set(FREEZE)
dg = bpy.context.evaluated_depsgraph_get()
state = {}
for o in bpy.data.objects:
    state[o.name] = (o.matrix_world.copy(), o.hide_render)
for o in bpy.data.objects:
    if o.animation_data:
        o.animation_data_clear()
for o in bpy.data.objects:
    mw, hr = state[o.name]
    o.matrix_world = mw
    o.hide_render = hr
for m in bpy.data.materials:
    if m.node_tree and m.node_tree.animation_data:
        m.node_tree.animation_data_clear()
scene.frame_set(FREEZE)

# drop the film-only pieces
drop = set()
for cname in ("Table", "Labels"):
    c = bpy.data.collections.get(cname)
    if c:
        drop |= {o.name for o in c.objects}
drop |= {"Cam_Film", "Cam_Target", "Table_Lamp"}
drop |= {o.name for o in bpy.data.objects if o.hide_render and o.name != "Plan_On_Site"}
for nm in drop:
    o = bpy.data.objects.get(nm)
    if o:
        bpy.data.objects.remove(o, do_unlink=True)
log("frozen at", FREEZE, "dropped", len(drop))


def unhide(lc):
    lc.exclude = False
    lc.hide_viewport = False
    lc.collection.hide_viewport = False
    lc.collection.hide_select = False
    for c in lc.children:
        unhide(c)


unhide(bpy.context.view_layer.layer_collection)
for o in bpy.data.objects:
    o.hide_viewport = False
    o.hide_select = False

# ------------------------------------------------------------------
# 2. Surroundings, and ground pieces cut to what the camera sees
# ------------------------------------------------------------------
env.add(dp)


def quad_obj(name, x0, y0, x1, y1, z, mat, coll="Site"):
    me = bpy.data.meshes.new(name)
    me.from_pydata([(x0 * FT, y0 * FT, z * FT), (x1 * FT, y0 * FT, z * FT), (x1 * FT, y1 * FT, z * FT),
                    (x0 * FT, y1 * FT, z * FT)], [], [(0, 1, 2, 3)])
    me.materials.append(mat)
    uv = me.uv_layers.new(name="Bake")
    for li, (u, v) in zip(range(4), ((0, 0), (1, 0), (1, 1), (0, 1))):
        uv.data[li].uv = (u, v)
    o = bpy.data.objects.new(name, me)
    bpy.data.collections[coll].objects.link(o)
    return o


sand_m = bpy.data.objects["Sand"].data.materials[0]
wet_m = bpy.data.objects["Wet_Sand"].data.materials[0]
surf_m = bpy.data.objects["Surf"].data.materials[0]
for nm in ("Sand", "Wet_Sand", "Surf"):
    bpy.data.objects.remove(bpy.data.objects[nm], do_unlink=True)
# near sand: around the house, from the street to the water line, baked sharp
NX0, NX1, NY0, NY1 = -230.0, 290.0, -50.0, 150.0
quad_obj("Sand_Near", NX0, NY0, NX1, NY1, -3.0, sand_m)
quad_obj("Wet_Sand_Near", NX0, 150, NX1, 175, -3.05, wet_m)
quad_obj("Surf_Near", NX0, 172, NX1, 180, -3.02, surf_m)
# far beach either side, and the strip the hill doesn't cover: baked soft
quad_obj("Sand_Far_L", -1500, -50, NX0, 150, -3.0, sand_m)
quad_obj("Sand_Far_R", NX1, -50, 1500, 150, -3.0, sand_m)
quad_obj("Wet_Far_L", -1500, 150, NX0, 175, -3.05, wet_m)
quad_obj("Wet_Far_R", NX1, 150, 1500, 175, -3.05, wet_m)
quad_obj("Sand_Back", -1500, -700, 1500, -50, -3.4, sand_m)   # under the hill, past its edges
log("environment added")

# ------------------------------------------------------------------
# 3. Bake groups
# ------------------------------------------------------------------
def objs_in(*cols):
    out = []
    for c in cols:
        col = bpy.data.collections.get(c)
        if col:
            out += [o for o in col.all_objects if o.type == "MESH"]
    return out


DOORS = [n for n in ("Ext_Front_door2",) if n in bpy.data.objects]   # hinge origin set by the film script
NOBAKE = {"Ocean", "Plan_On_Site"} | set(DOORS)
D_FT = 54.0 + 10 / 12


def center_y(o):
    vs = [o.matrix_world @ Vector(c) for c in o.bound_box]
    return sum(v.y for v in vs) / 8 / FT


furn = [o for o in objs_in("Furniture") if o.name not in NOBAKE]
site = [o for o in objs_in("Site") if o.name not in NOBAKE]
near_ground = [o for o in site if o.name.endswith("_Near")]
far_ground = [o for o in site if o.name.startswith(("Sand_Far", "Wet_Far", "Sand_Back"))]
site_rest = [o for o in site if o not in near_ground and o not in far_ground]
envs = objs_in("Env")
glass = set(objs_in("Glass"))

# name, objects, px per metre (albedo), lightmap divisor, role, phase
GROUPS = [
    ("G_Structure", [o for o in objs_in("Structure", "House") if o.name not in NOBAKE], 40, 3, None),
    ("G_Floors", objs_in("Floors"), 56, 3, None),
    ("G_Walls", [o for o in objs_in("Exterior", "Walls") if o.name not in NOBAKE and o not in glass], 44, 3,
     None),
    ("G_Ceiling", objs_in("Ceiling"), 28, 2, "upper"),
    ("G_Roof", objs_in("Roof"), 24, 2, "upper"),
    ("G_FurnIn", [o for o in furn if 8 < center_y(o) < 42], 64, 3, None),
    ("G_FurnOut", [o for o in furn if not 8 < center_y(o) < 42], 48, 3, None),
    ("G_Site", site_rest, 20, 2, "site"),
    ("G_SandNear", near_ground, None, 2, "site"),
    ("G_SandFar", far_ground, 1.5, 1, "site"),
    ("G_Hill", [o for o in envs if o.name == "Env_Hill"], None, 2, "site"),
    ("G_EnvHouses", [o for o in envs if o.name.startswith("Env_House")], 9, 2, "site"),
    ("G_EnvTrees", [o for o in envs if o.name.startswith(("Env_Tree", "Env_Palm", "Env_BeachPalm",
                                                          "Env_Street"))], 9, 2, "site"),
] + [(d, [bpy.data.objects[d]], 56, 3, "door") for d in DOORS]
GROUPS = [g for g in GROUPS if g[1]]
seen = set()
for g in GROUPS:
    for o in g[1]:
        assert o.name not in seen, f"{o.name} in two groups"
        seen.add(o.name)
left = [o.name for o in bpy.data.objects if o.type == "MESH" and o.name not in seen
        and o.name not in NOBAKE and o not in glass]
log("groups", [(g[0], len(g[1])) for g in GROUPS], "unassigned", left[:20])

# fixed-size images for the planar ground pieces (width, height)
FIXED = {"G_SandNear": (4096, 2048), "G_Hill": (2048, 1024)}
if QUICK:
    FIXED = {k: (w // 4, h // 4) for k, (w, h) in FIXED.items()}
DENS_SCALE = 0.3 if QUICK else 1.0


def select_only(objs, active=None):
    bpy.ops.object.mode_set(mode="OBJECT") if bpy.context.object and bpy.context.object.mode != "OBJECT" else None
    for o in bpy.context.view_layer.objects:
        o.select_set(False)
    for o in objs:
        o.hide_set(False)
        o.hide_viewport = False
        o.select_set(True)
    bpy.context.view_layer.objects.active = active or objs[0]


def surface_area(objs):
    a = 0.0
    for o in objs:
        m = o.matrix_world
        for p in o.data.polygons:
            vs = [m @ o.data.vertices[i].co for i in p.vertices]
            for k in range(1, len(vs) - 1):
                a += ((vs[k] - vs[0]).cross(vs[k + 1] - vs[0])).length / 2
    return a


def pow2(n, lo=64, hi=4096):
    """Nearest power of two (in log scale), clamped."""
    p = 2 ** round(math.log2(max(n, 1)))
    return int(min(hi, max(lo, p)))


# make every group object a real, single-user mesh (apply bevels etc.)
allg = [o for g in GROUPS for o in g[1]]
select_only(allg)
bpy.ops.object.make_single_user(type="SELECTED_OBJECTS", object=True, obdata=True)
bpy.ops.object.convert(target="MESH")
log("converted", len(allg))

# Join each group into ONE object with an identity transform before baking. Cycles bakes
# selected objects one at a time (about 4 s each), so 337 pilings took 21 min; joined, seconds.
# Most pieces have their origin at the world origin already, so object-space textures don't move.
FIXED_NAMES = {"G_SandNear", "G_Hill"}
# Furniture is baked joined (fast), then split back into its pieces for export, so the site can
# pop each piece in on its own like the film. Tag every face with the index of the piece it came from.
PIECED = {"G_FurnIn", "G_FurnOut"}
PIECES = {}
for name, objs, *_ in GROUPS:
    if name in PIECED:
        PIECES[name] = []
        for i, o in enumerate(objs):
            at = o.data.attributes.get("piece") or o.data.attributes.new("piece", "INT", "FACE")
            at.data.foreach_set("value", [i] * len(o.data.polygons))
            PIECES[name].append((i, o.name))
joined = []
for name, objs, dens, lmdiv, role in GROUPS:
    if name in FIXED_NAMES or role == "door" or len(objs) == 1 and objs[0].name == name:
        joined.append((name, objs, dens, lmdiv, role))
        continue
    me = bpy.data.meshes.new(name)
    host = bpy.data.objects.new(name, me)
    objs[0].users_collection[0].objects.link(host)
    select_only(objs + [host], active=host)
    bpy.ops.object.join()
    host = bpy.context.view_layer.objects.active
    host.name = name
    # thin out the heavy organic geometry before baking (the bake then matches it exactly)
    ratio = {"G_Site": 0.35, "G_EnvTrees": 0.35, "G_FurnOut": 0.5, "G_FurnIn": 0.6}.get(name)
    if ratio:
        before = len(host.data.polygons)
        dm = host.modifiers.new("Decimate", "DECIMATE")
        dm.ratio = ratio
        select_only([host])
        bpy.ops.object.modifier_apply(modifier=dm.name)
        log(f"decimated {name}: {before} -> {len(host.data.polygons)} faces")
    joined.append((name, [host], dens, lmdiv, role))
GROUPS = joined
log("joined into", len(GROUPS), "objects")

# ------------------------------------------------------------------
# 4. Bake UVs (one atlas per group, islands packed across all its objects)
# ------------------------------------------------------------------
sizes = {}
for name, objs, dens, lmdiv, role in GROUPS:
    for o in objs:
        me = o.data
        uv = me.uv_layers.get("Bake") or me.uv_layers.new(name="Bake")
        if len(me.uv_layers) > 1:
            first = [l for l in me.uv_layers if l.name != "Bake"][0]
            first.active_render = True
        me.uv_layers.active = uv
    if name in FIXED:
        w, h = FIXED[name]
        if name == "G_Hill":                       # planar UV over the grid
            o = objs[0]
            xs = [v.co.x for v in o.data.vertices]
            ys = [v.co.y for v in o.data.vertices]
            x0, x1, y0, y1 = min(xs), max(xs), min(ys), max(ys)
            uvl = o.data.uv_layers["Bake"]
            for poly in o.data.polygons:
                for li in poly.loop_indices:
                    co = o.data.vertices[o.data.loops[li].vertex_index].co
                    uvl.data[li].uv = ((co.x - x0) / (x1 - x0), (co.y - y0) / (y1 - y0))
        else:                                       # Sand_Near / Wet / Surf: stack them in v
            spans = {"Sand_Near": (0.0, 0.84), "Wet_Sand_Near": (0.85, 0.95), "Surf_Near": (0.96, 1.0)}
            for o in objs:
                v0, v1 = spans[o.name]
                for li, (u, v) in zip(range(4), ((0, 0), (1, 0), (1, 1), (0, 1))):
                    o.data.uv_layers["Bake"].data[li].uv = (0.003 + u * 0.994, v0 + v * (v1 - v0))
        sizes[name] = (w, h)
        continue
    area = surface_area(objs)
    side = math.sqrt(area / 0.55) * dens * DENS_SCALE
    foliage = name in ("G_Site", "G_EnvTrees", "G_FurnOut")
    # foliage = thousands of tiny islands; they need room or the gaps eat the atlas
    s = pow2(side, (2048 if foliage else 256) if not QUICK else (512 if foliage else 64))
    sizes[name] = (s, s)
    select_only(objs)
    bpy.ops.object.mode_set(mode="EDIT")
    bpy.ops.mesh.select_all(action="SELECT")
    bpy.ops.uv.smart_project(angle_limit=math.radians(80 if foliage else 60), island_margin=0.0,
                             area_weight=0.0, correct_aspect=True, scale_to_bounds=False)
    bpy.ops.uv.select_all(action="SELECT")
    bpy.ops.uv.pack_islands(udim_source="CLOSEST_UDIM", rotate=True, margin_method="FRACTION",
                            margin=(2.0 if foliage else 4.0) / s)
    bpy.ops.object.mode_set(mode="OBJECT")
    log(f"uv {name}: {len(objs)} objs, {area:.0f} m2 -> {s}px")

# ------------------------------------------------------------------
# 5. Bake
# ------------------------------------------------------------------
scene.render.engine = "CYCLES"
scene.cycles.device = "CPU"
scene.render.bake.margin = 6
scene.render.bake.margin_type = "EXTEND"
scene.render.bake.use_clear = True
plan = bpy.data.objects.get("Plan_On_Site")
if plan:
    plan.hide_render = True                       # don't shadow the sand under it

METALS = {}
for m in bpy.data.materials:
    if m.node_tree:
        for nd in m.node_tree.nodes:
            if nd.type == "BSDF_PRINCIPLED" and not nd.inputs["Metallic"].is_linked \
                    and nd.inputs["Metallic"].default_value > 0:
                METALS[(m.name, nd.name)] = nd.inputs["Metallic"].default_value


def set_metals(zero):
    for (mn, nn), v in METALS.items():
        bpy.data.materials[mn].node_tree.nodes[nn].inputs["Metallic"].default_value = 0.0 if zero else v


DEFAULT_M = bpy.data.materials.new("Bake_Default")
DEFAULT_M.use_nodes = True


def bake_target(objs, img):
    for o in objs:
        if not o.material_slots or not any(s.material for s in o.material_slots):
            o.data.materials.clear()
            o.data.materials.append(DEFAULT_M)
    mats = {s.material for o in objs for s in o.material_slots if s.material}
    for m in mats:
        m.use_nodes = True
        nt = m.node_tree
        nd = nt.nodes.get("BakeTarget") or nt.nodes.new("ShaderNodeTexImage")
        nd.name = "BakeTarget"
        nd.image = img
        for n in nt.nodes:
            n.select = False
        nd.select = True
        nt.nodes.active = nd


def bake(objs, img, kind, samples):
    bake_target(objs, img)
    select_only(objs)
    scene.cycles.samples = samples
    if kind == "albedo":
        bpy.ops.object.bake(type="DIFFUSE", pass_filter={"COLOR"}, margin=6, use_clear=True)
    else:
        bpy.ops.object.bake(type="DIFFUSE", pass_filter={"DIRECT", "INDIRECT"}, margin=6, use_clear=True)


def img_np(img):
    w, h = img.size
    a = np.empty(w * h * 4, dtype=np.float32)
    img.pixels.foreach_get(a)
    return a.reshape(h, w, 4)


def srgb_oetf(x):
    x = np.clip(x, 0, 1)
    return np.where(x <= 0.0031308, x * 12.92, 1.055 * np.power(x, 1 / 2.4) - 0.055)


def blur_masked(rgb, mask, radius=2):
    """Normalized Gaussian blur inside the baked islands only (no bleeding from empty space)."""
    k = np.exp(-0.5 * (np.arange(-radius * 2, radius * 2 + 1) / radius) ** 2).astype(np.float32)
    k /= k.sum()

    def conv(a, axis):
        out = np.zeros_like(a)
        n = len(k) // 2
        for i, kv in enumerate(k):
            out += kv * np.roll(a, i - n, axis=axis)
        return out
    m = mask[..., None].astype(np.float32)
    num = conv(conv(rgb * m, 0), 1)
    den = conv(conv(m, 0), 1)
    return np.where(den > 1e-4, num / np.maximum(den, 1e-4), rgb)


def save_png(arr01, path):
    from PIL import Image
    a = (np.clip(arr01, 0, 1) * 255 + 0.5).astype(np.uint8)
    Image.fromarray(a[::-1]).save(path)


A_SAMPLES = 2 if QUICK else 4
L_SAMPLES = 24 if QUICK else 384
results = {}
for name, objs, dens, lmdiv, role in GROUPS:
    w, h = sizes[name]
    t = time.time()
    alb = bpy.data.images.new(f"{name}_albedo", w, h, alpha=False, float_buffer=False)
    alb.colorspace_settings.name = "sRGB"
    set_metals(True)
    bake(objs, alb, "albedo", A_SAMPLES)
    set_metals(False)
    alb_path = os.path.join(WORK, f"{name}_albedo.png")
    alb.filepath_raw = alb_path
    alb.file_format = "PNG"
    alb.save()
    lw, lh = max(32, w // lmdiv), max(32, h // lmdiv)
    lm = bpy.data.images.new(f"{name}_light", lw, lh, alpha=True, float_buffer=True)
    lm.colorspace_settings.name = "Linear Rec.709"
    lm.generated_color = (0, 0, 0, 0)
    bake(objs, lm, "light", L_SAMPLES if role not in ("site",) else max(8, L_SAMPLES // 2))
    px = img_np(lm)
    mask = px[..., 3] > 0.5
    rgb = blur_masked(px[..., :3], mask, radius=1 if QUICK else 2)
    lum = (rgb * np.array([0.2126, 0.7152, 0.0722])).sum(-1)
    # 98th percentile: lamp and lantern hot spots clip, the rest keeps its 8-bit precision
    scale = float(np.percentile(lum[mask], 98.0)) if mask.any() else 1.0
    scale = max(scale, 1e-3) * 1.25
    enc = srgb_oetf(rgb / scale)
    lm_path = os.path.join(WORK, f"{name}_light.png")
    save_png(enc, lm_path)
    results[name] = (alb_path, lm_path, scale)
    log(f"baked {name}: albedo {w}x{h}, light {lw}x{lh}, scale {scale:.3f}, {time.time() - t:.0f}s")

# ------------------------------------------------------------------
# 5b. Floor order map: one value per board (or tile), so the site lays the floor board by board.
#     Same board maths as design_pass.planks(): front boards low, back boards high, a little random.
# ------------------------------------------------------------------
Y_SPAN = D_FT * FT                                      # street (0) to the back of the lanai


def order_material(kind, width=0.19, length=1.6, cell=0.05):
    m = bpy.data.materials.new(f"Order_{kind}_{width}_{length}")
    n, bsdf = dp.fresh(m)
    bsdf.inputs["Base Color"].default_value = (0, 0, 0, 1)
    co = n.xyz(dp.objcoord(n))
    u, v = co[0], co[1]
    if kind == "planks":
        row = n.math("FLOOR", n.math("DIVIDE", u, width))
        wn = n.new("ShaderNodeTexWhiteNoise")
        wn.noise_dimensions = "1D"
        n.link(row, wn.inputs["W"])
        rnd = wn.outputs["Value"]
        col = n.math("FLOOR", n.math("DIVIDE", n.math("ADD", v, n.math("MULTIPLY", rnd, length)), length))
        wn2 = n.new("ShaderNodeTexWhiteNoise")
        wn2.noise_dimensions = "2D"
        n.link(n.combine(row, col, 0), wn2.inputs["Vector"])
        jit = wn2.outputs["Value"]
        # board centre along y
        y = n.math("SUBTRACT", n.math("MULTIPLY", n.math("ADD", col, 0.5), length), n.math("MULTIPLY", rnd, length))
    else:                                               # tiles: one cell per tile
        cx = n.math("FLOOR", n.math("DIVIDE", u, cell))
        cy = n.math("FLOOR", n.math("DIVIDE", v, cell))
        wn2 = n.new("ShaderNodeTexWhiteNoise")
        wn2.noise_dimensions = "2D"
        n.link(n.combine(cx, cy, 0), wn2.inputs["Vector"])
        jit = wn2.outputs["Value"]
        y = n.math("MULTIPLY", n.math("ADD", cy, 0.5), cell)
    t = n.math("DIVIDE", y, Y_SPAN)
    order = n.math("ADD", n.math("MULTIPLY", t, 0.82), n.math("MULTIPLY", jit, 0.16), clamp=True)
    oc = n.new("ShaderNodeCombineColor")
    for i in range(3):
        n.link(order, oc.inputs[i])
    n.link(oc.outputs[0], bsdf.inputs["Emission Color"])
    bsdf.inputs["Emission Strength"].default_value = 1.0
    return m


ORDER_FOR = {"Oak_Floor": ("planks", 0.19, 1.6), "Deck_Wood": ("planks", 0.14, 2.4), "Bath_Tile": ("tiles",)}
fl = bpy.data.objects.get("G_Floors")
if fl:
    w, h = sizes["G_Floors"]
    saved = [sl.material for sl in fl.material_slots]
    for sl in fl.material_slots:
        k = ORDER_FOR.get(sl.material.name if sl.material else "", ("planks", 0.19, 1.6))
        sl.material = order_material(*k)
    om = bpy.data.images.new("G_Floors_order", w, h, alpha=False, float_buffer=False)
    om.colorspace_settings.name = "Non-Color"
    bake_target([fl], om)
    select_only([fl])
    scene.cycles.samples = 1
    bpy.ops.object.bake(type="EMIT", margin=2, use_clear=True)
    a = img_np(om)[..., 0]
    save_png(np.repeat(a[..., None], 3, -1), os.path.join(SITE, "assets", "floor_order.png"))
    for sl, mt in zip(fl.material_slots, saved):
        sl.material = mt
    log(f"floor order map {w}x{h}")

# ------------------------------------------------------------------
# 6. Sky panorama (world only), stored like the lightmaps
# ------------------------------------------------------------------
cam_data = bpy.data.cameras.new("PanoCam")
cam_data.type = "PANO"
cam_data.panorama_type = "EQUIRECTANGULAR"
pano = bpy.data.objects.new("PanoCam", cam_data)
scene.collection.objects.link(pano)
pano.location = Vector((25, 27, 14)) * FT
pano.rotation_euler = (math.radians(90), 0, 0)   # look along +y (the beach) at the image centre
scene.camera = pano
hidden = []
for o in bpy.data.objects:
    if o.type in ("MESH", "LIGHT") and not o.hide_render and o.name not in ("Sun_Golden", "Ocean"):
        o.hide_render = True
        hidden.append(o)
sun = bpy.data.objects.get("Sun_Golden")
if sun:
    sun.hide_render = True
    hidden.append(sun)
scene.render.resolution_x, scene.render.resolution_y = ((1024, 512) if QUICK else (4096, 2048))
scene.render.resolution_percentage = 100
scene.cycles.samples = 16 if QUICK else 64
scene.view_settings.view_transform = "Standard"
scene.view_settings.look = "None"
scene.view_settings.exposure = 0.0
scene.view_settings.use_curve_mapping = False
scene.render.image_settings.media_type = "IMAGE"        # Blender 5: the film left it on VIDEO
scene.render.image_settings.file_format = "OPEN_EXR"
scene.render.image_settings.color_depth = "32"
exr = os.path.join(WORK, "sky.exr")
scene.render.filepath = exr
bpy.ops.render.render(write_still=True)
sky = bpy.data.images.load(exr)
px = img_np(sky)[..., :3]
lum = (px * np.array([0.2126, 0.7152, 0.0722])).sum(-1)
sky_scale = float(np.percentile(lum, 99.995)) * 1.05      # headroom so the sun disc survives
# which way round is the panorama? The sun sits a little toward +x (SUN_AZ) from the view (+y).
sun_row, sun_col = np.unravel_index(np.argmax(np.where(np.arange(px.shape[0])[:, None] > px.shape[0] * 0.45,
                                                       lum, 0)), lum.shape)
sky_dir = 1 if sun_col > px.shape[1] / 2 else -1
log(f"sun at column {sun_col}/{px.shape[1]}, row {sun_row}/{px.shape[0]} -> sky_dir {sky_dir}")
from PIL import Image  # noqa: E402
a = (srgb_oetf(px / sky_scale) * 255 + 0.5).astype(np.uint8)[::-1]
Image.fromarray(a).save(os.path.join(SITE, "assets", "sky.webp"), quality=88, method=6)
for o in hidden:
    o.hide_render = False
log(f"sky panorama: scale {sky_scale:.3f}")

# ------------------------------------------------------------------
# 7. Baked materials, join, origins, export
# ------------------------------------------------------------------
def baked_material(name, alb_path, lm_path, scale):
    m = bpy.data.materials.new(f"Baked_{name}")
    m.use_nodes = True
    nt = m.node_tree
    for nd in list(nt.nodes):
        nt.nodes.remove(nd)
    out = nt.nodes.new("ShaderNodeOutputMaterial")
    b = nt.nodes.new("ShaderNodeBsdfPrincipled")
    nt.links.new(b.outputs[0], out.inputs[0])
    uvn = nt.nodes.new("ShaderNodeUVMap")
    uvn.uv_map = "Bake"
    ta = nt.nodes.new("ShaderNodeTexImage")
    ta.image = bpy.data.images.load(alb_path)
    tl = nt.nodes.new("ShaderNodeTexImage")
    tl.image = bpy.data.images.load(lm_path)
    tl.image.colorspace_settings.name = "sRGB"
    nt.links.new(uvn.outputs[0], ta.inputs[0])
    nt.links.new(uvn.outputs[0], tl.inputs[0])
    nt.links.new(ta.outputs["Color"], b.inputs["Base Color"])
    nt.links.new(tl.outputs["Color"], b.inputs["Emission Color"])
    b.inputs["Emission Strength"].default_value = 1.0
    b.inputs["Roughness"].default_value = 1.0
    m["lm_scale"] = scale
    m["baked"] = 1
    return m


def origin_to_bottom(o):
    # matrix_basis, not matrix_world: matrix_world is only refreshed on a depsgraph update, so right
    # after setting a location it is stale (that put every furniture piece off by the group origin)
    mw = o.matrix_basis.copy()
    vs = [mw @ v.co for v in o.data.vertices]
    org = Vector(((min(v.x for v in vs) + max(v.x for v in vs)) / 2,
                  (min(v.y for v in vs) + max(v.y for v in vs)) / 2, min(v.z for v in vs)))
    o.data.transform(mw)
    o.matrix_basis = Matrix.Identity(4)
    o.data.transform(Matrix.Translation(-org))
    o.location = org


def split_pieces(o, pieces):
    """Split a baked, joined group back into its original pieces (face attribute 'piece').
    Each piece keeps the shared baked material and UVs, gets its own name and a bottom-centre
    origin, so it can pop up from where it stands."""
    out = []
    for idx, nm in pieces:
        me = o.data.copy()
        bm = bmesh.new()
        bm.from_mesh(me)
        layer = bm.faces.layers.int.get("piece")
        bmesh.ops.delete(bm, geom=[f for f in bm.faces if f[layer] != idx], context="FACES")
        bmesh.ops.delete(bm, geom=[v for v in bm.verts if not v.link_faces], context="VERTS")
        if not bm.faces:
            bm.free()
            bpy.data.meshes.remove(me)
            continue
        bm.to_mesh(me)
        bm.free()
        if "piece" in me.attributes:
            me.attributes.remove(me.attributes["piece"])
        p = bpy.data.objects.new("Furn_" + nm, me)
        p.matrix_basis = o.matrix_basis.copy()
        o.users_collection[0].objects.link(p)
        origin_to_bottom(p)
        p["baked"] = 1
        out.append(p)
    bpy.data.objects.remove(o, do_unlink=True)
    log(f"split into {len(out)} pieces")
    return out


export = []
for name, objs, dens, lmdiv, role in GROUPS:
    alb_path, lm_path, scale = results[name]
    m = baked_material(name, alb_path, lm_path, scale)
    for o in objs:
        o.data.materials.clear()
        o.data.materials.append(m)
        for l in [l for l in o.data.uv_layers if l.name != "Bake"]:
            o.data.uv_layers.remove(l)
        o.modifiers.clear()
    if role == "door":
        o = objs[0]                                  # keep the hinge origin
    else:
        select_only(objs)
        if len(objs) > 1:
            bpy.ops.object.join()
        o = bpy.context.view_layer.objects.active
        o.name = name
        origin_to_bottom(o)
    for k in list(o.keys()):
        del o[k]
    if role:
        o["role"] = role
    o["baked"] = 1
    if name in PIECES:
        export += split_pieces(o, PIECES[name])
        continue
    export.append(o)

# window glass: one object (rises with the walls), except the rear slider, which the site animates
SLIDER = "Ext_Rear_slider2"
panes = [o for o in glass if o.name != SLIDER]
slider_obj = {o for o in glass if o.name == SLIDER}
if panes:
    select_only(panes)
    bpy.ops.object.make_single_user(type="SELECTED_OBJECTS", object=True, obdata=True)
    bpy.ops.object.convert(target="MESH")
    me = bpy.data.meshes.new("G_Glass")
    host = bpy.data.objects.new("G_Glass", me)
    panes[0].users_collection[0].objects.link(host)
    select_only(panes + [host], active=host)
    bpy.ops.object.join()
    host = bpy.context.view_layer.objects.active
    host.name = "G_Glass"
    origin_to_bottom(host)
    glass = {host} | slider_obj
for o in list(glass) + [bpy.data.objects.get("Ocean"), plan]:
    if o:
        export.append(o)
        if o.name == "Ocean":
            o["role"] = "site"
            o.data.materials[0].name = "Ocean"
        if o.name == "Plan_On_Site":
            o["role"] = "site"
            o.hide_render = False
for o in glass:
    for s in o.material_slots:
        if s.material and not s.material.name.startswith("Glass"):
            s.material.name = "Glass_" + s.material.name

blend_out = os.path.join(WORK, "cottage_baked.blend")
bpy.ops.wm.save_as_mainfile(filepath=blend_out)
select_only(export)
glb = os.path.join(SITE, "assets", "model.glb")
bpy.ops.export_scene.gltf(filepath=glb, export_format="GLB", use_selection=True, export_extras=True,
                          export_image_format="WEBP", export_image_quality=82, export_apply=True,
                          export_lights=False, export_cameras=False, export_yup=True,
                          export_animations=False, export_normals=False)
log(f"exported {glb}: {os.path.getsize(glb) / 1e6:.1f} MB, {len(export)} objects")
with open(os.path.join(SITE, "assets", "bake.json"), "w") as f:
    import json
    json.dump({"sky_scale": sky_scale, "sky_dir": sky_dir, "groups": {k: v[2] for k, v in results.items()},
               "quick": QUICK}, f, indent=1)
log("done")
