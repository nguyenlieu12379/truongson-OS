# Il Dante Caffe (concept demo)

A 3D walkthrough website for **Il Dante Caffe, 760 Ocean Dr, Miami Beach** (8th St side of the
corner building), picked 2026-11-17 because Google Maps lists no website and no phone for it.

- Site: `websites/TruongSon-demos/il-dante-caffe/` (concept demo note, noindex, unconfirmed facts TODO).
- Scene: `build_scene.py` (Blender, from photos), `bake_scene.py` (bake + export), `render_check.py`
  (Cycles stills to compare with the photos).

## References used (not stored in the repo: the photos belong to their authors)
- Google Maps place page: 12 visitor photos of the interior and drinks (Nov 2025).
- Google Street View, Aug 2026: Ocean Dr and 8th St around the building, the Starlite Hotel, Lummus Park.
- Google Maps satellite view: the block layout (building, 8th St, Ocean Ct, News Cafe across 8th).

What the model matches: the room (white walls, oak bar under a rounded mirror, stools, curved white
subway-tile counter with a pastry case, dark green tile wall behind the espresso bar, letter-board
menu, bell pendants, wood-look floor, drinks fridge, fig tree), the white Streamline corner building
(rounded corner, pipe-rail balcony, blue awning, rooftop terrace with umbrellas and metal sculptures),
the street furniture and Lummus Park. It is a hand-built model, not a scan: no Google 3D Tiles key.
The cafe's logo is not used on the site.

## Rebuild
```
python build_scene.py --out work/il_dante.blend
python bake_scene.py --blend work/il_dante.blend --site ../../websites/TruongSon-demos/il-dante-caffe
```
(`python` = Blender's bpy module, e.g. /tmp/claude-0/venv/bl/bin/python here.) Full bake about 35 min.
