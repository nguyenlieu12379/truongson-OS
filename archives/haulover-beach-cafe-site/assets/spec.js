// Haulover Beach Cafe (concept demo). The place is Google Photorealistic 3D Tiles around the cafe,
// moved into local metres by projects/haulover-cafe/tiles_to_blend.py: the cafe is at the origin.
// Blender (x = east, y = north, z = up) shows up here as (x, z, -y): east = +x, north = -z, up = +y.
// The ocean is to the east (+x). Ground at the cafe is y = 0.
//
// FIRST PASS: these stops are a placeholder route (aerial from the land side, down to the lot,
// walk to the cafe, turn to the ocean). Re-set them against the real tiles once they're downloaded
// (projects/haulover-cafe/RESUME.md).
export default {
  name: 'Haulover Beach Cafe',
  mode: 'street-open',
  model: 'assets/model.glb',
  modelMobile: 'assets/model_mobile.glb',
  sky: 'day',                 // photo tiles carry their own light; this only sets sky and fog
  theme: { fogDensity: 0.0018 },
  exposure: 1.0,
  insideAt: [2, 2],           // never 'inside': it's an outdoor walk

  stops: [
    { p: 0.0, pos: [-160, 120, 60], look: [0, 0, 0], chapter: 'Overview' },
    { p: 0.12, pos: [-110, 60, 20], look: [0, 2, 0] },
    { p: 0.24, pos: [-60, 6, 8], look: [0, 2, 0], chapter: 'Arrive' },
    { p: 0.36, pos: [-25, 1.7, 4], look: [0, 2, 0] },
    { p: 0.48, pos: [-8, 1.7, 2], look: [0, 1.8, 0], chapter: 'The counter' },
    { p: 0.6, pos: [8, 1.7, 2], look: [60, 1.2, 0] },
    { p: 0.72, pos: [40, 1.7, 0], look: [120, 0.8, 0], chapter: 'The beach' },
    { p: 0.86, pos: [70, 12, 30], look: [0, 0, 0] },
    { p: 1.0, pos: [110, 60, 60], look: [0, 0, 0], chapter: 'Find us' },
  ],
};
