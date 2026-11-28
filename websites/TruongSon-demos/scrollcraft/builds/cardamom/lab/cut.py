"""Cut dishes from their posts (lab/posts, downloaded by shortcode; post 36 is saved as assets/source/biryani-post.jpg). Dish on a dark poster ground: bright/saturated mask, largest blob,
closed and filled, GrabCut refines the edge in a band around it. Writes cuts/<name>.png and check sheets."""
import sys, glob, cv2, numpy as np
from PIL import Image
from scipy import ndimage as ndi
JOBS = {  # name: (post index, crop box, V threshold)
    "biryani": ("36", (140, 690, 1000, 1160), 62),
}
ELL = {"biryani": ((430, 305), (790, 310), -3.5)}
only = sys.argv[1:] or list(JOBS)
for name in only:
    idx, box, vt = JOBS[name]
    src = cv2.imread(glob.glob(f"posts/{idx}-*.jpg")[0])
    x0, y0, x1, y1 = box; img = src[y0:y1, x0:x1].copy(); h, w = img.shape[:2]
    hsv = cv2.cvtColor(cv2.GaussianBlur(img, (0, 0), 1.5), cv2.COLOR_BGR2HSV)
    m = (hsv[..., 2] > vt) & (hsv[..., 1] > 40) | (hsv[..., 2] > vt + 60)
    m = ndi.binary_opening(m, iterations=2)
    lab, k = ndi.label(m); sizes = ndi.sum(m, lab, range(1, k + 1)); m = lab == (1 + int(np.argmax(sizes)))
    m = ndi.binary_fill_holes(ndi.binary_closing(m, iterations=6))
    gc = np.where(m, cv2.GC_PR_FGD, cv2.GC_PR_BGD).astype("uint8")
    gc[ndi.binary_erosion(m, iterations=14)] = cv2.GC_FGD
    gc[~ndi.binary_dilation(m, iterations=14)] = cv2.GC_BGD
    bg = np.zeros((1, 65), np.float64); fg = np.zeros((1, 65), np.float64)
    cv2.grabCut(img, gc, None, bg, fg, 6, cv2.GC_INIT_WITH_MASK)
    mm = np.isin(gc, (cv2.GC_FGD, cv2.GC_PR_FGD))
    lab, k = ndi.label(mm); sizes = ndi.sum(mm, lab, range(1, k + 1)); mm = lab == (1 + int(np.argmax(sizes)))
    mm = ndi.binary_fill_holes(mm)
    if name in ELL:
        E = np.zeros((h, w), "uint8"); cv2.ellipse(E, ELL[name], 255, -1); e = E > 0
        cy = ELL[name][0][1]; yy = np.arange(h)[:, None]
        mm = e | (mm & (yy < cy))
        mm = ndi.binary_fill_holes(ndi.binary_closing(mm, iterations=3))
    a = cv2.GaussianBlur((mm * 255).astype("uint8"), (0, 0), 1.0)
    a = cv2.erode(a, np.ones((2, 2), np.uint8))
    rgba = cv2.cvtColor(img, cv2.COLOR_BGR2RGBA); rgba[..., 3] = a
    im = Image.fromarray(rgba); bb = im.getbbox(); im = im.crop(bb)
    im.save(f"cuts/{name}.png"); print(name, im.size, "edge-touch:", bb[0] == 0, bb[1] == 0, bb[2] == w, bb[3] == h)
    W, H = im.size; row = Image.new("RGB", (W * 3 + 40, H), (128, 128, 128))
    for i, c in enumerate([(255, 255, 255), (0, 0, 0), (246, 245, 241)]):
        cc = Image.new("RGB", (W, H), c); cc.paste(im, (0, 0), im); row.paste(cc, (i * (W + 20), 0))
    row.save(f"check-{name}.jpg", quality=88)
