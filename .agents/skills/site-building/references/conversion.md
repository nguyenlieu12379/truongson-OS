# Five conversion patterns

Every build must pass these five before anyone sees it. They come from Nate Herk's "I Studied 10,000 AI Websites" (https://youtu.be/mImbbszCjCI, added 2026-11-27). Nate made ScrollCraft, which our stage 2 is built on. A page that looks premium but fails these will still not get the client more customers, and more customers is what they pay us for.

Where an older rule in this skill or in `standing-preferences.md` clashes with these five, the five win.

## 1. Mirror test: the copy on the first screen

The right visitor lands and feels like they're looking in a mirror: their problem, their world, a clear sign they're in the right place. That means pain, person and promise, on the first screen.

The first screen answers three questions in real text, readable without scrolling:

1. **Who is this for?** Use the words a customer would type into Google ("Venezuelan breakfast in Doral", not "Taste the tradition").
2. **What do I get?** The outcome, not the feature. "Hot arepas in 10 minutes, open till 2am" beats "Authentic recipes".
3. **What do I do next?** One button, one action, one label used everywhere (`PREFS.md` Q14).

Rules:
- Write these three lines in `BRIEF.md` (section `## First screen`) **before** any design or asset work. Design comes after the words.
- The brand name alone is never the headline. The giant brand word can stay as a visual layer, but a real headline that answers 1 and 2 sits on the first screen too.
- Use their real world in the hero photo: their dish, their room, their street. No stock handshakes, no generic table.
- Only facts from their own listing or Instagram (hours, area, prices).

## 2. Highlighter rule: one colour for the one action

If every line is highlighted, nothing is. Most AI sites put the accent on headlines, icons, borders, backgrounds and the button, so the button stops standing out.

- 60/30/10: 60% background, 30% structure (text, menu, cards, section blocks), 10% accent.
- The accent goes **only** on the CTA, links and at most one or two words that must be seen. No accent headlines, icons, borders, section fills or decorative shapes.
- The accent must clearly contrast with both the 60 and the 30 colour. If it doesn't stand out against everything else, pick a different accent.
- Check: screenshot the first screen, squint (or blur it). The first thing you can still find is the CTA. If not, fail.

## 3. Front, middle, back: three layers on every screen

Flat pages, where every box, photo and button is pressed against the screen, read as cheap even with good copy and colour. Think of a stage: backdrop, furniture, actor.

- **Back:** something real. Their photo, their room, a soft shape. Never a plain white box.
- **Middle:** the content. Headline, text, cards.
- **Front:** the one action. The CTA sits on top of everything with a soft offset shadow. Nothing in the scene (a cutout, a tree line, a glass panel) ever covers it. Cut the scene around it if needed (Nate cut a V into a tree line to keep his button clear).
- **Let one thing break the edge** per section: a card or photo hanging halfway into the next section, so the page stops looking like a stack of boxes.
- **Lift only what matters.** The CTA, and at most one main card, get the shadow. Shadows on everything are flat again.

`hero-depth.md` covers the hero layering in detail. This rule applies to every screen, not only the hero.

## 4. Motion with a job

Scroll motion is the fastest way to look premium and the fastest way to look AI-made. Clients don't want a movie, they want customers. Moving things pull attention away from what visitors came to do.

Every animation earns its place by doing **one** job: show the product, point the eye to the next step, or show that something just happened. No job, or five jobs, means cut it.

1. **One thing moves per screen.** Pick the one moving thing (the dish, the result, the before/after). Everything else on that screen stays still. Drifting cutouts, wobbling letters, counters and a moving hero on one screen is four things.
2. **Never make them wait for the words.** On the first screen, the headline, the "what you get" line and the CTA are fully readable the moment the page paints. No fade-ins, no word-by-word, no letters flying through a 3D world, no text behind a scrub that hasn't arrived yet. Kinetic type is allowed further down the page, never on the first screen.
3. **Give them an off switch.** Respect `prefers-reduced-motion` (animations off, static composition with depth kept). Also ship a visible **motion toggle** in the bar, next to the theme toggle, that does the same thing and is remembered like the theme. Reduced motion is not "broken page": every scene must still read and still show its content when motion is off.

## 5. Free sample

Give visitors a taste of the result before asking for anything. A page that explains everything and then hands over a button or a form is the AI default. People value what they help make (the IKEA effect), so a small tool they use themselves converts better than more copy.

Every build ships **one** free sample, chosen from the questions every customer asks before they buy. It must be short enough that people finish it (3 taps or fewer to a result), and the result ends at the CTA.

F&B ideas, pick the one that fits the client's real questions:
- **"What should I order?" picker:** 2 or 3 taps (hungry level, sweet or savoury, group size), answer is real dishes with real names and prices, then "Order on WhatsApp" with the picks in the message.
- **Party or catering estimator:** guests and type of event in, rough tray count and price range out (only from their real menu prices; if prices aren't public, skip this one).
- **"Open now?" check:** live open/closed from their real hours, how long until close, directions in one tap.
- **Build your plate / box:** pick items, see the total, send it as the order.

Rules:
- Only real menu items, prices and hours. No real prices, no price tool.
- It works without motion and on a phone, with thumb-sized buttons.
- It's a scene with value (FAILURES #2: "value before motion"), not a widget dropped into empty space.

## Pre-show check

Before showing any build to Son or Truong, write the result of each in the build report, pass or fail with one line of proof:

| # | Check | Pass means |
|---|---|---|
| 1 | Mirror | First screen answers who, what you get, what next, in real text, no scroll |
| 2 | Highlighter | Accent only on CTA and links; blurred screenshot shows the CTA first |
| 3 | Layers | Every screen has back, middle, front; CTA never covered; one thing breaks a section edge |
| 4 | Motion | One moving thing per screen; first-screen text readable at paint; reduced motion and the toggle both work |
| 5 | Free sample | One tool, 3 taps or fewer, real data, ends at the CTA |
