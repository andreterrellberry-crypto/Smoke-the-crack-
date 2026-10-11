// Traffic, drawn with the same bold cartoon contour as the cast.
import { K, C, layer, rect, rrect, oval, poly, blob, line, tube, text, FONT, shade, mix } from './toon.js';

const OUT = 0.95, IN = 0.5;

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
