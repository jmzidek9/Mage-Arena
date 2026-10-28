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
roots = [build_crypt()]
bridges = [
    bridge('shadow', mat('br_stone', (0.4, 0.38, 0.42), rough=0.9), mat('br_stone_b', (0.32, 0.31, 0.36), rough=0.9)),
    bridge('crypt', mat('br_crypt', (0.2, 0.21, 0.2), rough=0.92), mat('br_crypt_iron', (0.07, 0.07, 0.08), rough=0.45, metal=0.85), glow=mat('br_crypt_soul', (0.35, 1, 0.55), emit=6)),
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
