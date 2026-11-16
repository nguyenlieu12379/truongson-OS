// Coastal cottage, baked live 3D. The model, its baked light and the sky come from
// projects/coastal-cottage/bake_web.py (golden-hour design). The route follows the film:
// the plan on the sand, the house rises, dollhouse orbit, roof lands, up the stairs, through
// the front door, dining, great room, out to the lanai and the sunset.
//
// Coordinates: metres. x = right, y = up, z = toward the street. Blender (x, y, z) = (x, z, -y).
// Ground is y = -0.91, the floor is y = 2.44, eye height inside is about 4.1.
export default {
  name: 'Coastal Cottage',
  mode: 'dollhouse-open',
  model: 'assets/model.glb',
  baked: true,
  skyImage: 'assets/sky.webp',
  bakeInfo: 'assets/bake.json',
  sky: 'golden',              // fog colours only; the sky itself is the baked panorama
  theme: { fogOutside: '#c9927a', fogInside: '#2a1a10', fogDensity: 0.0016 },
  exposure: 0.85,
  insideBoost: 0.82,          // and -0.9 EV inside
  grade: { tint: [1.08, 1.0, 0.86], power: 1.08, sat: 1.05 },   // white balance, then a light 'Punchy' look
  insideAt: [0.6, 0.66],
  ceilingY: 5.4,              // ceiling sits at 2.44 + 3.05 m: hide roof and ceilings above this

  // The house builds itself on scroll, like the film. how: grow (from the ground), drop, pop, show.
  build: [
    // Like the film: the platform rises, the floor is laid board by board (street to beach), walls
    // rise, then each piece of furniture pops up where it stands, front to back. Baked light is the
    // finished house, so everything shows flat light until the house is done (lightUp).
    { name: 'G_Structure', at: [0.01, 0.07], how: 'grow' },
    { name: 'G_Floors', at: [0.05, 0.13], how: 'reveal', map: 'assets/floor_order.png' },
    { name: 'G_Walls', at: [0.11, 0.19], how: 'grow' },
    { name: 'G_Glass', at: [0.16, 0.2], how: 'grow' },
    { name: 'Ext_Front_door2', at: [0.19, 0.2], how: 'show' },
    { name: 'Ext_Rear_slider2', at: [0.16, 0.2], how: 'grow' },
    { prefix: 'Furn_', at: [0.18, 0.27], how: 'pop', each: 0.2 },
    { name: 'G_Ceiling', at: [0.43, 0.44], how: 'show' },
    { name: 'G_Roof', at: [0.38, 0.44], how: 'drop' },
  ],
  lightUp: [0.25, 0.32],     // the house rises as a plain model; the golden-hour light comes on as it's finished
  planUntil: [0.34, 0.42],    // the floor plan painted on the sand fades as the roof lands

  doors: {
    Ext_Front_door2: { opensAt: [0.596, 0.64], angle: 1.75 },
    Ext_Rear_slider2: { opensAt: [0.8, 0.85], shrink: 0.06 },
  },

  // Camera route from the film's shot list (build_walkthrough.py), p = (frame - 120) / 920.
  stops: [
    // opening: about 45 degrees down onto the plan from the street side, slightly to the right,
    // so the build-up reads in depth (straight down, it looks flat)
    { p: 0.0, pos: [17.5, 26.5, 19.5], look: [7.62, 0.2, -7.28], chapter: 'The plan' },
    { p: 0.13, pos: [24.38, 21.34, 12.19], look: [7.62, 2.44, -8.23], chapter: 'The build' },
    { p: 0.23, pos: [29.87, 20.73, -13.72], look: [7.62, 2.44, -8.23] },
    { p: 0.3, pos: [13.72, 21.95, -32.0], look: [7.62, 2.44, -8.23], chapter: 'Every room' },
    { p: 0.38, pos: [-10.67, 20.12, -22.86], look: [7.62, 2.44, -8.23] },
    { p: 0.446, pos: [-13.72, 12.19, 6.1], look: [7.62, 4.27, -8.23] },
    { p: 0.511, pos: [7.77, 2.13, 14.63], look: [7.92, 3.35, -2.44], chapter: 'Arrive' },
    { p: 0.565, pos: [7.68, 0.91, 4.27], look: [7.92, 3.66, -2.44] },
    { p: 0.609, pos: [7.8, 4.11, 0.15], look: [7.92, 3.96, -3.05] },
    { p: 0.643, pos: [7.92, 4.11, -1.22], look: [7.92, 3.96, -4.27], chapter: 'Inside' },
    { p: 0.696, pos: [7.92, 4.11, -3.66], look: [10.06, 3.35, -4.57] },
    { p: 0.75, pos: [9.3, 4.11, -6.1], look: [8.53, 3.66, -10.97] },
    { p: 0.804, pos: [9.91, 4.11, -8.53], look: [6.71, 3.66, -12.19], chapter: 'Great room' },
    { p: 0.853, pos: [7.32, 4.11, -11.43], look: [6.4, 3.81, -14.02] },
    { p: 0.902, pos: [6.4, 4.11, -13.56], look: [7.32, 2.74, -33.53], chapter: 'Lanai' },
    { p: 0.951, pos: [5.94, 4.27, -12.5], look: [6.1, 1.83, -30.48] },
    { p: 1.0, pos: [5.79, 4.33, -12.07], look: [6.1, 1.83, -30.48] },
  ],
};
