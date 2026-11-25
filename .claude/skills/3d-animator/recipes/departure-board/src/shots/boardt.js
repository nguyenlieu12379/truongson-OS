// debug view: the ticket machine from the front, everything landed, no lens blur
import { make } from './board.js';
export const build = (K) => make(K, { id: 'boardt', allOn: 1, lens: 0, open: 0, poses: [[-1, 0, [1.22, 0.70, -2.36], 0, 0, 2.2, 0, 'snap', 0]] });
