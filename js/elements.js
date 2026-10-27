// Mage Arena elements: 30 elements x 5 moves (LMB, RMB, Q, E, R=ultimate).
// A move: { name, icon, desc, cd, mode: 'tap' | 'aim' (hold to aim, release to cast) | 'charge' (hold to power up) | 'channel' (hold),
//   cast(p, c)      host: damage, projectiles (shoot), entities (ent)       c = ctxOf(): o (hand), d (aim dir), k (charge), dmg (multiplier), tgt (aim point)...
//   self(p, c)      owner: movement and self-buffs (dashes, leaps, glides) so the guest's own body moves instantly
//   tick/start/end  channels (host)          shot: { hit, end, tick, ground }   ent: { tick, end }  (host hooks)
//   look / view     client visuals for this move's projectiles / entities;  chv: channel visual;  fx: { name: e => ... } client event handlers }
// Element status `st`: dot (dps), stacks, dotStacks, vulnStacks, slow, vuln, kb, weak (enemy dmg -%), leech. Hooks: onStatus, onHit, onKill.
'use strict';

// ---------- shared helpers (host) ----------
// k / m / f are reserved for routing, so they go last and can't be overwritten by the payload
const fxe = (m, f, o = {}) => { for (const k in o) if (typeof o[k] === 'number') o[k] = r2(o[k]); ev({ ...o, k: 'fx', m, f }); };
const ctxS = s => ({ p: S.players[s.own], el: s.el, m: MOVE[s.mv], dmg: s.mul ?? 1 });
const ctxN = n => ({ p: own(n), el: n.el, m: MOVE[n.mv], dmg: n.mul ?? 1 });
// blast + matching 'boom'-style event with the real (Wide Blast scaled) radius
function boomAt(c, x, y, z, r, dmg, o = {}, f = 'boom') {
  const R = r * (c.p ? stats(c.p).aoe : 1), hit = blast(x, z, R, dmg, c, { ...o, raw: true, y });
  fxe(c.m.key, f, { x, y, z, r: R, ...(o.fx || {}) });
  return hit;
}
const spread = (d, i, n, step = .09) => d.clone().applyAxisAngle(UP, (i - (n - 1) / 2) * step);
const lob = (d, up = .14) => V(d.x, d.y + up, d.z).normalize();
function chainBolt(p, c, dmg, chains) {
  let first = rayHits(c.o, c.d, 38, .45)[0]?.e;
  const pts = [[c.o.x, c.o.y, c.o.z]];
  if (!first) { const t = c.d.y < -.01 ? Math.min(38, -c.o.y / c.d.y) : 38, q = c.o.clone().addScaledVector(c.d, t); pts.push([q.x, q.y, q.z]); ev({ k: 'bolt', el: c.el, pts: pts.map(a => a.map(r2)) }); return; }
  const hits = [first];
  while (hits.length < 1 + chains) { const l = hits[hits.length - 1], n = nearest(l.x, l.z, 7, hits.map(h => h.id)); if (!n) break; hits.push(n); }
  for (const e of hits) { const q = center(e); pts.push([q.x, q.y, q.z]); }
  ev({ k: 'bolt', el: c.el, pts: pts.map(a => a.map(r2)) });
  hits.forEach((e, i) => hitEnemy(e, c.el, dmg * (i ? .75 : 1), p, e.x - p.x, e.z - p.z, 1.5));
}
// hitscan laser along laserPath (bounces off pillars, walls and the floor); each bounce hits 25% harder (Laser's passive)
// Focus: hitting the same enemy again within 1.5 s stacks +6% (up to 6). A beam that crosses one of your Refractors ends there and splits.
function laserShot(p, o, d, len, bounces, dmg, kb = 1, split = true) {
  let pts = laserPath(o, d, len, bounces), lens = null;
  if (split && p) for (let i = 0; !lens && i + 1 < pts.length; i++) {
    const a = pts[i], v = pts[i + 1].clone().sub(a), L = v.length(); if (L < .01) continue; v.divideScalar(L);
    for (const n of entsOf(p, 'laser.2')) { const c = V(n.x, n.y, n.z), t = clamp(c.clone().sub(a).dot(v), 0, L); if (a.clone().addScaledVector(v, t).distanceTo(c) < 1.1) { lens = n; pts = [...pts.slice(0, i + 1), c]; break; } }
  }
  const seen = new Set(), f = p ? p.bd.foc ??= { id: 0, n: 0, t: -9 } : null;
  let first = null;
  for (let i = 0; i + 1 < pts.length; i++) {
    const a = pts[i], v = pts[i + 1].clone().sub(a), L = v.length();
    if (L < .01) continue;
    v.divideScalar(L);
    for (const h of rayHits(a, v, L, .35)) {
      if (seen.has(h.e.id)) continue;
      seen.add(h.e.id); first ??= h.e;
      const head = h.q.y > h.e.y + ET[h.e.type].h * h.e.sc * .72, foc = f && f.id === h.e.id && S.t - f.t < 1.5 ? 1 + .06 * f.n : 1;
      hitEnemy(h.e, 'laser', dmg * (1 + .25 * i) * foc, p, v.x, v.z, kb, { crit: head ? 1.75 : 1, src: { x: a.x, z: a.z } });
    }
  }
  if (f && first) { f.n = f.id === first.id && S.t - f.t < 1.5 ? Math.min(6, f.n + 1) : 0; f.id = first.id; f.t = S.t; }
  if (lens) { // split into up to 3 beams at the enemies nearest the lens, each counting the lens as one more bounce
    const c = V(lens.x, lens.y, lens.z), k = 1 + .25 * (pts.length - 1);
    const es = enemiesNear(c.x, c.z, 25).sort((a, b) => Math.hypot(a.x - c.x, a.z - c.z) - Math.hypot(b.x - c.x, b.z - c.z)).slice(0, 3);
    fxe('laser.2', 'split', { x: c.x, y: c.y, z: c.z, b: es.map(e => laserShot(p, c, center(e).sub(c).normalize(), 30, 0, dmg * k, kb, false)) });
  }
  return pts.map(q => [q.x, q.y, q.z].map(r2));
}
// Prism Nova's eight spinning beams (host and client compute the same paths from the entity's clock)
const novaBeams = n => Array.from({ length: 8 }, (_, i) => { const a = n.t * 1.3 + TAU * i / 8; return laserPath(V(n.x, (n.y || 0) + 4, n.z), V(Math.sin(a), -.3, Math.cos(a)), 34, 3); });
// summon brain: chase the enemy nearest the owner, attack in reach every `period`
function summonAI(n, dt, spd, reach, period, attack, leash = 20) {
  const p = own(n);
  if ((n.rt = (n.rt || 0) - dt) <= 0) { n.rt = .4; const e = p && nearest(p.x, p.z, leash) || nearest(n.x, n.z, 10); n.tg = e ? e.id : 0; }
  const e = n.tg && S.enemies.find(x => x.id === n.tg && alive(x));
  let tx, tz;
  if (e) { tx = e.x; tz = e.z; } else if (p) { tx = p.x + Math.cos(n.id) * 2; tz = p.z + Math.sin(n.id) * 2; } else return;
  const dx = tx - n.x, dz = tz - n.z, d = Math.hypot(dx, dz), R = e ? ET[e.type].r * e.sc : 0;
  n.v = 0;
  if (d > reach + R) { const st = Math.min(d - reach - R, spd * dt); n.x += dx / d * st; n.z += dz / d * st; n.v = spd; }
  if (d > .1) n.yaw = Math.atan2(dx, dz);
  const q = { x: n.x, z: n.z }; collide(q, .4); n.x = q.x; n.z = q.z;
  if (e && d <= reach + R + .3 && pulse(n, dt, period, 'atk')) { n.s = (n.s || 0) + 1; attack(e); }
}
// Spirit's summons that Command can send (wandering spirits, the wolf, the knights)
const SUMMONS = new Set(['spirit.0', 'spirit.3', 'spirit.4']);
const raiseSpirit = (p, x, z, dmg) => ent(p, { p, el: 'spirit', m: MOVE['spirit.0'], dmg }, x, z, { life: 8, r: .5 });
// line zones (Glacial Lance's ice trail, Thermal Lance's burn): enemies within r of the segment (fx0, fz0)-(x, z)
const nearSeg = (n, r) => enemiesNear((n.x + n.fx0) / 2, (n.z + n.fz0) / 2, Math.hypot(n.x - n.fx0, n.z - n.fz0) / 2 + r).filter(e => {
  const ax = n.x - n.fx0, az = n.z - n.fz0, L2 = ax * ax + az * az || 1, t = clamp(((e.x - n.fx0) * ax + (e.z - n.fz0) * az) / L2, 0, 1);
  return Math.hypot(e.x - n.fx0 - ax * t, e.z - n.fz0 - az * t) < r + ET[e.type].r * e.sc;
});
const segView = (color, w) => ({ // particles rising off the floor along the line
  make: () => Object.assign(new THREE.Group(), { userData: { mats: [] } }),
  upd(o, n) { const k = Math.min(1, n.l * 4); for (let i = 0; i < 4; i++) { if (Math.random() > k) continue; const t = Math.random(); emit(n.fx0 + (n.x - n.fx0) * t + rand(-w, w), .12, n.fz0 + (n.z - n.fz0) * t + rand(-w, w), 0, rand(.3, 1.5), 0, color, rand(.1, .25), .7, -.3); } },
  drop: o => o.removeFromParent() });
const raiseBone = (p, x, z, yaw, dmg) => ent(p, { p, el: 'bone', m: MOVE['bone.0'], dmg }, x, z, { life: 12, r: .5, yaw }); // a skeleton warrior (Raise Dead, Marrow Burst)

// ---------- shared helpers (client visuals) ----------
const isMe = id => id === myId;
const colOf = el => EL[el]?.color ?? 0xffffff;
function modelFx(name, color, pos, life, upd, opts) {
  const o = model(name, color, opts); o.position.copy(pos);
  return addFx(o, life, (o, k, dt) => upd ? upd(o, k, dt) : fade(o, 1 - k));
}
function boomFx(x, y, z, r, color, k = 1) {
  ringFx(x, .08, z, r, color, .45);
  burst(x, y, z, Math.round(40 * k), color, 9 * Math.sqrt(r / 2.6), .35 * k, .6, -2, 2);
  burst(x, y, z, Math.round(18 * k), new THREE.Color(color).lerp(new THREE.Color(1, 1, 1), .5).getHex(), 5, .5 * k, .35);
  flash(x, y + .5, z, color, 35 * k, .35);
  shake(clamp((.5 - distTo(x, z) * .03) * Math.min(1.6, r / 2.6), .04, .5)); sfx('boom');
}
const REAP_ARC = new THREE.RingGeometry(4.6, 6.4, 32, 1, -Math.PI / 2 - 1.35, 2.7).rotateX(-Math.PI / 2); // Reap's crescent, centred on +z
const _bgeo = new THREE.CylinderGeometry(1, 1, 1, 10, 1, true).rotateX(Math.PI / 2).translate(0, 0, .5);
function beamMesh(color, w, core = true) { const m = energyMat(color, core, true), o = new THREE.Mesh(_bgeo, m); o.userData.mats = [m]; o.scale.set(w, w, 1); o.frustumCulled = false; return o; }
function aimBeam(o, a, b, w) { o.position.copy(a); o.lookAt(b); o.scale.set(w, w, Math.max(.01, a.distanceTo(b))); }
function beamFx(a, b, color, w = .12, life = .22) {
  const o = beamMesh(color, w); aimBeam(o, a, b, w);
  addFx(o, life, (o, k) => { fade(o, 1 - k); o.scale.x = o.scale.y = w * (1 - k * .6); });
}
function skyFx(x, y, z, color) {
  const pts = [[x + rand(-1, 1), y + 16, z + rand(-1, 1)]];
  for (let i = 1; i < 6; i++) pts.push([x + rand(-.6, .6) * (1 - i / 6), y + 16 * (1 - i / 6), z + rand(-.6, .6) * (1 - i / 6)]);
  pts.push([x, y, z]);
  boltFx(pts, color); burst(x, y, z, 18, color, 7, .2, .3); flash(x, y + 1, z, color, 40, .2);
}
// dust kicked up off the floor: real (normal-blended) puffs, plus a little bright grit
function dustFx(x, z, r, color = 0x9a8a78) {
  smokeFx(x, .3, z, r, color, 1.3, Math.round(4 + 2 * Math.min(r, 4)), .8);
  for (let k = 0; k < 6 * Math.min(3, r); k++) { const a = rand(0, TAU), d = rand(0, r); emit(x + Math.cos(a) * d, .1, z + Math.sin(a) * d, Math.cos(a) * rand(1, 4), rand(2, 5), Math.sin(a) * rand(1, 4), 0xd8c8a8, rand(.06, .12), rand(.5, .9), 9, 1); }
}
function riseFx(name, color, x, z, s = 1, life = 1, yaw = rand(0, TAU)) {
  const o = model(name, color, { shadow: true }); o.position.set(x, -2 * s, z); o.rotation.y = yaw; o.scale.setScalar(s);
  addFx(o, life, (o, k) => { o.position.y = k < .15 ? -2 * s * (1 - easeOut(k / .15)) : k > .7 ? -2 * s * ((k - .7) / .3) ** 2 : 0; if (k > .7) fade(o, 1 - (k - .7) / .3); });
  return o;
}
// persistent ground circle for zones (counter-rotates like the cast circles)
function zoneCircle(el, r, a = .7) { const c = makeCircle(el); c.scale.setScalar(r); c.position.y = .07; setOpacity(c.userData.mats, a); c.userData.r = r; return c; }
function handPos(id) {
  if (id === myId) return camera.localToWorld(V(-.24, -.16, -.75));
  const p = (role === 'guest' ? R : S)?.players[id];
  return p ? handOf({ ...p, pitch: p.pitch || 0 }) : V();
}
const flameColor = () => Math.random() < .5 ? 0xff5a1a : 0xffb040;
// group with N models arranged in a circle of radius r
function ringOf(name, color, n, r, s = 1, opts) { const g = new THREE.Group(); g.userData.mats = []; for (let i = 0; i < n; i++) { const o = model(name, color, opts); const a = TAU * i / n; o.position.set(Math.cos(a) * r, 0, Math.sin(a) * r); o.scale.setScalar(s); o.rotation.y = rand(0, TAU); g.add(o); g.userData.mats.push(...o.userData.mats); } return g; }
// standard fade-out for entity views when they expire
const dropFade = (life = .45) => (o) => addFx(o, life, (o, k) => { fade(o, 1 - k); if (o.userData.circle) setOpacity(o.userData.circle.userData.mats, (1 - k) * .7); });
// a laser drawn along its corner points: white core, coloured glow, a spark at every bounce
function laserFx(pts, color, w = .06, life = .16) {
  const P = pts.map(q => V(...q));
  if (P.length > 1 && P[0].distanceTo(camera.position) < 1.6) { P[0].lerp(P[1], Math.min(.9, 2.4 / Math.max(.01, P[0].distanceTo(P[1])))); w *= .55; } // your own laser: seen nearly end-on, so start it further out and thinner
  for (let i = 0; i + 1 < P.length; i++) { beamFx(P[i], P[i + 1], 0xffffff, w * .45, life); beamFx(P[i], P[i + 1], color, w * 1.7, life * 1.3); }
  for (let i = 1; i < P.length; i++) { const { x, y, z } = P[i], end = i === P.length - 1; burst(x, y, z, end ? 8 : 5, color, 4, .12, .25); flash(x, y, z, color, end ? 10 : 6, .1); }
}
// a glowing see-through copy of the wizard (Illusion's decoy, Shadow's Night Terror)
function ghostWizard(color) {
  const g = WIZ.clone(), m = energyMat(color);
  g.traverse(o => { if (o.isMesh) { o.material = m; o.castShadow = false; } });
  g.userData.mats = [m];
  return g;
}
// Ink: a projectile's splash (host) and the wet splat it leaves on the floor (client). Ink lies just above the arena's raised tiles (0.085 m).
const INK_Y = .09;
function inkSplash(s, e, r, k) { blast(s.x, s.z, r, s.dmg * k, ctxS(s), { kb: 1, skip: e ? [e.id] : [] }); fxe('ink.0', 'splash', { x: s.x, y: s.y, z: s.z, r }); }
function inkDecal(x, z, r, life) {
  const yaw = rand(0, TAU);
  modelFx('ink__pool', 0x3a52ff, V(x, INK_Y + rand(0, .01), z), life, (o, k) => { const s = r * easeOut(Math.min(1, k * life * 8)); o.rotation.y = yaw; o.scale.set(s, 1, s); fade(o, k < .7 ? 1 : 1 - (k - .7) / .3); }, { flat: true });
}
// soft smoke puffs that can be dark (particles are additive, so they can only ever glow)
let _puffTex;
const puffTex = () => _puffTex ??= (() => { const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d'), gr = g.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(.45, 'rgba(255,255,255,.55)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 64); return new THREE.CanvasTexture(c); })();
// a lingering cloud with one shared material (Shadow's Blackout)
function smokeCloud(n, r, color) {
  const g = new THREE.Group(), m = new THREE.SpriteMaterial({ map: puffTex(), color, transparent: true, opacity: 0, depthWrite: false });
  g.userData.puffs = Array.from({ length: n }, () => { const s = new THREE.Sprite(m), a = rand(0, TAU), d = Math.sqrt(Math.random()) * r * .85; s.position.set(Math.cos(a) * d, rand(.4, 1.6), Math.sin(a) * d); s.userData.s = rand(1.8, 3); s.userData.ph = rand(0, TAU); g.add(s); return s; });
  g.userData.puffMat = m;
  return g;
}
// billowing smoke or dust: puffs that swell, drift up and outward, and fade
// ponytail: one live-count cap for smoke and debris (fx scan), halved on Low graphics; a pooled renderer if big fights still stutter
const fxRoom = (tag, max) => Math.max(0, (HQ ? max : max / 2) - fx.reduce((a, f) => a + (f.obj.userData.tag === tag), 0));
function smokeFx(x, y, z, r, color = 0x2a2622, life = 1.8, n = 10, rise = 1.2) {
  n = Math.min(n, fxRoom('puff', 140));
  for (let i = 0; i < n; i++) {
    const m = new THREE.SpriteMaterial({ map: puffTex(), color: new THREE.Color(color).multiplyScalar(rand(.8, 1.15)), transparent: true, opacity: 0, depthWrite: false, rotation: rand(0, TAU) }), o = new THREE.Sprite(m); o.userData.tag = 'puff';
    const a = rand(0, TAU), d = rand(0, r * .5), v = V(Math.cos(a) * rand(.5, 1.5) * r * .6, rand(.4, 1) * rise * 1.5, Math.sin(a) * rand(.5, 1.5) * r * .6), s0 = r * rand(.45, .8), L = life * rand(.7, 1.15);
    o.position.set(x + Math.cos(a) * d, y + rand(0, r * .3), z + Math.sin(a) * d);
    addFx(o, L, (o, k, dt) => { o.position.addScaledVector(v, dt * (1 - k) * 1.6); o.scale.setScalar(s0 * (.5 + 1.3 * easeOut(k))); m.opacity = (k < .12 ? k / .12 : 1 - (k - .12) / .88) * .9; m.rotation += dt * .25; });
  }
}
// chunks thrown out by an impact: they tumble, bounce and settle, then shrink away
function debrisFx(x, y, z, n, name, color, s = .3, spd = 7) {
  n = Math.min(n, fxRoom('chunk', 70));
  for (let i = 0; i < n; i++) {
    const o = model(name, color); o.userData.tag = 'chunk'; const v = V(rand(-1, 1), rand(.5, 1.5), rand(-1, 1)).normalize().multiplyScalar(spd * rand(.5, 1)), sp = V(rand(-10, 10), rand(-10, 10), rand(-10, 10)), sc = s * rand(.6, 1.3);
    o.position.set(x, y, z); o.scale.setScalar(sc);
    addFx(o, rand(1, 1.5), (o, k, dt) => {
      v.y -= 20 * dt; o.position.addScaledVector(v, dt);
      if (o.position.y < .12) { o.position.y = .12; v.y *= -.35; v.x *= .55; v.z *= .55; sp.multiplyScalar(.5); }
      o.rotation.x += sp.x * dt; o.rotation.y += sp.y * dt; o.rotation.z += sp.z * dt;
      if (k > .75) o.scale.setScalar(sc * (1 - (k - .75) / .25));
    });
  }
}
// a mark left on the floor (Ink's splat model: glossy black with a rim in the given colour): scorches, craters
function scarFx(x, z, r, color, life = 4) {
  const yaw = rand(0, TAU);
  modelFx('ink__pool', color, V(x, INK_Y + rand(0, .01), z), life, (o, k) => { const s = r * easeOut(Math.min(1, k * life * 10)); o.rotation.y = yaw; o.scale.set(s, 1, s); fade(o, k < .6 ? 1 : 1 - (k - .6) / .4); }, { flat: true });
}
// Explosion's booms: a burst of fire-lit smoke rolling into grey, flying debris, embers and a scorch mark
function blastFx(e, k = 1) {
  boomFx(e.x, e.y, e.z, e.r, 0xffa020, .8 * k);
  smokeFx(e.x, Math.max(e.y, .5), e.z, e.r * .5 * k, 0xffa040, .55, 5, 2.2); // the fireball: bright fire-lit puffs that burn out fast
  smokeFx(e.x, Math.max(e.y, .5), e.z, e.r * .6, 0xc0662a, 1, 4, 1.8);
  smokeFx(e.x, Math.max(e.y, .5), e.z, e.r * .8, 0x5a5047, 2.4, Math.round(4 + e.r * 1.5), 1.4);
  debrisFx(e.x, .4, e.z, Math.round(2 + e.r), 'earth__pebble', 0xff8a20, .2, 8);
  scarFx(e.x, e.z, e.r * .6, 0xff5a10, 4);
  burst(e.x, e.y + .3, e.z, 14, 0xffb050, 7, .08, 1.1, 9, 3); // embers
}
// curl an abyss tentacle (a chain of 6 segments): k = how hard it curls toward its suckers, ph = phase of its writhing
function curlTentacle(o, k, ph, sway = .25) {
  const segs = o.userData.segs ??= [1, 2, 3, 4, 5].map(i => o.getObjectByName('abyss__tentacle_seg' + i));
  segs.forEach((s, i) => { if (s) { s.rotation.x = k * (.25 + i * .07) + Math.sin(ph + i * .7) * sway; s.rotation.z = Math.cos(ph * .8 + i * .9) * sway * .6; } });
}
const shimmer = t => new THREE.Color().setHSL((t * .12) % 1, .75, .78); // Illusion's slowly shifting iridescence
// Rune wards: every Rune spell but the bolt is inscribed on the ground. A ward arms after a second, then goes off when an enemy steps on it.
// n.s marks a ward that has gone off (Binding Circle keeps living as its circle)
function placeWard(p, c, max, o = {}) { const mine = entsOf(p, c.m.key).filter(n => !n.s).sort((a, b) => a.id - b.id); while (mine.length >= max) mine.shift().dead = true; return ent(p, c, c.tgt.x, c.tgt.z, { life: 30, r: 2.2, ...o }); }
const tripped = n => !n.s && n.t > 1 && enemiesNear(n.x, n.z, n.r).length > 0;
// the ward on the ground, with an optional floating model over it that tells the wards apart
function wardMake(n, top, ts = 1) {
  const g = new THREE.Group(), u = g.userData, w = model('rune__trap', 0x22e6b8, { flat: true }); w.scale.setScalar(n.r); w.rotation.y = rand(0, TAU); g.add(w); u.ward = w; u.mats = [...w.userData.mats];
  if (top) { const o = model(top, 0x22e6b8, { flat: top === 'rune__glyph', shadow: top !== 'rune__glyph' }); o.scale.setScalar(ts); u.face = top === 'rune__glyph'; g.add(o); u.top = o; u.mats.push(...o.userData.mats); }
  burst(n.x, .2, n.z, 20, 0x7affd8, 3, .15, .4, -2); sfx('rune');
  return g;
}
function wardUpd(o, n, dt, t) {
  const u = o.userData; u.ward.position.y = .05; u.ward.rotation.y += dt * .3;
  if (u.top) { u.top.position.y = 1.3 + Math.sin(t * 2 + n.id) * .15; if (u.face) { u.top.lookAt(camera.position); u.top.rotateZ(t * .8); } else u.top.rotation.y += dt * .8; } // a glyph turns to face you, a stone spins
  fade(o, Math.min(1, n.l * 20) * (n.t < 1 ? .25 + .2 * Math.sin(t * 20) : .75 + .25 * Math.sin(t * 3 + n.id)));
  if (n.t > 1 && Math.random() < .08) emit(n.x + rand(-1, 1), .1, n.z + rand(-1, 1), 0, rand(.5, 1.2), 0, 0x7affd8, .1, .8, -.2);
}
const wardView = (top, ts) => ({ make: n => wardMake(n, top, ts), upd: wardUpd, drop: dropFade(.25) });

// ---------- the elements ----------
const ELEMENTS = {
// ================================================================== FIRE
fire: {
  name: 'Fire', color: 0xff5a1a, glyph: '🔥', adj: 'BURNING', react: { name: 'IGNITION', kind: 'blast' },
  blurb: 'Raw destruction. Stack burns on everything, then blow it all up.',
  passive: 'Kindling: burns stack up to 3 times, and burning enemies explode when they die.',
  st: { dot: 7, stacks: 3, dotStacks: 1 },
  onKill(e, p) { if (e.st.fire > 0) boomAt({ p, el: 'fire', m: MOVE['fire.0'], dmg: 1 }, e.x, e.y + .8, e.z, 2.6, 20 * stats(p).dmgMul, { kb: 5, noStatus: true }); },
  moves: [
    { name: 'Fireball', icon: '☄️', cd: .5, desc: 'Hurl a fireball that explodes on impact.',
      cast(p, c) { for (let k = 0; k < c.multi; k++) shoot(p, c, 30, { d: spread(c.d, k, c.multi), r: .35, dmg: 18 * c.dmg, sc: c.mega ? 1.8 : 1, big: c.mega }); },
      shot: { hit: () => 'end', end(s) { boomAt(ctxS(s), s.x, Math.max(s.y, .1), s.z, 2.5 * (s.big ? 1.6 : 1), s.dmg, { kb: 5 }); } },
      look: { m: 'fire__ball', spin: [0, 0, 9], trail: [flameColor, .35, .35, -1, 3], light: 9 },
      fx: { boom: e => boomFx(e.x, e.y, e.z, e.r, 0xff6a1a), det: e => boomFx(e.x, e.y, e.z, 2.5, 0xff6a1a, .6), nova: e => boomFx(e.x, .5, e.z, 4.5, 0xff6a1a, .8) } },
    { name: 'Flamethrower', icon: '🌋', cd: 4, mode: 'channel', max: 2.6, desc: 'Hold to pour a cone of fire. Stacks burns and ramps up the longer you hold.',
      tick(p, c, dt) { if (pulse(p.bd, dt, .1, 'ft')) for (const e of coneHits(p, 7.5, 50)) hitEnemy(e, 'fire', 3.8 * c.dmg * (1 + p.chT * .45), p, e.x - p.x, e.z - p.z, .8, { src: p }); },
      chv: {
        make() { const o = model('gen__cone', 0xff6a1a); fade(o, .25); return o; },
        upd(o, a, d, dt) {
          o.position.copy(a); o.lookAt(a.clone().add(d)); o.scale.set(3.4, 3.4, 7.5); o.rotation.z += dt * 3;
          for (let k = 0; k < 7; k++) { const s = rand(10, 16); emit(a.x + d.x * .3, a.y + d.y * .3, a.z + d.z * .3, d.x * s + rand(-2.5, 2.5), d.y * s + rand(-1.5, 2.5), d.z * s + rand(-2.5, 2.5), flameColor(), rand(.25, .55), rand(.35, .55), -2.5, 1.2); }
          if (Math.random() < .3) flash(a.x + d.x * 3, a.y, a.z + d.z * 3, 0xff6a1a, 8, .1);
        } } },
    { name: 'Fire Brand', icon: '🔥', cd: 6, desc: 'Brand the first enemy you hit with 3 burns. A moment later the brand detonates, blasting everything around it and setting every enemy caught in the blast burning with 3 burns of its own.',
      cast(p, c) { shoot(p, c, 34, { r: .45, life: 1, dmg: 10 * c.dmg }); },
      shot: { hit(s, e) {
        const c = ctxS(s); hitEnemy(e, 'fire', s.dmg, c.p, 0, 0, 0); for (let i = 0; i < 2; i++) applyStatus(e, 'fire', c.p);
        fxe(s.mv, 'brand', { x: e.x, y: e.y + 1, z: e.z });
        later(1.2, () => { const hit = boomAt(c, e.x, e.y + .8, e.z, 3.5, 40 * s.mul, { kb: 7 }); for (const o of hit) if (!o.dead) { for (let i = 0; i < 2; i++) applyStatus(o, 'fire', c.p); if (o !== e) fxe(s.mv, 'spread', { x: e.x, y: e.y + 1, z: e.z, x2: o.x, y2: o.y + 1, z2: o.z }); } });
        return 'end';
      } },
      look: { m: 'fire__ball', s: .5, spin: [0, 0, 12], trail: [flameColor, .2, .3, -1, 2], light: 5 },
      fx: { brand(e) { burst(e.x, e.y, e.z, 20, 0xffb040, 4, .25, .6, -1); ringFx(e.x, e.y, e.z, 1, 0xff6a1a, .4); sfx('fire'); },
        spread(e) { const a = V(e.x, e.y, e.z), b = V(e.x2, e.y2, e.z2); for (let i = 0; i <= 10; i++) { const q = a.clone().lerp(b, i / 10); q.y += Math.sin(i / 10 * Math.PI) * 1.2; emit(q.x, q.y, q.z, 0, rand(.5, 2), 0, flameColor(), rand(.15, .3), .45, -1); } burst(b.x, b.y, b.z, 12, 0xffb040, 4, .2, .4, -1); },
        boom: e => { boomFx(e.x, e.y, e.z, e.r, 0xff6a1a); shake(.2); } } },
    { name: 'Ring of Fire', icon: '⭕', cd: 12, desc: 'Raise a wall of flame around you. Enemies that cross it are scorched and thrown back.',
      cast(p, c) { ent(p, c, p.x, p.z, { r: 5.5 * c.st.aoe, life: 5 }); },
      ent: { tick(n, dt) {
        for (const e of enemiesNear(n.x, n.z, n.r + 1.5)) {
          const dx = e.x - n.x, dz = e.z - n.z, d = Math.hypot(dx, dz) || 1;
          if (Math.abs(d - n.r) < 1 + ET[e.type].r * e.sc && ready(n, e, .3)) { const out = d > n.r - .2 ? 1 : -1; hitEnemy(e, 'fire', 11 * n.mul, own(n), dx * out, dz * out, 9, { aoe: true }); }
        } } },
      view: {
        make(n) { const g = ringOf('fire__flame', 0xff5a1a, 36, n.r, 1.6, { flame: true }); g.userData.circle = zoneCircle('fire', n.r + .4, .6); g.add(g.userData.circle); return g; },
        upd(o, n, dt, t) {
          const grow = Math.min(1, n.t * 4);
          o.children.forEach((f, i) => { if (f !== o.userData.circle) f.scale.set(.75, (1 + .3 * Math.sin(t * 13 + i * 1.7)) * grow * 1.3, .75); });
          spinCircle(o.userData.circle, dt, .4);
          if (Math.random() < .7) { const a = rand(0, TAU); emit(n.x + Math.cos(a) * n.r, rand(.2, 1.5), n.z + Math.sin(a) * n.r, 0, rand(2, 4), 0, flameColor(), rand(.2, .4), .7, -1.5); }
        }, drop: dropFade() } },
    { name: 'Phoenix Dive', icon: '🐦‍🔥', mode: 'aim', range: 26, aimR: 7, desc: 'ULTIMATE. Rise as a phoenix and crash onto the target, setting the ground ablaze.',
      self(p, c) { p.mo = { arc: 1, t: 0, T: 1.1, x0: p.x, z0: p.z, x1: c.tgt.x, z1: c.tgt.z, h: 9 }; },
      cast(p, c) {
        buff(p, 'phoenix', 1.35); fxe(c.m.key, 'rise', { id: p.id, x: p.x, z: p.z, tx: c.tgt.x, tz: c.tgt.z });
        const t = c.tgt.clone();
        later(1.1, () => { boomAt(c, t.x, .3, t.z, 7, 65 * c.dmg, { kb: 12, lift: 8 }, 'land'); ent(p, c, t.x, t.z, { r: 6, life: 5, kind: 'pyre' }); });
      },
      ent: { tick(n, dt) { if (pulse(n, dt, .5)) for (const e of enemiesNear(n.x, n.z, n.r)) hitEnemy(e, 'fire', 6 * n.mul, own(n), 0, 0, 0, { aoe: true, noCombo: true }); } },
      view: { make(n) { const g = ringOf('fire__flame', 0xff5a1a, 18, n.r * .7, .9, { flame: true }); g.userData.circle = zoneCircle('fire', n.r, .8); g.add(g.userData.circle); return g; },
        upd(o, n, dt, t) { spinCircle(o.userData.circle, dt, .3); o.children.forEach((f, i) => { if (f !== o.userData.circle) f.scale.y = (.8 + .3 * Math.sin(t * 11 + i)) * Math.min(1, n.l * 4); });
          for (let k = 0; k < 2; k++) { const a = rand(0, TAU), d = rand(0, n.r); emit(n.x + Math.cos(a) * d, .2, n.z + Math.sin(a) * d, 0, rand(1.5, 4), 0, flameColor(), rand(.2, .45), .8, -1.5); } }, drop: dropFade() },
      fx: {
        rise(e) {
          const o = model('fire__phoenix', 0xff6a1a), x0 = e.x, z0 = e.z, yaw = Math.atan2(e.tx - e.x, e.tz - e.z);
          o.rotation.y = yaw; o.scale.setScalar(isMe(e.id) ? 1.6 : 2.2);
          addFx(o, 1.15, (o, k) => {
            const u = Math.min(1, k * 1.05); o.position.set(x0 + (e.tx - x0) * u, 4 * 9 * u * (1 - u) + (isMe(e.id) ? -1.2 : 1), z0 + (e.tz - z0) * u);
            o.rotation.x = (u - .5) * 1.2; fade(o, k > .9 ? (1 - k) * 10 : 1);
            for (let i = 0; i < 6; i++) emit(o.position.x + rand(-1.5, 1.5), o.position.y + rand(-.5, .5), o.position.z + rand(-1.5, 1.5), rand(-1, 1), rand(-2, 0), rand(-1, 1), flameColor(), rand(.3, .6), .6, -1);
          });
          if (isMe(e.id)) { fovKick = 2; shake(.2); }
          sfx('fire_big'); circleFx('fire', V(e.tx, .08, e.tz), 7, { life: 1.2 });
        },
        land(e) { boomFx(e.x, 1, e.z, e.r, 0xff6a1a, 2.4); pillarFx(e.x, .05, e.z, e.r * .6, 12, 0xff6a1a, .9); ringFx(e.x, .1, e.z, e.r * 1.4, 0xffb040, .7); shake(.7); sfx('ult'); },
      } },
  ],
},
// ================================================================== FROST
frost: {
  name: 'Frost', color: 0x4cc8ff, glyph: '❄️', adj: 'FROZEN', react: { name: 'FREEZE', kind: 'freeze' },
  blurb: 'Control the battlefield. Slow everything down, freeze it solid, then shatter it.',
  passive: 'Permafrost: 4 Frost hits freeze an enemy solid. Frozen enemies take 40% more damage.',
  st: { slow: .45, stacks: 4 },
  onStatus(e, p, n) { if (n >= 4) { e.stk.frost = 0; if (cc(e, 'freeze', 1.8, p)) fxe('frost.3', 'freeze', { x: e.x, z: e.z, s: ET[e.type].r * e.sc }); } },
  moves: [
    { name: 'Ice Shard', icon: '🧊', cd: .28, desc: 'Rapid crystal shards that pierce one enemy.',
      cast(p, c) { for (let k = 0; k < c.multi; k++) shoot(p, c, 44, { d: spread(c.d, k, c.multi), r: .3, dmg: 12 * c.dmg, pierce: c.st.pierce + 1, sc: c.mega ? 2 : 1 }); },
      shot: { hit(s, e, hd) { hitEnemy(e, 'frost', s.dmg, own(s), s.vx, s.vz, 2.5, { crit: hd ? 1.5 : 1, src: { x: s.x - s.vx, z: s.z - s.vz } }); fxe(s.mv, 'spike', { x: e.x, z: e.z, y: s.y }); } },
      look: { m: 'T.shard', trail: [0xaef0ff, .14, .35, -1, 1], light: 5 },
      fx: { spike(e) { meshFx(T.spike, V(e.x, 0, e.z), .6, .35, .6); burst(e.x, e.y, e.z, 14, 0xaef0ff, 5, .18, .4, 6); sfx('tink'); }, det: e => boomFx(e.x, e.y, e.z, 2.5, 0x4cc8ff, .6), nova: e => boomFx(e.x, .5, e.z, 4.5, 0x4cc8ff, .8) } },
    { name: 'Glacial Lance', icon: '🗡️', cd: 3, mode: 'charge', charge: 1.2, desc: 'Hold to charge a lance that pierces a line of enemies and leaves a strip of slick ice along its path for 4 s: anything standing on it slips and takes 20% more damage. Fully charged, it freezes them. Frozen targets shatter for double damage.',
      cast(p, c) { const k = c.k, f = c.flat, L = 8 + 12 * k; ent(p, c, p.x + f.x * L, p.z + f.z * L, { life: 4, r: .9 + .5 * k, fx0: p.x + f.x * 1.5, fz0: p.z + f.z * 1.5 }); shoot(p, c, 50 + 30 * k, { r: .4 + .4 * k, dmg: (25 + 75 * k) * c.dmg, pierce: c.st.pierce + 2 + Math.round(4 * k), sc: .7 + .8 * k, full: k > .95, kb: 4 + 6 * k, life: 1.4 }); },
      shot: { hit(s, e, hd) {
        const p = own(s); let d = s.dmg;
        if (e.cc?.type === 'freeze') { d *= 2; e.cc.t = 0; fxe(s.mv, 'shatter', { x: e.x, y: e.y + 1, z: e.z }); }
        hitEnemy(e, 'frost', d, p, s.vx, s.vz, s.kb, { crit: hd ? 1.5 : 1, src: { x: s.x - s.vx, z: s.z - s.vz } });
        if (s.full) cc(e, 'freeze', 1.5, p);
      } },
      ent: { tick(n) { for (const e of nearSeg(n, n.r)) { e.fv = Math.max(e.fvU > S.t ? e.fv : 0, .2); e.fvU = S.t + .2; } } }, // no slow: that kept monsters out of Frost Nova's reach
      view: segView(0xaef0ff, .5),
      look: { m: 'frost__lance', trail: [0xaef0ff, .25, .4, -1, 3], light: 7 },
      fx: { shatter(e) { meshFx(T.shatter, V(e.x, e.y, e.z), .7, .5, 2.2, 4); burst(e.x, e.y, e.z, 50, 0x9feaff, 10, .25, .6, 8); sfx('tink'); shake(.15); } } },
    { name: 'Ice Wall', icon: '🧱', cd: 10, mode: 'aim', range: 14, aimR: 3, desc: 'Raise a wall of ice that blocks enemies and their shots, chilling anything that touches it.',
      cast(p, c) {
        const yaw = Math.atan2(c.flat.x, c.flat.z), px = Math.cos(yaw), pz = -Math.sin(yaw), solid = [];
        for (let i = -3; i <= 3; i++) solid.push({ x: c.tgt.x + px * i, z: c.tgt.z + pz * i, r: .6 });
        ent(p, c, c.tgt.x, c.tgt.z, { life: 7, yaw, solid, h: 3, r: 3.5 });
      },
      ent: { tick(n, dt) { if (pulse(n, dt, .5)) for (const e of enemiesNear(n.x, n.z, 4)) if (n.solid.some(q => Math.hypot(e.x - q.x, e.z - q.z) < q.r + ET[e.type].r * e.sc + .35)) hitEnemy(e, 'frost', 4 * n.mul, own(n), 0, 0, 0, { aoe: true }); } },
      view: { make(n) { const o = model('frost__wall', 0x4cc8ff, { shadow: true }); o.rotation.y = n.yaw; dustFx(n.x, n.z, 3, 0xcff4ff); sfx('frost_big'); return o; },
        upd(o, n) { o.position.y = -3 * (1 - easeOut(Math.min(1, n.t * 5))); if (n.l < .1) o.position.y = -3 * (1 - n.l * 10) ** 2; },
        drop(o, n) { burst(n.x, 1.2, n.z, 50, 0xbff4ff, 7, .3, .6, 8); addFx(o, .3, (o, k) => { o.position.y -= .1; fade(o, 1 - k); }); } } },
    { name: 'Frost Nova', icon: '💠', cd: 11, desc: 'Blast frost in every direction, freezing nearby enemies solid.',
      cast(p, c) { boomAt(c, p.x, .5, p.z, 6.5, 20 * c.dmg, { kb: 2, cc: ['freeze', 2] }, 'nova'); },
      fx: { nova(e) {
        ringFx(e.x, .1, e.z, e.r, 0x4cc8ff, .55); ringFx(e.x, .3, e.z, e.r * .7, 0xbff4ff, .4);
        for (let i = 0; i < 14; i++) { const a = TAU * i / 14; meshFx(T.spike, V(e.x + Math.cos(a) * e.r * .75, 0, e.z + Math.sin(a) * e.r * .75), .9, .5, .9); }
        burst(e.x, 1, e.z, 70, 0xaef0ff, 12, .3, .6); flash(e.x, 1, e.z, 0x4cc8ff, 40, .3); sfx('frost_big'); shake(.25);
      }, freeze(e) { burst(e.x, 1, e.z, 24, 0xcff4ff, 4, .25, .5, 3); sfx('tink'); } } },
    { name: 'Blizzard', icon: '🌨️', mode: 'aim', range: 22, aimR: 9, desc: 'ULTIMATE. Summon a raging blizzard. Hail pounds everything inside, freezing enemies over and over.',
      cast(p, c) { ent(p, c, c.tgt.x, c.tgt.z, { r: 9 * c.st.aoe, life: 7 }); },
      ent: { tick(n, dt) {
        for (const e of enemiesNear(n.x, n.z, n.r)) e.fs = Math.max(e.fs || 0, .3);
        if (pulse(n, dt, .5)) for (const e of enemiesNear(n.x, n.z, n.r)) hitEnemy(e, 'frost', 8 * n.mul, own(n), 0, 0, 0, { aoe: true });
      } },
      view: {
        make(n) { const g = new THREE.Group(); g.userData.mats = []; const cl = model('water__cloud', 0xbfe8ff); cl.scale.set(n.r / 1.6 * 1.2, .9, n.r / 1.6 * 1.2); cl.position.y = 10; g.add(cl); g.userData.mats.push(...cl.userData.mats); g.userData.cloud = cl;
          g.userData.circle = zoneCircle('frost', n.r, .55); g.add(g.userData.circle); sfx('frost_big'); return g; },
        upd(o, n, dt, t) {
          spinCircle(o.userData.circle, dt, .3); o.userData.cloud.rotation.y += dt * .3; fade(o.userData.cloud, Math.min(1, n.t * 2, n.l * 6) * .9);
          for (let k = 0; k < 9; k++) { const a = rand(0, TAU), d = Math.sqrt(Math.random()) * n.r; emit(n.x + Math.cos(a) * d, rand(2, 9), n.z + Math.sin(a) * d, rand(2, 4), -rand(6, 10), rand(-1, 1), 0xeaf8ff, rand(.08, .18), 1, 0, .2); }
          if (Math.random() < dt * 14) { const a = rand(0, TAU), d = Math.sqrt(Math.random()) * n.r, x = n.x + Math.cos(a) * d, z = n.z + Math.sin(a) * d, sh = T.shard.clone();
            sh.position.set(x + 2, 9, z); sh.lookAt(x, 0, z); addFx(sh, .45, (s, k) => { s.position.set(x + 2 * (1 - k), 9 * (1 - k), z); if (k > .97) { burst(x, .2, z, 8, 0xcff4ff, 3, .15, .3, 6); } }); }
        }, drop: dropFade() } },
  ],
},
// ================================================================== STORM
storm: {
  name: 'Storm', color: 0xb08cff, glyph: '⚡', adj: 'SHOCKED', react: { name: 'SURGE', kind: 'chain' },
  blurb: 'Speed and chaos. Lightning that leaps from foe to foe.',
  passive: 'Static: every 8th Storm hit calls down a free lightning strike. Shocked enemies take 15% more damage.',
  st: { vuln: .15 },
  onHit(e, p) { p.bd.static = (p.bd.static || 0) + 1; if (p.bd.static % 8 === 0 && !e.dead) { const q = center(e); ev({ k: 'bolt', el: 'storm', sky: 1, pts: [[q.x, q.y + 14, q.z], [q.x, q.y, q.z]].map(a => a.map(r2)) }); damage(e, 16 * stats(p).dmgMul, 'storm', p); } },
  moves: [
    { name: 'Chain Lightning', icon: '⚡', cd: .36, desc: 'An instant bolt that chains to 2 more enemies.',
      cast(p, c) { chainBolt(p, c, 6 * c.dmg, c.st.chain + (c.mega ? 3 : 0)); },
      fx: { det: e => boomFx(e.x, e.y, e.z, 2.5, 0xb08cff, .6), nova: e => boomFx(e.x, .5, e.z, 4.5, 0xb08cff, .8) } },
    { name: 'Ball Lightning', icon: '🔮', cd: 6, desc: 'A slow orb of lightning that zaps nearby enemies as it drifts, then bursts.',
      cast(p, c) { shoot(p, c, 9, { r: .7, life: 2.4, pierce: 99, dmg: 6 * c.dmg, kb: .5 }); },
      shot: {
        tick(s, dt) { if (!pulse(s, dt, .25, 'z')) return; const p = own(s); for (const e of enemiesNear(s.x, s.z, 6).slice(0, 2)) { const q = center(e); ev({ k: 'bolt', el: 'storm', pts: [[s.x, s.y, s.z], [q.x, q.y, q.z]].map(a => a.map(r2)), q: 1 }); hitEnemy(e, 'storm', 5 * s.mul, p, 0, 0, 0); } },
        ground(s) { s.vy = Math.abs(s.vy); },
        end(s) { boomAt(ctxS(s), s.x, s.y, s.z, 3, 20 * s.mul, { kb: 6 }); },
      },
      look: { m: 'storm__orb', spin: [2, 3, 1.5], trail: [0xd8c8ff, .2, .25, 0, 2], light: 8, flick: 1 },
      fx: { boom: e => { boomFx(e.x, e.y, e.z, e.r, 0xb08cff); boltFx([[e.x, e.y, e.z], [e.x + rand(-2, 2), e.y + 2, e.z + rand(-2, 2)]], 0xb08cff); } } },
    { name: 'Thunderclap', icon: '🌩️', cd: 7, mode: 'aim', range: 22, aimR: 3.5, desc: 'Mark a spot: a moment later a huge bolt slams it, stunning everything there, then jumps to up to 3 enemies nearby.',
      cast(p, c) {
        const t = c.tgt.clone(); fxe(c.m.key, 'mark', { x: t.x, z: t.z, r: 3.5 * c.st.aoe });
        later(.45, () => {
          boomAt(c, t.x, 0, t.z, 3.5, 38 * c.dmg, { kb: 6, cc: ['stun', .8] }, 'strike');
          enemiesNear(t.x, t.z, 8).slice(0, 3).forEach((e, i) => later(.15 + i * .12, () => { if (alive(e)) boomAt(c, e.x, 0, e.z, 1.6, 20 * c.dmg, { kb: 2 }, 'strike'); }));
        });
      },
      fx: { mark(e) { ringFx(e.x, .1, e.z, e.r, 0xb08cff, .5); burst(e.x, .2, e.z, 16, 0xc0a0ff, 3, .15, .5, 4); sfx('storm'); },
        strike(e) { skyFx(e.x, 0, e.z, 0xc0a0ff); ringFx(e.x, .1, e.z, e.r, 0xb08cff); sfx('storm_big'); shake(.12); } } },
    { name: 'Tesla Coil', icon: '🗼', cd: 13, mode: 'aim', range: 16, aimR: 9, desc: 'Plant a tesla coil that zaps up to 3 enemies every half second. Two of your coils within 12 m of each other link up with a crackling fence that shocks anything crossing it.',
      cast(p, c) { ent(p, c, c.tgt.x, c.tgt.z, { life: 9, r: 9, solid: [{ x: c.tgt.x, z: c.tgt.z, r: .6 }], h: 2.5 }); },
      ent: { tick(n, dt) {
        const mate = S.ents.find(m => m !== n && !m.dead && m.mv === n.mv && m.own === n.own && Math.hypot(m.x - n.x, m.z - n.z) < 12);
        n.s = mate ? mate.id : 0; // the view draws the fence to it
        if (mate && n.id < mate.id && pulse(n, dt, .3, 'f')) for (const e of nearSeg({ x: mate.x, z: mate.z, fx0: n.x, fz0: n.z }, .8)) hitEnemy(e, 'storm', 9 * n.mul, own(n), 0, 0, 0, { aoe: true });
        if (!pulse(n, dt, .45)) return;
        const e = nearest(n.x, n.z, n.r); if (!e) return;
        const hits = [e]; while (hits.length < 3) { const l = hits[hits.length - 1], x = nearest(l.x, l.z, 5, hits.map(h => h.id)); if (!x) break; hits.push(x); }
        ev({ k: 'bolt', el: 'storm', pts: [[n.x, 2.4, n.z], ...hits.map(h => { const q = center(h); return [q.x, q.y, q.z]; })].map(a => a.map(r2)), q: 1 });
        hits.forEach((h, i) => hitEnemy(h, 'storm', 10 * n.mul * (i ? .7 : 1), own(n), h.x - n.x, h.z - n.z, 1));
      } },
      view: { make(n) { const g = new THREE.Group(), m = model('storm__coil', 0xb08cff, { shadow: true }); g.add(m); g.userData.mats = m.userData.mats.slice(); g.userData.circle = zoneCircle('storm', 1.4, .8); g.add(g.userData.circle); dustFx(n.x, n.z, 1.5); return g; },
        upd(o, n, dt, t) { spinCircle(o.userData.circle, dt, 1); o.children[0].position.y = -2.5 * (1 - easeOut(Math.min(1, n.t * 4)));
          if (Math.random() < dt * 6) boltFx([[n.x, 2.4, n.z], [n.x + rand(-1, 1), 2.4 + rand(-.5, .8), n.z + rand(-1, 1)]], 0xd8c8ff); },
        drop: dropFade() } },
    { name: 'Thunderstorm', icon: '⛈️', desc: 'ULTIMATE. A storm cloud follows you, hurling a lightning bolt at a nearby enemy four times a second.',
      cast(p, c) { ent(p, c, p.x, p.z, { follow: 1, life: 5, r: 14 }); },
      ent: { tick(n, dt) {
        if (!pulse(n, dt, .24)) return;
        const es = enemiesNear(n.x, n.z, n.r); if (!es.length) return;
        const e = pick(es), q = center(e);
        ev({ k: 'bolt', el: 'storm', sky: 1, pts: [[q.x, q.y + 14, q.z], [q.x, q.y, q.z]].map(a => a.map(r2)) });
        blast(e.x, e.z, 1.6, 38 * n.mul, ctxN(n), { raw: true, kb: 1, cc: ['stun', .25] });
      } },
      view: { make() { const o = model('storm__cloud', 0xb08cff); o.scale.setScalar(1.6); return o; },
        upd(o, n, dt, t) { o.position.y = 9; o.rotation.y += dt * .4; fade(o, Math.min(1, n.t * 3, n.l * 5)); if (Math.random() < dt * 8) flash(n.x, 8, n.z, 0xb08cff, 25, .1);
          for (let k = 0; k < 4; k++) emit(n.x + rand(-6, 6), rand(4, 8), n.z + rand(-6, 6), 1, -14, 0, 0x9fb8ff, .06, .5, 0, 0); },
        drop: dropFade() } },
  ],
},
// ================================================================== WATER
water: {
  name: 'Water', color: 0x2a7dff, glyph: '🌊', adj: 'SOAKED', react: { name: 'TORRENT', kind: 'pull' },
  blurb: 'Push and pull. Wash enemies off the island, trap them, and surf straight through the crowd.',
  passive: 'Tidal Force: your knockback is 40% stronger. Soaked enemies fly even further.',
  st: { kb: 1.6 },
  moves: [
    { name: 'Aqua Bullets', icon: '💧', cd: .14, desc: 'Rapid-fire water bullets with heavy knockback.',
      cast(p, c) { for (let k = 0; k < c.multi; k++) shoot(p, c, 38, { d: spread(c.d.clone().add(V(rand(-.02, .02), rand(-.02, .02), rand(-.02, .02))).normalize(), k, c.multi, .07), r: .25, dmg: 10.5 * c.dmg, kb: 4.5, sc: c.mega ? 2 : 1 }); },
      look: { m: 'water__drop', trail: [0x7fc8ff, .14, .3, 3, 1], light: 3 },
      fx: { det: e => boomFx(e.x, e.y, e.z, 2.5, 0x2a7dff, .6), nova: e => boomFx(e.x, .5, e.z, 4.5, 0x2a7dff, .8) } },
    { name: 'Water Whip', icon: '🪢', cd: 3.5, desc: 'Crack a 10 m whip of water straight ahead. Everything along it is dragged toward you, and the tip cracks for double damage and a 0.5 s stun.',
      cast(p, c) { later(.12, () => { // lands as the lash snaps straight
        if (p.down) return; const f = flatAim(p);
        for (const { e, t } of rayHits(V(p.x, p.y + 1, p.z), f, 10, 1.1)) {
          const tip = t > 7.5, q = center(e);
          hitEnemy(e, 'water', (tip ? 44 : 22) * c.dmg, p, 0, 0, 0, { src: p });
          if (tip) { cc(e, 'stun', .5, p); fxe(c.m.key, 'crack', { x: r2(q.x), y: r2(q.y), z: r2(q.z) }); }
          if (!ET[e.type].boss) { e.kx = (p.x + f.x * 2.2 - e.x) * 5; e.kz = (p.z + f.z * 2.2 - e.z) * 5; } // dragged right in front of you
        }
      }); },
      fx: { cast(e) { // a chain of water that unfurls from your hand in a travelling wave, snaps straight, then recoils
          const yaw = Math.atan2(e.d[0], e.d[2]), f = V(Math.sin(yaw), 0, Math.cos(yaw)), sd = V(f.z, 0, -f.x), N = 20, L = 10;
          const g = new THREE.Group(); g.userData.mats = [];
          const segs = Array.from({ length: N }, (_, i) => { const o = model('water__drop', 0x4aa0ff); o.scale.setScalar(.55 - .3 * i / N); g.add(o); g.userData.mats.push(...o.userData.mats); return o; });
          const pt = (s, k, h) => { const ext = k < .3 ? easeOut(k / .3) : 1 - easeOut((k - .3) / .7) * .95, w = Math.sin(s * Math.PI * 2.5 - k * 20) * .7 * s * (1 - s * .5) * (k < .3 ? 1 - k / .3 : (k - .3) * 1.5);
            return h.clone().addScaledVector(f, .6 + (L - .6) * s * ext).addScaledVector(sd, w).setY(h.y + (e.y + 1.1 - h.y) * s + Math.sin(s * Math.PI) * .5 * ext); };
          addFx(g, .45, (o, k) => {
            const h = handPos(e.id);
            segs.forEach((m, i) => { const s = i / (N - 1); m.position.copy(pt(s, k, h)); m.lookAt(pt(Math.min(1, s + .05), k, h)); });
            if (k > .27 && !o.userData.cr) { o.userData.cr = 1; const q = segs[N - 1].position; ringFx(q.x, q.y, q.z, 1.2, 0xbfe8ff, .25); burst(q.x, q.y, q.z, 24, 0x9fd8ff, 9, .15, .35, 8); flash(q.x, q.y, q.z, 0x9fd8ff, 20, .12); sfx('water_big'); }
            if (Math.random() < .7) { const q = segs[(Math.random() * N) | 0].position; emit(q.x, q.y, q.z, rand(-1, 1), rand(-1, 1), rand(-1, 1), 0x9fd8ff, rand(.08, .16), .35, 8); }
            fade(o, k < .8 ? 1 : (1 - k) * 5);
          });
        },
        crack(e) { burst(e.x, e.y, e.z, 30, 0xbfe8ff, 8, .18, .4, 8); ringFx(e.x, e.y, e.z, 1.6, 0xffffff, .2); popNum(e.x, e.y + 1.2, e.z, 'CRACK', '#9fd8ff', 'tag'); } } },
    { name: 'Bubble Prison', icon: '🫧', cd: 9, desc: 'Trap an enemy in a floating bubble. It is helpless and takes 30% more damage.',
      cast(p, c) { shoot(p, c, 26, { r: .5, life: 1.5, dmg: 10 * c.dmg }); },
      shot: { hit(s, e) { const p = own(s); hitEnemy(e, 'water', s.dmg, p, 0, 0, 0); if (!cc(e, 'bubble', 3, p)) damage(e, 30 * s.mul, 'water', p); return 'end'; } },
      look: { m: 'gen__orb', s: .45, trail: [0xbfe8ff, .15, .3, 0, 1], light: 4 },
      fx: { pop(e) { burst(e.x, e.y, e.z, 30, 0xbfe8ff, 6, .25, .4, 6); sfx('tink'); } } },
    { name: 'Surf', icon: '🏄', cd: 9, desc: 'Ride a wave 14 m forward. Every enemy in your way is hit for 24, soaked and thrown aside, clearing a lane through the crowd.',
      self(p) { const f = flatAim(p); p.mo = { t: 0, T: .55, vx: f.x * 26, vz: f.z * 26, trail: 0x7fc8ff }; },
      cast(p, c) { ent(p, c, p.x, p.z, { follow: 1, life: .6, r: 2.6, dx: c.flat.x, dz: c.flat.z, yaw: Math.atan2(c.flat.x, c.flat.z) }); },
      ent: { tick(n) { // shoved out to whichever side of the wave they were on
        for (const e of enemiesNear(n.x, n.z, n.r)) if (ready(n, e, 99)) { const side = Math.sign((e.x - n.x) * n.dz - (e.z - n.z) * n.dx) || 1; hitEnemy(e, 'water', 24 * n.mul, own(n), n.dz * side + n.dx * .3, -n.dx * side + n.dz * .3, 8, { aoe: true }); }
      } },
      view: { make() { const o = model('water__wave', 0x4aa0ff); o.scale.setScalar(.45); sfx('water_big'); return o; },
        upd(o, n) { o.rotation.y = n.yaw; o.position.y = n.y - .2; fade(o, Math.min(1, n.l * 4) * (n.own === myId ? .35 : .8));
          for (let k = 0; k < 6; k++) { const s = k % 2 ? 1 : -1, sx = Math.cos(n.yaw) * s, sz = -Math.sin(n.yaw) * s; emit(n.x + sx * rand(.5, 1.8), n.y + rand(.1, 1.2), n.z + sz * rand(.5, 1.8), sx * rand(4, 9), rand(2, 6), sz * rand(4, 9), Math.random() < .5 ? 0x9fd8ff : 0xffffff, rand(.1, .22), .5, 12); } },
        drop: dropFade(.3) } },
    { name: 'Tsunami', icon: '🌊', desc: 'ULTIMATE. Unleash a towering wave that sweeps across the island, carrying enemies with it, often right off the edge.',
      cast(p, c) { const f = c.flat; ent(p, c, p.x + f.x * 1.5, p.z + f.z * 1.5, { life: 2.6, dx: f.x, dz: f.z, w: 9, yaw: Math.atan2(f.x, f.z), r: 7 }); },
      ent: {
        tick(n, dt) {
          n.x += n.dx * 11 * dt; n.z += n.dz * 11 * dt;
          for (const e of S.enemies) {
            if (!alive(e)) continue;
            const rx = e.x - n.x, rz = e.z - n.z, along = rx * n.dx + rz * n.dz, lat = Math.abs(rx * n.dz - rz * n.dx);
            if (along > -2 && along < 1.4 && lat < n.w) {
              e.x += n.dx * 11 * dt * ET[e.type].kb ** .3; e.z += n.dz * 11 * dt * ET[e.type].kb ** .3; e.atk = null;
              if (ready(n, e, 99)) hitEnemy(e, 'water', 110 * n.mul, own(n), n.dx, n.dz, 2, { aoe: true });
            }
          }
          for (const s of S.shots) if (s.foe && Math.abs((s.x - n.x) * n.dz - (s.z - n.z) * n.dx) < n.w && Math.abs((s.x - n.x) * n.dx + (s.z - n.z) * n.dz) < 2) s.dead = true;
        },
        end(n) { for (const e of S.enemies) if (alive(e) && n.hit[e.id]) { e.kx += n.dx * 14 * ET[e.type].kb; e.kz += n.dz * 14 * ET[e.type].kb; } },
      },
      view: { make(n) { const o = model('water__wave', 0x3a8aff), wm = waveMat(); o.traverse(m => { if (m.isMesh) m.material = wm; }); o.userData.mats = [wm]; o.rotation.y = n.yaw; o.scale.set(n.r * 2, 3.8, 3.2); sfx('water_big'); shake(.3); return o; },
        upd(o, n, dt) { o.position.y = -1 + Math.min(1, n.t * 3); fade(o, Math.min(1, n.l * 5)); const s = Math.sin(n.yaw), cz = Math.cos(n.yaw);
          for (let k = 0; k < 10; k++) { const l = rand(-n.r, n.r); emit(n.x + cz * l + s * .5, rand(2.5, 4.2), n.z - s * l + cz * .5, s * rand(2, 6), rand(1, 4), cz * rand(2, 6), Math.random() < .5 ? 0xe0f4ff : 0x6ab0ff, rand(.25, .5), .6, 9); } },
        drop: dropFade(.3) } },
  ],
},
// ================================================================== EARTH
earth: {
  name: 'Earth', color: 0xd9913a, glyph: '🪨', adj: 'CRACKED', react: { name: 'QUAKE', kind: 'launch' }, poise: 2,
  blurb: 'Heavy and unstoppable. Launch enemies into the air and stagger even the biggest brutes.',
  passive: 'Bedrock: you take 15% less damage, and your hits stagger enemies twice as fast.',
  st: { vuln: .1 },
  moves: [
    { name: 'Stone Shot', icon: '🪨', cd: .7, desc: 'A shotgun blast of stone pebbles. Devastating up close.',
      cast(p, c) { const n = 5 + 2 * (c.multi - 1); for (let k = 0; k < n; k++) shoot(p, c, 36, { d: c.d.clone().applyAxisAngle(UP, rand(-.13, .13)).add(V(0, rand(-.06, .06), 0)).normalize(), life: .5, r: .22, dmg: 10 * c.dmg, kb: 2.2, sc: c.mega ? 1.8 : 1 }); },
      look: { m: 'earth__pebble', spin: [9, 6, 0], trail: [0xc8a070, .12, .2, 2, 1] },
      fx: { det: e => { boomFx(e.x, e.y, e.z, 2.5, 0xd9913a, .6); dustFx(e.x, e.z, 2.5); }, nova: e => { boomFx(e.x, .5, e.z, 4.5, 0xd9913a, .8); dustFx(e.x, e.z, 4); } } },
    { name: 'Boulder', icon: '🌑', cd: 5, desc: 'Roll a huge boulder that plows straight through every enemy in its path.',
      cast(p, c) { const f = c.flat; shoot(p, c, 14, { o: V(p.x + f.x * 1.3, 1.1, p.z + f.z * 1.3), d: f, r: 1.1, life: 2.8, pierce: 99, dmg: 38 * c.dmg, kb: 9, sc: 1.1, poise: 2 }); },
      shot: { ground(s) { s.vy = 0; s.y = 1.1; }, end(s) { boomAt(ctxS(s), s.x, .5, s.z, 2.5, 20 * s.mul, { kb: 6 }); } },
      look: { m: 'earth__boulder', s: 1.1, roll: 1, dust: 0x8a7a62 },
      fx: { boom(e) { boomFx(e.x, e.y, e.z, e.r, 0xd9913a, .7); dustFx(e.x, e.z, e.r); debrisFx(e.x, .8, e.z, 9, 'earth__pebble', 0xd9913a, .45, 9); } } },
    { name: 'Stone Pillar', icon: '🗿', cd: 9, mode: 'aim', range: 16, aimR: 2.2, desc: 'Erupt a stone pillar that launches enemies skyward. Aim at your own feet to ride it up.',
      self(p, c) { if (Math.hypot(c.tgt.x - p.x, c.tgt.z - p.z) < 2.2) { p.vy = 16; p.y = Math.max(p.y, .1); } },
      cast(p, c) { const t = c.tgt; boomAt(c, t.x, 0, t.z, 2.4, 26 * c.dmg, { lift: 12, kb: 3 }, 'rise'); ent(p, c, t.x, t.z, { life: 6, r: 1.2, solid: [{ x: t.x, z: t.z, r: 1.1 }], h: 3.2 }); },
      view: { make(n) { const o = model('earth__pillar', 0xd9913a, { shadow: true }); o.rotation.y = rand(0, TAU); debrisFx(n.x, .5, n.z, 7, 'earth__pebble', 0xd9913a, .35, 9); return o; },
        upd(o, n) { o.position.y = -3.5 * (1 - easeOutBack(Math.min(1, n.t * 6))); if (n.l < .08) o.position.y = -3.5 * (1 - n.l / .08); },
        drop(o, n) { dustFx(n.x, n.z, 1.5); addFx(o, .3, (o, k) => { o.position.y = -3.5 * k; }); } },
      fx: { rise(e) { dustFx(e.x, e.z, e.r); ringFx(e.x, .1, e.z, e.r * 1.4, 0xd9913a); sfx('earth_big'); shake(.2); } } },
    { name: 'Fissure', icon: '⛰️', cd: 10, desc: 'Split the ground in a line ahead of you. Spikes burst up one after another, launching enemies.',
      cast(p, c) {
        const f = c.flat, hit = [];
        for (let i = 0; i < 12; i++) {
          const q = clampArena(V(p.x + f.x * (3 + i * 1.25), 0, p.z + f.z * (3 + i * 1.25)), .8);
          later(i * .045, () => { const h = boomAt(c, q.x, 0, q.z, 1.6, 28 * c.dmg, { lift: 9, kb: 2, skip: hit, poise: 2, raw: true }, 'spike'); hit.push(...h.map(e => e.id)); });
        }
      },
      fx: { spike(e) { riseFx('earth__spike', 0xd9913a, e.x, e.z, rand(.9, 1.3), 1.1); dustFx(e.x, e.z, 1.2); debrisFx(e.x, .3, e.z, 2, 'earth__pebble', 0xd9913a, .25, 6); scarFx(e.x, e.z, 1.1, 0xd9913a, 1.6); if (Math.random() < .5) sfx('earth'); shake(.06); } } },
    { name: 'Tectonic Quake', icon: '🌋', desc: 'ULTIMATE. Shake the island with four quakes that stun every grounded enemy nearby.',
      cast(p, c) { for (let i = 0; i < 4; i++) later(i * .8, () => { if (!p.down) boomAt(c, p.x, 0, p.z, 12, 40 * c.dmg, { ground: true, cc: ['stun', 1.2], lift: 5, kb: 3 }, 'quake'); }); },
      fx: { quake(e) {
        ringFx(e.x, .1, e.z, e.r, 0xd9913a, .8, 1); ringFx(e.x, .2, e.z, e.r * .6, 0xffd08a, .6);
        for (let i = 0; i < 16; i++) { const a = rand(0, TAU), d = rand(2, e.r); riseFx('earth__spike', 0xd9913a, e.x + Math.cos(a) * d, e.z + Math.sin(a) * d, rand(.5, 1), .9); }
        dustFx(e.x, e.z, e.r * .6); debrisFx(e.x, .5, e.z, 10, 'earth__pebble', 0xd9913a, .4, 11); shake(.6); sfx('earth_big'); sfx('smash');
      } } },
  ],
},
// ================================================================== WIND
wind: {
  name: 'Wind', color: 0x9dffd6, glyph: '🌪️', adj: 'WINDSWEPT', react: { name: 'CYCLONE', kind: 'launch' },
  blurb: 'Mobility and crowd control. Fly over the fight and hurl enemies off the edge.',
  passive: 'Tailwind: move 15% faster and double jump.',
  st: { kb: 1.4 },
  moves: [
    { name: 'Wind Blades', icon: '🌀', cd: .42, desc: 'Wide crescent blades of air that slice through every enemy in a line.',
      cast(p, c) { for (let k = 0; k < c.multi; k++) shoot(p, c, 34, { d: spread(c.d, k, c.multi, .12), life: .75, r: .9, pierce: 99, dmg: 17 * c.dmg, kb: 3, sc: c.mega ? 1.8 : 1 }); },
      look: { m: 'wind__blade', trail: [0xd0fff0, .2, .2, 0, 2] },
      fx: { det: e => boomFx(e.x, e.y, e.z, 2.5, 0x9dffd6, .6), nova: e => boomFx(e.x, .5, e.z, 4.5, 0x9dffd6, .8) } },
    { name: 'Gale Force', icon: '🍃', cd: 5, desc: 'A massive gust that hurls enemies away and blows enemy shots out of the air. Great for ring-outs.',
      cast(p, c) {
        for (const e of coneHits(p, 10, 70)) { hitEnemy(e, 'wind', 16 * c.dmg, p, e.x - p.x, e.z - p.z, 22, { src: p }); launch(e, 4); }
        const f = c.flat; for (const s of S.shots) if (s.foe) { const dx = s.x - p.x, dz = s.z - p.z, d = Math.hypot(dx, dz); if (d < 11 && (dx * f.x + dz * f.z) / d > .6) s.dead = true; }
      },
      fx: { cast(e) {
        const o = model('gen__cone', 0xbfffe8), a = V(...e.o), d = V(...e.d);
        o.position.copy(a); o.lookAt(a.clone().add(d)); addFx(o, .35, (o, k) => { o.scale.set(6 * easeOut(k) + .5, 6 * easeOut(k) + .5, 10 * easeOut(k) + .5); fade(o, (1 - k) * .6); o.rotation.z += .2; });
        for (let i = 0; i < 40; i++) { const s = rand(14, 24); emit(a.x, a.y, a.z, d.x * s + rand(-4, 4), d.y * s + rand(-2, 3), d.z * s + rand(-4, 4), 0xe0fff4, rand(.15, .3), .45, 0, 2); }
      } } },
    { name: 'Updraft', icon: '🪶', cd: 7, desc: 'Launch yourself high into the air (and nearby enemies with you). Hold Space to glide.',
      self(p) { p.vy = 15; p.y = Math.max(p.y, .05); p.bf.glide = 3.5; },
      cast(p, c) { buff(p, 'glide', 3.5); boomAt(c, p.x, .2, p.z, 3.5, 15 * c.dmg, { lift: 10, kb: 2 }, 'gust'); },
      fx: { gust(e) { ringFx(e.x, .1, e.z, e.r, 0x9dffd6); modelFx('wind__ring', 0xbfffe8, V(e.x, .5, e.z), .6, (o, k) => { o.position.y = .5 + k * 6; o.scale.setScalar(2 + k * 2); o.rotation.y += .3; fade(o, 1 - k); }); burst(e.x, .5, e.z, 30, 0xe0fff4, 6, .2, .5, -4); sfx('wind_big'); } } },
    { name: 'Tornado', icon: '🌪️', cd: 12, desc: 'Send out a tornado that sucks enemies in, spins them around, then flings them away.',
      cast(p, c) { const f = c.flat; ent(p, c, p.x + f.x * 2, p.z + f.z * 2, { life: 4.5, r: 2.8, dx: f.x, dz: f.z }); },
      ent: {
        tick(n, dt) {
          n.x += n.dx * 6 * dt; n.z += n.dz * 6 * dt;
          const q = clampArena({ x: n.x, z: n.z }, 1); n.x = q.x; n.z = q.z;
          for (const e of enemiesNear(n.x, n.z, n.r + 1.5)) {
            if (ET[e.type].boss) { if (ready(n, e, .25)) hitEnemy(e, 'wind', 6 * n.mul, own(n), 0, 0, 0, { aoe: true }); continue; }
            const a = Math.atan2(e.z - n.z, e.x - n.x) + dt * 5, d = Math.max(.8, Math.hypot(e.x - n.x, e.z - n.z) - dt * 4);
            e.x = n.x + Math.cos(a) * d; e.z = n.z + Math.sin(a) * d; e.y = 1.2 + .6 * Math.sin(n.t * 6 + e.id); e.vy = 0; e.kx = e.kz = 0; e.atk = null;
            n.caught ??= {}; n.caught[e.id] = 1;
            if (ready(n, e, .25)) hitEnemy(e, 'wind', 6 * n.mul, own(n), 0, 0, 0, { aoe: true });
          }
        },
        end(n) { for (const e of S.enemies) if (alive(e) && n.caught?.[e.id]) { push(e, n.x, n.z, 15); launch(e, 7); } },
      },
      view: { make() { const o = model('wind__tornado', 0x7affc8); o.scale.setScalar(.75); sfx('wind_big'); return o; },
        upd(o, n, dt) { o.rotation.y += dt * 9; o.scale.y = .75 * Math.min(1, n.t * 4); fade(o, Math.min(1, n.l * 5) * .5);
          for (let k = 0; k < 4; k++) { const a = rand(0, TAU), h = rand(0, 4.5), rr = .4 + h * .45; emit(n.x + Math.cos(a) * rr, h, n.z + Math.sin(a) * rr, -Math.sin(a) * 8, rand(1, 4), Math.cos(a) * 8, Math.random() < .3 ? 0x9a8a78 : 0xe0fff4, rand(.15, .35), .4, 0, 1); } },
        drop: dropFade(.3) } },
    { name: 'Downburst', icon: '🌪️', desc: 'ULTIMATE. Rip every enemy within 15 m (up to 12) into the sky. For 2 s they are carried through the air toward wherever you aim, then hurled down together for 120 damage and a 1.2 s stun to everything within 5 m of the landing. Aim at the edge for ring-outs.',
      cast(p, c) {
        const es = enemiesNear(p.x, p.z, 15 * c.st.aoe).filter(e => !ET[e.type].boss && !e.pid).slice(0, 12), q = groundAt(p, 30);
        for (const e of es) cc(e, 'lift', 3, p);
        ent(p, c, q.x, q.z, { life: 2, r: 5 * c.st.aoe, s: es.map(e => e.id) });
      },
      ent: { tick(n, dt) {
          const p = own(n); if (p && !p.down) { const q = groundAt(p, 30); n.x = q.x; n.z = q.z; }
          for (const id of n.s) { const e = S.enemies.find(x => x.id === id && alive(x)); if (!e) continue; const dx = n.x - e.x, dz = n.z - e.z, d = Math.hypot(dx, dz), st = Math.min(d, 16 * dt); if (d > .5) { e.x += dx / d * st; e.z += dz / d * st; } }
        },
        end(n) {
          for (const id of n.s) { const e = S.enemies.find(x => x.id === id && alive(x)); if (e?.cc?.type === 'lift') { ccEnd(e); e.vy = -40; } }
          later(.15, () => boomAt(ctxN(n), n.x, .2, n.z, n.r, 120 * n.mul, { cc: ['stun', 1.2], kb: 6, raw: true }, 'slam'));
        } },
      // a swirling column over the landing spot, and streaks of wind on every victim
      view: { make(n) { const g = new THREE.Group(); g.userData.mats = []; for (const [y, s] of [[.2, n.r], [3, n.r * .7], [6, n.r * .45]]) { const r = model('wind__ring', 0xbfffe8, { flat: true }); r.position.y = y; r.scale.setScalar(s); g.add(r); g.userData.mats.push(...r.userData.mats); } sfx('ult'); sfx('wind_big'); return g; },
        upd(o, n, dt) { o.children.forEach((r, i) => r.rotation.y += dt * (5 + i * 3) * (i % 2 ? -1 : 1)); fade(o, Math.min(1, n.t * 3, n.l * 6) * .45);
          for (const id of n.s || []) { const v = views.e.get(id); if (v && Math.random() < .6) { const q = v.g.position; emit(q.x + rand(-.6, .6), q.y + rand(.2, 1.8), q.z + rand(-.6, .6), rand(-3, 3), rand(-2, 2), rand(-3, 3), 0xe0fff4, rand(.08, .16), .35, 0, 1); } }
          for (let k = 0; k < 3; k++) { const a = rand(0, TAU), rr = rand(.5, n.r); emit(n.x + Math.cos(a) * rr, rand(.2, 7), n.z + Math.sin(a) * rr, -Math.sin(a) * 9, -rand(1, 4), Math.cos(a) * 9, 0xbff8e4, rand(.06, .14), .4, 0, 1); } },
        drop: dropFade(.2) },
      fx: { slam(e) { boomFx(e.x, .3, e.z, e.r, 0x9dffd6, 1.2); dustFx(e.x, e.z, e.r * .7); ringFx(e.x, .1, e.z, e.r * 1.4, 0xe0fff4, .5, 1); shake(.5); sfx('smash'); } } },
  ],
},
// ================================================================== NATURE
nature: {
  name: 'Nature', color: 0x4ee04a, glyph: '🌿', adj: 'ENTANGLED', react: { name: 'BLOOM', kind: 'heal' },
  blurb: 'Patient and resilient. Root enemies in place, plant guardians and seeds that grow inside your foes.',
  passive: 'Regrowth: regenerate 1.5 HP per second.',
  st: { slow: .3 },
  moves: [
    { name: 'Thorn Volley', icon: '🌵', cd: .5, desc: 'Fire a quick burst of three barbed thorns. They stick in the enemy, and every 6th thorn in the same enemy makes them all burst out for 12.',
      cast(p, c) { for (let i = 0; i < 3; i++) later(i * .07, () => { if (p.down) return; const c2 = ctxOf(p, c.m); for (let k = 0; k < c.multi; k++) shoot(p, c2, 42, { d: spread(c2.d, k, c.multi, .08), r: .25, dmg: 10 * c.dmg, kb: 1.2, sc: c.mega ? 1.8 : 1 }); }); },
      shot: { hit(s, e, hd) { const p = own(s); hitEnemy(e, 'nature', s.dmg, p, s.vx, s.vz, s.kb, { crit: hd ? 1.5 : 1, src: { x: s.x - s.vx, z: s.z - s.vz } });
        if (!e.dead && (e.th = (e.th || 0) + 1) >= 6) { e.th = 0; const q = center(e); fxe(s.mv, 'thorns', { x: q.x, y: q.y, z: q.z }); damage(e, 12 * s.mul, 'nature', p); } } },
      look: { m: 'nature__thorn', trail: [0x9aff80, .12, .25, 0, 1] },
      fx: { thorns(e) { debrisFx(e.x, e.y, e.z, 8, 'nature__thorn', 0x4ee04a, .25, 9); burst(e.x, e.y, e.z, 20, 0x9aff80, 6, .15, .35); sfx('nature'); },
        det: e => boomFx(e.x, e.y, e.z, 2.5, 0x4ee04a, .6), nova: e => boomFx(e.x, .5, e.z, 4.5, 0x4ee04a, .8) } },
    { name: 'Entangle', icon: '🪴', cd: 6, mode: 'aim', range: 20, aimR: 4, desc: 'Roots burst from the ground and hold every enemy in the area in place. As long as they have something to hold, the roots keep spreading: 1 m wider every second, up to 7 m, catching anyone nearby.',
      cast(p, c) { ent(p, c, c.tgt.x, c.tgt.z, { r: 4 * c.st.aoe, life: 3.5 }); },
      ent: { tick(n, dt) {
        if (pulse(n, dt, 1, 'g') && n.r < 7 && enemiesNear(n.x, n.z, n.r).some(e => e.cc?.type === 'root')) n.r = Math.min(7, n.r + 1); // fed by what they hold
        for (const e of enemiesNear(n.x, n.z, n.r)) if (ready(n, e, 99)) cc(e, 'root', 2.6, own(n));
        if (pulse(n, dt, .5)) for (const e of enemiesNear(n.x, n.z, n.r)) hitEnemy(e, 'nature', 6 * n.mul, own(n), 0, 0, 0, { aoe: true });
      } },
      view: { make(n) { const g = new THREE.Group(), r = model('nature__roots', 0x4ee04a, { shadow: true }); r.scale.setScalar(n.r / 1.5); g.add(r); g.userData.mats = r.userData.mats.slice(); g.userData.circle = zoneCircle('nature', n.r, .6); g.add(g.userData.circle); dustFx(n.x, n.z, n.r, 0x5a4a30); sfx('nature_big'); return g; },
        upd(o, n, dt) { const r = o.children[0], c = o.userData.circle, s = c.scale.x + (n.r - c.scale.x) * Math.min(1, dt * 5); c.scale.setScalar(s); r.scale.setScalar(s / 1.5); r.position.y = -1.2 * (1 - easeOut(Math.min(1, n.t * 5))); spinCircle(c, dt, .4);
          if (Math.random() < .3) { const a = rand(0, TAU); emit(n.x + Math.cos(a) * s, .1, n.z + Math.sin(a) * s, 0, rand(.5, 1.5), 0, 0x6ef04a, rand(.1, .2), .5); } }, drop: dropFade() } },
    { name: 'Parasite Seed', icon: '🌱', cd: 11, desc: 'Shoot a seed into an enemy. It grows inside it for 3 s, slowing it more and more, then bursts into vines that root it and up to 3 enemies near it for 2 s, 30 damage each.',
      cast(p, c) { shoot(p, c, 40, { r: .3, life: 1, dmg: 8 * c.dmg }); },
      shot: { hit(s, e) { const c = ctxS(s); hitEnemy(e, 'nature', s.dmg, c.p, 0, 0, 0); if (c.p) ent(c.p, c, e.x, e.z, { life: 3, r: 6, s: e.id }); return 'end'; } },
      look: { m: 'nature__thorn', s: .8, trail: [0x9aff80, .1, .25, 0, 1] },
      ent: { tick(n) { const e = S.enemies.find(x => x.id === n.s && alive(x)); if (!e) { n.life = 0; return; } n.x = e.x; n.z = e.z; e.fs = Math.max(e.fs || 0, .2 + .6 * n.t / n.max); },
        end(n) { // bursts early if the host dies first
          const c = ctxN(n), es = [S.enemies.find(x => x.id === n.s && alive(x)), ...enemiesNear(n.x, n.z, n.r).filter(x => x.id !== n.s).slice(0, 3)].filter(Boolean);
          fxe(n.mv, 'sprout', { x: n.x, z: n.z, to: es.map(e => [r2(e.x), r2(e.z)]) });
          for (const e of es) { hitEnemy(e, 'nature', 30 * n.mul, c.p, 0, 0, 0, { aoe: true }); cc(e, 'root', 2, c.p); }
        } },
      // a flower grows out of the host's head, getting bigger until it bursts
      view: { make() { const o = model('nature__flower', 0x4ee04a); o.scale.setScalar(.2); return o; },
        upd(o, n, dt) { const v = views.e.get(n.s); if (v) o.position.copy(v.g.position).add(V(0, 1.9, 0)); o.scale.setScalar(.25 + 1.1 * (1 - n.l)); o.rotation.y += dt * 2;
          if (Math.random() < .3) emit(o.position.x, o.position.y, o.position.z, rand(-1, 1), rand(0, 1), rand(-1, 1), 0x9aff80, .1, .4); },
        drop: o => o.removeFromParent() },
      fx: { sprout(e) { for (const [x, z] of e.to) { beamFx(V(e.x, 1.4, e.z), V(x, .4, z), 0x6ef04a, .1, .5); riseFx('nature__roots', 0x4ee04a, x, z, 1, 2); } burst(e.x, 1.6, e.z, 40, 0x9aff80, 6, .3, .5); sfx('nature_big'); } } },
    { name: 'Snaptrap', icon: '🪤', cd: 14, mode: 'aim', range: 14, aimR: 4.5, desc: 'Plant a carnivorous flytrap that chomps the nearest enemy for huge damage and pins it. Small monsters (not elites or bosses) are swallowed whole.',
      cast(p, c) { ent(p, c, c.tgt.x, c.tgt.z, { life: 12, r: 4.5, solid: [{ x: c.tgt.x, z: c.tgt.z, r: .5 }], h: 2 }); },
      ent: { tick(n, dt) {
        const e = nearest(n.x, n.z, n.r);
        if (e) n.yaw = Math.atan2(e.x - n.x, e.z - n.z);
        if (e && pulse(n, dt, 1.1)) {
          n.s++;
          if (!ET[e.type].boss && !e.elite && !e.pid && ET[e.type].r * e.sc < .75) { const q = center(e); fxe(n.mv, 'gulp', { x: q.x, y: q.y, z: q.z }); damage(e, e.hp + 1, 'nature', own(n), { raw: true }); } // one bite
          else { hitEnemy(e, 'nature', 45 * n.mul, own(n), n.x - e.x, n.z - e.z, 5); cc(e, 'root', 1, own(n)); }
        }
      } },
      view: { make(n) { const g = new THREE.Group(), m = model('nature__trap', 0x4ee04a, { shadow: true }); g.add(m); g.userData.mats = m.userData.mats.slice(); g.userData.jU = m.getObjectByName('nature__trap_jawU'); g.userData.jL = m.getObjectByName('nature__trap_jawL'); g.userData.bite = 0; g.userData.s = n.s; dustFx(n.x, n.z, 1.2, 0x5a4a30); return g; },
        upd(o, n, dt, t) {
          const m = o.children[0], u = o.userData; m.scale.setScalar(easeOutBack(Math.min(1, n.t * 3)));
          m.rotation.y = lerpAngle(m.rotation.y, n.yaw || 0, Math.min(1, dt * 6));
          if (n.s !== u.s) { u.s = n.s; u.bite = 1; sfx('nature'); burst(n.x + Math.sin(n.yaw) * 1.5, 1.3, n.z + Math.cos(n.yaw) * 1.5, 16, 0x9aff80, 5, .2, .4, 4); }
          u.bite = Math.max(0, u.bite - dt * 4);
          const open = u.bite > 0 ? (u.bite > .7 ? 1 : 0) : .55 + .1 * Math.sin(t * 3);
          if (u.jU) u.jU.rotation.x = -open * .9; if (u.jL) u.jL.rotation.x = open * .5;
        }, drop: dropFade() } },
    { name: 'World Tree', icon: '🌳', mode: 'aim', range: 18, aimR: 10, desc: 'ULTIMATE. Grow a great tree that roots every enemy around it and lashes them with vines.',
      cast(p, c) { const t = c.tgt, r = 10 * c.st.aoe; ent(p, c, t.x, t.z, { life: 9, r, solid: [{ x: t.x, z: t.z, r: 1.3 }], h: 8 }); blast(t.x, t.z, r, 40 * c.dmg, c, { raw: true, kb: 0, cc: ['root', 3] }); },
      ent: { tick(n, dt) {
        if (pulse(n, dt, .4, 'v')) { const es = enemiesNear(n.x, n.z, n.r); if (es.length) { const e = pick(es), q = center(e); fxe(n.mv, 'vine', { x: n.x, z: n.z, ex: q.x, ey: q.y, ez: q.z }); hitEnemy(e, 'nature', 25 * n.mul, own(n), e.x - n.x, e.z - n.z, 3, { aoe: true }); } }
      } },
      view: { make(n) { const g = new THREE.Group(), m = model('nature__tree', 0x4ee04a, { shadow: true }); g.add(m); g.userData.mats = m.userData.mats.slice(); g.userData.circle = zoneCircle('nature', n.r, .55); g.add(g.userData.circle); dustFx(n.x, n.z, 3, 0x5a4a30); sfx('ult'); shake(.3); return g; },
        upd(o, n, dt) { const m = o.children[0]; m.scale.setScalar(.15 + .85 * easeOutBack(Math.min(1, n.t * 1.2))); m.rotation.y += dt * .05; spinCircle(o.userData.circle, dt, .2);
          if (Math.random() < .5) emit(n.x + rand(-4, 4), rand(4, 8), n.z + rand(-4, 4), rand(-.5, .5), -1, rand(-.5, .5), Math.random() < .5 ? 0x9aff80 : 0xffe080, rand(.12, .25), 2.5, .2, .3); },
        drop(o) { addFx(o, .8, (o, k) => { o.children[0].scale.setScalar(1 - k * .9); fade(o, 1 - k); }); } },
      fx: { vine(e) { const a = V(e.x, 2.5, e.z), b = V(e.ex, e.ey, e.ez); beamFx(a, b, 0x6ef04a, .12, .3); burst(e.ex, e.ey, e.ez, 14, 0x9aff80, 4, .2, .4); } } },
  ],
},
// ================================================================== SHADOW
shadow: {
  name: 'Shadow', color: 0x9a4cff, glyph: '🌑', adj: 'CURSED', react: { name: 'NIGHTFALL', kind: 'drain' },
  blurb: 'An assassin. Pin enemies down, blind them, swap places with them and strike from the dark.',
  passive: 'Assassin: hits on an enemy\'s back deal 50% more damage. Cursed enemies take 15% more damage.',
  st: { vuln: .15 },
  moves: [
    { name: 'Shadow Daggers', icon: '🗡️', cd: .45, desc: 'Throw a fan of three shadow daggers.',
      cast(p, c) { const n = 3 + 2 * (c.multi - 1); for (let k = 0; k < n; k++) shoot(p, c, 48, { d: spread(c.d, k, n, .07), r: .22, dmg: 10.5 * c.dmg, kb: 1.5, sc: c.mega ? 1.8 : 1 }); },
      look: { m: 'shadow__dagger', trail: [0x7a3acc, .14, .25, 0, 1], blink: 1 }, // the daggers flicker in and out of sight as they fly
      fx: { det: e => boomFx(e.x, e.y, e.z, 2.5, 0x9a4cff, .6), nova: e => boomFx(e.x, .5, e.z, 4.5, 0x9a4cff, .8) } },
    { name: 'Blackout', icon: '🌑', cd: 6, mode: 'aim', range: 20, aimR: 3, desc: 'Hurl an orb of darkness that bursts into a choking cloud for 3 s. Every enemy it catches, or that walks in, is blinded: hit for 16, stunned for 1.5 s and spun round, its back wide open to your Assassin bonus.',
      cast(p, c) { const t = c.tgt.clone(), T = clamp(Math.hypot(t.x - p.x, t.z - p.z) / 40, .12, .45); fxe(c.m.key, 'throw', { id: p.id, x: t.x, z: t.z, T }); later(T, () => { fxe(c.m.key, 'burst', { x: t.x, z: t.z, r: 3 * c.st.aoe }); ent(p, c, t.x, t.z, { life: 3, r: 3 * c.st.aoe }); }); },
      ent: { tick(n) { const p = own(n); for (const e of enemiesNear(n.x, n.z, n.r)) if (ready(n, e, 99)) { hitEnemy(e, 'shadow', 16 * n.mul, p, 0, 0, 0, { aoe: true }); if (cc(e, 'stun', 1.5, p) && p) e.yaw = Math.atan2(e.x - p.x, e.z - p.z); } } }, // turned to face away from you
      view: { make(n) { const g = smokeCloud(16, n.r, 0x2a1250); /* deep violet: pure black vanishes against the night sky */ g.userData.circle = zoneCircle('shadow', n.r, .5); g.add(g.userData.circle); return g; },
        upd(o, n, dt, t) {
          const u = o.userData, grow = .5 + .5 * easeOut(Math.min(1, n.t * 4)); spinCircle(u.circle, dt, -.4); setOpacity(u.circle.userData.mats, Math.min(.5, n.l * 3));
          u.puffMat.opacity = Math.min(.85, n.t * 6, n.l * 3);
          for (const s of u.puffs) { s.scale.setScalar(s.userData.s * grow); s.position.y += Math.sin(t * .8 + s.userData.ph) * dt * .15; }
          if (Math.random() < .5) { const a = rand(0, TAU), d = rand(0, n.r); emit(n.x + Math.cos(a) * d, rand(.2, 2), n.z + Math.sin(a) * d, 0, rand(.2, .6), 0, 0x7a3acc, rand(.1, .2), .8, -.2); } // violet wisps in the smoke
        },
        drop: dropFade(.4) },
      fx: { throw(e) {
          const a = handPos(e.id), b = V(e.x, .8, e.z), arc = Math.min(3, a.distanceTo(b) * .15);
          modelFx('shadow__orb', 0x9a4cff, a, e.T, (o, k) => { o.position.lerpVectors(a, b, k); o.position.y += Math.sin(k * Math.PI) * arc; o.scale.setScalar(.25); o.lookAt(camera.position); emit(o.position.x, o.position.y, o.position.z, 0, .2, 0, 0x3a1a6c, .3, .4); });
          sfx('shadow');
        },
        burst(e) { burst(e.x, 1, e.z, 70, 0x140a24, 5, .7, 1, -.5); burst(e.x, 1, e.z, 25, 0xc090ff, 7, .2, .4); ringFx(e.x, .1, e.z, e.r, 0x5a2a9c, .5); flash(e.x, 1, e.z, 0x9a4cff, 20, .2); sfx('shadow_big'); } } },
    { name: 'Shadow Snare', icon: '🕸️', cd: 7, mode: 'aim', range: 20, aimR: 3.5, desc: 'Shadow tendrils burst from the ground, pinning every enemy in the area and dragging them together. While held they take 40% more damage.',
      cast(p, c) {
        const R = 3.5 * c.st.aoe; fxe(c.m.key, 'snare', { x: c.tgt.x, z: c.tgt.z, r: R });
        for (const e of enemiesNear(c.tgt.x, c.tgt.z, R)) { hitEnemy(e, 'shadow', 12 * c.dmg, p, 0, 0, 0); pull(e, c.tgt.x, c.tgt.z, 6); cc(e, 'root', 1.5, p); e.fv = .4; e.fvU = S.t + 1.5; }
      },
      fx: { snare(e) {
        ringFx(e.x, .1, e.z, e.r, 0x5a2a9c, .6);
        for (let i = 0; i < 10; i++) { const a = TAU * i / 10, d = e.r * rand(.3, .95); burst(e.x + Math.cos(a) * d, .1, e.z + Math.sin(a) * d, 8, i % 2 ? 0x5a2a9c : 0xc090ff, 2, .3, .6, 6); }
        sfx('shadow_big');
      } } },
    { name: 'Shadow Swap', icon: '🔄', cd: 9, desc: 'Throw a shadow bolt. You trade places with the first enemy it hits, which is stunned for 1.5 s facing away from you, its back wide open to your Assassin bonus. Bosses are only stunned.',
      cast(p, c) { shoot(p, c, 46, { r: .4, life: .7, dmg: 14 * c.dmg }); },
      shot: { hit(s, e) {
        const p = own(s); hitEnemy(e, 'shadow', s.dmg, p, 0, 0, 0);
        if (p && !p.down && !ET[e.type].boss && !e.pid) {
          const px = p.x, pz = p.z, ex = e.x, ez = e.z;
          p.tp = { x: ex, z: ez, n: (p.tp?.n || 0) + 1 }; // the owner moves itself there (see stepMove)
          e.x = px; e.z = pz; e.kx = e.kz = 0; e.yaw = Math.atan2(px - ex, pz - ez);
          fxe(s.mv, 'swap', { x: px, z: pz, x2: ex, z2: ez, id: p.id });
        }
        cc(e, 'stun', 1.5, p); return 'end';
      } },
      look: { m: 'shadow__orb', s: .35, trail: [0x5a2a9c, .18, .3, 0, 1], light: 3 },
      fx: { swap(e) { for (const [x, z] of [[e.x, e.z], [e.x2, e.z2]]) { burst(x, 1, z, 40, 0x3a1a6c, 4, .5, .8, -.5); burst(x, 1, z, 16, 0xc090ff, 6, .15, .3); ringFx(x, .1, z, 1.4, 0x9a4cff, .35); }
          beamFx(V(e.x, 1, e.z), V(e.x2, 1, e.z2), 0x5a2a9c, .08, .3); sfx('shadow_big'); if (isMe(e.id)) fovKick = 1.2; } } },
    { name: 'Night Terror', icon: '👤', desc: 'ULTIMATE. Every enemy within 18 m (up to 12) is haunted by its own shadow for 5 s. They flee from it in terror while it strikes them twice a second, then every shadow bursts for 50.',
      cast(p, c) { const es = enemiesNear(p.x, p.z, 18 * c.st.aoe).slice(0, 12); ent(p, c, p.x, p.z, { life: 5, r: 18, s: es.map(e => e.id) }); for (const e of es) cc(e, 'fear', 5, p); },
      ent: { tick(n, dt) { if (!pulse(n, dt, .5)) return; for (const id of n.s) { const e = S.enemies.find(x => x.id === id && alive(x)); if (e) hitEnemy(e, 'shadow', 18 * n.mul, own(n), 0, 0, 0, { aoe: true }); } },
        end(n) { const p = own(n); for (const id of n.s) { const e = S.enemies.find(x => x.id === id && alive(x)); if (!e) continue; const q = center(e); fxe(n.mv, 'pop', { x: q.x, y: q.y, z: q.z }); hitEnemy(e, 'shadow', 50 * n.mul, p, 0, 0, 0, { aoe: true }); } } },
      // a dark copy of a wizard stalks each victim, lunging at it
      view: { make() { const g = new THREE.Group(); g.userData.mats = []; g.userData.figs = new Map(); sfx('ult'); return g; },
        upd(o, n, dt, t) {
          const u = o.userData, a = Math.min(1, n.t * 3, n.l * 6);
          for (const id of n.s || []) {
            const v = views.e.get(id); let f = u.figs.get(id);
            if (!f && v) { f = ghostWizard(0x1a0630); scene.add(f); u.figs.set(id, f); burst(v.g.position.x, .5, v.g.position.z, 20, 0x3a1a6c, 3, .5, .7, -.5); }
            if (!f) continue; f.visible = !!v; if (!v) continue;
            const ang = t * 1.5 + id, lunge = Math.max(0, Math.sin(t * TAU * 2 + id)) * .9, d = 1.8 - lunge;
            f.position.set(v.g.position.x + Math.sin(ang) * d, v.g.position.y, v.g.position.z + Math.cos(ang) * d); f.lookAt(v.g.position.x, f.position.y, v.g.position.z); fade(f, a * .75);
            if (Math.random() < .3) emit(f.position.x, f.position.y + rand(.3, 1.6), f.position.z, 0, .5, 0, 0x3a1a6c, rand(.2, .35), .6, -.3);
          }
        },
        drop(o) { for (const f of o.userData.figs.values()) dropFade(.3)(f); o.removeFromParent(); } },
      fx: { pop(e) { burst(e.x, e.y, e.z, 40, 0x140a24, 6, .6, .8, -.5); burst(e.x, e.y, e.z, 20, 0xc090ff, 8, .2, .4); flash(e.x, e.y, e.z, 0x9a4cff, 20, .2); sfx('shadow_big'); } } },
  ],
},
// ================================================================== LIGHT
light: {
  name: 'Light', color: 0xffe08a, glyph: '☀️', adj: 'RADIANT', react: { name: 'SMITE', kind: 'heal' },
  blurb: 'Holy power. Burn enemies with beams of sunlight and smite anything that dares to attack.',
  passive: 'Radiance: your damage heals your partner for 8% of it (or you for 4% when alone). Radiant enemies deal 30% less damage.',
  st: { weak: .3 },
  moves: [
    { name: 'Radiant Orbs', icon: '✨', cd: .4, desc: 'Fast, dead-straight bolts of light. No homing, but a headshot hits 75% harder.',
      cast(p, c) { for (let k = 0; k < c.multi; k++) shoot(p, c, 62, { d: spread(c.d, k, c.multi, .05), r: .25, dmg: 17 * c.dmg, sc: c.mega ? 1.8 : 1 }); },
      shot: { hit(s, e, hd) { hitEnemy(e, 'light', s.dmg, own(s), s.vx, s.vz, s.kb, { crit: hd ? 1.75 : 1, src: { x: s.x - s.vx, z: s.z - s.vz } }); } },
      look: { m: 'light__orb', spin: [0, 0, 4], trail: [0xfff0b0, .2, .35, 0, 2], light: 6 },
      fx: { det: e => boomFx(e.x, e.y, e.z, 2.5, 0xffe08a, .6), nova: e => boomFx(e.x, .5, e.z, 4.5, 0xffe08a, .8) } },
    { name: 'Solar Beam', icon: '🔆', cd: 6, mode: 'channel', max: 3, desc: 'Hold to fire a piercing beam of sunlight. It starts wide and soft, then focuses the longer you hold it: narrower, but much stronger.',
      tick(p, c, dt) { if (pulse(p.bd, dt, .1, 'sb')) for (const h of rayHits(c.eye, c.aim, 32, 1.2 - .25 * Math.min(3, p.chT))) hitEnemy(h.e, 'light', 6.5 * c.dmg * (1 + p.chT * .5), p, c.aim.x, c.aim.z, .6, { src: p }); },
      chv: {
        make() { const g = new THREE.Group(), core = beamMesh(0xffffff, .12), outer = beamMesh(0xffe08a, .4); g.add(core, outer); g.userData.mats = [...core.userData.mats, ...outer.userData.mats]; return g; },
        upd(o, a, d, dt, t, p, T) {
          const t2 = d.y < -.01 ? Math.min(32, -a.y / d.y) : 32, b = a.clone().addScaledVector(d, t2), f = Math.min(1, (T || 0) / 3), w = 1.8 - 1.2 * f; // wide and soft, narrowing to a hot line
          aimBeam(o.children[0], a, b, .1 * (.8 + f) * (1 + .2 * Math.sin(t * 40))); aimBeam(o.children[1], a, b, .35 * w); fade(o.children[1], .5 + .5 * f);
          burst(b.x, b.y, b.z, 3, 0xfff0b0, 5, .25, .3); if (Math.random() < .4) flash(b.x, b.y + .3, b.z, 0xffe08a, 12, .1);
        } } },
    { name: 'Blinding Flash', icon: '💥', cd: 9, desc: 'A searing flash in front of you. Enemies caught in it are blinded for 1 s and left Illuminated for 5 s: they glow, and take 20% more damage from everything.',
      cast(p, c) { for (const e of coneHits(p, 12, 100)) { cc(e, 'blind', 1, p); hitEnemy(e, 'light', 12 * c.dmg, p, e.x - p.x, e.z - p.z, 2, { src: p }); e.fv = Math.max(e.fvU > S.t ? e.fv : 0, .2); e.fvU = S.t + 5; fxe(c.m.key, 'lit', { id: e.id }); } },
      fx: { cast(e) { const a = V(...e.o), d = V(...e.d); flash(a.x + d.x * 3, a.y, a.z + d.z * 3, 0xffffff, 80, .3); burst(a.x + d.x * 2, a.y, a.z + d.z * 2, 50, 0xfff8e0, 14, .3, .4);
        const o = model('gen__cone', 0xfff0b0); o.position.copy(a); o.lookAt(a.clone().add(d)); addFx(o, .3, (o, k) => { o.scale.set(14 * k + .5, 14 * k + .5, 12 * k + .5); fade(o, (1 - k) * .8); }); },
        lit(e) { // an Illuminated enemy glows from inside for 5 s
          const v = views.e.get(e.id); if (!v) return;
          modelFx('light__orb', 0xfff0b0, v.g.position.clone(), 5, (o, k) => { const w = views.e.get(e.id); if (!w) { fade(o, 0); return; } o.position.copy(w.g.position).add(V(0, 1.1, 0)); o.scale.setScalar(1.6 + .2 * Math.sin(k * 60)); fade(o, (k > .9 ? (1 - k) * 10 : 1) * .35); if (Math.random() < .2) emit(o.position.x + rand(-.4, .4), o.position.y + rand(-.6, .6), o.position.z + rand(-.4, .4), 0, .6, 0, 0xfff0b0, .08, .4); }); } } },
    { name: 'Penance', icon: '⚖️', cd: 12, desc: 'Brand every enemy in front of you (14 m) with a halo for 8 s. The first 2 times a branded enemy tries to attack, a spear of light smites it for 60 and stuns it for 0.6 s before the attack lands.',
      cast(p, c) { for (const e of coneHits(p, 14, 100)) { e.pen = S.t + 8; e.penBy = p.id; e.penN = 2; hitEnemy(e, 'light', 8 * c.dmg, p, 0, 0, 0, { src: p }); fxe(c.m.key, 'brand', { id: e.id }); } },
      smite(e) { // called by the sim when a branded enemy starts an attack
        const p = S.players[e.penBy], q = center(e);
        if (--e.penN <= 0) e.pen = 0; // two smites per brand
        fxe('light.3', 'smite', { x: q.x, y: q.y, z: q.z });
        damage(e, 60 * (p ? stats(p).dmgMul : 1), 'light', p); cc(e, 'stun', .6, p);
      },
      fx: { brand(e) { // a halo hovers over the branded enemy until the brand runs out
          const v = views.e.get(e.id); if (!v) return;
          modelFx('light__halo', 0xffe08a, v.g.position.clone(), 8, (o, k) => { const w = views.e.get(e.id); if (!w) { fade(o, 0); return; } o.position.copy(w.g.position).add(V(0, 2.6, 0)); o.rotation.y += .03; o.scale.setScalar(.45); fade(o, k > .9 ? (1 - k) * 10 : .9); }, { flat: true });
          burst(v.g.position.x, 2.4, v.g.position.z, 12, 0xfff0b0, 3, .15, .4); },
        smite(e) { modelFx('light__spear', 0xffe08a, V(e.x, e.y + 9, e.z), .3, (o, k) => { o.position.y = e.y + 9 - 9 * easeOut(Math.min(1, k * 2)); o.rotation.x = Math.PI / 2; fade(o, 1 - k * k); });
          flash(e.x, e.y + 1, e.z, 0xfff0b0, 40, .25); burst(e.x, e.y, e.z, 36, 0xfff8e0, 8, .25, .4); ringFx(e.x, .1, e.z, 2, 0xffe08a, .35); popNum(e.x, e.y + 1.5, e.z, 'SMITE', '#ffe08a', 'tag'); sfx('light_big'); } } },
    { name: 'Divine Judgment', icon: '🌞', desc: 'ULTIMATE. Call down a colossal pillar of light that follows your crosshair for 4.5 seconds, searing everything beneath it.',
      cast(p, c) { const q = groundAt(p, 30); ent(p, c, q.x, q.z, { life: 4.5, r: 3 * c.st.aoe }); },
      ent: { tick(n, dt) {
        const p = own(n);
        if (p) { const q = groundAt(p, 30), dx = q.x - n.x, dz = q.z - n.z, d = Math.hypot(dx, dz), st = Math.min(d, 14 * dt); if (d > .01) { n.x += dx / d * st; n.z += dz / d * st; } }
        if (pulse(n, dt, .1)) blast(n.x, n.z, n.r, 12 * n.mul, ctxN(n), { raw: true, kb: 1 });
      } },
      view: { make(n) { const g = new THREE.Group(), bm = beamMat(0xffe08a), b = T.beam.clone(), h = model('light__halo', 0xffe08a, { flat: true }); b.material = bm; b.castShadow = false; b.scale.set(n.r, 45, n.r);
          h.scale.setScalar(n.r / 1.1); h.position.y = .15; g.add(b, h); g.userData.mats = h.userData.mats.slice(); g.userData.bm = bm; g.userData.h = h; sfx('ult'); return g; },
        upd(o, n, dt) { const a = Math.min(1, n.t * 4, n.l * 6); o.userData.bm.uniforms.uA.value = a * 1.3; o.userData.h.rotation.y += dt * 2; fade(o.userData.h, a);
          burst(n.x, .3, n.z, 4, 0xfff0b0, 6, .3, .4, -3); if (Math.random() < .5) flash(n.x, 2, n.z, 0xffe08a, 30, .1);
          if (Math.random() < dt * 5) { const x = n.x + rand(-2, 2), z = n.z + rand(-2, 2); modelFx('light__spear', 0xfff0b0, V(x, 20, z), .3, (s, k) => { s.position.y = 20 * (1 - k); s.rotation.x = Math.PI; if (k > .95) burst(x, .2, z, 12, 0xfff0b0, 5, .2, .3); }); }
          shake(.02); },
        drop: (o) => addFx(o, .4, (o, k) => { o.userData.bm.uniforms.uA.value = 1 - k; fade(o.userData.h, 1 - k); }) } },
  ],
},
// ================================================================== VENOM
venom: {
  name: 'Venom', color: 0x9eff1e, glyph: '☠️', adj: 'POISONED', react: { name: 'CONTAGION', kind: 'spread' },
  blurb: 'A slow, nasty death. Stack poison on everything, then make it erupt and spread.',
  passive: 'Virulence: poison stacks up to 8 times, and poisoned enemies spread their poison when they die.',
  st: { dot: 2.5, stacks: 8, dotStacks: 1 },
  onKill(e, p) { const n = Math.ceil((e.stk.venom || 0) / 2); if (!n) return; for (const o of enemiesNear(e.x, e.z, 4.5)) for (let i = 0; i < n; i++) applyStatus(o, 'venom', p); fxe('venom.3', 'pop', { x: e.x, y: e.y + 1, z: e.z }); },
  moves: [
    { name: 'Venom Spit', icon: '🤮', cd: .55, desc: 'Lob a glob of venom that splashes and leaves a toxic puddle. Every monster that dies in a puddle makes it grow and last longer.',
      cast(p, c) { for (let k = 0; k < c.multi; k++) shoot(p, c, 24, { d: lob(spread(c.d, k, c.multi, .12)), grav: 18, r: .35, dmg: 8 * c.dmg, sc: c.mega ? 1.8 : 1 }); },
      shot: { hit: () => 'end', end(s) { const c = ctxS(s); boomAt(c, s.x, Math.max(s.y, .1), s.z, 2, s.dmg, { kb: 1 }); ent(c.p, c, s.x, s.z, { r: 1.6, life: 2.5 }); } },
      ent: { tick(n, dt) {
        for (const id of n.in || []) { const e = S.enemies.find(x => x.id === id); if ((!e || e.dead) && n.r < 2.2) { n.r += .2; n.life += .3; n.max += .3; } } // fed by the dead
        n.in = enemiesNear(n.x, n.z, n.r).map(e => e.id);
        if (pulse(n, dt, .5)) for (const e of enemiesNear(n.x, n.z, n.r)) hitEnemy(e, 'venom', 2 * n.mul, own(n), 0, 0, 0, { aoe: true, noCombo: true });
      } },
      look: { m: 'venom__glob', spin: [3, 2, 0], trail: [0x9eff1e, .2, .4, 3, 2], light: 4 },
      view: { make(n) { const g = new THREE.Group(); g.userData.mats = []; g.userData.circle = zoneCircle('venom', n.r, .5); g.add(g.userData.circle); return g; },
        upd(o, n, dt) { const c = o.userData.circle; c.scale.setScalar(c.scale.x + (n.r - c.scale.x) * Math.min(1, dt * 6)); spinCircle(c, dt, .5); if (Math.random() < .3 * n.r) emit(n.x + rand(-n.r, n.r) * .6, .1, n.z + rand(-n.r, n.r) * .6, 0, rand(.5, 1.2), 0, 0x9eff1e, rand(.15, .3), .8, -.2); }, drop: dropFade(.3) },
      fx: { boom: e => { burst(e.x, e.y, e.z, 30, 0x9eff1e, 6, .3, .5, 6); ringFx(e.x, .08, e.z, e.r, 0x9eff1e); sfx('venom'); }, det: e => boomFx(e.x, e.y, e.z, 2.5, 0x9eff1e, .6), nova: e => boomFx(e.x, .5, e.z, 4.5, 0x9eff1e, .8) } },
    { name: 'Toxic Cloud', icon: '☁️', cd: 7, mode: 'aim', range: 18, aimR: 4, desc: 'Release a drifting cloud of poison gas that stacks poison on everything inside it.',
      cast(p, c) { ent(p, c, c.tgt.x, c.tgt.z, { life: 6, r: 4 * c.st.aoe, dx: c.flat.x, dz: c.flat.z }); },
      ent: { tick(n, dt) { n.x += n.dx * dt; n.z += n.dz * dt; if (pulse(n, dt, .5)) for (const e of enemiesNear(n.x, n.z, n.r)) hitEnemy(e, 'venom', 4 * n.mul, own(n), 0, 0, 0, { aoe: true }); } },
      view: { make(n) { const o = model('gen__cloud', 0x9eff1e); o.scale.set(n.r / 1.1, n.r / 2, n.r / 1.1); sfx('venom_big'); return o; },
        upd(o, n, dt, t) { o.position.y = .6 + Math.sin(t * 2) * .1; o.rotation.y += dt * .3; fade(o, Math.min(1, n.t * 2, n.l * 4) * .55);
          if (Math.random() < .6) emit(n.x + rand(-n.r, n.r) * .7, rand(.2, 2), n.z + rand(-n.r, n.r) * .7, 0, rand(.3, 1), 0, Math.random() < .5 ? 0x9eff1e : 0x5aa010, rand(.4, .8), 1, -.2, .3); },
        drop: dropFade(.5) } },
    { name: 'Serpent', icon: '🐍', cd: 7, desc: 'Send a venom serpent slithering across the ground. It weaves toward the nearest enemy ahead of it and bites every enemy in its path, poisoning them 3 times.',
      cast(p, c) { const f = c.flat; ent(p, c, p.x + f.x, p.z + f.z, { life: 1.6, r: 1.5, y: .4, dx: f.x * 14, dz: f.z * 14, yaw: Math.atan2(f.x, f.z) }); },
      ent: { tick(n, dt) {
        const tg = enemiesNear(n.x, n.z, 8).filter(e => !n.hit[e.id] && (e.x - n.x) * n.dx + (e.z - n.z) * n.dz > 0).sort((a, b) => Math.hypot(a.x - n.x, a.z - n.z) - Math.hypot(b.x - n.x, b.z - n.z))[0];
        if (tg) { const a = Math.atan2(n.dx, n.dz), want = Math.atan2(tg.x - n.x, tg.z - n.z), na = lerpAngle(a, want, Math.min(1, dt * 5)); n.dx = Math.sin(na) * 14; n.dz = Math.cos(na) * 14; } // turns toward fresh prey ahead
        n.x += n.dx * dt; n.z += n.dz * dt; n.yaw = Math.atan2(n.dx, n.dz) + Math.sin(n.t * 14) * .4;
        if (offMap(n.x, n.z)) n.life = 0;
        for (const e of enemiesNear(n.x, n.z, n.r)) if (ready(n, e, 99)) { hitEnemy(e, 'venom', 11 * n.mul, own(n), n.dx, n.dz, 2); applyStatus(e, 'venom', own(n)); applyStatus(e, 'venom', own(n)); }
      } },
      view: { make() { const o = model('venom__fang', 0x9eff1e); o.scale.setScalar(1.5); sfx('venom_big'); return o; },
        upd(o, n, dt, t) { o.rotation.y = n.yaw; o.position.y = .4 + Math.abs(Math.sin(t * 14)) * .2; for (let k = 0; k < 2; k++) emit(n.x + rand(-.3, .3), .15, n.z + rand(-.3, .3), 0, rand(.3, 1), 0, Math.random() < .5 ? 0x9eff1e : 0x5aa010, rand(.2, .35), .7, -.2); },
        drop: dropFade(.25) } },
    { name: 'Contagion', icon: '🧪', cd: 10, desc: 'Every poisoned enemy nearby erupts, taking damage per poison stack and spreading half its stacks to its neighbours.',
      cast(p, c) {
        const list = enemiesNear(p.x, p.z, 16).filter(e => e.stk.venom > 0), pts = [];
        for (const e of list) {
          const n = e.stk.venom; pts.push([e.x, e.y + 1, e.z].map(r2));
          damage(e, n * 7 * c.dmg, 'venom', p);
          for (const o of enemiesNear(e.x, e.z, 4)) if (o !== e) for (let i = 0; i < Math.ceil(n / 2); i++) applyStatus(o, 'venom', p);
        }
        fxe(c.m.key, 'erupt', { pts });
      },
      fx: { erupt(e) { for (const [x, y, z] of e.pts) { burst(x, y, z, 30, 0x9eff1e, 7, .35, .5, 5); ringFx(x, .08, z, 4, 0x9eff1e, .4); } if (e.pts.length) sfx('venom_big'); },
        pop(e) { burst(e.x, e.y, e.z, 24, 0x9eff1e, 5, .3, .5, 4); } } },
    { name: 'Plague Swarm', icon: '🐝', desc: 'ULTIMATE. Release a swarm of eight venom wasps that hunt down enemies and sting them over and over.',
      cast(p, c) { const f = c.flat; for (let i = 0; i < 8; i++) { const a = TAU * i / 8; ent(p, c, p.x + f.x * 3.5 + Math.cos(a) * 1.2, p.z + f.z * 3.5 + Math.sin(a) * 1.2, { life: 9, r: .4, y: 1.8, i }); } fxe(c.m.key, 'swarm', { x: p.x + f.x * 3.5, z: p.z + f.z * 3.5 }); },
      ent: { tick(n, dt) {
        summonAI(n, dt, 10, .6, .6, e => { hitEnemy(e, 'venom', 6 * n.mul, own(n), 0, 0, .5, { aoe: true }); applyStatus(e, 'venom', own(n)); }, 25);
        const e = n.tg && S.enemies.find(x => x.id === n.tg && alive(x));
        if (e && Math.hypot(e.x - n.x, e.z - n.z) < 2.5) { const a = n.t * 9 + n.i * TAU / 8, R = ET[e.type].r * e.sc + .5; n.x = e.x + Math.cos(a) * R; n.z = e.z + Math.sin(a) * R; n.y = e.y + .8 + Math.sin(n.t * 11 + n.i) * .6; } // clinging: a buzzing cloud tight round its victim
        else { n.x += Math.sin(n.t * 7 + n.i) * dt * 2; n.z += Math.cos(n.t * 6 + n.i * 2) * dt * 2; n.y = 1.6 + Math.sin(n.t * 5 + n.i) * .5; }
      } },
      fx: { swarm(e) { burst(e.x, 1.8, e.z, 40, 0x9eff1e, 5, .3, .6); sfx('venom_big'); } },
      view: { make() { const o = model('venom__wasp', 0x9eff1e); o.scale.setScalar(1.25); o.userData.wl = o.getObjectByName('venom__wasp_wingL'); o.userData.wr = o.getObjectByName('venom__wasp_wingR'); return o; },
        upd(o, n, dt, t) { o.rotation.y = lerpAngle(o.rotation.y, n.yaw || 0, Math.min(1, dt * 10)); const f = Math.sin(t * 60 + n.id) * .7; if (o.userData.wl) o.userData.wl.rotation.y = f; if (o.userData.wr) o.userData.wr.rotation.y = -f; },
        drop: dropFade(.3) } },
  ],
},
// ================================================================== STEEL
steel: {
  name: 'Steel', color: 0xbcd0ec, glyph: '⚔️', adj: 'RENDED', react: { name: 'SHRAPNEL', kind: 'shatter' },
  blurb: 'A blade master. Boomerang saws, railguns and a storm of swords. Shields mean nothing to you.',
  passive: 'Armor Breaker: Rend stacks 3 times (+6% damage taken each). At 3 stacks your hits go straight through shields.',
  st: { vuln: .06, vulnStacks: 1, stacks: 3 },
  moves: [
    { name: 'Saw Blade', icon: '🪚', cd: .6, desc: 'Throw a spinning saw that slices through enemies, then comes back and slices them again.',
      cast(p, c) { for (let k = 0; k < c.multi; k++) shoot(p, c, 30, { d: spread(c.d, k, c.multi, .15), r: .55, life: 2.4, pierce: 99, dmg: 14 * c.dmg, ret: .42, rspd: 34, kb: 1.5, sc: c.mega ? 1.8 : 1 }); },
      look: { m: 'steel__saw', spin: [0, 24, 0], trail: [0xdfe8ff, .1, .2, 0, 1], light: 3, noFace: 1 },
      fx: { det: e => boomFx(e.x, e.y, e.z, 2.5, 0xbcd0ec, .6), nova: e => boomFx(e.x, .5, e.z, 4.5, 0xbcd0ec, .8) } },
    { name: 'Railgun', icon: '🔫', cd: 4, mode: 'charge', charge: .9, desc: 'Hold to charge a hypersonic rail spike that pierces every enemy in a line and blasts them far back. The recoil shoves you backward too. Full charge adds 2 Rend stacks.',
      self(p, c) { p.kx = (p.kx || 0) - c.flat.x * 16 * c.k; p.kz = (p.kz || 0) - c.flat.z * 16 * c.k; },
      cast(p, c) {
        const hits = rayHits(c.eye, c.aim, 45, .5), dmg = (30 + 90 * c.k) * c.dmg;
        for (const h of hits) { const head = h.q.y > h.e.y + ET[h.e.type].h * h.e.sc * .72; hitEnemy(h.e, 'steel', dmg, p, c.aim.x, c.aim.z, 4 + 14 * c.k, { crit: head ? 1.5 : 1, src: p }); if (c.k > .95) { applyStatus(h.e, 'steel', p); applyStatus(h.e, 'steel', p); } }
        const t = c.aim.y < -.01 ? Math.min(45, -c.eye.y / c.aim.y) : 45, b = c.eye.clone().addScaledVector(c.aim, t);
        fxe(c.m.key, 'rail', { ax: c.o.x, ay: c.o.y, az: c.o.z, bx: b.x, by: b.y, bz: b.z, ck: c.k });
      },
      fx: { rail(e) {
        const a = V(e.ax, e.ay, e.az), b = V(e.bx, e.by, e.bz); beamFx(a, b, 0xffffff, .05 + .1 * e.ck, .3); beamFx(a, b, 0x9ab8ff, .2 + .3 * e.ck, .45);
        const d = b.clone().sub(a), L = d.length(); d.normalize();
        for (let i = 0; i < L; i += 1.5) { const q = a.clone().addScaledVector(d, i); emit(q.x, q.y, q.z, rand(-1, 1), rand(-1, 1), rand(-1, 1), 0xdfe8ff, .15, .4); }
        burst(b.x, b.y, b.z, 20, 0xdfe8ff, 8, .2, .3); shake(.08 + .2 * e.ck); sfx('steel_big');
      } } },
    { name: 'Magnetize', icon: '🧲', cd: 8, desc: 'Magnetize every enemy in front of you and drag them right to your feet, stunned.',
      cast(p, c) {
        const pts = [];
        for (const e of coneHits(p, 15, 90)) { hitEnemy(e, 'steel', 8 * c.dmg, p, 0, 0, 0); if (!ET[e.type].boss) { e.kx = (p.x + c.flat.x * 2.5 - e.x) * 5; e.kz = (p.z + c.flat.z * 2.5 - e.z) * 5; e.atk = null; cc(e, 'stun', .6, p); } pts.push([e.x, e.y + 1, e.z].map(r2)); }
        fxe(c.m.key, 'pull', { id: p.id, pts });
      },
      fx: { pull(e) {
        const h = handPos(e.id); modelFx('steel__magnet', 0xbcd0ec, h, .5, (o, k) => { o.position.copy(handPos(e.id)); o.scale.setScalar(isMe(e.id) ? .35 : .8); fade(o, 1 - k); });
        for (const [x, y, z] of e.pts) { for (let i = 0; i < 10; i++) emit(x, y, z, (h.x - x) * rand(1.5, 3), (h.y - y) * rand(1.5, 3), (h.z - z) * rand(1.5, 3), 0xdfe8ff, .12, .35, 0, 0); }
        sfx('steel_big');
      } } },
    { name: 'Caltrops', icon: '📌', cd: 11, desc: 'Scatter a field of steel caltrops. Enemies that step on them are cut, slowed and rended.',
      cast(p, c) { const f = c.flat; for (let i = 0; i < 12; i++) { const a = rand(-3.5, 3.5), b = rand(-2.2, 2.2), q = clampArena(V(p.x + f.x * (6 + a) + f.z * b, 0, p.z + f.z * (6 + a) - f.x * b), .8); ent(p, c, q.x, q.z, { life: 10, r: .5, yaw: rand(0, TAU) }); } },
      ent: { tick(n) { for (const e of enemiesNear(n.x, n.z, n.r)) if (e.y < .3) { hitEnemy(e, 'steel', 18 * n.mul, own(n), 0, 0, 0, { aoe: true }); e.fs = .4; n.dead = true; fxe(n.mv, 'snap', { x: n.x, z: n.z }); break; } } },
      view: { make(n) { const o = model('steel__caltrop', 0xbcd0ec, { shadow: true }); o.rotation.set(rand(0, TAU), n.yaw, rand(0, TAU)); o.scale.setScalar(1.3); return o; },
        upd(o, n) { o.position.y = .12 + Math.max(0, .6 - n.t) * 3; }, drop: dropFade(.2) },
      fx: { snap(e) { burst(e.x, .3, e.z, 12, 0xdfe8ff, 4, .15, .3, 6); sfx('tink'); } } },
    { name: 'Blade Storm', icon: '⚔️', desc: 'ULTIMATE. Ten giant swords orbit you, sweeping outward and back again, shredding everything they touch.',
      cast(p, c) { ent(p, c, p.x, p.z, { follow: 1, life: 5, r: 9 }); sfx('ult'); },
      ent: { tick(n) {
        const rad = 2 + 7 * Math.abs(Math.sin(n.t * Math.PI / 2.5)), a0 = n.t * 3;
        for (let i = 0; i < 10; i++) {
          const a = a0 + TAU * i / 10, x = n.x + Math.cos(a) * rad, z = n.z + Math.sin(a) * rad;
          for (const e of enemiesNear(x, z, 1.3)) if (ready(n, e, .35)) hitEnemy(e, 'steel', 20 * n.mul, own(n), e.x - n.x, e.z - n.z, 4, { aoe: true });
        }
      } },
      view: { make() { const g = new THREE.Group(); g.userData.mats = []; for (let i = 0; i < 10; i++) { const s = model('steel__sword', 0xbcd0ec), piv = new THREE.Group(); s.rotation.set(Math.PI / 2, 0, -Math.PI / 2); s.scale.setScalar(1.25); s.position.y = .2; piv.add(s); g.add(piv); g.userData.mats.push(...s.userData.mats); } return g; },
        upd(o, n, dt) {
          const rad = 2 + 7 * Math.abs(Math.sin(n.t * Math.PI / 2.5)), a0 = n.t * 3;
          o.position.y = n.y + 1.1;
          o.children.forEach((piv, i) => { const a = a0 + TAU * i / 10; piv.position.set(Math.cos(a) * (rad - 1.6), 0, Math.sin(a) * (rad - 1.6)); piv.rotation.y = -a; });
          fade(o, Math.min(1, n.t * 4, n.l * 5));
          if (Math.random() < .5) { const a = a0 + rand(0, TAU); emit(n.x + Math.cos(a) * rad, n.y + 1.1, n.z + Math.sin(a) * rad, 0, 0, 0, 0xdfe8ff, .2, .25); }
        }, drop: dropFade(.3) } },
  ],
},
// ================================================================== MAGMA
magma: {
  name: 'Magma', color: 0xff3a10, glyph: '🌋', adj: 'MOLTEN', react: { name: 'ERUPTION', kind: 'blast' },
  blurb: 'Slow and devastating. Flood the island with lava and drop a meteor on anything left standing.',
  passive: 'Molten Core: molten enemies burn and take 10% more damage, and anything that hits you turns molten.',
  st: { dot: 6, vuln: .1 },
  moves: [
    { name: 'Magma Glob', icon: '🔴', cd: .7, desc: 'Lob a heavy glob of magma. It bounces once before it splashes, and leaves a pool of lava that cools into a lump of black rock after 3 s, blocking monsters for 6 s (up to 4 rocks).',
      cast(p, c) { for (let k = 0; k < c.multi; k++) shoot(p, c, 24, { d: lob(spread(c.d, k, c.multi, .12), .1), grav: 16, r: .45, dmg: 14 * c.dmg, sc: c.mega ? 1.8 : 1.15 }); },
      shot: { hit: () => 'end', end(s, why) {
        const c = ctxS(s);
        if (!s.b && why === 'ground' && c.p) { const v = Math.hypot(s.vx, s.vz) || 1; boomAt(c, s.x, .1, s.z, 1.4, s.dmg * .5, { kb: 2 }, 'thud'); shoot(c.p, c, 12, { o: V(s.x, .4, s.z), d: V(s.vx / v, 1.1, s.vz / v).normalize(), grav: 16, r: .45, dmg: s.dmg, sc: s.sc, b: 1 }); return; }
        boomAt(c, s.x, Math.max(s.y, .1), s.z, 2.2, s.dmg, { kb: 3 }); ent(c.p, c, s.x, s.z, { r: 2, life: 3 });
      } },
      ent: { tick(n, dt) { if (n.kind !== 'rock' && pulse(n, dt, .5)) for (const e of enemiesNear(n.x, n.z, n.r)) hitEnemy(e, 'magma', 4 * n.mul, own(n), 0, 0, 0, { aoe: true, noCombo: true }); },
        end(n) { // the pool cools into rock
          const p = own(n); if (n.kind === 'rock' || !p) return;
          const rocks = S.ents.filter(m => m.own === p.id && m.kind === 'rock' && m.mv === n.mv && !m.dead); if (rocks.length >= 4) rocks[0].life = 0;
          ent(p, ctxN(n), n.x, n.z, { kind: 'rock', r: .9, life: 6, solid: [{ x: n.x, z: n.z, r: .9 }], h: 1.2 });
        } },
      look: { m: 'magma__glob', spin: [4, 3, 0], trail: [0xff5a10, .3, .45, -1, 3], light: 8 },
      view: { make(n) {
          if (n.kind === 'rock') { const o = model('magma__glob', 0x2a1410, { shadow: true }); o.scale.set(2.2, 1.6, 2.2); o.rotation.y = rand(0, TAU); dustFx(n.x, n.z, .8, 0x3a2a22); smokeFx(n.x, .8, n.z, .8, 0x4a3a32, 1.2, 4, .6); return o; }
          const g = new THREE.Group(), d = T.disc.clone(), m = discMat(0xff3a10); d.material = m; d.scale.setScalar(n.r); d.position.y = .06; g.add(d); g.userData.mats = []; g.userData.m = m; return g; },
        upd(o, n, dt, t) {
          if (n.kind === 'rock') { if (Math.random() < .05) emit(n.x + rand(-.5, .5), 1.2, n.z + rand(-.5, .5), 0, .6, 0, 0x5a4a42, rand(.15, .3), 1.2, -.2); return; }
          o.userData.m.uniforms.uA.value = Math.min(1, n.l * 4) * (1 + .2 * Math.sin(t * 6)); if (Math.random() < .3) emit(n.x + rand(-1.2, 1.2), .1, n.z + rand(-1.2, 1.2), 0, rand(1, 3), 0, 0xff8a3a, rand(.1, .25), .7, -1); },
        drop: (o, n) => n?.kind === 'rock' ? addFx(o, .5, (o, k) => { o.position.y = -1.2 * k; }) : addFx(o, .3, (o, k) => { o.userData.m.uniforms.uA.value = 1 - k; }) },
      fx: { thud: e => { burst(e.x, .2, e.z, 16, 0xff5a10, 5, .25, .4, 6); dustFx(e.x, e.z, .8, 0x3a2a22); },
        boom: e => { boomFx(e.x, e.y, e.z, e.r, 0xff3a10, .8); burst(e.x, e.y, e.z, 20, 0x1a0a08, 5, .4, .7, 6); }, det: e => boomFx(e.x, e.y, e.z, 2.5, 0xff3a10, .6), nova: e => boomFx(e.x, .5, e.z, 4.5, 0xff3a10, .8) } },
    { name: 'Eruption', icon: '♨️', cd: 5, mode: 'aim', range: 20, aimR: 3, desc: 'The ground at your target glows, then erupts in a geyser of lava that launches enemies. They come down into the lava pool it leaves behind, which burns for 3 s and then cools into rock.',
      cast(p, c) { ent(p, c, c.tgt.x, c.tgt.z, { life: .7, r: 3 * c.st.aoe }); },
      ent: { end(n) { const c = ctxN(n); boomAt(c, n.x, 0, n.z, n.r, 50 * n.mul, { lift: 13, kb: 2, raw: true }, 'erupt'); if (c.p) ent(c.p, { ...c, m: MOVE['magma.0'] }, n.x, n.z, { r: n.r, life: 3 }); } },
      view: { make(n) { const c = zoneCircle('magma', n.r, .9); return Object.assign(new THREE.Group().add(c), { userData: { mats: [], circle: c } }); },
        upd(o, n, dt) { spinCircle(o.userData.circle, dt, 3); o.userData.circle.scale.setScalar(n.r * (.3 + .7 * easeOut(Math.min(1, n.t * 1.6)))); for (let k = 0; k < 3; k++) emit(n.x + rand(-n.r, n.r) * .6, .1, n.z + rand(-n.r, n.r) * .6, 0, rand(2, 5), 0, 0xff6a2a, .2, .4, -1); },
        drop: (o) => o.removeFromParent() },
      fx: { erupt(e) { riseFx('magma__geyser', 0xff3a10, e.x, e.z, e.r / 2.4, 1.2); boomFx(e.x, 1, e.z, e.r, 0xff3a10); for (let i = 0; i < 40; i++) emit(e.x, .5, e.z, rand(-4, 4), rand(8, 18), rand(-4, 4), Math.random() < .5 ? 0xff5a10 : 0xffb040, rand(.25, .5), 1.2, 14, .5); sfx('magma_big'); } } },
    { name: 'Heat Wave', icon: '🌡️', cd: 10, desc: 'Send a slow, 9 m wide wall of shimmering heat rolling 10 m forward. Enemies caught in it are slowed and heat up with every scorch, and any that heat up 5 times melt for 70.',
      cast(p, c) { const f = c.flat; ent(p, c, p.x + f.x * 1.5, p.z + f.z * 1.5, { life: 3, dx: f.x, dz: f.z, w: 4.5 * c.st.aoe, yaw: Math.atan2(f.x, f.z), r: 5 }); },
      ent: { tick(n, dt) {
        n.x += n.dx * 3.5 * dt; n.z += n.dz * 3.5 * dt;
        for (const e of S.enemies) {
          if (!alive(e)) continue;
          const rx = e.x - n.x, rz = e.z - n.z, along = rx * n.dx + rz * n.dz, lat = Math.abs(rx * n.dz - rz * n.dx);
          if (Math.abs(along) > 1.3 || lat > n.w) continue;
          e.fs = Math.max(e.fs || 0, .75);
          if (!ready(n, e, .15)) continue;
          hitEnemy(e, 'magma', 6 * n.mul, own(n), 0, 0, 0, { aoe: true });
          if ((e.hw = (e.hw || 0) + 1) >= 5 && !e.dead) { e.hw = 0; const q = center(e); fxe(n.mv, 'melt', { x: q.x, y: q.y, z: q.z }); hitEnemy(e, 'magma', 70 * n.mul, own(n), 0, 0, 0, { aoe: true }); }
        }
      } },
      // a line of molten globs wobbling along the ground, with heat rising off it
      view: { make(n) { const g = new THREE.Group(); g.userData.mats = []; const N = 7; for (let i = 0; i < N; i++) { const o = model('magma__glob', 0xff3a10); o.position.x = (i / (N - 1) - .5) * 2 * n.w; o.scale.setScalar(.9); g.add(o); g.userData.mats.push(...o.userData.mats); } sfx('magma_big'); return g; },
        upd(o, n, dt, t) { o.rotation.y = n.yaw; o.children.forEach((c, i) => { c.position.y = .2 + Math.abs(Math.sin(t * 6 + i)) * .3; c.scale.set(.9, .5 + .25 * Math.sin(t * 5 + i * 2), .9); }); fade(o, Math.min(1, n.t * 4, n.l * 5) * .85);
          const sx = Math.cos(n.yaw), sz = -Math.sin(n.yaw);
          for (let k = 0; k < 6; k++) { const l = rand(-n.w, n.w); emit(n.x + sx * l, rand(.1, .6), n.z + sz * l, 0, rand(2, 5), 0, Math.random() < .5 ? 0xff5a10 : 0xffb040, rand(.15, .35), .6, -1.5); } },
        drop: dropFade(.3) },
      fx: { melt(e) { burst(e.x, e.y, e.z, 40, 0xff5a10, 7, .3, .5, 6); flash(e.x, e.y, e.z, 0xff6a2a, 30, .2); scarFx(e.x, e.z, 1.4, 0xff3a10, 3); popNum(e.x, e.y + 1.4, e.z, 'MELT', '#ff6a2a', 'tag'); sfx('magma_big'); } } },
    { name: 'Volcano', icon: '🗻', cd: 15, mode: 'aim', range: 14, aimR: 2, desc: 'Raise a small volcano that keeps lobbing magma bombs at enemies.',
      cast(p, c) { ent(p, c, c.tgt.x, c.tgt.z, { life: 10, r: 16, solid: [{ x: c.tgt.x, z: c.tgt.z, r: 1.4 }], h: 2 }); },
      ent: { tick(n, dt) {
        if (!pulse(n, dt, .9)) return;
        const es = enemiesNear(n.x, n.z, n.r); if (!es.length) return;
        const e = pick(es), T2 = 1.1, g = 14, o = V(n.x, 2.1, n.z), dx = e.x - o.x, dz = e.z - o.z, dy = -o.y, v = V(dx / T2, (dy + .5 * g * T2 * T2) / T2, dz / T2), sp = v.length();
        shoot(own(n), { ...ctxN(n), m: MOVE['magma.3'] }, sp, { o, d: v.normalize(), grav: g, r: .45, dmg: 22 * n.mul, sc: 1.3, mul: n.mul });
        fxe(n.mv, 'spew', { x: n.x, z: n.z });
      } },
      shot: { hit: () => 'end', end(s) { boomAt(ctxS(s), s.x, Math.max(s.y, .1), s.z, 2.2, s.dmg, { kb: 3 }); } },
      look: { m: 'magma__glob', spin: [4, 3, 0], trail: [0xff5a10, .35, .5, -1, 3], light: 6 },
      view: { make(n) { const o = model('magma__volcano', 0xff3a10, { shadow: true }); dustFx(n.x, n.z, 2, 0x3a2a20); sfx('magma_big'); return o; },
        upd(o, n) { o.position.y = -2.2 * (1 - easeOut(Math.min(1, n.t * 3))); if (Math.random() < .4) emit(n.x + rand(-.3, .3), 2.1, n.z + rand(-.3, .3), rand(-.3, .3), rand(1, 2), rand(-.3, .3), 0x3a3030, rand(.4, .7), 1.5, -.5, .3); },
        drop(o, n) { dustFx(n.x, n.z, 2, 0x3a2a20); addFx(o, .5, (o, k) => { o.position.y = -2.2 * k; }); } },
      fx: { spew(e) { burst(e.x, 2.2, e.z, 16, 0xff6a2a, 5, .3, .4, 4); flash(e.x, 2.5, e.z, 0xff5a1a, 15, .15); sfx('magma'); }, boom: e => boomFx(e.x, e.y, e.z, e.r, 0xff3a10, .8) } },
    { name: 'Meteor', icon: '☄️', mode: 'aim', range: 26, aimR: 7.5, desc: 'ULTIMATE. Call down a colossal meteor. After a short warning it obliterates the area and floods it with lava.',
      cast(p, c) { ent(p, c, c.tgt.x, c.tgt.z, { life: 1.6, r: 7.5 * c.st.aoe }); },
      ent: {
        tick(n, dt) { if (n.kind === 'field' && pulse(n, dt, .5)) for (const e of enemiesNear(n.x, n.z, n.r)) hitEnemy(e, 'magma', 8 * n.mul, own(n), 0, 0, 0, { aoe: true, noCombo: true }); },
        end(n) { if (n.kind === 'field') return; const c = ctxN(n); boomAt(c, n.x, 0, n.z, n.r, 135 * n.mul, { kb: 10, lift: 9, raw: true }, 'impact'); ent(c.p, c, n.x, n.z, { r: n.r * .8, life: 5, kind: 'field', mul: n.mul }); },
      },
      view: {
        make(n) {
          const g = new THREE.Group(); g.userData.mats = [];
          if (n.kind === 'field') { const d = T.disc.clone(), m = discMat(0xff3a10); d.material = m; d.scale.setScalar(n.r); d.position.y = .06; g.add(d); g.userData.m = m; g.userData.circle = zoneCircle('magma', n.r, .6); g.add(g.userData.circle); return g; }
          const c = zoneCircle('magma', n.r, .9), m = model('magma__meteor', 0xff3a10); g.add(c, m); g.userData.circle = c; g.userData.met = m; sfx('magma_big'); return g;
        },
        upd(o, n, dt, t) {
          const u = o.userData; spinCircle(u.circle, dt, u.met ? 3 : .4);
          if (u.m) { u.m.uniforms.uA.value = Math.min(1, n.l * 3) * (1.1 + .25 * Math.sin(t * 5)); if (Math.random() < .6) { const a = rand(0, TAU), d = rand(0, n.r); emit(n.x + Math.cos(a) * d, .1, n.z + Math.sin(a) * d, 0, rand(1, 3), 0, 0xff7a2a, rand(.15, .3), .9, -1); } return; }
          const k = 1 - n.l; setOpacity(u.circle.userData.mats, .4 + .6 * Math.abs(Math.sin(t * 10)));
          u.met.position.set(10 * (1 - k), 45 * (1 - k) + 1, 10 * (1 - k)); u.met.lookAt(_v.copy(u.met.position).add(o.position).add(V(-10, -44, -10))); // nose along the fall, tail trailing
          for (let i = 0; i < 6; i++) emit(n.x + u.met.position.x + rand(-1, 1), u.met.position.y + rand(-1, 1), n.z + u.met.position.z + rand(-1, 1), rand(-2, 2), rand(2, 6), rand(-2, 2), flameColor(), rand(.5, 1), .6, 0);
        },
        drop(o, n) { if (o.userData.m) addFx(o, .4, (o, k) => { o.userData.m.uniforms.uA.value = 1 - k; setOpacity(o.userData.circle.userData.mats, (1 - k) * .6); }); else o.removeFromParent(); },
      },
      fx: { impact(e) { boomFx(e.x, 1, e.z, e.r, 0xff3a10, 3); pillarFx(e.x, .05, e.z, e.r * .5, 16, 0xff5a10, 1); ringFx(e.x, .1, e.z, e.r * 1.8, 0xffa040, 1); dustFx(e.x, e.z, e.r, 0x3a2a20); shake(1); sfx('ult'); sfx('smash'); } } },
  ],
},
// ================================================================== CRYSTAL
crystal: {
  name: 'Crystal', color: 0xff5ad8, glyph: '💎', adj: 'REFRACTED', react: { name: 'PRISM', kind: 'shatter' },
  blurb: 'Precision and geometry. Shards that split and refract, turrets, and diamond-hard defence.',
  passive: 'Prismatic: enemies killed by Crystal shatter into shards that strike nearby foes.',
  st: { slow: .2 },
  onKill(e, p) { const c = { p, el: 'crystal', m: MOVE['crystal.0'], dmg: stats(p).dmgMul }; for (let i = 0; i < 4; i++) { const a = rand(0, TAU); shoot(p, c, 26, { o: center(e), d: V(Math.sin(a), .05, Math.cos(a)), life: .5, dmg: 10 * c.dmg, child: 1, sc: .6, hit: [e.id] }); } },
  moves: [
    { name: 'Prism Shard', icon: '🔷', cd: .45, desc: 'A crystal shard that splits into three smaller shards when it hits.',
      cast(p, c) { for (let k = 0; k < c.multi; k++) shoot(p, c, 40, { d: spread(c.d, k, c.multi), r: .3, dmg: 14 * c.dmg, sc: c.mega ? 1.8 : 1 }); },
      shot: { hit(s, e, hd) {
        const p = own(s); hitEnemy(e, 'crystal', s.dmg, p, s.vx, s.vz, s.kb, { crit: hd ? 1.5 : 1, src: { x: s.x - s.vx, z: s.z - s.vz } });
        if (!s.child) { fxe(s.mv, 'crack', { x: s.x, y: s.y, z: s.z }); const d = V(s.vx, s.vy, s.vz).normalize(); for (const k of [-1, 0, 1]) shoot(p, ctxS(s), 30, { o: V(s.x, s.y, s.z), d: d.clone().applyAxisAngle(UP, k * .45), life: .35, dmg: 5 * s.mul, child: 1, hit: [e.id], sc: .6 }); }
        return 'end';
      } },
      look: { m: 'crystal__prism', spin: [0, 0, 6], trail: [0xffb0f0, .14, .25, 0, 1], light: 4 },
      fx: { crack(e) { debrisFx(e.x, e.y, e.z, 3, 'crystal__prism', 0xff5ad8, .14, 5); burst(e.x, e.y, e.z, 8, 0xffd0f6, 4, .1, .25); }, // the shard shatters on impact
        det: e => boomFx(e.x, e.y, e.z, 2.5, 0xff5ad8, .6), nova: e => boomFx(e.x, .5, e.z, 4.5, 0xff5ad8, .8) } },
    { name: 'Geode Bomb', icon: '🪩', cd: 6, desc: 'Lob a geode that cracks open and sprays crystal shards in every direction. The shards stick in the ground as a field of crystal spikes for 4 s that cut anything walking over them for 6.',
      cast(p, c) { shoot(p, c, 22, { d: lob(c.d, .15), grav: 16, r: .4, dmg: 10 * c.dmg, rest: .35, fuse: 1.2 }); },
      shot: { hit: () => 'end', end(s) {
        const c = ctxS(s); boomAt(c, s.x, Math.max(s.y, .2), s.z, 2, 20 * s.mul, { kb: 4 });
        const cs = { ...c, m: MOVE['crystal.0'] }; // shards behave like prism shards, not like more geodes
        for (let i = 0; i < 14; i++) { const a = TAU * i / 14; shoot(c.p, cs, 25, { o: V(s.x, Math.max(s.y, .4) + .2, s.z), d: V(Math.sin(a), .08, Math.cos(a)), life: .6, dmg: 12 * s.mul, child: 1, sc: .8 }); }
        if (c.p) ent(c.p, c, s.x, s.z, { life: 4, r: 3 });
      } },
      ent: { tick(n) { for (const e of enemiesNear(n.x, n.z, n.r)) if (e.y < .5 && ready(n, e, 99)) damage(e, 6 * n.mul, 'crystal', own(n), { dot: true }); } }, // each monster is cut once per field (plain damage: no on-hit effects)
      view: { make(n) { const g = new THREE.Group(); g.userData.mats = []; // crystal spikes jutting out of the floor
          for (let i = 0; i < 12; i++) { const o = model('crystal__prism', 0xff5ad8), a = rand(0, TAU), d = Math.sqrt(Math.random()) * n.r; o.position.set(Math.cos(a) * d, .1, Math.sin(a) * d); o.rotation.set(rand(-.4, .4), rand(0, TAU), rand(-.4, .4)); o.scale.setScalar(rand(.35, .6)); o.userData.s = o.scale.x; g.add(o); g.userData.mats.push(...o.userData.mats); }
          return g; },
        upd(o, n) { const k = Math.min(1, n.t * 6), out = n.l < .1 ? n.l * 10 : 1; o.children.forEach(c => c.scale.setScalar(c.userData.s * k * out)); },
        drop: o => o.removeFromParent() },
      look: { m: 'crystal__geode', spin: [3, 4, 0], light: 4 },
      fx: { boom: e => { boomFx(e.x, e.y, e.z, e.r, 0xff5ad8, .8); debrisFx(e.x, e.y + .2, e.z, 9, 'crystal__prism', 0xff5ad8, .2, 9); debrisFx(e.x, e.y + .2, e.z, 2, 'crystal__geode', 0xff5ad8, .35, 4); dustFx(e.x, e.z, 1.2, 0x8a6a80); sfx('crystal_big'); } } },
    { name: 'Resonant Crystal', icon: '💠', cd: 12, mode: 'aim', range: 18, aimR: 6, desc: 'Plant a humming crystal for 6 s. It soaks up a share of all the damage dealt to enemies within 6 m of it, glowing brighter, then shatters for 15 plus 8% of everything it soaked (up to 50 more) to every enemy in range.',
      cast(p, c) { ent(p, c, c.tgt.x, c.tgt.z, { life: 6, r: 6 * c.st.aoe, hp: {} }); },
      ent: { tick(n) { // charge = hp the enemies near it have lost since the last tick
          for (const e of S.enemies) { const was = n.hp[e.id], near = alive(e) && Math.hypot(e.x - n.x, e.z - n.z) < n.r; if (near && was > e.hp) n.s += was - e.hp; n.hp[e.id] = near ? e.hp : undefined; }
          for (const id in n.hp) if (n.hp[id] === undefined) delete n.hp[id];
        },
        end(n) { const dmg = 15 * n.mul + Math.min(50, n.s * .08); n.s = Math.round(n.s); fxe(n.mv, 'shatter', { x: n.x, z: n.z, r: n.r, k: Math.min(1, n.s / 400) }); for (const e of enemiesNear(n.x, n.z, n.r)) hitEnemy(e, 'crystal', dmg, own(n), e.x - n.x, e.z - n.z, 6, { aoe: true }); } },
      view: { make(n) { const g = new THREE.Group(), o = model('crystal__prism', 0xff5ad8); o.scale.setScalar(1.4); g.add(o); g.userData.mats = o.userData.mats.slice(); g.userData.o = o; g.userData.circle = zoneCircle('crystal', n.r, .35); g.add(g.userData.circle); sfx('crystal_big'); return g; },
        upd(o, n, dt, t) { const u = o.userData, k = Math.min(1, (n.s || 0) / 400); u.o.position.y = 1.4 + Math.sin(t * 3) * .15; u.o.rotation.y += dt * (1 + 6 * k); u.o.scale.setScalar(1.4 + k * 1.2 + Math.sin(t * (8 + 20 * k)) * .05 * (1 + k)); spinCircle(u.circle, dt, .5 + k * 2); fade(u.o, .7 + .3 * k);
          if (Math.random() < .2 + k) { const a = rand(0, TAU), d = rand(1, n.r); emit(n.x + Math.cos(a) * d, rand(.3, 1.5), n.z + Math.sin(a) * d, -Math.cos(a) * d * 2, rand(0, 2), -Math.sin(a) * d * 2, 0xffb0f0, rand(.06, .14), .45, 0, 0); } },
        drop: o => o.removeFromParent() },
      fx: { shatter(e) { boomFx(e.x, 1, e.z, e.r, 0xff5ad8, .6 + e.k); debrisFx(e.x, 1.4, e.z, 10 + Math.round(16 * e.k), 'crystal__prism', 0xff5ad8, .25, 12); flash(e.x, 1.4, e.z, 0xffb0f0, 30 + 50 * e.k, .3); sfx('tink'); } } },
    { name: 'Crystal Spire', icon: '🔮', cd: 14, mode: 'aim', range: 14, aimR: 1.5, desc: 'Grow a crystal spire that shoots enemies. Your own projectiles that pass by it refract into three.',
      cast(p, c) { ent(p, c, c.tgt.x, c.tgt.z, { life: 10, r: 16, solid: [{ x: c.tgt.x, z: c.tgt.z, r: .8 }], h: 3 }); },
      ent: { tick(n, dt) {
        for (const s of S.shots) {
          if (s.foe || s.refr || s.child || s.dead || Math.hypot(s.x - n.x, s.z - n.z) > 1.4 || s.y > 3.5) continue;
          s.refr = 1; const d = V(s.vx, s.vy, s.vz), sp = d.length(); d.normalize();
          for (const k of [-1, 1]) { const c2 = ctxS(s); shoot(c2.p, c2, sp, { o: V(s.x, s.y, s.z), d: d.clone().applyAxisAngle(UP, k * .35), r: s.r, life: Math.max(.4, s.life), dmg: s.dmg * .7, kb: s.kb, pierce: s.pierce, grav: s.grav, home: s.home, sc: s.sc, big: s.big, ret: s.ret, rspd: s.rspd, rest: s.rest, fuse: s.fuse, refr: 1 }); }
          fxe(n.mv, 'refract', { x: s.x, y: s.y, z: s.z });
        }
        if (!pulse(n, dt, .5)) return;
        const e = nearest(n.x, n.z, n.r); if (!e) return;
        const o = V(n.x, 2.3, n.z), d = center(e).sub(o).normalize();
        shoot(own(n), { ...ctxN(n), m: MOVE['crystal.0'] }, 34, { o, d, r: .3, dmg: 10 * n.mul, child: 1, mul: n.mul });
      } },
      view: { make(n) { const o = model('crystal__spire', 0xff5ad8, { shadow: true }); dustFx(n.x, n.z, 1.5); debrisFx(n.x, .4, n.z, 6, 'earth__pebble', 0xff5ad8, .3, 7); sfx('crystal_big'); return o; },
        upd(o, n, dt, t) { o.scale.setScalar(easeOutBack(Math.min(1, n.t * 3))); o.rotation.y += dt * .3; if (Math.random() < .3) emit(n.x + rand(-.5, .5), rand(.5, 3), n.z + rand(-.5, .5), 0, .5, 0, 0xffb0f0, .1, .8); },
        drop(o, n) { burst(n.x, 1.5, n.z, 50, 0xff8ae8, 7, .3, .6, 6); debrisFx(n.x, 1.5, n.z, 10, 'crystal__prism', 0xff5ad8, .25, 8); addFx(o, .3, (o, k) => { o.scale.setScalar(1 - k); }); } },
      fx: { refract(e) { burst(e.x, e.y, e.z, 10, 0xffb0f0, 4, .2, .25); flash(e.x, e.y, e.z, 0xff5ad8, 10, .1); } } },
    { name: 'Crystal Tomb', icon: '🏺', mode: 'aim', range: 20, aimR: 8, desc: 'ULTIMATE. Encase every enemy in the area in crystal. After 2.5 seconds the tombs shatter for massive damage.',
      cast(p, c) {
        const es = enemiesNear(c.tgt.x, c.tgt.z, 8 * c.st.aoe);
        for (const e of es) cc(e, 'encase', 2.5, p);
        fxe(c.m.key, 'tomb', { x: c.tgt.x, z: c.tgt.z, r: 8 * c.st.aoe });
        later(2.5, () => { for (const e of es) if (!e.dead) { const q = center(e); fxe(c.m.key, 'shatter', { x: q.x, y: q.y, z: q.z }); hitEnemy(e, 'crystal', 180 * c.dmg, p, 0, 0, 2, { aoe: true }); } });
      },
      fx: { tomb(e) { circleFx('crystal', V(e.x, .08, e.z), e.r, { life: 1.4 }); flash(e.x, 2, e.z, 0xff5ad8, 50, .4); sfx('crystal_big'); sfx('ult'); },
        shatter(e) { meshFx(NODE.crystal__prism, V(e.x, e.y, e.z), .6, 1, 3, 5); debrisFx(e.x, e.y, e.z, 7, 'crystal__prism', 0xff5ad8, .3, 10); burst(e.x, e.y, e.z, 60, 0xff8ae8, 12, .3, .6, 6); flash(e.x, e.y, e.z, 0xff5ad8, 25, .2); sfx('tink'); shake(.15); } } },
  ],
},
// ================================================================== SONIC
sonic: {
  name: 'Sonic', color: 0x3ee8ff, glyph: '🔊', adj: 'RESONANT', react: { name: 'FEEDBACK', kind: 'stun' },
  blurb: 'Rhythm and resonance. Waves of sound that build up until enemies burst.',
  passive: 'Resonance: 5 Sonic hits make an enemy resonate and burst, damaging and stunning everything around it.',
  st: { stacks: 5 },
  onStatus(e, p, n) {
    if (n < 5) return;
    e.stk.sonic = 0;
    later(0, () => { if (e.dead) return; const c = { p, el: 'sonic', m: MOVE['sonic.0'], dmg: 1 }; boomAt(c, e.x, e.y + 1, e.z, 2.6, 40 * (p ? stats(p).dmgMul : 1), { noStatus: true, kb: 5, cc: ['stun', .8] }, 'res'); });
  },
  moves: [
    { name: 'Sound Wave', icon: '〰️', cd: .5, desc: 'A wave of sound that passes through enemies and widens as it travels.',
      cast(p, c) { for (let k = 0; k < c.multi; k++) shoot(p, c, 26, { d: spread(c.d, k, c.multi, .15), r: .8, life: .9, pierce: 99, dmg: 11.5 * c.dmg, kb: 2 }); },
      shot: { tick(s, dt) { s.r += dt * 2.4; s.sc = s.r / .8; } },
      look: { m: 'sonic__wave', light: 3 },
      fx: { res(e) { ringFx(e.x, e.y, e.z, e.r, 0x3ee8ff, .4); ringFx(e.x, .1, e.z, e.r * 1.3, 0xbff8ff, .5); burst(e.x, e.y, e.z, 30, 0x3ee8ff, 8, .25, .4); for (let i = 0; i < 4; i++) modelFx('sonic__note', 0x3ee8ff, V(e.x + rand(-1, 1), e.y + 1, e.z + rand(-1, 1)), .9, (o, k) => { o.position.y += .03; o.lookAt(camera.position); fade(o, 1 - k); }); sfx('sonic_big'); shake(.1); },
        det: e => boomFx(e.x, e.y, e.z, 2.5, 0x3ee8ff, .6), nova: e => boomFx(e.x, .5, e.z, 4.5, 0x3ee8ff, .8) } },
    { name: 'Sonic Boom', icon: '📢', cd: 5, mode: 'charge', charge: 1, desc: 'Hold to build up a sonic boom, then blast a cone in front of you. Full charge stuns.',
      cast(p, c) { for (const e of coneHits(p, 6 + 6 * c.k, 60)) { hitEnemy(e, 'sonic', (15 + 45 * c.k) * c.dmg, p, e.x - p.x, e.z - p.z, 8 + 14 * c.k, { src: p }); if (c.k > .95) { cc(e, 'stun', 1.5, p); applyStatus(e, 'sonic', p); } } fxe(c.m.key, 'boom', { id: p.id, x: c.o.x, y: c.o.y, z: c.o.z, dx: c.d.x, dy: c.d.y, dz: c.d.z, ck: c.k }); },
      fx: { boom(e) {
        const a = V(e.x, e.y, e.z), d = V(e.dx, e.dy, e.dz);
        for (let i = 0; i < 3; i++) modelFx('sonic__rings', 0x3ee8ff, a.clone(), .5, (o, k) => { o.position.copy(a).addScaledVector(d, (k + i * .15) * (6 + 6 * e.ck)); o.lookAt(o.position.clone().add(d)); o.scale.setScalar(1 + k * (2 + 2 * e.ck)); fade(o, 1 - k); });
        for (let i = 0; i < 40; i++) { const s = rand(12, 22); emit(a.x, a.y, a.z, d.x * s + rand(-4, 4), d.y * s + rand(-3, 3), d.z * s + rand(-4, 4), 0xbff8ff, .2, .4, 0, 2); }
        shake(.1 + .3 * e.ck); sfx('sonic_big');
      } } },
    { name: 'Implosion', icon: '🌀', cd: 7, mode: 'aim', range: 20, aimR: 6, desc: 'A pocket of silence at the target sucks enemies in for a moment, then bursts in a sonic boom that stuns them.',
      cast(p, c) { ent(p, c, c.tgt.x, c.tgt.z, { life: .7, r: 6 * c.st.aoe }); },
      ent: { tick(n, dt) { for (const e of enemiesNear(n.x, n.z, n.r)) if (!ET[e.type].boss) pull(e, n.x, n.z, 45 * dt); },
        end(n) { boomAt(ctxN(n), n.x, .5, n.z, 4, 30 * n.mul, { kb: 11, cc: ['stun', .8] }, 'boom'); } },
      view: { make(n) { const o = model('sonic__rings', 0x3ee8ff); o.rotation.x = Math.PI / 2; o.scale.setScalar(n.r); sfx('sonic'); return o; },
        upd(o, n, dt) { o.position.y = .6; o.rotation.z -= dt * 6; o.scale.setScalar(n.r * Math.max(.15, n.l)); if (Math.random() < .8) { const a = rand(0, TAU); emit(n.x + Math.cos(a) * n.r, .5, n.z + Math.sin(a) * n.r, -Math.cos(a) * n.r * 2, 0, -Math.sin(a) * n.r * 2, 0xbff8ff, .15, .4, 0, 0); } },
        drop: o => o.removeFromParent() },
      fx: { boom(e) { boomFx(e.x, e.y, e.z, e.r, 0x3ee8ff, .8); ringFx(e.x, 1, e.z, e.r * 1.2, 0xffffff, .3); sfx('sonic_big'); } } },
    { name: 'Harmonic Link', icon: '🔗', cd: 13, mode: 'aim', range: 20, aimR: 7, desc: 'Link up to 6 enemies with a harmonic chord for 6 s. Damage dealt to one is shared at 40% with all the others.',
      cast(p, c) { const g = S.nid++, es = enemiesNear(c.tgt.x, c.tgt.z, 7 * c.st.aoe).slice(0, 6); for (const e of es) { e.link = { g, t: 6 }; applyStatus(e, 'sonic', p); } fxe(c.m.key, 'link', { x: c.tgt.x, z: c.tgt.z, r: 7 * c.st.aoe }); },
      fx: { link(e) { circleFx('sonic', V(e.x, .08, e.z), e.r, { life: 1 }); sfx('sonic'); } } },
    { name: 'Bass Drop', icon: '🎵', desc: 'ULTIMATE. Eight beats of bass blast out around you, each bigger than the last, ending in a massive drop.',
      cast(p, c) { ent(p, c, p.x, p.z, { follow: 1, life: 4.3, r: 4 }); },
      ent: { tick(n, dt) {
        if (!pulse(n, dt, .5, 'b')) return;
        n.s++; const c = ctxN(n);
        if (n.s >= 8) boomAt(c, n.x, .5, n.z, 14, 60 * n.mul, { lift: 7, kb: 10 }, 'drop');
        else boomAt(c, n.x, .5, n.z, 4 + n.s * 1.1, 18 * n.mul, { kb: 6 }, 'beat');
      } },
      view: { make() { const o = model('sonic__rings', 0x3ee8ff); o.rotation.x = Math.PI / 2; return o; }, upd(o, n, dt, t) { o.position.y = n.y + .2; o.rotation.z += dt * 3; o.scale.setScalar(1.5 + .5 * Math.sin(t * 12.5)); }, drop: dropFade(.3) },
      fx: {
        beat(e) { ringFx(e.x, .15, e.z, e.r, 0x3ee8ff, .45, .5); ringFx(e.x, 1.2, e.z, e.r * .8, 0xff6ae8, .35); modelFx('sonic__note', 0x3ee8ff, V(e.x + rand(-2, 2), 2, e.z + rand(-2, 2)), .8, (o, k) => { o.position.y += .05; o.lookAt(camera.position); fade(o, 1 - k); }); shake(.18); sfx('sonic_big'); },
        drop(e) { boomFx(e.x, 1, e.z, e.r, 0x3ee8ff, 2.5); ringFx(e.x, .5, e.z, e.r * 1.3, 0xff6ae8, .7); shake(.8); sfx('ult'); },
      } },
  ],
},
// ================================================================== GRAVITY
gravity: {
  name: 'Gravity', color: 0xa040ff, glyph: '🕳️', adj: 'HEAVY', react: { name: 'COLLAPSE', kind: 'pull' },
  blurb: 'Bend space. Pull enemies together, lift them helplessly into the air, then slam them down.',
  passive: 'Crushing Weight: your hits deal double damage to airborne enemies, and slammed enemies take 50% more fall damage.',
  st: { slow: .3 },
  moves: [
    { name: 'Graviton', icon: '⚫', cd: .55, desc: 'A slow, heavy orb that drags nearby enemies toward its path and implodes on impact.',
      cast(p, c) { for (let k = 0; k < c.multi; k++) shoot(p, c, 20, { d: spread(c.d, k, c.multi, .12), r: .45, life: 1.6, dmg: 22 * c.dmg, sc: c.mega ? 1.8 : 1 }); },
      shot: { tick(s, dt) { if (pulse(s, dt, .05, 'g')) for (const e of enemiesNear(s.x, s.z, 3.5, s.hit)) pull(e, s.x, s.z, 1.4); }, hit: () => 'end', end(s) { boomAt(ctxS(s), s.x, s.y, s.z, 2, s.dmg, { kb: -6 }); } /* the implosion carries the shot damage */ },
      look: { m: 'gravity__orb', spin: [1, 3, 0], trail: [0x6a20cc, .3, .4, 0, 2], light: 5, suck: [0xc080ff, 2.4] },
      fx: { boom: e => { // it implodes: a black core collapses to nothing
          ringFx(e.x, e.y, e.z, e.r, 0xa040ff, .35, e.r * 1.5); burst(e.x, e.y, e.z, 30, 0xc080ff, -6, .25, .4); sfx('gravity');
          modelFx('gravity__hole', 0xa040ff, V(e.x, e.y, e.z), .35, (o, k) => { o.scale.setScalar(e.r * .45 * (1 - k * k)); o.rotation.y = k * 6; });
        }, det: e => boomFx(e.x, e.y, e.z, 2.5, 0xa040ff, .6), nova: e => boomFx(e.x, .5, e.z, 4.5, 0xa040ff, .8) } },
    { name: 'Crush', icon: '⬇️', cd: 6, mode: 'aim', range: 22, aimR: 3.5, desc: 'Multiply gravity at the target, crushing and stunning enemies. Airborne enemies are slammed into the floor.',
      cast(p, c) { for (const e of boomAt(c, c.tgt.x, 0, c.tgt.z, 3.5, 55 * c.dmg, { kb: 0, cc: ['stun', 1] }, 'crush')) if (e.y > .3) e.vy = -26; },
      fx: { crush(e) { modelFx('gravity__rings', 0xa040ff, V(e.x, 6, e.z), .45, (o, k) => { o.position.y = 6 * (1 - k); o.scale.setScalar(e.r * (1.4 - k * .4)); fade(o, 1 - k * .5); }, { flat: true }); ringFx(e.x, .1, e.z, e.r, 0xa040ff, .4); dustFx(e.x, e.z, e.r); scarFx(e.x, e.z, e.r * .85, 0xa040ff, 3); debrisFx(e.x, .3, e.z, 6, 'earth__pebble', 0xa040ff, .3, 4); shake(.25); sfx('gravity_big'); } } },
    { name: 'Levitate', icon: '🎈', cd: 9, mode: 'aim', range: 20, aimR: 4.5, desc: 'Lift every enemy in the area helplessly into the air for 2 seconds, then drop them hard. While they float they take 25% more damage from everything.',
      cast(p, c) { for (const e of enemiesNear(c.tgt.x, c.tgt.z, 4.5 * c.st.aoe)) { hitEnemy(e, 'gravity', 22 * c.dmg, p, 0, 0, 0, { aoe: true }); if (cc(e, 'lift', 2.2, p)) { e.fv = .25; e.fvU = S.t + 2.2; } } fxe(c.m.key, 'lift', { x: c.tgt.x, z: c.tgt.z, r: 4.5 * c.st.aoe }); },
      fx: { lift(e) { circleFx('gravity', V(e.x, .08, e.z), e.r, { life: 2.2 });
        for (let i = 0; i < 10; i++) { const a = rand(0, TAU), d = rand(.5, e.r), x = e.x + Math.cos(a) * d, z = e.z + Math.sin(a) * d, top = rand(1.5, 4), sp = rand(-2, 2), sc = rand(.25, .5); // rubble floats up with them, then drops
          modelFx('earth__pebble', 0xa040ff, V(x, .2, z), 2.4, (o, k) => { o.position.y = k < .9 ? .2 + top * easeOut(Math.min(1, k * 2)) + Math.sin(k * 12 + i) * .15 : .2 + top * (1 - (k - .9) / .1) ** 2; o.rotation.set(k * sp, k * sp * 2, 0); o.scale.setScalar(sc); }); } for (let i = 0; i < 40; i++) { const a = rand(0, TAU), d = rand(0, e.r); emit(e.x + Math.cos(a) * d, .2, e.z + Math.sin(a) * d, 0, rand(2, 5), 0, 0xc080ff, rand(.15, .3), 1, -1, .5); } sfx('gravity_big'); } } },
    { name: 'Repulsor', icon: '💫', cd: 9, desc: 'Blast everything away from you and reflect nearby enemy projectiles back at them.',
      cast(p, c) {
        boomAt(c, p.x, .8, p.z, 7, 24 * c.dmg, { kb: 18 }, 'push');
        for (const s of S.shots) if (s.foe && Math.hypot(s.x - p.x, s.z - p.z) < 9) Object.assign(s, { foe: 0, own: p.id, mv: 'gravity.3', el: 'gravity', dmg: 20 * c.dmg, vx: -s.vx * 1.4, vy: -s.vy * 1.4, vz: -s.vz * 1.4, hit: [], life: 2, mul: c.dmg, r: .4, pierce: 0, bounce: 0, grav: 0, t: 0, sc: .7 });
      },
      look: { m: 'gravity__orb', spin: [1, 3, 0], trail: [0x6a20cc, .3, .4, 0, 2], light: 5 },
      fx: { push(e) { modelFx('gen__dome', 0xc080ff, V(e.x, 0, e.z), .4, (o, k) => { o.scale.setScalar(1 + e.r * easeOut(k)); fade(o, (1 - k) * .55); }); dustFx(e.x, e.z, 2.5); ringFx(e.x, .3, e.z, e.r, 0xa040ff, .4); ringFx(e.x, 1.2, e.z, e.r * .8, 0xe0c0ff, .3); burst(e.x, 1, e.z, 50, 0xc080ff, 14, .25, .4); shake(.15); sfx('gravity_big'); } } },
    { name: 'Singularity', icon: '🌌', mode: 'aim', range: 22, aimR: 6, desc: 'ULTIMATE. Open a black hole that drags in every enemy nearby, grinds them down, then collapses in a huge explosion.',
      cast(p, c) { ent(p, c, c.tgt.x, c.tgt.z, { life: 4.5, r: 15, y: 2 }); },
      ent: {
        tick(n, dt) {
          for (const e of enemiesNear(n.x, n.z, n.r)) { const d = Math.hypot(e.x - n.x, e.z - n.z); pull(e, n.x, n.z, 30 * dt * (1.3 - d / n.r)); if (d < 3) e.atk = null; }
          if (pulse(n, dt, .25)) for (const e of enemiesNear(n.x, n.z, 3.2)) hitEnemy(e, 'gravity', (4 + 10 * n.t / 4.5) * n.mul, own(n), 0, 0, 0, { aoe: true });
        },
        end(n) { boomAt(ctxN(n), n.x, 2, n.z, 6, 100 * n.mul, { kb: 14 }, 'collapse'); },
      },
      view: { make() { const o = model('gravity__hole', 0xa040ff); sfx('ult'); return o; },
        upd(o, n, dt, t) { o.position.y = 2; o.rotation.y += dt * 2.5; o.rotation.x = .35; o.scale.setScalar(Math.min(1, n.t * 2) * (1 + n.t * .15));
          for (let k = 0; k < 8; k++) { const a = rand(0, TAU), d = rand(4, 14); emit(n.x + Math.cos(a) * d, rand(.2, 4), n.z + Math.sin(a) * d, -Math.cos(a) * d * 1.5 - Math.sin(a) * 4, (2 - rand(0, 4)) * .5, -Math.sin(a) * d * 1.5 + Math.cos(a) * 4, Math.random() < .5 ? 0xa040ff : 0xe0c0ff, rand(.1, .25), .6, 0, 0); }
          shake(.015); },
        drop: (o) => addFx(o, .25, (o, k) => { o.scale.setScalar(Math.max(.01, 1 - k)); }) },
      fx: { collapse(e) { boomFx(e.x, e.y, e.z, e.r, 0xa040ff, 2.5); ringFx(e.x, .2, e.z, e.r * 2, 0xe0c0ff, .7); flash(e.x, 2, e.z, 0xffffff, 80, .3); shake(.7); } } },
  ],
},
// ================================================================== CHRONO
chrono: {
  name: 'Chrono', color: 0xffb43a, glyph: '⏳', adj: 'TIMEWORN', react: { name: 'PARADOX', kind: 'echo' },
  blurb: 'Master of time. Echoing attacks, frozen moments, rewinding your enemies, and stopping time itself.',
  passive: 'Time Dilation: all your cooldowns run 18% faster. Timeworn enemies are 35% slower.',
  st: { slow: .35 },
  moves: [
    { name: 'Chrono Bolt', icon: '🕐', cd: .45, desc: 'A bolt of frozen time. Each hit echoes 1.2 seconds later for the same damage again.',
      cast(p, c) { for (let k = 0; k < c.multi; k++) shoot(p, c, 36, { d: spread(c.d, k, c.multi), r: .3, dmg: 16 * c.dmg, sc: c.mega ? 1.8 : 1 }); },
      shot: { hit(s, e, hd) {
        const p = own(s); hitEnemy(e, 'chrono', s.dmg, p, s.vx, s.vz, 2, { crit: hd ? 1.5 : 1, src: { x: s.x - s.vx, z: s.z - s.vz } });
        const d = s.dmg; later(1.2, () => { if (!e.dead) { damage(e, d, 'chrono', p); fxe(s.mv, 'echo', { x: e.x, y: e.y + 1, z: e.z }); } });
      } },
      look: { m: 'chrono__hand', trail: [0xffd080, .14, .3, 0, 1], light: 4 },
      fx: { echo(e) { ringFx(e.x, e.y, e.z, 1.2, 0xffb43a, .3, .2); burst(e.x, e.y, e.z, 12, 0xffe0a0, 3, .2, .3); sfx('chrono'); },
        det: e => boomFx(e.x, e.y, e.z, 2.5, 0xffb43a, .6), nova: e => boomFx(e.x, .5, e.z, 4.5, 0xffb43a, .8) } },
    { name: 'Stasis', icon: '⏸️', cd: 8, desc: 'Freeze an enemy in time for 3 seconds. Damage it takes meanwhile is stored and lands all at once, 30% stronger.',
      cast(p, c) { shoot(p, c, 34, { r: .45, life: 1.2, dmg: 6 * c.dmg }); },
      shot: { hit(s, e) { const p = own(s); hitEnemy(e, 'chrono', s.dmg, p, 0, 0, 0); if (!cc(e, 'stasis', 3, p)) damage(e, 30 * s.mul, 'chrono', p); return 'end'; } },
      look: { m: 'chrono__hourglass', s: .45, spin: [0, 0, 5], trail: [0xffd080, .2, .3, 0, 1], light: 4 },
      fx: { release(e) { boomFx(e.x, e.y, e.z, 2, 0xffb43a, .7); sfx('chrono_big'); } } },
    { name: 'Rewind', icon: '⏪', cd: 6, desc: 'Mark the spot every enemy in front of you (14 m) is standing on. 2.5 s later time snaps back: each one is yanked back to its mark and takes 35, plus 14 for every metre it had moved (up to 235). Bosses take 150 more. Knock them far away first.',
      cast(p, c) {
        const es = coneHits(p, 14, 80).filter(e => !e.pid);
        for (const e of es) { e.rw = { x: e.x, z: e.z }; hitEnemy(e, 'chrono', 8 * c.dmg, p, 0, 0, 0, { src: p }); fxe(c.m.key, 'mark', { x: e.x, z: e.z }); }
        later(2.5, () => { for (const e of es) {
          if (!alive(e) || !e.rw) continue;
          const d = Math.hypot(e.x - e.rw.x, e.z - e.rw.z), from = center(e);
          e.x = e.rw.x; e.z = e.rw.z; e.kx = e.kz = 0; e.rw = null;
          fxe('chrono.2', 'snap', { x: from.x, y: from.y, z: from.z, x2: e.x, z2: e.z });
          hitEnemy(e, 'chrono', (35 + Math.min(200, d * 14) + (ET[e.type].boss ? 150 : 0)) * c.dmg, p, 0, 0, 0, { aoe: true });
        } });
      },
      fx: { mark(e) { modelFx('chrono__clock', 0xffb43a, V(e.x, .09, e.z), 2.5, (o, k) => { o.rotation.x = -Math.PI / 2; o.scale.setScalar(.9); const h = o.getObjectByName('chrono__clock_min'); if (h) h.rotation.z = k * TAU * 2; fade(o, (k > .85 ? (1 - k) / .15 : 1) * .8); }, { flat: true }); sfx('chrono'); },
        snap(e) { const a = V(e.x, e.y, e.z), b = V(e.x2, e.y, e.z2); beamFx(a, b, 0xffd080, .1, .35);
          for (let i = 0; i < 24; i++) { const q = a.clone().lerp(b, i / 24); emit(q.x, q.y + rand(-.5, .5), q.z, rand(-.3, .3), rand(0, .6), rand(-.3, .3), i % 3 ? 0xffd080 : 0xffffff, rand(.1, .2), .5); }
          burst(e.x2, 1, e.z2, 30, 0xffe0a0, 5, .25, .4); ringFx(e.x2, .1, e.z2, 1.6, 0xffb43a, .3); sfx('chrono_big'); } } },
    { name: 'Slow Field', icon: '🕰️', cd: 13, mode: 'aim', range: 20, aimR: 6, desc: 'Warp time in an area: enemies inside move and attack 70% slower, and enemy shots crawl.',
      cast(p, c) { ent(p, c, c.tgt.x, c.tgt.z, { life: 6, r: 6 * c.st.aoe, slowShots: 1 }); },
      ent: { tick(n, dt) { const es = enemiesNear(n.x, n.z, n.r); for (const e of es) e.fs = Math.max(e.fs || 0, .7); if (pulse(n, dt, 1)) for (const e of es) applyStatus(e, 'chrono', own(n)); } },
      view: { make(n) { const g = new THREE.Group(), clk = model('chrono__clock', 0xffb43a, { flat: true }), d = model('gen__dome', 0xffb43a); clk.rotation.x = -Math.PI / 2; clk.position.y = .08; clk.scale.setScalar(n.r); d.scale.setScalar(n.r);
          g.add(clk, d); g.userData.mats = [...clk.userData.mats, ...d.userData.mats]; g.userData.clk = clk; g.userData.d = d; g.userData.mn = clk.getObjectByName('chrono__clock_min'); g.userData.hr = clk.getObjectByName('chrono__clock_hr'); sfx('chrono_big'); return g; },
        upd(o, n, dt) { const a = Math.min(1, n.t * 3, n.l * 5), u = o.userData; fade(u.clk, a); fade(u.d, a * .15); if (u.mn) u.mn.rotation.z -= dt * 1.5; if (u.hr) u.hr.rotation.z -= dt * .2;
          if (Math.random() < .3) { const ang = rand(0, TAU), d = rand(0, n.r); emit(n.x + Math.cos(ang) * d, rand(.2, 2), n.z + Math.sin(ang) * d, 0, .2, 0, 0xffe0a0, .12, 2, 0, 0); } },
        drop: dropFade() } },
    { name: 'Time Stop', icon: '⏱️', desc: 'ULTIMATE. Stop time for 4 seconds. Enemies freeze, and all the damage you deal piles up and lands 50% stronger when time resumes.',
      cast(p, c) { S.tstop = 4; fxe(c.m.key, 'stop', { id: p.id }); },
      fx: { stop() { timeFx = 4; sfx('ult'); sfx('chrono_big'); shake(.3); }, resume() { timeFx = 0; sfx('resume'); shake(.4); flash(camera.position.x, 2, camera.position.z, 0xffb43a, 30, .4); } } },
  ],
},
// ================================================================== BLOOD
blood: {
  name: 'Blood', color: 0xe8102e, glyph: '🩸', adj: 'BLEEDING', react: { name: 'HEMORRHAGE', kind: 'drain' },
  blurb: 'Power at a price. Spend your own health for brutal damage, and drink it back from your enemies.',
  passive: 'Bloodlust: heal for 6% of damage dealt, and hit up to 50% harder the lower your health. Blood moves cost HP. Bleeding enemies feed you.',
  st: { dot: 6, leech: .5 },
  moves: [
    { name: 'Blood Bolt', icon: '🩸', cd: .4, cost: () => 1.5, desc: 'Costs 1.5 HP. A fast bolt of blood magic that hits hard.',
      cast(p, c) { for (let k = 0; k < c.multi; k++) shoot(p, c, 38, { d: spread(c.d, k, c.multi), r: .3, dmg: 21 * c.dmg, sc: c.mega ? 1.8 : 1 }); },
      look: { m: 'blood__bolt', trail: [0xff2040, .18, .35, 2, 2], light: 5 },
      fx: { det: e => boomFx(e.x, e.y, e.z, 2.5, 0xe8102e, .6), nova: e => boomFx(e.x, .5, e.z, 4.5, 0xe8102e, .8) } },
    { name: 'Blood Scythe', icon: '🌙', cd: 4, cost: () => 5, desc: 'Costs 5 HP. Hurl a huge crescent of blood that cuts through everything and makes enemies bleed.',
      cast(p, c) { shoot(p, c, 22, { r: 1.4, life: .7, pierce: 99, dmg: 26 * c.dmg, kb: 4 }); },
      look: { m: 'blood__scythe', trail: [0xff2040, .3, .3, 2, 3], light: 6 },
      fx: {} },
    { name: 'Blood Tether', icon: '🪝', cd: 7, cost: () => 4, desc: 'Costs 4 HP. Hurl a blood hook that latches onto the first enemy, drags it to you and bleeds it for 3 seconds.',
      cast(p, c) { shoot(p, c, 34, { r: .6, life: .7, dmg: 12 * c.dmg }); },
      shot: { hit(s, e) {
        const c = ctxS(s); hitEnemy(e, 'blood', s.dmg, c.p, 0, 0, 0);
        if (c.p) { if (!ET[e.type].boss) cc(e, 'stun', .6, c.p); ent(c.p, c, c.p.x, c.p.z, { follow: 1, life: 3, s: e.id }); }
        fxe(s.mv, 'cut', { x: e.x, y: e.y + 1, z: e.z });
        return 'end';
      } },
      look: { m: 'blood__bolt', s: 1.3, trail: [0xff2040, .2, .35, 2, 2], light: 5 },
      ent: { tick(n, dt) {
        const p = own(n), e = S.enemies.find(x => x.id === n.s && alive(x));
        if (!p || p.down || !e || Math.hypot(e.x - p.x, e.z - p.z) > 18) { n.life = 0; return; }
        if (!ET[e.type].boss && Math.hypot(e.x - p.x, e.z - p.z) > 2.5) pull(e, p.x, p.z, 40 * dt);
        if (pulse(n, dt, .5)) damage(e, 8 * n.mul, 'blood', p, { dot: true });
      } },
      view: { make() { const g = new THREE.Group(), b = beamMesh(0xff1030, .06, false); scene.add(b); g.userData.mats = []; g.userData.beam = b; sfx('blood_big'); return g; },
        upd(o, n, dt, t) { const b = o.userData.beam, v = views.e.get(n.s); b.visible = !!v; if (v) { const a = handPos(n.own), to = v.g.position.clone().add(V(0, 1, 0)); aimBeam(b, a, to, .05 + .02 * Math.sin(t * 25)); if (Math.random() < .4) emit(to.x, to.y, to.z, (a.x - to.x) * 1.5, (a.y - to.y) * 1.5, (a.z - to.z) * 1.5, 0xff2040, .12, .5, 0, 0); } },
        drop(o) { o.userData.beam.removeFromParent(); o.removeFromParent(); } },
      fx: { cut(e) { burst(e.x, e.y, e.z, 24, 0xe8102e, 6, .25, .5, 8); sfx('blood'); } } },
    { name: 'Blood Orb', icon: '🩸', cd: 6, cost: () => 4, desc: 'Costs 4 HP. Rip blood out of every enemy in front of you (12 m, 8 damage each) into an orb over your hand, then hurl it. It bursts for 85, plus 8 and a bigger blast for every enemy you drained.',
      cast(p, c) {
        const es = coneHits(p, 12, 90), n = Math.min(8, es.length);
        for (const e of es) hitEnemy(e, 'blood', 8 * c.dmg, p, p.x - e.x, p.z - e.z, 1, { src: p });
        fxe(c.m.key, 'gather', { id: p.id, from: es.slice(0, 8).map(e => { const q = center(e); return [r2(q.x), r2(q.y), r2(q.z)]; }) });
        later(.45, () => { if (p.down) return; const a = castAim(p); shoot(p, { ...c, o: a.o, d: a.d }, 30, { r: .4 + .06 * n, life: 1.5, dmg: (85 + 8 * n) * c.dmg, sc: 1 + .25 * n, n }); });
      },
      shot: { hit: () => 'end', end(s) { boomAt(ctxS(s), s.x, Math.max(s.y, .3), s.z, 2.5 + .4 * s.n, s.dmg, { kb: 5 }, 'pop'); } },
      look: { m: 'blood__bolt', s: 1.6, trail: [0xff2040, .25, .4, 2, 3], light: 6 },
      fx: { gather(e) { const h = handPos(e.id); for (const [x, y, z] of e.from) { const a = V(x, y, z); beamFx(a, h, 0xe8102e, .05, .4); for (let i = 0; i < 6; i++) emit(x, y, z, (h.x - x) * 2.2, (h.y - y) * 2.2, (h.z - z) * 2.2, 0xff2040, .14, .45, 0, 0); }
          modelFx('blood__bolt', 0xe8102e, h.clone(), .45, (o, k) => { o.position.copy(handPos(e.id)).add(V(0, .3, 0)); o.scale.setScalar(.4 + k * (.5 + .15 * e.from.length)); o.rotation.y += .2; });
          sfx('blood_big'); },
        pop(e) { boomFx(e.x, e.y, e.z, e.r, 0xe8102e, .9); burst(e.x, e.y, e.z, 40, 0x8a0018, 8, .2, .5, 10); sfx('blood_big'); } } },
    { name: 'Blood Moon', icon: '🌕', desc: 'ULTIMATE. A blood moon rises above you and drains every enemy nearby for 4 seconds. Anything it drains to death bursts, splashing 30 damage on the enemies around it.',
      cast(p, c) { ent(p, c, p.x, p.z, { follow: 1, life: 4, r: 16, s: [] }); },
      ent: { tick(n, dt) {
        if (!pulse(n, dt, .25)) return;
        const es = enemiesNear(n.x, n.z, n.r).slice(0, 12), p = own(n);
        for (const e of es) { damage(e, 7 * n.mul, 'blood', p, { dot: true }); if (e.dead) { aoe(e.x, e.z, 3.5, 30 * n.mul, 'blood', p, e.id, 6); fxe('blood.3', 'pop', { x: e.x, y: e.y + 1, z: e.z, r: 3.5 }); } }
        n.s = es.slice(0, 10).map(e => e.id);
      } },
      view: { make() { const g = new THREE.Group(), m = model('blood__moon', 0xe8102e); m.scale.setScalar(1.4); g.add(m); g.userData.mats = m.userData.mats.slice(); g.userData.moon = m; g.userData.tethers = []; sfx('ult'); return g; },
        upd(o, n, dt, t) {
          const u = o.userData, a = Math.min(1, n.t * 2, n.l * 5); u.moon.position.y = 6 + Math.sin(t) * .2; u.moon.rotation.y += dt; fade(u.moon, a);
          const ids = Array.isArray(n.s) ? n.s : [];
          while (u.tethers.length < ids.length) { const b = beamMesh(0xff1030, .05, false); scene.add(b); u.tethers.push(b); }
          u.tethers.forEach((b, i) => { const v = views.e.get(ids[i]); b.visible = !!v && i < ids.length; if (v) { const from = V(n.x, 6 + o.position.y * 0, n.z), to = v.g.position.clone().add(V(0, 1, 0)); aimBeam(b, to, from, .035 + .015 * Math.sin(t * 20 + i)); fade(b, a * .7); if (Math.random() < .3) emit(to.x, to.y, to.z, (from.x - to.x) * 1.5, (from.y - to.y) * 1.5, (from.z - to.z) * 1.5, 0xff2040, .15, .6, 0, 0); } });
        },
        drop(o) { o.userData.tethers.forEach(b => b.removeFromParent()); dropFade()(o); } } },
  ],
},
// ================================================================== SPIRIT
spirit: {
  name: 'Spirit', color: 0x5effc8, glyph: '👻', adj: 'HAUNTED', react: { name: 'POSSESSION', kind: 'stun' },
  blurb: 'The summoner. The restless dead, a shrieking banshee, a spectral wolf and an army of ghost knights fight for you.',
  passive: 'Restless Dead: every monster you kill rises as a wandering spirit that fights for you for 8 s (up to 4 at once). Haunted enemies deal 25% less damage.',
  st: { slow: .15, weak: .25 },
  onKill(e, p) { if (!ET[e.type].boss && !e.pid && entsOf(p, 'spirit.0').length < 4) raiseSpirit(p, e.x, e.z, stats(p).dmgMul); },
  moves: [
    { name: 'Soul Wisps', icon: '🕯️', cd: .45, desc: 'Release wisps that hunt down enemies on their own.',
      cast(p, c) { for (let k = 0; k < c.multi; k++) shoot(p, c, 22, { d: spread(c.d, k, c.multi, .2), r: .35, life: 2.2, dmg: 24 * c.dmg, home: 6, sc: c.mega ? 1.8 : 1 }); },
      // the wandering spirits of the Restless Dead passive live on this move
      ent: { tick(n, dt) { summonAI(n, dt, 9, 1.3, .8, e => hitEnemy(e, 'spirit', 9 * n.mul, own(n), e.x - n.x, e.z - n.z, 2), 18); } },
      look: { m: 'spirit__wisp', trail: [0x8affd8, .18, .45, -1, 2], light: 4 },
      view: { make(n) { const g = new THREE.Group(), o = model('spirit__wisp', 0x5effc8); g.add(o); g.userData.mats = o.userData.mats; Object.assign(g.userData, { w: o, s: n.s, lunge: 0 }); burst(n.x, .6, n.z, 26, 0x8affd8, 4, .25, .5, -2); sfx('spirit'); return g; },
        upd(o, n, dt, t) {
          const u = o.userData, k = easeOut(Math.min(1, n.t * 2));
          if (n.s !== u.s) { u.s = n.s; u.lunge = 1; }
          u.lunge = Math.max(0, u.lunge - dt * 4);
          o.rotation.y = lerpAngle(o.rotation.y, n.yaw || 0, Math.min(1, dt * 10));
          o.position.y = .3 + 1.1 * k + Math.sin(t * 3 + n.id) * .15;
          u.w.position.z = Math.sin(u.lunge * Math.PI) * 1.1; u.w.rotation.x = -Math.PI / 2 + Math.sin(t * 5 + n.id) * .2; u.w.scale.setScalar(1.5 * k);
          fade(o, Math.min(1, n.l * 4) * .5);
          if (Math.random() < .4) emit(n.x + rand(-.3, .3), o.position.y + rand(-.2, .3), n.z + rand(-.3, .3), 0, rand(.2, .8), 0, 0x8affd8, rand(.12, .25), .6, -.4);
        }, drop(o, n) { burst(n.x, 1.2, n.z, 24, 0x8affd8, 4, .2, .5); dropFade(.3)(o); } },
      fx: { det: e => boomFx(e.x, e.y, e.z, 2.5, 0x5effc8, .6), nova: e => boomFx(e.x, .5, e.z, 4.5, 0x5effc8, .8) } },
    { name: 'Command', icon: '👉', cd: 7, desc: 'Point at an enemy: every spirit, wolf and knight you have lunges at it, strikes for 20 and keeps attacking it. With no summons, a wandering spirit rises beside you instead.',
      cast(p, c) {
        const mine = S.ents.filter(n => n.own === p.id && SUMMONS.has(n.mv));
        if (!mine.length) { raiseSpirit(p, p.x - c.flat.z * 1.6, p.z + c.flat.x * 1.6, c.dmg); return; }
        const e = rayHits(c.eye, c.aim, 40, .9)[0]?.e || nearest(p.x + c.flat.x * 10, p.z + c.flat.z * 10, 8);
        if (!e) return;
        const q = center(e); fxe(c.m.key, 'order', { id: p.id, x: r2(q.x), y: r2(q.y), z: r2(q.z), from: mine.map(n => [r2(n.x), r2(n.z)]) });
        for (const n of mine) { // each one lunges to the target's side and strikes
          const a = Math.atan2(n.x - e.x, n.z - e.z), R = ET[e.type].r * e.sc + .8;
          n.x = e.x + Math.sin(a) * R; n.z = e.z + Math.cos(a) * R; n.yaw = a + Math.PI; n.tg = e.id; n.rt = 3; n.s++;
          hitEnemy(e, 'spirit', 20 * c.dmg, p, e.x - p.x, e.z - p.z, 1, { aoe: true });
        }
      },
      fx: { order(e) { const q = V(e.x, e.y, e.z); beamFx(handPos(e.id), q, 0x8affd8, .02, .2); for (const [x, z] of e.from) beamFx(V(x, 1.2, z), q, 0x5effc8, .05, .3); burst(e.x, e.y, e.z, 30, 0x8affd8, 6, .25, .5); ringFx(e.x, .1, e.z, 2, 0x5effc8, .4); sfx('spirit_big'); } } },
    { name: 'Banshee', icon: '😱', cd: 10, mode: 'aim', range: 18, aimR: 5, desc: 'Summon a banshee at the target for 7 s. Every 2 seconds she shrieks: enemies within 5 m take 18 damage and flee in fear for 1.5 s.',
      cast(p, c) { for (const n of entsOf(p, c.m.key)) n.dead = true; ent(p, c, c.tgt.x, c.tgt.z, { life: 7, r: 5 * c.st.aoe, acc: 1.6 }); },
      ent: { tick(n, dt) { if (!pulse(n, dt, 2)) return; n.s++; for (const e of enemiesNear(n.x, n.z, n.r)) { cc(e, 'fear', 1.5, own(n)); hitEnemy(e, 'spirit', 18 * n.mul, own(n), e.x - n.x, e.z - n.z, 4, { aoe: true }); } } },
      view: { make(n) { const o = model('spirit__skull', 0x8affd8), u = o.userData; Object.assign(u, { s: n.s, wail: 0, circle: zoneCircle('spirit', n.r, .35) }); u.circle.position.set(n.x, .07, n.z); scene.add(u.circle); burst(n.x, 1, n.z, 40, 0x8affd8, 5, .3, .6, -2); sfx('spirit_big'); return o; },
        upd(o, n, dt, t) {
          const u = o.userData, k = easeOut(Math.min(1, n.t * 2));
          if (n.s !== u.s) { u.s = n.s; u.wail = 1; ringFx(n.x, 1.5, n.z, n.r, 0x8affd8, .5); ringFx(n.x, .1, n.z, n.r, 0x5effc8, .5); for (let i = 0; i < 36; i++) { const a = TAU * i / 36; emit(n.x, 2.4, n.z, Math.cos(a) * 12, rand(-1, 1), Math.sin(a) * 12, 0x8affd8, .25, .45, 0, 2); } sfx('spirit_big'); }
          u.wail = Math.max(0, u.wail - dt * 3);
          o.position.y = 1.4 + 1.2 * k + Math.sin(t * 2) * .25; o.scale.setScalar((1.8 + u.wail * 1.2) * k); o.lookAt(camera.position);
          fade(o, Math.min(1, n.l * 4) * .8); spinCircle(u.circle, dt, .5); setOpacity(u.circle.userData.mats, Math.min(.35, n.l * 2));
          if (Math.random() < .6) emit(n.x + rand(-.4, .4), o.position.y - .6, n.z + rand(-.4, .4), rand(-.5, .5), -rand(.5, 1.5), rand(-.5, .5), 0x8affd8, rand(.15, .3), .7, -.3);
        },
        drop(o) { o.userData.circle.removeFromParent(); dropFade(.3)(o); } } },
    { name: 'Spirit Wolf', icon: '🐺', cd: 12, desc: 'Summon a spectral wolf for 16 seconds. It hunts the enemies closest to you and savages them.',
      cast(p, c) { ent(p, c, p.x + 1.5, p.z, { life: 16, r: .6, yaw: p.yaw + Math.PI }); },
      ent: { tick(n, dt) { summonAI(n, dt, 11, 1.2, .7, e => hitEnemy(e, 'spirit', 30 * n.mul, own(n), e.x - n.x, e.z - n.z, 2), 18); } },
      view: { make(n) { const o = model('spirit__wolf', 0x5effc8); o.scale.setScalar(1.15); o.userData.legs = [0, 1, 2, 3].map(i => o.getObjectByName('spirit__wolf_leg' + i)); o.userData.head = o.getObjectByName('spirit__wolf_head'); o.userData.tail = o.getObjectByName('spirit__wolf_tail'); o.userData.s = n.s; o.userData.bite = 0; burst(n.x, 1, n.z, 40, 0x8affd8, 5, .3, .6); sfx('spirit_big'); return o; },
        upd(o, n, dt, t) {
          const u = o.userData; u.ph = (u.ph || 0) + dt * (n.v ? 14 : 2); o.rotation.y = lerpAngle(o.rotation.y, n.yaw || 0, Math.min(1, dt * 10));
          u.legs.forEach((l, i) => { if (l) l.rotation.x = Math.sin(u.ph + (i % 2 ? Math.PI : 0) + (i > 1 ? Math.PI / 2 : 0)) * (n.v ? .8 : .08); });
          if (n.s !== u.s) { u.s = n.s; u.bite = 1; sfx('spirit'); }
          u.bite = Math.max(0, u.bite - dt * 5);
          if (u.head) u.head.rotation.x = -u.bite * .6 + Math.sin(t * 3) * .05; if (u.tail) u.tail.rotation.y = Math.sin(t * 8) * .4;
          o.position.y = Math.abs(Math.sin(u.ph)) * (n.v ? .15 : 0) + u.bite * .3; fade(o, Math.min(1, n.l * 8) * .7);
          if (Math.random() < .3) emit(n.x + rand(-.4, .4), rand(.3, 1.2), n.z + rand(-.4, .4), 0, .5, 0, 0x8affd8, .2, .6, -.3);
        }, drop(o, n) { burst(n.x, 1, n.z, 30, 0x8affd8, 4, .3, .5); dropFade(.3)(o); } } },
    { name: 'Army of the Dead', icon: '⚔️', desc: 'ULTIMATE. Six spectral knights rise around you and cut down your enemies for 9 seconds.',
      cast(p, c) { const f = c.flat, yaw = Math.atan2(f.x, f.z); for (let i = 0; i < 6; i++) { const a = yaw + (i - 2.5) * .38, d = 4 + (i % 2) * 1.5; ent(p, c, p.x + Math.sin(a) * d, p.z + Math.cos(a) * d, { life: 9, r: .6, i, yaw }); } fxe(c.m.key, 'rise', { x: p.x + f.x * 4.5, z: p.z + f.z * 4.5 }); },
      ent: { tick(n, dt) { summonAI(n, dt, 6.5, 1.6, .9, () => { const fx2 = Math.sin(n.yaw), fz = Math.cos(n.yaw); for (const e of enemiesNear(n.x + fx2, n.z + fz, 2)) hitEnemy(e, 'spirit', 20 * n.mul, own(n), fx2, fz, 5, { aoe: true }); }, 22); } },
      view: { make(n) { const o = model('spirit__knight', 0x5effc8); o.userData.sword = o.getObjectByName('spirit__knight_sword'); o.userData.s = n.s; o.userData.sw = 0; return o; },
        upd(o, n, dt, t) {
          const u = o.userData; o.rotation.y = lerpAngle(o.rotation.y, n.yaw || 0, Math.min(1, dt * 8));
          o.position.y = .3 + Math.sin(t * 2 + n.id) * .15 - 2.5 * (1 - easeOut(Math.min(1, n.t * 2)));
          if (n.s !== u.s) { u.s = n.s; u.sw = 1; if (Math.random() < .4) sfx('steel'); }
          u.sw = Math.max(0, u.sw - dt * 3); if (u.sword) u.sword.rotation.x = u.sw > 0 ? -1.6 + (1 - u.sw) * 2.6 : Math.sin(t * 2) * .1;
          fade(o, Math.min(1, n.l * 8, n.t * 2) * .55);
          if (Math.random() < .25) emit(n.x + rand(-.3, .3), rand(.1, .8), n.z + rand(-.3, .3), 0, .4, 0, 0x8affd8, .25, .6, -.3);
        }, drop(o, n) { burst(n.x, 1, n.z, 30, 0x8affd8, 4, .3, .5); dropFade(.4)(o); } },
      fx: { rise(e) { circleFx('spirit', V(e.x, .08, e.z), 4, { life: 1.4 }); burst(e.x, .5, e.z, 80, 0x8affd8, 6, .3, 1, -2); sfx('ult'); sfx('spirit_big'); } } },
  ],
},
// ================================================================== COSMIC
cosmic: {
  name: 'Cosmic', color: 0x6a78ff, glyph: '🌠', adj: 'STARSTRUCK', react: { name: 'STARFALL', kind: 'blast' },
  blurb: 'The power of the stars. Constellations, orbiting moons, meteor showers and a supernova.',
  passive: 'Stellar Rhythm: every 4th Star Shot is a giant piercing star. Starstruck enemies take 12% more damage.',
  st: { vuln: .12 },
  moves: [
    { name: 'Star Shot', icon: '⭐', cd: .38, desc: 'Fire shooting stars. Every 4th one is a giant star that pierces 3 enemies.',
      cast(p, c) { p.bd.star = (p.bd.star || 0) + 1; const big = p.bd.star % 4 === 0; for (let k = 0; k < c.multi; k++) shoot(p, c, 34, { d: spread(c.d, k, c.multi), r: big ? .7 : .3, dmg: (big ? 30 : 8.5) * c.dmg, pierce: c.st.pierce + (big ? 3 : 0), sc: (big ? 2.2 : 1) * (c.mega ? 1.6 : 1) }); },
      look: { m: 'cosmic__star', spin: [0, 0, 10], trail: [() => Math.random() < .5 ? 0xb0b8ff : 0xffffff, .15, .4, 0, 2], light: 5 },
      fx: { det: e => boomFx(e.x, e.y, e.z, 2.5, 0x6a78ff, .6), nova: e => boomFx(e.x, .5, e.z, 4.5, 0x6a78ff, .8) } },
    { name: 'Orbiting Moons', icon: '🌙', cd: 9, desc: 'Three moons orbit you. Whenever an enemy comes close, a moon slams into it and explodes.',
      cast(p, c) { for (const n of entsOf(p, c.m.key)) n.dead = true; for (let i = 0; i < 3; i++) ent(p, c, p.x, p.z, { life: 12, r: .4, y: 1.4, i }); },
      ent: { tick(n) {
        const p = own(n); if (!p) { n.dead = true; return; }
        const a = n.t * 1.2 + n.i * TAU / 3; n.x = p.x + Math.cos(a) * 3.2; n.z = p.z + Math.sin(a) * 3.2; n.y = p.y + 1.6 + Math.sin(n.t * 2 + n.i) * .3; // big, slow, wide orbit
        const e = nearest(n.x, n.z, 7);
        if (e && n.t > .3) { const o = V(n.x, n.y, n.z); shoot(p, ctxN(n), 24, { o, d: center(e).sub(o).normalize(), r: .45, life: 2, dmg: 30 * n.mul, home: 8, sc: 1, moon: 1 }); n.dead = true; }
      } },
      shot: { hit: () => 'end', end(s) { boomAt(ctxS(s), s.x, s.y, s.z, 2, s.dmg * .5, { kb: 5 }); } },
      look: { m: 'cosmic__moon', spin: [1, 2, 0], trail: [0xb0b8ff, .2, .4, 0, 2], light: 4 },
      view: { make() { const o = model('cosmic__moon', 0x6a78ff); o.scale.setScalar(1.5); return o; },
        upd(o, n, dt, t) { o.rotation.y += dt * .8; for (let k = 0; k < 2; k++) { const a = t * 3 + k * Math.PI + n.id; emit(n.x + Math.cos(a) * .9, n.y + Math.sin(a) * .25, n.z + Math.sin(a) * .9, 0, 0, 0, 0xd8dcff, .07, .5); } }, // a little ring of dust round each moon
        drop: (o) => o.removeFromParent() },
      fx: { boom: e => boomFx(e.x, e.y, e.z, e.r, 0x6a78ff, .8) } },
    { name: 'Constellation', icon: '✴️', cd: 2.5, mode: 'aim', range: 18, aimR: 1, desc: 'Place up to 3 stars. Stars link to each other with beams of starlight that burn enemies crossing them.',
      cast(p, c) { const mine = entsOf(p, c.m.key).sort((a, b) => a.id - b.id); while (mine.length >= 3) mine.shift().dead = true; ent(p, c, c.tgt.x, c.tgt.z, { life: 12, r: .5, y: 1.2 }); },
      ent: { tick(n) {
        for (const m of S.ents) {
          if (m.mv !== n.mv || m.own !== n.own || m.id <= n.id || m.dead) continue;
          const ax = n.x, az = n.z, bx = m.x - ax, bz = m.z - az, L2 = bx * bx + bz * bz || 1;
          for (const e of S.enemies) { if (!alive(e)) continue; const t = clamp(((e.x - ax) * bx + (e.z - az) * bz) / L2, 0, 1), d = Math.hypot(e.x - ax - bx * t, e.z - az - bz * t); if (d < .8 + ET[e.type].r * e.sc && ready(n, e, .25)) hitEnemy(e, 'cosmic', 6 * n.mul, own(n), 0, 0, 0, { aoe: true }); }
        }
      } },
      view: { make(n) { const o = model('cosmic__node', 0x6a78ff, { flat: true }); o.userData.links = new Map(); burst(n.x, 1.2, n.z, 20, 0xb0b8ff, 4, .2, .4); sfx('cosmic'); return o; },
        upd(o, n, dt, t) {
          o.position.y = 1.2 + Math.sin(t * 2 + n.id) * .1; o.lookAt(camera.position);
          const u = o.userData.links, src = role === 'guest' ? R : S, mine = (src?.ents || []).filter(m => m.mv === n.mv && m.own === n.own && m.id > n.id);
          for (const [id, b] of u) if (!mine.some(m => m.id === id)) { b.removeFromParent(); u.delete(id); }
          for (const m of mine) { let b = u.get(m.id); if (!b) { b = beamMesh(0x9aa8ff, .1); scene.add(b); u.set(m.id, b); } aimBeam(b, V(n.x, 1.2, n.z), V(m.x, 1.2, m.z), .08 + .03 * Math.sin(t * 15)); fade(b, Math.min(1, n.l * 8, n.t * 4)); }
        },
        drop(o) { for (const b of o.userData.links.values()) b.removeFromParent(); dropFade(.3)(o); } } },
    { name: 'Meteor Shower', icon: '🌠', cd: 12, mode: 'aim', range: 20, aimR: 6, desc: 'Rain twelve shooting stars down on the target area.',
      cast(p, c) { const t = c.tgt.clone(), R2 = 6 * c.st.aoe; for (let i = 0; i < 12; i++) later(i * .15, () => { const a = rand(0, TAU), d = Math.sqrt(Math.random()) * R2, x = t.x + Math.cos(a) * d, z = t.z + Math.sin(a) * d; fxe(c.m.key, 'fall', { x, z }); later(.35, () => boomAt(c, x, .2, z, 2, 22 * c.dmg, { kb: 4, raw: true })); }); },
      fx: { fall(e) { modelFx('cosmic__comet', 0x6a78ff, V(e.x + 8, 30, e.z + 8), .36, (o, k) => { o.position.set(e.x + 8 * (1 - k), 30 * (1 - k), e.z + 8 * (1 - k)); o.lookAt(e.x, 0, e.z); for (let i = 0; i < 3; i++) emit(o.position.x, o.position.y, o.position.z, rand(-1, 1), rand(-1, 1), rand(-1, 1), 0xb0b8ff, .3, .4); }); },
        boom(e) { boomFx(e.x, e.y, e.z, e.r, 0x6a78ff, .7); burst(e.x, .3, e.z, 14, 0xffffff, 6, .15, .4, 6); } } },
    { name: 'Supernova', icon: '💥', desc: 'ULTIMATE. A star ignites above you and grows for 2 seconds, then goes supernova, obliterating and blinding everything nearby.',
      cast(p, c) { ent(p, c, p.x, p.z, { follow: 1, life: 2.2, r: 14 * c.st.aoe }); },
      ent: { end(n) { boomAt(ctxN(n), n.x, 2, n.z, n.r, 140 * n.mul, { kb: 12, cc: ['blind', 2], raw: true }, 'nova'); } },
      view: { make() { const o = model('cosmic__star', 0x6a78ff); o.userData.l = new THREE.PointLight(0x9aa8ff, 0, 30, 2); o.add(o.userData.l); sfx('ult'); return o; },
        upd(o, n, dt, t) { const k = 1 - n.l; o.position.y = n.y + 5.5; o.scale.setScalar(1 + k * 6); o.rotation.z += dt * (2 + k * 10); o.lookAt(camera.position); o.userData.l.intensity = k * 80;
          for (let i = 0; i < 6; i++) { const a = rand(0, TAU), b = rand(-1, 1), d = rand(6, 12), q = V(Math.cos(a) * d, b * d * .5, Math.sin(a) * d); emit(n.x + q.x, n.y + 5.5 + q.y, n.z + q.z, -q.x * 1.5, -q.y * 1.5, -q.z * 1.5, Math.random() < .5 ? 0x9aa8ff : 0xffffff, rand(.15, .3), .6, 0, 0); } },
        drop: (o) => o.removeFromParent() },
      fx: { nova(e) { boomFx(e.x, e.y + 3, e.z, e.r, 0x9aa8ff, 3.5); ringFx(e.x, .3, e.z, e.r * 1.4, 0xffffff, .9); flash(e.x, 5, e.z, 0xffffff, 150, .6); whiteFx = 1; shake(1); } } },
  ],
},
// ================================================================== EXPLOSION
explosion: {
  name: 'Explosion', color: 0xffa020, glyph: '💣', adj: 'PRIMED', react: { name: 'DETONATION', kind: 'blast' }, poise: 1.5,
  blurb: 'Pure demolition. Grenades, sticky bombs, mines, rocket jumps and a carpet-bombing run.',
  passive: 'Demolitions: your explosions are 20% bigger. Primed enemies get knocked back 50% further.',
  st: { kb: 1.5 },
  moves: [
    { name: 'Grenade', icon: '💣', cd: .6, desc: 'Lob a bouncing grenade that explodes after a short fuse, or instantly when it hits an enemy.',
      cast(p, c) { for (let k = 0; k < c.multi; k++) shoot(p, c, 22, { d: lob(spread(c.d, k, c.multi, .12), .15), grav: 16, r: .25, dmg: 21 * c.dmg, rest: .45, fuse: .9, sc: c.mega ? 1.8 : 1, big: c.mega }); },
      shot: { hit: () => 'end', end(s) { boomAt(ctxS(s), s.x, Math.max(s.y, .2), s.z, 2.6 * (s.big ? 1.5 : 1), s.dmg, { kb: 6 }); } },
      look: { m: 'explosion__grenade', spin: [8, 0, 3], trail: [0xffd080, .08, .2, 0, 1], light: 2, blink: 1 },
      fx: { boom: e => blastFx(e), det: e => boomFx(e.x, e.y, e.z, 2.5, 0xffa020, .6), nova: e => boomFx(e.x, .5, e.z, 4.5, 0xffa020, .8) } },
    { name: 'Sticky Bomb', icon: '🧨', cd: 3, desc: 'Throw a sticky bomb that clings to whatever it hits and blows a moment later in a big blast. Bombs stuck to the same monster merge into one: every extra bomb adds its damage and widens the blast.',
      cast(p, c) {
        shoot(p, c, 30, { r: .35, life: 12, fuse: 2.5, dmg: 70 * c.dmg, grav: 6 });
      },
      shot: {
        hit(s, e) {
          const on = S.shots.find(o => o !== s && !o.dead && o.mv === s.mv && o.stuck === e.id);
          if (on) { on.dmg += s.dmg; on.n = (on.n || 1) + 1; on.sc = 1 + .35 * (on.n - 1); on.fuse = Math.max(on.fuse, .6); s.dead = true; fxe(s.mv, 'stack', { x: on.x, y: on.y, z: on.z, n: on.n }); return 'pass'; } // merges into the bomb already there
          s.stuck = e.id; s.ox = s.x - e.x; s.oy = s.y - e.y; s.oz = s.z - e.z; s.passive = 1; s.fuse = Math.min(s.fuse, 1.2); return 'pass';
        },
        ground(s) { s.still = 1; s.vx = s.vy = s.vz = 0; s.y = .15; },
        end(s) { boomAt(ctxS(s), s.x, Math.max(s.y, .2), s.z, 3.2 + .9 * ((s.n || 1) - 1), s.dmg, { kb: 8 + 2 * ((s.n || 1) - 1) }); },
      },
      look: { m: 'explosion__sticky', spin: [3, 5, 0], light: 3, blink: 1 },
      fx: { boom: e => blastFx(e, 1.3) } },
    { name: 'Rocket Jump', icon: '🚀', cd: 6, desc: 'Blast the ground under your feet to rocket up and forward, flattening whatever is nearby.',
      self(p, c) { p.vy = 13; p.y = Math.max(p.y, .05); const f = flatAim(p); p.mo = { t: 0, T: .45, vx: f.x * 16, vz: f.z * 16, trail: 0xffa020 }; },
      cast(p, c) { buff(p, 'inv', .25); boomAt(c, p.x, .3, p.z, 3.5, 30 * c.dmg, { kb: 10 }, 'boom'); },
      fx: { boom: e => blastFx(e, 1.1) } },
    { name: 'Proximity Mines', icon: '🎯', cd: 12, desc: 'Toss four mines ahead of you. Each one blows when an enemy walks over it, and every blast sets off your other mines within 5 m a moment later, so a minefield goes up in a chain.',
      cast(p, c) { const f = c.flat; for (let k = 0; k < 4; k++) { const d = f.clone().applyAxisAngle(UP, (k - 1.5) * .35), q = clampArena(V(p.x + d.x * (7 + (k % 2) * 2.5), 0, p.z + d.z * (7 + (k % 2) * 2.5)), .8); ent(p, c, q.x, q.z, { life: 20, r: 1.6, fx0: p.x, fz0: p.z }); } },
      ent: { tick(n, dt) {
        if (n.t < .6) return;
        if (!n.arm && enemiesNear(n.x, n.z, n.r).length) { n.arm = .25; n.s = 1; fxe(n.mv, 'beep', { x: n.x, z: n.z }); }
        if (n.arm && (n.arm -= dt) <= 0) { boomAt(ctxN(n), n.x, .3, n.z, 3, 45 * n.mul, { lift: 6, kb: 6 }); n.dead = true; for (const m of S.ents) if (m !== n && !m.dead && !m.arm && m.mv === n.mv && m.own === n.own && Math.hypot(m.x - n.x, m.z - n.z) < 5) { m.arm = .18; m.s = 1; m.t = Math.max(m.t, .6); } } // chain reaction
      } },
      view: { make(n) { const o = model('explosion__mine', 0xffa020, { shadow: true }); o.userData.from = V(n.fx0 ?? n.x, 1.4, n.fz0 ?? n.z); return o; },
        upd(o, n, dt, t) { const k = Math.min(1, n.t / .6); if (k < 1) { o.position.lerpVectors(o.userData.from, V(n.x, 0, n.z), k); o.position.y += Math.sin(k * Math.PI) * 2.5; o.rotation.x += dt * 10; } else { o.position.y = .02; o.rotation.x = 0; }
          o.userData.mats.forEach(m => m.uniforms && (m.uniforms.uA.value = .5 + .5 * Math.sin(t * (n.s ? 40 : 4)))); },
        drop: (o) => o.removeFromParent() },
      fx: { beep(e) { sfx('fuse'); flash(e.x, .5, e.z, 0xff4020, 10, .2); }, boom: e => blastFx(e, 1.1) } },
    { name: 'Carpet Bomb', icon: '✈️', desc: 'ULTIMATE. Call in a bombing run: fourteen bombs drop in a line ahead of you, one after another.',
      cast(p, c) { const f = c.flat, x0 = p.x, z0 = p.z; for (let i = 0; i < 14; i++) { const q = clampArena(V(x0 + f.x * (4 + i * 2), 0, z0 + f.z * (4 + i * 2)), .8); later(.25 + i * .12, () => { fxe(c.m.key, 'drop', { x: q.x, z: q.z }); later(.4, () => boomAt(c, q.x, .3, q.z, 4.5, 130 * c.dmg, { kb: 8, lift: 4, raw: true })); }); } fxe(c.m.key, 'run', {}); },
      fx: { drop(e) { modelFx('explosion__bomb', 0xffa020, V(e.x, 25, e.z), .41, (o, k) => { o.position.y = 25 * (1 - k * k); }); },
        boom: e => blastFx(e, 1.2),
        run() { sfx('ult'); } } },
  ],
},
// ================================================================== ILLUSION
illusion: {
  name: 'Illusion', color: 0xf0a6ff, glyph: '🎭', adj: 'BEGUILED', react: { name: 'MIRAGE', kind: 'echo' },
  blurb: 'Smoke and mirrors. Fool monsters into fighting phantoms, and each other.',
  passive: 'Misdirection: Beguiled enemies deal 20% less damage, and 1 in 3 of their attacks strikes a phantom instead of you.',
  st: { weak: .2 },
  moves: [
    { name: 'Phantom Moths', icon: '🦋', cd: .45, desc: 'Release a glowing moth flanked by two phantom moths that flutter off to hunt enemies. Phantoms deal half damage.',
      cast(p, c) { for (let k = 0; k < c.multi; k++) { const d = spread(c.d, k, c.multi, .12); shoot(p, c, 32, { d, r: .32, dmg: 13 * c.dmg, sc: c.mega ? 1.8 : 1 }); for (const s of [-1, 1]) shoot(p, c, 22, { d: d.clone().applyAxisAngle(UP, s * .55).add(V(0, .1, 0)).normalize(), r: .3, life: 1.8, dmg: 6.5 * c.dmg, home: 5, sc: .7 }); } },
      look: { m: 'illusion__moth', s: 1.3, flap: 1, flat: 1, trail: [() => Math.random() < .5 ? 0xffc8ff : 0xb8f0ff, .06, .4, -.4, 1], light: 2 },
      fx: { det: e => boomFx(e.x, e.y, e.z, 2.5, 0xf0a6ff, .6), nova: e => boomFx(e.x, .5, e.z, 4.5, 0xf0a6ff, .8) } },
    { name: 'Decoy', icon: '🪞', cd: 8, mode: 'aim', range: 18, aimR: 3.5, desc: 'Conjure a phantom double of yourself at the target. Monsters within 12 m attack it instead of you for 5 s. Once it is struck 3 times, or time runs out, it shatters, damaging and beguiling everything around it.',
      cast(p, c) { for (const n of entsOf(p, c.m.key)) n.life = 0; ent(p, c, c.tgt.x, c.tgt.z, { life: 5, r: 12, lure: 1, yaw: p.yaw }); },
      ent: { tick(n) { if ((n.hits || 0) >= 3) n.life = 0; }, end(n) { boomAt(ctxN(n), n.x, 1, n.z, 3.5, 35 * n.mul, { kb: 6 }, 'shatter'); } },
      view: { make(n) { const g = ghostWizard(0xf0a6ff); g.rotation.y = n.yaw + Math.PI; burst(n.x, 1, n.z, 40, 0xffc8ff, 5, .3, .6); sfx('illusion_big'); return g; },
        upd(o, n, dt, t) { fade(o, Math.min(1, n.t * 3, n.l * 10) * (.6 + .15 * Math.sin(t * 9))); tint(o, shimmer(t + n.id)); o.position.y = .05 + Math.sin(t * 2.2) * .06;
          if (Math.random() < .35) emit(n.x + rand(-.4, .4), rand(.2, 1.9), n.z + rand(-.4, .4), 0, rand(.3, .9), 0, Math.random() < .5 ? 0xffc8ff : 0xb8f0ff, rand(.08, .16), .7, -.3); },
        drop: o => o.removeFromParent() },
      fx: { shatter(e) {
        boomFx(e.x, e.y, e.z, e.r, 0xf0a6ff, .8); flash(e.x, 1.2, e.z, 0xffffff, 40, .25);
        for (let i = 0; i < 14; i++) { const a = rand(0, TAU), up = rand(2, 6), sp = rand(4, 9), spin = V(rand(-9, 9), rand(-9, 9), rand(-9, 9)); modelFx('illusion__shard', 0xf0a6ff, V(e.x, rand(.5, 1.8), e.z), rand(.6, 1), (o, k, dt) => { o.position.x += Math.cos(a) * sp * dt; o.position.z += Math.sin(a) * sp * dt; o.position.y += (up - 14 * k) * dt; o.rotation.x += spin.x * dt; o.rotation.y += spin.y * dt; fade(o, 1 - k * k); }); }
        sfx('tink'); sfx('illusion_big'); shake(.15);
      } } },
    { name: 'Mesmerize', icon: '😵‍💫', cd: 10, desc: 'A hypnotic pulse charms every monster in front of you for 4 s: they turn on each other and attack the nearest monster instead of you. Bosses resist it.',
      cast(p, c) { for (const e of coneHits(p, 13, 90)) { hitEnemy(e, 'illusion', 10 * c.dmg, p, 0, 0, 0, { src: p }); cc(e, 'charm', 4, p); } },
      fx: { cast(e) {
        const a = V(...e.o), d = V(...e.d);
        for (let i = 0; i < 4; i++) modelFx('sonic__rings', 0xf0a6ff, a.clone(), .7, (o, k) => { o.position.copy(a).addScaledVector(d, (k + i * .12) * 11); o.lookAt(o.position.clone().add(d)); o.rotateZ(k * 6 + i); o.scale.setScalar(.8 + k * (4 + i)); tint(o, shimmer(k * 3 + i)); fade(o, (1 - k) * .7); });
        for (let i = 0; i < 3; i++) { const dd = d.clone().applyAxisAngle(UP, (i - 1) * .45); modelFx('illusion__mask', 0xffffff, a.clone(), .8, (o, k) => { o.position.copy(a).addScaledVector(dd, 2 + k * 9); o.position.y += Math.sin(k * 6 + i) * .3; o.lookAt(o.position.clone().sub(dd)); o.scale.setScalar(1 + k * 2); fade(o, 1 - k); }); }
        for (let i = 0; i < 50; i++) { const s = rand(8, 16), r = d.clone().applyAxisAngle(UP, rand(-.75, .75)); emit(a.x, a.y, a.z, r.x * s, rand(-1, 2), r.z * s, shimmer(rand(0, 9)).getHex(), rand(.12, .25), .7, 0, 2); }
      } } },
    { name: 'Kaleidoscope', icon: '🔷', cd: 7, desc: 'Fire a prism shard. The enemy it hits splinters into 3 glittering false images of itself that race off to the monsters nearest it and burst against them, 50 damage within 3 m each. With no other monster around, they turn back on the enemy itself.',
      cast(p, c) { shoot(p, c, 40, { r: .35, life: 1, dmg: 20 * c.dmg }); },
      shot: { hit(s, e) {
        const c = ctxS(s); hitEnemy(e, 'illusion', s.dmg, c.p, 0, 0, 0);
        if (c.p) { fxe(s.mv, 'split', { x: e.x, y: e.y + 1, z: e.z }); for (let k = 0; k < 3; k++) ent(c.p, c, e.x, e.z, { life: 2, r: 3, src: e.id, yaw: s.vz || s.vx ? Math.atan2(s.vx, s.vz) + (k - 1) * 1.4 : k * 2.1 }); }
        return 'end';
      } },
      look: { m: 'illusion__shard', s: 1.2, spin: [0, 8, 4], trail: [() => shimmer(rand(0, 9)).getHex(), .12, .3, 0, 2], light: 4 },
      ent: { tick(n, dt) { // fan out for a moment, then home on the nearest other monster
          let dx = Math.sin(n.yaw), dz = Math.cos(n.yaw);
          const e = n.t > .25 && (nearest(n.x, n.z, 14, [n.src]) || (n.t > .5 && S.enemies.find(x => x.id === n.src && alive(x))));
          if (e) { const ex = e.x - n.x, ez = e.z - n.z, d = Math.hypot(ex, ez) || 1; if (d < 1.4 + ET[e.type].r * e.sc) { n.life = 0; return; } dx = ex / d; dz = ez / d; n.yaw = Math.atan2(dx, dz); }
          n.x += dx * 11 * dt; n.z += dz * 11 * dt;
        },
        end(n) { boomAt(ctxN(n), n.x, 1, n.z, n.r, 50 * n.mul, { kb: 4, skip: n.t > .5 && !nearest(n.x, n.z, 14, [n.src]) ? [] : [n.src] }, 'pop'); } },
      view: { make() { const o = model('illusion__mask', 0xf0a6ff); o.scale.setScalar(1.3); return o; },
        upd(o, n, dt, t) { o.position.y = 1.2 + Math.sin(t * 9 + n.id) * .15; o.rotation.y = n.yaw + Math.PI; tint(o, shimmer(t * 3 + n.id)); fade(o, (.55 + .3 * Math.sin(t * 30 + n.id)) * Math.min(1, n.t * 6));
          for (let k = 0; k < 2; k++) emit(o.position.x + rand(-.3, .3), o.position.y + rand(-.4, .4), o.position.z + rand(-.3, .3), 0, rand(0, .5), 0, shimmer(rand(0, 9)).getHex(), rand(.08, .16), .4); },
        drop: o => o.removeFromParent() },
      fx: { split(e) { burst(e.x, e.y, e.z, 30, 0xffc8ff, 6, .2, .4); flash(e.x, e.y, e.z, 0xf0a6ff, 20, .2); sfx('illusion_big'); },
        pop(e) { boomFx(e.x, e.y, e.z, e.r, 0xf0a6ff, .7); debrisFx(e.x, e.y, e.z, 8, 'illusion__shard', 0xf0a6ff, .2, 9); sfx('tink'); } } },
    { name: 'Phantasmagoria', icon: '🎪', desc: 'ULTIMATE. Trap everything within 14 m in a hall of mirrors: monsters are charmed and fight each other for 5 s, then the mirrors shatter for 120 damage to every one of them.',
      cast(p, c) { ent(p, c, p.x, p.z, { life: 5, r: 14 * c.st.aoe }); },
      ent: { tick(n) { for (const e of enemiesNear(n.x, n.z, n.r)) { if (ready(n, e, 99)) { cc(e, 'charm', n.life, own(n)); applyStatus(e, 'illusion', own(n)); } e.fs = Math.max(e.fs || 0, .3); } },
        end(n) { const c = ctxN(n); fxe(n.mv, 'shatter', { x: n.x, z: n.z, r: n.r }); for (const e of enemiesNear(n.x, n.z, n.r)) hitEnemy(e, 'illusion', 120 * n.mul, c.p, e.x - n.x, e.z - n.z, 6, { aoe: true }); } },
      view: { make(n) { const g = new THREE.Group(), m = model('illusion__mirrors', 0xf0a6ff); m.scale.set(n.r, 2.6, n.r); g.add(m); g.userData.mats = m.userData.mats.slice(); g.userData.m = m; g.userData.circle = zoneCircle('illusion', n.r, .6); g.add(g.userData.circle); sfx('illusion_big'); return g; },
        upd(o, n, dt, t) { const u = o.userData; u.m.rotation.y += dt * .25; u.m.scale.y = 2.6 * easeOutBack(Math.min(1, n.t * 2)); tint(u.m, shimmer(t)); spinCircle(u.circle, dt, .4);
          for (let k = 0; k < 4; k++) { const a = rand(0, TAU), d = rand(0, n.r); emit(n.x + Math.cos(a) * d, rand(.3, 4), n.z + Math.sin(a) * d, 0, rand(.2, .8), 0, shimmer(t + k).getHex(), rand(.1, .22), 1, -.2); } },
        drop: o => o.removeFromParent() },
      fx: { shatter(e) {
        for (let i = 0; i < 36; i++) { const a = rand(0, TAU), r0 = e.r * rand(.9, 1.05), sp = rand(6, 14), up = rand(3, 9), spin = V(rand(-8, 8), rand(-8, 8), rand(-8, 8)); modelFx('illusion__shard', 0xf0a6ff, V(e.x + Math.cos(a) * r0, rand(.5, 4.5), e.z + Math.sin(a) * r0), rand(.8, 1.3), (o, k, dt) => { o.position.x += Math.cos(a) * sp * dt; o.position.z += Math.sin(a) * sp * dt; o.position.y = Math.max(.1, o.position.y + (up - 18 * k) * dt); o.rotation.x += spin.x * dt; o.rotation.z += spin.z * dt; o.scale.setScalar(2); fade(o, 1 - k * k); }); }
        ringFx(e.x, .2, e.z, e.r * 1.2, 0xffffff, .6); flash(e.x, 3, e.z, 0xf0a6ff, 90, .5); whiteFx = .6; shake(.6); sfx('ult'); sfx('crystal_big');
      } } },
  ],
},
// ================================================================== BONE
bone: {
  name: 'Bone', color: 0xe9dcc0, glyph: '💀', adj: 'BRITTLE', react: { name: 'SPLINTER', kind: 'shatter' },
  blurb: 'A necromancer. Bone spears, cackling skulls, skeletons that burst into shrapnel, and the slain rising to fight for you.',
  passive: 'Raise Dead: monsters you kill with Bone have a 25% chance to rise as a skeleton warrior that fights for you for 12 s (up to 3 at once). Brittle enemies take 12% more damage.',
  st: { vuln: .12 },
  onKill(e, p) { if (Math.random() < .25 && !ET[e.type].boss && !e.pid && entsOf(p, 'bone.0').length < 3) raiseBone(p, e.x, e.z, e.yaw, stats(p).dmgMul); },
  moves: [
    { name: 'Bone Toss', icon: '🦴', cd: .5, desc: 'Hurl a spinning bone that pierces 2 enemies and pins the last one it hits for a moment.',
      cast(p, c) { for (let k = 0; k < c.multi; k++) shoot(p, c, 40, { d: spread(c.d, k, c.multi, .1), r: .3, dmg: 17 * c.dmg, pierce: c.st.pierce + 2, kb: 3, sc: c.mega ? 1.8 : 1 }); },
      shot: { hit(s, e, hd) { const p = own(s); hitEnemy(e, 'bone', s.dmg, p, s.vx, s.vz, s.kb, { crit: hd ? 1.5 : 1, src: { x: s.x - s.vx, z: s.z - s.vz } }); if (s.pierce <= 0) cc(e, 'root', .7, p); fxe(s.mv, 'crack', { x: s.x, y: s.y, z: s.z }); } },
      // the raised skeletons of the Raise Dead passive live on this move
      ent: { tick(n, dt) { summonAI(n, dt, 7, 1.5, .9, e => hitEnemy(e, 'bone', 13 * n.mul, own(n), e.x - n.x, e.z - n.z, 3), 18); } },
      look: { m: 'bone__bone', s: 1.3, spin: [16, 0, 2], trail: [0x8a7a60, .05, .25, 0, 1] },
      view: { make(n) { const o = model('bone__skeleton', 0xe9dcc0, { shadow: true }), P = k => o.getObjectByName('bone__skeleton_' + k); Object.assign(o.userData, { arms: [P('armL'), P('armR')], legs: [P('legL'), P('legR')], head: P('head'), s: n.s, sw: 0 }); dustFx(n.x, n.z, 1.2, 0x5a4a30); burst(n.x, .5, n.z, 30, 0xe9dcc0, 4, .3, .6, -2); sfx('bone_big'); return o; },
        upd(o, n, dt, t) {
          const u = o.userData; u.ph = (u.ph || 0) + dt * (n.v ? 11 : 2); o.rotation.y = lerpAngle(o.rotation.y, n.yaw || 0, Math.min(1, dt * 10));
          o.position.y = -2 * (1 - easeOut(Math.min(1, n.t * 2))) + Math.abs(Math.sin(u.ph)) * (n.v ? .06 : 0);
          u.legs.forEach((l, i) => { if (l) l.rotation.x = Math.sin(u.ph + i * Math.PI) * (n.v ? .7 : .05); });
          if (n.s !== u.s) { u.s = n.s; u.sw = 1; if (Math.random() < .5) sfx('bone'); }
          u.sw = Math.max(0, u.sw - dt * 4);
          if (u.arms[1]) u.arms[1].rotation.x = u.sw > 0 ? -2.2 + (1 - u.sw) * 2.8 : Math.sin(u.ph) * .3 * (n.v ? 1 : .2);
          if (u.arms[0]) u.arms[0].rotation.x = -Math.sin(u.ph) * .3 * (n.v ? 1 : .2) - .3;
          if (u.head) u.head.rotation.y = Math.sin(t * 1.3 + n.id) * .3;
          if (n.l < .1) fade(o, n.l * 10);
        },
        drop(o, n) { burst(n.x, .8, n.z, 40, 0xe9dcc0, 4, .2, .6, 8); dustFx(n.x, n.z, 1, 0x8a7a60); addFx(o, .4, (o, k) => { o.position.y = -1.8 * k; o.rotation.z = k * .8; }); } },
      fx: { crack(e) { burst(e.x, e.y, e.z, 10, 0xe9dcc0, 4, .12, .3, 6); }, det: e => boomFx(e.x, e.y, e.z, 2.5, 0xe9dcc0, .6), nova: e => boomFx(e.x, .5, e.z, 4.5, 0xe9dcc0, .8) } },
    { name: 'Cackling Skull', icon: '☠️', cd: 4, desc: 'Hurl a burning skull that bites an enemy, then leaps on to the next one, up to 5 times.',
      cast(p, c) { shoot(p, c, 24, { r: .45, life: 3, dmg: 18 * c.dmg, bounce: 5 + c.st.bounce, kb: 2, sc: 1.3 }); },
      shot: { hit(s, e) { hitEnemy(e, 'bone', s.dmg, own(s), s.vx, s.vz, s.kb); fxe(s.mv, 'bite', { x: s.x, y: s.y, z: s.z }); } },
      look: { m: 'bone__skull', c: 0x3affb0, s: 1.2, jaw: 'bone__skull_jaw', trail: [() => Math.random() < .6 ? 0x6affc8 : 0xc8b48a, .1, .35, -1.5, 1], light: 3 },
      fx: { bite(e) { burst(e.x, e.y, e.z, 10, 0xc8b48a, 5, .14, .3, 4); burst(e.x, e.y, e.z, 6, 0x6affc8, 3, .18, .4, -2); sfx('bone'); } } },
    { name: 'Marrow Burst', icon: '💥', cd: 12, desc: 'Every skeleton you have explodes in a storm of bone shrapnel: 28 damage within 3.5 m of each. Monsters the blasts kill rise as new skeletons. With no skeletons, one rises beside you instead.',
      cast(p, c) {
        const mine = entsOf(p, 'bone.0');
        if (!mine.length) { raiseBone(p, p.x - c.flat.z * 1.6, p.z + c.flat.x * 1.6, p.yaw + Math.PI, c.dmg); return; }
        for (const n of mine) {
          n.dead = true;
          const hit = boomAt(c, n.x, .8, n.z, 3.5, 28 * c.dmg, { kb: 7 }, 'marrow');
          for (const e of hit) if (e.dead && !ET[e.type].boss && !e.pid && entsOf(p, 'bone.0').length < 4) raiseBone(p, e.x, e.z, e.yaw, c.dmg);
        }
      },
      fx: { marrow(e) { burst(e.x, e.y, e.z, 40, 0xe9dcc0, 10, .14, .45, 8); debrisFx(e.x, e.y, e.z, 10, 'bone__bone', 0xe9dcc0, .3, 12); ringFx(e.x, .1, e.z, e.r, 0xe9dcc0, .35); dustFx(e.x, e.z, 1.5, 0x8a7a60); flash(e.x, e.y, e.z, 0xe9dcc0, 20, .2); sfx('bone_big'); shake(.12); } } },
    { name: 'Bone Cage', icon: '⛓️', cd: 9, mode: 'aim', range: 20, aimR: 3.5, desc: 'Ribs of bone burst from the ground at the target for 4 s: a real cage. Monsters inside cannot get out, monsters outside cannot get in, and enemy shots cannot pass the bars. Anything that touches the bars is gashed.',
      cast(p, c) { const R = 3.5 * c.st.aoe, t = c.tgt, es = enemiesNear(t.x, t.z, R); ent(p, c, t.x, t.z, { r: R, life: 4, ids: es.map(e => e.id) }); for (const e of es) hitEnemy(e, 'bone', 22 * c.dmg, p, 0, 0, 0, { aoe: true }); },
      ent: { tick(n, dt) {
        for (const e of enemiesNear(n.x, n.z, n.r + 2)) { // inside stays in, outside stays out
          if (ET[e.type].boss) continue;
          const dx = e.x - n.x, dz = e.z - n.z, d = Math.hypot(dx, dz) || .01, er = ET[e.type].r * e.sc, lim = n.ids.includes(e.id) ? Math.max(.3, n.r - .5 - er) : n.r + .5 + er;
          if (n.ids.includes(e.id) ? d > lim : d < lim) { e.x = n.x + dx / d * lim; e.z = n.z + dz / d * lim; }
        }
        for (const s of S.shots) if (s.foe && Math.abs(Math.hypot(s.x - n.x, s.z - n.z) - n.r) < .5) { s.dead = true; ev({ k: 'block', x: r2(s.x), y: r2(s.y), z: r2(s.z) }); }
        if (pulse(n, dt, .5)) for (const e of enemiesNear(n.x, n.z, n.r + .8)) if (Math.abs(Math.hypot(e.x - n.x, e.z - n.z) - n.r) < .9 + ET[e.type].r * e.sc) hitEnemy(e, 'bone', 6 * n.mul, own(n), 0, 0, 0, { aoe: true, noCombo: true });
      } },
      view: { make(n) { const o = model('bone__cage', 0xe9dcc0, { shadow: true }); o.scale.set(n.r, n.r * .75, n.r); o.rotation.y = rand(0, TAU); dustFx(n.x, n.z, n.r, 0x5a4a30); sfx('bone_big'); shake(.12); return o; },
        upd(o, n) { o.position.y = -n.r * 1.6 * (1 - easeOutBack(Math.min(1, n.t * 5))); if (n.l < .12) o.position.y = -n.r * 1.6 * (1 - n.l / .12) ** 2; },
        drop(o, n) { dustFx(n.x, n.z, n.r, 0x5a4a30); o.removeFromParent(); } } },
    { name: 'Bone Dragon', icon: '🐉', mode: 'aim', range: 24, aimR: 8, desc: 'ULTIMATE. Raise a skeletal dragon that makes three low strafing runs across the target, criss-crossing it and breathing a line of ghostfire along each pass. Everything it burns turns Brittle, and monsters it kills rise as skeletons.',
      cast(p, c) { const R = 9 * c.st.aoe, a0 = Math.atan2(p.z - c.tgt.z, p.x - c.tgt.x); ent(p, c, c.tgt.x + Math.cos(a0) * R, c.tgt.z + Math.sin(a0) * R, { life: 6.9, r: R, cx: c.tgt.x, cz: c.tgt.z, a0 }); fxe(c.m.key, 'rise', { x: c.tgt.x, z: c.tgt.z, r: R }); },
      ent: { tick(n, dt) { // flies chords of the circle: each pass ends where the next begins, crossing near the centre at a new angle
        const u = Math.max(0, n.t - .6) / 2.1, k = Math.min(2, Math.floor(u)), f = Math.min(1, u - k), P = i => { const a = n.a0 + i * (Math.PI - .7); return [n.cx + Math.cos(a) * n.r, n.cz + Math.sin(a) * n.r]; };
        const [x0, z0] = P(k), [x1, z1] = P(k + 1), L = Math.hypot(x1 - x0, z1 - z0) || 1, vx = (x1 - x0) / L, vz = (z1 - z0) / L;
        n.x = x0 + (x1 - x0) * f; n.z = z0 + (z1 - z0) * f; n.yaw = Math.atan2(vx, vz);
        if (n.t > .6 && pulse(n, dt, .2)) { const p = own(n); for (const e of blast(n.x + vx * 2.5, n.z + vz * 2.5, 3.5, 30 * n.mul, ctxN(n), { raw: true, kb: 1 })) if (e.dead && p && !ET[e.type].boss && !e.pid && entsOf(p, 'bone.0').length < 5) raiseBone(p, e.x, e.z, e.yaw, n.mul); }
      } },
      view: { make() { const o = model('bone__dragon', 0xe9dcc0, { shadow: true }), P = k => o.getObjectByName('bone__dragon_' + k); o.scale.setScalar(.8); Object.assign(o.userData, { wl: P('wingL'), wr: P('wingR'), jaw: P('jaw'), head: P('head') }); sfx('bone_big'); return o; },
        upd(o, n, dt, t) {
          const u = o.userData, vx = Math.sin(n.yaw), vz = Math.cos(n.yaw), f = Math.sin(t * 5);
          o.position.y = -3 + 8 * easeOut(Math.min(1, n.t / .8)) + Math.sin(t * 1.6) * .3; o.rotation.y = lerpAngle(o.rotation.y, n.yaw, Math.min(1, dt * 4)); o.rotation.z = 0;
          if (u.wl) u.wl.rotation.z = f * .5 - .1; if (u.wr) u.wr.rotation.z = -f * .5 + .1; if (u.jaw) u.jaw.rotation.x = .35 + Math.sin(t * 9) * .1; if (u.head) u.head.rotation.x = .35;
          fade(o, Math.min(1, n.l * 6));
          if (n.t > .6) {
            const hx = o.position.x + vx * 3.6, hy = o.position.y + .9, hz = o.position.z + vz * 3.6, bx = o.position.x + vx * 2.5, bz = o.position.z + vz * 2.5;
            for (let k = 0; k < 7; k++) { const s = rand(.8, 1.1); emit(hx, hy, hz, (bx - hx) * s + rand(-1, 1), -hy * s * 1.2, (bz - hz) * s + rand(-1, 1), Math.random() < .5 ? 0xb8ffe8 : 0xe9dcc0, rand(.3, .6), .8, 2, .3); }
            if (Math.random() < .3) flash(bx, .5, bz, 0xb8ffe8, 18, .15);
            if (Math.random() < .5) burst(bx, .2, bz, 4, 0xb8ffe8, 4, .25, .4, -2);
          }
        },
        drop(o) { addFx(o, .8, (o, k) => { o.position.y += .15; fade(o, 1 - k); }); } },
      fx: { rise(e) { circleFx('bone', V(e.x, .08, e.z), e.r, { life: 1.6 }); dustFx(e.x, e.z, e.r * .6, 0x5a4a30); burst(e.x, .5, e.z, 80, 0xe9dcc0, 8, .35, 1, -3); burst(e.x, .5, e.z, 40, 0xb8ffe8, 6, .4, 1.2, -4); shake(.4); sfx('ult'); } } },
  ],
},
// ================================================================== RUNE
rune: {
  name: 'Rune', color: 0x22e6b8, glyph: '📜', adj: 'INSCRIBED', react: { name: 'GLYPHBURST', kind: 'blast' },
  blurb: 'Ancient script. A trapper: every spell but the bolt is a ward on the ground that enemies set off by walking over it, and every third spell is Empowered.',
  passive: 'Rune Mastery: every third spell you cast is Empowered and deals 60% more damage. Inscribed enemies take 10% more damage.',
  st: { vuln: .1 },
  onCast(p, m, c) { p.bd.runeN = (p.bd.runeN || 0) + 1; if (p.bd.runeN % 3 === 0) { c.dmg *= 1.6; c.emp = 1; fxe('rune.0', 'emp', { id: p.id, x: c.o.x, y: c.o.y, z: c.o.z }); } },
  moves: [
    { name: 'Rune Bolt', icon: '🔹', cd: .4, desc: 'Fire a spinning rune that pierces through an enemy.',
      cast(p, c) { for (let k = 0; k < c.multi; k++) shoot(p, c, 38, { d: spread(c.d, k, c.multi, .1), r: .32, dmg: 13 * c.dmg, pierce: c.st.pierce + 1, sc: (c.mega ? 1.8 : 1) * (c.emp ? 1.5 : 1) }); },
      look: { m: 'rune__bolt', flat: 1, spin: [0, 0, 10], trail: [0x7affd8, .13, .3, 0, 1], light: 4 },
      fx: { emp(e) { if (isMe(e.id)) circleFx('rune', V(-.26, -.17, -.85), .26, { parent: camera, quat: Q_FACE, life: .55 }); else circleFx('rune', V(e.x, e.y, e.z), .8, { life: .5 }); sfx('tink'); },
        det: e => boomFx(e.x, e.y, e.z, 2.5, 0x22e6b8, .6), nova: e => boomFx(e.x, .5, e.z, 4.5, 0x22e6b8, .8) } },
    { name: 'Glyph Trap', icon: '🔯', cd: 4, mode: 'aim', range: 18, aimR: 2.2, desc: 'Inscribe a ward glyph at the target (up to 3 at once). It arms after a second, and the first enemy to step on it is blasted into the air and stunned.',
      cast(p, c) { placeWard(p, c, 3); },
      ent: { tick(n) { if (tripped(n)) { boomAt(ctxN(n), n.x, .2, n.z, 3, 45 * n.mul, { lift: 10, kb: 2, cc: ['stun', 1] }, 'trip'); n.dead = true; } } },
      view: wardView(),
      fx: { trip(e) { boomFx(e.x, e.y, e.z, e.r, 0x22e6b8, .9); pillarFx(e.x, .05, e.z, e.r * .5, 7, 0x22e6b8, .6); modelFx('rune__glyph', 0x22e6b8, V(e.x, .5, e.z), .6, (o, k) => { o.position.y = .5 + k * 4; o.rotation.x = -Math.PI / 2; o.scale.setScalar(e.r * (.6 + k)); fade(o, 1 - k); }, { flat: true }); sfx('rune_big'); } } },
    { name: 'Sigilfall', icon: '🪨', cd: 6, mode: 'aim', range: 22, aimR: 2.6, desc: 'Inscribe a sigil ward (up to 2 at once). When an enemy steps on it, runic chains hold everything nearby and three runestones crash down, the last and largest stunning everything it hits.',
      cast(p, c) { placeWard(p, c, 2, { r: 2.6, R: 3.5 * c.st.aoe }); },
      ent: { tick(n) {
        if (!tripped(n)) return;
        n.dead = true; const c = ctxN(n), t = V(n.x, 0, n.z), R = n.R; fxe(c.m.key, 'mark', { x: t.x, z: t.z, r: R });
        for (const e of enemiesNear(t.x, t.z, R)) cc(e, 'root', 1.3, c.p);
        for (let i = 0; i < 3; i++) {
          const a = rand(0, TAU), last = i === 2, q = last ? t.clone() : V(t.x + Math.cos(a) * 1.4, 0, t.z + Math.sin(a) * 1.4);
          later(.1 + i * .25, () => { fxe(c.m.key, 'fall', { x: q.x, z: q.z, s: last ? 1.3 : .85 }); later(.32, () => boomAt(c, q.x, .2, q.z, last ? R : 2.2, (last ? 50 : 30) * c.dmg, { kb: 4, ...(last ? { cc: ['stun', 1.2] } : {}) }, 'slam')); });
        }
      } },
      view: wardView('rune__stone', .45),
      fx: { mark(e) { circleFx('rune', V(e.x, .08, e.z), e.r, { life: 1.4 }); modelFx('rune__glyph', 0x22e6b8, V(e.x, 14, e.z), 1.3, (o, k) => { o.rotation.x = Math.PI / 2; o.rotation.z = k * 2; o.scale.setScalar(e.r * .9); fade(o, k < .2 ? k * 5 : 1 - (k - .2) / .8); }, { flat: true }); sfx('rune'); },
        fall(e) { const spin = rand(-1, 1); modelFx('rune__stone', 0x22e6b8, V(e.x, 20, e.z), .33, (o, k) => { o.position.y = 20 * (1 - k * k); o.rotation.set(.15, spin * k, 0); o.scale.setScalar(e.s); for (let i = 0; i < 2; i++) emit(o.position.x + rand(-.5, .5), o.position.y + 2 * e.s, o.position.z + rand(-.5, .5), 0, 4, 0, 0x7affd8, .25, .4); }, { shadow: true }); },
        slam(e) {
          dustFx(e.x, e.z, e.r); ringFx(e.x, .1, e.z, e.r, 0x22e6b8, .45); burst(e.x, .5, e.z, 30, 0x7affd8, 6, .25, .5, 4); flash(e.x, 1, e.z, 0x22e6b8, 30, .25); shake(.2); sfx('rune_big');
          const s = model('rune__stone', 0x22e6b8, { shadow: true }); s.position.set(e.x, 0, e.z); s.rotation.set(rand(-.15, .15), rand(0, TAU), rand(-.15, .15)); s.scale.setScalar(e.r > 3 ? 1.3 : .85);
          addFx(s, 1.6, (o, k) => { o.position.y = k > .7 ? -2.8 * ((k - .7) / .3) ** 2 : 0; if (k > .8) fade(o, 1 - (k - .8) / .2); });
        } } },
    { name: 'Binding Circle', icon: '🔘', cd: 12, mode: 'aim', range: 20, aimR: 2.2, desc: 'Inscribe a binding ward. When an enemy steps on it, a great binding circle springs up for 6 s: enemies inside are slowed by 40%, take 25% more damage from everything, and are scorched by the runes every second.',
      cast(p, c) { placeWard(p, c, 1, { R: 6 * c.st.aoe }); },
      ent: { tick(n, dt) {
        if (!n.s) { if (tripped(n)) Object.assign(n, { s: 1, r: n.R, t: 0, life: 6, max: 6 }); return; } // the ward goes off: the same entity lives on as the circle
        const es = enemiesNear(n.x, n.z, n.r); for (const e of es) { e.fs = Math.max(e.fs || 0, .4); e.fv = .25; e.fvU = S.t + .2; } if (pulse(n, dt, 1)) for (const e of es) hitEnemy(e, 'rune', 10 * n.mul, own(n), 0, 0, 0, { aoe: true });
      } },
      view: { make: n => wardMake(n, 'rune__glyph', .5),
        upd(o, n, dt, t) {
          const u = o.userData;
          if (!n.s) { wardUpd(o, n, dt, t); return; }
          if (!u.circle) { // build the circle the moment the ward goes off
            u.ward.visible = u.top.visible = false; u.circle = zoneCircle('rune', n.r, .85); o.add(u.circle); u.stones = [];
            for (let i = 0; i < 6; i++) { const s = model('rune__stone', 0x22e6b8, { shadow: true }), a = TAU * i / 6; s.scale.setScalar(.55); s.position.set(Math.cos(a) * n.r, 0, Math.sin(a) * n.r); s.rotation.y = -a + Math.PI / 2; o.add(s); u.mats.push(...s.userData.mats); u.stones.push(s); }
            sfx('rune_big'); dustFx(n.x, n.z, n.r * .5, 0x5a5048); flash(n.x, 1, n.z, 0x22e6b8, 40, .3);
          }
          fade(o, 1); spinCircle(u.circle, dt, .35); u.stones.forEach((s, i) => { s.position.y = -1.4 * (1 - easeOutBack(clamp(n.t * 3 - i * .1, 0, 1))) + Math.sin(t * 2 + i) * .05; }); if (Math.random() < .4) { const a = rand(0, TAU), d = rand(0, n.r); emit(n.x + Math.cos(a) * d, .15, n.z + Math.sin(a) * d, 0, rand(.4, 1.2), 0, 0x7affd8, rand(.08, .16), 1, -.2); }
        },
        drop: dropFade() } },
    { name: 'Word of Ruin', icon: '📖', mode: 'aim', range: 22, aimR: 3.5, desc: 'ULTIMATE. Inscribe the word of ruin as a great ward. When an enemy steps on it, a great rune ignites over every enemy within 20 m of it (up to 12), then each one slams down for 90 damage and a 1.5 s stun.',
      cast(p, c) { placeWard(p, c, 1, { r: 3.5, life: 60, R: 20 * c.st.aoe }); },
      ent: { tick(n) {
        if (!tripped(n)) return;
        n.dead = true; const c = ctxN(n), p = c.p, es = enemiesNear(n.x, n.z, n.R).slice(0, 12); fxe(c.m.key, 'speak', { x: n.x, y: 0, z: n.z });
        es.forEach((e, i) => { fxe(c.m.key, 'mark', { id: e.id, d: .6 + i * .1 }); later(.6 + i * .1, () => { if (!alive(e)) return; const q = center(e); fxe(c.m.key, 'ruin', { x: e.x, y: q.y, z: e.z }); hitEnemy(e, 'rune', 90 * c.dmg, p, 0, 0, 4, { aoe: true }); cc(e, 'stun', 1.5, p); launch(e, 5); }); });
      } },
      view: wardView('rune__glyph', .8),
      fx: { speak(e) { circleFx('rune', V(e.x, e.y + .08, e.z), 5, { life: 1.4 }); pillarFx(e.x, e.y + .05, e.z, 2.5, 10, 0x22e6b8, 1); flash(e.x, 2, e.z, 0x22e6b8, 60, .5); sfx('rune_big'); },
        mark(e) { modelFx('rune__glyph', 0x22e6b8, V(0, -50, 0), e.d, (o, k) => { const v = views.e.get(e.id); if (v) o.position.set(v.g.position.x, v.g.position.y + 5 + Math.sin(k * 8) * .2, v.g.position.z); o.lookAt(camera.position); o.scale.setScalar(1.3 * easeOutBack(Math.min(1, k * 4))); fade(o, .8 + .2 * Math.sin(k * 30)); }, { flat: true }); },
        ruin(e) { modelFx('rune__glyph', 0x22e6b8, V(e.x, e.y + 5, e.z), .25, (o, k) => { o.position.y = e.y + 5 - 5 * k; o.rotation.x = -Math.PI / 2; o.scale.setScalar(1.3 + k * 1.5); fade(o, 1 - k); }, { flat: true }); boomFx(e.x, e.y, e.z, 3, 0x22e6b8, 1); pillarFx(e.x, .05, e.z, 1.2, 7, 0x22e6b8, .5); shake(.15); sfx('rune_big'); } } },
  ],
},
// ================================================================== PLASMA
plasma: {
  name: 'Plasma', color: 0xff3ca8, glyph: '⚛️', adj: 'IONIZED', react: { name: 'FUSION', kind: 'blast' },
  blurb: 'Raw, unstable power. Every Plasma spell builds Heat that makes you hit harder, right up until you overheat.',
  passive: 'Heat: Plasma spells build Heat, which adds up to 50% damage. At 100 Heat you overheat: you vent in a burst and your Plasma spells lock for 2.5 s. Heat cools off on its own. Ionized enemies burn.',
  st: { dot: 5, vuln: .08 },
  onCast(p, m, c) {
    if (!m.heat || p.bf.fusion > 0) return;
    p.bd.heat = (p.bd.heat || 0) + m.heat;
    if (p.bd.heat < 100) return;
    p.bd.heat = 0; buff(p, 'overheat', 2.5);
    boomAt({ ...c, m: MOVE['plasma.2'] }, p.x, p.y + 1, p.z, 4, 25 * c.dmg, { kb: 9 }, 'vent');
  },
  moves: [
    { name: 'Plasma Bolt', icon: '🔴', cd: .28, heat: 9, desc: 'Rapid bolts of superheated plasma that splash on impact. Builds Heat.',
      cast(p, c) { for (let k = 0; k < c.multi; k++) shoot(p, c, 42, { d: spread(c.d, k, c.multi, .08), r: .3, dmg: 11 * c.dmg, sc: c.mega ? 1.8 : 1 }); },
      shot: { hit(s, e, hd) { hitEnemy(e, 'plasma', s.dmg, own(s), s.vx, s.vz, 2, { crit: hd ? 1.5 : 1, src: { x: s.x - s.vx, z: s.z - s.vz } }); return 'end'; },
        end(s, why, e) { if (why !== 'life') boomAt(ctxS(s), s.x, Math.max(s.y, .1), s.z, 1.4, 4 * s.mul, { kb: 1, skip: e ? [e.id] : null, noStatus: true }, 'pop'); } },
      look: { m: 'plasma__bolt', spin: [0, 0, 14], trail: [() => Math.random() < .5 ? 0xff5ac0 : 0xffd0f0, .12, .22, 0, 2], light: 6 },
      fx: { pop(e) { burst(e.x, e.y, e.z, 12, 0xff8ad0, 5, .14, .3, 2); flash(e.x, e.y, e.z, 0xff3ca8, 10, .12); },
        det: e => boomFx(e.x, e.y, e.z, 2.5, 0xff3ca8, .6), nova: e => boomFx(e.x, .5, e.z, 4.5, 0xff3ca8, .8) } },
    { name: 'Plasma Cannon', icon: '🟣', cd: 3.5, heat: 24, mode: 'charge', charge: 1.1, desc: 'Hold to charge a sphere of plasma, then release to fire it. It detonates in a blast that grows with the charge. Builds a lot of Heat.',
      cast(p, c) { const k = c.k; shoot(p, c, 28 + 12 * k, { r: .4 + .3 * k, life: 2, dmg: (25 + 60 * k) * c.dmg, sc: .55 + .75 * k, ck: k }); },
      shot: { hit: () => 'end', end(s) { boomAt(ctxS(s), s.x, Math.max(s.y, .2), s.z, 2 + 2.5 * s.ck, s.dmg, { kb: 5 + 7 * s.ck }); } },
      look: { m: 'plasma__orb', spin: [2, 3, 0], trail: [() => Math.random() < .5 ? 0xff3ca8 : 0xffffff, .25, .3, 0, 3], light: 9, flick: 1 },
      fx: { boom(e) { boomFx(e.x, e.y, e.z, e.r, 0xff3ca8, 1.1); meshFx(T.overload, V(e.x, e.y, e.z), .45, .3, e.r * .9, 2); ringFx(e.x, .1, e.z, e.r * 1.3, 0xffd0f0, .5); } } },
    { name: 'Vent', icon: '🌡️', cd: 7, desc: 'Dump all your Heat in a shockwave around you. The more Heat you vent, the harder it hits (up to 110 damage) and the further it throws.',
      cast(p, c) { const h = p.bd.heat || 0; p.bd.heat = 0; boomAt(c, p.x, p.y + 1, p.z, 4 + h / 30, (20 + .9 * h) * c.dmg, { kb: 6 + h / 8 }, 'vent'); },
      fx: { vent(e) { boomFx(e.x, e.y, e.z, e.r, 0xff3ca8, 1.2); ringFx(e.x, e.y - .8, e.z, e.r * 1.2, 0xffd0f0, .5); for (let i = 0; i < 40; i++) { const a = rand(0, TAU); emit(e.x, e.y, e.z, Math.cos(a) * rand(5, 12), rand(0, 4), Math.sin(a) * rand(5, 12), Math.random() < .4 ? 0xffffff : 0xff6ac0, rand(.3, .6), .6, -1, 2); } sfx('plasma_big'); } } },
    { name: 'Thermal Lance', icon: '🗡️', cd: 6, heat: 20, desc: 'Thrust a thin, white-hot lance of plasma 12 m straight ahead, piercing every enemy in the line for 40 and driving them back. Above 50 Heat it also leaves a burning line on the floor for 3 s.',
      cast(p, c) {
        const f = c.flat; for (const h of rayHits(V(p.x, p.y + 1, p.z), f, 12, .8)) hitEnemy(h.e, 'plasma', 40 * c.dmg, p, f.x, f.z, 7, { src: p });
        if ((p.bd.heat || 0) > 50) ent(p, c, p.x + f.x * 12, p.z + f.z * 12, { life: 3, r: .9, fx0: p.x + f.x * 1.2, fz0: p.z + f.z * 1.2 });
      },
      ent: { tick(n, dt) { if (pulse(n, dt, .4)) for (const e of nearSeg(n, n.r)) hitEnemy(e, 'plasma', 6 * n.mul, own(n), 0, 0, 0, { aoe: true, noCombo: true }); } },
      view: segView(0xff3ca8, .4),
      fx: { cast(e) {
        const yaw = Math.atan2(e.d[0], e.d[2]), f = V(Math.sin(yaw), 0, Math.cos(yaw)), a = V(e.x, e.y + 1, e.z), b = a.clone().addScaledVector(f, 12);
        beamFx(a, b, 0xffffff, .06, .2); beamFx(a, b, 0xff3ca8, .22, .3);
        modelFx('plasma__blade', 0xff3ca8, a.clone(), .25, (o, k) => { o.position.copy(a).addScaledVector(f, 1 + 10 * easeOut(k)); o.rotation.set(0, yaw + Math.PI / 2, 0); o.scale.set(.6, 1, 1.6); fade(o, 1 - k * k); });
        for (let i = 0; i < 36; i++) { const q = a.clone().addScaledVector(f, rand(1, 12)); emit(q.x, q.y + rand(-.15, .15), q.z, f.x * 6 + rand(-1, 1), rand(0, 1.5), f.z * 6 + rand(-1, 1), Math.random() < .4 ? 0xffffff : 0xff5ac0, rand(.1, .22), .35, 0, 2); }
      } } },
    { name: 'Fusion Beam', icon: '☢️', desc: 'ULTIMATE. Fire a colossal beam of plasma for 4 s that follows your aim and melts everything in its path. You cannot overheat meanwhile.',
      cast(p, c) { buff(p, 'fusion', 4); p.bd.heat = 0; ent(p, c, p.x, p.z, { follow: 1, life: 4, r: 40 }); },
      ent: { tick(n, dt) { const p = own(n); if (!p || p.down) { n.life = 0; return; } if (pulse(n, dt, .1)) { const o = eyeOf(p), d = aimOf(p); for (const h of rayHits(o, d, n.r, 1.2)) hitEnemy(h.e, 'plasma', 15 * n.mul, p, d.x, d.z, 1.5, { src: p }); } } },
      view: { make() { const g = new THREE.Group(), u = g.userData; u.mats = []; u.core = beamMesh(0xffffff, .2); u.outer = beamMesh(0xff3ca8, .7); u.ball = model('plasma__orb', 0xff3ca8); scene.add(u.core, u.outer, u.ball); sfx('plasma_big'); return g; },
        upd(o, n, dt, t) {
          const u = o.userData, a = handPos(n.own), q = n.own === myId ? null : srcState()?.players[n.own], d = q ? aimOf({ yaw: q.yaw, pitch: q.pitch || 0 }) : camera.getWorldDirection(V());
          const L = d.y < -.01 ? Math.min(40, -a.y / d.y) : 40, b = a.clone().addScaledVector(d, L), w = Math.min(1, n.t * 5, n.l * 10) * (n.own === myId ? .32 : 1); // thinner in your own view, so the camera stays outside it
          aimBeam(u.core, a, b, .2 * w * (1 + .25 * Math.sin(t * 55))); aimBeam(u.outer, a, b, .75 * w * (1 + .12 * Math.sin(t * 21)));
          u.ball.position.copy(a); u.ball.scale.setScalar((n.own === myId ? .5 : .6) * w); u.ball.rotation.z += dt * 9;
          burst(b.x, b.y + .2, b.z, 6, 0xffd0f0, 8, .3, .35, -2); if (Math.random() < .5) flash(b.x, b.y + .5, b.z, 0xff3ca8, 25, .1);
          if (b.y < .3 && Math.random() < .25) scarFx(b.x, b.z, .8, 0xff3ca8, 3); // a molten scar where the beam drags across the floor
          if (n.own === myId) shake(.025);
        },
        drop(o) { const u = o.userData; for (const m of [u.core, u.outer, u.ball]) m.removeFromParent(); o.removeFromParent(); } } },
  ],
},
// ================================================================== SOUL
soul: {
  name: 'Soul', color: 0x8cb4ff, glyph: '🪔', adj: 'SOULBURNED', react: { name: 'SOUL RIP', kind: 'drain' },
  blurb: 'A reaper. Harvest a soul from every kill to grow stronger, and cut down the weak in a single swing.',
  passive: 'Soulbound: every kill gives you a Soul (up to 15; elites give 2, bosses 5). Each Soul you hold makes your spells 4% stronger, and getting hit makes you drop 2. Reap and Soul Rend tear out extra Souls; Soulstorm and The Reaper spend them. Soulburned enemies burn.',
  st: { dot: 4 },
  moves: [
    { name: 'Soulfire', icon: '💙', cd: .42, desc: 'Fire bolts of pale soulfire that burn whatever they touch.',
      cast(p, c) { for (let k = 0; k < c.multi; k++) shoot(p, c, 34, { d: spread(c.d, k, c.multi, .1), r: .3, dmg: 12 * c.dmg, sc: c.mega ? 1.8 : 1 }); },
      look: { m: 'soul__flame', trail: [() => Math.random() < .5 ? 0x8cb4ff : 0xe0ecff, .16, .45, -1, 2], light: 4 },
      fx: { harvest(e) { // a kill's soul flies to its harvester
        const from = V(e.x, e.y, e.z), to = () => { const q = e.id === myId ? me() : srcState()?.players[e.id]; return q ? V(q.x, q.y + 1.2, q.z) : null; };
        modelFx('soul__flame', 0x8cb4ff, from.clone(), .8, (o, k) => { const q = to(); if (q) { const p = from.clone().lerp(q, easeOut(k)); p.y += Math.sin(k * Math.PI) * 1.5; o.lookAt(p); o.position.copy(p); } fade(o, 1 - k * k * k); });
        if (isMe(e.id)) sfx('orb');
      }, det: e => boomFx(e.x, e.y, e.z, 2.5, 0x8cb4ff, .6), nova: e => boomFx(e.x, .5, e.z, 4.5, 0x8cb4ff, .8) } },
    { name: 'Reap', icon: '🌒', cd: 5, desc: 'Wind up and sweep a spectral scythe through everything in front of you (6.5 m), flinging them aside. Monsters left under 20% health are reaped outright (not bosses), and each one reaped gives you an extra Soul.',
      cast(p, c) { later(.16, () => { // the blade lands partway through the swing
        if (p.down) return; const f = flatAim(p); let hit = 0;
        for (const e of coneHits(p, 6.5, 160)) {
          hit = 1; hitEnemy(e, 'soul', 30 * c.dmg, p, -f.z + (e.x - p.x) * .1, f.x + (e.z - p.z) * .1, 5, { src: p }); // flung along the swing, to your right
          if (!e.dead && !ET[e.type].boss && !e.pid && e.hp < e.max * .2) { const q = center(e); fxe(c.m.key, 'reap', { x: q.x, y: q.y, z: q.z }); damage(e, e.hp + 1, 'soul', p, { raw: true }); if (p.cur === 'soul') p.bd.souls = Math.min(15, (p.bd.souls || 0) + 1); }
        }
        if (hit) S.hitstop = Math.max(S.hitstop, .05);
      }); },
      fx: { cast(e) { // wind up behind you, then a fast sweep from left to right with ghost afterimages and a crescent of soulfire
          const yaw = Math.atan2(e.d[0], e.d[2]), ang = k => k < .25 ? 1.4 + .45 * easeOut(k / .25) : 1.85 - 3.5 * easeOut((k - .25) / .75);
          for (let j = 0; j < 4; j++) modelFx('soul__scythe', 0x8cb4ff, V(e.x, e.y + .75, e.z), .42 + j * .05, (o, k) => { const kk = Math.max(0, k - j * .07); o.rotation.set(0, yaw - Math.PI / 2 + ang(kk), 0); o.scale.setScalar(2); fade(o, (1 - k * k) * (j ? .3 / j : .9) * (j && kk < .25 ? 0 : 1)); });
          const m = energyMat(0x8cb4ff, true, true); m.side = THREE.DoubleSide; const arc = new THREE.Mesh(REAP_ARC, m); arc.userData.mats = [m]; arc.position.set(e.x, e.y + .4, e.z); arc.rotation.set(-.3, yaw, 0, 'YXZ'); arc.visible = false;
          addFx(arc, .55, (o, k) => { const a = (k - .35) / .65; o.visible = a > 0; if (a > 0) { o.scale.setScalar(.85 + .25 * easeOut(a)); fade(o, (1 - a) * .5); } if (k > .29 && !o.userData.hit) { o.userData.hit = 1; spray(); } });
          const spray = () => { for (let i = 0; i < 30; i++) { const a = yaw + rand(-1.35, 1.35), d = rand(3, 6.5); emit(e.x + Math.sin(a) * d, e.y + .9 + rand(-.3, .3), e.z + Math.cos(a) * d, -Math.cos(a) * 7, rand(0, 1.5), Math.sin(a) * 7, Math.random() < .5 ? 0x8cb4ff : 0xe0ecff, rand(.08, .2), .5, 0, 2); } if (isMe(e.id)) shake(.15); sfx('steel'); };
          sfx('soul_big');
        },
        reap(e) { modelFx('soul__flame', 0x8cb4ff, V(e.x, e.y, e.z), 1, (o, k) => { o.position.y = e.y + k * 4; o.scale.setScalar(1.1 - k * .6); o.rotation.x = -Math.PI / 2; fade(o, (1 - k) * .8); }); burst(e.x, e.y, e.z, 26, 0x8cb4ff, 6, .16, .5, -2); flash(e.x, e.y, e.z, 0x8cb4ff, 25, .2); popNum(e.x, e.y + 1.4, e.z, 'REAPED', '#8cb4ff', 'tag'); sfx('soul_big'); } } },
    { name: 'Soul Rend', icon: '🫀', cd: 8, desc: 'A pale ghostly hand reaches into the first enemy it touches and rips a see-through copy of it out of its body: 35 damage, a 1 s stun, and 2 Souls for you. The enemy is left Hollowed for 4 s and takes 25% more damage from Soul.',
      cast(p, c) { shoot(p, c, 34, { r: .5, life: .9, dmg: 35 * c.dmg }); },
      shot: { hit(s, e) { const p = own(s), q = center(e); hitEnemy(e, 'soul', s.dmg, p, 0, 0, 0); cc(e, 'stun', 1, p); e.hol = S.t + 4; if (p.cur === 'soul') p.bd.souls = Math.min(15, (p.bd.souls || 0) + 2); fxe(s.mv, 'rend', { x: q.x, y: q.y, z: q.z, id: s.own }); return 'end'; } },
      look: { m: 'soul__flame', s: 1.5, trail: [0xb8d0ff, .22, .4, -1, 3], light: 6 },
      fx: { rend(e) { // a pale silhouette is torn out of the enemy and dragged to your hand
          const from = V(e.x, e.y, e.z); burst(e.x, e.y, e.z, 30, 0x8cb4ff, 6, .3, .5); popNum(e.x, e.y + 1.4, e.z, 'HOLLOWED', '#8cb4ff', 'tag');
          const g = ghostWizard(0xb8d0ff); g.position.copy(from).setY(e.y - 1); addFx(g, .6, (o, k) => { const h = handPos(e.id); o.position.lerpVectors(V(e.x, e.y - 1, e.z), h.clone().setY(h.y - 1), k * k); o.lookAt(h.x, o.position.y, h.z); o.scale.setScalar(1 - k * .7); fade(o, (1 - k) * .55); });
          beamFx(handPos(e.id), from, 0x8cb4ff, .07, .35); sfx('soul_big'); } } },
    { name: 'Soulstorm', icon: '🌀', cd: 10, desc: 'Unleash your Souls as shrieking soul missiles that hunt down enemies: 2 for every Soul you hold (at least 4), 14 damage each. Spends your Souls.',
      cast(p, c) {
        const n = Math.max(4, 2 * (p.bd.souls || 0)); p.bd.souls = 0; fxe(c.m.key, 'storm', { x: p.x, y: p.y, z: p.z, n });
        for (let i = 0; i < n; i++) later(i * .035, () => { if (p.down) return; const a = TAU * i / n; shoot(p, c, 16, { o: V(p.x + Math.cos(a) * 2, p.y + 2.7, p.z + Math.sin(a) * 2), d: V(Math.cos(a), .8, Math.sin(a)).normalize(), r: .35, life: 3, dmg: 14 * c.dmg, home: 7 }); }); // a ring well clear of your own view
      },
      look: { m: 'soul__flame', trail: [() => Math.random() < .5 ? 0x8cb4ff : 0xe0ecff, .14, .4, -1, 2], light: 3 },
      fx: { storm(e) { // the souls spiral up round you in a tall column before they dive
          ringFx(e.x, e.y + .1, e.z, 3, 0x8cb4ff, .5); sfx('soul_big');
          for (let i = 0; i < 40 + e.n * 3; i++) { const a = TAU * i / 12, h = i * .09; emit(e.x + Math.cos(a) * 2, e.y + .3 + h, e.z + Math.sin(a) * 2, -Math.sin(a) * 6, 4 + h, Math.cos(a) * 6, i % 3 ? 0x8cb4ff : 0xe0ecff, rand(.12, .22), .7, -1, 1); }
        } } },
    { name: 'The Reaper', icon: '💀', mode: 'aim', range: 20, aimR: 9, desc: 'ULTIMATE. Summon the Reaper at the target. It spends your Souls: its scythe sweeps round three times, plus once more for every 3 Souls spent (up to 8 sweeps), cutting everything within 9 m for 50 and reaping any monster left under 25% health.',
      cast(p, c) { const sw = 3 + Math.min(5, Math.floor((p.bd.souls || 0) / 3)); p.bd.souls = 0; ent(p, c, c.tgt.x, c.tgt.z, { life: 1.6 + sw * .6, r: 9 * c.st.aoe, sw }); },
      ent: { tick(n) { // a sweep every 0.6 s from 1 s in
        if (n.s >= n.sw || n.t < 1 + n.s * .6) return;
        n.s++; const c = ctxN(n); fxe(n.mv, 'sweep', { x: n.x, z: n.z, r: n.r });
        for (const e of enemiesNear(n.x, n.z, n.r)) { hitEnemy(e, 'soul', 50 * n.mul, c.p, e.x - n.x, e.z - n.z, 5, { aoe: true }); if (!e.dead && !ET[e.type].boss && !e.pid && e.hp < e.max * .25) { const q = center(e); fxe('soul.1', 'reap', { x: q.x, y: q.y, z: q.z }); damage(e, e.hp + 1, 'soul', c.p, { raw: true }); } }
      } },
      view: { make(n) { const o = model('soul__reaper', 0x8cb4ff), u = o.userData; u.s = n.s; u.spin = 0; u.circle = zoneCircle('soul', n.r, .5); u.circle.position.set(n.x, .07, n.z); scene.add(u.circle); sfx('soul_big'); return o; },
        upd(o, n, dt, t) {
          const u = o.userData; o.scale.setScalar(n.r / 6); o.position.y = -6 * (1 - easeOut(Math.min(1, n.t * 1.4))) + .6 + Math.sin(t * 1.5) * .2;
          if (n.s !== u.s) { u.s = n.s; u.spin = 1; }
          if (u.spin > 0) { u.spin = Math.max(0, u.spin - dt * 2.2); o.rotation.y -= dt * TAU * 2.2; }
          fade(o, Math.min(1, n.l * 5)); spinCircle(u.circle, dt, .5); setOpacity(u.circle.userData.mats, Math.min(.5, n.l * 3));
          if (Math.random() < .5) emit(n.x + rand(-1, 1), rand(.2, 2), n.z + rand(-1, 1), 0, rand(.3, 1), 0, 0x8cb4ff, rand(.2, .4), 1, -.3);
        },
        drop(o) { o.userData.circle.removeFromParent(); dropFade(.4)(o); } },
      fx: { sweep(e) { ringFx(e.x, 1, e.z, e.r, 0x8cb4ff, .45); ringFx(e.x, .1, e.z, e.r * 1.1, 0xe0ecff, .5); for (let i = 0; i < 60; i++) { const a = rand(0, TAU), d = rand(1, e.r); emit(e.x + Math.cos(a) * d, rand(.5, 2.5), e.z + Math.sin(a) * d, Math.sin(a) * 9, rand(0, 1), -Math.cos(a) * 9, Math.random() < .5 ? 0x8cb4ff : 0xe0ecff, rand(.15, .35), .5, 0, 2); } shake(.3); sfx('soul_big'); sfx('steel_big'); } } },
  ],
},
// ================================================================== ABYSS
abyss: {
  name: 'Abyss', color: 0x4a3cff, glyph: '🐙', adj: 'DROWNED', react: { name: 'UNDERTOW', kind: 'pull' },
  blurb: 'Something ancient lives below. Tentacles erupt from the floor to seize, crush and drag your enemies under.',
  passive: 'Lurker Below: each Abyss hit has a 20% chance to make a tentacle burst up under the enemy and lash it for 18 more damage. Drowned enemies are 25% slower.',
  st: { slow: .25 },
  onHit(e, p) { if (Math.random() < .2) { fxe('abyss.0', 'lash', { x: e.x, z: e.z, s: ET[e.type].r * e.sc }); later(.2, () => { if (!e.dead) damage(e, 18 * stats(p).dmgMul, 'abyss', p); }); } },
  moves: [
    { name: 'Void Bolt', icon: '🔵', cd: .42, desc: 'Fire a bolt of black water that bursts on impact, splashing the enemies around it.',
      cast(p, c) { for (let k = 0; k < c.multi; k++) shoot(p, c, 34, { d: spread(c.d, k, c.multi, .1), r: .32, dmg: 13 * c.dmg, sc: c.mega ? 1.8 : 1 }); },
      shot: { hit(s, e, hd) { hitEnemy(e, 'abyss', s.dmg, own(s), s.vx, s.vz, 2, { crit: hd ? 1.5 : 1, src: { x: s.x - s.vx, z: s.z - s.vz } }); return 'end'; },
        end(s, why, e) { if (why !== 'life') boomAt(ctxS(s), s.x, Math.max(s.y, .1), s.z, 1.8, 5 * s.mul, { kb: 1, skip: e ? [e.id] : null, noStatus: true }, 'splash'); } },
      look: { m: 'abyss__orb', trail: [() => Math.random() < .6 ? 0x2a1a80 : 0x8a7aff, .18, .35, 0, 2], light: 3 },
      fx: { splash(e) { burst(e.x, e.y, e.z, 16, 0x2a1a80, 5, .25, .45, 6); burst(e.x, e.y, e.z, 8, 0x8a7aff, 4, .15, .3); },
        lash(e) { // the passive's tentacle: bursts up, curls over and whips down, then sinks away
          const o = model('abyss__tentacle', 0x4a3cff), s = .55 + e.s * .3; o.position.set(e.x + rand(-.4, .4), 0, e.z + rand(-.4, .4)); o.rotation.y = rand(0, TAU);
          addFx(o, .7, (o, k) => { o.scale.setScalar(s * (k < .25 ? easeOut(k / .25) : 1)); o.position.y = k > .6 ? -3 * s * ((k - .6) / .4) ** 2 : 0; curlTentacle(o, k < .3 ? -.4 : 1.6 * Math.min(1, (k - .3) * 4), k * 12, .1); if (k > .7) fade(o, 1 - (k - .7) / .3); });
          burst(e.x, .2, e.z, 14, 0x2a1a80, 4, .3, .5, -2); sfx('abyss');
        },
        det: e => boomFx(e.x, e.y, e.z, 2.5, 0x4a3cff, .6), nova: e => boomFx(e.x, .5, e.z, 4.5, 0x4a3cff, .8) } },
    { name: 'Grasp of the Deep', icon: '🦑', cd: 6, mode: 'aim', range: 20, aimR: 3.5, desc: 'A great tentacle erupts at the target and seizes every enemy there, hoisting them into the air. Then it hurls the biggest one at the nearest other monster (within 14 m): 45 to both and a splash around the landing. The rest are slammed into the floor.',
      cast(p, c) { const t = c.tgt, R = 3.5 * c.st.aoe, es = enemiesNear(t.x, t.z, R); ent(p, c, t.x, t.z, { life: 1.5, r: R, ids: es.map(e => e.id) }); for (const e of es) { hitEnemy(e, 'abyss', 16 * c.dmg, p, 0, 0, 0, { aoe: true }); cc(e, 'lift', 1.1, p); } },
      ent: { end(n) {
        const c = ctxN(n), held = n.ids.map(id => S.enemies.find(x => x.id === id && alive(x))).filter(e => e && !ET[e.type].boss).sort((a, b) => ET[b.type].r * b.sc - ET[a.type].r * a.sc);
        const thrown = held[0], tg = thrown && nearest(n.x, n.z, 14, n.ids);
        boomAt(c, n.x, 0, n.z, n.r, 30 * n.mul, { kb: 3, skip: tg ? [thrown.id] : [] }, 'slam');
        if (!tg) return;
        fxe(n.mv, 'hurl', { x: thrown.x, y: thrown.y + 1, z: thrown.z, x2: tg.x, z2: tg.z });
        thrown.x = tg.x + rand(-.6, .6); thrown.z = tg.z + rand(-.6, .6); if (thrown.cc?.type === 'lift') thrown.cc = null; thrown.y = 1.5; thrown.vy = -10;
        hitEnemy(thrown, 'abyss', 45 * n.mul, c.p, 0, 0, 0, { aoe: true }); hitEnemy(tg, 'abyss', 45 * n.mul, c.p, tg.x - n.x, tg.z - n.z, 6, { aoe: true }); boomAt(c, tg.x, .3, tg.z, 2.5, 15 * n.mul, { kb: 4, skip: [thrown.id, tg.id] }, 'slam');
      } },
      view: { make(n) {
          const g = new THREE.Group(), u = g.userData; u.mats = []; u.ts = [];
          for (let i = 0; i < 1; i++) { const t = model('abyss__tentacle', 0x4a3cff, { shadow: true }), a = TAU * i / 5, big = i === 0; if (!big) t.position.set(Math.cos(a) * n.r * .75, 0, Math.sin(a) * n.r * .75); t.rotation.y = big ? rand(0, TAU) : Math.atan2(-Math.cos(a), -Math.sin(a)); t.userData.s = big ? n.r * .7 : .7; g.add(t); u.mats.push(...t.userData.mats); u.ts.push(t); }
          u.circle = zoneCircle('abyss', n.r, .6); g.add(u.circle); dustFx(n.x, n.z, n.r, 0x2a2440); sfx('abyss_big'); shake(.15); return g; },
        upd(o, n, dt, t) { const k = n.t / 1.5; spinCircle(o.userData.circle, dt, .6); o.userData.ts.forEach((tt, i) => { tt.scale.setScalar(tt.userData.s * easeOutBack(Math.min(1, n.t * 4))); curlTentacle(tt, i === 0 ? (k < .7 ? -.2 + k * .6 : 2.2) : .6 + .3 * Math.sin(t * 3 + i), t * 4 + i, .2); }); },
        drop(o, n) { dustFx(n.x, n.z, n.r, 0x2a2440); addFx(o, .4, (o, k) => { o.position.y = -3 * k * k; fade(o, 1 - k); }); } },
      fx: { slam(e) { boomFx(e.x, .5, e.z, e.r, 0x4a3cff, .9); dustFx(e.x, e.z, e.r, 0x2a2440); burst(e.x, .3, e.z, 40, 0x2a1a80, 7, .35, .6, 6); shake(.3); sfx('abyss_big'); },
        hurl(e) { const a = V(e.x, e.y, e.z), b = V(e.x2, 1, e.z2); for (let i = 0; i <= 20; i++) { const q = a.clone().lerp(b, i / 20); q.y += Math.sin(i / 20 * Math.PI) * 4; emit(q.x, q.y, q.z, rand(-.5, .5), rand(-.5, .5), rand(-.5, .5), i % 2 ? 0x2a1a80 : 0x8a7aff, rand(.15, .3), .6); } sfx('wind_big'); } } },
    { name: 'Maw of the Deep', icon: '👄', cd: 10, mode: 'aim', range: 18, aimR: 4.5, desc: 'Hide a maw in the floor at the target for up to 12 s. The first monster to step on it is swallowed whole: gone from the fight for 2 s, then spat out for 70 damage, splashing 35 on everything within 3.5 m. Bosses are too big to swallow.',
      cast(p, c) { ent(p, c, c.tgt.x, c.tgt.z, { life: 12, r: 1.6 }); },
      ent: { tick(n, dt) {
          if (!n.vid) { // lying in wait
            if (n.t < .6) return;
            const e = enemiesNear(n.x, n.z, n.r).find(e => !ET[e.type].boss && !e.pid); if (!e) return;
            n.vid = e.id; n.s = 1; n.life = 2; n.max = 2; cc(e, 'stun', 2.2, own(n)); fxe(n.mv, 'gulp', { x: n.x, z: n.z });
          }
          const e = S.enemies.find(x => x.id === n.vid && alive(x)); if (!e) return;
          e.x = n.x; e.z = n.z; e.y = -3; e.vy = 0; e.kx = e.kz = 0; // held under the floor
        },
        end(n) {
          const e = n.vid && S.enemies.find(x => x.id === n.vid && alive(x)); if (!e) return;
          e.y = 0; launch(e, 12); const c = ctxN(n);
          hitEnemy(e, 'abyss', 70 * n.mul, c.p, 0, 0, 0, { aoe: true }); boomAt(c, n.x, .3, n.z, 3.5, 35 * n.mul, { kb: 5, skip: [e.id] }, 'snap');
        } },
      view: { make(n) { const o = model('abyss__maw', 0x4a3cff); o.scale.set(.01, .01, .01); return o; },
        upd(o, n, dt, t) {
          o.position.y = .02; o.rotation.y += dt * .3;
          if (!n.s) { const k = Math.min(1, n.t * 3); o.scale.set(1.3 * k, .08, 1.3 * k); fade(o, .35); if (Math.random() < .08) emit(n.x + rand(-.6, .6), .1, n.z + rand(-.6, .6), 0, .4, 0, 0x2a1a80, .12, .6); return; } // a dark, barely visible ring
          fade(o, 1); const chew = Math.abs(Math.sin(t * 7)); o.scale.set(2 - chew * .3, .5 + chew * .7, 2 - chew * .3);
          if (Math.random() < .4) emit(n.x + rand(-1, 1), .3, n.z + rand(-1, 1), rand(-1, 1), rand(1, 3), rand(-1, 1), 0x8a7aff, rand(.1, .2), .5, 6);
        },
        drop(o) { addFx(o, .25, (o, k) => { o.scale.x *= .7; o.scale.z *= .7; o.scale.y *= 1.15; fade(o, 1 - k); }); } },
      fx: { gulp(e) { burst(e.x, .5, e.z, 40, 0x2a1a80, 6, .35, .6, -2); ringFx(e.x, .1, e.z, 2.2, 0x4a3cff, .3); popNum(e.x, 2, e.z, 'SWALLOWED', '#8a7aff', 'tag'); sfx('abyss_big'); sfx('bone_big'); },
        snap(e) { boomFx(e.x, .5, e.z, e.r, 0x4a3cff, 1); burst(e.x, .5, e.z, 50, 0x2a1a80, 8, .35, .6, 4); shake(.35); sfx('abyss_big'); } } },
    { name: 'Tentacle Ring', icon: '🐙', cd: 14, desc: 'Eight tentacles burst up around you for 6 s and lash any enemy that comes within 6 m, three at a time.',
      cast(p, c) { ent(p, c, p.x, p.z, { life: 6, r: 6 }); },
      ent: { tick(n, dt) { if (!pulse(n, dt, .55)) return; const es = enemiesNear(n.x, n.z, n.r).slice(0, 3); if (!es.length) return; n.s++; for (const e of es) { hitEnemy(e, 'abyss', 18 * n.mul, own(n), e.x - n.x, e.z - n.z, 4, { aoe: true }); fxe(n.mv, 'whip', { x: n.x, z: n.z, ex: e.x, ez: e.z }); } } },
      view: { make(n) {
          const g = new THREE.Group(), u = g.userData; u.mats = []; u.ts = [];
          for (let i = 0; i < 8; i++) { const t = model('abyss__tentacle', 0x4a3cff, { shadow: true }), a = TAU * i / 8; t.position.set(Math.cos(a) * 2.4, 0, Math.sin(a) * 2.4); t.rotation.y = Math.atan2(Math.cos(a), Math.sin(a)); g.add(t); u.mats.push(...t.userData.mats); u.ts.push(t); }
          u.s = n.s; u.whip = 0; dustFx(n.x, n.z, 3, 0x2a2440); sfx('abyss_big'); return g; },
        upd(o, n, dt, t) { const u = o.userData; if (n.s !== u.s) { u.s = n.s; u.whip = 1; } u.whip = Math.max(0, u.whip - dt * 3);
          u.ts.forEach((tt, i) => { const k = easeOutBack(clamp(n.t * 3 - i * .05, 0, 1)); tt.scale.set(.38 * k, .95 * k, .38 * k); curlTentacle(tt, -.3 + u.whip * 1.4 * ((i + n.s) % 3 === 0 ? 1 : .3), t * 3 + i * 1.3, .22); });
          if (n.l < .1) fade(o, n.l * 10); },
        drop(o, n) { dustFx(n.x, n.z, 3, 0x2a2440); addFx(o, .4, (o, k) => { o.position.y = -3 * k; }); } },
      fx: { whip(e) { beamFx(V(e.x, 2.4, e.z), V(e.ex, 1, e.ez), 0x4a3cff, .12, .25); burst(e.ex, 1, e.ez, 14, 0x2a1a80, 5, .25, .4, 4); sfx('abyss'); } } },
    { name: 'Kraken', icon: '👁️', mode: 'aim', range: 22, aimR: 9, desc: 'ULTIMATE. The Kraken stirs: colossal tentacles burst from the floor around the target and thrash for 6 s, crushing enemies and dragging them in, then haul everything down for 100 damage.',
      cast(p, c) { ent(p, c, c.tgt.x, c.tgt.z, { life: 6, r: 9 * c.st.aoe }); },
      ent: { tick(n, dt) {
          for (const e of enemiesNear(n.x, n.z, n.r)) { e.fs = Math.max(e.fs || 0, .5); if (!ET[e.type].boss) pull(e, n.x, n.z, 5 * dt); }
          if (n.t > .6 && pulse(n, dt, .35)) { const e = pick(enemiesNear(n.x, n.z, n.r)); if (e) { n.s++; fxe(n.mv, 'crush', { x: e.x, z: e.z }); blast(e.x, e.z, 2.5, 19 * n.mul, ctxN(n), { raw: true, kb: 3, lift: 5 }); } }
        },
        end(n) { boomAt(ctxN(n), n.x, 0, n.z, n.r, 85 * n.mul, { kb: -8 }, 'haul'); } },
      view: { make(n) {
          const g = new THREE.Group(), u = g.userData; u.mats = []; u.ts = [];
          const disc = T.disc.clone(); u.dm = discMat(0x1a1060); disc.material = u.dm; disc.scale.setScalar(n.r); disc.position.y = .05; g.add(disc);
          for (let i = 0; i < 7; i++) { const t = model('abyss__tentacle', 0x4a3cff, { shadow: true }), a = TAU * i / 7 + .3; t.position.set(Math.cos(a) * n.r * .85, 0, Math.sin(a) * n.r * .85); t.rotation.y = Math.atan2(-Math.cos(a), -Math.sin(a)); t.userData.ph = rand(0, TAU); g.add(t); u.mats.push(...t.userData.mats); u.ts.push(t); }
          u.circle = zoneCircle('abyss', n.r, .7); g.add(u.circle); sfx('abyss_big'); shake(.4); return g; },
        upd(o, n, dt, t) {
          const u = o.userData, end = n.l < .12; spinCircle(u.circle, dt, .3); u.dm.uniforms.uA.value = Math.min(1, n.t * 2, n.l * 5) * .9;
          u.ts.forEach((tt, i) => { tt.scale.setScalar(2.3 * easeOutBack(clamp(n.t * 2 - i * .08, 0, 1))); curlTentacle(tt, end ? 2.6 : .5 + .6 * Math.sin(t * 1.7 + tt.userData.ph), t * 2.2 + tt.userData.ph, .3); });
          if (Math.random() < .5) { const a = rand(0, TAU), d = rand(0, n.r); emit(n.x + Math.cos(a) * d, .1, n.z + Math.sin(a) * d, 0, rand(.5, 2), 0, Math.random() < .5 ? 0x2a1a80 : 0x8a7aff, rand(.2, .4), 1, -.3); }
          for (const tt of u.ts) if (Math.random() < .6) { const q = tt.localToWorld(V(rand(-.15, .15), rand(.3, 3.5), .25)); emit(q.x, q.y, q.z, 0, 0, 0, 0xc0b0ff, rand(.08, .15), .25); } // glowing suckers
        },
        drop(o) { addFx(o, .6, (o, k) => { o.position.y = -5 * k * k; fade(o, 1 - k); }); } },
      fx: { crush(e) { const o = model('abyss__tentacle', 0x4a3cff); o.position.set(e.x, 0, e.z); o.rotation.y = rand(0, TAU); addFx(o, .8, (o, k) => { o.scale.setScalar(1.4 * (k < .2 ? easeOut(k / .2) : 1)); curlTentacle(o, k < .35 ? -.5 : 2.4, k * 10, .1); o.position.y = k > .7 ? -4 * ((k - .7) / .3) ** 2 : 0; if (k > .75) fade(o, 1 - (k - .75) / .25); }); dustFx(e.x, e.z, 2, 0x2a2440); burst(e.x, .3, e.z, 20, 0x2a1a80, 6, .3, .5, 6); shake(.15); if (Math.random() < .5) sfx('abyss_big'); },
        haul(e) { boomFx(e.x, .5, e.z, e.r, 0x4a3cff, 2); dustFx(e.x, e.z, e.r, 0x2a2440); flash(e.x, 2, e.z, 0x8a7aff, 60, .4); shake(.6); sfx('ult'); sfx('smash'); } } },
  ],
},
// ================================================================== LASER
laser: {
  name: 'Laser', color: 0x2cff6a, glyph: '📡', adj: 'TARGETED', react: { name: 'REFRACTION', kind: 'chain' },
  blurb: 'Precision light. Instant beams that ricochet off pillars, walls, the floor and your own crystal lenses, hitting harder with every bounce.',
  passive: 'Ricochet and Focus: every bounce makes a Laser hit 25% harder, and Laser hits to the head always crit. Hitting the same enemy again within 1.5 s builds Focus, +6% damage per stack (up to 6). Targeted enemies take 12% more damage.',
  st: { vuln: .12 },
  moves: [
    { name: 'Pulse Laser', icon: '🟢', cd: .3, desc: 'An instant laser pulse that bounces once off whatever it meets.',
      cast(p, c) { for (let k = 0; k < c.multi; k++) fxe(c.m.key, 'beam', { pts: laserShot(p, c.o, spread(c.d, k, c.multi, .05), 45, 1, 6.5 * c.dmg, 1.2), w: (c.mega ? .12 : .05) * (1 + .12 * p.bd.foc.n) }); }, // the beam thickens as Focus builds
      fx: { beam(e) { laserFx(e.pts, 0x2cff6a, e.w); }, det: e => boomFx(e.x, e.y, e.z, 2.5, 0x2cff6a, .6), nova: e => boomFx(e.x, .5, e.z, 4.5, 0x2cff6a, .8) } },
    { name: 'Ricochet Beam', icon: '✳️', cd: 4, mode: 'charge', charge: .8, desc: 'Hold to charge a thick beam that bounces up to 4 times off pillars, walls and the floor, piercing everything it touches.',
      cast(p, c) { fxe(c.m.key, 'beam', { pts: laserShot(p, c.o, c.d, 70, 2 + Math.round(2 * c.k), (18 + 40 * c.k) * c.dmg, 3 + 4 * c.k), w: .1 + .16 * c.k }); },
      fx: { beam(e) { laserFx(e.pts, 0x2cff6a, Math.min(e.w, .2), .3); const [x, y, z] = e.pts[e.pts.length - 1]; flash(x, y, z, 0x2cff6a, 30, .2); shake(.06 + e.w * .4); } } },
    { name: 'Refractor', icon: '🔷', cd: 5, mode: 'aim', range: 24, aimR: 1.1, desc: 'Hang a floating crystal lens at the target for 12 s (up to 2). Any of your lasers that pass through it split into 3 beams that lock onto the nearest enemies, each counting as one more bounce. When it expires it bursts.',
      cast(p, c) { const mine = entsOf(p, c.m.key).sort((a, b) => a.id - b.id); while (mine.length >= 2) mine.shift().life = 0; ent(p, c, c.tgt.x, c.tgt.z, { y: 1.6, life: 12, r: 1.1 }); },
      ent: { end(n) { boomAt(ctxN(n), n.x, n.y, n.z, 3, 25 * n.mul, { kb: 3 }, 'pop'); } },
      view: { make(n) { const g = new THREE.Group(), u = g.userData; u.prism = model('laser__prism', 0x2cff6a); u.prism.scale.setScalar(.45); u.lens = model('laser__lens', 0x2cff6a, { flat: true }); u.lens.scale.setScalar(1.6); g.add(u.prism, u.lens); u.mats = [...u.prism.userData.mats, ...u.lens.userData.mats]; burst(n.x, 1.6, n.z, 25, 0x2cff6a, 4, .15, .4); sfx('laser'); return g; },
        upd(o, n, dt, t) { const u = o.userData; u.prism.position.y = Math.sin(t * 2 + n.id) * .12; u.prism.rotation.y += dt * 1.5; u.lens.position.y = u.prism.position.y; u.lens.lookAt(camera.position); u.lens.rotateZ(t * .5); fade(o, Math.min(1, n.t * 4, n.l * 12) * (n.l < .2 ? .6 + .4 * Math.sin(t * 25) : 1)); if (Math.random() < .2) emit(o.position.x + rand(-.4, .4), o.position.y + rand(-.4, .4), o.position.z + rand(-.4, .4), 0, .5, 0, 0x2cff6a, .08, .5); },
        drop: dropFade(.2) },
      fx: { split(e) { for (const pts of e.b) laserFx(pts, 0x2cff6a, .07, .2); flash(e.x, e.y, e.z, 0x2cff6a, 25, .15); burst(e.x, e.y, e.z, 10, 0xb8ffd0, 4, .12, .25); if (e.b.length) sfx('laser'); },
        pop: e => boomFx(e.x, e.y, e.z, e.r, 0x2cff6a, .5) } },
    { name: 'Laser Drone', icon: '🛸', cd: 15, desc: 'Deploy a hovering drone that follows you for 12 s and fires a bouncing laser at the nearest enemy every 0.4 s.',
      cast(p, c) { for (const n of entsOf(p, c.m.key)) n.dead = true; ent(p, c, p.x + 1, p.z, { life: 12, r: 18, y: p.y + 2.6 }); },
      ent: { tick(n, dt) {
        const p = own(n); if (!p) { n.life = 0; return; }
        const k = Math.min(1, dt * 4); n.x += (p.x + Math.cos(n.t * 1.2) * 1.8 - n.x) * k; n.z += (p.z + Math.sin(n.t * 1.2) * 1.8 - n.z) * k; n.y = p.y + 2.6 + Math.sin(n.t * 2.3) * .15;
        if (!pulse(n, dt, .4)) return;
        const e = nearest(n.x, n.z, n.r); if (!e) return;
        const o = V(n.x, n.y - .2, n.z), d = center(e).sub(o).normalize(); n.yaw = Math.atan2(d.x, d.z);
        fxe(n.mv, 'zap', { pts: laserShot(p, o, d, 30, 1, 9 * n.mul) });
      } },
      view: { make(n) { const o = model('laser__drone', 0x2cff6a); o.scale.setScalar(1.2); burst(n.x, n.y, n.z, 20, 0x2cff6a, 4, .2, .4); return o; },
        upd(o, n, dt, t) { o.rotation.y = lerpAngle(o.rotation.y, n.yaw || 0, Math.min(1, dt * 8)); o.rotation.z = Math.sin(t * 2) * .08; fade(o, Math.min(1, n.l * 10)); if (Math.random() < .3) emit(o.position.x, o.position.y - .3, o.position.z, 0, -2, 0, 0x2cff6a, .1, .3); },
        drop(o) { burst(o.position.x, o.position.y, o.position.z, 30, 0x2cff6a, 5, .2, .4, 4); o.removeFromParent(); } },
      fx: { zap(e) { laserFx(e.pts, 0x2cff6a, .045, .14); if (Math.random() < .5) sfx('laser'); } } },
    { name: 'Prism Nova', icon: '🔺', desc: 'ULTIMATE. A great prism rises above you and spins for 4 s, firing eight lasers in a star that bounce off everything and shred whatever they cross.',
      cast(p, c) { ent(p, c, p.x, p.z, { follow: 1, life: 4, r: 34 }); },
      ent: { tick(n, dt) {
        if (n.t < .4 || !pulse(n, dt, .1)) return;
        const p = own(n);
        for (const pts of novaBeams(n)) for (let i = 0; i + 1 < pts.length; i++) {
          const a = pts[i], v = pts[i + 1].clone().sub(a), L = v.length(); if (L < .01) continue; v.divideScalar(L);
          for (const h of rayHits(a, v, L, .6)) if (ready(n, h.e, .25)) hitEnemy(h.e, 'laser', 28 * n.mul * (1 + .25 * i), p, v.x, v.z, 1.5, { aoe: true });
        }
      } },
      view: { make() { const g = new THREE.Group(), u = g.userData; u.mats = []; u.prism = model('laser__prism', 0x2cff6a); g.add(u.prism); u.mats.push(...u.prism.userData.mats); u.beams = []; sfx('laser_big'); return g; },
        upd(o, n, dt) {
          const mine = n.own === myId, u = o.userData, on = n.t > .4, w = Math.min(1, n.l * 8) * (mine ? .5 : 1);
          u.prism.position.y = 4 * easeOut(Math.min(1, n.t * 2.5)); u.prism.rotation.y += dt * 4; u.prism.scale.setScalar(1.3); fade(u.prism, Math.min(1, n.l * 8));
          let k = 0;
          if (on) for (const pts of novaBeams(n)) for (let i = 0; i + 1 < pts.length; i++, k++) {
            const pair = u.beams[k] ||= (() => { const a = beamMesh(0xffffff, .05), b = beamMesh(0x2cff6a, .14); scene.add(a, b); return [a, b]; })();
            if (mine && i === 0) pts[0].lerp(pts[1], Math.min(.8, 3 / pts[0].distanceTo(pts[1]))); // they leave the prism right over your head: start them clear of the camera
            pair[0].visible = pair[1].visible = true; aimBeam(pair[0], pts[i], pts[i + 1], .05 * w); aimBeam(pair[1], pts[i], pts[i + 1], .16 * w);
            fade(pair[0], mine ? .45 : 1); fade(pair[1], mine ? .35 : 1); // a star of beams around your own camera: softer, or the bloom fogs your view
            if (Math.random() < .15) { const q = pts[i + 1]; burst(q.x, q.y, q.z, 3, 0x2cff6a, 3, .12, .2); }
          }
          for (; k < u.beams.length; k++) u.beams[k][0].visible = u.beams[k][1].visible = false;
          if (on && !mine && Math.random() < .3) flash(n.x, (n.y || 0) + 4, n.z, 0x2cff6a, 25, .1);
        },
        drop(o) { for (const [a, b] of o.userData.beams) { a.removeFromParent(); b.removeFromParent(); } dropFade(.3)(o); } } },
  ],
},
// ================================================================== ARCANE
arcane: {
  name: 'Arcane', color: 0xd84cff, glyph: '🔮', adj: 'SPELLBOUND', react: { name: 'ARCANE SURGE', kind: 'overload' },
  blurb: 'Pure magic. Homing missiles, an owl familiar and polymorphs, and charges that build into a devastating barrage.',
  passive: 'Arcane Charges: every Arcane spell except Barrage gives you a charge (up to 4; they fade 8 s after your last cast). Each charge makes your spells 8% stronger. Spellbound enemies take 10% more damage.',
  st: { vuln: .1 },
  onCast(p, m) { if (m.slot !== 1) p.bd.arc = Math.min(4, (p.bd.arc || 0) + 1); p.bd.arcT = 8; },
  moves: [
    { name: 'Arcane Missiles', icon: '🌟', cd: .55, desc: 'Fire three arcane missiles in quick succession that weave toward enemies.',
      cast(p, c) { for (let i = 0; i < 3; i++) later(i * .08, () => { if (p.down) return; for (let k = 0; k < c.multi; k++) shoot(p, c, 30, { d: c.d.clone().applyAxisAngle(UP, (i - 1) * .14 + (k - (c.multi - 1) / 2) * .1).add(V(0, .05, 0)).normalize(), r: .28, life: 1.6, dmg: 6 * c.dmg, home: 7, sc: c.mega ? 1.8 : 1 }); }); },
      look: { m: 'arcane__missile', trail: [() => Math.random() < .5 ? 0xe090ff : 0xffffff, .12, .35, 0, 2], light: 4 },
      fx: { det: e => boomFx(e.x, e.y, e.z, 2.5, 0xd84cff, .6), nova: e => boomFx(e.x, .5, e.z, 4.5, 0xd84cff, .8) } },
    { name: 'Arcane Barrage', icon: '🎆', cd: 3, desc: 'Spend all your Arcane Charges on a barrage of heavy arcane bolts: 2, plus 2 for every charge spent.',
      cast(p, c) { const n = 2 + 2 * (p.bd.arc || 0); p.bd.arc = 0; fxe(c.m.key, 'barrage', { id: p.id, n }); for (let i = 0; i < n; i++) later(i * .05, () => { if (p.down) return; const c2 = ctxOf(p, c.m); shoot(p, c2, 44, { d: c2.d.clone().add(V(rand(-.035, .035), rand(-.025, .04), rand(-.035, .035))).normalize(), r: .35, dmg: 12 * c.dmg, home: 2.5, kb: 3 }); }); },
      look: { m: 'arcane__orb', s: .8, spin: [0, 0, 9], trail: [0xe090ff, .09, .25, 0, 1], light: 3 },
      fx: { barrage(e) { if (isMe(e.id)) { shake(.04 * e.n); fovKick = .3 + e.n * .05; } } } },
    { name: 'Arcane Familiar', icon: '🦉', cd: 14, desc: 'Summon a spectral owl for 12 s. It circles above you, and every second it swoops on whatever you are aiming at, raking it for 22 and marking it: marked enemies take 20% more damage for 4 s. Each strike gives you an Arcane Charge.',
      cast(p, c) { for (const n of entsOf(p, c.m.key)) n.dead = true; ent(p, c, p.x, p.z, { life: 12, r: 18, y: p.y + 2.4 }); },
      ent: { tick(n, dt) {
        const p = own(n); if (!p) { n.life = 0; return; }
        const e = n.tg && S.enemies.find(x => x.id === n.tg && alive(x));
        let tx, ty, tz, spd;
        if (e && (n.sw += dt) < 2) { const q = center(e); tx = q.x; ty = q.y; tz = q.z; spd = 24; }
        else { // circle above you, wide enough to stay out of your face, and pick a new prey once a second
          const a = n.t * 1.1; tx = p.x + Math.cos(a) * 2.6; tz = p.z + Math.sin(a) * 2.6; ty = p.y + 3; spd = 12; n.tg = 0;
          if (pulse(n, dt, 1)) { const g = groundAt(p, 30), t = rayHits(eyeOf(p), aimOf(p), 30, 1)[0]?.e || nearest(g.x, g.z, 6); if (t) { n.tg = t.id; n.sw = 0; } } // your target, not just the nearest
        }
        const dx = tx - n.x, dy = ty - n.y, dz = tz - n.z, d = Math.hypot(dx, dy, dz), st = Math.min(d, spd * dt);
        if (d > .01) { n.x += dx / d * st; n.y += dy / d * st; n.z += dz / d * st; }
        if (Math.hypot(dx, dz) > .05) n.yaw = Math.atan2(dx, dz);
        n.v = e ? 1 : 0;
        if (e && d < .9) { hitEnemy(e, 'arcane', 22 * n.mul, p, dx, dz, 2); e.fv = Math.max(e.fvU > S.t ? e.fv : 0, .2); e.fvU = S.t + 4; p.bd.arc = Math.min(4, (p.bd.arc || 0) + 1); p.bd.arcT = 8; n.tg = 0; n.s++; fxe(n.mv, 'rake', { x: n.x, y: n.y, z: n.z }); }
      } },
      view: { make(n) { const o = model('arcane__owl', 0xd84cff), P = k => o.getObjectByName('arcane__owl_' + k); o.scale.setScalar(1.5); Object.assign(o.userData, { wl: P('wingL'), wr: P('wingR') }); burst(n.x, n.y, n.z, 30, 0xe090ff, 4, .2, .5); sfx('arcane_big'); return o; },
        upd(o, n, dt, t) {
          const u = o.userData, f = Math.sin(t * (n.v ? 9 : 14)) * (n.v ? .25 : .7) - (n.v ? .6 : 0); // a swoop folds the wings back
          if (u.wl) u.wl.rotation.z = -f; if (u.wr) u.wr.rotation.z = f;
          o.rotation.y = lerpAngle(o.rotation.y, n.yaw || 0, Math.min(1, dt * 8)); o.rotation.x = n.v ? .35 : 0; fade(o, Math.min(1, n.t * 4, n.l * 8));
          if (Math.random() < (n.v ? .8 : .3)) emit(o.position.x, o.position.y, o.position.z, 0, -.3, 0, Math.random() < .5 ? 0xe090ff : 0xffffff, rand(.06, .14), .5);
        },
        drop(o) { burst(o.position.x, o.position.y, o.position.z, 40, 0xe090ff, 5, .2, .5, 2); o.removeFromParent(); } },
      fx: { rake(e) { burst(e.x, e.y, e.z, 18, 0xe090ff, 5, .14, .3, 4); flash(e.x, e.y, e.z, 0xd84cff, 12, .12); sfx('arcane'); } } },
    { name: 'Polymorph', icon: '🐑', cd: 12, desc: 'Turn the first enemy you hit, and up to 2 more near it, into harmless sheep for 4 s. Bosses resist it.',
      cast(p, c) { shoot(p, c, 32, { r: .5, life: 1.2, dmg: 5 * c.dmg }); },
      shot: { hit(s, e) { const p = own(s); for (const o of [e, ...enemiesNear(e.x, e.z, 4, [e.id]).slice(0, 2)]) { hitEnemy(o, 'arcane', s.dmg, p, 0, 0, 0); if (cc(o, 'poly', 4, p)) { const q = center(o); fxe(s.mv, 'poof', { x: q.x, y: q.y, z: q.z }); } } return 'end'; } },
      look: { m: 'arcane__orb', s: 1.2, spin: [0, 0, 6], trail: [() => Math.random() < .5 ? 0xffffff : 0xe090ff, .18, .4, 0, 3], light: 5 },
      fx: { poof(e) { burst(e.x, e.y, e.z, 40, 0xffffff, 5, .35, .6, -1); burst(e.x, e.y, e.z, 20, 0xe090ff, 4, .25, .5); flash(e.x, e.y, e.z, 0xd84cff, 20, .2); sfx('arcane_big'); } } },
    { name: 'Arcane Torrent', icon: '🪄', desc: 'ULTIMATE. Open an arcane rift above you that rains 38 homing missiles on enemies within 22 m over 4 s.',
      cast(p, c) { ent(p, c, p.x, p.z, { follow: 1, life: 4.2, r: 22 }); },
      ent: { tick(n, dt) { if (n.t < .4 || !pulse(n, dt, .1)) return; const e = pick(enemiesNear(n.x, n.z, n.r)); if (!e) return; const a = rand(0, TAU), o = V(n.x + Math.cos(a) * 2.6, (n.y || 0) + 7, n.z + Math.sin(a) * 2.6); shoot(own(n), { ...ctxN(n), m: MOVE['arcane.0'] }, 24, { o, d: center(e).sub(o).normalize(), r: .32, life: 2.5, dmg: 16 * n.mul, home: 9, sc: 1.3, mul: n.mul }); } },
      view: { make() { const g = new THREE.Group(), u = g.userData; u.rift = model('arcane__rift', 0xd84cff, { flat: true }); g.add(u.rift); u.mats = u.rift.userData.mats.slice(); u.circle = zoneCircle('arcane', 3, .6); g.add(u.circle); sfx('arcane_big'); return g; },
        upd(o, n, dt) { const u = o.userData, a = Math.min(1, n.t * 2.5, n.l * 5); u.rift.position.y = 7.4; u.rift.rotation.y += dt * 1.5; u.rift.scale.setScalar(3.4 * (.3 + .7 * a)); fade(u.rift, a); spinCircle(u.circle, dt, 1); setOpacity(u.circle.userData.mats, a * .6); if (Math.random() < .6) emit(o.position.x + rand(-3, 3), o.position.y + 7, o.position.z + rand(-3, 3), 0, -rand(1, 3), 0, Math.random() < .5 ? 0xe090ff : 0xffffff, rand(.1, .25), 1, 0, .5); },
        drop: dropFade(.4) } },
  ],
},
// ================================================================== BLADES
blades: {
  name: 'Blades', color: 0xffcc33, glyph: '🗡️', adj: 'LACERATED', react: { name: 'THOUSAND CUTS', kind: 'chain' },
  blurb: 'A sword saint. Summoned swords orbit you, guard you, and fly wherever you point.',
  passive: 'Sword Halo: a spectral sword forms around you every 2.5 s (up to 6), and an orbiting sword strikes any enemy that gets within 3 m. Lacerated enemies bleed.',
  st: { dot: 4 },
  moves: [
    { name: 'Flying Daggers', icon: '🔪', cd: .35, desc: 'Throw a pair of spectral daggers that curve toward enemies. Each hit has a 25% chance to forge a new orbiting sword.',
      cast(p, c) { for (let k = 0; k < c.multi; k++) for (const s of [-1, 1]) shoot(p, c, 40, { d: spread(c.d, k, c.multi, .1).applyAxisAngle(UP, s * .035), r: .26, dmg: 7.5 * c.dmg, home: 2, sc: c.mega ? 1.8 : 1 }); },
      shot: { hit(s, e, hd) { const p = own(s); hitEnemy(e, 'blades', s.dmg, p, s.vx, s.vz, 1.5, { crit: hd ? 1.5 : 1, src: { x: s.x - s.vx, z: s.z - s.vz } }); if (p?.cur === 'blades' && Math.random() < .25) p.bd.swords = Math.min(6, (p.bd.swords || 0) + 1); } },
      look: { m: 'blades__sword', s: .45, trail: [0xffe08a, .09, .25, 0, 1], light: 3 },
      fx: { guard(e) { // an orbiting sword darts out at an enemy that came too close
          const q = e.id === myId ? null : srcState()?.players[e.id], from = q ? V(q.x, q.y + 1.1, q.z) : camera.position.clone().add(V(0, -.8, 0)), to = V(e.x, e.y, e.z);
          modelFx('blades__sword', 0xffcc33, from.clone(), .16, (o, k) => { o.position.lerpVectors(from, to, k); o.lookAt(to); });
          burst(e.x, e.y, e.z, 16, 0xffe08a, 6, .15, .3, 4); sfx('blades');
        }, det: e => boomFx(e.x, e.y, e.z, 2.5, 0xffcc33, .6), nova: e => boomFx(e.x, .5, e.z, 4.5, 0xffcc33, .8) } },
    { name: 'Sword Volley', icon: '🏹', cd: 2.5, desc: 'Launch every orbiting sword at your crosshair. Each one pierces through enemies for 24 damage. With no swords ready, you conjure two.',
      cast(p, c) {
        const n = Math.max(2, p.bd.swords || 0), aim = c.eye.clone().addScaledVector(c.aim, 30); p.bd.swords = 0;
        for (let i = 0; i < n; i++) { const a = TAU * i / n, o = V(p.x + Math.cos(a) * 1.3, p.y + 1.1 + .25 * Math.sin(i * 2), p.z + Math.sin(a) * 1.3); later(i * .05, () => { if (!p.down) shoot(p, c, 46, { o, d: aim.clone().sub(o).normalize(), r: .45, life: 1.2, pierce: 3, dmg: 24 * c.dmg, kb: 3 }); }); }
      },
      look: { m: 'blades__sword', s: .95, trail: [0xffe08a, .14, .3, 0, 2], light: 5 } },
    { name: 'Blade Dance', icon: '💃', cd: 8, desc: 'Dash 9 m forward in a whirl of blades, cutting everything you pass through for 32 damage, and forge 2 new swords.',
      self(p) { const f = flatAim(p); p.mo = { t: 0, T: .3, vx: f.x * 30, vz: f.z * 30, trail: 0xffcc33 }; },
      cast(p, c) {
        const f = c.flat, x0 = p.x, z0 = p.z; buff(p, 'inv', .35); p.bd.swords = Math.min(6, (p.bd.swords || 0) + 2);
        for (const e of S.enemies) { if (!alive(e)) continue; const dx = e.x - x0, dz = e.z - z0, along = dx * f.x + dz * f.z, lat = Math.abs(dx * f.z - dz * f.x); if (along > -1 && along < 10 && lat < 1.8 + ET[e.type].r * e.sc) hitEnemy(e, 'blades', 32 * c.dmg, p, dx, dz, 3, { src: p }); }
        fxe(c.m.key, 'dance', { id: p.id, x: x0, y: p.y, z: z0, dx: f.x, dz: f.z });
      },
      fx: { dance(e) {
        const dir = V(e.dx, 0, e.dz);
        for (let i = 0; i < 6; i++) modelFx('blades__sword', 0xffcc33, V(e.x, e.y + 1, e.z), .45, (o, k) => { const c = V(e.x, e.y + 1, e.z).addScaledVector(dir, 9 * Math.min(1, k / .7)), a = k * 18 + TAU * i / 6; o.position.set(c.x + Math.cos(a) * 1.4, c.y + Math.sin(a * .5) * .3, c.z + Math.sin(a) * 1.4); o.lookAt(c.x + Math.cos(a + 1.5) * 3, c.y, c.z + Math.sin(a + 1.5) * 3); fade(o, 1 - k * k); });
        for (let i = 0; i < 40; i++) { const t = rand(0, 9); emit(e.x + e.dx * t + rand(-1, 1), e.y + rand(.3, 1.8), e.z + e.dz * t + rand(-1, 1), rand(-2, 2), rand(0, 2), rand(-2, 2), Math.random() < .5 ? 0xffe08a : 0xffffff, rand(.1, .25), .5, 0, 2); }
        if (isMe(e.id)) fovKick = 1.4;
      } } },
    { name: 'Rain of Blades', icon: '☔', cd: 11, mode: 'aim', range: 20, aimR: 4.5, desc: 'Twelve swords rain down in a ring around the target, 20 damage each, and stay stuck in the ground for 6 s, slowing enemies among them by 30%. Walk through a planted sword to pull it into your halo.',
      cast(p, c) {
        const t = c.tgt.clone(), R = 4.5 * c.st.aoe, n = ent(p, c, t.x, t.z, { life: 6.4, r: R, s: [] });
        for (let i = 0; i < 12; i++) later(.12 + i * .08, () => { const a = TAU * i / 12 + rand(-.1, .1), d = R * (i % 2 ? .55 : .9), x = t.x + Math.cos(a) * d, z = t.z + Math.sin(a) * d; fxe(c.m.key, 'drop', { x, z }); later(.2, () => { boomAt(c, x, .3, z, 1.8, 20 * c.dmg, { kb: 1.5, raw: true }, 'stab'); if (!n.dead) n.s = [...n.s, [r2(x), r2(z), (i * 7) % 12]]; }); });
      },
      ent: { tick(n) {
        for (const e of enemiesNear(n.x, n.z, n.r)) e.fs = Math.max(e.fs || 0, .3);
        const p = own(n); if (!p || p.down || (p.bd.swords || 0) >= 6) return;
        const i = n.s.findIndex(([x, z]) => Math.hypot(p.x - x, p.z - z) < 1.3); // walked through one
        if (i >= 0) { const [x, z] = n.s[i]; n.s = n.s.filter((_, j) => j !== i); p.bd.swords = Math.min(6, (p.bd.swords || 0) + 1); fxe(n.mv, 'pick', { x, z, id: p.id }); }
      } },
      // the planted swords (one per entry in n.s, each with its own lean)
      view: { make(n) { const c = zoneCircle('blades', n.r, .55), g = new THREE.Group().add(c); g.userData.mats = []; g.userData.circle = c; g.userData.sw = []; return g; },
        upd(o, n, dt) { const u = o.userData, list = Array.isArray(n.s) ? n.s : []; spinCircle(u.circle, dt, .3);
          while (u.sw.length < list.length) { const m = model('blades__sword', 0xffcc33); m.rotation.order = 'YXZ'; m.scale.setScalar(1.6); scene.add(m); u.sw.push(m); }
          u.sw.forEach((m, i) => { m.visible = i < list.length; if (!m.visible) return; const [x, z, s] = list[i]; m.position.set(x, 1, z); m.rotation.set(Math.PI / 2 + (s / 12 - .5) * .3, s * .5, 0); fade(m, Math.min(1, n.l * 8)); }); },
        drop(o) { o.userData.sw.forEach(m => dropFade(.3)(m)); dropFade()(o); } },
      fx: { drop(e) { const yaw = rand(0, TAU), tilt = rand(-.15, .15); modelFx('blades__sword', 0xffcc33, V(e.x, 18, e.z), .2, (o, k) => { o.rotation.order = 'YXZ'; o.rotation.set(Math.PI / 2 + tilt, yaw, 0); o.scale.setScalar(1.6); o.position.y = 1 + 17 * (1 - k); }); },
        pick(e) { burst(e.x, 1, e.z, 20, 0xffe08a, 5, .15, .35); flash(e.x, 1, e.z, 0xffcc33, 10, .15); sfx('steel'); },
        stab(e) { burst(e.x, .3, e.z, 16, 0xffe08a, 5, .15, .3, 6); ringFx(e.x, .1, e.z, e.r, 0xffcc33, .35); dustFx(e.x, e.z, .8); sfx('blades'); } } },
    { name: 'Colossal Blade', icon: '⚜️', mode: 'aim', range: 24, aimR: 6, desc: 'ULTIMATE. A colossal sword falls from the heavens onto the target: 160 damage and a huge launch. It stands for 5 s sending out shockwaves, and your halo fills with 6 swords.',
      cast(p, c) { const t = c.tgt.clone(), R = 6 * c.st.aoe; p.bd.swords = 6; fxe(c.m.key, 'fall', { x: t.x, z: t.z, r: R }); later(.55, () => { boomAt(c, t.x, .3, t.z, R, 130 * c.dmg, { kb: 10, lift: 11 }, 'impact'); ent(p, c, t.x, t.z, { life: 5, r: R + 1, solid: [{ x: t.x, z: t.z, r: .7 }], h: 9 }); }); },
      ent: { tick(n, dt) { if (pulse(n, dt, 1)) boomAt(ctxN(n), n.x, .2, n.z, n.r, 26 * n.mul, { kb: 7 }, 'wave'); } },
      view: { make() { const o = model('blades__colossal', 0xffcc33, { shadow: true }); o.rotation.y = rand(0, TAU); return o; },
        upd(o, n) { o.position.y = n.l < .15 ? -1.3 + 12 * ((.15 - n.l) / .15) ** 2 : -1.3; fade(o, Math.min(1, n.l / .15)); if (Math.random() < .4) emit(n.x + rand(-.5, .5), rand(1, 7), n.z + rand(-.5, .5), 0, rand(.5, 1.5), 0, 0xffe08a, rand(.1, .2), 1, -.2); },
        drop: o => o.removeFromParent() },
      fx: { fall(e) { circleFx('blades', V(e.x, .08, e.z), e.r, { life: 1.1 }); const yaw = rand(0, TAU); modelFx('blades__colossal', 0xffcc33, V(e.x, 60, e.z), .56, (o, k) => { o.rotation.y = yaw; o.position.y = 60 * (1 - k * k) - 1.3 * k; for (let i = 0; i < 4; i++) emit(e.x + rand(-1, 1), o.position.y + rand(0, 8), e.z + rand(-1, 1), 0, 10, 0, 0xffe08a, rand(.3, .6), .5); }); sfx('blades_big'); },
        impact(e) { boomFx(e.x, 1, e.z, e.r, 0xffcc33, 2.6); pillarFx(e.x, .05, e.z, e.r * .5, 14, 0xffcc33, 1); ringFx(e.x, .1, e.z, e.r * 1.6, 0xfff0b0, .8); dustFx(e.x, e.z, e.r, 0x8a7a60); flash(e.x, 3, e.z, 0xffe08a, 90, .5); shake(.9); sfx('ult'); sfx('smash'); },
        wave(e) { ringFx(e.x, .15, e.z, e.r, 0xffcc33, .55); burst(e.x, 1, e.z, 20, 0xffe08a, 6, .2, .4); sfx('blades'); } } },
  ],
},
// ================================================================== INK
ink: {
  name: 'Ink', color: 0x3a52ff, glyph: '🖌️', adj: 'INKED', react: { name: 'INKBLOT', kind: 'spread' },
  blurb: 'A calligrapher. Living ink: brush strokes that mire, koi that hunt, and a dragon painted across the sky.',
  passive: 'Bleeding Ink: monsters you kill with Ink burst in a splash that hits everything within 3 m for 15 and inks it. Inked enemies are 25% slower.',
  st: { slow: .25 },
  onKill(e, p) { const c = { p, el: 'ink', m: MOVE['ink.0'], dmg: stats(p).dmgMul }, x = e.x, z = e.z; later(.08, () => boomAt(c, x, .5, z, 3, 15 * c.dmg, { kb: 2 }, 'splash')); },
  moves: [
    { name: 'Ink Bolt', icon: '💧', cd: .4, desc: 'Fling a glob of ink that splashes where it lands, inking everything within 2 m.',
      cast(p, c) { for (let k = 0; k < c.multi; k++) shoot(p, c, 34, { d: lob(spread(c.d, k, c.multi, .1), .04), grav: 5, r: .3, dmg: 14.5 * c.dmg, kb: 2, sc: c.mega ? 1.8 : 1 }); },
      shot: { end: (s, why, e) => why !== 'life' && inkSplash(s, e, 2, .5) },
      look: { m: 'ink__drop', s: .9, trail: [0x3a52ff, .08, .3, 2, 1], light: 2 },
      fx: { splash(e) { inkDecal(e.x, e.z, e.r * .55, 1.6); burst(e.x, Math.max(.3, e.y), e.z, Math.round(10 + e.r * 5), 0x5a70ff, 4 + e.r, .14, .35, 8); if (e.r > 2.5) sfx('ink'); },
        det: e => boomFx(e.x, e.y, e.z, 2.5, 0x3a52ff, .6), nova: e => boomFx(e.x, .5, e.z, 4.5, 0x3a52ff, .8) } },
    { name: 'Brush Stroke', icon: '🖌️', cd: 5, desc: 'Sweep a giant brush through a 120° arc in front of you: 30 damage to everything within 7.5 m and a hard shove, leaving a crescent of wet ink that mires anything on it (50% slower) for 5 s.',
      cast(p, c) {
        const R = 7.5 * c.st.aoe, f = c.flat;
        for (const e of enemiesNear(p.x, p.z, R)) { const dx = e.x - p.x, dz = e.z - p.z, d = Math.hypot(dx, dz) || 1; if ((dx * f.x + dz * f.z) / d > .5) hitEnemy(e, 'ink', 30 * c.dmg, p, dx, dz, 6, { aoe: true }); }
        ent(p, c, p.x, p.z, { life: 5, r: R, yaw: Math.atan2(f.x, f.z) });
      },
      ent: { tick(n) { const fx = Math.sin(n.yaw), fz = Math.cos(n.yaw); for (const e of enemiesNear(n.x, n.z, n.r * 1.1)) { const dx = e.x - n.x, dz = e.z - n.z, d = Math.hypot(dx, dz) || 1; if (d > n.r * .62 && (dx * fx + dz * fz) / d > .5) e.fs = Math.max(e.fs || 0, .5); } } },
      view: { make(n) {
          const o = model('ink__stroke', 0x3a52ff, { flat: true }); o.scale.set(n.r, 1, n.r); o.rotation.y = n.yaw; o.position.y = INK_Y;
          // the brush itself sweeps the arc a moment ahead of the ink (local frame: +Z forward, +X to the side)
          const cy = Math.cos(n.yaw), sy = Math.sin(n.yaw), R = n.r * .86, w = (lx, lz) => V(n.x + lx * cy + lz * sy, 0, n.z - lx * sy + lz * cy);
          modelFx('ink__brush', 0x3a52ff, w(-R, 0), .32, (b, k) => { const a = (-60 + 120 * easeOut(k)) * Math.PI / 180, q = w(Math.sin(a) * R, Math.cos(a) * R); b.position.set(q.x, .15 + Math.sin(k * Math.PI) * .3, q.z); b.rotation.set(0, n.yaw + a, 0); b.rotateZ(-.55); b.scale.setScalar(1.5); fade(b, k > .8 ? (1 - k) * 5 : 1); if (Math.random() < .8) burst(q.x, .2, q.z, 3, 0x5a70ff, 3, .12, .3, 6); });
          sfx('ink_big'); return o;
        },
        upd(o, n) { o.position.y = INK_Y; fade(o, Math.min(1, n.t * 4, n.l * 5)); }, drop: dropFade(.3) } }, // (renderEnts eases y back to the entity's 0 every frame)
    { name: 'Ink Koi', icon: '🐟', cd: 9, desc: 'Paint three koi of living ink that swim low along the floor as if it were water, hunting the nearest enemies. Each one leaps up to bite for 26 and bursts in a splash of ink.',
      cast(p, c) { for (let i = 0; i < 3; i++) later(i * .1, () => { if (p.down) return; const c2 = ctxOf(p, c.m), f = c2.flat.clone().applyAxisAngle(UP, (i - 1) * .5); shoot(p, c2, 16, { o: V(p.x + f.x, p.y + .45, p.z + f.z), d: f, r: .45, life: 3.5, dmg: 30 * c.dmg, kb: 3, home: 5, swim: 1 }); }); },
      shot: { end: (s, why, e) => why !== 'life' && inkSplash(s, e, 2.2, .4), tick(s) { s.vy = (.45 - s.y) * 6; } }, // hug the floor (homing still steers them sideways)
      look: { m: 'ink__koi', s: 1.6, wag: 'ink__koi_tail', trail: [() => Math.random() < .5 ? 0x3a52ff : 0x9aa8ff, .1, .5, 0, 1], light: 2 } },
    { name: 'Ink Pool', icon: '🫧', cd: 12, mode: 'aim', range: 20, aimR: 4.5, desc: 'Pour a pool of ink at the target for 6 s. Every enemy that wades in is seized by the ink and stuck fast for 1.5 s, then mired (50% slower) while it stays, taking damage every second.',
      cast(p, c) { ent(p, c, c.tgt.x, c.tgt.z, { life: 6, r: 4.5 * c.st.aoe }); },
      ent: { tick(n, dt) {
        const p = own(n), es = enemiesNear(n.x, n.z, n.r), tick = pulse(n, dt, 1);
        for (const e of es) {
          e.fs = Math.max(e.fs || 0, .5);
          if (ready(n, e, 99)) { hitEnemy(e, 'ink', 14 * n.mul, p, 0, 0, 0, { aoe: true }); cc(e, 'root', 1.5, p); fxe(n.mv, 'seize', { x: e.x, z: e.z }); }
          else if (tick) hitEnemy(e, 'ink', 8 * n.mul, p, 0, 0, 0, { aoe: true, noCombo: true });
        }
      } },
      view: { make(n) { const o = model('ink__pool', 0x3a52ff, { flat: true }); o.rotation.y = rand(0, TAU); burst(n.x, .3, n.z, 40, 0x5a70ff, 6, .2, .5, 8); sfx('ink_big'); return o; },
        upd(o, n, dt) { const s = n.r * easeOutBack(Math.min(1, n.t * 3)); o.scale.set(s, 1, s); o.position.y = INK_Y; o.rotation.y += dt * .05; fade(o, Math.min(1, n.l * 6));
          if (Math.random() < .25) { const a = rand(0, TAU), d = rand(0, n.r * .8); emit(n.x + Math.cos(a) * d, .05, n.z + Math.sin(a) * d, 0, rand(.4, 1), 0, 0x9aa8ff, rand(.08, .16), .5, 2); } }, // bubbles
        drop: dropFade(.4) },
      fx: { seize(e) { burst(e.x, .3, e.z, 18, 0x5a70ff, 3, .2, .5, -3); ringFx(e.x, .08, e.z, 1.2, 0x3a52ff, .35); inkDecal(e.x, e.z, .7, 1.5); sfx('ink'); } } },
    { name: 'Ink Dragon', icon: '🐉', mode: 'aim', range: 26, aimR: 9, desc: 'ULTIMATE. Paint a great ink dragon that bursts from the floor and coils around the target for 4 s. Its body is a cage: nothing caught inside can get out, and the coil tightens, squeezing everyone toward the centre while ink rains on them. Then it dives in: 90 damage and a 1.2 s stun.',
      cast(p, c) { const t = c.tgt, R = 9 * c.st.aoe; ent(p, c, t.x, t.z, { life: 4.6, r: R, y: -1.5, cx: t.x, cz: t.z, a0: Math.atan2(p.z - t.z, p.x - t.x), ids: enemiesNear(t.x, t.z, R).filter(e => !ET[e.type].boss).map(e => e.id) }); fxe(c.m.key, 'rise', { x: t.x, z: t.z, r: R }); },
      ent: { tick(n, dt) { // coil inward round the centre for 4 s, then dive into it
        const T = 4, t = n.t;
        if (t < T) {
          const a = n.a0 + t * 1.9, r = n.r * (1 - .45 * t / T);
          n.x = n.cx + Math.cos(a) * r; n.z = n.cz + Math.sin(a) * r; n.y = -1.5 + 6 * Math.min(1, t * 1.6) + Math.sin(t * 3.1) * 1.1;
          if (t > .5 && pulse(n, dt, .25)) blast(n.x, n.z, 3, 16 * n.mul, ctxN(n), { raw: true, kb: 2 });
          for (const id of n.ids) { const e = S.enemies.find(x => x.id === id && alive(x)); if (!e) continue; const dx = e.x - n.cx, dz = e.z - n.cz, d = Math.hypot(dx, dz), lim = Math.max(1, r - 1.2); if (d > lim) { e.x = n.cx + dx / d * lim; e.z = n.cz + dz / d * lim; e.kx = e.kz = 0; } } // the cage
        } else {
          n.d0 ??= [n.x, n.y, n.z]; const k = Math.min(1, (t - T) / .45);
          n.x = n.d0[0] + (n.cx - n.d0[0]) * k; n.y = n.d0[1] + (-2 - n.d0[1]) * k * k; n.z = n.d0[2] + (n.cz - n.d0[2]) * k;
          if (k >= 1 && !n.hitDone) { n.hitDone = 1; boomAt(ctxN(n), n.cx, .2, n.cz, 5.5, 90 * n.mul, { kb: 6, cc: ['stun', 1.2] }, 'crash'); }
        }
      } },
      view: { make(n) {
          const SEGS = 30, o = model('ink__dragon_head', 0x3a52ff, { shadow: true }), u = o.userData; o.scale.setScalar(2.4);
          u.body = new THREE.Group(); scene.add(u.body); u.trail = [];
          u.segs = Array.from({ length: SEGS }, (_, k) => { const s = model('ink__dragon_seg', 0x3a52ff, { shadow: true }); s.scale.setScalar(2.2 * (1 - .7 * (k / SEGS) ** 1.5)); u.body.add(s); u.mats.push(...s.userData.mats); return s; }); // tapering to the tail
          sfx('ult'); return o;
        },
        upd(o, n, dt, t) { // the body follows the path the head has drawn, like a brush stroke
          const u = o.userData, h = o.position, tr = u.trail, last = tr[tr.length - 1];
          if (!last || last.distanceTo(h) > .2) { tr.push(h.clone()); if (tr.length > 120) tr.shift(); }
          const at = dist => { for (let i = tr.length - 1; i > 0; i--) { const L = tr[i].distanceTo(tr[i - 1]); if (dist <= L) return tr[i].clone().lerp(tr[i - 1], dist / L); dist -= L; } return tr[0].clone(); };
          if (tr.length > 1) o.lookAt(h.clone().add(h.clone().sub(at(.6)))); // face the way it is flying
          u.segs.forEach((s, k) => { const q = at(1.3 + k * .5); s.position.copy(q); s.lookAt(at(.8 + k * .5)); s.rotateZ(Math.sin(t * 4 - k * .3) * .2); s.visible = q.y > -1.2; }); // overlapping, so they read as one body
          fade(o, Math.min(1, n.l * 12));
          if (Math.random() < .7) { const s = pick(u.segs); emit(s.position.x, s.position.y - .2, s.position.z, rand(-.3, .3), -rand(2, 5), rand(-.3, .3), Math.random() < .6 ? 0x3a52ff : 0x9aa8ff, rand(.12, .25), .7, 6); } // ink raining off it
          if (h.y < .4 && h.y > -.8 && Math.random() < .5) burst(h.x, .1, h.z, 6, 0x5a70ff, 4, .2, .4, 8); // breaking the surface
        },
        drop(o) { o.userData.body.removeFromParent(); o.removeFromParent(); } },
      fx: { rise(e) { circleFx('ink', V(e.x, .08, e.z), e.r, { life: 4.6 }); inkDecal(e.x, e.z, e.r * .5, 4.6); shake(.3); },
        crash(e) { inkDecal(e.x, e.z, e.r * .9, 3.5); boomFx(e.x, .5, e.z, e.r, 0x3a52ff, 1.6); pillarFx(e.x, .05, e.z, e.r * .5, 10, 0x3a52ff, .7); burst(e.x, .5, e.z, 70, 0x9aa8ff, 10, .3, .8, 10); shake(.7); sfx('ink_big'); } } },
  ],
},
};

// each element's cast sounds plug into the synth table (slot LMB/RMB use <el>, skills and ultimates use <el>_big)
