// Procedural pixel sprites. Frames are 32x48; feet sit on y = 46, body centred on x = 16.
import { P, canvas, rect, px, line, dither, outline, flipped, shade } from './draw.js';

export const FW = 32;
export const FH = 48;
const GOLD = '#f2c14e';
const GOLD2 = '#c8922a';

// ---------- shared bits ----------
function shoes(ctx, x, y, w, s, dir = 1) {
  const c = s.color || '#f2f2f2';
  if (s.type === 'timbs') {
    rect(ctx, x, y - 3, w, 4, '#d9a441');
    rect(ctx, x, y - 3, w, 1, '#b5832c');
    rect(ctx, x, y + 1, w + (dir > 0 ? 1 : 0), 1, '#5a3a1e');
    px(ctx, x + (dir > 0 ? w - 1 : 0), y - 1, '#e8bc5a');
  } else if (s.type === 'slides') {
    rect(ctx, x, y, w + 1, 1, s.color || '#1a1a1a');
    rect(ctx, x + 1, y - 1, w - 2, 1, s.accent || '#e6e6e6');
  } else {
    rect(ctx, x, y - 1, w + (dir > 0 ? 1 : 0), 2, c);
    rect(ctx, x, y + 1, w + (dir > 0 ? 1 : 0), 1, s.sole || '#e9e6ee');
    if (s.accent) rect(ctx, x + 1, y, w - 2, 1, s.accent);
    if (s.type === 'tn') { px(ctx, x + 1, y - 1, s.accent || P.neonCyan); px(ctx, x + 3, y - 1, s.accent || P.neonCyan); }
  }
}

function legPaint(spec, back) {
  const l = spec.legs || { type: 'jeans', color: '#33405e' };
  return { col: back ? shade(l.color, -0.12) : l.color, l };
}

// ---------- SIDE VIEW (walkers) ----------
const POSES = {
  idle: { f: 1, b: -1, up: 0, arm: 0 },
  w0: { f: 3, b: -3, up: 0, arm: -2 },
  w1: { f: 0, b: 0, up: -1, arm: 0 },
  w2: { f: -3, b: 3, up: 0, arm: 2 },
  w3: { f: 0, b: 0, up: -1, arm: 0 },
};

function sideLeg(ctx, spec, baseX, off, back) {
  const { col, l } = legPaint(spec, back);
  const skin = back ? shade(spec.skin, -0.1) : spec.skin;
  const hip = 31;
  const wide = l.type === 'baggy' || l.type === 'cargo' ? 1 : 0;
  for (let i = 0; i <= 12; i++) {
    const o = Math.round((off * i) / 12);
    const y = hip + i;
    let c = col;
    if (l.type === 'shorts' && i > 6) c = skin;
    if (spec.socks && i > 8) c = '#f4f4f4';
    rect(ctx, baseX + o - (i > 9 ? wide : 0), y, 4 + wide, 1, c);
    if (l.type === 'track' && !(l.type === 'shorts' && i > 6)) px(ctx, baseX + o + (back ? 0 : 3 + wide), y, l.accent || '#f4f4f4');
    if (l.type === 'cargo' && i >= 5 && i <= 7) px(ctx, baseX + o + 3, y, shade(col, -0.18));
  }
  shoes(ctx, baseX + off - 1, 45, 6, spec.shoes || {}, 1);
}

function sideArm(ctx, spec, x, up, sw, back, pose) {
  const t = spec.top;
  const sleeve = back ? shade(t.color, -0.16) : t.color;
  const skin = back ? shade(spec.skin, -0.1) : spec.skin;
  const short = ['tee', 'jersey', 'tank', 'polo'].includes(t.type);
  const w = t.type === 'puffer' ? 4 : 3;
  if (pose === 'wave' && !back) {
    for (let i = 0; i < 9; i++) rect(ctx, x + Math.round(i * 0.6), 19 + up - i, w, 1, short && i > 2 ? skin : sleeve);
    rect(ctx, x + 5, 9 + up, 2, 2, skin);
    return;
  }
  for (let i = 0; i <= 9; i++) {
    const o = Math.round((sw * i) / 9);
    let c = sleeve;
    if (t.type === 'tank' || (short && i > 3)) c = skin;
    rect(ctx, x + o, 19 + up + i, w, 1, c);
    if (t.type === 'track' && i < 9) px(ctx, x + o + w - 1, 19 + up + i, t.accent || '#f4f4f4');
  }
  rect(ctx, x + sw, 29 + up, 2, 2, skin);
}

function torsoSide(ctx, spec, up) {
  const t = spec.top;
  const c = t.color, dk = shade(c, -0.15), lt = shade(c, 0.1);
  const long = t.type === 'trench' || t.type === 'parka';
  const x0 = t.type === 'puffer' ? 11 : 12, x1 = t.type === 'puffer' ? 21 : 20;
  const yEnd = long ? 39 : 31;
  for (let y = 18 + up; y <= yEnd + (long ? 0 : up); y++) {
    const flare = long && y > 31 ? Math.floor((y - 31) / 3) : 0;
    rect(ctx, x0 - flare, y, x1 - x0 + 1 + flare, 1, c);
    px(ctx, x0 - flare, y, dk);
    px(ctx, x1, y, lt);
  }
  const a = t.accent || '#ffffff';
  switch (t.type) {
    case 'hoodie':
      rect(ctx, 11, 15 + up, 4, 5, dk);
      rect(ctx, 15, 25 + up, 5, 3, dk);
      px(ctx, 18, 19 + up, '#e8e4ee'); px(ctx, 18, 20 + up, '#e8e4ee');
      if (t.logo !== false) rect(ctx, 15, 21 + up, 4, 2, a);
      break;
    case 'camo':
      for (const [cx, cy, cc] of [[13, 20, a], [17, 23, dk], [14, 27, a], [18, 19, shade(a, -0.2)], [16, 29, dk]]) rect(ctx, cx, cy + up, 3, 2, cc);
      rect(ctx, 11, 15 + up, 4, 5, dk);
      break;
    case 'tee':
      rect(ctx, 16, 18 + up, 3, 1, shade(c, -0.25));
      if (t.logo !== false) rect(ctx, 15, 21 + up, 3, 3, a);
      break;
    case 'jersey':
      line(ctx, 16, 18 + up, 18, 20 + up, a);
      rect(ctx, 12, 18 + up, 1, 13, a);
      rect(ctx, 16, 23 + up, 1, 4, a); rect(ctx, 18, 23 + up, 2, 4, a); px(ctx, 19, 24 + up, c); px(ctx, 19, 25 + up, c);
      break;
    case 'puffer':
      for (let y = 21 + up; y < 31 + up; y += 3) rect(ctx, x0, y, x1 - x0 + 1, 1, dk);
      rect(ctx, 14, 15 + up, 7, 4, c);
      rect(ctx, 14, 15 + up, 7, 1, lt);
      if (t.patch) rect(ctx, 13, 22 + up, 2, 2, t.patch);
      break;
    case 'track':
      rect(ctx, 19, 18 + up, 1, 13, '#dcdce0');
      rect(ctx, 16, 16 + up, 5, 2, c);
      rect(ctx, 12, 18 + up, 1, 13, a);
      break;
    case 'polo':
      rect(ctx, 16, 17 + up, 4, 2, a);
      px(ctx, 18, 20 + up, '#ffffff'); px(ctx, 18, 22 + up, '#ffffff');
      px(ctx, 14, 21 + up, t.logo || '#2fa84f');
      break;
    case 'flannel':
      for (let y = 18 + up; y <= 31 + up; y++) for (let x = x0; x <= x1; x++) if (((x >> 1) + (y >> 1)) % 2 === 0) px(ctx, x, y, a);
      break;
    case 'tank':
      rect(ctx, 16, 18 + up, 3, 2, spec.skin);
      if (t.logo !== false) rect(ctx, 15, 22 + up, 3, 2, a);
      break;
    case 'trench':
    case 'parka':
      rect(ctx, 16, 16 + up, 5, 4, t.type === 'parka' ? '#cfc6b4' : dk);
      rect(ctx, 11, 28 + up, 10, 1, shade(c, -0.25));
      line(ctx, 18, 20 + up, 18, 39, dk);
      break;
    case 'jacket':
      rect(ctx, 19, 18 + up, 1, 13, a);
      rect(ctx, 16, 16 + up, 5, 2, a);
      rect(ctx, 12, 30 + up, 9, 1, a);
      break;
  }
}

function headSide(ctx, spec, up, blink) {
  const s = spec.skin, sd = shade(s, -0.12);
  const rows = [[5, 14, 19], [6, 13, 20], [7, 12, 21], [8, 12, 21], [9, 12, 21], [10, 12, 21], [11, 12, 21], [12, 12, 21], [13, 12, 21], [14, 13, 20], [15, 14, 19]];
  for (const [y, a, b] of rows) {
    rect(ctx, a, y + up, b - a + 1, 1, s);
    px(ctx, a, y + up, sd);
  }
  rect(ctx, 15, 16 + up, 3, 2, sd); // neck
  px(ctx, 22, 10 + up, s); px(ctx, 22, 11 + up, sd); // nose
  rect(ctx, 14, 9 + up, 2, 3, sd); px(ctx, 15, 10 + up, shade(s, -0.22)); // ear
  if (!blink) { px(ctx, 19, 9 + up, P.ink); px(ctx, 19, 10 + up, P.ink); px(ctx, 20, 9 + up, '#ffffff'); }
  else rect(ctx, 19, 10 + up, 2, 1, P.ink);
  px(ctx, 18, 8 + up, shade(spec.hair?.color || '#1a1210', 0)); px(ctx, 19, 8 + up, shade(spec.hair?.color || '#1a1210', 0));
  rect(ctx, 19, 13 + up, 2, 1, shade(s, -0.28));
  const a = spec.acc || {};
  if (a.beard) { rect(ctx, 14, 12 + up, 7, 3, spec.hair?.color || '#1a1210'); rect(ctx, 15, 15 + up, 5, 1, spec.hair?.color || '#1a1210'); rect(ctx, 19, 13 + up, 2, 1, shade(s, -0.3)); }
  if (a.stache) rect(ctx, 19, 12 + up, 3, 1, spec.hair?.color || '#1a1210');
  if (a.earring) px(ctx, 15, 13 + up, GOLD);
}

function hairSide(ctx, h, up) {
  if (!h) return;
  const c = h.color, lt = shade(c, 0.12);
  switch (h.style) {
    case 'fade': rect(ctx, 13, 4 + up, 8, 2, c); rect(ctx, 12, 6 + up, 3, 3, c); dither(ctx, 12, 9 + up, 2, 2, c); px(ctx, 18, 4 + up, lt); break;
    case 'buzz': dither(ctx, 13, 4 + up, 8, 2, c); rect(ctx, 12, 6 + up, 2, 3, c); break;
    case 'afro': for (let y = 0; y < 11; y++) { const w = [6, 10, 12, 13, 13, 13, 13, 12, 10, 6, 4][y]; rect(ctx, 16 - Math.floor(w / 2) - 1, y + up, w, 1, c); } dither(ctx, 12, 1 + up, 8, 3, lt); break;
    case 'cornrows': rect(ctx, 13, 4 + up, 8, 3, c); for (let x = 13; x < 21; x += 2) rect(ctx, x, 4 + up, 1, 3, lt); rect(ctx, 10, 8 + up, 3, 9, c); break;
    case 'locs': rect(ctx, 13, 3 + up, 8, 3, c); for (let x = 9; x < 14; x++) rect(ctx, x, 5 + up, 1, 12 + (x % 2) * 2, x % 2 ? c : lt); break;
    case 'long': rect(ctx, 13, 3 + up, 8, 3, c); rect(ctx, 10, 5 + up, 4, 15, c); rect(ctx, 11, 6 + up, 1, 12, lt); break;
    case 'bun': rect(ctx, 13, 4 + up, 8, 2, c); rect(ctx, 12, 6 + up, 3, 4, c); rect(ctx, 9, 3 + up, 4, 4, c); break;
    case 'mullet': dither(ctx, 13, 4 + up, 8, 2, c); rect(ctx, 14, 3 + up, 6, 1, c); rect(ctx, 11, 7 + up, 3, 11, c); rect(ctx, 11, 8 + up, 1, 9, lt); break;
    case 'spiky': rect(ctx, 13, 4 + up, 8, 2, c); for (let x = 12; x < 22; x += 2) rect(ctx, x, 1 + up + (x % 4 ? 1 : 0), 2, 3, c); rect(ctx, 12, 6 + up, 3, 3, c); break;
    case 'curly': for (let x = 12; x < 22; x += 2) rect(ctx, x, 2 + up + (x % 4 ? 1 : 0), 3, 4, c); rect(ctx, 11, 6 + up, 4, 5, c); dither(ctx, 12, 2 + up, 9, 3, lt); break;
  }
}

function hatSide(ctx, hw, up) {
  if (!hw) return;
  const c = hw.color || '#1a1a1a', dk = shade(c, -0.15), lt = shade(c, 0.15), a = hw.accent;
  switch (hw.type) {
    case 'durag': rect(ctx, 12, 3 + up, 10, 5, c); rect(ctx, 13, 3 + up, 6, 1, lt); rect(ctx, 9, 7 + up, 4, 2, c); rect(ctx, 8, 9 + up, 3, 7, dk); px(ctx, 9, 10 + up, lt); break;
    case 'fitted': rect(ctx, 12, 2 + up, 9, 5, c); rect(ctx, 13, 2 + up, 5, 1, lt); rect(ctx, 19, 6 + up, 5, 1, dk); rect(ctx, 20, 7 + up, 4, 1, dk); if (a) rect(ctx, 17, 3 + up, 2, 2, a); break;
    case 'backcap': rect(ctx, 12, 2 + up, 9, 5, c); rect(ctx, 8, 6 + up, 5, 1, dk); if (a) px(ctx, 14, 4 + up, a); break;
    case 'beanie': rect(ctx, 12, 1 + up, 10, 7, c); rect(ctx, 12, 6 + up, 10, 2, dk); dither(ctx, 13, 2 + up, 8, 3, lt); if (a) rect(ctx, 15, 0 + up, 3, 2, a); break;
    case 'bucket': rect(ctx, 13, 2 + up, 8, 5, c); rect(ctx, 10, 6 + up, 14, 1, dk); rect(ctx, 9, 7 + up, 16, 1, dk); px(ctx, 15, 3 + up, lt); break;
    case 'hood': rect(ctx, 11, 3 + up, 10, 3, c); rect(ctx, 10, 5 + up, 5, 12, c); rect(ctx, 11, 4 + up, 1, 10, dk); break;
    case 'fedora': rect(ctx, 13, 0 + up, 8, 5, c); rect(ctx, 13, 4 + up, 8, 1, a || '#111'); rect(ctx, 9, 5 + up, 16, 1, dk); rect(ctx, 10, 6 + up, 14, 1, c); break;
  }
}

function eyesSide(ctx, e, up) {
  if (!e) return;
  if (e.type === 'juliet') { rect(ctx, 17, 9 + up, 6, 2, e.color || P.neonCyan); rect(ctx, 17, 8 + up, 6, 1, '#d9d9e0'); px(ctx, 22, 10 + up, '#ffffff'); }
  else { rect(ctx, 17, 9 + up, 5, 2, '#0d0b10'); px(ctx, 20, 9 + up, '#5c5870'); }
}

function accSide(ctx, a, up, phase) {
  if (!a) return;
  if (a.chain) { px(ctx, 17, 18 + up, GOLD); px(ctx, 18, 19 + up, GOLD); px(ctx, 19, 20 + up, GOLD2); rect(ctx, 19, 21 + up, 2, 2, GOLD); }
  if (a.sacoche) { line(ctx, 13, 18 + up, 19, 26 + up, '#16131a'); rect(ctx, 17, 26 + up, 5, 4, '#16131a'); px(ctx, 19, 27 + up, '#cfcfd6'); }
  if (a.bumbag) { line(ctx, 13, 26 + up, 19, 18 + up, '#16131a'); rect(ctx, 16, 21 + up, 5, 3, a.bumbag); px(ctx, 18, 22 + up, '#f4f4f4'); }
  if (a.headphones) { rect(ctx, 14, 16 + up, 6, 1, '#16131a'); rect(ctx, 14, 16 + up, 2, 2, a.headphones); }
  if (a.phone && phase === 'idle') { rect(ctx, 20, 26 + up, 2, 3, '#16131a'); px(ctx, 21, 26 + up, P.neonCyan); }
}

function sideFrame(spec, poseName, blink = false) {
  const [c, ctx] = canvas(FW, FH);
  const p = POSES[poseName];
  const up = p.up;
  if (spec.acc?.backpack) rect(ctx, 8, 19 + up, 5, 10, spec.acc.backpack);
  sideArm(ctx, spec, 12, up, -p.arm, true);
  sideLeg(ctx, spec, 13, p.b, true);
  sideLeg(ctx, spec, 15, p.f, false);
  torsoSide(ctx, spec, up);
  headSide(ctx, spec, up, blink);
  hairSide(ctx, spec.hair, up);
  hatSide(ctx, spec.head, up);
  eyesSide(ctx, spec.eyes, up);
  accSide(ctx, spec.acc, up, poseName);
  sideArm(ctx, spec, 16, up, p.arm, false, spec.pose);
  return outline(c);
}

// ---------- FRONT VIEW (owners, loiterers, the booster) ----------
function frontFrame(spec, o = {}) {
  const [c, ctx] = canvas(FW, FH);
  const t = spec.top, s = spec.skin, sd = shade(s, -0.12);
  const tc = t.color, tdk = shade(tc, -0.15), tlt = shade(tc, 0.1);
  const l = spec.legs || { type: 'jeans', color: '#33405e' };
  const long = t.type === 'trench' || t.type === 'parka';
  const wide = t.type === 'puffer' ? 1 : 0;
  // legs
  for (const [lx, back] of [[11, true], [17, false]]) {
    for (let y = 31; y <= 43; y++) {
      let col = back ? shade(l.color, -0.06) : l.color;
      if (l.type === 'shorts' && y > 37) col = back ? sd : s;
      if (spec.socks && y > 39) col = '#f4f4f4';
      rect(ctx, lx, y, l.type === 'baggy' || l.type === 'cargo' ? 5 : 4, 1, col);
      if (l.type === 'track' && y < 44) px(ctx, lx + (back ? 0 : 3), y, l.accent || '#f4f4f4');
    }
    shoes(ctx, lx - (back ? 1 : 0), 45, 5, spec.shoes || {}, back ? -1 : 1);
  }
  // torso
  const yEnd = long ? 40 : 31;
  for (let y = 18; y <= yEnd; y++) {
    const flare = long && y > 31 ? Math.floor((y - 31) / 3) : 0;
    const x0 = 10 - wide - flare, x1 = 21 + wide + flare;
    rect(ctx, x0, y, x1 - x0 + 1, 1, tc);
    px(ctx, x0, y, tdk); px(ctx, x1, y, tlt);
  }
  const a = t.accent || '#ffffff';
  switch (t.type) {
    case 'hoodie': rect(ctx, 12, 16, 8, 3, tdk); rect(ctx, 12, 26, 8, 3, tdk); px(ctx, 14, 19, '#e8e4ee'); px(ctx, 17, 19, '#e8e4ee'); px(ctx, 14, 20, '#e8e4ee'); px(ctx, 17, 20, '#e8e4ee'); if (t.logo !== false) rect(ctx, 13, 21, 6, 2, a); break;
    case 'camo': for (const [cx, cy, cc] of [[11, 20, a], [16, 23, tdk], [13, 27, a], [18, 19, shade(a, -0.2)], [19, 26, tdk], [12, 24, tdk]]) rect(ctx, cx, cy, 3, 2, cc); rect(ctx, 12, 16, 8, 3, tdk); break;
    case 'tee': rect(ctx, 14, 18, 4, 1, shade(tc, -0.25)); if (t.logo !== false) rect(ctx, 14, 21, 4, 3, a); break;
    case 'jersey': line(ctx, 13, 18, 15, 21, a); line(ctx, 18, 18, 16, 21, a); rect(ctx, 10, 18, 1, 13, a); rect(ctx, 21, 18, 1, 13, a); rect(ctx, 13, 23, 1, 4, a); rect(ctx, 15, 23, 3, 4, a); rect(ctx, 16, 24, 1, 2, tc); break;
    case 'puffer': for (let y = 21; y < 31; y += 3) rect(ctx, 9, y, 14, 1, tdk); rect(ctx, 12, 15, 8, 4, tc); rect(ctx, 12, 15, 8, 1, tlt); rect(ctx, 15, 19, 1, 12, tdk); if (t.patch) rect(ctx, 11, 22, 2, 2, t.patch); break;
    case 'track': rect(ctx, 15, 18, 1, 13, '#dcdce0'); rect(ctx, 12, 16, 8, 2, tc); rect(ctx, 10, 18, 1, 13, a); rect(ctx, 21, 18, 1, 13, a); if (t.logo) px(ctx, 18, 21, t.logo); break;
    case 'polo': rect(ctx, 13, 17, 6, 2, a); px(ctx, 15, 19, '#ffffff'); px(ctx, 15, 21, '#ffffff'); rect(ctx, 18, 21, 2, 1, t.logo || '#2fa84f'); break;
    case 'flannel': for (let y = 18; y <= 31; y++) for (let x = 10; x <= 21; x++) if (((x >> 1) + (y >> 1)) % 2 === 0) px(ctx, x, y, a); break;
    case 'tank': rect(ctx, 13, 18, 6, 2, s); if (t.logo !== false) rect(ctx, 14, 22, 4, 2, a); break;
    case 'trench': case 'parka': line(ctx, 12, 17, 15, 24, tdk); line(ctx, 19, 17, 16, 24, tdk); rect(ctx, 10, 29, 12, 1, shade(tc, -0.25)); rect(ctx, 15, 24, 1, 16, tdk); rect(ctx, 11, 15, 3, 4, tdk); rect(ctx, 18, 15, 3, 4, tdk); break;
    case 'jacket': rect(ctx, 15, 18, 1, 13, a); rect(ctx, 12, 16, 8, 2, a); rect(ctx, 10, 30, 12, 1, a); break;
  }
  // arms
  const short = ['tee', 'jersey', 'tank', 'polo'].includes(t.type);
  const armW = t.type === 'puffer' ? 4 : 3;
  const arm = (x, side) => {
    const pose = side === 'r' ? o.right : o.left;
    if (pose === 'wave') {
      for (let i = 0; i < 9; i++) rect(ctx, x + (side === 'r' ? Math.round(i * 0.5) : -Math.round(i * 0.5)), 19 - i, armW, 1, short && i > 3 ? s : tc);
      rect(ctx, x + (side === 'r' ? 4 : -3), 8, 3, 3, s);
      return;
    }
    for (let y = 19; y <= 29; y++) rect(ctx, x, y, armW, 1, t.type === 'tank' || (short && y > 22) ? (side === 'l' ? sd : s) : side === 'l' ? tdk : tc);
    if (t.type === 'track') rect(ctx, side === 'l' ? x : x + armW - 1, 19, 1, 10, a);
    rect(ctx, x, 30, armW, 2, side === 'l' ? sd : s);
  };
  arm(7 - wide, 'l');
  arm(22 + wide, 'r');
  // neck + head
  rect(ctx, 14, 16, 4, 2, sd);
  const rows = [[5, 13, 18], [6, 12, 19], [7, 11, 20], [8, 11, 20], [9, 11, 20], [10, 11, 20], [11, 11, 20], [12, 11, 20], [13, 11, 20], [14, 12, 19], [15, 13, 18]];
  for (const [y, a0, b0] of rows) { rect(ctx, a0, y, b0 - a0 + 1, 1, s); px(ctx, a0, y, sd); }
  rect(ctx, 10, 9, 1, 3, sd); rect(ctx, 21, 9, 1, 3, sd);
  const hc = spec.hair?.color || '#1a1210';
  if (spec.shadowFace) {
    // face lost in shadow: only the gold grill catches the light
    if (o.talk) { rect(ctx, 13, 12, 6, 3, '#2a0d10'); rect(ctx, 13, 12, 6, 1, GOLD); rect(ctx, 13, 14, 6, 1, GOLD2); px(ctx, 14, 12, '#fff3b0'); }
    else { rect(ctx, 13, 13, 6, 1, GOLD); px(ctx, 15, 13, GOLD2); px(ctx, 17, 13, GOLD2); px(ctx, 13, 13, '#fff3b0'); }
    if (o.blink) { px(ctx, 19, 11, '#ffffff'); px(ctx, 18, 12, '#fff3b0'); px(ctx, 20, 12, '#fff3b0'); px(ctx, 19, 13, '#ffffff'); }
  } else {
    if (o.blink) { rect(ctx, 13, 10, 2, 1, P.ink); rect(ctx, 17, 10, 2, 1, P.ink); }
    else { px(ctx, 13, 10, '#ffffff'); px(ctx, 14, 10, P.ink); px(ctx, 14, 9, P.ink); px(ctx, 17, 10, P.ink); px(ctx, 17, 9, P.ink); px(ctx, 18, 10, '#ffffff'); }
    rect(ctx, 13, 8, 2, 1, hc); rect(ctx, 17, 8, 2, 1, hc);
    px(ctx, 15, 12, sd); px(ctx, 16, 12, sd);
    if (o.talk) { rect(ctx, 14, 13, 4, 2, '#5a1a22'); px(ctx, 15, 13, '#f4f4f4'); } else rect(ctx, 14, 13, 4, 1, shade(s, -0.3));
  }
  const ac = spec.acc || {};
  if (ac.beard) { rect(ctx, 11, 12, 10, 2, hc); rect(ctx, 12, 14, 8, 2, hc); rect(ctx, 14, 13, 4, 1, shade(s, -0.3)); }
  if (ac.stache) rect(ctx, 13, 12, 6, 1, hc);
  if (ac.earring) { px(ctx, 10, 12, GOLD); px(ctx, 21, 12, GOLD); }
  // hair
  const h = spec.hair;
  if (h) {
    const hcl = shade(h.color, 0.12);
    switch (h.style) {
      case 'fade': rect(ctx, 12, 4, 8, 2, h.color); rect(ctx, 11, 6, 10, 1, h.color); dither(ctx, 11, 7, 1, 3, h.color); dither(ctx, 20, 7, 1, 3, h.color); px(ctx, 15, 4, hcl); break;
      case 'buzz': dither(ctx, 12, 4, 8, 3, h.color); break;
      case 'afro': for (let y = 0; y < 9; y++) { const w = [6, 10, 12, 14, 14, 14, 14, 14, 14][y]; rect(ctx, 16 - w / 2, y, w, 1, h.color); } rect(ctx, 9, 9, 2, 3, h.color); rect(ctx, 21, 9, 2, 3, h.color); dither(ctx, 11, 1, 10, 3, hcl); break;
      case 'cornrows': rect(ctx, 12, 4, 8, 3, h.color); for (let x = 12; x < 20; x += 2) rect(ctx, x, 4, 1, 3, hcl); break;
      case 'locs': rect(ctx, 12, 3, 8, 3, h.color); for (let x = 9; x < 23; x += 2) if (x < 12 || x > 19) rect(ctx, x, 5, 1, 12, x % 4 ? h.color : hcl); break;
      case 'long': rect(ctx, 12, 3, 8, 3, h.color); rect(ctx, 10, 5, 2, 14, h.color); rect(ctx, 20, 5, 2, 14, h.color); break;
      case 'bun': rect(ctx, 12, 4, 8, 2, h.color); rect(ctx, 14, 1, 4, 3, h.color); break;
      case 'mullet': dither(ctx, 12, 4, 8, 3, h.color); rect(ctx, 13, 3, 6, 1, h.color); rect(ctx, 10, 9, 1, 8, h.color); rect(ctx, 21, 9, 1, 8, h.color); break;
      case 'spiky': rect(ctx, 12, 4, 8, 2, h.color); for (let x = 11; x < 21; x += 2) rect(ctx, x, 1 + (x % 4 ? 1 : 0), 2, 3, h.color); break;
      case 'curly': for (let x = 11; x < 21; x += 2) rect(ctx, x, 2 + (x % 4 ? 1 : 0), 3, 4, h.color); dither(ctx, 11, 2, 10, 3, hcl); break;
    }
  }
  // headwear
  const hw = spec.head;
  if (hw) {
    const hc2 = hw.color || '#1a1a1a', dk = shade(hc2, -0.15), lt = shade(hc2, 0.15);
    switch (hw.type) {
      case 'durag': rect(ctx, 11, 3, 10, 5, hc2); rect(ctx, 13, 3, 5, 1, lt); rect(ctx, 11, 7, 10, 1, dk); rect(ctx, 9, 8, 2, 7, dk); break;
      case 'fitted': rect(ctx, 11, 2, 10, 5, hc2); rect(ctx, 10, 6, 12, 2, dk); rect(ctx, 12, 2, 6, 1, lt); if (hw.accent) rect(ctx, 15, 3, 2, 2, hw.accent); break;
      case 'backcap': rect(ctx, 11, 2, 10, 5, hc2); rect(ctx, 12, 6, 8, 1, dk); px(ctx, 15, 6, hw.accent || '#ffffff'); break;
      case 'beanie': rect(ctx, 11, 1, 10, 7, hc2); rect(ctx, 11, 6, 10, 2, dk); dither(ctx, 12, 2, 8, 3, lt); if (hw.accent) rect(ctx, 15, 0, 2, 2, hw.accent); break;
      case 'bucket': rect(ctx, 12, 2, 8, 5, hc2); rect(ctx, 9, 6, 14, 2, dk); px(ctx, 14, 3, lt); break;
      case 'hood': rect(ctx, 10, 3, 12, 3, hc2); rect(ctx, 9, 5, 2, 12, hc2); rect(ctx, 21, 5, 2, 12, hc2); break;
      case 'fedora': rect(ctx, 12, 0, 8, 5, hc2); rect(ctx, 12, 4, 8, 1, hw.accent || '#111'); rect(ctx, 8, 5, 16, 2, dk); break;
    }
  }
  const e = spec.eyes;
  if (e?.type === 'juliet') { rect(ctx, 11, 9, 10, 2, e.color || P.neonCyan); rect(ctx, 11, 8, 10, 1, '#d9d9e0'); px(ctx, 13, 9, '#ffffff'); px(ctx, 18, 9, '#ffffff'); }
  else if (e) { rect(ctx, 12, 9, 3, 2, '#0d0b10'); rect(ctx, 17, 9, 3, 2, '#0d0b10'); rect(ctx, 15, 9, 2, 1, '#0d0b10'); }
  if (ac.chain) { for (let i = 0; i < 4; i++) { px(ctx, 13 + i, 18 + i, GOLD); px(ctx, 19 - i, 18 + i, GOLD); } rect(ctx, 15, 22, 2, 2, GOLD); }
  if (ac.sacoche) { line(ctx, 11, 18, 19, 27, '#16131a'); rect(ctx, 17, 26, 5, 4, '#16131a'); px(ctx, 19, 27, '#cfcfd6'); }
  if (ac.bumbag) { line(ctx, 10, 27, 21, 18, '#16131a'); rect(ctx, 13, 21, 6, 3, ac.bumbag); px(ctx, 15, 22, '#f4f4f4'); }
  if (ac.headphones) { rect(ctx, 12, 16, 8, 1, '#16131a'); rect(ctx, 11, 16, 2, 2, ac.headphones); rect(ctx, 19, 16, 2, 2, ac.headphones); }
  if (ac.phone) { rect(ctx, 23, 27, 2, 3, '#16131a'); px(ctx, 24, 27, P.neonCyan); }
  return outline(c);
}

// ---------- builders ----------
export function buildWalker(spec) {
  const right = ['w0', 'w1', 'w2', 'w3'].map((p) => sideFrame(spec, p));
  const idle = sideFrame(spec, 'idle');
  return { right, left: right.map(flipped), idleR: idle, idleL: flipped(idle) };
}
export function buildStander(spec) {
  return { idle: frontFrame(spec, spec.pose || {}), blink: frontFrame(spec, { ...(spec.pose || {}), blink: true }), talk: frontFrame(spec, { ...(spec.pose || {}), talk: true }), wave: frontFrame(spec, { ...(spec.pose || {}), right: 'wave', talk: true }) };
}

// ---------- Owners: dressed for the specific neighbourhood their store reps ----------
export const OWNERS = {
  // Harlem, NYC — durag, oversized white tee, chain, baggy denim, wheat Timbs
  'north-america': { skin: '#6b3f26', hair: { style: 'fade', color: '#120c0a' }, head: { type: 'durag', color: '#1c1c24' }, top: { type: 'tee', color: '#f2f2f2', logo: false }, legs: { type: 'baggy', color: '#2f4a7a' }, shoes: { type: 'timbs' }, acc: { chain: true, beard: true } },
  // Scarborough, Toronto — black puffer with red patch, toque, tech fleece, white low-tops
  canada: { skin: '#8a5634', hair: { style: 'fade', color: '#120c0a' }, head: { type: 'beanie', color: '#141418' }, top: { type: 'puffer', color: '#1b1b20', patch: '#c8102e' }, legs: { type: 'track', color: '#3a3a42', accent: '#3a3a42' }, shoes: { type: 'sneaker', color: '#f4f4f4' }, acc: { chain: true } },
  // Rocinha, Rio — "Mandrake": Juliet shades, bleached buzz, Brasil jersey, cyclone shorts, slides
  'south-america': { skin: '#a8714a', hair: { style: 'buzz', color: '#f2d36b' }, eyes: { type: 'juliet', color: '#3fb8ff' }, top: { type: 'jersey', color: '#ffdf00', accent: '#009739' }, legs: { type: 'shorts', color: '#1d3f8f' }, shoes: { type: 'slides', color: '#111', accent: '#f4f4f4' }, acc: { chain: true } },
  // Saint-Denis (93), Paris — black survêt with white stripes, sacoche, TNs, short beard
  europe: { skin: '#b07a52', hair: { style: 'fade', color: '#140e0b' }, top: { type: 'track', color: '#16161c', accent: '#f4f4f4', logo: '#2fa84f' }, legs: { type: 'track', color: '#16161c', accent: '#f4f4f4' }, shoes: { type: 'tn', color: '#2b3c8f', accent: P.neonCyan }, acc: { sacoche: true, beard: true } },
  // Yaba, Lagos — bucket hat, Naija jersey, cargos, slides with socks, chain
  africa: { skin: '#4e2c1a', hair: { style: 'fade', color: '#100a08' }, head: { type: 'bucket', color: '#e9e2cf' }, top: { type: 'jersey', color: '#5fb04a', accent: '#f4f4f4' }, legs: { type: 'cargo', color: '#3d4033' }, shoes: { type: 'slides', color: '#111', accent: '#f4f4f4' }, socks: true, acc: { chain: true, earring: true } },
  // Shinjuku, Tokyo — bleached spikes, oversized camo hoodie, black cargos, chunky kicks
  asia: { skin: '#e8c39a', hair: { style: 'spiky', color: '#f0e27a' }, top: { type: 'camo', color: '#5a6b3c', accent: '#8a9a5a' }, legs: { type: 'cargo', color: '#18181e' }, shoes: { type: 'sneaker', color: '#f4f4f4', accent: '#d0021b' }, acc: { chain: true, earring: true } },
  // Mount Druitt, Western Sydney — eshay: polo, bumbag across the chest, Nike-style TNs, socks pulled up
  oceania: { skin: '#e2b48a', hair: { style: 'mullet', color: '#7a4a24' }, head: { type: 'backcap', color: '#f4f4f4', accent: '#1d3f8f' }, top: { type: 'polo', color: '#1d3f8f', accent: '#f4f4f4', logo: '#2fa84f' }, legs: { type: 'shorts', color: '#16161c' }, shoes: { type: 'tn', color: '#f4c430', accent: '#111' }, socks: true, acc: { bumbag: '#16161c' } },
};

// The booster: hood up, face swallowed by shadow, gold grill flashing
export const BOOSTER = { skin: '#0d0a10', shadowFace: true, hair: null, head: { type: 'hood', color: '#16131a' }, top: { type: 'hoodie', color: '#16131a', accent: '#f2c14e', logo: false }, legs: { type: 'cargo', color: '#22222a' }, shoes: { type: 'sneaker', color: '#f4f4f4' }, acc: { chain: true } };
export const buildBooster = () => buildStander(BOOSTER);

// ---------- Pedestrian wardrobe (wears real stock) ----------
const SKINS = ['#f1c7a2', '#e0a978', '#c98d5e', '#a8714a', '#8a5634', '#6b3f26', '#4e2c1a', '#f6d8bd'];
const HAIRS = ['#120c0a', '#2a1810', '#4a2a16', '#7a4a24', '#c8862f', '#f0e27a', '#8a1d2a'];
const STYLES = ['fade', 'buzz', 'afro', 'cornrows', 'locs', 'long', 'bun', 'curly', 'spiky', 'mullet'];
const HEADS = [null, null, { type: 'fitted' }, { type: 'durag' }, { type: 'beanie' }, { type: 'bucket' }, { type: 'hood' }, { type: 'backcap' }];
const TOP_MAP = { hoodie: 'hoodie', tee: 'tee', jersey: 'jersey', shirt: 'flannel', jacket: 'jacket', coat: 'parka' };

export function pedestrianSpec(top, pants, shoe, r) {
  const head = HEADS[Math.floor(r() * HEADS.length)];
  const type = TOP_MAP[top.type] || 'tee';
  return {
    skin: SKINS[Math.floor(r() * SKINS.length)],
    hair: { style: STYLES[Math.floor(r() * STYLES.length)], color: HAIRS[Math.floor(r() * HAIRS.length)] },
    head: head ? { ...head, color: head.type === 'hood' ? top.color : ['#1c1c24', '#c8102e', '#1d3f8f', '#2e6b4a', '#e9e2cf', '#111'][Math.floor(r() * 6)], accent: '#f4f4f4' } : null,
    eyes: r() > 0.85 ? { type: 'shades' } : null,
    top: { type, color: top.color, accent: top.accent },
    legs: pants ? { type: 'baggy', color: pants.color } : { type: ['jeans', 'baggy', 'track', 'cargo', 'shorts'][Math.floor(r() * 5)], color: ['#2f4a7a', '#1d1d24', '#3d4033', '#4a4a52', '#5a4632'][Math.floor(r() * 5)], accent: '#f4f4f4' },
    shoes: shoe ? { type: 'sneaker', color: shoe.color, accent: shoe.accent } : { type: ['sneaker', 'timbs', 'tn', 'sneaker'][Math.floor(r() * 4)], color: ['#f4f4f4', '#111', '#c8102e'][Math.floor(r() * 3)], accent: P.neonCyan },
    socks: r() > 0.85,
    acc: { chain: r() > 0.7, backpack: r() > 0.85 ? '#2a2630' : null, headphones: r() > 0.85 ? '#c8102e' : null, beard: r() > 0.8, earring: r() > 0.75, phone: r() > 0.6, sacoche: r() > 0.85 },
  };
}

// ---------- Animals, mascot, vehicles ----------
export function pigeonFrames() {
  const make = (peck) => {
    const [c, ctx] = canvas(8, 6);
    rect(ctx, 1, 2, 5, 3, '#8a8aa0'); rect(ctx, 0, 3, 2, 1, '#6a6a80');
    rect(ctx, 5, peck ? 3 : 1, 2, 2, '#9c9cb4'); px(ctx, 6, peck ? 3 : 1, '#120c14'); px(ctx, 7, peck ? 4 : 2, '#e0a050');
    px(ctx, 4, 3, '#5fb08a'); px(ctx, 2, 5, '#e0a050'); px(ctx, 4, 5, '#e0a050');
    return c;
  };
  return [make(false), make(true)];
}
export function catFrames() {
  const make = (t) => {
    const [c, ctx] = canvas(12, 9);
    rect(ctx, 2, 4, 6, 4, '#1a1418'); rect(ctx, 6, 1, 4, 4, '#1a1418'); px(ctx, 6, 0, '#1a1418'); px(ctx, 9, 0, '#1a1418');
    px(ctx, 7, 2, '#c8f04a'); px(ctx, 9, 2, '#c8f04a');
    if (t) { rect(ctx, 0, 2, 1, 4, '#1a1418'); px(ctx, 1, 6, '#1a1418'); } else { rect(ctx, 0, 6, 3, 1, '#1a1418'); px(ctx, 0, 5, '#1a1418'); }
    return c;
  };
  return [make(false), make(true)];
}
const CAR_TYPES = ['sedan', 'taxi', 'lowrider', 'van', 'danfo', 'hatch'];
export function carFrames(type, color, r) {
  const W = type === 'danfo' || type === 'van' ? 64 : type === 'lowrider' ? 66 : 58;
  const make = (spin) => {
    const [c, ctx] = canvas(W, 26);
    const body = color, dk = shade(body, -0.18), lt = shade(body, 0.12);
    const wheel = (wx) => {
      rect(ctx, wx - 5, 16, 10, 9, '#111015'); rect(ctx, wx - 3, 18, 6, 5, type === 'lowrider' ? '#d8d4e4' : '#6a6870');
      if (spin) { px(ctx, wx, 18, '#2a2830'); px(ctx, wx, 22, '#2a2830'); } else { px(ctx, wx - 3, 20, '#2a2830'); px(ctx, wx + 2, 20, '#2a2830'); }
    };
    if (type === 'van' || type === 'danfo') {
      rect(ctx, 2, 4, W - 6, 16, body); rect(ctx, 2, 4, W - 6, 1, lt); rect(ctx, W - 10, 8, 7, 12, body);
      rect(ctx, W - 9, 6, 6, 6, '#7fb3c9');
      for (let x = 6; x < W - 14; x += 10) rect(ctx, x, 7, 8, 5, '#2a3a4a');
      if (type === 'danfo') { rect(ctx, 2, 13, W - 6, 2, '#141218'); rect(ctx, 2, 16, W - 6, 1, '#141218'); }
      else rect(ctx, 8, 13, 20, 2, dk);
    } else {
      const roofX = type === 'hatch' ? 18 : 16, roofW = type === 'hatch' ? 26 : 24;
      rect(ctx, 2, 11, W - 4, 9, body); rect(ctx, 2, 11, W - 4, 1, lt); rect(ctx, 2, 18, W - 4, 2, dk);
      rect(ctx, roofX, 4, roofW, 7, body); rect(ctx, roofX + 2, 5, 9, 6, '#7fb3c9'); rect(ctx, roofX + 13, 5, roofW - 15, 6, '#7fb3c9');
      line(ctx, roofX - 4, 11, roofX, 4, body); line(ctx, roofX + roofW, 4, roofX + roofW + 6, 11, body);
      if (type === 'taxi') { rect(ctx, roofX + 8, 1, 8, 3, '#f4f4f4'); rect(ctx, 6, 14, W - 12, 1, '#141218'); }
      if (type === 'lowrider') { rect(ctx, 4, 14, W - 8, 1, '#d8d4e4'); rect(ctx, 10, 12, 30, 1, shade(body, 0.25)); }
    }
    rect(ctx, W - 4, 12, 2, 3, '#fff2b0'); rect(ctx, 0, 12, 2, 3, '#ff3b3b');
    wheel(13); wheel(W - 15);
    return outline(c);
  };
  return { frames: [make(false), make(true)], w: W };
}
export const carType = (r) => CAR_TYPES[Math.floor(r() * CAR_TYPES.length)];
export { flipped };
