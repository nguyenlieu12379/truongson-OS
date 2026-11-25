# Cutouts of their overhead dish photos (on wood or a red table).
# 1 prior: the dish's outline. Plates and paper are brighter or more saturated than the table, so a
#   bright/saturated mask, closed and filled, gives the outline; its convex hull is the prior.
#   Round plates on the red table: a Hough circle instead.
# 2 GrabCut refines the edge in a band around the prior (sure dish inside, sure table outside),
#   which carves out table showing between an overhanging arepa and the plate.
# Usage: python cut.py <src_dir> <out_dir> <meta.json> name[:circle] ...
import sys, json, cv2, numpy as np
from PIL import Image
src, out, metaf = sys.argv[1:4]
meta = {}
def hull_contour(img):
    hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV); S = hsv[..., 1].astype(int); V = hsv[..., 2].astype(int)
    bs = np.concatenate([S[:15].ravel(), S[-15:].ravel()]); bv = np.concatenate([V[:15].ravel(), V[-15:].ravel()])
    m = (((V > np.percentile(bv, 99.5) + 8) & (S < 60)) | (S > np.percentile(bs, 99.5) + 15)).astype(np.uint8) * 255
    m = cv2.morphologyEx(m, cv2.MORPH_CLOSE, np.ones((25, 25), np.uint8))
    m = cv2.morphologyEx(m, cv2.MORPH_OPEN, np.ones((15, 15), np.uint8))
    cnts, _ = cv2.findContours(m, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)
    return cv2.convexHull(max(cnts, key=cv2.contourArea)), m.shape
def prior_feat(img):
    # the plate's own painted rim is more saturated than the table: fill its outer contour, wavy edge kept
    hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV); S = hsv[..., 1].astype(int); V = hsv[..., 2].astype(int)
    bs = np.concatenate([S[:15].ravel(), S[-15:].ravel()]); bv = np.concatenate([V[:15].ravel(), V[-15:].ravel()])
    m = (((V > np.percentile(bv, 99.5) + 8) & (S < 60)) | (S > np.percentile(bs, 99.5) + 15)).astype(np.uint8) * 255
    m = cv2.morphologyEx(m, cv2.MORPH_CLOSE, np.ones((9, 9), np.uint8))
    m = cv2.morphologyEx(m, cv2.MORPH_OPEN, np.ones((5, 5), np.uint8))
    cnts, _ = cv2.findContours(m, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)
    P = np.zeros(m.shape, np.uint8); cv2.drawContours(P, [max(cnts, key=cv2.contourArea)], -1, 255, -1)
    P = cv2.morphologyEx(P, cv2.MORPH_OPEN, np.ones((9, 9), np.uint8))
    return cv2.GaussianBlur(P, (7, 7), 0) > 127
def prior_hull(img):
    c, sh = hull_contour(img); P = np.zeros(sh, np.uint8); cv2.fillPoly(P, [c], 255); return P
def prior_quad(img):
    c, sh = hull_contour(img); per = cv2.arcLength(c, True); eps = 0.01
    q = cv2.approxPolyDP(c, eps * per, True)
    while len(q) > 4 and eps < 0.2: eps += 0.005; q = cv2.approxPolyDP(c, eps * per, True)
    P = np.zeros(sh, np.uint8); cv2.fillPoly(P, [q], 255); return P
def prior_ellipse(img):
    c, sh = hull_contour(img); P = np.zeros(sh, np.uint8); cv2.ellipse(P, cv2.fitEllipse(c), 255, -1); return P
POLY = {   # plate outlines traced by hand on the 1600x900 photos (corners plus edge midpoints)
    'lomo': [[378, 33], [795, 30], [1213, 35], [1220, 450], [1218, 872], [795, 876], [372, 873], [370, 450]],
    'chuleta': [[346, 36], [756, 33], [1166, 31], [1176, 440], [1181, 853], [767, 861], [353, 867], [348, 450]],
}
def prior_poly(img, name):
    P = np.zeros(img.shape[:2], np.uint8); cv2.fillPoly(P, [np.array(POLY[name])], 255); return P
def prior_bandeja(img):
    # their rectangular plate, the arepa hanging over its bottom edge, the plantain over its right edge
    P = np.zeros(img.shape[:2], np.uint8)
    cv2.fillPoly(P, [np.array([[203, 128], [1430, 133], [1433, 780], [200, 782]])], 255)
    cv2.ellipse(P, ((910, 712), (304, 272), 0), 255, -1)
    cv2.fillPoly(P, [np.array([[1290, 160], [1400, 150], [1444, 190], [1446, 290], [1300, 345]])], 255)
    return P
def prior_circle(img):
    g = cv2.medianBlur(cv2.cvtColor(img, cv2.COLOR_BGR2GRAY), 7); h, w = g.shape
    cs = cv2.HoughCircles(g, cv2.HOUGH_GRADIENT, 1.5, 400, param1=80, param2=60, minRadius=int(h * 0.38), maxRadius=int(h * 0.52))
    x, y, r = cs[0][0]
    P = np.zeros((h, w), np.uint8); cv2.circle(P, (int(x), int(y)), int(r), 255, -1); return P
def cut(arg):
    parts = arg.split(':'); name = parts[0]; mode = parts[1] if len(parts) > 1 else ''; nogc = 'nogc' in parts
    img = cv2.imread(f"{src}/{name}.jpg"); h, w = img.shape[:2]
    P = prior_poly(img, name) if mode == 'poly' else {'feat': lambda i: prior_feat(i).astype(np.uint8) * 255, 'circle': prior_circle, 'quad': prior_quad, 'ellipse': prior_ellipse, 'bandeja': prior_bandeja}.get(mode, prior_hull)(img)
    k = lambda n: np.ones((n, n), np.uint8)
    mask = np.full((h, w), cv2.GC_BGD, np.uint8)
    band = 27 if mode == 'quad' else 41
    mask[cv2.dilate(P, k(band)) > 0] = cv2.GC_PR_BGD
    mask[cv2.erode(P, k(band)) > 0] = cv2.GC_PR_FGD if mode == 'quad' else cv2.GC_PR_BGD
    mask[P > 0] = np.where(mask[P > 0] == cv2.GC_PR_BGD, cv2.GC_PR_FGD, mask[P > 0])
    mask[cv2.erode(P, k(band if mode == 'quad' else 35)) > 0] = cv2.GC_FGD
    if nogc:   # the plate's own geometric edge is the cut
        m = cv2.erode(P, k(3 if mode in ('feat', 'poly') else 17 if mode == 'quad' else 7))
    else:
        bg = np.zeros((1, 65)); fg = np.zeros((1, 65))
        cv2.grabCut(img, mask, None, bg, fg, 5, cv2.GC_INIT_WITH_MASK)
        m = np.where((mask == cv2.GC_FGD) | (mask == cv2.GC_PR_FGD), 255, 0).astype(np.uint8)
    m = cv2.morphologyEx(m, cv2.MORPH_OPEN, k(7))
    if mode == 'quad': m = cv2.morphologyEx(m, cv2.MORPH_CLOSE, k(15))
    cnts, _ = cv2.findContours(m, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)
    m = np.zeros_like(m); cv2.drawContours(m, [max(cnts, key=cv2.contourArea)], -1, 255, -1)
    m = cv2.erode(m, k(3))
    a = cv2.GaussianBlur(m, (5, 5), 1.0)
    x, y, bw, bh = cv2.boundingRect(m); p = 6
    x0, y0, x1, y1 = max(0, x - p), max(0, y - p), min(w, x + bw + p), min(h, y + bh + p)
    rgba = np.dstack([cv2.cvtColor(img, cv2.COLOR_BGR2RGB), a])[y0:y1, x0:x1]
    Image.fromarray(rgba).save(f"{out}/{name}.webp", quality=90, method=6)
    meta[name] = {"x0": x0, "y0": y0, "w": x1 - x0, "h": y1 - y0}
    edge = x <= 1 or y <= 1 or x + bw >= w - 1 or y + bh >= h - 1
    print(name, meta[name], "TOUCHES FRAME EDGE" if edge else "ok")
for a in sys.argv[4:]: cut(a)
json.dump(meta, open(metaf, 'w'), indent=1)
