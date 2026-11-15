// Film site engine: plays a rendered film as the visitor scrolls.
// Scroll down plays forward, scroll up plays back. Frames are WebP images
// drawn to a pinned canvas, with a soft blend between neighbouring frames.
// Panels fade in over their beat (data-in / data-out, 0 to 1 of the film).
// Shared by every film site: copy it as is. Per-site settings are in beats.js.
import cfg from './beats.js';

const N = cfg.frames;
const canvas = document.getElementById('film');
const ctx = canvas.getContext('2d');
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
let W = 0, H = 0, dpr = 1;
function resize() {
  dpr = Math.min(devicePixelRatio || 1, 2);
  W = innerWidth; H = innerHeight;
  canvas.width = Math.round(W * dpr);
  canvas.height = Math.round(H * dpr);
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

function draw(pos) {
  const i0 = Math.floor(pos);
  const t = pos - i0;
  const a = nearest(i0);
  if (a < 0) return;
  const A = imgs[a];
  const [x, y, w, h] = frameRect(A.naturalWidth, A.naturalHeight);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.globalAlpha = 1;
  ctx.fillStyle = cfg.background;
  ctx.fillRect(0, 0, W, H);
  ctx.drawImage(A, x, y, w, h);
  // soft blend into the next frame, only when both real neighbours are here
  if (t > 0.02 && a === i0 && i0 + 1 < N && ready[i0 + 1]) {
    ctx.globalAlpha = t;
    ctx.drawImage(imgs[i0 + 1], x, y, w, h);
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
    o = Math.max(0, o);
    if (o !== P.o) {
      P.o = o;
      P.el.style.opacity = o.toFixed(3);
      P.el.style.transform = reduceMotion ? 'none' : `translate3d(0, ${((1 - o) * 14).toFixed(1)}px, 0)`;
      P.el.style.visibility = o > 0 ? 'visible' : 'hidden';
    }
  }
}

let pos = progress() * (N - 1);
let last = performance.now();
let lastDrawn = -1;

function tick(now) {
  const dt = Math.min(0.1, (now - last) / 1000);
  last = now;
  const p = progress();
  const target = p * (N - 1);
  // critically damped follow: smooth on wheel steps, still exact when it settles
  pos = reduceMotion ? target : pos + (target - pos) * (1 - Math.exp(-dt / 0.085));
  if (Math.abs(target - pos) < 0.01) pos = target;
  if (dirty || Math.abs(pos - lastDrawn) > 0.004) {
    draw(pos);
    lastDrawn = pos;
    dirty = false;
  }
  updatePanels(pos / (N - 1));
  progressBar.style.transform = `scaleX(${(pos / (N - 1)).toFixed(4)})`;
  requestAnimationFrame(tick);
}
requestAnimationFrame(tick);
