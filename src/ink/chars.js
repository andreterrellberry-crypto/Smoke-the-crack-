// Gangly MAD-style cartoon people: long droopy noses, half-shut eyes, huge hinged shoes that flap when they walk.
// Frames are drawn once into canvases (world units x R). Origin = between the feet.
import { INK, C, layer, shape, blob, brush, pen, limb, letter, halftone, clipTo, ellipsePts, seedInk, shade, rng } from './ink.js';

export const CW = 46; // frame width (units)
export const CH = 66; // frame height (units)
const OX = 23, OY = 62; // feet origin inside the frame
const GOLD = C.gold, GOLD2 = C.gold2;

// ---------- shared parts ----------
function mitten(ctx, x, y, skin, s = 1) {
  blob(ctx, x, y, 2.3 * s, 2.1 * s, { fill: skin, w: 0.6, n: 10 });
  blob(ctx, x - 1.6 * s, y - 1.2 * s, 0.9 * s, 0.8 * s, { fill: skin, w: 0.5, n: 8 });
}
function shoe(ctx, heel, ang, flap, s, dir = 1, big = 1) {
  // hinged MAD shoe: heel → ball → floppy toe
  const L1 = 9 * big, L2 = 6.6 * big;
  const c = s.color || '#f4f1ea';
  const ball = [heel[0] + Math.cos(ang) * L1 * dir, heel[1] + Math.sin(ang) * L1];
  const toe = [ball[0] + Math.cos(ang + flap * dir) * L2 * dir, ball[1] + Math.sin(ang + flap * dir) * L2];
  const up = (a) => [Math.sin(a) * 1, -Math.cos(a)];
  const u1 = up(ang * dir), u2 = up((ang + flap * dir) * dir);
  const h = s.type === 'timbs' ? 5 : s.type === 'slides' ? 1.6 : 3.4;
  const pts = [heel, ball, toe, [toe[0] + u2[0] * 1.8 - dir * 0.6, toe[1] + u2[1] * 1.8], [ball[0] + u1[0] * h, ball[1] + u1[1] * h], [heel[0] + u1[0] * (h + 0.6), heel[1] + u1[1] * (h + 0.6)]];
  shape(ctx, pts, { fill: s.type === 'timbs' ? '#d9a441' : s.type === 'slides' ? (s.color || '#1a1a1a') : c, w: 0.8, step: 3, j: 0.15 });
  pen(ctx, [heel, ball, toe], { c: s.type === 'timbs' ? '#6a4320' : '#9a948a', w: 0.7, j: 0.05 });
  if (s.accent && s.type !== 'slides') pen(ctx, [[heel[0] + dir * 3, heel[1] - 1.6], [ball[0] - dir * 0.5, ball[1] - 1.8]], { c: s.accent, w: 1.1, j: 0.1 });
  if (s.type === 'slides') { pen(ctx, [[heel[0] + dir * 4, heel[1] - 1.6], [ball[0], ball[1] - 2.2]], { c: s.accent || '#f4f4f4', w: 1.4 }); }
}

// ---------- SIDE VIEW (walkers) ----------
function sideFigure(ctx, sp, phase) {
  const skin = sp.skin, t = sp.top, l = sp.legs || { type: 'jeans', color: '#3b4f7a' }, sh = sp.shoes || {};
  const legPose = (ph) => {
    const s = Math.sin(ph), cphase = Math.cos(ph);
    const a = 0.5 * s;
    const bend = cphase > 0 ? 0.95 * cphase : 0.06;
    return { a, b: a - bend, bend };
  };
  const near = legPose(phase), far = legPose(phase + Math.PI);
  const leg = (p, hip) => {
    const knee = [hip[0] + Math.sin(p.a) * 11, hip[1] + Math.cos(p.a) * 11];
    const ankle = [knee[0] + Math.sin(p.b) * 11, knee[1] + Math.cos(p.b) * 11];
    return { knee, ankle };
  };
  let hip = [0, -25];
  const ln = leg(near, hip), lf = leg(far, hip);
  const lift = -2.4 - Math.max(ln.ankle[1], lf.ankle[1]);
  hip = [0, -25 + lift];
  const LN = leg(near, hip), LF = leg(far, hip);
  const top = hip[1] - 16;
  const lw = l.type === 'baggy' || l.type === 'cargo' ? 4.8 : 3.8;
  const drawLeg = (L, p, dim) => {
    const pc = dim ? shade(l.color, -0.12) : l.color;
    const sk = dim ? shade(skin, -0.08) : skin;
    if (l.type === 'shorts') {
      const mid = [(hip[0] + L.knee[0]) / 2 + 0.6, (hip[1] + L.knee[1]) / 2 + 2];
      limb(ctx, [mid, L.knee, L.ankle], 2.4, sp.socks ? '#f6f4ee' : sk);
      limb(ctx, [hip, mid], 5.2, pc);
    } else {
      limb(ctx, [hip, L.knee, L.ankle], lw, pc);
      if (l.type === 'track') pen(ctx, [hip, L.knee, L.ankle], { c: l.accent || '#f6f4ee', w: 0.7, j: 0.05 });
      if (sp.socks) limb(ctx, [[L.ankle[0] - (L.ankle[0] - L.knee[0]) * 0.35, L.ankle[1] - (L.ankle[1] - L.knee[1]) * 0.35], L.ankle], 3, '#f6f4ee');
    }
    const planted = p.bend < 0.2;
    shoe(ctx, [L.ankle[0] - 2.4, L.ankle[1] + 2.2], planted ? 0 : 0.35 * p.bend, planted ? 0 : 0.9 * p.bend, dim ? { ...sh, color: shade(sh.color || '#f4f1ea', -0.1) } : sh);
  };
  const arm = (ang, dim, wave) => {
    const sh0 = [1.5, top + 1.5];
    const el = [sh0[0] + Math.sin(ang) * 8, sh0[1] + Math.cos(ang) * 8];
    const hd = wave ? [el[0] + 4, el[1] - 7] : [el[0] + Math.sin(ang + 0.5) * 7.5, el[1] + Math.cos(ang + 0.5) * 7.5];
    const short = ['tee', 'jersey', 'tank', 'polo'].includes(t.type);
    const sleeve = dim ? shade(t.color.startsWith('#') ? t.color : '#555555', -0.12) : t.color.startsWith('#') ? t.color : t.sleeve || '#555555';
    const sk = dim ? shade(skin, -0.08) : skin;
    const aw = t.type === 'puffer' ? 4.6 : 3.2;
    if (t.type === 'tank') limb(ctx, [sh0, el, hd], 2.4, sk);
    else if (short) { limb(ctx, [sh0, el, hd], 2.4, sk); limb(ctx, [sh0, [(sh0[0] + el[0]) / 2, (sh0[1] + el[1]) / 2]], aw + 0.6, sleeve); }
    else limb(ctx, [sh0, el, hd], aw, sleeve);
    if (t.type === 'track' && !short) pen(ctx, [sh0, el, hd], { c: t.accent || '#f6f4ee', w: 0.6, j: 0.05 });
    mitten(ctx, hd[0], hd[1], sk);
  };
  const swing = 0.65 * Math.sin(phase);
  // back to front
  if (sp.acc?.backpack) blob(ctx, -5, top + 7, 3.4, 5.6, { fill: sp.acc.backpack, w: 0.7 });
  arm(swing, true);
  drawLeg(LF, far, true);
  drawLeg(LN, near, false);
  torsoSide(ctx, sp, hip, top);
  headSide(ctx, sp, [2.8, top - 8.5]);
  arm(-swing, false, sp.pose === 'wave');
}

function torsoSide(ctx, sp, hip, top) {
  const t = sp.top, long = t.type === 'parka' || t.type === 'trench';
  const wide = t.type === 'puffer' ? 1.6 : 0;
  const hy = hip[1], bottom = long ? hy + 10 : hy + 1;
  const pts = [[-4 - wide, bottom], [-4.6 - wide, hy - 7], [-2.6 - wide, top - 0.6], [3.8 + wide, top + 0.4], [5 + wide, hy - 10], [4.8 + wide, hy - 3], [4.2 + wide, bottom]];
  const fill = t.color;
  if (t.type === 'hoodie' || t.type === 'camo') blob(ctx, -2.8, top + 0.6, 3.6, 2.6, { fill: shade(t.color.startsWith('#') ? t.color : '#444444', -0.1), w: 0.7 });
  const p = shape(ctx, pts, { fill, w: 0.9, step: 4 });
  const a = t.accent || '#f6f4ee';
  clipTo(ctx, p, () => {
    halftone(ctx, -6 - wide, top, 4, bottom - top, '#00000033', 1.4, 0.45);
    switch (t.type) {
      case 'camo': for (const [x, y, c] of [[-2, top + 3, a], [2, top + 7, shade(a, -0.25)], [-1, top + 11, a], [3, top + 2, shade(a, -0.25)]]) blob(ctx, x, y, 2.2, 1.4, { fill: c, stroke: false }); break;
      case 'flannel': for (let y = top; y < bottom; y += 2.4) pen(ctx, [[-7, y], [7, y]], { c: a, w: 0.7, j: 0.05 }); for (let x = -6; x < 7; x += 2.4) pen(ctx, [[x, top], [x, bottom]], { c: shade(a, -0.2), w: 0.5, j: 0.05 }); break;
      case 'puffer': for (let y = top + 4; y < bottom; y += 3.2) pen(ctx, [[-7, y], [8, y + 0.4]], { w: 0.5 }); break;
      case 'jersey': letter(ctx, '10', 0.6, top + 7, { size: 5.5, fill: a, stroke: INK, sw: 0.5 }); break;
      case 'tee': case 'tank': if (t.logo !== false) blob(ctx, 2, top + 5, 1.8, 1.5, { fill: a, w: 0.5 }); break;
    }
  });
  if (t.type === 'track' || t.type === 'jacket') pen(ctx, [[4.2, top + 1], [4.6, hy - 2]], { c: t.type === 'track' ? '#ece8e0' : a, w: 0.6 });
  if (t.type === 'polo') shape(ctx, [[1, top - 0.6], [4.4, top + 0.2], [3, top + 2.4]], { fill: a, w: 0.5 });
  if (t.type === 'hoodie') { pen(ctx, [[3.4, top + 1], [3.6, top + 5]], { c: '#ece8e0', w: 0.4 }); pen(ctx, [[0, hy - 5], [4.4, hy - 5]], { w: 0.5 }); }
  if (t.type === 'puffer') blob(ctx, 2.6, top - 0.4, 3, 1.8, { fill: t.color, w: 0.7 });
  const acc = sp.acc || {};
  if (acc.chain) { pen(ctx, [[2.8, top - 0.2], [4.4, top + 3.4], [3.6, top + 6]], { c: GOLD, w: 0.9, j: 0.05 }); blob(ctx, 3.7, top + 6.4, 0.9, 0.9, { fill: GOLD, w: 0.4 }); }
  if (acc.sacoche) { pen(ctx, [[-2, top + 0.4], [4.2, hy - 2]], { w: 0.7 }); shape(ctx, [[2.4, hy - 4], [6.4, hy - 4], [6.4, hy + 0.6], [2.4, hy + 0.6]], { fill: '#1d1a22', w: 0.6 }); }
  if (acc.bumbag) { pen(ctx, [[-3, hy - 2], [3.4, top + 1]], { w: 0.7 }); shape(ctx, [[1.4, top + 4], [6.6, top + 4], [6.2, top + 7.4], [1.8, top + 7.4]], { fill: acc.bumbag, w: 0.6 }); }
  if (acc.headphones) blob(ctx, 0.4, top - 1.6, 1.6, 1.4, { fill: acc.headphones, w: 0.5 });
  if (acc.phone && sp.phoneOut) shape(ctx, [[6, top + 7], [7.6, top + 7], [7.6, top + 10], [6, top + 10]], { fill: '#1d1a22', w: 0.4 });
}

function headSide(ctx, sp, hc) {
  const skin = sp.skin, [x, y] = hc;
  limb(ctx, [[x - 1.4, y + 6.8], [x - 0.6, y + 4]], 2.4, skin);
  const hairC = sp.hair?.color || '#1e1612';
  if (sp.hair?.style === 'afro') blob(ctx, x - 1, y - 2.4, 7.4, 6.6, { fill: hairC, w: 0.8, n: 18 });
  if (sp.hair?.style === 'locs' || sp.hair?.style === 'long' || sp.hair?.style === 'mullet') for (let i = 0; i < 5; i++) brush(ctx, [[x - 3.5 + i * 0.6, y - 3], [x - 5 + i * 0.5, y + 5 + (sp.hair.style === 'mullet' ? 2 : 4) + (i % 2)]], { w: 1.6, c: hairC });
  if (sp.head?.type === 'hood') blob(ctx, x - 1, y - 0.4, 6.4, 6.8, { fill: sp.head.color, w: 0.8 });
  // skull, chin, nose
  blob(ctx, x, y, 5, 5.6, { fill: skin, w: 0.85 });
  shape(ctx, [[x + 3.2, y + 3.2], [x + 5.2, y + 5.2], [x + 3.2, y + 6.6], [x + 0.2, y + 5.6]], { fill: skin, w: 0.8, step: 3 });
  shape(ctx, [[x + 4.4, y - 1.6], [x + 9.4, y + 0.4], [x + 11.8, y + 3.2], [x + 10.4, y + 5.2], [x + 7.6, y + 4.4], [x + 5, y + 2.6]], { fill: skin, w: 0.85, step: 3 });
  // half-lidded eye
  blob(ctx, x + 3.2, y - 1.6, 1.5, 1.25, { fill: '#fbf8f0', w: 0.5, n: 10 });
  blob(ctx, x + 3.8, y - 1.2, 0.45, 0.45, { fill: INK, stroke: false, n: 8 });
  shape(ctx, [[x + 1.7, y - 1.6], [x + 3.2, y - 2.9], [x + 4.7, y - 1.6]], { fill: skin, w: 0.5, step: 2 });
  brush(ctx, [[x + 1.6, y - 3.6], [x + 4.6, y - 3.2]], { w: 0.8 });
  pen(ctx, [[x + 5.2, y + 4.9], [x + 3, y + 5.2]], { w: 0.6 });
  pen(ctx, [[x - 1.6, y - 0.6], [x - 2.6, y + 0.6], [x - 1.6, y + 1.8]], { w: 0.5 });
  if (sp.acc?.beard) shape(ctx, [[x - 1, y + 2], [x + 2.6, y + 3.6], [x + 4.6, y + 5.6], [x + 2.4, y + 7.2], [x - 0.6, y + 5.6]], { fill: hairC, w: 0.6 });
  if (sp.acc?.earring) blob(ctx, x - 1.8, y + 2.2, 0.6, 0.6, { fill: GOLD, w: 0.3 });
  // hair on top
  const h = sp.hair;
  if (h && !['afro'].includes(h.style)) {
    const c = h.color;
    switch (h.style) {
      case 'fade': case 'cornrows': shape(ctx, [[x - 4.8, y - 0.4], [x - 4, y - 4.2], [x, y - 5.8], [x + 3.6, y - 4.4], [x + 1, y - 3.6], [x - 2.4, y - 2]], { fill: c, w: 0.6 }); if (h.style === 'cornrows') for (let i = 0; i < 4; i++) pen(ctx, [[x - 3.6 + i * 1.4, y - 2.4], [x - 2 + i * 1.4, y - 5.2]], { c: shade(c, 0.25), w: 0.4 }); break;
      case 'buzz': clipTo(ctx, ellipsePts(x, y, 5, 5.6), () => halftone(ctx, x - 6, y - 7, 12, 4.4, c, 1, 0.42)); break;
      case 'spiky': shape(ctx, [[x - 5, y - 1], [x - 5, y - 5], [x - 3, y - 8.2], [x - 1.6, y - 5.4], [x + 0.4, y - 9], [x + 1.4, y - 5.6], [x + 3.6, y - 7.6], [x + 3.4, y - 4], [x + 1, y - 3.2], [x - 2.6, y - 2]], { fill: c, w: 0.6, step: 2 }); break;
      case 'curly': for (let i = 0; i < 6; i++) blob(ctx, x - 4 + i * 1.5, y - 4.6 - (i % 2) * 0.8, 1.6, 1.5, { fill: c, w: 0.5, n: 8 }); break;
      case 'bun': shape(ctx, [[x - 4.8, y - 0.4], [x - 4, y - 4.2], [x, y - 5.8], [x + 3.6, y - 4.4], [x - 2.4, y - 2]], { fill: c, w: 0.6 }); blob(ctx, x - 4.6, y - 4.8, 2.2, 2, { fill: c, w: 0.6 }); break;
      case 'long': case 'locs': case 'mullet': shape(ctx, [[x - 5, y + 1], [x - 4.4, y - 4.4], [x, y - 6], [x + 3.8, y - 4.4], [x + 1, y - 3.4], [x - 2.4, y - 2]], { fill: c, w: 0.6 }); break;
    }
  }
  hatSide(ctx, sp.head, x, y);
  const e = sp.eyes;
  if (e?.type === 'juliet') shape(ctx, [[x + 0.8, y - 2.8], [x + 6.2, y - 2.6], [x + 5.6, y - 0.2], [x + 1.2, y - 0.6]], { fill: e.color || C.cyan, w: 0.6 });
  else if (e) shape(ctx, [[x + 1, y - 2.6], [x + 5.4, y - 2.6], [x + 5, y - 0.4], [x + 1.4, y - 0.6]], { fill: '#141218', w: 0.5 });
}
function hatSide(ctx, hw, x, y) {
  if (!hw) return;
  const c = hw.color || '#1d1a22';
  switch (hw.type) {
    case 'durag': shape(ctx, [[x - 5.2, y], [x - 4.4, y - 4.6], [x, y - 6.2], [x + 4, y - 4.6], [x + 4.4, y - 2.6], [x - 1, y - 2.4]], { fill: c, w: 0.7 }); brush(ctx, [[x - 5, y - 1], [x - 8, y + 5]], { w: 2.4, c }); brush(ctx, [[x - 5, y - 1], [x - 8, y + 5]], { w: 0.5 }); break;
    case 'fitted': shape(ctx, [[x - 5, y - 1.6], [x - 4, y - 5.6], [x, y - 7], [x + 4, y - 5.6], [x + 4.6, y - 2.6]], { fill: c, w: 0.7 }); shape(ctx, [[x + 3.6, y - 3.2], [x + 10.4, y - 2.6], [x + 10, y - 1.4], [x + 3.6, y - 1.8]], { fill: shade(c, -0.12), w: 0.6, step: 3 }); if (hw.accent) blob(ctx, x + 1.4, y - 4.6, 1, 1, { fill: hw.accent, w: 0.3 }); break;
    case 'backcap': shape(ctx, [[x - 5, y - 1.6], [x - 4, y - 5.6], [x, y - 7], [x + 4, y - 5.6], [x + 4.6, y - 2.6]], { fill: c, w: 0.7 }); shape(ctx, [[x - 4.4, y - 3], [x - 9.6, y - 2], [x - 9, y - 0.8], [x - 4.2, y - 1.6]], { fill: shade(c, -0.12), w: 0.6, step: 3 }); break;
    case 'beanie': shape(ctx, [[x - 5.2, y - 1.2], [x - 4.6, y - 6], [x, y - 7.8], [x + 4.6, y - 6], [x + 5, y - 1.6]], { fill: c, w: 0.7 }); pen(ctx, [[x - 5, y - 2.6], [x + 5, y - 2.8]], { w: 0.6 }); if (hw.accent) blob(ctx, x, y - 8.4, 1.6, 1.4, { fill: hw.accent, w: 0.5 }); break;
    case 'bucket': shape(ctx, [[x - 3.8, y - 2.4], [x - 3.4, y - 6.6], [x + 3.6, y - 6.6], [x + 4, y - 2.4]], { fill: c, w: 0.7 }); shape(ctx, [[x - 7, y - 0.8], [x - 4, y - 2.8], [x + 4.4, y - 2.8], [x + 7.6, y - 0.6], [x + 0.4, y - 1.4]], { fill: shade(c, -0.08), w: 0.6, step: 3 }); break;
    case 'hood': shape(ctx, [[x - 6.4, y + 2], [x - 6, y - 4.4], [x - 1, y - 7.4], [x + 4.4, y - 5.6], [x + 3.4, y - 3.8], [x - 1, y - 4.4], [x - 3.4, y - 0.4], [x - 3.6, y + 4]], { fill: hw.color, w: 0.7 }); break;
    case 'fedora': shape(ctx, [[x - 3.6, y - 3], [x - 3.2, y - 8], [x, y - 7], [x + 3.4, y - 8], [x + 3.8, y - 3]], { fill: c, w: 0.7 }); shape(ctx, [[x - 8, y - 2.4], [x + 8, y - 2.6], [x + 6, y - 1.2], [x - 6, y - 1.2]], { fill: shade(c, -0.1), w: 0.6, step: 3 }); break;
  }
}

// ---------- FRONT VIEW (owners, loiterers, the booster) ----------
function frontFigure(ctx, sp, o = {}) {
  const skin = sp.skin, t = sp.top, l = sp.legs || { type: 'jeans', color: '#3b4f7a' }, sh = sp.shoes || {};
  const long = t.type === 'parka' || t.type === 'trench';
  const wide = t.type === 'puffer' ? 1.6 : 0;
  // splayed shoes + legs
  for (const s of [-1, 1]) {
    const hipP = [s * 3.4, -24], knee = [s * 4.6, -13.5], ankle = [s * 4.4, -3.6];
    if (l.type === 'shorts') { limb(ctx, [[s * 3.8, -18], knee, ankle], 2.6, sp.socks ? '#f6f4ee' : skin); limb(ctx, [hipP, [s * 4, -17]], 5.4, s < 0 ? shade(l.color, -0.08) : l.color); }
    else { limb(ctx, [hipP, knee, ankle], l.type === 'baggy' || l.type === 'cargo' ? 5 : 4, s < 0 ? shade(l.color, -0.08) : l.color); if (l.type === 'track') pen(ctx, [[s * 5.4, -24], [s * 6.4, -14], [s * 6, -4]], { c: l.accent || '#f6f4ee', w: 0.6 }); if (sp.socks) limb(ctx, [[s * 4.5, -7], ankle], 3, '#f6f4ee'); }
    shoe(ctx, [s * 3, -1.4], 0.12, 0.12, sh, s, 1.3);
  }
  // torso
  const by = long ? -11 : -23;
  const tp = shape(ctx, [[-6.8 - wide, by], [-7.4 - wide, -32], [-10 - wide, -38.6], [-6, -41.4], [6, -41.4], [10 + wide, -38.6], [7.4 + wide, -32], [6.8 + wide, by]], { fill: t.color, w: 0.9, step: 4 });
  const a = t.accent || '#f6f4ee';
  clipTo(ctx, tp, () => {
    halftone(ctx, -11, -42, 5, 32, '#00000033', 1.4, 0.45);
    switch (t.type) {
      case 'camo': for (const [x, y, c] of [[-4, -36, a], [3, -33, shade(a, -0.25)], [-2, -28, a], [5, -38, a], [0, -25, shade(a, -0.25)], [-6, -30, shade(a, -0.25)]]) blob(ctx, x, y, 2.6, 1.6, { fill: c, stroke: false }); break;
      case 'flannel': for (let y = -42; y < by; y += 2.6) pen(ctx, [[-11, y], [11, y]], { c: a, w: 0.8, j: 0.05 }); for (let x = -10; x < 11; x += 2.6) pen(ctx, [[x, -42], [x, by]], { c: shade(a, -0.2), w: 0.5, j: 0.05 }); break;
      case 'puffer': for (let y = -36; y < by; y += 3.4) pen(ctx, [[-11, y], [11, y + 0.3]], { w: 0.5 }); break;
      case 'jersey': letter(ctx, '10', 0, -31, { size: 8, fill: a, stroke: INK, sw: 0.7 }); pen(ctx, [[-7.5, -39], [-7.4, by]], { c: a, w: 1 }); pen(ctx, [[7.5, -39], [7.4, by]], { c: a, w: 1 }); break;
      case 'tee': case 'tank': if (t.logo !== false) blob(ctx, 0, -34, 2.6, 2.2, { fill: a, w: 0.6 }); break;
      case 'hoodie': if (t.logo !== false) shape(ctx, [[-3.6, -36], [3.6, -36], [3.6, -33], [-3.6, -33]], { fill: a, w: 0.5 }); pen(ctx, [[-4, -27], [4, -27]], { w: 0.5 }); break;
      case 'track': pen(ctx, [[0, -41], [0, by]], { c: '#ece8e0', w: 0.6 }); if (t.logo) blob(ctx, 3.6, -36, 0.8, 0.6, { fill: t.logo, w: 0.3 }); break;
      case 'trench': case 'parka': pen(ctx, [[0, -40], [0, by]], { w: 0.5 }); pen(ctx, [[-7, -26], [7, -26]], { w: 1.1 }); break;
      case 'jacket': pen(ctx, [[0, -41], [0, by]], { c: a, w: 0.8 }); break;
    }
  });
  if (t.type === 'polo') { shape(ctx, [[-3.4, -41.6], [0, -39], [-1, -37]], { fill: a, w: 0.5 }); shape(ctx, [[3.4, -41.6], [0, -39], [1, -37]], { fill: a, w: 0.5 }); blob(ctx, 3.6, -36, 0.8, 0.6, { fill: t.logo || C.green, w: 0.3 }); }
  if (t.type === 'hoodie' && sp.head?.type !== 'hood') blob(ctx, 0, -41.6, 5.2, 1.8, { fill: shade(t.color, -0.1), w: 0.7 });
  if (t.type === 'puffer') blob(ctx, 0, -41.4, 5.6, 2.4, { fill: t.color, w: 0.8 });
  // arms
  const short = ['tee', 'jersey', 'tank', 'polo'].includes(t.type);
  const aw = t.type === 'puffer' ? 4.8 : 3.4;
  const armPath = (s, pose) => {
    const shp = [s * (8.6 + wide), -38.6];
    if (pose === 'wave') return [shp, [s * 14.4, -44], [s * 13, -53]];
    if (pose === 'counter') return [shp, [s * 11.4, -30], [s * 6.6, -26.4]];
    return [shp, [s * (11.6 + wide), -31], [s * (11 + wide), -24]];
  };
  for (const s of [-1, 1]) {
    const pth = armPath(s, s > 0 ? o.right : o.left);
    const sleeve = t.color.startsWith('#') ? t.color : t.sleeve || '#555555';
    if (t.type === 'tank') limb(ctx, pth, 2.6, skin);
    else if (short) { limb(ctx, pth, 2.6, skin); limb(ctx, [pth[0], [(pth[0][0] + pth[1][0]) / 2, (pth[0][1] + pth[1][1]) / 2]], aw + 0.8, sleeve); }
    else limb(ctx, pth, aw, sleeve);
    if (t.type === 'track' && !short) pen(ctx, pth.map(([x, y]) => [x + s * 1.4, y]), { c: a, w: 0.6 });
    mitten(ctx, pth[2][0], pth[2][1], skin, 1.15);
  }
  // accessories on the chest
  const acc = sp.acc || {};
  if (acc.chain) { pen(ctx, [[-3.4, -41], [0, -34.6], [3.4, -41]], { c: GOLD, w: 1, j: 0.05 }); blob(ctx, 0, -33.8, 1.3, 1.4, { fill: GOLD, w: 0.4 }); }
  if (acc.sacoche) { pen(ctx, [[-6, -40], [5, -26]], { w: 0.8 }); shape(ctx, [[3, -28.4], [8.6, -28.4], [8.6, -23.6], [3, -23.6]], { fill: '#1d1a22', w: 0.6 }); }
  if (acc.bumbag) { pen(ctx, [[-7, -27], [6, -40]], { w: 0.8 }); shape(ctx, [[-4, -36], [3.6, -36], [3.2, -32], [-3.6, -32]], { fill: acc.bumbag, w: 0.6 }); }
  if (acc.headphones) { pen(ctx, [[-3.6, -41.6], [0, -40], [3.6, -41.6]], { w: 0.9 }); blob(ctx, -3.8, -41.4, 1.4, 1.4, { fill: acc.headphones, w: 0.4 }); blob(ctx, 3.8, -41.4, 1.4, 1.4, { fill: acc.headphones, w: 0.4 }); }
  headFront(ctx, sp, o);
}

function headFront(ctx, sp, o) {
  const skin = sp.skin, y = -50.5;
  const face = sp.shadowFace ? '#17131c' : skin;
  limb(ctx, [[0, -41], [0, -44]], 3.4, face);
  const h = sp.hair, hc = h?.color || '#1e1612';
  if (h?.style === 'afro') blob(ctx, 0, y - 3, 8.6, 7.6, { fill: hc, w: 0.8, n: 20 });
  if (h && ['long', 'locs', 'mullet'].includes(h.style)) for (const s of [-1, 1]) for (let i = 0; i < 3; i++) brush(ctx, [[s * (4 + i * 0.7), y - 3], [s * (5.4 + i * 0.6), y + (h.style === 'mullet' ? 6 : 9)]], { w: 1.8, c: hc });
  if (sp.head?.type === 'hood') blob(ctx, 0, y - 0.6, 8, 8.4, { fill: sp.head.color, w: 0.9, n: 18 });
  blob(ctx, -5.9, y + 0.4, 1.3, 1.8, { fill: face, w: 0.6, n: 8 });
  blob(ctx, 5.9, y + 0.4, 1.3, 1.8, { fill: face, w: 0.6, n: 8 });
  blob(ctx, 0, y, 5.8, 6.4, { fill: face, w: 0.9, n: 18 });
  if (sp.shadowFace) {
    // face swallowed by the hood's shadow: only the gold grill shows
    blob(ctx, 0, y + 1.2, 4.6, 4.8, { fill: '#0b080e', stroke: false, n: 14 });
    if (o.talk) {
      shape(ctx, [[-3.6, y + 4.6], [3.6, y + 4.6], [3, y + 7.4], [-3, y + 7.4]], { fill: '#3a0d14', w: 0.5 });
      shape(ctx, [[-3.6, y + 4.6], [3.6, y + 4.6], [3.4, y + 5.8], [-3.4, y + 5.8]], { fill: GOLD, w: 0.4 });
      shape(ctx, [[-2.8, y + 6.4], [2.8, y + 6.4], [2.6, y + 7.4], [-2.6, y + 7.4]], { fill: GOLD2, w: 0.4 });
    } else {
      shape(ctx, [[-3.8, y + 4.4], [3.8, y + 4.4], [3.2, y + 6.4], [-3.2, y + 6.4]], { fill: GOLD, w: 0.5 });
      for (let i = -2; i <= 2; i++) pen(ctx, [[i * 1.3, y + 4.6], [i * 1.3, y + 6.2]], { c: GOLD2, w: 0.35, j: 0.02 });
    }
    if (o.blink) { pen(ctx, [[2.4, y + 3.2], [4.6, y + 3.2]], { c: '#fffbe0', w: 0.5 }); pen(ctx, [[3.5, y + 2.1], [3.5, y + 4.3]], { c: '#fffbe0', w: 0.5 }); }
  } else {
    // two droopy half-lidded eyes, big hanging nose
    for (const s of [-1, 1]) {
      blob(ctx, s * 2.3, y - 1.6, 1.6, 1.4, { fill: '#fbf8f0', w: 0.5, n: 10 });
      if (o.blink) pen(ctx, [[s * 2.3 - 1.4, y - 1.4], [s * 2.3 + 1.4, y - 1.4]], { w: 0.6 });
      else { blob(ctx, s * 2.1, y - 1.2, 0.5, 0.5, { fill: INK, stroke: false, n: 8 }); shape(ctx, [[s * 2.3 - 1.7, y - 1.7], [s * 2.3, y - 3.1], [s * 2.3 + 1.7, y - 1.7]], { fill: skin, w: 0.5, step: 2 }); }
      brush(ctx, [[s * 0.8, y - 4.2], [s * 4, y - 3.6]], { w: 0.8 });
    }
    shape(ctx, [[-1.1, y - 2.4], [1.1, y - 2.4], [2.6, y + 2.6], [2, y + 5.2], [0, y + 6.2], [-2, y + 5.2], [-2.6, y + 2.6]], { fill: skin, w: 0.85, step: 3 });
    pen(ctx, [[-1, y + 5], [-0.4, y + 5.4]], { w: 0.4 }); pen(ctx, [[1, y + 5], [0.4, y + 5.4]], { w: 0.4 });
    if (o.talk) shape(ctx, [[-2.4, y + 6.8], [2.4, y + 6.8], [1.6, y + 8.6], [-1.6, y + 8.6]], { fill: '#6a1a24', w: 0.5, step: 2 });
    else pen(ctx, [[-2, y + 7.2], [2, y + 7]], { w: 0.6 });
    const acc = sp.acc || {};
    if (acc.beard) shape(ctx, [[-5.4, y + 2], [-3, y + 6.2], [-1.6, y + 8.8], [1.6, y + 8.8], [3, y + 6.2], [5.4, y + 2], [5, y + 6.4], [0, y + 10.8], [-5, y + 6.4]], { fill: hc, w: 0.6 });
    if (acc.earring) { blob(ctx, -6.2, y + 2.6, 0.7, 0.7, { fill: GOLD, w: 0.3 }); blob(ctx, 6.2, y + 2.6, 0.7, 0.7, { fill: GOLD, w: 0.3 }); }
  }
  // hair / headwear
  if (h && h.style !== 'afro') {
    switch (h.style) {
      case 'fade': case 'cornrows': case 'long': case 'locs': case 'mullet': case 'bun':
        shape(ctx, [[-5.6, y - 1.6], [-5, y - 5.4], [0, y - 7], [5, y - 5.4], [5.6, y - 1.6], [3, y - 4.4], [-3, y - 4.4]], { fill: hc, w: 0.6 });
        if (h.style === 'bun') blob(ctx, 0, y - 7.6, 2.4, 2, { fill: hc, w: 0.6 });
        if (h.style === 'cornrows') for (let i = -2; i <= 2; i++) pen(ctx, [[i * 1.8, y - 4.6], [i * 1.6, y - 6.6]], { c: shade(hc, 0.25), w: 0.4 });
        break;
      case 'buzz': clipTo(ctx, ellipsePts(0, y, 5.8, 6.4), () => halftone(ctx, -6, y - 7, 12, 4.4, hc, 1, 0.45)); break;
      case 'spiky': shape(ctx, [[-5.6, y - 2], [-6, y - 7], [-3.6, y - 6], [-2.4, y - 10], [-0.4, y - 6.6], [1.4, y - 10.4], [2.6, y - 6.6], [5, y - 9], [4.6, y - 5], [5.8, y - 2], [3, y - 4], [-3, y - 4]], { fill: hc, w: 0.6, step: 2 }); break;
      case 'curly': for (let i = -3; i <= 3; i++) blob(ctx, i * 1.6, y - 5.6 - (Math.abs(i) % 2) * 0.6, 1.7, 1.6, { fill: hc, w: 0.5, n: 8 }); break;
    }
  }
  const hw = sp.head;
  if (hw && hw.type !== 'hood') {
    const c = hw.color || '#1d1a22';
    switch (hw.type) {
      case 'durag': shape(ctx, [[-6, y - 1], [-5.4, y - 5.8], [0, y - 7.6], [5.4, y - 5.8], [6, y - 1], [3, y - 3.4], [-3, y - 3.4]], { fill: c, w: 0.7 }); pen(ctx, [[-2, y - 6.6], [2, y - 6.8]], { c: shade(c, 0.3), w: 0.5 }); break;
      case 'fitted': shape(ctx, [[-6, y - 2], [-5, y - 7.2], [0, y - 8.6], [5, y - 7.2], [6, y - 2]], { fill: c, w: 0.7 }); shape(ctx, [[-6.4, y - 2.4], [6.4, y - 2.4], [5, y - 0.6], [-5, y - 0.6]], { fill: shade(c, -0.12), w: 0.6, step: 3 }); if (hw.accent) blob(ctx, 0, y - 5.4, 1.3, 1.3, { fill: hw.accent, w: 0.3 }); break;
      case 'backcap': shape(ctx, [[-6, y - 2], [-5, y - 7.2], [0, y - 8.6], [5, y - 7.2], [6, y - 2]], { fill: c, w: 0.7 }); pen(ctx, [[-4, y - 2.4], [4, y - 2.4]], { w: 0.8 }); if (hw.accent) blob(ctx, 0, y - 2.6, 0.8, 0.8, { fill: hw.accent, w: 0.3 }); break;
      case 'beanie': shape(ctx, [[-6.2, y - 1.6], [-5.6, y - 7.6], [0, y - 9.8], [5.6, y - 7.6], [6.2, y - 1.6]], { fill: c, w: 0.7 }); pen(ctx, [[-6, y - 3.4], [6, y - 3.4]], { w: 0.6 }); if (hw.accent) blob(ctx, 0, y - 10.4, 1.8, 1.6, { fill: hw.accent, w: 0.5 }); break;
      case 'bucket': shape(ctx, [[-4.6, y - 3], [-4.2, y - 8.4], [4.2, y - 8.4], [4.6, y - 3]], { fill: c, w: 0.7 }); shape(ctx, [[-9, y - 0.6], [-4.6, y - 3.6], [4.6, y - 3.6], [9, y - 0.6], [0, y - 1.6]], { fill: shade(c, -0.08), w: 0.6, step: 3 }); break;
      case 'fedora': shape(ctx, [[-4.4, y - 3.6], [-4, y - 9.6], [0, y - 8.4], [4, y - 9.6], [4.4, y - 3.6]], { fill: c, w: 0.7 }); shape(ctx, [[-10, y - 2.6], [10, y - 2.6], [7, y - 1], [-7, y - 1]], { fill: shade(c, -0.1), w: 0.6, step: 3 }); break;
    }
  }
  if (sp.head?.type === 'hood') {
    // hood rim framing the face
    pen(ctx, ellipsePts(0, y - 0.2, 6.6, 7.2, 18).concat([ellipsePts(0, y - 0.2, 6.6, 7.2, 18)[0]]), { w: 1.4, c: shade(sp.head.color, 0.12), step: 30 });
  }
  const e = sp.eyes;
  if (e?.type === 'juliet') shape(ctx, [[-5.8, y - 3.2], [5.8, y - 3.2], [5, y - 0.2], [0, y - 1], [-5, y - 0.2]], { fill: e.color || C.cyan, w: 0.6 });
  else if (e) shape(ctx, [[-5, y - 3], [5, y - 3], [4.4, y - 0.4], [-4.4, y - 0.4]], { fill: '#141218', w: 0.5 });
}

// ---------- builders ----------
function frame(R, draw, seed) {
  const [c, ctx] = layer(CW, CH, R);
  ctx.translate(OX, OY);
  seedInk(seed);
  draw(ctx);
  return c;
}
export const FRAME = { w: CW, h: CH, ox: OX, oy: OY };
export function buildWalker(spec, R, seed = 1) {
  const frames = Array.from({ length: 6 }, (_, i) => frame(R, (ctx) => sideFigure(ctx, spec, (i / 6) * Math.PI * 2), seed));
  const idle = frame(R, (ctx) => sideFigure(ctx, spec, Math.PI / 2 + 0.01), seed);
  return { frames, idle };
}
export function buildStander(spec, R, seed = 7) {
  const p = spec.pose || {};
  return {
    idle: frame(R, (ctx) => frontFigure(ctx, spec, p), seed),
    blink: frame(R, (ctx) => frontFigure(ctx, spec, { ...p, blink: true }), seed),
    talk: frame(R, (ctx) => frontFigure(ctx, spec, { ...p, talk: true }), seed),
    wave: frame(R, (ctx) => frontFigure(ctx, spec, { ...p, right: 'wave', talk: true }), seed),
  };
}

// ---------- Owners: dressed for the neighbourhood their store reps ----------
export const OWNERS = {
  'north-america': { skin: C.skin[5], hair: { style: 'fade', color: '#140e0a' }, head: { type: 'durag', color: '#1d1a26' }, top: { type: 'tee', color: '#f6f4ee', logo: false }, legs: { type: 'baggy', color: '#3a5a8a' }, shoes: { type: 'timbs' }, acc: { chain: true, beard: true }, pose: { left: 'counter', right: 'counter' } },
  canada: { skin: C.skin[4], hair: { style: 'fade', color: '#140e0a' }, head: { type: 'beanie', color: '#1d1a22' }, top: { type: 'puffer', color: '#22202a' }, legs: { type: 'track', color: '#4a4a52', accent: '#4a4a52' }, shoes: { type: 'sneaker', color: '#f6f4ee' }, acc: { chain: true }, pose: { left: 'counter', right: 'counter' } },
  'south-america': { skin: C.skin[3], hair: { style: 'buzz', color: '#f2d36b' }, eyes: { type: 'juliet', color: '#3fb8ff' }, top: { type: 'jersey', color: '#ffdf00', accent: '#009739' }, legs: { type: 'shorts', color: '#1d3f8f' }, shoes: { type: 'slides', color: '#1a1a1a', accent: '#f4f4f4' }, acc: { chain: true }, pose: { left: 'counter', right: 'counter' } },
  europe: { skin: C.skin[2], hair: { style: 'fade', color: '#160e0a' }, top: { type: 'track', color: '#1e1c24', accent: '#f6f4ee', logo: C.green }, legs: { type: 'track', color: '#1e1c24', accent: '#f6f4ee' }, shoes: { type: 'sneaker', color: '#2b3c8f', accent: C.cyan }, acc: { sacoche: true, beard: true }, pose: { left: 'counter', right: 'counter' } },
  africa: { skin: C.skin[5], hair: { style: 'fade', color: '#120a08' }, head: { type: 'bucket', color: '#ece4cf' }, top: { type: 'jersey', color: '#5fb04a', accent: '#f6f4ee' }, legs: { type: 'cargo', color: '#4d5040' }, shoes: { type: 'slides', color: '#1a1a1a', accent: '#f4f4f4' }, socks: true, acc: { chain: true, earring: true }, pose: { left: 'counter', right: 'counter' } },
  asia: { skin: C.skin[6], hair: { style: 'spiky', color: '#f0e27a' }, top: { type: 'camo', color: '#5a6b3c', accent: '#8a9a5a' }, legs: { type: 'cargo', color: '#1d1d24' }, shoes: { type: 'sneaker', color: '#f6f4ee', accent: C.red }, acc: { chain: true, earring: true }, pose: { left: 'counter', right: 'counter' } },
  oceania: { skin: C.skin[0], hair: { style: 'mullet', color: '#7a4a24' }, head: { type: 'backcap', color: '#f6f4ee', accent: '#1d3f8f' }, top: { type: 'polo', color: '#1d3f8f', accent: '#f6f4ee', logo: C.green }, legs: { type: 'shorts', color: '#1d1d24' }, shoes: { type: 'sneaker', color: '#f4c430', accent: '#1a1a1a' }, socks: true, acc: { bumbag: '#1d1d24' }, pose: { left: 'counter', right: 'counter' } },
};
// The booster: hood up, face lost in shadow, gold grill
export const BOOSTER = { skin: '#2a2230', shadowFace: true, hair: null, head: { type: 'hood', color: '#1d1a22' }, top: { type: 'hoodie', color: '#1d1a22', accent: C.gold, logo: false }, legs: { type: 'cargo', color: '#2a2a32' }, shoes: { type: 'sneaker', color: '#f6f4ee' }, acc: { chain: true } };

// ---------- pedestrian wardrobe (they wear real stock) ----------
const STYLES = ['fade', 'buzz', 'afro', 'cornrows', 'locs', 'long', 'bun', 'curly', 'spiky', 'mullet'];
const HAIRS = ['#140e0a', '#2a1810', '#4a2a16', '#7a4a24', '#c8862f', '#f0e27a', '#8a1d2a'];
const HEADS = [null, null, { type: 'fitted' }, { type: 'durag' }, { type: 'beanie' }, { type: 'bucket' }, { type: 'hood' }, { type: 'backcap' }];
const TOP_MAP = { hoodie: 'hoodie', tee: 'tee', jersey: 'jersey', shirt: 'flannel', jacket: 'jacket', coat: 'parka' };
export function pedestrianSpec(top, pants, shoe, r) {
  const head = HEADS[Math.floor(r() * HEADS.length)];
  return {
    skin: C.skin[Math.floor(r() * C.skin.length)],
    hair: { style: STYLES[Math.floor(r() * STYLES.length)], color: HAIRS[Math.floor(r() * HAIRS.length)] },
    head: head ? { ...head, color: head.type === 'hood' ? top.color : ['#1d1a26', C.red, '#1d3f8f', '#2e6b4a', '#ece4cf', '#141218'][Math.floor(r() * 6)], accent: '#f6f4ee' } : null,
    eyes: r() > 0.85 ? { type: 'shades' } : null,
    top: { type: TOP_MAP[top.type] || 'tee', color: top.color, accent: top.accent },
    legs: pants ? { type: 'baggy', color: pants.color } : { type: ['jeans', 'baggy', 'track', 'cargo', 'shorts'][Math.floor(r() * 5)], color: ['#3a5a8a', '#1d1d24', '#4d5040', '#5a5a62', '#6a5636'][Math.floor(r() * 5)], accent: '#f6f4ee' },
    shoes: shoe ? { type: 'sneaker', color: shoe.color, accent: shoe.accent } : { type: ['sneaker', 'timbs', 'sneaker', 'slides'][Math.floor(r() * 4)], color: ['#f6f4ee', '#1a1a1a', C.red][Math.floor(r() * 3)], accent: C.cyan },
    socks: r() > 0.85,
    acc: { chain: r() > 0.7, backpack: r() > 0.85 ? '#3a3640' : null, headphones: r() > 0.85 ? C.red : null, beard: r() > 0.8, earring: r() > 0.75, sacoche: r() > 0.85 },
  };
}

// ---------- animals + cars ----------
export function pigeonFrames(R) {
  return [false, true].map((peck) => {
    const [c, ctx] = layer(10, 8, R);
    seedInk(3);
    blob(ctx, 4.4, 4.6, 3.4, 2.2, { fill: '#9a9ab0', w: 0.5 });
    shape(ctx, [[1.2, 4], [-0.4, 3.4], [1.2, 5.4]], { fill: '#7a7a90', w: 0.4, step: 2 });
    const hx = peck ? 8 : 7.4, hy = peck ? 5.2 : 2.6;
    blob(ctx, hx, hy, 1.5, 1.4, { fill: '#a8a8c0', w: 0.5, n: 8 });
    shape(ctx, [[hx + 1.2, hy], [hx + 2.6, hy + 0.5], [hx + 1.2, hy + 0.8]], { fill: '#e0a050', w: 0.3, step: 2 });
    blob(ctx, hx + 0.3, hy - 0.3, 0.35, 0.35, { fill: INK, stroke: false, n: 6 });
    pen(ctx, [[4, 6.6], [3.6, 7.8]], { c: '#e0a050', w: 0.5 }); pen(ctx, [[5.4, 6.6], [5.6, 7.8]], { c: '#e0a050', w: 0.5 });
    return c;
  });
}
export function catFrames(R) {
  return [0, 1].map((k) => {
    const [c, ctx] = layer(16, 12, R);
    seedInk(5);
    const tail = k ? [[3, 9], [0.6, 6], [1.2, 2.4]] : [[3, 9], [0.4, 10], [-0.2, 7.4]];
    brush(ctx, tail, { w: 1.6, c: '#1d1820' });
    blob(ctx, 6, 8, 4, 3.4, { fill: '#1d1820', w: 0.5 });
    blob(ctx, 9.6, 4.6, 2.8, 2.6, { fill: '#1d1820', w: 0.5 });
    shape(ctx, [[7.6, 3], [7.8, 0.4], [9, 2.4]], { fill: '#1d1820', w: 0.4, step: 2 });
    shape(ctx, [[10.6, 2.4], [11.6, 0.2], [12, 2.8]], { fill: '#1d1820', w: 0.4, step: 2 });
    blob(ctx, 9, 4.4, 0.6, 0.45, { fill: '#c8f04a', stroke: false, n: 6 });
    blob(ctx, 11, 4.4, 0.6, 0.45, { fill: '#c8f04a', stroke: false, n: 6 });
    return c;
  });
}
const CAR_TYPES = ['sedan', 'taxi', 'lowrider', 'van', 'danfo', 'hatch'];
export const carType = (r) => CAR_TYPES[Math.floor(r() * CAR_TYPES.length)];
export function carFrames(type, color, R, seed = 9) {
  const W = type === 'van' || type === 'danfo' ? 66 : type === 'lowrider' ? 70 : 60;
  const body = type === 'taxi' ? '#f6cc3c' : type === 'danfo' ? '#f2c230' : color;
  const make = (spin) => {
    const [c, ctx] = layer(W + 4, 30, R);
    seedInk(seed);
    ctx.translate(2, 0);
    if (type === 'van' || type === 'danfo') {
      shape(ctx, [[2, 22], [2, 6], [6, 3], [W - 14, 3], [W - 4, 12], [W - 1, 14], [W - 1, 22]], { fill: body, w: 1, step: 6 });
      for (let x = 7; x < W - 18; x += 12) box(ctx, x, 6, 9, 6, { fill: C.glass, w: 0.6 });
      shape(ctx, [[W - 13, 5], [W - 6, 12], [W - 13, 12]], { fill: C.glass, w: 0.6, step: 3 });
      if (type === 'danfo') { pen(ctx, [[2, 15], [W - 1, 15]], { w: 1.6 }); pen(ctx, [[2, 18], [W - 1, 18]], { w: 1 }); letter(ctx, 'OSHODI', W / 2 - 6, 9, { size: 4, fill: INK }); }
    } else {
      const low = type === 'lowrider' ? 2 : 0;
      shape(ctx, [[1, 21 - low], [1, 13 - low], [9, 11 - low], [16, 4 - low], [W - 22, 3 - low], [W - 12, 10 - low], [W - 2, 12 - low], [W, 21 - low]], { fill: body, w: 1, step: 5 });
      shape(ctx, [[18, 6 - low], [W - 32, 5 - low], [W - 32, 11 - low], [13, 11 - low]], { fill: C.glass, w: 0.6, step: 4 });
      shape(ctx, [[W - 30, 5 - low], [W - 22, 5 - low], [W - 15, 11 - low], [W - 30, 11 - low]], { fill: C.glass, w: 0.6, step: 4 });
      pen(ctx, [[20, 7 - low], [25, 6 - low]], { c: '#ffffff', w: 0.6 });
      if (type === 'taxi') { box(ctx, W / 2 - 9, -1, 10, 4, { fill: '#f6f4ee', w: 0.6 }); for (let x = 4; x < W - 4; x += 4) box(ctx, x, 15 - low, 2, 2, { fill: INK, stroke: false }); }
      if (type === 'lowrider') { pen(ctx, [[4, 16], [W - 4, 15]], { c: '#e8e4f0', w: 1 }); pen(ctx, [[10, 13], [40, 12]], { c: shade(body, 0.3), w: 0.8 }); }
    }
    clipTo(ctx, [[0, 14], [W, 14], [W, 23], [0, 23]], () => halftone(ctx, 0, 14, W, 9, '#00000030', 1.6, 0.5));
    blob(ctx, W - 2, 15, 1.4, 1.6, { fill: '#fff6c0', w: 0.5, n: 8 });
    blob(ctx, 1.6, 15, 1.2, 1.4, { fill: C.red, w: 0.5, n: 8 });
    for (const wx of [14, W - 15]) {
      blob(ctx, wx, 23, 5.4, 5.4, { fill: '#1d1a20', w: 0.8, n: 16 });
      blob(ctx, wx, 23, 2.8, 2.8, { fill: type === 'lowrider' ? '#e8e4f0' : '#a8a4b0', w: 0.5, n: 12 });
      const a = spin ? Math.PI / 4 : 0;
      pen(ctx, [[wx + Math.cos(a) * 2.6, 23 + Math.sin(a) * 2.6], [wx - Math.cos(a) * 2.6, 23 - Math.sin(a) * 2.6]], { w: 0.5, j: 0.02 });
      pen(ctx, [[wx - Math.sin(a) * 2.6, 23 + Math.cos(a) * 2.6], [wx + Math.sin(a) * 2.6, 23 - Math.cos(a) * 2.6]], { w: 0.5, j: 0.02 });
    }
    return c;
  };
  return { frames: [make(false), make(true)], w: W + 4 };
}
function box(ctx, x, y, w, h, o) { return shape(ctx, [[x, y], [x + w, y], [x + w, y + h], [x, y + h]], { step: 8, ...o }); }
export { rng };
