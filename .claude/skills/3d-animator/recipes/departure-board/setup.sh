#!/bin/sh
# One-time setup: installs three.js + puppeteer-core and copies the two DIN fonts every Mac ships with.
set -e; cd "$(dirname "$0")"
npm install
for f in "DIN Condensed Bold:DINCondensed-Bold" "DIN Alternate Bold:DINAlternate-Bold"; do
  src="/System/Library/Fonts/Supplemental/${f%%:*}.ttf"; dst="src/fonts/${f##*:}.ttf"
  if [ -f "$src" ]; then cp "$src" "$dst"; else echo "Not on a Mac: put any bold condensed font at $dst (e.g. Barlow Condensed Bold)"; fi
done
echo "Ready. Preview: npx http-server . then open index.html?t=8.4 . Render: see RECIPE.md"
