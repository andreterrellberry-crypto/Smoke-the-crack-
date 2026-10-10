// Hand-inked comic toolkit: wobbly brush outlines, flat print colours, Ben-Day halftones, cross-hatching, lettering.
// Everything is drawn in world units on a context pre-scaled by its resolution R.
export const INK = '#1b1410';
export const PAPER = '#f4ead0';
export const C = {
  sky: '#8fd0e6', sky2: '#c9e6ea', horizon: '#f6d28c', cloud: '#fbf6e8',
  walk: '#c9bfa8', walk2: '#b8ad94', curb: '#a39a86', road: '#6d6a72', road2: '#5c5961', lane: '#f2c230',
  brick: '#c4583a', brick2: '#a94a30', concrete: '#bdb6a6', concrete2: '#a79f8e',
  glass: '#9fd6e0', glassDk: '#4f7f8f', lit: '#ffe08a',
  pink: '#ef6aa2', cyan: '#3fc6e0', yellow: '#f6cc3c', green: '#4fb36a', red: '#e0443a', purple: '#9b5fc0', orange: '#f0913a',
  gold: '#f2c14e', gold2: '#c8922a',
  skin: ['#f2b27a', '#e09a62', '#c98552', '#a8693e', '#8a5232', '#6a3c22', '#f6c99a'],
  far: '#a9c4d6', far2: '#9cb6ca', mid: '#c9a58a', mid2: '#b48e74',
};

export function rng(seed = 1) {
  let s = seed >>> 0 || 1;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
}
export const pick = (r, a) => a[Math.floor(r() * a.length)];
let J = rng(4242); // jitter source; reseeded per drawing so art is identical on every visit
export const seedInk = (s) => (J = rng(s));
const jit = (a) => (J() - 0.5) * 2 * a;

// Offscreen canvas sized in world units at resolution R
export function layer(w, h, R) {
  const c = document.createElement('canvas');
  c.width = Math.max(1, Math.ceil(w * R));
  c.height = Math.max(1, Math.ceil(h * R));
  const ctx = c.getContext('2d');
  ctx.scale(R, R);
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  c.uw = w; c.uh = h; c.R = R;
  return [c, ctx];
}

// Break straight runs into short pieces and wobble them so lines read as hand-inked
function rough(pts, j = 0.3, step = 5, closed = false) {
  const out = [];
  const n = pts.length;
  for (let i = 0; i < (closed ? n : n - 1); i++) {
    const [x0, y0] = pts[i], [x1, y1] = pts[(i + 1) % n];
    const len = Math.hypot(x1 - x0, y1 - y0);
    const k = Math.max(1, Math.round(len / step));
    for (let s = 0; s < k; s++) out.push([x0 + ((x1 - x0) * s) / k + jit(j), y0 + ((y1 - y0) * s) / k + jit(j)]);
  }
  if (!closed) out.push([pts[n - 1][0] + jit(j), pts[n - 1][1] + jit(j)]);
  return out;
}
function smooth(ctx, p, closed) {
  ctx.beginPath();
  if (p.length < 3) {
    ctx.moveTo(p[0][0], p[0][1]);
    for (let i = 1; i < p.length; i++) ctx.lineTo(p[i][0], p[i][1]);
    if (closed) ctx.closePath();
    return;
  }
  if (closed) {
    const m0 = [(p[p.length - 1][0] + p[0][0]) / 2, (p[p.length - 1][1] + p[0][1]) / 2];
    ctx.moveTo(m0[0], m0[1]);
    for (let i = 0; i < p.length; i++) {
      const a = p[i], b = p[(i + 1) % p.length];
      ctx.quadraticCurveTo(a[0], a[1], (a[0] + b[0]) / 2, (a[1] + b[1]) / 2);
    }
    ctx.closePath();
  } else {
    ctx.moveTo(p[0][0], p[0][1]);
    for (let i = 1; i < p.length - 1; i++) ctx.quadraticCurveTo(p[i][0], p[i][1], (p[i][0] + p[i + 1][0]) / 2, (p[i][1] + p[i + 1][1]) / 2);
    ctx.lineTo(p[p.length - 1][0], p[p.length - 1][1]);
  }
}

// Pen line: cheap wobbly stroke
export function pen(ctx, pts, o = {}) {
  const p = o.raw ? pts : rough(pts, o.j ?? 0.25, o.step ?? 5, o.closed);
  smooth(ctx, p, o.closed);
  ctx.strokeStyle = o.c || INK;
  ctx.lineWidth = o.w ?? 0.6;
  ctx.stroke();
}
// Brush line: tapered ribbon, thick in the middle and thin at the ends, like a dipped brush
export function brush(ctx, pts, o = {}) {
  const p = rough(pts, o.j ?? 0.2, o.step ?? 3, false);
  if (p.length < 2) return;
  const w = o.w ?? 1.1;
  const L = [], Rr = [];
  for (let i = 0; i < p.length; i++) {
    const a = p[Math.max(0, i - 1)], b = p[Math.min(p.length - 1, i + 1)];
    let nx = -(b[1] - a[1]), ny = b[0] - a[0];
    const d = Math.hypot(nx, ny) || 1;
    nx /= d; ny /= d;
    const t = i / (p.length - 1);
    const hw = (w / 2) * (0.25 + 0.75 * Math.pow(Math.sin(Math.PI * Math.min(1, Math.max(0, t * 0.9 + 0.05))), 0.5)) * (1 + jit(0.15));
    L.push([p[i][0] + nx * hw, p[i][1] + ny * hw]);
    Rr.push([p[i][0] - nx * hw, p[i][1] - ny * hw]);
  }
  ctx.beginPath();
  ctx.moveTo(L[0][0], L[0][1]);
  for (const q of L) ctx.lineTo(q[0], q[1]);
  for (let i = Rr.length - 1; i >= 0; i--) ctx.lineTo(Rr[i][0], Rr[i][1]);
  ctx.closePath();
  ctx.fillStyle = o.c || INK;
  ctx.fill();
}
// Filled shape with a wobbly ink outline
export function shape(ctx, pts, o = {}) {
  const p = rough(pts, o.j ?? 0.3, o.step ?? 5, true);
  smooth(ctx, p, true);
  if (o.fill) { ctx.fillStyle = o.fill; ctx.fill(); }
  if (o.stroke !== false) { ctx.strokeStyle = o.stroke || INK; ctx.lineWidth = o.w ?? 0.8; ctx.stroke(); }
  return p;
}
export const rectPts = (x, y, w, h) => [[x, y], [x + w, y], [x + w, y + h], [x, y + h]];
export const box = (ctx, x, y, w, h, o = {}) => shape(ctx, rectPts(x, y, w, h), { step: 8, ...o });
export function ellipsePts(cx, cy, rx, ry, n = 14, a0 = 0) {
  const out = [];
  for (let i = 0; i < n; i++) { const a = a0 + (i / n) * Math.PI * 2; out.push([cx + Math.cos(a) * rx, cy + Math.sin(a) * ry]); }
  return out;
}
export const blob = (ctx, cx, cy, rx, ry, o = {}) => shape(ctx, ellipsePts(cx, cy, rx, ry, o.n || 14), { step: 50, ...o });

export function clipTo(ctx, pts, fn) {
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(pts[0][0], pts[0][1]);
  for (const q of pts) ctx.lineTo(q[0], q[1]);
  ctx.closePath();
  ctx.clip();
  fn();
  ctx.restore();
}
// Ben-Day dots: the printed comic halftone. size can be a function of (x, y) for gradients.
export function halftone(ctx, x, y, w, h, color, gap = 2.2, size = 0.55) {
  ctx.fillStyle = color;
  ctx.beginPath();
  for (let row = 0, yy = y; yy < y + h; row++, yy += gap * 0.87) {
    for (let xx = x + (row % 2 ? gap / 2 : 0); xx < x + w; xx += gap) {
      const s = typeof size === 'function' ? size(xx, yy) : size;
      if (s <= 0.05) continue;
      ctx.moveTo(xx + s, yy);
      ctx.arc(xx, yy, s, 0, Math.PI * 2);
    }
  }
  ctx.fill();
}
// Cross-hatching for shadows
export function hatch(ctx, x, y, w, h, o = {}) {
  const gap = o.gap ?? 1.6, ang = o.angle ?? -0.8;
  ctx.strokeStyle = o.c || INK;
  ctx.lineWidth = o.w ?? 0.3;
  ctx.beginPath();
  const dx = Math.cos(ang), dy = Math.sin(ang);
  const diag = w + h;
  for (let d = -diag; d < diag; d += gap) {
    const sx = x + w / 2 + -dy * d - dx * diag, sy = y + h / 2 + dx * d - dy * diag;
    ctx.moveTo(sx + jit(0.2), sy + jit(0.2));
    ctx.lineTo(sx + dx * diag * 2 + jit(0.2), sy + dy * diag * 2 + jit(0.2));
  }
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  ctx.beginPath();
  for (let d = -diag; d < diag; d += gap) {
    const sx = x + w / 2 + -dy * d - dx * diag, sy = y + h / 2 + dx * d - dy * diag;
    ctx.moveTo(sx, sy);
    ctx.lineTo(sx + dx * diag * 2, sy + dy * diag * 2);
  }
  ctx.stroke();
  if (o.cross) {
    ctx.beginPath();
    for (let d = -diag; d < diag; d += gap * 1.3) {
      const sx = x + w / 2 + dy * d - dy * diag, sy = y + h / 2 - dx * d + dx * diag;
      ctx.moveTo(sx, sy);
      ctx.lineTo(sx + dy * diag * 2, sy - dx * diag * 2);
    }
    ctx.stroke();
  }
  ctx.restore();
}
// Hand lettering with a fat ink outline
export function letter(ctx, str, x, y, o = {}) {
  ctx.save();
  ctx.translate(x, y);
  if (o.rot) ctx.rotate(o.rot);
  ctx.font = `${o.weight || ''} ${o.size || 8}px ${o.font || "'Bangers', 'Luckiest Guy', Impact, sans-serif"}`;
  ctx.textAlign = o.align || 'center';
  ctx.textBaseline = 'middle';
  if (o.spacing && 'letterSpacing' in ctx) ctx.letterSpacing = `${o.spacing}px`;
  if (o.shadow) { ctx.fillStyle = o.shadow; ctx.fillText(str, (o.size || 8) * 0.07, (o.size || 8) * 0.07); }
  if (o.stroke) { ctx.lineWidth = o.sw ?? (o.size || 8) * 0.16; ctx.strokeStyle = o.stroke; ctx.lineJoin = 'round'; ctx.strokeText(str, 0, 0); }
  ctx.fillStyle = o.fill || INK;
  ctx.fillText(str, 0, 0);
  ctx.restore();
}
// Comic sound effect: wobbly tilted letters, fat outline, drop shadow
export function sfx(word, color, size = 12, R = 3) {
  const w = word.length * size * 0.62 + size, h = size * 1.6;
  const [c, ctx] = layer(w, h, R);
  let x = size * 0.5;
  const rr = rng(word.length * 31 + size);
  for (const ch of word) {
    const rot = (rr() - 0.5) * 0.35, dy = (rr() - 0.5) * size * 0.18;
    letter(ctx, ch, x + size * 0.3, h / 2 + dy, { size, fill: color, stroke: INK, sw: size * 0.2, rot, shadow: INK });
    x += size * (ch === ' ' ? 0.35 : 0.6);
  }
  return c;
}

export async function ensureFonts(list) {
  if (!document.fonts?.load) return;
  const load = Promise.all(list.map((f) => (Array.isArray(f) ? document.fonts.load(`20px ${f[0]}`, f[1]) : document.fonts.load(`20px ${f}`)).catch(() => {})));
  await Promise.race([load, new Promise((r) => setTimeout(r, 2500))]);
}

export const shade = (hex, amt) => {
  const n = parseInt(hex.slice(1, 7), 16);
  const f = (v) => Math.max(0, Math.min(255, Math.round(v + amt * 255)));
  return `#${[(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => f(v).toString(16).padStart(2, '0')).join('')}`;
};

// Exposed for builders that need raw wobbly paths
export const jitter = (a) => jit(a);
export function trace(ctx, pts, closed = false, j = 0.15) {
  smooth(ctx, pts.map(([x, y]) => [x + jit(j), y + jit(j)]), closed);
}
// Outlined tube (limbs, pipes): ink edge then colour core
export function limb(ctx, pts, w, color, edge = 0.65) {
  trace(ctx, pts, false, 0.12);
  ctx.strokeStyle = INK;
  ctx.lineWidth = w + edge * 2;
  ctx.stroke();
  ctx.strokeStyle = color;
  ctx.lineWidth = w;
  ctx.stroke();
}
