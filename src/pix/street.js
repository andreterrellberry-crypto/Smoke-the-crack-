// The block at night: pre-rendered pixel layers + a light live layer (people, traffic, neon, steam).
import { P, rng, pick, canvas, rect, px, line, wire, dither, speckle, brick, window_, glow, shade } from './draw.js';
import { text, measure } from './font.js';
import { FACADES, SW, ALLEY_W, construction, paintBoosterCorner, paintCorner, lampPost, lampPools, hydrant, trashCan, payphone, newsBox, pole, neonSign } from './facades.js';
import { buildWalker, buildStander, buildBooster, pedestrianSpec, pigeonFrames, catFrames, carFrames, carType, FW, FH } from './sprites.js';

export const MAIN_H = 268;
export const G = 192; // sidewalk meets the buildings
const CURB = 216;
const LANE = 266; // bottom of moving cars
const CORNER_W = 120;

const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

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

export function createStreet({ cv, stores, itemsByStore, openById, countById, pedItems, boosterItems, onStore, onBooster, onPedestrian, onHover }) {
  const { segs, width: W } = buildLayout(stores);
  const r = rng(77);
  const ctx = cv.getContext('2d');

  // ---------- MAIN layer (buildings, sidewalk, road) ----------
  const [main, m] = canvas(W, MAIN_H);
  const [fg, f] = canvas(W, MAIN_H);
  const doors = {};
  const tops = {};
  const neon = [];
  const fx = { steam: [], smoke: [] };
  let alleyInfo = null;

  // sidewalk
  rect(m, 0, G, W, CURB - G, P.walk);
  for (let x = 0; x < W; x += 16) rect(m, x, G, 1, CURB - G, P.walkLine);
  rect(m, 0, G + 12, W, 1, P.walkLine);
  speckle(m, 0, G, W, CURB - G, [P.gum, P.walk2, '#4a4450'], 0.06, r);
  for (let i = 0; i < 40; i++) { const cx = Math.floor(r() * W), cy = G + 2 + Math.floor(r() * 20); line(m, cx, cy, cx + 3 + Math.floor(r() * 6), cy + Math.floor(r() * 3), '#3a3440'); }
  rect(m, 0, CURB, W, 1, P.curbTop); rect(m, 0, CURB + 1, W, 3, P.curb);
  // road
  rect(m, 0, CURB + 4, W, MAIN_H - CURB - 4, P.asphalt);
  speckle(m, 0, CURB + 4, W, MAIN_H - CURB - 4, [P.asphalt2, '#322e38', '#1e1b22'], 0.12, r);
  for (let i = 0; i < 14; i++) { const px0 = Math.floor(r() * W), w = 10 + Math.floor(r() * 30); rect(m, px0, CURB + 8 + Math.floor(r() * 30), w, 4 + Math.floor(r() * 5), '#211e26'); }
  for (let x = 0; x < W; x += 28) if (r() > 0.2) rect(m, x, 244, 14, 2, r() > 0.3 ? P.lane : '#8a7a3a');
  for (const cx of [CORNER_W - 30, W - CORNER_W + 6]) for (let i = 0; i < 6; i++) rect(m, cx + i * 4, CURB + 6, 2, MAIN_H - CURB - 8, '#cfcbd6');

  // buildings
  for (const seg of segs) {
    if (seg.kind === 'corner') {
      const c = paintCorner(m, seg.x, G, r, seg.end);
      neon.push(...c.neon);
    } else if (seg.kind === 'alley') {
      alleyInfo = paintBoosterCorner(m, seg.x, G, r, boosterItems);
      neon.push(...alleyInfo.neon);
      fx.steam.push({ ...alleyInfo.steam, p: [] });
    } else {
      const st = stores.find((s) => s.id === seg.id);
      const items = itemsByStore[st.id];
      const res = FACADES[st.id](m, seg.x, G, r, items);
      if (!openById[st.id]) construction(m, seg.x, G, res, st, r);
      doors[st.id] = res.door;
      tops[st.id] = res.top;
      if (openById[st.id]) neon.push(...res.neon);
      if (res.smoke) fx.smoke.push({ ...res.smoke, p: [] });
    }
  }
  const mhX = segs.find((s) => s.id === 'europe').x + 40;
  rect(m, mhX - 8, 235, 16, 3, '#1a171e'); rect(m, mhX - 6, 236, 12, 1, '#3a3640');
  fx.steam.push({ x: mhX, y: 234, p: [] });

  // ---------- FOREGROUND props (always in front of people) ----------
  const fgLamps = [];
  segs.forEach((seg, i) => {
    if (i === 0) return;
    const bx = seg.x;
    if (seg.kind !== 'alley' && segs[i - 1].kind !== 'alley') { lampPost(f, bx - 1, CURB); fgLamps.push(bx - 1); }
    if (seg.kind === 'store') (i % 2 ? hydrant(f, bx + 24, CURB) : trashCan(f, bx + 20, CURB, r));
  });
  for (const lx of fgLamps) lampPools(m, lx, CURB, G);
  payphone(f, segs[1].x + 140, CURB);
  newsBox(f, segs.find((s) => s.id === 'europe').x + 140, CURB, '#2a5ea8');
  newsBox(f, segs.find((s) => s.id === 'canada').x + 140, CURB, '#c8302a');
  // utility poles + sagging lines across the whole block
  const poles = [];
  // poles stand at party walls (every other building) so they never cover a sign
  segs.forEach((seg, i) => { if (i % 2 === 0 && seg.kind !== 'alley' && segs[i - 1]?.kind !== 'alley') { pole(f, seg.x - 2, CURB); poles.push(seg.x - 2); } });
  for (let i = 1; i < poles.length; i++) for (let k = 0; k < 3; k++) wire(f, poles[i - 1] + (k ? 9 : -6), CURB - 165 + k * 3, poles[i] + (k ? 9 : -6), CURB - 165 + k * 3, 8 + k * 2, '#0e0a12');
  // parked cars
  for (const [px0, t, c] of [[segs[2].x + 20, 'sedan', '#6a7a3a'], [segs.find((s) => s.id === 'europe').x + 90, 'hatch', '#8a8a96'], [segs.find((s) => s.id === 'oceania').x + 40, 'lowrider', '#5a2a7a']]) {
    const cf = carFrames(t, c, r);
    f.drawImage(cf.frames[0], px0, 242 - 26);
  }

  // ---------- parallax skylines ----------
  const farW = Math.ceil(W * 0.3 + 1400), midW = Math.ceil(W * 0.6 + 1400);
  const [far, fa] = canvas(farW, 230);
  for (let x = 0; x < farW; ) {
    const w = 24 + Math.floor(r() * 46), h = 90 + Math.floor(r() * 130);
    rect(fa, x, 230 - h, w, h, pick(r, [P.far, P.far2]));
    if (r() < 0.3) rect(fa, x + Math.floor(w / 2), 230 - h - 12, 1, 12, P.far2);
    if (r() < 0.3) px(fa, x + Math.floor(w / 2), 230 - h - 13, P.neonRed);
    for (let wy = 230 - h + 4; wy < 228; wy += 5) for (let wx = x + 2; wx < x + w - 2; wx += 4) if (r() < 0.16) px(fa, wx, wy, pick(r, ['#ffd57a', '#f7b955', '#a8c8ff']));
    x += w + Math.floor(r() * 6);
  }
  const [mid, mi] = canvas(midW, 200);
  for (let x = 0; x < midW; ) {
    const w = 40 + Math.floor(r() * 60), h = 80 + Math.floor(r() * 100);
    const projects = r() < 0.4;
    if (projects) rect(mi, x, 200 - h, w, h, pick(r, [P.mid, P.mid2]));
    else brick(mi, x, 200 - h, w, h, ['#3a2a3f', '#40303f', '#36263a'], '#2a1e2e', r);
    for (let wy = 200 - h + 6; wy < 196; wy += projects ? 8 : 12) for (let wx = x + 3; wx < x + w - 4; wx += projects ? 6 : 10) {
      const lit = r() < 0.22;
      rect(mi, wx, wy, projects ? 3 : 5, projects ? 3 : 6, lit ? pick(r, ['#e8b860', '#d89a50', '#9ac0e8']) : '#241a2a');
    }
    if (r() < 0.45) { const tx = x + 6 + Math.floor(r() * (w - 18)); rect(mi, tx, 200 - h - 14, 10, 10, '#4a3030'); rect(mi, tx - 1, 200 - h - 16, 12, 2, '#3a2424'); rect(mi, tx + 1, 200 - h - 4, 1, 4, '#2a1e2e'); rect(mi, tx + 8, 200 - h - 4, 1, 4, '#2a1e2e'); }
    if (r() < 0.2) { rect(mi, x + 4, 200 - h - 20, 30, 14, '#2a1e2e'); rect(mi, x + 5, 200 - h - 19, 28, 12, pick(r, ['#4a2a5a', '#2a3a5a', '#5a2a2a'])); }
    x += w + Math.floor(r() * 4);
  }

  // ---------- sprites ----------
  const tops2 = pedItems.filter((i) => ['hoodie', 'tee', 'jersey', 'shirt', 'jacket', 'coat'].includes(i.type));
  const pants = pedItems.filter((i) => i.type === 'pants');
  const shoes = pedItems.filter((i) => i.type === 'sneaker');
  const peds = [];
  for (let i = 0; i < 7; i++) {
    const top = tops2[Math.floor(r() * tops2.length)];
    const spec = pedestrianSpec(top, r() > 0.6 ? pick(r, pants) : null, r() > 0.6 ? pick(r, shoes) : null, r);
    peds.push({ item: top, sp: buildWalker(spec), x: r() * W, y: 200 + Math.floor(r() * 15), dir: r() > 0.5 ? 1 : -1, speed: 16 + r() * 12, t: r() * 4, pause: 0 });
  }
  // loiterers posted up outside shops (front-facing), also wearing stock
  const loiter = [];
  const spots = [['north-america', 8, 199], ['north-america', 104, 201], ['europe', 120, 200], ['africa', 148, 202], ['oceania', 112, 199], ['canada', 8, 200]];
  for (const [sid, ox, y] of spots) {
    if (!openById[sid]) continue;
    const seg = segs.find((s) => s.id === sid);
    const top = pick(r, tops2);
    const spec = { ...pedestrianSpec(top, null, pick(r, shoes), r), acc: { phone: r() > 0.4, chain: r() > 0.5 } };
    loiter.push({ item: top, sp: buildStander(spec), x: seg.x + ox, y, t: r() * 5 });
  }
  const booster = buildBooster();
  const pigeons = pigeonFrames();
  const cat = catFrames();
  const flocks = [segs[3].x + 60, segs.find((s) => s.id === 'asia').x + 30, W - 200].map((x) => ({ x, birds: [0, 7, 15].map((o) => ({ o, peck: 0 })), flying: 0 }));

  // store tags
  const tagCanvas = (st, hover) => {
    const label = openById[st.id] ? `${st.region} ${hover ? '> ENTER' : `• ${countById[st.id]}`}` : `${st.region} • CLOSED`;
    const w = measure(label, 'small') + 8;
    const [c, x] = canvas(w, 11);
    const bg = !openById[st.id] ? '#f6c42b' : hover ? P.neonYellow : '#f4efe2';
    rect(x, 0, 0, w, 10, P.ink);
    rect(x, 1, 1, w - 2, 8, bg);
    rect(x, 1, 10, w - 1, 1, '#00000088');
    text(x, label, 4, 3, P.ink, { font: 'small' });
    return c;
  };
  const tags = Object.fromEntries(stores.map((s) => [s.id, { n: tagCanvas(s, false), h: tagCanvas(s, true) }]));
  const boosterTag = (hover) => {
    const label = hover ? "BOOSTER CORNER > TRUNK" : 'BOOSTER CORNER • RARE';
    const w = measure(label, 'small') + 8;
    const [c, x] = canvas(w, 11);
    rect(x, 0, 0, w, 10, '#f2c14e'); rect(x, 1, 1, w - 2, 8, hover ? '#f2c14e' : '#0d0a10');
    rect(x, 1, 10, w - 1, 1, '#00000088');
    text(x, label, 4, 3, hover ? '#0d0a10' : '#f2c14e', { font: 'small' });
    return c;
  };
  const bTags = { n: boosterTag(false), h: boosterTag(true) };
  const bubble = (() => {
    const line1 = "AIN'T NOBODY", line2 = 'GOT THESE.';
    const w = Math.max(measure(line1, 'small'), measure(line2, 'small')) + 12;
    const [c, x] = canvas(w, 22);
    rect(x, 0, 0, w, 18, P.ink); rect(x, 1, 1, w - 2, 16, '#f4efe2');
    rect(x, w - 14, 18, 4, 2, P.ink); rect(x, w - 13, 17, 2, 2, '#f4efe2'); px(x, w - 12, 20, P.ink);
    text(x, line1, w / 2, 3, P.ink, { font: 'small', align: 'center' });
    text(x, line2, w / 2, 10, '#b8861e', { font: 'small', align: 'center' });
    return c;
  })();
  const coneR = (() => {
    const [c, x] = canvas(40, 14);
    for (let i = 0; i < 40; i++) for (let j = 0; j < 14; j++) { const k = i / 40; if (Math.abs(j - 7) < 2 + k * 5 && (i + j) % 2 === 0) { x.globalAlpha = 0.5 * (1 - k); px(x, i, j, '#fff2b0'); } }
    return c;
  })();
  const coneL = (() => { const [c, x] = canvas(40, 14); x.translate(40, 0); x.scale(-1, 1); x.drawImage(coneR, 0, 0); return c; })();

  // ---------- camera + view ----------
  let scale = 3, viewW = 400, viewH = 300, mainY = 0;
  let camX = 0, walking = null, vel = 0, bob = 0;
  let sky = null;
  function buildSky() {
    const [c, s] = canvas(viewW, viewH);
    const horizon = mainY + G - 40;
    const stops = [[0, P.skyTop], [0.45, P.skyMid], [0.75, P.skyLow], [0.92, P.skyGlow], [1, P.skyHaze]];
    for (let y = 0; y < viewH; y++) {
      const t = Math.min(1, y / Math.max(1, horizon));
      let k = 0;
      while (k < stops.length - 2 && t > stops[k + 1][0]) k++;
      const [t0, c0] = stops[k], [t1, c1] = stops[k + 1];
      const u = (t - t0) / (t1 - t0);
      rect(s, 0, y, viewW, 1, u > 0.5 ? c1 : c0);
      if (u > 0.25 && u < 0.75) dither(s, 0, y, viewW, 1, u > 0.5 ? c0 : c1, y);
    }
    const sr = rng(5);
    for (let i = 0; i < viewW * 0.25; i++) px(s, Math.floor(sr() * viewW), Math.floor(sr() * horizon * 0.6), sr() > 0.8 ? '#ffffff' : '#9a8ab8');
    const mx = viewW - 46, my = Math.max(18, horizon * 0.2);
    glow(s, mx, my, 18, 18, '#f4e8c822');
    for (let y = -8; y <= 8; y++) for (let x = -8; x <= 8; x++) if (x * x + y * y <= 64) px(s, mx + x, my + y, x * x + y * y > 40 ? '#e8dcb8' : '#f6eed6');
    px(s, mx - 3, my - 2, '#d8cca8'); px(s, mx + 2, my + 3, '#d8cca8'); rect(s, mx + 1, my - 4, 2, 2, '#d8cca8');
    sky = c;
  }
  function resize() {
    scale = Math.max(1, Math.floor(Math.min(innerHeight / 270, innerWidth / 170)));
    viewW = Math.ceil(innerWidth / scale);
    viewH = Math.ceil(innerHeight / scale);
    cv.width = viewW;
    cv.height = viewH;
    cv.style.width = `${viewW * scale}px`;
    cv.style.height = `${viewH * scale}px`;
    ctx.imageSmoothingEnabled = false;
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
      const key = h ? h.store || (h.booster && 'booster') || (h.ped && 'ped') : null;
      cv.style.cursor = key ? 'pointer' : 'grab';
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
    camX = clampCam(camX + (Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY) / scale * 1.2);
  }, { passive: false });
  const keys = new Set();
  addEventListener('keydown', (e) => {
    if (!active || e.target.closest?.('input')) return;
    if (['ArrowRight', 'ArrowLeft', 'd', 'a'].includes(e.key)) keys.add(e.key);
  });
  addEventListener('keyup', (e) => keys.delete(e.key));

  // ---------- frame ----------
  let t = 0;
  let entering = null;
  const neonState = neon.map(() => ({ on: true, next: Math.random() * 6 }));
  function particles(src, dt, color, rate) {
    src.acc = (src.acc || 0) + dt * rate;
    while (src.acc > 1) { src.acc--; src.p.push({ x: src.x + (Math.random() - 0.5) * 4, y: src.y, life: 0 }); }
    for (const p of src.p) { p.life += dt; p.y -= dt * 10; p.x += Math.sin(p.life * 3 + p.y) * dt * 3; }
    src.p = src.p.filter((p) => p.life < 2.4);
    for (const p of src.p) {
      const a = 1 - p.life / 2.4, sz = 1 + Math.floor(p.life * 1.6);
      ctx.globalAlpha = a * 0.5;
      ctx.fillStyle = color;
      ctx.fillRect(Math.round(p.x - camX - sz / 2), Math.round(mainY + p.y - sz / 2 + bob), sz, sz);
    }
    ctx.globalAlpha = 1;
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
    bob = moving ? Math.floor(t * 7) % 2 : 0;

    for (const p of peds) {
      if (p.pause > 0) p.pause -= dt;
      else { p.x += p.dir * p.speed * dt; p.t += dt * p.speed * 0.16; }
      if (p.x > W + 20) p.x = -20;
      if (p.x < -20) p.x = W + 20;
    }
    nextCar -= dt;
    if (nextCar <= 0 && cars.length < 2) {
      const dir = Math.random() > 0.5 ? 1 : -1;
      const cf = carFrames(carType(r), pick(r, ['#2e7a4a', '#b02a2a', '#2a4a8a', '#d9b23a', '#d8d4de', '#5a2a7a', '#1a1a1a']), r);
      if (dir < 0) cf.frames = cf.frames.map((c) => { const [fc, fx2] = canvas(c.width, c.height); fx2.translate(c.width, 0); fx2.scale(-1, 1); fx2.drawImage(c, 0, 0); return fc; });
      cars.push({ ...cf, dir, x: dir > 0 ? camX - cf.w - 40 : camX + viewW + 40, speed: 70 + Math.random() * 40 });
      nextCar = 5 + Math.random() * 8;
    }
    for (const c of cars) c.x += c.dir * c.speed * dt;
    for (let i = cars.length - 1; i >= 0; i--) if ((cars[i].dir > 0 && cars[i].x > camX + viewW + 120) || (cars[i].dir < 0 && cars[i].x < camX - 160)) cars.splice(i, 1);
    for (const fl of flocks) {
      if (fl.flying > 0) fl.flying -= dt;
      else if (peds.some((p) => Math.abs(p.x - fl.x - 8) < 10 && p.pause <= 0)) fl.flying = 3;
      for (const b of fl.birds) if (Math.random() < dt * 1.5) b.peck = b.peck ? 0 : 1;
    }
    for (const n of neonState) { n.next -= dt; if (n.next <= 0) { n.on = !n.on; n.next = n.on ? 2 + Math.random() * 8 : 0.05 + Math.random() * 0.25; } }
    render();
  }

  function render() {
    const cx = Math.round(camX);
    ctx.drawImage(sky, 0, 0);
    const baseY = mainY + G;
    ctx.drawImage(far, Math.round(camX * 0.3), 0, viewW, 230, 0, baseY - 230 - 40 + bob, viewW, 230);
    ctx.drawImage(mid, Math.round(camX * 0.6), 0, viewW, 200, 0, baseY - 200 - 6 + bob, viewW, 200);
    ctx.drawImage(main, cx, 0, viewW, MAIN_H, 0, mainY + bob, viewW, MAIN_H);
    const oy = mainY + bob - 0;
    // neon
    neon.forEach((n, i) => {
      const st = neonState[i];
      if (n.x + n.c.width < cx || n.x > cx + viewW) return;
      ctx.globalAlpha = st.on ? 1 : n.slow ? 0.7 : 0.25;
      ctx.drawImage(n.c, Math.round(n.x - cx), Math.round(oy + n.y));
    });
    ctx.globalAlpha = 1;
    // door spill when entering
    if (entering) {
      const d = doors[entering];
      rect(ctx, d.x - cx, oy + d.y, d.w, d.h, '#ffd57a');
      dither(ctx, d.x - cx - 4, oy + d.y + d.h - 2, d.w + 8, 6, '#ffd57a');
    }
    // cat on the van roof + the booster by the open trunk
    if (alleyInfo) {
      ctx.drawImage(cat[Math.floor(t * 1.2) % 2], Math.round(alleyInfo.cat.x - cx), Math.round(oy + alleyInfo.cat.y));
      const b = alleyInfo.booster;
      const near = Math.abs(b.x + 30 - (cx + viewW / 2)) < viewW * 0.35 || hover === 'booster';
      const ph = t % 3;
      const bf = near && ph > 0.4 && ph < 1.6 ? (Math.floor(t * 6) % 2 ? booster.talk : booster.idle) : t % 4.4 < 0.25 ? booster.blink : booster.idle;
      ctx.drawImage(bf, Math.round(b.x - FW / 2 - cx), Math.round(oy + b.y - FH + 1));
      if (near) ctx.drawImage(bubble, Math.round(b.x - bubble.width + 12 - cx), Math.round(oy + b.y - 70));
      const tg = bTags[hover === 'booster' ? 'h' : 'n'];
      ctx.drawImage(tg, Math.round(b.x + 36 - tg.width / 2 - cx), Math.round(oy + G - 166));
    }
    // loiterers + walkers, back to front
    const actors = [
      ...loiter.map((l) => ({ y: l.y, draw: () => { const ph = (t + l.t) % 6; const fr = ph < 0.15 ? l.sp.blink : ph > 3 && ph < 4.2 && Math.floor(ph * 6) % 2 ? l.sp.talk : l.sp.idle; ctx.drawImage(fr, Math.round(l.x - FW / 2 - cx), Math.round(oy + l.y - FH + 1)); } })),
      ...peds.map((p) => ({ y: p.y, draw: () => { const frames = p.dir > 0 ? p.sp.right : p.sp.left; const fr = p.pause > 0 ? (p.dir > 0 ? p.sp.idleR : p.sp.idleL) : frames[Math.floor(p.t) % 4]; ctx.drawImage(fr, Math.round(p.x - FW / 2 - cx), Math.round(oy + p.y - FH + 1)); } })),
      ...flocks.flatMap((fl) => fl.birds.map((b) => ({ y: 213, draw: () => { const lift = fl.flying > 0 ? Math.round((3 - fl.flying) * 18) : 0; ctx.drawImage(pigeons[lift ? 0 : b.peck], Math.round(fl.x + b.o + lift * 0.6 - cx), Math.round(oy + 207 - lift)); } }))),
    ].sort((a, b) => a.y - b.y);
    for (const a of actors) a.draw();
    ctx.drawImage(fg, cx, 0, viewW, MAIN_H, 0, oy, viewW, MAIN_H);
    // traffic
    for (const c of cars) {
      const sx = Math.round(c.x - cx);
      ctx.drawImage(c.frames[Math.floor(t * 8) % 2], sx, Math.round(oy + LANE - 26));
      ctx.drawImage(c.dir > 0 ? coneR : coneL, c.dir > 0 ? sx + c.w - 2 : sx - 38, Math.round(oy + LANE - 20));
    }
    for (const s of fx.steam) particles(s, lastDt, '#d8d4e4', 6);
    for (const s of fx.smoke) particles(s, lastDt, '#5a5660', 4);
    // store tags float over the roofs
    for (const seg of segs) if (seg.kind === 'store') {
      const tg = tags[seg.id][hover === seg.id ? 'h' : 'n'];
      const tx = Math.round(seg.x + seg.w / 2 - tg.width / 2 - cx);
      if (tx > -tg.width && tx < viewW) ctx.drawImage(tg, tx, Math.round(oy + Math.max(-mainY + 4 - bob, tops[seg.id] - 16)));
    }
  }

  resize();
  addEventListener('resize', resize);
  return {
    update,
    width: W,
    segs,
    get camX() { return camX; },
    get viewW() { return viewW; },
    get scale() { return scale; },
    setActive(v) { active = v; if (!v) { hover = null; onHover?.(null, 0, 0); } },
    jumpToStore(id) { const s = segs.find((x) => x.id === id); camX = clampCam(centerOn(s.x + s.w / 2)); },
    walkToStore(id, panelPx = 0) { const s = segs.find((x) => x.id === id); return walkTo(centerOn(s.x + s.w / 2, panelPx)); },
    walkToBooster() { const s = segs.find((x) => x.kind === 'alley'); return walkTo(centerOn(s.x + s.w / 2)); },
    trunkScreen() { return { x: (alleyInfo.trunk.x - camX) * scale, y: (mainY + alleyInfo.trunk.y) * scale }; },
    setEntering(id) { entering = id; },
    doorScreen(id) { const d = doors[id]; return { x: (d.x + d.w / 2 - camX) * scale, y: (mainY + d.y + d.h / 2) * scale }; },
    render,
  };
}
