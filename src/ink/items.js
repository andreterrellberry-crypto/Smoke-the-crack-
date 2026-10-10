// Inked garments for shop windows, racks, product cards and the bag.
import { INK, layer, shape, blob, pen, halftone, clipTo, letter, seedInk, shade } from './ink.js';

const cache = new Map();
const S = 24; // garment drawn in a 24-unit box

function draw(ctx, it) {
  const c = it.color, a = it.accent, dk = shade(c, -0.18);
  const tone = (pts) => clipTo(ctx, pts, () => halftone(ctx, 0, 0, 9, S, '#00000038', 1.3, 0.42));
  switch (it.type) {
    case 'hoodie': case 'jacket': case 'coat': case 'shirt': {
      const long = it.type === 'coat';
      const bottom = long ? 23 : 20;
      shape(ctx, [[5, 6], [1.6, 18], [4.4, 19], [6.6, 11]], { fill: dk, w: 0.7 });
      shape(ctx, [[19, 6], [22.4, 18], [19.6, 19], [17.4, 11]], { fill: c, w: 0.7 });
      const body = shape(ctx, [[6, 4.6], [9.6, 3.4], [14.4, 3.4], [18, 4.6], [18.4, bottom], [5.6, bottom]], { fill: c, w: 0.8, step: 4 });
      tone(body);
      if (it.type === 'hoodie') { shape(ctx, [[8.4, 4], [12, 7.6], [15.6, 4], [12, 2]], { fill: dk, w: 0.6 }); shape(ctx, [[8.6, 14.4], [15.4, 14.4], [16, 18.4], [8, 18.4]], { fill: dk, w: 0.5 }); shape(ctx, [[8.4, 9], [15.6, 9], [15.6, 11.6], [8.4, 11.6]], { fill: a, w: 0.5 }); pen(ctx, [[11, 6], [10.8, 9]], { c: '#f6f4ee', w: 0.4 }); pen(ctx, [[13, 6], [13.2, 9]], { c: '#f6f4ee', w: 0.4 }); }
      if (it.type === 'jacket') { shape(ctx, [[8.6, 3.6], [12, 6.4], [15.4, 3.6], [15, 2.4], [9, 2.4]], { fill: a, w: 0.5 }); pen(ctx, [[12, 6], [12, bottom]], { c: a, w: 0.7 }); shape(ctx, [[5.6, bottom - 1.6], [18.4, bottom - 1.6], [18.4, bottom], [5.6, bottom]], { fill: a, w: 0.4 }); }
      if (it.type === 'coat') { pen(ctx, [[8.6, 4], [12, 11], [15.4, 4]], { w: 0.6 }); pen(ctx, [[5.8, 13], [18.2, 13]], { c: a, w: 1.2 }); pen(ctx, [[12, 11], [12, bottom]], { w: 0.4 }); for (const y of [12, 16]) { blob(ctx, 10, y, 0.5, 0.5, { fill: INK, stroke: false }); blob(ctx, 14, y, 0.5, 0.5, { fill: INK, stroke: false }); } }
      if (it.type === 'shirt') { clipTo(ctx, body, () => { for (let y = 3; y < 21; y += 2.2) pen(ctx, [[5, y], [19, y]], { c: a, w: 0.7, j: 0.05 }); for (let x = 6; x < 19; x += 2.2) pen(ctx, [[x, 3], [x, 21]], { c: shade(a, -0.2), w: 0.4, j: 0.05 }); }); shape(ctx, [[9, 3.4], [12, 6], [15, 3.4], [12, 2.4]], { fill: '#f6f4ee', w: 0.4 }); pen(ctx, [[12, 6], [12, 20]], { w: 0.4 }); }
      break;
    }
    case 'tee': case 'jersey': {
      shape(ctx, [[5.6, 4.6], [1.4, 9], [4, 11.6], [6.4, 9.6]], { fill: dk, w: 0.7 });
      shape(ctx, [[18.4, 4.6], [22.6, 9], [20, 11.6], [17.6, 9.6]], { fill: c, w: 0.7 });
      const body = shape(ctx, [[6, 4.4], [9.6, 3.6], [14.4, 3.6], [18, 4.4], [18, 20.6], [6, 20.6]], { fill: c, w: 0.8, step: 4 });
      tone(body);
      if (it.type === 'jersey') { pen(ctx, [[9.6, 3.8], [12, 7], [14.4, 3.8]], { c: a, w: 1 }); letter(ctx, '10', 12, 13, { size: 7, fill: a, stroke: INK, sw: 0.6 }); pen(ctx, [[6.2, 6], [6.2, 20]], { c: a, w: 0.8 }); pen(ctx, [[17.8, 6], [17.8, 20]], { c: a, w: 0.8 }); }
      else { pen(ctx, [[9.6, 3.9], [12, 5.6], [14.4, 3.9]], { w: 0.5 }); blob(ctx, 12, 11.6, 3.4, 3, { fill: a, w: 0.6 }); }
      break;
    }
    case 'pants': {
      shape(ctx, [[6, 2.4], [18, 2.4], [18, 5], [6, 5]], { fill: a, w: 0.6 });
      const l = shape(ctx, [[6, 5], [12, 5], [11.6, 9], [10.6, 22], [5.2, 22]], { fill: c, w: 0.8, step: 4 });
      shape(ctx, [[12, 5], [18, 5], [18.8, 22], [13.4, 22], [12.4, 9]], { fill: c, w: 0.8, step: 4 });
      tone(l);
      shape(ctx, [[5.4, 11], [8.6, 11], [8.6, 15], [5.4, 15]], { fill: dk, w: 0.4 });
      shape(ctx, [[15.4, 11], [18.6, 11], [18.6, 15], [15.4, 15]], { fill: dk, w: 0.4 });
      break;
    }
    case 'sneaker': {
      const up = shape(ctx, [[3, 15], [3.6, 9], [8, 8.4], [12, 11], [19, 13], [22, 15.6], [22, 17], [3, 17]], { fill: c, w: 0.8, step: 3 });
      tone(up);
      shape(ctx, [[2.4, 17], [22.4, 17], [22, 19.6], [3, 19.6]], { fill: '#f6f4ee', w: 0.7, step: 4 });
      pen(ctx, [[6, 15.4], [12, 13], [18, 15]], { c: a, w: 1.4 });
      for (let i = 0; i < 3; i++) pen(ctx, [[8 + i * 1.6, 10], [9.6 + i * 1.6, 11.6]], { c: '#f6f4ee', w: 0.5 });
      break;
    }
    case 'cap': {
      const d = shape(ctx, [[4.6, 15], [5.4, 8.6], [12, 6.2], [18.4, 8.6], [19, 15]], { fill: c, w: 0.8, step: 3 });
      tone(d);
      shape(ctx, [[15, 14], [23, 14.6], [22, 16.4], [15, 16]], { fill: dk, w: 0.6, step: 3 });
      blob(ctx, 11.4, 11, 2.4, 1.8, { fill: a, w: 0.5 });
      blob(ctx, 12, 6, 0.8, 0.6, { fill: a, w: 0.3 });
      break;
    }
    default: {
      const b = shape(ctx, [[1.4, 10], [22.6, 10], [22.6, 15], [1.4, 15]], { fill: c, w: 0.8, step: 4 });
      tone(b);
      for (let x = 3; x < 22; x += 4) pen(ctx, [[x, 12.5], [x + 2, 12.5]], { c: a, w: 0.8 });
      shape(ctx, [[9, 8.6], [15, 8.6], [15, 16.4], [9, 16.4]], { fill: false, w: 0.9 });
    }
  }
}

export function itemCanvas(it, R = 4) {
  const key = `${it.id}@${R}`;
  if (cache.has(key)) return cache.get(key);
  const [c, ctx] = layer(S, S, R);
  seedInk(it.id.length * 13 + it.price);
  draw(ctx, it);
  cache.set(key, c);
  return c;
}
const urls = new Map();
export function itemURL(it) {
  if (!urls.has(it.id)) urls.set(it.id, itemCanvas(it, 6).toDataURL());
  return urls.get(it.id);
}
export const itemImg = (it) => `<img class="ink-art" src="${itemURL(it)}" alt="" width="96" height="96">`;
