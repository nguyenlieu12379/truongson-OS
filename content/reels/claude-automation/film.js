// "Automate properly with Claude Code" (45 s, 9:16). Built from the 3d-animator starter.
// Contract for the renderer: window.total, window.renderAt(t, n). Everything is a pure function of t.
// The clock comes from the voice: timing.js (generated) -> timeline.js (sections, beats, screen ops).
import * as THREE from 'three';
import { FullScreenQuad } from 'three/addons/postprocessing/Pass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { W, H, clamp, lerp, seg, smooth, easeOut, easeInOut, backOut, spring, halton, hash } from './lib.js';
import { setStyle } from './styles.js';
import { WORDS, LINES } from './timing.js';
import { total, SEC, SECTIONS, EV, OPS, CHAR } from './timeline.js';

export { total };
const SHUTTER = 0.5 / 30;
const V = (x, y, z) => new THREE.Vector3(x, y, z);

// ---------- renderer ----------
const stage = document.getElementById('stage');
const renderer = new THREE.WebGLRenderer({ canvas: stage, antialias: false, preserveDrawingBuffer: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(1); renderer.setSize(W, H, false);
renderer.toneMapping = THREE.NoToneMapping; renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFShadowMap;
const rt = new THREE.WebGLRenderTarget(W, H, { type: THREE.HalfFloatType, samples: 4 });
const accum = new THREE.WebGLRenderTarget(W, H, { type: THREE.HalfFloatType, depthBuffer: false });

// ---------- set ----------
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x05040a);
const mat = (color, roughness = 0.7, metalness = 0) => new THREE.MeshStandardMaterial({ color, roughness, metalness });
function add(geo, material, x, y, z, parent = scene) { const m = new THREE.Mesh(geo, material); m.position.set(x, y, z); m.castShadow = m.receiveShadow = true; parent.add(m); return m; }
const boxG = (w, h, d) => new THREE.BoxGeometry(w, h, d);
const canvasTex = (w, h) => { const c = Object.assign(document.createElement('canvas'), { width: w, height: h }); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return [c, c.getContext('2d'), t]; };

add(new THREE.PlaneGeometry(8, 4), mat(0xcdb8a0, 0.92), 0, 1.0, -0.9);            // wall
add(boxG(2.6, 0.05, 1.1), mat(0x7a4a2a, 0.55), 0, -0.025, 0);                      // desk top (y = 0 is the desk surface)
add(new THREE.PlaneGeometry(8, 6), mat(0x2a201a, 0.9), 0, -0.75, 0).rotation.x = -Math.PI / 2;
// soft contact patches so props sit on the desk
const shadowMat = new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.35, depthWrite: false });
const patch = (x, z, r) => { const m = new THREE.Mesh(new THREE.CircleGeometry(r, 32), shadowMat); m.rotation.x = -Math.PI / 2; m.position.set(x, 0.0008, z); scene.add(m); return m; };

// retro computer (pops in at the start)
const beige = mat(0xd8ccb2, 0.62);
const pc = new THREE.Group(); pc.position.set(-0.08, 0, -0.05); scene.add(pc);
add(boxG(0.46, 0.07, 0.42), beige, 0, 0.035, 0, pc);
add(boxG(0.44, 0.36, 0.40), beige, 0, 0.25, -0.01, pc);
add(boxG(0.36, 0.27, 0.02), mat(0x16130f, 0.4), 0, 0.26, 0.19, pc);
const [, sctx, screenTex] = canvasTex(640, 480);
const screenMat = new THREE.MeshBasicMaterial({ map: screenTex, color: new THREE.Color(1.7, 1.7, 1.7) });
add(new THREE.PlaneGeometry(0.32, 0.24), screenMat, 0, 0.26, 0.2015, pc).castShadow = false;
add(boxG(0.1, 0.012, 0.004), mat(0x16130f, 0.5), 0.12, 0.035, 0.211, pc);         // floppy drive slot (front of the base)
const ledMat = new THREE.MeshBasicMaterial({ color: 0x103010 }); add(boxG(0.008, 0.005, 0.003), ledMat, 0.19, 0.035, 0.212, pc);
const pcPatch = patch(-0.08, -0.05, 0.3);

// sticky note on the bezel
const [, stg, stickyTex] = canvasTex(256, 256);
stg.fillStyle = '#ffe36e'; stg.fillRect(0, 0, 256, 256); stg.fillStyle = '#3a2a10'; stg.font = 'bold 58px "Segoe Print", "Comic Sans MS", sans-serif'; stg.textAlign = 'center';
stg.fillText('every', 128, 110); stg.fillText('week!', 128, 185); stickyTex.needsUpdate = true;
const sticky = new THREE.Group(); sticky.position.set(0.155, 0.37, 0.202); pc.add(sticky);
add(new THREE.PlaneGeometry(0.075, 0.075), new THREE.MeshStandardMaterial({ map: stickyTex, roughness: 0.9 }), 0, -0.0375, 0, sticky).castShadow = false;

// floppy disk (slides into the drive on "skill")
const floppy = new THREE.Group(); pc.add(floppy);
add(boxG(0.09, 0.0034, 0.094), mat(0x2b3440, 0.45), 0, 0, 0, floppy);
add(boxG(0.05, 0.0036, 0.03), mat(0xb8bcc2, 0.3, 0.8), 0, 0, -0.03, floppy);     // metal shutter (front edge goes in first)
const [, lg, labTex] = canvasTex(256, 160);
lg.fillStyle = '#f4efe2'; lg.fillRect(0, 0, 256, 160); lg.fillStyle = '#1b1b1b'; lg.font = 'bold 44px Consolas, monospace'; lg.fillText('SKILL.md', 22, 92); labTex.needsUpdate = true;
const lab = add(new THREE.PlaneGeometry(0.07, 0.044), new THREE.MeshStandardMaterial({ map: labTex, roughness: 0.8 }), 0, 0.0019, 0.022, floppy); lab.rotation.x = -Math.PI / 2; lab.castShadow = false;

// keyboard: keys dip while the screen types
const kb = new THREE.Group(); kb.position.set(-0.08, 0, 0.34); scene.add(kb);
add(boxG(0.42, 0.022, 0.15), beige, 0, 0.011, 0, kb);
const keys = new THREE.InstancedMesh(boxG(0.026, 0.014, 0.026), mat(0xe9e1cf, 0.5), 48); keys.castShadow = keys.receiveShadow = true; kb.add(keys);
const keyM = new THREE.Matrix4();
const kbPatch = patch(-0.08, 0.34, 0.2);

// mug
const mug = new THREE.Group(); mug.position.set(0.19, 0, 0.21); scene.add(mug);
const mugBody = add(new THREE.CylinderGeometry(0.042, 0.038, 0.095, 40), mat(0x2f5d73, 0.35), 0, 0.0475, 0, mug);
add(new THREE.TorusGeometry(0.025, 0.007, 12, 24, Math.PI), mat(0x2f5d73, 0.35), 0.045, 0.05, 0, mug).rotation.z = -Math.PI / 2;
patch(0.19, 0.21, 0.05);

// plant
const plant = new THREE.Group(); plant.position.set(-0.4, 0, -0.22); scene.add(plant);
add(new THREE.CylinderGeometry(0.07, 0.055, 0.11, 32), mat(0xb5643a, 0.8), 0, 0.055, 0, plant);
const leafMat = mat(0x4d7a36, 0.6), leaves = [];
for (let i = 0; i < 11; i++) {
  const pivot = new THREE.Group(); pivot.position.y = 0.1; pivot.rotation.y = i * 2.4; plant.add(pivot);
  const leaf = add(new THREE.SphereGeometry(1, 16, 10), leafMat, 0, 0, 0.07, pivot); leaf.scale.set(0.022, 0.006, 0.075);
  pivot.userData.tilt = 0.5 + 0.35 * hash(i); leaves.push(pivot);
}
patch(-0.4, -0.22, 0.08);

// wall clock (spins to 9:00 on "schedule")
const clock = new THREE.Group(); clock.position.set(-0.08, 0.74, -0.885); scene.add(clock);
add(new THREE.CylinderGeometry(0.11, 0.11, 0.025, 48), mat(0x1d1d22, 0.4, 0.5), 0, 0, 0, clock).rotation.x = Math.PI / 2;
add(new THREE.CylinderGeometry(0.098, 0.098, 0.004, 48), mat(0xf1ead8, 0.8), 0, 0, 0.012, clock).rotation.x = Math.PI / 2;
for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2, l = i % 3 ? 0.012 : 0.022; const m = add(boxG(0.005, l, 0.002), mat(0x1d1d22), Math.sin(a) * (0.088 - l / 2), Math.cos(a) * (0.088 - l / 2), 0.015, clock); m.rotation.z = -a; }
const hand = (len, wdt) => { const p = new THREE.Group(); p.position.z = 0.017; clock.add(p); add(boxG(wdt, len, 0.003), mat(0x1d1d22, 0.4), 0, len / 2 - 0.01, 0, p); return p; };
const hourHand = hand(0.055, 0.008), minHand = hand(0.08, 0.005);
add(new THREE.CylinderGeometry(0.006, 0.006, 0.006, 16), mat(0xc0392b, 0.4), 0, 0, 0.02, clock).rotation.x = Math.PI / 2;

// desk lamp
function rod(a, b, r, material, parent) { const d = b.clone().sub(a), m = add(new THREE.CylinderGeometry(r, r, d.length(), 12), material, 0, 0, 0, parent); m.position.copy(a).lerp(b, 0.5); m.quaternion.setFromUnitVectors(V(0, 1, 0), d.normalize()); return m; }
const lampMat = mat(0x1d1d22, 0.35, 0.6), lamp = new THREE.Group(); lamp.position.set(0.62, 0, -0.3); scene.add(lamp);
const ELBOW = V(0.07, 0.31, -0.03), HEAD = V(-0.15, 0.45, 0.12);
add(new THREE.CylinderGeometry(0.07, 0.08, 0.02, 32), lampMat, 0, 0.01, 0, lamp);
rod(V(0, 0.02, 0), ELBOW, 0.008, lampMat, lamp); rod(ELBOW, HEAD, 0.008, lampMat, lamp);
const head = add(new THREE.ConeGeometry(0.06, 0.1, 32, 1, true), new THREE.MeshStandardMaterial({ color: 0x1d1d22, roughness: 0.35, metalness: 0.6, side: THREE.DoubleSide }), HEAD.x, HEAD.y, HEAD.z, lamp);
head.rotation.set(-0.35, 0, -0.65);
const bulbMat = new THREE.MeshBasicMaterial({ color: 0xffffff }), bulb = new THREE.Mesh(new THREE.SphereGeometry(0.018, 16, 12), bulbMat); bulb.position.set(0, -0.035, 0); head.add(bulb);

// blinds out of frame: the sun paints stripes on the wall
const SUN_POS = V(-3.2, 2.3, 1.4), SUN_AT = V(0.1, 0.45, -0.9);
const blinds = new THREE.Group(); blinds.position.copy(SUN_AT).lerp(SUN_POS, 0.5); blinds.lookAt(SUN_AT); scene.add(blinds);
for (let i = 0; i < 18; i++) { const s = new THREE.Mesh(boxG(2.4, 0.045, 0.01), mat(0xffffff)); s.position.y = (i - 8.5) * 0.095; s.castShadow = true; blinds.add(s); }

// dust
const DUST = 320, dustPos = new Float32Array(DUST * 3), dustGeo = new THREE.BufferGeometry();
dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPos, 3));
scene.add(new THREE.Points(dustGeo, new THREE.PointsMaterial({ color: new THREE.Color(1.6, 1.25, 0.9), size: 0.0028, transparent: true, opacity: 0.55, blending: THREE.AdditiveBlending, depthWrite: false })));

// ---------- lights ----------
const sun = new THREE.DirectionalLight(0xffc285, 5.5); sun.target.position.copy(SUN_AT); scene.add(sun, sun.target);
sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048); Object.assign(sun.shadow.camera, { left: -2.2, right: 2.2, top: 2.2, bottom: -2.2, near: 0.5, far: 9 }); sun.shadow.bias = -0.0004;
const sky = new THREE.DirectionalLight(0x9db8ff, 0.55); sky.target.position.set(0, 0.2, 0); scene.add(sky, sky.target);
sky.castShadow = true; sky.shadow.mapSize.set(1024, 1024); Object.assign(sky.shadow.camera, { left: -2, right: 2, top: 2, bottom: -2, near: 0.5, far: 10 }); sky.shadow.bias = -0.0006;
const lampLight = new THREE.SpotLight(0xffb36b, 0, 3, 0.75, 0.6, 2); scene.add(lampLight, lampLight.target);
lampLight.castShadow = true; lampLight.shadow.mapSize.set(1024, 1024); lampLight.shadow.bias = -0.0005;
scene.add(new THREE.AmbientLight(0x30303a, 0.15));

// ---------- the screen: redrawn from t using the timeline's ops ----------
const sectionAt = (t) => SECTIONS.find((s) => t >= s.a && t < s.b) || SECTIONS[SECTIONS.length - 1];
const typingNow = (t) => OPS.some((o) => o.kind === 'type' && t >= o.at && t < o.at + o.text.length * CHAR);
const font = (px) => `bold ${px}px Consolas, Menlo, monospace`;
function drawScreen(t) {
  const c = sctx, sec = sectionAt(t);
  c.globalAlpha = 1; c.fillStyle = '#0b1a12'; c.fillRect(0, 0, 640, 480); c.textBaseline = 'alphabetic';
  if (sec.name === 'hook' && t > 0.42) { const k = backOut(seg(t, 0.42, 0.6)); c.save(); c.translate(320, 205); c.scale(k, k); c.strokeStyle = '#5f9c77'; c.lineWidth = 3; c.beginPath(); c.roundRect(-270, -85, 540, 150, 24); c.stroke(); c.restore(); }
  for (const o of OPS) {
    if (o.sec !== sec.name || t < o.at) continue;
    c.globalAlpha = 1;
    if (o.kind === 'type') {
      const n = clamp(Math.floor((t - o.at) / CHAR) + 1, 0, o.text.length), done = n === o.text.length;
      c.font = font(o.size); c.fillStyle = o.color; c.fillText(o.text.slice(0, n), o.x, o.y);
      const blink = Math.floor(t * 2.5) % 2 === 0;
      if (!done || (o.cursor && blink)) { const x = o.x + c.measureText(o.text.slice(0, n)).width + 4; c.fillRect(x, o.y - o.size * 0.78, o.size * 0.55, o.size * 0.9); }   // full-cell block cursor
    } else if (o.kind === 'pop' || o.kind === 'tick') {
      const k = seg(t, o.at, o.at + 0.2), s = backOut(k);
      if (o.box) { c.globalAlpha = k; c.strokeStyle = o.color; c.lineWidth = 3; const [bx, by, bw, bh] = o.box; c.strokeRect(bx, by, bw, bh); }
      if (o.wire) { c.globalAlpha = k; c.strokeStyle = '#5f9c77'; c.lineWidth = 3; c.beginPath(); c.moveTo(o.box[0] + o.box[2] / 2, o.box[1]); c.lineTo(320, 298); c.stroke(); }
      c.save(); c.globalAlpha = k; c.translate(o.x, o.y); c.scale(s, s); c.font = font(o.size); c.fillStyle = o.color;
      if (o.kind === 'tick') { c.strokeStyle = o.color; c.lineWidth = 4; c.strokeRect(0, -o.size * 0.8, o.size * 0.85, o.size * 0.85); c.fillStyle = '#ffcf6b'; c.fillText('✓', 4, -2); c.fillStyle = o.color; c.fillText(o.text, o.size * 1.25, 0); }
      else c.fillText(o.text, 0, 0);
      c.restore();
    } else if (o.kind === 'strike') {
      const k = easeOut(seg(t, o.at, o.at + 0.15)); c.strokeStyle = '#ff4a3d'; c.lineWidth = 7; c.beginPath(); c.moveTo(o.x, o.y); c.lineTo(o.x + o.w * k, o.y - 6 * k); c.stroke();
    } else if (o.kind === 'bar') {
      const k = easeInOut(seg(t, o.at, o.end)); c.font = font(34); c.fillStyle = '#b9ffd1';
      c.fillText(k < 1 ? o.text + '.'.repeat(1 + Math.floor(t * 4) % 3) : 'DONE ✓', o.x, o.y + 10);
      c.strokeStyle = '#b9ffd1'; c.lineWidth = 3; c.strokeRect(o.x, o.y + 25, o.w, 34); c.fillRect(o.x + 6, o.y + 31, (o.w - 12) * k, 22);
    }
  }
  const wipe = seg(t, sec.a, sec.a + 0.12); if (sec.a > 0 && wipe < 1) { c.globalAlpha = 0.5 * (1 - wipe); c.fillStyle = '#b9ffd1'; c.fillRect(0, 0, 640, 480); }   // brief phosphor flash on each new rule
  c.globalAlpha = 1;
  for (let y = 0; y < 480; y += 4) { c.fillStyle = 'rgba(0,0,0,0.18)'; c.fillRect(0, y, 640, 2); }
  screenTex.needsUpdate = true;
}

// ---------- animation ----------
const pop = (t, a) => (t < a ? 0.0001 : Math.max(0.0001, backOut(seg(t, a, a + 0.25))));
const lampOn = (t) => { const a = EV.lampOn; return t < a ? 0 : t < a + 0.12 ? (Math.floor(t * 60) % 2) * 0.6 : t < a + 0.2 ? 0.2 : smooth(seg(t, a + 0.2, a + 0.35)); };
function pose(t) {
  // hook: computer pops in, keyboard lands 0.2 s later, both squash and settle
  const sp = pop(t, EV.pcPop), sq = 0.1 * spring(t, EV.pcPop + 0.25, 5, 7);
  pc.scale.set(sp * (1 - sq * 0.5), sp * (1 + sq), sp * (1 - sq * 0.5)); pcPatch.scale.setScalar(Math.min(1, sp));
  const kp = pop(t, EV.kbPop), kq = 0.1 * spring(t, EV.kbPop + 0.25, 5, 7);
  kb.scale.set(kp * (1 - kq * 0.5), kp * (1 + kq), kp * (1 - kq * 0.5)); kbPatch.scale.setScalar(Math.min(1, kp));
  // keys dip while typing
  const down = typingNow(t) ? Math.floor(hash(Math.floor(t * 15)) * 48) : -1;
  for (let i = 0; i < 48; i++) { const col = i % 12, r = Math.floor(i / 12); keyM.makeTranslation(-0.165 + col * 0.03, 0.028 - (i === down ? 0.004 : 0), -0.05 + r * 0.032); keys.setMatrixAt(i, keyM); }
  keys.instanceMatrix.needsUpdate = true;
  const on = lampOn(t); lampLight.intensity = 6 * on; bulbMat.color.setScalar(0.15 + 6 * on);
  // sticky note pops onto the bezel with a little wobble
  const ss = pop(t, EV.sticky); sticky.scale.setScalar(ss); sticky.rotation.z = -0.12 + 0.15 * spring(t, EV.sticky + 0.2, 3, 5);
  // floppy: appears in front of the drive, then slides in on "skill"
  const fa = EV.floppy - 0.55, fIn = easeInOut(seg(t, EV.floppy, EV.floppy + 0.3));
  floppy.scale.setScalar(pop(t, fa)); floppy.position.set(0.12, 0.035, lerp(0.211 + 0.047 + 0.09, 0.211 + 0.047 - 0.075, fIn));
  floppy.visible = t >= fa; const led = t > EV.floppy + 0.3 && t < EV.floppy + 1.6 && Math.floor(t * 10) % 2 === 0; ledMat.color.setRGB(led ? 0.4 : 0.06, led ? 2.2 : 0.18, led ? 0.4 : 0.06);
  // clock: 8:20 -> 9:00 on "schedule", lands with a spring
  const ck = easeInOut(seg(t, EV.clock, EV.clock + 0.8)) + 0.02 * spring(t, EV.clock + 0.8, 4, 6), mins = 500 + 40 * ck;
  minHand.rotation.z = -(mins % 60) / 60 * Math.PI * 2; hourHand.rotation.z = -(mins / 60 % 12) / 12 * Math.PI * 2;
  // mug hops when the run finishes
  const hop = seg(t, EV.mugHop, EV.mugHop + 0.3), air = Math.sin(Math.PI * hop) * 0.045;
  const squash = -0.12 * Math.exp(-((t - (EV.mugHop - 0.05)) ** 2) / 0.002) + 0.10 * spring(t, EV.mugHop + 0.3, 6, 9);
  mug.position.y = air; mugBody.scale.set(1 - squash * 0.5, 1 + squash, 1 - squash * 0.5);
  for (let i = 0; i < leaves.length; i++) leaves[i].rotation.x = -leaves[i].userData.tilt - 0.03 * Math.sin(t * 1.1 + i);
  for (let i = 0; i < DUST; i++) {
    const a = hash(i) * 6.28, s = 0.15 + 0.2 * hash(i + 99), dir = hash(i + 5) < 0.33 ? -1 : 1;
    dustPos[i * 3] = -0.7 + 1.4 * hash(i + 1) + 0.03 * Math.sin(t * s + a);
    dustPos[i * 3 + 1] = 0.05 + 1.2 * hash(i + 2) + ((dir * t * 0.024 * (0.5 + hash(i + 3))) % 0.4);
    dustPos[i * 3 + 2] = -0.85 + 1.4 * hash(i + 4) + 0.03 * Math.cos(t * s * 0.8 + a);
  }
  dustGeo.attributes.position.needsUpdate = true;
}

// ---------- camera: one lens; each move is one Bezier curve with one eased progress value ----------
const camera = new THREE.PerspectiveCamera(42, W / H, 0.02, 30);
const K = [   // [eye, look] keyframes
  [V(0.25, 0.62, 1.8), V(-0.05, 0.32, -0.1)],    // wide, high
  [V(0.0, 0.36, 1.15), V(-0.08, 0.31, 0.12)],    // screen, clock above, keys below
  [V(-0.2, 0.36, 1.05), V(-0.04, 0.3, 0.12)],    // 1: dolly left, sticky note in view
  [V(0.1, 0.22, 1.02), V(-0.07, 0.22, 0.12)],    // 2: low right, the drive
  [V(-0.08, 0.29, 1.0), V(-0.08, 0.27, 0.15)],   // 3: push toward the screen (whole screen stays in a 9:16 frame)
  [V(0.02, 0.44, 1.28), V(-0.06, 0.42, -0.1)],   // 4: pull back and rise, clock in frame
  [V(0.12, 0.4, 1.18), V(-0.04, 0.36, 0.02)],    // 5: right, clock and screen
  [V(0.06, 0.3, 1.1), V(-0.05, 0.24, 0.1)],      // fix: slow drift toward the mug
  [V(-0.08, 0.27, 0.88), V(-0.08, 0.26, 0.15)],  // ending: push into the screen
];
const BEND = [V(0.12, 0.05, 0), V(-0.06, 0, 0.05), V(0.1, -0.04, 0.05), V(-0.05, 0.02, -0.04), V(0.05, 0.06, 0.05), V(0.08, -0.02, 0.06), V(0.02, 0, 0.01), V(-0.06, 0.01, 0.04)];
const TIMES = [[0, SEC.intro + 1.0], [SEC.s1 - 0.3, SEC.s1 + 1.5], [SEC.s2 - 0.3, SEC.s2 + 1.6], [SEC.s3 - 0.3, SEC.s3 + 1.6], [SEC.s4 - 0.3, SEC.s4 + 1.6], [SEC.s5 - 0.3, SEC.s5 + 1.8], [SEC.fix - 0.2, SEC.fix + 2.6], [SEC.cta, total - 0.3]];
const RAILS = TIMES.map((_, i) => { const a = K[i][0], b = K[i + 1][0]; return new THREE.CubicBezierCurve3(a, a.clone().lerp(b, 1 / 3).add(BEND[i]), a.clone().lerp(b, 2 / 3).add(BEND[i]), b); });
const eye = V(0, 0, 0), look = V(0, 0, 0), right = V(0, 0, 0), up = V(0, 0, 0);
function shoot(t, k, n) {
  let i = 0; while (i < TIMES.length - 1 && t >= TIMES[i + 1][0]) i++;
  const p = easeInOut(seg(t, TIMES[i][0], TIMES[i][1]));
  RAILS[i].getPoint(p, eye); look.copy(K[i][1]).lerp(K[i + 1][1], p);
  camera.position.copy(eye); camera.up.set(0, 1, 0); camera.lookAt(look); camera.updateMatrixWorld(); camera.updateProjectionMatrix();
  if (n === 1) return;
  const F = eye.distanceTo(look), lens = lerp(0.006, 0.004, clamp((1.4 - F) / 0.8));   // focus on what we look at
  const a = Math.sqrt(halton(k + 1, 2)) * lens, b = halton(k + 1, 3) * Math.PI * 2, lx = Math.cos(b) * a, ly = Math.sin(b) * a;
  right.setFromMatrixColumn(camera.matrixWorld, 0); up.setFromMatrixColumn(camera.matrixWorld, 1);
  camera.position.addScaledVector(right, lx).addScaledVector(up, ly); camera.updateMatrixWorld();
  const e = camera.projectionMatrix.elements, jx = halton(k + 1, 5) - 0.5, jy = halton(k + 1, 7) - 0.5;
  e[8] += -e[0] * lx / F + 2 * jx / W; e[9] += -e[5] * ly / F + 2 * jy / H;
  camera.projectionMatrixInverse.copy(camera.projectionMatrix).invert();
}
function jitterLights(k, n) {
  const s = n > 1 ? 0.18 : 0;
  sun.position.set(SUN_POS.x + (halton(k + 1, 11) - 0.5) * s, SUN_POS.y + (halton(k + 1, 13) - 0.5) * s, SUN_POS.z + (halton(k + 1, 17) - 0.5) * s);
  const h1 = n > 1 ? halton(k + 1, 19) : 0.5, h2 = n > 1 ? halton(k + 1, 23) : 0.3, phi = h2 * Math.PI * 2, c = Math.sqrt(h1), r = Math.sqrt(1 - h1);
  sky.position.set(Math.cos(phi) * r * 4, c * 4 + 0.3, Math.sin(phi) * r * 4 + 1.0);
  bulb.getWorldPosition(lampLight.position); const j = n > 1 ? 0.025 : 0;
  lampLight.position.x += (halton(k + 1, 29) - 0.5) * j; lampLight.position.z += (halton(k + 1, 31) - 0.5) * j;
  lampLight.target.position.set(0.19, 0, 0.18);
}

// ---------- captions: short chunks from the voice's words, each word lands as it's said ----------
const EMPH = new Set(['chatbot.', 'automate', 'One', 'task.', 'skill.', 'tools.', 'MCP,', 'script.', 'work.', 'trigger.', 'AUTOMATE']);
const CHUNKS = [];
for (let l = 0; l < LINES.length; l++) {
  const ws = WORDS.filter((x) => x[3] === l); let cur = [];
  ws.forEach((x, i) => {
    cur.push(x);
    const last = i === ws.length - 1, stop = /[.?]$/.test(x[0]), comma = /,$/.test(x[0]);
    if (last || stop || cur.length === 4 || (comma && cur.length >= 2)) { CHUNKS.push(cur); cur = []; }
  });
}
CHUNKS.forEach((c, i) => { c.a = c[0][1] - 0.05; c.b = i + 1 < CHUNKS.length ? Math.min(CHUNKS[i + 1][0][1] - 0.05, c[c.length - 1][2] + 0.6) : total; });
const [, cg, capTex] = canvasTex(W, H);
const CAP_Y = 1460, CAP_FONT = '800 68px "Segoe UI", -apple-system, Helvetica, Arial, sans-serif';
function drawCaption(t) {
  cg.clearRect(0, 0, W, H); const c = CHUNKS.find((x) => t >= x.a && t < x.b); if (!c) { capTex.needsUpdate = true; return; }
  cg.font = CAP_FONT; cg.textBaseline = 'middle';
  const txt = c.map((x) => x[0]).join(' '), tw = cg.measureText(txt).width, k = backOut(seg(t, c.a, c.a + 0.15)), fade = 1 - seg(t, c.b - 0.08, c.b);
  cg.save(); cg.globalAlpha = fade; cg.translate(W / 2, CAP_Y); cg.scale(0.9 + 0.1 * k, 0.9 + 0.1 * k);
  cg.fillStyle = 'rgba(246,238,220,0.96)'; cg.shadowColor = 'rgba(0,0,0,.35)'; cg.shadowBlur = 24; cg.beginPath(); cg.roundRect(-tw / 2 - 34, -58, tw + 68, 116, 26); cg.fill(); cg.shadowBlur = 0;
  let x = -tw / 2;
  for (const [wd, at] of c) {
    const kw = seg(t, at - 0.03, at + 0.06);     // land a frame before the word
    cg.globalAlpha = fade * (0.18 + 0.82 * kw); cg.fillStyle = EMPH.has(wd) ? '#c0392b' : '#1e1a14'; cg.fillText(wd, x, 4 + 8 * (1 - backOut(kw)));
    x += cg.measureText(wd + ' ').width;
  }
  cg.restore(); capTex.needsUpdate = true;
}

// ---------- post ----------
const vert = 'varying vec2 vUv; void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }';
const addPass = new FullScreenQuad(new THREE.ShaderMaterial({ uniforms: { tex: { value: null }, w: { value: 1 } }, vertexShader: vert,
  fragmentShader: 'uniform sampler2D tex; uniform float w; varying vec2 vUv; void main() { gl_FragColor = vec4(texture2D(tex, vUv).rgb * w, 1.0); }',
  blending: THREE.CustomBlending, blendSrc: THREE.OneFactor, blendDst: THREE.OneFactor, blendEquation: THREE.AddEquation, depthTest: false, depthWrite: false, transparent: true }));
const bloom = new UnrealBloomPass(new THREE.Vector2(W, H), 0.2, 0.4, 0.9);
const grade = new FullScreenQuad(new THREE.ShaderMaterial({ uniforms: { tex: { value: accum.texture }, cap: { value: capTex }, seed: { value: 0 }, exposure: { value: 1 } }, vertexShader: vert,
  fragmentShader: `uniform sampler2D tex, cap; uniform float seed, exposure; varying vec2 vUv;
    float h(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233)) + seed) * 43758.5453); }
    vec3 aces(vec3 x) { return clamp(x * (2.51 * x + 0.03) / (x * (2.43 * x + 0.59) + 0.14), 0.0, 1.0); }
    vec3 srgb(vec3 c) { return mix(c * 12.92, 1.055 * pow(max(c, vec3(0.0)), vec3(1.0 / 2.4)) - 0.055, step(0.0031308, c)); }
    void main() {
      vec2 d = vUv - 0.5; float ca = dot(d, d) * 0.008;
      vec3 c = vec3(texture2D(tex, vUv + d * ca).r, texture2D(tex, vUv).g, texture2D(tex, vUv - d * ca).b) * exposure;
      c = aces(c);
      c *= mix(1.0, 0.6, smoothstep(0.35, 0.95, length(d * vec2(0.8, 1.0)) * 1.45));
      c = srgb(c);
      c += (h(vUv * 1000.0) - 0.5) * 0.03 * (1.0 - 0.55 * dot(c, vec3(0.33)));
      vec4 k = texture2D(cap, vUv); c = c * (1.0 - k.a) + k.rgb;
      gl_FragColor = vec4(c, 1.0); }`, depthTest: false, depthWrite: false }));

setStyle(new URLSearchParams(location.search).get('style') || 'lit', { scene, key: sun, fill: sky, bloom, neonAt: V(0.52, 0.5, -0.88) });

export function renderAt(t, n = 1) {
  drawScreen(t); drawCaption(t);
  renderer.setRenderTarget(accum); renderer.setClearColor(0x000000, 1); renderer.clear();
  for (let k = 0; k < n; k++) {
    const ts = n === 1 ? t : t + ((k + 0.5) / n - 0.5) * SHUTTER;
    pose(ts); shoot(ts, k, n); jitterLights(k, n);
    renderer.setRenderTarget(rt); renderer.render(scene, camera);
    addPass.material.uniforms.tex.value = rt.texture; addPass.material.uniforms.w.value = 1 / n;
    renderer.setRenderTarget(accum); renderer.autoClear = false; addPass.render(renderer); renderer.autoClear = true;
  }
  bloom.render(renderer, accum, accum, 0, false);
  grade.material.uniforms.seed.value = (t * 30) % 97;
  grade.material.uniforms.exposure.value = 0.9 * smooth(seg(t, 0, 0.3)) * (1 - smooth(seg(t, total - 0.35, total)));
  renderer.setRenderTarget(null); grade.render(renderer);
}
window.renderAt = renderAt; window.total = total;
