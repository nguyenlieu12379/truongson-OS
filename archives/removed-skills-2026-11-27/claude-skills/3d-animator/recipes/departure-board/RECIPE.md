# Recipe: the Departure Board film ("Comment TICKET")

This folder is the real project behind the departure board reel: the same code, timeline, camera and sound mix. Nothing here is a simplified demo. Follow the steps in order and you get the same 12.9-second film. Then change the words and the board to make your own.

What the film is: an old split-flap railway departure board in macro, one continuous shot. The voice is a station announcement. Every name clatters into place on its word and a red CANCELLED flips in next to it. The big row locks on CLAUDE CODE with a green NOW BOARDING. On "Mind the gap" the two halves of the board swing apart and the camera flies between them to a ticket machine, where a paper ticket shoots out with the word to comment.

## 0. What you need

- A Mac or PC with Google Chrome, Node 18+, ffmpeg and Python 3 with numpy (`pip install numpy`).
- On Windows/Linux set `CHROME_PATH` to your Chrome.
- A voice take (step 2) and a music bed (step 5). These are not included: use your own.

Setup, once: `./setup.sh` (installs three.js 0.187 + puppeteer-core and copies the DIN Condensed / DIN Alternate fonts that every Mac has; elsewhere use any bold condensed font with those file names).

Ask Claude Code: "Read 3d-animator/SKILL.md and recipes/departure-board/RECIPE.md, then build my departure board film." It will run the steps below for you.

## 1. The script (30 words, one announcement)

> Passengers for Blender, After Effects, and Cinema 4D, please change trains. Your new service runs on one skill. Claude Code. Mind the gap. Comment ticket. I'll send you the skill.

Rules that made it work:
- The voice speaks in a form the world already has (a platform announcement), so the picture never has to explain why words appear on a board.
- A list of three names gives three camera stations and three red flags in the first three seconds.
- "Mind the gap" is not a line about the board, it is something the board DOES: the gap opens and the camera goes through it. Give your script one line like that.
- The call to action is an object from the same world (a ticket), not a caption.

## 2. The voice: one take, never cut

- ElevenLabs, voice "Liam - Energetic, Social Media Creator", model Eleven v4, stability 50, similarity 75. Paste the whole script in ONE request, with a full stop after "ticket". No pause tags needed.
- Save it as `sound/voice.mp3`. Do not chop or speed up the voice: the picture follows the voice, never the other way round.
- Check the take before building anything: the first name should start within about 0.7 s, there should be a breath after each of the three names, and about 0.4 s of air before "Mind the gap" and before "Comment ticket". If not, generate again with other punctuation.

## 3. Time every word (this is what makes the flaps land)

- `whisper sound/voice.mp3 --model small.en --word_timestamps True --output_format json --output_dir out` (pip install openai-whisper), then `python3 tools/voice_words.py sound/voice.mp3 out/voice.json` lists each word with Whisper's time and the nearest rise in level.
- Whisper can be 0.25 s off inside a fast phrase. For every word that lands something, read the real start off the loudness curve: `python3 tools/level_curve.py sound/voice.mp3 0.0 2.0 2` and take the first step where the bar jumps.
- Type the starts into `src/shots/tlb.js` (`V = { passengers: 0.08, for: 0.32, blender: 0.68, ... }`). `T0` = when the voice starts in the film (0.10 s). `END` = voice end + about 1.2 s for the end card.

Everything else (flaps, camera moves, sound effects) is computed from these times, so a new take only needs a new `V`.

## 4. Picture: scene + camera (src/shots/board.js)

- Engine `src/film.js`: every frame is `renderAt(t)`, a pure function of time. Each frame is drawn 16 times with tiny changes (motion blur, depth of field), then bloom and one grade.
- **The split-flap cell.** One texture atlas holds every glyph (white on a dark card, DIN Condensed widened to fill the card). A cell is two fixed half cards plus one falling flap: its front shows the OLD top half, its back the NEW bottom half, and it turns 180 degrees about the middle axle. The halves are picked per frame by moving UVs, so thousands of flips cost nothing. Check it with `?shots=boardc` (one cell, close) before any camera work: a wrong half reads as garbage.
- **A rattle must land.** `rattle(seed, from, land, glyph)` schedules flips every 0.08 to 0.1 s that END exactly on the landing time, so the last flap falls on the spoken word. A row that only rattles is seconds of nothing to read: give every long rattle a word to land on in between (the big row lands NEW SERVICE on the announcement, then flips on to CLAUDE CODE).
- **Layout.** Left bank: BLENDER / AFTER EFFECTS / CINEMA 4D with a red CANCELLED each. Right bank: amber ONE SKILL, the big ivory row, green NOW BOARDING. A fixed lintel with a MIND THE GAP sign, hazard stripes on the two inner edges. Behind the board: a brass ticket machine (a TICKETS sign, running bulbs, the paper ticket, a punch) and an amber strip of 23 flaps. Colours: enamel #0B0D0F, ivory #F4EBD6, red #FF4A36, green #7DF0A0, amber #FFB34D. No real railway's name or logo.
- **Camera: 31 moves in 12.9 s** (2.4 a second), the flight deck film's model: snap / whip moves of 3 to 7 frames, holds that drift slightly so the shot never freezes, each landing rings once. One new move kind, `rush` (accelerating), for the flight through the gap.
- **The hook.** The first move starts on frame 0, from far to the side and rolled, onto a word that is already readable (only its last flap is still turning; the rows under it stay blank until their own cue). Measure it on the FINAL render, not on a preview: `python3 tools/screenmotion.py film=out/silent.mp4` prints how far the picture moves per frame and where the fast bursts are. Here the first four frames move 4.6 to 7.4 % of the frame width each.
- **The gap.** The banks swing apart DURING the hold on the seam (on "Mind"), so the viewer sees the gap open; the camera goes on "the gap". The destination must already show something (the TICKETS sign and the bulbs), or the first half second there is a black frame.
- **Crops come from the drift.** A word that fits when the camera lands can be cut at the end of its hold. Render a still at the LAST frame of every hold and widen the pose where a letter touches the edge.
- **The end card stays behind the board.** Pull the camera back further and the lens ends up in front of the closed banks. If a line does not fit, make the strip shorter, not the shot wider.
- Preview any frame: serve the folder (`npx http-server .`) and open `index.html?t=8.4`. `?shots=boardd` shows the whole board with every word landed, `?shots=boardt` the ticket machine.

Render:
```
node tools/moves.mjs board                  # lists every move and hold, writes out/board_kf.json (the mix needs it)
node render.mjs --video --n=16 --crf=15 --out=out/silent.mp4       # 2 to 5 min on an M-series Mac; --n=4 for a fast preview
```

**Two endings.** `board` ends on I'LL SEND YOU THE SKILL (12.9 s). `boardp` adds one beat (14.3 s): after the voice, the same strip clatters and flips to a second line, for example where the link is. The strip has 23 flaps, so the line has at most 23 characters; edit the string in `src/shots/boardp.js`. Build it with `node tools/moves.mjs boardp` and `node render.mjs --shots=boardp --video --n=16 --crf=15 --out=out/silent_b.mp4`.

## 5. Sound (tools/mix_film.py)

```
SFX_DIR=~/Music/SFX BED=sound/bed.mp3 BED_START=30 python3 tools/mix_film.py out/tmp out/silent.mp4 out/board.mp4
```
For the second ending add `KF=out/boardp_kf.json` and use its silent file.

- The voice uncut on top (peak -3 dB), the music bed at -12 dB and ducked under the voice, master at -14 LUFS.
- Every effect is placed from `out/board_kf.json`, so it lands on the picture: air on every camera move (loudest mid-move), one clack 0.06 s BEFORE each word that lands (never on the word), a clack and a falling tone for each red flag, two notes and a rising power-up for NOW BOARDING with the hit just after the word, a latch, a rush of air and a clap for the gap, paper for the ticket, a punch, a bell chord on the end card.
- **The flap clatter** is one short tick per falling flap, thinned to about 45 a second (more turns into hiss) and dropped 10 dB wherever the voice is speaking, so it fills the gaps and never sits on a word.
- A sound that follows a picture event can still mask a quiet word. The script checks each word only for as long as it really lasts; where an event sat on a word's tail, the fix was to move the picture event two frames, not to let its sound trail behind.
- The tones are synthesized in the script, in A and E (the key of the bed). If your bed is in another key, change `A4, E5, ...` at the top.
- Sample effects it looks for in `SFX_DIR` (any similar files work; keep the names or edit `SRC` and `TICKS`): `UI KIT/03 CLICK/` a switch flip, a click, a button press; `REEL KIT/02 IMPACT/` a short bass hit and two impacts; `REEL KIT/01 WHOOSH/` a small swish, a high fast swish and a light short whoosh; `REEL KIT/09 PAPER/` one short paper sound; `PHONE/` two very short text ticks (the flaps). **A file that is not there is replaced by a synthesized stand-in** and the script prints which, so the mix always finishes; real samples sound better.
- The script prints, word by word, whether the voice is on top. Fix any word where an effect is louder.

## 6. The 9:16 reel

The film is 16:9. The posted reel shows it playing on a laptop screen held by hand: use `kit/present/laptop_reel.sh` in this skill with your own laptop photo (see `references/present.md`). The first 2 seconds must say what made it ("No Blender. Just Claude").

## 7. Make it yours

Keep the method, change what is seen: your own three names, your own destination, your own keyword on the ticket. Other worlds with the same mechanics: an airport board, a scoreboard, a cinema marquee, a cash register display. Change `V` for your take, the words and stations in `board.js` for your layout, and render again. Count your letters before you write the script: a row can only say what its flaps can hold. Watch every render on a phone with sound before posting.
