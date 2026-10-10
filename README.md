# Smoke the Crack — Global Resell Block

Vintage grails sold on one block in the hood, drawn in pixel art. The site opens looking straight down at the block at night, sweeps along the rooftops, then drops you onto the sidewalk. Every storefront reps a real neighbourhood on its continent, with an owner dressed for those streets. Walk up, step through the door, and shop their racks.

## Run

```bash
npm install
npm run dev      # local dev server
npm run build    # static build → dist/ (deploy anywhere: Vercel, Netlify, S3)
```

No images to download and no 3D engine: every building, person, car and garment is drawn pixel by pixel in code onto a low-res canvas that's scaled up with crisp pixels.

## The block

| Store | Region | Neighbourhood | Owner & fit |
| --- | --- | --- | --- |
| Uptown Thread Exchange | North America (US + Mexico) | Harlem, NYC | Tyrell “T-Bone” Washington: durag, white tee, chain, Timbs |
| 6ix Side Thrift | Canada | Scarborough, Toronto | Jaylen “Fresh” Campbell: black puffer, toque, tech fleece |
| Casa Exclusivo | South America | Rocinha, Rio | Thiago “Mandrake” Souza: Juliet shades, Brasil jersey, slides |
| **Booster Corner** (alley) | Rare finds | — | The booster: hood up, face in shadow, gold grill. “Ain’t nobody got these.” |
| Boutique du Bloc | Europe | Saint-Denis (93), Paris | Karim “Sacoche” Benali: survêt, sacoche, TNs |
| Odogwu Vintage | Africa | Yaba, Lagos | Chidi “Odogwu” Okafor: bucket hat, Naija jersey, cargos |
| Ura-Hara Stash | Asia | Shinjuku, Tokyo | Ryo “Kaiju” Tanaka: bleached spikes, camo hoodie |
| Westie Grails | Oceania | Mount Druitt, Western Sydney | Jayden “Shaz” Wilson: polo, bumbag, TNs, socks up |

- **No stock = under construction.** Any region with zero items is boarded up with scaffolding, caution tape and cones, and can't be entered. Add stock and it opens automatically.
- **Inside a store** the marketplace lists that region's pieces, with country chips to filter. The city each piece came from shows on its card.
- **Booster Corner**: a van backed into the alley with its rear doors open. Tap the trunk and the camera zooms into it. The booster's stock is rare pieces you won't find anywhere else, from $25 bootlegs and staff-only tees to five-figure grails.
- **Pedestrians** wear real stock. Tap one to see the piece, add it to your bag, or walk to the store that sells it.

## Files

| What | File |
| --- | --- |
| Stores, owners, inventory, booster stock | `src/data/inventory.js` |
| Pixel toolkit (bricks, windows, shutters, graffiti, wires, glow) | `src/pix/draw.js` |
| Bitmap sign fonts (5x7, 3x5) | `src/pix/font.js` |
| Character sprites, owners, the booster, cars, pigeons, cat | `src/pix/sprites.js` |
| Neighbourhood storefronts, alley, construction, street furniture | `src/pix/facades.js` |
| Street engine: camera, parallax, people, traffic, neon | `src/pix/street.js` |
| Aerial intro | `src/pix/aerial.js` |
| Store interiors | `src/pix/interior.js` |
| Pixel garments | `src/pix/items.js` |
| Marketplace panel, bag, search | `src/ui/market.js` |
| Flow (intro → street → door → interior) | `src/main.js` |

### Adding stock
Add a city to `LOCATIONS`, items to `RAW`, and make sure the country is listed in one store's `countries`. Window displays, racks, counts, pedestrians' outfits and the directory all update on their own. Booster Corner stock lives in `BOOSTER_RAW` (the last column is the rarity badge).

## Controls
- Drag, scroll, or ← → to walk the block. The directory bar at the bottom jumps to any store.
- Tap a storefront to walk to it and go inside. `Esc` closes panels and leaves a store.
- Search finds stores, regions, countries, brands and cities, then walks you to the right door.

## Performance
The block, skylines and street furniture are painted once into off-screen canvases. Each frame only copies slices of those and draws ~15 small sprites (people, cars, neon, steam) onto a canvas around 480×300 pixels, which the browser scales up. The street stops rendering while you're inside a store.
