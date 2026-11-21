#!/usr/bin/env bash
# Measures the "business weight" of the repo: every file and folder Son and
# Truong own, i.e. everything except git internals and vendored tooling
# (.claude/, .agents/ mirror, .github/, node_modules/).
# Used by /audit and the monthly Graphify check. Thresholds live in EXPANSIONS.md.
set -euo pipefail
cd "$(dirname "$0")/.."

FILES_LIMIT=1000
WORDS_LIMIT=500000

prune=(-path ./.git -o -path ./.claude -o -path ./.agents -o -path ./.github -o -name node_modules)

files=$(find . \( "${prune[@]}" \) -prune -o -type f -print | wc -l)
words=$(find . \( "${prune[@]}" \) -prune -o -type f \
  \( -name '*.md' -o -name '*.txt' -o -name '*.html' -o -name '*.csv' -o -name '*.json' \) -print0 \
  | xargs -0 cat 2>/dev/null | wc -w)
size=$(find . \( "${prune[@]}" \) -prune -o -type f -print0 | du -ch --files0-from=- 2>/dev/null | tail -1 | cut -f1)

echo "Business weight: $files files, $words words of text, $size on disk"
echo "Graphify limits: $FILES_LIMIT files or $WORDS_LIMIT words"
echo
echo "By folder (files):"
for d in */; do
  case "$d" in node_modules/) continue ;; esac
  printf '  %-14s %s\n' "$d" "$(find "$d" -name node_modules -prune -o -type f -print | wc -l)"
done

if [ "$files" -ge "$FILES_LIMIT" ] || [ "$words" -ge "$WORDS_LIMIT" ]; then
  echo; echo "TRIGGER: time to evaluate Graphify (see EXPANSIONS.md)."
else
  echo; echo "Under limits. Graphify not needed yet."
fi
