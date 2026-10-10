# Smoke the Crack — Global Resell Block

A cartoon city block you walk down to shop. The site opens looking straight down at the block, sweeps along it, then drops you onto the sidewalk. Every storefront is a region, built and staffed in that region's style. Walk up, step through the door, meet the owner, and shop their racks.

## Run

```bash
npm install
npm run dev      # local dev server
npm run build    # static build → dist/ (deploy anywhere: Vercel, Netlify, S3)
```

No 3D engine and no image downloads: the whole world is hand-drawn SVG generated in code.

## The block

| Store | Region | Owner |
| --- | --- | --- |
| Uptown Thread Exchange | North America (US + Mexico) | Tyrell “T-Bone” Washington, Harlem |
| True North Trading Post | Canada | Gord McAllister, Thunder Bay |
| Casa Albuquerque | South America | Luiza Albuquerque, Rio de Janeiro |
| **Nucci’s Corner** (alley) | VIP only | Nucci (trench coat, face covered) |
| Maison Dubois | Europe | Henri Dubois, Paris |
| Adaeze’s Ankara House | Africa | Mama Adaeze Okafor, Lagos |
| Watanabe Shōten | Asia | Kenji Watanabe, Harajuku |
| Bondi Board & Thread | Oceania | Mick “Dingo” Harris, Bondi |
| Polar Outfitters | Antarctica | Under construction |

- **No stock = under construction.** Any region with zero items is boarded up with scaffolding, caution tape and cones, and can't be entered. Add stock and it opens automatically.
- **Inside a store** the marketplace lists that region's pieces, with country chips to filter. The city each piece came from shows on its card.
- **Nucci's Corner**: tap the alley and Nucci opens his coat. His panel has off-menu VIP pieces you can only request a hold on, plus his picks from the other stores.
- **Pedestrians** wear real stock. Tap one to see the piece, add it to your bag, or walk to the store that sells it.

## Files

| What | File |
| --- | --- |
| Stores, owners, inventory, VIP pieces | `src/data/inventory.js` |
| Character builder (owners, Nucci, pedestrians) | `src/city/characters.js` |
| Region facades, alley, construction, props, cars | `src/city/storefronts.js` |
| Street camera, walking, pedestrians, traffic | `src/city/street.js` |
| Aerial intro | `src/city/aerial.js` |
| Store interiors | `src/city/interior.js` |
| Marketplace panel, bag, search | `src/ui/market.js` |
| Flow (intro → street → door → interior) | `src/main.js` |

### Adding stock
Add a city to `LOCATIONS`, items to `RAW`, and make sure the country is listed in one store's `countries`. Window displays, racks, counts, pedestrians' outfits and the directory all update on their own. VIP pieces live in `VIP_RAW`; Nucci's picks are `PICK_NAMES`.

## Controls
- Drag, scroll, or ← → to walk the block. The directory bar at the bottom jumps to any store.
- Tap a storefront to walk to it and go inside. `Esc` closes panels and leaves a store.
- Search finds stores, regions, countries, brands and cities, then walks you to the right door.

## Performance
Only the camera layers, ~8 pedestrians and at most 2 cars move each frame; limb animation is CSS. The street pauses while you're inside a store. Pedestrian count is deliberately low.
