"""Clay clip + real photos -> real-looking clip, with Wan2.1 VACE 1.3B (Apache-2.0).

Runs on a Kaggle GPU notebook (free T4). push_and_fetch.sh uploads the job folder as a Kaggle
dataset, pushes this file as the kernel, and downloads /kaggle/working/out.mp4.

Job folder (one shot):
  clay.mp4          the clay clip (structure and camera move), 5 s or less
  refs/*.jpg        1 to 3 real photos of that spot (the look); on Kaggle they arrive as ref_1.jpg ...
  first.png         optional: a real-looking first frame; kept as frame 0
  prompt.txt        optional: one line describing the place

How it works: the clay clip becomes a depth video (Depth Anything V2 Small), which VACE uses as
the control signal, so layout and camera move follow the clay. The photos go in as VACE
reference images, so materials, colours and light follow the real place. With first.png, frame 0
is fixed to it and the rest is generated.

Untested on Kaggle as of 2026-11-20: the first real run is the test. If the T4 runs out of
memory, lower --frames or --size, or turn on --offload.
"""
import argparse, glob, os, subprocess, sys

ap = argparse.ArgumentParser()
ap.add_argument("--job", default=None, help="job folder (default: the first /kaggle/input/* folder)")
ap.add_argument("--out", default="/kaggle/working/out.mp4")
ap.add_argument("--size", default="832x480", help="WxH, multiples of 16")
ap.add_argument("--fps", type=int, default=16, help="Wan generates at 16 fps")
ap.add_argument("--frames", type=int, default=0, help="0 = match the clay clip (rounded to 4k+1, max 81)")
ap.add_argument("--steps", type=int, default=30)
ap.add_argument("--guidance", type=float, default=5.0)
ap.add_argument("--seed", type=int, default=7)
ap.add_argument("--offload", action="store_true", help="model CPU offload, slower but lighter")
ap.add_argument("--no-install", action="store_true")
a, _ = ap.parse_known_args()

if not a.no_install:
    subprocess.run([sys.executable, "-m", "pip", "install", "-q", "-U",
                    "diffusers>=0.35", "transformers", "accelerate", "ftfy", "imageio", "imageio-ffmpeg"], check=True)

import numpy as np
import torch
from PIL import Image
from diffusers import AutoencoderKLWan, WanVACEPipeline
from diffusers.schedulers.scheduling_unipc_multistep import UniPCMultistepScheduler
from diffusers.utils import export_to_video, load_video
from transformers import pipeline as hf_pipeline

job = a.job or sorted(p for p in glob.glob("/kaggle/input/*") if os.path.isdir(p))[0]
W, H = map(int, a.size.split("x"))
print("job:", job, "size:", W, H, flush=True)

# ---- inputs
clay = load_video(os.path.join(job, "clay.mp4"))                      # list of PIL frames
src_fps = 24
dur = len(clay) / src_fps
n = a.frames or min(81, int(round(dur * a.fps)))
n = max(5, (n - 1) // 4 * 4 + 1)                                      # VACE wants 4k+1 frames
idx = np.linspace(0, len(clay) - 1, n).round().astype(int)
clay = [clay[i].convert("RGB").resize((W, H), Image.BICUBIC) for i in idx]
refs = [Image.open(p).convert("RGB") for p in sorted(glob.glob(os.path.join(job, "refs", "*")) + glob.glob(os.path.join(job, "ref_*")))][:3]
first = os.path.join(job, "first.png")
first = Image.open(first).convert("RGB").resize((W, H), Image.BICUBIC) if os.path.exists(first) else None
pf = os.path.join(job, "prompt.txt")
prompt = open(pf).read().strip() if os.path.exists(pf) else "A real cafe interior, natural light, handheld camera walking slowly, photorealistic"
prompt += ". Same layout and camera move as the control video. Materials, colours and light from the reference photos. No people, no text."
negative = "people, text, watermark, logo, blurry, cartoon, 3d render, clay, grey, plastic, distorted, melting, flicker"
print(f"frames: {n} at {a.fps} fps, refs: {len(refs)}, first frame: {first is not None}", flush=True)

# ---- depth control video from the clay clip
depth = hf_pipeline("depth-estimation", model="depth-anything/Depth-Anything-V2-Small-hf", device=0)
control = []
for f in clay:
    d = np.array(depth(f)["depth"], dtype=np.float32)
    d = (d - d.min()) / max(1e-6, d.max() - d.min()) * 255
    control.append(Image.fromarray(d.astype(np.uint8)).convert("RGB").resize((W, H)))
del depth; torch.cuda.empty_cache()

# frame 0 = the painted frame, kept (mask 0); every other frame generated under depth control (mask 1)
white, black = Image.new("L", (W, H), 255), Image.new("L", (W, H), 0)
video, mask = list(control), [white] * n
if first is not None:
    video[0], mask[0] = first, black

# ---- VACE (T4 has no bfloat16: run in float16)
dtype = torch.bfloat16 if torch.cuda.is_bf16_supported() else torch.float16
mid = "Wan-AI/Wan2.1-VACE-1.3B-diffusers"
vae = AutoencoderKLWan.from_pretrained(mid, subfolder="vae", torch_dtype=torch.float32)
pipe = WanVACEPipeline.from_pretrained(mid, vae=vae, torch_dtype=dtype)
pipe.scheduler = UniPCMultistepScheduler.from_config(pipe.scheduler.config, flow_shift=3.0)
if a.offload:
    pipe.enable_model_cpu_offload()
else:
    pipe.to("cuda")

out = pipe(video=video, mask=mask, reference_images=refs or None, prompt=prompt, negative_prompt=negative,
           height=H, width=W, num_frames=n, num_inference_steps=a.steps, guidance_scale=a.guidance,
           generator=torch.Generator("cuda").manual_seed(a.seed)).frames[0]
os.makedirs(os.path.dirname(a.out) or ".", exist_ok=True)
export_to_video(out, a.out, fps=a.fps)
export_to_video(control, os.path.join(os.path.dirname(a.out) or ".", "depth.mp4"), fps=a.fps)
print("wrote", a.out, flush=True)
