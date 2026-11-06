---
name: sales-agent
description: Autonomous cold-outreach agent pack (Harvey). Use only when the user explicitly asks to set up, configure, or run the sales agent, prospect list, or cold email campaign. It sends real email.
disable-model-invocation: true
---

# Sales Agent (Harvey pack)

This skill is a pointer to the full pack. The pack stays whole in `external/sales-agent/`; do not copy or split it.

Before any send, confirm with the user: the prospect list, the email copy, and the sending account. Never send email without an explicit go-ahead in the current conversation.

1. Read `external/sales-agent/CLAUDE.md` for the setup and guide flow, and `external/sales-agent/README.md` for an overview.
2. Pack reference notes: `external/sales-agent/skills/`.
3. Index and routes: `external/README.md`.
