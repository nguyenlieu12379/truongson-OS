"""Bake the Il Dante block for the live-3D site (the cottage's method, see the 3d-walkthrough skill's
references/baking.md): per bake group an albedo texture and an HDR lightmap, a sky panorama, then
model.glb / model_mobile.glb (Draco) + sky.webp + bake.json.

Run:  python bake_scene.py --blend work/il_dante.blend --site <site dir> [--quick]
"""
import json
import math
import os
import subprocess
import sys
import time

import bpy
import bmesh  # noqa: F401
import numpy as np
from mathutils import Matrix, Vector

A = sys.argv
QUICK = "--quick" in A


def arg(n, d=None):
    return A[A.index(n) + 1] if n in A else d


BLEND = os.path.abspath(arg("--blend"))
SITE = os.path.abspath(arg("--site"))
WORK = os.path.abspath(arg("--work", os.path.join(os.path.dirname(BLEND), "bake")))
os.makedirs(WORK, exist_ok=True)
os.makedirs(os.path.join(SITE, "assets"), exist_ok=True)
FT = 0.3048
T0 = time.time()


def log(*a):
    print(f"[bake {time.time() - T0:7.1f}s]", *a, flush=True)


bpy.ops.wm.open_mainfile(filepath=BLEND)
scene = bpy.context.scene
scene.render.engine = "CYCLES"
scene.cycles.device = "CPU"


def objs_in(c):
    col = bpy.data.collections.get(c)
    return [o for o in col.all_objects if o.type == "MESH"] if col else []


def select_only(objs, active=None):
    bpy.ops.object.mode_set(mode="OBJECT") if bpy.context.object and bpy.context.object.mode != "OBJECT" else None
    for o in bpy.context.view_layer.objects:
        o.select_set(False)
    for o in objs:
        o.select_set(True)
    bpy.context.view_layer.objects.active = active or (objs[0] if objs else None)


# glass lets the daylight in during the bake (it renders as clear glass on the site)
for m in bpy.data.materials:
    if m.name.startswith("Glass_") and m.node_tree:
        for nd in m.node_tree.nodes:
            if nd.type == "BSDF_PRINCIPLED":
                nd.inputs["Transmission Weight"].default_value = 1.0
                nd.inputs["Roughness"].default_value = 0.0
                if nd.inputs["Base Color"].is_linked:
                    m.node_tree.links.remove(nd.inputs["Base Color"].links[0])
                nd.inputs["Base Color"].default_value = (0.95, 0.97, 0.98, 1)

# far ground, so the land beyond the block isn't the sky's black underside
me = bpy.data.meshes.new("Far_Ground")
me.from_pydata([(-6000 * FT, -6000 * FT, -0.4 * FT), (480 * FT, -6000 * FT, -0.4 * FT),
                (480 * FT, 6000 * FT, -0.4 * FT), (-6000 * FT, 6000 * FT, -0.4 * FT)], [], [(0, 1, 2, 3)])
fg = bpy.data.materials.new("Far_City")
fg.use_nodes = True
fg.node_tree.nodes["Principled BSDF"].inputs["Base Color"].default_value = (0.30, 0.30, 0.28, 1)
me.materials.append(fg)
far = bpy.data.objects.new("Far_Ground", me)
bpy.data.collections["Site"].objects.link(far)

# group, objects, px per metre, lightmap divisor, role, kind
GROUPS = [
    ("G_Interior", objs_in("Interior"), 70, 3, None, "box"),
    ("G_Furn", objs_in("Furn"), 90, 3, None, "box"),
    ("G_Bldg", objs_in("Bldg"), 26, 2, None, "box"),
    ("G_Street", objs_in("Street"), 16, 2, "site", "box"),
    ("G_Park", objs_in("Park"), 7, 2, "site", "foliage"),
    ("G_Beach", objs_in("Beach"), 3, 1, "site", "box"),
    ("G_Far", [far], 0.0015, 1, "site", "box"),
    ("G_Neighbors", objs_in("Neighbors"), 11, 2, "site", "box"),
    ("G_Props", objs_in("Props"), 26, 2, "site", "box"),
    ("G_Trees", objs_in("Trees"), 12, 2, "site", "foliage"),
    ("Cafe_Door", objs_in("Door"), 60, 3, "door", "box"),
]
GROUPS = [g for g in GROUPS if g[1]]
glass = objs_in("Glass")
ocean = bpy.data.objects.get("Ocean")
log("groups", [(g[0], len(g[1])) for g in GROUPS])

allg = [o for g in GROUPS for o in g[1]]
select_only(allg)
bpy.ops.object.make_single_user(type="SELECTED_OBJECTS", object=True, obdata=True)
bpy.ops.object.convert(target="MESH")

# the door keeps its hinge: origin on its west stile, bottom
door = bpy.data.objects.get("Cafe_Door")
if door:
    mw = door.matrix_basis.copy()
    door.data.transform(mw)
    door.matrix_basis = Matrix.Identity(4)
    hinge = Vector((-39.85, -0.15, 0.0)) * FT
    door.data.transform(Matrix.Translation(-hinge))
    door.location = hinge

joined = []
for name, objs, dens, lmdiv, role, kind in GROUPS:
    if role == "door":
        joined.append((name, objs, dens, lmdiv, role, kind))
        continue
    host = bpy.data.objects.new(name, bpy.data.meshes.new(name))
    objs[0].users_collection[0].objects.link(host)
    select_only(objs + [host], active=host)
    bpy.ops.object.join()
    host = bpy.context.view_layer.objects.active
    host.name = name
    if kind == "foliage" and name == "G_Trees":
        dm = host.modifiers.new("Dec", "DECIMATE")
        dm.ratio = 0.5
        select_only([host])
        bpy.ops.object.modifier_apply(modifier=dm.name)
    # consistent outward normals: a face that points into a wall bakes black (no light reaches its side)
    select_only([host])
    bpy.ops.object.mode_set(mode="EDIT")
    bpy.ops.mesh.select_all(action="SELECT")
    bpy.ops.mesh.normals_make_consistent(inside=False)
    bpy.ops.object.mode_set(mode="OBJECT")
    if name == "G_Far" and host.data.polygons[0].normal.z < 0:   # a lone quad has no inside: keep it up
        host.data.flip_normals()
    joined.append((name, [host], dens, lmdiv, role, kind))
GROUPS = joined
log("joined", [(g[0], len(g[1][0].data.polygons)) for g in GROUPS])


def surface_area(objs):
    a = 0.0
    for o in objs:
        m = o.matrix_world
        for p in o.data.polygons:
            vs = [m @ o.data.vertices[i].co for i in p.vertices]
            for k in range(1, len(vs) - 1):
                a += ((vs[k] - vs[0]).cross(vs[k + 1] - vs[0])).length / 2
    return a


def pow2(n, lo, hi=4096):
    return int(min(hi, max(lo, 2 ** round(math.log2(max(n, 1))))))


sizes = {}
for name, objs, dens, lmdiv, role, kind in GROUPS:
    for o in objs:
        me = o.data
        uv = me.uv_layers.get("Bake") or me.uv_layers.new(name="Bake")
        for l in me.uv_layers:
            if l.name != "Bake":
                l.active_render = True
                break
        me.uv_layers.active = uv
    area = surface_area(objs)
    s = pow2(math.sqrt(area / 0.55) * dens * (0.3 if QUICK else 1.0), 512 if QUICK else (2048 if kind != "box" or name in ("G_Furn", "G_Props", "G_Neighbors", "G_Bldg") else 256))
    sizes[name] = s
    select_only(objs)
    bpy.ops.object.mode_set(mode="EDIT")
    bpy.ops.mesh.select_all(action="SELECT")
    bpy.ops.uv.smart_project(angle_limit=math.radians(80 if kind == "foliage" else 60), island_margin=0.0,
                             area_weight=0.0, correct_aspect=True, scale_to_bounds=False)
    bpy.ops.uv.select_all(action="SELECT")
    bpy.ops.uv.pack_islands(udim_source="CLOSEST_UDIM", rotate=True, margin_method="FRACTION",
                            shape_method="AABB" if kind == "box" else "CONCAVE",
                            margin=(1.0 if kind == "box" else 2.0) / s)
    bpy.ops.object.mode_set(mode="OBJECT")
    log(f"uv {name}: {area:.0f} m2 -> {s}px")

DEFAULT_M = bpy.data.materials.new("Bake_Default")
DEFAULT_M.use_nodes = True
METALS = {}
for m in bpy.data.materials:
    if m.node_tree:
        for nd in m.node_tree.nodes:
            if nd.type == "BSDF_PRINCIPLED" and not nd.inputs["Metallic"].is_linked and nd.inputs["Metallic"].default_value > 0:
                METALS[(m.name, nd.name)] = nd.inputs["Metallic"].default_value


def set_metals(zero):
    for (mn, nn), v in METALS.items():
        bpy.data.materials[mn].node_tree.nodes[nn].inputs["Metallic"].default_value = 0.0 if zero else v


def bake_target(objs, img):
    for o in objs:
        if not o.material_slots or not any(s.material for s in o.material_slots):
            o.data.materials.clear()
            o.data.materials.append(DEFAULT_M)
    for m in {s.material for o in objs for s in o.material_slots if s.material}:
        m.use_nodes = True
        nt = m.node_tree
        nd = nt.nodes.get("BakeTarget") or nt.nodes.new("ShaderNodeTexImage")
        nd.name = "BakeTarget"
        nd.image = img
        for n_ in nt.nodes:
            n_.select = False
        nd.select = True
        nt.nodes.active = nd


def img_np(img):
    w, h = img.size
    a = np.empty(w * h * 4, dtype=np.float32)
    img.pixels.foreach_get(a)
    return a.reshape(h, w, 4)


def srgb_oetf(x):
    x = np.clip(x, 0, 1)
    return np.where(x <= 0.0031308, x * 12.92, 1.055 * np.power(x, 1 / 2.4) - 0.055)


def blur_masked(rgb, mask, radius=2):
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
    Image.fromarray((np.clip(arr01, 0, 1) * 255 + 0.5).astype(np.uint8)[::-1]).save(path)


scene.render.bake.margin_type = "EXTEND"
L_SAMPLES = 24 if QUICK else 320
results = {}
for name, objs, dens, lmdiv, role, kind in GROUPS:
    s = sizes[name]
    t = time.time()
    alb = bpy.data.images.new(f"{name}_albedo", s, s, alpha=False)
    alb.colorspace_settings.name = "sRGB"
    set_metals(True)
    bake_target(objs, alb)
    select_only(objs)
    scene.cycles.samples = 2 if QUICK else 4
    bpy.ops.object.bake(type="DIFFUSE", pass_filter={"COLOR"}, margin=6, use_clear=True)
    set_metals(False)
    ap = os.path.join(WORK, f"{name}_albedo.png")
    alb.filepath_raw, alb.file_format = ap, "PNG"
    alb.save()
    lw = max(32, s // lmdiv)
    lm = bpy.data.images.new(f"{name}_light", lw, lw, alpha=True, float_buffer=True)
    lm.colorspace_settings.name = "Linear Rec.709"
    lm.generated_color = (0, 0, 0, 0)
    bake_target(objs, lm)
    select_only(objs)
    scene.cycles.samples = L_SAMPLES if role is None or role == "door" else max(8, L_SAMPLES // 2)
    bpy.ops.object.bake(type="DIFFUSE", pass_filter={"DIRECT", "INDIRECT"}, margin=6, use_clear=True)
    px = img_np(lm)
    mask = px[..., 3] > 0.5
    rgb = blur_masked(px[..., :3], mask, radius=1 if QUICK else 2)
    lum = (rgb * np.array([0.2126, 0.7152, 0.0722])).sum(-1)
    scale = float(np.percentile(lum[mask], 98)) * 1.25 if mask.any() else 1.0
    scale = max(scale, 1e-3)
    lp = os.path.join(WORK, f"{name}_light.png")
    save_png(srgb_oetf(rgb / scale), lp)
    results[name] = (ap, lp, scale)
    log(f"baked {name}: {s}px, light {lw}px, scale {scale:.3f}, {time.time() - t:.0f}s")

# ---------------------------------------------------------------- sky panorama (world + ocean only)
want = Vector(scene["sun_dir"])
cam = bpy.data.objects.new("Pano", bpy.data.cameras.new("Pano"))
cam.data.type = "PANO"
try:
    cam.data.panorama_type = "EQUIRECTANGULAR"
except Exception:
    cam.data.cycles.panorama_type = "EQUIRECTANGULAR"
scene.collection.objects.link(cam)
cam.location = Vector((-37, 20, 6)) * FT
cam.rotation_euler = (math.radians(90), 0, 0)
scene.camera = cam
hidden = [o for o in bpy.data.objects if o.type in ("MESH", "LIGHT") and o.name != "Ocean" and not o.hide_render]
for o in hidden:
    o.hide_render = True
res = (1024, 512) if QUICK else (4096, 2048)
scene.render.resolution_x, scene.render.resolution_y = res
scene.render.resolution_percentage = 100
scene.cycles.samples = 16 if QUICK else 64
vs = scene.view_settings
vs.view_transform, vs.look, vs.exposure = "Standard", "None", 0.0
scene.render.image_settings.media_type = "IMAGE"
scene.render.image_settings.file_format = "OPEN_EXR"
scene.render.image_settings.color_depth = "32"
skynode = next((n_ for n_ in scene.world.node_tree.nodes if n_.type == "TEX_SKY"), None)   # None: an HDRI sky


def render_sky():
    exr = os.path.join(WORK, "sky.exr")
    scene.render.filepath = exr
    bpy.ops.render.render(write_still=True)
    img = bpy.data.images.load(exr, check_existing=False)
    px = img_np(img)[..., :3]
    bpy.data.images.remove(img)
    return px


def sun_in(px):
    lum = (px * np.array([0.2126, 0.7152, 0.0722])).sum(-1)
    r, c = np.unravel_index(np.argmax(lum), lum.shape)
    h, w = lum.shape
    return (c / w - 0.5) * 2 * math.pi, (r / h - 0.5) * math.pi, lum     # longitude from +y, latitude


px = render_sky()
lon, lat, lum = sun_in(px)
# where the sun should be: longitude from +y. Try both handednesses of the equirect mapping and
# turn the sky texture's sun so the panorama agrees with the lamp (the lamp lights the bake).
target = math.atan2(want.x, want.y)
err_pos, err_neg = (lon - target + math.pi) % (2 * math.pi) - math.pi, (-lon - target + math.pi) % (2 * math.pi) - math.pi
handed = 1 if abs(err_pos) < abs(err_neg) else -1
log(f"panorama sun at lon {math.degrees(lon):.0f}, lat {math.degrees(lat):.0f}; lamp at {math.degrees(target):.0f}")
off = (handed * lon) - target
if skynode and abs(off) > math.radians(3):
    skynode.sun_rotation = skynode.sun_rotation - handed * off
    px = render_sky()
    lon, lat, lum = sun_in(px)
    log(f"turned the sky's sun by {math.degrees(-handed * off):.0f} deg -> now at {math.degrees(lon):.0f}")
sky_scale = float(np.percentile(lum, 99.995)) * 1.05
# engine: uv.x = 0.5 + dir * atan(bx, by) / 2pi. The sun's image column is 0.5 + lon/2pi.
sky_dir = 1 if (lon * target) >= 0 else -1
from PIL import Image  # noqa: E402
Image.fromarray((srgb_oetf(px / sky_scale) * 255 + 0.5).astype(np.uint8)[::-1]).save(
    os.path.join(SITE, "assets", "sky.webp"), quality=88, method=6)
for o in hidden:
    o.hide_render = False
log(f"sky: scale {sky_scale:.3f}, dir {sky_dir}")


# ---------------------------------------------------------------- baked materials, export
def baked_material(name, ap, lp, scale):
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
    ta.image = bpy.data.images.load(ap)
    tl = nt.nodes.new("ShaderNodeTexImage")
    tl.image = bpy.data.images.load(lp)
    nt.links.new(uvn.outputs[0], ta.inputs[0])
    nt.links.new(uvn.outputs[0], tl.inputs[0])
    nt.links.new(ta.outputs["Color"], b.inputs["Base Color"])
    nt.links.new(tl.outputs["Color"], b.inputs["Emission Color"])
    b.inputs["Emission Strength"].default_value = 1.0
    m["lm_scale"] = scale
    m["baked"] = 1
    return m


export = []
for name, objs, dens, lmdiv, role, kind in GROUPS:
    bm_ = baked_material(name, *results[name])
    for o in objs:
        for sl in o.material_slots:
            if not (sl.material and sl.material.name.startswith("Glass_")):
                sl.material = bm_
        for l in list(o.data.uv_layers):
            if l.name != "Bake":
                o.data.uv_layers.remove(l)
        o.modifiers.clear()
        for k in list(o.keys()):
            del o[k]
        if role:
            o["role"] = role
        o["baked"] = 1
        export.append(o)
for o in glass:
    export.append(o)
if ocean:
    ocean["role"] = "site"
    export.append(ocean)
select_only(export)
bpy.ops.object.make_single_user(type="SELECTED_OBJECTS", object=True, obdata=True)
bpy.ops.object.convert(target="MESH")
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(WORK, "il_dante_baked.blend"))


def export_glb(path, q):
    select_only(export)
    bpy.ops.export_scene.gltf(filepath=path, export_format="GLB", use_selection=True, export_extras=True,
                              export_image_format="WEBP", export_image_quality=q, export_apply=True,
                              export_lights=False, export_cameras=False, export_yup=True,
                              export_animations=False, export_normals=False)
    tmp = path + ".d.glb"
    subprocess.run(["npx", "--yes", "@gltf-transform/cli@4.1.1", "draco", path, tmp, "--quantize-position", "14",
                    "--quantize-texcoord", "14"], check=True, capture_output=True)
    os.replace(tmp, path)
    log(f"exported {os.path.basename(path)}: {os.path.getsize(path) / 1e6:.1f} MB")


export_glb(os.path.join(SITE, "assets", "model.glb"), 82)
for img in bpy.data.images:
    if img.filepath and os.path.abspath(bpy.path.abspath(img.filepath)).startswith(WORK) and img.size[0] > 64:
        img.scale(max(32, img.size[0] // 2), max(32, img.size[1] // 2))
export_glb(os.path.join(SITE, "assets", "model_mobile.glb"), 80)
Image.open(os.path.join(SITE, "assets", "sky.webp")).resize((2048, 1024), Image.LANCZOS).save(
    os.path.join(SITE, "assets", "sky_mobile.webp"), quality=86, method=6)
with open(os.path.join(SITE, "assets", "bake.json"), "w") as fh:
    json.dump({"sky_scale": sky_scale, "sky_dir": sky_dir, "groups": {k: v[2] for k, v in results.items()},
               "quick": QUICK}, fh, indent=1)
log("done")
