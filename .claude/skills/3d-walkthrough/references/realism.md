# Realism: why a scene looks plastic, and the free fix

From Blender Guru's "Photorealism Explained" and archviz guides (BlenderNation, CGarchitect, Renderahouse),
applied and tested on Il Dante Caffe (`projects/il-dante/`). Plastic = flat colours, one roughness value,
perfectly sharp edges, a computed sky and no texture detail. Fix it in this order, biggest win first:

1. **Photo-scanned textures (free, CC0).** Poly Haven or ambientCG: colour + roughness + normal map for
   every big surface (floor, walls, worktops, tile, asphalt, pavers, grass, sand, bark). Box-project them
   in object space at real size and tint them to the colour in the reference photos (`pbr()` in
   `projects/il-dante/build_scene.py`). The normal map's bumps bake into the lightmap, so the site keeps
   them. `fetch_assets.py` downloads them; they are large, so keep them out of git.
2. **A real sky (HDRI).** A photographed sky lights the scene and is the panorama: soft sky light, a
   real sun, real clouds. Turn it so its sun comes from where you want (the builder finds the sun in the
   HDR and rotates the lookup). No extra sun lamp: it would double the sun.
3. **Bevel every box.** A 6 to 30 mm bevel (`Piece.build(bevel)`) gives edges a highlight line, which is
   what real objects have. Sharp CG edges read as fake from across a room.
4. **Glass that looks like glass from outside**: sky-coloured at the top of each pane, darker below,
   soft unevenness (`pane()`). Blotchy patterns read as fake.
5. **Whites are not grey.** Measure against the photos: white walls and ceilings need tinting up after the
   texture (plaster textures are often beige or dirty).
6. **Imperfections** come with the textures (roughness variation, small dents, grime). Add streaks or dirt
   only where the photos show them.
7. **On the site: a photo finish.** A whisper of film grain (`.grain` in the site's style.css) and the
   vignette. Keep the camera at eye height (about 1.6 to 1.7 m) and the lens moderate.

Check with `projects/il-dante/render_check.py` (Cycles stills from fixed cameras) next to the reference
photos before every full bake.
