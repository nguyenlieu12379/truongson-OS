// The second ending: after the voice, the last strip flips from I'LL SEND YOU THE SKILL to a second line.
// The strip has 23 flaps, so the line is at most 23 characters (a shorter one is centred). 'OR CHECK PINNED COMMENT' is 23 too.
import { make } from './board.js';
export const build = (K) => make(K, { id: 'boardp', pinned: 'SKILL IN PINNED COMMENT' });
