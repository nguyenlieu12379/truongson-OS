"""Screenshot the page at scroll positions and build a contact sheet.
python lab/shots.py <name> <w> <h> [dark] [p,p,p...]   (server on :4519)"""
import sys, asyncio, os
from playwright.async_api import async_playwright
from PIL import Image, ImageDraw
name, W, H = sys.argv[1], int(sys.argv[2]), int(sys.argv[3])
dark = len(sys.argv) > 4 and sys.argv[4] == 'dark'
P = [float(x) for x in sys.argv[5].split(',')] if len(sys.argv) > 5 else [0, .06, .1, .14, .2, .245, .28, .32, .36, .42, .47, .5, .53, .57, .61, .65, .7, .74, .77, .82, .87, .9, .93, .96, 1]
async def main():
    async with async_playwright() as pw:
        b = await pw.chromium.launch(channel='chrome', args=['--disable-features=PointerLockOptions'])
        ctx = await b.new_context(viewport={'width': W, 'height': H}, color_scheme='dark' if dark else 'light', reduced_motion=os.environ.get('RM','no-preference'), device_scale_factor=1, has_touch=W < 760, is_mobile=W < 760)
        pg = await ctx.new_page(); errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.goto('http://localhost:4519/', wait_until='networkidle'); await pg.wait_for_timeout(800)
        os.makedirs(f'lab/shots/{name}', exist_ok=True); files = []
        for p in P:
            await pg.evaluate(f'scrollTo(0, {p} * (document.documentElement.scrollHeight - innerHeight))')
            await pg.wait_for_timeout(1300)
            f = f'lab/shots/{name}/{p:.3f}.png'; await pg.screenshot(path=f); files.append((p, f))
        sw = await pg.evaluate('document.documentElement.scrollWidth - innerWidth')
        print('errors', errs, 'sideways', sw)
        await b.close()
    C = 5; tw = 420 if W > H else 240; th = int(tw * H / W)
    rows = (len(files) + C - 1) // C
    sh = Image.new('RGB', (C * tw, rows * th), 'white'); d = ImageDraw.Draw(sh)
    for i, (p, f) in enumerate(files):
        im = Image.open(f).convert('RGB'); im.thumbnail((tw, th)); x, y = (i % C) * tw, (i // C) * th
        sh.paste(im, (x, y)); d.rectangle([x, y, x + 44, y + 16], fill='black'); d.text((x + 3, y + 2), f'{p:.3f}', fill='yellow')
    sh.save(f'lab/sheet-{name}.jpg', quality=82)
asyncio.run(main())
