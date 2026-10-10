// Inside a store: 208x117 pixel room, owner front-facing behind the counter, real stock on the racks.
import { P, rng, pick, canvas, rect, px, line, dither, speckle, brick, concrete, glow, shade } from './draw.js';
import { text } from './font.js';
import { itemSprite } from './items.js';
import { buildStander, buildBooster, OWNERS, FW, FH, catFrames } from './sprites.js';
import { neonSign, glyphNeon, vanRear } from './facades.js';

const BASE_W = 208;
export const RW = 288;
export const RH = 117;
export const OWNER_X = 104;
const COUNTER_Y = 84;

function shelfBoxes(ctx, x, y, w, rows, r) {
  for (let j = 0; j < rows; j++) {
    rect(ctx, x, y + j * 14 + 11, w, 2, '#3a2a22');
    for (let i = x + 1; i < x + w - 6; i += 7) {
      const c = pick(r, ['#e04f2f', '#f4f4f4', '#1a1a1a', '#f29a2e', '#2a5ea8', '#7a3fb0', '#2fa84f']);
      rect(ctx, i, y + j * 14 + 5, 6, 6, c); rect(ctx, i, y + j * 14 + 5, 6, 1, shade(c, 0.2)); px(ctx, i + 1, y + j * 14 + 8, '#f4f4f4');
    }
  }
}
function folded(ctx, x, y, w, rows, items, r) {
  for (let j = 0; j < rows; j++) {
    rect(ctx, x, y + j * 12 + 10, w, 2, '#5a3a24');
    for (let i = 0; i < Math.floor(w / 9); i++) {
      const it = items[(i + j * 3) % items.length];
      for (let k = 0; k < 3; k++) rect(ctx, x + 1 + i * 9, y + j * 12 + 3 + k * 2, 8, 2, k % 2 ? shade(it.color, -0.12) : it.color);
    }
  }
}
function rack(ctx, x, y, items) {
  rect(ctx, x, y, 60, 2, '#8a8a92'); rect(ctx, x + 2, y, 2, 66, '#6a6a72'); rect(ctx, x + 56, y, 2, 66, '#6a6a72');
  items.slice(0, 2).forEach((it, i) => { line(ctx, x + 18 + i * 26, y + 2, x + 18 + i * 26, y + 4, '#c9c6cf'); ctx.drawImage(itemSprite(it), x + 6 + i * 26, y + 3); });
  rect(ctx, x, y + 32, 60, 2, '#8a8a92');
  items.slice(2, 4).forEach((it, i) => { line(ctx, x + 18 + i * 26, y + 34, x + 18 + i * 26, y + 36, '#c9c6cf'); ctx.drawImage(itemSprite(it), x + 6 + i * 26, y + 35); });
}

const ROOMS = {
  'north-america'(ctx, r, items) {
    brick(ctx, 0, 0, RW, COUNTER_Y + 4, ['#7a3326', '#86392a', '#6e2e22', '#8f4030'], '#3d1a14', r);
    shelfBoxes(ctx, 142, 6, 62, 4, r);
    ctx.drawImage(neonSign('UPTOWN', P.neonPink, { scale: 1 }), 66, 4);
    rect(ctx, 120, 30, 16, 20, '#c9c6cf'); rect(ctx, 122, 32, 12, 16, '#2a4a6a'); text(ctx, 'LOTTO', 128, 52, P.neonYellow, { font: 'small', align: 'center' });
    ctx.drawImage(catFrames()[1], 188, COUNTER_Y - 9);
    return '#1c3a2a';
  },
  canada(ctx, r, items) {
    concrete(ctx, 0, 0, RW, COUNTER_Y + 4, '#b8b0a0', ['#a8a090', '#c8c0b0'], r, 0.06);
    rect(ctx, 0, 0, RW, 8, '#d8d4cc'); for (let x = 0; x < RW; x += 26) rect(ctx, x, 0, 1, 8, '#a8a49c');
    for (const tx of [30, 100, 170]) { rect(ctx, tx, 8, 24, 2, '#eef8ff'); glow(ctx, tx + 12, 12, 16, 5, '#eef8ff22'); }
    folded(ctx, 140, 16, 64, 4, items, r);
    rect(ctx, 112, 30, 22, 14, '#f2c230'); text(ctx, 'CASH', 123, 32, '#1a1a1a', { font: 'small', align: 'center' }); text(ctx, 'ONLY', 123, 38, '#c8102e', { font: 'small', align: 'center' });
    rect(ctx, 0, COUNTER_Y + 4, RW, RH, '#3a3a5a');
    return '#2a2832';
  },
  'south-america'(ctx, r, items) {
    brick(ctx, 0, 0, RW, COUNTER_Y + 4, ['#b35a32', '#a14f2c', '#c06538', '#9a4a28'], '#6e3a22', r, 5, 3);
    rect(ctx, 0, 40, RW, 30, '#3fa39a'); speckle(ctx, 0, 40, RW, 30, ['#368f87', '#4ab3a9'], 0.1, r);
    line(ctx, 130, 10, 204, 12, '#1a1a1a'); items.slice(0, 3).forEach((it, i) => ctx.drawImage(itemSprite(it), 132 + i * 24, 11));
    rect(ctx, 104, 0, 1, 12, '#1a1a1a'); rect(ctx, 102, 12, 5, 4, '#ffe9a0'); glow(ctx, 104, 20, 30, 18, '#ffe9a022');
    rect(ctx, 150, 46, 22, 30, '#1a1a1a'); for (const yy of [52, 66]) { rect(ctx, 155, yy, 12, 10, '#2a2a2a'); rect(ctx, 158, yy + 3, 6, 4, '#4a4a4a'); }
    rect(ctx, 176, 44, 26, 18, '#009739'); rect(ctx, 180, 47, 18, 12, '#ffdf00'); rect(ctx, 186, 50, 6, 6, '#1d3f8f');
    return '#d0a040';
  },
  europe(ctx, r, items) {
    for (let y = 0; y < COUNTER_Y + 4; y += 8) for (let x = (y / 8) % 2 ? 0 : 4; x < RW; x += 8) rect(ctx, x, y, 7, 7, pick(r, ['#c9c6cf', '#bdbac4', '#d4d1da']));
    shelfBoxes(ctx, 140, 4, 64, 5, r);
    ctx.drawImage(neonSign('93', P.neonRed, { scale: 2 }), 70, 6);
    rect(ctx, 104, 30, 26, 18, '#1a1a1a'); rect(ctx, 106, 32, 22, 14, '#2a4a6a'); dither(ctx, 106, 32, 22, 14, '#7fd6ff');
    for (let i = 0; i < 3; i++) { rect(ctx, 70 + i * 10, 34, 7, 6, '#16131a'); line(ctx, 70 + i * 10, 34, 73 + i * 10, 30, '#16131a'); }
    return '#1e1c24';
  },
  africa(ctx, r, items) {
    rect(ctx, 0, 0, RW, COUNTER_Y + 4, '#b02a2a'); for (let x = 0; x < RW; x += 3) rect(ctx, x, 0, 1, COUNTER_Y + 4, '#8a1f1f');
    rect(ctx, 20, 6, 70, 2, '#f4f4f4'); glow(ctx, 55, 12, 40, 8, '#eef8ff22');
    line(ctx, 130, 12, 204, 12, '#c9c6cf'); items.slice(0, 3).forEach((it, i) => ctx.drawImage(itemSprite(it), 132 + i * 24, 13));
    rect(ctx, 134, 44, 66, 34, '#f4f0e0'); text(ctx, 'PRICE LIST', 167, 47, '#c8102e', { font: 'small', align: 'center' });
    for (let j = 0; j < 5; j++) { rect(ctx, 138, 55 + j * 4, 30, 1, '#1d6b4a'); rect(ctx, 182, 55 + j * 4, 14, 1, '#1a1a1a'); }
    rect(ctx, 14, 52, 14, 22, '#2a2a34'); for (let i = 0; i < 3; i++) line(ctx, 21, 60, 21 + [-6, 6, 0][i], 60 + [-4, -4, 7][i], '#9a98a2');
    return '#1d6b4a';
  },
  asia(ctx, r, items) {
    rect(ctx, 0, 0, RW, COUNTER_Y + 4, '#2a2630');
    folded(ctx, 2, 4, 60, 2, items, r);
    folded(ctx, 140, 4, 66, 6, items, r);
    ctx.drawImage(glyphNeon('古着', P.neonPink, 14), 68, 2);
    for (let i = 0; i < 4; i++) rect(ctx, 104 + i * 9, 30, 7, 10, pick(r, ['#f4f4f4', '#ffe14d', '#39f0ff', '#ff3fa4']));
    for (const lx of [64, 130]) { rect(ctx, lx + 3, 0, 1, 4, '#1a1a1a'); rect(ctx, lx, 4, 7, 9, '#e0302a'); rect(ctx, lx, 4, 7, 1, '#1a1a1a'); rect(ctx, lx, 12, 7, 1, '#1a1a1a'); }
    return '#3a2a22';
  },
  oceania(ctx, r, items) {
    rect(ctx, 0, 0, RW, COUNTER_Y + 4, '#c9c6cf'); for (let y = 0; y < COUNTER_Y + 4; y += 3) rect(ctx, 0, y, RW, 1, '#aaa6b2');
    shelfBoxes(ctx, 140, 4, 64, 5, r);
    rect(ctx, 70, 8, 52, 14, '#1d3f8f'); text(ctx, 'NO REFUNDS', 96, 12, '#f4c430', { font: 'small', align: 'center' });
    rect(ctx, 166, 64, 26, 18, '#2a6fd0'); rect(ctx, 166, 64, 26, 4, '#f4f4f4'); text(ctx, 'ESKY', 179, 72, '#f4f4f4', { font: 'small', align: 'center' });
    return '#1d3f8f';
  },
};

export function buildRoom(store, items) {
  const r = rng(store.id.length * 97);
  const [b, bctx] = canvas(BASE_W, RH);
  const counterColor = ROOMS[store.id](bctx, r, items);
  // floor
  if (!['canada'].includes(store.id)) {
    rect(bctx, 0, COUNTER_Y + 4, BASE_W, RH - COUNTER_Y - 4, '#3a2e2a');
    for (let x = 0; x < BASE_W; x += 12) rect(bctx, x, COUNTER_Y + 4, 1, RH, '#2e2420');
  }
  rack(bctx, 4, 16, items);
  // widen the room: the shop keeps going behind the marketplace panel
  const [c, ctx] = canvas(RW, RH);
  ctx.drawImage(b, 0, 0);
  ctx.drawImage(b, 120, 0, 88, RH, BASE_W - 8, 0, 88, RH);
  rack(ctx, BASE_W + 10, 16, items.slice(2).concat(items).slice(0, 4));
  return { room: c, counterColor };
}

export function drawCounter(ctx, color, name) {
  rect(ctx, 50, COUNTER_Y, 108, 3, '#d8cbb0');
  rect(ctx, 52, COUNTER_Y + 3, 104, RH - COUNTER_Y - 3, color);
  dither(ctx, 52, COUNTER_Y + 3, 104, 2, '#00000066');
  rect(ctx, 130, COUNTER_Y - 9, 18, 9, '#3a3a44'); rect(ctx, 132, COUNTER_Y - 15, 14, 6, '#2a2a34'); rect(ctx, 133, COUNTER_Y - 14, 12, 4, '#39f0ff');
  text(ctx, name, 104, COUNTER_Y + 14, '#f4efe2', { font: 'small', align: 'center' });
}

export function buildOwner(storeId) {
  return buildStander({ ...OWNERS[storeId] });
}
export const OWNER_FEET = 104;
export { FW, FH, COUNTER_Y };

// ---------- Booster Corner close-up: zoomed into the open trunk ----------
export const TW = 240;
export const TH = 170;
export function buildTrunkScene(items) {
  const r = rng(808);
  const [c, ctx] = canvas(TW, TH);
  brick(ctx, 0, 0, TW, TH, ['#3a2a34', '#342630', '#40303a', '#2e222a'], '#1e161c', r, 6, 3);
  dither(ctx, 0, 0, TW, TH, '#0a060e');
  for (let i = 0; i < TW; i += 3) { line(ctx, i, 4, i + 3, 30, '#4a4856'); line(ctx, i + 3, 4, i, 30, '#4a4856'); }
  for (let i = 0; i < TW; i += 4) px(ctx, i, 2, '#9d9ba8');
  text(ctx, 'BOOSTER CORNER', 196, 12, '#b45cff', { align: 'center', outline: '#120c14' });
  rect(ctx, 0, 156, TW, 14, '#1a1620'); dither(ctx, 0, 156, TW, 14, '#26222c');
  rect(ctx, 30, 162, 40, 2, '#5a3a7a'); rect(ctx, 150, 164, 30, 2, '#6a5a2a');
  vanRear(ctx, 62, 38, 96, 118, r, items, { big: true });
  rect(ctx, 50, 166, 124, 3, '#0a080c');
  return c;
}
export function buildTrunkActor() {
  return buildBooster();
}
// The booster leans into frame at 2x: crop the head + torso of his sprite
export function drawBoosterBust(ctx, frame) {
  ctx.drawImage(frame, 4, 0, 26, 34, 2, 104, 52, 68);
}
