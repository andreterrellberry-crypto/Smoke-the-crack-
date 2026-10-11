// The cast, modelled on the MAD (2010) cartoon frames: three-quarter heads, the near eye bulging past the brow under a
// magenta lid, huge sausage / potato / carrot noses hanging past the face, toothy grins tucked behind the nose,
// long necks with an Adam's apple or no neck at all, little torsos, giant sausage-finger hands, clown-size shoes.
// Everything is inked, not stroked: each shape's outline is a brush ribbon laid under its fill, heavier on the
// shadow side, tapering to nothing where a part grows out of another (nose root, shoulder, wrist), and every
// line drifts a little off its true path so no two frames are inked quite the same.
// Everything is drawn facing right; flip the canvas to face left.

export const FW = 112, FH = 148;
const OX = 54, OY = 142;
export const CAST_FRAME = { w: FW, h: FH, ox: OX, oy: OY };
const K = '#1f1518';
const EYE = '#fdf8e6', LID = '#a9478a', BAG = '#8a3a7a', MOUTH = '#4a1222', TONGUE = '#f2708a', TOOTH = '#fffbea', SHADOW = '#120e16';
export const GOLD = '#ffc21a';
export const SKIN = ['#f7a98f', '#eea585', '#d9895f', '#b8693f', '#8e4c2a', '#6a3418', '#ffd2b0'];

// ---------- the ink ----------
const LIGHT = [0.34, 0.94]; // light comes from the top left, so lines thicken along the bottom right
let L = 2.4; // pen size in frame units: contour and detail weights hang off it
let NS = 7; // ink noise state, reseeded per frame so held frames boil slightly against each other
const W = () => L * 0.8;
const D = () => L * 0.48;
const WOB = () => L * 0.1;
function rnd() { NS = (Math.imul(NS, 1664525) + 1013904223) >>> 0; return NS / 4294967296; }
const lerp = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
function arcPts(cx, cy, rx, ry, a0, a1, n = 10) { const o = []; for (let i = 0; i <= n; i++) { const a = a0 + ((a1 - a0) * i) / n; o.push([cx + Math.cos(a) * rx, cy + Math.sin(a) * ry]); } return o; }
function seeded(seed) { let s = seed >>> 0 || 1; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }
export const tint = (hex, amt) => {
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
function scaled(x, k, fn) { const keep = L; L = keep / k; x.save(); x.scale(k, k); fn(); x.restore(); L = keep; }

// ---------- heads (local coords: origin at the neck joint, facing right, y up is negative) ----------
const HEADS = {
  // long drooping face, like the lanky garage guy
  long: { out: [[-7, -5], [-10.5, -15], [-10, -26], [-4, -33.5], [4, -34], [9.5, -29], [11.5, -21], [12, -13], [10.5, -6], [6, -1], [0, 0.5]], cran: [0, -24, 10.5, 10.5], eyes: [[3.2, -25, 4.8, 5.7], [10.8, -24.6, 5.6, 6.5]], nose: [11, -19], mouth: [5.4, -9.6], ear: [-8.2, -15], chin: [6, -1] },
  // little cranium on a huge jowly chin, like the stocky garage guy
  jowl: { out: [[-9, -3], [-12, -12], [-11, -23], [-6, -32], [2, -35], [9, -32], [12.5, -25], [15.5, -16], [15, -7], [10, 0], [2, 2.5], [-5, 1]], cran: [1, -26, 10, 9.5], eyes: [[4.4, -27.4, 5.2, 5.2], [11.8, -27, 6, 6]], nose: [13.5, -20], mouth: [5, -11.5], ear: [-10, -17], chin: [8, 0] },
  // round head, big round eyes, like the crossing guard and the wizard
  round: { out: [[-8, -5], [-11, -15], [-10.5, -26], [-5, -33], [3, -35], [10, -31], [12.5, -23], [12, -13], [9, -5], [3, -0.5], [-3, -1]], cran: [0.5, -24, 11, 11], eyes: [[2.6, -26, 6, 6.8], [11.2, -26, 6.8, 7.6]], nose: [11.5, -19.5], mouth: [5.4, -10], ear: [-9, -17], chin: [5, -1] },
  // egg head with a soft jaw, like the lady at the door
  egg: { out: [[-8, -6], [-11, -17], [-9, -28], [-2, -34], [6, -33], [10.5, -27], [11.5, -19], [10.5, -10], [7, -3], [1, -0.5], [-4, -2]], cran: [0, -23.5, 10.5, 11], eyes: [[4.2, -24, 4.5, 5.2], [10.8, -23.6, 5.2, 5.9]], nose: [11, -17.5], mouth: [5.6, -9], ear: [-8.5, -16], chin: [5, -1] },
};

function eye(x, [ex, ey, rx, ry], f, o, near, shut) {
  const closed = o.blink || f.squint || shut;
  const lid = closed ? 1 : f.lid ?? 0.35;
  const ly = ey - ry + ry * 2 * Math.min(1, lid), sag = closed ? ry * 0.12 : ry * 0.42;
  const pts = oval(x, ex, ey, rx, ry, EYE, { w: 0.85 });
  // the lid's edge: a quadratic from just outside one side of the eye to the other
  const A = [ex - rx - 2, ly], C = [ex, ly + sag], Bq = [ex + rx + 2, ly];
  const edge = Array.from({ length: 11 }, (_, i) => { const t = i / 10, u = 1 - t; return [u * u * A[0] + 2 * u * t * C[0] + t * t * Bq[0], u * u * A[1] + 2 * u * t * C[1] + t * t * Bq[1]]; });
  clip(x, pts, () => {
    if (!closed) {
      const lk = o.look ?? f.look ?? 1, pr = rx * 0.36, pry = ry * 0.36;
      let py = ey + ry * 0.2 + (f.lookY || 0) * ry * 0.3;
      if (lid > 0.02) py = Math.max(py, ly + sag * 0.5 + pry * 1.1);
      const px = ex + lk * rx * 0.36;
      oval(x, px, py, pr, pry, K, { w: 0 });
      oval(x, px - pr * 0.38, py - pry * 0.42, pr * 0.34, pry * 0.34, '#ffffff', { w: 0, wob: false });
    }
    if (lid > 0.02) {
      x.beginPath(); x.moveTo(ex - rx - 2, ey - ry - 2); x.lineTo(ex + rx + 2, ey - ry - 2); edge.slice().reverse().forEach((q) => x.lineTo(q[0], q[1])); x.closePath();
      x.fillStyle = f.lidColor || LID; x.fill();
      line(x, edge, W() * 0.75, K, { poly: true, zone: 1 });
    }
  });
  if (closed) line(x, [[ex - rx * 0.8, ey + ry * 0.35], [ex, ey + ry * 0.72], [ex + rx * 0.8, ey + ry * 0.35]], D() * 0.8);
  if (f.lashes && near) for (let i = 0; i < 3; i++) line(x, [[ex + rx * (0.25 + i * 0.28), ey - ry * (0.92 - i * 0.14)], [ex + rx * (0.5 + i * 0.36), ey - ry * (1.32 - i * 0.16)]], D() * 0.8);
  if (f.bags) line(x, [[ex - rx * 0.75, ey + ry * 1.05], [ex, ey + ry * 1.35], [ex + rx * 0.75, ey + ry * 1.05]], D() * 0.9, BAG);
}
function nose(x, [nx, ny], f, skin) {
  const n = f.nose ?? 1, col = f.noseColor || skin;
  let p, nostril;
  switch (f.noseStyle || 'bulb') {
    case 'sausage':
      p = [[nx - 1.4, ny + 2.8], [nx - 1.2, ny - 2.8], [nx + 6 * n, ny - 3.3], [nx + 11.4 * n, ny + 0.4], [nx + 14.4 * n, ny + 6 * n], [nx + 12.6 * n, ny + 10 * n], [nx + 8.4 * n, ny + 9.4 * n], [nx + 6 * n, ny + 5.2], [nx + 2, ny + 3.4]];
      nostril = [[nx + 8.6 * n, ny + 8.2 * n], [nx + 9.8 * n, ny + 6.8 * n], [nx + 11.2 * n, ny + 7.2 * n]];
      break;
    case 'carrot':
      p = [[nx - 1.4, ny + 2.6], [nx - 1.2, ny - 2.6], [nx + 8 * n, ny - 3.4], [nx + 15 * n, ny - 2.2], [nx + 17.2 * n, ny + 0.4], [nx + 15.4 * n, ny + 3], [nx + 8 * n, ny + 3.3]];
      nostril = [[nx + 11.6 * n, ny + 2.6], [nx + 12.8 * n, ny + 1.4]];
      break;
    case 'hook':
      p = [[nx - 1.4, ny + 2.4], [nx - 1.2, ny - 4], [nx + 6 * n, ny - 5.2], [nx + 10.6 * n, ny - 1], [nx + 9.6 * n, ny + 4], [nx + 5 * n, ny + 5.8], [nx + 2, ny + 3.8]];
      nostril = [[nx + 3.8 * n, ny + 4.4], [nx + 5.2 * n, ny + 3], [nx + 6.6 * n, ny + 3.6]];
      break;
    case 'button':
      p = arcPts(nx + 2.2, ny + 1, 2.9, 2.4, 4.01, 8.9, 10);
      break;
    default:
      p = arcPts(nx + 4.6 * n, ny + 1, 5.4 * n, 4.6 * n, 4.01, 8.9, 14);
      nostril = [[nx + 2.6 * n, ny + 3.6 * n], [nx + 3.6 * n, ny + 2.6 * n], [nx + 4.8 * n, ny + 3.2 * n]];
  }
  shape(x, p, col, { gap: [p.length - 1, 0] });
  if (nostril) line(x, nostril, D() * 0.9);
}
function mouth(x, [mx, my], f, o, gold) {
  const T = gold ? GOLD : TOOTH;
  const kind = o.talk === 2 ? 'oh' : o.talk ? 'open' : f.mouth || 'grin';
  switch (kind) {
    case 'grin': case 'gap': {
      const pts = shape(x, [[mx - 6.8, my - 2.6], [mx - 2, my - 1.7], [mx + 3, my - 2.1], [mx + 7.8, my - 3.4], [mx + 6.8, my + 1], [mx + 2.4, my + 3.8], [mx - 2.2, my + 3.4], [mx - 5.6, my + 0.6]], T);
      clip(x, pts, () => {
        if (kind === 'gap' || f.gap) { x.fillStyle = MOUTH; x.fillRect(mx - 0.6, my - 4, 2.7, 9); }
        if (f.goldTooth) { x.fillStyle = GOLD; x.fillRect(mx - 3.5, my - 4, 2.9, 9); }
        for (const tx of [-3.5, -0.6, 2.1, 4.8]) line(x, [[mx + tx, my - 3.6], [mx + tx - 0.2, my + 1], [mx + tx - 0.5, my + 4]], D() * 0.75, K, { zone: 0.8 });
      });
      line(x, [[mx - 8.4, my - 4.8], [mx - 8.3, my - 2], [mx - 6.9, my + 0.4]], D());
      line(x, [[mx + 7.4, my - 5], [mx + 8.7, my - 3.6], [mx + 8.5, my - 1.8]], D() * 0.8);
      break;
    }
    case 'open': {
      const pts = shape(x, [[mx - 6.2, my - 2.6], [mx + 1, my - 2], [mx + 7.6, my - 3.2], [mx + 6.2, my + 3.4], [mx + 0.8, my + 6.8], [mx - 4.6, my + 3.2]], MOUTH);
      clip(x, pts, () => {
        x.fillStyle = T; x.beginPath(); x.moveTo(mx - 8, my - 6); x.lineTo(mx + 9, my - 6); x.lineTo(mx + 9, my - 0.4); x.quadraticCurveTo(mx, my + 1.6, mx - 8, my - 0.4); x.closePath(); x.fill();
        line(x, [[mx - 7, my - 0.3], [mx, my + 0.7], [mx + 8, my - 0.5]], D() * 0.8);
        for (const tx of [-2.8, 0.2, 3.1]) line(x, [[mx + tx, my - 3.6], [mx + tx, my + 0.4]], D() * 0.7, K, { zone: 0.8 });
        if (gold) { x.fillStyle = T; x.beginPath(); x.moveTo(mx - 8, my + 9); x.lineTo(mx + 9, my + 9); x.lineTo(mx + 9, my + 3.4); x.quadraticCurveTo(mx, my + 2.2, mx - 8, my + 3.4); x.closePath(); x.fill(); line(x, [[mx - 6, my + 3.2], [mx, my + 2.6], [mx + 7, my + 3.1]], D() * 0.8); }
        else { oval(x, mx + 1.4, my + 5.8, 4.2, 2.8, TONGUE, { w: 0.6 }); line(x, [[mx + 1.3, my + 4.2], [mx + 1.5, my + 6.4]], D() * 0.6); }
      });
      break;
    }
    case 'oh': {
      const pts = oval(x, mx + 1.4, my + 1, 3.4, 3.9, MOUTH);
      clip(x, pts, () => { x.fillStyle = T; x.fillRect(mx - 3, my - 4, 9, 2.6); oval(x, mx + 1.6, my + 3.8, 2.6, 1.6, TONGUE, { w: 0 }); });
      break;
    }
    case 'grimace': {
      const pts = shape(x, [[mx - 5.4, my - 1.8], [mx + 0.6, my - 2.4], [mx + 6.8, my - 2.8], [mx + 7.2, my + 2.4], [mx + 0.8, my + 3], [mx - 5, my + 2.8]], T);
      clip(x, pts, () => { line(x, [[mx - 6, my + 0.4], [mx + 8, my]], D() * 0.8); for (let i = -3; i <= 5; i += 2) line(x, [[mx + i, my - 3], [mx + i, my + 3.4]], D() * 0.65, K, { zone: 0.6 }); });
      break;
    }
    case 'buck':
      line(x, [[mx - 6, my - 2.2], [mx, my + 0.2], [mx + 7, my - 2.2]], W() * 0.9);
      shape(x, [[mx - 1.4, my + 0.4], [mx + 4.4, my + 0.1], [mx + 4.4, my + 4.4], [mx - 1.2, my + 4.6]], T, { poly: true, w: 0.7 });
      line(x, [[mx + 1.5, my + 0.6], [mx + 1.5, my + 4.2]], D() * 0.7);
      break;
    case 'lips':
      shape(x, [[mx - 4, my - 0.6], [mx - 1, my - 2.6], [mx + 1, my - 1.6], [mx + 3.4, my - 2.6], [mx + 6, my - 0.4], [mx + 1, my + 3]], '#c8287a', { w: 0.8 });
      line(x, [[mx - 3.6, my - 0.4], [mx + 5.6, my - 0.4]], D() * 0.8);
      break;
    case 'frown':
      line(x, [[mx - 5.6, my + 1.6], [mx + 1, my - 1.2], [mx + 7, my + 1]], W() * 0.9);
      shape(x, [[mx - 0.6, my - 0.9], [mx + 2, my - 1], [mx + 2, my + 1.8], [mx - 0.6, my + 1.8]], T, { poly: true, w: 0.6 });
      break;
    default:
      line(x, [[mx - 5.4, my], [mx + 1, my + 0.4], [mx + 6.4, my - 0.8]], W() * 0.85);
      line(x, [[mx - 6.4, my - 1.8], [mx - 5.6, my + 1.2]], D());
  }
}
// hair sits on the cranium ellipse (cx, cy, rx, ry); the face is to the right
function hairBack(x, sp, [cx, cy, rx, ry]) {
  const h = sp.hair, hc = h?.color || '#1a1414', hw = sp.head;
  if (hw?.type === 'hood') { shape(x, [[cx - rx * 1.25, cy + ry * 1.5], [cx - rx * 1.45, cy + ry * 0.2], [cx - rx * 1.1, cy - ry * 1.05], [cx, cy - ry * 1.35], [cx + rx * 1.05, cy - ry * 1.05], [cx + rx * 1.25, cy - ry * 0.2], [cx + rx * 0.9, cy + ry * 0.9], [cx, cy + ry * 1.55]], hw.color); return; }
  if (!h) return;
  if (h.style === 'afro' || h.style === 'curls') {
    const big = h.style === 'afro' ? 1.5 : 1.3, pts = [];
    for (let i = 0; i < 22; i++) { const a = Math.PI * 0.55 + (i / 22) * Math.PI * 1.65, k = i % 2 ? 1 : 1.1; pts.push([cx - 1 + Math.cos(a) * rx * big * k, cy - 2 + Math.sin(a) * ry * big * 0.92 * k]); }
    shape(x, pts, hc);
    const r = seeded(7);
    for (let i = 0; i < 12; i++) { const a = r() * Math.PI * 2, d = 0.35 + r() * 0.6, px = cx - 1 + Math.cos(a) * rx * big * 0.8 * d, py = cy - 2 + Math.sin(a) * ry * big * 0.7 * d, a0 = 1.2 + r() * 1.2; line(x, arcPts(px, py, 1.4 + r() * 0.6, 1.2 + r() * 0.5, a0, a0 + 2.6, 6), D() * 0.8, tint(hc, -0.25)); }
  }
  if (h.style === 'locs') for (let i = 0; i < 4; i++) limb(x, [[cx - rx * 0.5 - i * 2, cy - ry * 0.3], [cx - rx * 0.95 - i * 2.2, cy + ry * 0.9], [cx - rx * 0.85 - i * 2.4, cy + ry * 1.7 + i]], 2.6, hc, { root: false, w: 0.7 });
  if (h.style === 'mullet' || h.style === 'long' || h.style === 'pomp') shape(x, [[cx - rx * 0.4, cy - ry * 0.4], [cx - rx * 1.25, cy - ry * 0.3], [cx - rx * 1.35, cy + ry * 1.1], [cx - rx * 1.15, cy + ry * (h.style === 'mullet' ? 1.75 : 2.2)], [cx - rx * 0.85, cy + ry * 1.85], [cx - rx * 0.6, cy + ry * 0.9]], hc);
  if (hw?.type === 'durag') limb(x, [[cx - rx * 0.7, cy - ry * 0.2], [cx - rx * 1.25, cy + ry * 0.7], [cx - rx * 1.1, cy + ry * 1.4]], 3.2, hw.color, { root: false });
  if (h.style === 'bun') { oval(x, cx - rx * 0.78, cy - ry * 0.82, rx * 0.5, ry * 0.46, hc); line(x, [[cx - rx * 1.05, cy - ry * 0.9], [cx - rx * 0.75, cy - ry * 1.1], [cx - rx * 0.5, cy - ry * 0.8]], D() * 0.8, tint(hc, -0.25)); }
}
function capPts([cx, cy, rx, ry], k = 1.07, drop = 0.4) {
  return arcPts(cx, cy, rx * k, ry * k, Math.PI * 0.86, Math.PI * 1.9, 12).concat([[cx + rx * 0.6, cy - ry * drop], [cx + rx * 0.15, cy - ry * (drop + 0.12)], [cx - rx * 0.4, cy - ry * 0.05], [cx - rx * 0.78, cy + ry * 0.35]]);
}
function hairFront(x, sp, cr) {
  const [cx, cy, rx, ry] = cr;
  const h = sp.hair, hc = h?.color || '#1a1414', hw = sp.head;
  const covered = hw && ['cap', 'fitted', 'backcap', 'durag', 'beanie', 'bucket', 'hood'].includes(hw.type);
  if (h && !covered) {
    switch (h.style) {
      case 'pomp':
        shape(x, [[cx - rx * 1.05, cy + ry * 0.3], [cx - rx * 1.2, cy - ry * 0.8], [cx - rx * 0.85, cy - ry * 1.5], [cx - rx * 0.35, cy - ry * 1.62], [cx - rx * 0.05, cy - ry * 1.2], [cx + rx * 0.3, cy - ry * 1.7], [cx + rx * 0.85, cy - ry * 1.55], [cx + rx * 1, cy - ry * 1], [cx + rx * 0.7, cy - ry * 0.65], [cx + rx * 0.1, cy - ry * 0.7], [cx - rx * 0.45, cy - ry * 0.2], [cx - rx * 0.8, cy + ry * 0.5]], hc);
        line(x, [[cx - rx * 0.75, cy - ry * 1.35], [cx - rx * 0.4, cy - ry * 1.45]], D() * 0.8, tint(hc, 0.4)); line(x, [[cx + rx * 0.35, cy - ry * 1.5], [cx + rx * 0.72, cy - ry * 1.45]], D() * 0.8, tint(hc, 0.4));
        break;
      case 'bun': case 'fade': case 'long': case 'mullet': case 'cornrows': case 'locs':
        shape(x, capPts(cr, 1.06, h.style === 'fade' ? 0.48 : 0.4), hc);
        if (h.style === 'cornrows') for (let i = 0; i < 4; i++) line(x, [[cx + rx * (0.5 - i * 0.35), cy - ry * (0.62 - i * 0.05)], [cx - rx * (0.2 + i * 0.25), cy - ry * (1.02 - i * 0.12)]], D() * 0.8, tint(hc, 0.35));
        else for (let i = 0; i < 3; i++) line(x, [[cx + rx * (0.35 - i * 0.36), cy - ry * 0.95], [cx + rx * (0.12 - i * 0.36), cy - ry * 0.62]], D() * 0.7, tint(hc, h.style === 'bun' ? -0.3 : 0.35));
        break;
      case 'buzz': shape(x, capPts(cr, 1.03, 0.52), hc); dots(x, Array.from({ length: 14 }, (_, i) => [cx - rx * 0.6 + (i % 5) * rx * 0.32, cy - ry * (0.7 + Math.floor(i / 5) * 0.12)]), 0.4, tint(hc, -0.3)); break;
      case 'spiky':
        shape(x, [[cx - rx * 1.05, cy + ry * 0.1], [cx - rx * 1.4, cy - ry * 0.7], [cx - rx * 0.75, cy - ry * 0.85], [cx - rx * 0.7, cy - ry * 1.65], [cx - rx * 0.15, cy - ry * 1.02], [cx + rx * 0.2, cy - ry * 1.72], [cx + rx * 0.5, cy - ry * 0.98], [cx + rx * 1.15, cy - ry * 1.3], [cx + rx * 0.85, cy - ry * 0.62], [cx + rx * 0.2, cy - ry * 0.55], [cx - rx * 0.6, cy + ry * 0.2]], hc, { poly: true });
        break;
      case 'tuft': for (let i = 0; i < 4; i++) line(x, [[cx - rx * 0.1 + i * 1.6, cy - ry * 0.98], [cx - rx * 0.3 + i * 2.6, cy - ry * 1.35], [cx - rx * 0.6 + i * 3.6, cy - ry * 1.55]], W() * 0.6); break;
      case 'curls': case 'afro': {
        const r = seeded(11);
        shape(x, capPts(cr, 1.08, 0.5), hc);
        for (let i = 0; i < 6; i++) { const a0 = 1.2 + r() * 1.2; line(x, arcPts(cx - rx * 0.6 + r() * rx * 1.3, cy - ry * (0.62 + r() * 0.36), 1.2 + r() * 0.5, 1 + r() * 0.4, a0, a0 + 2.6, 6), D() * 0.8, tint(hc, -0.25)); }
        break;
      }
    }
  }
  if (!hw) return;
  const c = hw.color || '#1d1a26', hl = tint(c, 0.22);
  switch (hw.type) {
    case 'cap': { // worn high, peak flipped up at the front, a lighter panel and a button
      const dome = shape(x, [[cx - rx * 1.05, cy - ry * 0.45], [cx - rx * 0.9, cy - ry * 1.25], [cx - rx * 0.1, cy - ry * 1.62], [cx + rx * 0.75, cy - ry * 1.32], [cx + rx * 0.95, cy - ry * 0.7], [cx, cy - ry * 0.62]], c);
      clip(x, dome, () => { x.fillStyle = hl; x.beginPath(); x.ellipse(cx - rx * 0.55, cy - ry * 1.1, rx * 0.42, ry * 0.5, -0.4, 0, Math.PI * 2); x.fill(); line(x, [[cx - rx * 0.15, cy - ry * 1.58], [cx - rx * 0.3, cy - ry * 0.9]], D() * 0.8); });
      oval(x, cx - rx * 0.12, cy - ry * 1.64, 1.3, 1, tint(c, -0.1), { w: 0.5 });
      shape(x, [[cx + rx * 0.5, cy - ry * 0.95], [cx + rx * 1.1, cy - ry * 1.36], [cx + rx * 1.62, cy - ry * 1.44], [cx + rx * 1.72, cy - ry * 1.12], [cx + rx * 0.95, cy - ry * 0.6]], tint(c, -0.15));
      if (hw.badge) shape(x, [[cx + rx * 0.2, cy - ry * 1.3], [cx + rx * 0.5, cy - ry * 1.32], [cx + rx * 0.5, cy - ry * 1.02], [cx + rx * 0.2, cy - ry * 1.0]], hw.badge, { poly: true, w: 0.5 });
      break;
    }
    case 'fitted': shape(x, capPts(cr, 1.12, 0.48), c); line(x, [[cx - rx * 0.1, cy - ry * 1.1], [cx + rx * 0.2, cy - ry * 0.6]], D() * 0.8, tint(c, -0.3)); shape(x, [[cx + rx * 0.4, cy - ry * 0.62], [cx + rx * 1.8, cy - ry * 0.48], [cx + rx * 1.72, cy - ry * 0.2], [cx + rx * 0.5, cy - ry * 0.3]], tint(c, -0.15)); if (hw.accent) oval(x, cx + rx * 0.25, cy - ry * 0.95, 1.4, 1.4, hw.accent, { w: 0.5 }); break;
    case 'backcap': shape(x, capPts(cr, 1.12, 0.46), c); shape(x, [[cx - rx * 0.7, cy - ry * 0.55], [cx - rx * 1.85, cy - ry * 0.35], [cx - rx * 1.78, cy - ry * 0.08], [cx - rx * 0.75, cy - ry * 0.2]], tint(c, -0.15)); line(x, [[cx + rx * 0.2, cy - ry * 1.05], [cx + rx * 0.45, cy - ry * 0.7]], D() * 0.7, tint(c, -0.35)); break;
    case 'durag': shape(x, capPts(cr, 1.08, 0.38), c); line(x, [[cx - rx * 0.2, cy - ry * 1.02], [cx + rx * 0.45, cy - ry * 0.55]], D() * 0.8, hl); break;
    case 'beanie': {
      shape(x, arcPts(cx, cy - ry * 0.3, rx * 1.12, ry * 1.08, Math.PI * 0.95, Math.PI * 2.05, 12), c);
      const cuff = shape(x, [[cx - rx * 1.15, cy - ry * 0.55], [cx + rx * 1.12, cy - ry * 0.62], [cx + rx * 1.1, cy - ry * 0.18], [cx - rx * 1.12, cy - ry * 0.1]], hl);
      clip(x, cuff, () => { for (let i = -3; i <= 3; i++) line(x, [[cx + i * rx * 0.3, cy - ry * 0.6], [cx + i * rx * 0.3, cy - ry * 0.12]], D() * 0.6, K, { zone: 0.5 }); });
      if (hw.accent) oval(x, cx - rx * 0.1, cy - ry * 1.42, 2.8, 2.4, hw.accent);
      break;
    }
    case 'bucket': shape(x, arcPts(cx, cy - ry * 0.5, rx * 0.95, ry * 0.88, Math.PI, Math.PI * 2, 10), c); shape(x, [[cx - rx * 1.6, cy - ry * 0.1], [cx - rx * 0.98, cy - ry * 0.56], [cx + rx * 1, cy - ry * 0.6], [cx + rx * 1.65, cy - ry * 0.1], [cx, cy - ry * 0.26]], tint(c, -0.08)); line(x, [[cx - rx * 1.2, cy - ry * 0.3], [cx, cy - ry * 0.4], [cx + rx * 1.25, cy - ry * 0.32]], D() * 0.6, tint(c, -0.35)); break;
    case 'hood': {
      const rim = sp.shadowFace ? [[cx + rx * 0.55, cy - ry * 1.18], [cx + rx * 0.05, cy - ry * 0.5], [cx - rx * 0.1, cy + ry * 0.5], [cx + rx * 0.4, cy + ry * 1.3]] : [[cx + rx * 0.25, cy - ry * 1.22], [cx - rx * 0.42, cy - ry * 0.45], [cx - rx * 0.55, cy + ry * 0.5], [cx - rx * 0.2, cy + ry * 1.3]];
      shape(x, rim.concat(arcPts(cx - 1, cy + 1, rx * 1.28, ry * 1.32, Math.PI * 0.6, Math.PI * 1.62, 12)), c);
      line(x, rim, W() * 0.9, tint(c, 0.16));
      if (!sp.shadowFace) line(x, [[rim[3][0] - 0.4, rim[3][1]], [rim[3][0], rim[3][1] + ry * 0.8]], D() * 0.9, '#e4e0ec');
      break;
    }
  }
}
function ear(x, [e0, e1], col, detail) {
  shape(x, [[e0 + 1.4, e1 - 3.4], [e0 - 1.4, e1 - 3.9], [e0 - 3.1, e1 - 1.2], [e0 - 2.6, e1 + 2.4], [e0 - 0.2, e1 + 3.9], [e0 + 1.6, e1 + 2.4]], col, { gap: [5, 0], w: 0.9 });
  if (detail) line(x, [[e0 + 0.2, e1 - 2.1], [e0 - 1.4, e1 - 0.8], [e0 - 0.8, e1 + 0.9], [e0 + 0.6, e1 + 1.5]], D() * 0.85);
}
export function drawHead(x, sp, o = {}) {
  const f = sp.face || {}, H = HEADS[f.shape || 'round'], skin = sp.skin;
  const face = sp.shadowFace ? SHADOW : skin;
  hairBack(x, sp, H.cran);
  shape(x, H.out, face);
  ear(x, H.ear, face, !sp.shadowFace);
  if (sp.shadowFace) {
    // the hood swallows the face: a black silhouette, two white eyes and a gold grill
    line(x, [[H.nose[0], H.nose[1] - 2.2], [H.nose[0] + 5, H.nose[1] - 2.6], [H.nose[0] + 7.4, H.nose[1] + 1.2]], D(), '#3a3046');
    for (const [ex, ey, rx, ry] of H.eyes) {
      if (o.blink) { line(x, [[ex - rx * 0.6, ey], [ex + rx * 0.6, ey + 0.4]], D(), '#ffffff'); continue; }
      oval(x, ex, ey, rx * 0.62, ry * 0.64, '#ffffff', { w: 0 });
      oval(x, ex + rx * 0.24, ey + 0.4, rx * 0.2, ry * 0.2, K, { w: 0 });
    }
    x.save(); x.translate(H.mouth[0], H.mouth[1]); x.scale(1.3, 1.3); x.translate(-H.mouth[0], -H.mouth[1]); L /= 1.3; mouth(x, H.mouth, { mouth: 'grin' }, o, true); L *= 1.3; x.restore();
  } else {
    const r = seeded(sp.skin.length * 13 + Math.round((f.nose || 1) * 10));
    if (f.stubble) dots(x, Array.from({ length: 30 }, () => [H.chin[0] - 9 + r() * 14, H.chin[1] - 9 + r() * 8]), 0.42, tint(skin, -0.38));
    if (f.freckles) dots(x, Array.from({ length: 9 }, () => [H.chin[0] - 5 + r() * 9, H.chin[1] - 5 + r() * 5]), 0.55, tint(skin, -0.32));
    if (f.wrinkles) { for (let i = 0; i < 3; i++) line(x, [[H.cran[0] - 3, H.cran[1] - 5 - i * 1.8], [H.cran[0] + 3, H.cran[1] - 6 - i * 1.8], [H.cran[0] + 8, H.cran[1] - 4.6 - i * 1.8]], D() * 0.8); line(x, [[H.mouth[0] - 8, H.mouth[1] - 6], [H.mouth[0] - 9.4, H.mouth[1] - 1.6], [H.mouth[0] - 7.6, H.mouth[1] + 2]], D() * 0.9); }
    if (sp.acc?.beard) {
      const hc = sp.hair?.color || '#1a1414';
      shape(x, [[H.ear[0] + 1.6, H.ear[1] + 3], [H.ear[0] + 2.4, H.ear[1] + 10], [H.chin[0] - 3, H.chin[1] + 3.6], [H.chin[0] + 4, H.chin[1] + 2], [H.mouth[0] + 6.4, H.mouth[1] + 4.6], [H.chin[0] + 1, H.chin[1] - 1.4], [H.chin[0] - 5, H.chin[1] - 1], [H.ear[0] + 4.4, H.ear[1] + 6]], hc, { w: 0.7 });
    }
    if (f.blush) { x.fillStyle = 'rgba(255,110,150,0.45)'; x.beginPath(); x.ellipse(H.mouth[0] - 6, H.mouth[1] - 5, 2.6, 1.6, 0, 0, Math.PI * 2); x.fill(); }
    mouth(x, H.mouth, f, o, false);
    if (f.mustache) shape(x, [[H.nose[0] - 3, H.nose[1] + 3], [H.nose[0] + 2, H.nose[1] + 2.2], [H.nose[0] + 6.4, H.nose[1] + 5.4], [H.nose[0] + 2, H.nose[1] + 7], [H.nose[0] - 3, H.nose[1] + 6.4], [H.nose[0] - 7, H.nose[1] + 7.4], [H.nose[0] - 8.4, H.nose[1] + 5]], sp.hair?.color || '#1a1414', { w: 0.8 });
    nose(x, H.nose, f, skin);
    eye(x, H.eyes[0], f, o, false);
    eye(x, H.eyes[1], f, o, true);
    if (f.brow) for (const [i, [ex, ey, rx, ry]] of H.eyes.entries()) {
      const inner = i ? -1 : 1, lift = { angry: -1.6, worried: 1.6, up: 0.9 }[f.brow] || 0;
      const yi = ey - ry - 1.8 - lift, yo = ey - ry - 2.2 - (f.brow === 'up' ? 0.9 : lift < 0 ? 0.8 : 0);
      line(x, [[ex - inner * rx * 0.85, yo], [ex, (yi + yo) / 2 - 0.5], [ex + inner * rx * 0.85, yi]], W() * 1.05, f.browColor || sp.hair?.color || K);
    }
    if (f.wart) oval(x, H.chin[0] + 1, H.chin[1] - 6, 1, 0.9, tint(skin, -0.12), { w: 0.4 });
    if (sp.acc?.earring) oval(x, H.ear[0], H.ear[1] + 4.6, 1.1, 1.1, GOLD, { w: 0.5 });
  }
  hairFront(x, sp, H.cran);
  const e = sp.eyes;
  if (e?.type === 'round') { for (const [ex, ey, rx, ry] of H.eyes) oval(x, ex, ey, rx + 1.2, ry + 1, 'rgba(200,240,255,0.35)', { w: 0.8 }); line(x, [[H.eyes[0][0] + H.eyes[0][2] + 0.6, H.eyes[0][1]], [H.eyes[1][0] - H.eyes[1][2] - 0.8, H.eyes[1][1]]], D()); }
  else if (e?.type === 'juliet') { const [a, b] = H.eyes; shape(x, [[a[0] - a[2] - 1.6, a[1] - 2.6], [b[0] + b[2] + 2.4, b[1] - 3.4], [b[0] + b[2] + 1.6, b[1] + 2.6], [(a[0] + b[0]) / 2, a[1] + 1.4], [a[0] - a[2], a[1] + 2.8]], e.color || '#36c8ff'); line(x, [[a[0] - 1, a[1] - 1.4], [a[0] + 2, a[1] - 1.8]], D(), '#ffffff'); }
  else if (e) { for (const [ex, ey, rx] of H.eyes) shape(x, [[ex - rx - 0.6, ey - 2.6], [ex + rx + 0.8, ey - 2.8], [ex + rx, ey + 2.6], [ex - rx, ey + 2.4]], '#16121c', { w: 0.8 }); line(x, [[H.eyes[1][0] - 1, H.eyes[1][1] - 1.2], [H.eyes[1][0] + 1.6, H.eyes[1][1] - 1.4]], D(), '#ffffff'); }
}

// ---------- hands: one silhouette each, giant sausage fingers, drawn at the wrist pointing along angle a ----------
// fingers listed index to pinky as [offset across the palm, angle, length]; together = fingers touching
function mitt(fing, thumb, together) {
  const C = [4.4, 0], fw = 2.9;
  const P = (p, v, k) => [p[0] + v[0] * k, p[1] + v[1] * k];
  const F = fing.map(([off, a, len]) => { const d = [Math.cos(a), Math.sin(a)], q = [-d[1], d[0]], B = [C[0] + 2.6 - Math.abs(off) * 0.28, off]; return { d, q, B, len, T: P(B, d, len) }; });
  const pts = [[0, 3.3], [2.6, 4.8]], lines = [];
  for (let i = F.length - 1; i >= 0; i--) {
    const g = F[i];
    if (i === F.length - 1) pts.push(P(g.B, g.q, fw * 0.5));
    pts.push(P(P(g.B, g.d, g.len * 0.6), g.q, fw * 0.5), P(g.T, g.q, fw * 0.42), P(g.T, g.d, fw * 0.55), P(g.T, g.q, -fw * 0.42), P(P(g.B, g.d, g.len * 0.6), g.q, -fw * 0.5));
    if (i > 0) {
      const h = F[i - 1], m = lerp(P(g.B, g.q, -fw * 0.5), P(h.B, h.q, fw * 0.5), 0.5), dd = lerp(g.d, h.d, 0.5);
      if (together) { const v = P(m, dd, Math.min(g.len, h.len) * 0.62); pts.push(v); lines.push([v, P(m, dd, Math.min(g.len, h.len) * 0.3), P(m, dd, 0.2)]); }
      else pts.push(P(m, dd, 0.5));
    }
  }
  const g = F[0], [ta, tl] = thumb, td = [Math.cos(ta), Math.sin(ta)], tq = [-td[1], td[0]];
  const TB = [C[0] - 0.6, -2.8], TT = P(TB, td, tl);
  pts.push(P(g.B, g.q, -fw * 0.5), lerp(P(g.B, g.q, -fw * 0.5), P(TB, td, tl * 0.35), 0.5));
  pts.push(P(P(TB, td, tl * 0.55), tq, 1.6), P(TT, tq, 1.35), P(TT, td, 1.7), P(TT, tq, -1.35), P(P(TB, td, tl * 0.35), tq, -1.8), [1.4, -4.6], [0, -3.4]);
  return { pts, lines, crease: [lerp(P(g.B, g.q, -fw * 0.5), P(TB, td, tl * 0.35), 0.5), [C[0] - 0.8, -0.4], [C[0] - 0.4, 2.6]] };
}
const MITTS = {
  open: [[[-3.9, -0.62, 6.2], [-1.3, -0.2, 7.2], [1.3, 0.18, 6.9], [3.7, 0.52, 5.6]], [-1.35, 5.8], false],
  palmup: [[[-4, -0.1, 6.6], [-1.35, -0.03, 7.4], [1.3, 0.04, 7], [3.8, 0.12, 5.8]], [-0.75, 5.2], true],
  hang: [[[-3.9, -0.04, 6], [-1.3, 0, 6.8], [1.3, 0.06, 6.4], [3.7, 0.14, 5.2]], [-0.55, 4.6], true],
  flat: [[[-3.9, -0.08, 6.4], [-1.3, -0.02, 7.2], [1.3, 0.04, 6.8], [3.7, 0.1, 5.6]], [-0.7, 4.8], true],
};
function fist(x, skin, w = 9.4) {
  shape(x, [[0, 3.6], [2.6, 5.2], [w - 1.6, 5.3], [w + 0.9, 4.2], [w + 0.3, 2.2], [w + 1.3, 1.1], [w + 0.3, 0], [w + 1.3, -1.1], [w + 0.3, -2.2], [w + 1, -3.6], [w - 1.4, -5.2], [2.6, -5.1], [0, -3.6]], skin, { gap: [12, 0] });
  for (const v of [2.2, 0, -2.2]) line(x, [[w + 0.4, v], [w - 1.4, v + 0.1], [w - 3.2, v + 0.4]], D() * 0.9);
}
function hand(x, wx, wy, a, skin, kind, flip = 1, held) {
  const keep = L, HS = 1.55;
  x.save(); x.translate(wx, wy); x.rotate(a); x.scale(HS, HS * flip);
  L = keep / HS;
  if (kind === 'hold' && held) {
    x.save(); x.rotate(-a);
    if (held === 'can') { const can = shape(x, [[1.6, -9], [10.4, -9], [10.4, 6], [1.6, 6]], '#e8202a', { poly: true }); clip(x, can, () => { x.fillStyle = '#ffffff'; x.beginPath(); x.moveTo(1, -2); x.bezierCurveTo(4, -5, 7, 1, 11, -2.4); x.lineTo(11, -0.6); x.bezierCurveTo(7, 2.6, 4, -3.4, 1, -0.2); x.fill(); }); shape(x, [[1.6, -9], [10.4, -9], [10.4, -7], [1.6, -7]], '#c6c2d4', { poly: true, w: 0.7 }); shape(x, [[4.6, -11.6], [7, -11.6], [7, -9], [4.6, -9]], '#c6c2d4', { poly: true, w: 0.6 }); }
    if (held === 'phone') { shape(x, [[2.4, -10.6], [8.8, -10.6], [8.8, 0.4], [2.4, 0.4]], '#2a2633', { poly: true }); x.fillStyle = '#7fe0ff'; x.fillRect(3.4, -9.4, 4.4, 7.4); }
    x.restore();
  }
  if (MITTS[kind]) {
    const { pts, lines, crease } = mitt(...MITTS[kind]);
    shape(x, pts, skin, { gap: [pts.length - 1, 0] });
    for (const l of lines) line(x, l, D() * 0.9);
    if (kind === 'open' || kind === 'palmup') line(x, crease, D() * 0.8);
  } else {
    fist(x, skin, kind === 'hold' ? 10.4 : 9.4);
    if (kind === 'point') shape(x, [[7.6, -5.2], [12.4, -5.6], [16.4, -5], [17.4, -3.8], [16.4, -2.6], [12, -2.6], [8.4, -2.7]], skin, { gap: [6, 0] });
    if (kind === 'thumb') shape(x, [[2.4, -4.4], [2, -8.2], [3, -11.2], [5.4, -11.4], [6.6, -8.6], [6.8, -4.6]], skin, { gap: [5, 0] });
    else shape(x, [[1.4, -4.2], [4.2, -6.1], [8.2, -5.5], [9.8, -3.9], [8.6, -2.5], [5, -2.9], [2.2, -2.3]], skin, { gap: [6, 0] });
  }
  x.restore();
  L = keep;
}

// ---------- bodies ----------
const BODY = {
  lanky: { ank: 7, knee: 28, hip: 48, sh: 70, neck: 79, tw: 15, hs: 1.22, legW: 6.4, armW: 5, belly: 0 },
  stocky: { ank: 7, knee: 17, hip: 29, sh: 51, neck: 52.5, tw: 24, hs: 1.5, legW: 8.6, armW: 6.8, belly: 2 },
  heavy: { ank: 7, knee: 20, hip: 36, sh: 60, neck: 64, tw: 23, hs: 1.28, legW: 7.6, armW: 6.2, belly: 4 },
};
function shoe(x, ax, ay, sh, skin, dim, ang = 0) {
  const type = sh.type || 'clod';
  x.save(); x.translate(ax, ay); x.rotate(ang);
  if (type === 'slides') {
    shape(x, [[-5, 3.2], [14, 3.2], [14.6, 5.4], [-5.4, 5.4]], sh.color || '#1a1a1a', { poly: true, w: 0.8 });
    shape(x, [[-4, 3.4], [-3, -1.4], [4, -1.6], [11, 0.4], [13.4, 3.4]], dim ? tint(skin, -0.08) : skin, { gap: [1, 2], w: 0.9 });
    for (let i = 0; i < 3; i++) line(x, [[9.6 + i * 1.2, 1 + i * 0.2], [10 + i * 1.2, 3]], D() * 0.7);
    shape(x, [[0.6, -1.9], [6.6, -1.9], [6.8, 3.4], [0.8, 3.4]], sh.accent || '#ffffff', { poly: true, w: 0.8 });
  } else if (type === 'boots' || type === 'timbs') {
    const c = type === 'timbs' ? '#e2a23b' : '#a8582a';
    shape(x, [[-6, 4], [-6.4, -6], [1, -7.4], [3.6, -1.6], [11, -1], [15.6, 2.4], [15, 4.4]], dim ? tint(c, -0.1) : c, { gap: [1, 2] });
    shape(x, [[-6.6, 3.2], [15.6, 3.2], [15.4, 5.8], [-6.6, 5.8]], type === 'timbs' ? '#6a3e18' : '#3a2010', { poly: true, w: 0.8 });
    for (let i = 0; i < 3; i++) line(x, [[-1 + i * 1.4, -5.6 + i * 1.8], [3 + i * 1.2, -4.6 + i * 1.8]], D() * 0.9, '#3a2010');
    shape(x, [[-6.8, -7.6], [1.8, -8.2], [1.8, -5.4], [-6.8, -5]], type === 'timbs' ? '#b8782a' : '#d84a2a', { w: 0.8 });
  } else {
    // giant rounded clod-hopper: dark with a grey shine along the toe (or a sneaker in the stock colours)
    const sneaker = type === 'sneaker';
    const c = sneaker ? sh.color || '#ffffff' : sh.color || '#22203a';
    shape(x, [[-6.4, 5], [-7, -2.4], [-4, -6.4], [2.6, -6.6], [9, -5.4], [15.4, -2.4], [17.6, 1.6], [16, 5]], dim ? tint(c, -0.1) : c, { gap: [2, 3] });
    if (!sneaker) line(x, [[-3.6, -4.2], [3, -4.6], [9.4, -3.4], [14.4, -0.8]], W() * 0.8, '#6e6a90');
    if (sneaker) {
      shape(x, [[-7, 2.8], [17.2, 2.8], [16.6, 5.8], [-6.6, 5.8]], sh.sole || '#f4f0ff', { poly: true, w: 0.8 });
      if (sh.accent) line(x, [[-3.6, 0.4], [4, -2.2], [10.4, 0.4]], W() * 0.9, sh.accent);
      for (let i = 0; i < 3; i++) line(x, [[1 + i * 1.7, -5.6 + i * 0.6], [2.6 + i * 1.7, -3.8 + i * 0.6]], D() * 0.7);
    } else line(x, [[-6.6, 3], [5, 3.4], [16.8, 3]], D() * 0.8);
  }
  x.restore();
}
function legs(x, sp, B, pose) {
  const l = sp.legs || { type: 'jeans', color: '#3a5fa8' }, skin = sp.skin, sh = sp.shoes || {};
  const pc = l.color, lw = l.type === 'baggy' ? B.legW * 1.25 : l.type === 'cargo' ? B.legW * 1.12 : B.legW;
  for (const [far, L0] of [[true, pose.farLeg], [false, pose.nearLeg]]) {
    const { hip, knee, ank, shoeAng = 0 } = L0;
    const c = far ? tint(pc, -0.12) : pc, sk = far ? tint(skin, -0.08) : skin;
    if (l.type === 'shorts') {
      limb(x, [lerp(hip, knee, 0.4), knee, ank], B.legW * 0.55, sk);
      if (sp.hairy) for (let i = 0; i < 4; i++) { const p = lerp(knee, ank, 0.2 + i * 0.18); line(x, [[p[0] - 1.2, p[1]], [p[0] + 0.4, p[1] - 1.2]], D() * 0.6); }
      if (sp.socks || l.socks) limb(x, [lerp(knee, ank, 0.55), ank], B.legW * 0.7, far ? '#e4e0ec' : l.sockColor || '#ffffff', { w: 0.8 });
      limb(x, [hip, lerp(hip, knee, 0.5)], lw * 1.25, c);
    } else {
      limb(x, [hip, knee, ank], lw, c);
      // crumpled folds at the knee and the ankle
      line(x, [[knee[0] - lw * 0.4, knee[1] - 1.4], [knee[0] + lw * 0.1, knee[1] - 0.4], [knee[0] - lw * 0.15, knee[1] + 1]], D() * 0.9);
      const f1 = lerp(knee, ank, 0.72);
      line(x, [[f1[0] - lw * 0.45, f1[1]], [f1[0] + lw * 0.05, f1[1] + 0.8]], D() * 0.8);
      if (l.type === 'track') line(x, [[hip[0] - lw * 0.36, hip[1]], [knee[0] - lw * 0.36, knee[1]], [ank[0] - lw * 0.34, ank[1]]], W() * 0.7, l.accent || '#ffffff');
      if (l.type === 'cargo') { const p = lerp(hip, knee, 0.55); shape(x, [[p[0] - 2.4, p[1] - 3], [p[0] + 2.6, p[1] - 3], [p[0] + 2.6, p[1] + 3], [p[0] - 2.4, p[1] + 3]], tint(c, -0.1), { poly: true, w: 0.6 }); }
      if (sp.socks) limb(x, [lerp(knee, ank, 0.82), ank], lw * 0.8, '#ffffff', { w: 0.8 });
    }
    shoe(x, ank[0], ank[1] + 1.2, sh, skin, far, shoeAng);
  }
}
function torsoPts(B, tw, by, puffer) {
  if (!puffer) return [[-tw * 0.46, by], [-tw * 0.5, -B.hip - 8], [-tw * 0.52, -B.sh + 4], [-tw * 0.3, -B.sh - 1], [0, -B.sh - 1.6], [tw * 0.34, -B.sh - 0.6], [tw * 0.56, -B.sh + 6], [tw * 0.56 + B.belly, -B.hip - 6], [tw * 0.48, by]];
  // quilted puffer: the sides swell between the stitch lines
  const pts = [[-tw * 0.3, -B.sh - 1], [0, -B.sh - 1.6], [tw * 0.34, -B.sh - 0.6]];
  let k = 0;
  for (let y = -B.sh + 4; y < by - 1; y += 2.5, k++) pts.push([tw * 0.54 + (k % 2 ? 1.1 : 0), y]);
  pts.push([tw * 0.48, by], [-tw * 0.46, by]);
  k = 0;
  for (let y = by - 2.5; y > -B.sh + 3; y -= 2.5, k++) pts.push([-tw * 0.52 - (k % 2 ? 0 : 1.1), y]);
  return pts;
}
function torso(x, sp, B) {
  const t = sp.top, a = t.accent || '#ffffff', c = t.color;
  const long = t.type === 'parka' || t.type === 'trench';
  const puff = t.type === 'puffer' ? 2.6 : 0, tw = B.tw + puff, by = long ? -B.hip + 14 : -B.hip + 1;
  if (sp.overalls) {
    shape(x, torsoPts(B, tw, by), sp.overalls.shirt);
    shape(x, [[-tw * 0.48, by], [-tw * 0.44, -B.sh + 12], [tw * 0.5, -B.sh + 12], [tw * 0.56 + B.belly, -B.hip - 6], [tw * 0.48, by]], c);
    for (const sx of [-tw * 0.3, tw * 0.32]) { limb(x, [[sx, -B.sh + 13], [sx * 0.9, -B.sh - 0.5]], 3, c, { w: 0.8 }); oval(x, sx, -B.sh + 13.4, 1.2, 1.2, '#2a2633', { w: 0.4 }); }
    line(x, [[-tw * 0.2, by - 4], [tw * 0.1, by - 2]], D() * 0.9);
    return;
  }
  const pts = shape(x, torsoPts(B, tw, by, !!puff), c);
  clip(x, pts, () => {
    switch (t.type) {
      case 'flannel': x.fillStyle = a; for (let y = -B.sh; y < by; y += 4) x.fillRect(-tw, y, tw * 2, 1.4); x.fillStyle = tint(a, -0.2); for (let xx = -tw; xx < tw; xx += 4) x.fillRect(xx, -B.sh, 1.2, B.sh); break;
      case 'camo': for (const [px, py, k] of [[-4, 0.25, 0], [4, 0.45, 1], [-1, 0.7, 0], [5, 0.15, 0], [-6, 0.55, 1]]) { x.fillStyle = k ? tint(a, -0.2) : a; x.beginPath(); x.ellipse(px, -B.sh + (B.sh - B.hip) * py, 4, 2.4, 0.3, 0, Math.PI * 2); x.fill(); } break;
      case 'puffer': for (let y = -B.sh + 6.5; y < by; y += 5) line(x, [[-tw, y], [0, y + 1], [tw, y]], D() * 0.9); break;
      case 'jersey': { x.save(); x.fillStyle = a; x.strokeStyle = K; x.lineWidth = D() * 0.8; x.lineJoin = 'round'; x.font = `400 9px 'Alfa Slab One', serif`; x.textAlign = 'center'; x.textBaseline = 'middle'; x.strokeText(t.num || '10', tw * 0.12, (-B.sh - B.hip) / 2 + 1); x.fillText(t.num || '10', tw * 0.12, (-B.sh - B.hip) / 2 + 1); x.restore(); x.fillStyle = a; x.fillRect(-tw * 0.5, -B.sh, 2.4, B.sh); break; }
      case 'hoodie': shape(x, [[-tw * 0.1, by - 9], [tw * 0.5, by - 9], [tw * 0.52, by - 1.6], [-tw * 0.12, by - 1.6]], tint(c, -0.1), { w: 0.6 }); x.fillStyle = tint(c, -0.12); x.fillRect(-tw, by - 2.2, tw * 2, 2.4); line(x, [[-tw, by - 2.2], [tw, by - 2.2]], D() * 0.8); break;
      case 'track': case 'jacket': line(x, [[tw * 0.16, -B.sh], [tw * 0.2, by]], W() * 0.6, t.type === 'track' ? '#f0ecf8' : a); x.fillStyle = t.type === 'track' ? tint(c, -0.15) : a; x.fillRect(-tw, by - 2.4, tw * 2, 2.6); line(x, [[-tw, by - 2.4], [tw, by - 2.4]], D() * 0.8); break;
      case 'parka': case 'trench': line(x, [[tw * 0.16, -B.sh], [tw * 0.22, by]], D()); shape(x, [[tw * 0.24, by - 12], [tw * 0.5, by - 12], [tw * 0.5, by - 7], [tw * 0.24, by - 7]], tint(c, -0.1), { poly: true, w: 0.6 }); break;
      case 'polo': line(x, [[tw * 0.14, -B.sh], [tw * 0.15, -B.sh + 7]], D() * 0.9); if (t.logo) oval(x, tw * 0.32, -B.sh + 6, 1.3, 1, t.logo, { w: 0.4 }); break;
      case 'tee': case 'tank': if (t.logo !== false) oval(x, tw * 0.1, -B.sh + 9, 3, 2.6, a, { w: 0.6 }); line(x, [[-tw * 0.4, by - 5], [-tw * 0.2, by - 3]], D() * 0.8); break;
    }
  });
}
// collars and anything worn over the chest go on after the neck, so the neck grows out of the collar
function collar(x, sp, B) {
  const t = sp.top, a = t.accent || '#ffffff', c = t.color;
  const tw = B.tw + (t.type === 'puffer' ? 2.6 : 0);
  if (sp.overalls) return;
  if (t.type === 'hoodie' || t.type === 'camo') { if (sp.head?.type !== 'hood') shape(x, [[-tw * 0.4, -B.sh + 1], [-tw * 0.22, -B.sh - 4.4], [tw * 0.24, -B.sh - 4], [tw * 0.3, -B.sh], [0, -B.sh + 1.6]], tint(c, -0.12), { w: 0.85 }); line(x, [[tw * 0.1, -B.sh + 1], [tw * 0.12, -B.sh + 8]], D() * 0.9, '#f0ecf8'); line(x, [[tw * 0.28, -B.sh + 1], [tw * 0.3, -B.sh + 8]], D() * 0.9, '#f0ecf8'); }
  else if (t.type === 'polo' || t.type === 'flannel') { const cc = t.type === 'polo' ? a : tint(a, 0.1); shape(x, [[-tw * 0.15, -B.sh - 1.4], [tw * 0.15, -B.sh + 2.6], [tw * 0.02, -B.sh + 4.6], [-tw * 0.3, -B.sh]], cc, { poly: true, w: 0.8 }); shape(x, [[tw * 0.36, -B.sh - 0.6], [tw * 0.15, -B.sh + 2.6], [tw * 0.3, -B.sh + 4.4], [tw * 0.52, -B.sh + 1]], cc, { poly: true, w: 0.8 }); }
  else if (t.type === 'puffer') shape(x, [[-tw * 0.36, -B.sh + 1], [-tw * 0.3, -B.sh - 4.4], [tw * 0.3, -B.sh - 4.4], [tw * 0.4, -B.sh + 1]], c, { w: 0.9 });
  else if (t.type === 'track' || t.type === 'jacket') shape(x, [[-tw * 0.28, -B.sh - 3.4], [tw * 0.3, -B.sh - 3.2], [tw * 0.32, -B.sh + 0.4], [-tw * 0.26, -B.sh + 0.6]], t.type === 'track' ? c : a, { w: 0.8 });
  else if (t.type === 'parka') shape(x, arcPts(0, -B.sh - 1.4, tw * 0.42, 3, Math.PI, Math.PI * 2, 10).concat([[tw * 0.3, -B.sh + 1.2], [-tw * 0.3, -B.sh + 1.2]]), '#efe8d8', { w: 0.8 });
  else line(x, [[-tw * 0.2, -B.sh - 1], [tw * 0.06, -B.sh + 2.4], [tw * 0.3, -B.sh - 0.6]], W() * 0.8, t.type === 'jersey' ? a : K);
  const ac = sp.acc || {};
  if (sp.neckerchief) { shape(x, [[-tw * 0.3, -B.sh - 1], [tw * 0.3, -B.sh - 1.2], [tw * 0.12, -B.sh + 6], [-tw * 0.02, -B.sh + 6.4]], sp.neckerchief, { w: 0.9 }); oval(x, tw * 0.04, -B.sh + 1, 1.8, 1.6, sp.neckerchief, { w: 0.8 }); }
  if (ac.chain) {
    // a gold rope: inked underneath, gold on top, a medallion at the bottom
    const rope = Array.from({ length: 9 }, (_, i) => { const k = i / 8; return [-tw * 0.22 + tw * 0.54 * k, -B.sh - 1 + Math.sin(k * Math.PI) * 9]; });
    line(x, rope, L * 0.95, K, { zone: 0.6 }); line(x, rope, L * 0.45, GOLD, { zone: 0.6 });
    shape(x, [[tw * 0.06 - 2.4, -B.sh + 7.6], [tw * 0.06 + 2.4, -B.sh + 7.6], [tw * 0.06 + 2.2, -B.sh + 12.2], [tw * 0.06 - 2.2, -B.sh + 12.2]], GOLD, { w: 0.6 });
    x.save(); x.font = `400 3.6px 'Alfa Slab One', serif`; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillStyle = K; x.fillText('$', tw * 0.06, -B.sh + 10); x.restore();
  }
  if (ac.sacoche) { line(x, [[-tw * 0.3, -B.sh], [tw * 0.4, -B.hip - 4]], W() * 0.8); shape(x, [[tw * 0.18, -B.hip - 8], [tw * 0.66, -B.hip - 8], [tw * 0.66, -B.hip - 1], [tw * 0.18, -B.hip - 1]], '#1d1a22', { w: 0.8 }); }
  if (ac.bumbag) { line(x, [[-tw * 0.45, -B.hip - 4], [tw * 0.4, -B.sh + 2]], W() * 0.8); shape(x, [[-tw * 0.15, -B.sh + 4], [tw * 0.42, -B.sh + 4], [tw * 0.4, -B.sh + 10], [-tw * 0.12, -B.sh + 10]], ac.bumbag, { w: 0.8 }); }
}
// arm poses: shoulder -> elbow -> wrist, the hand shape, its angle and mirror
const ARM = {
  hang: (s, B, near) => ({ e: [s[0] + (near ? 1.6 : -1.2), s[1] + 12], w: [s[0] + (near ? 2.4 : -1.4), s[1] + 23], h: 'hang', a: Math.PI / 2, f: near ? -1 : 1 }),
  hip: (s, B) => ({ e: [-B.tw * 0.5 - 10, s[1] + 11], w: [-B.tw * 0.3, -B.hip - 4], h: 'fist', a: Math.PI * 0.8, f: -1 }),
  hold: (s, B, near) => (near ? { e: [s[0] + 2, s[1] + 12], w: [s[0] + 10, s[1] + 14], h: 'hold', a: 0, f: 1 } : { e: [s[0] + 4, s[1] + 12], w: [B.tw * 0.55 + 3, s[1] + 10], h: 'hold', a: 0, f: 1 }),
  palmup: (s, B, near) => ({ e: [s[0] + 3, s[1] + 12], w: [near ? s[0] + 15 : B.tw * 0.55 + 9, s[1] + (near ? 12 : 9)], h: 'palmup', a: -0.15, f: 1 }),
  wave: (s, B, near) => (near ? { e: [s[0] + 13, s[1] + 1], w: [s[0] + 24, s[1] - 10], h: 'open', a: -Math.PI / 4, f: -1 } : { e: [s[0] - 9, s[1] - 2], w: [s[0] - 13, s[1] - 18], h: 'open', a: -Math.PI / 2 - 0.35, f: -1 }),
  point: (s) => ({ e: [s[0] + 9, s[1] + 5], w: [s[0] + 19, s[1] + 2], h: 'point', a: -0.12, f: 1 }),
  thumb: (s) => ({ e: [s[0] + 4, s[1] + 12], w: [s[0] + 9, s[1] + 3], h: 'thumb', a: 0, f: 1 }),
  shrugfar: (s) => ({ e: [s[0] - 6, s[1] + 10], w: [s[0] - 13, s[1] + 6], h: 'palmup', a: Math.PI + 0.25, f: -1 }),
  counter: (s, B, near) => ({ e: [s[0] + (near ? 4 : 6), s[1] + 11], w: near ? [s[0] + 12, s[1] + 17] : [B.tw * 0.55 + 6, s[1] + 15], h: 'flat', a: 0.15, f: 1 }),
};
function arm(x, sp, B, sh, pose, near, swing) {
  const t = sp.top, skin = sp.skin;
  const short = ['tee', 'jersey', 'tank', 'polo'].includes(t.type);
  let P;
  if (swing != null) {
    const e = [sh[0] + Math.sin(swing) * 12, sh[1] + Math.cos(swing) * 12];
    const s2 = swing + 0.4 + Math.max(0, swing) * 0.8;
    P = { e, w: [e[0] + Math.sin(s2) * 11, e[1] + Math.cos(s2) * 11], h: 'hang', a: Math.PI / 2 - s2, f: -1 };
  } else P = ARM[pose](sh, B, near);
  const c = sp.overalls ? sp.overalls.shirt : t.color;
  const col = near ? c : tint(c, -0.12), sk = near ? skin : tint(skin, -0.08);
  const aw = t.type === 'puffer' ? B.armW * 1.4 : B.armW;
  const d = [P.w[0] - P.e[0], P.w[1] - P.e[1]], dl = Math.hypot(d[0], d[1]) || 1, n = [-d[1] / dl, d[0] / dl];
  const across = (p, k, w, colr = K) => line(x, [[p[0] - n[0] * k, p[1] - n[1] * k], [p[0] + n[0] * k, p[1] + n[1] * k]], w, colr, { zone: 0.8 });
  if (short && !sp.overalls) {
    limb(x, [sh, P.e, P.w], aw * 0.62, sk);
    if (t.type !== 'tank') {
      const m = lerp(sh, P.e, 0.62);
      limb(x, [sh, m], aw * 1.25, col);
      if (t.type === 'jersey' || t.type === 'polo') { const md = [m[0] - sh[0], m[1] - sh[1]], ml = Math.hypot(md[0], md[1]) || 1, mn = [-md[1] / ml, md[0] / ml], hp = lerp(sh, m, 0.86); line(x, [[hp[0] - mn[0] * aw * 0.62, hp[1] - mn[1] * aw * 0.62], [hp[0] + mn[0] * aw * 0.62, hp[1] + mn[1] * aw * 0.62]], W() * 0.9, t.accent || '#ffffff', { zone: 0.4 }); }
    }
    if (sp.hairy) for (let i = 0; i < 3; i++) { const p = lerp(P.e, P.w, 0.25 + i * 0.22); line(x, [[p[0] - 1, p[1]], [p[0] + 0.6, p[1] - 1]], D() * 0.6); }
  } else {
    limb(x, [sh, P.e, P.w], aw, col);
    across(lerp(P.e, P.w, 0.74), aw * 0.5, D() * 0.9);
    line(x, [lerp(sh, P.e, 0.86), lerp(P.e, P.w, 0.1)], D() * 0.8);
    if (t.type === 'track') line(x, [sh, P.e, P.w], W() * 0.55, t.accent || '#fff');
  }
  hand(x, P.w[0], P.w[1], P.a, sk, P.h, P.f, P.h === 'hold' ? sp.holds : null);
}
function neckAndHead(x, sp, B, o, hx, hy, rot = 0) {
  if (B.neck - B.sh > 2) { limb(x, [[1, -B.sh + 3], [hx - 0.4, hy - 1.5]], 4.8, sp.skin); if (sp.adam !== false) line(x, [[3.4, -B.sh - 4.6], [4.6, -B.sh - 6.2], [3.4, -B.sh - 7.6]], D() * 0.9); }
  collar(x, sp, B);
  x.save(); x.translate(hx, hy); x.rotate(rot);
  scaled(x, B.hs, () => drawHead(x, sp, o));
  x.restore();
}
// a whole standing character, three-quarter view, facing right
function stand(x, sp, o) {
  const B = BODY[sp.build || 'lanky'];
  x.save();
  if (o.squash) x.scale(1.05, 0.95);
  if (o.hop) { x.translate(0, -7); x.scale(0.96, 1.05); }
  const st = sp.stance ?? 1;
  const farLeg = { hip: [-B.tw * 0.18, -B.hip], knee: [-B.tw * 0.26 - st * 1.2, -B.knee], ank: [-B.tw * 0.3 - st * 2.2, -B.ank - 1.4] };
  const nearLeg = { hip: [B.tw * 0.2, -B.hip], knee: [B.tw * 0.24 + st * 0.6, -B.knee], ank: [B.tw * 0.22 + st, -B.ank] };
  const farSh = [-B.tw * 0.42, -B.sh + 4], nearSh = [B.tw * 0.36, -B.sh + 4];
  const farPose = o.far || 'hip', nearPose = o.near || 'hang';
  const farBehind = farPose !== 'hip';
  if (farBehind) arm(x, sp, B, farSh, farPose, false);
  legs(x, sp, B, { farLeg, nearLeg });
  torso(x, sp, B);
  if (!farBehind) arm(x, sp, B, farSh, farPose, false);
  neckAndHead(x, sp, B, o, 2 + (o.tilt || 0), -B.neck + (o.nod || 0));
  arm(x, sp, B, nearSh, nearPose, true);
  x.restore();
}
// walking, three-quarter view, facing right; ph = phase 0..2π
function walk(x, sp, ph) {
  const B = BODY[sp.build || 'lanky'];
  const thigh = B.hip - B.knee, shin = B.knee - B.ank;
  const legAt = (p, hipX) => {
    const s = Math.sin(p), c = Math.cos(p), a = 0.55 * s, bend = c > 0 ? 1.2 * c : 0.06, b = a - bend;
    const knee = [hipX + Math.sin(a) * thigh, Math.cos(a) * thigh], ank = [knee[0] + Math.sin(b) * shin, knee[1] + Math.cos(b) * shin];
    return { a, b, knee, ank };
  };
  const nl = legAt(ph, B.tw * 0.1), fl = legAt(ph + Math.PI, -B.tw * 0.1);
  const drop = Math.max(nl.ank[1], fl.ank[1]);
  const hop = 2.6 * Math.abs(Math.cos(ph)); // springy cartoon walk: the body bounces up between steps
  const hipY = -B.ank - drop - hop;
  const squash = Math.pow(Math.abs(Math.sin(ph)), 6);
  x.save();
  x.scale(1 + squash * 0.05, 1 - squash * 0.05);
  const mk = (l, hipX) => ({ hip: [hipX, hipY], knee: [l.knee[0], hipY + l.knee[1]], ank: [l.ank[0], hipY + l.ank[1]], shoeAng: Math.max(-0.45, Math.min(0.32, -l.b * 0.5)) });
  const lift = hipY + B.hip;
  const Bw = { ...B, hip: -hipY, sh: B.sh - lift, neck: B.neck - lift };
  const farSh = [-B.tw * 0.36, -Bw.sh + 4], nearSh = [B.tw * 0.3, -Bw.sh + 4];
  const sw = Math.sin(ph) * 0.9;
  arm(x, sp, Bw, farSh, null, false, sw);
  legs(x, sp, Bw, { farLeg: mk(fl, -B.tw * 0.1), nearLeg: mk(nl, B.tw * 0.1) });
  torso(x, sp, Bw);
  neckAndHead(x, sp, Bw, {}, 3 + Math.sin(ph * 2) * 0.4, -Bw.neck + Math.abs(Math.sin(ph)) * 1.2, 0.05);
  arm(x, sp, Bw, nearSh, null, true, -sw);
  x.restore();
}

// ---------- builders ----------
let frameNo = 0;
function frame(R, pen, draw) {
  const keep = L;
  L = pen;
  NS = (Math.imul(++frameNo, 2654435761) ^ 0x5bd1e995) >>> 0;
  const [c, x] = cnv(FW, FH, R);
  x.translate(OX, OY);
  draw(x);
  L = keep;
  return c;
}
export function buildWalker(sp, R, pen = 2) {
  return { frames: Array.from({ length: 8 }, (_, i) => frame(R, pen, (x) => walk(x, sp, (i / 8) * Math.PI * 2))), idle: frame(R, pen, (x) => stand(x, sp, { near: 'hang', far: 'hang' })) };
}
// how far a short build stands up on its crate so its shoulders meet a lanky one's
export const shoulderLift = (sp) => 70 - BODY[sp.build || 'lanky'].sh;
// the poses a standing character snaps between (held frames give the jumpy cartoon timing)
export function buildStander(sp, R, pen = 2) {
  const p = sp.pose || {};
  const mk = (o) => frame(R, pen, (x) => stand(x, sp, { ...p, ...o }));
  const base = { near: p.near || 'hang', far: p.far || 'hip' };
  return {
    idle: mk(base),
    bob: mk({ ...base, squash: true, nod: 1 }),
    blink: mk({ ...base, blink: true }),
    talk: mk({ ...base, near: 'palmup', talk: 1 }),
    talk2: mk({ ...base, near: 'palmup', far: 'shrugfar', talk: 2 }),
    wave: mk({ ...base, near: 'wave', talk: 1 }),
    point: mk({ ...base, near: 'point', talk: 1 }),
    thumb: mk({ ...base, near: 'thumb', talk: 2 }),
    look: mk({ ...base, look: -1, tilt: -1.2 }),
    hop: mk({ ...base, near: 'wave', hop: true, talk: 1 }),
    spec: sp,
  };
}
// just a head (and a sliver of collar) for the neighbours in the windows
export function buildHead(sp, R, pen = 2) {
  const keep = L; L = pen; NS = 99;
  const [c, x] = cnv(44, 44, R);
  x.translate(20, 42);
  shape(x, [[-12, 4], [-11, -4], [-4, -6], [6, -6], [12, -2], [12, 4]], sp.top?.color || '#ffffff');
  drawHead(x, sp, {});
  L = keep;
  return c;
}
export function buildPortrait(sp, R) {
  const keep = L; L = 1.6; NS = 77;
  const [c, x] = cnv(40, 40, R);
  x.translate(17, 37);
  shape(x, [[-14, 4], [-12, -3], [-4, -5], [8, -5], [14, -1], [14, 4]], sp.top?.color || '#ffffff');
  scaled(x, 0.95, () => drawHead(x, sp, {}));
  L = keep;
  return c;
}

// ---------- the cast list ----------
const handOnHip = { near: 'hang', far: 'hip' };
export const OWNERS = {
  'north-america': { build: 'stocky', skin: SKIN[5], face: { shape: 'jowl', lid: 0.45, nose: 1.1, noseStyle: 'bulb', mouth: 'grin', goldTooth: true, brow: 'up', bags: true }, hair: { style: 'fade', color: '#140e0a' }, head: { type: 'durag', color: '#1d1a26' }, top: { type: 'tee', color: '#ffffff', logo: false }, legs: { type: 'baggy', color: '#3a5fa8' }, shoes: { type: 'timbs' }, acc: { chain: true, beard: true }, pose: { near: 'counter', far: 'counter' } },
  canada: { build: 'lanky', skin: SKIN[4], face: { shape: 'long', lid: 0.42, nose: 1.15, noseStyle: 'sausage', mouth: 'grin', stubble: true, bags: true, brow: 'angry' }, hair: { style: 'fade', color: '#140e0a' }, head: { type: 'beanie', color: '#1d1a22' }, top: { type: 'puffer', color: '#26232e' }, legs: { type: 'track', color: '#5a5868', accent: '#5a5868' }, shoes: { type: 'sneaker', color: '#ffffff', accent: '#16121c' }, acc: { chain: true }, pose: { near: 'counter', far: 'counter' } },
  'south-america': { build: 'stocky', skin: SKIN[3], face: { shape: 'round', lid: 0.2, nose: 1.1, noseStyle: 'bulb', mouth: 'gap', brow: 'up', freckles: true }, hair: { style: 'buzz', color: '#ffe066' }, eyes: { type: 'juliet', color: '#36c8ff' }, top: { type: 'jersey', color: '#ffdf00', accent: '#009739', num: '10' }, legs: { type: 'shorts', color: '#1d3f9f' }, shoes: { type: 'slides', color: '#1a1a1a', accent: '#ffffff' }, hairy: true, acc: { chain: true }, pose: { near: 'counter', far: 'counter' } },
  europe: { build: 'lanky', skin: SKIN[2], face: { shape: 'long', lid: 0.5, nose: 1.1, noseStyle: 'hook', mouth: 'flat', brow: 'angry', bags: true }, hair: { style: 'fade', color: '#160e0a' }, top: { type: 'track', color: '#1e1c24', accent: '#ffffff' }, legs: { type: 'track', color: '#1e1c24', accent: '#ffffff' }, shoes: { type: 'sneaker', color: '#2b3caf', accent: '#36c8ff' }, acc: { sacoche: true, beard: true }, pose: { near: 'counter', far: 'counter' } },
  africa: { build: 'heavy', skin: SKIN[5], face: { shape: 'round', lid: 0.25, nose: 1.05, noseStyle: 'bulb', mouth: 'grin', brow: 'up', bags: true }, hair: { style: 'fade', color: '#120a08' }, head: { type: 'bucket', color: '#f1e8d2' }, top: { type: 'jersey', color: '#3ec25a', accent: '#ffffff', num: '9' }, legs: { type: 'cargo', color: '#57604a' }, shoes: { type: 'slides', color: '#1a1a1a', accent: '#ffffff' }, socks: true, acc: { chain: true, earring: true }, pose: { near: 'counter', far: 'counter' } },
  asia: { build: 'lanky', skin: SKIN[6], face: { shape: 'long', lid: 0.55, nose: 1, noseStyle: 'carrot', mouth: 'buck', brow: 'worried', lashes: true, bags: true }, hair: { style: 'spiky', color: '#ffe680' }, top: { type: 'camo', color: '#5e7340', accent: '#97ad62' }, legs: { type: 'cargo', color: '#1d1d24' }, shoes: { type: 'sneaker', color: '#ffffff', accent: '#e8202a' }, acc: { chain: true, earring: true }, pose: { near: 'counter', far: 'counter' } },
  oceania: { build: 'stocky', skin: SKIN[0], face: { shape: 'jowl', lid: 0.15, nose: 1.15, noseStyle: 'bulb', mouth: 'gap', brow: 'up', freckles: true, blush: true }, hair: { style: 'mullet', color: '#8a5226' }, head: { type: 'backcap', color: '#ffffff' }, top: { type: 'polo', color: '#1d3f9f', accent: '#ffffff', logo: '#2fb84a' }, legs: { type: 'shorts', color: '#1d1d24', socks: true }, shoes: { type: 'sneaker', color: '#ffd21f', accent: '#16121c' }, socks: true, hairy: true, acc: { bumbag: '#1d1d24' }, pose: { near: 'counter', far: 'counter' } },
};
export const BOOSTER = { build: 'lanky', skin: '#5a4632', shadowFace: true, face: { shape: 'long' }, head: { type: 'hood', color: '#2c2838' }, top: { type: 'hoodie', color: '#2c2838', accent: GOLD }, legs: { type: 'cargo', color: '#4a4a5c' }, shoes: { type: 'sneaker', color: '#ffffff', accent: GOLD }, acc: { chain: true }, pose: handOnHip };

const LIDS = [LID, '#d97ab8', '#a46ad0', '#8fa0e8', null];
const HAIRS = ['#140e0a', '#2a1810', '#4a2a16', '#8a5226', '#d08a2f', '#ffe066', '#c22a4a', '#7a3fd6', '#d97ab8', '#c8c2d6'];
const TOP_MAP = { hoodie: 'hoodie', tee: 'tee', jersey: 'jersey', shirt: 'flannel', jacket: 'jacket', coat: 'parka' };
const pk = (r, a) => a[Math.floor(r() * a.length)];
export function pedestrianSpec(top, pants, sneaker, r) {
  const shape = pk(r, ['long', 'jowl', 'round', 'egg']);
  const build = shape === 'jowl' ? 'stocky' : pk(r, ['lanky', 'lanky', 'heavy', 'stocky']);
  const headT = pk(r, [null, null, 'cap', 'fitted', 'durag', 'beanie', 'bucket', 'hood', 'backcap']);
  const hairS = pk(r, ['pomp', 'fade', 'curls', 'afro', 'locs', 'spiky', 'mullet', 'buzz', 'tuft', 'bun', 'cornrows']);
  return {
    build, skin: pk(r, SKIN),
    face: { shape, lid: 0.15 + r() * 0.45, lidColor: pk(r, LIDS), nose: 0.95 + r() * 0.3, noseStyle: pk(r, ['sausage', 'bulb', 'carrot', 'hook', 'bulb']), mouth: pk(r, ['grin', 'grin', 'buck', 'gap', 'frown', 'flat']), brow: pk(r, [null, 'angry', 'worried', 'up']), bags: r() > 0.45, stubble: r() > 0.6, freckles: r() > 0.8, wrinkles: r() > 0.85, mustache: r() > 0.85, wart: r() > 0.9, squint: r() > 0.88 },
    hair: { style: hairS, color: pk(r, HAIRS) },
    head: headT ? { type: headT, color: headT === 'hood' ? top.color : pk(r, ['#2448c8', '#e8202a', '#1d1a26', '#2e8a52', '#f1e8d2', '#7a3fd6', '#ff8a1f']), accent: '#ffffff' } : null,
    eyes: r() > 0.9 ? { type: 'shades' } : null,
    top: { type: TOP_MAP[top.type] || 'tee', color: top.color, accent: top.accent },
    legs: pants ? { type: 'baggy', color: pants.color } : { type: pk(r, ['jeans', 'baggy', 'track', 'cargo', 'shorts']), color: pk(r, ['#3a5fa8', '#1d1d24', '#57604a', '#5a5868', '#2448c8']), accent: '#ffffff' },
    shoes: sneaker ? { type: 'sneaker', color: sneaker.color, accent: sneaker.accent } : { type: pk(r, ['clod', 'clod', 'boots', 'timbs', 'slides']), color: pk(r, ['#22203a', '#3a2418']) },
    hairy: r() > 0.6, socks: r() > 0.85,
    holds: pk(r, ['can', 'phone', null, null]),
    pose: null,
    acc: { chain: r() > 0.72, beard: r() > 0.82, earring: r() > 0.75, sacoche: r() > 0.9 },
  };
}
// the street crowd stands around holding a can or a phone, hands on hips or hanging loose
export function crowdPose(sp, r) { return sp.holds ? { near: 'hold', far: pk(r, ['hip', 'hang']) } : { near: pk(r, ['hang', 'hang', 'hold']), far: pk(r, ['hip', 'hang']) }; }
// nosy neighbours in the windows, after the frames: the old lady, the curly-haired lady, the court regulars
export const NEIGHBOURS = [
  { skin: SKIN[0], face: { shape: 'egg', lid: 0.1, nose: 1.15, noseStyle: 'bulb', mouth: 'open', wrinkles: true, bags: true, wart: true }, hair: { style: 'bun', color: '#c8c2d6' }, eyes: { type: 'round' }, top: { color: '#3ec25a' } },
  { skin: SKIN[0], face: { shape: 'egg', lid: 0, nose: 1.05, noseStyle: 'bulb', mouth: 'grimace', look: -0.4, lashes: true }, hair: { style: 'curls', color: '#4b2a9e' }, top: { color: '#d6297d' } },
  { skin: SKIN[1], face: { shape: 'jowl', lid: 0.6, nose: 1.2, noseStyle: 'bulb', mouth: 'frown', stubble: true, bags: true, brow: 'worried' }, hair: { style: 'tuft', color: '#2a1810' }, top: { color: '#3ec25a' } },
  { skin: SKIN[3], face: { shape: 'round', lid: 0.3, nose: 1.1, noseStyle: 'carrot', mouth: 'grin', mustache: true }, hair: { style: 'afro', color: '#2a1810' }, top: { color: '#ffd21f' } },
];

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
