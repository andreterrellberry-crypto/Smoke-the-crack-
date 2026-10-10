# Smoke the Crack — Global Resell Block

Vintage grails sold on one block in the hood, drawn like a Saturday-morning cartoon show: flat saturated colour, thick black contour lines, detailed googly-eyed characters (shadowed eyelids, eye bags, bulb noses with nostrils, rows of teeth, four-finger hands, creased clothes, laced shoes) animated on held frames for that jumpy, bouncy cartoon timing, signage-style UI, and streets that recede in one-point perspective. The site opens looking straight down at the block, sweeps along the rooftops, then drops you onto the sidewalk. Every storefront reps a real neighbourhood on its continent, with an owner dressed for those streets. Walk up, step through the door, and shop their racks.

## Run

```bash
npm install
npm run dev      # local dev server
npm run build    # static build → dist/ (deploy anywhere: Vercel, Netlify, S3)
```

No images to download and no 3D engine: every building, person, car and garment is drawn in code with vector shapes, then rendered at your screen's real resolution. Building side walls and the two cross streets are re-projected every frame toward a vanishing point at the centre of the screen, so the block swings in 3D as you walk.

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
| Cartoon toolkit (shapes, tubes, splines, lettering, palette) | `src/toon/toon.js` |
| Characters: walkers (8-frame bouncy cycle), owners and loiterers (10 snap poses each), the booster, window neighbours | `src/toon/chars.js` |
| Pigeons, alley cat, stoop dog, traffic | `src/toon/critters.js` |
| Neighbourhood storefronts, the van, construction, street furniture | `src/toon/facades.js` |
| Street engine: camera, perspective pass, cross streets, people, traffic, neon | `src/toon/street.js` |
| Aerial intro | `src/toon/aerial.js` |
| Store interiors + the trunk close-up | `src/toon/interior.js` |
| Flat garments | `src/toon/items.js` |
| Marketplace panel, bag, search | `src/ui/market.js` |
| Flow (intro → street → door → interior) | `src/main.js` |

### Adding stock
Add a city to `LOCATIONS`, items to `RAW`, and make sure the country is listed in one store's `countries`. Window displays, racks, counts, pedestrians' outfits and the directory all update on their own. Booster Corner stock lives in `BOOSTER_RAW` (the last column is the rarity badge).

## Controls
- Drag, scroll, or ← → to walk the block. The directory bar under the header jumps to any store.
- Tap a storefront to walk to it and go inside. `Esc` closes panels and leaves a store.
- Search finds stores, regions, countries, brands and cities, then walks you to the right door.

## Moving parts
Characters animate on held frames, 12 a second: springy eight-frame walks, loiterers bouncing to the beat then snapping through talk, point, shrug, thumbs-up and a hop, owners waving and gesturing behind the counter, side walls and cross streets swinging in perspective as you walk, traffic lights cycling with a walk / don't-walk hand, nosy neighbours popping up in windows, a sleeping stoop dog snoring Z's, laundry flapping over Rocinha, cars bouncing with exhaust puffs, pigeons that scatter, flickering neon, manhole and alley steam, generator smoke, loiterers talking local slang, sneakers swinging on the power line, birds and drifting clouds. Walking through a door slams a show-style title card for that store.

## Performance
The block and skylines are drawn once into off-screen tiles (≤4000px each) at your screen's resolution. Each frame copies the visible tiles, draws a handful of perspective polygons, and a few dozen pre-rendered sprites (people, cars, props, neon). The street stops rendering while you're inside a store.
