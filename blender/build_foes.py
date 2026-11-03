# The Arena islands' monsters and bosses (the Shadow Realm's originals are in build_enemies.py). Same rig convention:
# an empty root named after the enemy type, child parts <type>_body / _head / _jaw / _armL / _armR / _legL / _legR / _leg0-3 /
# _tail / _wingL / _wingR / _ring / _tent0-5 / _shield / _weapon / _staff / _fuse / _crown / _eye with origins at the joints.
# Built from shared body plans (biped, beast, floater, keg, blob, golem, knight, caster), each dressed in its island's
# materials with its own horns, bones, fur, ice, lava, tentacles, wings, crowns and weapons. Sizes match js/areas.js (h).
# Exports assets/foes.glb and renders a preview per island. Feet on z=0, facing Blender -Y (three.js +Z).
# Run: blender --background --factory-startup --python blender/build_foes.py
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from lib import *

random.seed(31)
scene = reset()
E = coll('foes')
ROOTS, PARTS = [], {}
_slot = [0]


def root(name):
    ob = bpy.data.objects.new(name, None)
    ob.location = (_slot[0] * 5.0, 0, 0)
    _slot[0] += 1
    E.objects.link(ob)
    ROOTS.append(ob)
    PARTS[name] = []
    return ob


def part(rt, name, parent, loc, build):
    m = Mesh(f'{rt.name}_{name}', E, loc=loc, parent=parent)
    build(m)
    ob = m.done()
    PARTS[rt.name].append(ob)
    return ob


def bake_scale(rt, s):
    """Scale a finished rig: geometry and joint offsets both (the game sets the root's own scale)."""
    for ob in PARTS[rt.name]:
        ob.data.transform(Matrix.Scale(s, 4))
        ob.location = ob.location * s


def ell(m, mt, c, r, u=14, v=9, noise=0):
    m.sphere(mt, 1, TRS(c, scale=r), u=u, v=v, noise=noise)


def horn(m, mt, base, d, L, r, curl=(0, 0, 0), n=6, seg=6):
    d, curl = Vector(d).normalized(), Vector(curl)
    pts, p = [], Vector(base)
    for i in range(seg + 1):
        pts.append(p.copy())
        d = (d + curl * (1 / seg)).normalized()
        p = p + d * (L / seg)
    m.tube(mt, pts, [r * (1 - i / seg) + 0.003 for i in range(seg + 1)], n=n)


def claws(m, mt, base, d, n=3, L=0.12, r=0.02, side=Vector((1, 0, 0))):
    d = Vector(d).normalized()
    for k in range(n):
        off = (k - (n - 1) / 2) * 0.35
        horn(m, mt, Vector(base) + side * off * 0.05, (d + side * off * 0.6).normalized(), L, r, curl=(0, 0, -0.6), n=5, seg=3)


def teeth(m, mt, center, w, n, L, down=True):
    for k in range(n):
        x = (k - (n - 1) / 2) / max(1, n - 1) * w
        m.lathe(mt, [(L * 0.25, 0), (0, L)], n=4, M=aim((0, 0, -1 if down else 1), (center[0] + x, center[1], center[2])))


def spikes_on(m, mt, center, radius, n, L, r, up=0.6, seed=0):
    rnd = random.Random(seed)
    for _ in range(n):
        d = Vector((rnd.uniform(-1, 1), rnd.uniform(-1, 1), rnd.uniform(-0.2, 1) + up)).normalized()
        crystal(m, mt, aim(d, Vector(center) + Vector((d.x * radius[0], d.y * radius[1], d.z * radius[2])) * 0.85), r, L * rnd.uniform(.7, 1.2))


def eyes(m, mt, c, dx, r=(0.045, 0.025, 0.03), n=2):
    for k in range(n):
        x = (k - (n - 1) / 2) * dx * 2 / max(1, n - 1) if n > 1 else 0
        ell(m, mt, (c[0] + x, c[1], c[2]), r, u=8, v=6)


# ======================================================================== body plans
# Each takes a dict P of materials and options and returns the body part so callers can hang extras on it.

def biped(name, P, s=1.0):
    """Hunched humanoid (zombie, imp, fiend): torso, head + jaw, long arms with claws, legs, optional tail."""
    rt = root(name)
    hunch = P.get('hunch', 0.3)
    body = part(rt, 'body', rt, (0, 0, 0.9), lambda m: (
        m.lathe(P['skin'], [(0, -0.12), (0.26, -0.05), (0.33, 0.18), (0.36, 0.42), (0.3, 0.6), (0.16, 0.7), (0, 0.72)], n=14, M=TRS(rot=(hunch, 0, 0), scale=(1.05, 0.85, 1)), smooth=True),
        ell(m, P.get('belly', P['skin']), (0, -0.2, 0.18), (0.22, 0.12, 0.24)),
        P.get('torso', lambda m: None)(m)))
    head = part(rt, 'head', body, (0, -0.22, 0.68), lambda m: (
        ell(m, P['skin'], (0, -0.06, 0.14), (0.22, 0.23, 0.21), u=16, v=10),
        ell(m, P['skin'], (0, -0.2, 0.2), (0.19, 0.08, 0.06)),
        eyes(m, P['eye'], (0, -0.27, 0.15), 0.085),
        P.get('crown_fn', lambda m: None)(m)))
    part(rt, 'jaw', head, (0, -0.12, 0.04), lambda m: (
        ell(m, P['skin'], (0, -0.1, -0.02), (0.15, 0.12, 0.06)),
        ell(m, P.get('mouth', P['eye']), (0, -0.15, 0.03), (0.09, 0.05, 0.02)),
        teeth(m, P.get('tooth', P['claw']), (0, -0.2, 0.02), 0.16, 5, 0.06, down=False)))
    reach = P.get('reach', 1.0)
    for sx, nm in ((-1, 'armL'), (1, 'armR')):
        def arm(m, sx=sx):
            el = Vector((sx * 0.14, -0.12, -0.38 * reach)); wr = Vector((sx * 0.1, -0.32, -0.72 * reach))
            m.tube(P.get('arm', P['skin']), [(0, 0, 0), tuple(el), tuple(wr)], [0.09, 0.07, 0.055], n=8)
            ell(m, P.get('arm', P['skin']), tuple(wr + Vector((0, -0.04, -0.04))), (0.07, 0.08, 0.05))
            claws(m, P['claw'], wr + Vector((0, -0.08, -0.05)), (0, -0.6, -1), n=3, L=0.16, r=0.022)
            ell(m, P.get('shoulder', P['skin']), (0, 0, 0), (0.12, 0.11, 0.11))
            P.get('arm_fn', lambda m, sx: None)(m, sx)
        part(rt, nm, body, (sx * 0.34, -0.1, 0.42), arm)
    for sx, nm in ((-1, 'legL'), (1, 'legR')):
        def leg(m, sx=sx):
            kn = Vector((sx * 0.03, -0.14, -0.38)); an = Vector((sx * 0.02, 0.08, -0.72)); ft = Vector((sx * 0.02, -0.05, -0.88))
            m.tube(P.get('leg', P['skin']), [(0, 0, 0), tuple(kn), tuple(an), tuple(ft)], [0.11, 0.085, 0.06, 0.05], n=8)
            ell(m, P.get('leg', P['skin']), tuple(ft + Vector((0, -0.08, -0.01))), (0.08, 0.14, 0.04))
            claws(m, P['claw'], ft + Vector((0, -0.2, -0.01)), (0, -1, -0.3), n=3, L=0.08, r=0.016)
        part(rt, nm, rt, (sx * 0.17, 0.02, 0.9), leg)
    if P.get('tail'):
        part(rt, 'tail', body, (0, 0.24, 0.02), lambda m: (
            m.tube(P['skin'], [(0, 0, 0), (0, 0.25, -0.15), (0.05, 0.5, -0.1), (0.1, 0.72, 0.08)], [0.06, 0.045, 0.03, 0.015], n=7),
            m.lathe(P['claw'], [(0.05, 0), (0, 0.16)], n=4, M=aim((0.3, 0.5, 0.8), (0.1, 0.72, 0.08)))))
    if P.get('wings'):
        for sx, nm in ((-1, 'wingL'), (1, 'wingR')):
            part(rt, nm, body, (sx * 0.15, 0.22, 0.55), lambda m, sx=sx: (
                m.tube(P['claw'], [(0, 0, 0), (sx * 0.45, 0.15, 0.25), (sx * 0.9, 0.1, 0.05)], [0.03, 0.025, 0.01], n=5),
                m.prism(P['wings'], [(0, 0), (sx * 0.9, 0.05), (sx * 0.75, -0.45), (sx * 0.45, -0.3), (sx * 0.25, -0.5)], -0.01, 0.01, M=TRS((0, 0.12, 0.2), (math.pi / 2, 0, 0)))))
    return rt, body, head


def beast(name, P):
    """Four-legged hunter (hounds, wolves, crawlers): long body, head + jaw, four legs, tail."""
    rt = root(name)
    body = part(rt, 'body', rt, (0, 0, 0.62), lambda m: (
        m.lathe(P['hide'], [(0, -0.58), (0.17, -0.45), (0.23, -0.15), (0.2, 0.2), (0.15, 0.45), (0, 0.55)], n=12, M=aim((0, 1, 0)), smooth=True),
        P.get('back', lambda m: None)(m)))
    head = part(rt, 'head', body, (0, -0.55, 0.08), lambda m: (
        m.lathe(P['hide'], [(0.13, 0), (0.15, -0.12), (0.1, -0.3), (0.05, -0.42), (0, -0.45)], n=12, M=aim((0, 1, 0)), smooth=True),
        eyes(m, P['eye'], (0, -0.17, 0.08), 0.07, (0.028, 0.025, 0.02)),
        teeth(m, P['tooth'], (0, -0.38, -0.02), 0.08, 4, 0.05),
        P.get('head_fn', lambda m: None)(m)))
    part(rt, 'jaw', head, (0, -0.06, -0.06), lambda m: (
        m.lathe(P['hide'], [(0.09, 0), (0.07, -0.2), (0.03, -0.33), (0, -0.34)], n=10, M=aim((0, 1, 0)) @ Matrix.Diagonal((1, 0.6, 1, 1)), smooth=True),
        teeth(m, P['tooth'], (0, -0.25, 0.04), 0.06, 4, 0.04, down=False),
        ell(m, P.get('mouth', P['eye']), (0, -0.15, 0.04), (0.05, 0.12, 0.015))))
    for i, (x, y) in enumerate([(-0.17, -0.32), (0.17, -0.32), (-0.17, 0.3), (0.17, 0.3)]):
        sx, front = (1 if x > 0 else -1), y < 0
        def legq(m, sx=sx, front=front):
            kn = Vector((sx * 0.18, -0.05 if front else 0.12, 0.05)); an = Vector((sx * 0.24, -0.02 if front else 0.15, -0.38)); ft = Vector((sx * 0.25, -0.1 if front else 0.1, -0.6))
            m.tube(P.get('leg', P['hide']), [(0, 0, 0), tuple(kn), tuple(an), tuple(ft)], [0.065, 0.045, 0.03, 0.012], n=6)
            claws(m, P['tooth'], ft, (0, -1, -0.3), n=3, L=0.05, r=0.012)
        part(rt, f'leg{i}', body, (x * 0.6, y, -0.02), legq)
    part(rt, 'tail', body, (0, 0.52, 0.04), lambda m: (
        m.tube(P['hide'], [(0, 0, 0), (0, 0.3, 0.12), (0, 0.55, 0.05), (0, 0.75, -0.08)], [0.06, 0.045, 0.03, 0.006], n=6),
        P.get('tail_fn', lambda m: None)(m)))
    return rt, body, head


def floater(name, P, z=1.7):
    """Hovering thing (ghosts, sprites, eyes): a body high up, an eye/face part, a spinning ring, trailing tentacles."""
    rt = root(name)
    body = part(rt, 'body', rt, (0, 0, z), P['body'])
    if P.get('eye'):
        part(rt, 'eye', body, (0, 0, 0), P['eye'])
    if P.get('ring'):
        part(rt, 'ring', body, (0, 0, 0), P['ring'])
    for i in range(P.get('tents', 5)):
        a = TAU * i / P.get('tents', 5) + 0.3
        def tent(m, a=a):
            pts = [Vector((0, 0, 0))]
            d = Vector((math.cos(a) * 0.25, math.sin(a) * 0.25, -1))
            for k in range(6):
                pts.append(pts[-1] + d.normalized() * P.get('tlen', 0.15) + Vector((math.cos(a + k) * 0.03, math.sin(a + k) * 0.03, 0)))
            m.tube(P['tent'], pts, [P.get('tr', 0.065) * (1 - k / 7) + 0.006 for k in range(7)], n=7)
            if P.get('tip'):
                m.sphere(P['tip'], 0.025, TRS(tuple(pts[-1])), u=8, v=6)
        part(rt, f'tent{i}', body, (*pol(0.25 * P.get('tspread', 1), a), -0.36 * P.get('tdrop', 1)), tent)
    return rt, body


def keg(name, P):
    """Waddling bomb (bloater, snowball, magma, rift orb): a round body on stubby legs and arms, a fuse that swells."""
    rt = root(name)
    body = part(rt, 'body', rt, (0, 0, 0.45), lambda m: (m.sphere(P['body'], 0.42, TRS((0, 0, 0.32)), u=24, v=16, noise=P.get('noise', 0)), P['face'](m)))
    part(rt, 'fuse', body, (0, 0, 0.78), P['fuse'])
    for sx, nm in ((-1, 'legL'), (1, 'legR')):
        part(rt, nm, rt, (sx * 0.18, 0, 0.42), lambda m, sx=sx: (
            m.tube(P['limb'], [(0, 0, 0), (sx * 0.04, -0.05, -0.2), (0, 0.02, -0.38)], [0.07, 0.055, 0.045], n=7),
            ell(m, P['limb'], (0, -0.06, -0.4), (0.08, 0.13, 0.05))))
    for sx, nm in ((-1, 'armL'), (1, 'armR')):
        part(rt, nm, body, (sx * 0.4, -0.05, 0.42), lambda m, sx=sx: (
            m.tube(P['limb'], [(0, 0, 0), (sx * 0.12, -0.1, -0.15), (sx * 0.1, -0.22, -0.3)], [0.05, 0.04, 0.035], n=6),
            ell(m, P['limb'], (sx * 0.1, -0.25, -0.33), (0.05, 0.05, 0.05))))
    return rt, body


def golem(name, P):
    """Hulking brute (bone colossus, yeti, magma golem, tentacle horror): huge torso, small head, long heavy arms, stumpy legs."""
    rt = root(name)
    body = part(rt, 'body', rt, (0, 0, 0.85), P['body'])
    head = part(rt, 'head', body, (0, -0.35, 1.4), P['head'])
    for sx, nm in ((-1, 'armL'), (1, 'armR')):
        part(rt, nm, body, (sx * 1.0, -0.05, 1.15), lambda m, sx=sx: P['arm'](m, sx))
    for sx, nm in ((-1, 'legL'), (1, 'legR')):
        part(rt, nm, rt, (sx * 0.42, 0, 0.9), lambda m, sx=sx: P['leg'](m, sx))
    if P.get('jaw'):
        part(rt, 'jaw', head, (0, -0.25, 0.02), P['jaw'])
    return rt, body, head


def knight(name, P):
    """Armoured shield-bearer: plate torso, helm, legs, a shield on the left arm and a weapon in the right."""
    rt = root(name)
    def kbody(m):
        m.lathe(P['plate'], [(0, -0.05), (0.25, -0.02), (0.3, 0.2), (0.36, 0.46), (0.33, 0.63), (0.18, 0.72), (0, 0.74)], n=16, M=TRS(scale=(1, 0.75, 1)), smooth=True)
        m.lathe(P['trim'], [(0.31, 0.18), (0.33, 0.2), (0.31, 0.22)], n=16, M=TRS(scale=(1, 0.75, 1)), closed=True)
        m.prism(P['cloth'], [(-0.17, 0), (0.17, 0), (0.15, -0.62), (0, -0.74), (-0.15, -0.62)], -0.01, 0.01, M=TRS((0, -0.24, 0.12), (math.pi / 2, 0, 0)))
        for sx in (-1, 1):
            ell(m, P['plate'], (sx * 0.37, 0, 0.62), (0.19, 0.19, 0.13), u=14, v=8)
            P.get('pauldron', lambda m, sx: None)(m, sx)
        P.get('torso', lambda m: None)(m)
    body = part(rt, 'body', rt, (0, 0, 1.15), kbody)
    part(rt, 'head', body, (0, 0, 0.74), P['helm'])
    for sx, nm in ((-1, 'legL'), (1, 'legR')):
        part(rt, nm, rt, (sx * 0.15, 0, 1.05), lambda m, sx=sx: (
            m.tube(P['plate'], [(0, 0, 0), (0, -0.04, -0.52), (0, 0.02, -0.96)], [0.11, 0.09, 0.08], n=8),
            ell(m, P['trim'], (0, -0.08, -0.52), (0.075, 0.05, 0.06), u=10, v=6),
            ell(m, P['plate'], (0, -0.09, -1.0), (0.09, 0.16, 0.05), u=10, v=6)))
    arm = part(rt, 'armL', body, (-0.4, 0, 0.52), lambda m: m.tube(P['plate'], [(0, 0, 0), (-0.05, -0.1, -0.3), (-0.02, -0.28, -0.44)], [0.09, 0.075, 0.065], n=8))
    part(rt, 'shield', arm, (-0.05, -0.4, -0.42), P['shield'])
    arm = part(rt, 'armR', body, (0.4, 0, 0.52), lambda m: m.tube(P['plate'], [(0, 0, 0), (0.06, -0.08, -0.3), (0.04, -0.22, -0.5)], [0.09, 0.075, 0.065], n=8))
    part(rt, 'weapon', arm, (0.04, -0.26, -0.52), P['weapon'])
    return rt, body


def caster(name, P, robe_h=1.32):
    """Robed spellcaster (necromancer, priest, queen, flayer): a long robe, hooded head, arms, a staff and a ring of glyphs."""
    rt = root(name)
    def sbody(m):
        m.lathe(P['robe'], [(0, 0.0), (0.12, 0.0), (0.32, 0.25), (0.36, 0.6), (0.3, 0.95), (0.22, 1.2), (0.12, robe_h), (0, robe_h + 0.02)], n=16, smooth=True, jag=0.08)
        m.lathe(P['trim'], [(0.305, 0.9), (0.31, 0.95), (0.3, 1.0)], n=16, closed=True)
        for k in range(7):
            a = TAU * k / 7
            m.tube(P['robe'], [(*pol(0.12, a), 0.05), (*pol(0.16, a + 0.2), -0.25), (*pol(0.1, a + 0.4), -0.55)], [0.06, 0.04, 0.005], n=5)
        P.get('torso', lambda m: None)(m)
    body = part(rt, 'body', rt, (0, 0, 0.45), sbody)
    part(rt, 'head', body, (0, 0, robe_h), P['head'])
    part(rt, 'armL', body, (-0.3, -0.02, robe_h - 0.2), lambda m: (
        m.tube(P['robe'], [(0, 0, 0), (-0.1, -0.12, -0.25), (-0.08, -0.25, -0.4)], [0.08, 0.09, 0.1], n=8),
        ell(m, P['hand'], (-0.08, -0.29, -0.44), (0.04, 0.05, 0.04), u=8, v=6)))
    arm = part(rt, 'armR', body, (0.3, -0.02, robe_h - 0.2), lambda m: (
        m.tube(P['robe'], [(0, 0, 0), (0.08, -0.15, -0.2), (0.06, -0.3, -0.25)], [0.08, 0.09, 0.1], n=8),
        ell(m, P['hand'], (0.06, -0.34, -0.26), (0.04, 0.05, 0.04), u=8, v=6)))
    part(rt, 'staff', arm, (0.06, -0.36, -0.26), P['staff'])
    if P.get('ring', True): part(rt, 'ring', body, (0, 0, 0.6), lambda m: (
        m.annulus(P['glow'], 0.55, 0.57, 0, 64),
        [m.polyline(P['glow'], [(0.62 * math.cos(TAU * k / 9) + 0.04 * math.cos(TAU * j / 3 + k), 0.62 * math.sin(TAU * k / 9) + 0.04 * math.sin(TAU * j / 3 + k)) for j in range(3)], 0.012, closed=True) for k in range(9)]))
    return rt, body


def staff(wood, head):
    def f(m):
        m.tube(wood, [(0, 0, -1.1), (0.02, 0, -0.3), (-0.01, 0, 0.4), (0.03, 0, 0.75)], [0.03, 0.03, 0.028, 0.035], n=7)
        head(m)
    return f


# ======================================================================== 2: THE UNDEAD CRYPT
rot = mat('cr_rot', (0.24, 0.3, 0.22), rough=0.7)
rot2 = mat('cr_rot_b', (0.17, 0.2, 0.15), rough=0.75)
rag = mat('cr_rag', (0.14, 0.12, 0.09), rough=0.95)
bone = mat('cr_bone', (0.72, 0.68, 0.56), rough=0.55)
bone2 = mat('cr_bone_old', (0.5, 0.46, 0.36), rough=0.65)
soul = mat('cr_soul', (0.35, 1.0, 0.55), emit=7)
soul2 = mat('cr_soul_dim', (0.25, 0.8, 0.45), emit=3)
ghost = mat('cr_ghost', (0.45, 0.85, 0.9), rough=0.3, emit=1.2, ecolor=(0.4, 0.9, 1.0), alpha=0.6)
wail = mat('cr_wail', (0.55, 0.95, 1.0), emit=6)
ink = mat('cr_ink', (0.02, 0.02, 0.025), rough=0.6)
robe_n = mat('cr_robe', (0.05, 0.045, 0.06), rough=0.9)
robe_t = mat('cr_robe_trim', (0.12, 0.3, 0.16), rough=0.7)
pus = mat('cr_pus', (0.55, 0.9, 0.2), emit=3)
gold = mat('cr_gold', (0.85, 0.65, 0.25), rough=0.3, metal=1)
iron = mat('cr_iron', (0.08, 0.08, 0.09), rough=0.45, metal=0.85)

dirt = mat('cr_dirt', (0.13, 0.09, 0.06), rough=1.0)
glass = mat('cr_glass', (0.4, 1.0, 0.35), emit=5)
brass = mat('cr_brass', (0.55, 0.42, 0.2), rough=0.4, metal=0.9)
leather_c = mat('cr_leather', (0.2, 0.13, 0.08), rough=0.8)
plague = mat('cr_plague', (0.09, 0.08, 0.06), rough=0.9)

# grave crawler: a corpse half out of its grave, dragging itself on long arms, legs trailing, the dirt still on it
rt = root('crawler')
def cw_body(m):
    m.lathe(rot, [(0, -0.38), (0.2, -0.3), (0.27, -0.05), (0.28, 0.2), (0.2, 0.36), (0, 0.42)], n=14, M=TRS(rot=(1.35, 0, 0), scale=(1.1, 0.85, 1)), smooth=True)
    for k in range(7):  # a bare spine down the back
        ell(m, bone, (0, 0.28 - k * 0.1, 0.22 - k * 0.005), (0.045, 0.04, 0.035), u=8, v=6)
    for k in range(4):  # ribs through the torn back
        for sx in (-1, 1):
            m.tube(bone, [(sx * 0.03, 0.05 - k * 0.1, 0.22), (sx * 0.22, 0.05 - k * 0.1, 0.15), (sx * 0.27, 0.05 - k * 0.1, -0.02)], [0.016, 0.014, 0.01], n=4)
    for k in range(6):  # grave dirt clinging on
        ell(m, dirt, (random.uniform(-0.2, 0.2), random.uniform(-0.2, 0.35), random.uniform(0.05, 0.2)), (0.09, 0.08, 0.05), noise=0.02)
    m.prism(rag, [(-0.28, 0), (0.28, 0), (0.22, -0.4), (0.04, -0.3), (-0.1, -0.45), (-0.26, -0.32)], -0.01, 0.01, M=TRS((0, 0.3, -0.05), (0.2, 0, 0)))
body = part(rt, 'body', rt, (0, 0, 0.42), cw_body)
head = part(rt, 'head', body, (0, -0.42, 0.12), lambda m: (
    ell(m, rot, (0, -0.06, 0.1), (0.17, 0.19, 0.16), u=14, v=10), ell(m, bone2, (0, -0.2, 0.12), (0.12, 0.05, 0.06)),
    [ell(m, ink, (sx * 0.065, -0.2, 0.14), (0.04, 0.02, 0.035), u=8, v=6) for sx in (-1, 1)],
    [ell(m, soul, (sx * 0.065, -0.215, 0.14), (0.016, 0.01, 0.016), u=6, v=4) for sx in (-1, 1)],
    [m.tube(rag, [(x, 0, 0.25), (x * 1.5, 0.15, 0.1), (x * 1.3, 0.25, -0.1)], [0.02, 0.015, 0.004], n=4) for x in (-0.08, -0.02, 0.05, 0.1)]))
part(rt, 'jaw', head, (0, -0.12, 0.02), lambda m: (
    ell(m, bone2, (0, -0.1, -0.04), (0.11, 0.1, 0.045)), teeth(m, bone, (0, -0.17, -0.0), 0.12, 5, 0.05, down=False)))
for sx, nm in ((-1, 'armL'), (1, 'armR')):
    def cw_arm(m, sx=sx):
        el = Vector((sx * 0.38, -0.32, 0.22)); wr = Vector((sx * 0.32, -0.78, -0.36))
        m.tube(rot, [(0, 0, 0), tuple(el), tuple(wr)], [0.08, 0.065, 0.05], n=8)
        ell(m, bone, tuple(el), (0.07, 0.07, 0.07))
        ell(m, rot2, tuple(wr + Vector((0, -0.05, -0.03))), (0.08, 0.1, 0.04))
        claws(m, bone2, wr + Vector((0, -0.12, -0.04)), (0, -0.8, -0.7), n=4, L=0.2, r=0.022)
        ell(m, dirt, tuple(wr + Vector((0, -0.02, -0.06))), (0.1, 0.12, 0.03), noise=0.02)
    part(rt, nm, body, (sx * 0.22, -0.28, 0.08), cw_arm)
for sx, nm in ((-1, 'legL'), (1, 'legR')):
    def cw_leg(m, sx=sx):  # dragged behind it: one still fleshed, one bare bone
        mt = rot2 if sx < 0 else bone
        m.tube(mt, [(0, 0, 0), (sx * 0.08, 0.38, -0.28), (sx * 0.1, 0.78, -0.36)], [0.085, 0.06, 0.045] if sx < 0 else [0.05, 0.04, 0.03], n=7)
        ell(m, bone2, (sx * 0.08, 0.38, -0.28), (0.06, 0.06, 0.06))
        ell(m, mt, (sx * 0.1, 0.86, -0.38), (0.06, 0.12, 0.04))
    part(rt, nm, body, (sx * 0.15, 0.32, -0.06), cw_leg)

# bone archer: a skeleton in a rotten hood, a quiver on its back and a great bow of black wood and bone
rt = root('bonearcher')
def ba_body(m):
    m.tube(bone, [(0, 0.05, -0.35), (0, 0.08, 0.0), (0, 0.04, 0.35), (0, 0.0, 0.62)], [0.04, 0.04, 0.035, 0.035], n=6)
    for k in range(6):  # ribcage
        z = 0.12 + k * 0.08
        for sx in (-1, 1):
            m.tube(bone, [(sx * 0.02, 0.08, z), (sx * 0.2, 0.02, z - 0.02), (sx * 0.19, -0.14, z - 0.05), (sx * 0.04, -0.17, z - 0.07)], [0.018, 0.017, 0.014, 0.01], n=4)
    m.tube(bone, [(0, -0.17, 0.55), (0, -0.17, 0.12)], 0.022, n=4)  # breastbone
    m.lathe(bone2, [(0, -0.42), (0.18, -0.4), (0.21, -0.32), (0.14, -0.26), (0, -0.27)], n=12, M=TRS(scale=(1, 0.7, 1)))  # pelvis
    for sx in (-1, 1):
        m.tube(bone, [(0, 0.03, 0.6), (sx * 0.26, 0.03, 0.6)], 0.022, n=4)  # collarbones
    m.lathe(robe_n, [(0, 0.78), (0.24, 0.72), (0.32, 0.55), (0.3, 0.2), (0.26, -0.1), (0.3, -0.45), (0, -0.4)], n=14, M=TRS((0, 0.12, 0), scale=(1, 0.45, 1)), jag=0.12)  # a ragged cloak behind
    m.lathe(leather_c, [(0.06, -0.3), (0.07, 0.25), (0.05, 0.3)], n=10, M=TRS((0.12, 0.22, 0.35), (0.35, 0, -0.35)))  # quiver
    for k in range(5):  # soul-fletched arrows
        x = 0.12 + (k - 2) * 0.025
        m.tube(iron, [(x, 0.28, 0.55), (x + 0.06, 0.48, 0.8)], 0.008, n=3)
        m.prism(soul2, [(0, 0), (0.03, -0.05), (0, -0.09), (-0.03, -0.05)], -0.003, 0.003, M=TRS((x + 0.06, 0.48, 0.84), (0.4, 0, 0)))
body = part(rt, 'body', rt, (0, 0, 1.0), ba_body)
head = part(rt, 'head', body, (0, -0.02, 0.66), lambda m: (
    ell(m, bone, (0, -0.04, 0.14), (0.13, 0.15, 0.15), u=16, v=10), ell(m, bone, (0, -0.15, 0.08), (0.09, 0.05, 0.06)),
    [ell(m, ink, (sx * 0.05, -0.15, 0.15), (0.035, 0.02, 0.035), u=8, v=6) for sx in (-1, 1)],
    [ell(m, soul, (sx * 0.05, -0.165, 0.15), (0.014, 0.008, 0.014), u=6, v=4) for sx in (-1, 1)],
    m.lathe(robe_n, [(0, -0.02), (0.18, 0.02), (0.21, 0.18), (0.17, 0.32), (0.06, 0.4), (0, 0.42)], n=16, M=TRS((0, 0.05, 0)), smooth=True, jag=0.05)))
part(rt, 'jaw', head, (0, -0.08, 0.06), lambda m: (ell(m, bone2, (0, -0.07, -0.03), (0.08, 0.07, 0.03)), teeth(m, bone, (0, -0.12, 0.0), 0.08, 5, 0.03, down=False)))
def ba_arm(m, sx):
    m.tube(bone, [(0, 0, 0), (sx * 0.06, -0.08, -0.28), (sx * 0.04, -0.2, -0.52)], [0.025, 0.02, 0.018], n=5)
    ell(m, bone2, (sx * 0.06, -0.08, -0.28), (0.03, 0.03, 0.03), u=8, v=6)
    for k in range(4):
        m.tube(bone, [(sx * 0.04, -0.2, -0.52), (sx * 0.04 + (k - 1.5) * 0.015, -0.27, -0.58)], 0.007, n=3)
def ba_bow(m):  # held in the left hand, standing upright in front of it
    m.tube(ink, [(-0.04, -0.25, -1.2), (-0.04, -0.36, -0.85), (-0.04, -0.33, -0.55), (-0.04, -0.36, -0.25), (-0.04, -0.25, 0.1)], [0.012, 0.022, 0.03, 0.022, 0.012], n=6)
    for z in (-1.05, -0.2):
        m.tube(bone, [(-0.04, -0.31, z), (-0.04, -0.35, z + 0.18)], 0.03, n=5)
    m.tube(glass, [(-0.04, -0.25, -1.2), (-0.04, -0.2, -0.55), (-0.04, -0.25, 0.1)], 0.004, n=3)  # a string of soul light
part(rt, 'armL', body, (-0.26, 0.03, 0.6), lambda m: (ba_arm(m, -1), ba_bow(m)))
part(rt, 'armR', body, (0.26, 0.03, 0.6), lambda m: ba_arm(m, 1))
for sx, nm in ((-1, 'legL'), (1, 'legR')):
    part(rt, nm, rt, (sx * 0.12, 0.02, 0.62), lambda m, sx=sx: (
        m.tube(bone, [(0, 0, 0), (0, -0.03, -0.3), (0, 0.03, -0.58)], [0.03, 0.025, 0.02], n=5),
        ell(m, bone2, (0, -0.04, -0.3), (0.035, 0.035, 0.035), u=8, v=6),
        ell(m, bone, (0, -0.05, -0.61), (0.04, 0.1, 0.025), u=8, v=6)))

# plague bearer: a hunched, beak-masked thing under a broad hat, heaving a bloated hump, swinging a smoking censer
def pb_torso(m):
    m.ico(rot, 1, TRS((0, 0.22, 1.0), scale=(0.34, 0.3, 0.32)), sub=2, noise=0.04)  # the hump
    for k in range(8):
        a, z = random.uniform(0.3, 2.8), random.uniform(0.8, 1.25)
        m.sphere(pus, random.uniform(0.04, 0.07), TRS((0.32 * math.cos(a), 0.22 + 0.28 * math.sin(a), z)), u=8, v=6)
    m.lathe(leather_c, [(0.34, 0.62), (0.36, 0.66), (0.34, 0.7)], n=16, closed=True)  # belt
    for sx in (-1, 1):  # vials hung off the belt
        m.lathe(glass, [(0, 0), (0.035, 0.02), (0.04, 0.09), (0.015, 0.12), (0, 0.13)], n=8, M=TRS((sx * 0.32, -0.12, 0.48)))
rt, body = caster('plaguebearer', dict(robe=plague, trim=leather_c, hand=rot, glow=pus, ring=False, torso=pb_torso,
    head=lambda m: (ell(m, rot2, (0, 0, 0.14), (0.16, 0.17, 0.17), u=14, v=10),
                    m.lathe(bone2, [(0.09, 0), (0.07, -0.15), (0.035, -0.32), (0, -0.4)], n=10, M=aim((0, 1, 0.35), (0, -0.12, 0.1)), smooth=True),  # the beak
                    [m.sphere(glass, 0.04, TRS((sx * 0.07, -0.15, 0.18), scale=(1, 0.5, 1)), u=10, v=6) for sx in (-1, 1)],
                    m.lathe(plague, [(0, 0.26), (0.42, 0.24), (0.44, 0.27), (0.2, 0.3), (0.17, 0.48), (0, 0.5)], n=20, M=TRS((0, 0.02, 0)), smooth=True)),  # broad hat
    staff=lambda m: (m.tube(iron, [(0, 0, 0), (0.02, -0.02, -0.25), (0, 0, -0.5)], 0.01, n=4),  # a chain, the censer hanging on it
                     m.lathe(brass, [(0, -0.48), (0.09, -0.52), (0.12, -0.62), (0.1, -0.72), (0, -0.75)], n=12, smooth=True),
                     [m.tube(brass, [(0.11 * math.cos(a), 0.11 * math.sin(a), -0.6), (0.12 * math.cos(a), 0.12 * math.sin(a), -0.7)], 0.008, n=3) for a in [k * 1.05 for k in range(6)]],
                     m.sphere(pus, 0.07, TRS((0, 0, -0.63)), u=10, v=8))), robe_h=1.3)

# colossus: a giant built of bones, a skull for a head, soul fire for a heart
def co_body(m):
    m.ico(soul, 0.35, TRS((0, -0.1, 0.85)), sub=2)
    for k in range(6):  # a great ribcage
        z = 0.4 + k * 0.17
        for sx in (-1, 1):
            m.tube(bone, [(0, 0.35, z), (sx * 0.65, 0.1, z + 0.03), (sx * 0.7, -0.35, z - 0.05), (sx * 0.2, -0.6, z - 0.08)], [0.07, 0.065, 0.055, 0.04], n=6)
    m.tube(bone, [(0, 0.4, 0), (0, 0.45, 0.8), (0, 0.35, 1.5)], [0.12, 0.11, 0.1], n=8)
    m.lathe(bone2, [(0, -0.15), (0.6, -0.1), (0.7, 0.1), (0.45, 0.25), (0, 0.25)], n=12, M=TRS((0, 0, 0), scale=(1, 0.7, 1)))
    for k in range(10):  # skulls piled on the shoulders
        sx = -1 if k < 5 else 1
        ell(m, bone, (sx * random.uniform(0.6, 0.95), random.uniform(-0.3, 0.3), random.uniform(1.35, 1.6)), (0.14, 0.15, 0.13), u=10, v=7)
def co_head(m):
    ell(m, bone, (0, -0.06, 0.14), (0.3, 0.33, 0.3), u=16, v=10)
    for sx in (-1, 1):
        ell(m, ink, (sx * 0.1, -0.33, 0.16), (0.07, 0.04, 0.07), u=8, v=6)
        ell(m, soul, (sx * 0.1, -0.35, 0.16), (0.03, 0.02, 0.03), u=6, v=4)
        horn(m, bone2, (sx * 0.22, -0.05, 0.3), (sx * 0.7, 0.2, 0.7), 0.55, 0.07, curl=(sx * 0.3, 0.8, -0.6))
    teeth(m, bone2, (0, -0.36, 0.0), 0.2, 6, 0.06)
def co_arm(m, sx):
    m.tube(bone, [(0, 0, 0), (sx * 0.15, -0.05, -0.6), (sx * 0.18, -0.2, -1.2)], [0.12, 0.1, 0.09], n=8)
    ell(m, bone2, (sx * 0.15, -0.05, -0.6), (0.14, 0.14, 0.14))
    ell(m, bone, (sx * 0.2, -0.25, -1.35), (0.28, 0.3, 0.25), u=12, v=8)
    claws(m, bone2, Vector((sx * 0.2, -0.45, -1.45)), (0, -0.7, -1), n=4, L=0.35, r=0.05)
    ell(m, bone, (0, 0, 0), (0.25, 0.25, 0.25))
def co_leg(m, sx):
    m.tube(bone, [(0, 0, 0), (0, -0.05, -0.45), (0, 0.02, -0.85)], [0.12, 0.1, 0.09], n=8)
    ell(m, bone2, (0, -0.05, -0.45), (0.13, 0.13, 0.13))
    ell(m, bone, (0, -0.12, -0.88), (0.18, 0.3, 0.08), u=10, v=6)
rt, body, head = golem('colossus', dict(body=co_body, head=co_head, arm=co_arm, leg=co_leg))
# necromancer: a hooded skull-masked sorcerer with a skull-topped staff
rt, body = caster('necromancer', dict(robe=robe_n, trim=robe_t, hand=bone, glow=soul,
    head=lambda m: (m.lathe(robe_n, [(0, -0.05), (0.2, 0.0), (0.24, 0.18), (0.2, 0.36), (0.1, 0.46), (0, 0.5)], n=16, M=TRS((0, 0.04, 0)), smooth=True),
                    ell(m, ink, (0, -0.12, 0.18), (0.15, 0.08, 0.15)), ell(m, bone, (0, -0.17, 0.17), (0.11, 0.05, 0.13), u=14, v=10),
                    [ell(m, soul, (sx * 0.045, -0.21, 0.2), (0.022, 0.01, 0.015), u=8, v=6) for sx in (-1, 1)]),
    staff=staff(iron, lambda m: (ell(m, bone, (0.03, 0, 0.86), (0.1, 0.11, 0.1)), [ell(m, soul, (0.03 + sx * 0.035, -0.08, 0.88), (0.02, 0.01, 0.02), u=6, v=4) for sx in (-1, 1)],
                                 m.ico(soul, 0.07, Matrix.Translation((0.03, 0, 1.02)), sub=1), [horn(m, iron, (0.03, 0, 0.78), (math.cos(a), math.sin(a), 1.3), 0.22, 0.015) for a in (0, 2.1, 4.2)])),
    torso=lambda m: [ell(m, bone, (0.28 * math.sin(a), -0.27 * math.cos(a) * 0.8, 1.0 - 0.06 * math.cos(a * 2)), (0.04, 0.03, 0.045), u=8, v=6) for a in [-0.8 + k * 0.32 for k in range(6)]]))
# the Lich King: a towering crowned corpse-king in ragged robes, wreathed in souls
rt, body = caster('lich', dict(robe=robe_n, trim=gold, hand=bone, glow=soul,
    head=lambda m: (ell(m, bone, (0, -0.05, 0.16), (0.15, 0.17, 0.17), u=16, v=10), [ell(m, ink, (sx * 0.055, -0.19, 0.18), (0.04, 0.02, 0.04), u=8, v=6) for sx in (-1, 1)],
                    [ell(m, wail, (sx * 0.055, -0.205, 0.18), (0.018, 0.01, 0.018), u=6, v=4) for sx in (-1, 1)], teeth(m, bone2, (0, -0.19, 0.04), 0.1, 5, 0.03),
                    m.lathe(gold, [(0.16, 0.25), (0.17, 0.3), (0.16, 0.34)], n=16, closed=True),
                    [m.lathe(gold, [(0.03, 0), (0, 0.22 if k % 2 == 0 else 0.13)], n=4, M=TRS((*pol(0.16, TAU * k / 8), 0.3), (0.2 * math.sin(TAU * k / 8), -0.2 * math.cos(TAU * k / 8), 0))) for k in range(8)],
                    [m.sphere(soul, 0.02, TRS((*pol(0.17, TAU * k / 4), 0.29)), u=6, v=4) for k in range(4)]),
    staff=staff(gold, lambda m: (m.lathe(gold, [(0.05, 0.75), (0.12, 0.85), (0.04, 1.0), (0, 1.05)], n=8), m.ico(wail, 0.11, Matrix.Translation((0.03, 0, 0.92)), sub=2),
                                 [horn(m, gold, (0.03, 0, 0.82), (math.cos(a), math.sin(a), 1.0), 0.25, 0.02, curl=(0, 0, 0.8)) for a in (0, 1.57, 3.14, 4.71)])),
    torso=lambda m: ([ell(m, gold, (sx * 0.34, 0, 1.18), (0.17, 0.17, 0.1)) for sx in (-1, 1)], [horn(m, bone, (sx * 0.38, 0.02, 1.25), (sx * 0.4, 0, 1), 0.3, 0.04) for sx in (-1, 1)],
                     m.lathe(rag, [(0, -0.4), (0.45, -0.35), (0.42, 0.3), (0.3, 1.1), (0, 1.15)], n=12, M=TRS((0, 0.14, 0.1), scale=(1, 0.4, 1)), jag=0.1))), robe_h=1.5)
bake_scale(rt, 1.6)
# the Bone Dragon: a dragon's skeleton, long-necked, tattered wings, soul fire in its ribs
rt = root('bonedragon')
def bd_body(m):
    m.ico(soul, 0.5, TRS((0, 0, 0.1), scale=(1, 1.4, 0.9)), sub=2)
    m.tube(bone, [(0, 1.6, 0.2), (0, 0.8, 0.45), (0, 0, 0.5), (0, -0.8, 0.5), (0, -1.4, 0.9), (0, -1.8, 1.6)], [0.14, 0.16, 0.17, 0.16, 0.14, 0.12], n=8)  # spine into the neck
    for k in range(8):
        y = -0.8 + k * 0.25
        for sx in (-1, 1):
            m.tube(bone, [(0, y, 0.5), (sx * 0.65, y, 0.25), (sx * 0.55, y, -0.3), (sx * 0.15, y, -0.5)], [0.05, 0.05, 0.04, 0.03], n=5)
    for k in range(10):
        horn(m, bone2, (0, -1.0 + k * 0.28, 0.6), (0, 0.3, 1), 0.3 - k * 0.015, 0.05, curl=(0, 0.6, 0))
    m.lathe(bone2, [(0, -0.2), (0.6, -0.15), (0.7, 0.1), (0.4, 0.2), (0, 0.2)], n=12, M=TRS((0, 1.1, 0.0), scale=(1, 0.8, 1)))
body = part(rt, 'body', rt, (0, 0, 1.9), bd_body)
head = part(rt, 'head', body, (0, -1.9, 1.7), lambda m: (
    m.lathe(bone, [(0.32, 0), (0.36, -0.25), (0.24, -0.65), (0.12, -0.95), (0, -1.0)], n=10, M=aim((0, 1, 0)), smooth=True),
    [ell(m, ink, (sx * 0.17, -0.3, 0.12), (0.08, 0.06, 0.07), u=8, v=6) for sx in (-1, 1)],
    [ell(m, soul, (sx * 0.17, -0.33, 0.12), (0.04, 0.03, 0.035), u=6, v=4) for sx in (-1, 1)],
    [horn(m, bone2, (sx * 0.2, 0.05, 0.2), (sx * 0.5, 0.8, 0.5), 1.0, 0.1, curl=(sx * 0.2, 0.6, -0.4)) for sx in (-1, 1)],
    teeth(m, bone2, (0, -0.85, -0.08), 0.22, 7, 0.1)))
part(rt, 'jaw', head, (0, -0.15, -0.15), lambda m: (
    m.lathe(bone, [(0.25, 0), (0.22, -0.4), (0.1, -0.8), (0, -0.85)], n=8, M=aim((0, 1, 0)) @ Matrix.Diagonal((1, 0.5, 1, 1)), smooth=True),
    teeth(m, bone2, (0, -0.7, 0.04), 0.2, 6, 0.09, down=False),
    ell(m, soul2, (0, -0.4, 0.06), (0.12, 0.3, 0.03))))
for sx, nm in ((-1, 'wingL'), (1, 'wingR')):
    def bwing(m, sx=sx):
        m.tube(bone, [(0, 0, 0), (sx * 1.3, 0.2, 0.9), (sx * 2.8, 0.4, 1.3)], [0.09, 0.07, 0.04], n=6)
        for k in range(4):  # finger bones with torn membrane between
            tip = (sx * (2.8 - k * 0.5), 0.6 + k * 0.5, 1.3 - 1.4 - k * 0.3)
            m.tube(bone, [(sx * 2.8, 0.4, 1.3), tip], [0.04, 0.015], n=5)
        m.prism(ghost, [(0, 0), (sx * 2.8, 0.4), (sx * 2.6, 1.2), (sx * 1.7, 1.6), (sx * 1.1, 1.0), (sx * 0.4, 1.0)], -0.01, 0.01, M=TRS((0, 0, 0.2), (0.4, 0, 0)))
    part(rt, nm, body, (sx * 0.5, -0.4, 0.55), bwing)
for i, (x, y) in enumerate([(-0.65, -0.7), (0.65, -0.7), (-0.65, 0.9), (0.65, 0.9)]):
    sx = 1 if x > 0 else -1
    part(rt, f'leg{i}', body, (x, y, -0.2), lambda m, sx=sx: (
        m.tube(bone, [(0, 0, 0), (sx * 0.3, -0.1, -0.8), (sx * 0.3, 0.15, -1.6)], [0.13, 0.1, 0.08], n=7),
        ell(m, bone2, (sx * 0.3, -0.1, -0.8), (0.13, 0.13, 0.13)),
        claws(m, bone2, Vector((sx * 0.3, -0.05, -1.65)), (0, -1, -0.4), n=4, L=0.3, r=0.05)))
part(rt, 'tail', body, (0, 1.6, 0.2), lambda m: (
    m.tube(bone, [(0, 0, 0), (0, 0.9, -0.3), (0.3, 1.8, -0.6), (0.6, 2.6, -0.5)], [0.12, 0.09, 0.06, 0.02], n=7),
    [horn(m, bone2, (0.15 * k, 0.4 + k * 0.5, -0.1 - k * 0.12), (0, 0.3, 1), 0.2, 0.03) for k in range(4)]))

# ======================================================================== 3: THE FROST PEAKS
fur = mat('fr_fur', (0.82, 0.86, 0.92), rough=0.95)
fur2 = mat('fr_fur_b', (0.55, 0.62, 0.72), rough=0.95)
blue = mat('fr_skin', (0.25, 0.38, 0.6), rough=0.6)
ice = mat('fr_ice', (0.45, 0.72, 0.92), rough=0.06, metal=0.15)
iceg = mat('fr_glow', (0.5, 0.88, 1.0), emit=6)
coal = mat('fr_coal', (0.03, 0.03, 0.04), rough=0.5)
snowm = mat('fr_snow', (0.88, 0.9, 0.95), rough=0.9)
steel = mat('fr_steel', (0.55, 0.62, 0.72), rough=0.25, metal=0.95)
silver = mat('fr_silver', (0.8, 0.85, 0.92), rough=0.2, metal=1)
leather = mat('fr_leather', (0.2, 0.13, 0.08), rough=0.8)
gown = mat('fr_gown', (0.55, 0.72, 0.9), rough=0.35, metal=0.2)
pale = mat('fr_pale', (0.82, 0.88, 0.95), rough=0.4)

wool = mat('fr_wool', (0.8, 0.78, 0.74), rough=1.0)
hornf = mat('fr_horn', (0.34, 0.3, 0.26), rough=0.45)
feather = mat('fr_feather', (0.38, 0.48, 0.62), rough=0.8)
feather2 = mat('fr_feather_b', (0.8, 0.84, 0.9), rough=0.8)
beakm = mat('fr_beak', (0.75, 0.6, 0.3), rough=0.4)

# rime stalker: a great white sabre-toothed cat, striped grey, frost on its whiskers, a long heavy tail
def sc_back(m):
    for k in range(7):  # grey stripes over the back
        y = -0.42 + k * 0.14
        m.tube(fur2, [(-0.21, y, 0.06), (-0.1, y + 0.03, 0.2), (0.1, y + 0.03, 0.2), (0.21, y, 0.06)], 0.018, n=4)
    ell(m, fur, (0, -0.35, 0.05), (0.24, 0.22, 0.2), noise=0.02)  # heavy shoulders
def sc_head(m):
    for sx in (-1, 1):
        horn(m, pale, (sx * 0.055, -0.33, -0.05), (0, -0.25, -1), 0.26, 0.028, curl=(0, 0.5, 0))  # sabre fangs
        ell(m, fur, (sx * 0.09, -0.02, 0.15), (0.045, 0.03, 0.06))  # ears
        for k in range(3):  # frosted whiskers
            m.tube(ice, [(sx * 0.07, -0.36, 0.0), (sx * 0.28, -0.4 + k * 0.03, 0.03 - k * 0.04)], 0.004, n=3)
    ell(m, fur2, (0, -0.2, 0.12), (0.09, 0.15, 0.04))  # brow stripe
rt, body, head = beast('snowcat', dict(hide=fur, leg=fur, eye=iceg, tooth=pale, mouth=coal, back=sc_back, head_fn=sc_head,
    tail_fn=lambda m: (m.tube(fur, [(0, 0.72, -0.08), (0.12, 0.95, -0.25), (0.3, 1.12, -0.18), (0.4, 1.25, 0.0)], [0.055, 0.05, 0.04, 0.025], n=7),
                       [m.tube(fur2, [(0.12 * k / 2, 0.8 + k * 0.12, -0.15), (0.12 * k / 2 + 0.01, 0.82 + k * 0.12, -0.1)], 0.05, n=6) for k in range(3)])))
bake_scale(rt, 1.25)

# avalanche ram: a shaggy mountain ram, wool hung with icicles, horns curled like boulders
def rm_back(m):
    m.ico(wool, 1, TRS((0, 0, 0.04), scale=(0.34, 0.62, 0.3)), sub=2, noise=0.07)
    for k in range(9):  # icicles hanging from the wool
        x, y = random.uniform(-0.25, 0.25), random.uniform(-0.45, 0.45)
        crystal(m, ice, aim((0, 0, -1), (x, y, -0.2)), 0.025, random.uniform(0.1, 0.2))
    spikes_on(m, wool, (0, 0, 0.1), (0.3, 0.5, 0.28), 14, 0.12, 0.06, up=0.4, seed=21)
def rm_head(m):
    for sx in (-1, 1):
        horn(m, hornf, (sx * 0.09, -0.04, 0.1), (sx * 1, 0.5, 0.5), 0.85, 0.08, curl=(0, -1.6, -2.4), n=8, seg=9)
        ell(m, wool, (sx * 0.12, 0.0, 0.08), (0.06, 0.04, 0.03))
    ell(m, wool, (0, 0.02, 0.15), (0.14, 0.12, 0.08), noise=0.02)  # woolly crown between the horns
    ell(m, hornf, (0, -0.05, 0.13), (0.11, 0.09, 0.05))  # the battering brow
rt, body, head = beast('ram', dict(hide=fur2, leg=fur2, eye=iceg, tooth=pale, mouth=coal, back=rm_back, head_fn=rm_head,
    tail_fn=lambda m: ell(m, wool, (0, 0.2, 0.05), (0.08, 0.12, 0.08))))
bake_scale(rt, 1.5)

# cryomancer: a tall ice-witch in layered blue robes, a frozen veil and a staff of living ice
rt, body = caster('cryomancer', dict(robe=gown, trim=silver, hand=pale, glow=iceg,
    torso=lambda m: [crystal(m, ice, aim((sx * 0.6, 0.2, 1), (sx * 0.3, 0.02, 1.18)), 0.05, 0.3) for sx in (-1, 1) for _ in range(2)],
    head=lambda m: (m.lathe(gown, [(0, -0.05), (0.2, 0.0), (0.24, 0.2), (0.2, 0.38), (0.08, 0.5), (0, 0.55)], n=16, M=TRS((0, 0.04, 0)), smooth=True),
                    ell(m, ink, (0, -0.12, 0.18), (0.15, 0.08, 0.15)), ell(m, pale, (0, -0.15, 0.17), (0.11, 0.05, 0.13), u=14, v=10),
                    [ell(m, iceg, (sx * 0.045, -0.2, 0.2), (0.022, 0.01, 0.012), u=8, v=6) for sx in (-1, 1)],
                    [m.tube(ice, [(x, -0.2, 0.1), (x * 1.1, -0.22, -0.12)], [0.012, 0.003], n=4) for x in (-0.06, -0.02, 0.02, 0.06)],  # a veil of icicles
                    [crystal(m, ice, aim((math.cos(a) * 0.4, math.sin(a) * 0.3, 1), (math.cos(a) * 0.15, math.sin(a) * 0.12, 0.42)), 0.04, 0.25 if k % 2 else 0.4) for k, a in enumerate([1.9 + k * 0.4 for k in range(6)])]),
    staff=staff(silver, lambda m: (crystal(m, ice, TRS((0.03, 0, 0.8)), 0.08, 0.5), m.ico(iceg, 0.08, Matrix.Translation((0.03, 0, 0.95)), sub=2),
                                   [crystal(m, ice, aim((math.cos(a), math.sin(a), 0.6), (0.03, 0, 0.85)), 0.03, 0.22) for a in (0, 2.1, 4.2)]))))

# frost totem: a pillar of carved ice with a cold heart, a ring of shards turning round it
rt = root('frosttotem')
def ft_body(m):
    for k in range(4):  # stacked carved blocks, each a little twisted
        m.lathe(ice, [(0, 0), (0.3 - k * 0.04, 0), (0.32 - k * 0.04, 0.2), (0.28 - k * 0.04, 0.4), (0, 0.4)], n=6, M=TRS((0, 0, k * 0.42), (0, 0, k * 0.5)))
        runes(m, iceg, 0.33 - k * 0.04, 0.06, 6, 0.008, k * 0.42 + 0.2, random.Random(40 + k))
    m.ico(iceg, 0.16, Matrix.Translation((0, 0, 1.9)), sub=2)
    for a in (0, 2.1, 4.2):
        crystal(m, ice, aim((math.cos(a), math.sin(a), 1.2), (0, 0, 1.75)), 0.05, 0.4)
    for k in range(6):
        crystal(m, snowm, aim((math.cos(k), math.sin(k), 0.3), (0.25 * math.cos(k), 0.25 * math.sin(k), 0.05)), 0.07, 0.3)
body = part(rt, 'body', rt, (0, 0, 0), ft_body)
part(rt, 'ring', body, (0, 0, 1.3), lambda m: [crystal(m, ice, TRS((*pol(0.7, TAU * k / 5), 0), (math.pi / 2, 0, TAU * k / 5)), 0.05, 0.3) for k in range(5)])

# rime golem: a hulk of packed ice and snow, a blue fire inside, armoured in a shell of clear crystal
def ig_body(m):
    m.ico(snowm, 1, TRS((0, 0, 0.75), (0.2, 0, 0), (0.8, 0.6, 0.72)), sub=2, noise=0.07)
    m.ico(iceg, 0.3, TRS((0, -0.35, 0.85)), sub=2)
    for k in range(14):  # crystal armour plates
        a, z = random.uniform(0, TAU), random.uniform(0.3, 1.3)
        crystal(m, ice, aim((math.cos(a), math.sin(a) * 0.8, 0.4), (0.7 * math.cos(a), 0.55 * math.sin(a), z)), random.uniform(0.12, 0.2), random.uniform(0.3, 0.6))
    spikes_on(m, ice, (0, 0.1, 1.3), (0.7, 0.5, 0.3), 8, 0.5, 0.1, seed=17)
def ig_head(m):
    m.ico(ice, 0.3, TRS((0, -0.05, 0.12), scale=(1, 0.9, 0.8)), sub=1)
    eyes(m, iceg, (0, -0.3, 0.14), 0.1, (0.05, 0.03, 0.03))
    for sx in (-1, 1):
        crystal(m, ice, aim((sx * 0.5, 0.2, 1), (sx * 0.15, 0, 0.25)), 0.06, 0.45)
def ig_arm(m, sx):
    m.tube(snowm, [(0, 0, 0), (sx * 0.15, -0.05, -0.55), (sx * 0.18, -0.2, -1.1)], [0.2, 0.17, 0.15], n=8)
    m.ico(ice, 0.3, TRS((sx * 0.2, -0.25, -1.3), scale=(1, 1.1, 0.9)), sub=1)  # a fist of solid ice
    for k in range(4):
        crystal(m, ice, aim((sx * 0.6, (k - 1.5) * 0.3, 0.3), (sx * 0.25, -0.05 + (k - 1.5) * 0.08, -0.4 - k * 0.15)), 0.06, 0.3)
    ell(m, ice, (0, 0, 0), (0.28, 0.26, 0.26))
def ig_leg(m, sx):
    m.tube(snowm, [(0, 0, 0), (0, -0.05, -0.45), (0, 0.02, -0.85)], [0.2, 0.17, 0.15], n=8)
    m.ico(ice, 0.24, TRS((0, -0.1, -0.85), scale=(1, 1.3, 0.4)), sub=1)
rt, body, head = golem('icegolem', dict(body=ig_body, head=ig_head, arm=ig_arm, leg=ig_leg))

# storm harpy: a hag with great blue-grey wings for arms' cloak, a hooked beak and talons, feathers rimed with frost
rt, body, head = biped('harpy', dict(skin=pale, belly=feather2, arm=feather, leg=beakm, shoulder=feather, eye=iceg, mouth=coal, claw=coal, tooth=pale, hunch=0.25, reach=0.9, wings=feather,
    torso=lambda m: (spikes_on(m, feather, (0, 0.1, 0.45), (0.32, 0.3, 0.3), 12, 0.3, 0.05, seed=9), spikes_on(m, feather2, (0, -0.1, 0.25), (0.3, 0.25, 0.2), 8, 0.2, 0.04, up=-0.2, seed=10)),
    crown_fn=lambda m: (m.lathe(beakm, [(0.06, 0), (0.05, -0.1), (0.02, -0.2), (0, -0.24)], n=8, M=aim((0, 1, 0.5), (0, -0.2, 0.15)), smooth=True),
                        [m.tube(feather, [(x, 0.05, 0.3), (x * 1.6, 0.25, 0.4), (x * 1.8, 0.45, 0.3)], [0.03, 0.02, 0.004], n=4) for x in (-0.1, -0.04, 0.04, 0.1)])))
for ob in PARTS['harpy']:  # the wings are its pride: twice the span of the usual pair
    if ob.name.endswith(('_wingL', '_wingR')):
        ob.data.transform(Matrix.Scale(2.2, 4))

# yeti: a towering white beast with curling horns and a blue face
def ye_body(m):
    m.ico(fur, 1, TRS((0, 0, 0.75), (0.2, 0, 0), (0.85, 0.65, 0.75)), sub=2, noise=0.08)
    m.ico(blue, 1, TRS((0, -0.55, 0.8), scale=(0.5, 0.15, 0.4)), sub=1)  # bare chest
    spikes_on(m, fur2, (0, 0.2, 1.1), (0.7, 0.5, 0.4), 10, 0.3, 0.07, seed=11)
def ye_head(m):
    m.ico(fur, 0.34, TRS((0, -0.05, 0.12)), sub=2, noise=0.05)
    ell(m, blue, (0, -0.28, 0.08), (0.2, 0.08, 0.17))
    eyes(m, iceg, (0, -0.35, 0.14), 0.09, (0.04, 0.025, 0.03))
    teeth(m, pale, (0, -0.36, 0.0), 0.18, 4, 0.06)
    for sx in (-1, 1):
        horn(m, pale, (sx * 0.2, -0.05, 0.3), (sx * 0.8, 0.3, 0.4), 0.6, 0.07, curl=(sx * -0.5, 0.6, -1.2))
def ye_arm(m, sx):
    m.ico(fur, 0.42, TRS((0, 0, 0)), sub=1, noise=0.06)
    m.tube(fur, [(0, 0, 0), (sx * 0.12, -0.05, -0.6), (sx * 0.15, -0.15, -1.15)], [0.28, 0.24, 0.24], n=9)
    ell(m, blue, (sx * 0.15, -0.2, -1.35), (0.24, 0.26, 0.2))
    claws(m, pale, Vector((sx * 0.15, -0.38, -1.42)), (0, -0.6, -1), n=4, L=0.25, r=0.04)
def ye_leg(m, sx):
    m.tube(fur, [(0, 0, 0), (0, -0.05, -0.5), (0, 0, -0.8)], [0.3, 0.26, 0.24], n=9)
    ell(m, blue, (0, -0.15, -0.85), (0.2, 0.3, 0.08))
rt, body, head = golem('yeti', dict(body=ye_body, head=ye_head, arm=ye_arm, leg=ye_leg))
# Hrimgar the Frost Giant: a bearded giant in furs and a horned helm, dragging an ice-bound club
rt, body, head = biped('frostgiant', dict(skin=blue, belly=fur, arm=blue, leg=fur2, shoulder=fur, eye=iceg, mouth=coal, claw=pale, tooth=pale, hunch=0.2, reach=1.1,
    torso=lambda m: (ell(m, fur, (0, 0.05, 0.6), (0.42, 0.36, 0.2), noise=0.02), m.lathe(leather, [(0.37, 0.05), (0.38, 0.1), (0.37, 0.15)], n=16, closed=True),
                     m.cube(silver, TRS((0, -0.37, 0.1), scale=(0.14, 0.04, 0.1)))),
    crown_fn=lambda m: (m.lathe(steel, [(0, 0.15), (0.2, 0.17), (0.24, 0.25), (0.2, 0.36), (0, 0.4)], n=14),
                        [horn(m, pale, (sx * 0.2, -0.02, 0.27), (sx * 1, 0.1, 0.6), 0.45, 0.06, curl=(sx * 0.2, 0, 0.8)) for sx in (-1, 1)],
                        [m.tube(pale, [(x, -0.25, 0.08), (x * 1.2, -0.28, -0.12), (x * 0.8, -0.24, -0.38)], [0.04, 0.035, 0.01], n=5) for x in (-0.1, -0.05, 0, 0.05, 0.1)])))
part(rt, 'weapon', [o for o in PARTS['frostgiant'] if o.name.endswith('_armR')][0], (0.1, -0.32, -0.72), lambda m: (
    m.lathe(leather, [(0.05, -0.2), (0.05, 0.2)], n=6), m.lathe(ice, [(0.05, 0.2), (0.16, 0.5), (0.22, 1.1), (0.18, 1.3), (0, 1.35)], n=7, noise=0.02),
    spikes_on(m, ice, (0, 0, 1.0), (0.2, 0.2, 0.3), 8, 0.3, 0.05, seed=21)))
bake_scale(rt, 2.9)
# Skadi, the Frost Queen: tall, pale, in a gown of ice with a crown of shards and a crystal sceptre
rt, body = caster('frostqueen', dict(robe=gown, trim=silver, hand=pale, glow=iceg,
    head=lambda m: (ell(m, pale, (0, -0.03, 0.15), (0.11, 0.12, 0.14), u=14, v=10), [ell(m, iceg, (sx * 0.04, -0.12, 0.17), (0.018, 0.01, 0.012), u=6, v=4) for sx in (-1, 1)],
                    m.lathe(silver, [(0.12, 0.24), (0.13, 0.27), (0.12, 0.3)], n=16, closed=True),
                    [crystal(m, ice if k % 2 else iceg, aim((math.cos(TAU * k / 9) * 0.3, math.sin(TAU * k / 9) * 0.3, 1), (*pol(0.12, TAU * k / 9), 0.28)), 0.03, 0.3 if k % 2 else 0.18) for k in range(9)],
                    [m.tube(pale, [(math.cos(a) * 0.1, 0.06 + math.sin(a) * 0.05, 0.22), (math.cos(a) * 0.14, 0.18, -0.1), (math.cos(a) * 0.1, 0.22, -0.4)], [0.03, 0.025, 0.005], n=4) for a in (2.6, 3.14, 3.7)]),
    staff=staff(silver, lambda m: (crystal(m, iceg, TRS((0.03, 0, 0.75)), 0.07, 0.45), [crystal(m, ice, aim((math.cos(a), math.sin(a), 1.5), (0.03, 0, 0.78)), 0.04, 0.25) for a in (0, 2.1, 4.2)])),
    torso=lambda m: ([crystal(m, ice, aim((sx * 0.5, 0.2, 1), (sx * 0.28, 0, 1.18)), 0.06, 0.4) for sx in (-1, 1)],
                     m.lathe(ice, [(0, -0.45), (0.5, -0.4), (0.48, 0.2), (0.3, 1.0), (0, 1.05)], n=14, M=TRS((0, 0.15, 0.1), scale=(1, 0.35, 1)), jag=0.08))), robe_h=1.5)
bake_scale(rt, 1.65)

# ======================================================================== 4: THE INFERNAL LEGION
char = mat('he_char', (0.08, 0.04, 0.035), rough=0.7)
hide = mat('he_hide', (0.35, 0.06, 0.04), rough=0.6)
hide2 = mat('he_hide_b', (0.22, 0.04, 0.03), rough=0.65)
lava = mat('he_lava', (1, 0.35, 0.05), emit=7)
ember = mat('he_ember', (1, 0.6, 0.15), emit=6)
obsid = mat('he_obsidian', (0.03, 0.02, 0.03), rough=0.12, metal=0.3)
horn_m = mat('he_horn', (0.15, 0.1, 0.08), rough=0.5)
blackst = mat('he_steel', (0.06, 0.05, 0.05), rough=0.3, metal=0.9)
brass = mat('he_brass', (0.55, 0.3, 0.12), rough=0.3, metal=0.95)
redrobe = mat('he_robe', (0.28, 0.04, 0.03), rough=0.85)
membrane = mat('he_wing', (0.25, 0.05, 0.04), rough=0.6)

# cinder imp: a little red devil with bat wings, horns and a spade tail
rt, body, head = biped('cinderimp', dict(skin=hide, belly=hide2, eye=ember, mouth=lava, claw=horn_m, tooth=horn_m, hunch=0.3, tail=True, wings=membrane,
    crown_fn=lambda m: [horn(m, horn_m, (sx * 0.13, -0.08, 0.28), (sx * 0.5, 0.3, 0.8), 0.32, 0.05, curl=(sx * 0.2, 0.8, -0.3)) for sx in (-1, 1)]))
bake_scale(rt, 0.88)
chainm = mat('he_chain', (0.18, 0.16, 0.15), rough=0.35, metal=0.9)
rust = mat('he_rust', (0.35, 0.16, 0.07), rough=0.7, metal=0.4)

# hellfire berserker: a broad-shouldered demon split with burning cracks, a great axe in each fist, chains of the pit still on its wrists
def bz_arm(m, sx):
    wr = Vector((sx * 0.1, -0.32, -0.72 * 1.1))
    m.lathe(leather, [(0.025, 0.1), (0.025, -0.65)], n=6, M=TRS(tuple(wr)))  # the haft
    m.prism(blackst, [(0, -0.42), (sx * 0.05, -0.38), (sx * 0.32, -0.3), (sx * 0.36, -0.55), (sx * 0.3, -0.72), (sx * 0.05, -0.62), (0, -0.62)], -0.02, 0.02, M=TRS(tuple(wr), (math.pi / 2, 0, 0)))
    m.prism(lava, [(sx * 0.33, -0.32), (sx * 0.37, -0.55), (sx * 0.31, -0.7), (sx * 0.29, -0.68), (sx * 0.34, -0.55), (sx * 0.3, -0.34)], -0.025, 0.025, M=TRS(tuple(wr), (math.pi / 2, 0, 0)))
    m.lathe(chainm, [(0.08, -0.62), (0.09, -0.58), (0.08, -0.54)], n=10, closed=True)  # a shackle
    m.tube(chainm, [tuple(wr + Vector((0, 0, 0.15))), tuple(wr + Vector((sx * 0.1, 0.1, -0.1))), tuple(wr + Vector((sx * 0.05, 0.15, -0.4)))], 0.015, n=4)
rt, body, head = biped('berserker', dict(skin=hide, belly=hide2, arm=hide, leg=hide2, shoulder=obsid, eye=ember, mouth=lava, claw=horn_m, tooth=horn_m, hunch=0.15, reach=1.1, arm_fn=bz_arm,
    torso=lambda m: ([m.tube(lava, [(sx * 0.08, -0.33, 0.12), (sx * 0.22, -0.3, 0.32), (sx * 0.12, -0.27, 0.55)], 0.016, n=4) for sx in (-1, 1)],
                     [ell(m, obsid, (sx * 0.4, 0, 0.62), (0.22, 0.22, 0.18), noise=0.03) for sx in (-1, 1)],
                     [horn(m, obsid, (sx * 0.42, 0.05, 0.72), (sx * 0.3, 0.2, 1), 0.25, 0.05) for sx in (-1, 1) for _ in (0,)],
                     m.lathe(leather, [(0.33, 0.0), (0.34, 0.06), (0.33, 0.12)], n=16, closed=True)),
    crown_fn=lambda m: ([horn(m, horn_m, (sx * 0.14, -0.06, 0.26), (sx * 0.9, -0.4, 0.4), 0.5, 0.06, curl=(sx * -0.4, 0.6, 1.0)) for sx in (-1, 1)],
                        [m.tube(lava, [(x, -0.08, 0.32), (x * 1.4, 0.15, 0.4), (x, 0.35, 0.3)], [0.03, 0.02, 0.005], n=4) for x in (-0.05, 0, 0.05)])))
bake_scale(rt, 1.15)

# brimstone cannoneer: a squat demon in black iron plates, a smoking brass mortar strapped over its shoulder, shells on a bandolier
def cn_body(m):
    m.ico(hide2, 1, TRS((0, 0, 0.7), (0.15, 0, 0), (0.75, 0.6, 0.65)), sub=2, noise=0.04)
    for k in range(10):  # iron plates
        a, z = random.uniform(2.4, 7.0), random.uniform(0.3, 1.2)
        q = Vector((math.cos(a), math.sin(a), 0.2)).normalized()
        m.ico(blackst, 1, Matrix.Translation((0.68 * math.cos(a), 0.55 * math.sin(a), z)) @ q.to_track_quat('Z', 'Y').to_matrix().to_4x4() @ Matrix.Diagonal((0.28, 0.22, 0.06, 1)), sub=1)
    m.tube(leather, [(-0.6, -0.45, 1.25), (0, -0.62, 0.75), (0.6, -0.45, 0.25)], 0.06, n=6)  # bandolier
    for k in range(5):
        u = k / 4
        m.lathe(brass, [(0, 0), (0.06, 0.02), (0.06, 0.14), (0, 0.22)], n=10, M=TRS((-0.5 + u, -0.6 + 0.12 * abs(u - 0.5), 1.15 - u * 0.9), (math.pi / 2, 0, 0)))
    # the mortar over the right shoulder, muzzle forward and up
    m.lathe(brass, [(0.0, -0.6), (0.24, -0.6), (0.28, -0.4), (0.22, 0.2), (0.27, 0.55), (0.3, 0.62), (0.2, 0.62), (0.18, 0.3), (0, 0.3)], n=18, M=aim((0, -1, 0.6), (0.55, 0.15, 1.5)), smooth=True)
    m.lathe(lava, [(0, 0.5), (0.18, 0.52), (0.17, 0.6), (0, 0.58)], n=14, M=aim((0, -1, 0.6), (0.55, 0.15, 1.5)))  # the glowing bore
    m.lathe(blackst, [(0.29, -0.1), (0.31, 0.0), (0.29, 0.1)], n=18, M=aim((0, -1, 0.6), (0.55, 0.15, 1.5)), closed=True)
def cn_head(m):
    m.ico(hide, 0.28, TRS((0, -0.05, 0.1)), sub=2)
    m.lathe(blackst, [(0, -0.05), (0.26, 0.0), (0.3, 0.18), (0.24, 0.32), (0, 0.36)], n=14, M=TRS((0, 0.02, 0.02)))  # a pot helm
    m.prism(ember, [(-0.14, 0), (0.14, 0), (0.14, 0.03), (-0.14, 0.03)], 0, 0.02, M=TRS((0, -0.28, 0.16), (math.pi / 2, 0, 0)))
    for sx in (-1, 1):
        horn(m, horn_m, (sx * 0.24, 0, 0.2), (sx * 1, 0.2, 0.3), 0.3, 0.05, curl=(0, 0, 1))
def cn_arm(m, sx):
    m.ico(blackst, 0.32, TRS((0, 0, 0)), sub=1)
    m.tube(hide2, [(0, 0, 0), (sx * 0.12, -0.05, -0.5), (sx * 0.15, -0.15, -0.95)], [0.18, 0.15, 0.14], n=8)
    ell(m, blackst, (sx * 0.15, -0.2, -1.05), (0.2, 0.22, 0.18))
    claws(m, horn_m, Vector((sx * 0.15, -0.35, -1.12)), (0, -0.6, -1), n=3, L=0.2, r=0.035)
def cn_leg(m, sx):
    m.tube(hide2, [(0, 0, 0), (0, -0.05, -0.45), (0, 0, -0.8)], [0.22, 0.2, 0.18], n=8)
    m.ico(blackst, 0.26, TRS((0, -0.1, -0.82), scale=(1, 1.3, 0.45)), sub=1)
rt, body, head = golem('cannoneer', dict(body=cn_body, head=cn_head, arm=cn_arm, leg=cn_leg))
bake_scale(rt, 0.8)

# chain tormentor: a gaunt, long-armed jailer of the pit in a caged iron mask, wrapped in chains, swinging a meat-hook
def tm_torso(m):
    for k in range(5):  # chains wound round and round
        z = 0.1 + k * 0.12
        m.tube(chainm, [(0.3 * math.cos(a), 0.24 * math.sin(a), z + 0.06 * math.sin(a * 2 + k)) for a in [j * TAU / 12 for j in range(13)]], 0.018, n=5)
    for sx in (-1, 1):
        m.tube(chainm, [(sx * 0.2, -0.15, 0.6), (sx * 0.3, -0.3, 0.1), (sx * 0.2, -0.25, -0.35)], 0.016, n=4)  # hanging loops
    spikes_on(m, blackst, (0, 0.15, 0.5), (0.25, 0.2, 0.25), 6, 0.25, 0.03, seed=61)
def tm_mask(m):
    m.lathe(blackst, [(0, -0.02), (0.24, 0.02), (0.26, 0.2), (0.22, 0.36), (0, 0.4)], n=12, M=TRS((0, -0.02, 0)))
    for k in range(7):  # the cage bars over the face
        x = (k - 3) * 0.05
        m.tube(rust, [(x, -0.25, 0.32), (x, -0.27, 0.15), (x * 0.8, -0.22, -0.02)], 0.012, n=4)
    m.tube(rust, [(-0.18, -0.24, 0.15), (0.18, -0.24, 0.15)], 0.014, n=4)
    for sx in (-1, 1):
        ell(m, ember, (sx * 0.06, -0.2, 0.18), (0.03, 0.01, 0.02), u=6, v=4)
    for a in (2.2, 2.7, 3.2, 3.7, 4.2):
        horn(m, rust, (0.22 * math.cos(a + 1.57), 0.2 * math.sin(a + 1.57) + 0.05, 0.32), (math.cos(a + 1.57), math.sin(a + 1.57), 1.2), 0.18, 0.025)
rt, body, head = biped('tormentor', dict(skin=char, belly=hide2, arm=char, leg=char, shoulder=blackst, eye=ember, mouth=lava, claw=rust, tooth=rust, hunch=0.4, reach=1.4,
    torso=tm_torso, crown_fn=tm_mask))
part(rt, 'weapon', [o for o in PARTS['tormentor'] if o.name.endswith('_armR')][0], (0.1, -0.32, -0.72 * 1.4), lambda m: (
    m.tube(chainm, [(0, 0, 0), (0, -0.03, -0.3), (0, 0, -0.6)], 0.015, n=4),
    m.tube(rust, [(0, 0, -0.6), (0, 0, -0.8), (0, -0.12, -0.95), (0, -0.25, -0.88), (0, -0.25, -0.75)], [0.03, 0.03, 0.028, 0.022, 0.008], n=6)))  # the hook
bake_scale(rt, 1.25)

# gorger: a vast swollen demon that is mostly mouth, belly glowing where it's split with what it has eaten
def gg_face(m):
    ell(m, char, (0, -0.36, 0.3), (0.3, 0.08, 0.2))  # the maw
    teeth(m, horn_m, (0, -0.4, 0.48), 0.5, 9, 0.09)
    teeth(m, horn_m, (0, -0.4, 0.13), 0.45, 8, 0.08, down=False)
    ell(m, lava, (0, -0.34, 0.3), (0.16, 0.04, 0.08))
    eyes(m, ember, (0, -0.33, 0.66), 0.08, (0.035, 0.02, 0.03), n=3)
    for k in range(5):  # split seams of fire round the belly
        a = 3.4 + k * 0.6
        m.tube(lava, [(0.42 * math.cos(a), 0.42 * math.sin(a), 0.05), (0.43 * math.cos(a + 0.2), 0.43 * math.sin(a + 0.2), 0.3)], 0.02, n=4)
    for sx in (-1, 1):
        horn(m, horn_m, (sx * 0.18, -0.15, 0.68), (sx * 0.6, -0.3, 0.8), 0.3, 0.05, curl=(sx * 0.2, 0.4, -0.6))
    spikes_on(m, obsid, (0, 0.15, 0.55), (0.35, 0.3, 0.25), 7, 0.2, 0.04, seed=71)
rt, body = keg('gorger', dict(body=hide, limb=hide2, noise=0.03, face=gg_face,
    fuse=lambda m: (m.lathe(lava, [(0, 0), (0.1, 0.06), (0.06, 0.2), (0, 0.32)], n=7, twist=0.5), m.ico(ember, 0.06, Matrix.Translation((0, 0, 0.04)), sub=1))))
bake_scale(rt, 2.0)

# pyre priest: red robes, a horned hood, a staff bearing a burning brazier
rt, body = caster('pyrepriest', dict(robe=redrobe, trim=brass, hand=hide, glow=ember,
    head=lambda m: (m.lathe(redrobe, [(0, -0.05), (0.2, 0.0), (0.24, 0.18), (0.2, 0.36), (0.1, 0.46), (0, 0.5)], n=16, M=TRS((0, 0.04, 0)), smooth=True),
                    ell(m, char, (0, -0.12, 0.18), (0.15, 0.08, 0.15)), [ell(m, ember, (sx * 0.05, -0.19, 0.2), (0.025, 0.01, 0.015), u=8, v=6) for sx in (-1, 1)],
                    [horn(m, horn_m, (sx * 0.14, -0.02, 0.32), (sx * 0.6, 0.4, 0.7), 0.3, 0.04, curl=(sx * 0.3, 0.6, -0.4)) for sx in (-1, 1)]),
    staff=staff(blackst, lambda m: (m.lathe(brass, [(0.02, 0.75), (0.14, 0.82), (0.17, 0.95), (0.13, 0.95), (0.02, 0.85)], n=10, smooth=True),
                                    m.lathe(lava, [(0, 0.9), (0.1, 0.95), (0.06, 1.1), (0, 1.22)], n=7, twist=0.5)))))
# Azgaroth the Pit Lord: a great horned demon with a gut of fire, bat wings and a cleaver
rt, body, head = biped('pitlord', dict(skin=hide, belly=lava, arm=hide, leg=hide2, shoulder=obsid, eye=ember, mouth=lava, claw=horn_m, tooth=horn_m, hunch=0.15, reach=1.1, tail=True, wings=membrane,
    torso=lambda m: (spikes_on(m, obsid, (0, 0.15, 0.55), (0.3, 0.25, 0.2), 8, 0.35, 0.05, seed=44), [m.tube(lava, [(-0.2, -0.3, z), (0.2, -0.3, z)], 0.012, n=4) for z in (0.25, 0.35)]),
    crown_fn=lambda m: [horn(m, horn_m, (sx * 0.15, -0.05, 0.28), (sx * 0.9, 0.1, 0.4), 0.55, 0.07, curl=(sx * -0.3, 0.2, 1.4)) for sx in (-1, 1)]))
part(rt, 'weapon', [o for o in PARTS['pitlord'] if o.name.endswith('_armR')][0], (0.1, -0.32, -0.72), lambda m: (
    m.lathe(leather, [(0.035, -0.15), (0.035, 0.25)], n=6),
    m.prism(blackst, [(-0.02, 0.25), (0.35, 0.3), (0.4, 1.1), (0.1, 1.2), (-0.02, 1.0)], -0.025, 0.025, M=TRS(rot=(math.pi / 2, 0, 0))),
    m.prism(lava, [(0.3, 0.32), (0.36, 0.34), (0.4, 1.08), (0.34, 1.1)], -0.03, 0.03, M=TRS(rot=(math.pi / 2, 0, 0)))))
bake_scale(rt, 2.9)
# Belphegor the Archdemon: a winged demon lord, crowned in horns, with a sword of hellfire
rt, body, head = biped('archdemon', dict(skin=char, belly=hide2, arm=char, leg=char, shoulder=blackst, eye=ember, mouth=lava, claw=obsid, tooth=horn_m, hunch=0.05, reach=1.05, wings=membrane,
    torso=lambda m: ([m.tube(lava, [(sx * 0.05, -0.32, 0.15), (sx * 0.2, -0.28, 0.45), (sx * 0.1, -0.22, 0.65)], 0.015, n=4) for sx in (-1, 1)],
                     [horn(m, blackst, (sx * 0.38, 0, 0.65), (sx * 0.4, 0, 1), 0.3, 0.05) for sx in (-1, 1)]),
    crown_fn=lambda m: ([horn(m, obsid, (math.cos(a) * 0.15, math.sin(a) * 0.1, 0.3), (math.cos(a) * 0.4, math.sin(a) * 0.3, 1), 0.35 if k % 2 else 0.22, 0.04) for k, a in enumerate([2.4 + k * 0.38 for k in range(5)])],
                        m.lathe(brass, [(0.21, 0.24), (0.22, 0.27), (0.21, 0.3)], n=16, closed=True))))
part(rt, 'weapon', [o for o in PARTS['archdemon'] if o.name.endswith('_armR')][0], (0.1, -0.32, -0.72), lambda m: (
    m.lathe(leather, [(0.028, -0.16), (0.028, 0.12)], n=6), m.prism(brass, [(-0.2, -0.02), (0.2, -0.02), (0.2, 0.02), (-0.2, 0.02)], 0.12, 0.16),
    m.lathe(obsid, [(0, 0.14), (0.08, 0.16), (0.07, 1.25), (0, 1.5)], n=4, M=TRS(scale=(1, 0.25, 1))), m.lathe(lava, [(0, 0.2), (0.02, 0.22), (0.016, 1.15), (0, 1.3)], n=4, M=TRS((0, -0.02, 0), scale=(1, 0.5, 1)))))
bake_scale(rt, 2.35)

# ======================================================================== 5: THE VOID
chitin = mat('vo_chitin', (0.06, 0.035, 0.08), rough=0.2, metal=0.3)
chitin2 = mat('vo_chitin_b', (0.12, 0.06, 0.16), rough=0.3, metal=0.2)
vflesh = mat('vo_flesh', (0.3, 0.1, 0.34), rough=0.45)
vglow = mat('vo_glow', (0.7, 0.3, 1.0), emit=6)
vcyan = mat('vo_cyan', (0.3, 0.9, 1.0), emit=5)
eyew = mat('vo_eye', (0.88, 0.85, 0.92), rough=0.2)
viris = mat('vo_iris', (0.75, 0.25, 1.0), emit=6)
black = mat('vo_black', (0.0, 0.0, 0.0), rough=0.3)
goo = mat('vo_goo', (0.35, 0.12, 0.5), rough=0.08, emit=0.6, ecolor=(0.6, 0.2, 0.9), alpha=0.6)
vrobe = mat('vo_robe', (0.08, 0.05, 0.12), rough=0.85)
vcrys = mat('vo_crystal', (0.7, 0.35, 1.0), emit=3)


def eyeball(m, c, r, look=(0, -1, 0)):
    d = Vector(look).normalized()
    m.sphere(eyew, r, TRS(c), u=12, v=8)
    m.sphere(viris, r * 0.5, TRS(tuple(Vector(c) + d * r * 0.75), scale=(1, 0.4, 1)), u=10, v=6)
    m.sphere(black, r * 0.22, TRS(tuple(Vector(c) + d * r * 0.95), scale=(0.5, 0.3, 1)), u=6, v=4)


mirror = mat('vo_mirror', (0.75, 0.72, 0.85), rough=0.03, metal=1)
vsteel = mat('vo_steel', (0.12, 0.08, 0.18), rough=0.2, metal=0.9)

# mirror shade: a faceless figure built of floating shards of black mirror, its reflections walking beside it
def ms_torso(m):
    for k in range(18):  # shards hovering off the body
        d = Vector((random.uniform(-1, 1), random.uniform(-1, 1), random.uniform(-0.3, 1))).normalized()
        crystal(m, mirror if k % 3 else vcrys, aim(d, (d.x * 0.38, d.y * 0.3, 0.3 + d.z * 0.35)), random.uniform(0.03, 0.06), random.uniform(0.12, 0.25))
    m.tube(vglow, [(0, -0.2, -0.05), (0, -0.28, 0.35), (0, -0.2, 0.68)], 0.012, n=4)  # a seam of light down the front
rt, body, head = biped('shade', dict(skin=black, belly=chitin, arm=black, leg=black, shoulder=mirror, eye=vglow, mouth=black, claw=mirror, tooth=black, hunch=0.15, reach=1.15, torso=ms_torso,
    crown_fn=lambda m: (ell(m, mirror, (0, -0.2, 0.14), (0.16, 0.06, 0.19), u=14, v=10),  # a blank mirror for a face
                        [crystal(m, mirror, aim((math.cos(a), math.sin(a) * 0.5, 1.4), (math.cos(a) * 0.14, math.sin(a) * 0.1, 0.3)), 0.03, 0.3) for a in (1.0, 1.6, 2.2, 0.4, 2.8)])))
bake_scale(rt, 1.05)

# gravity maw: a floating ball of void that is nothing but a ringed mouth turned inside out, sucking at the air
def mw_body(m):
    m.sphere(chitin, 0.62, TRS((0, 0, 0)), u=24, v=16)
    m.sphere(black, 0.5, TRS((0, -0.3, 0), scale=(1, 0.5, 1)), u=20, v=12)  # the gullet
    m.sphere(vglow, 0.14, TRS((0, -0.12, 0)), u=12, v=8)
    for ring in range(3):  # rings of teeth spiralling down into it
        r = 0.48 - ring * 0.12
        for k in range(14):
            a = TAU * k / 14 + ring * 0.2
            m.lathe(eyew, [(0.03, 0), (0, 0.09)], n=4, M=aim((-math.cos(a), 0.4, -math.sin(a)), (r * math.cos(a), -0.5 + ring * 0.1, r * math.sin(a))))
    for a in (0.8, 2.3, 3.9, 5.4):
        eyeball(m, (0.55 * math.cos(a), 0.15, 0.55 * math.sin(a)), 0.07, (math.cos(a), 0, math.sin(a)))
    spikes_on(m, chitin2, (0, 0.2, 0), (0.6, 0.5, 0.6), 10, 0.25, 0.05, up=0, seed=81)
rt, body = floater('maw', dict(body=mw_body, tent=vflesh, tip=vglow, tents=5, tr=0.06, tlen=0.16,
    ring=lambda m: (m.lathe(vglow, [(0.9, -0.02), (0.96, -0.02), (0.96, 0.02), (0.9, 0.02)], n=48, M=TRS(rot=(1.4, 0, 0)), closed=True),
                    m.lathe(vglow, [(1.2, -0.015), (1.24, -0.015), (1.24, 0.015), (1.2, 0.015)], n=48, M=TRS(rot=(1.75, 0, 0)), closed=True))), z=1.5)

# phase lancer: a void knight in angular violet plate, cloak of torn space behind it, a long lance of light
def pl_torso(m):
    m.lathe(vsteel, [(0, 0.1), (0.3, 0.15), (0.38, 0.45), (0.3, 0.68), (0, 0.72)], n=8, M=TRS(scale=(1, 0.75, 1)))  # faceted breastplate
    for sx in (-1, 1):
        m.lathe(vsteel, [(0, 0), (0.2, 0.02), (0.22, 0.12), (0, 0.18)], n=6, M=TRS((sx * 0.38, 0, 0.6), (0, sx * 0.4, 0)))
        crystal(m, vcrys, aim((sx * 0.6, 0.3, 1), (sx * 0.42, 0.02, 0.72)), 0.04, 0.3)
    m.prism(goo, [(-0.32, 0), (0.32, 0), (0.42, -1.1), (0.1, -0.95), (-0.15, -1.2), (-0.4, -1.0)], -0.01, 0.01, M=TRS((0, 0.28, 0.65), (math.pi / 2 - 0.15, 0, 0)))  # the cloak of torn space
rt, body, head = biped('lancer', dict(skin=vsteel, belly=chitin, arm=vsteel, leg=vsteel, shoulder=vsteel, eye=vcyan, mouth=black, claw=chitin2, tooth=chitin2, hunch=0.05, reach=1.05, torso=pl_torso,
    crown_fn=lambda m: (m.lathe(vsteel, [(0, -0.05), (0.2, 0.0), (0.23, 0.2), (0.15, 0.38), (0, 0.48)], n=6, M=TRS((0, -0.02, 0))),
                        m.prism(vcyan, [(-0.12, 0), (0.12, 0), (0.1, 0.025), (-0.1, 0.025)], 0, 0.02, M=TRS((0, -0.22, 0.17), (math.pi / 2, 0, 0))),
                        crystal(m, vcrys, aim((0, 0.5, 1), (0, 0.05, 0.4)), 0.05, 0.4))))
part(rt, 'weapon', [o for o in PARTS['lancer'] if o.name.endswith('_armR')][0], (0.1, -0.32, -0.75), lambda m: (
    m.lathe(vsteel, [(0.035, 0.35), (0.035, -0.3)], n=6),
    m.lathe(vsteel, [(0, -0.3), (0.12, -0.35), (0.08, -0.45), (0, -0.45)], n=8),
    m.lathe(vcyan, [(0.06, 0), (0.04, 0.9), (0, 1.6)], n=6, M=aim((0, -1, 0), (0, -0.5, 0)))))  # the lance of light, pointing ahead
bake_scale(rt, 1.15)

# star weaver: a slowly turning knot of violet crystal round a white star, three great star-blades circling it
def ow_body(m):
    m.ico(vcyan, 0.2, sub=2)
    for d in ((0, 0, 1), (0, 0, -1), (1, 0, 0.2), (-1, 0, 0.2), (0, 1, 0.2), (0, -1, 0.2), (.7, .7, -.6), (-.7, -.7, -.6), (.7, -.7, .6), (-.7, .7, .6)):
        crystal(m, vcrys, aim(d, (0, 0, 0)), 0.1, 0.7)
    m.lathe(vglow, [(0.42, -0.02), (0.45, -0.02), (0.45, 0.02), (0.42, 0.02)], n=32, M=TRS(rot=(0.5, 0.3, 0)), closed=True)
def ow_ring(m):  # the blades, out at the radius they cut (3.2 m in the game)
    for k in range(3):
        a = TAU * k / 3
        c = (3.2 * math.cos(a), 3.2 * math.sin(a), 0)
        for j in range(4):  # a four-pointed star blade
            b = a + j * math.pi / 2
            crystal(m, vcyan if j % 2 else vcrys, aim((math.cos(b), math.sin(b), 0), c), 0.08, 0.55)
        m.ico(vcyan, 0.09, Matrix.Translation(c), sub=1)
    m.annulus(vglow, 3.15, 3.2, 0, 96)
rt, body = floater('orbiter', dict(body=ow_body, ring=ow_ring, tent=vcrys, tip=vcyan, tents=3, tr=0.04, tlen=0.14), z=1.8)

# gazer: a floating eye wreathed in smaller eyes and feelers
def gz_body(m):
    eyeball(m, (0, 0, 0), 0.45)
    m.lathe(chitin, [(0.47, -0.15), (0.49, 0.05), (0.42, 0.28), (0.25, 0.42), (0, 0.47)], n=24, M=TRS(rot=(-1.05, 0, 0)), smooth=True)
    m.lathe(chitin, [(0, -0.47), (0.25, -0.42), (0.42, -0.28), (0.48, -0.08), (0.47, 0.0)], n=24, M=TRS(rot=(1.15, 0, 0)), smooth=True)
    for a in (0.6, 1.4, 2.2, 3.4, 4.4, 5.3):
        eyeball(m, (0.5 * math.cos(a), 0.2, 0.5 * math.sin(a)), 0.08, (math.cos(a) * .5, -1, math.sin(a) * .5))
rt, body = floater('gazer', dict(body=gz_body, tent=vflesh, tip=vglow, tents=6,
    ring=lambda m: (m.lathe(vglow, [(0.62, -0.025), (0.7, -0.025), (0.7, 0.025), (0.62, 0.025)], n=48, M=TRS(rot=(0.35, 0, 0)), closed=True),
                    [crystal(m, chitin2, TRS(rot=(0.35, 0, 0)) @ Matrix.Translation((*pol(0.66, TAU * k / 6), -0.08)), 0.06, 0.22) for k in range(6)])))
def ho_arm(m, sx):  # each arm is a tentacle
    pts, rad = [], []
    for k in range(10):
        t = k / 9
        pts.append((sx * (0.1 + 0.25 * math.sin(t * 3)), -0.2 * t - 0.15 * math.sin(t * 5), -1.5 * t))
        rad.append(0.3 * (1 - t) + 0.05)
    m.tube(vflesh, pts, rad, n=9)
    for k in range(2, 9):
        p = Vector(pts[k]) + Vector((0, -rad[k] * 0.9, 0))
        m.sphere(vglow, rad[k] * 0.3, TRS(tuple(p)), u=6, v=4)
def ho_leg(m, sx):
    m.tube(vflesh, [(0, 0, 0), (sx * 0.1, -0.05, -0.45), (sx * 0.15, 0, -0.85)], [0.3, 0.25, 0.2], n=8)
    for k in range(3):
        m.tube(vflesh, [(sx * 0.15, 0, -0.8), (sx * 0.15 + math.cos(k * 2.1) * 0.4, math.sin(k * 2.1) * 0.4, -0.9)], [0.1, 0.02], n=5)
# mind flayer: a robed thing with a squid's head
rt, body = caster('mindflayer', dict(robe=vrobe, trim=vglow, hand=vflesh, glow=vglow,
    head=lambda m: (ell(m, vflesh, (0, 0, 0.2), (0.16, 0.17, 0.22), u=16, v=10), [ell(m, vcyan, (sx * 0.06, -0.14, 0.24), (0.03, 0.015, 0.02), u=6, v=4) for sx in (-1, 1)],
                    [m.tube(vflesh, [(x, -0.12, 0.1), (x * 1.3, -0.2, -0.1), (x * 1.1, -0.18, -0.35), (x * 0.8, -0.1, -0.5)], [0.035, 0.03, 0.02, 0.005], n=5) for x in (-0.09, -0.03, 0.03, 0.09)],
                    m.lathe(vrobe, [(0.2, 0.25), (0.24, 0.0), (0.22, -0.1)], n=16, smooth=True)),
    staff=staff(chitin, lambda m: (m.ico(vglow, 0.09, Matrix.Translation((0.03, 0, 0.85)), sub=2), [m.tube(chitin2, [(0.03, 0, 0.75), (0.03 + math.cos(a) * 0.15, math.sin(a) * 0.15, 0.85), (0.03 + math.cos(a) * 0.08, math.sin(a) * 0.08, 1.0)], 0.015, n=4) for a in (0, 2.1, 4.2)]))))
# the Watcher Beyond: a vast eye in a crown of spines, trailing tentacles
def wa_body(m):
    eyeball(m, (0, 0, 0), 0.9)
    m.lathe(chitin, [(0.93, -0.3), (0.98, 0.1), (0.84, 0.56), (0.5, 0.84), (0, 0.94)], n=28, M=TRS(rot=(-1.0, 0, 0)), smooth=True)
    m.lathe(chitin, [(0, -0.94), (0.5, -0.84), (0.84, -0.56), (0.96, -0.16), (0.94, 0.0)], n=28, M=TRS(rot=(1.1, 0, 0)), smooth=True)
    for k in range(12):
        a = TAU * k / 12
        horn(m, chitin2, (0.9 * math.cos(a), 0.3, 0.9 * math.sin(a)), (math.cos(a), 0.6, math.sin(a)), 0.9 if k % 2 else 0.6, 0.08, curl=(0, 0.6, 0))
rt, body = floater('watcher', dict(body=wa_body, tent=vflesh, tip=vglow, tents=6, tr=0.13, tlen=0.3, tspread=2.4, tdrop=2.2,
    ring=lambda m: (m.lathe(vglow, [(1.25, -0.04), (1.38, -0.04), (1.38, 0.04), (1.25, 0.04)], n=64, M=TRS(rot=(0.35, 0, 0)), closed=True),
                    [crystal(m, vcrys, TRS(rot=(0.35, 0, 0)) @ Matrix.Translation((*pol(1.32, TAU * k / 9), -0.12)), 0.09, 0.4) for k in range(9)])), z=3.2)
# the Devourer of Stars: a colossal maw on legs, tentacles for arms, a crown of spines
rt, body, head = golem('devourer', dict(
    body=lambda m: (m.ico(vflesh, 1, TRS((0, 0, 0.8), (0.1, 0, 0), (0.95, 0.85, 0.9)), sub=2, noise=0.05), ell(m, black, (0, -0.72, 0.75), (0.6, 0.12, 0.5)),
                    teeth(m, eyew, (0, -0.8, 1.15), 1.0, 11, 0.22), teeth(m, eyew, (0, -0.8, 0.35), 1.0, 11, 0.22, down=False),
                    m.sphere(vglow, 0.18, TRS((0, -0.7, 0.75)), u=10, v=8),
                    [eyeball(m, (math.cos(a) * 0.9, math.sin(a) * 0.75, z), 0.12, (math.cos(a), math.sin(a), 0)) for a, z in ((3.6, 1.3), (5.8, 1.3), (4.0, 1.5), (5.4, 1.5), (4.7, 1.62))],
                    spikes_on(m, chitin, (0, 0.2, 1.3), (0.8, 0.6, 0.4), 14, 0.6, 0.1, seed=77)),
    head=lambda m: ([horn(m, chitin2, (math.cos(a) * 0.3, math.sin(a) * 0.2, 0), (math.cos(a) * 0.5, math.sin(a) * 0.3, 1), 0.7, 0.08, curl=(0, 0.4, 0)) for a in [k * 0.9 for k in range(7)]],
                    m.ico(chitin, 0.25, sub=1)),
    arm=ho_arm, leg=ho_leg))
bake_scale(rt, 1.75)

# ======================================================================== 1: the Shadow Realm's second boss
shade = mat('sh_shade', (0.05, 0.03, 0.08), rough=0.7)
shade_g = mat('sh_glow', (0.65, 0.3, 1.0), emit=6)
shade_m = mat('sh_mask', (0.75, 0.72, 0.65), rough=0.45)
shade_r = mat('sh_robe', (0.08, 0.05, 0.12), rough=0.9, emit=0.3, ecolor=(0.4, 0.15, 0.7))
# Nyx, the Umbral Wraith: a tall hooded shadow with a horned skull mask and long talons
def ny_body(m):
    m.lathe(shade_r, [(0, -1.4), (0.55, -1.0), (0.45, -0.3), (0.35, 0.3), (0.42, 0.6), (0.2, 0.75), (0, 0.8)], n=18, smooth=True, jag=0.25)
    m.lathe(shade, [(0, 0.7), (0.28, 0.78), (0.3, 1.05), (0.2, 1.25), (0, 1.32)], n=16, smooth=True)  # hood
    ell(m, black, (0, -0.16, 0.98), (0.2, 0.1, 0.2))
    ell(m, shade_m, (0, -0.22, 0.97), (0.14, 0.05, 0.17), u=14, v=10)
    for sx in (-1, 1):
        ell(m, shade_g, (sx * 0.05, -0.27, 1.0), (0.025, 0.01, 0.018), u=6, v=4)
        horn(m, shade_m, (sx * 0.12, -0.15, 1.1), (sx * 0.6, 0.3, 0.8), 0.45, 0.04, curl=(sx * -0.3, 0.6, -0.2))
    for k in range(5):
        a = TAU * k / 5
        m.tube(shade_g, [(*pol(0.3, a), 0.3), (*pol(0.35, a + 0.2), -0.5), (*pol(0.25, a + 0.4), -1.3)], 0.01, n=3)
rt, body = floater('umbra', dict(body=ny_body, tent=shade_r, tents=6, tr=0.09, tlen=0.2, tspread=1.6, tdrop=3.6,
    ring=lambda m: (m.annulus(shade_g, 0.75, 0.78, -0.2, 64), runes(m, shade_g, 0.9, 0.16, 10, 0.015, -0.2, random.Random(3)))), z=1.6)
for sx, nm in ((-1, 'armL'), (1, 'armR')):  # long arms ending in talons
    part(rt, nm, body, (sx * 0.38, -0.05, 0.55), lambda m, sx=sx: (
        m.tube(shade_r, [(0, 0, 0), (sx * 0.2, -0.15, -0.45), (sx * 0.15, -0.4, -0.9)], [0.1, 0.08, 0.06], n=8),
        claws(m, shade_m, Vector((sx * 0.15, -0.45, -0.95)), (0, -0.6, -1), n=4, L=0.35, r=0.03)))
bake_scale(rt, 1.6)

# a proper body for the Shadow Realm's Stalker too (it borrowed the grunt's): lean, long-limbed, shadow-black
sk = mat('sk_skin', (0.03, 0.02, 0.05), rough=0.4)
rt, body, head = biped('stalker', dict(skin=sk, belly=shade, eye=shade_g, mouth=shade_g, claw=shade_m, tooth=shade_m, hunch=0.5, reach=1.35,
    torso=lambda m: spikes_on(m, sk, (0, 0.15, 0.5), (0.25, 0.25, 0.3), 5, 0.3, 0.035, seed=88),
    crown_fn=lambda m: [horn(m, shade_m, (sx * 0.1, 0.02, 0.28), (sx * 0.2, 0.8, 0.5), 0.45, 0.035, curl=(0, 0.6, -0.4)) for sx in (-1, 1)]))
bake_scale(rt, 1.05)

# ---------- finishing: AO into vertex colours per monster, export, previews ----------
bpy.context.view_layer.update()
for name, parts in PARTS.items():
    bake_ao(parts, parts, rays=10, dist=0.6 if name not in ('bonedragon', 'frostgiant', 'pitlord', 'archdemon', 'devourer', 'watcher', 'lich', 'frostqueen', 'umbra') else 1.4, strength=0.7, tint=(0.9, 1.0))
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(HERE, 'foes.blend'))
export('foes.glb', ROOTS)
pv = Previewer(res=420)
GROUPS = {'crypt': ['crawler', 'bonearcher', 'plaguebearer', 'banshee', 'colossus', 'necromancer', 'lich', 'bonedragon'],
          'frost': ['snowcat', 'ram', 'cryomancer', 'frosttotem', 'icegolem', 'harpy', 'yeti', 'frostgiant', 'frostqueen'],
          'hell': ['cinderimp', 'berserker', 'cannoneer', 'tormentor', 'pyrepriest', 'gorger', 'pitlord', 'archdemon'],
          'void': ['shade', 'maw', 'lancer', 'orbiter', 'gazer', 'mindflayer', 'watcher', 'devourer'], 'shadow': ['umbra', 'stalker']}
pv.scene.render.resolution_x, pv.scene.render.resolution_y = 1400, 420
for g, names in GROUPS.items():
    obs = [o for o in ROOTS if o.name in names]
    for i, o in enumerate(obs):
        o.location = (i * 4.2, 0, 0)
    bpy.context.view_layer.update()
    pv.render('foes_' + g, obs, dirv=(0.25, -1, 0.25), lens=50)
    for i, o in enumerate(obs):
        o.location = (100 + i * 4.2 + len(g) * 40, 0, 0)
print('MAGE_FOES_OK', len(ROOTS), sum(len(p) for p in PARTS.values()))
