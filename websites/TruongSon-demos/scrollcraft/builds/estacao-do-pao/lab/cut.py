"""Cut Estação do Pão's food out of their own DoorDash studio spread (no AI fill, no generated pixels).
pdq: the three pão de queijo (cream on a white plate): seed from warm saturation, GrabCut refines, keep the three
balls, fill holes. empadas: the white plate with three chicken pies, cut on a fitted circle (white plate on white cloth).
Run from the build folder: python lab/cut.py
Writes lab/cuts/<name>.png and check sheets lab/check/<name>.jpg (original, on white, black, the site ground)."""
import cv2, numpy as np, os, json
from scipy import ndimage as ndi
from PIL import Image

SRC = "assets/source/dd-header.jpg"
GROUND = (245, 244, 241)


def pdq(img):
    h, w = img.shape[:2]
    x0, y0, x1, y1 = 140, 30, 920, 960
    hsv = cv2.cvtColor(cv2.GaussianBlur(img, (0, 0), 2), cv2.COLOR_BGR2HSV)
    H, S, V = [hsv[..., i].astype(int) for i in range(3)]
    m = np.full((h, w), cv2.GC_BGD, np.uint8)
    m[y0:y1, x0:x1] = cv2.GC_PR_BGD
    roi = np.zeros((h, w), bool); roi[y0:y1, x0:x1] = True
    warm = ndi.binary_opening(roi & (S > 38) & (H < 30) & (V > 120), iterations=4)
    m[warm] = cv2.GC_PR_FGD
    m[ndi.binary_erosion(warm, iterations=14)] = cv2.GC_FGD
    m[roi & (S < 14) & (V > 200)] = cv2.GC_BGD           # the white plate
    m[roi & (H > 35) & (H < 90) & (S > 60)] = cv2.GC_BGD  # parsley on the plate
    bg, fg = np.zeros((1, 65)), np.zeros((1, 65))
    cv2.grabCut(img, m, None, bg, fg, 6, cv2.GC_INIT_WITH_MASK)
    f = (m == cv2.GC_FGD) | (m == cv2.GC_PR_FGD)
    f = f & ~(S < 18)
    f = ndi.binary_fill_holes(ndi.binary_closing(ndi.binary_opening(f, iterations=3), iterations=4))
    # the shadow ball 1 casts toward ball 2 is dim and fills the concave gap between them. Take the bright part of
    # each ball, hull it (restores crust the threshold bit, never bridges two balls), grow it over the shaded crust
    # rim, and keep only what the GrabCut mask had there
    g = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    br = ndi.binary_opening(f & (g >= 158), iterations=8)
    bl, bk = ndi.label(br); bs = ndi.sum(br, bl, range(1, bk + 1))
    # per ball: an ellipse fitted to its outline (lab notes: auto fits on the full outline, then nudged by hand
    # 7px up-right, away from the shadows that fall to the lower left), keep the GrabCut edge inside it
    env = np.zeros(f.shape, "uint8")
    for (cx, cy, ax, ay, ang) in ((354, 252, 375, 469, 75), (668, 375, 380, 408, 100), (398, 723, 367, 422, 137)):
        cv2.ellipse(env, ((cx + 7, cy - 7), (ax - 12, ay - 12), ang), 1, -1)
    r = f & (env > 0)
    r = ndi.binary_opening(r, iterations=3)
    lab2, k2 = ndi.label(r); sz = ndi.sum(r, lab2, range(1, k2 + 1))
    r = np.isin(lab2, np.argsort(sz)[::-1][:3] + 1)
    return ndi.binary_fill_holes(ndi.binary_closing(r, iterations=4))


def empadas(img):
    h, w = img.shape[:2]
    hsv = cv2.cvtColor(cv2.GaussianBlur(img, (0, 0), 2), cv2.COLOR_BGR2HSV)
    V = hsv[..., 2].astype(int); S = hsv[..., 1].astype(int)
    # the plate: brighter and cooler than the cloth. Find its rim from the shadow ring, fit a circle
    x0, y0, x1, y1 = 2700, 180, 3960, 1380
    sub = cv2.cvtColor(img[y0:y1, x0:x1], cv2.COLOR_BGR2GRAY)
    e = cv2.Canny(cv2.GaussianBlur(sub, (0, 0), 3), 10, 30)
    c = cv2.HoughCircles(cv2.GaussianBlur(sub, (0, 0), 4), cv2.HOUGH_GRADIENT, 1.5, 400, param1=40, param2=40, minRadius=480, maxRadius=600)
    print("circles", None if c is None else c[0][:3])
    cx, cy, r = c[0][0]
    f = np.zeros((h, w), "uint8"); cv2.circle(f, (int(cx + x0), int(cy + y0)), int(r), 255, -1)
    return f > 0


def finish(name, img, fg):
    a = (fg * 255).astype(np.uint8)
    a = cv2.GaussianBlur(a, (0, 0), 2.4)
    a = np.clip((a.astype(int) - 128) * 3 + 128, 0, 255).astype(np.uint8)
    a = cv2.erode(a, np.ones((3, 3), np.uint8), iterations=1)
    a = cv2.GaussianBlur(a, (0, 0), 1.0)
    rgba = cv2.cvtColor(img, cv2.COLOR_BGR2RGBA); rgba[..., 3] = a
    im = Image.fromarray(rgba); box = im.getbbox(); im = im.crop(box)
    os.makedirs("lab/cuts", exist_ok=True); os.makedirs("lab/check", exist_ok=True)
    im.save(f"lab/cuts/{name}.png")
    tiles = [Image.open(SRC).convert("RGB").crop(box)]
    for bg in ((255, 255, 255), (0, 0, 0), GROUND):
        t = Image.new("RGB", im.size, bg); t.paste(im, (0, 0), im); tiles.append(t)
    sheet = Image.new("RGB", (im.width * 4 + 30, im.height), (128, 128, 128))
    for j, t in enumerate(tiles): sheet.paste(t, (j * (im.width + 10), 0))
    sheet.thumbnail((1800, 600)); sheet.save(f"lab/check/{name}.jpg", quality=88)
    return list(box), im.size


if __name__ == "__main__":
    img = cv2.imread(SRC)
    out = {}
    for n, fn in (("pdq", pdq), ("empadas", empadas)):
        b, s = finish(n, img, fn(img)); out[n] = {"box": b, "size": list(s)}; print(n, b, s)
    json.dump(out, open("lab/cuts.json", "w"), indent=1)
