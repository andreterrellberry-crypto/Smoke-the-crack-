import {
  ITEMS, ALL_ITEMS, BOOSTER_ITEMS, AUCTION_LOTS, STORES, STORE_BY_ID, STORE_BY_COUNTRY, LOC_BY_ID,
  itemsForScope, COUNT_BY_COUNTRY, COUNT_BY_STORE, storeOfItem, isOpen,
} from '../data/inventory.js';
import { itemImg } from '../toon/items.js';

const $ = (s) => document.querySelector(s);
const money = (n) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const store = {
  get(k, d) {
    try {
      return JSON.parse(localStorage.getItem(k)) ?? d;
    } catch {
      return d;
    }
  },
  set(k, v) {
    try {
      localStorage.setItem(k, JSON.stringify(v));
    } catch {}
  },
};

// auction lots won at the hammer sit in the bag at the price they went for
const wonPrices = () => store.get('stc-won', {});
const byId = (id) => {
  const it = ALL_ITEMS.find((i) => i.id === id);
  if (it?.auction) { const p = wonPrices()[id]; return p ? { ...it, price: p } : null; }
  return it;
};

export function createMarket({ onGoStore, onGoBooster, onGoAuction, onClose, onActivity, renderAuction }) {
  const panel = $('#market');
  const grid = $('#grid');
  const crumbs = $('#crumbs');
  const title = $('#market-title');
  const meta = $('#market-meta');
  const sortSel = $('#sort');
  const chipsHost = $('#country-chips');
  const bagBtn = $('#bag-btn');
  const bagCount = $('#bag-count');
  const bag = $('#bag');
  const bagList = $('#bag-list');
  const bagTotal = $('#bag-total');
  const toast = $('#toast');

  let scope = { level: 'all' };
  let homeStore = null; // the store the shopper is standing in
  let cart = store.get('stc-bag', []).filter((id) => byId(id));
  // a lot won at the hammer goes straight into the bag at its hammer price
  function addWon(lot, price) {
    store.set('stc-won', { ...wonPrices(), [lot.id]: price });
    if (!cart.includes(lot.id)) cart.push(lot.id);
    store.set('stc-bag', cart);
    renderBag();
    bagBtn.classList.remove('bump');
    void bagBtn.offsetWidth;
    bagBtn.classList.add('bump');
  }

  function showToast(msg) {
    toast.textContent = msg;
    toast.classList.add('show');
    clearTimeout(showToast.t);
    showToast.t = setTimeout(() => toast.classList.remove('show'), 2600);
  }

  const sortItems = (items) => {
    const s = sortSel.value;
    const out = items.slice();
    if (s === 'low') out.sort((a, b) => a.price - b.price);
    else if (s === 'high') out.sort((a, b) => b.price - a.price);
    else if (s === 'old') out.sort((a, b) => a.year - b.year);
    else if (s === 'new') out.sort((a, b) => b.year - a.year);
    return out;
  };

  function card(it, opts = {}) {
    const inBag = cart.includes(it.id);
    const loc = it.booster ? null : LOC_BY_ID[it.locId];
    const where = it.booster ? it.origin : `${loc.city}, ${loc.country}`;
    const st = it.booster ? null : storeOfItem(it);
    return `<article class="card">
      <div class="art">${itemImg(it)}<span class="cond">${esc(it.condition)}</span>${it.booster ? `<span class="badge off">−${it.off}%</span>` : ''}</div>
      <div class="body">
        <div class="row"><span class="brand">${esc(it.brand)}</span>${it.booster ? `<s class="was">${money(it.retail)}</s>` : ''}<span class="price">${money(it.price)}</span></div>
        <h3>${esc(it.name)}</h3>
        <p class="where">📍 ${esc(where)}</p>
        <p class="facts"><b>${it.year}</b> · ${esc(it.collection)} · by ${esc(it.designer)}</p>
        <p class="blurb">${esc(it.blurb)}</p>
        <div class="row foot"><span class="size">Size ${esc(it.size)}</span>${opts.showStore && st ? `<button class="goto" data-store="${st.id}">At ${esc(st.name)} ›</button>` : ''}</div>
        <button class="add${inBag ? ' in' : ''}" data-id="${it.id}">${inBag ? 'In Bag ✓' : it.booster ? 'Cop it' : 'Add to Bag'}</button>
      </div>
    </article>`;
  }

  function wireGrid() {
    grid.querySelectorAll('.add').forEach((b) => (b.onclick = () => toggleCart(b.dataset.id)));
    grid.querySelectorAll('.card').forEach((c) => c.addEventListener('pointerenter', () => onActivity?.('look', byId(c.querySelector('.add')?.dataset.id))));
    grid.querySelectorAll('.goto').forEach((b) => (b.onclick = () => onGoStore(b.dataset.store)));
  }

  function render() {
    panel.classList.toggle('booster', scope.level === 'booster');
    panel.classList.toggle('auction', scope.level === 'auction');
    chipsHost.innerHTML = '';
    if (scope.level === 'auction') {
      renderAuction({ crumbs, title, meta, grid });
      return;
    }

    if (scope.level === 'booster') {
      const prices = BOOSTER_ITEMS.map((i) => i.price);
      crumbs.innerHTML = `<span class="crumb on">Booster Corner</span><span class="sep">›</span><span class="crumb">Back of the van</span>`;
      title.textContent = 'Booster Corner';
      meta.textContent = `${BOOSTER_ITEMS.length} pieces · half off or less · ${money(Math.min(...prices))} to ${money(Math.max(...prices))} · not sold anywhere else`;
      grid.innerHTML = `<p class="section-h">“Ain’t nobody got these. Half price. Don’t ask.”</p>` + sortItems(BOOSTER_ITEMS).map((it) => card(it)).join('');
      wireGrid();
      grid.scrollTop = 0;
      return;
    }

    const st = scope.level === 'store' ? STORE_BY_ID[scope.value] : scope.level === 'country' ? STORE_BY_COUNTRY[scope.value] : null;
    if (st) {
      const parts = [`<button class="crumb${scope.level === 'store' ? ' on' : ''}" data-go="store">${esc(st.name)}</button>`];
      if (scope.level === 'country') parts.push(`<span class="sep">›</span><span class="crumb on">${esc(scope.value)}</span>`);
      crumbs.innerHTML = parts.join('');
      crumbs.querySelector('[data-go]').onclick = () => setScope({ level: 'store', value: st.id });
      chipsHost.innerHTML = st.countries
        .filter((c) => COUNT_BY_COUNTRY[c])
        .map((c) => `<button data-c="${esc(c)}" class="${scope.value === c ? 'on' : ''}">${esc(c)} <small>${COUNT_BY_COUNTRY[c]}</small></button>`)
        .join('');
      chipsHost.querySelectorAll('button').forEach((b) => (b.onclick = () => setScope(scope.value === b.dataset.c ? { level: 'store', value: st.id } : { level: 'country', value: b.dataset.c })));
      title.textContent = scope.level === 'country' ? scope.value : st.region;
    } else {
      crumbs.innerHTML = `<span class="crumb on">The Block</span>`;
      title.textContent = 'All Stock';
    }

    const items = sortItems(itemsForScope(scope));
    const countries = new Set(items.map((i) => LOC_BY_ID[i.locId].country)).size;
    meta.textContent =
      scope.level === 'all'
        ? `${items.length} pieces · ${STORES.filter(isOpen).length} open stores`
        : `${items.length} piece${items.length === 1 ? '' : 's'}${scope.level === 'store' ? ` · ${countries} countr${countries === 1 ? 'y' : 'ies'} · owner ${st.owner}` : ''}`;
    grid.innerHTML = items.map((it) => card(it, { showStore: scope.level === 'all' })).join('');
    wireGrid();
    grid.scrollTop = 0;
  }

  function setScope(s) {
    scope = s;
    render();
  }

  function open(s) {
    scope = s;
    if (s.level === 'store') homeStore = s.value;
    panel.classList.add('open');
    render();
  }

  function close() {
    if (!panel.classList.contains('open')) return;
    panel.classList.remove('open');
    onClose?.(scope);
  }

  function toggleCart(id) {
    const it = byId(id);
    if (cart.includes(id)) {
      cart = cart.filter((c) => c !== id);
      if (it.auction) { const w = wonPrices(); delete w[id]; store.set('stc-won', w); }
      showToast(`Removed ${it.name}`);
    } else {
      cart.push(id);
      showToast(it.booster ? `Out the trunk and in your bag: ${it.name}, ${money(it.price)}.` : `Added ${it.brand} — ${it.name}`);
      onActivity?.('add', it);
      bagBtn.classList.remove('bump');
      void bagBtn.offsetWidth;
      bagBtn.classList.add('bump');
    }
    store.set('stc-bag', cart);
    renderBag();
    if (panel.classList.contains('open')) {
      const top = grid.scrollTop;
      render();
      grid.scrollTop = top;
    }
  }

  function renderBag() {
    bagCount.textContent = cart.length;
    bagCount.hidden = cart.length === 0;
    const items = cart.map(byId);
    bagList.innerHTML = items.length
      ? items
          .map((it) => {
            const where = it.booster ? `Booster Corner · back of the van` : it.auction ? `Won at the Hammerdome · Lot ${it.lot}` : `${LOC_BY_ID[it.locId].city}, ${LOC_BY_ID[it.locId].country}`;
            return `<li><div class="mini">${itemImg(it)}</div><div><b>${esc(it.brand)}</b><br>${esc(it.name)}<br><small>${esc(where)} · ${it.year}</small></div><div class="r">${money(it.price)}<button data-id="${it.id}" aria-label="Remove">✕</button></div></li>`;
          })
          .join('')
      : '<li class="empty">Your bag is empty. Walk the block and step into a store.</li>';
    bagList.querySelectorAll('button').forEach((b) => (b.onclick = () => toggleCart(b.dataset.id)));
    bagTotal.textContent = money(items.reduce((s, i) => s + i.price, 0));
  }

  // Search: stores, regions, countries, brands, cities → walk to the right storefront
  const search = $('#search');
  const results = $('#results');
  function renderResults() {
    const q = search.value.trim().toLowerCase();
    const out = [];
    const seen = new Set();
    const add = (key, r) => {
      if (!seen.has(key)) seen.add(key), out.push(r);
    };
    for (const st of STORES)
      if (!q || `${st.name} ${st.region} ${st.owner}`.toLowerCase().includes(q))
        add(st.id, { store: st.id, label: st.name, sub: `${st.region} · ${isOpen(st) ? `${COUNT_BY_STORE[st.id]} pieces` : 'Under construction'}` });
    if (!q || 'booster corner van trunk deals half off discount cheap'.includes(q) || /booster|deal|cheap|off|sale/.test(q)) add('booster', { booster: true, label: 'Booster Corner', sub: `Back of the van · ${BOOSTER_ITEMS.length} pieces, half off or less` });
    if (!q || 'hammerdome auction hall live bid lots'.includes(q) || /auction|bid|lot|hammer/.test(q)) add('auction', { auction: true, label: 'Hammerdome Auction Hall', sub: `Live bidding · ${AUCTION_LOTS.length} lots you won't find anywhere else` });
    if (q) {
      for (const c of Object.keys(STORE_BY_COUNTRY))
        if (c.toLowerCase().includes(q)) add(`c-${c}`, { store: STORE_BY_COUNTRY[c].id, country: COUNT_BY_COUNTRY[c] ? c : null, label: c, sub: `${STORE_BY_COUNTRY[c].name} · ${COUNT_BY_COUNTRY[c] || 0} pieces` });
      for (const i of ITEMS)
        if (`${i.brand} ${i.name} ${i.designer} ${i.collection} ${LOC_BY_ID[i.locId].city}`.toLowerCase().includes(q)) {
          const c = LOC_BY_ID[i.locId].country;
          add(`c-${c}`, { store: STORE_BY_COUNTRY[c].id, country: c, label: `${i.brand} — ${i.name}`, sub: `${STORE_BY_COUNTRY[c].name} · ${c}` });
        }
    }
    results.innerHTML = out
      .slice(0, 9)
      .map((r, i) => `<li><button data-i="${i}"><span>${esc(r.label)}</span><small>${esc(r.sub)}</small></button></li>`)
      .join('');
    results.querySelectorAll('button').forEach(
      (b) =>
        (b.onclick = () => {
          const r = out[+b.dataset.i];
          results.classList.remove('show');
          search.blur();
          r.booster ? onGoBooster() : r.auction ? onGoAuction() : onGoStore(r.store, r.country);
        })
    );
  }
  search.addEventListener('input', renderResults);
  search.addEventListener('focus', () => {
    renderResults();
    results.classList.add('show');
  });
  search.addEventListener('blur', () => setTimeout(() => results.classList.remove('show'), 150));
  search.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') results.querySelector('button')?.click();
  });

  sortSel.onchange = render;
  $('#market-close').onclick = close;
  bagBtn.onclick = () => bag.classList.toggle('open');
  $('#bag-close').onclick = () => bag.classList.remove('open');
  $('#checkout').onclick = () =>
    showToast(cart.length ? 'Checkout is not connected yet — hook up Stripe to go live.' : 'Add something to your bag first.');

  renderBag();
  return {
    open,
    close,
    showToast,
    toggleCart,
    addWon,
    isWon: (id) => !!wonPrices()[id],
    refresh() { if (panel.classList.contains('open')) render(); },
    inBag: (id) => cart.includes(id),
    isOpen: () => panel.classList.contains('open'),
    get scope() {
      return scope;
    },
    get homeStore() {
      return homeStore;
    },
  };
}
