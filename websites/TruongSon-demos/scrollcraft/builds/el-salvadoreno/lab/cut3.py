"""Plates as shapes: fit the plate's outline (ellipse, or a rotated rectangle for the platter) to the
non-white area, then union with the food. Avoids ragged white rims on a white studio ground.
Writes assets/c-<name>.webp and lab/cuts-sheet.png. Reports any plate that runs off the photo."""
import cv2, numpy as np
from PIL import Image
from scipy import ndimage as ndi
SRC = "assets/source/all/"
SHAPES = {"desayuno-llanero": "ellipse", "bistec-pollo": "ellipse", "chicharrones": "ellipse",
          "pupusa-ranchera": "ellipse", "chuleta-cerdo": "ellipse", "camarones-jalapeno": "ellipse",
          "pargo-chicharron": "rect", "huevos-chorizo": "ellipse", "camarones-casa": "ellipse"}
cuts = []
for n, kind in SHAPES.items():
    img = cv2.imread(SRC + n + ".png")
    if img is None: img = cv2.imread(SRC + n + ".jpg")
    h, w = img.shape[:2]
    blur = cv2.GaussianBlur(img, (0, 0), 1.5)
    fg = blur.min(axis=2) < 248
    fg = ndi.binary_closing(fg, iterations=6); fg = ndi.binary_fill_holes(fg)
    lab, k = ndi.label(fg); fg = lab == (np.argmax(ndi.sum(fg, lab, range(1, k + 1))) + 1)
    cnts, _ = cv2.findContours(fg.astype("uint8"), cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)
    hull = cv2.convexHull(max(cnts, key=cv2.contourArea))
    shape = np.zeros((h, w), "uint8")
    if kind == "ellipse": cv2.ellipse(shape, cv2.fitEllipse(hull), 255, -1)
    else: cv2.drawContours(shape, [np.int32(cv2.boxPoints(cv2.minAreaRect(hull)))], 0, 255, -1)
    # keep only what is plate-or-food: shape, trimmed by hull (no background corners), plus food outside it
    hullm = np.zeros((h, w), "uint8"); cv2.drawContours(hullm, [hull], 0, 255, -1)
    m = ((shape > 0) & (hullm > 0)) | (fg & (blur.min(axis=2) < 200))
    m = ndi.binary_fill_holes(m)
    edge = np.concatenate([m[0], m[-1], m[:, 0], m[:, -1]]).mean()
    a = cv2.GaussianBlur((m * 255).astype("uint8"), (0, 0), 0.9)
    rgba = cv2.cvtColor(img, cv2.COLOR_BGR2RGBA); rgba[..., 3] = a
    im = Image.fromarray(rgba); im = im.crop(im.getbbox()); im.save(f"assets/c-{n}.webp", quality=88)
    cuts.append((n, im)); print(f"{n} {im.size} off-photo {edge:.3f}")
# the jamaica glass: largest glass in the drinks photo
img = cv2.imread(SRC + "horchata.jpg"); lo = img.min(axis=2) < 240
lab, k = ndi.label(ndi.binary_fill_holes(ndi.binary_closing(lo, iterations=3)))
sizes = ndi.sum(lo, lab, range(1, k + 1)); xs = [ndi.center_of_mass(lab == i + 1)[1] for i in range(k)]
i = int(np.argmin([x if s > sizes.max() * 0.5 else 1e9 for x, s in zip(xs, sizes)])) + 1   # leftmost big glass = jamaica
m = ndi.binary_fill_holes(lab == i)   # (v2: the shipped glass uses its convex hull so the ice rim stays whole)
rgba = cv2.cvtColor(img, cv2.COLOR_BGR2RGBA); rgba[..., 3] = cv2.GaussianBlur((m * 255).astype("uint8"), (0, 0), 0.8)
im = Image.fromarray(rgba); im = im.crop(im.getbbox()); im.save("assets/c-jamaica.webp", quality=88); cuts.append(("jamaica", im))
t = 240; S = Image.new("RGB", (t * len(cuts), t * 2), "white")
for i, (n, im) in enumerate(cuts):
    for j, bgc in enumerate([(247, 246, 242), (28, 58, 122)]):
        c = Image.new("RGB", (t, t), bgc); x = im.copy(); x.thumbnail((t - 10, t - 10))
        c.paste(x, ((t - x.width) // 2, (t - x.height) // 2), x); S.paste(c, (i * t, j * t))
S.save("lab/cuts-sheet.png")
