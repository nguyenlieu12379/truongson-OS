# The 10 ms level curve of a voice take, as text: one line per 10 ms with a bar, so word starts and dips can be read by eye.
# usage: python3 -I tools/level_curve.py <audio> [from s] [to s] [step: print every Nth 10 ms, default 1]
import sys, subprocess, struct, math
f = sys.argv[1]; a = float(sys.argv[2]) if len(sys.argv) > 2 else 0; b = float(sys.argv[3]) if len(sys.argv) > 3 else 1e9; st = int(sys.argv[4]) if len(sys.argv) > 4 else 1
raw = subprocess.run(['ffmpeg', '-v', 'quiet', '-i', f, '-ac', '1', '-ar', '16000', '-f', 's16le', '-'], capture_output=True).stdout
x = struct.unpack('<%dh' % (len(raw) // 2), raw[:len(raw) // 2 * 2]); hop = 160
db = [20 * math.log10(math.sqrt(sum(v * v for v in x[i:i + hop]) / hop) / 32768 + 1e-6) for i in range(0, len(x) - hop, hop)]
for i in range(int(a * 100), min(len(db), int(b * 100)), st):
    d = max(db[i:i + st]); print(f'{i / 100:6.2f} {d:6.1f} ' + '#' * max(0, int((d + 60) / 1.5)))
