---
name: sales-agent
description: Use when Son or Truong asks to set up, run, or check Harvey, the cold-outreach agent (finds prospects, writes and sends cold email, sorts replies, books meetings). Also when they say "sales agent", "Harvey", "cold email campaign", or "find prospects". Gmail connected, not trained yet. It sends real email, so never send or turn on autopilot without explicit approval.
---

# sales-agent (Harvey)

Entry point for the vendored Harvey pack (source and commit in `VENDORED.md`).

## Status

Partly set up (2026-11-23). Done: venv with Python 3.12 (main checkout only), `.env` with Gmail OAuth keys, `harvey gmail auth` as trgnst1@gmail.com (`harvey gmail test` passes). Google Cloud project `harvey-sales-agent` on that account, OAuth app in Testing mode, so the Gmail login expires every 7 days: re-run `harvey gmail auth`. Not done: product training, signals, discovery, warmup, verifier keys. trgnst1@gmail.com is a personal Gmail, fine for testing; real outreach should move to a Workspace mailbox on a separate domain. Decision: `decisions/log.md`, 2026-11-20 "Outreach tools: sales-agent in, REA out".

## Rules

- Only start setup or a run when Son or Truong asks for it in this conversation.
- Before anything sends, confirm three things with them: the prospect list, the email copy, the sending account.
- Approval mode only. Never turn on autopilot unless they say so in writing.
- Use a separate sending domain, never the main one, and warm it up first.
- Show drafts before anything goes out (house rule: no faking our voice without a review).
- Every draft gets a no-ai-slop pass. Harvey does it automatically (`writer.humanizer: true` in `harvey.yaml`, skill at `.claude/skills/no-ai-slop/`). For any copy you write or edit by hand (templates, `prompts/writer.md`, reply scripts), run `/no-ai-slop` on it before showing Son or Truong.

## How to run it

1. Read `CLAUDE.md` in this folder. It is Harvey's own guide: health check, setup steps 1 to 7, daily use.
2. Follow it one step at a time and ask one question at a time.
3. For Microsoft 365 or pre-cleared lists, see `docs/`.
