// MAD TV-style cartoon people: big lumpy heads, googly eyes under heavy lids, bulb noses, buck teeth,
// noodle limbs, giant shoes. Frames are drawn once into canvases (world units x R). Origin = between the feet.
import { K, C, layer, smooth, roundPoly, ink, rect, rrect, oval, poly, blob, line, tube, text, FONT, shade, mix, clip, ellPts, rng, pick } from './toon.js';

export const CW = 48, CH = 72;
const OX = 24, OY = 69;
export const FRAME = { w: CW, h: CH, ox: OX, oy: OY };
const OUT = 0.7;
const GOLD = C.gold;
const MOUTH = '#6a1426';

// ---------- small parts ----------
function hand(ctx, x, y, skin, s = 1, open = false, sc = 1) {
  if (open) {
    for (let i = 0; i < 4; i++) { const a = -Math.PI / 2 + (i - 1.2) * 0.36 * s; tube(ctx, [[x, y], [x + Math.cos(a) * 3.6 * sc, y + Math.sin(a) * 3.6 * sc]], 1.3 * sc, skin, OUT * 0.8); }
    tube(ctx, [[x, y + 0.4], [x - s * 2.8 * sc, y - 0.4 * sc]], 1.3 * sc, skin, OUT * 0.8);
    oval(ctx, x, y + 0.6 * sc, 2.1 * sc, 2 * sc, skin, OUT);
    return;
  }
  oval(ctx, x - s * 1.9 * sc, y - 0.9 * sc, 1 * sc, 1.3 * sc, skin, OUT * 0.9);
  oval(ctx, x, y, 2.3 * sc, 2.5 * sc, skin, OUT);
  line(ctx, [[x - 0.8 * sc, y + 0.7 * sc], [x - 0.8 * sc, y + 2.3 * sc]], 0.4);
  line(ctx, [[x + 0.7 * sc, y + 0.7 * sc], [x + 0.7 * sc, y + 2.3 * sc]], 0.4);
}
const headShape = (f) => ({ egg: [8.7, 10.1, -0.1], long: [7.8, 11.1, 0.05], round: [9.4, 9.3, 0.06], pear: [8.6, 9.7, 0.22], bean: [9.1, 9.9, 0.1] }[f.shape || 'egg']);
function headPts(cx, cy, rx, ry, jowl, n = 26, lean = 0) {
  const pts = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2, s = Math.sin(a), c = Math.cos(a);
    const k = 1 + jowl * Math.max(0, s);
    pts.push([cx + c * rx * k + lean * Math.max(0, s) * Math.max(0, c), cy + s * ry]);
  }
  return pts;
}
// one big googly eye with a heavy lid
function eye(ctx, x, y, rx, ry, f, o, px = 0, py = 0) {
  oval(ctx, x, y, rx, ry, '#ffffff', OUT);
  const lid = o.blink ? 1 : f.lid ?? 0.3;
  if (lid < 1) oval(ctx, x + px * rx * 0.42, y + py * ry * 0.4 + ry * 0.12, 0.85 * Math.min(1.2, rx / 2.6), 0.95 * Math.min(1.2, ry / 3.4), K, 0);
  if (lid > 0.02) {
    const ly = y - ry + ry * 2 * lid;
    clip(ctx, () => { ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); }, () => {
      ctx.beginPath();
      ctx.moveTo(x - rx - 1, y - ry - 1);
      ctx.lineTo(x + rx + 1, y - ry - 1);
      ctx.lineTo(x + rx + 1, ly);
      ctx.quadraticCurveTo(x, ly + (o.blink ? 0 : ry * 0.25), x - rx - 1, ly);
      ctx.closePath();
      ink(ctx, f.lidColor, 0);
      line(ctx, [[x - rx, ly], [x, ly + (o.blink ? 0 : ry * 0.25)], [x + rx, ly]], OUT, K, true);
    });
    oval(ctx, x, y, rx, ry, null, OUT);
  }
}
function nose(ctx, x, y, f, skin, side = 0) {
  const n = f.nose ?? 1, col = f.noseColor || mix(skin, '#ff6a6a', 0.22);
  if (f.noseStyle === 'long') { blob(ctx, side ? [[x - 3, y - 2.6], [x + 1.6 * n, y - 2.2], [x + 3.4 * n, y + 1.2], [x + 2.2 * n, y + 4 * n], [x - 1.6, y + 3.6 * n], [x - 3.2, y + 0.8]] : [[x - 2.2 * n, y - 3.4], [x + 2.2 * n, y - 3.4], [x + 3 * n, y + 2.4 * n], [x, y + 4.6 * n], [x - 3 * n, y + 2.4 * n]], col, OUT); return; }
  if (f.noseStyle === 'hook' && side) { blob(ctx, [[x - 3, y - 3.4], [x + 2.6 * n, y - 2.4], [x + 4 * n, y + 1.6], [x + 1.6 * n, y + 3.2], [x - 2.6, y + 2.4]], col, OUT); return; }
  oval(ctx, x + side * 0.6, y, 3 * n, 2.7 * n, col, OUT);
}
function mouth(ctx, x, y, f, o, w = 4.4, gold = false) {
  const teeth = gold ? GOLD : '#ffffff';
  if (o.talk) {
    blob(ctx, [[x - w * 0.62, y - 0.8], [x + w * 0.62, y - 0.8], [x + w * 0.5, y + 1.8], [x, y + 3.2], [x - w * 0.5, y + 1.8]], MOUTH, OUT);
    clip(ctx, () => smooth(ctx, [[x - w * 0.62, y - 0.8], [x + w * 0.62, y - 0.8], [x + w * 0.5, y + 1.8], [x, y + 3.2], [x - w * 0.5, y + 1.8]], true), () => {
      rect(ctx, x - w, y - 1.4, w * 2, 1.6, teeth, 0.4);
      oval(ctx, x, y + 3, w * 0.4, 1.4, '#ff6f8a', 0);
    });
    return;
  }
  switch (f.mouth) {
    case 'grin': case 'gap': {
      const pts = [[x - w, y - 1], [x - w * 0.5, y - 0.4], [x + w * 0.5, y - 0.4], [x + w, y - 1], [x + w * 0.5, y + 2], [x, y + 2.6], [x - w * 0.5, y + 2]];
      blob(ctx, pts, MOUTH, OUT);
      clip(ctx, () => smooth(ctx, pts, true), () => {
        rect(ctx, x - w, y - 1.6, w * 2, 2.2, teeth, 0.4);
        for (let i = -2; i <= 2; i++) line(ctx, [[x + i * w * 0.32, y - 1.4], [x + i * w * 0.32, y + 0.6]], 0.35);
        if (f.mouth === 'gap') rect(ctx, x + w * 0.05, y - 1.6, w * 0.28, 2.2, MOUTH, 0);
      });
      break;
    }
    case 'buck':
      line(ctx, [[x - w * 0.8, y - 0.2], [x, y + 0.5], [x + w * 0.8, y - 0.2]], OUT, K, true);
      rect(ctx, x - 1.3, y + 0.3, 1.25, 1.9, teeth, 0.45);
      rect(ctx, x + 0.05, y + 0.3, 1.25, 1.9, teeth, 0.45);
      break;
    case 'frown': line(ctx, [[x - w * 0.6, y + 1.2], [x, y - 0.2], [x + w * 0.6, y + 1.2]], OUT, K, true); break;
    case 'smirk': line(ctx, [[x - w * 0.6, y + 0.3], [x + w * 0.2, y + 0.6], [x + w * 0.75, y - 0.8]], OUT, K, true); break;
    default: line(ctx, [[x - w * 0.6, y], [x + w * 0.6, y]], OUT); line(ctx, [[x + w * 0.6, y - 0.6], [x + w * 0.66, y + 0.5]], 0.5);
  }
}
function brows(ctx, f, pts) {
  if (!f.brow) return;
  for (const [x0, y0, x1, y1] of pts) line(ctx, [[x0, y0], [x1, y1]], 1.1);
}

// ---------- hair + headwear (front) ----------
function capPts(cx, cy, rx, ry, drop = 0.3, k = 1.08) {
  const top = ellPts(cx, cy, rx * k, ry * k, Math.PI + 0.25, Math.PI * 2 - 0.25, 14);
  return top.concat([[cx + rx * 0.9, cy - ry * drop], [cx, cy - ry * (drop + 0.25)], [cx - rx * 0.9, cy - ry * drop]]);
}
function hairBackFront(ctx, sp, cx, cy, rx, ry) {
  const h = sp.hair, hc = h?.color || '#1e1612';
  if (sp.head?.type === 'hood') { blob(ctx, headPts(cx, cy + 1, rx * 1.38, ry * 1.25, 0.05, 20), sp.head.color, OUT); return; }
  if (!h) return;
  if (h.style === 'afro') blob(ctx, Array.from({ length: 22 }, (_, i) => { const a = (i / 22) * Math.PI * 2, b = i % 2 ? 1.05 : 1.16; return [cx + Math.cos(a) * rx * 1.42 * b, cy - 3 + Math.sin(a) * ry * 1.15 * b]; }), hc, OUT);
  if (h.style === 'long') poly(ctx, [[cx - rx * 1.05, cy - ry * 0.6], [cx + rx * 1.05, cy - ry * 0.6], [cx + rx * 1.2, cy + ry * 1.05], [cx - rx * 1.2, cy + ry * 1.05]], hc, OUT, 3);
  if (h.style === 'mullet') poly(ctx, [[cx - rx * 0.9, cy], [cx + rx * 0.9, cy], [cx + rx * 1.15, cy + ry * 0.95], [cx - rx * 1.15, cy + ry * 0.95]], hc, OUT, 2);
  if (h.style === 'locs') for (const s of [-1, 1]) for (let i = 0; i < 3; i++) tube(ctx, [[cx + s * (rx * 0.7 + i * 1.3), cy - ry * 0.5], [cx + s * (rx * 0.95 + i * 1.4), cy + ry * 0.9 + i]], 1.6, hc, OUT * 0.8);
  if (sp.head?.type === 'durag') { tube(ctx, [[cx + rx * 0.7, cy - ry * 0.3], [cx + rx * 1.02, cy + ry * 0.45], [cx + rx * 0.98, cy + ry * 0.85]], 1.8, sp.head.color, OUT); }
  if (sp.head?.type === 'backcap') poly(ctx, [[cx - rx * 0.6, cy - ry * 0.95], [cx + rx * 0.6, cy - ry * 0.95], [cx + rx * 0.45, cy - ry * 1.28], [cx - rx * 0.45, cy - ry * 1.28]], shade(sp.head.color, -0.12), OUT, 1);
}
function hairFront(ctx, sp, cx, cy, rx, ry) {
  const h = sp.hair, hc = h?.color || '#1e1612', hw = sp.head;
  if (h && !(hw && ['durag', 'fitted', 'backcap', 'beanie', 'bucket', 'hood'].includes(hw.type))) {
    switch (h.style) {
      case 'fade': case 'cornrows': case 'locs': case 'long': case 'mullet': case 'bun':
        blob(ctx, capPts(cx, cy, rx, ry, 0.42), hc, OUT);
        if (h.style === 'cornrows') for (let i = -2; i <= 2; i++) line(ctx, [[cx + i * 1.9, cy - ry * 0.7], [cx + i * 1.6, cy - ry * 1.02]], 0.45, shade(hc, 0.3));
        if (h.style === 'bun') oval(ctx, cx, cy - ry * 1.18, 3, 2.6, hc, OUT);
        break;
      case 'buzz': blob(ctx, capPts(cx, cy, rx, ry, 0.5, 1.03), hc, OUT); break;
      case 'curly': for (let i = -3; i <= 3; i++) oval(ctx, cx + i * rx * 0.28, cy - ry * 0.86 - (Math.abs(i) % 2) * 0.8 + Math.abs(i) * 0.6, 2.2, 2, hc, OUT * 0.8); break;
      case 'spiky': poly(ctx, [[cx - rx, cy - ry * 0.3], [cx - rx * 1.15, cy - ry * 1.05], [cx - rx * 0.6, cy - ry * 0.8], [cx - rx * 0.45, cy - ry * 1.45], [cx - rx * 0.05, cy - ry * 0.9], [cx + rx * 0.2, cy - ry * 1.5], [cx + rx * 0.4, cy - ry * 0.85], [cx + rx * 0.85, cy - ry * 1.25], [cx + rx * 0.75, cy - ry * 0.7], [cx + rx * 1.1, cy - ry * 0.3], [cx + rx * 0.5, cy - ry * 0.55], [cx - rx * 0.5, cy - ry * 0.55]], hc, OUT); break;
      case 'afro': break;
    }
  }
  if (!hw) return;
  const c = hw.color || '#1d1a22';
  switch (hw.type) {
    case 'durag': blob(ctx, capPts(cx, cy, rx, ry, 0.32, 1.06), c, OUT); line(ctx, [[cx, cy - ry * 1.04], [cx, cy - ry * 0.6]], 0.5, shade(c, 0.35)); break;
    case 'fitted':
      blob(ctx, capPts(cx, cy, rx, ry, 0.32, 1.12), c, OUT);
      poly(ctx, [[cx - rx * 1.05, cy - ry * 0.35], [cx + rx * 1.05, cy - ry * 0.35], [cx + rx * 0.8, cy - ry * 0.12], [cx - rx * 0.8, cy - ry * 0.12]], shade(c, -0.15), OUT, 1.2);
      if (hw.accent) text(ctx, 'B', cx, cy - ry * 0.75, { size: 4, fill: hw.accent, font: FONT.slab });
      break;
    case 'backcap':
      blob(ctx, capPts(cx, cy, rx, ry, 0.35, 1.12), c, OUT);
      oval(ctx, cx, cy - ry * 0.52, 2, 0.9, shade(c, -0.3), OUT * 0.8);
      break;
    case 'beanie':
      blob(ctx, ellPts(cx, cy - ry * 0.35, rx * 1.1, ry * 0.95, Math.PI, Math.PI * 2, 14).concat([[cx + rx * 1.1, cy - ry * 0.25], [cx - rx * 1.1, cy - ry * 0.25]]), c, OUT);
      rrect(ctx, cx - rx * 1.12, cy - ry * 0.55, rx * 2.24, ry * 0.32, 1.2, shade(c, 0.12), OUT);
      if (hw.accent) oval(ctx, cx, cy - ry * 1.38, 2.2, 2, hw.accent, OUT);
      break;
    case 'bucket':
      blob(ctx, ellPts(cx, cy - ry * 0.45, rx * 0.9, ry * 0.8, Math.PI, Math.PI * 2, 12).concat([[cx + rx * 0.9, cy - ry * 0.4], [cx - rx * 0.9, cy - ry * 0.4]]), c, OUT);
      poly(ctx, [[cx - rx * 1.5, cy - ry * 0.1], [cx - rx * 0.95, cy - ry * 0.52], [cx + rx * 0.95, cy - ry * 0.52], [cx + rx * 1.5, cy - ry * 0.1]], shade(c, -0.08), OUT, 1.5);
      break;
    case 'hood': break;
  }
}

// ---------- FRONT VIEW ----------
function headFront(ctx, sp, o) {
  const f = sp.face || {};
  const [rx, ry, jowl] = headShape(f);
  const cx = 0, cy = -50.5;
  const skin = sp.skin, face = sp.shadowFace ? '#0e0b14' : skin;
  tube(ctx, [[0, -39.5], [0, -43]], 3.6, skin, OUT);
  hairBackFront(ctx, sp, cx, cy, rx, ry);
  for (const s of [-1, 1]) oval(ctx, cx + s * rx * 0.98, cy + 1, 1.8, 2.5, face, OUT);
  blob(ctx, headPts(cx, cy, rx, ry, jowl), face, OUT);
  const fr = { ...f, lidColor: f.lidColor || shade(skin, -0.14) };
  if (sp.shadowFace) {
    // face lost in the hood's shadow: two eyes and the gold grill
    for (const s of [-1, 1]) { oval(ctx, cx + s * 2.4, cy - 1.5, 1.6, o.blink ? 0.3 : 2, '#ffffff', 0); if (!o.blink) oval(ctx, cx + s * 2.4 + 0.3, cy - 1.2, 0.6, 0.7, K, 0); }
    mouth(ctx, cx, cy + 4.8, { mouth: 'grin' }, o, 4.4, true);
  } else {
    if (sp.acc?.beard) blob(ctx, [[cx - rx * 0.95, cy + ry * 0.05], [cx - rx * 0.6, cy + ry * 0.75], [cx, cy + ry * 1.12], [cx + rx * 0.6, cy + ry * 0.75], [cx + rx * 0.95, cy + ry * 0.05], [cx + rx * 0.5, cy + ry * 0.45], [cx - rx * 0.5, cy + ry * 0.45]], sp.hair?.color || '#1e1612', OUT);
    if (f.stubble) dots(ctx, cx, cy, rx, ry, shade(skin, -0.35));
    mouth(ctx, cx, cy + ry * 0.64, f, o, 4.4 * (f.mouthW || 1));
    const er = 3.15 * (f.eye || 1), eh = 4.1 * (f.eye || 1), ey = cy - ry * 0.24;
    const look = o.look || f.look || [0, 0];
    for (const s of [-1, 1]) eye(ctx, cx + s * er * 0.94, ey, er, eh, fr, o, look[0] + (f.cross ? s * 0.6 : 0), look[1]);
    if (f.bags) for (const s of [-1, 1]) line(ctx, [[cx + s * er * 0.94 - er * 0.7, ey + eh + 0.6], [cx + s * er * 0.94, ey + eh + 1.2], [cx + s * er * 0.94 + er * 0.7, ey + eh + 0.6]], 0.45, K, true);
    const bw = { angry: [-0.9, 0.9], worried: [0.9, -0.9], up: [0.6, 0.6] }[f.brow] || [0, 0];
    brows(ctx, f, [-1, 1].map((s) => [cx + s * er * 1.6, ey - eh - 0.8 + (s < 0 ? bw[0] : bw[1]) * -0.6, cx + s * er * 0.3, ey - eh - 0.8 + (s < 0 ? bw[0] : bw[1]) * 0.6]));
    nose(ctx, cx, cy + ry * 0.24, f, skin);
    if (sp.acc?.earring) for (const s of [-1, 1]) oval(ctx, cx + s * rx * 1.02, cy + 3.6, 0.8, 0.8, GOLD, 0.4);
  }
  hairFront(ctx, sp, cx, cy, rx, ry);
  if (sp.head?.type === 'hood') {
    const hp = headPts(cx, cy + 0.6, rx * 1.18, ry * 1.12, 0.02, 20);
    ctx.save();
    smooth(ctx, hp, true);
    ctx.lineWidth = 2.6;
    ctx.strokeStyle = shade(sp.head.color, 0.14);
    ctx.stroke();
    ctx.restore();
  }
  const e = sp.eyes;
  if (e?.type === 'juliet') { blob(ctx, [[cx - rx * 1.02, cy - ry * 0.48], [cx + rx * 1.02, cy - ry * 0.48], [cx + rx * 0.85, cy - ry * 0.02], [cx + 1.2, cy - ry * 0.12], [cx, cy - ry * 0.3], [cx - 1.2, cy - ry * 0.12], [cx - rx * 0.85, cy - ry * 0.02]], e.color || C.sky2, OUT); line(ctx, [[cx - rx * 0.6, cy - ry * 0.36], [cx - rx * 0.2, cy - ry * 0.36]], 0.6, '#ffffff'); }
  else if (e) { for (const s of [-1, 1]) rrect(ctx, cx + s * 3.2 - 2.9, cy - ry * 0.48, 5.8, 3.8, 1.4, '#16121c', OUT); line(ctx, [[cx - 0.4, cy - ry * 0.4], [cx + 0.4, cy - ry * 0.4]], OUT); line(ctx, [[cx - 4.6, cy - ry * 0.4], [cx - 3, cy - ry * 0.4]], 0.6, '#ffffff'); }
}
function dots(ctx, cx, cy, rx, ry, col) {
  const r = rng(Math.round(rx * 100 + ry * 7));
  ctx.fillStyle = col;
  ctx.beginPath();
  for (let i = 0; i < 26; i++) {
    const a = 0.25 * Math.PI + r() * 0.5 * Math.PI, d = 0.55 + r() * 0.38;
    const x = cx + Math.cos(a) * rx * d, y = cy + Math.sin(a) * ry * d;
    ctx.moveTo(x + 0.28, y);
    ctx.arc(x, y, 0.28, 0, Math.PI * 2);
  }
  ctx.fill();
}

function shoeFront(ctx, s, sh, skin) {
  const x = s * 4.9, type = sh.type || 'sneaker', col = sh.color || '#ffffff';
  if (type === 'slides') {
    oval(ctx, x, -0.9, 4.8, 1.5, col, OUT);
    oval(ctx, x, -2.2, 3.4, 1.8, skin, OUT);
    rrect(ctx, x - 3.6, -4.4, 7.2, 2.4, 1, sh.accent || '#ffffff', OUT);
    return;
  }
  if (type === 'timbs') {
    poly(ctx, [[x - 3.4, -8.4], [x + 3.4, -8.4], [x + 4.2, -2.6], [x + 5.2, 0.4], [x - 5.2, 0.4], [x - 4.2, -2.6]], '#e8a73c', OUT, 1.6);
    rrect(ctx, x - 5.2, -1, 10.4, 1.6, 0.6, '#7a4a1e', OUT * 0.8);
    rrect(ctx, x - 3.6, -9, 7.2, 1.9, 0.8, '#c8862a', OUT * 0.8);
    line(ctx, [[x - 1, -7.4], [x + 1, -6.2], [x - 1, -5], [x + 1, -3.8]], 0.5, '#7a4a1e');
    return;
  }
  poly(ctx, [[x - 3.8, -5.6], [x + 3.8, -5.6], [x + 5.2, -1.8], [x + 5, 0.4], [x - 5, 0.4], [x - 5.2, -1.8]], col, OUT, 2);
  rrect(ctx, x - 5.1, -1.5, 10.2, 2, 1, sh.sole || '#f4f0ff', OUT * 0.8);
  if (sh.accent) line(ctx, [[x - 4, -3.4], [x, -2.4], [x + 4, -3.4]], 1.2, sh.accent, true);
  line(ctx, [[x - 1.4, -5.2], [x + 1.4, -5.2]], 0.45); line(ctx, [[x - 1.2, -4.2], [x + 1.2, -4.2]], 0.45);
}
function legsFront(ctx, sp) {
  const l = sp.legs || { type: 'jeans', color: '#3a5fa8' }, skin = sp.skin;
  for (const s of [-1, 1]) {
    const hip = [s * 3.3, -23], knee = [s * 3.8, -13], ank = [s * 3.7, -4];
    if (l.type === 'shorts') {
      tube(ctx, [[s * 3.6, -16], knee, ank], 2.2, skin, OUT);
      if (sp.socks) tube(ctx, [[s * 3.75, -9.5], ank], 2.9, '#ffffff', OUT);
      poly(ctx, s < 0 ? [[-0.2, -24], [-7.4, -24], [-7.8, -14.6], [-1.2, -14.6]] : [[0.2, -24], [7.4, -24], [7.8, -14.6], [1.2, -14.6]], l.color, OUT, 0.8);
    } else {
      const w = l.type === 'baggy' ? 5.8 : l.type === 'cargo' ? 5.2 : 4.4;
      tube(ctx, [hip, knee, ank], w, s < 0 ? shade(l.color, -0.06) : l.color, OUT);
      if (l.type === 'baggy') oval(ctx, ank[0], ank[1] - 0.6, 3.6, 1.6, shade(l.color, -0.1), OUT);
      if (l.type === 'track') line(ctx, [[s * 5.4, -22.6], [s * 6, -13], [s * 5.8, -5]], 0.7, l.accent || '#ffffff', true);
      if (l.type === 'cargo') rrect(ctx, s * 5.4 - 1.6, -17, 3.2, 3.4, 0.6, shade(l.color, -0.12), OUT * 0.7);
      if (sp.socks) tube(ctx, [[s * 3.75, -7], ank], 3.1, '#ffffff', OUT);
    }
  }
  for (const s of [-1, 1]) shoeFront(ctx, s, sp.shoes || {}, skin);
}
function torsoFront(ctx, sp) {
  const t = sp.top, a = t.accent || '#ffffff';
  const long = t.type === 'parka' || t.type === 'trench';
  const wide = t.type === 'puffer' ? 1.8 : 0, belly = sp.belly ? 1.6 : 0;
  const by = long ? -10 : -21.8;
  const pts = [[-7.8 - wide, -38.2], [-8.4 - wide, -32], [-6.6 - wide - belly, by + 1.2], [6.6 + wide + belly, by + 1.2], [8.4 + wide, -32], [7.8 + wide, -38.2], [3.6, -40.2], [-3.6, -40.2]];
  const P = () => roundPoly(ctx, pts, 2.2);
  P(); ink(ctx, t.color, OUT);
  clip(ctx, P, () => {
    switch (t.type) {
      case 'camo': for (const [x, y, k] of [[-4, -35, 0], [3, -31, 1], [-2, -27, 0], [5, -37, 0], [0, -24, 1], [-6, -30, 1]]) oval(ctx, x, y, 2.8, 1.7, k ? shade(a, -0.2) : a, 0); break;
      case 'flannel': for (let y = -41; y < by; y += 2.8) rect(ctx, -12, y, 24, 0.9, a, 0); for (let x = -11; x < 12; x += 2.8) rect(ctx, x, -41, 0.7, 40, shade(a, -0.15), 0); break;
      case 'puffer': for (let y = -35; y < by; y += 3.6) line(ctx, [[-11, y], [0, y + 0.6], [11, y]], 0.55, K, true); break;
      case 'jersey': text(ctx, t.num || '10', 0, -30.5, { size: 7.5, fill: a, stroke: K, sw: 0.7, font: FONT.slab }); rect(ctx, -9, -40, 2, 30, a, 0); rect(ctx, 7, -40, 2, 30, a, 0); break;
      case 'tee': case 'tank': if (t.logo !== false) oval(ctx, 0, -33.5, 2.6, 2.2, a, OUT * 0.8); break;
      case 'hoodie': rrect(ctx, -4.6, -29, 9.2, 5.6, 2, shade(t.color, -0.12), OUT * 0.8); if (t.logo !== false) rrect(ctx, -3.4, -36.2, 6.8, 2.6, 0.6, a, OUT * 0.7); break;
      case 'track': line(ctx, [[0, -40], [0, by]], 0.6, '#f0ecf8'); if (t.logo) oval(ctx, 3.6, -35.6, 0.9, 0.7, t.logo, 0); break;
      case 'trench': case 'parka': line(ctx, [[0, -40], [0, by]], 0.6); rrect(ctx, -6.2, -21, 3.6, 3.2, 0.6, shade(t.color, -0.1), OUT * 0.7); rrect(ctx, 2.6, -21, 3.6, 3.2, 0.6, shade(t.color, -0.1), OUT * 0.7); break;
      case 'jacket': line(ctx, [[0, -40], [0, by]], 0.8, a); rect(ctx, -9, by - 1.6, 18, 1.6, a, 0); break;
      case 'polo': line(ctx, [[0, -39.6], [0, -34]], 0.5); oval(ctx, 0, -36, 0.4, 0.4, K, 0); oval(ctx, 0, -35, 0.4, 0.4, K, 0); if (t.logo) oval(ctx, 3.8, -35.6, 1, 0.8, t.logo, 0); break;
    }
  });
  P(); ink(ctx, null, OUT);
  if (t.type === 'polo') { poly(ctx, [[-3.6, -40.4], [0, -38.4], [-1.2, -36.4], [-4, -38.6]], a, OUT * 0.8); poly(ctx, [[3.6, -40.4], [0, -38.4], [1.2, -36.4], [4, -38.6]], a, OUT * 0.8); }
  else if (t.type === 'hoodie' && sp.head?.type !== 'hood') oval(ctx, 0, -40.4, 5.4, 1.9, shade(t.color, -0.12), OUT);
  else if (t.type === 'puffer') oval(ctx, 0, -40.4, 5.8, 2.4, t.color, OUT);
  else if (['tee', 'jersey', 'tank'].includes(t.type)) line(ctx, [[-2.8, -40.2], [0, -38.2], [2.8, -40.2]], OUT, t.type === 'jersey' ? a : K, true);
}
function armsFront(ctx, sp, o) {
  const t = sp.top, skin = sp.skin;
  const wide = t.type === 'puffer' ? 1.8 : 0;
  const short = ['tee', 'jersey', 'tank', 'polo'].includes(t.type);
  const aw = t.type === 'puffer' ? 4.6 : 3.2;
  const pose = (s) => (s > 0 ? o.right : o.left) || 'down';
  for (const s of [-1, 1]) {
    const p = pose(s), sh = [s * (7 + wide), -37.2];
    const pts = p === 'wave' ? [sh, [s * (13.4 + wide), -41.6], [s * (12.6 + wide), -50]]
      : p === 'counter' ? [sh, [s * (11 + wide), -29.6], [s * (6.4 + wide), -24.6]]
      : p === 'hips' ? [sh, [s * (13 + wide), -30.6], [s * (8.6 + wide), -25]]
      : [sh, [s * (9.8 + wide), -30], [s * (9.8 + wide), -22.4]];
    if (t.type === 'tank') tube(ctx, pts, 2.2, skin, OUT);
    else if (short) { tube(ctx, pts, 2.2, skin, OUT); tube(ctx, [pts[0], [(pts[0][0] * 1.6 + pts[1][0]) / 2.6, (pts[0][1] * 1.6 + pts[1][1]) / 2.6]], aw + 1, s < 0 ? shade(t.color, -0.05) : t.color, OUT); }
    else { tube(ctx, pts, aw, s < 0 ? shade(t.color, -0.05) : t.color, OUT); if (t.type === 'track') line(ctx, pts.map(([x, y]) => [x + s * 1.3, y]), 0.6, t.accent || '#fff', true); }
    hand(ctx, pts[2][0], pts[2][1] + (p === 'wave' ? -0.5 : 0.8), skin, s, p === 'wave');
  }
}
function chestAcc(ctx, sp) {
  const a = sp.acc || {};
  if (a.chain) { line(ctx, [[-3.6, -40.4], [0, -34], [3.6, -40.4]], 1, GOLD, true); oval(ctx, 0, -33.4, 1.3, 1.5, GOLD, 0.45); }
  if (a.sacoche) { line(ctx, [[-6.4, -39.6], [5, -26.6]], 0.8); rrect(ctx, 2.8, -29.4, 6.2, 5.4, 1, '#1d1a22', OUT); rect(ctx, 4, -27.6, 3.6, 0.6, '#d8d4e4', 0); }
  if (a.bumbag) { line(ctx, [[-7.4, -27], [6.4, -39.6]], 0.9); rrect(ctx, -4.2, -37.2, 8, 4.4, 1.6, a.bumbag, OUT); line(ctx, [[-3.2, -35.6], [2.8, -35.6]], 0.4, '#d8d4e4'); }
  if (a.headphones) { line(ctx, [[-4, -41], [0, -39.6], [4, -41]], 0.9, K, true); oval(ctx, -4.2, -40.8, 1.5, 1.5, a.headphones, 0.45); oval(ctx, 4.2, -40.8, 1.5, 1.5, a.headphones, 0.45); }
}
function frontFigure(ctx, sp, o = {}) {
  legsFront(ctx, sp);
  if (sp.acc?.backpack) for (const s of [-1, 1]) line(ctx, [[s * 5, -39.6], [s * 6, -24]], 1.1, sp.acc.backpack);
  torsoFront(ctx, sp);
  chestAcc(ctx, sp);
  armsFront(ctx, sp, o);
  headFront(ctx, sp, o);
}

// ---------- SIDE VIEW (walkers, facing right) ----------
function shoeSide(ctx, ank, ang, sh, skin, dim) {
  const type = sh.type || 'sneaker', col = dim ? shade(sh.color || '#ffffff', -0.1) : sh.color || '#ffffff';
  ctx.save();
  ctx.translate(ank[0], ank[1]);
  ctx.rotate(ang);
  if (type === 'slides') {
    rrect(ctx, -3.4, 1.4, 12.4, 1.4, 0.7, col, OUT);
    blob(ctx, [[-2.8, 1.4], [-2.4, -1], [2.6, -0.4], [8, 0.6], [8.4, 1.6]], dim ? shade(skin, -0.08) : skin, OUT);
    rect(ctx, 1.8, -0.4, 3, 2, sh.accent || '#ffffff', OUT * 0.8);
  } else if (type === 'timbs') {
    poly(ctx, [[-3.4, -5.6], [2.6, -5.6], [3.2, -1.8], [8.6, -0.6], [9.6, 2.6], [-3.6, 2.6]], dim ? '#c88a2a' : '#e8a73c', OUT, 1.4);
    rect(ctx, -3.6, 1.6, 13.2, 1.2, '#7a4a1e', OUT * 0.8);
  } else {
    poly(ctx, [[-3.6, -2.6], [1.8, -3.2], [5, -1.4], [9.4, -0.2], [10.4, 2.6], [-3.8, 2.6]], col, OUT, 1.6);
    rect(ctx, -3.8, 1.2, 14.2, 1.6, sh.sole || '#f4f0ff', OUT * 0.8);
    if (sh.accent) line(ctx, [[-2.2, 0.2], [2.6, -0.8], [6.4, 0.4]], 1.1, sh.accent, true);
  }
  ctx.restore();
}
function sideFigure(ctx, sp, ph) {
  const skin = sp.skin, t = sp.top, l = sp.legs || { type: 'jeans', color: '#3a5fa8' }, sh = sp.shoes || {}, f = sp.face || {};
  const legPose = (p) => { const s = Math.sin(p), c = Math.cos(p); const a = 0.5 * s; const bend = c > 0 ? 0.95 * c : 0.05; return { a, b: a - bend, bend }; };
  const near = legPose(ph), far = legPose(ph + Math.PI);
  const legAt = (p, hip) => { const knee = [hip[0] + Math.sin(p.a) * 10, hip[1] + Math.cos(p.a) * 10]; return { knee, ank: [knee[0] + Math.sin(p.b) * 9.6, knee[1] + Math.cos(p.b) * 9.6] }; };
  let hip = [0, -22.2];
  const lift = -2.6 - Math.max(legAt(near, hip).ank[1], legAt(far, hip).ank[1]);
  hip = [0, -22.2 + lift];
  const N = legAt(near, hip), F = legAt(far, hip);
  const lw = l.type === 'baggy' ? 5.6 : l.type === 'cargo' ? 5 : 4.3;
  const leg = (L, p, dim) => {
    const pc = dim ? shade(l.color, -0.12) : l.color, sk = dim ? shade(skin, -0.1) : skin;
    if (l.type === 'shorts') {
      const mid = [(hip[0] + L.knee[0]) / 2, (hip[1] + L.knee[1]) / 2];
      tube(ctx, [mid, L.knee, L.ank], 2.2, sk, OUT);
      if (sp.socks) tube(ctx, [[(L.knee[0] + L.ank[0] * 2) / 3, (L.knee[1] + L.ank[1] * 2) / 3], L.ank], 2.9, dim ? '#e4e0ec' : '#ffffff', OUT);
      tube(ctx, [hip, [mid[0] * 1.15, mid[1] + 1]], 5.6, pc, OUT);
    } else {
      tube(ctx, [hip, L.knee, L.ank], lw, pc, OUT);
      if (l.type === 'track') line(ctx, [[hip[0] - 1.6, hip[1]], [L.knee[0] - 1.6, L.knee[1]], [L.ank[0] - 1.4, L.ank[1]]], 0.6, l.accent || '#ffffff', true);
      if (l.type === 'baggy') oval(ctx, L.ank[0], L.ank[1] - 0.4, 3.4, 1.5, shade(pc, -0.08), OUT, p.b);
    }
    shoeSide(ctx, L.ank, Math.max(-0.4, Math.min(0.3, -p.b * 0.45)), sh, skin, dim);
  };
  const long = t.type === 'parka' || t.type === 'trench';
  const wide = t.type === 'puffer' ? 1.4 : 0;
  const short = ['tee', 'jersey', 'tank', 'polo'].includes(t.type);
  const shoulder = [1, hip[1] - 13.8];
  const arm = (sw, dim) => {
    const e = [shoulder[0] + Math.sin(sw) * 6.8, shoulder[1] + Math.cos(sw) * 6.8];
    const s2 = sw + 0.3 + Math.max(0, sw) * 0.7;
    const hnd = [e[0] + Math.sin(s2) * 6.2, e[1] + Math.cos(s2) * 6.2];
    const sc = dim ? shade(t.color, -0.12) : t.color, sk = dim ? shade(skin, -0.1) : skin;
    if (short || t.type === 'tank') { tube(ctx, [shoulder, e, hnd], 2.2, sk, OUT); if (t.type !== 'tank') tube(ctx, [shoulder, [(shoulder[0] + e[0]) / 2, (shoulder[1] + e[1]) / 2]], 4, sc, OUT); }
    else { tube(ctx, [shoulder, e, hnd], t.type === 'puffer' ? 4.4 : 3.2, sc, OUT); if (t.type === 'track') line(ctx, [shoulder, e, hnd].map(([x, y]) => [x - 1.2, y]), 0.6, t.accent || '#fff', true); }
    hand(ctx, hnd[0], hnd[1] + 0.6, sk, 1, false, 0.95);
  };
  const sw = Math.sin(ph) * 0.62;
  // back to front: far arm, far leg, near leg, torso, near arm, head
  arm(sw, true);
  leg(F, far, true);
  leg(N, near, false);
  if (sp.acc?.backpack) rrect(ctx, -9.2, hip[1] - 15.6, 6, 10, 2, sp.acc.backpack, OUT);
  const ty = hip[1];
  const tb = long ? ty + 9 : ty + 0.8;
  const pts = [[-4.4 - wide, tb], [-4.6 - wide, ty - 9], [-3.8 - wide, ty - 14.6], [-0.6, ty - 16.2], [4.6 + wide, ty - 15], [5.4 + wide, ty - 10], [5.4 + wide + (sp.belly ? 2 : 0), ty - 4], [4.8 + wide, tb]];
  const P = () => roundPoly(ctx, pts, 2);
  P(); ink(ctx, t.color, OUT);
  const a = t.accent || '#ffffff';
  clip(ctx, P, () => {
    switch (t.type) {
      case 'camo': for (const [x, y, k] of [[-2, -12, 0], [3, -8, 1], [0, -4, 0], [3, -14, 0]]) oval(ctx, x, ty + y, 2.6, 1.6, k ? shade(a, -0.2) : a, 0); break;
      case 'flannel': for (let y = ty - 17; y < tb; y += 2.8) rect(ctx, -7, y, 14, 0.9, a, 0); for (let x = -6; x < 7; x += 2.8) rect(ctx, x, ty - 17, 0.7, 30, shade(a, -0.15), 0); break;
      case 'puffer': for (let y = ty - 12; y < tb; y += 3.6) line(ctx, [[-7, y], [7, y + 0.5]], 0.55); break;
      case 'jersey': rect(ctx, -1, ty - 17, 1.8, 20, a, 0); text(ctx, t.num || '10', -0.2, ty - 8, { size: 5, fill: a, stroke: K, sw: 0.5 }); break;
      case 'hoodie': rrect(ctx, 0.6, ty - 6.8, 5.6, 4.6, 1.6, shade(t.color, -0.12), OUT * 0.8); break;
      case 'jacket': line(ctx, [[4.6, ty - 15], [5, tb]], 0.8, a); break;
      case 'trench': case 'parka': line(ctx, [[4.8, ty - 15], [5.2, tb]], 0.6); break;
      case 'polo': line(ctx, [[3.6, ty - 15.6], [4, ty - 11]], 0.5); break;
    }
  });
  P(); ink(ctx, null, OUT);
  if (t.type === 'hoodie' && sp.head?.type !== 'hood') blob(ctx, [[-4.6, ty - 13.6], [-3, ty - 17.6], [1.4, ty - 17], [0, ty - 14.6]], shade(t.color, -0.1), OUT);
  if (t.type === 'polo') poly(ctx, [[0.4, ty - 16.2], [4.4, ty - 15.2], [3, ty - 13.2]], a, OUT * 0.8);
  if (sp.acc?.chain) line(ctx, [[1.2, ty - 16], [4.4, ty - 11.4], [5.2, ty - 15]], 0.9, GOLD, true);
  if (sp.acc?.sacoche) { line(ctx, [[-1, ty - 16], [3.4, ty - 4]], 0.7); rrect(ctx, 2, ty - 6.4, 4.6, 4.6, 1, '#1d1a22', OUT); }
  if (sp.acc?.bumbag) { line(ctx, [[-3.6, ty - 3.4], [4.4, ty - 15]], 0.8); rrect(ctx, 3.6, ty - 13.6, 3.4, 3.6, 1.2, sp.acc.bumbag, OUT); }
  arm(-sw, false);
  headSide(ctx, sp, [2.6, ty - 26.4], f);
}
function headSide(ctx, sp, [cx, cy], f) {
  const [rx0, ry, jowl] = headShape(f);
  const rx = rx0 * 0.94, skin = sp.skin, hc = sp.hair?.color || '#1e1612', hw = sp.head, h = sp.hair;
  tube(ctx, [[cx - 1.2, cy + ry * 0.8], [cx - 1.4, cy + ry * 1.25]], 3.4, skin, OUT);
  // behind the head
  if (hw?.type === 'hood') blob(ctx, headPts(cx - 1.6, cy + 0.6, rx * 1.3, ry * 1.2, 0, 18), hw.color, OUT);
  else if (h?.style === 'afro') blob(ctx, Array.from({ length: 20 }, (_, i) => { const a = (i / 20) * Math.PI * 2, b = i % 2 ? 1.05 : 1.15; return [cx - 1.4 + Math.cos(a) * rx * 1.35 * b, cy - 3 + Math.sin(a) * ry * 1.12 * b]; }), hc, OUT);
  else if (h?.style === 'long' || h?.style === 'mullet') poly(ctx, [[cx - rx * 0.9, cy - ry * 0.6], [cx + rx * 0.2, cy - ry * 0.6], [cx - rx * 0.4, cy + ry * (h.style === 'long' ? 1.15 : 1.05)], [cx - rx * 1.25, cy + ry * (h.style === 'long' ? 1.15 : 1.05)]], hc, OUT, 2);
  else if (h?.style === 'locs') for (let i = 0; i < 4; i++) tube(ctx, [[cx - rx * 0.4 - i * 1.2, cy - ry * 0.5], [cx - rx * 0.8 - i * 1.4, cy + ry * 0.9 + i]], 1.6, hc, OUT * 0.8);
  if (hw?.type === 'durag') tube(ctx, [[cx - rx * 0.7, cy - ry * 0.4], [cx - rx * 1.2, cy + ry * 0.4], [cx - rx * 1.4, cy + ry * 1.1]], 2.8, hw.color, OUT);
  const face = sp.shadowFace ? '#0e0b14' : skin;
  blob(ctx, headPts(cx, cy, rx, ry, jowl, 26, 1.4), face, OUT);
  oval(ctx, cx - rx * 0.28, cy + 1, 1.9, 2.5, face, OUT);
  if (!sp.shadowFace) line(ctx, [[cx - rx * 0.28 - 0.4, cy - 0.2], [cx - rx * 0.28 + 0.6, cy + 1.2]], 0.45);
  const fr = { ...f, lidColor: f.lidColor || shade(skin, -0.14) };
  if (sp.shadowFace) {
    oval(ctx, cx + rx * 0.62, cy - 1.6, 1.4, 1.8, '#ffffff', 0);
    oval(ctx, cx + rx * 0.62 + 0.5, cy - 1.4, 0.55, 0.65, K, 0);
    rrect(ctx, cx + rx * 0.4, cy + ry * 0.48, rx * 0.62, 1.8, 0.6, GOLD, 0.45);
  } else {
    if (sp.acc?.beard) blob(ctx, [[cx - rx * 0.2, cy + ry * 0.2], [cx + rx * 0.95, cy + ry * 0.45], [cx + rx * 0.7, cy + ry * 1.05], [cx - rx * 0.1, cy + ry * 0.85]], hc, OUT);
    if (f.stubble) dots(ctx, cx + 2, cy, rx * 0.9, ry, shade(skin, -0.35));
    const my = cy + ry * 0.58;
    if (['grin', 'gap'].includes(f.mouth)) {
      blob(ctx, [[cx + rx * 0.98, my - 0.9], [cx + rx * 0.35, my - 0.4], [cx + rx * 0.5, my + 1.8], [cx + rx * 0.95, my + 1.6]], MOUTH, OUT);
      rect(ctx, cx + rx * 0.5, my - 0.7, rx * 0.46, 1, '#ffffff', 0.35);
    } else if (f.mouth === 'buck') { line(ctx, [[cx + rx * 0.98, my], [cx + rx * 0.4, my + 0.3]], OUT); rect(ctx, cx + rx * 0.72, my + 0.2, 1.2, 1.8, '#ffffff', 0.45); }
    else line(ctx, [[cx + rx * 0.98, my + (f.mouth === 'frown' ? 0.6 : 0)], [cx + rx * 0.4, my + (f.mouth === 'smirk' ? -0.6 : 0.3)]], OUT);
    const er = 2.9 * (f.eye || 1), eh = 3.9 * (f.eye || 1), ey = cy - ry * 0.24;
    eye(ctx, cx + rx * 0.38, ey, er * 0.88, eh * 0.95, fr, {}, 0.8, 0);
    eye(ctx, cx + rx * 0.72, ey + 0.2, er, eh, fr, {}, 0.9, (f.look || [0, 0])[1]);
    if (f.brow) line(ctx, [[cx + rx * 0.3, ey - eh - 0.6 + (f.brow === 'angry' ? -0.6 : 0.4)], [cx + rx * 1.02, ey - eh - 0.4 + (f.brow === 'angry' ? 0.8 : -0.4)]], 1.1);
    nose(ctx, cx + rx * 1.02, cy + ry * 0.16, f, skin, 1);
    if (sp.acc?.earring) oval(ctx, cx - rx * 0.28, cy + 3.8, 0.8, 0.8, GOLD, 0.4);
  }
  // hair + hats on top
  if (h && !(hw && ['durag', 'fitted', 'backcap', 'beanie', 'bucket', 'hood'].includes(hw.type))) {
    switch (h.style) {
      case 'spiky': poly(ctx, [[cx - rx * 0.9, cy + ry * 0.1], [cx - rx * 1.3, cy - ry * 0.6], [cx - rx * 0.7, cy - ry * 0.75], [cx - rx * 0.6, cy - ry * 1.45], [cx - rx * 0.1, cy - ry * 0.95], [cx + rx * 0.2, cy - ry * 1.5], [cx + rx * 0.45, cy - ry * 0.9], [cx + rx * 1.05, cy - ry * 1.15], [cx + rx * 0.8, cy - ry * 0.55], [cx - rx * 0.3, cy - ry * 0.45]], hc, OUT); break;
      case 'curly': for (let i = 0; i < 6; i++) oval(ctx, cx - rx * 0.8 + i * rx * 0.3, cy - ry * 0.85 + Math.abs(i - 2.5) * 0.9, 2.2, 2, hc, OUT * 0.8); break;
      case 'afro': break;
      default:
        blob(ctx, ellPts(cx, cy, rx * 1.07, ry * 1.07, Math.PI * 0.82, Math.PI * 1.92, 14).concat([[cx + rx * 0.62, cy - ry * 0.45], [cx - rx * 0.2, cy - ry * 0.35], [cx - rx * 0.6, cy + ry * 0.1]]), hc, OUT);
        if (h.style === 'bun') oval(ctx, cx - rx * 0.4, cy - ry * 1.1, 2.8, 2.4, hc, OUT);
    }
  }
  if (hw) {
    const c = hw.color || '#1d1a22';
    const dome = (k) => blob(ctx, ellPts(cx, cy, rx * k, ry * k, Math.PI * 0.9, Math.PI * 2.02, 14).concat([[cx + rx * 1.02, cy - ry * 0.3], [cx - rx * 0.9, cy - ry * 0.1]]), c, OUT);
    switch (hw.type) {
      case 'durag': dome(1.07); break;
      case 'fitted': dome(1.1); poly(ctx, [[cx + rx * 0.7, cy - ry * 0.42], [cx + rx * 1.75, cy - ry * 0.28], [cx + rx * 1.7, cy - ry * 0.12], [cx + rx * 0.7, cy - ry * 0.2]], shade(c, -0.15), OUT, 1); break;
      case 'backcap': dome(1.1); poly(ctx, [[cx - rx * 0.8, cy - ry * 0.32], [cx - rx * 1.7, cy - ry * 0.2], [cx - rx * 1.65, cy - ry * 0.04], [cx - rx * 0.8, cy - ry * 0.1]], shade(c, -0.15), OUT, 1); break;
      case 'beanie': blob(ctx, ellPts(cx, cy - ry * 0.3, rx * 1.1, ry * 0.95, Math.PI * 0.95, Math.PI * 2.05, 14), c, OUT); rrect(ctx, cx - rx * 1.1, cy - ry * 0.5, rx * 2.2, ry * 0.3, 1, shade(c, 0.12), OUT); if (hw.accent) oval(ctx, cx - 1, cy - ry * 1.36, 2, 1.8, hw.accent, OUT); break;
      case 'bucket': blob(ctx, ellPts(cx, cy - ry * 0.45, rx * 0.9, ry * 0.8, Math.PI, Math.PI * 2, 12), c, OUT); poly(ctx, [[cx - rx * 1.5, cy - ry * 0.05], [cx - rx * 0.9, cy - ry * 0.5], [cx + rx * 0.95, cy - ry * 0.5], [cx + rx * 1.55, cy - ry * 0.05]], shade(c, -0.08), OUT, 1.4); break;
      case 'hood': {
        ctx.save();
        smooth(ctx, ellPts(cx - 0.6, cy + 0.4, rx * 1.12, ry * 1.1, -Math.PI * 0.45, Math.PI * 0.55, 12), false);
        ctx.lineWidth = 2.4;
        ctx.strokeStyle = shade(c, 0.14);
        ctx.stroke();
        ctx.restore();
        break;
      }
    }
  }
  const e = sp.eyes;
  if (e?.type === 'juliet') blob(ctx, [[cx + rx * 0.1, cy - ry * 0.5], [cx + rx * 1.15, cy - ry * 0.46], [cx + rx * 1.05, cy - ry * 0.08], [cx + rx * 0.2, cy - ry * 0.12]], e.color || C.sky2, OUT);
  else if (e) rrect(ctx, cx + rx * 0.2, cy - ry * 0.48, rx * 0.95, 3.6, 1.2, '#16121c', OUT);
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
export function buildStander(spec, R) {
  const p = spec.pose || {};
  return {
    idle: frame(R, (ctx) => frontFigure(ctx, spec, p)),
    blink: frame(R, (ctx) => frontFigure(ctx, spec, { ...p, blink: true })),
    talk: frame(R, (ctx) => frontFigure(ctx, spec, { ...p, talk: true })),
    wave: frame(R, (ctx) => frontFigure(ctx, spec, { ...p, right: 'wave', talk: true })),
    look: frame(R, (ctx) => frontFigure(ctx, spec, { ...p, look: [-0.8, -0.2] })),
  };
}
// a lone head + shoulders (nosy neighbours in windows)
export function buildHead(spec, R) {
  const [c, ctx] = layer(30, 30, R);
  ctx.translate(15, 68);
  torsoFront(ctx, spec);
  headFront(ctx, spec, {});
  return c;
}

// ---------- faces ----------
const LIDS = ['#d98ad8', '#f29ab8', '#a9a0ff', '#8fd0ff', null, null, null];
export function randomFace(r) {
  return {
    shape: pick(r, ['egg', 'long', 'round', 'pear', 'bean']),
    eye: 0.9 + r() * 0.35, lid: r() * 0.5, lidColor: pick(r, LIDS), look: [r() - 0.5, r() * 0.4 - 0.2], cross: r() > 0.92,
    nose: 0.85 + r() * 0.5, noseStyle: pick(r, ['bulb', 'bulb', 'long', 'hook']),
    mouth: pick(r, ['grin', 'buck', 'flat', 'gap', 'smirk', 'frown']), brow: pick(r, [null, 'angry', 'worried', 'up']),
    stubble: r() > 0.7, bags: r() > 0.5,
  };
}

// ---------- Owners: dressed for the neighbourhood their store reps ----------
const counter = { left: 'counter', right: 'counter' };
export const OWNERS = {
  'north-america': { skin: C.skin[5], face: { shape: 'pear', lid: 0.45, nose: 1.15, mouth: 'grin', brow: 'up', bags: true }, hair: { style: 'fade', color: '#140e0a' }, head: { type: 'durag', color: '#1d1a26' }, top: { type: 'tee', color: '#ffffff', logo: false }, legs: { type: 'baggy', color: '#3a5fa8' }, shoes: { type: 'timbs' }, acc: { chain: true, beard: true }, pose: counter },
  canada: { skin: C.skin[4], face: { shape: 'long', lid: 0.3, nose: 1, noseStyle: 'long', mouth: 'smirk', stubble: true }, hair: { style: 'fade', color: '#140e0a' }, head: { type: 'beanie', color: '#1d1a22' }, top: { type: 'puffer', color: '#26232e' }, legs: { type: 'track', color: '#5a5868', accent: '#5a5868' }, shoes: { type: 'sneaker', color: '#ffffff' }, acc: { chain: true }, pose: counter },
  'south-america': { skin: C.skin[3], face: { shape: 'round', lid: 0.2, nose: 1.1, mouth: 'gap', brow: 'up' }, hair: { style: 'buzz', color: '#ffe066' }, eyes: { type: 'juliet', color: '#36c8ff' }, top: { type: 'jersey', color: '#ffdf00', accent: '#009739', num: '10' }, legs: { type: 'shorts', color: '#1d3f9f' }, shoes: { type: 'slides', color: '#1a1a1a', accent: '#ffffff' }, acc: { chain: true }, pose: counter },
  europe: { skin: C.skin[2], face: { shape: 'egg', lid: 0.42, nose: 1.2, noseStyle: 'hook', mouth: 'flat', brow: 'angry' }, hair: { style: 'fade', color: '#160e0a' }, top: { type: 'track', color: '#1e1c24', accent: '#ffffff', logo: C.green }, legs: { type: 'track', color: '#1e1c24', accent: '#ffffff' }, shoes: { type: 'sneaker', color: '#2b3caf', accent: '#36c8ff' }, acc: { sacoche: true, beard: true }, pose: counter },
  africa: { skin: C.skin[5], face: { shape: 'bean', lid: 0.25, nose: 1.1, mouth: 'grin', brow: 'up' }, hair: { style: 'fade', color: '#120a08' }, head: { type: 'bucket', color: '#f1e8d2' }, top: { type: 'jersey', color: '#3ec25a', accent: '#ffffff', num: '9' }, legs: { type: 'cargo', color: '#57604a' }, shoes: { type: 'slides', color: '#1a1a1a', accent: '#ffffff' }, socks: true, acc: { chain: true, earring: true }, pose: counter },
  asia: { skin: C.skin[6], face: { shape: 'long', lid: 0.5, lidColor: '#d98ad8', nose: 0.95, mouth: 'buck', brow: 'worried' }, hair: { style: 'spiky', color: '#ffe680' }, top: { type: 'camo', color: '#5e7340', accent: '#97ad62' }, legs: { type: 'cargo', color: '#1d1d24' }, shoes: { type: 'sneaker', color: '#ffffff', accent: C.red }, acc: { chain: true, earring: true }, pose: counter },
  oceania: { skin: C.skin[0], face: { shape: 'round', lid: 0.15, nose: 1.2, mouth: 'gap', brow: 'up', cross: true }, hair: { style: 'mullet', color: '#8a5226' }, head: { type: 'backcap', color: '#ffffff', accent: '#1d3f8f' }, top: { type: 'polo', color: '#1d3f9f', accent: '#ffffff', logo: C.green }, legs: { type: 'shorts', color: '#1d1d24' }, shoes: { type: 'sneaker', color: '#ffd21f', accent: '#16121c' }, socks: true, acc: { bumbag: '#1d1d24' }, pose: counter },
};
// The booster: hood up, face swallowed by shadow, gold grill
export const BOOSTER = { skin: '#3a2e40', shadowFace: true, face: { shape: 'egg' }, head: { type: 'hood', color: '#1f1c28' }, top: { type: 'hoodie', color: '#1f1c28', accent: GOLD, logo: false }, legs: { type: 'cargo', color: '#2e2e3a' }, shoes: { type: 'sneaker', color: '#ffffff', accent: GOLD }, acc: { chain: true }, pose: { left: 'hips' } };

// ---------- pedestrian wardrobe (they wear real stock) ----------
const STYLES = ['fade', 'buzz', 'afro', 'cornrows', 'locs', 'long', 'bun', 'curly', 'spiky', 'mullet'];
const HAIRS = ['#140e0a', '#2a1810', '#4a2a16', '#8a5226', '#d08a2f', '#ffe066', '#c22a4a', '#7a3fd6'];
const HEADS = [null, null, { type: 'fitted' }, { type: 'durag' }, { type: 'beanie' }, { type: 'bucket' }, { type: 'hood' }, { type: 'backcap' }];
const TOP_MAP = { hoodie: 'hoodie', tee: 'tee', jersey: 'jersey', shirt: 'flannel', jacket: 'jacket', coat: 'parka' };
export function pedestrianSpec(top, pants, shoe, r) {
  const head = HEADS[Math.floor(r() * HEADS.length)];
  return {
    skin: C.skin[Math.floor(r() * C.skin.length)],
    face: randomFace(r),
    belly: r() > 0.8,
    hair: { style: STYLES[Math.floor(r() * STYLES.length)], color: HAIRS[Math.floor(r() * HAIRS.length)] },
    head: head ? { ...head, color: head.type === 'hood' ? top.color : ['#1d1a26', C.red, '#1d3f8f', '#2e8a52', '#f1e8d2', C.purple, C.orange][Math.floor(r() * 7)], accent: '#ffffff' } : null,
    eyes: r() > 0.88 ? { type: 'shades' } : null,
    top: { type: TOP_MAP[top.type] || 'tee', color: top.color, accent: top.accent },
    legs: pants ? { type: 'baggy', color: pants.color } : { type: ['jeans', 'baggy', 'track', 'cargo', 'shorts'][Math.floor(r() * 5)], color: ['#3a5fa8', '#1d1d24', '#57604a', '#5a5868', '#7a5a36', '#2f62e0'][Math.floor(r() * 6)], accent: '#ffffff' },
    shoes: shoe ? { type: 'sneaker', color: shoe.color, accent: shoe.accent } : { type: ['sneaker', 'timbs', 'sneaker', 'slides'][Math.floor(r() * 4)], color: ['#ffffff', '#16121c', C.red, C.blue][Math.floor(r() * 4)], accent: C.pink },
    socks: r() > 0.85,
    acc: { chain: r() > 0.7, backpack: r() > 0.85 ? pick(r, ['#3a3650', C.purple, C.orange]) : null, headphones: r() > 0.85 ? C.red : null, beard: r() > 0.8, earring: r() > 0.75, sacoche: r() > 0.88 },
  };
}
// nosy neighbours that pop up in windows
export const NEIGHBOURS = [
  { skin: C.skin[1], face: { shape: 'pear', lid: 0.1, lidColor: '#d98ad8', nose: 1.3, mouth: 'buck', bags: true, look: [0.6, 0.2] }, hair: { style: 'curly', color: '#c8c2d6' }, top: { type: 'tee', color: C.hotpink, logo: false } },
  { skin: C.skin[4], face: { shape: 'long', lid: 0.5, nose: 1.4, noseStyle: 'long', mouth: 'frown', brow: 'angry', stubble: true }, top: { type: 'tank', color: '#ffffff' } },
  { skin: C.skin[0], face: { shape: 'round', lid: 0, nose: 1, mouth: 'gap', brow: 'up', cross: true }, hair: { style: 'bun', color: '#ff8a1f' }, top: { type: 'tee', color: C.teal, logo: false } },
  { skin: C.skin[3], face: { shape: 'egg', lid: 0.3, lidColor: '#a9a0ff', nose: 1.2, mouth: 'grin', brow: 'worried' }, hair: { style: 'afro', color: '#2a1810' }, top: { type: 'tee', color: C.yellow, logo: false } },
];

// ---------- animals ----------
export function pigeonFrames(R) {
  const make = (mode) => {
    const [c, ctx] = layer(14, 12, R);
    ctx.translate(2, 2);
    if (mode >= 2) {
      // flying: wings up or down
      const up = mode === 2;
      poly(ctx, up ? [[3, 4], [1, -1.6], [6, 3.4]] : [[3, 4.6], [1, 9], [6, 5]], '#8a86a6', 0.5, 0.6);
      oval(ctx, 5, 4.6, 4, 2.2, '#a8a4c4', 0.6);
      oval(ctx, 8.6, 3.4, 1.8, 1.6, '#a8a4c4', 0.5);
      poly(ctx, [[10.2, 3.2], [11.6, 3.6], [10.2, 4]], '#f2a33a', 0.35);
      poly(ctx, up ? [[5, 4], [7.6, -2], [8, 3.6]] : [[5, 5], [8, 10], [8, 5]], '#9a96b6', 0.5, 0.6);
      return c;
    }
    const peck = mode === 1;
    oval(ctx, 4.6, 5.4, 3.8, 2.6, '#a8a4c4', 0.6);
    poly(ctx, [[1.2, 4.6], [-1, 4], [1.2, 6.4]], '#8a86a6', 0.5);
    oval(ctx, 4, 5, 2.4, 1.6, '#8a86a6', 0.5);
    const hx = peck ? 8.4 : 7.4, hy = peck ? 6.4 : 2.8;
    tube(ctx, [[6.6, 4.4], [hx - 0.4, hy + 1]], 2, '#7a64a8', 0.5);
    oval(ctx, hx, hy, 1.7, 1.6, '#a8a4c4', 0.5);
    oval(ctx, hx + 0.5, hy - 0.4, 0.8, 0.9, '#ffffff', 0.35);
    oval(ctx, hx + 0.7, hy - 0.3, 0.3, 0.35, K, 0);
    poly(ctx, [[hx + 1.4, hy + 0.1], [hx + 2.8, hy + 0.6], [hx + 1.4, hy + 0.9]], '#f2a33a', 0.35);
    line(ctx, [[4, 7.8], [3.6, 9]], 0.6, '#ff7aa0'); line(ctx, [[5.4, 7.8], [5.6, 9]], 0.6, '#ff7aa0');
    return c;
  };
  return [make(0), make(1), make(2), make(3)];
}
export function catFrames(R) {
  return [0, 1].map((k) => {
    const [c, ctx] = layer(18, 14, R);
    const fur = '#6a5a8a';
    tube(ctx, k ? [[3, 10], [0.8, 6.4], [1.6, 2.6]] : [[3, 10], [0.4, 11], [-0.2, 8]], 1.8, fur, 0.6);
    oval(ctx, 6.4, 9.4, 4.4, 3.4, fur, 0.6);
    oval(ctx, 11, 6, 3.4, 3, fur, 0.6);
    poly(ctx, [[8.6, 4.4], [8.8, 1], [10.4, 3.4]], fur, 0.5);
    poly(ctx, [[12, 3.2], [13.6, 0.6], [13.8, 4]], fur, 0.5);
    oval(ctx, 10.4, 5.6, 1.3, 1.5, C.yellow, 0.4);
    oval(ctx, 12.8, 5.6, 1.3, 1.5, C.yellow, 0.4);
    oval(ctx, 10.6, 5.8, 0.3, 1, K, 0);
    oval(ctx, 13, 5.8, 0.3, 1, K, 0);
    oval(ctx, 11.8, 7.4, 0.7, 0.5, '#ff8aa8', 0.3);
    line(ctx, [[13, 7.6], [16, 7]], 0.3); line(ctx, [[13, 8], [16, 8.4]], 0.3);
    return c;
  });
}
// the sleeping stoop dog: belly rises and falls
export function dogFrames(R) {
  return [0, 1].map((k) => {
    const [c, ctx] = layer(30, 14, R);
    const fur = '#c8742e';
    tube(ctx, [[3, 10], [0.6, 8.6]], 1.8, fur, 0.6);
    blob(ctx, [[3, 12.6], [3.4, 7.4 - k * 0.8], [10, 5.6 - k * 0.8], [18, 6.4 - k * 0.6], [21, 12.6]], fur, 0.7);
    oval(ctx, 9, 8.6 - k * 0.4, 2.4, 1.6, '#9a4e1a', 0);
    oval(ctx, 23, 9.6, 4.6, 3.6, fur, 0.7);
    oval(ctx, 27, 11, 2.4, 1.8, mix(fur, '#ff8a6a', 0.2), 0.6);
    oval(ctx, 28.6, 10.4, 0.8, 0.7, K, 0);
    blob(ctx, [[21, 7.6], [19, 9], [19.6, 13.4], [21.6, 13], [22.4, 9]], '#8a4a1a', 0.6);
    line(ctx, [[23.4, 8.6], [25.4, 8.8]], 0.6, K, true);
    oval(ctx, 22, 12.8, 3, 1.2, fur, 0.6);
    oval(ctx, 14, 12.8, 3.2, 1.2, fur, 0.6);
    rect(ctx, 17.6, 6.2, 1.8, 6, C.red, 0.4);
    return c;
  });
}

// ---------- cars: bubbly cartoon bodies ----------
const CAR_TYPES = ['sedan', 'taxi', 'lowrider', 'van', 'danfo', 'hatch'];
export const carType = (r) => CAR_TYPES[Math.floor(r() * CAR_TYPES.length)];
export function carFrames(type, color, R, dir = 1) {
  const W = type === 'van' || type === 'danfo' ? 64 : type === 'lowrider' ? 70 : type === 'hatch' ? 50 : 60;
  const body = type === 'taxi' ? C.yellow : type === 'danfo' ? '#ffc21a' : color;
  const make = (spin) => {
    const [c, ctx] = layer(W + 4, 32, R);
    ctx.translate(2, 2);
    const low = type === 'lowrider' ? 2.4 : 0;
    if (type === 'van' || type === 'danfo') {
      poly(ctx, [[2, 22], [1.6, 6], [5, 2], [W - 16, 2], [W - 6, 11], [W - 1, 13], [W - 1, 22]], body, 0.9, 3);
      for (let x = 6; x < W - 20; x += 12) rrect(ctx, x, 5, 9, 6.4, 1.6, C.glass, 0.6);
      poly(ctx, [[W - 15, 4.6], [W - 7.4, 11.4], [W - 15, 11.4]], C.glass, 0.6, 1);
      if (type === 'danfo') { rect(ctx, 2, 14, W - 3, 1.6, K, 0); rect(ctx, 2, 17.4, W - 3, 1.2, K, 0); }
    } else {
      const cab = type === 'hatch' ? [[12, 11], [17, 3], [W - 14, 3], [W - 8, 11]] : [[13, 12 - low], [19, 4 - low], [W - 22, 4 - low], [W - 13, 12 - low]];
      poly(ctx, [[1, 22 - low], [1, 14 - low], [6, 11.4 - low], ...cab, [W - 2, 12.6 - low], [W, 16 - low], [W, 22 - low]], body, 0.9, 3);
      const g = cab;
      poly(ctx, [[g[0][0] + 3, g[0][1] - 0.4], [g[1][0] + 1.4, g[1][1] + 1.4], [(g[1][0] + g[2][0]) / 2 - 1, g[1][1] + 1.4], [(g[1][0] + g[2][0]) / 2 - 1, g[0][1] - 0.4]], C.glass, 0.6, 1);
      poly(ctx, [[(g[1][0] + g[2][0]) / 2 + 1, g[0][1] - 0.4], [(g[1][0] + g[2][0]) / 2 + 1, g[2][1] + 1.4], [g[2][0] - 0.6, g[2][1] + 1.4], [g[3][0] - 2.6, g[3][1] - 0.4]], C.glass, 0.6, 1);
      line(ctx, [[g[1][0] + 3, g[1][1] + 3], [g[1][0] + 6, g[1][1] + 2]], 0.7, '#ffffff');
      if (type === 'taxi') { rrect(ctx, W / 2 - 7, -1.4, 12, 4, 1, '#ffffff', 0.6); for (let x = 4; x < W - 4; x += 4) rect(ctx, x, 15.4 - low, 2, 2, K, 0); }
      if (type === 'lowrider') { line(ctx, [[4, 17], [W - 4, 16]], 1, '#ffffff'); for (const fx of [W - 30, W - 24, W - 18]) poly(ctx, [[fx, 20], [fx + 3, 14], [fx + 4, 20]], C.orange, 0.4); }
    }
    line(ctx, [[W * 0.45, 13 - low], [W * 0.45, 21]], 0.5);
    rect(ctx, W * 0.45 + 2, 14.6 - low, 3, 0.9, K, 0);
    rrect(ctx, W - 3, 18, 4.4, 3.4, 1.2, '#d8d4e4', 0.6);
    rrect(ctx, -1.4, 18, 4.4, 3.4, 1.2, '#d8d4e4', 0.6);
    oval(ctx, W - 1.4, 14.6 - low, 1.6, 1.8, '#fff2a0', 0.6);
    rrect(ctx, 0.4, 13.6 - low, 2, 2.6, 0.6, C.red, 0.5);
    for (const wx of [14, W - 14]) {
      oval(ctx, wx, 23.4, 5.4, 5.4, '#1d1a22', 0.9);
      oval(ctx, wx, 23.4, 2.8, 2.8, type === 'lowrider' ? '#ffffff' : '#c6c2d4', 0.6);
      const a = spin ? Math.PI / 4 : 0;
      for (let k = 0; k < 2; k++) { const b = a + (k * Math.PI) / 2; line(ctx, [[wx + Math.cos(b) * 2.4, 23.4 + Math.sin(b) * 2.4], [wx - Math.cos(b) * 2.4, 23.4 - Math.sin(b) * 2.4]], 0.5); }
    }
    if (dir > 0) { labels(ctx, (x) => x); return c; }
    // facing left: mirror the body, then letter the signs the right way round
    const [m, mctx] = layer(W + 4, 32, R);
    mctx.setTransform(-1, 0, 0, 1, c.width, 0);
    mctx.drawImage(c, 0, 0);
    mctx.setTransform(R, 0, 0, R, 0, 0);
    mctx.translate(2, 2);
    labels(mctx, (x) => W - x);
    return m;
  };
  const labels = (ctx, mx) => {
    if (type === 'taxi') text(ctx, 'TAXI', mx(W / 2 - 1), 0.7, { size: 2.8, fill: K, font: FONT.block });
    if (type === 'danfo') text(ctx, 'OSHODI', mx(W / 2 - 6), 8.6, { size: 3.6, fill: K, font: FONT.slab });
  };
  return { frames: [make(false), make(true)], w: W + 4 };
}
export { rng };
