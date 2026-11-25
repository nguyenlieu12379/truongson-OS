// The film's clock, built from the voice timings (timing.js). Pure data: film.js draws it, build_cues.mjs sounds it.
import { WORDS, LINES, VOICE_END } from './timing.js';

export const total = 45;
const wordsOf = (l) => WORDS.filter((w) => w[3] === l);
export const w = (l, i) => wordsOf(l)[i][1];                 // start of word i in line l
export const L = (l) => LINES[l][0];
export const CHAR = 1 / 15;                                 // typing speed: 2 frames per letter

// sections: the screen clears at each start
export const SEC = { hook: 0, intro: L(1), s1: L(2), s2: L(5), s3: L(8), s4: L(11), s5: L(14), fix: L(17), cta: L(18), end: total };
export const SECTIONS = Object.entries(SEC).slice(0, -1).map(([name, a], i, arr) => ({ name, a, b: i + 1 < arr.length ? arr[i + 1][1] : total }));

// 3D beats
export const EV = {
  pcPop: 0.0, kbPop: 0.2, lampOn: 0.8,
  sticky: w(3, 5),           // "every week"
  floppy: w(6, 7) - 0.25,    // lands on "skill"
  clock: w(16, 1),           // "schedule"
  mugHop: L(17) - 0.05,      // the run finishes
  pushIn: L(18),
};

// screen ops on a 640x480 canvas. kind: type (typed out), pop (appears), tick (a check), strike (red line through)
const G = '#b9ffd1', DIM = '#5f9c77', RED = '#ff4a3d', AMBER = '#ffcf6b';
const T = (sec, at, text, x, y, size = 40, color = G, extra = {}) => ({ sec, kind: 'type', at, text, x, y, size, color, ...extra });
const P = (sec, at, text, x, y, size = 40, color = G, extra = {}) => ({ sec, kind: 'pop', at, text, x, y, size, color, ...extra });
export const OPS = [
  // hook: the chatbot habit
  P('hook', 0.35, 'chat', 40, 60, 28, DIM),
  T('hook', 0.5, 'can you help', 70, 175, 46, G, { bubble: true }),
  T('hook', 0.5 + 13 * CHAR, 'me with this?', 70, 235, 46),
  { sec: 'hook', kind: 'strike', at: w(0, 6), x: 50, y: 205, w: 470 },
  P('hook', w(0, 6) + 0.05, 'CHATBOT', 330, 360, 64, RED),
  // intro
  T('intro', L(1), '> claude', 40, 80, 44, DIM),
  P('intro', w(1, 3), 'AUTOMATE', 40, 210, 86, G),
  P('intro', w(1, 4), 'PROPERLY.', 40, 300, 86, G),
  P('intro', w(1, 4) + 0.35, '5 RULES', 40, 410, 44, AMBER),
  // 1
  P('s1', L(2), '01', 40, 90, 60, AMBER),
  T('s1', w(3, 0), 'PICK ONE TASK', 40, 175, 58),
  P('s1', w(3, 5), '+ repeats weekly', 40, 285, 42),
  P('s1', w(4, 1), '- your whole job', 40, 355, 42, DIM),
  { sec: 's1', kind: 'strike', at: w(4, 2), x: 30, y: 342, w: 420 },
  P('s1', w(4, 4), '= ONE TASK', 40, 440, 50, AMBER),
  // 2
  P('s2', L(5), '02', 40, 90, 60, AMBER),
  T('s2', w(6, 0), 'WRITE A SKILL', 40, 175, 58),
  P('s2', w(6, 2), 'SKILL.md', 40, 255, 34, DIM, { box: [30, 222, 580, 170] }),
  T('s2', w(6, 2) + 0.1, '1 pull the data', 50, 305, 36),
  T('s2', w(6, 2) + 0.1 + 16 * CHAR, '2 clean it up', 50, 345, 36),
  T('s2', w(6, 2) + 0.1 + 30 * CHAR, '3 send the report', 50, 385, 36),
  P('s2', w(7, 5), 'SAME. EVERY. TIME.', 40, 450, 44, AMBER),
  // 3
  P('s3', L(8), '03', 40, 90, 60, AMBER),
  T('s3', w(9, 0), 'GIVE IT TOOLS', 40, 175, 58),
  P('s3', w(9, 2), 'CLAUDE', 230, 280, 44, G, { box: [200, 238, 240, 60], hub: true }),
  P('s3', w(10, 2), 'APPS', 60, 420, 40, AMBER, { box: [40, 380, 150, 58], wire: true }),
  P('s3', w(10, 4), 'MCP', 270, 420, 40, AMBER, { box: [245, 380, 150, 58], wire: true }),
  P('s3', w(10, 10), 'SCRIPT', 465, 420, 40, AMBER, { box: [450, 380, 160, 58], wire: true }),
  // 4
  P('s4', L(11), '04', 40, 90, 60, AMBER),
  T('s4', w(12, 0), 'CHECK ITS WORK', 40, 175, 58),
  { sec: 's4', kind: 'tick', at: w(13, 0), text: 'TESTS', x: 40, y: 280, size: 46, color: G },
  { sec: 's4', kind: 'tick', at: w(13, 1), text: 'SCREENSHOTS', x: 40, y: 355, size: 46, color: G },
  { sec: 's4', kind: 'tick', at: w(13, 3), text: 'SECOND LOOK', x: 40, y: 430, size: 46, color: G },
  // 5
  P('s5', L(14), '05', 40, 90, 60, AMBER),
  T('s5', w(15, 0), 'PUT IT ON', 40, 165, 58),
  T('s5', w(15, 0) + 10 * CHAR, 'A TRIGGER', 40, 230, 58),
  P('s5', w(16, 1), 'schedule  09:00', 40, 315, 40, AMBER),
  P('s5', w(16, 4), 'hook  on new file', 40, 375, 40, AMBER),
  { sec: 's5', kind: 'bar', at: w(16, 6), end: L(17) - 0.1, x: 40, y: 405, w: 560, text: 'RUNNING' },
  // fix
  P('fix', w(17, 5), 'FIX THE SKILL.', 40, 200, 64, G),
  P('fix', w(17, 8), 'NOT THE OUTPUT.', 40, 320, 52, DIM),
  { sec: 'fix', kind: 'strike', at: w(17, 10), x: 30, y: 302, w: 560 },
  // ending
  T('cta', w(18, 0), 'COMMENT', 40, 200, 72, G),
  T('cta', w(18, 1), 'AUTOMATE', 40, 330, 100, AMBER, { cursor: true }),
];
export { VOICE_END };
