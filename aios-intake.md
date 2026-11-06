# AIS-OS Intake

This is the source-of-truth file for your AIOS. Fill it in by typing, voice-pasting (Wispr Flow / OS dictation), or running `/onboard` for a guided conversation. Whichever mode, this file is what `/onboard` reads to scaffold your Day-1 setup.

**Hard cap: 7 questions.** Each answerable in under 60 seconds. Don't overthink — you can edit and re-run `/onboard` any time.

---

## Q1 — Who are you, what do you sell, who do you sell it to?

Identity, offer, ICP. One paragraph each is fine.

```
Identity: Two co-operators share this AIOS: Son and Truong.
Offer: Websites for any kind of business.
ICP: Small businesses in the US. F&B (independent restaurants and coffee shops) is the first segment.
```

---

## Q2 — Paste 1-2 things you've written recently. Don't edit them.

An email, a LinkedIn post, a DM, a doc — anything that sounds like you when you're not trying. **Paste verbatim.** Do not type these mid-conversation with Claude — chat-shaped samples are worse than no samples (voice contamination).

```
PENDING: no existing writing yet (new business). Paste the first real client email or post here, unedited, then re-run /onboard.
```

---

## Q3 — What are your 2-3 biggest priorities for the next 90 days?

Quarterly priorities. Not yearly aspirations. Things that, if not done by July, would make you say "I wasted Q2."

```
1. Sign 10 paying clients (F&B first: US restaurants / coffee shops) by 2027-02-06.
2. Build an Instagram brand as proof/portfolio to drive sales. Target (draft, confirm): post 3x/week and showcase 5+ demo/client sites by 2027-02-06.
3. (none for now)
```

---

## Q4 — Where does revenue actually land, and where is it tracked?

Multiple answers OK. Stripe? Skool? GoHighLevel? QuickBooks? A spreadsheet?

```
No revenue yet (pre-launch). Plan: collect payments via Stripe. Tracking: Stripe dashboard (not set up yet).
```

---

## Q5 — Where do you talk to customers, your team, and the outside world day-to-day?

Email (which one — Gmail / Outlook)? Slack? Teams? DMs (Skool / Discord / iMessage)? Phone?

```
Gmail (email). Cold calls by phone for outreach. Sales calls on Google Meet. Calendar inferred: Google Calendar.
```

---

## Q6 — Where do meeting recordings, notes, and important docs live?

Granola? Otter? Fireflies? Google Drive? Notion? Dropbox? A folder on your desktop you keep meaning to organize?

```
Notion (notes, docs). No meeting recorder yet.
```

---

## Q7 — What's the one task that eats your week, and where do you currently track work?

The single biggest time-suck or recurring drudgery. Plus where tasks/projects live (ClickUp / Asana / Linear / Notion / a notebook).

```
Top pain: the cold outreach process (finding leads, cold calling, follow-up) and building each website. Work tracking: assumed Notion (not confirmed).
```

---

When this file is filled, run `/onboard` (or re-run it) and the wizard will scaffold your Day-1 file set: `context/`, `references/voice.md`, populated `connections.md`, and a filled `CLAUDE.md`.
