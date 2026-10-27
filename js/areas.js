// Arena areas: every 10 waves the arena turns into the next realm, with its own monsters, two bosses (waves 5 and 10
// of the area) and its own sky and light. After the fifth area it starts over, harder. Mage City keeps the Shadow roster.
// Loaded after sim.js / modes.js (uses ET, startAttack, enemyHits...) and before view.js.
'use strict';

// ===================== the new monsters (zone = their area; from = first wave of the area they appear on) =====================
// atk / alt: the usual attack kinds (sim.js) plus the area kinds below (FOE_ATK). Bosses: spec = the specials they pick from.
const C_POI = 0x8aff50, C_SOUL = 0x7ae8ff, C_ICE = 0x9fe6ff, C_FIRE = 0xff6a1a, C_VOID = 0xb04cff;
Object.assign(ET, {
  // ---------- 2: the Undead Crypt ----------
  zombie:     { hp: 55,  spd: 2.7, r: .5,  h: 1.8, dmg: 12, reach: 1.9, cost: 1, from: 1, kb: .9,  poise: 35,  atk: 'swipe', wind: .55, cd: 1.4, zone: 'crypt',
    alt: { atk: 'lob', min: 4, max: 14, wind: .9, cd: 7, dmg: 8, r: 1.9, c: C_POI, s: 'bile', pool: { life: 4, dps: 8 } } },
  bonehound:  { hp: 26,  spd: 7.2, r: .45, h: 1.0, dmg: 8,  reach: 3.2, cost: 1, from: 2, kb: 1.4, poise: 15,  atk: 'lunge', wind: .36, cd: 1.5, zone: 'crypt',
    alt: { atk: 'lunge', min: 0, max: 3.5, wind: .36, cd: 5, dmg: 7, chain: 2 } },
  banshee:    { hp: 36,  spd: 3.2, r: .5,  h: 2.1, dmg: 9,  reach: 26,  cost: 3, from: 3, kb: 1,   poise: 22,  atk: 'orb',   wind: .7,  cd: 2.2, ranged: 1, keep: [8, 14], oc: C_SOUL, zone: 'crypt',
    alt: { atk: 'cone', min: 0, max: 10, wind: .8, cd: 6, dmg: 10, r: 10, ang: 50, c: C_SOUL, s: 'wail', chill: 1.5 } },
  bloater:    { hp: 40,  spd: 3.6, r: .6,  h: 1.4, dmg: 22, reach: 2.4, cost: 2, from: 3, kb: 1.1, poise: 10,  atk: 'fuse',  wind: .95, cd: 9, zone: 'crypt', pool: { r: 3.2, life: 5, dps: 9, c: C_POI, s: 'bile' } },
  colossus:   { hp: 210, spd: 2.1, r: 1.1, h: 2.8, dmg: 24, reach: 3.4, cost: 5, from: 5, kb: .25, poise: 140, atk: 'smash', wind: .95, cd: 2.1, zone: 'crypt',
    alt: { atk: 'spikes', min: 4, max: 15, wind: 1.1, cd: 8, dmg: 20, c: 0xe8dcc0, s: 'bone' } },
  necromancer:{ hp: 62,  spd: 2.8, r: .55, h: 2.1, dmg: 0,  reach: 9,   cost: 4, from: 6, kb: 1,   poise: 30,  atk: 'summon', wind: 1.2, cd: 7, ranged: 1, keep: [12, 18], zone: 'crypt', n: 2, type: 'zombie', cap: 6,
    alt: { atk: 'hex', min: 0, max: 22, wind: 1.2, cd: 5, dmg: 13 } },
  lich:       { hp: 1500, spd: 2.4, r: .9, h: 3.6, dmg: 14, reach: 26, cost: 0, from: 99, kb: .04, poise: 650, atk: 'volley', wind: .9, cd: 2.4, boss: 1, ranged: 1, keep: [8, 14], oc: C_SOUL, zone: 'crypt',
    name: 'The Lich King', minions: ['zombie', 'bonehound'],
    spec: [{ atk: 'rain', n: 4, r: 2.4, dmg: 18, c: 0xe8dcc0, s: 'bone' }, { atk: 'summon', wind: 1.2, n: 4, type: 'zombie', cap: 10 },
      { atk: 'nova', wind: 1.1, r: 7, dmg: 22, c: C_SOUL, s: 'soul', chill: 2 }, { atk: 'ray', wind: 1, len: 24, w: 1.6, dmg: 24, c: C_SOUL, s: 'soul' }] },
  bonedragon: { hp: 1900, spd: 2.3, r: 2.2, h: 4.4, dmg: 30, reach: 5, cost: 0, from: 99, kb: .04, poise: 700, atk: 'smash', wind: 1.05, cd: 2.2, boss: 1, zone: 'crypt',
    name: 'The Bone Dragon', minions: ['bonehound', 'zombie'],
    spec: [{ atk: 'cone', wind: 1.1, r: 15, ang: 55, dmg: 26, c: C_POI, s: 'breath', pool: { life: 4, dps: 10 } }, 'charge',
      { atk: 'rain', n: 3, r: 2.8, dmg: 22, c: 0xe8dcc0, s: 'bone' }, 'ring'] },

  // ---------- 3: the Frost Giants' Peaks ----------
  snowfiend:  { hp: 50,  spd: 3.7, r: .5,  h: 1.8, dmg: 11, reach: 1.9, cost: 1, from: 1, kb: 1,   poise: 30,  atk: 'swipe', wind: .5,  cd: 1.3, zone: 'frost',
    alt: { atk: 'lob', min: 4, max: 14, wind: .8, cd: 6, dmg: 10, r: 1.8, c: C_ICE, s: 'snow', chill: 1.5 } },
  icewolf:    { hp: 28,  spd: 7.4, r: .45, h: 1.0, dmg: 8,  reach: 3.2, cost: 1, from: 2, kb: 1.4, poise: 15,  atk: 'lunge', wind: .38, cd: 1.5, zone: 'frost',
    alt: { atk: 'cone', min: 0, max: 5.5, wind: .55, cd: 6, dmg: 9, r: 5.5, ang: 45, c: C_ICE, s: 'frost', chill: 2 } },
  icesprite:  { hp: 30,  spd: 3.2, r: .45, h: 2.2, dmg: 9,  reach: 26,  cost: 3, from: 3, kb: 1,   poise: 22,  atk: 'orb',   wind: .65, cd: 2.2, ranged: 1, keep: [10, 16], oc: C_ICE, zone: 'frost',
    alt: { atk: 'rain', min: 0, max: 24, cd: 8, n: 3, r: 1.7, dmg: 11, c: C_ICE, s: 'ice', chill: 1.5 } },
  frostmite:  { hp: 24,  spd: 6.4, r: .5,  h: 1.2, dmg: 20, reach: 2.4, cost: 2, from: 3, kb: 1.2, poise: 10,  atk: 'fuse',  wind: .95, cd: 9, zone: 'frost', pool: { r: 3.4, life: 5, dps: 4, c: C_ICE, s: 'ice', chill: 1 } },
  yeti:       { hp: 220, spd: 2.4, r: 1.1, h: 2.8, dmg: 24, reach: 3.4, cost: 5, from: 5, kb: .25, poise: 140, atk: 'smash', wind: .95, cd: 2.1, zone: 'frost',
    alt: { atk: 'lob', min: 5, max: 18, wind: 1.1, cd: 7, dmg: 22, r: 3, c: 0xd8f0ff, s: 'boulder' } },
  glacier:    { hp: 130, spd: 3.2, r: .65, h: 2.2, dmg: 17, reach: 3.6, cost: 4, from: 6, kb: .4,  poise: 85,  atk: 'thrust', wind: .6, cd: 1.7, shield: 1, zone: 'frost',
    alt: { atk: 'nova', min: 0, max: 4.5, wind: .8, cd: 7, dmg: 14, r: 4.5, c: C_ICE, s: 'ice', chill: 2 } },
  frostgiant: { hp: 1700, spd: 2.1, r: 2.2, h: 5.4, dmg: 30, reach: 5, cost: 0, from: 99, kb: .04, poise: 700, atk: 'smash', wind: 1.05, cd: 2.2, boss: 1, zone: 'frost',
    name: 'Hrimgar the Frost Giant', minions: ['snowfiend', 'icewolf'],
    spec: [{ atk: 'lob', wind: 1.2, r: 3.6, dmg: 26, c: 0xd8f0ff, s: 'boulder', pool: { life: 4, dps: 3, chill: 1 } }, { atk: 'spikes', wind: 1.1, dmg: 22, c: C_ICE, s: 'ice' },
      { atk: 'nova', wind: 1.2, r: 9, dmg: 22, c: C_ICE, s: 'ice', chill: 2.5 }, 'ring'] },
  frostqueen: { hp: 1800, spd: 2.6, r: 1, h: 3.8, dmg: 13, reach: 26, cost: 0, from: 99, kb: .04, poise: 650, atk: 'volley', wind: .85, cd: 2.2, boss: 1, ranged: 1, keep: [9, 15], oc: C_ICE, zone: 'frost',
    name: 'Skadi, the Frost Queen', minions: ['icewolf', 'icesprite'],
    spec: [{ atk: 'rain', n: 5, r: 2, dmg: 16, c: C_ICE, s: 'ice', chill: 1.5 }, { atk: 'cone', wind: 1.2, r: 17, ang: 70, dmg: 18, c: C_ICE, s: 'frost', chill: 3 },
      { atk: 'summon', wind: 1, n: 3, type: 'icewolf', cap: 8 }, { atk: 'ray', wind: 1, len: 26, w: 1.8, dmg: 24, c: C_ICE, s: 'ice', chill: 2 }] },

  // ---------- 4: the Infernal Legion ----------
  hellhound:  { hp: 28,  spd: 7.4, r: .45, h: 1.0, dmg: 9,  reach: 3.2, cost: 1, from: 1, kb: 1.4, poise: 15,  atk: 'lunge', wind: .36, cd: 1.5, zone: 'hell',
    alt: { atk: 'cone', min: 0, max: 6, wind: .55, cd: 6, dmg: 9, r: 6, ang: 40, c: C_FIRE, s: 'breath', pool: { life: 3, dps: 8 } } },
  cinderimp:  { hp: 32,  spd: 3.4, r: .45, h: 1.6, dmg: 9,  reach: 26,  cost: 3, from: 2, kb: 1,   poise: 22,  atk: 'orb',   wind: .65, cd: 2.1, ranged: 1, keep: [9, 15], oc: C_FIRE, zone: 'hell',
    alt: { atk: 'lob', min: 0, max: 20, wind: .85, cd: 7, dmg: 12, r: 2.2, c: C_FIRE, s: 'fire', pool: { life: 4, dps: 9 } } },
  magmaling:  { hp: 26,  spd: 6.2, r: .5,  h: 1.2, dmg: 24, reach: 2.4, cost: 2, from: 3, kb: 1.2, poise: 10,  atk: 'fuse',  wind: .95, cd: 9, zone: 'hell', pool: { r: 3.2, life: 5, dps: 10, c: C_FIRE, s: 'fire' } },
  infernal:   { hp: 210, spd: 2.3, r: 1.1, h: 2.8, dmg: 25, reach: 3.4, cost: 5, from: 5, kb: .25, poise: 140, atk: 'smash', wind: .95, cd: 2.1, zone: 'hell',
    alt: { atk: 'spikes', min: 4, max: 15, wind: 1.1, cd: 8, dmg: 20, c: C_FIRE, s: 'fire' } },
  hellknight: { hp: 130, spd: 3.3, r: .65, h: 2.2, dmg: 18, reach: 3.6, cost: 4, from: 5, kb: .4,  poise: 85,  atk: 'thrust', wind: .6, cd: 1.7, shield: 1, zone: 'hell',
    alt: { atk: 'bash', min: 4, max: 9, wind: .7, cd: 7, dmg: 16 } },
  pyrepriest: { hp: 60,  spd: 2.9, r: .55, h: 2.1, dmg: 0,  reach: 9,   cost: 4, from: 6, kb: 1,   poise: 30,  atk: 'buff',  wind: 1.1, cd: 6, ranged: 1, keep: [12, 18], zone: 'hell', r9: 10,
    alt: { atk: 'hex', min: 0, max: 22, wind: 1.1, cd: 5, dmg: 14 } },
  pitlord:    { hp: 1800, spd: 2.1, r: 2.2, h: 5.4, dmg: 31, reach: 5, cost: 0, from: 99, kb: .04, poise: 700, atk: 'smash', wind: 1.05, cd: 2.2, boss: 1, zone: 'hell',
    name: 'Azgaroth the Pit Lord', minions: ['hellhound', 'cinderimp'],
    spec: [{ atk: 'cone', wind: 1.1, r: 15, ang: 55, dmg: 26, c: C_FIRE, s: 'breath', pool: { life: 4, dps: 12 } }, 'meteor', 'ring', 'charge'] },
  archdemon:  { hp: 1900, spd: 2.5, r: 1.4, h: 4.4, dmg: 28, reach: 4, cost: 0, from: 99, kb: .04, poise: 700, atk: 'swipe', wind: .8, cd: 1.8, boss: 1, zone: 'hell',
    name: 'Belphegor the Archdemon', minions: ['hellhound', 'magmaling'],
    alt: { atk: 'blink', min: 7, max: 22, wind: .7, cd: 7, dmg: 26 },
    spec: [{ atk: 'ray', wind: 1, len: 26, w: 2, dmg: 26, c: C_FIRE, s: 'fire', pool: { life: 3, dps: 10 } }, { atk: 'summon', wind: 1, n: 3, type: 'hellhound', cap: 8 },
      { atk: 'nova', wind: 1.1, r: 8, dmg: 24, c: C_FIRE, s: 'fire', pool: { life: 3, dps: 10 } }, { atk: 'rain', n: 4, r: 2.4, dmg: 20, c: C_FIRE, s: 'meteor' }] },

  // ---------- 5: the Void ----------
  voidling:   { hp: 30,  spd: 6.8, r: .45, h: 1.1, dmg: 9,  reach: 3.2, cost: 1, from: 1, kb: 1.4, poise: 15,  atk: 'lunge', wind: .36, cd: 1.5, zone: 'void',
    alt: { atk: 'blink', min: 5, max: 16, wind: .5, cd: 6, dmg: 10 } },
  gazer:      { hp: 34,  spd: 3,   r: .6,  h: 2.3, dmg: 9,  reach: 26,  cost: 3, from: 2, kb: 1,   poise: 25,  atk: 'orb',   wind: .65, cd: 2.2, ranged: 1, keep: [10, 16], oc: C_VOID, zone: 'void',
    alt: { atk: 'ray', min: 0, max: 24, wind: 1, cd: 7, dmg: 16, len: 26, w: 1.2, c: C_VOID, s: 'void' } },
  riftmite:   { hp: 26,  spd: 6.2, r: .5,  h: 1.2, dmg: 22, reach: 2.4, cost: 2, from: 3, kb: 1.2, poise: 10,  atk: 'fuse',  wind: .95, cd: 9, zone: 'void', pool: { r: 3.6, life: 4, dps: 7, c: C_VOID, s: 'void', pull: 1 } },
  voidspawn:  { hp: 70,  spd: 2.8, r: .65, h: 1.0, dmg: 12, reach: 2.0, cost: 2, from: 4, kb: .8,  poise: 40,  atk: 'slam',  wind: .55, cd: 1.4, split: 1, zone: 'void',
    alt: { atk: 'leap', min: 3.5, max: 8, wind: .5, cd: 6, dmg: 12 } },
  horror:     { hp: 220, spd: 2.3, r: 1.1, h: 2.8, dmg: 24, reach: 3.4, cost: 5, from: 5, kb: .25, poise: 140, atk: 'smash', wind: .95, cd: 2.1, zone: 'void',
    alt: { atk: 'spikes', min: 4, max: 15, wind: 1.1, cd: 8, dmg: 20, c: C_VOID, s: 'tentacle' } },
  mindflayer: { hp: 62,  spd: 2.9, r: .55, h: 2.1, dmg: 0,  reach: 9,   cost: 4, from: 6, kb: 1,   poise: 30,  atk: 'mend',  wind: 1.1, cd: 4, ranged: 1, keep: [12, 18], zone: 'void',
    alt: { atk: 'pull', min: 4, max: 20, wind: .9, cd: 6, dmg: 8, len: 20, w: 1.8, c: C_VOID } },
  watcher:    { hp: 1700, spd: 2, r: 1.6, h: 5.2, dmg: 14, reach: 26, cost: 0, from: 99, kb: .04, poise: 650, atk: 'volley', wind: .85, cd: 2.2, boss: 1, ranged: 1, keep: [10, 16], oc: C_VOID, zone: 'void',
    name: 'The Watcher Beyond', minions: ['voidling', 'gazer'],
    spec: [{ atk: 'ray', wind: 1, len: 28, w: 2, dmg: 26, c: C_VOID, s: 'void', n: 3 }, { atk: 'rain', n: 4, r: 2.4, dmg: 20, c: C_VOID, s: 'void' },
      { atk: 'nova', wind: 1.1, r: 8, dmg: 22, c: C_VOID, s: 'void' }, { atk: 'summon', wind: 1, n: 2, type: 'gazer', cap: 6 }] },
  devourer:   { hp: 2000, spd: 2.1, r: 2.2, h: 5, dmg: 31, reach: 5, cost: 0, from: 99, kb: .04, poise: 700, atk: 'smash', wind: 1.05, cd: 2.2, boss: 1, zone: 'void',
    name: 'The Devourer of Stars', minions: ['voidling', 'voidspawn'],
    spec: [{ atk: 'spikes', wind: 1.1, dmg: 24, c: C_VOID, s: 'tentacle', n: 3 }, { atk: 'pull', wind: 1, len: 24, w: 3, dmg: 10, c: C_VOID, then: 'nova' },
      { atk: 'rain', n: 4, r: 2.6, dmg: 20, c: C_VOID, s: 'void' }, { atk: 'nova', wind: 1.1, r: 9, dmg: 24, c: C_VOID, s: 'void', pool: { life: 4, dps: 7, pull: 1 } }] },

  // ---------- 1: the Shadow Realm's second boss ----------
  umbra:      { hp: 1500, spd: 2.6, r: 1.3, h: 4.2, dmg: 26, reach: 4, cost: 0, from: 99, kb: .04, poise: 650, atk: 'swipe', wind: .8, cd: 1.8, boss: 1,
    name: 'Nyx, the Umbral Wraith', minions: ['stalker', 'grunt'],
    alt: { atk: 'blink', min: 7, max: 22, wind: .7, cd: 6, dmg: 26 },
    spec: [{ atk: 'summon', wind: 1, n: 3, type: 'stalker', cap: 6 }, { atk: 'rain', n: 4, r: 2.4, dmg: 18, c: 0x9a4cff, s: 'shadow' },
      { atk: 'cone', wind: 1, r: 14, ang: 60, dmg: 22, c: 0x9a4cff, s: 'shadow' }, { atk: 'nova', wind: 1.1, r: 8, dmg: 22, c: 0x9a4cff, s: 'shadow' }] },
});
ET.boss.name = 'The Obsidian Tyrant'; ET.warden.name = 'The Bone Warden';

const AREAS = [
  { id: 'shadow', name: 'The Shadow Realm', zone: undefined, bosses: ['boss', 'umbra'] },
  { id: 'crypt', name: 'The Undead Crypt', zone: 'crypt', bosses: ['lich', 'bonedragon'] },
  { id: 'frost', name: 'The Frost Giants\' Peaks', zone: 'frost', bosses: ['frostgiant', 'frostqueen'] },
  { id: 'hell', name: 'The Infernal Legion', zone: 'hell', bosses: ['pitlord', 'archdemon'] },
  { id: 'void', name: 'The Void', zone: 'void', bosses: ['watcher', 'devourer'] },
];
const areaIdx = w => Math.floor(Math.max(0, w - 1) / 10) % AREAS.length;
const areaNow = () => S.mode === 'arena' ? AREAS[areaIdx(S.wave)] : AREAS[0]; // Mage City keeps the Shadow roster
const areaWave = w => (Math.max(1, w) - 1) % 10 + 1; // 1..10 within the area

// ===================== player-side effects of the new attacks =====================
function foeHit(p, dmg, e, al) {
  const ok = enemyHits(p, dmg, e);
  if (ok && al?.chill) p.bf.chill = Math.max(p.bf.chill || 0, al.chill); // chilled: you move at 55% for a moment
  return ok;
}
function shove(p, vx, vz, vy = 0) { const k = p.kick ??= [0, 0, 0]; k[0] += vx; k[1] += vz; k[2] += vy; } // the owner applies it (see stepMove)
// lingering ground hazards: poison, burning ground, ice, void rifts (tick every half second)
function addPool(x, z, r, o, base = {}) {
  const q = { ...base, ...o }; if (!q.life) return;
  (S.hz ||= []).push({ x, z, r, life: q.life, dps: q.dps || 0, chill: q.chill || 0, pull: q.pull || 0, t: 0 });
  ev({ k: 'fx', m: 'foe', f: 'pool', x: r2(x), z: r2(z), r: r2(r), l: q.life, c: q.c ?? base.c ?? 0x8aff50, s: q.s || base.s || '' });
}
function stepHazards(dt) {
  if (!S.hz?.length) return;
  for (const h of S.hz) {
    h.life -= dt; h.t -= dt; const tick = h.t <= 0; if (tick) h.t = .5;
    for (const p of players()) {
      if (p.down || p.y > 1.2) continue;
      const dx = h.x - p.x, dz = h.z - p.z, d = Math.hypot(dx, dz);
      if (d > h.r) continue;
      if (h.pull && d > .8 && tick) shove(p, dx / d * 3.5, dz / d * 3.5);
      if (h.chill) p.bf.chill = Math.max(p.bf.chill || 0, .6);
      if (tick && h.dps) hurt(p, h.dps * .5 * (1 + .06 * (S.wave - 1)), null);
    }
  }
  S.hz = S.hz.filter(h => h.life > 0);
}

// ===================== the new attack kinds =====================
// start(e, tgt, al, yaw) → the ground warning (or 'done' if the attack plays out by itself); hit(e, a, dmg, ps) when the windup ends
const near = (e, ps) => ps.reduce((b, p) => !b || Math.hypot(p.x - e.x, p.z - e.z) < Math.hypot(b.x - e.x, b.z - e.z) ? p : b, null);
const FOE_ATK = {
  cone: { // a breath, a wail, a blizzard: everything in front
    start: (e, t, al, yaw) => ({ shape: 'cone', x: e.x, z: e.z, yaw, r: al.r, ang: al.ang }),
    hit(e, a, dmg, ps) {
      const al = a.al;
      ev({ k: 'fx', m: 'foe', f: 'cone', x: r2(e.x), y: r2(e.y + ET[e.type].h * e.sc * .7), z: r2(e.z), yaw: r2(a.yaw), r: al.r, ang: al.ang, c: al.c, s: al.s });
      for (const p of ps) if (inCone(p, e.x, e.z, a.yaw, al.r + .4, al.ang + 6) && p.y < 3) foeHit(p, dmg, e, al);
      if (al.pool) for (let i = 1; i <= 2; i++) addPool(e.x + Math.sin(a.yaw) * al.r * i / 3, e.z + Math.cos(a.yaw) * al.r * i / 3, al.r * .25, al.pool, al);
    },
  },
  lob: { // an arcing throw onto where you stand: bile, snowballs, boulders, fireballs
    start(e, t, al, yaw) {
      Object.assign(e.atk, { lx: t.x, lz: t.z });
      ev({ k: 'fx', m: 'foe', f: 'lob', x: r2(e.x), y: r2(e.y + ET[e.type].h * e.sc * .9), z: r2(e.z), x2: r2(t.x), z2: r2(t.z), d: r2(e.atk.max), c: al.c, s: al.s });
      return { shape: 'circle', x: t.x, z: t.z, r: al.r };
    },
    hit(e, a, dmg, ps) {
      const al = a.al;
      ev({ k: 'fx', m: 'foe', f: 'splash', x: r2(a.lx), z: r2(a.lz), r: al.r, c: al.c, s: al.s });
      for (const p of ps) if (Math.hypot(p.x - a.lx, p.z - a.lz) < al.r + .3 && p.y < 1.6) foeHit(p, dmg, e, al);
      if (al.pool) addPool(a.lx, a.lz, al.r, al.pool, al);
    },
  },
  ray: { // a beam down a marked lane (n: several in a fan)
    start: (e, t, al, yaw) => ({ shape: 'line', x: e.x, z: e.z, yaw, len: al.len, w: al.w }),
    hit(e, a, dmg, ps) {
      const al = a.al, n = al.n || 1;
      for (let i = 0; i < n; i++) {
        const yaw = a.yaw + (i - (n - 1) / 2) * .45;
        if (i) ev({ k: 'tele', shape: 'line', x: r2(e.x), z: r2(e.z), yaw: r2(yaw), len: al.len, w: al.w, d: .01 });
        ev({ k: 'fx', m: 'foe', f: 'ray', x: r2(e.x), y: r2(e.y + ET[e.type].h * e.sc * .7), z: r2(e.z), yaw: r2(yaw), len: al.len, w: al.w, c: al.c });
        for (const p of ps) if (inLine(p, e.x, e.z, yaw, al.len, al.w) && p.y < 2.5) foeHit(p, dmg, e, al);
        if (al.pool) for (let j = 1; j <= 3; j++) addPool(e.x + Math.sin(yaw) * al.len * j / 4, e.z + Math.cos(yaw) * al.len * j / 4, al.w, al.pool, al);
      }
    },
  },
  nova: { // a burst all around itself
    start: (e, t, al) => ({ shape: 'circle', x: e.x, z: e.z, r: al.r }),
    hit(e, a, dmg, ps) {
      const al = a.al;
      ev({ k: 'fx', m: 'foe', f: 'nova', x: r2(e.x), z: r2(e.z), r: al.r, c: al.c, s: al.s });
      for (const p of ps) if (Math.hypot(p.x - e.x, p.z - e.z) < al.r + .3 && p.y < 2) foeHit(p, dmg, e, al);
      if (al.pool) addPool(e.x, e.z, al.r * .6, al.pool, al);
    },
  },
  spikes: { // a rolling line of spikes (bone, ice, fire geysers, tentacles) out from it (n: several directions)
    start: (e, t, al, yaw) => ({ shape: 'line', x: e.x, z: e.z, yaw, len: 16, w: 2.6 }),
    hit(e, a, dmg, ps) {
      const al = a.al, n = al.n || 1, x0 = e.x, z0 = e.z, R = ET[e.type].r * e.sc, hit = new Set();
      for (let j = 0; j < n; j++) {
        const yaw = a.yaw + (j - (n - 1) / 2) * (TAU / Math.max(3, n)), fx = Math.sin(yaw), fz = Math.cos(yaw);
        if (j !== (n - 1) / 2) ev({ k: 'tele', shape: 'line', x: r2(x0), z: r2(z0), yaw: r2(yaw), len: 16, w: 2.6, d: .01 });
        for (let i = 0; i < 7; i++) later(i * .07, () => {
          const x = x0 + fx * (R + 1 + i * 2.1), z = z0 + fz * (R + 1 + i * 2.1);
          ev({ k: 'fx', m: 'foe', f: 'spike', x: r2(x), z: r2(z), i, c: al.c, s: al.s });
          for (const p of players()) if (!p.down && !hit.has(p.id) && Math.hypot(p.x - x, p.z - z) < 1.7 && p.y < 1) { hit.add(p.id); foeHit(p, dmg, e, al); }
        });
      }
    },
  },
  rain: { // things falling from the sky onto marked circles round every player (no windup: the circles are the warning)
    start(e, t, al) {
      const ps = players().filter(p => !p.down), sc = 1 + .06 * (S.wave - 1), dmg = al.dmg * sc * (e.elite ? 1.5 : 1);
      ev({ k: 'strike', id: e.id, a: 'call' }); e.acd = Math.max(e.acd, 1.2);
      for (const p of ps) for (let i = 0; i < al.n; i++) {
        const q = i ? confine({ x: p.x + rand(-4, 4), z: p.z + rand(-4, 4) }, 1) : { x: p.x, z: p.z }, d = 1.1 + i * .35;
        ev({ k: 'tele', a: 'meteor', s: al.s, c: al.c, shape: 'circle', x: r2(q.x), z: r2(q.z), r: al.r, d: r2(d) });
        later(d, () => {
          ev({ k: 'fx', m: 'foe', f: 'impact', x: r2(q.x), z: r2(q.z), r: al.r, c: al.c, s: al.s });
          for (const o of players()) if (!o.down && Math.hypot(o.x - q.x, o.z - q.z) < al.r + .3 && o.y < 1.5) foeHit(o, dmg, e, al);
          if (al.pool) addPool(q.x, q.z, al.r, al.pool, al);
        });
      }
      return 'done';
    },
  },
  summon: { // raise helpers round itself (capped)
    start: (e, t, al) => ({ shape: 'circle', x: e.x, z: e.z, r: 3, ally: 1 }),
    hit(e, a) {
      const al = a.al, t = ET[e.type], type = al.type || t.type, n = al.n || t.n || 2, cap = al.cap || t.cap || 6;
      const have = S.enemies.filter(o => !o.dead && o.type === type).length;
      ev({ k: 'fx', m: 'foe', f: 'summon', x: r2(e.x), z: r2(e.z), c: RIMC[e.type] || 0xff3050 });
      for (let i = 0; i < Math.min(n, cap - have); i++) { const ang = TAU * i / n + rand(-.3, .3), q = confine({ x: e.x + Math.sin(ang) * 3, z: e.z + Math.cos(ang) * 3 }, 1); spawnEnemy(type, q.x, q.z); }
    },
  },
  buff: { // a war-chant: nearby monsters fight 40% faster for 6 s
    start: (e, t, al) => ({ shape: 'circle', x: e.x, z: e.z, r: 10, ally: 1 }),
    hit(e) {
      ev({ k: 'fx', m: 'foe', f: 'buff', x: r2(e.x), z: r2(e.z), r: 10 });
      for (const o of enemiesNear(e.x, e.z, 10)) if (o !== e) o.rage = S.t + 6;
    },
  },
  pull: { // yanks you toward it down a marked lane (then: an attack that follows straight on)
    start: (e, t, al, yaw) => ({ shape: 'line', x: e.x, z: e.z, yaw, len: al.len, w: al.w }),
    hit(e, a, dmg, ps) {
      const al = a.al;
      ev({ k: 'fx', m: 'foe', f: 'pull', x: r2(e.x), y: r2(e.y + ET[e.type].h * e.sc * .6), z: r2(e.z), yaw: r2(a.yaw), len: al.len, c: al.c });
      for (const p of ps) if (inLine(p, e.x, e.z, a.yaw, al.len, al.w) && p.y < 2.5 && foeHit(p, dmg, e, al)) {
        const dx = e.x - p.x, dz = e.z - p.z, d = Math.hypot(dx, dz) || 1, k = Math.min(16, (d - ET[e.type].r * e.sc - 1.5) * 3.2);
        if (k > 0) shove(p, dx / d * k, dz / d * k, 3);
      }
      if (al.then) { const sp = ET[e.type].spec.find(s => s.atk === al.then); const p = near(e, ps); if (sp && p) later(.55, () => { if (!e.dead && !e.atk && !e.cc) startAttack(e, p, sp); }); }
    },
  },
};
const RIMC = { necromancer: 0x9a6aff, lich: 0x7ae8ff, frostqueen: 0x9fe6ff, archdemon: 0xff6a1a, watcher: 0xb04cff, umbra: 0x9a4cff };

// ===================== atmosphere =====================
// the drifting motes of the island you stand on (set by the island code): 1 crypt ash, 2 frost snow, 3 hell embers, 4 void sparks
let areaFog = .007, areaMote = 0, areaFire = 0xff8a3a;
// the drifting motes, every frame round the camera
function areaMotes(dt) {
  if (!areaMote || !arena.visible) return;
  const n = areaMote === 2 ? 3 : 1, cx = camera.position.x, cz = camera.position.z;
  for (let i = 0; i < n; i++) {
    if (Math.random() > (areaMote === 2 ? 1 : .6)) continue;
    const x = cx + rand(-22, 22), z = cz + rand(-22, 22);
    if (areaMote === 2) emit(x, rand(6, 14), z, rand(-.6, .6) + .8, -rand(1.2, 2.2), rand(-.6, .6), 0xffffff, rand(.05, .1), rand(4, 6), 0, .1); // snow
    else if (areaMote === 3) emit(x, rand(0, 2), z, rand(-.3, .3), rand(1.5, 3), rand(-.3, .3), Math.random() < .5 ? 0xff8a3a : 0xffc060, rand(.05, .12), rand(1.5, 3), -.3, .4); // embers rising
    else if (areaMote === 1) emit(x, rand(2, 8), z, rand(-.3, .3), -rand(.2, .5), rand(-.3, .3), 0x8a9a88, rand(.06, .12), rand(3, 5), 0, .2); // ash
    else emit(x, rand(.5, 5), z, rand(-.5, .5), rand(-.3, .3), rand(-.5, .5), Math.random() < .5 ? 0xc890ff : 0x7a4cff, rand(.05, .1), rand(1.5, 3), 0, .3); // void sparks
  }
}
