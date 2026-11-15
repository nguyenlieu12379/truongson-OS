// Route, door timing and styles for this site. The building itself is model.glb, modelled in
// Blender with assets/blender/build_model.py (in the skill). Replace everything below per client.
// Example: an elevated coastal cottage (50' x 54'10", floor 8 ft up on pilings).
//
// Coordinates are the model's, in metres: x = right, y = up, z = toward the street (front of the
// building is the max z edge). Blender (x, y, z) shows up here as (x, z, -y).
// Floor of this house is at y = 2.44 (8 ft), so eye height inside is about 2.44 + 1.7 = 4.14.
export default {
  name: 'Coastal Cottage',
  mode: 'dollhouse-open',   // 'dollhouse-open' (overview of the whole home first) | 'street-open' (street, then the front door)
  model: 'assets/model.glb',
  sky: 'day',               // 'day' | 'golden' | 'dusk' | 'night'
  exposure: 1.0,
  lightScale: 3,            // multiplies the model's point lights (Blender watts come in dim)
  // Scroll progress range where the camera goes from outside to inside (fog and ambient shift)
  insideAt: [0.4, 0.48],

  // Doors and sliders: names of model objects with role 'door' (origin on the hinge).
  // angle: radians, + opens inward. slide: metres along x. opensAt: scroll range.
  doors: {
    Door_Front: { opensAt: [0.33, 0.4], angle: 1.7 },
    Door_Rear_Slider: { opensAt: [0.74, 0.82], slide: -2.5 },
  },

  // Real estate only: the style switch. Keys match materials named in Blender
  // (wall, floor, ceiling, fabric, wood, accent). Labels in index.html must match these keys.
  styles: {
    modern: { wall: '#eceae6', floor: '#9a7a5a', ceiling: '#f4f3f0', fabric: '#8c8c88', wood: '#3a3532', accent: '#2f3b40' },
    scandinavian: { wall: '#f3efe8', floor: '#d9c4a0', ceiling: '#fbfaf7', fabric: '#d8d2c6', wood: '#c9a77c', accent: '#7d9aa6' },
    'warm luxury': { wall: '#e6d6c0', floor: '#6b4a30', ceiling: '#efe4d4', fabric: '#b88a5a', wood: '#4a2e1c', accent: '#7a4a2a' },
  },

  // Camera stops from the walkthrough guide. p = scroll progress (0..1). pos/look = [x, y, z].
  // chapter = label for the nav (optional). Keep 0.08-0.15 of progress between stops.
  stops: [
    { p: 0.0, pos: [7.6, 26, 16], look: [7.6, 2.4, -8.4], chapter: 'Overview' },
    { p: 0.1, pos: [25, 17, 6], look: [7.6, 2.4, -8] },
    { p: 0.2, pos: [7.7, 1.4, 15], look: [7.9, 3.6, -2.4], chapter: 'Arrive' },
    { p: 0.3, pos: [7.7, 1.2, 4.4], look: [7.9, 4.3, -2.4] },
    { p: 0.38, pos: [7.85, 4.14, -0.2], look: [7.9, 4.0, -5] },
    { p: 0.47, pos: [7.92, 4.14, -3.6], look: [10.2, 3.4, -4.7], chapter: 'Inside' },
    { p: 0.57, pos: [9.0, 4.14, -6.1], look: [8.4, 3.6, -11] },
    { p: 0.68, pos: [9.9, 4.14, -8.5], look: [6.6, 3.6, -12.6], chapter: 'Great room' },
    { p: 0.8, pos: [7.0, 4.14, -11.3], look: [6.4, 3.8, -16] },
    { p: 0.9, pos: [5.7, 4.14, -13.7], look: [5.7, 3.2, -30], chapter: 'Lanai' },
    { p: 1.0, pos: [5.7, 4.4, -12.4], look: [5.7, 2.6, -30] },
  ],
};
