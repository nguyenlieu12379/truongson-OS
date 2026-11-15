// Screenshot a walkthrough site at scroll stops. Usage:
//   node shoot.cjs <url> <outDir> [stops=0,0.25,0.5,0.75,1] [width=1280] [height=760]
// Uses software GL so it runs headless; frames are slow, so it waits for the camera spring to settle.
const { chromium } = require('playwright');
(async () => {
  const [url, out = '.', stopsArg, w = '1280', h = '760'] = process.argv.slice(2);
  const stops = (stopsArg || '0,0.12,0.24,0.36,0.48,0.6,0.72,0.84,0.92,1').split(',').map(Number);
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const pg = await b.newPage({ viewport: { width: +w, height: +h } });
  const errs = [];
  pg.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
  pg.on('pageerror', (e) => errs.push(e.message));
  await pg.goto(url);
  await pg.waitForTimeout(2500);
  for (const p of stops) {
    await pg.evaluate((p) => scrollTo(0, p * (document.documentElement.scrollHeight - innerHeight)), p);
    await pg.waitForTimeout(4000);
    await pg.screenshot({ path: `${out}/shot_${w}x${h}_${p}.png` });
  }
  console.log(errs.length ? 'ERRORS:\n' + errs.join('\n') : 'No console errors');
  await b.close();
})();
