// Painted fronts keep source-pixel anchors; the street receives its usual world-unit contract.
import { itemCanvas } from './items.js';
import { neon, vanRear } from './facades.js';

const sources = import.meta.glob('../assets/env/front_*.webp', { eager: true, query: '?inline', import: 'default' });
const sidecars = import.meta.glob('../assets/env/front_*.json', { eager: true, import: 'default' });
const art = new Map(), cache = new Map();

export async function loadEnvironments() {
  await Promise.all(Object.entries(sidecars).map(async ([path, meta]) => {
    const src = sources[path.replace(/\.json$/, '.webp')];
    if (!src) return;
    const img = new Image();
    img.src = src;
    await img.decode();
    if (img.naturalWidth !== meta.w || img.naturalHeight !== meta.h) throw new Error(`Environment dimensions changed: ${path}`);
    art.set(path.match(/front_(.+)\.json$/)[1], { img, ...meta });
  }));
}

function sized(id, m, width, R) {
  const key = `${id}:${width}:${R}`;
  if (cache.has(key)) return cache.get(key);
  const [sx, sy, sw, sh] = m.crop;
  const make = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
  let c = make(sw, sh), ctx = c.getContext('2d');
  ctx.drawImage(m.img, sx, sy, sw, sh, 0, 0, sw, sh);
  const target = Math.min(sw, Math.ceil(width * R));
  while (c.width / 2 > target) {
    const next = make(Math.ceil(c.width / 2), Math.ceil(c.height / 2));
    const x = next.getContext('2d'); x.imageSmoothingQuality = 'high';
    x.drawImage(c, 0, 0, next.width, next.height); c = next;
  }
  const next = make(target, Math.round(sh * target / sw));
  const x = next.getContext('2d'); x.imageSmoothingQuality = 'high';
  x.drawImage(c, 0, 0, next.width, next.height);
  cache.set(key, next);
  return next;
}

// Merchandise is clipped to the glass. The supplied frame and reflections stay intact.
function stock(ctx, box, items) {
  if (!items.length) return;
  const { x, y, w, h } = box, n = Math.min(items.length, Math.max(1, Math.floor(w / 20)));
  const size = Math.min(24, w / n - 2, h * 0.72);
  ctx.save(); ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
  for (let i = 0; i < n; i++) ctx.drawImage(itemCanvas(items[i]), x + w * (i + 0.5) / n - size / 2, y + h - size - 2, size, size);
  ctx.restore();
}

export function paintEnvironment(ctx, id, x, G, width, R, items = [], r) {
  const m = art.get(id);
  if (!m) return null;
  const [sx, sy, sw, sh] = m.crop, scale = width / sw;
  const px = (v) => x + (v - sx) * scale;
  const py = (v) => G + (v - m.ground) * scale;
  const box = ([a, b, w, h]) => ({ x: px(a), y: py(b), w: w * scale, h: h * scale });
  ctx.drawImage(sized(id, m, width, R), x, py(sy), width, sh * scale);
  const result = {
    door: m.door && box(m.door), top: py(m.sign[1]) - 4,
    roofL: py(m.roofL), roofR: py(m.roofR), wallL: m.wallL, wallR: m.wallR,
    windows: (m.windows || []).map((b) => { const q = box(b); return [q.x, q.y, q.w, q.h]; }),
    neon: [],
  };
  (m.windows || []).forEach((b, i) => stock(ctx, box(b), items.slice(i * 2, i * 2 + 2)));
  for (const b of m.neon || []) {
    const q = box(b), n = neon('OPEN', '#ffe066', R, { size: 4 });
    const fit = Math.min(q.w / n.w, q.h / n.h, 1);
    result.neon.push({ x: q.x, y: q.y, n: { ...n, w: n.w * fit, h: n.h * fit } });
  }
  if (m.ticker) {
    result.ticker = box(m.ticker);
    result.bulbs = m.bulbs.map(([a, b]) => [px(a), py(b)]);
    result.bulbRadius = 5 * scale;
  }
  if (m.van) {
    const v = box(m.van);
    result.trunk = vanRear(ctx, v.x, v.y, v.w, v.h, r, items).trunk;
    result.booster = { x: px(m.booster[0]), y: G + 8 };
    result.cat = { x: v.x + v.w * 0.3, y: v.y - 12 };
    result.steam = { x: x + width - 7, y: G - 4 };
  }
  if (m.smoke) result.smoke = { x: px(m.smoke[0]), y: py(m.smoke[1]) };
  return result;
}
