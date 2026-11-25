"""Sound effects and a lo-fi music bed, all synthesized (free, no samples, no licence questions).
Effects sit in the 1-8 kHz band so they survive phone speakers. Writes sound/sfx/*.wav and sound/music.wav.
usage: python gen_sfx.py
"""
import os
import numpy as np, soundfile as sf

SR = 48000
os.makedirs('sound/sfx', exist_ok=True)
rng = np.random.default_rng(7)   # fixed seed: same sounds every run

def t_(d): return np.arange(int(d * SR)) / SR
def band(x, lo, hi):
    X = np.fft.rfft(x); f = np.fft.rfftfreq(len(x), 1 / SR)
    X[(f < lo) | (f > hi)] = 0; return np.fft.irfft(X, len(x))
def env(d, a=0.002, decay=0.05):
    t = t_(d); return np.minimum(1, t / a) * np.exp(-t / decay)
def norm(x, peak=0.9): return x / (np.abs(x).max() + 1e-9) * peak
def save(name, x): sf.write(f'sound/sfx/{name}.wav', norm(x).astype(np.float32), SR)
def place(buf, x, at):
    i = int(at * SR); j = min(len(buf), i + len(x)); buf[i:j] += x[:j - i]

def click(d=0.03, lo=1800, hi=6500, decay=0.006):
    return band(rng.standard_normal(int(d * SR)), lo, hi) * env(d, 0.0005, decay)

# typing: one keystroke every 1/15 s with small variations, 5 s long (cues trim it)
typ = np.zeros(int(5 * SR))
for i in range(75):
    k = click(0.04, 1500 + 800 * rng.random(), 7000, 0.005 + 0.004 * rng.random()) * (0.6 + 0.4 * rng.random())
    thock = np.sin(2 * np.pi * (380 + 60 * rng.random()) * t_(0.03)) * env(0.03, 0.001, 0.008) * 0.35
    place(typ, k, i / 15 + 0.008 * rng.random()); place(typ, thock, i / 15)
save('typing', typ)

# pops: a short downward sine sweep with a click on top, three pitches
for n, f0 in [('pop1', 1100), ('pop2', 900), ('pop3', 1300)]:
    t = t_(0.12); f = f0 * np.exp(-t * 9) + 380
    x = np.sin(2 * np.pi * np.cumsum(f) / SR) * env(0.12, 0.002, 0.035) + 0.5 * np.pad(click(0.015), (0, int(0.105 * SR)))
    save(n, x)

# lamp switch: two sharp clicks
sw = np.zeros(int(0.15 * SR)); place(sw, click(0.03, 2000, 6000, 0.004), 0); place(sw, 0.7 * click(0.03, 2500, 7000, 0.004), 0.045); save('switch', sw)

# strike: a quick marker scratch
t = t_(0.22); s = band(rng.standard_normal(len(t)), 1200, 7000) * np.sin(np.pi * t / 0.22) ** 0.6 * (0.6 + 0.4 * np.sin(2 * np.pi * 38 * t)); save('scratch', s)

# floppy: slide in, latch, then the drive seeks
slide = band(rng.standard_normal(int(0.3 * SR)), 900, 5000) * np.sin(np.pi * t_(0.3) / 0.3) * 0.5; save('slide', slide)
latch = np.zeros(int(0.25 * SR)); place(latch, click(0.04, 800, 5000, 0.01), 0); place(latch, np.sin(2 * np.pi * 620 * t_(0.12)) * env(0.12, 0.001, 0.03) * 0.6, 0.0); place(latch, 0.8 * click(0.03, 1500, 6000, 0.006), 0.07); save('latch', latch)
seek = np.zeros(int(1.2 * SR))
for i in range(30): place(seek, click(0.02, 1200, 4000, 0.003) * (0.5 + 0.5 * rng.random()), i * 0.04 + 0.01 * rng.random())
seek += band(rng.standard_normal(len(seek)), 300, 2500) * 0.04 * np.sin(np.pi * t_(1.2) / 1.2); save('seek', seek)

# ding: a bright bell, and a two-note ending ding
def bell(f, d=0.9): t = t_(d); return (np.sin(2 * np.pi * f * t) + 0.45 * np.sin(2 * np.pi * 2 * f * t) + 0.2 * np.sin(2 * np.pi * 3.01 * f * t)) * env(d, 0.002, 0.22)
save('ding', bell(1320))
end = np.zeros(int(1.6 * SR)); place(end, bell(1047, 1.2), 0); place(end, bell(1568, 1.4), 0.12); save('ding_end', end)

# clock: a ratchet that speeds up then settles
rat = np.zeros(int(1.0 * SR)); tt = 0.0; i = 0
while tt < 0.85: place(rat, click(0.02, 2500, 8000, 0.003) * 0.8, tt); tt += 0.07 * (1 - 0.7 * np.sin(np.pi * min(1, tt / 0.85))); i += 1
place(rat, click(0.03, 1500, 6000, 0.008), 0.88); save('ratchet', rat)

# mug landing: a soft ceramic knock
k = np.sin(2 * np.pi * 520 * t_(0.15)) * env(0.15, 0.001, 0.03) + 0.4 * np.sin(2 * np.pi * 1830 * t_(0.15)) * env(0.15, 0.001, 0.02)
save('thunk', k + 0.3 * np.pad(click(0.02, 1000, 5000), (0, int(0.13 * SR))))

# whoosh with air in it (2-8 kHz), for camera moves
t = t_(0.6); wh = band(rng.standard_normal(len(t)), 1800, 8000) * np.sin(np.pi * t / 0.6) ** 2; save('whoosh', wh)

# screen blip when a new rule appears
t = t_(0.1); save('blip', np.sin(2 * np.pi * 1760 * t) * env(0.1, 0.002, 0.03) + 0.3 * np.sin(2 * np.pi * 2640 * t) * env(0.1, 0.002, 0.02))

# ---------- music bed: soft lo-fi keys at 84 BPM, kept above 150 Hz so phones play it ----------
L, BPM = 46.0, 84; beat = 60 / BPM; mus = np.zeros(int(L * SR))
def midi(n): return 440 * 2 ** ((n - 69) / 12)
CH = [[65, 69, 72, 76], [64, 67, 71, 74], [62, 65, 69, 72], [60, 64, 67, 71]]   # Fmaj7 Em7 Dm7 Cmaj7
bar = 4 * beat; nb = int(L / bar) + 1
for b in range(nb):
    for j, n in enumerate(CH[b % 4]):
        d = bar * 1.05; t = t_(d); f = midi(n)
        tone = (np.sin(2 * np.pi * f * t) + 0.25 * np.sin(2 * np.pi * 2 * f * t)) * (1 + 0.15 * np.sin(2 * np.pi * 4.5 * t))
        place(mus, tone * np.minimum(1, t / 0.02) * np.exp(-t / 1.6) * 0.12, b * bar + j * 0.012)
    bass = midi(CH[b % 4][0] - 12); t = t_(bar)
    place(mus, (np.sin(2 * np.pi * bass * t) + 0.5 * np.sin(2 * np.pi * 2 * bass * t)) * np.exp(-t / 0.9) * 0.10, b * bar)
for i in range(int(L / (beat / 2))):
    at = i * beat / 2 + (0.02 if i % 2 else 0)   # a little swing
    place(mus, band(rng.standard_normal(int(0.04 * SR)), 6000, 11000) * env(0.04, 0.001, 0.012) * (0.10 if i % 2 else 0.06), at)
    if i % 4 == 2: place(mus, click(0.05, 1200, 4000, 0.02) * 0.18, at)                        # rim on 2 and 4
    if i % 4 == 0: place(mus, np.sin(2 * np.pi * (160 * np.exp(-t_(0.12) * 18) + 55) * t_(0.12)) * env(0.12, 0.002, 0.05) * 0.35, at)   # soft kick
mus *= np.minimum(1, t_(L) / 1.5)
sf.write('sound/music.wav', norm(mus, 0.7).astype(np.float32), SR)
print('sfx ->', sorted(os.listdir('sound/sfx')), '| music -> sound/music.wav')
