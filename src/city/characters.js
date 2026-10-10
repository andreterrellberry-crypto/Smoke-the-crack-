// Parametric cartoon people: flat colour, thick ink outline, bug eyes. Origin = between the feet, facing the viewer.
import { INK, o, SKIN, HAIR } from './style.js';

const line = (d, color, w) =>
  `<path d="${d}" fill="none" stroke="${INK}" stroke-width="${w + 4}" stroke-linecap="round" stroke-linejoin="round"/><path d="${d}" fill="none" stroke="${color}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`;

function hairBack(h) {
  if (!h) return '';
  const c = h.color;
  if (h.style === 'afro') return `<circle cx="0" cy="-176" r="27" fill="${c}" ${o()}/>`;
  if (h.style === 'long') return `<path d="M-21 -172 Q-26 -196 0 -196 Q26 -196 21 -172 L25 -128 Q0 -120 -25 -128Z" fill="${c}" ${o()}/>`;
  if (h.style === 'curly')
    return `<path d="M-22 -175 Q-30 -200 0 -199 Q30 -200 22 -175 Q32 -160 26 -146 Q32 -134 22 -124 Q0 -118 -22 -124 Q-32 -134 -26 -146 Q-32 -160 -22 -175Z" fill="${c}" ${o()}/>`;
  if (h.style === 'locs')
    return `<g>${[-18, -11, -4, 4, 11, 18].map((x) => line(`M${x} -180 L${x * 1.25} -132`, c, 5)).join('')}</g>`;
  return '';
}

function hairFront(h) {
  if (!h) return '';
  const c = h.color;
  switch (h.style) {
    case 'short':
    case 'locs':
      return `<path d="M-17 -170 Q-19 -193 0 -192 Q19 -193 17 -170 Q12 -183 0 -182 Q-12 -183 -17 -170Z" fill="${c}" ${o()}/>`;
    case 'fade':
      return `<path d="M-16 -174 Q-16 -191 0 -190 Q16 -191 16 -174 Q10 -184 0 -183 Q-10 -184 -16 -174Z" fill="${c}" ${o('stroke-width="2"')}/>`;
    case 'shaggy':
      return `<path d="M-19 -164 Q-22 -196 0 -195 Q22 -196 19 -164 L14 -176 L9 -168 L4 -178 L-2 -168 L-7 -178 L-12 -168 Z" fill="${c}" ${o()}/>`;
    case 'long':
    case 'curly':
      return `<path d="M-18 -168 Q-17 -194 0 -193 Q17 -194 18 -168 Q8 -186 -6 -180 Q-12 -178 -18 -168Z" fill="${c}" ${o()}/>`;
    case 'bun':
      return `<circle cx="0" cy="-197" r="9" fill="${c}" ${o()}/><path d="M-17 -170 Q-19 -193 0 -192 Q19 -193 17 -170 Q12 -183 0 -182 Q-12 -183 -17 -170Z" fill="${c}" ${o()}/>`;
    case 'slick':
      return `<path d="M-17 -172 Q-17 -193 2 -192 Q19 -190 17 -172 Q8 -186 -17 -172Z" fill="${c}" ${o()}/>`;
    default:
      return '';
  }
}

function hat(t, fx) {
  if (!t) return '';
  const c = t.color;
  const a = t.accent || INK;
  switch (t.type) {
    case 'cap':
      return `<path d="M-18 -176 Q-18 -198 0 -198 Q18 -198 18 -176Z" fill="${c}" ${o()}/><path d="M${t.back ? -30 : -2} -177 H${t.back ? 2 : 30} Q${t.back ? -32 : 32} -172 ${t.back ? -26 : 26} -171 H-2Z" fill="${c}" ${o()}/><circle cx="0" cy="-198" r="2.5" fill="${a}"/>`;
    case 'beanie':
      return `<path d="M-18 -176 Q-18 -201 0 -201 Q18 -201 18 -176Z" fill="${c}" ${o()}/><rect x="-19" y="-182" width="38" height="9" rx="3" fill="${a}" ${o()}/><circle cx="0" cy="-204" r="6" fill="${a}" ${o()}/>`;
    case 'beret':
      return `<ellipse cx="4" cy="-190" rx="22" ry="8" transform="rotate(-8 4 -190)" fill="${c}" ${o()}/><path d="M3 -198 v-5" ${o()}/>`;
    case 'bucket':
      return `<path d="M-15 -182 Q-14 -200 0 -200 Q14 -200 15 -182Z" fill="${c}" ${o()}/><path d="M-26 -174 L-16 -184 H16 L26 -174 Q0 -170 -26 -174Z" fill="${c}" ${o()}/>`;
    case 'fedora':
      return `<path d="M-15 -184 Q-16 -204 -6 -206 Q0 -200 6 -206 Q16 -204 15 -184Z" fill="${c}" ${o()}/><rect x="-15" y="-190" width="30" height="6" fill="${a}"/><ellipse cx="0" cy="-183" rx="30" ry="6" fill="${c}" ${o()}/>`;
    case 'akubra':
      return `<path d="M-15 -184 Q-15 -206 0 -207 Q15 -206 15 -184Z" fill="${c}" ${o()}/><rect x="-15" y="-190" width="30" height="5" fill="${a}"/><path d="M-36 -188 Q-30 -180 0 -180 Q30 -180 36 -188 Q30 -176 0 -175 Q-30 -176 -36 -188Z" fill="${c}" ${o()}/>`;
    case 'gele':
      return `<path d="M-26 -176 Q-34 -204 -10 -214 Q0 -230 14 -214 Q36 -206 26 -176 Q0 -168 -26 -176Z" fill="url(#ankara)" ${o()}/><path d="M-20 -200 Q0 -190 22 -204 M-8 -214 Q6 -204 18 -212" fill="none" ${o('stroke-width="2"')}/>`;
    case 'flower':
      return `<g transform="translate(-17 -186)"><circle r="7" fill="${c}" ${o('stroke-width="2"')}/><circle r="3" fill="${a}"/></g>`;
    default:
      return '';
  }
}

function face(p, fx) {
  const f = p.face || {};
  const eyes = f.shades
    ? `<rect x="${fx - 13}" y="-176" width="11" height="8" rx="3" fill="#111" ${o('stroke-width="2"')}/><rect x="${fx + 1}" y="-176" width="11" height="8" rx="3" fill="#111" ${o('stroke-width="2"')}/><path d="M${fx - 2} -173h3" ${o('stroke-width="2"')}/>`
    : `<circle cx="${fx - 5.5}" cy="-171" r="5.5" fill="#fff" ${o('stroke-width="2"')}/><circle cx="${fx + 5.5}" cy="-171" r="5.5" fill="#fff" ${o('stroke-width="2"')}/>
       <circle cx="${fx - 4.5 + (p.look || 0)}" cy="-170.5" r="1.7" fill="${INK}"/><circle cx="${fx + 6.5 + (p.look || 0)}" cy="-170.5" r="1.7" fill="${INK}"/>
       ${f.glasses ? `<circle cx="${fx - 6}" cy="-171" r="7.5" fill="none" stroke="#5a4a40" stroke-width="1.6"/><circle cx="${fx + 6}" cy="-171" r="7.5" fill="none" stroke="#5a4a40" stroke-width="1.6"/>` : ''}`;
  const brows = f.brows === false ? '' : `<path d="M${fx - 10} -180 l7 ${f.mad ? 2 : -1} M${fx + 3} ${f.mad ? -178 : -181} l7 ${f.mad ? -2 : 1}" ${o('stroke-width="2.2"')}/>`;
  const nose = `<path d="M${fx + 1} -167 q5 5 -1 8" fill="none" ${o('stroke-width="2"')}/>`;
  const mouth = f.open
    ? `<path d="M${fx - 6} -155 q6 7 12 0Z" fill="#6b1d1d" ${o('stroke-width="2"')}/>`
    : `<path d="M${fx - 6} -155 q6 ${f.smile === false ? 0 : 4} 12 0" fill="none" ${o('stroke-width="2"')}/>`;
  const hc = p.hair?.color || '#3b2414';
  const stache = f.stache === 'curl'
    ? `<path d="M${fx - 3} -160 q-6 -3 -10 1 q-3 3 -6 0 M${fx + 3} -160 q6 -3 10 1 q3 3 6 0" fill="none" stroke="${hc}" stroke-width="3" stroke-linecap="round"/>`
    : f.stache
      ? `<path d="M${fx - 9} -158 q9 -7 18 0 q-9 3 -18 0Z" fill="${hc}" ${o('stroke-width="2"')}/>`
      : '';
  const beard = f.beard
    ? `<path d="M-17 -170 Q-19 ${f.beard === 'big' ? -132 : -146} 0 ${f.beard === 'big' ? -128 : -143} Q19 ${f.beard === 'big' ? -132 : -146} 17 -170 Q12 -152 0 -152 Q-12 -152 -17 -170Z" fill="${hc}" ${o('stroke-width="2"')}/>`
    : '';
  const zinc = f.zinc ? `<path d="M${fx - 1} -168 q5 5 -1 8" fill="none" stroke="#fff" stroke-width="4"/>` : '';
  return beard + eyes + brows + nose + zinc + mouth + stache;
}

function topShape(t) {
  if (t.type === 'coat') return 'M-23 -138 Q0 -146 23 -138 L31 -38 L-31 -38 Z';
  if (t.type === 'dress') return 'M-22 -138 Q0 -146 22 -138 L24 -96 L40 -26 L-40 -26 L-24 -96 Z';
  return 'M-23 -138 Q0 -146 23 -138 L26 -80 L-26 -80 Z';
}

function topDetails(t) {
  const a = t.accent;
  switch (t.type) {
    case 'hoodie':
      return `<path d="M-14 -100 H14 L17 -84 H-17Z" fill="#000" opacity=".16"/><path d="M-5 -137 l-1 18 M5 -137 l1 18" ${o('stroke-width="2"')}/><rect x="-12" y="-126" width="24" height="8" rx="2" fill="${a}"/>`;
    case 'tee':
      return `<path d="M-8 -142 q8 6 16 0" fill="none" ${o('stroke-width="2"')}/><circle cx="0" cy="-112" r="8" fill="${a}"/>`;
    case 'jersey':
      return `<path d="M-9 -142 L0 -128 L9 -142" fill="none" stroke="${a}" stroke-width="4"/><text x="0" y="-92" text-anchor="middle" font-family="Anton, Impact, sans-serif" font-size="22" fill="${a}">10</text>`;
    case 'shirt':
      return `<path d="M-10 -142 L0 -132 L10 -142 L4 -128 L0 -132 L-4 -128Z" fill="${a}" ${o('stroke-width="2"')}/><path d="M0 -132 V-80" ${o('stroke-width="1.5"')}/>${[-122, -108, -94].map((y) => `<circle cx="2.5" cy="${y}" r="1.6" fill="${INK}"/>`).join('')}`;
    case 'jacket':
      return `<path d="M-11 -143 L0 -134 L11 -143 L14 -134 L0 -128 L-14 -134Z" fill="${a}" ${o('stroke-width="2"')}/><path d="M0 -130 V-80" stroke="${a}" stroke-width="3"/><rect x="-26" y="-88" width="52" height="8" fill="${a}" ${o('stroke-width="2"')}/>`;
    case 'coat':
      return `<path d="M-14 -142 L0 -112 L-6 -140Z M14 -142 L0 -112 L6 -140Z" fill="${a}" ${o('stroke-width="2"')}/><rect x="-28" y="-90" width="56" height="7" fill="${a}" ${o('stroke-width="2"')}/><path d="M0 -112 V-38" ${o('stroke-width="2"')}/>`;
    case 'tank':
      return `<path d="M-8 -142 q8 8 16 0" fill="none" ${o('stroke-width="2"')}/><path d="M-12 -110 q12 -10 24 0" fill="none" stroke="${a}" stroke-width="4"/>`;
    case 'dress':
      return `<path d="M-9 -142 q9 7 18 0" fill="none" ${o('stroke-width="2"')}/><rect x="-24" y="-98" width="48" height="5" fill="${a}"/>`;
    default:
      return '';
  }
}

function arms(p, skin) {
  const t = p.top;
  const sleeve = t.type === 'tank' ? null : t.color === 'url(#marine)' || t.color.startsWith('url') ? t.sleeve || t.accent : t.color;
  const short = ['tee', 'jersey', 'tank'].includes(t.type);
  const one = (side, pose) => {
    const s = side === 'l' ? -1 : 1;
    const sx = 23 * s;
    let end = [31 * s, -86];
    if (pose === 'face') end = [6 * s, -156];
    if (pose === 'hip') end = [30 * s, -96];
    if (pose === 'wave') end = [40 * s, -170];
    if (pose === 'counter') end = [18 * s, -92];
    const elbow = pose === 'face' ? [30 * s, -120] : pose === 'hip' ? [40 * s, -112] : pose === 'wave' ? [42 * s, -130] : [(sx + end[0]) / 2 + 3 * s, (-134 + end[1]) / 2];
    const d = `M${sx} -133 Q${elbow[0]} ${elbow[1]} ${end[0]} ${end[1]}`;
    let body;
    if (short) body = line(d, skin, 10) + (sleeve ? line(`M${sx} -134 L${sx + 6 * s} -118`, sleeve, 13) : '');
    else body = line(d, sleeve, 12);
    return `<g class="arm arm-${side}">${body}<circle cx="${end[0]}" cy="${end[1]}" r="6" fill="${skin}" ${o('stroke-width="2.5"')}/></g>`;
  };
  return one('l', p.pose?.l) + one('r', p.pose?.r);
}

function bottoms(p, skin) {
  const b = p.bottom || { type: 'pants', color: '#3a4a6a' };
  const shoe = p.shoes || '#f2f2f2';
  const leg = (side) => {
    const x0 = side === 'l' ? -15 : 2;
    let legBody;
    if (b.type === 'shorts')
      legBody = `<rect x="${x0 + 1}" y="-58" width="12" height="52" fill="${skin}" ${o()}/><path d="M${x0 - 1} -82 H${x0 + 15} V-52 H${x0 - 1}Z" fill="${b.color}" ${o()}/>`;
    else if (b.type === 'skirt') legBody = `<rect x="${x0 + 2}" y="-60" width="11" height="54" fill="${skin}" ${o()}/>`;
    else legBody = `<path d="M${x0} -82 H${x0 + 13} V-8 H${x0}Z" fill="${b.color}" ${o()}/>`;
    return `<g class="leg leg-${side}">${legBody}<path d="M${x0 - 4} -2 Q${x0 - 4} -12 ${x0 + 6} -12 Q${x0 + 18} -12 ${x0 + 19} -2Z" fill="${shoe}" ${o()}/></g>`;
  };
  const skirt = b.type === 'skirt' ? `<path d="M-24 -84 H24 L32 -50 H-32Z" fill="${b.color}" ${o()}/>` : '';
  return { legs: leg('l') + leg('r'), skirt };
}

function extras(p) {
  const x = p.extras || {};
  let s = '';
  if (x.chain) s += `<path d="M-10 -140 Q0 -116 10 -140" fill="none" stroke="#e8c14a" stroke-width="3.5"/><circle cx="0" cy="-121" r="4" fill="#e8c14a" ${o('stroke-width="1.5"')}/>`;
  if (x.scarf) s += `<path d="M-14 -144 Q0 -134 14 -144 L14 -138 Q0 -128 -14 -138Z" fill="${x.scarf}" ${o('stroke-width="2"')}/><path d="M8 -136 l6 26 l-9 0Z" fill="${x.scarf}" ${o('stroke-width="2"')}/>`;
  return s;
}
function earrings(p) {
  return p.extras?.hoops ? `<circle cx="-18" cy="-158" r="4" fill="none" stroke="#e8c14a" stroke-width="2.5"/><circle cx="18" cy="-158" r="4" fill="none" stroke="#e8c14a" stroke-width="2.5"/>` : '';
}

// Main builder. p: { skin, hair:{style,color}, hat:{type,color,accent}, top:{type,color,accent}, bottom:{type,color}, shoes, face:{}, extras:{}, pose:{l,r}, facing:-1|0|1 }
export function person(p) {
  const skin = p.skin;
  const fx = (p.facing || 0) * 3;
  const { legs, skirt } = bottoms(p, skin);
  const shape = topShape(p.top);
  return `<g class="person">
    <ellipse class="shadow" cx="0" cy="0" rx="30" ry="6" fill="#000" opacity=".18"/>
    ${hairBack(p.hair)}
    ${legs}
    <g class="torso">
      ${skirt}
      ${p.top.type === 'hoodie' ? `<ellipse cx="0" cy="-141" rx="23" ry="9" fill="${p.top.color}" ${o()}/>` : ''}
      <path d="${shape}" fill="${p.top.color}" ${o()}/>
      ${topDetails(p.top)}
      ${extras(p)}
    </g>
    ${arms(p, skin)}
    <rect x="-6" y="-152" width="12" height="13" fill="${skin}" ${o('stroke-width="2.5"')}/>
    <circle cx="-17" cy="-167" r="5" fill="${skin}" ${o('stroke-width="2.5"')}/><circle cx="17" cy="-167" r="5" fill="${skin}" ${o('stroke-width="2.5"')}/>
    <ellipse cx="0" cy="-169" rx="17" ry="20" fill="${skin}" ${o()}/>
    ${earrings(p)}
    ${face(p, fx)}
    ${hairFront(p.hair)}
    ${hat(p.hat, fx)}
  </g>`;
}

// ---------- Store owners (one per region) ----------
export const OWNERS = {
  'north-america': {
    skin: SKIN[5], hair: { style: 'fade', color: '#14100e' }, hat: { type: 'cap', color: '#1f2a44', accent: '#e8c14a' },
    top: { type: 'hoodie', color: '#c8102e', accent: '#ffffff' }, bottom: { type: 'pants', color: '#2f3a4f' }, shoes: '#f5f5f5',
    face: { beard: 'trim' }, extras: { chain: true }, pose: { l: 'counter', r: 'wave' },
  },
  canada: {
    skin: '#f1c3a6', hair: { style: 'short', color: '#b4532a' }, hat: { type: 'beanie', color: '#c8102e', accent: '#f2f2f2' },
    top: { type: 'shirt', color: 'url(#plaid)', accent: '#1a1a1a', sleeve: '#a51d27' }, bottom: { type: 'pants', color: '#3c5a8a' }, shoes: '#6b4224',
    face: { beard: 'big' }, pose: { l: 'counter', r: 'wave' },
  },
  'south-america': {
    skin: SKIN[2], hair: { style: 'curly', color: '#2a1810' }, hat: { type: 'flower', color: '#ff5d8f', accent: '#f4c430' },
    top: { type: 'tee', color: '#f4c430', accent: '#009739' }, bottom: { type: 'skirt', color: '#009739' }, shoes: '#c79a5b',
    face: {}, extras: { hoops: true }, pose: { l: 'counter', r: 'wave' },
  },
  europe: {
    skin: SKIN[0], hair: { style: 'slick', color: '#2a1d16' }, hat: { type: 'beret', color: '#1a1a1a' },
    top: { type: 'tee', color: 'url(#marine)', accent: '#1f2f5a', sleeve: '#f4efe3' }, bottom: { type: 'pants', color: '#2b2b33' }, shoes: '#3a2418',
    face: { stache: 'curl', glasses: true }, extras: { scarf: '#c62f3b' }, pose: { l: 'counter', r: 'hip' },
  },
  africa: {
    skin: SKIN[5], hair: null, hat: { type: 'gele' },
    top: { type: 'dress', color: 'url(#ankara)', accent: '#f4c430', sleeve: '#e2852b' }, bottom: { type: 'skirt', color: '#1d6b4a' }, shoes: '#c79a5b',
    face: {}, extras: { hoops: true }, pose: { l: 'counter', r: 'wave' },
  },
  asia: {
    skin: SKIN[6], hair: { style: 'short', color: '#14100e' }, hat: { type: 'bucket', color: '#2b2b2b' },
    top: { type: 'hoodie', color: '#1b1b1b', accent: '#d0021b' }, bottom: { type: 'pants', color: '#4b4f3a' }, shoes: '#f5f5f5',
    face: { glasses: true }, extras: { chain: true }, pose: { l: 'counter', r: 'wave' },
  },
  oceania: {
    skin: SKIN[2], hair: { style: 'shaggy', color: '#e2c27a' }, hat: { type: 'akubra', color: '#8b5a2b', accent: '#3b2414' },
    top: { type: 'tank', color: '#0b6e8f', accent: '#f4c430' }, bottom: { type: 'shorts', color: '#f4c430' }, shoes: '#1a1a1a',
    face: { zinc: true }, pose: { l: 'counter', r: 'wave' },
  },
};

// ---------- Nucci: trench coat, fedora, hand over his face. Coat swings open on .open ----------
export function nucci() {
  const skin = SKIN[3];
  const coat = '#b08a55';
  const flap = (side) => {
    const s = side === 'l' ? -1 : 1;
    return `<g class="flap flap-${side}"><path d="M${0} -140 L${24 * s} -138 L${33 * s} -30 L${2 * s} -30 Z" fill="${coat}" ${o()}/>
      <path d="M${2 * s} -140 L${14 * s} -150 L${18 * s} -118Z" fill="#9a7444" ${o('stroke-width="2"')}/>
      <rect x="${s < 0 ? -33 : 0}" y="-92" width="33" height="7" fill="#7c5a2e" ${o('stroke-width="2"')}/>
      ${[-118, -96, -72].map((y) => `<circle cx="${7 * s}" cy="${y}" r="2.6" fill="${INK}"/>`).join('')}</g>`;
  };
  const lining = `<g class="lining"><path d="M-30 -138 H30 L34 -30 H-34Z" fill="#3b1250" ${o()}/>
    ${[-120, -96, -72, -50].map((y, i) => `<path d="M-24 ${y} H24" stroke="#d4af37" stroke-width="2" opacity=".7"/>
      <circle cx="${-14 + (i % 2) * 6}" cy="${y + 7}" r="5" fill="#e8c14a" ${o('stroke-width="1.5"')}/><rect x="${4 - (i % 2) * 4}" y="${y + 2}" width="12" height="14" rx="2" fill="${['#c8102e', '#5cf2ff', '#f4f4f4', '#7cfc00'][i]}" ${o('stroke-width="1.5"')}/>`).join('')}
    <text x="0" y="-36" text-anchor="middle" font-family="Anton, Impact, sans-serif" font-size="10" fill="#d4af37" letter-spacing="1">VIP</text></g>`;
  return `<g class="person nucci">
    <ellipse cx="0" cy="0" rx="34" ry="6" fill="#000" opacity=".25"/>
    <g class="leg leg-l"><path d="M-15 -40 H-2 V-8 H-15Z" fill="#2b2b33" ${o()}/><path d="M-19 -2 Q-19 -12 -9 -12 Q3 -12 4 -2Z" fill="#111" ${o()}/></g>
    <g class="leg leg-r"><path d="M2 -40 H15 V-8 H2Z" fill="#2b2b33" ${o()}/><path d="M-2 -2 Q-2 -12 8 -12 Q20 -12 21 -2Z" fill="#111" ${o()}/></g>
    ${lining}
    ${flap('l')}${flap('r')}
    <g class="arm arm-l">${line('M-24 -133 Q-34 -110 -32 -84', coat, 13)}<circle cx="-32" cy="-84" r="6" fill="${skin}" ${o('stroke-width="2.5"')}/></g>
    <rect x="-6" y="-152" width="12" height="13" fill="${skin}" ${o('stroke-width="2.5"')}/>
    <ellipse cx="0" cy="-169" rx="17" ry="20" fill="${skin}" ${o()}/>
    <rect x="-13" y="-178" width="11" height="8" rx="3" fill="#111" ${o('stroke-width="2"')}/><rect x="2" y="-178" width="11" height="8" rx="3" fill="#111" ${o('stroke-width="2"')}/>
    <path d="M-22 -150 L-16 -186 L-6 -158Z M22 -150 L16 -186 L6 -158Z" fill="${coat}" ${o()}/>
    <g class="arm arm-r">${line('M24 -133 Q34 -118 8 -158', coat, 13)}<path d="M-8 -162 Q0 -170 12 -162 Q14 -152 4 -150 Q-8 -150 -8 -162Z" fill="${skin}" ${o('stroke-width="2.5"')}/></g>
    ${hat({ type: 'fedora', color: '#3a2f28', accent: '#111' })}
  </g>`;
}

// Construction mascot for stores with no stock
export function penguin() {
  return `<g class="penguin">
    <ellipse cx="0" cy="0" rx="26" ry="5" fill="#000" opacity=".2"/>
    <path d="M-10 -3 h-10 l4 -7Z M10 -3 h10 l-4 -7Z" fill="#f29a2e" ${o('stroke-width="2"')}/>
    <ellipse cx="0" cy="-40" rx="26" ry="38" fill="#1f2230" ${o()}/>
    <ellipse cx="0" cy="-34" rx="17" ry="28" fill="#f4f4f4" ${o('stroke-width="2"')}/>
    <circle cx="-7" cy="-60" r="5" fill="#fff" ${o('stroke-width="2"')}/><circle cx="7" cy="-60" r="5" fill="#fff" ${o('stroke-width="2"')}/>
    <circle cx="-6" cy="-60" r="1.8" fill="${INK}"/><circle cx="8" cy="-60" r="1.8" fill="${INK}"/>
    <path d="M-5 -52 L0 -44 L5 -52Z" fill="#f29a2e" ${o('stroke-width="2"')}/>
    <path d="M-24 -84 Q0 -108 24 -84 Z" fill="#f6c42b" ${o()}/><rect x="-28" y="-86" width="56" height="6" rx="3" fill="#f6c42b" ${o()}/>
    <path d="M22 -42 L44 -60" ${o('stroke-width="5"')}/>
    <g transform="translate(44 -100) rotate(-6)"><rect x="-4" y="0" width="5" height="46" fill="#8a5a33" ${o('stroke-width="2"')}/><rect x="-34" y="-30" width="66" height="34" rx="3" fill="#f6c42b" ${o()}/>
    <text x="-1" y="-17" text-anchor="middle" font-family="Anton, Impact, sans-serif" font-size="11" fill="${INK}">COMING</text><text x="-1" y="-4" text-anchor="middle" font-family="Anton, Impact, sans-serif" font-size="11" fill="${INK}">SOON</text></g>
  </g>`;
}

// ---------- Pedestrians wear real stock ----------
const TOP_TYPES = { hoodie: 'hoodie', tee: 'tee', jersey: 'jersey', shirt: 'shirt', jacket: 'jacket', coat: 'coat' };
const HAIRSTYLES = ['short', 'fade', 'afro', 'long', 'curly', 'bun', 'locs', 'shaggy', 'slick', null];
const HATS = [null, null, null, { type: 'cap' }, { type: 'beanie' }, { type: 'bucket' }];

export function pedestrianSpec(topItem, pantsItem, shoeItem, r) {
  const hs = HAIRSTYLES[Math.floor(r() * HAIRSTYLES.length)];
  const h = HATS[Math.floor(r() * HATS.length)];
  return {
    skin: SKIN[Math.floor(r() * SKIN.length)],
    hair: hs ? { style: hs, color: HAIR[Math.floor(r() * HAIR.length)] } : null,
    hat: h ? { ...h, color: ['#1f2a44', '#c8102e', '#2e6b4a', '#111', '#e9dfc9'][Math.floor(r() * 5)], accent: '#f2f2f2', back: r() > 0.5 } : null,
    top: { type: TOP_TYPES[topItem.type] || 'tee', color: topItem.color, accent: topItem.accent },
    bottom: pantsItem ? { type: 'pants', color: pantsItem.color } : { type: r() > 0.8 ? 'shorts' : 'pants', color: ['#2f3a4f', '#3d4033', '#1a1a1a', '#5a4632'][Math.floor(r() * 4)] },
    shoes: shoeItem ? shoeItem.color : '#f2f2f2',
    face: { glasses: r() > 0.8, stache: r() > 0.85, beard: r() > 0.85 ? 'trim' : false },
    extras: { chain: r() > 0.85, hoops: r() > 0.8 },
    facing: 1,
  };
}
