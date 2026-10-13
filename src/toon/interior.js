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
// how much of each owner shows above the counter, and where the counter cuts them (fraction of their height)
const SHOW = 80;
const cutAt = (m) => m.counter ?? m.hip;
export function drawOwner(ctx, pose, actor) {
  const m = CAST[pose.id], H = SHOW / cutAt(m);
  drawPuppet(ctx, pose.id, OWNER_X, COUNTER_Y + 5 + (1 - cutAt(m)) * H, H, pose, { light: actor.light, shadow: false });
}
// the strip of the room the camera keeps in frame: from just over the owner's head to just under the counter top
export function ownerBand(id) {
  const top = COUNTER_Y + 5 - SHOW;
  return { top: top - 7, bottom: COUNTER_Y + 9 };
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

// ---------- Hammerdome Auction Hall: velvet curtains, a stage, the podium and the lot up on the big screen ----------
export const AW = 300, AH2 = 150;
const POD = { x: 92, y: 74, w: 52 }; // podium top-left; the auctioneer stands behind it
const SCREEN = { x: 170, y: 22, w: 96, h: 70 };
export function buildAuctionHall(R) {
  const [c, ctx] = layer(AW, AH2, R);
  rect(ctx, 0, 0, AW, AH2, '#5a0f1e', 0);
  // back wall: deep red damask with a gold dado rail
  ctx.fillStyle = '#6e1426';
  for (let y = 6; y < 96; y += 12) for (let x = (y / 12) % 2 ? 6 : 0; x < AW; x += 12) { ctx.beginPath(); ctx.moveTo(x, y - 3); ctx.lineTo(x + 3, y); ctx.lineTo(x, y + 3); ctx.lineTo(x - 3, y); ctx.fill(); }
  rect(ctx, -1, 92, AW + 2, 4, C.gold, LW);
  rect(ctx, -1, 96, AW + 2, 22, '#3a0a16', LW);
  for (let x = 6; x < AW; x += 16) rect(ctx, x, 99, 10, 15, '#4a0e1c', LW * 0.6);
  // swagged curtains at both sides and a pelmet along the top
  for (const s of [0, 1]) {
    const x0 = s ? AW - 46 : 0;
    poly(ctx, s ? [[AW, 0], [AW - 46, 0], [AW - 30, 60], [AW - 40, 118], [AW, 118]] : [[0, 0], [46, 0], [30, 60], [40, 118], [0, 118]], '#a8122c', LW);
    for (let k = 1; k < 5; k++) line(ctx, s ? [[AW - k * 9, 0], [AW - k * 6 - 2, 60], [AW - k * 8, 118]] : [[k * 9, 0], [k * 6 + 2, 60], [k * 8, 118]], 0.7, '#7a0c1e', true);
    oval(ctx, s ? AW - 34 : 34, 62, 4, 3, C.gold, LW * 0.8);
    rect(ctx, x0, 0, 46, 2, C.gold, 0);
  }
  for (let x = 0; x < AW; x += 20) { ctx.beginPath(); ctx.ellipse(x + 10, 6, 11, 7, 0, 0, Math.PI); ctx.fillStyle = '#a8122c'; ctx.fill(); ctx.lineWidth = LW; ctx.strokeStyle = K; ctx.stroke(); }
  rect(ctx, -1, -1, AW + 2, 7, '#a8122c', LW);
  for (let x = 4; x < AW; x += 5) line(ctx, [[x, 12], [x, 15]], 0.8, C.gold);
  // chandelier
  line(ctx, [[150, 6], [150, 14]], 0.8);
  ctx.beginPath(); ctx.ellipse(150, 18, 16, 5, 0, 0, Math.PI); ctx.fillStyle = C.gold; ctx.fill(); ctx.lineWidth = LW; ctx.strokeStyle = K; ctx.stroke();
  for (let k = -3; k <= 3; k++) { line(ctx, [[150 + k * 4.6, 19], [150 + k * 4.6, 23]], 0.6, C.gold2); oval(ctx, 150 + k * 4.6, 24, 1.3, 1.6, '#fff3a0', 0.4); }
  // the big screen for the lot, framed in gold (contents drawn live)
  rrect(ctx, SCREEN.x - 5, SCREEN.y - 5, SCREEN.w + 10, SCREEN.h + 10, 2, C.gold, LW);
  rect(ctx, SCREEN.x, SCREEN.y, SCREEN.w, SCREEN.h, '#120c18', LW);
  text(ctx, 'ON THE BLOCK', SCREEN.x + SCREEN.w / 2, SCREEN.y - 9, { size: 5, font: FONT.slab, fill: C.gold, stroke: K, sw: 0.5 });
  // stage
  rect(ctx, 20, 108, 260, 10, '#8a4a22', LW);
  rect(ctx, 20, 108, 260, 2, C.gold, 0.5);
  for (let x = 30; x < 280; x += 14) line(ctx, [[x, 110], [x, 118]], 0.4, '#6a3414');
  // the house sign
  rrect(ctx, 54, 26, 36, 22, 2, '#1d1a22', LW);
  text(ctx, 'NO', 72, 33, { size: 4.4, font: FONT.block, fill: C.gold });
  text(ctx, 'REFUNDS', 72, 39.6, { size: 4.4, font: FONT.block, fill: C.gold });
  text(ctx, 'EVER', 72, 45.6, { size: 3.4, font: FONT.round, weight: 700, fill: '#ffffff' });
  return c;
}
// the podium goes in front of the auctioneer
export function buildPodium(R) {
  const [c, ctx] = layer(AW, AH2, R);
  const { x, y, w } = POD;
  poly(ctx, [[x, y], [x + w, y], [x + w - 4, 110], [x + 4, 110]], '#7a3a18', LW);
  rect(ctx, x - 3, y - 3, w + 6, 5, '#5a2a10', LW);
  rrect(ctx, x + w / 2 - 11, y + 8, 22, 22, 2, C.gold, LW);
  text(ctx, 'H', x + w / 2, y + 19.6, { size: 13, font: FONT.slab, fill: '#7a1424', stroke: K, sw: 0.6 });
  for (const lx of [x + 8, x + w - 8]) line(ctx, [[lx, y + 6], [lx - 2, 108]], 0.6, '#5a2a10');
  // a sound block and a glass of water on top
  rrect(ctx, x + 4, y - 7, 12, 4, 1, '#3a1a08', LW * 0.7);
  rect(ctx, x + w - 10, y - 9, 5, 6, 'rgba(200,240,255,0.6)', LW * 0.6);
  return c;
}
// live layer: the lot on the screen, the spotlight, the auctioneer and the room's paddles
const SEATS = 9;
export function drawAuctionLive(ctx, s, t, gavel) {
  // lot on the big screen
  if (s.lot) {
    const { x, y, w, h } = SCREEN;
    ctx.save(); ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
    const g = ctx.createRadialGradient(x + w / 2, y + h * 0.45, 4, x + w / 2, y + h * 0.45, w * 0.7);
    g.addColorStop(0, '#3a2a5a'); g.addColorStop(1, '#120c18');
    ctx.fillStyle = g; ctx.fillRect(x, y, w, h);
    ctx.drawImage(itemCanvas(s.lot), x + w / 2 - 22, y + 4, 44, 44);
    text(ctx, `LOT ${s.lot.lot}`, x + 12, y + 7, { size: 4.4, font: FONT.slab, fill: C.gold });
    const nm = s.lot.name.length > 26 ? `${s.lot.name.slice(0, 25)}…` : s.lot.name;
    text(ctx, nm.toUpperCase(), x + w / 2, y + 53, { size: 4.2, font: FONT.block, fill: '#ffffff' });
    const sold = s.phase === 'sold';
    const bid = `$${Math.round(s.bid || s.lot.start).toLocaleString('en-US')}`;
    text(ctx, sold ? (s.high ? `SOLD ${bid}` : 'NO SALE') : bid, x + w / 2, y + 62, { size: 7, font: FONT.slab, fill: sold ? C.red : C.lime, stroke: K, sw: 0.6 });
    if (!sold) rect(ctx, x + 4, y + h - 3, (w - 8) * Math.min(1, s.left / s.total), 1.6, s.left <= 6 ? C.red : C.gold, 0);
    ctx.restore();
  }
  // spotlight on the podium
  const sg = ctx.createRadialGradient(118, 64, 4, 118, 64, 70);
  sg.addColorStop(0, 'rgba(255,236,170,0.32)'); sg.addColorStop(1, 'rgba(255,236,170,0)');
  ctx.fillStyle = sg; ctx.fillRect(40, 0, 160, 120);
  drawAuctioneer(ctx, POD.x + POD.w / 2, POD.y, t, gavel);
}
// The auctioneer: Hoss Hammerdome, ten-gallon hat taller than his torso, white suit, bolo tie, gavel in hand.
// Shown as a spotlit silhouette with a gold rim until his hand-drawn art arrives.
function drawAuctioneer(ctx, cx, podY, t, gavel) {
  ctx.save();
  ctx.translate(cx, podY);
  ctx.scale(0.66, 0.66);
  const bob = Math.round(Math.sin(t * 6) * 2) / 2;
  const sil = '#160c14', rim = C.gold;
  const paint = (pts, curve) => {
    ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) {
      if (curve) { const p = pts[i - 1], q = pts[i]; ctx.quadraticCurveTo(p[0], p[1], (p[0] + q[0]) / 2, (p[1] + q[1]) / 2); } else ctx.lineTo(pts[i][0], pts[i][1]);
    }
    ctx.closePath(); ctx.fillStyle = sil; ctx.fill(); ctx.lineWidth = 1.3; ctx.strokeStyle = rim; ctx.stroke();
  };
  const y = bob;
  // shoulders and suit
  paint([[-26, 4], [-24, y - 20], [-9, y - 27], [9, y - 27], [24, y - 20], [26, 4]]);
  // head
  ctx.beginPath(); ctx.ellipse(0, y - 37, 9, 11, 0, 0, Math.PI * 2); ctx.fillStyle = sil; ctx.fill(); ctx.lineWidth = 1.3; ctx.strokeStyle = rim; ctx.stroke();
  // the hat: a ten-gallon crown that goes on forever, pinched at the top, on a brim curled up at both sides
  paint([[-34, y - 52], [-24, y - 46], [-12, y - 48], [-15, y - 98], [-11, y - 112], [-4, y - 106], [0, y - 112], [4, y - 106], [11, y - 112], [15, y - 98], [12, y - 48], [24, y - 46], [34, y - 52], [26, y - 42], [0, y - 39], [-26, y - 42]], true);
  ctx.fillStyle = rim; ctx.fillRect(-13, y - 58, 26, 4);
  // gavel arm: up while he calls, slammed down on a bid or the hammer
  const ang = gavel > 0 ? 0.9 : -1.3 + Math.sin(t * 5) * 0.12;
  ctx.save(); ctx.translate(20, y - 18); ctx.rotate(ang);
  paint([[0, -3.4], [26, -3.4], [26, 3.4], [0, 3.4]]);
  ctx.translate(26, 0); ctx.rotate(-ang + (gavel > 0 ? 0.2 : 0));
  rrect(ctx, -8, -6, 16, 8, 1.8, '#8a4a22', LW); rect(ctx, -1.4, 2, 2.8, 11, '#8a4a22', LW * 0.8);
  ctx.restore();
  if (gavel > 0) for (let k = 0; k < 5; k++) { const a = -Math.PI + k * (Math.PI / 4); line(ctx, [[50 + Math.cos(a) * 9, -6 + Math.sin(a) * 6], [50 + Math.cos(a) * 16, -6 + Math.sin(a) * 10]], 1.3, C.yellow); }
  // two eyes catch the light under the brim, and a big white handlebar moustache
  oval(ctx, -3.6, y - 38, 1.5, 1.1, '#ffffff', 0); oval(ctx, 3.6, y - 38, 1.5, 1.1, '#ffffff', 0);
  ctx.beginPath(); ctx.moveTo(0, y - 31); ctx.quadraticCurveTo(-8, y - 33, -12, y - 28); ctx.quadraticCurveTo(-6, y - 29, 0, y - 29); ctx.quadraticCurveTo(6, y - 29, 12, y - 28); ctx.quadraticCurveTo(8, y - 33, 0, y - 31); ctx.fillStyle = '#f4f0e8'; ctx.fill();
  ctx.restore();
}
// the audience: rows of heads from behind; a paddle shoots up when that seat bids
export function drawAudience(ctx, s, t, clock) {
  const seatOf = (p) => { let h = 0; for (const ch of p) h = (h * 31 + ch.charCodeAt(0)) >>> 0; return h % SEATS; };
  const up = new Map();
  for (const h of s.history || []) if (!h.who.you && clock - h.at < 1.6 && !up.has(seatOf(h.who.paddle))) up.set(seatOf(h.who.paddle), h.who.paddle);
  for (let row = 0; row < 2; row++) {
    const y = 130 + row * 14;
    rect(ctx, -1, y + 4, AW + 2, 16, row ? '#200a12' : '#2a0c16', 0);
    for (let i = 0; i < SEATS; i++) {
      const x = 18 + i * 33 + row * 16;
      const seat = row ? (i + 4) % SEATS : i;
      const hat = (i * 7 + row * 3) % 5;
      const hy = y - 4 + Math.round(Math.sin(t * 3 + i * 1.7) * 0.6);
      ctx.fillStyle = '#12080e';
      ctx.beginPath(); ctx.ellipse(x, hy + 10, 11, 7, 0, Math.PI, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(x, hy, 6.4, 7.4, 0, 0, Math.PI * 2); ctx.fill();
      if (hat === 0) { ctx.fillRect(x - 9, hy - 6, 18, 2); ctx.fillRect(x - 5, hy - 12, 10, 7); }
      if (hat === 1) { ctx.beginPath(); ctx.ellipse(x, hy - 4, 8, 5, 0, Math.PI, Math.PI * 2); ctx.fill(); }
      if (row === 0 && up.has(seat)) {
        const px = x + 9, py = hy - 30;
        line(ctx, [[px, py + 10], [px - 2, hy + 4]], 1.4, '#c8a070');
        rrect(ctx, px - 7, py - 6, 14, 12, 2, '#ffffff', LW);
        text(ctx, up.get(seat).replace('Paddle ', '').replace('Online', 'WEB'), px, py, { size: 5.6, font: FONT.slab, fill: K });
      }
    }
  }
}
export function auctioneerPortrait(px = 160) {
  const c = document.createElement('canvas');
  c.width = c.height = px;
  const x = c.getContext('2d');
  x.scale(px / 40, px / 40);
  x.fillStyle = '#7a1424'; x.fillRect(0, 0, 40, 40);
  x.fillStyle = '#160c14';
  x.beginPath(); x.ellipse(20, 30, 6, 7.4, 0, 0, Math.PI * 2); x.fill();
  x.beginPath(); x.moveTo(4, 24); x.lineTo(36, 24); x.lineTo(31, 21); x.lineTo(27, 21); x.lineTo(28, 2); x.lineTo(22, -1); x.lineTo(18, -1); x.lineTo(12, 2); x.lineTo(13, 21); x.lineTo(9, 21); x.closePath(); x.fill();
  x.fillStyle = '#ffc21a'; x.fillRect(13, 17, 14, 2);
  x.fillStyle = '#ffffff'; x.fillRect(17, 29, 1.6, 1.2); x.fillRect(22, 29, 1.6, 1.2);
  x.fillStyle = '#160c14'; x.fillRect(4, 38, 32, 6);
  return c;
}
