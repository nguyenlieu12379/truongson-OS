# Soundtrack for the FLIGHT DECK film: the Liam take UNCUT, bed 623, air on every camera move (its loudest point in the middle of the move),
# a switch and a power-down on each "Off", the guard, the master switch and the power-up on "On", a tick for every word that lights,
# and each gauge's own sound: the gyro whirr on the tilt, the needle unwinding on the dive, the spin.
# Times come from the picture itself: out/flight_kf.json (node tools/moves.mjs flight) = every camera move and every word's frame.
# usage: python3.14 -I tools/mix_film.py <tmp dir> [<silent video.mp4> <out.mp4>]     (run from the project folder; needs numpy)
# The effects stem is summed here in numpy, so two runs give the same file. Also writes <tmp>/moments.json for tools/ref/phone_check.py.
import sys, os, subprocess, re, math, json, array, struct
import numpy as np
TMP = sys.argv[1]; VID, OUT = (sys.argv[2], sys.argv[3]) if len(sys.argv) > 3 else (None, None)
os.makedirs(TMP, exist_ok=True)
tl = open('src/shots/tlf.js').read()
T0 = float(re.search(r'export const T0 = ([\d.]+)', tl).group(1)); END = float(re.search(r'export const END = ([\d.]+)', tl).group(1))
V = {k: float(v) for k, v in re.findall(r'(\w+): ([\d.]+)', tl[tl.index('export const V'):tl.index('export const F')])}
KF = json.load(open('out/flight_kf.json')); MV = KF['moves']; WD = KF['words']; ON = KF['on']
WAV = os.environ.get('WAV', 'out/mix_film.wav'); VOICE = os.environ.get('VOICE', 'sound/voice.mp3')
F = lambda k: T0 + V[k]
S = os.path.expanduser(os.environ.get('SFX_DIR', '~/Music/SFX')); R = f'{S}/REEL KIT'; U = f'{S}/UI KIT'      # SFX_DIR = your SFX folder; RECIPE.md lists the files it expects
# name: file, or (file, pitch) for a copy played slower (deeper) or faster
SRC = {'switch': f'{U}/03 CLICK/03-037 EEnE Switch Flip.wav', 'switchL': (f'{U}/03 CLICK/03-037 EEnE Switch Flip.wav', 0.8), 'click': f'{U}/03 CLICK/03-001 Click2.wav', 'clickL': (f'{U}/03 CLICK/03-001 Click2.wav', 0.7),
       'clickH': (f'{U}/03 CLICK/03-001 Click2.wav', 1.7), 'press': f'{U}/03 CLICK/03-031 EEnE Computer - Button Press.wav',
       'bass': f'{R}/02 IMPACT/02-08 Short Bass Hit.wav', 'imp7': f'{R}/02 IMPACT/02-14 EEnE Impact 7.wav', 'imp7H': (f'{R}/02 IMPACT/02-14 EEnE Impact 7.wav', 1.2), 'boomph': (f'{R}/02 IMPACT/02-11 EEnE Impact 12 boomph.wav', 0.9),
       'swish': f'{R}/01 WHOOSH/01-08 whoosh_swish_small_01.wav', 'swishH': (f'{R}/01 WHOOSH/01-08 whoosh_swish_small_01.wav', 1.25), 'swishL': (f'{R}/01 WHOOSH/01-08 whoosh_swish_small_01.wav', 0.85),
       'fast': f'{R}/01 WHOOSH/01-01 whoosh_swish_high_fast_01.wav', 'fastL': (f'{R}/01 WHOOSH/01-01 whoosh_swish_high_fast_01.wav', 0.78), 'fastH': (f'{R}/01 WHOOSH/01-01 whoosh_swish_high_fast_01.wav', 1.1),
       'whoosh': f'{R}/01 WHOOSH/01-10 Whoosh Light Short.wav'}
for i in range(5): SRC[f'sw{i}'] = (SRC['switch'], 0.92 + 0.045 * i)      # the five lamps of the skill row: one switch each, a touch higher every time
FXG = float(os.environ.get('FXG', -2.5)); SR = 48000      # effects stem trim, dB
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
def noise(d, lo, hi, seed, tilt=1.0):      # band noise with a fixed seed (1/f^tilt inside the band)
    n = int(d * SR); sp = np.fft.rfft(np.random.default_rng(seed).standard_normal(n)); fq = np.fft.rfftfreq(n, 1 / SR); m = (fq >= lo) & (fq <= hi); sp[~m] = 0; sp[m] /= np.maximum(fq[m], 1) ** (tilt / 2); x = np.fft.irfft(sp, n); return x / np.max(np.abs(x))
def sweep(f0, f1, d, k=1.0):      # a tone gliding from f0 to f1 (exponential), with two harmonics so a phone speaker still plays it
    t = tt(d); ph = 2 * np.pi * f0 * d / np.log(f1 / f0) * ((f1 / f0) ** (t / d) - 1); return np.sin(ph) + 0.45 * k * np.sin(2 * ph) + 0.25 * k * np.sin(3 * ph)
def bell(f, d=0.75): t = tt(d); return fades(st(0.5 * np.sin(2 * np.pi * f * t) * np.exp(-t * 6.5) + 0.26 * np.sin(2 * np.pi * f * 2.76 * t) * np.exp(-t * 10) + 0.13 * np.sin(2 * np.pi * f * 5.4 * t) * np.exp(-t * 16)))
A4, E5, A5, E6, A6 = 440, 659.3, 880, 1318.5, 1760      # the bed sits on A with a strong E: every tone made here is an A or an E
SYN = {}
SYN['pdown'] = fades(st(sweep(660, 165, 0.30) * np.exp(-tt(0.30) * 7)), 0.004, 0.06)                                   # a system losing power: a short falling tone
SYN['pup'] = fades(st(sweep(110, 880, 0.55) * np.minimum(1, tt(0.55) * 9) * (0.35 + 0.65 * tt(0.55) / 0.55) + 0.25 * noise(0.55, 900, 5000, 3, 0.4) * (tt(0.55) / 0.55) ** 2), 0.01, 0.05)   # the panel powering up
t9 = tt(0.9); SYN['gyro'] = fades(st(0.5 * np.sin(2 * np.pi * (170 * t9 + 260 * t9 * t9 - 190 * t9 ** 3)) * (1 + 0.35 * np.sin(2 * np.pi * 47 * t9)) * np.minimum(1, t9 * 14) * np.exp(-t9 * 3.2) + (0.45 * np.sin(2 * np.pi * 3 * (170 * t9 + 260 * t9 * t9 - 190 * t9 ** 3)) + 0.3 * np.sin(2 * np.pi * 5 * (170 * t9 + 260 * t9 * t9 - 190 * t9 ** 3))) * np.minimum(1, t9 * 14) * np.exp(-t9 * 4)), 0.004, 0.2)   # the horizon's gyro winding
ts = tt(0.62); us = ts / 0.62; SYN['spinw'] = fades(st(noise(0.62, 500, 4200, 5, 0.6) * (0.55 + 0.45 * np.sin(2 * np.pi * (6 * ts + 22 * ts * ts * (1 - 0.8 * us)))) * np.sin(np.pi * np.minimum(1, us * 1.05)) ** 1.5 + 0.35 * np.sin(2 * np.pi * (A4 * ts + 500 * ts * ts * (1 - us))) * np.sin(np.pi * us) ** 2), 0.02, 0.1)   # the spin: air going round once
tb = tt(0.22); SYN['blip'] = fades(st(np.where(tb < 0.06, np.sin(2 * np.pi * E6 * tb), np.sin(2 * np.pi * A6 * tb) * np.exp(-(tb - 0.06) * 24)) * 0.7 + np.where(tb < 0.06, 0, 0.2 * np.sin(2 * np.pi * A6 * 2 * tb) * np.exp(-(tb - 0.06) * 30))), 0.002, 0.05)   # the display taking a word: two notes, E then A
SYN['chord'] = fades(bell(A5, 1.1) + bell(E6, 1.1) * 0.8 + bell(A6, 1.1) * 0.45)
CACHE = {}
def src(n):          # samples, true peak, first-sound sample, loudest sample
    if n not in CACHE:
        if n in SYN: a = SYN[n]
        else: v = SRC[n]; a = load(*v) if isinstance(v, tuple) else load(v)
        m = np.abs(a).max(axis=1); hop = 240; e = np.sqrt(np.add.reduceat(m * m, np.arange(0, len(m), hop)) / hop); mx = e.max()
        CACHE[n] = (a, float(m.max()), max(0, int(np.argmax(e > mx * 0.1)) * hop - hop), int(np.argmax(e)) * hop)
    return CACHE[n]
FX = np.zeros((int((END + 1) * SR), 2)); NEV = 0; MOM = []
def put(n, at, tgt, keep=None, usepeak=0):      # name, film time, target peak dBFS, keep seconds (None = whole file), 1 = put the file's loudest point on the time (else its first sound)
    global NEV; a, pk, first, loud = src(n); seg = a[first:first + int(keep * SR)] if keep else a[first:]
    if keep: fo = min(int(0.1 * SR), len(seg) // 2); seg = seg.copy(); seg[len(seg) - fo:] *= np.linspace(1, 0, fo)[:, None]
    i = int(round(max(0.0, at - ((loud - first) / SR if usepeak else 0)) * SR)); k = min(len(seg), len(FX) - i)
    if k > 0: FX[i:i + k] += seg[:k] * (10 ** (tgt / 20) / pk); NEV += 1
def add(label, t, items):
    MOM.append((label, t))
    for it in items: put(*it)

# ---- 1 the air of every camera move: its loudest point sits in the middle of the move, so the picture and the sound peak together
nsys = 0
for a, z, kind, tag in MV:
    c = (a + z) / 2
    if tag == 'crash': add('crash in', c, [('fast', c, -11, None, 1), ('bass', z, -14, 0.5)])
    elif tag == 'name': add('whip to a name', c, [('fast', c, -11, None, 1), ('whoosh', c, -17, 0.5, 1)])
    elif tag == 'name2': put('swish', c, -15, None, 1)
    elif tag == 'look': put('swishH', c, -17, None, 1)
    elif tag == 'off': put('swishL', c, -15, None, 1)
    elif tag == 'out': put('swish', c, -19, None, 1)
    elif tag == 'on': put('swishL', c, -15, None, 1)
    elif tag == 'panel': add('pull back', c, [('whoosh', c, -11, 0.6, 1), ('fastL', c, -13, None, 1)])
    elif tag == 'one': add('crash in ONE', c, [('fast', c, -11, None, 1), ('bass', z, -15, 0.4)])
    elif tag == 'row': put('swish', c, -17, None, 1)
    elif tag == 'line': put('swishL', c, -17, None, 1)
    elif tag == 'horizon': add('swing to horizon', c, [('fastL', c, -9, None, 1), ('whoosh', c, -14, 0.6, 1)]); add('landing', z, [('imp7', z, -13.5, 0.4), ('bass', z, -14, 0.7)])
    elif tag == 'tilt': add('tilt', a, [('gyro', a, -16), ('swish', c, -18, None, 1)])
    elif tag == 'alt': add('to altimeter', c, [('swishH', c, -14, None, 1), ('clickL', z, -14)])
    elif tag == 'dive': add('dive', c, [('fastH', c, -12, None, 1), ('imp7H', z, -16, 0.3)] + [('clickH', a + i * 0.028, -18 - i * 0.7) for i in range(8)])      # the needle unwinding
    elif tag == 'gyro': add('to gyro', c, [('swish', c, -14, None, 1), ('clickL', z, -14)])
    elif tag == 'spin': add('spin', a + 0.2, [('spinw', a - 0.04, -11), ('whoosh', c, -16, 0.6, 1)]); add('spin lands', z, [('clickL', z, -13), ('bass', z, -17, 0.4)])
    elif tag == 'comment': add('whip to COMMENT', c, [('fast', c, -11, None, 1), ('whoosh', c, -17, 0.5, 1)])
    elif tag == 'fly': put('swish', c, -17, None, 1)
    elif tag == 'punch': put('swishH', c, -17, None, 1)
    elif tag == 'send': put('swish', c, -15, None, 1)
    elif tag == 'skill': put('swishH', c, -17, None, 1)
    elif tag == 'end': add('end card', z, [('whoosh', c, -13, 0.6, 1), ('bass', z, -13, 0.8), ('chord', z + 0.02, -13)])
# ---- 2 the three systems: each name's lamp, then the switch just BEFORE "Off" (never on the word: it would mask it) and the power-down under it
for k in ('blender', 'after', 'effects', 'cinema', 'fourd', 'claude', 'code'): put('press', WD[k], -16, 0.2); put('click', WD[k], -17)
for i, k in enumerate(('off1', 'off2', 'off3')):
    t = WD[k]; add(f'OFF {i + 1}', t - 0.06, [('switch', t - 0.06, -11, 0.16), ('pdown', t + 0.02, -15)])
# ---- 3 the master switch: the guard, the switch, the power-up (the hit lands with the pull-back, after the word)
add('guard', ON - 0.17, [('clickL', ON - 0.17, -12)]); add('master switch', ON - 0.07, [('switchL', ON - 0.07, -9, 0.2)])
add('power up', ON + 0.2, [('pup', ON + 0.0, -14)])
panel = next(m for m in MV if m[3] == 'panel')
add('panel on', panel[1], [('boomph', panel[1] - 0.03, -10, 0.9), ('bass', panel[1] - 0.03, -12, 0.8)] + [('clickH', panel[0] + i * 0.04, -17 - i * 0.5) for i in range(9)])      # relays all over the panel
# ---- 4 the skill row: one switch per word, a touch higher each time
for i, k in enumerate(('one', 'skill', 'flies', 'the', 'camera')): add(k.upper(), WD[k], [(f'sw{i}', WD[k], -17 if i in (1, 2) else -14, 0.25), ('click', WD[k], -20 if i in (1, 2) else -17)])
# ---- 5 the gauges' words and the call to action
for k in ('tilts', 'dives', 'spins', 'comment', 'ill', 'you', 'theskill'): put('press', WD[k], -16, 0.2); put('click', WD[k], -18)
add('FLY display', WD['fly'] - 0.07, [('blip', WD['fly'] - 0.07, -14), ('bass', WD['fly'], -19, 0.5)])      # the two notes sit just before the word, like the switches
wav(f'{TMP}/sfx.wav', FX[:int(END * SR)])
json.dump({'fxg': FXG, 'moments': MOM}, open(f'{TMP}/moments.json', 'w'))

# ---- voice: the take UNCUT. Per-phrase gains (dB) only where the take itself is uneven; each change sits in a real gap of the take.
LEVEL = [(0, 2.0), (0.72, 0.5), (1.40, 1.0), (2.55, 0.5), (3.15, 0.0), (4.45, 0.5), (5.10, 0.0), (6.20, 1.0), (7.00, 0.0), (9.05, 2.0), (11.85, 0.0)]
if os.environ.get('LEVEL0'): LEVEL = [(0, 0.0)]
r = run(['ffmpeg', '-v', 'error', '-y', '-i', VOICE, '-af', f'{FMT},acompressor=threshold=0.07:ratio=2.5:attack=3:release=60', '-c:a', 'pcm_f32le', f'{TMP}/vo_c.wav']); assert r.returncode == 0, r.stderr[-300:]
vc = load(f'{TMP}/vo_c.wav'); tv = np.arange(len(vc)) / SR; gdb = np.zeros(len(vc)); RAMP = 0.03
for (ta, ga), (tb, gb) in zip(LEVEL, LEVEL[1:]): gdb += (gb - ga) * np.clip((tv - tb + RAMP / 2) / RAMP, 0, 1)
gdb += LEVEL[0][1]; vc = vc * (10 ** (gdb / 20))[:, None]
vo = np.zeros((int(END * SR), 2)); i0 = int(T0 * SR); k = min(len(vc), len(vo) - i0); vo[i0:i0 + k] = vc[:k]; wav(f'{TMP}/vo.wav', vo)
r = run(['ffmpeg', '-v', 'error', '-y', '-ss', os.environ.get('BED_START', '30'), '-t', str(END), '-i', os.environ.get('BED', 'sound/bed.mp3'), '-af', f'{FMT},afade=t=in:d=0.15,afade=t=out:st={END - 0.7}:d=0.7,apad=whole_dur={END},atrim=0:{END}', '-c:a', 'pcm_f32le', f'{TMP}/bed.wav']); assert r.returncode == 0, r.stderr[-300:]
gv, gb = -3 - peakdb(f'{TMP}/vo.wav'), -12 - peakdb(f'{TMP}/bed.wav')
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
dk = duck(f32(f'{TMP}/bedg.wav'), f32(f'{TMP}/vog.wav'))
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-f', 'f32le', '-ar', '48000', '-ac', '2', '-i', '-'] + F32 + [f'{TMP}/dk.wav'], input=dk.tobytes(), timeout=180)
run(['ffmpeg', '-v', 'error', '-y', '-i', f'{TMP}/dk.wav', '-i', f'{TMP}/sfx.wav', '-filter_complex', f'[1:a]volume={FXG}dB[fx];[0:a][fx]amix=inputs=2:normalize=0[me]', '-map', '[me]'] + F32 + [f'{TMP}/me.wav'])
run(['ffmpeg', '-v', 'error', '-y', '-i', f'{TMP}/me.wav', '-i', f'{TMP}/vog.wav', '-filter_complex', '[0:a][1:a]amix=inputs=2:normalize=0[a]', '-map', '[a]'] + F32 + [f'{TMP}/pre.wav'])
lufs = float(re.findall(r'I:\s+([-\d.]+) LUFS', run(['ffmpeg', '-hide_banner', '-nostats', '-i', f'{TMP}/pre.wav', '-af', 'ebur128', '-f', 'null', '-']).stderr)[-1]); gm = -14 - lufs
os.makedirs('out', exist_ok=True)
r = run(['ffmpeg', '-v', 'error', '-y', '-i', f'{TMP}/pre.wav', '-af', f'volume={gm:.2f}dB,alimiter=limit=0.89:attack=2:release=40:level=disabled', WAV]); assert r.returncode == 0, r.stderr[-300:]
print(f'{NEV} effect events | voice peak -> -3, bed -> -12, pre-master {lufs:.1f} LUFS, gain {gm:+.1f} dB -> {WAV}')
# ---- check: on every word the voice must sit above the music + effects under it
vo16 = pcm(f'{TMP}/vog.wav'); me16 = pcm(f'{TMP}/me.wav')
def pk(s, a, b): seg = s[int(a * 16000):int(b * 16000)]; return 20 * math.log10(max(1, max(abs(v) for v in seg)) / 32768)
print(f"{'word':10s} {'t':>5s}  voice pk   music+fx pk   voice above")
bad = 0; keys = [k for k in V if not k.endswith('End')]
for i, k in enumerate(keys):
    a = F(k); b = min(a + 0.3, F(keys[i + 1]) if i + 1 < len(keys) and F(keys[i + 1]) > a + 0.08 else a + 0.3)
    vp, mp = pk(vo16, a, b), pk(me16, a, b); flag = '   <-- voice not on top' if vp - mp < 1.5 else ''; bad += bool(flag)
    print(f'{k:10s} {a:5.2f}  {vp:6.1f}      {mp:6.1f}        {vp - mp:+5.1f}{flag}')
out = run(['ffmpeg', '-hide_banner', '-nostats', '-i', WAV, '-af', 'ebur128=peak=true', '-f', 'null', '-']).stderr
print(re.findall(r'I:\s+[-\d.]+ LUFS', out)[-1], '|', re.findall(r'Peak:\s+[-\d.]+ dBFS', out)[-1], '| words with the voice not on top:', bad)
if VID:
    r = run(['ffmpeg', '-v', 'error', '-y', '-i', VID, '-i', WAV, '-map', '0:v', '-map', '1:a', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '256k', '-t', str(END), '-movflags', '+faststart', OUT]); print('mux', r.returncode, r.stderr[-300:], '->', OUT)
