#!/usr/bin/env bash
# Scrubbed hero moment: cut a few seconds from a clip, add in-between frames with RIFE, and save a
# WebP frame sequence (desktop + phone) for assets/scrub/scrub.js to draw on a canvas as you scroll.
#
# usage: hero_frames.sh <clip.mp4> <out_dir> [--start S] [--dur S] [--fps 60] [--quality 80]
#   --start   where the moment starts in the clip, seconds (default 0)
#   --dur     how long, seconds (default: to the end). Keep it 1 to 3 s: 60 fps x 3 s = 180 frames.
#   --fps     target frame rate (default 60). RIFE fills the gaps between the clip's own frames.
#   --quality WebP quality 0-100 (default 80)
# writes <out_dir>/desktop/f_0001.webp ... (1280 wide), <out_dir>/phone/f_0001.webp ... (854 wide),
# and <out_dir>/frames.json.
#
# Free, CPU only: rife-ncnn-vulkan (MIT, model rife-v4.6) on Mesa's software Vulkan (lavapipe).
# About 1.6 s per output frame at 960x540 on a cloud CPU: a 2 s moment at 60 fps is about 3 min.
# First run downloads RIFE (430 MB zip) to $RIFE_DIR (default ~/.cache/rife-ncnn-vulkan) and
# installs the Vulkan driver with apt if none is present.
set -euo pipefail
CLIP="${1:?usage: hero_frames.sh <clip.mp4> <out_dir> [--start S] [--dur S] [--fps 60] [--quality 80]}"
OUT="${2:?out_dir missing}"; shift 2
START=0; DUR=""; FPS=60; Q=80
while [ $# -gt 0 ]; do case "$1" in
  --start) START="$2"; shift 2 ;; --dur) DUR="$2"; shift 2 ;;
  --fps) FPS="$2"; shift 2 ;; --quality) Q="$2"; shift 2 ;;
  *) echo "unknown option $1" >&2; exit 1 ;; esac; done

# 1. RIFE + a Vulkan driver (software one is fine)
RIFE_DIR="${RIFE_DIR:-$HOME/.cache/rife-ncnn-vulkan}"
BIN="$RIFE_DIR/rife-ncnn-vulkan-20221029-ubuntu/rife-ncnn-vulkan"
if [ ! -x "$BIN" ]; then
  mkdir -p "$RIFE_DIR"; echo "downloading RIFE (430 MB, once)"
  curl -fsSL -o "$RIFE_DIR/rife.zip" https://github.com/nihui/rife-ncnn-vulkan/releases/download/20221029/rife-ncnn-vulkan-20221029-ubuntu.zip
  (cd "$RIFE_DIR" && unzip -q -o rife.zip && rm rife.zip)
fi
if ! ls /usr/share/vulkan/icd.d/*.json >/dev/null 2>&1; then
  echo "installing Mesa Vulkan driver"
  (apt-get install -y -q mesa-vulkan-drivers libvulkan1 || (apt-get update -q && apt-get install -y -q mesa-vulkan-drivers libvulkan1)) >/dev/null
fi

# 2. cut the moment into PNG frames
TMP=$(mktemp -d); trap 'rm -rf "$TMP"' EXIT; mkdir -p "$TMP/in" "$TMP/mid"
SRC_FPS=$(ffprobe -v error -select_streams v:0 -show_entries stream=r_frame_rate -of csv=p=0 "$CLIP")
SRC_FPS=$(python3 -c "n,d='$SRC_FPS'.split('/'); print(float(n)/float(d))")
ffmpeg -v error -ss "$START" ${DUR:+-t "$DUR"} -i "$CLIP" -fps_mode passthrough "$TMP/in/%08d.png"
N=$(ls "$TMP/in" | wc -l); [ "$N" -ge 2 ] || { echo "need at least 2 frames, got $N" >&2; exit 1; }
M=$(python3 -c "print(max($N, round($N * $FPS / $SRC_FPS)))")
echo "$N frames at ${SRC_FPS} fps -> $M frames at $FPS fps (RIFE on CPU, about 1.6 s a frame)"

# 3. in-between frames
"$BIN" -i "$TMP/in" -o "$TMP/mid" -m "$(dirname "$BIN")/rife-v4.6" -n "$M" -g 0 >/dev/null 2>&1 || \
  "$BIN" -i "$TMP/in" -o "$TMP/mid" -m "$(dirname "$BIN")/rife-v4.6" -n "$M" -g -1
COUNT=$(ls "$TMP/mid" | wc -l)

# 4. WebP sets: desktop 1280 wide, phone 854 wide (even heights)
rm -rf "$OUT/desktop" "$OUT/phone"; mkdir -p "$OUT/desktop" "$OUT/phone"
for set in desktop:1280 phone:854; do
  name=${set%%:*}; w=${set##*:}
  ffmpeg -v error -framerate "$FPS" -pattern_type glob -i "$TMP/mid/*.png" \
    -vf "scale=$w:-2:flags=lanczos" -c:v libwebp -quality "$Q" -compression_level 6 -start_number 1 "$OUT/$name/f_%04d.webp"
done
DW=1280; DH=$(ffprobe -v error -show_entries stream=height -of csv=p=0 "$OUT/desktop/f_0001.webp")
PW=854;  PH=$(ffprobe -v error -show_entries stream=height -of csv=p=0 "$OUT/phone/f_0001.webp")
cat > "$OUT/frames.json" <<EOF
{ "fps": $FPS, "count": $COUNT, "pattern": "f_%04d.webp",
  "desktop": { "dir": "desktop", "width": $DW, "height": $DH },
  "phone": { "dir": "phone", "width": $PW, "height": $PH } }
EOF
echo "wrote $COUNT frames: $(du -sh "$OUT/desktop" | cut -f1) desktop, $(du -sh "$OUT/phone" | cut -f1) phone -> $OUT"
