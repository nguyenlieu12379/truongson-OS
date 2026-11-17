"""Google 3D Tiles (from fetch_tiles.py) -> one Blender scene in local metres -> web models.

Run with the bpy module:
  python tiles_to_blend.py --tiles tiles/ --blend work/haulover.blend --site ../../websites/.../assets

- Imports every .glb. Blender's glTF importer turns glTF's y-up into z-up, which is exactly the 3D Tiles
  convention, so the imported vertices sit in ECEF (earth-centred metres).
- Moves everything into a local frame at the venue: x = east, y = north, z = up (ENU), then drops it so
  the ground at the venue is z = 0.
- Crops to --keep metres around the venue (tiles overhang their area), joins per tile, cleans doubles.
- Tags every material as a photo texture (extras.photo = true): the web engine shows those unlit with
  their own colours (the light is in the photos already; no bake).
- Exports model.glb (textures max --tex px, WebP) and model_mobile.glb (half), Draco-compressed with
  gltf-transform, plus tiles_credit.json with Google's required data attributions.
"""
import argparse
import glob
import json
import math
import os
import subprocess
import sys

import bpy  # first: makes bmesh and mathutils importable
import bmesh
from mathutils import Matrix, Vector

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from fetch_tiles import ecef, enu_basis  # noqa: E402


def arg(n, d=None):
    a = sys.argv
    return a[a.index(n) + 1] if n in a else d


TILES = arg("--tiles")
BLEND = arg("--blend")
SITE = arg("--site")
KEEP = float(arg("--keep", "220"))
TEX = int(arg("--tex", "1024"))
PREVIEW = arg("--preview")          # top-down texture render, to find the venue in a coarse download
man = json.load(open(os.path.join(TILES, "manifest.json")))

bpy.ops.wm.read_factory_settings(use_empty=True)
P = Vector(ecef(man["lat"], man["lon"], man["height"]))
e, n, u = enu_basis(man["lat"], man["lon"])
R = Matrix((e, n, u)).to_4x4()                          # ECEF direction -> ENU
TO_LOCAL = R @ Matrix.Translation(-P)

objs = []
for t in man["tiles"]:
    before = set(bpy.data.objects)
    bpy.ops.import_scene.gltf(filepath=os.path.join(TILES, t["file"]))
    new = [o for o in bpy.data.objects if o not in before and o.type == "MESH"]
    for o in new:
        mw = o.matrix_world.copy()
        o.parent = None
        o.matrix_world = TO_LOCAL @ mw
    objs += new
print(f"imported {len(objs)} meshes from {len(man['tiles'])} tiles")
# apply transforms so vertices are local metres
for o in bpy.data.objects:
    if o.type != "MESH":
        bpy.data.objects.remove(o, do_unlink=True)
bpy.ops.object.select_all(action="SELECT")
bpy.context.view_layer.objects.active = objs[0]
bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)

# ground: a low percentile of the surface heights within 15 m of the venue (walls, roofs and trees
# would pull a median up; the ground is the lowest broad surface)
zs = []
for o in objs:
    for v in o.data.vertices:
        if v.co.x * v.co.x + v.co.y * v.co.y < 15 * 15:
            zs.append(v.co.z)
z0 = sorted(zs)[len(zs) // 8] if zs else 0.0
print(f"ground at the venue: {z0:.2f} m in the tile frame")

# crop, drop below-ground junk, shift to ground 0
for o in objs:
    bm = bmesh.new()
    bm.from_mesh(o.data)
    bmesh.ops.translate(bm, verts=bm.verts, vec=(0, 0, -z0))
    far = [f for f in bm.faces if f.calc_center_median().xy.length > KEEP]
    bmesh.ops.delete(bm, geom=far, context="FACES")
    bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=0.002)
    bm.to_mesh(o.data)
    bm.free()
objs = [o for o in objs if len(o.data.polygons)]
for o in list(bpy.data.objects):
    if o.type == "MESH" and not len(o.data.polygons):
        bpy.data.objects.remove(o, do_unlink=True)
for i, o in enumerate(objs):
    o.name = f"Tile_{i:03d}"
    for m in o.data.materials:
        if m:
            m["photo"] = True
print(f"kept {len(objs)} meshes, {sum(len(o.data.polygons) for o in objs)} faces within {KEEP:.0f} m")
os.makedirs(os.path.dirname(os.path.abspath(BLEND)), exist_ok=True)
bpy.ops.wm.save_as_mainfile(filepath=BLEND)

if PREVIEW:
    sc = bpy.context.scene
    cam = bpy.data.objects.new("Top", bpy.data.cameras.new("Top"))
    sc.collection.objects.link(cam)
    cam.data.type = "ORTHO"
    cam.data.ortho_scale = KEEP * 2
    cam.location = (0, 0, 500)
    cam.data.clip_end = 2000
    sc.camera = cam
    # Cycles on the CPU (Workbench needs a GPU): bright flat sky light, a few samples, enough to read
    sc.render.engine = "CYCLES"
    sc.cycles.device = "CPU"
    sc.cycles.samples = 4
    w = bpy.data.worlds.new("Flat")
    sc.world = w
    w.use_nodes = True
    w.node_tree.nodes["Background"].inputs[1].default_value = 1.6
    sc.view_settings.view_transform = "Standard"
    sc.render.resolution_x = sc.render.resolution_y = 1600
    sc.render.filepath = PREVIEW
    bpy.ops.render.render(write_still=True)
    bpy.data.objects.remove(cam, do_unlink=True)
    print(f"preview {PREVIEW} (north up, east right, {KEEP * 2:.0f} m across, venue at the centre)")


def shrink_images(limit):
    for img in bpy.data.images:
        if img.size[0] > limit or img.size[1] > limit:
            s = limit / max(img.size)
            img.scale(max(16, int(img.size[0] * s)), max(16, int(img.size[1] * s)))


def export(path, quality):
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.export_scene.gltf(filepath=path, export_format="GLB", use_selection=True, export_extras=True,
                              export_image_format="WEBP", export_image_quality=quality, export_apply=True,
                              export_lights=False, export_cameras=False, export_yup=True,
                              export_animations=False, export_normals=False)
    tmp = path + ".d.glb"
    subprocess.run(["npx", "--yes", "@gltf-transform/cli@4.1.1", "draco", path, tmp, "--quantize-position", "14",
                    "--quantize-texcoord", "14"], check=True, capture_output=True)
    os.replace(tmp, path)
    print(f"exported {path}: {os.path.getsize(path) / 1e6:.1f} MB")


if SITE:
    os.makedirs(SITE, exist_ok=True)
    shrink_images(TEX)
    export(os.path.join(SITE, "model.glb"), 80)
    shrink_images(TEX // 2)
    export(os.path.join(SITE, "model_mobile.glb"), 76)
    with open(os.path.join(SITE, "tiles_credit.json"), "w") as fh:
        json.dump({"copyright": man["copyright"]}, fh)
