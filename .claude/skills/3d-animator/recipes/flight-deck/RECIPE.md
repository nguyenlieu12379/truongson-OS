# Recipe: the Flight Deck film ("Comment FLY")

This folder is the real project behind the flight deck reel: the same code, timeline, camera and sound mix. Nothing here is a simplified demo. Follow the steps in order and you get the same 14.9-second film. Then change the words and the panel to make your own.

What the film is: a dark cockpit panel in macro, one continuous shot. Every spoken word lights a lamp. The camera snaps, whips, tilts, dives and spins in the breaths of the voice. The gauges read the camera itself: the horizon gauge stays level while the camera tilts, the altimeter needle follows the camera's height, the gyro holds still while the camera rolls round it.

## 0. What you need

- A Mac or PC with Google Chrome, Node 18+, ffmpeg and Python 3 with numpy (`pip install numpy`).
- On Windows/Linux set `CHROME_PATH` to your Chrome.
- A voice take (step 2) and a music bed (step 5). These are not included: use your own.

Setup, once: `./setup.sh` (installs three.js 0.187 + puppeteer-core and copies the DIN Condensed / DIN Alternate fonts that every Mac has; elsewhere use any bold condensed font with those file names).

Ask Claude Code: "Read 3d-animator/SKILL.md and recipes/flight-deck/RECIPE.md, then build my flight deck film." It will run the steps below for you.

## 1. The script (29 words, 10 short phrases)

> Blender? Off. After Effects? Off. Cinema 4D? Off. Claude Code? On. One skill flies the camera. It tilts. It dives. It spins. Comment fly. I'll send you the skill.

Rules that made it work:
- About 2.7 words a phrase. Every phrase is one camera station.
- Questions rise, answers fall: that gives the camera a breath to move in.
- Three verbs (tilts, dives, spins), one per gauge, so each gets its own camera move.

## 2. The voice: one take, never cut

- ElevenLabs, voice "Liam - Energetic, Social Media Creator", model Eleven v4, stability 50, similarity 75. Paste the whole script in ONE request: no pause tags needed, it leaves 0.3-0.6 s of breath after each phrase.
- Save it as `sound/voice.mp3`. Do not chop or speed up the voice: the picture follows the voice, never the other way round.

## 3. Time every word (this is what makes the lamps hit)

- `whisper sound/voice.mp3 --model small.en --word_timestamps True --output_format json --output_dir out` (pip install openai-whisper), then `python3 -I tools/voice_words.py sound/voice.mp3 out/voice.json` lists each word with Whisper's time and the nearest rise in level.
- Whisper can be 0.25 s off inside a fast phrase. For every word that lights something, read the real start off the loudness curve: `python3 -I tools/level_curve.py sound/voice.mp3 7.0 9.0 2` and take the first 10 ms step where the bar jumps.
- Type the starts into `src/shots/tlf.js` (`V = { blender: 0.07, off1: 0.90, ... }`). `T0` = when the voice starts in the film (0.20 s). `END` = voice end + about 1 s for the end card.

Everything else (lamps, camera moves, sound effects) is computed from these times, so a new take only needs a new `V`.

## 4. Picture: scene + camera (src/shots/flight.js)

- Engine `src/film.js`: every frame is `renderAt(t)`, a pure function of time. Each frame is drawn 16 times with tiny changes (motion blur, depth of field, soft shadows), then bloom and one grade.
- Panel: graphite #14191C, steel #56656B, amber #FFB34D, green #89E3AA, cool white #E5F2F7. Rough steel, tight bloom, glossy caps that reflect the room only (`envOnly()`), so lamp lights don't leave white blobs.
- Order on the panel: BLENDER / AFTER EFFECTS / CINEMA 4D nameplates, each with a switch and a red OFF flag; the red guarded master switch and CLAUDE CODE + ON; the amber row ONE SKILL FLIES THE CAMERA; horizon, altimeter and gyro gauges; COMMENT, the cyan FLY display, the tiles I'LL SEND / YOU / THE SKILL.
- Camera: 36 moves in 14.9 s. Each system gets five moves: the name, a second look inside the question, down to the switch on "Off", back out in the breath, a whip to the next one. Holds are 4-13 frames and drift slightly so the shot never freezes. Moves are snap / whip / ease, each turning one way only.
- The gauges read the camera: tilt 24 then -19 degrees (horizon stays level), a dive with the altimeter needle making 1.5 turns, lagged so it still unwinds after landing (a whole number of turns would look like nothing moved), and one full roll round the gyro in 14 frames (keep the roll one turn up afterwards so it never wraps between samples).
- Preview any frame: serve the folder (`npx http-server .`) and open `index.html?t=9.5`. `?shots=flightd` shows the whole panel from outside.

Render:
```
node tools/moves.mjs flight                 # lists every move and hold, writes out/flight_kf.json (the mix needs it)
node render.mjs --video --from=0 --to=14.9 --n=16 --crf=15 --out=out/silent.mp4      # about 4 min on an M-series Mac; --n=4 for a fast preview
```

## 5. Sound (tools/mix_film.py)

```
SFX_DIR=~/Music/SFX BED=sound/bed.mp3 BED_START=30 python3 -I tools/mix_film.py out/tmp out/silent.mp4 out/flight.mp4
```
- The voice uncut on top (peak -3 dB), the music bed at -12 dB and ducked under the voice, master at -14 LUFS, peak -0.9 dBFS.
- Every effect is placed from `out/flight_kf.json`, so it lands on the picture: air on every camera move (loudest mid-move), a switch 0.06 s BEFORE each "Off" plus a falling tone, guard + master switch before "On" with a rising power-up and a hit on the pull-back, one switch per word of the skill row (each a touch higher), a gyro whirr on the tilt, needle ticks on the dive, a whirr on the spin, two notes (E, A) before "fly", a bell chord on the end card.
- The tones are synthesized in the script, in A and E (the key of the bed). If your bed is in another key, change `A4, E5, ...` at the top.
- Sample effects it loads from `SFX_DIR` (any similar files work; keep the names or edit `SRC`): `UI KIT/03 CLICK/` a switch flip, a click, a button press; `REEL KIT/02 IMPACT/` a short bass hit and two impacts; `REEL KIT/01 WHOOSH/` a small swish, a high fast swish and a light short whoosh.
- The script prints, word by word, whether the voice is on top. Fix any word where an effect is louder.

## 6. The 9:16 reel

The film is 16:9. The posted reel shows it playing on a laptop screen held by hand: use `kit/present/laptop_reel.sh` in this skill with your own laptop photo (see `references/present.md`). The first 2 seconds must say what made it ("No Blender. Just Claude").

## 7. Make it yours

Keep the method, change what is seen: a new panel (a mixing desk, a submarine, a synth), your own words, your own colours. Change `V` for your take, the stations in `flight.js` for your layout, and render again. Watch every render on a phone with sound before posting.
