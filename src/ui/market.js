import { ITEMS, CONTINENTS, COUNTRIES, COUNTRY_BY_ID, LOC_BY_ID, itemsForScope, COUNT_BY_COUNTRY } from '../data/inventory.js';
import { productArt } from './art.js';

const $ = (s) => document.querySelector(s);
const money = (n) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const continentOf = (country) => COUNTRY_BY_ID[country].continent;
const countFor = (scope) => itemsForScope(scope).length;

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

export function createMarket({ onFlyToCountry, onFlyToContinent, onClose }) {
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
  const chips = $('#continents');

  let scope = { level: 'world' };
  let cart = store.get('stc-bag', []).filter((id) => ITEMS.some((i) => i.id === id));

  function showToast(msg) {
    toast.textContent = msg;
    toast.classList.add('show');
    clearTimeout(showToast.t);
    showToast.t = setTimeout(() => toast.classList.remove('show'), 2400);
  }

  // Continent quick-nav (always visible)
  chips.innerHTML =
    `<button data-c="" class="on">All</button>` +
    CONTINENTS.map((c) => `<button data-c="${esc(c.id)}">${esc(c.id)} <small>${countFor({ level: 'continent', value: c.id })}</small></button>`).join('');
  chips.querySelectorAll('button').forEach(
    (b) =>
      (b.onclick = () => {
        if (!b.dataset.c) return onFlyToContinent(null);
        onFlyToContinent(CONTINENTS.find((c) => c.id === b.dataset.c));
      })
  );
  function syncChips() {
    const active = scope.level === 'world' ? '' : scope.level === 'continent' ? scope.value : continentOf(scope.value);
    chips.querySelectorAll('button').forEach((b) => b.classList.toggle('on', panel.classList.contains('open') ? b.dataset.c === active : !b.dataset.c));
  }

  function renderCrumbs() {
    const parts = [{ label: 'Earth', go: () => onFlyToContinent(null) }];
    if (scope.level !== 'world') {
      const cont = scope.level === 'continent' ? scope.value : continentOf(scope.value);
      parts.push({ label: cont, go: () => onFlyToContinent(CONTINENTS.find((c) => c.id === cont)), on: scope.level === 'continent' });
      if (scope.level === 'country') parts.push({ label: scope.value, go: () => {}, on: true });
    } else parts[0].on = true;
    crumbs.innerHTML = parts.map((p, i) => `<button class="crumb${p.on ? ' on' : ''}" data-i="${i}">${esc(p.label)}</button>`).join('<span class="sep">›</span>');
    crumbs.querySelectorAll('button').forEach((b) => (b.onclick = parts[+b.dataset.i].go));
  }

  function renderCountryChips() {
    // Inside a continent: one-tap jump to each country that has stock
    const host = $('#country-chips');
    if (scope.level !== 'continent') return (host.innerHTML = '');
    host.innerHTML = COUNTRIES.filter((c) => c.continent === scope.value)
      .map((c) => `<button data-c="${esc(c.id)}">${esc(c.id)} <small>${COUNT_BY_COUNTRY[c.id]}</small></button>`)
      .join('');
    host.querySelectorAll('button').forEach((b) => (b.onclick = () => onFlyToCountry(COUNTRY_BY_ID[b.dataset.c])));
  }

  function renderGrid() {
    const items = itemsForScope(scope).slice();
    const s = sortSel.value;
    if (s === 'low') items.sort((a, b) => a.price - b.price);
    else if (s === 'high') items.sort((a, b) => b.price - a.price);
    else if (s === 'old') items.sort((a, b) => a.year - b.year);
    else if (s === 'new') items.sort((a, b) => b.year - a.year);

    title.textContent = scope.level === 'world' ? 'Global Stock' : scope.value;
    const countries = new Set(items.map((i) => LOC_BY_ID[i.locId].country)).size;
    meta.textContent = `${items.length} piece${items.length === 1 ? '' : 's'}${scope.level === 'country' ? '' : ` · ${countries} countr${countries === 1 ? 'y' : 'ies'}`}`;

    grid.innerHTML = items
      .map((it) => {
        const loc = LOC_BY_ID[it.locId];
        const inBag = cart.includes(it.id);
        return `<article class="card">
          <div class="art">${productArt(it)}<span class="cond">${esc(it.condition)}</span></div>
          <div class="body">
            <div class="row"><span class="brand">${esc(it.brand)}</span><span class="price">${money(it.price)}</span></div>
            <h3>${esc(it.name)}</h3>
            <p class="where">📍 ${esc(loc.city)}, ${esc(loc.country)}</p>
            <p class="facts"><b>${it.year}</b> · ${esc(it.collection)} · by ${esc(it.designer)}</p>
            <p class="blurb">${esc(it.blurb)}</p>
            <div class="row foot"><span class="size">Size ${esc(it.size)}</span></div>
            <button class="add${inBag ? ' in' : ''}" data-id="${it.id}">${inBag ? 'In Bag ✓' : 'Add to Bag'}</button>
          </div>
        </article>`;
      })
      .join('');
    grid.querySelectorAll('.add').forEach((b) => (b.onclick = () => toggleCart(b.dataset.id)));
    grid.scrollTop = 0;
  }

  function open(s) {
    scope = s;
    panel.classList.add('open');
    renderCrumbs();
    renderCountryChips();
    renderGrid();
    syncChips();
  }

  function close() {
    panel.classList.remove('open');
    syncChips();
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
          .map((it) => {
            const loc = LOC_BY_ID[it.locId];
            return `<li><div class="mini">${productArt(it)}</div><div><b>${esc(it.brand)}</b><br>${esc(it.name)}<br><small>${esc(loc.city)}, ${esc(
              loc.country
            )} · ${it.year}</small></div><div class="r">${money(it.price)}<button data-id="${it.id}" aria-label="Remove">✕</button></div></li>`;
          })
          .join('')
      : '<li class="empty">Your bag is empty. Spin the globe and pick a country.</li>';
    bagList.querySelectorAll('button').forEach((b) => (b.onclick = () => toggleCart(b.dataset.id)));
    bagTotal.textContent = money(items.reduce((s, i) => s + i.price, 0));
  }

  // Search: continents, countries, cities and brands all resolve to a country or continent
  const search = $('#search');
  const results = $('#results');
  function renderResults() {
    const q = search.value.trim().toLowerCase();
    const out = [];
    const seen = new Set();
    const add = (kind, id, sub) => {
      const key = kind + id;
      if (!seen.has(key)) seen.add(key), out.push({ kind, id, sub });
    };
    CONTINENTS.filter((c) => !q || c.id.toLowerCase().includes(q)).forEach((c) => add('continent', c.id, `${countFor({ level: 'continent', value: c.id })} pieces`));
    if (q) {
      COUNTRIES.filter((c) => c.id.toLowerCase().includes(q)).forEach((c) => add('country', c.id, `${c.continent} · ${COUNT_BY_COUNTRY[c.id]} pieces`));
      ITEMS.filter((i) => `${i.brand} ${i.name} ${i.designer} ${i.collection} ${LOC_BY_ID[i.locId].city}`.toLowerCase().includes(q)).forEach((i) => {
        const c = LOC_BY_ID[i.locId].country;
        add('country', c, `${continentOf(c)} · ${COUNT_BY_COUNTRY[c]} pieces`);
      });
    }
    results.innerHTML = out
      .slice(0, 8)
      .map((r) => `<li><button data-kind="${r.kind}" data-id="${esc(r.id)}"><span>${esc(r.id)}</span><small>${esc(r.sub)}</small></button></li>`)
      .join('');
    results.querySelectorAll('button').forEach(
      (b) =>
        (b.onclick = () => {
          results.classList.remove('show');
          search.blur();
          if (b.dataset.kind === 'country') onFlyToCountry(COUNTRY_BY_ID[b.dataset.id]);
          else onFlyToContinent(CONTINENTS.find((c) => c.id === b.dataset.id));
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
  $('#shop-all').onclick = () => open({ level: 'world' });

  renderBag();
  return { open, close, showToast, isOpen: () => panel.classList.contains('open') };
}
