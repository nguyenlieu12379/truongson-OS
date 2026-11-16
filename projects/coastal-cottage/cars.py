"""Cars that read as cars, not boxes: a lofted body from a side profile (bumper, hood, windshield,
roof, rear window, trunk), a tapered glass greenhouse with a painted roof and pillars, wheels
standing proud in dark wheel arches, rims with spokes, head and tail lights, grille, bumpers,
mirrors, door seams and a licence plate. Kinds: sedan, hatch, suv, pickup.

Car-local frame (feet): x along the car (front +x), y across, z up from the ground. Everything
is written straight into a design_pass Piece's bmesh through one matrix per car.
"""
import math

import bmesh
from mathutils import Matrix, Vector

FT = 0.3048

# side profiles: stations (x, z_bottom, z_top, half_width) for the lower body, then the
# greenhouse (x, z_top) over the beltline, and the dims of the car
KINDS = {
    "sedan": dict(
        L=15.6, hw=3.05, belt=3.45, roof_hw=2.35, wheel=(4.85, -4.75), tyre_r=1.12,
        body=[(-7.8, 1.15, 2.55, 2.75), (-7.6, 0.85, 3.25, 2.95), (-6.6, 0.7, 3.42, 3.02), (-4.7, 0.62, 3.45, 3.05),
              (2.2, 0.62, 3.42, 3.05), (5.0, 0.65, 3.18, 3.02), (7.1, 0.75, 2.95, 2.95), (7.8, 1.05, 2.45, 2.7)],
        house=[(-4.7, 3.47), (-2.6, 4.72), (0.4, 4.78), (2.3, 3.47)]),
    "hatch": dict(
        L=13.6, hw=2.95, belt=3.4, roof_hw=2.3, wheel=(4.15, -4.15), tyre_r=1.05,
        body=[(-6.8, 1.0, 3.2, 2.8), (-6.6, 0.75, 3.38, 2.92), (-5.9, 0.62, 3.4, 2.95), (1.6, 0.62, 3.38, 2.95),
              (4.6, 0.68, 3.0, 2.9), (6.4, 0.8, 2.7, 2.8), (6.8, 1.05, 2.35, 2.6)],
        house=[(-6.5, 3.42), (-5.7, 4.75), (0.1, 4.85), (1.8, 3.42)]),
    "suv": dict(
        L=16.2, hw=3.25, belt=4.05, roof_hw=2.65, wheel=(5.2, -5.0), tyre_r=1.35,
        body=[(-8.1, 1.4, 3.9, 3.0), (-7.95, 1.05, 4.05, 3.2), (-6.9, 0.95, 4.08, 3.25), (2.8, 0.95, 4.05, 3.25),
              (5.6, 1.0, 3.8, 3.2), (7.7, 1.1, 3.5, 3.1), (8.1, 1.4, 3.0, 2.85)],
        house=[(-7.85, 4.07), (-7.4, 6.0), (1.2, 6.05), (3.0, 4.07)]),
    "pickup": dict(
        L=18.6, hw=3.3, belt=4.1, roof_hw=2.7, wheel=(6.1, -5.6), tyre_r=1.4,
        body=[(-9.3, 1.5, 3.9, 3.1), (-9.1, 1.15, 4.1, 3.25), (2.9, 1.1, 4.1, 3.3),
              (5.9, 1.15, 3.95, 3.3), (8.7, 1.25, 3.7, 3.2), (9.3, 1.5, 3.2, 2.95)],
        house=[(-2.6, 4.12), (-2.45, 6.15), (1.2, 6.2), (3.1, 4.12)], bed=(-9.0, -2.9)),
}


def _ring(x, zb, zt, hw, bev):
    """Cross-section of the body at x: a rounded rectangle (8 points), slight tumblehome on top."""
    ht = hw * 0.94
    b = min(bev, (zt - zb) * 0.3)
    return [(x, ht - b, zt), (x, hw, zt - b * 1.4), (x, hw, zb + b), (x, hw - b, zb),
            (x, -(hw - b), zb), (x, -hw, zb + b), (x, -hw, zt - b * 1.4), (x, -(ht - b), zt)]


class Car:
    def __init__(self, p, M, mats):
        self.p, self.M, self.m = p, M, mats

    def v(self, co):
        return self.p.bm.verts.new(self.M @ (Vector(co) * FT))

    def loft(self, rings, mat, cap=True, smooth=True):
        bm, mi = self.p.bm, self.p._mi(mat)
        vs = [[self.v(c) for c in r] for r in rings]
        n = len(vs[0])
        for a, b in zip(vs, vs[1:]):
            for k in range(n):
                f = bm.faces.new((a[k], a[(k + 1) % n], b[(k + 1) % n], b[k]))
                f.material_index, f.smooth = mi, smooth
        if cap:
            for r in (vs[0], vs[-1][::-1]):
                f = bm.faces.new(r[::-1])
                f.material_index = mi
        return vs

    def box(self, c, size, mat, rot=(0, 0, 0)):
        from mathutils import Euler
        mx = (self.M @ Matrix.Translation(Vector(c) * FT)
              @ Euler([math.radians(a) for a in rot]).to_matrix().to_4x4()
              @ Matrix.Diagonal((size[0] * FT, size[1] * FT, size[2] * FT, 1)))
        self.p._tag(bmesh.ops.create_cube(self.p.bm, size=1.0, matrix=mx), mat)

    def cyl_y(self, x, y, z, r, w, mat, seg=12, r2=None):
        """A cylinder with its axis across the car (wheels)."""
        mx = self.M @ Matrix.Translation(Vector((x, y, z)) * FT) @ Matrix.Rotation(math.radians(90), 4, "X")
        res = bmesh.ops.create_cone(self.p.bm, cap_ends=True, segments=seg, radius1=r * FT,
                                    radius2=(r if r2 is None else r2) * FT, depth=w * FT, matrix=mx)
        self.p._tag(res, mat, True)

    def build(self, kind, paint):
        k, m = KINDS[kind], self.m
        L, hw, belt = k["L"], k["hw"], k["belt"]
        # lower body, lofted along the profile
        self.loft([_ring(x, zb, zt, w, 0.45) for x, zb, zt, w in k["body"]], paint)
        # greenhouse: glass, tapering in toward the roof
        hs = k["house"]
        rings = []
        for i, (x, zt) in enumerate(hs):
            top_w = k["roof_hw"] if 0 < i < len(hs) - 1 else hw * 0.9
            rings.append([(x, hw * 0.93, belt - 0.02), (x, top_w, zt), (x, -top_w, zt), (x, -hw * 0.93, belt - 0.02)])
        self.loft(rings, m["glass"], smooth=False)
        # painted roof skin over the glass, and the pillars
        (xa, za), (xb, zb_) = hs[1], hs[2]
        self.loft([[(x, k["roof_hw"] + 0.05, z + 0.03), (x, k["roof_hw"] - 0.25, z + 0.13),
                    (x, -(k["roof_hw"] - 0.25), z + 0.13), (x, -(k["roof_hw"] + 0.05), z + 0.03)]
                   for x, z in ((xa + 0.15, za), ((xa + xb) / 2, max(za, zb_) + 0.04), (xb - 0.15, zb_))], paint)
        bx = (hs[1][0] + hs[2][0]) / 2 - 0.4                                   # B pillar
        for s in (-1, 1):
            self.loft([[(bx - 0.25, s * (hw * 0.93 + 0.02), belt), (bx + 0.25, s * (hw * 0.93 + 0.02), belt),
                        (bx + 0.25, s * (hw * 0.93 - 0.3), belt)],
                       [(bx - 0.25, s * (k["roof_hw"] + 0.06), hs[1][1]), (bx + 0.25, s * (k["roof_hw"] + 0.06),
                                                                         hs[2][1]),
                        (bx + 0.25, s * (k["roof_hw"] - 0.2), hs[2][1])]], m["trim"], smooth=False)
        if "bed" in k:                                                          # pickup bed
            x0, x1 = k["bed"]
            for s in (-1, 1):
                self.box(((x0 + x1) / 2, s * (hw - 0.15), belt + 0.6), (x1 - x0, 0.3, 1.2), paint)
            self.box((x0 + 0.15, 0, belt + 0.6), (0.3, hw * 2 - 0.3, 1.2), paint)
            self.box((x1 - 0.15, 0, belt + 0.6), (0.3, hw * 2 - 0.3, 1.2), paint)
            self.box(((x0 + x1) / 2, 0, belt + 0.05), (x1 - x0 - 0.4, hw * 2 - 0.6, 0.1), m["plastic"])
        # wheels: dark arch behind, tyre, rim with spokes, hub
        tr = k["tyre_r"]
        for wx in k["wheel"]:
            for s in (-1, 1):
                self.cyl_y(wx, s * (hw - 0.02), tr, tr + 0.28, 0.08, m["arch"], seg=16)
                self.cyl_y(wx, s * (hw - 0.3), tr, tr, 0.78, m["tyre"], seg=16)
                self.cyl_y(wx, s * (hw + 0.1), tr, tr * 0.62, 0.06, m["rim"], seg=12)
                for a in range(5):
                    ang = a * 2 * math.pi / 5
                    self.box((wx + math.cos(ang) * tr * 0.32, s * (hw + 0.15), tr + math.sin(ang) * tr * 0.32),
                             (tr * 0.6, 0.06, 0.16), m["rim_dk"], rot=(0, -math.degrees(ang), 0))
                self.cyl_y(wx, s * (hw + 0.17), tr, 0.22, 0.06, m["rim"], seg=8)
        # front: grille, headlights, bumper, plate. back: tail lights, bumper, plate
        fx = k["body"][-1][0]
        rx = k["body"][0][0]
        fz = (k["body"][-1][1] + k["body"][-1][2]) / 2
        rz = (k["body"][0][2] + k["body"][1][2]) / 2 - 0.35
        self.box((fx - 0.12, 0, fz - 0.05), (0.3, hw * 0.9, 0.55), m["grille"])
        self.box((fx - 0.05, 0, k["body"][-1][1] + 0.25), (0.35, hw * 1.95, 0.5), m["plastic"])
        self.box((fx + 0.05, 0, k["body"][-1][1] + 0.3), (0.06, 1.0, 0.36), m["plate"])
        for s in (-1, 1):
            self.box((fx - 0.35, s * (hw - 0.75), fz + 0.32), (0.55, 1.15, 0.32), m["head"], rot=(0, 18, 0))
            self.box((rx + 0.12, s * (hw - 0.55), rz), (0.25, 1.1, 0.45), m["tail"])
            self.box((k["house"][-1][0] - 0.45, s * (hw + 0.25), belt + 0.25), (0.45, 0.55, 0.35), paint)  # mirror
            for sx in (k["house"][1][0] + 0.3, bx + 0.1):                                                # seams
                self.box((sx, s * (hw + 0.005), (0.9 + belt) / 2), (0.05, 0.03, belt - 1.2), m["seam"])
        self.box((rx + 0.05, 0, k["body"][0][1] + 0.25), (0.35, hw * 1.95, 0.5), m["plastic"])
        self.box((rx - 0.05, 0, rz - 0.25), (0.06, 1.0, 0.36), m["plate"])


def materials(dp):
    p = dp.plain
    return {"glass": p("Car_Glass2", (0.03, 0.04, 0.05), 0.08), "trim": p("Car_Trim", (0.03, 0.03, 0.035), 0.4),
            "plastic": p("Car_Plastic", (0.06, 0.06, 0.065), 0.6), "arch": p("Car_Arch", (0.012, 0.012, 0.012), 0.9),
            "tyre": p("Tyre2", (0.03, 0.03, 0.03), 0.85), "rim": p("Rim2", (0.55, 0.56, 0.57), 0.3),
            "rim_dk": p("Rim_Dark", (0.18, 0.18, 0.19), 0.4), "grille": p("Grille", (0.025, 0.025, 0.03), 0.5),
            "head": p("Headlight", (0.80, 0.80, 0.78), 0.1), "tail": p("Taillight", (0.42, 0.02, 0.02), 0.2),
            "plate": p("Plate", (0.80, 0.80, 0.76), 0.5), "seam": p("Seam", (0.02, 0.02, 0.02), 0.6)}


def car(p, mats, x, y, heading_deg, kind, paint):
    """Place one car with its centre at plan (x, y), heading in degrees (0 = front toward +x)."""
    M = Matrix.Translation(Vector((x, y, -3.0)) * FT) @ Matrix.Rotation(math.radians(heading_deg), 4, "Z")
    Car(p, M, mats).build(kind, paint)
