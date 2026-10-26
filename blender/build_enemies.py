# Builds the enemy roster as articulated rigs: each enemy is an empty root ("grunt", "brute"...) with child parts
# named <type>_body / _head / _jaw / _armL / _armR / _legL / _legR / _leg0-3 / _tail / _ring / _tent0-5 / _shield /
# _weapon / _staff / _fuse / _crown, each with its origin at the joint so the game can swing it.
# Exports assets/enemies.glb, saves blender/enemies.blend, renders a lineup preview.
# Run: blender --background --factory-startup --python blender/build_enemies.py
# Conventions: feet on z=0, facing Blender -Y (three.js +Z).
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from lib import *

random.seed(23)
scene = reset()
E = coll('enemies')

skin = mat('imp_skin', (0.07, 0.045, 0.1), rough=0.5)
belly = mat('imp_belly', (0.16, 0.09, 0.2), rough=0.6)
bone = mat('bone', (0.82, 0.76, 0.62), rough=0.5)
claw = mat('claw', (0.16, 0.12, 0.1), rough=0.4)
eye_red = mat('eye_red', (1, 0.12, 0.04), emit=8)
eye_yel = mat('eye_yellow', (1, 0.8, 0.1), emit=8)
eye_grn = mat('eye_green', (0.3, 1, 0.35), emit=8)
eye_blu = mat('eye_blue', (0.4, 0.75, 1.0), emit=8)
mouth = mat('mouth_glow', (1, 0.3, 0.05), emit=4)
hide = mat('hound_hide', (0.2, 0.05, 0.05), rough=0.55)
flesh = mat('hound_flesh', (0.5, 0.06, 0.08), rough=0.4, emit=0.6, ecolor=(1, 0.1, 0.1))
golem = mat('golem_stone', (0.25, 0.22, 0.24), rough=0.92)
moss = mat('golem_moss', (0.16, 0.24, 0.12), rough=0.95)
ember = mat('ember', (1, 0.35, 0.05), emit=6)
eyeball = mat('eyeball', (0.85, 0.82, 0.8), rough=0.25)
lid = mat('eyelid', (0.12, 0.08, 0.14), rough=0.5)
iris = mat('iris_green', (0.2, 1, 0.4), emit=5)
pupil = mat('pupil', (0.0, 0.0, 0.0), rough=0.2)
slime = mat('slime', (0.12, 0.62, 0.2), rough=0.08, emit=0.5, ecolor=(0.2, 0.9, 0.3), alpha=0.55)
slime_core = mat('slime_core', (0.5, 1, 0.4), emit=5)
obsidian = mat('obsidian', (0.035, 0.025, 0.045), rough=0.22, metal=0.4)
magma = mat('boss_magma', (1, 0.3, 0.04), emit=7)
armor = mat('armor', (0.24, 0.26, 0.31), rough=0.32, metal=0.9)
trim = mat('gold_trim', (0.95, 0.68, 0.25), rough=0.3, metal=1)
cloth = mat('cloth_red', (0.35, 0.04, 0.06), rough=0.85)
robe = mat('robe_dark', (0.06, 0.05, 0.07), rough=0.9)
robe2 = mat('robe_trim', (0.12, 0.3, 0.12), rough=0.7)
mask = mat('mask_bone', (0.75, 0.72, 0.62), rough=0.45)
wood = mat('staff_wood', (0.22, 0.13, 0.07), rough=0.8)
sham_glow = mat('shaman_glow', (0.3, 1, 0.5), emit=6)
bomb_m = mat('bomb_metal', (0.09, 0.09, 0.1), rough=0.35, metal=0.7)
band = mat('bomb_band', (0.65, 0.08, 0.05), rough=0.45, metal=0.3)
fuse_g = mat('fuse_glow', (1, 0.6, 0.1), emit=9)
gob = mat('goblin_skin', (0.28, 0.42, 0.14), rough=0.6)
leather = mat('leather', (0.2, 0.11, 0.05), rough=0.8)
skull_m = mat('skull', (0.78, 0.74, 0.64), rough=0.5)

ROOTS, PARTS = [], {}
_slot = [0]


def root(name, h):
    """Empty at the feet; the game clones it and swings the named child parts."""
    ob = bpy.data.objects.new(name, None)
    ob.location = (_slot[0] * 4.0, 0, 0)
    _slot[0] += 1 + (h > 4)
    E.objects.link(ob)
    ROOTS.append(ob)
    PARTS[name] = []
    return ob


def part(rt, name, parent, loc, build, smooth_sub=0):
    m = Mesh(f'{rt.name}_{name}', E, loc=loc, parent=parent)
    build(m)
    ob = m.done()
    if smooth_sub:
        apply_subsurf(ob, smooth_sub)
    PARTS[rt.name].append(ob)
    return ob


def ellipsoid(m, mt, c, r, u=16, v=10, noise=0):
    m.sphere(mt, 1, TRS(c, scale=r), u=u, v=v, noise=noise)


def horn(m, mt, base, d, L, r, curl=(0, 0, 0), n=6, seg=6):
    d, curl = Vector(d).normalized(), Vector(curl)
    pts, p = [], Vector(base)
    for i in range(seg + 1):
        pts.append(p.copy())
        d = (d + curl * (1 / seg)).normalized()
        p = p + d * (L / seg)
    m.tube(mt, pts, [r * (1 - i / seg) + 0.003 for i in range(seg + 1)], n=n)


def claws(m, mt, base, d, n=3, L=0.12, r=0.02, spread_=0.35, side=Vector((1, 0, 0))):
    d = Vector(d).normalized()
    for k in range(n):
        off = (k - (n - 1) / 2) * spread_
        dd = (d + side * off * 0.6).normalized()
        horn(m, mt, Vector(base) + side * off * 0.05, dd, L, r, curl=(0, 0, -0.6), n=5, seg=3)


def teeth(m, mt, center, w, n, L, down=True, depth=-1):
    for k in range(n):
        x = (k - (n - 1) / 2) / max(1, n - 1) * w
        m.lathe(mt, [(L * 0.25, 0), (0, L)], n=4, M=aim((0, 0, -1 if down else 1), (center[0] + x, center[1], center[2])))


# =========================================================== GRUNT (horned shadow imp)
rt = root('grunt', 1.8)
body = part(rt, 'body', rt, (0, 0, 0.9), lambda m: (
    m.lathe(skin, [(0, -0.12), (0.26, -0.05), (0.33, 0.18), (0.36, 0.42), (0.3, 0.6), (0.16, 0.7), (0, 0.72)], n=14, M=TRS(rot=(0.3, 0, 0), scale=(1.05, 0.85, 1)), smooth=True),
    ellipsoid(m, belly, (0, -0.2, 0.18), (0.22, 0.12, 0.24)),
    [horn(m, bone, (0, 0.18 - k * 0.02, 0.62 - k * 0.15), (0, 0.6, 0.8), 0.22 - k * 0.03, 0.045) for k in range(4)],
), smooth_sub=1)
part(rt, 'head', body, (0, -0.2, 0.68), lambda m: (
    ellipsoid(m, skin, (0, -0.06, 0.14), (0.24, 0.24, 0.22), u=18, v=12),
    ellipsoid(m, skin, (0, -0.2, 0.2), (0.2, 0.08, 0.06)),  # brow ridge
    [ellipsoid(m, eye_red, (sx * 0.09, -0.28, 0.15), (0.05, 0.03, 0.035), u=10, v=6) for sx in (-1, 1)],
    [horn(m, bone, (sx * 0.14, -0.08, 0.3), (sx * 0.5, 0.3, 0.8), 0.42, 0.06, curl=(sx * 0.4, 0.8, -0.6)) for sx in (-1, 1)],
    [ellipsoid(m, skin, (sx * 0.23, -0.02, 0.18), (0.03, 0.1, 0.05)) for sx in (-1, 1)],  # pointed ears
))
part(rt, 'jaw', PARTS['grunt'][-1], (0, -0.12, 0.04), lambda m: (
    ellipsoid(m, skin, (0, -0.1, -0.02), (0.16, 0.12, 0.06)),
    ellipsoid(m, mouth, (0, -0.15, 0.03), (0.1, 0.06, 0.02)),
    teeth(m, bone, (0, -0.21, 0.02), 0.18, 5, 0.06, down=False),
))
for sx, nm in ((-1, 'armL'), (1, 'armR')):
    def arm(m, sx=sx):
        sh = Vector((0, 0, 0)); el = Vector((sx * 0.14, -0.12, -0.38)); wr = Vector((sx * 0.1, -0.32, -0.7))
        m.tube(skin, [sh, el, wr], [0.09, 0.07, 0.055], n=8)
        ellipsoid(m, skin, tuple(wr + Vector((0, -0.04, -0.04))), (0.07, 0.08, 0.05))
        claws(m, bone, wr + Vector((0, -0.08, -0.05)), (0, -0.6, -1), n=3, L=0.16, r=0.022)
        ellipsoid(m, skin, (0, 0, 0), (0.12, 0.11, 0.11))
    part(rt, nm, body, (sx * 0.34, -0.1, 0.42), arm)
for sx, nm in ((-1, 'legL'), (1, 'legR')):
    def leg(m, sx=sx):
        hip = Vector((0, 0, 0)); kn = Vector((sx * 0.03, -0.14, -0.38)); an = Vector((sx * 0.02, 0.08, -0.72)); ft = Vector((sx * 0.02, -0.05, -0.88))
        m.tube(skin, [hip, kn, an, ft], [0.11, 0.085, 0.06, 0.05], n=8)
        ellipsoid(m, skin, tuple(ft + Vector((0, -0.08, -0.01))), (0.08, 0.14, 0.04))
        claws(m, claw, ft + Vector((0, -0.2, -0.01)), (0, -1, -0.3), n=3, L=0.08, r=0.016)
    part(rt, nm, rt, (sx * 0.17, 0.02, 0.9), leg)
part(rt, 'tail', body, (0, 0.24, 0.02), lambda m: (
    m.tube(skin, [(0, 0, 0), (0, 0.25, -0.15), (0.05, 0.5, -0.1), (0.1, 0.72, 0.08)], [0.06, 0.045, 0.03, 0.015], n=7),
    m.lathe(bone, [(0.05, 0), (0, 0.16)], n=4, M=aim((0.3, 0.5, 0.8), (0.1, 0.72, 0.08))),
))

# =========================================================== RUNNER (feral hound)
rt = root('runner', 1.0)
body = part(rt, 'body', rt, (0, 0, 0.62), lambda m: (
    m.lathe(hide, [(0, -0.58), (0.17, -0.45), (0.23, -0.15), (0.2, 0.2), (0.15, 0.45), (0, 0.55)], n=12, M=aim((0, 1, 0)), smooth=True),
    ellipsoid(m, flesh, (0, -0.1, -0.12), (0.12, 0.38, 0.08)),
    [m.tube(flesh, [(sx * 0.18, -0.25 + k * 0.12, 0.05), (sx * 0.2, -0.22 + k * 0.12, -0.05)], 0.018, n=5) for sx in (-1, 1) for k in range(4)],  # exposed ribs
    [horn(m, bone, (0, -0.35 + k * 0.17, 0.17), (0, 0.4, 1), 0.2 - k * 0.02, 0.035, curl=(0, 0.6, 0)) for k in range(5)],
), smooth_sub=1)
head = part(rt, 'head', body, (0, -0.55, 0.08), lambda m: (
    m.lathe(hide, [(0.13, 0), (0.15, -0.12), (0.1, -0.3), (0.05, -0.42), (0, -0.45)], n=12, M=aim((0, 1, 0)), smooth=True),
    ellipsoid(m, eye_yel, (0, -0.2, 0.1), (0.07, 0.05, 0.04), u=10, v=6),
    [ellipsoid(m, eye_yel, (sx * 0.07, -0.16, 0.07), (0.025, 0.025, 0.02), u=8, v=6) for sx in (-1, 1)],
    [horn(m, bone, (sx * 0.06, -0.38, -0.03), (sx * 0.2, -1, -0.5), 0.14, 0.025) for sx in (-1, 1)],
    teeth(m, bone, (0, -0.38, -0.02), 0.08, 4, 0.05),
))
part(rt, 'jaw', head, (0, -0.06, -0.06), lambda m: (
    m.lathe(hide, [(0.09, 0), (0.07, -0.2), (0.03, -0.33), (0, -0.34)], n=10, M=aim((0, 1, 0)) @ Matrix.Diagonal((1, 0.6, 1, 1)), smooth=True),
    teeth(m, bone, (0, -0.25, 0.04), 0.06, 4, 0.04, down=False),
    ellipsoid(m, mouth, (0, -0.15, 0.04), (0.05, 0.12, 0.015)),
))
for i, (x, y) in enumerate([(-0.17, -0.32), (0.17, -0.32), (-0.17, 0.3), (0.17, 0.3)]):
    sx, front = (1 if x > 0 else -1), y < 0
    def legq(m, sx=sx, front=front):
        hip = Vector((0, 0, 0)); kn = Vector((sx * 0.18, -0.05 if front else 0.12, 0.05)); an = Vector((sx * 0.24, -0.02 if front else 0.15, -0.38)); ft = Vector((sx * 0.25, -0.1 if front else 0.1, -0.6))
        m.tube(hide, [hip, kn, an, ft], [0.065, 0.045, 0.03, 0.012], n=6)
        horn(m, bone, kn, (sx * 0.4, 0, 1), 0.1, 0.02)
    part(rt, f'leg{i}', body, (x * 0.6, y, -0.02), legq)
part(rt, 'tail', body, (0, 0.52, 0.04), lambda m: (
    m.tube(hide, [(0, 0, 0), (0, 0.3, 0.12), (0, 0.55, 0.05), (0, 0.75, -0.08)], [0.06, 0.045, 0.03, 0.006], n=6),
    [m.lathe(bone, [(0.025, 0), (0, 0.08)], n=4, M=aim((0, 0.3, 1), (0, 0.2 + k * 0.17, 0.1))) for k in range(3)],
))

# =========================================================== SHOOTER (floating watcher eye)
rt = root('shooter', 2.3)
body = part(rt, 'body', rt, (0, 0, 1.7), lambda m: (
    m.sphere(eyeball, 0.45, u=28, v=18),
    m.lathe(lid, [(0.47, -0.15), (0.49, 0.05), (0.42, 0.28), (0.25, 0.42), (0, 0.47)], n=24, M=TRS(rot=(-1.05, 0, 0)), smooth=True),  # upper lid
    m.lathe(lid, [(0, -0.47), (0.25, -0.42), (0.42, -0.28), (0.48, -0.08), (0.47, 0.0)], n=24, M=TRS(rot=(1.15, 0, 0)), smooth=True),  # lower lid
    [m.tube(flesh, [(0.4 * math.cos(a), 0.15 + 0.2 * math.sin(a), 0.3 * math.sin(a * 2)), (0.43 * math.cos(a + 0.4), 0.05, 0.3 * math.sin(a * 2 + 0.4))], 0.012, n=4) for a in (0.5, 1.4, 2.4, 3.6, 4.6, 5.5)],  # veins
    [horn(m, obsidian, (0.2 * math.cos(a), 0.1, 0.38 + 0.05 * math.sin(a)), (0.3 * math.cos(a), 0.3, 1), 0.35, 0.05, curl=(0, 0.6, 0)) for a in (1.1, 1.57, 2.04)],
))
part(rt, 'eye', body, (0, 0, 0), lambda m: (
    m.sphere(iris, 0.2, TRS((0, -0.33, 0), scale=(1, 0.5, 1)), u=18, v=12),
    m.sphere(pupil, 0.09, TRS((0, -0.42, 0), scale=(0.45, 0.3, 1)), u=12, v=8),
))
part(rt, 'ring', body, (0, 0, 0), lambda m: (
    m.lathe(eye_grn, [(0.62, -0.025), (0.7, -0.025), (0.7, 0.025), (0.62, 0.025)], n=48, M=TRS(rot=(0.35, 0, 0)), closed=True),
    [m.lathe(obsidian, [(0, 0), (0.06, 0.05), (0.04, 0.16), (0, 0.22)], n=5, M=TRS(rot=(0.35, 0, 0)) @ Matrix.Translation((*pol(0.66, TAU * k / 6), -0.08))) for k in range(6)],
))
for i in range(5):
    a = TAU * i / 5 + 0.3
    def tent(m, a=a):
        pts = [Vector((0, 0, 0))]
        d = Vector((math.cos(a) * 0.25, math.sin(a) * 0.25, -1))
        for k in range(6):
            pts.append(pts[-1] + d.normalized() * 0.15 + Vector((math.cos(a + k) * 0.03, math.sin(a + k) * 0.03, 0)))
        m.tube(lid, pts, [0.065 * (1 - k / 7) + 0.006 for k in range(7)], n=7)
        m.sphere(iris, 0.025, TRS(tuple(pts[-1])), u=8, v=6)
    part(rt, f'tent{i}', body, (*pol(0.25, a), -0.36), tent)

# =========================================================== BOMBER (living powder keg)
rt = root('bomber', 1.25)
body = part(rt, 'body', rt, (0, 0, 0.45), lambda m: (
    m.sphere(bomb_m, 0.42, TRS((0, 0, 0.32)), u=24, v=16),
    [m.lathe(band, [(0.425, z - 0.03), (0.43, z), (0.425, z + 0.03)], n=24, M=Matrix.Translation((0, 0, 0.32)), closed=True) for z in (-0.12, 0.12)],
    [m.lathe(trim, [(0.03, 0), (0.03, 0.02)], n=6, M=aim(Vector((math.cos(a), math.sin(a), 0.2)), Vector((0.41 * math.cos(a), 0.41 * math.sin(a), 0.4)))) for a in [TAU * k / 10 for k in range(10)]],  # rivets
    [ellipsoid(m, eye_yel, (sx * 0.12, -0.38, 0.42), (0.06, 0.03, 0.07), u=10, v=6) for sx in (-1, 1)],
    ellipsoid(m, mouth, (0, -0.39, 0.24), (0.14, 0.03, 0.04)),
    teeth(m, bone, (0, -0.41, 0.27), 0.22, 6, 0.05),
    m.lathe(bomb_m, [(0.1, 0.72), (0.11, 0.8), (0.07, 0.84), (0, 0.84)], n=12),
))
part(rt, 'fuse', body, (0, 0, 0.84), lambda m: (
    m.tube(leather, [(0, 0, 0), (0.03, 0, 0.12), (0.1, 0.02, 0.2), (0.16, 0.05, 0.22)], 0.02, n=6),
    m.ico(fuse_g, 0.06, TRS((0.17, 0.05, 0.23)), sub=1),
))
for sx, nm in ((-1, 'legL'), (1, 'legR')):
    part(rt, nm, rt, (sx * 0.18, 0, 0.42), lambda m, sx=sx: (
        m.tube(gob, [(0, 0, 0), (sx * 0.04, -0.05, -0.2), (0, 0.02, -0.38)], [0.07, 0.055, 0.045], n=7),
        ellipsoid(m, leather, (0, -0.06, -0.4), (0.08, 0.13, 0.05)),
    ))
for sx, nm in ((-1, 'armL'), (1, 'armR')):
    part(rt, nm, body, (sx * 0.4, -0.05, 0.42), lambda m, sx=sx: (
        m.tube(gob, [(0, 0, 0), (sx * 0.12, -0.1, -0.15), (sx * 0.1, -0.22, -0.3)], [0.05, 0.04, 0.035], n=6),
        ellipsoid(m, gob, (sx * 0.1, -0.25, -0.33), (0.05, 0.05, 0.05)),
        claws(m, claw, Vector((sx * 0.1, -0.28, -0.36)), (0, -1, -0.5), n=3, L=0.06, r=0.012),
    ))

# =========================================================== SPLITTER (slime with a skull inside)
rt = root('splitter', 1.0)
body = part(rt, 'body', rt, (0, 0, 0), lambda m: (
    m.sphere(slime, 0.62, TRS((0, 0, 0.44), scale=(1, 1, 0.74)), u=28, v=18, noise=0.02),
    m.sphere(slime_core, 0.16, TRS((0, 0.05, 0.42)), u=14, v=10),
    ellipsoid(m, skull_m, (0, -0.15, 0.48), (0.16, 0.15, 0.15)),
    [ellipsoid(m, pupil, (sx * 0.06, -0.29, 0.5), (0.04, 0.02, 0.04), u=8, v=6) for sx in (-1, 1)],
    [horn(m, bone, (random.uniform(-0.3, 0.3), random.uniform(-0.2, 0.3), 0.3), (random.uniform(-1, 1), random.uniform(-1, 1), random.uniform(-0.3, 0.3)), 0.2, 0.02, seg=2) for _ in range(5)],  # floating bones
    [m.sphere(slime, random.uniform(0.06, 0.12), TRS((*pol(0.5, random.uniform(0, TAU)), random.uniform(0.1, 0.55))), u=10, v=6) for _ in range(6)],
    [ellipsoid(m, eye_yel, (sx * 0.2, -0.5, 0.66), (0.07, 0.04, 0.07), u=10, v=6) for sx in (-1, 1)],
))

# =========================================================== BRUTE (rock golem)
rt = root('brute', 2.7)
def brute_body(m):
    m.ico(golem, 1, TRS((0, 0, 0.75), (0.2, 0, 0), (0.85, 0.65, 0.75)), sub=2, noise=0.07)
    m.ico(moss, 0.55, TRS((0, 0.25, 1.3), scale=(1.1, 0.6, 0.35)), sub=1, noise=0.06)
    m.ico(ember, 0.17, TRS((0, -0.62, 0.85)), sub=1)
    for k in range(5):  # glowing cracks across the chest
        a = -0.6 + k * 0.3
        m.tube(ember, [(a * 0.6, -0.58, 0.5 + k * 0.05), (a * 0.8, -0.62, 0.8), (a * 0.5, -0.55, 1.05 + k * 0.03)], 0.018, n=4)
    for _ in range(6):
        d = Vector((random.uniform(-1, 1), random.uniform(-0.2, 1), random.uniform(0.3, 1))).normalized()
        crystal(m, ember, aim(d, Vector((0, 0.1, 0.8)) + d * 0.7), 0.07, random.uniform(0.3, 0.5))
body = part(rt, 'body', rt, (0, 0, 0.85), brute_body)
part(rt, 'head', body, (0, -0.35, 1.4), lambda m: (
    m.ico(golem, 0.32, TRS((0, -0.05, 0.12)), sub=1, noise=0.04),
    [ellipsoid(m, ember, (sx * 0.11, -0.33, 0.14), (0.05, 0.03, 0.035), u=10, v=6) for sx in (-1, 1)],
    [crystal(m, ember, aim((sx * 0.6, 0.2, 1), (sx * 0.18, 0, 0.3)), 0.06, 0.32) for sx in (-1, 1)],
))
for sx, nm in ((-1, 'armL'), (1, 'armR')):
    def barm(m, sx=sx):
        m.ico(golem, 0.4, TRS((0, 0, 0)), sub=1, noise=0.06)
        m.ico(golem, 0.3, TRS((sx * 0.12, -0.05, -0.55), scale=(1, 1, 1.5)), sub=1, noise=0.04)
        m.ico(golem, 0.42, TRS((sx * 0.15, -0.15, -1.15), scale=(1, 1.05, 0.9)), sub=1, noise=0.07)
        for k in range(3):
            crystal(m, ember, aim((sx * 0.5, -0.3, -1), (sx * 0.15 + (k - 1) * 0.12, -0.35, -1.25)), 0.05, 0.22)
        crystal(m, ember, aim((sx * 0.3, 0.2, 1), (sx * 0.1, 0.05, 0.3)), 0.07, 0.4)
    part(rt, nm, body, (sx * 1.0, -0.05, 1.15), barm)
for sx, nm in ((-1, 'legL'), (1, 'legR')):
    part(rt, nm, rt, (sx * 0.42, 0, 0.9), lambda m, sx=sx: (
        m.ico(golem, 0.32, TRS((0, 0, -0.3), scale=(1, 1, 1.4)), sub=1, noise=0.04),
        m.ico(golem, 0.36, TRS((0, -0.08, -0.78), scale=(1.1, 1.3, 0.6)), sub=1, noise=0.05),
    ))

# =========================================================== KNIGHT (shielded death knight)
rt = root('knight', 2.1)
def kbody(m):
    m.lathe(armor, [(0, -0.05), (0.24, -0.02), (0.28, 0.2), (0.34, 0.45), (0.32, 0.62), (0.18, 0.7), (0, 0.72)], n=16, M=TRS(scale=(1, 0.75, 1)), smooth=True)
    m.lathe(trim, [(0.29, 0.18), (0.31, 0.2), (0.29, 0.22)], n=16, M=TRS(scale=(1, 0.75, 1)), closed=True)
    m.prism(cloth, [(-0.18, 0), (0.18, 0), (0.15, -0.6), (0, -0.7), (-0.15, -0.6)], -0.01, 0.01, M=TRS((0, -0.23, 0.1), (math.pi / 2, 0, 0)))  # tabard front
    m.prism(cloth, [(-0.2, 0), (0.2, 0), (0.2, -0.65), (-0.2, -0.65)], -0.01, 0.01, M=TRS((0, 0.2, 0.1), (math.pi / 2, 0, 0)))
    for sx in (-1, 1):  # pauldrons
        ellipsoid(m, armor, (sx * 0.36, 0, 0.6), (0.17, 0.17, 0.12), u=14, v=8)
        m.lathe(trim, [(0.17, -0.01), (0.175, 0), (0.17, 0.01)], n=14, M=TRS((sx * 0.36, 0, 0.58)), closed=True)
        horn(m, bone, (sx * 0.4, 0.02, 0.68), (sx * 0.5, 0, 1), 0.18, 0.035)
body = part(rt, 'body', rt, (0, 0, 1.1), kbody)
part(rt, 'head', body, (0, 0, 0.72), lambda m: (
    m.lathe(armor, [(0, -0.02), (0.15, 0.0), (0.17, 0.15), (0.15, 0.28), (0.08, 0.34), (0, 0.35)], n=16, smooth=True),
    m.prism(pupil, [(-0.11, 0), (0.11, 0), (0.11, 0.025), (-0.11, 0.025)], 0, 0.02, M=TRS((0, -0.16, 0.16), (math.pi / 2, 0, 0))),
    [ellipsoid(m, eye_blu, (sx * 0.05, -0.165, 0.17), (0.025, 0.01, 0.012), u=8, v=6) for sx in (-1, 1)],
    m.lathe(trim, [(0.17, 0.14), (0.18, 0.15), (0.17, 0.16)], n=16, closed=True),
    m.tube(cloth, [(0, 0.05, 0.33), (0, 0.2, 0.42), (0, 0.38, 0.35), (0, 0.5, 0.15)], [0.04, 0.06, 0.05, 0.02], n=6),
))
for sx, nm in ((-1, 'legL'), (1, 'legR')):
    part(rt, nm, rt, (sx * 0.14, 0, 1.0), lambda m, sx=sx: (
        m.tube(armor, [(0, 0, 0), (0, -0.04, -0.5), (0, 0.02, -0.92)], [0.1, 0.08, 0.07], n=8),
        ellipsoid(m, trim, (0, -0.07, -0.5), (0.07, 0.05, 0.06), u=10, v=6),
        ellipsoid(m, armor, (0, -0.08, -0.96), (0.08, 0.15, 0.05), u=10, v=6),
    ))
arm = part(rt, 'armL', body, (-0.38, 0, 0.5), lambda m: (
    m.tube(armor, [(0, 0, 0), (-0.05, -0.1, -0.3), (-0.02, -0.28, -0.42)], [0.08, 0.07, 0.06], n=8),
))
part(rt, 'shield', arm, (-0.05, -0.38, -0.4), lambda m: (
    m.prism(armor, [(-0.32, 0.4), (0.32, 0.4), (0.3, -0.1), (0, -0.5), (-0.3, -0.1)], -0.04, 0.04, M=TRS(rot=(math.pi / 2, 0, 0))),
    m.prism(trim, [(-0.34, 0.42), (0.34, 0.42), (0.32, -0.11), (0, -0.53), (-0.32, -0.11)], -0.055, -0.04, M=TRS(rot=(math.pi / 2, 0, 0))),
    m.prism(cloth, [(-0.24, 0.32), (0.24, 0.32), (0.22, -0.06), (0, -0.4), (-0.22, -0.06)], 0.04, 0.055, M=TRS(rot=(math.pi / 2, 0, 0))),
    ellipsoid(m, skull_m, (0, -0.09, 0.05), (0.1, 0.04, 0.11), u=12, v=8),
    [ellipsoid(m, eye_blu, (sx * 0.035, -0.125, 0.06), (0.018, 0.01, 0.018), u=6, v=4) for sx in (-1, 1)],
))
arm = part(rt, 'armR', body, (0.38, 0, 0.5), lambda m: (
    m.tube(armor, [(0, 0, 0), (0.06, -0.08, -0.3), (0.04, -0.22, -0.48)], [0.08, 0.07, 0.06], n=8),
))
part(rt, 'weapon', arm, (0.04, -0.26, -0.5), lambda m: (
    m.lathe(leather, [(0.025, -0.12), (0.025, 0.1)], n=6),
    m.prism(trim, [(-0.16, -0.02), (0.16, -0.02), (0.16, 0.02), (-0.16, 0.02)], 0.1, 0.14, M=TRS(rot=(0, 0, 0))),
    m.lathe(armor, [(0, 0.12), (0.06, 0.14), (0.05, 0.95), (0, 1.1)], n=4, M=TRS(scale=(1, 0.25, 1))),
    m.lathe(eye_blu, [(0, 0.16), (0.012, 0.18), (0.01, 0.9), (0, 0.98)], n=4, M=TRS((0, -0.016, 0), scale=(1, 0.5, 1))),
))

# =========================================================== SHAMAN (hooded cultist healer)
rt = root('shaman', 2.1)
def sbody(m):
    m.lathe(robe, [(0, 0.0), (0.12, 0.0), (0.3, 0.25), (0.34, 0.6), (0.3, 0.95), (0.22, 1.2), (0.12, 1.3), (0, 1.32)], n=16, smooth=True, jag=0.08)
    m.lathe(robe2, [(0.305, 0.9), (0.31, 0.95), (0.3, 1.0)], n=16, closed=True)
    for k in range(7):  # tattered strips trailing below
        a = TAU * k / 7
        m.tube(robe, [(*pol(0.12, a), 0.05), (*pol(0.15, a + 0.2), -0.25), (*pol(0.1, a + 0.4), -0.55)], [0.06, 0.04, 0.005], n=5)
    for k in range(6):  # bone charms on a cord
        a = -0.8 + k * 0.32
        ellipsoid(m, mask, (0.28 * math.sin(a), -0.27 * math.cos(a) * 0.8, 1.0 - 0.06 * math.cos(a * 2)), (0.03, 0.02, 0.05), u=8, v=6)
body = part(rt, 'body', rt, (0, 0, 0.45), sbody)
part(rt, 'head', body, (0, 0, 1.3), lambda m: (
    m.lathe(robe, [(0, -0.05), (0.2, 0.0), (0.24, 0.18), (0.2, 0.36), (0.1, 0.46), (0, 0.5)], n=16, M=TRS((0, 0.04, 0)), smooth=True),
    m.lathe(robe2, [(0.21, 0.0), (0.22, 0.02), (0.21, 0.04)], n=16, M=TRS((0, 0.04, 0)), closed=True),
    ellipsoid(m, pupil, (0, -0.12, 0.18), (0.15, 0.08, 0.15)),
    ellipsoid(m, mask, (0, -0.17, 0.17), (0.11, 0.04, 0.13), u=14, v=10),
    [ellipsoid(m, sham_glow, (sx * 0.045, -0.205, 0.2), (0.022, 0.01, 0.015), u=8, v=6) for sx in (-1, 1)],
    [horn(m, bone, (sx * 0.12, -0.05, 0.34), (sx * 0.6, 0.4, 0.7), 0.28, 0.035, curl=(sx * 0.3, 0.6, -0.4)) for sx in (-1, 1)],
))
part(rt, 'armL', body, (-0.3, -0.02, 1.1), lambda m: (
    m.tube(robe, [(0, 0, 0), (-0.1, -0.12, -0.25), (-0.08, -0.25, -0.4)], [0.08, 0.09, 0.1], n=8),
    ellipsoid(m, mask, (-0.08, -0.29, -0.44), (0.04, 0.05, 0.04), u=8, v=6),
))
arm = part(rt, 'armR', body, (0.3, -0.02, 1.1), lambda m: (
    m.tube(robe, [(0, 0, 0), (0.08, -0.15, -0.2), (0.06, -0.3, -0.25)], [0.08, 0.09, 0.1], n=8),
    ellipsoid(m, mask, (0.06, -0.34, -0.26), (0.04, 0.05, 0.04), u=8, v=6),
))
part(rt, 'staff', arm, (0.06, -0.36, -0.26), lambda m: (
    m.tube(wood, [(0, 0, -1.1), (0.02, 0, -0.3), (-0.01, 0, 0.4), (0.03, 0, 0.75)], [0.03, 0.03, 0.028, 0.035], n=7),
    m.tube(wood, [(0.03, 0, 0.75), (0.15, 0, 0.9), (0.08, 0, 1.05), (-0.06, 0, 0.98)], [0.035, 0.03, 0.025, 0.015], n=6),
    m.ico(sham_glow, 0.09, TRS((0.05, 0, 0.92)), sub=1),
    ellipsoid(m, skull_m, (0.0, 0, 0.62), (0.07, 0.07, 0.08), u=10, v=8),
))
part(rt, 'ring', body, (0, 0, 0.6), lambda m: (
    m.annulus(sham_glow, 0.55, 0.57, 0, 64),
    [m.polyline(sham_glow, [(0.62 * math.cos(TAU * k / 9) + 0.04 * math.cos(TAU * j / 3 + k), 0.62 * math.sin(TAU * k / 9) + 0.04 * math.sin(TAU * j / 3 + k)) for j in range(3)], 0.012, closed=True) for k in range(9)],
))

# =========================================================== BOSS (the Obsidian Tyrant)
rt = root('boss', 5.6)
def boss_body(m):
    m.ico(magma, 1.0, TRS((0, 0, 1.25), (0.15, 0, 0), (1.35, 1.0, 1.25)), sub=2)  # molten core under the plates
    for _ in range(34):
        d = Vector((random.uniform(-1, 1), random.uniform(-1, 1), random.uniform(-0.6, 1))).normalized()
        q = d.to_track_quat('Z', 'Y').to_matrix().to_4x4()
        s_ = random.uniform(0.45, 0.65)
        m.ico(obsidian, 1, Matrix.Translation(Vector((0, 0, 1.25)) + Vector((d.x * 1.3, d.y * 0.95, d.z * 1.2))) @ q @ Matrix.Diagonal((s_, s_ * 0.8, s_ * 0.45, 1)), sub=1, noise=0.04)
    for k in range(7):  # dorsal spikes
        a = TAU * k / 7
        horn(m, obsidian, (math.cos(a) * 0.5, 0.55 + math.sin(a) * 0.25, 2.1 + math.sin(a) * 0.1), (math.cos(a) * 0.3, 0.6, 1), 0.9, 0.12, curl=(0, 0.6, 0))
    m.ico(magma, 0.38, TRS((0, -1.0, 1.4)), sub=2, smooth=True)
body = part(rt, 'body', rt, (0, 0, 1.9), boss_body)
head = part(rt, 'head', body, (0, -0.55, 2.3), lambda m: (
    m.ico(obsidian, 0.55, TRS((0, -0.1, 0.25), scale=(1, 1.1, 0.9)), sub=2, noise=0.04),
    [ellipsoid(m, magma, (sx * 0.2, -0.62, 0.28), (0.09, 0.04, 0.05), u=10, v=6) for sx in (-1, 1)],
    ellipsoid(m, magma, (0, -0.6, 0.05), (0.25, 0.05, 0.06)),
    teeth(m, bone, (0, -0.62, 0.1), 0.42, 7, 0.12),
    [horn(m, bone, (sx * 0.4, -0.15, 0.45), (sx * 1, 0.3, 0.5), 1.3, 0.15, curl=(sx * 0.2, 0.9, 0.6)) for sx in (-1, 1)],
))
part(rt, 'crown', head, (0, 0, 0.65), lambda m: (
    m.lathe(trim, [(0.42, 0), (0.45, 0.04), (0.42, 0.1), (0.38, 0.06)], n=20, closed=True),
    [m.lathe(magma, [(0.07, 0), (0, 0.55 if k % 2 == 0 else 0.35)], n=5, M=TRS((*pol(0.42, TAU * k / 10), 0.04), (0.25 * math.sin(TAU * k / 10), -0.25 * math.cos(TAU * k / 10), 0))) for k in range(10)],
))
for sx, nm in ((-1, 'armL'), (1, 'armR')):
    def boss_arm(m, sx=sx):
        m.ico(obsidian, 0.75, TRS((0, 0, 0)), sub=1, noise=0.07)
        for k in range(3):
            horn(m, magma, (sx * (0.2 + k * 0.25), 0, 0.5), (sx * 0.5, 0, 1), 0.8, 0.12)
        m.ico(magma, 0.5, TRS((sx * 0.15, -0.05, -0.9), scale=(0.7, 0.7, 1.1)), sub=1)
        for k in range(7):
            d = Vector((random.uniform(-1, 1), random.uniform(-1, 1), random.uniform(-1, 1))).normalized()
            m.ico(obsidian, 0.3, TRS(tuple(Vector((sx * 0.15, -0.05, -0.9)) + d * 0.45), scale=(1, 1, 0.5)), sub=1, noise=0.03)
        m.ico(obsidian, 0.78, TRS((sx * 0.2, -0.45, -2.0)), sub=1, noise=0.08)  # fist
        for k in range(4):
            horn(m, bone, (sx * 0.2 + (k - 1.5) * 0.22, -1.0, -2.0), (0, -1, -0.2), 0.4, 0.09)
    part(rt, nm, body, (sx * 1.85, -0.1, 2.05), boss_arm)
for sx, nm in ((-1, 'legL'), (1, 'legR')):
    part(rt, nm, rt, (sx * 0.85, 0, 1.75), lambda m, sx=sx: (
        m.ico(obsidian, 0.65, TRS((0, 0, -0.55), scale=(1, 1, 1.5)), sub=1, noise=0.05),
        m.ico(magma, 0.3, TRS((0, -0.35, -0.75)), sub=1),
        m.ico(obsidian, 0.75, TRS((0, -0.4, -1.45), scale=(1.1, 1.4, 0.55)), sub=1, noise=0.06),
        [horn(m, bone, ((k - 1) * 0.35, -1.25, -1.6), (0, -1, -0.1), 0.3, 0.08) for k in range(3)],
    ))

# ===================================================================== DUNGEON FOES (medieval)
rust = mat('rust_iron', (0.32, 0.17, 0.08), rough=0.75, metal=0.6)
blacksteel = mat('black_steel', (0.05, 0.05, 0.06), rough=0.35, metal=0.9)
blood_trim = mat('blood_trim', (0.42, 0.03, 0.03), rough=0.6, metal=0.3)
soul = mat('soul_fire', (0.3, 0.78, 1.0), emit=7)
fur = mat('rat_fur', (0.2, 0.15, 0.11), rough=0.9)
pink = mat('rat_pink', (0.55, 0.3, 0.3), rough=0.6)
ghoul_skin = mat('ghoul_skin', (0.24, 0.29, 0.23), rough=0.7)
rag = mat('rag', (0.17, 0.13, 0.09), rough=0.95)
bowwood = mat('bow_wood', (0.3, 0.18, 0.08), rough=0.7)


def skeleton(name, archer=False):
    rt = root(name, 1.85)
    def sbody(m):
        m.tube(bone, [(0, 0.03, 0), (0, 0.06, 0.25), (0, 0.04, 0.5), (0, 0.0, 0.66)], [0.035, 0.032, 0.03, 0.03], n=6)  # spine
        for k in range(5):  # ribs curving forward
            z, w = 0.3 + k * 0.075, 0.19 - abs(k - 1.5) * 0.02
            for sx in (-1, 1):
                m.tube(bone, [(0, 0.04, z), (sx * w * 0.8, 0.0, z + 0.01), (sx * w, -0.09, z - 0.02), (sx * w * 0.35, -0.15, z - 0.03)], [0.017, 0.017, 0.015, 0.011], n=5)
        m.lathe(bone, [(0, -0.06), (0.13, -0.04), (0.16, 0.02), (0.1, 0.06), (0, 0.06)], n=10, M=TRS(scale=(1, 0.7, 1)))  # pelvis
        m.tube(bone, [(-0.22, 0.01, 0.6), (0, 0.03, 0.63), (0.22, 0.01, 0.6)], [0.024, 0.03, 0.024], n=6)  # collarbones
        m.prism(rag, [(-0.17, 0), (0.17, 0), (0.12, -0.32), (0.03, -0.26), (-0.05, -0.36), (-0.15, -0.28)], -0.01, 0.01, M=TRS((0, -0.11, 0.02), (math.pi / 2, 0, 0)))  # loincloth
        if archer:
            m.lathe(leather, [(0, -0.2), (0.07, -0.18), (0.07, 0.25), (0, 0.27)], n=8, M=TRS((0.08, 0.17, 0.42), (-0.35, 0.3, 0)))  # quiver
            for k in range(4):
                m.lathe(bowwood, [(0.007, 0), (0.007, 0.25)], n=4, M=TRS((0.06 + k * 0.014, 0.19 + k * 0.01, 0.62), (-0.35, 0.3, 0)))
            m.lathe(rag, [(0, -0.05), (0.25, 0.0), (0.27, 0.25), (0.2, 0.55), (0, 0.6)], n=12, M=TRS((0, 0.06, 0.15), scale=(1, 0.7, 1)), jag=0.06)  # tattered cloak
    body = part(rt, 'body', rt, (0, 0, 0.95), sbody)
    def shead(m):
        ellipsoid(m, skull_m, (0, -0.02, 0.14), (0.12, 0.14, 0.13), u=16, v=12)
        for sx in (-1, 1):
            ellipsoid(m, pupil, (sx * 0.045, -0.13, 0.15), (0.036, 0.02, 0.035), u=8, v=6)  # sockets
            ellipsoid(m, eye_blu, (sx * 0.045, -0.148, 0.15), (0.014, 0.008, 0.014), u=6, v=4)
        ellipsoid(m, pupil, (0, -0.152, 0.09), (0.016, 0.01, 0.022), u=6, v=4)
        if archer:  # hood
            m.lathe(rag, [(0, 0.33), (0.1, 0.32), (0.16, 0.22), (0.17, 0.05), (0.15, -0.04)], n=14, M=TRS((0, 0.03, 0)), jag=0.05)
        else:  # dented half-helm
            m.lathe(rust, [(0, 0.3), (0.1, 0.29), (0.14, 0.2), (0.145, 0.14), (0.15, 0.13)], n=14, jag=0.02)
            m.prism(rust, [(-0.012, 0.0), (0.012, 0.0), (0.012, 0.14), (-0.012, 0.14)], -0.012, 0.012, M=TRS((0, -0.14, 0.06), (math.pi / 2, 0, 0)))  # nasal guard
    head = part(rt, 'head', body, (0, 0, 0.7), shead)
    part(rt, 'jaw', head, (0, -0.05, 0.06), lambda m: (
        ellipsoid(m, skull_m, (0, -0.05, -0.02), (0.09, 0.08, 0.035)),
        teeth(m, bone, (0, -0.11, 0.0), 0.1, 5, 0.025, down=False),
    ))
    for sx, nm in ((-1, 'legL'), (1, 'legR')):
        part(rt, nm, rt, (sx * 0.1, 0, 0.92), lambda m, sx=sx: (
            m.tube(bone, [(0, 0, 0), (0, -0.02, -0.45)], [0.03, 0.025], n=6),
            ellipsoid(m, bone, (0, -0.03, -0.46), (0.036, 0.036, 0.036), u=8, v=6),
            m.tube(bone, [(0, -0.02, -0.46), (0, 0.01, -0.88)], [0.025, 0.021], n=6),
            ellipsoid(m, bone, (0, -0.06, -0.9), (0.045, 0.1, 0.024), u=8, v=6),
        ))
    for sx, nm in ((-1, 'armL'), (1, 'armR')):
        arm = part(rt, nm, body, (sx * 0.24, 0, 0.6), lambda m, sx=sx: (
            m.tube(bone, [(0, 0, 0), (sx * 0.04, -0.04, -0.28)], [0.025, 0.021], n=6),
            ellipsoid(m, bone, (sx * 0.04, -0.04, -0.29), (0.03, 0.03, 0.03), u=8, v=6),
            m.tube(bone, [(sx * 0.04, -0.04, -0.29), (sx * 0.02, -0.2, -0.48)], [0.021, 0.018], n=6),
            ellipsoid(m, bone, (sx * 0.02, -0.22, -0.5), (0.035, 0.03, 0.04), u=8, v=6),
        ))
        if archer and sx < 0:  # longbow in the left hand
            part(rt, 'weapon', arm, (-0.02, -0.24, -0.5), lambda m: (
                m.tube(bowwood, [(0, 0, -0.62), (0, -0.12, -0.32), (0, -0.15, 0), (0, -0.12, 0.32), (0, 0, 0.62)], [0.012, 0.02, 0.025, 0.02, 0.012], n=6),
                m.tube(bone, [(0, 0.0, -0.61), (0, 0.06, 0), (0, 0.0, 0.61)], 0.004, n=3),
            ))
        if not archer and sx > 0:  # notched rusty sword
            part(rt, 'weapon', arm, (0.02, -0.24, -0.5), lambda m: (
                m.lathe(leather, [(0.02, -0.1), (0.02, 0.08)], n=6),
                m.prism(rust, [(-0.12, -0.02), (0.12, -0.02), (0.12, 0.02), (-0.12, 0.02)], 0.08, 0.11),
                m.prism(rust, [(-0.04, 0.11), (0.04, 0.11), (0.035, 0.6), (0.01, 0.72), (-0.035, 0.68), (-0.03, 0.4)], -0.008, 0.008, M=TRS(rot=(math.pi / 2, 0, 0))),
            ))


skeleton('skeleton')
skeleton('archer', archer=True)

# =========================================================== RAT (giant dungeon rat)
rt = root('rat', 0.7)
body = part(rt, 'body', rt, (0, 0, 0.36), lambda m: (
    ellipsoid(m, fur, (0, 0.05, 0.02), (0.26, 0.5, 0.24), noise=0.01),
    [horn(m, fur, (0, 0.1 + k * 0.1, 0.22), (0, 0.3, 1), 0.08, 0.03) for k in range(4)],  # bristly back
), smooth_sub=1)
head = part(rt, 'head', body, (0, -0.42, 0.06), lambda m: (
    ellipsoid(m, fur, (0, -0.12, 0.0), (0.15, 0.24, 0.13)),
    ellipsoid(m, pink, (0, -0.35, -0.01), (0.04, 0.03, 0.035), u=8, v=6),  # nose
    [ellipsoid(m, eye_red, (sx * 0.075, -0.2, 0.07), (0.028, 0.022, 0.022), u=8, v=6) for sx in (-1, 1)],
    [ellipsoid(m, pink, (sx * 0.1, 0.0, 0.13), (0.07, 0.02, 0.075), u=10, v=6) for sx in (-1, 1)],  # ears
))
part(rt, 'jaw', head, (0, -0.2, -0.06), lambda m: (
    ellipsoid(m, fur, (0, -0.06, -0.02), (0.09, 0.12, 0.04)),
    [m.lathe(bone, [(0.012, 0), (0.005, 0.06)], n=4, M=TRS((sx * 0.015, -0.16, 0.0), (math.pi, 0, 0))) for sx in (-1, 1)],  # incisors
))
part(rt, 'tail', body, (0, 0.5, 0.0), lambda m: (
    m.tube(pink, [(0, 0, 0), (0.05, 0.3, -0.1), (-0.06, 0.6, -0.2), (0.04, 0.9, -0.26)], [0.04, 0.03, 0.018, 0.006], n=6),
))
for k, (sx, sy) in enumerate(((-1, -1), (1, -1), (-1, 1), (1, 1))):
    part(rt, f'leg{k}', rt, (sx * 0.17, sy * 0.25, 0.3), lambda m, sx=sx: (
        m.tube(fur, [(0, 0, 0), (sx * 0.03, -0.04, -0.15), (sx * 0.02, -0.02, -0.28)], [0.06, 0.035, 0.025], n=6),
        ellipsoid(m, pink, (sx * 0.02, -0.06, -0.29), (0.04, 0.06, 0.018), u=8, v=4),
    ))

# =========================================================== GHOUL (hunched corpse-eater)
rt = root('ghoul', 1.7)
body = part(rt, 'body', rt, (0, 0, 0.82), lambda m: (
    m.lathe(ghoul_skin, [(0, -0.05), (0.2, -0.02), (0.24, 0.2), (0.27, 0.42), (0.2, 0.58), (0, 0.62)], n=14, M=TRS((0, -0.05, 0), (0.45, 0, 0), (1.05, 0.8, 1)), smooth=True),
    [m.tube(bone, [(sx * 0.05, 0.12, 0.2 + k * 0.1), (sx * 0.2, 0.0, 0.2 + k * 0.1)], [0.012, 0.008], n=4) for k in range(3) for sx in (-1, 1)],  # ribs showing
    [horn(m, bone, (0, 0.2 - k * 0.03, 0.1 + k * 0.13), (0, 1, 0.3), 0.06, 0.03) for k in range(4)],  # spine knobs
    m.prism(rag, [(-0.2, 0), (0.2, 0), (0.16, -0.3), (0.0, -0.22), (-0.14, -0.34)], -0.01, 0.01, M=TRS((0, -0.14, 0.0), (math.pi / 2, 0, 0))),
), smooth_sub=1)
head = part(rt, 'head', body, (0, -0.32, 0.55), lambda m: (
    ellipsoid(m, ghoul_skin, (0, -0.1, 0.08), (0.13, 0.17, 0.13)),
    [ellipsoid(m, eye_grn, (sx * 0.055, -0.24, 0.12), (0.026, 0.014, 0.02), u=8, v=6) for sx in (-1, 1)],
    [ellipsoid(m, ghoul_skin, (sx * 0.14, -0.05, 0.13), (0.02, 0.09, 0.05)) for sx in (-1, 1)],  # torn ears
))
part(rt, 'jaw', head, (0, -0.14, -0.01), lambda m: (
    ellipsoid(m, ghoul_skin, (0, -0.08, -0.03), (0.1, 0.12, 0.045)),
    teeth(m, bone, (0, -0.17, 0.0), 0.13, 6, 0.04, down=False),
))
for sx, nm in ((-1, 'armL'), (1, 'armR')):  # long arms dragging low, big claws
    part(rt, nm, body, (sx * 0.26, -0.12, 0.45), lambda m, sx=sx: (
        m.tube(ghoul_skin, [(0, 0, 0), (sx * 0.08, -0.1, -0.35), (sx * 0.06, -0.3, -0.72)], [0.06, 0.045, 0.04], n=7),
        claws(m, bone, (sx * 0.06, -0.34, -0.76), (0, -0.4, -1), n=3, L=0.16, r=0.018),
    ))
for sx, nm in ((-1, 'legL'), (1, 'legR')):
    part(rt, nm, rt, (sx * 0.14, 0.05, 0.82), lambda m, sx=sx: (
        m.tube(ghoul_skin, [(0, 0, 0), (0, -0.16, -0.38), (0, 0.06, -0.78)], [0.07, 0.05, 0.04], n=7),
        ellipsoid(m, ghoul_skin, (0, -0.06, -0.8), (0.06, 0.13, 0.03), u=8, v=4),
    ))

# =========================================================== DKNIGHT (black-armoured dark knight)
rt = root('dknight', 2.2)
def dkbody(m):
    m.lathe(blacksteel, [(0, -0.05), (0.25, -0.02), (0.3, 0.2), (0.36, 0.46), (0.33, 0.63), (0.18, 0.72), (0, 0.74)], n=16, M=TRS(scale=(1, 0.75, 1)), smooth=True)
    m.lathe(blood_trim, [(0.31, 0.18), (0.33, 0.2), (0.31, 0.22)], n=16, M=TRS(scale=(1, 0.75, 1)), closed=True)
    m.prism(blood_trim, [(-0.17, 0), (0.17, 0), (0.15, -0.62), (0, -0.74), (-0.15, -0.62)], -0.01, 0.01, M=TRS((0, -0.24, 0.12), (math.pi / 2, 0, 0)))  # tabard
    m.lathe(rag, [(0, -0.6), (0.32, -0.55), (0.36, 0.0), (0.3, 0.55), (0, 0.6)], n=12, M=TRS((0, 0.16, 0.05), scale=(1, 0.35, 1)), jag=0.07)  # cloak
    for sx in (-1, 1):
        ellipsoid(m, blacksteel, (sx * 0.37, 0, 0.62), (0.18, 0.18, 0.12), u=14, v=8)
        for k in range(3):
            horn(m, blacksteel, (sx * (0.32 + k * 0.06), 0.02, 0.7), (sx * 0.3, 0, 1), 0.14 - k * 0.03, 0.03)
body = part(rt, 'body', rt, (0, 0, 1.15), dkbody)
part(rt, 'head', body, (0, 0, 0.74), lambda m: (  # great helm with a burning visor slit
    m.lathe(blacksteel, [(0, -0.02), (0.16, 0.0), (0.17, 0.22), (0.15, 0.32), (0, 0.36)], n=16),
    m.prism(eye_red, [(-0.11, 0), (0.11, 0), (0.11, 0.022), (-0.11, 0.022)], 0, 0.02, M=TRS((0, -0.16, 0.18), (math.pi / 2, 0, 0))),
    m.prism(eye_red, [(-0.01, -0.12), (0.01, -0.12), (0.01, 0.0), (-0.01, 0.0)], 0, 0.02, M=TRS((0, -0.16, 0.18), (math.pi / 2, 0, 0))),
    m.lathe(blood_trim, [(0, 0.34), (0.02, 0.36), (0.015, 0.6), (0, 0.62)], n=6),  # crest spike
))
for sx, nm in ((-1, 'legL'), (1, 'legR')):
    part(rt, nm, rt, (sx * 0.15, 0, 1.05), lambda m, sx=sx: (
        m.tube(blacksteel, [(0, 0, 0), (0, -0.04, -0.52), (0, 0.02, -0.96)], [0.11, 0.09, 0.08], n=8),
        ellipsoid(m, blood_trim, (0, -0.08, -0.52), (0.075, 0.05, 0.06), u=10, v=6),
        ellipsoid(m, blacksteel, (0, -0.09, -1.0), (0.09, 0.16, 0.05), u=10, v=6),
    ))
arm = part(rt, 'armL', body, (-0.4, 0, 0.52), lambda m: (
    m.tube(blacksteel, [(0, 0, 0), (-0.05, -0.1, -0.3), (-0.02, -0.28, -0.44)], [0.09, 0.075, 0.065], n=8),
))
part(rt, 'shield', arm, (-0.05, -0.4, -0.42), lambda m: (  # tower shield with a red cross
    m.prism(blacksteel, [(-0.34, 0.55), (0.34, 0.55), (0.34, -0.45), (0, -0.62), (-0.34, -0.45)], -0.045, 0.045, M=TRS(rot=(math.pi / 2, 0, 0))),
    m.prism(blood_trim, [(-0.05, 0.45), (0.05, 0.45), (0.05, -0.5), (-0.05, -0.5)], -0.06, -0.045, M=TRS(rot=(math.pi / 2, 0, 0))),
    m.prism(blood_trim, [(-0.26, 0.15), (0.26, 0.15), (0.26, 0.05), (-0.26, 0.05)], -0.06, -0.045, M=TRS(rot=(math.pi / 2, 0, 0))),
))
arm = part(rt, 'armR', body, (0.4, 0, 0.52), lambda m: (
    m.tube(blacksteel, [(0, 0, 0), (0.06, -0.08, -0.3), (0.04, -0.22, -0.5)], [0.09, 0.075, 0.065], n=8),
))
part(rt, 'weapon', arm, (0.04, -0.26, -0.52), lambda m: (  # longsword
    m.lathe(leather, [(0.028, -0.16), (0.028, 0.12)], n=6),
    m.prism(blood_trim, [(-0.18, -0.02), (0.18, -0.02), (0.18, 0.02), (-0.18, 0.02)], 0.12, 0.16),
    m.lathe(blacksteel, [(0, 0.14), (0.065, 0.16), (0.055, 1.15), (0, 1.32)], n=4, M=TRS(scale=(1, 0.25, 1))),
    m.lathe(eye_red, [(0, 0.2), (0.012, 0.22), (0.01, 1.05), (0, 1.15)], n=4, M=TRS((0, -0.016, 0), scale=(1, 0.5, 1))),
))

# =========================================================== WARDEN (the Bone Warden, dungeon boss every 5 floors)
rt = root('warden', 4.6)
def wbody(m):
    m.tube(bone, [(0, 0.1, -0.2), (0, 0.16, 0.5), (0, 0.1, 1.1), (0, 0.0, 1.45)], [0.12, 0.11, 0.1, 0.1], n=8)  # spine
    m.ico(soul, 0.38, TRS((0, -0.05, 0.75), scale=(1, 0.8, 1.2)), sub=2)  # soul fire in the ribcage
    for k in range(6):
        z, w = 0.4 + k * 0.17, 0.6 - abs(k - 2) * 0.05
        for sx in (-1, 1):
            m.tube(bone, [(0, 0.12, z), (sx * w * 0.8, 0.0, z + 0.03), (sx * w, -0.28, z - 0.05), (sx * w * 0.3, -0.45, z - 0.08)], [0.05, 0.05, 0.045, 0.035], n=6)
    m.lathe(bone, [(0, -0.2), (0.38, -0.15), (0.45, 0.05), (0.3, 0.15), (0, 0.15)], n=12, M=TRS((0, 0, -0.25), scale=(1, 0.7, 1)))  # pelvis
    for sx in (-1, 1):  # spiked pauldrons
        ellipsoid(m, rust, (sx * 0.72, 0.0, 1.38), (0.38, 0.36, 0.24), u=16, v=10)
        for k in range(3):
            horn(m, bone, (sx * (0.6 + k * 0.14), 0.05, 1.55), (sx * 0.35, 0, 1), 0.45 - k * 0.08, 0.06)
    m.lathe(rag, [(0, -1.6), (0.75, -1.5), (0.85, -0.2), (0.7, 0.9), (0, 1.0)], n=14, M=TRS((0, 0.42, 0.45), scale=(1, 0.3, 1)), jag=0.12)  # tattered cloak
body = part(rt, 'body', rt, (0, 0, 2.1), wbody)
head = part(rt, 'head', body, (0, -0.05, 1.5), lambda m: (
    ellipsoid(m, skull_m, (0, -0.06, 0.36), (0.36, 0.42, 0.38), u=18, v=12),
    [ellipsoid(m, pupil, (sx * 0.14, -0.4, 0.4), (0.1, 0.06, 0.1), u=10, v=6) for sx in (-1, 1)],
    [ellipsoid(m, soul, (sx * 0.14, -0.44, 0.4), (0.05, 0.03, 0.05), u=8, v=6) for sx in (-1, 1)],
    ellipsoid(m, pupil, (0, -0.46, 0.24), (0.05, 0.03, 0.07), u=8, v=6),
))
part(rt, 'jaw', head, (0, -0.2, 0.18), lambda m: (
    ellipsoid(m, skull_m, (0, -0.14, -0.05), (0.27, 0.24, 0.1)),
    teeth(m, bone, (0, -0.33, 0.02), 0.32, 7, 0.07, down=False),
))
part(rt, 'crown', head, (0, -0.06, 0.72), lambda m: (  # rusted iron crown
    m.lathe(rust, [(0.32, 0), (0.34, 0.03), (0.33, 0.12), (0.3, 0.1)], n=20, closed=True),
    [m.lathe(rust, [(0.05, 0), (0, 0.32 if k % 2 == 0 else 0.2)], n=4, M=TRS((*pol(0.32, TAU * k / 8), 0.08))) for k in range(8)],
    [ellipsoid(m, soul, (*pol(0.335, TAU * k / 4 + 0.4), 0.06), (0.03, 0.03, 0.03), u=6, v=4) for k in range(4)],
))
part(rt, 'armL', body, (-0.95, 0, 1.3), lambda m: (  # bony arm with an iron gauntlet
    m.tube(bone, [(0, 0, 0), (-0.15, -0.2, -0.8), (-0.1, -0.6, -1.4)], [0.1, 0.085, 0.08], n=8),
    ellipsoid(m, rust, (-0.1, -0.66, -1.5), (0.22, 0.24, 0.26), u=12, v=8),
    claws(m, rust, (-0.1, -0.82, -1.6), (0, -0.6, -1), n=4, L=0.3, r=0.04),
))
arm = part(rt, 'armR', body, (0.95, 0, 1.3), lambda m: (
    m.tube(bone, [(0, 0, 0), (0.15, -0.2, -0.8), (0.1, -0.6, -1.4)], [0.1, 0.085, 0.08], n=8),
    ellipsoid(m, rust, (0.1, -0.66, -1.5), (0.22, 0.24, 0.26), u=12, v=8),
))
part(rt, 'weapon', arm, (0.1, -0.7, -1.5), lambda m: (  # cursed greatsword
    m.lathe(leather, [(0.06, -0.4), (0.06, 0.3)], n=6),
    m.prism(rust, [(-0.5, -0.05), (0.5, -0.05), (0.55, 0.05), (-0.55, 0.05)], 0.3, 0.42),
    m.lathe(rust, [(0, 0.4), (0.2, 0.45), (0.17, 2.9), (0, 3.3)], n=4, M=TRS(scale=(1, 0.22, 1))),
    m.lathe(soul, [(0, 0.5), (0.035, 0.55), (0.03, 2.7), (0, 2.95)], n=4, M=TRS((0, -0.035, 0), scale=(1, 0.5, 1))),
))
for sx, nm in ((-1, 'legL'), (1, 'legR')):
    part(rt, nm, rt, (sx * 0.38, 0, 1.95), lambda m, sx=sx: (
        m.tube(bone, [(0, 0, 0), (0, -0.06, -0.95)], [0.11, 0.09], n=8),
        ellipsoid(m, rust, (0, -0.12, -1.0), (0.17, 0.15, 0.2), u=10, v=8),  # knee guard
        m.tube(bone, [(0, -0.05, -1.0), (0, 0.04, -1.85)], [0.09, 0.08], n=8),
        ellipsoid(m, rust, (0, -0.16, -1.92), (0.18, 0.3, 0.1), u=10, v=6),  # iron boot
    ))

# ---------- finishing: bevel hard surfaces, bake AO into vertex colours per enemy ----------
bpy.context.view_layer.update()
for name, parts in PARTS.items():
    if name in ('knight', 'dknight'):
        for ob in parts:
            apply_bevel(ob, 0.012, segs=1, angle=30)
bpy.context.view_layer.update()
for name, parts in PARTS.items():
    bake_ao(parts, parts, rays=12, dist=0.6 if name not in ('boss', 'brute', 'warden') else 1.5, strength=0.75, tint=(0.9, 1.0))

bpy.ops.wm.save_as_mainfile(filepath=os.path.join(HERE, 'enemies.blend'))
export('enemies.glb', ROOTS)
pack_bundle()
pv = Previewer(res=900)
pv.render('enemies', ROOTS, dirv=(0.25, -1, 0.3))
pv.scene.render.resolution_x = pv.scene.render.resolution_y = 420
for ob in ROOTS:
    pv.render('enemy_' + ob.name, [ob], dirv=(0.55, -1, 0.35))
print('MAGE_PACT_ENEMIES_OK', len(ROOTS), sum(len(p) for p in PARTS.values()))
