// Save the photos Google Maps shows for a venue (signed out, phone view).
// For pitching a venue that is not a client yet: test and pitch use only, never published
// (the photos belong to the people who took them). Paying clients send their own photos
// (references/photo-brief.md).
//
// usage: node maps_photos.cjs "<venue name and address>" <outDir>
// writes <outDir>/p001.jpg ... and <outDir>/sources.tsv (file, size, Google URL)
//
// What to expect: signed-out Maps shows a handful of photos, mostly inside, food and drinks.
// No Street View. Pick the sharp ones without text, reflections or people for the design wrap.
const { chromium, devices } = require('playwright');
const fs = require('fs');
const [query, out] = process.argv.slice(2);
if (!query || !out) { console.error('usage: node maps_photos.cjs "<venue>" <outDir>'); process.exit(1); }
fs.mkdirSync(out, { recursive: true });

(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ ...devices['Pixel 7'], locale: 'en-US' });
  const pg = await ctx.newPage();
  const seen = new Set(); let n = 0;
  pg.on('response', async (r) => {
    const u = r.url();
    if (!/googleusercontent\.com\/(p|gps-cs-s|geougc-cs|gps-proxy|grass-cs)\//.test(u)) return;
    const key = u.split('=')[0];
    try {
      const buf = await r.body();
      if (buf.length < 25000 || seen.has(key)) return;     // skip icons and avatars
      seen.add(key); n++;
      const id = 'p' + String(n).padStart(3, '0');
      fs.writeFileSync(`${out}/${id}.jpg`, buf);
      fs.appendFileSync(`${out}/sources.tsv`, `${id}.jpg\t${buf.length}\t${u}\n`);
    } catch (e) {}
  });
  const scroll = async (k) => { for (let i = 0; i < k; i++) { await pg.mouse.wheel(0, 900).catch(() => {}); await pg.waitForTimeout(700); } };
  const limit = setTimeout(() => { console.log(`${n} photos saved to ${out} (stopped at the 3 min limit)`); process.exit(0); }, 180000);

  // 1. search resolves to the place page; 2. open that place page fresh (that load carries the photos)
  await pg.goto('https://www.google.com/maps/search/' + encodeURIComponent(query), { waitUntil: 'domcontentloaded', timeout: 60000 }).catch(() => {});
  await pg.waitForTimeout(8000);
  const place = pg.url();
  if (/\/maps\/place\//.test(place)) {
    await pg.goto(place, { waitUntil: 'domcontentloaded', timeout: 60000 }).catch(() => {});
    await pg.waitForTimeout(8000);
  }
  await scroll(6);
  for (const label of ['Photos', 'See photos', 'All', 'Inside', 'Vibe', 'Food & drink']) {
    const el = await pg.$(`button:has-text("${label}"), [role="tab"]:has-text("${label}")`);
    if (el) { await el.click({ timeout: 5000 }).catch(() => {}); await pg.waitForTimeout(3000); await scroll(6); }
  }
  console.log(`${n} photos saved to ${out}${/\/maps\/place\//.test(place) ? '' : ' (no single place matched: add the address to the query)'}`);
  clearTimeout(limit);
  await b.close();
})();
