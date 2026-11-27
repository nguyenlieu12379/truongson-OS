// debug view: both banks from the front, every word landed, no lens blur
import { make } from './board.js';
export const build = (K) => make(K, { id: 'boardd', allOn: 1, lens: 0, poses: [[-1, 0, [0.9, 0.72, 0], 0, 0, 6.6, 0, 'snap', 0]] });
