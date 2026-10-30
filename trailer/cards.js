// Renders the trailer's title cards (trailer/cards.html) to transparent PNGs: node trailer/cards.js <out dir>
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
(async () => {
  const out = path.resolve(process.argv[2] || 'trailer/cards'); fs.mkdirSync(out, { recursive: true });
  const b = await chromium.launch(), p = await b.newPage({ viewport: { width: 1280, height: 720 } });
  await p.goto('file://' + path.resolve(__dirname, 'cards.html'), { waitUntil: 'networkidle' });
  await p.evaluate(() => document.fonts.ready);
  for (const c of await p.$$('.card')) await c.screenshot({ path: path.join(out, (await c.getAttribute('id')) + '.png'), omitBackground: true });
  await b.close();
})();
