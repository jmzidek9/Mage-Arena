// Balance bench: 30 s crowd + 30 s Tyrant per element, repeated (default 3x, PT_REPS) and averaged because one
// crowd run swings by up to 2x; 2 browsers at a time. Prints each element's dps as a multiple of the median, with dps per move.
// Usage: node playtest/bench.js [outDir] [el,el,...]      (run `python pack.py` first; outDir defaults to playtest/out/bench)
const { execFile } = require('child_process'), fs = require('fs'), path = require('path');
const OUT = path.resolve(process.argv[2] || path.join(__dirname, 'out', 'bench')), REPS = +process.env.PT_REPS || 3;
const src = fs.readFileSync(path.join(__dirname, '../js/elements.js'), 'utf8');
const all = [...src.matchAll(/^(\w+): \{$/gm)].map(m => m[1]).filter(e => e !== 'god');
const els = process.argv[3] ? process.argv[3].split(',') : all;
const run = (el, i) => new Promise(res => execFile('node', [path.join(__dirname, 'run.js'), el, 'fight', '--out', path.join(OUT, el, 'r' + i)], { timeout: 600000 }, err => { if (err) console.log('FAILED ' + el); res(); }));
(async () => {
  const q = els.flatMap(el => Array.from({ length: REPS }, (_, i) => [el, i]));
  await Promise.all([0, 1].map(async () => { while (q.length) await run(...q.shift()); })); // never more than 2 browsers
  const avg = (runs, k) => { const by = {}; for (const r of runs) for (const [m, v] of Object.entries(r[k].byMove || {})) by[m] = (by[m] || 0) + v / runs.length;
    return { dps: runs.reduce((s, r) => s + r[k].dps, 0) / runs.length, by: Object.fromEntries(Object.entries(by).map(([m, v]) => [m, Math.round(v)]).sort((a, b) => b[1] - a[1])) }; };
  const rows = all.map(el => {
    const runs = fs.existsSync(path.join(OUT, el)) ? fs.readdirSync(path.join(OUT, el)).map(d => { try { return JSON.parse(fs.readFileSync(path.join(OUT, el, d, 'metrics.json'), 'utf8')); } catch { return null; } }).filter(r => r?.kit && r?.boss) : [];
    return runs.length ? { el, kit: avg(runs, 'kit'), boss: avg(runs, 'boss') } : null;
  }).filter(Boolean);
  const med = a => { const s = a.slice().sort((x, y) => x - y); return s[Math.floor(s.length / 2)]; };
  const mc = med(rows.map(r => r.kit.dps)), mb = med(rows.map(r => r.boss.dps));
  console.log(`median crowd ${mc.toFixed(1)}, boss ${mb.toFixed(1)}`);
  const top = o => Object.entries(o).slice(0, 4).map(([k, v]) => `${k} ${v}`).join(', ');
  for (const r of rows.sort((a, b) => b.kit.dps - a.kit.dps))
    console.log(`${r.el.padEnd(10)} crowd ${(r.kit.dps / mc).toFixed(2)}  boss ${(r.boss.dps / mb).toFixed(2)}   | ${top(r.kit.by)} | boss: ${top(r.boss.by)}`);
  fs.writeFileSync(path.join(OUT, 'bench.json'), JSON.stringify({ crowd: mc, boss: mb, rows: rows.map(r => ({ el: r.el, crowdX: +(r.kit.dps / mc).toFixed(2), bossX: +(r.boss.dps / mb).toFixed(2), kit: r.kit.by, boss: r.boss.by })) }, null, 1));
})();
