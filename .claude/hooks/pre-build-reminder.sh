#!/usr/bin/env bash
# UserPromptSubmit hook: if the prompt mentions scroll-craft, remind Claude to run /pre-build first.
# Reads the hook JSON on stdin and looks only at the "prompt" field (not cwd or paths).
input=$(cat)
prompt=$(printf '%s' "$input" | tr '\n' ' ' | grep -o '"prompt"[[:space:]]*:[[:space:]]*"[^"]*' | head -1)
if printf '%s' "$prompt" | grep -qiE 'scroll[- ]?craft'; then
  echo "Pre-build rule (Son, 2026-11-23): before running scroll-craft, run the pre-build skill first (.claude/skills/pre-build/SKILL.md). Ask its preference questions, save the answers to the build's PREFS.md, then start scroll-craft Step 0 reusing those answers. Skip only if PREFS.md for this build already exists and is from this session."
fi
exit 0
