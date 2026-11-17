// Haulover Beach Cafe (concept). The place is Google Photorealistic 3D Tiles, cleaned up in Blender
// (projects/haulover-cafe). This file only fills in the data credits Google requires.
export default {
  build() {
    fetch('assets/tiles_credit.json').then((r) => r.json()).then((c) => {
      const extra = (c.copyright || []).filter((s) => !/^google$/i.test(s));
      const el = document.querySelector('[data-credit]');
      if (el && extra.length) el.textContent = ', ' + extra.join(', ');
    }).catch(() => {});
    return () => {};
  },
};
