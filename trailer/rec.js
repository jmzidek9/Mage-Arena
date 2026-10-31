// Mage Arena trailer: plays scripted shots in headless Chromium and saves every frame as a JPEG.
// The game's own render loop is stopped; each video frame is one MP.frames() step, so the footage is smooth however slow the machine.
// Usage: node trailer/rec.js [out dir] [shot names...]   (needs `python pack.py` first; see trailer/make.sh)
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');

const OUT = path.resolve(process.argv[2] || 'trailer/frames');
const ONLY = process.argv.slice(3);
const W = 1280, H = 720, DT = 1 / 30;

// page-side helpers, installed once
const HELPERS = () => {
  const slotKey = ['p', 's', 'q', 'e', 'r'];
  window.TR = {
    press(slot, on) { const k = slotKey[slot]; if (k === 'p') inp.p = on; else if (k === 's') inp.s = on; else keys[BIND[k]] = on; },
    // tap a slot for `hold` frames starting at frame `at` (call every frame)
    tap(i, at, slot, hold = 1) { if (i === at) TR.press(slot, true); if (i === at + hold) TR.press(slot, false); },
    look(x, y, z, k = .25) { // ease the camera toward a point
      const p = S.players.h, d = Math.hypot(x - p.x, z - p.z);
      let yaw = Math.atan2(-(x - p.x), -(z - p.z)), dy = yaw - inp.yaw;
      dy = Math.atan2(Math.sin(dy), Math.cos(dy));
      inp.yaw += dy * k; inp.pitch += (Math.atan2(y - 1.65 - p.y, d) - inp.pitch) * k;
    },
    foe() { const p = S.players.h; let b = null, bd = 1e9; for (const e of S.enemies) { if (e.pid || e.dead || e.rise > 0) continue; const d = Math.hypot(e.x - p.x, e.z - p.z); if (d < bd) { bd = d; b = e; } } return b; },
    aim(k = .25, up = 1) { const e = TR.foe(); if (e) TR.look(e.x, e.y + up, e.z, k); return e; },
    tough(keep = 7) { // the player can't die, and monsters stop a few metres short so the camera never ends up inside them
      const p = S.players.h; p.max = p.hp = 99999;
      for (const e of S.enemies) { if (e.pid) continue; const dx = e.x - p.x, dz = e.z - p.z, d = Math.hypot(dx, dz) || 1, r = keep + ET[e.type].r * (e.sc || 1); if (d < r) { e.x = p.x + dx / d * r; e.z = p.z + dz / d * r; } }
    },
    ult() { S.players.h.ult = 1; },
    ahead(types, d0 = 8, gap = 2.2, depth = 0) { // a line of monsters in front of the player
      const p = S.players.h, fx = -Math.sin(inp.yaw), fz = -Math.cos(inp.yaw);
      return types.map((t, i) => { const s = (i - (types.length - 1) / 2) * gap, d = d0 + (i % 2) * depth;
        const e = spawnEnemy(t, p.x + fx * d - fz * s, p.z + fz * d + fx * s); e.rise = 0; e.y = 0; return e; });
    },
    mode(m, el, warm = 30) { // start a solo game in mode m with element el, frozen between scripted frames
      MP.hold(true); myMode = m; myEl = el; myEl2 = null; startSolo(); MP.frames(warm, DT_); // warm-up: the last shot's debris clears and the player reaches the start
    },
    reset() { inp.p = inp.s = false; for (const k in keys) keys[k] = false; },
    grab() { return renderer.domElement.toDataURL('image/jpeg', .92); },
  };
};

// each shot: setup() runs once, step(i) every frame before the sim steps
const SHOTS = [
  { name: 'fire', n: 120, setup: () => { MP.setup('fire', ['grunt', 'grunt', 'brute', 'grunt', 'runner', 'shooter', 'grunt']); inp.pitch = -.05; },
    step: i => { TR.tough(); TR.aim(.2, .9); if (i < 60 && i % 7 === 2) TR.tap(i, i, 0); else TR.press(0, false); if (i === 64) TR.ult(); TR.tap(i, 66, 4, 2); } },
  { name: 'frost', n: 100, setup: () => { MP.setup('frost', ['grunt', 'runner', 'grunt', 'brute', 'grunt', 'runner']); },
    step: i => { TR.tough(); TR.aim(.25, .8); TR.press(0, i < 26 && i % 3 === 0); TR.tap(i, 30, 3); if (i === 48) TR.ult(); TR.tap(i, 50, 4, 8); } },
  { name: 'storm', n: 105, setup: () => { MP.setup('storm', ['grunt', 'shooter', 'brute', 'grunt', 'runner', 'grunt', 'shooter']); },
    step: i => { TR.tough(); TR.aim(.25, .8); TR.press(0, i % 4 === 0 && (i < 30 || i > 55)); if (i === 34) TR.ult(); TR.tap(i, 36, 4, 2); } },
  { name: 'water', n: 95, setup: () => { MP.setup('water', ['grunt', 'grunt', 'brute', 'runner', 'grunt', 'runner', 'grunt']); },
    step: i => { TR.tough(); TR.aim(.2, .6); TR.press(0, i < 18 && i % 2 === 0); if (i === 20) TR.ult(); TR.tap(i, 22, 4, 2); } },
  { name: 'earth', n: 90, setup: () => { MP.setup('earth', ['grunt', 'brute', 'grunt', 'runner', 'brute']); },
    step: i => { TR.tough(); TR.aim(.2, .7); TR.tap(i, 3, 1); TR.tap(i, 30, 3); if (i === 50) TR.ult(); TR.tap(i, 52, 4, 2); } },
  // quick montage of ultimates
  ...[['gravity', 'Singularity'], ['cosmic', 'Supernova'], ['light', 'Divine Judgment'], ['blades', 'Colossal Blade'], ['plasma', 'Fusion Beam'], ['ink', 'Ink Dragon']].map(([el]) => ({
    name: 'ult_' + el, n: 54, setup: new Function(`MP.setup('${el}', ['grunt', 'brute', 'grunt', 'runner', 'grunt', 'shooter']);`),
    step: new Function('i', `TR.tough(); TR.aim(.3, .5); if (i === 2) TR.ult(); TR.tap(i, 3, 4, 9);`) })),
  { name: 'boss', n: 120, setup: () => { MP.setup('magma', ['boss']); const b = S.enemies[0]; b.acd = 1.2; },
    step: i => { TR.tough(10); TR.aim(.15, 3.2); TR.press(0, i % 8 === 0); TR.tap(i, 40, 2); if (i === 70) TR.ult(); TR.tap(i, 72, 4, 10); } },
  { name: 'duel', n: 150, setup: () => { TR.mode('duel', 'plasma'); S.players.g.el = S.players.g.cur = 'storm'; S.restT = .01; MP.frames(3, DT_); },
    step: i => { const p = S.players.h, g = S.players.g; p.hp = p.max; TR.look(g.x, g.y + 1.2, g.z, .3);
      keys.KeyW = i < 45; keys.KeyA = i > 60 && (i % 50) < 25; keys.KeyD = i > 60 && !keys.KeyA; TR.press(0, i % 5 === 0); TR.tap(i, 30, 2); TR.tap(i, 70, 3); TR.tap(i, 100, 1); if (i === 112) TR.ult(); TR.tap(i, 114, 4, 2); } },
  // the dungeon's torch-lit monster shaders take ~8 GB to compile in software GL: on a 16 GB machine this shot can crash its tab
  { name: 'dungeon', n: 150, setup: () => { TR.mode('dungeon', 'fire', 2); TR.ahead(['skeleton', 'ghoul', 'skeleton', 'dknight', 'skeleton'], 9, 1.4, 2.5); },
    step: i => { TR.tough(5); keys.KeyW = i > 10 && i < 50; TR.aim(.2, .9); TR.press(0, i > 20 && i % 7 === 0); TR.tap(i, 60, 2, 25); TR.tap(i, 100, 3); } },
  { name: 'city', n: 140, setup: () => { TR.mode('city', 'explosion'); TR.ahead(['grunt', 'brute', 'grunt', 'grunt', 'runner'], 11, 2.5, 3); },
    step: i => { TR.tough(6); TR.aim(.2, .6); TR.press(0, i % 9 === 0 && i < 70); TR.tap(i, 20, 1); if (i === 80) TR.ult(); TR.tap(i, 82, 4, 2); } },
];

// a fresh browser: after an hour or so of software rendering one tab tends to crash, so rec() starts a new one every ~500 frames
async function open() {
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--disable-gpu-watchdog', '--disable-renderer-backgrounding'] });
  const p = await b.newPage({ viewport: { width: W, height: H } });
  p.on('pageerror', e => console.log('page error:', e.message));
  await p.addInitScript(() => {
    localStorage.setItem('magepact_gfx', 'high'); // keep high graphics: auto quality would drop them on a slow headless GPU
    window.requestAnimationFrame = () => 0; // no free-running loop: frames are stepped by hand
  });
  await p.goto('file://' + path.resolve(__dirname, '../index.html'), { waitUntil: 'commit' });
  await p.waitForFunction(() => window.MP && window.MP.setup, null, { timeout: 180000, polling: 500 });
  await p.evaluate(`window.DT_ = ${DT}; (${HELPERS})()`);
  return { b, p };
}

(async () => {
  let br = null, done = 0;
  for (const s of SHOTS) {
    if (ONLY.length && !ONLY.some(o => s.name.startsWith(o))) continue;
    if (!br || done > 500) { await br?.b.close(); br = await open(); done = 0; }
    const { p } = br, dir = path.join(OUT, s.name); fs.mkdirSync(dir, { recursive: true });
    const t0 = Date.now();
    await p.evaluate(`TR.reset(); (${s.setup})()`);
    console.log(`  ${s.name} set up in ${((Date.now() - t0) / 1000).toFixed(0)} s`);
    for (let i = 0; i < s.n; i++) {
      const url = await p.evaluate(`(${s.step})(${i}); MP.frames(1, DT_); TR.grab()`);
      fs.writeFileSync(path.join(dir, String(i).padStart(4, '0') + '.jpg'), Buffer.from(url.split(',')[1], 'base64'));
      if (i % 30 === 0) console.log(`  ${s.name} ${i}/${s.n} ${((Date.now() - t0) / 1000).toFixed(0)} s`);
    }
    done += s.n;
    console.log(`${s.name}: ${s.n} frames in ${((Date.now() - t0) / 1000).toFixed(0)} s`);
  }
  await br?.b.close();
})();
