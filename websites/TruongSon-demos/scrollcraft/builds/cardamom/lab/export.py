"""Export web assets from lab sources. Run from the build folder: python lab/export.py"""
import cv2, numpy as np, json, shutil
from PIL import Image, ImageFilter
A = "assets/"
def save(im, name, q=82): im.save(A + name, "WEBP", quality=q, method=6); print(name, im.size)
def blur_box(im, box, r=14):
    reg = im.crop(box).filter(ImageFilter.GaussianBlur(r)); im.paste(reg, box[:2]); return im
# 1 hero plate cutout + its soft contact shadow
pl = Image.open("lab/cuts/biryani.png"); save(pl, "plate.webp", 88)
a = pl.split()[3]; pad = 50
sh = Image.new("L", (pl.width + pad * 2, pl.height + pad * 2), 0); sh.paste(a, (pad, pad))
sh = sh.filter(ImageFilter.GaussianBlur(22)).point(lambda v: int(v * 0.55))
shadow = Image.new("RGBA", sh.size, (20, 14, 8, 0)); shadow.putalpha(sh); save(shadow, "plate-shadow.webp", 70)
# 2 food frames from their reel DWSyLEIDfMV (crops below the logo overlay, above the captions)
F = {"bowls": ("lab/frames/fine/004.jpg", (0, 330, 1080, 1420)), "apps": ("lab/frames/fine/016.jpg", (0, 470, 1080, 1430)),
     "curries": ("lab/frames/fine/019.jpg", (0, 520, 1080, 1190)), "meetha": ("lab/frames/fine/022.jpg", (0, 500, 1080, 1460)),
     "room": ("lab/frames/room/024.jpg", (0, 330, 1080, 1560))}
for k, (f, box) in F.items():
    shutil.copy(f, f"assets/source/frames/{k}.jpg")
    im = Image.open(f).convert("RGB").crop(box); save(im, f"f-{k}.webp")
# 3 the storefront at night: lit (as shot) and with the sign switched off (neon pixels dimmed)
shutil.copy("lab/frames/night.jpg", "assets/source/frames/night.jpg")
src = Image.open("lab/frames/night.jpg").convert("RGB")
box = (0, 300, 1080, 1380)
on = src.crop(box)
for b in [(880, 735, 1035, 790), (0, 900, 90, 960)]:   # licence plates, blurred (crop coords)
    on = blur_box(on, b)
save(on, "night-on.webp", 84)
arr = np.asarray(on).astype(np.float32); R, G, B = arr[..., 0], arr[..., 1], arr[..., 2]
green = np.clip((G - np.maximum(R, B) - 25) / 90, 0, 1)
SIGN = (20, 150, 760, 330)  # sign band in crop coords (letters + leaf + glow)
reg = np.zeros_like(green); reg[SIGN[1]:SIGN[3], SIGN[0]:SIGN[2]] = 1
reg = cv2.GaussianBlur(reg, (0, 0), 12)
core = cv2.dilate((green > 0.25).astype(np.uint8), np.ones((5, 5), np.uint8), iterations=2)
core = cv2.morphologyEx(core, cv2.MORPH_CLOSE, np.ones((9, 9), np.uint8)).astype(np.float32)
k = np.clip(np.maximum(green * 1.4, cv2.GaussianBlur(core, (0, 0), 1.5)), 0, 1) * reg
gray = (0.3 * R + 0.59 * G + 0.11 * B)
off = arr.copy()
dark = np.stack([gray * 0.08 + 38, gray * 0.08 + 40, gray * 0.08 + 36], -1)
off = off * (1 - k[..., None]) + dark * k[..., None]
# the green spill on the fascia around the sign also goes
spill = np.clip((G - (R + B) / 2 - 8) / 60, 0, 1) * reg * (1 - k)
off[..., 1] = off[..., 1] - spill * (G - (R + B) / 2) * 0.85
off = Image.fromarray(np.clip(off, 0, 255).astype("uint8")); save(off, "night-off.webp", 84)
LETTERS = [[30, 118], [116, 202], [200, 258], [254, 342], [340, 426], [422, 546], [542, 626], [622, 748]]
json.dump({"size": on.size, "letters": LETTERS, "y": [150, 330]}, open("lab/sign.json", "w"))
