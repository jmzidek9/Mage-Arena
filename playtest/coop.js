// Two real clients over the real room server (needs internet): node playtest/coop.js [outDir]
// Host + join, lobby sync, playing together, a full room, a guest rejoining mid-run beside the host, partner markers, game over, the host leaving.
const path = require('path'), fs = require('fs');
const { browser } = require('./browser');
const out = process.argv[2] || path.join(__dirname, 'out', 'coop'); fs.mkdirSync(out, { recursive: true });
const url = 'file:///' + path.resolve(__dirname, '..', 'index.html').replace(/\\/g, '/');
const sleep = ms => new Promise(r => setTimeout(r, ms));
let fails = 0;
const check = (name, ok, info = '') => { console.log(`${ok ? 'PASS' : 'FAIL'} ${name}${info ? ' · ' + info : ''}`); if (!ok) fails++; };
const until = async (page, fn, arg, ms = 25000) => { try { await page.waitForFunction(fn, arg, { timeout: ms, polling: 200 }); return true; } catch { return false; } };

(async () => {
  const b = await browser(), errs = [];
  const open = async (name, mode = 1) => {
    const p = await (await b.newContext({ viewport: { width: 1280, height: 720 } })).newPage();
    p.on('pageerror', e => errs.push(`${name}: ${e.message}`));
    p.on('console', m => { if (m.type() === 'error' && !/favicon|ERR_FILE/.test(m.text())) errs.push(`${name}: ${m.text()}`); });
    await p.goto(url); await p.waitForFunction(() => window.MP, null, { timeout: 90000 });
    await p.keyboard.press(String(mode));
    return p;
  };
  const net = p => p.evaluate(() => MP.net());
  const text = (p, id) => p.evaluate(i => document.getElementById(i).innerText, id);
  const join = async (p, code) => { await p.fill('#code', code.toLowerCase()); await p.press('#code', 'Enter'); };
  try {
    const h = await open('host'), g = await open('guest');
    await h.click('#hostBtn');
    check('host opens a room', await until(h, () => MP.net().roomCode));
    const code = (await net(h)).roomCode;
    check('hosting hides Join and shows Leave room', await h.evaluate(() => document.getElementById('joinBtn').classList.contains('hidden') && !document.getElementById('netLeave').classList.contains('hidden')));

    // a code nobody hosts: told so, and able to try again
    await join(g, 'ZZZZZ');
    check('a wrong code gives a clear error and resets', await until(g, () => /No room with that code/.test(document.getElementById('status').innerText) && !document.getElementById('joinBtn').classList.contains('hidden')));

    await join(g, code);
    check('guest connects (lowercase code, Enter key)', await until(g, () => /Connected! Mode/.test(document.getElementById('status').innerText)), await text(g, 'status'));
    check('host sees the partner and a glowing Start', await until(h, () => /Partner joined/.test(document.getElementById('status').innerText) && document.getElementById('startBtn').classList.contains('go')));
    check('guest has no Solo or back button', await g.evaluate(() => ['soloBtn', 'modeBack', 'hostBtn'].every(i => document.getElementById(i).classList.contains('hidden'))));
    // lobby sync: the guest changes element, the host sees it
    const picked = await g.evaluate(() => { const b = [...document.querySelectorAll('#grid .elc:not(.lock)')].find(x => !x.classList.contains('sel')); b.click(); return b.querySelector('.n').textContent; });
    check('host sees the guest\'s new element', await until(h, n => document.getElementById('status').innerText.includes(n), picked), picked);

    await h.click('#startBtn');
    check('both are in the game', await until(g, () => MP.net().playing && MP.net().players.length === 2));
    await h.evaluate(() => { MP.S.cheat = { inv: 1 }; Object.assign(MP.S, { phase: 'fight', budget: 99, spawnT: 999, bossLeft: 0 }); }); // an idle host mustn't die, and no wave end may revive anyone, until the game-over step
    await sleep(2500);
    const ng = await net(g), nh = await net(h);
    check('ping measured on both sides', ng.ping > 0 && nh.ping > 0, `guest ${ng.ping} ms, host ${nh.ping} ms`);
    check('marker shown on both', await h.evaluate(() => !document.getElementById('mateMark').classList.contains('hidden')) && await g.evaluate(() => !document.getElementById('mateMark').classList.contains('hidden')));
    // the partner's body animates over the network: the host runs, and the guest sees its legs stride and its wizard lean
    await h.evaluate(() => { MP.keys[BIND.fwd] = true; });
    await g.bringToFront();
    const legs = []; for (let i = 0; i < 8; i++) { legs.push(await g.evaluate(() => { MP.frames(2); return views.p.get('h').parts.legL.o.rotation.x; })); await sleep(90); }
    await h.evaluate(() => { MP.keys[BIND.fwd] = false; });
    check('guest sees the host legs stride', Math.max(...legs) - Math.min(...legs) > .25, `swing ${(Math.max(...legs) - Math.min(...legs)).toFixed(2)} rad`);
    await g.screenshot({ path: path.join(out, '1-guest-running.png') });
    await h.screenshot({ path: path.join(out, '1-host.png') }); await g.screenshot({ path: path.join(out, '1-guest.png') });

    // a third player can't take the seat
    const t = await open('third');
    await join(t, code);
    check('a third player is told the room is full', await until(t, () => /already has two players/.test(document.getElementById('status').innerText)), await text(t, 'status'));
    await t.close();

    // the guest fires a shot and leaves: nothing breaks; the game moves on to island 3
    await g.evaluate(() => { MP.inp.p = true; }); await sleep(800);
    await h.evaluate(() => { MP.S.isl = 2; MP.S.ib = 7; MP.S.players.h.x += 0; });
    const size = await h.evaluate(() => JSON.stringify(MP.snap ? MP.snap() : {}).length);
    await g.close(); const t1 = Date.now();
    check('host sees the partner leave, with the code on screen', await until(h, c => !MP.net().players.includes('g') && document.getElementById('banner').textContent.includes(c), code, 14000), `${await text(h, 'banner')} · ${Date.now() - t1} ms`);
    await sleep(500);

    // rejoin mid-run: lands next to the host
    const g2 = await open('guest2');
    await join(g2, code);
    const back = await until(g2, () => MP.net().playing && MP.net().players.length === 2);
    check('the guest rejoins the running game', back, back ? '' : `guest: ${await text(g2, 'status')} ${JSON.stringify(await net(g2))} · host: ${await text(h, 'status')} ${JSON.stringify(await net(h))} over=${await h.evaluate(() => !document.getElementById('over').classList.contains('hidden'))}`);
    await sleep(1000);
    const gap = await h.evaluate(() => { const a = MP.S.players.h, b = MP.S.players.g; return Math.hypot(a.x - b.x, a.z - b.z); });
    check('rejoiner lands beside the host', gap < 6, gap.toFixed(1) + ' m');

    // downed partner: the marker calls for a revive
    await h.evaluate(() => { const g = MP.S.players.g; g.hp = 0; g.down = true; g.rev = 0; const a = MP.S.players.h; g.x = a.x + 15; g.z = a.z; });
    check('host marker calls for a revive', await until(h, () => { MP.frames(1); return /REVIVE/.test(document.getElementById('mateMark').innerText); }), await text(h, 'mateMark')); // MP.frames: tabs in the background draw no frames
    check('guest is told their partner can revive them', await until(g2, () => { MP.frames(1); return /revive/i.test(document.getElementById('downMsg').innerText); }), await text(g2, 'downMsg'));
    await h.screenshot({ path: path.join(out, '2-revive.png') });

    // both down: game over with both players' numbers, then play again brings the guest back
    await h.evaluate(() => { MP.S.cheat = {}; const a = MP.S.players.h; a.hp = 0; a.down = true; MP.S.phase = 'fight'; });
    check('guest gets the game-over screen', await until(g2, () => !document.getElementById('over').classList.contains('hidden')));
    check('end screen shows both players', await g2.evaluate(() => document.querySelectorAll('#over .stats').length === 2 && /You two/.test(document.getElementById('overTxt').innerText)));
    await g2.screenshot({ path: path.join(out, '3-over.png') });
    await until(h, () => !document.getElementById('over').classList.contains('hidden'));
    await h.click('#againBtn');
    check('Play again restarts the guest', await until(g2, () => document.getElementById('over').classList.contains('hidden') && MP.net().phase !== 'over'));

    // the host leaves: instant word, what you earned is kept
    await sleep(1000);
    await h.evaluate(() => document.getElementById('leaveBtn').click());
    const t0 = Date.now(), left = await until(g2, () => document.getElementById('overTitle').textContent === 'HOST LEFT', null, 14000);
    check('guest sees HOST LEFT', left, `${Date.now() - t0} ms`);
    check('...right away (the bye message arrived)', Date.now() - t0 < 3000);
    await g2.screenshot({ path: path.join(out, '4-host-left.png') });
    console.log(`snapshot size: ${size} bytes`);

    // Mage City: joining late, you see the damage already done
    const hc = await open('city host'), gc = await open('city guest');
    await hc.evaluate(() => { pickMode('city'); }); await hc.click('#hostBtn');
    await until(hc, () => MP.net().roomCode);
    await hc.click('#startBtn');
    await hc.evaluate(() => { MP.S.cheat = { inv: 1 }; const p = MP.S.players.h, a = CITY.lay.blocks; for (let i = 0; i < 40; i++) { const n = i * 5 * 37 % a.length - (i * 5 * 37 % a.length) % 5, x = cX(a[n]), z = cX(a[n + 1]); cityHit(x, (a[n + 2] + .5) * CB, z, 3, 500); } });
    const gone = await hc.evaluate(() => [...CITY.blk.values()].filter(b => b.gone).length);
    await join(gc, (await net(hc)).roomCode);
    const synced = await until(gc, n => MP.net().playing && [...CITY.blk.values()].filter(b => b.gone).length >= n, gone);
    check('a late joiner sees the city damage already done', synced && gone > 0, `${gone} blocks gone on the host, ${await gc.evaluate(() => [...CITY.blk.values()].filter(b => b.gone).length)} on the guest`);
    check('no page errors', !errs.length, errs.slice(0, 5).join(' | '));
  } catch (e) { fails++; console.log('FAIL crashed:', e.message); }
  await b.close();
  console.log(fails ? `${fails} FAILED` : 'ALL PASSED');
  process.exit(fails ? 1 : 0);
})();
