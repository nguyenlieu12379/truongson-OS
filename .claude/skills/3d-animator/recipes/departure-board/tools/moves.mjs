// prints the film's camera moves and the holds between them (reads window.__kf from the page)
import puppeteer from 'puppeteer-core'; import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path';
const root = process.cwd(), shot = process.argv[2] || 'board';
const srv = http.createServer((q, r) => { const f = path.join(root, decodeURIComponent(q.url.split('?')[0])); fs.readFile(f, (e, d) => { if (e) { r.writeHead(404); r.end(); return; } r.writeHead(200, { 'content-type': f.endsWith('.js') || f.endsWith('.mjs') ? 'text/javascript' : f.endsWith('.html') ? 'text/html' : 'application/octet-stream' }); r.end(d); }); }).listen(0);
const port = srv.address().port;
const b = await puppeteer.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: 'new', args: ['--enable-gpu', '--use-angle=metal'] });
const pg = await b.newPage(); pg.on('pageerror', (e) => console.log('PAGE ERROR', e.message)); pg.on('console', (m) => { if (m.type() === 'error') console.log('console:', m.text()); });
await pg.goto(`http://127.0.0.1:${port}/index.html?render=1&shots=${shot}`, { waitUntil: 'load' }); await pg.waitForFunction('window.renderAt', { timeout: 60000 });
const kf = await pg.evaluate(() => { const k = window.__kf; return { moves: k.moves, words: k.words, end: k.end, on: k.on, rattles: k.rattles, lands: k.lands, ev: k.ev, gapPath: k.gapPath }; });
let prev = 0; const out = [];
for (const [a, z, k, tag] of kf.moves) { out.push(`hold ${String(Math.round((a - prev) * 30)).padStart(3)} fr | ${k.padEnd(5)} ${a.toFixed(2)} -> ${z.toFixed(2)} (${Math.round((z - a) * 30)} fr) ${tag}`); prev = z; }
console.log(out.join('\n')); console.log(`end hold ${Math.round((kf.end - prev) * 30)} fr | ${kf.moves.length} moves in ${kf.end} s = ${(kf.moves.length / kf.end).toFixed(2)} per second`);
fs.mkdirSync('out', { recursive: true }); fs.writeFileSync(`out/${shot}_kf.json`, JSON.stringify(kf)); await b.close(); srv.close();
