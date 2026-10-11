// The cast, modelled on the MAD (2010) cartoon frames: three-quarter heads, the near eye bulging past the brow under a
// magenta lid, huge sausage / potato / carrot noses hanging past the face, toothy grins tucked behind the nose,
// long necks with an Adam's apple or no neck at all, little torsos, giant sausage-finger hands, clown-size shoes
// with a rim-light. Everything is drawn facing right; flip the canvas to face left.

export const FW = 112, FH = 148;
const OX = 54, OY = 142;
export const CAST_FRAME = { w: FW, h: FH, ox: OX, oy: OY };
const K = '#16121c';
const LID = '#c25aa6', LID2 = '#9a3f8c', BAG = '#8a3a7a', MOUTH = '#3a0d18', TONGUE = '#ff6f8a', TOOTH = '#fffbea';
export const GOLD = '#ffc21a';
export const SKIN = ['#f9b9a0', '#eea585', '#d9895f', '#b8693f', '#8e4c2a', '#6a3418', '#ffd2b0'];
let L = 2.4; // contour pen in frame units: the street uses this fat pen, close-ups a finer one
const D = () => L * 0.6; // detail pen

// ---------- pen + paint ----------
function cnv(w, h, R) {
  const c = document.createElement('canvas');
  c.width = Math.ceil(w * R); c.height = Math.ceil(h * R);
  const x = c.getContext('2d');
  x.scale(R, R); x.lineJoin = 'round'; x.lineCap = 'round';
  c.uw = w; c.uh = h;
  return [c, x];
}
function cpath(x, p, closed) {
  const n = p.length, g = (i) => (closed ? p[(i + n) % n] : p[Math.max(0, Math.min(n - 1, i))]);
  x.beginPath(); x.moveTo(p[0][0], p[0][1]);
  for (let i = 0; i < (closed ? n : n - 1); i++) {
    const a = g(i - 1), b = g(i), c = g(i + 1), d = g(i + 2);
    x.bezierCurveTo(b[0] + (c[0] - a[0]) / 6, b[1] + (c[1] - a[1]) / 6, c[0] - (d[0] - b[0]) / 6, c[1] - (d[1] - b[1]) / 6, c[0], c[1]);
  }
  if (closed) x.closePath();
}
function ppath(x, p) { x.beginPath(); x.moveTo(p[0][0], p[0][1]); for (let i = 1; i < p.length; i++) x.lineTo(p[i][0], p[i][1]); x.closePath(); }
function paint(x, fill, w = L) { if (fill) { x.fillStyle = fill; x.fill(); } if (w) { x.lineWidth = w; x.strokeStyle = K; x.stroke(); } }
const S = (x, p, fill, w = L) => { cpath(x, p, true); paint(x, fill, w); };
const Pg = (x, p, fill, w = L) => { ppath(x, p); paint(x, fill, w); };
const O = (x, cx, cy, rx, ry, fill, w = L, rot = 0) => { x.beginPath(); x.ellipse(cx, cy, Math.max(0.05, rx), Math.max(0.05, ry), rot, 0, Math.PI * 2); paint(x, fill, w); };
const Ln = (x, p, w = D(), c = K) => { cpath(x, p, false); x.lineWidth = w; x.strokeStyle = c; x.stroke(); };
function Tube(x, p, width, fill) { cpath(x, p, false); x.lineWidth = width + L * 2; x.strokeStyle = K; x.stroke(); x.lineWidth = width; x.strokeStyle = fill; x.stroke(); }
function within(x, p, fn) { x.save(); cpath(x, p, true); x.clip(); fn(); x.restore(); }
function dots(x, list, r, col) { x.fillStyle = col; x.beginPath(); for (const [a, b] of list) { x.moveTo(a + r, b); x.arc(a, b, r, 0, Math.PI * 2); } x.fill(); }
export const tint = (hex, amt) => {
  const n = parseInt(hex.slice(1, 7), 16), f = (v) => Math.max(0, Math.min(255, Math.round(v + amt * 255)));
  return `#${[(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => f(v).toString(16).padStart(2, '0')).join('')}`;
};
const lerp = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
function arcPts(cx, cy, rx, ry, a0, a1, n = 10) { const o = []; for (let i = 0; i <= n; i++) { const a = a0 + ((a1 - a0) * i) / n; o.push([cx + Math.cos(a) * rx, cy + Math.sin(a) * ry]); } return o; }
function seeded(seed) { let s = seed >>> 0 || 1; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }

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

function eye(x, [ex, ey, rx, ry], f, o, near) {
  O(x, ex, ey, rx, ry, '#ffffff', L * 0.85);
  const closed = o.blink || f.squint;
  const lid = closed ? 1 : f.lid ?? 0.35;
  if (!closed) {
    const lk = o.look ?? f.look ?? 1; // +1 looks the way they face, -1 looks back
    O(x, ex + lk * rx * 0.42, ey + ry * 0.12 + (f.lookY || 0) * ry * 0.3, Math.max(0.85, rx * 0.2), Math.max(0.95, ry * 0.2), K, 0);
  }
  if (lid > 0.02) {
    const ly = ey - ry + ry * 2 * Math.min(1, lid);
    x.save();
    x.beginPath(); x.ellipse(ex, ey, rx, ry, 0, 0, Math.PI * 2); x.clip();
    x.beginPath(); x.moveTo(ex - rx - 2, ey - ry - 2); x.lineTo(ex + rx + 2, ey - ry - 2); x.lineTo(ex + rx + 2, ly);
    x.quadraticCurveTo(ex, ly + (closed ? 0 : ry * 0.5), ex - rx - 2, ly); x.closePath();
    x.fillStyle = f.lidColor || LID; x.fill();
    x.restore();
    Ln(x, [[ex - rx, ly], [ex, ly + (closed ? 0 : ry * 0.26)], [ex + rx, ly]], L * 0.8);
    if (lid > 0.3) Ln(x, [[ex - rx * 0.6, ey - ry * 0.55], [ex, ey - ry * 0.75], [ex + rx * 0.6, ey - ry * 0.55]], D(), LID2);
  }
  if (closed && f.squint) Ln(x, [[ex - rx * 0.8, ey + ry * 0.3], [ex, ey + ry * 0.75], [ex + rx * 0.8, ey + ry * 0.3]], L * 0.75);
  O(x, ex, ey, rx, ry, null, L * 0.85);
  if (f.bags) S(x, [[ex - rx * 0.85, ey + ry * 0.75], [ex, ey + ry * 1.45], [ex + rx * 0.85, ey + ry * 0.75], [ex, ey + ry * 1.05]], BAG, D());
  if (f.lashes && near) for (let i = 0; i < 3; i++) Ln(x, [[ex + rx * (0.2 + i * 0.3), ey - ry * (0.95 - i * 0.12)], [ex + rx * (0.4 + i * 0.36), ey - ry * (1.35 - i * 0.14)]], D());
}
function nose(x, [nx, ny], f, skin) {
  const n = f.nose ?? 1, col = f.noseColor || skin;
  switch (f.noseStyle || 'bulb') {
    case 'sausage': S(x, [[nx - 1, ny - 2.8], [nx + 6 * n, ny - 3.2], [nx + 11.4 * n, ny + 0.4], [nx + 14.4 * n, ny + 6 * n], [nx + 12.6 * n, ny + 10 * n], [nx + 8.4 * n, ny + 9.4 * n], [nx + 6 * n, ny + 5], [nx + 2, ny + 3], [nx - 1.4, ny + 2]], col); Ln(x, [[nx + 9 * n, ny + 8.6 * n], [nx + 10.4 * n, ny + 7 * n]]); break;
    case 'carrot': S(x, [[nx - 1, ny - 2.6], [nx + 8 * n, ny - 3.4], [nx + 15 * n, ny - 2], [nx + 17 * n, ny + 0.6], [nx + 15 * n, ny + 3.2], [nx + 8 * n, ny + 3.1], [nx - 1, ny + 2.6]], col); Ln(x, [[nx + 12 * n, ny + 2.6], [nx + 13.4 * n, ny + 1.4]]); break;
    case 'hook': S(x, [[nx - 1, ny - 4], [nx + 6 * n, ny - 5], [nx + 10.4 * n, ny - 1], [nx + 9.4 * n, ny + 4], [nx + 5 * n, ny + 5.6], [nx + 2, ny + 3.4], [nx - 1, ny + 2]], col); Ln(x, [[nx + 4 * n, ny + 4.6], [nx + 5.6 * n, ny + 3.2]]); break;
    case 'button': O(x, nx + 2, ny + 1, 2.8, 2.3, col); break;
    default: O(x, nx + 4.4 * n, ny + 1, 5.2 * n, 4.4 * n, col); Ln(x, [[nx + 2.2 * n, ny + 3.6 * n], [nx + 3.4 * n, ny + 2.2 * n]]);
  }
  Ln(x, [[nx - 0.6, ny - 2.2], [nx - 1.4, ny], [nx - 0.6, ny + 2]], D());
}
function teeth(x, x0, x1, y0, y1, n, col, gap = -1) {
  const w = (x1 - x0) / n;
  for (let i = 0; i < n; i++) { x.beginPath(); x.rect(x0 + i * w, y0, w, y1 - y0); paint(x, i === gap ? MOUTH : col, D() * 0.85); }
}
function mouth(x, [mx, my], f, o, gold) {
  const T = gold ? GOLD : TOOTH;
  const kind = o.talk === 2 ? 'oh' : o.talk ? 'open' : f.mouth || 'grin';
  const shp = {
    grin: [[mx - 6.4, my - 2.2], [mx, my - 1.2], [mx + 7.6, my - 3], [mx + 5, my + 2.6], [mx, my + 4], [mx - 4.4, my + 1.8]],
    open: [[mx - 6, my - 2.4], [mx + 1, my - 1.8], [mx + 7.6, my - 3], [mx + 6, my + 3.6], [mx + 0.6, my + 6.6], [mx - 4.6, my + 3]],
    grimace: [[mx - 5, my - 1.8], [mx + 6.4, my - 2.4], [mx + 6.6, my + 2.6], [mx - 4.6, my + 2.8]],
  };
  switch (kind) {
    case 'grin': case 'gap': {
      S(x, shp.grin, MOUTH);
      within(x, shp.grin, () => { teeth(x, mx - 7, mx + 8, my - 4, my + 2.4, 6, T, kind === 'gap' || f.gap ? 3 : -1); if (f.goldTooth) { x.beginPath(); x.rect(mx - 2, my - 4, 2.5, 5.6); paint(x, GOLD, D() * 0.85); } });
      S(x, shp.grin, null);
      Ln(x, [[mx - 7.4, my - 3.6], [mx - 7.2, my - 1.2], [mx - 5.8, my]]);
      break;
    }
    case 'open': {
      S(x, shp.open, MOUTH);
      within(x, shp.open, () => { teeth(x, mx - 7, mx + 8, my - 4, my + 0.4, 5, T); O(x, mx + 1.6, my + 5.4, 4, 2.6, TONGUE, D()); if (gold) teeth(x, mx - 6, mx + 7, my + 3.4, my + 7, 5, T); });
      S(x, shp.open, null);
      if (gold) { x.save(); x.translate(mx - 1.6, my - 2.2); x.rotate(Math.PI / 4); x.fillStyle = '#ffffff'; x.fillRect(-0.8, -0.8, 1.6, 1.6); x.restore(); }
      break;
    }
    case 'oh': O(x, mx + 1.4, my + 1, 3.4, 3.8, MOUTH); within(x, arcPts(mx + 1.4, my + 1, 3.4, 3.8, 0, Math.PI * 2, 16), () => { teeth(x, mx - 2.4, mx + 5.2, my - 3, my - 0.6, 3, T); O(x, mx + 1.6, my + 3.8, 2.4, 1.4, TONGUE, 0); }); O(x, mx + 1.4, my + 1, 3.4, 3.8, null); break;
    case 'grimace': S(x, shp.grimace, TOOTH); Ln(x, [[mx - 4.8, my + 0.4], [mx + 6.4, my]], D()); for (let i = -3; i <= 5; i += 2) Ln(x, [[mx + i, my - 2], [mx + i, my + 2.6]], D()); break;
    case 'buck': Ln(x, [[mx - 6, my - 2], [mx, my + 0.4], [mx + 7, my - 2]], L * 0.85); x.beginPath(); x.rect(mx - 1.4, my - 0.2, 2.8, 4); paint(x, T, D()); x.beginPath(); x.rect(mx + 1.4, my - 0.4, 2.8, 4.2); paint(x, T, D()); break;
    case 'lips': S(x, [[mx - 4, my - 0.6], [mx - 1, my - 2.6], [mx + 1, my - 1.6], [mx + 3.4, my - 2.6], [mx + 6, my - 0.4], [mx + 1, my + 3]], '#c8287a'); Ln(x, [[mx - 3.6, my - 0.4], [mx + 5.6, my - 0.4]], D()); break;
    case 'frown': Ln(x, [[mx - 5.6, my + 1.6], [mx + 1, my - 1.2], [mx + 7, my + 1]], L * 0.85); x.beginPath(); x.rect(mx - 0.8, my - 1, 2.4, 2.6); paint(x, T, D()); break;
    default: Ln(x, [[mx - 5.4, my], [mx + 6.4, my - 0.8]], L * 0.85); Ln(x, [[mx - 6, my - 1.6], [mx - 5.2, my + 1.2]], D());
  }
}
// hair sits on the cranium ellipse (cx, cy, rx, ry); the face is to the right
function hairBack(x, sp, [cx, cy, rx, ry]) {
  const h = sp.hair, hc = h?.color || '#1a1414', hw = sp.head;
  if (hw?.type === 'hood') { S(x, [[cx - rx * 1.25, cy + ry * 1.5], [cx - rx * 1.45, cy + ry * 0.2], [cx - rx * 1.1, cy - ry * 1.05], [cx, cy - ry * 1.35], [cx + rx * 1.05, cy - ry * 1.05], [cx + rx * 1.25, cy - ry * 0.2], [cx + rx * 0.9, cy + ry * 0.9], [cx, cy + ry * 1.55]], hw.color); return; }
  if (!h) return;
  if (h.style === 'afro' || h.style === 'curls') {
    const r = seeded(7), pts = [];
    const big = h.style === 'afro' ? 1.5 : 1.3;
    for (let i = 0; i < 22; i++) { const a = Math.PI * 0.55 + (i / 22) * Math.PI * 1.65, k = i % 2 ? 1 : 1.12; pts.push([cx - 1 + Math.cos(a) * rx * big * k, cy - 2 + Math.sin(a) * ry * big * 0.92 * k]); }
    S(x, pts, hc);
    x.lineWidth = D(); x.strokeStyle = tint(hc, 0.28);
    for (let i = 0; i < 26; i++) { const a = r() * Math.PI * 2, d = 0.4 + r() * 0.75, px = cx - 1 + Math.cos(a) * rx * big * 0.8 * d, py = cy - 2 + Math.sin(a) * ry * big * 0.7 * d; x.beginPath(); x.arc(px, py, 1.1 + r() * 0.8, 0, Math.PI * 1.6); x.stroke(); }
  }
  if (h.style === 'locs') for (let i = 0; i < 4; i++) Tube(x, [[cx - rx * 0.5 - i * 2, cy - ry * 0.3], [cx - rx * 0.95 - i * 2.2, cy + ry * 0.9], [cx - rx * 0.85 - i * 2.4, cy + ry * 1.7 + i]], 2.6, hc);
  if (h.style === 'mullet' || h.style === 'long' || h.style === 'pomp') S(x, [[cx - rx * 0.4, cy - ry * 0.4], [cx - rx * 1.25, cy - ry * 0.3], [cx - rx * 1.35, cy + ry * 1.1], [cx - rx * 1.15, cy + ry * (h.style === 'mullet' ? 1.75 : 2.2)], [cx - rx * 0.85, cy + ry * 1.85], [cx - rx * 0.6, cy + ry * 0.9]], hc);
  if (hw?.type === 'durag') Tube(x, [[cx - rx * 0.7, cy - ry * 0.2], [cx - rx * 1.25, cy + ry * 0.7], [cx - rx * 1.1, cy + ry * 1.4]], 3.2, hw.color);
  if (h.style === 'bun') { O(x, cx - rx * 0.78, cy - ry * 0.82, rx * 0.5, ry * 0.46, hc); Ln(x, [[cx - rx * 1.05, cy - ry * 0.9], [cx - rx * 0.75, cy - ry * 1.1], [cx - rx * 0.5, cy - ry * 0.8]], D(), tint(hc, -0.25)); }
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
        S(x, [[cx - rx * 1.05, cy + ry * 0.3], [cx - rx * 1.2, cy - ry * 0.8], [cx - rx * 0.85, cy - ry * 1.5], [cx - rx * 0.35, cy - ry * 1.62], [cx - rx * 0.05, cy - ry * 1.2], [cx + rx * 0.3, cy - ry * 1.7], [cx + rx * 0.85, cy - ry * 1.55], [cx + rx * 1, cy - ry * 1], [cx + rx * 0.7, cy - ry * 0.65], [cx + rx * 0.1, cy - ry * 0.7], [cx - rx * 0.45, cy - ry * 0.2], [cx - rx * 0.8, cy + ry * 0.5]], hc);
        Ln(x, [[cx - rx * 0.75, cy - ry * 1.55], [cx - rx * 0.35, cy - ry * 1.65]], D(), tint(hc, 0.4)); Ln(x, [[cx + rx * 0.35, cy - ry * 1.7], [cx + rx * 0.75, cy - ry * 1.65]], D(), tint(hc, 0.4));
        break;
      case 'bun': case 'fade': case 'long': case 'mullet': case 'cornrows': case 'locs':
        S(x, capPts(cr, 1.06, h.style === 'fade' ? 0.48 : 0.4), hc);
        if (h.style === 'cornrows') for (let i = 0; i < 4; i++) Ln(x, [[cx + rx * (0.5 - i * 0.35), cy - ry * (0.62 - i * 0.05)], [cx - rx * (0.2 + i * 0.25), cy - ry * (1.02 - i * 0.12)]], D(), tint(hc, 0.35));
        else for (let i = 0; i < 4; i++) Ln(x, [[cx + rx * (0.45 - i * 0.32), cy - ry * 0.98], [cx + rx * (0.2 - i * 0.32), cy - ry * 0.6]], D(), tint(hc, h.style === 'bun' ? -0.3 : 0.35));
        break;
      case 'buzz': S(x, capPts(cr, 1.03, 0.52), hc); dots(x, Array.from({ length: 14 }, (_, i) => [cx - rx * 0.6 + (i % 5) * rx * 0.32, cy - ry * (0.7 + Math.floor(i / 5) * 0.12)]), 0.4, tint(hc, -0.3)); break;
      case 'spiky':
        Pg(x, [[cx - rx * 1.05, cy + ry * 0.1], [cx - rx * 1.4, cy - ry * 0.7], [cx - rx * 0.75, cy - ry * 0.85], [cx - rx * 0.7, cy - ry * 1.65], [cx - rx * 0.15, cy - ry * 1.02], [cx + rx * 0.2, cy - ry * 1.72], [cx + rx * 0.5, cy - ry * 0.98], [cx + rx * 1.15, cy - ry * 1.3], [cx + rx * 0.85, cy - ry * 0.62], [cx + rx * 0.2, cy - ry * 0.55], [cx - rx * 0.6, cy + ry * 0.2]], hc);
        break;
      case 'tuft': for (let i = 0; i < 4; i++) Ln(x, [[cx - rx * 0.1 + i * 1.6, cy - ry * 0.98], [cx - rx * 0.3 + i * 2.6, cy - ry * 1.35], [cx - rx * 0.6 + i * 3.6, cy - ry * 1.55]], L * 0.6); break;
      case 'curls': case 'afro': {
        const r = seeded(11);
        S(x, capPts(cr, 1.08, 0.5), hc);
        x.lineWidth = D(); x.strokeStyle = tint(hc, 0.28);
        for (let i = 0; i < 9; i++) { x.beginPath(); x.arc(cx - rx * 0.6 + r() * rx * 1.3, cy - ry * (0.62 + r() * 0.36), 1 + r() * 0.8, 0, Math.PI * 1.6); x.stroke(); }
        break;
      }
    }
  }
  if (!hw) return;
  const c = hw.color || '#1d1a26', hl = tint(c, 0.22);
  switch (hw.type) {
    case 'cap': { // worn high, peak flipped up at the front, a lighter panel and a button
      const dome = [[cx - rx * 1.05, cy - ry * 0.45], [cx - rx * 0.9, cy - ry * 1.25], [cx - rx * 0.1, cy - ry * 1.62], [cx + rx * 0.75, cy - ry * 1.32], [cx + rx * 0.95, cy - ry * 0.7], [cx, cy - ry * 0.62]];
      S(x, dome, c);
      S(x, [[cx - rx * 0.85, cy - ry * 0.7], [cx - rx * 0.72, cy - ry * 1.28], [cx - rx * 0.15, cy - ry * 1.55], [cx - rx * 0.2, cy - ry * 0.9]], hl, D());
      O(x, cx - rx * 0.12, cy - ry * 1.64, 1.6, 1.2, c, D());
      Pg(x, [[cx + rx * 0.5, cy - ry * 0.95], [cx + rx * 1.5, cy - ry * 1.5], [cx + rx * 1.7, cy - ry * 1.15], [cx + rx * 0.95, cy - ry * 0.6]], tint(c, -0.15));
      break;
    }
    case 'fitted': S(x, capPts(cr, 1.12, 0.48), c); Ln(x, [[cx - rx * 0.1, cy - ry * 1.1], [cx + rx * 0.2, cy - ry * 0.6]], D(), tint(c, -0.3)); Pg(x, [[cx + rx * 0.4, cy - ry * 0.62], [cx + rx * 1.8, cy - ry * 0.48], [cx + rx * 1.72, cy - ry * 0.2], [cx + rx * 0.5, cy - ry * 0.3]], tint(c, -0.15)); if (hw.accent) O(x, cx + rx * 0.25, cy - ry * 0.95, 1.6, 1.6, hw.accent, D()); break;
    case 'backcap': S(x, capPts(cr, 1.12, 0.46), c); Pg(x, [[cx - rx * 0.7, cy - ry * 0.55], [cx - rx * 1.85, cy - ry * 0.35], [cx - rx * 1.78, cy - ry * 0.08], [cx - rx * 0.75, cy - ry * 0.2]], tint(c, -0.15)); O(x, cx + rx * 0.4, cy - ry * 0.7, 1.4, 1, tint(c, -0.35), D()); break;
    case 'durag': S(x, capPts(cr, 1.08, 0.38), c); Ln(x, [[cx - rx * 0.2, cy - ry * 1.08], [cx + rx * 0.5, cy - ry * 0.52]], D(), hl); break;
    case 'beanie': {
      S(x, arcPts(cx, cy - ry * 0.3, rx * 1.12, ry * 1.08, Math.PI * 0.95, Math.PI * 2.05, 12), c);
      Pg(x, [[cx - rx * 1.15, cy - ry * 0.55], [cx + rx * 1.12, cy - ry * 0.62], [cx + rx * 1.1, cy - ry * 0.18], [cx - rx * 1.12, cy - ry * 0.1]], hl);
      for (let i = -3; i <= 3; i++) Ln(x, [[cx + i * rx * 0.3, cy - ry * 0.56], [cx + i * rx * 0.3, cy - ry * 0.16]], D());
      if (hw.accent) O(x, cx - rx * 0.1, cy - ry * 1.42, 3, 2.6, hw.accent);
      break;
    }
    case 'bucket': S(x, arcPts(cx, cy - ry * 0.5, rx * 0.95, ry * 0.88, Math.PI, Math.PI * 2, 10), c); Pg(x, [[cx - rx * 1.6, cy - ry * 0.1], [cx - rx * 0.98, cy - ry * 0.56], [cx + rx * 1, cy - ry * 0.6], [cx + rx * 1.65, cy - ry * 0.1], [cx, cy - ry * 0.26]], tint(c, -0.08)); Ln(x, [[cx - rx * 1.2, cy - ry * 0.28], [cx + rx * 1.25, cy - ry * 0.3]], D() * 0.8, tint(c, -0.35)); break;
    case 'hood': {
      const rim = sp.shadowFace ? [[cx + rx * 0.55, cy - ry * 1.18], [cx + rx * 0.05, cy - ry * 0.5], [cx - rx * 0.1, cy + ry * 0.5], [cx + rx * 0.4, cy + ry * 1.3]] : [[cx + rx * 0.25, cy - ry * 1.22], [cx - rx * 0.42, cy - ry * 0.45], [cx - rx * 0.55, cy + ry * 0.5], [cx - rx * 0.2, cy + ry * 1.3]];
      S(x, rim.concat(arcPts(cx - 1, cy + 1, rx * 1.28, ry * 1.32, Math.PI * 0.6, Math.PI * 1.62, 12)), c);
      Ln(x, rim, L * 0.9, tint(c, 0.16)); Ln(x, rim, L * 0.4, K);
      if (!sp.shadowFace) Ln(x, [[rim[3][0] - 0.4, rim[3][1]], [rim[3][0], rim[3][1] + ry * 0.8]], D(), '#e4e0ec');
      break;
    }
  }
}
export function drawHead(x, sp, o = {}) {
  const f = sp.face || {}, H = HEADS[f.shape || 'round'], skin = sp.skin;
  const face = sp.shadowFace ? '#0e0b14' : skin;
  hairBack(x, sp, H.cran);
  S(x, H.out, face);
  // ear on the far side
  O(x, H.ear[0], H.ear[1], 2.6, 3.6, face, L * 0.85);
  if (!sp.shadowFace) Ln(x, [[H.ear[0] + 0.8, H.ear[1] - 1.6], [H.ear[0] - 0.6, H.ear[1]], [H.ear[0] + 0.6, H.ear[1] + 1.8]]);
  if (sp.shadowFace) {
    // the hood swallows the face: a black silhouette, two white eyes and a gold grill
    S(x, [[H.nose[0] - 1, H.nose[1] - 2.4], [H.nose[0] + 6, H.nose[1] - 2.4], [H.nose[0] + 7.6, H.nose[1] + 1.6], [H.nose[0] + 4, H.nose[1] + 3.6], [H.nose[0] - 1, H.nose[1] + 2.4]], '#0e0b14', L * 0.6);
    for (const [ex, ey, rx, ry] of H.eyes) { O(x, ex, ey, rx * 0.6, (o.blink ? 0.2 : ry * 0.62), '#ffffff', 0); if (!o.blink) O(x, ex + rx * 0.22, ey + 0.4, rx * 0.18, ry * 0.18, K, 0); }
    Pg(x, [[H.eyes[0][0] - 4, H.eyes[0][1] - 6], [H.eyes[0][0] + 2, H.eyes[0][1] - 4.4], [H.eyes[0][0] + 2, H.eyes[0][1] - 5.4]], '#2a2433', 0);
    x.save(); x.translate(H.mouth[0], H.mouth[1]); x.scale(1.3, 1.3); x.translate(-H.mouth[0], -H.mouth[1]); mouth(x, H.mouth, { mouth: 'grin' }, o, true); x.restore();
  } else {
    // stubble, freckles, wrinkles, beard
    const r = seeded(sp.skin.length * 13 + (f.nose || 1) * 10);
    if (f.stubble) dots(x, Array.from({ length: 30 }, () => [H.chin[0] - 9 + r() * 14, H.chin[1] - 9 + r() * 8]), 0.42, tint(skin, -0.38));
    if (f.freckles) dots(x, Array.from({ length: 9 }, () => [H.chin[0] - 5 + r() * 9, H.chin[1] - 5 + r() * 5]), 0.55, tint(skin, -0.32));
    if (f.wrinkles) { for (let i = 0; i < 3; i++) Ln(x, [[H.cran[0] - 3, H.cran[1] - 5 - i * 1.8], [H.cran[0] + 3, H.cran[1] - 6 - i * 1.8], [H.cran[0] + 8, H.cran[1] - 4.6 - i * 1.8]]); Ln(x, [[H.mouth[0] - 8, H.mouth[1] - 5], [H.mouth[0] - 9, H.mouth[1] - 1], [H.mouth[0] - 7, H.mouth[1] + 2]]); }
    if (sp.acc?.beard) {
      const hc = sp.hair?.color || '#1a1414';
      S(x, [[H.ear[0] + 1.6, H.ear[1] + 3], [H.ear[0] + 2.4, H.ear[1] + 10], [H.chin[0] - 3, H.chin[1] + 3.6], [H.chin[0] + 4, H.chin[1] + 2], [H.mouth[0] + 6.4, H.mouth[1] + 4.6], [H.chin[0] + 1, H.chin[1] - 1.4], [H.chin[0] - 5, H.chin[1] - 1], [H.ear[0] + 4.4, H.ear[1] + 6]], hc, L * 0.8);
      for (let i = 0; i < 5; i++) Ln(x, [[H.chin[0] - 6 + i * 2.6, H.chin[1] - 1], [H.chin[0] - 6.4 + i * 2.6, H.chin[1] + 2]], D(), tint(hc, 0.3));
    }
    if (f.blush) O(x, H.mouth[0] - 6, H.mouth[1] - 5, 2.6, 1.6, '#ff8aa8', 0);
    mouth(x, H.mouth, f, o, false);
    if (f.mustache) S(x, [[H.nose[0] - 3, H.nose[1] + 3], [H.nose[0] + 2, H.nose[1] + 2], [H.nose[0] + 6, H.nose[1] + 5.6], [H.nose[0] + 1, H.nose[1] + 6.6], [H.nose[0] - 6, H.nose[1] + 7], [H.nose[0] - 8, H.nose[1] + 5]], sp.hair?.color || '#1a1414');
    eye(x, H.eyes[0], f, o, false);
    eye(x, H.eyes[1], f, o, true);
    if (f.brow) for (const [i, [ex, ey, rx, ry]] of H.eyes.entries()) {
      const tilt = { angry: i ? 1.6 : -1.6, worried: i ? -1.6 : 1.6, up: -1.2 }[f.brow] || 0;
      Pg(x, [[ex - rx * 0.9, ey - ry - 1.4 - tilt * (i ? -0.4 : 0.4)], [ex + rx * 0.9, ey - ry - 1.6 + tilt * (i ? -0.4 : 0.4)], [ex + rx * 0.9, ey - ry - 3 + tilt * (i ? -0.4 : 0.4)], [ex - rx * 0.9, ey - ry - 2.6 - tilt * (i ? -0.4 : 0.4)]], f.browColor || sp.hair?.color || K, D() * 0.7);
    }
    nose(x, H.nose, f, skin);
    if (f.wart) O(x, H.chin[0] + 1, H.chin[1] - 6, 1, 0.9, tint(skin, -0.12), D());
    if (sp.acc?.earring) O(x, H.ear[0], H.ear[1] + 4.6, 1.2, 1.2, GOLD, D());
  }
  hairFront(x, sp, H.cran);
  const e = sp.eyes;
  if (e?.type === 'round') { for (const [ex, ey, rx, ry] of H.eyes) O(x, ex, ey, rx + 1.2, ry + 1, 'rgba(200,240,255,0.35)', L * 0.75); Ln(x, [[H.eyes[0][0] + H.eyes[0][2], H.eyes[0][1]], [H.eyes[1][0] - H.eyes[1][2], H.eyes[1][1]]], L * 0.6); }
  else if (e?.type === 'juliet') { const [a, b] = H.eyes; S(x, [[a[0] - a[2] - 1.6, a[1] - 2.6], [b[0] + b[2] + 2.4, b[1] - 3.4], [b[0] + b[2] + 1.6, b[1] + 2.6], [(a[0] + b[0]) / 2, a[1] + 1.4], [a[0] - a[2], a[1] + 2.8]], e.color || '#36c8ff'); Ln(x, [[a[0] - 1, a[1] - 1.4], [a[0] + 2, a[1] - 1.8]], D(), '#ffffff'); }
  else if (e) { for (const [ex, ey, rx, ry] of H.eyes) S(x, [[ex - rx - 0.6, ey - 2.6], [ex + rx + 0.8, ey - 2.8], [ex + rx, ey + 2.6], [ex - rx, ey + 2.4]], '#16121c', L * 0.75); Ln(x, [[H.eyes[1][0] - 1, H.eyes[1][1] - 1.2], [H.eyes[1][0] + 1.6, H.eyes[1][1] - 1.4]], D(), '#ffffff'); }
}

// ---------- hands: giant, four sausage fingers and a thumb; drawn at the wrist, pointing along angle a ----------
function hand(x, wx, wy, a, skin, kind, flip = 1, held) {
  const keep = L, HS = 1.55;
  x.save(); x.translate(wx, wy); x.rotate(a); x.scale(HS, HS * flip);
  L = keep / HS;
  const lw = L * 0.8;
  const finger = (pts, w = 3.2) => Tube(x, pts, w, skin);
  if (kind === 'open' || kind === 'palmup') {
    const spread = kind === 'open' ? 0.4 : 0.16;
    for (let i = 0; i < 4; i++) { const ang = (i - 1.5) * spread, by = (i - 1.5) * 2.4, len = [7.6, 9.2, 8.8, 7][i]; finger([[4.6, by], [4.6 + Math.cos(ang) * len * 0.6, by + Math.sin(ang) * len * 0.6 + (kind === 'palmup' ? -0.6 : 0)], [4.6 + Math.cos(ang) * len, by + Math.sin(ang) * len + (kind === 'palmup' ? -1.6 : 0)]]); }
    finger([[2, -3], [4.4, -6.4], [7, -7.4]], 3.4);
    O(x, 3, 0, 5, 5.4, skin, lw);
    Ln(x, [[4, -2.4], [5.4, 0], [4, 2.6]], D() * 0.8);
  } else if (kind === 'hang' || kind === 'flat') {
    // relaxed: palm with four curled fingers stacked along the bottom, thumb in front
    O(x, 4, 0, 5.4, 5.6, skin, lw);
    for (let i = 0; i < 4; i++) O(x, 9 + (kind === 'flat' ? 2 : 0) - Math.abs(i - 1.5) * 0.8, -3.9 + i * 2.6, 2.6, 1.6, skin, lw * 0.85);
    finger([[2.4, -4.4], [5.4, -6.6]], 3);
  } else if (kind === 'hold') {
    // wrapped round a can or phone: stacked finger rolls across the front
    if (held === 'can') { x.save(); x.rotate(-a); x.beginPath(); x.rect(1.6, -9, 8.8, 15); paint(x, '#e8202a', lw); x.beginPath(); x.rect(1.6, -9, 8.8, 2.2); paint(x, '#c6c2d4', lw * 0.8); x.beginPath(); x.rect(4.4, -12.2, 2.6, 3.6); paint(x, '#c6c2d4', lw * 0.7); x.fillStyle = '#ffffff'; x.font = '700 4px sans-serif'; x.restore(); }
    if (held === 'phone') { x.save(); x.rotate(-a); x.beginPath(); x.rect(2.4, -10.6, 6.4, 11); paint(x, '#2a2633', lw); x.beginPath(); x.rect(3.4, -9.4, 4.4, 7.4); paint(x, '#7fe0ff', 0); x.restore(); }
    for (let i = 0; i < 4; i++) { x.beginPath(); x.ellipse(5.4, -3.6 + i * 2.5, 4.6, 1.5, 0, 0, Math.PI * 2); paint(x, skin, lw * 0.85); }
    finger([[1.6, -5], [4.4, -7.6], [6.4, -7.4]], 3);
  } else {
    // fist / point / thumbs-up / on the hip
    x.beginPath(); x.ellipse(4.2, 0, 5, 4.8, 0, 0, Math.PI * 2); paint(x, skin, lw);
    for (let i = 0; i < 3; i++) Ln(x, [[8.8, -2.4 + i * 2.4], [6, -2.2 + i * 2.4]], D() * 0.8);
    if (kind === 'point') finger([[7, -2.6], [11.4, -3], [14.6, -3.2]], 3);
    if (kind === 'thumb') finger([[3, -3.8], [2.8, -7.8], [3.2, -10]], 3.2); else finger([[1.6, -3.6], [4.8, -5], [7, -4.4]], 2.8);
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
    Pg(x, [[-5, 3.2], [14, 3.2], [14.6, 5.4], [-5.4, 5.4]], sh.color || '#1a1a1a', L * 0.8);
    S(x, [[-4, 3.2], [-3, -1.4], [4, -1.6], [11, 0.4], [13, 3.2]], dim ? tint(skin, -0.08) : skin, L * 0.8);
    for (let i = 0; i < 3; i++) Ln(x, [[9.6 + i * 1.2, 0.8 + i * 0.2], [10 + i * 1.2, 3]], D() * 0.8);
    Pg(x, [[1, -1.8], [6.4, -1.8], [6.4, 3.4], [1, 3.4]], sh.accent || '#ffffff', L * 0.8);
  } else if (type === 'boots' || type === 'timbs') {
    const c = type === 'timbs' ? '#e2a23b' : '#a8582a';
    S(x, [[-6, 5], [-6.4, -6], [1, -7.4], [3.6, -1.6], [11, -1], [15.6, 2.4], [15, 5]], dim ? tint(c, -0.1) : c);
    Pg(x, [[-6.6, 3.2], [15.6, 3.2], [15.4, 5.8], [-6.6, 5.8]], type === 'timbs' ? '#6a3e18' : '#3a2010', L * 0.8);
    for (let i = 0; i < 3; i++) Ln(x, [[-1 + i * 1.4, -5.6 + i * 1.8], [3 + i * 1.2, -4.6 + i * 1.8]], D(), '#3a2010');
    Pg(x, [[-6.6, -7.4], [1.6, -8], [1.6, -5.4], [-6.6, -5]], type === 'timbs' ? '#b8782a' : '#d84a2a', L * 0.8);
  } else {
    // giant rounded clod-hopper: dark with a grey rim-light (or a sneaker in the stock colours)
    const sneaker = type === 'sneaker';
    const c = sneaker ? sh.color || '#ffffff' : sh.color || '#22203a';
    S(x, [[-6.4, 5], [-7, -2.4], [-4, -6.4], [2.6, -6.6], [9, -5.4], [15.4, -2.4], [17.6, 1.6], [16, 5]], dim ? tint(c, -0.1) : c);
    if (!sneaker) Ln(x, [[-4.6, -4.4], [2.4, -5], [9, -3.8], [14.6, -1]], L * 0.9, '#6e6a90');
    Ln(x, [[-6.8, 3], [16.8, 3]], D());
    if (sneaker) {
      Pg(x, [[-7, 3], [17, 3], [16.4, 5.6], [-6.6, 5.6]], sh.sole || '#f4f0ff', L * 0.8);
      if (sh.accent) Ln(x, [[-3.6, 0.6], [4, -2], [10, 0.6]], L * 0.9, sh.accent);
      for (let i = 0; i < 3; i++) Ln(x, [[1 + i * 1.6, -5.8 + i * 0.6], [2.4 + i * 1.6, -4 + i * 0.6]], D() * 0.8);
    }
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
      Tube(x, [lerp(hip, knee, 0.4), knee, ank], B.legW * 0.55, sk);
      if (sp.hairy) for (let i = 0; i < 4; i++) { const p = lerp(knee, ank, 0.2 + i * 0.18); Ln(x, [[p[0] - 1.2, p[1]], [p[0] + 0.4, p[1] - 1.2]], D() * 0.7); }
      if (sp.socks || l.socks) Tube(x, [lerp(knee, ank, 0.55), ank], B.legW * 0.7, far ? '#e4e0ec' : l.sockColor || '#ffffff');
      Tube(x, [hip, lerp(hip, knee, 0.5)], lw * 1.25, c);
    } else {
      Tube(x, [hip, knee, ank], lw, c);
      // crumpled folds at the knee and the ankle, like the overalls in the garage
      Ln(x, [[knee[0] - lw * 0.4, knee[1] - 1.4], [knee[0] + lw * 0.1, knee[1] - 0.4], [knee[0] - lw * 0.2, knee[1] + 1]]);
      Ln(x, [lerp(knee, ank, 0.7).map((v, i) => v + (i ? 0 : -lw * 0.4)), lerp(knee, ank, 0.78).map((v, i) => v + (i ? 0 : lw * 0.2))]);
      if (l.type === 'track') Ln(x, [[hip[0] - lw * 0.42, hip[1]], [knee[0] - lw * 0.42, knee[1]], [ank[0] - lw * 0.4, ank[1]]], L * 0.7, l.accent || '#ffffff');
      if (l.type === 'cargo') { const p = lerp(hip, knee, 0.55); Pg(x, [[p[0] - 2.4, p[1] - 3], [p[0] + 2.6, p[1] - 3], [p[0] + 2.6, p[1] + 3], [p[0] - 2.4, p[1] + 3]], tint(c, -0.1), D()); }
      if (sp.socks) Tube(x, [lerp(knee, ank, 0.82), ank], lw * 0.8, '#ffffff');
    }
    shoe(x, ank[0], ank[1] + 1.2, sh, skin, far, shoeAng);
  }
}
function torso(x, sp, B, o) {
  const t = sp.top, a = t.accent || '#ffffff', c = t.color;
  const long = t.type === 'parka' || t.type === 'trench';
  const puff = t.type === 'puffer' ? 2.6 : 0, tw = B.tw + puff, by = long ? -B.hip + 14 : -B.hip + 1;
  const pts = [[-tw * 0.46, by], [-tw * 0.5, -B.hip - 8], [-tw * 0.52, -B.sh + 4], [-tw * 0.3, -B.sh - 1], [0, -B.sh - 1.6], [tw * 0.34, -B.sh - 0.6], [tw * 0.56, -B.sh + 6], [tw * 0.56 + B.belly, -B.hip - 6], [tw * 0.48, by]];
  if (sp.overalls) {
    S(x, pts, sp.overalls.shirt);
    const ov = [[-tw * 0.48, by], [-tw * 0.44, -B.sh + 12], [tw * 0.5, -B.sh + 12], [tw * 0.56 + B.belly, -B.hip - 6], [tw * 0.48, by]];
    S(x, ov, c);
    for (const sx of [-tw * 0.3, tw * 0.32]) { Tube(x, [[sx, -B.sh + 12], [sx * 0.9, -B.sh - 0.5]], 3, c); O(x, sx, -B.sh + 13.4, 1.3, 1.3, '#2a2633', D()); }
    Ln(x, [[-tw * 0.2, by - 4], [tw * 0.1, by - 2]]);
    return;
  }
  if (t.type === 'puffer') for (let y = -B.sh + 5; y < by; y += 5) for (const sx of [-1, 1]) O(x, sx * tw * 0.52, y, 2.2, 2.8, c, L * 0.8);
  S(x, pts, c);
  within(x, pts, () => {
    switch (t.type) {
      case 'flannel': x.fillStyle = a; for (let y = -B.sh; y < by; y += 4) x.fillRect(-tw, y, tw * 2, 1.4); x.fillStyle = tint(a, -0.2); for (let xx = -tw; xx < tw; xx += 4) x.fillRect(xx, -B.sh, 1.2, B.sh); break;
      case 'camo': for (const [px, py, k] of [[-4, 0.25, 0], [4, 0.45, 1], [-1, 0.7, 0], [5, 0.15, 0], [-6, 0.55, 1]]) O(x, px, -B.sh + (B.sh - B.hip) * py, 4, 2.4, k ? tint(a, -0.2) : a, 0); break;
      case 'puffer': for (let y = -B.sh + 6; y < by; y += 5) Ln(x, [[-tw, y], [0, y + 1], [tw, y]]); break;
      case 'jersey': { x.save(); x.fillStyle = a; x.strokeStyle = K; x.lineWidth = D(); x.font = `400 9px 'Alfa Slab One', serif`; x.textAlign = 'center'; x.textBaseline = 'middle'; x.strokeText(t.num || '10', tw * 0.12, (-B.sh - B.hip) / 2 + 1); x.fillText(t.num || '10', tw * 0.12, (-B.sh - B.hip) / 2 + 1); x.restore(); x.fillStyle = a; x.fillRect(-tw * 0.5, -B.sh, 2.4, B.sh); break; }
      case 'hoodie': S(x, [[-tw * 0.1, by - 9], [tw * 0.5, by - 9], [tw * 0.52, by - 1.6], [-tw * 0.12, by - 1.6]], tint(c, -0.12), D()); x.fillStyle = tint(c, -0.12); x.fillRect(-tw, by - 2.2, tw * 2, 2.4); break;
      case 'track': case 'jacket': Ln(x, [[tw * 0.16, -B.sh], [tw * 0.2, by]], L * 0.7, t.type === 'track' ? '#f0ecf8' : a); x.fillStyle = t.type === 'track' ? tint(c, -0.15) : a; x.fillRect(-tw, by - 2.4, tw * 2, 2.6); break;
      case 'parka': case 'trench': Ln(x, [[tw * 0.16, -B.sh], [tw * 0.22, by]], L * 0.6); S(x, [[tw * 0.24, by - 12], [tw * 0.5, by - 12], [tw * 0.5, by - 7], [tw * 0.24, by - 7]], tint(c, -0.1), D()); break;
      case 'polo': Ln(x, [[tw * 0.14, -B.sh], [tw * 0.15, -B.sh + 7]], D()); if (t.logo) O(x, tw * 0.32, -B.sh + 6, 1.4, 1.1, t.logo, D() * 0.6); break;
      case 'tee': case 'tank': if (t.logo !== false) { O(x, tw * 0.1, -B.sh + 9, 3.2, 2.8, a, D()); } Ln(x, [[-tw * 0.4, by - 5], [-tw * 0.2, by - 3]]); break;
    }
  });
  S(x, pts, null);
  // collars + fold lines at the waist
  if (t.type === 'hoodie' || t.type === 'camo') { if (sp.head?.type !== 'hood') S(x, [[-tw * 0.4, -B.sh + 1], [-tw * 0.22, -B.sh - 4.4], [tw * 0.24, -B.sh - 4], [tw * 0.3, -B.sh], [0, -B.sh + 1.6]], tint(c, -0.12), L * 0.85); Ln(x, [[tw * 0.1, -B.sh + 1], [tw * 0.12, -B.sh + 8]], D(), '#f0ecf8'); Ln(x, [[tw * 0.28, -B.sh + 1], [tw * 0.3, -B.sh + 8]], D(), '#f0ecf8'); }
  else if (t.type === 'polo' || t.type === 'flannel') { Pg(x, [[-tw * 0.15, -B.sh - 1.4], [tw * 0.15, -B.sh + 2.6], [tw * 0.02, -B.sh + 4.6], [-tw * 0.3, -B.sh]], t.type === 'polo' ? a : tint(a, 0.1), L * 0.8); Pg(x, [[tw * 0.36, -B.sh - 0.6], [tw * 0.15, -B.sh + 2.6], [tw * 0.3, -B.sh + 4.4], [tw * 0.52, -B.sh + 1]], t.type === 'polo' ? a : tint(a, 0.1), L * 0.8); }
  else if (t.type === 'puffer') { S(x, [[-tw * 0.36, -B.sh + 1], [-tw * 0.3, -B.sh - 4.4], [tw * 0.3, -B.sh - 4.4], [tw * 0.4, -B.sh + 1]], c, L * 0.9); }
  else if (t.type === 'track' || t.type === 'jacket') { Pg(x, [[-tw * 0.28, -B.sh - 3.4], [tw * 0.3, -B.sh - 3.2], [tw * 0.32, -B.sh + 0.4], [-tw * 0.26, -B.sh + 0.6]], t.type === 'track' ? c : a, L * 0.8); }
  else if (t.type === 'parka') { for (let i = -2; i <= 2; i++) O(x, i * 2.6, -B.sh - 2.6, 2, 1.8, '#efe8d8', L * 0.6); }
  else Ln(x, [[-tw * 0.2, -B.sh - 1], [tw * 0.06, -B.sh + 2.4], [tw * 0.3, -B.sh - 0.6]], L * 0.8, t.type === 'jersey' ? a : K);
  const ac = sp.acc || {};
  if (ac.chain) { for (let i = 0; i <= 9; i++) { const k = i / 9, px = -tw * 0.2 + tw * 0.52 * k, py = -B.sh - 1 + Math.sin(k * Math.PI) * 9; O(x, px, py, 0.95, 0.75, GOLD, D() * 0.6); } O(x, tw * 0.06, -B.sh + 9.6, 2.4, 2.8, GOLD, D()); x.save(); x.font = `400 3.6px 'Alfa Slab One', serif`; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillStyle = K; x.fillText('$', tw * 0.06, -B.sh + 9.8); x.restore(); }
  if (ac.sacoche) { Ln(x, [[-tw * 0.3, -B.sh], [tw * 0.4, -B.hip - 4]], L * 0.8); S(x, [[tw * 0.18, -B.hip - 8], [tw * 0.66, -B.hip - 8], [tw * 0.66, -B.hip - 1], [tw * 0.18, -B.hip - 1]], '#1d1a22', L * 0.8); }
  if (ac.bumbag) { Ln(x, [[-tw * 0.45, -B.hip - 4], [tw * 0.4, -B.sh + 2]], L * 0.8); S(x, [[-tw * 0.15, -B.sh + 4], [tw * 0.42, -B.sh + 4], [tw * 0.4, -B.sh + 10], [-tw * 0.12, -B.sh + 10]], ac.bumbag, L * 0.8); }
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
  const c = near ? t.color : tint(t.color, -0.12), sk = near ? skin : tint(skin, -0.08);
  const aw = t.type === 'puffer' ? B.armW * 1.4 : B.armW;
  if (short || t.type === 'tank') {
    Tube(x, [sh, P.e, P.w], aw * 0.62, sk);
    if (t.type !== 'tank') { const m = lerp(sh, P.e, 0.62); Tube(x, [sh, m], aw * 1.25, c); if (t.type === 'jersey' || t.type === 'polo') Tube(x, [lerp(sh, m, 0.8), m], aw * 1.25, t.accent || '#ffffff'); }
    if (sp.hairy) for (let i = 0; i < 3; i++) { const p = lerp(P.e, P.w, 0.25 + i * 0.22); Ln(x, [[p[0] - 1, p[1]], [p[0] + 0.6, p[1] - 1]], D() * 0.7); }
  } else {
    Tube(x, [sh, P.e, P.w], aw, c);
    Tube(x, [lerp(P.e, P.w, 0.78), P.w], aw * 1.12, tint(c, -0.1));
    Ln(x, [lerp(sh, P.e, 0.85), lerp(P.e, P.w, 0.12)], D());
    if (t.type === 'track') Ln(x, [sh, P.e, P.w], L * 0.6, t.accent || '#fff');
  }
  hand(x, P.w[0], P.w[1], P.a, sk, P.h, P.f, P.h === 'hold' ? sp.holds : null);
}
// a whole standing character, three-quarter view, facing right
function stand(x, sp, o) {
  const B = BODY[sp.build || 'lanky'];
  x.save();
  if (o.squash) { x.scale(1.05, 0.95); }
  if (o.hop) { x.translate(0, -7); x.scale(0.96, 1.05); }
  const st = sp.stance ?? 1;
  const farLeg = { hip: [-B.tw * 0.18, -B.hip], knee: [-B.tw * 0.26 - st * 1.2, -B.knee], ank: [-B.tw * 0.3 - st * 2.2, -B.ank - 1.4] };
  const nearLeg = { hip: [B.tw * 0.2, -B.hip], knee: [B.tw * 0.24 + st * 0.6, -B.knee], ank: [B.tw * 0.22 + st, -B.ank] };
  const farSh = [-B.tw * 0.42, -B.sh + 4], nearSh = [B.tw * 0.36, -B.sh + 4];
  const farPose = o.far || 'hip', nearPose = o.near || 'hang';
  const farBehind = farPose !== 'hip';
  if (farBehind) arm(x, sp, B, farSh, farPose, false);
  legs(x, sp, B, { farLeg, nearLeg });
  torso(x, sp, B, o);
  if (!farBehind) arm(x, sp, B, farSh, farPose, false);
  // neck: long and stringy with an Adam's apple, or none at all
  if (B.neck - B.sh > 2) { Tube(x, [[1, -B.sh - 1], [2, -B.neck]], 4.8, sp.skin); if (sp.adam !== false) Ln(x, [[3.4, -B.sh - 5], [4.6, -B.sh - 6.4], [3.4, -B.sh - 7.6]], D()); }
  x.save();
  x.translate(2 + (o.tilt || 0), -B.neck + (o.nod || 0));
  x.scale(B.hs, B.hs);
  drawHead(x, sp, o);
  x.restore();
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
  torso(x, sp, Bw, {});
  if (Bw.neck - Bw.sh > 2) Tube(x, [[1.4, -Bw.sh - 1], [2.6, -Bw.neck]], 4.8, sp.skin);
  x.save();
  x.translate(3 + Math.sin(ph * 2) * 0.4, -Bw.neck + Math.abs(Math.sin(ph)) * 1.2);
  x.scale(B.hs, B.hs);
  x.rotate(0.05);
  drawHead(x, sp, {});
  x.restore();
  arm(x, sp, Bw, nearSh, null, true, -sw);
  x.restore();
}

// ---------- builders ----------
function frame(R, pen, draw) {
  const keep = L;
  L = pen;
  const [c, x] = cnv(FW, FH, R);
  x.translate(OX, OY);
  draw(x);
  L = keep;
  return c;
}
export function buildWalker(sp, R, pen = 2.4) {
  return { frames: Array.from({ length: 8 }, (_, i) => frame(R, pen, (x) => walk(x, sp, (i / 8) * Math.PI * 2))), idle: frame(R, pen, (x) => stand(x, sp, { near: 'hang', far: 'hang' })) };
}
// how far a short build stands up on its crate so its shoulders meet a lanky one's
export const shoulderLift = (sp) => 70 - BODY[sp.build || 'lanky'].sh;
// the poses a standing character snaps between (held frames give the jumpy cartoon timing)
export function buildStander(sp, R, pen = 2.4) {
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
  const keep = L; L = pen;
  const [c, x] = cnv(44, 44, R);
  x.translate(20, 42);
  S(x, [[-12, 4], [-11, -4], [-4, -6], [6, -6], [12, -2], [12, 4]], sp.top?.color || '#ffffff');
  drawHead(x, sp, {});
  L = keep;
  return c;
}
export function buildPortrait(sp, R) {
  const keep = L; L = 1.6;
  const [c, x] = cnv(40, 40, R);
  x.translate(17, 37);
  S(x, [[-14, 4], [-12, -3], [-4, -5], [8, -5], [14, -1], [14, 4]], sp.top?.color || '#ffffff');
  x.scale(0.95, 0.95);
  drawHead(x, sp, {});
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

// ---------- animals, drawn the same way ----------
export function dogFrames(R) {
  // Melvin from the garage: a droopy brown hound lying down, head up facing left, eyes shut, tongue out,
  // long dark ears, a dotted muzzle, hair strands on top of the dome and a red collar
  return [0, 1].map((k) => {
    const keep = L; L = 1.5;
    const [c, x] = cnv(48, 32, R);
    x.translate(1, 1);
    const fur = '#c4642a', dark = '#6e2c10';
    Tube(x, [[42, 22], [45.6, 18.4 - k], [45, 15 - k]], 2.6, fur);
    S(x, [[20, 27.6], [22, 18.6 - k * 0.6], [31, 15 - k * 0.6], [41, 17.4 - k * 0.4], [44, 24], [41, 28.4]], fur);
    S(x, [[33, 16.6 - k * 0.6], [38, 17.4], [37, 21.6], [32, 20.6]], dark, L * 0.8);
    O(x, 38.6, 27.4, 4.4, 2, fur, L * 0.9);
    S(x, [[24.4, 7.6], [30, 10.6], [34, 19.4], [31, 24], [26.4, 17.6]], dark);
    O(x, 21.6, 12, 6.4, 8.4, fur);
    S(x, [[17.6, 6.6], [12.4, 10.4], [5.4, 21.4], [9, 25], [15.4, 15.4]], dark);
    S(x, [[16, 13.2], [8, 13.6], [3.4, 16.6], [3.8, 21.6], [9, 23.6], [17, 22.6], [21, 19.6]], fur);
    O(x, 4.4, 16.2, 2.8, 2.4, '#2a1408');
    dots(x, [[8.6, 19.6], [11, 21], [7, 21.6], [10.4, 18.4]], 0.6, dark);
    Ln(x, [[17.4, 9.6], [19.2, 10.6], [21, 9.6]], L * 0.75); Ln(x, [[22.4, 9.2], [24.2, 10.2], [26, 9.2]], L * 0.75);
    S(x, [[16.6, 21.6], [20.4, 20.6], [23.4, 24 + k], [21.4, 27 + k], [18.6, 25.6 + k]], TONGUE, L * 0.8);
    Ln(x, [[19, 21.6], [20.6, 24.4 + k]], L * 0.5, '#c2304e');
    Pg(x, [[23.6, 19.4], [27.6, 18], [28.6, 21.4], [24.4, 22.8]], '#e8202a', L * 0.8);
    O(x, 17, 28, 5, 2.4, fur, L * 0.9); Ln(x, [[15, 28], [15.2, 29.4]], L * 0.5); Ln(x, [[17.4, 28.2], [17.6, 29.6]], L * 0.5);
    for (const [hx, hy, tx, ty] of [[20.6, 3.8, 18, -0.4], [21.8, 3.6, 22, -1], [23, 3.8, 26, 0]]) Ln(x, [[hx, hy], [(hx + tx) / 2 + 0.4, (hy + ty) / 2 - 0.6], [tx, ty]], L * 0.55);
    L = keep;
    return c;
  });
}
export function catFrames(R) {
  return [0, 1].map((k) => {
    const keep = L; L = 1.3;
    const [c, x] = cnv(22, 18, R);
    x.translate(1, 1);
    const fur = '#6a5a8a';
    Tube(x, k ? [[4, 12], [1.4, 8], [2.4, 3.4]] : [[4, 12], [1, 13.4], [0.4, 10]], 2.4, fur);
    O(x, 8, 11.6, 5.4, 4.2, fur);
    O(x, 13.4, 7, 4.2, 3.8, fur);
    Pg(x, [[10.6, 4.6], [10.6, 0.6], [12.8, 3.6]], fur, L * 0.8); Pg(x, [[14.6, 3.6], [16.6, 0.4], [17, 4.4]], fur, L * 0.8);
    O(x, 12.4, 6.6, 2, 2.3, '#ffffff', L * 0.7); O(x, 15.6, 6.6, 2, 2.3, '#ffffff', L * 0.7);
    O(x, 13.2, 6.9, 0.6, 0.7, K, 0); O(x, 16.4, 6.9, 0.6, 0.7, K, 0);
    Pg(x, [[10.4, 5.8], [14.4, 4.6], [14.4, 5.2], [10.4, 6.6]], '#b8a8e0', 0);
    O(x, 14.4, 9.4, 1, 0.7, '#ff8aa8', L * 0.5);
    Ln(x, [[16, 9.6], [20, 8.8]], 0.5); Ln(x, [[16, 10.2], [20, 10.6]], 0.5);
    L = keep;
    return c;
  });
}
export function pigeonFrames(R) {
  const make = (mode) => {
    const keep = L; L = 1.1;
    const [c, x] = cnv(18, 15, R);
    x.translate(2, 2);
    const body = '#a8a4c4', wing = '#8a86a6';
    if (mode >= 2) {
      const up = mode === 2;
      Pg(x, up ? [[3, 5], [0.4, -1.6], [7, 4]] : [[3, 5.4], [0.6, 11], [7, 5.6]], wing, L);
      O(x, 6, 5.6, 4.8, 2.7, body);
      O(x, 10.6, 4, 2.3, 2.1, body);
      O(x, 11.2, 3.4, 1.1, 1.2, '#ffffff', L * 0.6); O(x, 11.6, 3.5, 0.45, 0.5, K, 0);
      Pg(x, [[12.6, 4], [14.6, 4.6], [12.6, 5.2]], '#f2a33a', L * 0.6);
      Pg(x, up ? [[6, 4.6], [9.4, -2.4], [9.6, 4.2]] : [[6, 6], [9.6, 12], [9.6, 6]], tint(wing, 0.06), L);
    } else {
      const peck = mode === 1;
      O(x, 5.6, 6.4, 4.6, 3.2, body);
      Pg(x, [[1.2, 5.4], [-1.4, 4.8], [-0.8, 7.8], [1.4, 7.6]], wing, L);
      O(x, 4.6, 6, 3, 2, wing, L * 0.6);
      const hx = peck ? 10.4 : 9.2, hy = peck ? 7.8 : 3;
      Tube(x, [[8, 5.4], [hx - 0.4, hy + 1.2]], 2.6, '#7a5ab0');
      O(x, hx, hy, 2.2, 2.1, body);
      O(x, hx + 0.6, hy - 0.5, 1.1, 1.2, '#ffffff', L * 0.6); O(x, hx + 0.9, hy - 0.4, 0.45, 0.5, K, 0);
      Pg(x, [[hx + 1.9, hy + 0.1], [hx + 3.8, hy + 0.8], [hx + 1.9, hy + 1.2]], '#f2a33a', L * 0.6);
      Ln(x, [[4.6, 9.6], [4.2, 11.4], [3.2, 11.6]], 0.8, '#ff7aa0'); Ln(x, [[6.6, 9.6], [6.8, 11.4], [7.8, 11.6]], 0.8, '#ff7aa0');
    }
    L = keep;
    return c;
  };
  return [make(0), make(1), make(2), make(3)];
}
