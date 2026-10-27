// Mage Arena simulation. The host runs all of it; the guest only runs stepMove/stepCast(predict) for itself.
// Data tables, players, the 5-slot move system, projectiles, persistent entities (zones, walls, turrets, summons),
// combat (statuses, crowd control, reactions, crits, poise), enemy AI with telegraphed attacks, and waves.
'use strict';

// ===================== data =====================
const EL = ELEMENTS;
const ELIST = Object.keys(EL);
const MOVE = {};
for (const el of ELIST) EL[el].moves.forEach((m, i) => { Object.assign(m, { key: el + '.' + i, el, slot: i }); m.mode ??= 'tap'; MOVE[m.key] = m; });

// status on an enemy (from element A) hit by a different element B -> reaction. Named pairs get their own effect,
// everything else is "<A adjective> <B reaction>" with B's reaction kind, so all 380 ordered pairs do something.
const NAMED = {
  'fire>frost': { name: 'STEAM', kind: 'steam', color: 0xffffff },
  'frost>storm': { name: 'SHATTER', kind: 'shatter', color: 0x7fe6ff },
  'storm>fire': { name: 'OVERLOAD', kind: 'overload', color: 0xffc040 },
  'water>storm': { name: 'CONDUCT', kind: 'conduct', color: 0x9fd8ff },
  'water>frost': { name: 'FLASH FREEZE', kind: 'freeze', color: 0xbff4ff },
  'fire>wind': { name: 'FIRESTORM', kind: 'firestorm', color: 0xff8a2a },
  'nature>fire': { name: 'WILDFIRE', kind: 'spread', color: 0xffa040 },
  'frost>magma': { name: 'MELTDOWN', kind: 'shatter', color: 0xff6a3a },
  'magma>water': { name: 'OBSIDIAN', kind: 'stun', color: 0x6a5a8a },
  'venom>fire': { name: 'TOXIC BLAZE', kind: 'blast', color: 0xb0ff40 },
  'light>shadow': { name: 'TWILIGHT', kind: 'stun', color: 0xb070ff },
  'shadow>light': { name: 'DAWNBREAK', kind: 'blast', color: 0xfff0b0 },
  'earth>water': { name: 'MUDSLIDE', kind: 'launch', color: 0x8a6a40 },
  'blood>venom': { name: 'SEPSIS', kind: 'spread', color: 0x90ff30 },
  'gravity>cosmic': { name: 'BIG BANG', kind: 'overload', color: 0xe0d0ff },
  'chrono>sonic': { name: 'TIME QUAKE', kind: 'echo', color: 0xffd070 },
};
function reactionOf(stEl, byEl) {
  const n = NAMED[stEl + '>' + byEl];
  return n ? { ...n } : { name: `${EL[stEl].adj} ${EL[byEl].react.name}`, kind: EL[byEl].react.kind, color: EL[byEl].color };
}

const ET = {
  grunt:    { hp: 40,   spd: 3.8, r: .5,  h: 1.8, dmg: 10, reach: 1.9, cost: 1, from: 1, kb: 1,   poise: 30,  atk: 'swipe',  wind: .5,  cd: 1.3 },
  runner:   { hp: 22,   spd: 7,   r: .45, h: 1.0, dmg: 8,  reach: 3.2, cost: 1, from: 2, kb: 1.4, poise: 15,  atk: 'lunge',  wind: .38, cd: 1.5 },
  shooter:  { hp: 34,   spd: 3,   r: .6,  h: 2.3, dmg: 9,  reach: 26,  cost: 3, from: 3, kb: 1,   poise: 25,  atk: 'orb',    wind: .65, cd: 2.2, ranged: 1, keep: [9, 15] },
  bomber:   { hp: 24,   spd: 6.2, r: .5,  h: 1.25, dmg: 26, reach: 2.4, cost: 2, from: 3, kb: 1.2, poise: 10, atk: 'fuse',   wind: .95, cd: 9 },
  splitter: { hp: 70,   spd: 2.6, r: .65, h: 1.0, dmg: 12, reach: 2.0, cost: 2, from: 4, kb: .8,  poise: 40,  atk: 'slam',   wind: .55, cd: 1.4, split: 1 },
  brute:    { hp: 190,  spd: 2.3, r: 1.1, h: 2.7, dmg: 24, reach: 3.4, cost: 5, from: 5, kb: .25, poise: 130, atk: 'smash',  wind: .95, cd: 2.1 },
  knight:   { hp: 120,  spd: 3.3, r: .6,  h: 2.1, dmg: 17, reach: 3.6, cost: 4, from: 6, kb: .4,  poise: 80,  atk: 'thrust', wind: .6,  cd: 1.7, shield: 1 },
  shaman:   { hp: 60,   spd: 2.9, r: .55, h: 2.1, dmg: 0,  reach: 9,   cost: 4, from: 7, kb: 1,   poise: 30,  atk: 'mend',   wind: 1.1, cd: 4,   ranged: 1, keep: [12, 18] },
  boss:     { hp: 1500, spd: 2.1, r: 2.2, h: 5.6, dmg: 30, reach: 5,   cost: 0, from: 99, kb: .04, poise: 650, atk: 'smash', wind: 1.05, cd: 2.2, boss: 1 },
};
const waveBudget = w => 10 + w * 6;
// ===================== state =====================
const S = { phase: 'lobby', mode: 'arena', actor: null, t: 0, wave: 0, players: {}, enemies: [], shots: [], ents: [], rings: [], timers: [], events: [], nid: 1,
  budget: 0, bossLeft: 0, eliteLeft: 0, spawnT: 0, restT: 0, hitstop: 0, slowmo: 0, tstop: 0, mod: null };
const ev = e => S.events.push(e);
function later(t, fn) { S.timers.push({ t, fn, a: S.actor }); } // remembers who scheduled it (see alive)
function stepTimers(dt) {
  for (const tm of S.timers) tm.t -= dt;
  const due = S.timers.filter(tm => tm.t <= 0);
  S.timers = S.timers.filter(tm => tm.t > 0);
  for (const tm of due) { S.actor = tm.a; tm.fn(); }
  S.actor = null;
}

// mid-game element menu: replace the active loadout with `el` (picking the other loadout just swaps to it)
function setElement(p, el) {
  if (!EL[el] || !p || p.down) return;
  if (el !== p.el && el !== p.el2) {
    if (p.el2 && p.cur === p.el2) p.el2 = el; else p.el = el;
    if (p.cds[p.cur]) p.cds[el] = p.cds[p.cur].slice(); // the new element inherits the cooldowns: switching is no free reset
  }
  p.cur = el; p.ch = null; p.chg = null;
}
// permanent talents from progression (Arena and Dungeon only): Vitality adds 6% max HP a rank
function withTalents(p, tal) { p.tal = S.mode === 'duel' ? {} : { ...tal }; p.max = p.hp = Math.round(100 * (1 + .06 * (p.tal.vit || 0))); return p; }
function newPlayer(id, el, el2 = null) {
  return { id, el, el2, cur: el, x: id === 'h' ? -2 : 2, y: 0, z: 8, vy: 0, yaw: 0, pitch: 0, hp: 100, max: 100, down: false, rev: 0,
    cds: {}, ult: 0, bf: {}, bd: {}, dcd: 0, dashT: 0, dx: 0, dz: 0, dashAt: -9, jumpN: 0, dashN: 0, swapN: 0, dashes: 0, novaN: 0,
    casts: 0, jumps: 0, up: {}, inp: { yaw: 0, pitch: 0, k: [] }, prevK: [], ch: null, chT: 0, chg: null, mo: null,
    hpHist: [], combo: 0, comboT: 0, regenT: 0, stats: { kills: 0, dmg: 0, combos: 0, dodges: 0, best: 0 } };
}
const players = () => Object.values(S.players);
const mate = p => S.mode === 'duel' ? null : players().find(q => q !== p); // no partner heals for your duel opponent
const own = n => S.players[n.own];
function stats(p) {
  const n = k => p.up[k] || 0, bf = p.bf || {}, el = p.cur || p.el, tl = k => p.tal?.[k] || 0; // tl: permanent talents (empty in Duels)
  const comboB = 1 + Math.min(.3, Math.floor((p.combo || 0) / 10) * .05);
  const lowHp = el === 'blood' ? 1 + Math.max(0, 1 - p.hp / p.max) * .5 : 1;
  return {
    cdMul: (1 - .04 * tl('haste')) * .85 ** n('swift') * (bf.pact > 0 ? .8 : 1) * (el === 'chrono' ? .82 : 1) * (bf.eclipse > 0 ? .7 : 1),
    skillCd: .8 ** n('quick'),
    dmgMul: (1 + .04 * tl('power')) * (1 + .2 * n('potency')) * (bf.pact > 0 ? 1.6 : 1) * comboB * lowHp * elementPower(p, el),
    speed: 7.5 * (1 + .03 * tl('swift')) * (1 + .12 * n('fleet')) * (bf.tempest > 0 ? 1.6 : 1) * (bf.veil > 0 ? 1.3 : 1) * (bf.phase > 0 ? 1.3 : 1) * (bf.haste > 0 ? 1.35 : 1) * (el === 'wind' ? 1.15 : 1),
    aoe: (1 + .25 * n('wide')) * (el === 'explosion' ? 1.2 : 1),
    dur: 1 + .5 * n('linger'), multi: 1 + n('twin'), chain: 2 + n('twin'), pierce: n('pierce'), bounce: n('ricochet'),
    steal: .04 * n('siphon') + (el === 'blood' ? .06 : 0) + (bf.eclipse > 0 ? .25 : 0),
    combo: 1 + .4 * n('combo'), dashCd: 1.2 * .6 ** n('blink'), detonate: n('detonate'), storm: n('storm'), bond: n('bond'),
    over: n('over') > 0, nova: n('nova'), ultMul: (1 + .35 * n('surge')) * (1 + .08 * tl('focus')), echo: n('echo') * .25,
    dr: (el === 'earth' ? .85 : 1) * (bf.molten > 0 ? .6 : 1) * (bf.quake > 0 ? .5 : 1),
  };
}
// resources some elements build up: Plasma's Heat, Soul's Souls, Arcane's charges
function elementPower(p, el) {
  const bd = p.bd || {};
  return el === 'plasma' ? 1 + (bd.heat || 0) / 200 : el === 'soul' ? 1 + .04 * (bd.souls || 0) : el === 'arcane' ? 1 + .08 * (bd.arc || 0) : 1;
}
function bondMul(p) { if (!stats(p).bond) return 1; const m = mate(p); return m && !m.down && Math.hypot(m.x - p.x, m.z - p.z) < 8 ? 1.15 : 1; }
const buff = (p, k, t) => { p.bf[k] = Math.max(p.bf[k] || 0, t); };
function heal(p, n) {
  if (!p || p.down || n <= 0) return;
  const before = p.hp; p.hp = Math.min(p.max, p.hp + n);
  if (p.hp - before >= 4) ev({ k: 'heal', id: p.id, n: Math.round(p.hp - before) });
}
const addUlt = (p, a) => { if (p) p.ult = Math.min(1, p.ult + a * stats(p).ultMul); };

// ===================== geometry helpers =====================
function solids() { const out = PILLARS.slice(); for (const n of S.ents) if (n.solid) out.push(...n.solid); return out; }
// the current map's shape: arena and duel are floating discs of radius MAP.r (in a duel you can go off the edge),
// the dungeon is a set of walkable rectangles: the rooms, plus the corridors of rooms already cleared
// (monsters use MAP.erects, which leaves out the stairs)
const MAP = { r: ARENA_R, rects: null, erects: null };
const inRects = (x, z, pad = 0, rs = MAP.rects) => rs.some(q => x > q.x0 + pad && x < q.x1 - pad && z > q.z0 + pad && z < q.z1 - pad);
function confine(o, pad = 0) {
  const rs = (o.type && MAP.erects) || MAP.rects;
  if (rs) {
    if (inRects(o.x, o.z, pad, rs)) return o;
    let bx = o.x, bz = o.z, bd = 1e9;
    for (const q of rs) { const x = clamp(o.x, q.x0 + pad, q.x1 - pad), z = clamp(o.z, q.z0 + pad, q.z1 - pad), d = (x - o.x) ** 2 + (z - o.z) ** 2; if (d < bd) { bd = d; bx = x; bz = z; } }
    o.x = bx; o.z = bz; return o;
  }
  const d = Math.hypot(o.x, o.z), m = MAP.r - pad; if (d > m) { o.x *= m / d; o.z *= m / d; } return o;
}
const offMap = (x, z, pad = 0) => MAP.rects ? !inRects(x, z, -pad) : Math.hypot(x, z) > MAP.r + pad;
function collide(o, r, sol = solids()) {
  if (S.mode !== 'duel') confine(o, r);
  for (const c of sol) { const dx = o.x - c.x, dz = o.z - c.z, dd = Math.hypot(dx, dz), m = r + c.r; if (dd < m && dd > 0) { o.x = c.x + dx / dd * m; o.z = c.z + dz / dd * m; } }
}
const clampArena = (v, pad = .5) => confine(v, pad);
// a laser from o along d, bouncing off pillars, the dungeon's walls and the floor; returns its corner points.
// Only uses the map (not walls that moves raise), so host and guest draw the same path.
function laserPath(o, d, len, bounces) {
  const pts = [o.clone()], p = o.clone(), v = d.clone().normalize();
  let left = len;
  for (let b = 0; b <= bounces && left > .05; b++) {
    let t = left, n = null;
    if (v.y < -1e-4 && -p.y / v.y < t) { t = -p.y / v.y; n = V(0, 1, 0); }
    const a = v.x * v.x + v.z * v.z;
    if (a > 1e-6) for (const c of PILLARS) {
      const fx = p.x - c.x, fz = p.z - c.z, bq = fx * v.x + fz * v.z, cq = fx * fx + fz * fz - c.r * c.r, disc = bq * bq - a * cq;
      if (cq < 0 || disc < 0) continue;
      const tc = (-bq - Math.sqrt(disc)) / a;
      if (tc > 1e-3 && tc < t) { t = tc; const hx = fx + v.x * tc, hz = fz + v.z * tc, L = Math.hypot(hx, hz); n = V(hx / L, 0, hz / L); }
    }
    if (MAP.rects && a > 1e-6) { // dungeon: march to the first wall, then bounce off the side it crossed
      for (let s = .25; s < t; s += .25) {
        const x = p.x + v.x * s, z = p.z + v.z * s;
        if (inRects(x, z)) continue;
        const px = p.x + v.x * (s - .25), pz = p.z + v.z * (s - .25);
        t = s - .25; n = inRects(x, pz) ? V(0, 0, -Math.sign(v.z)) : inRects(px, z) ? V(-Math.sign(v.x), 0, 0) : V(-v.x, 0, -v.z).normalize();
        break;
      }
    }
    p.addScaledVector(v, t); pts.push(p.clone()); left -= t;
    if (!n) break;
    v.reflect(n);
  }
  return pts;
}
const eyeOf = p => V(p.x, 1.65 + p.y, p.z);
const aimOf = p => { const c = Math.cos(p.pitch); return V(-Math.sin(p.yaw) * c, Math.sin(p.pitch), -Math.cos(p.yaw) * c); };
const flatAim = p => V(-Math.sin(p.yaw), 0, -Math.cos(p.yaw));
const handOf = p => eyeOf(p).addScaledVector(aimOf(p), .6).add(V(-Math.cos(p.yaw) * .22, -.18, Math.sin(p.yaw) * .22));
const castAim = p => { const o = handOf(p); return { o, d: eyeOf(p).addScaledVector(aimOf(p), 40).sub(o).normalize() }; };
// where the crosshair meets the floor (clamped to `max` metres and the island)
function groundAt(p, max = 20) {
  const e = eyeOf(p), d = aimOf(p), t = Math.min(max, d.y < -.03 ? -e.y / d.y : max);
  const q = e.addScaledVector(d, t); q.y = 0;
  return clampArena(q, .6);
}
const center = e => V(e.x, e.y + ET[e.type].h * e.sc * .55, e.z);
// S.actor: the player whose move is running right now; their own duel stand-in is invisible to their moves
const alive = e => !e.dead && e.rise <= 0 && !e.fall && !(e.pid && e.pid === S.actor);
const touches = (e, x, y, z, pad) => { const t = ET[e.type], r = t.r * e.sc + pad; return (x - e.x) ** 2 + (z - e.z) ** 2 < r * r && y > e.y - pad && y < e.y + t.h * e.sc + pad; };
function enemiesNear(x, z, r, skip) {
  return S.enemies.filter(e => alive(e) && !(skip && skip.includes(e.id)) && Math.hypot(e.x - x, e.z - z) < r + ET[e.type].r * e.sc);
}
function nearest(x, z, maxD, skip = []) {
  let b = null, bd = maxD;
  for (const e of S.enemies) { if (!alive(e) || skip.includes(e.id)) continue; const d = Math.hypot(e.x - x, e.z - z); if (d < bd) { bd = d; b = e; } }
  return b;
}
// enemies along a ray, sorted by distance
function rayHits(o, d, len, rad = .45) {
  const out = [];
  for (const e of S.enemies) {
    if (!alive(e)) continue;
    const t = center(e).sub(o).dot(d);
    if (t < 0 || t > len) continue;
    const q = o.clone().addScaledVector(d, t);
    if (touches(e, q.x, q.y, q.z, rad)) out.push({ e, t, q });
  }
  return out.sort((a, b) => a.t - b.t);
}
// enemies inside a horizontal cone from the player's eye along their aim
function coneHits(p, range, deg) {
  const f = flatAim(p), c = Math.cos(deg / 2 * Math.PI / 180);
  return S.enemies.filter(e => {
    if (!alive(e)) return false;
    const dx = e.x - p.x, dz = e.z - p.z, d = Math.hypot(dx, dz), r = ET[e.type].r * e.sc;
    return d < range + r && (d < r + .5 || (dx * f.x + dz * f.z) / d > c);
  });
}

// ===================== combat =====================
const HARD = new Set(['stun', 'freeze', 'bubble', 'lift', 'stasis', 'encase']);
function cc(e, type, t, p) {
  if (!e || e.dead) return false;
  const tp = ET[e.type];
  if (tp.boss) { if (['bubble', 'lift', 'stasis', 'encase', 'fear', 'charm', 'poly'].includes(type)) return false; t *= .35; }
  else if (e.elite) t *= .6;
  if (e.pid && (type === 'charm' || type === 'poly')) { type = 'stun'; t = Math.min(t, 1.5); } // a duel wizard is only dazed
  t *= p ? stats(p).dur ** .5 : 1;
  if (e.cc && e.cc.t > t && e.cc.type === type) return false;
  if (e.cc?.type === 'stasis') return false;
  e.cc = { type, t, max: t, src: p?.id };
  if (HARD.has(type) || ['fear', 'blind', 'charm', 'poly'].includes(type)) e.atk = null;
  if (type === 'stasis') e.stored = 0;
  if (type === 'bubble' || type === 'lift') { e.vy = 0; e.kx = e.kz = 0; }
  return true;
}
function ccEnd(e) {
  const c = e.cc; e.cc = null;
  if (c.type === 'stasis' && e.stored > 0) { const p = S.players[c.src]; damage(e, e.stored * 1.3, 'chrono', p, { raw: true }); ev({ k: 'fx', m: 'chrono.1', f: 'release', x: r2(e.x), y: r2(e.y + 1), z: r2(e.z) }); }
  if (c.type === 'bubble') { e.vy = -2; ev({ k: 'fx', m: 'water.2', f: 'pop', x: r2(e.x), y: r2(e.y + 1), z: r2(e.z) }); }
  if (c.type === 'lift') e.vy = -24;
}
function launch(e, vy) { if (!e || e.dead || ET[e.type].boss) return; if (e.cc && ['bubble', 'lift', 'stasis'].includes(e.cc.type)) return; e.vy = Math.max(e.vy, vy * (ET[e.type].kb > .3 ? 1 : .5)); e.y = Math.max(e.y, .05); e.atk = null; }
function pull(e, x, z, k) { const dx = x - e.x, dz = z - e.z, d = Math.hypot(dx, dz) || 1, t = ET[e.type]; e.kx += dx / d * k * t.kb; e.kz += dz / d * k * t.kb; }
function push(e, x, z, k) { pull(e, x, z, -k); }

function applyStatus(e, el, p, mul = 1) {
  const sd = EL[el].st || {}, had = e.st[el] > 0;
  e.st[el] = Math.max(e.st[el] || 0, 3 * (p ? stats(p).dur : 1) * mul);
  if (p) e.src[el] = p.id;
  e.stk[el] = had ? Math.min(sd.stacks || 1, (e.stk[el] || 1) + 1) : 1;
  EL[el].onStatus?.(e, p, e.stk[el]);
}
function statusMods(e) {
  const m = { slow: 0, vuln: 0, kb: 1, weak: 0 };
  for (const k in e.st) {
    if (!(e.st[k] > 0)) continue;
    const s = EL[k].st; if (!s) continue;
    m.slow = Math.max(m.slow, s.slow || 0); m.vuln += (s.vuln || 0) * (s.vulnStacks ? e.stk[k] || 1 : 1);
    m.kb *= s.kb || 1; m.weak = Math.max(m.weak, s.weak || 0);
  }
  return m;
}
// a status already on the enemy, hit by a different element -> reaction (the status is consumed)
function react(stEl, byEl, e, p) {
  const R = reactionOf(stEl, byEl), st = p ? stats(p) : { combo: 1, aoe: 1, dmgMul: 1 }, m = st.combo * st.dmgMul, A = st.aoe;
  const c = center(e);
  ev({ k: 'combo', name: R.name, kind: R.kind, a: stEl, b: byEl, color: R.color, x: r2(c.x), y: r2(c.y), z: r2(c.z) });
  S.hitstop = Math.max(S.hitstop, .07);
  addUlt(p, .04); if (p) p.stats.combos++;
  const near = r => enemiesNear(e.x, e.z, r * A);
  switch (R.kind) {
    case 'steam': aoe(e.x, e.z, 4.2 * A, 36 * m, byEl, p); break;
    case 'shatter': damage(e, 62 * m, byEl, p); aoe(e.x, e.z, 3.2 * A, 22 * m, byEl, p, e.id); break;
    case 'overload': aoe(e.x, e.z, 5 * A, 32 * m, byEl, p, -1, 16); break;
    case 'conduct': {
      const hits = [e, ...enemiesNear(e.x, e.z, 12).filter(o => o !== e && o.st.water > 0)].slice(0, 8);
      ev({ k: 'bolt', el: 'storm', pts: hits.map(o => { const q = center(o); return [q.x, q.y, q.z].map(r2); }) });
      for (const o of hits) damage(o, 30 * m, byEl, p);
      break;
    }
    case 'freeze': for (const o of near(4.5)) { cc(o, 'freeze', 2.2, p); damage(o, 18 * m, byEl, p); } break;
    case 'firestorm': aoe(e.x, e.z, 6 * A, 34 * m, 'fire', p, -1, 6); for (const o of near(6)) applyStatus(o, 'fire', p); break;
    case 'blast': aoe(e.x, e.z, 3.8 * A, 32 * m, byEl, p, -1, 9); break;
    case 'chain': {
      const hits = [e]; while (hits.length < 5) { const n = nearest(hits[hits.length - 1].x, hits[hits.length - 1].z, 8, hits.map(h => h.id)); if (!n) break; hits.push(n); }
      ev({ k: 'bolt', el: byEl, pts: hits.map(o => { const q = center(o); return [q.x, q.y, q.z].map(r2); }) });
      for (const o of hits) damage(o, 26 * m, byEl, p);
      break;
    }
    case 'pull': for (const o of near(7)) { if (o !== e) pull(o, e.x, e.z, 14); damage(o, 22 * m, byEl, p); } break;
    case 'launch': for (const o of near(4)) { launch(o, 11); damage(o, 26 * m, byEl, p); } break;
    case 'heal': for (const q of players()) heal(q, 12); damage(e, 40 * m, byEl, p); break;
    case 'spread': for (const o of near(6)) { applyStatus(o, stEl, p); damage(o, 20 * m, byEl, p); } break;
    case 'drain': damage(e, 46 * m, byEl, p); heal(p, 15); break;
    case 'echo': damage(e, 30 * m, byEl, p); later(1, () => { if (!e.dead) { damage(e, 36 * m, byEl, p); ev({ k: 'fx', m: 'chrono.0', f: 'echo', x: r2(e.x), y: r2(e.y + 1), z: r2(e.z) }); } }); break;
    case 'stun': for (const o of near(4.5)) { cc(o, 'stun', 1.6, p); damage(o, 20 * m, byEl, p); } break;
    default: aoe(e.x, e.z, 3.5 * A, 28 * m, byEl, p);
  }
}

// o: { crit, src:{x,z}, aoe, noStatus, noCombo, poise }
function hitEnemy(e, el, amount, p, kx = 0, kz = 0, kb = 3, o = {}) {
  if (!e || e.dead) return 0;
  const t = ET[e.type];
  if (t.shield && !o.aoe && !(p && (p.cur === 'steel') && (e.stk.steel || 0) >= 3) && !(e.cc && HARD.has(e.cc.type))) {
    const sx = o.src ? o.src.x : p ? p.x : e.x, sz = o.src ? o.src.z : p ? p.z : e.z, dx = sx - e.x, dz = sz - e.z, d = Math.hypot(dx, dz) || 1;
    if ((dx * Math.sin(e.yaw) + dz * Math.cos(e.yaw)) / d > .45) {
      ev({ k: 'block', x: r2(e.x + Math.sin(e.yaw) * .7), y: r2(e.y + 1.2), z: r2(e.z + Math.cos(e.yaw) * .7) });
      return damage(e, amount * .15, el, p, { blocked: true });
    }
  }
  if (!o.noCombo) {
    const other = Object.keys(e.st).find(k => e.st[k] > 0 && k !== el);
    if (other) { delete e.st[other]; delete e.stk[other]; react(other, el, e, p); if (e.dead) return 0; }
  }
  if (!o.noStatus) applyStatus(e, el, p);
  let mul = o.crit || 1;
  if (p && (p.cur === 'shadow')) { const sx = p.x - e.x, sz = p.z - e.z, d = Math.hypot(sx, sz) || 1; if ((sx * Math.sin(e.yaw) + sz * Math.cos(e.yaw)) / d < -.3) mul *= 1.5; }
  if (p && p.cur === 'gravity' && e.y > .4) mul *= 2;
  if (p && p.bf.crit > 0) { mul *= 2; p.bf.crit = 0; }
  if (p && p.bf.veil > 0) { mul *= 2.5; p.bf.veil = 0; }
  const L = Math.hypot(kx, kz) || 1, k = kb * t.kb * (e.m?.kb || 1) * (p?.cur === 'water' ? 1.4 : 1);
  if (!(e.cc && ['bubble', 'lift', 'stasis', 'encase', 'freeze'].includes(e.cc.type))) { e.kx += kx / L * k; e.kz += kz / L * k; }
  const dealt = damage(e, amount * mul, el, p, { crit: mul >= 1.45, poise: o.poise });
  if (p && !e.dead) EL[el].onHit?.(e, p, dealt);
  return dealt;
}
function damage(e, amount, el, p, o = {}) {
  if (e.dead || amount <= 0) return 0;
  if (e.cc?.type === 'stasis' && !o.raw) { e.stored += amount; return 0; }
  if (S.tstop > 0 && !o.raw) { e.tsd = (e.tsd || 0) + amount; e.tsBy = p?.id; return 0; }
  amount *= (1 + (e.m?.vuln || 0)) * (e.cc?.type === 'freeze' ? 1.4 : 1) * (e.cc?.type === 'bubble' ? 1.3 : 1) * (e.fvU > S.t ? 1 + e.fv : 1); // fv: a field's extra damage taken (Binding Circle)
  if (e.sh > 0) { const a = Math.min(e.sh, amount); e.sh -= a; amount -= a; }
  amount = Math.round(amount);
  if (amount <= 0) return 0;
  if (e.pid) { const q = S.players[e.pid]; if (!q || q.down || !hurt(q, amount, null)) return 0; e.hp = q.hp; if (p) addUlt(p, amount / 160); } // duel: the hit lands on the wizard
  else e.hp -= amount;
  const t = ET[e.type];
  ev({ k: 'dmg', id: e.id, x: r2(e.x), y: r2(e.y + t.h * e.sc + .2), z: r2(e.z), n: amount, el, c: o.crit ? 1 : 0, d: o.dot ? 1 : 0, b: o.blocked ? 1 : 0 });
  // poise: enough damage in a short window staggers the enemy and cancels its attack
  if (!o.dot && !e.dead) {
    e.poise -= amount * (EL[el]?.poise || 1) * (o.poise || 1);
    if (e.poise <= 0) { e.poise = t.poise * (1 + .1 * S.wave); if (cc(e, 'stun', t.boss ? 1.4 : .9, null)) ev({ k: 'stagger', id: e.id, x: r2(e.x), y: r2(e.y + t.h * e.sc), z: r2(e.z) }); }
  }
  if (e.link && e.link.t > 0 && !o.link) for (const l of S.enemies) if (l !== e && l.link && l.link.t > 0 && l.link.g === e.link.g) damage(l, amount * .4, el, p, { link: true, dot: true });
  if (p) {
    const st = stats(p);
    if (!p.down && st.steal) p.hp = Math.min(p.max, p.hp + amount * st.steal);
    if (p.cur === 'light') { const m = mate(p); if (m && !m.down) m.hp = Math.min(m.max, m.hp + amount * .08); else if (!p.down) p.hp = Math.min(p.max, p.hp + amount * .04); }
    addUlt(p, amount / (900 * (1 + .1 * (S.wave - 1))));
    p.stats.dmg += amount;
    if (!o.dot) { p.combo = (p.comboT > 0 ? p.combo : 0) + 1; p.comboT = 2.5; p.stats.best = Math.max(p.stats.best, p.combo); }
  }
  if (e.hp <= 0 && !e.pid) kill(e, el, p);
  return amount;
}
// area damage without status (reactions and explosions of enemies)
function aoe(x, z, r, amount, el, p, skipId = -1, knock = 0) {
  for (const e of [...S.enemies]) {
    if (!alive(e) || e.id === skipId) continue;
    const dx = e.x - x, dz = e.z - z, d = Math.hypot(dx, dz), t = ET[e.type];
    if (d > r + t.r * e.sc) continue;
    if (knock) { e.kx += dx / (d || 1) * knock * t.kb; e.kz += dz / (d || 1) * knock * t.kb; }
    damage(e, amount, el, p);
  }
}
// area hit WITH status, knockback away from the centre, optional launch / crowd control. Radius scales with Wide Blast.
function blast(x, z, r, dmg, c, o = {}) {
  const p = c.p, R = o.raw ? r : r * (p ? stats(p).aoe : 1), hit = [];
  for (const e of [...S.enemies]) {
    if (!alive(e) || (o.skip && o.skip.includes(e.id))) continue;
    const dx = e.x - x, dz = e.z - z, d = Math.hypot(dx, dz);
    if (d > R + ET[e.type].r * e.sc) continue;
    if (o.ground && e.y > .5) continue;
    hit.push(e);
    hitEnemy(e, c.el, dmg * (o.falloff ? 1 - .5 * d / R : 1), p, dx || .01, dz, o.kb ?? 4, { aoe: true, noStatus: o.noStatus, poise: o.poise });
    if (o.lift) launch(e, o.lift);
    if (o.cc) cc(e, o.cc[0], o.cc[1], p);
  }
  return hit;
}
function kill(e, el, p) {
  if (e.dead) return;
  e.dead = true; const t = ET[e.type];
  ev({ k: 'die', id: e.id, type: e.type, x: r2(e.x), y: r2(e.y), z: r2(e.z), el, sc: e.sc, boss: !!t.boss, elite: e.elite });
  if (t.boss || e.elite) S.hitstop = .12;
  if (t.split && e.sc > .7) for (const s of [-1, 1]) { const m = spawnEnemy('splitter', e.x + s * .6, e.z, false, e.sc * .6); m.rise = 0; m.y = 0; m.kx = s * 6; }
  if (e.type === 'bomber' && !e.blown) { e.blown = 1; bomberBlast(e, p, true); }
  if (p) {
    const st = stats(p);
    addUlt(p, t.boss ? .5 : e.elite ? .2 : .01); p.stats.kills++;
    if (p.cur === 'soul') { p.bd.souls = Math.min(15, (p.bd.souls || 0) + (t.boss ? 5 : e.elite ? 2 : 1)); ev({ k: 'fx', m: 'soul.0', f: 'harvest', id: p.id, x: r2(e.x), y: r2(e.y + 1), z: r2(e.z) }); }
    if (el) EL[el].onKill?.(e, p);
    if (st.detonate) { aoe(e.x, e.z, 2.5 * st.aoe, 15 * st.detonate * st.dmgMul, p.cur, p, e.id); ev({ k: 'fx', m: p.cur + '.0', f: 'det', x: r2(e.x), y: r2(e.y + .8), z: r2(e.z) }); }
  }
  if (Math.random() < (t.boss ? 1 : e.elite ? 1 : .07)) dropOrb(e.x, e.z, t.boss ? 'big' : 'hp');
}
function hurt(p, n, src = null) {
  if (p.down || p.dashT > 0 || p.bf.phase > 0 || p.bf.phoenix > 0 || p.bf.inv > 0 || S.phase !== 'fight') return false;
  if (p.bd.bones > 0) { // Bone Armor: a plate takes the whole hit, then flies back at the attacker
    p.bd.bones--;
    const o = V(p.x, p.y + 1.2, p.z);
    ev({ k: 'fx', m: 'bone.2', f: 'block', x: r2(o.x), y: r2(o.y), z: r2(o.z) });
    if (src && !src.dead) shoot(p, { p, el: 'bone', m: MOVE['bone.2'], dmg: stats(p).dmgMul, o, d: center(src).sub(o).normalize() }, 30, { r: .4, dmg: 30 * stats(p).dmgMul, kb: 6 });
    return true;
  }
  n *= stats(p).dr;
  if (p.bd.shell > 0) { const a = Math.min(p.bd.shell, n); p.bd.shell -= a; n -= a; if (p.bd.shell <= 0) { p.bf.shell = 0; shellBurst(p); } }
  if (src && (p.cur === 'magma' || p.bf.molten > 0) && !src.dead) applyStatus(src, 'magma', p);
  if (n <= 0) return true;
  p.hp -= n; ev({ k: 'hurt', id: p.id, n: Math.round(n) });
  if (p.cur === 'soul' && p.bd.souls > 0) p.bd.souls = Math.max(0, p.bd.souls - 2);
  if (p.hp <= 0) { p.hp = 0; p.down = true; p.rev = 0; p.ch = null; p.chg = null; ev({ k: 'down', id: p.id }); }
  return true;
}
// an enemy attack landing on a player: dashing through it at the last moment is a perfect dodge
function enemyHits(p, dmg, e) {
  if (p.down) return;
  if (p.dashT > 0 || p.bf.inv > 0) {
    if (S.t - p.dashAt < .4 && !(p.pdCd > S.t)) { p.pdCd = S.t + 1; S.slowmo = .55; addUlt(p, .12); p.stats.dodges++; ev({ k: 'dodge', id: p.id }); }
    return;
  }
  if (e?.st?.illusion > 0 && Math.random() < 1 / 3) { ev({ k: 'miss', x: r2(p.x), y: r2(p.y + 1.6), z: r2(p.z), id: p.id }); return; } // Misdirection: it struck a phantom
  hurt(p, dmg * (1 - (e?.m?.weak || 0)), e);
}
function shellBurst(p) {
  const c = { p, el: 'crystal', m: MOVE['crystal.2'], dmg: stats(p).dmgMul };
  for (let i = 0; i < 16; i++) { const a = TAU * i / 16; shoot(p, c, 26, { o: V(p.x, 1.1 + p.y, p.z), d: V(Math.sin(a), .05, Math.cos(a)), dmg: 14 * c.dmg, life: .7, look: 'crystal__prism' }); }
  ev({ k: 'fx', m: 'crystal.2', f: 'burst', x: r2(p.x), y: r2(p.y + 1), z: r2(p.z) });
}

// ===================== projectiles =====================
// shoot(p, c, speed, opt): opt overrides any shot field (o, d, life, r, dmg, kb, pierce, bounce, grav, home, rest, fuse, ret...)
// ponytail: hard caps so a runaway spawn chain degrades (drops new spawns) instead of freezing the tab
const MAX_SHOTS = 400, MAX_ENTS = 160;
function shoot(p, c, spd, o = {}) {
  const st = p ? stats(p) : null, org = o.o || c.o, d = o.d || c.d;
  const s = { id: S.nid++, own: p?.id, mv: c.m.key, el: c.el, x: org.x, y: org.y, z: org.z, vx: d.x * spd, vy: d.y * spd, vz: d.z * spd,
    life: 2, r: .3, dmg: 10, kb: 2.5, pierce: st ? st.pierce : 0, bounce: st ? st.bounce : 0, grav: 0, home: 0, hit: [], t: 0, sc: 1, mul: c.dmg ?? 1, ...o };
  delete s.o; delete s.d;
  if (S.shots.length < MAX_SHOTS) S.shots.push(s);
  return s;
}
function endShot(s, why, e) { if (s.dead) return; s.dead = true; MOVE[s.mv]?.shot?.end?.(s, why, e); }
function stepShots(dt) {
  for (const s of S.shots) {
    if (s.dead) continue;
    if (s.foe) { stepFoeShot(s, dt); continue; }
    S.actor = s.own;
    const H = MOVE[s.mv]?.shot || {};
    s.t += dt; s.life -= dt;
    if (s.stuck != null) {
      const e = S.enemies.find(x => x.id === s.stuck);
      if (e && !e.dead) { s.x = e.x + s.ox; s.y = e.y + s.oy; s.z = e.z + s.oz; } else s.stuck = null;
    } else if (!s.still) {
      if (s.home) {
        const e = nearest(s.x + s.vx * .15, s.z + s.vz * .15, 18, s.hit);
        if (e) {
          const sp = Math.hypot(s.vx, s.vy, s.vz), dv = center(e).sub(V(s.x, s.y, s.z)).normalize().multiplyScalar(sp), k = Math.min(1, s.home * dt);
          s.vx += (dv.x - s.vx) * k; s.vy += (dv.y - s.vy) * k; s.vz += (dv.z - s.vz) * k;
        }
      }
      if (s.ret != null && s.t > s.ret) { // boomerang back to the caster
        const p = S.players[s.own];
        if (!p) { endShot(s, 'life'); continue; }
        if (!s.back) { s.back = 1; s.hit = []; }
        const to = eyeOf(p).sub(V(s.x, s.y, s.z)), L = to.length();
        if (L < 1.3) { endShot(s, 'return'); continue; }
        to.multiplyScalar((s.rspd || 32) / L); s.vx = to.x; s.vy = to.y; s.vz = to.z; s.life = Math.max(s.life, .5);
      }
      s.vy -= s.grav * dt;
      s.x += s.vx * dt; s.y += s.vy * dt; s.z += s.vz * dt;
      if (s.y < .06 + (s.rest ? s.r * .5 : 0)) {
        if (s.rest) { s.y = .06 + s.r * .5; s.vy = Math.abs(s.vy) * s.rest; s.vx *= .75; s.vz *= .75; if (s.vy < 1.2) { s.vy = 0; s.grav = 0; s.vx *= .9; s.vz *= .9; } }
        else if (H.ground) H.ground(s);
        else { endShot(s, 'ground'); continue; }
      }
      if (offMap(s.x, s.z, MAP.rects ? 0 : 8)) { endShot(s, MAP.rects ? 'ground' : 'life'); continue; } // dungeon walls stop shots
    }
    H.tick?.(s, dt);
    if (s.dead) continue;
    if (s.fuse != null && (s.fuse -= dt) <= 0) { endShot(s, 'fuse'); continue; }
    if (!s.passive && s.stuck == null) {
      for (const e of S.enemies) {
        if (!alive(e) || s.hit.includes(e.id) || !touches(e, s.x, s.y, s.z, s.r)) continue;
        s.hit.push(e.id);
        const head = s.y > e.y + ET[e.type].h * e.sc * .72, p = S.players[s.own];
        const res = H.hit ? H.hit(s, e, head) : (hitEnemy(e, s.el, s.dmg, p, s.vx, s.vz, s.kb, { crit: head ? 1.5 : 1, src: { x: s.x - s.vx, z: s.z - s.vz } }), undefined);
        if (res === 'end') { endShot(s, 'hit', e); break; }
        if (res === 'pass' || s.dead) { if (s.dead) break; continue; }
        const nxt = s.bounce > 0 && nearest(e.x, e.z, 12, s.hit);
        if (nxt) {
          s.bounce--; const sp = Math.hypot(s.vx, s.vy, s.vz), d = center(nxt).sub(V(s.x, s.y, s.z)).normalize();
          s.vx = d.x * sp; s.vy = d.y * sp; s.vz = d.z * sp; s.life = Math.max(s.life, 1); s.grav = 0;
        } else if (--s.pierce < 0) { endShot(s, 'hit', e); break; }
      }
    }
    if (!s.dead && s.life <= 0) endShot(s, 'life');
  }
  S.actor = null;
  S.shots = S.shots.filter(s => !s.dead);
}
function stepFoeShot(s, dt) {
  if (S.tstop > 0) return;
  let k = 1;
  for (const n of S.ents) {
    const d = Math.hypot(s.x - n.x, s.z - n.z);
    if (n.slowShots && d < n.r) k = Math.min(k, .2);
    if (n.blockShots && d < n.r) { s.dead = true; ev({ k: 'block', x: r2(s.x), y: r2(s.y), z: r2(s.z) }); return; }
    if (n.solid && n.solid.some(c => Math.hypot(s.x - c.x, s.z - c.z) < c.r + .2) && s.y < (n.h ?? 3)) { s.dead = true; ev({ k: 'block', x: r2(s.x), y: r2(s.y), z: r2(s.z) }); return; }
  }
  s.life -= dt; s.x += s.vx * dt * k; s.y += s.vy * dt * k; s.z += s.vz * dt * k;
  for (const p of players()) if (!p.down && Math.hypot(p.x - s.x, p.z - s.z) < .6 && s.y > p.y && s.y < p.y + 1.9) { enemyHits(p, s.dmg, null); s.dead = true; return; }
  if (s.y < 0 || s.life <= 0) s.dead = true;
}

// ===================== persistent entities (zones, walls, turrets, summons) =====================
function ent(p, c, x, z, o = {}) {
  const n = { id: S.nid++, own: p?.id, mv: c.m.key, el: c.el, x, y: 0, z, r: 1, life: 5, yaw: 0, t: 0, mul: c.dmg ?? 1, hit: {}, s: 0, acc: 0, ...o };
  n.max ??= n.life;
  if (S.ents.length < MAX_ENTS) S.ents.push(n);
  return n;
}
// true once every `period` seconds for this entity (use one key per independent timer)
function pulse(n, dt, period, key = 'acc') { n[key] = (n[key] || 0) + dt; if (n[key] >= period) { n[key] -= period; return true; } return false; }
// per-enemy hit cooldown for an entity
function ready(n, e, cd) { if ((n.hit[e.id] || 0) > n.t) return false; n.hit[e.id] = n.t + cd; return true; }
function stepEnts(dt) {
  for (const n of S.ents) {
    if (n.dead) continue;
    n.t += dt; n.life -= dt; S.actor = n.own;
    if (n.follow) { const p = own(n); if (p) { n.x = p.x; n.z = p.z; n.y = p.y; } }
    const H = MOVE[n.mv]?.ent;
    H?.tick?.(n, dt);
    if (n.life <= 0 && !n.dead) { n.dead = true; H?.end?.(n); }
  }
  S.actor = null;
  S.ents = S.ents.filter(n => !n.dead);
}
const entsOf = (p, mv) => S.ents.filter(n => n.own === p.id && n.mv === mv);

// ===================== players: movement (runs on the owner) =====================
function stepMove(p, i, dt) {
  p.yaw = i.yaw; p.pitch = i.pitch;
  if (p.spawn && p.spawn.n !== p.spawnN) { // the host placed this wizard for a new duel round; its owner moves it there
    p.spawnN = p.spawn.n; Object.assign(p, { x: p.spawn.x, z: p.spawn.z, y: 0, vy: 0, kx: 0, kz: 0, mo: null, dashT: 0, cds: {} });
    p.yaw = p.spawn.yaw; if (p.id === myId) inp.yaw = p.spawn.yaw;
  }
  if (p.down) return;
  const st = stats(p);
  const fx = -Math.sin(p.yaw), fz = -Math.cos(p.yaw), rx = Math.cos(p.yaw), rz = -Math.sin(p.yaw);
  const mx = i.mx ?? (i.r ? 1 : 0) - (i.l ? 1 : 0), mz = i.mz ?? (i.f ? 1 : 0) - (i.b ? 1 : 0); // analog from a stick, or keys
  let vx = rx * mx + fx * mz, vz = rz * mx + fz * mz; const L = Math.hypot(vx, vz);
  if (L > 1) { vx /= L; vz /= L; }
  p.dcd -= dt;
  for (const k in p.bf) if (p.bf[k] > 0) p.bf[k] -= dt;
  if (p.bf.stun > 0 || p.bf.root > 0) { vx = vz = 0; i = { ...i, dashN: p.dashN, jumpN: p.jumpN }; } // held in place (duel crowd control)
  const kk = p.kick || [0, 0, 0], ks = p.kickSeen || kk; // knockback handed over by the host as running totals, so none is lost or doubled
  p.kx = (p.kx || 0) + kk[0] - ks[0]; p.kz = (p.kz || 0) + kk[1] - ks[1]; if (kk[2] - ks[2] > .1) p.vy = Math.max(p.vy, kk[2] - ks[2]); p.kickSeen = kk.slice();
  if (p.kx || p.kz) { p.x += p.kx * dt; p.z += p.kz * dt; const kd = Math.exp(-5 * dt); p.kx *= kd; p.kz *= kd; if (Math.abs(p.kx) + Math.abs(p.kz) < .05) p.kx = p.kz = 0; }
  if (i.dashN !== p.dashN) {
    p.dashN = i.dashN;
    if (p.dcd <= 0 && !p.mo) { p.dashT = .2; p.dcd = st.dashCd; p.dx = L ? vx / L : fx; p.dz = L ? vz / L : fz; p.dashes++; p.dashAt = S.t; if (p.id === myId) { fovKick = 1; sfx('dash'); } }
  }
  if (i.jumpN !== p.jumpN) {
    p.jumpN = i.jumpN;
    if (p.gr) { p.vy = 7.5; p.jumps = 0; }
    else if ((p.cur === 'wind') && p.jumps < 1) { p.vy = 8; p.jumps++; burst(p.x, p.y, p.z, 14, EL.wind.color, 4, .2, .4); }
  }
  if (p.mo) { // scripted motion from a move (phoenix arc, rocket jump, updraft...)
    const m = p.mo; m.t += dt;
    if (m.arc) {
      const u = Math.min(1, m.t / m.T);
      p.x = m.x0 + (m.x1 - m.x0) * u; p.z = m.z0 + (m.z1 - m.z0) * u; p.y = 4 * m.h * u * (1 - u); p.vy = 0;
      if (u >= 1) { p.mo = null; p.y = 0; }
      return;
    }
    p.x += m.vx * dt; p.z += m.vz * dt;
    if (m.trail) for (let k = 0; k < 3; k++) emit(p.x + rand(-.4, .4), p.y + rand(.2, 1.6), p.z + rand(-.4, .4), -m.vx * .15, 0, -m.vz * .15, m.trail, .3, .4);
    if (m.t >= m.T) p.mo = null;
  } else if (p.dashT > 0) {
    p.dashT -= dt; p.x += p.dx * 26 * dt; p.z += p.dz * 26 * dt;
    for (let k = 0; k < 3; k++) emit(p.x + rand(-.4, .4), p.y + rand(.2, 1.6), p.z + rand(-.4, .4), -p.dx * 4, 0, -p.dz * 4, EL[p.cur].color, .25, .35);
  } else { p.x += vx * st.speed * dt; p.z += vz * st.speed * dt; }
  p.vy -= 22 * dt;
  if (p.bf.glide > 0 && i.jump && p.vy < -2.2) p.vy = -2.2;
  p.y += p.vy * dt;
  collide(p, .45);
  const gy = groundY(p.x, p.z); // 0, or the height of the dungeon stairs; stick to the steps on the way down
  if (p.y <= gy + (p.gr && p.vy <= 0 ? .5 : 0) && !(S.mode === 'duel' && offMap(p.x, p.z))) { p.y = gy; p.vy = 0; p.gr = true; } else p.gr = false; // no floor past the duel platform's edge
}

// ===================== players: the 5-slot move system =====================
function ctxOf(p, m, k = 1) {
  const st = stats(p), { o, d } = castAim(p), mega = m.slot === 0 && st.over && p.casts % 5 === 0 && p.casts > 0;
  return { p, m, el: m.el, st, o, d, eye: eyeOf(p), aim: aimOf(p), flat: flatAim(p), k, mega, multi: m.slot === 0 ? st.multi : 1,
    dmg: st.dmgMul * bondMul(p) * (mega ? 3 : 1), tgt: m.mode === 'aim' ? groundAt(p, m.range ?? 20) : null };
}
const castEv = (p, m, c) => ({ k: 'cast', id: p.id, m: m.key, x: r2(p.x), y: r2(p.y), z: r2(p.z), o: [c.o.x, c.o.y, c.o.z].map(r2), d: [c.d.x, c.d.y, c.d.z].map(r2),
  mega: c.mega ? 1 : 0, ck: r2(c.k), ...(c.tgt ? { tx: r2(c.tgt.x), tz: r2(c.tgt.z) } : {}) });
const kitOf = p => EL[p.cur || p.el];
const cdOf = (p, m) => m.slot === 4 ? 0 : m.cd * stats(p).cdMul * (m.slot === 2 || m.slot === 3 ? stats(p).skillCd : 1);
function canCast(p, m) {
  if (m.slot === 4) return p.ult >= 1;
  if ((p.cds[m.el]?.[m.slot] || 0) > 0) return false;
  if (m.cost && p.hp <= m.cost(p) + 1) return false;
  if (m.el === 'plasma' && p.bf.overheat > 0) return false;
  return m.can ? m.can(p) : true;
}
function fire(p, m, k, host) {
  if (m.slot === 0) p.casts++;
  const c = ctxOf(p, m, k), cds = p.cds[m.el] ??= [0, 0, 0, 0, 0];
  cds[m.slot] = cdOf(p, m);
  if (host) {
    if (m.slot === 4) { p.ult = 0; ev({ k: 'ult', id: p.id, el: m.el, name: m.name }); }
    if (m.cost) p.hp = Math.max(1, p.hp - m.cost(p));
    if ((m.slot === 2 || m.slot === 3) && Math.random() < c.st.echo) { cds[m.slot] = 0; ev({ k: 'echo', id: p.id }); }
    EL[m.el].onCast?.(p, m, c);
    ev(castEv(p, m, c));
    m.cast?.(p, c);
    if (m.slot === 0 && p.bf.mirror > 0) for (const side of [-1, 1]) { // Mirror Images copy the basic attack from beside you, at 40%
      const o = c.o.clone().add(V(Math.cos(p.yaw), 0, -Math.sin(p.yaw)).multiplyScalar(side * 1.6)), aimPt = c.eye.clone().addScaledVector(c.aim, 40);
      const d = aimPt.sub(o).normalize();
      ev({ k: 'fx', m: 'illusion.3', f: 'mimic', x: r2(o.x), y: r2(o.y), z: r2(o.z) });
      m.cast?.(p, { ...c, o, d, eye: o.clone(), aim: d, dmg: c.dmg * .4, multi: 1 });
    }
  }
  if (!host || p.id === 'h') m.self?.(p, c);   // movement belongs to whoever owns the player
  if (!host) castFx(castEv(p, m, c));          // the guest draws its own cast at once (prediction)
  return c;
}
// host: real casts. guest (host=false): same rules for prediction (cooldowns, self-movement, instant visuals)
function stepCast(p, i, dt, host = true) {
  const cdt = dt * (p.bf.haste > 0 ? 2 : 1); // Chrono's Accelerate
  for (const el in p.cds) { const a = p.cds[el]; for (let s = 0; s < 5; s++) a[s] -= cdt; }
  const kit = kitOf(p), held = p.bf.stun > 0 ? [] : i.k || [];
  // while down, drop Tab presses on both machines so host and guest never disagree about the active element after a revive
  if (p.down || S.phase === 'over' || (host && S.phase === 'lobby')) { p.ch = null; p.chg = null; p.prevK = []; p.swapN = i.swapN; return; }
  if (i.swapN !== p.swapN) {
    p.swapN = i.swapN;
    if (p.el2 && !p.ch && !p.chg) { p.cur = p.cur === p.el2 ? p.el : p.el2; if (host) ev({ k: 'swap', id: p.id, el: p.cur }); if (p.id === myId) { tintRig(p.cur); sfx('swap'); } }
  }
  if (p.ch) { // channel: runs while held, up to m.max seconds
    const m = MOVE[p.ch];
    p.chT += dt;
    if (host) m.tick?.(p, ctxOf(p, m), dt);
    if (!held[m.slot] || p.chT >= m.max || m.el !== p.cur) {
      if (host) m.end?.(p, ctxOf(p, m));
      (p.cds[m.el] ??= [0, 0, 0, 0, 0])[m.slot] = cdOf(p, m);
      p.ch = null;
    }
    p.prevK = held.slice(); return;
  }
  if (p.chg) { // charge / aim: build while held, cast on release
    const m = MOVE[p.chg.m];
    p.chg.t += dt;
    if (!held[m.slot] || m.el !== p.cur) {
      const k = m.mode === 'charge' ? clamp(p.chg.t / m.charge, 0, 1) : 1;
      p.chg = null;
      if (m.el === p.cur) fire(p, m, k, host);
    }
    p.prevK = held.slice(); return;
  }
  for (let s = 0; s < 5; s++) {
    if (!held[s]) continue;
    const m = kit.moves[s];
    if (!canCast(p, m)) continue;
    if (m.slot === 4 && p.prevK[s]) continue; // ultimates need a fresh press
    if (m.mode === 'channel') { p.ch = m.key; p.chT = 0; if (host) { ev(castEv(p, m, ctxOf(p, m))); m.start?.(p, ctxOf(p, m)); } else castFx(castEv(p, m, ctxOf(p, m))); }
    else if (m.mode === 'charge' || m.mode === 'aim') p.chg = { m: m.key, t: 0 };
    else fire(p, m, 1, host);
    break;
  }
  p.prevK = held.slice();
}

// ===================== enemies =====================
function spawnEnemy(type, x, z, elite = false, sc = 1) {
  const t = ET[type];
  const hp = t.hp * (1 + .12 * (S.wave - 1)) * (elite ? 4 : 1) * sc * (t.boss ? 1 + .35 * (S.wave / 5 - 1) : 1) * (S.mod === 'swarm' ? .5 : 1);
  const e = { id: S.nid++, type, x, z, y: -2.6, rise: .8, hp, max: hp, kx: 0, kz: 0, vy: 0, st: {}, stk: {}, src: {}, dotT: .5, m: statusMods({ st: {} }),
    acd: rand(.6, 1.6), sp: 4, yaw: Math.atan2(-x, -z), sc: sc * (elite ? 1.35 : 1), elite, fall: false, ch: 0, cdx: 0, cdz: 0, chHit: [],
    cc: null, atk: null, poise: t.poise * (1 + .1 * S.wave), sh: 0, link: null, wander: rand(0, TAU), enraged: false };
  S.enemies.push(e); ev({ k: 'spawn', x: r2(x), z: r2(z), s: r2(t.r * e.sc) });
  return e;
}
function bomberBlast(e, p, early) {
  const R = 3.2 * e.sc;
  ev({ k: 'fx', m: 'explosion.0', f: 'boom', x: r2(e.x), y: r2(e.y + .6), z: r2(e.z), r: R, foe: early ? 0 : 1 });
  if (!early) for (const q of players()) if (Math.hypot(q.x - e.x, q.z - e.z) < R) enemyHits(q, ET.bomber.dmg * (1 + .06 * (S.wave - 1)), e);
  aoe(e.x, e.z, R, early ? 70 : 45, 'explosion', p, e.id, 10);
}
// telegraphed attacks: start (windup with a ground warning) -> resolve
function startAttack(e, tgt) {
  const t = ET[e.type], dx = tgt.x - e.x, dz = tgt.z - e.z, yaw = Math.atan2(dx, dz), R = t.r * e.sc;
  const wind = t.wind * (e.enraged ? .75 : 1);
  e.atk = { k: t.atk, t: wind, max: wind, yaw, tx: tgt.x, tz: tgt.z, lure: tgt.lure };
  e.yaw = yaw;
  let tele;
  switch (t.atk) {
    case 'swipe': tele = { shape: 'cone', x: e.x, z: e.z, yaw, r: t.reach * e.sc + .4, ang: 110 }; break;
    case 'lunge': tele = { shape: 'line', x: e.x, z: e.z, yaw, len: t.reach * e.sc + 1, w: 1.3 }; break;
    case 'slam': tele = { shape: 'circle', x: e.x, z: e.z, r: t.reach * e.sc }; break;
    case 'smash': { const ox = e.x + Math.sin(yaw) * R * 1.2, oz = e.z + Math.cos(yaw) * R * 1.2; e.atk.ox = ox; e.atk.oz = oz; tele = { shape: 'circle', x: ox, z: oz, r: (t.boss ? 4.2 : 2.8) * e.sc ** .5 }; break; }
    case 'thrust': tele = { shape: 'line', x: e.x, z: e.z, yaw, len: t.reach * e.sc + .6, w: 1.2 }; break;
    case 'fuse': tele = { shape: 'circle', x: e.x, z: e.z, r: 3.2 * e.sc }; break;
    case 'mend': tele = { shape: 'circle', x: e.x, z: e.z, r: 9, ally: 1 }; break;
    case 'orb': tele = null; break;
  }
  ev({ k: 'tele', id: e.id, a: t.atk, d: r2(wind), ...(tele ? Object.fromEntries(Object.entries(tele).map(([k, v]) => [k, typeof v === 'number' ? r2(v) : v])) : {}) });
}
const inCone = (p, x, z, yaw, r, ang) => { const dx = p.x - x, dz = p.z - z, d = Math.hypot(dx, dz); return d < r && (d < .6 || (dx * Math.sin(yaw) + dz * Math.cos(yaw)) / d > Math.cos(ang / 2 * Math.PI / 180)); };
const inLine = (p, x, z, yaw, len, w) => { const dx = p.x - x, dz = p.z - z, f = dx * Math.sin(yaw) + dz * Math.cos(yaw), s = Math.abs(dx * Math.cos(yaw) - dz * Math.sin(yaw)); return f > -.5 && f < len && s < w / 2 + .4; };
function resolveAttack(e) {
  const t = ET[e.type], a = e.atk, sc = 1 + .06 * (S.wave - 1), dmg = t.dmg * sc * (e.elite ? 1.5 : 1), ps = players().filter(p => !p.down);
  e.atk = null; e.acd = t.cd * rand(.85, 1.15) * (e.enraged ? .7 : 1);
  ev({ k: 'strike', id: e.id, a: a.k });
  if (a.lure) for (const n of S.ents) if (n.lure && Math.hypot(n.x - a.tx, n.z - a.tz) < 1.5) n.hits = (n.hits || 0) + 1; // a decoy took the blow
  switch (a.k) {
    case 'swipe': for (const p of ps) if (inCone(p, e.x, e.z, a.yaw, t.reach * e.sc + .5, 115) && p.y < 1.6) enemyHits(p, dmg, e); break;
    case 'slam': for (const p of ps) if (Math.hypot(p.x - e.x, p.z - e.z) < t.reach * e.sc + .3 && p.y < 1.2) enemyHits(p, dmg, e); break;
    case 'smash': {
      const r = (t.boss ? 4.2 : 2.8) * e.sc ** .5;
      ev({ k: 'fx', m: 'earth.4', f: 'slam', x: r2(a.ox), y: 0, z: r2(a.oz), r: r2(r) });
      for (const p of ps) if (Math.hypot(p.x - a.ox, p.z - a.oz) < r + .3 && p.y < 1.3) enemyHits(p, dmg, e);
      break;
    }
    case 'thrust': for (const p of ps) if (inLine(p, e.x, e.z, a.yaw, t.reach * e.sc + .6, 1.2) && p.y < 1.6) enemyHits(p, dmg, e); break;
    case 'lunge': {
      const L = t.reach * e.sc + 1, x0 = e.x, z0 = e.z;
      e.x += Math.sin(a.yaw) * L * .9; e.z += Math.cos(a.yaw) * L * .9; collide(e, t.r * e.sc);
      for (const p of ps) if (inLine(p, x0, z0, a.yaw, L, 1.3) && p.y < 1.2) enemyHits(p, dmg, e);
      break;
    }
    case 'orb': {
      const tgt = a.lure ? { x: a.tx, y: 0, z: a.tz } : ps.reduce((b, p) => !b || Math.hypot(p.x - e.x, p.z - e.z) < Math.hypot(b.x - e.x, b.z - e.z) ? p : b, null);
      if (!tgt) break;
      const o = V(e.x, e.y + 1.75 * e.sc, e.z), v = V(tgt.x, tgt.y + 1.2, tgt.z).sub(o).normalize().multiplyScalar(15);
      S.shots.push({ id: S.nid++, foe: 1, mv: 'foe', el: 'foe', x: o.x, y: o.y, z: o.z, vx: v.x, vy: v.y, vz: v.z, life: 3, dmg, sc: 1 });
      break;
    }
    case 'fuse': e.blown = 1; bomberBlast(e, null, false); kill(e, null, null); break;
    case 'mend': for (const o of enemiesNear(e.x, e.z, 9)) if (o !== e && !ET[o.type].boss) { o.hp = Math.min(o.max, o.hp + o.max * .25); o.sh = Math.max(o.sh, 25 * sc); } ev({ k: 'fx', m: 'foe', f: 'mend', x: r2(e.x), z: r2(e.z) }); break;
  }
}
function stepEnemies(dt) {
  const ps = players().filter(p => !p.down), haste = S.mod === 'haste' ? 1.4 : 1, scale = 1 + .06 * (S.wave - 1);
  if (S.tstop > 0) { // Chrono's Time Stop: everything waits, damage piles up and lands when time resumes
    S.tstop -= dt;
    if (S.tstop <= 0) { ev({ k: 'fx', m: 'chrono.4', f: 'resume' }); for (const e of S.enemies) if (e.tsd > 0 && !e.dead) { const d = e.tsd * 1.5; e.tsd = 0; damage(e, d, 'chrono', S.players[e.tsBy], { raw: true }); } }
    return;
  }
  const sol = solids(), lures = S.ents.filter(n => n.lure);
  for (const e of S.enemies) {
    if (e.dead) continue;
    const t = ET[e.type], R = t.r * e.sc;
    if (e.fall) { e.vy += 25 * dt; e.y -= e.vy * dt; e.x += e.kx * dt; e.z += e.kz * dt; if (e.y < -14) kill(e, null, null); continue; }
    if (e.rise > 0) { e.rise -= dt; e.y = -2.6 * Math.max(0, e.rise / .8); continue; }
    for (const k in e.st) { e.st[k] -= dt; if (e.st[k] <= 0) { delete e.st[k]; delete e.stk[k]; } }
    if (e.link) { e.link.t -= dt; if (e.link.t <= 0) e.link = null; }
    e.m = statusMods(e);
    if ((e.dotT -= dt) <= 0) { // damage over time from statuses, every half second
      e.dotT = .5;
      for (const k in e.st) {
        const sd = EL[k].st; if (!sd?.dot) continue;
        const p = S.players[e.src[k]], n = sd.dot * .5 * (sd.dotStacks ? e.stk[k] || 1 : 1) * (1 + .08 * (S.wave - 1)) * (p ? stats(p).dmgMul : 1);
        damage(e, n, k, p, { dot: true });
        if (sd.leech && p) heal(p, n * sd.leech);
        if (e.dead) break;
      }
      if (e.dead) continue;
    }
    if (e.cc) { e.cc.t -= dt * (e.cc.type === 'stasis' ? 1 : 1); if (e.cc.t <= 0) ccEnd(e); }
    const ctype = e.cc?.type, hard = ctype && HARD.has(ctype);
    if (e.pid) { handToWizard(e, hard, ctype); continue; }
    // vertical: held aloft by bubble / levitate, otherwise gravity (launches, slams)
    if (ctype === 'bubble' || ctype === 'lift') { e.y += ((ctype === 'lift' ? 3.2 : 2.2) - e.y) * Math.min(1, dt * 4); e.vy = 0; }
    else if (e.y > 0 || e.vy > 0) {
      e.vy -= 26 * dt; e.y += e.vy * dt;
      if (e.y <= 0) {
        const v = -e.vy; e.y = 0; e.vy = 0;
        if (v > 13) { // slammed into the floor
          const by = Object.keys(e.st).includes('gravity') ? 1.5 : 1;
          damage(e, (v - 13) * 2.4 * by, 'earth', S.players[e.cc?.src] || null, { raw: true });
          ev({ k: 'land', x: r2(e.x), z: r2(e.z), s: r2(R) });
          if (!e.dead) cc(e, 'stun', .5, null);
        }
        if (e.dead) continue;
      }
    }
    // knockback; a hard enough hit near the edge knocks them off the island
    e.x += e.kx * dt; e.z += e.kz * dt; const kd = Math.exp(-5 * dt); e.kx *= kd; e.kz *= kd;
    if (!MAP.rects && offMap(e.x, e.z, .3) && !t.boss) { e.fall = true; e.vy = 0; continue; }
    // ponytail: O(n^2) separation, fine below ~150 enemies; use a grid if waves get huge
    for (const o of S.enemies) {
      if (o === e || o.dead || o.rise > 0) continue;
      const dx = e.x - o.x, dz = e.z - o.z, d = Math.hypot(dx, dz), m = R + ET[o.type].r * o.sc;
      if (d < m && d > 0) { const push = (m - d) * .5; e.x += dx / d * push; e.z += dz / d * push; }
    }
    if (Math.hypot(e.kx, e.kz) < 5) collide(e, R, sol);
    if (hard || e.y > .3) continue;
    // field effects (slow fields, eclipse) are written onto e.fs by entity ticks each frame
    const fieldSlow = e.fs || 0; e.fs = 0;
    const slow = Math.min(.85, Math.max(e.m.slow, fieldSlow)), rate = (1 - slow) * haste;
    const vis = ps.filter(p => !(p.bf.veil > 0));
    let tgt = null, bd = 1e9;
    for (const p of vis) { const d = Math.hypot(p.x - e.x, p.z - e.z); if (d < bd) { bd = d; tgt = p; } }
    for (const n of lures) { const d = Math.hypot(n.x - e.x, n.z - e.z); if (d < n.r && d * .5 < bd) { bd = d * .5; tgt = { x: n.x, y: 0, z: n.z, lure: 1 }; } } // Illusion decoys draw them in
    const spd = t.spd * rate;
    if (ctype === 'charm') { // turned against their own: hunt the nearest other monster and hit it
      const o = nearest(e.x, e.z, 30, [e.id]);
      if (o) {
        const dx = o.x - e.x, dz = o.z - e.z, d = Math.hypot(dx, dz) || 1;
        e.yaw = Math.atan2(dx, dz);
        if (d > R + ET[o.type].r * o.sc + .5) { e.x += dx / d * spd * dt; e.z += dz / d * spd * dt; }
        else if ((e.acd -= dt * rate) <= 0) { e.acd = t.cd; ev({ k: 'strike', id: e.id, a: t.atk }); damage(o, Math.max(10, t.dmg) * 1.6 * (e.elite ? 1.5 : 1), 'illusion', S.players[e.cc.src] || null); }
        continue;
      }
    }
    if (ctype === 'fear' && ps.length) { // run from the nearest player
      const p = ps.reduce((b, q) => Math.hypot(q.x - e.x, q.z - e.z) < Math.hypot(b.x - e.x, b.z - e.z) ? q : b);
      const dx = e.x - p.x, dz = e.z - p.z, d = Math.hypot(dx, dz) || 1;
      e.x += dx / d * spd * 1.2 * dt; e.z += dz / d * spd * 1.2 * dt; e.yaw = Math.atan2(dx, dz); continue;
    }
    if (ctype === 'blind' || ctype === 'poly' || ctype === 'charm' || !tgt) { // stumble around (a sheep just grazes)
      e.wander += rand(-2, 2) * dt;
      e.x += Math.sin(e.wander) * spd * .4 * dt; e.z += Math.cos(e.wander) * spd * .4 * dt; e.yaw = e.wander;
      if (e.atk) e.atk = null;
      continue;
    }
    if (t.boss && !e.enraged && e.hp < e.max * .5) { // phase two: faster, summons help
      e.enraged = true; ev({ k: 'enrage', id: e.id });
      for (let k = 0; k < 4; k++) { const a = TAU * k / 4, q = confine({ x: e.x + Math.sin(a) * 5, z: e.z + Math.cos(a) * 5 }, 1); spawnEnemy(t.minions?.[k % 2] ?? (k % 2 ? 'runner' : 'grunt'), q.x, q.z); }
    }
    const dx = tgt.x - e.x, dz = tgt.z - e.z, d = Math.hypot(dx, dz) || 1;
    if (e.atk) { // winding up: turn slowly toward the target, then strike
      if (e.atk.k !== 'smash' && e.atk.k !== 'thrust' && e.atk.k !== 'lunge') e.yaw = lerpAngle(e.yaw, Math.atan2(dx, dz), Math.min(1, dt * 2));
      if ((e.atk.t -= dt * rate) <= 0) resolveAttack(e);
      continue;
    }
    e.yaw = Math.atan2(dx, dz);
    if (t.boss && e.ch > 0) {
      e.ch -= dt; e.x += e.cdx * 15 * dt; e.z += e.cdz * 15 * dt; collide(e, R, sol);
      for (const p of ps) if (!e.chHit.includes(p.id) && Math.hypot(p.x - e.x, p.z - e.z) < R + .7) { e.chHit.push(p.id); enemyHits(p, 25 * scale, e); }
      continue;
    }
    const rooted = ctype === 'root';
    if (t.ranged) {
      const [lo, hi] = t.keep, w = d > hi ? 1 : d < lo ? -1 : 0, side = Math.sin(S.t * .7 + e.id) * .6;
      const g = navTo(e, tgt);
      if (rooted) {} else if (g !== tgt) { const gx = g.x - e.x, gz = g.z - e.z, gd = Math.hypot(gx, gz) || 1; e.x += gx / gd * spd * dt; e.z += gz / gd * spd * dt; e.yaw = Math.atan2(gx, gz); }
      else { e.x += (dx / d * w - dz / d * side) * spd * dt; e.z += (dz / d * w + dx / d * side) * spd * dt; }
      if ((e.acd -= dt * rate) <= 0 && d < t.reach + 8) startAttack(e, tgt);
    } else {
      if (d > t.reach * e.sc * .7 && !rooted) { // round walls through the doorways (dungeon), straight at you otherwise
        const g = navTo(e, tgt), gx = g.x - e.x, gz = g.z - e.z, gd = Math.hypot(gx, gz) || 1;
        e.x += gx / gd * spd * dt; e.z += gz / gd * spd * dt; if (g !== tgt) e.yaw = Math.atan2(gx, gz);
      }
      if ((e.acd -= dt * rate) <= 0 && d < t.reach * e.sc + (t.atk === 'fuse' ? 0 : .3) && tgt.y < 1.5) startAttack(e, tgt);
    }
    if (t.boss && (e.sp -= dt) <= 0) {
      e.sp = rand(3.5, 5.5) * (e.enraged ? .7 : 1);
      if (Math.random() < .5) { S.rings.push({ x: e.x, z: e.z, r: R, life: 2.4, hit: [] }); ev({ k: 'ring', x: r2(e.x), z: r2(e.z), r: R }); }
      else { e.ch = .9; e.cdx = dx / d; e.cdz = dz / d; e.chHit = []; ev({ k: 'roar', x: r2(e.x), z: r2(e.z), yaw: r2(e.yaw) }); }
    }
  }
  S.enemies = S.enemies.filter(e => !e.dead);
}
function stepRings(dt) {
  for (const g of S.rings) {
    g.life -= dt; g.r += 11 * dt;
    for (const p of players()) if (!p.down && !g.hit.includes(p.id) && Math.abs(Math.hypot(p.x - g.x, p.z - g.z) - g.r) < .7 && p.y < .6) { g.hit.push(p.id); enemyHits(p, 20, null); }
  }
  S.rings = S.rings.filter(g => g.life > 0);
}

// ===================== per-player upkeep (buffs, crown, regen, combo) =====================
function stepPlayers(dt) {
  for (const p of players()) {
    S.actor = p.id;
    if (p.id !== 'h' && !p.ai) for (const k in p.bf) if (p.bf[k] > 0) p.bf[k] -= dt; // the host's own buffs tick in stepMove
    if ((p.comboT -= dt) <= 0) p.combo = 0;
    if (p.down || S.phase !== 'fight') continue;
    const st = stats(p);
    p.ult = Math.min(1, p.ult + dt * .008 * st.ultMul);
    if ((p.regenT += dt) >= .5) {
      p.regenT = 0;
      p.hpHist.push(p.hp); if (p.hpHist.length > 7) p.hpHist.shift();
      if (p.cur === 'nature') p.hp = Math.min(p.max, p.hp + .75);
      if (p.bf.bloom > 0) heal(p, 3.75);
    }
    if (p.bf.shell <= 0 && p.bd.shell > 0) { p.bd.shell = 0; shellBurst(p); }
    if (p.bd.heat > 0) p.bd.heat = Math.max(0, p.bd.heat - 15 * dt); // Plasma Heat cools off
    if (p.bd.arc > 0 && (p.bd.arcT -= dt) <= 0) p.bd.arc = 0;      // Arcane charges fade when you stop casting
    if (p.cur === 'blades') { // Sword Halo: a sword forms every 2.5 s, and an orbiting sword cuts down anything that gets close
      if ((p.bd.swordT = (p.bd.swordT ?? 2.5) - dt) <= 0) { p.bd.swordT = 2.5; p.bd.swords = Math.min(6, (p.bd.swords || 0) + 1); }
      const e = p.bd.swords > 0 && (p.bd.guardT = (p.bd.guardT || 0) - dt) <= 0 && nearest(p.x, p.z, 3);
      if (e) { p.bd.guardT = .35; p.bd.swords--; const q = center(e); ev({ k: 'fx', m: 'blades.0', f: 'guard', id: p.id, x: r2(q.x), y: r2(q.y), z: r2(q.z) }); hitEnemy(e, 'blades', 18 * st.dmgMul, p, e.x - p.x, e.z - p.z, 4); }
    }
    if (p.dashes !== p.novaN) { p.novaN = p.dashes; if (st.nova) { blast(p.x, p.z, 4.5, 15 * st.dmgMul, { p, el: p.cur }, { kb: 6 }); ev({ k: 'fx', m: p.cur + '.0', f: 'nova', x: r2(p.x), z: r2(p.z) }); } }
    if (st.storm && (p.stormT = (p.stormT ?? 3) - dt) <= 0) {
      p.stormT = 3 / st.storm;
      const e = nearest(p.x, p.z, 16);
      if (e) { const c = center(e); ev({ k: 'crown', el: p.cur, pts: [[c.x, c.y + 14, c.z], [c.x, c.y, c.z]].map(a => a.map(r2)) }); hitEnemy(e, p.cur, 30 * st.dmgMul, p, 0, 0, 0); }
    }
  }
  S.actor = null;
}
function stepRevive(dt) {
  const ps = players();
  for (const p of ps) {
    if (!p.down) continue;
    const m = mate(p);
    if (m && !m.down && Math.hypot(m.x - p.x, m.z - p.z) < 2.4) {
      p.rev += dt / (stats(m).bond ? 1.5 : 3);
      if (p.rev >= 1) { p.down = false; p.hp = p.max * (stats(m).bond ? .6 : .4); ev({ k: 'up', id: p.id }); }
    } else p.rev = Math.max(0, p.rev - dt * .5);
  }
  if (ps.length && ps.every(p => p.down) && S.phase === 'fight') { S.phase = 'over'; ev({ k: 'over', wave: S.wave }); }
}

// ===================== pickups (health orbs dropped by enemies) =====================
function dropOrb(x, z, kind) { S.ents.push({ id: S.nid++, mv: 'orb', el: kind, x, y: .6, z, r: .5, life: 14, max: 14, t: 0, hit: {}, s: 0 }); }
MOVE.orb = { key: 'orb', ent: { tick(n) {
  for (const p of players()) if (!p.down && Math.hypot(p.x - n.x, p.z - n.z) < 1.4 && p.y < 2) {
    if (n.el === 'big') { for (const q of players()) heal(q, q.max * .5); addUlt(p, .25); } else heal(p, 18);
    ev({ k: 'pickup', id: p.id, x: r2(n.x), z: r2(n.z), big: n.el === 'big' ? 1 : 0 }); n.dead = true; return;
  }
} } };

// ===================== waves =====================
function startWave() {
  S.wave++; const boss = S.wave % 5 === 0;
  S.mod = !boss && S.wave > 1 && Math.random() < .34 ? pick(['swarm', 'haste', 'darkness', 'elite']) : null;
  S.budget = Math.round(waveBudget(S.wave) * (S.mod === 'swarm' ? 1.6 : 1) * (boss ? .5 : 1) * (S.players.g ? 1 : .6));
  S.bossLeft = boss ? 1 : 0; S.eliteLeft = S.mod === 'elite' ? 1 : 0; S.spawnT = 1.5; S.phase = 'fight';
  ev({ k: 'wave', n: S.wave, mod: S.mod, boss });
}
function stepSpawner(dt) {
  if (S.phase === 'rest') { if ((S.restT -= dt) <= 0) startWave(); return; }
  if (S.phase !== 'fight') return;
  if ((S.spawnT -= dt) <= 0 && (S.budget > 0 || S.bossLeft)) {
    S.spawnT = rand(1.3, 2.6) * (S.mod === 'swarm' ? .6 : 1);
    const a = rand(0, TAU);
    if (S.bossLeft) { S.bossLeft = 0; spawnEnemy('boss', Math.sin(a) * 15, Math.cos(a) * 15); }
    for (let n = 1 + Math.floor(Math.random() * 4); n > 0 && S.budget > 0; n--) {
      const pool = Object.keys(ET).filter(k => ET[k].cost && !ET[k].zone && ET[k].from <= S.wave && ET[k].cost <= S.budget);
      if (!pool.length) { S.budget = 0; break; }
      const type = weighted(pool, k => 1 / ET[k].cost), b = a + rand(-.4, .4), elite = S.eliteLeft > 0;
      S.budget -= ET[type].cost; if (elite) S.eliteLeft--;
      spawnEnemy(type, Math.sin(b) * 19.5, Math.cos(b) * 19.5, elite);
    }
  }
  if (S.budget <= 0 && !S.bossLeft && !S.enemies.length) endWave();
}
function endWave() {
  for (const p of players()) {
    if (p.down) { p.down = false; p.hp = p.max * .4; ev({ k: 'up', id: p.id }); }
    p.hp = Math.min(p.max, p.hp + p.max * .15);
    p.ch = null; p.chg = null;
  }
  S.rings = []; S.shots = []; S.ents = S.ents.filter(n => n.mv === 'orb'); S.timers = []; S.tstop = 0;
  S.phase = 'rest'; S.restT = 4; // short breather, then the next wave (no upgrade picks)
  ev({ k: 'clear', n: S.wave });
}
function hostStep(dt) {
  if (S.hitstop > 0) { S.hitstop -= dt; dt *= .06; }
  else if (S.slowmo > 0) { S.slowmo -= dt; dt *= .3; }
  S.t += dt;
  const h = S.players.h, g = S.players.g, frozen = S.mode === 'duel' && S.phase !== 'fight'; // duel countdowns hold both wizards still
  if (S.mode === 'duel') syncStandIns();
  if (h) { h.inp = frozen ? idleInput(localInput(), h) : localInput(); stepMove(h, h.inp, dt); S.actor = 'h'; stepCast(h, h.inp, dt); }
  if (g) { if (g.ai) { g.inp = frozen ? idleInput(g.inp, g) : duelAI(g, dt); stepMove(g, g.inp, dt); } S.actor = 'g'; stepCast(g, frozen ? idleInput(g.inp, g) : g.inp, dt); }
  S.actor = null;
  stepTimers(dt);
  for (let k = 0, n = Math.ceil(dt / .017); k < n; k++) stepShots(dt / n); // ~60 Hz projectile steps even on a slow host, so fast shots can't skip past enemies
  stepEnts(dt); stepEnemies(dt); stepRings(dt); stepPlayers(dt);
  if (S.mode === 'duel') stepDuel(dt);
  else { stepRevive(dt); if (S.mode === 'dungeon') stepDungeon(dt); else stepSpawner(dt); }
}
// look around but nothing pressed: the press counters are the player's own, so nothing reads as a new dash / jump / swap
const idleInput = (i, p) => ({ yaw: i?.yaw ?? p.yaw, pitch: i?.pitch ?? p.pitch, k: [], mx: 0, mz: 0, jump: false, dashN: p.dashN, jumpN: p.jumpN, swapN: p.swapN });
