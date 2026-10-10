// MAD TV-style cartoon people: bold contour lines, detailed faces (googly eyes under shadowed lids, bags, bulb
// noses with nostrils, rows of teeth, smile lines, stubble), four-finger hands, creased clothes and huge laced shoes.
// Frames are drawn once into canvases (world units x R). Origin = between the feet.
import { K, C, layer, smooth, roundPoly, ink, rect, rrect, oval, poly, blob, line, tube, text, FONT, shade, mix, clip, ellPts, rng, pick } from './toon.js';

export const CW = 60, CH = 78;
const OX = 30, OY = 74;
export const FRAME = { w: CW, h: CH, ox: OX, oy: OY };
const OUT = 1.15; // contour
const IN = 0.6; // interior detail
const GOLD = C.gold;
const MOUTH = '#5a1020';
const curve = (ctx, pts, lw = IN, c = K) => line(ctx, pts, lw, c, true);

// ---------- hands: four sausage fingers + thumb ----------
// a = direction the fingers point, m = mirror (+1/-1) to put the thumb on the right side
function hand(ctx, x, y, a, skin, kind = 'palm', m = 1, sc = 1) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(a);
  ctx.scale(sc, sc * m);
  const lw = 0.8;
  if (kind === 'open' || kind === 'palm') {
    const spread = kind === 'open' ? 0.36 : 0.08;
    const lens = [3.4, 4.3, 4.1, 3.2];
    for (let i = 0; i < 4; i++) {
      const ang = (i - 1.5) * spread, by = (i - 1.5) * 1.2;
      tube(ctx, [[2.4, by], [2.4 + Math.cos(ang) * lens[i], by + Math.sin(ang) * lens[i]]], 1.55, skin, lw);
    }
    tube(ctx, [[1, -1.4], [2.4, -3.4], [3.8, -4]], 1.6, skin, lw);
    oval(ctx, 1.7, 0, 2.6, 2.5, skin, lw);
    curve(ctx, [[2.6, -0.9], [3.2, 0.2], [2.6, 1.2]], 0.45);
  } else {
    rrect(ctx, -0.5, -2.6, 5.2, 5.2, 2, skin, lw);
    for (let i = 0; i < 3; i++) line(ctx, [[4.7, -1.3 + i * 1.3], [3.3, -1.3 + i * 1.3]], 0.45);
    if (kind === 'point') tube(ctx, [[3.8, -1.9], [8.6, -2.3]], 1.4, skin, lw);
    if (kind === 'thumb') tube(ctx, [[1.4, -2.3], [1.2, -6]], 1.6, skin, lw);
    else tube(ctx, [[0.6, -1.9], [3.2, -2.6]], 1.4, skin, lw);
  }
  ctx.restore();
}
function brow(ctx, x0, y0, x1, y1, w, col) {
  const dx = x1 - x0, dy = y1 - y0, d = Math.hypot(dx, dy) || 1, ux = -dy / d, uy = dx / d;
  poly(ctx, [[x0 - ux * w, y0 - uy * w], [x1 - ux * w * 0.35, y1 - uy * w * 0.35], [x1 + ux * w * 0.35, y1 + uy * w * 0.35], [x0 + ux * w, y0 + uy * w]], col, IN, 0.4);
}
function speckle(ctx, cx, cy, rx, ry, col, n, a0, a1, seed, size = 0.3) {
  const r = rng(seed);
  ctx.fillStyle = col;
  ctx.beginPath();
  for (let i = 0; i < n; i++) {
    const a = a0 + r() * (a1 - a0), d = 0.5 + r() * 0.42;
    const x = cx + Math.cos(a) * rx * d, y = cy + Math.sin(a) * ry * d;
    ctx.moveTo(x + size, y);
    ctx.arc(x, y, size, 0, Math.PI * 2);
  }
  ctx.fill();
}

// ---------- heads ----------
const headShape = (f) => ({ egg: [9.2, 10.6, -0.1], long: [8.2, 11.8, 0.05], round: [10, 9.8, 0.06], pear: [9, 10.2, 0.24], bean: [9.6, 10.4, 0.12] }[f.shape || 'egg']);
function headPts(cx, cy, rx, ry, jowl, n = 28, lean = 0) {
  const pts = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2, s = Math.sin(a), c = Math.cos(a);
    pts.push([cx + c * rx * (1 + jowl * Math.max(0, s)) + lean * Math.max(0, s) * Math.max(0, c), cy + s * ry]);
  }
  return pts;
}
const noseColor = (f, skin) => f.noseColor || mix(skin, '#ff4a5a', 0.26);
// big googly eye: white, tiny pupil, eyeshadow lid with a heavy lid line, optional lashes and bags
function eye(ctx, x, y, rx, ry, f, o, px = 0, py = 0, side = 0) {
  oval(ctx, x, y, rx, ry, '#ffffff', OUT);
  const lid = o.blink ? 1 : o.wide ? 0 : f.lid ?? 0.3;
  if (lid < 0.97) oval(ctx, x + px * rx * 0.46, y + py * ry * 0.34 + ry * 0.18, 0.95 * Math.min(1.25, rx / 3), 1.1 * Math.min(1.25, ry / 4), K, 0);
  if (lid > 0.02) {
    const ly = y - ry + ry * 2 * lid, dip = o.blink ? 0 : ry * 0.22;
    clip(ctx, () => { ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); }, () => {
      ctx.beginPath();
      ctx.moveTo(x - rx - 1, y - ry - 1); ctx.lineTo(x + rx + 1, y - ry - 1); ctx.lineTo(x + rx + 1, ly);
      ctx.quadraticCurveTo(x, ly + dip * 2, x - rx - 1, ly);
      ctx.closePath();
      ctx.fillStyle = f.lidColor; ctx.fill();
      curve(ctx, [[x - rx - 1, ly], [x, ly + dip], [x + rx + 1, ly]], OUT);
    });
  }
  oval(ctx, x, y, rx, ry, null, OUT);
  if (f.lashes) for (let i = 0; i < 3; i++) { const a = -Math.PI * (0.62 + i * 0.12) * (side < 0 ? 1 : 1); const sx = side < 0 ? -1 : 1; line(ctx, [[x + sx * Math.cos(a) * rx * -1, y + Math.sin(a) * ry], [x + sx * Math.cos(a) * (rx + 1.6) * -1, y + Math.sin(a) * (ry + 1.6)]], 0.7); }
  if (f.bags) { curve(ctx, [[x - rx * 0.75, y + ry * 0.9], [x, y + ry + 1.4], [x + rx * 0.75, y + ry * 0.9]]); curve(ctx, [[x - rx * 0.45, y + ry + 1.2], [x, y + ry + 2.3], [x + rx * 0.45, y + ry + 1.2]], 0.45); }
}
function teethRow(ctx, x0, x1, y0, y1, color, n) {
  const w = (x1 - x0) / n;
  for (let i = 0; i < n; i++) rect(ctx, x0 + i * w, y0, w, y1 - y0, color, 0.45);
}
function mouthFront(ctx, x, y, f, o, w, gold) {
  const T = gold ? GOLD : '#ffffff';
  const kind = o.talk === 2 ? 'oh' : o.talk ? 'open' : f.mouth || 'flat';
  const sm = (pts) => () => smooth(ctx, pts, true);
  switch (kind) {
    case 'open': {
      const pts = [[x - w, y - 1.4], [x - w * 0.4, y - 1], [x + w * 0.4, y - 1], [x + w, y - 1.4], [x + w * 0.75, y + 2.6], [x, y + 4.2], [x - w * 0.75, y + 2.6]];
      blob(ctx, pts, MOUTH, OUT);
      clip(ctx, sm(pts), () => { teethRow(ctx, x - w, x + w, y - 2, y + 0.4, T, 6); oval(ctx, x + 0.6, y + 3.8, w * 0.48, 1.8, '#ff6f8a', IN); });
      blob(ctx, pts, null, OUT);
      if (gold && o.talk) { poly(ctx, [[x - 1.6, y - 1.1], [x - 1.1, y - 1.7], [x - 0.6, y - 1.1], [x - 1.1, y - 0.5]], '#ffffff', 0.3); }
      break;
    }
    case 'oh': {
      oval(ctx, x, y + 1.2, w * 0.42, 2.6, MOUTH, OUT);
      clip(ctx, () => { ctx.beginPath(); ctx.ellipse(x, y + 1.2, w * 0.42, 2.6, 0, 0, Math.PI * 2); }, () => { teethRow(ctx, x - w * 0.5, x + w * 0.5, y - 1.6, y - 0.4, T, 3); oval(ctx, x, y + 3.2, w * 0.3, 1.2, '#ff6f8a', 0); });
      oval(ctx, x, y + 1.2, w * 0.42, 2.6, null, OUT);
      break;
    }
    case 'grin': case 'gap': {
      const pts = [[x - w, y - 1.2], [x, y - 0.5], [x + w, y - 1.2], [x + w * 0.6, y + 2.2], [x, y + 2.9], [x - w * 0.6, y + 2.2]];
      blob(ctx, pts, MOUTH, OUT);
      clip(ctx, sm(pts), () => {
        teethRow(ctx, x - w, x + w, y - 1.8, y + 1, T, 7);
        if (f.mouth === 'gap') rect(ctx, x + w * 0.02, y - 1.8, w * 0.28, 2.8, MOUTH, 0);
        if (f.goldTooth) rect(ctx, x - w * 0.56, y - 1.8, w * 0.28, 2.8, GOLD, 0.45);
      });
      blob(ctx, pts, null, OUT);
      break;
    }
    case 'buck':
      curve(ctx, [[x - w * 0.85, y - 0.6], [x, y + 0.4], [x + w * 0.85, y - 0.6]], OUT);
      rect(ctx, x - 1.45, y + 0.1, 1.4, 2.3, T, 0.55);
      rect(ctx, x + 0.05, y + 0.1, 1.4, 2.3, T, 0.55);
      curve(ctx, [[x - w * 0.45, y + 2.4], [x, y + 3], [x + w * 0.45, y + 2.4]]);
      break;
    case 'frown': curve(ctx, [[x - w * 0.7, y + 1.4], [x, y - 0.2], [x + w * 0.7, y + 1.4]], OUT); curve(ctx, [[x - w * 0.35, y + 2.6], [x + w * 0.35, y + 2.6]]); break;
    case 'smirk': curve(ctx, [[x - w * 0.7, y + 0.4], [x + w * 0.2, y + 0.7], [x + w * 0.8, y - 0.9]], OUT); curve(ctx, [[x + w * 0.8, y - 1.6], [x + w * 0.95, y - 0.6]]); break;
    default: line(ctx, [[x - w * 0.7, y], [x + w * 0.7, y]], OUT); curve(ctx, [[x + w * 0.7, y - 0.8], [x + w * 0.78, y + 0.6]]); curve(ctx, [[x - w * 0.7, y - 0.8], [x - w * 0.78, y + 0.6]]);
  }
}

// ---------- hair + headwear (front) ----------
function capPts(cx, cy, rx, ry, drop = 0.3, k = 1.08) {
  return ellPts(cx, cy, rx * k, ry * k, Math.PI + 0.22, Math.PI * 2 - 0.22, 16).concat([[cx + rx * 0.92, cy - ry * drop], [cx + rx * 0.4, cy - ry * (drop + 0.2)], [cx, cy - ry * (drop + 0.26)], [cx - rx * 0.4, cy - ry * (drop + 0.2)], [cx - rx * 0.92, cy - ry * drop]]);
}
function strands(ctx, cx, cy, rx, ry, col, n = 5) {
  for (let i = 0; i < n; i++) { const t = (i + 0.5) / n - 0.5; curve(ctx, [[cx + t * rx * 1.4, cy - ry * 0.98], [cx + t * rx * 1.6, cy - ry * 0.74], [cx + t * rx * 1.5, cy - ry * 0.56]], 0.45, shade(col, 0.35)); }
}
function hairBackFront(ctx, sp, cx, cy, rx, ry) {
  const h = sp.hair, hc = h?.color || '#1e1612';
  if (sp.head?.type === 'hood') { blob(ctx, headPts(cx, cy + 1.4, rx * 1.4, ry * 1.27, 0.06, 22), sp.head.color, OUT); return; }
  if (!h) return;
  if (h.style === 'afro') blob(ctx, Array.from({ length: 26 }, (_, i) => { const a = (i / 26) * Math.PI * 2, b = i % 2 ? 1.04 : 1.16; return [cx + Math.cos(a) * rx * 1.44 * b, cy - 3.4 + Math.sin(a) * ry * 1.16 * b]; }), hc, OUT);
  if (h.style === 'long') poly(ctx, [[cx - rx * 1.05, cy - ry * 0.6], [cx + rx * 1.05, cy - ry * 0.6], [cx + rx * 1.24, cy + ry * 1.08], [cx + rx * 0.6, cy + ry * 0.96], [cx, cy + ry * 1.1], [cx - rx * 0.6, cy + ry * 0.96], [cx - rx * 1.24, cy + ry * 1.08]], hc, OUT, 2.4);
  if (h.style === 'mullet') poly(ctx, [[cx - rx * 0.9, cy], [cx + rx * 0.9, cy], [cx + rx * 1.18, cy + ry * 1.02], [cx + rx * 0.5, cy + ry * 0.86], [cx - rx * 0.5, cy + ry * 0.86], [cx - rx * 1.18, cy + ry * 1.02]], hc, OUT, 1.6);
  if (h.style === 'locs') for (const s of [-1, 1]) for (let i = 0; i < 3; i++) tube(ctx, [[cx + s * (rx * 0.7 + i * 1.4), cy - ry * 0.5], [cx + s * (rx * 0.98 + i * 1.5), cy + ry * 0.5], [cx + s * (rx * 0.92 + i * 1.5), cy + ry * 0.95 + i]], 1.7, hc, OUT * 0.8);
  if (sp.head?.type === 'durag') tube(ctx, [[cx + rx * 0.7, cy - ry * 0.3], [cx + rx * 1.04, cy + ry * 0.45], [cx + rx * 0.98, cy + ry * 0.9]], 2, sp.head.color, OUT);
  if (sp.head?.type === 'backcap') poly(ctx, [[cx - rx * 0.62, cy - ry * 0.96], [cx + rx * 0.62, cy - ry * 0.96], [cx + rx * 0.48, cy - ry * 1.32], [cx - rx * 0.48, cy - ry * 1.32]], shade(sp.head.color, -0.12), OUT, 1);
}
function hairFront(ctx, sp, cx, cy, rx, ry) {
  const h = sp.hair, hc = h?.color || '#1e1612', hw = sp.head;
  if (h && !(hw && ['durag', 'fitted', 'backcap', 'beanie', 'bucket', 'hood'].includes(hw.type))) {
    switch (h.style) {
      case 'fade': case 'cornrows': case 'locs': case 'long': case 'mullet': case 'bun':
        blob(ctx, capPts(cx, cy, rx, ry, 0.44), hc, OUT);
        if (h.style === 'cornrows') for (let i = -2; i <= 2; i++) line(ctx, [[cx + i * 2, cy - ry * 0.68], [cx + i * 1.7, cy - ry * 1.04]], 0.5, shade(hc, 0.35));
        else strands(ctx, cx, cy, rx, ry, hc, 4);
        if (h.style === 'bun') { oval(ctx, cx, cy - ry * 1.2, 3.4, 2.8, hc, OUT); curve(ctx, [[cx - 1.6, cy - ry * 1.2], [cx, cy - ry * 1.32], [cx + 1.6, cy - ry * 1.2]], 0.45, shade(hc, 0.35)); }
        break;
      case 'buzz': blob(ctx, capPts(cx, cy, rx, ry, 0.52, 1.03), hc, OUT); speckle(ctx, cx, cy - ry * 0.6, rx * 1.4, ry * 0.5, shade(hc, -0.25), 22, Math.PI, Math.PI * 2, 9, 0.25); break;
      case 'curly': for (let i = -3; i <= 3; i++) oval(ctx, cx + i * rx * 0.28, cy - ry * 0.86 - (Math.abs(i) % 2) * 0.9 + Math.abs(i) * 0.6, 2.4, 2.2, hc, OUT * 0.85); for (let i = -2; i <= 2; i++) curve(ctx, [[cx + i * rx * 0.3 - 0.6, cy - ry * 0.95], [cx + i * rx * 0.3, cy - ry * 0.82], [cx + i * rx * 0.3 + 0.6, cy - ry * 0.95]], 0.45, shade(hc, 0.3)); break;
      case 'spiky':
        poly(ctx, [[cx - rx, cy - ry * 0.3], [cx - rx * 1.2, cy - ry * 1.06], [cx - rx * 0.62, cy - ry * 0.82], [cx - rx * 0.46, cy - ry * 1.5], [cx - rx * 0.06, cy - ry * 0.92], [cx + rx * 0.2, cy - ry * 1.56], [cx + rx * 0.42, cy - ry * 0.86], [cx + rx * 0.88, cy - ry * 1.3], [cx + rx * 0.76, cy - ry * 0.7], [cx + rx * 1.14, cy - ry * 0.3], [cx + rx * 0.5, cy - ry * 0.56], [cx - rx * 0.5, cy - ry * 0.56]], hc, OUT);
        for (const [a, b] of [[-0.46, -1.3], [0.2, -1.36], [0.82, -1.12]]) line(ctx, [[cx + rx * a, cy + ry * b * 0.8], [cx + rx * a, cy + ry * b * 0.62]], 0.45, shade(hc, -0.25));
        break;
    }
  }
  if (!hw) return;
  const c = hw.color || '#1d1a22';
  switch (hw.type) {
    case 'durag':
      blob(ctx, capPts(cx, cy, rx, ry, 0.32, 1.06), c, OUT);
      line(ctx, [[cx, cy - ry * 1.05], [cx, cy - ry * 0.56]], 0.6, shade(c, 0.4));
      curve(ctx, [[cx - rx * 0.7, cy - ry * 0.7], [cx - rx * 0.3, cy - ry * 0.95]], 0.45, shade(c, 0.4));
      break;
    case 'fitted':
      blob(ctx, capPts(cx, cy, rx, ry, 0.34, 1.12), c, OUT);
      curve(ctx, [[cx - rx * 0.35, cy - ry * 0.48], [cx - rx * 0.25, cy - ry * 0.9], [cx, cy - ry * 1.1]], IN, shade(c, -0.35));
      curve(ctx, [[cx + rx * 0.35, cy - ry * 0.48], [cx + rx * 0.25, cy - ry * 0.9], [cx, cy - ry * 1.1]], IN, shade(c, -0.35));
      oval(ctx, cx, cy - ry * 1.12, 1, 0.6, c, IN);
      poly(ctx, [[cx - rx * 1.08, cy - ry * 0.38], [cx + rx * 1.08, cy - ry * 0.38], [cx + rx * 0.82, cy - ry * 0.1], [cx - rx * 0.82, cy - ry * 0.1]], shade(c, -0.15), OUT, 1.2);
      if (hw.accent) text(ctx, 'B', cx, cy - ry * 0.76, { size: 4.4, fill: hw.accent, font: FONT.slab, stroke: K, sw: 0.5 });
      break;
    case 'backcap':
      blob(ctx, capPts(cx, cy, rx, ry, 0.36, 1.12), c, OUT);
      oval(ctx, cx, cy - ry * 0.52, 2.2, 1, shade(c, -0.35), IN);
      curve(ctx, [[cx - rx * 0.6, cy - ry * 0.7], [cx, cy - ry * 1.08], [cx + rx * 0.6, cy - ry * 0.7]], IN, shade(c, -0.3));
      break;
    case 'beanie':
      blob(ctx, ellPts(cx, cy - ry * 0.35, rx * 1.12, ry * 0.98, Math.PI, Math.PI * 2, 16).concat([[cx + rx * 1.12, cy - ry * 0.25], [cx - rx * 1.12, cy - ry * 0.25]]), c, OUT);
      rrect(ctx, cx - rx * 1.14, cy - ry * 0.56, rx * 2.28, ry * 0.34, 1.2, shade(c, 0.12), OUT);
      for (let i = -4; i <= 4; i++) line(ctx, [[cx + i * rx * 0.24, cy - ry * 0.52], [cx + i * rx * 0.24, cy - ry * 0.26]], 0.45, shade(c, -0.25));
      if (hw.accent) { oval(ctx, cx, cy - ry * 1.4, 2.4, 2.2, hw.accent, OUT); curve(ctx, [[cx - 1, cy - ry * 1.46], [cx, cy - ry * 1.3], [cx + 1, cy - ry * 1.46]], 0.45); }
      break;
    case 'bucket':
      blob(ctx, ellPts(cx, cy - ry * 0.46, rx * 0.92, ry * 0.82, Math.PI, Math.PI * 2, 14).concat([[cx + rx * 0.92, cy - ry * 0.4], [cx - rx * 0.92, cy - ry * 0.4]]), c, OUT);
      rect(ctx, cx - rx * 0.9, cy - ry * 0.62, rx * 1.8, ry * 0.18, shade(c, -0.12), IN);
      poly(ctx, [[cx - rx * 1.56, cy - ry * 0.08], [cx - rx * 0.96, cy - ry * 0.52], [cx + rx * 0.96, cy - ry * 0.52], [cx + rx * 1.56, cy - ry * 0.08], [cx, cy - ry * 0.2]], shade(c, -0.08), OUT, 1.5);
      for (let i = 0; i < 9; i++) { const t = i / 8; line(ctx, [[cx - rx * 1.3 + t * rx * 2.6 - 0.4, cy - ry * 0.18 - Math.sin(t * Math.PI) * ry * 0.18], [cx - rx * 1.3 + t * rx * 2.6 + 0.4, cy - ry * 0.18 - Math.sin(t * Math.PI) * ry * 0.18]], 0.4); }
      break;
  }
}

// ---------- FRONT VIEW ----------
function headFront(ctx, sp, o) {
  const f = sp.face || {};
  const [rx, ry, jowl] = headShape(f);
  const cx = o.tilt || 0, cy = -51.5 + (o.nod || 0);
  const skin = sp.skin, face = sp.shadowFace ? '#0e0b14' : skin, hc = sp.hair?.color || '#1e1612';
  tube(ctx, [[0, -40.4], [cx * 0.5, -45]], 4.6, skin, OUT);
  hairBackFront(ctx, sp, cx, cy, rx, ry);
  for (const s of [-1, 1]) {
    const ex = cx + s * rx * 0.97;
    oval(ctx, ex, cy + 1, 2.2, 3, face, OUT);
    if (!sp.shadowFace) curve(ctx, [[ex + s * 0.6, cy - 0.9], [ex - s * 0.5, cy + 0.6], [ex + s * 0.3, cy + 2.2]]);
  }
  blob(ctx, headPts(cx, cy, rx, ry, jowl), face, OUT);
  const fr = { ...f, lidColor: f.lidColor || shade(skin, -0.16) };
  if (sp.shadowFace) {
    for (const s of [-1, 1]) {
      oval(ctx, cx + s * 2.7, cy - 1.8, 2, o.blink ? 0.35 : 2.5, '#ffffff', 0);
      if (!o.blink) oval(ctx, cx + s * 2.7 + 0.4, cy - 1.3, 0.75, 0.85, K, 0);
    }
    brow(ctx, cx - 5, cy - 5.4, cx - 1, cy - 4.2, 0.9, '#2a2433');
    brow(ctx, cx + 5, cy - 5.4, cx + 1, cy - 4.2, 0.9, '#2a2433');
    mouthFront(ctx, cx, cy + 5.4, { mouth: 'grin' }, o, 4.6, true);
  } else {
    if (f.wrinkles) for (let i = 0; i < 2; i++) curve(ctx, [[cx - rx * 0.42, cy - ry * (0.6 + i * 0.13)], [cx, cy - ry * (0.65 + i * 0.13)], [cx + rx * 0.42, cy - ry * (0.6 + i * 0.13)]]);
    if (f.blush) for (const s of [-1, 1]) oval(ctx, cx + s * rx * 0.64, cy + ry * 0.3, 2.3, 1.4, '#ff8aa8', 0);
    if (f.freckles) for (const s of [-1, 1]) speckle(ctx, cx + s * rx * 0.6, cy + ry * 0.28, 2.6, 1.8, shade(skin, -0.3), 7, 0, Math.PI * 2, 20 + s, 0.3);
    if (f.stubble) speckle(ctx, cx, cy + 1, rx, ry, shade(skin, -0.38), 34, Math.PI * 0.22, Math.PI * 0.78, 7);
    const my = cy + ry * 0.62;
    if (sp.acc?.beard) {
      blob(ctx, [[cx - rx * 0.98, cy + ry * 0.02], [cx - rx * 0.66, cy + ry * 0.78], [cx, cy + ry * 1.16], [cx + rx * 0.66, cy + ry * 0.78], [cx + rx * 0.98, cy + ry * 0.02], [cx + rx * 0.56, cy + ry * 0.44], [cx, cy + ry * 0.36], [cx - rx * 0.56, cy + ry * 0.44]], hc, OUT);
      for (let i = -2; i <= 2; i++) curve(ctx, [[cx + i * 2.2, cy + ry * 0.86], [cx + i * 2.4, cy + ry * 1.02]], 0.45, shade(hc, 0.35));
    }
    mouthFront(ctx, cx, my, f, o, 4.6 * (f.mouthW || 1));
    if (f.mustache) blob(ctx, [[cx - 5, my - 0.4], [cx - 3, my - 2.6], [cx, my - 2.2], [cx + 3, my - 2.6], [cx + 5, my - 0.4], [cx + 2.4, my - 1.2], [cx, my - 1], [cx - 2.4, my - 1.2]], hc, OUT);
    if (f.cheeks !== false && !sp.acc?.beard) for (const s of [-1, 1]) curve(ctx, [[cx + s * 4.2, cy + ry * 0.28], [cx + s * 5.4, cy + ry * 0.5], [cx + s * 5.6, cy + ry * 0.7]]);
    curve(ctx, [[cx - 1.4, my + 5], [cx, my + 5.5], [cx + 1.4, my + 5]]);
    const er = 3.4 * (f.eye || 1), eh = 4.3 * (f.eye || 1), ey = cy - ry * 0.2;
    const look = o.look || f.look || [0, 0];
    for (const s of [-1, 1]) eye(ctx, cx + s * er * 0.96, ey, er, eh, fr, o, look[0] + (f.cross ? -s * 0.6 : 0), look[1], s);
    const bw = { angry: [1, -1], worried: [-1, 1], up: [-0.6, -0.6] }[f.brow] || [0, 0];
    const bc = f.browColor || (sp.hair?.color && sp.hair.color !== '#ffe066' ? hc : K);
    if (f.brow !== 'none') for (const s of [-1, 1]) {
      const k = s < 0 ? bw[0] : bw[1];
      brow(ctx, cx + s * 0.9, ey - eh - 1 + k * 0.9, cx + s * er * 1.9, ey - eh - 1.4 - k * 0.6, f.brow === 'bushy' ? 1.3 : 0.9, bc);
    }
    const n = f.nose ?? 1, nx = cx, ny = cy + ry * 0.24, nc = noseColor(f, skin);
    if (f.noseStyle === 'long') { blob(ctx, [[nx - 2.3 * n, ny - 3.6], [nx + 2.3 * n, ny - 3.6], [nx + 3.2 * n, ny + 2.6 * n], [nx, ny + 5 * n], [nx - 3.2 * n, ny + 2.6 * n]], nc, OUT); curve(ctx, [[nx - 1.6 * n, ny + 3.4 * n], [nx - 0.8 * n, ny + 4.2 * n]]); curve(ctx, [[nx + 1.6 * n, ny + 3.4 * n], [nx + 0.8 * n, ny + 4.2 * n]]); }
    else { oval(ctx, nx, ny, 3.4 * n, 3 * n, nc, OUT); curve(ctx, [[nx - 2.1 * n, ny + 1.1 * n], [nx - 1.4 * n, ny + 2 * n], [nx - 0.5 * n, ny + 1.6 * n]]); curve(ctx, [[nx + 2.1 * n, ny + 1.1 * n], [nx + 1.4 * n, ny + 2 * n], [nx + 0.5 * n, ny + 1.6 * n]]); }
    if (f.wart) { oval(ctx, cx + rx * 0.5, cy + ry * 0.5, 0.9, 0.8, shade(skin, -0.12), IN); line(ctx, [[cx + rx * 0.5, cy + ry * 0.46], [cx + rx * 0.56, cy + ry * 0.36]], 0.4); }
    if (sp.acc?.earring) for (const s of [-1, 1]) oval(ctx, cx + s * rx * 1.02, cy + 4, 0.9, 0.9, GOLD, 0.5);
  }
  hairFront(ctx, sp, cx, cy, rx, ry);
  if (sp.head?.type === 'hood') {
    smooth(ctx, headPts(cx, cy + 0.8, rx * 1.18, ry * 1.13, 0.03, 22), true);
    ctx.lineWidth = 4.2; ctx.strokeStyle = K; ctx.stroke();
    ctx.lineWidth = 2.4; ctx.strokeStyle = shade(sp.head.color, 0.16); ctx.stroke();
    for (const s of [-1, 1]) { line(ctx, [[cx + s * 2.4, cy + ry * 1.12], [cx + s * 2.8, cy + ry * 1.12 + 7]], 0.8, '#d8d4e4'); oval(ctx, cx + s * 2.8, cy + ry * 1.12 + 7.6, 0.6, 0.9, '#d8d4e4', 0.4); }
  }
  const e = sp.eyes;
  if (e?.type === 'juliet') {
    blob(ctx, [[cx - rx * 1.04, cy - ry * 0.46], [cx + rx * 1.04, cy - ry * 0.46], [cx + rx * 0.86, cy + ry * 0.02], [cx + 1.3, cy - ry * 0.1], [cx, cy - ry * 0.28], [cx - 1.3, cy - ry * 0.1], [cx - rx * 0.86, cy + ry * 0.02]], e.color || C.sky2, OUT);
    line(ctx, [[cx - rx * 0.66, cy - ry * 0.34], [cx - rx * 0.22, cy - ry * 0.34]], 0.8, '#ffffff');
    line(ctx, [[cx + rx * 0.3, cy - ry * 0.34], [cx + rx * 0.5, cy - ry * 0.34]], 0.8, '#ffffff');
  } else if (e) {
    for (const s of [-1, 1]) rrect(ctx, cx + s * 3.5 - 3.2, cy - ry * 0.48, 6.4, 4.2, 1.6, '#16121c', OUT);
    line(ctx, [[cx - 0.4, cy - ry * 0.38], [cx + 0.4, cy - ry * 0.38]], OUT);
    line(ctx, [[cx - 5, cy - ry * 0.38], [cx - 3.2, cy - ry * 0.38]], 0.7, '#ffffff');
  }
}

function shoeFront(ctx, s, sh, skin) {
  const x = s * 5.3, type = sh.type || 'sneaker', col = sh.color || '#ffffff';
  if (type === 'slides') {
    oval(ctx, x, -0.8, 5.4, 1.8, col, OUT);
    oval(ctx, x, -2.3, 3.9, 2.1, skin, OUT);
    for (let i = 0; i < 4; i++) oval(ctx, x - 2.6 + i * 1.7, -0.9, 0.85, 0.75, skin, 0.5);
    rrect(ctx, x - 4.1, -5, 8.2, 3, 1.2, sh.accent || '#ffffff', OUT);
    curve(ctx, [[x - 2.4, -3.4], [x, -4], [x + 2.4, -3.4]], 0.6, col === '#ffffff' ? K : col);
    return;
  }
  if (type === 'timbs') {
    poly(ctx, [[x - 3.9, -9.6], [x + 3.9, -9.6], [x + 4.5, -3], [x + 5.8, 0.4], [x - 5.8, 0.4], [x - 4.5, -3]], '#e8a73c', OUT, 1.6);
    rrect(ctx, x - 5.8, -1.2, 11.6, 1.8, 0.7, '#6a3e18', OUT * 0.8);
    for (let i = -4; i <= 4; i += 2) line(ctx, [[x + i, -0.9], [x + i, 0.4]], 0.4, '#e8a73c');
    rrect(ctx, x - 4.1, -10.2, 8.2, 2.2, 1, '#b8782a', OUT * 0.8);
    for (let i = 0; i < 3; i++) { line(ctx, [[x - 1.3, -8.2 + i * 1.8], [x + 1.3, -7.2 + i * 1.8]], 0.55, '#6a3e18'); line(ctx, [[x + 1.3, -8.2 + i * 1.8], [x - 1.3, -7.2 + i * 1.8]], 0.55, '#6a3e18'); }
    curve(ctx, [[x - 3.6, -2.4], [x, -3.4], [x + 3.6, -2.4]], 0.5, '#8a5418');
    return;
  }
  poly(ctx, [[x - 4.1, -6.4], [x + 4.1, -6.4], [x + 5.7, -2.2], [x + 5.5, 0.5], [x - 5.5, 0.5], [x - 5.7, -2.2]], col, OUT, 2.2);
  rrect(ctx, x - 5.7, -1.9, 11.4, 2.6, 1.2, sh.sole || '#f4f0ff', OUT * 0.8);
  for (let i = -4; i <= 4; i += 2) line(ctx, [[x + i, -0.4], [x + i, 0.4]], 0.4);
  rrect(ctx, x - 1.7, -8, 3.4, 2.8, 1, col, IN);
  for (let i = 0; i < 3; i++) line(ctx, [[x - 1.6, -6.2 + i * 1.2], [x + 1.6, -5.6 + i * 1.2]], 0.5);
  curve(ctx, [[x - 3.7, -2.8], [x, -3.7], [x + 3.7, -2.8]]);
  if (sh.accent) { curve(ctx, [[x - 5.2, -3.4], [x - 3.4, -4.4], [x - 2, -3.2]], 1.3, sh.accent); curve(ctx, [[x + 5.2, -3.4], [x + 3.4, -4.4], [x + 2, -3.2]], 1.3, sh.accent); }
}
function legsFront(ctx, sp) {
  const l = sp.legs || { type: 'jeans', color: '#3a5fa8' }, skin = sp.skin;
  for (const s of [-1, 1]) {
    const hip = [s * 3.5, -23], knee = [s * 4, -12.8], ank = [s * 3.9, -4.2];
    const pc = s < 0 ? shade(l.color, -0.06) : l.color;
    if (l.type === 'shorts') {
      tube(ctx, [[s * 3.8, -16], knee, ank], 2.5, skin, OUT);
      curve(ctx, [[knee[0] - 0.8, knee[1] - 0.2], [knee[0], knee[1] + 0.6], [knee[0] + 0.8, knee[1] - 0.2]], 0.5);
      if (sp.hairy) for (let i = 0; i < 4; i++) line(ctx, [[knee[0] - 0.6 + (i % 2) * 1.2, knee[1] + 2 + i * 1.6], [knee[0] - 1.2 + (i % 2) * 1.2, knee[1] + 1.4 + i * 1.6]], 0.4);
      if (sp.socks) { tube(ctx, [[s * 3.86, -9.8], ank], 3.3, '#ffffff', OUT); line(ctx, [[s * 3.86 - 1.6, -8.6], [s * 3.86 + 1.6, -8.6]], 0.8, l.accent && l.accent !== '#ffffff' ? l.accent : C.red); }
      poly(ctx, s < 0 ? [[-0.2, -24.4], [-7.8, -24.4], [-8.2, -14.6], [-1.2, -14.6]] : [[0.2, -24.4], [7.8, -24.4], [8.2, -14.6], [1.2, -14.6]], pc, OUT, 0.8);
      line(ctx, [[s * 1.6, -15.8], [s * 7.4, -15.8]], 0.45, shade(pc, -0.3));
    } else {
      const w = l.type === 'baggy' ? 6.2 : l.type === 'cargo' ? 5.6 : 4.8;
      tube(ctx, [hip, knee, ank], w, pc, OUT);
      curve(ctx, [[knee[0] - w * 0.38, knee[1] - 1.4], [knee[0], knee[1] - 0.7], [knee[0] + w * 0.3, knee[1] - 1.6]]);
      curve(ctx, [[knee[0] - w * 0.3, knee[1] + 0.8], [knee[0] + w * 0.16, knee[1] + 1.2]]);
      if (l.type === 'jeans' || l.type === 'baggy') line(ctx, [[s * (3.5 + w * 0.36), -22], [s * (3.9 + w * 0.36), -6.4]], 0.45, shade(pc, 0.25));
      if (l.type === 'baggy') { oval(ctx, ank[0], ank[1] - 0.4, 4, 1.8, shade(pc, -0.1), OUT); curve(ctx, [[ank[0] - 2.4, ank[1] - 3.2], [ank[0], ank[1] - 2.4], [ank[0] + 2.4, ank[1] - 3.2]]); }
      if (l.type === 'track') line(ctx, [[s * 5.8, -22.6], [s * 6.3, -13], [s * 6.1, -5]], 0.9, l.accent || '#ffffff', true);
      if (l.type === 'cargo') { rrect(ctx, s * 6 - 1.8, -18, 3.6, 4.2, 0.6, shade(pc, -0.1), OUT * 0.7); line(ctx, [[s * 6 - 1.8, -16.8], [s * 6 + 1.8, -16.8]], 0.45); }
      if (sp.socks) tube(ctx, [[s * 3.86, -7.2], ank], 3.3, '#ffffff', OUT);
    }
  }
  if (l.type !== 'shorts') curve(ctx, [[-0.6, -23], [0, -20.2], [0.3, -18.6]], 0.5, shade(l.color, -0.3));
  for (const s of [-1, 1]) shoeFront(ctx, s, sp.shoes || {}, skin);
}
function torsoFront(ctx, sp) {
  const t = sp.top, a = t.accent || '#ffffff', tc = t.color;
  const long = t.type === 'parka' || t.type === 'trench';
  const wide = t.type === 'puffer' ? 2 : 0, belly = sp.belly ? 1.8 : 0;
  const by = long ? -10 : -21.4;
  const pts = [[-8.3 - wide, -38.8], [-8.9 - wide, -32], [-7.1 - wide - belly, by + 1.2], [7.1 + wide + belly, by + 1.2], [8.9 + wide, -32], [8.3 + wide, -38.8], [3.8, -40.8], [-3.8, -40.8]];
  const P = () => roundPoly(ctx, pts, 2.4);
  if (t.type === 'puffer') for (let y = -36; y < by; y += 3.8) for (const s of [-1, 1]) oval(ctx, s * (9.3 + wide * 0.5), y + 1.6, 1.6, 2.1, tc, OUT);
  P(); ink(ctx, tc, OUT);
  clip(ctx, P, () => {
    switch (t.type) {
      case 'camo': for (const [x, y, k] of [[-4, -35, 0], [3, -31, 1], [-2, -27, 0], [5, -37, 0], [0, -24, 1], [-6, -30, 1], [6, -26, 0]]) blob(ctx, ellPts(x, y, 2.9, 1.8, 0, Math.PI * 2, 7).slice(0, 7).map(([px, py], i) => [px + (i % 2) * 0.6, py]), k ? shade(a, -0.22) : a, 0); break;
      case 'flannel': for (let y = -41; y < by; y += 3) rect(ctx, -12, y, 24, 1, a, 0); for (let x = -11; x < 12; x += 3) rect(ctx, x, -41, 0.8, 40, shade(a, -0.18), 0); break;
      case 'puffer': for (let y = -35; y < by; y += 3.8) curve(ctx, [[-12, y], [-6, y + 0.8], [0, y + 0.4], [6, y + 0.8], [12, y]]); break;
      case 'jersey': text(ctx, t.num || '10', 0, -30.4, { size: 8, fill: a, stroke: K, sw: 0.8, font: FONT.slab }); rect(ctx, -9.2, -40, 2.2, 30, a, IN); rect(ctx, 7, -40, 2.2, 30, a, IN); break;
      case 'tee': case 'tank':
        if (t.logo !== false) { oval(ctx, 0, -33.4, 3, 2.6, a, OUT * 0.8); oval(ctx, -0.9, -34, 0.5, 0.6, K, 0); oval(ctx, 0.9, -34, 0.5, 0.6, K, 0); curve(ctx, [[-1.3, -32.6], [0, -31.8], [1.3, -32.6]], 0.45); }
        curve(ctx, [[-6.4, -26.4], [-4.6, -24.4]]); curve(ctx, [[6, -27], [4.2, -25]]);
        break;
      case 'hoodie': rrect(ctx, -5, -29.4, 10, 6.2, 2, shade(tc, -0.12), OUT * 0.8); curve(ctx, [[-4.6, -29], [0, -28.4], [4.6, -29]], 0.45); if (t.logo !== false) rrect(ctx, -3.6, -36.6, 7.2, 2.8, 0.6, a, OUT * 0.7); rect(ctx, -12, by - 1.2, 24, 1.6, shade(tc, -0.1), IN); for (let x = -7; x < 8; x += 1.6) line(ctx, [[x, by - 1.2], [x, by + 0.4]], 0.4); break;
      case 'track': line(ctx, [[0, -40], [0, by]], 0.7, '#f0ecf8'); rect(ctx, -0.6, -39.6, 1.2, 2.4, '#c6c2d4', 0.4); if (t.logo) oval(ctx, 3.8, -35.8, 1, 0.8, t.logo, 0.4); rect(ctx, -12, by - 1.4, 24, 1.6, shade(tc, -0.15), IN); break;
      case 'trench': case 'parka': line(ctx, [[0, -40], [0, by]], 0.8); for (const s of [-1, 1]) { rrect(ctx, s * 4.4 - 2.2, -22, 4.4, 4, 0.6, shade(tc, -0.1), OUT * 0.7); line(ctx, [[s * 4.4 - 2.2, -20.6], [s * 4.4 + 2.2, -20.6]], 0.45); } line(ctx, [[-9, -27], [9, -27]], 0.5); break;
      case 'jacket': line(ctx, [[0, -40], [0, by]], 0.9, a); rect(ctx, -12, by - 1.6, 24, 1.8, a, IN); for (let x = -8; x < 9; x += 1.5) line(ctx, [[x, by - 1.6], [x, by + 0.2]], 0.35); rrect(ctx, -6.6, -36, 3.6, 3, 0.6, a, IN); break;
      case 'polo': line(ctx, [[0, -39.6], [0, -33.6]], 0.55); for (const y of [-37.6, -35.6]) oval(ctx, 0.9, y, 0.45, 0.45, '#ffffff', 0.3); if (t.logo) oval(ctx, 4, -35.8, 1.1, 0.9, t.logo, 0.4); curve(ctx, [[-6, -26], [-4.2, -24.4]]); break;
    }
  });
  P(); ink(ctx, null, OUT);
  if (t.type === 'polo') { poly(ctx, [[-4, -40.8], [0, -38.6], [-1.4, -36.2], [-4.6, -38.6]], a, OUT * 0.8); poly(ctx, [[4, -40.8], [0, -38.6], [1.4, -36.2], [4.6, -38.6]], a, OUT * 0.8); }
  else if (t.type === 'flannel') { poly(ctx, [[-4, -40.8], [0, -37.6], [-2.6, -36.2], [-5, -39]], a, OUT * 0.8); poly(ctx, [[4, -40.8], [0, -37.6], [2.6, -36.2], [5, -39]], a, OUT * 0.8); for (const y of [-34, -30, -26]) oval(ctx, 0, y, 0.55, 0.55, '#ffffff', 0.4); }
  else if (t.type === 'hoodie' || t.type === 'camo') { if (sp.head?.type !== 'hood') blob(ctx, [[-6, -40.4], [-3, -42.8], [3, -42.8], [6, -40.4], [3, -39.4], [-3, -39.4]], shade(tc, -0.12), OUT); for (const s of [-1, 1]) { line(ctx, [[s * 1.8, -39.4], [s * 2.2, -34]], 0.7, '#f0ecf8'); oval(ctx, s * 2.2, -33.6, 0.5, 0.8, '#f0ecf8', 0.35); } }
  else if (t.type === 'puffer') { oval(ctx, 0, -40.6, 6, 2.6, tc, OUT); line(ctx, [[0, -38], [0, by]], 0.7, '#a8a2bc'); }
  else if (t.type === 'track' || t.type === 'jacket') rrect(ctx, -4.4, -42, 8.8, 2.6, 1, t.type === 'track' ? tc : a, OUT * 0.8);
  else if (['tee', 'jersey', 'tank'].includes(t.type)) { curve(ctx, [[-3, -40.4], [0, -38.2], [3, -40.4]], OUT, t.type === 'jersey' ? a : K); if (t.type === 'tee') curve(ctx, [[-2.4, -39.6], [0, -37.6], [2.4, -39.6]], 0.45); }
  else if (t.type === 'parka') { for (let i = -3; i <= 3; i++) oval(ctx, i * 1.9, -40.8 - Math.cos(i / 2) * 0.6, 1.5, 1.4, '#e8e0d0', OUT * 0.7); }
}
const ARMS = {
  down: (s) => ({ e: [s * 11, -30.6], w: [s * 11.4, -23.6], h: 'palm', a: Math.PI / 2, m: s }),
  hips: (s) => ({ e: [s * 14.8, -31], w: [s * 9.4, -25.8], h: 'fist', a: s > 0 ? Math.PI * 0.94 : Math.PI * 0.06, m: -s }),
  counter: (s) => ({ e: [s * 13.6, -29.4], w: [s * 10.4, -24.2], h: 'palm', a: s > 0 ? Math.PI * 0.7 : Math.PI * 0.3, m: s }),
  wave: (s) => ({ e: [s * 15.6, -42.6], w: [s * 14.6, -51], h: 'open', a: -Math.PI / 2, m: -s }),
  point: (s) => ({ e: [s * 15.8, -36.8], w: [s * 20.6, -40.8], h: 'point', a: s > 0 ? -0.3 : Math.PI + 0.3, m: s }),
  shrug: (s) => ({ e: [s * 14.8, -31.2], w: [s * 17.6, -37.8], h: 'open', a: s > 0 ? -0.65 : Math.PI + 0.65, m: s }),
  thumb: (s) => ({ e: [s * 13.8, -30.4], w: [s * 12.6, -36.8], h: 'thumb', a: s > 0 ? 0 : Math.PI, m: -s }),
};
function armsFront(ctx, sp, o) {
  const t = sp.top, skin = sp.skin, tc = t.color;
  const wide = t.type === 'puffer' ? 2 : 0;
  const short = ['tee', 'jersey', 'tank', 'polo'].includes(t.type);
  const aw = t.type === 'puffer' ? 5 : 3.5;
  for (const s of [-1, 1]) {
    const pose = ARMS[(s > 0 ? o.right : o.left) || 'down'](s);
    const sh = [s * (7.4 + wide), -37.4];
    const e = [pose.e[0] + s * wide, pose.e[1]], w = [pose.w[0] + s * wide * 0.6, pose.w[1]];
    const sc = s < 0 ? shade(tc, -0.05) : tc;
    if (t.type === 'tank') tube(ctx, [sh, e, w], 2.5, skin, OUT);
    else if (short) {
      tube(ctx, [sh, e, w], 2.5, skin, OUT);
      const mid = [(sh[0] * 1.5 + e[0]) / 2.5, (sh[1] * 1.5 + e[1]) / 2.5];
      sleeve(ctx, sh, mid, aw + 1.2, sc, t.type === 'jersey' || t.type === 'polo' ? t.accent || '#ffffff' : null);
      if (sp.hairy) for (let i = 0; i < 3; i++) { const p = [(e[0] * (3 - i) + w[0] * (i + 1)) / 4, (e[1] * (3 - i) + w[1] * (i + 1)) / 4]; line(ctx, [[p[0] - 0.5, p[1]], [p[0] + 0.4, p[1] - 0.7]], 0.4); }
    } else {
      tube(ctx, [sh, e, w], aw, sc, OUT);
      const cuff = [w[0] + (e[0] - w[0]) * 0.22, w[1] + (e[1] - w[1]) * 0.22];
      tube(ctx, [cuff, w], aw + 0.8, t.type === 'track' ? sc : shade(sc, -0.12), OUT);
      if (t.type === 'track') line(ctx, [sh, e, w].map(([x, y]) => [x + s * 1.4, y]), 0.8, t.accent || '#fff', true);
      curve(ctx, [[e[0] - s * 1.2, e[1] - 0.8], [e[0], e[1] + 0.4], [e[0] - s * 0.2, e[1] + 1.4]]);
    }
    hand(ctx, w[0], w[1], pose.a, skin, pose.h, pose.m);
  }
}
// short sleeve: a flared tube cut square at the hem, with an optional trim band
function sleeve(ctx, a, b, w, color, trim) {
  const dx = b[0] - a[0], dy = b[1] - a[1], d = Math.hypot(dx, dy) || 1, ux = dx / d, uy = dy / d, nx = -uy, ny = ux;
  const q = [[a[0] + nx * w * 0.42 - ux * 1.2, a[1] + ny * w * 0.42 - uy * 1.2], [b[0] + nx * w * 0.6, b[1] + ny * w * 0.6], [b[0] - nx * w * 0.6, b[1] - ny * w * 0.6], [a[0] - nx * w * 0.42 - ux * 1.2, a[1] - ny * w * 0.42 - uy * 1.2]];
  poly(ctx, q, color, OUT, 0.8);
  if (trim) poly(ctx, [[b[0] + nx * w * 0.6 - ux * 1.1, b[1] + ny * w * 0.6 - uy * 1.1], [b[0] + nx * w * 0.6, b[1] + ny * w * 0.6], [b[0] - nx * w * 0.6, b[1] - ny * w * 0.6], [b[0] - nx * w * 0.6 - ux * 1.1, b[1] - ny * w * 0.6 - uy * 1.1]], trim, IN);
  curve(ctx, [[b[0] + nx * w * 0.3 - ux * 1.8, b[1] + ny * w * 0.3 - uy * 1.8], [b[0] - nx * w * 0.1 - ux * 1.2, b[1] - ny * w * 0.1 - uy * 1.2]], 0.45);
}
function chestAcc(ctx, sp) {
  const a = sp.acc || {};
  if (a.chain) { for (let i = 0; i <= 8; i++) { const t = i / 8, x = -3.8 + 7.6 * t, y = -40.6 + Math.sin(t * Math.PI) * 6.6; oval(ctx, x, y, 0.75, 0.6, GOLD, 0.4); } oval(ctx, 0, -33, 1.6, 1.8, GOLD, OUT * 0.7); text(ctx, '$', 0, -32.9, { size: 2.4, font: FONT.block, fill: K }); }
  if (a.sacoche) { line(ctx, [[-6.6, -39.8], [5.2, -26.8]], 0.9); rrect(ctx, 2.8, -29.8, 6.8, 5.8, 1, '#1d1a22', OUT); rect(ctx, 3.8, -28, 4.8, 0.6, '#d8d4e4', 0); oval(ctx, 6.2, -25.8, 0.8, 0.5, C.green, 0.3); }
  if (a.bumbag) { line(ctx, [[-7.6, -27], [6.6, -39.8]], 1); rrect(ctx, -4.6, -37.6, 8.8, 4.8, 1.8, a.bumbag, OUT); line(ctx, [[-3.4, -35.8], [3, -35.8]], 0.5, '#d8d4e4'); }
  if (a.headphones) { curve(ctx, [[-4.4, -41.4], [0, -39.6], [4.4, -41.4]], 1); oval(ctx, -4.6, -41.2, 1.7, 1.7, a.headphones, OUT * 0.7); oval(ctx, 4.6, -41.2, 1.7, 1.7, a.headphones, OUT * 0.7); }
}
function frontFigure(ctx, sp, o = {}) {
  ctx.save();
  if (o.squash) ctx.scale(1.05, 0.95);
  if (o.hop) { ctx.translate(0, -4.4); ctx.scale(0.96, 1.05); }
  legsFront(ctx, sp);
  if (sp.acc?.backpack) for (const s of [-1, 1]) line(ctx, [[s * 5.2, -39.8], [s * 6.2, -24]], 1.3, sp.acc.backpack);
  torsoFront(ctx, sp);
  chestAcc(ctx, sp);
  armsFront(ctx, sp, o);
  headFront(ctx, sp, o);
  ctx.restore();
}

// ---------- SIDE VIEW (walkers, facing right) ----------
function shoeSide(ctx, ank, ang, sh, skin, dim) {
  const type = sh.type || 'sneaker', col = dim ? shade(sh.color || '#ffffff', -0.1) : sh.color || '#ffffff';
  ctx.save();
  ctx.translate(ank[0], ank[1]);
  ctx.rotate(ang);
  if (type === 'slides') {
    rrect(ctx, -3.6, 1.4, 13, 1.6, 0.7, col, OUT);
    blob(ctx, [[-3, 1.4], [-2.6, -1.1], [2.6, -0.5], [8.2, 0.6], [8.8, 1.6]], dim ? shade(skin, -0.08) : skin, OUT);
    rect(ctx, 1.6, -0.6, 3.2, 2.2, sh.accent || '#ffffff', OUT * 0.8);
  } else if (type === 'timbs') {
    poly(ctx, [[-3.6, -6], [2.8, -6], [3.4, -1.8], [9, -0.6], [10, 2.8], [-3.8, 2.8]], dim ? '#c88a2a' : '#e8a73c', OUT, 1.4);
    rect(ctx, -3.8, 1.6, 13.8, 1.3, '#6a3e18', OUT * 0.8);
    for (let i = 0; i < 3; i++) line(ctx, [[0.4 + i * 0.8, -4.6 + i * 1.3], [2.4 + i * 0.8, -4.2 + i * 1.3]], 0.5, '#6a3e18');
    curve(ctx, [[5.4, -0.8], [7, 0.4], [7.4, 2]], 0.5, '#8a5418');
  } else {
    poly(ctx, [[-3.8, -2.8], [1.8, -3.4], [5.2, -1.6], [9.8, -0.3], [10.8, 2.8], [-4, 2.8]], col, OUT, 1.6);
    rect(ctx, -4, 1.2, 14.8, 1.8, sh.sole || '#f4f0ff', OUT * 0.8);
    for (let i = 0; i < 3; i++) line(ctx, [[1.6 + i * 1.3, -2.8 + i * 0.5], [2.6 + i * 1.3, -1.6 + i * 0.5]], 0.5);
    curve(ctx, [[6.8, -0.4], [7.8, 0.6], [8, 1.2]], 0.5);
    if (sh.accent) curve(ctx, [[-2.4, 0.2], [2.4, -0.9], [6.2, 0.4]], 1.3, sh.accent);
  }
  ctx.restore();
}
function headSide(ctx, sp, cx, cy, o = {}) {
  const f = sp.face || {};
  const [rx0, ry, jowl] = headShape(f);
  const rx = rx0 * 0.95, skin = sp.skin, hc = sp.hair?.color || '#1e1612', hw = sp.head, h = sp.hair;
  tube(ctx, [[cx - 1.4, cy + ry * 0.78], [cx - 1.6, cy + ry * 1.25]], 4, skin, OUT);
  if (hw?.type === 'hood') blob(ctx, headPts(cx - 2.4, cy + 1, rx * 1.3, ry * 1.2, 0, 20), hw.color, OUT);
  else if (h?.style === 'afro') blob(ctx, Array.from({ length: 22 }, (_, i) => { const a = (i / 22) * Math.PI * 2, b = i % 2 ? 1.04 : 1.15; return [cx - 1.6 + Math.cos(a) * rx * 1.38 * b, cy - 3.2 + Math.sin(a) * ry * 1.13 * b]; }), hc, OUT);
  else if (h?.style === 'long' || h?.style === 'mullet') poly(ctx, [[cx - rx * 0.9, cy - ry * 0.6], [cx + rx * 0.2, cy - ry * 0.6], [cx - rx * 0.36, cy + ry * (h.style === 'long' ? 1.15 : 1.05)], [cx - rx * 1.28, cy + ry * (h.style === 'long' ? 1.15 : 1.05)]], hc, OUT, 2);
  else if (h?.style === 'locs') for (let i = 0; i < 4; i++) tube(ctx, [[cx - rx * 0.4 - i * 1.3, cy - ry * 0.5], [cx - rx * 0.86 - i * 1.4, cy + ry * 0.94 + i]], 1.7, hc, OUT * 0.8);
  if (hw?.type === 'durag') tube(ctx, [[cx - rx * 0.7, cy - ry * 0.4], [cx - rx * 1.2, cy + ry * 0.4], [cx - rx * 1.4, cy + ry * 1.1]], 3, hw.color, OUT);
  const face = sp.shadowFace ? '#0e0b14' : skin;
  blob(ctx, headPts(cx, cy, rx, ry, jowl, 28, 1.6), face, OUT);
  const ex = cx - rx * 0.24;
  oval(ctx, ex, cy + 1, 2.2, 3, face, OUT);
  if (!sp.shadowFace) curve(ctx, [[ex + 0.6, cy - 0.9], [ex - 0.4, cy + 0.6], [ex + 0.4, cy + 2.2]]);
  const fr = { ...f, lidColor: f.lidColor || shade(skin, -0.16) };
  if (sp.shadowFace) {
    oval(ctx, cx + rx * 0.62, cy - 1.8, 1.7, 2.2, '#ffffff', 0);
    oval(ctx, cx + rx * 0.62 + 0.6, cy - 1.5, 0.7, 0.8, K, 0);
    rrect(ctx, cx + rx * 0.34, cy + ry * 0.48, rx * 0.66, 2.2, 0.6, GOLD, 0.5);
    for (let i = 1; i < 4; i++) line(ctx, [[cx + rx * (0.34 + i * 0.16), cy + ry * 0.48], [cx + rx * (0.34 + i * 0.16), cy + ry * 0.48 + 2.2]], 0.35);
  } else {
    if (sp.acc?.beard) { blob(ctx, [[cx - rx * 0.2, cy + ry * 0.18], [cx + rx * 0.98, cy + ry * 0.42], [cx + rx * 0.74, cy + ry * 1.08], [cx - rx * 0.1, cy + ry * 0.88]], hc, OUT); }
    if (f.stubble) speckle(ctx, cx + 2.4, cy + 1, rx * 0.9, ry, shade(skin, -0.38), 22, Math.PI * 0.05, Math.PI * 0.6, 8);
    if (f.freckles) speckle(ctx, cx + rx * 0.62, cy + ry * 0.3, 2.4, 1.6, shade(skin, -0.3), 5, 0, Math.PI * 2, 21, 0.3);
    if (f.blush) oval(ctx, cx + rx * 0.5, cy + ry * 0.32, 2.2, 1.3, '#ff8aa8', 0);
    const my = cy + ry * 0.6;
    if (['grin', 'gap'].includes(f.mouth)) {
      const mp = [[cx + rx * 1.04, my - 1.2], [cx + rx * 0.34, my - 0.4], [cx + rx * 0.5, my + 2.2], [cx + rx * 1.0, my + 1.8]];
      blob(ctx, mp, MOUTH, OUT);
      clip(ctx, () => smooth(ctx, mp, true), () => teethRow(ctx, cx + rx * 0.3, cx + rx * 1.1, my - 1.6, my + 0.6, '#ffffff', 4));
      blob(ctx, mp, null, OUT);
    } else if (f.mouth === 'buck') { curve(ctx, [[cx + rx * 1.02, my - 0.2], [cx + rx * 0.7, my + 0.4], [cx + rx * 0.38, my + 0.2]], OUT); rect(ctx, cx + rx * 0.78, my + 0.2, 1.6, 2.2, '#ffffff', 0.55); }
    else curve(ctx, [[cx + rx * 1.02, my + (f.mouth === 'frown' ? 0.8 : 0)], [cx + rx * 0.7, my + 0.3], [cx + rx * 0.38, my + (f.mouth === 'smirk' ? -0.8 : 0.4)]], OUT);
    curve(ctx, [[cx + rx * 0.68, my + 3.6], [cx + rx * 0.9, my + 4.2]]);
    if (f.mustache) blob(ctx, [[cx + rx * 0.5, my - 1.4], [cx + rx * 1.1, my - 2.6], [cx + rx * 1.3, my - 0.8], [cx + rx * 0.8, my - 0.6]], hc, OUT);
    const er = 3.1 * (f.eye || 1), eh = 4.1 * (f.eye || 1), ey = cy - ry * 0.2;
    eye(ctx, cx + rx * 0.4, ey - 0.2, er * 0.8, eh * 0.94, fr, o, 0.85, 0);
    eye(ctx, cx + rx * 0.76, ey + 0.2, er, eh, fr, o, 0.9, (f.look || [0, 0])[1]);
    const bw = { angry: [0.9, -0.6], worried: [-0.8, 0.6], up: [-0.6, -0.6] }[f.brow] || [0, 0];
    if (f.brow && f.brow !== 'none') brow(ctx, cx + rx * 0.3, ey - eh - 1 + bw[1], cx + rx * 1.06, ey - eh - 1 + bw[0], 0.9, f.browColor || hc);
    const n = f.nose ?? 1, nx = cx + rx * 1.06, ny = cy + ry * 0.18, nc = noseColor(f, skin);
    if (f.noseStyle === 'long') { blob(ctx, [[nx - 3.4, ny - 2.8], [nx + 1.8 * n, ny - 2.4], [nx + 3.8 * n, ny + 1.6], [nx + 2.6 * n, ny + 4.6 * n], [nx - 1.6, ny + 3.8 * n], [nx - 3.6, ny + 0.8]], nc, OUT); curve(ctx, [[nx + 0.4, ny + 3.2 * n], [nx + 1.4, ny + 3.6 * n]]); }
    else if (f.noseStyle === 'hook') { blob(ctx, [[nx - 3.4, ny - 3.6], [nx + 3 * n, ny - 2.6], [nx + 4.4 * n, ny + 1.8], [nx + 1.6 * n, ny + 3.4], [nx - 2.8, ny + 2.6]], nc, OUT); curve(ctx, [[nx + 0.2, ny + 1.8], [nx + 1.2, ny + 2.6]]); }
    else { oval(ctx, nx + 0.6, ny, 3.6 * n, 3 * n, nc, OUT); curve(ctx, [[nx - 1, ny + 1.2 * n], [nx - 0.2, ny + 2 * n], [nx + 0.8, ny + 1.8 * n]]); }
    if (sp.acc?.earring) oval(ctx, ex, cy + 4.2, 0.9, 0.9, GOLD, 0.5);
  }
  if (h && !(hw && ['durag', 'fitted', 'backcap', 'beanie', 'bucket', 'hood'].includes(hw.type))) {
    switch (h.style) {
      case 'spiky': poly(ctx, [[cx - rx * 0.9, cy + ry * 0.1], [cx - rx * 1.32, cy - ry * 0.6], [cx - rx * 0.72, cy - ry * 0.76], [cx - rx * 0.62, cy - ry * 1.46], [cx - rx * 0.1, cy - ry * 0.96], [cx + rx * 0.2, cy - ry * 1.52], [cx + rx * 0.46, cy - ry * 0.92], [cx + rx * 1.06, cy - ry * 1.16], [cx + rx * 0.82, cy - ry * 0.56], [cx - rx * 0.3, cy - ry * 0.46]], hc, OUT); break;
      case 'curly': for (let i = 0; i < 6; i++) oval(ctx, cx - rx * 0.8 + i * rx * 0.3, cy - ry * 0.86 + Math.abs(i - 2.5) * 0.9, 2.4, 2.2, hc, OUT * 0.85); break;
      case 'afro': break;
      default:
        blob(ctx, ellPts(cx, cy, rx * 1.07, ry * 1.07, Math.PI * 0.82, Math.PI * 1.92, 14).concat([[cx + rx * 0.64, cy - ry * 0.46], [cx - rx * 0.2, cy - ry * 0.36], [cx - rx * 0.62, cy + ry * 0.12]]), hc, OUT);
        for (let i = 0; i < 3; i++) curve(ctx, [[cx - rx * 0.6 + i * rx * 0.4, cy - ry * 0.96], [cx - rx * 0.4 + i * rx * 0.4, cy - ry * 0.7]], 0.45, shade(hc, 0.35));
        if (h.style === 'bun') oval(ctx, cx - rx * 0.4, cy - ry * 1.12, 3, 2.6, hc, OUT);
        if (h.style === 'buzz') speckle(ctx, cx, cy - ry * 0.5, rx, ry * 0.5, shade(hc, -0.25), 16, Math.PI, Math.PI * 2, 4, 0.25);
    }
  }
  if (hw) {
    const c = hw.color || '#1d1a22';
    const dome = (k) => blob(ctx, ellPts(cx, cy, rx * k, ry * k, Math.PI * 0.9, Math.PI * 2.02, 14).concat([[cx + rx * 1.02, cy - ry * 0.3], [cx - rx * 0.9, cy - ry * 0.1]]), c, OUT);
    switch (hw.type) {
      case 'durag': dome(1.07); line(ctx, [[cx - rx * 0.2, cy - ry * 1.04], [cx + rx * 0.4, cy - ry * 0.5]], 0.6, shade(c, 0.4)); break;
      case 'fitted': dome(1.1); curve(ctx, [[cx - rx * 0.3, cy - ry * 1.08], [cx + rx * 0.2, cy - ry * 0.7], [cx + rx * 0.3, cy - ry * 0.3]], IN, shade(c, -0.35)); poly(ctx, [[cx + rx * 0.7, cy - ry * 0.44], [cx + rx * 1.8, cy - ry * 0.28], [cx + rx * 1.74, cy - ry * 0.1], [cx + rx * 0.7, cy - ry * 0.2]], shade(c, -0.15), OUT, 1); break;
      case 'backcap': dome(1.1); poly(ctx, [[cx - rx * 0.8, cy - ry * 0.34], [cx - rx * 1.74, cy - ry * 0.2], [cx - rx * 1.68, cy - ry * 0.02], [cx - rx * 0.8, cy - ry * 0.1]], shade(c, -0.15), OUT, 1); break;
      case 'beanie': blob(ctx, ellPts(cx, cy - ry * 0.3, rx * 1.12, ry * 0.97, Math.PI * 0.95, Math.PI * 2.05, 14), c, OUT); rrect(ctx, cx - rx * 1.12, cy - ry * 0.52, rx * 2.24, ry * 0.32, 1, shade(c, 0.12), OUT); for (let i = -3; i <= 3; i++) line(ctx, [[cx + i * rx * 0.3, cy - ry * 0.48], [cx + i * rx * 0.3, cy - ry * 0.24]], 0.4, shade(c, -0.25)); if (hw.accent) oval(ctx, cx - 1, cy - ry * 1.38, 2.2, 2, hw.accent, OUT); break;
      case 'bucket': blob(ctx, ellPts(cx, cy - ry * 0.46, rx * 0.92, ry * 0.82, Math.PI, Math.PI * 2, 12), c, OUT); poly(ctx, [[cx - rx * 1.52, cy - ry * 0.04], [cx - rx * 0.92, cy - ry * 0.52], [cx + rx * 0.96, cy - ry * 0.52], [cx + rx * 1.58, cy - ry * 0.04]], shade(c, -0.08), OUT, 1.4); break;
      case 'hood': {
        const rim = [[cx + rx * 0.62, cy - ry * 1.08], [cx + rx * 0.16, cy - ry * 0.3], [cx + rx * 0.02, cy + ry * 0.4], [cx + rx * 0.36, cy + ry * 1.08]];
        blob(ctx, rim.concat(ellPts(cx - 0.8, cy + 0.6, rx * 1.16, ry * 1.12, Math.PI * 0.62, Math.PI * 1.62, 12)), c, OUT);
        smooth(ctx, rim, false);
        ctx.lineWidth = 3.6; ctx.strokeStyle = K; ctx.stroke();
        ctx.lineWidth = 2; ctx.strokeStyle = shade(c, 0.16); ctx.stroke();
        line(ctx, [[cx + rx * 0.2, cy + ry * 1.06], [cx + rx * 0.3, cy + ry * 1.06 + 6]], 0.8, '#e4e0ec');
        break;
      }
    }
  }
  const e = sp.eyes;
  if (e?.type === 'juliet') blob(ctx, [[cx + rx * 0.1, cy - ry * 0.5], [cx + rx * 1.16, cy - ry * 0.46], [cx + rx * 1.06, cy - ry * 0.06], [cx + rx * 0.2, cy - ry * 0.1]], e.color || C.sky2, OUT);
  else if (e) rrect(ctx, cx + rx * 0.18, cy - ry * 0.5, rx * 0.98, 4, 1.4, '#16121c', OUT);
}
function sideFigure(ctx, sp, ph) {
  const skin = sp.skin, t = sp.top, l = sp.legs || { type: 'jeans', color: '#3a5fa8' }, sh = sp.shoes || {};
  const legPose = (p) => { const s = Math.sin(p), c = Math.cos(p); const a = 0.56 * s; const bend = c > 0 ? 1.15 * c : 0.05; return { a, b: a - bend }; };
  const near = legPose(ph), far = legPose(ph + Math.PI);
  const legAt = (p, hip) => { const knee = [hip[0] + Math.sin(p.a) * 10, hip[1] + Math.cos(p.a) * 10]; return { knee, ank: [knee[0] + Math.sin(p.b) * 9.6, knee[1] + Math.cos(p.b) * 9.6] }; };
  let hip = [0, -22.2];
  const lift = -2.8 - Math.max(legAt(near, hip).ank[1], legAt(far, hip).ank[1]);
  const hop = 1.8 * Math.abs(Math.cos(ph)); // bouncy cartoon walk: the body springs up between steps
  hip = [0, -22.2 + lift - hop];
  const N = legAt(near, hip), F = legAt(far, hip);
  const squash = Math.pow(Math.abs(Math.sin(ph)), 6);
  ctx.save();
  ctx.scale(1 + squash * 0.04, 1 - squash * 0.04);
  const lw = l.type === 'baggy' ? 5.8 : l.type === 'cargo' ? 5.2 : 4.6;
  const leg = (L, p, dim) => {
    const pc = dim ? shade(l.color, -0.14) : l.color, sk = dim ? shade(skin, -0.1) : skin;
    if (l.type === 'shorts') {
      const mid = [(hip[0] + L.knee[0]) / 2, (hip[1] + L.knee[1]) / 2];
      tube(ctx, [mid, L.knee, L.ank], 2.4, sk, OUT);
      if (sp.socks) tube(ctx, [[(L.knee[0] + L.ank[0] * 2) / 3, (L.knee[1] + L.ank[1] * 2) / 3], L.ank], 3.1, dim ? '#e4e0ec' : '#ffffff', OUT);
      tube(ctx, [hip, [mid[0] * 1.15, mid[1] + 1]], 6, pc, OUT);
    } else {
      tube(ctx, [hip, L.knee, L.ank], lw, pc, OUT);
      curve(ctx, [[L.knee[0] - 1.4, L.knee[1] - 1], [L.knee[0] + 0.2, L.knee[1] - 0.2], [L.knee[0] + 1.6, L.knee[1] - 0.8]]);
      if (l.type === 'track') line(ctx, [[hip[0] - 1.8, hip[1]], [L.knee[0] - 1.8, L.knee[1]], [L.ank[0] - 1.6, L.ank[1]]], 0.8, l.accent || '#ffffff', true);
      if (l.type === 'baggy') oval(ctx, L.ank[0], L.ank[1] - 0.4, 3.6, 1.6, shade(pc, -0.08), OUT, p.b);
      if (l.type === 'cargo') rrect(ctx, (hip[0] + L.knee[0]) / 2 - 1.6, (hip[1] + L.knee[1]) / 2 - 1.6, 3.4, 3.8, 0.6, shade(pc, -0.1), OUT * 0.7);
    }
    shoeSide(ctx, L.ank, Math.max(-0.45, Math.min(0.32, -p.b * 0.5)), sh, skin, dim);
  };
  const long = t.type === 'parka' || t.type === 'trench';
  const wide = t.type === 'puffer' ? 1.5 : 0;
  const short = ['tee', 'jersey', 'tank', 'polo'].includes(t.type);
  const shoulder = [1, hip[1] - 13.8];
  const arm = (sw, dim) => {
    const e = [shoulder[0] + Math.sin(sw) * 7, shoulder[1] + Math.cos(sw) * 7];
    const s2 = sw + 0.35 + Math.max(0, sw) * 0.9;
    const w = [e[0] + Math.sin(s2) * 6.2, e[1] + Math.cos(s2) * 6.2];
    const sc = dim ? shade(t.color, -0.14) : t.color, sk = dim ? shade(skin, -0.1) : skin;
    if (short || t.type === 'tank') { tube(ctx, [shoulder, e, w], 2.4, sk, OUT); if (t.type !== 'tank') sleeve(ctx, shoulder, [(shoulder[0] * 1.2 + e[0]) / 2.2, (shoulder[1] * 1.2 + e[1]) / 2.2], 4.4, sc, t.type === 'jersey' || t.type === 'polo' ? t.accent || '#ffffff' : null); }
    else {
      tube(ctx, [shoulder, e, w], t.type === 'puffer' ? 4.8 : 3.4, sc, OUT);
      tube(ctx, [[w[0] + (e[0] - w[0]) * 0.22, w[1] + (e[1] - w[1]) * 0.22], w], (t.type === 'puffer' ? 4.8 : 3.4) + 0.8, shade(sc, -0.1), OUT);
      if (t.type === 'track') line(ctx, [shoulder, e, w].map(([x, y]) => [x - 1.3, y]), 0.7, t.accent || '#fff', true);
    }
    hand(ctx, w[0], w[1] + 0.4, s2 + Math.PI / 2 - 0.2, sk, 'fist', 1, 0.95);
  };
  const sw = Math.sin(ph) * 0.85;
  arm(sw, true);
  leg(F, far, true);
  leg(N, near, false);
  if (sp.acc?.backpack) { rrect(ctx, -10, hip[1] - 16, 6.6, 11, 2.2, sp.acc.backpack, OUT); line(ctx, [[-9, hip[1] - 12], [-4.2, hip[1] - 12]], 0.5); }
  const ty = hip[1], tb = long ? ty + 9 : ty + 0.8;
  const pts = [[-4.6 - wide, tb], [-4.8 - wide, ty - 9], [-4 - wide, ty - 14.8], [-0.6, ty - 16.4], [4.8 + wide, ty - 15.2], [5.6 + wide, ty - 10], [5.6 + wide + (sp.belly ? 2.2 : 0), ty - 4], [5 + wide, tb]];
  const P = () => roundPoly(ctx, pts, 2);
  P(); ink(ctx, t.color, OUT);
  const a = t.accent || '#ffffff';
  clip(ctx, P, () => {
    switch (t.type) {
      case 'camo': for (const [x, y, k] of [[-2, -12, 0], [3, -8, 1], [0, -4, 0], [3, -14, 0], [-3, -6, 1]]) oval(ctx, x, ty + y, 2.6, 1.6, k ? shade(a, -0.2) : a, 0); break;
      case 'flannel': for (let y = ty - 17; y < tb; y += 3) rect(ctx, -7, y, 14, 1, a, 0); for (let x = -6; x < 7; x += 3) rect(ctx, x, ty - 17, 0.8, 30, shade(a, -0.18), 0); break;
      case 'puffer': for (let y = ty - 12; y < tb; y += 3.8) curve(ctx, [[-7, y], [0, y + 0.8], [7, y]]); break;
      case 'jersey': rect(ctx, -1, ty - 17, 2, 20, a, IN); text(ctx, t.num || '10', -0.2, ty - 8, { size: 5.4, fill: a, stroke: K, sw: 0.6 }); break;
      case 'hoodie': rrect(ctx, 0.6, ty - 7, 6, 5, 1.6, shade(t.color, -0.12), OUT * 0.8); rect(ctx, -8, ty - 0.8, 16, 1.6, shade(t.color, -0.1), IN); break;
      case 'jacket': line(ctx, [[4.8, ty - 15], [5.2, tb]], 0.9, a); rect(ctx, -8, tb - 1.8, 16, 1.8, a, IN); break;
      case 'trench': case 'parka': line(ctx, [[5, ty - 15], [5.4, tb]], 0.7); rrect(ctx, 0.6, ty - 2, 4, 3.6, 0.6, shade(t.color, -0.1), OUT * 0.7); break;
      case 'polo': line(ctx, [[3.8, ty - 15.8], [4.2, ty - 11]], 0.5); break;
      case 'tee': case 'tank': curve(ctx, [[-2, ty - 2], [0.6, ty - 0.6]]); break;
      case 'track': line(ctx, [[5, ty - 15], [5.4, tb]], 0.7, '#f0ecf8'); break;
    }
  });
  P(); ink(ctx, null, OUT);
  if (t.type === 'hoodie' || t.type === 'camo') { if (sp.head?.type !== 'hood') blob(ctx, [[-4.8, ty - 13.8], [-3.2, ty - 18], [1.6, ty - 17.4], [0, ty - 14.6]], shade(t.color, -0.1), OUT); line(ctx, [[3.4, ty - 16], [3.8, ty - 11]], 0.7, '#f0ecf8'); }
  if (t.type === 'polo') poly(ctx, [[0.4, ty - 16.4], [4.6, ty - 15.4], [3.2, ty - 13.2]], a, OUT * 0.8);
  if (t.type === 'puffer') oval(ctx, 0.6, ty - 16.4, 4.4, 2, t.color, OUT);
  if (sp.acc?.chain) line(ctx, [[1.2, ty - 16.2], [4.6, ty - 11.6], [5.4, ty - 15.2]], 1.1, GOLD, true);
  if (sp.acc?.sacoche) { line(ctx, [[-1, ty - 16], [3.6, ty - 4]], 0.8); rrect(ctx, 2, ty - 6.6, 5, 5, 1, '#1d1a22', OUT); }
  if (sp.acc?.bumbag) { line(ctx, [[-3.8, ty - 3.4], [4.6, ty - 15]], 0.9); rrect(ctx, 3.6, ty - 13.8, 3.8, 3.8, 1.2, sp.acc.bumbag, OUT); }
  arm(-sw, false);
  headSide(ctx, sp, 2.6 + Math.sin(ph * 2) * 0.3, ty - 26.6 + Math.abs(Math.sin(ph)) * 0.8, {});
  ctx.restore();
}

// ---------- builders ----------
function frame(R, draw) {
  const [c, ctx] = layer(CW, CH, R);
  ctx.translate(OX, OY);
  draw(ctx);
  return c;
}
export function buildWalker(spec, R) {
  const frames = Array.from({ length: 8 }, (_, i) => frame(R, (ctx) => sideFigure(ctx, spec, (i / 8) * Math.PI * 2)));
  const idle = frame(R, (ctx) => sideFigure(ctx, spec, Math.PI / 2 + 0.01));
  return { frames, idle };
}
// every pose a stander can snap between (held frames = the jumpy cartoon feel)
export function buildStander(spec, R) {
  const p = spec.pose || {};
  const mk = (o) => frame(R, (ctx) => frontFigure(ctx, spec, { ...p, ...o }));
  return {
    idle: mk({}),
    bob: mk({ squash: true, nod: 0.8 }),
    blink: mk({ blink: true }),
    talk: mk({ talk: 1 }),
    talk2: mk({ talk: 2, left: 'shrug', right: 'shrug', wide: true }),
    wave: mk({ right: 'wave', talk: 1 }),
    point: mk({ right: 'point', talk: 1 }),
    thumb: mk({ left: 'thumb', talk: 2 }),
    look: mk({ look: [-0.85, -0.2], tilt: -0.8 }),
    hop: mk({ hop: true, wide: true, left: 'wave', right: 'wave', talk: 1 }),
  };
}
// a lone head + shoulders (nosy neighbours in windows)
export function buildHead(spec, R) {
  const [c, ctx] = layer(34, 34, R);
  ctx.translate(17, 72);
  torsoFront(ctx, spec);
  headFront(ctx, spec, {});
  return c;
}

// ---------- faces ----------
const LIDS = ['#d98ad8', '#f29ab8', '#a9a0ff', '#8fd0ff', '#b8e07a', null, null];
export function randomFace(r) {
  return {
    shape: pick(r, ['egg', 'long', 'round', 'pear', 'bean']),
    eye: 0.9 + r() * 0.3, lid: r() * 0.55, lidColor: pick(r, LIDS), look: [r() - 0.5, r() * 0.4 - 0.2], cross: r() > 0.92,
    nose: 0.9 + r() * 0.45, noseStyle: pick(r, ['bulb', 'bulb', 'long', 'hook']),
    mouth: pick(r, ['grin', 'buck', 'flat', 'gap', 'smirk', 'frown', 'grin']), brow: pick(r, ['angry', 'worried', 'up', 'bushy', null]),
    stubble: r() > 0.65, bags: r() > 0.4, freckles: r() > 0.8, wrinkles: r() > 0.8, mustache: r() > 0.88, wart: r() > 0.9, blush: r() > 0.85, lashes: r() > 0.85,
  };
}

// ---------- Owners: dressed for the neighbourhood their store reps ----------
const counter = { left: 'counter', right: 'counter' };
export const OWNERS = {
  'north-america': { skin: C.skin[5], face: { shape: 'pear', lid: 0.42, nose: 1.15, mouth: 'grin', goldTooth: true, brow: 'up', bags: true }, hair: { style: 'fade', color: '#140e0a' }, head: { type: 'durag', color: '#1d1a26' }, top: { type: 'tee', color: '#ffffff', logo: false }, legs: { type: 'baggy', color: '#3a5fa8' }, shoes: { type: 'timbs' }, acc: { chain: true, beard: true }, pose: counter },
  canada: { skin: C.skin[4], face: { shape: 'long', lid: 0.34, nose: 1.05, noseStyle: 'long', mouth: 'smirk', stubble: true, bags: true, brow: 'angry' }, hair: { style: 'fade', color: '#140e0a' }, head: { type: 'beanie', color: '#1d1a22' }, top: { type: 'puffer', color: '#26232e' }, legs: { type: 'track', color: '#5a5868', accent: '#5a5868' }, shoes: { type: 'sneaker', color: '#ffffff', accent: '#16121c' }, acc: { chain: true }, pose: counter },
  'south-america': { skin: C.skin[3], face: { shape: 'round', lid: 0.2, nose: 1.15, mouth: 'gap', brow: 'up', freckles: true }, hair: { style: 'buzz', color: '#ffe066' }, eyes: { type: 'juliet', color: '#36c8ff' }, top: { type: 'jersey', color: '#ffdf00', accent: '#009739', num: '10' }, legs: { type: 'shorts', color: '#1d3f9f' }, shoes: { type: 'slides', color: '#1a1a1a', accent: '#ffffff' }, hairy: true, acc: { chain: true }, pose: counter },
  europe: { skin: C.skin[2], face: { shape: 'egg', lid: 0.45, nose: 1.2, noseStyle: 'hook', mouth: 'flat', brow: 'angry', bags: true }, hair: { style: 'fade', color: '#160e0a' }, top: { type: 'track', color: '#1e1c24', accent: '#ffffff', logo: C.green }, legs: { type: 'track', color: '#1e1c24', accent: '#ffffff' }, shoes: { type: 'sneaker', color: '#2b3caf', accent: '#36c8ff' }, acc: { sacoche: true, beard: true }, pose: counter },
  africa: { skin: C.skin[5], face: { shape: 'bean', lid: 0.24, nose: 1.15, mouth: 'grin', brow: 'up', bags: true }, hair: { style: 'fade', color: '#120a08' }, head: { type: 'bucket', color: '#f1e8d2' }, top: { type: 'jersey', color: '#3ec25a', accent: '#ffffff', num: '9' }, legs: { type: 'cargo', color: '#57604a' }, shoes: { type: 'slides', color: '#1a1a1a', accent: '#ffffff' }, socks: true, acc: { chain: true, earring: true }, pose: counter },
  asia: { skin: C.skin[6], face: { shape: 'long', lid: 0.5, lidColor: '#d98ad8', nose: 1, mouth: 'buck', brow: 'worried', lashes: true, bags: true }, hair: { style: 'spiky', color: '#ffe680' }, top: { type: 'camo', color: '#5e7340', accent: '#97ad62' }, legs: { type: 'cargo', color: '#1d1d24' }, shoes: { type: 'sneaker', color: '#ffffff', accent: C.red }, acc: { chain: true, earring: true }, pose: counter },
  oceania: { skin: C.skin[0], face: { shape: 'round', lid: 0.12, nose: 1.25, mouth: 'gap', brow: 'up', cross: true, freckles: true, blush: true }, hair: { style: 'mullet', color: '#8a5226' }, head: { type: 'backcap', color: '#ffffff', accent: '#1d3f8f' }, top: { type: 'polo', color: '#1d3f9f', accent: '#ffffff', logo: C.green }, legs: { type: 'shorts', color: '#1d1d24', accent: C.red }, shoes: { type: 'sneaker', color: '#ffd21f', accent: '#16121c' }, socks: true, hairy: true, acc: { bumbag: '#1d1d24' }, pose: counter },
};
// The booster: hood up, face swallowed by shadow, two white eyes and a gold grill
export const BOOSTER = { skin: '#3a2e40', shadowFace: true, face: { shape: 'egg' }, head: { type: 'hood', color: '#1f1c28' }, top: { type: 'hoodie', color: '#1f1c28', accent: GOLD, logo: false }, legs: { type: 'cargo', color: '#2e2e3a' }, shoes: { type: 'sneaker', color: '#ffffff', accent: GOLD }, acc: { chain: true }, pose: { left: 'hips' } };

// ---------- pedestrian wardrobe (they wear real stock) ----------
const STYLES = ['fade', 'buzz', 'afro', 'cornrows', 'locs', 'long', 'bun', 'curly', 'spiky', 'mullet'];
const HAIRS = ['#140e0a', '#2a1810', '#4a2a16', '#8a5226', '#d08a2f', '#ffe066', '#c22a4a', '#7a3fd6', '#ff6fb5'];
const HEADS = [null, null, { type: 'fitted' }, { type: 'durag' }, { type: 'beanie' }, { type: 'bucket' }, { type: 'hood' }, { type: 'backcap' }];
const TOP_MAP = { hoodie: 'hoodie', tee: 'tee', jersey: 'jersey', shirt: 'flannel', jacket: 'jacket', coat: 'parka' };
export function pedestrianSpec(top, pants, shoe, r) {
  const head = HEADS[Math.floor(r() * HEADS.length)];
  return {
    skin: C.skin[Math.floor(r() * C.skin.length)],
    face: randomFace(r),
    belly: r() > 0.8, hairy: r() > 0.6,
    hair: { style: STYLES[Math.floor(r() * STYLES.length)], color: HAIRS[Math.floor(r() * HAIRS.length)] },
    head: head ? { ...head, color: head.type === 'hood' ? top.color : ['#1d1a26', C.red, '#1d3f8f', '#2e8a52', '#f1e8d2', C.purple, C.orange][Math.floor(r() * 7)], accent: '#ffffff' } : null,
    eyes: r() > 0.9 ? { type: 'shades' } : null,
    top: { type: TOP_MAP[top.type] || 'tee', color: top.color, accent: top.accent },
    legs: pants ? { type: 'baggy', color: pants.color } : { type: ['jeans', 'baggy', 'track', 'cargo', 'shorts'][Math.floor(r() * 5)], color: ['#3a5fa8', '#1d1d24', '#57604a', '#5a5868', '#7a5a36', '#2f62e0'][Math.floor(r() * 6)], accent: '#ffffff' },
    shoes: shoe ? { type: 'sneaker', color: shoe.color, accent: shoe.accent } : { type: ['sneaker', 'timbs', 'sneaker', 'slides'][Math.floor(r() * 4)], color: ['#ffffff', '#16121c', C.red, C.blue][Math.floor(r() * 4)], accent: C.pink },
    socks: r() > 0.85,
    acc: { chain: r() > 0.7, backpack: r() > 0.85 ? pick(r, ['#3a3650', C.purple, C.orange]) : null, headphones: r() > 0.85 ? C.red : null, beard: r() > 0.82, earring: r() > 0.75, sacoche: r() > 0.88 },
  };
}
// nosy neighbours that pop up in windows
export const NEIGHBOURS = [
  { skin: C.skin[1], face: { shape: 'pear', lid: 0.1, lidColor: '#d98ad8', nose: 1.35, mouth: 'buck', bags: true, wrinkles: true, look: [0.6, 0.2], lashes: true }, hair: { style: 'curly', color: '#c8c2d6' }, eyes: null, top: { type: 'tee', color: C.hotpink, logo: false } },
  { skin: C.skin[4], face: { shape: 'long', lid: 0.5, nose: 1.4, noseStyle: 'long', mouth: 'frown', brow: 'bushy', stubble: true, bags: true, wart: true }, top: { type: 'tank', color: '#ffffff' } },
  { skin: C.skin[0], face: { shape: 'round', lid: 0, nose: 1.1, mouth: 'gap', brow: 'up', cross: true, freckles: true, blush: true }, hair: { style: 'bun', color: '#ff8a1f' }, top: { type: 'tee', color: C.teal, logo: false } },
  { skin: C.skin[3], face: { shape: 'egg', lid: 0.3, lidColor: '#a9a0ff', nose: 1.25, mouth: 'grin', brow: 'worried', mustache: true, wrinkles: true }, hair: { style: 'afro', color: '#2a1810' }, top: { type: 'tee', color: C.yellow, logo: false } },
];
export { rng };
