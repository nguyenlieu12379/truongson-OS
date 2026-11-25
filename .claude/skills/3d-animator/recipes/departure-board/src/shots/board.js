// DEPARTURE BOARD, the film (22 Nov 2026). One continuous flight over an old split-flap railway board in macro, on ONE uncut voice take:
// "Passengers for Blender, After Effects, and Cinema 4D, please change trains. Your new service runs on one skill. Claude Code. Mind the gap.
//  Comment ticket. I'll send you the skill."
// Three rows clatter to a tool's name and a red CANCELLED; the big panel locks on CLAUDE CODE / NOW BOARDING; on "Mind the gap" the two flap banks
// swing apart for the lens and the camera flies between them to a ticket machine behind: the ticket shoots out with the word to comment.
// Camera and sound grammar = the flight deck film's (snap, hold, snap; the same drift constants). No railway's name or logo is used.
import { F, END } from './tlb.js';

export const build = (K) => make(K);
export function make(K, OPT = {}) {
  const { THREE, RoundedBoxGeometry, D2R, clamp, lerp, seg, smooth, spring, hash, std, mesh, canvasTex, pointLight, makeEnv, scene, FPS } = K;
  const G = new THREE.Group(); scene.add(G);
  const IVORY = '#F4EBD6', REDL = '#FF4A36', GREEN = '#7DF0A0', AMBER = '#FFB34D';
  const col = (hex, k = 1) => new THREE.Color(hex).multiplyScalar(k);
  const SNAP = (t) => Math.floor(t * FPS + 1e-6) / FPS, T = (k) => SNAP(F(k));
  const ENDX = END + (OPT.pinned ? 1.4 : 0);      // OPT.pinned = a second line the last strip flips to after the voice (shot boardp): the end card holds longer for it

  const envMap = makeEnv([
    [7, 3.5, [2.0, 2.2, 2.5], [-4, 5, 5]],        // cool softbox, upper left front
    [3, 1.4, [1.2, 0.75, 0.3], [5, -2.5, 4]],     // warm, low right (platform lamps)
    [0.8, 5, [1.5, 1.9, 2.2], [6, 1, 3]],
    [5, 0.7, [1.0, 0.7, 0.35], [0, 6, 3]],        // warm strip from above
    [0.5, 4, [1.8, 2.0, 2.3], [-3, 2, 7]],
  ]);
  const M = {
    enamel: std(0x0b0d0f, 0.25, 0.32),
    frame: std(0x5d6a70, 0.9, 0.45),
    brass: std(0xb08d4a, 1, 0.34),
    dark: std(0x050607, 0, 1),
    wall: std(0x20262a, 0.3, 0.8),
  };
  const box = (w, h, d, r, mat, x, y, z, parent = G) => mesh(new RoundedBoxGeometry(w, h, d, 3, r), mat, x, y, z, parent);

  // =====================================================================================
  // split-flap cells. One atlas of white glyphs on dark cards; a cell = two fixed half cards + one falling flap (front = old top, back = new bottom).
  // =====================================================================================
  const CHARS = " ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'-.", AC = 8, AR = 5, GW = 256, GH = 400;
  const atlas = (() => {
    const c = document.createElement('canvas'); c.width = AC * GW; c.height = AR * GH; const g = c.getContext('2d');
    g.fillStyle = '#000'; g.fillRect(0, 0, c.width, c.height); g.textAlign = 'center'; g.textBaseline = 'alphabetic';
    for (let i = 0; i < CHARS.length; i++) {
      const x = (i % AC) * GW, y = Math.floor(i / AC) * GH;
      const gr = g.createLinearGradient(0, y, 0, y + GH); gr.addColorStop(0, '#1b1d1f'); gr.addColorStop(0.5, '#101213'); gr.addColorStop(0.501, '#17191b'); gr.addColorStop(1, '#0b0c0d');
      g.fillStyle = gr; g.beginPath(); g.roundRect(x + 5, y + 5, GW - 10, GH - 10, 16); g.fill();
      g.font = `${GH * 0.93}px DINC`; const m = g.measureText('H'), w = g.measureText(CHARS[i]).width, sx = Math.min(1.3, (GW * 0.80) / Math.max(1, w));      // DIN Condensed widened to fill the card, like a real board's letters
      g.save(); g.translate(x + GW / 2, y + GH / 2 + m.actualBoundingBoxAscent / 2); g.scale(sx, 1); g.fillStyle = '#fff'; g.fillText(CHARS[i], 0, 0); g.restore();
    }
    return canvasTex(c);
  })();
  const flapMat = (hex, glow) => new THREE.MeshStandardMaterial({ map: atlas, color: col(hex), emissiveMap: atlas, emissive: col(hex), emissiveIntensity: glow, roughness: 0.62, metalness: 0.05, envMap, envMapIntensity: 0.25 });
  const FM = { ivory: flapMat(IVORY, 0.50), big: flapMat(IVORY, 0.36), red: flapMat(REDL, 1.15), green: flapMat(GREEN, 0.74), amber: flapMat(AMBER, 0.85) };
  const idx = (ch) => Math.max(0, CHARS.indexOf(ch));
  const setUV = (geo, i, half) => {      // half: 1 = top half of the glyph, 0 = bottom half
    const u0 = (i % AC) / AC, u1 = u0 + 1 / AC, vt = 1 - Math.floor(i / AC) / AR, vb = vt - 1 / AR, vm = (vt + vb) / 2, a = half ? vt : vm, b = half ? vm : vb;
    const uv = geo.attributes.uv; uv.setXY(0, u0, a); uv.setXY(1, u1, a); uv.setXY(2, u0, b); uv.setXY(3, u1, b); uv.needsUpdate = true;
  };
  const CELLS = [], FD = 0.062, SPLIT = 0.004;      // FD = one flap's fall, seconds
  // cell: fl = [[flip start, glyph index], ...] in time order; c0 = the glyph it shows before the first flip
  function cell(parent, x, y, z, w, h, mat, c0, fl) {
    const hh = h / 2 - SPLIT, q = () => new THREE.PlaneGeometry(w, hh);
    const top = mesh(q(), mat, x, y + hh / 2 + SPLIT, z, parent), bot = mesh(q(), mat, x, y - hh / 2 - SPLIT, z, parent);
    const hinge = new THREE.Group(); hinge.position.set(x, y, z + 0.003); parent.add(hinge);
    const ff = mesh(q().translate(0, hh / 2 + SPLIT, 0), mat, 0, 0, 0, hinge), fb = mesh(q().translate(0, -hh / 2 - SPLIT, 0), mat, 0, 0, 0, hinge);
    CELLS.push({ top, bot, ff, fb, c0, fl, last: [-1, -1, -1, -1], end: fl.length ? fl[fl.length - 1][1] : c0 });
  }
  const put = (c, k, mesh_, i, half) => { if (c.last[k] !== i) { c.last[k] = i; setUV(mesh_.geometry, i, half); } };
  function cellPose(c, t) {
    let k = -1; const fl = c.fl; for (let i = 0; i < fl.length; i++) { if (t >= fl[i][0]) k = i; else break; }
    const cur = k < 0 ? c.c0 : fl[k][1], u = k < 0 ? 1 : (t - fl[k][0]) / FD;
    if (OPT.allOn || u >= 1) { const e = OPT.allOn ? c.end : cur; put(c, 0, c.top, e, 1); put(c, 1, c.bot, e, 0); c.ff.visible = c.fb.visible = false; return; }
    const old = k ? fl[k - 1][1] : c.c0, th = Math.PI * Math.pow(u, 1.5);      // the flap falls faster and faster
    put(c, 0, c.top, cur, 1); put(c, 1, c.bot, old, 0); put(c, 2, c.ff, old, 1); put(c, 3, c.fb, cur, 0);
    c.ff.visible = c.fb.visible = true; c.ff.rotation.x = th; c.fb.rotation.x = th - Math.PI;
  }
  // schedules. rattle = flips every `per` seconds from t0, ending on the wanted glyph exactly at tl (the flap is down at tl)
  const RATTLES = [], LANDS = [];      // for the sound: [from, to, cells] and [time, cells]
  const rnd = (s) => 1 + Math.floor(hash(s) * 26);
  function rattle(seed, t0, tl, ch, per = 0.078) { const n = Math.max(1, Math.floor((tl - FD - t0) / per) + 1), out = []; for (let k = 0; k < n; k++) out.push([tl - FD - (n - 1 - k) * per, k === n - 1 ? idx(ch) : rnd(seed * 7.13 + k * 1.31)]); return out; }
  // a word on a row of cells: every cell rattles from t0 and lands on its letter at tl (+ a small stagger left to right)
  function word(parent, text, x0, y, z, w, h, pitch, mat, t0, tl, o = {}) {
    const st = o.stagger ?? 0.014;
    for (let i = 0; i < text.length; i++) {
      const land = tl + i * st, fl = text[i] === ' ' && !o.spaces ? [] : rattle(x0 * 3.1 + y * 5.7 + i, t0 + i * (o.wave ?? 0), land, text[i], o.per);
      if (o.clearAt != null && text[i] !== ' ') { const tc = o.clearAt + i * 0.02; fl.push([tc, rnd(i * 9.1 + y)], [tc + 0.08, rnd(i * 4.3 + y)], [tc + 0.16, 0]); }
      cell(parent, x0 + i * pitch, y, z, w, h, mat, o.c0 === 'done' ? idx(text[i]) : (text[i] === ' ' && !o.spaces ? 0 : (o.blank ? 0 : rnd(x0 + i * 2.7 + y))), o.c0 === 'done' ? (o.clearAt != null && text[i] !== ' ' ? fl.slice(-3) : []) : fl);
    }
    const n = text.replace(/ /g, '').length; if (o.c0 !== 'done') { RATTLES.push([Math.max(0, t0), tl, n]); LANDS.push([tl, n]); }
    if (o.clearAt != null) RATTLES.push([o.clearAt, o.clearAt + 0.16 + text.length * 0.02, n]);
  }

  // =====================================================================================
  // the world: two flap banks under a fixed lintel, a ticket machine behind them
  // =====================================================================================
  const SX = 1.22, R1 = 1.02, R2 = 0.70, R3 = 0.38, CW = 0.150, CH2 = 0.25, CP = 0.166, DX = -2.72, STX = -0.44;
  const BL = new THREE.Group(), BR = new THREE.Group(); G.add(BL, BR);      // each bank hangs on its OUTER edge, so the seam edges swing away from the lens
  const PL = -2.98, PR = 4.78; BL.position.set(PL, 0, 0); BR.position.set(PR, 0, 0);
  const lx = (x) => x - PL, rx = (x) => x - PR;
  // left bank: three departures
  box(4.17, 1.26, 0.12, 0.03, M.enamel, lx(-0.895), 0.70, -0.075, BL); box(4.25, 1.34, 0.06, 0.03, M.frame, lx(-0.895), 0.70, -0.11, BL);
  for (const y of [R1 + 0.165, R2 + 0.16, R3 + 0.16, R3 - 0.165]) box(3.96, 0.012, 0.02, 0.004, M.frame, lx(-0.93), y, -0.012, BL);
  const tB = T('blender'), tA = T('after'), tE = T('effects'), tC = T('cinema'), t4 = T('fourd'), tCh = T('change');
  const tf1 = SNAP(tB + 0.30), tf2 = SNAP(tE + 0.27), tf3 = SNAP(t4 + 0.27);      // the three red flags
  word(BL, 'BLENDE', lx(DX), R1, 0, CW, CH2, CP, FM.ivory, 0, 0, { c0: 'done', clearAt: tCh });                 // readable on the first frame...
  word(BL, 'R', lx(DX + 6 * CP), R1, 0, CW, CH2, CP, FM.ivory, -0.4, tB + 0.02, { clearAt: tCh + 0.12 });        // ...its last flap lands on the word
  word(BL, '      ', lx(DX + 7 * CP), R1, 0, CW, CH2, CP, FM.ivory, 0, 0, { c0: 'done' });
  word(BL, 'AFTER', lx(DX), R2, 0, CW, CH2, CP, FM.ivory, 0.50, tA, { blank: 1, clearAt: tCh + 0.04, per: 0.095 });
  word(BL, ' ', lx(DX + 5 * CP), R2, 0, CW, CH2, CP, FM.ivory, 0, 0, { c0: 'done' });
  word(BL, 'EFFECTS', lx(DX + 6 * CP), R2, 0, CW, CH2, CP, FM.ivory, 0.62, tE, { blank: 1, clearAt: tCh + 0.16, per: 0.095, stagger: 0.006 });
  word(BL, 'CINEMA', lx(DX), R3, 0, CW, CH2, CP, FM.ivory, 1.45, tC, { blank: 1, clearAt: tCh + 0.08, per: 0.105 });
  word(BL, ' ', lx(DX + 6 * CP), R3, 0, CW, CH2, CP, FM.ivory, 0, 0, { c0: 'done' });
  word(BL, '4D', lx(DX + 7 * CP), R3, 0, CW, CH2, CP, FM.ivory, 1.60, t4, { blank: 1, clearAt: tCh + 0.2, per: 0.105 });
  word(BL, '    ', lx(DX + 9 * CP), R3, 0, CW, CH2, CP, FM.ivory, 0, 0, { c0: 'done' });
  [[R1, tf1], [R2, tf2], [R3, tf3]].forEach(([y, tf]) => word(BL, 'CANCELLED', lx(STX), y, 0, CW, CH2, CP, FM.red, tf - 0.30, tf, { blank: 1, stagger: 0.008 }));
  const REDS = [[R1, tf1], [R2, tf2], [R3, tf3]].map(([y, tf]) => [pointLight(BL, col(REDL), 0, lx(0.22), y, 0.30, 1.5), tf]);
  // right bank: the new service
  const BX = 1.62, MY = 0.66, MW = 0.262, MH = 0.44, MP = 0.286, tO = T('one'), tS = T('skill'), tCl = T('claude'), tCo = T('code'), tNB = SNAP(tCo + 0.27), tY = T('your');
  box(3.53, 1.50, 0.12, 0.03, M.enamel, rx(3.015), 0.66, -0.075, BR); box(3.61, 1.58, 0.06, 0.03, M.frame, rx(3.015), 0.66, -0.11, BR);
  word(BR, 'ONE', rx(BX), 1.13, 0, CW, CH2, CP, FM.amber, tO - 0.34, tO, { blank: 1, per: 0.085 });
  word(BR, 'SKILL', rx(BX + 4 * CP), 1.13, 0, CW, CH2, CP, FM.amber, tO - 0.26, tS, { blank: 1, per: 0.085 });
  // the big row: a wave of flaps runs ahead of the lens, lands NEW SERVICE on the announcement, then clatters on and locks on CLAUDE CODE
  const tNw = SNAP(T('new') - 0.07), tSv = T('service'), tRe = SNAP(T('one') - 0.12), ROW1 = 'NEW SERVICE', ROW2 = 'CLAUDE CODE';
  for (let i = 0; i < 11; i++) {
    const l1 = (i < 3 ? tNw : tSv) + (i < 3 ? i : i - 4) * 0.012, l2 = (i < 6 ? tCl : tCo) + (i < 6 ? i : i - 7) * 0.014 + (i === 6 ? 0.1 : 0);
    const a = rattle(71 + i, tCh + 0.36 + i * 0.03, l1, ROW1[i], 0.085), b = rattle(131 + i, tRe + i * 0.02, l2, ROW2[i], 0.085);
    cell(BR, rx(BX + i * MP), MY, 0, MW, MH, FM.big, 0, a.concat(b));
  }
  RATTLES.push([tCh + 0.36, tSv, 10], [tRe, tCo, 10]); LANDS.push([tNw, 3], [tSv, 7], [tCl, 6], [tCo, 4]);
  word(BR, 'NOW', rx(BX), 0.20, 0, 0.17, 0.28, 0.19, FM.green, tNB - 0.32, tNB, { blank: 1, stagger: 0.008 });
  word(BR, 'BOARDING', rx(BX + 4 * 0.19), 0.20, 0, 0.17, 0.28, 0.19, FM.green, tNB - 0.32, tNB + 0.03, { blank: 1, stagger: 0.008 });
  for (let i = 3; i < 4; i++) cell(BR, rx(BX + i * 0.19), 0.20, 0, 0.17, 0.28, FM.green, 0, []);
  for (let i = 12; i < 16; i++) cell(BR, rx(BX + i * 0.19), 0.20, 0, 0.17, 0.28, FM.green, 0, []);
  for (let i = 3; i < 4; i++) cell(BR, rx(BX + i * CP), 1.13, 0, CW, CH2, FM.amber, 0, []);
  for (let i = 9; i < 18; i++) cell(BR, rx(BX + i * CP), 1.13, 0, CW, CH2, FM.amber, 0, []);
  const GRN = pointLight(BR, col(GREEN), 0, rx(2.6), 0.22, 0.34, 1.8), AMB = pointLight(BR, col(AMBER), 0, rx(2.3), 1.13, 0.30, 1.5), WHT = pointLight(BR, col(IVORY), 0, rx(3.05), MY, 0.4, 2.0);
  // hazard edges on the seam, the fixed lintel with its sign
  const stripe = (() => { const c = document.createElement('canvas'); c.width = 64; c.height = 512; const g = c.getContext('2d'); g.fillStyle = '#0c0c0c'; g.fillRect(0, 0, 64, 512); g.fillStyle = '#f2b21d'; for (let y = -64; y < 600; y += 96) { g.beginPath(); g.moveTo(0, y); g.lineTo(64, y + 48); g.lineTo(64, y + 96); g.lineTo(0, y + 48); g.fill(); } return canvasTex(c); })();
  const stripeM = new THREE.MeshStandardMaterial({ map: stripe, roughness: 0.6, emissiveMap: stripe, emissive: col('#ffffff'), emissiveIntensity: 0.22 });
  mesh(new THREE.PlaneGeometry(0.07, 1.26), stripeM, lx(SX - 0.075), 0.70, -0.012, BL); mesh(new THREE.PlaneGeometry(0.07, 1.50), stripeM, rx(SX + 0.075), 0.66, -0.012, BR);
  box(9.2, 0.30, 0.16, 0.03, M.enamel, 0.9, 1.66, -0.06); box(9.3, 0.04, 0.2, 0.01, M.frame, 0.9, 1.50, -0.06);
  { const c = document.createElement('canvas'); c.width = 1400; c.height = 220; const g = c.getContext('2d'); g.fillStyle = '#000'; g.fillRect(0, 0, 1400, 220); g.strokeStyle = '#fff'; g.lineWidth = 6; g.strokeRect(14, 14, 1372, 192);
    g.font = '150px DINC'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = '#fff'; g.fillText('M I N D   T H E   G A P', 700, 118);
    const t = canvasTex(c); mesh(new THREE.PlaneGeometry(1.34, 0.21), new THREE.MeshStandardMaterial({ map: t, color: col('#f2b21d'), emissiveMap: t, emissive: col('#f2b21d'), emissiveIntensity: 0.75, roughness: 0.5 }), SX, 1.655, 0.022, G); }
  // the wall around and behind, and station lamps far away (soft discs out of focus)
  mesh(new THREE.PlaneGeometry(30, 16), M.wall, 1, 0.6, -5.2, G);
  const FAR = new THREE.MeshBasicMaterial({ color: 0xffffff });
  { const N = 420, im = new THREE.InstancedMesh(new THREE.PlaneGeometry(1, 1), FAR, N), o = new THREE.Object3D(), cols = [AMBER, IVORY, IVORY, AMBER, GREEN, REDL]; let k = 0;
    for (let i = 0; k < N && i < 5000; i++) { const x = -9 + hash(i * 1.71) * 20, y = -4.5 + hash(i * 2.93) * 10; if (x > -3.3 && x < 5.1 && y > -0.2 && y < 1.95) continue;
      const s = 0.02 + 0.03 * hash(i * 6.1); o.position.set(Math.round(x / 0.3) * 0.3, Math.round(y / 0.26) * 0.26, -0.2 - 1.5 * hash(i * 3.7)); o.scale.set(hash(i * 4.4) > 0.6 ? s * 3 : s, s, 1); o.updateMatrix(); im.setMatrixAt(k, o.matrix); im.setColorAt(k, col(cols[Math.floor(hash(i * 8.3) * cols.length)], 0.3 + 1.0 * hash(i * 9.7) * hash(i * 3.1))); k++; }
    im.count = k; im.instanceMatrix.needsUpdate = true; im.instanceColor.needsUpdate = true; if (OPT.farLamps) G.add(im); }      // off: without a wall to sit on they read as floating pixels

  // the ticket machine behind the board: a brass dispenser, a stop, a paper ticket, a strip of small flaps
  const tG = T('gap'), tM = T('mind'), tOp = SNAP(tM + 0.07);
  const MZ = -2.40, tK = SNAP(T('comment') - 0.13), tTk = T('ticket'), tP0 = SNAP(F('end') + 0.26), tP = SNAP(tP0 + 0.34), tPunch = OPT.pinned ? SNAP(tP + 0.63) : SNAP(F('end') + 0.34);      // tP0, tP = the strip's second line starts to flip / lands
  const MG = new THREE.Group(); MG.position.set(SX, 0, MZ); G.add(MG);
  box(3.3, 2.1, 0.1, 0.03, M.enamel, 0, 0.66, -0.05, MG); box(3.4, 2.2, 0.05, 0.03, M.frame, 0, 0.66, -0.09, MG);
  const TG = new THREE.Group(); TG.position.set(0, 0.345, 0); TG.scale.setScalar(1.45); MG.add(TG); const ty = (y) => y - 0.345;      // dispenser, stop and ticket: one group, 1.45 x, growing up from the slot
  box(1.18, 0.60, 0.10, 0.03, M.brass, 0, ty(0.045), 0.06 / 1.45, TG); box(0.98, 0.05, 0.105, 0.01, M.dark, 0, ty(0.325), 0.06 / 1.45, TG);      // the dispenser and its slot
  box(1.10, 0.05, 0.07, 0.015, M.brass, 0, ty(0.885), 0.035, TG);                                                               // the stop the ticket hits
  for (const sx of [-1, 1]) box(0.04, 0.60, 0.05, 0.01, M.brass, sx * 0.53, ty(0.60), 0.025, TG);                               // its two guides
  const ticketTex = (() => { const c = document.createElement('canvas'); c.width = 1520; c.height = 896; const g = c.getContext('2d');
    g.fillStyle = '#e9dcbd'; g.fillRect(0, 0, 1520, 896); for (let i = 0; i < 2600; i++) { g.fillStyle = `rgba(${90 + hash(i) * 60 | 0},${70 + hash(i * 2.1) * 50 | 0},40,${0.03 + 0.04 * hash(i * 3.3)})`; g.fillRect(hash(i * 1.7) * 1520, hash(i * 5.1) * 896, 1 + hash(i * 7) * 3, 1 + hash(i * 9) * 2); }
    g.strokeStyle = '#3a2416'; g.lineWidth = 10; g.strokeRect(34, 34, 1452, 828); g.lineWidth = 3; g.strokeRect(54, 54, 1412, 788);
    g.fillStyle = '#3a2416'; g.textAlign = 'center'; g.textBaseline = 'alphabetic'; g.font = '150px DINC'; g.fillText('C O M M E N T', 760, 236);
    g.fillStyle = '#b3261e'; g.font = '520px DINC'; const s = 'TICKET', w = g.measureText(s).width; g.save(); g.translate(760, 690); g.scale(Math.min(1, 1340 / w), 1); g.fillText(s, 0, 0); g.restore();
    g.fillStyle = '#3a2416'; g.font = '62px DINA'; g.fillText('VALID FOR ONE SKILL  ·  FREE  ·  No 0055', 760, 800); return canvasTex(c); })();
  const ticket = mesh(new THREE.PlaneGeometry(0.95, 0.56), new THREE.MeshStandardMaterial({ map: ticketTex, roughness: 0.9, emissiveMap: ticketTex, emissive: col('#ffffff'), emissiveIntensity: 0.30 }), 0, ty(0.04), 0.012, TG);
  const notch = new THREE.Group(); notch.position.set(0.40, ty(0.76), 0.014); TG.add(notch); notch.visible = false;
  mesh(new THREE.CircleGeometry(0.05, 32), new THREE.MeshBasicMaterial({ color: 0x050403 }), 0, 0, 0, notch); mesh(new THREE.RingGeometry(0.049, 0.053, 40, 1, Math.PI * 0.2, Math.PI * 0.8), new THREE.MeshBasicMaterial({ color: col('#f3e8cc', 0.62) }), 0, 0, 0.001, notch); mesh(new THREE.RingGeometry(0.05, 0.058, 40, 1, Math.PI * 1.15, Math.PI * 1.0), new THREE.MeshBasicMaterial({ color: 0x6b5a3c, transparent: true, opacity: 0.55 }), 0, 0, 0.001, notch);      // the cut edge catches the lamp on one side and shades on the other
  const pin = mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.14, 24).rotateX(Math.PI / 2), std(0xeef6fa, 1, 0.18), 0.40, ty(0.76), 0.3, TG); pin.visible = false;      // the punch: only there for the bite
  { const c = document.createElement('canvas'); c.width = 1400; c.height = 700; const g = c.getContext('2d'); g.fillStyle = '#000'; g.fillRect(0, 0, 1400, 700);
    g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = '#fff'; g.font = '300px DINC'; g.fillText('T I C K E T S', 700, 300);
    g.beginPath(); g.moveTo(700, 480); g.lineTo(780, 600); g.lineTo(620, 600); g.closePath(); g.fill(); g.fillRect(120, 110, 1160, 10); g.fillRect(120, 640, 1160, 10);
    const t = canvasTex(c); mesh(new THREE.PlaneGeometry(0.92, 0.46), new THREE.MeshStandardMaterial({ map: t, color: col('#c9a45a'), emissiveMap: t, emissive: col('#c9a45a'), emissiveIntensity: 0.55, roughness: 0.5, transparent: true, alphaMap: t }), 0, ty(0.60), 0.004, TG); }
  const BULBS = []; for (let i = 0; i < 13; i++) { const m = new THREE.MeshBasicMaterial({ color: 0x000000 }); mesh(new THREE.SphereGeometry(0.013, 14, 10), m, -0.51 + i * 0.085, ty(0.955), 0.03, TG); BULBS.push(m); }
  const SP = 0.100, SX0 = -11 * SP, SY = 1.37;
  const STRIP0 = CELLS.length;
  [["I'LL", 0, T('ill')], ['SEND', 5, T('send')], ['YOU', 10, T('you')], ['THE', 14, T('the2')], ['SKILL', 18, T('skill2')]].forEach(([s, i0, tl]) => word(MG, s, SX0 + i0 * SP, SY, 0.012, 0.09, 0.155, SP, FM.amber, tG + 0.25, tl, { blank: 1, stagger: 0.006, per: 0.092 }));
  for (const i of [4, 9, 13, 17]) cell(MG, SX0 + i * SP, SY, 0.012, 0.09, 0.155, FM.amber, 0, []);
  if (OPT.pinned) {      // all 23 flaps clatter once more and land the second line (centred if it is shorter)
    const raw = OPT.pinned.slice(0, 23), SECOND = (' '.repeat(Math.floor((23 - raw.length) / 2)) + raw).padEnd(23), order = [0, 1, 2, 3, 5, 6, 7, 8, 10, 11, 12, 14, 15, 16, 18, 19, 20, 21, 22, 4, 9, 13, 17];
    order.forEach((i, k) => { const c = CELLS[STRIP0 + k]; c.fl.push(...rattle(301 + i, tP0 + i * 0.010, tP + i * 0.008, SECOND[i], 0.075)); c.end = idx(SECOND[i]); });
    RATTLES.push([tP0, tP + 0.18, 20]);
  }
  const TKL = pointLight(MG, col('#ffd9a0'), 0, 0, 0.85, 1.0, 3.4), STL = pointLight(MG, col(AMBER), 0, 0, SY, 0.3, 1.4);

  // light
  { const key = new THREE.DirectionalLight(col(0xcfe6f2), 0.75); key.position.set(-3, 3.2, 2.6); key.target.position.set(1, 0.6, 0); G.add(key, key.target); }
  { const rim = new THREE.DirectionalLight(col(0xffb34d), 0.3); rim.position.set(4, -2.5, 1.4); rim.target.position.set(1, 0.6, 0); G.add(rim, rim.target); }
  const POOLS = [[0xffe2b8, 1.7, -2.3, 1.5, 1.3], [0xd6ecf5, 1.5, -0.6, 1.4, 1.4], [0xffe2b8, 1.6, 0.6, 0.2, 1.3], [0xd6ecf5, 1.7, 2.4, 1.5, 1.4], [0xffe2b8, 1.8, 4.0, 0.4, 1.4], [0xd6ecf5, 1.4, -1.6, -0.2, 1.3]]
    .map(([c, i, x, y, z]) => [pointLight(G, col(c), i, x, y, z, 4.5), i]);

  // =====================================================================================
  // camera: the flight deck film's model, unchanged (snap, hold, snap; holds drift). 'rush' = one accelerating run, used for the fly-through only.
  // poses: [arrive, move, look, azimuth, elevation, distance, roll, kind, dip, tag]
  // =====================================================================================
  const Z = 0.03;
  const PO = OPT.poses || [
    [-1.0, 0, [-1.35, 0.72, 0.02], -48, 12, 2.90, -14, 'snap', 0],                                    // the first frame: BLENDER readable, the rows under it rattling
    [0.17, 0.17, [-2.24, R1, Z], -28, 5, 1.22, -6, 'snap', 0, 'crash'],                             // the first move starts on frame 0
    [0.52, 0.11, [-1.82, R1 - 0.01, Z], 14, 8, 0.58, 5, 'snap', 0, 'look'],
    [tB + 0.03, 0.12, [-2.26, R1, Z], -20, 3, 1.02, -4, 'snap', 0, 'name'],                         // the last flap lands on "Blender"
    [tf1 + 0.02, 0.13, [0.14, R1 - 0.02, Z], -14, -5, 1.46, 5, 'snap', 0, 'flag'],                  // CANCELLED, red
    [tA + 0.03, 0.17, [-2.39, R2, Z], -30, 5, 0.70, -6, 'whip', 0, 'name'],
    [tE + 0.02, 0.11, [-1.30, R2, Z], -20, 4, 1.14, 4, 'snap', 0, 'name2'],
    [tf2 + 0.02, 0.12, [0.14, R2 - 0.02, Z], -12, -5, 1.46, -5, 'snap', 0, 'flag'],
    [tC + 0.03, 0.16, [-2.305, R3, Z], -30, 5, 0.74, 6, 'whip', 0, 'name'],
    [t4 + 0.02, 0.11, [-1.475, R3, Z], -20, 4, 0.66, -4, 'snap', 0, 'name2'],
    [tf3 + 0.02, 0.12, [0.14, R3 + 0.02, Z], -12, 6, 1.46, 5, 'snap', 0, 'flag'],
    [T('please') + 0.03, 0.16, [-0.93, 0.70, 0], -8, 4, 3.3, -2, 'snap', 0, 'out'],                 // back: three departures, three red flags
    [tCh + 0.03, 0.12, [-1.95, 0.70, Z], -24, 3, 1.25, 5, 'snap', 0, 'wave'],                       // the names clatter away
    [T('trains') + 0.14, 0.24, [2.60, 0.66, Z], -34, 6, 1.50, -7, 'whip', 0.25, 'cross'],           // across the seam to the big panel
    [T('trains') + 0.46, 0.12, [3.40, MY, Z], -20, 4, 1.00, 5, 'snap', 0, 'look'],                  // along the rattling row
    [tY + 0.03, 0.13, [1.93, MY, Z], -24, 3, 0.84, 5, 'snap', 0, 'look'],                           // into the wave of flaps: NEW lands
    [T('service') + 0.02, 0.12, [2.96, MY, Z], -12, 4, 3.05, -4, 'snap', 0, 'name2'],                 // NEW SERVICE, whole
    [T('runs') + 0.02, 0.12, [3.54, MY, Z], 12, -5, 1.80, 4, 'snap', 0, 'look'],                      // SERVICE from the other side
    [tO + 0.02, 0.12, [1.90, 1.13, Z], -24, 5, 0.62, -5, 'snap', 0, 'name'],                        // ONE
    [tS + 0.02, 0.11, [2.20, 1.13, Z], -14, 4, 1.52, 4, 'snap', 0, 'name2'],                        // ONE SKILL
    [tS + 0.36, 0.12, [2.70, 0.86, Z], -5, 5, 2.40, -3, 'snap', 0, 'look'],                         // the breath: the strip landed, the big row still rattling under it
    [tCl + 0.03, 0.17, [2.335, MY, Z], -26, 4, 1.46, -6, 'whip', 0, 'name'],                        // CLAUDE locks
    [tCo + 0.02, 0.11, [4.05, MY, Z], -18, 4, 1.00, 4, 'snap', 0, 'name2'],                         // CODE
    [tNB + 0.04, 0.15, [3.05, 0.62, 0], -8, 3, 2.90, -2, 'snap', 0, 'panel'],                       // back: NOW BOARDING, green, the lamps come up
    [tM + 0.02, 0.18, [SX, 0.95, 0], 0, 3, 2.30, 0, 'whip', 0.15, 'seam'],                          // square on to the seam and its sign
    [tG + 0.26, 0.36, [SX, 0.72, MZ + 0.1], 0, 2, 1.50, 0, 'rush', 0, 'gap'],                       // through: the banks swing apart for the lens
    [T('comment') - 0.08, 0.20, [SX, 0.62, MZ + 0.07], -16, 6, 1.40, 5, 'snap', 0, 'machine'],
    [tTk + 0.02, 0.12, [SX + 0.02, 0.70, MZ + 0.06], 8, -3, 1.12, -4, 'snap', 0, 'ticket'],         // TICKET, huge
    [tTk + 0.36, 0.10, [SX, 0.72, MZ + 0.06], -5, 4, 0.86, 3, 'snap', 0, 'punch'],
    [T('ill') + 0.02, 0.12, [SX - 0.73, SY, MZ + 0.02], -20, 4, 0.88, -5, 'snap', 0, 'strip'],
    [T('you') + 0.02, 0.12, [SX + 0.45, SY, MZ + 0.02], -8, 4, 1.34, 4, 'snap', 0, 'strip'],
    [F('end') + 0.06, 0.17, [SX, 0.86, MZ + 0.04], 4, 2, 2.26, 0, 'snap', 0, 'end'],                // the end card: the strip, the ticket, the machine
  ];
  const eyeOf = (L, az, el, d) => { const ca = Math.cos(az * D2R), sa = Math.sin(az * D2R), ce = Math.cos(el * D2R), se = Math.sin(el * D2R); return [L[0] + d * sa * ce, L[1] + d * se, L[2] + d * ca * ce]; };
  const EASE = { snap: (u) => 1 - (1 - u) * (1 - u), whip: (u) => (u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2), ease: (u) => u * u * (3 - 2 * u), spin: (u) => u * u * (3 - 2 * u), rush: (u) => Math.pow(u, 1.8) };
  const DIRS = PO.map((P, i) => { if (!i || P[7] === 'ease' || P[7] === 'spin' || P[7] === 'rush' || PO[i - 1][7] === 'rush') return [0, 0]; const dx = P[2][0] - PO[i - 1][2][0], dy = P[2][1] - PO[i - 1][2][1], n = Math.hypot(dx, dy); return n < 0.05 ? [0, 0] : [dx / n, dy / n]; });
  function held(i, t) { const P = PO[i], dt = Math.min(1.2, Math.max(0, t - P[0]) * (OPT.pinned && i === PO.length - 1 ? 1.2 / (ENDX - P[0]) : 1)),      // second ending: the end card drifts along the same path, spread over its longer hold
    k = OPT.poses ? 0 : 1, v = (i === PO.length - 1 ? 0 : 0.36) * Math.min(P[5], 0.9) * dt * k;      // the constants of the flight deck film
    return { L: [P[2][0] + DIRS[i][0] * v, P[2][1] + DIRS[i][1] * v, P[2][2]], az: P[3] - Math.sign(P[3]) * 9 * dt * k, el: P[4] + 2.5 * dt * k, d: P[5] * (1 - 0.09 * dt * k), roll: P[6] * (1 - 0.14 * dt * k) }; }
  const inMove = (t) => PO.some((P, i) => i && P[7] !== 'ease' && t >= P[0] - P[1] - 0.02 && t <= P[0] + 0.03);
  function camAt(t) {
    let j = 0; while (j < PO.length - 1 && t >= PO[j + 1][0] - PO[j + 1][1]) j++;
    let c;
    if (j === 0 || t >= PO[j][0]) c = held(j, t);
    else {
      const P = PO[j], t0 = P[0] - P[1], A = held(j - 1, t0), u = clamp((t - t0) / P[1]), p = EASE[P[7]](u);
      c = { L: [0, 1, 2].map((q) => lerp(A.L[q], P[2][q], p)), az: lerp(A.az, P[3], p), el: lerp(A.el, P[4], p), d: lerp(A.d, P[5], p) - P[8] * Math.sin(Math.PI * p), roll: lerp(A.roll, P[6], p) + (P[7] === 'spin' ? 360 * p : 0) };
    }
    let { L, az, el, d, roll } = c;
    for (const P of PO) if (P[7] === 'spin' && t >= P[0]) roll += 360;
    for (let i = 1; i < PO.length; i++) { const P = PO[i]; if (t < P[0] || t > P[0] + 0.6 || P[7] === 'ease' || P[7] === 'rush') continue; const s = spring(t, P[0], 5.5, 15), big = P[7] === 'whip' ? 1.7 : 1; roll += 2.4 * big * s * Math.sign(P[6] || 1); az += 1.1 * big * s; d *= 1 - 0.012 * big * s; }
    return { e: eyeOf(L, az, el, d), l: L, roll, d };
  }
  const keys = [];
  for (let i = -48; i <= (ENDX + 0.2) * 240; i++) { const t = i / 240, c = camAt(t); keys.push([t, c.e, c.l, c.roll]); }
  const WKEYS = ['passengers', 'blender', 'after', 'effects', 'cinema', 'fourd', 'please', 'change', 'trains', 'your', 'service', 'runs', 'one', 'skill', 'claude', 'code', 'mind', 'gap', 'comment', 'ticket', 'ill', 'send', 'you', 'the2', 'skill2'];
  window.__kf = { keys, end: ENDX, moves: PO.slice(1).map((P) => [+(P[0] - P[1]).toFixed(3), +P[0].toFixed(3), P[7], P[9] || '']), words: Object.fromEntries(WKEYS.map((k) => [k, T(k)])),
    rattles: RATTLES.map((r) => r.map((v) => +v.toFixed(3))), lands: LANDS.map((r) => r.map((v) => +v.toFixed(3))), ev: { flags: [tf1, tf2, tf3], boarding: tNB, gap: tG, open: tOp, clear: tCh, ticket: tK, punch: tPunch, pinned: OPT.pinned ? tP : null },
    gapPath: (() => { const o = []; for (let t = tG - 0.12; t < tG + 0.3; t += 1 / 30) { const c = camAt(t); o.push([+t.toFixed(2), +c.e[0].toFixed(2), +c.e[2].toFixed(2)]); } return o; })() };
  const fastf = {};      // every fast move gets three times the sub-frames; frames with flaps falling get twice, or 13 flips a second would strobe
  for (const [a, b] of RATTLES) for (let f = Math.floor(Math.max(0, a) * FPS); f <= Math.ceil((b + 0.03) * FPS); f++) fastf[f] = 2;
  for (const P of PO.slice(1)) if (P[7] !== 'ease') for (let f = Math.floor((P[0] - P[1]) * FPS); f <= Math.ceil((P[0] + 0.04) * FPS); f++) fastf[f] = 3;

  // =====================================================================================
  // pose: everything that moves, from t alone
  // =====================================================================================
  const lit = (t, on, pop = 0.5) => (t < on ? 0 : smooth(seg(t, on, on + 0.04)) * (1 + pop * Math.exp(-(t - on) * 9)));
  function pose(t) {
    for (const c of CELLS) cellPose(c, t);
    const pw = OPT.allOn ? 1 : smooth(seg(t, tNB, tNB + 0.45)) * (1 - 0.3 * Math.max(0, Math.sin((t - tNB) * 50)) * Math.exp(-(t - tNB) * 7));
    for (const [L, i] of POOLS) L.intensity = i * (0.62 + 0.38 * pw);
    FAR.color.setScalar(0.35 + 0.65 * pw);
    for (const [L, tf] of REDS) L.intensity = 0.55 * (OPT.allOn ? 1 : lit(t, tf));
    GRN.intensity = 0.36 * (OPT.allOn ? 1 : lit(t, tNB, 0.9)); AMB.intensity = 0.3 * (OPT.allOn ? 1 : lit(t, tO)); WHT.intensity = 0.14 * (OPT.allOn ? 1 : lit(t, tCl));
    // the banks: closed, then they swing apart for the lens and clap shut behind it
    const o = OPT.open ?? (smooth(seg(t, tOp, tOp + 0.17)) * (1 - smooth(seg(t, tG + 0.38, tG + 0.48))) + 0.07 * spring(t, tOp + 0.17, 6, 9));
    BL.position.x = PL - 0.5 * o; BL.rotation.y = 0.16 * o; BR.position.x = PR + 0.5 * o; BR.rotation.y = -0.16 * o;
    // the ticket shoots out of the dispenser into its stop; the punch bites its corner
    const up = OPT.allOn ? 1 : 1 - Math.pow(1 - seg(t, tK, tK + 0.11), 2);
    ticket.position.y = ty(lerp(0.04, 0.585, up) - (OPT.allOn ? 0 : 0.022 * Math.abs(spring(t, tK + 0.11, 9, 14))));
    TKL.intensity = 1.5 * (OPT.allOn ? 1 : 0.55 + 0.45 * lit(t, tK, 0.3));
    const landed = OPT.allOn || t >= tK + 0.11; for (let i = 0; i < BULBS.length; i++) { const k = landed ? 1.6 + (OPT.allOn ? 0 : 1.2 * Math.exp(-(t - tK - 0.11) * 8)) : ((((Math.floor(t * 20) - i) % 4) + 4) % 4 === 0 ? 2.0 : 0.10); BULBS[i].color.set(AMBER).multiplyScalar(k); }      // the bulbs run until the ticket is out, then they all stay on STL.intensity = 0.4 * (OPT.allOn ? 1 : lit(t, T('ill')));
    notch.visible = OPT.allOn || t >= tPunch; pin.visible = !OPT.allOn && Math.abs(t - tPunch) < 0.1; pin.position.z = 0.30 - 0.215 * Math.max(0, 1 - Math.abs(t - tPunch) / 0.07);
  }
  return { id: OPT.id || 'board', t0: 0, t1: ENDX, groups: [G], keys, fov: 40, fog: 0.02, env: 0.75, envMap, exposure: 1.0,
    lens: OPT.lens ?? ((t) => lerp(0.011, 0.0035, smooth(seg(camAt(t).d, 1.3, 2.2)))),      // keyed on the pose's own distance (the camera goes behind the board, so its z says nothing)
    shutter: (t) => (inMove(t) ? 0.8 : 0.45) / 30, bloom: [0.34, 0.4, 0.93], vig: 0.5, fastf, pose };
}
