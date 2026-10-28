# Builds the static Mage Pact assets (arena, first-person rig, shared spell meshes, partner wizard),
# saves mage_pact.blend, exports assets/*.glb, renders previews. Element spells: build_elements.py. Enemies: build_enemies.py.
# Run: blender --background --factory-startup --python blender/build_assets.py
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from lib import *

random.seed(7)
scene = reset()

# ---------- materials ----------
GLOW = {}
for k, c, core in [('fire', (1.0, 0.3, 0.04), (1.0, 0.78, 0.35)),
                   ('ice', (0.2, 0.75, 1.0), (0.8, 0.97, 1.0)),
                   ('lightning', (0.65, 0.45, 1.0), (0.95, 0.9, 1.0)),
                   ('arcane', (0.55, 0.25, 1.0), (0.85, 0.7, 1.0))]:
    GLOW[k] = (mat(k + '_glow', c, emit=6), mat(k + '_core', core, emit=10))
ice_solid = mat('ice_solid', (0.55, 0.85, 1.0), emit=1.5, ecolor=(0.3, 0.8, 1.0), rough=0.05)
shock = mat('shock', (1, 1, 1), emit=5)
steam = mat('steam', (0.85, 0.88, 0.9), emit=1.2, ecolor=(1, 0.95, 0.9), rough=0.9)



# ---------- spell circle (the arena sigil; element circles live in build_elements.py) ----------
def spell_circle(col, kind, style, prefix='', loc=(0, 0, 0), scale=1.0):
    """4 objects (ring_outer, runes, ring_inner, sigil) so the game can counter-rotate them."""
    g, h = GLOW[kind]
    rng = random.Random(kind)
    o = Mesh(prefix + 'ring_outer', col, loc)
    o.annulus(g, 0.955, 1.0)
    o.annulus(h, 0.90, 0.915)
    for i in range(72):
        a = TAU * i / 72
        o.stroke(g, pol(0.915, a), pol(0.955 if i % 6 == 0 else 0.935, a), 0.008)
    if style == 'fire':  # flame tongues swirling off the rim
        for i in range(12):
            a = TAU * i / 12
            o.flat(g, [pol(1.0, a - 0.07), pol(1.14, a + 0.06), pol(1.0, a + 0.07)])
    elif style == 'ice':  # frost diamonds
        for i in range(12):
            a = TAU * i / 12
            o.flat(g, [pol(1.02, a), pol(1.07, a + 0.035), pol(1.12, a), pol(1.07, a - 0.035)])
    else:  # lightning zigzag band
        o.polyline(g, [pol(1.03 if i % 2 else 1.09, TAU * i / 64) for i in range(64)], 0.014, closed=True)

    r = Mesh(prefix + 'runes', col, loc)
    r.annulus(g, 0.68, 0.69, 0.002)
    r.annulus(g, 0.84, 0.85, 0.002)
    runes(r, h, 0.765, 0.1, 18, 0.011, 0.002, rng)

    n = Mesh(prefix + 'ring_inner', col, loc)
    n.annulus(g, 0.60, 0.625, 0.004)
    n.annulus(h, 0.555, 0.565, 0.004)
    for i in range(8):
        a = TAU * i / 8 + TAU / 16
        cx, cy = pol(0.5825, a)
        n.flat(h, [(cx + 0.014 * math.cos(t * TAU / 8), cy + 0.014 * math.sin(t * TAU / 8)) for t in range(8)], 0.004)

    s = Mesh(prefix + 'sigil', col, loc)
    z = 0.006
    if style == 'fire':
        for k in range(2):
            s.polyline(g, [pol(0.52, math.pi / 2 + k * math.pi + i * TAU / 3) for i in range(3)], 0.026, z, True)
        for i in range(6):  # swirl arms
            a0 = TAU * i / 6
            s.polyline(h, [pol(0.16 + t * 0.06, a0 + t * 0.22) for t in range(6)], 0.014, z)
    elif style == 'ice':
        s.polyline(g, [pol(0.5, TAU * i / 6) for i in range(6)], 0.022, z, True)
        for i in range(6):
            a = TAU * i / 6
            s.stroke(h, pol(0.14, a), pol(0.46, a), 0.018, z)
            for t in (0.28, 0.38):
                px, py = pol(t, a)
                for sgn in (1, -1):
                    s.stroke(h, (px, py), (px + 0.08 * math.cos(a + sgn * math.pi / 4), py + 0.08 * math.sin(a + sgn * math.pi / 4)), 0.012, z)
    else:
        s.polyline(g, [pol(0.52 if i % 2 == 0 else 0.24, TAU * i / 16) for i in range(16)], 0.022, z, True)
        for i in range(4):
            a = TAU * i / 4 + TAU / 8
            pts = []
            for t in range(5):
                rr = 0.14 + t * 0.09
                off = 0.035 * (1 if t % 2 else -1)
                pts.append(pol(rr, a + off / rr))
            s.polyline(h, pts, 0.014, z)
    s.annulus(h, 0.10, 0.12, z)
    s.flat(h, [pol(0.05, TAU * i / 24) for i in range(24)], z)

    objs = [o.done(False), r.done(False), n.done(False), s.done(False)]
    for ob in objs:
        ob.scale = (scale, scale, scale)
    return objs


# ---------- spell meshes (forward = Blender -Y, which becomes three.js +Z) ----------
S = coll('spells')
SPELLS = []
fg, fh = GLOW['fire']
ig, ih = GLOW['ice']
lg, lh = GLOW['lightning']

m = Mesh('fireball_core', S); m.ico(fh, 0.16, smooth=True); SPELLS.append(m.done())
m = Mesh('fireball_shell', S); m.ico(fg, 0.27, noise=0.06); SPELLS.append(m.done())
m = Mesh('fireball_tail', S)
m.lathe(fg, [(0, 0), (0.2, 0.05), (0.12, 0.35), (0, 0.8)], n=10, M=aim((0, 1, 0)), noise=0.03, twist=0.5)
SPELLS.append(m.done())

m = Mesh('ice_shard', S, loc=(1.5, 0, 0))
crystal(m, ice_solid, aim((0, -1, 0), (0, 0.25, 0)), 0.09, 0.9)
for d, l in [((0.25, -1, 0.1), (0.06, 0.2, 0)), ((-0.25, -1, 0.1), (-0.06, 0.2, 0)), ((0, -1, -0.25), (0, 0.2, -0.05))]:
    crystal(m, ice_solid, aim(d, l), 0.06, 0.5)
SPELLS.append(m.done())

m = Mesh('ice_spike', S, loc=(3, 0, 0))
for _ in range(5):
    crystal(m, ice_solid, TRS((random.uniform(-0.25, 0.25), random.uniform(-0.25, 0.25), -0.1),
                              (random.uniform(-0.4, 0.4), random.uniform(-0.4, 0.4), random.uniform(0, TAU))),
            random.uniform(0.12, 0.2), random.uniform(0.6, 1.4))
SPELLS.append(m.done())

m = Mesh('bolt', S, loc=(4.5, 0, 0.5))
pts = [Vector((0, 0, 0))] + [Vector((random.uniform(-0.07, 0.07), -i / 10, random.uniform(-0.07, 0.07))) for i in range(1, 10)] + [Vector((0, -1, 0))]
m.ribbon(lh, pts, 0.045)
for i in (3, 6):
    p = pts[i]
    m.ribbon(lh, [p, p + Vector((random.uniform(-0.12, 0.12), -0.08, random.uniform(-0.12, 0.12))),
                  p + Vector((random.uniform(-0.2, 0.2), -0.18, random.uniform(-0.2, 0.2)))], 0.025)
SPELLS.append(m.done(False))

m = Mesh('shockwave', S, loc=(6.5, 0, 0))
m.annulus(shock, 0.86, 1.0, n=64)
m.annulus(shock, 0.74, 0.77, 0.001, n=64)
SPELLS.append(m.done(False))

m = Mesh('steam_burst', S, loc=(9, 0, 0.6))
for _ in range(7):
    d = Vector((random.uniform(-1, 1), random.uniform(-1, 1), random.uniform(-0.3, 1))).normalized() * random.uniform(0.1, 0.45)
    m.ico(steam, random.uniform(0.3, 0.55), TRS(d), sub=1, noise=0.08)
SPELLS.append(m.done())

m = Mesh('shatter_burst', S, loc=(11.5, 0, 0.6))
m.ico(ih, 0.15, sub=1)
for _ in range(14):
    d = Vector((random.uniform(-1, 1), random.uniform(-1, 1), random.uniform(-1, 1))).normalized()
    crystal(m, ice_solid, aim(d, d * 0.15), random.uniform(0.05, 0.09), random.uniform(0.5, 0.9))
SPELLS.append(m.done())

m = Mesh('beam', S, loc=(16, 0, 0))  # open unit tube; the game shades it as a rising light pillar
m.lathe(shock, [(1, 0), (0.8, 1)], n=40, caps=False)
SPELLS.append(m.done(False))
m = Mesh('glow_disc', S, loc=(18.5, 0, 0))
m.flat(shock, [pol(1, TAU * i / 48) for i in range(48)])
SPELLS.append(m.done(False))

m = Mesh('overload_burst', S, loc=(14, 0, 0.8))
m.ico(lh, 0.3, smooth=True)
for i in range(18):
    d = Vector((random.uniform(-1, 1), random.uniform(-1, 1), random.uniform(-1, 1))).normalized()
    m.lathe(fh if i % 2 else lh, [(0.09, 0), (0, random.uniform(0.8, 1.4))], n=5, M=aim(d, d * 0.2))
SPELLS.append(m.done())


# ---------- first-person rig (camera at origin, looking Blender +Y) ----------
RIG = coll('fp_rig')
glove = mat('glove', (0.09, 0.055, 0.04), rough=0.65)
gold = mat('gold', (0.95, 0.68, 0.25), rough=0.3, metal=1)
robe = mat('robe', (0.12, 0.06, 0.25), rough=0.8)
wood = mat('wood', (0.28, 0.15, 0.07), rough=0.7)
hand_rune = mat('hand_rune', (0.55, 0.25, 1.0), emit=6)
gem_mat = mat('staff_gem', (0.55, 0.25, 1.0), emit=8)


def digit(mesh, M, L, curl, r0, r1):
    """Stylized finger: 3 tapering segments (45/32/23% of L) along local +Z, each bent by curl[k] about local X
    (positive curls toward local -Y), with a small knuckle bump at every joint."""
    segs = [L * 0.45, L * 0.32, L * 0.23]
    for k, s in enumerate(segs):
        ra = r0 + (r1 - r0) * k / 3; rb = r0 + (r1 - r0) * (k + 1) / 3
        tip = k == 2
        mesh.lathe(glove, [(0, -ra * 0.2), (ra * 0.9, 0), (ra, ra * 0.5), (rb, s - rb * 0.4),
                           (rb * (0.6 if tip else 0.9), s + (rb * 0.3 if tip else 0)), (0, s + (rb * 0.6 if tip else rb * 0.2))],
                   n=10, M=M, smooth=True)
        if k:  # knuckle
            mesh.sphere(glove, ra * 1.08, M @ Matrix.Translation((0, ra * 0.15, 0)), u=10, v=6)
        M = M @ Matrix.Translation((0, 0, s)) @ Matrix.Rotation(curl[k] if k < len(curl) else 0, 4, 'X')
    return M


def finger(mesh, M, base, L, rot, r=0.0095, curl=(-0.12, -0.2, -0.22)):
    digit(mesh, M @ TRS(base, rot), L, curl, r, r * 0.78)


def palm(mesh, M, w, t, h=0.045):
    """Flattened rounded slab (w half-width along X, t half-thickness along Y), flat-ish top for the knuckles."""
    mesh.lathe(glove, [(0, -h), (0.6, -h * 0.94), (0.92, -h * 0.65), (1, -h * 0.2), (1, h * 0.55), (0.93, h * 0.85), (0.6, h), (0, h * 1.02)],
               n=16, M=M @ Matrix.Diagonal((w, t, 1, 1)), smooth=True)


def open_hand(mesh, M=I):
    """Relaxed open hand: palm facing local +Y, fingers up (+Z), thumb toward +X. Shared by the first-person rig and the wizard."""
    palm(mesh, M, 0.045, 0.018)
    for x, L, r in [(-0.03, 0.066, 0.0085), (-0.01, 0.08, 0.0094), (0.01, 0.086, 0.0098), (0.03, 0.08, 0.0096)]:  # pinky .. index
        finger(mesh, M, (x, 0.002, 0.036), L, (-0.2, x * 4, 0), r)
    finger(mesh, M, (0.038, 0.004, -0.012), 0.058, (-0.45, 0.95, 0), 0.011, (-0.15, -0.18))  # thumb: 2 short bends


def fist(mesh, M=I):
    """Hand gripping a staff along local Z: back of the hand on +X, fingers round the far side (-X), thumb over the -Y side."""
    palm(mesh, M @ Matrix.Translation((0.038, 0.005, 0.004)), 0.018, 0.042, 0.042)
    for i in range(4):
        digit(mesh, M @ basis((0.03, 0.03, 0.03 - i * 0.017), (0, 0, 1), (0, 1, 0), (-1, 0, 0)), 0.085 - i * 0.007, (0.9, 0.8), 0.0098, 0.0078)
    digit(mesh, M @ basis((0.032, -0.028, 0.038), (0, 0, -1), (0, -1, 0), (-1, 0, 0)), 0.06, (0.5, 0.4), 0.011, 0.0088)


def sleeve(mesh, wrist, d):
    M = aim(d, wrist)
    mesh.lathe(gold, [(0.036, -0.01), (0.048, -0.005), (0.048, 0.03), (0.036, 0.035)], n=20, M=M, closed=True, smooth=True)
    mesh.lathe(robe, [(0, 0.02), (0.05, 0.02), (0.062, 0.08), (0.078, 0.25), (0.088, 0.45), (0, 0.45)], n=16, M=M, smooth=True)


# Left hand: open casting palm facing forward (+Y), fingers up (+Z), back of hand toward camera.
hl = Mesh('hand_L', RIG, loc=(-0.2, 0.42, -0.2), rot=(math.radians(-15), 0, math.radians(20)))
open_hand(hl)
sleeve(hl, (0, 0, -0.045), (0, -0.25, -1))
back = Matrix.Translation((0, -0.0205, 0.004)) @ Matrix.Rotation(math.pi / 2, 4, 'X')
hl.annulus(hand_rune, 0.017, 0.021, n=24, M=back)
hl.polyline(hand_rune, [pol(0.014, math.pi / 2 + i * TAU / 3) for i in range(3)], 0.003, closed=True, M=back)
hand_L = hl.done()

# Right hand: fist gripping the staff (staff axis = local Z through origin).
hr = Mesh('hand_R', RIG, loc=(0.24, 0.5, -0.32), rot=(math.radians(-12), math.radians(8), math.radians(-12)))
fist(hr)
sleeve(hr, (0.03, -0.01, -0.035), (0.35, -0.35, -1))
hand_R = hr.done()

st = Mesh('staff', RIG, parent=hand_R)
st.lathe(wood, [(0, -0.75), (0.013, -0.75), (0.017, -0.5), (0.017, 0.74), (0.0, 0.74)], n=12, smooth=True)
for z in (-0.06, 0.06, 0.5):
    st.lathe(gold, [(0.016, z - 0.012), (0.021, z - 0.008), (0.021, z + 0.008), (0.016, z + 0.012)], n=12, closed=True, smooth=True)
st.lathe(gold, [(0, 0.72), (0.02, 0.72), (0.034, 0.8), (0.03, 0.86), (0, 0.86)], n=12, smooth=True)
for i in range(3):  # claw prongs cradling the gem
    a = TAU * i / 3
    base = Vector((*pol(0.028, a), 0.84))
    mid = Vector((*pol(0.07, a), 0.94))
    tip = Vector((*pol(0.03, a + 0.4), 1.06))
    st.lathe(gold, [(0.009, 0), (0.007, (mid - base).length)], n=6, M=aim(mid - base, base))
    st.lathe(gold, [(0.007, 0), (0, (tip - mid).length)], n=6, M=aim(tip - mid, mid))
staff = st.done()

gm = Mesh('staff_gem', RIG, loc=(0, 0, 0.88), parent=staff)
crystal(gm, gem_mat, I, 0.035, 0.17)
staff_gem = gm.done()
RIG_OBJS = [hand_L, hand_R, staff, staff_gem]


# ---------- arena: floating ruined temple ----------
A = coll('arena')
stone_a = mat('stone_a', (0.42, 0.4, 0.43), rough=0.9)
stone_b = mat('stone_b', (0.33, 0.32, 0.37), rough=0.9)
stone_moss = mat('stone_moss', (0.24, 0.33, 0.22), rough=0.95)
grout = mat('grout', (0.05, 0.05, 0.07), rough=1)
slab = mat('slab', (0.08, 0.07, 0.11), rough=0.3, metal=0.1)
rock = mat('rock', (0.19, 0.16, 0.19), rough=0.95)
bronze = mat('bronze', (0.55, 0.35, 0.15), rough=0.35, metal=0.9)
cr_cyan = mat('crystal_cyan', (0.3, 0.9, 1.0), emit=3)
cr_violet = mat('crystal_violet', (0.7, 0.35, 1.0), emit=3)
ARENA_R = 22.6

m = Mesh('arena_floor', A)
m.lathe(grout, [(0, -0.5), (ARENA_R, -0.5), (ARENA_R + 0.3, -0.25), (ARENA_R, 0.0), (0, 0.0)], n=96)
m.prism(slab, [pol(5.0, TAU * i / 64) for i in range(64)], 0, 0.05)
floor = m.done()

m = Mesh('arena_tiles', A)
r = 5.1
while r < 22.2:
    r1 = min(r + 1.7, 22.3)
    n = max(8, round(TAU * (r + r1) / 2 / 1.9))
    off = random.random() * TAU
    for j in range(n):
        if random.random() < 0.04:
            continue
        a0, a1 = off + TAU * j / n + 0.05 / r, off + TAU * (j + 1) / n - 0.05 / r
        inner = [pol(r + 0.05, a0 + (a1 - a0) * t / 3) for t in range(4)]
        outer = [pol(r1 - 0.05, a0 + (a1 - a0) * t / 3) for t in range(4)]
        m.prism(random.choices([stone_a, stone_b, stone_moss], [5, 4, 1])[0], inner + outer[::-1], 0, random.uniform(0.04, 0.11))
    r = r1
tiles = m.done()

m = Mesh('arena_walls', A)
a = 0
while a < TAU - 0.3:
    span, gap = random.uniform(0.25, 0.5), random.uniform(0.15, 0.45)
    steps = int(span / 0.05)
    for k in range(steps):
        b0 = a + k * 0.05
        h = random.uniform(0.3, 1.4) * (0.4 + 0.6 * math.sin((k + 0.5) / steps * math.pi))
        if any(abs((b0 + 0.025 - g + math.pi) % TAU - math.pi) < 0.16 for g in (3.7699, 5.6549)):
            continue  # open where the bridges to the Crypt and from the Void land (blender/build_islands.py lane_angle)
        m.prism(random.choice([stone_a, stone_b]), [pol(21.8, b0), pol(22.5, b0), pol(22.5, b0 + 0.05), pol(21.8, b0 + 0.05)], 0, h + 0.1)
    a += span + gap
walls = m.done()

m = Mesh('arena_underside', A)
m.lathe(rock, [(ARENA_R, -0.45), (21.0, -2.5), (18.0, -4.5), (14.0, -7.0), (9.0, -10.0), (4.0, -13.0), (0, -15.5)], n=48, noise=0.7)
for _ in range(14):
    rho, ang = random.uniform(5, 19), random.uniform(0, TAU)
    zs = -0.5 - (ARENA_R - rho) * 0.68
    m.lathe(rock, [(0, 0.6), (random.uniform(0.8, 1.8), 0), (0, -random.uniform(2, 5))], n=7,
            M=Matrix.Translation((*pol(rho, ang), zs)), noise=0.2)
underside = m.done()

PILLARS = []
square = lambda s: [(-s, -s), (s, -s), (s, s), (-s, s)]
for i in range(8):
    a = TAU * i / 8 + TAU / 16
    intact = i in (0, 3, 5)
    m = Mesh(f'pillar_{i}', A, loc=(*pol(16.5, a), 0))
    m.prism(stone_b, square(0.9), 0, 0.35)
    m.prism(stone_a, square(0.75), 0.35, 0.6)
    H = 7.5 if intact else random.uniform(2.2, 4.8)
    if intact:
        m.lathe(stone_a, [(0, 0.6), (0.62, 0.6), (0.55, 0.75), (0.55, H), (0.7, H + 0.2), (0.8, H + 0.45), (0, H + 0.45)], n=16, flute=0.05)
        m.prism(stone_b, square(0.95), H + 0.45, H + 0.8)
    else:
        m.lathe(stone_a, [(0, 0.6), (0.62, 0.6), (0.55, 0.75), (0.55, H), (0, H - 0.2)], n=16, flute=0.05, jag=0.35)
    PILLARS.append(m.done())

m = Mesh('arena_rubble', A)
for i in range(8):
    if i in (0, 3, 5):
        continue
    a = TAU * i / 8 + TAU / 16
    for _ in range(2):
        x, y = pol(16.5 + random.uniform(-3, 3), a + random.uniform(-0.15, 0.15))
        m.lathe(stone_a, [(0, -0.8), (0.5, -0.8), (0.5, 0.8), (0, 0.8)], n=16, flute=0.05,
                M=TRS((x, y, 0.48), (math.pi / 2, 0, random.uniform(0, TAU))))
    for _ in range(4):
        x, y = pol(16.5 + random.uniform(-2.5, 2.5), a + random.uniform(-0.2, 0.2))
        m.ico(stone_b, random.uniform(0.2, 0.45), Matrix.Translation((x, y, 0.15)), sub=1, noise=0.08)
rubble = m.done()

BRAZIERS = []
for i in range(4):
    x, y = pol(10, TAU * i / 4)
    m = Mesh(f'brazier_{i}', A, loc=(x, y, 0))
    m.lathe(bronze, [(0, 0), (0.45, 0), (0.45, 0.12), (0.2, 0.25), (0.13, 0.9), (0.2, 1.0), (0.55, 1.15),
                     (0.62, 1.32), (0.5, 1.32), (0.3, 1.2), (0, 1.18)], n=16, smooth=True)
    m.ico(GLOW['fire'][0], 0.32, Matrix.Translation((0, 0, 1.2)), sub=1, noise=0.08)
    BRAZIERS.append(m.done())
    m = Mesh(f'brazier_flame_{i}', A, loc=(x, y, 1.2))
    m.lathe(GLOW['fire'][0], [(0, 0), (0.38, 0.12), (0.32, 0.45), (0.16, 0.85), (0, 1.25)], n=7, noise=0.04, twist=0.4)
    m.lathe(GLOW['fire'][1], [(0, 0.05), (0.2, 0.12), (0.15, 0.4), (0, 0.75)], n=6, twist=0.5)
    BRAZIERS.append(m.done())

CRYSTALS = []
for i in range(8):
    m = Mesh(f'crystal_{i}', A, loc=(*pol(19.5, TAU * i / 8), 0))
    cm = cr_cyan if i % 2 else cr_violet
    for _ in range(random.randint(3, 5)):
        crystal(m, cm, TRS((random.uniform(-0.4, 0.4), random.uniform(-0.4, 0.4), -0.05),
                           (random.uniform(-0.45, 0.45), random.uniform(-0.45, 0.45), random.uniform(0, TAU))),
                random.uniform(0.12, 0.28), random.uniform(0.8, 2.2))
    CRYSTALS.append(m.done())

FLOATERS = []
for i in range(16):
    m = Mesh(f'float_rock_{i}', A, loc=(*pol(random.uniform(27, 45), TAU * i / 16 + random.uniform(-0.15, 0.15)), random.uniform(-6, 9)))
    s = random.uniform(1, 3.2)
    m.ico(rock, 1, TRS(scale=(s, s * random.uniform(0.7, 1.2), s * random.uniform(0.5, 0.9))), sub=1, noise=0.25)
    if random.random() < 0.35:
        crystal(m, random.choice([cr_cyan, cr_violet]), TRS((0, 0, s * 0.5), (0.2, 0.1, 0)), 0.2 * s, 1.0 * s)
    FLOATERS.append(m.done())

for i in range(4):
    R = random.uniform(6, 12)
    m = Mesh(f'far_island_{i}', A, loc=(*pol(random.uniform(80, 120), TAU * i / 4 + 0.6), random.uniform(-15, 10)))
    m.lathe(rock, [(0, 0), (R, 0), (R * 0.8, -R * 0.4), (R * 0.4, -R * 0.9), (0, -R * 1.2)], n=20, noise=R * 0.05)
    m.lathe(stone_moss, [(0, 0.3), (R * 0.95, 0.3), (R * 0.98, 0.0), (0, 0.0)], n=20)
    for _ in range(2):
        m.lathe(stone_a, [(0, 0), (0.6, 0), (0.6, random.uniform(3, 7)), (0, random.uniform(3, 7))],
                n=10, M=Matrix.Translation((*pol(random.uniform(0, R * 0.6), random.uniform(0, TAU)), 0)))
    m.done()

SIGIL = spell_circle(A, 'arcane', 'fire', prefix='sigil_', loc=(0, 0, 0.056), scale=4.6)

# ---------- arena dressing ----------
banner_mat = mat('banner', (0.17, 0.04, 0.3), rough=0.85)
root_mat = mat('root', (0.15, 0.09, 0.06), rough=0.9)
grass = mat('grass', (0.14, 0.3, 0.1), rough=0.8)
mana = mat('manafall', (0.3, 0.85, 1.0), emit=4)
ag, ah = GLOW['arcane']
UPZ = Vector((0, 0, 1))

# banners on the intact pillars, origin at the top rod so the game can sway them
for i in (0, 3, 5):
    a = TAU * i / 8 + TAU / 16
    inward = Vector((-math.cos(a), -math.sin(a), 0))
    side = Vector((-inward.y, inward.x, 0))
    top = Vector((*pol(16.5, a), 7.2)) + inward * 0.66
    m = Mesh(f'banner_{i}', A, loc=tuple(top))
    W, H, rows = 0.95, 3.6, 12
    grid = []
    for r_ in range(rows + 1):
        t = r_ / rows
        row = []
        for cx in (-0.5, 0, 0.5):
            z = -H * t + (0.55 if r_ == rows and cx == 0 else 0)  # swallowtail notch
            row.append(m.bm.verts.new(side * cx * W + inward * (0.07 * math.sin(t * math.pi) + 0.03 * math.sin(t * 8 + cx * 3)) + UPZ * z))
        grid.append(row)
    faces = [m.bm.faces.new((grid[r_][c], grid[r_][c + 1], grid[r_ + 1][c + 1], grid[r_ + 1][c])) for r_ in range(rows) for c in range(2)]
    m._tag(faces, banner_mat, True)
    E = basis(inward * 0.12 + UPZ * -1.35, side, UPZ, inward)
    m.annulus(ah, 0.26, 0.3, n=32, M=E)
    m.polyline(ah, [pol(0.25, math.pi / 2 + k * TAU / 3) for k in range(3)], 0.025, closed=True, M=E)
    m.polyline(ah, [pol(0.25, -math.pi / 2 + k * TAU / 3) for k in range(3)], 0.025, closed=True, M=E)
    m.lathe(gold, [(0.035, 0), (0.035, W + 0.25)], n=8, M=aim(side, -side * (W / 2 + 0.12)), smooth=True)
    m.done(False)

# roots dangling from the island's underside
m = Mesh('arena_roots', A)
for _ in range(40):
    ang, rho = random.uniform(0, TAU), random.uniform(14, 22.4)
    p = Vector((*pol(rho, ang), -0.2 - (ARENA_R - rho) * 0.68))
    r, L, d = random.uniform(0.08, 0.17), random.uniform(3, 9), Vector((0, 0, -1))
    for s_ in range(6):
        d = Vector((d.x + random.uniform(-0.4, 0.4), d.y + random.uniform(-0.4, 0.4), -1)).normalized()
        r1 = r * (1 - 0.14 * (s_ + 1))
        m.lathe(root_mat, [(r, 0), (r1, L / 6 + 0.05)], n=6, M=aim(d, p))
        p, r = p + d * L / 6, r1
roots = m.done()

# a broken archway near the rim; its posts are named pillar_* so the game treats them as obstacles
ga = math.pi / 2 + 0.33
gc = Vector((*pol(20.2, ga), 0))
gside = Vector((-math.sin(ga), math.cos(ga), 0))
gin = Vector((-math.cos(ga), -math.sin(ga), 0))
for k, s_ in ((8, -1), (9, 1)):
    m = Mesh(f'pillar_{k}', A, loc=tuple(gc + gside * 2.3 * s_))
    m.prism(stone_b, square(0.85), 0, 0.4)
    m.lathe(stone_a, [(0, 0.4), (0.62, 0.4), (0.55, 0.55), (0.55, 6.0), (0.7, 6.2), (0, 6.2)], n=8)
    m.done()
m = Mesh('arena_gate_arch', A)
for k in range(9):
    if k in (6, 7, 8):  # the right side of the arch has collapsed
        continue
    th = math.pi * (k + 0.5) / 9
    tang = -gside * math.sin(th) + UPZ * math.cos(th)
    rad = gside * math.cos(th) + UPZ * math.sin(th)
    m.cube(random.choice([stone_a, stone_b]), basis(gc + UPZ * 6.2 + rad * 2.3, tang, gin, rad, (0.78, 0.7, 0.55)))
for _ in range(5):  # fallen voussoirs
    m.cube(stone_b, TRS(tuple(gc + gside * random.uniform(0.5, 2.8) + gin * random.uniform(-1.2, 1.2) + UPZ * 0.25),
                         (random.uniform(-0.3, 0.3), random.uniform(-0.3, 0.3), random.uniform(0, TAU)), (0.7, 0.6, 0.5)))
gate = m.done()

# glowing mana falls pouring off the island edge (UV'd so the game can scroll them)
for i, fa in enumerate((-0.9, 2.3)):
    rad_v = Vector((math.cos(fa), math.sin(fa), 0))
    side_v = Vector((-math.sin(fa), math.cos(fa), 0))
    cs, ws = [], []
    for k in range(25):
        s_ = k / 24
        cs.append(rad_v * (22.3 + 3.4 * math.sqrt(s_)) + UPZ * (-0.6 - 26 * s_ * s_))
        ws.append(1.4 + 2.4 * s_)
    uv_ribbon(f'manafall_{i}', A, mana, cs, ws, [side_v] * len(cs))

# floating rune monoliths orbiting the island (the game spins them)
for i in range(8):
    a = TAU * i / 8 + 0.2
    m = Mesh(f'monolith_{i}', A, loc=(*pol(28 + random.uniform(-1.5, 1.5), a), random.uniform(1, 6)), rot=(0, 0, a))
    m.lathe(stone_b, [(0, -2.1), (0.55, -1.8), (0.42, 1.6), (0, 2.2)], n=4)
    for z in (-0.7, 0, 0.7):
        rr = 0.55 - 0.13 * (z + 1.8) / 3.4
        m.lathe(ah, [(rr + 0.01, z - 0.04), (rr + 0.04, z - 0.03), (rr + 0.04, z + 0.03), (rr + 0.01, z + 0.04)], n=4, closed=True)
    m.done()

# grass tufts along the walls, around pillar bases and scattered over mossy tiles
m = Mesh('arena_grass', A)
pillar_xy = [Vector((*pol(16.5, TAU * i / 8 + TAU / 16), 0)) for i in range(8)]
for k in range(300):
    if k < 130:
        c = Vector((*pol(random.uniform(20.8, 21.7), random.uniform(0, TAU)), 0))
    elif k < 210:
        c = random.choice(pillar_xy) + Vector((*pol(random.uniform(0.9, 1.6), random.uniform(0, TAU)), 0))
    else:
        c = Vector((*pol(random.uniform(6, 20), random.uniform(0, TAU)), 0))
    for _ in range(random.randint(4, 8)):
        h = random.uniform(0.15, 0.45)
        m.lathe(grass, [(0.022, 0), (0, h)], n=3, M=TRS(tuple(c + Vector((random.uniform(-0.15, 0.15), random.uniform(-0.15, 0.15), 0.06))),
                                                        (random.uniform(-0.45, 0.45), random.uniform(-0.45, 0.45), random.uniform(0, TAU))))
grass_ob = m.done()

# finishing: chamfer the stonework so edges catch light, then bake AO + colour variation into vertex colours
bpy.context.view_layer.update()
for ob in [tiles, walls, gate, rubble] + PILLARS + [o for o in A.objects if o.name in ('pillar_8', 'pillar_9')]:
    apply_bevel(ob, 0.035 if ob is tiles else 0.05, segs=1 if ob is tiles else 2)  # ~450 tiles: one chamfer keeps the glb small
apply_bevel(floor, 0.06, angle=50)
bpy.context.view_layer.update()
STATIC = [o for o in A.objects if o.type == 'MESH' and not o.name.startswith(('sigil_', 'brazier_flame_', 'crystal_', 'manafall_', 'far_island_'))]
bake_ao([o for o in STATIC if o is not tiles], STATIC, tint=(0.88, 1.0))
bake_ao([tiles], STATIC, tint=(0.7, 1.0))  # tiles get stronger per-tile colour variation


# ---------- duel platform: a smaller floating plaza for 1v1 (radius 14 = the game's DUEL_R; off the edge = ring-out) ----------
# Spawns are at Blender y = -9 / +9 (game z = +9 / -9). Pillars named duel_pillar_* become obstacles; duel_flame_* get fire + light.
D = coll('duel')
DUEL_R = 14.0
m = Mesh('duel_floor', D)
m.lathe(grout, [(0, -0.5), (DUEL_R, -0.5), (DUEL_R + 0.25, -0.25), (DUEL_R, 0.0), (0, 0.0)], n=80)
m.lathe(stone_b, [(DUEL_R - 0.9, 0.0), (DUEL_R, 0.0), (DUEL_R, 0.16), (DUEL_R - 0.9, 0.16)], n=80, closed=True)  # dark rim band
dfloor = m.done()
m = Mesh('duel_tiles', D)
T = 1.55
for ix in range(-9, 10):
    for iy in range(-9, 10):
        cx, cy = ix * T, iy * T
        if math.hypot(cx, cy) > DUEL_R - 1.6 or random.random() < 0.03:
            continue
        h = 0.06 if math.hypot(cx, cy) > 3.2 else 0.04
        m.prism(random.choices([stone_a, stone_b, stone_moss], [5, 4, 1])[0], square(T / 2 - 0.05), 0, random.uniform(h * 0.6, h * 1.4), M=Matrix.Translation((cx, cy, 0)))
dtiles = m.done()
m = Mesh('duel_inlay', D)  # gold dueling circle split by a line between the two spawns
m.annulus(gold, 3.0, 3.18, 0.075, n=72)
m.annulus(gold, 1.2, 1.3, 0.075, n=48)
m.prism(gold, [(-0.05, -3.0), (0.05, -3.0), (0.05, 3.0), (-0.05, 3.0)], 0.07, 0.08)
for sy in (-9, 9):
    m.annulus(gold, 0.9, 1.0, 0.075, n=40, M=Matrix.Translation((0, sy, 0)))
dinlay = m.done()
m = Mesh('duel_underside', D)
m.lathe(rock, [(DUEL_R, -0.45), (13.0, -2.2), (10.5, -4.0), (7.0, -6.5), (3.0, -9.5), (0, -11.5)], n=40, noise=0.6)
for _ in range(9):
    rho, ang = random.uniform(4, 12.5), random.uniform(0, TAU)
    m.lathe(rock, [(0, 0.6), (random.uniform(0.7, 1.5), 0), (0, -random.uniform(2, 4.5))], n=7,
            M=Matrix.Translation((*pol(rho, ang), -0.5 - (DUEL_R - rho) * 0.75)), noise=0.2)
dunder = m.done()
m = Mesh('duel_wall', D)  # low ruined wall along the rim, with gaps so ring-outs stay possible everywhere
a = 0
while a < TAU - 0.2:
    span, gap = random.uniform(0.2, 0.4), random.uniform(0.35, 0.7)
    steps = int(span / 0.06)
    for k in range(steps):
        b0 = a + k * 0.06
        h = random.uniform(0.2, 0.75) * (0.4 + 0.6 * math.sin((k + 0.5) / steps * math.pi))
        m.prism(random.choice([stone_a, stone_b]), [pol(DUEL_R - 0.55, b0), pol(DUEL_R - 0.05, b0), pol(DUEL_R - 0.05, b0 + 0.06), pol(DUEL_R - 0.55, b0 + 0.06)], 0.15, 0.15 + h)
    a += span + gap
dwall = m.done()
DPILLARS = []
for i in range(4):
    a = TAU * i / 4 + TAU / 8
    m = Mesh(f'duel_pillar_{i}', D, loc=(*pol(7.2, a), 0))
    m.prism(stone_b, square(0.85), 0, 0.35)
    m.prism(stone_a, square(0.7), 0.35, 0.55)
    H = 6.0 if i % 2 == 0 else random.uniform(2.4, 3.6)
    if i % 2 == 0:
        m.lathe(stone_a, [(0, 0.55), (0.6, 0.55), (0.52, 0.7), (0.52, H), (0.68, H + 0.2), (0.78, H + 0.42), (0, H + 0.42)], n=16, flute=0.05)
        m.prism(stone_b, square(0.9), H + 0.42, H + 0.75)
        for z in (1.4, 3.0, 4.6):  # rune bands that glow like the arena monoliths
            m.lathe(ah, [(0.53, z - 0.05), (0.56, z - 0.04), (0.56, z + 0.04), (0.53, z + 0.05)], n=16, closed=True)
    else:
        m.lathe(stone_a, [(0, 0.55), (0.6, 0.55), (0.52, 0.7), (0.52, H), (0, H - 0.2)], n=16, flute=0.05, jag=0.35)
    DPILLARS.append(m.done())
m = Mesh('duel_rubble', D)
for _ in range(14):
    x, y = pol(random.uniform(5, 12.5), random.uniform(0, TAU))
    if abs(x) < 2.5 and abs(abs(y) - 9) < 2.5:  # keep the spawns clear
        continue
    m.ico(stone_b, random.uniform(0.18, 0.42), Matrix.Translation((x, y, 0.15)), sub=1, noise=0.08)
drubble = m.done()
for i, sy in enumerate((-11.6, 11.6)):  # a brazier behind each spawn
    for k, sx in enumerate((-2.2, 2.2)):
        n_ = i * 2 + k
        m = Mesh(f'duel_brazier_{n_}', D, loc=(sx, sy, 0))
        m.lathe(bronze, [(0, 0), (0.42, 0), (0.42, 0.12), (0.2, 0.25), (0.12, 0.85), (0.2, 0.95), (0.5, 1.1),
                         (0.58, 1.26), (0.46, 1.26), (0.28, 1.15), (0, 1.13)], n=16, smooth=True)
        m.done()
        m = Mesh(f'duel_flame_{n_}', D, loc=(sx, sy, 1.15))
        m.lathe(GLOW['fire'][0], [(0, 0), (0.34, 0.11), (0.29, 0.42), (0.15, 0.8), (0, 1.15)], n=7, noise=0.04, twist=0.4)
        m.done()
for i in range(10):  # rocks drifting around the plaza
    m = Mesh(f'duel_rock_{i}', D, loc=(*pol(random.uniform(19, 34), TAU * i / 10 + random.uniform(-0.2, 0.2)), random.uniform(-5, 7)))
    s = random.uniform(0.8, 2.6)
    m.ico(rock, 1, TRS(scale=(s, s * random.uniform(0.7, 1.2), s * random.uniform(0.5, 0.9))), sub=1, noise=0.25)
    if random.random() < 0.4:
        crystal(m, random.choice([cr_cyan, cr_violet]), TRS((0, 0, s * 0.5), (0.2, 0.1, 0)), 0.2 * s, 1.0 * s)
    m.done()
bpy.context.view_layer.update()
for ob in [dtiles, dwall, drubble] + DPILLARS:
    apply_bevel(ob, 0.035 if ob is dtiles else 0.05, segs=1 if ob is dtiles else 2)
DSTATIC = [o for o in D.objects if o.type == 'MESH' and not o.name.startswith(('duel_flame_', 'duel_rock_', 'duel_inlay'))]
bake_ao([o for o in DSTATIC if o is not dtiles], DSTATIC, tint=(0.88, 1.0))
bake_ao([dtiles], DSTATIC, tint=(0.7, 1.0))
DUEL = list(D.objects)


shadow = mat('shadow', (0.07, 0.05, 0.09), rough=0.8)


def limb(mesh, m, start, d, L, r0, r1, n=10, smooth=True):
    mesh.lathe(m, [(0, 0), (r0, 0.03), (r1, L - 0.03), (0, L)], n=n, M=aim(d, start), smooth=smooth)


# ---------- teammate wizard (third-person body, facing Blender -Y) ----------
W = coll('wizard')
m = Mesh('wizard', W, loc=(0, 10, 0))
m.lathe(robe, [(0, 0), (0.55, 0), (0.5, 0.3), (0.38, 0.9), (0.3, 1.3), (0.22, 1.45), (0, 1.5)], n=16, smooth=True)
m.lathe(gold, [(0.33, 0.82), (0.4, 0.84), (0.4, 0.9), (0.33, 0.92)], n=16, closed=True, smooth=True)
m.sphere(robe, 0.24, TRS((0, 0, 1.62)))
m.sphere(shadow, 1, TRS((0, -0.1, 1.6), scale=(0.17, 0.11, 0.19)))
for sx in (-1, 1):
    m.sphere(hand_rune, 0.03, TRS((sx * 0.065, -0.2, 1.63)), u=8, v=6)
    limb(m, robe, (sx * 0.28, 0, 1.3), (sx * 0.25, -0.5, -0.8), 0.6, 0.1, 0.12)
m.lathe(robe, [(0, 1.74), (0.46, 1.74), (0.46, 1.78), (0.2, 1.84), (0.13, 2.1), (0.05, 2.38), (0, 2.45)], n=16, smooth=True)
m.lathe(gold, [(0.19, 1.8), (0.22, 1.81), (0.2, 1.88), (0.17, 1.88)], n=16, closed=True)
m.lathe(wood, [(0, 0), (0.025, 0), (0.025, 1.95), (0, 1.95)], n=8, M=Matrix.Translation((0.45, -0.3, 0)), smooth=True)
open_hand(m, TRS((-0.42, -0.3, 0.86), (math.pi, 0, math.pi / 2), (2.1, 2.1, 2.1)))  # same hands as first person, scaled up
fist(m, TRS((0.45, -0.3, 0.92), scale=(2.1, 2.1, 2.1)))
crystal(m, gem_mat, Matrix.Translation((0.45, -0.3, 1.92)), 0.06, 0.28)
WIZARD = [m.done()]


# ---------- save, export, render ----------
bpy.context.view_layer.update()
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(HERE, 'mage_pact.blend'))
ARENA = list(A.objects)
export('spells.glb', SPELLS)
export('fp_rig.glb', RIG_OBJS)
export('arena.glb', ARENA)
export('duel.glb', DUEL)
export('wizard.glb', WIZARD)
pack_bundle()

pv = Previewer()
pv.render('spells', SPELLS, dirv=(0.2, -1, 0.45))
pv.render('fp_rig', RIG_OBJS, view=((0, 0, 0), (0, 1, -0.12)), lens=23.5)
core = [floor, tiles, walls, underside] + PILLARS
pv.render('arena_overview', ARENA, frame=core, dirv=(1, -1.2, 0.8))
pv.render('arena_eye', ARENA, view=((0, -14, 1.7), (0, 6, 2.2)), lens=20)
pv.render('duel_overview', DUEL, frame=[dfloor, dtiles] + DPILLARS, dirv=(1, -1.2, 0.8))
pv.render('duel_eye', DUEL, view=((0, -10.5, 1.7), (0, 6, 1.6)), lens=20)
pv.render('wizard', WIZARD, dirv=(0.5, -1, 0.3))
print('MAGE_PACT_BUILD_OK')
