// Flat cartoon storefronts, one per neighbourhood, plus the booster's alley, construction and street furniture.
// Drawn in world units on the street layer: the building line is y = G, buildings rise toward -y.
import { K, C, LW, FONT, layer, rect, rrect, oval, poly, blob, line, tube, text, measure, clip, dots, shade, pick } from './toon.js';
import { itemCanvas } from './items.js';
import { catFrames } from './chars.js';

export const SW = 160;
export const ALLEY_W = 100;
const TAGS = ['ZOOT', 'KRUSH', 'BLAM', 'SMOK', 'DUKE', 'REEK', 'BX', 'FLIP', 'YO!', 'RAZ', 'KAOS', 'ZIP'];

// ---------- building blocks ----------
function wall(ctx, x, y, w, h, color) { rect(ctx, x, y, w, h, color, LW); }
function brickMarks(ctx, x, y, w, h, color, r, n) {
  ctx.lineWidth = 0.55;
  ctx.strokeStyle = color;
  for (let i = 0; i < n; i++) {
    const bx = x + 4 + r() * (w - 16), by = y + 4 + r() * (h - 12);
    ctx.strokeRect(bx, by, 6, 2.6);
    ctx.strokeRect(bx + 3.2, by + 2.6, 6, 2.6);
  }
}
function win(ctx, x, y, w, h, r, o = {}) {
  const fr = o.frame || '#ffffff';
  rect(ctx, x - 1.4, y - 1.4, w + 2.8, h + 2.8, fr, LW);
  const lit = o.lit ?? r() < 0.2;
  rect(ctx, x, y, w, h, lit ? C.winLit : o.glass || C.win, LW * 0.8);
  if (!lit && !o.plain && r() < 0.35) rect(ctx, x, y, w, h * (0.25 + r() * 0.4), pick(r, [C.hotpink, C.yellow, C.mint, '#ffffff', C.orange, C.lav]), LW * 0.6);
  if (o.cross !== false) { rect(ctx, x + w / 2 - 0.5, y, 1, h, fr, 0); rect(ctx, x, y + h * 0.5 - 0.5, w, 1, fr, 0); }
  if (o.sill !== false) rect(ctx, x - 2.4, y + h + 1.4, w + 4.8, 1.8, o.sillColor || fr, LW * 0.8);
  if (o.bars) for (let i = x + 2; i < x + w; i += 2.6) line(ctx, [[i, y], [i, y + h]], 0.5);
  if (o.plant || (o.plant !== false && r() < 0.12)) { rect(ctx, x + w * 0.6, y + h - 2.4, 4, 3, C.orange, 0.5); oval(ctx, x + w * 0.6 + 2, y + h - 4, 3, 2.4, C.green, 0.5); }
  return [x, y, w, h];
}
function awning(ctx, x, y, w, c1, c2, depth = 7) {
  const n = Math.max(3, Math.round(w / 9)), sw = w / n;
  rect(ctx, x, y, w, depth, c1, LW);
  for (let i = 0; i < n; i += 2) rect(ctx, x + i * sw, y, sw, depth, c2, 0);
  for (let i = 0; i < n; i++) { ctx.beginPath(); ctx.ellipse(x + (i + 0.5) * sw, y + depth, sw / 2, 2.6, 0, 0, Math.PI); ctx.closePath(); ctx.fillStyle = i % 2 ? c1 : c2; ctx.fill(); ctx.lineWidth = LW; ctx.strokeStyle = K; ctx.stroke(); }
  rect(ctx, x, y, w, depth, null, LW);
}
function board(ctx, x, y, w, h, bg, str, o = {}) {
  rect(ctx, x, y, w, h, bg, LW);
  text(ctx, str, x + w / 2, y + h / 2 + (o.dy || 0), { size: o.size || h * 0.62, font: o.font || FONT.slab, fill: o.color || K, stroke: o.stroke, sw: o.sw, extrude: o.extrude, depth: o.depth });
  if (o.sub) text(ctx, o.sub, x + w / 2, y + h - 2.6, { size: o.subSize || 3.6, font: FONT.round, weight: 600, fill: o.subColor || K });
}
function display(ctx, x, y, w, h, items, o = {}) {
  rect(ctx, x - 1.6, y - 1.6, w + 3.2, h + 3.2, o.frame || '#2a2633', LW);
  rect(ctx, x, y, w, h, o.bg || '#fff1c2', LW * 0.8);
  const n = Math.min(items.length, Math.max(1, Math.floor((w - 2) / 22)));
  for (let i = 0; i < n; i++) {
    const cx = x + ((i + 0.5) * w) / n;
    ctx.drawImage(itemCanvas(items[i]), cx - 10.5, y + h - 22.5, 21, 21);
  }
  line(ctx, [[x + 3, y + h - 3], [x + 10, y + 3]], 1, '#ffffff');
  line(ctx, [[x + 7, y + h - 3], [x + 12, y + 7]], 0.6, '#ffffff');
  return [x, y, w, h];
}
function door(ctx, x, y, w, h, color, o = {}) {
  rect(ctx, x - 1.6, y - 1.6, w + 3.2, h + 1.6, o.frame || '#ffffff', LW);
  rect(ctx, x, y, w, h, color, LW);
  rrect(ctx, x + 2.6, y + 3, w - 5.2, h * 0.46, 1, o.glass || C.glass, LW * 0.8);
  line(ctx, [[x + 4, y + h * 0.4], [x + 7, y + 5]], 0.7, '#ffffff');
  oval(ctx, x + w - 3.2, y + h * 0.6, 1, 1, C.gold, 0.5);
  rect(ctx, x + 2, y + h - 6, w - 4, 4, shade(color, -0.15), LW * 0.6);
  if (o.sign) { line(ctx, [[x + w / 2 - 3, y + 4], [x + w / 2, y + 1], [x + w / 2 + 3, y + 4]], 0.4); rrect(ctx, x + w / 2 - 5, y + 4, 10, 4.4, 0.8, '#ffffff', 0.5); text(ctx, o.sign, x + w / 2, y + 6.3, { size: 2.8, font: FONT.block, fill: C.red }); }
  return { x, y, w, h };
}
function shutter(ctx, x, y, w, h, color = '#bdb6cf') {
  rect(ctx, x, y, w, h, color, LW);
  for (let j = y + 2.4; j < y + h; j += 2.6) line(ctx, [[x, j], [x + w, j]], 0.4, shade(color, -0.22));
  rect(ctx, x, y + h - 2, w, 2, shade(color, -0.12), LW * 0.6);
}
export function tag(ctx, x, y, r, color, size = 8, word) {
  const w = word || pick(r, TAGS);
  text(ctx, w, x, y, { font: FONT.tag, size, fill: color || pick(r, [C.pink, C.yellow, C.lime, C.sky2, C.orange, '#ffffff']), stroke: K, sw: size * 0.12, extrude: shade(color || '#7a3fd6', -0.4), depth: size * 0.08, align: 'left', rot: (r() - 0.5) * 0.25 });
}
function waterTower(ctx, x, base, s = 1) {
  for (const lx of [x + 2 * s, x + 14 * s]) line(ctx, [[lx, base], [lx + (lx < x + 8 * s ? 2 : -2) * s, base - 12 * s]], 1);
  line(ctx, [[x + 3 * s, base - 4 * s], [x + 13 * s, base - 9 * s]], 0.6); line(ctx, [[x + 3 * s, base - 9 * s], [x + 13 * s, base - 4 * s]], 0.6);
  rrect(ctx, x, base - 26 * s, 16 * s, 15 * s, 1.4, '#3a2a30', LW);
  for (const yy of [base - 22 * s, base - 16 * s]) line(ctx, [[x, yy], [x + 16 * s, yy]], 0.6, '#6a5258');
  poly(ctx, [[x - 1.4 * s, base - 26 * s], [x + 8 * s, base - 34 * s], [x + 17.4 * s, base - 26 * s]], '#3a2a30', LW);
}
function antenna(ctx, x, base) {
  line(ctx, [[x, base], [x, base - 18]], 0.8);
  for (let i = 0; i < 4; i++) line(ctx, [[x - 6 + i, base - 16 + i * 3], [x + 6 - i, base - 16 + i * 3]], 0.6);
}
function dish(ctx, x, y) {
  line(ctx, [[x + 1, y + 5], [x + 3, y + 2]], 0.7);
  oval(ctx, x + 3, y + 1.2, 2.6, 3.6, '#ffffff', LW * 0.8, -0.3);
  line(ctx, [[x + 3, y + 1.2], [x + 6.4, y + 0.2]], 0.5);
}
function ac(ctx, x, y) {
  rrect(ctx, x, y, 11, 7, 1, '#e8e4f2', LW * 0.8);
  oval(ctx, x + 7.4, y + 3.5, 2.4, 2.4, '#a8a2bc', 0.5);
  for (let i = 1.4; i < 5; i += 1.2) line(ctx, [[x + 1.4, y + i], [x + 4, y + i]], 0.35);
}
function billboard(ctx, x, roof, w, h, str, bg, fg, sub) {
  const by = roof - h - 6;
  for (const px of [x + 6, x + w - 8]) { line(ctx, [[px, roof], [px, by + h]], 1.2); line(ctx, [[px, roof], [px + (px < x + w / 2 ? 6 : -6), by + h]], 0.6); }
  line(ctx, [[x + 6, roof - 3], [x + w - 8, roof - 3]], 0.6);
  rect(ctx, x, by, w, h, bg, LW);
  rect(ctx, x + 1.6, by + 1.6, w - 3.2, h - 3.2, null, 0.5);
  text(ctx, str, x + w / 2, by + h / 2 - (sub ? 2 : 0), { size: h * 0.46, font: FONT.slab, fill: fg, stroke: K, sw: 0.9 });
  if (sub) text(ctx, sub, x + w / 2, by + h - 3.6, { size: 3.6, font: FONT.round, weight: 700, fill: K });
  for (let i = 0; i < 3; i++) { const lx = x + 10 + i * ((w - 20) / 2); line(ctx, [[lx, by + h], [lx, by + h + 2]], 0.5); oval(ctx, lx, by + h + 2.6, 1.2, 0.8, '#fff3a0', 0.4); }
}
function fireEscape(ctx, x, y, w, floors, fh) {
  for (let f = 0; f < floors; f++) {
    const fy = y + f * fh;
    rect(ctx, x, fy, w, 1.4, K, 0);
    line(ctx, [[x, fy - 7], [x + w, fy - 7]], 0.7);
    for (let i = x; i <= x + w; i += 4) line(ctx, [[i, fy - 7], [i, fy]], 0.5);
    if (f < floors - 1) { line(ctx, [[x + 6, fy + 1], [x + w - 8, fy + fh - 1]], 1); for (let k = 1; k < 6; k++) { const t = k / 6; line(ctx, [[x + 6 + (w - 14) * t - 1.4, fy + 1 + (fh - 2) * t], [x + 6 + (w - 14) * t + 1.4, fy + 1 + (fh - 2) * t]], 0.6); } }
  }
}
function bunting(ctx, x0, x1, y, cols) {
  line(ctx, [[x0, y], [(x0 + x1) / 2, y + 4], [x1, y]], 0.5, K, true);
  const n = Math.floor((x1 - x0) / 7);
  for (let i = 0; i < n; i++) {
    const t = (i + 0.5) / n, bx = x0 + (x1 - x0) * t, by = y + Math.sin(t * Math.PI) * 4;
    poly(ctx, [[bx - 2.6, by], [bx + 2.6, by], [bx, by + 5]], cols[i % cols.length], 0.5);
  }
}
// Flat neon sign: an "on" tube and a dead "off" tube, swapped by the street to flicker
export function neon(str, color, R, o = {}) {
  const size = o.size || 7, font = o.font || FONT.round;
  const w = measure(str, size, font, 700) + 8, h = size * 1.7;
  const make = (on) => {
    const [c, ctx] = layer(w, h, R);
    if (o.bg) rrect(ctx, 0.6, 0.6, w - 1.2, h - 1.2, 2, o.bg, LW * 0.8);
    if (on) text(ctx, str, w / 2, h / 2, { size, font, weight: 700, fill: color, stroke: shade(color, 0.25), sw: size * 0.42 });
    text(ctx, str, w / 2, h / 2, { size, font, weight: 700, fill: on ? '#ffffff' : shade(color, -0.5), stroke: on ? color : shade(color, -0.35), sw: size * 0.2 });
    return c;
  };
  return { on: make(true), off: make(false), w, h };
}

// ---------- the seven frontages ----------
export const FACADES = {
  // HARLEM, NYC: red walk-up, black fire escape, water tower + rooftop billboard, green bodega front
  'north-america'(ctx, x, G, r, items, R) {
    const top = G - 140, wc = '#ff5a3c';
    wall(ctx, x, top, SW, 140, wc);
    brickMarks(ctx, x, top, SW, 76, '#c83a22', r, 12);
    rect(ctx, x - 3, top - 4, SW + 6, 5, C.cream, LW);
    rect(ctx, x - 1, top + 1, SW + 2, 2.4, '#d8462c', LW * 0.6);
    const windows = [];
    for (let f = 0; f < 3; f++) for (const wx of [12, 48, 98, 134]) windows.push(win(ctx, x + wx, top + 10 + f * 25, 14, 16, r));
    fireEscape(ctx, x + 42, top + 30, 76, 3, 25);
    waterTower(ctx, x + 14, top - 4, 1.1);
    billboard(ctx, x + 48, top - 4, 104, 24, 'SMOKE THE CRACK', C.yellow, C.red, 'GRAILS ON THE BLOCK');
    const gf = G - 62;
    rect(ctx, x, gf, SW, 62, '#1f8a4a', LW);
    board(ctx, x + 4, gf + 2, SW - 8, 13, C.yellow, 'UPTOWN THREAD EXCHANGE', { size: 7.6, color: C.red, stroke: K, sw: 0.8 });
    awning(ctx, x + 2, gf + 16, SW - 4, '#1f8a4a', '#ffffff', 6);
    display(ctx, x + 8, G - 36, 50, 30, items.slice(0, 2));
    display(ctx, x + 102, G - 36, 50, 30, items.slice(2, 4));
    const cat = catFrames(R)[0];
    ctx.drawImage(cat, x + 38, G - 18, 18, 14);
    const d = door(ctx, x + 68, G - 42, 24, 42, '#1f8a4a', { sign: 'OPEN' });
    rect(ctx, x + 64, G - 1, 32, 2, '#bdb6cf', LW * 0.6);
    return { door: d, top: top - 30, roofL: top, roofR: top, wallL: wc, wallR: wc, windows, neon: [{ x: x + 108, y: G - 34, n: neon('OPEN', C.pink, R, { size: 6 }) }] };
  },

  // SCARBOROUGH, TORONTO: low strip-plaza unit, backlit box sign, tenant pylon, slush piles
  canada(ctx, x, G, r, items, R) {
    const top = G - 92, wc = C.cream;
    wall(ctx, x, top, SW, 92, wc);
    rect(ctx, x - 2, top - 2, SW + 4, 10, C.teal, LW);
    rrect(ctx, x + 8, top + 13, 112, 26, 2, '#ffffff', LW);
    text(ctx, '6IX SIDE THRIFT', x + 64, top + 23.4, { size: 11, font: FONT.slab, fill: C.red, stroke: K, sw: 0.9 });
    text(ctx, 'VINTAGE • JERSEYS • GRAILS', x + 64, top + 34, { size: 3.8, font: FONT.round, weight: 700, fill: C.blue });
    for (const px of [x + 134, x + 152]) rect(ctx, px, top - 34, 3, G - top + 34, '#8a84a0', LW);
    [['ROTI SHOP', C.red, '#fff'], ['CELL FIX', C.blue, '#fff'], ['TAX $$', C.yellow, K]].forEach(([s, bg, fg], i) => board(ctx, x + 128, top - 44 + i * 11, 32, 10, bg, s, { size: 4.6, font: FONT.block, color: fg }));
    rect(ctx, x + 4, G - 52, 152, 52, '#d6d2e2', LW);
    display(ctx, x + 8, G - 48, 46, 44, items.slice(0, 2), { frame: '#a8a2bc', bg: '#dff6ff' });
    display(ctx, x + 88, G - 48, 64, 44, items.slice(1, 3), { frame: '#a8a2bc', bg: '#dff6ff' });
    const d = door(ctx, x + 60, G - 46, 22, 46, '#a8a2bc', { frame: '#d6d2e2', sign: 'OPEN' });
    rrect(ctx, x + 92, G - 46, 18, 8, 1, C.yellow, 0.6); text(ctx, 'WE BUY', x + 101, G - 42, { size: 3.4, font: FONT.block });
    for (let i = 0; i < 9; i++) oval(ctx, x + 6 + i * 18 + r() * 6, G + 0.6, 5 + r() * 3, 2.6, pick(r, ['#f4f2fa', '#e4e0ee']), LW * 0.7);
    return { door: d, top: top - 44, roofL: top, roofR: top, wallL: wc, wallR: wc, windows: [], neon: [{ x: x + 120, y: G - 44, n: neon('OPEN', C.red, R, { size: 5.4 }) }] };
  },

  // ROCINHA, RIO: candy-coloured boxes stacked up the hill, blue water tanks, laundry, gato wires, painted shop
  'south-america'(ctx, x, G, r, items, R) {
    const windows = [];
    wall(ctx, x + 2, G - 122, 78, 66, C.hotpink);
    wall(ctx, x + 78, G - 106, 80, 50, C.yellow);
    wall(ctx, x + 18, G - 152, 54, 32, C.teal);
    wall(ctx, x + 88, G - 132, 56, 28, C.orange);
    for (const [wx, wy] of [[12, -110], [46, -110], [92, -96], [126, -96], [30, -144], [52, -144], [100, -126], [122, -126]]) windows.push(win(ctx, x + wx, G + wy, 12, 11, r, { bars: true, cross: false, frame: '#ffffff', plant: false }));
    for (const [tx, ty] of [[28, -152], [104, -132]]) { rrect(ctx, x + tx, G + ty - 12, 20, 12, 2, C.blue, LW); line(ctx, [[x + tx, G + ty - 8], [x + tx + 20, G + ty - 8]], 0.5, '#1f3fa0'); rect(ctx, x + tx + 6, G + ty - 14, 8, 2, '#1f3fa0', 0.5); }
    for (const rx of [60, 64, 68, 150, 154]) line(ctx, [[x + rx, rx > 100 ? G - 106 : G - 152], [x + rx + 0.4, (rx > 100 ? G - 106 : G - 152) - 7]], 0.8, '#6a4a3a');
    line(ctx, [[x + 74, G - 127], [x + 110, G - 123], [x + 146, G - 127]], 0.5, K, true);
    for (let i = 0; i < 7; i++) line(ctx, [[x - 2, G - 140 + i * 3], [x + 40 + i * 10, G - 100 - (i % 3) * 14], [x + 90 + i * 9, G - 62 - (i % 2) * 20]], 0.4, K, true);
    rect(ctx, x, G - 58, SW, 58, C.lime, LW);
    rrect(ctx, x + 6, G - 56, 100, 17, 2, C.red, LW);
    text(ctx, 'Casa Exclusivo', x + 56, G - 48.4, { size: 9, font: FONT.script, fill: '#ffffff', stroke: K, sw: 0.7 });
    bunting(ctx, x + 108, x + 158, G - 56, ['#009739', '#ffdf00', '#1d3f9f']);
    text(ctx, 'ROUPA • BONÉ • TÊNIS', x + 134, G - 44, { size: 3.6, font: FONT.round, weight: 700, fill: K });
    rect(ctx, x + 10, G - 36, 64, 36, '#2a1e30', LW);
    shutter(ctx, x + 10, G - 36, 64, 14);
    line(ctx, [[x + 12, G - 20], [x + 72, G - 20]], 0.8, '#c6c2d4');
    items.slice(0, 2).forEach((it, i) => ctx.drawImage(itemCanvas(it), x + 16 + i * 30, G - 20, 21, 21));
    const d = door(ctx, x + 84, G - 40, 20, 40, C.yellow);
    tag(ctx, x + 110, G - 22, r, C.purple, 7);
    return { door: d, top: G - 166, roofL: G - 122, roofR: G - 106, wallL: C.hotpink, wallR: C.yellow, windows, neon: [{ x: x + 108, y: G - 38, n: neon('ABERTO', C.green, R, { size: 5 }) }], laundry: { x0: x + 74, x1: x + 146, y: G - 127 } };
  },

  // SAINT-DENIS (93): lavender HLM block, every balcony a different colour, dishes, rideau tagged "93"
  europe(ctx, x, G, r, items, R) {
    const top = G - 180, wc = '#cfc8e6';
    wall(ctx, x, top, SW, 122, wc);
    rect(ctx, x - 2, top - 3, SW + 4, 4, '#a8a2bc', LW);
    antenna(ctx, x + 30, top - 3); antenna(ctx, x + 120, top - 3);
    const cols = [C.red, C.blue, C.yellow, C.green, C.orange, C.pink];
    const windows = [];
    for (let f = 0; f < 5; f++) {
      const fy = top + 6 + f * 23.5;
      line(ctx, [[x, fy - 2.5], [x + SW, fy - 2.5]], 0.5, '#a8a2bc');
      for (let k = 0; k < 4; k++) {
        const wx = x + 8 + k * 38;
        windows.push(win(ctx, wx + 4, fy + 1, 18, 12, r, { sill: false, frame: '#ffffff' }));
        rect(ctx, wx, fy + 13, 26, 6, cols[(f + k * 2) % cols.length], LW);
        for (let i = wx + 3; i < wx + 26; i += 3.4) line(ctx, [[i, fy + 13], [i, fy + 19]], 0.4);
        if ((f + k) % 3 === 0) dish(ctx, wx + 20, fy + 3);
      }
    }
    const gf = G - 58;
    rect(ctx, x, gf, SW, 58, '#2a2633', LW);
    rect(ctx, x + 6, gf + 3, 110, 13, '#141018', LW * 0.8);
    display(ctx, x + 8, G - 38, 48, 32, items.slice(0, 2), { frame: '#141018' });
    const d = door(ctx, x + 62, G - 42, 22, 42, '#3a3648', { frame: '#141018' });
    shutter(ctx, x + 90, gf + 18, 64, 40, '#bdb6cf');
    text(ctx, '93', x + 122, gf + 34, { size: 17, font: FONT.tag, fill: '#ffffff', stroke: K, sw: 1.4, extrude: C.red, depth: 1.4, rot: -0.1 });
    tag(ctx, x + 94, gf + 50, r, C.yellow, 6);
    line(ctx, [[x + 156, gf - 6], [x + 162, gf - 6]], 1);
    poly(ctx, [[x + 162, gf - 13], [x + 167, gf - 6], [x + 162, gf + 1], [x + 157, gf - 6]], C.red, LW);
    text(ctx, 'TABAC', x + 162, gf - 6, { size: 2.4, font: FONT.block, fill: '#ffffff' });
    return { door: d, top, roofL: top, roofR: top, wallL: wc, wallR: wc, windows, neon: [{ x: x + 8, y: gf + 2, n: neon('BOUTIQUE DU BLOC', C.red, R, { size: 7.4 }) }] };
  },

  // YABA, LAGOS: sunny yellow upper floor with painted panel, louvres, red container shop, zinc awning, generator, umbrella
  africa(ctx, x, G, r, items, R) {
    const top = G - 128, wc = C.gold;
    wall(ctx, x, top, SW, 72, wc);
    rect(ctx, x - 2, top - 3, SW + 4, 5, C.green, LW);
    rect(ctx, x, top + 66, SW, 6, C.green, LW);
    const windows = [];
    for (const wx of [8, 118]) {
      rect(ctx, x + wx - 1.6, top + 12, 37.2, 36, C.green, LW);
      for (let j = 0; j < 8; j++) rect(ctx, x + wx, top + 13.6 + j * 4.1, 34, 3, j % 2 ? '#bfe6f5' : '#9fd8ee', 0.4);
      windows.push([x + wx, top + 13.6, 34, 32]);
    }
    rrect(ctx, x + 50, top + 12, 62, 36, 3, C.blue, LW);
    text(ctx, 'NO WAHALA', x + 81, top + 25, { size: 8.4, font: FONT.slab, fill: '#ffffff', stroke: K, sw: 0.8 });
    text(ctx, 'AIRTIME • DATA • POS', x + 81, top + 38, { size: 3.8, font: FONT.round, weight: 700, fill: C.yellow });
    rect(ctx, x, G - 56, SW, 56, '#fff1c2', LW);
    board(ctx, x + 4, G - 56, 112, 18, '#ffffff', 'ODOGWU VINTAGE', { size: 9, color: C.green, stroke: K, sw: 0.8, dy: -2, sub: 'ORIGINAL • NO SHAKING', subColor: C.red });
    poly(ctx, [[x + 2, G - 37], [x + 118, G - 37], [x + 122, G - 31], [x - 2, G - 31]], '#c6c2d4', LW);
    for (let i = x + 4; i < x + 120; i += 4) line(ctx, [[i, G - 37], [i - 1, G - 31]], 0.4, '#8a849e');
    rect(ctx, x + 4, G - 31, 112, 31, C.red, LW);
    for (let i = x + 7; i < x + 116; i += 3.4) line(ctx, [[i, G - 31], [i, G]], 0.5, '#b81e1e');
    rect(ctx, x + 28, G - 28, 60, 28, '#2a1e30', LW);
    line(ctx, [[x + 30, G - 24], [x + 86, G - 24]], 0.8, '#c6c2d4');
    items.slice(0, 2).forEach((it, i) => ctx.drawImage(itemCanvas(it), x + 34 + i * 28, G - 24, 21, 21));
    rrect(ctx, x + 96, G - 16, 16, 16, 1.4, C.yellow, LW);
    rect(ctx, x + 99, G - 12, 7, 5, '#2a2633', 0.5);
    line(ctx, [[x + 109, G - 16], [x + 109, G - 22]], 1.2);
    const ux = x + 140;
    line(ctx, [[ux, G - 50], [ux, G]], 1);
    blob(ctx, [[ux - 18, G - 44], [ux, G - 56], [ux + 18, G - 44]], '#ffffff', LW);
    for (let k = -2; k <= 1; k += 2) poly(ctx, [[ux + k * 9, G - 44 - (k === -2 ? 0 : 0)], [ux, G - 56], [ux + (k + 1) * 9, G - 44]], C.red, LW * 0.7);
    rect(ctx, ux - 9, G - 14, 18, 2.4, '#ffffff', LW);
    line(ctx, [[ux - 7, G - 11.6], [ux - 7, G]], 0.8); line(ctx, [[ux + 7, G - 11.6], [ux + 7, G]], 0.8);
    for (let i = 0; i < 3; i++) rect(ctx, ux - 7 + i * 5, G - 17, 4, 3, pick(r, [C.yellow, C.green, C.blue, C.red]), 0.4);
    const d = { x: x + 46, y: G - 28, w: 24, h: 28 };
    return { door: d, top: top - 4, roofL: top, roofR: top, wallL: wc, wallR: wc, windows, neon: [{ x: x + 118, y: G - 34, n: neon('LIGHT DEY', C.green, R, { size: 4.4 }) }], smoke: { x: x + 109, y: G - 23 } };
  },

  // SHINJUKU, TOKYO: tall purple tower stacked with signs and AC units, izakaya annex, lanterns, vending machines
  asia(ctx, x, G, r, items, R) {
    const top = G - 176, wc = '#4a2f8a', aw = '#fff1c2';
    wall(ctx, x, top, 112, 176, wc);
    rect(ctx, x - 2, top - 3, 116, 4, '#2e1d5a', LW);
    const windows = [];
    for (let f = 0; f < 4; f++) {
      const fy = top + 10 + f * 28;
      for (const wx of [8, 34, 60]) windows.push(win(ctx, x + wx, fy, 18, 13, r, { frame: '#d8ccff', plant: false }));
      ac(ctx, x + 10 + (f % 2) * 30, fy + 17);
    }
    const signs = [['古着', C.hotpink, '#ffffff'], ['祭', C.yellow, K], ['ニセモノ', C.sky2, K], ['禁止', '#ffffff', C.red], ['古', C.lime, K]];
    signs.forEach(([s, bg, fg], i) => {
      const sy = top + 6 + i * 22;
      rect(ctx, x + 88, sy, 20, 20, bg, LW);
      text(ctx, s, x + 98, sy + 10.4, { size: s.length > 2 ? 4.2 : s.length > 1 ? 7 : 11, font: FONT.jp, weight: 900, fill: fg, rot: s.length > 2 ? Math.PI / 2 : 0 });
    });
    const gf = G - 56;
    rect(ctx, x, gf, 112, 56, '#241c3a', LW);
    rect(ctx, x + 4, gf + 3, 104, 13, '#141018', LW * 0.8);
    display(ctx, x + 6, G - 36, 30, 30, items.slice(0, 1), { frame: '#141018' });
    const d = door(ctx, x + 44, G - 40, 26, 40, '#8a5a34', { frame: '#141018', glass: '#ffe9a8' });
    rect(ctx, x + 42, G - 40, 30, 14, '#1d2a6b', LW);
    for (let i = 1; i < 3; i++) line(ctx, [[x + 42 + i * 10, G - 40], [x + 42 + i * 10, G - 26]], 0.5, '#ffffff');
    oval(ctx, x + 57, G - 33, 3, 3, null, 0.8, 0); ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 0.8; ctx.stroke();
    display(ctx, x + 78, G - 36, 28, 30, items.slice(1, 2), { frame: '#141018' });
    // izakaya annex
    wall(ctx, x + 112, G - 96, 48, 96, aw);
    for (let i = 0; i < 6; i++) oval(ctx, x + 114 + i * 8, G - 97, 4.4, 3, '#3a3648', LW * 0.7);
    rect(ctx, x + 110, G - 99, 52, 4, '#3a3648', LW);
    windows.push(win(ctx, x + 124, G - 86, 24, 14, r, { frame: '#8a5a34', glass: C.winLit, lit: true, cross: false }));
    for (const lx of [118, 154]) { line(ctx, [[x + lx, G - 64], [x + lx, G - 60]], 0.6); oval(ctx, x + lx, G - 54, 4.4, 6, C.red, LW); rect(ctx, x + lx - 3, G - 61, 6, 1.6, K, 0); rect(ctx, x + lx - 3, G - 48.6, 6, 1.6, K, 0); text(ctx, '祭', x + lx, G - 54, { size: 4.4, font: FONT.jp, weight: 900, fill: '#ffffff' }); }
    for (const [vx, vc] of [[x + 116, C.red], [x + 136, C.blue]]) {
      rrect(ctx, vx, G - 40, 18, 40, 1.4, vc, LW);
      rect(ctx, vx + 2, G - 37, 14, 18, '#eef8ff', LW * 0.7);
      for (let j = 0; j < 3; j++) for (let k = 0; k < 4; k++) rrect(ctx, vx + 3 + k * 3.2, G - 35.6 + j * 5.6, 2.2, 4, 0.6, pick(r, [C.yellow, C.green, C.pink, C.sky2, C.orange]), 0.3);
      rect(ctx, vx + 4, G - 14, 10, 4, '#141018', 0.5);
    }
    return { door: d, top, roofL: top, roofR: G - 96, wallL: wc, wallR: aw, windows, neon: [{ x: x + 6, y: gf + 2, n: neon('URA-HARA STASH', C.sky2, R, { size: 7 }) }, { x: x + 84, y: G - 54, n: neon('OPEN', C.hotpink, R, { size: 4.4 }) }] };
  },

  // MOUNT DRUITT, WESTERN SYDNEY: tan shop strip, verandah on posts, roller door, dumped trolley, esky
  oceania(ctx, x, G, r, items, R) {
    const top = G - 84, wc = '#f2c08a';
    wall(ctx, x, top, SW, 84, wc);
    brickMarks(ctx, x, top, SW, 30, '#c8905a', r, 6);
    rect(ctx, x - 2, top - 5, SW + 4, 6, '#e8e2f0', LW);
    rect(ctx, x + 8, top + 2, 144, 23, '#1d3f9f', LW);
    text(ctx, 'WESTIE GRAILS', x + 80, top + 11, { size: 11.4, font: FONT.slab, fill: C.yellow, stroke: K, sw: 1, extrude: '#0e1f5a', depth: 1 });
    text(ctx, 'TNs • POLOS • TRACKIES', x + 80, top + 21.4, { size: 3.8, font: FONT.round, weight: 700, fill: '#ffffff' });
    poly(ctx, [[x - 4, G - 58], [x + 164, G - 58], [x + 166, G - 51], [x - 6, G - 51]], '#d6d2e2', LW);
    for (let i = x; i < x + 162; i += 4) line(ctx, [[i, G - 58], [i - 0.4, G - 51]], 0.4, '#a8a2bc');
    for (const px of [x + 4, x + 154]) rect(ctx, px, G - 51, 2.4, 51, '#e8e2f0', LW);
    display(ctx, x + 12, G - 44, 48, 36, items.slice(0, 2));
    const d = door(ctx, x + 68, G - 44, 22, 44, '#e8e2f0', { sign: 'OPEN' });
    shutter(ctx, x + 98, G - 48, 54, 48, '#d6d2e2');
    rrect(ctx, x + 104, G - 45, 42, 9, 1, '#ffffff', LW * 0.8);
    text(ctx, 'CASH 4 KICKS', x + 125, G - 40.4, { size: 4.8, font: FONT.block, fill: C.red });
    tag(ctx, x + 102, G - 20, r, C.pink, 7);
    const tx = x + 128;
    for (let j = 0; j < 10; j += 2.4) line(ctx, [[tx, G - 16 + j], [tx + 18, G - 15 + j]], 0.6, '#8a849e');
    for (let i = 0; i < 19; i += 3) line(ctx, [[tx + i, G - 16], [tx + i + 1, G - 6]], 0.6, '#8a849e');
    line(ctx, [[tx, G - 16], [tx - 4, G - 20]], 1.4, C.red);
    oval(ctx, tx + 2, G - 2, 1.6, 1.6, K, 0); oval(ctx, tx + 16, G - 2, 1.6, 1.6, K, 0);
    rrect(ctx, x + 108, G - 10, 14, 10, 1.2, '#2f62e0', LW); rect(ctx, x + 108, G - 10, 14, 3, '#ffffff', LW * 0.7);
    return { door: d, top: top - 5, roofL: top, roofR: top, wallL: wc, wallR: wc, windows: [], neon: [{ x: x + 16, y: G - 51, n: neon('OPEN', C.yellow, R, { size: 5 }) }] };
  },
};

// Boarded up with scaffolding, hazard tape and cones: any region with no stock
export function construction(ctx, x, G, f, store, r) {
  const top = f.roofL + 8;
  for (const sx of [x + 6, x + 56, x + 104, x + 152]) rect(ctx, sx, top, 2.6, G - top, C.orange, LW * 0.7);
  for (let yy = top + 10; yy < G - 44; yy += 26) { rect(ctx, x + 4, yy, SW - 8, 3, '#c8905a', LW * 0.7); line(ctx, [[x + 8, yy + 24], [x + 54, yy + 4]], 0.8, C.orange); }
  for (let i = 0; i < SW; i += 20) rect(ctx, x + i, G - 44, 20, 44, i % 40 ? '#e8b47a' : '#d8a066', LW);
  for (let i = 0; i < SW; i += 8) poly(ctx, [[x + i, G - 48], [x + i + 4, G - 48], [x + i + 8, G - 44], [x + i + 4, G - 44]], i % 16 ? K : C.yellow, 0);
  rect(ctx, x, G - 48, SW, 4, null, LW);
  rrect(ctx, x + 40, G - 38, 80, 24, 2, C.yellow, LW);
  text(ctx, 'UNDER CONSTRUCTION', x + 80, G - 30, { size: 6.4, font: FONT.slab, fill: K });
  text(ctx, `NO ${store.region.toUpperCase()} STOCK YET`, x + 80, G - 20, { size: 3.8, font: FONT.round, weight: 700, fill: C.red });
  for (const cx of [x + 22, x + 132]) { poly(ctx, [[cx, G], [cx + 3.4, G - 13], [cx + 6.6, G - 13], [cx + 10, G]], C.orange, LW); rect(ctx, cx + 2, G - 7.4, 6, 2, '#ffffff', 0); }
}

// ---------- Booster Corner: the van backed into the alley, doors open, trunk full ----------
export function vanRear(ctx, bx, top, bw, bh, r, items, o = {}) {
  const bottom = top + bh, doorW = bw * 0.2, big = !!o.big;
  for (const [dx, s] of [[bx - doorW, -1], [bx + bw, 1]]) {
    poly(ctx, [[dx, top + 4], [dx + doorW, top + 2], [dx + doorW, bottom - 8], [dx, bottom - 6]].map(([px, py]) => [px, py]), '#e8e4f2', LW, 2);
    rrect(ctx, dx + doorW * 0.18, top + bh * 0.1, doorW * 0.64, bh * 0.3, 1.4, C.glass, LW * 0.8);
    rect(ctx, s < 0 ? dx + doorW - 3 : dx + 1, top + bh * 0.5, 2, 6, '#a8a2bc', 0.5);
  }
  rrect(ctx, bx, top, bw, bh, big ? 8 : 4, '#ffffff', LW);
  const ix = bx + bw * 0.07, iy = top + bh * 0.07, iw = bw * 0.86, ih = bh * 0.68;
  rrect(ctx, ix, iy, iw, ih, big ? 3 : 1.6, '#4a3260', LW);
  clip(ctx, () => { ctx.beginPath(); ctx.rect(ix, iy, iw, ih); }, () => {
    for (let x = ix + 4; x < ix + iw; x += big ? 6 : 4) line(ctx, [[x, iy], [x, iy + ih]], 0.5, '#5a4078');
    poly(ctx, [[bx + bw / 2 - iw * 0.12, iy], [bx + bw / 2 + iw * 0.12, iy], [bx + bw / 2 + iw * 0.48, iy + ih], [bx + bw / 2 - iw * 0.48, iy + ih]], 'rgba(255,224,102,0.22)', 0);
  });
  rrect(ctx, bx + bw / 2 - (big ? 7 : 3.5), iy, big ? 14 : 7, big ? 2.6 : 1.6, 1, '#fff3a0', 0.5);
  const rail = iy + (big ? 8 : 4);
  line(ctx, [[ix + 2, rail], [ix + iw - 2, rail]], big ? 1.2 : 0.8, '#c6c2d4');
  const hang = items.slice(0, big ? 4 : 2);
  const step = (iw - 4) / hang.length, sz = big ? 26 : 15;
  hang.forEach((it, i) => { const cx = ix + 2 + step * (i + 0.5); line(ctx, [[cx, rail], [cx, rail + 2]], 0.5); ctx.drawImage(itemCanvas(it), cx - sz / 2, rail + 1, sz, sz); });
  const fl = iy + ih;
  const box = (x, w, h, c) => { rrect(ctx, x, fl - h, w, h, 0.8, c, LW * 0.8); rect(ctx, x + 1, fl - h + 1.4, w - 2, 1, c === '#ffffff' ? K : '#ffffff', 0); };
  if (big) {
    box(ix + 4, 18, 10, C.orange); box(ix + 6, 15, 7, '#ffffff'); box(ix + 24, 17, 11, '#1d1a22'); box(ix + iw - 28, 20, 10, C.red);
    const sn = items.find((i) => i.type === 'sneaker');
    if (sn) ctx.drawImage(itemCanvas(sn), ix + 40, fl - 24, 24, 24);
    for (let k = 0; k < 3; k++) line(ctx, Array.from({ length: 8 }, (_, i) => [ix + iw - 48 + i * 1.4 + k, fl - 3 - k - Math.sin(i / 1.3) * 1.6]), 1, k % 2 ? C.gold2 : C.gold, true);
    rrect(ctx, ix + iw - 36, fl - 8, 9, 6, 1, '#6a3a20', LW * 0.7); oval(ctx, ix + iw - 31.5, fl - 5, 2, 2, C.gold, 0.5);
  } else {
    box(ix + 2, 9, 5, C.orange); box(ix + 12, 9, 6, '#1d1a22'); box(ix + iw - 11, 9, 5, C.red);
    line(ctx, [[ix + iw - 20, fl - 2], [ix + iw - 14, fl - 3]], 1, C.gold);
  }
  for (const tx of [bx + 1, bx + bw - (big ? 5.6 : 3)]) rrect(ctx, tx, top + bh * 0.26, big ? 4.6 : 2, bh * 0.3, 1, C.red, LW * 0.8);
  const bumpH = big ? 8 : 4.4;
  rrect(ctx, bx - 2, bottom - bumpH, bw + 4, bumpH, 1.6, '#a8a2bc', LW);
  const pw = big ? 38 : 20, ph = big ? 11 : 6.4;
  rrect(ctx, bx + bw / 2 - pw / 2, bottom - bumpH - ph - 1, pw, ph, 1, '#ffffff', LW * 0.8);
  text(ctx, 'BOOST', bx + bw / 2, bottom - bumpH - ph / 2 - 0.8, { size: big ? 7.6 : 4.4, font: FONT.slab, fill: C.navy });
  const wh = big ? 11 : 6;
  for (const wx of [bx + 4, bx + bw - 4 - wh * 1.4]) rrect(ctx, wx, bottom, wh * 1.4, wh, 2, '#1d1a22', LW);
  return { trunk: { x: bx + bw / 2, y: iy + ih / 2 } };
}

export function paintBoosterCorner(ctx, x, G, r, items, R) {
  const W = ALLEY_W, navy = '#2a2f6b';
  wall(ctx, x, G - 150, W, 150, navy);
  for (let i = 0; i < 10; i++) { const bx = x + 18 + r() * (W - 40), by = G - 140 + r() * 120; ctx.strokeStyle = '#3d4590'; ctx.lineWidth = 0.6; ctx.strokeRect(bx, by, 7, 3); ctx.strokeRect(bx + 3.5, by + 3, 7, 3); }
  poly(ctx, [[x, G - 150], [x + 14, G - 138], [x + 14, G - 8], [x, G]], '#1d2150', LW);
  poly(ctx, [[x + W, G - 150], [x + W - 14, G - 138], [x + W - 14, G - 8], [x + W, G]], '#1d2150', LW);
  rect(ctx, x + 14, G - 8, W - 28, 8, '#3a3f70', LW * 0.7);
  for (let i = 0; i < W - 28; i += 4) { line(ctx, [[x + 14 + i, G - 84], [x + 18 + i, G - 60]], 0.4, '#8a90c8'); line(ctx, [[x + 18 + i, G - 84], [x + 14 + i, G - 60]], 0.4, '#8a90c8'); }
  line(ctx, [[x + 14, G - 84], [x + W - 14, G - 84]], 0.8, '#8a90c8');
  text(ctx, 'BOOSTER', x + W / 2, G - 126, { font: FONT.tag, size: 15, fill: C.purple, stroke: K, sw: 1.4, extrude: C.gold, depth: 1.4, rot: -0.06 });
  text(ctx, 'CORNER', x + W / 2 + 4, G - 110, { font: FONT.tag, size: 12, fill: C.gold, stroke: K, sw: 1.2, extrude: C.purple, depth: 1.2, rot: -0.06 });
  text(ctx, '$', x + W - 22, G - 96, { font: FONT.tag, size: 13, fill: C.lime, stroke: K, sw: 1.1 });
  line(ctx, [[x + W / 2, G - 150], [x + W / 2, G - 102]], 0.6);
  poly(ctx, [[x + W / 2 - 4, G - 102], [x + W / 2 + 4, G - 102], [x + W / 2 + 2, G - 98], [x + W / 2 - 2, G - 98]], '#3a3648', LW * 0.7);
  poly(ctx, [[x + W / 2 - 2, G - 98], [x + W / 2 + 2, G - 98], [x + W / 2 + 34, G - 6], [x + W / 2 - 34, G - 6]], 'rgba(255,224,102,0.18)', 0);
  rrect(ctx, x + 16, G - 26, 14, 18, 1.4, '#2e8a52', LW);
  rect(ctx, x + 15, G - 28, 16, 3, '#1f6a3a', LW * 0.8);
  oval(ctx, x + 72, G - 3, 9, 1.6, '#4a5aa8', 0.5);
  const van = vanRear(ctx, x + 32, G - 64, 56, 54, r, items);
  return {
    neon: [{ x: x - 34, y: G - 152, n: neon('BOOSTER ›', C.hotpink, R, { size: 8, bg: '#1d1a22' }) }],
    steam: { x: x + W - 7, y: G - 4 },
    cat: { x: x + 52, y: G - 76 },
    booster: { x: x + 14, y: G + 8 },
    trunk: van.trunk,
    roofL: G - 150, roofR: G - 150, wallL: navy, wallR: navy,
  };
}

// ---------- street furniture (each drawn into its own sprite) ----------
export function lampPost(ctx, x, curb) {
  rect(ctx, x, curb - 96, 2.6, 96, '#2e6b4a', LW * 0.8);
  line(ctx, [[x + 1.3, curb - 95], [x + 6, curb - 101], [x + 14, curb - 100]], 1.6, '#2e6b4a', true);
  poly(ctx, [[x + 10, curb - 101.6], [x + 21, curb - 101.6], [x + 19, curb - 97], [x + 12, curb - 97]], '#2e6b4a', LW * 0.8, 1);
  oval(ctx, x + 15.5, curb - 96.6, 3.6, 1.2, '#fff3a0', LW * 0.6);
  rrect(ctx, x - 1.6, curb - 5, 5.8, 5, 1, '#2e6b4a', LW * 0.8);
}
export function hydrant(ctx, x, y) {
  rrect(ctx, x, y - 11, 7, 11, 1.4, C.red, LW);
  oval(ctx, x + 3.5, y - 11.4, 3.6, 2, C.red, LW);
  oval(ctx, x + 3.5, y - 13.4, 1.2, 1, '#c81e1e', 0.5);
  rrect(ctx, x - 2, y - 8, 11, 2.6, 1, '#c81e1e', LW * 0.8);
  rect(ctx, x - 0.6, y - 1.6, 8.2, 1.6, '#c81e1e', LW * 0.7);
}
export function trashCan(ctx, x, y, r) {
  poly(ctx, [[x, y], [x - 0.6, y - 13], [x + 11.6, y - 13], [x + 11, y]], '#c6c2d4', LW, 1);
  for (let i = x + 2; i < x + 11; i += 2.6) line(ctx, [[i, y - 12], [i + 0.2, y - 1]], 0.5, '#8a849e');
  poly(ctx, [[x - 1, y - 13], [x + 12, y - 15.6], [x + 12.4, y - 14], [x - 0.6, y - 11.4]], '#a8a2bc', LW, 0.6);
  for (let i = 0; i < 3; i++) oval(ctx, x + 2 + r() * 8, y - 14.6 - r() * 2, 1.6, 1.2, pick(r, ['#ffffff', C.red, C.yellow, '#7a5a3a', C.lime]), 0.5);
  oval(ctx, x + 4, y - 6, 1.8, 1.4, null, 0.5);
}
export function newsBox(ctx, x, y, c) {
  rrect(ctx, x, y - 16, 11, 16, 1, c, LW);
  rect(ctx, x + 1.4, y - 14, 8.2, 5, '#ffffff', LW * 0.7);
  for (let i = 0; i < 2; i++) line(ctx, [[x + 2.4, y - 12.4 + i * 1.8], [x + 8.6, y - 12.4 + i * 1.8]], 0.4);
  rect(ctx, x + 3, y - 6, 5, 1.4, K, 0);
}
export function mailbox(ctx, x, y) {
  rect(ctx, x + 1, y - 6, 2, 6, '#1f3fa0', LW * 0.6); rect(ctx, x + 10, y - 6, 2, 6, '#1f3fa0', LW * 0.6);
  blob(ctx, [[x, y - 6], [x, y - 18], [x + 6.5, y - 22], [x + 13, y - 18], [x + 13, y - 6]], C.blue, LW);
  rect(ctx, x + 3, y - 17, 7, 1.4, K, 0);
  text(ctx, 'MAIL', x + 6.5, y - 12, { size: 2.6, font: FONT.block, fill: '#ffffff' });
}
export function meter(ctx, x, y) {
  rect(ctx, x, y - 20, 1.8, 20, '#8a849e', LW * 0.6);
  rrect(ctx, x - 2.4, y - 27, 6.6, 8, 2.4, '#c6c2d4', LW);
  rect(ctx, x - 1, y - 25.6, 3.8, 2.4, '#fff3a0', 0.4);
}
export function bench(ctx, x, y) {
  rect(ctx, x, y - 10, 28, 2.4, '#c8742e', LW * 0.8);
  rect(ctx, x, y - 16, 28, 2.4, '#c8742e', LW * 0.8);
  for (const lx of [x + 3, x + 23]) { line(ctx, [[lx, y - 16], [lx, y]], 1); }
  text(ctx, 'BAIL BONDS 24/7', x + 14, y - 14.8, { size: 1.6, font: FONT.block, fill: '#ffffff' });
}
export function pole(ctx, x, curb) {
  rect(ctx, x, curb - 176, 3, 176, '#7a5236', LW);
  rect(ctx, x - 9, curb - 168, 21, 2.4, '#7a5236', LW * 0.8);
  rect(ctx, x - 7, curb - 156, 17, 2.2, '#7a5236', LW * 0.8);
  for (const ix of [x - 7, x + 9]) oval(ctx, ix, curb - 169, 1, 1.2, '#7fe0ff', 0.5);
  rrect(ctx, x + 4, curb - 148, 7, 9, 1, '#a8a2bc', LW * 0.8);
}
// traffic signal pole for the intersections (the lamps themselves are drawn live)
export function signalPole(ctx, x, curb, street) {
  rect(ctx, x, curb - 92, 3, 92, '#4a4660', LW);
  rrect(ctx, x - 1.6, curb - 5, 6.2, 5, 1, '#4a4660', LW * 0.8);
  rrect(ctx, x + 3, curb - 100, 9, 22, 2, C.yellow, LW);
  for (let i = 0; i < 3; i++) oval(ctx, x + 7.5, curb - 95 + i * 6.6, 2.4, 2.4, '#2a2633', LW * 0.6);
  rrect(ctx, x - 9, curb - 72, 9, 9, 1.4, '#2a2633', LW);
  rect(ctx, x - 6, curb - 114, 26, 7, C.green, LW);
  text(ctx, street, x + 7, curb - 110.4, { size: 4, font: FONT.block, fill: '#ffffff' });
  line(ctx, [[x + 1.5, curb - 107], [x + 1.5, curb - 100]], 0.8);
  // security camera
  line(ctx, [[x + 1.5, curb - 84], [x - 4, curb - 86]], 0.8);
  rrect(ctx, x - 11, curb - 89, 8, 4.4, 1, '#e8e4f2', LW * 0.8);
  oval(ctx, x - 11, curb - 86.8, 1.2, 1.6, '#2a2633', 0.5);
}
