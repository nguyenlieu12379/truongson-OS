#!/usr/bin/env bash
# Turn a rendered film's PNG frames into the WebP sequences the film site plays.
# Usage: make_frames.sh <png_dir> <site_dir> [step=2]
#   <png_dir>  folder of PNG frames named 0001.png, 0002.png, ... (Blender's output)
#   <site_dir> the site folder; writes frames/d/000.webp (1280 wide) and frames/m/000.webp (854 wide)
#   step       keep every Nth frame (2 = 520 frames from a 1,040-frame film)
# Prints the frame count to put in assets/beats.js.
set -euo pipefail
SRC="$1"; DST="$2"; STEP="${3:-2}"
rm -rf "$DST/frames/d" "$DST/frames/m"; mkdir -p "$DST/frames/d" "$DST/frames/m"
FIRST=$(for f in "$SRC"/[0-9]*.png; do basename "$f" .png; break; done)
SEL="select=not(mod(n\,$STEP))"
ffmpeg -v error -y -start_number "$((10#$FIRST))" -i "$SRC/%04d.png" -vf "$SEL,scale=1280:-2" -fps_mode vfr -c:v libwebp -quality 72 -start_number 0 "$DST/frames/d/%03d.webp"
ffmpeg -v error -y -start_number "$((10#$FIRST))" -i "$SRC/%04d.png" -vf "$SEL,scale=854:-2" -fps_mode vfr -c:v libwebp -quality 70 -start_number 0 "$DST/frames/m/%03d.webp"
D=$(ls "$DST/frames/d" | wc -l); M=$(ls "$DST/frames/m" | wc -l)
[ "$D" = "$M" ] || { echo "frame sets differ: $D vs $M" >&2; exit 1; }
echo "frames: $D  desktop $(du -sh "$DST/frames/d" | cut -f1)  phone $(du -sh "$DST/frames/m" | cut -f1)"
