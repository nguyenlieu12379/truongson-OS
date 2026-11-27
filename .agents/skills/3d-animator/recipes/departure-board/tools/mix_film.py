# Soundtrack for the DEPARTURE BOARD film. Same grammar as the flight deck film's mix: the voice take UNCUT, a music bed ducked under it,
# air on every camera move (its loudest point in the middle of the move), a mechanical clack just BEFORE each word that lands on the board
# (never on the word), tones only on A and E (the bed's key).
# This world adds: the flap clatter (dropped hard under the voice, so it lives in the gaps), a two-note station chime, the red flags,
# the boarding notes and power-up, the fly-through and the banks clapping shut, the ticket and its punch.
# Times come from the picture itself: out/board_kf.json (node tools/moves.mjs board) = every camera move, every rattle, every landing.
# usage: [VOICE=sound/voice.mp3] [BED=sound/bed.mp3] [BED_START=30] [SFX_DIR=~/Music/SFX] [KF=out/board_kf.json] python3 tools/mix_film.py <tmp dir> [<silent video.mp4> <out.mp4>]
# Run it from the recipe folder; it needs numpy and ffmpeg. Everything is summed in numpy with fixed seeds, so two runs give the same file.
# A sample file that is not in SFX_DIR is replaced by a synthesized stand-in (the script prints which), so the mix always finishes.
import sys, os, subprocess, re, math, json, array, struct
import numpy as np
TMP = sys.argv[1]; VID, OUT = (sys.argv[2], sys.argv[3]) if len(sys.argv) > 3 else (None, None)
os.makedirs(TMP, exist_ok=True)
tl = open('src/shots/tlb.js').read()
T0 = float(re.search(r'export const T0 = ([\d.]+)', tl).group(1)); END = float(re.search(r'export const END = ([\d.]+)', tl).group(1))
V = {k: float(v) for k, v in re.findall(r'(\w+): ([\d.]+)', tl[tl.index('export const V'):tl.index('export const F')])}
KFP = os.environ.get('KF', 'out/board_kf.json')
if not os.path.exists(KFP): sys.exit(f'{KFP} not found. Run first: node tools/moves.mjs board   (or boardp for the second ending)')
KF = json.load(open(KFP)); END = float(KF['end']); MV = KF['moves']; WD = KF['words']; EV = KF['ev']; RAT = KF['rattles']; LANDS = sorted(KF['lands'])      # KF=out/boardp_kf.json = the second ending (the strip's second line)
WAV = os.environ.get('WAV', 'out/mix_film.wav'); VOICE = os.environ.get('VOICE', 'sound/voice.mp3')
F = lambda k: T0 + V[k]
BED = os.environ.get('BED', 'sound/bed.mp3')
for what, f in (('voice take', VOICE), ('music bed', BED)):
    if not os.path.exists(f): sys.exit(f'{what} not found: {f}   (save it there, or set {"VOICE" if what[0] == "v" else "BED"}=<your file>)')
S = os.path.expanduser(os.environ.get('SFX_DIR', '~/Music/SFX')); R = f'{S}/REEL KIT'; U = f'{S}/UI KIT'      # SFX_DIR = your SFX folder; RECIPE.md lists the files it looks for
SW = f'{U}/03 CLICK/03-037 EEnE Switch Flip.wav'; CK = f'{U}/03 CLICK/03-001 Click2.wav'
SRC = {'switch': SW, 'switchL': (SW, 0.8), 'click': CK, 'clickL': (CK, 0.7), 'clickH': (CK, 1.7), 'press': f'{U}/03 CLICK/03-031 EEnE Computer - Button Press.wav',
       'bass': f'{R}/02 IMPACT/02-08 Short Bass Hit.wav', 'imp7': f'{R}/02 IMPACT/02-14 EEnE Impact 7.wav', 'boomph': (f'{R}/02 IMPACT/02-11 EEnE Impact 12 boomph.wav', 0.9),
       'swish': f'{R}/01 WHOOSH/01-08 whoosh_swish_small_01.wav', 'swishH': (f'{R}/01 WHOOSH/01-08 whoosh_swish_small_01.wav', 1.25), 'swishL': (f'{R}/01 WHOOSH/01-08 whoosh_swish_small_01.wav', 0.85),
       'fast': f'{R}/01 WHOOSH/01-01 whoosh_swish_high_fast_01.wav', 'fastL': (f'{R}/01 WHOOSH/01-01 whoosh_swish_high_fast_01.wav', 0.78),
       'whoosh': f'{R}/01 WHOOSH/01-10 Whoosh Light Short.wav', 'paper': f'{R}/09 PAPER/09-04 Papel 11.wav'}
for i in range(5): SRC[f'sw{i}'] = (SW, 0.92 + 0.045 * i)      # the five words of the last strip: one clack each, a touch higher every time
TICKS = [(f'{S}/PHONE/9 text tick 2.mp3', p) for p in (0.82, 0.92, 1.0, 1.1)] + [(f'{S}/PHONE/8 text char tick.mp3', p) for p in (0.9, 1.05)] + [(CK, 1.45), (CK, 1.75)]      # one flap falling: eight voices of it
FXG = float(os.environ.get('FXG', -2.5)); CLG = float(os.environ.get('CLG', -19.0)); DUCK = float(os.environ.get('DUCK', 10.0)); SR = 48000      # effects trim; clatter peak; how far the clatter drops under the voice (dB)
def run(cmd, binary=False, inp=None): return subprocess.run(cmd, capture_output=True, text=not binary and inp is None, input=inp, timeout=300)
FMT = 'aformat=sample_rates=48000:channel_layouts=stereo'
def load(f, pitch=1.0):
    af = FMT + (f',asetrate={int(48000 * pitch)},aresample=48000' if pitch != 1.0 else '')
    raw = run(['ffmpeg', '-v', 'error', '-i', f, '-af', af, '-f', 'f32le', '-ac', '2', '-ar', '48000', '-'], True).stdout
    return np.frombuffer(raw[:len(raw) // 8 * 8], dtype=np.float32).reshape(-1, 2).astype(np.float64)
def wav(path, a): r = subprocess.run(['ffmpeg', '-v', 'error', '-y', '-f', 'f32le', '-ar', '48000', '-ac', '2', '-i', '-', '-c:a', 'pcm_f32le', path], input=a.astype(np.float32).tobytes(), capture_output=True, timeout=180); assert r.returncode == 0, r.stderr[-300:]
def peakdb(f): return 20 * math.log10(max(1e-9, float(np.abs(load(f)).max())))
def pcm(f, sr=16000): raw = run(['ffmpeg', '-v', 'quiet', '-i', f, '-ac', '1', '-ar', str(sr), '-f', 's16le', '-'], True).stdout; n = len(raw) // 2; return struct.unpack('<%dh' % n, raw[:n * 2])
tt = lambda d: np.arange(int(d * SR)) / SR
def fades(a, fi=0.001, fo=0.08):
    n = len(a); i, o = max(1, int(fi * SR)), max(1, int(fo * SR)); a = a.copy(); a[:i] *= np.linspace(0, 1, i)[:, None]; a[n - o:] *= np.linspace(1, 0, o)[:, None]; return a
st = lambda m: np.stack([m, m], axis=1)
def noise(d, lo, hi, seed, tilt=1.0):
    n = int(d * SR); sp = np.fft.rfft(np.random.default_rng(seed).standard_normal(n)); fq = np.fft.rfftfreq(n, 1 / SR); m = (fq >= lo) & (fq <= hi); sp[~m] = 0; sp[m] /= np.maximum(fq[m], 1) ** (tilt / 2); x = np.fft.irfft(sp, n); return x / np.max(np.abs(x))
def sweep(f0, f1, d, k=1.0):
    t = tt(d); ph = 2 * np.pi * f0 * d / np.log(f1 / f0) * ((f1 / f0) ** (t / d) - 1); return np.sin(ph) + 0.45 * k * np.sin(2 * ph) + 0.25 * k * np.sin(3 * ph)
def bell(f, d=0.75): t = tt(d); return fades(st(0.5 * np.sin(2 * np.pi * f * t) * np.exp(-t * 6.5) + 0.26 * np.sin(2 * np.pi * f * 2.76 * t) * np.exp(-t * 10) + 0.13 * np.sin(2 * np.pi * f * 5.4 * t) * np.exp(-t * 16)))
A4, E5, A5, E6, A6 = 440, 659.3, 880, 1318.5, 1760      # the bed sits on A with a strong E: every tone made here is an A or an E
SYN = {}
SYN['pdown'] = fades(st(sweep(660, 165, 0.30) * np.exp(-tt(0.30) * 7)), 0.004, 0.06)                                   # a departure dying: a short falling tone
SYN['pup'] = fades(st(sweep(110, 880, 0.55) * np.minimum(1, tt(0.55) * 9) * (0.35 + 0.65 * tt(0.55) / 0.55) + 0.25 * noise(0.55, 900, 5000, 3, 0.4) * (tt(0.55) / 0.55) ** 2), 0.01, 0.05)   # the station lamps coming up
tb = tt(0.22); SYN['blip'] = fades(st(np.where(tb < 0.06, np.sin(2 * np.pi * E6 * tb), np.sin(2 * np.pi * A6 * tb) * np.exp(-(tb - 0.06) * 24)) * 0.7 + np.where(tb < 0.06, 0, 0.2 * np.sin(2 * np.pi * A6 * 2 * tb) * np.exp(-(tb - 0.06) * 30))), 0.002, 0.05)   # NOW BOARDING: two notes, E then A
SYN['chord'] = fades(bell(A5, 1.1) + bell(E6, 1.1) * 0.8 + bell(A6, 1.1) * 0.45)
ch = np.zeros((int(0.95 * SR), 2)); b1, b2 = bell(E6, 0.6), bell(A5, 0.78); ch[:len(b1)] += b1; i2 = int(0.17 * SR); ch[i2:i2 + len(b2)] += b2; SYN['chime'] = ch      # the station's two-note call, E down to A
MISSING = []; SUBN = set()
def stand_in(f, pitch=1.0):      # a synthesized stand-in for a sample file that is not there: a tick, a clack, a low hit, a rush of air or a sheet of paper
    name = os.path.basename(f); MISSING.append(name); k = f.upper(); seed = sum(map(ord, name)) % 9973
    if 'TICK' in k: t = tt(0.05); x = noise(0.05, 1800, 7000, seed) * np.exp(-t * 320) + 0.5 * np.sin(2 * np.pi * 900 * t) * np.exp(-t * 200)
    elif 'PAPER' in k or 'PAPEL' in k: t = tt(0.30); x = noise(0.30, 2000, 9000, seed, 0.2) * (0.6 + 0.4 * np.sin(2 * np.pi * 90 * t)) * np.sin(np.pi * t / 0.30) ** 0.7
    elif 'WHOOSH' in k: d = 0.30 if 'FAST' in k else 0.45; t = tt(d); x = noise(d, 400, 6500, seed, 0.6) * np.sin(np.pi * t / d) ** 2
    elif 'IMPACT' in k and 'BASS' in k: t = tt(0.6); x = sweep(70, 38, 0.6) * np.exp(-t * 7)
    elif 'IMPACT' in k: t = tt(0.5); x = 0.8 * sweep(120, 45, 0.5) * np.exp(-t * 9) + 0.5 * noise(0.5, 200, 3000, seed) * np.exp(-t * 18)
    else: t = tt(0.09); x = noise(0.09, 1200, 6000, seed) * np.exp(-t * 140) + 0.7 * np.sin(2 * np.pi * 420 * t) * np.exp(-t * 90)      # a switch, a click, a button
    if pitch != 1.0: n2 = max(8, int(len(x) / pitch)); x = np.interp(np.arange(n2) * pitch, np.arange(len(x)), x)      # played faster = shorter and higher, like the samples
    return fades(st(x / np.max(np.abs(x))), 0.001, min(0.05, len(x) / SR / 3))
def sample(f, pitch=1.0, n=None):
    if os.path.exists(f): return load(f, pitch)
    SUBN.add(n); return stand_in(f, pitch)
CACHE = {}
def src(n):          # samples, true peak, first-sound sample, loudest sample
    if n not in CACHE:
        if n in SYN: a = SYN[n]
        else: v = SRC[n]; a = sample(v[0], v[1], n) if isinstance(v, tuple) else sample(v, 1.0, n)
        m = np.abs(a).max(axis=1); hop = 240; e = np.sqrt(np.add.reduceat(m * m, np.arange(0, len(m), hop)) / hop); mx = e.max()
        CACHE[n] = (a, float(m.max()), max(0, int(np.argmax(e > mx * 0.1)) * hop - hop), int(np.argmax(e)) * hop)
    return CACHE[n]
N = int((END + 1) * SR); FX = np.zeros((N, 2)); NEV = 0; MOM = []
def put(n, at, tgt, keep=None, usepeak=0):      # name, film time, target peak dBFS, keep seconds (None = whole file), 1 = put the file's loudest point on the time (else its first sound)
    global NEV; a, pk, first, loud = src(n); seg = a[first:first + int(keep * SR)] if keep else a[first:]
    if keep: fo = min(int(0.1 * SR), len(seg) // 2); seg = seg.copy(); seg[len(seg) - fo:] *= np.linspace(1, 0, fo)[:, None]
    i = int(round(max(0.0, at - ((loud - first) / SR if usepeak else 0)) * SR)); k = min(len(seg), len(FX) - i)
    if k > 0: FX[i:i + k] += seg[:k] * (10 ** ((tgt - (2.5 if n in SUBN else 0)) / 20) / pk); NEV += 1
def add(label, t, items):
    MOM.append((label, t))
    for it in items: put(*it)

# ---- voice first: the take UNCUT. Per-phrase gains (dB) only where the take itself is uneven; each change sits in a real gap of the take.
LEVEL = [(0, 1.0), (3.60, 2.5), (5.10, 1.0), (7.35, 1.5), (8.40, 0.0), (10.45, 1.5)]
if os.environ.get('LEVEL0'): LEVEL = [(0, 0.0)]
r = run(['ffmpeg', '-v', 'error', '-y', '-i', VOICE, '-af', f'{FMT},acompressor=threshold=0.07:ratio=2.5:attack=3:release=60', '-c:a', 'pcm_f32le', f'{TMP}/vo_c.wav']); assert r.returncode == 0, r.stderr[-300:]
vc = load(f'{TMP}/vo_c.wav'); tv = np.arange(len(vc)) / SR; gdb = np.zeros(len(vc)); RAMP = 0.03
for (ta, ga), (tb_, gb_) in zip(LEVEL, LEVEL[1:]): gdb += (gb_ - ga) * np.clip((tv - tb_ + RAMP / 2) / RAMP, 0, 1)
gdb += LEVEL[0][1]; vc = vc * (10 ** (gdb / 20))[:, None]
vo = np.zeros((int(END * SR), 2)); i0 = int(T0 * SR); k = min(len(vc), len(vo) - i0); vo[i0:i0 + k] = vc[:k]; wav(f'{TMP}/vo.wav', vo)
gv = -3 - 20 * math.log10(float(np.abs(vo).max()))

VH = 240; _vm = np.abs(vo).max(axis=1) * 10 ** (gv / 20); _nb = len(_vm) // VH; VENV = 20 * np.log10(np.maximum(np.sqrt((_vm[:_nb * VH].reshape(_nb, VH) ** 2).mean(axis=1)), 1e-6))
def spoken(t, w=0.03): i = int(t * SR / VH); return bool(np.any(VENV[max(0, i - int(w * SR / VH)):i + int(w * SR / VH) + 1] > -30))
def word_end(a, cap=0.3):      # the first 30 ms of silence after the word has begun, or the cap
    i0, n = int((a + 0.08) * SR / VH), int(0.03 * SR / VH)
    for i in range(i0, int((a + cap) * SR / VH)):
        if np.all(VENV[i:i + n] < -35): return i * VH / SR
    return a + cap
# ---- 1 the air of every camera move: its loudest point sits in the middle of the move, so the picture and the sound peak together
for a, z, kind, tag in MV:
    c = (a + z) / 2
    if tag == 'crash': add('crash in', c, [('fast', c, -11, None, 1), ('bass', z, -14, 0.5)])
    elif tag == 'name': add('whip to a name', c, [('fast', c, -13 if spoken(c) else -11, None, 1), ('whoosh', c, -17, 0.5, 1)])      # a whip under a spoken word gives way to it
    elif tag == 'name2': put('swish', c, -15, None, 1)
    elif tag == 'look': put('swishH', c, -17, None, 1)
    elif tag == 'flag': put('swishL', c, -15, None, 1)
    elif tag == 'out': add('pull back', c, [('swish', c, -17, None, 1), ('whoosh', c, -15, 0.6, 1)])
    elif tag == 'wave': put('swish', c, -17, None, 1)
    elif tag == 'cross': add('across the seam', c, [('fastL', c, -9, None, 1), ('whoosh', c, -14, 0.6, 1)]); add('landing', z, [('bass', z, -15, 0.6)])
    elif tag == 'panel': add('pull back, boarding', c, [('whoosh', c, -14, 0.6, 1), ('fastL', c, -15, None, 1)])      # under the tail of "Code": the hit comes after the word
    elif tag == 'seam': add('whip to the seam', c, [('fast', c, -11, None, 1), ('whoosh', c, -17, 0.5, 1)])
    elif tag == 'gap': tx = a + 0.30; add('through the gap', tx, [('fastL', tx, -8, None, 1), ('whoosh', tx, -11, 0.7, 1), ('bass', tx + 0.02, -15, 0.5)])      # the air peaks as the lens passes the edges
    elif tag == 'machine': put('swish', c, -15, None, 1)
    elif tag == 'ticket': put('swishH', c, -17, None, 1)
    elif tag == 'punch': put('swishH', c, -17, None, 1)
    elif tag == 'strip': put('swish', c, -16, None, 1)
    elif tag == 'end': add('end card', z, [('whoosh', c, -13, 0.6, 1), ('bass', z, -13, 0.8), ('chord', z + 0.02, -13)])
# ---- 2 the station's call under the first word, low
add('chime', 0.02, [('chime', 0.02, -15)])
# ---- 3 every word that lands on the board: one clack just BEFORE it (never on the word: it would mask it)
flags = EV['flags']; prev = -9; nstrip = 0
for t, n in LANDS:
    if n == 0 or any(abs(t - f) < 0.02 for f in flags) or t - prev < 0.05: continue
    prev = t
    if t > EV['ticket'] + 0.3: add(f'strip word {nstrip + 1}', t - 0.06, [(f'sw{min(nstrip, 4)}', t - 0.06, -15, 0.25), ('click', t, -19)]); nstrip += 1
    elif abs(t - EV['boarding']) < 0.05: pass      # NOW BOARDING has its own sound below
    else: add(f'lands {t:.2f}', t - 0.06, [('switch', t - 0.06, -12 if n >= 4 else -13.5, 0.2), ('click', t, -18)])
# ---- 4 the three red flags: the clack, then a short falling tone
for i, t in enumerate(flags): add(f'CANCELLED {i + 1}', t - 0.06, [('switchL', t - 0.06, -12, 0.18), ('pdown', t + 0.02, -16)])
# ---- 5 NOW BOARDING: the two notes, the lamps powering up, the hit as the camera lands wide
panel = next(m for m in MV if m[3] == 'panel'); tb0 = EV['boarding']
add('boarding notes', tb0, [('blip', tb0, -13), ('pup', tb0 - 0.1, -15)])
add('lamps up', panel[1], [('boomph', panel[1] - 0.03, -11, 0.6), ('bass', panel[1] - 0.03, -13, 0.6)] + [('clickH', panel[1] + 0.04 + i * 0.045, -18 - i * 0.6) for i in range(6)])
# ---- 6 the gap: the latch lets go, then (air in section 1) the banks clap shut behind the lens
tg = EV['gap']; to = EV['open']; add('latch', to, [('switchL', to, -12.5, 0.18), ('swishL', to + 0.09, -19, None, 1)]);      # the banks let go and swing during the hold on the seam
add('banks shut', tg + 0.46, [('imp7', tg + 0.46, -14, 0.35), ('bass', tg + 0.46, -15, 0.5), ('clickL', tg + 0.46, -12), ('switch', tg + 0.46, -12, 0.2)])      # the clack carries it on a phone, where the low hit is gone
# ---- 7 the ticket: paper out of the slot, into its stop; the punch after the last word
tk = EV['ticket']; add('ticket out', tk, [('paper', tk + 0.05, -9, 0.24, 1)]); add('ticket stop', tk + 0.11, [('clickL', tk + 0.11, -15), ('press', tk + 0.11, -18, 0.2)])
if EV.get('pinned'): tq = EV['pinned']; add('second line lands', tq - 0.06, [('switch', tq - 0.06, -11, 0.2), ('click', tq + 0.09, -16), ('chime', tq + 0.22, -15)])      # second ending: the strip's second line, and the station's two notes again
tp = EV['punch']; add('punch', tp, [('switch', tp, -11, 0.2), ('clickL', tp, -13), ('bass', tp, -19, 0.3)])

# ---- 8 the flap clatter: one tick per falling flap (thinned where a whole row runs at once), dropped hard wherever the voice is speaking
rng = np.random.default_rng(11); ticks = []
for f, p in TICKS:
    a = sample(f, p); m = np.abs(a).max(axis=1); j = max(0, int(np.argmax(m > m.max() * 0.1)) - 48); a = a[j:j + int(0.09 * SR)]; ticks.append(fades(a / np.abs(a).max(), 0.0005, 0.03))
ev = []
for a, b, n in RAT:
    for c in range(int(n)):
        t = max(0.0, a) + rng.uniform(0, 0.09)
        while t < b - 0.015: ev.append(t); t += 0.088 * rng.uniform(0.88, 1.12)
ev.sort(); CL = np.zeros((N, 2)); last = -1; nt = 0
for t in ev:
    if t - last < rng.uniform(0.016, 0.03): continue      # never more than about 45 ticks a second: past that it turns into hiss
    last = t; x = ticks[int(rng.integers(len(ticks)))]; g = 10 ** (rng.uniform(-6, 0) / 20); pan = rng.uniform(-0.35, 0.35); i = int(t * SR); k = min(len(x), N - i)
    if k > 0: CL[i:i + k, 0] += x[:k, 0] * g * (1 - max(0, pan)); CL[i:i + k, 1] += x[:k, 1] * g * (1 + min(0, pan)); nt += 1
hop = 240; vm = np.abs(vo).max(axis=1) * 10 ** (gv / 20); nb = len(vm) // hop; env = np.sqrt((vm[:nb * hop].reshape(nb, hop) ** 2).mean(axis=1))
W = 16; pad = np.concatenate([np.zeros(4), env, np.zeros(W)]); env = np.max(np.stack([pad[i:i + nb] for i in range(W + 4)]), axis=0)      # holds 80 ms after a word and opens 20 ms before the next
edb = 20 * np.log10(np.maximum(env, 1e-6)); dk = -DUCK * np.clip((edb + 40) / 10, 0, 1); dk = np.convolve(dk, np.ones(5) / 5, mode='same')
gcl = np.ones(N); g_s = np.interp(np.arange(nb * hop), (np.arange(nb) + 0.5) * hop, 10 ** (dk / 20)); gcl[:len(g_s)] = g_s
CL *= gcl[:, None]; pkc = float(np.abs(CL).max()); CL *= 10 ** (CLG / 20) / pkc; FX += CL
wav(f'{TMP}/sfx.wav', FX[:int(END * SR)]); wav(f'{TMP}/clatter.wav', CL[:int(END * SR)])
json.dump({'fxg': FXG, 'moments': MOM}, open(f'{TMP}/moments.json', 'w'))

# ---- the music bed, ducked under the voice; then the master at -14 LUFS
r = run(['ffmpeg', '-v', 'error', '-y', '-ss', os.environ.get('BED_START', '30'), '-t', str(END), '-i', BED, '-af', f'{FMT},afade=t=in:d=0.15,afade=t=out:st={END - 0.7}:d=0.7,apad=whole_dur={END},atrim=0:{END}', '-c:a', 'pcm_f32le', f'{TMP}/bed.wav']); assert r.returncode == 0, r.stderr[-300:]
gb = -12 - peakdb(f'{TMP}/bed.wav')
F32 = ['-c:a', 'pcm_f32le']
run(['ffmpeg', '-v', 'error', '-y', '-i', f'{TMP}/bed.wav', '-af', f'volume={gb:.2f}dB'] + F32 + [f'{TMP}/bedg.wav'])
run(['ffmpeg', '-v', 'error', '-y', '-i', f'{TMP}/vo.wav', '-af', f'volume={gv:.2f}dB'] + F32 + [f'{TMP}/vog.wav'])
def f32(f): raw = run(['ffmpeg', '-v', 'quiet', '-i', f, '-ac', '2', '-ar', '48000', '-f', 'f32le', '-'], True).stdout; a = array.array('f'); a.frombytes(raw[:len(raw) // 8 * 8]); return a
def duck(bed, key, thr=0.05, ratio=5.0, att=15.0, rel=250.0, knee=2.82843, sr=48000):      # = sidechaincompress=threshold=0.05:ratio=5:attack=15:release=250
    log, exp = math.log, math.exp
    thres = log(thr); ks, kp = log(thr / math.sqrt(knee)), log(thr * math.sqrt(knee)); adj = (thr / math.sqrt(knee)) ** 2; ckp = (kp - thres) / ratio + thres
    ac, rc = min(1.0, 1 / (att * sr / 4000)), min(1.0, 1 / (rel * sr / 4000)); lin = 0.0; n = min(len(bed), len(key)) // 2; out = array.array('f', bytes(8 * n))
    w = kp - ks; m0, m1 = w, w / ratio; c2 = -3 * ks - 2 * m0 + 3 * ckp - m1; c3 = 2 * ks + m0 - 2 * ckp + m1
    for i in range(n):
        a = (abs(key[2 * i]) + abs(key[2 * i + 1])) * 0.5; a *= a
        lin += (a - lin) * (ac if a > lin else rc); g = 1.0
        if lin > adj:
            sl = 0.5 * log(lin)
            if sl < kp: t = (sl - ks) / w; gain = ((c3 * t + c2) * t + m0) * t + ks
            else: gain = (sl - thres) / ratio + thres
            g = exp(gain - sl)
        out[2 * i] = bed[2 * i] * g; out[2 * i + 1] = bed[2 * i + 1] * g
    return out
dkd = duck(f32(f'{TMP}/bedg.wav'), f32(f'{TMP}/vog.wav'))
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-f', 'f32le', '-ar', '48000', '-ac', '2', '-i', '-'] + F32 + [f'{TMP}/dk.wav'], input=dkd.tobytes(), timeout=180)
run(['ffmpeg', '-v', 'error', '-y', '-i', f'{TMP}/dk.wav', '-i', f'{TMP}/sfx.wav', '-filter_complex', f'[1:a]volume={FXG}dB[fx];[0:a][fx]amix=inputs=2:normalize=0[me]', '-map', '[me]'] + F32 + [f'{TMP}/me.wav'])
run(['ffmpeg', '-v', 'error', '-y', '-i', f'{TMP}/me.wav', '-i', f'{TMP}/vog.wav', '-filter_complex', '[0:a][1:a]amix=inputs=2:normalize=0[a]', '-map', '[a]'] + F32 + [f'{TMP}/pre.wav'])
lufs = float(re.findall(r'I:\s+([-\d.]+) LUFS', run(['ffmpeg', '-hide_banner', '-nostats', '-i', f'{TMP}/pre.wav', '-af', 'ebur128', '-f', 'null', '-']).stderr)[-1]); gm = -14 - lufs
os.makedirs('out', exist_ok=True)
r = run(['ffmpeg', '-v', 'error', '-y', '-i', f'{TMP}/pre.wav', '-af', f'volume={gm:.2f}dB,alimiter=limit=0.89:attack=2:release=40:level=disabled', WAV]); assert r.returncode == 0, r.stderr[-300:]
if MISSING: print('sample files not found, synthesized stand-ins used for:', ', '.join(sorted(set(MISSING))))
print(f'{NEV} effect events + {nt} flap ticks (of {len(ev)} flips) | voice peak -> -3, bed -> -12, pre-master {lufs:.1f} LUFS, gain {gm:+.1f} dB -> {WAV}')
# ---- check: on every word the voice must sit above the music + effects under it
vo16 = pcm(f'{TMP}/vog.wav'); me16 = pcm(f'{TMP}/me.wav')
def pk(s, a, b): seg = s[int(a * 16000):int(b * 16000)]; return 20 * math.log10(max(1, max(abs(v) for v in seg)) / 32768)
print(f"{'word':10s} {'t':>5s}  voice pk   music+fx pk   voice above")
bad = 0; keys = [k for k in V if k != 'end']
for i, k in enumerate(keys):
    a = F(k); b = min(word_end(a), F(keys[i + 1]) if i + 1 < len(keys) and F(keys[i + 1]) > a + 0.08 else a + 0.3)      # for as long as the word really lasts
    vp, mp = pk(vo16, a, b), pk(me16, a, b); flag = '   <-- voice not on top' if vp - mp < 1.5 else ''; bad += bool(flag)
    print(f'{k:10s} {a:5.2f}  {vp:6.1f}      {mp:6.1f}        {vp - mp:+5.1f}{flag}')
out = run(['ffmpeg', '-hide_banner', '-nostats', '-i', WAV, '-af', 'ebur128=peak=true', '-f', 'null', '-']).stderr
print(re.findall(r'I:\s+[-\d.]+ LUFS', out)[-1], '|', re.findall(r'Peak:\s+[-\d.]+ dBFS', out)[-1], '| words with the voice not on top:', bad)
if VID:
    r = run(['ffmpeg', '-v', 'error', '-y', '-i', VID, '-i', WAV, '-map', '0:v', '-map', '1:a', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '256k', '-t', str(END), '-movflags', '+faststart', OUT]); print('mux', r.returncode, r.stderr[-300:], '->', OUT)
