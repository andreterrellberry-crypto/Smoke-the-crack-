// 24x24 pixel garments for windows, racks, cards and the bag.
import { canvas, rect, px, line, dither, outline, shade } from './draw.js';

const cache = new Map();

function draw(ctx, it) {
  const c = it.color, a = it.accent, dk = shade(c, -0.16), lt = shade(c, 0.12);
  const torso = (x0, y0, x1, y1) => {
    for (let y = y0; y <= y1; y++) { rect(ctx, x0, y, x1 - x0 + 1, 1, c); px(ctx, x0, y, dk); px(ctx, x1, y, lt); }
  };
  const sleeves = (len, w = 3) => {
    for (let i = 0; i < len; i++) { rect(ctx, 6 - Math.floor(i / 2) - w + 1, 6 + i, w, 1, dk); rect(ctx, 17 + Math.floor(i / 2), 6 + i, w, 1, lt); }
  };
  switch (it.type) {
    case 'hoodie':
      sleeves(12, 3); torso(6, 5, 17, 20);
      rect(ctx, 8, 3, 8, 3, dk); rect(ctx, 9, 4, 6, 2, shade(c, -0.3));
      rect(ctx, 8, 15, 8, 4, dk); px(ctx, 10, 6, '#e8e4ee'); px(ctx, 13, 6, '#e8e4ee'); px(ctx, 10, 7, '#e8e4ee'); px(ctx, 13, 7, '#e8e4ee');
      rect(ctx, 8, 9, 8, 3, a); rect(ctx, 9, 10, 6, 1, shade(a, -0.25));
      break;
    case 'tee':
    case 'jersey':
      sleeves(4, 4); torso(6, 5, 17, 20);
      rect(ctx, 9, 5, 6, 1, shade(c, -0.3));
      if (it.type === 'jersey') { line(ctx, 9, 5, 11, 8, a); line(ctx, 14, 5, 12, 8, a); rect(ctx, 6, 9, 1, 12, a); rect(ctx, 17, 9, 1, 12, a); rect(ctx, 9, 11, 1, 5, a); rect(ctx, 11, 11, 4, 5, a); rect(ctx, 12, 12, 2, 3, c); }
      else { rect(ctx, 9, 9, 6, 5, a); px(ctx, 11, 11, c); px(ctx, 12, 11, c); }
      break;
    case 'shirt':
      sleeves(12, 3); torso(6, 5, 17, 20);
      for (let y = 5; y <= 20; y++) for (let x = 6; x <= 17; x++) if (((x >> 1) + (y >> 1)) % 2 === 0) px(ctx, x, y, shade(a, -0.05));
      rect(ctx, 9, 4, 6, 2, a); rect(ctx, 11, 6, 1, 14, '#f4f4f4'); for (let y = 8; y < 20; y += 3) px(ctx, 12, y, '#2a2630');
      break;
    case 'jacket':
      sleeves(12, 3); torso(6, 5, 17, 19);
      rect(ctx, 8, 3, 8, 3, a); rect(ctx, 11, 6, 1, 14, a); rect(ctx, 6, 19, 12, 2, a); rect(ctx, 1, 16, 3, 2, a); rect(ctx, 20, 16, 3, 2, a);
      dither(ctx, 7, 7, 3, 10, lt);
      break;
    case 'coat':
      sleeves(13, 3); torso(6, 4, 17, 22);
      line(ctx, 8, 4, 11, 10, dk); line(ctx, 15, 4, 12, 10, dk); rect(ctx, 6, 13, 12, 1, a); rect(ctx, 11, 10, 1, 13, dk);
      px(ctx, 9, 12, '#2a2630'); px(ctx, 14, 12, '#2a2630'); px(ctx, 9, 16, '#2a2630'); px(ctx, 14, 16, '#2a2630');
      break;
    case 'pants':
      rect(ctx, 6, 2, 12, 3, a);
      for (let y = 5; y <= 21; y++) { const o = Math.floor((y - 5) / 6); rect(ctx, 6 - o, y, 5, 1, c); rect(ctx, 13 + o, y, 5, 1, c); px(ctx, 6 - o, y, dk); px(ctx, 17 + o, y, lt); }
      rect(ctx, 6, 5, 12, 4, c); rect(ctx, 11, 5, 2, 4, dk);
      rect(ctx, 5, 12, 3, 4, dk); rect(ctx, 16, 12, 3, 4, dk);
      break;
    case 'sneaker':
      rect(ctx, 3, 10, 9, 6, c); rect(ctx, 3, 10, 9, 1, lt); rect(ctx, 11, 12, 10, 4, c); rect(ctx, 2, 16, 20, 3, '#efecf3'); rect(ctx, 2, 18, 20, 1, '#cfcbd6');
      line(ctx, 6, 14, 17, 13, a); rect(ctx, 7, 14, 10, 1, a); for (let x = 7; x < 12; x += 2) px(ctx, x, 11, '#f4f4f4');
      rect(ctx, 3, 9, 3, 2, shade(c, -0.2));
      break;
    case 'cap':
      rect(ctx, 6, 7, 11, 8, c); rect(ctx, 7, 6, 9, 1, c); rect(ctx, 8, 7, 4, 1, lt); rect(ctx, 15, 13, 7, 2, dk); rect(ctx, 9, 9, 4, 3, a); px(ctx, 11, 5, a);
      break;
    default:
      rect(ctx, 1, 10, 22, 5, c); rect(ctx, 1, 10, 22, 1, lt); for (let x = 3; x < 22; x += 4) rect(ctx, x, 12, 2, 1, a);
      rect(ctx, 9, 8, 6, 9, 'transparent'); rect(ctx, 9, 8, 6, 1, '#cfcbd6'); rect(ctx, 9, 16, 6, 1, '#cfcbd6'); rect(ctx, 9, 8, 1, 9, '#cfcbd6'); rect(ctx, 14, 8, 1, 9, '#cfcbd6');
  }
}

export function itemSprite(it) {
  const key = it.id;
  if (cache.has(key)) return cache.get(key).c;
  const [c, ctx] = canvas(24, 24);
  draw(ctx, it);
  outline(c);
  cache.set(key, { c, url: null });
  return c;
}
export function itemURL(it) {
  itemSprite(it);
  const e = cache.get(it.id);
  if (!e.url) e.url = e.c.toDataURL();
  return e.url;
}
export const itemImg = (it, cls = '') => `<img class="pix ${cls}" src="${itemURL(it)}" alt="" width="24" height="24">`;
