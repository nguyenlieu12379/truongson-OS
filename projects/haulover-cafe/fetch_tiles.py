"""Download Google Photorealistic 3D Tiles around one point (the real, scanned city), for Blender.

Usage:
  python3 fetch_tiles.py --lat 25.9045 --lon -80.1203 --radius 220 --near-error 1.5 --out tiles/

How it walks the tileset:
- Start at https://tile.googleapis.com/v1/3dtiles/root.json. Every tile has an oriented bounding box in
  ECEF (12 numbers: centre, then three half-axis vectors) and a geometric error (metres).
- Skip tiles whose box is farther than --radius from the point.
- Refine (go to children) while the tile's error is above what its distance allows: --near-error at the
  point, growing with distance (--falloff metres of error per metre away). So the venue comes in sharp
  and the surroundings coarser, like Google Earth.
- Child URIs carry a 'session' token: it must ride along on every later request (Google's rule).
- Leaf content is .glb (meshes + photo textures). Each is saved once; a manifest lists them with the
  copyright strings Google requires us to show.

Auth: the key comes from GOOGLE_MAPS_API_KEY if set, else the environment's network secret is expected
to add the X-Goog-Api-Key header on tile.googleapis.com (then no key appears in any URL or log).
The Map Tiles API needs a Google Cloud project with billing and the Map Tiles API enabled.
"""
import argparse
import hashlib
import json
import math
import os
import ssl
import sys
import time
import urllib.parse
import urllib.request

HOST = "https://tile.googleapis.com"
A, F = 6378137.0, 1 / 298.257223563                 # WGS84
E2 = F * (2 - F)


def ecef(lat, lon, h=0.0):
    la, lo = math.radians(lat), math.radians(lon)
    n = A / math.sqrt(1 - E2 * math.sin(la) ** 2)
    return ((n + h) * math.cos(la) * math.cos(lo), (n + h) * math.cos(la) * math.sin(lo),
            (n * (1 - E2) + h) * math.sin(la))


def enu_basis(lat, lon):
    """Rows: east, north, up unit vectors in ECEF."""
    la, lo = math.radians(lat), math.radians(lon)
    e = (-math.sin(lo), math.cos(lo), 0.0)
    n = (-math.sin(la) * math.cos(lo), -math.sin(la) * math.sin(lo), math.cos(la))
    u = (math.cos(la) * math.cos(lo), math.cos(la) * math.sin(lo), math.sin(la))
    return e, n, u


def box_distance(box, p):
    """Distance from point p to an oriented box (centre + 3 half-axis vectors), 0 inside."""
    c = box[0:3]
    d = [p[i] - c[i] for i in range(3)]
    out2 = 0.0
    for k in range(3):
        ax = box[3 + 3 * k: 6 + 3 * k]
        L = math.sqrt(sum(a * a for a in ax)) or 1e-9
        t = sum(d[i] * ax[i] for i in range(3)) / L         # projection on this axis, metres
        if abs(t) > L:
            out2 += (abs(t) - L) ** 2
    return math.sqrt(out2)


class Fetcher:
    def __init__(self, out, key=None):
        self.out, self.key, self.session = out, key, None
        ca = os.environ.get("SSL_CERT_FILE") or ("/root/.ccr/ca-bundle.crt"
                                                if os.path.exists("/root/.ccr/ca-bundle.crt") else None)
        self.ctx = ssl.create_default_context(cafile=ca)
        self.calls = 0

    def url(self, uri):
        u = urllib.parse.urljoin(HOST + "/", uri)
        q = dict(urllib.parse.parse_qsl(urllib.parse.urlparse(u).query))
        if "session" in q:
            self.session = q["session"]
        extra = {}
        if self.key:
            extra["key"] = self.key
        if self.session and "session" not in q:
            extra["session"] = self.session
        if extra:
            u += ("&" if "?" in u else "?") + urllib.parse.urlencode(extra)
        return u

    def get(self, uri):
        for attempt in range(5):
            try:
                req = urllib.request.Request(self.url(uri), headers={"User-Agent": "tiles-to-blender"})
                with urllib.request.urlopen(req, context=self.ctx, timeout=60) as r:
                    self.calls += 1
                    return r.read()
            except urllib.error.HTTPError as e:
                if e.code in (400, 401, 403, 404):
                    raise SystemExit(f"HTTP {e.code} for a tiles request: {e.read()[:300]!r}\n"
                                     "Check the key (Map Tiles API enabled, billing on, no restrictions).")
                time.sleep(2 ** attempt)
            except OSError:
                time.sleep(2 ** attempt)
        raise SystemExit("tiles request kept failing")


def walk(f, args):
    p = ecef(args.lat, args.lon, args.height)
    picked = []
    seen_json = 0

    def need(dist):
        return args.near_error + args.falloff * max(0.0, dist - args.sharp_radius)

    def visit(tile):
        nonlocal seen_json
        box = tile.get("boundingVolume", {}).get("box")
        dist = box_distance(box, p) if box else 0.0
        if dist > args.radius:
            return
        err = tile.get("geometricError", 0.0)
        kids = tile.get("children") or []
        content = tile.get("content", {}).get("uri") or tile.get("content", {}).get("url")
        refine = kids and err > need(dist)
        if content and content.split("?")[0].endswith(".json"):
            seen_json += 1
            sub = json.loads(f.get(content))
            visit(sub["root"])
            return
        if refine:
            for k in kids:
                visit(k)
            return
        if content and content.split("?")[0].endswith(".glb"):
            picked.append((content, dist, err))
        elif kids:                                              # no content of its own: go down
            for k in kids:
                visit(k)

    root = json.loads(f.get("/v1/3dtiles/root.json"))
    visit(root["root"])
    return picked, seen_json


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--lat", type=float, required=True)
    ap.add_argument("--lon", type=float, required=True)
    ap.add_argument("--height", type=float, default=0.0, help="ellipsoid height of the point (m); Miami ~ -25")
    ap.add_argument("--radius", type=float, default=220.0, help="take tiles within this distance (m)")
    ap.add_argument("--sharp-radius", type=float, default=60.0, help="full detail inside this distance (m)")
    ap.add_argument("--near-error", type=float, default=1.5, help="geometric error wanted at the venue (m)")
    ap.add_argument("--falloff", type=float, default=0.06, help="extra error allowed per metre beyond sharp radius")
    ap.add_argument("--max-tiles", type=int, default=600)
    ap.add_argument("--out", required=True)
    args = ap.parse_args()
    os.makedirs(args.out, exist_ok=True)
    f = Fetcher(args.out, os.environ.get("GOOGLE_MAPS_API_KEY"))
    picked, nj = walk(f, args)
    print(f"{len(picked)} tiles chosen ({nj} tileset pages read, {f.calls} requests)")
    if len(picked) > args.max_tiles:
        raise SystemExit(f"too many tiles ({len(picked)} > {args.max_tiles}): lower --radius or raise --near-error")
    man = {"lat": args.lat, "lon": args.lon, "height": args.height, "tiles": [], "copyright": []}
    for i, (uri, dist, err) in enumerate(sorted(picked, key=lambda t: t[1])):
        name = hashlib.sha1(uri.split("?")[0].encode()).hexdigest()[:16] + ".glb"
        path = os.path.join(args.out, name)
        if not os.path.exists(path):
            data = f.get(uri)
            with open(path, "wb") as fh:
                fh.write(data)
        man["tiles"].append({"file": name, "dist": round(dist, 1), "error": err})
        try:                                                   # copyright lives in the glb's asset block
            with open(path, "rb") as fh:
                b = fh.read()
            jl = int.from_bytes(b[12:16], "little")
            cr = json.loads(b[20:20 + jl]).get("asset", {}).get("copyright")
            if cr:
                for c in cr.split(";"):
                    c = c.strip()
                    if c and c not in man["copyright"]:
                        man["copyright"].append(c)
        except Exception:
            pass
        if i % 25 == 0:
            print(f"  {i + 1}/{len(picked)}", flush=True)
    with open(os.path.join(args.out, "manifest.json"), "w") as fh:
        json.dump(man, fh, indent=1)
    size = sum(os.path.getsize(os.path.join(args.out, t["file"])) for t in man["tiles"])
    print(f"saved {len(man['tiles'])} tiles, {size / 1e6:.1f} MB; data: {', '.join(man['copyright'])}")


if __name__ == "__main__":
    sys.exit(main())
