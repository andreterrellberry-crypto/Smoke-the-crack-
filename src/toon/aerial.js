// Top-down cartoon map of the block for the opening shot.
import { K, C, LW, FONT, layer, rect, rrect, oval, poly, line, text, measure, dots, rng, pick, shade } from './toon.js';

export const AH = 600;
const ROW = 250; // our row of roofs: y 250..340
const DEPTH = 90;

function roof(ctx, x, y, w, h, base, trim) {
  rect(ctx, x, y, w, h, trim || shade(base, -0.18), LW);
  rect(ctx, x + 3, y + 3, w - 6, h - 6, base, LW * 0.8);
}
const ac = (ctx, x, y) => { rrect(ctx, x, y, 11, 9, 1, '#e8e4f2', LW * 0.8); oval(ctx, x + 5.5, y + 4.5, 3, 3, '#a8a2bc', 0.6); };
const tank = (ctx, x, y, rad) => { oval(ctx, x, y, rad, rad, '#3a2a30', LW); oval(ctx, x, y, rad * 0.45, rad * 0.45, '#6a5258', LW * 0.6); };
const tree = (ctx, x, y, rad) => { oval(ctx, x + 1.4, y + 1.6, rad, rad * 0.95, '#1f8a3a', 0); oval(ctx, x, y, rad, rad * 0.95, C.green, LW); oval(ctx, x - rad * 0.3, y - rad * 0.3, rad * 0.35, rad * 0.3, C.lime, 0); };

const ROOFS = {
  'north-america'(ctx, x, y, w, h) { roof(ctx, x, y, w, h, '#ff7a5c', '#c83a22'); tank(ctx, x + 22, y + 26, 11); ac(ctx, x + 60, y + 60); ac(ctx, x + 80, y + 60); rect(ctx, x + 50, y + 14, 100, 8, C.yellow, LW * 0.8); },
  canada(ctx, x, y, w, h, r) { roof(ctx, x, y, w, h, '#d6d2e2', C.teal); for (let i = 0; i < 7; i++) oval(ctx, x + 14 + r() * (w - 28), y + 14 + r() * (h - 28), 4 + r() * 4, 3 + r() * 3, '#ffffff', LW * 0.7); ac(ctx, x + 30, y + 40); ac(ctx, x + 100, y + 40); },
  'south-america'(ctx, x, y, w, h) {
    for (const [ox, oy, ow, oh, c] of [[0, 0, 70, 50, C.hotpink], [70, 0, 90, 40, C.yellow], [0, 50, 90, 40, C.teal], [90, 40, 70, 50, C.orange]]) rect(ctx, x + ox, y + oy, ow, oh, c, LW);
    for (const [cx, cy] of [[30, 20], [120, 22], [50, 70], [130, 66]]) { oval(ctx, x + cx, y + cy, 7, 7, C.blue, LW); oval(ctx, x + cx, y + cy, 3, 3, '#1f3fa0', 0.5); }
  },
  europe(ctx, x, y, w, h) { roof(ctx, x, y, w, h, '#cfc8e6', '#a8a2bc'); rect(ctx, x + 60, y + 25, 40, 30, '#e8e4f2', LW); for (let i = 0; i < 6; i++) oval(ctx, x + 15 + i * 24, y + 10, 3, 2.4, '#ffffff', LW * 0.7); for (let i = 0; i < 4; i++) ac(ctx, x + 20 + i * 34, y + 68); },
  africa(ctx, x, y, w, h, r) {
    rect(ctx, x, y, w, h, '#c6c2d4', LW);
    for (let i = x + 4; i < x + w; i += 4) line(ctx, [[i, y], [i, y + h]], 0.5, '#8a849e');
    rect(ctx, x + 20, y + 20, 30, 20, C.red, LW); oval(ctx, x + 130, y + 24, 10, 10, '#2a2633', LW); rect(ctx, x + 20, y + 66, 18, 12, C.yellow, LW);
    oval(ctx, x + 140, y + 70, 12, 12, '#ffffff', LW); poly(ctx, [[x + 140, y + 70], [x + 152, y + 70], [x + 140, y + 58]], C.red, 0.5);
  },
  asia(ctx, x, y, w, h) { roof(ctx, x, y, 112, h, '#7a5ad8', '#4a2f8a'); roof(ctx, x + 112, y, 48, h, '#4a4660', '#2e2a3a'); for (let i = 0; i < 6; i++) ac(ctx, x + 10 + (i % 3) * 30, y + 12 + Math.floor(i / 3) * 20); rect(ctx, x + 10, y + 60, 40, 6, C.hotpink, LW * 0.8); tree(ctx, x + 136, y + 50, 10); },
  oceania(ctx, x, y, w, h) {
    rect(ctx, x, y, w, h, '#e8e2f0', LW);
    for (let j = y + 3; j < y + h; j += 4) line(ctx, [[x, j], [x + w, j]], 0.5, '#c6c2d4');
    for (let i = 0; i < 3; i++) rect(ctx, x + 20 + i * 44, y + 20, 34, 24, '#1d3f9f', LW);
  },
  construction(ctx, x, y, w, h) {
    rect(ctx, x, y, w, h, '#e8b47a', LW);
    for (let i = 0; i < w; i += 10) { rect(ctx, x + i, y, 5, 2.4, C.yellow, 0); rect(ctx, x + i, y + h - 2.4, 5, 2.4, C.yellow, 0); }
    line(ctx, [[x + 20, y + 70], [x + 140, y + 16]], 3, C.orange); line(ctx, [[x + 20, y + 70], [x + 140, y + 16]], 0.6);
    rect(ctx, x + 14, y + 64, 12, 12, C.yellow, LW);
    for (let i = 0; i < 3; i++) oval(ctx, x + 60 + i * 20, y + 50, 3, 3, C.orange, LW * 0.7);
  },
};

export function buildAerial(segs, width, stores, openById, R) {
  const r = rng(31);
  const W = width + 400;
  const [c, ctx] = layer(W, AH, R);
  const ox = 200;
  rect(ctx, -1, -1, W + 2, AH + 2, C.road, 0);
  dots(ctx, 0, 0, W, AH, '#3e4262', Math.round(W * AH * 0.004), r, 0.6);
  // surrounding blocks
  for (let by = 10; by < AH; by += 120) {
    if (by > ROW - 130 && by < ROW + 200) continue;
    rect(ctx, -1, by - 5, W + 2, 106, C.walk, LW);
    for (let bx = 0; bx < W; ) {
      const bw = 50 + Math.floor(r() * 60);
      if (r() < 0.16) { rect(ctx, bx, by, bw, 96, '#7fd06a', LW); for (let i = 0; i < 4; i++) tree(ctx, bx + 10 + r() * (bw - 20), by + 12 + r() * 72, 8 + r() * 3); }
      else { const col = pick(r, [C.hotpink, C.blue, C.purple, C.redorange, C.teal, '#ff8a1f', '#8a5ad8', C.yellow]); roof(ctx, bx, by, bw, 96, shade(col, 0.12), shade(col, -0.12)); if (r() < 0.4) ac(ctx, bx + 8, by + 10); if (r() < 0.3) tank(ctx, bx + bw - 14, by + 22, 8); }
      bx += bw + 4;
    }
    for (let x = 0; x < W; x += 24) rrect(ctx, x, by + 107, 12, 2, 1, C.lane, 0);
  }
  rect(ctx, -1, ROW - 16, W + 2, 16, '#3a3f5a', LW);
  // our row (and the two cross streets)
  for (const seg of segs) {
    const x = ox + seg.x;
    if (seg.kind === 'store') (openById[seg.id] === false ? ROOFS.construction : ROOFS[seg.id])(ctx, x, ROW, seg.w, DEPTH, r);
    else if (seg.kind === 'auction') {
      // the Hammerdome from above: marble roof, a big gold dome, red carpet to the curb
      rect(ctx, x, ROW, seg.w, DEPTH, '#f3ead8', LW);
      for (let i = 0; i < 6; i++) oval(ctx, x + 14 + i * ((seg.w - 28) / 5), ROW + DEPTH - 8, 4, 4, '#fbf6ea', LW * 0.7);
      oval(ctx, x + seg.w / 2, ROW + 40, 30, 30, C.gold, LW);
      for (let k = 0; k < 8; k++) { const a = (k / 8) * Math.PI * 2; line(ctx, [[x + seg.w / 2, ROW + 40], [x + seg.w / 2 + Math.cos(a) * 30, ROW + 40 + Math.sin(a) * 30]], 0.6, C.gold2); }
      oval(ctx, x + seg.w / 2, ROW + 40, 7, 7, '#f3ead8', LW);
      rect(ctx, x + seg.w / 2 - 8, ROW + DEPTH - 2, 16, 18, '#c8102e', LW * 0.7);
    } else if (seg.kind === 'alley') {
      rect(ctx, x, ROW, seg.w, DEPTH, '#2a2f6b', LW);
      rrect(ctx, x + 30, ROW + 18, 58, 64, 4, '#ffffff', LW);
      for (let k = 0; k < 4; k++) line(ctx, [[x + 37 + k * 13, ROW + 28], [x + 37 + k * 13, ROW + 70]], 0.7, '#c6c2d4');
      poly(ctx, [[x + 30, ROW + 82], [x + 20, ROW + 88], [x + 30, ROW + 88]], '#e8e4f2', LW * 0.7);
      poly(ctx, [[x + 88, ROW + 82], [x + 98, ROW + 88], [x + 88, ROW + 88]], '#e8e4f2', LW * 0.7);
      oval(ctx, x + 14, ROW + 84, 4.6, 4.6, '#1f1c28', LW); oval(ctx, x + 15, ROW + 85, 1.4, 1, C.gold, 0);
    } else {
      const xa = x + 26, xb = x + seg.w - 26;
      rect(ctx, x, ROW - 16, seg.w, DEPTH + 16, C.walk, LW);
      rect(ctx, xa, ROW - 20, xb - xa, DEPTH + 22, C.road, 0);
      for (let yy = ROW - 10; yy < ROW + DEPTH; yy += 22) rrect(ctx, (xa + xb) / 2 - 1, yy, 2, 12, 1, C.lane, 0);
      for (let i = xa + 4; i < xb - 4; i += 7) rect(ctx, i, ROW + DEPTH - 14, 4, 12, C.zebra, 0.5);
    }
  }
  const sw = ROW + DEPTH;
  rect(ctx, -1, sw, W + 2, 16, C.walk, LW);
  dots(ctx, 0, sw + 1, W, 14, C.walkDot, Math.round(W * 0.5), r, 0.6);
  rect(ctx, -1, sw + 16, W + 2, 3, C.curb, LW * 0.8);
  for (let x = 0; x < W; x += 30) rrect(ctx, x, sw + 46, 15, 2, 1, C.lane, 0);
  rect(ctx, -1, sw + 75, W + 2, 3, C.curb, LW * 0.8);
  rect(ctx, -1, sw + 78, W + 2, 16, C.walk, LW);
  for (const seg of segs) if (seg.kind === 'cross') { const xa = ox + seg.x + 26, xb = ox + seg.x + seg.w - 26; for (let yy = sw + 22; yy < sw + 72; yy += 6) rect(ctx, xa + 4, yy, xb - xa - 8, 3, C.zebra, 0.5); }
  // label pills over each roof
  for (const seg of segs) {
    if (seg.kind === 'cross') continue;
    const label = seg.kind === 'alley' ? 'BOOSTER' : seg.kind === 'auction' ? 'AUCTION HOUSE' : stores[seg.id].region.toUpperCase();
    const w = measure(label, 8, FONT.slab) + 14;
    const lx = ox + seg.x + seg.w / 2 - w / 2, ly = ROW + DEPTH / 2 - 7;
    const bg = seg.kind === 'alley' ? '#2a2f6b' : seg.kind === 'auction' ? '#9a1830' : openById[seg.id] === false ? C.orange : '#ffffff', fg = seg.kind === 'alley' || seg.kind === 'auction' ? C.gold : K;
    rect(ctx, lx, ly, w, 14, bg, 1.2);
    ctx.lineWidth = 0.5; ctx.strokeStyle = fg; ctx.strokeRect(lx + 1.6, ly + 1.6, w - 3.2, 10.8);
    text(ctx, label, lx + w / 2, ly + 7.6, { size: 8, font: FONT.slab, fill: fg });
  }
  return { c, ox, streetY: sw + 8 };
}

// tiny top-down movers
export function topCar(color, R) {
  const [c, ctx] = layer(22, 13, R);
  rrect(ctx, 1, 1.5, 20, 10, 3, color, LW);
  rrect(ctx, 6, 3, 8, 7, 1.4, C.glass, LW * 0.7);
  oval(ctx, 20, 3.4, 0.9, 0.9, '#fff3a0', 0.4); oval(ctx, 20, 9.6, 0.9, 0.9, '#fff3a0', 0.4);
  return c;
}
export function topPerson(color, R) {
  const [c, ctx] = layer(8, 8, R);
  oval(ctx, 4, 4, 3.4, 2.4, color, LW * 0.8);
  oval(ctx, 4, 4, 1.8, 1.8, '#3a2418', LW * 0.6);
  return c;
}
