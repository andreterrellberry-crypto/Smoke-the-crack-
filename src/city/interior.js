// Inside a store: region-styled room, the owner behind the counter, real stock on the racks.
import { INK, o, esc } from './style.js';
import { person, OWNERS } from './characters.js';
import { productArt } from '../ui/art.js';

export const ROOM_W = 1200;
export const ROOM_H = 720;
export const OWNER_X = 470; // where the owner stands (used to frame the view on phones)

const art = (it, x, y, s) => productArt(it).replace('<svg ', `<svg x="${x}" y="${y}" width="${s}" height="${s}" `);

const ROOMS = {
  'north-america': {
    wall: `<rect width="1200" height="480" fill="url(#brick)"/>`,
    floor: `<rect y="480" width="1200" height="240" fill="url(#wood)"/>`,
    decor: `<text x="900" y="140" text-anchor="middle" font-family="Bungee, sans-serif" font-size="54" fill="#ff4fa3" class="neon">UPTOWN</text>
      <g transform="translate(980 300)"><rect x="-70" y="-40" width="140" height="80" rx="10" fill="#2b2b33" ${o()}/><circle cx="-36" cy="0" r="24" fill="#555" ${o()}/><circle cx="36" cy="0" r="24" fill="#555" ${o()}/><rect x="-16" y="-28" width="32" height="14" fill="#5cf2ff"/></g>`,
    counter: '#1f4a35',
  },
  canada: {
    wall: `<rect width="1200" height="480" fill="url(#logs)"/>`,
    floor: `<rect y="480" width="1200" height="240" fill="url(#wood)"/><rect x="760" y="560" width="360" height="110" rx="14" fill="url(#plaid)" ${o()}/>`,
    decor: `<g transform="translate(940 150)"><path d="M-60 -40 q-30 -40 -10 -70 M-60 -40 q-50 -20 -60 -60 M60 -40 q30 -40 10 -70 M60 -40 q50 -20 60 -60" fill="none" stroke="#e9dfc9" stroke-width="10" stroke-linecap="round"/><path d="M-60 -40 Q0 -10 60 -40" fill="none" stroke="#e9dfc9" stroke-width="12"/><rect x="-30" y="-36" width="60" height="70" rx="20" fill="#8a5a33" ${o()}/></g>
      <g transform="translate(1080 330) rotate(12)"><rect x="-6" y="-150" width="12" height="200" fill="#c19a6b" ${o()}/><ellipse cx="0" cy="80" rx="22" ry="50" fill="#c19a6b" ${o()}/></g>`,
    counter: '#6b4224',
  },
  'south-america': {
    wall: `<rect width="1200" height="480" fill="#2bb3a3"/><rect y="300" width="1200" height="40" fill="url(#tiles)"/>`,
    floor: `<rect y="480" width="1200" height="240" fill="#c8562a"/><path d="${Array.from({ length: 12 }, (_, i) => `M${i * 100} 480 V720`).join('')}M0 560 H1200 M0 640 H1200" stroke="#9e3f1c" stroke-width="3"/>`,
    decor: `<path d="M0 60 ${Array.from({ length: 20 }, (_, i) => `L${30 + i * 60} 100 L${60 + i * 60} 60`).join(' ')}" fill="none" stroke="${INK}" stroke-width="2"/>
      ${Array.from({ length: 20 }, (_, i) => `<path d="M${i * 60} 60 L${30 + i * 60} 100 L${60 + i * 60} 60Z" fill="${['#e2566a', '#f4c430', '#2a5ea8', '#009739'][i % 4]}" ${o('stroke-width="1.5"')}/>`).join('')}
      <g transform="translate(1000 470)"><path d="M-40 0 h80 l-10 -60 h-60Z" fill="#c8562a" ${o()}/><path d="M0 -60 q-60 -100 -10 -200 M0 -60 q60 -90 20 -190 M0 -60 q-90 -40 -110 -110 M0 -60 q90 -50 110 -120" fill="none" stroke="#2e8b57" stroke-width="16" stroke-linecap="round"/></g>`,
    counter: '#f4c430',
  },
  europe: {
    wall: `<rect width="1200" height="480" fill="#e9dcc8"/><rect y="300" width="1200" height="180" fill="#1f3b2f"/><path d="${Array.from({ length: 12 }, (_, i) => `M${30 + i * 100} 320 h70 v140 h-70Z`).join('')}" fill="none" stroke="#d4af37" stroke-width="2"/>`,
    floor: `<rect y="480" width="1200" height="240" fill="url(#checker)"/>`,
    decor: `<g transform="translate(950 170)"><ellipse rx="80" ry="110" fill="#bfe0e8" stroke="#d4af37" stroke-width="14"/><path d="M-40 -60 l30 -20" stroke="#fff" stroke-width="6" opacity=".7"/></g>
      <g transform="translate(600 0)"><path d="M0 0 V40" ${o()}/><path d="M-70 60 Q0 120 70 60 M-50 60 v-14 M0 70 v-16 M50 60 v-14" fill="none" stroke="#d4af37" stroke-width="6"/><circle cx="-50" cy="40" r="7" fill="#ffe9a0"/><circle cx="0" cy="48" r="7" fill="#ffe9a0"/><circle cx="50" cy="40" r="7" fill="#ffe9a0"/></g>`,
    counter: '#1f3b2f',
  },
  africa: {
    wall: `<rect width="1200" height="480" fill="#d17a3a"/><rect width="1200" height="40" fill="url(#kente)"/>${[80, 1060].map((x) => `<rect x="${x}" y="80" width="90" height="360" fill="url(#ankara)" ${o()}/>`).join('')}`,
    floor: `<rect y="480" width="1200" height="240" fill="url(#wood)"/><rect x="200" y="640" width="800" height="40" fill="url(#kente)" ${o()}/>`,
    decor: `${[[880, 440, '#c0392b'], [960, 450, '#f4c430'], [1040, 440, '#1d6b4a']].map(([x, y, c]) => `<path d="M${x - 34} ${y - 50} h68 l-8 50 h-52Z" fill="#c19a6b" ${o()}/><path d="M${x - 30} ${y - 34} h60 M${x - 28} ${y - 18} h56" stroke="${c}" stroke-width="5"/>`).join('')}
      <g transform="translate(960 190)"><rect x="-120" y="-70" width="240" height="140" fill="url(#ankara)" ${o()}/><rect x="-100" y="-50" width="200" height="100" fill="url(#kente)" ${o('stroke-width="2"')}/></g>`,
    counter: '#1d6b4a',
  },
  asia: {
    wall: `<rect width="1200" height="480" fill="url(#shoji)"/><rect y="0" width="1200" height="40" fill="#3a2a22"/>`,
    floor: `<rect y="480" width="1200" height="240" fill="#d9c48a"/><path d="${Array.from({ length: 7 }, (_, i) => `M${i * 200} 480 V720`).join('')}M0 600 H1200" stroke="#a8935a" stroke-width="5"/>`,
    decor: `${[120, 600, 1080].map((x, i) => `<g class="sway" style="animation-delay:${i * 0.4}s"><path d="M${x} 40 V80" ${o()}/><ellipse cx="${x}" cy="110" rx="30" ry="36" fill="#d6332c" ${o()}/><rect x="${x - 16}" y="72" width="32" height="10" fill="#1a1a1a"/><rect x="${x - 16}" y="140" width="32" height="10" fill="#1a1a1a"/></g>`).join('')}
      <g transform="translate(960 420)"><rect x="-60" y="0" width="120" height="40" rx="6" fill="#5a3a24" ${o()}/><path d="M0 0 q-10 -60 10 -110 M10 -110 q-60 -10 -80 20 M10 -110 q60 -20 76 14 M10 -110 q-10 -40 20 -60" fill="none" stroke="#5a3a24" stroke-width="10" stroke-linecap="round"/>${[[-60, -86], [70, -96], [24, -168], [-20, -130]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="30" fill="#2e8b57" ${o()}/>`).join('')}</g>`,
    counter: '#3a2a22',
  },
  oceania: {
    wall: `<rect width="1200" height="480" fill="url(#tin)"/>`,
    floor: `<rect y="480" width="1200" height="240" fill="#e8d3a2"/><path d="M0 560 q300 -20 600 0 t600 0" fill="none" stroke="#d1b880" stroke-width="6"/>`,
    decor: `${[['#ff6b6b', 860], ['#4ecdc4', 960], ['#f4c430', 1060]].map(([c, x]) => `<g transform="translate(${x} 260) rotate(8)"><ellipse rx="34" ry="190" fill="${c}" ${o()}/><path d="M0 -186 V186" stroke="#fff" stroke-width="6"/></g>`).join('')}`,
    counter: '#0b6e8f',
  },
};

export function interiorSVG(store, items) {
  const room = ROOMS[store.id];
  const hang = items.slice(0, 6);
  const rack = `<path d="M40 150 H330" ${o('stroke-width="6"')}/><path d="M50 150 V470 M320 150 V470" ${o('stroke-width="6"')}/>
    ${hang
      .map((it, i) => {
        const col = i % 3;
        const row = Math.floor(i / 3);
        const x = 60 + col * 88;
        const y = 168 + row * 150;
        return `<path d="M${x + 40} ${y - 18 + (row ? -0 : 0)} q0 -8 6 -8" fill="none" ${o('stroke-width="2"')}/>${art(it, x, y, 84)}`;
      })
      .join('')}
    ${hang.length > 3 ? `<path d="M40 300 H330" ${o('stroke-width="6"')}/>` : ''}`;
  const shelves = `<g transform="translate(760 0)">${[300, 380].map((y) => `<rect x="0" y="${y}" width="380" height="12" fill="#5a3a24" ${o()}/>`).join('')}
    ${items
      .filter((i) => i.type === 'sneaker' || i.type === 'cap' || i.type === 'accessory')
      .slice(0, 4)
      .map((it, i) => art(it, 10 + i * 92, 220, 84))
      .join('')}
    ${[0, 1, 2, 3].map((i) => `<rect x="${20 + i * 90}" y="${336 - (i % 2) * 8}" width="66" height="${44 + (i % 2) * 8}" fill="${items[i % items.length]?.color || '#888'}" ${o('stroke-width="2"')}/>`).join('')}</g>`;
  const owner = `<g class="owner" transform="translate(${OWNER_X} 612) scale(2)">${person({ ...OWNERS[store.id], facing: -1, look: -1 })}</g>`;
  const counter = `<g><rect x="250" y="456" width="460" height="22" fill="#e9dfc9" ${o()}/><rect x="262" y="478" width="436" height="150" fill="${room.counter}" ${o()}/>
    <path d="M262 520 H698" stroke="#000" stroke-opacity=".2" stroke-width="4"/>
    <g transform="translate(610 420)"><rect x="-40" y="0" width="80" height="38" fill="#3a3a44" ${o()}/><rect x="-30" y="-30" width="60" height="30" fill="#5cf2ff" ${o()}/><text x="0" y="-9" text-anchor="middle" font-family="Anton, sans-serif" font-size="14" fill="#123">$$$</text></g>
    <text x="480" y="580" text-anchor="middle" font-family="Inter, sans-serif" font-weight="800" font-size="16" fill="#fffaf0" letter-spacing="3">${esc(store.name.toUpperCase())}</text></g>`;
  return `${room.wall}${room.floor}<rect y="470" width="1200" height="14" fill="#000" opacity=".25"/>${room.decor}${rack}${shelves}${owner}${counter}`;
}
