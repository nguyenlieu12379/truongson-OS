"""One round thumbnail per menu row, cropped from the same photos the frame shows. Run from the build folder."""
from PIL import Image, ImageDraw
SRC = "assets/source/frames/"
# name: (source, centre x, centre y, side) in source pixels
T = {
    "goat-biryani": (SRC + "bowls.jpg", 705, 590, 500),
    "c65-biryani": (SRC + "bowls.jpg", 830, 1120, 470),
    "chicken-65": (SRC + "apps.jpg", 175, 960, 430),
    "majestic": (SRC + "apps.jpg", 870, 900, 450),
    "goat-kadai": (SRC + "curries.jpg", 505, 755, 340),
    "butter-chicken": (SRC + "curries.jpg", 215, 965, 370),
    "meetha": (SRC + "meetha.jpg", 450, 940, 680),
    "chai": ("assets/night-on.webp", 605, 560, 180),
}
S = 128
sheet = Image.new("RGB", (S * (len(T) + 1), S), (20, 20, 20))
for i, (k, (f, cx, cy, side)) in enumerate(T.items()):
    im = Image.open(f).convert("RGB").crop((cx - side // 2, cy - side // 2, cx + side // 2, cy + side // 2)).resize((S, S), Image.LANCZOS)
    im.save(f"assets/t-{k}.webp", "WEBP", quality=82); sheet.paste(im, (i * S, 0))
pl = Image.open("assets/plate.webp").convert("RGBA"); w, h = pl.size
c = pl.crop((w // 2 - h // 2 - 40, 0, w // 2 + h // 2 + 40, h)).resize((S, S), Image.LANCZOS)
bg = Image.new("RGB", (S, S), (24, 18, 12)); bg.paste(c, (0, 0), c); bg.save("assets/t-hyd-biryani.webp", "WEBP", quality=82)
sheet.paste(bg, (len(T) * S, 0)); sheet.save("lab/thumbs-check.jpg", quality=90)
