"""Trace a round logo image into a recolorable vector SVG (for the site header, footer, favicon).

Usage:
    pip install potracer numpy pillow
    python3 trace_logo.py <logo.png> <out-inner.svg> [RING_AND_SCRIPT] [THIN_LINES] [BLACK] [DARK_CENTRE]
    # then wrap: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"> + inner + </svg>  -> assets/logo.svg

How it works: upscales 4x, splits pixels into red-ish / near-black / dark, then separates thick red shapes
(ring, script) from thin red lines (e.g. an engraved cup) by stroke width, traces each with potrace and
fills each layer with the color you pass. Built for a red/black badge (Espresso Vivace); adjust the
color tests below for other logos. Check <out>.split.png to see how pixels were sorted.
Use a large source image: a 300px source gives soft curves under heavy zoom.
"""
import sys, numpy as np, potrace
from PIL import Image, ImageFilter
src, out = sys.argv[1], sys.argv[2]
S = 4
im = Image.open(src).convert("RGBA")
W = im.width * S
big = im.resize((W, W), Image.LANCZOS)
a = np.asarray(big).astype(int)
r, g, b, al = a[..., 0], a[..., 1], a[..., 2], a[..., 3]
inside = al > 128
redish = inside & (r > 110) & (r - g > 70)
lum = (r * 299 + g * 587 + b * 114) // 1000
black = inside & ~redish & (lum < 16)
dark = inside & ~redish & ~black

def to_img(m): return Image.fromarray((m * 255).astype(np.uint8))
def to_m(img): return np.asarray(img) > 127
# thick red (ring + script) survives an opening; thin cup lines do not
k = 2 * S + 1
opened = to_m(to_img(redish).filter(ImageFilter.MinFilter(k)).filter(ImageFilter.MaxFilter(k)))
thick = redish & to_m(to_img(opened).filter(ImageFilter.MaxFilter(3)))
near = to_m(to_img(thick).filter(ImageFilter.MaxFilter(2 * S + 1)))
cup = redish & ~thick & ~near

def trace(m, turd=12):
    bm = potrace.Bitmap(~m)
    pl = bm.trace(turdsize=turd, alphamax=1.0, opticurve=True, opttolerance=0.4)
    sc = 200.0 / W
    f = lambda p: "%.1f %.1f" % (p.x * sc, p.y * sc)
    d = []
    for c in pl:
        d.append("M " + f(c.start_point))
        for s in c.segments:
            if s.is_corner: d.append("L " + f(s.c) + " L " + f(s.end_point))
            else: d.append("C " + f(s.c1) + " " + f(s.c2) + " " + f(s.end_point))
        d.append("Z")
    return " ".join(d)

layers = {"dark": trace(dark), "thick": trace(thick), "cup": trace(cup, 6)}
for k2, v in layers.items(): print(k2, len(v), "chars", file=sys.stderr)
RING, CUP, BLACK, DARK = sys.argv[3:7] if len(sys.argv) > 6 else ("#E8471F", "#D91E26", "#141110", "#231F20")
svg = ('<circle cx="100" cy="100" r="100" fill="%s"/>\n' % BLACK +
       '<path fill="%s" fill-rule="evenodd" d="%s"/>\n' % (DARK, layers["dark"]) +
       '<path fill="%s" fill-rule="evenodd" d="%s"/>\n' % (CUP, layers["cup"]) +
       '<path fill="%s" fill-rule="evenodd" d="%s"/>\n' % (RING, layers["thick"]))
open(out, "w").write(svg)
# debug previews of the split
prev = np.zeros((W, W, 3), np.uint8); prev[black] = (20, 17, 16); prev[dark] = (60, 55, 55); prev[thick] = (232, 71, 31); prev[cup] = (60, 140, 255)
Image.fromarray(prev).resize((632, 632)).save(out + ".split.png")
