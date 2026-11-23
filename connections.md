# Connections

Registry of every system your AIOS can reach. Filled by `/onboard` from Q4-Q7 answers; expanded over time as you wire new tools. `/audit` checks this file for domain coverage and freshness.

**Status (2026-11-20):** setup phase on a temporary claude.ai account. Its Gmail, Drive and Calendar connectors are not our business accounts, so don't use them. Rows 1 to 7 get wired after the move to our own plan.

| # | Domain | Tool | Mechanism | Auth | Last checked |
|---|---|---|---|---|---|
| 1 | Revenue / Financials | Stripe (planned, not set up) | not yet connected | — | — |
| 2 | Customer interactions | Gmail + cold calls (phone) + Google Meet | not yet connected | — | — |
| 3 | Calendar | Google Calendar (inferred from Gmail/Meet) | not yet connected | — | — |
| 4 | Communication | Gmail | not yet connected | — | — |
| 5 | Project / task tracking | Notion (assumed, confirm) | not yet connected | — | — |
| 6 | Meeting intelligence | Google Meet (no recorder yet) | not yet connected | — | — |
| 7 | Knowledge / files | Notion | not yet connected | — | — |
| 10 | Outreach inbox (email) | Google Sheet "Outreach Inbox" in trgnst1@gmail.com Drive: https://docs.google.com/spreadsheets/d/1_rxwslAhU_OJ_2xw9rqN2aEsuCxCVVJyJFbRFVLK6Qo/edit (tab Email) | manual / Claude in Chrome | trg nst Google login | 2026-11-23 |
| 8 | Video watching (YouTube, files) | yt-dlp + ffmpeg via `.claude/skills/watch/` | script | none (local engine); optional free `GEMINI_API_KEY` for visuals in cloud | 2026-11-20 |

**Mechanism options:** `mcp` (MCP server), `script` (Python/Bash hitting an API, in `scripts/`), `export` (CSV/JSON dump pipeline), `key+ref` (`.env` key + `references/{tool}-api.md` guide), `not yet connected`.

When you wire a new tool, also save `references/{tool}-api.md` capturing endpoints, auth flow, and common queries — researched-once-saved-forever.
