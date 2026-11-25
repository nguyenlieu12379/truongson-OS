// debug view: one cell of the first row close up (the R of BLENDER while it is still flipping), no lens blur
import { make } from './board.js';
export const build = (K) => make(K, { id: 'boardc', lens: 0, poses: [[-1, 0, [-1.80, 1.02, 0], -18, 6, 0.55, 0, 'snap', 0]] });
