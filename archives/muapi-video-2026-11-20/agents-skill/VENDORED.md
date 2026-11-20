# Vendored: muapi-video

Source: https://github.com/SamurAIGPT/muapi-skills (MIT, see LICENSE)
Commit: 1dd7527a9d5e0477e18af8baf8c6915053585680 (2026-10-02)
Copied: 2026-11-14 as a video-only subset.

Included: `skills/core/` (media, edit, platform), `skills/library/motion/` (16 video recipes), `skills/schema_data.json`, and the upstream `skills/muapi-models/SKILL.md` moved to this folder's root and renamed `muapi-video`.
Excluded: image, social, visual and workflow library categories, `skills/media_outputs/` sample files, `.git`.

Local changes (keep these when re-vendoring):
1. `SKILL.md` frontmatter `name` changed from `muapi-models` to `muapi-video`, and an "AIOS notes" section added at the bottom.
2. `skills/library/motion/seedance-2/SKILL.md` line ~593: `../../../../core/media/` corrected to `../../../core/media/` (upstream path did not resolve).

Read-only vendor copy. Update by re-cloning and re-copying, then bumping the commit line and re-applying the local changes above.

Tool it calls: the Muapi REST API (api.muapi.ai). See `references/muapi-api.md`. The optional `muapi-cli` npm package is not vendored.
