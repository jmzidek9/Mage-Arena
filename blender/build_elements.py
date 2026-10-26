# Builds every element's spell assets procedurally: a unique spell circle per element (ring_outer, runes,
# ring_inner, sigil, so the game can counter-rotate them) plus the projectile / wall / turret / summon meshes
# their 5 moves use. Exports assets/elements.glb, saves blender/elements.blend, renders previews.
# Run: blender --background --factory-startup --python blender/build_elements.py
# Conventions: projectiles face Blender -Y (three.js +Z); ground things stand on z=0; names are "<element>__<part>".
# Materials named <el>_glow / <el>_core are swapped in-game for additive energy shaders tinted per element.
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from lib import *

random.seed(11)
scene = reset()

ELS = {  # glow, core
    'fire': ((1.0, 0.3, 0.04), (1.0, 0.78, 0.35)),
    'frost': ((0.25, 0.75, 1.0), (0.8, 0.97, 1.0)),
    'storm': ((0.65, 0.45, 1.0), (0.95, 0.9, 1.0)),
    'water': ((0.05, 0.4, 1.0), (0.6, 0.9, 1.0)),
    'earth': ((0.9, 0.55, 0.15), (1.0, 0.85, 0.5)),
    'wind': ((0.6, 1.0, 0.8), (0.92, 1.0, 0.96)),
    'nature': ((0.25, 0.95, 0.2), (0.85, 1.0, 0.6)),
    'shadow': ((0.45, 0.05, 0.75), (0.8, 0.45, 1.0)),
    'light': ((1.0, 0.9, 0.5), (1.0, 1.0, 0.92)),
    'venom': ((0.6, 1.0, 0.05), (0.92, 1.0, 0.5)),
    'steel': ((0.65, 0.78, 0.95), (1.0, 1.0, 1.0)),
    'magma': ((1.0, 0.12, 0.02), (1.0, 0.6, 0.1)),
    'crystal': ((1.0, 0.35, 0.85), (1.0, 0.85, 1.0)),
    'sonic': ((0.15, 0.95, 1.0), (0.85, 1.0, 1.0)),
    'gravity': ((0.55, 0.1, 1.0), (0.9, 0.6, 1.0)),
    'chrono': ((1.0, 0.7, 0.2), (1.0, 0.95, 0.7)),
    'blood': ((0.9, 0.02, 0.08), (1.0, 0.4, 0.4)),
    'spirit': ((0.35, 1.0, 0.75), (0.85, 1.0, 1.0)),
    'cosmic': ((0.3, 0.35, 1.0), (1.0, 0.9, 1.0)),
    'explosion': ((1.0, 0.55, 0.05), (1.0, 0.95, 0.6)),
}
G = {k: (mat(k + '_glow', g, emit=6), mat(k + '_core', c, emit=10)) for k, (g, c) in ELS.items()}

# solid (PBR) materials
ice = mat('ice_solid', (0.55, 0.85, 1.0), emit=1.2, ecolor=(0.3, 0.8, 1.0), rough=0.05)
rockm = mat('el_rock', (0.26, 0.22, 0.2), rough=0.92)
basalt = mat('basalt', (0.07, 0.06, 0.06), rough=0.85)
metal = mat('el_metal', (0.62, 0.64, 0.7), rough=0.25, metal=1)
darkmetal = mat('dark_metal', (0.08, 0.08, 0.1), rough=0.35, metal=0.9)
copper = mat('copper', (0.85, 0.42, 0.2), rough=0.3, metal=1)
goldm = mat('el_gold', (0.95, 0.68, 0.25), rough=0.3, metal=1)
bark = mat('bark', (0.2, 0.12, 0.07), rough=0.9)
leaf = mat('leaf', (0.07, 0.3, 0.06), rough=0.7, emit=0.12, ecolor=(0.3, 1.0, 0.2))
leaf2 = mat('leaf_light', (0.16, 0.42, 0.08), rough=0.7, emit=0.18, ecolor=(0.5, 1.0, 0.25))
blossom = mat('blossom', (1.0, 0.55, 0.8), emit=1.5)
trapm = mat('trap_skin', (0.25, 0.55, 0.12), rough=0.5)
trapin = mat('trap_inside', (0.75, 0.1, 0.15), rough=0.4, emit=0.8, ecolor=(1, 0.2, 0.2))
cryst = mat('crystal_solid', (1.0, 0.5, 0.9), emit=1.5, ecolor=(1.0, 0.3, 0.8), rough=0.05)
void = mat('void', (0.0, 0.0, 0.0), rough=0.2)
moonm = mat('moon_rock', (0.6, 0.62, 0.7), rough=0.9, emit=0.3, ecolor=(0.6, 0.7, 1.0))
cloudm = mat('cloud_solid', (0.35, 0.36, 0.45), rough=1)
glass = mat('glass', (0.9, 0.95, 1.0), emit=0.5, rough=0.05, alpha=0.4)
sandm = mat('sand', (0.95, 0.75, 0.4), emit=1.5)
wrap = mat('leather', (0.15, 0.08, 0.05), rough=0.8)
redpaint = mat('red_paint', (0.6, 0.05, 0.05), rough=0.4, metal=0.3)
olive = mat('olive_metal', (0.18, 0.22, 0.12), rough=0.5, metal=0.6)

ALL = []          # every top-level exported object
BY_EL = {}        # element -> objects, for preview renders
_slot = {}


def put(el, ob):
    """Lay objects out in a row per element (for previews) and remember them for export."""
    row = list(ELS).index(el) if el in ELS else len(ELS)
    k = _slot.get(el, 0)
    _slot[el] = k + 1
    ob.location = (k * 4.5, row * 6.0 + 40, 0)
    ALL.append(ob)
    BY_EL.setdefault(el, []).append(ob)
    return ob


C = coll('elements')


def M(name, **kw):
    return Mesh(name, C, **kw)


# ---------- 2D glyph helpers for circles ----------
def arcpts(r, a0, a1, n=24, c=(0, 0)):
    return [(c[0] + r * math.cos(a0 + (a1 - a0) * i / n), c[1] + r * math.sin(a0 + (a1 - a0) * i / n)) for i in range(n + 1)]


def starpts(n, r0, r1, rot=0, c=(0, 0)):
    return [(c[0] + (r1 if i % 2 == 0 else r0) * math.cos(rot + math.pi * i / n), c[1] + (r1 if i % 2 == 0 else r0) * math.sin(rot + math.pi * i / n)) for i in range(2 * n)]


def rotp(p, a, c=(0, 0)):
    x, y = p[0] - c[0], p[1] - c[1]
    return (c[0] + x * math.cos(a) - y * math.sin(a), c[1] + x * math.sin(a) + y * math.cos(a))


def lens(p, q, w, n=8):
    """Leaf / eye shape between points p and q."""
    p, q = Vector(p), Vector(q)
    d = q - p
    nrm = Vector((-d.y, d.x)).normalized()
    top = [tuple(p + d * (i / n) + nrm * w * math.sin(math.pi * i / n)) for i in range(n + 1)]
    bot = [tuple(p + d * (i / n) - nrm * w * math.sin(math.pi * i / n)) for i in range(n - 1, 0, -1)]
    return top + bot


def crescent(c, r, th, rot=0, n=20):
    outer = arcpts(r, rot - 2.2, rot + 2.2, n, c)
    inner_c = (c[0] + math.cos(rot) * th, c[1] + math.sin(rot) * th)
    inner = arcpts(r * 0.85, rot + 1.95, rot - 1.95, n, inner_c)
    return outer + inner


# ---------- element spell circles ----------
def rim(o, el, g, h, rng):
    st = el
    if st == 'fire':
        for i in range(12):
            a = TAU * i / 12
            o.flat(g, [pol(1.0, a - 0.07), pol(1.14, a + 0.06), pol(1.0, a + 0.07)])
    elif st == 'frost':
        for i in range(12):
            a = TAU * i / 12
            o.flat(g, [pol(1.02, a), pol(1.07, a + 0.035), pol(1.12, a), pol(1.07, a - 0.035)])
    elif st == 'storm':
        o.polyline(g, [pol(1.03 if i % 2 else 1.09, TAU * i / 64) for i in range(64)], 0.014, closed=True)
    elif st == 'water':
        for ph in (0, math.pi):
            o.polyline(g if ph else h, [pol(1.065 + 0.035 * math.sin(10 * TAU * i / 160 + ph), TAU * i / 160) for i in range(160)], 0.012, closed=True)
    elif st == 'earth':
        for i in range(24):
            a0, a1 = TAU * i / 24, TAU * (i + 0.55) / 24
            o.flat(g, [pol(1.01, a0), pol(1.01, a1), pol(1.08 if i % 2 else 1.12, a1), pol(1.08 if i % 2 else 1.12, a0)])
    elif st == 'wind':
        for i in range(8):
            a = TAU * i / 8
            o.polyline(g, [pol(1.0 + 0.016 * t, a + 0.04 * t) for t in range(9)] + [pol(1.12 - 0.012 * t, a + 0.32 + 0.05 * t) for t in range(5)], 0.012)
    elif st == 'nature':
        for i in range(12):
            a = TAU * i / 12
            o.flat(g, lens(pol(1.0, a), pol(1.16, a + 0.05), 0.03))
            o.stroke(h, pol(1.01, a), pol(1.13, a + 0.04), 0.005)
    elif st == 'shadow':
        for i in range(8):
            a = TAU * i / 8
            o.flat(g, crescent(pol(1.08, a), 0.05, 0.022, a))
    elif st == 'light':
        for i in range(24):
            a = TAU * i / 24
            L = 1.2 if i % 2 == 0 else 1.1
            o.flat(g if i % 2 == 0 else h, [pol(1.0, a - 0.03), pol(L, a), pol(1.0, a + 0.03)])
    elif st == 'venom':
        for i in range(12):
            a = TAU * i / 12
            cx, cy = pol(1.1, a)
            o.flat(g, [pol(1.0, a)] + [(cx + 0.035 * math.cos(a + math.pi / 2 + math.pi * t / 8), cy + 0.035 * math.sin(a + math.pi / 2 + math.pi * t / 8)) for t in range(-0, 9)][::-1] + [])
    elif st == 'steel':
        for i in range(24):
            a = TAU * i / 24
            o.flat(g, [pol(1.0, a - 0.1), pol(1.09, a - 0.06), pol(1.09, a + 0.06), pol(1.0, a + 0.1)])
    elif st == 'magma':
        for i in range(18):
            a = TAU * i / 18 + rng.uniform(-0.05, 0.05)
            o.flat(g, [pol(1.0, a - 0.08), pol(rng.uniform(1.1, 1.22), a + rng.uniform(-0.04, 0.04)), pol(1.0, a + 0.08)])
    elif st == 'crystal':
        for i in range(32):
            a0, a1 = TAU * i / 32, TAU * (i + 1) / 32
            if i % 2:
                o.flat(g, [pol(1.01, a0), pol(1.01, a1), pol(1.1, (a0 + a1) / 2)])
            else:
                o.flat(h, [pol(1.1, a0), pol(1.1, a1), pol(1.03, (a0 + a1) / 2)])
    elif st == 'sonic':
        for i in range(60):
            a = TAU * i / 60
            hh = 0.03 + 0.09 * abs(math.sin(i * 1.7) * math.cos(i * 0.4))
            o.stroke(g, pol(1.01, a), pol(1.01 + hh, a), 0.022)
    elif st == 'gravity':
        o.annulus(h, 1.095, 1.105, n=96)
        for i in range(5):
            o.dot(g, pol(1.1, TAU * i / 5 + 0.3), 0.03 + 0.012 * (i % 2))
        o.polyline(g, [(1.18 * math.cos(TAU * i / 96), 1.06 * math.sin(TAU * i / 96)) for i in range(96)], 0.006, closed=True)
    elif st == 'chrono':
        for i in range(60):
            a = TAU * i / 60
            big = i % 5 == 0
            o.stroke(g if big else h, pol(1.01, a), pol(1.12 if big else 1.06, a), 0.03 if big else 0.008)
        for i in range(12):
            o.dot(h, pol(1.17, TAU * i / 12), 0.018)
    elif st == 'blood':
        for i in range(12):
            a = TAU * i / 12
            o.polyline(g, [pol(1.0, a), pol(1.08, a + 0.03), pol(1.13, a + 0.1), pol(1.11, a + 0.16)], 0.016)
    elif st == 'spirit':
        for i in range(16):
            a = TAU * i / 16
            o.polyline(g, [pol(1.0 + 0.012 * t, a + 0.025 * math.sin(t * 1.3)) for t in range(12)], 0.009)
    elif st == 'cosmic':
        for i in range(8):
            a = TAU * i / 8
            o.flat(g, starpts(4, 0.012, 0.055, a, pol(1.1, a)))
        for i in range(24):
            o.dot(h, pol(1.05 + 0.08 * ((i * 7) % 3) / 2, TAU * i / 24 + 0.13), 0.007)
    elif st == 'explosion':
        for i in range(16):
            a = TAU * i / 16
            o.flat(g, [pol(1.0, a - 0.06), pol(1.16 if i % 2 else 1.1, a), pol(1.0, a + 0.06)])
            o.dot(h, pol(1.06, a + TAU / 32), 0.012)


def sigil(s, el, g, h, rng):
    z = 0.006
    st = el
    if st == 'fire':
        for k in range(2):
            s.polyline(g, [pol(0.52, math.pi / 2 + k * math.pi + i * TAU / 3) for i in range(3)], 0.026, z, True)
        for i in range(6):
            a0 = TAU * i / 6
            s.polyline(h, [pol(0.16 + t * 0.06, a0 + t * 0.22) for t in range(6)], 0.014, z)
    elif st == 'frost':
        s.polyline(g, [pol(0.5, TAU * i / 6) for i in range(6)], 0.022, z, True)
        for i in range(6):
            a = TAU * i / 6
            s.stroke(h, pol(0.14, a), pol(0.46, a), 0.018, z)
            for t in (0.28, 0.38):
                px, py = pol(t, a)
                for sgn in (1, -1):
                    s.stroke(h, (px, py), (px + 0.08 * math.cos(a + sgn * math.pi / 4), py + 0.08 * math.sin(a + sgn * math.pi / 4)), 0.012, z)
    elif st == 'storm':
        s.polyline(g, [pol(0.52 if i % 2 == 0 else 0.24, TAU * i / 16) for i in range(16)], 0.022, z, True)
        for i in range(4):
            a = TAU * i / 4 + TAU / 8
            s.polyline(h, [pol(0.14 + t * 0.09, a + (0.035 * (1 if t % 2 else -1)) / (0.14 + t * 0.09)) for t in range(5)], 0.014, z)
    elif st == 'water':
        for k in range(3):
            a = TAU * k / 3 + math.pi / 2
            pts = [rotp((-0.28 + 0.56 * t / 30, 0.22 + 0.06 * math.sin(t / 30 * TAU * 1.5)), a) for t in range(31)]
            s.polyline(g, pts, 0.02, z)
            s.polyline(h, [rotp((x * 0.8, y - 0.08), 0) for x, y in pts], 0.01, z)
        s.flat(h, [(0, 0.12)] + arcpts(0.07, math.pi * 0.15, math.pi * 0.85 - TAU, 16, (0, 0.02))[::-1], z)
        s.annulus(g, 0.5, 0.515, z, 96)
    elif st == 'earth':
        for rot in (0, math.pi / 4):
            s.polyline(g, [pol(0.5, rot + math.pi / 4 + TAU * i / 4) for i in range(4)], 0.024, z, True)
        s.polyline(h, [(-0.22, -0.13), (0, 0.24), (0.22, -0.13)], 0.022, z, True)
        s.polyline(h, [(-0.1, 0.07), (0.0, 0.0), (0.1, 0.07)], 0.014, z)
    elif st == 'wind':
        for k in range(3):
            a0 = TAU * k / 3
            s.polyline(g, [pol(0.02 + 0.018 * t, a0 + 0.24 * t) for t in range(26)], 0.02, z)
        s.annulus(h, 0.5, 0.512, z, 96)
    elif st == 'nature':
        s.ring2d(g, (0, 0), 0.17, 0.014, z)
        for i in range(6):
            s.ring2d(g, pol(0.17, TAU * i / 6), 0.17, 0.012, z)
        s.ring2d(h, (0, 0), 0.5, 0.02, z, 64)
        for i in range(6):
            s.flat(h, lens(pol(0.36, TAU * i / 6 + TAU / 12), pol(0.48, TAU * i / 6 + TAU / 12), 0.04), z)
    elif st == 'shadow':
        s.flat(g, crescent((0, 0), 0.42, 0.14, math.pi), z)
        s.polyline(h, lens((-0.2, 0), (0.2, 0), 0.1), 0.014, z, True)
        s.dot(h, (0, 0), 0.05, z)
    elif st == 'light':
        s.ring2d(g, (0, 0), 0.2, 0.03, z, 48)
        for i in range(12):
            a = TAU * i / 12
            s.flat(h if i % 2 else g, [pol(0.25, a - 0.08), pol(0.48 if i % 2 == 0 else 0.38, a), pol(0.25, a + 0.08)], z)
        s.ring2d(g, (0, 0), 0.52, 0.012, z, 96)
    elif st == 'venom':
        pts = [(0.3 * math.sin(t / 30 * TAU * 0.9), -0.4 + 0.75 * t / 30) for t in range(31)]
        s.polyline(g, pts, 0.032, z)
        s.flat(g, lens((pts[-1][0] - 0.02, pts[-1][1] - 0.04), (pts[-1][0] + 0.02, pts[-1][1] + 0.12), 0.06), z)
        for sx in (-1, 1):
            s.flat(h, [(sx * 0.28, 0.18), (sx * 0.31, 0.08)] + arcpts(0.035, 0.2 * math.pi, -1.2 * math.pi, 10, (sx * 0.28, 0.06))[1:], z)
        s.ring2d(h, (0, 0), 0.5, 0.014, z, 96)
    elif st == 'steel':
        for sgn in (1, -1):
            a = math.pi / 4 * sgn + math.pi / 2
            d, n = Vector((math.cos(a), math.sin(a))), Vector((-math.sin(a), math.cos(a)))
            s.flat(g, [tuple(-d * 0.3 + n * 0.025), tuple(d * 0.42), tuple(-d * 0.3 - n * 0.025)], z)
            s.stroke(h, tuple(-d * 0.3 + n * 0.08), tuple(-d * 0.3 - n * 0.08), 0.022, z)
            s.stroke(h, tuple(-d * 0.3), tuple(-d * 0.45), 0.02, z)
        s.annulus(g, 0.46, 0.5, z, 96)
        for i in range(16):
            a = TAU * i / 16
            s.flat(g, [pol(0.5, a - 0.06), pol(0.54, a - 0.04), pol(0.54, a + 0.04), pol(0.5, a + 0.06)], z)
    elif st == 'magma':
        s.polyline(g, [pol(0.5, math.pi / 2 + TAU * 2 * i / 5) for i in range(5)], 0.022, z, True)
        s.ring2d(h, (0, 0), 0.5, 0.016, z, 96)
        s.ring2d(h, (0, 0), 0.16, 0.03, z, 48)
        for i in range(5):
            s.dot(g, pol(0.27, -math.pi / 2 + TAU * i / 5), 0.03, z)
    elif st == 'crystal':
        for k, r in enumerate((0.5, 0.36, 0.22)):
            s.polyline(g if k % 2 == 0 else h, [pol(r, k * TAU / 12 + TAU * i / 6) for i in range(6)], 0.018, z, True)
        for i in range(6):
            s.stroke(h, pol(0.22, TAU * i / 6 + TAU / 6), pol(0.5, TAU * i / 6), 0.008, z)
        s.flat(h, [(0, 0.1), (0.06, 0), (0, -0.1), (-0.06, 0)], z)
    elif st == 'sonic':
        for sx in (-1, 1):
            for k in range(3):
                s.polyline(g if k % 2 == 0 else h, arcpts(0.18 + k * 0.12, (0 if sx > 0 else math.pi) - 0.6, (0 if sx > 0 else math.pi) + 0.6, 16), 0.018, z)
        s.polyline(h, [(-0.12 + 0.24 * t / 20, 0.06 * math.sin(t / 20 * TAU * 2)) for t in range(21)], 0.014, z)
    elif st == 'gravity':
        for k in range(4):
            a0 = TAU * k / 4
            s.polyline(g, [pol(0.5 - 0.018 * t, a0 + 0.12 * t) for t in range(26)], 0.018, z)
        for r in (0.12, 0.25):
            s.ring2d(h, (0, 0), r, 0.01, z, 64)
        s.dot(h, (0, 0), 0.05, z)
    elif st == 'chrono':
        s.ring2d(g, (0, 0), 0.5, 0.02, z, 96)
        for i in range(12):
            a = TAU * i / 12
            s.stroke(h, pol(0.4, a), pol(0.47, a), 0.02 if i % 3 == 0 else 0.01, z)
        s.flat(g, [(-0.02, 0), (0, 0.36), (0.02, 0)], z)
        s.flat(g, [(0, -0.02), (0.25, 0), (0, 0.02)], z)
        s.polyline(h, [(-0.1, -0.12), (0.1, -0.12), (-0.1, -0.3), (0.1, -0.3)], 0.012, z, True)
        s.dot(h, (0, 0), 0.03, z)
    elif st == 'blood':
        s.polyline(g, [pol(0.5, -math.pi / 2 + TAU * i / 3) for i in range(3)], 0.026, z, True)
        s.flat(h, [(0, 0.18)] + arcpts(0.1, math.pi * 0.1, math.pi * 0.9 - TAU, 16, (0, -0.02))[::-1], z)
        for sx in (-1, 1):
            s.flat(g, crescent((sx * 0.3, 0.2), 0.08, 0.03, 0 if sx < 0 else math.pi), z)
    elif st == 'spirit':
        pts = [(0.22 * math.sin(math.pi * t / 30) * (1 - t / 30) ** 0.4 * (1 if t < 31 else -1), -0.3 + 0.75 * t / 30) for t in range(31)]
        s.polyline(g, pts + [(-x, y) for x, y in pts[::-1]], 0.02, z, True)
        s.polyline(h, lens((-0.1, -0.05), (0.1, -0.05), 0.05), 0.012, z, True)
        s.dot(h, (0, -0.05), 0.025, z)
        s.ring2d(h, (0, 0), 0.52, 0.01, z, 96)
    elif st == 'cosmic':
        s.polyline(g, [pol(0.3, math.pi / 2 + TAU * 2 * i / 5) for i in range(5)], 0.02, z, True)
        for rot in (0.5, -0.5):
            s.polyline(h, [rotp((0.5 * math.cos(TAU * i / 64), 0.2 * math.sin(TAU * i / 64)), rot) for i in range(64)], 0.01, z, True)
        for i in range(7):
            s.dot(h, pol(0.42 + 0.04 * (i % 2), TAU * i / 7 + 0.2), 0.015, z)
    elif st == 'explosion':
        for i in range(16):
            a = TAU * i / 16
            s.stroke(g if i % 2 else h, pol(0.18, a), pol(0.5 if i % 2 == 0 else 0.38, a), 0.016, z)
        s.polyline(h, [pol(0.13, math.pi / 2 + TAU * i / 3) for i in range(3)], 0.016, z, True)
        s.ring2d(g, (0, 0), 0.52, 0.014, z, 96)
    s.annulus(h, 0.10, 0.12, z) if st not in ('shadow', 'chrono', 'gravity', 'light', 'spirit', 'blood') else None


def spell_circle(el):
    g, h = G[el]
    rng = random.Random(el)
    o = M(el + '__ring_outer')
    o.annulus(g, 0.955, 1.0)
    o.annulus(h, 0.90, 0.915)
    for i in range(72):
        a = TAU * i / 72
        o.stroke(g, pol(0.915, a), pol(0.955 if i % 6 == 0 else 0.935, a), 0.008)
    rim(o, el, g, h, rng)
    r = M(el + '__runes')
    r.annulus(g, 0.68, 0.69, 0.002)
    r.annulus(g, 0.84, 0.85, 0.002)
    runes(r, h, 0.765, 0.1, 18, 0.011, 0.002, rng)
    n = M(el + '__ring_inner')
    n.annulus(g, 0.60, 0.625, 0.004)
    n.annulus(h, 0.555, 0.565, 0.004)
    for i in range(8):
        cx, cy = pol(0.5825, TAU * i / 8 + TAU / 16)
        n.flat(h, [(cx + 0.014 * math.cos(t * TAU / 8), cy + 0.014 * math.sin(t * TAU / 8)) for t in range(8)], 0.004)
    s = M(el + '__sigil')
    sigil(s, el, g, h, rng)
    objs = [o.done(False), r.done(False), n.done(False), s.done(False)]
    row = list(ELS).index(el)
    for ob in objs:
        ob.location = ((row % 5) * 2.6, -(row // 5) * 2.6 - 10, 0)
        ALL.append(ob)
    return objs


CIRCLES = [ob for el in ELS for ob in spell_circle(el)]


# ---------- shared shapes ----------
def blob_cloud(m, mt, R=1.0, n=9, flat=0.55, sub=2):
    for i in range(n):
        a = TAU * i / n + random.uniform(-0.3, 0.3)
        rr = R * random.uniform(0.2, 0.75) if i else 0
        s_ = R * random.uniform(0.45, 0.7)
        m.ico(mt, 1, TRS((*pol(rr, a), random.uniform(-0.1, 0.25) * R), scale=(s_, s_, s_ * flat * random.uniform(1, 1.4))), sub=sub, noise=0.06, smooth=True)


def plated_rock(m, R, inner, plate, plates=22, fl=0.55):
    """Molten core with rock plates pressed on it, so glowing seams show between them."""
    m.ico(inner, R * 0.9, sub=2, smooth=True)
    for _ in range(plates):
        d = Vector((random.uniform(-1, 1), random.uniform(-1, 1), random.uniform(-1, 1))).normalized()
        q = d.to_track_quat('Z', 'Y').to_matrix().to_4x4()
        sz = R * random.uniform(0.38, 0.55)
        m.ico(plate, 1, Matrix.Translation(d * R * 0.82) @ q @ Matrix.Diagonal((sz, sz * random.uniform(0.7, 1.1), sz * fl, 1)), sub=1, noise=0.05)


def crescent_blade(m, mt, W, depth, th, z0, z1, serr=0):
    """Horizontal crescent bulging toward -Y (the direction of travel)."""
    n = 28
    outer = [(W * math.cos(math.pi + math.pi * t / n), -depth * math.sin(math.pi * t / n)) for t in range(n + 1)]
    inner = []
    for t in range(n - 1, 0, -1):
        x, y = outer[t]
        w = th * math.sin(math.pi * t / n) ** 0.8
        if serr and t % 3 == 0:
            w *= 0.6
        inner.append((x * 0.97, y + w))
    m.prism(mt, outer + inner, z0, z1)


# ---------- generic meshes (shared by many moves) ----------
m = M('gen__cone')  # open cone: apex at origin, opens toward -Y, length 1, end radius 1 (UV: u around, v along)
m.lathe(G['wind'][0], [(0.0001, 0), (1, 1)], n=40, M=aim((0, -1, 0)), caps=False)
put('gen', m.done(False, uv=lambda co: ((math.atan2(co.z, co.x) / TAU) % 1, -co.y)))
m = M('gen__dome')  # hemisphere shell r=1 (UV v = height)
m.lathe(G['light'][0], [(1, 0)] + [(math.cos(math.pi / 2 * t / 12), math.sin(math.pi / 2 * t / 12)) for t in range(1, 12)] + [(0, 1)], n=48, caps=False)
put('gen', m.done(False, uv=lambda co: ((math.atan2(co.y, co.x) / TAU) % 1, co.z)))
m = M('gen__cyl')  # open cylinder r=1 h=1 (UV v = height)
m.lathe(G['fire'][0], [(1, 0), (1, 0.5), (1, 1)], n=64, caps=False)
put('gen', m.done(False, uv=lambda co: ((math.atan2(co.y, co.x) / TAU) % 1 * 8, co.z)))
m = M('gen__cloud')
blob_cloud(m, cloudm, 1.0)
put('gen', m.done())
m = M('gen__orb')  # fresnel orb for bubbles and shields
m.sphere(G['water'][0], 1, u=32, v=20)
put('gen', m.done())

# ---------- FIRE ----------
fg, fh = G['fire']
m = M('fire__ball')
m.ico(fh, 0.17, sub=2, smooth=True)
m.ico(fg, 0.3, sub=2, noise=0.05)
for k in range(3):
    m.lathe(fg, [(0, 0), (0.17, 0.08), (0.1, 0.4), (0, 0.95)], n=8, M=aim((math.cos(TAU * k / 3) * 0.25, 1, math.sin(TAU * k / 3) * 0.25)), noise=0.02, twist=0.6)
put('fire', m.done())
m = M('fire__flame')  # standing flame tongue (ring of fire, blaze trail)
m.lathe(fg, [(0, 0), (0.42, 0.12), (0.36, 0.5), (0.18, 0.95), (0.05, 1.3), (0, 1.45)], n=9, noise=0.04, twist=0.45)
m.lathe(fh, [(0, 0.03), (0.22, 0.12), (0.17, 0.45), (0, 0.85)], n=7, twist=0.5)
put('fire', m.done())
m = M('fire__phoenix')
m.lathe(fg, [(0, -0.75), (0.17, -0.5), (0.27, -0.05), (0.22, 0.35), (0.12, 0.7), (0, 0.9)], n=12, M=aim((0, -1, 0)), smooth=True)
m.sphere(fh, 0.17, TRS((0, -0.98, 0.18)), u=12, v=8)
m.lathe(fh, [(0.06, 0), (0, 0.22)], n=6, M=aim((0, -1, -0.25), (0, -1.12, 0.17)))
for k in range(3):  # crest
    m.tube(fh, [(0, -0.98, 0.3), (0, -0.85 + k * 0.1, 0.55 + k * 0.05), (0, -0.6 + k * 0.15, 0.62 - k * 0.04)], [0.03, 0.02, 0.004], n=5)
for sx in (-1, 1):  # wings: a curved feathered surface
    bm = m.bm
    rows = []
    NS, NC = 22, 4
    for i in range(NS + 1):
        s_ = i / NS
        le = Vector((sx * (0.2 + 2.3 * s_), -0.35 + 0.65 * s_ ** 2, 0.55 * math.sin(math.pi * s_ * 0.75)))
        L = 0.95 * (1 - s_) + 0.32
        tip = 0.35 * abs(math.sin(9 * math.pi * s_)) * (0.4 + s_)
        rows.append([bm.verts.new(le + Vector((0, (L + tip * (c / NC) ** 3) * c / NC, -0.12 * (c / NC)))) for c in range(NC + 1)])
    fs = [bm.faces.new((rows[i][c], rows[i + 1][c], rows[i + 1][c + 1], rows[i][c + 1])) for i in range(NS) for c in range(NC)]
    m._tag(fs, fg, True)
    for k in range(5):  # bright leading-edge feathers
        s0 = 0.15 + k * 0.17
        a = Vector((sx * (0.2 + 2.3 * s0), -0.35 + 0.65 * s0 ** 2, 0.55 * math.sin(math.pi * s0 * 0.75) + 0.01))
        m.tube(fh, [a, a + Vector((sx * 0.12, 0.45, -0.05))], [0.035, 0.003], n=5)
for k in range(5):  # tail streamers
    a = (k - 2) * 0.22
    pts = [Vector((math.sin(a) * 0.1, 0.75, 0)), Vector((math.sin(a) * 0.6, 1.6, 0.1)), Vector((math.sin(a) * 1.0, 2.4, -0.1)), Vector((math.sin(a) * 1.25 + 0.15 * (k - 2), 3.1, 0.15))]
    m.tube(fg, pts, [0.07, 0.06, 0.04, 0.003], n=6)
put('fire', m.done())

# ---------- FROST ----------
ig, ih = G['frost']
m = M('frost__lance')
m.lathe(ice, [(0, 0), (0.13, 0.35), (0.12, 1.9), (0.06, 2.3), (0, 2.45)], n=6, M=aim((0, -1, 0), (0, 0.9, 0)))
for k in range(5):
    a = TAU * k / 5
    crystal(m, ice, aim((math.cos(a) * 0.5, -1, math.sin(a) * 0.5), (math.cos(a) * 0.08, 0.7 + k * 0.08, math.sin(a) * 0.08)), 0.06, 0.6)
m.ico(ih, 0.09, TRS((0, -0.4, 0)), sub=1)
put('frost', m.done())
m = M('frost__wall')  # 6 m wide wall of ice columns along X
for i in range(26):
    x = -3 + 6 * i / 25 + random.uniform(-0.08, 0.08)
    h = random.uniform(1.6, 2.9) * (0.75 + 0.25 * math.sin(math.pi * (i + 0.5) / 26))
    crystal(m, ice, TRS((x, random.uniform(-0.25, 0.25), -0.15), (random.uniform(-0.25, 0.25), random.uniform(-0.2, 0.2), random.uniform(0, TAU))), random.uniform(0.22, 0.38), h)
m.prism(ice, [(-3.2, -0.45), (3.2, -0.45), (3.2, 0.45), (-3.2, 0.45)], -0.1, 0.25)
put('frost', m.done())
m = M('frost__block')  # ice block that encases frozen enemies (unit size, scaled per enemy)
m.ico(ice, 1, TRS((0, 0, 0.5), scale=(0.6, 0.6, 0.55)), sub=1, noise=0.05)
for _ in range(9):
    d = Vector((random.uniform(-1, 1), random.uniform(-1, 1), random.uniform(0.2, 1))).normalized()
    crystal(m, ice, aim(d, Vector((0, 0, 0.35)) + d * 0.3), random.uniform(0.08, 0.15), random.uniform(0.4, 0.75))
put('frost', m.done())

# ---------- STORM ----------
sg, sh = G['storm']
m = M('storm__orb')
m.ico(sh, 0.22, sub=2, smooth=True)
m.ico(sg, 0.36, sub=1, noise=0.05)
for k in range(3):
    m.lathe(sg, [(0.5, -0.012), (0.52, 0), (0.5, 0.012), (0.48, 0)], n=40, M=TRS(rot=(k * 1.05, k * 0.7, 0)), closed=True)
for _ in range(10):
    d = Vector((random.uniform(-1, 1), random.uniform(-1, 1), random.uniform(-1, 1))).normalized()
    m.ribbon(sh, [d * 0.25, d * 0.4 + Vector((random.uniform(-0.1, 0.1),) * 3), d * 0.62], 0.02)
put('storm', m.done(False))
m = M('storm__coil')
m.prism(darkmetal, [pol(0.75, TAU * i / 6) for i in range(6)], 0, 0.25)
m.prism(darkmetal, [pol(0.55, TAU * i / 6) for i in range(6)], 0.25, 0.45)
m.lathe(darkmetal, [(0.14, 0.45), (0.12, 2.2)], n=12, caps=False)
for k in range(9):
    z = 0.65 + k * 0.17
    r = 0.34 - k * 0.015
    m.lathe(copper, [(r - 0.05, z - 0.05), (r, z - 0.07), (r + 0.05, z), (r, z + 0.07), (r - 0.05, z + 0.05)], n=20, closed=True, smooth=True)
m.lathe(metal, [(0.35, 2.25), (0.55, 2.3), (0.6, 2.38), (0.55, 2.46), (0.35, 2.5), (0.3, 2.38)], n=28, closed=True, smooth=True)
m.ico(sh, 0.24, TRS((0, 0, 2.38)), sub=2, smooth=True)
for i in range(3):
    a = TAU * i / 3
    m.lathe(darkmetal, [(0.05, 0), (0.03, 0.9)], n=6, M=aim((math.cos(a) * 0.5, math.sin(a) * 0.5, 1), (math.cos(a) * 0.55, math.sin(a) * 0.55, 0.25)))
put('storm', m.done())
m = M('storm__cloud')
blob_cloud(m, cloudm, 2.2, n=12, flat=0.45)
for _ in range(5):
    p0 = Vector((random.uniform(-1.4, 1.4), random.uniform(-1.4, 1.4), -0.5))
    m.ribbon(sh, [p0, p0 + Vector((random.uniform(-0.3, 0.3), random.uniform(-0.3, 0.3), -0.35)), p0 + Vector((random.uniform(-0.4, 0.4), random.uniform(-0.4, 0.4), -0.7))], 0.03)
put('storm', m.done(False))

# ---------- WATER ----------
wg, wh = G['water']
m = M('water__drop')
m.lathe(wg, [(0, 0), (0.12, 0.06), (0.15, 0.17), (0.11, 0.32), (0.05, 0.48), (0, 0.6)], n=14, M=aim((0, 1, 0), (0, -0.12, 0)), smooth=True)
m.ico(wh, 0.07, TRS((0, -0.02, 0)), sub=1)
put('water', m.done())
m = M('water__whip')  # lash arc in XY sweeping 140 deg in front (-Y); UV u = along length
pts, rads = [], []
for t in range(41):
    a = -math.pi / 2 - 1.2 + 2.4 * t / 40
    rr = 1.5 + 4.5 * math.sin(math.pi * t / 40) ** 0.5
    pts.append((rr * math.cos(a), rr * math.sin(a), 0.25 * math.sin(math.pi * t / 40 * 2)))
    rads.append(0.03 + 0.18 * math.sin(math.pi * t / 40))
m.tube(wg, pts, rads, n=10)
put('water', m.done(uv=lambda co: ((math.atan2(co.y, co.x) + math.pi / 2 + 1.2) / 2.4, 0.5)))
m = M('water__cloud')
blob_cloud(m, wg, 1.6, n=10, flat=0.5)
put('water', m.done())
m = M('water__wave')  # unit-wide curling wave crest along X, cresting toward -Y (UV u across, v up the face)
prof = [(0.7, 0.0), (0.55, 0.25), (0.38, 0.5), (0.2, 0.75), (0.0, 0.93), (-0.2, 1.0), (-0.36, 0.95), (-0.47, 0.82), (-0.5, 0.68), (-0.45, 0.6)]
bm = m.bm
uvs = {}
grid = []
NX = 24
for i in range(NX + 1):
    x = -0.5 + i / NX
    bow = 0.35 * (2 * abs(x)) ** 2
    grid.append([bm.verts.new((x, y + bow, z * (1 - 0.35 * (2 * abs(x)) ** 3))) for y, z in prof])
fs = [bm.faces.new((grid[i][j], grid[i + 1][j], grid[i + 1][j + 1], grid[i][j + 1])) for i in range(NX) for j in range(len(prof) - 1)]
m._tag(fs, wg, True)
put('water', m.done(False, uv=lambda co: (co.x + 0.5, co.z)))

# ---------- EARTH ----------
eg, eh = G['earth']
m = M('earth__pebble')
m.ico(rockm, 0.2, sub=1, noise=0.04)
m.ico(eh, 0.07, TRS((0, -0.16, 0.02)), sub=1)
put('earth', m.done())
m = M('earth__boulder')
m.ico(rockm, 1, sub=2, noise=0.1)
for k in range(3):
    m.lathe(eg, [(0.99, -0.03), (1.02, 0), (0.99, 0.03), (0.96, 0)], n=36, M=TRS(rot=(k * 1.1 + 0.3, k * 0.6, 0)), closed=True)
put('earth', m.done())
m = M('earth__pillar')  # basalt column cluster, pivot at ground
for i, (x, y, h) in enumerate([(0, 0, 3.2), (0.55, 0.3, 2.5), (-0.5, 0.35, 2.7), (0.1, -0.6, 2.2), (-0.45, -0.4, 1.8), (0.6, -0.35, 1.6)]):
    r = 0.42 if i else 0.55
    m.prism(rockm, [(x + r * math.cos(TAU * k / 6 + i), y + r * math.sin(TAU * k / 6 + i)) for k in range(6)], -0.3, h)
    m.prism(eg, [(x + r * 0.7 * math.cos(TAU * k / 6 + i), y + r * 0.7 * math.sin(TAU * k / 6 + i)) for k in range(6)], h, h + 0.03)
pil = m.done()
apply_bevel(pil, 0.04, segs=1)
put('earth', pil)
m = M('earth__spike')
m.lathe(rockm, [(0.45, -0.2), (0.38, 0.3), (0.2, 1.1), (0, 1.9)], n=6, noise=0.05, jag=0.0)
m.lathe(eg, [(0.39, 0.25), (0.41, 0.3), (0.39, 0.35)], n=6, closed=True)
put('earth', m.done())

# ---------- WIND ----------
ag, ah = G['wind']
m = M('wind__blade')
crescent_blade(m, ag, 1.25, 0.55, 0.32, -0.04, 0.04)
crescent_blade(m, ah, 1.0, 0.5, 0.12, -0.02, 0.06)
put('wind', m.done())
m = M('wind__tornado')  # twisted funnel, UV u around, v height
for layer, (mt, tw, sc) in enumerate(((ag, 1.4, 1.0), (ah, -1.1, 0.7))):
    prof = [((0.3 + 2.3 * (t / 16) ** 1.6) * sc, 6.5 * t / 16) for t in range(17)]
    m.lathe(mt, prof, n=28, twist=tw * 0.25, caps=False, smooth=True)
put('wind', m.done(False, uv=lambda co: ((math.atan2(co.y, co.x) / TAU) % 1 * 3, co.z / 6.5)))
m = M('wind__ring')  # three swirling arcs
for k in range(3):
    a0 = TAU * k / 3
    m.annulus(ag, 0.85, 1.0, 0, 30, a0=a0, a1=a0 + 1.6)
    m.annulus(ah, 0.62, 0.7, 0.01, 20, a0=a0 + 0.6, a1=a0 + 1.9)
put('wind', m.done(False))

# ---------- NATURE ----------
ng, nh = G['nature']
m = M('nature__thorn')
m.lathe(bark, [(0, 0), (0.06, 0.06), (0.05, 0.5), (0, 0.75)], n=6, M=aim((0, -1, 0), (0, 0.35, 0)), smooth=True)
for k in range(3):
    a = TAU * k / 3
    m.lathe(bark, [(0.025, 0), (0, 0.16)], n=5, M=aim((math.cos(a), 0.6, math.sin(a)), (math.cos(a) * 0.04, 0.05 + k * 0.08, math.sin(a) * 0.04)))
m.ico(nh, 0.05, TRS((0, -0.38, 0)), sub=1)
put('nature', m.done())
m = M('nature__roots')
for i in range(9):
    a = TAU * i / 9 + random.uniform(-0.2, 0.2)
    r0 = random.uniform(0.3, 1.4)
    p0 = Vector((*pol(r0, a), -0.2))
    pts = [p0]
    for k in range(5):
        pts.append(pts[-1] + Vector((random.uniform(-0.15, 0.15) - math.cos(a) * 0.1, random.uniform(-0.15, 0.15) - math.sin(a) * 0.1, 0.32)))
    m.tube(bark, pts, [0.12, 0.1, 0.08, 0.06, 0.035, 0.005], n=6)
    m.ico(ng, 0.04, TRS(tuple(pts[3])), sub=1)
put('nature', m.done())
m = M('nature__flower')
for layer, (n, L, lift) in enumerate(((8, 0.6, 0.45), (8, 0.42, 0.9))):
    for i in range(n):
        a = TAU * i / n + layer * TAU / 16
        d = Vector((math.cos(a), math.sin(a), 0))
        bm = m.bm
        rowsv = []
        for t in range(6):
            u = t / 5
            c = d * L * u + Vector((0, 0, lift * L * u ** 2))
            w = 0.16 * math.sin(math.pi * u ** 0.8) * (1 - layer * 0.25)
            side = Vector((-d.y, d.x, 0)) * w
            rowsv.append([bm.verts.new(c - side), bm.verts.new(c + Vector((0, 0, -0.03 * w))), bm.verts.new(c + side)])
        fs = [bm.faces.new((rowsv[t][j], rowsv[t + 1][j], rowsv[t + 1][j + 1], rowsv[t][j + 1])) for t in range(5) for j in range(2)]
        m._tag(fs, ng if layer else nh, True)
m.ico(nh, 0.1, TRS((0, 0, 0.06)), sub=2, smooth=True)
put('nature', m.done(False))
# flytrap: base + two jaws as children so the game can snap them
m = M('nature__trap')
m.tube(trapm, [(0, 0, 0), (0.1, 0, 0.5), (0, 0.05, 1.0), (0, 0.1, 1.3)], [0.12, 0.09, 0.08, 0.1], n=8)
for i in range(5):
    a = TAU * i / 5
    d = Vector((math.cos(a), math.sin(a), 0))
    m.tube(trapm, [d * 0.1, d * 0.6 + Vector((0, 0, 0.18)), d * 1.0 + Vector((0, 0, 0.05))], [0.06, 0.12, 0.01], n=6)
trap = m.done()
put('nature', trap)
for nm_, sgn in (('nature__trap_jawU', 1), ('nature__trap_jawL', -1)):
    j = M(nm_, parent=trap)
    j.loc = (0, 0.1, 1.35)
    prof_ = [(0, 0), (0.35, 0.05), (0.42, 0.35), (0.3, 0.7), (0, 0.85)]
    j.lathe(trapm, prof_, n=14, M=TRS((0, -0.05, 0), (math.pi / 2, 0, 0), (1, 1, 0.55 * sgn)), smooth=True)
    j.lathe(trapin, [(0, 0.02), (0.32, 0.07), (0.38, 0.35), (0.27, 0.66), (0, 0.8)], n=14, M=TRS((0, -0.05, 0.005 * sgn), (math.pi / 2, 0, 0), (1, 1, 0.45 * sgn)), smooth=True)
    for k in range(11):
        u = k / 10
        a = math.pi * (0.1 + 0.8 * u)
        base = Vector((0.4 * math.sin(a) * (1 if k % 2 else -1) * 0, 0, 0))
        y = -0.05 - 0.75 * u
        rr = 0.4 * math.sin(math.pi * (0.05 + 0.9 * u)) + 0.02
        for sx in (-1, 1):
            p0 = Vector((sx * rr, y, 0))
            j.lathe(nh, [(0.025, 0), (0, 0.22)], n=4, M=aim((sx * 0.4, 0, sgn), p0))
    j.done()
m = M('nature__tree')  # the world tree
m.lathe(bark, [(1.4, -0.2), (1.0, 0.3), (0.75, 1.0), (0.6, 2.5), (0.5, 4.0), (0.55, 5.0), (0.4, 6.2), (0, 6.6)], n=14, flute=0.12, twist=0.12, noise=0.05, smooth=True)
for i in range(7):
    a = TAU * i / 7
    d = Vector((math.cos(a), math.sin(a), 0))
    m.tube(bark, [d * 0.6 + Vector((0, 0, 0.8)), d * 1.5 + Vector((0, 0, 0.2)), d * 2.4 + Vector((0, 0, -0.1)), d * 3.0 + Vector((0, 0, -0.3))], [0.35, 0.25, 0.14, 0.03], n=8)
canopy = []
for i in range(7):
    a = TAU * i / 7 + 0.4
    d = Vector((math.cos(a), math.sin(a), 0))
    h0 = 4.2 + (i % 3) * 0.6
    tip = d * random.uniform(2.4, 3.2) + Vector((0, 0, h0 + 1.6))
    m.tube(bark, [Vector((0, 0, h0)), d * 1.0 + Vector((0, 0, h0 + 0.8)), tip], [0.28, 0.18, 0.06], n=7)
    canopy.append(tip)
canopy.append(Vector((0, 0, 7.2)))
for c in canopy:
    for k in range(4):
        s_ = random.uniform(0.8, 1.4)
        m.ico(leaf if k % 2 else leaf2, 1, TRS(tuple(c + Vector((random.uniform(-0.7, 0.7), random.uniform(-0.7, 0.7), random.uniform(-0.2, 0.6)))), scale=(s_, s_, s_ * 0.7)), sub=2, noise=0.16, smooth=True)
    for _ in range(5):  # glowing blossoms dotted through the canopy
        d = Vector((random.uniform(-1, 1), random.uniform(-1, 1), random.uniform(-0.2, 1))).normalized()
        m.ico(blossom, 0.12, TRS(tuple(c + d * 1.2)), sub=1)
for k in range(4):  # glowing sap veins spiralling up the trunk
    m.tube(ng, [(0.62 * math.cos(k * 1.57 + t * 0.35), 0.62 * math.sin(k * 1.57 + t * 0.35), 0.4 + t * 0.4) for t in range(12)], 0.035, n=5)
put('nature', m.done())

# ---------- SHADOW ----------
dg_, dh = G['shadow']
m = M('shadow__dagger')
m.lathe(darkmetal, [(0, 0), (0.07, 0.12), (0.05, 0.42), (0, 0.6)], n=4, M=aim((0, -1, 0), (0, -0.05, 0)))
m.lathe(dg_, [(0, 0.02), (0.075, 0.13), (0.055, 0.42), (0, 0.62)], n=4, M=TRS((0, -0.05, 0), (math.pi / 2, 0, math.pi / 4), (0.25, 1, 1)))
m.lathe(wrap, [(0.025, 0), (0.025, 0.25)], n=6, M=aim((0, 1, 0), (0, -0.05, 0)))
m.lathe(dh, [(0.03, -0.012), (0.06, 0), (0.03, 0.012), (0.045, 0)], n=12, M=TRS((0, 0.24, 0), (math.pi / 2, 0, 0)), closed=True)
put('shadow', m.done())
m = M('shadow__hand')  # grasping claw, palm faces -Y
m.sphere(dg_, 1, TRS(scale=(0.32, 0.12, 0.36)), u=14, v=10)
for i in range(4):
    x = -0.2 + i * 0.135
    base = Vector((x, 0, 0.3))
    pts = [base, base + Vector((x * 0.2, -0.1, 0.25)), base + Vector((x * 0.35, -0.3, 0.42)), base + Vector((x * 0.4, -0.55, 0.42))]
    m.tube(dg_, pts, [0.06, 0.05, 0.04, 0.005], n=6)
m.tube(dg_, [(0.3, 0, 0.0), (0.48, -0.15, 0.15), (0.52, -0.4, 0.25)], [0.065, 0.045, 0.005], n=6)
m.tube(dg_, [(0, 0.05, -0.3), (0, 0.4, -0.9), (0.1, 0.9, -1.2)], [0.2, 0.1, 0.01], n=8)
put('shadow', m.done())
m = M('shadow__orb')  # eclipse: a black sun with a corona
m.sphere(void, 1, u=32, v=20)
m.annulus(dh, 1.02, 1.1, 0, 64, M=TRS(rot=(math.pi / 2, 0, 0)))
for i in range(24):
    a = TAU * i / 24
    m.flat(dg_, [pol(1.05, a - 0.07), pol(1.5 + 0.35 * (i % 3 == 0), a), pol(1.05, a + 0.07)], 0, TRS(rot=(math.pi / 2, 0, 0)))
put('shadow', m.done(False))

# ---------- LIGHT ----------
lg_, lh_ = G['light']
m = M('light__orb')
m.ico(lh_, 0.16, sub=2, smooth=True)
m.ico(lg_, 0.24, sub=2, smooth=True)
for k in range(2):
    m.lathe(lg_, [(0.36, -0.008), (0.38, 0), (0.36, 0.008), (0.34, 0)], n=32, M=TRS(rot=(math.pi / 2 + k * 0.6, k * 0.8, 0)), closed=True)
for rot in (0, math.pi / 4):
    m.flat(lh_, starpts(4, 0.04, 0.55 if rot == 0 else 0.35, rot), 0, TRS(rot=(math.pi / 2, 0, 0)))
put('light', m.done(False))
m = M('light__halo')  # flat ring with rays (sanctuary floor, judgment sky)
m.annulus(lh_, 0.9, 1.0, 0, 96)
m.annulus(lg_, 0.78, 0.8, 0, 96)
for i in range(12):
    a = TAU * i / 12
    m.flat(lg_, [pol(1.0, a - 0.05), pol(1.35, a), pol(1.0, a + 0.05)])
    m.flat(lh_, starpts(4, 0.02, 0.07, a, pol(0.69, a)))
put('light', m.done(False))
m = M('light__spear')  # a falling spear of light (judgment)
m.lathe(lh_, [(0, 0), (0.18, 0.4), (0.12, 2.5), (0.2, 2.7), (0.07, 2.9), (0.05, 3.6), (0, 3.7)], n=8, M=aim((0, 0, 1)), smooth=False)
for sx in (-1, 1):
    m.flat(lg_, [(0, 0.0), (sx * 0.6, 0.3), (sx * 0.15, 0.55)], 0, TRS((0, 0, 2.55), (math.pi / 2, 0, 0)))
put('light', m.done(False))

# ---------- VENOM ----------
vg, vh = G['venom']
m = M('venom__glob')
m.ico(vg, 0.22, sub=2, noise=0.03, smooth=True)
m.ico(vh, 0.1, sub=1)
for k in range(3):
    a = TAU * k / 3
    m.lathe(vg, [(0.08, 0), (0.05, 0.2), (0.06, 0.28), (0, 0.34)], n=8, M=aim((math.cos(a) * 0.3, 1, math.sin(a) * 0.3 - 0.4), (math.cos(a) * 0.1, 0.1, math.sin(a) * 0.1)), smooth=True)
put('venom', m.done())
m = M('venom__wasp')  # body; wings are children so they can flap
m.lathe(olive, [(0, -0.12), (0.06, -0.08), (0.07, 0.02), (0, 0.07)], n=10, M=aim((0, -1, 0), (0, -0.18, 0)), smooth=True)  # head
m.sphere(olive, 0.09, TRS((0, -0.05, 0)), u=12, v=8)  # thorax
for k in range(4):
    m.lathe(vg if k % 2 else olive, [(0.08 - k * 0.012, 0), (0.11 - k * 0.015, 0.06), (0.08 - k * 0.015, 0.12)], n=12, M=aim((0, 1, -0.3), (0, 0.05 + k * 0.11, -0.03 * k)), smooth=True)
m.lathe(vh, [(0.02, 0), (0, 0.14)], n=6, M=aim((0, 1, -0.5), (0, 0.5, -0.14)))
for sx in (-1, 1):
    m.sphere(vh, 0.035, TRS((sx * 0.045, -0.24, 0.02)), u=8, v=6)
wasp = m.done()
put('venom', wasp)
for nm_, sx in (('venom__wasp_wingL', -1), ('venom__wasp_wingR', 1)):
    w = M(nm_, parent=wasp)
    w.loc = (sx * 0.05, -0.04, 0.07)
    w.flat(glass, [(0, 0), (sx * 0.12, -0.06), (sx * 0.34, 0.0), (sx * 0.36, 0.06), (sx * 0.2, 0.08)])
    w.done()
m = M('venom__fang')  # ghostly serpent head leading the serpent dash
m.lathe(vg, [(0, -0.05), (0.2, 0.05), (0.26, 0.35), (0.2, 0.7), (0.14, 1.2), (0, 1.3)], n=12, M=aim((0, 1, 0), (0, -0.4, 0)), smooth=True)
for sx in (-1, 1):
    m.sphere(vh, 0.05, TRS((sx * 0.14, -0.25, 0.12)), u=8, v=6)
    m.lathe(vh, [(0.03, 0), (0, 0.22)], n=5, M=aim((0, -0.4, -1), (sx * 0.08, -0.35, -0.08)))
put('venom', m.done())

# ---------- STEEL ----------
tg, th = G['steel']
m = M('steel__saw')  # spins about its Z axis
pts_ = []
for i in range(24):
    a = TAU * i / 24
    pts_ += [pol(0.48, a), pol(0.6, a + TAU / 24 * 0.7)]
m.prism(metal, pts_, -0.02, 0.02)
m.lathe(darkmetal, [(0, -0.05), (0.15, -0.05), (0.15, 0.05), (0, 0.05)], n=16)
m.lathe(th, [(0.15, -0.03), (0.42, -0.025), (0.42, 0.025), (0.15, 0.03)], n=32, closed=True)
put('steel', m.done())
m = M('steel__spike')
m.lathe(metal, [(0, 0), (0.08, 0.25), (0.06, 1.6), (0.09, 1.7), (0.09, 1.8), (0, 1.8)], n=8, M=aim((0, 1, 0), (0, -0.9, 0)))
for k in range(4):
    a = TAU * k / 4
    m.prism(darkmetal, [(0, 0), (0.2, 0.25), (0.2, 0.45), (0, 0.35)], -0.012, 0.012, M=Matrix.Translation((0, 0.35, 0)) @ Matrix.Rotation(a, 4, 'Y') @ Matrix.Rotation(-math.pi / 2, 4, 'Z'))
m.lathe(th, [(0.065, 0), (0.065, 1.2)], n=8, M=aim((0, 1, 0), (0, -0.6, 0)), caps=False)
put('steel', m.done())
m = M('steel__caltrop')
for d in [(1, 1, 1), (-1, -1, 1), (-1, 1, -1), (1, -1, -1)]:
    m.lathe(metal, [(0.04, 0), (0, 0.24)], n=5, M=aim(d))
put('steel', m.done())
m = M('steel__sword')  # hilt at origin, blade up +Z
m.lathe(metal, [(0, 0.35), (0.16, 0.38), (0.15, 2.6), (0, 3.3)], n=4, M=TRS(scale=(1, 0.18, 1)))
m.lathe(th, [(0, 0.4), (0.04, 0.42), (0.035, 2.5), (0, 2.9)], n=4, M=TRS((0, 0, 0), scale=(1, 0.6, 1)))
m.prism(goldm, [(-0.5, -0.06), (0.5, -0.06), (0.55, 0.0), (0.5, 0.06), (-0.5, 0.06), (-0.55, 0.0)], 0.28, 0.38, M=I)
m.lathe(wrap, [(0.05, -0.3), (0.05, 0.3)], n=8)
m.ico(goldm, 0.09, TRS((0, 0, -0.35)), sub=1)
m.ico(th, 0.05, TRS((0, -0.05, 0.33)), sub=1)
put('steel', m.done())
m = M('steel__magnet')  # horseshoe, opening toward -Y
pts = [(0.35 * math.cos(a), 0.35 * math.sin(a) + 0.15, 0) for a in [math.pi * t / 16 for t in range(17)]]
pts = [(-0.35, -0.35, 0)] + pts[::-1][::-1] if False else [(0.35, -0.3, 0)] + [(0.35 * math.cos(math.pi * t / 16), 0.15 + 0.35 * math.sin(math.pi * t / 16), 0) for t in range(17)] + [(-0.35, -0.3, 0)]
m.tube(redpaint, pts, 0.11, n=10)
for sx in (-1, 1):
    m.lathe(metal, [(0.115, 0), (0.115, 0.15)], n=10, M=aim((0, -1, 0), (sx * 0.35, -0.3, 0)))
put('steel', m.done())

# ---------- MAGMA ----------
mgg, mgh = G['magma']
m = M('magma__glob')
plated_rock(m, 0.3, mgh, basalt, plates=12)
put('magma', m.done())
m = M('magma__meteor')
plated_rock(m, 1.4, mgh, basalt, plates=26)
m.lathe(mgg, [(0, 0), (1.3, 0.4), (0.9, 2.2), (0, 4.5)], n=14, M=aim((0, 1, 0)), noise=0.08, twist=0.3, caps=False)
put('magma', m.done())
m = M('magma__volcano')
m.lathe(basalt, [(2.0, -0.1), (1.7, 0.35), (1.1, 1.2), (0.62, 1.95), (0.5, 2.05), (0.42, 1.85), (0, 1.75)], n=16, noise=0.06, smooth=True)
m.flat(mgh, [pol(0.45, TAU * i / 16) for i in range(16)], 1.86)
for i in range(4):
    a = TAU * i / 4 + 0.3
    pts = []
    for t in range(9):
        u = t / 8
        r = 0.52 + 1.4 * u
        z = 2.0 - 1.95 * u ** 0.9 + 0.04
        pts.append((r * math.cos(a + 0.25 * math.sin(u * 3)), r * math.sin(a + 0.25 * math.sin(u * 3)), z))
    m.tube(mgh, pts, [0.09 + 0.06 * (t / 8) for t in range(9)], n=6)
put('magma', m.done())
m = M('magma__geyser')  # eruption column, pivot at ground, h=5
m.lathe(mgg, [(0.9, 0), (0.6, 0.4), (0.45, 2.0), (0.55, 3.8), (0.9, 4.4), (0.5, 4.9), (0, 5.0)], n=12, noise=0.07, twist=0.25)
m.lathe(mgh, [(0.4, 0), (0.25, 2.5), (0.3, 4.2), (0, 4.6)], n=10, twist=0.3)
for _ in range(8):
    d = Vector((random.uniform(-1, 1), random.uniform(-1, 1), random.uniform(0.3, 1))).normalized()
    m.ico(mgh, random.uniform(0.1, 0.2), TRS(tuple(Vector((0, 0, 4.6)) + d * random.uniform(0.6, 1.1))), sub=1)
put('magma', m.done())

# ---------- CRYSTAL ----------
cg, ch = G['crystal']
m = M('crystal__prism')
m.lathe(cryst, [(0, 0), (0.12, 0.25), (0.12, 0.65), (0, 0.95)], n=6, M=aim((0, -1, 0), (0, 0.45, 0)))
m.ico(ch, 0.05, sub=1)
put('crystal', m.done())
m = M('crystal__geode')
for _ in range(10):
    d = Vector((random.uniform(-1, 1), random.uniform(-1, 1), random.uniform(-1, 1))).normalized()
    m.ico(rockm, 1, Matrix.Translation(d * 0.32) @ d.to_track_quat('Z', 'Y').to_matrix().to_4x4() @ Matrix.Diagonal((0.24, 0.22, 0.1, 1)), sub=1, noise=0.03)
for _ in range(9):
    d = Vector((random.uniform(-1, 1), random.uniform(-1, 1), random.uniform(-1, 1))).normalized()
    crystal(m, cryst, aim(d, d * 0.15), 0.05, 0.42)
put('crystal', m.done())
m = M('crystal__shell')
m.ico(cg, 1, sub=1)
for _ in range(10):
    d = Vector((random.uniform(-1, 1), random.uniform(-1, 1), random.uniform(0, 1))).normalized()
    crystal(m, cryst, aim(d, d * 0.95), 0.07, 0.35)
put('crystal', m.done())
m = M('crystal__spire')
m.ico(rockm, 1, TRS((0, 0, 0.0), scale=(0.9, 0.9, 0.35)), sub=1, noise=0.08)
crystal(m, cryst, TRS((0, 0, 0.1)), 0.35, 3.0)
for i in range(7):
    a = TAU * i / 7
    crystal(m, cryst, TRS((*pol(0.45, a), 0.05), (math.cos(a + math.pi / 2) * 0.4, math.sin(a + math.pi / 2) * 0.4, 0)), random.uniform(0.12, 0.2), random.uniform(0.9, 1.7))
m.ico(ch, 0.16, TRS((0, 0, 2.2)), sub=1)
put('crystal', m.done())
m = M('crystal__tomb')  # unit-size encasement (scaled per enemy)
for i in range(11):
    a = TAU * i / 11
    d = Vector((math.cos(a) * 0.35, math.sin(a) * 0.35, 1)).normalized()
    crystal(m, cryst, aim(d, (*pol(0.4, a), -0.05)), random.uniform(0.18, 0.28), random.uniform(0.9, 1.35))
crystal(m, cryst, TRS((0, 0, 0.0)), 0.35, 1.5)
put('crystal', m.done())

# ---------- SONIC ----------
og, oh = G['sonic']
m = M('sonic__wave')  # three vertical arc bands bulging toward -Y
for k, r in enumerate((0.6, 0.85, 1.1)):
    bm = m.bm
    top, bot = [], []
    for t in range(21):
        a = -math.pi / 2 - 0.9 + 1.8 * t / 20
        hgt = 0.35 * (1 - 0.15 * k) * (0.4 + 0.6 * math.sin(math.pi * t / 20))
        top.append(bm.verts.new((r * math.cos(a), r * math.sin(a) + 0.6, hgt)))
        bot.append(bm.verts.new((r * math.cos(a), r * math.sin(a) + 0.6, -hgt)))
    fs = [bm.faces.new((bot[t], bot[t + 1], top[t + 1], top[t])) for t in range(20)]
    m._tag(fs, og if k != 1 else oh, False)
put('sonic', m.done(False))
m = M('sonic__note')  # eighth note glyph, standing in the XZ plane
m.prism(oh, [(0.11 * math.cos(TAU * i / 16) - 0.04, 0.08 * math.sin(TAU * i / 16)) for i in range(16)], -0.02, 0.02, M=TRS(rot=(math.pi / 2, 0, -0.35)))
m.prism(oh, [(0.045, 0), (0.07, 0), (0.07, 0.42), (0.045, 0.42)], -0.02, 0.02, M=TRS(rot=(math.pi / 2, 0, 0)))
m.prism(oh, [(0.07, 0.42), (0.07, 0.34), (0.22, 0.22), (0.24, 0.27)], -0.02, 0.02, M=TRS(rot=(math.pi / 2, 0, 0)))
put('sonic', m.done())
m = M('sonic__rings')  # stacked rings marching forward (-Y): sonic boom cone
for k in range(5):
    r = 0.3 + 0.25 * k
    m.lathe(og if k % 2 else oh, [(r, -0.015), (r + 0.04, 0), (r, 0.015), (r - 0.02, 0)], n=36, M=TRS((0, -0.45 * k, 0), (math.pi / 2, 0, 0)), closed=True)
put('sonic', m.done())

# ---------- GRAVITY ----------
gg, gh = G['gravity']
m = M('gravity__orb')
m.sphere(void, 0.3, u=24, v=14)
m.annulus(gh, 0.36, 0.5, 0, 48, M=TRS(rot=(0.5, 0.2, 0)))
m.annulus(gg, 0.55, 0.62, 0, 48, M=TRS(rot=(-0.4, 0.6, 0)))
put('gravity', m.done(False))
m = M('gravity__hole')  # event horizon + accretion disk (UV u = angle, v = radius)
m.sphere(void, 1, u=32, v=20)
bm = m.bm
rings = []
for i in range(9):
    r = 1.15 + 2.2 * (i / 8) ** 1.3
    rings.append([bm.verts.new((r * math.cos(TAU * j / 64 + i * 0.12), r * math.sin(TAU * j / 64 + i * 0.12), 0.04 * math.sin(j * 0.7))) for j in range(64)])
fs = [bm.faces.new((rings[i][j], rings[i][(j + 1) % 64], rings[i + 1][(j + 1) % 64], rings[i + 1][j])) for i in range(8) for j in range(64)]
m._tag(fs, gg, False)
m.lathe(gh, [(1.06, -0.03), (1.12, 0), (1.06, 0.03), (1.0, 0)], n=48, M=TRS(rot=(math.pi / 2, 0, 0)), closed=True)
put('gravity', m.done(False, uv=lambda co: ((math.atan2(co.y, co.x) / TAU) % 1, (math.hypot(co.x, co.y) - 1.15) / 2.2)))
m = M('gravity__rings')
for k, r in enumerate((0.5, 0.75, 1.0)):
    m.annulus(gg if k % 2 else gh, r - 0.025, r, 0.0, 64)
    for i in range(8):
        a = TAU * i / 8 + k * 0.2
        m.flat(gh, [pol(r - 0.05, a - 0.03), pol(r - 0.12, a), pol(r - 0.05, a + 0.03)])
put('gravity', m.done(False))

# ---------- CHRONO ----------
kg, kh = G['chrono']
m = M('chrono__hand')  # ornate clock hand arrow, pointing -Y
shape = [(0, -0.6), (0.1, -0.38), (0.035, -0.38), (0.035, -0.1), (0.08, -0.04), (0.035, 0.02), (0.035, 0.32), (0.07, 0.38), (0, 0.46)]
shape = shape + [(-x, y) for x, y in shape[-2:0:-1]]
m.prism(goldm, shape, -0.02, 0.02)
m.prism(kh, [(0.06 * math.cos(TAU * i / 12), -0.04 + 0.06 * math.sin(TAU * i / 12)) for i in range(12)], 0.02, 0.03)
put('chrono', m.done())
m = M('chrono__clock')  # flat clock face; hands are children
m.annulus(kh, 0.93, 1.0, 0, 96)
m.annulus(kg, 0.86, 0.875, 0, 96)
for i in range(60):
    a = TAU * i / 60
    big = i % 5 == 0
    m.stroke(kh if big else kg, pol(0.76 if big else 0.8, a), pol(0.86, a), 0.05 if big else 0.012)
m.annulus(kg, 0.25, 0.27, 0, 48)
clk = m.done(False)
put('chrono', clk)
for nm_, L, w in (('chrono__clock_min', 0.78, 0.035), ('chrono__clock_hr', 0.5, 0.06)):
    hnd = M(nm_, parent=clk)
    hnd.loc = (0, 0, 0.01)
    hnd.flat(kh, [(-w, 0), (0, L), (w, 0), (0, -0.1)])
    hnd.done(False)
m = M('chrono__hourglass')
for z in (0, 1.2):
    m.lathe(goldm, [(0, z - 0.04), (0.42, z - 0.04), (0.42, z + 0.04), (0, z + 0.04)], n=6)
for i in range(3):
    a = TAU * i / 3
    m.lathe(goldm, [(0.03, 0), (0.03, 1.2)], n=6, M=Matrix.Translation((*pol(0.36, a), 0)))
m.lathe(glass, [(0.3, 0.04), (0.28, 0.3), (0.05, 0.6), (0.28, 0.9), (0.3, 1.16)], n=16, smooth=True, caps=False)
m.lathe(sandm, [(0, 0.04), (0.27, 0.04), (0.2, 0.22), (0, 0.32)], n=12, smooth=True)
m.lathe(sandm, [(0, 0.75), (0.15, 0.85), (0.24, 1.0), (0, 1.0)], n=12, smooth=True)
put('chrono', m.done())

# ---------- BLOOD ----------
bg_, bh = G['blood']
m = M('blood__bolt')
m.lathe(bg_, [(0, 0), (0.14, 0.08), (0.15, 0.2), (0.08, 0.5), (0.03, 0.9), (0, 1.1)], n=12, M=aim((0, 1, 0), (0, -0.15, 0)), smooth=True)
m.ico(bh, 0.08, TRS((0, -0.05, 0)), sub=1)
for sx in (-1, 1):
    m.ico(bg_, 0.05, TRS((sx * 0.18, 0.25, 0.05)), sub=1, smooth=True)
put('blood', m.done())
m = M('blood__scythe')
crescent_blade(m, bg_, 1.4, 0.65, 0.36, -0.05, 0.05, serr=1)
crescent_blade(m, bh, 1.25, 0.6, 0.08, -0.03, 0.07)
put('blood', m.done())
m = M('blood__moon')
m.ico(bg_, 1, sub=3, noise=0.01, smooth=True)
for _ in range(8):
    d = Vector((random.uniform(-1, 1), random.uniform(-1, 1), random.uniform(-1, 1))).normalized()
    m.ico(bh, random.uniform(0.12, 0.25), TRS(tuple(d * 0.95), scale=(1, 1, 0.3)), sub=1)
put('blood', m.done())

# ---------- SPIRIT ----------
pg, phh = G['spirit']
m = M('spirit__wisp')
m.sphere(pg, 0.2, u=16, v=10)
m.ico(phh, 0.11, sub=1)
m.lathe(pg, [(0.19, 0), (0.15, 0.25), (0.08, 0.55), (0.02, 0.85), (0, 0.95)], n=10, M=aim((0, 1, 0.15)), twist=0.5, smooth=True)
for sx in (-1, 1):
    m.sphere(void, 0.035, TRS((sx * 0.07, -0.18, 0.04)), u=8, v=6)
put('spirit', m.done())
# spectral wolf: legs, head and tail are children with pivots at the joints
m = M('spirit__wolf')
m.lathe(pg, [(0, -0.75), (0.25, -0.6), (0.32, -0.3), (0.28, 0.2), (0.22, 0.55), (0, 0.7)], n=14, M=aim((0, -1, 0), (0, 0, 0.75)), smooth=True)
m.lathe(phh, [(0.0, -0.6), (0.08, -0.45), (0.06, 0.4), (0, 0.55)], n=8, M=TRS((0, 0, 1.02), (math.pi / 2, 0, 0)), smooth=True)  # glowing spine
wolf = m.done()
put('spirit', wolf)
hd = M('spirit__wolf_head', parent=wolf)
hd.loc = (0, -0.65, 0.95)
hd.sphere(pg, 0.24, TRS((0, -0.05, 0)), u=14, v=10)
hd.lathe(pg, [(0.15, 0), (0.1, 0.25), (0.05, 0.42), (0, 0.45)], n=10, M=aim((0, -1, -0.25), (0, -0.15, -0.05)), smooth=True)
for sx in (-1, 1):
    hd.lathe(pg, [(0.07, 0), (0, 0.22)], n=5, M=aim((sx * 0.3, 0.3, 1), (sx * 0.12, 0.02, 0.15)))
    hd.sphere(phh, 0.035, TRS((sx * 0.09, -0.2, 0.07)), u=8, v=6)
hd.done()
for i, (x, y) in enumerate([(-0.16, -0.48), (0.16, -0.48), (-0.16, 0.48), (0.16, 0.48)]):
    lg2 = M(f'spirit__wolf_leg{i}', parent=wolf)
    lg2.loc = (x, y, 0.72)
    lg2.tube(pg, [(0, 0, 0), (0, 0.06 if y < 0 else -0.08, -0.38), (0, -0.02, -0.7)], [0.09, 0.06, 0.045], n=7)
    lg2.sphere(pg, 0.06, TRS((0, -0.06, -0.7), scale=(1, 1.4, 0.6)), u=8, v=6)
    lg2.done()
tl = M('spirit__wolf_tail', parent=wolf)
tl.loc = (0, 0.65, 0.85)
tl.tube(pg, [(0, 0, 0), (0, 0.3, 0.15), (0, 0.6, 0.15), (0, 0.85, 0.0)], [0.08, 0.1, 0.07, 0.01], n=7)
tl.done()
# spectral knight: wispy tail instead of legs; sword arm is a child
m = M('spirit__knight')
m.lathe(pg, [(0.0, 0.0), (0.08, 0.15), (0.2, 0.55), (0.34, 1.0), (0.4, 1.35), (0.36, 1.6), (0.22, 1.7), (0, 1.72)], n=14, twist=0.25, smooth=True)
m.sphere(pg, 0.22, TRS((0, 0, 1.92)), u=14, v=10)
m.lathe(pg, [(0.24, 1.78), (0.26, 1.98), (0.18, 2.12), (0, 2.18)], n=14, smooth=True)
m.prism(void, [(-0.15, -0.01), (0.15, -0.01), (0.15, 0.02), (-0.15, 0.02)], 0, 0.001, M=TRS((0, -0.235, 1.93), (math.pi / 2, 0, 0)))
for sx in (-1, 1):
    m.sphere(phh, 0.03, TRS((sx * 0.08, -0.215, 1.94)), u=8, v=6)
    m.sphere(pg, 1, TRS((sx * 0.42, 0, 1.55), scale=(0.17, 0.2, 0.13)), u=12, v=8)
m.tube(phh, [(0, 0.05, 2.15), (0, 0.25, 2.35), (0, 0.55, 2.3), (0, 0.8, 2.0)], [0.05, 0.08, 0.06, 0.01], n=6)
sh_ = M('spirit__knight_shield')
sh_.loc = (-0.55, -0.15, 1.15)
sh_.lathe(phh, [(0, -0.02), (0.38, -0.02), (0.4, 0.02), (0, 0.06)], n=6, M=TRS(rot=(math.pi / 2, 0, 0), scale=(1, 1.35, 1)))
kn = m.done()
sh_.parent = kn
sh_.done()
put('spirit', kn)
arm = M('spirit__knight_sword', parent=kn)
arm.loc = (0.45, 0, 1.5)
arm.tube(pg, [(0, 0, 0), (0.05, -0.15, -0.3), (0.05, -0.35, -0.45)], [0.09, 0.08, 0.07], n=7)
arm.lathe(phh, [(0, 0), (0.07, 0.05), (0.06, 1.2), (0, 1.45)], n=4, M=TRS((0.05, -0.38, -0.45), (-math.pi / 2 + 0.3, 0, 0), (1, 0.25, 1)))
arm.prism(pg, [(-0.2, -0.03), (0.2, -0.03), (0.2, 0.03), (-0.2, 0.03)], -0.03, 0.03, M=TRS((0.05, -0.4, -0.42)))
arm.done()
m = M('spirit__skull')
m.sphere(pg, 0.3, TRS((0, 0, 0.05), scale=(1, 1.1, 1)), u=16, v=12)
m.sphere(pg, 1, TRS((0, -0.14, -0.2), scale=(0.18, 0.16, 0.12)), u=12, v=8)
for sx in (-1, 1):
    m.sphere(void, 0.075, TRS((sx * 0.11, -0.25, 0.05)), u=10, v=8)
    m.sphere(phh, 0.025, TRS((sx * 0.11, -0.3, 0.05)), u=6, v=4)
m.sphere(void, 0.04, TRS((0, -0.31, -0.06)), u=8, v=6)
put('spirit', m.done())

# ---------- COSMIC ----------
xg, xh = G['cosmic']
m = M('cosmic__star')  # chunky 5-point star with a raised ridge
bm = m.bm
top, bot = bm.verts.new((0, 0, 0.12)), bm.verts.new((0, 0, -0.12))
ring = [bm.verts.new((*pol(0.38 if i % 2 == 0 else 0.16, math.pi / 2 + math.pi * i / 5), 0)) for i in range(10)]
fs = [bm.faces.new((top, ring[i], ring[(i + 1) % 10])) for i in range(10)] + [bm.faces.new((bot, ring[(i + 1) % 10], ring[i])) for i in range(10)]
m._tag(fs, xh, False)
m.ico(xg, 0.2, sub=2, smooth=True)
put('cosmic', m.done())
m = M('cosmic__moon')
m.ico(moonm, 0.3, sub=3, noise=0.006, smooth=True)
for _ in range(9):
    d = Vector((random.uniform(-1, 1), random.uniform(-1, 1), random.uniform(-1, 1))).normalized()
    m.lathe(void, [(0, 0), (random.uniform(0.04, 0.08), 0.005)], n=10, M=aim(d, d * 0.297))
put('cosmic', m.done())
m = M('cosmic__node')
m.flat(xh, starpts(4, 0.05, 0.4), 0, TRS(rot=(math.pi / 2, 0, 0)))
m.flat(xh, starpts(4, 0.05, 0.4), 0, TRS(rot=(math.pi / 2, 0, math.pi / 2)))
m.ico(xh, 0.1, sub=2, smooth=True)
m.lathe(xg, [(0.26, -0.01), (0.28, 0), (0.26, 0.01), (0.24, 0)], n=32, closed=True)
put('cosmic', m.done(False))
m = M('cosmic__comet')
m.ico(moonm, 0.35, sub=2, noise=0.05)
m.ico(xh, 0.42, sub=2, smooth=True)
m.lathe(xg, [(0, 0), (0.45, 0.3), (0.35, 1.5), (0, 3.5)], n=12, M=aim((0, 1, 0)), twist=0.4, caps=False)
put('cosmic', m.done())

# ---------- EXPLOSION ----------
xg2, xh2 = G['explosion']
m = M('explosion__grenade')
m.sphere(olive, 0.2, TRS(scale=(1, 1, 1.15)), u=16, v=12)
for k in range(4):
    m.lathe(darkmetal, [(0.2, -0.01), (0.205, 0), (0.2, 0.01)], n=16, M=TRS((0, 0, -0.12 + k * 0.08)), closed=True)
m.lathe(darkmetal, [(0.07, 0.2), (0.07, 0.3), (0, 0.3)], n=10)
m.lathe(metal, [(0.04, -0.008), (0.05, 0), (0.04, 0.008), (0.03, 0)], n=12, M=TRS((0.1, 0, 0.3), (math.pi / 2, 0, 0)), closed=True)
m.ico(xh2, 0.035, TRS((0, 0, 0.32)), sub=1)
put('explosion', m.done())
m = M('explosion__sticky')
m.ico(darkmetal, 0.2, sub=2, smooth=True)
for _ in range(14):
    d = Vector((random.uniform(-1, 1), random.uniform(-1, 1), random.uniform(-1, 1))).normalized()
    m.lathe(darkmetal, [(0.035, 0), (0, 0.14)], n=5, M=aim(d, d * 0.18))
m.ico(xh2, 0.08, TRS((0, -0.17, 0)), sub=1)
for _ in range(4):
    d = Vector((random.uniform(-1, 1), random.uniform(-1, 1), random.uniform(-1, 1))).normalized()
    m.ico(xg2, 0.07, TRS(tuple(d * 0.19), scale=(1, 1, 0.5)), sub=1, smooth=True)
put('explosion', m.done())
m = M('explosion__mine')
m.lathe(darkmetal, [(0, 0), (0.36, 0), (0.38, 0.05), (0.33, 0.1), (0.2, 0.15), (0, 0.16)], n=20, smooth=True)
m.lathe(xh2, [(0.3, 0.095), (0.32, 0.1), (0.3, 0.105)], n=24, closed=True)
m.ico(xh2, 0.05, TRS((0, 0, 0.16)), sub=1)
for i in range(4):
    a = TAU * i / 4
    m.lathe(metal, [(0.015, 0), (0.01, 0.1)], n=5, M=aim((math.cos(a) * 0.4, math.sin(a) * 0.4, 1), (*pol(0.12, a), 0.13)))
put('explosion', m.done())
m = M('explosion__bomb')  # aerial bomb, nose toward -Z (falls straight down)
m.lathe(olive, [(0, -0.55), (0.12, -0.45), (0.17, -0.2), (0.17, 0.25), (0.1, 0.45), (0.04, 0.55)], n=14, smooth=True)
m.lathe(redpaint, [(0.172, -0.25), (0.172, -0.17)], n=14, caps=False)
for k in range(4):
    a = TAU * k / 4
    m.prism(darkmetal, [(0, 0.3), (0.2, 0.5), (0.2, 0.75), (0, 0.6)], -0.01, 0.01, M=Matrix.Rotation(a, 4, 'Z') @ Matrix.Rotation(math.pi / 2, 4, 'X'))
put('explosion', m.done())

# ---------- save, export, render ----------
bpy.context.view_layer.update()
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(HERE, 'elements.blend'))
export('elements.glb', ALL)
pack_bundle()

pv = Previewer(res=560)
pv.render('elements_circles', CIRCLES, dirv=(0, -0.08, 1), lens=50)
for el, objs in BY_EL.items():
    pv.render('el_' + el, objs, dirv=(0.35, -1, 0.55), lens=50)
print('MAGE_PACT_ELEMENTS_OK', len(ALL))
