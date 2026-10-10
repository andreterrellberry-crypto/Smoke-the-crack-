# Smoke the Crack — Global Resell

A 3D clothing resell marketplace on a realistic, spinnable Earth. Navigation is two levels only — **continent → country**. Tap a continent chip or a country beacon to fly there and open its marketplace; each piece lists the city it came from.

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
| Earth: camera-following light (always lit), ocean glint, clouds, atmosphere | `src/scene/earth.js` |
| Country beacons (instanced — one draw call for all pins) | `src/scene/markers.js` |
| Marketplace panel, breadcrumbs (Earth › Continent › Country), continent/country chips, bag, search | `src/ui/market.js` |
| Camera flights, picking, labels, render loop | `src/main.js` |

### Adding stock
Add a city to `LOCATIONS` (city, country, lat, lng) and items to `RAW` referencing its id. New countries also need a row in `COUNTRIES` (continent + beacon lat/lng). Beacons, counts, chips and search update automatically.

### Performance guards
- Pixel ratio capped (2 desktop / 1.75 touch) and auto-lowered if frame rate drops below ~42 fps.
- Beacons, pulses and hit targets are instanced/GPU points — constant draw calls regardless of stock size.
- Analytic sphere picking (no per-triangle raycasts), pooled DOM labels, frame-delta clamping so tab switches never jump.
- WebGL context-loss recovery; static textures only (~2 MB total, NASA Blue Marble).

## Controls
- **Continent chips** (bottom bar) fly to a continent and list its countries; tap a country chip or beacon to drill in.
- Drag to spin, scroll/pinch to zoom. **⤢ Full Earth** or `Esc` zooms back out.
- Search finds continents, countries, brands, designers or cities and flies to the matching country.

Earth textures: NASA Blue Marble (public domain) via the `three-globe` example set (MIT).
