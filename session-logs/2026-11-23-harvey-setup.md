---
kind: handoff
date: 2026-11-23
topic: harvey-setup
status: in-progress
---

# Harvey (sales agent) is connected to Gmail; product training and prospecting are next

## Summary
Set up Harvey's sending side on the trg nst Google account (trgnst1@gmail.com) and installed it locally. Sent one manual outreach message to Delícias Cake & Bakery (Burlington, MA) on WhatsApp. Built a WhatsApp channel for Harvey, then Son asked to remove WhatsApp completely, so it is gone. Harvey is email only.

## Key takeaways / decisions
- Harvey sends from **trgnst1@gmail.com** (personal Gmail) for now. Fine for testing; real volume should move to a Google Workspace mailbox on a separate domain, warmed up first.
- The Google OAuth app is in **Testing** mode, so the Gmail login expires every 7 days: re-run `harvey gmail auth` from `.claude/skills/sales-agent/` (main checkout) when `harvey gmail test` fails.
- **WhatsApp removed** (Son, 2026-11-23): no WhatsApp code, docs or scheduled task. Don't rebuild it unless asked.
- Approval mode stays on. Never turn on autopilot or send without Son or Truong confirming list, copy and sending account.
- Never guess email addresses; Harvey only sends to verified ones (needs a verifier key).
- Browsers: Claude in Chrome "Browser 2" = trg nst profile; "Browser 1" = Hoàng Sơn profile. Computer use can only read Chrome, not click.

## State
- ✅ Python 3.12 installed; Harvey venv at `.claude/skills/sales-agent/.venv` (main checkout).
- ✅ Google Cloud project `harvey-sales-agent` on trg nst: Gmail API on, consent screen "Harvey" (External, Testing, test user trgnst1@gmail.com), Desktop OAuth client "Harvey desktop".
- ✅ `.env` has GMAIL_CLIENT_ID / GMAIL_CLIENT_SECRET; `data/gmail_token.json` exists; `harvey gmail test` → "Connected as trgnst1@gmail.com". (All gitignored, main checkout only.)
- ✅ Google Sheet "Outreach Inbox" in trg nst Drive: https://docs.google.com/spreadsheets/d/1_rxwslAhU_OJ_2xw9rqN2aEsuCxCVVJyJFbRFVLK6Qo/edit (Email tab empty; a WhatsApp tab with the Delícias row still exists, Son hasn't said whether to delete it).
- 🔄 Branch `claude/sales-agent-google-setup-0d1e03` holds the setup notes (connections.md, decisions log, SKILL.md status, CLAUDE.md/AGENTS.md line) and this file. **Not merged to main.** Its first two commits add WhatsApp, a later one (`e002d9b`) removes it: squash when merging so main never shows WhatsApp.
- ⛔ Not done: product training, signal confirmation, discovery, email verifier key (Reoon/ZeroBounce/Hunter), warmup (TrulyInbox), Precleared check (optional). Harvey database `data/harvey.db` doesn't exist yet.
- Delícias: WhatsApp message sent 2026-11-23 (delivered, no reply as of last check). No public email exists (checked directories, socials, press, MA corp filings). Owner per MA records: Roseli de Souza Reis (Delicias Cake Bakery, Inc., ID 001762872). Demo site: https://nguyenlieu12379.github.io/truongson-OS/delicias-cake/

## Artifacts
- `.claude/skills/sales-agent/` (Harvey pack; entry `SKILL.md`, guide `CLAUDE.md`)
- `.claude/skills/sales-agent/.env`, `data/gmail_token.json` (local secrets, main checkout, not in git)
- Branch `claude/sales-agent-google-setup-0d1e03` (unmerged)

## Next step
Ask Son or Truong whether to squash-merge `claude/sales-agent-google-setup-0d1e03` into main, then start Harvey **Step 3: product training** (follow `.claude/skills/sales-agent/CLAUDE.md`, one question at a time; manual config since there's no agency website yet: company, offer, price, ICP = independent F&B in the US, sender identity, booking). Run Harvey from the main checkout, where the venv and keys are.

## What NOT to do
- Don't add WhatsApp back (code, docs, scheduled checks).
- Don't use the borrowed claude.ai account's Gmail/Drive connectors for business work.
- Don't type passwords or paste secrets into chat; the OAuth secret is already in `.env`.
- Don't guess or probe email addresses; don't send anything without explicit approval of list, copy and sender.
- A second, unused client secret (ending vj0h) is still active on the Harvey desktop client in Google Cloud. Disable it there if cleaning up.
