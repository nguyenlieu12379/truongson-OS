"""Export the page's images. Run from the build folder after lab/cut.py: python lab/prep.py
Pans are rectangular crops of their own buffet photos (box as fractions of the photo), 4:3."""
import json, cv2, numpy as np
from PIL import Image

G = "assets/source/google/g%s.jpg"
OUT = "assets/%s.webp"

def save(im, name, maxw, q=80):
    im = im.copy(); im.thumbnail((maxw, maxw * 3)); im.save(OUT % name, quality=q, method=6); return im.size

sizes = {}
# the three pão de queijo, one file each (the hero trio is laid out from their source offsets)
cut = Image.open("lab/cuts/pdq.png"); bx = json.load(open("lab/cuts.json"))["pdq"]["box"]
ELL = ((354, 252, 375, 469, 75), (668, 375, 380, 408, 100), (398, 723, 367, 422, 137))
a = np.array(cut)
balls = []
for i, (cx, cy, ax, ay, ang) in enumerate(ELL):
    m = np.zeros(a.shape[:2], "uint8"); cv2.ellipse(m, ((cx + 7 - bx[0], cy - 7 - bx[1]), (ax + 30, ay + 30), ang), 255, -1)
    b = a.copy(); b[..., 3] = np.minimum(b[..., 3], m)
    im = Image.fromarray(b); box = im.getbbox(); im = im.crop(box)
    im.save(OUT % f"pdq{i+1}", quality=84, method=6)
    balls.append({"x": box[0], "y": box[1], "w": im.width, "h": im.height})
sizes["trio"] = {"w": cut.width, "h": cut.height, "balls": balls}
sizes["empadas"] = save(Image.open("lab/cuts/empadas.png"), "empadas", 760, 82)

def crop(n, box, name, w=900, ar=4 / 3):
    im = Image.open(G % n).convert("RGB"); W, H = im.size
    x0, y0, x1, y1 = box[0] * W, box[1] * H, box[2] * W, box[3] * H
    cw, ch = x1 - x0, y1 - y0
    if cw / ch > ar: nw = ch * ar; x0 += (cw - nw) / 2; x1 = x0 + nw
    else: nh = cw / ar; y0 += (ch - nh) / 2; y1 = y0 + nh
    return save(im.crop((int(x0), int(y0), int(x1), int(y1))), name, w, 78)

PANS = [("102", [0, 0, 1, 1]), ("071", [0.03, 0.08, 0.97, 1]), ("067", [0, 0, 1, 1]), ("016", [0.04, 0.2, 0.96, 0.8]),
        ("030", [0, 0.08, 1, 1]), ("084", [0, 0, 1, 1]), ("037", [0, 0, 1, 1]), ("063", [0.02, 0.18, 0.98, 0.82]),
        ("014", [0, 0.05, 1, 0.65]), ("064", [0, 0, 1, 1]), ("070", [0.02, 0.05, 0.98, 1]), ("022", [0.04, 0.22, 0.96, 0.78])]
for i, (n, b) in enumerate(PANS): sizes[f"pan{i+1}"] = crop(n, b, f"pan{i+1}", 720)
# their real buffet line (the peak's merge), breads and sweets (portrait frames)
sizes["line"] = save(Image.open(G % "043").convert("RGB"), "line", 1200, 80)
for n, name in (("007", "bread1"), ("036", "bread2"), ("069", "bread3")): sizes[name] = crop(n, [0, 0, 1, 1], name, 900, 3 / 4)
for n, name in (("047", "sweet1"), ("062", "sweet2"), ("065", "sweet3")): sizes[name] = crop(n, [0, 0, 1, 1], name, 900, 3 / 4)
sizes["spread"] = save(Image.open("assets/source/dd-header.jpg").convert("RGB"), "spread", 2400, 78)
sizes["avatar"] = save(Image.open("assets/source/ig-avatar.jpg").convert("RGB"), "avatar", 160, 85)
json.dump(sizes, open("lab/sizes.json", "w"), indent=1)
print(json.dumps(sizes)[:600])
