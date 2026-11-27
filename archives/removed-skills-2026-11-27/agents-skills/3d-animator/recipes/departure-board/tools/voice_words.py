# Word starts read off the take's loudness curve (10 ms RMS), not from Whisper (Whisper's times can be off by 0.1-0.4 s).
# usage: python3 -I tools/voice_words.py sound/voice.mp3 [whisper.json]
# Prints every stretch of sound (start, end, peak dB) and, with a Whisper file, the nearest rise in level to each word.
import sys, subprocess, struct, math, json
f = sys.argv[1]; sr = 16000
raw = subprocess.run(['ffmpeg', '-v', 'quiet', '-i', f, '-ac', '1', '-ar', str(sr), '-f', 's16le', '-'], capture_output=True).stdout
x = struct.unpack('<%dh' % (len(raw) // 2), raw[:len(raw) // 2 * 2]); hop = 160
e = [math.sqrt(sum(v * v for v in x[i:i + hop]) / hop) / 32768 for i in range(0, len(x) - hop, hop)]
db = [20 * math.log10(v + 1e-6) for v in e]; mx = max(db); thr = mx - 32
seg = []; on = None
for i, d in enumerate(db):
    if d > thr and on is None: on = i
    if d <= thr and on is not None:
        if i - on >= 3: seg.append([on, i])
        on = None
if on is not None: seg.append([on, len(db)])
merged = []
for s in seg:
    if merged and s[0] - merged[-1][1] <= 4: merged[-1][1] = s[1]
    else: merged.append(s)
print(f'{f}: {len(x) / sr:.2f} s, peak {mx:.1f} dB, threshold {thr:.1f} dB')
for a, b in merged: print(f'  sound {a / 100:6.2f} - {b / 100:6.2f}  ({(b - a) / 100:.2f} s)  peak {max(db[a:b]):6.1f} dB')
def rise(t, back=0.45, fwd=0.3):      # the steepest rise in level near a Whisper time: where the word really starts
    i0, i1 = max(2, int((t - back) * 100)), min(len(db) - 4, int((t + fwd) * 100)); best = None
    for i in range(i0, i1):
        lo = max(db[i - 2:i + 1]); hi = min(db[i + 2:i + 5])
        if lo < thr + 6 and hi > thr + 10:
            sc = hi - lo
            if best is None or sc > best[0] + 3 or (abs(i / 100 - t) < abs(best[1] / 100 - t) and sc > best[0] - 3): best = (sc, i)
    return (best[1] + 1) / 100 if best else None
if len(sys.argv) > 2:
    d = json.load(open(sys.argv[2])); out = {}
    for s in d['segments']:
        for w in s['words']:
            r = rise(w['start']); print(f"  {w['word'].strip():12s} whisper {w['start']:6.2f}   level rise {r if r is not None else '   -'}")
