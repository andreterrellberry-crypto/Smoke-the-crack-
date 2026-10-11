// Inside a store, drawn like a cartoon set: a flat-coloured 300x150-unit room, the owner big behind the counter,
// real stock on the racks, a gag sign or two on the wall.
import { K, C, LW, FONT, layer, rect, rrect, oval, poly, blob, line, text, clip, rng, pick, shade } from './toon.js';
import { itemCanvas } from './items.js';
import { catFrames } from '../cast/animals.js';
import { drawPuppet, puppet, puppetPortrait, shopLight, LIGHT, CAST } from '../cast/puppet.js';
import { neon, vanRear, tag } from './facades.js';

export const RW = 300;
export const RH = 150;
export const OWNER_X = 110;
export const OWNER_FEET = 134;
const FLOOR = 118;
const COUNTER_Y = 104;
export const roomR = () => Math.max(3, Math.min(6, Math.ceil(Math.max(innerWidth / RW, innerHeight / RH) * (devicePixelRatio || 1))));

// ---------- fixtures ----------
function shelfBoxes(ctx, x, y, w, rows, r) {
  for (let j = 0; j < rows; j++) {
    const sy = y + j * 15;
    rect(ctx, x - 1, sy + 11, w + 2, 2.4, '#c8742e', LW);
    for (let i = x + 1; i < x + w - 9; i += 9.6) {
      const c = pick(r, [C.orange, '#ffffff', '#1d1a22', C.red, C.blue, C.purple, C.green, C.yellow]);
      rect(ctx, i, sy + 4, 8.6, 7, c, LW * 0.8);
      rect(ctx, i + 0.6, sy + 5.2, 7.4, 1, c === '#ffffff' ? K : '#ffffff', 0);
    }
  }
}
function folded(ctx, x, y, w, rows, items) {
  for (let j = 0; j < rows; j++) {
    const sy = y + j * 13;
    rect(ctx, x - 1, sy + 10, w + 2, 2.4, '#8a5a34', LW);
    for (let i = 0; i < Math.floor(w / 11); i++) {
      const it = items[(i + j * 3) % items.length];
      for (let k = 0; k < 3; k++) rrect(ctx, x + 1 + i * 11, sy + 1.6 + k * 2.8, 9.6, 2.8, 0.8, k % 2 ? shade(it.color, -0.12) : it.color, LW * 0.6);
    }
  }
}
function rack(ctx, x, y, items, n = 4) {
  const w = 74;
  rect(ctx, x, y - 1, w, 2, '#c6c2d4', LW);
  for (const px of [x + 3, x + w - 3]) rect(ctx, px - 1, y, 2, FLOOR + 6 - y, '#a8a2bc', LW * 0.8);
  rect(ctx, x - 4, FLOOR + 5, 14, 2, '#a8a2bc', LW * 0.8);
  rect(ctx, x + w - 10, FLOOR + 5, 14, 2, '#a8a2bc', LW * 0.8);
  items.slice(0, n).forEach((it, i) => {
    const cx = x + 12 + i * ((w - 24) / Math.max(1, n - 1));
    line(ctx, [[cx, y], [cx - 1.6, y + 3], [cx + 1.6, y + 3]], 0.6);
    ctx.drawImage(itemCanvas(it, 6), cx - 15, y + 2, 30, 30);
    poly(ctx, [[cx + 5, y + 20], [cx + 13, y + 20], [cx + 14.4, y + 22.2], [cx + 13, y + 24.4], [cx + 5, y + 24.4]], C.yellow, LW * 0.7);
    text(ctx, '$', cx + 9, y + 22.4, { size: 3.4, font: FONT.block, fill: C.red });
  });
}
function frame(ctx, x, y, w, h, bg, title, sub, o = {}) {
  line(ctx, [[x + w / 2 - 6, y], [x + w / 2, y - 6], [x + w / 2 + 6, y]], 0.6);
  oval(ctx, x + w / 2, y - 6, 1, 1, '#a8a2bc', 0.4);
  rect(ctx, x - 2.4, y - 2.4, w + 4.8, h + 4.8, o.frame || '#c8742e', LW);
  rect(ctx, x, y, w, h, bg, LW * 0.8);
  text(ctx, title, x + w / 2, y + h * 0.36, { size: o.size || 7, font: o.font || FONT.slab, fill: o.color || K, stroke: o.stroke, sw: 0.6 });
  if (sub) text(ctx, sub, x + w / 2, y + h * 0.74, { size: o.subSize || 3.6, font: FONT.round, weight: 700, fill: o.subColor || K });
}
function windowCurtains(ctx, x, y, w, h, curtain, outside = C.sky) {
  rect(ctx, x - 2, y - 2, w + 4, h + 4, '#ffffff', LW);
  rect(ctx, x, y, w, h, outside, LW * 0.8);
  rect(ctx, x + w / 2 - 0.8, y, 1.6, h, '#ffffff', LW * 0.6);
  rect(ctx, x, y + h / 2 - 0.8, w, 1.6, '#ffffff', LW * 0.6);
  rect(ctx, x - 6, y - 6, w + 12, 3, shade(curtain, -0.2), LW);
  for (const s of [0, 1]) {
    const cx = s ? x + w + 2 : x - 6;
    poly(ctx, [[cx, y - 3], [cx + 8, y - 3], [cx + 6 + (s ? -2 : 2), y + h * 0.6], [cx + 8, y + h + 6], [cx, y + h + 6]], curtain, LW, 1.4);
    for (let i = 2; i < 8; i += 2.6) line(ctx, [[cx + i, y - 2], [cx + i, y + h + 5]], 0.5, shade(curtain, -0.18));
  }
}
function speaker(ctx, x, y, h) {
  rrect(ctx, x, y, 18, h, 1.4, '#2a2633', LW);
  for (let k = 0; k < Math.floor(h / 15); k++) { oval(ctx, x + 9, y + 8 + k * 15, 6, 6, '#4a4660', LW * 0.8); oval(ctx, x + 9, y + 8 + k * 15, 2.2, 2.2, '#8a849e', LW * 0.6); }
}
const size = (n) => [n.w, n.h];

// ---------- the seven rooms ----------
const ROOMS = {
  'north-america'(ctx, r, items, R) {
    rect(ctx, 0, 0, RW, FLOOR, '#ff4a2e', 0);
    windowCurtains(ctx, 140, 18, 30, 34, C.hotpink);
    shelfBoxes(ctx, 186, 8, 104, 6, r);
    const n = neon('UPTOWN', C.hotpink, R, { size: 12 });
    ctx.drawImage(n.on, 78, 4, ...size(n));
    frame(ctx, 136, 64, 40, 24, C.cream, 'IN GOD WE TRUST', 'ALL OTHERS PAY CASH', { size: 4.2, color: C.red, subSize: 3 });
    return { counter: '#1f8a4a', floor: '#d6297d', trim: '#ff8a6a' };
  },
  canada(ctx, r, items, R) {
    rect(ctx, 0, 0, RW, FLOOR, C.teal, 0);
    rect(ctx, 0, 0, RW, 10, '#f4f2fa', LW);
    for (let x = 0; x < RW; x += 30) line(ctx, [[x, 0], [x, 10]], 0.6);
    for (const tx of [40, 120, 200]) rrect(ctx, tx, 10, 30, 3, 1.4, '#ffffff', LW * 0.7);
    folded(ctx, 186, 18, 104, 5, items);
    frame(ctx, 140, 30, 32, 22, C.yellow, 'CASH', 'ONLY, STILL', { frame: '#ffffff' });
    frame(ctx, 76, 22, 52, 26, C.red, '6IX SIDE', 'SCARBOROUGH STAND UP', { color: '#ffffff', stroke: K, subColor: '#ffffff', frame: '#ffffff' });
    return { counter: '#3a3a6a', floor: '#2f62e0', trim: '#0e8a7c', checker: '#f4f2fa' };
  },
  'south-america'(ctx, r, items, R) {
    rect(ctx, 0, 0, RW, FLOOR, C.lime, 0);
    rect(ctx, 0, 52, RW, 30, C.hotpink, LW);
    line(ctx, [[180, 12], [236, 16], [292, 12]], 0.6, K, true);
    items.slice(0, 3).forEach((it, i) => ctx.drawImage(itemCanvas(it, 6), 186 + i * 34, 13, 30, 30));
    line(ctx, [[110, 0], [110, 10]], 0.7);
    oval(ctx, 110, 13, 3, 3.6, '#fff3a0', LW);
    speaker(ctx, 150, 60, 50);
    rect(ctx, 184, 56, 40, 26, '#009739', LW);
    poly(ctx, [[204, 59], [221, 69], [204, 79], [187, 69]], '#ffdf00', LW * 0.8);
    oval(ctx, 204, 69, 6, 6, '#1d3f9f', LW * 0.8);
    frame(ctx, 76, 24, 44, 24, '#ffffff', 'BAILE', 'SEXTA • 23H', { color: C.pink, stroke: K });
    return { counter: C.yellow, floor: C.yellow, trim: '#5fb02a' };
  },
  europe(ctx, r, items, R) {
    rect(ctx, 0, 0, RW, FLOOR, '#b9a6f2', 0);
    for (let y = 70; y < FLOOR; y += 9) for (let x = (y / 9) % 2 ? 0 : 4.5; x < RW; x += 9) rect(ctx, x, y, 9, 9, null, 0.3);
    shelfBoxes(ctx, 186, 6, 104, 6, r);
    const n = neon('93', C.red, R, { size: 24, font: FONT.slab });
    ctx.drawImage(n.on, 86, 0, ...size(n));
    rrect(ctx, 136, 28, 38, 26, 2, '#2a2633', LW);
    rect(ctx, 139, 31, 32, 20, '#3cc24b', LW * 0.8);
    line(ctx, [[155, 31], [155, 51]], 0.6, '#ffffff'); oval(ctx, 155, 41, 4, 4, null, 0.6); ctx.strokeStyle = '#ffffff'; ctx.stroke();
    oval(ctx, 147, 44, 1.4, 1.4, '#ffffff', 0.4);
    text(ctx, 'ALLEZ PARIS', 155, 59, { size: 3.8, font: FONT.block, fill: K });
    frame(ctx, 74, 52, 38, 26, C.yellow, 'PAS DE', 'CRÉDIT, MERCI');
    return { counter: '#2a2633', floor: '#5a5670', trim: '#8a7ad8', checker: '#4a4660' };
  },
  africa(ctx, r, items, R) {
    rect(ctx, 0, 0, RW, FLOOR, C.gold, 0);
    rect(ctx, 30, 6, 80, 3, '#ffffff', LW * 0.8);
    rect(ctx, 180, 13, 110, 1.6, '#c6c2d4', LW * 0.7);
    items.slice(0, 3).forEach((it, i) => ctx.drawImage(itemCanvas(it, 6), 186 + i * 34, 15, 30, 30));
    rrect(ctx, 140, 50, 44, 46, 1.4, '#ffffff', LW);
    text(ctx, 'PRICE LIST', 162, 56, { size: 5, font: FONT.block, fill: C.red });
    for (let j = 0; j < 6; j++) { rect(ctx, 144, 61 + j * 5, 20, 1.2, C.green, 0); rect(ctx, 170, 61 + j * 5, 10, 1.2, K, 0); }
    text(ctx, 'NO SHAKING', 162, 92, { size: 3.6, font: FONT.block, fill: K });
    for (const [i, c] of [[0, '#008751'], [1, '#ffffff'], [2, '#008751']]) rect(ctx, 76 + i * 14, 26, 14, 24, c, LW * 0.8);
    rrect(ctx, 192, 66, 24, 34, 2, '#2a2633', LW);
    oval(ctx, 204, 80, 9, 9, '#c6c2d4', LW);
    for (let i = 0; i < 3; i++) { const a = i * 2.1; poly(ctx, [[204, 80], [204 + Math.cos(a) * 8, 80 + Math.sin(a) * 8], [204 + Math.cos(a + 0.6) * 8, 80 + Math.sin(a + 0.6) * 8]], C.blue, LW * 0.6); }
    text(ctx, 'NEPA TAKE LIGHT AGAIN', 250, 66, { size: 3.8, font: FONT.round, weight: 700, fill: K });
    return { counter: C.green, floor: '#2fb84a', trim: '#e09a0b' };
  },
  asia(ctx, r, items, R) {
    rect(ctx, 0, 0, RW, FLOOR, C.violet, 0);
    folded(ctx, 4, 6, 70, 2, items);
    folded(ctx, 186, 6, 104, 7, items);
    const n = neon('古着', C.hotpink, R, { size: 22, font: FONT.jp });
    ctx.drawImage(n.on, 94, 0, ...size(n));
    for (const lx of [80, 170]) { line(ctx, [[lx, 0], [lx, 6]], 0.6); oval(ctx, lx, 13, 5, 7, C.red, LW); rect(ctx, lx - 3.6, 5.6, 7.2, 1.6, K, 0); rect(ctx, lx - 3.6, 18.8, 7.2, 1.6, K, 0); text(ctx, '祭', lx, 13.4, { size: 5, font: FONT.jp, weight: 900, fill: '#ffffff' }); }
    for (let i = 0; i < 4; i++) { rrect(ctx, 132 + i * 11, 38, 9.6, 16, 1.4, pick(r, ['#ffffff', C.yellow, C.sky2, C.hotpink]), LW * 0.8); oval(ctx, 136.8 + i * 11, 44, 3, 3, '#ffffff', LW * 0.6); }
    frame(ctx, 132, 62, 42, 26, '#ffffff', 'NO FAKES', 'ニセモノ禁止', { color: C.red, stroke: K, frame: '#8a5a34' });
    return { counter: '#8a5a34', floor: '#c8862a', trim: '#2e1d5a' };
  },
  oceania(ctx, r, items, R) {
    rect(ctx, 0, 0, RW, FLOOR, C.sky2, 0);
    for (let x = 0; x < RW; x += 5) line(ctx, [[x, 0], [x, FLOOR]], 0.5, '#4a9ed8');
    shelfBoxes(ctx, 186, 6, 104, 6, r);
    frame(ctx, 76, 14, 66, 22, '#1d3f9f', 'NO REFUNDS', 'NOT EVEN FOR YOUR MUM', { color: C.yellow, stroke: K, subColor: '#ffffff', frame: '#ffffff' });
    rrect(ctx, 150, 76, 30, 22, 2, C.blue, LW);
    rect(ctx, 150, 76, 30, 6, '#ffffff', LW * 0.8);
    text(ctx, 'ESKY', 165, 90, { size: 6, font: FONT.block, fill: '#ffffff', stroke: K, sw: 0.6 });
    tag(ctx, 82, 54, r, C.pink, 11, 'SHAZ');
    return { counter: '#1d3f9f', floor: '#e8e2f0', trim: '#2a7ac8', checker: '#c6c2d4' };
  },
};

function floorPaint(ctx, look) {
  rect(ctx, -1, FLOOR, RW + 2, RH - FLOOR + 1, look.floor, LW);
  if (look.checker) for (let y = FLOOR; y < RH; y += 8) for (let x = ((y - FLOOR) / 8) % 2 ? 0 : 8; x < RW; x += 16) rect(ctx, x, y, 8, 8, look.checker, 0);
  rect(ctx, -1, FLOOR - 4, RW + 2, 4, look.trim, LW);
  rect(ctx, -1, -1, RW + 2, 3, look.trim, LW);
}

export function buildRoom(store, items, R) {
  const r = rng(store.id.length * 97);
  const [c, ctx] = layer(RW, RH, R);
  const look = ROOMS[store.id](ctx, r, items, R);
  floorPaint(ctx, look);
  rack(ctx, 4, 16, items, 4);
  rack(ctx, 214, 66, items.slice(2).concat(items), 3);
  return { room: c, counterColor: look.counter };
}

// the counter (with register, bell and the bodega cat) drawn over the owner's legs
export function buildCounter(store, color, R) {
  const [c, ctx] = layer(RW, RH, R);
  const x0 = 50, w = 126;
  rect(ctx, x0 + 2, COUNTER_Y + 2, w, RH - COUNTER_Y, K, 0);
  rect(ctx, x0, COUNTER_Y + 3, w, RH - COUNTER_Y, color, LW);
  rect(ctx, x0 + 6, COUNTER_Y + 10, w - 12, 18, shade(color, -0.12), LW * 0.7);
  rrect(ctx, x0 - 3, COUNTER_Y, w + 6, 4.4, 1.4, '#ffffff', LW);
  text(ctx, store.name.toUpperCase(), x0 + w / 2, COUNTER_Y + 19.6, { size: 8, font: FONT.slab, fill: C.yellow, stroke: K, sw: 1, extrude: K, depth: 0.8 });
  const rx = 56;
  rrect(ctx, rx, COUNTER_Y - 11, 24, 11, 1, '#8a849e', LW);
  poly(ctx, [[rx + 3, COUNTER_Y - 11], [rx + 6, COUNTER_Y - 20], [rx + 20, COUNTER_Y - 20], [rx + 21, COUNTER_Y - 11]], '#6e6884', LW, 1);
  rect(ctx, rx + 7, COUNTER_Y - 19, 12, 5, '#9ff0b0', LW * 0.6);
  text(ctx, '$0.00', rx + 13, COUNTER_Y - 16.4, { size: 3, font: FONT.block, fill: K });
  for (let i = 0; i < 3; i++) for (let j = 0; j < 2; j++) rrect(ctx, rx + 3 + i * 6, COUNTER_Y - 9 + j * 4, 4.6, 2.6, 0.6, '#ffffff', 0.4);
  line(ctx, [[rx + 2, COUNTER_Y - 20], [rx, COUNTER_Y - 27]], 0.7);
  rect(ctx, rx - 12, COUNTER_Y - 32, 14, 6, C.red, LW * 0.7);
  text(ctx, 'NO SALE', rx - 5, COUNTER_Y - 29, { size: 2.8, font: FONT.block, fill: '#ffffff' });
  blob(ctx, [[146, COUNTER_Y], [146.6, COUNTER_Y - 4], [150, COUNTER_Y - 6], [153.4, COUNTER_Y - 4], [154, COUNTER_Y]], C.gold, LW);
  oval(ctx, 150, COUNTER_Y - 6.6, 1, 0.8, C.gold, 0.5);
  line(ctx, [[164, COUNTER_Y], [164, COUNTER_Y - 12]], 0.7);
  for (let k = 0; k < 3; k++) rect(ctx, 160.6, COUNTER_Y - 3 - k * 2.6, 7, 2, '#ffffff', 0.4);
  if (store.id === 'north-america') ctx.drawImage(catFrames(R)[1], 123, COUNTER_Y - 17.4, 22, 18);
  return c;
}

export function buildOwner(storeId, R) {
  const o = puppet(storeId);
  o.light = shopLight(STORE_LIGHT[storeId] || '#ffd21f');
  return o;
}
// every owner stands with their waist just below the counter top, so the counter hides everything from the
// belt down and the same amount of each of them shows above it
export function drawOwner(ctx, pose, actor) {
  const m = CAST[pose.id], H = 80 / m.hip;
  drawPuppet(ctx, pose.id, OWNER_X, COUNTER_Y + 5 + (1 - m.hip) * H, H, pose, { light: actor.light, shadow: false });
}
const STORE_LIGHT = { 'north-america': '#ffd21f', canada: '#7fe0ff', 'south-america': '#ff8a1f', europe: '#c6c2ff', africa: '#8fe03a', asia: '#ff6fb5', oceania: '#ffe066' };
export { COUNTER_Y };

// ---------- Booster Corner close-up: the camera inside the open trunk at night ----------
export const TW = 240;
export const TH = 170;
export function buildTrunkScene(items, R) {
  const r = rng(808);
  const [c, ctx] = layer(TW, TH, R);
  rect(ctx, 0, 0, TW, TH, '#2a3170', 0);
  ctx.lineWidth = 0.6; ctx.strokeStyle = '#3d4590';
  for (let i = 0; i < 26; i++) { const bx = r() * TW, by = 34 + r() * 110; ctx.strokeRect(bx, by, 9, 4); ctx.strokeRect(bx + 4.5, by + 4, 9, 4); }
  for (let i = 0; i < TW; i += 5) { line(ctx, [[i, 4], [i + 5, 30]], 0.5, '#8a90c8'); line(ctx, [[i + 5, 4], [i, 30]], 0.5, '#8a90c8'); }
  rect(ctx, 0, 2.4, TW, 1.6, '#8a90c8', 0.5);
  text(ctx, 'BOOSTER', 196, 46, { font: FONT.tag, size: 18, fill: C.purple, stroke: K, sw: 1.6, extrude: C.gold, depth: 1.6, rot: -0.08 });
  text(ctx, 'CORNER', 200, 64, { font: FONT.tag, size: 15, fill: C.gold, stroke: K, sw: 1.4, extrude: C.purple, depth: 1.4, rot: -0.08 });
  poly(ctx, [[104, 0], [116, 0], [190, 170], [30, 170]], 'rgba(255,224,102,0.14)', 0);
  rect(ctx, -1, 156, TW + 2, 15, '#1d2150', LW);
  oval(ctx, 196, 162, 18, 2.6, '#4a5aa8', 0.6);
  vanRear(ctx, 62, 30, 96, 118, r, items, { big: true });
  rect(ctx, 48, 164, 126, 3, K, 0);
  return c;
}
export function buildTrunkActor(R) {
  return puppet('booster');
}
// The booster leans into frame from the bottom left: head and chest, lit by the trunk lamp
export function drawBoosterBust(ctx, pose) {
  drawPuppet(ctx, 'booster', 40, 300, 230, pose, { light: LIGHT.night, shadow: false });
}
// head-and-shoulders portrait for the dialogue box
export function portrait(actor) {
  return puppetPortrait(actor.id, 160);
}
