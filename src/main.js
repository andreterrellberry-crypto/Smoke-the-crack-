import './style.css';
import { STORES, ITEMS, STORE_BY_ID, LOC_BY_ID, COUNT_BY_STORE, itemsForScope, storeOfItem, isOpen } from './data/inventory.js';
import { createStreet } from './pix/street.js';
import { buildAerial, topCar, topPerson, AH } from './pix/aerial.js';
import { buildRoom, buildOwner, drawCounter, RW, RH, OWNER_X, OWNER_FEET, FW, FH } from './pix/interior.js';
import { canvas } from './pix/draw.js';
import { createMarket } from './ui/market.js';
import { itemImg } from './pix/items.js';

const $ = (s) => document.querySelector(s);
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const money = (n) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const isWide = () => innerWidth > 820;
const panelPx = () => (isWide() ? Math.min(560, innerWidth * 0.46) + 12 : 0);

const itemsByStore = Object.fromEntries(STORES.map((s) => [s.id, itemsForScope({ level: 'store', value: s.id })]));
const openById = Object.fromEntries(STORES.map((s) => [s.id, isOpen(s)]));

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
  onNucci: () => goNucci(),
  onPedestrian: showPed,
  onHover: (h, x, y) => {
    let html = '';
    if (h?.ped) html = `<b>Wearing</b>${esc(h.ped.item.brand)} — ${esc(h.ped.item.name)}<em>${money(h.ped.item.price)} · tap to cop</em>`;
    else if (h?.store) {
      const st = STORE_BY_ID[h.store];
      html = openById[h.store]
        ? `<b>${esc(st.name)}</b>${esc(st.owner)} · ${esc(st.from)}<em>${COUNT_BY_STORE[h.store]} pieces · tap to walk in</em>`
        : `<b>${esc(st.name)}</b>Under construction<em>No ${esc(st.region)} stock yet</em>`;
    } else if (h?.nucci) html = `<b>Nucci’s Corner</b>“Aye bro, I got that new shi…”<em>VIP only · tap to see the coat</em>`;
    tip.innerHTML = html;
    tip.hidden = !html || matchMedia('(pointer: coarse)').matches;
    tip.style.transform = `translate(${Math.min(x + 16, innerWidth - 270)}px, ${y + 16}px)`;
  },
});

// ---------- Marketplace ----------
const market = createMarket({
  onGoStore: (id, country) => goStore(id, country),
  onGoNucci: () => goNucci(),
  onClose: (scope) => {
    if (scope.level === 'nucci') street.setNucciOpen(false);
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
    if (s.kind === 'alley') return `<button data-nucci="1" class="vip">Nucci’s Corner <small>VIP</small></button>`;
    const st = STORE_BY_ID[s.id];
    return `<button data-store="${s.id}" class="${openById[s.id] ? '' : 'closed'}">${esc(st.region)} <small>${openById[s.id] ? COUNT_BY_STORE[s.id] : 'SOON'}</small></button>`;
  })
  .join('');
dir.querySelectorAll('button').forEach((b) => (b.onclick = () => (b.dataset.nucci ? goNucci() : goStore(b.dataset.store))));
let hereId;
function updateDirectory() {
  const cx = street.camX + street.viewW / 2;
  const seg = street.segs.find((s) => s.kind !== 'corner' && cx >= s.x && cx < s.x + s.w);
  const id = seg ? seg.id : null;
  if (id === hereId) return;
  hereId = id;
  dir.querySelectorAll('button').forEach((b) => b.classList.toggle('here', (b.dataset.store || (b.dataset.nucci && 'nucci')) === id));
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
  street.setNucciOpen(false);
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
  openRoom(st);
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

async function goNucci() {
  hidePed();
  finishIntro(true);
  if (mode === 'interior') await exitInterior();
  const token = ++navToken;
  market.close();
  const arrived = await street.walkToNucci(panelPx());
  if (!arrived || token !== navToken) return;
  street.setNucciOpen(true);
  await wait(600);
  if (token === navToken) openMarket({ level: 'nucci' });
}

// ---------- Interior ----------
const roomCv = $('#room');
const rctx = roomCv.getContext('2d');
roomCv.width = RW;
roomCv.height = RH;
let room = null;
function openRoom(st) {
  const { room: bg, counterColor } = buildRoom(st, itemsByStore[st.id]);
  const owner = buildOwner(st.id);
  room = { st, bg, owner, counterColor, t: 0 };
  const [pc, pctx] = canvas(20, 22);
  pctx.drawImage(owner.idle, 6, 0, 20, 22, 0, 0, 20, 22);
  pc.className = 'pix';
  $('#bubble').innerHTML = `<div class="portrait"></div><div><b>${esc(st.owner)}</b><span>${esc(st.name)} · ${esc(st.from)}</span><p>“${esc(st.greeting)}”</p></div>`;
  $('#bubble .portrait').appendChild(pc);
  renderRoom(0);
  frameRoom();
}
function renderRoom(dt) {
  if (!room) return;
  room.t += dt;
  const t = room.t;
  rctx.imageSmoothingEnabled = false;
  rctx.drawImage(room.bg, 0, 0);
  const o = room.owner;
  const fr = t < 1.8 ? (Math.floor(t * 4) % 2 ? o.wave : o.talk) : t < 3.6 ? (Math.floor(t * 7) % 2 ? o.talk : o.idle) : t % 4.2 < 0.14 ? o.blink : o.idle;
  rctx.drawImage(fr, OWNER_X - FW / 2, OWNER_FEET - FH + 1);
  drawCounter(rctx, room.counterColor, room.st.name);
}
// Scale the room to cover the screen and keep the owner centred in whatever space the panel leaves
function frameRoom() {
  if (!room) return;
  const open = document.body.classList.contains('panel-open');
  const wide = isWide();
  const aw = wide ? innerWidth - (open ? panelPx() : 0) : innerWidth;
  const ay = !wide && open ? 104 : 0;
  const ah = !wide && open ? innerHeight * 0.42 - 104 : innerHeight;
  const phoneBust = !wide && open; // phone + bottom sheet: close-up on the owner, left of the dialogue box
  const s = phoneBust ? Math.max(innerWidth / RW, ah / 56) : Math.max(innerWidth / RW, (wide || !open ? innerHeight : ah) / RH);
  const cw = RW * s, ch = RH * s;
  const left = Math.min(0, Math.max(innerWidth - cw, (phoneBust ? aw * 0.24 : aw / 2) - OWNER_X * s));
  let top = ay + ah / 2 - 76 * s;
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
const aer = buildAerial(street.segs, street.width, STORE_BY_ID, openById);
const firstStore = street.segs.find((s) => s.kind === 'store');
let as = 2, avw = 0, avh = 0;
function frameAerial() {
  as = Math.max(1, Math.floor(Math.min(innerHeight / 260, innerWidth / 150)));
  avw = Math.ceil(innerWidth / as);
  avh = Math.ceil(innerHeight / as);
  acv.width = avw;
  acv.height = avh;
  acv.style.width = `${avw * as}px`;
  acv.style.height = `${avh * as}px`;
  actx.imageSmoothingEnabled = false;
}
frameAerial();
addEventListener('resize', frameAerial);
const sweepFrom = Math.max(0, aer.c.width - avw);
const sweepTo = aer.ox + firstStore.x + firstStore.w / 2 - avw / 2;
let ax = sweepFrom;
const ay = () => Math.max(0, Math.min(AH - avh, aer.streetY - avh * 0.55));
const movers = [
  ...['#b02a2a', '#d9b23a', '#2a4a8a', '#d8d4de', '#2e7a4a'].map((c, i) => ({ sp: topCar(c), x: (i * 431) % aer.c.width, y: aer.streetY + (i % 2 ? 20 : 34), v: (i % 2 ? -1 : 1) * (40 + i * 7) })),
  ...Array.from({ length: 16 }, (_, i) => ({ sp: topPerson(['#c8102e', '#f4f4f4', '#2a5ea8', '#f4c430', '#1a1a1a'][i % 5]), x: (i * 197) % aer.c.width, y: aer.streetY + (i % 2 ? -6 : 72) + (i % 3) * 3, v: (i % 2 ? 1 : -1) * (8 + (i % 4) * 3) })),
];
let introT = 0, introDone = false, dropping = false, introScheduled = false;
function renderAerial(dt) {
  for (const m of movers) {
    m.x += m.v * dt;
    if (m.x > aer.c.width) m.x = -20;
    if (m.x < -20) m.x = aer.c.width;
  }
  const x = Math.round(ax), y = Math.round(ay());
  actx.fillStyle = '#2a2630';
  actx.fillRect(0, 0, avw, avh);
  actx.drawImage(aer.c, x, y, avw, avh, 0, 0, avw, avh);
  for (const m of movers) actx.drawImage(m.sp, Math.round(m.x - x), Math.round(m.y - y));
}
function finishIntro(skip) {
  if (introDone || dropping) return;
  dropping = true;
  if (skip) ax = sweepTo;
  renderAerial(0);
  street.jumpToStore(firstStore.id);
  const sx = (aer.ox + firstStore.x + firstStore.w / 2 - Math.round(ax)) * as;
  const sy = (aer.streetY - Math.round(ay())) * as;
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
