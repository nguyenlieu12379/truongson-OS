"""Cut the pupusa off its blue plate, and the drinks off white. Writes assets/*.webp and lab/check-*.png."""
import numpy as np
from PIL import Image, ImageFilter
from scipy import ndimage as ndi

SRC = "assets/source/cand/"

def biggest(mask, seed=None):
    lab, n = ndi.label(mask)
    if n == 0: return mask
    if seed is not None and lab[seed] > 0: k = lab[seed]
    else: k = np.argmax(ndi.sum(mask, lab, range(1, n + 1))) + 1
    return lab == k

def save(rgb, mask, name, pad=0):
    m = ndi.binary_fill_holes(mask)
    m = ndi.binary_opening(m, iterations=2)
    a = Image.fromarray((m * 255).astype("uint8")).filter(ImageFilter.GaussianBlur(1.2))
    im = Image.fromarray(rgb).convert("RGBA"); im.putalpha(a)
    bb = im.getbbox(); im = im.crop(bb)
    im.save(f"assets/{name}.webp", quality=90)
    for bg, tag in [((255, 255, 255), "w"), ((0, 0, 0), "k")]:
        c = Image.new("RGB", im.size, bg); c.paste(im, mask=im.split()[3]); c.save(f"lab/check-{name}-{tag}.png")
    print(name, im.size)

# pupusa: warm beige disc on a blue-grey plate
rgb = np.array(Image.open(SRC + "pupusa-queso.jpg").convert("RGB")).astype(int)
r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
warm = (r - b > 35) & (r > 120)
h, w = warm.shape
m = biggest(warm, (h // 2, int(w * 0.45)))
save(rgb.astype("uint8"), m, "pupusa")

# tray of 25 for the peak (framed photo, no cut) and the plates: copy as webp
for n in ["pupusas-25", "desayuno-tipico", "pupusa-ranchera", "camarones-casa", "parrillada-salvadorena", "horchata"]:
    Image.open(SRC + n + ".jpg").convert("RGB").save(f"assets/{n}.webp", quality=86)
