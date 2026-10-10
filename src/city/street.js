// The block: first-person walking camera, parallax, pedestrians in real stock, light traffic.
import { rng } from './style.js';
import { person, pedestrianSpec } from './characters.js';
import { storefront, alley, lampPost, hydrant, trashCan, cornerBuilding, car, skyline, STORE_W, ALLEY_W, GROUND, CURB } from './storefronts.js';

export const WORLD_BOTTOM = 800;
const GAP = 26;
const CORNER_W = 360;
const MIN_VIEW_W = 470; // never show less than one full storefront (phones)

const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

export function buildLayout(stores) {
  const segs = [{ kind: 'corner', x: 0, w: CORNER_W }];
  let x = CORNER_W + GAP;
  for (const s of stores) {
    segs.push({ kind: 'store', id: s.id, x, w: STORE_W });
    x += STORE_W + GAP;
    if (s.id === 'south-america') {
      segs.push({ kind: 'alley', id: 'nucci', x: x - GAP, w: ALLEY_W });
      x += ALLEY_W - GAP;
    }
  }
  segs.push({ kind: 'corner', x, w: CORNER_W, end: true });
  return { segs, width: x + CORNER_W };
}

export function createStreet({ root, stores, itemsByStore, openById, pedItems, onStore, onNucci, onPedestrian }) {
  const { segs, width: W } = buildLayout(stores);
  const r = rng(1234);
  const doors = {};

  // ----- markup -----
  // party wall behind the row so gaps between shops read as recessed brick with drainpipes
  let main = `<rect x="0" y="${GROUND - 330}" width="${W}" height="330" fill="url(#brickDark)" class="party-wall"/>`;
  for (const seg of segs) {
    if (seg.kind === 'corner') main += cornerBuilding(seg.x, seg.end);
    else if (seg.kind === 'alley') main += alley(seg.x);
    else {
      const st = stores.find((s) => s.id === seg.id);
      const f = storefront(st, itemsByStore[st.id], openById[st.id], seg.x);
      doors[st.id] = f.door;
      main += f.svg;
    }
  }
  for (let i = 1; i < segs.length; i++) {
    const gx = segs[i].x - GAP / 2;
    if (segs[i].kind !== 'alley' && segs[i - 1].kind !== 'alley') main += `<path d="M${gx} ${GROUND - 320} V${GROUND}" stroke="#2b1a14" stroke-width="8"/><path d="M${gx} ${GROUND - 320} V${GROUND}" stroke="#6f7680" stroke-width="5"/>`;
  }
  const sidewalk = `<rect x="-200" y="${GROUND}" width="${W + 400}" height="${CURB - GROUND}" fill="url(#sidewalk)"/>
    <rect x="-200" y="${CURB}" width="${W + 400}" height="10" fill="#8f7a6c"/>
    <rect x="-200" y="${CURB + 10}" width="${W + 400}" height="${WORLD_BOTTOM - CURB}" fill="#4a4048"/>
    ${Array.from({ length: Math.ceil((W + 400) / 260) }, (_, i) => `<rect x="${-200 + i * 260}" y="728" width="140" height="12" rx="3" fill="#f4c430"/>`).join('')}`;
  let props = '';
  // lamps stand in the gaps between buildings so they never cover a sign or a door
  segs.forEach((seg, i) => {
    if (i === 0 || seg.kind === 'alley' || segs[i - 1].kind === 'alley') return;
    props += lampPost(seg.x - GAP / 2);
    if (seg.kind === 'store') props += i % 2 ? hydrant(seg.x + 40) : trashCan(seg.x + 34);
  });

  root.innerHTML = `
    <rect id="sky" x="0" y="0" width="100" height="100" fill="url(#sky)"/>
    <g id="sun"><circle r="160" fill="url(#sunGlow)"/><circle r="62" fill="#ffe08a"/></g>
    <g id="clouds">${[0, 1, 2, 3, 4].map((i) => `<g class="cloud" transform="translate(${i * 520 + 100} ${90 + (i % 3) * 60})"><ellipse rx="70" ry="22" fill="#ffd9c2" opacity=".8"/><ellipse cx="-30" cy="-14" rx="36" ry="20" fill="#ffd9c2" opacity=".8"/><ellipse cx="26" cy="-18" rx="40" ry="24" fill="#ffd9c2" opacity=".8"/></g>`).join('')}</g>
    <g id="skyline-layer">${skyline(W * 0.4 + 2000)}</g>
    <g id="main">${main}${sidewalk}<g id="peds"></g>${props}<g id="cars"></g></g>`;

  const sky = root.querySelector('#sky');
  const sun = root.querySelector('#sun');
  const clouds = root.querySelector('#clouds');
  const skylineLayer = root.querySelector('#skyline-layer');
  const mainLayer = root.querySelector('#main');
  const pedLayer = root.querySelector('#peds');
  const carLayer = root.querySelector('#cars');
  const alleySeg = segs.find((s) => s.kind === 'alley');
  const alleyEl = root.querySelector('.alley');

  // ----- camera -----
  let viewW = 1280;
  let viewH = 800;
  let camX = 0;
  let walking = null;
  let bob = 0;
  let vel = 0;

  function resize() {
    const aspect = innerWidth / innerHeight;
    viewH = Math.max(WORLD_BOTTOM, MIN_VIEW_W / aspect);
    viewW = viewH * aspect;
    root.setAttribute('viewBox', `0 ${WORLD_BOTTOM - viewH} ${viewW} ${viewH}`);
    sky.setAttribute('y', WORLD_BOTTOM - viewH - 10);
    sky.setAttribute('width', viewW);
    sky.setAttribute('height', viewH);
    sun.setAttribute('transform', `translate(${viewW * 0.72} ${GROUND - 120})`);
    camX = clampCam(camX);
  }
  const clampCam = (x) => Math.max(0, Math.min(W - viewW, x));
  const pxToWorld = () => viewW / innerWidth;

  function walkTo(targetCam, speed = 900) {
    targetCam = clampCam(targetCam);
    const from = camX;
    const dist = Math.abs(targetCam - from);
    vel = 0;
    if (dist < 4) return Promise.resolve(true);
    if (walking) walking.res(false);
    return new Promise((res) => {
      walking = { from, to: targetCam, t: 0, dur: Math.min(3.2, Math.max(0.5, dist / speed)), res };
    });
  }
  const centerOn = (worldX, panelPx = 0) => worldX - (viewW - panelPx * pxToWorld()) / 2;

  // ----- pedestrians (low traffic, each wearing real stock) -----
  const peds = [];
  const lanes = [578, 592, 606, 620, 632];
  const tops = pedItems.filter((i) => ['hoodie', 'tee', 'jersey', 'shirt', 'jacket', 'coat'].includes(i.type));
  const pants = pedItems.filter((i) => i.type === 'pants');
  const shoes = pedItems.filter((i) => i.type === 'sneaker');
  const N = Math.min(8, tops.length);
  const sorted = Array.from({ length: N }, (_, i) => ({ i, lane: lanes[i % lanes.length] })).sort((a, b) => a.lane - b.lane);
  for (const { i, lane } of sorted) {
    const top = tops[Math.floor(r() * tops.length)];
    const spec = pedestrianSpec(top, r() > 0.6 ? pants[Math.floor(r() * pants.length)] : null, r() > 0.5 ? shoes[Math.floor(r() * shoes.length)] : null, r);
    const el = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    el.setAttribute('class', 'ped walk');
    el.dataset.ped = top.id;
    el.innerHTML = `<g class="ped-inner">${person(spec)}</g>`;
    pedLayer.appendChild(el);
    const dir = r() > 0.5 ? 1 : -1;
    peds.push({ el, item: top, x: r() * W, y: lane, dir, speed: 34 + r() * 30, scale: 0.6 + (lane - 578) * 0.0022, pause: 0 });
  }

  // ----- cars -----
  const cars = [];
  let nextCar = 2;
  const CAR_COLORS = ['#2e9b4a', '#d6332c', '#2a5ea8', '#f4c430', '#e9e9e9', '#7a3f9a'];
  function spawnCar() {
    const dir = r() > 0.5 ? 1 : -1;
    const el = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    el.setAttribute('class', 'car');
    el.innerHTML = car(CAR_COLORS[Math.floor(r() * CAR_COLORS.length)], r);
    carLayer.appendChild(el);
    cars.push({ el, dir, y: dir > 0 ? 792 : 712, x: dir > 0 ? camX - 300 : camX + viewW + 300, speed: 240 + r() * 120 });
  }

  // ----- input: drag / wheel / keys / taps -----
  let down = null;
  root.addEventListener('pointerdown', (e) => {
    down = { x: e.clientX, y: e.clientY, cam: camX, t: performance.now(), lastX: e.clientX, lastT: performance.now() };
    vel = 0;
  });
  addEventListener('pointermove', (e) => {
    if (!down || !active) return;
    const dx = e.clientX - down.x;
    if (Math.abs(dx) > 6 && !down.dragging) {
      down.dragging = true;
      root.classList.add('dragging');
      if (walking) {
        walking.res(false);
        walking = null;
      }
    }
    if (down.dragging) {
      camX = clampCam(down.cam - dx * pxToWorld());
      const now = performance.now();
      vel = (-(e.clientX - down.lastX) * pxToWorld()) / Math.max(1, now - down.lastT) * 1000;
      down.lastX = e.clientX;
      down.lastT = now;
    }
  });
  addEventListener('pointerup', (e) => {
    if (!down) return;
    const wasDrag = down.dragging;
    down = null;
    root.classList.remove('dragging');
    if (wasDrag || !active) return;
    const t = e.target.closest?.('[data-ped], .store, .alley');
    if (!t) return;
    if (t.dataset.ped) {
      const p = peds.find((p) => p.el === t);
      if (p) {
        p.pause = 4;
        onPedestrian(p.item, e.clientX, e.clientY);
      }
    } else if (t.classList.contains('alley')) onNucci();
    else onStore(t.dataset.store);
  });
  root.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    const t = e.target.closest?.('.store, .alley');
    if (!t) return;
    e.preventDefault();
    t.classList.contains('alley') ? onNucci() : onStore(t.dataset.store);
  });
  root.addEventListener(
    'wheel',
    (e) => {
      if (!active) return;
      e.preventDefault();
      if (walking) {
        walking.res(false);
        walking = null;
      }
      camX = clampCam(camX + (Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY) * pxToWorld() * 1.2);
    },
    { passive: false }
  );
  const keys = new Set();
  addEventListener('keydown', (e) => {
    if (!active || e.target.closest?.('input')) return;
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft' || e.key === 'd' || e.key === 'a') keys.add(e.key);
  });
  addEventListener('keyup', (e) => keys.delete(e.key));

  // ----- frame -----
  let active = true;
  let elapsed = 0;
  function update(dt) {
    if (!active) return;
    elapsed += dt;
    let moving = false;
    if (walking) {
      walking.t += dt;
      const k = Math.min(1, walking.t / walking.dur);
      camX = walking.from + (walking.to - walking.from) * ease(k);
      moving = true;
      if (k >= 1) {
        const w = walking;
        walking = null;
        w.res(true);
      }
    } else if (keys.size) {
      const dir = keys.has('ArrowRight') || keys.has('d') ? 1 : -1;
      camX = clampCam(camX + dir * 520 * dt);
      moving = true;
    } else if (!down && Math.abs(vel) > 5) {
      camX = clampCam(camX + vel * dt);
      vel *= Math.pow(0.04, dt);
      moving = true;
    }
    // footstep bob = first-person walking feel
    bob = moving ? Math.sin(elapsed * 13) * 3 : bob * 0.85;
    mainLayer.setAttribute('transform', `translate(${-camX.toFixed(1)} ${bob.toFixed(2)})`);
    skylineLayer.setAttribute('transform', `translate(${(-camX * 0.4).toFixed(1)} ${(bob * 0.4).toFixed(2)})`);
    clouds.setAttribute('transform', `translate(${(-camX * 0.08 - elapsed * 6) % 2600} 0)`);

    for (const p of peds) {
      if (p.pause > 0) p.pause -= dt;
      else p.x += p.dir * p.speed * dt;
      if (p.x > W + 80) p.x = -80;
      if (p.x < -80) p.x = W + 80;
      p.el.classList.toggle('walk', p.pause <= 0);
      p.el.setAttribute('transform', `translate(${p.x.toFixed(1)} ${p.y}) scale(${(p.dir * p.scale).toFixed(3)} ${p.scale.toFixed(3)})`);
    }

    nextCar -= dt;
    if (nextCar <= 0 && cars.length < 2) {
      spawnCar();
      nextCar = 7 + r() * 9;
    }
    for (let i = cars.length - 1; i >= 0; i--) {
      const c = cars[i];
      c.x += c.dir * c.speed * dt;
      c.el.setAttribute('transform', `translate(${c.x.toFixed(1)} ${c.y}) scale(${c.dir} 1)`);
      if ((c.dir > 0 && c.x > camX + viewW + 400) || (c.dir < 0 && c.x < camX - 400)) {
        c.el.remove();
        cars.splice(i, 1);
      }
    }
    if (alleyEl) alleyEl.classList.toggle('near', Math.abs(alleySeg.x + ALLEY_W / 2 - (camX + viewW / 2)) < viewW * 0.3);
  }

  resize();
  addEventListener('resize', resize);

  return {
    update,
    width: W,
    segs,
    get camX() {
      return camX;
    },
    get viewW() {
      return viewW;
    },
    jumpToStore(id) {
      const seg = segs.find((s) => s.id === id);
      camX = clampCam(centerOn(seg.x + seg.w / 2));
    },
    setActive(v) {
      active = v;
      root.classList.toggle('paused', !v);
    },
    walkToStore(id, panelPx = 0) {
      const seg = segs.find((s) => s.id === id);
      return walkTo(centerOn(seg.x + seg.w / 2, panelPx));
    },
    walkToNucci(panelPx = 0) {
      return walkTo(centerOn(alleySeg.x + ALLEY_W / 2, panelPx));
    },
    // door position in screen pixels (for the zoom-in transition)
    doorScreen(id) {
      const d = doors[id];
      const s = innerWidth / viewW;
      return { x: (d.x - camX) * s, y: (GROUND + d.y - (WORLD_BOTTOM - viewH)) * s };
    },
    nucciEl: alleyEl,
  };
}
