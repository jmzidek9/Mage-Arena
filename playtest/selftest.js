// Runs index.html#test in headless Edge and prints the results (run `python pack.py` first). Exit 1 on any FAIL.
const { browser } = require('./browser'), path = require('path');
(async () => {
  const b = await browser();
  const p = await b.newPage();
  await p.goto('file://' + path.resolve(__dirname, '../index.html') + '#test', { waitUntil: 'commit' });
  await p.waitForFunction(() => window.MP, null, { timeout: 180000 });
  const res = await p.evaluate(() => MP.selfTest());
  console.log(res.join('\n')); const bad = res.filter(r => !r.startsWith('PASS'));
  console.log(`${res.length - bad.length}/${res.length} passed`); await b.close(); process.exit(bad.length ? 1 : 0);
})();
