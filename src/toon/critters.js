// Animals and traffic, drawn with the same bold cartoon contour as the people.
import { K, C, layer, rect, rrect, oval, poly, blob, line, tube, text, FONT, shade, mix } from './toon.js';

const OUT = 0.95, IN = 0.5;

export function pigeonFrames(R) {
  const body = '#a8a4c4', wing = '#8a86a6', neck = '#7a5ab0';
  const make = (mode) => {
    const [c, ctx] = layer(16, 13, R);
    ctx.translate(2, 2);
    if (mode >= 2) {
      const up = mode === 2;
      poly(ctx, up ? [[3, 4], [0.6, -1.8], [6.4, 3.4]] : [[3, 4.6], [0.6, 9.4], [6.4, 5]], wing, OUT, 0.6);
      oval(ctx, 5.2, 4.8, 4.3, 2.4, body, OUT);
      oval(ctx, 9.2, 3.4, 2, 1.8, body, OUT);
      oval(ctx, 9.8, 2.9, 0.9, 1, '#ffffff', IN); oval(ctx, 10.1, 3, 0.4, 0.45, K, 0);
      poly(ctx, [[10.9, 3.4], [12.6, 3.9], [10.9, 4.4]], '#f2a33a', IN);
      poly(ctx, up ? [[5, 4], [8, -2.6], [8.4, 3.6]] : [[5, 5.2], [8.4, 10.6], [8.4, 5.2]], shade(wing, 0.06), OUT, 0.6);
      return c;
    }
    const peck = mode === 1;
    oval(ctx, 4.8, 5.6, 4.1, 2.8, body, OUT);
    poly(ctx, [[1.2, 4.8], [-1.2, 4.2], [-0.8, 6.8], [1.2, 6.6]], wing, OUT);
    oval(ctx, 4, 5.2, 2.6, 1.7, wing, IN);
    for (let i = 0; i < 2; i++) line(ctx, [[2.6 + i * 1.6, 5.8], [3.6 + i * 1.6, 6.4]], IN);
    const hx = peck ? 8.8 : 7.8, hy = peck ? 6.6 : 2.6;
    tube(ctx, [[6.8, 4.6], [hx - 0.4, hy + 1]], 2.2, neck, OUT);
    oval(ctx, hx, hy, 1.9, 1.8, body, OUT);
    oval(ctx, hx + 0.5, hy - 0.4, 0.95, 1.05, '#ffffff', IN);
    oval(ctx, hx + 0.8, hy - 0.3, 0.4, 0.45, K, 0);
    poly(ctx, [[hx + 1.6, hy + 0.1], [hx + 3.2, hy + 0.7], [hx + 1.6, hy + 1]], '#f2a33a', IN);
    line(ctx, [[4, 8.2], [3.6, 9.6], [2.8, 9.8]], 0.7, '#ff7aa0'); line(ctx, [[5.6, 8.2], [5.8, 9.6], [6.6, 9.8]], 0.7, '#ff7aa0');
    return c;
  };
  return [make(0), make(1), make(2), make(3)];
}

export function catFrames(R) {
  return [0, 1].map((k) => {
    const [c, ctx] = layer(20, 16, R);
    ctx.translate(1, 1);
    const fur = '#7a6a9a';
    tube(ctx, k ? [[3, 10], [0.6, 6.4], [1.6, 2.4]] : [[3, 10], [0.4, 11.2], [-0.2, 8]], 2, fur, OUT);
    oval(ctx, 6.6, 9.6, 4.6, 3.6, fur, OUT);
    for (let i = 0; i < 3; i++) line(ctx, [[4.4 + i * 1.8, 7], [4.8 + i * 1.8, 8.6]], IN, shade(fur, -0.25));
    oval(ctx, 11.4, 6, 3.6, 3.2, fur, OUT);
    poly(ctx, [[8.8, 4.6], [8.8, 0.8], [10.8, 3.4]], fur, OUT);
    poly(ctx, [[12.2, 3.2], [14, 0.4], [14.4, 4]], fur, OUT);
    poly(ctx, [[9.4, 3.6], [9.4, 2], [10.2, 3.2]], '#ff9ab8', 0);
    oval(ctx, 10.4, 5.6, 1.5, 1.7, C.yellow, IN);
    oval(ctx, 13.2, 5.6, 1.5, 1.7, C.yellow, IN);
    oval(ctx, 10.6, 5.8, 0.35, 1.1, K, 0);
    oval(ctx, 13.4, 5.8, 0.35, 1.1, K, 0);
    line(ctx, [[9, 4.2], [11.6, 4.8]], 0.8); line(ctx, [[12.4, 4.8], [14.6, 4.2]], 0.8);
    oval(ctx, 12, 7.6, 0.8, 0.6, '#ff8aa8', IN);
    line(ctx, [[12, 8.2], [11.4, 9], [12.6, 9]], IN);
    line(ctx, [[13.6, 7.8], [17, 7]], 0.35); line(ctx, [[13.6, 8.4], [17, 8.8]], 0.35);
    oval(ctx, 4.4, 12.6, 1.6, 1, fur, OUT); oval(ctx, 9, 12.8, 1.6, 1, fur, OUT);
    return c;
  });
}

// the sleeping stoop dog: droopy hound, belly rises and falls
export function dogFrames(R) {
  return [0, 1].map((k) => {
    const [c, ctx] = layer(34, 17, R);
    ctx.translate(1, 1);
    const fur = '#c8742e', spot = '#8a4a1a';
    tube(ctx, [[3, 11], [0.4, 9]], 2, fur, OUT);
    blob(ctx, [[3, 14], [3.4, 8.2 - k * 0.9], [10, 6.2 - k * 0.9], [19, 7 - k * 0.7], [22, 14]], fur, OUT);
    oval(ctx, 9, 9.6 - k * 0.5, 2.6, 1.8, spot, 0);
    oval(ctx, 15, 8.8 - k * 0.4, 1.6, 1.2, spot, 0);
    oval(ctx, 25, 10.6, 5, 4, fur, OUT);
    oval(ctx, 29.6, 12.2, 2.8, 2.1, mix(fur, '#ff8a6a', 0.2), OUT);
    oval(ctx, 31.4, 11.6, 0.9, 0.8, K, 0);
    line(ctx, [[29, 14], [30.4, 14.4]], IN);
    blob(ctx, [[22.4, 8.4], [20.2, 10], [20.8, 15.4], [23.2, 15], [24, 10]], spot, OUT);
    line(ctx, [[25.4, 9.6], [27.8, 9.8]], 0.8, K, true);
    line(ctx, [[25.6, 8.2], [27.6, 7.8]], IN);
    oval(ctx, 24, 14.6, 3.4, 1.4, fur, OUT);
    oval(ctx, 14.6, 14.6, 3.6, 1.4, fur, OUT);
    for (const tx of [21.6, 22.8, 12.4, 13.6]) line(ctx, [[tx, 13.8], [tx, 15.2]], IN);
    rect(ctx, 18.4, 7, 2, 6.6, C.red, IN);
    oval(ctx, 19.4, 14.2, 1, 1, C.gold, IN);
    return c;
  });
}

// ---------- cars: bubbly cartoon bodies ----------
const CAR_TYPES = ['sedan', 'taxi', 'lowrider', 'van', 'danfo', 'hatch'];
export const carType = (r) => CAR_TYPES[Math.floor(r() * CAR_TYPES.length)];
export function carFrames(type, color, R, dir = 1) {
  const W = type === 'van' || type === 'danfo' ? 64 : type === 'lowrider' ? 70 : type === 'hatch' ? 50 : 60;
  const body = type === 'taxi' ? C.yellow : type === 'danfo' ? '#ffc21a' : color;
  const L = 1.1;
  const make = (spin) => {
    const [c, ctx] = layer(W + 4, 32, R);
    ctx.translate(2, 2);
    const low = type === 'lowrider' ? 2.4 : 0;
    if (type === 'van' || type === 'danfo') {
      poly(ctx, [[2, 22], [1.6, 6], [5, 2], [W - 16, 2], [W - 6, 11], [W - 1, 13], [W - 1, 22]], body, L, 3);
      for (let x = 6; x < W - 20; x += 12) { rrect(ctx, x, 5, 9, 6.4, 1.6, C.glass, 0.7); line(ctx, [[x + 2, 9.6], [x + 4.4, 6.4]], 0.7, '#ffffff'); }
      poly(ctx, [[W - 15, 4.6], [W - 7.4, 11.4], [W - 15, 11.4]], C.glass, 0.7, 1);
      if (type === 'danfo') { rect(ctx, 2, 14, W - 3, 1.6, K, 0); rect(ctx, 2, 17.4, W - 3, 1.2, K, 0); }
    } else {
      const cab = type === 'hatch' ? [[12, 11], [17, 3], [W - 14, 3], [W - 8, 11]] : [[13, 12 - low], [19, 4 - low], [W - 22, 4 - low], [W - 13, 12 - low]];
      poly(ctx, [[1, 22 - low], [1, 14 - low], [6, 11.4 - low], ...cab, [W - 2, 12.6 - low], [W, 16 - low], [W, 22 - low]], body, L, 3);
      const g = cab, mx = (g[1][0] + g[2][0]) / 2;
      poly(ctx, [[g[0][0] + 3, g[0][1] - 0.4], [g[1][0] + 1.4, g[1][1] + 1.4], [mx - 1, g[1][1] + 1.4], [mx - 1, g[0][1] - 0.4]], C.glass, 0.7, 1);
      poly(ctx, [[mx + 1, g[0][1] - 0.4], [mx + 1, g[2][1] + 1.4], [g[2][0] - 0.6, g[2][1] + 1.4], [g[3][0] - 2.6, g[3][1] - 0.4]], C.glass, 0.7, 1);
      line(ctx, [[g[1][0] + 3, g[1][1] + 3.4], [g[1][0] + 6, g[1][1] + 2]], 0.8, '#ffffff');
      line(ctx, [[mx + 3, g[2][1] + 4], [mx + 6, g[2][1] + 2.4]], 0.8, '#ffffff');
      if (type === 'taxi') { rrect(ctx, W / 2 - 7, -1.4, 12, 4, 1, '#ffffff', 0.7); for (let x = 4; x < W - 4; x += 4) rect(ctx, x, 15.4 - low, 2, 2, K, 0); }
      if (type === 'lowrider') { line(ctx, [[4, 17], [W - 4, 16]], 1, '#ffffff'); for (const fx of [W - 30, W - 24, W - 18]) poly(ctx, [[fx, 20], [fx + 3, 14], [fx + 4, 20]], C.orange, 0.5); }
    }
    line(ctx, [[W * 0.45, 13 - low], [W * 0.45, 21]], 0.6);
    rect(ctx, W * 0.45 + 2, 14.6 - low, 3, 0.9, K, 0);
    rrect(ctx, W - 3, 18, 4.4, 3.4, 1.2, '#d8d4e4', 0.8);
    rrect(ctx, -1.4, 18, 4.4, 3.4, 1.2, '#d8d4e4', 0.8);
    oval(ctx, W - 1.4, 14.6 - low, 1.6, 1.8, '#fff2a0', 0.7);
    rrect(ctx, 0.4, 13.6 - low, 2, 2.6, 0.6, C.red, 0.6);
    for (const wx of [14, W - 14]) {
      ctx.beginPath(); ctx.arc(wx, 23.4, 6.8, Math.PI, 0); ctx.fillStyle = shade(body, -0.25); ctx.fill();
      oval(ctx, wx, 23.4, 5.4, 5.4, '#1d1a22', L);
      oval(ctx, wx, 23.4, 2.9, 2.9, type === 'lowrider' ? '#ffffff' : '#c6c2d4', 0.7);
      const a = spin ? Math.PI / 4 : 0;
      for (let k = 0; k < 2; k++) { const b = a + (k * Math.PI) / 2; line(ctx, [[wx + Math.cos(b) * 2.4, 23.4 + Math.sin(b) * 2.4], [wx - Math.cos(b) * 2.4, 23.4 - Math.sin(b) * 2.4]], 0.6); }
    }
    if (dir > 0) { labels(ctx, (x) => x); return c; }
    // facing left: mirror the body, then letter the signs the right way round
    const [m, mctx] = layer(W + 4, 32, R);
    mctx.setTransform(-1, 0, 0, 1, c.width, 0);
    mctx.drawImage(c, 0, 0);
    mctx.setTransform(R, 0, 0, R, 0, 0);
    mctx.translate(2, 2);
    labels(mctx, (x) => W - x);
    return m;
  };
  const labels = (ctx, mx) => {
    if (type === 'taxi') text(ctx, 'TAXI', mx(W / 2 - 1), 0.7, { size: 2.8, fill: K, font: FONT.block });
    if (type === 'danfo') text(ctx, 'OSHODI', mx(W / 2 - 6), 8.6, { size: 3.6, fill: K, font: FONT.slab });
  };
  return { frames: [make(false), make(true)], w: W + 4 };
}
