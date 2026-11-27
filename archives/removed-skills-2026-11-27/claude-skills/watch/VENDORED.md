# Vendored: watch (claude-video)

Source: https://github.com/bradautomates/claude-video (MIT, see LICENSE)
Commit: 03ceb42f7fa2c4439aca01752118044baabffb8f (release 0.3.2, 2026-09-25)
Copied: 2026-11-20. The skill folder only (`skills/watch/`): `SKILL.md` and `scripts/`.
Excluded: `scripts/build-skill.sh` (dev only), the plugin's SessionStart hook (`hooks/`), plugin manifests, tests, docs.

No local changes to upstream files. Update by re-cloning, re-copying `skills/watch/`, and bumping the commit line.

## AIOS notes (read before running)

- **Free setup (default here):** `--engine local`, `--detail balanced`, `--backend none` (captions only, no keys, no cost).
- **Needs per machine:** `ffmpeg`, `yt-dlp` and `deno`. Cloud sessions start clean, so install them each time:
  `pip install -q pipx && python3 -m pipx install "yt-dlp[default,curl-cffi]"` and `curl -fsSL https://deno.land/install.sh | sh -s -- -y && ln -sf ~/.deno/bin/deno ~/.local/bin/deno`,
  then `python3 .claude/skills/watch/scripts/setup.py --engine local` and `--backend none --detail balanced`.
- **Cloud limit (tested 2026-11-20):** YouTube returns 403 on video downloads from the cloud machine, so you get captions and title, no frames. Fine for talking-head tutorials. For visuals: a free Gemini key (aistudio.google.com/apikey) with `--engine gemini` (Google fetches the YouTube URL itself), or run on Son's or Truong's own computer.
- **Keys:** never paste a key in chat (the upstream SKILL.md offers that; ignore it here). Locally, put `GEMINI_API_KEY` in `~/.config/watch/.env`. In cloud sessions, ask before setting one up.
- **No captions:** `--backend whisperx` transcribes locally for free (about 1.5 GB download, 8 GB RAM, slow on CPU).
