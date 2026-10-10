// Inside a store, inked: a 300x150-unit room, the owner big behind the counter, real stock on the racks and walls.
import { INK, C, layer, shape, box, blob, pen, halftone, clipTo, letter, rng, pick, shade, seedInk } from './ink.js';
import { itemCanvas } from './items.js';
import { buildStander, OWNERS, BOOSTER, FRAME, catFrames } from './chars.js';
import { neon, vanRear, tag } from './facades.js';

export const RW = 300;
export const RH = 150;
export const OWNER_X = 110;
export const OWNER_FEET = 134;
export const OS = 1.3; // owners stand larger than life in their own shop
const FLOOR = 118;
const COUNTER_Y = 104;
export const roomR = () => Math.max(3, Math.min(6, Math.ceil(Math.max(innerWidth / RW, innerHeight / RH) * (devicePixelRatio || 1))));

// ---------- fixtures ----------
function shelfBoxes(ctx, x, y, w, rows, r) {
  for (let j = 0; j < rows; j++) {
    const sy = y + j * 15;
    box(ctx, x - 1, sy + 11, w + 2, 2.2, { fill: '#8a5a34', w: 0.6 });
    for (let i = x + 1; i < x + w - 9; i += 9.6) {
      const c = pick(r, [C.orange, '#f6f4ee', '#1d1a22', C.red, '#2a5ea8', C.purple, C.green]);
      box(ctx, i, sy + 4, 8.6, 7, { fill: c, w: 0.6 });
      pen(ctx, [[i + 0.6, sy + 5.6], [i + 8, sy + 5.6]], { c: c === '#f6f4ee' ? INK : '#f6f4ee', w: 0.4 });
      box(ctx, i + 2.8, sy + 7.6, 3, 1.8, { fill: '#fffdf4', w: 0.3 });
    }
  }
}
function folded(ctx, x, y, w, rows, items) {
  for (let j = 0; j < rows; j++) {
    const sy = y + j * 13;
    box(ctx, x - 1, sy + 10, w + 2, 2.2, { fill: '#6a4428', w: 0.6 });
    for (let i = 0; i < Math.floor(w / 11); i++) {
      const it = items[(i + j * 3) % items.length];
      for (let k = 0; k < 3; k++) box(ctx, x + 1 + i * 11, sy + 1.6 + k * 2.8, 9.6, 2.8, { fill: k % 2 ? shade(it.color, -0.12) : it.color, w: 0.4 });
    }
  }
}
function rack(ctx, x, y, items, n = 4) {
  const w = 74;
  pen(ctx, [[x, y], [x + w, y]], { w: 1.4, c: '#8a8698' });
  pen(ctx, [[x + 3, y], [x + 3, FLOOR + 6]], { w: 1.4, c: '#6a6676' });
  pen(ctx, [[x + w - 3, y], [x + w - 3, FLOOR + 6]], { w: 1.4, c: '#6a6676' });
  pen(ctx, [[x - 4, FLOOR + 6], [x + 10, FLOOR + 6]], { w: 1.4 });
  pen(ctx, [[x + w - 10, FLOOR + 6], [x + w + 4, FLOOR + 6]], { w: 1.4 });
  items.slice(0, n).forEach((it, i) => {
    const cx = x + 12 + i * ((w - 24) / Math.max(1, n - 1));
    pen(ctx, [[cx, y], [cx - 1.6, y + 3], [cx + 1.6, y + 3]], { w: 0.5 });
    ctx.drawImage(itemCanvas(it, 6), cx - 15, y + 2, 30, 30);
    box(ctx, cx + 6, y + 20, 7, 4, { fill: '#fffdf4', w: 0.4, j: 0.15 });
    letter(ctx, '$', cx + 9.5, y + 22.2, { size: 3.4, fill: C.red });
  });
}
function poster(ctx, x, y, w, h, bg, title, sub, r, o = {}) {
  box(ctx, x + 1.2, y + 1.2, w, h, { fill: INK, stroke: false });
  box(ctx, x, y, w, h, { fill: bg, w: 0.8, j: 0.4 });
  letter(ctx, title, x + w / 2, y + h * 0.32, { size: o.size || 7, fill: o.color || INK, stroke: o.stroke, sw: 0.6, font: o.font });
  if (sub) letter(ctx, sub, x + w / 2, y + h * 0.7, { size: o.subSize || 4.2, fill: o.subColor || INK, font: "'Patrick Hand', cursive" });
  blob(ctx, x + 2, y + 2, 0.8, 0.8, { fill: C.red, w: 0.3, n: 6 }); blob(ctx, x + w - 2, y + 2, 0.8, 0.8, { fill: C.red, w: 0.3, n: 6 });
}
function bulb(ctx, x, len) {
  pen(ctx, [[x, 0], [x, len]], { w: 0.6 });
  blob(ctx, x, len + 3, 2.6, 3.2, { fill: '#fff3b0', w: 0.7 });
  halftone(ctx, x - 26, len, 52, 40, '#fff3b055', 1.8, (xx, yy) => Math.max(0, 0.7 - Math.hypot(xx - x, yy - len) / 30));
}
function speaker(ctx, x, y, h) {
  box(ctx, x, y, 18, h, { fill: '#1d1a22', w: 0.8 });
  for (let k = 0; k < Math.floor(h / 15); k++) { blob(ctx, x + 9, y + 8 + k * 15, 6, 6, { fill: '#3a3640', w: 0.6 }); blob(ctx, x + 9, y + 8 + k * 15, 2.2, 2.2, { fill: '#5a5660', w: 0.4 }); }
}
function stripes(ctx, x, y, w, h, cols, vertical) {
  cols.forEach((c, i) => {
    ctx.fillStyle = c;
    if (vertical) ctx.fillRect(x + (i * w) / cols.length, y, w / cols.length + 0.2, h);
    else ctx.fillRect(x, y + (i * h) / cols.length, w, h / cols.length + 0.2);
  });
  pen(ctx, [[x, y], [x + w, y], [x + w, y + h], [x, y + h], [x, y]], { w: 0.7 });
}
function brickWall(ctx, x, y, w, h, base, r) {
  box(ctx, x, y, w, h, { fill: base, stroke: false });
  for (let i = 0; i < (w * h) / 70; i++) {
    const bx = x + r() * w, by = y + r() * h;
    for (let k = 0; k < 2; k++) box(ctx, bx + k * 3.6, by + k * 2.8, 7, 2.6, { fill: r() < 0.3 ? shade(base, -0.07) : false, stroke: shade(base, -0.24), w: 0.35, j: 0.2 });
  }
}

// ---------- the seven rooms ----------
const ROOMS = {
  'north-america'(ctx, r, items, R) {
    brickWall(ctx, 0, 0, RW, FLOOR, '#b8563a', r);
    shelfBoxes(ctx, 186, 8, 104, 6, r);
    const n = neon('UPTOWN', C.pink, R, { size: 11 });
    ctx.drawImage(n, 76, 6, ...size(n));
    poster(ctx, 138, 30, 30, 30, C.yellow, 'LOTTO', 'TODAY: $40 MIL', r, { color: C.red, stroke: INK });
    poster(ctx, 142, 66, 26, 22, '#f6f4ee', 'NO', 'LOITERING (UNLESS U BUYIN)', r, { color: C.red, subSize: 2.6 });
    const cat = catFrames(R)[1];
    ctx.drawImage(cat, 128, COUNTER_Y - 11.5, 16, 12);
    return { counter: '#2e6b4a', floor: 'wood' };
  },
  canada(ctx, r, items, R) {
    box(ctx, 0, 0, RW, FLOOR, { fill: '#d8d0bc', stroke: false });
    halftone(ctx, 0, 0, RW, FLOOR, '#a89c8030', 2, 0.5);
    box(ctx, 0, 0, RW, 10, { fill: '#efebe2', w: 0.7 });
    for (let x = 0; x < RW; x += 30) pen(ctx, [[x, 0], [x, 10]], { w: 0.5 });
    for (const tx of [40, 120, 200]) { box(ctx, tx, 10, 30, 2.6, { fill: '#fbfdff', w: 0.5 }); halftone(ctx, tx - 10, 12, 50, 14, '#ffffff', 1.6, (xx, yy) => Math.max(0, 0.7 - (yy - 12) / 16)); }
    folded(ctx, 186, 18, 104, 5, items);
    poster(ctx, 140, 30, 30, 22, C.yellow, 'CASH', 'ONLY, STILL', r, { color: INK });
    poster(ctx, 76, 18, 50, 26, C.red, '6IX SIDE', 'SCARBOROUGH STAND UP', r, { color: '#fff', stroke: INK, subColor: '#fff' });
    return { counter: '#3a3a5a', floor: 'tile' };
  },
  'south-america'(ctx, r, items, R) {
    brickWall(ctx, 0, 0, RW, FLOOR, '#c8693e', r);
    box(ctx, 0, 50, RW, 36, { fill: '#3fb0a4', w: 0.8, j: 0.6 });
    halftone(ctx, 0, 50, RW, 36, '#00000018', 1.8, 0.4);
    pen(ctx, [[180, 12], [236, 15], [292, 12]], { w: 0.6 });
    items.slice(0, 3).forEach((it, i) => ctx.drawImage(itemCanvas(it, 6), 186 + i * 34, 12, 30, 30));
    bulb(ctx, 110, 10);
    speaker(ctx, 150, 60, 50);
    box(ctx, 184, 56, 40, 26, { fill: '#009739', w: 0.7 });
    shape(ctx, [[204, 59], [221, 69], [204, 79], [187, 69]], { fill: '#ffdf00', w: 0.6, step: 4 });
    blob(ctx, 204, 69, 6, 6, { fill: '#1d3f8f', w: 0.6 });
    poster(ctx, 76, 30, 42, 22, '#f6f4ee', 'BAILE', 'SEXTA • 23H', r, { color: C.pink, stroke: INK });
    return { counter: '#e0b040', floor: 'tile2' };
  },
  europe(ctx, r, items, R) {
    for (let y = 0; y < FLOOR; y += 9) for (let x = (y / 9) % 2 ? 0 : 4.5; x < RW; x += 9) box(ctx, x, y, 8.6, 8.6, { fill: pick(r, ['#ecebef', '#e2e0e6', '#f4f3f6']), stroke: '#b8b4c0', w: 0.3, j: 0.15 });
    shelfBoxes(ctx, 186, 6, 104, 6, r);
    const n = neon('93', C.red, R, { size: 22, font: "'Anton', sans-serif" });
    ctx.drawImage(n, 86, 2, ...size(n));
    box(ctx, 136, 30, 36, 24, { fill: '#1d1a22', w: 0.8 });
    const tv = box(ctx, 138, 32, 32, 20, { fill: '#3fa04a', w: 0.5 });
    clipTo(ctx, tv, () => { halftone(ctx, 138, 32, 32, 20, '#ffffff55', 1.4, 0.4); pen(ctx, [[154, 32], [154, 52]], { c: '#fff', w: 0.5 }); blob(ctx, 154, 42, 4, 4, { fill: false, stroke: '#fff', w: 0.5 }); blob(ctx, 147, 44, 1.2, 1.2, { fill: '#fff', w: 0.3 }); });
    letter(ctx, 'ALLEZ PARIS', 154, 58, { size: 4, fill: INK });
    poster(ctx, 76, 50, 34, 24, C.yellow, 'PAS DE', 'CRÉDIT, MERCI', r, { color: INK });
    return { counter: '#1e1c24', floor: 'tile' };
  },
  africa(ctx, r, items, R) {
    const w = box(ctx, 0, 0, RW, FLOOR, { fill: '#c8352e', stroke: false });
    clipTo(ctx, w, () => { for (let x = 0; x < RW; x += 4) pen(ctx, [[x, 0], [x, FLOOR]], { c: '#8a1f1f', w: 0.7, j: 0.05 }); halftone(ctx, 0, 0, RW, FLOOR, '#00000018', 1.8, 0.4); });
    box(ctx, 30, 6, 80, 3, { fill: '#fbfdff', w: 0.5 });
    pen(ctx, [[180, 14], [290, 14]], { w: 1, c: '#8a8698' });
    items.slice(0, 3).forEach((it, i) => ctx.drawImage(itemCanvas(it, 6), 186 + i * 34, 15, 30, 30));
    box(ctx, 140, 50, 44, 46, { fill: '#f6f1e2', w: 0.8 });
    letter(ctx, 'PRICE LIST', 162, 56, { size: 5, fill: C.red });
    for (let j = 0; j < 6; j++) { pen(ctx, [[144, 62 + j * 5], [164, 62 + j * 5]], { c: '#2e6b4a', w: 0.6 }); pen(ctx, [[170, 62 + j * 5], [180, 62 + j * 5]], { w: 0.6 }); }
    letter(ctx, 'NO SHAKING', 162, 93, { size: 3.6, fill: INK });
    stripes(ctx, 76, 26, 40, 24, ['#008751', '#f6f4ee', '#008751'], true);
    box(ctx, 192, 70, 22, 30, { fill: '#2a2630', w: 0.8 });
    blob(ctx, 203, 82, 8, 8, { fill: '#5a5660', w: 0.6 });
    for (let i = 0; i < 3; i++) { const a = i * 2.1; pen(ctx, [[203, 82], [203 + Math.cos(a) * 7, 82 + Math.sin(a) * 7]], { w: 0.9 }); }
    letter(ctx, 'NEPA TAKE LIGHT AGAIN', 238, 64, { size: 3.6, fill: '#fff', font: "'Patrick Hand', cursive" });
    return { counter: '#2e6b4a', floor: 'concrete' };
  },
  asia(ctx, r, items, R) {
    box(ctx, 0, 0, RW, FLOOR, { fill: '#3a3440', stroke: false });
    halftone(ctx, 0, 0, RW, FLOOR, '#00000030', 1.8, 0.45);
    folded(ctx, 4, 6, 70, 2, items);
    folded(ctx, 186, 6, 104, 7, items);
    const n = neon('古着', C.pink, R, { size: 20, font: "'Noto Sans JP','Hiragino Sans','Yu Gothic',sans-serif" });
    ctx.drawImage(n, 92, 2, ...size(n));
    for (const lx of [80, 168]) { pen(ctx, [[lx, 0], [lx, 6]], { w: 0.6 }); blob(ctx, lx, 13, 5, 7, { fill: '#e0302a', w: 0.8 }); pen(ctx, [[lx - 4.4, 13], [lx + 4.4, 13]], { w: 0.5 }); letter(ctx, '祭', lx, 13.5, { size: 5, fill: '#fff', font: "'Noto Sans JP',sans-serif" }); }
    for (let i = 0; i < 4; i++) { box(ctx, 132 + i * 11, 40, 9.6, 14, { fill: pick(r, ['#f6f4ee', C.yellow, C.cyan, C.pink]), w: 0.6 }); blob(ctx, 136.8 + i * 11, 46, 3, 3, { fill: '#fff', w: 0.4 }); }
    poster(ctx, 134, 60, 40, 26, '#f6f4ee', 'NO FAKES', 'ニセモノ禁止', r, { color: C.red, stroke: INK, subSize: 4 });
    return { counter: '#5a3a24', floor: 'wood' };
  },
  oceania(ctx, r, items, R) {
    const w = box(ctx, 0, 0, RW, FLOOR, { fill: '#c9c6cf', stroke: false });
    clipTo(ctx, w, () => { for (let y = 0; y < FLOOR; y += 4) pen(ctx, [[0, y], [RW, y]], { c: '#a8a4b2', w: 0.7, j: 0.05 }); halftone(ctx, 0, 0, RW, FLOOR, '#00000014', 1.8, 0.4); });
    shelfBoxes(ctx, 186, 6, 104, 6, r);
    poster(ctx, 76, 12, 64, 18, '#1d3f8f', 'NO REFUNDS', 'NOT EVEN FOR YOUR MUM', r, { color: C.yellow, stroke: INK, subColor: '#fff' });
    box(ctx, 150, 76, 30, 22, { fill: '#2a6fd0', w: 0.8 });
    box(ctx, 150, 76, 30, 6, { fill: '#f6f4ee', w: 0.6 });
    letter(ctx, 'ESKY', 165, 90, { size: 6, fill: '#fff', stroke: INK, sw: 0.5 });
    tag(ctx, 82, 50, r, C.pink, 10);
    return { counter: '#1d3f8f', floor: 'lino' };
  },
};
const size = (c) => [c.uw, c.uh];

function floor(ctx, kind, r) {
  const p = box(ctx, -1, FLOOR, RW + 2, RH - FLOOR + 1, { fill: { wood: '#9a6a44', tile: '#d8d4cc', tile2: '#c8b48a', concrete: '#a8a094', lino: '#b8b4a0' }[kind], w: 0.9 });
  clipTo(ctx, p, () => {
    if (kind === 'wood') { for (let y = FLOOR + 4; y < RH; y += 5) pen(ctx, [[0, y], [RW, y]], { c: '#6a4428', w: 0.5 }); for (let i = 0; i < 40; i++) { const x = r() * RW, y = FLOOR + Math.floor(r() * 7) * 5; pen(ctx, [[x, y], [x, y + 5]], { c: '#6a4428', w: 0.4 }); } }
    else if (kind === 'tile' || kind === 'tile2') { for (let x = -20; x < RW + 40; x += 12) pen(ctx, [[x, FLOOR], [x - 16, RH]], { c: '#8a8478', w: 0.4 }); for (let y = FLOOR + 6; y < RH; y += 7) pen(ctx, [[0, y], [RW, y]], { c: '#8a8478', w: 0.4 }); }
    else if (kind === 'lino') { for (let y = FLOOR; y < RH; y += 8) for (let x = ((y - FLOOR) / 8) % 2 ? 0 : 8; x < RW; x += 16) box(ctx, x, y, 8, 8, { fill: '#8a8676', stroke: false }); }
    else for (let i = 0; i < 6; i++) pen(ctx, [[r() * RW, FLOOR + r() * 30], [r() * RW, FLOOR + r() * 30]], { w: 0.4, j: 0.8 });
    halftone(ctx, 0, FLOOR, RW, RH - FLOOR, '#00000028', 1.8, (xx, yy) => 0.15 + ((yy - FLOOR) / (RH - FLOOR)) * 0.5);
  });
}

export function buildRoom(store, items, R) {
  const r = rng(store.id.length * 97);
  seedInk(store.id.length * 31);
  const [c, ctx] = layer(RW, RH, R);
  const look = ROOMS[store.id](ctx, r, items, R);
  // corner shading
  halftone(ctx, 0, 0, RW, FLOOR, '#00000022', 2, (xx, yy) => Math.max(0, (Math.abs(xx - OWNER_X) / RW) * 0.9 - 0.15));
  floor(ctx, look.floor, r);
  rack(ctx, 4, 16, items, 4);
  rack(ctx, 214, 66, items.slice(2).concat(items), 3);
  return { room: c, counterColor: look.counter };
}

// counter + register drawn over the owner every frame (into a cached sprite)
export function buildCounter(store, color, R) {
  const [c, ctx] = layer(RW, RH, R);
  seedInk(5);
  const x0 = 50, w = 126;
  box(ctx, x0 + 1.4, COUNTER_Y + 1.4, w, RH - COUNTER_Y, { fill: INK, stroke: false });
  const face = box(ctx, x0, COUNTER_Y + 3, w, RH - COUNTER_Y, { fill: color, w: 1 });
  clipTo(ctx, face, () => halftone(ctx, x0, COUNTER_Y + 3, w, RH - COUNTER_Y, '#00000026', 1.8, (xx, yy) => 0.2 + ((yy - COUNTER_Y) / 40) * 0.4));
  box(ctx, x0 - 3, COUNTER_Y, w + 6, 4, { fill: '#e8dcc0', w: 0.9 });
  letter(ctx, store.name.toUpperCase(), x0 + w / 2, COUNTER_Y + 20, { size: 9, fill: '#fffdf4', stroke: INK, sw: 1, shadow: INK });
  // register with its NO SALE flag
  const rx = 56;
  box(ctx, rx, COUNTER_Y - 11, 24, 11, { fill: '#5a5662', w: 0.8 });
  shape(ctx, [[rx + 3, COUNTER_Y - 11], [rx + 6, COUNTER_Y - 20], [rx + 20, COUNTER_Y - 20], [rx + 21, COUNTER_Y - 11]], { fill: '#3a3640', w: 0.8, step: 4 });
  box(ctx, rx + 7, COUNTER_Y - 19, 12, 5, { fill: '#9ff0b0', w: 0.5 });
  letter(ctx, '$0.00', rx + 13, COUNTER_Y - 16.4, { size: 3, fill: INK });
  for (let i = 0; i < 3; i++) for (let j = 0; j < 2; j++) box(ctx, rx + 3 + i * 6, COUNTER_Y - 9 + j * 4, 4.6, 2.6, { fill: '#e6e2ea', w: 0.3 });
  pen(ctx, [[rx + 2, COUNTER_Y - 20], [rx, COUNTER_Y - 27]], { w: 0.6 });
  box(ctx, rx - 12, COUNTER_Y - 32, 14, 6, { fill: C.red, w: 0.5 });
  letter(ctx, 'NO SALE', rx - 5, COUNTER_Y - 29, { size: 2.8, fill: '#fff' });
  // bell + receipt spike
  blob(ctx, 150, COUNTER_Y - 2.6, 4, 3, { fill: C.gold, w: 0.6 });
  pen(ctx, [[150, COUNTER_Y - 5.4], [150, COUNTER_Y - 7]], { w: 0.8 });
  pen(ctx, [[164, COUNTER_Y], [164, COUNTER_Y - 12]], { w: 0.6 });
  for (let k = 0; k < 3; k++) box(ctx, 160.6, COUNTER_Y - 3 - k * 2.6, 7, 2, { fill: '#fffdf4', w: 0.3 });
  return c;
}

export function buildOwner(storeId, R) {
  const Rf = Math.ceil(R * OS);
  return [buildStander({ ...OWNERS[storeId] }, Rf, 11), buildStander({ ...OWNERS[storeId] }, Rf, 12)];
}
export function drawOwner(ctx, fr) {
  ctx.drawImage(fr, OWNER_X - FRAME.ox * OS, OWNER_FEET - FRAME.oy * OS, FRAME.w * OS, FRAME.h * OS);
}
export { COUNTER_Y };

// ---------- Booster Corner close-up: zoomed into the open trunk ----------
export const TW = 240;
export const TH = 170;
export function buildTrunkScene(items, R) {
  const r = rng(808);
  seedInk(808);
  const [c, ctx] = layer(TW, TH, R);
  brickWall(ctx, 0, 0, TW, TH, '#5a4450', r);
  halftone(ctx, 0, 0, TW, TH, '#0a060e55', 1.8, 0.65);
  for (let i = 0; i < TW; i += 4) { pen(ctx, [[i, 4], [i + 4, 30]], { c: '#8a8698', w: 0.4 }); pen(ctx, [[i + 4, 4], [i, 30]], { c: '#8a8698', w: 0.4 }); }
  pen(ctx, [[0, 3], [TW, 3]], { w: 1, c: '#a8a4b0' });
  letter(ctx, 'BOOSTER', 196, 44, { font: "'Permanent Marker', cursive", size: 16, fill: C.purple, stroke: INK, sw: 1.4, rot: -0.08 });
  letter(ctx, 'CORNER', 200, 60, { font: "'Permanent Marker', cursive", size: 13, fill: C.gold, stroke: INK, sw: 1.2, rot: -0.08 });
  halftone(ctx, 60, 20, 120, 150, '#fff3b0', 2, (xx, yy) => Math.max(0, 0.45 - Math.abs(xx - 110) / ((yy - 20) * 0.6 + 10)));
  box(ctx, -1, 156, TW + 2, 15, { fill: '#2a2430', w: 0.8 });
  halftone(ctx, 0, 156, TW, 14, '#ffffff14', 1.8, 0.5);
  vanRear(ctx, 62, 30, 96, 118, r, items, { big: true });
  box(ctx, 48, 164, 126, 3, { fill: INK, stroke: false });
  return c;
}
export function buildTrunkActor(R) {
  const Rf = Math.ceil(R * 1.7);
  return [buildStander(BOOSTER, Rf, 31), buildStander(BOOSTER, Rf, 32)];
}
// The booster leans into frame at 1.7x: head + chest of his figure
export function drawBoosterBust(ctx, fr) {
  const k = fr.width / FRAME.w;
  ctx.drawImage(fr, 0, 0, 46 * k, 46 * k, -6, 92, 46 * 1.7, 46 * 1.7);
}
// head-and-shoulders crop for the dialogue portrait
export function portrait(fr) {
  const k = fr.width / FRAME.w;
  const c = document.createElement('canvas');
  c.width = Math.round(26 * k);
  c.height = Math.round(26 * k);
  c.getContext('2d').drawImage(fr, 10 * k, 0, 26 * k, 26 * k, 0, 0, c.width, c.height);
  return c;
}
