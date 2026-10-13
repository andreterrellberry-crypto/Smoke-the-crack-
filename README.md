# Smoke the Crack — Global Resell Block

Vintage grails sold on one block in the hood, drawn like a Saturday-morning cartoon show: flat saturated colour, thick black contour lines, a hand-drawn MAD-style cast (grotesque caricatures with huge noses, bulging lidded eyes and toothy grins) played as cut-out puppets on held frames for that jumpy, bouncy cartoon timing, lit with a warm key light and cool shadow, signage-style UI, and streets that recede in one-point perspective. The site opens looking straight down at the block, sweeps along the rooftops, then drops you onto the sidewalk. Every storefront reps a real neighbourhood on its continent, with an owner dressed for those streets. Walk up, step through the door, and shop their racks.

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
| **Booster Corner** (alley) | Half off or less | — | The booster: hood up, face in shadow, gold grill. “Ain’t nobody got these.” |
| Boutique du Bloc | Europe | Saint-Denis (93), Paris | Karim “Sacoche” Benali: survêt, sacoche, TNs |
| Odogwu Vintage | Africa | Yaba, Lagos | Chidi “Odogwu” Okafor: bucket hat, Naija jersey, cargos |
| Ura-Hara Stash | Asia | Shinjuku, Tokyo | Ryo “Kaiju” Tanaka: bleached spikes, camo hoodie |
| Westie Grails | Oceania | Mount Druitt, Western Sydney | Jayden “Shaz” Wilson: polo, bumbag, TNs, socks up |
| **Hammerdome Auction Hall** (end of the block) | Live auctions | — | Hoss Hammerdome: white suit, handlebar moustache, a ten-gallon hat taller than his torso, gavel in hand |

- **No stock = under construction.** Any region with zero items is boarded up with scaffolding, caution tape and cones, and can't be entered. Add stock and it opens automatically.
- **Inside a store** the marketplace lists that region's pieces, with country chips to filter. The city each piece came from shows on its card.
- **Booster Corner**: a van backed into the alley with its rear doors open. Tap the trunk and the camera zooms into it. Everything in the trunk is 50% off retail or more (the old price is slashed on every card) and none of it is sold anywhere else on the block. The booster runs his corner on his own: leans on the van, paces the sidewalk, keeps lookout both ways, counts his cash, and walks back to hustle you when you come close.
- **Hammerdome Auction Hall**: marble columns, a gold dome and a red carpet where Antarctica used to be. A scrolling LED marquee over the doors shows the lot and bid live from the street. Inside, Hoss Hammerdome chants the room through one-off lots you can't buy anywhere else: rival paddles (each with their own ceiling and nerve) bid against each other and against you, a late bid buys ten more seconds, and he calls it, going once, going twice, SOLD. Win and the lot drops into your bag at the hammer price.
- **Owners run their shops from behind the counter**, waist-deep behind it like a real till. Tap a shop to walk in.

## Files

| What | File |
| --- | --- |
| Stores, owners, inventory, booster stock, auction lots | `src/data/inventory.js` |
| The live auction: lots, rival bidders, soft close, calls | `src/auction/engine.js` |
| Auction panel: the lot, live bid, clock, paddle, bid feed | `src/ui/auction.js` |
| Cartoon toolkit (shapes, tubes, splines, lettering, palette) | `src/toon/toon.js` |
| The cast: hand-drawn art in `src/assets/cast/`, played as cut-out puppets (lean, breathe, head tilt and nod, squash, stretch, hop, and a walk that parts the legs along their traced seam) with per-scene lighting | `src/cast/puppet.js` |
| Melvin the stoop dog, the alley cat, pigeons | `src/cast/animals.js` |
| Traffic | `src/toon/critters.js` |
| Neighbourhood storefronts, the Hammerdome, the van, construction, street furniture | `src/toon/facades.js` |
| Street engine: camera, perspective pass, cross streets, people, traffic, neon | `src/toon/street.js` |
| Aerial intro | `src/toon/aerial.js` |
| Store interiors, the trunk close-up, the auction hall | `src/toon/interior.js` |
| Flat garments | `src/toon/items.js` |
| Marketplace panel, bag, search | `src/ui/market.js` |
| Flow (intro → street → door → interior) | `src/main.js` |

### Adding stock
Add a city to `LOCATIONS`, items to `RAW`, and make sure the country is listed in one store's `countries`. Window displays, racks, counts and the directory all update on their own. Booster Corner stock lives in `BOOSTER_RAW` (retail price, then the booster's price), and auction lots in `AUCTION_RAW` (estimate low and high, then the opening bid).

## Controls
- Drag, scroll, or ← → to walk the block. The directory bar under the header jumps to any store.
- Tap a storefront to walk to it and go inside. `Esc` closes panels and leaves a store.
- Search finds stores, regions, countries, brands and cities, then walks you to the right door.

## Moving parts
Characters animate on held frames, 12 a second, and run their own routines: owners greet you, then pitch, glance around, lean on the counter, bop to the music, laugh and hop, leaning in to talk up a piece when you look at it and cheering when you bag one; the booster paces, keeps lookout and hustles; Hoss Hammerdome chants, points his gavel and slams it on every SOLD while paddles shoot up in the crowd; side walls and cross streets swinging in perspective as you walk, traffic lights cycling with a walk / don't-walk hand, Melvin the hound asleep on the stoop snoring Z's, laundry flapping over Rocinha, cars bouncing with exhaust puffs, pigeons that scatter, flickering neon, manhole and alley steam, generator smoke, sneakers swinging on the power line, birds and drifting clouds. Walking through a door slams a show-style title card for that store.

## Performance
The block and skylines are drawn once into off-screen tiles (≤4000px each) at your screen's resolution. Each frame copies the visible tiles, draws a handful of perspective polygons, and a few dozen sprites (the cast, cars, props, neon). The street stops rendering while you're inside a store.
