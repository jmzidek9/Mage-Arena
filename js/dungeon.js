// Mage Arena dungeon: endless, procedurally generated floors of themed chambers, with real stairs between floors.
// Loaded after modes.js. Host-side rules plus the scenery both machines build from the same seed.
'use strict';

// A floor is a grid of chambers (one per cell) joined by corridors, plus a few extra links so there are loops to run around.
// Nothing ever locks: walking into a chamber wakes its monsters and they chase you through the halls (navTo).
// The deepest chamber has a stairwell (a switchback flight going down) behind a portcullis that lifts once that chamber is cleared.
// Going down is seamless: when everyone is on the lower flight, the next floor is built so that ITS arrival stairwell sits exactly
// where this floor's departure stairwell is, STAIR_D higher. The stairwell looks the same in both, the ground under you rises
// by STAIR_D with everything around you, and nobody is moved.
const CELL = 50, HALL_W = 5, HALL_H = 4.8, STAIR_D = 6, ROOM_ACTIVE = 1, ROOM_CLEAR = 2;
Object.assign(ET, { // medieval foes (zone: dungeon keeps them out of the Arena's spawn pool)
  skeleton: { hp: 46,   spd: 3.7, r: .45, h: 1.85, dmg: 11, reach: 2.0, cost: 1, from: 1, kb: 1,   poise: 30,  atk: 'swipe',  wind: .5,  cd: 1.3, zone: 'dungeon' },
  rat:      { hp: 18,   spd: 7.4, r: .42, h: .7,  dmg: 7,  reach: 3.0, cost: 1, from: 1, kb: 1.5, poise: 10,  atk: 'lunge',  wind: .35, cd: 1.4, zone: 'dungeon' },
  archer:   { hp: 32,   spd: 3,   r: .45, h: 1.85, dmg: 9,  reach: 26,  cost: 2, from: 2, kb: 1,   poise: 22,  atk: 'orb',    wind: .7,  cd: 2.1, ranged: 1, keep: [7, 13], zone: 'dungeon' },
  ghoul:    { hp: 75,   spd: 4.4, r: .6,  h: 1.7, dmg: 14, reach: 2.2, cost: 2, from: 3, kb: .8,  poise: 45,  atk: 'slam',   wind: .55, cd: 1.5, zone: 'dungeon' },
  dknight:  { hp: 150,  spd: 3.1, r: .65, h: 2.2, dmg: 18, reach: 3.6, cost: 4, from: 4, kb: .35, poise: 90,  atk: 'thrust', wind: .6,  cd: 1.8, shield: 1, zone: 'dungeon' },
  warden:   { hp: 1700, spd: 2.2, r: 1.8, h: 4.6, dmg: 30, reach: 4.6, cost: 0, from: 99, kb: .04, poise: 650, atk: 'smash', wind: 1.05, cd: 2.2, boss: 1, minions: ['skeleton', 'rat'], zone: 'dungeon' },
});
let DUN = null; // the current floor: rooms, halls, pillars, stair pieces, nav table (all in world coordinates)
const rngOf = seed => { let s = (seed >>> 0) || 1; return () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296; };

// ---------- poses: a position plus a quarter-turn count, mapping a local (u, v) frame onto world (x, z) ----------
const rot4 = (r, u, v) => [[u, v], [-v, u], [-u, -v], [v, -u]][((r % 4) + 4) % 4];
const poseAt = (P, u, v) => { const [a, b] = rot4(P.r, u, v); return { x: P.x + a, z: P.z + b }; };
const poseMul = (A, B) => ({ ...poseAt(A, B.x, B.z), r: (A.r + B.r) % 4 });
const poseInv = P => { const [a, b] = rot4(-P.r, -P.x, -P.z); return { x: a, z: b, r: (4 - P.r) % 4 }; };
const ARRIVE = { x: -30, z: -10, r: 0 }; // the arrival stairwell's pose in a floor's own grid frame (its exit runs into room 0's west door)

// The stairwell in its own frame: u runs out from the chamber wall, v across. y is relative to the top landing.
// A goes down to a landing L, which turns back into B; B ends at a bottom landing that opens sideways into E1, then E2 runs out
// to the next floor's first chamber. From flight B you can't see the top of A or far down E2, so those can differ between floors.
const SD2 = STAIR_D / 2;
const STAIR = {
  A: { u0: -1, u1: 14, v0: -2, v1: 2, ramp: [3, 0, 11, -SD2] }, // ramp: [u, y, u, y] ends of the slope
  L: { u0: 11, u1: 16, v0: -2, v1: 7, y: -SD2 },
  B: { u0: 1, u1: 14, v0: 3, v1: 7, ramp: [11, -SD2, 4, -STAIR_D] },
  E1: { u0: 1, u1: 4, v0: 6, v1: 12, y: -STAIR_D },
  E2: { u0: 3, u1: 23, v0: 8, v1: 12, y: -STAIR_D },
};
function stairRect(P, base, s, u0 = s.u0, u1 = s.u1) {
  const a = poseAt(P, u0, s.v0), b = poseAt(P, u1, s.v1);
  const q = { x0: Math.min(a.x, b.x), x1: Math.max(a.x, b.x), z0: Math.min(a.z, b.z), z1: Math.max(a.z, b.z), st: 1 };
  if (s.ramp) { const [ua, ya, ub, yb] = s.ramp, p = poseAt(P, ua, 0), [dx, dz] = rot4(P.r, 1, 0); q.ramp = { ax: p.x, az: p.z, dx, dz, L: ub - ua, y0: base + ya, y1: base + yb }; }
  else q.y = base + s.y;
  return q;
}

// ---------- chamber themes: what a room is called, what it's built from and what fills it ----------
// sz: which room sizes suit it (s small, m medium, l large). lay(P) places its furniture through the helpers in layRoom.
const THEMES = {
  crypt: { names: ['The Silent Crypt', 'Tomb of the Forgotten Kings', 'The Hollow Vault', 'Crypt of Ash'], sz: 'ml', wall: 'ashlar', floor: 'flag', tint: [215, 18, 78], torch: 0x9ab8ff, ch: [5.5, 7], pil: 1, beams: 'rib',
    lay(P) { if (P.A >= 20) P.pillars('colonnade', 'round'); for (let a = -P.L / 2 + 4; a <= P.L / 2 - 4; a += 3.4) for (const c of P.A >= 20 ? [-P.A / 4 + 1, P.A / 4 - 1] : [0]) { const p = P.at(a, c); P.put('sarc', p.x, p.z, P.ryL, {}, [.6, 2, 'z']); } P.along('candles', 4, .4, {}, 0, { skip: .4 }); P.scatter('bones', 6); } },
  armory: { names: ['The Old Armory', 'Arsenal of the Fallen', 'The Iron Store'], sz: 'sm', wall: 'brick', floor: 'flag', tint: [25, 20, 80], torch: 0xffa050, ch: [5, 6], wallProps: 1, beams: 'wood',
    lay(P) { P.along('rack', 3.2, .35, {}, 0, { long: 1 }); P.along('armor', 2.6, .5, {}, .45, { short: 1 }); P.put('table', P.r.cx, P.r.cz, P.ryL, { l: 3, top: 'weapons' }, [.6, 3, 'x']); P.scatter('crate', 3, .6); P.scatter('barrel', 3, .5); } },
  library: { names: ['The Forbidden Library', 'Archive of Whispers', 'The Ink-Black Stacks'], sz: 'sm', wall: 'plaster', floor: 'planks', tint: [35, 25, 82], torch: 0xffc070, ch: [6, 7.5], wallProps: 1, beams: 'wood',
    lay(P) { P.along('shelf', 2.1, .3); P.put('carpet', P.r.cx, P.r.cz, P.ryL, { l: P.L - 6, w: 3 }); for (const a of P.L > 22 ? [-P.L / 4, P.L / 4] : [0]) for (const c of [-3.2, 3.2]) { const p = P.at(a, c); P.put('table', p.x, p.z, P.ryL, { l: 2.6, top: 'books' }, [.6, 2.6, 'x']); } P.put('chandelier', P.r.cx, P.r.cz, 0); } },
  chapel: { names: ['The Desecrated Chapel', 'Shrine of the Pale Saint', 'The Black Sanctum'], sz: 'ml', wall: 'ashlar', floor: 'checker', tint: [270, 15, 80], torch: 0xc080ff, ch: [7, 9], pil: 1, beams: 'rib',
    lay(P) { const end = P.at(P.L / 2 - 2.6, 0); P.put('altar', end.x, end.z, P.ryL - Math.PI / 2, {}, [.8, 2.2, 'x']); P.put('carpet', P.r.cx, P.r.cz, P.ryL, { l: P.L - 4, w: 2 });
      const bank = Math.min(4, P.A / 2 - 3); for (let a = -P.L / 2 + 4; a < P.L / 2 - 6.5; a += 1.7) for (const sgn of [-1, 1]) { const p = P.at(a, sgn * (1.4 + bank / 2)); P.put('pew', p.x, p.z, P.ryL + Math.PI / 2, { l: bank }, [.4, bank, 'x']); }
      P.along('window', 4.5, .05, {}, 0, { long: 1 }); for (const c of [-1.8, 1.8]) { const p = P.at(P.L / 2 - 2.2, c); P.put('candles', p.x, p.z, 0); } } },
  throne: { names: ['The Throne of Dust', 'Hall of the Usurper', 'The Hollow Court'], sz: 'l', wall: 'ashlar', floor: 'checker', tint: [40, 30, 82], torch: 0xffb060, ch: [8, 10], pil: 1, beams: 'rib',
    lay(P) { P.pillars('colonnade', 'round'); const t = P.at(P.L / 2 - 2.2, 0); P.put('throne', t.x, t.z, P.ryL - Math.PI / 2, {}, 1.4); for (const c of [-3, 3]) { const p = P.at(P.L / 2 - 3, c); P.put('brazier', p.x, p.z, 0, {}, .5); }
      P.put('carpet', P.r.cx, P.r.cz, P.ryL, { l: P.L - 5, w: 3 }); P.along('banner', 5, .05, {}, 0, { long: 1 }); for (const a of [-P.L / 4, P.L / 4]) { const p = P.at(a, 0); P.put('chandelier', p.x, p.z, 0); } } },
  torture: { names: ['The Torture Chamber', 'The Weeping Cells', 'Chamber of Screams'], sz: 'sm', wall: 'rubble', floor: 'flag', tint: [5, 25, 72], torch: 0xff5a3a, ch: [4.8, 6],
    lay(P) { P.put('rackt', P.r.cx, P.r.cz, P.ryL, {}, [.7, 2.4, 'x']); P.scatter('cage', 3, .9); P.scatter('chains', 5); P.along('maiden', 7, .45, {}, .5, { skip: .3 }); P.scatter('brazier', 1, .5); P.scatter('blood', 9); P.scatter('straw', 3); } },
  ossuary: { names: ['The Ossuary', 'Hall of Ten Thousand Skulls', 'The Bone Gallery'], sz: 'sm', wall: 'ashlar', floor: 'flag', tint: [45, 22, 88], torch: 0xdde8b0, ch: [5, 6.5], wallProps: 1,
    lay(P) { if (Math.min(P.L, P.A) >= 18) P.pillars('four', 'bone'); P.along('skulls', 2.4, .5); P.put('altar', P.r.cx, P.r.cz, P.ryL, { bones: 1 }, [.8, 2.2, 'x']); P.scatter('bones', 12); } },
  cistern: { names: ['The Drowned Cistern', 'The Sunken Reservoir', 'The Flooded Undercroft'], sz: 'ml', wall: 'mossy', floor: 'cobble', tint: [180, 20, 72], torch: 0x70d0ff, ch: [6, 8], pil: 1, beams: 'rib',
    lay(P) { P.put('pool', P.r.cx, P.r.cz, 0, { w: P.r.w - 7, d: P.r.d - 7 }); P.pillars('grid', 'round'); P.scatter('rubble', 2, .9); } },
  alchemy: { names: ['The Alchemist\'s Den', 'The Poisoner\'s Laboratory', 'The Bubbling Sanctum'], sz: 'sm', wall: 'brick', floor: 'planks', tint: [100, 20, 78], torch: 0x9aff70, ch: [5, 6.5], wallProps: 1, beams: 'wood',
    lay(P) { P.put('cauldron', P.r.cx, P.r.cz, 0, {}, 1); P.along('shelf', 2.1, .3, { jars: 1 }, 0, { long: 1, skip: .3 }); for (const s of [-1, 1]) { const p = P.at(s * Math.min(5, P.L / 2 - 4), P.A / 2 - 3.2); P.put('table', p.x, p.z, P.ryL, { l: 2.4, top: 'flasks' }, [.6, 2.4, 'x']); } P.scatter('barrel', 2, .5); } },
  forge: { names: ['The Dwarven Forge', 'The Smithy of Cinders', 'The Ember Works'], sz: 'sm', wall: 'brick', floor: 'dirt', tint: [20, 30, 75], torch: 0xff8030, ch: [6, 7.5], beams: 'wood',
    lay(P) { P.along('forge', 99, .8, {}, [1, 3, 'x'], { first: 1 }); P.scatter('anvil', 2, .6); P.scatter('coal', 3); P.along('rack', 3.5, .35, {}, 0, { skip: .5 }); P.scatter('barrel', 3, .5); } },
  banquet: { names: ['The Banquet Hall', 'The Feast of Rot', 'The Long Table'], sz: 'l', wall: 'plaster', floor: 'weave', tint: [30, 30, 80], torch: 0xffb070, ch: [6.5, 8], beams: 'wood',
    lay(P) { const rows = P.A >= 22 ? [-P.A / 5, P.A / 5] : [0], len = P.L - 9; for (const c of rows) { const p = P.at(0, c); P.put('table', p.x, p.z, P.ryL, { l: len, top: 'feast' }, [.6, len, 'x']); for (const s of [-1, 1]) { const b = P.at(0, c + s * 1.1); P.put('bench', b.x, b.z, P.ryL, { l: len }); } P.put('chandelier', p.x, p.z, 0); }
      P.along('hearth', 99, .6, {}, [.9, 3, 'x'], { first: 1, short: 1 }); P.along('banner', 5, .05, {}, 0, { long: 1 }); } },
  barracks: { names: ['The Barracks', 'The Guards\' Quarters', 'The Deserted Garrison'], sz: 'sm', wall: 'brick', floor: 'planks', tint: [30, 15, 78], torch: 0xffa860, ch: [4.8, 5.8], wallProps: 1, beams: 'wood',
    lay(P) { P.along('bed', 2.3, 1.05, {}, [.5, 1.8, 'z'], { long: 1 }); P.along('rack', 3.2, .35, {}, 0, { short: 1 }); P.put('table', P.r.cx, P.r.cz, P.ryL, { l: 2.4, top: 'mugs' }, [.6, 2.4, 'x']); P.scatter('chest', 2, .5); } },
  treasury: { names: ['The Treasury', 'The Hoard of the Lost King', 'The Gilded Vault'], sz: 'sm', wall: 'ashlar', floor: 'checker', tint: [45, 35, 82], torch: 0xffd070, ch: [5.5, 7], wallProps: 1,
    lay(P) { P.put('pedestal', P.r.cx, P.r.cz, 0, {}, .7); P.along('chest', 2.6, .35, { gold: 1 }, 0, { skip: .25 }); for (const [a, c] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) { const p = P.at(a * (P.L / 2 - 3.5), c * (P.A / 2 - 3.5)); P.put('statue', p.x, p.z, Math.atan2(P.r.cx - p.x, P.r.cz - p.z), {}, .7); } P.scatter('gold', 5, .7); } },
  cavern: { names: ['The Glowing Grotto', 'The Fungal Cavern', 'The Deep Hollow'], sz: 'ml', wall: 'cave', floor: 'dirt', tint: [170, 15, 70], torch: 0x60ffd8, ch: [7, 9],
    lay(P) { for (let k = 0; k < 4 + Math.floor(P.rnd() * 4); k++) P.scatter('stalag', 1, 1.1); P.scatter('rubble', 4, .9); P.scatter('mushrooms', 7); P.scatter('roots', 4); } },
  ritual: { names: ['The Summoning Circle', 'The Ritual Chamber', 'The Crimson Pentacle'], sz: 'sm', wall: 'rubble', floor: 'weave', tint: [350, 25, 70], torch: 0xff4040, ch: [6, 8], beams: 'rib',
    lay(P) { P.put('sigil', P.r.cx, P.r.cz, 0); const n = 5 + Math.floor(P.rnd() * 2), rad = Math.min(P.L, P.A) / 2 - 3.5; for (let k = 0; k < n; k++) { const a = TAU * k / n; P.put('obelisk', P.r.cx + Math.sin(a) * rad, P.r.cz + Math.cos(a) * rad, a, {}, .6); } P.put('candles', P.r.cx + 1.5, P.r.cz, 0); P.put('candles', P.r.cx - 1.5, P.r.cz, 0); P.scatter('blood', 7); } },
  garden: { names: ['The Withered Garden', 'The Petrified Grove', 'The Overgrown Cloister'], sz: 'ml', wall: 'mossy', floor: 'dirt', tint: [90, 20, 72], torch: 0xc0ff90, ch: [7, 9],
    lay(P) { P.put('tree', P.r.cx, P.r.cz, P.rnd() * TAU, {}, 1.2); P.pillars('ring', 'broken'); P.scatter('mushrooms', 5); P.scatter('rubble', 3, .9); P.scatter('roots', 5); P.scatter('bones', 4); } },
  antechamber: { names: ['The Antechamber'], sz: '', wall: 'ashlar', floor: 'flag', tint: [30, 15, 82], torch: 0xffa050, ch: [5.5, 5.5], pil: 1, beams: 'rib',
    lay(P) { P.along('banner', 5, .05, {}, 0, { skip: .3 }); for (const [x, z] of [[-5, -5], [5, -5], [5, 5]]) P.put(P.rnd() < .5 ? 'barrel' : 'crate', P.r.cx + x, P.r.cz + z, P.rnd() * 3, {}, .55); P.put('brazier', P.r.cx + 2.5, P.r.cz - 3, 0, {}, .5); P.put('brazier', P.r.cx + 2.5, P.r.cz + 3, 0, {}, .5); } },
  warden: { names: ['The Warden\'s Ossuary'], sz: '', wall: 'ashlar', floor: 'flag', tint: [40, 25, 80], torch: 0xff7a40, ch: [9, 10], pil: 1, beams: 'rib',
    lay(P) { P.pillars('ring', 'bone'); P.along('skulls', 3, .5, {}, 0, { skip: .3 }); for (const [a, c] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) P.put('brazier', P.r.cx + a * 9, P.r.cz + c * 9, 0, {}, .5); P.put('sigil', P.r.cx, P.r.cz, 0, { c: 0xff7a30 }); P.scatter('bones', 14); } },
};

// ---------- layout (deterministic from the seed, so the guest builds the same floor) ----------
function buildFloor(seed, floor, O = { x: 0, z: 0, r: 0 }) {
  const rnd = rngOf(seed), ri = n => Math.floor(rnd() * n), boss = floor % 5 === 0;
  const n = Math.min(7 + floor, 13), key = (x, z) => x + ',' + z, D4 = [[1, 0], [-1, 0], [0, 1], [0, -1]];
  const cells = [[0, 0]], links = [], taken = new Set(['0,0', '-1,0']); // -1,0 holds the arrival stairwell
  for (let t = 0; cells.length < n && t < 600; t++) { // random walk on the grid: every new room hangs off an existing one
    const fi = ri(cells.length), d = D4[ri(4)], c = [cells[fi][0] + d[0], cells[fi][1] + d[1]];
    if (taken.has(key(...c))) continue;
    taken.add(key(...c)); links.push([fi, cells.length]); cells.push(c);
  }
  const at = new Map(cells.map((c, i) => [key(...c), i])); // extra links between neighbours make loops to kite monsters around
  for (let i = 0; i < cells.length; i++) for (const d of [[1, 0], [0, 1]]) {
    const j = at.get(key(cells[i][0] + d[0], cells[i][1] + d[1]));
    if (j != null && !links.some(([a, b]) => (a === i && b === j) || (a === j && b === i)) && rnd() < .3) links.push([i, j]);
  }
  const depth = cells.map(() => -1); depth[0] = 0; // the stairs go in the deepest room with an empty side to put the stairwell
  for (const q = [0]; q.length;) { const a = q.shift(); for (const [x, y] of links) { const b = x === a ? y : y === a ? x : -1; if (b >= 0 && depth[b] < 0) { depth[b] = depth[a] + 1; q.push(b); } } }
  let far = -1, side = null;
  cells.forEach(([gx, gz], i) => { if (!i || (far >= 0 && depth[i] <= depth[far])) return; const s = D4.find(d => !taken.has(key(gx + d[0], gz + d[1]))); if (s) { far = i; side = s; } });
  const rooms = cells.map(([gx, gz], i) => {
    let w, d;
    if (!i) w = d = 16;
    else if (boss && i === far) w = d = 34;
    else { const k = rnd(); if (k < .3) { w = 16 + ri(4) * 2; d = 16 + ri(4) * 2; } else if (k < .65) { w = 22 + ri(4) * 2; d = 20 + ri(4) * 2; } else if (k < .85) { w = 28 + ri(5) * 2; d = 26 + ri(5) * 2; } else { w = 14 + ri(2) * 2; d = 30 + ri(4) * 2; if (rnd() < .5) [w, d] = [d, w]; } }
    if (i === far) { w = Math.max(w, 22); d = Math.max(d, 22); }
    const cx = gx * CELL + (i ? ri(7) - 3 : 0), cz = gz * CELL + (i ? ri(7) - 3 : 0);
    return { i, cx, cz, w, d, x0: cx - w / 2, x1: cx + w / 2, z0: cz - d / 2, z1: cz + d / 2, boss: boss && i === far, stairs: i === far, doors: [], quiet: i > 0 && i !== far && rnd() < .15 };
  });
  const halls = links.map(([a, b]) => { // each overlaps both rooms by 1 m so the walkable area stays connected
    const A = rooms[a], B = rooms[b], alongX = cells[a][1] === cells[b][1];
    const [L, Q] = alongX ? (A.cx < B.cx ? [A, B] : [B, A]) : (A.cz < B.cz ? [A, B] : [B, A]);
    const lo = Math.max(alongX ? L.z0 : L.x0, alongX ? Q.z0 : Q.x0) + HALL_W / 2 + 1.5, hi = Math.min(alongX ? L.z1 : L.x1, alongX ? Q.z1 : Q.x1) - HALL_W / 2 - 1.5;
    const c = Math.round(lo < hi ? lo + rnd() * (hi - lo) : (lo + hi) / 2);
    if (alongX) return { a: L.i, b: Q.i, x0: L.x1 - 1, x1: Q.x0 + 1, z0: c - HALL_W / 2, z1: c + HALL_W / 2, da: { x: L.x1, z: c }, db: { x: Q.x0, z: c } };
    return { a: L.i, b: Q.i, x0: c - HALL_W / 2, x1: c + HALL_W / 2, z0: L.z1 - 1, z1: Q.z0 + 1, da: { x: c, z: L.z1 }, db: { x: c, z: Q.z0 } };
  });
  for (const h of halls) { rooms[h.a].doors.push({ ...h.da, hw: HALL_W / 2 }); rooms[h.b].doors.push({ ...h.db, hw: HALL_W / 2 }); }
  const fr = rooms[far], dep = side[0] === 1 ? { x: fr.x1, z: fr.cz, r: 0 } : side[0] === -1 ? { x: fr.x0, z: fr.cz, r: 2 } : side[1] === 1 ? { x: fr.cx, z: fr.z1, r: 1 } : { x: fr.cx, z: fr.z0, r: 3 };
  fr.doors.push({ x: dep.x, z: dep.z, hw: 2, stair: 1 });
  rooms[0].doors.push({ x: rooms[0].x0, z: 0, hw: 2 }); // where the arrival stairwell's exit comes in
  // themes: no two rooms on a floor share one, and each picks a size it suits
  const used = new Set();
  for (const r of rooms) {
    const a = r.w * r.d, cat = a >= 650 ? 'l' : a <= 420 ? 's' : 'm';
    let th = !r.i ? 'antechamber' : r.boss ? 'warden' : null;
    if (!th) { const all = Object.keys(THEMES).filter(k => THEMES[k].sz && !used.has(k)), fit = all.filter(k => THEMES[k].sz.includes(cat)); th = (fit.length ? fit : all.length ? all : ['crypt'])[ri((fit.length ? fit : all.length ? all : ['crypt']).length)]; }
    used.add(th); const T = THEMES[th];
    Object.assign(r, { theme: th, name: T.names[ri(T.names.length)], ch: T.ch[0] + rnd() * (T.ch[1] - T.ch[0]) });
  }
  const pillars = [];
  for (const r of rooms) layRoom(r, rngOf(seed * 7 + r.i * 977 + 5), pillars);
  // everything was laid out in the floor's grid frame; place it in the world through the floor's pose O
  const xr = q => { const a = poseAt(O, q.x0, q.z0), b = poseAt(O, q.x1, q.z1); return { ...q, x0: Math.min(a.x, b.x), x1: Math.max(a.x, b.x), z0: Math.min(a.z, b.z), z1: Math.max(a.z, b.z) }; };
  const xp = q => ({ ...q, ...poseAt(O, q.x, q.z), ...(q.ry != null ? { ry: q.ry - O.r * Math.PI / 2 } : {}) });
  for (const r of rooms) {
    Object.assign(r, xr(r)); const c = poseAt(O, r.cx, r.cz); r.cx = c.x; r.cz = c.z; r.w = r.x1 - r.x0; r.d = r.z1 - r.z0;
    r.doors = r.doors.map(xp); r.props = r.props.map(xp);
  }
  for (let k = 0; k < halls.length; k++) { const h = halls[k] = xr(halls[k]); h.da = poseAt(O, h.da.x, h.da.z); h.db = poseAt(O, h.db.x, h.db.z); }
  const pil = pillars.map(xp);
  const arr = poseMul(O, ARRIVE), dw = poseMul(O, dep);
  const arrive = ['A', 'L', 'B', 'E1', 'E2'].map(k => stairRect(arr, STAIR_D, STAIR[k], k === 'A' ? .5 : undefined));
  const depart = ['A', 'L', 'B'].map(k => stairRect(dw, 0, STAIR[k]));
  // nav graph: rooms then halls; next[s][t] is the node to step into from s on the way to t
  const R0 = rooms.length, N = R0 + halls.length, adj = Array.from({ length: N }, () => []);
  halls.forEach((h, k) => { adj[R0 + k].push(h.a, h.b); adj[h.a].push(R0 + k); adj[h.b].push(R0 + k); });
  const next = Array.from({ length: N }, () => new Array(N).fill(null));
  for (let t = 0; t < N; t++) { const seen = new Set([t]); for (const q = [t]; q.length;) { const a = q.shift(); for (const b of adj[a]) if (!seen.has(b)) { seen.add(b); next[b][t] = a; q.push(b); } } }
  for (const h of halls) { // portal points: 2.5 m past each doorway, into the hall (pout) and into the room (pin)
    h.pin = {}; h.pout = {};
    for (const [j, d] of [[h.a, h.da], [h.b, h.db]]) { const r = rooms[j], nx = Math.sign(r.cx - d.x) * (Math.abs(d.x - r.x0) < .01 || Math.abs(d.x - r.x1) < .01 ? 1 : 0), nz = nx ? 0 : Math.sign(r.cz - d.z); h.pin[j] = { x: d.x + nx * 2.5, z: d.z + nz * 2.5 }; h.pout[j] = { x: d.x - nx * 2.5, z: d.z - nz * 2.5 }; }
  }
  const erects = [...rooms, ...halls], walk = [...erects, ...arrive];
  DUN = { seed, floor, O, rooms, halls, pillars: pil, far, dep, arr, depW: dw, stairs: [...arrive, ...depart], erects, walk, walkOpen: [...walk, ...depart],
    trig: stairRect(dw, 0, STAIR.B, 1, 9), next };
}

// furniture and pillars for one room, in the grid frame. Solid things also get round colliders (pillars) the sim walks around.
function layRoom(r, rnd, pillars) {
  const T = THEMES[r.theme], ax = r.w >= r.d ? 'x' : 'z', props = r.props = [], solid = [];
  const P = {
    r, rnd, L: ax === 'x' ? r.w : r.d, A: ax === 'x' ? r.d : r.w, ryL: ax === 'x' ? 0 : Math.PI / 2,
    at: (a, c) => ax === 'x' ? { x: r.cx + a, z: r.cz + c } : { x: r.cx + c, z: r.cz - a },
    near: (x, z, d) => r.doors.some(q => Math.hypot(q.x - x, q.z - z) < d),
    free(x, z, rad) { return x > r.x0 + 2 + rad && x < r.x1 - 2 - rad && z > r.z0 + 2 + rad && z < r.z1 - 2 - rad && !P.near(x, z, 4.5) && solid.every(s => Math.hypot(s.x - x, s.z - z) > s.r + rad + 1); },
    put(k, x, z, ry, o = {}, sol = 0) {
      props.push({ k, x, z, ry, ...o });
      if (!sol) return;
      const [rad, len = 0, axis = 'x'] = Array.isArray(sol) ? sol : [sol], dx = axis === 'x' ? Math.cos(ry) : Math.sin(ry), dz = axis === 'x' ? -Math.sin(ry) : Math.cos(ry);
      const n = Math.max(1, Math.ceil((len - 2 * rad) / (rad * 1.3)) + 1);
      for (let k = 0; k < n; k++) { const t = n === 1 ? 0 : -len / 2 + rad + k * (len - 2 * rad) / (n - 1), c = { x: x + dx * t, z: z + dz * t, r: rad, room: r.i }; solid.push(c); pillars.push(c); }
    },
    along(k, sp, off, o = {}, sol = 0, opt = {}) { // along the walls, facing in, skipping doorways
      const sides = [['n', r.x0, r.x1], ['s', r.x0, r.x1], ['w', r.z0, r.z1], ['e', r.z0, r.z1]].filter(([s]) => { const lng = (s === 'n' || s === 's') === (ax === 'x'); return opt.long ? lng : opt.short ? !lng : true; });
      for (const [s, a0, a1] of sides) {
        const len = a1 - a0, cnt = Math.max(1, Math.floor((len - 3) / sp)), st = (len - (cnt - 1) * sp) / 2;
        for (let k2 = 0; k2 < cnt; k2++) {
          const a = opt.first ? a0 + len / 2 + (rnd() - .5) * (len - 8) : a0 + st + k2 * sp;
          const x = s === 'n' || s === 's' ? a : s === 'w' ? r.x0 + off : r.x1 - off, z = s === 'w' || s === 'e' ? a : s === 'n' ? r.z0 + off : r.z1 - off;
          if (P.near(x, z, 4) || (opt.skip && rnd() < opt.skip)) continue;
          P.put(k, x, z, { n: 0, s: Math.PI, w: Math.PI / 2, e: -Math.PI / 2 }[s], o, sol);
          if (opt.first) return;
        }
      }
    },
    scatter(k, cnt, rad = 0, o = {}) { for (let i = 0; i < cnt; i++) for (let t = 0; t < 20; t++) { const x = r.x0 + rnd() * r.w, z = r.z0 + rnd() * r.d; if (P.free(x, z, Math.max(rad, .4))) { P.put(k, x, z, rnd() * TAU, o, rad); break; } } },
    pillars(style, kind) {
      const spots = [];
      if (style === 'colonnade') { const c = P.A / 2 - 3.6; for (let a = -P.L / 2 + 4.5; a <= P.L / 2 - 4.5; a += 5.5) spots.push(P.at(a, -c), P.at(a, c)); }
      if (style === 'four') for (const a of [-1, 1]) for (const c of [-1, 1]) spots.push(P.at(a * P.L / 4, c * P.A / 4));
      if (style === 'ring') { const n = 6 + Math.floor(rnd() * 3), rad = Math.min(P.L, P.A) / 2 - 4.5; for (let k = 0; k < n; k++) spots.push({ x: r.cx + Math.sin(TAU * k / n) * rad, z: r.cz + Math.cos(TAU * k / n) * rad }); }
      if (style === 'grid') for (let x = r.x0 + 4.5; x <= r.x1 - 4.5; x += 6.5) for (let z = r.z0 + 4.5; z <= r.z1 - 4.5; z += 6.5) spots.push({ x, z });
      for (const p of spots) if (P.free(p.x, p.z, .9)) P.put('pillar', p.x, p.z, rnd() * TAU, { kind, h: kind === 'broken' ? 1.2 + rnd() * 2.5 : 0 }, .9);
    },
  };
  T.lay(P);
}

const dunState = () => role === 'guest' ? R?.dun : S.dun;
const dunWalk = () => !DUN ? [{ x0: -6, x1: 6, z0: -6, z1: 6 }] : dunState()?.stairs ? DUN.walkOpen : DUN.walk;
const dunPillars = () => DUN ? DUN.pillars : [];
function dunMap() { MAP.rects = dunWalk(); MAP.erects = DUN?.erects || null; PILLARS.length = 0; PILLARS.push(...dunPillars()); }
const inBox = (p, q, pad = 0) => p.x > q.x0 + pad && p.x < q.x1 - pad && p.z > q.z0 + pad && p.z < q.z1 - pad;
const inRoom = (p, r, pad = 1.2) => inBox(p, r, pad);
// the ground height under (x, z): 0 except on the stairs
function groundY(x, z) {
  if (S.mode !== 'dungeon' || !DUN) return 0;
  for (const q of DUN.stairs) if (x >= q.x0 && x <= q.x1 && z >= q.z0 && z <= q.z1) {
    const m = q.ramp; if (!m) return q.y;
    return m.y0 + (m.y1 - m.y0) * clamp(((x - m.ax) * m.dx + (z - m.az) * m.dz) / m.L, 0, 1);
  }
  return 0;
}
// which room or hall a point is in (the nearest one if it's in neither, e.g. on the stairs)
function nodeAt(x, z) {
  const R0 = DUN.rooms.length;
  for (const r of DUN.rooms) if (x >= r.x0 && x <= r.x1 && z >= r.z0 && z <= r.z1) return r.i;
  for (let k = 0; k < DUN.halls.length; k++) { const h = DUN.halls[k]; if (x >= h.x0 && x <= h.x1 && z >= h.z0 && z <= h.z1) return R0 + k; }
  let best = 0, bd = 1e9;
  DUN.erects.forEach((q, k) => { const d = (clamp(x, q.x0, q.x1) - x) ** 2 + (clamp(z, q.z0, q.z1) - z) ** 2; if (d < bd) { bd = d; best = k; } });
  return best;
}
// where a monster should walk to reach t: straight at it in the same room or hall, otherwise the next doorway on the way
function navTo(e, t) {
  if (S.mode === 'city') return cityNav(e, t);
  if (S.mode !== 'dungeon' || !DUN) return t;
  const a = nodeAt(e.x, e.z), b = nodeAt(t.x, t.z), R0 = DUN.rooms.length;
  if (a === b) return t;
  const nx = DUN.next[a][b];
  if (nx == null) return t;
  return a < R0 ? DUN.halls[nx - R0].pout[a] : DUN.halls[a - R0].pin[nx];
}

// ---------- rules (host) ----------
function roomMonsters(r, floor) {
  if (!r.i || r.quiet) return [];
  if (r.boss) return ['warden', ...Array(2 + Math.floor(floor / 5)).fill('skeleton')];
  const pool = Object.keys(ET).filter(k => ET[k].zone === 'dungeon' && ET[k].cost && ET[k].from <= floor), out = [];
  let budget = Math.round((3 + floor * 1.5) * clamp(r.w * r.d / 400, .7, 2.2) * (S.players.g ? 1.4 : 1) * (r.stairs ? 1.3 : 1));
  while (budget > 0) { const ok = pool.filter(k => ET[k].cost <= budget); if (!ok.length) break; const t = weighted(ok, k => 1 / ET[k].cost); out.push(t); budget -= ET[t].cost; }
  return out;
}
function startDungeon() {
  S.dun = { floor: 1, seed: (Math.random() * 1e9) | 0, o: { x: 0, z: 0, r: 0 }, st: [], stairs: 0, wait: 0, act: [] };
  buildFloor(S.dun.seed, 1, S.dun.o);
  S.dun.st = DUN.rooms.map(r => r.i ? 0 : ROOM_CLEAR);
  dunMap();
  const [fx, fz] = rot4(DUN.arr.r, 1, 0); // start at the foot of the stairs you came down, facing the way out
  for (const p of players()) { const q = poseAt(DUN.arr, 2.5, p.id === 'h' ? 9 : 10.5); p.spawn = { ...q, yaw: Math.atan2(-fx, -fz), n: (p.spawn?.n || 0) + 1 }; }
  S.wave = 1; S.phase = 'fight';
  ev({ k: 'floor', n: 1, boss: 0 });
}
function nextFloor() { // everyone is on the lower flight: build the next floor around the stairwell they're standing in
  const D = S.dun;
  D.o = poseMul(poseMul(D.o, DUN.dep), poseInv(ARRIVE));
  D.floor++; S.wave = D.floor; D.seed = (Math.random() * 1e9) | 0; D.stairs = 0; D.wait = 0; D.act = [];
  buildFloor(D.seed, D.floor, D.o);
  D.st = DUN.rooms.map(r => r.i ? 0 : ROOM_CLEAR);
  S.enemies = []; S.shots = []; S.ents = []; S.timers = []; S.rings = []; S.tstop = 0;
  dunMap();
  const up = players().find(p => !p.down);
  for (const p of players()) {
    if (p.down && up) { p.down = false; p.hp = p.max * .4; ev({ k: 'up', id: p.id }); p.spawn = { x: up.x, z: up.z, yaw: up.yaw, n: (p.spawn?.n || 0) + 1 }; } // a downed partner is revived at your side
    p.hp = Math.min(p.max, p.hp + p.max * .25); p.ch = null; p.chg = null;
  }
  ev({ k: 'floor', n: D.floor, boss: D.floor % 5 === 0 ? 1 : 0 });
}
function stepDungeon(dt) {
  const D = S.dun;
  if (S.phase !== 'fight' || !DUN) return;
  for (const r of DUN.rooms) { // walking into a new room wakes its monsters (nothing closes behind you)
    if (D.st[r.i] || !players().some(q => !q.down && inRoom(q, r))) continue;
    D.st[r.i] = ROOM_ACTIVE; D.act.push({ i: r.i, q: roomMonsters(r, D.floor), t: .5 });
    ev({ k: 'room', f: 'enter', i: r.i, boss: r.boss ? 1 : 0 });
  }
  for (const a of D.act) {
    const r = DUN.rooms[a.i];
    if (a.q.length && (a.t -= dt) <= 0 && S.enemies.length < 12) {
      a.t = 1.4;
      for (let k = 0; k < 3 && a.q.length; k++) {
        let x = r.cx, z = r.cz;
        for (let t = 0; t < 16; t++) { x = rand(r.x0 + 2.5, r.x1 - 2.5); z = rand(r.z0 + 2.5, r.z1 - 2.5); if (players().every(q => Math.hypot(q.x - x, q.z - z) > 7) && PILLARS.every(c => Math.hypot(c.x - x, c.z - z) > c.r + 1.2)) break; }
        const e = spawnEnemy(a.q.shift(), x, z, D.floor >= 3 && Math.random() < .06); e.room = a.i;
      }
    }
    if (!a.q.length && !S.enemies.some(e => e.room === a.i)) {
      a.done = true; D.st[a.i] = ROOM_CLEAR;
      for (const p of players()) heal(p, p.max * .12);
      if (r.stairs) { D.stairs = 1; dunMap(); }
      if (!r.quiet) ev({ k: 'room', f: 'clear', stairs: r.stairs ? 1 : 0 });
    }
  }
  D.act = D.act.filter(a => !a.done);
  if (D.stairs) { // down the stairs: the next floor appears once every standing wizard is on the lower flight
    const live = players().filter(p => !p.down), on = live.filter(p => inBox(p, DUN.trig));
    D.wait = on.length && on.length < live.length ? 1 : 0;
    if (live.length && on.length === live.length) nextFloor();
  }
}
// guest: rebuild the floor when the host's seed changes; keep the walkable area in step with the stairs
function dunSync(d) {
  if (!d) return;
  if (!DUN || DUN.seed !== d.seed) buildFloor(d.seed, d.floor, d.o);
  dunMap();
}

// ===================== scenery (both machines): built at runtime from the layout =====================
// Textures are painted on canvases (colour + a matching bump map for relief), all static geometry is merged into one mesh
// per material with world-space UVs, and a small pool of point lights follows the torches nearest to you.
function painter(draw, n = 512) {
  const mk = () => Object.assign(document.createElement('canvas'), { width: n, height: n });
  const a = mk(), b = mk(), T = { c: a.getContext('2d'), h: b.getContext('2d'), n };
  T.h.fillStyle = '#000'; T.h.fillRect(0, 0, n, n);
  T.tile = (f, x = 0, y = 0, w = n, hh = n) => { // draw f, and again across the seams it crosses, so the texture tiles
    const xs = [0], ys = [0]; if (x < 0) xs.push(n); if (x + w > n) xs.push(-n); if (y < 0) ys.push(n); if (y + hh > n) ys.push(-n);
    for (const ox of xs) for (const oy of ys) { T.c.save(); T.h.save(); T.c.translate(ox, oy); T.h.translate(ox, oy); f(); T.c.restore(); T.h.restore(); }
  };
  draw(T);
  const tex = (cv, srgb) => { const t = new THREE.CanvasTexture(cv); t.wrapS = t.wrapT = THREE.RepeatWrapping; if (srgb) t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t; };
  return { map: tex(a, 1), bump: tex(b) };
}
const rr2 = (g, x, y, w, h, r) => { w = Math.max(w, .1); h = Math.max(h, .1); r = Math.max(0, Math.min(r, w / 2, h / 2)); g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); };
const hsl = (h, s, l, a = 1) => `hsla(${h},${s}%,${l}%,${a})`;
function block(T, x, y, w, hh, col, r = 4, bev = 5) { // a bevelled stone: lit top edge, shadowed bottom, raised face in the bump map
  T.tile(() => {
    const { c, h } = T;
    c.fillStyle = col; rr2(c, x, y, w, hh, r); c.fill();
    c.fillStyle = 'rgba(255,235,210,.09)'; c.fillRect(x + r, y + 1, w - 2 * r, bev * .7);
    c.fillStyle = 'rgba(0,0,0,.32)'; c.fillRect(x + r, y + hh - bev * .8, w - 2 * r, bev * .8);
    c.fillStyle = 'rgba(0,0,0,.18)'; c.fillRect(x + w - bev * .7, y + r, bev * .7, hh - 2 * r);
    h.fillStyle = '#5a5a5a'; rr2(h, x, y, w, hh, r); h.fill();
    h.fillStyle = '#a8a8a8'; rr2(h, x + bev, y + bev, w - 2 * bev, hh - 2 * bev, r); h.fill();
  }, x, y, w, hh);
}
function grime(T, k, rgb, amax, r0, r1, bump) { // soft stains (and soft lumps in the bump map)
  for (let i = 0; i < k; i++) {
    const x = Math.random() * T.n, y = Math.random() * T.n, r = rand(r0, r1), a = Math.random() * amax;
    T.tile(() => { for (const [g, col] of bump ? [[T.c, rgb], [T.h, bump]] : [[T.c, rgb]]) { const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, `rgba(${col},${a})`); gr.addColorStop(1, `rgba(${col},0)`); g.fillStyle = gr; g.fillRect(x - r, y - r, 2 * r, 2 * r); } }, x - r, y - r, 2 * r, 2 * r);
  }
}
function speck(T, k) { for (let i = 0; i < k; i++) { const x = Math.random() * T.n, y = Math.random() * T.n, s = 1 + Math.random() * 3, l = Math.random() < .5; T.c.fillStyle = `rgba(${l ? '255,240,220' : '0,0,0'},${Math.random() * .12})`; T.c.fillRect(x, y, s, s); T.h.fillStyle = `rgba(${l ? '255,255,255' : '0,0,0'},${Math.random() * .25})`; T.h.fillRect(x, y, s, s); } }
function cracks(T, k) {
  for (let i = 0; i < k; i++) {
    const pts = [[Math.random() * T.n, Math.random() * T.n]]; let a = Math.random() * TAU;
    for (let j = 0; j < 6 + Math.random() * 8; j++) { a += rand(-.8, .8); const [x, y] = pts[pts.length - 1]; pts.push([x + Math.cos(a) * rand(5, 14), y + Math.sin(a) * rand(5, 14)]); }
    const xs = pts.map(p => p[0]), ys = pts.map(p => p[1]), x0 = Math.min(...xs), y0 = Math.min(...ys);
    T.tile(() => { for (const [g, col, w] of [[T.c, 'rgba(0,0,0,.55)', 1.3], [T.h, '#000', 2]]) { g.strokeStyle = col; g.lineWidth = w; g.beginPath(); g.moveTo(...pts[0]); for (const p of pts) g.lineTo(...p); g.stroke(); } }, x0, y0, Math.max(...xs) - x0, Math.max(...ys) - y0);
  }
}
const finish = (T, g = 1) => { grime(T, 40 * g, '0,0,0', .35, 20, 90); grime(T, 14 * g, '255,230,200', .06, 30, 90); speck(T, 3000); cracks(T, 10 * g); };
const PAINT = {
  ashlar(T) { T.c.fillStyle = '#17130f'; T.c.fillRect(0, 0, T.n, T.n); const rows = 5, h = T.n / rows; for (let r = 0; r < rows; r++) { let x = Math.random() * 60; const end = x + T.n; while (x < end - 30) { const w = Math.min(rand(110, 210), end - x); block(T, x + 3, r * h + 3, w - 6, h - 6, hsl(28 + rand(-6, 10), rand(4, 10), rand(30, 44)), 4, 6); x += w; } } finish(T); },
  mossy(T) { PAINT.ashlar(T); grime(T, 30, '40,70,25', .45, 15, 70); grime(T, 20, '20,40,15', .4, 10, 40); },
  brick(T) { T.c.fillStyle = '#2b241e'; T.c.fillRect(0, 0, T.n, T.n); const rows = 14, h = T.n / rows, w = T.n / 6; for (let r = 0; r < rows; r++) for (let c = -1; c < 7; c++) block(T, c * w + (r % 2) * w / 2 + 2, r * h + 2, w - 4, h - 4, Math.random() < .12 ? hsl(15, 20, rand(12, 18)) : hsl(rand(10, 24), rand(25, 42), rand(22, 34)), 2, 3); finish(T, .7); },
  rubble(T) { T.c.fillStyle = '#120f0c'; T.c.fillRect(0, 0, T.n, T.n); let y = 0; while (y < T.n - 1) { const h = T.n - y < 130 ? T.n - y : rand(42, 86); let x = Math.random() * 50; const end = x + T.n; while (x < end - 20) { const w = Math.min(rand(48, 130), end - x); block(T, x + 3, y + 3, w - 6, h - 6, hsl(rand(22, 40), rand(5, 12), rand(25, 42)), 16, 8); x += w; } y += h; } finish(T, 1.2); },
  cave(T) { T.c.fillStyle = hsl(28, 9, 22); T.c.fillRect(0, 0, T.n, T.n); T.h.fillStyle = '#777'; T.h.fillRect(0, 0, T.n, T.n); grime(T, 160, '0,0,0', .4, 10, 70, '0,0,0'); grime(T, 120, '200,190,170', .12, 10, 60, '255,255,255'); for (let y = 0; y < T.n; y += rand(30, 60)) { T.c.strokeStyle = 'rgba(0,0,0,.35)'; T.h.strokeStyle = 'rgba(0,0,0,.6)'; for (const g of [T.c, T.h]) { g.lineWidth = 3; g.beginPath(); for (let x = 0; x <= T.n; x += 16) g.lineTo(x, y + Math.sin(x * .03 + y) * 6); g.stroke(); } } speck(T, 4000); cracks(T, 16); },
  plaster(T) { T.c.fillStyle = hsl(36, 22, 46); T.c.fillRect(0, 0, T.n, T.n); T.h.fillStyle = '#8a8a8a'; T.h.fillRect(0, 0, T.n, T.n); for (let i = 0; i < 4; i++) { const x0 = Math.random() * T.n, y0 = Math.random() * T.n; for (let r = 0; r < 3 + Math.random() * 3; r++) for (let c = 0; c < 2 + Math.random() * 3; c++) block(T, x0 + c * 46 + (r % 2) * 23, y0 + r * 22, 42, 18, hsl(rand(12, 22), 30, rand(24, 32)), 2, 3); } grime(T, 60, '60,40,20', .3, 20, 100); finish(T, .8); },
  flag(T) { T.c.fillStyle = '#0e0c0a'; T.c.fillRect(0, 0, T.n, T.n); const rows = 4, h = T.n / rows; for (let r = 0; r < rows; r++) { let x = Math.random() * 70; const end = x + T.n; while (x < end - 30) { const w = Math.min(rand(90, 200), end - x); block(T, x + 4, r * h + 4 + rand(-3, 3), w - 8, h - 8, hsl(rand(22, 36), rand(4, 9), rand(24, 38)), 7, 7); x += w; } } finish(T, 1.3); },
  cobble(T) { T.c.fillStyle = '#100d0b'; T.c.fillRect(0, 0, T.n, T.n); const k = 11, s = T.n / k; for (let i = 0; i < k; i++) for (let j = 0; j < k; j++) { const x = (i + .5) * s + rand(-4, 4) + (j % 2) * s / 2, y = (j + .5) * s + rand(-4, 4), rx = s * rand(.36, .46), ry = s * rand(.36, .46), col = hsl(rand(22, 38), rand(4, 10), rand(26, 44)); T.tile(() => { T.c.fillStyle = col; T.c.beginPath(); T.c.ellipse(x, y, rx, ry, 0, 0, TAU); T.c.fill(); const g = T.h.createRadialGradient(x - 3, y - 3, 1, x, y, rx); g.addColorStop(0, '#d0d0d0'); g.addColorStop(1, '#404040'); T.h.fillStyle = g; T.h.beginPath(); T.h.ellipse(x, y, rx, ry, 0, 0, TAU); T.h.fill(); }, x - rx, y - ry, rx * 2, ry * 2); } finish(T, .8); },
  planks(T) { T.c.fillStyle = '#120a05'; T.c.fillRect(0, 0, T.n, T.n); const rows = 6, h = T.n / rows; for (let r = 0; r < rows; r++) { let x = Math.random() * 100; const end = x + T.n; while (x < end - 40) { const w = Math.min(rand(180, 420), end - x), col = hsl(rand(22, 32), rand(32, 46), rand(17, 28)); block(T, x + 1, r * h + 2, w - 2, h - 4, col, 2, 3); T.tile(() => { T.c.strokeStyle = 'rgba(0,0,0,.25)'; T.c.lineWidth = 1; for (let g = 0; g < 7; g++) { const gy = r * h + 6 + g * (h - 12) / 6, ph = Math.random() * 9; T.c.beginPath(); for (let px = x; px < x + w; px += 12) T.c.lineTo(px, gy + Math.sin(px * .02 + ph) * 2.5); T.c.stroke(); } T.c.fillStyle = 'rgba(0,0,0,.6)'; for (const px of [x + 8, x + w - 10]) for (const py of [r * h + 12, r * h + h - 14]) T.c.fillRect(px, py, 3, 3); }, x, r * h, w, h); x += w; } } grime(T, 30, '0,0,0', .3, 20, 80); speck(T, 1500); },
  checker(T) { const k = 4, s = T.n / k; T.c.fillStyle = '#0c0b0a'; T.c.fillRect(0, 0, T.n, T.n); for (let i = 0; i < k; i++) for (let j = 0; j < k; j++) { const lt = (i + j) % 2 === 0; block(T, i * s + 2, j * s + 2, s - 4, s - 4, lt ? hsl(40, 8, rand(52, 60)) : hsl(15, 12, rand(12, 17)), 2, 4); T.c.strokeStyle = lt ? 'rgba(80,70,60,.25)' : 'rgba(200,190,180,.08)'; T.c.lineWidth = 1.2; for (let v = 0; v < 3; v++) { T.c.beginPath(); T.c.moveTo(i * s + Math.random() * s, j * s); T.c.bezierCurveTo(i * s + Math.random() * s, j * s + s * .3, i * s + Math.random() * s, j * s + s * .7, i * s + Math.random() * s, j * s + s); T.c.stroke(); } } grime(T, 30, '0,0,0', .3, 20, 80); speck(T, 1500); cracks(T, 5); },
  weave(T) { T.c.fillStyle = '#1d1712'; T.c.fillRect(0, 0, T.n, T.n); const k = 8, s = T.n / k; for (let i = 0; i < k; i++) for (let j = 0; j < k; j++) for (let b = 0; b < 2; b++) { const hz = (i + j) % 2 === 0, col = hsl(rand(10, 24), rand(25, 38), rand(22, 34)); if (hz) block(T, i * s + 2, j * s + b * s / 2 + 2, s - 4, s / 2 - 4, col, 2, 3); else block(T, i * s + b * s / 2 + 2, j * s + 2, s / 2 - 4, s - 4, col, 2, 3); } finish(T, .6); },
  dirt(T) { T.c.fillStyle = hsl(26, 22, 15); T.c.fillRect(0, 0, T.n, T.n); T.h.fillStyle = '#666'; T.h.fillRect(0, 0, T.n, T.n); grime(T, 120, '0,0,0', .35, 10, 60, '0,0,0'); grime(T, 80, '120,95,70', .2, 10, 50, '255,255,255'); for (let i = 0; i < 260; i++) { const x = Math.random() * T.n, y = Math.random() * T.n, r = rand(2, 7), col = hsl(rand(20, 40), 8, rand(25, 45)); T.tile(() => { T.c.fillStyle = col; T.c.beginPath(); T.c.ellipse(x, y, r, r * .8, 0, 0, TAU); T.c.fill(); T.h.fillStyle = '#ddd'; T.h.beginPath(); T.h.ellipse(x, y, r, r * .8, 0, 0, TAU); T.h.fill(); }, x - r, y - r, 2 * r, 2 * r); } speck(T, 4000); },
  books(T) { T.c.fillStyle = '#1a0f08'; T.c.fillRect(0, 0, T.n, T.n); const rows = 4, h = T.n / rows; for (let r = 0; r < rows; r++) { let x = 6; while (x < T.n - 30) { const w = rand(12, 28), bh = rand(h * .62, h * .86), col = hsl(Math.random() * 360, rand(25, 50), rand(16, 32)); T.c.fillStyle = col; T.c.fillRect(x, r * h + h - 14 - bh, w - 2, bh); T.c.fillStyle = 'rgba(230,190,90,.55)'; T.c.fillRect(x + 1, r * h + h - 14 - bh + 10, w - 4, 3); T.c.fillRect(x + 1, r * h + h - 30, w - 4, 2); x += w + (Math.random() < .08 ? rand(10, 30) : 0); } T.c.fillStyle = hsl(25, 40, 16); T.c.fillRect(0, r * h + h - 14, T.n, 14); } speck(T, 800); },
  carpet(T) { T.c.fillStyle = hsl(355, 55, 18); T.c.fillRect(0, 0, T.n, T.n); T.c.fillStyle = hsl(40, 55, 40); T.c.fillRect(30, 0, 14, T.n); T.c.fillRect(T.n - 44, 0, 14, T.n); T.c.fillStyle = hsl(355, 50, 26); for (let y = 0; y < T.n; y += 128) { T.c.beginPath(); T.c.moveTo(T.n / 2, y + 14); T.c.lineTo(T.n - 90, y + 64); T.c.lineTo(T.n / 2, y + 114); T.c.lineTo(90, y + 64); T.c.closePath(); T.c.fill(); } grime(T, 40, '0,0,0', .3, 20, 80); speck(T, 2500); },
};
let DM = null; // dungeon materials, painted the first time a dungeon is built
function dunMats() {
  if (DM) return DM;
  const sm = o => new THREE.MeshStandardMaterial({ vertexColors: true, roughness: .92, ...o });
  const tex = k => painter(PAINT[k]), lit = (t, wuv, o) => Object.assign(sm({ map: t.map, bumpMap: t.bump, bumpScale: 1.6, ...o }), { userData: { wuv } });
  DM = { wall: {}, floor: {} };
  for (const k of ['ashlar', 'mossy', 'brick', 'rubble', 'cave', 'plaster']) DM.wall[k] = lit(tex(k), 3);
  for (const k of ['flag', 'cobble', 'planks', 'checker', 'weave', 'dirt']) DM.floor[k] = lit(tex(k), 3);
  Object.assign(DM, {
    wood: lit(painter(PAINT.planks), 1.5, { roughness: .85 }), stone: lit(painter(PAINT.ashlar), 1.5),
    iron: sm({ color: 0x45454c, metalness: .8, roughness: .42 }), gold: sm({ color: 0xffc850, metalness: 1, roughness: .28, emissive: 0x2a1c00 }),
    bone: sm({ color: 0xd8ccb0, roughness: .75 }), cloth: sm({ roughness: 1 }), glow: new THREE.MeshBasicMaterial({ vertexColors: true }),
    water: sm({ color: 0x0a1c24, roughness: .06, metalness: .55, transparent: true, opacity: .85 }),
    books: sm({ map: painter(PAINT.books).map }), carpet: sm({ map: painter(PAINT.carpet).map, roughness: 1 }),
  });
  return DM;
}
const dunView = new THREE.Group(); dunView.visible = false; scene.add(dunView);
const lantern = new THREE.PointLight(0xffc890, 6, 12, 1.5); lantern.position.set(0, .3, .2); lantern.visible = false; camera.add(lantern); // a warm glow around you underground
const dunLights = Array.from({ length: 8 }, () => { const l = new THREE.PointLight(0xffa060, 0, 14, 1.6); l.visible = false; scene.add(l); return l; });
const FLAME_GEO = new THREE.ConeGeometry(.5, 1.25, 8, 1, true).translate(0, .62, 0);
let dunShown = null; const dunAnim = { flames: [], anchors: [], gate: null, circles: [], bubbles: [] };

// geometry helpers: everything static goes into a per-material bucket and is merged at the end
const BUCKET = new Map();
const bx = (w, h, d) => new THREE.BoxGeometry(w, h, d), cy = (a, b, h, s = 10) => new THREE.CylinderGeometry(a, b, h, s), sph = (r, s = 8) => new THREE.SphereGeometry(r, s, Math.max(4, s * .75 | 0)), co = (r, h, s = 8) => new THREE.ConeGeometry(r, h, s);
function add(mat, geo, col = 0xffffff) {
  const g = geo.index ? geo.toNonIndexed() : geo; if (g !== geo) geo.dispose();
  const n = g.attributes.position.count, c = new THREE.Color(col), a = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) { a[i * 3] = c.r; a[i * 3 + 1] = c.g; a[i * 3 + 2] = c.b; }
  g.setAttribute('color', new THREE.BufferAttribute(a, 3));
  if (!BUCKET.has(mat)) BUCKET.set(mat, []); BUCKET.get(mat).push(g);
}
function flush() {
  for (const [mat, list] of BUCKET) {
    let n = 0; for (const g of list) n += g.attributes.position.count;
    const pos = new Float32Array(n * 3), nor = new Float32Array(n * 3), col = new Float32Array(n * 3), uv = new Float32Array(n * 2), s = mat.userData.wuv;
    let o = 0;
    for (const g of list) {
      const P = g.attributes.position, N = g.attributes.normal, U = g.attributes.uv;
      pos.set(P.array, o * 3); nor.set(N.array, o * 3); col.set(g.attributes.color.array, o * 3);
      if (s) for (let i = 0; i < P.count; i++) { // world-space UVs: one texture density everywhere, seamless across pieces
        const ax = Math.abs(N.getX(i)), ay = Math.abs(N.getY(i)), az = Math.abs(N.getZ(i)), x = P.getX(i), y = P.getY(i), z = P.getZ(i);
        const [u, v] = ay >= ax && ay >= az ? [x, z] : ax >= az ? [z, y] : [x, y]; uv[(o + i) * 2] = u / s; uv[(o + i) * 2 + 1] = v / s;
      }
      else if (U) uv.set(U.array, o * 2);
      o += P.count; g.dispose();
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(col, 3)); geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
    geo.computeBoundingSphere(); dunView.add(new THREE.Mesh(geo, mat));
  }
  BUCKET.clear();
}
// place parts of a prop given in its own frame (x across, z out from the wall, y up), turned by ry and moved to (x, z)
const placer = (x, z, ry) => { const c = Math.cos(ry), s = Math.sin(ry); return (mat, geo, lx, ly, lz, col) => add(mat, geo.rotateY(ry).translate(x + lx * c + lz * s, ly, z - lx * s + lz * c), col); };
function flame(x, y, z, s, col = 0xff9a50, li = 0) {
  const f = new THREE.Mesh(FLAME_GEO, FIRE_MAT); f.position.set(x, y, z); f.scale.setScalar(s); f.userData.keep = 1; dunView.add(f); dunAnim.flames.push(f);
  if (li) anchor(x, y + s * .5, z, col, li, 9 + li);
}
function anchor(x, y, z, c, i, d, f = 1) { dunAnim.anchors.push({ x, y, z, c, i, d, f, ph: Math.random() * 9, node: nodeAt(x, z), k: 0 }); }
const shade = (hex, k) => new THREE.Color(hex).multiplyScalar(k).getHex();
const tintOf = (t, rnd, dl = 0) => new THREE.Color().setHSL(((t[0] + (rnd() - .5) * 24) % 360 + 360) % 360 / 360, (t[1] + (rnd() - .5) * 10) / 100, clamp((t[2] + dl + (rnd() - .5) * 8) / 100, 0, 1)).getHex();

// props: k -> builder(q = placer, o = prop, rnd, r = room). Front faces +z (into the room).
const PROPS = {
  barrel(q) { q(DM.wood, cy(.42, .38, 1.1, 12), 0, .55, 0, 0x9a7a5a); for (const y of [.22, .88]) q(DM.iron, cy(.44, .44, .07, 12), 0, y, 0); },
  crate(q, o, rnd) { q(DM.wood, bx(.95, .95, .95), 0, .475, 0, 0xb09070); if (rnd() < .5) q(DM.wood, bx(.6, .6, .6).rotateY(.4), .1, 1.25, 0, 0xa08060); },
  sarc(q, o, rnd) { const c = shade(0xffffff, .75 + rnd() * .2); q(DM.stone, bx(1.05, .8, 2.2), 0, .4, 0, c); q(DM.stone, bx(1.15, .18, 2.32), 0, .89, 0, c); q(DM.stone, bx(.42, .16, 1.5), 0, 1.06, 0, shade(c, .9)); q(DM.stone, sph(.18), 0, 1.1, -.85, c); },
  table(q, o, rnd) {
    const l = o.l || 2.4; q(DM.wood, bx(l, .1, 1.1), 0, .82, 0, 0x9a7050); for (const sx of [-1, 1]) for (const sz of [-1, 1]) q(DM.wood, bx(.1, .78, .1), sx * (l / 2 - .15), .39, sz * .42, 0x7a5840);
    const n = Math.max(2, Math.floor(l / .7));
    for (let k = 0; k < n; k++) {
      const x = -l / 2 + .35 + k * (l - .7) / (n - 1), z = rand(-.3, .3);
      if (o.top === 'books' && rnd() < .7) q(DM.cloth, bx(.3, .08 + rnd() * .1, .22).rotateY(rnd()), x, .92, z, new THREE.Color().setHSL(rnd(), .4, .25).getHex());
      if (o.top === 'flasks' && rnd() < .8) q(DM.glow, cy(.05, .08, .2 + rnd() * .15, 6), x, .97, z, new THREE.Color().setHSL(.25 + rnd() * .6, .9, .5).getHex());
      if (o.top === 'feast') { if (rnd() < .5) q(DM.iron, cy(.18, .14, .04, 10), x, .89, z * .5, 0x999999); if (rnd() < .35) q(DM.cloth, sph(.12, 6), x, .97, z * .5, 0x6a3a20); if (rnd() < .3) { q(DM.bone, cy(.03, .03, .2, 5), x, .97, -z * .5, 0xfff0d0); q(DM.glow, sph(.04, 5), x, 1.1, -z * .5, 0xffd080); } }
      if (o.top === 'mugs' && rnd() < .5) q(DM.wood, cy(.06, .05, .14, 6), x, .94, z, 0x8a6a4a);
      if (o.top === 'weapons' && rnd() < .6) q(DM.iron, bx(.08, .02, .9).rotateY(rnd() - .5), x, .89, z);
    }
    if (o.top === 'books' || o.top === 'flasks') { q(DM.bone, cy(.035, .035, .25, 6), 0, 1, 0, 0xfff0d0); q(DM.glow, sph(.04, 5), 0, 1.15, 0, 0xffd080); }
    if (o.top === 'flasks' || o.top === 'books') anchor(o.x, 1.4, o.z, o.top === 'flasks' ? 0x80ff90 : 0xffc070, 2.5, 6);
  },
  bench(q, o) { const l = o.l || 2; q(DM.wood, bx(l, .08, .38), 0, .46, 0, 0x8a6040); for (let x = -l / 2 + .2; x < l / 2; x += Math.max(1.2, (l - .4) / Math.ceil((l - .4) / 2))) q(DM.wood, bx(.08, .42, .3), x, .21, 0, 0x6a4830); q(DM.wood, bx(.08, .42, .3), l / 2 - .2, .21, 0, 0x6a4830); },
  pew(q, o) { const l = o.l || 3; q(DM.wood, bx(l, .08, .5), 0, .46, 0, 0x7a5236); q(DM.wood, bx(l, .75, .07), 0, .86, -.24, 0x7a5236); for (const s of [-1, 1]) q(DM.wood, bx(.08, .95, .58), s * l / 2, .47, 0, 0x5a3a24); },
  shelf(q, o, rnd) { q(DM.wood, bx(2, 2.7, .08), 0, 1.35, -.2, 0x6a4a30); for (const s of [-1, 1]) q(DM.wood, bx(.08, 2.7, .44), s * .96, 1.35, 0, 0x7a5638); for (let k = 0; k < 5; k++) q(DM.wood, bx(1.9, .05, .42), 0, .05 + k * .65, 0, 0x7a5638);
    if (o.jars) for (let k = 0; k < 4; k++) for (let j = 0; j < 4; j++) { if (rnd() < .4) continue; q(rnd() < .4 ? DM.glow : DM.cloth, cy(.07, .08, .2 + rnd() * .15, 6), -.7 + j * .45, .2 + k * .65, 0, new THREE.Color().setHSL(rnd(), .6, rnd() < .5 ? .4 : .25).getHex()); }
    else q(DM.books, new THREE.PlaneGeometry(1.84, 2.55), 0, 1.35, .0); },
  rack(q, o, rnd) { for (const s of [-1, 1]) q(DM.wood, bx(.1, 1.9, .1), s * .8, .95, -.05, 0x6a4a30); for (const y of [.5, 1.6]) q(DM.wood, bx(1.7, .08, .08), 0, y, -.05, 0x6a4a30);
    for (let k = 0; k < 4; k++) { const x = -.6 + k * .4; if (rnd() < .5) { q(DM.wood, cy(.025, .025, 2.1, 5), x, 1.05, .05, 0x8a6a4a); q(DM.iron, co(.06, .3, 5), x, 2.25, .05); } else { q(DM.iron, bx(.07, 1.1, .02), x, 1.05, .05); q(DM.iron, bx(.3, .05, .05), x, .45, .05); q(DM.wood, bx(.04, .3, .04), x, .25, .05, 0x5a3a20); } } },
  armor(q) { q(DM.wood, cy(.04, .04, 1.2, 5), 0, .6, 0, 0x6a4a30); q(DM.wood, cy(.3, .32, .06, 8), 0, .03, 0, 0x5a3a24); q(DM.iron, bx(.52, .62, .3), 0, 1.4, 0); q(DM.iron, sph(.17), 0, 1.92, 0); for (const s of [-1, 1]) q(DM.iron, sph(.14), s * .33, 1.66, 0); q(DM.iron, co(.34, .5, 8).rotateX(Math.PI), 0, .95, 0); q(DM.cloth, bx(.4, .8, .03), 0, 1.2, .17, 0x6a1a1a); },
  bed(q, o, rnd) { q(DM.wood, bx(.95, .32, 2), 0, .26, 0, 0x7a5638); q(DM.cloth, bx(.85, .16, 1.9), 0, .5, 0, 0x8a7a5a); q(DM.cloth, bx(.6, .12, .35), 0, .63, -.72, 0xc8b898); q(DM.cloth, bx(.88, .06, 1.1), 0, .6, .35, new THREE.Color().setHSL(rnd(), .35, .22).getHex()); q(DM.wood, bx(.95, .8, .08), 0, .4, -1, 0x6a4a30); },
  chest(q, o) { q(DM.wood, bx(.9, .55, .56), 0, .28, 0, 0x8a5a34); q(DM.wood, bx(.92, .14, .58), 0, .62, 0, 0x7a4a2a); for (const s of [-1, 1]) q(DM.iron, bx(.06, .7, .6), s * .3, .35, 0); q(o.gold ? DM.gold : DM.iron, bx(.12, .14, .04), 0, .48, .29); if (o.gold) { q(DM.gold, bx(.8, .06, .46), 0, .72, 0); for (let k = 0; k < 4; k++) q(DM.gold, cy(.06, .06, .02, 8).rotateX(rand(0, 1)), rand(-.4, .4), .78, rand(-.2, .2)); } },
  gold(q, o, rnd) { q(DM.gold, co(.75, .45, 10), 0, .22, 0); for (let k = 0; k < 14; k++) { const a = rnd() * TAU, d = rnd() * .8; q(DM.gold, cy(.07, .07, .02, 8).rotateX(rnd() * 2), Math.cos(a) * d, .02 + rnd() * .3 * (1 - d), Math.sin(a) * d); } if (rnd() < .5) q(DM.gold, cy(.1, .08, .25, 8), .2, .5, 0); },
  bones(q, o, rnd) { for (let k = 0; k < 6; k++) q(DM.bone, cy(.03, .025, .3 + rnd() * .2, 5).rotateZ(Math.PI / 2).rotateY(rnd() * 3), rand(-.4, .4), .04, rand(-.4, .4)); if (rnd() < .7) q(DM.bone, sph(.11, 7), rand(-.2, .2), .1, rand(-.2, .2)); },
  skulls(q, o, rnd) { for (let row = 0; row < 4; row++) for (let k = 0; k < 6 - row; k++) q(DM.bone, sph(.12, 7), -.6 + row * .12 + k * .24 + rand(-.03, .03), .12 + row * .2, -.1 + rand(-.05, .05) - row * .04, shade(0xffffff, .8 + rnd() * .2)); for (let k = 0; k < 5; k++) q(DM.bone, cy(.03, .03, .4, 5).rotateZ(Math.PI / 2 + rand(-.3, .3)), rand(-.5, .5), .04, rand(0, .3)); },
  cage(q, o, rnd, r) { for (const y of [.05, 2.2]) q(DM.iron, new THREE.TorusGeometry(.7, .04, 5, 16).rotateX(Math.PI / 2), 0, y, 0); for (let k = 0; k < 12; k++) { const a = TAU * k / 12; q(DM.iron, cy(.025, .025, 2.15, 4), Math.cos(a) * .7, 1.12, Math.sin(a) * .7); } q(DM.iron, cy(.02, .02, r.ch - 2.2, 4), 0, (r.ch + 2.2) / 2, 0); if (rnd() < .6) q(DM.bone, sph(.11, 7), .2, .12, .1); },
  chains(q, o, rnd, r) { const len = 1.5 + rnd() * (r.ch - 3); q(DM.iron, cy(.025, .025, len, 4), 0, r.ch - len / 2, 0); q(DM.iron, new THREE.TorusGeometry(.09, .025, 4, 8), 0, r.ch - len - .08, 0); },
  maiden(q) { q(DM.iron, bx(.9, 2.1, .7), 0, 1.05, 0, 0x707070); q(DM.iron, sph(.3, 8).scale(1, 1.2, .8), 0, 2.2, 0, 0x707070); q(DM.iron, bx(.05, 1.8, .02), 0, 1, .36, 0x222222); },
  rackt(q) { q(DM.wood, bx(2.6, .15, 1), 0, .9, 0, 0x6a4a30); for (const sx of [-1, 1]) for (const sz of [-1, 1]) q(DM.wood, bx(.12, .9, .12), sx * 1.15, .45, sz * .4, 0x5a3a24); for (const sx of [-1, 1]) q(DM.wood, cy(.12, .12, 1.1, 8).rotateX(Math.PI / 2), sx * 1.2, 1.05, 0, 0x7a5638); q(DM.iron, cy(.015, .015, 2.3, 4).rotateZ(Math.PI / 2), 0, 1.02, .3); },
  anvil(q) { q(DM.wood, cy(.35, .4, .5, 8), 0, .25, 0, 0x5a3a24); q(DM.iron, bx(.3, .3, .25), 0, .62, 0); q(DM.iron, bx(.8, .22, .32), 0, .87, 0); q(DM.iron, co(.14, .4, 6).rotateZ(-Math.PI / 2), .58, .87, 0); },
  coal(q, o, rnd) { for (let k = 0; k < 9; k++) q(rnd() < .25 ? DM.glow : DM.stone, sph(.1 + rnd() * .14, 5), rand(-.5, .5), .06, rand(-.5, .5), rnd() < .25 ? 0xff5010 : 0x222222); },
  forge(q, o, rnd, r) { q(DM.stone, bx(3, 1.2, 1.6), 0, .6, 0, 0x8a7060); q(DM.glow, bx(2.4, .06, 1.1), 0, 1.22, .1, 0xff6010); q(DM.stone, bx(2.8, 1.4, 1.3), 0, 3.4, -.15, 0x6a5848); q(DM.stone, bx(1.2, r.ch - 4.1, .9), 0, (r.ch + 4.1) / 2, -.35, 0x6a5848); for (const s of [-1, 1]) q(DM.stone, bx(.3, 1.5, 1.3), s * 1.25, 1.95, -.15, 0x6a5848); flame(o.x, 1.2, o.z, 1.3, 0xff7020, 0); anchor(o.x + Math.sin(o.ry) * 1.2, 1.8, o.z + Math.cos(o.ry) * 1.2, 0xff6a20, 26, 18); },
  hearth(q, o, rnd, r) { q(DM.stone, bx(3.2, .3, 1.4), 0, .15, 0, 0x8a7a6a); for (const s of [-1, 1]) q(DM.stone, bx(.5, 2.2, 1.2), s * 1.35, 1.1, -.05, 0x8a7a6a); q(DM.stone, bx(3.4, .5, 1.4), 0, 2.45, 0, 0x8a7a6a); q(DM.stone, bx(2.4, r.ch - 2.7, .9), 0, (r.ch + 2.7) / 2, -.25, 0x7a6a5a); for (let k = 0; k < 3; k++) q(DM.wood, cy(.1, .1, 1.2, 6).rotateZ(Math.PI / 2).rotateY(rand(-.4, .4)), 0, .4 + k * .12, rand(-.2, .2), 0x4a2a14); flame(o.x, .35, o.z, 1.1, 0xff8030, 0); anchor(o.x + Math.sin(o.ry) * 1.5, 1.4, o.z + Math.cos(o.ry) * 1.5, 0xff8a30, 20, 16); },
  cauldron(q, o) { q(DM.iron, sph(.75, 12).scale(1, .75, 1), 0, .65, 0); q(DM.glow, cy(.62, .62, .04, 14), 0, 1.15, 0, 0x50ff50); for (let k = 0; k < 3; k++) { const a = TAU * k / 3; q(DM.iron, cy(.05, .05, .5, 4), Math.cos(a) * .55, .2, Math.sin(a) * .55); } q(DM.stone, cy(.9, .9, .08, 10), 0, .04, 0, 0x2a2a2a); for (let k = 0; k < 5; k++) q(DM.glow, sph(.08, 5), rand(-.5, .5), .07, rand(-.5, .5), 0xff5010); anchor(o.x, 1.8, o.z, 0x60ff60, 14, 14); dunAnim.bubbles.push({ x: o.x, z: o.z, y: 1.2, c: 0x80ff80 }); },
  altar(q, o, rnd) { q(DM.stone, bx(2.2, 1, 1.1), 0, .5, 0, 0xa09a90); q(DM.stone, bx(2.4, .12, 1.3), 0, 1.06, 0, 0xb0aaa0); q(DM.cloth, bx(.7, .02, 1.32), 0, 1.13, 0, 0x6a0a0a); q(DM.cloth, bx(.7, .6, .02), 0, .85, .66, 0x6a0a0a);
    for (let k = 0; k < 5; k++) { const x = -.9 + k * .45, h = .15 + rnd() * .25; q(DM.bone, cy(.04, .04, h, 6), x, 1.12 + h / 2, -.35, 0xfff0d0); q(DM.glow, sph(.035, 5), x, 1.17 + h, -.35, 0xffc860); }
    if (o.bones) q(DM.bone, sph(.16, 8), 0, 1.3, 0); anchor(o.x, 1.8, o.z, 0xffc070, 5, 8); },
  candles(q, o, rnd) { for (let k = 0; k < 7; k++) { const x = rand(-.35, .35), z = rand(-.25, .25), h = .1 + rnd() * .35; q(DM.bone, cy(.04, .045, h, 6), x, h / 2, z, 0xfff0d0); q(DM.glow, sph(.035, 5), x, h + .05, z, 0xffd070); } anchor(o.x + Math.sin(o.ry) * .5, .9, o.z + Math.cos(o.ry) * .5, 0xffc870, 3, 6); },
  statue(q, o, rnd) { const c = shade(0xffffff, .7 + rnd() * .2); q(DM.stone, bx(1.1, .8, 1.1), 0, .4, 0, c); q(DM.stone, co(.55, 1.8, 8), 0, 1.7, 0, c); q(DM.stone, bx(.6, .7, .36), 0, 2.4, 0, c); q(DM.stone, sph(.22, 8), 0, 2.98, 0, c); q(DM.stone, co(.26, .45, 8), 0, 3.25, 0, shade(c, .8)); for (const s of [-1, 1]) q(DM.stone, bx(.16, .8, .16).rotateZ(s * .2), s * .38, 2.25, .12, c); q(DM.iron, bx(.08, 1.4, .03), 0, 1.6, .38); },
  throne(q) { q(DM.stone, bx(3.4, .4, 2.8), 0, .2, 0, 0x8a8278); q(DM.stone, bx(2.4, .25, 2), 0, .52, -.2, 0x8a8278); q(DM.wood, bx(1.2, .55, .9), 0, .92, -.3, 0x5a2a18); q(DM.wood, bx(1.3, 2.6, .22), 0, 2, -.8, 0x5a2a18); q(DM.cloth, bx(1, .1, .8), 0, 1.24, -.28, 0x7a0a10); q(DM.cloth, bx(.9, 1.6, .05), 0, 2, -.67, 0x7a0a10);
    for (const s of [-1, 1]) { q(DM.wood, bx(.18, .6, .9), s * .66, 1.3, -.3, 0x5a2a18); q(DM.gold, sph(.12, 8), s * .6, 3.38, -.8); } q(DM.gold, co(.16, .4, 6), 0, 3.5, -.8); },
  banner(q, o, rnd, r) { const c = [0x6a0a0a, 0x1a2a5a, 0x2a4a1a, 0x3a1a4a, 0x5a3a0a][Math.floor(rnd() * 5)], y = Math.min(r.ch - 2.6, 3.2); q(DM.cloth, bx(1.3, 3, .04), 0, y, .03, c); q(DM.cloth, co(.66, .5, 4).rotateY(Math.PI / 4).rotateZ(Math.PI).scale(1, 1, .06), 0, y - 1.75, .03, c); q(DM.gold, cy(.04, .04, 1.6, 6).rotateZ(Math.PI / 2), 0, y + 1.55, .08); q(DM.gold, bx(.32, .32, .03).rotateZ(Math.PI / 4), 0, y + .4, .07); },
  window(q, o, rnd, r) { const y = Math.min(r.ch - 2.8, 3.4), cols = [0xc02040, 0x3050d0, 0xd0a020, 0x20a060, 0x8030c0]; for (let i = 0; i < 3; i++) for (let j = 0; j < 6; j++) q(DM.glow, bx(.42, .42, .03), -.45 + i * .45, y - 1.15 + j * .45, .02, shade(cols[Math.floor(rnd() * 5)], .55)); q(DM.glow, cy(.68, .68, .03, 12, 1).rotateX(Math.PI / 2).scale(1, .5, 1), 0, y + 1.45, .02, shade(cols[Math.floor(rnd() * 5)], .55)); for (const s of [-1, 1]) q(DM.stone, bx(.2, 3.4, .25), s * .8, y, .05, 0x8a8278); anchor(o.x + Math.sin(o.ry) * 1.2, y, o.z + Math.cos(o.ry) * 1.2, 0xb070ff, 3, 8, .3); },
  pool(q, o) { add(DM.water, bx(o.w, .06, o.d).translate(o.x, .04, o.z)); add(DM.stone, bx(o.w + .8, .03, o.d + .8).translate(o.x, .015, o.z), 0x5a6a6a); },
  rubble(q, o, rnd) { for (let k = 0; k < 7; k++) q(DM.stone, bx(.3 + rnd() * .6, .2 + rnd() * .4, .3 + rnd() * .5).rotateY(rnd() * 3).rotateX(rnd() - .5), rand(-.7, .7), .15, rand(-.7, .7), shade(0xffffff, .6 + rnd() * .3)); },
  mushrooms(q, o, rnd) { const c = rnd() < .5 ? 0x30e0c0 : 0xa050ff; for (let k = 0; k < 6; k++) { const x = rand(-.6, .6), z = rand(-.6, .6), h = .1 + rnd() * .45; q(DM.bone, cy(.03, .045, h, 5), x, h / 2, z, 0xc0c8b0); q(DM.glow, sph(.08 + h * .25, 7).scale(1, .45, 1), x, h, z, shade(c, .7 + rnd() * .3)); } anchor(o.x, .7, o.z, c, 3.5, 7, .2); },
  roots(q, o, rnd) { for (let k = 0; k < 4; k++) q(DM.wood, cy(.04, .09, 1.6 + rnd() * 1.5, 5).rotateZ(Math.PI / 2 - .12).rotateY(rnd() * 3), rand(-.5, .5), .07, rand(-.5, .5), 0x4a3a28); },
  tree(q, o, rnd) { q(DM.wood, cy(.35, .6, 4.5, 8), 0, 2.25, 0, 0x5a4a3a); for (let k = 0; k < 5; k++) { const a = rnd() * TAU, l = 1.6 + rnd() * 1.8; q(DM.wood, cy(.06, .16, l, 5).rotateZ(.9 + rnd() * .4).rotateY(a), Math.cos(a) * l * .35, 3.2 + rnd() * 1.2, -Math.sin(a) * l * .35, 0x5a4a3a); } for (let k = 0; k < 5; k++) { const a = TAU * k / 5; q(DM.wood, cy(.08, .2, 1.6, 5).rotateZ(Math.PI / 2 - .3).rotateY(a), Math.cos(a) * .7, .2, -Math.sin(a) * .7, 0x4a3a2a); } },
  brazier(q, o) { for (let k = 0; k < 3; k++) { const a = TAU * k / 3; q(DM.iron, cy(.03, .03, 1, 4).rotateZ(Math.cos(a) * .2).rotateX(Math.sin(a) * .2), Math.cos(a) * .2, .5, Math.sin(a) * .2); } q(DM.iron, cy(.5, .25, .35, 10), 0, 1.05, 0); q(DM.glow, cy(.42, .42, .04, 10), 0, 1.2, 0, 0xff6010); flame(o.x, 1.18, o.z, .75, 0xff8a40, 13); },
  obelisk(q, o) { q(DM.stone, cy(.28, .55, 3.6, 4).rotateY(Math.PI / 4), 0, 1.8, 0, 0x403838); q(DM.stone, co(.28, .5, 4).rotateY(Math.PI / 4), 0, 3.85, 0, 0x403838); for (let k = 0; k < 4; k++) q(DM.glow, bx(.08, .25, .02), 0, 1 + k * .55, .43 - k * .04, 0xff2020); anchor(o.x, 2.2, o.z, 0xff3030, 3, 7); },
  chandelier(q, o, rnd, r) { const y = r.ch - 1.7; q(DM.iron, new THREE.TorusGeometry(1.1, .05, 5, 20).rotateX(Math.PI / 2), 0, y, 0); q(DM.iron, cy(.025, .025, r.ch - y, 4), 0, (r.ch + y) / 2, 0); for (let k = 0; k < 4; k++) q(DM.iron, cy(.02, .02, 1.3, 4).rotateZ(.95).rotateY(TAU * k / 4), 0, y + .45, 0); for (let k = 0; k < 8; k++) { const a = TAU * k / 8; q(DM.bone, cy(.04, .04, .22, 6), Math.cos(a) * 1.1, y + .13, Math.sin(a) * 1.1, 0xfff0d0); q(DM.glow, sph(.04, 5), Math.cos(a) * 1.1, y + .29, Math.sin(a) * 1.1, 0xffd070); } anchor(o.x, y - .3, o.z, 0xffc070, 12, 16); },
  carpet(q, o) { const g = new THREE.PlaneGeometry(o.w, o.l).rotateX(-Math.PI / 2).rotateY(Math.PI / 2), uv = g.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setY(i, uv.getY(i) * o.l / o.w / 2); q(DM.carpet, g, 0, .02, 0); },
  blood(q, o, rnd) { for (let k = 0; k < 3; k++) q(DM.cloth, cy(.2 + rnd() * .5, .2 + rnd() * .5, .01, 10).scale(1, 1, .5 + rnd()), rand(-.4, .4), .012 + k * .002, rand(-.4, .4), 0x2a0404); },
  straw(q, o, rnd) { q(DM.cloth, cy(.9, 1, .12, 9).scale(1, 1, .7), 0, .06, 0, 0x8a7a40); for (let k = 0; k < 8; k++) q(DM.cloth, bx(.02, .02, .5).rotateY(rnd() * 3), rand(-.7, .7), .13, rand(-.5, .5), 0xa89850); },
  pedestal(q, o) { q(DM.stone, cy(.5, .6, 1.1, 8), 0, .55, 0, 0xb0a898); q(DM.stone, cy(.6, .5, .15, 8), 0, 1.15, 0, 0xb0a898); q(DM.glow, new THREE.OctahedronGeometry(.25), 0, 1.65, 0, 0xc070ff); anchor(o.x, 1.8, o.z, 0xc070ff, 7, 10); },
  stalag(q, o, rnd, r) { q(DM.wall.cave, co(1.1, 2.5 + rnd() * 2, 7), 0, 1.6, 0, 0xa0a0a0); q(DM.wall.cave, co(.8, 2 + rnd() * 2, 7).rotateX(Math.PI), rand(-.3, .3), r.ch - 1.4, 0, 0x909090); },
  sigil() {}, // a live spell circle, added in buildRoom
  pillar(q, o, rnd, r) {
    const m = r.mats.wall, c = r.mats.wc;
    if (o.kind === 'broken') { q(m, cy(.7, .8, o.h, 12), 0, o.h / 2, 0, c); q(m, bx(1.7, .4, 1.7), 0, .2, 0, shade(c, .85)); PROPS.rubble(q, o, rnd); return; }
    const bone = o.kind === 'bone', cc = bone ? shade(0xe8dcc0, .9) : c;
    q(m, bx(1.8, .45, 1.8), 0, .22, 0, shade(cc, .8)); q(m, cy(.72, .8, r.ch - .9, 12), 0, r.ch / 2, 0, cc); q(m, bx(1.8, .45, 1.8), 0, r.ch - .22, 0, shade(cc, .8));
    if (bone) for (let k = 0; k < 10; k++) { const a = TAU * k / 10; q(DM.bone, sph(.12, 6), Math.cos(a) * .82, .6, Math.sin(a) * .82); }
  },
};
function buildRoom(r) {
  const T = THEMES[r.theme], rnd = rngOf(DUN.seed * 13 + r.i * 101 + 3), wall = DM.wall[T.wall], floor = DM.floor[T.floor];
  const wc = tintOf(T.tint, rnd), fc = tintOf(T.tint, rnd, -6), ch = r.ch;
  r.mats = { wall, wc };
  add(floor, bx(r.w, .5, r.d).translate(r.cx, -.25, r.cz), fc);
  add(wall, bx(r.w + 2, .5, r.d + 2).translate(r.cx, ch + .25, r.cz), shade(wc, .55));
  const sides = { n: [r.x0, r.x1, r.z0, 1], s: [r.x0, r.x1, r.z1, -1], w: [r.z0, r.z1, r.x0, 1], e: [r.z0, r.z1, r.x1, -1] };
  for (const s in sides) {
    const [a0, a1, line, inw] = sides[s], ns = s === 'n' || s === 's', A = d => ns ? d.x : d.z;
    const seg = (u0, u1, y0, y1, off, dep, mat, col) => { // a box against this wall: off is how far its back sits in from the wall line
      const p0 = line + inw * off, p1 = p0 + inw * dep, q0 = Math.min(p0, p1), q1 = Math.max(p0, p1);
      add(mat, ns ? bx(u1 - u0, y1 - y0, q1 - q0).translate((u0 + u1) / 2, (y0 + y1) / 2, (q0 + q1) / 2) : bx(q1 - q0, y1 - y0, u1 - u0).translate((q0 + q1) / 2, (y0 + y1) / 2, (u0 + u1) / 2), col);
    };
    const gaps = r.doors.filter(d => ns ? Math.abs(d.z - line) < .1 : Math.abs(d.x - line) < .1).map(d => [A(d) - d.hw, A(d) + d.hw]).sort((p, q) => p[0] - q[0]);
    let a = a0 - 1;
    for (const [g0, g1] of gaps) { // wall up to each doorway, a lintel over it, and a stone frame around it
      if (g0 > a) seg(a, g0, 0, ch, -1, 1, wall, wc);
      seg(g0, g1, HALL_H, ch, -1, 1, wall, wc);
      for (const e of [g0 - .55, g1]) seg(e, e + .55, 0, HALL_H + .5, -1.1, 1.35, DM.stone, shade(wc, .8));
      seg(g0, g1, HALL_H, HALL_H + .5, -1.1, 1.35, DM.stone, shade(wc, .8));
      a = g1;
    }
    seg(a, a1 + 1, 0, ch, -1, 1, wall, wc);
    // relief: a plinth along the foot of the wall, a cornice under the ceiling, pilasters, and torches
    const runs = []; let b = a0; for (const [g0, g1] of gaps) { if (g0 - .6 > b) runs.push([b, g0 - .6]); b = g1 + .6; } if (a1 > b) runs.push([b, a1]);
    for (const [u0, u1] of runs) { seg(u0, u1, 0, .45, 0, .22, wall, shade(wc, .7)); seg(u0, u1, ch - .4, ch, 0, .3, wall, shade(wc, .7)); }
    const len = a1 - a0, sp2 = len / Math.max(1, Math.round(len / 6.5)), ty = T.wallProps && ch > 5.5 ? 3.6 : 2.6;
    for (let k = 1, t = a0 + sp2; t < a1 - 1; t += sp2, k++) {
      if (gaps.some(([g0, g1]) => t > g0 - 1.6 && t < g1 + 1.6)) continue;
      if (T.pil) seg(t - .4, t + .4, 0, ch, 0, .28, wall, shade(wc, .85));
      if (k % 2 === 0 && !T.pil && !T.wallProps) continue;
      const off = T.pil ? .5 : .22, x = ns ? t : line + inw * off, z = ns ? line + inw * off : t, nx = ns ? 0 : inw, nz = ns ? inw : 0;
      add(DM.iron, bx(.14, .4, .14).translate(x, ty - .15, z)); add(DM.iron, cy(.13, .07, .16, 8).translate(x + nx * .08, ty + .08, z + nz * .08));
      flame(x + nx * .08, ty + .12, z + nz * .08, .34);
      anchor(x + nx * .7, ty + .3, z + nz * .7, T.torch, 16, 17);
    }
  }
  // ceiling: wooden beams or stone ribs across the short span
  const alongX = r.w >= r.d, span = alongX ? r.d : r.w, L = alongX ? r.w : r.d;
  if (T.beams) for (let t = -L / 2 + 3; t <= L / 2 - 3; t += 3.6) {
    const mat = T.beams === 'wood' ? DM.wood : wall, col = T.beams === 'wood' ? 0x6a4a30 : shade(wc, .75);
    add(mat, alongX ? bx(.4, .45, span).translate(r.cx + t, ch - .22, r.cz) : bx(span, .45, .4).translate(r.cx, ch - .22, r.cz + t), col);
  }
  for (const o of r.props) {
    if (o.k === 'sigil') { const c = makeCircle('sigil', o.c || 0xff2a2a); c.scale.setScalar(3.4); c.position.set(o.x, .05, o.z); c.userData.keep = 1; dunView.add(c); dunAnim.circles.push(c); anchor(o.x, 1, o.z, o.c || 0xff3030, 9, 12); continue; }
    PROPS[o.k](placer(o.x, o.z, o.ry), o, rnd, r);
  }
}
function buildHall(h, hk) {
  const rnd = rngOf(DUN.seed * 17 + hk * 31), wall = DM.wall[hk % 3 === 0 ? 'rubble' : DUN.floor % 2 ? 'ashlar' : 'brick'], floor = DM.floor[DUN.floor % 3 === 0 ? 'cobble' : 'flag'];
  const wc = tintOf([30, 12, 70], rnd), A = DUN.rooms[h.a], B = DUN.rooms[h.b], alongX = Math.abs(h.da.z - h.db.z) < .1 && Math.abs(h.da.x - h.db.x) > .1;
  const u0 = alongX ? h.da.x : h.da.z, u1 = alongX ? h.db.x : h.db.z, c = alongX ? (h.z0 + h.z1) / 2 : (h.x0 + h.x1) / 2, len = u1 - u0, mid = (u0 + u1) / 2;
  const box = (a0, a1, c0, c1, y0, y1, mat, col) => add(mat, alongX ? bx(a1 - a0, y1 - y0, c1 - c0).translate((a0 + a1) / 2, (y0 + y1) / 2, (c0 + c1) / 2) : bx(c1 - c0, y1 - y0, a1 - a0).translate((c0 + c1) / 2, (y0 + y1) / 2, (a0 + a1) / 2), col);
  const hw = HALL_W / 2;
  box(u0, u1, c - hw, c + hw, -.5, 0, floor, tintOf([30, 10, 62], rnd));
  box(u0, u1, c - hw - 1, c + hw + 1, HALL_H, HALL_H + .5, wall, shade(wc, .55));
  for (const s of [-1, 1]) box(u0, u1, s < 0 ? c - hw - 1 : c + hw, s < 0 ? c - hw : c + hw + 1, 0, HALL_H, wall, wc);
  for (let t = u0 + 2, k = 0; t < u1 - 1.5; t += 3.2, k++) { // arched ribs, with a torch on every other one
    for (const s of [-1, 1]) box(t - .25, t + .25, s < 0 ? c - hw : c + hw - .3, s < 0 ? c - hw + .3 : c + hw, 0, HALL_H, wall, shade(wc, .8));
    box(t - .25, t + .25, c - hw, c + hw, HALL_H - .35, HALL_H, wall, shade(wc, .8));
    if (k % 2 === 0) { const s = k % 4 === 0 ? -1 : 1, cz = c + s * (hw - .45), x = alongX ? t + .6 : cz, z = alongX ? cz : t + .6; flame(x, 2.55, z, .32); add(DM.iron, bx(.14, .4, .14).translate(x, 2.3, z)); anchor(alongX ? x : c, 2.7, alongX ? c : z, 0xffa050, 14, 15); }
    if (rnd() < .15) { const s = rnd() < .5 ? -1 : 1, q = alongX ? placer(t + 1.6, c + s * (hw - .7), 0) : placer(c + s * (hw - .7), t + 1.6, 0); PROPS[rnd() < .5 ? 'rubble' : 'bones'](q, {}, rnd); }
  }
  if (len < 4) anchor(alongX ? mid : c, 2.7, alongX ? c : mid, 0xffa050, 5, 10);
}
// the stairwell (identical on both floors it joins). base: the height of its top. arrive: the end you came down into
function buildStairwell(P, base, arrive) {
  const sb = (u0, u1, v0, v1, y0, y1, mat, col) => { const a = poseAt(P, u0, v0), b = poseAt(P, u1, v1), x0 = Math.min(a.x, b.x), x1 = Math.max(a.x, b.x), z0 = Math.min(a.z, b.z), z1 = Math.max(a.z, b.z); add(mat, bx(x1 - x0, y1 - y0, z1 - z0).translate((x0 + x1) / 2, base + (y0 + y1) / 2, (z0 + z1) / 2), col); };
  const pt = (u, v, y) => { const p = poseAt(P, u, v); return [p.x, base + y, p.z]; };
  const wall = DM.wall.ashlar, flo = DM.floor.flag, wc = 0xb0a898, fc = 0x9a9088, D = STAIR_D, lo = -D - 1, hi = 5.2, e2 = arrive ? 22 : 12;
  sb(-1, 3, -2, 2, -.6, 0, flo, fc); // top
  for (let k = 0; k < 12; k++) { const u = 3 + k * 8 / 12, y = -(k + .5) * SD2 / 12; sb(u, u + 8 / 12, -2, 2, y - 1.4, y, flo, fc); } // flight A
  sb(11, 16, -2, 7, -SD2 - 1, -SD2, flo, fc); // landing
  for (let k = 0; k < 12; k++) { const u = 11 - (k + 1) * 7 / 12, y = -SD2 - (k + .5) * SD2 / 12; sb(u, u + 7 / 12, 3, 7, y - 1.4, y, flo, fc); } // flight B
  sb(1, 4, 3, 12, -D - .6, -D, flo, fc); sb(4, e2, 8, 12, -D - .6, -D, flo, fc); // bottom landing, E1 and E2
  sb(0, 17, -3, -2, lo, hi, wall, wc); sb(16, 17, -3, 8, lo, hi, wall, wc); sb(1, 11, 2, 3, lo, hi, wall, wc); // outer wall, landing end, divider
  sb(4, e2, 7, 8, lo, hi, wall, wc); sb(1, e2, 12, 13, lo, -D + HALL_H + .5, wall, wc); sb(1, 4, 7, 8, -D + HALL_H, hi, wall, wc); // walls of B / E1 / E2
  sb(.3, 1.02, 2, 13, lo, hi, wall, wc);
  sb(-1, 17, -3, 8, 4.6, hi, wall, shade(wc, .5)); sb(1, e2, 7, 13, -D + HALL_H, -D + HALL_H + .4, wall, shade(wc, .5)); // ceilings
  if (arrive) { sb(.3, 1.02, -3, 2, lo, hi, wall, wc); sb(1.02, 1.2, -1.5, 1.5, 0, 3.4, DM.wood, 0x6a4a30); for (const y of [.6, 1.7, 2.8]) sb(1.2, 1.26, -1.5, 1.5, y, y + .12, DM.iron); } // the door you came through, barred behind you
  else sb(12, 13, 8, 12, lo, 0, wall, wc); // E2 ends just past the corner on the floor above
  // a sigil on the landing and torches all the way down
  const g = pt(13.5, 2.5, -SD2 + .02), s = makeCircle('sigil', 0xffb040); s.scale.setScalar(1.6); s.position.set(...g); s.userData.keep = 1; dunView.add(s); dunAnim.circles.push(s);
  for (const [u, v, y, nu, nv] of [[15.7, 2.5, -SD2 + 2.4, -1, 0], [7, -1.7, -1.5 + 2.4, 0, 1], [8, 6.7, -4.3 + 2.4, 0, -1], [2.5, 11.7, -D + 2.4, 0, -1], [9, 11.7, -D + 2.4, 0, -1], [18, 11.7, -D + 2.4, 0, -1]]) {
    if (u > e2 - 1) continue;
    const [x, y2, z] = pt(u, v, y), [dx, dz] = rot4(P.r, nu, nv);
    flame(x, y2, z, .34); add(DM.iron, bx(.14, .4, .14).translate(x, y2 - .25, z)); anchor(x + dx * .7, y2 + .3, z + dz * .7, 0xffa050, 14, 15);
  }
  if (!arrive) { // the portcullis at the top: down until this floor's stair chamber is cleared
    const gg = new THREE.Group(), [x, , z] = pt(.5, 0, 0), alongZ = P.r % 2 === 0;
    for (let k = 0; k < 11; k++) { const b = new THREE.Mesh(new THREE.BoxGeometry(.1, 4.6, .1), DM.iron); b.position.set(-1.9 + k * .38, 2.3, 0); gg.add(b); }
    for (const y of [1.2, 2.6, 4]) { const b = new THREE.Mesh(new THREE.BoxGeometry(4, .1, .12), DM.iron); b.position.y = y; gg.add(b); }
    gg.position.set(x, base, z); if (alongZ) gg.rotation.y = Math.PI / 2; dunView.add(gg); dunAnim.gate = gg;
  }
}
function buildDungeonView() {
  dunMats();
  for (const o of [...dunView.children]) { if (!o.userData.keep) o.traverse(c => c.geometry?.dispose()); o.removeFromParent(); }
  Object.assign(dunAnim, { flames: [], anchors: [], gate: null, circles: [], bubbles: [] });
  for (const r of DUN.rooms) buildRoom(r);
  DUN.halls.forEach(buildHall);
  buildStairwell(DUN.arr, STAIR_D, true);
  buildStairwell(DUN.depW, 0, false);
  flush();
  dunShown = DUN.seed;
}
// per frame on both machines: rebuild when the floor changes, lift the stair gate, flicker torches, move the light pool
function updateDungeonView(dt, t) {
  if (S.mode !== 'dungeon' || !DUN) return;
  if (dunShown !== DUN.seed) buildDungeonView();
  const open = !!dunState()?.stairs, cx = camera.position.x, cy2 = camera.position.y, cz = camera.position.z, my = nodeAt(cx, cz);
  if (dunAnim.gate) { const g = dunAnim.gate, y0 = dunAnim.gate.userData.y0 ??= g.position.y; g.position.y += (y0 + (open ? 4.4 : 0) - g.position.y) * Math.min(1, dt * 1.5); }
  for (const f of dunAnim.flames) {
    const d = Math.abs(f.position.x - cx) + Math.abs(f.position.z - cz); f.visible = d < 70;
    if (d < 24 && Math.random() < .1) emit(f.position.x, f.position.y + f.scale.x * .9, f.position.z, rand(-.2, .2), rand(1, 2), rand(-.2, .2), Math.random() < .5 ? 0xff9a3a : 0xffd27a, rand(.04, .09), rand(.5, 1), -.3, .3);
  }
  for (const b of dunAnim.bubbles) if (Math.random() < .25 && Math.abs(b.x - cx) + Math.abs(b.z - cz) < 30) emit(b.x + rand(-.4, .4), b.y, b.z + rand(-.4, .4), 0, rand(.3, .8), 0, b.c, rand(.06, .12), rand(.6, 1.2), -.2, .5);
  for (const c of dunAnim.circles) spinCircle(c, dt, .5);
  // the light pool: the nearest anchors get a real light, fading out before they hand over, so nothing pops
  const A = dunAnim.anchors;
  for (const a of A) a.k = Math.hypot(a.x - cx, (a.y - cy2) * 1.5, a.z - cz) + (a.node === my ? 0 : 9);
  A.sort((p, q) => p.k - q.k);
  const cut = A[dunLights.length]?.k ?? 1e9;
  dunLights.forEach((l, i) => {
    const a = A[i]; if (!a) { l.intensity = 0; return; }
    l.position.set(a.x, a.y, a.z); l.color.setHex(a.c); l.distance = a.d;
    l.intensity = a.i * clamp((cut - a.k) / 4, 0, 1) * (1 + (Math.sin(t * 9 + a.ph) * .08 + Math.sin(t * 23 + a.ph * 2) * .05) * a.f);
  });
}
