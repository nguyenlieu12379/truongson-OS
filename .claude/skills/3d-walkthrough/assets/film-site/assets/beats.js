// Film site config. Edit this per build.
// frames: how many WebP frames are in frames/d and frames/m (make_frames.sh prints it).
// Panels and their scroll ranges live in index.html (data-in / data-out, 0 to 1 of the film).
export default {
  frames: 520,
  pad: 3,                 // file names are zero-padded: 000.webp
  desktop: 'frames/d/',   // 1280 wide
  phone: 'frames/m/',     // 854 wide, used under 820 px or on slow connections
  scrollScreens: 9,       // page height in screens; more = slower playback per scroll
  background: '#16121b',  // fills around the film on tall screens; match the film's darkest tone
};
