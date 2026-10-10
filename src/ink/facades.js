// Inked storefronts, one per neighbourhood. Drawn in world units on the street layer (ground = G, building rises to -y).
import { INK, C, layer, shape, box, blob, pen, brush, halftone, hatch, clipTo, letter, ellipsePts, pick, shade, seedInk } from './ink.js';
import { itemCanvas } from './items.js';

export const SW = 160;
export const ALLEY_W = 100;
const TAGS = ['ZOOT', 'KRUSH', 'BLAM!', 'SMOK', 'DUKE', 'REEK', 'BX', 'FLIP', 'YO!', 'RAZ', 'KAOS'];

// ---------- building blocks ----------
function brickWall(ctx, x, y, w, h, base, r, mortar) {
  const p = box(ctx, x, y, w, h, { fill: base, w: 1 });
  clipTo(ctx, p, () => {
    const dk = mortar || shade(base, -0.22);
    for (let i = 0; i < (w * h) / 90; i++) {
      const bx = x + r() * w, by = y + r() * h;
      const n = 2 + Math.floor(r() * 3);
      for (let k = 0; k < n; k++) box(ctx, bx + (k % 2) * 3.2 - 1.6, by + k * 2.6, 6, 2.4, { fill: r() < 0.3 ? shade(base, -0.08) : false, stroke: dk, w: 0.35, j: 0.2 });
    }
    halftone(ctx, x, y + h - 14, w, 14, '#00000022', 1.8, (xx, yy) => 0.15 + ((yy - (y + h - 14)) / 14) * 0.55);
    halftone(ctx, x, y, w, 8, '#00000018', 1.8, 0.45);
  });
}
function plaster(ctx, x, y, w, h, base, r) {
  const p = box(ctx, x, y, w, h, { fill: base, w: 1 });
  clipTo(ctx, p, () => {
    for (let i = 0; i < (w * h) / 900; i++) blob(ctx, x + r() * w, y + r() * h, 3 + r() * 8, 2 + r() * 5, { fill: shade(base, -0.06), stroke: false });
    halftone(ctx, x, y + h - 16, w, 16, '#00000022', 1.8, (xx, yy) => 0.1 + ((yy - (y + h - 16)) / 16) * 0.55);
  });
  cracks(ctx, x, y, w, h, r, Math.round((w * h) / 2600));
}
function cracks(ctx, x, y, w, h, r, n) {
  for (let i = 0; i < n; i++) {
    let cx = x + r() * w, cy = y + r() * h;
    const pts = [[cx, cy]];
    for (let k = 0; k < 4; k++) { cx += (r() - 0.5) * 6; cy += 2 + r() * 3; pts.push([cx, cy]); }
    pen(ctx, pts, { w: 0.4, j: 0.4 });
  }
}
function win(ctx, x, y, w, h, r, o = {}) {
  box(ctx, x - 1.2, y - 1.2, w + 2.4, h + 2.4, { fill: o.frame || '#efe8d8', w: 0.8 });
  const lit = o.lit ?? r() < 0.25;
  const g = box(ctx, x, y, w, h, { fill: lit ? C.lit : o.glass || C.glass, w: 0.6 });
  clipTo(ctx, g, () => {
    halftone(ctx, x, y, w, h, lit ? '#f0b04a55' : '#2a5a6a44', 1.5, (xx, yy) => ((yy - y) / h) * 0.6);
    pen(ctx, [[x + w * 0.15, y + h * 0.75], [x + w * 0.5, y + h * 0.15]], { c: '#ffffffaa', w: 0.7 });
    pen(ctx, [[x + w * 0.4, y + h * 0.8], [x + w * 0.65, y + h * 0.4]], { c: '#ffffff88', w: 0.5 });
    if (o.peek ?? r() < 0.12) {
      // a nosy neighbour peeks out
      const px = x + w * 0.35, py = y + h * 0.95;
      blob(ctx, px, py - 3, 3, 3.4, { fill: pick(r, C.skin), w: 0.5 });
      shape(ctx, [[px + 1.6, py - 4], [px + 6, py - 2.6], [px + 5, py - 0.8], [px + 2, py - 1.8]], { fill: pick(r, C.skin), w: 0.5, step: 2 });
      blob(ctx, px + 1, py - 4.4, 0.8, 0.6, { fill: '#fbf8f0', w: 0.3, n: 8 });
    } else if (r() < 0.35) {
      shape(ctx, [[x, y], [x + w * 0.3, y], [x + w * 0.22, y + h], [x, y + h]], { fill: o.curtain || pick(r, ['#e0443a', '#f0913a', '#9b5fc0', '#4fb36a']), w: 0.4 });
    }
  });
  if (w > 9 && !o.single) pen(ctx, [[x + w / 2, y], [x + w / 2, y + h]], { w: 0.6 });
  box(ctx, x - 2, y + h + 1.2, w + 4, 1.6, { fill: '#d8cfba', w: 0.5 });
  if (o.bars) for (let i = x + 1.6; i < x + w; i += 2.4) pen(ctx, [[i, y], [i, y + h]], { w: 0.4 });
}
function ac(ctx, x, y, r) {
  box(ctx, x, y, 10, 6, { fill: '#ddd8e2', w: 0.6 });
  for (let i = 1; i < 9; i += 1.6) pen(ctx, [[x + i, y + 1], [x + i, y + 4]], { w: 0.25 });
  if (r() < 0.6) { pen(ctx, [[x + 3, y + 6], [x + 3, y + 10 + r() * 6]], { c: '#3a6a8a88', w: 0.5 }); blob(ctx, x + 3, y + 13 + r() * 4, 0.6, 0.9, { fill: '#7fb3d8', w: 0.2 }); }
}
function dish(ctx, x, y) {
  pen(ctx, [[x + 1, y + 5], [x + 3, y + 2]], { w: 0.6 });
  blob(ctx, x + 3, y + 1.4, 2.4, 3.4, { fill: '#d8d4de', w: 0.5, n: 12 });
  blob(ctx, x + 3.6, y + 1.4, 1.2, 2.2, { fill: '#a8a4b0', stroke: false, n: 10 });
  pen(ctx, [[x + 3, y + 1.4], [x + 6.4, y + 0.6]], { w: 0.4 });
}
function fireEscape(ctx, x, y, w, floors, fh) {
  for (let f = 0; f < floors; f++) {
    const fy = y + f * fh;
    pen(ctx, [[x, fy], [x + w, fy]], { w: 0.9 });
    pen(ctx, [[x, fy - 7], [x + w, fy - 7]], { w: 0.6 });
    for (let i = x; i <= x + w; i += 3.2) pen(ctx, [[i, fy - 7], [i, fy]], { w: 0.35, j: 0.1 });
    if (f < floors - 1) { pen(ctx, [[x + 4, fy + 0.6], [x + w - 6, fy + fh - 0.6]], { w: 0.7 }); pen(ctx, [[x + 6, fy + 0.6], [x + w - 4, fy + fh - 0.6]], { w: 0.7 }); }
  }
}
function pipe(ctx, x, y, h) {
  box(ctx, x, y, 2.4, h, { fill: '#8a8494', w: 0.5 });
  for (let j = y + 8; j < y + h; j += 18) box(ctx, x - 0.8, j, 4, 1.4, { fill: '#6a6474', w: 0.4 });
}
export function tag(ctx, x, y, r, color, size = 7) {
  const word = pick(r, TAGS);
  const c = color || pick(r, [C.pink, C.cyan, '#ffffff', C.yellow, C.green, C.orange, C.purple]);
  letter(ctx, word, x, y, { font: "'Permanent Marker', cursive", size, fill: c, stroke: INK, sw: size * 0.14, rot: (r() - 0.5) * 0.3, align: 'left' });
  for (let i = 0; i < 3; i++) { const dx = x + r() * size * word.length * 0.6; pen(ctx, [[dx, y + size * 0.35], [dx, y + size * 0.35 + 1.5 + r() * 4]], { c, w: 0.5, j: 0.1 }); }
}
function posters(ctx, x, y, w, h, r) {
  for (let i = 0; i < Math.round((w * h) / 70); i++) {
    const pw = 7 + r() * 5, ph = 9 + r() * 4;
    const px0 = x + r() * Math.max(1, w - pw), py0 = y + r() * Math.max(1, h - ph);
    box(ctx, px0, py0, pw, ph, { fill: pick(r, ['#f6efdc', C.yellow, C.red, C.cyan, '#ffffff', C.green]), w: 0.4, j: 0.3 });
    pen(ctx, [[px0 + 1, py0 + 2.4], [px0 + pw - 1, py0 + 2.4]], { w: 0.9 });
    for (let l = py0 + 4.4; l < py0 + ph - 1; l += 1.6) pen(ctx, [[px0 + 1, l], [px0 + 1 + (pw - 2) * (0.4 + r() * 0.6), l]], { w: 0.3 });
  }
}
function awning(ctx, x, y, w, c1, c2) {
  const n = Math.round(w / 8), sw = w / n;
  for (let i = 0; i < n; i++) shape(ctx, [[x + i * sw, y], [x + (i + 1) * sw, y], [x + (i + 1) * sw, y + 7], [x + (i + 0.5) * sw, y + 9.4], [x + i * sw, y + 7]], { fill: i % 2 ? c2 : c1, w: 0.6, step: 4 });
  pen(ctx, [[x, y], [x + w, y]], { w: 1 });
  halftone(ctx, x, y + 4, w, 4, '#00000030', 1.4, 0.45);
}
function sign(ctx, x, y, w, h, bg, str, o = {}) {
  box(ctx, x, y, w, h, { fill: bg, w: 1 });
  letter(ctx, str, x + w / 2, y + h / 2 + (o.dy || 0), { font: o.font, size: o.size || h * 0.7, fill: o.color || INK, stroke: o.stroke, sw: o.sw, shadow: o.shadow });
  if (o.sub) letter(ctx, o.sub, x + w / 2, y + h - 2.4, { font: "'Patrick Hand', cursive", size: o.subSize || 4.4, fill: o.subColor || INK });
}
function displayWindow(ctx, x, y, w, h, items, r) {
  box(ctx, x - 1.6, y - 1.6, w + 3.2, h + 3.2, { fill: '#2a2430', w: 0.9 });
  const g = box(ctx, x, y, w, h, { fill: '#f8e6b0', w: 0.6 });
  const n = Math.min(items.length, Math.max(1, Math.floor((w - 2) / 22)));
  clipTo(ctx, g, () => {
    halftone(ctx, x, y, w, h, '#e0a04a44', 1.6, (xx, yy) => 0.2 + ((yy - y) / h) * 0.4);
    for (let i = 0; i < n; i++) {
      const cx = x + ((i + 0.5) * w) / n;
      ctx.drawImage(itemCanvas(items[i]), cx - 11, y + h - 23, 22, 22);
    }
    pen(ctx, [[x + 3, y + h - 3], [x + 12, y + 3]], { c: '#ffffffaa', w: 0.8 });
  });
  box(ctx, x - 2.4, y + h + 1.6, w + 4.8, 1.8, { fill: '#5a4a50', w: 0.5 });
}
function door(ctx, x, y, w, h, color) {
  box(ctx, x - 1.4, y - 1.4, w + 2.8, h + 1.4, { fill: '#2a2430', w: 0.8 });
  box(ctx, x, y, w, h, { fill: color, w: 0.8 });
  box(ctx, x + 2.4, y + 3, w - 4.8, h * 0.5, { fill: '#5a4e5c', w: 0.6 });
  blob(ctx, x + w - 3.4, y + h * 0.6, 0.9, 0.9, { fill: C.gold, w: 0.4 });
  hatch(ctx, x + 1, y + h * 0.66, w - 2, h * 0.32, { gap: 1.6, w: 0.25 });
  return { x, y, w, h };
}
function trash(ctx, x, y, n, r) {
  for (let i = 0; i < n; i++) {
    const bx = x + i * 5.4, by = y - 3;
    blob(ctx, bx, by, 3.6, 3.2, { fill: '#26222c', w: 0.6 });
    pen(ctx, [[bx - 0.6, by - 3], [bx + 0.4, by - 4.4]], { w: 0.5 });
  }
  for (let i = 0; i < 4; i++) { const fx = x + r() * n * 5, fy = y - 10 - r() * 6; blob(ctx, fx, fy, 0.45, 0.45, { fill: INK, stroke: false, n: 6 }); pen(ctx, [[fx - 1.4, fy - 0.6], [fx - 0.6, fy - 0.2]], { w: 0.2 }); }
}
function shutter(ctx, x, y, w, h, r, o = {}) {
  const p = box(ctx, x, y, w, h, { fill: o.color || '#a6a2ae', w: 0.8 });
  clipTo(ctx, p, () => {
    for (let j = y + 1.6; j < y + h; j += 1.8) pen(ctx, [[x, j], [x + w, j]], { c: '#6a6676', w: 0.3, j: 0.1 });
    halftone(ctx, x, y, w, h, '#00000020', 1.6, 0.4);
  });
  if (o.tag !== false && w > 14) tag(ctx, x + 2, y + h * 0.45, r, null, Math.min(8, h * 0.5));
}
// live neon (drawn each frame so it can buzz and flicker)
export function neon(str, color, R, o = {}) {
  const size = o.size || 7, font = o.font || "'Bangers', sans-serif";
  const probe = layer(1, 1, 1)[1];
  probe.font = `${size}px ${font}`;
  const w = probe.measureText(str).width + 8, h = size * 1.8;
  const [c, ctx] = layer(w, h, R);
  if (o.bg) box(ctx, 0.6, 0.6, w - 1.2, h - 1.2, { fill: o.bg, w: 0.7 });
  ctx.shadowColor = color;
  ctx.shadowBlur = 3 * R;
  letter(ctx, str, w / 2, h / 2, { font, size, fill: color, stroke: shade(color, -0.25), sw: size * 0.08 });
  ctx.shadowBlur = 0;
  letter(ctx, str, w / 2, h / 2, { font, size, fill: '#ffffff', stroke: color, sw: size * 0.12 });
  c.uw = w; c.uh = h;
  return c;
}

// ---------- the eight frontages ----------
export const FACADES = {
  // HARLEM, NYC: walk-up tenement, fire escape, bodega front, half-down roll gate, bodega cat
  'north-america'(ctx, x, G, r, items, R) {
    const top = G - 176;
    brickWall(ctx, x, top, SW, 114, C.brick, r);
    box(ctx, x - 3, top - 5, SW + 6, 6, { fill: '#8a3a28', w: 0.9 });
    for (let f = 0; f < 3; f++) {
      const fy = top + 12 + f * 34;
      for (const wx of [10, 44, 104, 138]) { win(ctx, x + wx, fy, 13, 18, r, { frame: '#efe1c8' }); if (r() < 0.35) ac(ctx, x + wx + 1.5, fy + 14, r); }
    }
    fireEscape(ctx, x + 36, top + 34, 86, 3, 34);
    pipe(ctx, x + 1, top, 114);
    const gf = G - 62;
    box(ctx, x, gf, SW, 62, { fill: '#2e6b4a', w: 1 });
    sign(ctx, x + 4, gf + 2, SW - 8, 13, '#f6cc3c', 'UPTOWN THREAD EXCHANGE', { font: "'Bungee', sans-serif", size: 6.4, color: C.red, stroke: INK, sw: 0.7 });
    awning(ctx, x + 2, gf + 16, SW - 4, '#2e8a52', '#f6f1e2');
    displayWindow(ctx, x + 8, gf + 29, 52, 25, items.slice(0, 2), r);
    displayWindow(ctx, x + 100, gf + 29, 52, 25, items.slice(2, 4), r);
    const d = door(ctx, x + 67, G - 44, 26, 44, '#2e6b4a');
    shutter(ctx, x + 98, gf + 27, 56, 12, r);
    box(ctx, x + 71, G - 40, 12, 6, { fill: '#2a5ea8', w: 0.4 }); letter(ctx, 'ATM', x + 77, G - 37, { size: 4, fill: '#fff' });
    const cat = catImg(R); ctx.drawImage(cat, x + 44, gf + 42, 14, 10.5);
    tag(ctx, x + 8, G - 4, r, '#ffffff');
    return { door: d, top, holes: [[x + 8, gf + 29, 52, 25], [x + 100, gf + 29, 52, 25], [d.x, d.y, d.w, d.h]], neon: [{ x: x + 12, y: gf + 30, c: neon('OPEN', C.pink, R, { size: 6 }) }] };
  },

  // SCARBOROUGH, TORONTO: strip-plaza unit, backlit sign box, roti/cell-fix pylon, dirty slush
  canada(ctx, x, G, r, items, R) {
    const top = G - 104;
    plaster(ctx, x, top, SW, 104, '#c9b994', r);
    box(ctx, x - 2, top - 4, SW + 4, 4, { fill: '#8a7a5e', w: 0.8 });
    pen(ctx, [[x + 120, top - 4], [x + 120, top - 38]], { w: 1.4 }); pen(ctx, [[x + 124, top - 4], [x + 124, top - 38]], { w: 1.4 });
    box(ctx, x + 102, top - 60, 42, 24, { fill: '#f6f4ee', w: 0.9 });
    letter(ctx, 'ROTI & PATTIES', x + 123, top - 53, { size: 5, fill: C.red, font: "'Bangers', sans-serif" });
    letter(ctx, 'CELL FIX • $$', x + 123, top - 44, { size: 4.6, fill: '#2a5ea8', font: "'Bangers', sans-serif" });
    sign(ctx, x + 6, top + 8, SW - 12, 22, '#fdf9ee', '6IX SIDE THRIFT', { size: 13, color: C.red, stroke: INK, sw: 0.8, dy: -2.4, sub: 'VINTAGE • JERSEYS • GRAILS', subSize: 4.6 });
    shutter(ctx, x + 4, top + 38, 30, G - top - 38, r, { color: '#a6a2ae' });
    shutter(ctx, x + 126, top + 38, 30, G - top - 38, r, { color: '#a6a2ae' });
    box(ctx, x + 36, top + 36, 88, G - top - 36, { fill: '#3a3644', w: 0.9 });
    displayWindow(ctx, x + 40, top + 44, 28, 44, items.slice(0, 1), r);
    displayWindow(ctx, x + 94, top + 44, 26, 44, items.slice(1, 2), r);
    posters(ctx, x + 42, top + 44, 24, 10, r);
    const d = door(ctx, x + 70, G - 46, 22, 46, '#b8b4c0');
    sign(ctx, x + 6, top + 44, 26, 10, C.yellow, 'WE BUY', { size: 6, color: INK });
    for (let i = 0; i < SW; i += 7) blob(ctx, x + i + r() * 4, G - 1.4, 4 + r() * 3, 2.4, { fill: pick(r, ['#d8d6dc', '#bdbac4', '#a8a4b0']), w: 0.4 });
    return { door: d, top: top - 60, holes: [[x + 40, top + 44, 28, 44], [x + 94, top + 44, 26, 44], [d.x, d.y, d.w, d.h]], neon: [{ x: x + 96, y: top + 31, c: neon('OPEN', C.red, R, { size: 5.5 }) }] };
  },

  // ROCINHA, RIO: stacked raw-brick boxes, water tank, rebar, laundry, gato wires, hand-painted shop
  'south-america'(ctx, x, G, r, items, R) {
    brickWall(ctx, x + 6, G - 150, 74, 92, '#c8693e', r, '#8a3e22');
    brickWall(ctx, x + 80, G - 122, 76, 64, '#c8693e', r, '#8a3e22');
    brickWall(ctx, x + 28, G - 178, 58, 30, '#c8693e', r, '#8a3e22');
    plaster(ctx, x + 80, G - 122, 42, 40, '#f08ab0', r);
    for (const [wx, wy] of [[16, -140], [48, -136], [92, -112], [126, -110], [40, -170]]) win(ctx, x + wx, G + wy, 12, 12, r, { bars: true, single: true, frame: '#e8e0d0' });
    box(ctx, x + 32, G - 192, 22, 14, { fill: '#2a6fd0', w: 0.9 }); halftone(ctx, x + 32, G - 192, 22, 14, '#00000030', 1.4, 0.4);
    for (const rx of [60, 66, 72, 150]) pen(ctx, [[x + rx, G - (rx > 100 ? 122 : 178)], [x + rx + 0.6, G - (rx > 100 ? 132 : 189)]], { c: '#5a3a2a', w: 0.7 });
    dish(ctx, x + 60, G - 162);
    pen(ctx, [[x + 84, G - 126], [x + 118, G - 124], [x + 152, G - 127]], { w: 0.4 });
    for (let i = 0; i < 6; i++) box(ctx, x + 88 + i * 10, G - 126 + (i % 2), 6, 5 + (i % 3), { fill: pick(r, ['#ffdf00', '#009739', '#f6f4ee', '#2a5ea8', C.red]), w: 0.5 });
    plaster(ctx, x, G - 58, SW, 58, '#3fb0a4', r);
    sign(ctx, x + 8, G - 57, 100, 17, '#f6f1e2', 'Casa Exclusivo', { font: "'Pacifico', cursive", size: 9, color: '#1d8a3a', stroke: '#f4c430', sw: 0.5, dy: -1.6, sub: 'ROUPA • BONÉ • TÊNIS', subSize: 4.4, subColor: C.red });
    box(ctx, x + 12, G - 38, 64, 38, { fill: '#2a1e22', w: 0.9 });
    shutter(ctx, x + 12, G - 40, 64, 6, r, { tag: false });
    pen(ctx, [[x + 14, G - 31], [x + 74, G - 31]], { c: '#a8a4b0', w: 0.6 });
    items.slice(0, 2).forEach((it, i) => ctx.drawImage(itemCanvas(it), x + 18 + i * 30, G - 31, 22, 22));
    const d = door(ctx, x + 92, G - 40, 22, 40, '#e0b040');
    for (let i = 0; i < 6; i++) { const tx = x + 122 + (i % 3) * 10, ty = G - 38 + Math.floor(i / 3) * 16; pen(ctx, [[tx, ty + 10], [tx, ty], [tx + 5, ty], [tx + 5, ty + 6]], { w: 0.7 }); }
    for (let i = 0; i < 9; i++) pen(ctx, [[x - 4, G - 152 + i * 3], [x + 30 + i * 12, G - 100 - (i % 3) * 18], [x + 44 + i * 13, G - 64 - (i % 3) * 30]], { w: 0.35, j: 1.2, step: 8 });
    return { door: d, top: G - 194, holes: [[x + 12, G - 38, 64, 38], [d.x, d.y, d.w, d.h]], neon: [{ x: x + 94, y: G - 50, c: neon('ABERTO', C.green, R, { size: 5 }) }] };
  },

  // SAINT-DENIS (93): grey HLM tower, dishes on every balcony, rideau tagged "93", TABAC losange
  europe(ctx, x, G, r, items, R) {
    const top = G - 184;
    plaster(ctx, x, top, SW, 126, '#b8b4b4', r);
    for (let yy = top; yy < G - 58; yy += 25) pen(ctx, [[x, yy], [x + SW, yy]], { c: '#8a8686', w: 0.5 });
    for (let f = 0; f < 5; f++) {
      const fy = top + 6 + f * 25;
      for (let k = 0; k < 5; k++) {
        const wx = x + 6 + k * 31;
        win(ctx, wx, fy, 13, 12, r, { single: true });
        if ((f + k) % 2 === 0) { pen(ctx, [[wx - 3, fy + 13.4], [wx + 16, fy + 13.4]], { w: 0.7 }); for (let i = 0; i < 19; i += 2.2) pen(ctx, [[wx - 3 + i, fy + 9], [wx - 3 + i, fy + 13.4]], { w: 0.3 }); }
        if (r() < 0.5) dish(ctx, wx + 13, fy + 2);
      }
    }
    box(ctx, x - 2, top - 3, SW + 4, 4, { fill: '#7a7676', w: 0.8 });
    const gf = G - 58;
    box(ctx, x, gf, SW, 58, { fill: '#2a2832', w: 1 });
    box(ctx, x + 6, gf + 3, 114, 14, { fill: '#141218', w: 0.8 });
    displayWindow(ctx, x + 10, gf + 22, 46, 30, items.slice(0, 2), r);
    const d = door(ctx, x + 64, G - 44, 24, 44, '#3a3844');
    shutter(ctx, x + 96, gf + 20, 58, 38, r, { color: '#9a96a4' });
    letter(ctx, '93', x + 136, gf + 30, { font: "'Anton', sans-serif", size: 14, fill: '#f6f4ee', stroke: C.red, sw: 1.4, rot: -0.12 });
    tag(ctx, x + 100, gf + 48, r, C.yellow);
    shape(ctx, [[x + 156, gf - 1], [x + 160, gf + 5], [x + 156, gf + 11], [x + 152, gf + 5]], { fill: C.red, w: 0.6, step: 2 });
    letter(ctx, 'TABAC', x + 156, gf + 5, { size: 2.6, fill: '#fff' });
    tag(ctx, x + 6, G - 4, r, C.cyan);
    return { door: d, top, holes: [[x + 10, gf + 22, 46, 30], [d.x, d.y, d.w, d.h], [x + 96, gf + 20, 58, 38]], neon: [{ x: x + 8, y: gf + 2, c: neon('BOUTIQUE DU BLOC', C.red, R, { size: 8, font: "'Anton', sans-serif" }) }] };
  },

  // YABA, LAGOS: painted block with mural, louvre windows, shipping-container shop, zinc awning, generator
  africa(ctx, x, G, r, items, R) {
    const top = G - 132;
    plaster(ctx, x, top, SW, 80, '#e2b84a', r);
    box(ctx, x + 40, top + 18, 62, 32, { fill: '#2a6fb0', w: 0.9 });
    letter(ctx, 'NO WAHALA', x + 71, top + 28, { font: "'Titan One', sans-serif", size: 8, fill: '#f6f4ee', stroke: INK, sw: 0.6 });
    letter(ctx, 'AIRTIME • DATA', x + 71, top + 41, { size: 5.4, fill: C.yellow });
    for (const wx of [8, 116]) {
      box(ctx, x + wx, top + 14, 32, 34, { fill: '#2a2630', w: 0.8 });
      for (let j = 0; j < 8; j++) box(ctx, x + wx + 1, top + 15 + j * 4.1, 30, 3, { fill: j % 2 ? '#9fc6d8' : '#bfdce8', w: 0.3, j: 0.1 });
      for (let i = x + wx + 2; i < x + wx + 31; i += 3) pen(ctx, [[i, top + 14], [i, top + 48]], { w: 0.3 });
    }
    box(ctx, x - 2, top - 3, SW + 4, 4, { fill: '#9a8a5e', w: 0.8 });
    box(ctx, x + 120, top - 22, 22, 20, { fill: '#1d1a22', w: 0.8 });
    sign(ctx, x + 4, G - 79, 112, 22, '#f6f1e2', 'ODOGWU VINTAGE', { font: "'Titan One', sans-serif", size: 9.4, color: '#1d8a3a', stroke: INK, sw: 0.5, dy: -2.4, sub: 'ORIGINAL • NO SHAKING', subSize: 4.6, subColor: C.red });
    const ct = box(ctx, x + 4, G - 50, 112, 50, { fill: '#c8352e', w: 1 });
    clipTo(ctx, ct, () => { for (let i = x + 4; i < x + 116; i += 3) pen(ctx, [[i, G - 50], [i, G]], { c: '#8a1f1f', w: 0.6, j: 0.05 }); halftone(ctx, x + 4, G - 50, 112, 50, '#00000020', 1.6, 0.4); });
    box(ctx, x + 30, G - 46, 60, 46, { fill: '#2a1e22', w: 0.8 });
    pen(ctx, [[x + 32, G - 40], [x + 88, G - 40]], { c: '#a8a4b0', w: 0.6 });
    items.slice(0, 2).forEach((it, i) => ctx.drawImage(itemCanvas(it), x + 36 + i * 26, G - 39, 22, 22));
    const d = { x: x + 52, y: G - 46, w: 16, h: 46 };
    for (let i = 0; i < SW; i += 4) box(ctx, x + i, G - 55 + i / 50, 4, 3, { fill: i % 8 ? '#b8b4c0' : '#9a96a4', w: 0.3, j: 0.1 });
    pen(ctx, [[x + 3, G - 53], [x + 3, G]], { w: 1.4, c: '#5a3a24' }); pen(ctx, [[x + 156, G - 52], [x + 156, G]], { w: 1.4, c: '#5a3a24' });
    box(ctx, x + 122, G - 16, 22, 15, { fill: '#f0c030', w: 0.8 }); box(ctx, x + 125, G - 12, 9, 6, { fill: '#2a2630', w: 0.4 }); pen(ctx, [[x + 140, G - 16], [x + 140, G - 22]], { w: 1 });
    box(ctx, x + 146, G - 10, 6, 10, { fill: C.red, w: 0.5 }); box(ctx, x + 152.4, G - 10, 6, 10, { fill: '#2a6fd0', w: 0.5 });
    return { door: d, top: top - 22, holes: [[x + 30, G - 46, 60, 46]], neon: [{ x: x + 32, y: G - 53, c: neon('LIGHT DEY', '#dff8ff', R, { size: 4 }), tube: true }], smoke: { x: x + 140, y: G - 23 } };
  },

  // SHINJUKU, TOKYO: dark tile, AC stacks, vertical sign boxes, vending machines, lanterns, 古着 neon
  asia(ctx, x, G, r, items, R) {
    const top = G - 180;
    const wall = box(ctx, x, top, SW, 124, { fill: '#4a4a58', w: 1 });
    clipTo(ctx, wall, () => { for (let yy = top; yy < G - 56; yy += 6) pen(ctx, [[x, yy], [x + SW, yy]], { c: '#3a3a46', w: 0.35 }); halftone(ctx, x, top, SW, 124, '#00000020', 1.8, 0.45); });
    for (let f = 0; f < 4; f++) { const fy = top + 10 + f * 30; for (const wx of [8, 40, 72]) win(ctx, x + wx, fy, 22, 14, r, { curtain: '#e8e0d0' }); ac(ctx, x + 10 + f * 7, fy + 17, r); ac(ctx, x + 60, fy + 17, r); }
    [[C.cyan, '#1a1a1a'], [C.yellow, '#1a1a1a'], ['#f6f4ee', C.red], [C.pink, '#ffffff'], [C.green, '#1a1a1a'], ['#f6f4ee', '#2a5ea8']].forEach(([bg, fg], i) => {
      const sy = top + 8 + i * 20;
      box(ctx, x + 108, sy, 46, 16, { fill: bg, w: 0.8 });
      for (let k = 0; k < 4; k++) { const gx = x + 112 + k * 10; pen(ctx, [[gx, sy + 4], [gx + 7, sy + 4]], { c: fg, w: 0.8 }); pen(ctx, [[gx + 3.5, sy + 3], [gx + 3.5, sy + 13]], { c: fg, w: 0.8 }); pen(ctx, [[gx, sy + 9], [gx + 7, sy + 8]], { c: fg, w: 0.8 }); }
    });
    pipe(ctx, x + 102, top, 124);
    const gf = G - 56;
    box(ctx, x, gf, SW, 56, { fill: '#2a2430', w: 1 });
    box(ctx, x + 4, gf + 2, 100, 12, { fill: '#141018', w: 0.8 });
    displayWindow(ctx, x + 6, gf + 20, 30, 32, items.slice(0, 1), r);
    shutter(ctx, x + 40, gf + 16, 30, 14, r);
    const d = door(ctx, x + 42, G - 40, 26, 40, '#6a4a30');
    for (let i = 0; i < 3; i++) { box(ctx, x + 42 + i * 8.8, G - 40, 8, 15, { fill: '#23356b', w: 0.5 }); }
    blob(ctx, x + 55, G - 33, 2.4, 2.4, { fill: false, stroke: '#f6f4ee', w: 0.7 });
    for (const vx of [74, 94]) { box(ctx, x + vx, G - 42, 18, 42, { fill: vx === 74 ? C.red : '#2a6fd0', w: 0.8 }); box(ctx, x + vx + 2, G - 39, 14, 18, { fill: '#eef6ff', w: 0.5 }); for (let j = 0; j < 3; j++) for (let k = 0; k < 4; k++) box(ctx, x + vx + 3 + k * 3.2, G - 37 + j * 5.6, 2.2, 4, { fill: pick(r, [C.yellow, C.green, C.pink, C.cyan, '#f6f4ee']), w: 0.3 }); }
    for (const lx of [120, 138]) { pen(ctx, [[x + lx + 3, gf + 13], [x + lx + 3, gf + 17]], { w: 0.5 }); blob(ctx, x + lx + 3, gf + 22, 3.6, 5, { fill: '#e0302a', w: 0.7 }); pen(ctx, [[x + lx, gf + 22], [x + lx + 6, gf + 22]], { w: 0.4 }); }
    trash(ctx, x + 118, G, 4, r);
    return { door: d, top, holes: [[x + 6, gf + 20, 30, 32], [d.x, d.y, d.w, d.h]], neon: [{ x: x + 6, y: gf + 1, c: neon('URA-HARA STASH', C.cyan, R, { size: 7, font: "'Shojumaru', serif" }) }, { x: x + 120, y: gf + 30, c: neon('古着', C.pink, R, { size: 12, font: "'Hiragino Sans','Noto Sans JP','Yu Gothic',sans-serif" }) }] };
  },

  // MOUNT DRUITT, WESTERN SYDNEY: tan brick shop strip, verandah on posts, roller door, dumped trolley
  oceania(ctx, x, G, r, items, R) {
    const top = G - 112;
    brickWall(ctx, x, top, SW, 112, '#d8aa74', r, '#8a6a40');
    box(ctx, x - 2, top - 6, SW + 4, 6, { fill: '#e6e2ea', w: 0.8 });
    sign(ctx, x + 6, top + 6, SW - 12, 26, '#1d3f8f', 'WESTIE GRAILS', { font: "'Lilita One', sans-serif", size: 14, color: C.yellow, stroke: INK, sw: 0.8, dy: -2.6, sub: 'TNS • POLOS • TRACKIES', subSize: 4.8, subColor: '#f6f4ee' });
    win(ctx, x + 14, top + 40, 22, 14, r); win(ctx, x + 124, top + 40, 22, 14, r);
    box(ctx, x, G - 64, SW, 4, { fill: '#efebf2', w: 0.8 });
    pen(ctx, [[x + 5, G - 60], [x + 5, G]], { w: 1.4 }); pen(ctx, [[x + 155, G - 60], [x + 155, G]], { w: 1.4 });
    displayWindow(ctx, x + 10, G - 50, 52, 40, items.slice(0, 2), r);
    const d = door(ctx, x + 70, G - 46, 22, 46, '#e6e2ea');
    shutter(ctx, x + 100, G - 50, 52, 50, r, { color: '#d0ccd6' });
    sign(ctx, x + 104, G - 47, 44, 9, '#f6f4ee', 'CASH 4 KICKS', { size: 5.6, color: C.red });
    const tx = x + 130;
    for (let j = 0; j < 10; j += 2.4) pen(ctx, [[tx, G - 16 + j], [tx + 18, G - 16 + j]], { c: '#8a8698', w: 0.5, j: 0.1 });
    for (let i = 0; i < 19; i += 3) pen(ctx, [[tx + i, G - 16], [tx + i + 1, G - 6]], { c: '#8a8698', w: 0.5, j: 0.1 });
    pen(ctx, [[tx, G - 16], [tx - 3, G - 20]], { c: C.red, w: 1.2 });
    blob(ctx, tx + 2, G - 2, 1.4, 1.4, { fill: INK, stroke: false }); blob(ctx, tx + 16, G - 2, 1.4, 1.4, { fill: INK, stroke: false });
    box(ctx, x + 110, G - 9, 13, 9, { fill: '#2a5ea8', w: 0.6 });
    tag(ctx, x + 102, G - 28, r, C.pink);
    return { door: d, top: top - 6, holes: [[x + 10, G - 50, 52, 40], [d.x, d.y, d.w, d.h]], neon: [{ x: x + 16, y: G - 60, c: neon('OPEN', C.yellow, R, { size: 5 }) }] };
  },
};

let catCache = null;
function catImg(R) {
  if (catCache) return catCache;
  const [c, ctx] = layer(16, 12, R);
  blob(ctx, 6, 8, 4, 3.4, { fill: '#1d1820', w: 0.5 });
  blob(ctx, 9.6, 4.6, 2.8, 2.6, { fill: '#1d1820', w: 0.5 });
  shape(ctx, [[7.6, 3], [7.8, 0.4], [9, 2.4]], { fill: '#1d1820', w: 0.4, step: 2 });
  shape(ctx, [[10.6, 2.4], [11.6, 0.2], [12, 2.8]], { fill: '#1d1820', w: 0.4, step: 2 });
  blob(ctx, 9, 4.4, 0.6, 0.45, { fill: '#c8f04a', stroke: false });
  blob(ctx, 11, 4.4, 0.6, 0.45, { fill: '#c8f04a', stroke: false });
  catCache = c;
  return c;
}

// Boarded up with scaffolding, tape and cones: any region with no stock
export function construction(ctx, x, G, f, store, r) {
  const top = f.top + 16;
  for (const sx of [x + 6, x + 56, x + 104, x + 152]) box(ctx, sx, top, 2.4, G - top, { fill: '#a8a4b0', w: 0.5 });
  for (let yy = top + 10; yy < G - 40; yy += 26) { box(ctx, x + 4, yy, SW - 8, 3, { fill: '#c89a5a', w: 0.5 }); pen(ctx, [[x + 8, yy + 24], [x + 54, yy + 4]], { w: 0.6 }); }
  for (let i = 0; i < SW; i += 20) box(ctx, x + i, G - 40, 19.4, 40, { fill: i % 40 ? '#d8aa6a' : '#c89a5a', w: 0.6 });
  posters(ctx, x + 4, G - 36, 40, 20, r);
  sign(ctx, x + 50, G - 36, 60, 22, C.yellow, 'UNDER CONSTRUCTION', { size: 6.4, dy: -2.4, sub: `NO ${store.region.toUpperCase()} STOCK YET`, subColor: C.red });
  for (const cx of [x + 30, x + 132]) { shape(ctx, [[cx, G], [cx + 3, G - 12], [cx + 6, G - 12], [cx + 9, G]], { fill: C.orange, w: 0.6, step: 3 }); pen(ctx, [[cx + 2, G - 6], [cx + 7, G - 6]], { c: '#f6f4ee', w: 1.4 }); }
}

// ---------- Booster Corner: a van backed into the alley, doors open, trunk full ----------
export function vanRear(ctx, bx, top, bw, bh, r, items, o = {}) {
  const bottom = top + bh, doorW = bw * 0.17;
  for (const [dx, s] of [[bx - doorW, -1], [bx + bw, 1]]) {
    shape(ctx, [[dx, top + 3], [dx + doorW, top + 3 + (s > 0 ? 0 : 2)], [dx + doorW, bottom - 6], [dx, bottom - 4]], { fill: '#c9c5d0', w: 0.9, step: 6 });
    box(ctx, dx + doorW * 0.18, top + bh * 0.1, doorW * 0.64, bh * 0.3, { fill: C.glassDk, w: 0.5 });
  }
  const body = box(ctx, bx, top, bw, bh, { fill: '#e6e2ea', w: 1.1 });
  clipTo(ctx, body, () => { halftone(ctx, bx, top, bw, bh, '#00000018', 1.6, 0.4); for (let i = 0; i < 6; i++) blob(ctx, bx + r() * bw, top + bh * 0.7 + r() * bh * 0.3, 1 + r() * 2, 0.8 + r(), { fill: '#a0603a88', stroke: false }); });
  const ix = bx + bw * 0.07, iy = top + bh * 0.07, iw = bw * 0.86, ih = bh * 0.7;
  const inner = box(ctx, ix, iy, iw, ih, { fill: '#2a2030', w: 0.9 });
  clipTo(ctx, inner, () => {
    for (let x = ix + 3; x < ix + iw; x += o.big ? 5 : 3.4) pen(ctx, [[x, iy], [x, iy + ih]], { c: '#3a2e40', w: 0.4, j: 0.1 });
    blob(ctx, bx + bw / 2, iy + 2, iw * 0.45, ih * 0.5, { fill: '#ffe9a022', stroke: false });
    halftone(ctx, ix, iy, iw, ih, '#ffe9a033', 1.6, (xx, yy) => Math.max(0, 0.6 - Math.hypot(xx - (bx + bw / 2), yy - iy) / (iw * 0.6)));
  });
  box(ctx, bx + bw / 2 - (o.big ? 6 : 3), iy, o.big ? 12 : 6, o.big ? 2.4 : 1.4, { fill: '#fff3b0', w: 0.4 });
  const rail = iy + (o.big ? 7 : 3.4);
  pen(ctx, [[ix + 2, rail], [ix + iw - 2, rail]], { c: '#c9c6cf', w: o.big ? 1 : 0.6 });
  const hang = items.slice(0, o.big ? 4 : 2);
  const step = (iw - 4) / hang.length, sz = o.big ? 26 : 16;
  hang.forEach((it, i) => { const cx = ix + 2 + step * (i + 0.5); pen(ctx, [[cx, rail], [cx, rail + 2]], { w: 0.4 }); ctx.drawImage(itemCanvas(it), cx - sz / 2, rail + 1, sz, sz); });
  const fl = iy + ih;
  const shoebox = (x, w, h, c) => { box(ctx, x, fl - h, w, h, { fill: c, w: 0.6 }); pen(ctx, [[x + 1, fl - h + 1.6], [x + w - 1, fl - h + 1.6]], { c: '#f6f4ee', w: 0.5 }); };
  if (o.big) {
    shoebox(ix + 4, 18, 10, C.orange); shoebox(ix + 6, 15, 7, '#f6f4ee'); shoebox(ix + 24, 17, 11, '#1d1a22'); shoebox(ix + iw - 28, 20, 10, C.red);
    const sn = items.find((i) => i.type === 'sneaker');
    if (sn) ctx.drawImage(itemCanvas(sn), ix + 40, fl - 24, 24, 24);
    for (let k = 0; k < 4; k++) pen(ctx, Array.from({ length: 8 }, (_, i) => [ix + iw - 48 + i * 1.4 + k, fl - 3 - k - Math.sin(i / 1.3) * 1.6]), { c: k % 2 ? C.gold2 : C.gold, w: 0.9, j: 0.05 });
    box(ctx, ix + iw - 36, fl - 8, 9, 6, { fill: '#4a2c1e', w: 0.5 }); blob(ctx, ix + iw - 31.5, fl - 5, 2, 2, { fill: C.gold, w: 0.4 });
  } else {
    shoebox(ix + 2, 9, 5, C.orange); shoebox(ix + 12, 9, 6, '#1d1a22'); shoebox(ix + iw - 11, 9, 5, C.red);
    pen(ctx, [[ix + iw - 20, fl - 2], [ix + iw - 14, fl - 3]], { c: C.gold, w: 1 });
  }
  for (const tx of [bx + 0.6, bx + bw - (o.big ? 4.6 : 2.6)]) box(ctx, tx, top + bh * 0.28, o.big ? 4 : 2, bh * 0.3, { fill: C.red, w: 0.6 });
  const bumpH = o.big ? 7 : 4;
  box(ctx, bx - 1, bottom - bumpH, bw + 2, bumpH, { fill: '#3a3640', w: 0.8 });
  if (o.big) { box(ctx, bx + bw / 2 - 18, bottom - bumpH - 11, 36, 11, { fill: '#f6f4ee', w: 0.7 }); letter(ctx, 'BOOST', bx + bw / 2, bottom - bumpH - 5.4, { size: 8, fill: INK }); }
  else { box(ctx, bx + bw / 2 - 10, bottom - bumpH - 6, 20, 6.4, { fill: '#f6f4ee', w: 0.5 }); letter(ctx, 'BOOST', bx + bw / 2, bottom - bumpH - 2.8, { size: 4.6, fill: INK }); }
  const wh = o.big ? 11 : 6;
  for (const wx of [bx + 4, bx + bw - 4 - wh * 1.3]) box(ctx, wx, bottom, wh * 1.3, wh, { fill: '#1d1a20', w: 0.7 });
  tag(ctx, bx + 4, top + bh * 0.88, r, C.pink, o.big ? 9 : 5);
  return { trunk: { x: bx + bw / 2, y: iy + ih / 2 } };
}

export function paintBoosterCorner(ctx, x, G, r, items, R) {
  const W = ALLEY_W;
  brickWall(ctx, x, G - 150, W, 150, '#5a4450', r, '#2e222a');
  halftone(ctx, x, G - 150, W, 150, '#0a060e55', 1.6, 0.6);
  shape(ctx, [[x, G - 150], [x + 12, G - 140], [x + 12, G - 8], [x, G]], { fill: '#2a1e28', w: 0.8, step: 8 });
  shape(ctx, [[x + W, G - 150], [x + W - 12, G - 140], [x + W - 12, G - 8], [x + W, G]], { fill: '#2a1e28', w: 0.8, step: 8 });
  for (let i = 0; i < W - 24; i += 3.2) { pen(ctx, [[x + 12 + i, G - 78], [x + 15 + i, G - 52]], { c: '#8a8698', w: 0.3 }); pen(ctx, [[x + 15 + i, G - 78], [x + 12 + i, G - 52]], { c: '#8a8698', w: 0.3 }); }
  for (let i = 0; i < W - 24; i += 4) blob(ctx, x + 12 + i, G - 80, 1.4, 1.2, { fill: false, stroke: '#b8b4c0', w: 0.3, n: 8 });
  letter(ctx, 'BOOSTER', x + W / 2, G - 128, { font: "'Permanent Marker', cursive", size: 13, fill: C.purple, stroke: INK, sw: 1.2, rot: -0.06 });
  letter(ctx, 'CORNER', x + W / 2 + 4, G - 114, { font: "'Permanent Marker', cursive", size: 11, fill: C.gold, stroke: INK, sw: 1.1, rot: -0.06 });
  for (const dx of [-22, -8, 10, 22]) pen(ctx, [[x + W / 2 + dx, G - 122], [x + W / 2 + dx, G - 116 + r() * 6]], { c: C.purple, w: 0.6 });
  letter(ctx, '$', x + W - 20, G - 96, { font: "'Permanent Marker', cursive", size: 14, fill: C.gold, stroke: INK, sw: 1.2 });
  pen(ctx, [[x + W / 2, G - 150], [x + W / 2, G - 104]], { w: 0.5 });
  blob(ctx, x + W / 2, G - 102, 2, 2.4, { fill: '#fff3b0', w: 0.5 });
  halftone(ctx, x + W / 2 - 34, G - 100, 68, 94, '#fff3b0', 1.8, (xx, yy) => Math.max(0, 0.5 - Math.abs(xx - (x + W / 2)) / ((yy - (G - 100)) * 0.7 + 6)));
  box(ctx, x, G - 6, W, 6, { fill: '#3a3440', w: 0.6 });
  trash(ctx, x + 6, G, 2, r);
  const van = vanRear(ctx, x + 30, G - 62, 58, 54, r, items);
  return {
    neon: [{ x: x - 32, y: G - 150, c: neon('BOOSTER >', C.pink, R, { size: 8, bg: '#1d1820' }) }],
    steam: { x: x + W - 7, y: G - 4 },
    cat: { x: x + 50, y: G - 72 },
    booster: { x: x + 14, y: G + 7 },
    trunk: van.trunk,
  };
}

// ---------- corners + street furniture ----------
export function paintCorner(ctx, x, G, r, end, R) {
  const W = 120, top = G - 112;
  brickWall(ctx, x, top, W, 112, '#9a5a4a', r);
  for (let f = 0; f < 2; f++) for (const wx of [12, 46, 80]) { win(ctx, x + wx, top + 12 + f * 28, 16, 18, r); if (r() < 0.3) ac(ctx, x + wx + 3, top + 28 + f * 28, r); }
  box(ctx, x - 2, top - 3, W + 4, 4, { fill: '#6a3a30', w: 0.8 });
  if (!end) {
    pen(ctx, [[x + 16, top - 2], [x + 16, top - 50]], { w: 1.4 }); pen(ctx, [[x + 100, top - 2], [x + 100, top - 50]], { w: 1.4 });
    box(ctx, x + 2, top - 76, 116, 30, { fill: '#f6f1e2', w: 1.2 });
    letter(ctx, 'SMOKE THE CRACK', x + 60, top - 65, { size: 15, fill: C.red, stroke: INK, sw: 1.1, shadow: INK });
    letter(ctx, 'GRAILS ON THE BLOCK', x + 60, top - 52.5, { font: "'Patrick Hand', cursive", size: 6, fill: INK });
    box(ctx, x, G - 50, W, 50, { fill: '#2a2430', w: 1 });
    box(ctx, x + 6, G - 48, 70, 11, { fill: '#141018', w: 0.7 });
    win(ctx, x + 8, G - 34, 40, 24, r, { bars: true, lit: true, peek: false });
    shutter(ctx, x + 56, G - 36, 56, 36, r);
    return { w: W, neon: [{ x: x + 8, y: G - 49, c: neon('PAWN • GOLD', C.yellow, R, { size: 6 }) }] };
  }
  box(ctx, x, G - 50, W, 50, { fill: '#2a2a38', w: 1 });
  for (let i = 0; i < 4; i++) { blob(ctx, x + 20 + i * 26, G - 22, 9, 9, { fill: '#e6e2ea', w: 0.7 }); blob(ctx, x + 20 + i * 26, G - 22, 5.6, 5.6, { fill: '#7fb3d8', w: 0.5 }); }
  box(ctx, x + 30, top - 30, 60, 26, { fill: '#2e7a4a', w: 1 });
  letter(ctx, 'SMOKE ST', x + 60, top - 20, { size: 11, fill: '#f6f4ee' });
  letter(ctx, 'END OF BLOCK', x + 60, top - 10, { font: "'Patrick Hand', cursive", size: 5, fill: '#f6f4ee' });
  pen(ctx, [[x + 60, top - 4], [x + 60, top]], { w: 1.2 });
  return { w: W, neon: [{ x: x + 8, y: G - 49, c: neon('WASH & FOLD 24H', C.cyan, R, { size: 6 }) }] };
}
export function lampPost(ctx, x, curb) {
  box(ctx, x, curb - 96, 2.4, 96, { fill: '#2e4a3a', w: 0.6 });
  pen(ctx, [[x + 1, curb - 96], [x + 12, curb - 98], [x + 15, curb - 95]], { w: 1.2 });
  shape(ctx, [[x + 11, curb - 96], [x + 19, curb - 96], [x + 17, curb - 92], [x + 13, curb - 92]], { fill: '#fff3b0', w: 0.6, step: 3 });
  box(ctx, x - 1.4, curb - 4, 5, 4, { fill: '#2e4a3a', w: 0.6 });
}
export function hydrant(ctx, x, y) {
  shape(ctx, [[x, y], [x, y - 10], [x + 1.4, y - 12.4], [x + 4.6, y - 12.4], [x + 6, y - 10], [x + 6, y]], { fill: C.red, w: 0.7, step: 3 });
  box(ctx, x - 2, y - 8, 10, 2.4, { fill: '#b02a22', w: 0.5 });
  pen(ctx, [[x + 1.6, y - 9], [x + 1.6, y - 2]], { c: '#ff8a80', w: 0.6 });
}
export function trashCan(ctx, x, y, r) {
  const p = shape(ctx, [[x, y], [x - 0.6, y - 13], [x + 10.6, y - 13], [x + 10, y]], { fill: '#4a5a4e', w: 0.7, step: 4 });
  clipTo(ctx, p, () => { for (let i = x + 1; i < x + 10; i += 2.4) pen(ctx, [[i, y - 12], [i, y]], { c: '#2e3a30', w: 0.4 }); });
  for (let i = 0; i < 5; i++) blob(ctx, x + 1 + r() * 9, y - 14 - r() * 2.4, 1.4 + r(), 1.1, { fill: pick(r, ['#f6f4ee', C.red, C.yellow, '#7a5a3a']), w: 0.4 });
  for (let i = 0; i < 3; i++) { const fx = x + r() * 10, fy = y - 19 - r() * 6; blob(ctx, fx, fy, 0.45, 0.45, { fill: INK, stroke: false, n: 6 }); pen(ctx, [[fx - 1.2, fy - 0.8], [fx - 0.4, fy - 0.3]], { w: 0.2 }); }
}
export function payphone(ctx, x, y) {
  box(ctx, x, y - 34, 2.4, 34, { fill: '#8a8494', w: 0.5 });
  box(ctx, x - 4, y - 36, 10.4, 15, { fill: '#a8a4b0', w: 0.7 });
  box(ctx, x - 3, y - 35, 8.4, 3, { fill: '#2a5ea8', w: 0.4 });
  box(ctx, x - 2, y - 30, 6.4, 7, { fill: '#3a3640', w: 0.4 });
}
export function newsBox(ctx, x, y, c) {
  box(ctx, x, y - 15, 10.4, 15, { fill: c, w: 0.7 });
  box(ctx, x + 1.2, y - 13, 8, 5, { fill: '#efebf2', w: 0.4 });
}
export function pole(ctx, x, curb) {
  box(ctx, x, curb - 176, 3, 176, { fill: '#6a4a30', w: 0.7 });
  box(ctx, x - 8, curb - 166, 19, 2, { fill: '#6a4a30', w: 0.6 });
  box(ctx, x - 6, curb - 154, 15, 2, { fill: '#6a4a30', w: 0.6 });
  box(ctx, x + 4, curb - 146, 6, 8, { fill: '#8a8494', w: 0.5 });
}
export { seedInk };
