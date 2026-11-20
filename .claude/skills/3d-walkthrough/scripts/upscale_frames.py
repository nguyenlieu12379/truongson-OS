"""AI upscale a folder of frames with Real-ESRGAN realesr-general-x4v3 (BSD-3), optionally blended
with a plain Lanczos resize. Called by finish_clip.sh for --mode ai / blend. CPU or CUDA.

usage: python upscale_frames.py <in_dir> <out_dir> --size 1280x720 [--blend 0.5]
  --blend  share of the AI image in the result: 1 = AI only, 0.5 = half AI, half Lanczos
Needs: torch, numpy, pillow. Weights (4.9 MB) download once to ~/.cache/realesrgan/.
Speed: about 5 s a frame at 832x480 on a 4-core cloud CPU; well under 1 s on a GPU.
"""
import argparse, glob, os, urllib.request
import numpy as np, torch, torch.nn as nn, torch.nn.functional as F
from PIL import Image

URL = "https://github.com/xinntao/Real-ESRGAN/releases/download/v0.2.5.0/realesr-general-x4v3.pth"


class SRVGGNetCompact(nn.Module):
    """Real-ESRGAN's compact net (xinntao/Real-ESRGAN, BSD-3): convs + PReLU, pixel shuffle, plus
    a nearest-upsampled copy of the input."""
    def __init__(self, feat=64, conv=32, up=4):
        super().__init__()
        self.up = up
        body = [nn.Conv2d(3, feat, 3, 1, 1), nn.PReLU(feat)]
        for _ in range(conv):
            body += [nn.Conv2d(feat, feat, 3, 1, 1), nn.PReLU(feat)]
        body += [nn.Conv2d(feat, 3 * up * up, 3, 1, 1)]
        self.body = nn.ModuleList(body)
        self.ps = nn.PixelShuffle(up)

    def forward(self, x):
        out = x
        for layer in self.body:
            out = layer(out)
        return self.ps(out) + F.interpolate(x, scale_factor=self.up, mode="nearest")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("in_dir"); ap.add_argument("out_dir")
    ap.add_argument("--size", default="1280x720")
    ap.add_argument("--blend", type=float, default=0.5)
    a = ap.parse_args()
    W, H = map(int, a.size.split("x"))
    weights = os.path.expanduser("~/.cache/realesrgan/realesr-general-x4v3.pth")
    if not os.path.exists(weights):
        os.makedirs(os.path.dirname(weights), exist_ok=True)
        urllib.request.urlretrieve(URL, weights)
    dev = "cuda" if torch.cuda.is_available() else "cpu"
    net = SRVGGNetCompact()
    sd = torch.load(weights, map_location="cpu")
    net.load_state_dict(sd.get("params", sd))
    net.eval().to(dev)
    if dev == "cuda":
        net.half()
    os.makedirs(a.out_dir, exist_ok=True)
    files = sorted(glob.glob(os.path.join(a.in_dir, "*.png")))
    for k, f in enumerate(files):
        src = Image.open(f).convert("RGB")
        x = torch.from_numpy(np.asarray(src, dtype=np.float32) / 255).permute(2, 0, 1)[None].to(dev)
        with torch.inference_mode():
            y = net(x.half() if dev == "cuda" else x).float().clamp(0, 1)
        ai = Image.fromarray((y[0].permute(1, 2, 0).cpu().numpy() * 255).round().astype("uint8")).resize((W, H), Image.LANCZOS)
        out = ai if a.blend >= 1 else Image.blend(src.resize((W, H), Image.LANCZOS), ai, a.blend)
        out.save(os.path.join(a.out_dir, os.path.basename(f)))
        if k % 10 == 0:
            print(f"upscaled {k + 1}/{len(files)} on {dev}", flush=True)


if __name__ == "__main__":
    main()
