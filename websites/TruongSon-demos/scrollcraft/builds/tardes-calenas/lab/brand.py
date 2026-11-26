# Cuts their logo and its brand items off the white ground of their Instagram avatar (500x500).
# Alpha comes from how far a pixel is from white; colour is un-mixed from white so edges stay clean.
import numpy as np
from PIL import Image
src = 'assets/source/brand/avatar.jpg'
im = np.asarray(Image.open(src).convert('RGB')).astype(np.float32)
d = 255 - im.min(axis=2)                    # 0 on white, high on any ink
a = np.clip((d - 18) / 70, 0, 1)            # soft edge
a[im.sum(axis=2) > 742] = 0
rgb = np.where(a[..., None] > 0.02, (im - (1 - a[..., None]) * 255) / np.maximum(a[..., None], 0.02), 255)
rgba = np.dstack([np.clip(rgb, 0, 255), a * 255]).astype(np.uint8)
full = Image.fromarray(rgba)
import cv2
def crop(box, name, scale=1, single=False):
    c = full.crop(box)
    if single:   # keep only the item's own shape, not the letters it sits beside
        arr = np.asarray(c).copy(); m = (arr[..., 3] > 40).astype(np.uint8)
        n, lab, st, _ = cv2.connectedComponentsWithStats(m, connectivity=8)
        big = 1 + int(np.argmax(st[1:, cv2.CC_STAT_AREA]))
        keep = cv2.dilate((lab == big).astype(np.uint8), np.ones((3, 3), np.uint8))
        arr[..., 3] = (arr[..., 3] * keep).astype(np.uint8); c = Image.fromarray(arr)
    bb = c.getbbox(); c = c.crop(bb)
    if scale != 1: c = c.resize((int(c.width * scale), int(c.height * scale)), Image.LANCZOS)
    c.save(f'assets/{name}.webp', quality=92, method=6, lossless=False); print(name, c.size)
crop((0, 100, 500, 385), 'logo')            # the whole lockup: words, cat, glass, cutlery, BAR - RESTAURANT, HOLLYWOOD FL
crop((0, 120, 500, 340), 'logo-mark')       # words, cat, glass and cutlery only (for the bar)
crop((338, 118, 438, 231), 'b-cat', single=True)         # the Cali cat
crop((120, 235, 189, 330), 'b-glass', single=True)       # the martini glass
crop((428, 168, 492, 248), 'b-cutlery', single=True)     # spoon and fork
# the glass crop starts with a corner of the letter above it: clear it
g = Image.open('assets/b-glass.webp'); ga = np.asarray(g).copy(); ga[:8, :22, 3] = 0
g = Image.fromarray(ga); g.crop(g.getbbox()).save('assets/b-glass.webp', quality=92, method=6)
