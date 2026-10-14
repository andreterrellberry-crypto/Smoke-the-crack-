# Handoff: art, environments, adaptation

Read this whole document before you change any art or rendering code.

The site works. Shopping, the bag, the auction, the Booster stash, the aerial intro and the walkable block are built and tested. What is left is mostly **art direction**: the cast is hand-drawn art, while everything around it is still drawn in code, and the two don't match. Your job is to close that gap without breaking the parts that work.

---

## 0. Read first (the short version)

1. **The owner wants MAD Magazine × MAD TV (the 2010s animated show).**
   - Thick hand-inked lines, flat cel colors and grotesque caricature.
   - Jumpy held-frame animation, with lighting.
   - Every procedurally drawn character was rejected. **Do not draw characters in code.** Characters come from ChatGPT art (`art/PROMPTS.md`) and are cut with `tools/art/cut_sheet.py`.
2. **The biggest disconnect is the environments.**
   - Facades, interiors, props, cars, animals, garments and the aerial view are flat vector shapes drawn in code.
   - The cast is painted, hand-inked art.
   - The fix is painted environment art (Prompt 3) dropped into the existing engine contracts (§5).
3. **Never ship a regression to work the owner has already approved.**
   - Owners stay behind the counter, waist-deep, with the head never cut off.
   - Booster prices stay at 50% off or more.
   - Auction lots stay one-offs.
   - The page runs at 55–60 fps on desktop with no console errors.
4. **Verify by looking.** Run `node tools/shots/shots.mjs` and open the PNGs after every change. The owner judges screenshots, not code.

---

## 1. The owner's non-negotiables (their words)

- "just like mad magazine and madtv with lightening and animation style"
- "Line work is low quality still overlapping lines and extra circles and no hand drawn feeling at all I need it to match reference exactly"
- "overlapping and messy line work bubbly designs and limited mobility"
- "I want them to actually be looking at you head on when you enter"
- "if it's their store they should run it from behind the counter while pedestrians walk around in the clothes"
- "they need more then a bounce animation and can't be phased above the counter it kills all immersion"
- "bring each one specific to the level of the counter so they're not cut off by the top or bottom"
- "If you need newer art then say that I can provide you with more but specific to your needs and be thorough"

How to work with the owner:
- They will make more ChatGPT art when asked. **Ask for specific art instead of faking it in code.**
  - Add the request to `art/PROMPTS.md` in the same format.
  - Tell the owner exactly which file names to send back.
- They want things done fully. Do not ship a half-converted scene, where some pieces are painted and others still code-drawn, unless the painted pieces clearly look better on their own.
- Keep messages brief.

---

## 2. Current state

| Area | State | Where |
| --- | --- | --- |
| Cast (7 owners + Booster) | Hand-drawn ChatGPT lineup, cut to WebP, animated as band-warp puppets | `src/cast/puppet.js`, `src/assets/cast/` |
| Owners in stores | Waist-deep behind the counter, autonomy brain (ACTS). **3/4 view, not head-on yet** | `src/toon/interior.js` `drawOwner`, `src/main.js` `brainFor` |
| Booster on the street | Walks, keeps lookout, counts cash, leans and hustles when you're near | `src/toon/street.js` booster brain (`bst`) |
| Auctioneer, Hoss Hammerdome | **Placeholder**: gold-rimmed code silhouette | `src/toon/interior.js` `drawAuctioneer` |
| Walking pedestrians | **Missing.** Blocked on `crowd.png` | §6.3 |
| Store facades (7) + alley + Hammerdome | Code-drawn flat vector | `src/toon/facades.js` |
| Interiors, counters, trunk, auction hall | Code-drawn flat vector | `src/toon/interior.js` |
| Street props, cars, dog, cat, pigeons | Code-drawn | `src/toon/facades.js`, `src/toon/critters.js`, `src/cast/animals.js` |
| Garment icons (cards, windows, racks, bag) | Code-drawn by type, tinted per item | `src/toon/items.js` |
| Aerial intro | Code-drawn top-down view | `src/toon/aerial.js` |
| Auction engine and panel | Done, tested | `src/auction/engine.js`, `src/ui/auction.js` |

---

## 3. Art history (what failed and why)

| Commit | What it tried | Owner's reaction | Root cause |
| --- | --- | --- | --- |
| `d7ea69a` | Block redrawn "hand-inked" in canvas | Not MAD enough | Canvas strokes have uniform width, so the result reads as vector |
| `832e398` | Flat cartoon show plus live perspective | The perspective was kept | — |
| `ce5fb4b` | Detailed MAD TV characters in code, held frames | "Line work is low quality… overlapping lines and extra circles" | Built from stacked primitives (circles for hands, chains, curls): each one adds an outline, so lines cross inside the silhouette |
| `9b81e71` | Cast rebuilt from reference frames, still in code | Same complaint | Same: primitives, not drawings |
| `c59f39f` | Brush-ribbon ink engine: tapered, wobbling, outline under fill | "overlapping and messy… bubbly… limited mobility" | Procedural shapes are rounded and inflated, and joints can't bend convincingly. **Code can't draw MAD caricature.** |
| `d069af6` | ChatGPT lineup cut into puppets | Accepted as the cast | — |
| `cd742de` | Owners waist-deep behind the counter | "no other animation except what ChatGPT did… lazy" | Band-warp only leans and bobs: no arms, mouth or eyes |
| `6899c92` | Autonomy brains, Booster walk, auction, counter fit | Pending art for pedestrians, auctioneer and head-on owners | The animation ceiling is the art: one pose per character |

**Lessons:**
- Code is for **layout, motion, lighting and data**. It is not for drawing anything the owner looks at closely.
- Every time a new kind of art was needed, the right move was to ask the owner for it, and every attempt to fake it was rejected.
- If a scene needs a new pose or a new piece, write the prompt and ask.

---

## 4. The disconnects

Each entry has a symptom, the code involved, a fix path and when it counts as done.

### D1. The environments clash with the cast (biggest)
- **Symptom:** painted, hand-inked characters stand in front of flat vector buildings and rooms, like two different shows composited together.
- **Code:** `facades.js` (every `FACADES[...]`, `paintBoosterCorner`, `paintAuctionHouse`, props), `interior.js` (`ROOMS`, `buildRoom`, `buildCounter`, `buildTrunkScene`, `buildAuctionHall`, `buildPodium`).
- **Fix:**
  - Get Prompt 3 art and swap it in through the contracts in §5.
  - Keep code only for what is dynamic: window displays, neon, the ticker, doors and hit areas, the construction overlay, steam and smoke, the lot screen.
- **Done when:**
  - The `shots` street, store and auction screenshots show no code-drawn building or room surfaces.
  - The dynamic overlays sit inside the empty regions the art left for them.

### D2. Line weight and resolution don't match across scenes
These are measured numbers.
- **Source sizes:** the cut figures are 472–723px tall (for example `tbone` 494, `fresh` 723, `booster` 660).
- **Street:** figures are drawn `castPx * 0.1` units tall (`SPX`). At R=4 that is roughly a 0.4× downscale, so inked lines come out about 3px. Facade `LW = 0.8` units comes out about 3.2px, which matches.
- **Interiors:**
  - Owners are drawn `H = 80 / cut` units (about 138 units for T-Bone) at room R up to 6, which is an **upscale of roughly 1.7×**. Their lines turn soft and about 12px wide, against room lines of about 5px.
  - The trunk Booster (`H = 230`) is upscaled about 2×.
  - This is the "blurry, cheap" look.
- **Fix:**
  - Source art for close-ups must have at least as many pixels as it shows on screen.
  - Head-on owners in `owners_front.png` are about 450px waist-up, which lands near 1:1.
  - When registering new art, check `drawn px / source px ≤ 1.1` at R=6 and log a warning in dev otherwise.
  - Author environment art so its outlines land within ±25% of the cast's outlines in the same scene.
  - Formula: `on-screen line px = source line px × (drawn px / source px)`.
- **Done when:** in the `desk` and `phone@3x` shots, character and set outlines are about the same thickness, with no upscale blur on faces.

### D3. Overlay lighting fights cel shading
- **Symptom:**
  - `drawPuppet` lays a soft `source-atop` gradient over each figure (`LIGHT.day`, `LIGHT.night`, `shopLight`).
  - The art already has hard cel shadows lit from the upper left, so the gradient looks airbrushed, which the style bible bans.
  - The code-drawn sets have no light at all.
- **Fix:**
  - Replace the gradient with a **flat scene tint** (`multiply` with one color per scene) plus an optional **hard rim**: a one-sided offset silhouette in the light color, clipped to the figure.
  - Apply the same tint to the set layers, so the room and the person sit in the same light.
  - The Booster at night: a navy multiply plus the gold trunk lamp as a hard rim.
- **Done when:** no visible gradient banding on figures, and figure and set share one light color per scene.

### D4. Animation ceiling: one pose per character
- **Symptom:**
  - Band-warp (lean, breathe, tilt, nod, squash, hop) is the only motion. Arms never move, the mouth never talks, the eyes never blink.
  - The owner called this "lazy".
- **Code:** `POSES` and `drawPuppet` in `puppet.js`; `ACTS` in `main.js`.
- **Fix: a replacement-pose system on top of band-warp.**
  - **Pose images:** `CAST[id].poses = { wave: img, point: img, laugh: img, cross: img }`, cut from `<name>_front_poses.png`. Every pose image is registered to the same **belt line** (the flat waist cut) and **centre x**, so swaps don't jump.
  - **Drawing:** `drawPuppet` draws `P.img` when a pose names one, and still applies band-warp on top for the in-between wobble.
  - **Choosing poses:** `ACTS[...].pose` returns pose names. Fall back to band-warp parameters when that art doesn't exist.
  - **Mouth and eyes:** cut a closed-mouth and an open-mouth patch, plus an eyes-shut patch, from each pose. Store them with their offsets. Swap the mouth while a line is on screen (talk = open/closed alternating every 2–3 held frames) and blink every 3–5s.
  - **Missing patches:** if the art has no separate mouths, request a mouth sheet per character (closed, open, wide, "O"), drawn at the same scale as the figure.
- **Done when:** the owner gestures with the arms, the mouth moves while the bubble talks, and the eyes blink, all at 12 fps held frames.

### D5. The walk works only on art with a gap between the legs
- **Symptom:** the leg-seam walk (`legs()` traces the gap, and rows below the knee shear apart) tears on Karim's tracksuit and on anything with touching legs or hands over the legs. That's why only the Booster walks.
- **Fix:**
  - `crowd.png` must have the legs apart and the hands clear of them (the prompt says so).
  - Run `legs()` on each crowd figure and reject any figure whose traced gap is under 3px for more than 25% of the leg rows. Ask for a redraw instead of shipping a torn walk.
  - Better, if the owner will make it: a **4-frame walk cycle per pedestrian** (contact, down, pass, up), facing right, all registered to the same foot line. Play them as replacement frames at 8–12 fps, with band-warp only for bounce.
- **Done when:** pedestrians walk across `desk` and `phone` shots with no torn pixels between the legs and no sliding feet.

### D6. Owners aren't head-on
- **Symptom:** the lineup is in 3/4 view, so in the shop the owner looks off to the side instead of at the customer.
- **Fix:**
  - Cut `owners_front.png` and register each figure as `CAST[id].front` (its own img, neck, cut).
  - `drawOwner` uses `.front` when it exists. The street and portraits keep 3/4.
  - These are already cut flat at the belt, so `counter = 1.0` (the bottom of the image is the counter line) and `SHOW` stays at 80 units.
- **Done when:** all 7 store shots show the owner facing the camera, the belt hidden exactly at the counter top, and the head clear of the header on phone.

### D7. The auctioneer is a placeholder
- **Code:** `drawAuctioneer(ctx, cx, podY, t, gavel)` in `interior.js`, with podium `POD = {x: 92, y: 74, w: 52}`.
- **Fix:** cut `auctioneer.png` into 6 waist-up poses and add `CAST.auctioneer` with a `poses` map (D4). Map the engine events from `auction.on` in `main.js`:

  | Event | Pose |
  | --- | --- |
  | `lot` | chant (with a talk mouth swap if available) |
  | `bid` (rival) | point |
  | `call` once/twice | gavel raised |
  | `sold` | slam for 0.25s, then arms wide (SOLD) |
  | intermission | hat tip |

  - The waist cut sits on the podium top (`POD.y`).
  - Size him so the hat is clear of the header at the `desk` and `phone` shots (`focusX = 136`, `phoneFocus*`).
  - Replace `auctioneerPortrait` with a crop of the chant pose.
- **Done when:** the auction shots show Hoss, not a silhouette, and the gavel pose changes on bids and on SOLD.

### D8. Scale isn't consistent between scenes
| Scene | Figure height |
| --- | --- |
| Street | `castPx × 0.1` units (T-Bone 49, Fresh 72, so the relative heights are kept) |
| Interior | `80 / cut` units visible waist-up, in a 150-unit room |
| Trunk | Booster at 230 units |

- **Rules to keep:**
  - Relative heights between characters stay as in the lineup, in every scene.
  - Painted sets are authored to these units (§5), so a set never needs per-scene fudge factors.
  - Any new scene picks one figure scale and documents it here.

### D9. The live perspective needs edge colors from the art
- **Symptom:** the street's one-point perspective draws building side walls and cross streets live, using each facade's `roofL`, `roofR`, `wallL` and `wallR`.
- **Problem:** painted facades must still return these values, or the side faces will be the wrong color and height.
- **Fix:**
  - When loading a painted facade, sample the left and right edge columns (median color, ignoring ink) for `wallL` and `wallR`.
  - Take `roofL` and `roofR` from the first opaque row at each edge.
  - Let the JSON sidecar override any of these.
- **Done when:** walking the block shows side walls that match the painted fronts.

### D10. Dynamic overlays need empty space in the art
Code still draws, over the painted art:

| Overlay | Code |
| --- | --- |
| Window displays of real stock | `display(...)` |
| Neon signs (on/off by open state) | `neon(...)` |
| The Hammerdome ticker and bulbs | `drawTicker` |
| Doors (hover, tap and the walk-in target) | `door` |
| The construction overlay for closed stores | `construction(...)` |
| Laundry | — |
| Steam and smoke | — |
| The lot screen | `SCREEN` |
| The van's cargo | `vanRear` |

- Prompt 3 tells the owner to leave windows, the marquee screen, the alley floor and the cargo space empty.
- The sidecar JSON (§5.2) gives each of these regions in units.
- **Done when:** every overlay lands inside its painted frame on every facade.

### D11. Mobile framing collisions
- **Symptom:** on phone with the panel open, the dialogue bubble covers the counter, and the back button and header crowd the head.
- **Code:** `frameRoom()` in `main.js` (`minTop` 72 desktop / 150 phone, `phoneBust`, `phoneFocusX/Y`, `bustFX`).
- **Fix:**
  - Compute the free rectangle (viewport minus header, back button, bubble and sheet) from the DOM.
  - Fit `band` (head to counter top) inside it, rather than using constants.
- **Done when:** in the `phone` store and auction shots, both open and closed, the head and the counter top are fully visible and nothing UI sits on the face.

### D12. Removed pieces to bring back
- **Pedestrian card:** tap a pedestrian to see and bag the piece they wear. It was in `src/main.js` (`showPed`, `#ped-card`) at commit `c59f39f`; restore it with the crowd (§6.3): `git show c59f39f:src/main.js`.
- **Window neighbours:** the people in the upstairs windows. Bring them back only as painted art, never code-drawn.

### D13. Garments, animals, cars and the aerial are still code-drawn
- **Garments:** `items.js` draws 9 garment types tinted by `it.color`. Prompt 3 H asks for white-and-ink garments. Load them, then tint with `multiply` (white becomes the item color, ink stays black). Keep `itemURL` and `itemImg` as the API, so cards, windows, racks and the bag all switch at once.
- **Animals and cars:** Prompt 3 G asks for animals and cars. Animals become held-frame sprites. For cars, keep the body and spin the separate wheels.
- **Aerial:** lowest priority. It is only seen for about 3 seconds. Reuse painted roof crops later.

### D14. Size budget
- **Current build:** the `dist` JS is about 589KB, and about 340KB of it is the 8 inline cast WebPs.
- **The rule:** cast sprites are imported with `?inline` so the build is one portable bundle. Keep that working: `npm run build` and `npx vite preview` must show every image with no extra server.
- **Painted environments:** save them as WebP (quality 82–88) at the needed resolution only (§5.1).
  - Budget about 3MB for all environment art; aim for under 6MB total.
  - If it grows beyond that, switch environments to normal Vite asset imports (hashed files in `dist/assets`, which works with `base: './'`) and lazy-load each store's room when its door is tapped.

---

## 5. Environment architecture and how painted art plugs in

### 5.1 Units, anchors and source sizes

| Thing | World units | Anchor | Source art (ChatGPT) | Units per source px |
| --- | --- | --- | --- | --- |
| Store facade | `SW = 160` wide, about 140–170 tall above the ground line | Bottom edge = `G = 192` (building line), x = `seg.x` | 1024×1536, transparent sky | 0.156 |
| Booster alley | `ALLEY_W = 100` wide | Bottom = `G` | 1024×1536 | 0.098 |
| Hammerdome | `AUC_W = 210` wide | Bottom = `G` (steps and carpet run to the curb at 216) | 1024×1536 | 0.205 |
| Store room | `RW × RH = 300 × 150` | Full frame, floor at y = 118 | 1536×1024, **cropped to a 2:1 strip** (drop 1/8 top and bottom) | 0.195 |
| Counter | Spans x ≈ 50–176, top at `COUNTER_Y = 104` | Full-frame layer drawn over the owner | 1536×1024 transparent, crop to match the room | 0.195 |
| Auction hall | `AW × AH2 = 300 × 150` | Podium top `POD.y = 74`, lot screen `SCREEN = {170, 22, 96, 70}` | 1536×1024, cropped to 2:1 | 0.195 |
| Trunk close-up | `TW × TH = 240 × 170` | Full frame | 1536×1024 (crop the width to 1.41:1) | 0.156 |

The street is drawn into pre-rendered tiles (each 4000px or less) at resolution `R = pickR()` (2–5 device px per unit), and interiors at `roomR()` (3–6).
- **Downscaling the sources:** scale each one once, at load, to `units × R`, using the stepwise halving in `sized()` in `puppet.js`. Never let the browser downscale by more than 2× in a single draw.
- **Drawing order:** paint the facade image into the tile *where the code facade used to paint*. The existing painters in `street.js` (around line 115) already loop over `segs`, so switch on "has painted art" there.

### 5.2 Sidecar JSON per painted piece

Put the source in `art/env/`, the shipped WebP in `src/assets/env/`, and a sidecar like `src/assets/env/front_north-america.json`. Coordinates are in **source pixels**; the loader converts them to units.

```json
{
  "w": 1024, "h": 1536,
  "door": [430, 1180, 160, 356],
  "windows": [[90, 1220, 300, 230], [640, 1220, 300, 230]],
  "neon": [[700, 1150, 200, 40]],
  "sign": [80, 1040, 864, 110],
  "roofL": 210, "roofR": 210,
  "wallL": "#c83a22", "wallR": "#c83a22",
  "extra": { "laundry": [600, 380, 900, 380] }
}
```

The facade function then returns exactly what it returns today: `{door, top, roofL, roofR, wallL, wallR, windows, neon, ...extras}`. The values are converted to units, and `top` = the sign top minus 20 for the hover tag. The rest of `street.js` never knows the art changed.

To measure, run `tools/art/rulers.py` on the source (`--height` set to its real height so a 10% line = h/10 px), or read boxes from any image viewer. Keep a code-drawn fallback for any piece without art until the whole set is in.

### 5.3 Interiors
- **Layer stack** (back to front):
  1. `room_<store>` (back wall, racks, floor)
  2. the owner (`drawOwner`)
  3. `counter_<store>`
  4. live overlays (the rack stock that shows real items, if the owner wants it live)
- **Placement:** room and counter share one crop rectangle, so they line up automatically.
- **Counter registration:** the counter's top edge must land on `COUNTER_Y = 104`. Measure the counter top in the source image, then offset the crop.
- **What can go:** `buildRoom` currently paints racks of the store's real items. Painted racks replace that. Keep `rack(...)` only if the owner wants the real stock visible on the racks.

---

## 6. Character art adaptation pipeline

### 6.1 Steps
1. **Save** the owner's PNG into `art/` with the exact file name from `art/PROMPTS.md`.
2. **Cut it:**
   ```
   python3 tools/art/cut_sheet.py art/<sheet>.png --list                    # see the blobs it finds, in reading order
   python3 tools/art/cut_sheet.py art/<sheet>.png --out src/assets/<dir> --names a,b,c,...
   ```
   - `--min-area` drops specks.
   - `--join` merges a figure that split into pieces (for example a hat floating above a head).
   - `--chroma` keys out a flat `#00FF00` background.
   - Check the output: the soft anti-aliased edge must be kept, and nothing cropped.
3. **Measure:**
   ```
   python3 tools/art/rulers.py src/assets/<dir>/*.webp --out /tmp/rulers.png
   ```
   Read off these fractions of the figure height and width: `neck` (chin and neck join), `hip` (the waist), `nx` (neck x), `hx` (face centre x), and `counter` if it differs from `hip`.
4. **Register** it in `CAST` in `src/cast/puppet.js`, imported with `?inline`.
5. **Verify** with `node tools/shots/shots.mjs` and look at every shot it touches.

### 6.2 Head-on owners (`owners_front.png`)
- **Cut:**
  ```
  cut_sheet.py art/owners_front.png --out src/assets/cast --names tbone_front,fresh_front,mandrake_front,karim_front,chidi_front,ryo_front,shaz_front
  ```
- **Register:** add each to its owner's `CAST` entry as `front: { src, neck, nx, hx }`. These are waist-up, so the counter cut is the bottom edge.
- **Draw:** in `drawOwner`, when `m.front` exists, use `H = SHOW / 1.0` and anchor the bottom at `COUNTER_Y + 5`. Keep `ownerBand` the same.

### 6.3 Pedestrians (`crowd.png`)
- **Cut:**
  ```
  cut_sheet.py art/crowd.png --out src/assets/crowd --names p1,...,p8
  ```
- **Data:** add a `CROWD` list mapping each figure to its stock item id (the outfit table in `art/PROMPTS.md`). Look the items up by name and brand in `src/data/inventory.js`.
- **Street brain:** spawn 6–10 walkers in `street.js`. Each has its own speed (14–24 units/s), a direction (flip to walk left), stops at windows, window-shopping turns, and crossing at the cross streets. Draw each with `drawPuppet(..., { walk: phase, flip })` at `castH`.
- **Tap:** tapping a walker opens the restored pedestrian card (D12): the item card, with "Bag it" going through `market`.
- **Quality gate:** apply the D5 gap check before shipping any figure.

### 6.4 Auctioneer (`auctioneer.png`)
- **Cut:**
  ```
  cut_sheet.py art/auctioneer.png --out src/assets/cast --names hoss_chant,hoss_point,hoss_raise,hoss_slam,hoss_sold,hoss_tip
  ```
- **Wire up:** register them in `CAST.auctioneer.poses` and replace `drawAuctioneer` (D7).

---

## 7. Code map and contracts

| File | Owns |
| --- | --- |
| `src/main.js` | App wiring, scenes, the owner brain (ACTS), `frameRoom`, the frame loop, auction event handling |
| `src/toon/street.js` | Layout (`buildLayout`), tiles, live perspective, booster brain, traffic, hover, hit test, ticker |
| `src/toon/facades.js` | Facade painters + props. **Contract:** `FACADES[id](ctx, x, G, r, items, R)` returns `{door, top, roofL, roofR, wallL, wallR, windows, neon, ...}` |
| `src/toon/interior.js` | Rooms, counters, owner placement (`drawOwner`, `ownerBand`), trunk, auction hall, podium, lot screen, audience |
| `src/cast/puppet.js` | `CAST`, `loadCast`, `drawPuppet(ctx, id, x, y, H, P, o)`, `POSES`, `puppet(id)`, `LIGHT`, `shopLight`, `puppetPortrait` |
| `src/cast/animals.js` | Code-drawn dog, cat and pigeons (to be replaced) |
| `src/toon/items.js` | Garment icons: `itemCanvas`, `itemURL`, `itemImg` |
| `src/toon/aerial.js` | Aerial intro |
| `src/auction/engine.js` | Auction. `createAuction({isWon})` returns `{tick, on, bid, state}`; events are `lot`, `bid`, `call` and `sold`, each with a `line` |
| `src/ui/market.js`, `src/ui/auction.js` | The shop panel and the auction panel |
| `src/data/inventory.js` | Stores, items, `BOOSTER_ITEMS` (50%+ off), `AUCTION_LOTS` (one-offs) |

**Scene object** (from `storeScene`, `trunkScene` or `auctionScene` in `main.js`):
- **Required:** `{ kind, bg, w, h, focusX, focusY, bustH, bustFX, band, who, where, line }`.
- **Optional:** `actor`, `draw(frame)`, or `drawLive(ctx, t, dt)` (the auction uses it, which skips the brain), `phoneFocusX`/`phoneFocusY`, and `portrait()`.

**Animation timing:**
- Held frames run at 12 fps: `tk = Math.floor(t * 12)`, `beat = tk >> 2`.
- New pose art must keep this timing. Never animate characters smoothly at 60fps; that reads as "flash game", not MAD.

**Owner brain (ACTS):**
- Weighted idle acts, a greet then a pitch on entry.
- Reactions from `market` `onActivity`: `'look'` (card hover) and `'add'` (bagged).
- Each ACT maps beats to poses. When pose art arrives, it maps beats to pose *names*.

---

## 8. Testing

```
npm run build && npx vite preview --port 4173 &
node tools/shots/shots.mjs --url http://localhost:4173/ --out shots
```

- **What it runs:**
  - Scenarios: `street`, `stores`, `booster`, `auction`.
  - Sizes: `desk`, `phone` (add `wide` for ultrawide).
- **What it checks:**
  - It prints one JSON line per run, with fps for the street, the bag count for the booster and the bid result for the auction.
  - It exits 1 on any console or page error.
- **What to look at:** open every PNG it writes. Check outline thickness, blur, heads and counters, overlays inside their frames, and the bubble and header against faces.
- **Before committing:**
  - The build passes.
  - `shots` exits 0.
  - Street fps is 55 or more on `desk`.
  - You looked at the images.

---

## 9. Conventions
- Vanilla JS with Vite 7 (`build.target: 'es2022'`, top-level await is OK). No frameworks, no new runtime dependencies.
- Match the surrounding code: short comments that explain *why*, compact helpers, world units everywhere (never raw pixels in scene code).
- Art sources go in `art/` (PNG as delivered). Shipped assets go in `src/assets/...` as WebP with an alpha channel.
- Never edit cut sprites by hand. Fix them by re-cutting or by asking for new art.
- Keep `README.md` §Files up to date when you add modules.

---

## 10. Priority backlog

1. **Painted storefronts + alley + Hammerdome** (D1, D9, D10). Send Prompt 3 A to the owner first; it is the most visible change.
2. **Head-on owners** (D6), then **pose and mouth swaps** (D4). Needs `owners_front.png` and the optional pose sheets.
3. **Pedestrians + pedestrian card** (D5, D12, §6.3). Needs `crowd.png`.
4. **Hoss the auctioneer** (D7). Needs `auctioneer.png`.
5. **Painted rooms + counters + auction hall + trunk** (D1, §5.3), with **flat scene tint lighting** (D3) done in the same pass.
6. **Line-weight and resolution audit** across all scenes (D2), plus **phone framing from the DOM** (D11).
7. **Garments, animals, cars** (D13). Aerial last.
8. **Size budget check** (D14) after each batch.

Whenever art is missing for an item, add or refine its prompt in `art/PROMPTS.md`, then tell the owner the exact file names you need and move to the next item.
