"""Download the free CC0 textures and sky (Poly Haven) the scene uses into ./textures (not in git)."""
import json, os, ssl, urllib.request
HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "textures")
TEX = {"floor": "laminate_floor_02", "oak": "oak_veneer_01", "plaster_in": "painted_plaster_wall", "stucco": "white_stucco",
       "subway": "long_white_tiles", "asphalt": "asphalt_02", "pavers": "concrete_pavers", "grass": "leafy_grass",
       "sand": "coast_sand_01", "bark": "bark_brown_02", "concrete": "concrete_pavement"}
SKY = "kloofendal_43d_clear_puresky"
ca = "/root/.ccr/ca-bundle.crt"
ctx = ssl.create_default_context(cafile=ca if os.path.exists(ca) else None)


def get(u):
    return urllib.request.urlopen(urllib.request.Request(u, headers={"User-Agent": "truongson-walkthrough"}), context=ctx, timeout=60).read()


os.makedirs(OUT, exist_ok=True)
for key, aid in TEX.items():
    files = json.loads(get(f"https://api.polyhaven.com/files/{aid}"))
    for mapname, out in (("Diffuse", "diff"), ("nor_gl", "nor"), ("Rough", "rough")):
        fn = os.path.join(OUT, f"{key}_{out}.jpg")
        if not os.path.exists(fn):
            open(fn, "wb").write(get(files[mapname]["2k"]["jpg"]["url"]))
if not os.path.exists(os.path.join(OUT, "sky.hdr")):
    open(os.path.join(OUT, "sky.hdr"), "wb").write(get(json.loads(get(f"https://api.polyhaven.com/files/{SKY}"))["hdri"]["4k"]["hdr"]["url"]))
print("textures in", OUT)
