// The block, hand-inked: tiled pre-rendered layers + a live layer (people, traffic, neon, steam, comic SFX).
import { INK, C, layer, shape, box, blob, pen, halftone, clipTo, letter, sfx, rng, pick, shade, seedInk } from './ink.js';
import { FACADES, SW, ALLEY_W, construction, paintBoosterCorner, paintCorner, lampPost, hydrant, trashCan, payphone, newsBox, pole } from './facades.js';
import { buildWalker, buildStander, BOOSTER, pedestrianSpec, pigeonFrames, catFrames, carFrames, carType, FRAME } from './chars.js';

export const MAIN_H = 268;
export const G = 192; // sidewalk meets the buildings
const CURB = 216;
const LANE = 266; // wheel line of moving traffic
const PARK = 244; // wheel line of parked cars
const CORNER_W = 120;
export const PS = 0.7; // people are drawn at 70% of their frame size on the street
const FW = FRAME.w * PS, FH = FRAME.h * PS, FOX = FRAME.ox * PS, FOY = FRAME.oy * PS;
const SLANG = {
  'north-america': ['WORD!', 'DEADASS?'], canada: ['WAGWAN', 'MANDEM!'], 'south-america': ['E AÍ!', 'SUAVE'],
  europe: ['WESH!', 'ALLEZ!'], africa: ['WAHALA!', 'OYA!'], asia: ['YABAI!', 'SUGOI'], oceania: ['OI!', 'ESHAY BRAH'],
};

const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const backOut = (t) => 1 + 2.7 * Math.pow(t - 1, 3) + 1.7 * Math.pow(t - 1, 2);
const VIEW_H = 285; // world units of height the street fits on screen
const uiTop = () => (innerWidth > 820 ? 118 : 150); // px covered by the HUD + store directory
export const pickR = () => Math.max(2, Math.min(5, Math.ceil(Math.min(innerHeight / VIEW_H, innerWidth / 170) * (devicePixelRatio || 1))));
const probe = document.createElement('canvas').getContext('2d');

export function buildLayout(stores) {
  const segs = [{ kind: 'corner', x: 0, w: CORNER_W }];
  let x = CORNER_W;
  for (const s of stores) {
    segs.push({ kind: 'store', id: s.id, x, w: SW });
    x += SW;
    if (s.id === 'south-america') {
      segs.push({ kind: 'alley', id: 'booster', x, w: ALLEY_W });
      x += ALLEY_W;
    }
  }
  segs.push({ kind: 'corner', x, w: CORNER_W, end: true });
  return { segs, width: x + CORNER_W };
}

// A wide layer split into <=4096px tiles. Each painter is seeded, so a painter that straddles two tiles draws identically in both.
function tiled(W, H, R, painters) {
  const tw = Math.floor(4000 / R);
  const tiles = [];
  for (let x0 = 0; x0 < W; x0 += tw - 2) {
    const w = Math.min(tw, W - x0);
    const [c, ctx] = layer(w, H, R);
    ctx.translate(-x0, 0);
    for (const p of painters) if (p.x1 >= x0 && p.x0 <= x0 + w) { ctx.save(); seedInk(p.seed); p.fn(ctx, rng(p.seed)); ctx.restore(); }
    tiles.push({ c, x: x0, w });
    if (x0 + w >= W) break;
  }
  return {
    draw(ctx, sx, y, viewW) {
      for (const t of tiles) if (t.x < sx + viewW && t.x + t.w > sx) ctx.drawImage(t.c, t.x - sx, y, t.c.uw, t.c.uh);
    },
  };
}
function sprite(w, h, R, fn, seed = 3) {
  const [c, ctx] = layer(w, h, R);
  seedInk(seed);
  fn(ctx, rng(seed));
  return c;
}
// comic caption box (store tags)
function caption(label, bg, fg, R, size = 6.4) {
  probe.font = `${size}px 'Bangers', sans-serif`;
  const w = probe.measureText(label).width + 9, h = size + 4.6;
  return sprite(w + 1.8, h + 1.8, R, (x) => {
    box(x, 1.6, 1.6, w - 0.4, h - 0.4, { fill: INK, stroke: false });
    box(x, 0.4, 0.4, w - 0.4, h - 0.4, { fill: bg, w: 0.7 });
    letter(x, label, w / 2 + 0.2, h / 2 + 0.6, { size, fill: fg });
  });
}
// speech balloon with a tail pointing down at (tailX)
export function balloon(lines, R, o = {}) {
  const size = o.size || 7;
  probe.font = `${size}px 'Bangers', sans-serif`;
  const tw = Math.max(...lines.map((l) => probe.measureText(l).width));
  const w = tw + size * 2.2, h = lines.length * size * 1.12 + size * 1.4;
  const tail = o.tail ?? 0.75;
  return sprite(w + 2, h + 9, R, (x) => {
    const cx = w / 2 + 1, cy = h / 2 + 1;
    const tx = 1 + w * tail;
    shape(x, [[tx - 4, cy + h * 0.32], [tx + (o.tailDir ?? 3), h + 8], [tx + 3, cy + h * 0.3]], { fill: '#fffdf4', w: 0.8, step: 3 });
    blob(x, cx, cy, w / 2, h / 2, { fill: '#fffdf4', w: 0.9, n: 22 });
    blob(x, tx - 0.4, cy + h * 0.38, 3.2, 1.6, { fill: '#fffdf4', stroke: false });
    lines.forEach((l, i) => letter(x, l, cx, cy + (i - (lines.length - 1) / 2) * size * 1.12 + 0.4, { size, fill: o.colors?.[i] || INK, stroke: o.colors?.[i] && o.colors[i] !== INK ? INK : null, sw: size * 0.12 }));
  });
}
// SFX word on a jagged starburst
function burst(word, color, star, size, R) {
  const s = sfx(word, color, size, R);
  const w = s.uw + size * 0.8, h = s.uh + size * 1.2;
  return sprite(w, h, R, (x, r) => {
    if (star) {
      const pts = [];
      const n = 18;
      for (let i = 0; i < n; i++) { const a = (i / n) * Math.PI * 2, k = i % 2 ? 0.62 : 1 + r() * 0.12; pts.push([w / 2 + Math.cos(a) * (w / 2 - 0.8) * k, h / 2 + Math.sin(a) * (h / 2 - 0.8) * k]); }
      shape(x, pts, { fill: star, w: 0.8, step: 30 });
    }
    x.drawImage(s, (w - s.uw) / 2, (h - s.uh) / 2, s.uw, s.uh);
  });
}

export function createStreet({ cv, stores, itemsByStore, openById, countById, pedItems, boosterItems, onStore, onBooster, onPedestrian, onHover }) {
  const { segs, width: W } = buildLayout(stores);
  const R = pickR();
  const Rc = Math.max(2, Math.ceil(R * PS) + 1);
  const r = rng(77);
  const ctx = cv.getContext('2d');
  const segOf = (id) => segs.find((s) => s.id === id);

  // ---------- MAIN layer: ground + every frontage ----------
  const info = {};
  const painters = [];
  for (let x0 = 0; x0 < W; x0 += 200) {
    painters.push({ x0, x1: x0 + 200, seed: 900 + x0, fn: (m, rr) => {
      const w = Math.min(200, W - x0);
      // sidewalk slabs
      box(m, x0 - 1, G, w + 2, CURB - G, { fill: C.walk, stroke: false });
      for (let x = x0; x < x0 + w; x += 16) pen(m, [[x, G], [x - 3, CURB]], { c: C.walk2, w: 0.6 });
      pen(m, [[x0, G + 11], [x0 + w, G + 11]], { c: C.walk2, w: 0.5, step: 12 });
      halftone(m, x0, G, w, 7, '#3a2a2030', 1.6, (xx, yy) => 0.55 - ((yy - G) / 7) * 0.5);
      for (let i = 0; i < 7; i++) blob(m, x0 + rr() * w, G + 3 + rr() * 19, 0.9 + rr() * 0.6, 0.5, { fill: '#6a6070', stroke: false, n: 7 });
      for (let i = 0; i < 2; i++) { let cx = x0 + rr() * w, cy = G + 2 + rr() * 8; const pts = [[cx, cy]]; for (let k = 0; k < 4; k++) { cx += 2 + rr() * 3; cy += (rr() - 0.3) * 3; pts.push([cx, cy]); } pen(m, pts, { w: 0.4, j: 0.3 }); }
      // curb
      box(m, x0 - 1, CURB, w + 2, 1.8, { fill: '#ddd4c0', w: 0.5 });
      box(m, x0 - 1, CURB + 1.8, w + 2, 2.8, { fill: C.curb, w: 0.6 });
      // road
      const rd = box(m, x0 - 1, CURB + 4.6, w + 2, MAIN_H - CURB - 4.6, { fill: C.road, stroke: false });
      clipTo(m, rd, () => {
        halftone(m, x0, CURB + 5, w, MAIN_H - CURB, '#00000022', 2, (xx, yy) => 0.2 + ((yy - CURB) / 52) * 0.4);
        for (let i = 0; i < 3; i++) blob(m, x0 + rr() * w, CURB + 12 + rr() * 30, 8 + rr() * 12, 2 + rr() * 2, { fill: C.road2, w: 0.4 });
        for (let x = x0 - (x0 % 28); x < x0 + w; x += 28) box(m, x, 246, 14, 1.8, { fill: C.lane, w: 0.4 });
      });
      pen(m, [[x0, CURB + 4.6], [x0 + w, CURB + 4.6]], { w: 0.8, step: 14 });
    } });
  }
  // street-level gags
  painters.push({ x0: 0, x1: W, seed: 61, fn: (m) => {
    for (const cx of [CORNER_W - 30, W - CORNER_W + 6]) for (let i = 0; i < 6; i++) box(m, cx + i * 4.4, CURB + 6, 2.6, MAIN_H - CURB - 8, { fill: '#f1ece0', w: 0.4 });
    const eu = segOf('europe').x + 40;
    blob(m, eu, 236, 8, 2.2, { fill: '#3a3640', w: 0.8 }); pen(m, [[eu - 5, 236], [eu + 5, 236]], { c: '#5a5660', w: 0.5 });
    const pdl = segOf('asia').x + 90;
    blob(m, pdl, 238, 14, 2.6, { fill: C.sky, w: 0.6 }); pen(m, [[pdl - 6, 237.6], [pdl + 2, 237.4]], { c: '#ffffff', w: 0.7 });
    const bn = segOf('canada').x + 64;
    for (const a of [-0.9, 0, 0.9]) shape(m, [[bn, 209], [bn + Math.cos(a - 1.57) * 4 + 1, 209 + Math.sin(a + 1.57) * 0.6 - 0.4], [bn + Math.cos(a) * 4.2, 210]], { fill: C.yellow, w: 0.5, step: 2 });
    const ic = segOf('north-america').x + 128;
    blob(m, ic, 211, 3.6, 1.2, { fill: '#f6a6c0', w: 0.5 }); shape(m, [[ic + 2, 210.4], [ic + 7, 208.6], [ic + 6.6, 211]], { fill: '#d8a060', w: 0.4, step: 2 });
  } });
  segs.forEach((seg, i) => {
    painters.push({ x0: seg.x - 40, x1: seg.x + seg.w + 40, seed: 300 + i * 17, fn: (m, rr) => {
      let res;
      if (seg.kind === 'corner') res = paintCorner(m, seg.x, G, rr, seg.end, R);
      else if (seg.kind === 'alley') res = paintBoosterCorner(m, seg.x, G, rr, boosterItems, R);
      else {
        const st = stores.find((s) => s.id === seg.id);
        res = FACADES[st.id](m, seg.x, G, rr, itemsByStore[st.id], R);
        if (!openById[st.id]) construction(m, seg.x, G, res, st, rr);
      }
      info[i] ??= res;
    } });
  });
  const main = tiled(W, MAIN_H, R, painters);
  const doors = {}, tops = {}, neon = [];
  const fx = { steam: [], smoke: [] };
  let alleyInfo = null;
  segs.forEach((seg, i) => {
    const res = info[i];
    if (seg.kind === 'corner') neon.push(...res.neon);
    else if (seg.kind === 'alley') { alleyInfo = res; neon.push(...res.neon); fx.steam.push({ ...res.steam, p: [] }); }
    else {
      doors[seg.id] = res.door;
      tops[seg.id] = res.top;
      if (openById[seg.id]) neon.push(...res.neon);
      if (res.smoke) fx.smoke.push({ ...res.smoke, p: [] });
    }
  });
  fx.steam.push({ x: segOf('europe').x + 40, y: 235, p: [], road: true });

  // ---------- FOREGROUND props (sprites, always in front of people) ----------
  const fg = [];
  const lampS = sprite(24, 100, R, (x) => lampPost(x, 2, 99));
  const poleS = sprite(22, 178, R, (x) => pole(x, 9, 177));
  const hydS = sprite(12, 14, R, (x) => hydrant(x, 2, 13.5));
  const canS = [0, 1].map((k) => sprite(13, 27, R, (x, rr) => trashCan(x, 1, 26.5, rr), 40 + k));
  segs.forEach((seg, i) => {
    if (i === 0) return;
    const bx = seg.x;
    if (seg.kind !== 'alley' && segs[i - 1].kind !== 'alley') fg.push({ c: lampS, x: bx - 3, y: CURB - 99 });
    if (seg.kind === 'store') fg.push(i % 2 ? { c: hydS, x: bx + 22, y: CURB - 13.5 } : { c: canS[i % 4 ? 0 : 1], x: bx + 19, y: CURB - 26.5 });
  });
  fg.push({ c: sprite(12, 37, R, (x) => payphone(x, 5, 36.5)), x: segs[1].x + 135, y: CURB - 36.5 });
  fg.push({ c: sprite(12, 16, R, (x) => newsBox(x, 0.8, 15.5, '#2a5ea8')), x: segOf('europe').x + 139, y: CURB - 15.5 });
  fg.push({ c: sprite(12, 16, R, (x) => newsBox(x, 0.8, 15.5, C.red)), x: segOf('canada').x + 139, y: CURB - 15.5 });
  const poles = [];
  segs.forEach((seg, i) => { if (i % 2 === 0 && seg.kind !== 'alley' && segs[i - 1]?.kind !== 'alley') { fg.push({ c: poleS, x: seg.x - 11, y: CURB - 177 }); poles.push(seg.x - 0.5); } });
  for (const [px0, t, c] of [[segs[2].x + 20, 'sedan', '#6a8a3a'], [segOf('europe').x + 88, 'hatch', '#8a8a96'], [segOf('oceania').x + 36, 'lowrider', '#7a3a9a']]) {
    const cf = carFrames(t, c, R, 21);
    fg.push({ c: cf.frames[0], x: px0, y: PARK - 29 });
  }
  const sneakS = sprite(14, 18, R, (x) => {
    pen(x, [[7, 0], [4, 8]], { w: 0.4 }); pen(x, [[7, 0], [10, 7]], { w: 0.4 });
    for (const [sx, sy, rot] of [[1, 8, -0.2], [7, 7, 0.25]]) shape(x, [[sx, sy], [sx + 6, sy + 1.6 + rot], [sx + 6.4, sy + 5], [sx, sy + 5]], { fill: '#f6f4ee', w: 0.6, step: 3 });
    pen(x, [[1.4, 11], [6.4, 11.6]], { c: C.red, w: 0.9 }); pen(x, [[7.4, 10.6], [12.4, 11.6]], { c: C.red, w: 0.9 });
  });
  const shoeToss = { x: (poles[1] + poles[2]) / 2, y: CURB - 165 + 9 };

  // ---------- parallax skylines ----------
  const farW = Math.ceil(W * 0.3 + 820), midW = Math.ceil(W * 0.6 + 820);
  const Rb = Math.min(R, 3);
  const farP = [];
  for (let x = 0; x < farW; ) {
    const w = 26 + Math.floor(r() * 44), h = 80 + Math.floor(r() * 120), bx = x, seed = 2000 + x;
    farP.push({ x0: bx - 4, x1: bx + w + 4, seed, fn: (f, rr) => {
      const p = box(f, bx, 230 - h, w, h + 2, { fill: rr() < 0.5 ? C.far : C.far2, w: 0.5, j: 0.2 });
      clipTo(f, p, () => {
        halftone(f, bx, 230 - h, w, h, '#4a6a8a40', 2, (xx, yy) => 0.15 + ((yy - (230 - h)) / h) * 0.6);
        for (let wy = 230 - h + 5; wy < 226; wy += 7) for (let wx = bx + 3; wx < bx + w - 3; wx += 5) if (rr() < 0.4) box(f, wx, wy, 2.2, 3, { fill: '#6f8ea8', stroke: false });
      });
      if (rr() < 0.3) pen(f, [[bx + w / 2, 230 - h], [bx + w / 2, 230 - h - 12]], { c: '#6f8ea8', w: 0.7 });
    } });
    x += w + Math.floor(r() * 5);
  }
  const far = tiled(farW, 232, Rb, farP);
  const midP = [];
  const BILLS = [['BAIL BONDS 24/7', C.yellow, INK], ['FIZZO COLA', C.red, '#fff'], ['WE BUY GOLD', '#f6f4ee', C.red], ['CHEAP RENT (LOL)', C.cyan, INK], ['DR. TOOTH DDS', C.pink, '#fff']];
  let bi = 0;
  for (let x = 0; x < midW; ) {
    const w = 44 + Math.floor(r() * 56), h = 70 + Math.floor(r() * 100), bx = x, seed = 4000 + x;
    const bill = r() < 0.22 ? BILLS[bi++ % BILLS.length] : null;
    midP.push({ x0: bx - 30, x1: bx + w + 30, seed, fn: (f, rr) => {
      const base = pick(rr, [C.mid, C.mid2, '#c99a7e', '#b9a690', '#a48876']);
      const p = box(f, bx, 202 - h, w, h + 2, { fill: base, w: 0.8 });
      clipTo(f, p, () => {
        halftone(f, bx, 202 - h, w, h, '#3a201833', 1.8, (xx, yy) => 0.1 + ((yy - (202 - h)) / h) * 0.55);
        for (let wy = 202 - h + 7; wy < 196; wy += 13) for (let wx = bx + 4; wx < bx + w - 7; wx += 10) box(f, wx, wy, 5, 7, { fill: rr() < 0.2 ? C.lit : '#7aa8b8', w: 0.4 });
      });
      box(f, bx - 1.5, 202 - h - 2, w + 3, 3, { fill: shade(base, -0.15), w: 0.6 });
      if (rr() < 0.5) {
        const tx = bx + 6 + rr() * (w - 20);
        for (const lx of [tx + 1, tx + 9]) pen(f, [[lx, 202 - h - 2], [lx, 202 - h - 8]], { w: 0.6 });
        shape(f, [[tx, 202 - h - 8], [tx, 202 - h - 18], [tx + 5, 202 - h - 22], [tx + 10, 202 - h - 18], [tx + 10, 202 - h - 8]], { fill: '#9a6a44', w: 0.7, step: 4 });
        for (let k = 1; k < 4; k++) pen(f, [[tx, 202 - h - 8 - k * 2.6], [tx + 10, 202 - h - 8 - k * 2.6]], { c: '#6a4428', w: 0.35 });
      }
      if (bill) {
        const bw = Math.max(46, bill[0].length * 4.4);
        pen(f, [[bx + 8, 202 - h - 2], [bx + 8, 202 - h - 10]], { w: 0.7 }); pen(f, [[bx + bw - 4, 202 - h - 2], [bx + bw - 4, 202 - h - 10]], { w: 0.7 });
        box(f, bx + 2, 202 - h - 26, bw, 16, { fill: bill[1], w: 0.9 });
        letter(f, bill[0], bx + 2 + bw / 2, 202 - h - 18, { size: 7, fill: bill[2], stroke: bill[2] === INK ? null : INK, sw: 0.6 });
      }
    } });
    x += w + Math.floor(r() * 4);
  }
  const mid = tiled(midW, 204, Rb, midP);

  // ---------- characters ----------
  const tops2 = pedItems.filter((i) => ['hoodie', 'tee', 'jersey', 'shirt', 'jacket', 'coat'].includes(i.type));
  const pants = pedItems.filter((i) => i.type === 'pants');
  const shoes = pedItems.filter((i) => i.type === 'sneaker');
  const peds = [];
  for (let i = 0; i < 7; i++) {
    const top = tops2[Math.floor(r() * tops2.length)];
    const spec = pedestrianSpec(top, r() > 0.6 ? pick(r, pants) : null, r() > 0.6 ? pick(r, shoes) : null, r);
    peds.push({ item: top, sp: buildWalker(spec, Rc, 100 + i), x: r() * W, y: 200 + Math.floor(r() * 15), dir: r() > 0.5 ? 1 : -1, speed: 16 + r() * 10, t: r() * 6, pause: 0 });
  }
  const loiter = [];
  const spots = [['north-america', 6, 199], ['north-america', 100, 201], ['europe', 118, 200], ['africa', 150, 202], ['oceania', 110, 199], ['canada', 6, 200], ['asia', 112, 201]];
  spots.forEach(([sid, ox, y], i) => {
    if (!openById[sid]) return;
    const seg = segOf(sid);
    const top = pick(r, tops2);
    const spec = { ...pedestrianSpec(top, null, pick(r, shoes), r), acc: { chain: r() > 0.5 } };
    const words = SLANG[sid];
    loiter.push({ item: top, sp: [buildStander(spec, Rc, 200 + i), buildStander(spec, Rc, 260 + i)], x: seg.x + ox, y, t: r() * 6, say: balloon([words[i % 2]], R, { size: 6, tail: 0.3, tailDir: -2 }) });
  });
  const booster = [buildStander(BOOSTER, Rc, 31), buildStander(BOOSTER, Rc, 32)];
  const pigeons = pigeonFrames(R);
  const cat = catFrames(R);
  const flocks = [segs[3].x + 60, segOf('asia').x + 30, W - 200].map((x) => ({ x, birds: [0, 8, 17].map((o) => ({ o, peck: 0 })), flying: 0 }));

  // ---------- captions, balloons, SFX ----------
  const tagCanvas = (st, hover) => {
    const label = openById[st.id] ? `${st.region.toUpperCase()} ${hover ? '› WALK IN' : `• ${countById[st.id]}`}` : `${st.region.toUpperCase()} • CLOSED`;
    return caption(label, !openById[st.id] ? C.orange : hover ? C.yellow : '#fffdf4', INK, R);
  };
  const tags = Object.fromEntries(stores.map((s) => [s.id, { n: tagCanvas(s, false), h: tagCanvas(s, true) }]));
  const bTags = { n: caption('BOOSTER CORNER • RARE', INK, C.gold, R), h: caption('BOOSTER CORNER › THE TRUNK', C.gold, INK, R) };
  const bubble = balloon(["AIN'T NOBODY", 'GOT THESE.'], R, { size: 7, colors: [INK, C.gold], tail: 0.82 });
  const SFX = {};
  const sfxC = (word) => (SFX[word] ??= {
    'HONK!': () => burst('HONK!', C.yellow, '#fffdf4', 9, R), 'BEEP BEEP': () => burst('BEEP BEEP', C.cyan, null, 7, R),
    'FSSSH': () => burst('FSSSH', '#f6f4ee', null, 6, R), 'BZZT!': () => burst('BZZT!', C.cyan, null, 6, R),
    'FLAP FLAP': () => burst('FLAP FLAP', '#f6f4ee', null, 6, R), 'COO': () => burst('COO', '#f6f4ee', null, 5, R),
    'SHKLAK!': () => burst('SHKLAK!', C.orange, C.yellow, 10, R), 'SHTOINK!': () => burst('SHTOINK!', C.gold, '#fffdf4', 11, R),
    'MRRAW': () => burst('MRRAW', C.pink, null, 5, R),
  }[word]());
  const pops = [];
  const cool = {};
  function pop(word, x, y, o = {}) {
    if (o.key && (cool[o.key] || 0) > t) return;
    if (o.key) cool[o.key] = t + (o.cd || 6);
    if (pops.length > 3) pops.shift();
    pops.push({ c: sfxC(word), x, y, t: 0, life: o.life || 1.2, rot: (Math.random() - 0.5) * 0.3 });
  }

  // ---------- camera + view ----------
  let scale = 3, dpr = 1, viewW = 400, viewH = 300, mainY = 0;
  let camX = 0, walking = null, vel = 0, bob = 0;
  let sky = null;
  const clouds = [0, 1, 2, 3].map((i) => {
    const w = 40 + i * 9;
    const c = sprite(w, 22, Rb, (x) => {
      const bumps = [[0.2, 0.62, 0.2], [0.38, 0.42, 0.26], [0.6, 0.38, 0.24], [0.8, 0.6, 0.18]];
      for (const [bx, by, br] of bumps) blob(x, bx * w, by * 22, br * w, br * w * 0.9, { fill: false, stroke: INK, w: 1.4, n: 16 });
      blob(x, 0.5 * w, 0.72 * 22, 0.4 * w, 0.17 * 22, { fill: false, stroke: INK, w: 1.4, n: 18 });
      for (const [bx, by, br] of bumps) blob(x, bx * w, by * 22, br * w, br * w * 0.9, { fill: C.cloud, stroke: false, n: 16 });
      blob(x, 0.5 * w, 0.72 * 22, 0.4 * w, 0.17 * 22, { fill: C.cloud, stroke: false, n: 18 });
      halftone(x, 0.1 * w, 0.62 * 22, 0.8 * w, 6, '#8fb8cc66', 1.4, 0.4);
    }, 70 + i);
    return { c, w, x: i * 190 + 30, y: 14 + (i % 3) * 22, v: 2 + i * 0.7 };
  });
  function buildSky() {
    const horizon = mainY + G - 30;
    sky = sprite(viewW, viewH, Rb, (s) => {
      s.fillStyle = C.sky;
      s.fillRect(0, 0, viewW, viewH);
      halftone(s, 0, 0, viewW, horizon, '#ffffff', 3, (xx, yy) => Math.max(0, (yy / horizon - 0.35) * 1.3));
      s.fillStyle = C.horizon;
      s.fillRect(0, horizon - 10, viewW, viewH);
      halftone(s, 0, horizon - 26, viewW, 18, C.horizon, 2.2, (xx, yy) => ((yy - (horizon - 26)) / 18) * 1.1);
    }, 5);
  }
  function resize() {
    dpr = devicePixelRatio || 1;
    scale = Math.min(innerHeight / VIEW_H, innerWidth / 170);
    viewW = innerWidth / scale;
    viewH = innerHeight / scale;
    cv.width = Math.round(innerWidth * dpr);
    cv.height = Math.round(innerHeight * dpr);
    cv.style.width = `${innerWidth}px`;
    cv.style.height = `${innerHeight}px`;
    mainY = viewH - MAIN_H;
    buildSky();
    camX = clampCam(camX);
  }
  const clampCam = (x) => Math.max(0, Math.min(W - viewW, x));
  const centerOn = (worldX, panelPx = 0) => worldX - (viewW - panelPx / scale) / 2;
  function walkTo(target) {
    target = clampCam(target);
    const from = camX, dist = Math.abs(target - from);
    vel = 0;
    if (dist < 2) return Promise.resolve(true);
    if (walking) walking.res(false);
    return new Promise((res) => (walking = { from, to: target, t: 0, dur: Math.min(3.2, Math.max(0.5, dist / 300)), res }));
  }

  // ---------- input ----------
  let down = null, hover = null, active = true;
  const toWorld = (cx, cy) => ({ x: camX + cx / scale, y: cy / scale - mainY });
  function hitTest(cx, cy) {
    const { x, y } = toWorld(cx, cy);
    for (const p of [...peds].sort((a, b) => b.y - a.y)) if (Math.abs(x - p.x) < 7 && y > p.y - 44 && y < p.y + 2) return { ped: p };
    for (const l of loiter) if (Math.abs(x - l.x) < 8 && y > l.y - 44 && y < l.y + 2) return { ped: l };
    for (const seg of segs) {
      if (x < seg.x || x >= seg.x + seg.w || y > G + 4) continue;
      if (seg.kind === 'alley') return { booster: true };
      if (seg.kind === 'store' && y > tops[seg.id] - 14) return { store: seg.id };
    }
    return null;
  }
  cv.addEventListener('pointerleave', () => { hover = null; onHover?.(null, 0, 0); });
  cv.addEventListener('pointerdown', (e) => {
    down = { x: e.clientX, cam: camX, lastX: e.clientX, lastT: performance.now() };
    vel = 0;
  });
  addEventListener('pointermove', (e) => {
    if (!active) return;
    if (down) {
      const dx = e.clientX - down.x;
      if (!down.drag && Math.abs(dx) > 6) {
        down.drag = true;
        cv.classList.add('dragging');
        if (walking) { walking.res(false); walking = null; }
      }
      if (down.drag) {
        camX = clampCam(down.cam - dx / scale);
        const now = performance.now();
        vel = (-(e.clientX - down.lastX) / scale / Math.max(1, now - down.lastT)) * 1000;
        down.lastX = e.clientX; down.lastT = now;
      }
    } else if (e.target === cv) {
      const h = hitTest(e.clientX, e.clientY);
      cv.style.cursor = h ? 'pointer' : 'grab';
      hover = h?.store || (h?.booster ? 'booster' : null);
      onHover?.(h, e.clientX, e.clientY);
    }
  });
  addEventListener('pointerup', (e) => {
    if (!down) return;
    const wasDrag = down.drag;
    down = null;
    cv.classList.remove('dragging');
    if (wasDrag || !active || e.target !== cv) return;
    const h = hitTest(e.clientX, e.clientY);
    if (!h) return;
    if (h.ped) { h.ped.pause = 4; onPedestrian(h.ped.item, e.clientX, e.clientY); }
    else if (h.booster) onBooster();
    else onStore(h.store);
  });
  cv.addEventListener('wheel', (e) => {
    if (!active) return;
    e.preventDefault();
    if (walking) { walking.res(false); walking = null; }
    camX = clampCam(camX + ((Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY) / scale) * 1.2);
  }, { passive: false });
  const keys = new Set();
  addEventListener('keydown', (e) => {
    if (!active || e.target.closest?.('input')) return;
    if (['ArrowRight', 'ArrowLeft', 'd', 'a'].includes(e.key)) keys.add(e.key);
  });
  addEventListener('keyup', (e) => keys.delete(e.key));

  // ---------- simulation ----------
  let t = 0;
  let entering = null;
  const onScreen = (x, pad = 0) => x > camX - pad && x < camX + viewW + pad;
  const neonState = neon.map(() => ({ on: true, next: Math.random() * 6 }));
  function puffs(src, dt, rate, life) {
    src.acc = (src.acc || 0) + dt * rate;
    while (src.acc > 1) { src.acc--; src.p.push({ x: src.x + (Math.random() - 0.5) * 4, y: src.y, life: 0, s: 0.8 + Math.random() * 0.5 }); }
    for (const p of src.p) { p.life += dt; p.y -= dt * 9; p.x += Math.sin(p.life * 2.4 + p.s * 9) * dt * 4; }
    src.p = src.p.filter((p) => p.life < life);
  }
  // cartoon cloud puffs: ink rims first, then fills, so the cluster reads as one outlined cloud
  function drawPuffs(list, fill, life, ox, oy) {
    const rad = (p) => { const k = p.life / life; return (k < 0.75 ? 1.4 + k * 5 : (1 - k) * 4 * 5.15) * p.s; };
    ctx.beginPath();
    for (const p of list) { const rr = rad(p) + 0.55; ctx.moveTo(p.x - ox + rr, p.y + oy); ctx.arc(p.x - ox, p.y + oy, rr, 0, Math.PI * 2); }
    ctx.fillStyle = INK;
    ctx.fill();
    ctx.beginPath();
    for (const p of list) { const rr = rad(p); ctx.moveTo(p.x - ox + rr, p.y + oy); ctx.arc(p.x - ox, p.y + oy, rr, 0, Math.PI * 2); }
    ctx.fillStyle = fill;
    ctx.fill();
  }

  const cars = [];
  let nextCar = 1.5;
  let lastDt = 1 / 60;
  function update(dt) {
    if (!active) return;
    t += dt;
    lastDt = dt;
    let moving = false;
    if (walking) {
      walking.t += dt;
      const k = Math.min(1, walking.t / walking.dur);
      camX = walking.from + (walking.to - walking.from) * ease(k);
      moving = true;
      if (k >= 1) { const w = walking; walking = null; w.res(true); }
    } else if (keys.size) {
      camX = clampCam(camX + (keys.has('ArrowRight') || keys.has('d') ? 1 : -1) * 160 * dt);
      moving = true;
    } else if (!down && Math.abs(vel) > 3) {
      camX = clampCam(camX + vel * dt);
      vel *= Math.pow(0.03, dt);
      moving = true;
    }
    bob = moving ? Math.abs(Math.sin(t * 9)) * 1.3 : bob * 0.8;

    for (const p of peds) {
      if (p.pause > 0) p.pause -= dt;
      else { p.x += p.dir * p.speed * dt; p.t += dt * p.speed * 0.42; }
      if (p.x > W + 20) p.x = -20;
      if (p.x < -20) p.x = W + 20;
    }
    nextCar -= dt;
    if (nextCar <= 0 && cars.length < 2) {
      const dir = Math.random() > 0.5 ? 1 : -1;
      const cf = carFrames(carType(r), pick(r, ['#2e8a52', C.red, '#2a5ea8', C.yellow, '#e6e2ea', C.purple, '#3a3640', C.orange]), R, Math.floor(Math.random() * 999));
      cars.push({ ...cf, dir, x: dir > 0 ? camX - cf.w - 40 : camX + viewW + 40, speed: 70 + Math.random() * 40, honk: Math.random() < 0.45, p: [], acc: 0 });
      nextCar = 5 + Math.random() * 8;
    }
    for (const c of cars) {
      c.x += c.dir * c.speed * dt;
      const mx = c.x + c.w / 2;
      if (c.honk && Math.abs(mx - (camX + viewW / 2)) < viewW * 0.2) { c.honk = false; pop(Math.random() < 0.7 ? 'HONK!' : 'BEEP BEEP', mx + c.dir * 10, LANE - 44, { key: 'honk', cd: 4 }); }
      const tail = c.dir > 0 ? c.x + 2 : c.x + c.w - 2;
      c.acc += dt * 7;
      while (c.acc > 1) { c.acc--; c.p.push({ x: tail - c.dir * 2, y: LANE - 8, life: 0, s: 0.45 + Math.random() * 0.3 }); }
      for (const p of c.p) { p.life += dt; p.y -= dt * 3; p.x -= c.dir * dt * 6; }
      c.p = c.p.filter((p) => p.life < 0.9);
    }
    for (let i = cars.length - 1; i >= 0; i--) if ((cars[i].dir > 0 && cars[i].x > camX + viewW + 120) || (cars[i].dir < 0 && cars[i].x < camX - 160)) cars.splice(i, 1);
    for (const fl of flocks) {
      if (fl.flying > 0) fl.flying -= dt;
      else if (peds.some((p) => Math.abs(p.x - fl.x - 8) < 10 && p.pause <= 0)) { fl.flying = 3; if (onScreen(fl.x)) pop('FLAP FLAP', fl.x + 10, 186, { key: 'flap', cd: 5 }); }
      for (const b of fl.birds) if (Math.random() < dt * 1.5) b.peck = b.peck ? 0 : 1;
      if (fl.flying <= 0 && onScreen(fl.x) && Math.random() < dt * 0.05) pop('COO', fl.x + 14, 198, { key: 'coo', cd: 9, life: 0.9 });
    }
    neon.forEach((n, i) => {
      const st = neonState[i];
      st.next -= dt;
      if (st.next <= 0) {
        st.on = !st.on;
        st.next = st.on ? 2 + Math.random() * 8 : 0.05 + Math.random() * 0.25;
        if (!st.on && onScreen(n.x + n.c.uw / 2) && Math.random() < 0.25) pop('BZZT!', n.x + n.c.uw / 2, n.y - 4, { key: 'bzzt', cd: 7, life: 0.8 });
      }
    });
    for (const s of fx.steam) { puffs(s, dt, 5, 2.4); if (onScreen(s.x) && Math.random() < dt * 0.08) pop('FSSSH', s.x + 8, s.y - 22, { key: 'fsh', cd: 10, life: 1 }); }
    for (const s of fx.smoke) puffs(s, dt, 3.5, 2.4);
    for (const c of clouds) c.x += c.v * dt;
    for (const p of pops) p.t += dt;
    for (let i = pops.length - 1; i >= 0; i--) if (pops[i].t > pops[i].life) pops.splice(i, 1);
    render();
  }

  // ---------- render ----------
  const drawFig = (fr, x, y, flip) => {
    ctx.fillStyle = 'rgba(27,20,16,0.2)';
    ctx.beginPath();
    ctx.ellipse(x, y, 7.4, 1.5, 0, 0, Math.PI * 2);
    ctx.fill();
    if (flip) { ctx.save(); ctx.translate(x, y); ctx.scale(-1, 1); ctx.drawImage(fr, -FOX, -FOY, FW, FH); ctx.restore(); }
    else ctx.drawImage(fr, x - FOX, y - FOY, FW, FH);
  };
  const boil = () => Math.floor(t * 6) % 2;
  const flyBird = (x, y, ph) => {
    const f = Math.sin(ph) * 2.4;
    ctx.beginPath();
    ctx.moveTo(x - 5, y - f);
    ctx.quadraticCurveTo(x - 2.4, y - 2 - f * 0.4, x, y);
    ctx.quadraticCurveTo(x + 2.4, y - 2 - f * 0.4, x + 5, y - f);
    ctx.strokeStyle = INK;
    ctx.lineWidth = 0.8;
    ctx.stroke();
  };
  function render() {
    const k = scale * dpr;
    ctx.setTransform(k, 0, 0, k, 0, 0);
    ctx.imageSmoothingEnabled = true;
    const cx = camX;
    const oy = mainY + bob;
    ctx.drawImage(sky, 0, 0, viewW, viewH);
    // sun with slowly turning rays
    const sx = viewW - 52, sy = Math.max(26, (mainY + G) * 0.18);
    ctx.save();
    ctx.translate(sx, sy);
    ctx.rotate(t * 0.12);
    ctx.fillStyle = '#fbe08a';
    ctx.beginPath();
    for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2; ctx.moveTo(Math.cos(a - 0.1) * 15, Math.sin(a - 0.1) * 15); ctx.lineTo(Math.cos(a) * 27, Math.sin(a) * 27); ctx.lineTo(Math.cos(a + 0.1) * 15, Math.sin(a + 0.1) * 15); }
    ctx.fill();
    ctx.restore();
    ctx.beginPath(); ctx.arc(sx, sy, 13, 0, Math.PI * 2); ctx.fillStyle = '#ffd23f'; ctx.fill(); ctx.lineWidth = 1; ctx.strokeStyle = INK; ctx.stroke();
    for (const c of clouds) {
      const span = viewW + c.w + 60;
      const x = ((((c.x - cx * 0.08) % span) + span) % span) - c.w - 30;
      ctx.drawImage(c.c, x, c.y + bob * 0.2, c.w, 22);
    }
    const baseY = oy + G;
    far.draw(ctx, cx * 0.3, baseY - 232 - 38 - bob * 0.5, viewW);
    mid.draw(ctx, cx * 0.6, baseY - 204 - 4 - bob * 0.25, viewW);
    main.draw(ctx, cx, oy, viewW);
    // neon
    neon.forEach((n, i) => {
      if (n.x + n.c.uw < cx || n.x > cx + viewW) return;
      ctx.globalAlpha = neonState[i].on ? 1 : 0.35;
      ctx.drawImage(n.c, n.x - cx, oy + n.y, n.c.uw, n.c.uh);
    });
    ctx.globalAlpha = 1;
    // light pours out of the door you're walking into
    if (entering) {
      const d = doors[entering];
      const dx = d.x - cx + d.w / 2, dy = oy + d.y + d.h / 2;
      ctx.fillStyle = '#ffe9a0';
      ctx.fillRect(d.x - cx, oy + d.y, d.w, d.h);
      ctx.save();
      ctx.translate(dx, dy);
      ctx.strokeStyle = INK;
      ctx.lineWidth = 0.7;
      ctx.beginPath();
      for (let i = 0; i < 16; i++) { const a = (i / 16) * Math.PI * 2 + t; ctx.moveTo(Math.cos(a) * (d.w * 0.7), Math.sin(a) * (d.h * 0.6)); ctx.lineTo(Math.cos(a) * (d.w * 1.3), Math.sin(a) * (d.h * 0.9)); }
      ctx.stroke();
      ctx.restore();
    }
    // the van's cat + the booster leaning by the open trunk
    if (alleyInfo) {
      ctx.drawImage(cat[Math.floor(t * 1.4) % 2], alleyInfo.cat.x - cx, oy + alleyInfo.cat.y, 16, 12);
      const b = alleyInfo.booster;
      const near = Math.abs(b.x + 30 - (cx + viewW / 2)) < viewW * 0.35 || hover === 'booster';
      const ph = t % 3.2;
      const bs = booster[boil()];
      const bf = near && ph > 0.4 && ph < 1.8 ? (Math.floor(t * 5) % 2 ? bs.wave : bs.talk) : t % 4.4 < 0.2 ? bs.blink : bs.idle;
      drawFig(bf, b.x - cx, oy + b.y - 7, false);
      if (near) ctx.drawImage(bubble, b.x - bubble.uw * 0.82 + 2 - cx, oy + b.y - 7 - FH - bubble.uh + 6, bubble.uw, bubble.uh);
      const tg = bTags[hover === 'booster' ? 'h' : 'n'];
      ctx.drawImage(tg, b.x + 36 - tg.uw / 2 - cx, Math.max(uiTop() / scale, oy + G - 170), tg.uw, tg.uh);
    }
    // people + birds, back to front
    const actors = [
      ...loiter.map((l) => ({ y: l.y, draw: () => {
        const ph = (t + l.t) % 7;
        const sp = l.sp[boil()];
        const talking = ph > 3 && ph < 4.6;
        const fr = ph < 0.15 ? sp.blink : talking && Math.floor(ph * 6) % 2 ? sp.talk : sp.idle;
        drawFig(fr, l.x - cx, oy + l.y, false);
        if (talking && onScreen(l.x)) ctx.drawImage(l.say, l.x - cx - 4, oy + l.y - FH - l.say.uh + 8, l.say.uw, l.say.uh);
      } })),
      ...peds.map((p) => ({ y: p.y, draw: () => {
        const fr = p.pause > 0 ? p.sp.idle : p.sp.frames[Math.floor(p.t) % 6];
        drawFig(fr, p.x - cx, oy + p.y, p.dir < 0);
      } })),
      ...flocks.flatMap((fl) => fl.birds.map((b, i) => ({ y: 213, draw: () => {
        if (fl.flying > 0) { const lift = (3 - fl.flying) * 26; flyBird(fl.x + b.o + lift * 0.8 - cx, oy + 205 - lift - i * 3, t * 16 + i); }
        else ctx.drawImage(pigeons[b.peck], fl.x + b.o - cx, oy + 205, 9, 7.2);
      } }))),
    ].sort((a, b) => a.y - b.y);
    for (const a of actors) a.draw();
    for (const s of fx.smoke) drawPuffs(s.p, '#9a94a4', 2.4, cx, oy);
    for (const s of fx.steam) if (!s.road) drawPuffs(s.p, '#f8f4ec', 2.4, cx, oy);
    // foreground street furniture, wires, the sneakers on the line
    for (const p of fg) if (p.x + p.c.uw > cx && p.x < cx + viewW) ctx.drawImage(p.c, p.x - cx, oy + p.y, p.c.uw, p.c.uh);
    ctx.strokeStyle = INK;
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    for (let i = 1; i < poles.length; i++) {
      if (poles[i] < cx || poles[i - 1] > cx + viewW) continue;
      for (let k2 = 0; k2 < 3; k2++) {
        const y = oy + CURB - 165 + k2 * 3 + (k2 ? 0 : -1);
        const x0 = poles[i - 1] - cx + (k2 ? 9 : -7), x1 = poles[i] - cx + (k2 ? 9 : -7);
        ctx.moveTo(x0, y);
        ctx.quadraticCurveTo((x0 + x1) / 2, y + 18 + k2 * 3, x1, y);
      }
    }
    ctx.stroke();
    if (onScreen(shoeToss.x, 20)) {
      ctx.save();
      ctx.translate(shoeToss.x - cx, oy + shoeToss.y);
      ctx.rotate(Math.sin(t * 1.6) * 0.12);
      ctx.drawImage(sneakS, -7, 0, 14, 18);
      ctx.restore();
    }
    // traffic: bouncing bodies, speed lines, exhaust
    for (const c of cars) {
      const sx2 = c.x - cx, y = oy + LANE - 29 + Math.sin(t * 22 + c.x * 0.05) * 0.4;
      drawPuffs(c.p, '#c8c4d0', 0.9, cx, oy);
      const fr = c.frames[Math.floor(t * 10) % 2];
      if (c.dir < 0) { ctx.save(); ctx.translate(sx2 + c.w, y); ctx.scale(-1, 1); ctx.drawImage(fr, 0, 0, c.w, 30); ctx.restore(); }
      else ctx.drawImage(fr, sx2, y, c.w, 30);
      ctx.strokeStyle = INK;
      ctx.lineWidth = 0.6;
      ctx.beginPath();
      for (const [ly, len] of [[7, 12], [13, 18], [19, 10]]) {
        const bx = c.dir > 0 ? sx2 - 3 : sx2 + c.w + 3;
        ctx.moveTo(bx, y + ly);
        ctx.lineTo(bx - c.dir * (len + Math.sin(t * 30 + ly) * 2), y + ly);
      }
      ctx.stroke();
    }
    for (const s of fx.steam) if (s.road) drawPuffs(s.p, '#f8f4ec', 2.4, cx, oy);
    // store tags float over the roofs
    for (const seg of segs) if (seg.kind === 'store') {
      const tg = tags[seg.id][hover === seg.id ? 'h' : 'n'];
      const tx = seg.x + seg.w / 2 - tg.uw / 2 - cx;
      if (tx > -tg.uw && tx < viewW) ctx.drawImage(tg, tx, Math.max(uiTop() / scale, oy + tops[seg.id] - 17) + (hover === seg.id ? Math.sin(t * 8) * 0.8 : 0), tg.uw, tg.uh);
    }
    // comic SFX
    for (const p of pops) {
      const kk = p.t < 0.18 ? backOut(p.t / 0.18) : 1;
      ctx.globalAlpha = p.t > p.life - 0.25 ? Math.max(0, (p.life - p.t) / 0.25) : 1;
      ctx.save();
      ctx.translate(p.x - cx, oy + p.y - p.t * 4);
      ctx.rotate(p.rot);
      ctx.scale(kk, kk);
      ctx.drawImage(p.c, -p.c.uw / 2, -p.c.uh / 2, p.c.uw, p.c.uh);
      ctx.restore();
    }
    ctx.globalAlpha = 1;
  }

  resize();
  addEventListener('resize', resize);
  return {
    update,
    width: W,
    segs,
    R,
    get camX() { return camX; },
    get viewW() { return viewW; },
    get scale() { return scale; },
    setActive(v) { active = v; if (!v) { hover = null; onHover?.(null, 0, 0); } },
    jumpToStore(id) { const s = segOf(id); camX = clampCam(centerOn(s.x + s.w / 2)); },
    walkToStore(id, panelPx = 0) { const s = segOf(id); return walkTo(centerOn(s.x + s.w / 2, panelPx)); },
    walkToBooster() { const s = segs.find((x) => x.kind === 'alley'); return walkTo(centerOn(s.x + s.w / 2)); },
    trunkScreen() { return { x: (alleyInfo.trunk.x - camX) * scale, y: (mainY + alleyInfo.trunk.y) * scale }; },
    setEntering(id) {
      entering = id;
      if (id) { const d = doors[id]; pop('SHKLAK!', d.x + d.w / 2, d.y - 10, { life: 1 }); render(); }
    },
    popTrunk() { pop('SHTOINK!', alleyInfo.trunk.x, alleyInfo.trunk.y - 30, { life: 1 }); render(); },
    doorScreen(id) { const d = doors[id]; return { x: (d.x + d.w / 2 - camX) * scale, y: (mainY + d.y + d.h / 2) * scale }; },
    render,
  };
}
