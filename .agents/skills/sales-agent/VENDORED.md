# Vendored: sales-agent

Source: https://github.com/Sunaii-agency/sales-agent
Commit: 6b6a23a789090e165802baef4104ee4618a3e169
Copied: 2026-11-06 as a whole pack.
Excluded: .git, node_modules, target, .github, *.mp4/*.mov/*.webm/*.zip, video-projects/, examples/.
Read-only vendor copy. Update by re-cloning and re-copying, then bumping the commit line.
Local addition: SKILL.md (entry point so /sales-agent shows in the skill list). Not from upstream; keep it when re-copying.
Local change (2026-11-21): humanizer pass wired to the repo's no-ai-slop skill. `harvey/humanize.py` looks for `../no-ai-slop/SKILL.md` (plus its `eval.md`) before `~/.claude/skills/humanizer`; `harvey.yaml` sets `writer.humanizer: true`; one test added in `tests/test_humanize.py`. Re-apply these when re-copying.
