// Il Dante Caffe, 760 Ocean Dr, Miami Beach (concept demo). Modelled in Blender from Google Maps
// photos and Street View (projects/il-dante), lighting baked: a sunny Miami morning.
//
// Coordinates: metres. Blender plan (x = east, y = north, z = up) shows up here as (x, z, -y).
// The building's corner (Ocean Dr / 8th St) is at the origin; the cafe door is near x = -11.3, z = 0.
// Eye height on the street is about 1.7; the cafe floor is at 0.
export default {
  name: 'Il Dante Caffe',
  mode: 'street-open',
  baked: true,
  model: 'assets/model.glb',
  modelMobile: 'assets/model_mobile.glb',
  skyImage: 'assets/sky.webp',
  skyImageMobile: 'assets/sky_mobile.webp',
  bakeInfo: 'assets/bake.json',
  sky: 'day',
  theme: { fogOutside: '#c9d6df', fogInside: '#efe9df', fogDensity: 0.0009 },
  exposure: 0.8,              // the HDRI sky's light, about what a camera would expose for
  insideBoost: 1.25,          // a touch brighter inside, as a camera adjusts walking in
  grade: { tint: [1.02, 1.0, 0.97], power: 1.04, sat: 1.05 },
  insideAt: [0.37, 0.44],
  outsideAt: [0.84, 0.9],

  doors: { Cafe_Door: { opensAt: [0.35, 0.41], angle: -1.6 } },

  stops: [
    { p: 0.0, pos: [79.2, 51.8, -36.6], look: [-9.1, 3.0, 6.1], chapter: 'Ocean Drive' },
    { p: 0.12, pos: [27.4, 13.7, -21.3], look: [-6.1, 3.7, 3.0] },
    { p: 0.24, pos: [2.44, 1.68, -9.14], look: [-11.3, 1.83, 0], chapter: '8th Street' },
    { p: 0.33, pos: [-11.28, 1.68, -2.74], look: [-11.28, 1.52, 6.1] },
    { p: 0.42, pos: [-11.43, 1.65, 0.76], look: [-10.06, 1.34, 9.14], chapter: 'Inside' },
    { p: 0.52, pos: [-10.97, 1.62, 3.66], look: [-8.84, 1.37, 6.71] },
    { p: 0.62, pos: [-10.06, 1.58, 5.49], look: [-12.5, 1.28, 8.23], chapter: 'The counter' },
    { p: 0.72, pos: [-10.97, 1.58, 6.71], look: [-12.8, 1.52, 12.19] },
    { p: 0.81, pos: [-10.36, 1.58, 7.32], look: [-11.58, 1.52, -3.05] },
    { p: 0.9, pos: [-8.53, 1.68, -3.2], look: [30.5, 2.44, -12.2], chapter: 'The beach' },
    { p: 1.0, pos: [12.2, 12.2, -9.14], look: [121.9, 0, 0] },
  ],
};
