// debug view of the FLIGHT DECK film's panel: the whole panel from the front, every lamp on, no lens blur
import { make } from './flight.js';
export const build = (K) => make(K, { id: 'flightd', allOn: 1, lens: 0, poses: [[-1, 0, [0.15, -0.42, 0], 0, 0, 7.6, 0, 'snap', 0]] });
