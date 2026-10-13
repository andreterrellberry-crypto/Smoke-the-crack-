// The Hammerdome's live auction: lots run back to back, a room of rival bidders with their own ceilings and nerve
// bid against each other and against you, the clock soft-closes (a late bid buys the room ten more seconds), and the
// auctioneer calls it: going once, going twice, SOLD. Win a lot and it drops into your bag at the hammer price.
import { AUCTION_LOTS } from '../data/inventory.js';

const RIVALS = [
  ['Paddle 7', 'a sneakerhead from Osaka'], ['Paddle 12', 'a dealer phoning in from Milan'], ['Paddle 23', 'a rapper’s stylist'],
  ['Paddle 31', 'the guy in the fur coat'], ['Paddle 44', 'a Lagos collector'], ['Paddle 58', 'an archive kid from Antwerp'],
  ['Paddle 66', 'a hedge-fund dad'], ['Paddle 71', 'a reseller with three phones'], ['Paddle 88', 'Grandma Estelle'],
  ['Paddle 90', 'a museum buyer'], ['Online', 'a bidder in Seoul'], ['Online', 'a bidder in Dubai'],
];
const LOT_SECS = 32, SOFT_CLOSE = 10, INTERMISSION = 5;
const rnd = (a, b) => a + Math.random() * (b - a);
export const increment = (bid) => (bid < 1000 ? 50 : bid < 5000 ? 250 : bid < 20000 ? 1000 : bid < 50000 ? 2500 : 5000);
const money = (n) => `$${Math.round(n).toLocaleString('en-US')}`;
// auction-chant style: "twelve thousand, now thirteen, now thirteen, will ya gimme thirteen"
const say = (n) => (n >= 1000 ? `${(n / 1000).toLocaleString('en-US', { maximumFractionDigits: 1 })}K` : `${n}`);

export function createAuction({ isWon = () => false } = {}) {
  const listeners = new Set();
  const emit = (ev) => { for (const f of listeners) f(ev); };
  let order = AUCTION_LOTS.map((l) => l.id);
  let i = -1, lot = null, bid = 0, high = null, endsAt = 0, phase = 'intermission', nextAt = 1.2, clock = 0;
  let rivals = [], history = [], called = new Set();

  function pickRivals() {
    const pool = RIVALS.slice().sort(() => Math.random() - 0.5).slice(0, 5);
    return pool.map(([paddle, who], k) => ({
      paddle, who,
      // most of the room drops out around the estimate; one or two whales push past it
      max: lot.estLow * (k === 0 ? rnd(1.05, 1.5) : rnd(0.55, 1.15)),
      nerve: rnd(0.25, 0.9), // how fast they jump back in
      wait: rnd(0.8, 3),
    }));
  }
  function startLot() {
    const avail = order.filter((id) => !isWon(id));
    if (!avail.length) { order = AUCTION_LOTS.map((l) => l.id); }
    i = (i + 1) % order.length;
    while (isWon(order[i]) && order.some((id) => !isWon(id))) i = (i + 1) % order.length;
    lot = AUCTION_LOTS.find((l) => l.id === order[i]);
    bid = 0; high = null; history = []; called = new Set();
    endsAt = clock + LOT_SECS;
    phase = 'open';
    rivals = pickRivals();
    emit({ type: 'lot', lot, line: `Lot ${lot.lot}! ${lot.brand}, ${lot.name}! Estimate ${money(lot.estLow)} to ${money(lot.estHigh)}. Who'll start me at ${money(lot.start)}?` });
  }
  const nextBid = () => (high ? bid + increment(bid) : lot.start);
  function place(who, amount) {
    bid = amount;
    high = who;
    history.unshift({ who, amount, at: clock });
    if (history.length > 12) history.pop();
    // a late bid buys the room ten more seconds
    if (endsAt - clock < SOFT_CLOSE) endsAt = clock + SOFT_CLOSE;
    phase = 'open';
    called = new Set();
    for (const r of rivals) r.wait = rnd(0.7, 2.6) / (0.5 + r.nerve);
    const n = nextBid();
    const line = who.you
      ? pickLine([`${money(amount)} from the shopper in the fresh kicks! Now ${say(n)}, now ${say(n)}, who'll gimme ${say(n)}?`, `I got ${money(amount)} from the newcomer! Do I hear ${money(n)}?`, `${money(amount)}, the new money's in the game! ${say(n)}, ${say(n)}, will ya gimme ${say(n)}?`])
      : pickLine([`${money(amount)} from ${who.paddle}! Now ${say(n)}, now ${say(n)}, will ya gimme ${say(n)}?`, `I got ${say(amount)}, ${who.who}! Who'll make it ${money(n)}?`, `${who.paddle} says ${money(amount)}! ${say(n)}-${say(n)}-${say(n)}, do I hear ${say(n)}?`]);
    emit({ type: 'bid', lot, who, amount, line });
  }
  function pickLine(a) { return a[Math.floor(Math.random() * a.length)]; }

  function tick(dt) {
    clock += dt;
    if (phase === 'intermission') {
      if (clock >= nextAt) startLot();
      return;
    }
    if (phase === 'sold') {
      if (clock >= nextAt) { phase = 'intermission'; nextAt = clock + 0.1; }
      return;
    }
    // rivals: anyone under their ceiling who isn't already winning thinks about it, faster as the clock runs down
    const left = endsAt - clock;
    const n = nextBid();
    for (const r of rivals) {
      if (high === r || n > r.max) continue;
      r.wait -= dt * (left < 6 ? 2.2 : 1);
      if (r.wait <= 0) { place(r, n); break; }
    }
    const left2 = endsAt - clock;
    if (left2 <= 6 && !called.has('once')) { called.add('once'); emit({ type: 'call', lot, call: 'once', line: high ? `${money(bid)}, going once...` : `Come on now, ${money(lot.start)} to start, going once...` }); }
    if (left2 <= 3 && !called.has('twice')) { called.add('twice'); emit({ type: 'call', lot, call: 'twice', line: high ? `Going twice at ${money(bid)}...` : 'Going twice...' }); }
    if (left2 <= 0) {
      phase = 'sold';
      nextAt = clock + INTERMISSION;
      if (high) {
        const line = high.you ? `SOLD! To YOU for ${money(bid)}! Welcome to the Hammerdome, partner!` : `SOLD! To ${high.paddle}, ${high.who}, for ${money(bid)}!`;
        emit({ type: 'sold', lot, who: high, amount: bid, line, you: !!high.you });
      } else emit({ type: 'sold', lot, who: null, amount: 0, line: `No sale! ${lot.name} goes back in the vault.` });
    }
  }

  return {
    tick,
    on(f) { listeners.add(f); return () => listeners.delete(f); },
    bid(steps = 1) {
      if (phase !== 'open' || high?.you) return false;
      let amount = nextBid();
      for (let k = 1; k < steps; k++) amount += increment(amount);
      place({ you: true, paddle: 'You', who: 'you' }, amount);
      return true;
    },
    get state() {
      return { clock, lot, bid, high, phase, left: Math.max(0, endsAt - clock), total: LOT_SECS, next: lot ? nextBid() : 0, history, index: i, count: order.length, upcoming: [1, 2, 3].map((k) => AUCTION_LOTS.find((l) => l.id === order[(i + k) % order.length])), soldIn: Math.max(0, nextAt - clock) };
    },
  };
}
