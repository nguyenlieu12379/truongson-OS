#!/usr/bin/env bash
# Google 3D Tiles of Haulover Park -> Blender -> the walkthrough site. Needs the Map Tiles API key
# (network secret on tile.googleapis.com, header X-Goog-Api-Key, or GOOGLE_MAPS_API_KEY).
# Step 1 (coarse, to find the cafe):  ./run.sh survey
# Step 2 (sharp, around the cafe):    LAT=.. LON=.. ./run.sh build
set -euo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"
PY=${BLENDER_PY:-/tmp/claude-0/venv/bl/bin/python}
WORK=${WORK:-$HERE/work}
SITE="$HERE/../../websites/TruongSon-demos/haulover-beach-cafe/assets"
LAT=${LAT:-25.9045}
LON=${LON:--80.1203}
mkdir -p "$WORK"
case "${1:-}" in
  survey)
    python3 "$HERE/fetch_tiles.py" --lat "$LAT" --lon "$LON" --height -25 --radius 450 --sharp-radius 0 \
      --near-error 8 --falloff 0.02 --out "$WORK/survey"
    "$PY" "$HERE/tiles_to_blend.py" --tiles "$WORK/survey" --blend "$WORK/survey.blend" --keep 450 \
      --preview "$WORK/survey_top.png" ;;
  build)
    python3 "$HERE/fetch_tiles.py" --lat "$LAT" --lon "$LON" --height -25 --radius 260 --sharp-radius 70 \
      --near-error 1.0 --falloff 0.05 --out "$WORK/tiles"
    "$PY" "$HERE/tiles_to_blend.py" --tiles "$WORK/tiles" --blend "$WORK/haulover.blend" --keep 260 \
      --tex 1024 --preview "$WORK/build_top.png" --site "$SITE" ;;
  *) echo "usage: $0 survey|build"; exit 2 ;;
esac
