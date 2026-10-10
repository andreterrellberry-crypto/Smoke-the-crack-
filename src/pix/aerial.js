// Top-down pixel view of the block for the opening shot.
import { P, rng, pick, canvas, rect, px, line, dither, speckle, outline } from './draw.js';
import { text, measure } from './font.js';

export const AH = 640;
const ROW = 270; // our row of roofs: y 270..360
const DEPTH = 90;

function circle(ctx, cx, cy, rad, c, ring) {
  for (let y = -rad; y <= rad; y++) for (let x = -rad; x <= rad; x++) {
    const d = x * x + y * y;
    if (d <= rad * rad) px(ctx, cx + x, cy + y, ring && d > (rad - 2) * (rad - 2) ? ring : c);
  }
}
function tarRoof(ctx, x, y, w, h, r, base = '#3a3640') {
  rect(ctx, x, y, w, h, '#5a3a32');
  rect(ctx, x + 3, y + 3, w - 6, h - 6, base);
  speckle(ctx, x + 3, y + 3, w - 6, h - 6, ['#44404a', '#302c36', '#4a4652'], 0.12, r);
}
const ac = (ctx, x, y) => { rect(ctx, x, y, 10, 8, '#a8a4b0'); circle(ctx, x + 5, y + 4, 3, '#6a6670'); px(ctx, x + 5, y + 4, '#3a3640'); };

const ROOFS = {
  'north-america'(ctx, x, y, w, h, r) { tarRoof(ctx, x, y, w, h, r); circle(ctx, x + 110, y + 30, 14, '#8a5a33', '#5a3a1e'); circle(ctx, x + 110, y + 30, 6, '#6b4224'); ac(ctx, x + 20, y + 60); ac(ctx, x + 40, y + 60); rect(ctx, x + 60, y + 14, 14, 10, '#7a7680'); rect(ctx, x + 136, y + 64, 12, 12, '#7fb3c9'); },
  canada(ctx, x, y, w, h, r) { tarRoof(ctx, x, y, w, h, r, '#6a6670'); for (let i = 0; i < 12; i++) circle(ctx, x + 10 + Math.floor(r() * (w - 20)), y + 10 + Math.floor(r() * (h - 20)), 3 + Math.floor(r() * 4), '#e8eef4'); ac(ctx, x + 30, y + 40); ac(ctx, x + 100, y + 40); rect(ctx, x + 118, y + 4, 26, 4, '#f4f4f4'); },
  'south-america'(ctx, x, y, w, h, r) {
    for (const [ox, oy, ow, oh, c] of [[0, 0, 70, 50, '#8a8478'], [70, 0, 90, 40, '#9a9488'], [0, 50, 90, 40, '#7e786c'], [90, 40, 70, 50, '#a8a294']]) { rect(ctx, x + ox, y + oy, ow, oh, c); rect(ctx, x + ox, y + oy, ow, 1, '#5a5448'); rect(ctx, x + ox, y + oy, 1, oh, '#5a5448'); speckle(ctx, x + ox, y + oy, ow, oh, ['#6e6a60', '#b8b2a4'], 0.08, r); }
    for (const [cx, cy] of [[30, 20], [120, 22], [50, 70], [130, 66]]) circle(ctx, x + cx, y + cy, 7, '#2a6fd0', '#1a4fa0');
    for (let i = 0; i < 6; i++) px(ctx, x + 80 + i * 4, y + 48, '#5a3a2a');
    line(ctx, x + 10, y + 44, x + 70, y + 46, '#1a1a1a'); for (let i = 0; i < 5; i++) rect(ctx, x + 14 + i * 11, y + 45, 5, 3, pick(r, ['#ffdf00', '#009739', '#f4f4f4', '#e04f5f']));
  },
  europe(ctx, x, y, w, h, r) { tarRoof(ctx, x, y, w, h, r, '#5e5c66'); rect(ctx, x + 60, y + 25, 40, 30, '#7a7884'); rect(ctx, x + 64, y + 29, 32, 22, '#6a6874'); for (let i = 0; i < 6; i++) { rect(ctx, x + 14 + i * 24, y + 10, 2, 2, '#9a98a2'); line(ctx, x + 15 + i * 24, y + 10, x + 15 + i * 24, y + 4, '#9a98a2'); } for (let i = 0; i < 4; i++) rect(ctx, x + 20 + i * 34, y + 70, 8, 8, '#4a4852'); },
  africa(ctx, x, y, w, h, r) { for (let i = 0; i < w; i++) rect(ctx, x + i, y, 1, h, i % 4 < 2 ? '#8a7a6a' : '#7a6a5a'); for (let i = 0; i < 8; i++) rect(ctx, x + Math.floor(r() * (w - 20)), y + Math.floor(r() * (h - 14)), 16 + Math.floor(r() * 10), 10, pick(r, ['#9a5a3a', '#8a4a2a', '#a8a4b0'])); circle(ctx, x + 130, y + 24, 10, '#1a1a1a', '#2a2a2a'); rect(ctx, x + 20, y + 66, 18, 12, '#e0b020'); },
  asia(ctx, x, y, w, h, r) { tarRoof(ctx, x, y, w, h, r, '#2e2e38'); for (let i = 0; i < 8; i++) ac(ctx, x + 10 + (i % 4) * 22, y + 12 + Math.floor(i / 4) * 16); rect(ctx, x + 108, y + 10, 40, 4, '#ff3fa4'); rect(ctx, x + 108, y + 60, 30, 20, '#2e8b57'); speckle(ctx, x + 108, y + 60, 30, 20, ['#3fa36a', '#1f6b3a'], 0.3, r); },
  oceania(ctx, x, y, w, h, r) { for (let j = 0; j < h; j++) rect(ctx, x, y + j, w, 1, j % 3 ? '#c9c6cf' : '#a8a4b0'); for (let i = 0; i < 3; i++) { rect(ctx, x + 20 + i * 44, y + 20, 34, 24, '#1c2f5e'); for (let k = 0; k < 34; k += 6) rect(ctx, x + 20 + i * 44 + k, y + 20, 1, 24, '#4a6fb0'); rect(ctx, x + 20 + i * 44, y + 32, 34, 1, '#4a6fb0'); } },
  antarctica(ctx, x, y, w, h, r) { rect(ctx, x, y, w, h, '#7a5a3a'); speckle(ctx, x, y, w, h, ['#6a4a2a', '#8a6a4a'], 0.2, r); for (let i = 0; i < w; i += 4) { px(ctx, x + i, y, '#f6c42b'); px(ctx, x + i, y + h - 1, '#f6c42b'); } line(ctx, x + 20, y + 70, x + 140, y + 16, '#f6c42b'); line(ctx, x + 20, y + 71, x + 140, y + 17, '#d9a41f'); rect(ctx, x + 14, y + 64, 12, 12, '#f6c42b'); for (let i = 0; i < 3; i++) circle(ctx, x + 60 + i * 20, y + 50, 2, '#f6c42b'); rect(ctx, x + 100, y + 60, 30, 16, '#c89a5a'); },
};

export function buildAerial(segs, width, stores) {
  const r = rng(31);
  const W = width + 400;
  const [c, ctx] = canvas(W, AH);
  const ox = 200;
  rect(ctx, 0, 0, W, AH, '#2a2630');
  // surrounding blocks
  for (let by = 10; by < AH; by += 120) {
    if (by > ROW - 130 && by < ROW + 200) continue;
    for (let bx = 0; bx < W; ) {
      const bw = 50 + Math.floor(r() * 60);
      if (r() < 0.12) { rect(ctx, bx, by, bw, 96, '#2f4a2f'); for (let i = 0; i < 6; i++) circle(ctx, bx + 8 + Math.floor(r() * (bw - 16)), by + 8 + Math.floor(r() * 80), 6 + Math.floor(r() * 4), pick(r, ['#2e6b3a', '#3a7a44', '#24582e']), '#1a3a20'); }
      else { tarRoof(ctx, bx, by, bw, 96, r, pick(r, ['#3a3640', '#45414c', '#4a3a3a', '#3a404a'])); if (r() < 0.4) ac(ctx, bx + 8, by + 10); if (r() < 0.25) circle(ctx, bx + bw - 14, by + 20, 8, '#8a5a33', '#5a3a1e'); }
      bx += bw + 4;
    }
    rect(ctx, 0, by + 98, W, 20, P.asphalt);
    for (let x = 0; x < W; x += 20) rect(ctx, x, by + 107, 10, 2, '#8a7a3a');
  }
  // back service lane
  rect(ctx, 0, ROW - 16, W, 16, '#24202a'); speckle(ctx, 0, ROW - 16, W, 16, ['#1a171e', '#2e2a34'], 0.1, r);
  // our row
  for (const seg of segs) {
    const x = ox + seg.x;
    if (seg.kind === 'store') ROOFS[seg.id](ctx, x, ROW, seg.w, DEPTH, r);
    else if (seg.kind === 'alley') { rect(ctx, x, ROW, seg.w, DEPTH, '#16121a'); rect(ctx, x + 6, ROW + 56, 22, 14, '#2e6b4a'); circle(ctx, x + seg.w / 2 + 10, ROW + 80, 4, '#2e2620', '#1a1410'); }
    else { tarRoof(ctx, x, ROW, seg.w, DEPTH, r); if (!seg.end) { rect(ctx, x + 6, ROW + 6, seg.w - 12, 8, '#f4efe2'); } }
  }
  // sidewalks + road
  const sw = ROW + DEPTH;
  rect(ctx, 0, sw, W, 16, P.walk); for (let x = 0; x < W; x += 16) rect(ctx, x, sw, 1, 16, P.walkLine);
  rect(ctx, 0, sw + 16, W, 3, P.curb);
  rect(ctx, 0, sw + 19, W, 56, P.asphalt); speckle(ctx, 0, sw + 19, W, 56, [P.asphalt2, '#322e38'], 0.1, r);
  for (let x = 0; x < W; x += 28) rect(ctx, x, sw + 46, 14, 2, P.lane);
  rect(ctx, 0, sw + 75, W, 3, P.curb); rect(ctx, 0, sw + 78, W, 16, P.walk); for (let x = 0; x < W; x += 16) rect(ctx, x, sw + 78, 1, 16, P.walkLine);
  // labels
  for (const seg of segs) {
    if (seg.kind === 'corner') continue;
    const label = seg.kind === 'alley' ? "NUCCI'S" : stores[seg.id].region.toUpperCase();
    const w = measure(label, 'small') + 8;
    const lx = ox + seg.x + seg.w / 2 - w / 2, ly = ROW + DEPTH / 2 - 5;
    rect(ctx, lx, ly, w, 11, P.ink); rect(ctx, lx + 1, ly + 1, w - 2, 9, seg.kind === 'alley' ? '#1a0f1e' : seg.id === 'antarctica' ? '#f6c42b' : '#f4efe2');
    text(ctx, label, lx + 4, ly + 3, seg.kind === 'alley' ? '#f2c14e' : P.ink, { font: 'small' });
  }
  return { c, ox, streetY: sw + 8 };
}

// tiny top-down movers
export function topCar(color) {
  const [c, ctx] = canvas(16, 9);
  rect(ctx, 0, 1, 16, 7, color); rect(ctx, 5, 2, 6, 5, '#7fb3c9'); rect(ctx, 6, 3, 4, 3, color); px(ctx, 15, 2, '#fff2b0'); px(ctx, 15, 6, '#fff2b0');
  return outline(c);
}
export function topPerson(color) {
  const [c, ctx] = canvas(5, 5);
  rect(ctx, 0, 1, 5, 3, color); rect(ctx, 1, 1, 3, 3, '#2a1810');
  return outline(c);
}
