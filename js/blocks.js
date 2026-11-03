// Blocking (hold C): every element raises a shield of its own, cast like a spell from the raised hand. It soaks up hits
// from the front (some from every side) until its health runs out, then it shatters and takes a few seconds to come back;
// let go and it mends. Each one also does something only it does when it takes a hit (or while held, or on letting go).
// Loaded after areas.js (uses the sim's helpers), before view.js.
'use strict';

const BLOCK_ARC = Math.cos(75 * Math.PI / 180); // covers the front 150 degrees
// name, desc, hp: how much it soaks; omni: every side; move: walking speed while held (default .55); cost: shield
// spent per point blocked; shots: the same for projectiles; down: seconds broken (default 4)
// hit(p, n, foe, from): a hit was blocked (foe: the monster or duel opponent, when there is one; from: the shot, if it was one)
// tick(p, dt): while held; rel(p): on letting go; brk(p): when it shatters. Host only.
const gfx = (p, f, o = {}) => ev({ k: 'gfx', id: p.id, el: p.cur, f, x: r2(p.x), z: r2(p.z), ...o });
const near2 = (p, foe, r) => foe && !foe.dead && Math.hypot(foe.x - p.x, foe.z - p.z) < r;
const away = (p, o, k) => { const dx = o.x - p.x, dz = o.z - p.z, d = Math.hypot(dx, dz) || 1; o.kx += dx / d * k * ET[o.type].kb; o.kz += dz / d * k * ET[o.type].kb; };
const BLOCK = {
  fire:     { name: 'Flame Wall', hp: 60, desc: 'A curtain of fire. Whatever strikes it is set burning twice over.',
    hit(p, n, foe) { if (foe) { applyStatus(foe, 'fire', p); applyStatus(foe, 'fire', p); hitEnemy(foe, 'fire', 6, p, 0, 0, 0, { noStatus: true }); } } },
  frost:    { name: 'Ice Mirror', hp: 70, desc: 'A pane of clear ice. Monsters that strike it up close are frozen solid.',
    hit(p, n, foe) { if (near2(p, foe, 6)) cc(foe, 'freeze', 1.2, p); } },
  storm:    { name: 'Static Field', hp: 55, desc: 'A crackling field. Every blocked hit throws lightning at up to three monsters nearby.',
    hit(p) { const t = enemiesNear(p.x, p.z, 9).slice(0, 3); for (const e of t) hitEnemy(e, 'storm', 14 * stats(p).dmgMul, p, 0, 0, 1); gfx(p, 'zap', { t: t.map(e => [r2(e.x), r2(e.y + 1), r2(e.z)]) }); } },
  water:    { name: 'Tidal Bubble', hp: 50, omni: 1, desc: 'A bubble of water all round you: blocks from every side, and gives back some of what it soaks as health.',
    hit(p, n) { heal(p, n * .15); } },
  earth:    { name: 'Stone Bulwark', hp: 130, move: 0, desc: 'A slab of rock torn up in front of you: the toughest block of all, but you can\'t move while you hold it.' },
  wind:     { name: 'Gale Barrier', hp: 55, shots: .3, desc: 'A wall of wind. Shots barely wear it down, and anything that strikes it is blown away.',
    hit(p, n, foe) { if (near2(p, foe, 7)) away(p, foe, 14); } },
  nature:   { name: 'Bark Shield', hp: 70, desc: 'A shield of living wood. It heals you while you hold it, and its thorns cut whatever strikes it.',
    tick(p, dt) { heal(p, 3 * dt); }, hit(p, n, foe) { if (near2(p, foe, 4)) hitEnemy(foe, 'nature', 8, p, 0, 0, 0); } },
  shadow:   { name: 'Shadow Veil', hp: 45, desc: 'A cloak of darkness. Block a hit and you vanish from the monsters\' sight for a moment.',
    hit(p) { p.bf.veil = 1.8; gfx(p, 'veil'); } },
  light:    { name: 'Aegis of Light', hp: 65, desc: 'A shield of sunlight. Every blocked hit flashes, blinding the monsters in front of you.',
    hit(p) { const f = flatAim(p); for (const e of enemiesNear(p.x, p.z, 8)) { const dx = e.x - p.x, dz = e.z - p.z, d = Math.hypot(dx, dz) || 1; if ((dx * f.x + dz * f.z) / d > .3) cc(e, 'blind', 1.6, p); } gfx(p, 'flash'); } },
  venom:    { name: 'Toxic Membrane', hp: 55, desc: 'A membrane of poison. Whatever strikes it is poisoned to the bone.',
    hit(p, n, foe) { if (foe) for (let i = 0; i < 3; i++) applyStatus(foe, 'venom', p); } },
  steel:    { name: 'Tower Shield', hp: 110, desc: 'A great steel shield. Raise it just as a blow lands (a parry) and the attacker is stunned and the hit costs nothing.',
    hit(p, n, foe) { if (S.t - p.gT < .3) { p.gh += n; if (foe) cc(foe, 'stun', 1.8, p); gfx(p, 'parry'); } } },
  magma:    { name: 'Molten Bulwark', hp: 80, desc: 'A wall of glowing rock. It stores the heat of every blow, and lets it all out in an eruption when you let go.',
    hit(p, n) { p.gs = Math.min(90, (p.gs || 0) + n); },
    rel(p) { if (p.gs > 5) { blast(p.x, p.z, 4.5, p.gs * 1.2 * stats(p).dmgMul, { p, el: 'magma' }, { kb: 8 }); gfx(p, 'erupt'); } p.gs = 0; } },
  crystal:  { name: 'Prism Wall', hp: 60, desc: 'A faceted crystal. Shots that hit it are bounced straight back, harder, at whatever lies behind them.',
    hit(p, n, foe, from) {
      if (!from || from.vx == null) return;
      const d = V(-from.vx, 0, -from.vz).normalize(), h = rayHits(V(p.x, 1.2, p.z), d, 30, .8)[0];
      if (h) hitEnemy(h.e, 'crystal', n * 1.6, p, d.x, d.z, 3); gfx(p, 'reflect', { yaw: r2(Math.atan2(d.x, d.z)) });
    } },
  sonic:    { name: 'Sound Barrier', hp: 55, desc: 'Rings of sound. Every blocked hit booms out, throwing back every monster around you.',
    hit(p) { for (const e of enemiesNear(p.x, p.z, 6)) { away(p, e, 10); hitEnemy(e, 'sonic', 6, p, 0, 0, 0); } gfx(p, 'boom'); } },
  gravity:  { name: 'Event Horizon', hp: 60, desc: 'A sphere of crushing gravity. Monsters that strike it are lifted helpless into the air.',
    hit(p, n, foe) { if (near2(p, foe, 8)) cc(foe, 'lift', 1.4, p); } },
  chrono:   { name: 'Time Bubble', hp: 55, desc: 'A bubble of slowed time. While you hold it, every monster near you moves and winds up at a crawl.',
    tick(p) { for (const e of enemiesNear(p.x, p.z, 7)) e.fs = Math.max(e.fs || 0, .6); } },
  blood:    { name: 'Crimson Ward', hp: 60, desc: 'A ward of your own blood. It drinks the blows it blocks, healing you for a good part of each.',
    hit(p, n) { heal(p, n * .4); } },
  spirit:   { name: 'Ancestral Ward', hp: 70, desc: 'A spirit knight stands guard. While you hold it, your partner takes half damage too.' },
  cosmic:   { name: 'Starfield', hp: 55, desc: 'A field of stars. Each blocked hit catches a star; let go and they all fly at the nearest monsters.',
    hit(p) { p.gs = Math.min(6, (p.gs || 0) + 1); },
    rel(p) {
      const t = enemiesNear(p.x, p.z, 22).sort((a, b) => Math.hypot(a.x - p.x, a.z - p.z) - Math.hypot(b.x - p.x, b.z - p.z));
      for (let i = 0; i < (p.gs || 0) && t.length; i++) { const e = t[i % t.length]; hitEnemy(e, 'cosmic', 22 * stats(p).dmgMul, p, 0, 0, 2); gfx(p, 'star', { tx: r2(e.x), ty: r2(e.y + 1), tz: r2(e.z) }); }
      p.gs = 0;
    } },
  explosion: { name: 'Reactive Plating', hp: 70, cost: 1.3, desc: 'Plates that blow up when struck: every blocked hit explodes on the attacker (but wears the plating faster).',
    hit(p, n, foe) { if (foe && !foe.dead) { blast(foe.x, foe.z, 2.5, 18 * stats(p).dmgMul, { p, el: 'explosion' }, { kb: 7 }); gfx(p, 'pop', { tx: r2(foe.x), tz: r2(foe.z) }); } } },
  illusion: { name: 'Mirror Step', hp: 40, desc: 'A mirror of you. Block a hit and you step back out of it, leaving the blow to strike a phantom.',
    hit(p) { const f = flatAim(p), q = confine({ x: p.x - f.x * 5, z: p.z - f.z * 5 }, 1); gfx(p, 'step', { x2: r2(q.x), z2: r2(q.z) }); p.tp = { n: (p.tp?.n || 0) + 1, x: q.x, z: q.z }; p.bf.inv = Math.max(p.bf.inv || 0, .8); } },
  bone:     { name: 'Ossuary Wall', hp: 90, down: 2.5, desc: 'A wall of bones. When it finally breaks, it bursts in a storm of bone shards, and it is back sooner than most.',
    brk(p) { blast(p.x, p.z, 5, 30 * stats(p).dmgMul, { p, el: 'bone' }, { kb: 6 }); } },
  rune:     { name: 'Runic Ward', hp: 60, desc: 'A circle of runes. Every third hit it blocks empowers you: 30% more damage for 5 seconds.',
    hit(p) { if ((p.gs = (p.gs || 0) + 1) >= 3) { p.gs = 0; p.bf.emp = 5; gfx(p, 'empower'); } } },
  plasma:   { name: 'Plasma Screen', hp: 55, desc: 'A screen of plasma that feeds on the hits it takes: each one cuts all your cooldowns.',
    hit(p) { const c = p.cds[p.cur]; if (c) for (let s = 0; s < 4; s++) c[s] -= .6; } },
  soul:     { name: 'Soul Ward', hp: 55, desc: 'A ward of souls. Every blocked hit tears a soul from the attacker for you, and sends it fleeing in fear.',
    hit(p, n, foe) { p.bd.souls = Math.min(15, (p.bd.souls || 0) + 1); if (near2(p, foe, 8)) cc(foe, 'fear', 1.2, p); } },
  abyss:    { name: 'Abyssal Maw', hp: 60, shots: -.15, desc: 'A mouth into the abyss. It swallows shots whole (each one mends it), but blows still wear it down.' },
  laser:    { name: 'Photon Barrier', hp: 55, desc: 'A lattice of light. Every blocked hit fires a beam straight back down the line it came from.',
    hit(p, n, foe, from) {
      const src = from || foe; if (!src) return; const d = V(src.x - p.x, 0, src.z - p.z).normalize();
      for (const h of rayHits(V(p.x, 1.2, p.z), d, 22, .7)) hitEnemy(h.e, 'laser', 20 * stats(p).dmgMul, p, d.x, d.z, 1);
      gfx(p, 'beam', { yaw: r2(Math.atan2(d.x, d.z)) });
    } },
  arcane:   { name: 'Arcane Shell', hp: 50, omni: 1, desc: 'A shell of pure magic round you, every side covered. The hits it soaks charge your ultimate.',
    hit(p, n) { addUlt(p, n / 400); } },
  blades:   { name: 'Blade Whirl', hp: 60, desc: 'Swords spinning in front of you. Anything that comes close while you hold it is cut to pieces.',
    tick(p, dt) { if ((p.gs = (p.gs || 0) - dt) <= 0) { p.gs = .25; for (const e of enemiesNear(p.x, p.z, 2.8)) hitEnemy(e, 'blades', 6 * stats(p).dmgMul, p, e.x - p.x, e.z - p.z, 1); } } },
  ink:      { name: 'Ink Canvas', hp: 55, desc: 'A canvas of ink. Blows that strike it spatter the attacker, smearing and slowing it.',
    hit(p, n, foe) { if (foe) for (let i = 0; i < 2; i++) applyStatus(foe, 'ink', p); } },
  god:      { name: 'Divine Aegis', hp: 400, omni: 1, move: 1, desc: 'Nothing gets through.' },
};

// both machines every frame (the host also mends, breaks and runs the hooks): is p holding a block up?
function guardStep(p, i, dt, host) {
  const B = BLOCK[p.cur] || BLOCK.fire;
  p.gm = B.hp; if (p.gh == null) p.gh = B.hp;
  const want = !!i.b && !p.down && !(p.gk > 0) && S.phase !== 'lobby';
  if (want !== !!p.guard) {
    if (want) p.gT = S.t; else if (host) B.rel?.(p);
    if (host) ev({ k: 'guard', id: p.id, f: want ? 'up' : 'down', el: p.cur });
  }
  p.guard = want; p.gd = want ? 1 : 0;
  if (!host) return;
  if (p.gk > 0) { if ((p.gk -= dt) <= 0) { p.gk = 0; p.gh = p.gm; ev({ k: 'guard', id: p.id, f: 'ready', el: p.cur }); } }
  else if (p.guard) { p.gi = 0; B.tick?.(p, dt); }
  else if ((p.gi = (p.gi || 0) + dt) > .6) p.gh = Math.min(p.gm, p.gh + p.gm * .25 * dt);
  p.gh = Math.min(p.gh, p.gm);
}
// a hit on p (host): if the block is up and facing it, the block takes it. foe: who struck, from: the shot or the duel attacker
function guardHit(p, n, foe, from) {
  if (!p.guard || !(p.gh > 0) || n <= 0) return false;
  const B = BLOCK[p.cur] || BLOCK.fire, src = from || foe;
  if (!B.omni) {
    if (!src) return false; // rings, falling rocks: nothing in front of you to put the shield to
    const f = flatAim(p), dx = src.x - p.x, dz = src.z - p.z, d = Math.hypot(dx, dz) || 1;
    if (d > .8 && (f.x * dx + f.z * dz) / d < BLOCK_ARC) return false; // from behind or the side
  }
  const shot = from?.vx != null;
  p.gh -= n * (shot && B.shots != null ? B.shots : B.cost ?? 1);
  p.stats.blocked = (p.stats.blocked || 0) + Math.round(n);
  ev({ k: 'guard', id: p.id, f: 'hit', el: p.cur, n: Math.round(n), x: r2(src?.x ?? p.x), z: r2(src?.z ?? p.z) });
  B.hit?.(p, n, foe, from);
  if (p.gh <= 0) { p.gh = 0; p.gk = B.down ?? 4; p.guard = false; B.brk?.(p); p.gs = 0; ev({ k: 'guard', id: p.id, f: 'break', el: p.cur }); }
  return true;
}

// ===================== on screen =====================
// The block is cast like a spell: the element's own casting circle (outer and inner rings, sigil) spins up in front of the
// raised hand, with its signature piece (a frost wall, a bone cage, a spirit knight...) inside it. Others see it in front of
// your wizard; a block that covers every side is a bubble round you.
const BLOCK_LOOK = { // m: the signature model inside the circle, s: its size (1 = the circle's), f: a squash, y: lift, spin: turns a second, k: its particles
  fire: { m: 'fire__flame', s: .9, k: 'flames' }, frost: { m: 'frost__wall', s: 1.1 }, storm: { m: 'storm__coil', s: .8, spin: 2, k: 'sparks' },
  water: { m: 'gen__orb', k: 'bubble' }, earth: { m: 'earth__pillar', s: 1.2, f: [1.2, .8, .3], k: 'slab' }, wind: { m: 'wind__tornado', s: .9, spin: 4, k: 'swirl' },
  nature: { m: 'nature__roots', k: 'leaves' }, shadow: { m: 'gen__cloud', s: 1.1, k: 'smoke' }, light: { m: 'light__halo', spin: .6, k: 'rays' },
  venom: { m: 'venom__glob', s: .8, k: 'drip' }, steel: { m: 'steel__saw', s: 1.05 }, magma: { m: 'magma__glob', s: .85, k: 'embers' },
  crystal: { m: 'crystal__prism', s: .9, spin: .4 }, sonic: { m: 'sonic__rings', spin: 1, k: 'pulse' }, gravity: { m: 'gravity__hole', s: .8, spin: 1.5, k: 'suck' },
  chrono: { m: 'chrono__clock', spin: .2 }, blood: { m: 'blood__moon', s: .8, k: 'drip' }, spirit: { m: 'spirit__knight', s: 1.2, k: 'wisps' },
  cosmic: { m: 'cosmic__star', s: .7, spin: .5, k: 'stars' }, explosion: { m: 'explosion__mine', s: .75, spin: .3, k: 'sparks' }, illusion: { m: 'illusion__mirrors', spin: .3 },
  bone: { m: 'bone__cage', s: 1.1 }, rune: { m: 'rune__glyph', s: .9, spin: .5 }, plasma: { m: 'plasma__orb', s: .75, k: 'sparks' },
  soul: { m: 'soul__flame', s: .9, k: 'wisps' }, abyss: { m: 'abyss__maw', s: .9, spin: .4, k: 'suck' }, laser: { m: 'laser__lens', s: .9, spin: .8 },
  arcane: { m: 'gen__dome', k: 'bubble' }, blades: { m: 'blades__sword', s: .9, spin: 2, k: 'whirl' }, ink: { m: 'ink__stroke', s: .9, k: 'drip' }, god: { m: 'light__halo', spin: 1, k: 'rays' },
};
const GV = new Map(); // player id -> its shield on screen
function guardMake(el) {
  const L = BLOCK_LOOK[el] || BLOCK_LOOK.fire, col = EL[el]?.color ?? 0xffffff, g = new THREE.Group(), omni = BLOCK[el]?.omni;
  // every piece is fitted to the same frame (the models come in all sizes), flat ones stood upright to face out
  const part = (name, c, fit) => {
    if (!NODE[name]) return null;
    const o = model(name, c), w = new THREE.Group(); w.add(o); g.add(w);
    const b = new THREE.Box3().setFromObject(o), sz = b.getSize(V()), ctr = b.getCenter(V()), k = fit / Math.max(sz.x, sz.y, sz.z, .01);
    o.position.copy(ctr).multiplyScalar(-1); w.scale.setScalar(k);
    if (sz.y < Math.max(sz.x, sz.z) * .25) o.parent.rotation.x = Math.PI / 2; // lying flat: stand it up
    return w;
  };
  const outer = part(el + '__ring_outer', col, omni ? 2.9 : 1.9), inner = part(el + '__ring_inner', col, omni ? 2.2 : 1.35), sig = part(el + '__sigil', col, 1.05);
  const core = part(L.m, col, (omni ? 2.7 : 1.45) * (L.s ?? 1));
  if (core && L.f) core.scale.multiply(V(...L.f));
  if (core) core.position.y = L.y || 0;
  const mats = []; g.traverse(o => { if (o.material) for (const m of [].concat(o.material)) { m.transparent = true; m.depthWrite = false; m.side = THREE.DoubleSide; mats.push(m); } });
  return { g, outer, inner, sig, core, mats, L, col, el, omni, a: 0, hit: 0, brk: 0 };
}
// every frame: shields up for whoever is blocking (src: the state being drawn, me: my own player)
function guardFrame(src, dt, t) {
  const live = new Set();
  for (const p of Object.values(src?.players || {})) {
    const on = !!p.gd && !p.down, id = p.id; let v = GV.get(id);
    if (!on && !v) continue;
    if (v && v.el !== p.cur) { v.g.removeFromParent(); GV.delete(id); v = null; }
    if (!v) { v = guardMake(p.cur); GV.set(id, v); }
    live.add(id);
    v.a += ((on ? 1 : 0) - v.a) * Math.min(1, dt * (on ? 14 : 8)); v.hit = Math.max(0, v.hit - dt * 4);
    if (v.a < .02 && !on) { v.g.removeFromParent(); GV.delete(id); continue; }
    const mine = id === myId, k = v.a, hp = p.gm ? clamp(p.gh / p.gm, 0, 1) : 1;
    if (mine && !v.omni) { if (v.g.parent !== camera) camera.add(v.g); v.g.position.set(-.16, -.2, -1.3); v.g.rotation.set(0, 0, 0); v.g.scale.setScalar(.42 * (.6 + .4 * k)); }
    else {
      if (v.g.parent !== scene) scene.add(v.g);
      const f = V(-Math.sin(p.yaw), 0, -Math.cos(p.yaw));
      if (v.omni) { v.g.position.set(p.x, p.y + 1, p.z); v.g.rotation.set(0, 0, 0); v.g.scale.setScalar(k); }
      else { v.g.position.set(p.x + f.x * 1, p.y + 1.25, p.z + f.z * 1); v.g.rotation.set(0, p.yaw, 0); v.g.scale.setScalar(.9 * (.6 + .4 * k)); }
    }
    const L = v.L;
    // spins turn each piece about its own axis (a ring in its own plane; the wrapper's x turn stands flat pieces up after)
    if (v.outer) v.outer.rotation.y += dt * (1.2 + v.hit * 6); if (v.inner) v.inner.rotation.y -= dt * (1.8 + v.hit * 8); if (v.sig) v.sig.rotation.y += dt * .4;
    if (v.core && L.spin) v.core.rotation.y += dt * L.spin * TAU;
    const wobble = hp < .3 ? .6 + .4 * Math.sin(t * 40) : 1; // about to break: it flickers
    const base = (mine ? (v.omni ? .16 : .32) : .75) * k * wobble * (.55 + .45 * hp);
    for (const m of v.mats) m.opacity = Math.min(1, base * (1 + v.hit * 1.5));
    guardParticles(v, p, t, mine, k);
  }
  for (const [id, v] of GV) if (!live.has(id)) { v.g.removeFromParent(); GV.delete(id); }
}
function guardParticles(v, p, t, mine, k) {
  if (mine || Math.random() > .6 * k) return; // first person: keep your view clear
  const w = v.g.getWorldPosition(V()), c = v.col, r = () => rand(-.6, .6);
  switch (v.L.k) {
    case 'flames': emit(w.x + r(), w.y - .6, w.z + r(), 0, rand(2, 4), 0, flameColor(), rand(.2, .35), .4, -2); break;
    case 'sparks': emit(w.x + r(), w.y + r(), w.z + r(), rand(-3, 3), rand(-3, 3), rand(-3, 3), Math.random() < .5 ? 0xffffff : c, .08, .2); break;
    case 'bubble': { const a = rand(0, TAU), b = rand(-1, 1); emit(w.x + Math.cos(a) * 1.4, w.y + b * 1.2, w.z + Math.sin(a) * 1.4, 0, .4, 0, c, .1, .5); break; }
    case 'swirl': { const a = t * 8 + rand(0, 1); emit(w.x + Math.cos(a) * .8, w.y + r(), w.z + Math.sin(a) * .8, -Math.sin(a) * 4, .5, Math.cos(a) * 4, 0xe8f4ff, .1, .4); break; }
    case 'leaves': emit(w.x + r(), w.y + .6, w.z + r(), r(), -1, r(), Math.random() < .5 ? 0x6ac04a : 0x3a8a2a, .1, .8, 2); break;
    case 'smoke': emit(w.x + r(), w.y + r(), w.z + r(), r(), .5, r(), 0x1a1030, .35, .8, -.3); break;
    case 'rays': emit(w.x, w.y, w.z, rand(-4, 4), rand(-4, 4), rand(-4, 4), 0xfff4c0, .1, .3); break;
    case 'drip': emit(w.x + r(), w.y - .5, w.z + r(), 0, -1, 0, c, .1, .6, 6); break;
    case 'embers': emit(w.x + r(), w.y + r(), w.z + r(), r(), rand(1, 2), r(), Math.random() < .5 ? 0xff6a1a : 0xffc040, .1, .6, -1); break;
    case 'pulse': if (Math.random() < .1) ringFx(w.x, w.y, w.z, 1.2, c, .3); break;
    case 'suck': { const a = rand(0, TAU); emit(w.x + Math.cos(a) * 1.5, w.y + r(), w.z + Math.sin(a) * 1.5, -Math.cos(a) * 4, 0, -Math.sin(a) * 4, c, .1, .35); break; }
    case 'wisps': emit(w.x + r(), w.y + r(), w.z + r(), 0, .6, 0, c, .14, .7, -.4); break;
    case 'stars': emit(w.x + r() * 1.5, w.y + r() * 1.5, w.z + r() * 1.5, 0, 0, 0, Math.random() < .5 ? 0xffffff : c, .08, .8); break;
    case 'whirl': { const a = t * 10; emit(w.x + Math.cos(a) * 1, w.y, w.z + Math.sin(a) * 1, 0, 0, 0, 0xe8e8ff, .08, .2); break; }
    case 'slab': if (Math.random() < .2) emit(w.x + r(), w.y - .8, w.z + r(), r(), rand(1, 2), r(), 0x8a7a62, .12, .5, 9); break;
  }
}
// events: a hit landing on a block, the block breaking, coming back, and each element's own trick
function guardEv(e) {
  const v = GV.get(e.id), col = EL[e.el]?.color ?? 0xffffff, mine = e.id === myId, P = (srcState()?.players || {})[e.id];
  if (e.f === 'up') { if (mine) sfx(e.el + '_big'); else if (P) circleFx('sigil', V(P.x, .08, P.z), 1.6, { life: .5, color: col }); return; }
  if (e.f === 'hit') {
    if (v) v.hit = 1;
    if (P) { const f = V(-Math.sin(P.yaw), 0, -Math.cos(P.yaw)); burst(P.x + f.x, P.y + 1.3, P.z + f.z, 24, col, 6, .15, .35); }
    if (mine) { shake(.12); popNum(camera.position.x, camera.position.y - .2, camera.position.z, `BLOCKED ${e.n}`, '#' + col.toString(16).padStart(6, '0'), 'tag'); }
    sfx('block'); return;
  }
  if (e.f === 'break') {
    if (P) { burst(P.x, P.y + 1.3, P.z, 70, col, 9, .25, .6, 6); ringFx(P.x, P.y + 1.2, P.z, 2.4, col, .4); }
    if (mine) { banner(`${(BLOCK[e.el]?.name || 'BLOCK').toUpperCase()} BROKEN`, '#ff8a8a', 1300); shake(.35); }
    sfx('smash'); return;
  }
  if (e.f === 'ready') { if (mine) { popNum(camera.position.x, camera.position.y - .3, camera.position.z, 'BLOCK READY', '#9fe6ff', 'tag'); sfx('pick'); } return; }
}
// the element tricks (gfx events)
const GFX = {
  zap(e) { const a = V(e.x, 1.4, e.z); for (const q of e.t || []) { const b = V(...q); beamFx(a, b, 0xb8d8ff, .12, .25); burst(b.x, b.y, b.z, 14, 0xd8e8ff, 6, .12, .3); } sfx('storm'); },
  veil(e) { smokeFx(e.x, 1, e.z, 1.2, 0x1a1030, 1, 4, .8); if (e.id === myId) banner('VEILED: THEY CAN\'T SEE YOU', '#b08aff', 1200); },
  flash(e) { flash(e.x, 1.5, e.z, 0xfff4c0, 80, .3); burst(e.x, 1.5, e.z, 40, 0xfff4c0, 10, .2, .4); },
  parry(e) { flash(e.x, 1.4, e.z, 0xffffff, 60, .2); burst(e.x, 1.4, e.z, 30, 0xe8ecf4, 8, .12, .3, 4); if (e.id === myId) popNum(camera.position.x, camera.position.y - .1, camera.position.z, 'PARRY!', '#ffe08a', 'tag'); sfx('tink'); },
  erupt(e) { fireBoom(e.x, .3, e.z, 4.5, 1); scarFx(e.x, e.z, 3.5, 0xff4a10, 3); shake(.3); },
  reflect(e) { const a = V(e.x, 1.3, e.z), b = V(e.x + Math.sin(e.yaw) * 20, 1.3, e.z + Math.cos(e.yaw) * 20); beamFx(a, b, 0xff8aff, .15, .3); sfx('tink'); },
  boom(e) { for (let i = 1; i <= 3; i++) setTimeout(() => ringFx(e.x, 1, e.z, 2 * i, EL.sonic.color, .3), i * 60); sfx('sonic_big'); },
  star(e) { beamFx(V(e.x, 1.6, e.z), V(e.tx, e.ty, e.tz), EL.cosmic.color, .1, .35); burst(e.tx, e.ty, e.tz, 16, 0xffffff, 5, .12, .3); },
  pop(e) { boomFx(e.tx, 1, e.tz, 2.5, EL.explosion.color, .6); sfx('boom'); },
  step(e) { smokeFx(e.x, 1, e.z, .8, 0xf0a6ff, .6, 3, .5); burst(e.x, 1.2, e.z, 30, 0xf0a6ff, 5, .15, .4); },
  empower(e) { pillarFx(e.x, 0, e.z, 1, 4, EL.rune.color, .5); if (e.id === myId) banner('EMPOWERED', '#ffd36a', 1100); },
  beam(e) { const a = V(e.x, 1.3, e.z), b = V(e.x + Math.sin(e.yaw) * 22, 1.3, e.z + Math.cos(e.yaw) * 22); beamFx(a, b, EL.laser.color, .2, .3); beamFx(a, b, 0xffffff, .07, .25); sfx('laser_big'); },
};
// the first-person hand: the left hand thrown up, palm out, while the block is held
let guardHand = 0;
function guardPose(mp, dt) { guardHand += ((mp?.gd ? 1 : 0) - guardHand) * Math.min(1, dt * 12); return guardHand; }
