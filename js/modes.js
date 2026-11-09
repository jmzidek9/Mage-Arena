// Mage Arena game modes beyond the Arena: Training and the 1v1 Duel (here) and the Dungeon (dungeon.js). Host-side rules plus the map switch both machines run.
// Loaded after sim.js (uses its state and helpers) and before view.js.
'use strict';

// ===================== map switch (host and guest) =====================
const DUEL_R = 14;
let mapMode = null;
// set the rules' map shape and show that map's scenery; called when a game starts and on the guest when the host's mode arrives
function applyMap(mode) {
  S.mode = mode;
  MAP.r = mode === 'duel' ? DUEL_R : ARENA_R;
  MAP.rects = MAP.erects = null; MAP.caps = null;
  PILLARS.length = 0; PILLARS.push(...(mode === 'duel' ? DUEL_PILLARS : ARENA_PILLARS));
  if (mode === 'arena') islandMap(); // the islands and bridges built so far (areas.js)
  if (mode === 'train') MAP.r = TRAIN_R; // its own round yard
  if (mode === 'dungeon') dunMap(); // the floor itself is in dungeon.js
  if (mode === 'city') cityMap(); // and the city in city.js
  if (mapMode !== mode) { mapMode = mode; showScenery(mode); }
}

// ===================== training =====================
// Its own floating yard, laid out for testing moves: you start at (0, 8) looking down a range lane with gold lines every
// 5 m, a dummy at 10 m, a heavy at 20 m and a boss at 29 m; a packed crowd on the left for area moves, and a pen of
// moving targets on the right. The dummies never attack, respawn 1.5 s after they die, and walk back to their post after
// being knocked away. You can't be hurt, every element is in the Esc menu, and a panel shows total damage, DPS over the
// last 5 s and damage per move (S.dmgBy, see damage()). N: cooldowns off / on (your ultimate is always ready while they are off). X: reset the meter.
const TRAIN_R = 30;
const TRAIN_STATIONS = [ // [label, x, z, pad radius, colour, dummies [type, dx, dz, hp, 1 = walks about]]
  ['Target · 10 m', 0, -2, 1.6, 0xe9c46a, [['grunt', 0, 0, 500]]],
  ['Heavy · 20 m', 0, -12, 2, 0xff9a3a, [['brute', 0, 0, 2000]]],
  ['Boss · 29 m', 0, -21, 3, 0xff4a5a, [['boss', 0, 0, 12000]]],
  ['Crowd', -14, -4, 3.4, 0x6ad8ff, [['grunt', 0, 0, 500], ...[0, 1, 2, 3, 4, 5].map(i => ['grunt', 2.1 * Math.sin(i * TAU / 6), 2.1 * Math.cos(i * TAU / 6), 500])]],
  ['Moving', 14, -4, 5, 0x7ad8a0, [['runner', -2, 0, 300, 1], ['runner', 2, 1, 300, 1], ['runner', 0, -2, 300, 1]]],
];
const TRAIN_SPOTS = TRAIN_STATIONS.flatMap(([, x, z, r, , ds]) => ds.map(([type, dx, dz, hp, walk]) => [type, x + dx, z + dz, hp, walk, x, z, r]));
// the yard's scenery, built the first time Training opens (so the sign font has loaded)
const trainG = new THREE.Group(), trainLights = []; trainG.visible = false; scene.add(trainG);
function buildTrain() {
  if (trainG.children.length) return;
  const mat = (n, fb) => arenaMat(n) || new THREE.MeshStandardMaterial({ color: fb });
  const glow = c => new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: .85, depthWrite: false, toneMapped: false });
  const canvas = (w, h, draw) => { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t; };
  const text = (s, col, w = 512, h = 128) => canvas(w, h, g => { g.font = `700 ${h * .5}px Cinzel, Georgia, serif`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.shadowColor = col; g.shadowBlur = h * .18; g.fillStyle = '#fff6d8'; g.fillText(s, w / 2, h / 2); });
  const add = (geo, m, x = 0, y = 0, z = 0) => { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.receiveShadow = !m.isMeshBasicMaterial; trainG.add(o); return o; };
  // floor: slate tiles 5 m across with a faint line every metre (tile edges line up with the centre)
  const floor = canvas(512, 512, (g, w) => {
    g.fillStyle = '#2e2b38'; g.fillRect(0, 0, w, w); const n = 5, s = w / n;
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) { g.fillStyle = `hsl(255,7%,${31 + ((i * 7 + j * 3) % 5) * 1.6}%)`; g.fillRect(i * s + 2, j * s + 2, s - 4, s - 4); }
    g.strokeStyle = 'rgba(233,196,106,.38)'; g.lineWidth = 5; g.strokeRect(0, 0, w, w);
  });
  floor.wrapS = floor.wrapT = THREE.RepeatWrapping; floor.repeat.set(TRAIN_R * 2 / 5, TRAIN_R * 2 / 5);
  add(new THREE.CircleGeometry(TRAIN_R, 128).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ map: floor, roughness: .85 }));
  add(new THREE.CylinderGeometry(TRAIN_R, TRAIN_R * .97, 1.6, 128, 1, true), mat('slab', 0x504b5d), 0, -.8, 0);
  const under = new THREE.ConeGeometry(TRAIN_R * .97, 22, 40, 6).rotateX(Math.PI), p = under.attributes.position; // a ragged rock root under the yard
  for (let i = 0; i < p.count; i++) { const y = p.getY(i), k = (11 - y) / 22, n = 1 + Math.sin(i * 12.9898) * .18 * k; p.setX(i, p.getX(i) * n); p.setZ(i, p.getZ(i) * n); }
  under.computeVertexNormals(); add(under, mat('rock', 0x796f79), 0, -12.6, 0);
  add(new THREE.TorusGeometry(TRAIN_R - .15, .16, 8, 160).rotateX(Math.PI / 2), mat('gold', 0xf9d789), 0, .05, 0);
  // the range lane: a gold line and a label every 5 m from the start, between two faint rails
  for (const x of [-2.6, 2.6]) add(new THREE.PlaneGeometry(.06, 30).rotateX(-Math.PI / 2), glow(0xe9c46a), x, .02, 8 - 15).material.opacity = .35;
  for (let d = 5; d <= 30; d += 5) {
    add(new THREE.PlaneGeometry(5.2, d % 10 ? .08 : .14).rotateX(-Math.PI / 2), glow(0xe9c46a), 0, .025, 8 - d);
    add(new THREE.PlaneGeometry(4, 1).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ map: text(`${d} m`, "#e9c46a"), transparent: true, depthWrite: false }), -5, .03, 8 - d + .4);
  }
  // stations: a glowing pad and a sign on a post, turned to face the start
  for (const [label, x, z, r, col] of TRAIN_STATIONS) {
    add(new THREE.RingGeometry(r - .12, r, 64).rotateX(-Math.PI / 2), glow(col), x, .03, z);
    add(new THREE.CircleGeometry(r, 64).rotateX(-Math.PI / 2), glow(col), x, .015, z).material.opacity = .08;
    const px = x ? x - Math.sign(x) * (r + .8) : 3.6, pz = x ? z + r * .6 : z, yaw = Math.atan2(0 - px, 8 - pz);
    add(new THREE.CylinderGeometry(.08, .1, 3, 8), mat('bronze', 0xc4a06c), px, 1.5, pz);
    const board = add(new THREE.PlaneGeometry(3, .75), new THREE.MeshBasicMaterial({ map: text(label, '#' + col.toString(16).padStart(6, '0')), transparent: true, side: THREE.DoubleSide, depthWrite: false }), px, 3.1, pz);
    board.rotation.y = yaw;
  }
  // crystal lamps round the rim
  for (let i = 0; i < 8; i++) {
    const a = (i + .5) * TAU / 8, x = Math.sin(a) * (TRAIN_R - 1.4), z = Math.cos(a) * (TRAIN_R - 1.4);
    add(new THREE.CylinderGeometry(.35, .5, 1.4, 8), mat('slab', 0x504b5d), x, .7, z);
    add(new THREE.OctahedronGeometry(.5), mat(i % 2 ? 'crystal_cyan' : 'crystal_violet', 0xdaa0ff), x, 2, z).scale.y = 1.6;
    if (i % 2 === 0) { const l = new THREE.PointLight(0xb8a0ff, 18, 24, 2); l.position.set(x, 2.6, z); l.visible = false; scene.add(l); trainLights.push(l); }
  }
}
function startTrain() {
  S.wave = 1; S.phase = 'fight'; S.budget = 0; S.bossLeft = 0;
  S.cheat = { ...(S.cheat || {}), inv: 1, allEl: 1 };
  S.dmgBy = {}; S.trn = { spots: TRAIN_SPOTS.map(([type, x, z, hp, walk, px, pz, pr]) => ({ type, x, z, hp, walk, px, pz, pr, id: 0, t: 0 })), hist: [], t0: S.t };
}
function stepTrain(dt) {
  const T = S.trn; if (!T) return;
  for (const q of T.spots) {
    if (q.id && S.enemies.some(e => e.id === q.id && !e.dead)) continue;
    if ((q.t -= dt) > 0) continue;
    if (q.id) { q.id = 0; q.t = 1.5; continue; } // it died: back in a moment
    const e = spawnEnemy(q.type, q.x, q.z); e.hp = e.max = q.hp; e.dummy = q.walk ? 2 : 1; e.yaw = Math.atan2(-q.x, 8 - q.z); q.id = e.id;
    e.home = [q.x, q.z, q.px, q.pz, q.pr];
  }
  const tot = Object.values(S.dmgBy).reduce((a, b) => a + b, 0);
  T.hist.push([S.t, tot]); while (T.hist.length > 2 && S.t - T.hist[0][0] > 5) T.hist.shift();
  T.tot = tot; T.dps = Math.round((tot - T.hist[0][1]) / Math.max(1, S.t - T.hist[0][0]));
}
// a dummy: takes hits, knockback and crowd control like any monster, but never attacks; standing ones walk back to
// their post once knocked away, walkers stroll round their pen
function stepDummy(e, dt, hard) {
  e.atk = null; e.v = 0;
  if (hard || !e.home) return;
  const [hx, hz, cx, cz, pr] = e.home;
  if (e.dummy !== 2) {
    const dx = hx - e.x, dz = hz - e.z, d = Math.hypot(dx, dz); if (d < .25) { e.yaw = Math.atan2(-e.x, 8 - e.z); return; }
    const sp = Math.min(d, 3 * dt); e.x += dx / d * sp; e.z += dz / d * sp; e.yaw = Math.atan2(dx, dz); e.v = 3; return;
  }
  const d = Math.hypot(e.x - cx, e.z - cz);
  if (d > pr - .8) e.wander = Math.atan2(cx - e.x, cz - e.z); else e.wander += rand(-1.5, 1.5) * dt;
  const sp = 2.4 * (1 - Math.min(.85, Math.max(e.m.slow, e.fs || 0))); e.fs = 0;
  e.x += Math.sin(e.wander) * sp * dt; e.z += Math.cos(e.wander) * sp * dt; e.yaw = e.wander; e.v = sp;
}
addEventListener('keydown', e => {
  if (S.mode !== 'train' || !playing || role === 'guest' || !$('settings')?.classList.contains('hidden')) return;
  if (e.code === 'KeyN') { const C = S.cheat ||= {}; C.cd = !C.cd; if (C.cd) for (const p of players()) p.ult = 1; banner(C.cd ? 'COOLDOWNS OFF' : 'COOLDOWNS ON', '#7ad8a0', 1200); sfx('pick'); }
  if (e.code === 'KeyX') { S.dmgBy = {}; if (S.trn) S.trn.hist = []; banner('DAMAGE METER RESET', '#7ad8a0', 1000); sfx('pick'); }
});
// the panel (host / solo: the numbers live on the host)
function renderTrain() {
  const on = S.mode === 'train' && playing && role !== 'guest', P = $('train');
  P.classList.toggle('hidden', !on); if (!on) return;
  const T = S.trn || {}, by = Object.entries(S.dmgBy || {}).sort((a, b) => b[1] - a[1]), top = by[0]?.[1] || 1;
  const nm = k => MOVE[k] ? `${['LMB', 'RMB', 'Q', 'E', 'R'][MOVE[k].slot]} · ${MOVE[k].name}` : k === 'status' ? 'Statuses & passives' : k;
  P.innerHTML = `<h4>Training</h4><div class="big"><b>${(T.tot || 0).toLocaleString()}</b> damage · <b>${T.dps || 0}</b> DPS</div>`
    + by.slice(0, 10).map(([k, v]) => `<div class="row"><span>${nm(k)}</span><span>${v.toLocaleString()}</span><i style="width:${v / top * 100}%"></i></div>`).join('')
    + `<div class="keys"><kbd>N</kbd> cooldowns ${S.cheat?.cd ? '<b>off</b>' : 'on'} · <kbd>X</kbd> reset · <kbd>Esc</kbd> switch element</div>`;
}
setInterval(renderTrain, 250);

// ===================== 1v1 duel =====================
// Each wizard gets an invisible stand-in enemy that follows them, so every move (shots, zones, chains, summons, reactions)
// can hit the other wizard unchanged; alive() hides your own stand-in from your own moves (S.actor).
ET.duelist = { hp: 300, spd: 0, r: .45, h: 1.8, dmg: 0, reach: 0, cost: 0, from: 99, kb: 1, poise: 1e9, atk: 'swipe', wind: 1, cd: 1, zone: 'duel' };
const DUEL_HP = 300, DUEL_SPOTS = { h: [0, 9, 0], g: [0, -9, Math.PI] };

function syncStandIns() {
  for (const p of players()) {
    let e = S.enemies.find(x => x.pid === p.id);
    if (!e) { e = spawnEnemy('duelist', p.x, p.z); S.events.pop(); e.rise = 0; e.pid = p.id; } // pop: no spawn ring for a stand-in
    e.x = p.x; e.z = p.z; e.y = Math.max(0, p.y); e.yaw = p.yaw + Math.PI; e.max = p.max; e.hp = p.hp;
  }
}
// a stand-in's knockback, launches and crowd control become the wizard's (as running totals the owner applies)
function handToWizard(e, hard, ctype) {
  const p = S.players[e.pid];
  if (!p) { e.dead = true; return; }
  const k = p.kick ??= [0, 0, 0];
  k[0] += e.kx; k[1] += e.kz; e.kx = e.kz = 0;
  if (e.vy > 0) { k[2] += e.vy; e.vy = 0; }
  if (hard) p.bf.stun = Math.max(p.bf.stun || 0, e.cc.t); // (charm and polymorph reach a wizard as a stun, see cc)
  else if (ctype === 'root') p.bf.root = Math.max(p.bf.root || 0, e.cc.t);
}
function startDuel() {
  if (!S.players.g) { // nobody joined: an AI wizard with a different element
    const g = S.players.g = newPlayer('g', pick(ELIST.filter(k => k !== S.players.h.el)));
    g.ai = true;
  }
  for (const p of players()) { p.max = p.hp = DUEL_HP; p.ult = 0; }
  S.duel = { round: 1, wins: { h: 0, g: 0 } };
  duelReset(); S.phase = 'rest'; S.restT = 3;
  ev({ k: 'duel', f: 'ready', n: 1 });
}
function duelReset() {
  S.shots = []; S.ents = []; S.timers = []; S.rings = []; S.tstop = 0;
  S.enemies = S.enemies.filter(e => !e.pid); // fresh stand-ins: no statuses carried into the next round
  for (const p of players()) {
    const [x, z, yaw] = DUEL_SPOTS[p.id];
    Object.assign(p, { hp: p.max, down: false, rev: 0, ch: null, chg: null, bf: {}, bd: {}, cds: {}, mo: null });
    p.spawn = { x, z, yaw, n: (p.spawn?.n || 0) + 1 }; // the owner moves itself there (the guest owns its position)
  }
}
function stepDuel(dt) {
  const D = S.duel;
  if (S.phase === 'rest' || S.phase === 'round') {
    if ((S.restT -= dt) > 0) return;
    if (S.phase === 'round') { duelReset(); S.phase = 'rest'; S.restT = 2.5; ev({ k: 'duel', f: 'ready', n: D.round }); }
    else { S.phase = 'fight'; ev({ k: 'duel', f: 'fight' }); }
    return;
  }
  if (S.phase !== 'fight') return;
  const lost = p => p.down || p.y < -4, out = players().filter(lost);
  if (!out.length) return;
  if (out.length === players().length) { S.phase = 'round'; S.restT = 2.5; ev({ k: 'duel', f: 'draw' }); return; } // both out at once: replay it
  const w = players().find(p => !lost(p)).id;
  D.wins[w]++; D.round++;
  ev({ k: 'duel', f: 'round', w, ring: out[0].y < -4 ? 1 : 0, h: D.wins.h, g: D.wins.g });
  if (D.wins[w] >= 2) { S.phase = 'over'; ev({ k: 'over', duel: 1, w, h: D.wins.h, g: D.wins.g }); }
  else { S.phase = 'round'; S.restT = 3; }
}

// AI wizard: keeps a comfortable range, strafes, stays off the edge, dashes and jumps now and then,
// holds its basic attack and mixes in skills (held for their aim / charge / channel time) and its ultimate.
// ponytail: no line-of-sight or dodge-reading; a smarter brain (cover behind pillars, punishing casts) if it feels too easy
function duelAI(p, dt) {
  const A = p.ai === true ? (p.ai = { strafe: 1, hold: -1, holdT: 0, jumpN: 0, dashN: 0, nextMove: 1.5, nextDash: 3, err: 0, errT: 0 }) : p.ai;
  const inp = { yaw: p.yaw, pitch: p.pitch, mx: 0, mz: 0, k: [], jump: false, jumpN: A.jumpN, dashN: A.dashN, swapN: p.swapN };
  const o = players().find(q => q !== p);
  if (!o || o.down) return inp;
  const dx = o.x - p.x, dz = o.z - p.z, d = Math.hypot(dx, dz) || 1;
  if ((A.errT -= dt) <= 0) { A.errT = rand(.3, .7); A.err = rand(-.06, .06); }
  const held = A.hold >= 0 ? kitOf(p).moves[A.hold] : null;
  inp.yaw = lerpAngle(p.yaw, Math.atan2(-dx, -dz) + A.err, Math.min(1, dt * 8));
  inp.pitch = Math.atan2((held?.mode === 'aim' ? 0 : o.y + 1.1) - (p.y + 1.65), d) + A.err * .4; // feet for ground-target moves, chest otherwise
  if (Math.random() < dt * .4) A.strafe *= -1;
  let mz = d > 13 ? 1 : d < 7 ? -1 : 0, mx = A.strafe;
  const r = Math.hypot(p.x, p.z);
  if (r > MAP.r - 3.5) { // too near the edge: head for the middle
    const cx = -p.x / r, cz = -p.z / r;
    mz = cx * -Math.sin(inp.yaw) + cz * -Math.cos(inp.yaw); mx = cx * Math.cos(inp.yaw) + cz * -Math.sin(inp.yaw);
  }
  inp.mx = clamp(mx, -1, 1); inp.mz = clamp(mz, -1, 1);
  if ((A.nextDash -= dt) <= 0) { A.nextDash = rand(2.5, 5); inp.dashN = ++A.dashN; }
  if (Math.random() < dt * .25 && p.y === 0) inp.jumpN = ++A.jumpN;
  inp.k[0] = A.hold < 0;
  if (A.hold >= 0) { inp.k[A.hold] = (A.holdT -= dt) > 0; if (A.holdT <= -.05) A.hold = -1; }
  else if ((A.nextMove -= dt) <= 0) {
    A.nextMove = rand(1.2, 2.6);
    const s = p.ult >= 1 ? 4 : pick([1, 2, 3]), m = kitOf(p).moves[s];
    if (canCast(p, m)) { A.hold = s; A.holdT = m.mode === 'channel' ? 1.6 : m.mode === 'charge' ? m.charge || 1 : m.mode === 'aim' ? .5 : .08; }
  }
  return inp;
}

// ===================== start / scenery =====================
// called by startGame once the players exist
function startMode() {
  applyMap(S.mode);
  if (S.mode === 'duel') startDuel();
  if (S.mode === 'dungeon') startDungeon();
  if (S.mode === 'train') startTrain();
  if (S.mode === 'city') { cityReset(); ev({ k: 'cityreset' }); } // every block back in place, on both machines
}
function showScenery(mode) {
  const under = mode === 'dungeon';
  if (mode === 'train') buildTrain();
  arena.visible = mode === 'arena'; trainG.visible = mode === 'train'; duelG.visible = mode === 'duel'; dunView.visible = under; cityG.visible = mode === 'city';
  for (const l of cityLights) l.visible = false; // cityFrame lights the nearest braziers
  if (mode !== 'city') { moon.position.copy(BH).multiplyScalar(70); moon.target.position.set(0, 0, 0); moon.target.updateMatrixWorld(); }
  Object.assign(moon.shadow.camera, mode === 'city' ? { left: -42, right: 42, top: 42, bottom: -42 } : { left: -27, right: 27, top: 27, bottom: -27 }); moon.shadow.camera.updateProjectionMatrix();
  for (const l of amb.lights) l.visible = mode === 'arena';
  for (const l of trainLights) l.visible = mode === 'train';
  for (const l of duelAmb.lights) l.visible = mode === 'duel';
  for (const l of dunLights) l.visible = under;
  for (const o of skyBits) o.visible = !under;
  moon.intensity = under ? 0 : 2; rim.intensity = under ? 0 : .35; // underground: torchlight only
  hemi.color.set(under ? 0x8a6a50 : 0x8d94a8); hemi.groundColor.set(under ? 0x141010 : 0x2b241d); hemi.intensity = under ? .8 : .35; lantern.visible = under;
  scene.fog.color.set(under ? 0x060505 : 0x0e0f13); scene.fog.density = under ? .022 : mode === 'city' ? .0055 : .007;
}
