// Per-room scroll animation for this site. The building, furniture and lights are already in
// model.glb (modelled in Blender), so this file only animates what is there.
// build(ctx) runs once after the model loads. Return update(p, time, dt), called every frame with
// scroll progress p (0..1). Optional style(ctx, name) runs on every style switch.
// ctx: THREE, scene, camera, model, get(name), spec, V, H, B, seg, smooth, easeOut, reduceMotion,
//      glow, light, material, TEX, style
//
// Find objects by their Blender name with ctx.get('Name'). Joined meshes are named
// '<Collection>_<material>' (see build_model.py export_web_glb); keep anything you animate separate
// in Blender (give it a role or a style extra) so it is exported on its own.
export default {
  build(ctx) {
    const { V, glow, seg, smooth, reduceMotion } = ctx;

    // Hero moment (example): the late sun on the lanai warms up as you step outside.
    const sunGlow = glow(0xffd9a0, 6, V(6.5, 6.5, -40), 0);

    return (p, time) => {
      const t = smooth(0.86, 1, p);
      sunGlow.material.opacity = t * (reduceMotion ? 0.6 : 0.55 + 0.05 * Math.sin(time * 0.8));
      sunGlow.scale.setScalar(6 + seg(p, 0.86, 1) * 4);
    };
  },
};
