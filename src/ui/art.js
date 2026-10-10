// Lightweight vector product art (no image requests). Replace with real photos via item.image later.
const SHAPES = {
  hoodie: (c, a) => `
    <path d="M60 40 Q100 18 140 40 L176 64 L190 120 L168 128 L160 96 L160 178 L40 178 L40 96 L32 128 L10 120 L24 64 Z" fill="${c}"/>
    <path d="M74 40 Q100 70 126 40 Q100 30 74 40Z" fill="${a}" opacity=".35"/>
    <rect x="70" y="128" width="60" height="30" rx="6" fill="#000" opacity=".15"/>
    <line x1="92" y1="62" x2="90" y2="96" stroke="${a}" stroke-width="2"/><line x1="108" y1="62" x2="110" y2="96" stroke="${a}" stroke-width="2"/>
    <rect x="76" y="86" width="48" height="18" rx="3" fill="${a}"/>`,
  tee: (c, a) => `
    <path d="M62 34 Q100 52 138 34 L182 58 L168 98 L152 90 L152 178 L48 178 L48 90 L32 98 L18 58 Z" fill="${c}"/>
    <path d="M80 38 Q100 52 120 38" stroke="#000" stroke-opacity=".2" stroke-width="3" fill="none"/>
    <circle cx="100" cy="104" r="20" fill="${a}"/>`,
  jersey: (c, a) => `
    <path d="M62 34 L82 34 Q100 50 118 34 L138 34 L182 60 L168 100 L152 92 L152 178 L48 178 L48 92 L32 100 L18 60 Z" fill="${c}"/>
    <path d="M82 34 L100 60 L118 34" stroke="${a}" stroke-width="5" fill="none"/>
    <path d="M18 60 L32 100 M182 60 L168 100" stroke="${a}" stroke-width="6"/>
    <text x="100" y="128" font-family="Arial Black,Arial" font-size="34" text-anchor="middle" fill="${a}">10</text>`,
  shirt: (c, a) => `
    <path d="M64 30 L100 44 L136 30 L180 56 L168 120 L152 114 L152 180 L48 180 L48 114 L32 120 L20 56 Z" fill="${c}"/>
    <path d="M64 30 L86 58 L100 44 L114 58 L136 30" fill="${a}" opacity=".5"/>
    <line x1="100" y1="44" x2="100" y2="180" stroke="#000" stroke-opacity=".25" stroke-width="2"/>
    ${[66, 92, 118, 144, 170].map((y) => `<circle cx="104" cy="${y}" r="2.4" fill="${a}"/>`).join('')}
    <path d="M48 90 H152 M48 130 H152" stroke="${a}" stroke-opacity=".35" stroke-width="6"/>`,
  jacket: (c, a) => `
    <path d="M62 32 L100 42 L138 32 L178 56 L192 150 L170 156 L158 100 L158 180 L42 180 L42 100 L30 156 L8 150 L22 56 Z" fill="${c}"/>
    <path d="M62 32 L100 42 L138 32 L130 48 L100 54 L70 48 Z" fill="${a}"/>
    <line x1="100" y1="54" x2="100" y2="180" stroke="${a}" stroke-width="3"/>
    <rect x="42" y="168" width="116" height="12" fill="${a}" opacity=".8"/>
    <rect x="8" y="144" width="22" height="10" fill="${a}" opacity=".8"/><rect x="170" y="144" width="22" height="10" fill="${a}" opacity=".8"/>`,
  coat: (c, a) => `
    <path d="M64 24 L100 36 L136 24 L176 50 L188 160 L168 164 L158 104 L162 190 L38 190 L42 104 L32 164 L12 160 L24 50 Z" fill="${c}"/>
    <path d="M64 24 L88 74 L100 36 L112 74 L136 24" fill="${a}" opacity=".45"/>
    ${[90, 116, 142].map((y) => `<circle cx="88" cy="${y}" r="3.2" fill="${a}"/><circle cx="112" cy="${y}" r="3.2" fill="${a}"/>`).join('')}
    <rect x="42" y="124" width="116" height="8" fill="${a}" opacity=".6"/>`,
  pants: (c, a) => `
    <path d="M58 22 H142 L156 186 H112 L100 86 L88 186 H44 Z" fill="${c}"/>
    <rect x="58" y="22" width="84" height="12" fill="${a}" opacity=".7"/>
    <rect x="48" y="104" width="24" height="30" rx="3" fill="#000" opacity=".18"/><rect x="128" y="104" width="24" height="30" rx="3" fill="#000" opacity=".18"/>
    <path d="M100 34 V86" stroke="${a}" stroke-width="2"/>`,
  sneaker: (c, a) => `
    <path d="M18 136 Q20 100 52 96 L92 72 Q110 66 118 82 L134 106 Q170 112 184 130 L186 150 H18 Z" fill="${c}"/>
    <path d="M18 150 H186 V160 Q186 168 176 168 H26 Q18 168 18 160 Z" fill="#f5f5f5" stroke="#000" stroke-opacity=".15"/>
    <path d="M60 130 Q100 100 150 126" stroke="${a}" stroke-width="10" fill="none" stroke-linecap="round"/>
    <path d="M92 72 Q110 66 118 82 L104 92 Z" fill="${a}"/>
    ${[0, 1, 2, 3].map((i) => `<line x1="${86 + i * 9}" y1="${88 + i * 4}" x2="${98 + i * 9}" y2="${82 + i * 4}" stroke="#fff" stroke-width="2.5"/>`).join('')}`,
  cap: (c, a) => `
    <path d="M40 120 Q42 54 100 50 Q158 54 160 120 Z" fill="${c}"/>
    <path d="M150 116 Q196 116 192 134 Q160 140 120 128 Z" fill="${a}"/>
    <path d="M100 50 V120" stroke="#000" stroke-opacity=".2" stroke-width="2"/>
    <circle cx="100" cy="52" r="5" fill="${a}"/><rect x="74" y="80" width="40" height="18" rx="3" fill="${a}"/>`,
  accessory: (c, a) => `
    <rect x="14" y="88" width="172" height="34" rx="6" fill="${c}"/>
    ${[30, 60, 90, 120, 150].map((x) => `<text x="${x}" y="111" font-family="Arial Black,Arial" font-size="14" fill="${a}">⁄⁄</text>`).join('')}
    <rect x="70" y="82" width="56" height="46" rx="6" fill="none" stroke="${a}" stroke-width="5"/>`,
};

export function productArt(item) {
  const shape = SHAPES[item.type] || SHAPES.tee;
  return `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${item.brand} ${item.name}">
    <defs><radialGradient id="g${item.id}" cx="50%" cy="40%" r="70%"><stop offset="0" stop-color="#ffffff" stop-opacity=".12"/><stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient></defs>
    <g filter="drop-shadow(0 6px 8px rgba(0,0,0,.45))">${shape(item.color, item.accent)}</g>
    <rect width="200" height="200" fill="url(#g${item.id})"/>
  </svg>`;
}
