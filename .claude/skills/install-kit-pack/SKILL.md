---
name: install-kit-pack
description: Install a GitHub kit repo as a whole pack in this AIOS (.claude/skills and .agents/skills), with a pinned commit, VENDORED.md, and routing in the operating manual. Use when the user asks to install, add, or vendor a repo or kit as a pack. Manual invocation only.
disable-model-invocation: true
---

# Install a kit as a pack

A pack is one whole repo, copied as one folder, with no splitting into individual skills. Follow these steps in order. Stop and ask if any check fails.

## 1. Read the repo

- Attach or read the repo with `add_repo` (read access is enough for install). Do not run any script from it.
- Clone shallow, with the LFS guard, into `/home/user/sunaii-agency/<name>`:
  `GIT_LFS_SKIP_SMUDGE=1 git clone --depth 1 https://github.com/<owner>/<name> /home/user/sunaii-agency/<name>`
- Record the commit: `git -C /home/user/sunaii-agency/<name> rev-parse HEAD`.

## 2. Check before copying

- Secret scan for keys (`sk-`, `AKIA`, `ghp_`, `xox`) and `.env` files. Only `.env.example` templates are allowed. Stop if a real key is found.
- Check the license file. Note it in the report.
- Check the size: `du -sh --exclude=.git <name>`. Note anything over 5 MB.

## 3. Copy as one pack

Copy into `.claude/skills/<name>/` with these exclusions: `.git`, `.github`, `node_modules`, `target`, `*.mp4`, `*.mov`, `*.webm`, `*.zip`, and sample video folders (`video-projects/`, `examples/`) when the repo is a video kit. Keep everything else, including its own `SKILL.md` files, docs, and tests.

## 4. Write VENDORED.md

Create `.claude/skills/<name>/VENDORED.md` with the source URL, the pinned commit, the copy date, and the exclusion list. Re-copying later means bumping the commit line.

## 5. Mirror for Codex

Copy `.claude/skills/<name>/` to `.agents/skills/<name>/` and check with `diff -rq`. The two must be identical.

## 6. Route it

Add one entry under "Kit packs" in both `CLAUDE.md` and `AGENTS.md`, with the same wording:
- when to use it → `.claude/skills/<name>/` → entry point (its README, AGENTS.md, or main SKILL.md)

Then check that every route path exists on disk, and that `diff CLAUDE.md AGENTS.md` is clean. `/link` can only be started by the user, so routing is done by editing the manuals directly.

## 7. Commit and push

Commit with a clear message. Push to `main` and the working branch as a fast-forward. No pull request unless asked.

## 8. Never run during install

Install scripts, `npx`, `pip install`, `docker compose`, `make`, or any `.sh` from the repo. Setup is a separate, reviewed step. Tell the user what setup would need.

## Installed packs

| Pack | Source | Entry point |
|---|---|---|
| design-skills | Sunaii-agency/design-skills | `.claude/skills/design-skills/README.md` |
| impeccable | Sunaii-agency/impeccable | `.claude/skills/impeccable/.claude/skills/impeccable/SKILL.md` |
| taste-skill | Sunaii-agency/taste-skill | `.claude/skills/taste-skill/skills/taste-skill/SKILL.md` |
| video-edit-kit | Sunaii-agency/video-edit-kit | `.claude/skills/video-edit-kit/AGENTS.md` |
| sales-agent | Sunaii-agency/sales-agent | `.claude/skills/sales-agent/CLAUDE.md` (sends real email; run only on request) |
| scrapegraph | Sunaii-agency/scrapegraph | `.claude/skills/scrapegraph/README.md` |
