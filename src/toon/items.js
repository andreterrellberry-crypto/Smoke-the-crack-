// Flat cartoon garments for shop windows, racks, product cards and the bag.
import { K, layer, roundPoly, ink, rect, rrect, oval, poly, blob, line, text, clip, shade, FONT } from './toon.js';

const cache = new Map();
const S = 24; // garment drawn in a 24-unit box
const L = 0.8;

function draw(ctx, it) {
  const c = it.color, a = it.accent || '#ffffff', dk = shade(c, -0.14);
  switch (it.type) {
    case 'hoodie': case 'jacket': case 'coat': case 'shirt': {
      const bottom = it.type === 'coat' ? 23 : 20.4;
      poly(ctx, [[5.4, 5.6], [1.4, 18.6], [4.6, 19.6], [7.4, 11]], dk, L, 1.2);
      poly(ctx, [[18.6, 5.6], [22.6, 18.6], [19.4, 19.6], [16.6, 11]], c, L, 1.2);
      const body = [[6, 4.4], [9.6, 3.2], [14.4, 3.2], [18, 4.4], [18.4, bottom], [5.6, bottom]];
      poly(ctx, body, c, L, 1.4);
      if (it.type === 'hoodie') {
        blob(ctx, [[8, 4.2], [12, 1.4], [16, 4.2], [12, 7.8]], dk, L);
        rrect(ctx, 8.4, 13.6, 7.2, 5, 1.8, dk, L);
        rrect(ctx, 8.6, 8.6, 6.8, 3, 0.8, a, L * 0.8);
        line(ctx, [[11, 6], [10.8, 9.4]], 0.5, '#ffffff'); line(ctx, [[13, 6], [13.2, 9.4]], 0.5, '#ffffff');
        rect(ctx, 1.6, 17.2, 3, 1.8, dk, L * 0.7); rect(ctx, 19.4, 17.2, 3, 1.8, c, L * 0.7);
      }
      if (it.type === 'jacket') { poly(ctx, [[8.4, 3.4], [12, 6.6], [15.6, 3.4], [15, 2], [9, 2]], a, L * 0.9); line(ctx, [[12, 6.4], [12, bottom]], 0.9, a); rect(ctx, 5.6, bottom - 1.8, 12.8, 1.8, a, L * 0.8); }
      if (it.type === 'coat') { line(ctx, [[8.6, 3.8], [12, 11], [15.4, 3.8]], L); rect(ctx, 5.8, 12.6, 12.4, 1.4, a, L * 0.7); line(ctx, [[12, 11], [12, bottom]], 0.5); for (const y of [15.6, 19]) { oval(ctx, 10.2, y, 0.6, 0.6, K, 0); oval(ctx, 13.8, y, 0.6, 0.6, K, 0); } }
      if (it.type === 'shirt') {
        clip(ctx, () => roundPoly(ctx, body, 1.4), () => { for (let y = 3; y < 21; y += 2.4) rect(ctx, 5, y, 14, 0.9, a, 0); for (let x = 6; x < 19; x += 2.4) rect(ctx, x, 3, 0.7, 19, shade(a, -0.15), 0); });
        roundPoly(ctx, body, 1.4); ink(ctx, null, L);
        poly(ctx, [[9, 3.4], [12, 6.2], [15, 3.4], [12, 2.2]], '#ffffff', L * 0.8);
        line(ctx, [[12, 6.2], [12, 20]], 0.5);
      }
      break;
    }
    case 'tee': case 'jersey': {
      poly(ctx, [[5.6, 4.6], [1.2, 9.2], [4, 12], [6.4, 9.8]], dk, L, 1);
      poly(ctx, [[18.4, 4.6], [22.8, 9.2], [20, 12], [17.6, 9.8]], c, L, 1);
      poly(ctx, [[6, 4.4], [9.6, 3.4], [14.4, 3.4], [18, 4.4], [18, 21], [6, 21]], c, L, 1.4);
      if (it.type === 'jersey') { line(ctx, [[9.6, 3.8], [12, 7.2], [14.4, 3.8]], 1.2, a); text(ctx, '10', 12, 13.6, { size: 7, fill: a, stroke: K, sw: 0.7, font: FONT.slab }); rect(ctx, 6.1, 6, 1.4, 14.8, a, 0); rect(ctx, 16.5, 6, 1.4, 14.8, a, 0); }
      else { line(ctx, [[9.6, 3.9], [12, 5.8], [14.4, 3.9]], 0.6); oval(ctx, 12, 12, 3.6, 3.2, a, L); oval(ctx, 11, 11.2, 0.7, 0.8, K, 0); oval(ctx, 13, 11.2, 0.7, 0.8, K, 0); line(ctx, [[10.4, 13.2], [12, 14.2], [13.6, 13.2]], 0.5, K, true); }
      break;
    }
    case 'pants': {
      rect(ctx, 6, 2.2, 12, 3, a, L);
      poly(ctx, [[6, 5.2], [12, 5.2], [11.6, 9], [10.8, 22.4], [5, 22.4]], c, L, 1);
      poly(ctx, [[12, 5.2], [18, 5.2], [19, 22.4], [13.2, 22.4], [12.4, 9]], dk, L, 1);
      rrect(ctx, 5.4, 11, 3.4, 4, 0.8, dk, L * 0.8);
      rrect(ctx, 15.4, 11, 3.4, 4, 0.8, shade(c, -0.25), L * 0.8);
      break;
    }
    case 'sneaker': {
      poly(ctx, [[2.6, 15.4], [3.2, 8.6], [8, 7.8], [12.4, 10.8], [19.4, 12.8], [22.4, 15.4], [22.4, 17.2], [2.6, 17.2]], c, L, 2);
      rrect(ctx, 2, 16.4, 21, 3.4, 1.6, '#ffffff', L);
      line(ctx, [[5.6, 15], [12, 12.4], [18.4, 14.8]], 1.6, a, true);
      for (let i = 0; i < 3; i++) line(ctx, [[8.2 + i * 1.8, 9.6], [9.8 + i * 1.8, 11.4]], 0.6, '#ffffff');
      oval(ctx, 4.6, 9.6, 1, 1, '#ffffff', L * 0.7);
      break;
    }
    case 'cap': {
      blob(ctx, [[4.4, 15], [5.2, 8.4], [12, 5.6], [18.8, 8.4], [19.4, 15]], c, L);
      poly(ctx, [[14.6, 14], [23.2, 14.6], [22.4, 16.8], [14.6, 16.2]], dk, L, 1);
      oval(ctx, 11.2, 10.8, 2.6, 2, a, L * 0.8);
      oval(ctx, 12, 5.6, 1, 0.7, a, L * 0.6);
      break;
    }
    default: {
      rrect(ctx, 1.4, 9.8, 21.2, 5.4, 1.4, c, L);
      for (let x = 3.4; x < 22; x += 4) rect(ctx, x, 12, 2, 1, a, 0);
      rrect(ctx, 9, 8.4, 6, 8.2, 1, null, 1);
    }
  }
}

export function itemCanvas(it, R = 4) {
  const key = `${it.id}@${R}`;
  if (cache.has(key)) return cache.get(key);
  const [c, ctx] = layer(S, S, R);
  draw(ctx, it);
  cache.set(key, c);
  return c;
}
const urls = new Map();
export function itemURL(it) {
  if (!urls.has(it.id)) urls.set(it.id, itemCanvas(it, 6).toDataURL());
  return urls.get(it.id);
}
export const itemImg = (it) => `<img class="toon-art" src="${itemURL(it)}" alt="" width="96" height="96">`;
