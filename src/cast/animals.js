// Melvin the stoop dog, the van's alley cat and the block's pigeons, inked like hand-drawn cels: each shape's
// outline is a brush ribbon laid under its fill, heavier on the shadow side and tapering where parts join.
const K = '#1f1518';
const TONGUE = '#f2708a';

// ---------- the ink ----------
const LIGHT = [0.34, 0.94]; // light comes from the top left, so lines thicken along the bottom right
let L = 2.4; // pen size in frame units: contour and detail weights hang off it
let NS = 7; // ink noise state, reseeded per frame so held frames boil slightly against each other
const W = () => L * 0.8;
const D = () => L * 0.48;
const WOB = () => L * 0.1;
function rnd() { NS = (Math.imul(NS, 1664525) + 1013904223) >>> 0; return NS / 4294967296; }
const lerp = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
const tint = (hex, amt) => {
  const n = parseInt(hex.slice(1, 7), 16), f = (v) => Math.max(0, Math.min(255, Math.round(v + amt * 255)));
  return `#${[(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => f(v).toString(16).padStart(2, '0')).join('')}`;
};

// Catmull-Rom through the control points, sampled densely; .idx remembers where each control point landed
function sample(p, closed, step = 0.5) {
  const n = p.length, g = (i) => (closed ? p[(i + n) % n] : p[Math.max(0, Math.min(n - 1, i))]);
  const out = [], idx = [];
  for (let i = 0; i < (closed ? n : n - 1); i++) {
    const a = g(i - 1), b = g(i), c = g(i + 1), d = g(i + 2);
    const c1x = b[0] + (c[0] - a[0]) / 6, c1y = b[1] + (c[1] - a[1]) / 6, c2x = c[0] - (d[0] - b[0]) / 6, c2y = c[1] - (d[1] - b[1]) / 6;
    const len = Math.hypot(c1x - b[0], c1y - b[1]) + Math.hypot(c2x - c1x, c2y - c1y) + Math.hypot(c[0] - c2x, c[1] - c2y);
    const m = Math.max(1, Math.ceil(len / step));
    idx.push(out.length);
    for (let k = 0; k < m; k++) {
      const t = k / m, u = 1 - t;
      out.push([u * u * u * b[0] + 3 * u * u * t * c1x + 3 * u * t * t * c2x + t * t * t * c[0], u * u * u * b[1] + 3 * u * u * t * c1y + 3 * u * t * t * c2y + t * t * t * c[1]]);
    }
  }
  if (!closed) { idx.push(out.length); out.push(g(n - 1)); }
  out.idx = idx;
  return out;
}
// straight edges, for brims, soles and boxes
function sampleP(p, closed, step = 0.5) {
  const n = p.length, out = [], idx = [];
  for (let i = 0; i < (closed ? n : n - 1); i++) {
    const b = p[i], c = p[(i + 1) % n], m = Math.max(1, Math.ceil(Math.hypot(c[0] - b[0], c[1] - b[1]) / step));
    idx.push(out.length);
    for (let k = 0; k < m; k++) out.push(lerp(b, c, k / m));
  }
  if (!closed) { idx.push(out.length); out.push(p[n - 1]); }
  out.idx = idx;
  return out;
}
function area(pts) { let a = 0; for (let i = 0, n = pts.length; i < n; i++) { const p = pts[i], q = pts[(i + 1) % n]; a += p[0] * q[1] - q[0] * p[1]; } return a; }
function nrm(pts, closed, sg = 1) {
  const n = pts.length, out = new Array(n);
  for (let i = 0; i < n; i++) {
    const a = pts[closed ? (i - 1 + n) % n : Math.max(0, i - 1)], b = pts[closed ? (i + 1) % n : Math.min(n - 1, i + 1)];
    const tx = b[0] - a[0], ty = b[1] - a[1], l = Math.hypot(tx, ty) || 1;
    out[i] = [(sg * ty) / l, (-sg * tx) / l];
  }
  return out;
}
function lens(pts, closed) {
  const n = pts.length, s = [0];
  for (let i = 1; i < n; i++) s.push(s[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  s.tot = s[n - 1] + (closed ? Math.hypot(pts[0][0] - pts[n - 1][0], pts[0][1] - pts[n - 1][1]) : 0);
  return s;
}
// the hand never quite follows the pencil: push the path in and out along a slow wave
function wob(pts, closed) {
  const n = pts.length;
  if (n < 3) return pts;
  const N = nrm(pts, closed), s = lens(pts, closed), tot = s.tot || 1;
  const amp = Math.min(WOB(), tot * 0.012);
  const p1 = rnd() * 6.283, p2 = rnd() * 6.283;
  if (amp < 0.01) return pts;
  const c1 = closed ? Math.max(1, Math.round(tot / 24)) : tot / 24, c2 = closed ? Math.max(2, Math.round(tot / 9)) : tot / 9;
  const out = pts.map((p, i) => {
    const u = (s[i] / tot) * 6.283;
    let k = Math.sin(u * c1 + p1) * 0.7 + Math.sin(u * c2 + p2) * 0.3;
    if (!closed) k *= Math.min(1, s[i] / 2, (tot - s[i]) / 2);
    return [p[0] + N[i][0] * k * amp, p[1] + N[i][1] * k * amp];
  });
  out.idx = pts.idx;
  return out;
}
// a brush ribbon: half-width hw(t, normal, s, total) either side of the path
function ribbon(x, pts, closed, hw, col = K, sg = 1) {
  const n = pts.length;
  if (n < 2) return;
  const N = nrm(pts, closed, sg), s = lens(pts, closed), tot = s.tot || 1;
  const w = pts.map((_, i) => hw(s[i] / tot, N[i], s[i], tot));
  x.beginPath();
  for (let i = 0; i < n; i++) { const X = pts[i][0] + N[i][0] * w[i], Y = pts[i][1] + N[i][1] * w[i]; if (i) x.lineTo(X, Y); else x.moveTo(X, Y); }
  if (closed) { x.closePath(); x.moveTo(pts[n - 1][0] - N[n - 1][0] * w[n - 1], pts[n - 1][1] - N[n - 1][1] * w[n - 1]); }
  for (let i = closed ? n - 2 : n - 1; i >= 0; i--) x.lineTo(pts[i][0] - N[i][0] * w[i], pts[i][1] - N[i][1] * w[i]);
  x.closePath();
  x.fillStyle = col;
  x.fill();
}
// contour weight: heavy on the shadow side, light where the light hits, with a little pressure wobble
function lit(w) { const ph = rnd() * 6.283, f = 2 + rnd() * 3; return (t, nn) => w * (0.74 + 0.42 * Math.max(0, nn[0] * LIGHT[0] + nn[1] * LIGHT[1]) + 0.07 * Math.sin(t * f * 6.283 + ph)); }
function even(w) { const ph = rnd() * 6.283; return (t) => w * (0.9 + 0.12 * Math.sin(t * 7 + ph)); }
// a lifted brush: the stroke swells in and thins out to a point at both ends
function tip(fn, zone = 3, frac = 0.3) {
  return (t, nn, s, tot) => {
    const z = Math.max(0.4, Math.min(zone, tot * frac)), e = Math.max(0, Math.min(1, s / z, (tot - s) / z));
    return fn(t, nn, s, tot) * Math.max(0.05, Math.sqrt(e));
  };
}
function fillPts(x, pts, fill) { x.beginPath(); pts.forEach((q, i) => (i ? x.lineTo(q[0], q[1]) : x.moveTo(q[0], q[1]))); x.closePath(); x.fillStyle = fill; x.fill(); }
// a filled shape, inked underneath so only the outer half of the brush shows; o.gap = [a, b] leaves the outline
// off between control points a and b (where a part grows out of another), o.w scales the weight
function shape(x, p, fill, o = {}) {
  let pts = o.dense ? p : (o.poly ? sampleP : sample)(p, true);
  if (o.wob !== false) pts = wob(pts, true);
  const k = o.w ?? 1, sg = area(pts) >= 0 ? 1 : -1, over = o.over || !fill || fill.startsWith('rgba');
  const ink = () => {
    if (k <= 0) return;
    const w = W() * k * (over ? 0.55 : 1);
    if (o.gap) {
      const idx = pts.idx, n = pts.length, i1 = idx[o.gap[0]];
      let i = idx[o.gap[1]];
      const seg = [pts[i]];
      while (i !== i1 && seg.length <= n) { i = (i + 1) % n; seg.push(pts[i]); }
      ribbon(x, seg, false, tip(lit(w), 2.6, 0.2), K, sg);
    } else ribbon(x, pts, true, lit(w), K, sg);
  };
  if (!over) ink();
  if (fill) fillPts(x, pts, fill);
  if (over) ink();
  return pts;
}
function ellPts(cx, cy, rx, ry, rot = 0) {
  const n = Math.max(14, Math.ceil(((rx + ry) * Math.PI) / 0.45)), c = Math.cos(rot), s = Math.sin(rot), o = [];
  for (let i = 0; i < n; i++) { const a = (i / n) * Math.PI * 2, X = Math.cos(a) * rx, Y = Math.sin(a) * ry; o.push([cx + X * c - Y * s, cy + X * s + Y * c]); }
  return o;
}
function oval(x, cx, cy, rx, ry, fill, o = {}) { return shape(x, ellPts(cx, cy, Math.max(0.05, rx), Math.max(0.05, ry), o.rot || 0), fill, { ...o, dense: true }); }
// an inner line: thin, tapering to points
function line(x, p, w = D(), col = K, o = {}) {
  let pts = (o.poly ? sampleP : sample)(p, false, 0.4);
  if (o.wob !== false) pts = wob(pts, false);
  ribbon(x, pts, false, tip(even(w / 2), o.zone ?? 2.4, o.frac ?? 0.35), col);
}
// a limb or sleeve along a centreline; the root end has no outline so it grows out of whatever it hangs from
function limb(x, c, width, fill, o = {}) {
  const cl = sample(c, false, 0.6), n = cl.length;
  if (n < 2) return null;
  const N = nrm(cl, false), r = width / 2;
  const P = (p, v, k) => [p[0] + v[0] * k, p[1] + v[1] * k];
  const cap = (p, nv, a0) => { const out = [], base = Math.atan2(nv[1], nv[0]); for (let k = 1; k < 8; k++) { const a = base + a0 + (k / 8) * Math.PI; out.push([p[0] + Math.cos(a) * r, p[1] + Math.sin(a) * r]); } return out; };
  const left = cl.map((p, i) => P(p, N[i], r)), right = cl.map((p, i) => P(p, N[i], -r)).reverse();
  const ring = [...left, ...cap(cl[n - 1], N[n - 1], 0), ...right, ...cap(cl[0], N[0], Math.PI)];
  const inkEnd = n * 2 + 6;
  const pts = wob(ring, true), sg = area(pts) >= 0 ? 1 : -1, k = o.w ?? 1;
  if (k > 0) {
    if (o.root === false) ribbon(x, pts, true, lit(W() * k), K, sg);
    else ribbon(x, pts.slice(0, inkEnd), false, tip(lit(W() * k), 3, 0.2), K, sg);
  }
  fillPts(x, pts, fill);
  return pts;
}
function clip(x, pts, fn) { x.save(); x.beginPath(); pts.forEach((q, i) => (i ? x.lineTo(q[0], q[1]) : x.moveTo(q[0], q[1]))); x.closePath(); x.clip(); fn(); x.restore(); }
function dots(x, list, r, col) { x.fillStyle = col; x.beginPath(); for (const [a, b] of list) { x.moveTo(a + r, b); x.arc(a, b, r, 0, Math.PI * 2); } x.fill(); }
function cnv(w, h, R) {
  const c = document.createElement('canvas');
  c.width = Math.ceil(w * R); c.height = Math.ceil(h * R);
  const x = c.getContext('2d');
  x.scale(R, R);
  c.uw = w; c.uh = h;
  return [c, x];
}
// draw at a scale without the pen growing with it

// ---------- animals, inked the same way ----------
function critter(w, h, R, pen, seed, draw) {
  const keep = L; L = pen; NS = seed;
  const [c, x] = cnv(w, h, R);
  draw(x);
  L = keep;
  return c;
}
export function dogFrames(R) {
  // Melvin from the garage: a droopy brown hound lying down, head up facing left, eyes shut, tongue out,
  // long dark ears, a dotted muzzle, hair strands on top of the dome and a red collar
  return [0, 1].map((k) => critter(48, 32, R, 1.5, 41 + k, (x) => {
    x.translate(1, 1);
    const fur = '#c4642a', dark = '#6e2c10';
    limb(x, [[42, 22], [45.6, 18.4 - k], [45, 15 - k]], 2.6, fur);
    const body = shape(x, [[20, 27.6], [22, 18.6 - k * 0.6], [31, 15 - k * 0.6], [41, 17.4 - k * 0.4], [44, 24], [41, 28.4]], fur);
    clip(x, body, () => { x.fillStyle = dark; x.beginPath(); x.ellipse(35.4, 18.6 - k * 0.6, 3.6, 2.6, 0.2, 0, Math.PI * 2); x.fill(); });
    shape(x, [[35, 27], [38.6, 25.4], [43, 26.4], [43.4, 29.2], [36, 29.4]], fur, { w: 0.9 });
    shape(x, [[24.4, 7.6], [30, 10.6], [34, 19.4], [31, 24], [26.4, 17.6]], dark);
    oval(x, 21.6, 12, 6.4, 8.4, fur);
    shape(x, [[17.6, 6.6], [12.4, 10.4], [5.4, 21.4], [9, 25], [15.4, 15.4]], dark);
    shape(x, [[21, 19.6], [16, 13.2], [8, 13.6], [3.4, 16.6], [3.8, 21.6], [9, 23.6], [17, 22.6]], fur, { gap: [6, 0] });
    oval(x, 4.4, 16.2, 2.8, 2.4, '#2a1408', { w: 0.7 });
    dots(x, [[8.6, 19.6], [11, 21], [7, 21.6], [10.4, 18.4]], 0.6, dark);
    line(x, [[17.4, 9.6], [19.2, 10.6], [21, 9.6]], W() * 0.75); line(x, [[22.4, 9.2], [24.2, 10.2], [26, 9.2]], W() * 0.75);
    shape(x, [[16.6, 21.6], [20.4, 20.6], [23.4, 24 + k], [21.4, 27 + k], [18.6, 25.6 + k]], TONGUE, { w: 0.8 });
    line(x, [[19, 21.8], [20.6, 24.4 + k]], D() * 0.7, '#c2304e');
    shape(x, [[23.6, 19.4], [27.6, 18], [28.6, 21.4], [24.4, 22.8]], '#e8202a', { w: 0.8 });
    shape(x, [[12, 28.4], [14.4, 25.8], [20, 26], [22, 28.4], [20, 30], [13.4, 30]], fur, { w: 0.9 });
    line(x, [[15, 28.2], [15.2, 29.6]], D() * 0.7); line(x, [[17.4, 28.2], [17.6, 29.6]], D() * 0.7);
    for (const [hx, hy, tx, ty] of [[20.6, 3.8, 18, -0.4], [21.8, 3.6, 22, -1], [23, 3.8, 26, 0]]) line(x, [[hx, hy], [(hx + tx) / 2 + 0.4, (hy + ty) / 2 - 0.6], [tx, ty]], D() * 0.8, K, { zone: 0.8 });
  }));
}
export function catFrames(R) {
  return [0, 1].map((k) => critter(22, 18, R, 1.3, 51 + k, (x) => {
    x.translate(1, 1);
    const fur = '#6a5a8a';
    limb(x, k ? [[4, 12], [1.4, 8], [2.4, 3.4]] : [[4, 12], [1, 13.4], [0.4, 10]], 2.4, fur);
    oval(x, 8, 11.6, 5.4, 4.2, fur);
    shape(x, [[10.4, 5.6], [10.6, 0.6], [13, 3.4], [14.8, 3.4], [16.6, 0.4], [17.2, 5], [17.6, 8], [15.4, 10.6], [11.6, 10.4], [9.6, 8]], fur);
    oval(x, 12.4, 6.6, 2, 2.3, '#ffffff', { w: 0.7 }); oval(x, 15.6, 6.6, 2, 2.3, '#ffffff', { w: 0.7 });
    dots(x, [[13.2, 6.9], [16.4, 6.9]], 0.65, K);
    x.fillStyle = '#b8a8e0'; x.beginPath(); x.moveTo(10.6, 5.6); x.lineTo(17.4, 4.4); x.lineTo(17.4, 5.4); x.lineTo(10.6, 6.6); x.fill();
    oval(x, 14.4, 9.4, 1, 0.7, '#ff8aa8', { w: 0.5 });
    line(x, [[16, 9.6], [20, 8.8]], 0.5); line(x, [[16, 10.2], [20, 10.6]], 0.5);
  }));
}
export function pigeonFrames(R) {
  const make = (mode) => critter(18, 15, R, 1.1, 61 + mode, (x) => {
    x.translate(2, 2);
    const body = '#a8a4c4', wing = '#8a86a6';
    if (mode >= 2) {
      const up = mode === 2;
      shape(x, up ? [[3, 5], [0.4, -1.6], [7, 4]] : [[3, 5.4], [0.6, 11], [7, 5.6]], wing);
      oval(x, 6, 5.6, 4.8, 2.7, body);
      oval(x, 10.6, 4, 2.3, 2.1, body);
      oval(x, 11.2, 3.4, 1.1, 1.2, '#ffffff', { w: 0.6 }); dots(x, [[11.6, 3.5]], 0.5, K);
      shape(x, [[12.6, 4], [14.6, 4.6], [12.6, 5.2]], '#f2a33a', { poly: true, w: 0.6 });
      shape(x, up ? [[6, 4.6], [9.4, -2.4], [9.6, 4.2]] : [[6, 6], [9.6, 12], [9.6, 6]], tint(wing, 0.06));
    } else {
      const peck = mode === 1;
      shape(x, [[1.2, 5], [-1.4, 4.8], [-0.8, 7.8], [1.4, 7.8]], wing, { poly: true });
      oval(x, 5.6, 6.4, 4.6, 3.2, body);
      line(x, [[2.4, 5.6], [5, 7.4], [8, 6.4]], D() * 0.9, wing);
      const hx = peck ? 10.4 : 9.2, hy = peck ? 7.8 : 3;
      limb(x, [[8, 5.4], [hx - 0.4, hy + 1.2]], 2.6, '#7a5ab0');
      oval(x, hx, hy, 2.2, 2.1, body);
      oval(x, hx + 0.6, hy - 0.5, 1.1, 1.2, '#ffffff', { w: 0.6 }); dots(x, [[hx + 0.9, hy - 0.4]], 0.5, K);
      shape(x, [[hx + 1.9, hy + 0.1], [hx + 3.8, hy + 0.8], [hx + 1.9, hy + 1.2]], '#f2a33a', { poly: true, w: 0.6 });
      line(x, [[4.6, 9.6], [4.2, 11.4], [3.2, 11.6]], 0.8, '#ff7aa0'); line(x, [[6.6, 9.6], [6.8, 11.4], [7.8, 11.6]], 0.8, '#ff7aa0');
    }
  });
  return [make(0), make(1), make(2), make(3)];
}
