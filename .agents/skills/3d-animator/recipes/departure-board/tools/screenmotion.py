# On-screen motion per frame: how far the picture moves between consecutive frames, as seen (not the camera's angle).
# Phase correlation on the whole frame and on its four quarters (so zooms and rolls count too); result in % of frame width per frame.
import sys, subprocess, numpy as np
W, H = 320, 180
def frames(path):
    raw = subprocess.run(['ffmpeg', '-v', 'quiet', '-i', path, '-vf', f'fps=30,scale={W}:{H},format=gray', '-f', 'rawvideo', '-'], capture_output=True).stdout
    n = len(raw) // (W * H); return np.frombuffer(raw[:n * W * H], dtype=np.uint8).reshape(n, H, W).astype(np.float32)
def shift(a, b):
    h, w = a.shape; win = np.outer(np.hanning(h), np.hanning(w))
    A = np.fft.rfft2((a - a.mean()) * win); B = np.fft.rfft2((b - b.mean()) * win); R = A * np.conj(B); R /= np.abs(R) + 1e-6
    c = np.fft.irfft2(R, s=(h, w)); i = np.unravel_index(np.argmax(c), c.shape); dy = i[0] if i[0] < h / 2 else i[0] - h; dx = i[1] if i[1] < w / 2 else i[1] - w
    return dx, dy, c.max()
def analyse(path):
    F = frames(path); out = []
    for k in range(1, len(F)):
        a, b = F[k - 1], F[k]; parts = [(a, b)] + [(a[y:y + H // 2, x:x + W // 2], b[y:y + H // 2, x:x + W // 2]) for y in (0, H // 2) for x in (0, W // 2)]
        s = [shift(p, q) for p, q in parts]; mag = [np.hypot(dx, dy) for dx, dy, _ in s]
        mad = float(np.abs(b - a).mean() / (0.5 * (a.mean() + b.mean()) + 4))
        out.append((max(mag[0], float(np.median(mag[1:]))) / W * 100, mad))
    return np.array(out)
for name, path in [a.split('=', 1) for a in sys.argv[1:]]:
    M = analyse(path); sp, mad = M[:, 0], M[:, 1]; n = len(sp); dur = (n + 1) / 30
    fast = sp > 4.0      # the picture moves more than 4 % of the frame width in one frame (= 1.2 frame widths per second)
    bursts = []; cur = None
    for i, f in enumerate(fast):
        if f: cur = [i, i] if cur is None else [cur[0], i]
        elif cur is not None and i - cur[1] > 1: bursts.append(cur); cur = None
    if cur: bursts.append(cur)
    big = mad > 0.35     # most of the picture changes in one frame (a whip smear, a flash, a cut)
    print(f"\n=== {name} ({dur:.1f} s)")
    print(f" picture speed, % of frame width per frame: median {np.median(sp):.1f}, p75 {np.percentile(sp, 75):.1f}, p90 {np.percentile(sp, 90):.1f}, max {sp.max():.0f}")
    print(f" frames moving faster than 4 %/frame: {fast.mean() * 100:.0f} % of the film; fast bursts: {len(bursts)} = {len(bursts) / dur:.1f} per second")
    print(f" frame-to-frame change (0 = same picture): median {np.median(mad):.2f}, p90 {np.percentile(mad, 90):.2f}; frames where most of the picture changes: {big.sum()} = {big.sum() / dur:.1f} per second")
    print(' bursts at (s):', ' '.join(f"{b[0] / 30:.2f}" + (f"-{b[1] / 30:.2f}" if b[1] > b[0] else '') for b in bursts))
    if '--frames' in sys.argv[0:1] or name.endswith('*'): print(' per frame:', ' '.join(f"{i / 30:.2f}:{v:.0f}" for i, v in enumerate(sp)))
