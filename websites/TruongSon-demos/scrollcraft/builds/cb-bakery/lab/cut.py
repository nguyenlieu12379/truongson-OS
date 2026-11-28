"""Cut CB Bakery's food out of their own photos (no AI fill, no generated pixels).
Food on a white plate / white marble: seed the food from colour (saturated or dark pixels), seed the
background from the frame border and the white plate, then GrabCut refines the edge. Keeps one component
(the one under `pick`), fills holes, smooths the rim, crops.
Run from the build folder: python lab/cut.py [name ...]
Writes lab/cuts/<name>.png and check sheets lab/check/<name>.jpg (on white, black, and the site ground)."""
import cv2, numpy as np, os, sys, json
from scipy import ndimage as ndi
from PIL import Image

# name: (source, roi [x0,y0,x1,y1] as fractions, pick point as fractions, sat threshold, extra)
JOBS = {
    "coxinha":   ("assets/source/google/g8.jpg", [0.22, 0.22, 0.80, 0.80], [0.5, 0.55], 70, {"and_s": 170}),
    "plate":     ("assets/source/google/g7.jpg", [0.01, 0.27, 0.99, 0.78], [0.5, 0.52], 0, {"plate": True}),
    "steak":     ("assets/source/dd-header.png", [0.285, 0.16, 0.715, 0.79], [0.5, 0.5], 0, {"ellipse": ((698, 377), (582, 476), 0)}),
    "risole":    ("assets/source/ue/risole.jpg", [0.60, 0.15, 0.97, 0.98], [0.78, 0.65], 110, {"and_s": 80}),
    "empadinha": ("assets/source/ue/empadinha.jpg", [0.18, 0.22, 0.82, 0.70], [0.5, 0.45], 50, {"and_s": 122, "hull": 1}),
    "catarina":  ("assets/source/ue/catarina.jpg", [0.03, 0.20, 0.99, 0.75], [0.5, 0.5], 45, {"noshadow": 1}),
    "coxinhas-box": ("assets/source/ue/coxinhas-box.jpg", [0.02, 0.02, 0.98, 0.98], [0.5, 0.5], 0, {"bowl": True}),
    "quindim":   ("assets/source/ue/quindim.jpg", [0.18, 0.22, 0.85, 0.68], [0.5, 0.48], 70, {"and_s": 60}),
    "tortinha":  ("assets/source/ue/tortinha-morango.jpg", [0.10, 0.15, 0.92, 0.85], [0.5, 0.5], 40, {}),
    "brigadeiro": ("assets/source/ue/brigadeiro.jpg", [0.02, 0.0, 0.99, 0.93], [0.5, 0.45], 0, {"dark": True}),
}
GROUND = (247, 245, 242)


def cut(name):
    src, roi, pick, sat_t, ex = JOBS[name]
    img = cv2.imread(src); h, w = img.shape[:2]
    x0, y0, x1, y1 = int(roi[0] * w), int(roi[1] * h), int(roi[2] * w), int(roi[3] * h)
    hsv = cv2.cvtColor(cv2.GaussianBlur(img, (0, 0), 1.5), cv2.COLOR_BGR2HSV)
    S, V = hsv[..., 1].astype(int), hsv[..., 2].astype(int)
    m = np.full((h, w), cv2.GC_BGD, np.uint8)
    m[y0:y1, x0:x1] = cv2.GC_PR_BGD
    inroi = np.zeros((h, w), bool); inroi[y0:y1, x0:x1] = True
    if ex.get("ellipse"):  # plate rim drawn by hand on the photo (white plate on white marble)
        em = np.zeros((h, w), "uint8"); cv2.ellipse(em, ex["ellipse"], 255, -1)
        return finish(name, src, img, em > 0, ex)
    if ex.get("plate") or ex.get("bowl"):
        # the plate / bowl itself is the subject: anything not the pale ground inside the roi
        g = cv2.cvtColor(img, cv2.COLOR_BGR2LAB)[..., 0].astype(int)
        food = inroi & ((S > 45) | (V < 150))
        m[inroi] = cv2.GC_PR_FGD
        m[food] = cv2.GC_FGD
    elif ex.get("dark"):
        food = inroi & (V < 110)
        m[food] = cv2.GC_FGD
        m[inroi & (V > 200) & (S < 30)] = cv2.GC_BGD
    else:
        food = inroi & (S > sat_t) & (V > 40)
        food = ndi.binary_opening(food, iterations=2)
        m[food] = cv2.GC_FGD
        m[inroi & (S < 22) & (V > 175)] = cv2.GC_BGD
    bgd, fgd = np.zeros((1, 65), np.float64), np.zeros((1, 65), np.float64)
    cv2.grabCut(img, m, None, bgd, fgd, 6, cv2.GC_INIT_WITH_MASK)
    fg = (m == cv2.GC_FGD) | (m == cv2.GC_PR_FGD)
    fg = ndi.binary_opening(fg, iterations=2)
    if ex.get("and_s"): fg = fg & (S > ex["and_s"]); fg = ndi.binary_opening(fg, iterations=2)
    if ex.get("noshadow"):  # grey contact shadow on the plate: low saturation, mid value
        H = hsv[..., 0].astype(int)
        cool = (H > 70) & (H < 150) & (S > 8)          # the shadow on a white plate is blue-grey; the food is warm
        fg = fg & ~cool & ~((S < 55) & (V < 212)); fg = ndi.binary_opening(fg, iterations=3)
    lab, k = ndi.label(fg)
    px, py = int(pick[0] * w), int(pick[1] * h)
    i = lab[py, px]
    if i == 0:  # nearest component to the pick point
        d = ndi.distance_transform_edt(lab == 0, return_indices=True)[1]
        i = lab[d[0][py, px], d[1][py, px]]
    fg = ndi.binary_fill_holes(lab == i) if not ex.get("hull") else ndi.binary_fill_holes(fg)
    fg = ndi.binary_closing(fg, iterations=3)
    fg = ndi.binary_fill_holes(fg)
    if ex.get("hull"):  # a convex pastry: its hull, so crust gaps the threshold missed come back
        cnts, _ = cv2.findContours(fg.astype("uint8"), cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)
        hm = np.zeros((h, w), "uint8"); cv2.drawContours(hm, [cv2.convexHull(np.vstack(cnts))], 0, 255, -1); fg = hm > 0
    if ex.get("plate"):  # a plate is an ellipse: fit it to the hull of what was found
        cnts, _ = cv2.findContours(fg.astype("uint8"), cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)
        hull = cv2.convexHull(max(cnts, key=cv2.contourArea))
        el = cv2.fitEllipse(hull); print("ellipse", el)
        em = np.zeros((h, w), "uint8"); cv2.ellipse(em, el, 255, -1); fg = em > 0
    return finish(name, src, img, fg, ex)


def finish(name, src, img, fg, ex):
    a = (fg * 255).astype(np.uint8)
    a = cv2.GaussianBlur(a, (0, 0), 2.2)
    a = np.clip((a.astype(int) - 128) * 3 + 128, 0, 255).astype(np.uint8)  # smooth rim, firm edge
    a = cv2.erode(a, np.ones((3, 3), np.uint8), iterations=1)
    a = cv2.GaussianBlur(a, (0, 0), 0.9)
    rgba = cv2.cvtColor(img, cv2.COLOR_BGR2RGBA); rgba[..., 3] = a
    im = Image.fromarray(rgba); box = im.getbbox(); im = im.crop(box)
    os.makedirs("lab/cuts", exist_ok=True); os.makedirs("lab/check", exist_ok=True)
    im.save(f"lab/cuts/{name}.png")
    tiles = []
    for bg in ((255, 255, 255), (0, 0, 0), GROUND):
        c = Image.new("RGB", im.size, bg); c.paste(im, (0, 0), im); tiles.append(c)
    orig = Image.open(src).convert("RGB").crop(box)
    sheet = Image.new("RGB", (im.width * 4 + 30, im.height), (128, 128, 128))
    for j, t in enumerate([orig] + tiles): sheet.paste(t, (j * (im.width + 10), 0))
    sheet.thumbnail((1600, 600)); sheet.save(f"lab/check/{name}.jpg", quality=88)
    return name, list(box), im.size


if __name__ == "__main__":
    names = sys.argv[1:] or list(JOBS)
    out = {}
    if os.path.exists("lab/cuts.json"): out = json.load(open("lab/cuts.json"))
    for n in names:
        r = cut(n); out[n] = {"box": r[1], "size": list(r[2])}; print(r)
    json.dump(out, open("lab/cuts.json", "w"), indent=1)
