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
    part(rt, 'ring', body, (0, 0, 0.6), lambda m: (
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

# zombie: a shambling corpse, ribs showing through the rags, jaw hanging loose
rt, body, head = biped('zombie', dict(skin=rot, belly=rot2, eye=soul, mouth=ink, claw=bone2, tooth=bone2, hunch=0.45, reach=1.15,
    torso=lambda m: ([m.tube(bone, [(sx * 0.05, -0.27, 0.15 + k * 0.09), (sx * 0.24, -0.2, 0.17 + k * 0.09)], [0.015, 0.01], n=4) for sx in (-1, 1) for k in range(3)],
                     m.prism(rag, [(-0.3, 0), (0.3, 0), (0.25, -0.5), (0.05, -0.38), (-0.12, -0.55), (-0.28, -0.42)], -0.01, 0.01, M=TRS((0, -0.3, 0.1), (math.pi / 2 + 0.2, 0, 0))),
                     ell(m, rag, (0, 0.05, 0.05), (0.36, 0.3, 0.14))),
    crown_fn=lambda m: [m.tube(rag, [(sx * 0.12, 0, 0.32), (sx * 0.2, 0.1, 0.1)], 0.02, n=4) for sx in (-1, 1)]))
# bonehound: a hound of bare bone with soul fire in its ribs
def bh_back(m):
    m.ico(soul, 0.12, Matrix.Translation((0, -0.1, 0)), sub=1)
    for k in range(6):
        y = -0.4 + k * 0.15
        for sx in (-1, 1):
            m.tube(bone, [(0, y, 0.17), (sx * 0.18, y, 0.05), (sx * 0.12, y, -0.15)], [0.02, 0.018, 0.012], n=4)
    for k in range(5):
        horn(m, bone2, (0, -0.35 + k * 0.17, 0.17), (0, 0.4, 1), 0.14, 0.03, curl=(0, 0.6, 0))
rt, body, head = beast('bonehound', dict(hide=bone, eye=soul, tooth=bone2, mouth=soul2, back=bh_back,
    head_fn=lambda m: [horn(m, bone2, (sx * 0.08, -0.05, 0.1), (sx * 0.4, 0.6, 0.5), 0.22, 0.03, curl=(0, 0.5, 0)) for sx in (-1, 1)]))
# banshee: a weeping ghost in tatters, hair streaming, mouth open in a scream
def bn_body(m):
    m.lathe(ghost, [(0, -0.9), (0.4, -0.6), (0.34, -0.1), (0.28, 0.25), (0.18, 0.45), (0, 0.5)], n=16, smooth=True, jag=0.15)
    ell(m, ghost, (0, -0.05, 0.7), (0.17, 0.17, 0.2), u=14, v=10)
    for sx in (-1, 1):
        ell(m, ink, (sx * 0.06, -0.16, 0.74), (0.035, 0.02, 0.045), u=8, v=6)
        ell(m, wail, (sx * 0.06, -0.17, 0.74), (0.015, 0.01, 0.02), u=6, v=4)
        m.tube(ghost, [(sx * 0.25, -0.05, 0.35), (sx * 0.5, -0.25, 0.1), (sx * 0.55, -0.45, -0.1)], [0.05, 0.04, 0.02], n=6)
    ell(m, ink, (0, -0.16, 0.6), (0.05, 0.02, 0.07), u=8, v=6)  # the scream
    for k in range(10):  # long hair
        a = TAU * k / 10
        m.tube(robe_n, [(math.cos(a) * 0.12, math.sin(a) * 0.1 + 0.05, 0.82), (math.cos(a) * 0.2, math.sin(a) * 0.15 + 0.25, 0.55), (math.cos(a) * 0.18, math.sin(a) * 0.1 + 0.4, 0.2)], [0.025, 0.02, 0.005], n=4)
rt, body = floater('banshee', dict(body=bn_body, tent=ghost, tr=0.08, tlen=0.13, tents=6, tdrop=2.6, tspread=1.2,
    ring=lambda m: (m.annulus(wail, 0.6, 0.62, 0, 48), runes(m, wail, 0.7, 0.12, 8, 0.012, 0, random.Random(1)))), z=1.05)
# bloater: a swollen corpse fit to burst, boils glowing
def bl_face(m):
    for k in range(9):
        a, z = random.uniform(0, TAU), random.uniform(0.1, 0.6)
        m.sphere(pus, random.uniform(0.04, 0.08), TRS((0.42 * math.cos(a) * 0.95, 0.42 * math.sin(a) * 0.95, z)), u=8, v=6)
    for k in range(4):  # stitches
        m.tube(ink, [(-0.12, -0.41, 0.12 + k * 0.08), (0.12, -0.41, 0.12 + k * 0.08)], 0.008, n=4)
    m.tube(ink, [(0, -0.42, 0.08), (0, -0.4, 0.42)], 0.01, n=4)
    eyes(m, soul, (0, -0.37, 0.6), 0.1, (0.05, 0.03, 0.04))
    ell(m, ink, (0, -0.39, 0.48), (0.1, 0.03, 0.04))
rt, body = keg('bloater', dict(body=rot, limb=rot2, face=bl_face,
    fuse=lambda m: (m.sphere(pus, 0.12, TRS((0, 0, 0.05)), u=10, v=8), m.sphere(pus, 0.07, TRS((0.1, 0.05, -0.02)), u=8, v=6))))
bake_scale(rt, 1.15)
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

# snowfiend: a shaggy white imp with icicle horns
rt, body, head = biped('snowfiend', dict(skin=fur, belly=fur2, eye=iceg, mouth=iceg, claw=ice, tooth=ice, arm=fur, hunch=0.35,
    torso=lambda m: spikes_on(m, ice, (0, 0.1, 0.45), (0.3, 0.28, 0.3), 6, 0.3, 0.05, seed=4),
    crown_fn=lambda m: [crystal(m, ice, aim((sx * 0.5, 0.3, 1), (sx * 0.12, -0.05, 0.3)), 0.05, 0.4) for sx in (-1, 1)]))
# icewolf: a pale wolf with a crest of ice shards
rt, body, head = beast('icewolf', dict(hide=fur, leg=fur2, eye=iceg, tooth=ice, mouth=iceg,
    back=lambda m: [crystal(m, ice, aim((0, 0.5, 1), (0, -0.35 + k * 0.15, 0.16)), 0.05, 0.28 - abs(k - 2.5) * 0.03) for k in range(6)],
    head_fn=lambda m: [ell(m, fur, (sx * 0.08, 0.02, 0.15), (0.03, 0.04, 0.09)) for sx in (-1, 1)],
    tail_fn=lambda m: crystal(m, ice, aim((0, 1, -0.2), (0, 0.72, -0.08)), 0.03, 0.2)))
bake_scale(rt, 1.1)
# icesprite: a hovering knot of ice crystals with a glowing heart
rt, body = floater('icesprite', dict(
    body=lambda m: (m.ico(iceg, 0.16, sub=2), [crystal(m, ice, aim(d, (0, 0, 0)), 0.09, 0.6) for d in ((0, 0, 1), (0, 0, -1), (1, 0, .3), (-1, 0, .3), (0, 1, .3), (0, -1, .3), (.7, .7, -.5), (-.7, -.7, -.5))]),
    ring=lambda m: [crystal(m, ice, TRS((*pol(0.62, TAU * k / 6), 0), (math.pi / 2, 0, TAU * k / 6)), 0.05, 0.25) for k in range(6)],
    tent=ice, tr=0.04, tlen=0.1, tents=4, tip=iceg))
# frostmite: a living snowball, coal eyes, a crystal fuse
rt, body = keg('frostmite', dict(body=snowm, limb=fur2, noise=0.02,
    face=lambda m: (eyes(m, coal, (0, -0.39, 0.42), 0.1, (0.05, 0.03, 0.05)), [m.sphere(coal, 0.025, TRS((x, -0.41, 0.27 + abs(x) * 0.3)), u=6, v=4) for x in (-0.12, -0.06, 0, 0.06, 0.12)],
                    spikes_on(m, ice, (0, 0, 0.32), (0.42, 0.42, 0.42), 7, 0.3, 0.05, up=0.2, seed=7)),
    fuse=lambda m: (crystal(m, iceg, TRS(), 0.07, 0.3), crystal(m, ice, TRS(rot=(0.4, 0, 0)), 0.05, 0.22))))
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
# glacier knight: armour of ice, a crystal shield, a blade of frozen light
rt, body = knight('glacier', dict(plate=ice, trim=silver, cloth=gown,
    pauldron=lambda m, sx: [crystal(m, ice, aim((sx * 0.5, 0, 1), (sx * (0.32 + k * 0.07), 0, 0.68)), 0.05, 0.3 - k * 0.06) for k in range(3)],
    helm=lambda m: (m.lathe(ice, [(0, -0.02), (0.16, 0.0), (0.17, 0.22), (0.14, 0.32), (0, 0.36)], n=16), m.prism(iceg, [(-0.11, 0), (0.11, 0), (0.11, 0.022), (-0.11, 0.022)], 0, 0.02, M=TRS((0, -0.16, 0.18), (math.pi / 2, 0, 0))),
                    [crystal(m, ice, aim((sx * 0.3, 0.2, 1), (sx * 0.08, 0, 0.3)), 0.04, 0.35) for sx in (-1, 0, 1)]),
    shield=lambda m: (m.prism(ice, [(-0.34, 0.5), (0.34, 0.5), (0.34, -0.3), (0, -0.62), (-0.34, -0.3)], -0.05, 0.05, M=TRS(rot=(math.pi / 2, 0, 0))),
                      m.prism(silver, [(-0.36, 0.52), (0.36, 0.52), (0.36, 0.46), (-0.36, 0.46)], -0.06, 0.06, M=TRS(rot=(math.pi / 2, 0, 0))),
                      [m.stroke(iceg, pol(0.0, 0), pol(0.28, TAU * k / 6), 0.03, -0.06, M=TRS(rot=(math.pi / 2, 0, 0))) for k in range(6)]),
    weapon=lambda m: (m.lathe(leather, [(0.028, -0.16), (0.028, 0.12)], n=6), m.prism(silver, [(-0.18, -0.02), (0.18, -0.02), (0.18, 0.02), (-0.18, 0.02)], 0.12, 0.16),
                      m.lathe(ice, [(0, 0.14), (0.07, 0.16), (0.06, 1.15), (0, 1.35)], n=4, M=TRS(scale=(1, 0.25, 1))), m.lathe(iceg, [(0, 0.2), (0.014, 0.22), (0.012, 1.05), (0, 1.18)], n=4, M=TRS((0, -0.016, 0), scale=(1, 0.5, 1))))))
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

# hellhound: black hide split with lava, a mane of fire
rt, body, head = beast('hellhound', dict(hide=char, eye=ember, tooth=horn_m, mouth=lava,
    back=lambda m: ([crystal(m, ember if k % 2 else lava, aim((0, 0.6, 1), (0, -0.45 + k * 0.1, 0.16)), 0.05, 0.35 - k * 0.025) for k in range(8)],
                    [m.tube(lava, [(sx * 0.2, -0.3 + k * 0.2, 0), (sx * 0.22, -0.2 + k * 0.2, -0.08)], 0.015, n=4) for sx in (-1, 1) for k in range(4)]),
    head_fn=lambda m: [horn(m, horn_m, (sx * 0.08, -0.05, 0.1), (sx * 0.3, 0.6, 0.6), 0.2, 0.03, curl=(0, 0.8, 0)) for sx in (-1, 1)],
    tail_fn=lambda m: crystal(m, ember, aim((0, 1, 0.3), (0, 0.72, -0.08)), 0.05, 0.3)))
bake_scale(rt, 1.05)
# cinder imp: a little red devil with bat wings, horns and a spade tail
rt, body, head = biped('cinderimp', dict(skin=hide, belly=hide2, eye=ember, mouth=lava, claw=horn_m, tooth=horn_m, hunch=0.3, tail=True, wings=membrane,
    crown_fn=lambda m: [horn(m, horn_m, (sx * 0.13, -0.08, 0.28), (sx * 0.5, 0.3, 0.8), 0.32, 0.05, curl=(sx * 0.2, 0.8, -0.3)) for sx in (-1, 1)]))
bake_scale(rt, 0.88)
# magmaling: a waddling lump of molten rock with a flame for a fuse
rt, body = keg('magmaling', dict(body=obsid, limb=char, noise=0.05,
    face=lambda m: ([m.tube(lava, [(0.42 * math.cos(a), 0.42 * math.sin(a), 0.1), (0.4 * math.cos(a + .3), 0.4 * math.sin(a + .3), 0.35), (0.35 * math.cos(a), 0.35 * math.sin(a), 0.62)], 0.025, n=4) for a in [k * 1.1 for k in range(6)]],
                    eyes(m, ember, (0, -0.39, 0.42), 0.1, (0.05, 0.03, 0.045)), ell(m, lava, (0, -0.39, 0.25), (0.12, 0.03, 0.05))),
    fuse=lambda m: (m.lathe(lava, [(0, 0), (0.12, 0.08), (0.08, 0.25), (0, 0.42)], n=7, twist=0.5), m.ico(ember, 0.08, Matrix.Translation((0, 0, 0.05)), sub=1))))
# infernal: a golem of cooling magma, molten heart showing through its plates
def in_body(m):
    m.ico(lava, 0.85, TRS((0, 0, 0.75), (0.2, 0, 0), (0.8, 0.6, 0.7)), sub=2)
    for _ in range(18):
        d = Vector((random.uniform(-1, 1), random.uniform(-1, 1), random.uniform(-0.5, 1))).normalized()
        q = d.to_track_quat('Z', 'Y').to_matrix().to_4x4()
        s_ = random.uniform(0.35, 0.5)
        m.ico(obsid, 1, Matrix.Translation(Vector((0, 0, 0.75)) + Vector((d.x * 0.85, d.y * 0.62, d.z * 0.72))) @ q @ Matrix.Diagonal((s_, s_ * 0.8, s_ * 0.4, 1)), sub=1, noise=0.03)
    spikes_on(m, obsid, (0, 0.2, 1.2), (0.6, 0.4, 0.3), 6, 0.45, 0.08, seed=33)
def in_head(m):
    m.ico(obsid, 0.32, TRS((0, -0.05, 0.12)), sub=1, noise=0.04)
    eyes(m, ember, (0, -0.33, 0.14), 0.11, (0.05, 0.03, 0.035))
    ell(m, lava, (0, -0.32, 0.0), (0.12, 0.03, 0.04))
    for sx in (-1, 1):
        horn(m, obsid, (sx * 0.2, -0.05, 0.25), (sx * 0.6, 0.3, 0.7), 0.5, 0.07, curl=(0, 0.8, -0.5))
def in_arm(m, sx):
    m.ico(obsid, 0.4, TRS((0, 0, 0)), sub=1, noise=0.06)
    m.ico(lava, 0.26, TRS((sx * 0.12, -0.05, -0.55), scale=(1, 1, 1.5)), sub=1)
    for k in range(5):
        d = Vector((random.uniform(-1, 1), random.uniform(-1, 1), random.uniform(-1, 1))).normalized()
        m.ico(obsid, 0.2, TRS(tuple(Vector((sx * 0.12, -0.05, -0.55)) + d * 0.25), scale=(1, 1, 0.5)), sub=1)
    m.ico(obsid, 0.42, TRS((sx * 0.15, -0.15, -1.15), scale=(1, 1.05, 0.9)), sub=1, noise=0.07)
    for k in range(3):
        crystal(m, lava, aim((sx * 0.5, -0.3, -1), (sx * 0.15 + (k - 1) * 0.12, -0.35, -1.25)), 0.05, 0.22)
def in_leg(m, sx):
    m.ico(obsid, 0.32, TRS((0, 0, -0.3), scale=(1, 1, 1.4)), sub=1, noise=0.04)
    m.ico(lava, 0.18, TRS((0, -0.2, -0.45)), sub=1)
    m.ico(obsid, 0.36, TRS((0, -0.08, -0.78), scale=(1.1, 1.3, 0.6)), sub=1, noise=0.05)
rt, body, head = golem('infernal', dict(body=in_body, head=in_head, arm=in_arm, leg=in_leg))
# hell knight: spiked black plate, a burning sword, a shield with a demon's face
rt, body = knight('hellknight', dict(plate=blackst, trim=brass, cloth=redrobe,
    pauldron=lambda m, sx: [horn(m, blackst, (sx * (0.32 + k * 0.06), 0.02, 0.7), (sx * 0.3, 0, 1), 0.2 - k * 0.04, 0.035) for k in range(3)],
    helm=lambda m: (m.lathe(blackst, [(0, -0.02), (0.16, 0.0), (0.17, 0.22), (0.15, 0.32), (0, 0.36)], n=16), m.prism(ember, [(-0.11, 0), (0.11, 0), (0.11, 0.022), (-0.11, 0.022)], 0, 0.02, M=TRS((0, -0.16, 0.18), (math.pi / 2, 0, 0))),
                    [horn(m, horn_m, (sx * 0.14, -0.02, 0.24), (sx * 0.8, 0, 0.6), 0.35, 0.05, curl=(sx * -0.2, 0, 0.9)) for sx in (-1, 1)]),
    shield=lambda m: (m.prism(blackst, [(-0.34, 0.55), (0.34, 0.55), (0.34, -0.45), (0, -0.62), (-0.34, -0.45)], -0.045, 0.045, M=TRS(rot=(math.pi / 2, 0, 0))),
                      m.prism(brass, [(-0.36, 0.57), (0.36, 0.57), (0.36, 0.5), (-0.36, 0.5)], -0.055, 0.055, M=TRS(rot=(math.pi / 2, 0, 0))),
                      ell(m, horn_m, (0, -0.07, 0.05), (0.14, 0.05, 0.16), u=12, v=8), [ell(m, ember, (sx * 0.05, -0.12, 0.08), (0.025, 0.01, 0.015), u=6, v=4) for sx in (-1, 1)],
                      [horn(m, horn_m, (sx * 0.09, -0.08, 0.15), (sx * 0.5, -0.3, 1), 0.2, 0.03, curl=(sx * 0.3, 0, -0.5)) for sx in (-1, 1)]),
    weapon=lambda m: (m.lathe(leather, [(0.028, -0.16), (0.028, 0.12)], n=6), m.prism(brass, [(-0.18, -0.02), (0.18, -0.02), (0.18, 0.02), (-0.18, 0.02)], 0.12, 0.16),
                      m.lathe(blackst, [(0, 0.14), (0.075, 0.16), (0.065, 1.15), (0, 1.35)], n=4, M=TRS(scale=(1, 0.25, 1))), m.lathe(lava, [(0, 0.2), (0.016, 0.22), (0.013, 1.05), (0, 1.18)], n=4, M=TRS((0, -0.017, 0), scale=(1, 0.5, 1))))))
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


# voidling: a skittering chitin crawler with a cluster of glowing eyes
rt, body, head = beast('voidling', dict(hide=chitin, leg=chitin2, eye=vglow, tooth=chitin2, mouth=vglow,
    back=lambda m: ([crystal(m, chitin2, aim((0, 0.3, 1), (0, -0.4 + k * 0.2, 0.15)), 0.06, 0.18) for k in range(5)], [m.tube(vglow, [(sx * 0.2, -0.3, 0.02), (sx * 0.2, 0.3, 0.02)], 0.01, n=4) for sx in (-1, 1)]),
    head_fn=lambda m: [ell(m, vglow, (x, -0.28, 0.08 + abs(x) * 0.4), (0.02, 0.015, 0.02), u=6, v=4) for x in (-0.06, -0.02, 0.02, 0.06)]))
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
# riftmite: a crystal shell around a tiny rift that wants out
rt, body = keg('riftmite', dict(body=chitin, limb=chitin2,
    face=lambda m: (m.sphere(vglow, 0.3, TRS((0, -0.18, 0.32)), u=14, v=10), m.sphere(black, 0.2, TRS((0, -0.3, 0.32), scale=(1, .3, 1)), u=12, v=8),
                    spikes_on(m, vcrys, (0, 0, 0.32), (0.42, 0.42, 0.42), 8, 0.32, 0.06, up=0.2, seed=55)),
    fuse=lambda m: (crystal(m, vcyan, TRS(), 0.07, 0.35), crystal(m, vcrys, TRS(rot=(0.5, 0, 0)), 0.05, 0.25))))
# voidspawn: a heaving lump of violet goo full of eyes
rt = root('voidspawn')
part(rt, 'body', rt, (0, 0, 0), lambda m: (
    m.sphere(goo, 0.62, TRS((0, 0, 0.44), scale=(1, 1, 0.74)), u=28, v=18, noise=0.03),
    m.sphere(vglow, 0.16, TRS((0, 0.05, 0.42)), u=14, v=10),
    [eyeball(m, (0.5 * math.cos(a), 0.5 * math.sin(a) - 0.05, z), r, (math.cos(a), math.sin(a), 0.2)) for a, z, r in ((4.4, 0.6, 0.11), (5.0, 0.4, 0.08), (3.9, 0.45, 0.07), (4.7, 0.75, 0.06), (5.4, 0.62, 0.07))],
    [m.sphere(goo, random.uniform(0.06, 0.12), TRS((*pol(0.5, random.uniform(0, TAU)), random.uniform(0.1, 0.55))), u=10, v=6) for _ in range(6)]))
# horror: a bloated tentacled thing, all mouths and eyes
def ho_body(m):
    m.ico(vflesh, 1, TRS((0, 0, 0.75), (0.2, 0, 0), (0.85, 0.7, 0.8)), sub=2, noise=0.05)
    for k in range(8):
        a, z = random.uniform(3.3, 6.1), random.uniform(0.4, 1.2)
        eyeball(m, (0.8 * math.cos(a) * 0.95, 0.65 * math.sin(a) * 0.95, z), random.uniform(0.07, 0.14), (math.cos(a), math.sin(a), 0))
    spikes_on(m, chitin, (0, 0.2, 1.1), (0.7, 0.5, 0.4), 9, 0.4, 0.08, seed=66)
    ell(m, black, (0, -0.62, 0.55), (0.3, 0.08, 0.16))
    teeth(m, eyew, (0, -0.66, 0.68), 0.5, 8, 0.1)
    teeth(m, eyew, (0, -0.66, 0.42), 0.5, 8, 0.1, down=False)
def ho_head(m):
    m.ico(chitin, 0.3, TRS((0, -0.05, 0.12)), sub=1, noise=0.04)
    eyeball(m, (0, -0.25, 0.14), 0.14)
    for sx in (-1, 1):
        horn(m, chitin2, (sx * 0.18, -0.05, 0.25), (sx * 0.6, 0.3, 0.7), 0.5, 0.07, curl=(0, 0.8, -0.5))
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
rt, body, head = golem('horror', dict(body=ho_body, head=ho_head, arm=ho_arm, leg=ho_leg))
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
GROUPS = {'crypt': ['zombie', 'bonehound', 'banshee', 'bloater', 'colossus', 'necromancer', 'lich', 'bonedragon'],
          'frost': ['snowfiend', 'icewolf', 'icesprite', 'frostmite', 'yeti', 'glacier', 'frostgiant', 'frostqueen'],
          'hell': ['hellhound', 'cinderimp', 'magmaling', 'infernal', 'hellknight', 'pyrepriest', 'pitlord', 'archdemon'],
          'void': ['voidling', 'gazer', 'riftmite', 'voidspawn', 'horror', 'mindflayer', 'watcher', 'devourer'], 'shadow': ['umbra', 'stalker']}
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
