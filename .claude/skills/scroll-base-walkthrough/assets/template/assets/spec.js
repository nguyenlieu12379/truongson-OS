// Floor plan + walkthrough for this site. The engine builds walls, rooms and the camera path from it.
// Example: a small corner cafe. Replace everything below with the client's building.
// Units are metres. x = right, z = toward the street (front of the building is the max z edge), y = up.
export default {
  name: 'Little Hour Coffee',
  wallHeight: 3.2,
  exterior: {
    kind: 'street',          // 'street' (city frontage) or 'garden' (house, bnb)
    sky: 'dusk',             // 'dusk' | 'night' | 'day' | 'golden'
    facade: 'brick:#7a4a36', // band above the shopfront
    doorX: 0,
    sign: { text: 'Little Hour', sub: 'C O F F E E   ·   B A K E R Y', style: 'neon', color: '#ffe2b0', glowColor: '#ff9a4a', width: 5, y: 4.1 },
  },
  // Scroll progress range where the camera goes from outside to inside (fog and ambient shift)
  insideAt: [0.28, 0.4],

  // Rooms: floor/ceiling rectangles [x0, z0, x1, z1] and their lighting
  rooms: [
    { id: 'cafe', name: 'Cafe', rect: [-6, -6, 6, 0], floor: 'wood:#7a5232', ceiling: '#221a15', light: '#ffd2a0', lightIntensity: 12 },
    { id: 'bar', name: 'Espresso bar', rect: [-6, -11, 1.5, -6], floor: 'darktile', ceiling: '#1d1a17', light: '#fff0dc', lightIntensity: 14 },
    { id: 'nook', name: 'Reading nook', rect: [1.5, -11, 6, -6], floor: 'wood:#5a3c26', ceiling: '#221a15', light: '#ffc890', lightIntensity: 8 },
  ],

  // Walls as segments. Trace OUTER walls counter-clockwise seen from above with the street at the bottom:
  // front left->right, right side front->back, back right->left, left side back->front. Then `outside` faces out.
  // Openings: `at` = distance in metres from `from` to the opening's centre.
  // type: 'door' (hinged leaf, optional glass), 'window' (sill + glass), 'pass' (open gap, no leaf)
  walls: [
    { from: [-6, 0], to: [6, 0], inside: 'plaster:#e8dcc8', outside: '#1f2a24', openings: [
      { type: 'window', at: 2.5, width: 3.4, sill: 0.8, height: 2.6 },
      { type: 'door', at: 6, width: 1.3, height: 2.5, glass: true, material: '#1f2a24', opensAt: [0.22, 0.31] },
      { type: 'window', at: 9.5, width: 3.4, sill: 0.8, height: 2.6 },
    ] },
    { from: [6, 0], to: [6, -11], inside: 'brick:#8a5238', outside: 'brick:#6a3a28' },
    { from: [6, -11], to: [-6, -11], inside: 'tile:#efece6', outside: '#3a3430' },
    { from: [-6, -11], to: [-6, 0], inside: 'brick:#8a5238', outside: 'brick:#6a3a28' },
    // interior walls
    { from: [-6, -6], to: [6, -6], material: 'plaster:#e3d6c0', openings: [
      { type: 'pass', at: 4, width: 3.2, height: 2.5 },
      { type: 'pass', at: 9.75, width: 1.4, height: 2.3 },
    ] },
    { from: [1.5, -6], to: [1.5, -11], material: 'tile:#efece6' },
  ],

  // Camera stops. p = scroll progress (0..1). pos/look = [x, y, z]. Eye height ~1.6-1.8 m when walking.
  // chapter = label for the nav (optional). Keep 0.08-0.15 of progress between stops.
  stops: [
    { p: 0.0, pos: [0, 2.4, 26], look: [0, 2.8, 0], chapter: 'Street' },
    { p: 0.12, pos: [-3.5, 2.0, 17], look: [0, 2.4, 0] },
    { p: 0.22, pos: [0, 1.75, 6.5], look: [0, 1.7, 0] },
    { p: 0.32, pos: [0, 1.65, 1.4], look: [0, 1.5, -4] },
    { p: 0.44, pos: [0.4, 1.7, -1.2], look: [-2.5, 1.2, -4.5], chapter: 'Cafe' },
    { p: 0.56, pos: [3.6, 1.75, -3.2], look: [-1.5, 1.1, -5.5] },
    { p: 0.68, pos: [-1.5, 1.75, -4.6], look: [-2, 1.1, -9], chapter: 'Espresso bar' },
    { p: 0.84, pos: [-2.2, 1.6, -7.6], look: [-3.0, 1.0, -10.2] },
    { p: 1.0, pos: [-2.85, 1.3, -9.2], look: [-3.15, 1.05, -10.45], chapter: 'The pour' },
  ],
};
