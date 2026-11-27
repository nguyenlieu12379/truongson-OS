// Timeline of the FLIGHT DECK film. The voice is ONE uncut take (sound/voice.mp3); it starts T0 seconds into the film.
// V = where each word STARTS in the take (seconds), read off the take's loudness curve (tools/level_curve.py, 10 ms steps); Whisper only for the order
// (its own times were up to 0.25 s off inside "One skill flies the camera").
// "Blender? Off. After Effects? Off. Cinema 4D? Off. Claude Code? On. One skill flies the camera. It tilts. It dives. It spins. Comment fly. I'll send you the skill."
export const T0 = 0.20;
export const V = {
  blender: 0.07, off1: 0.90,
  after: 1.66, effects: 1.96, off2: 2.69,
  cinema: 3.43, fourd: 3.85, off3: 4.64,
  claude: 5.42, code: 5.74, on: 6.39,
  one: 7.21, skill: 7.44, flies: 7.66, the: 8.05, camera: 8.16,
  it1: 9.22, tilts: 9.39,
  it2: 9.99, dives: 10.21,
  it3: 10.82, spins: 11.19,
  comment: 12.02, fly: 12.36,
  ill: 12.93, you: 13.22, theskill: 13.34, skillEnd: 13.75,
};
export const F = (k) => T0 + V[k];      // film time of a word
export const END = 14.9;                // film length: the voice ends at 13.95, the end card holds for about a second
