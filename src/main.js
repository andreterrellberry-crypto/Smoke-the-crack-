import './style.css';
import { STORES, ITEMS, BOOSTER_ITEMS, STORE_BY_ID, LOC_BY_ID, COUNT_BY_STORE, itemsForScope, storeOfItem, isOpen } from './data/inventory.js';
import { ensureFonts } from './ink/ink.js';
import { createStreet } from './ink/street.js';
import { buildAerial, topCar, topPerson, AH } from './ink/aerial.js';
import { buildRoom, buildCounter, buildOwner, drawOwner, buildTrunkScene, buildTrunkActor, drawBoosterBust, portrait, roomR, RW, RH, TW, TH, OWNER_X } from './ink/interior.js';
import { createMarket } from './ui/market.js';
import { itemImg } from './ink/items.js';

const $ = (s) => document.querySelector(s);
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const money = (n) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const isWide = () => innerWidth > 820;
const panelPx = () => (isWide() ? Math.min(560, innerWidth * 0.46) + 12 : 0);

const itemsByStore = Object.fromEntries(STORES.map((s) => [s.id, itemsForScope({ level: 'store', value: s.id })]));
const openById = Object.fromEntries(STORES.map((s) => [s.id, isOpen(s)]));

// canvas lettering needs the comic fonts in before anything is inked
await ensureFonts(["'Bangers'", "'Luckiest Guy'", "'Permanent Marker'", "'Patrick Hand'", "'Bungee'", "'Pacifico'", "'Anton'", "'Titan One'", "'Shojumaru'", "'Lilita One'", ["'Noto Sans JP'", '古着祭ニセモノ禁止']]);
document.body.classList.add('inked');

let mode = 'aerial'; // aerial | street | interior
let currentStore = null;

// ---------- Street ----------
const streetWrap = $('#street-wrap');
const tip = $('#tip');
const street = createStreet({
  cv: $('#street'),
  stores: STORES,
  itemsByStore,
  openById,
  countById: COUNT_BY_STORE,
  pedItems: ITEMS.filter((i) => openById[storeOfItem(i).id]),
  onStore: (id) => goStore(id),
  boosterItems: BOOSTER_ITEMS,
  onBooster: () => goBooster(),
  onPedestrian: showPed,
  onHover: (h, x, y) => {
    let html = '';
    if (h?.ped) html = `<b>Wearing</b>${esc(h.ped.item.brand)} — ${esc(h.ped.item.name)}<em>${money(h.ped.item.price)} · tap to cop</em>`;
    else if (h?.store) {
      const st = STORE_BY_ID[h.store];
      html = openById[h.store]
        ? `<b>${esc(st.name)}</b>${esc(st.owner)} · ${esc(st.from)}<em>${COUNT_BY_STORE[h.store]} pieces · tap to walk in</em>`
        : `<b>${esc(st.name)}</b>Under construction<em>No ${esc(st.region)} stock yet</em>`;
    } else if (h?.booster) html = `<b>Booster Corner</b>“Ain’t nobody got these.”<em>${BOOSTER_ITEMS.length} rare pieces · tap the trunk</em>`;
    tip.innerHTML = html;
    tip.hidden = !html || matchMedia('(pointer: coarse)').matches;
    tip.style.transform = `translate(${Math.min(x + 16, innerWidth - 270)}px, ${y + 16}px)`;
  },
});

// ---------- Marketplace ----------
const market = createMarket({
  onGoStore: (id, country) => goStore(id, country),
  onGoBooster: () => goBooster(),
  onClose: () => {
    document.body.classList.remove('panel-open');
    frameRoom();
  },
});
function openMarket(scope) {
  tip.hidden = true;
  document.body.classList.add('panel-open');
  market.open(scope);
  frameRoom();
}

// ---------- Directory ----------
const dir = $('#directory');
dir.innerHTML = street.segs
  .filter((s) => s.kind !== 'corner')
  .map((s) => {
    if (s.kind === 'alley') return `<button data-booster="1" class="booster">Booster Corner <small>RARE</small></button>`;
    const st = STORE_BY_ID[s.id];
    return `<button data-store="${s.id}" class="${openById[s.id] ? '' : 'closed'}">${esc(st.region)} <small>${openById[s.id] ? COUNT_BY_STORE[s.id] : 'SOON'}</small></button>`;
  })
  .join('');
dir.querySelectorAll('button').forEach((b) => (b.onclick = () => (b.dataset.booster ? goBooster() : goStore(b.dataset.store))));
let hereId;
function updateDirectory() {
  const cx = street.camX + street.viewW / 2;
  const seg = street.segs.find((s) => s.kind !== 'corner' && cx >= s.x && cx < s.x + s.w);
  const id = seg ? seg.id : null;
  if (id === hereId) return;
  hereId = id;
  dir.querySelectorAll('button').forEach((b) => b.classList.toggle('here', (b.dataset.store || (b.dataset.booster && 'booster')) === id));
  dir.querySelector('.here')?.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' });
}

// ---------- Navigation ----------
let navToken = 0;
async function goStore(id, country) {
  hidePed();
  finishIntro(true);
  const st = STORE_BY_ID[id];
  if (mode === 'interior') {
    if (currentStore === id) return openMarket(country ? { level: 'country', value: country } : { level: 'store', value: id });
    await exitInterior();
  }
  const token = ++navToken;
  market.close();
  const arrived = await street.walkToStore(id);
  if (token !== navToken) return;
  if (!openById[id]) return market.showToast(`${st.name} is under construction. No ${st.region} stock yet, check back soon.`);
  if (!arrived) return;
  await enterStore(id, country);
}

async function enterStore(id, country) {
  const st = STORE_BY_ID[id];
  street.setEntering(id);
  tip.hidden = true;
  await wait(320);
  const d = street.doorScreen(id);
  streetWrap.style.transformOrigin = `${d.x}px ${d.y}px`;
  streetWrap.classList.add('ready', 'zoom');
  openScene(storeScene(st));
  await wait(650);
  street.setEntering(null);
  mode = 'interior';
  currentStore = id;
  street.setActive(false);
  $('#interior').classList.add('show');
  document.body.dataset.mode = 'interior';
  openMarket(country ? { level: 'country', value: country } : { level: 'store', value: id });
}

async function exitInterior() {
  if (mode !== 'interior') return;
  market.close();
  $('#interior').classList.remove('show');
  street.setActive(true);
  streetWrap.classList.remove('zoom');
  mode = 'street';
  currentStore = null;
  room = null;
  document.body.dataset.mode = 'street';
  await wait(450);
}

// Booster Corner: walk up to the van, then the camera zooms straight into the open trunk
async function goBooster() {
  hidePed();
  finishIntro(true);
  if (mode === 'interior') {
    if (currentStore === 'booster') return openMarket({ level: 'booster' });
    await exitInterior();
  }
  const token = ++navToken;
  market.close();
  const arrived = await street.walkToBooster();
  if (!arrived || token !== navToken) return;
  tip.hidden = true;
  street.popTrunk();
  await wait(380);
  const t = street.trunkScreen();
  streetWrap.style.transformOrigin = `${t.x}px ${t.y}px`;
  streetWrap.classList.add('ready', 'zoom');
  openScene(trunkScene());
  await wait(650);
  if (token !== navToken) return;
  mode = 'interior';
  currentStore = 'booster';
  street.setActive(false);
  $('#interior').classList.add('show');
  document.body.dataset.mode = 'interior';
  openMarket({ level: 'booster' });
}

// ---------- Interior scenes (store rooms + the booster's trunk) ----------
const roomCv = $('#room');
const rctx = roomCv.getContext('2d');
const RR = roomR();
const sceneCache = {};
let room = null;
function storeScene(st) {
  const c = (sceneCache[st.id] ??= (() => {
    const { room: bg, counterColor } = buildRoom(st, itemsByStore[st.id], RR);
    return { bg, counter: buildCounter(st, counterColor, RR), actor: buildOwner(st.id, RR) };
  })());
  return {
    bg: c.bg, actor: c.actor, w: RW, h: RH, focusX: OWNER_X, focusY: 86, bustH: 70, bustFX: 0.24,
    who: st.owner, where: `${st.name} · ${st.from}`, line: st.greeting,
    draw(fr) {
      drawOwner(rctx, fr);
      rctx.drawImage(c.counter, 0, 0, RW, RH);
    },
  };
}
function trunkScene() {
  const c = (sceneCache.booster ??= { bg: buildTrunkScene(BOOSTER_ITEMS, RR), actor: buildTrunkActor(RR) });
  return {
    bg: c.bg, actor: c.actor, w: TW, h: TH, focusX: 96, focusY: 100, bustH: 96, bustFX: 0.5, phoneFocusX: 72, phoneFocusY: 110,
    who: 'The Booster', where: 'Booster Corner · back of the van', line: 'Ain’t nobody got these.',
    draw(fr) { drawBoosterBust(rctx, fr); },
  };
}
function openScene(scene) {
  room = { ...scene, t: 0 };
  roomCv.width = Math.round(scene.w * RR);
  roomCv.height = Math.round(scene.h * RR);
  const pc = portrait(scene.actor[0].idle);
  $('#bubble').innerHTML = `<div class="portrait"></div><div><b>${esc(scene.who)}</b><span>${esc(scene.where)}</span><p>“${esc(scene.line)}”</p></div>`;
  $('#bubble .portrait').appendChild(pc);
  renderRoom(0);
  frameRoom();
}
function renderRoom(dt) {
  if (!room) return;
  room.t += dt;
  const t = room.t;
  rctx.setTransform(RR, 0, 0, RR, 0, 0);
  rctx.drawImage(room.bg, 0, 0, room.w, room.h);
  const o = room.actor[Math.floor(t * 6) % 2]; // two inkings swapped = line boil
  const fr = t < 1.8 ? (Math.floor(t * 4) % 2 ? o.wave : o.talk) : t < 3.6 ? (Math.floor(t * 7) % 2 ? o.talk : o.idle) : t % 4.2 < 0.18 ? o.blink : o.idle;
  room.draw(fr);
}
// Scale the scene to cover the screen and keep its subject centred in whatever space the panel leaves
function frameRoom() {
  if (!room) return;
  const { w, h, bustH, bustFX } = room;
  let { focusX, focusY } = room;
  const open = document.body.classList.contains('panel-open');
  const wide = isWide();
  const aw = wide ? innerWidth - (open ? panelPx() : 0) : innerWidth;
  const ay = !wide && open ? 104 : 0;
  const ah = !wide && open ? innerHeight * 0.42 - 104 : innerHeight;
  const phoneBust = !wide && open; // phone + bottom sheet: close-up on the subject, beside the dialogue box
  if (phoneBust && room.phoneFocusX) { focusX = room.phoneFocusX; focusY = room.phoneFocusY; }
  const s = phoneBust ? Math.max(innerWidth / w, ah / bustH) : Math.max(innerWidth / w, (wide || !open ? innerHeight : ah) / h);
  const cw = w * s, ch = h * s;
  const left = Math.min(0, Math.max(innerWidth - cw, (phoneBust ? aw * bustFX : aw / 2) - focusX * s));
  let top = ay + ah / 2 - focusY * s;
  top = wide || !open ? Math.min(0, Math.max(innerHeight - ch, top)) : Math.min(ay, top);
  Object.assign(roomCv.style, { width: `${cw}px`, height: `${ch}px`, left: `${left}px`, top: `${top}px` });
}
addEventListener('resize', frameRoom);
$('#back').onclick = () => exitInterior();
$('#browse').onclick = () => currentStore && openMarket({ level: 'store', value: currentStore });
$('#shop-all').onclick = () => {
  finishIntro(true);
  openMarket({ level: 'all' });
};

// ---------- Pedestrian card ----------
const pedCard = $('#ped-card');
function showPed(item, x, y) {
  const st = storeOfItem(item);
  const loc = LOC_BY_ID[item.locId];
  pedCard.innerHTML = `<button class="x" aria-label="Close">✕</button><div class="mini">${itemImg(item)}</div>
    <div><small>Spotted on the block</small><b>${esc(item.brand)}</b><span>${esc(item.name)}</span><em>${money(item.price)} · ${esc(loc.city)}, ${esc(loc.country)}</em></div>
    <div class="pc-actions"><button class="add">${market.inBag(item.id) ? 'In Bag ✓' : 'Add to Bag'}</button><button class="visit">Go to ${esc(st.name)} ›</button></div>`;
  const w = Math.min(320, innerWidth - 24);
  pedCard.style.width = `${w}px`;
  pedCard.style.left = `${Math.max(12, Math.min(innerWidth - w - 12, x - w / 2))}px`;
  pedCard.style.top = `${Math.max(90, Math.min(innerHeight - 230, y - 210))}px`;
  pedCard.hidden = false;
  pedCard.querySelector('.x').onclick = hidePed;
  pedCard.querySelector('.add').onclick = (e) => {
    market.toggleCart(item.id);
    e.currentTarget.textContent = market.inBag(item.id) ? 'In Bag ✓' : 'Add to Bag';
  };
  pedCard.querySelector('.visit').onclick = () => goStore(st.id, loc.country);
}
function hidePed() {
  pedCard.hidden = true;
}

// ---------- Aerial intro: straight down over the block, sweep it, then drop to the sidewalk ----------
const aerial = $('#aerial');
const acv = $('#aerial-cv');
const actx = acv.getContext('2d');
const aerScale = () => Math.min(innerHeight / 260, innerWidth / 150);
const AR = Math.max(2, Math.min(3, Math.ceil(aerScale() * (devicePixelRatio || 1))));
const aer = buildAerial(street.segs, street.width, STORE_BY_ID, openById, AR);
const aerW = aer.c.uw;
const firstStore = street.segs.find((s) => s.kind === 'store');
let as = 2, avw = 0, avh = 0;
function frameAerial() {
  const dpr = devicePixelRatio || 1;
  as = aerScale();
  avw = innerWidth / as;
  avh = innerHeight / as;
  acv.width = Math.round(innerWidth * dpr);
  acv.height = Math.round(innerHeight * dpr);
  acv.style.width = `${innerWidth}px`;
  acv.style.height = `${innerHeight}px`;
  actx.setTransform(as * dpr, 0, 0, as * dpr, 0, 0);
}
frameAerial();
addEventListener('resize', frameAerial);
const sweepFrom = Math.max(0, aerW - avw);
const sweepTo = aer.ox + firstStore.x + firstStore.w / 2 - avw / 2;
let ax = sweepFrom;
const ay = () => Math.max(0, Math.min(AH - avh, aer.streetY - avh * 0.55));
const movers = [
  ...['#e0443a', '#f6cc3c', '#2a5ea8', '#e6e2ea', '#2e8a52'].map((c, i) => ({ sp: topCar(c, AR), x: (i * 431) % aerW, y: aer.streetY + (i % 2 ? 18 : 34), v: (i % 2 ? -1 : 1) * (40 + i * 7) })),
  ...Array.from({ length: 16 }, (_, i) => ({ sp: topPerson(['#e0443a', '#f6f4ee', '#2a5ea8', '#f6cc3c', '#1d1a22'][i % 5], AR), x: (i * 197) % aerW, y: aer.streetY + (i % 2 ? -7 : 71) + (i % 3) * 3, v: (i % 2 ? 1 : -1) * (8 + (i % 4) * 3) })),
];
let introT = 0, introDone = false, dropping = false, introScheduled = false;
function renderAerial(dt) {
  for (const m of movers) {
    m.x += m.v * dt;
    if (m.x > aerW) m.x = -20;
    if (m.x < -20) m.x = aerW;
  }
  const x = ax, y = ay();
  actx.fillStyle = '#6d6a72';
  actx.fillRect(0, 0, avw, avh);
  actx.drawImage(aer.c, -x, -y, aer.c.uw, aer.c.uh);
  for (const m of movers) {
    if (m.v < 0) { actx.save(); actx.translate(m.x - x + m.sp.uw, m.y - y); actx.scale(-1, 1); actx.drawImage(m.sp, 0, 0, m.sp.uw, m.sp.uh); actx.restore(); }
    else actx.drawImage(m.sp, m.x - x, m.y - y, m.sp.uw, m.sp.uh);
  }
}
function finishIntro(skip) {
  if (introDone || dropping) return;
  dropping = true;
  if (skip) ax = sweepTo;
  renderAerial(0);
  street.jumpToStore(firstStore.id);
  const sx = (aer.ox + firstStore.x + firstStore.w / 2 - ax) * as;
  const sy = (aer.streetY - ay()) * as;
  aerial.style.transformOrigin = `${sx}px ${sy}px`;
  aerial.classList.add('drop');
  streetWrap.classList.add('arrive');
  document.body.dataset.mode = 'street';
  mode = 'street';
  setTimeout(() => {
    introDone = true;
    aerial.remove();
    streetWrap.classList.add('ready');
  }, 1700);
}
$('#drop').onclick = () => finishIntro(true);
aerial.addEventListener('pointerdown', () => finishIntro(true));

addEventListener('keydown', (e) => {
  if (e.key !== 'Escape') return;
  if ($('#bag').classList.contains('open')) $('#bag').classList.remove('open');
  else if (!pedCard.hidden) hidePed();
  else if (market.isOpen()) market.close();
  else if (mode === 'interior') exitInterior();
});

// ---------- Loop ----------
let last = performance.now();
function frame(now) {
  const dt = Math.max(0, Math.min((now - last) / 1000, 0.05));
  last = now;
  if (!introDone) {
    if (!dropping) {
      introT += dt;
      const k = Math.min(1, introT / 3.8);
      ax = sweepFrom + (sweepTo - sweepFrom) * (k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2);
      if (k >= 1 && !introScheduled) {
        introScheduled = true;
        setTimeout(() => finishIntro(false), 500);
      }
    }
    renderAerial(dt);
  }
  if (mode === 'interior') renderRoom(dt);
  else {
    street.update(dt);
    updateDirectory();
  }
  requestAnimationFrame(frame);
}
document.body.dataset.mode = 'aerial';
requestAnimationFrame(frame);
