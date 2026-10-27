// Mage Arena: snapshots, PeerJS networking (host-authoritative), game start, self-test and the main loop.
'use strict';

// bump when the network format or game rules change: players on different builds get told to refresh
const GAME_VERSION = '2.5.0';

// ===================== snapshot (sent to the guest, and what both sides render from) =====================
const bfSnap = bf => { const o = {}; for (const k in bf) if (bf[k] > 0) o[k] = r2(bf[k]); return o; };
const snap = () => ({
  phase: S.phase, mode: S.mode, wave: S.wave, mod: S.mod, ts: S.tstop > 0 ? 1 : 0,
  duel: S.duel, dun: S.dun && { floor: S.dun.floor, seed: S.dun.seed, o: S.dun.o, st: S.dun.st, stairs: S.dun.stairs, wait: S.dun.wait },
  players: Object.fromEntries(Object.values(S.players).map(p => [p.id, { id: p.id, ai: p.ai ? 1 : 0, kick: p.kick, spawn: p.spawn, tp: p.tp, el: p.el, el2: p.el2, cur: p.cur, x: r2(p.x), y: r2(p.y), z: r2(p.z), yaw: r2(p.yaw), pitch: r2(p.pitch),
    hp: Math.round(p.hp), max: p.max, down: p.down, rev: r2(p.rev), up: p.up, ult: r2(p.ult), bf: bfSnap(p.bf), ch: p.ch, chT: r2(p.chT), combo: p.combo, stats: p.stats,
    r: [Math.round(p.bd.heat || 0), p.bd.souls || 0, p.bd.arc || 0, p.bd.swords || 0, 0, (p.bd.runeN || 0) % 3, p.bd.foc && S.t - p.bd.foc.t < 1.5 ? p.bd.foc.n : 0] }])), // element resources: heat, souls, arcane charges, swords, (unused), rune count, laser focus
  enemies: S.enemies.filter(e => !e.pid).map(e => ({ id: e.id, type: e.type, x: r2(e.x), y: r2(e.y), z: r2(e.z), yaw: r2(e.yaw), hp: Math.round(e.hp), max: Math.round(e.max), sc: e.sc, elite: e.elite,
    st: Object.keys(e.st).map(k => ELIST.indexOf(k)), cc: e.cc?.type || 0, a: e.atk ? r2(1 - e.atk.t / e.atk.max) : 0, sh: Math.round(e.sh), lk: e.link?.g || 0, ts: S.tstop > 0 ? 1 : 0 })),
  shots: S.shots.slice(-160).map(s => ({ id: s.id, mv: s.mv, el: s.el, foe: s.foe ? 1 : 0, x: r2(s.x), y: r2(s.y), z: r2(s.z), vx: r2(s.vx), vy: r2(s.vy), vz: r2(s.vz), sc: r2(s.sc || 1) })),
  ents: S.ents.slice(-120).map(n => ({ id: n.id, mv: n.mv, el: n.el, kind: n.kind, own: n.own, x: r2(n.x), y: r2(n.y || 0), z: r2(n.z), r: r2(n.r), yaw: r2(n.yaw || 0), t: r2(n.t), l: r2(Math.max(0, n.life / n.max)), s: n.s, v: n.v ? 1 : 0, ...(n.fx0 != null ? { fx0: r2(n.fx0), fz0: r2(n.fz0) } : {}) })),
});

// ===================== start =====================
function startGame() {
  initAudio();
  Object.assign(S, { duel: null, dun: null, phase: 'rest', mode: myMode, t: 0, wave: 0, enemies: [], shots: [], ents: [], rings: [], timers: [], events: [], restT: 2.5, hitstop: 0, slowmo: 0, tstop: 0, mod: null });
  S.players = { h: withTalents(newPlayer('h', myEl, myEl2), PROG.tal) };
  if (myEl2) S.players.h.up.second = 1;
  if (conn && guestEl) { S.players.g = withTalents(newPlayer('g', guestEl, guestEl2), guestTal); if (guestEl2) S.players.g.up.second = 1; }
  timeFx = 0; $('mod').textContent = ''; // no wave or dungeon note left over from the last game
  startMode();
  showGame();
}
let solo = false;
$('startBtn').onclick = () => { solo = false; startGame(); };
$('againBtn').onclick = () => solo ? startSolo() : startGame();
$('soloBtn').onclick = () => { solo = true; startSolo(); };
function startSolo() {
  startGame();
  const p = S.players.h;
  banner(p.el2 ? `${EL[p.el].name.toUpperCase()} + ${EL[p.el2].name.toUpperCase()} · TAB TO SWAP` : `${EL[p.el].glyph} ${EL[p.el].name.toUpperCase()}`, css(EL[p.el].color), 3200);
}
$('gfxBtn').textContent = `Graphics: ${HQ ? 'High' : 'Low'}`;
$('gfxBtn').onclick = () => { try { localStorage.setItem('magepact_gfx', HQ ? 'low' : 'high'); } catch {} location.reload(); };

// settings (remembered per browser). General: sensitivity, volume. Visuals: field of view, brightness, bloom, shadows, film filter
let baseFov = 75;
function applySettings(o) {
  sens = .0022 * o.sens; sfxVol = .35 * o.vol; if (master) master.gain.value = sfxVol; musicVol = .4 * o.mus; if (musicBus) musicBus.gain.value = musicVol; baseFov = o.fov;
  renderer.toneMappingExposure = 1.1 * o.bright;
  const pr = (HQ ? Math.min(devicePixelRatio, 2) : 1) * o.scale; // render scale: fewer pixels for slow laptops, live
  if (renderer.getPixelRatio() !== pr) { renderer.setPixelRatio(pr); composer.setSize(innerWidth, innerHeight); }
  if (bloomPass) bloomPass.enabled = o.bloom && HQ;
  if (renderer.shadowMap.enabled !== o.shadows) { renderer.shadowMap.enabled = moon.castShadow = o.shadows; scene.traverse(m => { if (m.material) m.material.needsUpdate = true; }); }
  filmPass.uniforms.uFilm.value = o.film ? 1 : 0;
  shakeMul = o.shake; showNums = o.nums; invertY = o.invert; Object.assign(BIND, BIND_DEF, o.keys); hudKey = '';
  $('sSens').value = o.sens; $('sVol').value = o.vol; $('sMus').value = o.mus; $('sFov').value = o.fov; $('sBright').value = o.bright; $('sScale').value = o.scale;
  $('cBloom').checked = o.bloom; $('cBloom').disabled = !bloomPass || !HQ; $('cShadows').checked = o.shadows; $('cFilm').checked = o.film; $('cNums').checked = o.nums; $('cInvert').checked = o.invert; $('sShake').value = o.shake; $('sShakeV').textContent = Math.round(o.shake * 100) + '%'; renderBinds();
  $('sSensV').textContent = o.sens.toFixed(2); $('sVolV').textContent = Math.round(o.vol * 100) + '%'; $('sMusV').textContent = Math.round(o.mus * 100) + '%'; $('sFovV').textContent = o.fov; $('sBrightV').textContent = Math.round(o.bright * 100) + '%'; $('sScaleV').textContent = Math.round(o.scale * 100) + '%';
}
// Settings > Controls: click a key, press the new one (Esc cancels). Stored as settings.keys
const BIND_NAMES = { fwd: 'Forward', back: 'Back', left: 'Left', right: 'Right', jump: 'Jump', dash: 'Dash', swap: 'Swap element', alt: 'Right click (key)', q: 'Skill 1', e: 'Skill 2', r: 'Ultimate' };
let rebinding = null;
function renderBinds() {
  $('binds').innerHTML = Object.entries(BIND_NAMES).map(([k, n]) => `<div>${n}<button class="ghost${rebinding === k ? ' wait' : ''}" data-k="${k}">${rebinding === k ? 'press…' : keyName(BIND[k])}</button></div>`).join('');
  for (const b of $('binds').querySelectorAll('button')) b.onclick = () => { rebinding = b.dataset.k; renderBinds(); };
}
addEventListener('keydown', e => { // capture phase: the key goes to the binding, not the game (or Esc's menu toggle)
  if (!rebinding) return;
  e.preventDefault(); e.stopImmediatePropagation();
  if (e.code !== 'Escape') { for (const k in BIND) if (k !== rebinding && BIND[k] === e.code) settings.keys[k] = BIND[rebinding]; settings.keys[rebinding] = e.code; } // taking a used key swaps the two
  rebinding = null; saveSettings();
}, true);
$('bindReset').onclick = () => { settings.keys = {}; saveSettings(); };
let settings = { sens: 1, vol: 1, mus: 1, fov: 75, bright: 1, scale: 1, bloom: true, shadows: HQ, film: true, shake: 1, nums: true, invert: false, keys: {} };
try { settings = { ...settings, ...JSON.parse(localStorage.getItem('magepact_settings') || '{}') }; } catch {}
applySettings(settings);
const saveSettings = () => { applySettings(settings); try { localStorage.setItem('magepact_settings', JSON.stringify(settings)); } catch {} };
for (const [id, k] of [['sSens', 'sens'], ['sVol', 'vol'], ['sMus', 'mus'], ['sFov', 'fov'], ['sBright', 'bright'], ['sScale', 'scale'], ['sShake', 'shake']]) $(id).oninput = () => { settings[k] = +$(id).value; saveSettings(); };
for (const [id, k] of [['cBloom', 'bloom'], ['cShadows', 'shadows'], ['cFilm', 'film'], ['cNums', 'nums'], ['cInvert', 'invert']]) $(id).onchange = () => { settings[k] = $(id).checked; saveSettings(); };
for (const b of document.querySelectorAll('#settings .tabs button')) b.onclick = () => {
  for (const x of document.querySelectorAll('#settings .tabs button')) x.classList.toggle('on', x === b);
  for (const p of document.querySelectorAll('#settings .pane')) p.classList.toggle('hidden', p.dataset.pane !== b.dataset.tab);
};
// the menu pauses solo play; online the world keeps running for your partner (and the bots)
const paused = () => playing && role === 'host' && !conn?.open && !$('settings').classList.contains('hidden');
// the settings panel doubles as the mid-game element menu
const meP = () => role === 'guest' ? G : S.players[myId];
function renderSwap() {
  const p = meP();
  $('pauseTag').classList.toggle('hidden', !playing);
  $('pauseTag').innerHTML = paused() ? 'PAUSED' : 'MENU<small>Online: the game keeps running</small>';
  $('elSwap').classList.toggle('hidden', !playing || !p);
  if (!playing || !p) return;
  $('swapGrid').innerHTML = ELIST.filter(k => unlocked(k) || k === p.cur).map(k => `<button class="elc${k === p.cur ? ' sel' : ''}" data-el="${k}" title="${EL[k].name}" style="--c:${css(EL[k].color)}"><span class="g">${EL[k].glyph}</span></button>`).join('');
  for (const b of $('swapGrid').children) b.onclick = () => pickEl(b.dataset.el);
}
function pickEl(el) {
  const p = meP();
  if (!p || p.down || el === p.cur) return;
  setElement(p, el); tintRig(p.cur); sfx('swap');
  if (role === 'guest') { G.swapAt = performance.now(); conn?.send({ t: 'el', el }); } // host applies it too, the snapshot confirms
  banner(`${EL[el].glyph} ${EL[el].name.toUpperCase()}`, css(EL[el].color), 1500);
  renderSwap();
}
function menuChanged() { renderSwap(); $('setClose').textContent = playing ? 'Resume' : 'Close'; $('leaveBtn').classList.toggle('hidden', !playing); }
$('leaveBtn').onclick = () => location.reload(); // back to the mode select, like Main menu on the game-over screen (also leaves any online room)
const toggleSettings = () => { $('settings').classList.toggle('hidden'); menuChanged(); };
$('setBtn').onclick = toggleSettings;
$('setClose').onclick = () => { $('settings').classList.add('hidden'); menuChanged(); if (playing) lockMouse(); }; // Resume grabs the mouse back: no extra click
$('tset').onclick = toggleSettings;
addEventListener('keydown', e => { if (e.code === 'Escape' && playing) toggleSettings(); });

// ===================== networking (PeerJS / WebRTC, host-authoritative) =====================
// ponytail: STUN-only via PeerJS's free cloud broker; strict NATs (school/office wifi) may need a TURN server.
// ponytail: JSON snapshots over the reliable channel at 20Hz; switch to packed arrays + unreliable if bandwidth bites.
// ponytail: the guest owns its own position (no server reconciliation). Fine between friends, not for strangers.
let peer = null, conn = null, guestEl = null, guestEl2 = null, guestTal = {}, R = null, G = null, snapT = 0, sendT = 0, lastPhase = null, lastSeen = 0;
const OUT = [];
function dropGuest() {
  if (!conn && !guestEl) return;
  conn = null; guestEl = null; delete S.players.g; OUT.length = 0;
  banner('PARTNER DISCONNECTED', '#ff8aa0'); say('Your partner left. Share the code again to let them rejoin.');
}
const say = html => $('status').innerHTML = html;
// PeerJS error types in words a player can act on
const netErr = err => ({
  'peer-unavailable': 'No room with that code. Check the code, and make sure the host is still on the Room code screen.',
  'browser-incompatible': 'This browser can\'t do online play. Use Chrome, Edge, Firefox or an up-to-date Safari.',
  'network': 'Lost the connection to the room server. Check your internet and try again.',
  'server-error': 'The room server is having trouble. Wait a moment and try again.',
  'socket-error': 'Couldn\'t reach the room server (a firewall, VPN or ad blocker may be blocking it).',
  'socket-closed': 'The room server connection closed. Try again.',
  'unavailable-id': 'That room code is taken. Click Host game again for a new one.',
  'webrtc': 'The connection between your computers failed (a strict school or work network can block it). Try a different network, like a phone hotspot.',
}[err.type] || `Could not connect (${err.type}).`);
function needPeer() { if (window.Peer) return true; say('Online play needs PeerJS from the internet. You can still host and start solo.'); $('startBtn').classList.remove('hidden'); return false; }
$('hostBtn').onclick = () => {
  if (peer || !needPeer()) return;
  const code = Array.from({ length: 5 }, () => 'ABCDEFGHJKLMNPQRSTUVWXYZ'[Math.floor(Math.random() * 24)]).join('');
  say('Opening a room…');
  peer = new Peer('magepact-' + code);
  const stuck = setTimeout(() => { // a blocked or unreachable room server can hang without ever erroring
    say('Couldn\'t reach the room server (a firewall, VPN or ad blocker may be blocking it). Click Host game to retry, or Play Solo.');
    peer.destroy(); peer = null;
  }, 10000);
  peer.on('open', () => { clearTimeout(stuck); say(`Room code<div id="code-big">${code}</div>Send it to your partner, then press Start (or start solo).`); $('startBtn').classList.remove('hidden'); });
  peer.on('connection', c => {
    if (conn) return c.close();
    conn = c; lastSeen = performance.now();
    c.on('data', m => { lastSeen = performance.now(); onHostData(m); });
    c.on('close', dropGuest);
  });
  // WebRTC can take 30s+ to notice a closed tab, so the guest heartbeats and silence means gone
  setInterval(() => { if (conn && performance.now() - lastSeen > 6000) { conn.close(); dropGuest(); } }, 1000);
  peer.on('error', err => {
    clearTimeout(stuck);
    if (!peer?.open) { peer?.destroy(); peer = null; } // never opened: let Host game retry
    say(`${netErr(err)} Click Host game to retry, or Play Solo.`);
  });
};
$('joinBtn').onclick = () => {
  const code = $('code').value.trim().toUpperCase();
  if (code.length !== 5) return say('Enter the 5-letter room code from the host.');
  if (peer || !needPeer()) return;
  initAudio(); role = 'guest'; myId = 'g';
  say('Connecting…');
  peer = new Peer();
  peer.on('open', () => {
    conn = peer.connect('magepact-' + code);
    conn.on('open', () => { conn.send({ t: 'hello', el: myEl, el2: myEl2, tal: PROG.tal, v: GAME_VERSION }); say('Connected! Waiting for the host to press Start…'); setInterval(() => conn?.open && conn.send({ t: 'hb' }), 1000); });
    conn.on('data', onGuestData);
    conn.on('close', () => { playing = false; R = null; $('hud').classList.add('hidden'); $('lobby').classList.remove('hidden'); say('The host left the game.'); unlockMouse(); });
  });
  peer.on('error', err => { say(netErr(err)); peer.destroy(); peer = null; role = 'host'; myId = 'h'; });
};
function onHostData(m) {
  if (m.t === 'hello') {
    if (m.v !== GAME_VERSION) { conn.send({ t: 'bad', v: GAME_VERSION }); say(`A partner tried to join with a different game version (${m.v || 'old'} vs ${GAME_VERSION}). Both of you need the same files: refresh or re-download.`); setTimeout(() => conn?.close(), 500); return; }
    guestEl = EL[m.el] ? m.el : 'frost'; guestEl2 = EL[m.el2] && m.el2 !== guestEl ? m.el2 : null; guestTal = cleanTal(m.tal);
    say(`Partner joined as <b style="color:${css(EL[guestEl].color)}">${EL[guestEl].name}</b>. Press Start!`);
    if (S.phase !== 'lobby' && !S.players.g) { S.players.g = withTalents(newPlayer('g', guestEl, guestEl2), guestTal); banner('PARTNER JOINED', '#8affc0'); }
  }
  const g = S.players.g;
  if (!g) return;
  if (m.t === 'i') {
    bgTick();
    if (m.dashes !== g.dashes) g.dashAt = S.t;
    g.inp = m; g.yaw = m.yaw; g.pitch = m.pitch; g.dashT = m.dashT; g.dashes = m.dashes;
    if (!g.down) { g.x = m.x; g.y = m.y; g.z = m.z; }
  }
  if (m.t === 'el') setElement(g, m.el);
}
// browsers pause requestAnimationFrame in hidden tabs and covered windows: when the host's frames stall, the guest's 30 Hz input keeps the world running
let lastRaf = 0, lastBg = 0;
function bgTick() { const now = performance.now(); if (!playing || hold || paused() || now - lastRaf < 150) return; const dt = clamp((now - (lastBg || now)) / 1000, 0, .1); lastBg = now; if (dt > 0) update(dt); }
setInterval(bgTick, 33);
function sendSnap(dt) {
  if (!conn?.open || S.phase === 'lobby' || (snapT -= dt) > 0) return;
  snapT = .05;
  conn.send({ t: 's', s: snap(), ev: OUT.splice(0) });
}
function onGuestData(m) {
  if (m.t === 'bad') { say(`The host is running game version ${m.v} and you have ${GAME_VERSION}. Both of you need the same files: refresh or re-download.`); return; }
  if (m.t !== 's') return;
  R = m.s;
  if (R.dun) dunSync(R.dun); // before applyMap, so the guest's first dungeon frame already has its floor
  if (R.mode && R.mode !== S.mode) applyMap(R.mode);
  const mine = R.players.g;
  if (mine) {
    const restart = lastPhase === 'over' && R.phase !== 'over';
    if (!G || restart) G = Object.assign(newPlayer('g', mine.el, mine.el2), { x: mine.x, y: mine.y, z: mine.z, tpN: mine.tp?.n, tal: R.mode === 'duel' ? {} : PROG.tal }); // talents too, so predicted movement matches the host
    if (G.cur !== mine.cur && !(G.swapAt > performance.now() - 600)) G.cur = mine.cur;
    Object.assign(G, { kick: mine.kick, spawn: mine.spawn, tp: mine.tp, el: mine.el, el2: mine.el2, hp: mine.hp, max: mine.max, down: mine.down, rev: mine.rev, up: mine.up, ult: mine.ult, combo: mine.combo, stats: mine.stats });
    for (const k in mine.bf) G.bf[k] = mine.bf[k];
    if (mine.down) { G.x = mine.x; G.z = mine.z; }
    if (!playing || restart) { myEl = mine.el; showGame(); }
  }
  lastPhase = R.phase;
  for (const e of m.ev) onEvent(e);
}
function guestStep(dt) {
  if (!G || !R) return;
  const i = localInput(), live = R.phase !== 'over' && R.phase !== 'lobby';
  const frozen = R.mode === 'duel' && R.phase !== 'fight'; // duel countdowns hold both wizards still
  if (live) stepMove(G, frozen ? idleInput(i, G) : i, dt);
  if (i.swapN !== G.swapN && G.el2) G.swapAt = performance.now();
  // predict our own casts with the same rules as the host, so circles, hand kick and our own movement are instant
  // ponytail: the Overcharge mega count and cooldowns are local too and can drift from the host's if inputs drop
  if (live) stepCast(G, frozen ? idleInput(i, G) : i, dt, false); else { G.ch = null; G.chg = null; }
  if ((sendT -= dt) <= 0 && conn?.open) { sendT = 1 / 30; conn.send({ t: 'i', ...i, x: r2(G.x), y: r2(G.y), z: r2(G.z), dashT: G.dashT, dashes: G.dashes }); }
}

// ===================== self-check (open index.html#test) =====================
// cast one move against 3 grunts and a shielded knight, then simulate (capped so a runaway loop can't hang the tab)
function testMove(m, frames = 180, budget = 1500) {
  const t0 = performance.now(), out = { key: m.key };
  try {
    Object.assign(S, { phase: 'fight', t: 0, wave: 3, enemies: [], shots: [], ents: [], rings: [], timers: [], events: [], hitstop: 0, slowmo: 0, tstop: 0, budget: 0, bossLeft: 0 });
    const p = newPlayer('h', m.el); p.ult = 1; p.yaw = 0; p.pitch = -.12; p.z = 6; S.players = { h: p };
    for (let i = 0; i < 4; i++) { const e = spawnEnemy(i === 3 ? 'knight' : 'grunt', i * 1.5 - 2, -3 - i); e.rise = 0; e.y = 0; }
    const hp0 = S.enemies.reduce((s, e) => s + e.hp, 0);
    if (m.mode === 'channel') { p.ch = m.key; p.chT = 0; m.start?.(p, ctxOf(p, m)); for (let f = 0; f < 60; f++) { m.tick?.(p, ctxOf(p, m), 1 / 60); p.chT += 1 / 60; } m.end?.(p, ctxOf(p, m)); }
    else fire(p, m, 1, true);
    let f = 0;
    for (; f < frames && performance.now() - t0 < budget; f++) { stepTimers(1 / 60); stepShots(1 / 60); stepEnts(1 / 60); stepEnemies(1 / 60); stepPlayers(1 / 60); }
    if (f < frames) throw new Error(`too slow: ${f} frames in ${budget}ms (${S.shots.length} shots, ${S.ents.length} ents, ${S.timers.length} timers)`);
    JSON.stringify(snap());
    out.dmg = Math.round(hp0 - S.enemies.reduce((s, e) => s + e.hp, 0)); out.ms = Math.round(performance.now() - t0);
  } catch (err) { out.err = err.message; console.error(m.key, err); }
  Object.assign(S, { phase: 'lobby', players: {}, enemies: [], shots: [], ents: [], rings: [], timers: [], events: [], tstop: 0 });
  return out;
}
function selfTest() {
  const res = [], t = (name, ok) => res.push(`${ok ? 'PASS' : 'FAIL'} ${name}`);
  t(`${ELIST.length} elements with 5 moves each`, ELIST.length === 30 && ELIST.every(k => EL[k].moves.length === 5));
  t('every move has a name, icon, description and a valid mode', Object.values(MOVE).filter(m => m.el).every(m => m.name && m.icon && m.desc && ['tap', 'aim', 'charge', 'channel'].includes(m.mode)));
  t('every move does something', Object.values(MOVE).filter(m => m.el).every(m => m.cast || m.self || m.tick));
  t('aim moves have a range, charge moves a charge time, channels a max', Object.values(MOVE).filter(m => m.el).every(m => (m.mode !== 'aim' || m.range) && (m.mode !== 'charge' || m.charge) && (m.mode !== 'channel' || m.max)));
  t(`all ${ELIST.length * 5} move names are unique per element`, ELIST.every(k => new Set(EL[k].moves.map(m => m.name)).size === 5));
  t('every element has a cast sound for basic attacks and for its other moves', ELIST.every(k => SFX[k] && SFX[k + '_big']));
  t('every model a move asks for exists', Object.values(MOVE).filter(m => m.look).every(m => m.look.m === 'T.shard' || NODE[m.look.m]));
  t('burn + frost = STEAM', reactionOf('fire', 'frost').name === 'STEAM');
  t('frost + storm = SHATTER', reactionOf('frost', 'storm').name === 'SHATTER');
  t('storm + fire = OVERLOAD', reactionOf('storm', 'fire').name === 'OVERLOAD');
  t('every element pair reacts', ELIST.every(a => ELIST.every(b => a === b || reactionOf(a, b).name)));
  t('wave budget 10 + 6w', waveBudget(1) === 16 && waveBudget(10) === 70);
  // dungeon: monsters can path between any two places, the stairwells sit clear of every room and hall, the stairs are in the
  // farthest room, boss rooms come every 5th floor, and each floor's arrival stairwell lands exactly on the floor above's departure one
  let dunOk = true, dunWhy = '', O = { x: 0, z: 0, r: 0 };
  const hit = (a, b) => a.x0 < b.x1 && a.x1 > b.x0 && a.z0 < b.z1 && a.z1 > b.z0;
  const box = (P, u0, u1, v0, v1) => { const a = poseAt(P, u0, v0), b = poseAt(P, u1, v1); return { x0: Math.min(a.x, b.x), x1: Math.max(a.x, b.x), z0: Math.min(a.z, b.z), z1: Math.max(a.z, b.z) }; };
  for (let f = 1; f <= 15 && dunOk; f++) for (let k = 0; k < 8 && dunOk; k++) {
    const prev = DUN && k === 0 ? poseMul(DUN.O, DUN.dep) : null;
    if (prev) O = poseMul(prev, poseInv(ARRIVE));
    buildFloor(1000 * f + k, f, O);
    const N = DUN.rooms.length + DUN.halls.length, walls = r => ({ x0: r.x0 - 1, x1: r.x1 + 1, z0: r.z0 - 1, z1: r.z1 + 1 });
    const fail = w => { dunOk = false; dunWhy = `floor ${f} seed ${1000 * f + k}: ${w}`; };
    if (prev) { const a = DUN.arr; if (Math.abs(a.x - prev.x) > 1e-6 || Math.abs(a.z - prev.z) > 1e-6 || a.r !== prev.r) fail('arrival stairwell misses the one above'); }
    for (let s2 = 0; s2 < N; s2++) for (let t2 = 0; t2 < N; t2++) if (s2 !== t2 && DUN.next[s2][t2] == null) fail('unreachable node');
    if (!DUN.rooms[DUN.far].stairs || (f % 5 === 0) !== !!DUN.rooms[DUN.far].boss) fail('stairs / boss room');
    for (const [P, ex] of [[DUN.depW, 13], [DUN.arr, 21]]) for (const part of [box(P, 1.05, 17, -3, 13), box(P, 13, ex - .05, 7, 13)]) {
      DUN.rooms.forEach((r, i) => { if (hit(part, walls(r))) fail(`stairwell overlaps room ${i}`); });
      DUN.halls.forEach(h => { if (hit(part, h)) fail('stairwell overlaps a hall'); });
    }
    for (const a of DUN.rooms) for (const b of DUN.rooms) if (a !== b && hit(a, walls(b))) fail('rooms overlap');
  }
  DUN = null;
  t('dungeon floors connect, stairwells clear of rooms and line up floor to floor' + (dunWhy ? ` (${dunWhy})` : ''), dunOk);
  // duel: your own moves skip your stand-in; the opponent's stand-in passes the hit to their wizard
  Object.assign(S, { phase: 'fight', mode: 'duel', enemies: [], events: [] });
  S.players = { h: newPlayer('h', 'fire'), g: newPlayer('g', 'frost') }; S.players.g.z = -8;
  syncStandIns();
  const sh = S.enemies.find(e => e.pid === 'h'), sg = S.enemies.find(e => e.pid === 'g');
  S.actor = 'h'; const seesSelf = alive(sh), seesFoe = alive(sg); S.actor = null;
  const hp0 = S.players.g.hp; damage(sg, 10, 'fire', S.players.h);
  t('duel: your moves skip your own stand-in and hit the opponent', !seesSelf && seesFoe && S.players.g.hp === hp0 - 10 && !sg.dead);
  Object.assign(S, { phase: 'lobby', mode: 'arena', players: {}, enemies: [], events: [] });
  const sp = newPlayer('x', 'fire', 'frost'); setElement(sp, 'storm'); const a = sp.el === 'storm' && sp.el2 === 'frost' && sp.cur === 'storm';
  sp.cur = 'frost'; setElement(sp, 'water'); setElement(sp, 'storm');
  t('element menu replaces the active loadout, picking the other one swaps', a && sp.el2 === 'water' && sp.cur === 'storm');
  sp.cds.storm = [0, 0, 6, 0, 0]; setElement(sp, 'blood');
  t('switching element keeps your cooldowns', sp.cds.blood?.[2] === 6);
  // headless smoke test: every move cast on the host against a few enemies, simulated for 3 seconds
  const errs = [];
  for (const m of Object.values(MOVE)) if (m.el) { const r = testMove(m); if (r.err) errs.push(`${m.key} ${m.name}: ${r.err}`); }
  t(`all ${ELIST.length * 5} moves run without errors${errs.length ? ' (' + errs.join('; ') + ')' : ''}`, !errs.length);
  console.log(res.join('\n'));
  return res;
}
if (location.hash === '#test') {
  const res = selfTest();
  say(res.every(r => r.startsWith('PASS')) ? `Self-check passed (${res.length}/${res.length})` : `Self-check FAILED: ${res.filter(r => r.startsWith('FAIL')).join(', ')}`);
} else say('Ready. Pick an element, then play solo, host or join.');
renderLobby();
window.MP = { S, inp, keys, MOVE, EL, selfTest, testMove, testEl: k => EL[k].moves.map(m => testMove(m)) }; // console debug handle

// ===================== main loop =====================
let last = performance.now();
function update(dt) {
  if (playing && role === 'host' && S.phase !== 'over') hostStep(dt);
  if (playing && role === 'guest') guestStep(dt);
  if (role === 'host') { const evs = S.events.splice(0); for (const e of evs) { onEvent(e); if (conn?.open) OUT.push(e); } sendSnap(dt); }
}
window.MP.tick = (sec, dt = 1 / 60) => { for (let t = 0; t < sec; t += dt) { update(dt); stepFx(dt); stepParticles(dt); } };
window.MP.net = () => ({ role, myId, castFxN, open: !!conn?.open, guestEl, R: !!R, G: G && { x: G.x, z: G.z, hp: G.hp }, phase: (role === 'guest' ? R : S)?.phase, players: Object.keys((role === 'guest' ? R : S)?.players || {}) });
window.MP.gl = () => ({ ...renderer.info.render, programs: renderer.info.programs.length, geometries: renderer.info.memory.geometries });
// slow device (many Chromebooks): after 6 s of smooth-running play under 30 fps, drop to low graphics live (no reload).
// Measures real frame gaps, ignores hidden tabs / stalls, and never overrides a graphics setting the player picked.
let aqT = 0, aqN = 0, aqLast = 0;
function autoQuality() {
  const now = performance.now(), gap = now - aqLast; aqLast = now;
  let pref = null; try { pref = localStorage.getItem('magepact_gfx'); } catch {}
  if (!HQ || pref || !playing || hold || document.hidden || gap > 250) { aqT = aqN = 0; return; }
  aqT += gap / 1000; aqN++;
  if (aqT < 6) return;
  if (aqN / aqT < 30) { setLowQuality(); applySettings(settings); $('gfxBtn').textContent = 'Graphics: Low'; banner('LOW GRAPHICS ON FOR SMOOTHER PLAY', '#cfc8e8', 2200); }
  aqT = aqN = 0;
}
let hold = false; // test switch: freeze the sim between scripted frames so screenshots show exactly that state
function frame(now, manual = false) {
  const dt = (hold && !manual) || paused() ? 0 : clamp((now - last) / 1000, 0, .05); // never step time backwards
  last = Math.max(last, now); const t = last / 1000;
  uTime.value = t;
  pollPad(dt);
  if (!paused()) update(dt); // no casts sneak through while the menu is up
  if (AC && (AC.state === 'running') === paused()) paused() ? AC.suspend() : AC.resume(); // sound freezes with a solo pause
  if (!manual) autoQuality();
  const src = role === 'guest' ? R : (playing ? snap() : null), mp = me();
  music(!playing || !src ? 'menu' : src.phase === 'over' ? 'over' : src.enemies.some(e => ET[e.type].boss) ? 'boss' : src.mode);
  if (playing && mp) footsteps(mp, src?.mode, dt);
  animateArena(dt, t, src?.mod === 'darkness' && src?.phase === 'fight');
  updateDungeonView(dt, t);
  if (playing && mp && src) {
    renderWorld(src, dt, t);
    camera.position.set(mp.x, (mp.down ? .55 : 1.65) + mp.y, mp.z);
    camera.rotation.set(inp.pitch, inp.yaw, mp.down ? .35 : 0);
    trauma = Math.max(0, trauma - dt * 1.6);
    const sh = trauma * trauma;
    camera.position.x += (Math.random() - .5) * sh * .5; camera.position.y += (Math.random() - .5) * sh * .5; camera.rotation.z += (Math.random() - .5) * sh * .08;
    fovKick += (0 - fovKick) * Math.min(1, dt * 8); camera.fov = baseFov + fovKick * 10; camera.updateProjectionMatrix();
    vm.visible = !mp.down;
    vmKick = Math.max(0, vmKick - dt * 5);
    const k = vmKick * vmKick, chargeK = renderAim(mp, dt), chan = mp.ch ? 1 : 0;
    const moving = (keys.KeyW || keys.KeyA || keys.KeyS || keys.KeyD) && mp.gr;
    vmBob += dt * (moving ? 9 : 2);
    const amp = moving ? .012 : .004, tremble = (chargeK * .004 + chan * .003) * Math.sin(t * 60);
    vm.position.set(Math.cos(vmBob * .5) * amp + tremble, Math.sin(vmBob) * amp - (mp.vy || 0) * .003, 0);
    handL.position.set(hL0.x + k * .05 + chan * .04, hL0.y + k * .06 + chan * .05, hL0.z - k * .16 - chan * .12 + chargeK * .06); handL.rotation.x = hLr.x + k * .5 + chan * .4;
    handR.position.z = hR0.z + k * .03;
    if (rigMats.staff_gem) rigMats.staff_gem.emissiveIntensity = 3 + Math.sin(t * 4) + k * 6 + chargeK * 8 + chan * 4;
    if (rigMats.hand_rune) rigMats.hand_rune.emissiveIntensity = 4 + chargeK * 10 + chan * 6;
    hud(src, mp);
  } else {
    camera.position.set(Math.sin(t * .06) * 30, 10, Math.cos(t * .06) * 30); camera.lookAt(0, 1, 0); vm.visible = false;
  }
  timeFx = Math.max(0, timeFx - dt); whiteFx = Math.max(0, whiteFx - dt * 2.5); dodgeFx = Math.max(0, dodgeFx - dt);
  const tsOn = src?.ts ? 1 : 0;
  filmPass.uniforms.uGray.value += (Math.max(tsOn, dodgeFx > 0 ? .5 : 0) - filmPass.uniforms.uGray.value) * Math.min(1, dt * 6);
  filmPass.uniforms.uWhite.value = whiteFx * .8;
  // the sky's black hole flares while a Singularity is open, and burns brighter through boss waves
  const flare = src?.ents?.some(n => n.mv === 'gravity.4') ? 1 : src?.enemies?.some(e => e.type === 'boss') ? .45 : 0;
  skyU.uFlare.value += (flare - skyU.uFlare.value) * Math.min(1, dt * 3);
  stepParticles(dt); stepFx(dt); stepFlashes(dt); stepNums(dt); cityFrame(dt, t);
  composer.render();
}
// your own wizard's feet: a step every couple of metres on the ground, plus jump and landing sounds
let stepD = 0, wasGr = true, lastVy = 0, lastX = 0, lastZ = 0;
function footsteps(mp, mode, dt) {
  const d = Math.hypot(mp.x - lastX, mp.z - lastZ); lastX = mp.x; lastZ = mp.z;
  if (mp.gr && !mp.down && d < 2) { stepD += d; if (stepD > 2.3) { stepD = 0; sfx(mode === 'dungeon' ? 'stepD' : 'step'); } }
  if (!mp.gr && wasGr && mp.vy > 3) sfx('jump');
  if (mp.gr && !wasGr && lastVy < -7) { sfx('land'); stepD = 0; }
  wasGr = mp.gr; lastVy = mp.vy || 0;
}
// one bad frame (a broken effect) is logged and skipped instead of killing the loop for good
let frameErrs = 0;
renderer.setAnimationLoop(now => { lastRaf = performance.now(); lastBg = 0; try { frame(now); } catch (err) { if (frameErrs++ < 20) console.error(err); } });
// step the real frame loop by hand (the browser pauses requestAnimationFrame for hidden tabs)
window.MP.frames = (n, dt = 1 / 60) => { for (let i = 0; i < n; i++) frame(last + dt * 1000, true); };
window.MP.hold = on => { hold = on; };
// test driver: aim at the nearest enemy and hold the given inputs (p, s, KeyQ, KeyE, KeyR) for n frames
window.MP.aim = () => {
  const p = S.players.h; let b = null, bd = 1e9;
  for (const e of S.enemies) { const d = Math.hypot(e.x - p.x, e.z - p.z); if (d < bd && e.rise <= 0) { bd = d; b = e; } }
  if (b) { inp.yaw = Math.atan2(-(b.x - p.x), -(b.z - p.z)); inp.pitch = Math.atan2(b.y + 1 - 1.65 - p.y, bd); }
  return b;
};
// showcase: freeze the sim, give you element `el` with a lineup of enemies ahead, then MP.cast(slot) a move
window.MP.setup = (el, types = ['grunt', 'grunt', 'brute', 'grunt', 'runner', 'shooter']) => {
  hold = true;
  if (S.phase === 'lobby' || S.phase === 'over' || !S.players.h) $('soloBtn').click();
  Object.assign(S, { phase: 'fight', wave: 3, budget: 999, spawnT: 999, bossLeft: 0, enemies: [], shots: [], ents: [], timers: [], tstop: 0, restT: 99 });
  const p = S.players.h; Object.assign(p, { el, cur: el, max: 99999, hp: 99999, ult: 1, cds: {}, x: 0, y: 0, z: 9, ch: null, chg: null, mo: null, bf: {}, bd: {} });
  types.forEach((t, i) => { const e = spawnEnemy(t, (i - (types.length - 1) / 2) * 2.2, -1 - (i % 2) * 2); e.rise = 0; e.y = 0; e.acd = 99; });
  inp.yaw = 0; inp.pitch = -.08; MP.frames(2); $('banner').style.opacity = 0;
};
window.MP.cast = (slot, frames = 20, holdFrames = 1) => {
  const k = ['p', 's', BIND.q, BIND.e, BIND.r][slot], set = v => { if (k === 'p') inp.p = v; else if (k === 's') inp.s = v; else keys[k] = v; };
  for (let i = 0; i < holdFrames; i++) { set(true); MP.frames(1); }
  set(false); MP.frames(frames);
  return { shots: S.shots.length, ents: S.ents.map(n => n.mv), hp: S.enemies.map(e => Math.round(e.hp)) };
};
window.MP.play = (n, held = {}) => {
  for (let i = 0; i < n; i++) { MP.aim(); inp.p = !!held.p; inp.s = !!held.s; for (const k of ['KeyQ', 'KeyE', 'KeyR']) keys[BIND[k[3].toLowerCase()]] = !!held[k]; MP.frames(1); }
  inp.p = inp.s = false; for (const k of ['q', 'e', 'r']) keys[BIND[k]] = false;
};
