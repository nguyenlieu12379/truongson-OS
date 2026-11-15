// Film site engine: plays a rendered film as the visitor scrolls.
// Scroll down plays forward, scroll up plays back. Frames are WebP images
// drawn to a pinned canvas, with a soft blend between neighbouring frames.
// Panels fade in over their beat (data-in / data-out, 0 to 1 of the film).
// Shared by every film site: copy it as is. Per-site settings are in beats.js.
//
// Smoothness rules (what fixed slow-scroll stutter):
// 1. The canvas never holds more pixels than the film frames have. A 1280-wide
//    frame drawn into a 3840-wide canvas costs 9x the fill for no extra detail.
// 2. Frames near the playhead are decoded ahead into ImageBitmaps, so a draw
//    never waits on a WebP decode. Only a window around the playhead is kept,
//    so memory stays flat.
// 3. Redraw only when the picture would change: the blend is stepped in 1/24ths.
import cfg from './beats.js';

const N = cfg.frames;
const canvas = document.getElementById('film');
const ctx = canvas.getContext('2d', { alpha: false });
const loader = document.getElementById('loader');
const loaderBar = document.getElementById('loader-bar');
const progressBar = document.getElementById('progress-bar');
const panels = [...document.querySelectorAll('.panel')].map((el) => ({
  el,
  a: +el.dataset.in,
  b: +el.dataset.out,
}));
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

document.documentElement.style.setProperty('--film-bg', cfg.background);
document.getElementById('track').style.height = `${cfg.scrollScreens * 100}vh`;

// Pick the frame set once. Phones and slow connections get the smaller one.
const conn = navigator.connection || {};
const small = innerWidth < 820 || conn.saveData || /2g/.test(conn.effectiveType || '');
const base = small ? cfg.phone : cfg.desktop;
const SRC_W = small ? 854 : 1280;
const src = (i) => `${base}${String(i).padStart(cfg.pad, '0')}.webp`;

// ---------- loading: coarse pass first, then fill in ----------
const imgs = new Array(N);
const ready = new Uint8Array(N);
const order = [];
const seen = new Uint8Array(N);
for (const step of [32, 16, 8, 4, 2, 1]) {
  for (let i = 0; i < N; i += step) if (!seen[i]) { seen[i] = 1; order.push(i); }
}
if (!seen[N - 1]) order.push(N - 1);
let loaded = 0;
const coarse = order.findIndex((i, k) => k > 0 && i % 16 !== 0); // end of the 1-in-16 pass
const gate = coarse > 0 ? coarse : Math.min(order.length, 40);
let next = 0;
let dirty = true;

function loadOne() {
  if (next >= order.length) return;
  const i = order[next++];
  const im = new Image();
  im.decoding = 'async';
  im.onload = () => {
    ready[i] = 1;
    imgs[i] = im;
    loaded++;
    dirty = true;
    if (loader && !loader.hidden) {
      loaderBar.style.transform = `scaleX(${Math.min(1, loaded / gate)})`;
      if (loaded >= gate) {
        loader.classList.add('done');
        setTimeout(() => (loader.hidden = true), 400);
      }
    }
    loadOne();
  };
  im.onerror = () => { console.error('frame failed to load:', im.src); loadOne(); };
  im.src = src(i);
}
for (let k = 0; k < 6; k++) loadOne();

// ---------- decode-ahead window of ImageBitmaps ----------
const AHEAD = small ? 14 : 20;           // frames each side of the playhead
const bitmaps = new Map();               // frame -> ImageBitmap
const decoding = new Set();
const canBitmap = typeof createImageBitmap === 'function';
let lastCenter = -1;

function warm(center) {
  if (!canBitmap) return;
  center = Math.round(center);
  if (center === lastCenter && decoding.size) return;
  lastCenter = center;
  // drop bitmaps that left the window
  for (const [i, bm] of bitmaps) {
    if (Math.abs(i - center) > AHEAD + 4) { bm.close(); bitmaps.delete(i); }
  }
  // decode nearest first, a few at a time
  for (let d = 0; d <= AHEAD && decoding.size < 4; d++) {
    for (const i of d ? [center + d, center - d] : [center]) {
      if (i < 0 || i >= N || !ready[i] || bitmaps.has(i) || decoding.has(i)) continue;
      decoding.add(i);
      createImageBitmap(imgs[i]).then((bm) => {
        decoding.delete(i);
        if (Math.abs(i - lastCenter) > AHEAD + 4) { bm.close(); return; }
        bitmaps.set(i, bm);
        dirty = true;
      }, () => decoding.delete(i));
      if (decoding.size >= 4) break;
    }
  }
}
const pic = (i) => bitmaps.get(i) || imgs[i];

// nearest frame that has loaded (searching outward)
function nearest(i) {
  if (ready[i]) return i;
  for (let d = 1; d < N; d++) {
    if (i - d >= 0 && ready[i - d]) return i - d;
    if (i + d < N && ready[i + d]) return i + d;
  }
  return -1;
}

// ---------- canvas sizing and drawing ----------
let W = 0, H = 0, scale = 1;
function resize() {
  W = innerWidth; H = innerHeight;
  const portrait = H / W > 1.15;
  // width the film is shown at, in CSS px (cover on landscape, 62% height on portrait)
  const shownW = portrait ? Math.max(W, ((H * 0.62) * 16) / 9) : Math.max(W, (H * 16) / 9);
  // backing pixels per CSS px: up to the screen's density, but never past the frames' own detail
  scale = Math.max(0.5, Math.min(devicePixelRatio || 1, 2, SRC_W / shownW));
  canvas.width = Math.round(W * scale);
  canvas.height = Math.round(H * scale);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  dirty = true;
}
addEventListener('resize', resize);
resize();

// Landscape: cover the screen. Portrait: the film is 16:9, so covering would
// crop most of it. Show it large in the upper part instead and let the
// background colour take the rest, where the panels sit.
function frameRect(iw, ih) {
  const portrait = H / W > 1.15;
  const s = portrait ? Math.max(W / iw, (H * 0.62) / ih) : Math.max(W / iw, H / ih);
  const w = iw * s, h = ih * s;
  const x = (W - w) / 2;
  const y = portrait ? H * 0.4 - h / 2 : (H - h) / 2;
  return [x, y, w, h];
}

let shownKey = '';
function draw(pos) {
  const i0 = Math.floor(pos);
  const a = nearest(i0);
  if (a < 0) return;
  // blend amount, stepped so tiny scroll moves don't redraw identical pictures
  const blendNext = a === i0 && i0 + 1 < N && ready[i0 + 1];
  const t = blendNext ? Math.round((pos - i0) * 24) / 24 : 0;
  const key = `${a}|${t}|${bitmaps.has(a)}|${blendNext && bitmaps.has(i0 + 1)}|${W}x${H}`;
  if (key === shownKey) return;
  shownKey = key;

  const A = imgs[a];
  const [x, y, w, h] = frameRect(A.naturalWidth, A.naturalHeight);
  ctx.setTransform(scale, 0, 0, scale, 0, 0);
  ctx.globalAlpha = 1;
  ctx.fillStyle = cfg.background;
  ctx.fillRect(0, 0, W, H);
  ctx.drawImage(pic(a), x, y, w, h);
  if (t > 0) {
    ctx.globalAlpha = t;
    ctx.drawImage(pic(i0 + 1), x, y, w, h);
    ctx.globalAlpha = 1;
  }
}

// ---------- scroll ----------
function progress() {
  const max = document.documentElement.scrollHeight - innerHeight;
  return max > 0 ? Math.min(1, Math.max(0, scrollY / max)) : 0;
}

function updatePanels(p) {
  const fade = 0.012;
  for (const P of panels) {
    let o = 0;
    if (p >= P.a - fade && p <= P.b + fade) {
      o = Math.min(1, (p - (P.a - fade)) / fade, ((P.b + fade) - p) / fade);
    }
    o = Math.round(Math.max(0, o) * 100) / 100;
    if (o !== P.o) {
      P.o = o;
      P.el.style.opacity = o;
      P.el.style.transform = reduceMotion ? 'none' : `translate3d(0, ${((1 - o) * 14).toFixed(1)}px, 0)`;
      P.el.style.visibility = o > 0 ? 'visible' : 'hidden';
    }
  }
}

let pos = progress() * (N - 1);
let last = performance.now();
let lastBar = -1;

function tick(now) {
  const dt = Math.min(0.1, (now - last) / 1000);
  last = now;
  const target = progress() * (N - 1);
  // critically damped follow: smooth on wheel steps, still exact when it settles
  pos = reduceMotion ? target : pos + (target - pos) * (1 - Math.exp(-dt / 0.085));
  if (Math.abs(target - pos) < 0.01) pos = target;
  warm(pos + Math.sign(target - pos) * 2); // lean the decode window the way we're heading
  if (dirty) { shownKey = ''; dirty = false; }
  draw(pos);
  const p = pos / (N - 1);
  updatePanels(p);
  const bar = Math.round(p * 1000);
  if (bar !== lastBar) { lastBar = bar; progressBar.style.transform = `scaleX(${bar / 1000})`; }
  requestAnimationFrame(tick);
}
requestAnimationFrame(tick);
