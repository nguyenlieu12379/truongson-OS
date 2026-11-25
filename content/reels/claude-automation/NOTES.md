# NOTES

## v1 (2026-11-24)

- Started from the 3d-animator kit, switched to 1080x1920 (lib.js W/H, render.mjs viewport, index.html canvas).
- Voice: Kokoro TTS `af_heart`, speed 1.0, one take per line (`gen_voice.py`). Natural read was 37 s; pauses lengthened (0.3 s inside a rule, 0.9 s between rules) to land at 42.1 s, leaving a 3 s hold on COMMENT AUTOMATE.
- Word times are spread by letter count inside each line (Kokoro onnx gives no timestamps). Close enough for captions; check by ear.
- Windows: onnxruntime needed the VC++ runtime DLLs. Installed `msvc-runtime` in the Kokoro venv and copied its DLLs into `onnxruntime/capi/`. No admin needed.
- One clock: `timing.js` (generated) -> `timeline.js` (sections, 3D beats, screen ops) -> `film.js` draws it, `build_cues.mjs` writes `sound/cues.json`. Change a beat in timeline.js and picture and sound move together.
- Camera: 42 deg vertical FOV. In 9:16 the frame is only about 0.43 x distance wide, so the 32 cm screen needs the camera at 0.85 m or more. Shots at 0.6-0.8 m cropped the screen text.
- Sound: all effects and the music bed synthesized in `gen_sfx.py` (fixed seed). Music -17 dB, ducked under the voice. Mix: -14.1 LUFS, -1.4 dBTP.
- Props: sticky note (rule 1), floppy SKILL.md into the drive (rule 2), wall clock spins to 9:00 (rule 5), mug hops when the run finishes (fix).

## Re-render

```
$env:CHROME_PATH = 'C:\Program Files\Google\Chrome\Application\chrome.exe'
node render.mjs --stills=8.6,21,43 --n=8                                   # look
node render.mjs --video --n=4 --audio=sound/mix.wav --out=out/preview.mp4  # timing
node render.mjs --video --n=16 --audio=sound/mix.wav --out=out/final.mp4   # final
```

One shot only: add `--from=18 --to=24.4`. Script change: edit LINES in gen_voice.py, rerun it, then build_cues.mjs and mix.py.
