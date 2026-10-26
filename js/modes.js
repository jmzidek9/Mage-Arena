// Mage Arena game modes beyond the Arena: the 1v1 Duel (here) and the Dungeon (dungeon.js). Host-side rules plus the map switch both machines run.
// Loaded after sim.js (uses its state and helpers) and before view.js.
'use strict';

// ===================== map switch (host and guest) =====================
const DUEL_R = 14;
let mapMode = null;
// set the rules' map shape and show that map's scenery; called when a game starts and on the guest when the host's mode arrives
function applyMap(mode) {
  S.mode = mode;
  MAP.r = mode === 'duel' ? DUEL_R : ARENA_R;
  MAP.rects = MAP.erects = null;
  PILLARS.length = 0; PILLARS.push(...(mode === 'duel' ? DUEL_PILLARS : ARENA_PILLARS));
  if (mode === 'dungeon') dunMap(); // the floor itself is in dungeon.js
  if (mapMode !== mode) { mapMode = mode; showScenery(mode); }
}

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
}
function showScenery(mode) {
  const under = mode === 'dungeon';
  arena.visible = mode === 'arena'; duelG.visible = mode === 'duel'; dunView.visible = under;
  for (const l of amb.lights) l.visible = mode === 'arena';
  for (const l of duelAmb.lights) l.visible = mode === 'duel';
  for (const l of dunLights) l.visible = under;
  for (const o of skyBits) o.visible = !under;
  moon.intensity = under ? 0 : 2; rim.intensity = under ? 0 : .35; // underground: torchlight only
  hemi.color.set(under ? 0x8a6a50 : 0x8d94a8); hemi.groundColor.set(under ? 0x141010 : 0x2b241d); hemi.intensity = under ? .8 : .35; lantern.visible = under;
  scene.fog.color.set(under ? 0x060505 : 0x0e0f13); scene.fog.density = under ? .022 : .007;
}
