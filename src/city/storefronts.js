// Region-specific storefronts. Each facade is drawn in local space: x 0..W, ground (sidewalk) at y = 0, building rises to negative y.
import { INK, o, esc, rng } from './style.js';
import { nucci, penguin } from './characters.js';
import { productArt } from '../ui/art.js';

export const STORE_W = 420;
export const GROUND = 560; // sidewalk meets the buildings
export const CURB = 646;
export const ALLEY_W = 270;

const miniArt = (item, x, y, size) => productArt(item).replace('<svg ', `<svg x="${x}" y="${y}" width="${size}" height="${size}" `);

function displayWindow(x, y, w, h, items, frame = INK, glass = 'url(#glass)') {
  const n = Math.min(items.length, w > 110 ? 2 : 1);
  const size = Math.min(h - 20, (w - 16) / Math.max(n, 1));
  const art = items
    .slice(0, n)
    .map((it, i) => miniArt(it, x + 8 + i * ((w - 16) / n) + ((w - 16) / n - size) / 2, y + h - size - 8, size))
    .join('');
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${glass}" ${o()}/>${art}
    <path d="M${x + 10} ${y + 12} l22 -0 M${x + 10} ${y + 22} l12 0" stroke="#fff" stroke-width="3" opacity=".55"/>
    <rect x="${x - 4}" y="${y + h}" width="${w + 8}" height="8" fill="${frame}" ${o('stroke-width="2"')}/>`;
}

function door(x, y, w, h, color, extra = '') {
  // .door-panel swings open (CSS) when the shopper walks in
  return `<g class="door"><rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#1a1216" ${o()}/>
    <rect x="${x + w / 2 - 10}" y="${y + 16}" width="20" height="${h - 30}" fill="#ffd27a" opacity=".55"/>
    <g class="door-panel"><rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${color}" ${o()}/>
    <rect x="${x + 10}" y="${y + 12}" width="${w - 20}" height="${h * 0.45}" fill="url(#glass)" ${o('stroke-width="2"')}/>
    <circle cx="${x + w - 12}" cy="${y + h * 0.58}" r="4" fill="#e8c14a" ${o('stroke-width="1.5"')}/>${extra}</g></g>`;
}

const scallop = (x, y, w, h, fill) => {
  const n = Math.round(w / 30);
  const step = w / n;
  let d = `M${x} ${y} H${x + w} V${y + h}`;
  for (let i = n; i > 0; i--) d += ` Q${x + (i - 0.5) * step} ${y + h + 12} ${x + (i - 1) * step} ${y + h}`;
  return `<path d="${d}Z" fill="${fill}" ${o()}/>`;
};

const signText = (x, y, text, font, size, fill, extra = '') =>
  `<text x="${x}" y="${y}" text-anchor="middle" font-family="${font}" font-size="${size}" fill="${fill}" ${extra}>${esc(text)}</text>`;

const mapleLeaf = (cx, cy, s, fill) =>
  `<path transform="translate(${cx} ${cy}) scale(${s})" d="M0 -20 L4 -10 L10 -13 L8 -2 L16 -6 L13 2 L18 4 L8 10 L9 14 L1 12 L1 20 L-1 20 L-1 12 L-9 14 L-8 10 L-18 4 L-13 2 L-16 -6 L-8 -2 L-10 -13 L-4 -10Z" fill="${fill}" ${o('stroke-width="1.5"')}/>`;

const lantern = (x, y, delay) =>
  `<g class="sway" style="animation-delay:${delay}s"><path d="M${x} ${y - 24} V${y - 14}" ${o('stroke-width="2"')}/>
   <ellipse cx="${x}" cy="${y}" rx="15" ry="18" fill="#d6332c" ${o()}/><path d="M${x - 15} ${y} H${x + 15} M${x} ${y - 18} V${y + 18}" stroke="#8e1d18" stroke-width="2"/>
   <rect x="${x - 8}" y="${y - 22}" width="16" height="6" fill="#1a1a1a" ${o('stroke-width="2"')}/><rect x="${x - 8}" y="${y + 16}" width="16" height="6" fill="#1a1a1a" ${o('stroke-width="2"')}/></g>`;

// ---------- Facades ----------
// Each returns { svg, height, holes } where holes are window/door rects to board up for construction.
const FACADES = {
  'north-america'(items) {
    const H = 430;
    let s = `<rect x="0" y="${-H}" width="420" height="${H}" fill="url(#brick)" ${o()}/>
      <rect x="-8" y="${-H - 14}" width="436" height="18" fill="#6b2a1d" ${o()}/>${Array.from({ length: 18 }, (_, i) => `<rect x="${4 + i * 23.5}" y="${-H + 4}" width="10" height="8" fill="#6b2a1d"/>`).join('')}`;
    for (const y of [-395, -305])
      for (const x of [50, 180, 310])
        s += `<rect x="${x - 6}" y="${y - 8}" width="72" height="10" fill="#d8cbb6" ${o('stroke-width="2"')}/><rect x="${x}" y="${y}" width="60" height="70" fill="${(x + y) % 3 ? '#2e3a5a' : '#ffd36b'}" ${o()}/><path d="M${x + 30} ${y}V${y + 70}M${x} ${y + 35}H${x + 60}" stroke="#d8cbb6" stroke-width="3"/>`;
    // fire escape
    s += `<g fill="none" stroke="#1a1a1a" stroke-width="4">${[-318, -228]
      .map((y) => `<path d="M160 ${y}H390M160 ${y - 30}H390M160 ${y}V${y - 30}M390 ${y}V${y - 30}${[200, 240, 280, 320, 360].map((x) => `M${x} ${y}V${y - 30}`).join('')}"/>`)
      .join('')}<path d="M180 -228 L230 -318 M186 -228 L236 -318" stroke-width="3"/></g>`;
    s += `<rect x="8" y="-205" width="404" height="205" fill="#1f4a35" ${o()}/>
      <rect x="20" y="-198" width="380" height="40" fill="#141414" ${o()}/>${signText(210, -170, 'UPTOWN THREAD EXCHANGE', 'Bungee, Anton, sans-serif', 21, '#f4c430')}
      ${scallop(14, -156, 392, 22, '#2e6b4a')}
      ${displayWindow(26, -122, 140, 104, items.slice(0, 2))}${displayWindow(262, -122, 140, 104, items.slice(2, 4))}
      ${door(180, -140, 68, 140, '#2e6b4a')}
      <text x="332" y="-96" text-anchor="middle" font-family="Bungee, sans-serif" font-size="18" fill="#ff4fa3" class="neon">OPEN</text>`;
    return { svg: s, height: H + 14, holes: [[26, -122, 140, 104], [262, -122, 140, 104], [180, -140, 68, 140]], door: [180, -140, 68, 140] };
  },

  canada(items) {
    const H = 380;
    let s = `<path d="M-16 -262 L210 ${-H} L436 -262Z" fill="#3f5a3a" ${o()}/>
      <path d="M-6 -266 L210 ${-H + 6} L426 -266" fill="none" stroke="#fff" stroke-width="12" stroke-linecap="round"/>
      <path d="M40 -290 q4 10 0 16 M120 -332 q4 10 0 16 M300 -332 q4 10 0 16 M380 -290 q4 10 0 16" stroke="#fff" stroke-width="5" stroke-linecap="round"/>
      <rect x="300" y="${-H + 10}" width="34" height="70" fill="#7d2f1f" ${o()}/><g class="smoke"><circle cx="317" cy="${-H}" r="10" fill="#fff" opacity=".6"/><circle cx="326" cy="${-H - 20}" r="13" fill="#fff" opacity=".45"/><circle cx="314" cy="${-H - 44}" r="16" fill="#fff" opacity=".3"/></g>
      <rect x="0" y="-262" width="420" height="262" fill="url(#logs)" ${o()}/>
      ${Array.from({ length: 10 }, (_, i) => `<circle cx="4" cy="${-250 + i * 26}" r="9" fill="#c19a6b" ${o('stroke-width="2"')}/><circle cx="416" cy="${-250 + i * 26}" r="9" fill="#c19a6b" ${o('stroke-width="2"')}/>`).join('')}
      <rect x="64" y="-246" width="292" height="44" rx="6" fill="#c19a6b" ${o()}/>${signText(222, -216, 'TRUE NORTH TRADING POST', 'Rye, Georgia, serif', 17, '#3b2414')}
      ${mapleLeaf(46, -224, 1.1, '#c8102e')}${mapleLeaf(374, -224, 1.1, '#c8102e')}
      ${scallop(20, -194, 380, 22, 'url(#plaid)')}
      ${displayWindow(30, -150, 132, 110, items.slice(0, 2), '#6b4224')}${displayWindow(258, -150, 132, 110, items.slice(2, 4), '#6b4224')}
      ${door(180, -142, 64, 142, '#7a4a28', '<path d="M190 -40 L234 -70 M190 -70 L234 -40" stroke="#5a3418" stroke-width="5"/>')}
      <rect x="250" y="-122" width="8" height="18" fill="#1a1a1a"/><circle cx="254" cy="-96" r="8" fill="#ffd36b" ${o('stroke-width="2"')}/>
      <path d="M-6 0 q20 -18 46 0Z M384 0 q22 -16 44 0Z" fill="#fff" ${o('stroke-width="2"')}/>`;
    return { svg: s, height: H + 44, holes: [[30, -150, 132, 110], [258, -150, 132, 110], [180, -142, 64, 142]], door: [180, -142, 64, 142] };
  },

  'south-america'(items) {
    const H = 400;
    let s = `<rect x="0" y="${-H}" width="420" height="${H}" fill="#2bb3a3" ${o()}/>
      <path d="M-6 ${-H} H426 V${-H + 22} H-6Z" fill="#f4c430" ${o()}/><path d="M150 ${-H} Q210 ${-H - 46} 270 ${-H}Z" fill="#f4c430" ${o()}/><circle cx="210" cy="${-H - 14}" r="9" fill="#e2566a" ${o('stroke-width="2"')}/>
      ${scallop(-6, -H + 22, 432, 10, '#c8562a')}`;
    for (const x of [48, 180, 312]) {
      s += `<path d="M${x} -270 V-330 Q${x + 30} -364 ${x + 60} -330 V-270Z" fill="#1a3a4a" ${o()}/>
        <rect x="${x - 18}" y="-336" width="16" height="66" fill="#1d6b4a" ${o('stroke-width="2"')}/><rect x="${x + 62}" y="-336" width="16" height="66" fill="#1d6b4a" ${o('stroke-width="2"')}/>
        <rect x="${x - 8}" y="-272" width="76" height="8" fill="#f4c430" ${o('stroke-width="2"')}/><path d="M${x - 6} -264 V-240 H${x + 66} V-264 ${Array.from({ length: 7 }, (_, i) => `M${x + i * 12} -264V-240`).join('')}" fill="none" stroke="#1a1a1a" stroke-width="2.5"/>
        <rect x="${x + 8}" y="-288" width="44" height="16" fill="#c8562a" ${o('stroke-width="2"')}/><circle cx="${x + 18}" cy="-294" r="6" fill="#ff5d8f"/><circle cx="${x + 32}" cy="-298" r="6" fill="#ff8fb3"/><circle cx="${x + 44}" cy="-293" r="6" fill="#ff5d8f"/>`;
    }
    s += `<rect x="0" y="-222" width="420" height="26" fill="url(#tiles)" ${o()}/>
      <path d="M14 -190 ${Array.from({ length: 13 }, (_, i) => `L${32 + i * 30} -170 L${46 + i * 30} -190`).join(' ')}" fill="none" stroke="#1a1a1a" stroke-width="1.5"/>
      ${Array.from({ length: 13 }, (_, i) => `<path d="M${18 + i * 30} -190 L${32 + i * 30} -172 L${46 + i * 30} -190Z" fill="${['#e2566a', '#f4c430', '#2a5ea8', '#009739'][i % 4]}" ${o('stroke-width="1.5"')}/>`).join('')}
      <rect x="96" y="-166" width="228" height="38" rx="19" fill="#fdf3dc" ${o()}/>${signText(210, -137, 'Casa Albuquerque', 'Pacifico, cursive', 22, '#c8102e')}
      <path d="M30 -18 V-96 Q95 -150 160 -96 V-18Z" fill="url(#glass)" ${o()}/>${miniArt(items[0], 55, -112, 90)}
      <path d="M262 -18 V-96 Q327 -150 392 -96 V-18Z" fill="url(#glass)" ${o()}/>${items[1] ? miniArt(items[1], 282, -112, 90) : ''}
      <rect x="24" y="-18" width="142" height="8" fill="#f4c430" ${o('stroke-width="2"')}/><rect x="256" y="-18" width="142" height="8" fill="#f4c430" ${o('stroke-width="2"')}/>
      ${door(178, -124, 66, 124, '#c8562a')}
      <path d="M172 -124 Q211 -160 250 -124" fill="none" stroke="#f4c430" stroke-width="8"/>
      <path d="M200 0 l-6 -26 h34 l-6 26Z" fill="#c8562a" ${o('stroke-width="2"')}/>`;
    return { svg: s, height: H + 46, holes: [[30, -140, 130, 122], [262, -140, 130, 122], [178, -124, 66, 124]], door: [178, -124, 66, 124] };
  },

  europe(items) {
    const H = 470;
    let s = `<path d="M18 -390 L44 ${-H} H376 L402 -390Z" fill="url(#zinc)" ${o()}/>
      <rect x="90" y="${-H - 40}" width="26" height="44" fill="#c9a98f" ${o()}/><rect x="300" y="${-H - 40}" width="26" height="44" fill="#c9a98f" ${o()}/>
      ${[110, 210, 310].map((x) => `<path d="M${x - 22} -394 V-440 L${x} -458 L${x + 22} -440 V-394Z" fill="#ebdfc6" ${o()}/><rect x="${x - 13}" y="-436" width="26" height="36" fill="#2e3a5a" ${o('stroke-width="2"')}/>`).join('')}
      <rect x="0" y="-392" width="420" height="392" fill="url(#stone)" ${o()}/><rect x="-6" y="-396" width="432" height="12" fill="#d8cbb0" ${o()}/>`;
    for (const y of [-372, -282])
      for (const x of [56, 180, 304])
        s += `<rect x="${x}" y="${y}" width="60" height="78" fill="#3b4f6b" ${o()}/><path d="M${x + 30} ${y}V${y + 78}M${x} ${y + 30}H${x + 60}" stroke="#f4efe3" stroke-width="3"/>
          <rect x="${x - 8}" y="${y + 66}" width="76" height="14" fill="#5b3a29" ${o('stroke-width="2"')}/>${[8, 22, 36, 50].map((d) => `<circle cx="${x + d}" cy="${y + 64}" r="6" fill="#d6332c" ${o('stroke-width="1.5"')}/>`).join('')}
          <path d="M${x - 6} ${y + 80} v18 h72 v-18 ${[6, 18, 30, 42, 54].map((d) => `M${x + d} ${y + 80}q4 9 0 18`).join('')}" fill="none" stroke="#1a1a1a" stroke-width="2.5"/>`;
    s += `<rect x="8" y="-188" width="404" height="188" fill="#1f3b2f" ${o()}/><rect x="16" y="-182" width="388" height="36" fill="#14281f" stroke="#d4af37" stroke-width="2"/>
      ${signText(210, -155, 'Maison Dubois', "'Playfair Display', Georgia, serif", 27, '#d4af37', 'font-style="italic" font-weight="700"')}
      ${scallop(14, -144, 392, 24, 'url(#stripes)')}
      ${displayWindow(26, -110, 140, 96, items.slice(0, 2), '#d4af37')}${displayWindow(254, -110, 140, 96, items.slice(2, 4), '#d4af37')}
      ${door(178, -126, 64, 126, '#1f3b2f')}
      <path d="M168 -100 v-14 M252 -100 v-14" ${o()}/><path d="M160 -100 h16 l-3 16 h-10Z M244 -100 h16 l-3 16 h-10Z" fill="#ffd36b" ${o('stroke-width="2"')}/>`;
    return { svg: s, height: H + 44, holes: [[26, -110, 140, 96], [254, -110, 140, 96], [178, -126, 64, 126]], door: [178, -126, 64, 126] };
  },

  africa(items) {
    const H = 360;
    let s = `<rect x="300" y="${-H - 56}" width="56" height="56" rx="8" fill="#1a1a1a" ${o()}/><path d="M300 ${-H - 36}h56M300 ${-H - 18}h56" stroke="#333" stroke-width="3"/>
      <path d="M80 ${-H} l14 -30" ${o()}/><ellipse cx="96" cy="${-H - 34}" rx="20" ry="11" transform="rotate(-25 96 ${-H - 34})" fill="#e9e9e9" ${o()}/>
      <rect x="0" y="${-H}" width="420" height="${H}" fill="#d17a3a" ${o()}/>
      <rect x="0" y="${-H}" width="420" height="30" fill="url(#kente)" ${o()}/>
      <rect x="0" y="-322" width="420" height="22" fill="url(#ankara)" ${o('stroke-width="2"')}/>
      ${[60, 290].map((x) => `<rect x="${x}" y="-290" width="70" height="66" fill="#3a2a22" ${o()}/><rect x="${x - 16}" y="-292" width="16" height="70" fill="#2a5ea8" ${o('stroke-width="2"')}/><rect x="${x + 70}" y="-292" width="16" height="70" fill="#2a5ea8" ${o('stroke-width="2"')}/><path d="M${x - 16} -280h16M${x - 16} -266h16M${x - 16} -252h16M${x - 16} -238h16M${x + 70} -280h16M${x + 70} -266h16M${x + 70} -252h16M${x + 70} -238h16" stroke="#1c3f75" stroke-width="2"/>`).join('')}
      <path d="M170 -300 H250 V-226" fill="none" ${o()}/>${['url(#ankara)', 'url(#kente)', '#1d6b4a', '#c0392b'].map((f, i) => `<rect x="${176 + i * 18}" y="-298" width="14" height="${60 - (i % 2) * 12}" fill="${f}" ${o('stroke-width="1.5"')}/>`).join('')}
      <rect x="26" y="-214" width="368" height="56" rx="4" fill="#f4c430" ${o()}/><rect x="32" y="-208" width="356" height="44" fill="none" stroke="#c0392b" stroke-width="2" stroke-dasharray="6 4"/>
      ${signText(210, -186, 'ADAEZE’S ANKARA HOUSE', "'Titan One', Impact, sans-serif", 21, '#c0392b')}${signText(210, -168, 'FABRICS • FASHION • VINTAGE', 'Inter, sans-serif', 10, '#3b2414', 'font-weight="700" letter-spacing="2"')}
      <path d="M10 -154 L410 -154 L420 -128 L0 -128Z" fill="#a9a9b3" ${o()}/>${Array.from({ length: 20 }, (_, i) => `<path d="M${10 + i * 20} -154 L${4 + i * 21} -128" stroke="#8a8a94" stroke-width="2"/>`).join('')}
      ${displayWindow(28, -116, 130, 100, items.slice(0, 1), '#3b2414')}
      ${['url(#ankara)', 'url(#kente)', '#2a5ea8', 'url(#ankara)'].map((f, i) => `<rect x="${266 + i * 34}" y="-120" width="28" height="${110 - (i % 2) * 18}" fill="${f}" ${o('stroke-width="2"')}/>`).join('')}
      <path d="M262 -122 H400" ${o('stroke-width="4"')}/>
      ${door(184, -124, 64, 124, '#1d6b4a')}`;
    return { svg: s, height: H + 56, holes: [[28, -116, 130, 100], [262, -122, 138, 112], [184, -124, 64, 124]], door: [184, -124, 64, 124] };
  },

  asia(items) {
    const H = 420;
    let s = `<rect x="0" y="-336" width="420" height="336" fill="#3a2a22" ${o()}/>${Array.from({ length: 20 }, (_, i) => `<path d="M${10 + i * 21} -336V0" stroke="#2c1f19" stroke-width="2"/>`).join('')}
      <path d="M-34 -330 Q-20 -346 0 -344 H420 Q440 -346 454 -330 Q470 -360 440 -366 L380 ${-H} H40 L-20 -366 Q-50 -360 -34 -330Z" fill="#2f3a4a" ${o()}/>
      ${Array.from({ length: 16 }, (_, i) => `<path d="M${22 + i * 25} -350 V${-H + 6}" stroke="#202833" stroke-width="3"/>`).join('')}<rect x="40" y="${-H - 10}" width="340" height="12" rx="6" fill="#202833" ${o()}/>
      <rect x="80" y="-312" width="290" height="88" fill="url(#shoji)" ${o()}/>
      <rect x="16" y="-310" width="44" height="236" fill="#f1e4c3" ${o()}/>${'WATANABE'.split('').map((c, i) => signText(38, -284 + i * 27, c, 'Shojumaru, Impact, serif', 20, '#2b1a14')).join('')}
      <rect x="84" y="-212" width="288" height="38" fill="#141010" stroke="#d4af37" stroke-width="3"/>${signText(228, -186, 'WATANABE SHŌTEN', 'Shojumaru, Impact, serif', 20, '#d4af37')}
      <path d="M70 -170 H390 L404 -152 H56Z" fill="#2f3a4a" ${o()}/>
      ${lantern(110, -126, 0)}${lantern(350, -126, 0.6)}
      ${displayWindow(76, -108, 96, 92, items.slice(0, 1), '#141010', 'url(#shoji)')}
      <text x="316" y="-60" text-anchor="middle" font-size="44" font-weight="900" fill="#ff4fa3" class="neon" font-family="'Hiragino Sans','Noto Sans JP','Yu Gothic',sans-serif">古着</text>
      ${door(194, -136, 70, 136, '#5a3a24')}
      <g class="noren">${[0, 1, 2].map((i) => `<rect x="${190 + i * 26}" y="-138" width="24" height="58" fill="#23356b" ${o('stroke-width="2"')}/>`).join('')}<circle cx="229" cy="-112" r="11" fill="none" stroke="#f4f4f4" stroke-width="4"/></g>`;
    return { svg: s, height: H + 14, holes: [[76, -108, 96, 92], [270, -116, 96, 92], [194, -136, 70, 136]], door: [194, -136, 70, 136] };
  },

  oceania(items) {
    const H = 340;
    let s = `<rect x="0" y="-300" width="420" height="300" fill="url(#tin)" ${o()}/>
      <path d="M-14 -296 L434 ${-H} L434 ${-H + 16} L-14 -282Z" fill="#e9e9e9" ${o()}/>
      <rect x="22" y="-282" width="376" height="66" rx="10" fill="#fffaf0" stroke="#0b6e8f" stroke-width="5"/>
      <circle cx="58" cy="-249" r="18" fill="#f4c430" ${o('stroke-width="2"')}/>${Array.from({ length: 8 }, (_, i) => { const a = (i * Math.PI) / 4; return `<path d="M${58 + Math.cos(a) * 22} ${-249 + Math.sin(a) * 22} l${Math.cos(a) * 7} ${Math.sin(a) * 7}" stroke="#f4c430" stroke-width="3"/>`; }).join('')}
      ${signText(228, -238, 'BONDI BOARD & THREAD', "'Lilita One', Impact, sans-serif", 26, '#0b6e8f')}
      <path d="M30 -200 h360" stroke="#0b6e8f" stroke-width="6"/>
      ${displayWindow(28, -170, 138, 112, items.slice(0, 2), '#0b6e8f', 'url(#glassCool)')}
      ${door(186, -150, 66, 150, '#f4c430', '<path d="M196 -126 h46 M196 -112 h46 M196 -98 h46" stroke="#c99a1c" stroke-width="2"/>')}
      ${[['#ff6b6b', 280, -8], ['#4ecdc4', 312, 6], ['#f4c430', 344, -4]].map(([c, x, r]) => `<g transform="translate(${x} -2) rotate(${r})"><ellipse cx="0" cy="-86" rx="17" ry="86" fill="${c}" ${o()}/><path d="M0 -170 V-2" stroke="#fff" stroke-width="4"/></g>`).join('')}
      <rect x="370" y="-120" width="44" height="26" fill="#fffaf0" ${o('stroke-width="2"')}/>${signText(392, -103, 'NO WORRIES', 'Inter, sans-serif', 7, '#0b6e8f', 'font-weight="800"')}
      <g transform="translate(404 0)"><path d="M0 0 Q-8 -70 4 -150" fill="none" stroke="#8a5a33" stroke-width="10"/><path d="M4 -150 q-40 -10 -60 18 M4 -150 q40 -14 62 12 M4 -150 q-20 -30 -46 -26 M4 -150 q24 -28 48 -20" fill="none" stroke="#2e8b57" stroke-width="9" stroke-linecap="round"/></g>`;
    return { svg: s, height: H + 6, holes: [[28, -170, 138, 112], [186, -150, 66, 150]], door: [186, -150, 66, 150] };
  },

  antarctica() {
    const H = 380;
    const s = `<path d="M20 -330 Q210 ${-H - 60} 400 -330Z" fill="#eaf7fc" ${o()}/>
      <rect x="0" y="-332" width="420" height="332" fill="url(#ice)" ${o()}/>
      <rect x="60" y="-300" width="300" height="46" rx="6" fill="#fff" ${o()}/>${signText(210, -268, 'POLAR OUTFITTERS', 'Bungee, Anton, sans-serif', 22, '#2a6f97')}
      <rect x="30" y="-210" width="130" height="120" fill="url(#glassCool)" ${o()}/><rect x="260" y="-210" width="130" height="120" fill="url(#glassCool)" ${o()}/>
      ${door(180, -150, 66, 150, '#7bb7c9')}`;
    return { svg: s, height: H + 60, holes: [[30, -210, 130, 120], [260, -210, 130, 120], [180, -150, 66, 150]], door: [180, -150, 66, 150] };
  },
};

// Boards, scaffolding and tape for any region with no stock
function construction(f, store) {
  const top = -f.height + 30;
  let s = `<g class="construction" opacity=".95">`;
  for (const [x, y, w, h] of f.holes) s += `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="url(#plywood)" ${o()}/><path d="M${x + 6} ${y + 6} L${x + w - 6} ${y + h - 6}" stroke="#b98d55" stroke-width="3"/>`;
  s += `<g stroke="#7d828c" stroke-width="6">${[8, 140, 280, 412].map((x) => `<path d="M${x} 0 V${top}"/>`).join('')}${[-90, -190, -290].filter((y) => y > top).map((y) => `<path d="M8 ${y} H412"/>`).join('')}</g>
    <g stroke="#5c616b" stroke-width="3">${[-90, -190].map((y) => `<path d="M8 ${y} L140 ${y - 100} M280 ${y} L412 ${y - 100}"/>`).join('')}</g>
    ${[-90, -190].map((y) => `<rect x="0" y="${y - 6}" width="420" height="10" fill="#c98d4e" ${o('stroke-width="2"')}/>`).join('')}`;
  const [dx, dy, dw, dh] = f.door;
  s += `<g transform="translate(${dx + dw / 2} ${dy + dh / 2})"><rect x="-60" y="-9" width="120" height="18" fill="#f6c42b" transform="rotate(28)" ${o('stroke-width="2"')}/><rect x="-60" y="-9" width="120" height="18" fill="#f6c42b" transform="rotate(-28)" ${o('stroke-width="2"')}/>
    <text transform="rotate(-28)" y="4" text-anchor="middle" font-family="Anton, Impact, sans-serif" font-size="11" fill="${INK}" letter-spacing="2">CAUTION</text></g>
    <g transform="translate(210 -196) rotate(45)"><rect x="-34" y="-34" width="68" height="68" fill="#f6a12b" ${o()}/></g>
    ${signText(210, -200, 'UNDER', 'Anton, Impact, sans-serif', 15, INK)}${signText(210, -184, 'CONSTRUCTION', 'Anton, Impact, sans-serif', 10, INK)}
    <rect x="96" y="-138" width="228" height="26" fill="#fff" ${o('stroke-width="2"')}/>${signText(210, -120, `No ${store.region} stock yet`, 'Inter, sans-serif', 12, INK, 'font-weight="800"')}
    ${[40, 380].map((x) => `<g transform="translate(${x} 0)"><path d="M-14 0 L-4 -40 H4 L14 0Z" fill="#ff7a1a" ${o()}/><path d="M-9 -18 H9" stroke="#fff" stroke-width="5"/><rect x="-18" y="-4" width="36" height="6" fill="#ff7a1a" ${o('stroke-width="2"')}/></g>`).join('')}
    </g>`;
  return s;
}

export function storefront(store, items, open, x) {
  const f = FACADES[store.id](items);
  const [dx, dy, dw, dh] = f.door;
  const tagY = -f.height - 30;
  return {
    door: { x: x + dx + dw / 2, y: dy + dh / 2 },
    svg: `<g class="store${open ? '' : ' closed'}" data-store="${store.id}" transform="translate(${x} ${GROUND})" tabindex="0" role="button" aria-label="${esc(store.name)}${open ? '' : ' (under construction)'}">
      <g class="facade">${f.svg}</g>
      ${open ? '' : construction(f, store)}
      ${store.id === 'antarctica' ? `<g transform="translate(330 -2) scale(.9)">${penguin()}</g>` : ''}
      <g class="store-tag" transform="translate(210 ${Math.max(tagY, -500)})"><rect x="-110" y="-20" width="220" height="34" rx="17" fill="${open ? '#fffaf0' : '#f6c42b'}" ${o()}/>
        <text y="3" text-anchor="middle" font-family="Inter, sans-serif" font-size="13" font-weight="800" fill="${INK}">${esc(store.region.toUpperCase())}${open ? ' · ENTER ›' : ' · CLOSED'}</text></g>
    </g>`,
  };
}

// ---------- Nucci's Corner ----------
export function alley(x) {
  const W = ALLEY_W;
  return `<g class="alley" data-store="nucci" transform="translate(${x} ${GROUND})" tabindex="0" role="button" aria-label="Nucci's Corner, VIP only">
    <rect x="34" y="-340" width="${W - 68}" height="290" fill="url(#brickDark)"/>
    <rect x="34" y="-340" width="${W - 68}" height="290" fill="url(#alleyDark)" opacity=".55"/>
    <path d="M0 -400 L34 -340 V-50 L0 0Z" fill="url(#brickDark)" ${o()}/><path d="M0 -400 L34 -340 V-50 L0 0Z" fill="#000" opacity=".35"/>
    <path d="M${W} -460 L${W - 34} -340 V-50 L${W} 0Z" fill="url(#brickDark)" ${o()}/><path d="M${W} -460 L${W - 34} -340 V-50 L${W} 0Z" fill="#000" opacity=".45"/>
    <path d="M0 0 L34 -50 H${W - 34} L${W} 0Z" fill="#3b3036" ${o()}/>
    <ellipse cx="${W / 2 - 40}" cy="-14" rx="44" ry="7" fill="#6a6f9a" opacity=".7"/>
    <text x="${W / 2}" y="-268" text-anchor="middle" font-family="'Permanent Marker', cursive" font-size="34" fill="#b04bd8" transform="rotate(-4 ${W / 2} -268)">NUCCI’S</text>
    <text x="${W / 2 + 6}" y="-232" text-anchor="middle" font-family="'Permanent Marker', cursive" font-size="28" fill="#e8c14a" transform="rotate(-4 ${W / 2} -232)">CORNER</text>
    <path d="M${W / 2 - 50} -262 v14 M${W / 2 + 10} -258 v20 M${W / 2 + 46} -264 v10" stroke="#b04bd8" stroke-width="3" stroke-linecap="round"/>
    <path d="M${W / 2 + 64} -300 l8 -14 l8 10 l8 -10 l8 14Z" fill="#e8c14a" ${o('stroke-width="2"')}/>
    <path d="M${W / 2} -340 V-210" stroke="#1a1a1a" stroke-width="2"/><path d="M${W / 2 - 70} 0 L${W / 2 - 8} -206 H${W / 2 + 8} L${W / 2 + 70} 0Z" fill="url(#bulb)" class="flicker"/>
    <circle cx="${W / 2}" cy="-204" r="8" fill="#ffe9a0" ${o('stroke-width="2"')} class="flicker"/>
    <g transform="translate(36 -14)"><rect x="0" y="-60" width="84" height="56" fill="#2e6b4a" ${o()}/><path d="M-4 -60 L88 -60 L80 -74 L4 -74Z" fill="#245a3d" ${o()}/><path d="M10 -40 h64" stroke="#1d4a32" stroke-width="3"/></g>
    <path d="M128 -6 q-14 -30 8 -34 q22 -4 18 34Z" fill="#1a1a1a" ${o('stroke-width="2"')}/>
    <ellipse cx="${W - 70}" cy="-20" rx="26" ry="6" fill="#2a2a2a" ${o('stroke-width="2"')}/>
    <g class="steam"><circle cx="${W - 70}" cy="-34" r="10" fill="#fff" opacity=".35"/><circle cx="${W - 64}" cy="-58" r="14" fill="#fff" opacity=".25"/><circle cx="${W - 74}" cy="-86" r="18" fill="#fff" opacity=".15"/></g>
    <g transform="translate(-10 -420)"><path d="M0 0 H70" ${o('stroke-width="4"')}/><rect x="30" y="6" width="140" height="44" rx="8" fill="#1a0f1e" ${o()}/>
      <text x="100" y="35" text-anchor="middle" font-family="'Permanent Marker', cursive" font-size="17" fill="#ff4fd8" class="neon">NUCCI’S ➜</text></g>
    ${[24, W - 24].map((px) => `<g transform="translate(${px} 0)"><rect x="-4" y="-56" width="8" height="56" fill="#d4af37" ${o('stroke-width="2"')}/><circle cx="0" cy="-58" r="7" fill="#d4af37" ${o('stroke-width="2"')}/></g>`).join('')}
    <g class="nucci-wrap" transform="translate(${W / 2 + 22} -8) scale(.82)">${nucci()}</g>
    <path d="M24 -46 Q${W / 2} -8 ${W - 24} -46" fill="none" stroke="#8e1d3a" stroke-width="7" stroke-linecap="round"/>
    <g class="store-tag" transform="translate(${W / 2} -520)"><rect x="-104" y="-20" width="208" height="34" rx="17" fill="#1a0f1e" stroke="#d4af37" stroke-width="3"/>
      <text y="3" text-anchor="middle" font-family="Inter, sans-serif" font-size="13" font-weight="800" fill="#e8c14a">NUCCI’S CORNER · VIP</text></g>
    <g class="psst" transform="translate(${W / 2 - 60} -210)"><rect x="-70" y="-30" width="140" height="40" rx="14" fill="#fffaf0" ${o()}/><path d="M30 10 l16 18 l-2 -18Z" fill="#fffaf0" ${o()}/>
      <text y="-5" text-anchor="middle" font-family="Inter, sans-serif" font-size="12" font-weight="700" fill="${INK}">Psst… you on the list?</text></g>
  </g>`;
}

// ---------- Street furniture & vehicles ----------
export function lampPost(x) {
  return `<g transform="translate(${x} ${CURB})"><rect x="-5" y="-250" width="10" height="250" fill="#1f3b2f" ${o()}/><rect x="-12" y="-14" width="24" height="14" fill="#1f3b2f" ${o()}/>
    <path d="M-16 -250 h32 l-6 -26 h-20Z" fill="#ffe9a0" ${o()}/><path d="M-20 -276 h40 l-20 -14Z" fill="#1f3b2f" ${o()}/>
    <circle cx="0" cy="-262" r="40" fill="url(#sunGlow)" opacity=".55"/></g>`;
}
export function hydrant(x) {
  return `<g transform="translate(${x} ${CURB})"><rect x="-12" y="-44" width="24" height="40" rx="6" fill="#d6332c" ${o()}/><path d="M-12 -44 q12 -16 24 0Z" fill="#d6332c" ${o()}/><rect x="-20" y="-32" width="40" height="9" rx="4" fill="#b02620" ${o('stroke-width="2"')}/><rect x="-16" y="-6" width="32" height="6" fill="#b02620" ${o('stroke-width="2"')}/></g>`;
}
export function trashCan(x) {
  return `<g transform="translate(${x} ${CURB})"><path d="M-18 -56 H18 L14 0 H-14Z" fill="#3d5a4a" ${o()}/><path d="M-10 -50 V-6 M0 -50 V-6 M10 -50 V-6" stroke="#2b4236" stroke-width="2"/><rect x="-21" y="-62" width="42" height="8" rx="3" fill="#2b4236" ${o()}/></g>`;
}
export function cornerBuilding(x, flip) {
  return `<g transform="translate(${x} ${GROUND})"><rect x="0" y="-360" width="340" height="360" fill="url(#brick)" ${o()}/>
    ${[40, 120, 200, 270].map((wx) => [-320, -240, -160].map((wy) => `<rect x="${wx}" y="${wy}" width="44" height="56" fill="${(wx + wy) % 7 ? '#2e3a5a' : '#ffd36b'}" ${o()}/>`).join('')).join('')}
    <rect x="10" y="-80" width="320" height="80" fill="#3b2f3a" ${o()}/><path d="M10 -80 H330" stroke="#d6332c" stroke-width="8"/>
    <g transform="translate(${flip ? 80 : 5} -470)"><rect x="0" y="0" width="${flip ? 180 : 330}" height="96" fill="#fffaf0" ${o()}/>
      ${flip ? signText(90, 42, 'SMOKE ST', 'Bungee, sans-serif', 22, INK) + signText(90, 70, 'END OF BLOCK', 'Inter, sans-serif', 11, INK, 'font-weight="800" letter-spacing="2"') : signText(165, 48, 'SMOKE THE CRACK', 'Anton, Impact, sans-serif', 40, '#d6332c') + signText(165, 78, 'GLOBAL RESELL · ONE BLOCK · EVERY CONTINENT', 'Inter, sans-serif', 9.5, INK, 'font-weight="800" letter-spacing="0.6"')}
      <path d="M40 96 V110 M${flip ? 140 : 290} 96 V110" ${o('stroke-width="5"')}/></g></g>`;
}

export function car(color, r) {
  const wheel = (cx) => `<g transform="translate(${cx} -24)"><g class="wheel"><circle r="22" fill="#2a2a2a" ${o()}/><circle r="11" fill="#bfc3c9" ${o('stroke-width="2"')}/><path d="M0 -11 V11 M-11 0 H11" stroke="#8a8f99" stroke-width="2"/></g></g>`;
  const bodyType = r() > 0.5;
  const body = bodyType
    ? `<path d="M-120 -30 Q-122 -66 -96 -70 L-60 -72 Q-36 -112 10 -112 Q52 -112 76 -72 L108 -66 Q124 -62 122 -30Z" fill="${color}" ${o()}/>
       <path d="M-48 -74 Q-30 -102 2 -102 V-74Z M12 -102 Q46 -102 64 -74 H12Z" fill="#bfe8ef" ${o('stroke-width="2"')}/>`
    : `<path d="M-130 -30 V-92 Q-128 -110 -104 -110 H70 Q96 -110 112 -76 L128 -64 Q134 -58 132 -30Z" fill="${color}" ${o()}/>
       <path d="M-112 -100 H-40 V-72 H-112Z M-30 -100 H40 V-72 H-30Z M50 -100 H72 Q88 -100 98 -72 H50Z" fill="#bfe8ef" ${o('stroke-width="2"')}/>`;
  return `<g class="car-body">${body}<rect x="-128" y="-40" width="18" height="10" fill="#ffd36b" ${o('stroke-width="2"')}/><rect x="112" y="-42" width="12" height="10" fill="#d6332c" ${o('stroke-width="2"')}/>${wheel(-76)}${wheel(76)}</g>`;
}

// Distant skyline silhouette (parallax layer)
export function skyline(width) {
  const r = rng(42);
  let s = '';
  let x = -100;
  while (x < width) {
    const w = 80 + r() * 120;
    const h = 160 + r() * 260;
    const c = ['#7a3f6a', '#6a3560', '#874a70'][Math.floor(r() * 3)];
    s += `<rect x="${x}" y="${GROUND - h}" width="${w}" height="${h}" fill="${c}"/>`;
    for (let wy = GROUND - h + 16; wy < GROUND - 20; wy += 26)
      for (let wx = x + 10; wx < x + w - 14; wx += 22) if (r() > 0.72) s += `<rect x="${wx}" y="${wy}" width="9" height="12" fill="#ffd36b" opacity=".75"/>`;
    if (r() > 0.75) s += `<g transform="translate(${x + w / 2} ${GROUND - h})"><rect x="-14" y="-34" width="28" height="28" fill="${c}"/><path d="M-16 -34 L0 -48 L16 -34Z M-10 -6 V0 M10 -6 V0" fill="${c}" stroke="${c}" stroke-width="3"/></g>`;
    x += w + 6 + r() * 30;
  }
  return s;
}
