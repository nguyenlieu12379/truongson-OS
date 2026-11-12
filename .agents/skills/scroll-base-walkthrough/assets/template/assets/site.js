// Site-specific furniture, props and scroll animations. Everything the floor plan does not cover.
// build(ctx) runs once. Return update(p, time, dt), called every frame with scroll progress p (0..1).
// ctx: THREE, scene, box, glow, light, plane, material, TEX, V, H, B, seg, smooth, easeOut, reduceMotion, props
export default {
  build(ctx) {
    const { THREE, scene, props: P, V, box, glow, light, TEX, seg, smooth, easeOut, reduceMotion } = ctx;

    // ---- Cafe: tables, plants, pendants, menu board
    for (const [x, z] of [[-4.2, -1.8], [-4.2, -4.2], [3.4, -1.6]]) {
      P.tableSet(x, z, { r: 0.45, top: 'marble', candle: false, chair: '#4a3020' });
      P.pendant(x, z, { y: 2.3 });
    }
    P.sofa(4.6, -4.6, { w: 2.2, mat: '#5e6b5a', rot: -Math.PI / 2 });
    P.rectTable(3.5, -4.6, { w: 0.9, d: 0.6, h: 0.45, top: 'wood:#6a4528' });
    P.plant(-5.4, -0.6, { size: 1.1 });
    P.plant(5.4, -0.6, { size: 0.9 });
    P.wallBoard(-5.88, 1.9, -3, { normal: 'e', w: 1.3, h: 1.6, tex: TEX.board('Coffee', [['Espresso', 3], ['Cortado', 4.5], ['Flat white', 5], ['Pour over', 6], ['Croissant', 4]]) });

    // ---- Bar: front counter in the pass, back counter, shelves
    P.counter(-2, -5.4, { w: 3.4, d: 0.6, h: 1.0, body: '#2a221c', top: 'marble' });
    for (const x of [-3.2, -2, -0.8]) P.stool(x, -4.7, { h: 0.72 });
    P.counter(-2.6, -10.55, { w: 6.4, d: 0.7, h: 0.92, body: 'steel', top: 'marble' });
    P.espressoMachine(-3.1, -10.6, { y: 0.92 });
    P.shelf(-2.6, -10.8, { w: 5, levels: [1.75, 2.25], items: 'jars' });
    P.pendant(-2, -8.6, { y: 2.4, lightOn: true });
    P.pendant(-4, -8.6, { y: 2.4 });

    // ---- Nook: books and a rug
    P.shelf(3.75, -10.8, { w: 3.6, levels: [0.6, 1.1, 1.6, 2.1], items: 'books' });
    P.rug(3.75, -8.5, { w: 3, d: 2, color: '#8a5a3a' });
    P.sofa(3.75, -7.0, { w: 2, mat: '#7a4a32', rot: Math.PI });

    // ---- Hero moment: a cup fills under the group head as you reach the end
    const cupY = 0.92;
    const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.04, 0.08, 20, 1, true), new THREE.MeshStandardMaterial({ color: 0xf4f1ea, roughness: 0.3, side: THREE.DoubleSide }));
    cup.position.set(-3.26, cupY + 0.07, -10.32); scene.add(cup);
    const coffee = new THREE.Mesh(new THREE.CircleGeometry(0.046, 20), new THREE.MeshStandardMaterial({ color: 0x5a3216, roughness: 0.3 }));
    coffee.rotation.x = -Math.PI / 2; scene.add(coffee);
    const stream = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.1, 6), new THREE.MeshStandardMaterial({ color: 0x3a1e0c }));
    stream.position.set(-3.26, cupY + 0.17, -10.32); scene.add(stream);
    const steam = [0, 1, 2].map((i) => glow(0xffffff, 0.12, V(-3.25, cupY + 0.12, -10.35), 0));

    return (p, time) => {
      const fill = seg(p, 0.86, 0.97);
      stream.visible = fill > 0 && fill < 1;
      coffee.position.set(-3.26, cupY + 0.035 + fill * 0.065, -10.32);
      coffee.scale.setScalar(0.85 + fill * 0.15);
      coffee.visible = fill > 0;
      steam.forEach((s, i) => {
        const t = reduceMotion ? 0.5 : (time * 0.4 + i / 3) % 1;
        s.position.set(-3.25 + Math.sin(time + i) * 0.02, cupY + 0.12 + t * 0.35, -10.35);
        s.material.opacity = smooth(0.95, 1, p) * Math.sin(t * Math.PI) * 0.25;
        s.scale.setScalar(0.1 + t * 0.2);
      });
      P.candles.forEach((c, i) => { c.material.opacity = 0.8 + (reduceMotion ? 0 : 0.15 * Math.sin(time * 9 + i * 2)); });
    };
  },
};
