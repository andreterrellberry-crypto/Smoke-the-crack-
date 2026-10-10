// Top-down view of the block for the opening shot. Same x layout as the street so the drop lands in the right spot.
import { INK, o, esc, rng } from './style.js';

export const AERIAL_H = 1200;
const ROW_TOP = 300;
const ROW_BOTTOM = 600; // building front edge = sidewalk

const ROOFS = {
  'north-america': (x, w) => `<rect x="${x}" y="${ROW_TOP}" width="${w}" height="300" fill="#a8452f" ${o()}/><rect x="${x + 12}" y="${ROW_TOP + 12}" width="${w - 24}" height="276" fill="#4a4a52"/>
    <circle cx="${x + w * 0.7}" cy="${ROW_TOP + 90}" r="46" fill="#8a5a33" ${o()}/><circle cx="${x + w * 0.7}" cy="${ROW_TOP + 90}" r="30" fill="#6b4224" ${o('stroke-width="2"')}/>
    ${[0, 1, 2].map((i) => `<rect x="${x + 40 + i * 70}" y="${ROW_TOP + 190}" width="50" height="50" fill="#9aa0a8" ${o('stroke-width="2"')}/><circle cx="${x + 65 + i * 70}" cy="${ROW_TOP + 215}" r="16" fill="#6a7078"/>`).join('')}`,
  canada: (x, w) => `<rect x="${x}" y="${ROW_TOP}" width="${w}" height="150" fill="#4d6b47" ${o()}/><rect x="${x}" y="${ROW_TOP + 150}" width="${w}" height="150" fill="#3f5a3a" ${o()}/>
    <path d="M${x} ${ROW_TOP + 150} H${x + w}" stroke="#fff" stroke-width="14"/>${[0.2, 0.5, 0.8].map((f) => `<ellipse cx="${x + w * f}" cy="${ROW_TOP + 80}" rx="40" ry="22" fill="#fff" opacity=".85"/>`).join('')}
    <rect x="${x + w * 0.7}" y="${ROW_TOP + 120}" width="34" height="34" fill="#7d2f1f" ${o()}/>`,
  'south-america': (x, w) => `<rect x="${x}" y="${ROW_TOP}" width="${w}" height="300" fill="#c8562a" ${o()}/>${Array.from({ length: 14 }, (_, i) => `<path d="M${x} ${ROW_TOP + 20 + i * 20} ${Array.from({ length: Math.ceil(w / 20) }, (_, j) => `q10 8 20 0`).join(' ')}" fill="none" stroke="#9e3f1c" stroke-width="3"/>`).join('')}
    <rect x="${x + w * 0.35}" y="${ROW_TOP + 100}" width="${w * 0.3}" height="100" fill="#2bb3a3" ${o()}/><circle cx="${x + w / 2}" cy="${ROW_TOP + 150}" r="26" fill="#2e8b57" ${o('stroke-width="2"')}/>`,
  europe: (x, w) => `<rect x="${x}" y="${ROW_TOP}" width="${w}" height="300" fill="url(#zinc)" ${o()}/><rect x="${x + 30}" y="${ROW_TOP + 30}" width="${w - 60}" height="240" fill="#6f7f8e" ${o('stroke-width="2"')}/>
    ${[0.25, 0.75].map((f) => `<rect x="${x + w * f - 14}" y="${ROW_TOP + 120}" width="28" height="60" fill="#c9a98f" ${o()}/>`).join('')}${[0.2, 0.5, 0.8].map((f) => `<rect x="${x + w * f - 18}" y="${ROW_TOP + 250}" width="36" height="34" fill="#ebdfc6" ${o('stroke-width="2"')}/>`).join('')}`,
  africa: (x, w) => `<rect x="${x}" y="${ROW_TOP}" width="${w}" height="300" fill="#d9a066" ${o()}/><circle cx="${x + w * 0.75}" cy="${ROW_TOP + 80}" r="36" fill="#1a1a1a" ${o()}/>
    <ellipse cx="${x + w * 0.25}" cy="${ROW_TOP + 70}" rx="30" ry="20" fill="#e9e9e9" ${o()}/><path d="M${x + 30} ${ROW_TOP + 200} H${x + w - 30}" ${o('stroke-width="2"')}/>
    ${[0, 1, 2, 3, 4].map((i) => `<rect x="${x + 50 + i * 62}" y="${ROW_TOP + 200}" width="40" height="34" fill="${['url(#ankara)', 'url(#kente)', '#2a5ea8', '#c0392b', 'url(#ankara)'][i]}" ${o('stroke-width="2"')}/>`).join('')}`,
  asia: (x, w) => `<rect x="${x - 10}" y="${ROW_TOP - 10}" width="${w + 20}" height="320" fill="#2f3a4a" ${o()}/>${Array.from({ length: Math.floor(w / 20) }, (_, i) => `<path d="M${x + i * 20} ${ROW_TOP} V${ROW_TOP + 300}" stroke="#202833" stroke-width="3"/>`).join('')}
    <path d="M${x - 10} ${ROW_TOP + 150} H${x + w + 10}" stroke="#141a22" stroke-width="16"/>`,
  oceania: (x, w) => `<rect x="${x}" y="${ROW_TOP}" width="${w}" height="300" fill="url(#tin)" ${o()}/>
    ${[0, 1, 2].map((i) => `<rect x="${x + 40 + i * 120}" y="${ROW_TOP + 60}" width="100" height="70" fill="#1c2f5e" ${o()}/><path d="M${x + 73 + i * 120} ${ROW_TOP + 60}v70M${x + 106 + i * 120} ${ROW_TOP + 60}v70M${x + 40 + i * 120} ${ROW_TOP + 95}h100" stroke="#4a6fb0" stroke-width="2"/>`).join('')}`,
  antarctica: (x, w) => `<rect x="${x}" y="${ROW_TOP}" width="${w}" height="300" fill="#8a6a4a" ${o()}/><rect x="${x + 16}" y="${ROW_TOP + 16}" width="${w - 32}" height="268" fill="none" stroke="#7d828c" stroke-width="8" stroke-dasharray="20 10"/>
    <path d="M${x + 60} ${ROW_TOP + 240} L${x + w - 40} ${ROW_TOP + 60}" stroke="#f6c42b" stroke-width="16"/><rect x="${x + 40}" y="${ROW_TOP + 220}" width="40" height="40" fill="#f6c42b" ${o()}/>
    ${[0, 1, 2].map((i) => `<circle cx="${x + 120 + i * 60}" cy="${ROW_TOP + 200}" r="9" fill="#f6c42b" ${o('stroke-width="2"')}/>`).join('')}`,
};

export function aerialSVG(layout, width, stores) {
  const r = rng(9);
  let s = `<rect x="-400" y="-1600" width="${width + 800}" height="${AERIAL_H + 3200}" fill="#5a5258"/>`;
  // surrounding city blocks so tall phone screens never see an empty edge
  for (const [y0, y1] of [[-1600, 0], [AERIAL_H, AERIAL_H + 1600]])
    for (let y = y0 + 30; y < y1; y += 250)
      for (let x = -400; x < width + 400; x += 190)
        s += `<rect x="${x}" y="${y}" width="176" height="210" fill="${['#9a6a5a', '#7d5a6a', '#a8846a', '#6f9a52'][Math.floor(r() * 4)]}" ${o()}/>`;
  s += `<rect x="-400" y="0" width="${width + 800}" height="${AERIAL_H}" fill="#7a8a5a"/>`;
  // back block
  for (let x = -400; x < width + 400; x += 180) s += `<rect x="${x}" y="40" width="170" height="220" fill="${['#9a6a5a', '#7d5a6a', '#a8846a'][Math.floor(r() * 3)]}" ${o()}/><rect x="${x + 20}" y="70" width="40" height="40" fill="#5c5f68" ${o('stroke-width="2"')}/>`;
  s += `<rect x="-400" y="262" width="${width + 800}" height="38" fill="#5a5258"/>`;
  for (const seg of layout) {
    if (seg.kind === 'store') {
      s += ROOFS[seg.id](seg.x, seg.w);
      const st = stores[seg.id];
      s += `<g transform="translate(${seg.x + seg.w / 2} ${ROW_TOP + 150})"><rect x="-110" y="-20" width="220" height="40" rx="20" fill="#fffaf0" ${o()}/><text y="6" text-anchor="middle" font-family="Inter, sans-serif" font-weight="800" font-size="16" fill="${INK}">${esc(st.region)}</text></g>`;
    } else if (seg.kind === 'alley') {
      s += `<rect x="${seg.x}" y="${ROW_TOP}" width="${seg.w}" height="300" fill="#2a2228" ${o()}/><rect x="${seg.x + 20}" y="${ROW_TOP + 200}" width="70" height="44" fill="#2e6b4a" ${o()}/>
        <circle cx="${seg.x + seg.w / 2 + 20}" cy="${ROW_TOP + 262}" r="18" fill="#3a2f28" ${o()}/><circle cx="${seg.x + seg.w / 2 + 20}" cy="${ROW_TOP + 262}" r="9" fill="#2a221d"/>
        <g transform="translate(${seg.x + seg.w / 2} ${ROW_TOP + 150})"><rect x="-80" y="-20" width="160" height="40" rx="20" fill="#1a0f1e" stroke="#d4af37" stroke-width="3"/><text y="6" text-anchor="middle" font-family="'Permanent Marker', cursive" font-size="17" fill="#e8c14a">Nucci’s</text></g>`;
    } else s += `<rect x="${seg.x}" y="${ROW_TOP}" width="${seg.w}" height="300" fill="#a8452f" ${o()}/><rect x="${seg.x + 14}" y="${ROW_TOP + 14}" width="${seg.w - 28}" height="272" fill="#55525c"/>`;
  }
  // sidewalks + road
  s += `<rect x="-400" y="${ROW_BOTTOM}" width="${width + 800}" height="60" fill="#c9a98f" ${o()}/>
    <rect x="-400" y="660" width="${width + 800}" height="160" fill="#4a4048"/>
    ${Array.from({ length: Math.ceil((width + 800) / 140) }, (_, i) => `<rect x="${-400 + i * 140}" y="736" width="80" height="10" fill="#f4c430"/>`).join('')}
    <rect x="-400" y="820" width="${width + 800}" height="60" fill="#c9a98f" ${o()}/>
    <rect x="-400" y="880" width="${width + 800}" height="320" fill="#6f9a52"/>`;
  for (let x = -380; x < width + 400; x += 90 + r() * 80) s += `<circle cx="${x}" cy="${930 + r() * 220}" r="${30 + r() * 26}" fill="${r() > 0.5 ? '#3f7a3a' : '#4f8c3f'}" ${o()}/>`;
  for (let x = -300; x < width + 300; x += 520) s += `<path d="M${x} 1000 C${x + 120} 960 ${x + 260} 1060 ${x + 400} 1010" fill="none" stroke="#d9c49a" stroke-width="22" stroke-linecap="round"/>`;
  // traffic + people (SMIL, zero JS cost)
  const mover = (y, dur, delay, body, reverse) =>
    `<g><animateTransform attributeName="transform" type="translate" from="${reverse ? width + 300 : -300} ${y}" to="${reverse ? -300 : width + 300} ${y}" dur="${dur}s" begin="-${delay}s" repeatCount="indefinite"/>${body}</g>`;
  const carTop = (c) => `<rect x="-46" y="-22" width="92" height="44" rx="12" fill="${c}" ${o()}/><rect x="-16" y="-17" width="34" height="34" rx="6" fill="#bfe8ef" ${o('stroke-width="2"')}/>`;
  const dot = (c) => `<circle r="9" fill="${c}" ${o('stroke-width="2"')}/><circle r="5" fill="#eab68f"/>`;
  const colors = ['#d6332c', '#2e6b4a', '#f4c430', '#2a5ea8', '#e9e9e9'];
  for (let i = 0; i < 4; i++) s += mover(i % 2 ? 700 : 778, 16 + i * 3, i * 5, carTop(colors[i]), i % 2 === 1);
  for (let i = 0; i < 10; i++) s += mover(i % 2 ? 618 + (i % 3) * 12 : 840 + (i % 3) * 10, 50 + i * 7, i * 9, dot(colors[i % 5]), i % 3 === 0);
  return s;
}
