// Pixel-art toolkit: every call works in whole art pixels on a 2D canvas.
export const P = {
  ink: '#120c14',
  asphalt: '#2a2630', asphalt2: '#24202a', lane: '#d9b23a', curb: '#6b6470', curbTop: '#8a8290',
  walk: '#5c5560', walk2: '#544d58', walkLine: '#47414c', gum: '#3e3842',
  skyTop: '#140f2a', skyMid: '#3b1d4e', skyLow: '#8a2f5c', skyGlow: '#e0584f', skyHaze: '#f08a4b',
  far: '#2a1f3d', far2: '#33264a', mid: '#3a2a3f', mid2: '#442f45',
  winLit: '#ffd57a', winLit2: '#f7b955', winWarm: '#ff9f5a', winTv: '#7fd6ff', winDark: '#1d1a26', winDark2: '#262233',
  neonPink: '#ff3fa4', neonCyan: '#39f0ff', neonYellow: '#ffe14d', neonGreen: '#7dff6a', neonRed: '#ff4a3d', neonPurple: '#b45cff',
  metal: '#7c7a86', metal2: '#5d5b68', metal3: '#9d9ba8', rust: '#8a4b2f',
  shadow: 'rgba(10,6,16,0.45)',
};

export function rng(seed = 1) {
  let s = seed >>> 0 || 1;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
}
export const pick = (r, arr) => arr[Math.floor(r() * arr.length)];

export function canvas(w, h) {
  const c = document.createElement('canvas');
  c.width = Math.max(1, Math.ceil(w));
  c.height = Math.max(1, Math.ceil(h));
  const ctx = c.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  return [c, ctx];
}

export function rect(ctx, x, y, w, h, c) {
  ctx.fillStyle = c;
  ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
}
export function px(ctx, x, y, c) {
  ctx.fillStyle = c;
  ctx.fillRect(Math.round(x), Math.round(y), 1, 1);
}
export function line(ctx, x0, y0, x1, y1, c) {
  ctx.fillStyle = c;
  x0 = Math.round(x0); y0 = Math.round(y0); x1 = Math.round(x1); y1 = Math.round(y1);
  const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
  let err = dx + dy;
  for (;;) {
    ctx.fillRect(x0, y0, 1, 1);
    if (x0 === x1 && y0 === y1) break;
    const e2 = 2 * err;
    if (e2 >= dy) { err += dy; x0 += sx; }
    if (e2 <= dx) { err += dx; y0 += sy; }
  }
}
// Sagging cable between two points
export function wire(ctx, x0, y0, x1, y1, sag, c) {
  let px0 = x0, py0 = y0;
  const n = Math.max(4, Math.round(Math.abs(x1 - x0) / 4));
  for (let i = 1; i <= n; i++) {
    const t = i / n;
    const x = x0 + (x1 - x0) * t;
    const y = y0 + (y1 - y0) * t + Math.sin(Math.PI * t) * sag;
    line(ctx, px0, py0, x, y, c);
    px0 = x; py0 = y;
  }
}
// Checkerboard dither, the classic way to blend two tones
export function dither(ctx, x, y, w, h, c, phase = 0) {
  ctx.fillStyle = c;
  for (let j = 0; j < h; j++) for (let i = (j + phase) & 1; i < w; i += 2) ctx.fillRect(x + i, y + j, 1, 1);
}
export function speckle(ctx, x, y, w, h, colors, density, r) {
  const n = Math.round(w * h * density);
  for (let i = 0; i < n; i++) {
    ctx.fillStyle = pick(r, colors);
    ctx.fillRect(Math.round(x + r() * w), Math.round(y + r() * h), 1, 1);
  }
}
// Dirt streaks running down from a ledge
export function streaks(ctx, x, y, w, len, c, r, density = 0.3) {
  ctx.fillStyle = c;
  for (let i = 0; i < w; i++) if (r() < density) ctx.fillRect(x + i, y, 1, Math.round(len * (0.3 + r() * 0.7)));
}

// Brick wall with per-brick colour variation
export function brick(ctx, x, y, w, h, colors, mortar, r, bw = 6, bh = 3) {
  rect(ctx, x, y, w, h, mortar);
  for (let row = 0, yy = y; yy < y + h; row++, yy += bh) {
    const off = row % 2 ? Math.floor(bw / 2) : 0;
    for (let xx = x - off; xx < x + w; xx += bw) {
      const x0 = Math.max(x, xx), x1 = Math.min(x + w, xx + bw - 1);
      if (x1 > x0) rect(ctx, x0, yy, x1 - x0, Math.min(bh - 1, y + h - yy), pick(r, colors));
    }
  }
}
// Concrete / stucco with stains
export function concrete(ctx, x, y, w, h, base, spots, r, density = 0.08) {
  rect(ctx, x, y, w, h, base);
  speckle(ctx, x, y, w, h, spots, density, r);
}
// Grime band at the base of a wall
export function grime(ctx, x, y, w, h, c, r) {
  for (let j = 0; j < h; j++) {
    const d = 0.65 * (j / h);
    ctx.fillStyle = c;
    for (let i = 0; i < w; i++) if (r() < d) ctx.fillRect(x + i, y + j, 1, 1);
  }
}

// Window with frame, glass, interior life (lights, silhouettes, TV glow, curtains, bars)
export function window_(ctx, x, y, w, h, r, o = {}) {
  const frame = o.frame || '#1b1720';
  rect(ctx, x - 1, y - 1, w + 2, h + 2, frame);
  const lit = o.lit ?? r() < 0.45;
  const tv = !lit && r() < 0.2;
  const glass = lit ? pick(r, [P.winLit, P.winLit2, P.winWarm]) : tv ? '#2b4a66' : pick(r, [P.winDark, P.winDark2]);
  rect(ctx, x, y, w, h, glass);
  if (lit) {
    dither(ctx, x, y + h - 2, w, 2, P.winLit2);
    if (r() < 0.4) rect(ctx, x + 1 + Math.floor(r() * (w - 4)), y + h - 6, 3, 6, '#3a2a30'); // silhouette
    if (r() < 0.5) { rect(ctx, x, y, 2, h, o.curtain || '#b24a52'); rect(ctx, x + w - 2, y, 2, h, o.curtain || '#b24a52'); }
  } else if (tv) {
    dither(ctx, x, y, w, h, P.winTv, 1);
  } else {
    px(ctx, x + 1, y + 1, '#3d3850');
  }
  if (w > 6 && !o.noMullion) rect(ctx, x + Math.floor(w / 2), y, 1, h, frame);
  if (o.bars) for (let i = x + 1; i < x + w; i += 2) rect(ctx, i, y, 1, h, '#0d0a10');
  rect(ctx, x - 2, y + h + 1, w + 4, 1, o.sill || '#4a4250'); // sill
  return lit;
}

// Roll-down security shutter, optionally half open, tagged with graffiti
export function shutter(ctx, x, y, w, h, r, o = {}) {
  const c = o.color || '#6e6a78';
  rect(ctx, x, y, w, h, c);
  for (let j = y + 1; j < y + h; j += 2) rect(ctx, x, j, w, 1, o.groove || '#57535f');
  rect(ctx, x, y + h - 2, w, 2, '#3c3944');
  speckle(ctx, x, y, w, h, [P.rust, '#4a4652'], 0.04, r);
  if (o.tag !== false) tag(ctx, x + 2 + Math.floor(r() * Math.max(1, w - 24)), y + 2 + Math.floor(r() * Math.max(1, h - 10)), Math.min(22, w - 4), r);
}

// Graffiti tag: chunky squiggle with outline + drips
export function tag(ctx, x, y, w, r, color) {
  const c = color || pick(r, [P.neonPink, P.neonCyan, '#ffffff', P.neonYellow, P.neonGreen, '#ff7a2f', P.neonPurple]);
  const pts = [];
  let yy = y + 3;
  for (let i = 0; i <= w; i += 2) {
    yy = Math.max(y, Math.min(y + 6, yy + Math.round((r() - 0.5) * 4)));
    pts.push([x + i, yy]);
  }
  for (let i = 1; i < pts.length; i++) {
    line(ctx, pts[i - 1][0], pts[i - 1][1] + 1, pts[i][0], pts[i][1] + 1, P.ink);
    line(ctx, pts[i - 1][0], pts[i - 1][1], pts[i][0], pts[i][1], c);
    if (r() < 0.25) line(ctx, pts[i][0], pts[i][1] - 2, pts[i][0], pts[i][1] + 2, c);
  }
  for (let i = 0; i < 2; i++) {
    const [dx, dy] = pick(r, pts);
    rect(ctx, dx, dy + 1, 1, 2 + Math.floor(r() * 4), c);
  }
}

// Wheat-pasted posters, layered and torn
export function posters(ctx, x, y, w, h, r) {
  for (let i = 0; i < Math.round((w * h) / 70); i++) {
    const pw = 6 + Math.floor(r() * 6), ph = 8 + Math.floor(r() * 5);
    const px0 = x + Math.floor(r() * Math.max(1, w - pw)), py0 = y + Math.floor(r() * Math.max(1, h - ph));
    const c = pick(r, ['#e8dcc0', '#f2c14e', '#e04f5f', '#4fa3e0', '#ffffff', '#9be564', '#1d1a26']);
    rect(ctx, px0, py0, pw, ph, c);
    rect(ctx, px0 + 1, py0 + 2, pw - 2, 2, pick(r, ['#1d1a26', '#c22b4a', '#2a5ea8']));
    for (let l = py0 + 5; l < py0 + ph - 1; l += 2) rect(ctx, px0 + 1, l, Math.floor((pw - 2) * (0.4 + r() * 0.6)), 1, '#00000055');
    if (r() < 0.5) px(ctx, px0 + pw - 1, py0 + ph - 1, '#00000000');
  }
}

export function acUnit(ctx, x, y, r) {
  rect(ctx, x, y, 9, 6, '#b8b4c0');
  rect(ctx, x, y + 5, 9, 1, '#7c7888');
  for (let i = 1; i < 8; i += 2) rect(ctx, x + i, y + 1, 1, 3, '#8d899a');
  rect(ctx, x + 2, y + 6, 1, 1, '#5d8fb0');
  if (r && r() < 0.5) streaks(ctx, x + 1, y + 6, 7, 10, '#00000033', r, 0.4);
}
export function dish(ctx, x, y) {
  rect(ctx, x + 1, y, 5, 1, '#d8d4de'); rect(ctx, x, y + 1, 7, 3, '#cfcad6'); rect(ctx, x + 1, y + 4, 5, 1, '#a9a4b3');
  rect(ctx, x + 3, y + 5, 1, 3, '#7c7888'); px(ctx, x + 6, y - 1, '#7c7888');
}
export function fireEscape(ctx, x, y, w, floors, fh, c = '#16121a') {
  for (let f = 0; f < floors; f++) {
    const fy = y + f * fh;
    rect(ctx, x, fy, w, 1, c);
    rect(ctx, x, fy - 6, w, 1, c);
    for (let i = x; i <= x + w; i += 3) rect(ctx, i, fy - 6, 1, 6, c);
    if (f < floors - 1) line(ctx, x + 3, fy + 1, x + w - 3, fy + fh - 1, c);
  }
}
export function pipe(ctx, x, y, h, c = '#4a4652') {
  rect(ctx, x, y, 2, h, c);
  rect(ctx, x, y, 1, h, '#5d5966');
  for (let j = y + 6; j < y + h; j += 14) rect(ctx, x - 1, j, 4, 1, '#2e2a36');
}
export function trashBags(ctx, x, y, n, r) {
  for (let i = 0; i < n; i++) {
    const bx = x + i * 5 + Math.floor(r() * 2), by = y - 5 - (i % 2);
    rect(ctx, bx, by, 6, 5, '#141218'); rect(ctx, bx + 1, by - 1, 4, 1, '#141218'); px(ctx, bx + 3, by - 2, '#141218');
    px(ctx, bx + 1, by + 1, '#2c2934');
  }
}
// Soft light pool on the ground / wall (dithered so it stays pixel-art)
export function glow(ctx, cx, cy, rx, ry, c) {
  ctx.fillStyle = c;
  for (let y = -ry; y <= ry; y++)
    for (let x = -rx; x <= rx; x++) {
      const d = (x * x) / (rx * rx) + (y * y) / (ry * ry);
      if (d < 1 && (d < 0.35 || (x + y) % 2 === 0)) ctx.fillRect(cx + x, cy + y, 1, 1);
    }
}

// Add a 1px outline around every opaque pixel of a sprite canvas
export function outline(c, color = P.ink) {
  const ctx = c.getContext('2d');
  const { width: w, height: h } = c;
  const src = ctx.getImageData(0, 0, w, h);
  const out = ctx.createImageData(w, h);
  const a = (x, y) => (x < 0 || y < 0 || x >= w || y >= h ? 0 : src.data[(y * w + x) * 4 + 3]);
  const [r0, g0, b0] = [1, 3, 5].map((i) => parseInt(color.slice(i, i + 2), 16));
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      if (src.data[i + 3] > 0) {
        out.data.set(src.data.subarray(i, i + 4), i);
      } else if (a(x - 1, y) || a(x + 1, y) || a(x, y - 1) || a(x, y + 1)) {
        out.data[i] = r0; out.data[i + 1] = g0; out.data[i + 2] = b0; out.data[i + 3] = 255;
      }
    }
  ctx.putImageData(out, 0, 0);
  return c;
}
export function flipped(c) {
  const [f, ctx] = canvas(c.width, c.height);
  ctx.translate(c.width, 0);
  ctx.scale(-1, 1);
  ctx.drawImage(c, 0, 0);
  return f;
}
export const shade = (hex, amt) => {
  const n = parseInt(hex.slice(1, 7), 16);
  const f = (v) => Math.max(0, Math.min(255, Math.round(v + amt * 255)));
  return `#${[(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => f(v).toString(16).padStart(2, '0')).join('')}`;
};
