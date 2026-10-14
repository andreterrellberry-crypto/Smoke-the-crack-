// Check the painted anchors through the public canvas: pan to each front, photograph it, tap its door.
// Uses the same optional PLAYWRIGHT_MODULE / PLAYWRIGHT_CHANNEL overrides as shots.mjs.
import { readFileSync, mkdirSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import assert from 'node:assert/strict';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE ? pathToFileURL(process.env.PLAYWRIGHT_MODULE).href : 'playwright');
const arg = (name, fallback) => { const i = process.argv.indexOf(`--${name}`); return i < 0 ? fallback : process.argv[i + 1]; };
const out = arg('out', 'shots/exteriors'), url = arg('url', 'http://localhost:4173/');
mkdirSync(out, { recursive: true });
const fronts = ['north-america', 'canada', 'south-america', 'alley', 'europe', 'africa', 'asia', 'oceania', 'auction'];
const widths = fronts.map((id) => id === 'alley' ? 100 : id === 'auction' ? 210 : 160);
const browser = await chromium.launch(process.env.PLAYWRIGHT_CHANNEL ? { channel: process.env.PLAYWRIGHT_CHANNEL } : {});
try {
  for (const [name, width, height, dpr] of [['desk', 1440, 900, 1], ['phone', 390, 844, 3]]) {
    const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: dpr });
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
    await page.goto(url); await page.waitForSelector('body.toon');
    await page.click('#drop'); await page.waitForTimeout(2200);
    const scale = Math.min(height / 470, width / 170), viewW = width / scale, viewH = height / scale;
    let left = 150;
    for (const [i, id] of fronts.entries()) {
      const m = JSON.parse(readFileSync(new URL(`../../src/assets/env/front_${id}.json`, import.meta.url)));
      for (const b of [m.door, ...(m.windows || []), m.ticker].filter(Boolean)) {
        assert(b[0] >= 0 && b[1] >= 0 && b[0] + b[2] <= m.w && b[1] + b[3] <= m.h, `${id}: anchor outside source`);
      }
      const cam = Math.max(0, Math.min(1730 - viewW, left + widths[i] / 2 - viewW / 2));
      await page.evaluate(({ cam, scale }) => {
        const canvas = document.querySelector('#street');
        canvas.dispatchEvent(new WheelEvent('wheel', { deltaX: -100000, cancelable: true }));
        canvas.dispatchEvent(new WheelEvent('wheel', { deltaX: cam * scale / 1.2, cancelable: true }));
      }, { cam, scale });
      await page.waitForTimeout(350);
      await page.screenshot({ path: `${out}/${name}-${id}.png` });
      const k = widths[i] / m.crop[2], door = m.door || m.van;
      const x = (left + (door[0] + door[2] / 2 - m.crop[0]) * k - cam) * scale;
      const y = (viewH - 268 + 192 + (door[1] + door[3] / 2 - m.ground) * k) * scale;
      await page.mouse.click(x, y);
      await page.waitForFunction(() => document.body.dataset.mode === 'interior');
      await page.click('#back'); await page.waitForTimeout(1000);
      left += widths[i];
    }
    assert.deepEqual(errors, [], `${name}: browser errors`);
    console.log(JSON.stringify({ size: name, paintedFronts: 9, doorEntries: 9, errors }));
    await page.close();
  }
} finally { await browser.close(); }
