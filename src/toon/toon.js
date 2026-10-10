// Flat cel-animation toolkit: clean even outlines, flat saturated fills, rounded cartoon shapes.
// Everything is drawn in world units on a context pre-scaled by its resolution R.
export const K = '#16121c';
export const LW = 0.8;
export const C = {
  sky: '#8ed6f2', cloud: '#ffffff',
  walk: '#e4def0', walkDot: '#b8afcc', curb: '#c3bbd6', curbTop: '#f3effa',
  road: '#2c2f45', road2: '#363a55', lane: '#ffd23f', zebra: '#f7f1df',
  pink: '#ff3d8b', hotpink: '#ff6fb5', magenta: '#d6297d', red: '#ef2b2b', redorange: '#ff4a2e', orange: '#ff8a1f',
  yellow: '#ffd21f', gold: '#ffc21a', gold2: '#d9930b', green: '#2fb84a', lime: '#8fe03a', teal: '#17b3a3', mint: '#7fe8c8',
  blue: '#2f62e0', navy: '#1f2a6b', sky2: '#5fb8f0', purple: '#7a3fd6', violet: '#4b2a9e', lav: '#c9bdf5',
  cream: '#fff6dc', white: '#ffffff', grey: '#a39cb8', grey2: '#6e6884', steel: '#d6d2e2',
  win: '#1d1a33', winLit: '#ffe066', glass: '#86e4ff',
  skin: ['#ffd0b5', '#f5b48c', '#e0976a', '#c2784b', '#9a5833', '#6e3c1c', '#ffdcae'],
};
export const FONT = {
  slab: "'Alfa Slab One', 'Rockwell Extra Bold', serif",
  block: "'Bowlby One', 'Arial Black', sans-serif",
  round: "'Fredoka', 'Arial Rounded MT Bold', sans-serif",
  script: "'Pacifico', cursive",
  sign: "'Bungee', sans-serif",
  tag: "'Rubik Bubbles', 'Bowlby One', sans-serif",
  jp: "'Noto Sans JP', 'Hiragino Sans', 'Yu Gothic', sans-serif",
};

export function rng(seed = 1) {
  let s = seed >>> 0 || 1;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
}
export const pick = (r, a) => a[Math.floor(r() * a.length)];

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

// ---------- paths ----------
export function path(ctx, pts, closed = true) {
  ctx.beginPath();
  ctx.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
  if (closed) ctx.closePath();
}
// Catmull-Rom spline through the points: soft cartoon curves
export function smooth(ctx, p, closed = true) {
  const n = p.length;
  if (n < 3) return path(ctx, p, closed);
  const get = (i) => (closed ? p[(i + n) % n] : p[Math.max(0, Math.min(n - 1, i))]);
  ctx.beginPath();
  ctx.moveTo(p[0][0], p[0][1]);
  const segs = closed ? n : n - 1;
  for (let i = 0; i < segs; i++) {
    const p0 = get(i - 1), p1 = get(i), p2 = get(i + 1), p3 = get(i + 2);
    ctx.bezierCurveTo(p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6, p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6, p2[0], p2[1]);
  }
  if (closed) ctx.closePath();
}
// Polygon with rounded corners
export function roundPoly(ctx, pts, r = 1.2) {
  const n = pts.length;
  const mid = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  ctx.beginPath();
  const m0 = mid(pts[n - 1], pts[0]);
  ctx.moveTo(m0[0], m0[1]);
  for (let i = 0; i < n; i++) {
    const p = pts[i], m = mid(p, pts[(i + 1) % n]);
    ctx.arcTo(p[0], p[1], m[0], m[1], r);
  }
  ctx.closePath();
}
export function rrectPath(ctx, x, y, w, h, r) {
  const k = Math.max(0, Math.min(r, w / 2, h / 2));
  ctx.beginPath();
  ctx.moveTo(x + k, y);
  ctx.arcTo(x + w, y, x + w, y + h, k);
  ctx.arcTo(x + w, y + h, x, y + h, k);
  ctx.arcTo(x, y + h, x, y, k);
  ctx.arcTo(x, y, x + w, y, k);
  ctx.closePath();
}

// ---------- paint ----------
export function ink(ctx, fill, lw = LW, stroke = K) {
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  if (lw) { ctx.lineWidth = lw; ctx.strokeStyle = stroke; ctx.stroke(); }
}
export const rect = (ctx, x, y, w, h, fill, lw = LW) => { ctx.beginPath(); ctx.rect(x, y, w, h); ink(ctx, fill, lw); };
export const rrect = (ctx, x, y, w, h, r, fill, lw = LW) => { rrectPath(ctx, x, y, w, h, r); ink(ctx, fill, lw); };
export const oval = (ctx, cx, cy, rx, ry, fill, lw = LW, rot = 0) => { ctx.beginPath(); ctx.ellipse(cx, cy, Math.max(0.01, rx), Math.max(0.01, ry), rot, 0, Math.PI * 2); ink(ctx, fill, lw); };
export const poly = (ctx, pts, fill, lw = LW, r = 0) => { r ? roundPoly(ctx, pts, r) : path(ctx, pts); ink(ctx, fill, lw); };
export const blob = (ctx, pts, fill, lw = LW) => { smooth(ctx, pts, true); ink(ctx, fill, lw); };
export function line(ctx, pts, lw = LW, c = K, curved = false) {
  curved ? smooth(ctx, pts, false) : path(ctx, pts, false);
  ctx.lineWidth = lw;
  ctx.strokeStyle = c;
  ctx.stroke();
}
// Outlined tube for arms, legs, pipes
export function tube(ctx, pts, w, color, lw = LW) {
  smooth(ctx, pts, false);
  ctx.lineWidth = w + lw * 2;
  ctx.strokeStyle = K;
  ctx.stroke();
  ctx.lineWidth = w;
  ctx.strokeStyle = color;
  ctx.stroke();
}
export function clip(ctx, makePath, fn) {
  ctx.save();
  makePath();
  ctx.clip();
  fn();
  ctx.restore();
}
export function ellPts(cx, cy, rx, ry, a0 = 0, a1 = Math.PI * 2, n = 16) {
  const out = [];
  for (let i = 0; i <= n; i++) { const a = a0 + ((a1 - a0) * i) / n; out.push([cx + Math.cos(a) * rx, cy + Math.sin(a) * ry]); }
  return out;
}
// Speckle dots (sidewalks, stucco, stubble)
export function dots(ctx, x, y, w, h, color, n, r, size = 0.5) {
  ctx.fillStyle = color;
  ctx.beginPath();
  for (let i = 0; i < n; i++) {
    const px = x + r() * w, py = y + r() * h, s = size * (0.7 + r() * 0.6);
    ctx.moveTo(px + s, py);
    ctx.ellipse(px, py, s, s * 0.8, 0, 0, Math.PI * 2);
  }
  ctx.fill();
}

// Sign lettering: optional outline and a cartoon extrusion
export function text(ctx, str, x, y, o = {}) {
  const size = o.size || 8;
  ctx.save();
  ctx.translate(x, y);
  if (o.rot) ctx.rotate(o.rot);
  ctx.font = `${o.weight || ''} ${size}px ${o.font || FONT.slab}`;
  ctx.textAlign = o.align || 'center';
  ctx.textBaseline = 'middle';
  if (o.spacing && 'letterSpacing' in ctx) ctx.letterSpacing = `${o.spacing}px`;
  ctx.lineJoin = 'round';
  if (o.extrude) {
    const d = o.depth ?? size * 0.12;
    ctx.fillStyle = o.extrude;
    ctx.strokeStyle = K;
    ctx.lineWidth = o.sw ?? size * 0.14;
    for (let i = d; i > 0; i -= Math.max(0.25, d / 6)) { ctx.strokeText(str, i, i); ctx.fillText(str, i, i); }
  }
  if (o.stroke) { ctx.lineWidth = o.sw ?? size * 0.14; ctx.strokeStyle = o.stroke; ctx.strokeText(str, 0, 0); }
  ctx.fillStyle = o.fill || K;
  ctx.fillText(str, 0, 0);
  ctx.restore();
}
export function measure(str, size, font = FONT.slab, weight = '') {
  const c = measure.c || (measure.c = document.createElement('canvas').getContext('2d'));
  c.font = `${weight} ${size}px ${font}`;
  return c.measureText(str).width;
}

export const shade = (hex, amt) => {
  const n = parseInt(hex.slice(1, 7), 16);
  const f = (v) => Math.max(0, Math.min(255, Math.round(v + amt * 255)));
  return `#${[(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => f(v).toString(16).padStart(2, '0')).join('')}`;
};
export const mix = (a, b, t) => {
  const pa = parseInt(a.slice(1, 7), 16), pb = parseInt(b.slice(1, 7), 16);
  const ch = (s) => Math.round(((pa >> s) & 255) * (1 - t) + ((pb >> s) & 255) * t);
  return `#${[16, 8, 0].map((s) => ch(s).toString(16).padStart(2, '0')).join('')}`;
};

export async function ensureFonts(list) {
  if (!document.fonts?.load) return;
  const spec = (f) => { const m = /^(\d{3}) (.*)$/.exec(f); return m ? `${m[1]} 20px ${m[2]}` : `20px ${f}`; };
  const load = Promise.all(list.map((f) => (Array.isArray(f) ? document.fonts.load(spec(f[0]), f[1]) : document.fonts.load(spec(f))).catch(() => {})));
  await Promise.race([load, new Promise((r) => setTimeout(r, 2500))]);
}
