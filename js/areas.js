// Arena areas: every 5 waves the arena moves on to the next realm, with its own monsters, two bosses (one on each area's 5th wave,
// of the area) and its own sky and light. After the fifth area it starts over, harder. Mage City keeps the Shadow roster.
// Loaded after sim.js / modes.js (uses ET, startAttack, enemyHits...) and before view.js.
'use strict';

// ===================== the new monsters (zone = their area; from = first wave of the area they appear on) =====================
// atk / alt: the usual attack kinds (sim.js) plus the area kinds below (FOE_ATK). Bosses: spec = the specials they pick from.
const C_POI = 0x8aff50, C_SOUL = 0x7ae8ff, C_ICE = 0x9fe6ff, C_FIRE = 0xff6a1a, C_VOID = 0xb04cff;
Object.assign(ET, {
  // ---------- 2: the Undead Crypt ----------
  // Grave Crawler: when you're far off it sinks into the soil, tunnels under you and bursts up beneath your feet
  crawler:    { hp: 45,  spd: 3,   r: .5,  h: 1.0, dmg: 11, reach: 1.9, cost: 1, from: 1, kb: 1,   poise: 30,  atk: 'swipe', wind: .5,  cd: 1.4, zone: 'crypt', name: 'Grave Crawler',
    erupt: { atk: 'erupt', wind: .75, dmg: 16, r: 2.2 },
    tick(e, dt, tgt, d) {
      if (e.atk) return false;
      if (!e.under) { if ((e.bcd = (e.bcd ?? 2) - dt) <= 0 && d > 6) { Object.assign(e, { under: 1, gone: 1, vs: 'under', ut: 0 }); ev({ k: 'fx', m: 'foe', f: 'burrow', x: r2(e.x), z: r2(e.z) }); } return false; }
      e.ut += dt; e.x += (tgt.x - e.x) / d * 8.5 * dt; e.z += (tgt.z - e.z) / d * 8.5 * dt; e.yaw = Math.atan2(tgt.x - e.x, tgt.z - e.z);
      if (d < 1.6 || e.ut > 4) startAttack(e, tgt, ET.crawler.erupt);
      return true;
    } },
  // Bone Archer: keeps its distance, draws and tracks you, then the aim locks (a thin line) and the arrow crosses the whole field; hops back if you close in
  bonearcher: { hp: 30,  spd: 3.4, r: .45, h: 1.9, dmg: 20, reach: 30,  cost: 2, from: 2, kb: 1.1, poise: 18,  atk: 'snipe', wind: 1.5, cd: 3.2, ranged: 1, keep: [14, 22], zone: 'crypt', name: 'Bone Archer',
    alt: { atk: 'hop', min: 0, max: 6, cd: 5 } },
  // Plague Bearer: swings a reeking censer all round itself, leaves a trail of rot wherever it walks and bursts into a cloud when it dies
  plaguebearer: { hp: 85, spd: 2.5, r: .6, h: 2.0, dmg: 14, reach: 3,   cost: 2, from: 3, kb: .7,  poise: 50,  atk: 'censer', wind: .75, cd: 2.2, zone: 'crypt', name: 'Plague Bearer', cen: 3.4,
    tick(e) { if (Math.hypot(e.x - (e.px ?? 1e9), e.z - (e.pz ?? 1e9)) > 1.6) { e.px = e.x; e.pz = e.z; addPool(e.x, e.z, 1.3, { life: 6, dps: 7, c: C_POI, s: 'bile' }); } return false; },
    die(e) { if (!e.fall) addPool(e.x, e.z, 3.6, { life: 7, dps: 10, c: C_POI, s: 'bile' }); } },
  // Wailing Spirit: half in the other world, nothing touches it, except for a moment after it screams (and the scream throws you back)
  banshee:    { hp: 42,  spd: 3.6, r: .5,  h: 2.1, dmg: 12, reach: 7,   cost: 3, from: 4, kb: .9,  poise: 24,  atk: 'scream', wind: .85, cd: 2.6, zone: 'crypt', name: 'Wailing Spirit',
    tick(e) { e.vs = e.solid > S.t ? 0 : 'ghost'; return false; },
    ward: (e, n) => e.solid > S.t ? n : 0 },
  // Bone Golem: smash it down and it falls apart into a pile of bones, then pulls itself back together unless you finish the pile off
  colossus:   { hp: 220, spd: 2.1, r: 1.1, h: 2.8, dmg: 24, reach: 3.4, cost: 5, from: 5, kb: .25, poise: 140, atk: 'smash', wind: .95, cd: 2.1, zone: 'crypt', name: 'Bone Golem',
    alt: { atk: 'cage', min: 4, max: 16, wind: 1, cd: 7, dmg: 14, r: 2.4, c: 0xe8dcc0, s: 'bone' },
    tick(e, dt, tgt, d, ps) {
      if (!e.pile) return false;
      if (S.t < e.pile) return true;
      Object.assign(e, { pile: 0, vs: 0, hp: Math.min(e.max, e.hp + e.max * .25) });
      ev({ k: 'fx', m: 'foe', f: 'reform', x: r2(e.x), z: r2(e.z) });
      for (const p of ps) { const dx = p.x - e.x, dz = p.z - e.z, k = Math.hypot(dx, dz) || 1; if (k < 4 && foeHit(p, 12, e)) shove(p, dx / k * 10, dz / k * 10, 4); }
      return false;
    },
    ward: (e, n) => e.pile ? n * 1.5 : n,
    die(e) { if (e.rev || e.fall) return; Object.assign(e, { rev: 1, pile: S.t + 4, hp: e.max * .3, atk: null, vs: 'pile' }); ev({ k: 'fx', m: 'foe', f: 'collapse', x: r2(e.x), z: r2(e.z) }); return false; } },
  // Soulbinder: chains the souls of up to two monsters to its own, and while it lives nothing can hurt them; drains you down a beam
  necromancer:{ hp: 60,  spd: 2.8, r: .55, h: 2.1, dmg: 0,  reach: 12,  cost: 4, from: 6, kb: 1,   poise: 30,  atk: 'bind', wind: 1, cd: 4, ranged: 1, keep: [12, 18], zone: 'crypt', name: 'Soulbinder',
    alt: { atk: 'siphon', min: 0, max: 20, wind: 1, cd: 6, dmg: 12, len: 20, w: 1.4, c: C_SOUL, s: 'soul' },
    tick(e) { for (const o of S.enemies) if (o.bnd === e.id && (o.dead || Math.hypot(o.x - e.x, o.z - e.z) > 22)) o.bnd = 0; return false; },
    die(e) { for (const o of S.enemies) if (o.bnd === e.id) o.bnd = 0; } },
  lich:       { hp: 1500, spd: 2.4, r: .9, h: 3.6, dmg: 14, reach: 26, cost: 0, from: 99, kb: .04, poise: 650, atk: 'volley', wind: .9, cd: 2.4, boss: 1, ranged: 1, keep: [8, 14], oc: C_SOUL, zone: 'crypt',
    name: 'The Lich King', minions: ['crawler', 'bonearcher'] },
  bonedragon: { hp: 1900, spd: 2.3, r: 2.2, h: 4.4, dmg: 30, reach: 5, cost: 0, from: 99, kb: .04, poise: 700, atk: 'smash', wind: 1.05, cd: 2.2, boss: 1, zone: 'crypt',
    name: 'The Bone Dragon', minions: ['crawler', 'plaguebearer'] },

  // ---------- 3: the Frost Giants' Peaks ----------
  // Rime Stalker: a snow cat you can barely see until it's on you; a pounce out of hiding hits twice as hard, and hitting it gives it away
  snowcat:    { hp: 38,  spd: 5.2, r: .5,  h: 1.2, dmg: 11, reach: 2.2, cost: 1, from: 1, kb: 1.2, poise: 20,  atk: 'swipe', wind: .45, cd: 1.3, zone: 'frost', name: 'Rime Stalker',
    alt: { atk: 'pounce', min: 3, max: 10, wind: .35, cd: 6, dmg: 14 },
    tick(e, dt, tgt, d) { e.vs = e.seen > S.t || d < 3 ? 0 : 'hide'; return false; },
    ward(e, n) { e.seen = S.t + 3; return n; } },
  // Avalanche Ram: paws the snow, then charges flat out down a marked lane; sidestep it into a pillar and it stuns itself (or off the edge, and it's gone)
  ram:        { hp: 95,  spd: 3.2, r: .7,  h: 1.6, dmg: 14, reach: 2.6, cost: 2, from: 2, kb: .5,  poise: 60,  atk: 'thrust', wind: .55, cd: 1.6, zone: 'frost', name: 'Avalanche Ram',
    alt: { atk: 'stampede', min: 6, max: 22, wind: 1.1, cd: 6, dmg: 22, len: 24 },
    tick(e, dt, tgt, d, ps) {
      const R = e.run; if (!R) return false;
      const st = Math.min(R.left, 19 * dt), x0 = e.x, z0 = e.z; R.left -= st;
      e.x += Math.sin(R.yaw) * st; e.z += Math.cos(R.yaw) * st; e.yaw = R.yaw; collide(e, ET.ram.r * e.sc);
      for (const p of ps) if (!R.hit.includes(p.id) && Math.hypot(p.x - e.x, p.z - e.z) < 1.7 && p.y < 1.4) { R.hit.push(p.id); if (foeHit(p, R.dmg, e)) shove(p, Math.sin(R.yaw) * 16, Math.cos(R.yaw) * 16, 6); }
      if (Math.hypot(e.x - x0, e.z - z0) < st * .4) { e.run = null; cc(e, 'stun', 2.2, null); ev({ k: 'fx', m: 'foe', f: 'crash', x: r2(e.x), z: r2(e.z) }); } // ran into something
      else if (R.left <= 0) e.run = null;
      e.vs = e.run ? 'run' : 0;
      return true;
    } },
  // Cryomancer: plants Frost Totems round you that pulse out freezing cold until you break them; lances you with ice
  cryomancer: { hp: 55,  spd: 2.8, r: .55, h: 2.2, dmg: 0,  reach: 14,  cost: 3, from: 3, kb: 1,   poise: 30,  atk: 'totem', wind: 1.1, cd: 6, ranged: 1, keep: [12, 18], zone: 'frost', name: 'Cryomancer',
    alt: { atk: 'ray', min: 0, max: 22, wind: 1, cd: 5, dmg: 13, len: 22, w: 1.3, c: C_ICE, s: 'ice', chill: 2 } },
  frosttotem: { hp: 70,  spd: 0,   r: .5,  h: 2.1, dmg: 7,  reach: 0,   cost: 0, from: 99, kb: 0,  poise: 999, atk: 'nova', wind: .6, cd: 3, zone: 'frost', name: 'Frost Totem',
    pulse: { atk: 'nova', wind: .7, r: 6, dmg: 7, c: C_ICE, s: 'ice', chill: 1.6 },
    tick(e, dt, tgt) {
      if (e.atk) return false;
      if ((e.life = (e.life ?? 20) - dt) <= 0) { kill(e, null, null); return true; }
      if ((e.pt = (e.pt ?? 1.2) - dt) <= 0) { e.pt = 3; startAttack(e, tgt, ET.frosttotem.pulse); }
      return true;
    } },
  // Rime Golem: wrapped in a shell of ice that soaks up every hit; break it and the shell bursts outward, and the bare golem fights faster until it regrows
  icegolem:   { hp: 200, spd: 2.2, r: 1.1, h: 2.8, dmg: 24, reach: 3.4, cost: 5, from: 5, kb: .25, poise: 140, atk: 'smash', wind: .95, cd: 2.1, zone: 'frost', name: 'Rime Golem',
    alt: { atk: 'hurl', min: 5, max: 18, wind: 1.1, cd: 7, dmg: 20, r: 2.6, c: 0xd8f0ff, s: 'boulder', chill: 1.5 },
    tick(e, dt) {
      e.shell ??= e.max * .6;
      if (e.shell <= 0 && (e.regrow -= dt) <= 0) { e.shell = e.max * .6; ev({ k: 'fx', m: 'foe', f: 'reshell', x: r2(e.x), z: r2(e.z) }); }
      if (e.shell <= 0) e.rage = S.t + .2;
      e.vs = e.shell > 0 ? 'shell' : 0;
      return false;
    },
    ward(e, n) {
      if (!(e.shell > 0)) return n;
      const a = Math.min(e.shell, n); e.shell -= a;
      if (e.shell <= 0) {
        e.regrow = 12; ev({ k: 'fx', m: 'foe', f: 'nova', x: r2(e.x), z: r2(e.z), r: 5, c: C_ICE, s: 'ice' });
        for (const q of players()) if (!q.down && Math.hypot(q.x - e.x, q.z - e.z) < 5.3) foeHit(q, 18, e, { chill: 2 });
      }
      return n - a;
    } },
  // Storm Harpy: circles above you out of reach of anything but aimed spells, then dives down a marked lane; its wings blow you back
  harpy:      { hp: 40,  spd: 5,   r: .5,  h: 1.9, dmg: 15, reach: 16,  cost: 3, from: 4, kb: 1,   poise: 20,  atk: 'dive', wind: .7, cd: 3.4, ranged: 1, keep: [7, 11], fly: 1, zone: 'frost', name: 'Storm Harpy',
    alt: { atk: 'gust', min: 0, max: 9, wind: .6, cd: 6, dmg: 5 },
    tick(e, dt, tgt, d, ps) {
      const D = e.dv, q = confine({ x: e.x, z: e.z }, 1); e.x = q.x; e.z = q.z; e.vy = 0;
      if (!D) { e.y += (2.8 - e.y) * Math.min(1, dt * 3); return false; }
      D.t += dt; const u = Math.min(1, D.t / .75), st = 22 * dt;
      e.x += Math.sin(D.yaw) * st; e.z += Math.cos(D.yaw) * st; e.yaw = D.yaw; e.y = .5 + 2.3 * Math.abs(1 - 2 * u);
      for (const p of ps) if (!D.hit.includes(p.id) && Math.hypot(p.x - e.x, p.z - e.z) < 1.6 && Math.abs(p.y + 1 - e.y) < 2) { D.hit.push(p.id); foeHit(p, D.dmg, e); }
      if (u >= 1) e.dv = null;
      return true;
    } },
  // Yeti: pounds the ground with both fists, and heaves a great snowball down a lane that grows as it rolls
  yeti:       { hp: 240, spd: 2.4, r: 1.1, h: 2.8, dmg: 22, reach: 3,   cost: 4, from: 6, kb: .25, poise: 140, atk: 'slam',  wind: .9, cd: 2.2, zone: 'frost', name: 'Yeti',
    alt: { atk: 'roll', min: 5, max: 22, wind: 1.1, cd: 7, dmg: 24, len: 24, chill: 1.5 } },
  frostgiant: { hp: 1700, spd: 2.1, r: 2.2, h: 5.4, dmg: 30, reach: 5, cost: 0, from: 99, kb: .04, poise: 700, atk: 'smash', wind: 1.05, cd: 2.2, boss: 1, zone: 'frost',
    name: 'Hrimgar the Frost Giant', minions: ['snowcat', 'ram'] },
  frostqueen: { hp: 1800, spd: 2.6, r: 1, h: 3.8, dmg: 13, reach: 26, cost: 0, from: 99, kb: .04, poise: 650, atk: 'volley', wind: .85, cd: 2.2, boss: 1, ranged: 1, keep: [9, 15], oc: C_ICE, zone: 'frost',
    name: 'Skadi, the Frost Queen', minions: ['snowcat', 'harpy'] },

  // ---------- 4: the Infernal Legion ----------
  // Cinder Imps: they come in threes, never stand still (a puff of cinders and they're somewhere else round you) and spit fire up close
  cinderimp:  { hp: 20,  spd: 4.2, r: .4,  h: 1.5, dmg: 7,  reach: 5,   cost: 1, from: 1, kb: 1.4, poise: 12,  atk: 'spit',  wind: .45, cd: 1.6, zone: 'hell', name: 'Cinder Imp',
    tick(e, dt, tgt, d) {
      if (!e.pack) { e.pack = 1; for (const s of [-1, 1]) { const q = confine({ x: e.x + s * 1.5, z: e.z + rand(-1, 1) }, 1); spawnEnemy('cinderimp', q.x, q.z).pack = 1; } }
      if (e.atk || d > 14 || (e.flit = (e.flit ?? rand(1, 2)) - dt) > 0) return false;
      e.flit = rand(1.4, 2.2);
      const a = Math.atan2(e.x - tgt.x, e.z - tgt.z) + rand(-1.4, 1.4), r = Math.min(8, Math.max(3, d + rand(-2, 1))), q = confine({ x: tgt.x + Math.sin(a) * r, z: tgt.z + Math.cos(a) * r }, 1);
      ev({ k: 'fx', m: 'foe', f: 'flit', x: r2(e.x), z: r2(e.z), x2: r2(q.x), z2: r2(q.z) });
      e.x = q.x; e.z = q.z;
      return false;
    } },
  // Hellfire Berserker: two axes and no fear; past half health it goes into a frenzy, and it spins into a whirlwind of blades that chases you
  berserker:  { hp: 110, spd: 3.6, r: .6,  h: 2.1, dmg: 13, reach: 2.4, cost: 2, from: 2, kb: .6,  poise: 60,  atk: 'swipe', wind: .5,  cd: 1.2, zone: 'hell', name: 'Hellfire Berserker',
    alt: { atk: 'whirl', min: 0, max: 9, wind: .6, cd: 7, dmg: 8 },
    tick(e, dt, tgt, d, ps) {
      if (e.hp < e.max * .5) { e.rage = S.t + .2; e.vs = 'rage'; }
      const W = e.spin; if (!W) return false;
      W.t -= dt; e.yaw += dt * 14;
      e.x += (tgt.x - e.x) / d * 4.6 * dt; e.z += (tgt.z - e.z) / d * 4.6 * dt; collide(e, .6);
      if ((W.k -= dt) <= 0) { W.k = .35; ev({ k: 'fx', m: 'foe', f: 'whirl', x: r2(e.x), z: r2(e.z) }); for (const p of ps) if (Math.hypot(p.x - e.x, p.z - e.z) < 2.8 && p.y < 1.5) foeHit(p, W.dmg, e); }
      if (W.t <= 0) e.spin = null;
      return true;
    } },
  // Brimstone Cannoneer: braces its mortar and walks three shells onto you one after another (each leaves the ground burning); blasts you back if you get close
  cannoneer:  { hp: 70,  spd: 2.4, r: .8,  h: 2.2, dmg: 16, reach: 26,  cost: 3, from: 3, kb: .5,  poise: 60,  atk: 'barrage', wind: 1.2, cd: 5, ranged: 1, keep: [15, 24], zone: 'hell', name: 'Brimstone Cannoneer',
    alt: { atk: 'blast', min: 0, max: 5, wind: .6, cd: 5, dmg: 12 } },
  // Chain Tormentor: lashes you with its chain from out of arm's reach, and throws a hook that drags you in for another lash
  tormentor:  { hp: 75,  spd: 3.4, r: .55, h: 2.4, dmg: 14, reach: 6,   cost: 3, from: 4, kb: .8,  poise: 40,  atk: 'lash',  wind: .55, cd: 1.6, zone: 'hell', name: 'Chain Tormentor',
    alt: { atk: 'hook', min: 7, max: 18, wind: .8, cd: 6, dmg: 8, len: 18, w: 1.3, c: 0xd06a30 } },
  // Pyre Priest: raises walls of fire across the ground to cut you off, and calls a pillar of flame down on where you stand
  pyrepriest: { hp: 60,  spd: 2.9, r: .55, h: 2.1, dmg: 10, reach: 16,  cost: 4, from: 5, kb: 1,   poise: 30,  atk: 'firewall', wind: 1.1, cd: 6, ranged: 1, keep: [12, 18], zone: 'hell', name: 'Pyre Priest',
    alt: { atk: 'pyre', min: 0, max: 22, wind: 1.3, cd: 5, dmg: 20 } },
  // Gorger: eats the fallen (yours and its own kind) to heal and grow bigger; belly-flops onto you
  gorger:     { hp: 240, spd: 2.2, r: 1.1, h: 2.4, dmg: 22, reach: 5,   cost: 5, from: 6, kb: .2,  poise: 150, atk: 'flop',  wind: .9,  cd: 3, zone: 'hell', name: 'Gorger',
    tick(e, dt) {
      if (e.atk || e.leap) return false;
      const c = (S.corpses || []).filter(c => S.t - c.t < 12 && Math.hypot(c.x - e.x, c.z - e.z) < 14).sort((a, b) => Math.hypot(a.x - e.x, a.z - e.z) - Math.hypot(b.x - e.x, b.z - e.z))[0];
      if (!c) return false;
      const dx = c.x - e.x, dz = c.z - e.z, k = Math.hypot(dx, dz) || 1;
      if (k > 1.6) { e.x += dx / k * 3 * dt; e.z += dz / k * 3 * dt; e.yaw = Math.atan2(dx, dz); return true; }
      S.corpses.splice(S.corpses.indexOf(c), 1);
      if (e.sc < 1.8) { e.sc += .12; e.max *= 1.12; }
      e.hp = Math.min(e.max, e.hp + e.max * .3);
      ev({ k: 'fx', m: 'foe', f: 'devour', x: r2(c.x), z: r2(c.z) });
      return true;
    } },
  pitlord:    { hp: 1800, spd: 2.1, r: 2.2, h: 5.4, dmg: 31, reach: 5, cost: 0, from: 99, kb: .04, poise: 700, atk: 'smash', wind: 1.05, cd: 2.2, boss: 1, zone: 'hell',
    name: 'Azgaroth the Pit Lord', minions: ['cinderimp', 'berserker'] },
  archdemon:  { hp: 1900, spd: 2.5, r: 1.4, h: 4.4, dmg: 28, reach: 4, cost: 0, from: 99, kb: .04, poise: 700, atk: 'swipe', wind: .8, cd: 1.8, boss: 1, zone: 'hell',
    name: 'Belphegor the Archdemon', minions: ['cinderimp', 'tormentor'],
    alt: { atk: 'blink', min: 7, max: 22, wind: .7, cd: 7, dmg: 26 } },

  // ---------- 5: the Void ----------
  // Mirror Shade: walks in with two reflections of itself that shatter at a touch; only one of the three is real, and it can trade places with a reflection
  shade:      { hp: 50,  spd: 4,   r: .5,  h: 1.9, dmg: 13, reach: 2.2, cost: 1, from: 1, kb: 1,   poise: 25,  atk: 'swipe', wind: .5,  cd: 1.4, zone: 'void', name: 'Mirror Shade',
    alt: { atk: 'mirror', min: 0, max: 30, cd: 6 },
    tick(e, dt, tgt, d) {
      if (e.fake) { // a reflection: shadows the real one's moves but never strikes, and fades after a while
        if ((e.life -= dt) <= 0) { kill(e, null, null); return true; }
        if (d > 1.6) { e.x += (tgt.x - e.x) / d * 4 * dt; e.z += (tgt.z - e.z) / d * 4 * dt; }
        e.yaw = Math.atan2(tgt.x - e.x, tgt.z - e.z); return true;
      }
      if ((e.mt = (e.mt ?? 0) - dt) <= 0 && S.enemies.filter(o => o.fake === e.id && !o.dead).length < 2) {
        e.mt = 9;
        for (const s of [-1, 1]) { const q = confine({ x: e.x + s * 2, z: e.z }, 1), o = spawnEnemy('shade', q.x, q.z); Object.assign(o, { fake: e.id, life: 12, hp: e.hp, max: e.max, rise: 0, y: 0 }); }
        ev({ k: 'fx', m: 'foe', f: 'mirror', x: r2(e.x), z: r2(e.z) });
      }
      return false;
    },
    ward(e, n) { if (e.fake) { ev({ k: 'fx', m: 'foe', f: 'shatter', x: r2(e.x), z: r2(e.z) }); kill(e, null, null); return 0; } return n; },
    die(e) { for (const o of S.enemies) if (o.fake === e.id) o.life = 0; } },
  // Gravity Maw: a floating mouth that drags everyone near it in, steadily, and bites whatever arrives
  maw:        { hp: 90,  spd: 2.2, r: .7,  h: 2.2, dmg: 22, reach: 2.8, cost: 2, from: 2, kb: .3,  poise: 70,  atk: 'chomp', wind: .7, cd: 1.8, zone: 'void', name: 'Gravity Maw',
    tick(e, dt, tgt, d, ps) {
      if ((e.gt = (e.gt ?? 0) - dt) > 0) return false;
      e.gt = .25;
      for (const p of ps) { const dx = e.x - p.x, dz = e.z - p.z, k = Math.hypot(dx, dz) || 1; if (k < 13 && k > 1.5 && p.y < 3) shove(p, dx / k * 2.2 * (1.4 - k / 13), dz / k * 2.2 * (1.4 - k / 13)); }
      return false;
    } },
  // Phase Lancer: three dashes through you in a zigzag, each lane marked an instant before, then it stops to catch its breath
  lancer:     { hp: 80,  spd: 3.4, r: .55, h: 2.2, dmg: 15, reach: 11,  cost: 3, from: 3, kb: .7,  poise: 50,  atk: 'zigzag', wind: .75, cd: 4.5, zone: 'void', name: 'Phase Lancer', n: 3 },
  // Star Weaver: three star-blades circle it, cutting anything that crosses their ring; it flings one at you, and it comes back
  orbiter:    { hp: 65,  spd: 2.6, r: .6,  h: 2.4, dmg: 14, reach: 16,  cost: 3, from: 4, kb: .8,  poise: 40,  atk: 'fling', wind: .8, cd: 3.5, ranged: 1, keep: [5, 9], zone: 'void', name: 'Star Weaver',
    tick(e, dt, tgt, d, ps) {
      e.hitT ??= {};
      for (const p of ps) { const k = Math.hypot(p.x - e.x, p.z - e.z) / e.sc; if (k > 2.5 && k < 3.9 && p.y < 2.5 && !(e.hitT[p.id] > S.t)) { e.hitT[p.id] = S.t + .6; foeHit(p, 9 * (1 + .06 * (S.wave - 1)), e); } }
      return false;
    } },
  // Unraveler: a great eye that locks a beam on you and holds it there for three seconds, slowly turning to follow you
  gazer:      { hp: 60,  spd: 2.4, r: .6,  h: 2.3, dmg: 6,  reach: 22,  cost: 4, from: 5, kb: .8,  poise: 35,  atk: 'beam',  wind: .9,  cd: 6, ranged: 1, keep: [10, 16], oc: C_VOID, zone: 'void', name: 'Unraveler',
    tick(e, dt, tgt, d, ps) {
      const B = e.bm; if (!B) return false;
      B.t -= dt; const want = Math.atan2(tgt.x - e.x, tgt.z - e.z), da = Math.atan2(Math.sin(want - B.yaw), Math.cos(want - B.yaw));
      B.yaw += Math.max(-.8 * dt, Math.min(.8 * dt, da)); e.yaw = B.yaw;
      if ((B.k -= dt) <= 0) {
        B.k = .25; ev({ k: 'fx', m: 'foe', f: 'ray', x: r2(e.x), y: r2(e.y + 1.9 * e.sc), z: r2(e.z), yaw: r2(B.yaw), len: 22, w: .7, c: C_VOID, q: 1 });
        for (const p of ps) if (inLine(p, e.x, e.z, B.yaw, 22, 1.2) && p.y < 2.5) foeHit(p, B.dmg, e);
      }
      if (B.t <= 0) e.bm = null;
      return true;
    } },
  // Null Priest: lays a field where no spell can be cast (step out of it!), and lashes you in with a tendril of void
  mindflayer: { hp: 62,  spd: 2.9, r: .55, h: 2.1, dmg: 0,  reach: 18,  cost: 4, from: 6, kb: 1,   poise: 30,  atk: 'null',  wind: 1.1, cd: 7, ranged: 1, keep: [12, 18], zone: 'void', name: 'Null Priest',
    alt: { atk: 'pull', min: 4, max: 20, wind: .9, cd: 6, dmg: 8, len: 20, w: 1.8, c: C_VOID } },
  watcher:    { hp: 1700, spd: 2, r: 1.6, h: 5.2, dmg: 14, reach: 26, cost: 0, from: 99, kb: .04, poise: 650, atk: 'volley', wind: .85, cd: 2.2, boss: 1, ranged: 1, keep: [10, 16], oc: C_VOID, zone: 'void',
    name: 'The Watcher Beyond', minions: ['shade', 'gazer'] },
  devourer:   { hp: 2000, spd: 2.1, r: 2.2, h: 5, dmg: 31, reach: 5, cost: 0, from: 99, kb: .04, poise: 700, atk: 'smash', wind: 1.05, cd: 2.2, boss: 1, zone: 'void',
    name: 'The Devourer of Stars', minions: ['shade', 'maw'] },

  // ---------- 1: the Shadow Realm's second boss ----------
  umbra:      { hp: 1500, spd: 2.6, r: 1.3, h: 4.2, dmg: 26, reach: 4, cost: 0, from: 99, kb: .04, poise: 650, atk: 'swipe', wind: .8, cd: 1.8, boss: 1,
    name: 'Nyx, the Umbral Wraith', minions: ['stalker', 'grunt'],
    alt: { atk: 'blink', min: 7, max: 22, wind: .7, cd: 6, dmg: 26 } },
});
ET.boss.name = 'The Obsidian Tyrant'; ET.warden.name = 'The Bone Warden';

const AREAS = [
  { id: 'shadow', name: 'The Shadow Realm', zone: undefined, bosses: ['boss', 'umbra'] },
  { id: 'crypt', name: 'The Undead Crypt', zone: 'crypt', bosses: ['lich', 'bonedragon'] },
  { id: 'frost', name: 'The Frost Peaks', zone: 'frost', bosses: ['frostgiant', 'frostqueen'] },
  { id: 'hell', name: 'The Infernal Legion', zone: 'hell', bosses: ['pitlord', 'archdemon'] },
  { id: 'void', name: 'The Void', zone: 'void', bosses: ['watcher', 'devourer'] },
];
const WAVES_PER_ISLE = 5; // waves on each island before the bridge to the next one builds
const areaIdx = w => Math.floor(Math.max(0, w - 1) / WAVES_PER_ISLE) % AREAS.length;
const areaNow = () => S.mode === 'arena' ? AREAS[S.isl || 0] : AREAS[0]; // Mage City keeps the Shadow roster

// ===================== the islands and their bridges (both machines) =====================
// The five areas are islands in a ring (the same layout as blender/build_islands.py). Clearing an area's 5th wave builds
// the bridge to the next one, and the next island with it; the next wave starts once everyone has walked across.
// State: S.isl the island you fight on, S.ib built islands (bits), S.brs finished bridges (bits), S.br the one being built { k, t }.
const ISLES = AREAS.map((a, k) => { const th = Math.PI + k * TAU / 5; return { id: a.id, k, x: k ? 64 * Math.sin(th) : 0, z: k ? 64 + 64 * Math.cos(th) : 0, r: ARENA_R }; });
const BRIDGE_R = 1.9, BRIDGE_T = 9; // walkable half-width, seconds to build
function bridgeEnds(k) {
  const A = ISLES[k], B = ISLES[(k + 1) % 5], dx = B.x - A.x, dz = B.z - A.z, L = Math.hypot(dx, dz), ux = dx / L, uz = dz / L;
  return { ax: A.x + ux * (A.r - 1.5), az: A.z + uz * (A.r - 1.5), bx: B.x - ux * (B.r - 1.5), bz: B.z - uz * (B.r - 1.5), ux, uz };
}
// how far to lift a floating decoration (the arena's orbiting monoliths) so it passes over the bridges, not through them
function laneLift(x, z) {
  let d = 1e9;
  for (const k of [0, 4]) { const b = bridgeEnds(k), dx = b.bx - b.ax, dz = b.bz - b.az, t = clamp(((x - b.ax) * dx + (z - b.az) * dz) / (dx * dx + dz * dz), 0, 1); d = Math.min(d, Math.hypot(x - b.ax - dx * t, z - b.az - dz * t)); }
  return Math.max(0, 1 - d / 8) ** 2 * 10;
}
const isleCenter = () => ISLES[S.mode === 'arena' ? S.isl || 0 : 0];
// the walkable shape: every built island, every finished bridge, and as much of the one being built as exists so far
function islandMap(src = S) {
  if (src.mode && src.mode !== 'arena') return;
  const caps = [];
  for (const I of ISLES) if (I.k === 0 || (src.ib & 1 << I.k)) caps.push({ ax: I.x, az: I.z, bx: I.x, bz: I.z, r: I.r });
  for (let k = 0; k < 5; k++) {
    const t = src.brs & 1 << k ? 1 : src.br?.k === k ? src.br.t : 0;
    if (t <= 0) continue;
    const b = bridgeEnds(k);
    caps.push({ ax: b.ax, az: b.az, bx: b.ax + (b.bx - b.ax) * t, bz: b.az + (b.bz - b.az) * t, r: BRIDGE_R });
  }
  MAP.caps = caps;
}
// host: the last wave of an area is cleared
function startTravel() {
  const k = S.isl || 0;
  S.br = { k, t: S.brs & 1 << k ? 1 : 0 }; S.phase = 'travel';
  ev({ k: 'travel', to: (k + 1) % 5 });
}
// test cheat (Esc menu): every island and bridge built, the field cleared, everyone on island k with wave w next (default its first)
function goIsland(k, w = k * WAVES_PER_ISLE + 1) {
  Object.assign(S, { ib: 31, brs: 31, br: null, isl: k, wave: w - 1, enemies: [], shots: [], ents: [], timers: [], rings: [], hz: [], budget: 0, bossLeft: 0, phase: 'rest', restT: 3 });
  const I = ISLES[k];
  players().forEach((p, i) => Object.assign(p, { x: I.x + (i ? 2 : -2), z: I.z + 6, y: 0, vy: 0, down: false, hp: p.max, mo: null, dashT: 0 }));
  islandMap();
  ev({ k: 'arrive', i: k });
}
function stepTravel(dt) {
  const B = S.br, next = (B.k + 1) % 5, N = ISLES[next];
  B.t = Math.min(1, B.t + dt / BRIDGE_T);
  if (B.t >= 1) { S.brs |= 1 << B.k; S.ib |= 1 << next; }
  islandMap();
  const ps = players().filter(p => !p.down);
  if (B.t >= 1 && ps.length && ps.every(p => Math.hypot(p.x - N.x, p.z - N.z) < N.r - 2)) { // everyone's across
    S.isl = next; S.br = null; S.phase = 'rest'; S.restT = 3; islandMap();
    ev({ k: 'arrive', i: next });
  }
}
// obstacles on the other islands, from their Blender pieces (<id>_pillar_<n>_r<radius*10>, braziers)
for (const I of ISLES) {
  const root = islandsG.getObjectByName('isle_' + I.id); if (!root) continue;
  for (const o of root.children) {
    const m = o.name.match(/_pillar_\d+_r(\d+)/), br = /_brazier_\d+$/.test(o.name);
    if (m || br) ARENA_PILLARS.push({ x: I.x + o.position.x, z: I.z + o.position.z, r: m ? +m[1] / 10 : .65 });
  }
}
const areaWave = w => (Math.max(1, w) - 1) % WAVES_PER_ISLE + 1; // 1..5 within the area

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
      ev({ k: 'fx', m: 'foe', b: ET[e.type].boss || 0, f: 'cone', x: r2(e.x), y: r2(e.y + ET[e.type].h * e.sc * .7), z: r2(e.z), yaw: r2(a.yaw), r: al.r, ang: al.ang, c: al.c, s: al.s });
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
        ev({ k: 'fx', m: 'foe', b: ET[e.type].boss || 0, f: 'ray', x: r2(e.x), y: r2(e.y + ET[e.type].h * e.sc * .7), z: r2(e.z), yaw: r2(yaw), len: al.len, w: al.w, c: al.c });
        for (const p of ps) if (inLine(p, e.x, e.z, yaw, al.len, al.w) && p.y < 2.5) foeHit(p, dmg, e, al);
        if (al.pool) for (let j = 1; j <= 3; j++) addPool(e.x + Math.sin(yaw) * al.len * j / 4, e.z + Math.cos(yaw) * al.len * j / 4, al.w, al.pool, al);
      }
    },
  },
  nova: { // a burst all around itself
    start: (e, t, al) => ({ shape: 'circle', x: e.x, z: e.z, r: al.r }),
    hit(e, a, dmg, ps) {
      const al = a.al;
      ev({ k: 'fx', m: 'foe', b: ET[e.type].boss || 0, f: 'nova', x: r2(e.x), z: r2(e.z), r: al.r, c: al.c, s: al.s });
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
      if (!al.quiet) { ev({ k: 'strike', id: e.id, a: 'call' }); e.acd = Math.max(e.acd, 1.2); }
      for (const p of ps) for (let i = 0; i < al.n; i++) {
        const q = i ? confine({ x: p.x + rand(-4, 4), z: p.z + rand(-4, 4) }, 1) : { x: p.x, z: p.z }, d = 1.1 + i * .35;
        ev({ k: 'tele', a: 'meteor', s: al.s, c: al.c, shape: 'circle', x: r2(q.x), z: r2(q.z), r: al.r, d: r2(d) });
        later(d, () => {
          ev({ k: 'fx', m: 'foe', b: ET[e.type].boss || 0, f: 'impact', x: r2(q.x), z: r2(q.z), r: al.r, c: al.c, s: al.s });
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
      ev({ k: 'fx', m: 'foe', b: ET[e.type].boss || 0, f: 'summon', x: r2(e.x), z: r2(e.z), c: RIMC[e.type] || 0xff3050 });
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
  // ----- the Crypt's own -----
  erupt: { // a burrower bursts up out of the ground under you and throws you into the air
    start(e, t, al) { Object.assign(e.atk, { lx: t.x, lz: t.z }); return { shape: 'circle', x: t.x, z: t.z, r: al.r }; },
    hit(e, a, dmg, ps) {
      const al = a.al; Object.assign(e, { x: a.lx, z: a.lz, under: 0, gone: 0, vs: 0, bcd: 6 });
      ev({ k: 'fx', m: 'foe', f: 'erupt', x: r2(a.lx), z: r2(a.lz), r: al.r });
      for (const p of ps) if (Math.hypot(p.x - a.lx, p.z - a.lz) < al.r + .3 && p.y < 1.2 && foeHit(p, dmg, e, al)) shove(p, 0, 0, 9);
    },
  },
  snipe: { // no mark while it draws and follows you; the aim locks 0.45 s before the arrow (a thin line), then it crosses the field
    start(e) {
      const a = e.atk;
      later(Math.max(0, a.t - .45), () => {
        if (e.atk !== a || e.dead) return;
        const p = near(e, players().filter(q => !q.down)); if (p) a.yaw = e.yaw = Math.atan2(p.x - e.x, p.z - e.z);
        a.lock = 1; ev({ k: 'tele', shape: 'line', x: r2(e.x), z: r2(e.z), yaw: r2(a.yaw), len: 34, w: .9, d: .45 });
      });
      return null;
    },
    hit(e, a, dmg, ps) {
      if (!a.lock) a.yaw = e.yaw;
      ev({ k: 'fx', m: 'foe', f: 'ray', x: r2(e.x), y: r2(e.y + 1.5 * e.sc), z: r2(e.z), yaw: r2(a.yaw), len: 34, w: .3, c: 0xe8dcc0 });
      for (const p of ps) if (inLine(p, e.x, e.z, a.yaw, 34, .9) && p.y < 2.5) foeHit(p, dmg, e, a.al);
    },
  },
  hop: { // springs back out of reach
    start(e, t) {
      const dx = e.x - t.x, dz = e.z - t.z, d = Math.hypot(dx, dz) || 1, q = confine({ x: e.x + dx / d * 7, z: e.z + dz / d * 7 }, 1.5);
      e.leap = { x0: e.x, z0: e.z, x1: q.x, z1: q.z, t: 0, dmg: 0, r: -1 }; ev({ k: 'strike', id: e.id, a: 'hop' });
      return 'done';
    },
  },
  censer: { // the censer swung round on its chain: everything close is hit
    start: (e, t, al) => ({ shape: 'circle', x: e.x, z: e.z, r: ET[e.type].cen }),
    hit(e, a, dmg, ps) {
      const r = ET[e.type].cen;
      ev({ k: 'fx', m: 'foe', f: 'nova', x: r2(e.x), z: r2(e.z), r, c: C_POI, s: 'bile' });
      for (const p of ps) if (Math.hypot(p.x - e.x, p.z - e.z) < r + .3 && p.y < 1.6) foeHit(p, dmg, e);
    },
  },
  scream: { // a wail that blasts you backwards; the spirit is solid (hittable) for a moment after
    start: (e, t, al, yaw) => ({ shape: 'cone', x: e.x, z: e.z, yaw, r: 8, ang: 75 }),
    hit(e, a, dmg, ps) {
      e.solid = S.t + 2.5;
      ev({ k: 'fx', m: 'foe', f: 'cone', x: r2(e.x), y: r2(e.y + 1.6 * e.sc), z: r2(e.z), yaw: r2(a.yaw), r: 8, ang: 75, c: C_SOUL, s: 'wail' });
      for (const p of ps) if (inCone(p, e.x, e.z, a.yaw, 8.4, 80) && p.y < 3 && foeHit(p, dmg, e)) shove(p, Math.sin(a.yaw) * 15, Math.cos(a.yaw) * 15, 3);
    },
  },
  cage: { // a ring of bone bursts up round you and holds you (you're slowed hard)
    start(e, t, al) { Object.assign(e.atk, { lx: t.x, lz: t.z }); return { shape: 'circle', x: t.x, z: t.z, r: al.r }; },
    hit(e, a, dmg, ps) {
      const al = a.al;
      for (let i = 0; i < 9; i++) ev({ k: 'fx', m: 'foe', f: 'spike', x: r2(a.lx + Math.sin(TAU * i / 9) * al.r), z: r2(a.lz + Math.cos(TAU * i / 9) * al.r), i: 3, c: al.c, s: al.s });
      for (const p of ps) if (Math.hypot(p.x - a.lx, p.z - a.lz) < al.r + .3 && p.y < 1.4 && foeHit(p, dmg, e, al)) p.bf.chill = Math.max(p.bf.chill || 0, 2);
    },
  },
  bind: { // chains up to two nearby monsters' souls to itself: they can't be hurt until it dies
    start(e) {
      const have = S.enemies.filter(o => o.bnd === e.id).length;
      const pool = enemiesNear(e.x, e.z, 14).filter(o => o !== e && !o.bnd && !ET[o.type].boss && o.type !== 'necromancer').sort((a, b) => b.max - a.max);
      if (have >= 2 || !pool.length) { e.atk = null; e.acd = 1.5; return 'done'; }
      e.atk.bt = pool[0].id;
      return { shape: 'circle', x: pool[0].x, z: pool[0].z, r: ET[pool[0].type].r * pool[0].sc + 1, ally: 1 };
    },
    hit(e, a) {
      const o = S.enemies.find(q => q.id === a.bt && !q.dead); if (!o || o.bnd) return;
      o.bnd = e.id; ev({ k: 'fx', m: 'foe', f: 'bind', x: r2(o.x), z: r2(o.z), x2: r2(e.x), z2: r2(e.z) });
    },
  },
  siphon: { // a beam down a marked lane that drinks from you to mend itself and its bound
    start: (e, t, al, yaw) => ({ shape: 'line', x: e.x, z: e.z, yaw, len: al.len, w: al.w }),
    hit(e, a, dmg, ps) {
      const al = a.al;
      ev({ k: 'fx', m: 'foe', f: 'ray', x: r2(e.x), y: r2(e.y + 1.6 * e.sc), z: r2(e.z), yaw: r2(a.yaw), len: al.len, w: al.w, c: al.c });
      let got = 0;
      for (const p of ps) if (inLine(p, e.x, e.z, a.yaw, al.len, al.w) && p.y < 2.5 && foeHit(p, dmg, e, al)) got++;
      if (got) for (const o of S.enemies) if (o === e || o.bnd === e.id) { o.hp = Math.min(o.max, o.hp + o.max * .2); ev({ k: 'fx', m: 'foe', f: 'mend', x: r2(o.x), z: r2(o.z) }); }
    },
  },
  // ----- the Frost Peaks' own -----
  pounce: { // a leap onto you; twice as hard out of hiding
    start(e, t) { Object.assign(e.atk, { lx: t.x, lz: t.z, hid: e.vs === 'hide' }); e.seen = S.t + 4; return { shape: 'circle', x: t.x, z: t.z, r: 1.8 }; },
    hit(e, a, dmg) { e.leap = { x0: e.x, z0: e.z, x1: a.lx, z1: a.lz, t: 0, dmg: dmg * (a.hid ? 2 : 1), r: 1.8 }; },
  },
  stampede: { // head down, a charge down the whole lane (it runs on in stepping, see the ram's tick)
    start: (e, t, al, yaw) => ({ shape: 'line', x: e.x, z: e.z, yaw, len: al.len, w: 2.4 }),
    hit(e, a, dmg) { e.run = { yaw: a.yaw, left: a.al.len, hit: [], dmg }; ev({ k: 'fx', m: 'foe', f: 'charge', x: r2(e.x), z: r2(e.z) }); },
  },
  totem: { // raises a Frost Totem near you (three at most at once)
    start(e, t) {
      if (S.enemies.filter(o => o.type === 'frosttotem' && !o.dead).length >= 3) { e.atk = null; e.acd = 2; return 'done'; }
      const dx = e.x - t.x, dz = e.z - t.z, d = Math.hypot(dx, dz) || 1, q = confine({ x: t.x + dx / d * 4 + rand(-2, 2), z: t.z + dz / d * 4 + rand(-2, 2) }, 1.5);
      Object.assign(e.atk, { lx: q.x, lz: q.z });
      return { shape: 'circle', x: q.x, z: q.z, r: 1.2, ally: 1 };
    },
    hit(e, a) { spawnEnemy('frosttotem', a.lx, a.lz); ev({ k: 'fx', m: 'foe', f: 'summon', x: r2(a.lx), z: r2(a.lz), c: C_ICE }); },
  },
  hurl: { // tears a slab off itself and throws it
    start: (...a) => FOE_ATK.lob.start(...a),
    hit: (...a) => FOE_ATK.lob.hit(...a),
  },
  dive: { // folds its wings and swoops down the marked lane
    start(e, t, al, yaw) { const len = Math.min(18, Math.hypot(t.x - e.x, t.z - e.z) + 5); e.atk.len = len; return { shape: 'line', x: e.x, z: e.z, yaw, len, w: 1.8 }; },
    hit(e, a, dmg) { e.dv = { yaw: a.yaw, t: 0, hit: [], dmg }; ev({ k: 'fx', m: 'foe', f: 'swoop', x: r2(e.x), y: r2(e.y), z: r2(e.z) }); },
  },
  gust: { // one great beat of its wings: everything in front is blown away
    start: (e, t, al, yaw) => ({ shape: 'cone', x: e.x, z: e.z, yaw, r: al.r || 9, ang: al.ang || 70 }),
    hit(e, a, dmg, ps) {
      const r = a.al.r || 9, ang = a.al.ang || 70, k = a.al.push || 20;
      ev({ k: 'fx', m: 'foe', f: 'cone', x: r2(e.x), y: r2(e.y + 1), z: r2(e.z), yaw: r2(a.yaw), r, ang, c: 0xe8f4ff, s: 'frost', b: ET[e.type].boss || 0 });
      for (const p of ps) if (inCone(p, e.x, e.z, a.yaw, r + .4, ang + 6) && p.y < 4 && foeHit(p, dmg, e, { chill: 1 })) shove(p, Math.sin(a.yaw) * k, Math.cos(a.yaw) * k, 4);
    },
  },
  roll: { // a snowball shoved down a lane, bigger the further it goes
    start: (e, t, al, yaw) => ({ shape: 'line', x: e.x, z: e.z, yaw, len: al.len, w: 2.8 }),
    hit(e, a, dmg) {
      const al = a.al, fx = Math.sin(a.yaw), fz = Math.cos(a.yaw), x0 = e.x + fx * 1.5, z0 = e.z + fz * 1.5, hit = new Set();
      ev({ k: 'fx', m: 'foe', f: 'roll', x: r2(x0), z: r2(z0), yaw: r2(a.yaw), len: al.len, d: 1.2 });
      for (let i = 1; i <= 12; i++) later(i * .1, () => {
        const k = i / 12 * al.len, x = x0 + fx * k, z = z0 + fz * k;
        for (const p of players()) if (!p.down && !hit.has(p.id) && Math.hypot(p.x - x, p.z - z) < 1.2 + i * .07 && p.y < 1.6) { hit.add(p.id); if (foeHit(p, dmg, e, al)) shove(p, fx * 13, fz * 13, 5); }
      });
    },
  },
  // ----- the Infernal Legion's own -----
  spit: { // a short gout of fire
    start: (e, t, al, yaw) => ({ shape: 'cone', x: e.x, z: e.z, yaw, r: 5, ang: 40 }),
    hit(e, a, dmg, ps) {
      ev({ k: 'fx', m: 'foe', f: 'cone', x: r2(e.x), y: r2(e.y + 1.1 * e.sc), z: r2(e.z), yaw: r2(a.yaw), r: 5, ang: 40, c: C_FIRE, s: 'breath' });
      for (const p of ps) if (inCone(p, e.x, e.z, a.yaw, 5.4, 46) && p.y < 2) foeHit(p, dmg, e);
    },
  },
  whirl: { // spins up into a whirlwind of axes (it chases you in the berserker's tick)
    start: (e) => ({ shape: 'circle', x: e.x, z: e.z, r: 2.8 }),
    hit(e, a, dmg) { e.spin = { t: 2.2, k: 0, dmg }; },
  },
  barrage: { // three mortar shells walked onto you, each marked as it's fired
    start: () => null,
    hit(e, a, dmg, ps) {
      const p = near(e, ps); if (!p) return;
      for (let i = 0; i < 3; i++) {
        const q = i ? confine({ x: p.x + rand(-3.5, 3.5), z: p.z + rand(-3.5, 3.5) }, 1) : { x: p.x, z: p.z };
        later(i * .35, () => {
          ev({ k: 'tele', shape: 'circle', x: r2(q.x), z: r2(q.z), r: 2.4, d: .9 });
          ev({ k: 'fx', m: 'foe', f: 'lob', x: r2(e.x), y: r2(e.y + 2.2 * e.sc), z: r2(e.z), x2: r2(q.x), z2: r2(q.z), d: .9, c: C_FIRE, s: 'fire' });
          ev({ k: 'fx', m: 'foe', f: 'muzzle', x: r2(e.x), y: r2(e.y + 2.2 * e.sc), z: r2(e.z) });
        });
        later(i * .35 + .9, () => {
          ev({ k: 'fx', m: 'foe', f: 'splash', x: r2(q.x), z: r2(q.z), r: 2.4, c: C_FIRE, s: 'fire' });
          for (const o of players()) if (!o.down && Math.hypot(o.x - q.x, o.z - q.z) < 2.7 && o.y < 1.6) foeHit(o, dmg, e);
          addPool(q.x, q.z, 1.8, { life: 4, dps: 8, c: C_FIRE, s: 'fire' });
        });
      }
    },
  },
  blast: { // point-blank: the mortar fired flat, blowing you away and itself back
    start: (e, t, al, yaw) => ({ shape: 'cone', x: e.x, z: e.z, yaw, r: 6, ang: 90 }),
    hit(e, a, dmg, ps) {
      const fx = Math.sin(a.yaw), fz = Math.cos(a.yaw);
      ev({ k: 'fx', m: 'foe', f: 'cone', x: r2(e.x), y: r2(e.y + 1.5 * e.sc), z: r2(e.z), yaw: r2(a.yaw), r: 6, ang: 90, c: C_FIRE, s: 'fire' });
      for (const p of ps) if (inCone(p, e.x, e.z, a.yaw, 6.4, 96) && p.y < 2 && foeHit(p, dmg, e)) shove(p, fx * 18, fz * 18, 5);
      e.kx -= fx * 9; e.kz -= fz * 9;
    },
  },
  lash: { // the chain cracked down a narrow lane, well out of arm's reach
    start: (e, t, al, yaw) => ({ shape: 'line', x: e.x, z: e.z, yaw, len: 6.6, w: 1.1 }),
    hit(e, a, dmg, ps) {
      ev({ k: 'fx', m: 'foe', f: 'pull', x: r2(e.x), y: r2(e.y + 1.6 * e.sc), z: r2(e.z), yaw: r2(a.yaw), len: 6.6, c: 0xd06a30 });
      for (const p of ps) if (inLine(p, e.x, e.z, a.yaw, 6.6, 1.1) && p.y < 2) foeHit(p, dmg, e);
    },
  },
  hook: { // a hook thrown down a lane that drags you in, then straight into a lash
    start: (e, t, al, yaw) => ({ shape: 'line', x: e.x, z: e.z, yaw, len: al.len, w: al.w }),
    hit(e, a, dmg, ps) {
      const al = a.al;
      ev({ k: 'fx', m: 'foe', f: 'pull', x: r2(e.x), y: r2(e.y + 1.6 * e.sc), z: r2(e.z), yaw: r2(a.yaw), len: al.len, c: al.c });
      let got = false;
      for (const p of ps) if (inLine(p, e.x, e.z, a.yaw, al.len, al.w) && p.y < 2.5 && foeHit(p, dmg, e, al)) {
        got = true; const dx = e.x - p.x, dz = e.z - p.z, d = Math.hypot(dx, dz) || 1, k = Math.min(18, (d - 3) * 3.4);
        if (k > 0) shove(p, dx / d * k, dz / d * k, 3);
      }
      if (got) later(.5, () => { const p = near(e, players().filter(q => !q.down)); if (p && !e.dead && !e.atk && !e.cc) startAttack(e, p); });
    },
  },
  firewall: { // a wall of fire laid across the ground just behind you, burning for six seconds
    start(e, t) {
      const dx = t.x - e.x, dz = t.z - e.z, d = Math.hypot(dx, dz) || 1, cx = t.x + dx / d * 2.5, cz = t.z + dz / d * 2.5, px = dz / d, pz = -dx / d;
      Object.assign(e.atk, { wx: cx - px * 6, wz: cz - pz * 6, wy: Math.atan2(px, pz) });
      return { shape: 'line', x: e.atk.wx, z: e.atk.wz, yaw: e.atk.wy, len: 12, w: 1.6 };
    },
    hit(e, a, dmg, ps) {
      const fx = Math.sin(a.wy), fz = Math.cos(a.wy);
      for (let i = 0; i <= 8; i++) { const x = a.wx + fx * i * 1.5, z = a.wz + fz * i * 1.5; later(i * .04, () => { ev({ k: 'fx', m: 'foe', f: 'spike', x: r2(x), z: r2(z), i, c: C_FIRE, s: 'fire' }); addPool(x, z, 1.1, { life: 6, dps: 12, c: C_FIRE, s: 'fire' }); }); }
      for (const p of ps) if (inLine(p, a.wx, a.wz, a.wy, 12, 1.6) && p.y < 1.5) foeHit(p, dmg, e);
    },
  },
  pyre: { // a pillar of fire called down on the spot you stood
    start(e, t) { Object.assign(e.atk, { lx: t.x, lz: t.z }); return { shape: 'circle', x: t.x, z: t.z, r: 2.2 }; },
    hit(e, a, dmg, ps) {
      ev({ k: 'fx', m: 'foe', f: 'nova', x: r2(a.lx), z: r2(a.lz), r: 2.2, c: C_FIRE, s: 'fire' }); ev({ k: 'fx', m: 'foe', f: 'spike', x: r2(a.lx), z: r2(a.lz), i: 0, c: C_FIRE, s: 'fire' });
      for (const p of ps) if (Math.hypot(p.x - a.lx, p.z - a.lz) < 2.5 && p.y < 3) foeHit(p, dmg, e);
      addPool(a.lx, a.lz, 1.6, { life: 3, dps: 10, c: C_FIRE, s: 'fire' });
    },
  },
  flop: { // heaves itself up and lands belly-first on you
    start(e, t) {
      const dx = t.x - e.x, dz = t.z - e.z, d = Math.hypot(dx, dz) || 1, k = Math.min(d, 5);
      Object.assign(e.atk, { lx: e.x + dx / d * k, lz: e.z + dz / d * k });
      return { shape: 'circle', x: e.atk.lx, z: e.atk.lz, r: 3 * e.sc ** .5 };
    },
    hit(e, a, dmg) { e.leap = { x0: e.x, z0: e.z, x1: a.lx, z1: a.lz, t: 0, dmg, r: 3 * e.sc ** .5 }; },
  },
  // ----- the Void's own -----
  mirror: { // trades places with one of its reflections, in a flash
    start(e) {
      const o = S.enemies.filter(q => q.fake === e.id && !q.dead)[0]; e.acd2 = 6;
      if (o) { const x = e.x, z = e.z; ev({ k: 'fx', m: 'foe', f: 'blink', x: r2(x), z: r2(z), x2: r2(o.x), z2: r2(o.z), h: 1.9 }); e.x = o.x; e.z = o.z; o.x = x; o.z = z; }
      return 'done';
    },
  },
  chomp: { // a lunge of the jaws at whatever has been dragged in
    start: (e, t, al, yaw) => ({ shape: 'cone', x: e.x, z: e.z, yaw, r: 3.4, ang: 80 }),
    hit(e, a, dmg, ps) {
      ev({ k: 'fx', m: 'foe', f: 'nova', x: r2(e.x + Math.sin(a.yaw) * 1.5), z: r2(e.z + Math.cos(a.yaw) * 1.5), r: 1.8, c: C_VOID, s: 'void' });
      for (const p of ps) if (inCone(p, e.x, e.z, a.yaw, 3.8, 86) && p.y < 3) foeHit(p, dmg, e);
    },
  },
  zigzag: { // one dash through you, angled off to one side; it chains into the next straight away
    start(e, t, al, yaw) {
      const n = e.atk.al.zn ?? ET[e.type].n, side = n % 2 ? 1 : -1, y = yaw + side * .35;
      Object.assign(e.atk, { yaw: y, zn: n }); e.yaw = y;
      return { shape: 'line', x: e.x, z: e.z, yaw: y, len: 11, w: 1.5 };
    },
    hit(e, a, dmg, ps) {
      const x0 = e.x, z0 = e.z, fx = Math.sin(a.yaw), fz = Math.cos(a.yaw), q = confine({ x: e.x + fx * 11, z: e.z + fz * 11 }, 1);
      e.x = q.x; e.z = q.z; collide(e, ET[e.type].r * e.sc);
      ev({ k: 'fx', m: 'foe', f: 'phase', x: r2(x0), z: r2(z0), x2: r2(e.x), z2: r2(e.z) });
      for (const p of ps) if (inLine(p, x0, z0, a.yaw, 11, 1.5) && p.y < 1.8) foeHit(p, dmg, e);
      if (a.zn > 1) later(.12, () => { const p = near(e, players().filter(o => !o.down)); if (p && !e.dead && !e.atk && !e.cc) startAttack(e, p, { atk: 'zigzag', wind: .4, zn: a.zn - 1 }); });
    },
  },
  fling: { // a star-blade thrown out down a lane and back
    start: (e, t, al, yaw) => ({ shape: 'line', x: e.x, z: e.z, yaw, len: 15, w: 1.4 }),
    hit(e, a, dmg, ps) {
      ev({ k: 'fx', m: 'foe', f: 'fling', x: r2(e.x), z: r2(e.z), yaw: r2(a.yaw), len: 15 });
      const x0 = e.x, z0 = e.z, cut = () => { for (const p of players()) if (!p.down && inLine(p, x0, z0, a.yaw, 15, 1.4) && p.y < 2.5) foeHit(p, dmg, e); };
      cut(); later(.7, cut); // out, and back again
    },
  },
  beam: { // the eye opens wide: a beam it then holds on you (see the Unraveler's tick)
    start: (e, t, al, yaw) => ({ shape: 'line', x: e.x, z: e.z, yaw, len: 22, w: 1.2 }),
    hit(e, a, dmg) { e.bm = { t: 3, k: 0, yaw: a.yaw, dmg }; },
  },
  null: { // a field where no spell works, for five seconds
    start(e, t) { Object.assign(e.atk, { lx: t.x, lz: t.z }); return { shape: 'circle', x: t.x, z: t.z, r: 4 }; },
    hit(e, a) {
      (S.nulls ||= []).push({ x: a.lx, z: a.lz, r: 4, end: S.t + 5 }); S.nulls = S.nulls.filter(z => z.end > S.t);
      addPool(a.lx, a.lz, 4, { life: 5, dps: 0, c: 0x3a1060, s: 'void' });
      ev({ k: 'fx', m: 'foe', f: 'null', x: r2(a.lx), z: r2(a.lz) });
    },
  },
  // ----- the bosses' own -----
  shatterline: { // the Tyrant: the greatsword driven into the floor; a line of obsidian spires rips toward you, then every spire bursts
    start(e, t, al, yaw) {
      const n = al.n || 1;
      for (let i = 0; i < n; i++) if (i !== (n - 1) / 2) ev({ k: 'tele', shape: 'line', x: r2(e.x), z: r2(e.z), yaw: r2(yaw + (i - (n - 1) / 2) * .45), len: 22, w: 3, d: r2(al.wind) });
      return { shape: 'line', x: e.x, z: e.z, yaw, len: 22, w: 3 };
    },
    hit(e, a, dmg) {
      const n = a.al.n || 1, R = ET[e.type].r * e.sc, x0 = e.x, z0 = e.z;
      for (let j = 0; j < n; j++) {
        const yaw = a.yaw + (j - (n - 1) / 2) * .45, fx = Math.sin(yaw), fz = Math.cos(yaw), hit = new Set();
        for (let i = 0; i < 8; i++) later(i * .07, () => {
          const x = x0 + fx * (R + 1 + i * 2.4), z = z0 + fz * (R + 1 + i * 2.4);
          ev({ k: 'fx', m: 'foe', f: 'spike', x: r2(x), z: r2(z), i, c: 0x3a1a4a, s: 'obsidian' });
          for (const p of players()) if (!p.down && !hit.has(p.id) && Math.hypot(p.x - x, p.z - z) < 1.7 && p.y < 1) { hit.add(p.id); foeHit(p, dmg, e); }
          later(1, () => { // the spire bursts into shards
            ev({ k: 'fx', m: 'foe', f: 'nova', x: r2(x), z: r2(z), r: 2.2, c: 0xff5a20, s: 'obsidian' });
            for (const p of players()) if (!p.down && Math.hypot(p.x - x, p.z - z) < 2.4 && p.y < 1.6) foeHit(p, dmg * .6, e);
          });
        });
      }
    },
  },
  decree: { // the Tyrant: "kneel" — the whole island burns except a circle at his feet; come close or be struck down
    start(e) { ev({ k: 'tele', shape: 'circle', x: r2(e.x), z: r2(e.z), r: 30, d: r2(e.atk.t) }); ev({ k: 'decree', id: e.id, d: r2(e.atk.t) }); return { shape: 'circle', x: e.x, z: e.z, r: 6.5, ally: 1 }; },
    hit(e, a, dmg, ps) {
      ev({ k: 'fx', m: 'foe', f: 'decree', x: r2(e.x), z: r2(e.z) });
      for (const p of ps) if (Math.hypot(p.x - e.x, p.z - e.z) > 6.8 && foeHit(p, dmg, e)) { const dx = p.x - e.x, dz = p.z - e.z, k = Math.hypot(dx, dz) || 1; shove(p, dx / k * 8, dz / k * 8, 6); }
    },
  },
  sunder: { // the Tyrant: the greatsword swung all the way round
    start: (e, t, al) => ({ shape: 'circle', x: e.x, z: e.z, r: al.r }),
    hit(e, a, dmg, ps) {
      const al = a.al;
      ev({ k: 'fx', m: 'foe', f: 'nova', x: r2(e.x), z: r2(e.z), r: al.r, c: 0xff5a20, s: 'obsidian', b: 1 });
      for (const p of ps) { const dx = p.x - e.x, dz = p.z - e.z, k = Math.hypot(dx, dz) || 1; if (k < al.r + .3 && p.y < 1.6 && foeHit(p, dmg, e)) shove(p, dx / k * 16, dz / k * 16, 5); }
    },
  },
  clones: { // Nyx: shades of her step out of the dark all round you, each marks a lane and tears down it
    start(e, t, al) {
      const n = al.n || 3, a0 = rand(0, TAU);
      for (let i = 0; i < n; i++) { const a = a0 + TAU * i / n, q = confine({ x: t.x + Math.sin(a) * 9, z: t.z + Math.cos(a) * 9 }, 1), o = spawnEnemy('nyxshade', q.x, q.z); Object.assign(o, { rise: 0, y: 0, go: S.t + 1 + i * .2, dmg: al.dmg * bsc() }); ev({ k: 'fx', m: 'foe', f: 'blink', x: r2(e.x), z: r2(e.z), x2: r2(q.x), z2: r2(q.z), h: 3 }); }
      ev({ k: 'strike', id: e.id, a: 'call' }); return 'done';
    },
  },
  eclipse: { // Nyx: the light goes out, and she fades into the dark with it
    start(e, t, al) { if (!e.night) { e.mod0 = S.mod === 'darkness' ? null : S.mod; S.mod = 'darkness'; } e.ecl = S.t + al.t; ev({ k: 'fx', m: 'foe', f: 'eclipse', x: r2(e.x), z: r2(e.z) }); return 'done'; },
  },
  sweep: { // a beam swept across a wide arc (the warning shows all of it); stay low behind it or jump it
    start: (e, t, al, yaw) => ({ shape: 'cone', x: e.x, z: e.z, yaw, r: al.len, ang: al.arc }),
    hit(e, a, dmg) {
      const al = a.al, n = Math.round(al.arc / 12), hit = new Set();
      for (let i = 0; i <= n; i++) later(i * .05, () => {
        if (e.dead) return;
        const yaw = a.yaw + (i / n - .5) * al.arc * Math.PI / 180;
        ev({ k: 'fx', m: 'foe', f: 'laser', x: r2(e.x), y: r2(e.y + ET[e.type].h * e.sc * .7), z: r2(e.z), yaw: r2(yaw), len: al.len, c: al.c, w: 1, s: i ? 0 : 1 });
        for (const p of players()) if (!p.down && !hit.has(p.id) && inLine(p, e.x, e.z, yaw, al.len, 1.4) && p.y < 1.4) { hit.add(p.id); foeHit(p, dmg, e, al); }
      });
    },
  },
  graves: { // the Lich: hands of bone claw up round every player, three marked circles each
    start(e, t, al) {
      const s = bsc(); ev({ k: 'strike', id: e.id, a: 'call' }); e.acd = Math.max(e.acd, 1.2);
      for (const p of livePs()) for (let i = 0; i < 3; i++) {
        const q = i ? confine({ x: p.x + rand(-4, 4), z: p.z + rand(-4, 4) }, 1) : { x: p.x, z: p.z }, d = 1 + i * .25;
        ev({ k: 'tele', shape: 'circle', x: r2(q.x), z: r2(q.z), r: 2.2, d });
        later(d, () => {
          for (let j = 0; j < 6; j++) ev({ k: 'fx', m: 'foe', f: 'spike', x: r2(q.x + Math.sin(TAU * j / 6) * 1.8), z: r2(q.z + Math.cos(TAU * j / 6) * 1.8), i: j, c: 0xe8dcc0, s: 'bone' });
          for (const o of livePs()) if (Math.hypot(o.x - q.x, o.z - q.z) < 2.4 && o.y < 1.4) foeHit(o, al.dmg * s, e, { chill: 1.5 });
        });
      }
      return 'done';
    },
  },
  tailsweep: { // the Bone Dragon: its tail swept round everything but what's in front of it
    start: (e, t, al) => ({ shape: 'circle', x: e.x, z: e.z, r: al.r }),
    hit(e, a, dmg, ps) {
      const al = a.al;
      ev({ k: 'fx', m: 'foe', f: 'nova', x: r2(e.x), z: r2(e.z), r: al.r, c: 0xe8dcc0, s: 'bone', b: 1 });
      for (const p of ps) { const dx = p.x - e.x, dz = p.z - e.z, k = Math.hypot(dx, dz) || 1; if (k < al.r + .3 && p.y < 1.4 && !inCone(p, e.x, e.z, a.yaw, al.r + 1, 70) && foeHit(p, dmg, e)) shove(p, dx / k * 14, dz / k * 14, 5); }
    },
  },
  skyfall: { start(e, t, al) { e.sky = { runs: al.runs || 3, run: null }; e.atk = null; ev({ k: 'fx', m: 'foe', f: 'takeoff', x: r2(e.x), z: r2(e.z) }); return 'done'; } },
  avalanche: { // Hrimgar: a fan of great snowballs bowled down the mountain at you
    start(e, t, al, yaw) {
      const n = al.n || 3;
      for (let i = 0; i < n; i++) if (i !== (n - 1) / 2) ev({ k: 'tele', shape: 'line', x: r2(e.x), z: r2(e.z), yaw: r2(yaw + (i - (n - 1) / 2) * .32), len: 26, w: 3, d: r2(al.wind) });
      return { shape: 'line', x: e.x, z: e.z, yaw, len: 26, w: 3 };
    },
    hit(e, a, dmg) { const n = a.al.n || 3; for (let i = 0; i < n; i++) FOE_ATK.roll.hit(e, { ...a, yaw: a.yaw + (i - (n - 1) / 2) * .32, al: { len: 26, chill: 2 } }, dmg); },
  },
  stomp: { // Hrimgar: stamps again and again, each one a ring of frost racing outward (jump them)
    start: (e) => ({ shape: 'circle', x: e.x, z: e.z, r: 5 }),
    hit(e, a) {
      const n = a.al.n || 3, R = ET[e.type].r * e.sc;
      for (let i = 0; i < n; i++) later(i * .5, () => { if (e.dead) return; S.rings.push({ x: e.x, z: e.z, r: R, life: 2.4, hit: [] }); ev({ k: 'ring', x: r2(e.x), z: r2(e.z), r: R }); ev({ k: 'fx', m: 'foe', f: 'nova', x: r2(e.x), z: r2(e.z), r: 4, c: C_ICE, s: 'ice' }); ev({ k: 'strike', id: e.id, a: 'stomp' }); });
    },
  },
  tomb: { // Skadi: ice closes round you; caught inside, you can't move for a moment
    start(e, t, al) {
      e.atk.tg = (al.all ? livePs() : [t]).map(p => ({ id: p.id, x: p.x, z: p.z }));
      for (const q of e.atk.tg) ev({ k: 'tele', shape: 'circle', x: r2(q.x), z: r2(q.z), r: 1.8, d: r2(e.atk.t) });
      return null;
    },
    hit(e, a, dmg) {
      for (const q of a.tg) {
        const p = S.players[q.id]; ev({ k: 'fx', m: 'foe', f: 'nova', x: r2(q.x), z: r2(q.z), r: 1.8, c: C_ICE, s: 'ice' });
        if (p && !p.down && Math.hypot(p.x - q.x, p.z - q.z) < 2 && foeHit(p, dmg, e)) { p.bf.frozen = 1.6; ev({ k: 'fx', m: 'foe', f: 'frozen', id: p.id, x: r2(p.x), z: r2(p.z) }); }
      }
    },
  },
  shards: { // Skadi: rings of ice shards fired out all round, each ring turned a little: find the gaps
    start: (e) => ({ shape: 'circle', x: e.x, z: e.z, r: 3, ally: 1 }),
    hit(e, a, dmg) {
      const w = a.al.waves || 3;
      for (let k = 0; k < w; k++) later(k * .35, () => {
        if (e.dead) return;
        for (let i = 0; i < 14; i++) { const ang = TAU * i / 14 + k * .11; S.shots.push({ id: S.nid++, foe: 1, mv: 'foe', el: 'foe', x: e.x, y: e.y + 1.4, z: e.z, vx: Math.sin(ang) * 10, vy: 0, vz: Math.cos(ang) * 10, life: 2.6, dmg, sc: 1, c: C_ICE }); }
        ev({ k: 'fx', m: 'foe', f: 'nova', x: r2(e.x), z: r2(e.z), r: 2, c: C_ICE, s: 'ice' });
      });
    },
  },
  gates: { // Azgaroth: tears open two hellgates that spill imps until you close them
    start(e) { e.atk.at = aroundIsle(2, 13); for (const q of e.atk.at) ev({ k: 'tele', shape: 'circle', x: r2(q.x), z: r2(q.z), r: 2, d: r2(e.atk.t), ally: 1 }); return null; },
    hit(e, a) { for (const q of a.at) { spawnEnemy('hellgate', q.x, q.z); ev({ k: 'fx', m: 'foe', f: 'summon', x: r2(q.x), z: r2(q.z), c: C_FIRE, b: 1 }); } },
  },
  geysers: { // Azgaroth: the ground splits open in fountains of lava all over the island, and under you
    start(e, t, al) {
      const s = bsc(), pts = [...livePs().map(p => ({ x: p.x, z: p.z })), ...Array.from({ length: al.n }, () => inIsle())];
      if (!al.quiet) { ev({ k: 'strike', id: e.id, a: 'call' }); e.acd = Math.max(e.acd, 1.2); }
      pts.forEach((q, i) => {
        const d = 1 + i * .1; ev({ k: 'tele', shape: 'circle', x: r2(q.x), z: r2(q.z), r: 2, d: r2(d) });
        later(d, () => { ev({ k: 'fx', m: 'foe', f: 'spike', x: r2(q.x), z: r2(q.z), i, c: C_FIRE, s: 'fire' }); for (const o of livePs()) if (Math.hypot(o.x - q.x, o.z - q.z) < 2.3 && o.y < 2.5) foeHit(o, al.dmg * s, e); });
      });
      return 'done';
    },
  },
  crescent: { // Belphegor: the sword swung so hard a crescent of fire rolls off it across the ground
    start(e, t, al, yaw) {
      const n = al.n || 1;
      for (let i = 0; i < n; i++) if (i !== (n - 1) / 2) ev({ k: 'tele', shape: 'line', x: r2(e.x), z: r2(e.z), yaw: r2(yaw + (i - (n - 1) / 2) * .5), len: 24, w: 5, d: r2(al.wind) });
      return { shape: 'line', x: e.x, z: e.z, yaw, len: 24, w: 5 };
    },
    hit(e, a, dmg) {
      const n = a.al.n || 1, x0 = e.x, z0 = e.z;
      for (let j = 0; j < n; j++) {
        const yaw = a.yaw + (j - (n - 1) / 2) * .5, fx = Math.sin(yaw), fz = Math.cos(yaw), hit = new Set();
        for (let i = 1; i <= 10; i++) later(i * .06, () => {
          const cx = x0 + fx * i * 2.4, cz = z0 + fz * i * 2.4;
          for (const s of [-1.7, 0, 1.7]) ev({ k: 'fx', m: 'foe', f: 'spike', x: r2(cx + fz * s), z: r2(cz - fx * s), i: s ? 1 : i, c: C_FIRE, s: 'fire' });
          for (const p of players()) if (!p.down && !hit.has(p.id) && inLine(p, cx - fx * 1.3, cz - fz * 1.3, yaw, 2.6, 5) && p.y < 1.4) { hit.add(p.id); foeHit(p, dmg, e); }
        });
      }
    },
  },
  doom: { // Belphegor: a brand of doom on every player; it follows you, settles, and bursts: keep away from your friend
    start(e, t, al) {
      const s = bsc();
      for (const p of livePs()) {
        ev({ k: 'fx', m: 'foe', f: 'doom', id: p.id, d: 2.6 });
        later(2.6, () => {
          const q = { x: p.x, z: p.z }; ev({ k: 'tele', shape: 'circle', x: r2(q.x), z: r2(q.z), r: 5, d: .9 });
          later(.9, () => { ev({ k: 'fx', m: 'foe', f: 'nova', x: r2(q.x), z: r2(q.z), r: 5, c: C_FIRE, s: 'fire', b: 1 }); for (const o of livePs()) if (Math.hypot(o.x - q.x, o.z - q.z) < 5.3 && o.y < 2) foeHit(o, al.dmg * s, e); });
        });
      }
      return 'done';
    },
  },
  gaze: { // the Watcher opens its eye wide: anyone still looking at it when it flashes is struck
    start(e, t, al) {
      const s = bsc(); ev({ k: 'gaze', id: e.id, d: 1.8 }); e.acd = Math.max(e.acd, 2);
      later(1.8, () => {
        if (e.dead) return;
        ev({ k: 'fx', m: 'foe', f: 'gazeflash', x: r2(e.x), y: r2(e.y + 3.2), z: r2(e.z) });
        for (const p of livePs()) { const dx = e.x - p.x, dz = e.z - p.z, k = Math.hypot(dx, dz) || 1, f = flatAim(p); if ((f.x * dx + f.z * dz) / k > .6) foeHit(p, al.dmg * s, e, { chill: 2 }); }
      });
      return 'done';
    },
  },
  spin: { // the Watcher: a beam swung round and round, low over the floor (see spinTick)
    start: (e) => ({ shape: 'circle', x: e.x, z: e.z, r: 24 }),
    hit(e, a, dmg) { e.spinL = { t: a.al.t || 4, yaw: a.yaw, two: a.al.two, k: 0, hitT: {}, dmg }; },
  },
  inhale: { // the Devourer opens wide and breathes in (see inhaleTick)
    start: (e) => ({ shape: 'circle', x: e.x, z: e.z, r: ET[e.type].r * e.sc + 3 }),
    hit(e, a, dmg) { e.inh = { t: 2.6, k: 0, dmg }; ev({ k: 'fx', m: 'foe', f: 'inhale', x: r2(e.x), z: r2(e.z) }); },
  },
  starfall: { // the Devourer: stars torn out of the sky, all over the island and onto you
    start(e, t, al) {
      const s = bsc(), pts = [...livePs().map(p => ({ x: p.x, z: p.z })), ...Array.from({ length: al.n }, () => inIsle())];
      ev({ k: 'strike', id: e.id, a: 'call' }); e.acd = Math.max(e.acd, 1.2);
      pts.forEach((q, i) => {
        const d = 1.1 + i * .17; ev({ k: 'tele', a: 'meteor', s: 'void', c: C_VOID, shape: 'circle', x: r2(q.x), z: r2(q.z), r: 2.2, d: r2(d) });
        later(d, () => { ev({ k: 'fx', m: 'foe', f: 'impact', x: r2(q.x), z: r2(q.z), r: 2.2, c: C_VOID, s: 'void', b: 1 }); for (const o of livePs()) if (Math.hypot(o.x - q.x, o.z - q.z) < 2.5 && o.y < 1.5) foeHit(o, al.dmg * s, e); });
      });
      return 'done';
    },
  },
};
for (const k of ['shatterline', 'sunder', 'sweep', 'tailsweep', 'avalanche', 'crescent', 'gust', 'erupt', 'cage', 'siphon', 'stampede', 'dive', 'roll', 'hurl', 'pounce', 'blast', 'lash', 'hook', 'firewall', 'pyre', 'flop', 'zigzag', 'fling', 'beam', 'null']) LOCKED.add(k);
const RIMC = { necromancer: 0x9a6aff, lich: 0x7ae8ff, frostqueen: 0x9fe6ff, archdemon: 0xff6a1a, watcher: 0xb04cff, umbra: 0x9a4cff };

// ===================== the bosses =====================
// Every boss fights its own way: spec is what it picks from every few seconds, spec2 replaces it from half health, and
// phase2 changes the fight itself at that point (phylacteries to break, a blizzard, rising lava, a closed eye, endless night).
const bsc = () => 1 + .06 * (S.wave - 1);
const livePs = () => players().filter(p => !p.down);
function aroundIsle(n, r) { const I = isleCenter(), a0 = rand(0, TAU); return Array.from({ length: n }, (_, i) => ({ x: I.x + Math.sin(a0 + TAU * i / n) * r, z: I.z + Math.cos(a0 + TAU * i / n) * r })); }
function inIsle(pad = 3) { const I = isleCenter(), a = rand(0, TAU), r = Math.sqrt(Math.random()) * (I.r - pad); return { x: I.x + Math.sin(a) * r, z: I.z + Math.cos(a) * r }; }
// a boss hiding behind things you have to break first: untouchable (and slowly mending) until they're gone, then stunned and open
function guardTick(e, dt, mend) {
  if (!e.guard?.length) { if (e.vs === 'warded') e.vs = 0; return; }
  e.guard = e.guard.filter(id => S.enemies.some(o => o.id === id && !o.dead));
  if (e.guard.length) { e.vs = 'warded'; e.hp = Math.min(e.max * .5, e.hp + e.max * mend * dt); return; }
  e.vs = 0; e.bare = S.t + 7; e.atk = null; e.cc = { type: 'stun', t: 3.5, max: 3.5 };
  ev({ k: 'fx', m: 'foe', f: 'unward', x: r2(e.x), z: r2(e.z), id: e.id });
}
const guardWard = (e, n) => e.guard?.length ? 0 : e.bare > S.t ? n * 1.5 : n;
function guards(e, type, n, r) { e.guard = aroundIsle(n, r).map(q => { const o = spawnEnemy(type, q.x, q.z); o.gl = e.id; return o.id; }); }

// ---- the boss-only helpers ----
Object.assign(ET, {
  phylactery: { hp: 240, spd: 0, r: .7, h: 2.4, dmg: 10, reach: 0, cost: 0, from: 99, kb: 0, poise: 999, atk: 'nova', wind: 1, cd: 3, zone: 'crypt', name: 'Phylactery', oc: C_SOUL,
    tick(e, dt, tgt, d, ps) { if ((e.pt = (e.pt ?? 2) - dt) <= 0) { e.pt = 2.6; foeOrb(e, {}, ps, 0, 10 * bsc()); } return true; } },
  hellgate: { hp: 180, spd: 0, r: .9, h: 3, dmg: 0, reach: 0, cost: 0, from: 99, kb: 0, poise: 999, atk: 'nova', wind: 1, cd: 3, zone: 'hell', name: 'Hellgate',
    tick(e, dt) {
      if ((e.life = (e.life ?? 16) - dt) <= 0) { kill(e, null, null); return true; }
      if ((e.pt = (e.pt ?? 1) - dt) <= 0 && S.enemies.filter(o => o.type === 'cinderimp' && !o.dead).length < 9) {
        e.pt = 2.8; spawnEnemy('cinderimp', e.x + rand(-1, 1), e.z + rand(-1, 1)).pack = 1; ev({ k: 'fx', m: 'foe', f: 'summon', x: r2(e.x), z: r2(e.z), c: C_FIRE });
      }
      return true;
    } },
  nyxshade: { hp: 30, spd: 0, r: .6, h: 4.2, dmg: 0, reach: 0, cost: 0, from: 99, kb: 0, poise: 999, atk: 'swipe', wind: 1, cd: 9, name: 'Shade of Nyx',
    tick(e, dt, tgt) { // marks its lane, then tears down it once and is gone
      if (e.ly == null) { e.ly = Math.atan2(tgt.x - e.x, tgt.z - e.z); ev({ k: 'tele', shape: 'line', x: r2(e.x), z: r2(e.z), yaw: r2(e.ly), len: 18, w: 2, d: r2(Math.max(.2, e.go - S.t)) }); }
      e.yaw = e.ly;
      if (S.t < e.go) return true;
      const x0 = e.x, z0 = e.z; e.x += Math.sin(e.ly) * 18; e.z += Math.cos(e.ly) * 18;
      ev({ k: 'fx', m: 'foe', f: 'phase', x: r2(x0), z: r2(z0), x2: r2(e.x), z2: r2(e.z), c: 0x9a4cff });
      for (const p of livePs()) if (inLine(p, x0, z0, e.ly, 18, 2) && p.y < 2) foeHit(p, e.dmg, e);
      kill(e, null, null); return true;
    },
    ward(e) { ev({ k: 'fx', m: 'foe', f: 'shatter', x: r2(e.x), z: r2(e.z) }); kill(e, null, null); return 0; } },
});

// ---- 1: the Obsidian Tyrant ----
Object.assign(ET.boss, {
  hp: 1700, p2: 'The Tyrant\'s armour cracks: molten fury pours out',
  spec: [{ atk: 'shatterline', wind: 1.1, dmg: 24 }, { atk: 'decree', wind: 1.7, dmg: 30 }, 'charge', 'meteor'],
  spec2: [{ atk: 'shatterline', wind: 1, dmg: 26, n: 3 }, { atk: 'sunder', wind: .9, r: 7.5, dmg: 30 }, { atk: 'decree', wind: 1.4, dmg: 34 }, 'meteor', 'charge'],
  phase2(e) { e.molten = 1; },
  tick(e, dt) {
    if (e.ch > 0 && (e.trl = (e.trl ?? 0) - dt) <= 0) { e.trl = .1; addPool(e.x, e.z, 1.5, { life: 4, dps: 12, c: C_FIRE, s: 'fire' }); } // his charge leaves the floor burning
    if (e.molten && (e.gy = (e.gy ?? 2) - dt) <= 0) { e.gy = 4.5; FOE_ATK.geysers.start(e, null, { n: S.mode === 'arena' ? 3 : 0, dmg: 16, quiet: 1 }); }
    e.vs = e.molten ? 'molten' : 0;
    return false;
  },
});
// ---- 1: Nyx, the Umbral Wraith ----
Object.assign(ET.umbra, {
  p2: 'Nyx drags the island into endless night',
  spec: [{ atk: 'clones', n: 3, dmg: 18 }, { atk: 'eclipse', t: 7 }, { atk: 'rain', n: 4, r: 2.4, dmg: 18, c: 0x9a4cff, s: 'shadow' }, { atk: 'cone', wind: 1, r: 14, ang: 60, dmg: 22, c: 0x9a4cff, s: 'shadow' }],
  spec2: [{ atk: 'clones', n: 5, dmg: 20 }, { atk: 'spikes', wind: 1, dmg: 22, c: 0x9a4cff, s: 'shadow', n: 5 }, { atk: 'rain', n: 5, r: 2.4, dmg: 20, c: 0x9a4cff, s: 'shadow' }, { atk: 'nova', wind: 1.1, r: 8, dmg: 22, c: 0x9a4cff, s: 'shadow' }],
  phase2(e) { e.night = 1; S.mod = 'darkness'; },
  tick(e) { if (e.ecl && S.t > e.ecl) { e.ecl = 0; if (!e.night) S.mod = e.mod0 ?? null; } e.vs = e.ecl ? 'hide' : 0; return false; },
  die(e) { if (e.night || e.ecl) S.mod = null; },
});
// ---- 2: the Lich King ----
Object.assign(ET.lich, {
  p2: 'The Lich King hides his soul in three phylacteries: break them!',
  spec: [{ atk: 'sweep', wind: 1.1, len: 24, arc: 140, dmg: 22, c: C_SOUL }, { atk: 'graves', dmg: 16 }, { atk: 'summon', wind: 1.2, n: 4, type: 'crawler', cap: 10 }, { atk: 'rain', n: 4, r: 2.4, dmg: 18, c: 0xe8dcc0, s: 'bone' }],
  spec2: [{ atk: 'sweep', wind: 1, len: 24, arc: 230, dmg: 24, c: C_SOUL }, { atk: 'graves', dmg: 18 }, { atk: 'nova', wind: 1.3, r: 10, dmg: 26, c: C_SOUL, s: 'soul', pool: { life: 4, dps: 8 } }, { atk: 'summon', wind: 1, n: 2, type: 'bonearcher', cap: 4 }],
  phase2: e => guards(e, 'phylactery', 3, 11),
  tick(e, dt) { guardTick(e, dt, .02); return false; },
  ward: guardWard,
});
// ---- 2: the Bone Dragon ----
Object.assign(ET.bonedragon, {
  p2: 'The Bone Dragon takes to the sky',
  spec: [{ atk: 'cone', wind: 1.1, r: 15, ang: 55, dmg: 26, c: C_POI, s: 'breath', pool: { life: 4, dps: 10 } }, { atk: 'tailsweep', wind: .9, r: 7, dmg: 24 }, { atk: 'gust', wind: .9, r: 14, ang: 100, push: 26, dmg: 8 }, { atk: 'rain', n: 3, r: 2.8, dmg: 22, c: 0xe8dcc0, s: 'bone' }],
  spec2: [{ atk: 'cone', wind: 1, r: 16, ang: 60, dmg: 28, c: C_POI, s: 'breath', pool: { life: 5, dps: 12 } }, { atk: 'tailsweep', wind: .8, r: 7.5, dmg: 26 }, { atk: 'skyfall', runs: 3 }, { atk: 'gust', wind: .8, r: 14, ang: 100, push: 26, dmg: 8 }],
  phase2: e => FOE_ATK.skyfall.start(e, null, { runs: 3 }),
  tick: skyTick,
});
// ---- 3: Hrimgar the Frost Giant ----
Object.assign(ET.frostgiant, {
  p2: 'A blizzard howls over the peaks',
  spec: [{ atk: 'avalanche', wind: 1.2, dmg: 24 }, { atk: 'stomp', wind: 1.1, n: 3 }, { atk: 'lob', wind: 1.2, r: 3.6, dmg: 26, c: 0xd8f0ff, s: 'boulder', pool: { life: 4, dps: 3, chill: 1 } }, { atk: 'spikes', wind: 1.1, dmg: 22, c: C_ICE, s: 'ice', n: 3 }],
  spec2: [{ atk: 'avalanche', wind: 1, dmg: 26, n: 5 }, { atk: 'stomp', wind: 1, n: 4 }, { atk: 'spikes', wind: 1, dmg: 24, c: C_ICE, s: 'ice', n: 5 }, { atk: 'nova', wind: 1.2, r: 9, dmg: 22, c: C_ICE, s: 'ice', chill: 2.5 }],
  phase2(e) { e.bliz = 1; },
  tick(e, dt) {
    if (e.bliz && (e.bt = (e.bt ?? 2) - dt) <= 0) { e.bt = 3.2; FOE_ATK.rain.start(e, null, { n: 2, r: 1.8, dmg: 12, c: C_ICE, s: 'ice', chill: 1, quiet: 1 }); }
    e.vs = e.bliz ? 'bliz' : 0; return false;
  },
});
// ---- 3: Skadi, the Frost Queen ----
Object.assign(ET.frostqueen, {
  p2: 'Skadi calls down a storm of shards',
  spec: [{ atk: 'tomb', wind: .9, dmg: 10 }, { atk: 'rain', n: 5, r: 2, dmg: 16, c: C_ICE, s: 'ice', chill: 1.5 }, { atk: 'cone', wind: 1.2, r: 17, ang: 70, dmg: 18, c: C_ICE, s: 'frost', chill: 3 }, { atk: 'summon', wind: 1, n: 3, type: 'snowcat', cap: 8 }],
  spec2: [{ atk: 'shards', wind: .9, waves: 4, dmg: 12 }, { atk: 'tomb', wind: .8, dmg: 12, all: 1 }, { atk: 'ray', wind: 1, len: 26, w: 1.8, dmg: 24, c: C_ICE, s: 'ice', chill: 2, n: 3 }, { atk: 'rain', n: 5, r: 2, dmg: 16, c: C_ICE, s: 'ice', chill: 1.5 }],
  phase2(e) { e.glide = S.t + 2; },
  tick(e) { // from half health she never stays put: a flurry of ice and she's somewhere else on the island
    if (e.glide && S.t > e.glide && !e.atk) { e.glide = S.t + 7; const q = inIsle(4); ev({ k: 'fx', m: 'foe', f: 'iceblink', x: r2(e.x), z: r2(e.z), x2: r2(q.x), z2: r2(q.z) }); e.x = q.x; e.z = q.z; }
    return false;
  },
});
// ---- 4: Azgaroth the Pit Lord ----
Object.assign(ET.pitlord, {
  p2: 'The pit rises: lava swallows the edge of the island',
  spec: [{ atk: 'smash', wind: 1.05, chain: 2, dmg: 30 }, { atk: 'cone', wind: 1.1, r: 15, ang: 55, dmg: 26, c: C_FIRE, s: 'breath', pool: { life: 4, dps: 12 } }, { atk: 'gates', wind: 1.2 }, { atk: 'geysers', n: 12, dmg: 22 }],
  spec2: [{ atk: 'smash', wind: .95, chain: 3, dmg: 30 }, { atk: 'geysers', n: 18, dmg: 24 }, { atk: 'gates', wind: 1 }, 'charge'],
  phase2(e) { e.lava = 1; },
  tick(e, dt) { // the lava ring round the edge, laid fresh every few seconds while it lives
    if (e.lava && (e.lt = (e.lt ?? 0) - dt) <= 0) { e.lt = 5.5; const I = isleCenter(); for (let k = 0; k < 26; k++) { const a = TAU * k / 26; addPool(I.x + Math.sin(a) * (I.r - 1.5), I.z + Math.cos(a) * (I.r - 1.5), 3, { life: 6, dps: 16, c: C_FIRE, s: 'fire' }); } }
    return false;
  },
});
// ---- 4: Belphegor the Archdemon ----
Object.assign(ET.archdemon, {
  p2: 'Belphegor spreads his wings: doom falls from the sky',
  spec: [{ atk: 'crescent', wind: .9, dmg: 26 }, { atk: 'doom', dmg: 32 }, { atk: 'summon', wind: 1, n: 3, type: 'cinderimp', cap: 9 }, { atk: 'nova', wind: 1.1, r: 8, dmg: 24, c: C_FIRE, s: 'fire', pool: { life: 3, dps: 10 } }],
  spec2: [{ atk: 'crescent', wind: .8, dmg: 28, n: 3 }, { atk: 'doom', dmg: 34 }, { atk: 'rain', n: 6, r: 2.4, dmg: 20, c: C_FIRE, s: 'meteor' }, { atk: 'ray', wind: 1, len: 26, w: 2, dmg: 26, c: C_FIRE, s: 'fire', pool: { life: 3, dps: 10 } }],
  phase2: e => FOE_ATK.doom.start(e, null, { dmg: 34 }),
});
// ---- 5: the Watcher Beyond ----
Object.assign(ET.watcher, {
  p2: 'The Watcher closes its eye: kill its brood to open it',
  spec: [{ atk: 'gaze', dmg: 30 }, { atk: 'ray', wind: 1, len: 28, w: 2, dmg: 26, c: C_VOID, s: 'void', n: 3 }, { atk: 'spin', wind: 1.2, dmg: 22, t: 4 }, { atk: 'rain', n: 4, r: 2.4, dmg: 20, c: C_VOID, s: 'void' }],
  spec2: [{ atk: 'gaze', dmg: 34 }, { atk: 'spin', wind: 1, dmg: 24, t: 5, two: 1 }, { atk: 'ray', wind: .9, len: 28, w: 2, dmg: 26, c: C_VOID, s: 'void', n: 5 }, { atk: 'summon', wind: 1, n: 2, type: 'gazer', cap: 4 }],
  phase2: e => guards(e, 'gazer', 3, 9),
  tick(e, dt, tgt, d, ps) { guardTick(e, dt, .01); return spinTick(e, dt, ps); },
  ward: guardWard,
});
// ---- 5: the Devourer of Stars ----
Object.assign(ET.devourer, {
  p2: 'The Devourer hungers: it feeds on its own brood',
  spec: [{ atk: 'inhale', wind: .8, dmg: 34 }, { atk: 'spikes', wind: 1.1, dmg: 24, c: C_VOID, s: 'tentacle', n: 3 }, { atk: 'rain', n: 4, r: 2.6, dmg: 20, c: C_VOID, s: 'void' }, { atk: 'nova', wind: 1.1, r: 9, dmg: 24, c: C_VOID, s: 'void', pool: { life: 4, dps: 7, pull: 1 } }],
  spec2: [{ atk: 'inhale', wind: .7, dmg: 38 }, { atk: 'starfall', n: 16, dmg: 22 }, { atk: 'spikes', wind: 1, dmg: 24, c: C_VOID, s: 'tentacle', n: 6 }, { atk: 'summon', wind: 1, n: 3, type: 'maw', cap: 3 }],
  phase2(e) { e.feed = S.t + 3; },
  tick(e, dt, tgt, d, ps) {
    if (e.feed && S.t > e.feed && !e.atk && !e.inh) { // it drags in up to two of its own and swallows them whole
      e.feed = S.t + 9;
      const food = S.enemies.filter(o => o !== e && alive(o) && !ET[o.type].boss).sort((a, b) => Math.hypot(a.x - e.x, a.z - e.z) - Math.hypot(b.x - e.x, b.z - e.z)).slice(0, 2);
      for (const o of food) { ev({ k: 'fx', m: 'foe', f: 'pull', x: r2(e.x), y: 3, z: r2(e.z), yaw: r2(Math.atan2(o.x - e.x, o.z - e.z)), len: r2(Math.hypot(o.x - e.x, o.z - e.z)), c: C_VOID }); ev({ k: 'fx', m: 'foe', f: 'devour', x: r2(o.x), z: r2(o.z) }); e.hp = Math.min(e.max, e.hp + e.max * .06); kill(o, null, null); }
    }
    return inhaleTick(e, dt, ps);
  },
});

// the Bone Dragon's flight: three strafing runs low over the island, poison pouring down, then it crashes down on someone
function skyTick(e, dt, tgt, d, ps) {
  const K = e.sky; if (!K) return false;
  Object.assign(e, { gone: 1, fly: 1, vy: 0, vs: 'sky', atk: null });
  let R = K.run;
  if (!R) {
    if (K.runs-- <= 0) {
      const p = near(e, ps) || tgt, q = confine({ x: p.x + rand(-2, 2), z: p.z + rand(-2, 2) }, 2);
      Object.assign(e, { sky: null, gone: 0, fly: 0, vs: 0, leap: { x0: e.x, z0: e.z, x1: q.x, z1: q.z, t: 0, dmg: 30 * bsc(), r: 6 } });
      ev({ k: 'tele', shape: 'circle', x: r2(q.x), z: r2(q.z), r: 6, d: .5 });
      return true;
    }
    const p = ps[Math.floor(Math.random() * ps.length)] || tgt, a = rand(0, TAU), fx = Math.sin(a), fz = Math.cos(a);
    R = K.run = { x0: p.x - fx * 16, z0: p.z - fz * 16, fx, fz, yaw: a, t: -1.3, hit: [], drop: 0 };
    ev({ k: 'tele', shape: 'line', x: r2(R.x0), z: r2(R.z0), yaw: r2(a), len: 32, w: 3.4, d: 1.3 });
  }
  R.t += dt; e.yaw = R.yaw;
  if (R.t < 0) { const k = Math.min(1, dt * 3); e.x += (R.x0 - e.x) * k; e.z += (R.z0 - e.z) * k; e.y += (8 - e.y) * Math.min(1, dt * 2); return true; }
  const u = R.t / 1.4; e.x = R.x0 + R.fx * 32 * u; e.z = R.z0 + R.fz * 32 * u; e.y += (4.5 - e.y) * Math.min(1, dt * 6);
  if ((R.drop -= dt) <= 0) { R.drop = .14; addPool(e.x, e.z, 1.6, { life: 4, dps: 10, c: C_POI, s: 'bile' }); }
  for (const p of ps) if (!R.hit.includes(p.id) && Math.hypot(p.x - e.x, p.z - e.z) < 2.8) { R.hit.push(p.id); foeHit(p, 22 * bsc(), e); }
  if (u >= 1) K.run = null;
  return true;
}
// the Watcher's spinning beam, held low: jump it as it comes round
function spinTick(e, dt, ps) {
  const L = e.spinL; if (!L) return false;
  L.t -= dt; L.yaw += dt * 1.6; e.yaw = L.yaw;
  const beams = L.two ? [L.yaw, L.yaw + Math.PI] : [L.yaw];
  if ((L.k -= dt) <= 0) { L.k = .08; for (const y of beams) ev({ k: 'fx', m: 'foe', f: 'laser', x: r2(e.x), y: r2(e.y + 3), z: r2(e.z), yaw: r2(y), len: 24, c: C_VOID }); }
  for (const p of ps) for (const y of beams) if (!(L.hitT[p.id] > S.t) && inLine(p, e.x, e.z, y, 24, .9) && p.y < .7) { L.hitT[p.id] = S.t + .6; foeHit(p, L.dmg, e); }
  if (L.t <= 0) e.spinL = null;
  return true;
}
// the Devourer breathes in: everything is dragged toward its maw, and then it bites
function inhaleTick(e, dt, ps) {
  const H = e.inh; if (!H) return false;
  H.t -= dt; e.vs = 'inhale';
  if ((H.k -= dt) <= 0) { H.k = .2; for (const p of ps) { const dx = e.x - p.x, dz = e.z - p.z, k = Math.hypot(dx, dz) || 1; if (k > 2 && k < 26 && p.y < 3) shove(p, dx / k * 3.4, dz / k * 3.4); } }
  if (H.t <= 0) {
    e.inh = null; e.vs = 0;
    ev({ k: 'fx', m: 'foe', f: 'nova', x: r2(e.x), z: r2(e.z), r: 5, c: C_VOID, s: 'void', b: 1 }); ev({ k: 'strike', id: e.id, a: 'smash' });
    for (const p of ps) if (Math.hypot(p.x - e.x, p.z - e.z) < ET[e.type].r * e.sc + 3 && p.y < 2.5) foeHit(p, H.dmg, e);
  }
  return true;
}

// ===================== how the island monsters' states look (view side) =====================
// vs: 'under' (burrowed: only churned-up dirt shows), 'ghost' (half-there), 'pile' (a heap of bones); bd: the id of the Soulbinder holding it
function foeLook(v, e, src, t) {
  const a = e.vs === 'ghost' ? .3 : e.vs === 'hide' ? .06 : 1;
  if (a !== (v.alpha ?? 1)) { v.alpha = a; for (const m of v.mats) { m.o0 ??= m.m.opacity; m.m.transparent = a < 1 || m.o0 < 1; m.m.opacity = m.o0 * a; m.m.depthWrite = a >= 1; m.m.needsUpdate = true; } }
  const P = v.g.position;
  if (e.vs === 'under') {
    v.g.visible = false;
    if (Math.random() < .7) emit(P.x + rand(-.5, .5), .1, P.z + rand(-.5, .5), rand(-1, 1), rand(1, 3), rand(-1, 1), Math.random() < .5 ? 0x5a4a34 : 0x3a2e20, rand(.1, .2), rand(.3, .6), 9);
  }
  if (e.vs === 'ghost' && Math.random() < .25) emit(P.x + rand(-.4, .4), P.y + rand(.5, 2), P.z + rand(-.4, .4), 0, .6, 0, C_SOUL, rand(.08, .14), .6, -.5);
  if (e.vs === 'pile') { v.g.scale.y *= .22; v.g.scale.x *= 1.3; v.g.scale.z *= 1.3; v.g.rotation.x = 0; if (Math.random() < .3) emit(P.x + rand(-1, 1), .3, P.z + rand(-1, 1), 0, rand(.5, 1.5), 0, 0x35ff8a, .12, .5, -1); }
  if (e.vs === 'shell' && Math.random() < .3) emit(P.x + rand(-1.2, 1.2), P.y + rand(.3, 2.6), P.z + rand(-1.2, 1.2), 0, .2, 0, Math.random() < .5 ? 0xffffff : C_ICE, rand(.08, .16), .4);
  if (e.vs === 'hide' && Math.random() < .15) emit(P.x + rand(-.5, .5), .15, P.z + rand(-.5, .5), 0, .4, 0, 0xffffff, .1, .5, -.2); // only kicked-up snow gives it away
  if (e.vs === 'run') for (let i = 0; i < 2; i++) emit(P.x + rand(-.6, .6), .15, P.z + rand(-.6, .6), rand(-2, 2), rand(1.5, 3.5), rand(-2, 2), 0xf0f6ff, rand(.12, .22), rand(.4, .7), 8);
  if (e.vs === 'molten') for (let i = 0; i < 3; i++) emit(P.x + rand(-1.4, 1.4), P.y + rand(.5, 5), P.z + rand(-1.4, 1.4), rand(-.5, .5), rand(1.5, 3.5), rand(-.5, .5), flameColor(), rand(.2, .4), .5, -2);
  if (e.vs === 'rage' && Math.random() < .5) emit(P.x + rand(-.5, .5), P.y + rand(.4, 2), P.z + rand(-.5, .5), 0, rand(1, 2.5), 0, flameColor(), rand(.12, .25), .4, -2);
  if (e.sc !== v.sc) v.sc += (e.sc - v.sc) * .1; // a Gorger swelling after a meal
  if (e.type === 'orbiter' && v.parts.ring) v.parts.ring.o.rotation.y = t * 4; // the blades spin fast enough to be a saw
  const T = ET[e.type];
  if (e.vs === 'warded') { const c = bossCol(e.type), r = T.r * e.sc * 1.4, h = T.h * e.sc; for (let i = 0; i < 3; i++) { const a = rand(0, TAU); emit(P.x + Math.cos(a) * r, P.y + rand(0, h), P.z + Math.sin(a) * r, 0, .3, 0, Math.random() < .3 ? 0xffffff : c, rand(.1, .2), .5); } }
  if (e.vs === 'bliz') for (let i = 0; i < 8; i++) emit(camera.position.x + rand(-14, 14), camera.position.y + rand(1, 9), camera.position.z + rand(-14, 14), rand(-3, -1), rand(-4, -2), rand(-1, 1), 0xffffff, rand(.06, .12), 2.2, 0);
  if (e.vs === 'sky') for (let i = 0; i < 3; i++) emit(P.x + rand(-1, 1), P.y + 3, P.z + rand(-1, 1), rand(-1, 1), rand(-6, -3), rand(-1, 1), C_POI, rand(.15, .3), .6, 4);
  if (e.vs === 'inhale') for (let i = 0; i < 6; i++) { const a = rand(0, TAU), r = rand(8, 18); emit(P.x + Math.cos(a) * r, rand(.3, 3), P.z + Math.sin(a) * r, -Math.cos(a) * r * 1.6, rand(.5, 2), -Math.sin(a) * r * 1.6, Math.random() < .5 ? 0xc890ff : 0x4a1080, rand(.1, .2), .6); }
  if (e.bd) { // a stream of light from whatever holds it: a Soulbinder, or the boss it's guarding
    const b = src.enemies.find(o => o.id === e.bd), c = b && ET[b.type].boss ? bossCol(b.type) : C_SOUL, hb = b ? ET[b.type].h * b.sc * .6 : 1.6;
    if (b) for (let i = 0; i < 2; i++) { const k = Math.random(); emit(b.x + (e.x - b.x) * k, hb + (1.2 - hb) * k + Math.sin(k * Math.PI) * .6, b.z + (e.z - b.z) * k, 0, 0, 0, c, rand(.08, .15), .25); }
    if (Math.random() < .2) emit(P.x + rand(-.5, .5), P.y + rand(.3, 1.8), P.z + rand(-.5, .5), 0, .5, 0, C_SOUL, .14, .5, -.4);
  }
}

// ===================== the islands and bridges on screen =====================
// An island being built flies together out of the clouds: the rock underneath first, then the floor wedges (nearest the
// bridge first), then its landmarks, braziers and floating rocks. Bridges lay one segment at a time from the island you
// leave, keeping just ahead of you as you walk.
const ISLE_FIRE = { crypt: 0x6aff8a, frost: 0x7ad8ff, hell: null, void: 0xb04cff };
const ISLE_MOTE = { crypt: 1, frost: 2, hell: 3, void: 4 };
const IV = { isles: [], bridges: [], lightIsle: 0, init: false };
const easeBack = x => 1 + 2.2 * (x - 1) ** 3 + 1.2 * (x - 1) ** 2;
function islandInit() {
  IV.init = true;
  // the original arena: its far-off decorative islets would sit where the real islands are now, and some floating rocks in the bridges' way
  arena.traverse(o => { if (/^far_island_\d+$/.test(o.name)) o.visible = false; });
  for (const r of amb.rocks) {
    const p = r.o.position;
    for (let k = 0; k < 2; k++) { const b = k ? bridgeEnds(4) : bridgeEnds(0), [ax, az, bx, bz] = k ? [b.bx, b.bz, b.ax, b.az] : [b.ax, b.az, b.bx, b.bz];
      const dx = bx - ax, dz = bz - az, t = clamp(((p.x - ax) * dx + (p.z - az) * dz) / (dx * dx + dz * dz), 0, 1);
      if (Math.hypot(p.x - ax - dx * t, p.z - az - dz * t) < 6 && p.y > -4) r.o.visible = false; }
  }
  for (const I of ISLES) {
    const root = islandsG.getObjectByName('isle_' + I.id);
    if (!root || I.k === 0) { IV.isles.push(null); continue; }
    scene.add(root); root.position.set(I.x, 0, I.z); root.visible = false;
    const prev = ISLES[(I.k + 4) % 5], ex = prev.x - I.x, ez = prev.z - I.z, el = Math.hypot(ex, ez), entry = V(ex / el * I.r, 0, ez / el * I.r); // where the bridge comes in
    const fire = fireMat(ISLE_FIRE[I.id]), pieces = [], flames = [];
    for (const o of [...root.children]) {
      const kind = /_under_/.test(o.name) ? 0 : /_(sector|core)/.test(o.name) ? 1 : /_float_/.test(o.name) ? 3 : 2;
      if (/_flame_/.test(o.name)) { o.traverse(c => { if (c.isMesh) { c.material = fire; c.castShadow = false; } }); flames.push(o); }
      const d = o.position.clone().setY(0).distanceTo(entry) / (I.r * 2); // 0 at the bridge, 1 across the island
      pieces.push({ o, p: o.position.clone(), q: o.quaternion.clone(), at: [0, .2, .5, .62][kind] + d * .3, kind, spin: V(rand(-1, 1), rand(-1, 1), rand(-1, 1)).normalize(), done: false });
    }
    IV.isles.push({ I, root, pieces, flames, last: -1 });
  }
  for (let k = 0; k < 5; k++) {
    const b = bridgeEnds(k), L = Math.hypot(b.bx - b.ax, b.bz - b.az), n = Math.ceil(L / 2.2), yaw = Math.atan2(b.ux, b.uz);
    const id = ISLES[(k + 1) % 5].id, piece = nm => islandsG.getObjectByName(nm + id) || islandsG.getObjectByName(nm + 'shadow');
    const tpl = piece('bridge_'), post = piece('bridgepost_'), gate = piece('bridgegate_'), pier = piece('bridgepier_');
    const segs = [];
    for (let i = 0; i < n; i++) {
      if (!tpl) break;
      const o = tpl.clone(); o.visible = false; scene.add(o);
      const u = (i + .5) / n; o.position.set(b.ax + (b.bx - b.ax) * u, 0, b.az + (b.bz - b.az) * u); o.rotation.y = yaw;
      // dressed as it's laid: lantern posts every third segment, an archway at each end, a pier under the middle of the span
      const add = (t, x, z) => { if (!t) return; const c = t.clone(); c.position.set(x, 0, z); o.add(c); };
      if (i % 3 === 1) for (const sx of [-1, 1]) add(post, sx * 2.1, 0);
      if (i === 0) add(gate, 0, -1.1);
      if (i === n - 1) add(gate, 0, 1.1);
      if (i === n >> 1) add(pier, 0, 0);
      segs.push({ o, p: o.position.clone(), t0: -1 });
    }
    IV.bridges.push({ segs, n });
  }
}
function islandFrame(src, dt) {
  if (!IV.init) islandInit();
  const on = !!src && src.mode === 'arena' && arena.visible;
  const now = performance.now() / 1000;
  for (const v of IV.isles) {
    if (!v) continue;
    const k = v.I.k, p = !on ? 0 : src.ib & 1 << k ? 1 : src.br && (src.br.k + 1) % 5 === k ? Math.min(1, src.br.t * 1.08) : 0;
    v.root.visible = p > 0;
    if (p === v.last) continue;
    const fresh = p > v.last; v.last = p;
    for (const q of v.pieces) {
      const u = clamp((p - q.at * .82) / .2, 0, 1), e = easeBack(u);
      q.o.visible = u > 0;
      q.o.position.copy(q.p); q.o.position.y += (1 - e) * (q.kind === 0 ? -34 : -26) + (q.kind === 3 ? 0 : 0);
      q.o.quaternion.copy(q.q); if (u < 1) q.o.rotateOnAxis(q.spin, (1 - e) * 1.6);
      q.o.scale.setScalar(.55 + .45 * Math.min(1, u * 1.4));
      if (u >= 1 && !q.done && fresh && p < 1.01) { // slammed into place: a puff of dust (and a thud when it's near you)
        q.done = true;
        if (q.kind && q.kind < 3) {
          const w = q.o.getWorldPosition(V());
          for (let j = 0; j < 14; j++) emit(w.x + rand(-2, 2), .2, w.z + rand(-2, 2), rand(-2, 2), rand(1, 4), rand(-2, 2), 0xb8a890, rand(.08, .16), rand(.5, .9), 9, 1);
          if (Math.random() < .25) smokeFx(w.x, .4, w.z, 1, 0x8a7a68, 1, 2, .6);
          if (distTo(w.x, w.z) < 40 && Math.random() < .35) sfx(q.kind === 1 ? 'earth' : 'smash');
        }
      }
      if (u < 1) q.done = false;
    }
  }
  for (let k = 0; k < 5; k++) {
    const B = IV.bridges[k], t = !on ? 0 : src.brs & 1 << k ? 1 : src.br?.k === k ? src.br.t : 0;
    for (let i = 0; i < B.segs.length; i++) {
      const s = B.segs[i], want = t * B.n > i;
      if (!want) { s.o.visible = false; s.t0 = -1; continue; }
      if (s.t0 < 0) { s.t0 = t >= 1 && !(src.br?.k === k) ? now - 1 : now; if (now - s.t0 < .5 && i % 2 === 0 && distTo(s.p.x, s.p.z) < 35) sfx('earth'); }
      const u = clamp((now - s.t0) / .45, 0, 1), e = easeBack(u);
      if (u >= 1 && !s.land) {
        s.land = 1; const c = ISLE_FIRE[ISLES[(k + 1) % 5].id] ?? 0xffc070;
        for (let j = 0; j < 10; j++) emit(s.p.x + rand(-2, 2), .1, s.p.z + rand(-1, 1), rand(-2, 2), rand(1, 3), rand(-2, 2), 0xb8a890, rand(.08, .14), .6, 9, 1);
        for (let j = 0; j < 8; j++) { const sx = j % 2 ? 1 : -1, a = s.o.rotation.y; emit(s.p.x + Math.cos(a) * sx * 2.1, rand(.2, 1.1), s.p.z - Math.sin(a) * sx * 2.1, 0, rand(.5, 1.5), 0, c, rand(.1, .18), .7, -.5); } // its rails light up
      }
      if (u < 1) s.land = 0;
      s.o.visible = true; s.o.position.set(s.p.x, -7 * (1 - e), s.p.z); s.o.rotation.z = (1 - e) * .5;
      if (u < 1 && Math.random() < .4) emit(s.p.x + rand(-2, 2), -1, s.p.z + rand(-2, 2), 0, rand(2, 5), 0, 0xd8c8a8, rand(.06, .12), .5, 6);
    }
  }
  if (!on) { areaMote = 0; return; }
  // the island the camera's on: its braziers get the four brazier lights, its motes drift about
  let best = 0, bd = 1e9;
  for (const I of ISLES) { const d = Math.hypot(camera.position.x - I.x, camera.position.z - I.z); if (d < bd && (I.k === 0 || src.ib & 1 << I.k)) { bd = d; best = I.k; } }
  areaMote = bd < ARENA_R + 12 ? ISLE_MOTE[ISLES[best].id] || 0 : 0;
  if (best !== IV.lightIsle) {
    IV.lightIsle = best;
    const v = IV.isles[best], col = ISLE_FIRE[ISLES[best].id] ?? 0xff8a3a;
    amb.lights.forEach((l, i) => {
      const f = v?.flames[i] || amb.flames[i];
      if (f) { f.getWorldPosition(l.position); l.position.y += .7; } l.color.set(best ? col : 0xff8a3a); if (best) l.color.lerp(new THREE.Color(0xfff0e0), .55); // a hint of the fire's colour, not a flood of it
    });
    areaFire = best ? col : 0xff8a3a;
  }
  // the key light's shadows follow you from island to island
  const cx = Math.round(camera.position.x / 4) * 4, cz = Math.round(camera.position.z / 4) * 4;
  moon.target.position.set(cx, 0, cz); moon.target.updateMatrixWorld(); moon.position.set(cx + BH.x * 70, BH.y * 70, cz + BH.z * 70);
}

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
