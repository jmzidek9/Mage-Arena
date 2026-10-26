# Shared helpers for the Mage Pact Blender build scripts (build_assets / build_elements / build_enemies).
import bpy, bmesh, math, os, random, base64, json
from mathutils import Vector, Matrix, Euler

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
ASSETS = os.path.join(ROOT, 'assets')
RENDERS = os.path.join(HERE, 'renders')
os.makedirs(ASSETS, exist_ok=True)
os.makedirs(RENDERS, exist_ok=True)
TAU = math.tau
I = Matrix.Identity(4)


def reset():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    return bpy.context.scene


def mat(name, color, emit=0.0, rough=0.6, metal=0.0, ecolor=None, alpha=1.0):
    m = bpy.data.materials.new(name)
    try:
        m.use_nodes = True
    except Exception:
        pass
    nt = m.node_tree
    p = next((n for n in nt.nodes if n.type == 'BSDF_PRINCIPLED'), None)
    if p is None:
        p = nt.nodes.new('ShaderNodeBsdfPrincipled')
        out = next((n for n in nt.nodes if n.type == 'OUTPUT_MATERIAL'), None) or nt.nodes.new('ShaderNodeOutputMaterial')
        nt.links.new(p.outputs[0], out.inputs[0])
    p.inputs['Base Color'].default_value = (*color, 1)
    p.inputs['Roughness'].default_value = rough
    p.inputs['Metallic'].default_value = metal
    if alpha < 1:
        p.inputs['Alpha'].default_value = alpha
    if emit:
        p.inputs['Emission Color'].default_value = (*(ecolor or color), 1)
        p.inputs['Emission Strength'].default_value = emit
    m.diffuse_color = (*(ecolor or color), 1)
    return m


def coll(name):
    c = bpy.data.collections.new(name)
    bpy.context.scene.collection.children.link(c)
    return c


def TRS(loc=(0, 0, 0), rot=(0, 0, 0), scale=(1, 1, 1)):
    return Matrix.LocRotScale(Vector(loc), Euler(rot), Vector(scale))


def aim(d, loc=(0, 0, 0), scale=(1, 1, 1)):
    """Matrix whose local +Z points along d."""
    return Matrix.LocRotScale(Vector(loc), Vector(d).normalized().to_track_quat('Z', 'Y'), Vector(scale))


def pol(r, a):
    return (r * math.cos(a), r * math.sin(a))


def area(pts):
    return sum(pts[i][0] * pts[(i + 1) % len(pts)][1] - pts[(i + 1) % len(pts)][0] * pts[i][1] for i in range(len(pts)))


class Mesh:
    def __init__(s, name, col, loc=(0, 0, 0), rot=(0, 0, 0), parent=None):
        s.name, s.col, s.loc, s.rot, s.parent = name, col, loc, rot, parent
        s.bm = bmesh.new()
        s.mats = []

    def mi(s, m):
        if m not in s.mats:
            s.mats.append(m)
        return s.mats.index(m)

    def _tag(s, faces, m, smooth):
        i = s.mi(m)
        for f in faces:
            f.material_index = i
            f.smooth = smooth

    def _prim(s, res, m, smooth, noise, center):
        vs = res['verts']
        if noise:
            for v in vs:
                v.co += (v.co - center).normalized() * random.uniform(-noise, noise)
        s._tag({f for v in vs for f in v.link_faces}, m, smooth)

    def ico(s, m, r, M=I, sub=2, noise=0, smooth=False):
        s._prim(bmesh.ops.create_icosphere(s.bm, subdivisions=sub, radius=r, matrix=M), m, smooth, noise, M.translation)

    def cube(s, m, M=I):
        s._prim(bmesh.ops.create_cube(s.bm, size=1, matrix=M), m, False, 0, M.translation)

    def sphere(s, m, r, M=I, u=16, v=10, noise=0, smooth=True):
        s._prim(bmesh.ops.create_uvsphere(s.bm, u_segments=u, v_segments=v, radius=r, matrix=M), m, smooth, noise, M.translation)

    def lathe(s, m, prof, n=16, M=I, noise=0, twist=0, flute=0, jag=0, closed=False, smooth=False, caps=True):
        """Revolve [(radius, z), ...] around local Z."""
        bm, rings = s.bm, []
        for i, (r, z) in enumerate(prof):
            if r < 1e-6:
                rings.append([bm.verts.new(M @ Vector((0, 0, z)))])
                continue
            last = i == len(prof) - 1 or prof[i + 1][0] < 1e-6
            ring = []
            for j in range(n):
                a = TAU * j / n + twist * i
                rr = r * (1 + (flute if j % 2 else 0)) + random.uniform(-noise, noise)
                zz = z + random.uniform(-noise, noise) * 0.5 + (random.uniform(-jag, jag) if last else 0)
                ring.append(bm.verts.new(M @ Vector((rr * math.cos(a), rr * math.sin(a), zz))))
            rings.append(ring)
        pairs = list(zip(rings, rings[1:])) + ([(rings[-1], rings[0])] if closed else [])
        faces = []
        for a, b in pairs:
            for j in range(n):
                k = (j + 1) % n
                if len(a) == 1 and len(b) == 1:
                    break
                if len(a) == 1:
                    faces.append(bm.faces.new((a[0], b[j], b[k])))
                elif len(b) == 1:
                    faces.append(bm.faces.new((a[j], a[k], b[0])))
                else:
                    faces.append(bm.faces.new((a[j], a[k], b[k], b[j])))
        if not closed and caps:
            if len(rings[0]) > 1:
                faces.append(bm.faces.new(list(reversed(rings[0]))))
            if len(rings[-1]) > 1:
                faces.append(bm.faces.new(rings[-1]))
        s._tag(faces, m, smooth)

    def tube(s, m, pts, radii, n=8, smooth=True, caps=True):
        """Sweep a circle along 3D points (radius per point). Good for horns, vines, tentacles, whips."""
        pts = [Vector(p) for p in pts]
        bm, rings = s.bm, []
        prev_side = None
        for i, p in enumerate(pts):
            d = (pts[min(i + 1, len(pts) - 1)] - pts[max(i - 1, 0)]).normalized()
            ref = Vector((0, 0, 1)) if abs(d.z) < 0.9 else Vector((1, 0, 0))
            side = (prev_side - d * prev_side.dot(d)).normalized() if prev_side else d.cross(ref).normalized()
            prev_side = side
            up = d.cross(side)
            r = radii[i] if isinstance(radii, (list, tuple)) else radii
            rings.append([bm.verts.new(p + (side * math.cos(TAU * j / n) + up * math.sin(TAU * j / n)) * max(r, 1e-4)) for j in range(n)])
        faces = []
        for a, b in zip(rings, rings[1:]):
            for j in range(n):
                k = (j + 1) % n
                faces.append(bm.faces.new((a[j], a[k], b[k], b[j])))
        if caps:
            faces.append(bm.faces.new(list(reversed(rings[0]))))
            faces.append(bm.faces.new(rings[-1]))
        s._tag(faces, m, smooth)

    def prism(s, m, pts, z0, z1, M=I, smooth=False):
        if area(pts) < 0:
            pts = pts[::-1]
        bot = [s.bm.verts.new(M @ Vector((x, y, z0))) for x, y in pts]
        top = [s.bm.verts.new(M @ Vector((x, y, z1))) for x, y in pts]
        fs = [s.bm.faces.new(top), s.bm.faces.new(bot[::-1])]
        n = len(pts)
        for j in range(n):
            k = (j + 1) % n
            fs.append(s.bm.faces.new((bot[j], bot[k], top[k], top[j])))
        s._tag(fs, m, smooth)

    # flat (XY plane, normal +Z) pieces for glyph art
    def flat(s, m, pts, z=0, M=I):
        if area(pts) < 0:
            pts = pts[::-1]
        s._tag([s.bm.faces.new([s.bm.verts.new(M @ Vector((x, y, z))) for x, y in pts])], m, False)

    def annulus(s, m, r0, r1, z=0, n=96, M=I, a0=0.0, a1=TAU):
        full = abs(a1 - a0 - TAU) < 1e-6
        cnt = n if full else n + 1
        ang = [a0 + (a1 - a0) * j / n for j in range(cnt)]
        inner = [s.bm.verts.new(M @ Vector((*pol(r0, a), z))) for a in ang]
        outer = [s.bm.verts.new(M @ Vector((*pol(r1, a), z))) for a in ang]
        rng = range(n)
        s._tag([s.bm.faces.new((inner[j], outer[j], outer[(j + 1) % cnt], inner[(j + 1) % cnt])) for j in rng], m, False)

    def stroke(s, m, p, q, w, z=0, M=I):
        p, q = Vector(p), Vector(q)
        d = q - p
        if d.length < 1e-9:
            return
        d.normalize()
        p, q = p - d * w / 2, q + d * w / 2
        nrm = Vector((-d.y, d.x)) * w / 2
        s.flat(m, [tuple(p - nrm), tuple(q - nrm), tuple(q + nrm), tuple(p + nrm)], z, M)

    def polyline(s, m, pts, w, z=0, closed=False, M=I):
        for a, b in zip(pts, pts[1:] + (pts[:1] if closed else [])):
            s.stroke(m, a, b, w, z, M)

    def dot(s, m, c, r, z=0, n=16, M=I):
        s.flat(m, [(c[0] + r * math.cos(TAU * i / n), c[1] + r * math.sin(TAU * i / n)) for i in range(n)], z, M)

    def ring2d(s, m, c, r, w, z=0, n=32, M=I):
        s.annulus(m, r - w / 2, r + w / 2, z, n, M @ Matrix.Translation((c[0], c[1], 0)))

    def ribbon(s, m, pts, w):
        """Two crossed ribbons through 3D points, visible from any side (lightning)."""
        for ax in (Vector((w / 2, 0, 0)), Vector((0, 0, w / 2))):
            lo = [s.bm.verts.new(p - ax) for p in pts]
            hi = [s.bm.verts.new(p + ax) for p in pts]
            s._tag([s.bm.faces.new((lo[i], lo[i + 1], hi[i + 1], hi[i])) for i in range(len(pts) - 1)], m, False)

    def done(s, recalc=True, uv=None):
        if recalc:
            bmesh.ops.recalc_face_normals(s.bm, faces=s.bm.faces[:])
        if uv:  # uv(vertex_co) -> (u, v): simple projected UVs for scrolling shaders
            layer = s.bm.loops.layers.uv.new('UVMap')
            for f in s.bm.faces:
                for loop in f.loops:
                    loop[layer].uv = uv(loop.vert.co)
        me = bpy.data.meshes.new(s.name)
        s.bm.to_mesh(me)
        s.bm.free()
        for m in s.mats:
            me.materials.append(m)
        ob = bpy.data.objects.new(s.name, me)
        ob.location, ob.rotation_euler = s.loc, s.rot
        s.col.objects.link(ob)
        if s.parent:
            ob.parent = s.parent
        return ob


def crystal(mesh, m, M, r=0.1, h=0.6, n=6):
    mesh.lathe(m, [(0, 0), (r, h * 0.15), (r * 0.85, h * 0.75), (0, h)], n=n, M=M)


def basis(o, x, y, z, s=(1, 1, 1)):
    """4x4 matrix with local axes x, y, z (scaled by s) placed at o."""
    x, y, z = (Vector(v).normalized() * k for v, k in zip((x, y, z), s))
    return Matrix(((x[0], y[0], z[0], o[0]), (x[1], y[1], z[1], o[1]), (x[2], y[2], z[2], o[2]), (0, 0, 0, 1)))


def uv_ribbon(name, col, m, centers, widths, sides, loc=(0, 0, 0)):
    """Strip with UVs (u across, v along) for scrolling shaders such as the mana falls."""
    bm = bmesh.new()
    uv = bm.loops.layers.uv.new('UVMap')
    rows = [[bm.verts.new(c - sv * w / 2), bm.verts.new(c + sv * w / 2)] for c, w, sv in zip(centers, widths, sides)]
    last = len(rows) - 1
    for i in range(last):
        f = bm.faces.new((rows[i][0], rows[i][1], rows[i + 1][1], rows[i + 1][0]))
        for loop, (u, v) in zip(f.loops, ((0, i), (1, i), (1, i + 1), (0, i + 1))):
            loop[uv].uv = (u, v / last)
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me)
    bm.free()
    me.materials.append(m)
    ob = bpy.data.objects.new(name, me)
    ob.location = loc
    col.objects.link(ob)
    return ob


def apply_bevel(ob, width, segs=2, angle=35):
    mod = ob.modifiers.new('bev', 'BEVEL')
    mod.width, mod.segments, mod.limit_method, mod.angle_limit = width, segs, 'ANGLE', math.radians(angle)
    dg = bpy.context.evaluated_depsgraph_get()
    me = bpy.data.meshes.new_from_object(ob.evaluated_get(dg), preserve_all_data_layers=True, depsgraph=dg)
    ob.modifiers.clear()
    ob.data = me
    for p in me.polygons:
        p.use_smooth = True
    me.set_sharp_from_angle(angle=math.radians(40))


def apply_subsurf(ob, levels=1):
    mod = ob.modifiers.new('sub', 'SUBSURF')
    mod.levels = mod.render_levels = levels
    dg = bpy.context.evaluated_depsgraph_get()
    me = bpy.data.meshes.new_from_object(ob.evaluated_get(dg), preserve_all_data_layers=True, depsgraph=dg)
    ob.modifiers.clear()
    ob.data = me


def bake_ao(objs, occluders, rays=10, dist=3.0, strength=0.8, tint=(0.85, 1.0)):
    """Ray-traced ambient occlusion + per-face colour variation, baked into a corner colour attribute."""
    from mathutils.bvhtree import BVHTree
    verts, polys = [], []
    for ob in occluders:
        mw, base = ob.matrix_world, len(verts)
        verts += [mw @ v.co for v in ob.data.vertices]
        polys += [[base + i for i in p.vertices] for p in ob.data.polygons]
    bvh = BVHTree.FromPolygons(verts, polys)
    dirs = []
    for k in range(rays):  # fixed cosine-weighted hemisphere pattern
        u1, u2 = (k + 0.5) / rays, (k * 0.618034) % 1
        r = math.sqrt(u1)
        dirs.append(Vector((r * math.cos(TAU * u2), r * math.sin(TAU * u2), math.sqrt(1 - u1))))
    for ob in objs:
        me, mw = ob.data, ob.matrix_world
        nm = mw.to_3x3().inverted().transposed()
        ao = []
        for v in me.vertices:
            n = (nm @ v.normal).normalized()
            o, q = mw @ v.co + n * 0.02, n.to_track_quat('Z', 'Y')
            hits = sum(bvh.ray_cast(o, q @ d, dist)[0] is not None for d in dirs)
            ao.append(1 - strength * hits / rays)
        attr = me.color_attributes.new('Col', 'BYTE_COLOR', 'CORNER')
        rnd = random.Random(ob.name)
        for p in me.polygons:
            t = rnd.uniform(*tint)
            for li in p.loop_indices:
                a = min(1.0, ao[me.loops[li].vertex_index] * t)
                attr.data[li].color = (a, a, a, 1)
        me.color_attributes.active_color = attr


# ---------- spell circle glyph helpers ----------
GRID = [(x, y) for x in (-1, 0, 1) for y in (-1, 0, 1)]
EDGES = [(a, b) for a in range(9) for b in range(a + 1, 9)
         if max(abs(GRID[a][0] - GRID[b][0]), abs(GRID[a][1] - GRID[b][1])) == 1]


def runes(mesh, m, R, size, count, w, z, rng):
    for i in range(count):
        a = TAU * i / count
        rad, tan = Vector((math.cos(a), math.sin(a))), Vector((-math.sin(a), math.cos(a)))
        c = rad * R
        P = lambda g: tuple(c + (-tan * GRID[g][0] + rad * GRID[g][1]) * size / 2)
        for ea, eb in rng.sample(EDGES, rng.randint(3, 5)):
            mesh.stroke(m, P(ea), P(eb), w, z)


# ---------- export / bundle / preview renders ----------
def export(fname, objs):
    scene = bpy.context.scene
    keep = set(objs)
    for o in objs:  # children ride along with their parent
        keep.update(o.children_recursive)
    for o in scene.objects:
        o.select_set(o in keep)
    bpy.context.view_layer.objects.active = objs[0]
    kw = dict(filepath=os.path.join(ASSETS, fname), export_format='GLB', use_selection=True,
              export_apply=True, export_yup=True, export_animations=False)
    try:
        bpy.ops.export_scene.gltf(**kw, export_vertex_color='ACTIVE')  # ship the baked AO colours
    except TypeError:
        bpy.ops.export_scene.gltf(**kw, export_colors=True)


def pack_bundle():
    """Rebuild the playable index.html (one self-contained file) so new models show up in the game right away."""
    import runpy
    runpy.run_path(os.path.join(ROOT, 'pack.py'))


class Previewer:
    def __init__(s, res=640):
        scene = bpy.context.scene
        world = bpy.data.worlds.new('world')
        scene.world = world
        try:
            world.use_nodes = True
        except Exception:
            pass
        bg = next(n for n in world.node_tree.nodes if n.type == 'BACKGROUND')
        bg.inputs['Color'].default_value = (0.02, 0.025, 0.06, 1)
        sun = bpy.data.objects.new('sun', bpy.data.lights.new('sun', 'SUN'))
        sun.data.energy = 3
        sun.rotation_euler = (math.radians(50), 0, math.radians(30))
        scene.collection.objects.link(sun)
        cam = bpy.data.objects.new('cam', bpy.data.cameras.new('cam'))
        cam.data.clip_end = 1000
        scene.collection.objects.link(cam)
        scene.camera = cam
        for eng in ('BLENDER_EEVEE', 'BLENDER_EEVEE_NEXT'):
            try:
                scene.render.engine = eng
                break
            except TypeError:
                pass
        try:
            scene.eevee.taa_render_samples = 16
        except Exception:
            pass
        scene.render.resolution_x = scene.render.resolution_y = res
        s.scene, s.cam = scene, cam

    def render(s, name, visible, frame=None, dirv=(1, -1, 0.7), view=None, lens=50):
        scene, cam = s.scene, s.cam
        vis = set(visible)
        for o in visible:
            vis.update(o.children_recursive)
        for o in scene.objects:
            if o.type == 'MESH':
                o.hide_render = o not in vis
        cam.data.lens = lens
        if view:
            loc, target = Vector(view[0]), Vector(view[1])
        else:
            pts = [o.matrix_world @ Vector(c) for o in (frame or vis) for c in o.bound_box]
            lo, hi = Vector(map(min, zip(*pts))), Vector(map(max, zip(*pts)))
            target, r = (lo + hi) / 2, (hi - lo).length / 2
            loc = target + Vector(dirv).normalized() * r / math.sin(math.atan(18 / lens)) * 1.05
        cam.location = loc
        cam.rotation_mode = 'QUATERNION'
        cam.rotation_quaternion = (target - loc).to_track_quat('-Z', 'Y')
        scene.render.filepath = os.path.join(RENDERS, name + '.png')
        try:
            bpy.ops.render.render(write_still=True)
        except RuntimeError:
            scene.render.engine = 'BLENDER_WORKBENCH'
            scene.display.shading.color_type = 'MATERIAL'
            bpy.ops.render.render(write_still=True)
