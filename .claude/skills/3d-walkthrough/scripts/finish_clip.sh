#!/usr/bin/env bash
# Finish an AI clip for the site: 16 fps -> 24 fps (RIFE) and 832x480 -> 1280x720, then encode the
# desktop and phone files the step 7 player expects (every frame a keyframe, no audio).
#
# usage: finish_clip.sh <in.mp4> <out_dir> [--name NAME] [--mode sharp|blend|ai] [--fps 24]
#   --name  output base name (default: the input file name)
#   --mode  sharp (default): Lanczos resize + light sharpen. Fast, ffmpeg only, closest to the source.
#           blend: half Real-ESRGAN, half Lanczos. Crisper edges, a little waxy. Needs torch.
#           ai:    Real-ESRGAN only. Crispest, smooths fine texture (foam, wood grain). Needs torch.
#   --fps   target frame rate (default 24). Skips RIFE if the clip is already at it.
# writes <out_dir>/<name>.mp4 (1280x720) and <out_dir>/<name>-phone.mp4 (854x480)
#
# Tested 2026-11-20 on a real photo scaled 832x480 -> 1280x720 (PSNR vs the original):
# sharp 40.8, blend 38.5, ai 33.4. Pick blend or ai only if a real VACE clip looks too soft.
# Speed on a 4-core cloud CPU, for a 5 s clip (81 -> 121 frames): RIFE about 2 min; sharp seconds;
# blend/ai about 10 min (Real-ESRGAN about 5 s a frame). On Kaggle's GPU it is seconds.
# First run downloads RIFE (430 MB) and, for blend/ai, CPU torch into $UPSCALE_VENV.
set -euo pipefail
IN="${1:?usage: finish_clip.sh <in.mp4> <out_dir> [--name NAME] [--mode sharp|blend|ai] [--fps 24]}"
OUT="${2:?out_dir missing}"; shift 2
NAME=$(basename "${IN%.*}"); MODE=sharp; FPS=24
while [ $# -gt 0 ]; do case "$1" in
  --name) NAME="$2"; shift 2 ;; --mode) MODE="$2"; shift 2 ;; --fps) FPS="$2"; shift 2 ;;
  *) echo "unknown option $1" >&2; exit 1 ;; esac; done
case "$MODE" in sharp|blend|ai) ;; *) echo "--mode must be sharp, blend or ai" >&2; exit 1 ;; esac
HERE=$(cd "$(dirname "$0")" && pwd)
TMP=$(mktemp -d); trap 'rm -rf "$TMP"' EXIT; mkdir -p "$TMP/in" "$TMP/mid" "$TMP/up" "$OUT"

# 1. frames
SRC_FPS=$(ffprobe -v error -select_streams v:0 -show_entries stream=r_frame_rate -of csv=p=0 "$IN")
SRC_FPS=$(python3 -c "n,d='$SRC_FPS'.split('/'); print(float(n)/float(d))")
ffmpeg -v error -i "$IN" -fps_mode passthrough "$TMP/in/%08d.png"
N=$(ls "$TMP/in" | wc -l)

# 2. frame rate (RIFE), same tool and setup as hero_frames.sh
M=$(python3 -c "print(round($N * $FPS / $SRC_FPS))")
if [ "$M" -gt "$N" ]; then
  RIFE_DIR="${RIFE_DIR:-$HOME/.cache/rife-ncnn-vulkan}"
  BIN="$RIFE_DIR/rife-ncnn-vulkan-20221029-ubuntu/rife-ncnn-vulkan"
  if [ ! -x "$BIN" ]; then
    mkdir -p "$RIFE_DIR"; echo "downloading RIFE (430 MB, once)"
    curl -fsSL -o "$RIFE_DIR/rife.zip" https://github.com/nihui/rife-ncnn-vulkan/releases/download/20221029/rife-ncnn-vulkan-20221029-ubuntu.zip
    (cd "$RIFE_DIR" && unzip -q -o rife.zip && rm rife.zip)
  fi
  if ! ls /usr/share/vulkan/icd.d/*.json >/dev/null 2>&1; then
    (apt-get install -y -q mesa-vulkan-drivers libvulkan1 || (apt-get update -q && apt-get install -y -q mesa-vulkan-drivers libvulkan1)) >/dev/null
  fi
  echo "$N frames at $SRC_FPS fps -> $M frames at $FPS fps (RIFE)"
  "$BIN" -i "$TMP/in" -o "$TMP/mid" -m "$(dirname "$BIN")/rife-v4.6" -n "$M" -g 0 >/dev/null 2>&1 || \
    "$BIN" -i "$TMP/in" -o "$TMP/mid" -m "$(dirname "$BIN")/rife-v4.6" -n "$M" -g -1
else
  echo "already at $SRC_FPS fps, no RIFE"; mv "$TMP/in"/* "$TMP/mid/"; FPS=$SRC_FPS
fi

# 3. size
if [ "$MODE" = sharp ]; then
  SRC="$TMP/mid"; VF="scale=1280:720:flags=lanczos,unsharp=5:5:0.6:5:5:0"
else
  VENV="${UPSCALE_VENV:-$HOME/.cache/upscale-venv}"
  if [ ! -x "$VENV/bin/python" ] || ! "$VENV/bin/python" -c "import torch, PIL, numpy" 2>/dev/null; then
    echo "installing CPU torch for Real-ESRGAN (once)"
    python3 -m venv "$VENV"
    "$VENV/bin/pip" install -q torch --index-url https://download.pytorch.org/whl/cpu
    "$VENV/bin/pip" install -q numpy pillow
  fi
  B=0.5; [ "$MODE" = ai ] && B=1
  "$VENV/bin/python" "$HERE/upscale_frames.py" "$TMP/mid" "$TMP/up" --size 1280x720 --blend "$B"
  SRC="$TMP/up"; VF="scale=1280:720"
fi

# 4. encode: every frame a keyframe so the player can reverse and jump instantly
enc() { ffmpeg -v error -y -framerate "$FPS" -pattern_type glob -i "$SRC/*.png" -vf "$1,format=yuv420p" \
  -c:v libx264 -preset slow -crf "$2" -g 1 -an -movflags +faststart "$3"; }
enc "$VF" 20 "$OUT/$NAME.mp4"
enc "$VF,scale=854:480:flags=lanczos" 22 "$OUT/$NAME-phone.mp4"
COUNT=$(ls "$SRC" | wc -l)
echo "wrote $OUT/$NAME.mp4 ($(du -h "$OUT/$NAME.mp4" | cut -f1)) and $NAME-phone.mp4 ($(du -h "$OUT/$NAME-phone.mp4" | cut -f1)): $COUNT frames at $FPS fps, mode $MODE"
