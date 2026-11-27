// Timeline of the DEPARTURE BOARD film. The voice is ONE uncut take (sound/voice.mp3); it starts T0 seconds into the film.
// V = where each word STARTS in the take (seconds), read off the take's level curve (tools/level_curve.py; Whisper only for the order).
// "Passengers for Blender, After Effects, and Cinema 4D, please change trains. Your new service runs on one skill. Claude Code. Mind the gap. Comment ticket. I'll send you the skill."
export const T0 = 0.10;
export const V = {
  passengers: 0.08, for: 0.32, blender: 0.68,
  after: 1.46, effects: 1.92,
  and: 2.28, cinema: 2.46, fourd: 2.94,
  please: 3.74, change: 4.04, trains: 4.46,
  your: 5.32, new: 5.48, service: 5.62, runs: 6.04, on: 6.28, one: 6.50, skill: 6.78,
  claude: 7.60, code: 7.92,
  mind: 8.62, the: 8.90, gap: 8.97,
  comment: 9.70, ticket: 10.03,
  ill: 10.68, send: 10.82, you: 11.02, the2: 11.13, skill2: 11.24, end: 11.56,
};
export const F = (k) => T0 + V[k];      // film time of a word
export const END = 12.9;                // film length: the voice ends at 11.66, the end card holds for a little over a second
