// Screenshot a film site at scroll points, and check that every frame loads.
// Usage: node shoot.cjs <url> <outDir> [points=0,0.1,...,1] [width=1280] [height=760]
// Writes <outDir>/<width>x<height>_<point>.png and prints console errors and failed requests.
const { chromium } = require('playwright');
(async () => {
  const [url, out = '.', pointsArg, w = '1280', h = '760'] = process.argv.slice(2);
  const points = (pointsArg || '0,0.08,0.2,0.3,0.4,0.48,0.6,0.75,0.82,0.95,1').split(',').map(Number);
  const b = await chromium.launch();
  const pg = await b.newPage({ viewport: { width: +w, height: +h } });
  const errs = [];
  pg.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
  pg.on('pageerror', (e) => errs.push(e.message));
  pg.on('requestfailed', (r) => errs.push(`failed: ${r.url()}`));
  pg.on('response', (r) => { if (r.status() >= 400) errs.push(`${r.status()}: ${r.url()}`); });
  await pg.goto(url, { waitUntil: 'load' });
  // wait until the loader is gone and every frame has loaded
  await pg.waitForFunction(() => document.getElementById('loader').hidden, null, { timeout: 60000 });
  await pg.waitForLoadState('networkidle');
  require('fs').mkdirSync(out, { recursive: true });
  for (const p of points) {
    await pg.evaluate((p) => {
      const max = document.documentElement.scrollHeight - innerHeight;
      scrollTo(0, Math.round(max * p));
    }, p);
    await pg.waitForTimeout(1500); // let the follow spring settle
    const f = `${out}/${w}x${h}_${String(p).replace('.', '_')}.png`;
    await pg.screenshot({ path: f });
    console.log('shot', f);
  }
  console.log(errs.length ? `ERRORS:\n${errs.join('\n')}` : 'no errors');
  await b.close();
})();
