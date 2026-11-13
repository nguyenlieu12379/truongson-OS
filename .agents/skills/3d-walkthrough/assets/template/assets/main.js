import { createWalkthrough } from './engine.js';
import spec from './spec.js';
import site from './site.js';

// Chapter nav comes from stops that have a `chapter` label.
const nav = document.querySelector('.chapters');
for (const s of spec.stops.filter((s) => s.chapter)) {
  const b = document.createElement('button');
  b.textContent = s.chapter;
  b.dataset.jump = s.p;
  nav.append(b);
}

try {
  createWalkthrough({ canvas: document.getElementById('scene'), spec, site });
} catch (e) {
  document.body.insertAdjacentHTML('beforeend', '<p class="noscript">This experience needs WebGL.</p>');
  throw e;
}
