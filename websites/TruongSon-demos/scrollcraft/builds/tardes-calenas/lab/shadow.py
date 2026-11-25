# Bakes a soft contact shadow into each cutout so the page never runs a CSS filter on a moving plate.
# Pads every side by PAD px (keep in sync with SHADOW_PAD in site.js). Usage: python shadow.py <in_dir> <out_dir> names...
import sys
from PIL import Image, ImageFilter
PAD = 48
src, out = sys.argv[1:3]
for n in sys.argv[3:]:
    im = Image.open(f"{src}/{n}.webp").convert('RGBA'); w, h = im.size
    a = im.getchannel('A')
    canvas = Image.new('RGBA', (w + PAD * 2, h + PAD * 2), (0, 0, 0, 0))
    for off, blur, op in ((22, 24, 0.34), (4, 4, 0.16)):
        sh = Image.new('L', canvas.size, 0); sh.paste(a.point(lambda v: int(v * op)), (PAD, PAD + off))
        sh = sh.filter(ImageFilter.GaussianBlur(blur))
        layer = Image.new('RGBA', canvas.size, (28, 18, 8, 0)); layer.putalpha(sh)
        canvas = Image.alpha_composite(canvas, layer)
    canvas.alpha_composite(im, (PAD, PAD))
    canvas.save(f"{out}/{n}.webp", quality=88, method=6)
    print(n, canvas.size)
