// Shared look for the whole city: flat fills, chunky dark outlines, sunset palette.
export const INK = '#2b1a14';
export const SW = 3; // standard outline width (world units)

export const SKIN = ['#f6d3b3', '#eab68f', '#d39a6a', '#b07548', '#8a5434', '#5e3620', '#f1c7a2', '#c98d5e'];
export const HAIR = ['#1c1410', '#3b2414', '#6b3e1e', '#c8862f', '#e2c27a', '#9a9a9a', '#5a1f12'];

export const o = (extra = '') => `stroke="${INK}" stroke-width="${SW}" stroke-linejoin="round" stroke-linecap="round" ${extra}`;

export const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

// Seeded random so the city looks identical on every visit
export function rng(seed = 7) {
  let s = seed >>> 0;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
}

// Patterns + gradients used by facades, interiors and the aerial view
export const DEFS = `
<defs>
  <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#3a2b5e"/><stop offset=".45" stop-color="#e2566a"/><stop offset=".78" stop-color="#ff9a5a"/><stop offset="1" stop-color="#ffc77a"/>
  </linearGradient>
  <radialGradient id="sunGlow"><stop offset="0" stop-color="#fff3b0"/><stop offset=".5" stop-color="#ffd36b" stop-opacity=".6"/><stop offset="1" stop-color="#ff9a5a" stop-opacity="0"/></radialGradient>
  <radialGradient id="bulb" cx=".5" cy="0" r="1"><stop offset="0" stop-color="#ffe9a0" stop-opacity=".55"/><stop offset="1" stop-color="#ffe9a0" stop-opacity="0"/></radialGradient>
  <linearGradient id="glass" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffe3a8"/><stop offset="1" stop-color="#f3a86b"/></linearGradient>
  <linearGradient id="glassCool" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#bfe8ef"/><stop offset="1" stop-color="#7bb7c9"/></linearGradient>
  <linearGradient id="alleyDark" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1d1420"/><stop offset="1" stop-color="#3a2530"/></linearGradient>
  <pattern id="brick" width="40" height="20" patternUnits="userSpaceOnUse">
    <rect width="40" height="20" fill="#a8452f"/>
    <path d="M0 0H40M0 10H40M10 0V10M30 10V20" stroke="#7d2f1f" stroke-width="2"/>
  </pattern>
  <pattern id="brickDark" width="40" height="20" patternUnits="userSpaceOnUse">
    <rect width="40" height="20" fill="#4a2f35"/>
    <path d="M0 0H40M0 10H40M10 0V10M30 10V20" stroke="#2f1d24" stroke-width="2"/>
  </pattern>
  <pattern id="plaid" width="24" height="24" patternUnits="userSpaceOnUse">
    <rect width="24" height="24" fill="#b3202a"/>
    <rect width="12" height="24" fill="#1a1a1a" opacity=".55"/><rect width="24" height="12" fill="#1a1a1a" opacity=".55"/>
  </pattern>
  <pattern id="stripes" width="28" height="10" patternUnits="userSpaceOnUse">
    <rect width="28" height="10" fill="#f4efe3"/><rect width="14" height="10" fill="#c62f3b"/>
  </pattern>
  <pattern id="marine" width="10" height="12" patternUnits="userSpaceOnUse">
    <rect width="10" height="12" fill="#f4efe3"/><rect width="10" height="5" fill="#1f2f5a"/>
  </pattern>
  <pattern id="ankara" width="36" height="36" patternUnits="userSpaceOnUse">
    <rect width="36" height="36" fill="#e2852b"/>
    <path d="M0 18L9 0L18 18L27 0L36 18L27 36L18 18L9 36Z" fill="#1d6b4a"/>
    <circle cx="18" cy="18" r="5" fill="#f4c430" stroke="#2b1a14" stroke-width="1.5"/>
    <circle cx="0" cy="0" r="4" fill="#c0392b"/><circle cx="36" cy="36" r="4" fill="#c0392b"/>
  </pattern>
  <pattern id="kente" width="48" height="24" patternUnits="userSpaceOnUse">
    <rect width="48" height="24" fill="#f4c430"/>
    <rect x="0" width="8" height="24" fill="#1d6b4a"/><rect x="16" width="8" height="24" fill="#c0392b"/><rect x="32" width="4" height="24" fill="#1a1a1a"/>
    <rect y="8" width="48" height="4" fill="#1a1a1a" opacity=".7"/>
  </pattern>
  <pattern id="tin" width="14" height="40" patternUnits="userSpaceOnUse">
    <rect width="14" height="40" fill="#6cc3d5"/><rect width="4" height="40" fill="#4fa6ba"/>
  </pattern>
  <pattern id="tiles" width="30" height="30" patternUnits="userSpaceOnUse">
    <rect width="30" height="30" fill="#f2efe6"/>
    <path d="M15 3L27 15L15 27L3 15Z" fill="#2a5ea8"/><circle cx="15" cy="15" r="4" fill="#f4c430"/>
  </pattern>
  <pattern id="shoji" width="26" height="26" patternUnits="userSpaceOnUse">
    <rect width="26" height="26" fill="#ffe6b0"/><path d="M0 0H26V26" fill="none" stroke="#5a3a24" stroke-width="3"/>
  </pattern>
  <pattern id="logs" width="60" height="26" patternUnits="userSpaceOnUse">
    <rect width="60" height="26" fill="#8a5a33"/><rect y="20" width="60" height="6" fill="#6b4224"/>
    <path d="M8 8h18M34 14h16" stroke="#6b4224" stroke-width="2" stroke-linecap="round"/>
  </pattern>
  <pattern id="stone" width="60" height="30" patternUnits="userSpaceOnUse">
    <rect width="60" height="30" fill="#ebdfc6"/><path d="M0 29H60M30 0V15M0 15H60M10 15V30" stroke="#cdbf9f" stroke-width="2"/>
  </pattern>
  <pattern id="zinc" width="16" height="16" patternUnits="userSpaceOnUse">
    <rect width="16" height="16" fill="#5b6b7a"/><rect width="2" height="16" fill="#4a5866"/>
  </pattern>
  <pattern id="ice" width="56" height="28" patternUnits="userSpaceOnUse">
    <rect width="56" height="28" fill="#dff3fb"/><path d="M0 27H56M28 0V14M0 14H56M8 14V28" stroke="#a9d5e6" stroke-width="2"/>
  </pattern>
  <pattern id="caution" width="40" height="20" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
    <rect width="40" height="20" fill="#f6c42b"/><rect width="20" height="20" fill="#1a1a1a"/>
  </pattern>
  <pattern id="plywood" width="60" height="60" patternUnits="userSpaceOnUse">
    <rect width="60" height="60" fill="#d9b27a"/><path d="M6 12q20 -6 48 0M4 34q22 6 50 -2M8 50q18 -5 44 2" fill="none" stroke="#b98d55" stroke-width="2"/>
  </pattern>
  <pattern id="wood" width="80" height="20" patternUnits="userSpaceOnUse">
    <rect width="80" height="20" fill="#9a6a3f"/><path d="M0 19H80M40 0V19" stroke="#7a4f2c" stroke-width="2"/>
  </pattern>
  <pattern id="checker" width="40" height="40" patternUnits="userSpaceOnUse">
    <rect width="40" height="40" fill="#efe6d2"/><rect width="20" height="20" fill="#2b2b33"/><rect x="20" y="20" width="20" height="20" fill="#2b2b33"/>
  </pattern>
  <pattern id="sidewalk" width="70" height="90" patternUnits="userSpaceOnUse">
    <rect width="70" height="90" fill="#c9a98f"/><path d="M0 0V90" stroke="#a88a72" stroke-width="3"/>
  </pattern>
</defs>`;
