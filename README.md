# Smoke the Crack — Global Resell

A 3D clothing resell marketplace. Visitors arrive in a living solar system, land on a realistic Earth, spin it, and tap a city beacon to shop the pieces sourced from there — then zoom out to the full planet (or all the way back to space) any time.

## Run

```bash
npm install
npm run dev      # local dev server
npm run build    # production build → dist/ (static, deploy anywhere: Vercel, Netlify, S3)
```

## How it works

| Layer | File |
| --- | --- |
| Inventory (locations + items) | `src/data/inventory.js` |
| Earth: day/night shader, city lights, ocean glint, clouds, atmosphere | `src/scene/earth.js` |
| Solar system: animated sun, planets, Saturn rings, Moon | `src/scene/solar.js` |
| City beacons (instanced — one draw call for all pins) | `src/scene/markers.js` |
| Marketplace panel, breadcrumbs (Earth › Country › State/Province › City), bag, search | `src/ui/market.js` |
| Camera flights, picking, labels, render loop | `src/main.js` |

### Adding stock
Add a location to `LOCATIONS` (city, region = state/province, country, lat, lng) and items to `RAW` referencing its id. Pins, counts, search and scopes update automatically.

### Performance guards
- Pixel ratio capped (2 desktop / 1.75 touch) and auto-lowered if frame rate drops below ~42 fps.
- Beacons, pulses and hit targets are instanced/GPU points — constant draw calls regardless of stock size.
- Analytic sphere picking (no per-triangle raycasts), pooled DOM labels, frame-delta clamping so tab switches never jump.
- WebGL context-loss recovery; static textures only (~2.8 MB total, NASA Blue Marble).

## Controls
- **Solar view:** drag to orbit, click Earth (or "Land on Earth"). Other planets tease future drops.
- **Earth view:** drag to spin, scroll/pinch to zoom, click a beacon to shop. Scroll out past max zoom to fly back to space. `Esc` closes panels / zooms out.
- **☾ Real Time / ☀ Daylight:** toggle the real sun terminator (city lights at night) vs. fully lit globe.

Earth textures: NASA Blue Marble / Black Marble (public domain) via the `three-globe` example set (MIT).
