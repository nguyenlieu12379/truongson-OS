#!/usr/bin/env bash
# Run one shot through Wan2.1 VACE on Kaggle's free GPU and download the result.
# Usage: push_and_fetch.sh <job_dir> <out_dir> [kaggle_username]
#   <job_dir>  clay.mp4, refs/*.jpg (1-3), optional first.png and prompt.txt (see run_vace.py)
#   <out_dir>  where out.mp4 (the real-looking clip) and depth.mp4 land
# Needs: pip install kaggle, and a Kaggle API token (free account, phone verified for GPU and
# internet). In cloud sessions the token is a network secret for www.kaggle.com; locally it is
# ~/.kaggle/kaggle.json or KAGGLE_USERNAME/KAGGLE_KEY.
set -euo pipefail
JOB=$(cd "$1" && pwd); OUT="$2"; USER_NAME="${3:-${KAGGLE_USERNAME:-}}"
[ -n "$USER_NAME" ] || { echo "kaggle username: pass it as the 3rd argument or set KAGGLE_USERNAME" >&2; exit 1; }
HERE=$(cd "$(dirname "$0")" && pwd)
SLUG="walkthrough-$(basename "$JOB" | tr -c 'a-z0-9\n' '-' | cut -c1-40)"
DS="$USER_NAME/$SLUG-in"; KN="$USER_NAME/$SLUG-vace"
WORK=$(mktemp -d); mkdir -p "$WORK/ds" "$WORK/kernel" "$OUT"

# 1. inputs as a private dataset (new, or a new version if it exists)
# flat files only (Kaggle zips sub-folders): refs/x.jpg -> ref_1.jpg ...
for f in clay.mp4 first.png prompt.txt; do if [ -f "$JOB/$f" ]; then cp "$JOB/$f" "$WORK/ds/"; fi; done
k=0; for f in "$JOB"/refs/*; do [ -f "$f" ] || continue; k=$((k+1)); cp "$f" "$WORK/ds/ref_$k.${f##*.}"; done
[ -f "$WORK/ds/clay.mp4" ] && [ "$k" -ge 1 ] || { echo "job needs clay.mp4 and at least one photo in refs/" >&2; exit 1; }
printf '{"title":"%s","id":"%s","licenses":[{"name":"other"}]}\n' "$SLUG-in" "$DS" > "$WORK/ds/dataset-metadata.json"
if kaggle datasets status "$DS" >/dev/null 2>&1; then
  kaggle datasets version -p "$WORK/ds" -m "new inputs" -q
else
  kaggle datasets create -p "$WORK/ds" -q
fi
echo "dataset $DS uploaded; waiting for it to be ready"
for i in $(seq 1 60); do kaggle datasets status "$DS" 2>/dev/null | grep -qi ready && break; sleep 10; done

# 2. the kernel: run_vace.py on a GPU with internet (model download)
cp "$HERE/run_vace.py" "$WORK/kernel/"
cat > "$WORK/kernel/kernel-metadata.json" <<EOF
{
  "id": "$KN",
  "title": "$SLUG-vace",
  "code_file": "run_vace.py",
  "language": "python",
  "kernel_type": "script",
  "is_private": true,
  "enable_gpu": true,
  "enable_internet": true,
  "dataset_sources": ["$DS"],
  "competition_sources": [],
  "kernel_sources": []
}
EOF
kaggle kernels push -p "$WORK/kernel"
echo "kernel $KN pushed; polling (a 5 s clip takes roughly 10 to 30 min incl. model download)"

# 3. wait, then download
while true; do
  S=$(kaggle kernels status "$KN" 2>&1 || true); echo "$(date +%H:%M:%S) $S"
  case "$S" in *complete*|*COMPLETE*) break ;; *error*|*ERROR*|*cancel*|*CANCEL*) echo "kernel failed; log:" >&2; kaggle kernels output "$KN" -p "$OUT" >/dev/null 2>&1 || true; ls "$OUT"; exit 1 ;; esac
  sleep 60
done
kaggle kernels output "$KN" -p "$OUT"
ls -la "$OUT"
rm -rf "$WORK"
