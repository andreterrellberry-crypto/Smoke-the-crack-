// Region storefronts painted pixel by pixel. Each painter draws into the street canvas at (x0, ground G) and
// returns the door rect, roof line, holes (for boarding up) and neon signs (drawn live so they can flicker).
import { P, canvas, rect, px, line, wire, dither, speckle, streaks, brick, concrete, grime, window_, shutter, tag, posters, acUnit, dish, fireEscape, pipe, trashBags, glow, outline, shade, pick } from './draw.js';
import { text, measure } from './font.js';
import { itemSprite } from './items.js';
import { catFrames } from './sprites.js';

export const SW = 160; // store width
export const ALLEY_W = 100;

// ---------- reusable pieces ----------
export function neonSign(str, color, o = {}) {
  const font = o.font || 'big', scale = o.scale || 1;
  const w = measure(str, font, scale), h = (font === 'big' ? 7 : 5) * scale, pad = 3;
  const [c, ctx] = canvas(w + pad * 2, h + pad * 2);
  if (o.bg) rect(ctx, 0, 0, c.width, c.height, o.bg);
  ctx.globalAlpha = 0.28;
  for (const [dx, dy] of [[-2, 0], [2, 0], [0, -2], [0, 2], [-1, -1], [1, 1], [-1, 1], [1, -1]]) text(ctx, str, pad + dx, pad + dy, color, { font, scale });
  ctx.globalAlpha = 1;
  text(ctx, str, pad, pad, color, { font, scale });
  if (scale > 1) text(ctx, str, pad, pad, shade(color, 0.35), { font, scale: 1 });
  return c;
}
// Non-Latin neon (e.g. 古着) rendered with the system font, then hard-thresholded to pixels
export function glyphNeon(str, color, size = 12) {
  const [t, tctx] = canvas(size * str.length + 4, size + 6);
  tctx.font = `900 ${size}px "Hiragino Sans","Noto Sans JP","Yu Gothic","Noto Sans CJK JP",sans-serif`;
  tctx.textBaseline = 'top';
  tctx.fillStyle = '#fff';
  tctx.fillText(str, 2, 2);
  const d = tctx.getImageData(0, 0, t.width, t.height);
  const [c, ctx] = canvas(t.width + 4, t.height + 4);
  ctx.fillStyle = color;
  for (let y = 0; y < t.height; y++) for (let x = 0; x < t.width; x++) if (d.data[(y * t.width + x) * 4 + 3] > 120) {
    ctx.globalAlpha = 0.3; ctx.fillRect(x + 1, y + 2, 3, 1); ctx.fillRect(x + 2, y + 1, 1, 3);
  }
  ctx.globalAlpha = 1;
  for (let y = 0; y < t.height; y++) for (let x = 0; x < t.width; x++) if (d.data[(y * t.width + x) * 4 + 3] > 120) ctx.fillRect(x + 2, y + 2, 1, 1);
  return c;
}
function displayWindow(ctx, x, y, w, h, items, r, o = {}) {
  rect(ctx, x - 2, y - 2, w + 4, h + 4, o.frame || '#1a161e');
  rect(ctx, x, y, w, h, o.glass || '#4a3238');
  glow(ctx, x + w / 2, y + 2, Math.floor(w / 2), Math.floor(h * 0.7), o.light || '#f7b95533');
  dither(ctx, x, y, w, 3, '#ffd57a55');
  const n = Math.min(items.length, Math.max(1, Math.floor((w - 4) / 26)));
  for (let i = 0; i < n; i++) {
    const ix = x + 2 + Math.round(((w - 4) / n) * i + ((w - 4) / n - 24) / 2);
    rect(ctx, ix + 4, y + h - 3, 16, 2, '#2a1e24');
    ctx.drawImage(itemSprite(items[i]), ix, y + h - 27);
  }
  for (let i = 0; i < 3; i++) line(ctx, x + 3 + i * 9, y + h - 2, x + 9 + i * 9, y + 2, '#ffffff22');
  rect(ctx, x - 3, y + h + 2, w + 6, 2, o.sill || '#2a2430');
  return [x, y, w, h];
}
function door(ctx, x, y, w, h, color, r, o = {}) {
  rect(ctx, x - 2, y - 2, w + 4, h + 2, o.frame || '#141018');
  rect(ctx, x, y, w, h, color);
  rect(ctx, x + 2, y + 3, w - 4, Math.floor(h * 0.55), o.glass || '#3a2c34');
  glow(ctx, x + w / 2, y + 6, Math.floor(w / 2) - 2, 8, '#f7b95544');
  rect(ctx, x + w - 4, y + Math.floor(h * 0.6), 2, 4, '#c9a34a');
  rect(ctx, x + 2, y + Math.floor(h * 0.62), w - 4, 1, shade(color, -0.2));
  if (o.sticker) { rect(ctx, x + 3, y + 5, 4, 3, '#e04f5f'); rect(ctx, x + 8, y + 5, 4, 3, '#4fa3e0'); }
  return { x, y, w, h };
}
function awning(ctx, x, y, w, c1, c2) {
  for (let i = 0; i < w; i++) {
    const col = Math.floor(i / 6) % 2 ? c2 : c1;
    rect(ctx, x + i, y, 1, 7, col);
    px(ctx, x + i, y + 7 + ((i % 6) < 3 ? 0 : 1), col);
  }
  rect(ctx, x, y, w, 1, shade(c1, 0.15));
  dither(ctx, x, y + 5, w, 2, '#00000044');
}
function signBoard(ctx, x, y, w, h, bg, border) {
  rect(ctx, x - 1, y - 1, w + 2, h + 2, border || P.ink);
  rect(ctx, x, y, w, h, bg);
  rect(ctx, x, y, w, 1, shade(bg, 0.15));
}
const kickplate = (ctx, x, y, w, h, c, r) => { rect(ctx, x, y, w, h, c); grime(ctx, x, y, w, h, '#00000066', r); };

// ---------- facades ----------
export const FACADES = {
  // HARLEM, NYC: walk-up tenement with fire escape, bodega-style front, roll gates, bodega cat
  'north-america'(ctx, x, G, r, items) {
    const top = G - 176;
    brick(ctx, x, top, SW, 176 - 62, ['#7a3326', '#86392a', '#6e2e22', '#8f4030', '#73302a'], '#3d1a14', r);
    rect(ctx, x - 2, top - 4, SW + 4, 5, '#4a2a22'); for (let i = x; i < x + SW; i += 4) rect(ctx, i, top + 1, 2, 2, '#3a1e18');
    for (let f = 0; f < 3; f++) {
      const fy = top + 12 + f * 36;
      for (const wx of [10, 44, 102, 136]) {
        rect(ctx, x + wx - 2, fy - 3, 18, 3, '#b8a890');
        window_(ctx, x + wx, fy, 14, 20, r, { bars: f === 2 && wx === 10 });
        if (r() < 0.35) acUnit(ctx, x + wx + 2, fy + 16, r);
        streaks(ctx, x + wx, fy + 22, 14, 8, '#00000033', r);
      }
    }
    fireEscape(ctx, x + 38, top + 36, 84, 3, 36);
    line(ctx, x + 116, top + 36 + 72, x + 116, G - 66, '#16121a');
    pipe(ctx, x + 2, top, 176 - 62);
    // ground floor shop
    const gf = G - 62;
    rect(ctx, x, gf, SW, 62, '#1c3a2a');
    signBoard(ctx, x + 4, gf + 2, SW - 8, 13, '#f2c230');
    text(ctx, 'UPTOWN THREAD EXCHANGE', x + SW / 2, gf + 5, '#b3201f', { align: 'center', shadow: '#7a4a10' });
    awning(ctx, x + 2, gf + 16, SW - 4, '#1f6b3a', '#f2efe6');
    const holes = [displayWindow(ctx, x + 8, gf + 28, 52, 26, items.slice(0, 2), r), displayWindow(ctx, x + 102, gf + 28, 50, 26, items.slice(2, 4), r)];
    const d = door(ctx, x + 68, G - 44, 26, 44, '#2a5a3a', r, { sticker: true });
    // half-down roll gate over the right window, tagged
    shutter(ctx, x + 100, gf + 26, 54, 12, r);
    rect(ctx, x + 100, gf + 24, 54, 2, '#3c3944');
    kickplate(ctx, x + 6, G - 6, 56, 6, '#18301f', r); kickplate(ctx, x + 98, G - 6, 58, 6, '#18301f', r);
    tag(ctx, x + 10, G - 6, 20, r, '#ffffff');
    // stickers + bodega cat in the window
    rect(ctx, x + 72, G - 40, 13, 7, '#2a5ea8'); text(ctx, 'ATM', x + 73, G - 39, '#fff', { font: 'small' });
    ctx.drawImage(catFrames()[0], x + 46, gf + 45);
    posters(ctx, x + 62, gf + 26, 4, 20, r);
    return { door: d, top, holes: [...holes, [d.x, d.y, d.w, d.h]], neon: [{ x: x + 10, y: gf + 30, c: neonSign('OPEN', P.neonPink, { font: 'small' }) }, { x: x + 104, y: top + 2 - 10, c: neonSign('GRAILS', P.neonCyan, { font: 'small' }), slow: true }] };
  },

  // SCARBOROUGH, TORONTO: strip-plaza unit, backlit sign boxes, slush, "we buy" posters
  canada(ctx, x, G, r, items) {
    const top = G - 104;
    concrete(ctx, x, top, SW, 104, '#9a8e78', ['#8a7e68', '#a89c84', '#7a6e5a'], r, 0.12);
    rect(ctx, x - 2, top - 3, SW + 4, 4, '#6a6050'); rect(ctx, x - 2, top - 4, SW + 4, 1, '#d8d8e0');
    // plaza pylon sign on the roof
    rect(ctx, x + 120, top - 40, 4, 36, '#4a4652');
    signBoard(ctx, x + 104, top - 58, 40, 20, '#f4f4f4');
    text(ctx, 'ROTI', x + 124, top - 55, '#b3201f', { align: 'center', font: 'small' }); text(ctx, 'PATTIES', x + 124, top - 49, '#1a1a1a', { align: 'center', font: 'small' }); text(ctx, 'CELL FIX', x + 124, top - 43, '#2a5ea8', { align: 'center', font: 'small' });
    // backlit box sign
    signBoard(ctx, x + 6, top + 8, SW - 12, 22, '#f6f3ea', '#2a2630');
    dither(ctx, x + 6, top + 8, SW - 12, 22, '#ffffff');
    text(ctx, '6IX SIDE THRIFT', x + SW / 2, top + 11, '#c8102e', { align: 'center', scale: 1, shadow: '#7a0a1a' });
    text(ctx, 'VINTAGE • JERSEYS • GRAILS', x + SW / 2, top + 22, '#1a1a1a', { align: 'center', font: 'small' });
    // neighbour units, shuttered
    shutter(ctx, x + 4, top + 38, 30, G - top - 38, r, { color: '#5e5a66' });
    shutter(ctx, x + 126, top + 38, 30, G - top - 38, r, { color: '#5e5a66' });
    // main glass front
    rect(ctx, x + 36, top + 36, 88, G - top - 36, '#2a2832');
    const holes = [displayWindow(ctx, x + 40, top + 44, 28, 46, items.slice(0, 1), r, { frame: '#9aa0a8' }), displayWindow(ctx, x + 94, top + 44, 26, 46, items.slice(1, 2), r, { frame: '#9aa0a8' })];
    posters(ctx, x + 42, top + 44, 24, 12, r);
    const d = door(ctx, x + 70, G - 46, 22, 46, '#9aa0a8', r, { frame: '#6a707a', glass: '#3a3440' });
    signBoard(ctx, x + 7, top + 44, 24, 9, '#f2c230'); text(ctx, 'WE BUY', x + 19, top + 46, '#1a1a1a', { align: 'center', font: 'small' });
    // dirty slush
    for (let i = 0; i < SW; i++) if (r() < 0.7) rect(ctx, x + i, G - 2 - Math.floor(r() * 3), 1, 3, pick(r, ['#c9c6cf', '#a8a4b0', '#8f8b97']));
    for (let i = x; i < x + SW; i += 7) rect(ctx, i, top, 1, 2 + Math.floor(r() * 4), '#dfe8f2');
    return { door: d, top: top - 58, holes: [...holes, [d.x, d.y, d.w, d.h]], neon: [{ x: x + 98, y: top + 32, c: neonSign('OPEN', P.neonRed, { font: 'small' }) }] };
  },

  // ROCINHA, RIO: stacked raw-brick blocks, hand-painted sign, gato wires, water tank, pichação
  'south-america'(ctx, x, G, r, items) {
    const bricks = ['#b35a32', '#a14f2c', '#c06538', '#9a4a28', '#b86a3e'];
    brick(ctx, x + 6, G - 150, 74, 90, bricks, '#6e3a22', r, 5, 3);
    brick(ctx, x + 80, G - 122, 74, 62, bricks, '#6e3a22', r, 5, 3);
    brick(ctx, x + 30, G - 178, 56, 30, bricks, '#6e3a22', r, 5, 3);
    rect(ctx, x + 80, G - 122, 40, 40, '#e07aa0'); speckle(ctx, x + 80, G - 122, 40, 40, ['#c8648a', '#f09ab8'], 0.1, r);
    for (const [wx, wy] of [[16, -140], [48, -136], [92, -112], [126, -110], [40, -170]]) { window_(ctx, x + wx, G + wy, 12, 12, r, { bars: true, noMullion: true }); }
    rect(ctx, x + 34, G - 186, 18, 8, '#2a6fd0'); rect(ctx, x + 34, G - 186, 18, 1, '#5a9af0'); rect(ctx, x + 36, G - 188, 14, 2, '#2a6fd0');
    for (const rx of [60, 66, 72, 150]) line(ctx, x + rx, G - (rx > 100 ? 122 : 178), x + rx, G - (rx > 100 ? 132 : 188), '#5a3a2a');
    dish(ctx, x + 62, G - 160);
    // laundry line
    wire(ctx, x + 84, G - 126, x + 150, G - 128, 3, '#1a1a1a');
    for (let i = 0; i < 6; i++) rect(ctx, x + 88 + i * 10, G - 126 + (i % 2), 6, 5 + (i % 3), pick(r, ['#ffdf00', '#009739', '#f4f4f4', '#2a5ea8', '#e04f5f']));
    // ground floor: painted plaster, partly fallen off
    rect(ctx, x, G - 60, SW, 60, '#3fa39a'); speckle(ctx, x, G - 60, SW, 60, ['#368f87', '#4ab3a9'], 0.08, r);
    brick(ctx, x + 120, G - 58, 18, 14, bricks, '#6e3a22', r, 5, 3);
    signBoard(ctx, x + 10, G - 58, 98, 16, '#f2eee2', '#1d6b4a');
    text(ctx, 'CASA EXCLUSIVO', x + 59, G - 56, '#1d8a3a', { align: 'center', shadow: '#f4c430' });
    text(ctx, 'ROUPA • BONE • TENIS', x + 59, G - 47, '#c8102e', { align: 'center', font: 'small' });
    // roll-up door, open, clothes hanging inside
    rect(ctx, x + 12, G - 40, 64, 40, '#2a1e22');
    shutter(ctx, x + 12, G - 42, 64, 6, r, { tag: false });
    glow(ctx, x + 44, G - 34, 30, 10, '#f7b95533');
    rect(ctx, x + 14, G - 32, 60, 1, '#8a8a90');
    items.slice(0, 2).forEach((it, i) => ctx.drawImage(itemSprite(it), x + 18 + i * 28, G - 31));
    const holes = [[x + 12, G - 40, 64, 40]];
    const d = door(ctx, x + 92, G - 40, 22, 40, '#d0a040', r);
    // pichação runes
    for (let i = 0; i < 9; i++) { const tx = x + 122 + (i % 5) * 7, ty = G - 40 + Math.floor(i / 5) * 16; line(ctx, tx, ty, tx, ty + 10, '#141218'); line(ctx, tx, ty, tx + 4, ty, '#141218'); if (i % 2) line(ctx, tx + 4, ty, tx + 4, ty + 6, '#141218'); }
    // gato: tangled electrical wires dropping in from a pole cluster
    for (let i = 0; i < 9; i++) wire(ctx, x - 4, G - 150 + i * 3, x + 40 + i * 13, G - 64 - (i % 3) * 30, 4 + i, i % 3 ? '#141218' : '#2a2630');
    grime(ctx, x, G - 12, SW, 12, '#00000066', r);
    return { door: d, top: G - 190, holes: [...holes, [d.x, d.y, d.w, d.h]], neon: [{ x: x + 96, y: G - 48, c: neonSign('ABERTO', P.neonGreen, { font: 'small' }) }] };
  },

  // SAINT-DENIS (93), PARIS: grey HLM tower, satellite dishes on every balcony, TABAC carotte, 93 tags, T-Max
  europe(ctx, x, G, r, items) {
    const top = G - 184;
    concrete(ctx, x, top, SW, 184 - 58, '#8e8c94', ['#7e7c86', '#9a98a2', '#6e6c76'], r, 0.1);
    for (let yy = top; yy < G - 58; yy += 24) rect(ctx, x, yy, SW, 1, '#6e6c76');
    for (let xx = x; xx < x + SW; xx += 32) rect(ctx, xx, top, 1, 184 - 58, '#7a7882');
    for (let f = 0; f < 5; f++) {
      const fy = top + 6 + f * 24;
      for (let k = 0; k < 5; k++) {
        const wx = x + 6 + k * 31;
        window_(ctx, wx, fy, 12, 12, r, { noMullion: true, curtain: pick(r, ['#c8b07a', '#8a3a4a', '#4a6a8a']) });
        if ((f + k) % 2 === 0) { rect(ctx, wx - 3, fy + 12, 18, 1, '#2a2832'); for (let i = 0; i < 18; i += 2) rect(ctx, wx - 3 + i, fy + 8, 1, 4, '#2a2832'); }
        if (r() < 0.45) dish(ctx, wx + 13, fy + 2);
        streaks(ctx, wx, fy + 13, 12, 9, '#00000026', r);
      }
    }
    rect(ctx, x - 2, top - 3, SW + 4, 4, '#5e5c66');
    // ground floor commerce
    const gf = G - 58;
    rect(ctx, x, gf, SW, 58, '#1e1c24');
    signBoard(ctx, x + 6, gf + 3, 112, 13, '#0e0c12', '#3a3844');
    const holes = [displayWindow(ctx, x + 10, gf + 22, 46, 30, items.slice(0, 2), r, { frame: '#3a3844' })];
    const d = door(ctx, x + 64, G - 44, 24, 44, '#2a2832', r, { frame: '#3a3844' });
    shutter(ctx, x + 96, gf + 20, 58, 38, r, { color: '#7a7884' });
    tag(ctx, x + 98, gf + 30, 24, r, '#ffffff'); tag(ctx, x + 124, gf + 40, 26, r, P.neonYellow);
    text(ctx, '93', x + 124, gf + 22, '#f4f4f4', { scale: 2, outline: '#c8102e' });
    // TABAC carotte sticking out
    rect(ctx, x + 152, gf - 2, 6, 2, '#2a2832');
    rect(ctx, x + 154, gf, 2, 1, '#2a2832');
    for (let i = 0; i < 6; i++) rect(ctx, x + 155 - (i < 3 ? i : 5 - i), gf + 1 + i * 2, 2 + (i < 3 ? i : 5 - i) * 2, 2, '#d6332c');
    grime(ctx, x, G - 10, SW, 10, '#00000077', r);
    tag(ctx, x + 8, G - 9, 20, r, P.neonCyan);
    return { door: d, top, holes: [...holes, [d.x, d.y, d.w, d.h], [x + 96, gf + 20, 58, 38]], neon: [{ x: x + 8, y: gf + 3, c: neonSign('BOUTIQUE DU BLOC', P.neonRed) }] };
  },

  // YABA, LAGOS: converted shipping container shop, hand-painted board, zinc awning, generator, louvre windows
  africa(ctx, x, G, r, items) {
    const top = G - 132;
    concrete(ctx, x, top, SW, 132 - 52, '#c9a84a', ['#b8963e', '#d9b85a', '#a88a3a', '#8a7a5a'], r, 0.14);
    rect(ctx, x + 40, top + 20, 60, 30, '#2a6fb0'); speckle(ctx, x + 40, top + 20, 60, 30, ['#245f98', '#3a80c0'], 0.12, r);
    text(ctx, 'NO WAHALA', x + 70, top + 26, '#f4f4f4', { align: 'center', shadow: '#0d2a50' });
    text(ctx, 'AIRTIME • DATA', x + 70, top + 38, P.neonYellow, { align: 'center', font: 'small' });
    for (const wx of [10, 116]) {
      rect(ctx, x + wx - 1, top + 14, 30, 34, '#2a2630');
      for (let j = 0; j < 8; j++) rect(ctx, x + wx, top + 15 + j * 4, 28, 3, j % 2 ? '#7fb3c9' : '#9cc6d8');
      for (let i = x + wx; i < x + wx + 28; i += 3) rect(ctx, i, top + 15, 1, 32, '#1a1a1a');
    }
    rect(ctx, x - 2, top - 3, SW + 4, 4, '#8a7a5a');
    rect(ctx, x + 120, top - 22, 22, 20, '#1a1a1a'); rect(ctx, x + 122, top - 20, 18, 3, '#2a2a2a');
    // painted board over the container
    signBoard(ctx, x + 4, G - 72, 112, 20, '#f4f0e0', '#c8102e');
    text(ctx, 'ODOGWU VINTAGE', x + 60, G - 69, '#1d6b4a', { align: 'center', shadow: '#f4c430' });
    text(ctx, 'ORIGINAL • NO SHAKING', x + 60, G - 59, '#c8102e', { align: 'center', font: 'small' });
    // container
    rect(ctx, x + 4, G - 50, 112, 50, '#b02a2a');
    for (let i = x + 4; i < x + 116; i += 3) rect(ctx, i, G - 50, 1, 50, '#8a1f1f');
    rect(ctx, x + 4, G - 50, 112, 2, '#d04040');
    rect(ctx, x + 30, G - 46, 60, 46, '#1e1418');
    glow(ctx, x + 60, G - 40, 26, 10, '#f7b95533');
    rect(ctx, x + 32, G - 40, 56, 1, '#8a8a90');
    items.slice(0, 2).forEach((it, i) => ctx.drawImage(itemSprite(it), x + 36 + i * 26, G - 39));
    const d = { x: x + 52, y: G - 46, w: 16, h: 46 };
    // zinc awning on poles
    for (let i = 0; i < SW - 2; i++) rect(ctx, x + i, G - 54 + Math.floor(i / 40), 1, 3, i % 4 ? '#9a98a2' : '#7a7882');
    rect(ctx, x + 2, G - 52, 2, 52, '#5a3a24'); rect(ctx, x + 154, G - 50, 2, 50, '#5a3a24');
    // generator + jerry cans
    rect(ctx, x + 124, G - 16, 20, 14, '#e0b020'); rect(ctx, x + 124, G - 16, 20, 2, '#f0c840'); rect(ctx, x + 127, G - 12, 8, 6, '#2a2630'); rect(ctx, x + 140, G - 22, 2, 6, '#2a2630');
    rect(ctx, x + 146, G - 10, 6, 10, '#d6332c'); rect(ctx, x + 152, G - 10, 6, 10, '#2a6fd0');
    grime(ctx, x, G - 8, SW, 8, '#00000066', r);
    return { door: d, top: top - 22, holes: [[x + 30, G - 46, 60, 46]], neon: [{ x: x + 34, y: G - 50, c: tube('#dff8ff', 52) , tube: true }], smoke: { x: x + 141, y: G - 24 } };
  },

  // SHINJUKU, TOKYO: stacked sign boxes, AC units, vending machines, chochin lanterns, 古着 neon
  asia(ctx, x, G, r, items) {
    const top = G - 180;
    rect(ctx, x, top, SW, 180 - 56, '#34343f');
    for (let yy = top; yy < G - 56; yy += 6) for (let xx = x + ((yy / 6) % 2) * 3; xx < x + SW; xx += 6) rect(ctx, xx, yy, 5, 5, pick(r, ['#3a3a46', '#30303a', '#383844']));
    for (let f = 0; f < 4; f++) {
      const fy = top + 10 + f * 30;
      for (const wx of [8, 40, 72]) window_(ctx, x + wx, fy, 22, 14, r, { noMullion: true, curtain: '#d8d0c0' });
      acUnit(ctx, x + 10 + f * 7, fy + 18, r); acUnit(ctx, x + 60, fy + 18, r);
    }
    // vertical stack of sign boxes
    const signs = [['#f4f4f4', '#c8102e'], ['#ffe14d', '#1a1a1a'], ['#39f0ff', '#1a1a1a'], ['#ff3fa4', '#ffffff'], ['#7dff6a', '#1a1a1a'], ['#f4f4f4', '#2a5ea8']];
    signs.forEach(([bg, fg], i) => {
      const sy = top + 8 + i * 20;
      signBoard(ctx, x + 108, sy, 46, 16, bg);
      for (let k = 0; k < 4; k++) { const gx = x + 112 + k * 10; rect(ctx, gx, sy + 3, 7, 1, fg); rect(ctx, gx + 3, sy + 3, 1, 9, fg); rect(ctx, gx, sy + 7, 7, 1, fg); if ((i + k) % 2) rect(ctx, gx, sy + 11, 7, 1, fg); }
    });
    pipe(ctx, x + 102, top, 180 - 56);
    // ground floor
    const gf = G - 56;
    rect(ctx, x, gf, SW, 56, '#201c22');
    signBoard(ctx, x + 4, gf + 2, 100, 12, '#120e14', '#3a3844');
    const holes = [displayWindow(ctx, x + 6, gf + 20, 30, 32, items.slice(0, 1), r, { frame: '#3a2a22' })];
    shutter(ctx, x + 40, gf + 16, 30, 16, r, { tag: true });
    const d = door(ctx, x + 42, G - 40, 26, 40, '#5a3a24', r);
    for (let i = 0; i < 3; i++) { rect(ctx, x + 42 + i * 9, G - 40, 8, 16, '#23356b'); px(ctx, x + 45 + i * 9, G - 34, '#f4f4f4'); }
    // vending machines
    for (const vx of [76, 96]) {
      rect(ctx, x + vx, G - 40, 18, 40, vx === 76 ? '#d6332c' : '#2a6fd0'); rect(ctx, x + vx + 2, G - 37, 14, 18, '#e8f4ff');
      for (let j = 0; j < 3; j++) for (let k = 0; k < 4; k++) rect(ctx, x + vx + 3 + k * 3, G - 35 + j * 6, 2, 4, pick(r, ['#f4c430', '#7dff6a', '#ff3fa4', '#39f0ff', '#f4f4f4']));
      rect(ctx, x + vx + 4, G - 12, 10, 3, '#1a1a1a');
    }
    // lanterns
    for (const lx of [118, 136, 150]) { rect(ctx, x + lx + 2, gf + 14, 1, 4, '#1a1a1a'); rect(ctx, x + lx, gf + 18, 6, 8, '#e0302a'); rect(ctx, x + lx, gf + 18, 6, 1, '#1a1a1a'); rect(ctx, x + lx, gf + 25, 6, 1, '#1a1a1a'); px(ctx, x + lx + 2, gf + 21, '#ffd57a'); }
    trashBags(ctx, x + 120, G, 4, r);
    grime(ctx, x, G - 8, SW, 8, '#00000066', r);
    return { door: d, top, holes: [...holes, [d.x, d.y, d.w, d.h]], neon: [{ x: x + 6, y: gf + 2, c: neonSign('URA-HARA STASH', P.neonCyan) }, { x: x + 118, y: gf + 30, c: glyphNeon('古着', P.neonPink, 12) }] };
  },

  // MOUNT DRUITT, WESTERN SYDNEY: verandah shop strip, tan brick, roller door, dumped trolley
  oceania(ctx, x, G, r, items) {
    const top = G - 112;
    brick(ctx, x, top, SW, 112, ['#c8a070', '#b8905e', '#d4ac7c', '#a88250'], '#7a6040', r);
    rect(ctx, x - 2, top - 6, SW + 4, 7, '#d8d4dc'); for (let i = x; i < x + SW; i += 3) rect(ctx, i, top - 6, 1, 7, '#b8b4c0');
    signBoard(ctx, x + 6, top + 6, SW - 12, 26, '#1d3f8f', '#f4c430');
    text(ctx, 'WESTIE GRAILS', x + SW / 2, top + 9, '#f4c430', { align: 'center', scale: 1, shadow: '#0a1a40' });
    text(ctx, 'TNS • POLOS • TRACKIES', x + SW / 2, top + 20, '#f4f4f4', { align: 'center', font: 'small' });
    window_(ctx, x + 14, top + 40, 22, 14, r); window_(ctx, x + 124, top + 40, 22, 14, r);
    // verandah on posts
    rect(ctx, x, G - 64, SW, 4, '#e9e9ee'); for (let i = x; i < x + SW; i += 4) rect(ctx, i, G - 60, 2, 2, '#a8a4b0');
    rect(ctx, x + 4, G - 60, 2, 60, '#e9e9ee'); rect(ctx, x + 154, G - 60, 2, 60, '#e9e9ee');
    const holes = [displayWindow(ctx, x + 10, G - 50, 52, 40, items.slice(0, 2), r, { frame: '#e9e9ee' })];
    const d = door(ctx, x + 70, G - 46, 22, 46, '#d8d4dc', r, { frame: '#a8a4b0', glass: '#2a3a4a' });
    shutter(ctx, x + 100, G - 50, 52, 50, r, { color: '#c9c6cf', groove: '#aaa6b2' });
    signBoard(ctx, x + 104, G - 46, 44, 9, '#f4f4f4'); text(ctx, 'CASH 4 KICKS', x + 126, G - 44, '#c8102e', { align: 'center', font: 'small' });
    // dumped shopping trolley + milk crate
    const tx = x + 132;
    for (let j = 0; j < 10; j += 2) line(ctx, tx, G - 16 + j, tx + 16, G - 16 + j, '#9a98a2');
    for (let i = 0; i < 17; i += 3) line(ctx, tx + i, G - 16, tx + i + 1, G - 6, '#9a98a2');
    rect(ctx, tx - 2, G - 18, 2, 6, '#c8102e'); px(ctx, tx + 2, G - 2, '#1a1a1a'); px(ctx, tx + 14, G - 2, '#1a1a1a');
    rect(ctx, x + 112, G - 9, 12, 9, '#2a5ea8'); for (let i = 0; i < 12; i += 3) rect(ctx, x + 112 + i, G - 7, 2, 5, '#1d4a88');
    grime(ctx, x, G - 8, SW, 8, '#00000055', r);
    tag(ctx, x + 102, G - 30, 26, r, P.neonPink);
    return { door: d, top: top - 6, holes: [...holes, [d.x, d.y, d.w, d.h]], neon: [{ x: x + 16, y: G - 58, c: neonSign('OPEN', P.neonYellow, { font: 'small' }) }] };
  },
};

// Fluorescent tube (Lagos awning light)
function tube(color, w) {
  const [c, ctx] = canvas(w + 4, 5);
  ctx.globalAlpha = 0.3; rect(ctx, 0, 0, w + 4, 5, color); ctx.globalAlpha = 1;
  rect(ctx, 2, 2, w, 1, '#ffffff');
  return c;
}

// Plywood hoarding, scaffolding, tape and cones for any region with no stock
export function construction(ctx, x, G, f, store, r) {
  const top = f.top + 16;
  ctx.fillStyle = '#7d828c';
  for (const sx of [x + 6, x + 56, x + 104, x + 152]) rect(ctx, sx, top, 2, G - top, '#7d828c');
  for (let yy = top + 10; yy < G - 40; yy += 26) { rect(ctx, x + 4, yy, SW - 8, 2, '#7d828c'); rect(ctx, x + 4, yy + 2, SW - 8, 2, '#a8763e'); line(ctx, x + 8, yy + 24, x + 54, yy + 4, '#5d616b'); line(ctx, x + 106, yy + 24, x + 150, yy + 4, '#5d616b'); }
  // hoarding
  for (let i = 0; i < SW; i += 20) { rect(ctx, x + i, G - 40, 19, 40, i % 40 ? '#c89a5a' : '#b88a4a'); speckle(ctx, x + i, G - 40, 19, 40, ['#a8763e', '#d8aa6a'], 0.08, r); }
  posters(ctx, x + 4, G - 36, 40, 20, r);
  tag(ctx, x + 110, G - 30, 30, r);
  signBoard(ctx, x + 50, G - 36, 60, 22, '#f6c42b');
  text(ctx, 'UNDER', x + 80, G - 34, '#1a1a1a', { align: 'center' });
  text(ctx, 'CONSTRUCTION', x + 80, G - 25, '#1a1a1a', { align: 'center', font: 'small' });
  signBoard(ctx, x + 46, G - 12, 68, 8, '#f4f4f4');
  text(ctx, `NO ${store.region.toUpperCase()} STOCK YET`, x + 80, G - 11, '#c8102e', { align: 'center', font: 'small' });
  for (let i = 0; i < SW; i += 2) { px(ctx, x + i, G - 42 + Math.round(Math.sin(i / 9) * 2), i % 8 < 4 ? '#f6c42b' : '#1a1a1a'); px(ctx, x + i, G - 43 + Math.round(Math.sin(i / 9) * 2), i % 8 < 4 ? '#f6c42b' : '#1a1a1a'); }
  for (const cx of [x + 30, x + 132]) { rect(ctx, cx, G - 10, 8, 10, '#ff7a1a'); rect(ctx, cx + 2, G - 14, 4, 4, '#ff7a1a'); rect(ctx, cx + 1, G - 7, 6, 2, '#f4f4f4'); rect(ctx, cx - 2, G - 1, 12, 1, '#c85a10'); }
}

// ---------- Booster Corner: a van backed into the alley, rear doors open, trunk full of rare pieces ----------
// Van rear in local space: body from bx..bx+bw, roof at top, bumper at bottom. Shared by the street and the close-up.
export function vanRear(ctx, bx, top, bw, bh, r, items, o = {}) {
  const body = '#d6d2dc', bodyDk = '#aaa6b4', bottom = top + bh;
  const doorW = Math.round(bw * 0.16);
  // open rear doors swung outward
  for (const [dx, dir] of [[bx - doorW, -1], [bx + bw, 1]]) {
    for (let j = 0; j < bh - 6; j++) {
      const skew = Math.round((j / bh) * 2) * dir;
      rect(ctx, dx + skew, top + 3 + j, doorW, 1, j < (bh - 6) * 0.42 ? '#5a6a7a' : bodyDk);
    }
    rect(ctx, dx + (dir < 0 ? 0 : doorW - 1), top + 3, 1, bh - 6, '#7a7686');
    if (o.big) rect(ctx, dx + 2, top + Math.round(bh * 0.5), doorW - 4, 2, '#5d5966');
  }
  // body shell
  rect(ctx, bx, top, bw, bh, body);
  rect(ctx, bx + 1, top, bw - 2, 1, '#eeeaf4');
  speckle(ctx, bx, top, bw, bh, ['#bcb8c6', '#9a96a4', '#8a5a3a'], o.big ? 0.05 : 0.08, r);
  // trunk interior
  const ix = bx + Math.max(3, Math.round(bw * 0.06)), iy = top + Math.max(3, Math.round(bh * 0.07));
  const iw = bw - (ix - bx) * 2, ih = Math.round(bh * 0.72);
  rect(ctx, ix, iy, iw, ih, '#1c141c');
  for (let x = ix + 3; x < ix + iw; x += o.big ? 6 : 4) rect(ctx, x, iy, 1, ih, '#251a26');
  glow(ctx, bx + bw / 2, iy + 2, Math.round(iw * 0.45), Math.round(ih * 0.55), '#ffe9a01c');
  rect(ctx, bx + bw / 2 - (o.big ? 6 : 3), iy, o.big ? 12 : 6, o.big ? 2 : 1, '#fff3b0');
  // rail of hanging pieces
  const rail = iy + (o.big ? 6 : 3);
  rect(ctx, ix + 2, rail, iw - 4, 1, '#8a8a92');
  const hang = items.slice(0, o.big ? 4 : 2);
  const step = (iw - 4) / hang.length;
  hang.forEach((it, i) => {
    const sx = Math.round(ix + 2 + step * i + step / 2 - 12);
    if (o.big) { line(ctx, sx + 12, rail, sx + 12, rail + 2, '#c9c6cf'); ctx.drawImage(itemSprite(it), sx, rail + 1); }
    else { ctx.drawImage(itemSprite(it), sx + 2, rail + 1, 20, 20); }
  });
  // floor of the trunk: shoeboxes, gold chains, a watch box
  const fl = iy + ih;
  rect(ctx, ix, fl - 1, iw, 1, '#3a2a30');
  const box = (x, w, h, c) => { rect(ctx, x, fl - h, w, h, c); rect(ctx, x, fl - h, w, 1, shade(c, 0.2)); rect(ctx, x + 1, fl - h + 2, w - 2, 1, '#f4f4f4'); };
  if (o.big) {
    box(ix + 4, 16, 9, '#e04f2f'); box(ix + 6, 14, 7, '#f4f4f4'); box(ix + 22, 16, 10, '#1a1a1a'); box(ix + iw - 26, 18, 9, '#f29a2e');
    const sneaker = items.find((i) => i.type === 'sneaker');
    if (sneaker) ctx.drawImage(itemSprite(sneaker), ix + 38, fl - 24);
    for (let k = 0; k < 4; k++) for (let i = 0; i < 9; i++) px(ctx, ix + iw - 46 + i + (k % 2), fl - 3 - k - Math.round(Math.sin(i / 1.4) * 1.5), k % 2 ? '#c8922a' : '#f2c14e');
    rect(ctx, ix + iw - 34, fl - 8, 8, 6, '#3a2418'); rect(ctx, ix + iw - 33, fl - 7, 6, 3, '#f2c14e'); px(ctx, ix + iw - 30, fl - 6, '#ffffff');
  } else {
    box(ix + 2, 8, 5, '#e04f2f'); box(ix + 11, 8, 6, '#1a1a1a'); box(ix + iw - 10, 8, 5, '#f29a2e');
    for (let i = 0; i < 6; i++) px(ctx, ix + iw - 18 + i, fl - 2 - (i % 2), '#f2c14e');
  }
  // tail lights, bumper, plate, wheels
  const tl = o.big ? 4 : 2;
  for (const tx of [bx, bx + bw - tl]) { rect(ctx, tx, top + Math.round(bh * 0.3), tl, Math.round(bh * 0.3), '#e0302a'); rect(ctx, tx, top + Math.round(bh * 0.3), tl, 1, '#ff8a80'); glow(ctx, tx + tl / 2, top + Math.round(bh * 0.45), tl * 3, Math.round(bh * 0.2), '#ff302a22'); }
  const bumpH = o.big ? 7 : 4;
  rect(ctx, bx - 1, bottom - bumpH, bw + 2, bumpH, '#2a2830'); rect(ctx, bx - 1, bottom - bumpH, bw + 2, 1, '#4a4652');
  if (o.big) {
    rect(ctx, bx + bw / 2 - 18, bottom - bumpH - 9, 36, 11, '#f4f4f4'); rect(ctx, bx + bw / 2 - 18, bottom - bumpH - 9, 36, 2, '#2a5ea8');
    text(ctx, 'BOOST', bx + bw / 2, bottom - bumpH - 6, '#1a1a1a', { align: 'center' });
  } else {
    rect(ctx, bx + bw / 2 - 10, bottom - bumpH - 6, 20, 7, '#f4f4f4');
    text(ctx, 'BOOST', bx + bw / 2, bottom - bumpH - 5, '#1a1a1a', { align: 'center', font: 'small' });
  }
  const wh = o.big ? 10 : 6;
  for (const wx of [bx + 4, bx + bw - 4 - wh * 1.4]) rect(ctx, wx, bottom, Math.round(wh * 1.4), wh, '#111015');
  tag(ctx, bx + 4, top + bh - (o.big ? 30 : 16), Math.min(26, bw - 10), r, P.neonPink);
  return { trunk: { x: bx + bw / 2, y: iy + ih / 2 } };
}

export function paintBoosterCorner(ctx, x, G, r, items) {
  const W = ALLEY_W;
  brick(ctx, x, G - 150, W, 150, ['#3a2a34', '#342630', '#40303a', '#2e222a'], '#1e161c', r, 6, 3);
  dither(ctx, x, G - 150, W, 150, '#0a060e');
  for (let j = 0; j < 150; j++) { const w = Math.max(0, 10 - Math.floor(j / 15)); rect(ctx, x, G - 150 + j, w, 1, '#120c14'); rect(ctx, x + W - w, G - 150 + j, w, 1, '#120c14'); }
  for (let i = 0; i < W - 20; i += 3) { line(ctx, x + 10 + i, G - 76, x + 13 + i, G - 50, '#5d5b68'); line(ctx, x + 13 + i, G - 76, x + 10 + i, G - 50, '#5d5b68'); }
  for (let i = 0; i < W - 20; i += 4) { px(ctx, x + 10 + i, G - 79, '#9d9ba8'); px(ctx, x + 12 + i, G - 78, '#9d9ba8'); }
  text(ctx, 'BOOSTER', x + W / 2, G - 128, '#b45cff', { align: 'center', outline: '#120c14' });
  text(ctx, 'CORNER', x + W / 2, G - 118, '#f2c14e', { align: 'center', outline: '#120c14' });
  for (const [dx, len] of [[-18, 5], [-4, 8], [10, 4], [20, 6]]) rect(ctx, x + W / 2 + dx, G - 120, 1, len, '#b45cff');
  text(ctx, '$', x + W - 18, G - 100, '#f2c14e', { scale: 2, outline: '#120c14' });
  rect(ctx, x + W / 2, G - 150, 1, 46, '#1a1a1a'); rect(ctx, x + W / 2 - 1, G - 104, 3, 3, '#ffe9a0');
  glow(ctx, x + W / 2, G - 50, 34, 52, '#ffe9a01c');
  rect(ctx, x, G - 6, W, 6, '#1e1a22'); dither(ctx, x, G - 6, W, 6, '#2a2630');
  trashBags(ctx, x + 4, G, 2, r);
  const van = vanRear(ctx, x + 30, G - 62, 58, 54, r, items);
  rect(ctx, x + 26, G - 8, 66, 2, '#0a080c');
  return {
    neon: [{ x: x - 30, y: G - 150, c: neonSign('BOOSTER >', P.neonPink, { bg: '#120c14' }) }],
    steam: { x: x + 8, y: G - 4 },
    cat: { x: x + 50, y: G - 71 },
    booster: { x: x + 14, y: G + 7 },
    trunk: van.trunk,
  };
}

// ---------- Corner buildings + street furniture ----------
export function paintCorner(ctx, x, G, r, end) {
  const W = 120, top = G - 112;
  brick(ctx, x, top, W, 112, ['#5a3a3a', '#643f3f', '#523434', '#6a4444'], '#2e1e1e', r);
  for (let f = 0; f < 2; f++) for (const wx of [12, 46, 80]) { window_(ctx, x + wx, top + 12 + f * 28, 16, 18, r); if (r() < 0.3) acUnit(ctx, x + wx + 3, top + 26 + f * 28, r); }
  rect(ctx, x - 2, top - 3, W + 4, 4, '#3a2626');
  if (!end) {
    // rooftop billboard
    rect(ctx, x + 14, top - 52, 2, 50, '#3a3844'); rect(ctx, x + 98, top - 52, 2, 50, '#3a3844');
    signBoard(ctx, x + 2, top - 74, 116, 30, '#f4efe2');
    text(ctx, 'SMOKE THE', x + 60, top - 71, '#c8102e', { align: 'center', shadow: '#5a0a10' });
    text(ctx, 'CRACK', x + 60, top - 63, '#c8102e', { align: 'center', scale: 1, shadow: '#5a0a10' });
    text(ctx, 'GLOBAL RESELL BLOCK', x + 60, top - 53, '#1a1a1a', { align: 'center', font: 'small' });
    rect(ctx, x, G - 50, W, 50, '#1a1620');
    signBoard(ctx, x + 6, G - 48, 70, 10, '#120e14'); text(ctx, 'PAWN • GOLD', x + 41, G - 46, P.neonYellow, { align: 'center', font: 'small' });
    window_(ctx, x + 8, G - 34, 40, 24, r, { bars: true, lit: true });
    shutter(ctx, x + 56, G - 36, 56, 36, r);
  } else {
    rect(ctx, x, G - 50, W, 50, '#1a1a24');
    signBoard(ctx, x + 6, G - 48, 108, 10, '#120e14');
    for (let i = 0; i < 4; i++) { rect(ctx, x + 10 + i * 26, G - 32, 20, 20, '#c9c6cf'); rect(ctx, x + 14 + i * 26, G - 28, 12, 12, '#2a4a6a'); rect(ctx, x + 16 + i * 26, G - 26, 8, 8, '#4a7aa8'); }
    signBoard(ctx, x + 30, top - 30, 60, 26, '#2a6f3a'); text(ctx, 'SMOKE ST', x + 60, top - 26, '#f4f4f4', { align: 'center' }); text(ctx, 'END OF BLOCK', x + 60, top - 16, '#f4f4f4', { align: 'center', font: 'small' }); rect(ctx, x + 59, top - 4, 2, 4, '#3a3844');
  }
  grime(ctx, x, G - 8, W, 8, '#00000066', r);
  return { w: W, neon: end ? [{ x: x + 10, y: G - 48, c: neonSign('WASH & FOLD 24H', P.neonCyan, { font: 'small' }) }] : [] };
}

export function lampPost(ctx, x, curb) {
  rect(ctx, x, curb - 96, 2, 96, '#2a2a34'); rect(ctx, x - 1, curb - 4, 4, 4, '#2a2a34');
  rect(ctx, x, curb - 96, 14, 2, '#2a2a34'); rect(ctx, x + 10, curb - 95, 8, 3, '#3a3a44'); rect(ctx, x + 11, curb - 92, 6, 1, '#ffcf6a');
}
export function lampPools(ctx, x, curb, G) {
  glow(ctx, x + 14, curb - 6, 22, 7, '#ffb04a1c');
  glow(ctx, x + 14, G + 10, 26, 10, '#ffb04a22');
}
export function hydrant(ctx, x, y) {
  rect(ctx, x, y - 10, 6, 10, '#c8302a'); rect(ctx, x - 2, y - 7, 10, 2, '#a02420'); rect(ctx, x + 1, y - 12, 4, 2, '#c8302a'); rect(ctx, x - 1, y - 1, 8, 1, '#7a1a16'); px(ctx, x + 1, y - 9, '#e85a50');
}
export function trashCan(ctx, x, y, r) {
  rect(ctx, x, y - 13, 10, 13, '#3a4a3e'); for (let i = 1; i < 10; i += 3) rect(ctx, x + i, y - 12, 1, 11, '#2a362c');
  rect(ctx, x - 1, y - 14, 12, 2, '#2a362c');
  for (let i = 0; i < 6; i++) px(ctx, x + 1 + Math.floor(r() * 9), y - 15 - Math.floor(r() * 3), pick(r, ['#f4f4f4', '#d6332c', '#f4c430', '#7a5a3a']));
}
export function payphone(ctx, x, y) {
  rect(ctx, x, y - 34, 2, 34, '#5d5b68'); rect(ctx, x - 4, y - 34, 10, 14, '#7a7a86'); rect(ctx, x - 3, y - 33, 8, 3, '#2a5ea8'); rect(ctx, x - 2, y - 28, 6, 7, '#2a2a34'); px(ctx, x + 4, y - 26, '#d8d4de');
}
export function newsBox(ctx, x, y, c) {
  rect(ctx, x, y - 14, 10, 14, c); rect(ctx, x + 1, y - 12, 8, 5, '#d8d4de'); rect(ctx, x + 1, y - 1, 2, 1, '#1a1a1a'); rect(ctx, x + 7, y - 1, 2, 1, '#1a1a1a');
}
export function pole(ctx, x, curb) {
  rect(ctx, x, curb - 176, 3, 176, '#4a3424'); rect(ctx, x + 1, curb - 176, 1, 176, '#5a4030');
  rect(ctx, x - 8, curb - 166, 19, 2, '#4a3424'); rect(ctx, x - 6, curb - 154, 15, 2, '#4a3424');
  rect(ctx, x - 6, curb - 162, 2, 3, '#9d9ba8'); rect(ctx, x + 7, curb - 162, 2, 3, '#9d9ba8');
  rect(ctx, x + 4, curb - 146, 6, 8, '#5d5b68');
}
export { outline };
