// The block as a cartoon set: tiled pre-rendered layers, a live one-point-perspective pass (building side walls and
// cross streets that swing toward the vanishing point as you walk) and a live layer of people, traffic and gags.
import { K, C, LW, FONT, layer, rect, rrect, oval, poly, blob, line, text, measure, dots, rng, pick, shade } from './toon.js';
import { FACADES, SW, ALLEY_W, construction, paintBoosterCorner, lampPost, hydrant, trashCan, newsBox, mailbox, meter, bench, pole, signalPole } from './facades.js';
import { buildWalker, buildStander, buildHead, BOOSTER, NEIGHBOURS, pedestrianSpec, FRAME } from './chars.js';
import { pigeonFrames, catFrames, dogFrames, carFrames, carType } from './critters.js';

export const MAIN_H = 268;
export const G = 192; // building line
const CURB = 216;
const ROAD = CURB + 4.6;
const LANE = 266; // wheel line of moving traffic
const PARK = 244; // wheel line of parked cars
const HOR = 158; // eye level / horizon
const Z0 = 70; // viewer distance from the building line (perspective strength)
const ZS = 16; // depth of the buildings on our row
export const CROSS_W = 150;
export const PS = 0.68; // people on the street are drawn at 68% of their frame size
const FW = FRAME.w * PS, FH = FRAME.h * PS, FOX = FRAME.ox * PS, FOY = FRAME.oy * PS;
const VIEW_H = 285;
const uiTop = () => (innerWidth > 820 ? 122 : 162);
const SLANG = {
  'north-america': ['WORD!', 'DEADASS?'], canada: ['WAGWAN', 'MANDEM!'], 'south-america': ['E AÍ!', 'SUAVE'],
  europe: ['WESH!', 'ALLEZ!'], africa: ['WAHALA!', 'OYA!'], asia: ['YABAI!', 'SUGOI'], oceania: ['OI!', 'ESHAY BRAH'],
};
const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
export const pickR = () => Math.max(2, Math.min(5, Math.ceil(Math.min(innerHeight / VIEW_H, innerWidth / 170) * (devicePixelRatio || 1))));

export function buildLayout(stores) {
  const segs = [{ kind: 'cross', x: 0, w: CROSS_W, street: 'SMOKE ST' }];
  let x = CROSS_W;
  for (const s of stores) {
    segs.push({ kind: 'store', id: s.id, x, w: SW });
    x += SW;
    if (s.id === 'south-america') { segs.push({ kind: 'alley', id: 'booster', x, w: ALLEY_W }); x += ALLEY_W; }
  }
  segs.push({ kind: 'cross', x, w: CROSS_W, end: true, street: 'GRAIL AVE' });
  return { segs, width: x + CROSS_W };
}

// A wide layer split into <=4000px tiles; each painter is seeded so a painter straddling two tiles draws identically in both
function tiled(W, H, R, painters) {
  const tw = Math.floor(4000 / R);
  const tiles = [];
  for (let x0 = 0; x0 < W; x0 += tw - 2) {
    const w = Math.min(tw, W - x0);
    const [c, ctx] = layer(w, H, R);
    ctx.translate(-x0, 0);
    for (const p of painters) if (p.x1 >= x0 && p.x0 <= x0 + w) { ctx.save(); p.fn(ctx, rng(p.seed)); ctx.restore(); }
    tiles.push({ c, x: x0, w });
    if (x0 + w >= W) break;
  }
  return { draw(ctx, sx, y, viewW) { for (const t of tiles) if (t.x < sx + viewW && t.x + t.w > sx) ctx.drawImage(t.c, t.x - sx, y, t.c.uw, t.c.uh); } };
}
function sprite(w, h, R, fn, seed = 3) {
  const [c, ctx] = layer(w, h, R);
  fn(ctx, rng(seed));
  return c;
}
// painted sign board for each store: slab lettering, pinstripe border, a red count plate
function pill(label, count, bg, fg, R) {
  const size = 6;
  const tw = measure(label, size, FONT.slab) + 9, cw = count != null ? measure(String(count), size, FONT.slab) + 7 : 0;
  const w = tw + cw, h = size + 6.4;
  return sprite(w + 2, h + 2, R, (x) => {
    rect(x, 1, 1, w, h, bg, 1.1);
    rect(x, 2.4, 2.4, tw - 2.8, h - 2.8, null, 0);
    x.lineWidth = 0.45; x.strokeStyle = fg; x.strokeRect(2.6, 2.6, tw - 3.2, h - 3.2);
    if (count != null) { rect(x, 1 + tw, 1, cw, h, C.red, 1.1); text(x, String(count), 1 + tw + cw / 2, 1 + h / 2 + 0.6, { size, font: FONT.slab, fill: C.yellow }); }
    text(x, label, 1 + tw / 2, 1 + h / 2 + 0.6, { size, font: FONT.slab, fill: fg });
  });
}
// round speech balloon with a tail
export function balloon(lines, R, o = {}) {
  const size = o.size || 6.4;
  const tw = Math.max(...lines.map((l) => measure(l, size, FONT.block)));
  const w = tw + size * 2, h = lines.length * size * 1.15 + size * 1.2;
  const tail = o.tail ?? 0.75;
  return sprite(w + 2, h + 8, R, (x) => {
    const tx = 1 + w * tail;
    poly(x, [[tx - 3.4, h - 1], [tx + (o.tailDir ?? 2.6), h + 7], [tx + 3, h - 1.4]], '#ffffff', 1.1);
    rrect(x, 1, 1, w, h, Math.min(h / 2, 7), '#ffffff', 1.1);
    rect(x, tx - 2.6, h - 1.8, 5, 2.4, '#ffffff', 0);
    lines.forEach((l, i) => text(x, l, 1 + w / 2, 1 + h / 2 + (i - (lines.length - 1) / 2) * size * 1.15 + 0.6, { size, font: FONT.block, fill: o.colors?.[i] || K, stroke: o.colors?.[i] && o.colors[i] !== K ? K : null, sw: size * 0.16 }));
  });
}

export function createStreet({ cv, stores, itemsByStore, openById, countById, pedItems, boosterItems, onStore, onBooster, onPedestrian, onHover }) {
  const { segs, width: W } = buildLayout(stores);
  const R = pickR();
  const Rc = Math.max(2, Math.ceil(R * PS) + 1);
  const r = rng(77);
  const ctx = cv.getContext('2d');
  const segOf = (id) => segs.find((s) => s.id === id);

  // ---------- MAIN layer: road, sidewalks, every frontage ----------
  const info = {};
  const painters = [];
  for (let x0 = 0; x0 < W; x0 += 200) {
    painters.push({ x0, x1: x0 + 200, seed: 900 + x0, fn: (m, rr) => {
      const w = Math.min(200, W - x0);
      rect(m, x0 - 1, ROAD, w + 2, MAIN_H - ROAD + 1, C.road, 0);
      for (let i = 0; i < 2; i++) rrect(m, x0 + rr() * w, ROAD + 8 + rr() * 30, 14 + rr() * 18, 3 + rr() * 2, 1.4, C.road2, 0);
      dots(m, x0, ROAD + 2, w, MAIN_H - ROAD, '#3e4262', 40, rr, 0.5);
      for (let x = x0 - (x0 % 30); x < x0 + w; x += 30) rrect(m, x, 245.6, 15, 1.8, 0.8, C.lane, 0);
    } });
  }
  const sidewalk = (m, rr, x0, x1) => {
    rect(m, x0, G, x1 - x0, CURB - G, C.walk, 0);
    dots(m, x0, G + 1, x1 - x0, CURB - G - 2, C.walkDot, Math.round((x1 - x0) * 0.5), rr, 0.45);
    for (let x = x0 + 18; x < x1; x += 22) line(m, [[x, G + 1], [x - 2, CURB - 1]], 0.4, '#cfc8de');
    rect(m, x0, CURB, x1 - x0, 1.8, C.curbTop, 0);
    rect(m, x0, CURB + 1.8, x1 - x0, 2.8, C.curb, 0);
    line(m, [[x0, CURB], [x1, CURB]], 0.6); line(m, [[x0, ROAD], [x1, ROAD]], 0.8);
    line(m, [[x0, G], [x1, G]], 0.8);
  };
  segs.forEach((seg, i) => {
    painters.push({ x0: seg.x - 40, x1: seg.x + seg.w + 40, seed: 300 + i * 17, fn: (m, rr) => {
      let res;
      if (seg.kind === 'cross') {
        const xa = seg.x + 26, xb = seg.x + seg.w - 26;
        sidewalk(m, rr, seg.x, xa); sidewalk(m, rr, xb, seg.x + seg.w);
        rect(m, xa, G, xb - xa, ROAD - G + 0.5, C.road, 0);
        line(m, [[xa, G], [xa, ROAD]], 0.8); line(m, [[xb, G], [xb, ROAD]], 0.8);
        for (let x = xa + 4; x < xb - 4; x += 7) rect(m, x, G + 4, 4, CURB - G - 6, C.zebra, 0.5);
        for (let y = ROAD + 5; y < MAIN_H - 3; y += 5.4) rect(m, xa + 4, y, xb - xa - 8, 2.2, C.zebra, 0.5);
        res = { roofL: HOR, roofR: HOR };
      } else {
        sidewalk(m, rr, seg.x, seg.x + seg.w);
        if (seg.kind === 'alley') res = paintBoosterCorner(m, seg.x, G, rr, boosterItems, R);
        else {
          const st = stores.find((s) => s.id === seg.id);
          res = FACADES[st.id](m, seg.x, G, rr, itemsByStore[st.id], R);
          if (!openById[st.id]) construction(m, seg.x, G, res, st, rr);
        }
      }
      info[i] ??= res;
    } });
  });
  painters.push({ x0: 0, x1: W, seed: 61, fn: (m) => {
    const eu = segOf('europe').x + 40;
    oval(m, eu, 236, 9, 2.4, '#4a4e6a', LW); line(m, [[eu - 6, 236], [eu + 6, 236]], 0.5, '#6a6e8a');
    const pdl = segOf('asia').x + 90;
    oval(m, pdl, 238, 14, 2.4, C.sky, 0.6); line(m, [[pdl - 6, 237.4], [pdl + 2, 237.2]], 0.8, '#ffffff');
    const bn = segOf('canada').x + 66;
    poly(m, [[bn - 4, 210], [bn, 207], [bn + 4, 210], [bn + 1, 209], [bn - 1, 209]], C.yellow, 0.6);
    const ic = segOf('north-america').x + 130;
    oval(m, ic, 211.4, 3.8, 1.3, C.hotpink, 0.6); poly(m, [[ic + 2, 210.8], [ic + 7, 209], [ic + 6.6, 211.4]], '#e0a060', 0.5);
  } });
  const main = tiled(W, MAIN_H, R, painters);
  const doors = {}, tops = {}, neon = [], peeks = [];
  const fx = { steam: [], smoke: [] };
  let alleyInfo = null, laundry = null;
  segs.forEach((seg, i) => {
    const res = info[i];
    seg.roofL = res.roofL; seg.roofR = res.roofR; seg.wallL = res.wallL; seg.wallR = res.wallR;
    if (seg.kind === 'alley') { alleyInfo = res; neon.push(...res.neon); fx.steam.push({ ...res.steam, p: [] }); }
    else if (seg.kind === 'store') {
      doors[seg.id] = res.door;
      tops[seg.id] = res.top;
      if (openById[seg.id]) { neon.push(...res.neon); peeks.push(...res.windows); if (res.laundry) laundry = res.laundry; }
      if (res.smoke && openById[seg.id]) fx.smoke.push({ ...res.smoke, p: [] });
    }
  });
  fx.steam.push({ x: segOf('europe').x + 40, y: 235, p: [], road: true });

  // ---------- cross streets: rows of buildings receding to the horizon ----------
  const crossRows = segs.filter((s) => s.kind === 'cross').map((seg, k) => {
    const rr = rng(500 + k);
    const row = (first) => {
      const out = [];
      let z = 0;
      if (first) { out.push({ z0: 0, z1: ZS, top: first.top, color: first.color, win: true }); z = ZS + 2; }
      while (z < 1400) {
        const len = 30 + rr() * 70, top = G - (60 + rr() * 110);
        out.push({ z0: z, z1: z + len, top, color: pick(rr, [C.hotpink, C.blue, C.purple, C.redorange, C.teal, '#ff8a1f', '#8a5ad8', C.magenta]), win: true });
        z += len + 1;
      }
      return out;
    };
    const left = segs[segs.indexOf(seg) - 1], right = segs[segs.indexOf(seg) + 1];
    return {
      seg,
      L: row(left ? { top: left.roofR, color: left.wallR } : null),
      R: row(right ? { top: right.roofL, color: right.wallL } : null),
    };
  });

  // ---------- FOREGROUND props (sprites in front of people) ----------
  const fg = [];
  const lampS = sprite(26, 104, R, (x) => lampPost(x, 3, 103));
  const poleS = sprite(26, 180, R, (x) => pole(x, 11, 179));
  const hydS = sprite(14, 17, R, (x) => hydrant(x, 3, 16.6));
  const canS = [0, 1].map((k) => sprite(15, 19, R, (x, rr) => trashCan(x, 1.6, 18.6, rr), 40 + k));
  segs.forEach((seg, i) => {
    if (seg.kind !== 'store') return;
    if (segs[i - 1]?.kind === 'store') fg.push({ c: lampS, x: seg.x - 4, y: CURB - 103 });
    fg.push(i % 2 ? { c: hydS, x: seg.x + 20, y: CURB - 16.6 } : { c: canS[i % 4 ? 0 : 1], x: seg.x + 18, y: CURB - 18.6 });
  });
  fg.push({ c: sprite(14, 23, R, (x) => mailbox(x, 0.6, 22.6)), x: segOf('north-america').x + 138, y: CURB - 22.6 });
  fg.push({ c: sprite(12, 28, R, (x) => meter(x, 4, 27.6)), x: segOf('canada').x + 112, y: CURB - 27.6 });
  fg.push({ c: sprite(12, 17, R, (x) => newsBox(x, 0.6, 16.6, C.blue)), x: segOf('europe').x + 139, y: CURB - 16.6 });
  fg.push({ c: sprite(12, 17, R, (x) => newsBox(x, 0.6, 16.6, C.red)), x: segOf('oceania').x + 30, y: CURB - 16.6 });
  fg.push({ c: sprite(30, 17, R, (x) => bench(x, 1, 16.6)), x: segOf('africa').x + 60, y: CURB - 16.6 });
  const signals = [];
  segs.filter((s) => s.kind === 'cross').forEach((seg) => {
    const px = seg.end ? seg.x + 12 : seg.x + seg.w - 18;
    fg.push({ c: sprite(36, 120, R, (x) => signalPole(x, 14, 119, seg.street)), x: px - 14, y: CURB - 119 });
    signals.push({ x: px, phase: seg.end ? 4 : 0 });
  });
  const poles = [];
  segs.forEach((seg, i) => { if (seg.kind === 'store' && i % 2 === 0 && segs[i - 1]?.kind === 'store') { fg.push({ c: poleS, x: seg.x - 12, y: CURB - 179 }); poles.push(seg.x + 0.5); } });
  for (const [px0, t, c] of [[segs[2].x + 24, 'sedan', C.green], [segOf('europe').x + 88, 'hatch', '#ff8a1f'], [segOf('oceania').x + 40, 'lowrider', C.purple]]) {
    fg.push({ c: carFrames(t, c, R).frames[0], x: px0, y: PARK - 30 });
  }
  const sneakS = sprite(14, 18, R, (x) => {
    line(x, [[7, 0], [4, 8]], 0.5); line(x, [[7, 0], [10, 7]], 0.5);
    for (const [sx, sy] of [[1, 8], [7, 7]]) { poly(x, [[sx, sy], [sx + 6, sy + 1.6], [sx + 6.4, sy + 5], [sx, sy + 5]], '#ffffff', LW, 1); rect(x, sx, sy + 4, 6.4, 1.2, C.red, 0.5); }
  });
  const shoeToss = poles.length > 2 ? { x: (poles[1] + poles[2]) / 2, y: CURB - 168 + 10 } : null;

  // ---------- skylines ----------
  const farW = Math.ceil(W * 0.3 + 820), midW = Math.ceil(W * 0.6 + 820);
  const Rb = Math.min(R, 3);
  const farP = [];
  for (let x = 0; x < farW; ) {
    const w = 26 + Math.floor(r() * 40), h = 70 + Math.floor(r() * 110), bx = x, seed = 2000 + x;
    farP.push({ x0: bx - 4, x1: bx + w + 4, seed, fn: (f, rr) => {
      const col = pick(rr, ['#a9c2f2', '#b9b0f0', '#9fd0f0', '#c4b4ec']);
      rect(f, bx, 230 - h, w, h + 2, col, 0.6);
      f.fillStyle = shade(col, -0.12);
      for (let wy = 230 - h + 6; wy < 226; wy += 8) for (let wx = bx + 4; wx < bx + w - 4; wx += 6) if (rr() < 0.55) f.fillRect(wx, wy, 2.4, 3.4);
      if (rr() < 0.3) line(f, [[bx + w / 2, 230 - h], [bx + w / 2, 230 - h - 12]], 0.7, shade(col, -0.2));
    } });
    x += w + Math.floor(r() * 5);
  }
  const far = tiled(farW, 232, Rb, farP);
  const midP = [];
  const BILLS = [['FIZZO COLA', C.red, '#ffffff'], ['WE BUY GOLD', C.yellow, C.red], ['BAIL BONDS', '#ffffff', C.blue], ['EAT HERE GET GAS', C.lime, K], ['NO LOITERING (MUCH)', C.hotpink, '#ffffff']];
  let bi = 0;
  for (let x = 0; x < midW; ) {
    const w = 44 + Math.floor(r() * 56), h = 70 + Math.floor(r() * 100), bx = x, seed = 4000 + x;
    const bill = r() < 0.24 ? BILLS[bi++ % BILLS.length] : null;
    midP.push({ x0: bx - 40, x1: bx + w + 40, seed, fn: (f, rr) => {
      const col = pick(rr, [C.blue, C.purple, C.hotpink, C.teal, '#5a6ae0', '#e0508a', '#8a5ad8']);
      rect(f, bx, 202 - h, w, h + 2, col, LW);
      for (let wy = 202 - h + 8; wy < 196; wy += 13) for (let wx = bx + 5; wx < bx + w - 8; wx += 10) rect(f, wx, wy, 5, 7, rr() < 0.15 ? C.winLit : C.win, 0);
      rect(f, bx - 1.6, 202 - h - 2, w + 3.2, 3, shade(col, -0.2), LW * 0.8);
      if (rr() < 0.45) {
        const tx = bx + 6 + rr() * (w - 22);
        for (const lx of [tx + 2, tx + 12]) line(f, [[lx, 202 - h - 2], [lx, 202 - h - 9]], 0.9);
        rrect(f, tx, 202 - h - 22, 14, 13, 1, '#3a2a30', LW);
        poly(f, [[tx - 1, 202 - h - 22], [tx + 7, 202 - h - 28], [tx + 15, 202 - h - 22]], '#3a2a30', LW);
      }
      if (bill) {
        const bw = Math.max(48, measure(bill[0], 6.4, FONT.slab) + 10);
        for (const lx of [bx + 8, bx + bw - 4]) line(f, [[lx, 202 - h - 2], [lx, 202 - h - 9]], 0.9);
        rect(f, bx + 2, 202 - h - 25, bw, 16, bill[1], LW);
        text(f, bill[0], bx + 2 + bw / 2, 202 - h - 17, { size: 6.4, font: FONT.slab, fill: bill[2], stroke: bill[2] === K ? null : K, sw: 0.6 });
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
    peds.push({ item: top, sp: buildWalker(spec, Rc), x: r() * W, y: 200 + Math.floor(r() * 14), dir: r() > 0.5 ? 1 : -1, speed: 16 + r() * 10, t: r() * 8, pause: 0 });
  }
  const loiter = [];
  const spots = [['north-america', 6, 199], ['north-america', 102, 201], ['europe', 118, 200], ['africa', 150, 202], ['oceania', 112, 199], ['canada', 6, 200], ['asia', 112, 201]];
  spots.forEach(([sid, ox, y], i) => {
    if (!openById[sid]) return;
    const top = pick(r, tops2);
    const spec = { ...pedestrianSpec(top, null, pick(r, shoes), r), pose: { left: i % 2 ? 'hips' : 'down', right: i % 3 ? 'down' : 'hips' } };
    loiter.push({ item: top, sp: buildStander(spec, Rc), x: segOf(sid).x + ox, y, t: r() * 8, off: Math.floor(r() * 4), say: balloon([SLANG[sid][i % 2]], R, { size: 5.4, tail: 0.3, tailDir: -2 }) });
  });
  const booster = buildStander(BOOSTER, Rc);
  const heads = NEIGHBOURS.map((n) => buildHead(n, R));
  const pigeons = pigeonFrames(R);
  const cat = catFrames(R);
  const dog = dogFrames(R);
  const dogAt = openById['north-america'] ? { x: segOf('north-america').x + 112, y: 203 } : null;
  const flocks = [segs[3].x + 60, segOf('asia').x + 30, W - 260].map((x) => ({ x, birds: [0, 8, 17].map((o) => ({ o, peck: 0 })), flying: 0 }));

  // ---------- labels + balloons ----------
  const tagCanvas = (st, hover) => openById[st.id]
    ? pill(hover ? `${st.region.toUpperCase()}  › WALK IN` : st.region.toUpperCase(), countById[st.id], hover ? C.yellow : '#ffffff', K, R)
    : pill(`${st.region.toUpperCase()} • CLOSED`, null, C.orange, K, R);
  const tags = Object.fromEntries(stores.map((s) => [s.id, { n: tagCanvas(s, false), h: tagCanvas(s, true) }]));
  const bTags = { n: pill('BOOSTER CORNER', 'RARE', '#2a2f6b', C.gold, R), h: pill('BOOSTER CORNER › THE TRUNK', null, C.gold, K, R) };
  const bubble = balloon(["AIN'T NOBODY", 'GOT THESE.'], R, { size: 6.6, colors: [K, C.gold], tail: 0.82 });
  const zzz = sprite(8, 8, R, (x) => text(x, 'Z', 4, 4, { size: 7, font: FONT.block, fill: '#ffffff', stroke: K, sw: 1 }));

  // ---------- camera + view ----------
  let scale = 3, dpr = 1, viewW = 400, viewH = 300, mainY = 0;
  let camX = 0, walking = null, vel = 0, bob = 0;
  const clouds = [0, 1, 2, 3, 4].map((i) => {
    const w = 36 + i * 8;
    const c = sprite(w + 4, 24, Rb, (x) => {
      const bumps = [[0.2, 0.62, 0.17], [0.38, 0.42, 0.22], [0.6, 0.38, 0.2], [0.8, 0.6, 0.16]];
      const all = () => { x.beginPath(); for (const [bx, by, br] of bumps) { x.moveTo(2 + bx * w + br * w, by * 24); x.ellipse(2 + bx * w, by * 24, br * w, br * w * 0.9, 0, 0, Math.PI * 2); } x.moveTo(2 + 0.9 * w, 0.72 * 24); x.ellipse(2 + 0.5 * w, 0.72 * 24, 0.4 * w, 0.16 * 24, 0, 0, Math.PI * 2); };
      all(); x.lineWidth = LW * 2.2; x.strokeStyle = K; x.stroke();
      all(); x.fillStyle = '#ffffff'; x.fill();
      x.fillStyle = '#d8eef8';
      x.beginPath(); x.ellipse(2 + 0.5 * w, 0.78 * 24, 0.34 * w, 0.08 * 24, 0, 0, Math.PI * 2); x.fill();
    }, 70 + i);
    return { c, w: w + 4, x: i * 170 + 30, y: 12 + (i % 3) * 20, v: 2 + i * 0.6 };
  });
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
  cv.addEventListener('pointerdown', (e) => { down = { x: e.clientX, cam: camX, lastX: e.clientX, lastT: performance.now() }; vel = 0; });
  addEventListener('pointermove', (e) => {
    if (!active) return;
    if (down) {
      const dx = e.clientX - down.x;
      if (!down.drag && Math.abs(dx) > 6) { down.drag = true; cv.classList.add('dragging'); if (walking) { walking.res(false); walking = null; } }
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
  addEventListener('keydown', (e) => { if (!active || e.target.closest?.('input')) return; if (['ArrowRight', 'ArrowLeft', 'd', 'a'].includes(e.key)) keys.add(e.key); });
  addEventListener('keyup', (e) => keys.delete(e.key));

  // ---------- simulation ----------
  let t = 0, tk = -1, entering = null, enterT = 0;
  const onScreen = (x, pad = 0) => x > camX - pad && x < camX + viewW + pad;
  const neonState = neon.map(() => ({ on: true, next: Math.random() * 6 }));
  const peek = { w: null, t: 0, next: 2, head: 0 };
  const birds = { x: -100, y: 30, v: 0 };
  const cars = [];
  let nextCar = 1.5;
  function puffs(src, dt, rate, life, rise = 9) {
    src.acc = (src.acc || 0) + dt * rate;
    while (src.acc > 1) { src.acc--; src.p.push({ x: src.x + (Math.random() - 0.5) * 4, y: src.y, life: 0, s: 0.8 + Math.random() * 0.5 }); }
    for (const p of src.p) { p.life += dt; p.y -= dt * rise; p.x += Math.sin(p.life * 2.4 + p.s * 9) * dt * 4; }
    src.p = src.p.filter((p) => p.life < life);
  }
  function update(dt) {
    if (!active) return;
    t += dt;
    // characters animate on held frames (12 a second) for that jumpy cartoon timing
    const nt = Math.floor(t * 12);
    if (nt !== tk) {
      tk = nt;
      for (const p of peds) { p.dx = p.x; p.df = Math.floor(p.t) % 8; }
    }
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
    bob = moving ? Math.abs(Math.sin(t * 9)) * 1.2 : bob * 0.8;
    for (const p of peds) {
      if (p.pause > 0) p.pause -= dt;
      else { p.x += p.dir * p.speed * dt; p.t += dt * p.speed * 0.5; }
      if (p.x > W + 20) p.x = -20;
      if (p.x < -20) p.x = W + 20;
    }
    nextCar -= dt;
    if (nextCar <= 0 && cars.length < 2) {
      const dir = Math.random() > 0.5 ? 1 : -1;
      const cf = carFrames(carType(r), pick(r, [C.green, C.red, C.blue, C.yellow, '#e8e4f2', C.purple, C.hotpink, C.orange, C.teal]), R, dir);
      cars.push({ ...cf, dir, x: dir > 0 ? camX - cf.w - 40 : camX + viewW + 40, speed: 70 + Math.random() * 40, p: [], acc: 0 });
      nextCar = 5 + Math.random() * 8;
    }
    for (const c of cars) {
      c.x += c.dir * c.speed * dt;
      const tail = c.dir > 0 ? c.x + 1 : c.x + c.w - 1;
      c.acc += dt * 6;
      while (c.acc > 1) { c.acc--; c.p.push({ x: tail - c.dir * 2, y: LANE - 8, life: 0, s: 0.45 + Math.random() * 0.3 }); }
      for (const p of c.p) { p.life += dt; p.y -= dt * 3; p.x -= c.dir * dt * 8; }
      c.p = c.p.filter((p) => p.life < 0.9);
    }
    for (let i = cars.length - 1; i >= 0; i--) if ((cars[i].dir > 0 && cars[i].x > camX + viewW + 120) || (cars[i].dir < 0 && cars[i].x < camX - 160)) cars.splice(i, 1);
    for (const fl of flocks) {
      if (fl.flying > 0) fl.flying -= dt;
      else if (peds.some((p) => Math.abs(p.x - fl.x - 8) < 10 && p.pause <= 0)) fl.flying = 3;
      for (const b of fl.birds) if (Math.random() < dt * 1.5) b.peck = b.peck ? 0 : 1;
    }
    neonState.forEach((st) => { st.next -= dt; if (st.next <= 0) { st.on = !st.on; st.next = st.on ? 2 + Math.random() * 8 : 0.05 + Math.random() * 0.25; } });
    // nosy neighbours pop up in windows
    peek.next -= dt;
    if (peek.w) { peek.t += dt; if (peek.t > 2.8) peek.w = null; }
    else if (peek.next <= 0) {
      const vis = peeks.filter((w) => onScreen(w[0] + w[2] / 2, -10));
      if (vis.length) { peek.w = pick(Math.random, vis); peek.t = 0; peek.head = Math.floor(Math.random() * heads.length); }
      peek.next = 2.5 + Math.random() * 3;
    }
    if (birds.v === 0 && Math.random() < dt * 0.08) { birds.v = 20 + Math.random() * 12; birds.x = camX - 30; birds.y = 18 + Math.random() * 40; }
    if (birds.v) { birds.x += birds.v * dt; if (birds.x > camX + viewW + 40) birds.v = 0; }
    for (const s of fx.steam) puffs(s, dt, 5, 2.4);
    for (const s of fx.smoke) puffs(s, dt, 3.5, 2.4);
    for (const c of clouds) c.x += c.v * dt;
    if (entering) enterT += dt;
    render();
  }

  // ---------- render ----------
  const drawFig = (fr, x, y, flip) => {
    ctx.fillStyle = 'rgba(22,18,28,0.18)';
    ctx.beginPath();
    ctx.ellipse(x, y, 7.6, 1.6, 0, 0, Math.PI * 2);
    ctx.fill();
    if (flip) { ctx.save(); ctx.translate(x, y); ctx.scale(-1, 1); ctx.drawImage(fr, -FOX, -FOY, FW, FH); ctx.restore(); }
    else ctx.drawImage(fr, x - FOX, y - FOY, FW, FH);
  };
  // cartoon puffs: one ink rim around the whole cluster, then the fill
  function drawPuffs(list, fill, life, ox, oy) {
    if (!list.length) return;
    const rad = (p) => { const k = p.life / life; return (k < 0.75 ? 1.4 + k * 5 : (1 - k) * 4 * 5.15) * p.s; };
    ctx.beginPath();
    for (const p of list) { const rr = rad(p) + 0.7; ctx.moveTo(p.x - ox + rr, p.y + oy); ctx.arc(p.x - ox, p.y + oy, rr, 0, Math.PI * 2); }
    ctx.fillStyle = K; ctx.fill();
    ctx.beginPath();
    for (const p of list) { const rr = rad(p); ctx.moveTo(p.x - ox + rr, p.y + oy); ctx.arc(p.x - ox, p.y + oy, rr, 0, Math.PI * 2); }
    ctx.fillStyle = fill; ctx.fill();
  }
  function quad(pts, fill, lw = LW) {
    ctx.beginPath();
    ctx.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
    ctx.closePath();
    if (fill) { ctx.fillStyle = fill; ctx.fill(); }
    if (lw) { ctx.lineWidth = lw; ctx.strokeStyle = K; ctx.stroke(); }
  }
  // perspective: a point on the building line at depth z, already in screen units
  let vpx = 0, ox = 0, oy = 0;
  const P = (x, y, z) => { const d = z / (z + Z0); return [x + (vpx - x) * d - ox, y + (HOR - y) * d + oy]; };
  function sideFace(x, top, color, z0 = 0, z1 = ZS) {
    quad([P(x, G, z0), P(x, top, z0), P(x, top, z1), P(x, G, z1)], shade(color, -0.2));
    ctx.beginPath();
    for (let fy = top + 10; fy < G - 58; fy += 24) {
      const a = P(x, fy, z0 + (z1 - z0) * 0.3), b = P(x, fy, z0 + (z1 - z0) * 0.7), c = P(x, fy + 12, z0 + (z1 - z0) * 0.7), d = P(x, fy + 12, z0 + (z1 - z0) * 0.3);
      if (Math.abs(b[0] - a[0]) < 0.5) break;
      ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.lineTo(c[0], c[1]); ctx.lineTo(d[0], d[1]); ctx.closePath();
    }
    ctx.fillStyle = C.win; ctx.fill();
  }
  function crossStreet(cr) {
    const s = cr.seg, x0 = s.x, x1 = s.x + s.w, xa = x0 + 26, xb = x1 - 26;
    if (x1 < camX - 40 || x0 > camX + viewW + 40) return;
    const zf = 4000;
    // ground behind the building line, the road narrowing to the vanishing point, curbs and a dashed centre line
    quad([[x0 - ox, HOR + oy], [x1 - ox, HOR + oy], [x1 - ox, G + 0.6 + oy], [x0 - ox, G + 0.6 + oy]], C.walk, 0);
    quad([P(xa, G, 0), P(xa, G, zf), P(xb, G, zf), P(xb, G, 0)], C.road, 0);
    for (const ex of [xa, xb]) { const a = P(ex, G, 0), b = P(ex, G, zf); ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.lineWidth = 0.8; ctx.strokeStyle = K; ctx.stroke(); }
    ctx.beginPath();
    for (let z = 6; z < 1200; z += z * 0.35 + 8) { const a = P((xa + xb) / 2 - 1, G, z), b = P((xa + xb) / 2 - 1, G, z + z * 0.16 + 4), c = P((xa + xb) / 2 + 1, G, z + z * 0.16 + 4), d = P((xa + xb) / 2 + 1, G, z); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.lineTo(c[0], c[1]); ctx.lineTo(d[0], d[1]); ctx.closePath(); }
    ctx.fillStyle = C.lane; ctx.fill();
    // receding lamp posts
    ctx.beginPath();
    for (const z of [60, 160, 300, 520]) for (const ex of [xa - 6, xb + 6]) { const a = P(ex, G, z), b = P(ex, G - 70, z), c = P(ex + (ex < xa ? 8 : -8), G - 70, z); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.lineTo(c[0], c[1]); }
    ctx.lineWidth = 0.8; ctx.strokeStyle = '#2e6b4a'; ctx.stroke();
    // building rows facing the cross street (back-facing rows are hidden behind our row anyway)
    const row = (list, ax, faceRight) => {
      if (faceRight ? vpx <= ax : vpx >= ax) return;
      for (let i = list.length - 1; i >= 0; i--) {
        const b = list[i];
        const q = [P(ax, G, b.z0), P(ax, b.top, b.z0), P(ax, b.top, b.z1), P(ax, G, b.z1)];
        if (Math.abs(q[2][0] - q[1][0]) < 0.2 && i > 0) continue;
        quad(q, i === 0 && list[0].z1 === ZS ? shade(b.color, -0.2) : b.color, i > 3 ? 0.5 : LW);
        ctx.beginPath();
        for (let fy = b.top + 8; fy < G - 14; fy += 20) {
          for (let z = b.z0 + 6; z < b.z1 - 8; z += 18) {
            const a = P(ax, fy, z), bb = P(ax, fy, z + 9);
            if (Math.abs(bb[0] - a[0]) < 0.5) continue;
            const c = P(ax, fy + 11, z + 9), d = P(ax, fy + 11, z);
            ctx.moveTo(a[0], a[1]); ctx.lineTo(bb[0], bb[1]); ctx.lineTo(c[0], c[1]); ctx.lineTo(d[0], d[1]); ctx.closePath();
          }
        }
        ctx.fillStyle = C.win; ctx.fill();
      }
    };
    row(cr.L, x0, true);
    row(cr.R, x1, false);
  }

  function render() {
    const k = scale * dpr;
    ctx.setTransform(k, 0, 0, k, 0, 0);
    ctx.imageSmoothingEnabled = true;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    const cx = camX;
    oy = mainY + bob; ox = cx; vpx = cx + viewW / 2;
    ctx.fillStyle = C.sky;
    ctx.fillRect(0, 0, viewW, viewH);
    for (const c of clouds) {
      const span = viewW + c.w + 60;
      const x = ((((c.x - cx * 0.08) % span) + span) % span) - c.w - 30;
      ctx.drawImage(c.c, x, c.y + bob * 0.2, c.w, 24);
    }
    if (birds.v) for (let i = 0; i < 3; i++) {
      const bx = birds.x - cx + i * 7 - (i === 1 ? 4 : 0), by = birds.y + (i % 2) * 4, f = Math.sin(t * 14 + i) * 2;
      ctx.beginPath(); ctx.moveTo(bx - 3.4, by - f); ctx.quadraticCurveTo(bx - 1.4, by - 1.6, bx, by); ctx.quadraticCurveTo(bx + 1.4, by - 1.6, bx + 3.4, by - f);
      ctx.lineWidth = 0.8; ctx.strokeStyle = K; ctx.stroke();
    }
    const baseY = oy + G;
    far.draw(ctx, cx * 0.3, baseY - 232 - 34 - bob * 0.5, viewW);
    mid.draw(ctx, cx * 0.6, baseY - 204 - 4 - bob * 0.25, viewW);
    for (const cr of crossRows) crossStreet(cr);
    // side walls of the taller building at each party wall, swung toward the vanishing point
    for (let i = 0; i < segs.length - 1; i++) {
      const A = segs[i], B = segs[i + 1];
      if (A.kind === 'cross' || B.kind === 'cross') continue;
      const xb = B.x;
      if (xb < cx - 80 || xb > cx + viewW + 80) continue;
      if (A.roofR < B.roofL - 1 && xb < vpx) sideFace(xb, A.roofR, A.wallR);
      else if (B.roofL < A.roofR - 1 && xb > vpx) sideFace(xb, B.roofL, B.wallL);
    }
    main.draw(ctx, cx, oy, viewW);
    neon.forEach((n, i) => {
      if (n.x + n.n.w < cx || n.x > cx + viewW) return;
      ctx.drawImage(neonState[i].on ? n.n.on : n.n.off, n.x - cx, oy + n.y, n.n.w, n.n.h);
    });
    // a neighbour pops up in a window
    if (peek.w) {
      const [wx, wy, ww, wh] = peek.w;
      const k2 = Math.round((peek.t < 0.3 ? peek.t / 0.3 : peek.t > 2.5 ? Math.max(0, (2.8 - peek.t) / 0.3) : 1) * 3) / 3;
      const hs = Math.min(ww, wh) / 15;
      ctx.save();
      ctx.beginPath(); ctx.rect(wx - cx, wy + oy, ww, wh); ctx.clip();
      ctx.drawImage(heads[peek.head], wx - cx + ww / 2 - 15 * hs, wy + oy + wh - 26 * hs * k2 + Math.sin(t * 6) * 0.3, 30 * hs, 30 * hs);
      ctx.restore();
    }
    if (laundry && onScreen(laundry.x0, 40)) {
      const cols = ['#ffdf00', '#009739', '#ffffff', C.red, C.blue];
      for (let i = 0; i < 5; i++) {
        const lx = laundry.x0 + 6 + i * ((laundry.x1 - laundry.x0 - 12) / 4), ly = laundry.y + Math.sin(((lx - laundry.x0) / (laundry.x1 - laundry.x0)) * Math.PI) * 4;
        ctx.save(); ctx.translate(lx - cx, ly + oy); ctx.rotate(Math.sin(t * 2.4 + i) * 0.18);
        rrect(ctx, -3, 0, 6, 6 + (i % 2) * 2, 0.6, cols[i], LW * 0.8);
        ctx.restore();
      }
    }
    if (entering) {
      const d = doors[entering];
      ctx.fillStyle = '#ffe066';
      ctx.fillRect(d.x - cx, oy + d.y, d.w, d.h);
      const open = Math.min(1, enterT / 0.25);
      quad([[d.x - cx, oy + d.y], [d.x - cx + d.w * (1 - open * 0.75), oy + d.y - 2 * open], [d.x - cx + d.w * (1 - open * 0.75), oy + d.y + d.h + 2 * open], [d.x - cx, oy + d.y + d.h]], '#3a3648');
    }
    // the van's cat + the booster leaning by the open trunk
    if (alleyInfo) {
      ctx.drawImage(cat[Math.floor(tk / 8) % 2], alleyInfo.cat.x - cx, oy + alleyInfo.cat.y - 2, 20, 16);
      const b = alleyInfo.booster;
      const near = Math.abs(b.x + 30 - (cx + viewW / 2)) < viewW * 0.35 || hover === 'booster';
      const ph = (tk / 12) % 3.2, beat = Math.floor(tk / 4);
      const bf = near && ph > 0.4 && ph < 2.2 ? [booster.talk, booster.point, booster.talk2, booster.point][beat % 4] : (tk / 12) % 4.4 < 0.15 ? booster.blink : beat % 2 ? booster.bob : booster.idle;
      drawFig(bf, b.x - cx, oy + b.y - 7, false);
      if (near) ctx.drawImage(bubble, b.x - bubble.uw * 0.82 + 2 - cx, oy + b.y - 7 - FH - bubble.uh + 8, bubble.uw, bubble.uh);
      const tg = bTags[hover === 'booster' ? 'h' : 'n'];
      ctx.drawImage(tg, b.x + 36 - tg.uw / 2 - cx, Math.max(uiTop() / scale, oy + G - 172), tg.uw, tg.uh);
    }
    // people, dog and pigeons, back to front
    const actors = [
      ...loiter.map((l) => ({ y: l.y, draw: () => {
        const ph = (tk / 12 + l.t) % 8, beat = Math.floor((tk + l.off) / 4);
        const talking = ph > 4.4 && ph < 6.4;
        const sp = l.sp;
        const fr = talking ? [sp.talk, sp.talk2, sp.talk, sp.point, sp.talk, sp.thumb][beat % 6]
          : ph >= 6.4 && ph < 6.7 ? sp.hop
          : ph >= 6.7 ? (ph < 7.6 ? sp.look : sp.idle)
          : ph % 2.2 < 0.15 ? sp.blink : beat % 2 ? sp.bob : sp.idle;
        drawFig(fr, l.x - cx, oy + l.y, false);
        if (talking && onScreen(l.x)) ctx.drawImage(l.say, l.x - cx - 4, oy + l.y - FH - l.say.uh + 8, l.say.uw, l.say.uh);
      } })),
      ...peds.map((p) => ({ y: p.y, draw: () => drawFig(p.pause > 0 ? p.sp.idle : p.sp.frames[p.df ?? 0], (p.pause > 0 ? p.x : p.dx ?? p.x) - cx, oy + p.y, p.dir < 0) })),
      ...(dogAt ? [{ y: dogAt.y, draw: () => {
        ctx.drawImage(dog[Math.floor(tk / 9) % 2], dogAt.x - cx, oy + dogAt.y - 16, 34, 17);
        for (let i = 0; i < 2; i++) { const zt = (t * 0.5 + i * 0.5) % 1; ctx.globalAlpha = 1 - zt; ctx.drawImage(zzz, dogAt.x + 24 - cx + zt * 6, oy + dogAt.y - 18 - zt * 14, 5 + zt * 3, 5 + zt * 3); }
        ctx.globalAlpha = 1;
      } }] : []),
      ...flocks.flatMap((fl) => fl.birds.map((b, i) => ({ y: 213, draw: () => {
        if (fl.flying > 0) { const lift = Math.floor((3 - fl.flying) * 12) / 12 * 26; ctx.drawImage(pigeons[2 + ((tk + i) % 2)], fl.x + b.o + lift * 0.8 - cx, oy + 203 - lift - i * 3, 14.4, 11.7); }
        else ctx.drawImage(pigeons[b.peck], fl.x + b.o - cx, oy + 202, 14.4, 11.7);
      } }))),
    ].sort((a, b) => a.y - b.y);
    for (const a of actors) a.draw();
    for (const s of fx.smoke) drawPuffs(s.p, '#b8b2c8', 2.4, cx, oy);
    for (const s of fx.steam) if (!s.road) drawPuffs(s.p, '#ffffff', 2.4, cx, oy);
    // foreground street furniture, signals, wires, the sneakers on the line
    for (const p of fg) if (p.x + p.c.uw > cx && p.x < cx + viewW) ctx.drawImage(p.c, p.x - cx, oy + p.y, p.c.uw, p.c.uh);
    for (const s of signals) {
      if (!onScreen(s.x, 30)) continue;
      const cyc = (t + s.phase) % 9, lamp = cyc < 4 ? 2 : cyc < 5 ? 1 : 0;
      ['#ff3030', '#ffc21a', '#3ce05a'].forEach((c, i) => { if (i === lamp) oval(ctx, s.x + 7.5 - cx, oy + CURB - 95 + i * 6.6, 2.1, 2.1, c, 0); });
      const walk = lamp === 0;
      ctx.fillStyle = walk ? '#ffffff' : '#ff6a3a';
      if (walk) { oval(ctx, s.x - 4.5 - cx, oy + CURB - 70, 0.9, 0.9, '#ffffff', 0); line(ctx, [[s.x - 4.5 - cx, oy + CURB - 69], [s.x - 4.5 - cx, oy + CURB - 66.6], [s.x - 6 - cx, oy + CURB - 64.6]], 0.8, '#ffffff'); line(ctx, [[s.x - 4.5 - cx, oy + CURB - 66.6], [s.x - 3 - cx, oy + CURB - 64.6]], 0.8, '#ffffff'); }
      else if (Math.floor(t * 2) % 2 || cyc < 4) rrect(ctx, s.x - 6.2 - cx, oy + CURB - 70.4, 3.4, 4.6, 1, '#ff6a3a', 0);
    }
    ctx.lineWidth = 0.55;
    ctx.strokeStyle = K;
    ctx.beginPath();
    for (let i = 1; i < poles.length; i++) {
      if (poles[i] < cx || poles[i - 1] > cx + viewW) continue;
      for (const [dx, dy] of [[-8, 0], [10, 0], [-6, 12]]) {
        const y = oy + CURB - 168 + dy, x0 = poles[i - 1] - cx + dx, x1 = poles[i] - cx + dx;
        ctx.moveTo(x0, y);
        ctx.quadraticCurveTo((x0 + x1) / 2, y + 18, x1, y);
      }
    }
    ctx.stroke();
    if (shoeToss && onScreen(shoeToss.x, 20)) {
      ctx.save();
      ctx.translate(shoeToss.x - cx, oy + shoeToss.y);
      ctx.rotate(Math.sin(t * 1.6) * 0.14);
      ctx.drawImage(sneakS, -7, 0, 14, 18);
      ctx.restore();
    }
    // traffic: bouncing bodies + exhaust puffs
    for (const c of cars) {
      const sx2 = c.x - cx, y = oy + LANE - 30 - ((tk + Math.round(c.speed)) % 3 === 0 ? 1 : 0);
      drawPuffs(c.p, '#ffffff', 0.9, cx, oy);
      const fr = c.frames[tk % 2];
      ctx.drawImage(fr, sx2, y, c.w, 32);
    }
    for (const s of fx.steam) if (s.road) drawPuffs(s.p, '#ffffff', 2.4, cx, oy);
    for (const seg of segs) if (seg.kind === 'store') {
      const tg = tags[seg.id][hover === seg.id ? 'h' : 'n'];
      const tx = seg.x + seg.w / 2 - tg.uw / 2 - cx;
      if (tx > -tg.uw && tx < viewW) ctx.drawImage(tg, tx, Math.max(uiTop() / scale, oy + tops[seg.id] - 16) + (hover === seg.id ? Math.sin(t * 8) * 0.8 : 0), tg.uw, tg.uh);
    }
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
    setEntering(id) { entering = id; enterT = 0; if (id) render(); },
    doorScreen(id) { const d = doors[id]; return { x: (d.x + d.w / 2 - camX) * scale, y: (mainY + d.y + d.h / 2) * scale }; },
    render,
  };
}
