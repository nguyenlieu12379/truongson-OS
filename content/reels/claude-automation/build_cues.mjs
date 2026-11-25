// Writes sound/cues.json for mix.py from the same timeline the picture uses, so every sound lands on its beat.
import fs from 'node:fs';
import { total, SEC, SECTIONS, EV, OPS, CHAR } from './timeline.js';

const sfx = [];
const S = (file, at, gain_db, why, trim) => sfx.push({ file: `sound/sfx/${file}.wav`, at: +Math.max(0, at).toFixed(3), gain_db, why, ...(trim ? { trim: +trim.toFixed(3) } : {}) });

S('pop1', EV.pcPop + 0.02, -10, 'computer pops in');
S('pop2', EV.kbPop + 0.02, -11, 'keyboard lands');
S('switch', EV.lampOn, -9, 'lamp switches on');
for (const s of SECTIONS.slice(1)) { S('blip', s.a, -16, `screen: ${s.name}`); S('whoosh', s.a - 0.3, -20, `camera move into ${s.name}`); }
let pi = 0;
for (const o of OPS) {
  if (o.kind === 'type') S('typing', o.at, -12, `typing "${o.text}"`, o.text.length * CHAR + 0.05);
  else if (o.kind === 'pop') S(['pop1', 'pop2', 'pop3'][pi++ % 3], o.at, -15, `pop "${o.text}"`);
  else if (o.kind === 'tick') S('ding', o.at, -12, `tick "${o.text}"`);
  else if (o.kind === 'strike') S('scratch', o.at, -11, 'red strike');
  else if (o.kind === 'bar') S('ding', o.end, -12, 'run done');
}
S('pop3', EV.sticky, -12, 'sticky note');
S('slide', EV.floppy - 0.1, -12, 'floppy slides');
S('latch', EV.floppy + 0.28, -9, 'floppy latches');
S('seek', EV.floppy + 0.35, -14, 'drive reads');
S('ratchet', EV.clock, -11, 'clock spins to 9:00');
S('thunk', EV.mugHop + 0.3, -9, 'mug lands');
const auto = OPS.find((o) => o.text === 'AUTOMATE');
S('ding_end', auto.at + auto.text.length * CHAR + 0.05, -9, 'ending');

fs.writeFileSync('sound/cues.json', JSON.stringify({
  length: total, target_lufs: -14,
  voice: { file: 'sound/voice.wav', at: 0, gain_db: 0 },
  music: { file: 'sound/music.wav', start: 0, gain_db: -17, duck: true, fade_out: 1.2 },
  sfx,
}, null, 1));
console.log(`cues -> sound/cues.json  ${sfx.length} effects`);
