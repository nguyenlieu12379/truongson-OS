// Per-room scroll moments for the baked cottage. The light is baked into the model, so these are
// small extras on top. build(ctx) runs once; it returns update(p, time, dt).
export default {
  build(ctx) {
    const { V, glow, smooth, reduceMotion } = ctx;
    // Lanterns on the lanai glow a little as you step outside (positions from design_pass.py).
    const F = 2.44, ft = 0.3048;
    const lanterns = [6, 13, 33, 44].map((x) => glow(0xffb070, 0.9, V(x * ft, F + 7.7 * ft, -47.5 * ft), 0));
    const porch = glow(0xffb070, 0.8, V(26 * ft, F + 6.5 * ft, -6.5 * ft), 0);
    return (p, time) => {
      const flicker = reduceMotion ? 1 : 0.92 + 0.08 * Math.sin(time * 7.3);
      const outside = smooth(0.86, 0.95, p);
      for (const g of lanterns) g.material.opacity = outside * 0.7 * flicker;
      porch.material.opacity = smooth(0.48, 0.55, p) * (1 - smooth(0.62, 0.66, p)) * 0.6 * flicker;
    };
  },
};
