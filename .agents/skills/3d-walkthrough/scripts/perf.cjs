// Slow-scroll smoothness check for a walkthrough site.
// Usage: node perf.cjs <url> [width=1920] [height=1080] [dpr=2]
// Scrolls 3 px per animation frame for 300 frames from two points and prints frame gaps.
// Pass: median 16.7 ms and nothing over 25 ms. Headless Chromium uses software GL for
// WebGL, so a fail here can be the machine; a pass is a good sign, not proof. Test real devices too.
const { chromium } = require('playwright');
(async () => {
  const [url, w = '1920', h = '1080', dpr = '2'] = process.argv.slice(2);
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const ctx = await b.newContext({ viewport: { width: +w, height: +h }, deviceScaleFactor: +dpr });
  const pg = await ctx.newPage();
  await pg.goto(url, { waitUntil: 'load' });
  await pg.waitForLoadState('networkidle');
  await pg.waitForTimeout(4000);
  for (const start of [0.35, 0.7]) {
    const r = await pg.evaluate(async (start) => {
      const max = document.documentElement.scrollHeight - innerHeight;
      scrollTo(0, max * start); await new Promise((r) => setTimeout(r, 1500));
      const gaps = []; let t0 = performance.now(); let y = scrollY;
      await new Promise((res) => {
        let n = 0;
        function f(t) { gaps.push(t - t0); t0 = t; y += 3; scrollTo(0, y); if (++n < 300) requestAnimationFrame(f); else res(); }
        requestAnimationFrame(f);
      });
      gaps.shift(); gaps.sort((a, b) => a - b);
      const p = (q) => gaps[Math.floor(q * (gaps.length - 1))].toFixed(1);
      return { median: p(0.5), p90: p(0.9), p99: p(0.99), max: gaps.at(-1).toFixed(1), over25: gaps.filter((g) => g > 25).length };
    }, start);
    console.log(`${w}x${h}@${dpr} from ${start}`, JSON.stringify(r));
  }
  await b.close();
})();
