# TruongSon website

The agency site for TruongSon: websites for any kind of business, starting with restaurants and cafés.

- Page: `index.html` (single file, plain CSS, no build step)
- Logo: `assets/logo.svg`
- Portfolio: `assets/portfolio/` (empty until demo or client sites exist)

## Edit the booking link (one place)

Every "Book" button reads one constant near the bottom of `index.html`:

```js
const BOOKING_URL = "REPLACE_WITH_GOOGLE_CALENDAR_BOOKING_LINK";
```

Replace the text in quotes with your Google Calendar booking link.

## Set up the free Google Calendar booking link

1. Sign in to calendar.google.com with a Google account.
2. Click **Create** > **Appointment schedule**.
3. Give it a name (for example "Discovery call"), set the length (for example 30 minutes), and pick the hours you're free.
4. Save, then copy the booking page link.
5. Paste it into `BOOKING_URL` above.

Until this is set, the buttons do not go anywhere useful.

## Edit the copy

All text is in `index.html`. Keep the copy plain, with no em dashes and no "AI-generated" wording. The offer is "websites", not AI-generated websites.

## Preview locally

Open a terminal in this folder and run:

```bash
python3 -m http.server 8000
```

Then open http://localhost:8000 in your browser.

## Deploy

Not deployed yet. Plan: GitHub Pages serving this folder, after Son reviews the page.
