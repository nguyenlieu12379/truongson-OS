# Vendored: scroll-craft

Source: https://github.com/nateherkai/scroll-craft (MIT, see LICENSE)
Commit: 75d81f74e83692add18cd7a8a8e078b8a887a579
Copied: 2026-11-20.

Included: the skill folder `plugins/nateherk-design/skills/scroll-craft/` moved to this folder's root (so the scroll-craft stage works), plus upstream `LICENSE`, `EXAMPLES.md`, `.env.example`, and `README.md` renamed `UPSTREAM-README.md`.
Excluded: `.git`, `media/` (README screenshots), `.claude-plugin/` marketplace files.

Local setup (not a change to upstream files):
- `.scrollcraft.json` at the repo root points the build workspace to `websites/TruongSon-demos/scrollcraft/`, so builds follow `websites/README.md` instead of creating a top-level `scrollcraft/` folder.

Needs: node, full ffmpeg, Chrome/Playwright (run `node .claude/skills/site-building/scripts/doctor.mjs`). `KIE_AI_API_KEY` only if generating assets via kie.ai; builds from a client's real photos need no key.

Local merge (2026-11-23): this folder is now the one `site-building` skill, which also holds pre-build (stage 1) and liquid-glass (stage 3). Upstream `SKILL.md` became `02-scroll-craft.md`. Within the vendored files, only the skill's own name and paths changed (`.claude/skills/site-building/`). Upstream `README`/`CHANGELOG` keep their original plugin paths as history.

Vendor copy. Update by re-cloning and re-copying the upstream files, then re-applying the path and stage-file renames above and bumping the commit line.
