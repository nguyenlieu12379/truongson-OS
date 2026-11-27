// FLIGHT DECK, the film (21 Nov 2026). One continuous flight over a cockpit panel in macro, on ONE uncut voice take:
// "Blender? Off. After Effects? Off. Cinema 4D? Off. Claude Code? On. One skill flies the camera. It tilts. It dives. It spins. Comment fly. I'll send you the skill."
// Three systems are switched OFF (a nameplate, a switch, a red OFF flag each), the guarded master switch is thrown and CLAUDE CODE comes ON:
// the panel powers up. Then the gauges read the CAMERA'S OWN motion: the horizon when it tilts, the altimeter when it dives, the gyro when it spins.
// Camera = SNAP, HOLD, SNAP, HOLD (see the camera section). Everything here is ours: no part, palette, route or transition of the reference reel.
import { F, END } from './tlf.js';

export const build = (K) => make(K);
export function make(K, OPT = {}) {
  const { THREE, RoundedBoxGeometry, D2R, clamp, lerp, seg, smooth, spring, hash, std, mesh, rrect, canvasTex, pointLight, makeEnv, scene, FPS } = K;
  const G = new THREE.Group(); scene.add(G);
  const AMBER = '#FFB34D', GREEN = '#7DF0A0', WHITE = '#E5F2F7', REDL = '#FF4A36', CYAN = '#5FE3FF';
  const col = (hex, k = 1) => new THREE.Color(hex).multiplyScalar(k);
  const SNAP = (t) => Math.floor(t * FPS + 1e-6) / FPS;        // an event of a word starts with the frame that is on screen when the word starts
  const T = (k) => SNAP(F(k));

  // ---------------- the room the metal and glass reflect ----------------
  const envMap = makeEnv([
    [7, 3.5, [2.2, 2.6, 3.0], [-4, 5, 5]],        // cool white softbox, upper left front
    [3, 1.4, [1.0, 0.6, 0.22], [5, -2.5, 4]],     // amber, low right
    [0.8, 5, [1.6, 2.1, 2.4], [6, 1, 3]],         // cool strip, right
    [5, 0.7, [0.5, 1.1, 0.8], [0, -5, 3]],        // a little green from below
    [0.5, 4, [2.0, 2.3, 2.6], [-3, 2, 7]],        // a thin strip in front: one glint across each glass
  ]);

  // ---------------- materials ----------------
  const brushed = (() => {      // brushed graphite: fine horizontal streaks in the roughness and a little in the height
    const c = document.createElement('canvas'); c.width = 1024; c.height = 1024; const g = c.getContext('2d');
    g.fillStyle = '#8a8a8a'; g.fillRect(0, 0, 1024, 1024);
    for (let i = 0; i < 5200; i++) { const y = hash(i * 1.37) * 1024, x = hash(i * 2.11) * 1024, w = 60 + hash(i * 3.3) * 420, v = 90 + Math.floor(hash(i * 5.1) * 110); g.fillStyle = `rgba(${v},${v},${v},${0.10 + 0.25 * hash(i * 7.7)})`; g.fillRect(x, y, w, 1 + (hash(i * 9.1) > 0.8 ? 1 : 0)); if (x + w > 1024) g.fillRect(x - 1024, y, w, 1); }
    const t = canvasTex(c, false); t.wrapS = t.wrapT = THREE.RepeatWrapping; return t;
  })();
  const rep = (rx, ry) => { const t = brushed.clone(); t.needsUpdate = true; t.repeat.set(rx, ry); return t; };
  // reflect the room only: a lamp 30 cm away must not put a white blob on glass or on a glossy cap (the clearcoat's direct term has to go too)
  const envOnly = (m) => { m.onBeforeCompile = (sh) => { const a = 'vec3 totalSpecular = reflectedLight.directSpecular + reflectedLight.indirectSpecular;'; if (!sh.fragmentShader.includes(a)) console.error('envOnly: shader line not found'); sh.fragmentShader = sh.fragmentShader.replace(a, 'vec3 totalSpecular = reflectedLight.indirectSpecular;').replace('( clearcoatSpecularDirect + clearcoatSpecularIndirect ) * material.clearcoat', 'clearcoatSpecularIndirect * material.clearcoat'); }; return m; };
  const M = {
    panel: std(0x3b454c, 0.55, 0.6, { roughnessMap: rep(7, 4), bumpMap: rep(7, 4), bumpScale: 0.6 }),
    plate: std(0x4a555d, 0.6, 0.52, { roughnessMap: rep(2, 1.5), bumpMap: rep(2, 1.5), bumpScale: 0.5 }),
    steel: std(0x6c7b82, 0.9, 0.47, { roughnessMap: rep(1, 1) }),
    dark: std(0x0c0f11, 0.4, 0.5),
    cap: envOnly(new THREE.MeshPhysicalMaterial({ color: 0x0a0c0e, roughness: 0.28, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.22, envMap, envMapIntensity: 0.5 })),   // a material's own strength only works on its OWN envMap
    chrome: std(0xeef6fa, 1, 0.16),
    knob: std(0x101315, 0.3, 0.6),
    red: std(0x9c2219, 0.2, 0.5),
    screw: std(0x3d484e, 0.9, 0.35),
    black: std(0x040506, 0, 1),
    screen: std(0x020304, 0.1, 0.35),
  };
  const box = (w, h, d, r, mat, x, y, z, parent = G) => mesh(new RoundedBoxGeometry(w, h, d, 3, r), mat, x, y, z, parent);
  const zcyl = (r0, r1, len, seg2, mat, x, y, z, parent = G) => mesh(new THREE.CylinderGeometry(r0, r1, len, seg2).rotateX(Math.PI / 2), mat, x, y, z, parent);   // a cylinder standing out of the panel (+z)

  // ---------------- the panel and its plates ----------------
  mesh(new THREE.PlaneGeometry(18, 10), M.panel, 0.3, -0.4, 0, G);
  function screw(x, y, z, r = 0.02) { zcyl(r, r, 0.012, 20, M.screw, x, y, z + 0.004); const s = box(r * 1.5, r * 0.22, 0.004, 0.0008, M.black, x, y, z + 0.0105); s.rotation.z = hash(x * 31.7 + y * 17.3) * 3.1; }
  function plate(x, y, w, h, holes = []) {       // a raised sub-panel with four fasteners
    const s = rrect(w, h, 0.03); for (const [hx, hy, hr] of holes) { const p = new THREE.Path(); p.absarc(hx, hy, hr, 0, Math.PI * 2, true); s.holes.push(p); }
    const m = mesh(new THREE.ExtrudeGeometry(s, { depth: 0.014, bevelEnabled: true, bevelThickness: 0.004, bevelSize: 0.004, bevelSegments: 2, curveSegments: 48 }), M.plate, x, y, 0.002, G);
    for (const [sx, sy] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) screw(x + sx * (w / 2 - 0.05), y + sy * (h / 2 - 0.05), 0.022);
    return m;
  }

  // ---------------- text ----------------
  // a lit legend: glow fill + hot letters, drawn once; the material's colour scalar is the lamp level. '\n' = two lines.
  function legendTex(text, color, aspect = 0.30 / 0.19) {
    const PW = 900, PH = Math.round(PW / aspect), c = document.createElement('canvas'); c.width = PW; c.height = PH; const g = c.getContext('2d');
    g.fillStyle = '#000'; g.fillRect(0, 0, PW, PH);
    const base = new THREE.Color(color), white = color === WHITE, hot = base.clone().lerp(new THREE.Color(1, 1, 1), white ? 0.45 : 0.14), FK = white ? 0.45 : 1.4, rgb = `${base.r * 255 | 0},${base.g * 255 | 0},${base.b * 255 | 0}`;
    const gr = g.createRadialGradient(PW / 2, PH / 2, 20, PW / 2, PH / 2, PW * 0.62); gr.addColorStop(0, `rgba(${rgb},${0.10 * FK})`); gr.addColorStop(1, `rgba(${rgb},${0.04 * FK})`);
    g.fillStyle = gr; g.beginPath(); g.roundRect(18, 18, PW - 36, PH - 36, 34); g.fill();
    g.strokeStyle = `rgba(${rgb},0.32)`; g.lineWidth = 5; g.beginPath(); g.roundRect(34, 34, PW - 68, PH - 68, 24); g.stroke();
    const lines = text.split('\n').map((s) => s.split('').join(' ')), n = lines.length;
    let size = PH * (n === 1 ? 0.62 : 0.43); g.font = `${size}px DINC`; g.textAlign = 'center'; g.textBaseline = 'alphabetic';
    const wmax = Math.max(...lines.map((s) => g.measureText(s).width)), maxW = PW * 0.80; if (wmax > maxW) { size *= maxW / wmax; g.font = `${size}px DINC`; }
    const asc = g.measureText('H').actualBoundingBoxAscent, gap = asc * 0.42, total = n * asc + (n - 1) * gap, y0 = PH / 2 - total / 2 + asc;
    for (const pass of [14, 0]) { g.shadowColor = '#' + base.getHexString(); g.shadowBlur = pass; g.fillStyle = '#' + hot.getHexString(); lines.forEach((s, i) => g.fillText(s, PW / 2, y0 + i * (asc + gap))); }
    return canvasTex(c);
  }
  const addMat = (tex) => new THREE.MeshBasicMaterial({ map: tex, color: new THREE.Color(0, 0, 0), blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, fog: false });
  const LABELS = [];      // small engraved, edge-lit labels: they brighten when the panel has power
  function label(text, x, y, h = 0.034, k = 0.5, color = WHITE, parent = G, z = 0.019) {
    const PH = 96, c = document.createElement('canvas'), g0 = c.getContext('2d'); g0.font = `${PH * 0.8}px DINA`; const tw = Math.ceil(g0.measureText(text).width) + 24;
    c.width = tw; c.height = PH; const g = c.getContext('2d'); g.fillStyle = '#000'; g.fillRect(0, 0, tw, PH); g.font = `${PH * 0.8}px DINA`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = color; g.fillText(text, tw / 2, PH / 2 + 4);
    const m = addMat(canvasTex(c)); m.color.setScalar(k); LABELS.push([m, k]); return mesh(new THREE.PlaneGeometry(h * tw / PH, h), m, x, y, z, parent);
  }

  // ---------------- lamps ----------------
  // every lit thing has lv(t): its level from the film time alone
  const LAMPS = [], CW = 0.30, CH = 0.19;
  const lit = (t, on, pop = 0.35) => (t < on - 0.004 ? 0 : smooth(seg(t, on - 0.004, on + 0.03)) * (1 + pop * Math.exp(-Math.max(0, t - on) * 11)));
  function cap(x, y, text, color, w = CW, h = CH, lv = () => 0, parent = G) {
    box(w, h, 0.06, 0.018, M.cap, x, y, 0.07, parent);
    const lm = addMat(legendTex(text, color, (w * 0.95) / (h * 0.92))); mesh(new THREE.PlaneGeometry(w * 0.95, h * 0.92), lm, x, y, 0.1008, parent);
    const L = { mat: lm, lv, gain: color === WHITE ? 0.82 : 1, x, y, color }; LAMPS.push(L); return L;
  }
  // a framed row of caps on its own plate; items = [text, colour, lv]; returns the lamps
  function capRow(cx, y, items, w = CW, h = CH, pitch = w + 0.05, plateH = 0) {
    const n = items.length, x0 = cx - (n - 1) * pitch / 2;
    if (plateH) plate(cx, y - 0.02, n * pitch + 0.30, plateH);
    box(n * pitch + 0.03, h + 0.09, 0.07, 0.02, M.steel, cx, y, 0.045); box(n * pitch - 0.015, h + 0.045, 0.02, 0.012, M.black, cx, y, 0.074);
    return items.map(([text, color, lv], i) => cap(x0 + i * pitch, y, text, color, w, h, lv));
  }
  const GLOWS = [];      // one soft light per group of lamps: [light, lamps, strength]
  const glow = (x, y, color, lamps, k = 0.5) => { const L = pointLight(G, col(color), 0, x, y, 0.34, 1.8); GLOWS.push([L, lamps, k]); return L; };

  // ---------------- switches, knobs, small lamps ----------------
  function toggle(x, y, up = 1, parent = G) {
    zcyl(0.05, 0.05, 0.012, 6, M.steel, x, y, 0.022, parent); zcyl(0.03, 0.034, 0.03, 20, M.chrome, x, y, 0.04, parent);
    const p = new THREE.Group(); p.position.set(x, y, 0.05); p.rotation.x = -up * 0.42; parent.add(p);
    zcyl(0.019, 0.013, 0.2, 18, M.chrome, 0, 0, 0.1, p); mesh(new THREE.SphereGeometry(0.019, 18, 12), M.chrome, 0, 0, 0.2, p);
    return p;
  }
  function guard(x, y) {       // a red guarded switch; the hood hangs on a hinge at its top and can be flipped up
    box(0.2, 0.42, 0.016, 0.01, M.steel, x, y, 0.016);
    const hood = new THREE.Group(); hood.position.set(x, y + 0.178, 0.03); G.add(hood);
    const cheek = (() => { const s = new THREE.Shape(); s.moveTo(0, -0.13); s.lineTo(0.2, -0.13); s.quadraticCurveTo(0.27, -0.13, 0.27, -0.06); s.lineTo(0.27, 0.1); s.quadraticCurveTo(0.27, 0.17, 0.2, 0.17); s.lineTo(0, 0.17); s.closePath();
      const h = new THREE.Path(); h.moveTo(0.05, -0.07); h.lineTo(0.05, 0.11); h.lineTo(0.19, 0.11); h.quadraticCurveTo(0.215, 0.11, 0.215, 0.085); h.lineTo(0.215, -0.045); h.quadraticCurveTo(0.215, -0.07, 0.19, -0.07); h.closePath(); s.holes.push(h);
      return new THREE.ExtrudeGeometry(s, { depth: 0.014, bevelEnabled: true, bevelThickness: 0.003, bevelSize: 0.003, bevelSegments: 2, curveSegments: 16 }); })();
    for (const sx of [-1, 1]) { const m = mesh(cheek, M.red, sx * 0.068 + 0.007, -0.178, -0.006, hood); m.rotation.y = -Math.PI / 2; }
    box(0.15, 0.12, 0.016, 0.006, M.red, 0, -0.148, 0.258, hood); box(0.15, 0.016, 0.26, 0.006, M.red, 0, -0.013, 0.128, hood);
    mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.19, 14).rotateZ(Math.PI / 2), M.chrome, x, y + 0.178, 0.03, G);
    return { hood, lever: toggle(x, y, -1) };
  }
  function knob(x, y, r = 0.075, ang = 0.6) {
    zcyl(r * 1.45, r * 1.5, 0.016, 40, M.dark, x, y, 0.024); zcyl(r * 0.92, r, 0.15, 40, M.knob, x, y, 0.105); zcyl(r * 0.6, r * 0.92, 0.012, 40, M.steel, x, y, 0.184);
    const p = new THREE.Group(); p.position.set(x, y, 0.19); p.rotation.z = ang; G.add(p); box(0.012, r * 0.9, 0.006, 0.002, std(0xe5f2f7, 0.1, 0.4, { emissive: 0xe5f2f7, emissiveIntensity: 0.6 }), 0, r * 0.45, 0.002, p);
  }
  const PILOTS = [];      // small indicator lamps: dark until the panel has power
  function pilot(x, y, color, k = 1.6, r = 0.018) { zcyl(r * 1.5, r * 1.5, 0.014, 20, M.steel, x, y, 0.02); const m = new THREE.MeshBasicMaterial({ color: col(color, k) }); PILOTS.push([m, col(color, k)]); return mesh(new THREE.SphereGeometry(r, 16, 12), m, x, y, 0.03, G); }

  // =====================================================================================
  // the route: three systems on top (left to right), the master switch top right, the skill row under it,
  // three gauges along the bottom (right to left), the call to action on the left
  // =====================================================================================
  const ON = T('on');
  // power: nearly dark until the master switch is thrown, then the panel comes up with a flicker
  const power = (t) => (t < ON ? 0 : smooth(seg(t, ON, ON + 0.5)) * (1 - 0.35 * Math.max(0, Math.sin((t - ON) * 55)) * Math.exp(-(t - ON) * 7)));
  const STBY = 0.2;      // the three nameplates glow faintly from the first frame, so the first frame can be read

  // ---- three systems: a nameplate, a switch, a red OFF flag ----
  const UY = 0.95, SW = [];
  function system(cx, words, tOn, tOff, tag) {
    plate(cx, UY - 0.14, Math.max(0.86, words.length * 0.41 + 0.36), 0.80);
    const w = words.length === 1 ? 0.50 : 0.36;
    const names = capRow(cx, UY, words.map((s, i) => [s, WHITE, (t) => (t < tOff ? Math.max(STBY, lit(t, tOn[i])) : lerp(1, 0.10, smooth(seg(t, tOff, tOff + 0.07))))]), w, 0.21);
    const lever = toggle(cx - 0.19, UY - 0.33, 1); SW.push([lever, tOff]);
    box(0.33, 0.24, 0.06, 0.02, M.steel, cx + 0.15, UY - 0.33, 0.04); box(0.29, 0.20, 0.02, 0.012, M.black, cx + 0.15, UY - 0.33, 0.068);
    const off = cap(cx + 0.15, UY - 0.33, 'OFF', REDL, 0.27, 0.18, (t) => lit(t, tOff, 0.6)); off.base = 0.008;      // a dark flag: it must not read OFF before the switch is thrown
    label(tag, cx - 0.19, UY - 0.49, 0.03, 0.4); glow(cx, UY, WHITE, names, 0.42); glow(cx + 0.15, UY - 0.33, REDL, [off], 0.7);
  }
  system(-2.10, ['BLENDER'], [T('blender')], T('off1'), 'SYS 1');
  system(-0.55, ['AFTER', 'EFFECTS'], [T('after'), T('effects')], T('off2'), 'SYS 2');
  system(1.00, ['CINEMA', '4D'], [T('cinema'), T('fourd')], T('off3'), 'SYS 3');

  // ---- the master switch: CLAUDE CODE, white while it is asked, green when it is ON ----
  const MX = 2.70, MY = 1.00;
  plate(MX - 0.02, 0.66, 1.10, 1.16);
  { const y = MY, w = 0.37, h = 0.22, pitch = 0.40, x0 = MX - 0.20;
    box(2 * pitch + 0.03, h + 0.09, 0.07, 0.02, M.steel, MX, y, 0.045); box(2 * pitch - 0.015, h + 0.045, 0.02, 0.012, M.black, MX, y, 0.074);
    const asked = [], on = [];
    [['CLAUDE', T('claude')], ['CODE', T('code')]].forEach(([s, tw], i) => {
      asked.push(cap(x0 + i * pitch, y, s, WHITE, w, h, (t) => (t < ON ? Math.max(0.03, lit(t, tw)) : 1 - smooth(seg(t, ON, ON + 0.05)))));
      const lm = addMat(legendTex(s, GREEN, (w * 0.95) / (h * 0.92))); mesh(new THREE.PlaneGeometry(w * 0.95, h * 0.92), lm, x0 + i * pitch, y, 0.1012, G);
      const L = { mat: lm, lv: (t) => lit(t, ON, 0.9), gain: 1.05, color: GREEN }; LAMPS.push(L); on.push(L);
    });
    box(0.42, 0.27, 0.06, 0.02, M.steel, MX + 0.20, 0.47, 0.04); box(0.38, 0.23, 0.02, 0.012, M.black, MX + 0.20, 0.47, 0.068);
    on.push(cap(MX + 0.20, 0.47, 'ON', GREEN, 0.36, 0.21, (t) => lit(t, ON, 0.9))); on[on.length - 1].base = 0.008; on[0].base = on[1].base = 0;
    glow(MX, y, WHITE, asked, 0.42); glow(MX + 0.20, 0.47, GREEN, on, 0.36);
    label('MASTER', MX - 0.27, 0.165, 0.03, 0.4);
  }
  const MASTER = guard(MX - 0.27, 0.42);

  // ---- the skill row ----
  const RY = -0.45;
  const ROW = capRow(2.45, RY, [['ONE', AMBER, (t) => lit(t, T('one'))], ['SKILL', AMBER, (t) => lit(t, T('skill'))], ['FLIES', AMBER, (t) => lit(t, T('flies'))], ['THE', AMBER, (t) => lit(t, T('the'))], ['CAMERA', AMBER, (t) => lit(t, T('camera'))]], CW, CH, 0.35, 0.50);
  glow(1.95, RY, AMBER, ROW.slice(0, 2), 0.45); glow(2.80, RY, AMBER, ROW.slice(2), 0.4);
  label('AUTOPILOT', 1.73, RY - 0.19, 0.03, 0.4);

  // ---- three gauges along the bottom; each has its word beside it ----
  const GY = -1.72, HX = 2.20, AX = 0.75, CX = -0.70, GR = 0.335, FACES = [];
  const glassMat = () => envOnly(new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: 1, roughness: 0.05, envMap, envMapIntensity: 0.06, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false }));
  const face = (geo, tex, x, y, z, k, parent = G, extra = {}) => { const m = new THREE.MeshBasicMaterial({ map: tex, color: col(0xffffff, k), ...extra }); FACES.push([m, k]); return mesh(geo, m, x, y, z, parent); };
  function gaugeCase(x, word, tWord, tag) {
    plate(x + 0.17, GY, 1.30, 0.92, [[-0.17, 0, GR + 0.012]]);
    mesh(new THREE.TorusGeometry(GR + 0.022, 0.026, 16, 96), M.steel, x, GY, 0.03, G);
    box(0.50, 0.32, 0.06, 0.02, M.steel, x + 0.60, GY + 0.02, 0.04); box(0.46, 0.28, 0.02, 0.012, M.black, x + 0.60, GY + 0.02, 0.068);
    const L = cap(x + 0.60, GY + 0.02, word, AMBER, 0.44, 0.26, (t) => lit(t, tWord, 0.5)); glow(x + 0.55, GY, AMBER, [L], 0.6);
    label(tag, x + 0.60, GY - 0.22, 0.03, 0.45); mesh(new THREE.CircleGeometry(GR + 0.006, 96), glassMat(), x, GY, 0.03, G);
  }
  // the horizon: it reads the camera's own roll and pitch
  gaugeCase(HX, 'TILTS', T('tilts'), 'ATTITUDE');
  const hzTex = (() => {      // sky above, ground below, pitch ladder
    const S = 1024, c = document.createElement('canvas'); c.width = S; c.height = S; const g = c.getContext('2d');
    const sky = g.createLinearGradient(0, 0, 0, S / 2); sky.addColorStop(0, '#0b2e40'); sky.addColorStop(1, '#2a86ad'); g.fillStyle = sky; g.fillRect(0, 0, S, S / 2);
    const gnd = g.createLinearGradient(0, S / 2, 0, S); gnd.addColorStop(0, '#a85a0c'); gnd.addColorStop(1, '#3a1d04'); g.fillStyle = gnd; g.fillRect(0, S / 2, S, S / 2);
    g.strokeStyle = '#f2f8fa'; g.fillStyle = '#f2f8fa'; g.lineWidth = 9; g.beginPath(); g.moveTo(0, S / 2); g.lineTo(S, S / 2); g.stroke();
    g.font = '44px DINA'; g.textAlign = 'center'; g.textBaseline = 'middle';
    for (let i = -4; i <= 4; i++) { if (!i) continue; const y = S / 2 - i * 62, big = i % 2 === 0, w = big ? 150 : 76; g.lineWidth = big ? 6 : 4; g.beginPath(); g.moveTo(S / 2 - w, y); g.lineTo(S / 2 + w, y); g.stroke(); if (big) { g.fillText(String(Math.abs(i) * 5), S / 2 - w - 40, y + 3); g.fillText(String(Math.abs(i) * 5), S / 2 + w + 40, y + 3); } }
    return canvasTex(c);
  })();
  const HZ = new THREE.Group(); HZ.position.set(HX, GY, 0.006); G.add(HZ);
  const hzDisc = face(new THREE.CircleGeometry(0.44, 96), hzTex, 0, 0, 0, 0.8, HZ);
  { const S = 1024, c = document.createElement('canvas'); c.width = S; c.height = S; const g = c.getContext('2d'), R = S / 2;      // fixed to the case: the amber aircraft symbol and the bank scale
    g.strokeStyle = AMBER; g.fillStyle = AMBER; g.lineWidth = 22; g.lineCap = 'round'; g.lineJoin = 'round';
    g.beginPath(); g.moveTo(R - 300, R); g.lineTo(R - 120, R); g.lineTo(R - 120, R + 46); g.stroke(); g.beginPath(); g.moveTo(R + 300, R); g.lineTo(R + 120, R); g.lineTo(R + 120, R + 46); g.stroke();
    g.beginPath(); g.arc(R, R, 17, 0, Math.PI * 2); g.fill(); g.strokeStyle = '#f2f8fa';
    for (const a of [-60, -45, -30, -20, -10, 0, 10, 20, 30, 45, 60]) { const r0 = R * 0.985, r1 = R * (a % 30 === 0 ? 0.86 : 0.91), q = (a - 90) * D2R; g.lineWidth = a % 30 === 0 ? 10 : 6; g.beginPath(); g.moveTo(R + Math.cos(q) * r0, R + Math.sin(q) * r0); g.lineTo(R + Math.cos(q) * r1, R + Math.sin(q) * r1); g.stroke(); }
    face(new THREE.CircleGeometry(GR, 96), canvasTex(c), HX, GY, 0.012, 1.5, G, { transparent: true, depthWrite: false }); }
  { const s = new THREE.Shape(); s.moveTo(0, GR * 0.84); s.lineTo(-0.028, GR * 0.72); s.lineTo(0.028, GR * 0.72); s.closePath(); mesh(new THREE.ShapeGeometry(s), new THREE.MeshBasicMaterial({ color: col(AMBER, 1.6) }), 0, 0, 0.003, HZ); }

  // the altimeter: it reads the camera's height over the panel
  gaugeCase(AX, 'DIVES', T('dives'), 'CAM HEIGHT');
  { const S = 1024, c = document.createElement('canvas'); c.width = S; c.height = S; const g = c.getContext('2d'), R = S / 2;
    g.fillStyle = '#05070a'; g.fillRect(0, 0, S, S); g.strokeStyle = '#e5f2f7'; g.fillStyle = '#e5f2f7'; g.textAlign = 'center'; g.textBaseline = 'middle';
    for (let i = 0; i < 50; i++) { const q = (i / 50) * Math.PI * 2 - Math.PI / 2, big = i % 5 === 0, r0 = R * 0.96, r1 = R * (big ? 0.82 : 0.89); g.lineWidth = big ? 12 : 5; g.beginPath(); g.moveTo(R + Math.cos(q) * r0, R + Math.sin(q) * r0); g.lineTo(R + Math.cos(q) * r1, R + Math.sin(q) * r1); g.stroke(); }
    g.font = '118px DINC'; for (let i = 0; i < 10; i++) { const q = (i / 10) * Math.PI * 2 - Math.PI / 2; g.fillText(String(i), R + Math.cos(q) * R * 0.66, R + Math.sin(q) * R * 0.66 + 8); }
    g.font = '50px DINA'; g.fillStyle = '#89e3aa'; g.fillText('ALT', R, R - 110);
    face(new THREE.CircleGeometry(GR, 96), canvasTex(c), AX, GY, 0.006, 0.9); }
  const needle = (x, len, w, color, k, z) => { const p = new THREE.Group(); p.position.set(x, GY, z); G.add(p); const s = new THREE.Shape(); s.moveTo(-w / 2, -len * 0.16); s.lineTo(w / 2, -len * 0.16); s.lineTo(w * 0.22, len); s.lineTo(-w * 0.22, len); s.closePath(); const m = new THREE.MeshBasicMaterial({ color: col(color, k) }); FACES.push([m, k, col(color, 1)]); mesh(new THREE.ShapeGeometry(s), m, 0, 0, 0, p); return p; };
  const N1 = needle(AX, GR * 0.55, 0.045, WHITE, 1.3, 0.012), N2 = needle(AX, GR * 0.88, 0.022, AMBER, 1.9, 0.016);
  zcyl(0.026, 0.026, 0.01, 24, M.steel, AX, GY, 0.022);

  // the gyro: its card holds still while the camera spins
  gaugeCase(CX, 'SPINS', T('spins'), 'GYRO');
  const GYRO = new THREE.Group(); GYRO.position.set(CX, GY, 0.006); G.add(GYRO);
  { const S = 1024, c = document.createElement('canvas'); c.width = S; c.height = S; const g = c.getContext('2d'), R = S / 2;
    g.fillStyle = '#05070a'; g.fillRect(0, 0, S, S); g.strokeStyle = '#e5f2f7'; g.fillStyle = '#e5f2f7'; g.textAlign = 'center'; g.textBaseline = 'middle';
    for (let i = 0; i < 72; i++) { const q = (i / 72) * Math.PI * 2 - Math.PI / 2, big = i % 6 === 0, r0 = R * 0.97, r1 = R * (big ? 0.84 : 0.90); g.lineWidth = big ? 11 : 5; g.beginPath(); g.moveTo(R + Math.cos(q) * r0, R + Math.sin(q) * r0); g.lineTo(R + Math.cos(q) * r1, R + Math.sin(q) * r1); g.stroke(); }
    ['N', '3', '6', 'E', '12', '15', 'S', '21', '24', 'W', '30', '33'].forEach((s, i) => { const q = (i / 12) * Math.PI * 2; g.save(); g.translate(R + Math.sin(q) * R * 0.66, R - Math.cos(q) * R * 0.66); g.rotate(q); g.font = `${'NESW'.includes(s) ? 132 : 84}px DINC`; g.fillStyle = s === 'N' ? AMBER : '#e5f2f7'; g.fillText(s, 0, 8); g.restore(); });
    g.strokeStyle = '#3d6f80'; g.lineWidth = 6; g.beginPath(); g.arc(R, R, R * 0.36, 0, Math.PI * 2); g.stroke();
    face(new THREE.CircleGeometry(GR, 96), canvasTex(c), 0, 0, 0, 0.9, GYRO); }
  { const s = new THREE.Shape(); s.moveTo(0, GR * 0.40); s.lineTo(-0.05, -GR * 0.30); s.lineTo(0, -GR * 0.18); s.lineTo(0.05, -GR * 0.30); s.closePath();      // the pointer: part of the stabilised card, so it keeps pointing at the top of the SCREEN while the case, the screws and the word go round it
    const m = new THREE.MeshBasicMaterial({ color: col(AMBER, 1.7) }); FACES.push([m, 1.7, col(AMBER, 1)]); mesh(new THREE.ShapeGeometry(s), m, 0, 0, 0.006, GYRO); }

  // ---- the call to action ----
  const QX = -2.45;
  plate(QX, -0.90, 1.40, 1.46);
  const CTA = [];
  { box(0.62, 0.33, 0.07, 0.02, M.steel, QX, -0.42, 0.045); box(0.585, 0.285, 0.02, 0.012, M.black, QX, -0.42, 0.074);
    CTA.push(cap(QX, -0.42, 'COMMENT', WHITE, 0.56, 0.24, (t) => lit(t, T('comment'))));
    // the display: one big word
    box(1.06, 0.48, 0.05, 0.02, M.steel, QX, -0.86, 0.035); box(1.00, 0.42, 0.02, 0.01, M.black, QX, -0.86, 0.058);
    const PW = 1400, PH = 560, c = document.createElement('canvas'); c.width = PW; c.height = PH; const g = c.getContext('2d');
    g.fillStyle = '#000'; g.fillRect(0, 0, PW, PH); g.fillStyle = 'rgba(95,227,255,0.07)'; g.fillRect(0, 0, PW, PH);
    g.font = '470px DINC'; g.textAlign = 'center'; g.textBaseline = 'alphabetic'; const s = 'F L Y', m = g.measureText(s);
    for (const pass of [40, 0]) { g.shadowColor = CYAN; g.shadowBlur = pass; g.fillStyle = '#8fecff'; g.fillText(s, PW / 2, PH / 2 + m.actualBoundingBoxAscent / 2); }
    g.shadowBlur = 0; g.globalCompositeOperation = 'destination-out'; g.fillStyle = 'rgba(0,0,0,0.42)'; for (let y = 0; y < PH; y += 8) g.fillRect(0, y, PW, 3);      // scan lines: a display, not paint
    g.globalCompositeOperation = 'source-over';
    const lm = addMat(canvasTex(c)); mesh(new THREE.PlaneGeometry(0.98, 0.40), lm, QX, -0.86, 0.0685, G);
    const FLY = { mat: lm, lv: (t) => { const t0 = T('fly'); return t < t0 ? 0 : (0.55 + 0.45 * smooth(seg(t, t0 + 0.04, t0 + 0.2))) * (1 + 0.6 * Math.exp(-(t - t0) * 9)) * (t - t0 < 0.1 && Math.sin((t - t0) * 190) > 0.4 ? 0.45 : 1) * (1 + 0.05 * Math.sin((t - t0) * 6)); }, gain: 1.15, color: CYAN }; LAMPS.push(FLY); CTA.push(FLY);
    glow(QX, -0.86, CYAN, [FLY], 0.6);
    const row = capRow(QX, -1.33, [["I'LL\nSEND", AMBER, (t) => lit(t, T('ill'))], ['YOU', AMBER, (t) => lit(t, T('you'))], ['THE\nSKILL', AMBER, (t) => lit(t, T('theskill'))]], 0.36, 0.27, 0.40);
    glow(QX, -0.45, WHITE, [CTA[0]], 0.45); glow(QX, -1.33, AMBER, row, 0.4); label('COMMS', QX - 0.52, -0.62, 0.03, 0.4); }

  // ---- everything else on the panel: switch strips, knobs, pilot lamps (the camera swings past them) ----
  function strip(x0, y, names, dx = 0.26) { plate(x0 + (names.length - 1) * dx / 2, y - 0.02, names.length * dx + 0.2, 0.44); names.forEach((s, i) => { const x = x0 + i * dx, dn = hash(x * 7.3 + y * 3.1) > 0.62; toggle(x, y, dn ? -1 : 1); label(s, x, y - 0.16, 0.03, 0.4); pilot(x, y + 0.13, dn ? AMBER : GREEN, dn ? 0.6 : 1.5, 0.014); }); }
  strip(-1.40, -0.30, ['CAM', 'LENS', 'IRIS', 'ROLL', 'PITCH', 'YAW', 'SHTR', 'GAIN']);
  strip(0.05, -0.93, ['KEY', 'FILL', 'RIM', 'FOG', 'BLOOM']);
  strip(3.72, 0.60, ['A', 'B', 'C']); strip(-3.55, 0.60, ['L1', 'L2', 'L3']); strip(-3.50, -1.85, ['X', 'Y', 'Z', 'W']);
  plate(1.12, 0.10, 0.90, 0.44); knob(0.92, 0.12, 0.085, 0.7); knob(1.32, 0.12, 0.085, -0.4); label('FOCUS', 0.92, -0.06, 0.03, 0.4); label('ZOOM', 1.32, -0.06, 0.03, 0.4);
  plate(-1.47, -1.13, 0.48, 0.48); knob(-1.47, -1.10, 0.085, 1.1); label('TRIM', -1.47, -1.29, 0.03, 0.4);
  plate(3.75, -1.55, 0.90, 0.60); knob(3.55, -1.50, 0.09, 0.3); knob(3.95, -1.50, 0.09, 2.0); label('SPEED', 3.75, -1.75, 0.03, 0.4);
  // far lamps all over the panel: they turn into soft discs out of focus; they come on with the power
  const FAR = new THREE.MeshBasicMaterial({ color: 0xffffff });
  { const N = 520, im = new THREE.InstancedMesh(new THREE.PlaneGeometry(1, 1), FAR, N), o = new THREE.Object3D(), cols = [AMBER, GREEN, WHITE, WHITE, AMBER, REDL, CYAN];
    const blocked = (x, y) => (x > -4.2 && x < 4.5 && y > -2.5 && y < 1.55);
    let k = 0;
    for (let i = 0; k < N && i < 6000; i++) {
      const x = -8.2 + hash(i * 1.71) * 17, y = -5.2 + hash(i * 2.93) * 9.6; if (blocked(x, y)) continue;
      const gx = Math.round(x / 0.22) * 0.22, gy = Math.round(y / 0.2) * 0.2, wide = hash(i * 4.4) > 0.6, s = 0.022 + 0.022 * hash(i * 6.1);
      o.position.set(gx, gy, 0.012); o.scale.set(wide ? s * 3.2 : s, s, 1); o.updateMatrix(); im.setMatrixAt(k, o.matrix);
      im.setColorAt(k, col(cols[Math.floor(hash(i * 8.3) * cols.length)], 0.3 + 1.1 * hash(i * 9.7) * hash(i * 3.1))); k++;
    }
    im.count = k; im.instanceMatrix.needsUpdate = true; im.instanceColor.needsUpdate = true; G.add(im); }

  // ---------------- light ----------------
  { const key = new THREE.DirectionalLight(col(0xcfe6f2), 0.9); key.position.set(-3, 3.2, 2.2); key.target.position.set(0.3, -0.4, 0); G.add(key, key.target); }
  { const rim = new THREE.DirectionalLight(col(0xffb34d), 0.3); rim.position.set(4, -2.5, 1.2); rim.target.position.set(0.3, -0.4, 0); G.add(rim, rim.target); }
  const POOLS = [[0xd6ecf5, 2.0, -2.2, 1.5, 1.4], [0xffe2b8, 1.6, -0.5, 1.4, 1.5], [0xd6ecf5, 1.9, 1.1, 1.5, 1.4], [0xcfe9f5, 2.2, 2.8, 1.2, 1.4],
    [0xffe2b8, 1.6, 2.5, -0.5, 1.4], [0xcfe9f5, 2.4, 2.3, -1.6, 1.3], [0xd6ecf5, 2.2, 0.6, -1.6, 1.3], [0xcfe9f5, 2.2, -0.8, -1.6, 1.3], [0xd6ecf5, 2.2, -2.5, -0.9, 1.4]]
    .map(([c, i, x, y, z]) => [pointLight(G, col(c), i, x, y, z, 4.5), i]);

  // =====================================================================================
  // camera: SNAP, HOLD, SNAP, HOLD. The rhythm measured on the reference's frames: the picture jumps about half a screen in 3 to 6 frames,
  // then holds while the word is read, still drifting; about 1.5 fast moves per second.
  // poses: [arrive, move, look, azimuth, elevation, distance, roll, kind, dip]
  //   arrive = when the camera lands; move = how long the move into it takes. Between landings the camera HOLDS the pose and only drifts.
  //   kind: 'snap' = a hard start, the object is seen travelling for about 3 frames; 'whip' = a longer swing with a start and a stop;
  //         'ease' = a slow change; 'spin' = a snap that also rolls the camera once round (360 degrees). dip = how far a whip ducks towards the panel.
  // azimuth: degrees off the panel's normal (minus = the camera sits to the left and looks right); elevation: plus = above, looking down
  // =====================================================================================
  const Z = 0.08, GZ = 0.03;
  const sys = (cx, n1, n2, tq, tOff, tNext, sg) => {      // one system: its name on the question, a second look inside the question, its switch on "Off", then back out in the breath
    const two = n2 !== null, out = [];
    out.push([tq[0] + 0.03, 0.17, [n1, UY, Z], -30, 5, 0.64, -6 * sg, cx < -2 ? 'snap' : 'whip', 0, cx < -2 ? 'crash' : 'name']);
    if (two) out.push([tq[1] + 0.02, 0.11, [n2, UY, Z], -23, 4, 0.62, 4 * sg, 'snap', 0, 'name2']);
    const mid = two ? (tq[1] + tOff) / 2 + 0.03 : (tq[0] + tOff) / 2 + 0.03;
    out.push([mid, 0.11, [cx + (two ? 0 : 0.04), UY - 0.01, Z], two ? -12 : 13, two ? 9 : 8, two ? 0.98 : 0.50, 5 * sg * (two ? -1 : 1), 'snap', 0, 'look']);      // a second look inside the question: two words = both in frame, one word = punched in from the other side
    out.push([tOff + 0.02, 0.13, [cx + 0.04, UY - 0.18, Z], -19, -7, 0.84, 5 * sg, 'snap', 0, 'off']);                                        // down to the switch: OFF comes up red
    out.push([tOff + 0.36, 0.12, [cx + 0.02, UY - 0.15, Z], 9, 3, 1.22, -4 * sg, 'snap', 0, 'out']);                                         // back out: the dead name over its red flag
    return out;
  };
  const PO = OPT.poses || [
    [-1.0, 0, [-2.03, 0.79, 0.05], -17, 5, 1.15, -6, 'snap', 0],                              // the first frame: the first system, its name faintly lit, its switch still up
    ...sys(-2.10, -2.10, null, [T('blender')], T('off1'), T('after'), 1),                     // "Blender? Off."
    ...sys(-0.55, -0.74, -0.36, [T('after'), T('effects')], T('off2'), T('cinema'), -1),      // "After Effects? Off."
    ...sys(1.00, 0.81, 1.19, [T('cinema'), T('fourd')], T('off3'), T('claude'), 1),           // "Cinema 4D? Off."
    // "Claude Code? On."
    [T('claude') + 0.03, 0.18, [MX - 0.20, MY, Z], -32, 4, 0.68, -7, 'whip', 0, 'name'],
    [T('code') + 0.02, 0.11, [MX + 0.20, MY, Z], -24, 4, 0.66, 4, 'snap', 0, 'name2'],
    [(T('code') + ON) / 2 + 0.04, 0.11, [MX, MY - 0.02, Z], -11, 9, 1.00, -4, 'snap', 0, 'look'],     // both words, still white: the question
    [ON + 0.02, 0.13, [MX - 0.03, 0.80, Z], -14, -5, 1.30, 3, 'snap', 0, 'on'],                     // the guard flips, the switch is thrown, green
    [ON + 0.42, 0.17, [0.55, -0.38, 0], -7, 3, 4.7, -2, 'snap', 0, 'panel'],                           // back, fast: the whole panel comes up
    // "One skill flies the camera."
    [T('one') + 0.03, 0.17, [1.925, RY, Z], -22, 5, 0.80, -6, 'snap', 0, 'one'],                     // crash in: ONE SKILL
    [T('flies') + 0.04, 0.12, [2.29, RY, Z], -13, 4, 0.78, 5, 'snap', 0, 'row'],                     // SKILL stays in frame beside FLIES
    [T('camera') - 0.04, 0.13, [2.985, RY, Z], -15, 3, 0.74, -4, 'snap', 0, 'row'],                   // THE CAMERA
    [T('camera') + 0.52, 0.13, [2.50, RY - 0.01, Z], 8, 7, 1.72, 3, 'snap', 0, 'line'],               // back out: the whole line
    // "It tilts."
    [T('it1') + 0.02, 0.20, [HX + 0.24, GY, GZ], -36, 20, 1.34, 24, 'whip', 0.26, 'horizon'],            // the swing down to the horizon, landing tilted
    [T('tilts') + 0.21, 0.22, [HX + 0.24, GY, GZ], -28, 17, 1.28, -19, 'snap', 0, 'tilt'],            // on the word the camera tilts the other way: the horizon answers
    [T('tilts') + 0.45, 0.22, [HX + 0.24, GY, GZ], -24, 15, 1.25, 3, 'ease', 0, 'level'],
    // "It dives."
    [T('it2') + 0.02, 0.14, [AX + 0.24, GY + 0.04, GZ], -24, 20, 1.28, 6, 'snap', 0, 'alt'],         // snap to the altimeter
    [T('dives') + 0.17, 0.18, [AX + 0.22, GY - 0.04, GZ], -18, -17, 1.20, -6, 'snap', 0, 'dive'],     // on the word the camera drops: the needle unwinds
    // "It spins."
    [T('it3') + 0.04, 0.14, [CX + 0.12, GY, GZ], -20, 10, 1.34, 7, 'snap', 0, 'gyro'],                // snap to the gyro
    [T('spins') + 0.46, 0.48, [CX, GY, GZ], -10, 7, 1.42, -5, 'spin', 0, 'spin'],                     // on the word the camera rolls once round the gauge: the card holds still
    // "Comment fly. I'll send you the skill."
    [T('comment') + 0.03, 0.20, [QX, -0.42, Z], 24, 6, 0.74, -8, 'whip', 0.1, 'comment'],
    [T('fly') + 0.02, 0.12, [QX, -0.82, 0.06], 15, -4, 0.94, 5, 'snap', 0, 'fly'],
    [T('fly') + 0.31, 0.10, [QX + 0.02, -0.85, 0.06], 4, 3, 0.70, -3, 'snap', 0, 'punch'],             // punch in on the word to type
    [T('ill') + 0.02, 0.12, [QX - 0.02, -1.33, Z], 13, -9, 1.22, -4, 'snap', 0, 'send'],             // all three tiles in frame
    [T('theskill') + 0.02, 0.11, [QX + 0.03, -1.33, Z], -6, -5, 1.02, 4, 'snap', 0, 'skill'],
    [F('skillEnd') + 0.05, 0.17, [QX, -0.89, 0.04], 5, 1, 2.05, 0, 'snap', 0, 'end'],                 // back to the whole call to action: the end card
  ];
  const eyeOf = (L, az, el, d) => { const ca = Math.cos(az * D2R), sa = Math.sin(az * D2R), ce = Math.cos(el * D2R), se = Math.sin(el * D2R); return [L[0] + d * sa * ce, L[1] + d * se, L[2] + d * ca * ce]; };
  const EASE = { snap: (u) => 1 - (1 - u) * (1 - u), whip: (u) => (u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2), ease: (u) => u * u * (3 - 2 * u), spin: (u) => u * u * (3 - 2 * u) };
  // a held pose keeps drifting: the look point follows through in the direction the camera came from, the camera arcs towards the front, pushes in, its tilt eases
  const DIRS = PO.map((P, i) => { if (!i || P[7] === 'ease' || P[7] === 'spin') return [0, 0]; const dx = P[2][0] - PO[i - 1][2][0], dy = P[2][1] - PO[i - 1][2][1], n = Math.hypot(dx, dy); return n < 0.05 ? [0, 0] : [dx / n, dy / n]; });
  function held(i, t) { const P = PO[i], dt = Math.min(1.2, Math.max(0, t - P[0])), k = OPT.poses ? 0 : 1, v = (i === PO.length - 1 ? 0 : 0.36) * Math.min(P[5], 0.9) * dt * k;      // the constants of test v3; a wide view follows through no faster than a close one, or its words slide out of frame
    return { L: [P[2][0] + DIRS[i][0] * v, P[2][1] + DIRS[i][1] * v, P[2][2]], az: P[3] - Math.sign(P[3]) * 9 * dt * k, el: P[4] + 2.5 * dt * k, d: P[5] * (1 - 0.09 * dt * k), roll: P[6] * (1 - 0.14 * dt * k) }; }
  const inMove = (t) => PO.some((P, i) => i && P[7] !== 'ease' && t >= P[0] - P[1] - 0.02 && t <= P[0] + 0.03);
  function camAt(t) {
    let j = 0; while (j < PO.length - 1 && t >= PO[j + 1][0] - PO[j + 1][1]) j++;      // the latest pose whose move has begun
    let c;
    if (j === 0 || t >= PO[j][0]) c = held(j, t);
    else {
      const P = PO[j], t0 = P[0] - P[1], A = held(j - 1, t0), u = clamp((t - t0) / P[1]), p = EASE[P[7]](u);
      c = { L: [0, 1, 2].map((q) => lerp(A.L[q], P[2][q], p)), az: lerp(A.az, P[3], p), el: lerp(A.el, P[4], p), d: lerp(A.d, P[5], p) - P[8] * Math.sin(Math.PI * p), roll: lerp(A.roll, P[6], p) + (P[7] === 'spin' ? 360 * p : 0) };      // a spin = once round on the way
    }
    let { L, az, el, d, roll } = c;
    for (const P of PO) if (P[7] === 'spin' && t >= P[0]) roll += 360;      // after a spin the roll stays one turn up: it must never jump back between two samples
    // every landing rings once (the move's own momentum) and dies within a few frames
    for (let i = 1; i < PO.length; i++) { const P = PO[i]; if (t < P[0] || t > P[0] + 0.6 || P[7] === 'ease') continue; const s = spring(t, P[0], 5.5, 15), big = P[7] === 'whip' ? 1.7 : 1; roll += 2.4 * big * s * Math.sign(P[6] || 1); az += 1.1 * big * s; d *= 1 - 0.012 * big * s; }
    return { e: eyeOf(L, az, el, d), l: L, roll };
  }
  const keys = [];
  for (let i = -48; i <= (END + 0.2) * 240; i++) { const t = i / 240, c = camAt(t); keys.push([t, c.e, c.l, c.roll]); }
  window.__kf = { keys, end: END, moves: PO.slice(1).map((P) => [+(P[0] - P[1]).toFixed(3), +P[0].toFixed(3), P[7], P[9] || '']), on: ON, words: Object.fromEntries(['blender', 'off1', 'after', 'effects', 'off2', 'cinema', 'fourd', 'off3', 'claude', 'code', 'on', 'one', 'skill', 'flies', 'the', 'camera', 'it1', 'tilts', 'it2', 'dives', 'it3', 'spins', 'comment', 'fly', 'ill', 'you', 'theskill'].map((k) => [k, T(k)])) };
  const fastf = {};      // every fast move gets three times the sub-frames, so its smear is smooth and not a row of copies
  for (const P of PO.slice(1)) if (P[7] !== 'ease') for (let f = Math.floor((P[0] - P[1]) * FPS); f <= Math.ceil((P[0] + 0.04) * FPS); f++) fastf[f] = 3;

  // =====================================================================================
  // pose: everything that moves, from t alone
  // =====================================================================================
  const _f = new THREE.Vector3(), _r = new THREE.Vector3(), _up = new THREE.Vector3(), LAG = 0.035;
  function camFrame(t) {      // the camera's right vector and its forward, in the panel's space
    const c = camAt(t); _f.set(c.l[0] - c.e[0], c.l[1] - c.e[1], c.l[2] - c.e[2]).normalize();
    _up.set(0, 1, 0).applyAxisAngle(_f, c.roll * D2R); _r.crossVectors(_f, _up).normalize(); return c;
  }
  function pose(t) {
    const pw = OPT.allOn ? 1 : power(t);
    for (const L of LAMPS) L.mat.color.setScalar(OPT.allOn ? 1.0 : (L.base ?? 0.03) + L.lv(t) * L.gain);
    for (const [L, lamps, k] of GLOWS) L.intensity = lamps.reduce((s, q) => s + (OPT.allOn ? 1 : Math.min(1.3, q.lv(t))), 0) * k / Math.sqrt(lamps.length);
    for (const [m, k] of LABELS) m.color.setScalar(k * (0.45 + 0.75 * pw));
    for (const [m, c] of PILOTS) m.color.copy(c).multiplyScalar(0.05 + 0.95 * pw);
    for (const [m, k, c] of FACES) { if (c) m.color.copy(c).multiplyScalar(k * (0.16 + 0.84 * pw)); else m.color.setScalar(k * (0.16 + 0.84 * pw)); }
    FAR.color.setScalar(0.10 + 0.90 * pw);
    for (const [L, i] of POOLS) L.intensity = i * (0.62 + 0.38 * pw);
    // the three switches: thrown on "Off"
    for (const [lever, tOff] of SW) lever.rotation.x = -0.42 * (1 - 2 * smooth(seg(t, tOff - 0.035, tOff + 0.015)) + 0.22 * spring(t, tOff + 0.015, 9, 16));
    // the master switch: the hood flips up just before "On", the lever is thrown on it
    MASTER.hood.rotation.x = -1.75 * (smooth(seg(t, ON - 0.13, ON - 0.03)) + 0.08 * spring(t, ON - 0.03, 7, 12));
    MASTER.lever.rotation.x = -0.42 * (-1 + 2 * smooth(seg(t, ON - 0.02, ON + 0.02)) - 0.22 * spring(t, ON + 0.02, 9, 16));
    // the horizon: parallel to the camera's own horizon, so it stays level on screen while the case tilts; pitch slides it
    camFrame(t); GYRO.rotation.z = Math.atan2(_r.y, _r.x);      // the gyro card holds dead still on screen while the camera rolls round it
    const c = camFrame(t - LAG);
    HZ.rotation.z = Math.atan2(_r.y, _r.x);
    hzDisc.position.y = clamp(Math.asin(clamp(-_f.y, -1, 1)) / D2R * 0.0048, -0.085, 0.085);      // looking down = the horizon rises
    // the altimeter: the camera's height (y) drives the needles, 1 unit down = 1.55 turns of the thin needle (the dive = about 1.5 turns: it ends on the
    // other side of the dial). The needle lags like a real one (a weighted mean of the last 0.33 s), so it is still unwinding after the camera has landed.
    let hs = 0, hw = 0; for (let k = 0; k < 12; k++) { const q = Math.exp(-k * 0.3); hs += camAt(t - k * 0.03).e[1] * q; hw += q; }
    const h = (hs / hw) * 1.55; N2.rotation.z = -h * Math.PI * 2; N1.rotation.z = -h * Math.PI * 2 / 10 - 2.2;
  }

  return { id: OPT.id || 'flight', t0: 0, t1: END, groups: [G], keys, fov: 40, fog: 0.02, env: 0.75, envMap, exposure: 1.0,
    lens: OPT.lens ?? ((t) => lerp(0.011, 0.0035, smooth(seg(camAt(t).e[2], 1.25, 2.0)))),      // wide views stay sharp; close views get the shallow focus
    shutter: (t) => (inMove(t) ? 0.8 : 0.45) / 30, bloom: [0.34, 0.4, 0.93], vig: 0.5, fastf, pose };
}
