// Top-down inked map of the block for the opening shot.
import { INK, C, layer, shape, box, blob, pen, halftone, clipTo, letter, rng, pick, seedInk } from './ink.js';

export const AH = 600;
const ROW = 250; // our row of roofs: y 250..340
const DEPTH = 90;

function roof(ctx, x, y, w, h, r, base = '#8a8494') {
  const p = box(ctx, x, y, w, h, { fill: '#b8563a', w: 0.9 });
  box(ctx, x + 3, y + 3, w - 6, h - 6, { fill: base, w: 0.6 });
  clipTo(ctx, p, () => halftone(ctx, x, y, w, h, '#00000024', 1.8, 0.45));
}
const ac = (ctx, x, y) => { box(ctx, x, y, 11, 9, { fill: '#e6e2ea', w: 0.6 }); blob(ctx, x + 5.5, y + 4.5, 3.2, 3.2, { fill: '#8a8494', w: 0.5 }); };
const tank = (ctx, x, y, rad) => { blob(ctx, x, y, rad, rad, { fill: '#9a6a44', w: 0.8, n: 18 }); blob(ctx, x, y, rad * 0.45, rad * 0.45, { fill: '#6a4428', w: 0.5 }); };
const tree = (ctx, x, y, rad, r) => { for (let i = 0; i < 5; i++) blob(ctx, x + (r() - 0.5) * rad, y + (r() - 0.5) * rad, rad * 0.6, rad * 0.55, { fill: pick(r, ['#4fb36a', '#3f9a5a', '#5fc070']), w: 0.6 }); };

const ROOFS = {
  'north-america'(ctx, x, y, w, h, r) { roof(ctx, x, y, w, h, r); tank(ctx, x + 110, y + 30, 14); ac(ctx, x + 20, y + 60); ac(ctx, x + 40, y + 60); box(ctx, x + 60, y + 14, 14, 10, { fill: '#a8a4b0', w: 0.6 }); },
  canada(ctx, x, y, w, h, r) { roof(ctx, x, y, w, h, r, '#a8a4b0'); for (let i = 0; i < 9; i++) blob(ctx, x + 12 + r() * (w - 24), y + 12 + r() * (h - 24), 3 + r() * 4, 3 + r() * 3, { fill: '#f8fbff', w: 0.5 }); ac(ctx, x + 30, y + 40); ac(ctx, x + 100, y + 40); },
  'south-america'(ctx, x, y, w, h, r) {
    for (const [ox, oy, ow, oh, c] of [[0, 0, 70, 50, '#c8693e'], [70, 0, 90, 40, '#d88a5a'], [0, 50, 90, 40, '#b85a32'], [90, 40, 70, 50, '#f08ab0']]) { box(ctx, x + ox, y + oy, ow, oh, { fill: c, w: 0.8 }); halftone(ctx, x + ox, y + oy, ow, oh, '#00000020', 1.8, 0.4); }
    for (const [cx, cy] of [[30, 20], [120, 22], [50, 70], [130, 66]]) { blob(ctx, x + cx, y + cy, 7, 7, { fill: '#2a6fd0', w: 0.7 }); blob(ctx, x + cx, y + cy, 3, 3, { fill: '#1a4fa0', w: 0.4 }); }
    pen(ctx, [[x + 10, y + 44], [x + 70, y + 46]], { w: 0.5 });
    for (let i = 0; i < 5; i++) box(ctx, x + 14 + i * 11, y + 45, 5, 4, { fill: pick(r, ['#ffdf00', '#009739', '#f4f4f4', C.red]), w: 0.4 });
  },
  europe(ctx, x, y, w, h, r) { roof(ctx, x, y, w, h, r, '#9a98a2'); box(ctx, x + 60, y + 25, 40, 30, { fill: '#b8b4c0', w: 0.7 }); for (let i = 0; i < 6; i++) blob(ctx, x + 15 + i * 24, y + 10, 3, 2.4, { fill: '#efebf2', w: 0.5 }); for (let i = 0; i < 4; i++) ac(ctx, x + 20 + i * 34, y + 68); },
  africa(ctx, x, y, w, h, r) {
    const p = box(ctx, x, y, w, h, { fill: '#a8a4b0', w: 0.9 });
    clipTo(ctx, p, () => { for (let i = 0; i < w; i += 4) pen(ctx, [[x + i, y], [x + i, y + h]], { c: '#7a7684', w: 0.6, j: 0.05 }); });
    for (let i = 0; i < 5; i++) box(ctx, x + 10 + r() * (w - 30), y + 8 + r() * (h - 24), 16 + r() * 10, 10, { fill: pick(r, ['#c86a3a', '#a85a2a', '#d8d4de']), w: 0.6 });
    blob(ctx, x + 130, y + 24, 10, 10, { fill: '#2a2630', w: 0.7 }); box(ctx, x + 20, y + 66, 18, 12, { fill: C.yellow, w: 0.6 });
  },
  asia(ctx, x, y, w, h, r) { roof(ctx, x, y, w, h, r, '#5a5a68'); for (let i = 0; i < 8; i++) ac(ctx, x + 10 + (i % 4) * 22, y + 12 + Math.floor(i / 4) * 16); box(ctx, x + 108, y + 10, 40, 5, { fill: C.pink, w: 0.6 }); box(ctx, x + 108, y + 58, 32, 22, { fill: '#4fb36a', w: 0.7 }); tree(ctx, x + 124, y + 68, 10, r); },
  oceania(ctx, x, y, w, h, r) {
    const p = box(ctx, x, y, w, h, { fill: '#d8d4de', w: 0.9 });
    clipTo(ctx, p, () => { for (let j = 0; j < h; j += 3.4) pen(ctx, [[x, y + j], [x + w, y + j]], { c: '#a8a4b0', w: 0.5, j: 0.05 }); });
    for (let i = 0; i < 3; i++) { box(ctx, x + 20 + i * 44, y + 20, 34, 24, { fill: '#1d3f8f', w: 0.7 }); for (let k = 6; k < 34; k += 6) pen(ctx, [[x + 20 + i * 44 + k, y + 20], [x + 20 + i * 44 + k, y + 44]], { c: '#4a6fb0', w: 0.4 }); }
  },
  construction(ctx, x, y, w, h, r) {
    box(ctx, x, y, w, h, { fill: '#b88a5a', w: 0.9 });
    halftone(ctx, x, y, w, h, '#00000020', 1.8, 0.45);
    for (let i = 0; i < w; i += 8) { box(ctx, x + i, y, 4, 2, { fill: C.yellow, stroke: false }); box(ctx, x + i, y + h - 2, 4, 2, { fill: C.yellow, stroke: false }); }
    pen(ctx, [[x + 20, y + 70], [x + 140, y + 16]], { c: C.yellow, w: 2 }); pen(ctx, [[x + 20, y + 70], [x + 140, y + 16]], { w: 0.5 });
    box(ctx, x + 14, y + 64, 12, 12, { fill: C.yellow, w: 0.6 });
    for (let i = 0; i < 3; i++) blob(ctx, x + 60 + i * 20, y + 50, 2.4, 2.4, { fill: C.orange, w: 0.4 });
  },
};

export function buildAerial(segs, width, stores, openById, R) {
  const r = rng(31);
  seedInk(31);
  const W = width + 400;
  const [c, ctx] = layer(W, AH, R);
  const ox = 200;
  box(ctx, -1, -1, W + 2, AH + 2, { fill: C.road, stroke: false });
  halftone(ctx, 0, 0, W, AH, '#00000018', 2.2, 0.45);
  // surrounding blocks
  for (let by = 10; by < AH; by += 120) {
    if (by > ROW - 130 && by < ROW + 200) continue;
    box(ctx, -1, by - 4, W + 2, 104, { fill: C.walk, w: 0.7 });
    for (let bx = 0; bx < W; ) {
      const bw = 50 + Math.floor(r() * 60);
      if (r() < 0.14) { box(ctx, bx, by, bw, 96, { fill: '#8ad08a', w: 0.8 }); halftone(ctx, bx, by, bw, 96, '#2e6b4a30', 2, 0.5); for (let i = 0; i < 4; i++) tree(ctx, bx + 10 + r() * (bw - 20), by + 12 + r() * 72, 9, r); }
      else { roof(ctx, bx, by, bw, 96, r, pick(r, ['#8a8494', '#9a98a2', '#a88a7a', '#7a8494'])); if (r() < 0.4) ac(ctx, bx + 8, by + 10); if (r() < 0.25) tank(ctx, bx + bw - 14, by + 22, 8); }
      bx += bw + 4;
    }
    for (let x = 0; x < W; x += 22) box(ctx, x, by + 107, 11, 2, { fill: C.lane, stroke: false });
  }
  // back service lane
  box(ctx, -1, ROW - 16, W + 2, 16, { fill: '#5c5961', w: 0.6 });
  // our row
  for (const seg of segs) {
    const x = ox + seg.x;
    if (seg.kind === 'store') (openById[seg.id] === false ? ROOFS.construction : ROOFS[seg.id])(ctx, x, ROW, seg.w, DEPTH, r);
    else if (seg.kind === 'alley') {
      // the booster's van backed in, rear doors open to the street
      box(ctx, x, ROW, seg.w, DEPTH, { fill: '#3a3040', w: 0.9 });
      box(ctx, x + 30, ROW + 18, 58, 64, { fill: '#e6e2ea', w: 1 });
      for (let k = 0; k < 4; k++) pen(ctx, [[x + 37 + k * 13, ROW + 28], [x + 37 + k * 13, ROW + 70]], { c: '#a8a4b0', w: 0.6 });
      shape(ctx, [[x + 30, ROW + 82], [x + 20, ROW + 88], [x + 30, ROW + 88]], { fill: '#c9c5d0', w: 0.6, step: 3 });
      shape(ctx, [[x + 88, ROW + 82], [x + 98, ROW + 88], [x + 88, ROW + 88]], { fill: '#c9c5d0', w: 0.6, step: 3 });
      blob(ctx, x + 14, ROW + 84, 4.4, 4.4, { fill: '#1d1a22', w: 0.6 }); blob(ctx, x + 15, ROW + 85, 1.2, 1, { fill: C.gold, stroke: false });
    } else { roof(ctx, x, ROW, seg.w, DEPTH, r); if (!seg.end) box(ctx, x + 6, ROW + 6, seg.w - 12, 10, { fill: '#f6f1e2', w: 0.6 }); }
  }
  // sidewalks + road
  const sw = ROW + DEPTH;
  box(ctx, -1, sw, W + 2, 16, { fill: C.walk, w: 0.7 });
  for (let x = 0; x < W; x += 16) pen(ctx, [[x, sw], [x, sw + 16]], { c: C.walk2, w: 0.5 });
  box(ctx, -1, sw + 16, W + 2, 3, { fill: C.curb, w: 0.5 });
  for (let x = 0; x < W; x += 28) box(ctx, x, sw + 46, 14, 2, { fill: C.lane, stroke: false });
  box(ctx, -1, sw + 75, W + 2, 3, { fill: C.curb, w: 0.5 });
  box(ctx, -1, sw + 78, W + 2, 16, { fill: C.walk, w: 0.7 });
  for (let x = 0; x < W; x += 16) pen(ctx, [[x, sw + 78], [x, sw + 94]], { c: C.walk2, w: 0.5 });
  // caption labels over each roof
  ctx.font = "8px 'Bangers', sans-serif";
  for (const seg of segs) {
    if (seg.kind === 'corner') continue;
    const label = seg.kind === 'alley' ? 'BOOSTER' : stores[seg.id].region.toUpperCase();
    const w = ctx.measureText(label).width + 10;
    const lx = ox + seg.x + seg.w / 2 - w / 2, ly = ROW + DEPTH / 2 - 7;
    box(ctx, lx + 1.6, ly + 1.6, w, 13, { fill: INK, stroke: false });
    box(ctx, lx, ly, w, 13, { fill: seg.kind === 'alley' ? INK : openById[seg.id] === false ? C.orange : '#fffdf4', w: 0.8 });
    letter(ctx, label, lx + w / 2, ly + 7, { size: 8, fill: seg.kind === 'alley' ? C.gold : INK });
  }
  return { c, ox, streetY: sw + 8 };
}

// tiny top-down movers
export function topCar(color, R) {
  const [c, ctx] = layer(20, 12, R);
  seedInk(7);
  box(ctx, 1, 1.5, 18, 9, { fill: color, w: 0.7 });
  box(ctx, 6, 2.8, 7, 6.4, { fill: C.glass, w: 0.5 });
  blob(ctx, 18.4, 3, 0.8, 0.8, { fill: '#fff6c0', w: 0.3 }); blob(ctx, 18.4, 9, 0.8, 0.8, { fill: '#fff6c0', w: 0.3 });
  return c;
}
export function topPerson(color, R) {
  const [c, ctx] = layer(7, 7, R);
  seedInk(9);
  blob(ctx, 3.5, 3.5, 3, 2.2, { fill: color, w: 0.5 });
  blob(ctx, 3.5, 3.5, 1.6, 1.6, { fill: '#3a2418', w: 0.4 });
  return c;
}
