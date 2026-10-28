# The Arena's four other islands (the Shadow Realm is the original arena in build_assets.py) and the bridges between them.
# Each island is an empty root "isle_<id>" whose children are the pieces the game flies into place when the island is built:
#   <id>_under_<k>  underside rock          <id>_core         the central plaza
#   <id>_sector_<k> a wedge of floor, rim and props (12 of them)
#   <id>_pillar_<k>_r<NN>  an obstacle (collision radius NN/10 m, origin at its foot)
#   <id>_brazier_<k> / <id>_flame_<k>  a brazier and its flame (the game gives the flame its fire shader and a light)
#   <id>_float_<k>  rocks floating round the island
# plus bridge_<id>: one 2.2 m deck segment in each island's style, laid end to end by the game.
# Run: blender --background --factory-startup --python blender/build_islands.py
# Islands sit in a ring (shared with js/areas.js ISLES): game (x, z) = Blender (x, -y). Feet on z = 0.
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from lib import *

scene = reset()
R = 22.6                   # rim radius (the game's walkable radius is 21.4)
IDS = ['shadow', 'crypt', 'frost', 'hell', 'void']
RC, CZ = 64.0, 64.0        # ring radius and centre (game z)


def center(k):
    th = math.pi + k * TAU / 5
    return (RC * math.sin(th), CZ + RC * math.cos(th))


def lane_angle(k, j):
    """Blender angle (about +Z) from island k toward island j: where the bridge lands."""
    a, b = center(k), center(j)
    return math.atan2(-(b[1] - a[1]), b[0] - a[0])


def wedge(r0, r1, a0, a1, n=8):
    return [pol(r0, a0 + (a1 - a0) * t / n) for t in range(n + 1)] + [pol(r1, a1 - (a1 - a0) * t / n) for t in range(n + 1)]


def circle(r, n=32, c=(0, 0)):
    return [(c[0] + r * math.cos(TAU * i / n), c[1] + r * math.sin(TAU * i / n)) for i in range(n)]


def rot2(pts, a, c=(0, 0)):
    ca, sa = math.cos(a), math.sin(a)
    return [(c[0] + x * ca - y * sa, c[1] + x * sa + y * ca) for x, y in pts]


class Isle:
    def __init__(s, k):
        s.k, s.id = k, IDS[k]
        random.seed(100 + k)
        s.rng = random.Random(200 + k)
        s.col = coll(s.id)
        s.root = bpy.data.objects.new('isle_' + s.id, None)
        s.col.objects.link(s.root)
        s.lanes = [lane_angle(k, (k + 1) % 5), lane_angle(k, (k - 1) % 5)]
        s.sec = [Mesh(f'{s.id}_sector_{i}', s.col, parent=s.root) for i in range(12)]
        s.core = Mesh(f'{s.id}_core', s.col, parent=s.root)
        s.under = [Mesh(f'{s.id}_under_{i}', s.col, parent=s.root) for i in range(6)]
        s.pillars, s.extra = [], []

    def S(s, x, y):  # the sector mesh a point belongs to
        return s.sec[int((math.atan2(y, x) % TAU) / TAU * 12) % 12]

    def U(s, x, y):
        return s.under[int((math.atan2(y, x) % TAU) / TAU * 6) % 6]

    def in_lane(s, x, y, pad=0.0):
        for a in s.lanes:
            along, lat = x * math.cos(a) + y * math.sin(a), abs(-x * math.sin(a) + y * math.cos(a))
            if along > 4 and lat < 2.9 + pad:
                return True
        return False

    def gap(s, ang, pad=0.17):
        return any(abs((ang - a + math.pi) % TAU - math.pi) < pad for a in s.lanes)

    def free(s, x, y, r):
        if s.in_lane(x, y, r) or math.hypot(x, y) < 6.6 + r or math.hypot(x, y) > R - 0.8 - r:
            return False
        return all(math.hypot(x - px, y - py) > pr + r + 0.5 for px, py, pr in s.pillars)

    def spot(s, r, rmin=7.0, rmax=21.0):
        for _ in range(60):
            x, y = pol(random.uniform(rmin, rmax), random.uniform(0, TAU))
            if s.free(x, y, r):
                return x, y
        return None

    def piece(s, name, loc=(0, 0, 0), rot=(0, 0, 0)):
        m = Mesh(f'{s.id}_{name}', s.col, loc=loc, rot=rot, parent=s.root)
        s.extra.append(m)
        return m

    def obstacle(s, i, x, y, r, rot=0.0):
        s.pillars.append((x, y, r))
        return s.piece(f'pillar_{i}_r{round(r * 10)}', (x, y, 0), (0, 0, rot))

    def obstacle_spots(s, n=8, rho=16.5):
        out = []
        for i in range(n):
            a = TAU * i / n + TAU / (2 * n)
            x, y = pol(rho, a)
            if not s.in_lane(x, y, 1.5):
                out.append((x, y, a))
        return out

    def base(s, top, rimm, rock):
        """The slab every island stands on: floor wedges, a rim curb, and the rock underneath."""
        for i in range(12):
            a0, a1 = TAU * i / 12, TAU * (i + 1) / 12
            s.sec[i].prism(top, wedge(6.0, R, a0, a1), -0.55, 0.0)
            s.sec[i].prism(rimm, wedge(R - 0.05, R + 0.35, a0, a1), -0.6, -0.15)
        s.core.prism(top, circle(6.1, 40), -0.55, 0.0)
        # underside: a cone of overlapping broken rock, heavier near the middle
        for _ in range(36):
            rho, a = math.sqrt(random.random()) * (R - 2.5), random.uniform(0, TAU)
            x, y = pol(rho, a)
            hz = (2 + (R - rho) * 0.55) * random.uniform(.42, .55)
            m = s.U(x, y)
            m.ico(rock, 1, TRS((x, y, -0.45 - hz), (random.uniform(-.15, .15), random.uniform(-.15, .15), random.uniform(0, TAU)),
                               (random.uniform(2.2, 4.2), random.uniform(2.2, 4.2), hz)), sub=1, noise=0.18)  # top stays under the slab
        for i in range(6):
            a = TAU * (i + .5) / 6
            s.under[i].lathe(rock, [(0, 0.6), (random.uniform(1.5, 2.5), 0), (0, -random.uniform(4, 8))], n=7,
                             M=Matrix.Translation((*pol(random.uniform(8, 14), a), -6 - random.uniform(0, 3))), noise=0.3)

    def floaters(s, n, build):
        for i in range(n):
            for _ in range(30):
                rho, a = random.uniform(28, 40), random.uniform(0, TAU)
                x, y = pol(rho, a)
                if not s.in_lane(x, y, 4):
                    break
            m = s.piece(f'float_{i}', (x, y, random.uniform(-5, 7)), (0, 0, random.uniform(0, TAU)))
            build(m, random.uniform(1, 2.6))

    def finish(s, bevel=(), ao=True):
        obs = []
        for m in s.sec + [s.core] + s.under + s.extra:
            if len(m.bm.verts):
                obs.append(m.done())
            else:
                m.bm.free()
        bpy.context.view_layer.update()
        for ob in obs:
            if any(ob.name.startswith(f'{s.id}_{b}') for b in bevel):
                apply_bevel(ob, 0.03, segs=1, angle=40)
        bpy.context.view_layer.update()
        if ao:
            stat = [o for o in obs if '_flame_' not in o.name and '_float_' not in o.name]
            bake_ao(stat, stat, rays=8, dist=2.5, strength=0.7, tint=(0.82, 1.0))
            bake_ao([o for o in obs if '_float_' in o.name], [o for o in obs if '_float_' in o.name], rays=6, dist=2, strength=0.6)
        return s.root


def flame(m, mt, h=1.0, r=0.36):
    m.lathe(mt, [(0, 0), (r, 0.12 * h), (r * .85, 0.45 * h), (r * .45, 0.85 * h), (0, 1.25 * h)], n=7, noise=0.04, twist=0.4)


def chain(m, mt, p, d, links, size=0.09):
    """Hanging chain: alternating links along direction d from p."""
    d = Vector(d).normalized()
    for i in range(links):
        c = Vector(p) + d * (i * size * 1.5)
        side = Vector((1, 0, 0)) if i % 2 else Vector((0, 1, 0))
        m.lathe(mt, [(size * .55, -size * .1), (size * .75, 0), (size * .55, size * .1), (size * .35, 0)], n=6, closed=True,
                M=basis(c, d, side.cross(d), side, (1, 1.6, 1)))


# ======================================================================== 2: THE UNDEAD CRYPT
def build_crypt():
    s = Isle(1)
    dirt = mat('crypt_dirt', (0.085, 0.075, 0.06), rough=1)
    flag_a = mat('crypt_flag_a', (0.17, 0.18, 0.17), rough=0.92)
    flag_b = mat('crypt_flag_b', (0.12, 0.13, 0.125), rough=0.92)
    flag_c = mat('crypt_flag_c', (0.16, 0.145, 0.12), rough=0.92)
    moss = mat('crypt_moss', (0.09, 0.14, 0.07), rough=0.95)
    weed = mat('crypt_weed', (0.2, 0.19, 0.1), rough=0.9)
    slab = mat('crypt_slab', (0.07, 0.075, 0.07), rough=0.4, metal=0.1)
    grave = mat('crypt_grave', (0.42, 0.43, 0.44), rough=0.85)
    grave2 = mat('crypt_grave_dark', (0.28, 0.29, 0.3), rough=0.88)
    bone = mat('crypt_bone', (0.6, 0.56, 0.45), rough=0.6)
    dark = mat('crypt_socket', (0.01, 0.01, 0.01), rough=0.6)
    iron = mat('crypt_iron', (0.07, 0.07, 0.08), rough=0.45, metal=0.85)
    wood = mat('crypt_wood', (0.16, 0.12, 0.09), rough=0.9)
    deadwood = mat('crypt_deadwood', (0.13, 0.11, 0.1), rough=0.95)
    wax = mat('crypt_wax', (0.82, 0.78, 0.66), rough=0.6)
    soul = mat('crypt_soul', (0.35, 1.0, 0.55), emit=6)
    soul_dim = mat('crypt_soul_dim', (0.2, 0.7, 0.35), emit=2.5)
    rock = mat('crypt_rock', (0.11, 0.11, 0.12), rough=0.95)
    flamefx = mat('crypt_flamefx', (0.3, 1, 0.5), emit=5)
    s.base(dirt, flag_b, rock)

    # flagstones: running-bond rows, a few missing, some mossy, all a little crooked
    y = -R
    row = 0
    while y < R:
        h = random.uniform(1.1, 1.35)
        x = -R + (row % 2) * 0.9
        while x < R:
            w = random.uniform(1.5, 2.0)
            cx, cy = x + w / 2, y + h / 2
            rho = math.hypot(cx, cy)
            if 6.3 < rho < R - 0.7 and random.random() > 0.05:
                pts = rot2([(-w / 2 + .04, -h / 2 + .04), (w / 2 - .04, -h / 2 + .04), (w / 2 - .04, h / 2 - .04), (-w / 2 + .04, h / 2 - .04)], random.uniform(-.06, .06), (cx, cy))
                mt = random.choices([flag_a, flag_b, flag_c, moss], [5, 4, 2, 1.6])[0]
                tilt = TRS((cx, cy, 0), (random.uniform(-.025, .025), random.uniform(-.025, .025), 0)) @ TRS((-cx, -cy, 0))  # settled unevenly
                s.S(cx, cy).prism(mt, pts, 0, random.uniform(0.05, 0.13), M=tilt)
                if random.random() < .18:  # dead grass in the joints
                    for _ in range(random.randint(3, 7)):
                        gx, gy = cx + random.choice((-1, 1)) * w / 2 + random.uniform(-.1, .1), cy + random.uniform(-h / 2, h / 2)
                        s.S(cx, cy).lathe(weed, [(0.02, 0), (0, random.uniform(.15, .4))], n=3, M=TRS((gx, gy, 0.02), (random.uniform(-.5, .5), random.uniform(-.5, .5), random.uniform(0, TAU))))
            x += w
        y += h
        row += 1

    # the ossuary plaza: a dark slab ringed with skulls, a soul-green ring of runes
    c = s.core
    c.prism(slab, circle(5.9, 48), 0, 0.07)
    def skull(m, x, y, z, yaw, s=1.0):  # cranium, brow, cheekbones, sockets and a jaw, facing +X turned by yaw
        M = TRS((x, y, z), (0, 0, yaw), (s, s, s))
        m.sphere(bone, 0.16, M @ TRS((0, 0, 0.05), scale=(1.1, 0.95, 0.92)), u=12, v=8)
        m.cube(bone, M @ TRS((0.1, 0, -0.03), scale=(0.12, 0.2, 0.12)))  # face
        m.cube(bone, M @ TRS((0.09, 0, -0.11), (0, 0.25, 0), scale=(0.1, 0.16, 0.05)))  # jaw
        for sy in (-1, 1):
            m.sphere(dark, 0.045, M @ TRS((0.16, sy * 0.055, 0.0), scale=(.6, 1, 1)), u=6, v=4)
        m.sphere(dark, 0.02, M @ TRS((0.17, 0, -0.06)), u=4, v=4)  # nose
    s.skull = skull
    for i in range(22):
        a = TAU * i / 22
        skull(c, *pol(5.35, a), 0.12, a + math.pi, 0.95)
    c.annulus(soul, 4.55, 4.7, 0.075, 96)
    c.annulus(soul_dim, 2.75, 2.85, 0.075, 64)
    runes(c, soul, 3.65, 0.55, 12, 0.05, 0.076, s.rng)
    for k in range(5):  # a five-point binding star
        p, q = pol(2.75, TAU * k / 5 + math.pi / 2), pol(2.75, TAU * (k + 2) / 5 + math.pi / 2)
        c.stroke(soul_dim, p, q, 0.07, 0.077)
    c.sphere(bone, 0.42, TRS((0, 0, 0.12), scale=(1, 1.15, .5)), u=14, v=10)  # a great skull set in the floor
    for sx in (-1, 1):
        c.sphere(soul, 0.1, TRS((sx * 0.15, -0.22, 0.25), scale=(1, .6, .8)), u=8, v=6)

    # rim: a low curb and a spiked iron fence, broken here and there, open where the bridges land
    posts = []
    n = int(TAU * 21.9 / 1.35)
    for i in range(n):
        a = TAU * i / n
        x, y = pol(21.9, a)
        m = s.S(x, y)
        m.prism(grave2, wedge(21.55, 22.35, a - TAU / n / 2, a + TAU / n / 2, 2), 0, 0.32)
        if s.gap(a) or random.random() < 0.12:
            posts.append(None)
            continue
        lean = (random.uniform(-.12, .12), random.uniform(-.12, .12)) if random.random() < .2 else (0, 0)
        top = Vector((x + lean[0], y + lean[1], 1.95))
        m.tube(iron, [(x, y, 0.3), tuple(top)], [0.045, 0.04], n=6)
        m.lathe(iron, [(0.07, 0), (0.06, 0.05), (0, 0.24)], n=4, M=aim(top - Vector((x, y, .3)), top))
        posts.append((x, y, top))
    for i in range(n):
        a, b = posts[i], posts[(i + 1) % n]
        if a and b:
            m = s.S(a[0], a[1])
            for z in (0.85, 1.55):
                m.tube(iron, [(a[0], a[1], z), (b[0], b[1], z)], 0.022, n=5)

    # landmarks (obstacles): mausoleums, obelisks, a dead tree
    kinds = ['maus', 'obel', 'tree', 'obel', 'maus', 'obel', 'tree', 'obel']
    for i, (x, y, a) in enumerate(s.obstacle_spots()):
        kind = kinds[i % len(kinds)]
        if kind == 'maus':  # a little mausoleum, door facing the middle
            m = s.obstacle(i, x, y, 2.1, a + math.pi)
            m.prism(grave2, [(-1.7, -1.7), (1.7, -1.7), (1.7, 1.7), (-1.7, 1.7)], 0, 0.3)
            m.cube(grave, TRS((0, 0, 1.6), scale=(2.7, 2.7, 2.6)))
            m.cube(dark, TRS((1.36, 0, 1.15), scale=(0.05, 1.0, 1.7)))  # the doorway
            m.cube(soul_dim, TRS((1.38, 0, 1.15), scale=(0.02, 0.06, 1.6)))  # light through the crack
            for cx in (-1, 1):
                for cy in (-1, 1):
                    m.lathe(grave2, [(0, 0.3), (0.2, 0.3), (0.16, 0.45), (0.16, 2.8), (0.22, 2.95), (0, 2.95)], n=10, M=Matrix.Translation((cx * 1.42, cy * 1.42, 0)))
            m.prism(grave2, [(-1.75, 0), (1.75, 0), (0, 1.25)], -1.65, 1.65, M=TRS((0, 0, 2.9), (math.pi / 2, 0, math.pi / 2)))  # gable
            m.cube(grave, TRS((0, 0, 2.95), scale=(3.0, 3.0, 0.15)))
            m.lathe(iron, [(0.03, 0), (0.03, 0.7)], n=6, M=Matrix.Translation((0, 0, 4.1)))  # a cross on the ridge
            m.cube(iron, TRS((0, 0, 4.6), scale=(0.06, 0.45, 0.06)))
            m.sphere(bone, 0.22, TRS((1.42, 0, 2.55), scale=(.6, 1, 1)), u=10, v=8)  # skull over the door
        elif kind == 'obel':
            m = s.obstacle(i, x, y, 0.95, random.uniform(0, TAU))
            m.prism(grave2, [(-0.95, -0.95), (0.95, -0.95), (0.95, 0.95), (-0.95, 0.95)], 0, 0.25)
            m.prism(grave, [(-0.75, -0.75), (0.75, -0.75), (0.75, 0.75), (-0.75, 0.75)], 0.25, 0.5)
            H = random.uniform(4.2, 5.6)
            m.lathe(grave, [(0.58 * 1.414, 0.5), (0.4 * 1.414, H), (0, H + 0.6)], n=4, M=TRS(rot=(0, 0, math.pi / 4)))
            for z in (1.4, 2.4):
                rr = (0.58 - 0.18 * (z - 0.5) / H) * 1.414 + 0.01
                m.lathe(soul, [(rr, z - 0.04), (rr + 0.015, z), (rr, z + 0.04)], n=4, M=TRS(rot=(0, 0, math.pi / 4)), closed=True)
            m.sphere(bone, 0.16, TRS((0.52, 0, 3.3), scale=(.5, 1, 1.1)), u=8, v=6)
        else:  # a dead, twisted tree
            m = s.obstacle(i, x, y, 0.7, random.uniform(0, TAU))
            pts = [(0, 0, 0)]
            for k in range(6):
                pts.append((pts[-1][0] + random.uniform(-.25, .25), pts[-1][1] + random.uniform(-.25, .25), (k + 1) * 0.9))
            m.tube(deadwood, pts, [0.42, 0.36, 0.3, 0.24, 0.18, 0.12, 0.06], n=9)
            for k in range(5):  # roots
                a2 = TAU * k / 5 + random.uniform(-.3, .3)
                m.tube(deadwood, [(0, 0, 0.4), (*pol(0.7, a2), 0.1), (*pol(1.3, a2 + .2), -0.05)], [0.16, 0.1, 0.03], n=6)
            def branch(p, d, L, r, depth):
                q = Vector(p) + Vector(d).normalized() * L
                mid = (Vector(p) + q) / 2 + Vector((random.uniform(-.2, .2), random.uniform(-.2, .2), random.uniform(-.1, .2)))
                m.tube(deadwood, [tuple(p), tuple(mid), tuple(q)], [r, r * .7, r * .35], n=6)
                if depth:
                    for _ in range(2):
                        branch(q, Vector(d) + Vector((random.uniform(-.9, .9), random.uniform(-.9, .9), random.uniform(-.2, .5))), L * .6, r * .55, depth - 1)
            for k in range(4):
                b = pts[random.randint(3, 6)]
                branch(b, (random.uniform(-1, 1), random.uniform(-1, 1), random.uniform(.2, .9)), random.uniform(1.4, 2.2), 0.13, 2)
            for k in range(2):  # a noose of chain from a bough
                chain(m, iron, (random.uniform(-1, 1), random.uniform(-1, 1), 4.2), (0, 0, -1), 8)

    # gravestones with their mounds, bone heaps, candles, coffins, soul lanterns
    def gravestone(m, x, y, yaw):
        M = TRS((x, y, 0), (random.uniform(-.12, .12), random.uniform(-.12, .12), yaw))
        kind = random.random()
        mt = random.choice([grave, grave2])
        if kind < .4:  # round-topped slab
            pts = [(-0.38, 0), (0.38, 0)] + [pol(0.38, a) for a in [k * math.pi / 8 for k in range(9)]]
            pts = [(-0.38, 0), (0.38, 0), (0.38, 0.75)] + [(0.38 * math.cos(k * math.pi / 8), 0.75 + 0.38 * math.sin(k * math.pi / 8)) for k in range(1, 8)] + [(-0.38, 0.75)]
            m.prism(mt, pts, -0.07, 0.07, M=M @ TRS(rot=(math.pi / 2, 0, 0)))
        elif kind < .7:  # a cross
            m.cube(mt, M @ TRS((0, 0, 0.6), scale=(0.16, 0.12, 1.2)))
            m.cube(mt, M @ TRS((0, 0, 0.85), scale=(0.62, 0.12, 0.16)))
        elif kind < .85:  # a small obelisk
            m.lathe(mt, [(0.24, 0), (0.17, 1.1), (0, 1.35)], n=4, M=M @ TRS(rot=(0, 0, math.pi / 4)))
        else:  # broken off
            m.prism(mt, [(-0.36, 0), (0.36, 0), (0.36, 0.5), (0.1, 0.62), (-0.15, 0.45), (-0.36, 0.55)], -0.07, 0.07, M=M @ TRS(rot=(math.pi / 2, 0, 0)))
        fwd = Vector((math.cos(yaw + math.pi / 2), math.sin(yaw + math.pi / 2), 0))
        p = Vector((x, y, 0)) - fwd * 0.75
        m.ico(dirt, 1, TRS(tuple(p), (0, 0, yaw), (0.45, 0.85, 0.14)), sub=1, noise=0.04)
    for _ in range(52):
        q = s.spot(0.6, 8, 21)
        if q:
            gravestone(s.S(*q), q[0], q[1], math.atan2(q[1], q[0]) + math.pi / 2 + random.uniform(-.3, .3))
    for _ in range(14):  # bone heaps
        q = s.spot(0.7, 7, 21)
        if not q:
            continue
        m = s.S(*q)
        for k in range(random.randint(5, 9)):
            a = random.uniform(0, TAU)
            p = Vector((q[0] + random.uniform(-.4, .4), q[1] + random.uniform(-.4, .4), 0.07 + k * 0.025))
            d = Vector((math.cos(a), math.sin(a), random.uniform(-.1, .1))) * random.uniform(0.22, 0.38)
            m.tube(bone, [tuple(p - d), tuple(p + d)], [0.035, 0.03], n=5)
            for e in (p - d, p + d):
                m.sphere(bone, 0.05, TRS(tuple(e)), u=6, v=4)
        for k in range(random.randint(1, 2)):
            skull(m, q[0] + random.uniform(-.3, .3), q[1] + random.uniform(-.3, .3), 0.2, random.uniform(0, TAU), 0.85)
    for _ in range(12):  # candle clusters
        q = s.spot(0.4, 7, 20)
        if not q:
            continue
        m = s.S(*q)
        for k in range(random.randint(3, 6)):
            x, y = q[0] + random.uniform(-.35, .35), q[1] + random.uniform(-.35, .35)
            h = random.uniform(0.12, 0.45)
            m.lathe(wax, [(0, 0), (0.045, 0), (0.042, h), (0, h + 0.01)], n=8, M=Matrix.Translation((x, y, 0.05)))
            m.lathe(soul, [(0, h + 0.04), (0.022, h + 0.07), (0, h + 0.15)], n=5, M=Matrix.Translation((x, y, 0.05)))
    for _ in range(4):  # coffins, one with its lid knocked aside
        q = s.spot(1.0, 9, 20)
        if not q:
            continue
        m = s.S(*q)
        yaw = random.uniform(0, TAU)
        box = [(-0.3, -1.0), (0.3, -1.0), (0.45, 0.45), (0.3, 1.0), (-0.3, 1.0), (-0.45, 0.45)]
        m.prism(wood, rot2(box, yaw, q), 0.02, 0.5)
        lid = rot2([(x * 1.05, y * 1.02) for x, y in box], yaw + random.uniform(.3, .8), (q[0] + random.uniform(-.4, .4), q[1] + random.uniform(-.4, .4)))
        m.prism(wood, lid, 0.02, 0.1)
    for _ in range(7):  # soul lanterns on iron posts
        q = s.spot(0.4, 8, 21)
        if not q:
            continue
        m = s.S(*q)
        x, y = q
        m.tube(iron, [(x, y, 0), (x, y, 2.3), (x + 0.4, y, 2.45)], [0.05, 0.045, 0.03], n=6)
        m.cube(iron, TRS((x + 0.4, y, 2.15), scale=(0.24, 0.24, 0.32)))
        m.ico(soul, 0.1, Matrix.Translation((x + 0.4, y, 2.13)), sub=1)

    # braziers: iron cages of soul fire
    for i in range(4):
        a = TAU * i / 4 + TAU / 8
        x, y = pol(10.2, a)
        if s.in_lane(x, y, 1):
            x, y = pol(10.2, a + 0.5)
        m = s.piece(f'brazier_{i}', (x, y, 0))
        for k in range(3):
            b = TAU * k / 3
            m.tube(iron, [(*pol(0.5, b), 0), (*pol(0.32, b), 0.6), (*pol(0.42, b), 1.05)], [0.05, 0.045, 0.04], n=6)
        m.lathe(iron, [(0.1, 0.95), (0.5, 1.05), (0.6, 1.25), (0.52, 1.25), (0.1, 1.08)], n=14, smooth=True)
        for k in range(8):
            b = TAU * k / 8
            m.tube(iron, [(*pol(0.58, b), 1.22), (*pol(0.42, b + .2), 1.85), (*pol(0.12, b + .4), 2.1)], 0.02, n=4)
        m.ico(soul, 0.3, Matrix.Translation((0, 0, 1.25)), sub=1, noise=0.06)
        f = s.piece(f'flame_{i}', (x, y, 1.2))
        flame(f, flamefx)
        s.pillars.append((x, y, 0.65))

    # underneath: chains and bones hanging off the island
    for _ in range(12):
        a, rho = random.uniform(0, TAU), random.uniform(17, 21.5)
        x, y = pol(rho, a)
        m = s.U(x, y)
        chain(m, iron, (x, y, -0.9), (random.uniform(-.1, .1), random.uniform(-.1, .1), -1), random.randint(8, 14), 0.16)
    s.floaters(10, lambda m, sz: (m.ico(rock, sz, TRS(scale=(1, 1, .7)), sub=1, noise=0.25),
                                  m.prism(grave, [(-0.4, 0), (0.4, 0), (0.4, 0.9), (-0.4, 0.9)], -0.08, 0.08, M=TRS((0, 0, sz * .55), (math.pi / 2 + random.uniform(-.3, .3), 0, 0)))))
    return s.finish(bevel=('pillar',))


# ======================================================================== shared floor layouts
def radial_tiles(s, pick, h=(0.04, 0.11), skip=0.04, r0=6.3, r1=21.9):
    """Rings of curved paving stones (like the arena's). pick(x, y) -> material or None (left bare)."""
    r = r0
    while r < r1:
        rr = min(r + random.uniform(1.4, 1.9), r1)
        n = max(8, round(TAU * (r + rr) / 2 / 2.1))
        off = random.random() * TAU
        for j in range(n):
            if random.random() < skip:
                continue
            a0, a1 = off + TAU * j / n + 0.05 / r, off + TAU * (j + 1) / n - 0.05 / r
            cx, cy = pol((r + rr) / 2, (a0 + a1) / 2)
            mt = pick(cx, cy)
            if mt:
                s.S(cx, cy).prism(mt, [pol(r + 0.05, a0 + (a1 - a0) * t / 3) for t in range(4)] + [pol(rr - 0.05, a1 - (a1 - a0) * t / 3) for t in range(4)], 0, random.uniform(*h))
        r = rr


def hex_tiles(s, pick, size=1.1, gap=0.09, h=(0.06, 0.14), r0=6.3, r1=21.8, glow=None, glow_p=0.0):
    """Hexagonal tiles; glow: a material traced along some of the joints (lava seams, void circuitry)."""
    w = size * math.sqrt(3)
    rows = int(r1 / (size * 1.5)) + 2
    for row in range(-rows, rows + 1):
        for col in range(-rows, rows + 1):
            cx, cy = col * w + (row % 2) * w / 2, row * size * 1.5
            rho = math.hypot(cx, cy)
            if not (r0 < rho < r1):
                continue
            mt = pick(cx, cy)
            if not mt:
                continue
            pts = [pol(size - gap, TAU * k / 6 + math.pi / 6) for k in range(6)]
            pts = [(cx + x, cy + y) for x, y in pts]
            s.S(cx, cy).prism(mt, pts, 0, random.uniform(*h))
            if glow and random.random() < glow_p:
                k = random.randint(0, 5)
                p, q = pol(size, TAU * k / 6 + math.pi / 6), pol(size, TAU * (k + 1) / 6 + math.pi / 6)
                s.S(cx, cy).stroke(glow, (cx + p[0], cy + p[1]), (cx + q[0], cy + q[1]), gap * 0.8, 0.02)


def rim_ring(s, step, build):
    """Call build(mesh, x, y, a) round the rim every `step` metres, skipping the bridge landings."""
    n = int(TAU * (R - 0.6) / step)
    for i in range(n):
        a = TAU * i / n + random.uniform(-.3, .3) / n
        if s.gap(a, 0.2):
            continue
        x, y = pol(R - 0.6, a)
        build(s.S(x, y), x, y, a)


def scatter(s, n, r, build, rmin=7, rmax=21):
    for _ in range(n):
        q = s.spot(r, rmin, rmax)
        if q:
            build(s.S(*q), q[0], q[1])


# ======================================================================== 3: THE FROST PEAKS
def build_frost():
    s = Isle(2)
    snow = mat('frost_snow', (0.8, 0.84, 0.9), rough=0.9)
    snow2 = mat('frost_snow_b', (0.66, 0.72, 0.8), rough=0.9)
    ice = mat('frost_ice', (0.42, 0.66, 0.84), rough=0.06, metal=0.15)
    deep = mat('frost_ice_deep', (0.16, 0.32, 0.5), rough=0.04, metal=0.2)
    stone = mat('frost_stone', (0.34, 0.38, 0.46), rough=0.85)
    stone2 = mat('frost_stone_b', (0.26, 0.29, 0.36), rough=0.88)
    rock = mat('frost_rock', (0.14, 0.16, 0.21), rough=0.95)
    pine = mat('frost_pine', (0.06, 0.15, 0.12), rough=0.85)
    bark = mat('frost_bark', (0.16, 0.11, 0.08), rough=0.9)
    glow = mat('frost_glow', (0.5, 0.85, 1.0), emit=5)
    glow2 = mat('frost_glow_dim', (0.4, 0.7, 1.0), emit=2)
    steel = mat('frost_steel', (0.5, 0.55, 0.62), rough=0.25, metal=0.95)
    leather = mat('frost_leather', (0.18, 0.11, 0.07), rough=0.8)
    flamefx = mat('frost_flamefx', (0.5, 0.85, 1), emit=5)
    s.base(snow2, stone2, rock)

    # old paving half buried in snow, with sheets of ice
    radial_tiles(s, lambda x, y: random.choices([stone, stone2, snow, None], [4, 3, 3, 1.2])[0], skip=0.02)
    for _ in range(12):  # ice sheets
        q = s.spot(2.4, 8, 19)
        if q:
            pts = [(q[0] + math.cos(a) * r_, q[1] + math.sin(a) * r_) for a, r_ in ((TAU * k / 9, random.uniform(1.2, 2.6)) for k in range(9))]
            s.S(*q).prism(ice, pts, 0, 0.12)
    for _ in range(26):  # drifts
        q = s.spot(1.2, 8, 21.5)
        if q:
            a = math.atan2(q[1], q[0])
            s.S(*q).ico(snow, 1, TRS((q[0], q[1], 0), (0, 0, a), (random.uniform(1.2, 2.6), random.uniform(.8, 1.6), random.uniform(.12, .24))), sub=2, noise=0.03)

    # the frozen lake in the middle, runes glowing under the ice
    c = s.core
    c.prism(deep, circle(5.9, 48), 0, 0.06)
    c.lathe(snow, [(5.7, 0.0), (6.2, 0.18), (6.6, 0.0)], n=48, closed=True)
    c.annulus(glow, 4.7, 4.82, 0.065, 96)
    c.annulus(glow2, 3.1, 3.18, 0.065, 64)
    runes(c, glow, 3.95, 0.6, 14, 0.05, 0.066, s.rng)
    for k in range(6):  # a snowflake
        a = TAU * k / 6
        c.stroke(glow, (0, 0), pol(2.6, a), 0.07, 0.067)
        for t, L in ((1.2, 0.6), (1.9, 0.45)):
            p = pol(t, a)
            for sgn in (-1, 1):
                c.stroke(glow2, p, (p[0] + math.cos(a + sgn * 0.8) * L, p[1] + math.sin(a + sgn * 0.8) * L), 0.05, 0.067)

    # rim: snow-capped blocks, ice shards leaning outward, icicles hanging off the edge
    def rim(m, x, y, a):
        if random.random() < .55:
            w = random.uniform(.6, 1.1)
            pts = rot2([(-.35, -w / 2), (.35, -w / 2), (.35, w / 2), (-.35, w / 2)], a, (x, y))
            hh = random.uniform(.3, 1.1)
            m.prism(random.choice([stone, stone2]), pts, 0, hh)
            m.ico(snow, 1, TRS((x, y, hh), (0, 0, a), (.42, w * .6, .16)), sub=1, noise=0.03)
        else:
            out = Vector((math.cos(a), math.sin(a), 0))
            crystal(m, random.choice([ice, ice, glow2]), aim(out * random.uniform(.3, .8) + Vector((0, 0, 1)), (x, y, 0)), random.uniform(.15, .3), random.uniform(.8, 2.2))
        ex, ey = pol(R + 0.2, a)
        m.lathe(ice, [(random.uniform(.08, .18), 0), (0, -random.uniform(.6, 2.2))], n=5, M=Matrix.Translation((ex, ey, -0.2)))
    rim_ring(s, 1.1, rim)

    # landmarks: ice spires, snowy pines, a giant's sword, rune pillars, a frozen giant's head
    kinds = ['spire', 'pine', 'head', 'pine', 'spire', 'sword', 'pine', 'rune']
    for i, (x, y, a) in enumerate(s.obstacle_spots()):
        kind = kinds[i % len(kinds)]
        if kind == 'spire':
            m = s.obstacle(i, x, y, 1.3, random.uniform(0, TAU))
            m.ico(snow, 1, TRS((0, 0, 0), scale=(1.5, 1.5, .35)), sub=1, noise=0.05)
            for k in range(7):
                d = Vector((random.uniform(-.35, .35), random.uniform(-.35, .35), 1))
                crystal(m, ice if k % 3 else glow2, aim(d, (random.uniform(-.5, .5), random.uniform(-.5, .5), 0)), random.uniform(.25, .55), random.uniform(2.5, 6.0) * (1.2 if k == 0 else 1))
        elif kind == 'pine':
            m = s.obstacle(i, x, y, 0.9, random.uniform(0, TAU))
            m.lathe(bark, [(0.22, 0), (0.15, 1.2), (0, 1.4)], n=8)
            H = random.uniform(5, 6.5)
            for k in range(4):
                z0, rr = 0.9 + k * H * 0.2, (1.9 - k * 0.42)
                m.lathe(pine, [(0.05, z0), (rr, z0 + 0.2), (0, z0 + H * 0.33)], n=10, jag=0.15, noise=0.05)
                m.lathe(snow, [(rr * .7, z0 + 0.42), (rr * .55, z0 + 0.5), (0, z0 + H * 0.32)], n=10, noise=0.04)
            m.ico(snow, 1, TRS((0, 0, 0), scale=(1.3, 1.3, .3)), sub=1, noise=0.05)
        elif kind == 'head':  # a frozen giant, buried to the chin
            m = s.obstacle(i, x, y, 2.3, a + math.pi)
            m.ico(stone, 1, TRS((0, 0, 1.2), scale=(1.9, 1.7, 2.0)), sub=2, noise=0.08)
            m.ico(stone2, 1, TRS((0.9, 0, 1.7), scale=(.9, 1.4, .45)), sub=1, noise=0.05)  # brow
            for sy in (-1, 1):
                m.sphere(glow, 0.2, TRS((1.62, sy * 0.55, 1.45), scale=(.6, 1, .7)), u=8, v=6)  # eyes still faintly lit
            m.ico(stone2, 1, TRS((1.6, 0, 0.95), scale=(.5, .35, .45)), sub=1)  # nose
            for k in range(9):  # an icicle beard
                m.lathe(ice, [(random.uniform(.12, .22), 0), (0, -random.uniform(.6, 1.3))], n=5, M=Matrix.Translation((1.5, (k - 4) * 0.26, 0.55)))
            m.ico(snow, 1, TRS((0, 0, 2.9), scale=(1.8, 1.6, .55)), sub=2, noise=0.06)
            m.ico(snow, 1, TRS((0, 0, 0.1), scale=(2.6, 2.6, .5)), sub=1, noise=0.08)
            for sy in (-1, 1):  # horns of the helm, broken
                horn = [(0, sy * 1.4, 2.4), (0.2, sy * 2.0, 2.9), (0.4, sy * 2.2, 3.6)]
                m.tube(stone2, horn, [0.32, 0.22, 0.08], n=8)
        elif kind == 'sword':
            m = s.obstacle(i, x, y, 0.7, random.uniform(0, TAU))
            tilt = TRS(rot=(0.22, 0.1, 0))
            m.prism(steel, [(-0.32, 0), (0.32, 0), (0.28, 5.2), (0, 5.9), (-0.28, 5.2)], -0.07, 0.07, M=tilt @ TRS((0, 0, -0.8), (math.pi / 2, 0, 0)))
            m.prism(glow2, [(-0.04, 0.3), (0.04, 0.3), (0.03, 5.0), (-0.03, 5.0)], -0.075, 0.075, M=tilt @ TRS((0, 0, -0.8), (math.pi / 2, 0, 0)))
            m.cube(steel, tilt @ TRS((0, 0, 4.4), scale=(1.8, .22, .26)))
            m.lathe(leather, [(0.11, 0), (0.11, 1.3)], n=8, M=tilt @ Matrix.Translation((0, 0, 4.52)))  # the grip
            m.ico(steel, 0.2, tilt @ Matrix.Translation((0, 0, 5.95)), sub=1)
            m.ico(snow, 1, TRS((0, 0, 0), scale=(1.2, 1.2, .3)), sub=1, noise=0.05)
        else:  # a rune pillar capped with ice
            m = s.obstacle(i, x, y, 0.9, random.uniform(0, TAU))
            m.prism(stone2, [(-0.9, -0.9), (0.9, -0.9), (0.9, 0.9), (-0.9, 0.9)], 0, 0.3)
            m.lathe(stone, [(0.65, 0.3), (0.55, 0.5), (0.5, 4.2), (0.62, 4.4), (0, 4.5)], n=8, flute=0.06)
            for z in (1.5, 2.6):
                m.lathe(glow, [(0.515, z - 0.05), (0.53, z), (0.515, z + 0.05)], n=8, closed=True)
            for k in range(5):
                crystal(m, ice, aim((random.uniform(-.4, .4), random.uniform(-.4, .4), 1), (random.uniform(-.25, .25), random.uniform(-.25, .25), 4.4)), .18, random.uniform(.8, 1.6))

    # snowy rocks, ice crystals, shields and spears left in the snow, saplings
    scatter(s, 18, 0.9, lambda m, x, y: (m.ico(rock, 1, TRS((x, y, 0.15), (random.uniform(0, 1), random.uniform(0, 1), random.uniform(0, TAU)), (random.uniform(.5, 1.1), random.uniform(.4, .9), random.uniform(.35, .7))), sub=1, noise=0.12),
                                         m.ico(snow, 1, TRS((x, y, 0.55), (0, 0, random.uniform(0, TAU)), (.75, .65, .2)), sub=1, noise=0.04)))
    def cluster(m, x, y):
        for k in range(random.randint(3, 5)):
            crystal(m, ice if k % 2 else glow2, aim((random.uniform(-.5, .5), random.uniform(-.5, .5), 1), (x + random.uniform(-.3, .3), y + random.uniform(-.3, .3), 0)), random.uniform(.08, .18), random.uniform(.5, 1.4))
    scatter(s, 16, 0.5, cluster)
    def fallen(m, x, y):
        yaw = random.uniform(0, TAU)
        if random.random() < .5:  # a round shield half sunk
            m.lathe(steel, [(0, 0.06), (0.5, 0.03), (0.55, -0.02), (0, 0)], n=14, M=TRS((x, y, 0.25), (random.uniform(1, 1.4), 0, yaw)))
        else:  # a spear stuck in the snow
            top = Vector((x + random.uniform(-.5, .5), y + random.uniform(-.5, .5), 2.0))
            m.tube(bark, [(x, y, -0.2), tuple(top)], 0.035, n=6)
            m.lathe(steel, [(0.06, 0), (0, 0.35)], n=4, M=aim(top - Vector((x, y, 0)), top))
    scatter(s, 10, 0.6, fallen)
    def sapling(m, x, y):
        for k in range(3):
            m.lathe(pine, [(0.05, k * .35), (0.55 - k * .14, k * .35 + 0.1), (0, k * .35 + 0.7)], n=8, M=Matrix.Translation((x, y, 0)), jag=0.08)
        m.lathe(snow, [(0.3, 0.75), (0, 1.05)], n=8, M=Matrix.Translation((x, y, 0)))
    scatter(s, 10, 0.5, sapling)

    # braziers: stone bowls of cold blue fire
    for i in range(4):
        a = TAU * i / 4 + TAU / 8
        x, y = pol(10.2, a)
        if s.in_lane(x, y, 1):
            x, y = pol(10.2, a + 0.5)
        m = s.piece(f'brazier_{i}', (x, y, 0))
        m.lathe(stone2, [(0, 0), (0.55, 0), (0.55, 0.2), (0.25, 0.35), (0.2, 0.95), (0.45, 1.05), (0.62, 1.25), (0.5, 1.28), (0, 1.15)], n=12)
        for k in range(4):
            crystal(m, ice, aim((math.cos(TAU * k / 4), math.sin(TAU * k / 4), 1.2), (*pol(0.55, TAU * k / 4), 1.15)), 0.08, 0.55)
        m.ico(glow, 0.28, Matrix.Translation((0, 0, 1.22)), sub=1, noise=0.05)
        f = s.piece(f'flame_{i}', (x, y, 1.2))
        flame(f, flamefx)
        s.pillars.append((x, y, 0.65))

    # underneath: great icicles
    for _ in range(26):
        a, rho = random.uniform(0, TAU), random.uniform(4, 21)
        x, y = pol(rho, a)
        L = random.uniform(2, 7) * (1.3 - rho / R * .6)
        s.U(x, y).lathe(ice, [(random.uniform(.4, 1.0), 0), (random.uniform(.2, .5), -L * .6), (0, -L)], n=6, M=Matrix.Translation((x, y, -1.2 - (R - rho) * 0.35)))
    s.floaters(10, lambda m, sz: (m.ico(ice, sz, TRS(scale=(1, 1, .8)), sub=1, noise=0.2), m.ico(snow, sz, TRS((0, 0, sz * .55), scale=(.8, .8, .3)), sub=1, noise=0.05)))
    return s.finish(bevel=('pillar',))


# ======================================================================== 4: THE INFERNAL LEGION
def build_hell():
    s = Isle(3)
    basalt = mat('hell_basalt', (0.075, 0.068, 0.068), rough=0.8)
    basalt2 = mat('hell_basalt_b', (0.11, 0.085, 0.075), rough=0.85)
    ash = mat('hell_ash', (0.17, 0.15, 0.14), rough=1)
    crust = mat('hell_crust', (0.28, 0.06, 0.02), rough=0.9, emit=1.2, ecolor=(1, 0.25, 0.05))
    lava = mat('hell_lava', (1.0, 0.35, 0.05), emit=7)
    obsid = mat('hell_obsidian', (0.025, 0.02, 0.03), rough=0.12, metal=0.3)
    iron = mat('hell_iron', (0.06, 0.05, 0.05), rough=0.45, metal=0.85)
    brass = mat('hell_brass', (0.45, 0.24, 0.1), rough=0.35, metal=0.9)
    bone = mat('hell_bone', (0.55, 0.48, 0.38), rough=0.6)
    dark = mat('hell_socket', (0.01, 0.0, 0.0), rough=0.6)
    eyes = mat('hell_eyes', (1, 0.45, 0.1), emit=8)
    rock = mat('hell_rock', (0.08, 0.06, 0.06), rough=0.95)
    flamefx = mat('hell_flamefx', (1, 0.5, 0.1), emit=5)
    s.base(crust, basalt2, rock)  # the glowing crust shows through every joint

    hex_tiles(s, lambda x, y: None if 12.3 < math.hypot(x, y) < 13.5 else random.choices([basalt, basalt2, ash], [5, 4, 1])[0], glow=lava, glow_p=0.18)
    river = mat('hell_lava_river', (1.0, 0.28, 0.03), emit=2.6)  # dimmer than the seams so it stays orange, not white
    for i in range(12):  # a river of lava circling the plaza
        a0, a1 = TAU * i / 12, TAU * (i + 1) / 12
        s.sec[i].prism(river, wedge(12.45, 13.35, a0, a1, 6), 0, 0.03)

    c = s.core  # the ritual circle
    c.prism(obsid, circle(5.9, 48), 0, 0.08)
    c.annulus(lava, 4.9, 5.05, 0.085, 96)
    c.annulus(lava, 4.2, 4.28, 0.085, 96)
    runes(c, lava, 4.6, 0.38, 18, 0.04, 0.086, s.rng)
    star = [pol(4.15, TAU * k / 5 + math.pi / 2) for k in range(5)]
    for k in range(5):
        c.stroke(lava, star[k], star[(k + 2) % 5], 0.1, 0.087)
        c.lathe(obsid, [(0.22, 0), (0, 0.9)], n=5, M=Matrix.Translation((*star[k], 0.08)))  # a stub of a spike at each point

    def rim(m, x, y, a):  # jagged obsidian teeth leaning out
        out = Vector((math.cos(a), math.sin(a), 0))
        m.lathe(obsid, [(random.uniform(.18, .35), 0), (0, random.uniform(.6, 2.6))], n=5, M=aim(out * random.uniform(.2, .6) + Vector((0, 0, 1)), (x, y, -0.1)))
        if random.random() < .3:
            m.lathe(lava, [(0.06, 0), (0.02, -random.uniform(.8, 2))], n=4, M=Matrix.Translation((*pol(R + 0.15, a), -0.3)))  # a drip of lava over the edge
    rim_ring(s, 0.9, rim)
    for k, fa in enumerate((0.9, 4.0)):  # two lava falls pouring off the island
        if s.gap(fa, 0.5):
            fa += 0.8
        rad_v, side_v = Vector((math.cos(fa), math.sin(fa), 0)), Vector((-math.sin(fa), math.cos(fa), 0))
        cs, ws = [], []
        for j in range(20):
            t = j / 19
            cs.append(rad_v * (R + 2.8 * math.sqrt(t)) + Vector((0, 0, -0.2 - 22 * t * t)))
            ws.append(1.2 + 1.8 * t)
        fall = uv_ribbon(f'hell_lavafall_{k}', s.col, lava, cs, ws, [side_v] * len(cs))
        fall.parent = s.root

    kinds = ['statue', 'spikes', 'pillar', 'spikes', 'statue', 'pillar', 'spikes', 'pillar']
    for i, (x, y, a) in enumerate(s.obstacle_spots()):
        kind = kinds[i % len(kinds)]
        if kind == 'statue':  # a kneeling horned demon, eyes alight
            m = s.obstacle(i, x, y, 1.5, a + math.pi)
            m.prism(basalt2, [(-1.4, -1.4), (1.4, -1.4), (1.4, 1.4), (-1.4, 1.4)], 0, 0.5)
            m.prism(basalt, [(-1.2, -1.2), (1.2, -1.2), (1.2, 1.2), (-1.2, 1.2)], 0.5, 0.7)
            m.ico(obsid, 1, TRS((0, 0, 1.6), (0, 0.25, 0), (0.85, 0.75, 1.1)), sub=2, noise=0.04)  # torso
            m.ico(obsid, 1, TRS((0.35, 0, 0.95), scale=(0.7, 0.8, 0.35)), sub=1)  # knees
            m.ico(obsid, 0.42, TRS((0.35, 0, 2.75), scale=(1, .85, 1.05)), sub=2)  # head
            for sy in (-1, 1):
                m.tube(obsid, [(0.3, sy * 0.3, 3.0), (0.2, sy * 0.75, 3.5), (0.45, sy * 0.85, 4.1)], [0.14, 0.09, 0.02], n=7)  # horns
                m.sphere(eyes, 0.06, TRS((0.73, sy * 0.15, 2.82)), u=6, v=4)
                m.tube(obsid, [(0, sy * 0.65, 2.1), (0.5, sy * 0.85, 1.3), (0.75, sy * 0.4, 0.8)], [0.2, 0.16, 0.12], n=7)  # arms on the knees
                wing = [(0, 0), (1.8, 0.6), (2.6, 2.4), (1.2, 1.6), (0.8, 2.2), (0.2, 1.2)]
                m.prism(obsid, wing, -0.04, 0.04, M=TRS((-0.35, sy * 0.4, 1.9), (math.pi / 2 - sy * 0.35, 0, sy * (math.pi / 2 + 0.5))))
            m.lathe(lava, [(0.12, 0), (0.08, 0.02)], n=8, M=Matrix.Translation((0.78, 0, 2.58)))  # a glowing mouth
        elif kind == 'spikes':
            m = s.obstacle(i, x, y, 1.1, random.uniform(0, TAU))
            for k in range(6):
                d = Vector((random.uniform(-.45, .45), random.uniform(-.45, .45), 1))
                m.lathe(obsid, [(random.uniform(.25, .45), 0), (0, random.uniform(2, 4.5) * (1.3 if k == 0 else 1))], n=5, M=aim(d, (random.uniform(-.4, .4), random.uniform(-.4, .4), 0)))
            m.ico(crust, 1, TRS((0, 0, 0), scale=(1.3, 1.3, .25)), sub=1, noise=0.06)
        else:  # a brimstone pillar with a skull cage hung from it
            m = s.obstacle(i, x, y, 0.9, random.uniform(0, TAU))
            m.prism(basalt2, [(-0.9, -0.9), (0.9, -0.9), (0.9, 0.9), (-0.9, 0.9)], 0, 0.35)
            m.lathe(basalt, [(0.6, 0.35), (0.55, 4.5), (0.7, 4.7), (0, 4.8)], n=6, jag=0.2)
            for z in (1.2, 2.4, 3.6):  # glowing cracks
                m.lathe(lava, [(0.56, z - 0.03), (0.58, z), (0.56, z + 0.03)], n=6, closed=True)
            m.tube(iron, [(0.55, 0, 4.0), (1.1, 0, 4.1)], 0.05, n=5)
            chain(m, iron, (1.1, 0, 4.05), (0, 0, -1), 6, 0.11)
            for k in range(8):
                b = TAU * k / 8
                m.tube(iron, [(1.1 + math.cos(b) * .3, math.sin(b) * .3, 2.6), (1.1 + math.cos(b) * .32, math.sin(b) * .32, 3.4)], 0.02, n=4)
            m.sphere(bone, 0.17, TRS((1.1, 0, 2.8)), u=10, v=8)

    def skulls(m, x, y):
        for k in range(random.randint(3, 6)):
            p = (x + random.uniform(-.45, .45), y + random.uniform(-.45, .45), 0.16 + (k > 3) * 0.2)
            m.sphere(bone, 0.15, TRS(p, (0, 0, random.uniform(0, TAU)), (1.05, 1.15, .95)), u=10, v=7)
            m.sphere(dark, 0.04, TRS((p[0], p[1] - 0.13, p[2])), u=4, v=4)
    scatter(s, 12, 0.6, skulls)
    def impaled(m, x, y):
        top = Vector((x + random.uniform(-.2, .2), y + random.uniform(-.2, .2), random.uniform(1.6, 2.4)))
        m.lathe(obsid, [(0.07, 0), (0, top.z)], n=5, M=Matrix.Translation((x, y, 0)))
        m.sphere(bone, 0.15, TRS((x, y, top.z * 0.72), scale=(1, 1.15, .95)), u=10, v=7)
        m.sphere(eyes, 0.03, TRS((x + 0.05, y - 0.13, top.z * 0.72)), u=4, v=4)
    scatter(s, 10, 0.4, impaled)
    def vent(m, x, y):  # a little lava vent
        m.lathe(basalt2, [(0.7, 0), (0.45, 0.35), (0.3, 0.42), (0.28, 0.3), (0, 0.3)], n=9, M=Matrix.Translation((x, y, 0)), noise=0.04)
        m.lathe(lava, [(0.27, 0.36), (0, 0.38)], n=9, M=Matrix.Translation((x, y, 0)))
    scatter(s, 10, 0.75, vent)
    def cage(m, x, y):
        m.lathe(iron, [(0.6, 0), (0.6, 0.06), (0, 0.06)], n=10, M=Matrix.Translation((x, y, 0)))
        for k in range(10):
            b = TAU * k / 10
            m.tube(iron, [(x + math.cos(b) * .55, y + math.sin(b) * .55, 0), (x + math.cos(b) * .5, y + math.sin(b) * .5, 1.3), (x + math.cos(b) * .1, y + math.sin(b) * .1, 1.6)], 0.025, n=4)
        for k in range(4):
            m.tube(bone, [(x + random.uniform(-.3, .3), y + random.uniform(-.3, .3), 0.1), (x + random.uniform(-.3, .3), y + random.uniform(-.3, .3), 0.14)], 0.03, n=4)
        m.sphere(bone, 0.15, TRS((x, y, 0.2)), u=10, v=7)
    scatter(s, 4, 0.8, cage)

    for i in range(4):  # braziers: horned brass bowls
        a = TAU * i / 4 + TAU / 8
        x, y = pol(10.2, a)
        if s.in_lane(x, y, 1):
            x, y = pol(10.2, a + 0.5)
        m = s.piece(f'brazier_{i}', (x, y, 0))
        m.lathe(basalt2, [(0, 0), (0.55, 0), (0.55, 0.25), (0.22, 0.4), (0.18, 0.9)], n=8)
        m.lathe(brass, [(0.18, 0.9), (0.5, 1.0), (0.65, 1.25), (0.55, 1.28), (0, 1.12)], n=14, smooth=True)
        for k in range(4):
            b = TAU * k / 4 + TAU / 8
            m.tube(brass, [(*pol(0.6, b), 1.2), (*pol(0.85, b), 1.55), (*pol(0.75, b), 1.95)], [0.07, 0.05, 0.01], n=6)
        m.ico(lava, 0.3, Matrix.Translation((0, 0, 1.22)), sub=1, noise=0.06)
        f = s.piece(f'flame_{i}', (x, y, 1.2))
        flame(f, flamefx, 1.15)
        s.pillars.append((x, y, 0.65))

    for _ in range(30):  # underneath: lava dripping down glowing veins
        a, rho = random.uniform(0, TAU), random.uniform(3, 21)
        x, y = pol(rho, a)
        z0 = -0.8 - (R - rho) * 0.5
        L = random.uniform(1.5, 5)
        m = s.U(x, y)
        if random.random() < .5:
            m.lathe(rock, [(random.uniform(.4, .9), 0), (0, -L)], n=6, M=Matrix.Translation((x, y, z0)))
        else:
            m.tube(lava, [(x, y, z0), (x + random.uniform(-.3, .3), y + random.uniform(-.3, .3), z0 - L * .6), (x, y, z0 - L)], [0.12, 0.08, 0.02], n=5)
    s.floaters(10, lambda m, sz: (m.ico(basalt, sz, TRS(scale=(1, 1, .75)), sub=1, noise=0.25), m.ico(lava, sz * .45, TRS((sz * .3, 0, sz * .2)), sub=1, noise=0.1)))
    return s.finish(bevel=('pillar',))


# ======================================================================== 5: THE VOID
def build_void():
    s = Isle(4)
    tile = mat('void_tile', (0.04, 0.035, 0.065), rough=0.18, metal=0.5)
    tile2 = mat('void_tile_b', (0.07, 0.05, 0.1), rough=0.25, metal=0.4)
    line = mat('void_line', (0.65, 0.3, 1.0), emit=5)
    cyan = mat('void_cyan', (0.3, 0.9, 1.0), emit=4)
    chitin = mat('void_chitin', (0.05, 0.03, 0.07), rough=0.2, metal=0.3)
    flesh = mat('void_flesh', (0.22, 0.08, 0.26), rough=0.45)
    sucker = mat('void_sucker', (0.8, 0.4, 1.0), emit=3)
    eyew = mat('void_eye', (0.85, 0.82, 0.9), rough=0.2)
    iris = mat('void_iris', (0.7, 0.2, 1.0), emit=6)
    black = mat('void_black', (0.0, 0.0, 0.0), rough=0.3)
    cryst = mat('void_crystal', (0.7, 0.35, 1.0), emit=3)
    rock = mat('void_rock', (0.06, 0.05, 0.09), rough=0.9)
    flamefx = mat('void_flamefx', (0.7, 0.3, 1), emit=5)
    s.base(tile2, chitin, rock)

    hex_tiles(s, lambda x, y: random.choices([tile, tile2], [3, 2])[0], size=1.35, gap=0.07, h=(0.05, 0.18), glow=line, glow_p=0.35)

    c = s.core  # the rift
    c.prism(tile, circle(5.9, 48), 0, 0.07)
    for r_, w, mt in ((5.2, 0.1, line), (4.4, 0.06, cyan), (3.6, 0.12, line), (2.9, 0.05, cyan)):
        c.annulus(mt, r_ - w, r_, 0.075, 96)
    c.prism(black, circle(2.6, 40), 0.07, 0.08)
    for k in range(12):  # light bending into it
        a = TAU * k / 12
        c.stroke(line, pol(2.6, a), pol(3.5, a + 0.25), 0.04, 0.081)
    runes(c, cyan, 4.0, 0.42, 16, 0.035, 0.077, s.rng)

    def rim(m, x, y, a):  # shards and cubes hovering over a broken edge
        z = random.uniform(.4, 2.4)
        if random.random() < .5:
            sz = random.uniform(.25, .55)
            m.cube(random.choice([tile, chitin]), TRS((x, y, z), (random.uniform(0, 1), random.uniform(0, 1), random.uniform(0, TAU)), (sz, sz, sz)))
        else:
            crystal(m, random.choice([cryst, chitin, chitin]), aim((random.uniform(-1, 1), random.uniform(-1, 1), random.uniform(-.5, 1)), (x, y, z)), random.uniform(.1, .22), random.uniform(.6, 1.4))
    rim_ring(s, 1.3, rim)

    kinds = ['tentacle', 'eye', 'mono', 'tentacle', 'eye', 'tentacle', 'mono', 'eye']
    for i, (x, y, a) in enumerate(s.obstacle_spots()):
        kind = kinds[i % len(kinds)]
        if kind == 'tentacle':  # a twisting tentacle up out of the floor
            m = s.obstacle(i, x, y, 0.9, random.uniform(0, TAU))
            pts, rad = [], []
            for k in range(16):
                t = k / 15
                pts.append((math.cos(t * 7) * 0.5 * t, math.sin(t * 7) * 0.5 * t, t * 5.5))
                rad.append(0.6 * (1 - t) + 0.04)
            m.tube(flesh, pts, rad, n=10)
            for k in range(3, 14):  # suckers up one side
                t = k / 15
                p = Vector(pts[k]) + Vector((math.cos(t * 7 + 1.6), math.sin(t * 7 + 1.6), 0)) * rad[k] * .95
                m.sphere(sucker, rad[k] * .28, TRS(tuple(p)), u=6, v=4)
            m.ico(chitin, 1, TRS((0, 0, 0), scale=(1.1, 1.1, .3)), sub=1, noise=0.1)
        elif kind == 'eye':  # an obelisk with a living eye
            m = s.obstacle(i, x, y, 0.9, a + math.pi)
            m.prism(chitin, [(-0.9, -0.9), (0.9, -0.9), (0.9, 0.9), (-0.9, 0.9)], 0, 0.3)
            m.lathe(tile, [(0.62 * 1.41, 0.3), (0.38 * 1.41, 4.8), (0, 5.6)], n=4, M=TRS(rot=(0, 0, math.pi / 4)))
            m.sphere(eyew, 0.4, TRS((0.42, 0, 3.4)), u=14, v=10)
            m.sphere(iris, 0.2, TRS((0.72, 0, 3.4), scale=(.4, 1, 1)), u=10, v=8)
            m.sphere(black, 0.09, TRS((0.8, 0, 3.4), scale=(.3, .5, 1)), u=8, v=6)
            for sy in (-1, 1):  # lids of chitin
                m.ico(chitin, 1, TRS((0.45, 0, 3.4 + sy * 0.34), scale=(.38, .5, .14)), sub=1)
            for z in (1.2, 2.2):
                m.lathe(line, [(0.56 * 1.41 - (z - .3) * .05, z - 0.04), (0.57 * 1.41 - (z - .3) * .05, z), (0.56 * 1.41 - (z - .3) * .05, z + 0.04)], n=4, M=TRS(rot=(0, 0, math.pi / 4)), closed=True)
        else:  # a monolith hanging upside down over its base
            m = s.obstacle(i, x, y, 0.9, random.uniform(0, TAU))
            m.lathe(chitin, [(0.85, 0), (0.6, 0.35), (0, 0.4)], n=6)
            m.lathe(tile, [(0, 1.2), (0.75, 3.8), (0.6, 4.8), (0, 5.0)], n=4)
            for z in (2.4, 3.3):
                m.lathe(cyan, [(0.75 * (z - 1.2) / 2.6 + .01, z - 0.03), (0.75 * (z - 1.2) / 2.6 + .03, z), (0.75 * (z - 1.2) / 2.6 + .01, z + 0.03)], n=4, closed=True)
            m.ico(cryst, 0.16, Matrix.Translation((0, 0, 0.8)), sub=1)

    def crystals(m, x, y):
        for k in range(random.randint(3, 6)):
            crystal(m, cryst if k % 2 else chitin, aim((random.uniform(-.6, .6), random.uniform(-.6, .6), 1), (x + random.uniform(-.35, .35), y + random.uniform(-.35, .35), 0)), random.uniform(.08, .2), random.uniform(.5, 1.6))
    scatter(s, 14, 0.55, crystals)
    def pods(m, x, y):  # alien eggs
        for k in range(random.randint(3, 5)):
            p = (x + random.uniform(-.5, .5), y + random.uniform(-.5, .5), 0)
            h = random.uniform(.35, .6)
            m.sphere(flesh, h, TRS((p[0], p[1], h * .8), scale=(.7, .7, 1)), u=12, v=8)
            m.sphere(sucker, h * .25, TRS((p[0], p[1], h * 1.55)), u=6, v=4)
    scatter(s, 8, 0.8, pods)
    def feeler(m, x, y):  # a small tentacle tip
        pts = [(x, y, 0)]
        for k in range(5):
            pts.append((pts[-1][0] + random.uniform(-.15, .15), pts[-1][1] + random.uniform(-.15, .15), (k + 1) * .3))
        m.tube(flesh, pts, [0.16, 0.13, 0.1, 0.07, 0.04, 0.01], n=7)
    scatter(s, 12, 0.35, feeler)
    def glyph(m, x, y):
        sz = random.uniform(.3, .5)
        m.cube(chitin, TRS((x, y, sz / 2), (0, 0, random.uniform(0, TAU)), (sz, sz, sz)))
        m.cube(line, TRS((x, y, sz + .01), (0, 0, random.uniform(0, TAU)), (sz * .7, .03, .01)))
    scatter(s, 10, 0.45, glyph)

    for i in range(4):  # braziers: a violet fire held in a ring over a pedestal
        a = TAU * i / 4 + TAU / 8
        x, y = pol(10.2, a)
        if s.in_lane(x, y, 1):
            x, y = pol(10.2, a + 0.5)
        m = s.piece(f'brazier_{i}', (x, y, 0))
        m.lathe(chitin, [(0, 0), (0.5, 0), (0.42, 0.3), (0.15, 0.6), (0.12, 0.95), (0.35, 1.05), (0, 1.1)], n=6)
        m.lathe(line, [(0.58, 1.18), (0.64, 1.2), (0.58, 1.22), (0.52, 1.2)], n=24, closed=True)
        m.ico(cryst, 0.28, Matrix.Translation((0, 0, 1.25)), sub=1)
        f = s.piece(f'flame_{i}', (x, y, 1.2))
        flame(f, flamefx)
        s.pillars.append((x, y, 0.65))

    for _ in range(22):  # underneath: inverted spires
        a, rho = random.uniform(0, TAU), random.uniform(3, 20)
        x, y = pol(rho, a)
        L = random.uniform(3, 9) * (1.3 - rho / R * .6)
        m = s.U(x, y)
        m.lathe(random.choice([rock, chitin]), [(random.uniform(.5, 1.2), 0), (0, -L)], n=4, M=TRS((x, y, -1.5 - (R - rho) * 0.4), (0, 0, random.uniform(0, TAU))))
        if random.random() < .3:
            m.lathe(line, [(0.05, 0), (0, -L * .7)], n=4, M=Matrix.Translation((x, y, -1.6 - (R - rho) * 0.4)))
    s.floaters(12, lambda m, sz: (crystal(m, chitin, TRS(rot=(random.uniform(0, 3), random.uniform(0, 3), 0)), sz * .45, sz * 2.2), crystal(m, cryst, TRS((sz * .3, 0, 0), (random.uniform(0, 3), 0, 0)), sz * .2, sz * 1.2)))
    return s.finish(bevel=('pillar',))


# ======================================================================== bridges
def bridge(id_, deck, rail, trim=None, glow=None):
    """One 2.2 m segment, deck top at z = 0, running along Blender Y. The game lays them end to end."""
    m = Mesh('bridge_' + id_, BR)
    m.prism(deck, [(-2.2, -1.1), (2.2, -1.1), (2.2, 1.1), (-2.2, 1.1)], -0.45, 0.0)
    for k in range(4):  # paving joints
        m.prism(trim or deck, [(-2.15 + k * 1.1 + .03, -1.06), (-2.15 + (k + 1) * 1.1 - .03, -1.06), (-2.15 + (k + 1) * 1.1 - .03, 1.06), (-2.15 + k * 1.1 + .03, 1.06)], 0.0, 0.04)
    m.prism(deck, [(-1.6, -1.1), (1.6, -1.1), (0.9, 1.1), (-0.9, 1.1)], -1.4, -0.45, M=TRS(rot=(math.pi / 2, 0, 0)) @ TRS((0, -0.45, 0)))  # keel
    m.lathe(deck, [(0.5, 0), (0.15, -1.2), (0, -1.6)], n=6, M=Matrix.Translation((0, 0, -1.3)))
    for sx in (-1, 1):  # posts and a rail on both sides
        m.prism(rail, [(sx * 2.05 - .14, -0.14), (sx * 2.05 + .14, -0.14), (sx * 2.05 + .14, 0.14), (sx * 2.05 - .14, 0.14)], 0.0, 1.05)
        m.prism(rail, [(sx * 2.05 - .09, -1.1), (sx * 2.05 + .09, -1.1), (sx * 2.05 + .09, 1.1), (sx * 2.05 - .09, 1.1)], 0.9, 1.02)
        if glow:
            m.ico(glow, 0.09, Matrix.Translation((sx * 2.05, 0, 1.12)), sub=1)
    return m.done()


BR = coll('bridges')
roots = [build_crypt(), build_frost(), build_hell(), build_void()]
bridges = [  # the bridge into each island is in that island's style
    bridge('shadow', mat('br_stone', (0.4, 0.38, 0.42), rough=0.9), mat('br_stone_b', (0.32, 0.31, 0.36), rough=0.9), glow=mat('br_gold', (1, 0.75, 0.35), emit=4)),
    bridge('crypt', mat('br_crypt', (0.2, 0.21, 0.2), rough=0.92), mat('br_crypt_iron', (0.07, 0.07, 0.08), rough=0.45, metal=0.85), glow=mat('br_crypt_soul', (0.35, 1, 0.55), emit=6)),
    bridge('frost', mat('br_ice', (0.45, 0.68, 0.86), rough=0.06, metal=0.15), mat('br_frost_stone', (0.7, 0.75, 0.82), rough=0.85), trim=mat('br_frost_snow', (0.82, 0.86, 0.92), rough=0.9), glow=mat('br_frost_glow', (0.5, 0.85, 1), emit=5)),
    bridge('hell', mat('br_basalt', (0.09, 0.075, 0.07), rough=0.8), mat('br_brass', (0.45, 0.24, 0.1), rough=0.35, metal=0.9), trim=mat('br_hell_crust', (0.28, 0.06, 0.02), rough=0.9, emit=1.4, ecolor=(1, 0.25, 0.05)), glow=mat('br_hell_lava', (1, 0.35, 0.05), emit=7)),
    bridge('void', mat('br_void', (0.05, 0.04, 0.08), rough=0.2, metal=0.45), mat('br_void_chitin', (0.05, 0.03, 0.07), rough=0.2, metal=0.3), trim=mat('br_void_line', (0.65, 0.3, 1), emit=4), glow=mat('br_void_cyan', (0.3, 0.9, 1), emit=4)),
]
for b in bridges:
    apply_bevel(b, 0.03, segs=1, angle=40)
bake_ao(bridges, bridges, rays=8, dist=1.5, strength=0.6)

bpy.ops.wm.save_as_mainfile(filepath=os.path.join(HERE, 'islands.blend'))
export('islands.glb', roots + bridges)
pv = Previewer(res=900)
for rt in roots:
    pv.render('island_' + rt.name[5:], [rt], dirv=(0.6, -1, 0.75))
    pv.render('island_' + rt.name[5:] + '_close', [rt], view=((14, -14, 5), (0, 0, 1)), lens=28)
print('MAGE_ISLANDS_OK', len(roots), sum(len(r.children) for r in roots))
