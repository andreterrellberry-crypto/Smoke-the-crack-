import { ITEMS, LOCATIONS, LOC_BY_ID, itemsForScope, COUNT_BY_LOC } from '../data/inventory.js';
import { productArt } from './art.js';

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

export function createMarket({ onFlyToLocation, onClose }) {
  const panel = $('#market');
  const grid = $('#grid');
  const crumbs = $('#crumbs');
  const title = $('#market-title');
  const meta = $('#market-meta');
  const sortSel = $('#sort');
  const bagBtn = $('#bag-btn');
  const bagCount = $('#bag-count');
  const bag = $('#bag');
  const bagList = $('#bag-list');
  const bagTotal = $('#bag-total');
  const toast = $('#toast');

  let scope = { level: 'world' };
  let anchorLoc = null;
  let cart = store.get('stc-bag', []).filter((id) => ITEMS.some((i) => i.id === id));

  function showToast(msg) {
    toast.textContent = msg;
    toast.classList.add('show');
    clearTimeout(showToast.t);
    showToast.t = setTimeout(() => toast.classList.remove('show'), 2400);
  }

  function renderCrumbs() {
    const parts = [{ label: 'Earth', scope: { level: 'world' } }];
    if (anchorLoc) {
      parts.push({ label: anchorLoc.country, scope: { level: 'country', value: anchorLoc.country } });
      if (anchorLoc.region !== anchorLoc.country && anchorLoc.region !== anchorLoc.city)
        parts.push({ label: anchorLoc.region, scope: { level: 'region', value: `${anchorLoc.country}|${anchorLoc.region}` } });
      parts.push({ label: anchorLoc.city, scope: { level: 'city', value: anchorLoc.id } });
    }
    crumbs.innerHTML = parts
      .map((p, i) => {
        const on = p.scope.level === scope.level && p.scope.value === scope.value;
        return `<button class="crumb${on ? ' on' : ''}" data-i="${i}">${esc(p.label)}</button>`;
      })
      .join('<span class="sep">›</span>');
    crumbs.querySelectorAll('button').forEach((b) => (b.onclick = () => setScope(parts[+b.dataset.i].scope)));
  }

  function renderGrid() {
    let items = itemsForScope(scope).slice();
    const s = sortSel.value;
    if (s === 'low') items.sort((a, b) => a.price - b.price);
    else if (s === 'high') items.sort((a, b) => b.price - a.price);
    else if (s === 'old') items.sort((a, b) => a.year - b.year);
    else if (s === 'new') items.sort((a, b) => b.year - a.year);

    const label =
      scope.level === 'world'
        ? 'Global Stock'
        : scope.level === 'city'
          ? LOC_BY_ID[scope.value].city
          : scope.level === 'region'
            ? scope.value.split('|')[1]
            : scope.value;
    title.textContent = label;
    const cities = new Set(items.map((i) => i.locId)).size;
    meta.textContent = `${items.length} piece${items.length === 1 ? '' : 's'} · ${cities} cit${cities === 1 ? 'y' : 'ies'}`;

    grid.innerHTML = items
      .map((it) => {
        const loc = LOC_BY_ID[it.locId];
        const inBag = cart.includes(it.id);
        return `<article class="card" style="--c:${it.color};--a:${it.accent}">
          <div class="art">${productArt(it)}<span class="cond">${esc(it.condition)}</span></div>
          <div class="body">
            <div class="row"><span class="brand">${esc(it.brand)}</span><span class="price">${money(it.price)}</span></div>
            <h3>${esc(it.name)}</h3>
            <p class="facts"><b>${it.year}</b> · ${esc(it.collection)} · by ${esc(it.designer)}</p>
            <p class="blurb">${esc(it.blurb)}</p>
            <div class="row foot">
              <button class="loc" data-loc="${loc.id}" title="Fly to ${esc(loc.city)}">◎ ${esc(loc.city)}, ${esc(loc.region === loc.city ? loc.country : loc.region)}</button>
              <span class="size">Size ${esc(it.size)}</span>
            </div>
            <button class="add${inBag ? ' in' : ''}" data-id="${it.id}">${inBag ? 'In Bag ✓' : 'Add to Bag'}</button>
          </div>
        </article>`;
      })
      .join('');
    grid.querySelectorAll('.add').forEach((b) => (b.onclick = () => toggleCart(b.dataset.id)));
    grid.querySelectorAll('.loc').forEach((b) => (b.onclick = () => onFlyToLocation(LOC_BY_ID[b.dataset.loc])));
    grid.scrollTop = 0;
  }

  function setScope(s) {
    scope = s;
    renderCrumbs();
    renderGrid();
  }

  function openFor(loc) {
    anchorLoc = loc;
    panel.classList.add('open');
    setScope(loc ? { level: 'city', value: loc.id } : { level: 'world' });
  }

  function close() {
    panel.classList.remove('open');
    onClose?.();
  }

  function toggleCart(id) {
    const it = ITEMS.find((i) => i.id === id);
    if (cart.includes(id)) {
      cart = cart.filter((c) => c !== id);
      showToast(`Removed ${it.name}`);
    } else {
      cart.push(id);
      showToast(`Added ${it.brand} — ${it.name}`);
      bagBtn.classList.remove('bump');
      void bagBtn.offsetWidth;
      bagBtn.classList.add('bump');
    }
    store.set('stc-bag', cart);
    renderBag();
    if (panel.classList.contains('open')) renderGrid();
  }

  function renderBag() {
    bagCount.textContent = cart.length;
    bagCount.hidden = cart.length === 0;
    const items = cart.map((id) => ITEMS.find((i) => i.id === id));
    bagList.innerHTML = items.length
      ? items
          .map(
            (it) => `<li><div class="mini">${productArt(it)}</div><div><b>${esc(it.brand)}</b><br>${esc(it.name)}<br><small>${esc(
              LOC_BY_ID[it.locId].city
            )} · ${it.year}</small></div><div class="r">${money(it.price)}<button data-id="${it.id}" aria-label="Remove">✕</button></div></li>`
          )
          .join('')
      : '<li class="empty">Your bag is empty. Spin the globe and pick a city.</li>';
    bagList.querySelectorAll('button').forEach((b) => (b.onclick = () => toggleCart(b.dataset.id)));
    bagTotal.textContent = money(items.reduce((s, i) => s + i.price, 0));
  }

  // Atlas search (keyboard-friendly alternative to clicking the globe)
  const search = $('#search');
  const results = $('#results');
  function renderResults() {
    const q = search.value.trim().toLowerCase();
    const list = LOCATIONS.filter((l) => !q || `${l.city} ${l.region} ${l.country}`.toLowerCase().includes(q))
      .concat(
        q
          ? ITEMS.filter((i) => `${i.brand} ${i.name} ${i.designer} ${i.collection}`.toLowerCase().includes(q))
              .map((i) => LOC_BY_ID[i.locId])
          : []
      )
      .filter((l, i, arr) => arr.indexOf(l) === i)
      .slice(0, 8);
    results.innerHTML = list
      .map((l) => `<li><button data-loc="${l.id}"><span>${esc(l.city)}</span><small>${esc(l.region)}, ${esc(l.country)} · ${COUNT_BY_LOC[l.id]}</small></button></li>`)
      .join('');
    results.querySelectorAll('button').forEach(
      (b) =>
        (b.onclick = () => {
          results.classList.remove('show');
          search.blur();
          onFlyToLocation(LOC_BY_ID[b.dataset.loc]);
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

  sortSel.onchange = renderGrid;
  $('#market-close').onclick = close;
  bagBtn.onclick = () => bag.classList.toggle('open');
  $('#bag-close').onclick = () => bag.classList.remove('open');
  $('#checkout').onclick = () =>
    showToast(cart.length ? 'Checkout is not connected yet — hook up Stripe to go live.' : 'Add something to your bag first.');
  $('#shop-all').onclick = () => openFor(null);

  renderBag();
  return { openFor, close, showToast, isOpen: () => panel.classList.contains('open') };
}
