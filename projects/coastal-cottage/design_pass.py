"""Design pass for the coastal cottage film: real materials, furnished rooms, landscaping,
and a golden-hour sunset (orange sun half under the horizon, wavy orange clouds) with a
warm colour grade.

Called by build_walkthrough.py after the base house is built:  design_pass.apply(G)
Everything here is in feet (like build_cottage.py) unless it says metres.
"""
import math
import random

import bmesh
import bpy
from mathutils import Euler, Matrix, Vector

FT = 0.3048
R = random.Random(7)

# sun: just above due "ocean" (+y), a touch to the right of the final view
SUN_AZ = math.radians(8)          # from +y toward +x
SUN_DISK_EL = math.radians(0.0)   # disc centre sits on the horizon -> half under
SUN_LAMP_EL = math.radians(2.5)   # light a little higher so it still reaches the rooms
SUN_RADIUS = math.radians(1.7)    # drawn a bit larger than life


# ------------------------------------------------------------------
# node helpers
# ------------------------------------------------------------------
class NT:
    def __init__(self, tree):
        self.t = tree
        self.n = tree.nodes
        self.x = 0

    def new(self, kind, **inputs):
        node = self.n.new(kind)
        node.location = (self.x, 0)
        self.x -= 180
        for k, v in inputs.items():
            self.set(node, k, v)
        return node

    def set(self, node, key, v):
        sock = node.inputs[key]
        if hasattr(v, "links") or isinstance(v, bpy.types.NodeSocket):
            self.t.links.new(v, sock)
        elif isinstance(v, bpy.types.Node):
            self.t.links.new(v.outputs[0], sock)
        else:
            sock.default_value = v

    def link(self, a, b):
        self.t.links.new(a, b)

    # small math / vector helpers ------------------------------------------------
    def math(self, op, a, b=0.0, c=0.0, clamp=False):
        m = self.n.new("ShaderNodeMath")
        m.operation = op
        m.use_clamp = clamp
        for i, v in enumerate((a, b, c)):
            if isinstance(v, bpy.types.NodeSocket):
                self.t.links.new(v, m.inputs[i])
            else:
                m.inputs[i].default_value = v
        return m.outputs[0]

    def vmath(self, op, a, b=None):
        m = self.n.new("ShaderNodeVectorMath")
        m.operation = op
        for i, v in enumerate((a, b)):
            if v is None:
                continue
            if isinstance(v, bpy.types.NodeSocket):
                self.t.links.new(v, m.inputs[i])
            else:
                m.inputs[i].default_value = v
        return m

    def mix(self, fac, a, b, blend="MIX"):
        m = self.n.new("ShaderNodeMix")
        m.data_type = "RGBA"
        m.blend_type = blend
        for idx, v in ((0, fac), (6, a), (7, b)):
            if isinstance(v, bpy.types.NodeSocket):
                self.t.links.new(v, m.inputs[idx])
            else:
                m.inputs[idx].default_value = v if isinstance(v, (int, float)) else ((*v, 1) if len(v) == 3 else v)
        return m.outputs[2]

    def ramp(self, fac, stops, interp="LINEAR"):
        r = self.n.new("ShaderNodeValToRGB")
        r.color_ramp.interpolation = interp
        els = r.color_ramp.elements
        while len(els) > 1:
            els.remove(els[-1])
        els[0].position, els[0].color = stops[0][0], (*stops[0][1], 1)
        for p, c in stops[1:]:
            e = els.new(p)
            e.color = (*c, 1)
        self.t.links.new(fac, r.inputs[0])
        return r.outputs[0]

    def maprange(self, v, a, b, c=0.0, d=1.0, smooth=False):
        m = self.n.new("ShaderNodeMapRange")
        m.interpolation_type = "SMOOTHSTEP" if smooth else "LINEAR"
        m.clamp = True
        self.t.links.new(v, m.inputs["Value"])
        m.inputs["From Min"].default_value = a
        m.inputs["From Max"].default_value = b
        m.inputs["To Min"].default_value = c
        m.inputs["To Max"].default_value = d
        return m.outputs[0]

    def xyz(self, vec):
        s = self.n.new("ShaderNodeSeparateXYZ")
        self.t.links.new(vec, s.inputs[0])
        return s.outputs

    def combine(self, x, y, z):
        c = self.n.new("ShaderNodeCombineXYZ")
        for i, v in enumerate((x, y, z)):
            if isinstance(v, bpy.types.NodeSocket):
                self.t.links.new(v, c.inputs[i])
            else:
                c.inputs[i].default_value = v
        return c.outputs[0]


def fresh(m):
    """Reset a material to an empty node tree with a Principled BSDF. Returns (NT, bsdf)."""
    m.use_nodes = True
    nt = m.node_tree
    for nd in list(nt.nodes):
        nt.nodes.remove(nd)
    out = nt.nodes.new("ShaderNodeOutputMaterial")
    out.location = (300, 0)
    b = nt.nodes.new("ShaderNodeBsdfPrincipled")
    nt.links.new(b.outputs[0], out.inputs[0])
    return NT(nt), b


def get_mat(name):
    return bpy.data.materials.get(name) or bpy.data.materials.new(name)


def objcoord(n):
    return n.new("ShaderNodeTexCoord").outputs["Object"]


def bump(n, b, height, strength=0.3, dist=0.01):
    bp = n.new("ShaderNodeBump")
    bp.inputs["Strength"].default_value = strength
    bp.inputs["Distance"].default_value = dist
    n.link(height, bp.inputs["Height"])
    n.link(bp.outputs[0], b.inputs["Normal"])
    return bp


def plain(name, color, rough=0.6, metal=0.0, coat=0.0, sheen=0.0, emit=None, emit_str=0.0,
          noise_bump=0.0, sss=0.0):
    m = get_mat(name)
    n, b = fresh(m)
    b.inputs["Base Color"].default_value = (*color, 1)
    b.inputs["Roughness"].default_value = rough
    b.inputs["Metallic"].default_value = metal
    if coat:
        b.inputs["Coat Weight"].default_value = coat
    if sheen:
        b.inputs["Sheen Weight"].default_value = sheen
    if sss:
        b.inputs["Subsurface Weight"].default_value = sss
    if emit:
        b.inputs["Emission Color"].default_value = (*emit, 1)
        b.inputs["Emission Strength"].default_value = emit_str
    if noise_bump:
        nz = n.new("ShaderNodeTexNoise", Scale=180.0, Detail=6.0)
        nz.inputs["Vector"].default_value = (0, 0, 0)
        n.link(objcoord(n), nz.inputs["Vector"])
        bump(n, b, nz.outputs["Fac"], noise_bump, 0.002)
    return m


def planks(name, across, along, width_m, length_m, light, dark, rough=0.45, gap_col=None,
           gap=0.012, coat=0.0, var=0.25, grain_scale=1.0):
    """Wood boards. across/along = 0,1,2 (x,y,z) object axes, sizes in metres."""
    m = get_mat(name)
    n, b = fresh(m)
    co = n.xyz(objcoord(n))
    u = co[across]
    v = co[along]
    row = n.math("FLOOR", n.math("DIVIDE", u, width_m))
    # stagger the board ends per row
    wn = n.new("ShaderNodeTexWhiteNoise")
    wn.noise_dimensions = "1D"
    n.link(row, wn.inputs["W"])
    rnd = wn.outputs["Value"]
    vv = n.math("ADD", v, n.math("MULTIPLY", rnd, length_m))
    col_idx = n.math("FLOOR", n.math("DIVIDE", vv, length_m))
    wn2 = n.new("ShaderNodeTexWhiteNoise")
    wn2.noise_dimensions = "2D"
    n.link(n.combine(row, col_idx, 0), wn2.inputs["Vector"])
    brd = wn2.outputs["Value"]
    # grain: noise stretched along the board
    gv = n.combine(n.math("MULTIPLY", u, 40 * grain_scale), n.math("MULTIPLY", v, 2.5 * grain_scale),
                   n.math("MULTIPLY", brd, 50))
    gn = n.new("ShaderNodeTexNoise", Scale=1.0, Detail=8.0, Roughness=0.6, Distortion=0.6)
    n.link(gv, gn.inputs["Vector"])
    wave = n.new("ShaderNodeTexWave", Scale=1.0, Distortion=3.0, Detail=3.0)
    wave.wave_type = "BANDS"
    wave.bands_direction = "X"
    n.link(n.combine(n.math("MULTIPLY", u, 30 * grain_scale), n.math("MULTIPLY", v, 1.2), brd),
           wave.inputs["Vector"])
    g = n.math("MULTIPLY", n.math("ADD", gn.outputs["Fac"], wave.outputs["Fac"]), 0.5)
    base = n.ramp(g, [(0.3, light), (0.75, dark)])
    tint = n.math("ADD", n.math("MULTIPLY", brd, var * 2), 1 - var)
    col = n.mix(1.0, base, (1, 1, 1), "MULTIPLY")
    tn = n.new("ShaderNodeCombineColor")
    for i in range(3):
        n.link(tint, tn.inputs[i])
    col = n.mix(1.0, base, tn.outputs[0], "MULTIPLY")
    # gaps between boards (across) and at the board ends
    fu = n.math("FRACT", n.math("DIVIDE", u, width_m))
    fv = n.math("FRACT", n.math("DIVIDE", vv, length_m))
    gap_u = n.math("LESS_THAN", fu, gap / width_m)
    gap_v = n.math("LESS_THAN", fv, gap / length_m)
    gapm = n.math("MAXIMUM", gap_u, gap_v)
    col = n.mix(gapm, col, gap_col or tuple(c * 0.35 for c in dark))
    n.link(col, b.inputs["Base Color"])
    b.inputs["Roughness"].default_value = rough
    if coat:
        b.inputs["Coat Weight"].default_value = coat
        b.inputs["Coat Roughness"].default_value = 0.15
    h = n.math("SUBTRACT", n.math("MULTIPLY", g, 0.15), gapm)
    bump(n, b, h, 0.25, 0.004)
    return m


def lap_siding(name, color, exposure_m=0.178):
    m = get_mat(name)
    n, b = fresh(m)
    co = n.xyz(objcoord(n))
    f = n.math("FRACT", n.math("DIVIDE", co[2], exposure_m))
    shade = n.maprange(f, 0.0, 0.12, 0.72, 1.0)   # shadow line under each board
    nz = n.new("ShaderNodeTexNoise", Scale=60.0, Detail=4.0)
    n.link(objcoord(n), nz.inputs["Vector"])
    tint = n.math("ADD", n.math("MULTIPLY", nz.outputs["Fac"], 0.08), 0.96)
    k = n.math("MULTIPLY", shade, tint)
    cc = n.new("ShaderNodeCombineColor")
    for i in range(3):
        n.link(k, cc.inputs[i])
    n.link(n.mix(1.0, color, cc.outputs[0], "MULTIPLY"), b.inputs["Base Color"])
    b.inputs["Roughness"].default_value = 0.55
    bump(n, b, f, 0.6, 0.01)
    return m


def standing_seam(name, color):
    m = get_mat(name)
    n, b = fresh(m)
    co = n.xyz(objcoord(n))
    nrm = n.xyz(n.new("ShaderNodeNewGeometry").outputs["Normal"])
    side = n.math("GREATER_THAN", n.math("ABSOLUTE", nrm[0]), n.math("ABSOLUTE", nrm[1]))
    coord = n.math("ADD", n.math("MULTIPLY", co[1], side),
                   n.math("MULTIPLY", co[0], n.math("SUBTRACT", 1.0, side)))
    f = n.math("FRACT", n.math("DIVIDE", coord, 0.45))
    seam = n.math("LESS_THAN", f, 0.05)
    nz = n.new("ShaderNodeTexNoise", Scale=3.0, Detail=5.0)
    n.link(objcoord(n), nz.inputs["Vector"])
    col = n.mix(n.math("MULTIPLY", nz.outputs["Fac"], 0.35), color,
                tuple(c * 0.8 for c in color))
    n.link(col, b.inputs["Base Color"])
    b.inputs["Metallic"].default_value = 0.9
    n.link(n.maprange(nz.outputs["Fac"], 0.3, 0.7, 0.28, 0.42), b.inputs["Roughness"])
    bump(n, b, seam, 0.8, 0.015)
    return m


def marble(name):
    m = get_mat(name)
    n, b = fresh(m)
    w = n.new("ShaderNodeTexWave", Scale=2.2, Distortion=9.0, Detail=6.0, **{"Detail Roughness": 0.65})
    w.wave_type = "BANDS"
    w.bands_direction = "DIAGONAL"
    n.link(objcoord(n), w.inputs["Vector"])
    v = n.ramp(w.outputs["Fac"], [(0.0, (0.55, 0.55, 0.56)), (0.06, (0.92, 0.91, 0.89)),
                                  (1.0, (0.96, 0.95, 0.93))])
    n.link(v, b.inputs["Base Color"])
    b.inputs["Roughness"].default_value = 0.12
    b.inputs["Coat Weight"].default_value = 0.4
    return m


def tiles(name, c1, c2, mortar, scale=12.0, rough=0.15, w=0.5, h=0.25):
    m = get_mat(name)
    n, b = fresh(m)
    br = n.new("ShaderNodeTexBrick", Scale=scale, **{"Mortar Size": 0.012, "Brick Width": w,
                                                      "Row Height": h})
    br.offset = 0.0
    n.link(objcoord(n), br.inputs["Vector"])
    br.inputs["Color1"].default_value = (*c1, 1)
    br.inputs["Color2"].default_value = (*c2, 1)
    br.inputs["Mortar"].default_value = (*mortar, 1)
    n.link(br.outputs["Color"], b.inputs["Base Color"])
    b.inputs["Roughness"].default_value = rough
    nz = n.new("ShaderNodeTexNoise", Scale=40.0, Detail=3.0)
    n.link(objcoord(n), nz.inputs["Vector"])
    h_ = n.math("ADD", n.math("SUBTRACT", 1.0, br.outputs["Fac"]),
                n.math("MULTIPLY", nz.outputs["Fac"], 0.15))
    bump(n, b, h_, 0.4, 0.003)
    return m


def fabric(name, color, stripe=None, stripe_scale=6.0):
    m = get_mat(name)
    n, b = fresh(m)
    co = objcoord(n)
    weave = n.new("ShaderNodeTexWave", Scale=900.0, Distortion=0.0)
    weave.wave_type = "BANDS"
    weave.bands_direction = "X"
    n.link(co, weave.inputs["Vector"])
    weave2 = n.new("ShaderNodeTexWave", Scale=900.0, Distortion=0.0)
    weave2.wave_type = "BANDS"
    weave2.bands_direction = "Y"
    n.link(co, weave2.inputs["Vector"])
    h = n.math("MULTIPLY", weave.outputs["Fac"], weave2.outputs["Fac"])
    nz = n.new("ShaderNodeTexNoise", Scale=25.0, Detail=4.0)
    n.link(co, nz.inputs["Vector"])
    base = color
    if stripe:
        st = n.new("ShaderNodeTexWave", Scale=stripe_scale, Distortion=0.0)
        st.wave_type = "BANDS"
        st.bands_direction = "X"
        st.wave_profile = "SAW"
        n.link(co, st.inputs["Vector"])
        mask = n.math("GREATER_THAN", st.outputs["Fac"], 0.72)
        base = n.mix(mask, color, stripe)
    col = n.mix(n.math("MULTIPLY", nz.outputs["Fac"], 0.25), base, tuple(c * 0.8 for c in color))
    n.link(col, b.inputs["Base Color"])
    b.inputs["Roughness"].default_value = 0.92
    b.inputs["Sheen Weight"].default_value = 0.6
    bump(n, b, h, 0.15, 0.002)
    return m


def sand(name, c1, c2, rough=0.95, ripples=True, wet=False):
    m = get_mat(name)
    n, b = fresh(m)
    co = objcoord(n)
    nz = n.new("ShaderNodeTexNoise", Scale=0.8, Detail=6.0, Roughness=0.6)
    n.link(co, nz.inputs["Vector"])
    col = n.ramp(nz.outputs["Fac"], [(0.35, c1), (0.65, c2)])
    n.link(col, b.inputs["Base Color"])
    b.inputs["Roughness"].default_value = rough
    if wet:
        b.inputs["Coat Weight"].default_value = 0.6
        b.inputs["Coat Roughness"].default_value = 0.05
    fine = n.new("ShaderNodeTexNoise", Scale=400.0, Detail=2.0)
    n.link(co, fine.inputs["Vector"])
    h = fine.outputs["Fac"]
    if ripples:
        w = n.new("ShaderNodeTexWave", Scale=4.0, Distortion=8.0, Detail=2.0)
        w.wave_type = "BANDS"
        w.bands_direction = "Y"
        n.link(co, w.inputs["Vector"])
        h = n.math("ADD", n.math("MULTIPLY", w.outputs["Fac"], 1.5), h)
    bump(n, b, h, 0.35, 0.02)
    return m


def ocean(name):
    m = get_mat(name)
    n, b = fresh(m)
    co = objcoord(n)
    b.inputs["Base Color"].default_value = (0.012, 0.045, 0.06, 1)
    b.inputs["Roughness"].default_value = 0.07
    b.inputs["IOR"].default_value = 1.333
    b.inputs["Coat Weight"].default_value = 0.0
    w = n.new("ShaderNodeTexWave", Scale=0.05, Distortion=6.0, Detail=6.0, **{"Detail Scale": 2.0})
    w.wave_type = "BANDS"
    w.bands_direction = "X"
    n.link(co, w.inputs["Vector"])
    nz = n.new("ShaderNodeTexNoise", Scale=0.6, Detail=8.0, Roughness=0.65)
    n.link(co, nz.inputs["Vector"])
    h = n.math("ADD", w.outputs["Fac"], n.math("MULTIPLY", nz.outputs["Fac"], 0.8))
    bump(n, b, h, 0.45, 0.15)
    return m


def surf(name):
    m = get_mat(name)
    n, b = fresh(m)
    co = objcoord(n)
    nz = n.new("ShaderNodeTexNoise", Scale=1.2, Detail=8.0, Roughness=0.7)
    n.link(co, nz.inputs["Vector"])
    foam = n.maprange(nz.outputs["Fac"], 0.42, 0.62, 0.0, 1.0)
    n.link(n.mix(foam, (0.06, 0.12, 0.13), (0.95, 0.94, 0.9)), b.inputs["Base Color"])
    n.link(n.maprange(foam, 0, 1, 0.05, 0.6), b.inputs["Roughness"])
    return m


# ------------------------------------------------------------------
# mesh builder: furniture pieces as one object each, many materials
# ------------------------------------------------------------------
class Piece:
    def __init__(self, name, collection="Furniture"):
        self.name = name
        self.coll = collection
        self.bm = bmesh.new()
        self.mats = []

    def _mi(self, m):
        if m not in self.mats:
            self.mats.append(m)
        return self.mats.index(m)

    def _tag(self, res, m, smooth=False):
        verts = res["verts"]
        faces = {f for v in verts for f in v.link_faces}
        mi = self._mi(m)
        for f in faces:
            f.material_index = mi
            f.smooth = smooth

    def obox(self, c, size, m, rot=(0, 0, 0)):
        """Oriented box. c = centre (ft), size = full size (ft), rot = euler degrees."""
        mx = (Matrix.Translation(Vector(c) * FT) @ Euler([math.radians(a) for a in rot]).to_matrix().to_4x4()
              @ Matrix.Diagonal((size[0] * FT, size[1] * FT, size[2] * FT, 1)))
        self._tag(bmesh.ops.create_cube(self.bm, size=1.0, matrix=mx), m)
        return self

    def box(self, x0, y0, z0, x1, y1, z1, m):
        return self.obox(((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2),
                         (abs(x1 - x0), abs(y1 - y0), abs(z1 - z0)), m)

    def cyl(self, x, y, z0, z1, r, m, r2=None, seg=20, rot=(0, 0, 0)):
        h = z1 - z0
        mx = (Matrix.Translation(Vector((x, y, (z0 + z1) / 2)) * FT)
              @ Euler([math.radians(a) for a in rot]).to_matrix().to_4x4())
        res = bmesh.ops.create_cone(self.bm, cap_ends=True, cap_tris=False, segments=seg,
                                    radius1=r * FT, radius2=(r if r2 is None else r2) * FT,
                                    depth=h * FT, matrix=mx)
        self._tag(res, m, True)
        return self

    def ell(self, c, half, m, rot=(0, 0, 0), seg=16):
        mx = (Matrix.Translation(Vector(c) * FT) @ Euler([math.radians(a) for a in rot]).to_matrix().to_4x4()
              @ Matrix.Diagonal((half[0] * FT, half[1] * FT, half[2] * FT, 1)))
        res = bmesh.ops.create_uvsphere(self.bm, u_segments=seg, v_segments=max(6, seg // 2),
                                        radius=1.0, matrix=mx)
        self._tag(res, m, True)
        return self

    def build(self, bevel=0.012):
        me = bpy.data.meshes.new(self.name)
        self.bm.to_mesh(me)
        self.bm.free()
        for m in self.mats:
            me.materials.append(m)
        o = bpy.data.objects.new(self.name, me)
        xs = [v.co.x for v in me.vertices]
        ys = [v.co.y for v in me.vertices]
        zs = [v.co.z for v in me.vertices]
        org = Vector(((min(xs) + max(xs)) / 2, (min(ys) + max(ys)) / 2, min(zs)))
        me.transform(Matrix.Translation(-org))
        o.location = org
        if bevel:
            bv = o.modifiers.new("Bevel", "BEVEL")
            bv.width = bevel
            bv.segments = 2
            bv.limit_method = "ANGLE"
            bv.angle_limit = math.radians(40)
        col = bpy.data.collections.get(self.coll)
        col.objects.link(o)
        return o


def recenter(o):
    """Move a mesh object's origin to its bottom centre (so it pops up from the floor)."""
    vs = [o.matrix_world @ v.co for v in o.data.vertices]
    org = Vector(((min(v.x for v in vs) + max(v.x for v in vs)) / 2,
                  (min(v.y for v in vs) + max(v.y for v in vs)) / 2, min(v.z for v in vs)))
    o.data.transform(Matrix.Translation(-(org - o.location)))
    o.location = org


def kill(names):
    for nm in names:
        o = bpy.data.objects.get(nm)
        if o:
            bpy.data.objects.remove(o, do_unlink=True)


# ------------------------------------------------------------------
# furniture library (feet). Each returns the built object.
# ------------------------------------------------------------------
def sofa(name, x0, y0, x1, y1, Z, body, cushion, pillows, legs, facing="+y", coll="Furniture"):
    """Three-seat sofa. Rectangle x0..x1 / y0..y1 on the floor, back on the side away from facing."""
    p = Piece(name, coll)
    L = x1 - x0
    d = y1 - y0
    back = y0 if facing == "+y" else y1
    sgn = 1 if facing == "+y" else -1
    # legs
    for lx in (x0 + 0.4, x1 - 0.4):
        for ly in (y0 + 0.35, y1 - 0.35):
            p.cyl(lx, ly, Z, Z + 0.45, 0.09, legs, 0.07, seg=10)
    p.box(x0, y0, Z + 0.45, x1, y1, Z + 1.25, body)                       # base
    p.box(x0, back, Z + 0.45, x1, back + sgn * 0.75, Z + 2.75, body)       # back frame
    p.box(x0, y0, Z + 0.45, x0 + 0.7, y1, Z + 2.1, body)                   # arms
    p.box(x1 - 0.7, y0, Z + 0.45, x1, y1, Z + 2.1, body)
    n = 3
    w = (L - 1.4) / n
    for i in range(n):
        cx0 = x0 + 0.7 + i * w
        p.box(cx0 + 0.04, back + sgn * 0.75, Z + 1.25, cx0 + w - 0.04, back + sgn * (d - 0.05),
              Z + 1.75, cushion)                                           # seat cushion
        p.obox((cx0 + w / 2, back + sgn * 1.05, Z + 2.45), (w - 0.1, 0.55, 1.5), cushion,
               rot=(sgn * -12, 0, 0))                                      # back cushion
    for i, (px, col) in enumerate(zip((x0 + 1.3, x0 + 2.2, x1 - 2.2, x1 - 1.3), pillows)):
        p.obox((px, back + sgn * 1.45, Z + 2.25), (1.25, 0.4, 1.2), col,
               rot=(sgn * -15, 0, (-12 if i < 2 else 12)))
    return p.build(0.03)


def armchair(name, cx, cy, Z, face_deg, body, cushion, pillow, legs):
    p = Piece(name)
    p.box(-1.2, -1.2, 0.4, 1.2, 1.2, 1.15, body)
    p.box(-1.2, -1.2, 0.4, -0.75, 1.2, 1.9, body)
    p.box(0.75, -1.2, 0.4, 1.2, 1.2, 1.9, body)
    p.box(-1.2, -1.2, 0.4, 1.2, -0.6, 2.7, body)
    p.box(-0.75, -0.6, 1.15, 0.75, 1.15, 1.6, cushion)
    p.obox((0, -0.35, 2.05), (1.0, 0.35, 0.9), pillow, rot=(-14, 0, 0))
    for lx in (-1.0, 1.0):
        for ly in (-1.0, 1.0):
            p.cyl(lx, ly, 0, 0.4, 0.08, legs, 0.06, seg=10)
    o = p.build(0.03)
    o.rotation_euler.z = math.radians(face_deg)
    o.location = Vector((cx, cy, Z)) * FT
    return o


def dining_chair(name, cx, cy, Z, face_deg, wood, seat):
    p = Piece(name)
    for lx in (-0.75, 0.75):
        for ly in (-0.7, 0.7):
            p.cyl(lx, ly, 0, 1.5, 0.07, wood, 0.06, seg=10)
    p.box(-0.85, -0.8, 1.5, 0.85, 0.8, 1.68, seat)
    for lx in (-0.75, 0.75):
        p.cyl(lx, -0.72, 1.68, 3.0, 0.06, wood, seg=10)
    p.box(-0.8, -0.8, 2.2, 0.8, -0.66, 3.0, wood)
    o = p.build(0.015)
    o.rotation_euler.z = math.radians(face_deg)
    o.location = Vector((cx, cy, Z)) * FT
    return o


def stool(name, cx, cy, Z, wood, seat):
    p = Piece(name)
    p.cyl(0, 0, 2.3, 2.5, 0.65, seat, seg=24)
    for a in range(4):
        ang = a * math.pi / 2 + math.pi / 4
        p.cyl(math.cos(ang) * 0.42, math.sin(ang) * 0.42, 0, 2.3, 0.05, wood, 0.05, seg=8,
              rot=(math.degrees(math.sin(ang)) * 0.12, -math.degrees(math.cos(ang)) * 0.12, 0))
    p.cyl(0, 0, 0.9, 0.98, 0.5, wood, seg=20)
    o = p.build(0.0)
    o.location = Vector((cx, cy, Z)) * FT
    return o


def table_lamp(p, x, y, z, base, shade, glow=None):
    p.cyl(x, y, z, z + 0.9, 0.28, base, 0.18, seg=18)
    p.cyl(x, y, z + 0.9, z + 1.4, 0.04, base, seg=8)
    p.cyl(x, y, z + 1.3, z + 2.0, 0.55, glow or shade, 0.42, seg=24)


def plant(name, x, y, Z, pot, leaf, height=6.0, spread=1.6, leaves=40, coll="Furniture", trunk=None):
    p = Piece(name, coll)
    p.cyl(x, y, Z, Z + 1.4, 0.75, pot, 0.6, seg=24)
    p.cyl(x, y, Z + 1.3, Z + height * 0.7, 0.06, trunk or pot, 0.04, seg=6)
    for i in range(leaves):
        h = Z + 1.6 + (height - 1.6) * (i / leaves) ** 0.8
        a = i * 2.4
        rr = spread * (0.45 + 0.55 * math.sin(math.pi * i / leaves))
        p.ell((x + math.cos(a) * rr * 0.5, y + math.sin(a) * rr * 0.5, h), (0.42, 0.22, 0.04), leaf,
              rot=(R.uniform(-30, 30), R.uniform(-35, 35), math.degrees(a)), seg=8)
    return p.build(0.0)


def palm(name, x, y, z, height, lean, trunk, frond, coll="Site"):
    p = Piece(name, coll)
    segs = 9
    lx, ly = math.cos(lean[1]) * lean[0], math.sin(lean[1]) * lean[0]   # top offset
    pts = []
    for i in range(segs + 1):
        t = i / segs
        pts.append((x + lx * t * t, y + ly * t * t, z + height * t))
    for i in range(segs):
        a, b = Vector(pts[i]), Vector(pts[i + 1])
        d = b - a
        c = (a + b) / 2
        q = d.normalized().to_track_quat("Z", "Y")
        r0 = 0.6 - 0.25 * i / segs
        mx = (Matrix.Translation(c * FT) @ q.to_matrix().to_4x4())
        res = bmesh.ops.create_cone(p.bm, cap_ends=True, segments=10, radius1=r0 * FT,
                                    radius2=r0 * 0.86 * FT, depth=(d.length + 0.12) * FT, matrix=mx)
        p._tag(res, trunk, True)
    top = Vector(pts[-1])
    n = 14
    for i in range(n):
        az = i * 2 * math.pi / n + R.uniform(-0.15, 0.15)
        L = R.uniform(6.5, 8.5)
        droop = R.uniform(15, 55)
        # frond = a chain of 5 flat leaflet blades that arch down
        pos = top.copy()
        dirv = Vector((math.cos(az), math.sin(az), math.tan(math.radians(25 - droop * 0.2))))
        for k in range(6):
            dirv.z -= 0.18 + droop / 300
            step = dirv.normalized() * (L / 6)
            c = pos + step / 2
            q = step.to_track_quat("X", "Z")
            w = 1.3 * math.sin(math.pi * (k + 0.6) / 6.5)
            mx = Matrix.Translation(c * FT) @ q.to_matrix().to_4x4() @ Matrix.Diagonal(
                (L / 12 * FT * 1.15, w * FT, 0.05 * FT, 1))
            res = bmesh.ops.create_uvsphere(p.bm, u_segments=8, v_segments=4, radius=1.0, matrix=mx)
            p._tag(res, frond, True)
            pos = pos + step
    p.ell(tuple(top), (0.7, 0.7, 0.6), trunk, seg=10)
    return p.build(0.0)


def grass_clump(p, x, y, z, mat_, n=14, h=2.6):
    for i in range(n):
        a = R.uniform(0, 2 * math.pi)
        r = R.uniform(0, 0.8)
        tilt = R.uniform(8, 30)
        p.cyl(x + math.cos(a) * r, y + math.sin(a) * r, z, z + h * R.uniform(0.6, 1.1), 0.05, mat_,
              0.0, seg=4, rot=(math.sin(a) * tilt, -math.cos(a) * tilt, 0))


def lounge_chair(name, cx, cy, Z, face_deg, frame, cushion):
    """Low outdoor lounge chair facing +y before rotation."""
    p = Piece(name)
    p.box(-1.3, -1.4, 0, -1.1, 1.4, 1.6, frame)
    p.box(1.1, -1.4, 0, 1.3, 1.4, 1.6, frame)
    p.box(-1.1, -1.3, 0.6, 1.1, 1.3, 0.9, frame)
    p.box(-1.05, -1.25, 0.9, 1.05, 1.3, 1.35, cushion)
    p.obox((0, -1.25, 1.9), (2.1, 0.45, 1.9), cushion, rot=(-18, 0, 0))
    o = p.build(0.03)
    o.rotation_euler.z = math.radians(face_deg)
    o.location = Vector((cx, cy, Z)) * FT
    return o


# ------------------------------------------------------------------
# the pass
# ------------------------------------------------------------------
def apply(G):
    M = G["M"]
    F = G["FLOOR_Z"]
    W, D = G["W"], G["D"]
    scene = bpy.context.scene

    # ---------------- materials on the existing house ----------------
    lap_siding("Siding_White", (0.86, 0.85, 0.81))
    plain("Trim_White", (0.93, 0.92, 0.89), 0.45)
    plain("Interior_Wall", (0.88, 0.84, 0.77), 0.85, noise_bump=0.05)
    planks("Oak_Floor", 0, 1, 0.19, 1.6, (0.62, 0.45, 0.29), (0.42, 0.28, 0.16), rough=0.38, coat=0.25)
    tiles("Bath_Tile", (0.84, 0.86, 0.85), (0.78, 0.81, 0.81), (0.62, 0.62, 0.6), scale=10.0,
          w=0.5, h=0.5)
    planks("Deck_Wood", 0, 1, 0.14, 2.4, (0.50, 0.38, 0.27), (0.33, 0.24, 0.17), rough=0.6,
           gap_col=(0.03, 0.025, 0.02), gap=0.008)
    standing_seam("Metal_Roof", (0.48, 0.50, 0.50))
    planks("Piling", 0, 2, 0.4, 20.0, (0.47, 0.44, 0.40), (0.33, 0.31, 0.29), rough=0.9, var=0.1)
    plain("Door_Blue", (0.035, 0.075, 0.13), 0.28, coat=0.6)
    sand("Sand", (0.83, 0.70, 0.52), (0.76, 0.63, 0.45))
    sand("Wet_Sand", (0.42, 0.33, 0.22), (0.36, 0.28, 0.19), rough=0.3, ripples=False, wet=True)
    sand("Dune_Sand", (0.80, 0.70, 0.52), (0.72, 0.62, 0.44))
    ocean("Ocean")
    surf("Surf")
    plain("Counter", (0.93, 0.93, 0.91), 0.2, coat=0.3)        # appliances, vanities, tub
    plain("Cabinet", (0.42, 0.50, 0.46), 0.42, coat=0.15)      # sage shaker-paint
    plain("Sofa", (0.80, 0.75, 0.66), 0.9, sheen=0.5)
    plain("Bedding", (0.95, 0.94, 0.91), 0.9, sheen=0.4)
    g = bpy.data.materials["Glass"]
    gb = g.node_tree.nodes.get("Principled BSDF")
    if gb:
        gb.inputs["Base Color"].default_value = (0.92, 0.96, 0.97, 1)
        gb.inputs["Roughness"].default_value = 0.0

    marble_m = marble("Marble_Top")
    navy = plain("Island_Navy", (0.05, 0.08, 0.13), 0.35, coat=0.3)
    steel = plain("Stainless", (0.75, 0.75, 0.74), 0.22, metal=1.0)
    brass = plain("Brass", (0.85, 0.62, 0.32), 0.25, metal=1.0)
    black = plain("Black_Metal", (0.02, 0.02, 0.02), 0.4, metal=0.6)
    walnut = planks("Walnut", 0, 1, 0.12, 2.5, (0.36, 0.22, 0.13), (0.22, 0.13, 0.07), rough=0.35,
                    gap=0.0005, var=0.1, coat=0.3)
    oak = planks("Light_Oak", 0, 1, 0.12, 2.5, (0.70, 0.54, 0.36), (0.55, 0.40, 0.25), rough=0.4,
                 gap=0.0005, var=0.1)
    teak = planks("Teak", 0, 1, 0.09, 2.0, (0.52, 0.36, 0.22), (0.38, 0.25, 0.14), rough=0.55,
                  gap=0.003, var=0.12)
    linen = fabric("Linen", (0.80, 0.76, 0.68))
    oat = fabric("Oatmeal_Boucle", (0.72, 0.66, 0.57))
    navy_f = fabric("Navy_Linen", (0.06, 0.10, 0.18))
    rust = fabric("Terracotta", (0.55, 0.24, 0.12))
    sky_f = fabric("Sky_Stripe", (0.88, 0.86, 0.80), stripe=(0.20, 0.35, 0.52), stripe_scale=9.0)
    white_bed = fabric("White_Duvet", (0.93, 0.92, 0.89))
    sage_f = fabric("Sage_Linen", (0.45, 0.52, 0.44))
    rug_m = fabric("Rug_Stripe", (0.80, 0.74, 0.62), stripe=(0.22, 0.30, 0.40), stripe_scale=3.0)
    jute = fabric("Jute", (0.62, 0.50, 0.34))
    terracotta = plain("Terracotta_Pot", (0.55, 0.30, 0.18), 0.7)
    ceramic = plain("White_Ceramic", (0.90, 0.89, 0.85), 0.25, coat=0.4)
    leaf = plain("Leaf", (0.07, 0.20, 0.05), 0.45, sss=0.15)
    olive_leaf = plain("Olive_Leaf", (0.24, 0.30, 0.18), 0.5)
    rattan = plain("Rattan", (0.56, 0.40, 0.22), 0.7)
    glow = plain("Lamp_Glow", (1.0, 0.82, 0.6), 0.5, emit=(1.0, 0.62, 0.32), emit_str=2.5)
    bulb = plain("Bulb_Glow", (1.0, 0.9, 0.7), 0.3, emit=(1.0, 0.62, 0.3), emit_str=25.0)
    shutter = plain("Shutter", (0.26, 0.36, 0.38), 0.45, coat=0.2)
    zellige = tiles("Zellige", (0.86, 0.90, 0.90), (0.74, 0.82, 0.84), (0.85, 0.85, 0.82), scale=14.0,
                    rough=0.06, w=0.5, h=0.5)
    palm_trunk = planks("Palm_Trunk", 0, 2, 0.6, 0.35, (0.42, 0.34, 0.26), (0.28, 0.22, 0.17), rough=0.9,
                        gap=0.03, var=0.1)
    frond = plain("Palm_Frond", (0.10, 0.22, 0.06), 0.55, sss=0.1)
    beach_grass = plain("Beach_Grass", (0.55, 0.52, 0.30), 0.8)
    art_m = get_mat("Art_Canvas")
    n, b = fresh(art_m)
    wv = n.new("ShaderNodeTexWave", Scale=1.4, Distortion=4.0, Detail=2.0)
    wv.bands_direction = "Z"
    n.link(objcoord(n), wv.inputs["Vector"])
    n.link(n.ramp(wv.outputs["Fac"], [(0.0, (0.86, 0.80, 0.68)), (0.45, (0.55, 0.66, 0.70)),
                                      (0.7, (0.20, 0.32, 0.42)), (1.0, (0.88, 0.62, 0.40))]),
           b.inputs["Base Color"])
    b.inputs["Roughness"].default_value = 0.8
    ceil_m = planks("Ceiling_Planks", 0, 1, 0.14, 3.6, (0.93, 0.91, 0.86), (0.86, 0.83, 0.77),
                    rough=0.7, gap=0.004, var=0.05)
    beam_m = planks("Beam_Wood", 1, 0, 0.3, 6.0, (0.55, 0.42, 0.29), (0.40, 0.29, 0.19), rough=0.7,
                    gap=0.0001, var=0.08)
    bpy.data.objects["Ceiling"].data.materials[0] = ceil_m

    # kitchen tweaks
    for nm in ("Kitchen_Counter_Top", "Island_Top"):
        bpy.data.objects[nm].data.materials[0] = marble_m
    bpy.data.objects["Island"].data.materials[0] = navy
    bpy.data.objects["Fridge"].data.materials[0] = steel

    # ---------------- replace the placeholder furniture ----------------
    old = ["Sofa", "Sofa_Back", "Coffee_Table", "Rug", "Media_Wall", "Dining_Table", "Dining_Base",
           "Pendant", "Master_Bed", "Master_Headboard", "Bed2", "Bed2_Headboard", "Lanai_Table",
           "Lounger_0", "Lounger_1", "Daybed", "Desk"]
    old += [f"Chair_{i}" for i in range(4)] + [f"ChairBack_{i}" for i in range(4)]
    kill(old)
    for o in list(bpy.data.collections["Furniture"].objects):
        recenter(o)

    Z = F
    # Great room (x16-36, y22-42), facing the ocean
    p = Piece("Rug_Great")
    p.box(19, 26.2, Z, 32.5, 38, Z + 0.04, rug_m)
    p.build(0)
    sofa("Sofa_Great", 20, 27.0, 31, 30.6, Z, linen, oat, (navy_f, sky_f, sky_f, rust), walnut)
    p = Piece("Console_Table")
    p.box(21, 25.9, Z + 2.55, 30, 26.9, Z + 2.7, walnut)
    for lx in (21.2, 29.8):
        p.box(lx - 0.1, 26.0, Z, lx + 0.1, 26.8, Z + 2.55, walnut)
    p.box(21.2, 26.0, Z + 0.6, 29.8, 26.8, Z + 0.7, walnut)
    table_lamp(p, 22.3, 26.4, Z + 2.7, ceramic, linen, glow)
    table_lamp(p, 28.7, 26.4, Z + 2.7, ceramic, linen, glow)
    p.box(24.5, 26.0, Z + 2.7, 26.5, 26.8, Z + 3.0, rust)          # books
    p.build(0.01)
    p = Piece("Coffee_Table")
    p.box(22.5, 32.3, Z + 1.25, 28.5, 35.0, Z + 1.45, oak)
    p.box(22.8, 32.6, Z + 0.25, 28.2, 34.7, Z + 0.35, oak)
    for lx in (22.8, 28.2):
        for ly in (32.6, 34.7):
            p.cyl(lx, ly, Z, Z + 1.25, 0.1, oak, seg=10)
    p.cyl(24.0, 33.6, Z + 1.45, Z + 1.75, 0.6, ceramic, 0.75, seg=24)   # bowl
    p.cyl(27.0, 33.4, Z + 1.45, Z + 2.5, 0.25, ceramic, 0.18, seg=16)   # vase
    for k in range(6):
        p.cyl(27.0, 33.4, Z + 2.4, Z + 4.0, 0.02, olive_leaf, seg=4,
              rot=(R.uniform(-20, 20), R.uniform(-20, 20), 0))
        p.ell((27.0 + R.uniform(-0.4, 0.4), 33.4 + R.uniform(-0.4, 0.4), Z + R.uniform(3.4, 4.0)),
              (0.25, 0.08, 0.02), olive_leaf, rot=(0, 0, R.uniform(0, 180)), seg=6)
    p.box(25.2, 34.0, Z + 1.45, 26.4, 34.7, Z + 1.7, navy_f)              # coffee-table books
    p.build(0.01)
    armchair("Armchair_L", 18.4, 33.2, Z, -90, oat, linen, rust, walnut)
    armchair("Armchair_R", 32.8, 33.2, Z, 90, oat, linen, navy_f, walnut)
    p = Piece("Side_Tables")
    for sx in (18.4, 32.8):
        p.cyl(sx, 35.6, Z, Z + 1.9, 0.6, rattan, 0.5, seg=20)
    p.build(0)
    p = Piece("Floor_Lamp")
    p.cyl(34.8, 38.6, Z, Z + 0.1, 0.6, black, seg=20)
    p.cyl(34.8, 38.6, Z, Z + 5.2, 0.05, brass, seg=8)
    p.cyl(34.8, 38.6, Z + 5.0, Z + 6.0, 0.8, glow, 0.6, seg=24)
    p.build(0)
    plant("Fig_Tree", 33.0, 40.8, Z, terracotta, leaf, height=7.5, spread=2.4, leaves=60)
    plant("Olive_Tree", 34.8, 23.5, Z, ceramic, olive_leaf, height=6.5, spread=2.0, leaves=70,
          trunk=walnut)
    # ceiling fan + beams (ceiling collection: appears when the ceiling does)
    p = Piece("Great_Beams", "Ceiling")
    for by in (24.5, 29.5, 34.5, 39.5):
        p.box(16.2, by - 0.45, F + 9.25, 35.8, by + 0.45, F + 10.0, beam_m)
    p.build(0.01)
    p = Piece("Ceiling_Fan", "Ceiling")
    p.cyl(26, 32, F + 8.6, F + 10, 0.06, black, seg=8)
    p.cyl(26, 32, F + 8.3, F + 8.75, 0.45, black, 0.35, seg=20)
    for k in range(5):
        a = k * 72
        ca, sa = math.cos(math.radians(a)), math.sin(math.radians(a))
        p.obox((26 + ca * 2.0, 32 + sa * 2.0, F + 8.55), (3.0, 0.55, 0.05), rattan, rot=(0, 4, a))
    p.build(0)
    # art on the left wall of the great room (wall at x=16)
    p = Piece("Art_Great")
    p.box(16.27, 29.0, Z + 3.6, 16.45, 34.5, Z + 7.8, walnut)
    p.box(16.45, 29.2, Z + 3.8, 16.5, 34.3, Z + 7.6, art_m)
    p.build(0.005)

    # Kitchen: backsplash, hood, shelves, pendants, stools
    p = Piece("Backsplash")
    p.box(16.3, 8.26, Z + 3.15, 23.5, 8.32, Z + 5.0, zellige)
    p.build(0)
    p = Piece("Range_Hood")
    p.box(20.0, 8.3, Z + 6.2, 22.6, 10.4, Z + 6.8, ceramic)
    p.obox((21.3, 9.0, Z + 7.7), (1.6, 1.3, 1.8), ceramic)
    p.box(20.2, 8.4, Z + 3.15, 22.4, 10.3, Z + 3.25, black)                # cooktop
    p.build(0.02)
    p = Piece("Open_Shelves")
    for sz in (5.2, 6.4):
        p.box(22.8, 8.3, Z + sz, 23.5, 9.2, Z + sz + 0.12, walnut)
        for k in range(3):
            p.cyl(22.95 + k * 0.22, 8.75, Z + sz + 0.12, Z + sz + 0.6, 0.11, ceramic, seg=12)
    p.build(0.005)
    p = Piece("Island_Pendants")
    for px_ in (21.0, 23.25, 25.5):
        p.cyl(px_, 16.75, F + 6.6, F + 10, 0.015, black, seg=6)
        p.ell((px_, 16.75, F + 6.2), (0.55, 0.55, 0.55), glow, seg=20)
        p.cyl(px_, 16.75, F + 6.65, F + 6.8, 0.18, brass, seg=12)
    p.build(0)
    for i, sx in enumerate((20.6, 23.25, 25.9)):
        stool(f"Stool_{i}", sx, 19.4, Z, walnut, navy_f)
    p = Piece("Kitchen_Props")
    p.cyl(25.0, 16.2, Z + 3.15, Z + 3.45, 0.6, ceramic, 0.8, seg=24)          # fruit bowl
    for k in range(5):
        p.ell((25.0 + R.uniform(-0.35, 0.35), 16.2 + R.uniform(-0.35, 0.35), Z + 3.5), (0.17, 0.17, 0.17),
              plain("Lemon", (0.95, 0.72, 0.12), 0.4), seg=10)
    p.cyl(17.6, 9.2, Z + 3.15, Z + 4.2, 0.08, brass, seg=8)                  # faucet
    p.build(0)

    # Dining (x28-36, y8-20)
    p = Piece("Dining_Table")
    p.box(29.5, 13.0, Z + 2.35, 34.5, 18.0, Z + 2.55, walnut)
    p.cyl(32.0, 15.5, Z, Z + 0.2, 1.2, walnut, seg=24)
    p.cyl(32.0, 15.5, Z + 0.2, Z + 2.35, 0.35, walnut, 0.25, seg=16)
    p.cyl(32.0, 15.5, Z + 2.55, Z + 3.1, 0.3, ceramic, 0.22, seg=16)
    for k in range(8):
        p.cyl(32.0, 15.5, Z + 3.0, Z + 4.6, 0.02, olive_leaf, seg=4,
              rot=(R.uniform(-25, 25), R.uniform(-25, 25), 0))
    p.build(0.015)
    for i, (cx, cy, rot) in enumerate([(30.7, 12.3, 0), (33.3, 12.3, 0), (30.7, 18.7, 180),
                                       (33.3, 18.7, 180)]):
        dining_chair(f"Dining_Chair_{i}", cx, cy, Z, rot, oak, linen)
    p = Piece("Dining_Pendant")
    p.cyl(32, 15.5, F + 7.0, F + 10, 0.015, black, seg=6)
    p.ell((32, 15.5, F + 6.3), (1.3, 1.3, 0.8), rattan, seg=24)
    p.ell((32, 15.5, F + 6.1), (0.4, 0.4, 0.4), bulb, seg=12)
    p.build(0)
    p = Piece("Sideboard")
    p.box(28.4, 8.3, Z, 31.6, 9.8, Z + 2.8, walnut)
    p.cyl(29.2, 9.05, Z + 2.8, Z + 3.9, 0.3, terracotta, 0.2, seg=16)
    p.build(0.02)

    # Master bedroom (x0-16, y26-42), bed on the left wall
    p = Piece("Master_Bed")
    p.box(0.4, 29.3, Z, 1.0, 37.2, Z + 4.4, sage_f)                           # upholstered headboard
    p.box(1.0, 29.6, Z, 8.0, 36.9, Z + 1.2, walnut)                          # frame
    p.box(1.05, 29.7, Z + 1.2, 7.9, 36.8, Z + 2.0, white_bed)                # mattress
    p.box(3.0, 29.55, Z + 1.3, 8.05, 36.95, Z + 2.2, white_bed)              # duvet
    p.box(6.0, 29.5, Z + 1.5, 7.3, 37.0, Z + 2.25, sky_f)                    # throw
    for py in (30.9, 33.25, 35.6):
        p.obox((1.7, py, Z + 2.5), (0.5, 2.0, 1.1), white_bed, rot=(0, -15, 0))
    for py in (31.7, 34.8):
        p.obox((2.2, py, Z + 2.4), (0.45, 1.4, 0.9), sage_f, rot=(0, -12, 0))
    p.build(0.04)
    p = Piece("Master_Nightstands")
    for ny in (27.6, 38.4):
        p.box(0.6, ny - 1.0, Z, 2.4, ny + 1.0, Z + 2.0, oak)
        table_lamp(p, 1.5, ny, Z + 2.0, ceramic, linen, glow)
    p.build(0.01)
    p = Piece("Master_Rug")
    p.box(3.5, 28.0, Z, 11.5, 38.5, Z + 0.04, jute)
    p.build(0)
    p = Piece("Master_Bench")
    p.box(8.6, 30.5, Z + 1.3, 10.0, 36.0, Z + 1.7, linen)
    for ly in (30.8, 35.7):
        p.box(8.8, ly - 0.1, Z, 9.8, ly + 0.1, Z + 1.3, walnut)
    p.build(0.02)
    lounge_chair("Master_Chair", 13.0, 39.5, Z, 160, walnut, oat)
    plant("Master_Plant", 14.8, 27.4, Z, ceramic, leaf, height=5.0, spread=1.5, leaves=35)

    # Bedroom 2 (x36-50, y28-42), bed on the right wall
    p = Piece("Bed2")
    p.box(49.0, 32.3, Z, 49.6, 38.7, Z + 4.0, oak)
    p.box(42.2, 32.6, Z, 49.0, 38.4, Z + 1.2, oak)
    p.box(42.3, 32.7, Z + 1.2, 48.9, 38.3, Z + 2.0, white_bed)
    p.box(42.1, 32.55, Z + 1.3, 47.0, 38.45, Z + 2.2, sky_f)
    for py in (34.0, 37.0):
        p.obox((48.3, py, Z + 2.45), (0.5, 2.2, 1.1), white_bed, rot=(0, 15, 0))
    p.build(0.04)
    p = Piece("Bed2_Nightstand")
    p.box(48.0, 30.5, Z, 49.6, 32.0, Z + 2.0, oak)
    table_lamp(p, 48.8, 31.25, Z + 2.0, ceramic, linen, glow)
    p.build(0.01)
    p = Piece("Bed2_Rug")
    p.box(40.0, 31.0, Z, 47.5, 40.0, Z + 0.04, rug_m)
    p.build(0)

    # Study (x36-50, y8-20)
    p = Piece("Study_Desk")
    p.box(44.5, 8.8, Z + 2.4, 49.6, 11.6, Z + 2.55, walnut)
    for lx in (44.7, 49.4):
        p.box(lx - 0.1, 8.9, Z, lx + 0.1, 11.5, Z + 2.4, black)
    table_lamp(p, 48.8, 9.5, Z + 2.55, brass, linen, glow)
    p.build(0.01)
    dining_chair("Study_Chair", 47.0, 12.8, Z, 180, oak, navy_f)
    sofa("Study_Daybed", 37.2, 15.6, 43.4, 19.4, Z, sage_f, linen, (sky_f, rust, rust, sky_f), oak,
         facing="-y")
    p = Piece("Study_Shelves")
    p.box(36.3, 9.0, Z, 37.4, 14.0, Z + 7.0, oak)
    for sz in (1.5, 3.0, 4.5, 6.0):
        for k in range(8):
            h = R.uniform(0.7, 1.1)
            col = R.choice([navy_f, rust, linen, sage_f, ceramic])
            p.box(36.4, 9.2 + k * 0.55, Z + sz, 37.2, 9.2 + k * 0.55 + 0.45, Z + sz + h, col)
    p.build(0.005)

    # Laundry / baths small upgrades
    p = Piece("Bath_Mirrors")
    p.box(0.3, 17.0, Z + 4.0, 0.45, 22.0, Z + 7.0, plain("Mirror", (0.9, 0.9, 0.9), 0.02, metal=1.0))
    p.box(36.3, 20.6, Z + 4.0, 36.45, 22.0, Z + 7.0, bpy.data.materials["Mirror"])
    p.build(0)

    # ---------------- front porch + exterior details ----------------
    p = Piece("Shutters", "Exterior")
    for cx, w in ((8, 3), (20, 4), (32.5, 4), (43, 4)):
        for side in (-1, 1):
            if (cx, side) in ((20, 1), (32.5, -1)):
                continue                    # no shutter crowding the front door
            x0 = cx + side * (w / 2) + (0.15 if side > 0 else -1.75)
            p.box(x0, 7.5, F + 2.4, x0 + 1.6, 7.68, F + 8.1, shutter)
            for k in range(14):
                z = F + 2.7 + k * 0.38
                p.box(x0 + 0.15, 7.42, z, x0 + 1.45, 7.5, z + 0.12, shutter)
    p.build(0.004)
    p = Piece("Porch_Lanterns", "Furniture")
    for lx in (23.2, 28.8):
        p.box(lx - 0.12, 7.5, F + 5.7, lx + 0.12, 7.68, F + 6.0, black)
        p.box(lx - 0.2, 7.2, F + 6.0, lx + 0.2, 7.6, F + 6.65, glow)
        p.box(lx - 0.24, 7.16, F + 6.65, lx + 0.24, 7.64, F + 6.75, black)
    p.build(0.005)
    for i, (rx, rot) in enumerate(((13.5, 200), (36.5, 160))):
        armchair(f"Porch_Chair_{i}", rx, 4.0, F, rot, teak, sky_f, navy_f, teak)
    plant("Porch_Plant_L", 20.6, 6.4, F, terracotta, leaf, height=4.2, spread=1.4, leaves=30)
    plant("Porch_Plant_R", 31.4, 6.4, F, terracotta, leaf, height=4.2, spread=1.4, leaves=30)

    # ---------------- rear lanai ----------------
    # route keeps x18-24, y42-47 clear; the final view looks over x14-26
    lounge_chair("Lanai_Lounge_L", 16.0, 50.8, F, 0, teak, navy_f)
    lounge_chair("Lanai_Lounge_R", 24.0, 50.8, F, 0, teak, sky_f)
    p = Piece("Lanai_Side_Table")
    p.cyl(20.0, 51.3, F, F + 1.5, 0.75, teak, seg=20)
    p.cyl(20.0, 51.3, F + 1.5, F + 1.9, 0.2, glow, 0.25, seg=12)              # candle lantern
    p.build(0)
    p = Piece("Lanai_Dining")
    p.box(29.0, 46.0, F + 2.4, 37.0, 49.6, F + 2.6, teak)
    for lx in (29.4, 36.6):
        for ly in (46.4, 49.2):
            p.box(lx - 0.15, ly - 0.15, F, lx + 0.15, ly + 0.15, F + 2.4, teak)
    p.build(0.015)
    for i, (cx, cy, r) in enumerate([(30.6, 45.2, 0), (33.0, 45.2, 0), (35.4, 45.2, 0),
                                     (30.6, 50.4, 180), (33.0, 50.4, 180), (35.4, 50.4, 180)]):
        dining_chair(f"Lanai_Chair_{i}", cx, cy, F, r, teak, sky_f)
    sofa("Lanai_Sofa", 3.0, 44.0, 11.0, 47.2, F, teak, navy_f, (sky_f, rust, rust, sky_f), teak)
    p = Piece("Lanai_Ottoman")
    p.box(4.5, 48.5, F, 9.5, 51.0, F + 1.4, teak)
    p.build(0.03)
    for i, (px_, py_) in enumerate(((1.6, 52.8), (13.2, 52.6), (27.0, 52.6), (47.8, 52.8), (38.6, 44.0))):
        plant(f"Lanai_Palm_{i}", px_, py_, F, terracotta, frond, height=5.5, spread=2.2, leaves=36)
    p = Piece("Lanai_Lanterns")
    for lx in (6.0, 13.0, 33.0, 44.0):
        p.cyl(lx, 47.5, F + 8.2, F + 10.2, 0.02, black, seg=6)
        p.cyl(lx, 47.5, F + 7.2, F + 8.2, 0.42, glow, 0.38, seg=6)
        p.cyl(lx, 47.5, F + 8.2, F + 8.35, 0.5, black, 0.2, seg=6)
    p.build(0)

    # ---------------- landscaping ----------------
    for i, (x, y, h, lean) in enumerate([(-22, 18, 30, (3, 2.6)), (-18, 46, 36, (5, 2.2)),
                                         (-26, 64, 26, (4, 1.6)), (74, 14, 32, (4, 0.4)),
                                         (70, 50, 38, (6, 0.9)), (78, 70, 28, (3, 0.5)),
                                         (5, -23, 24, (2, 3.6)), (46, -25, 27, (3, -0.4)),
                                         (-35, 120, 34, (6, 2.0)), (88, 128, 30, (5, 1.0))]):
        palm(f"Palm_{i}", x, y, -3, h, (lean[0], lean[1]), palm_trunk, frond)
    p = Piece("Dune_Grass_Clumps", "Site")
    for _ in range(70):
        x = R.uniform(-60, 110)
        y = R.uniform(70, 115)
        if 36 < x < 50:
            continue                                                       # keep the boardwalk clear
        grass_clump(p, x, y, -3.0, beach_grass, n=10, h=R.uniform(1.8, 3.0))
    for _ in range(18):
        x, y = R.choice([(-10, R.uniform(-5, 60)), (60, R.uniform(-5, 60))])
        grass_clump(p, x + R.uniform(-4, 4), y, -3.0, beach_grass, n=8, h=2.2)
    p.build(0)
    # beach umbrella + two chairs near the water, in the final view
    p = Piece("Beach_Umbrella", "Site")
    p.cyl(30, 140, -3, 4.5, 0.06, plain("Pole_White", (0.9, 0.9, 0.88), 0.4), seg=8)
    p.cyl(30, 140, 3.4, 4.6, 4.2, fabric("Umbrella_Stripe", (0.93, 0.90, 0.84), stripe=(0.75, 0.30, 0.14),
                                         stripe_scale=4.0), 0.1, seg=16)
    p.build(0)
    lounge_chair("Beach_Chair_L", 28.4, 141.5, -3.0, 10, teak, sky_f)
    lounge_chair("Beach_Chair_R", 31.8, 141.5, -3.0, -10, teak, sky_f)

    # bigger ocean so the horizon is a clean line, and the sun sits on it
    o = bpy.data.objects["Ocean"]
    for v in o.data.vertices:
        if v.co.y > 1000:
            v.co.y = 90000 * FT
        v.co.x = math.copysign(90000 * FT, v.co.x)

    # ---------------- interior lights: warm 2700K, lower ----------------
    G["coll"]("Lights")
    tw = bpy.data.materials.get("Table_Walnut")
    if tw:
        planks("Table_Walnut", 0, 1, 0.16, 3.0, (0.36, 0.22, 0.13), (0.22, 0.13, 0.07), rough=0.3,
               gap=0.0008, var=0.08, coat=0.4)
    tl = bpy.data.objects.get("Table_Lamp")
    if tl:
        tl.data.energy = 90
        tl.data.color = (1.0, 0.72, 0.45)
    for nm, x, y, z, e in [("Lamp_Console", 25.5, 26.4, F + 5.5, 25), ("Lamp_Floor", 34.8, 38.6, F + 5.5, 25),
                           ("Lamp_Island", 23.25, 16.75, F + 5.8, 35), ("Lamp_Dining", 32, 15.5, F + 5.6, 30),
                           ("Lamp_Lanai", 20.0, 47.5, F + 7.0, 30), ("Lamp_Porch", 26.0, 6.5, F + 6.5, 30)]:
        L = bpy.data.objects.new(nm, bpy.data.lights.new(nm, "POINT"))
        L.data.energy = e
        L.data.color = (1.0, 0.62, 0.32)
        L.data.shadow_soft_size = 0.2
        L.location = Vector((x, y, z)) * FT
        bpy.data.collections["Lights"].objects.link(L)

    golden_hour(scene)


# ------------------------------------------------------------------
# golden hour: sky, sun, clouds, grade
# ------------------------------------------------------------------
def warm_lights():
    """Room fill lights (added later by the film script): warm 2700K and dimmer."""
    for L in bpy.data.collections["Lights"].objects:
        if L.data.type == "AREA":
            L.data.color = (1.0, 0.72, 0.45)
            L.data.energy *= 0.6


def sun_vec(el):
    return Vector((math.sin(SUN_AZ) * math.cos(el), math.cos(SUN_AZ) * math.cos(el), math.sin(el)))


def golden_hour(scene):
    world = bpy.data.worlds.new("Golden_Hour")
    scene.world = world
    world.use_nodes = True
    t = world.node_tree
    for nd in list(t.nodes):
        t.nodes.remove(nd)
    n = NT(t)
    out = t.nodes.new("ShaderNodeOutputWorld")
    bg = t.nodes.new("ShaderNodeBackground")
    t.links.new(bg.outputs[0], out.inputs[0])
    bg.inputs["Strength"].default_value = 1.0

    tc = t.nodes.new("ShaderNodeTexCoord")
    dirn = n.vmath("NORMALIZE", tc.outputs["Generated"]).outputs[0]
    d = n.xyz(dirn)
    z = d[2]
    s = sun_vec(SUN_DISK_EL)
    dot = n.vmath("DOT_PRODUCT", dirn, tuple(s)).outputs["Value"]
    dotp = n.math("MAXIMUM", dot, 0.0)

    # sky gradient by elevation
    elev = n.maprange(z, 0.0, 0.75, 0.0, 1.0)
    below = n.maprange(z, -0.02, 0.0, 0.0, 1.0)
    # glow around the sun, wide and tight
    g1 = n.math("POWER", dotp, 6.0)
    g2 = n.math("POWER", dotp, 90.0)
    g3 = n.math("POWER", dotp, 1200.0)
    halo = n.math("ADD", n.math("MULTIPLY", g1, 0.45), n.math("ADD", n.math("MULTIPLY", g2, 1.1),
                                                               n.math("MULTIPLY", g3, 2.5)))
    base = n.ramp(elev, [(0.0, (1.0, 0.30, 0.05)), (0.035, (0.95, 0.36, 0.09)), (0.12, (0.85, 0.38, 0.17)),
                         (0.30, (0.58, 0.28, 0.32)), (0.55, (0.32, 0.22, 0.34)), (1.0, (0.16, 0.14, 0.27))])
    base = n.mix(below, (0.30, 0.12, 0.05), base)
    hsum = n.new("ShaderNodeVectorMath")
    hsum.operation = "SCALE"
    hsum.inputs[0].default_value = (1.0, 0.32, 0.06)
    n.link(n.math("MINIMUM", halo, 12.0), hsum.inputs["Scale"])
    skyc = n.vmath("ADD", base, hsum.outputs[0]).outputs[0]

    # wavy clouds on a sky plane
    zz = n.math("ADD", n.math("MAXIMUM", z, 0.0), 0.04)
    u = n.math("DIVIDE", d[0], zz)
    v = n.math("DIVIDE", d[1], zz)
    # stretched across x so the bands lie parallel to the horizon, waving gently
    pc = n.combine(n.math("MULTIPLY", u, 0.06), n.math("MULTIPLY", v, 0.22), 0.0)
    wave = n.new("ShaderNodeTexWave", Scale=1.0, Distortion=4.0, Detail=4.0, **{"Detail Scale": 1.2,
                                                                                   "Detail Roughness": 0.55})
    wave.wave_type = "BANDS"
    wave.bands_direction = "Y"
    n.link(pc, wave.inputs["Vector"])
    nz = n.new("ShaderNodeTexNoise", Scale=0.5, Detail=4.0, Roughness=0.55)
    n.link(pc, nz.inputs["Vector"])
    fine = n.new("ShaderNodeTexNoise", Scale=6.0, Detail=6.0, Roughness=0.6)
    n.link(pc, fine.inputs["Vector"])
    w = n.math("ADD", wave.outputs["Fac"], n.math("MULTIPLY", fine.outputs["Fac"], 0.35))
    dens = n.math("MULTIPLY", n.maprange(w, 0.55, 0.95, 0.0, 1.0, True),
                  n.maprange(nz.outputs["Fac"], 0.35, 0.6, 0.0, 1.0, True))
    band = n.math("MULTIPLY", n.maprange(z, 0.012, 0.05, 0.0, 1.0, True),
                  n.maprange(z, 0.55, 0.2, 0.0, 1.0, True))
    cover = n.math("MULTIPLY", dens, band)
    # clear a little window around the sun so it reads
    sunclear = n.maprange(dot, 0.9975, 0.99975, 1.0, 0.25, True)
    cover = n.math("MULTIPLY", cover, sunclear)
    # cloud colour: bright orange-gold toward the sun, rose-violet away from it
    near = n.math("POWER", dotp, 3.0)
    ccol = n.ramp(near, [(0.0, (0.42, 0.14, 0.16)), (0.3, (0.88, 0.28, 0.10)), (0.7, (1.0, 0.42, 0.08)),
                         (1.0, (1.0, 0.58, 0.20))])
    lit = n.new("ShaderNodeVectorMath")
    lit.operation = "SCALE"
    n.link(ccol, lit.inputs[0])
    n.link(n.math("ADD", n.math("MULTIPLY", near, 1.8), 0.8), lit.inputs["Scale"])
    skyc = n.mix(n.math("MULTIPLY", cover, 0.92), skyc, lit.outputs[0])

    # the sun disc itself (half of it is under the ocean)
    cosr = math.cos(SUN_RADIUS)
    disk = n.maprange(dot, math.cos(SUN_RADIUS * 1.06), cosr, 0.0, 1.0, True)
    above = n.maprange(z, -0.0005, 0.0005, 0.0, 1.0)
    disk = n.math("MULTIPLY", disk, above)
    core = n.new("ShaderNodeVectorMath")
    core.operation = "SCALE"
    core.inputs[0].default_value = (1.0, 0.30, 0.03)
    n.link(n.math("MULTIPLY", disk, 4.0), core.inputs["Scale"])
    final = n.vmath("ADD", skyc, core.outputs[0]).outputs[0]
    t.links.new(final, bg.inputs["Color"])

    # sun lamp, low and orange
    for o in list(bpy.data.objects):
        if o.type == "LIGHT" and o.data.type == "SUN":
            bpy.data.objects.remove(o, do_unlink=True)
    sun = bpy.data.objects.new("Sun_Golden", bpy.data.lights.new("Sun_Golden", "SUN"))
    sun.data.energy = 4.5
    sun.data.color = (1.0, 0.42, 0.14)
    sun.data.angle = math.radians(1.5)
    sun.visible_glossy = False      # the water reflects the orange disc in the sky, not a white hotspot
    q = (-sun_vec(SUN_LAMP_EL)).to_track_quat("-Z", "Y")
    sun.rotation_euler = q.to_euler()
    scene.collection.objects.link(sun)

    # colour grade: AgX punchy, warm white balance, gentle teal-shadow / orange-highlight curve
    vs = scene.view_settings
    vs.view_transform = "AgX"
    vs.look = "AgX - Punchy"
    vs.use_white_balance = True
    vs.white_balance_temperature = 5600
    vs.white_balance_tint = 6
    vs.use_curve_mapping = True
    cm = vs.curve_mapping
    cm.initialize()
    curves = cm.curves  # C, R, G, B

    def setc(c, pts):
        while len(c.points) > 2:
            c.points.remove(c.points[1])
        c.points[0].location = pts[0]
        c.points[-1].location = pts[-1]
        for pt in pts[1:-1]:
            c.points.new(*pt)

    setc(curves[0], [(0, 0.02), (0.25, 0.21), (0.75, 0.80), (1, 1)])     # soft S, lifted blacks
    setc(curves[1], [(0, 0), (0.5, 0.56), (1, 1)])                        # warmer mids and highlights
    setc(curves[2], [(0, 0), (0.5, 0.49), (1, 0.97)])
    setc(curves[3], [(0, 0.03), (0.4, 0.36), (1, 0.85)])                  # teal shadows, gold highs
    cm.update()
