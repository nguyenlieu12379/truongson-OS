import sys, glob, os
from PIL import Image, ImageDraw
files = sorted(glob.glob(sys.argv[1] + "/*.jpg")); out = sys.argv[2]; cols = int(sys.argv[3]) if len(sys.argv) > 3 else 10
T = 220; rows = (len(files) + cols - 1) // cols
sh = Image.new("RGB", (cols * T, rows * T), (40, 40, 40)); d = ImageDraw.Draw(sh)
for k, f in enumerate(files):
    try: im = Image.open(f).convert("RGB")
    except Exception: continue
    im.thumbnail((T - 4, T - 4)); x, y = (k % cols) * T, (k // cols) * T
    sh.paste(im, (x + 2, y + 2)); d.rectangle([x + 2, y + 2, x + 40, y + 18], fill=(0, 0, 0)); d.text((x + 4, y + 4), os.path.basename(f)[:3], fill=(255, 255, 0))
sh.save(out, quality=82); print(sh.size)
