import './style.css';
import { DEFS } from './city/style.js';
import { STORES, ITEMS, STORE_BY_ID, LOC_BY_ID, COUNT_BY_STORE, itemsForScope, storeOfItem, isOpen } from './data/inventory.js';
import { createStreet } from './city/street.js';
import { aerialSVG, AERIAL_H } from './city/aerial.js';
import { interiorSVG, OWNER_X } from './city/interior.js';
import { createMarket } from './ui/market.js';
import { productArt } from './ui/art.js';

const $ = (s) => document.querySelector(s);
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const money = (n) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const isWide = () => innerWidth > 820;
const panelPx = () => (isWide() ? Math.min(560, innerWidth * 0.46) + 12 : 0);

// Shared patterns/gradients live in one hidden SVG and are referenced by every scene
$('#defs').innerHTML = DEFS;

const itemsByStore = Object.fromEntries(STORES.map((s) => [s.id, itemsForScope({ level: 'store', value: s.id })]));
const openById = Object.fromEntries(STORES.map((s) => [s.id, isOpen(s)]));

let mode = 'aerial'; // aerial | street | interior
let currentStore = null;

// ---------- Street ----------
const streetWrap = $('#street-wrap');
const street = createStreet({
  root: $('#street'),
  stores: STORES,
  itemsByStore,
  openById,
  pedItems: ITEMS.filter((i) => openById[storeOfItem(i).id]),
  onStore: (id) => goStore(id),
  onNucci: () => goNucci(),
  onPedestrian: showPed,
});

// ---------- Marketplace ----------
const market = createMarket({
  onGoStore: (id, country) => goStore(id, country),
  onGoNucci: () => goNucci(),
  onClose: (scope) => {
    if (scope.level === 'nucci') street.nucciEl?.classList.remove('open');
    document.body.classList.remove('panel-open');
    frameRoom();
  },
});
const openMarket = (scope) => {
  document.body.classList.add('panel-open');
  market.open(scope);
  frameRoom();
};

// ---------- Store directory (bottom bar) ----------
const dir = $('#directory');
dir.innerHTML = street.segs
  .filter((s) => s.kind !== 'corner')
  .map((s) => {
    if (s.kind === 'alley') return `<button data-nucci="1" class="vip">Nucci’s Corner <small>VIP</small></button>`;
    const st = STORE_BY_ID[s.id];
    return `<button data-store="${s.id}" class="${openById[s.id] ? '' : 'closed'}">${esc(st.region)} <small>${openById[s.id] ? COUNT_BY_STORE[s.id] : '🚧'}</small></button>`;
  })
  .join('');
dir.querySelectorAll('button').forEach((b) => (b.onclick = () => (b.dataset.nucci ? goNucci() : goStore(b.dataset.store))));
let hereId = null;
function updateDirectory() {
  const cx = street.camX + street.viewW / 2;
  const seg = street.segs.find((s) => s.kind !== 'corner' && cx >= s.x - 13 && cx <= s.x + s.w + 13);
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
    if (currentStore === id) {
      openMarket(country ? { level: 'country', value: country } : { level: 'store', value: id });
      return;
    }
    await exitInterior();
  }
  const token = ++navToken;
  market.close();
  street.nucciEl?.classList.remove('open');
  if (!openById[id]) {
    await street.walkToStore(id);
    if (token === navToken) market.showToast(`${st.name} is under construction. No ${st.region} stock yet, check back soon.`);
    return;
  }
  const arrived = await street.walkToStore(id);
  if (!arrived || token !== navToken) return;
  await enterStore(id, country);
}

async function enterStore(id, country) {
  const st = STORE_BY_ID[id];
  const el = $(`#street .store[data-store="${id}"]`);
  el.classList.add('entering');
  await wait(380);
  const d = street.doorScreen(id);
  streetWrap.style.transformOrigin = `${d.x}px ${d.y}px`;
  streetWrap.classList.add('ready');
  streetWrap.classList.add('zoom');
  buildInterior(st);
  await wait(650);
  mode = 'interior';
  currentStore = id;
  street.setActive(false);
  el.classList.remove('entering');
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
  document.body.dataset.mode = 'street';
  await wait(500);
}

async function goNucci() {
  hidePed();
  finishIntro(true);
  if (mode === 'interior') await exitInterior();
  const token = ++navToken;
  market.close();
  const arrived = await street.walkToNucci(panelPx());
  if (!arrived || token !== navToken) return;
  street.nucciEl.classList.add('open');
  await wait(550);
  if (token === navToken) openMarket({ level: 'nucci' });
}

// ---------- Interior ----------
function buildInterior(st) {
  $('#room').innerHTML = interiorSVG(st, itemsByStore[st.id]);
  $('#bubble').innerHTML = `<b>${esc(st.owner)}</b><span>${esc(st.name)} · ${esc(st.from)}</span><p>“${esc(st.greeting)}”</p>`;
  frameRoom();
}
function frameRoom() {
  const svg = $('#room');
  if (isWide()) {
    svg.setAttribute('viewBox', '0 0 1200 720');
    svg.setAttribute('preserveAspectRatio', 'xMinYMid slice');
  } else if (document.body.classList.contains('panel-open')) {
    svg.setAttribute('viewBox', `${OWNER_X - 120} 150 500 480`);
    svg.setAttribute('preserveAspectRatio', 'xMinYMin slice');
  } else {
    svg.setAttribute('viewBox', `${OWNER_X - 250} 150 500 480`);
    svg.setAttribute('preserveAspectRatio', 'xMidYMin slice');
  }
}
addEventListener('resize', frameRoom);
$('#back').onclick = () => exitInterior();
$('#browse').onclick = () => currentStore && openMarket({ level: 'store', value: currentStore });
$('#shop-all').onclick = () => {
  finishIntro(true);
  openMarket({ level: 'all' });
};

// ---------- Pedestrian "what are they wearing" card ----------
const pedCard = $('#ped-card');
function showPed(item, x, y) {
  const st = storeOfItem(item);
  const loc = LOC_BY_ID[item.locId];
  pedCard.innerHTML = `<button class="x" aria-label="Close">✕</button><div class="mini">${productArt(item)}</div>
    <div><small>Spotted on the block</small><b>${esc(item.brand)}</b><span>${esc(item.name)}</span><em>${money(item.price)} · ${esc(loc.city)}, ${esc(loc.country)}</em></div>
    <div class="pc-actions"><button class="add">${market.inBag(item.id) ? 'In Bag ✓' : 'Add to Bag'}</button><button class="visit">Visit ${esc(st.name)} ›</button></div>`;
  const w = Math.min(320, innerWidth - 24);
  pedCard.style.width = `${w}px`;
  pedCard.style.left = `${Math.max(12, Math.min(innerWidth - w - 12, x - w / 2))}px`;
  pedCard.style.top = `${Math.max(80, Math.min(innerHeight - 220, y - 200))}px`;
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

// ---------- Aerial intro: looking straight down, sweep the block, then drop to the sidewalk ----------
const aerial = $('#aerial');
const aerialSvg = $('#aerial-svg');
aerialSvg.innerHTML = aerialSVG(street.segs, street.width, STORE_BY_ID);
const firstStore = street.segs.find((s) => s.kind === 'store');
let aerialX = 0;
let aerialView = { w: 1600, h: 1000, y: 0 };
function frameAerial() {
  const aspect = innerWidth / innerHeight;
  const w = Math.max(900, Math.min(2200, AERIAL_H * aspect * 1.05));
  const h = w / aspect;
  aerialView = { w, h, y: 620 - h / 2 };
  aerialSvg.setAttribute('viewBox', `${aerialX} ${aerialView.y} ${w} ${h}`);
}
frameAerial();
addEventListener('resize', frameAerial);
const sweepFrom = Math.max(0, street.width - aerialView.w);
const sweepTo = firstStore.x + firstStore.w / 2 - aerialView.w / 2;
aerialX = sweepFrom;
let introT = 0;
let introDone = false;
let dropping = false;
let introScheduled = false;
function finishIntro(skip) {
  if (introDone || dropping) return;
  dropping = true;
  if (skip) aerialX = sweepTo;
  frameAerial();
  street.jumpToStore(firstStore.id);
  // focus point = the first storefront's sidewalk, in screen pixels
  const sx = ((firstStore.x + firstStore.w / 2 - aerialX) / aerialView.w) * innerWidth;
  const sy = ((600 - aerialView.y) / aerialView.h) * innerHeight;
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

// ---------- Keys ----------
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
  const raw = (now - last) / 1000;
  last = now;
  const dt = Math.min(raw, 0.05);
  if (!introDone && !dropping) {
    introT += dt;
    const k = Math.min(1, introT / 3.6);
    const e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
    aerialX = sweepFrom + (sweepTo - sweepFrom) * e;
    aerialSvg.setAttribute('viewBox', `${aerialX} ${aerialView.y} ${aerialView.w} ${aerialView.h}`);
    if (k >= 1 && !introScheduled) {
      introScheduled = true;
      setTimeout(() => finishIntro(false), 500);
    }
  }
  if (mode !== 'interior') {
    street.update(dt);
    updateDirectory();
  }
  requestAnimationFrame(frame);
}
document.body.dataset.mode = 'aerial';
requestAnimationFrame(frame);
