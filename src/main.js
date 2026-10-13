import './style.css';
import { STORES, BOOSTER_ITEMS, AUCTION_LOTS, STORE_BY_ID, COUNT_BY_STORE, itemsForScope, isOpen } from './data/inventory.js';
import { ensureFonts } from './toon/toon.js';
import { loadCast } from './cast/puppet.js';
import { createStreet } from './toon/street.js';
import { buildAerial, topCar, topPerson, AH } from './toon/aerial.js';
import { buildRoom, buildCounter, buildOwner, drawOwner, ownerBand, buildTrunkScene, buildTrunkActor, drawBoosterBust, portrait, roomR, RW, RH, TW, TH, OWNER_X, AW, AH2, buildAuctionHall, buildPodium, drawAuctionLive, drawAudience, auctioneerPortrait } from './toon/interior.js';
import { createMarket } from './ui/market.js';
import { createAuction } from './auction/engine.js';
import { createAuctionPanel } from './ui/auction.js';

const $ = (s) => document.querySelector(s);
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const money = (n) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const isWide = () => innerWidth > 820;
const panelPx = () => (isWide() ? Math.min(560, innerWidth * 0.46) + 12 : 0);

const itemsByStore = Object.fromEntries(STORES.map((s) => [s.id, itemsForScope({ level: 'store', value: s.id })]));
const openById = Object.fromEntries(STORES.map((s) => [s.id, isOpen(s)]));

// canvas lettering needs the cartoon fonts in before anything is drawn
await Promise.all([loadCast(), ensureFonts(["'Alfa Slab One'", "'Bowlby One'", "700 'Fredoka'", "'Pacifico'", "'Bungee'", "'Rubik Bubbles'", ["900 'Noto Sans JP'", '古着祭ニセモノ禁止']])]);
document.body.classList.add('toon');

// show-style title card that slams in while the camera dives through a door
const card = $('#card');
function titleCard(title, sub, theme) {
  card.querySelector('h2').textContent = title;
  card.querySelector('p').textContent = sub;
  card.dataset.theme = theme;
  card.classList.remove('show');
  void card.offsetWidth;
  card.classList.add('show');
}

let mode = 'aerial'; // aerial | street | interior
let currentStore = null;

// ---------- The Hammerdome's live auction runs the whole time you're on the block ----------
const auction = createAuction({ isWon: (id) => market.isWon(id) });
const auctionPanel = createAuctionPanel(auction, { onBid: () => room?.kind === 'auction' && (room.gavel = 0.35) });

// ---------- Street ----------
const streetWrap = $('#street-wrap');
const tip = $('#tip');
const street = createStreet({
  cv: $('#street'),
  stores: STORES,
  itemsByStore,
  openById,
  countById: COUNT_BY_STORE,
  onStore: (id) => goStore(id),
  boosterItems: BOOSTER_ITEMS,
  auction,
  onBooster: () => goBooster(),
  onAuction: () => goAuction(),
  onHover: (h, x, y) => {
    let html = '';
    if (h?.store) {
      const st = STORE_BY_ID[h.store];
      html = openById[h.store]
        ? `<b>${esc(st.name)}</b>${esc(st.owner)} · ${esc(st.from)}<em>${COUNT_BY_STORE[h.store]} pieces · tap to walk in</em>`
        : `<b>${esc(st.name)}</b>Under construction<em>No ${esc(st.region)} stock yet</em>`;
    } else if (h?.booster) html = `<b>Booster Corner</b>“Ain’t nobody got these. Half price.”<em>${BOOSTER_ITEMS.length} pieces, 50% off or more · tap the trunk</em>`;
    else if (h?.auction) {
      const a = auction.state;
      html = `<b>Hammerdome Auction Hall</b>Hoss Hammerdome · live bidding<em>${a.lot ? `Lot ${a.lot.lot}: ${esc(a.lot.name)} · $${Math.round(a.bid || a.lot.start).toLocaleString('en-US')}` : `${AUCTION_LOTS.length} one-off lots`} · tap to walk in</em>`;
    }
    tip.innerHTML = html;
    tip.hidden = !html || matchMedia('(pointer: coarse)').matches;
    tip.style.transform = `translate(${Math.min(x + 16, innerWidth - 270)}px, ${y + 16}px)`;
  },
});

// ---------- Marketplace ----------
const market = createMarket({
  onGoStore: (id, country) => goStore(id, country),
  onGoBooster: () => goBooster(),
  onGoAuction: () => goAuction(),
  onActivity: (kind, item) => room?.react?.(kind, item),
  renderAuction: (els) => auctionPanel.render(els),
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
  .filter((s) => s.kind !== 'cross')
  .map((s) => {
    if (s.kind === 'alley') return `<button data-booster="1" class="booster">Booster Corner <small>−50%</small></button>`;
    if (s.kind === 'auction') return `<button data-auction="1" class="auction">Auction House <small>LIVE</small></button>`;
    const st = STORE_BY_ID[s.id];
    return `<button data-store="${s.id}" class="${openById[s.id] ? '' : 'closed'}">${esc(st.region)} <small>${openById[s.id] ? COUNT_BY_STORE[s.id] : 'SOON'}</small></button>`;
  })
  .join('');
dir.querySelectorAll('button').forEach((b) => (b.onclick = () => (b.dataset.booster ? goBooster() : b.dataset.auction ? goAuction() : goStore(b.dataset.store))));
let hereId;
function updateDirectory() {
  const cx = street.camX + street.viewW / 2;
  const seg = street.segs.find((s) => s.kind !== 'cross' && cx >= s.x && cx < s.x + s.w);
  const id = seg ? seg.id : null;
  if (id === hereId) return;
  hereId = id;
  dir.querySelectorAll('button').forEach((b) => b.classList.toggle('here', (b.dataset.store || (b.dataset.booster && 'booster') || (b.dataset.auction && 'auction')) === id));
  dir.querySelector('.here')?.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' });
}

// ---------- Navigation ----------
let navToken = 0;
async function goStore(id, country) {
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
  titleCard(st.name, `${st.owner} · ${st.from}`, id);
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
  await wait(250);
  const t = street.trunkScreen();
  streetWrap.style.transformOrigin = `${t.x}px ${t.y}px`;
  streetWrap.classList.add('ready', 'zoom');
  titleCard('Booster Corner', 'Back of the van · ain’t nobody got these', 'booster');
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

// Hammerdome Auction Hall: walk up the red carpet, through the gold doors, straight into the live room
async function goAuction() {
  finishIntro(true);
  if (mode === 'interior') {
    if (currentStore === 'auction') return openMarket({ level: 'auction' });
    await exitInterior();
  }
  const token = ++navToken;
  market.close();
  const arrived = await street.walkToAuction();
  if (!arrived || token !== navToken) return;
  street.setEntering('auction');
  tip.hidden = true;
  await wait(320);
  const d = street.doorScreen('auction');
  streetWrap.style.transformOrigin = `${d.x}px ${d.y}px`;
  streetWrap.classList.add('ready', 'zoom');
  titleCard('Hammerdome Auction Hall', 'Hoss Hammerdome · live bidding · one-offs only', 'auction');
  openScene(auctionScene());
  await wait(650);
  street.setEntering(null);
  if (token !== navToken) return;
  mode = 'interior';
  currentStore = 'auction';
  street.setActive(false);
  $('#interior').classList.add('show');
  document.body.dataset.mode = 'interior';
  openMarket({ level: 'auction' });
}

// ---------- Interior scenes (store rooms, the booster's trunk, the auction hall) ----------
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
  const band = ownerBand(st.id);
  return {
    kind: 'store', bg: c.bg, actor: c.actor, w: RW, h: RH, focusX: OWNER_X, focusY: (band.top + band.bottom) / 2, bustH: band.bottom - band.top, bustFX: 0.24, band,
    who: st.owner, where: `${st.name} · ${st.from}`, line: st.greeting,
    draw(fr) {
      drawOwner(rctx, fr, c.actor);
      rctx.drawImage(c.counter, 0, 0, RW, RH);
    },
  };
}
const HOSS_INTRO = 'I’m Hoss Hammerdome, owner of the Hammerdome Auction Hall! Biggest hat, biggest lots. Paddles up!';
function auctionScene() {
  const c = (sceneCache.auction ??= { bg: buildAuctionHall(RR), podium: buildPodium(RR) });
  return {
    kind: 'auction', bg: c.bg, w: AW, h: AH2, focusX: 136, focusY: 74, bustH: 120, bustFX: 0.5, phoneFocusX: 140, phoneFocusY: 64,
    band: { top: 0, bottom: 150 },
    who: 'Hoss Hammerdome', where: 'Owner of the Hammerdome Auction Hall', line: auction.state.lot ? `Lot ${auction.state.lot.lot} is on the block! Paddles up, partners!` : HOSS_INTRO,
    portrait: () => auctioneerPortrait(160),
    gavel: 0,
    drawLive(ctx, t, dt) {
      const s = auction.state;
      this.gavel = Math.max(0, this.gavel - dt);
      drawAuctionLive(ctx, s, t, this.gavel);
      ctx.drawImage(c.podium, 0, 0, AW, AH2);
      drawAudience(ctx, s, t, s.clock);
    },
  };
}
function setLine(line) {
  const p = $('#bubble p');
  if (p) p.textContent = `“${line}”`;
}
auction.on((ev) => {
  if (room?.kind === 'auction') {
    setLine(ev.line);
    if (ev.type === 'sold' || (ev.type === 'bid' && !ev.who.you)) room.gavel = ev.type === 'sold' ? 0.6 : 0.25;
  }
  if (ev.type === 'sold' && ev.you) {
    market.addWon(ev.lot, ev.amount);
    market.showToast(`SOLD to you! ${ev.lot.name} for $${ev.amount.toLocaleString('en-US')} is in your bag.`);
  } else if (ev.type === 'bid' && !ev.who.you && auction.state.history[1]?.who.you && currentStore === 'auction') {
    market.showToast(`Outbid! ${ev.who.paddle} went $${ev.amount.toLocaleString('en-US')}.`);
  }
  if (ev.type === 'lot' && market.isOpen() && market.scope.level === 'auction') market.refresh();
});
function trunkScene() {
  const c = (sceneCache.booster ??= { bg: buildTrunkScene(BOOSTER_ITEMS, RR), actor: buildTrunkActor(RR) });
  return {
    bg: c.bg, actor: c.actor, w: TW, h: TH, focusX: 96, focusY: 100, bustH: 96, bustFX: 0.5, phoneFocusX: 72, phoneFocusY: 110,
    who: 'The Booster', where: 'Booster Corner · back of the van', line: 'Ain’t nobody got these.',
    draw(fr) { drawBoosterBust(rctx, fr); },
  };
}
// ---------- Owner autonomy: little routines behind the counter, and reactions to what you do ----------
const pickW = (w) => { let n = Math.random() * Object.values(w).reduce((a, b) => a + b, 0); for (const [k, v] of Object.entries(w)) if ((n -= v) <= 0) return k; return Object.keys(w)[0]; };
const ACTS = {
  greet: { dur: 2.2, pose: (o, b) => (b % 2 ? o.wave : o.talk) },
  pitch: { dur: 2.6, pose: (o, b) => [o.talk, o.point, o.talk2, o.talk, o.thumb, o.talk][b % 6] },
  idle: { dur: 3.4, pose: (o, b, t) => (t % 3.1 < 0.15 ? o.blink : b % 2 ? o.bob : o.idle) },
  glance: { dur: 1.5, pose: (o, b) => (b % 4 === 3 ? o.idle : o.look) },
  lean: { dur: 2, pose: (o, b) => (b % 3 ? o.point : o.idle) },
  hum: { dur: 2.6, pose: (o, b) => [o.bob, o.idle, o.bob, o.blink][b % 4] },
  laugh: { dur: 1.3, pose: (o, b) => (b % 2 ? o.laugh : o.talk2) },
  hop: { dur: 0.45, pose: (o) => o.hop },
  eye: { dur: 1.4, pose: (o, b) => (b % 2 ? o.point : o.talk) },
  cheer: { dur: 1.8, pose: (o, b) => [o.hop, o.laugh, o.hop, o.thumb][b % 4] },
};
const IDLE_W = { idle: 4, glance: 2, lean: 2, hum: 2, laugh: 1, hop: 0.6, pitch: 1 };
const LOOK_LINES = [(i) => `That ${i.brand}? Certified heat.`, (i) => `Good eye. ${i.name}, only one in here.`, (i) => `${i.brand}… you got taste.`, (i) => `Try that ${i.name} on, I'll wait.`];
const ADD_LINES = [(i) => `Bagged! That ${i.brand} is yours.`, () => 'Pleasure doing business.', (i) => `You won't find that ${i.name} anywhere else.`];
function brainFor(scene) {
  const b = { act: 'greet', until: ACTS.greet.dur, queue: ['pitch'], cool: 0 };
  scene.react = (kind, item) => {
    if (!item || !room?.actor) return;
    if (kind === 'look') {
      if (room.t < b.cool) return;
      b.cool = room.t + 3.5;
      setAct('eye');
      if (Math.random() < 0.6) setLine(LOOK_LINES[Math.floor(Math.random() * LOOK_LINES.length)](item));
    } else if (kind === 'add') {
      b.cool = room.t + 2.5;
      setAct('cheer');
      setLine(ADD_LINES[Math.floor(Math.random() * ADD_LINES.length)](item));
    }
  };
  function setAct(a) { b.act = a; b.until = room.t + ACTS[a].dur * (0.8 + Math.random() * 0.4); }
  b.next = () => setAct(b.queue.shift() || pickW(IDLE_W));
  return b;
}

function openScene(scene) {
  room = { ...scene, t: 0 };
  if (room.actor) room.brain = brainFor(room);
  roomCv.width = Math.round(scene.w * RR);
  roomCv.height = Math.round(scene.h * RR);
  const pc = scene.portrait ? scene.portrait() : portrait(scene.actor);
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
  if (room.drawLive) return room.drawLive(rctx, t, dt);
  // held frames, 12 a second: the owner snaps between poses like a cartoon, running his own routine
  const o = room.actor, b = room.brain;
  if (t >= b.until) b.next();
  const tk = Math.floor(t * 12), beat = Math.floor(tk / 4);
  room.draw(ACTS[b.act].pose(o, beat, t));
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
  const band = room.band;
  const s = phoneBust ? Math.max(innerWidth / w, ah / bustH) : Math.max(innerWidth / w, (wide || !open ? innerHeight : ah) / h);
  const cw = w * s, ch = h * s;
  const left = Math.min(0, Math.max(innerWidth - cw, (phoneBust ? aw * bustFX : aw / 2) - focusX * s));
  let top = ay + ah / 2 - focusY * s;
  top = wide || !open ? Math.min(0, Math.max(innerHeight - ch, top)) : Math.min(ay, top);
  // never let the header bar or the back button sit on top of the subject's head
  if (band && !phoneBust) {
    const minTop = wide ? 72 : 150;
    if (band.top * s + top < minTop) top = minTop - band.top * s;
  }
  Object.assign(roomCv.style, { width: `${cw}px`, height: `${ch}px`, left: `${left}px`, top: `${top}px` });
}
addEventListener('resize', frameRoom);
$('#back').onclick = () => exitInterior();
$('#browse').onclick = () => currentStore && openMarket({ level: 'store', value: currentStore });
$('#shop-all').onclick = () => {
  finishIntro(true);
  openMarket({ level: 'all' });
};

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
  auction.tick(dt);
  if (market.isOpen() && market.scope.level === 'auction' && auctionPanel.update()) market.refresh();
  if (mode === 'interior') renderRoom(dt);
  else {
    street.update(dt);
    updateDirectory();
  }
  requestAnimationFrame(frame);
}
document.body.dataset.mode = 'aerial';
requestAnimationFrame(frame);
