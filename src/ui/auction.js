// The auction panel: the lot on the block, the live bid, the clock, your paddle and the room's bid feed.
// Rendered into the marketplace panel; the live parts update every frame without rebuilding the panel.
import { itemImg } from '../toon/items.js';
import { increment } from '../auction/engine.js';

const money = (n) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const who = (h) => (!h ? 'No bids yet' : h.you ? 'YOU’RE WINNING' : `${h.paddle} · ${h.who}`);

export function createAuctionPanel(auction, { onBid } = {}) {
  let host = null, lotId = null, last = '';
  function render({ crumbs, title, meta, grid }) {
    const s = auction.state;
    host = grid;
    lotId = s.lot?.id;
    last = '';
    crumbs.innerHTML = `<span class="crumb on">Hammerdome Auction Hall</span><span class="sep">›</span><span class="crumb">Live</span>`;
    title.textContent = s.lot ? `Lot ${s.lot.lot}` : 'Next lot';
    meta.textContent = 'Live bidding · every lot is a one-off you won’t find anywhere else on the block';
    if (!s.lot) { grid.innerHTML = `<p class="section-h">“Sit tight, partner. Next lot’s comin’ up.”</p>`; return; }
    const l = s.lot;
    grid.innerHTML = `<div class="auc">
      <article class="card lotcard">
        <div class="art">${itemImg(l)}<span class="cond">LOT ${l.lot}</span><span class="badge only">ONLY HERE</span></div>
        <div class="body">
          <div class="row"><span class="brand">${esc(l.brand)}</span><span class="est">Est. ${money(l.estLow)}–${money(l.estHigh)}</span></div>
          <h3>${esc(l.name)}</h3>
          <p class="where">📍 ${esc(l.origin)}</p>
          <p class="facts"><b>${l.year}</b> · ${esc(l.collection)} · by ${esc(l.designer)}</p>
          <p class="blurb">${esc(l.blurb)}</p>
          <div class="row foot"><span class="size">Size ${esc(l.size)} · ${esc(l.condition)}</span></div>
        </div>
      </article>
      <section class="live" aria-live="polite">
        <div class="cur"><small>Current bid</small><b data-a="bid"></b><span data-a="high"></span></div>
        <div class="clock"><i data-a="bar"></i><span data-a="call"></span></div>
        <div class="btns"><button class="add" data-a="b1"></button><button class="jump" data-a="b3"></button></div>
        <ol class="feed" data-a="feed"></ol>
      </section>
      <section class="next"><h4>Up next on the block</h4><ul>${s.upcoming.map((u) => `<li><div class="mini">${itemImg(u)}</div><div><b>${esc(u.brand)}</b><span>${esc(u.name)}</span><em>Est. ${money(u.estLow)}–${money(u.estHigh)}</em></div></li>`).join('')}</ul></section>
    </div>`;
    grid.querySelector('[data-a="b1"]').onclick = () => { if (auction.bid(1)) onBid?.(); };
    grid.querySelector('[data-a="b3"]').onclick = () => { if (auction.bid(3)) onBid?.(); };
    grid.scrollTop = 0;
    update();
  }
  // live bits: the bid, who's on it, the clock, the calls, the buttons and the feed
  function update() {
    if (!host || !host.isConnected || !host.querySelector('.auc')) return false;
    const s = auction.state;
    if (s.lot?.id !== lotId) return true; // a new lot is up: the caller re-renders the panel
    const q = (k) => host.querySelector(`[data-a="${k}"]`);
    const sold = s.phase === 'sold';
    const youWin = s.high?.you;
    const sig = [s.bid, s.high?.paddle, s.phase, Math.ceil(s.left), s.history.length].join('|');
    q('bar').style.width = `${sold ? 0 : Math.min(100, (s.left / s.total) * 100)}%`;
    q('bar').parentElement.classList.toggle('hot', s.left <= 6 && !sold);
    if (sig === last) return false;
    last = sig;
    q('bid').textContent = money(s.bid || s.lot.start);
    q('high').textContent = sold ? (s.high ? (youWin ? 'SOLD TO YOU!' : `SOLD to ${s.high.paddle}`) : 'No sale') : s.high ? who(s.high) : `Opening bid · ${who(null)}`;
    q('high').className = youWin ? 'you' : '';
    q('call').textContent = sold ? `Next lot in ${Math.ceil(s.soldIn)}s` : s.left <= 3 ? 'GOING TWICE!' : s.left <= 6 ? 'GOING ONCE!' : `${Math.ceil(s.left)}s left`;
    const b1 = q('b1'), b3 = q('b3');
    let three = s.next;
    for (let k = 1; k < 3; k++) three += increment(three);
    b1.textContent = sold ? 'Hammer’s down' : youWin ? 'You’re the high bid ✓' : `Bid ${money(s.next)}`;
    b3.textContent = sold || youWin ? 'Hold your paddle' : `Jump to ${money(three)}`;
    b1.disabled = b3.disabled = sold || youWin;
    b1.classList.toggle('in', !!youWin);
    q('feed').innerHTML = s.history.slice(0, 6).map((h, k) => `<li class="${h.who.you ? 'you' : ''}${k === 0 ? ' top' : ''}"><b>${money(h.amount)}</b><span>${h.who.you ? 'You' : esc(`${h.who.paddle} · ${h.who.who}`)}</span></li>`).join('') || '<li class="quiet"><span>Waiting on the first paddle…</span></li>';
    return false;
  }
  return { render, update };
}
