// Drive the site in a headless browser and screenshot every scene the owner looks at, on the screen sizes that
// matter, failing on any console error. Use it after every art or layout change and look at the images.
//
//   npm run build && npx vite preview --port 4173 &
//   node tools/shots/shots.mjs --url http://localhost:4173/ --out shots            # every scenario
//   node tools/shots/shots.mjs --only street,auction --sizes desk,phone           # a subset
//
// Scenarios: street (aerial, street, a walk along the block, the Hammerdome front), stores (every store's owner at
// the counter, panel open and closed), booster (the trunk, bag a piece), auction (walk in, bid three times).
// Sizes: desk 1440x900, wide 2560x1080, phone 390x844 @3x.
// Needs Playwright: `npm i -D playwright && npx playwright install chromium` if it isn't installed.
import { mkdirSync } from 'node:fs';

const arg = (k, d) => { const i = process.argv.indexOf(`--${k}`); return i > 0 ? process.argv[i + 1] : d; };
const url = arg('url', 'http://localhost:4173/');
const out = arg('out', 'shots');
const only = arg('only', 'street,stores,booster,auction').split(',');
const sizes = arg('sizes', 'desk,phone').split(',');
const SIZES = { desk: { viewport: { width: 1440, height: 900 } }, wide: { viewport: { width: 2560, height: 1080 } }, phone: { viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, hasTouch: true } };
const STORES = ['north-america', 'canada', 'south-america', 'europe', 'africa', 'asia', 'oceania'];
mkdirSync(out, { recursive: true });

let chromium;
try { ({ chromium } = await import('playwright')); } catch {
  try { ({ chromium } = await import('/opt/node-tools/node_modules/playwright/index.mjs')); } catch { console.error('Playwright not found: npm i -D playwright && npx playwright install chromium'); process.exit(2); }
}
const browser = await chromium.launch();
let failed = false;

async function page(size) {
  const p = await browser.newPage(SIZES[size]);
  p.errs = [];
  p.on('pageerror', (e) => p.errs.push(e.message));
  p.on('console', (m) => m.type() === 'error' && p.errs.push(m.text()));
  await p.goto(url);
  await p.waitForFunction(() => document.body.classList.contains('toon'), null, { timeout: 30000 });
  return p;
}
const shot = (p, name) => p.screenshot({ path: `${out}/${name}.png` });
const intoStreet = async (p) => { await p.click('#drop'); await p.waitForTimeout(2200); };
const interior = (p) => p.waitForFunction(() => document.body.dataset.mode === 'interior', null, { timeout: 20000 });
const fps = (p) => p.evaluate(() => new Promise((res) => { let n = 0; const t0 = performance.now(); const f = () => { n++; if (performance.now() - t0 < 2000) requestAnimationFrame(f); else res(n / 2); }; requestAnimationFrame(f); }));

const SCENARIOS = {
  async street(p, s) {
    await p.waitForTimeout(1500); await shot(p, `${s}-aerial`);
    await intoStreet(p); await shot(p, `${s}-street`);
    for (let i = 1; i <= 3; i++) { await p.keyboard.down('ArrowRight'); await p.waitForTimeout(1800); await p.keyboard.up('ArrowRight'); await p.waitForTimeout(500); await shot(p, `${s}-street-${i}`); }
    await p.keyboard.down('ArrowRight'); await p.waitForTimeout(9000); await p.keyboard.up('ArrowRight'); await p.waitForTimeout(800);
    await shot(p, `${s}-street-end`);
    return { fps: await fps(p) };
  },
  async stores(p, s) {
    await intoStreet(p);
    for (const id of STORES) {
      await p.click(`#directory button[data-store="${id}"]`); await interior(p); await p.waitForTimeout(1500);
      await shot(p, `${s}-store-${id}`);
      await p.click('#market-close'); await p.waitForTimeout(700); await shot(p, `${s}-store-${id}-closed`);
      await p.click('#back'); await p.waitForTimeout(900);
    }
    return {};
  },
  async booster(p, s) {
    await intoStreet(p);
    await p.click('#directory button[data-booster]'); await interior(p); await p.waitForTimeout(1500);
    await shot(p, `${s}-booster`);
    const meta = await p.evaluate(() => document.querySelector('#market-meta').textContent);
    await p.click('#grid .add'); await p.waitForTimeout(400);
    return { meta, bag: await p.locator('#bag-count').innerText() };
  },
  async auction(p, s) {
    await intoStreet(p);
    await p.click('#directory button[data-auction]'); await interior(p); await p.waitForTimeout(2500);
    await shot(p, `${s}-auction`);
    let bids = 0;
    for (let k = 0; k < 40 && bids < 3; k++) {
      if (await p.evaluate(() => { const b = document.querySelector('.auc [data-a="b1"]'); if (b && !b.disabled) { b.click(); return true; } return false; })) bids++;
      await p.waitForTimeout(700);
    }
    await shot(p, `${s}-auction-bid`);
    return { bids, high: await p.evaluate(() => document.querySelector('.auc [data-a="high"]')?.textContent) };
  },
};

for (const size of sizes) {
  for (const name of only) {
    const p = await page(size);
    let info = {};
    try { info = await SCENARIOS[name](p, size); } catch (e) { p.errs.push(`scenario failed: ${e.message}`); }
    if (p.errs.length) failed = true;
    console.log(JSON.stringify({ size, scenario: name, ...info, errors: p.errs }));
    await p.close();
  }
}
await browser.close();
console.log(`screenshots in ${out}/`);
process.exit(failed ? 1 : 0);
