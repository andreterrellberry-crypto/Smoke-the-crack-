// The cast is hand-drawn art (cut from the cast lineup) played as cut-out puppets, the way the MAD cartoon moved
// its characters: the figure is sliced into thin bands that lean and breathe over planted feet, the head tips
// and nods on a bend above the neck, and the whole figure squashes, stretches and hops. Poses are held for a few
// frames at a time for the jumpy cartoon timing. Each figure is lit as it's drawn: a warm key light from the upper
// left, a cool shadow falling away to the right, and darker legs where the ground swallows the light.
import tbone from '../assets/cast/tbone.webp?inline';
import fresh from '../assets/cast/fresh.webp?inline';
import mandrake from '../assets/cast/mandrake.webp?inline';
import karim from '../assets/cast/karim.webp?inline';
import chidi from '../assets/cast/chidi.webp?inline';
import ryo from '../assets/cast/ryo.webp?inline';
import shaz from '../assets/cast/shaz.webp?inline';
import booster from '../assets/cast/booster.webp?inline';

// neck: where the head meets the body, hip: the waist line, nx: x of the neck, hx: x of the face centre (fractions)
export const CAST = {
  'north-america': { src: tbone, neck: 0.33, hip: 0.58, nx: 0.5, hx: 0.56 },
  canada: { src: fresh, neck: 0.245, hip: 0.52, nx: 0.5, hx: 0.6 },
  'south-america': { src: mandrake, neck: 0.38, hip: 0.62, nx: 0.5, hx: 0.56 },
  europe: { src: karim, neck: 0.25, hip: 0.48, nx: 0.5, hx: 0.6 },
  africa: { src: chidi, neck: 0.33, hip: 0.62, nx: 0.52, hx: 0.6 },
  asia: { src: ryo, neck: 0.27, hip: 0.56, nx: 0.45, hx: 0.6 },
  oceania: { src: shaz, neck: 0.36, hip: 0.62, nx: 0.5, hx: 0.56 },
  booster: { src: booster, neck: 0.32, hip: 0.6, nx: 0.55, hx: 0.55 },
};

export async function loadCast() {
  await Promise.all(Object.values(CAST).map((m) => new Promise((res) => {
    const img = new Image();
    img.onload = () => { legs(m); res(); };
    img.onerror = () => res();
    img.src = m.src;
    m.img = img;
  })));
}
// trace the gap between the legs row by row, so a walk can pull the two legs apart along the real seam
function legs(m) {
  const img = m.img, h = 160, w = Math.max(8, Math.round((img.naturalWidth * h) / img.naturalHeight));
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const x = c.getContext('2d', { willReadFrequently: true });
  x.drawImage(img, 0, 0, w, h);
  const a = x.getImageData(0, 0, w, h).data;
  const solid = (cx, cy) => a[(cy * w + cx) * 4 + 3] > 60;
  const top = Math.round(h * m.hip);
  const gap = new Array(h).fill(null);
  for (let row = top; row < h; row++) {
    const runs = [];
    let st = -1;
    for (let cx = 0; cx <= w; cx++) {
      const on = cx < w && solid(cx, row);
      if (on && st < 0) st = cx;
      if (!on && st >= 0) { runs.push([st, cx]); st = -1; }
    }
    if (!runs.length) continue;
    // the two legs are the two widest runs nearest the middle; arms hanging at the sides are ignored
    const mid = (runs[0][0] + runs[runs.length - 1][1]) / 2;
    const big = runs.filter(([p, q]) => q - p > w * 0.06).sort((p, q) => Math.abs((p[0] + p[1]) / 2 - mid) - Math.abs((q[0] + q[1]) / 2 - mid)).slice(0, 2).sort((p, q) => p[0] - q[0]);
    gap[row] = big.length === 2 ? (big[0][1] + big[1][0]) / 2 / w : null;
  }
  // rows where the legs touch take the nearest traced gap; above that, the crotch
  let last = null;
  for (let row = h - 1; row >= top; row--) { if (gap[row] != null) last = gap[row]; else gap[row] = last; }
  const fill = gap.find((g) => g != null) ?? 0.5;
  for (let row = 0; row < h; row++) if (gap[row] == null) gap[row] = fill;
  // smooth the seam so the split never zigzags
  m.gap = gap.map((_, i) => { let sum = 0, n = 0; for (let k = -3; k <= 3; k++) { const g = gap[Math.max(0, Math.min(h - 1, i + k))]; sum += g; n++; } return sum / n; });
}
const gapAt = (m, v) => (m.gap ? m.gap[Math.max(0, Math.min(m.gap.length - 1, Math.round(v * m.gap.length)))] : 0.5);

// the natural height of a character in lineup pixels: keeps everyone's height relative to each other
export const castPx = (id) => CAST[id].img?.naturalHeight || 600;

// downscaled copies so every frame draws from an image near its on-screen size
const cache = new Map();
function sized(id, pxH) {
  const m = CAST[id], img = m.img;
  const target = Math.max(32, Math.min(img.naturalHeight, Math.ceil(pxH / 24) * 24));
  const key = `${id}:${target}`;
  if (cache.has(key)) return cache.get(key);
  let src = img, w = img.naturalWidth, h = img.naturalHeight;
  // halve in steps for a clean downscale, then land on the target size
  while (h / 2 > target * 1.1) {
    const c = document.createElement('canvas');
    c.width = Math.ceil(w / 2); c.height = Math.ceil(h / 2);
    const x = c.getContext('2d');
    x.imageSmoothingQuality = 'high';
    x.drawImage(src, 0, 0, c.width, c.height);
    src = c; w = c.width; h = c.height;
  }
  const c = document.createElement('canvas');
  c.height = target; c.width = Math.max(1, Math.round((w * target) / h));
  const x = c.getContext('2d');
  x.imageSmoothingQuality = 'high';
  x.drawImage(src, 0, 0, c.width, c.height);
  cache.set(key, c);
  return c;
}

// poses: lean (fraction of height at the head), tilt (head turn, radians), nod (head drop), sq (squash > 0,
// stretch < 0), hop (lift as a fraction of height), breathe (chest swell)
const POSES = {
  idle: {},
  bob: { sq: 0.035, nod: 1 },
  blink: { sq: -0.012, tilt: 0.025 },
  talk: { nod: 1.4, tilt: 0.07, sq: -0.02, breathe: 0.035 },
  talk2: { tilt: -0.05, sq: 0.03, lean: 0.015 },
  wave: { lean: 0.03, tilt: 0.08, hop: 0.015, sq: -0.045 },
  point: { lean: 0.05, tilt: 0.04, sq: -0.025 },
  thumb: { lean: -0.015, tilt: -0.06, sq: 0.035, nod: 0.8 },
  look: { tilt: -0.12, lean: -0.022 },
  hop: { hop: 0.07, sq: -0.08, tilt: 0.05 },
  laugh: { tilt: -0.16, lean: -0.03, sq: 0.05, breathe: 0.05 },
};
// an actor: every pose as a ready-to-draw object carrying the character's id
export function puppet(id) {
  const a = { id };
  for (const [k, p] of Object.entries(POSES)) a[k] = { id, ...p };
  return a;
}

export const LIGHT = {
  day: { hi: 'rgba(255,240,200,0.20)', lo: 'rgba(40,24,90,0.24)', floor: 'rgba(30,20,60,0.22)' },
  night: { hi: 'rgba(255,214,120,0.22)', lo: 'rgba(10,6,40,0.42)', floor: 'rgba(10,6,40,0.35)' },
};
export const shopLight = (color) => ({ hi: hexA(color, 0.22), lo: 'rgba(30,16,70,0.28)', floor: 'rgba(20,10,50,0.26)' });
function hexA(hex, a) { const n = parseInt(hex.slice(1, 7), 16); return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`; }

const scratch = document.createElement('canvas');
const sx = scratch.getContext('2d');

// draw a character standing with its feet at (x, y), H world units tall, in pose P
export function drawPuppet(ctx, id, x, y, H, P = {}, o = {}) {
  const m = CAST[id];
  if (!m?.img?.naturalHeight) return;
  const k = Math.hypot(ctx.getTransform().a, ctx.getTransform().b) || 1; // device px per world unit
  const sq = P.sq || 0, sxA = 1 + sq * 0.9, syA = 1 - sq;
  const img = sized(id, H * k * syA * 1.05);
  const s = H / img.height; // world units per source px
  const bw = img.width * s * sxA;
  const pad = H * 0.22, Wu = bw + pad * 2, Hu = H * (1.12 + (P.hop || 0)) + pad;
  const wpx = Math.ceil(Wu * k), hpx = Math.ceil(Hu * k);
  if (scratch.width < wpx || scratch.height < hpx) { scratch.width = Math.max(scratch.width, wpx); scratch.height = Math.max(scratch.height, hpx); }
  sx.setTransform(1, 0, 0, 1, 0, 0);
  sx.clearRect(0, 0, wpx + 2, hpx + 2);
  sx.setTransform(k, 0, 0, k, 0, 0);
  sx.imageSmoothingQuality = 'high';
  if (o.flip) { sx.translate(Wu, 0); sx.scale(-1, 1); }
  const cx = Wu / 2, feet = Hu - pad * 0.5 - (P.hop || 0) * H - (P.walk != null ? Math.abs(Math.cos(P.walk)) * H * 0.022 : 0);
  const walking = P.walk != null;
  const lean = (P.lean || 0) + (walking ? 0.025 : 0), breathe = P.breathe || 0;
  // feet planted, the body leans more the higher up it goes (a walker leans from the hips instead)
  const dxAt = (v) => lean * H * Math.pow(walking ? Math.max(0, (m.hip - v) / m.hip) : 1 - v, 1.5);
  // bands from the feet up: the body leans over planted feet and swells on a breath; above the neck the bands
  // bend further and drop for a nod, so the head tips and bobs with no hinge or seam (hoods and collars that
  // rise behind the head bend along with it)
  const BANDS = Math.max(40, Math.min(260, Math.round((H * k) / 3.5))); // a band every few device pixels: no visible steps
  let yb = feet;
  const stride = walking ? Math.sin(P.walk) : 0, kneeV = m.hip + 0.06;
  const tilt = P.tilt || 0, nod = (P.nod || 0) * H * 0.012;
  for (let i = BANDS - 1; i >= 0; i--) {
    const v0 = i / BANDS, vm = (i + 0.5) / BANDS, srcY = v0 * img.height, srcH = img.height / BANDS;
    const torso = vm > m.neck && vm < m.hip, above = vm < m.neck;
    const hU = srcH * s * syA * (torso ? 1 + breathe : 1);
    const w = bw * (torso ? 1 + breathe * 0.5 : 1);
    const dx = dxAt(vm) + (above ? tilt * 1.6 * (m.neck - vm) * H : 0);
    const sh = Math.min(srcH + 1, img.height - srcY), y0 = yb - hU + nod * Math.min(1, Math.max(0, (m.neck - vm) / 0.07));
    if (walking && vm > kneeV) {
      // walking: the legs come apart along their seam, the stride growing from the knees down to the feet
      const g = gapAt(m, vm), f = Math.pow((vm - kneeV) / (1 - kneeV), 1.5), d = stride * H * 0.17 * f;
      const lift = H * 0.03 * f;
      sx.drawImage(img, 0, srcY, (g + 0.006) * img.width, sh, cx - w / 2 + dx - d, y0 - Math.max(0, -stride) * lift, (g + 0.006) * w, hU + 1 / k);
      sx.drawImage(img, g * img.width, srcY, (1 - g) * img.width, sh, cx - w / 2 + g * w + dx + d, y0 - Math.max(0, stride) * lift, (1 - g) * w, hU + 1 / k);
    } else sx.drawImage(img, 0, srcY, img.width, sh, cx - w / 2 + dx, y0, w, hU + 1 / k);
    yb -= hU;
  }
  // lighting, only where the figure is
  const L = o.light || LIGHT.day;
  sx.setTransform(k, 0, 0, k, 0, 0);
  sx.globalCompositeOperation = 'source-atop';
  const gx = sx.createLinearGradient(pad, 0, Wu - pad, 0);
  gx.addColorStop(0, L.hi); gx.addColorStop(0.45, 'rgba(0,0,0,0)'); gx.addColorStop(0.62, 'rgba(0,0,0,0)'); gx.addColorStop(1, L.lo);
  sx.fillStyle = gx; sx.fillRect(0, 0, Wu, Hu);
  const gy = sx.createLinearGradient(0, feet - H * 0.45, 0, feet);
  gy.addColorStop(0, 'rgba(0,0,0,0)'); gy.addColorStop(1, L.floor);
  sx.fillStyle = gy; sx.fillRect(0, 0, Wu, Hu);
  if (o.tint) { sx.fillStyle = o.tint; sx.fillRect(0, 0, Wu, Hu); }
  sx.globalCompositeOperation = 'source-over';
  // ground shadow, then the figure
  if (o.shadow !== false) {
    ctx.fillStyle = 'rgba(22,18,28,0.22)';
    ctx.beginPath();
    ctx.ellipse(x, y, bw * 0.42, Math.max(1.2, H * 0.03), 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.drawImage(scratch, 0, 0, wpx, hpx, x - Wu / 2, y - feet, Wu, Hu);
}

// head-and-shoulders portrait for the dialogue box
export function puppetPortrait(id, px = 120) {
  const m = CAST[id], img = m.img;
  const c = document.createElement('canvas');
  c.width = c.height = px;
  if (!img?.naturalHeight) return c;
  const side = img.naturalHeight * (m.neck + 0.06);
  const x0 = m.hx * img.naturalWidth - side / 2;
  const x = c.getContext('2d');
  x.imageSmoothingQuality = 'high';
  x.drawImage(img, x0, 0, side, side, 0, px * 0.04, px, px);
  return c;
}
