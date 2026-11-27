"""Cut the prato feito (the square plate, the only plate fully inside the frame) out of their DoorDash
table photo. Plate = bright low-saturation rim, holes filled, convex hull (a plate is convex).
Writes lab/cuts/pf.png (exact pixels, no shadow) + its box in photo coordinates, and check sheets."""
import cv2, numpy as np, json
from PIL import Image, ImageFilter
from scipy import ndimage as ndi
img = cv2.imread("assets/source/dd-header.jpg"); h, w = img.shape[:2]
hsv = cv2.cvtColor(cv2.GaussianBlur(img, (0, 0), 2), cv2.COLOR_BGR2HSV)
white = ndi.binary_opening((hsv[..., 1] < 38) & (hsv[..., 2] > 170), iterations=2)
lab, k = ndi.label(white)
i = lab[675, 1265 - 380]  # a rim pixel? fall back to the component under the plate centre bbox
ys, xs = np.nonzero(lab)
best = None
for c in range(1, k + 1):
    m = lab == c
    if m.sum() < 100000: continue
    yy, xx = np.nonzero(m)
    if xx.min() > 800 and xx.max() < 1700 and yy.min() > 200 and yy.max() < 1100: best = m
m = ndi.binary_fill_holes(ndi.binary_closing(best, iterations=8))
cnts, _ = cv2.findContours(m.astype("uint8"), cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)
hull = cv2.convexHull(max(cnts, key=cv2.contourArea))
hm = np.zeros((h, w), "uint8"); cv2.drawContours(hm, [hull], 0, 255, -1)
hm = cv2.erode(hm, np.ones((3, 3), np.uint8), iterations=2)   # stay inside the rim's soft edge
a = cv2.GaussianBlur(hm, (0, 0), 1.1)
rgba = cv2.cvtColor(img, cv2.COLOR_BGR2RGBA); rgba[..., 3] = a
im = Image.fromarray(rgba); box = im.getbbox(); im = im.crop(box)
import os; os.makedirs("lab/cuts", exist_ok=True)
im.save("lab/cuts/pf.png")
json.dump({"photo": [w, h], "pf": list(box)}, open("lab/cuts.json", "w"))
print("pf box", box, im.size)
for name, bg in (("w", (255, 255, 255)), ("k", (0, 0, 0)), ("g", (247, 245, 240))):
    c = Image.new("RGB", im.size, bg); c.paste(im, (0, 0), im); c.save(f"lab/check-pf-{name}.jpg", quality=90)
