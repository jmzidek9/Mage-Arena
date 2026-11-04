// Mage Arena playtest harness: plays one element in headless Chromium and saves screenshots + metrics.
// Usage: node playtest/run.js <element> [moves|kit|boss|all] [--out dir]     (run `python pack.py` first)
//        node playtest/run.js --median          (median damage across every playtest/out/*/metrics.json)
// moves: each move cast alone into the showcase pack (rendered: screenshots, frame cost, draw calls, particles)
// kit / boss: 30 s of the whole kit against a respawning wave-5 crowd / the Tyrant (simulated without rendering, fast)
const { browser } = require('./browser');
const fs = require('fs'), path = require('path');

const args = process.argv.slice(2), flag = k => { const i = args.indexOf(k); return i < 0 ? null : args.splice(i, 2)[1]; };
const outArg = flag('--out');
const OUT_ROOT = path.resolve(__dirname, 'out');

if (args[0] === '--median') {
  const rows = fs.readdirSync(OUT_ROOT).filter(d => fs.existsSync(path.join(OUT_ROOT, d, 'metrics.json')))
    .map(d => ({ el: d, ...JSON.parse(fs.readFileSync(path.join(OUT_ROOT, d, 'metrics.json'), 'utf8')) }));
  const med = a => { const s = a.filter(x => x != null).sort((x, y) => x - y); return s.length ? s[Math.floor(s.length / 2)] : null; };
  const pick = (r, k) => r[k]?.dps;
  const m = { crowdDps: med(rows.map(r => pick(r, 'kit'))), bossDps: med(rows.map(r => pick(r, 'boss'))), ultDmg: med(rows.map(r => r.moves?.[4]?.dmg)) };
  const table = rows.map(r => ({ el: r.el, crowdDps: pick(r, 'kit'), bossDps: pick(r, 'boss'), ultDmg: r.moves?.[4]?.dmg,
    crowdX: r.kit?.dps && m.crowdDps ? +(r.kit.dps / m.crowdDps).toFixed(2) : null, bossX: r.boss?.dps && m.bossDps ? +(r.boss.dps / m.bossDps).toFixed(2) : null }));
  fs.writeFileSync(path.join(OUT_ROOT, 'median.json'), JSON.stringify({ median: m, elements: table }, null, 1));
  console.log(m); process.exit(0);
}

const EL = args[0], WHAT = args[1] || 'all';
if (!EL) { console.log('usage: node playtest/run.js <element> [moves|kit|boss|all] [--out dir]'); process.exit(1); }
const OUT = path.resolve(outArg || path.join(OUT_ROOT, EL));
fs.mkdirSync(OUT, { recursive: true });

// page-side helpers (uses the game's own MP test hooks, js/net.js)
const HELPERS = () => {
  const slotKey = ['p', 's', 'q', 'e', 'r'];
  const press = (slot, on) => { const k = slotKey[slot]; if (k === 'p') inp.p = on; else if (k === 's') inp.s = on; else keys[BIND[k]] = on; };
  const release = () => { inp.p = inp.s = false; for (const k of ['q', 'e', 'r']) keys[BIND[k]] = false; };
  const holdOf = m => m.mode === 'charge' ? Math.ceil((m.charge || 1) * 60) + 2 : m.mode === 'channel' ? Math.ceil(Math.min(m.max || 3, 3) * 60) : m.mode === 'aim' ? 12 : 1;
  const alive = () => { let n = 0; for (let i = 0; i < PN; i++) if (pLife[i] > 0) n++; return n; };
  const pool = () => { const h = {}; for (const e of S.enemies) h[e.id] = e.hp; return h; };
  const lost = (h0) => { let d = 0; const now = pool(); for (const id in h0) d += Math.max(0, h0[id] - (now[id] ?? 0)); return d; };
  const CROWD = ['grunt', 'grunt', 'runner', 'brute', 'shooter', 'grunt', 'knight', 'stalker'];
  window.PTX = {
    grab() { return renderer.domElement.toDataURL('image/jpeg', .85); },
    kit() { return EL[PTX.el].moves.map((m, i) => ({ slot: i, name: m.name, key: m.key, mode: m.mode || 'tap', cd: m.cd ?? null, hold: holdOf(m) })); },
    // one move alone into the showcase pack, rendered frame by frame
    move(slot, frames, shots) {
      MP.setup(PTX.el); const p = S.players.h, m = EL[PTX.el].moves[slot], hold = holdOf(m); MP.aim();
      const h0 = pool(), n0 = S.enemies.length, stat = { frameMs: [], calls: 0, tris: 0, particles: 0, fx: 0, shots: 0, ents: 0 }, pics = {};
      for (let f = 0; f < frames; f++) {
        if (f < hold) press(slot, true); else release();
        if (f < hold && m.mode === 'aim') MP.aim();
        const t0 = performance.now(); MP.frames(1); stat.frameMs.push(performance.now() - t0);
        const g = MP.gl(); stat.calls = Math.max(stat.calls, g.calls); stat.tris = Math.max(stat.tris, g.triangles);
        stat.particles = Math.max(stat.particles, alive()); stat.fx = Math.max(stat.fx, fx.length);
        stat.shots = Math.max(stat.shots, S.shots.length); stat.ents = Math.max(stat.ents, S.ents.length);
        if (shots.includes(f)) pics[f] = PTX.grab();
      }
      release();
      const ms = stat.frameMs.slice(2), avg = ms.reduce((a, b) => a + b, 0) / ms.length;
      return { slot, name: m.name, key: m.key, mode: m.mode || 'tap', dmg: Math.round(lost(h0)), kills: n0 - S.enemies.filter(e => !e.dead).length,
        frameMsAvg: +avg.toFixed(1), frameMsWorst: +Math.max(...ms).toFixed(1), drawCallsPeak: stat.calls, trianglesPeak: stat.tris,
        particlesPeak: stat.particles, fxObjectsPeak: stat.fx, shotsPeak: stat.shots, entsPeak: stat.ents, pics };
    },
    // the whole kit for `sec` seconds (simulated, no rendering): casts whatever is ready, ultimate first
    fight(boss, sec, picEvery) {
      MP.setup(PTX.el, boss ? ['boss'] : CROWD); const p = S.players.h, kit = EL[PTX.el].moves;
      p.max = p.hp = 1000; S.wave = 5; for (const e of S.enemies) e.acd = 1.5;
      const H = { cur: -1, left: 0 }, used = [0, 0, 0, 0, 0], ready = [0, 0, 0, 0, 0], dmgBy = [0, 0, 0, 0, 0], pics = {};
      let kills = 0, k0 = p.stats.kills, hpLost = 0, healed = 0, simMs = 0, d0 = p.stats.dmg, hp = p.hp, F = Math.round(sec * 60), minHp = p.hp;
      for (let f = 0; f < F; f++) {
        if (!boss) { // keep 8 alive, wave-5 strength
          const live = S.enemies.filter(e => !e.dead && !e.pid);
          if (live.length < 8) { const t = CROWD[f % CROWD.length], a = Math.random() * 6.283, e = spawnEnemy(t, p.x + Math.cos(a) * 14, p.z + Math.sin(a) * 14); e.rise = 0; e.y = 0; }
        } else if (!S.enemies.some(e => !e.dead)) { const e = spawnEnemy('boss', 0, -6); e.rise = 0; e.y = 0; }
        MP.aim();
        const cds = p.cds[PTX.el] || [0, 0, 0, 0, 0];
        for (let s = 0; s < 5; s++) if (cds[s] <= 0) ready[s]++;
        if (H.left > 0) { press(H.cur, true); H.left--; }
        else { release(); if (H.cur >= 0) { H.cur = -1; } else {
          const order = [4, 3, 2, 1, 0];
          for (const s of order) { if (s === 4 && p.ult < 1) continue; if (cds[s] > 0) continue; H.cur = s; H.left = holdOf(kit[s]); used[s]++; break; }
        } }
        const before = p.stats.dmg, n0 = S.enemies.filter(e => e.dead).length;
        const t0 = performance.now(); MP.tick(1 / 60); simMs += performance.now() - t0;
        if (H.cur >= 0) dmgBy[H.cur] += p.stats.dmg - before; // damage landing while a move is held / just cast (rough attribution)
        if (p.hp < hp) hpLost += hp - p.hp; else healed += p.hp - hp; hp = p.hp; minHp = Math.min(minHp, p.hp);
        if (p.down) { p.down = false; p.hp = hp = p.max; } // keep going: dying is counted through minHp / hpLost
        if (picEvery && f % picEvery === picEvery - 1) { MP.frames(1); pics[f] = PTX.grab(); }
      }
      release();
      const dmg = p.stats.dmg - d0; kills = p.stats.kills - k0;
      return { sec, dmg: Math.round(dmg), dps: +(dmg / sec).toFixed(1), kills, hpLost: Math.round(hpLost), healed: Math.round(healed), lowestHp: Math.round(minHp),
        casts: Object.fromEntries(kit.map((m, i) => [m.name, used[i]])), cooldownReadyPct: Object.fromEntries(kit.map((m, i) => [m.name, Math.round(ready[i] / F * 100)])),
        simMsPerFrame: +(simMs / F).toFixed(2), pics };
    },
  };
};

async function open() {
  const b = await browser();
  const p = await b.newPage({ viewport: { width: 960, height: 540 } });
  p.on('pageerror', e => console.log('page error:', e.message));
  p.on('console', m => { if (m.type() === 'error') console.log('console error:', m.text().slice(0, 300)); });
  await p.addInitScript(() => { localStorage.setItem('magepact_gfx', 'high'); window.requestAnimationFrame = () => 0; });
  await p.goto('file://' + path.resolve(__dirname, '../index.html'), { waitUntil: 'commit' });
  await p.waitForFunction(() => window.MP && window.MP.setup, null, { timeout: 240000, polling: 500 });
  await p.evaluate(`(${HELPERS})(); PTX.el = ${JSON.stringify(EL)}; myEl = PTX.el;`);
  return { b, p };
}
const save = (pics, name) => Object.entries(pics).map(([f, url]) => { const file = `${name}_${String(f).padStart(3, '0')}.jpg`; fs.writeFileSync(path.join(OUT, file), Buffer.from(url.split(',')[1], 'base64')); return file; });

(async () => {
  const t0 = Date.now(), { b, p } = await open(), mfile = path.join(OUT, 'metrics.json');
  const res = fs.existsSync(mfile) && WHAT !== 'all' ? JSON.parse(fs.readFileSync(mfile, 'utf8')) : {};
  if (!(await p.evaluate('!!EL[PTX.el]'))) { console.log('no such element: ' + EL); await b.close(); process.exit(1); }
  res.element = EL; res.kitInfo = await p.evaluate('PTX.kit()'); res.at = new Date().toISOString();
  if (WHAT === 'all' || WHAT === 'moves') {
    res.moves = [];
    for (let s = 0; s < 5; s++) {
      const r = await p.evaluate(`PTX.move(${s}, 75, [3, 10, 22, 45, 74])`);
      r.screenshots = save(r.pics, `m${s}_${r.name.replace(/\W+/g, '')}`); delete r.pics; res.moves.push(r);
      console.log(`  ${r.name}: ${r.dmg} dmg, ${r.frameMsAvg} ms/frame avg, ${r.particlesPeak} particles`);
    }
  }
  for (const [k, boss] of [['kit', false], ['boss', true]]) {
    if (WHAT !== 'all' && WHAT !== k) continue;
    const r = await p.evaluate(`PTX.fight(${boss}, 30, 600)`);
    r.screenshots = save(r.pics, k); delete r.pics; res[k] = r;
    console.log(`  ${k}: ${r.dps} dps, ${r.kills} kills, ${r.hpLost} hp lost, ${r.healed} healed`);
  }
  fs.writeFileSync(mfile, JSON.stringify(res, null, 1));
  await b.close();
  console.log(`${EL}: done in ${Math.round((Date.now() - t0) / 1000)} s -> ${path.relative(process.cwd(), OUT)}`);
})().catch(e => { console.error(e); process.exit(1); });
