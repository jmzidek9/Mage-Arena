// Mage City: a floating city under the black hole, about a minute's walk across, in the arena's stone, gold and violet.
// The rules work on a grid of 1.5 m cells: every building is a stack of cells that can be blasted out, and cells left
// without support collapse. What you see on each cell is a carved masonry piece (ashlar courses, quoins, cornices,
// gold bands, arches, battlements...), plus windows, awnings, banners, lanterns and street furniture. Broken pieces are
// thrown out as real debris that tumbles, piles up, and gets kicked about again by later blasts and by walking through it.
// The layout comes from a fixed seed, so host and guest build the same city; the host decides what breaks ('blk' events).
// Loaded after dungeon.js (uses sim, modes and the arena's assets), before view.js.
'use strict';

const CITY_R = 205, CB = 1.5, CW = 210, CN = Math.ceil(2 * CW / CB), CH = 30; // walkable radius, cell size, grid half-width, cells per side, max levels
const cIx = x => Math.floor((x + CW) / CB), cX = i => -CW + (i + .5) * CB; // world <-> grid
const cKey = (ix, iz, lv) => (ix * CN + iz) * 32 + lv;
const CITY = { occ: new Uint32Array(CN * CN), blk: new Map(), props: [], ready: false, dist: null, fieldT: 0, view: null };
const STONE = { a: 0xb2afb6, b: 0xa19eaa, moss: 0x98a291, slab: 0x5f5a6c, gold: 0xf9d789, dark: 0x847f8e, roof: 0x4a4458 };
// piece types (what each cell looks like)
const PT = ['wallA', 'wallB', 'wallC', 'ruin', 'quoin', 'cornice', 'corner', 'gold', 'merlon', 'paving', 'pilaster', 'arch', 'plinth'];
const PI_ = Object.fromEntries(PT.map((n, i) => [n, i]));

// ---------- layout (deterministic) ----------
function cityRng(seed) { return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const SIDE = 20, ST = 4; // side streets every 20 cells (30 m), 4 cells wide
const RINGS = [72, 142];
function onRoad(x, z) {
  const r = Math.hypot(x, z);
  if (r < 23 || Math.abs(x) < 5 || Math.abs(z) < 5) return true; // plaza, avenues
  if (RINGS.some(R => Math.abs(r - R) < 3.6)) return true; // ring roads
  const gx = ((cIx(x) % SIDE) + SIDE) % SIDE, gz = ((cIx(z) % SIDE) + SIDE) % SIDE;
  return gx < ST || gz < ST;
}
function cityLayout() {
  const rng = cityRng(7331), R = (a, b) => a + rng() * (b - a), blocks = [], vis = [], att = [], props = [], have = new Set();
  // a cell: grid position, colour, piece type, and how it is drawn (centre, yaw, sideways stretch)
  const put = (ix, iz, lv, c, t, ry = 0, vx = cX(ix), vz = cX(iz), sx = 1) => {
    if (ix < 0 || iz < 0 || ix >= CN || iz >= CN || lv >= CH) return;
    const k = cKey(ix, iz, lv); if (have.has(k)) return; have.add(k);
    blocks.push(ix, iz, lv, c, PI_[t]); vis.push(vx, vz, ry, sx);
  };
  const tone = (lv, ruin) => { const k = rng(); if (lv < 3 && k < (.2 - lv * .06) * (ruin ? 2.2 : 1)) return STONE.moss; return k < .55 ? STONE.a : k < .9 ? STONE.b : STONE.dark; };
  const wall = ruin => ruin && rng() < .35 ? 'ruin' : pick3();
  const pick3 = () => { const k = rng(); return k < .45 ? 'wallA' : k < .8 ? 'wallB' : 'wallC'; };
  const attach = (owner, g, x, y, z, ry, c = 0xffffff) => att.push({ o: owner, g, x, y, z, ry, c });
  // a rectangular building on cells [x0, x1) x [z0, z1), h levels
  function house(x0, z0, x1, z1, h, kind, base = 0) {
    const ruin = kind === 'ruin', hall = kind === 'hall', up = base > 0, w = x1 - x0, d = z1 - z0, roof = !ruin && rng() < .7, cx = (x0 + x1 - 1) / 2, cz = (z0 + z1 - 1) / 2;
    const corn = lv => !ruin && lv > 0 && lv % 4 === 3 && lv < h - 1; // a cornice every fourth course
    for (let ix = x0; ix < x1; ix++) for (let iz = z0; iz < z1; iz++) {
      const ex = ix === x0 || ix === x1 - 1, ez = iz === z0 || iz === z1 - 1;
      if (!ex && !ez) { if (roof) put(ix, iz, h - 1, STONE.slab, 'paving'); continue; }
      const corner = ex && ez, along = ez ? ix - x0 : iz - z0, mid = ez ? Math.abs(ix - cx) < 1 : Math.abs(iz - cz) < 1;
      const ry = ez ? 0 : Math.PI / 2, ox = ex && !ez ? (ix === x0 ? -1 : 1) : 0, oz = ez && !ex ? (iz === z0 ? -1 : 1) : 0; // facade direction (outward)
      const top = ruin ? h - Math.floor(rng() ** 2 * Math.min(h - 1, 4)) : h;
      for (let lv = base; lv < top + (corner ? 1 : 0); lv++) {
        if (!up && !corner && mid && lv < 2) continue; // doorway in the middle of every side (not on an upper storey)
        const win = !corner && lv % 3 === 1 && lv > 1 && lv < top - 1 && along % 3 === 1;
        if (win) { // window: a sill under it and a lintel over it, each carried by the stone it sits on
          const wx = cX(ix) + ox * .9, wz = cX(iz) + oz * .9;
          attach(cKey(ix, iz, lv - 1), 'sill', wx, lv * CB + .07, wz, ry); attach(cKey(ix, iz, lv + 1), 'lintel', wx, (lv + 1) * CB - .1, wz, ry);
          if (rng() < .18) attach(cKey(ix, iz, lv - 1), 'lamp', cX(ix) + ox * .95, lv * CB + .55, cX(iz) + oz * .95, ry);
          continue;
        }
        let t, c;
        if (corner) { t = corn(lv) ? 'corner' : 'quoin'; c = STONE.slab; }
        else if (lv === base && !ruin) { t = up ? 'cornice' : 'plinth'; c = up ? STONE.b : STONE.slab; }
        else if (!up && mid && lv === 2) { t = 'arch'; c = tone(lv, ruin); if (!ruin && rng() < .55) attach(cKey(ix, iz, 2), 'awning', cX(ix) + ox * 1.25, 2 * CB + .25, cX(iz) + oz * 1.25, ry); }
        else if (hall && lv === h - 1) { t = 'gold'; c = STONE.slab; }
        else if (corn(lv)) { t = 'cornice'; c = STONE.b; }
        else if (hall && along % 4 === 2 && lv > 0) { t = 'pilaster'; c = tone(lv, false); }
        else { t = wall(ruin); c = tone(lv, ruin); }
        put(ix, iz, lv, c, t, ry + (t.startsWith('wall') && rng() < .5 ? Math.PI : 0));
      }
      if (!ruin && !corner && along % 2 === 0) put(ix, iz, top, STONE.b, 'merlon', ry);
      if (hall && !corner && along % 6 === 3 && top > 6) attach(cKey(ix, iz, top - 1), 'banner', cX(ix) + ox * .82, (top - 1) * CB - 1.1, cX(iz) + oz * .82, ry);
    }
    // a smaller upper storey set back on some roofs
    if (roof && !up && !ruin && w > 6 && d > 6 && rng() < .45) house(x0 + 2, z0 + 2, x1 - 2, z1 - 2, h + Math.round(R(3, 6)), kind === 'hall' ? 'hall' : 'house', h);
    // crates and barrels against a wall
    if (!up && !hall && rng() < .45) for (let k = 0, n = 1 + (rng() * 3 | 0); k < n; k++) props.push({ k: rng() < .5 ? 'crate' : 'barrel', x: cX(x0) - 1.2, z: cX(z0 + 1 + (rng() * (d - 2) | 0)), yaw: rng() * TAU });
  }
  // a round tower: drawn on a true circle, ruled on the grid ring it covers
  function tower(ix0, iz0, rr, h) {
    const ring = [];
    for (let ix = ix0 - rr - 1; ix <= ix0 + rr + 1; ix++) for (let iz = iz0 - rr - 1; iz <= iz0 + rr + 1; iz++) if (Math.abs(Math.hypot(ix - ix0, iz - iz0) - rr) <= .62) ring.push([ix, iz, Math.atan2(iz - iz0, ix - ix0)]);
    const Rw = rr * CB, sx = TAU * Rw / ring.length / CB * 1.06, cx = cX(ix0), cz = cX(iz0), cone = rng() < .6;
    for (const [ix, iz, a] of ring) {
      const vx = cx + Math.cos(a) * Rw, vz = cz + Math.sin(a) * Rw, ry = -(a + Math.PI / 2);
      for (let lv = 0; lv < h; lv++) {
        if (lv < 2 && Math.abs(a - Math.PI / 2) < .45) continue; // door
        if (lv > 2 && lv % 4 === 2 && Math.sin(a * 3 + lv) > .45) { attach(cKey(ix, iz, lv - 1), 'sill', cx + Math.cos(a) * (Rw + .9), lv * CB + .07, cz + Math.sin(a) * (Rw + .9), ry); continue; } // slit windows climbing round
        const t = lv === 0 ? 'plinth' : lv === h - 1 ? 'gold' : lv % 5 === 4 ? 'cornice' : pick3();
        put(ix, iz, lv, t === 'gold' || t === 'plinth' ? STONE.slab : tone(lv, false), t, ry, vx, vz, sx);
      }
      if (!cone && Math.round(a * 4) % 2 === 0) put(ix, iz, h, STONE.b, 'merlon', ry, vx, vz, sx);
    }
    if (cone) props.push({ k: 'roof', x: cx, z: cz, y: h * CB, s: Rw + 1.1, owners: ring.map(([ix, iz]) => cKey(ix, iz, h - 1)) });
    else props.push({ k: 'crystal', x: cx, z: cz, y: h * CB + 1.2, s: 1.6 + rr * .2 });
  }
  // gateway arches where the avenues cross the ring roads
  function gate(cxw, czw, alongX) {
    const ci = cIx(cxw), cj = cIx(czw);
    for (const s of [-1, 1]) for (let a = 4; a <= 5; a++) for (let b = -1; b <= 0; b++) {
      const ix = alongX ? ci + b : ci + s * a, iz = alongX ? cj + s * a : cj + b;
      for (let lv = 0; lv < 8; lv++) put(ix, iz, lv, STONE.slab, lv === 0 ? 'plinth' : lv === 7 ? 'gold' : (lv + a) % 2 ? 'quoin' : 'corner');
    }
    for (let a = -3; a <= 3; a++) for (let b = -1; b <= 0; b++) { const ix = alongX ? ci + b : ci + a, iz = alongX ? cj + a : cj + b; put(ix, iz, 6, STONE.b, 'cornice', alongX ? Math.PI / 2 : 0); put(ix, iz, 7, STONE.slab, 'gold', alongX ? Math.PI / 2 : 0); if ((a + 8) % 2 === 0) put(ix, iz, 8, STONE.b, 'merlon'); }
  }
  for (const R0 of RINGS) { gate(0, R0, false); gate(0, -R0, false); gate(R0, 0, true); gate(-R0, 0, true); }
  // the grid blocks between side streets, split into lots
  const g0 = Math.floor(cIx(-CITY_R) / SIDE) - 1, g1 = Math.ceil(cIx(CITY_R) / SIDE) + 1;
  for (let gx = g0; gx < g1; gx++) for (let gz = g0; gz < g1; gz++) {
    const bx0 = gx * SIDE + ST, bz0 = gz * SIDE + ST, bx1 = gx * SIDE + SIDE, bz1 = gz * SIDE + SIDE; // 16 x 16 cells of land
    const lots = [[bx0, bz0, bx1, bz1]];
    for (let s = 0; s < 2; s++) { const L = lots.shift(), [a, b, c, d] = L; if (c - a > 8 && (rng() < .5 || d - b <= 8)) { const m = Math.round(a + (c - a) * R(.38, .62)); lots.push([a, b, m - 1, d], [m, b, c, d]); } else if (d - b > 8) { const m = Math.round(b + (d - b) * R(.38, .62)); lots.push([a, b, c, m - 1], [a, m, c, d]); } else lots.push(L); }
    for (const [a, b, c, d] of lots) {
      if (c - a < 4 || d - b < 4) continue;
      const corners = [[a, b], [c - 1, b], [a, d - 1], [c - 1, d - 1], [(a + c) / 2, (b + d) / 2]];
      if (corners.some(([i, j]) => { const x = cX(i), z = cX(j); return Math.hypot(x, z) > CITY_R - 8 || onRoad(x, z); })) continue;
      const r = Math.hypot(cX((a + c) / 2), cX((b + d) / 2)), k = rng(), mx = cX((a + c - 1) / 2), mz = cX((b + d - 1) / 2);
      if (k < .07) { props.push({ k: 'garden', x: mx, z: mz, w: (c - a) * CB, d: (d - b) * CB }); props.push({ k: 'tree', x: mx, z: mz, s: R(1, 1.4) }); for (const s of [-1, 1]) props.push({ k: 'bench', x: mx + s * 3, z: mz, yaw: s * Math.PI / 2 }); continue; } // a courtyard garden
      if (r < 72) {
        if (k < .42 && c - a >= 7 && d - b >= 7) tower(Math.round((a + c - 1) / 2), Math.round((b + d - 1) / 2), Math.min(3, Math.floor((Math.min(c - a, d - b) - 2) / 2)), Math.round(R(15, 25)));
        else house(a, b, c, d, Math.round(R(8, 13)), 'hall');
      } else if (r < 142) house(a, b, c, d, Math.round(R(5, 9)), k < .3 ? 'hall' : 'house');
      else if (k < .85) house(a, b, c, d, Math.round(R(3, 7)), 'ruin');
      else props.push({ k: 'rubble', x: mx, z: mz, s: R(1.2, 2) });
    }
  }
  // a low crenellated parapet round the island's rim
  for (let a = 0; a < TAU; a += CB / (CITY_R + 2)) { const ix = cIx(Math.cos(a) * (CITY_R + 2)), iz = cIx(Math.sin(a) * (CITY_R + 2)), ry = -(a + Math.PI / 2); put(ix, iz, 0, STONE.slab, 'plinth', ry); if (Math.round(a * (CITY_R + 2) / CB) % 3 === 0) put(ix, iz, 1, STONE.b, 'merlon', ry); }
  // street furniture: anything placed on a cell with no building on it
  const free = (x, z) => { const ix = cIx(x), iz = cIx(z); for (let lv = 0; lv < 3; lv++) if (have.has(cKey(ix, iz, lv))) return false; return Math.hypot(x, z) < CITY_R - 3; };
  // the plaza: monoliths, braziers, crystals, statues, benches
  for (let i = 0; i < 8; i++) { const a = TAU * i / 8 + TAU / 16; props.push({ k: 'monolith', x: Math.cos(a) * 17, z: Math.sin(a) * 17, yaw: -a }); }
  for (let i = 0; i < 4; i++) { const a = TAU * i / 4 + TAU / 8; props.push({ k: 'brazier', x: Math.cos(a) * 9, z: Math.sin(a) * 9 }); props.push({ k: 'statue', x: Math.cos(a) * 21, z: Math.sin(a) * 21, yaw: -a - Math.PI / 2 }); }
  for (let i = 0; i < 16; i++) { const a = TAU * (i + .5) / 16; if (Math.abs(Math.sin(a * 2)) > .2) props.push({ k: 'bench', x: Math.cos(a) * 13, z: Math.sin(a) * 13, yaw: -a + Math.PI / 2 }); }
  // the avenues: braziers and columns, market stalls, crates
  for (const s of [-1, 1]) for (let t = 28; t < CITY_R - 8; t += 11) for (const side of [-1, 1]) for (const [x, z, ry] of [[t * s, side * 4.2, 0], [side * 4.2, t * s, Math.PI / 2]]) {
    if (RINGS.some(R0 => Math.abs(t - R0) < 7)) continue;
    const n = Math.round(t / 11) % 4;
    props.push(n === 0 ? { k: 'brazier', x, z } : n === 2 ? { k: 'pillar', x, z } : { k: 'lamp', x, z, yaw: ry });
    if (t < 90 && n === 1 && rng() < .7) props.push({ k: 'stall', x: x + (ry ? side * 2.2 : 0), z: z + (ry ? 0 : side * 2.2), yaw: ry + (side < 0 ? 0 : Math.PI) });
  }
  // ring roads: fountains on the diagonals, trees and lamps along the edges
  for (const R0 of RINGS) {
    for (let i = 0; i < 4; i++) { const a = TAU * i / 4 + TAU / 8; props.push({ k: 'fountain', x: Math.cos(a) * R0, z: Math.sin(a) * R0 }); }
    for (let a = 0; a < TAU; a += 13 / R0) for (const e of [-1, 1]) { const rr = R0 + e * 2.9, x = Math.cos(a) * rr, z = Math.sin(a) * rr; if (Math.abs(x) < 8 || Math.abs(z) < 8 || !free(x, z)) continue; props.push(rng() < .55 ? { k: 'tree', x, z, s: R(.85, 1.25) } : { k: 'lamp', x, z, yaw: -a }); }
  }
  // side streets: lamps along the curbs, now and then a bench or some crates
  for (let g = g0; g < g1; g++) for (const e of [.35, ST - .35]) {
    const line = cX(g * SIDE) - CB / 2 + e * CB;
    for (let t = -CITY_R; t < CITY_R; t += 9) for (const [x, z, ry] of [[line, t, Math.PI / 2], [t, line, 0]]) {
      if (Math.hypot(x, z) < 26 || Math.abs(x) < 7 || Math.abs(z) < 7 || !free(x, z) || RINGS.some(R0 => Math.abs(Math.hypot(x, z) - R0) < 6)) continue;
      const k = rng(); props.push(k < .55 ? { k: 'lamp', x, z, yaw: ry } : k < .7 ? { k: 'bench', x, z, yaw: ry } : k < .85 ? { k: 'barrel', x, z, yaw: rng() * 6 } : { k: 'planter', x, z, yaw: ry });
    }
  }
  for (let i = 0; i < 30; i++) { const a = rng() * TAU, r = CITY_R + R(14, 70); props.push({ k: 'rock', x: Math.cos(a) * r, z: Math.sin(a) * r, y: R(-14, 18), s: R(1, 3.4) }); }
  return { blocks: new Int32Array(blocks), vis: new Float32Array(vis), att, props: props.filter(p => !['crate', 'barrel', 'bench', 'planter', 'stall', 'tree', 'lamp'].includes(p.k) || free(p.x, p.z)) };
}

// ---------- state: blocks, damage, collapse (host decides, both apply) ----------
const PROP_HP = { brazier: 60, pillar: 140, monolith: 220, crystal: 90, lamp: 40, bench: 60, crate: 14, barrel: 14, stall: 40, statue: 220, fountain: 320, tree: 45, planter: 50, roof: 420 };
const PROP_R = { brazier: .7, pillar: 1.15, monolith: 1.2, crystal: 1, lamp: .3, bench: .7, crate: .5, barrel: .4, stall: 1.2, statue: 1.1, fountain: 2.7, tree: .45, planter: .7, roof: 2 };
const PROP_SOLID = new Set(['brazier', 'pillar', 'monolith', 'lamp', 'statue', 'fountain', 'tree', 'planter', 'stall']);
function cityMap() {
  MAP.r = CITY_R; MAP.rects = MAP.erects = null; PILLARS.length = 0;
  if (!CITY.ready) { // first visit: lay it out and build it, then compile its shaders now rather than on the first wall that breaks
    CITY.lay = cityLayout(); CITY.ready = true;
    CITY.props = CITY.lay.props.map(p => ({ ...p, max: PROP_HP[p.k] ?? 1e9, hp: PROP_HP[p.k] ?? 1e9, rad: PROP_R[p.k] ?? 1, top: p.k === 'crystal' || p.k === 'roof' ? p.y + 3 : p.k === 'monolith' ? 7 : 4, solid: PROP_SOLID.has(p.k) ? { x: p.x, z: p.z, r: PROP_R[p.k] } : null }));
    CITY.owned = new Map(); CITY.props.forEach((p, i) => p.owners?.forEach(k => CITY.owned.set(k, i)));
    buildCityView();
    // warm-up: draw one frame with every kind of city object showing (shadows too), so no shader compiles mid-fight
    const vis = cityG.visible, D = CITY.view.debris; cityG.visible = true; D.bm.setVisibleAt(0, true);
    for (const d of CITY.view.bm) { d.bm.visible = d.im.visible = true; }
    try { renderer.render(scene, camera); } catch {}
    D.bm.setVisibleAt(0, false); for (const d of CITY.view.bm) { d.near = true; d.im.visible = false; } cityG.visible = vis;
  }
  if (!CITY.blk.size) { cityReset(); return; } // first time on this machine: every block in place (the guest may miss the reset event)
  for (const p of CITY.props) if (p.solid && p.hp > 0) PILLARS.push(p.solid);
}
// put every block and prop back (a new game)
function cityReset() {
  if (!CITY.ready) cityMap();
  const B = CITY.lay.blocks; CITY.occ.fill(0); CITY.blk.clear();
  for (let i = 0, n = 0; i < B.length; i += 5, n++) { const k = cKey(B[i], B[i + 1], B[i + 2]); CITY.occ[B[i] * CN + B[i + 1]] |= 1 << B[i + 2]; CITY.blk.set(k, { hp: B[i + 2] === 0 ? 45 : 32, n, gone: 0 }); }
  for (const p of CITY.props) p.hp = p.max;
  PILLARS.length = 0; for (const p of CITY.props) if (p.solid) PILLARS.push(p.solid);
  cityViewReset(); CITY.dist = null;
}
const blockAt = (x, y, z) => { if (y < 0) return false; const ix = cIx(x), iz = cIx(z), lv = Math.floor(y / CB); return ix >= 0 && iz >= 0 && ix < CN && iz < CN && lv < 32 && (CITY.occ[ix * CN + iz] >> lv & 1) === 1; };
function killProp(p) { if (p.hp <= 0 && p.dead) return; p.hp = 0; p.dead = 1; if (p.solid) { const i = PILLARS.indexOf(p.solid); if (i >= 0) PILLARS.splice(i, 1); } ev({ k: 'prop', i: CITY.props.indexOf(p) }); }
// host: damage blocks (and props) within r of a point; whatever breaks, and whatever that leaves hanging, goes out as one 'blk' event
function cityHit(x, y, z, r, dmg) {
  if (S.mode !== 'city' || role === 'guest' || !CITY.ready || dmg <= 0) return;
  const gone = [], i0 = cIx(x - r), i1 = cIx(x + r), j0 = cIx(z - r), j1 = cIx(z + r), l0 = Math.max(0, Math.floor((y - r) / CB)), l1 = Math.floor((y + r) / CB);
  for (let ix = Math.max(0, i0); ix <= Math.min(CN - 1, i1); ix++) for (let iz = Math.max(0, j0); iz <= Math.min(CN - 1, j1); iz++) {
    const bits = CITY.occ[ix * CN + iz]; if (!bits) continue;
    for (let lv = l0; lv <= Math.min(31, l1); lv++) {
      if (!(bits >> lv & 1)) continue;
      const d = Math.hypot(cX(ix) - x, (lv + .5) * CB - y, cX(iz) - z); if (d > r + CB * .5) continue;
      const k = cKey(ix, iz, lv), b = CITY.blk.get(k);
      b.hp -= dmg * (1 - .5 * Math.min(1, d / (r + .01)));
      if (b.hp <= 0) { CITY.occ[ix * CN + iz] &= ~(1 << lv); b.gone = 1; gone.push(k); }
    }
  }
  for (const p of CITY.props) if (p.hp > 0 && p.max < 1e8 && Math.hypot(p.x - x, p.z - z) < r + p.rad && y < p.top + r && y > (p.y ?? 0) - r - 1) { if ((p.hp -= dmg) <= 0) killProp(p); }
  if (!gone.length) return;
  const fall = citySettle(x, z, r + 6);
  for (const k of [...gone, ...fall]) { const i = CITY.owned.get(k); if (i != null && CITY.props[i].hp > 0) killProp(CITY.props[i]); } // a tower that loses its top loses its roof
  ev({ k: 'blk', a: gone, f: fall, x: r2(x), y: r2(y), z: r2(z), s: r2(Math.min(26, 5 + Math.sqrt(dmg) * 1.6)), r: r2(r) });
  CITY.dist = null; // re-route the monsters
}
// blocks with nothing under them fall, unless a held neighbour on the same level carries them (overhangs up to 4 cells)
function citySettle(x, z, rad) {
  const i0 = Math.max(0, cIx(x - rad)), i1 = Math.min(CN - 1, cIx(x + rad)), j0 = Math.max(0, cIx(z - rad)), j1 = Math.min(CN - 1, cIx(z + rad)), W = i1 - i0 + 1, Hh = j1 - j0 + 1;
  const fall = []; let below = null;
  for (let lv = 1; lv < CH + 1; lv++) {
    const sup = new Uint8Array(W * Hh); let any = false;
    for (let a = 0; a < W; a++) for (let b = 0; b < Hh; b++) {
      const bits = CITY.occ[(i0 + a) * CN + j0 + b]; if (!(bits >> lv & 1)) continue; any = true;
      const under = bits >> (lv - 1) & 1, edge = a === 0 || b === 0 || a === W - 1 || b === Hh - 1;
      sup[a * Hh + b] = edge || (under && (lv === 1 || !below || below[a * Hh + b])) ? 2 : 1; // 2 = held, 1 = not yet
    }
    if (!any) break;
    for (let pass = 0; pass < 4; pass++) {
      const held = [];
      for (let a = 1; a < W - 1; a++) for (let b = 1; b < Hh - 1; b++) { const k = a * Hh + b; if (sup[k] === 1 && (sup[k - Hh] === 2 || sup[k + Hh] === 2 || sup[k - 1] === 2 || sup[k + 1] === 2)) held.push(k); }
      if (!held.length) break;
      for (const k of held) sup[k] = 2;
    }
    for (let a = 0; a < W; a++) for (let b = 0; b < Hh; b++) if (sup[a * Hh + b] === 1) {
      const ix = i0 + a, iz = j0 + b, k = cKey(ix, iz, lv); CITY.occ[ix * CN + iz] &= ~(1 << lv); const bl = CITY.blk.get(k); if (bl) bl.gone = 1; fall.push(k); sup[a * Hh + b] = 0;
    }
    below = sup.map(v => v >= 2 ? 1 : 0);
  }
  return fall;
}
// apply a 'blk' event (both machines; the host already cleared its grid)
function cityApply(e) {
  if (!CITY.ready) return;
  for (const k of [...e.a, ...e.f]) { const b = CITY.blk.get(k); if (b) { b.gone = 1; const lv = k % 32, c = (k - lv) / 32; CITY.occ[c] &= ~(1 << lv); } }
  cityBreakFx(e);
}

// ---------- monsters: spawn far from the players, route through the streets, smash through when stuck ----------
function citySpawnSpot(minD = 34, maxD = 70) {
  const ps = players().filter(p => !p.down); if (!ps.length) return { x: 0, z: 0 };
  for (let t = 0; t < 80; t++) {
    const a = rand(0, TAU), r = Math.sqrt(Math.random()) * (CITY_R - 6), x = Math.cos(a) * r, z = Math.sin(a) * r;
    if (CITY.occ[cIx(x) * CN + cIx(z)] & 3) continue;
    const d = Math.min(...ps.map(p => Math.hypot(p.x - x, p.z - z)));
    if (d >= minD && d <= maxD) return { x, z };
  }
  const p = ps[0], a = rand(0, TAU); return confine({ x: p.x + Math.cos(a) * minD, z: p.z + Math.sin(a) * minD }, 2);
}
// flow field: steps to the nearest player over the grid (blocked where a block stands on the ground or one above)
function cityField() {
  const N = CN * CN, dist = CITY.dist ?? new Uint16Array(N); dist.fill(65535);
  const q = CITY.fq ??= new Int32Array(N); let h = 0, t = 0;
  for (const p of players()) if (!p.down) { const c = cIx(p.x) * CN + cIx(p.z); if (c >= 0 && c < N) { dist[c] = 0; q[t++] = c; } }
  while (h < t) {
    const c = q[h++], ix = (c / CN) | 0, iz = c % CN, d = dist[c] + 1;
    for (let s = 0; s < 4; s++) {
      const x = ix + (s === 0 ? 1 : s === 1 ? -1 : 0), z = iz + (s === 2 ? 1 : s === 3 ? -1 : 0); if (x < 0 || z < 0 || x >= CN || z >= CN) continue;
      const n = x * CN + z; if (dist[n] <= d || (CITY.occ[n] & 3)) continue;
      const wx = cX(x), wz = cX(z); if (wx * wx + wz * wz > (CITY_R + 1) ** 2) continue;
      dist[n] = d; q[t++] = n;
    }
  }
  CITY.dist = dist;
}
function cityNav(e, tgt) {
  const D = CITY.dist; if (!D || Math.hypot(tgt.x - e.x, tgt.z - e.z) < 4) return tgt;
  const ix = cIx(e.x), iz = cIx(e.z); let best = D[ix * CN + iz], bx = 0, bz = 0;
  if (best === 65535) return tgt;
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) {
    const x = ix + dx, z = iz + dz; if ((!dx && !dz) || x < 0 || z < 0 || x >= CN || z >= CN) continue;
    if (dx && dz && ((CITY.occ[(ix + dx) * CN + iz] | CITY.occ[ix * CN + iz + dz]) & 3)) continue; // no corner cutting
    const v = D[x * CN + z]; if (v < best) { best = v; bx = dx; bz = dz; }
  }
  return bx || bz ? { x: cX(ix + bx), z: cX(iz + bz) } : tgt;
}
// host, every frame in the city: refresh the field now and then, and let stuck monsters bash through whatever is in the way
function cityStep(dt) {
  if (!CITY.ready) return;
  if ((CITY.fieldT -= dt) <= 0 || !CITY.dist) { CITY.fieldT = .8; cityField(); }
  for (const e of S.enemies) {
    if (e.dead || e.rise > 0 || e.pid) continue;
    if ((e.stT = (e.stT ?? 1.2) - dt) > 0) continue;
    const moved = Math.hypot(e.x - (e.lx ?? e.x + 9), e.z - (e.lz ?? e.z + 9)); e.lx = e.x; e.lz = e.z; e.stT = 1.2;
    if (moved > .4 || e.cc || e.atk) continue;
    const f = V(Math.sin(e.yaw), 0, Math.cos(e.yaw)), R = ET[e.type].r * e.sc, px = e.x + f.x * (R + .9), pz = e.z + f.z * (R + .9);
    if (blockAt(px, .8, pz) || blockAt(px, 2.2, pz)) cityHit(px, 1.4, pz, 1.4 + R * .5, 70);
  }
}
// circle vs the cells a body overlaps (from its feet to head height)
function cityCollide(o, r) {
  if (!CITY.ready) return;
  const y = o.y || 0, l0 = Math.max(0, Math.floor((y + .2) / CB)), l1 = Math.floor((y + 1.7) / CB), mask = ((1 << (l1 - l0 + 1)) - 1) << l0;
  for (let pass = 0; pass < 2; pass++) {
    const i0 = cIx(o.x - r), i1 = cIx(o.x + r), j0 = cIx(o.z - r), j1 = cIx(o.z + r);
    for (let ix = i0; ix <= i1; ix++) for (let iz = j0; iz <= j1; iz++) {
      if (ix < 0 || iz < 0 || ix >= CN || iz >= CN || !(CITY.occ[ix * CN + iz] & mask)) continue;
      const bx0 = -CW + ix * CB, bz0 = -CW + iz * CB, nx = clamp(o.x, bx0, bx0 + CB), nz = clamp(o.z, bz0, bz0 + CB), dx = o.x - nx, dz = o.z - nz, d = Math.hypot(dx, dz);
      if (d >= r) continue;
      if (d > 1e-4) { o.x = nx + dx / d * r; o.z = nz + dz / d * r; }
      else { const ex = [o.x - bx0, bx0 + CB - o.x, o.z - bz0, bz0 + CB - o.z], m = Math.min(...ex), k = ex.indexOf(m); if (k === 0) o.x = bx0 - r; else if (k === 1) o.x = bx0 + CB + r; else if (k === 2) o.z = bz0 - r; else o.z = bz0 + CB + r; }
    }
  }
}

// ---------- view: geometry kit ----------
// every piece is a non-indexed geometry with position, normal and a colour that multiplies the instance colour
// (stone pieces: shades around 1 over the stone tone; wood, iron, cloth and leaves: their own colour over white)
const _gm = new THREE.Matrix4(), _gq = new THREE.Quaternion(), _ge = new THREE.Euler();
const Mx = (x = 0, y = 0, z = 0, ry = 0, rx = 0, rz = 0, sx = 1, sy = sx, sz = sx) => new THREE.Matrix4().compose(V(x, y, z), _gq.setFromEuler(_ge.set(rx, ry, rz, 'YXZ')), V(sx, sy, sz));
const CBX = new Map();
// a box with chamfered edges and corners (44 triangles), built outward-facing
function cboxGeo(w, h, d, t) {
  const key = [w, h, d, t].map(v => v.toFixed(3)).join(); if (CBX.has(key)) return CBX.get(key);
  const H = [w / 2, h / 2, d / 2], P = [], tri = (a, b, c) => { const n = V().crossVectors(V(...b).sub(V(...a)), V(...c).sub(V(...a))), m = V(...a).add(V(...b)).add(V(...c)); if (n.dot(m) < 0) P.push(...a, ...c, ...b); else P.push(...a, ...b, ...c); };
  const pt = (vals) => vals; const quad = (a, b, c, d2) => { tri(a, b, c); tri(a, c, d2); };
  const inn = i => Math.max(1e-4, H[i] - t);
  for (let i = 0; i < 3; i++) for (const s of [-1, 1]) { const j = (i + 1) % 3, k = (i + 2) % 3, f = (sj, sk) => { const v = [0, 0, 0]; v[i] = s * H[i]; v[j] = sj * inn(j); v[k] = sk * inn(k); return v; }; quad(f(-1, -1), f(1, -1), f(1, 1), f(-1, 1)); }
  for (let i = 0; i < 3; i++) { const j = (i + 1) % 3, k = (i + 2) % 3; for (const si of [-1, 1]) for (const sj of [-1, 1]) { const A = sk => { const v = [0, 0, 0]; v[i] = si * H[i]; v[j] = sj * inn(j); v[k] = sk * inn(k); return v; }, B = sk => { const v = [0, 0, 0]; v[i] = si * inn(i); v[j] = sj * H[j]; v[k] = sk * inn(k); return v; }; quad(A(-1), A(1), B(1), B(-1)); } }
  for (const sx of [-1, 1]) for (const sy of [-1, 1]) for (const sz of [-1, 1]) tri(pt([sx * H[0], sy * inn(1), sz * inn(2)]), [sx * inn(0), sy * H[1], sz * inn(2)], [sx * inn(0), sy * inn(1), sz * H[2]]);
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); CBX.set(key, g); return g;
}
class GB { // geometry builder: add shapes with a transform and a colour, get one merged geometry
  constructor() { this.p = []; this.c = []; }
  add(geo, m, col) {
    const g = geo.index ? geo.toNonIndexed() : geo, pos = g.attributes.position, v = V(), c = typeof col === 'number' ? [col, col, col] : col;
    for (let i = 0; i < pos.count; i++) { v.fromBufferAttribute(pos, i).applyMatrix4(m); this.p.push(v.x, v.y, v.z); this.c.push(c[0], c[1], c[2]); }
    return this;
  }
  box(w, h, d, t, x, y, z, col, ry = 0, rx = 0, rz = 0) { return this.add(t > 0 ? cboxGeo(w, h, d, t) : new THREE.BoxGeometry(w, h, d), Mx(x, y, z, ry, rx, rz), col); }
  done() { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(this.p, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(this.c, 3)); g.computeVertexNormals(); g.computeBoundingSphere(); g.computeBoundingBox(); return g; }
}
const C3 = hex => { const c = new THREE.Color(hex); return [c.r, c.g, c.b]; };
const COL = { wood: C3(0x7a5236), woodD: C3(0x5a3b26), iron: C3(0x2a272e), purple: C3(0x6a2f8a), gold: C3(0xe9c46a), cloth2: C3(0xd8c9a8), leaf: C3(0x4e7a3c), leaf2: C3(0x6a9a4a), bark: C3(0x5a4030), grass: C3(0x5f8a4c), stone: C3(0xa9a5b0), dstone: C3(0x6f6a7a), fruit: C3(0xc0462e), fruit2: C3(0xe0a030), slate: C3(0x4a4458) };
const GOLDK = [2.7, 2.47, 1.3]; // gold over the slab tone
function buildKit() {
  const K = {}, rng = cityRng(4242), h2 = CB / 2;
  // ashlar courses: [[course height, [stone widths...]], ...] from the bottom of the cell
  const courses = (gb, rows, depth, chip = 0, y0 = -h2) => { let y = y0; for (const [h, ws] of rows) { let x = -h2; for (const w of ws) { if (chip && rng() < chip) { x += w; continue; } const sh = .88 + rng() * .18, dz = (rng() - .5) * .03, dd = (rng() - .5) * .04; gb.box(w - .045, h - .045, depth + dd, .06, x + w / 2, y + h / 2, dz, sh); x += w; } y += h; } };
  const core = gb => gb.box(1.38, 1.4, 1.08, 0, 0, 0, 0, .3); // dark mortar behind the stones
  const A = [[.75, [.75, .75]], [.75, [.375, .75, .375]]], B = [[.75, [.375, .75, .375]], [.75, [.75, .75]]], C = [[.5, [.75, .75]], [.5, [.375, .75, .375]], [.5, [.5, .5, .5]]];
  { const g = new GB(); core(g); courses(g, A, 1.46); K.wallA = g.done(); }
  { const g = new GB(); core(g); courses(g, B, 1.46); K.wallB = g.done(); }
  { const g = new GB(); core(g); courses(g, C, 1.44); K.wallC = g.done(); }
  { const g = new GB(); core(g); courses(g, A, 1.3, .28); g.box(.5, .3, .6, .08, rng() - .5, -.5, .5, .85, .4, .2, .1); K.ruin = g.done(); }
  { const g = new GB(); g.box(1.48, .71, 1.48, .09, .015, -.37, .015, .96); g.box(1.48, .71, 1.48, .09, -.015, .37, -.015, 1.04); K.quoin = g.done(); }
  { const g = new GB(); core(g); courses(g, [[.5, [.75, .75]], [.55, [.375, .75, .375]]], 1.44); g.box(1.5, .14, 1.68, .03, 0, .38, 0, .88); g.box(1.5, .2, 1.9, .05, 0, .62, 0, 1.06); K.cornice = g.done(); }
  { const g = new GB(); g.box(1.46, 1.05, 1.46, .08, 0, -.22, 0, .96); g.box(1.68, .14, 1.68, .03, 0, .38, 0, .88); g.box(1.9, .2, 1.9, .05, 0, .62, 0, 1.06); K.corner = g.done(); }
  { const g = new GB(); g.box(1.46, 1.46, 1.42, .06, 0, 0, 0, 1); for (const y of [-.6, .6]) g.box(1.5, .07, 1.5, .02, 0, y, 0, GOLDK); for (const z of [-.72, .72]) { g.add(new THREE.OctahedronGeometry(.3), Mx(0, 0, z, 0, 0, 0, 1, 1, .25), GOLDK); for (const x of [-.5, .5]) g.add(new THREE.OctahedronGeometry(.12), Mx(x, 0, z, 0, 0, 0, 1, 1, .3), GOLDK); } K.gold = g.done(); }
  { const g = new GB(); g.box(1.38, .95, 1.38, .07, 0, -.27, 0, 1); g.box(1.56, .2, 1.56, .05, 0, .3, 0, .9); g.add(new THREE.ConeGeometry(.58, .4, 4), Mx(0, .6, 0, Math.PI / 4), .84); K.merlon = g.done(); }
  { const g = new GB(); g.box(1.5, 1.26, 1.5, 0, 0, -.12, 0, .7); for (const x of [-.375, .375]) for (const z of [-.375, .375]) g.box(.72, .13, .72, .035, x, .62, z, .9 + rng() * .12); K.paving = g.done(); }
  { const g = new GB(); core(g); courses(g, A, 1.46); for (const z of [-.76, .76]) g.add(new THREE.CylinderGeometry(.21, .21, 1.5, 10), Mx(0, 0, z), 1.08); K.pilaster = g.done(); }
  { const g = new GB(); g.box(1.38, .66, 1.08, 0, 0, .42, 0, .3); courses(g, [[.6, [.375, .75, .375]]], 1.44, 0, .15); for (const s of [-1, 1]) g.box(.3, .65, 1.44, .05, s * .6, -.43, 0, .95);
    for (let i = 0; i < 7; i++) { const a = Math.PI * (i + .5) / 7, last = i === 3; g.box(last ? .32 : .26, last ? .42 : .34, 1.5, .04, Math.cos(a) * .55, -.75 + Math.sin(a) * .58, 0, last ? 1.12 : .98, 0, 0, a - Math.PI / 2); }
    K.arch = g.done(); }
  { const g = new GB(); core(g); courses(g, A, 1.46); g.box(1.5, .32, 1.74, .06, 0, -.59, 0, .84); K.plinth = g.done(); }
  // attachments
  { const g = new GB(); g.box(1.4, .13, .36, .03, 0, 0, 0, 1.04); g.box(.12, .18, .3, .02, -.55, -.12, 0, .9); g.box(.12, .18, .3, .02, .55, -.12, 0, .9); K.sill = g.done(); }
  { const g = new GB(); g.box(1.5, .24, .3, .04, 0, 0, 0, 1.02); g.box(.32, .34, .38, .04, 0, 0, .02, 1.12); K.lintel = g.done(); }
  { const g = new GB(); for (let i = 0; i < 6; i++) g.box(.27, .04, 1.05, .01, -.68 + i * .272, 0, 0, i % 2 ? COL.gold : COL.purple, 0, .36); for (const s of [-1, 1]) g.box(.04, .04, 1.15, 0, s * .82, -.05, 0, COL.iron, 0, .36); g.box(1.66, .05, .05, 0, 0, -.2, .5, COL.iron); K.awning = g.done(); }
  { const g = new GB(); g.box(1.0, 2.7, .05, .01, 0, 0, 0, COL.purple); g.box(1.02, .12, .06, .01, 0, 1.3, 0, COL.gold); g.box(1.02, .08, .06, .01, 0, -1.31, 0, COL.gold); g.add(new THREE.ConeGeometry(.5, .45, 3), Mx(0, -1.55, 0, 0, Math.PI, 0, 1, 1, .1), COL.purple); g.add(new THREE.OctahedronGeometry(.18), Mx(0, .4, .04, 0, 0, 0, 1, 1, .3), COL.gold); g.box(1.2, .05, .05, 0, 0, 1.38, -.1, COL.iron); K.banner = g.done(); }
  { const g = new GB(); g.box(.08, .08, .5, 0, 0, .05, -.2, COL.iron); g.box(.26, .05, .26, .01, 0, .2, .05, COL.iron); g.box(.26, .05, .26, .01, 0, -.18, .05, COL.iron); for (const x of [-.11, .11]) for (const z of [-.06, .16]) g.box(.025, .38, .025, 0, x, .01, z, COL.iron); g.add(new THREE.ConeGeometry(.2, .18, 4), Mx(0, .32, .05, Math.PI / 4), COL.iron); K.lamp = g.done(); }
  // street furniture
  { const g = new GB(); g.box(.55, .4, .55, .05, 0, .2, 0, COL.stone); g.add(new THREE.CylinderGeometry(.07, .1, 3.3, 8), Mx(0, 2.05, 0), COL.iron); g.box(.24, .12, .24, .02, 0, 3.7, 0, COL.iron); for (const x of [-.13, .13]) for (const z of [-.13, .13]) g.box(.03, .48, .03, 0, x, 3.98, z, COL.iron); g.add(new THREE.ConeGeometry(.26, .26, 4), Mx(0, 4.35, 0, Math.PI / 4), COL.iron); g.add(new THREE.SphereGeometry(.06, 6, 4), Mx(0, 4.52, 0), COL.gold); K.lampPost = g.done(); }
  { const g = new GB(); g.box(1.7, .14, .55, .03, 0, .5, 0, COL.stone); for (const x of [-.65, .65]) g.box(.16, .44, .5, .03, x, .22, 0, COL.dstone); g.box(1.7, .5, .1, .03, 0, .82, -.24, COL.stone); K.bench = g.done(); }
  { const g = new GB(); g.box(.8, .8, .8, .03, 0, .4, 0, COL.wood); for (const y of [.12, .4, .68]) for (const z of [-.41, .41]) g.box(.84, .07, .02, 0, 0, y, z, COL.woodD); for (const x of [-.41, .41]) g.box(.02, .07, .84, 0, x, .4, 0, COL.woodD); g.box(.06, .8, .06, 0, -.38, .4, -.38, COL.woodD); K.crate = g.done(); }
  { const g = new GB(); g.add(new THREE.CylinderGeometry(.31, .31, .95, 12), Mx(0, .48, 0), COL.wood); g.add(new THREE.CylinderGeometry(.36, .36, .9, 12), Mx(0, .48, 0, 0, 0, 0, 1, .02 / .9 * 7, 1), COL.wood); for (const y of [.15, .8]) g.add(new THREE.CylinderGeometry(.335, .335, .06, 12), Mx(0, y, 0), COL.iron); K.barrel = g.done(); }
  { const g = new GB(); g.box(2.4, .1, 1.1, .02, 0, .9, 0, COL.wood); for (const x of [-1.1, 1.1]) for (const z of [-.5, .5]) g.box(.1, 2.3, .1, 0, x, 1.15, z, COL.woodD); for (let i = 0; i < 7; i++) g.box(.37, .04, 1.5, .01, -1.1 + i * .366, 2.35, 0, i % 2 ? COL.cloth2 : COL.purple, 0, .18);
    for (let i = 0; i < 6; i++) g.add(new THREE.SphereGeometry(.12, 6, 4), Mx(-.8 + i * .32, 1.05, (i % 2 - .5) * .3), i % 3 ? COL.fruit : COL.fruit2); g.box(.5, .4, .5, .02, .7, 1.15, 0, COL.wood); K.stall = g.done(); }
  { const g = new GB(); g.box(2.2, .5, 2.2, .06, 0, .25, 0, .82); g.box(1.8, 1.0, 1.8, .06, 0, 1, 0, .95); g.box(2.0, .2, 2.0, .05, 0, 1.6, 0, .85); // plinth, then the wizard in stone
    WIZ.updateMatrixWorld(true); const inv = new THREE.Matrix4().copy(WIZ.matrixWorld).invert(); WIZ.traverse(o => { if (o.isMesh && o.geometry?.attributes.position) g.add(o.geometry, Mx(0, 1.7, 0, 0, 0, 0, 1.55).multiply(inv.clone().multiply(o.matrixWorld)), 1.02); }); K.statue = g.done(); }
  { const g = new GB(); g.add(new THREE.CylinderGeometry(2.5, 2.7, .7, 16), Mx(0, .35, 0), .9); g.add(new THREE.CylinderGeometry(2.25, 2.25, .1, 16), Mx(0, .7, 0), .45); g.add(new THREE.CylinderGeometry(.35, .5, 1.8, 10), Mx(0, 1.4, 0), 1); g.add(new THREE.CylinderGeometry(1.1, .35, .4, 12), Mx(0, 2.4, 0), .95); g.add(new THREE.CylinderGeometry(.18, .24, .9, 8), Mx(0, 3, 0), 1.05); g.add(new THREE.SphereGeometry(.2, 8, 5), Mx(0, 3.5, 0), GOLDK.map(v => v * .7)); K.fountain = g.done(); }
  { const g = new GB(); g.add(new THREE.CylinderGeometry(.16, .3, 2.8, 7), Mx(0, 1.4, 0, 0, .05, .04), COL.bark); g.add(new THREE.CylinderGeometry(.06, .1, 1.1, 5), Mx(.35, 2.4, 0, 0, 0, -.7), COL.bark); for (let i = 0; i < 5; i++) { const a = i * 1.3, r = i ? .8 : 0; g.add(new THREE.IcosahedronGeometry(i ? 1.0 + rng() * .3 : 1.45, 1), Mx(Math.cos(a) * r, 3.4 + (i ? rng() * .7 - .2 : .5), Math.sin(a) * r, rng() * 3, rng(), rng()), i % 2 ? COL.leaf : COL.leaf2); } K.tree = g.done(); }
  { const g = new GB(); g.box(1.3, .55, 1.3, .05, 0, .27, 0, COL.stone); g.box(1.1, .1, 1.1, 0, 0, .56, 0, COL.grass); for (let i = 0; i < 6; i++) g.add(new THREE.IcosahedronGeometry(.22, 0), Mx(rng() - .5, .7, rng() - .5, rng() * 3), i % 2 ? COL.leaf : COL.fruit2); K.planter = g.done(); }
  { const g = new GB(); for (let i = 0; i < 9; i++) { const a = rng() * TAU, r = rng() * 1.3, s = .3 + rng() * .5; g.box(s * 1.4, s, s, .05, Math.cos(a) * r, s * .4, Math.sin(a) * r, .8 + rng() * .25, rng() * 3, rng() * .6, rng() * .6); } K.rubble = g.done(); }
  { const g = new GB(); g.add(new THREE.ConeGeometry(1, 1.35, 16, 1, true), Mx(0, .675, 0), COL.slate); g.add(new THREE.CylinderGeometry(1.04, 1.04, .12, 16), Mx(0, .02, 0), GOLDK.map(v => v * .32)); g.add(new THREE.SphereGeometry(.07, 8, 5), Mx(0, 1.42, 0), COL.gold); g.add(new THREE.ConeGeometry(.04, .3, 6), Mx(0, 1.6, 0), COL.gold); K.roof = g.done(); }
  // debris shards: rough broken stone
  for (let s = 0; s < 3; s++) { const g = new GB(), geo = new THREE.IcosahedronGeometry(.5, 0), p = geo.attributes.position; for (let i = 0; i < p.count; i++) p.setXYZ(i, p.getX(i) * (.7 + rng() * .6), p.getY(i) * (.5 + rng() * .5), p.getZ(i) * (.7 + rng() * .6)); g.add(geo, Mx(), 1); K['shard' + s] = g.done(); }
  return K;
}
// glowing bits (lantern crystals, fountain water, crystal caps) draw unlit, so bloom catches them
const GLOWS = { lampGlow: g => g.add(new THREE.OctahedronGeometry(.12), Mx(0, 0, 0, 0, 0, 0, 1, 1.5, 1), [1.8, 1.2, 2.4]), water: g => g.add(new THREE.CylinderGeometry(2.2, 2.2, .04, 16), Mx(0, .73, 0), [.35, .9, 1.4]), spout: g => g.add(new THREE.ConeGeometry(.35, 1.2, 8, 1, true), Mx(0, 2.95, 0, 0, Math.PI), [.4, 1, 1.5]) };

// stone shading: grain, blotches, bump, moss on top faces, grime at the foot (world-space noise, no textures)
function stoneMat({ vc = true, map = null, moss = 1, bump = 1, rough = .86 } = {}) {
  const m = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: rough, metalness: 0, vertexColors: vc, map });
  m.onBeforeCompile = s => {
    s.uniforms.uMoss = { value: moss }; s.uniforms.uBump = { value: HQ ? bump : 0 };
    s.vertexShader = s.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vCWp; varying vec3 vCWn;').replace('#include <project_vertex>', `#include <project_vertex>
      { vec4 cw = vec4(transformed, 1.); vec3 cn = objectNormal;
      #ifdef USE_BATCHING
        cw = batchingMatrix * cw; cn = mat3(batchingMatrix) * cn;
      #endif
      #ifdef USE_INSTANCING
        cw = instanceMatrix * cw; cn = mat3(instanceMatrix) * cn;
      #endif
        vCWp = (modelMatrix * cw).xyz; vCWn = normalize(mat3(modelMatrix) * cn); }`);
    s.fragmentShader = s.fragmentShader.replace('#include <common>', `#include <common>\nvarying vec3 vCWp; varying vec3 vCWn; uniform float uMoss; uniform float uBump;\n${GLSL_NOISE}`)
      .replace('#include <color_fragment>', `#include <color_fragment>
        float cg = fbm(vCWp * .7 + 7.1), cs = noise3(vCWp * 2.6), up = clamp(vCWn.y, 0., 1.);
        diffuseColor.rgb *= .82 + .3 * cg + .06 * cs;
        diffuseColor.rgb *= 1. - .13 * smoothstep(.62, .9, noise3(vec3(vCWp.x * 2.2, vCWp.y * .18, vCWp.z * 2.2))) * (1. - up); // rain streaks
        float mm = smoothstep(.5, .78, fbm(vCWp * .33 + 11.)) * (up * .9 + .3 * smoothstep(2.6, 0., vCWp.y));
        diffuseColor.rgb = mix(diffuseColor.rgb, vec3(.34, .44, .28) * (.75 + .5 * cs), clamp(mm * uMoss, 0., .8));
        diffuseColor.rgb *= mix(.66, 1., smoothstep(-.1, 2.4, vCWp.y));`)
      .replace('#include <roughnessmap_fragment>', `#include <roughnessmap_fragment>
        roughnessFactor = clamp(roughnessFactor + (cg - .5) * .25 - mm * .1, .35, 1.);`)
      .replace('#include <normal_fragment_maps>', `#include <normal_fragment_maps>
        if (uBump > 0.) { float hb = noise3(vCWp * 1.7) * .7 + noise3(vCWp * 4.1) * .3; // broad, soft relief (fine noise sparkles)
          vec3 dpx = dFdx(-vViewPosition), dpy = dFdy(-vViewPosition); float dhx = dFdx(hb), dhy = dFdy(hb);
          vec3 r1 = cross(dpy, normal), r2 = cross(normal, dpx); float det = dot(dpx, r1);
          normal = normalize(abs(det) * normal - sign(det) * (dhx * r1 + dhy * r2) * uBump * .35); }`);
  };
  m.customProgramCacheKey = () => 'citystone' + vc + !!map + moss + bump;
  return m;
}
// ---------- view: build ----------
const cityG = new THREE.Group(); cityG.visible = false; scene.add(cityG);
const cityLights = Array.from({ length: 12 }, () => { const l = new THREE.PointLight(0xff9a4a, 0, 18, 2); l.visible = false; scene.add(l); return l; });
const CHUNK = 32; // cells per district side (48 m)
const LOD_R = 92; // districts further than this draw as plain blocks
const arenaMat = name => { let m = null; arena.traverse(o => { if (!m && o.isMesh && o.material.name === name) m = o.material; }); return m; };
const arenaObj = re => arena.children.find(o => re.test(o.name));
// canvas textures: square paving, cobbles (with a matching bump-like shading baked in)
function paveTex(base, line, n = 8, px = 512, cob = false) {
  const c = document.createElement('canvas'); c.width = c.height = px; const g = c.getContext('2d'), s = px / n, rng = cityRng(cob ? 77 : 55);
  g.fillStyle = line; g.fillRect(0, 0, px, px);
  if (cob) for (let j = 0; j < n * 2; j++) for (let i = 0; i < n * 2; i++) { // offset rows of rounded cobbles
    const w = s * .5, x = i * w + (j % 2) * w * .5, y = j * w, l = 140 + rng() * 26 | 0, gr = g.createRadialGradient(x + w * .4, y + w * .35, 1, x + w * .5, y + w * .5, w * .62);
    gr.addColorStop(0, `rgb(${l + 14},${l + 12},${l + 18})`); gr.addColorStop(1, `rgb(${l - 26},${l - 27},${l - 20})`); g.fillStyle = gr;
    g.beginPath(); g.roundRect(x + 2, y + 2, w - 4, w - 4, w * .35); g.fill();
  } else for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) {
    const l = rng() * 26 - 13, x = i * s, y = j * s, gr = g.createLinearGradient(x, y, x + s, y + s);
    gr.addColorStop(0, base); gr.addColorStop(1, `rgba(0,0,0,${.12 + rng() * .1})`);
    g.fillStyle = base; g.fillRect(x + 2, y + 2, s - 4, s - 4); g.fillStyle = gr; g.fillRect(x + 2, y + 2, s - 4, s - 4);
    g.fillStyle = `rgba(${l > 0 ? 255 : 0},${l > 0 ? 255 : 0},${l > 0 ? 255 : 0},${Math.abs(l) / 160})`; g.fillRect(x + 2, y + 2, s - 4, s - 4);
    if (rng() < .15) { g.strokeStyle = 'rgba(0,0,0,.25)'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(x + rng() * s, y + 3); g.lineTo(x + rng() * s, y + s - 3); g.stroke(); } // a crack
  }
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t;
}
function uvWorld(g, k) { const u = g.attributes.uv, p = g.attributes.position; for (let i = 0; i < u.count; i++) u.setXY(i, p.getX(i) / k, p.getZ(i) / k); return g; }
function buildCityView() {
  const V3 = CITY.view = { dist: [], where: null, debris: null }, L = CITY.lay, K = V3.kit = buildKit(), rng = cityRng(99);
  const mat = V3.mat = stoneMat(), glowMat = new THREE.MeshBasicMaterial({ vertexColors: true, toneMapped: false });
  // ground: a paved disc, cobbled roads, curbed pavements round every block of land, all on a rock underside
  const floor = new THREE.Mesh(uvWorld(new THREE.CircleGeometry(CITY_R + 4, 180).rotateX(-Math.PI / 2), 18), stoneMat({ vc: false, map: paveTex('#7a7484', '#3d3a47'), moss: .35, bump: .5, rough: .9 }));
  floor.receiveShadow = true; cityG.add(floor);
  const roadM = stoneMat({ vc: false, map: paveTex('#858090', '#57525f', 6, 512, true), moss: .25, bump: .8, rough: .8 }); roadM.polygonOffset = true; roadM.polygonOffsetFactor = -2;
  const roadMesh = g => { const m = new THREE.Mesh(uvWorld(g, 6), roadM); m.position.y = .012; m.receiveShadow = true; cityG.add(m); };
  roadMesh(new THREE.PlaneGeometry(10, 2 * CITY_R, 1, 40).rotateX(-Math.PI / 2)); roadMesh(new THREE.PlaneGeometry(2 * CITY_R, 10, 40, 1).rotateX(-Math.PI / 2));
  for (const R0 of RINGS) roadMesh(new THREE.RingGeometry(R0 - 3.6, R0 + 3.6, 180, 1).rotateX(-Math.PI / 2));
  { // side streets as strips between the land blocks
    const g0 = Math.floor(cIx(-CITY_R) / SIDE) - 1, g1 = Math.ceil(cIx(CITY_R) / SIDE) + 1, w = ST * CB;
    for (let g = g0; g < g1; g++) { const c = cX(g * SIDE) - CB / 2 + w / 2; roadMesh(new THREE.PlaneGeometry(w, 2 * CITY_R, 1, 40).rotateX(-Math.PI / 2).translate(c, 0, 0)); roadMesh(new THREE.PlaneGeometry(2 * CITY_R, w, 40, 1).rotateX(-Math.PI / 2).translate(0, 0, c)); }
    // curbs: a raised edging round each block of land (drawn only; you step over them)
    const cb = new GB();
    for (let gx = g0; gx < g1; gx++) for (let gz = g0; gz < g1; gz++) {
      const x0 = -CW + (gx * SIDE + ST) * CB, z0 = -CW + (gz * SIDE + ST) * CB, x1 = -CW + (gx * SIDE + SIDE) * CB, z1 = -CW + (gz * SIDE + SIDE) * CB, mx = (x0 + x1) / 2, mz = (z0 + z1) / 2;
      if (Math.hypot(mx, mz) > CITY_R - 14 || Math.hypot(mx, mz) < 26 || [[x0, z0], [x1, z1], [x0, z1], [x1, z0]].some(([x, z]) => Math.abs(x) < 5.2 || Math.abs(z) < 5.2 || RINGS.some(R0 => Math.abs(Math.hypot(x, z) - R0) < 3.8))) continue;
      for (const [x, z, w, d] of [[mx, z0, x1 - x0, .3], [mx, z1, x1 - x0, .3], [x0, mz, .3, z1 - z0], [x1, mz, .3, z1 - z0]]) cb.box(w, .16, d, .04, x, .08, z, .82);
    }
    const curb = new THREE.Mesh(cb.done(), stoneMat({ moss: .5, bump: .7 })); curb.receiveShadow = true; cityG.add(curb);
  }
  { // underside: an upside-down cone of rock with a jagged rim
    const g = new THREE.ConeGeometry(CITY_R + 5, 120, 96, 10, true).rotateX(Math.PI).translate(0, -60.05, 0), p = g.attributes.position;
    for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i), z = p.getZ(i), n = Math.sin(x * .07) * Math.cos(z * .06) + Math.sin(x * .19 + z * .13) * .5, k = y > -1 ? 0 : 1; p.setXYZ(i, x * (1 + n * .05 * k), y + n * 6 * k, z * (1 + n * .05 * k)); }
    g.computeVertexNormals(); const m = new THREE.Mesh(g, (arenaMat('rock') || new THREE.MeshStandardMaterial({ color: 0x796f79 })).clone()); m.material.side = THREE.DoubleSide; cityG.add(m);
  }
  for (const s of amb.sig) { const o = s.clone(); o.position.set(0, .03, 0); o.scale.multiplyScalar(1.15); cityG.add(o); }
  // blocks and their attachments, one batched mesh per district (near), plain instanced blocks (far)
  const B = L.blocks, VI = L.vis, n = B.length / 5, kitIds = Object.keys(K);
  const dists = new Map(), dOf = (x, z) => Math.floor((x + CW) / (CHUNK * CB)) * 100 + Math.floor((z + CW) / (CHUNK * CB));
  const D = key => dists.get(key) ?? dists.set(key, { blocks: [], atts: [] }).get(key);
  for (let i = 0; i < n; i++) D(dOf(VI[i * 4], VI[i * 4 + 1])).blocks.push(i);
  L.att.forEach((a, i) => D(dOf(a.x, a.z)).atts.push(i));
  V3.where = new Int32Array(n * 3); V3.attAt = new Int32Array(L.att.length * 2); V3.attBy = new Map(); // block -> [district, batched id, far id]; attachment -> [district, id]; owner key -> attachments
  L.att.forEach((a, i) => (V3.attBy.get(a.o) ?? V3.attBy.set(a.o, []).get(a.o)).push(i));
  const vcount = g => g.attributes.position.count, col = new THREE.Color(), far = new THREE.BoxGeometry(CB * .97, CB * .97, CB * .97); far.setAttribute('color', new THREE.Float32BufferAttribute(new Array(far.attributes.position.count * 3).fill(1), 3));
  V3.blockMat = (i) => { const ry = VI[i * 4 + 2] + (rng() - .5) * .02, s = .985 + rng() * .015; return Mx(VI[i * 4], (B[i * 5 + 2] + .5) * CB, VI[i * 4 + 1], ry, (rng() - .5) * .01, (rng() - .5) * .01, VI[i * 4 + 3] * s, s, s); };
  V3.bm = []; V3.blockM = new Array(n);
  for (const [key, d] of dists) {
    const types = [...new Set([...d.blocks.map(i => PT[B[i * 5 + 4]]), ...d.atts.map(i => L.att[i].g)])], cnt = d.blocks.length + d.atts.length;
    const bm = new THREE.BatchedMesh(cnt, types.reduce((s, t) => s + vcount(K[t]), 0), 0, mat); bm.castShadow = bm.receiveShadow = true; bm.sortObjects = false;
    const gid = Object.fromEntries(types.map(t => [t, bm.addGeometry(K[t])]));
    const im = new THREE.InstancedMesh(far, mat, Math.max(1, d.blocks.length)); im.receiveShadow = true; im.castShadow = false;
    d.blocks.forEach((i, j) => {
      const m = V3.blockM[i] = V3.blockMat(i), id = bm.addInstance(gid[PT[B[i * 5 + 4]]]); bm.setMatrixAt(id, m); col.set(B[i * 5 + 3]).offsetHSL(0, 0, (rng() - .5) * .04); bm.setColorAt(id, col);
      im.setMatrixAt(j, m); im.setColorAt(j, col); V3.where[i * 3] = V3.bm.length; V3.where[i * 3 + 1] = id; V3.where[i * 3 + 2] = j;
    });
    d.atts.forEach(i => { const a = L.att[i], id = bm.addInstance(gid[a.g]); bm.setMatrixAt(id, Mx(a.x, a.y, a.z, a.ry)); bm.setColorAt(id, col.set(a.g === 'sill' || a.g === 'lintel' ? STONE.b : 0xffffff)); V3.attAt[i * 2] = V3.bm.length; V3.attAt[i * 2 + 1] = id; });
    bm.computeBoundingSphere(); im.computeBoundingSphere(); cityG.add(bm, im);
    const c = bm.boundingSphere.center; V3.bm.push({ bm, im, cx: c.x, cz: c.z, rad: bm.boundingSphere.radius, near: true, dirty: false });
  }
  // glowing bits: lantern crystals on walls and posts, fountain water
  const glowList = [];
  L.att.forEach((a, i) => { if (a.g === 'lamp') glowList.push({ g: 'lampGlow', m: Mx(a.x + Math.sin(a.ry) * 0, a.y + .02, a.z).multiply(Mx(0, 0, .05)), att: i }); });
  // props
  const tpl = { brazier: arenaObj(/^brazier_\d+$/), flame: arenaObj(/^brazier_flame_\d+$/), monolith: arenaObj(/^monolith_\d+$/), pillar: arenaObj(/^pillar_\d+$/), crystal: arenaObj(/^crystal_\d+$/), rock: arenaObj(/^float_rock_\d+$/) };
  const KP = { lamp: 'lampPost', bench: 'bench', crate: 'crate', barrel: 'barrel', stall: 'stall', statue: 'statue', fountain: 'fountain', tree: 'tree', planter: 'planter', rubble: 'rubble', roof: 'roof' };
  const pk = [...new Set(CITY.props.filter(p => KP[p.k]).map(p => KP[p.k]))];
  const pbm = new THREE.BatchedMesh(CITY.props.length + 4, pk.reduce((s, t) => s + vcount(K[t]), 0), 0, stoneMat({ moss: .45 })); pbm.castShadow = pbm.receiveShadow = true; pbm.sortObjects = false;
  const pgid = Object.fromEntries(pk.map(t => [t, pbm.addGeometry(K[t])]));
  V3.pbm = pbm; V3.flames = []; V3.rocks = []; V3.cry = [];
  for (const P of CITY.props) {
    if (KP[P.k]) {
      const sc = P.k === 'roof' ? P.s : P.k === 'tree' || P.k === 'rubble' ? P.s ?? 1 : 1, m = P.k === 'roof' ? Mx(P.x, P.y, P.z, 0, 0, 0, sc, sc * 1.1, sc) : Mx(P.x, P.y ?? 0, P.z, P.yaw ?? 0, 0, 0, sc);
      P.bid = pbm.addInstance(pgid[KP[P.k]]); pbm.setMatrixAt(P.bid, m); pbm.setColorAt(P.bid, col.set(P.k === 'statue' || P.k === 'fountain' || P.k === 'rubble' ? STONE.a : 0xffffff)); P.m = m; P.geo = KP[P.k];
      if (P.k === 'lamp') { glowList.push({ g: 'lampGlow', m: Mx(P.x, 3.98, P.z), prop: P }); P.light = V(P.x, 3.9, P.z); }
      if (P.k === 'fountain') { glowList.push({ g: 'water', m: Mx(P.x, 0, P.z), prop: P }, { g: 'spout', m: Mx(P.x, 0, P.z), prop: P }); }
      continue;
    }
    const g = new THREE.Group(); g.position.set(P.x, P.y ?? 0, P.z);
    const add = (t, s = 1) => { if (!t) return null; const o = t.clone(); o.position.set(0, 0, 0); o.scale.multiplyScalar(s); g.add(o); return o; };
    if (P.k === 'brazier') { add(tpl.brazier); const f = add(tpl.flame); if (f) { f.position.y = tpl.flame.position.y - tpl.brazier.position.y; V3.flames.push(f); } P.light = V(P.x, 2, P.z); P.warm = 1; }
    else if (P.k === 'pillar') add(tpl.pillar);
    else if (P.k === 'monolith') { const o = add(tpl.monolith); if (o) o.position.y = 0; g.rotation.y = P.yaw; }
    else if (P.k === 'crystal') { add(tpl.crystal, P.s ?? 1.4); V3.cry.push(g); }
    else if (P.k === 'rock') { add(tpl.rock, P.s); V3.rocks.push({ o: g, y: g.position.y, ph: rng() * TAU }); }
    else if (P.k === 'garden') { const m = new THREE.Mesh(new THREE.PlaneGeometry(P.w - 1, P.d - 1).rotateX(-Math.PI / 2), arenaMat('grass') || new THREE.MeshStandardMaterial({ color: 0x699559 })); m.position.y = .03; m.receiveShadow = true; g.add(m); }
    g.traverse(o => { if (o.isMesh) { o.castShadow = !o.material.emissive?.getHex(); o.receiveShadow = true; } });
    P.o = g; cityG.add(g);
  }
  pbm.computeBoundingSphere(); cityG.add(pbm);
  const gk = Object.keys(GLOWS), GK = Object.fromEntries(gk.map(k => { const g = new GB(); GLOWS[k](g); return [k, g.done()]; }));
  const gbm = new THREE.BatchedMesh(glowList.length + 4, gk.reduce((s, k) => s + vcount(GK[k]), 0), 0, glowMat); gbm.sortObjects = false;
  const ggid = Object.fromEntries(gk.map(k => [k, gbm.addGeometry(GK[k])]));
  for (const G of glowList) { G.id = gbm.addInstance(ggid[G.g]); gbm.setMatrixAt(G.id, G.m); if (G.prop) (G.prop.glow ??= []).push(G.id); if (G.att != null) (V3.attGlow ??= new Map()).set(G.att, G.id); }
  gbm.computeBoundingSphere(); cityG.add(gbm); V3.gbm = gbm;
  // debris: a pool of pieces that can take the shape of anything that breaks
  const DN = HQ ? 3200 : 1600, dk = [...kitIds], dbm = new THREE.BatchedMesh(DN, dk.reduce((s, t) => s + vcount(K[t]), 0), 0, stoneMat({ moss: .3 }));
  dbm.castShadow = dbm.receiveShadow = true; dbm.sortObjects = false; dbm.frustumCulled = false; dbm.perObjectFrustumCulled = true;
  const dgid = Object.fromEntries(dk.map(t => [t, dbm.addGeometry(K[t])]));
  for (let i = 0; i < DN; i++) { const id = dbm.addInstance(dgid.shard0); dbm.setVisibleAt(id, false); }
  cityG.add(dbm);
  const half = Object.fromEntries(dk.map(t => { const b = K[t].boundingBox; return [t, [(b.max.x - b.min.x) / 2, (b.max.y - b.min.y) / 2, (b.max.z - b.min.z) / 2, -b.min.y]]; }));
  V3.debris = { bm: dbm, gid: dgid, half, n: DN, used: 0, head: 0, p: new Float32Array(DN * 3), v: new Float32Array(DN * 3), r: new Float32Array(DN * 3), w: new Float32Array(DN * 3), s: new Float32Array(DN * 3), rest: new Float32Array(DN), age: new Float32Array(DN), on: new Uint8Array(DN), sleep: new Uint8Array(DN), quiet: new Float32Array(DN), big: new Uint8Array(DN) };
  V3.hm = new Float32Array(560 * 560); // rubble height on the floor, 0.75 m squares
}
function cityViewReset() {
  const V3 = CITY.view; if (!V3) return;
  for (const d of V3.bm) { for (let i = 0; i < d.bm.maxInstanceCount; i++) try { d.bm.setVisibleAt(i, true); } catch {} }
  const B = CITY.lay.blocks, n = B.length / 5; for (let i = 0; i < n; i++) { const d = V3.bm[V3.where[i * 3]]; d.im.setMatrixAt(V3.where[i * 3 + 2], V3.blockM[i]); d.im.instanceMatrix.needsUpdate = true; }
  for (const P of CITY.props) { P.dead = 0; if (P.o) P.o.visible = true; if (P.bid != null) V3.pbm.setVisibleAt(P.bid, true); for (const g of P.glow || []) V3.gbm.setVisibleAt(g, true); }
  if (V3.attGlow) for (const g of V3.attGlow.values()) V3.gbm.setVisibleAt(g, true);
  const Dd = V3.debris; Dd.on.fill(0); for (let i = 0; i < Dd.n; i++) Dd.bm.setVisibleAt(i, false); Dd.used = 0; V3.hm.fill(0);
  for (const b of CITY.blk.values()) b.hidden = 0;
}

// ---------- debris: thrown, tumbling, piling up, kicked about again ----------
const _dm = new THREE.Matrix4(), _dq = new THREE.Quaternion(), _de = new THREE.Euler(), _ds = V(), _dp = V(), _dc = new THREE.Color();
const hmIx = (x, z) => { const i = Math.floor((x + CW) / .75), j = Math.floor((z + CW) / .75); return i >= 0 && j >= 0 && i < 560 && j < 560 ? i * 560 + j : -1; };
function debrisSlot() { // a free slot, or the oldest resting piece
  const D = CITY.view.debris;
  for (let t = 0; t < D.n; t++) { const i = D.head = (D.head + 1) % D.n; if (!D.on[i]) return i; }
  let best = 0, ba = -1; for (let i = 0; i < D.n; i++) if (D.sleep[i] && D.age[i] > ba) { ba = D.age[i]; best = i; }
  return best;
}
function spawnDebris(geo, m, color, vel, spin = 1, big = 1) {
  const D = CITY.view.debris, i = debrisSlot(), o = i * 3;
  m.decompose(_dp, _dq, _ds); _de.setFromQuaternion(_dq);
  D.p.set([_dp.x, _dp.y, _dp.z], o); D.v.set(vel, o); D.r.set([_de.x, _de.y, _de.z], o); D.s.set([_ds.x, _ds.y, _ds.z], o);
  D.w.set([rand(-1, 1) * 6 * spin, rand(-1, 1) * 4 * spin, rand(-1, 1) * 6 * spin], o);
  const h = D.half[geo]; D.rest[i] = Math.min(h[0] * _ds.x, h[1] * _ds.y, h[2] * _ds.z) * .92; // lying on its flattest side
  D.on[i] = 1; D.sleep[i] = 0; D.age[i] = 0; D.quiet[i] = 0; D.big[i] = big;
  D.bm.setGeometryIdAt(i, D.gid[geo]); D.bm.setColorAt(i, _dc.set(color)); D.bm.setVisibleAt(i, true); D.bm.setMatrixAt(i, m);
}
// shove the debris near a blast (any explosion, broken or not)
function cityPush(x, y, z, r, str) {
  const D = CITY.view?.debris; if (!D || !cityG.visible) return;
  for (let i = 0; i < D.n; i++) {
    if (!D.on[i]) continue; const o = i * 3, dx = D.p[o] - x, dy = D.p[o + 1] - y, dz = D.p[o + 2] - z, d = Math.hypot(dx, dy, dz);
    if (d > r) continue;
    const k = str * (1 - d / r) * (D.big[i] ? .55 : 1) / Math.max(.5, d);
    D.v[o] += dx * k; D.v[o + 1] += Math.abs(dy) * k * .4 + str * (1 - d / r) * .5; D.v[o + 2] += dz * k; D.w[o] += rand(-4, 4); D.w[o + 2] += rand(-4, 4);
    if (D.sleep[i]) { D.sleep[i] = 0; const h = hmIx(D.p[o], D.p[o + 2]); if (h >= 0) CITY.view.hm[h] = Math.max(0, CITY.view.hm[h] - D.rest[i] * 1.6); }
  }
}
// what breaking looks like: each stone is thrown off whole, away from the hit, with chips and dust; collapsing stones drop and tumble
function cityBreakFx(e) {
  const V3 = CITY.view; if (!V3) return;
  const B = CITY.lay.blocks, all = [...e.a.map(k => [k, 0]), ...e.f.map(k => [k, 1])], s = e.s ?? 10, chips = all.length > 60 ? 0 : all.length > 20 ? 1 : 2;
  let dust = 0;
  for (const [k, falling] of all) {
    const b = CITY.blk.get(k); if (!b || b.hidden) continue; b.hidden = 1;
    const i = b.n, d = V3.bm[V3.where[i * 3]], t = PT[B[i * 5 + 4]], c = B[i * 5 + 3], m = V3.blockM[i];
    d.bm.setVisibleAt(V3.where[i * 3 + 1], false); d.im.setMatrixAt(V3.where[i * 3 + 2], _dm.makeScale(0, 0, 0)); d.dirty = true;
    const x = m.elements[12], y = m.elements[13], z = m.elements[14], dx = x - e.x, dy = y - e.y, dz = z - e.z, dd = Math.hypot(dx, dy, dz) || 1;
    if (falling) { const hx = dx / Math.max(1, Math.hypot(dx, dz)), hz = dz / Math.max(1, Math.hypot(dx, dz)); spawnDebris(t, m.clone(), c, [hx * rand(.5, 2.5) + rand(-.4, .4), rand(-1, 1), hz * rand(.5, 2.5) + rand(-.4, .4)], .45); }
    else {
      const f = s * Math.min(1.6, 2.2 / Math.max(.8, dd)) * rand(.75, 1.15);
      spawnDebris(t, m.clone(), c, [dx / dd * f + rand(-2, 2), dy / dd * f * .6 + rand(2, 5.5) + f * .25, dz / dd * f + rand(-2, 2)], 1.2);
      for (let q = 0; q < chips; q++) { const sz = rand(.18, .42); spawnDebris('shard' + (q % 3), Mx(x + rand(-.5, .5), y + rand(-.5, .5), z + rand(-.5, .5), rand(0, 6), rand(0, 6), 0, sz), c, [dx / dd * f * 1.3 + rand(-4, 4), rand(3, 8), dz / dd * f * 1.3 + rand(-4, 4)], 2.5, 0); }
    }
    for (const a of V3.attBy.get(k) || []) { // windows sills, awnings, banners and lanterns go with the stone they hang on
      const A = CITY.lay.att[a], ad = V3.bm[V3.attAt[a * 2]]; if (!ad.bm.getVisibleAt(V3.attAt[a * 2 + 1])) continue;
      ad.bm.setVisibleAt(V3.attAt[a * 2 + 1], false); const gl = V3.attGlow?.get(a); if (gl != null) V3.gbm.setVisibleAt(gl, false);
      spawnDebris(A.g, Mx(A.x, A.y, A.z, A.ry), A.g === 'sill' || A.g === 'lintel' ? STONE.b : 0xffffff, [dx / dd * s * .5 + rand(-2, 2), rand(1, 4), dz / dd * s * .5 + rand(-2, 2)], 1.4);
    }
    if (dust++ < 9) dustFx(x, z, 1.3, 0x8a8290);
  }
  if (all.length) {
    const near = distTo(e.x, e.z) < 45 ? 1 : .3; shake(Math.min(.55, .05 + all.length * .007) * near); sfx(all.length > 12 ? 'smash' : 'earth');
    if (e.f.length > 6) { setTimeout(() => sfx('earth_big'), 380); smokeFx(e.x, Math.min(e.y + 2, 10), e.z, 3 + Math.min(6, e.f.length * .05), 0x8a8290, 3, 8, 1.4); }
    burst(e.x, e.y, e.z, Math.min(60, 10 + all.length * 2), 0xb8b2c0, 7, .12, .5, 9);
  }
  cityPush(e.x, e.y, e.z, (e.r ?? 2) + 3.5, s * .8);
}
function cityPropFx(e) {
  const p = CITY.props[e.i], V3 = CITY.view; if (!p || !V3) return;
  if (p.o ? !p.o.visible : p.bid != null && !V3.pbm.getVisibleAt(p.bid)) return;
  p.hp = 0; p.dead = 1; if (p.solid) { const i = PILLARS.indexOf(p.solid); if (i >= 0) PILLARS.splice(i, 1); }
  if (p.o) p.o.visible = false;
  if (p.bid != null) { V3.pbm.setVisibleAt(p.bid, false); spawnDebris(p.geo, p.m.clone(), p.k === 'statue' || p.k === 'fountain' ? STONE.a : 0xffffff, [rand(-3, 3), rand(3, 7), rand(-3, 3)], p.k === 'fountain' ? .1 : 1); }
  for (const g of p.glow || []) V3.gbm.setVisibleAt(g, false);
  const y = p.k === 'crystal' || p.k === 'roof' ? p.y : 1.5, col = p.k === 'crystal' ? 0xdaa0ff : p.k === 'brazier' ? 0xc4a06c : p.k === 'tree' ? 0x5a8a44 : STONE.a;
  for (let f = 0; f < (p.k === 'monolith' || p.k === 'statue' || p.k === 'fountain' ? 16 : 7); f++) { const sz = rand(.2, .55); spawnDebris('shard' + (f % 3), Mx(p.x + rand(-.6, .6), y + rand(0, 2), p.z + rand(-.6, .6), rand(0, 6), rand(0, 6), 0, sz), col, [rand(-6, 6), rand(3, 9), rand(-6, 6)], 2.5, 0); }
  if (p.k === 'crystal') { burst(p.x, y, p.z, 60, 0xdaa0ff, 9, .3, .6); flash(p.x, y, p.z, 0xdaa0ff, 40, .3); sfx('tink'); }
  else if (p.k === 'brazier' || p.k === 'lamp') { burst(p.x, p.k === 'lamp' ? 3.9 : 1.5, p.z, 40, 0xff9a4a, 7, .25, .6, -2); sfx('fire'); }
  else if (p.k === 'fountain') { burst(p.x, 1, p.z, 90, 0x9ad8ff, 9, .3, .8, 8); sfx('water_big'); }
  dustFx(p.x, p.z, 2, 0x8a8290); sfx('smash');
}
// every frame while the city is shown: debris physics, LOD, flames, lights, shadows following you
function cityFrame(dt, t) {
  const V3 = CITY.view; if (!V3 || !cityG.visible) return;
  dt = Math.min(dt, 1 / 30);
  const cp = camera.position;
  for (const d of V3.bm) { // near districts carved, far ones plain
    const near = Math.hypot(d.cx - cp.x, d.cz - cp.z) - d.rad < LOD_R;
    if (near !== d.near) { d.near = near; d.bm.visible = near; d.im.visible = !near; }
    if (d.dirty) { d.dirty = false; d.im.instanceMatrix.needsUpdate = true; }
  }
  const D = V3.debris, HM = V3.hm, me = role === 'guest' ? G : S.players?.[myId];
  for (let i = 0; i < D.n; i++) {
    if (!D.on[i]) continue;
    D.age[i] += dt;
    const o = i * 3;
    if (D.sleep[i]) { // resting: walking through kicks it
      if (me && !me.down) { const dx = D.p[o] - me.x, dz = D.p[o + 2] - me.z, d = Math.hypot(dx, dz); if (d < .85 && Math.abs(D.p[o + 1] - me.y) < 1.4) { const k = (D.big[i] ? 1.6 : 4) / Math.max(.3, d); D.v[o] = dx * k; D.v[o + 1] = D.big[i] ? .8 : 2.5; D.v[o + 2] = dz * k; D.w[o] = rand(-5, 5); D.w[o + 2] = rand(-5, 5); D.sleep[i] = 0; const h = hmIx(D.p[o], D.p[o + 2]); if (h >= 0) HM[h] = Math.max(0, HM[h] - D.rest[i] * 1.6); } }
      continue;
    }
    D.v[o + 1] -= 24 * dt;
    const ox = D.p[o], oy = D.p[o + 1], oz = D.p[o + 2];
    let nx = ox + D.v[o] * dt, ny = oy + D.v[o + 1] * dt, nz = oz + D.v[o + 2] * dt;
    if (blockAt(nx, ny, oz)) { nx = ox; D.v[o] *= -.3; } // bounce off walls still standing
    if (blockAt(nx, ny, nz)) { nz = oz; D.v[o + 2] *= -.3; }
    if (blockAt(nx, ny, nz)) { ny = oy; D.v[o + 1] = Math.max(0, D.v[o + 1]) * .2; }
    const h = hmIx(nx, nz), floor = (h >= 0 ? HM[h] : 0) + D.rest[i];
    let ground = false;
    if (ny < floor) {
      ny = floor; ground = true;
      if (D.v[o + 1] < -3) { D.v[o + 1] *= -.28; D.w[o] *= .6; D.w[o + 2] *= .6; if (D.big[i] && D.v[o + 1] > 2.5 && Math.random() < .25) dustFx(nx, nz, .8, 0x8a8290); }
      else D.v[o + 1] = 0;
      const fr = Math.exp(-6 * dt); D.v[o] *= fr; D.v[o + 2] *= fr; for (let k = 0; k < 3; k++) D.w[o + k] *= Math.exp(-5 * dt);
    }
    D.p[o] = nx; D.p[o + 1] = ny; D.p[o + 2] = nz;
    for (let k = 0; k < 3; k++) D.r[o + k] += D.w[o + k] * dt;
    if (ground) { // tip over onto a flat face as it slows
      const q = Math.PI / 2; for (const k of [0, 2]) { const tgt = Math.round(D.r[o + k] / q) * q; D.r[o + k] += (tgt - D.r[o + k]) * Math.min(1, dt * 5); }
      if (Math.hypot(D.v[o], D.v[o + 1], D.v[o + 2]) < .35) { if ((D.quiet[i] += dt) > .25) { D.sleep[i] = 1; D.quiet[i] = 0; if (h >= 0) HM[h] = Math.max(HM[h], ny - D.rest[i] + D.rest[i] * 1.6); } } else D.quiet[i] = 0;
    }
    if (ny < -40) { D.on[i] = 0; D.bm.setVisibleAt(i, false); continue; } // fell off the island
    if (!MAP.rects && Math.hypot(nx, nz) > CITY_R + 3 && ny <= floor + .01) { D.v[o + 1] = -1; HM[h] = -999; } // over the edge: let it drop
    _de.set(D.r[o], D.r[o + 1], D.r[o + 2]); _dq.setFromEuler(_de); _ds.set(D.s[o], D.s[o + 1], D.s[o + 2]); _dp.set(nx, ny, nz);
    D.bm.setMatrixAt(i, _dm.compose(_dp, _dq, _ds));
  }
  for (const f of V3.flames) f.scale.y = 1 + .12 * Math.sin(t * 9 + f.id);
  for (const r of V3.rocks) { r.o.position.y = r.y + Math.sin(t * .4 + r.ph) * 1.2; r.o.rotation.y += dt * .05; }
  for (const c of V3.cry) c.rotation.y += dt * .4;
  if ((V3.lt = (V3.lt || 0) - dt) <= 0) { // light the braziers and lamps nearest the camera
    V3.lt = .4; const lit = CITY.props.filter(p => p.light && !p.dead).sort((a, b) => a.light.distanceToSquared(cp) - b.light.distanceToSquared(cp));
    cityLights.forEach((l, i) => { const p = lit[i]; l.visible = !!p && p.light.distanceTo(cp) < 70; if (p) { l.position.copy(p.light); l.color.set(p.warm ? 0xff8a3a : 0xc8a0ff); l.userData.b = p.warm ? 26 : 14; } });
  }
  cityLights.forEach((l, i) => { if (l.visible) l.intensity = (l.userData.b || 20) * (.9 + .1 * Math.sin(t * 11 + i * 3)); });
  moon.target.position.set(cp.x, 0, cp.z); moon.position.set(cp.x, 0, cp.z).addScaledVector(BH, 70); moon.target.updateMatrixWorld();
}
