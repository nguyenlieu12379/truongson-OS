// Scrubbed hero moment: draws a WebP frame sequence (made by scripts/hero_frames.sh) on a canvas,
// one frame per scroll position. Use for one or two moments only (the espresso pour, the door).
//
// Markup: a tall section with a sticky canvas inside.
//   <section class="hero-scrub" style="height:300vh">
//     <canvas style="position:sticky;top:0;width:100%;height:100vh;display:block"></canvas>
//   </section>
// Script:
//   import { scrub } from './scrub.js';
//   scrub(document.querySelector('.hero-scrub'), 'hero/pour/');   // folder with frames.json
//
// - Loads when the section is within two screens, never before. Phone set at 900 px wide or less.
// - Frames decode to ImageBitmaps once, so scrubbing never waits on the network or a decode.
// - Draws the nearest loaded frame while the rest arrive. Cover fit, sharp on retina.
// - Reduced motion: one still (the middle frame), no scrubbing.
export function scrub(section, base, { phoneMax = 900 } = {}) {
  const canvas = section.querySelector('canvas');
  const ctx = canvas.getContext('2d');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!base.endsWith('/')) base += '/';
  let frames = [], meta = null, want = 0, drawn = -1, raf = 0;

  const size = () => {
    const dpr = Math.min(devicePixelRatio || 1, 2), r = canvas.getBoundingClientRect();
    canvas.width = Math.round(r.width * dpr); canvas.height = Math.round(r.height * dpr); drawn = -1; draw();
  };
  const progress = () => {
    const r = section.getBoundingClientRect(), run = r.height - innerHeight;
    return run > 0 ? Math.min(1, Math.max(0, -r.top / run)) : 0;
  };
  const nearest = (i) => {
    for (let d = 0; d < frames.length; d++) {
      if (frames[i - d]) return i - d;
      if (frames[i + d]) return i + d;
    }
    return -1;
  };
  function draw() {
    raf = 0;
    if (!meta) return;
    const i = nearest(want);
    if (i < 0 || i === drawn) return;
    const img = frames[i], cw = canvas.width, ch = canvas.height;
    const s = Math.max(cw / img.width, ch / img.height), w = img.width * s, h = img.height * s;
    ctx.drawImage(img, (cw - w) / 2, (ch - h) / 2, w, h);
    drawn = i;
  }
  const onScroll = () => {
    if (!meta || reduced) return;
    want = Math.round(progress() * (meta.count - 1));
    if (!raf) raf = requestAnimationFrame(draw);
  };

  async function load() {
    meta = await (await fetch(base + 'frames.json')).json();
    const set = innerWidth <= phoneMax ? meta.phone : meta.desktop;
    const url = (n) => base + set.dir + '/' + meta.pattern.replace('%04d', String(n).padStart(4, '0'));
    frames = new Array(meta.count);
    want = reduced ? Math.floor(meta.count / 2) : Math.round(progress() * (meta.count - 1));
    // load order: the frame needed now, then a coarse pass (every 8th), then the rest
    const order = [want], seen = new Set(order);
    for (const step of [8, 1]) for (let i = 0; i < meta.count; i += step) if (!seen.has(i)) { seen.add(i); order.push(i); }
    const list = reduced ? [want] : order;
    let next = 0;
    const worker = async () => {
      while (next < list.length) {
        const i = list[next++];
        try {
          const blob = await (await fetch(url(i + 1))).blob();
          frames[i] = await createImageBitmap(blob);
          if (drawn < 0 || Math.abs(i - want) < Math.abs(drawn - want)) { drawn = -1; if (!raf) raf = requestAnimationFrame(draw); }
        } catch (e) { /* missing frame: nearest() covers it */ }
      }
    };
    await Promise.all(Array.from({ length: 6 }, worker));
  }

  new ResizeObserver(size).observe(canvas);
  const io = new IntersectionObserver((es) => {
    if (es.some((e) => e.isIntersecting)) { io.disconnect(); load(); }
  }, { rootMargin: '200% 0px' });
  io.observe(section);
  addEventListener('scroll', onScroll, { passive: true });
  size();
}
