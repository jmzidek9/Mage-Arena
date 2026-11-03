// Blocking (hold C): every element raises a shield of its own, cast like a spell from the raised hand. Every block works the
// same way: while it holds, nothing gets through to you (any side, monsters, shots, the ground burning under you) and
// nothing else happens. It soaks it all until its health runs out, then shatters and takes a few seconds to come back;
// let go and it mends. Only the look is the element's own (BLOCK_LOOK below).
// Loaded after areas.js (uses the sim's helpers), before view.js.
'use strict';

const BLOCK_HP = 80, BLOCK_MOVE = .55, BLOCK_DOWN = 4; // the same for every element: health, walking speed while held, seconds broken
const BLOCK = { // each element's block by name (it looks its own, it works like all the others)
  fire: { name: 'Flame Wall' }, frost: { name: 'Ice Mirror' }, storm: { name: 'Static Field' }, water: { name: 'Tidal Bubble', omni: 1 },
  earth: { name: 'Stone Bulwark' }, wind: { name: 'Gale Barrier' }, nature: { name: 'Bark Shield' }, shadow: { name: 'Shadow Veil' },
  light: { name: 'Aegis of Light' }, venom: { name: 'Toxic Membrane' }, steel: { name: 'Tower Shield' }, magma: { name: 'Molten Bulwark' },
  crystal: { name: 'Prism Wall' }, sonic: { name: 'Sound Barrier' }, gravity: { name: 'Event Horizon' }, chrono: { name: 'Time Bubble' },
  blood: { name: 'Crimson Ward' }, spirit: { name: 'Ancestral Ward' }, cosmic: { name: 'Starfield' }, explosion: { name: 'Reactive Plating' },
  illusion: { name: 'Mirror Step' }, bone: { name: 'Ossuary Wall' }, rune: { name: 'Runic Ward' }, plasma: { name: 'Plasma Screen' },
  soul: { name: 'Soul Ward' }, abyss: { name: 'Abyssal Maw' }, laser: { name: 'Photon Barrier' }, arcane: { name: 'Arcane Shell', omni: 1 },
  blades: { name: 'Blade Whirl' }, ink: { name: 'Ink Canvas' }, god: { name: 'Divine Aegis', omni: 1 }, // omni: drawn as a bubble round you
};
const BLOCK_DESC = `Hold to raise it: while it holds, no damage reaches you from any side. It has ${BLOCK_HP} health, breaks when that runs out (back in ${BLOCK_DOWN} s) and mends when you let go.`;

// both machines every frame (the host also mends and breaks it): is p holding a block up?
function guardStep(p, i, dt, host) {
  p.gm = BLOCK_HP; if (p.gh == null) p.gh = BLOCK_HP;
  const want = !!i.b && !p.down && !(p.gk > 0) && S.phase !== 'lobby';
  if (want !== !!p.guard && host) ev({ k: 'guard', id: p.id, f: want ? 'up' : 'down', el: p.cur });
  p.guard = want; p.gd = want ? 1 : 0;
  if (!host) return;
  if (p.gk > 0) { if ((p.gk -= dt) <= 0) { p.gk = 0; p.gh = p.gm; ev({ k: 'guard', id: p.id, f: 'ready', el: p.cur }); } }
  else if (p.guard) p.gi = 0;
  else if ((p.gi = (p.gi || 0) + dt) > .6) p.gh = Math.min(p.gm, p.gh + p.gm * .25 * dt);
}
// a hit on p (host): if the block is up, it takes the whole hit, whatever it is and wherever it comes from
function guardHit(p, n, foe, from) {
  if (!p.guard || !(p.gh > 0) || n <= 0) return false;
  const src = from || foe;
  p.gh -= n; p.stats.blocked = (p.stats.blocked || 0) + Math.round(n);
  ev({ k: 'guard', id: p.id, f: 'hit', el: p.cur, n: Math.round(n), x: r2(src?.x ?? p.x), z: r2(src?.z ?? p.z) });
  if (p.gh <= 0) { p.gh = 0; p.gk = BLOCK_DOWN; p.guard = false; ev({ k: 'guard', id: p.id, f: 'break', el: p.cur }); }
  return true;
}

// ===================== on screen =====================
// my own block is drawn straight from the key (online, the host's word on it arrives a ping late)
const myGuard = p => !!(keys[BIND.block] || virt.b) && !p.down && !(p.gk > 0) && playing;
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
  return { g, outer, inner, sig, core, mats, L, col, el, omni, a: 0, hit: 0, brk: 0, kp: 0, kv: 0, tilt: 0 };
}
// every frame: shields up for whoever is blocking (src: the state being drawn, me: my own player)
function guardFrame(src, dt, t) {
  const live = new Set();
  for (const p of Object.values(src?.players || {})) {
    const id = p.id, on = (id === myId ? myGuard(p) : !!p.gd) && !p.down; let v = GV.get(id);
    if (!on && !v) continue;
    if (v && v.el !== p.cur) { v.g.removeFromParent(); GV.delete(id); v = null; }
    if (!v) { v = guardMake(p.cur); GV.set(id, v); }
    live.add(id);
    v.a += ((on ? 1 : 0) - v.a) * Math.min(1, dt * (on ? 14 : 30)); v.hit = Math.max(0, v.hit - dt * 4); // gone almost the moment you let go
    v.kv += (-90 * v.kp - 11 * v.kv) * dt; v.kp += v.kv * dt; // the recoil: a stiff spring, knocked back and wobbling home
    if (v.a < .1 && !on) { v.g.removeFromParent(); GV.delete(id); continue; }
    const mine = id === myId, k = v.a, hp = p.gm ? clamp(p.gh / p.gm, 0, 1) : 1;
    const kp = v.kp, punch = 1 + Math.max(-.15, -kp * .5) + v.hit * .06; // squashed by the blow, then a bounce back
    if (mine && !v.omni) { if (v.g.parent !== camera) camera.add(v.g); v.g.position.set(-.16 + Math.sin(v.tilt) * kp * .08, -.2 - kp * .05, -1.3 + kp * .3); v.g.rotation.set(kp * .45, -v.tilt * kp * 1.2, Math.sin(v.tilt) * kp * .3); v.g.scale.setScalar(.42 * (.6 + .4 * k) * punch); }
    else {
      if (v.g.parent !== scene) scene.add(v.g);
      const f = V(-Math.sin(p.yaw), 0, -Math.cos(p.yaw));
      if (v.omni) { v.g.position.set(p.x, p.y + 1, p.z); v.g.rotation.set(0, 0, 0); v.g.scale.set(k * (1 + kp * .3), k * (1 - kp * .3), k * (1 + kp * .3)); }
      else { const b = 1 - kp * .35; v.g.position.set(p.x + f.x * b, p.y + 1.25, p.z + f.z * b); v.g.rotation.set(-kp * .45, p.yaw - v.tilt * kp * 1.2, 0); v.g.scale.setScalar(.9 * (.6 + .4 * k) * punch); }
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
    const big = clamp((e.n || 10) / 22, .35, 1.6); // bigger blows knock it back harder
    if (v && P) {
      v.hit = 1; v.kv += 6 * big; // knocked back toward you...
      const rel = Math.atan2(e.x - P.x, e.z - P.z) - Math.atan2(-Math.sin(P.yaw), -Math.cos(P.yaw)); v.tilt = clamp(Math.atan2(Math.sin(rel), Math.cos(rel)), -1.2, 1.2); // ...and twisted away from the side it came from
      const m = glowMats(col), o = glowify(T.shock.clone(), m); o.rotation.x = Math.PI / 2; o.position.x = Math.sin(v.tilt) * .5; // a ripple running out over its face from where it landed
      addFx(o, .4, (o, k) => { o.scale.setScalar((v.omni ? .6 : .2) + k * (v.omni ? 3 : 1.6)); setOpacity(m, (1 - k) * .9); }, v.g);
      const w = v.g.getWorldPosition(V()), fw = mine ? camera.getWorldDirection(V()) : V(-Math.sin(P.yaw), 0, -Math.cos(P.yaw));
      for (let i = 0; i < 18 * big; i++) emit(w.x + fw.x * .1, w.y, w.z + fw.z * .1, fw.x * rand(2, 7) + rand(-3, 3), rand(-1, 4), fw.z * rand(2, 7) + rand(-3, 3), Math.random() < .4 ? 0xffffff : col, rand(.06, .14), rand(.2, .4), 8); // sparks thrown off it
      flash(w.x, w.y, w.z, col, 20 * big, .12);
    }
    if (P && !mine) { const f = V(-Math.sin(P.yaw), 0, -Math.cos(P.yaw)); burst(P.x + f.x, P.y + 1.3, P.z + f.z, 24, col, 6, .15, .35); }
    if (mine) { shake(.08 + .12 * big); guardJolt = big; popNum(camera.position.x, camera.position.y - .2, camera.position.z, `BLOCKED ${e.n}`, '#' + col.toString(16).padStart(6, '0'), 'tag'); }
    sfx('block'); return;
  }
  if (e.f === 'break') {
    if (P) { burst(P.x, P.y + 1.3, P.z, 70, col, 9, .25, .6, 6); ringFx(P.x, P.y + 1.2, P.z, 2.4, col, .4); }
    if (mine) { banner(`${(BLOCK[e.el]?.name || 'BLOCK').toUpperCase()} BROKEN`, '#ff8a8a', 1300); shake(.35); }
    sfx('smash'); return;
  }
  if (e.f === 'ready') { if (mine) { popNum(camera.position.x, camera.position.y - .3, camera.position.z, 'BLOCK READY', '#9fe6ff', 'tag'); sfx('pick'); } return; }
}
// the first-person hand: the left hand thrown up, palm out, while the block is held
let guardHand = 0, guardJolt = 0; // jolt: the hand knocked back by a blow on the shield
function guardPose(mp, dt) { const on = mp && myGuard(mp); guardHand += ((on ? 1 : 0) - guardHand) * Math.min(1, dt * (on ? 12 : 24)); guardJolt = Math.max(0, guardJolt - dt * 5); return guardHand - guardJolt * .45 * guardHand; }
