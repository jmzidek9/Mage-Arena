// Mage City: a floating city under the black hole, about a minute's walk across, built in the arena's stone, gold and violet.
// Every building is made of 1.5 m stone blocks that can be blasted out; blocks left without support collapse.
// The layout comes from a fixed seed, so host and guest build the same city; the host decides what breaks and sends it as 'blk' events.
// Loaded after dungeon.js (uses sim, modes and the arena's assets), before view.js.
'use strict';

const CITY_R = 205, CB = 1.5, CW = 210, CN = Math.ceil(2 * CW / CB), CH = 22; // walkable radius, block size, grid half-width, cells per side, max levels
const cIx = x => Math.floor((x + CW) / CB), cX = i => -CW + (i + .5) * CB; // world <-> grid
const cKey = (ix, iz, lv) => (ix * CN + iz) * 32 + lv;
const CITY = { occ: new Uint32Array(CN * CN), blk: new Map(), list: [], props: [], ready: false, dist: null, fieldT: 0, view: null };
const STONE = { a: 0xadaaaf, b: 0x9b99a4, moss: 0x949e8f, slab: 0x5c5769, gold: 0xf9d789, dark: 0x6d6876 };

// ---------- layout (deterministic) ----------
function cityRng(seed) { return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
// roads: the two avenues through the centre, two ring roads, the side-street grid, and the plaza
const SIDE = 22; // side streets every 22 cells (33 m), 4 cells wide
function onRoad(x, z) {
  const r = Math.hypot(x, z);
  if (r < 27 || Math.abs(x) < 6 || Math.abs(z) < 6) return true; // plaza, avenues
  if (Math.abs(r - 72) < 4.5 || Math.abs(r - 142) < 4.5) return true; // ring roads
  const gx = ((cIx(x) % SIDE) + SIDE) % SIDE, gz = ((cIx(z) % SIDE) + SIDE) % SIDE;
  return gx < 4 || gz < 4;
}
function cityLayout() {
  const rng = cityRng(7331), R = (a, b) => a + rng() * (b - a), blocks = [], props = [];
  const put = (ix, iz, lv, c) => { if (ix >= 0 && iz >= 0 && ix < CN && iz < CN && lv < CH) blocks.push(ix, iz, lv, c); };
  const tone = (lv, ruin) => { const k = rng(); if (lv < 3 && k < (.22 - lv * .07) * (ruin ? 2 : 1)) return STONE.moss; return k < .6 ? STONE.a : STONE.b; };
  // rectangular building on cells [x0, x1) x [z0, z1)
  function house(x0, z0, x1, z1, h, kind) {
    const ruin = kind === 'ruin', hall = kind === 'hall', w = x1 - x0, d = z1 - z0, roof = !ruin && w * d < 90 && rng() < .55;
    const cx = (x0 + x1 - 1) / 2, cz = (z0 + z1 - 1) / 2;
    for (let ix = x0; ix < x1; ix++) for (let iz = z0; iz < z1; iz++) {
      const edgeX = ix === x0 || ix === x1 - 1, edgeZ = iz === z0 || iz === z1 - 1;
      if (!edgeX && !edgeZ) { if (roof) put(ix, iz, h - 1, STONE.slab); continue; }
      const corner = edgeX && edgeZ, along = edgeZ ? ix - x0 : iz - z0, mid = edgeZ ? Math.abs(ix - cx) < 1 : Math.abs(iz - cz) < 1;
      const top = ruin ? h - Math.floor(rng() ** 2 * Math.min(h - 1, 4)) : h;
      for (let lv = 0; lv < top + (corner ? 1 : 0); lv++) {
        if (!corner && mid && lv < 2) continue; // doorways in the middle of every side
        if (!corner && lv % 3 === 1 && lv > 1 && along % 3 === 1) continue; // windows
        const c = corner || (lv === 0 && !ruin) ? STONE.slab : hall && lv === h - 1 ? (along % 2 ? STONE.gold : STONE.slab) : tone(lv, ruin); // dark corners and base course, gold-banded halls
        put(ix, iz, lv, c);
      }
      if (!ruin && !corner && along % 2 === 0) put(ix, iz, top, corner ? STONE.slab : STONE.b); // crenellations
    }
    if (hall && rng() < .6) props.push({ k: 'banner', x: cX(x0) - CB * .6, z: cX(Math.round(cz)), y: h * CB * .6, yaw: -Math.PI / 2 });
  }
  function tower(ix0, iz0, rr, h) {
    for (let ix = ix0 - rr - 1; ix <= ix0 + rr + 1; ix++) for (let iz = iz0 - rr - 1; iz <= iz0 + rr + 1; iz++) {
      const d = Math.hypot(ix - ix0, iz - iz0); if (Math.abs(d - rr) > .62) continue;
      const a = Math.atan2(iz - iz0, ix - ix0);
      for (let lv = 0; lv < h; lv++) {
        if (lv < 2 && Math.abs(a - Math.PI / 2) < .5) continue; // door
        if (lv > 2 && lv % 4 === 2 && Math.sin(a * 3 + lv) > .4) continue; // slit windows climbing round
        put(ix, iz, lv, lv === h - 1 ? STONE.gold : lv % 5 === 4 ? STONE.slab : tone(lv, false));
      }
      if (Math.round(a * 4) % 2 === 0) put(ix, iz, h, STONE.slab);
    }
    props.push({ k: 'crystal', x: cX(ix0), z: cX(iz0), y: h * CB + 1.2, s: 1.6 + rr * .2 });
  }
  // the grid blocks between side streets, split into lots
  const g0 = Math.floor(cIx(-CITY_R) / SIDE) - 1, g1 = Math.ceil(cIx(CITY_R) / SIDE) + 1;
  for (let gx = g0; gx < g1; gx++) for (let gz = g0; gz < g1; gz++) {
    const bx0 = gx * SIDE + 4, bz0 = gz * SIDE + 4, bx1 = gx * SIDE + SIDE, bz1 = gz * SIDE + SIDE; // 18 x 18 cells of land
    const lots = [[bx0, bz0, bx1, bz1]];
    for (let s = 0; s < 2; s++) { const L = lots.shift(), [a, b, c, d] = L; if (c - a > 9 && (rng() < .5 || d - b <= 9)) { const m = Math.round(a + (c - a) * R(.35, .65)); lots.push([a, b, m - 1, d], [m + 1, b, c, d]); } else if (d - b > 9) { const m = Math.round(b + (d - b) * R(.35, .65)); lots.push([a, b, c, m - 1], [a, m + 1, c, d]); } else lots.push(L); }
    for (const [a, b, c, d] of lots) {
      if (c - a < 4 || d - b < 4) continue;
      const corners = [[a, b], [c - 1, b], [a, d - 1], [c - 1, d - 1], [(a + c) / 2, (b + d) / 2]];
      if (corners.some(([i, j]) => { const x = cX(i), z = cX(j); return Math.hypot(x, z) > CITY_R - 8 || onRoad(x, z); })) continue;
      const r = Math.hypot(cX((a + c) / 2), cX((b + d) / 2)), k = rng();
      if (k < .12) { props.push({ k: 'garden', x: cX((a + c - 1) / 2), z: cX((b + d - 1) / 2), w: (c - a) * CB, d: (d - b) * CB }); continue; } // an open courtyard
      if (r < 72) {
        if (k < .45 && c - a >= 7 && d - b >= 7) tower(Math.round((a + c - 1) / 2), Math.round((b + d - 1) / 2), Math.min(3, Math.floor((Math.min(c - a, d - b) - 2) / 2)), Math.round(R(12, 19)));
        else house(a, b, c, d, Math.round(R(7, 11)), 'hall');
      } else if (r < 142) house(a + 1, b + 1, c - 1, d - 1, Math.round(R(4, 7)), k < .3 ? 'hall' : 'house');
      else house(a + 1, b + 1, c - 1, d - 1, Math.round(R(3, 6)), 'ruin');
    }
  }
  // a low crenellated parapet round the island's rim
  for (let a = 0; a < TAU; a += CB / (CITY_R + 2)) { const ix = cIx(Math.cos(a) * (CITY_R + 2)), iz = cIx(Math.sin(a) * (CITY_R + 2)); put(ix, iz, 0, STONE.slab); if (Math.round(a * (CITY_R + 2) / CB) % 3 === 0) put(ix, iz, 1, STONE.b); }
  // plaza: monoliths in a ring, braziers, crystals; braziers and colonnades along the avenues
  for (let i = 0; i < 8; i++) { const a = TAU * i / 8 + TAU / 16; props.push({ k: 'monolith', x: Math.cos(a) * 19, z: Math.sin(a) * 19, yaw: -a }); }
  for (let i = 0; i < 4; i++) { const a = TAU * i / 4 + TAU / 8; props.push({ k: 'brazier', x: Math.cos(a) * 11, z: Math.sin(a) * 11 }); props.push({ k: 'crystal', x: Math.cos(a) * 24, z: Math.sin(a) * 24, y: 1.2, s: 1.4 }); }
  for (const s of [-1, 1]) for (let t = 34; t < CITY_R - 10; t += 22) for (const side of [-1, 1]) {
    for (const [x, z] of [[t * s, side * 5], [side * 5, t * s]]) props.push({ k: (t / 22 | 0) % 2 ? 'brazier' : 'pillar', x, z });
  }
  for (let i = 0; i < 26; i++) { const a = rng() * TAU, r = CITY_R + R(14, 60); props.push({ k: 'rock', x: Math.cos(a) * r, z: Math.sin(a) * r, y: R(-12, 18), s: R(1, 3.2) }); }
  return { blocks: new Int32Array(blocks), props };
}

// ---------- state: blocks, damage, collapse (host decides, both apply) ----------
function cityMap() {
  MAP.r = CITY_R; MAP.rects = MAP.erects = null; PILLARS.length = 0;
  if (!CITY.ready) { // first visit: build it, then compile its shaders now rather than mid-fight on the first wall that breaks
    CITY.lay = cityLayout(); CITY.ready = true; buildCityView();
    const F = CITY.view.frags.im, vis = cityG.visible; cityG.visible = true; F.count = 1; try { renderer.compile(scene, camera); } catch {} F.count = 0; cityG.visible = vis;
  }
  if (!CITY.blk.size) { cityReset(); return; } // first time on this machine: every block in place (the guest may miss the reset event)
  for (const p of CITY.props) if (p.solid && p.hp > 0) PILLARS.push(p.solid);
}
// put every block and prop back (a new game)
function cityReset() {
  if (!CITY.ready) cityMap();
  const B = CITY.lay.blocks; CITY.occ.fill(0); CITY.blk.clear();
  for (let i = 0; i < B.length; i += 4) { const k = cKey(B[i], B[i + 1], B[i + 2]); CITY.occ[B[i] * CN + B[i + 1]] |= 1 << B[i + 2]; CITY.blk.set(k, { hp: B[i + 2] === 0 ? 45 : 32, n: i / 4, gone: 0 }); }
  for (const p of CITY.props) { p.hp = p.max; if (p.o) { p.o.visible = true; } }
  PILLARS.length = 0; for (const p of CITY.props) if (p.solid) PILLARS.push(p.solid);
  cityViewReset(); CITY.dist = null;
}
const blockAt = (x, y, z) => { if (y < 0) return false; const ix = cIx(x), iz = cIx(z), lv = Math.floor(y / CB); return ix >= 0 && iz >= 0 && ix < CN && iz < CN && lv < 32 && (CITY.occ[ix * CN + iz] >> lv & 1) === 1; };
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
  for (const p of CITY.props) if (p.hp > 0 && Math.hypot(p.x - x, p.z - z) < r + p.rad && y < (p.top ?? 4) + r) { if ((p.hp -= dmg) <= 0) { p.hp = 0; if (p.solid) { const i = PILLARS.indexOf(p.solid); if (i >= 0) PILLARS.splice(i, 1); } ev({ k: 'prop', i: CITY.props.indexOf(p) }); } }
  if (!gone.length) return;
  const fall = citySettle(x, z, r + 5);
  ev({ k: 'blk', a: gone, f: fall, x: r2(x), y: r2(y), z: r2(z) });
  CITY.dist = null; // re-route the monsters
}
// blocks with nothing under them fall, unless a supported neighbour on the same level holds them (overhangs up to 3 blocks)
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
    for (let pass = 0; pass < 3; pass++) { // a neighbour on the same level can hold it, up to 3 blocks out
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
  const q = new Int32Array(N); let h = 0, t = 0;
  for (const p of players()) if (!p.down) { const c = cIx(p.x) * CN + cIx(p.z); if (c >= 0 && c < N) { dist[c] = 0; q[t++] = c; } }
  while (h < t) {
    const c = q[h++], ix = (c / CN) | 0, iz = c % CN, d = dist[c] + 1;
    for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const x = ix + dx, z = iz + dz; if (x < 0 || z < 0 || x >= CN || z >= CN) continue;
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
    const f = V(Math.sin(e.yaw), 0, Math.cos(e.yaw)), R = ET[e.type].r * e.sc;
    if (blockAt(e.x + f.x * (R + .9), .8, e.z + f.z * (R + .9)) || blockAt(e.x + f.x * (R + .9), 2.2, e.z + f.z * (R + .9))) cityHit(e.x + f.x * (R + .9), 1.4, e.z + f.z * (R + .9), 1.4 + R * .5, 70);
  }
}
// circle vs the blocks a body overlaps (from its feet to head height)
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

// ---------- view: the island, the blocks (instanced per district), props, debris ----------
const cityG = new THREE.Group(); cityG.visible = false; scene.add(cityG);
const cityLights = Array.from({ length: 8 }, () => { const l = new THREE.PointLight(0xff8a3a, 0, 20, 2); l.visible = false; scene.add(l); return l; });
const CHUNK = 36; // grid cells per district side
const arenaMat = name => { let m = null; arena.traverse(o => { if (!m && o.isMesh && o.material.name === name) m = o.material; }); return m; };
const arenaObj = re => arena.children.find(o => re.test(o.name));
function tileTexture(base, line, n = 8, px = 512) {
  const c = document.createElement('canvas'); c.width = c.height = px; const g = c.getContext('2d'), s = px / n;
  g.fillStyle = base; g.fillRect(0, 0, px, px);
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) { const k = Math.random() * 18 - 9; g.fillStyle = `rgba(${k > 0 ? 255 : 0},${k > 0 ? 255 : 0},${k > 0 ? 255 : 0},${Math.abs(k) / 120})`; g.fillRect(i * s, j * s, s, s); }
  g.strokeStyle = line; g.lineWidth = px / 170; for (let i = 0; i <= n; i++) { g.beginPath(); g.moveTo(i * s, 0); g.lineTo(i * s, px); g.stroke(); g.beginPath(); g.moveTo(0, i * s); g.lineTo(px, i * s); g.stroke(); }
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t;
}
function buildCityView() {
  const V3 = CITY.view = { chunks: new Map(), frags: null };
  // the island: a tiled stone disc on a jagged rock underside
  const floorT = tileTexture('#6e6878', '#3f3d4a'); floorT.repeat.set(2 * CW / 24, 2 * CW / 24);
  const floor = new THREE.Mesh(new THREE.CircleGeometry(CITY_R + 4, 160).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ map: floorT, roughness: .92 }));
  floor.receiveShadow = true; cityG.add(floor);
  const roadT = tileTexture('#8d8896', '#4a4756', 6); roadT.repeat.set(1, 1);
  const roadM = new THREE.MeshStandardMaterial({ map: roadT, roughness: .85, polygonOffset: true, polygonOffsetFactor: -1 });
  const strip = (w, l, x, z, ry) => { const g = new THREE.PlaneGeometry(w, l).rotateX(-Math.PI / 2).rotateY(ry); const u = g.attributes.uv; for (let i = 0; i < u.count; i++) u.setXY(i, u.getX(i) * w / 9, u.getY(i) * l / 9); const m = new THREE.Mesh(g, roadM); m.position.set(x, .012, z); m.receiveShadow = true; cityG.add(m); };
  strip(12, 2 * CITY_R, 0, 0, 0); strip(12, 2 * CITY_R, 0, 0, Math.PI / 2);
  for (const rr of [72, 142]) { const g = new THREE.RingGeometry(rr - 4.5, rr + 4.5, 160, 1).rotateX(-Math.PI / 2), u = g.attributes.uv, p = g.attributes.position; for (let i = 0; i < u.count; i++) u.setXY(i, p.getX(i) / 9, p.getZ(i) / 9); const m = new THREE.Mesh(g, roadM); m.position.y = .014; m.receiveShadow = true; cityG.add(m); }
  { const g = new THREE.CircleGeometry(27, 96).rotateX(-Math.PI / 2), u = g.attributes.uv, p = g.attributes.position; for (let i = 0; i < u.count; i++) u.setXY(i, p.getX(i) / 9, p.getZ(i) / 9); const m = new THREE.Mesh(g, roadM); m.position.y = .016; m.receiveShadow = true; cityG.add(m); }
  { // underside: an upside-down cone of rock with a jagged rim
    const g = new THREE.ConeGeometry(CITY_R + 5, 120, 96, 10, true).rotateX(Math.PI).translate(0, -60.05, 0), p = g.attributes.position;
    for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i), z = p.getZ(i), n = Math.sin(x * .07) * Math.cos(z * .06) + Math.sin(x * .19 + z * .13) * .5, k = y > -1 ? 0 : 1; p.setXYZ(i, x * (1 + n * .05 * k), y + n * 6 * k, z * (1 + n * .05 * k)); }
    g.computeVertexNormals(); const m = new THREE.Mesh(g, (arenaMat('rock') || new THREE.MeshStandardMaterial({ color: 0x796f79 })).clone()); m.material.side = THREE.DoubleSide; cityG.add(m);
  }
  // the gold plaza sigil, copied from the arena floor
  for (const s of amb.sig) { const o = s.clone(); o.position.set(0, .03, 0); o.scale.multiplyScalar(1.35); cityG.add(o); (V3.sig ??= []).push(o); }
  // blocks: one instanced mesh per district, instance colours for the stone tones
  const geo = new THREE.BoxGeometry(CB * .97, CB * .97, CB * .97), mat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: .82, metalness: 0, envMapIntensity: 1.4 });
  const B = CITY.lay.blocks, per = new Map(), m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), col = new THREE.Color(), rng = cityRng(99);
  for (let i = 0; i < B.length; i += 4) { const ck = Math.floor(B[i] / CHUNK) * 100 + Math.floor(B[i + 1] / CHUNK); (per.get(ck) ?? per.set(ck, []).get(ck)).push(i / 4); }
  V3.where = new Int32Array(B.length / 4 * 2); V3.base = []; // block n -> [chunk id, instance], and each chunk's resting matrices
  for (const [ck, ids] of per) {
    const im = new THREE.InstancedMesh(geo, mat, ids.length); im.castShadow = im.receiveShadow = true;
    ids.forEach((n, j) => {
      const ix = B[n * 4], iz = B[n * 4 + 1], lv = B[n * 4 + 2], c = B[n * 4 + 3];
      e.set((rng() - .5) * .012, (rng() - .5) * .03, (rng() - .5) * .012); q.setFromEuler(e); const s = .97 + rng() * .03;
      m4.compose(V(cX(ix), (lv + .5) * CB, cX(iz)), q, V(s, s, s)); im.setMatrixAt(j, m4);
      col.set(c).offsetHSL(0, 0, (rng() - .5) * .03); im.setColorAt(j, col);
      V3.where[n * 2] = ck; V3.where[n * 2 + 1] = j;
    });
    im.computeBoundingSphere(); cityG.add(im); V3.chunks.set(ck, { im, base: im.instanceMatrix.array.slice(), dirty: false });
  }
  // props: clones of the arena's pieces
  const tpl = { brazier: arenaObj(/^brazier_\d+$/), flame: arenaObj(/^brazier_flame_\d+$/), banner: arenaObj(/^banner_\d+$/), monolith: arenaObj(/^monolith_\d+$/), pillar: arenaObj(/^pillar_\d+$/), crystal: arenaObj(/^crystal_\d+$/), rock: arenaObj(/^float_rock_\d+$/) };
  for (const p of CITY.lay.props) {
    const P = { ...p, hp: 0, max: { brazier: 60, pillar: 140, monolith: 220, crystal: 90, banner: 30, garden: 1e9, rock: 1e9 }[p.k] ?? 80, rad: { brazier: .8, pillar: 1.15, monolith: 1.3, crystal: 1, banner: 1 }[p.k] ?? 1, top: p.k === 'crystal' ? p.y + 2 : p.k === 'monolith' ? 7 : 4 };
    const g = new THREE.Group(); g.position.set(p.x, p.y ?? 0, p.z);
    const add = (t, s = 1) => { if (!t) return null; const o = t.clone(); o.position.set(0, 0, 0); o.scale.multiplyScalar(s); g.add(o); return o; };
    if (p.k === 'brazier') { add(tpl.brazier); const f = add(tpl.flame); if (f) { f.position.y = tpl.flame.position.y - tpl.brazier.position.y; (V3.flames ??= []).push(f); } P.solid = { x: p.x, z: p.z, r: .7 }; P.light = V(p.x, 2, p.z); }
    else if (p.k === 'pillar') { add(tpl.pillar); P.solid = { x: p.x, z: p.z, r: 1.15 }; }
    else if (p.k === 'monolith') { const o = add(tpl.monolith); if (o) o.position.y = 0; g.rotation.y = p.yaw; P.solid = { x: p.x, z: p.z, r: 1.2 }; }
    else if (p.k === 'crystal') { add(tpl.crystal, p.s ?? 1.4); (V3.cry ??= []).push(g); }
    else if (p.k === 'banner') { add(tpl.banner, 1.2); g.rotation.y = p.yaw; }
    else if (p.k === 'rock') { add(tpl.rock, p.s); (V3.rocks ??= []).push({ o: g, y: g.position.y, ph: rng() * TAU }); P.hp = P.max = 1e9; }
    else if (p.k === 'garden') { const gr = arenaMat('grass'); const m = new THREE.Mesh(new THREE.PlaneGeometry(p.w - 1, p.d - 1).rotateX(-Math.PI / 2), gr || new THREE.MeshStandardMaterial({ color: 0x699559 })); m.position.y = .02; m.receiveShadow = true; g.add(m); P.hp = P.max = 1e9; }
    g.traverse(o => { if (o.isMesh) { o.castShadow = !o.material.emissive?.getHex(); o.receiveShadow = true; } });
    P.o = g; P.hp = P.max; cityG.add(g); CITY.props.push(P);
  }
  // debris: small tumbling stone fragments, and whole blocks falling from collapses
  const FN = 2400, frag = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: .9 }), FN);
  frag.castShadow = true; frag.frustumCulled = false; frag.count = 0; cityG.add(frag);
  for (let i = 0; i < FN; i++) frag.setColorAt(i, col.set(0xffffff));
  V3.frags = { im: frag, n: FN, p: new Float32Array(FN * 3), v: new Float32Array(FN * 3), r: new Float32Array(FN * 3), w: new Float32Array(FN * 3), s: new Float32Array(FN), life: new Float32Array(FN), big: new Uint8Array(FN), head: 0, live: 0 };
}
function cityViewReset() {
  const V3 = CITY.view; if (!V3) return;
  for (const c of V3.chunks.values()) { c.im.instanceMatrix.array.set(c.base); c.im.instanceMatrix.needsUpdate = true; }
  V3.frags.life.fill(0);
}
const _km4 = new THREE.Matrix4(), _kq = new THREE.Quaternion(), _ke = new THREE.Euler(), _ks = V(), _kp = V(), _kc = new THREE.Color();
function spawnFrag(x, y, z, vx, vy, vz, size, color, big = 0) {
  const F = CITY.view.frags, i = F.head = (F.head + 1) % F.n;
  F.p.set([x, y, z], i * 3); F.v.set([vx, vy, vz], i * 3); F.r.set([rand(0, 3), rand(0, 3), rand(0, 3)], i * 3); F.w.set([rand(-8, 8), rand(-8, 8), rand(-8, 8)].map(v => big ? v * .25 : v), i * 3);
  F.s[i] = size; F.life[i] = big ? 6 : rand(3.5, 6); F.big[i] = big; F.im.setColorAt(i, _kc.set(color).offsetHSL(0, 0, rand(-.05, .03))); F.im.instanceColor.needsUpdate = true;
}
// a block blasted out: fragments flung away from the hit, dust; collapsing blocks drop whole and burst when they land
function cityBreakFx(e) {
  const V3 = CITY.view; if (!V3) return;
  const B = CITY.lay.blocks, all = [...e.a.map(k => [k, 0]), ...e.f.map(k => [k, 1])], per = Math.max(1, Math.min(6, Math.floor(700 / Math.max(1, all.length))));
  let dust = 0;
  for (const [k, falling] of all) {
    const b = CITY.blk.get(k); if (!b || b.hidden) continue; b.hidden = 1;
    const n = b.n, ck = V3.where[n * 2], j = V3.where[n * 2 + 1], ch = V3.chunks.get(ck);
    if (ch) { ch.im.setMatrixAt(j, _km4.makeScale(0, 0, 0)); ch.dirty = true; }
    const ix = B[n * 4], iz = B[n * 4 + 1], lv = B[n * 4 + 2], c = B[n * 4 + 3], x = cX(ix), y = (lv + .5) * CB, z = cX(iz);
    if (falling) { spawnFrag(x, y, z, rand(-.6, .6), rand(-1, .5), rand(-.6, .6), CB * .9, c, 1); continue; }
    const dx = x - e.x, dy = y - e.y, dz = z - e.z, d = Math.hypot(dx, dy, dz) || 1, sp = 6 / Math.max(.6, d * .5);
    for (let f = 0; f < per; f++) spawnFrag(x + rand(-.5, .5), y + rand(-.5, .5), z + rand(-.5, .5), dx / d * sp + rand(-3, 3), dy / d * sp + rand(1, 5), dz / d * sp + rand(-3, 3), rand(.2, .55), c);
    if (dust++ < 10) dustFx(x, z, 1.2, 0x8a8290);
  }
  if (all.length) { const big = all.length > 12; shake(Math.min(.5, .04 + all.length * .006) * (distTo(e.x, e.z) < 40 ? 1 : .3)); sfx(big ? 'smash' : 'earth'); if (e.f.length > 6) setTimeout(() => sfx('earth_big'), 350); }
}
function cityPropFx(e) {
  const p = CITY.props[e.i]; if (!p?.o?.visible) return;
  p.hp = 0; p.o.visible = false; if (p.solid) { const i = PILLARS.indexOf(p.solid); if (i >= 0) PILLARS.splice(i, 1); }
  const y = p.k === 'crystal' ? p.y : 1.5, col = p.k === 'crystal' ? 0xdaa0ff : p.k === 'banner' ? 0x733895 : p.k === 'brazier' ? 0xc4a06c : STONE.a;
  for (let f = 0; f < (p.k === 'monolith' ? 40 : 18); f++) spawnFrag(p.x + rand(-.6, .6), rand(.3, p.k === 'monolith' ? 6 : 2.5) + (p.k === 'crystal' ? p.y - 1 : 0), p.z + rand(-.6, .6), rand(-5, 5), rand(2, 8), rand(-5, 5), rand(.2, .6), col);
  if (p.k === 'crystal') { burst(p.x, y, p.z, 60, 0xdaa0ff, 9, .3, .6); flash(p.x, y, p.z, 0xdaa0ff, 40, .3); sfx('tink'); }
  else if (p.k === 'brazier') { burst(p.x, 1.5, p.z, 40, 0xff8a3a, 7, .3, .6, -2); sfx('fire'); }
  dustFx(p.x, p.z, 2, 0x8a8290); sfx('smash');
}
// every frame while the city is shown: debris physics, flickering flames, bobbing rocks, nearest braziers lit, shadows following you
function cityFrame(dt, t) {
  const V3 = CITY.view; if (!V3 || !cityG.visible) return;
  for (const c of V3.chunks.values()) if (c.dirty) { c.dirty = false; c.im.instanceMatrix.needsUpdate = true; }
  const F = V3.frags; let n = 0;
  for (let i = 0; i < F.n; i++) {
    if (F.life[i] <= 0) continue;
    const o = i * 3; F.life[i] -= dt;
    F.v[o + 1] -= 24 * dt; F.p[o] += F.v[o] * dt; F.p[o + 1] += F.v[o + 1] * dt; F.p[o + 2] += F.v[o + 2] * dt;
    const s = F.s[i] * Math.min(1, F.life[i] / .8), floorY = s * .5;
    if (F.p[o + 1] < floorY) {
      if (F.big[i] && F.v[o + 1] < -4) { // a collapsing block hits the ground and shatters
        F.life[i] = 0; const x = F.p[o], z = F.p[o + 2], c = '#' + F.im.instanceColor.array.slice(i * 3, i * 3 + 3).reduce((a, v) => a + Math.round(Math.min(1, v) * 255).toString(16).padStart(2, '0'), '');
        for (let f = 0; f < 4; f++) spawnFrag(x, .4, z, rand(-4, 4), rand(2, 5), rand(-4, 4), rand(.25, .55), c);
        if (Math.random() < .3) dustFx(x, z, 1.4, 0x8a8290); continue;
      }
      F.p[o + 1] = floorY; F.v[o + 1] *= -.3; F.v[o] *= .6; F.v[o + 2] *= .6; F.w[o] *= .6; F.w[o + 1] *= .6; F.w[o + 2] *= .6;
    }
    for (let k = 0; k < 3; k++) F.r[o + k] += F.w[o + k] * dt;
    _ke.set(F.r[o], F.r[o + 1], F.r[o + 2]); _kq.setFromEuler(_ke); _ks.setScalar(s); _kp.set(F.p[o], F.p[o + 1], F.p[o + 2]);
    F.im.setMatrixAt(n, _km4.compose(_kp, _kq, _ks)); if (n !== i) { F.im.instanceColor.array.copyWithin(n * 3, i * 3, i * 3 + 3); } n++;
  }
  // compacting moved colours down, so rebuild the slots we read from next frame: simplest is to keep slot = index when nothing moved
  F.im.count = n; F.im.instanceMatrix.needsUpdate = true; F.im.instanceColor.needsUpdate = true;
  if (n) for (let i = 0, j = 0; i < F.n && j < n; i++) if (F.life[i] > 0) { if (i !== j) { for (const A of [F.p, F.v, F.r, F.w]) A.copyWithin(j * 3, i * 3, i * 3 + 3); F.s[j] = F.s[i]; F.life[j] = F.life[i]; F.big[j] = F.big[i]; F.life[i] = 0; } j++; }
  F.head = n - 1;
  for (const f of V3.flames || []) f.scale.y = 1 + .12 * Math.sin(t * 9 + f.id);
  for (const r of V3.rocks || []) { r.o.position.y = r.y + Math.sin(t * .4 + r.ph) * 1.2; r.o.rotation.y += dt * .05; }
  for (const c of V3.cry || []) c.rotation.y += dt * .4;
  if ((V3.lt = (V3.lt || 0) - dt) <= 0) { // light the braziers nearest the camera
    V3.lt = .5; const cp = camera.position, lit = CITY.props.filter(p => p.light && p.o.visible).sort((a, b) => a.light.distanceToSquared(cp) - b.light.distanceToSquared(cp));
    cityLights.forEach((l, i) => { const p = lit[i]; l.visible = !!p; if (p) { l.position.copy(p.light); l.intensity = 26; } });
  }
  cityLights.forEach((l, i) => { if (l.visible) l.intensity = 24 + Math.sin(t * 11 + i * 3) * 4; });
  const cp = camera.position; moon.target.position.set(cp.x, 0, cp.z); moon.position.set(cp.x, 0, cp.z).addScaledVector(BH, 70); moon.target.updateMatrixWorld();
}
