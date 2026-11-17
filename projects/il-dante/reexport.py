"""Re-export the site models from the baked .blend without baking again (after a small fix).
Today: give the far ground plane a flat daylight lightmap (its bake came out unlit)."""
import os, subprocess, sys, json
import bpy
import numpy as np
A = sys.argv
WORK = A[A.index("--work") + 1]; SITE = A[A.index("--site") + 1]
bpy.ops.wm.open_mainfile(filepath=os.path.join(WORK, "il_dante_baked.blend"))
m = bpy.data.materials["Baked_G_Far"]
lm = next(n.image for n in m.node_tree.nodes if n.type == "TEX_IMAGE" and "light" in n.image.name)
w, h = lm.size
lm.pixels.foreach_set(np.full(w * h * 4, 0.9, dtype=np.float32))
lm.update(); lm.filepath_raw = os.path.join(WORK, "G_Far_light_flat.png"); lm.file_format = "PNG"; lm.save()
m["lm_scale"] = 18.0
far = bpy.data.objects["G_Far"]
if far.data.polygons[0].normal.z < 0:          # normals_make_consistent flipped the lone quad down
    far.data.flip_normals()
    print("flipped G_Far up")
export = [o for o in bpy.data.objects if o.type == "MESH" and (o.get("baked") or o.name == "Ocean" or o.users_collection[0].name == "Glass")]
print("exporting", len(export))
def sel():
    for o in bpy.context.view_layer.objects: o.select_set(False)
    for o in export: o.select_set(True)
    bpy.context.view_layer.objects.active = export[0]
def exp(path, q):
    sel()
    bpy.ops.export_scene.gltf(filepath=path, export_format="GLB", use_selection=True, export_extras=True,
                              export_image_format="WEBP", export_image_quality=q, export_apply=True,
                              export_lights=False, export_cameras=False, export_yup=True,
                              export_animations=False, export_normals=False)
    subprocess.run(["npx", "--yes", "@gltf-transform/cli@4.1.1", "draco", path, path + ".d.glb", "--quantize-position", "14",
                    "--quantize-texcoord", "14"], check=True, capture_output=True)
    os.replace(path + ".d.glb", path)
    print("exported", path, round(os.path.getsize(path) / 1e6, 1), "MB")
exp(os.path.join(SITE, "assets", "model.glb"), 82)
for img in bpy.data.images:
    if img.size[0] > 64 and img.filepath:
        img.scale(max(32, img.size[0] // 2), max(32, img.size[1] // 2))
exp(os.path.join(SITE, "assets", "model_mobile.glb"), 80)
b = json.load(open(os.path.join(SITE, "assets", "bake.json"))); b["groups"]["G_Far"] = 18.0
json.dump(b, open(os.path.join(SITE, "assets", "bake.json"), "w"), indent=1)
