# AGENTS.md

Smoke the Crack is a vintage resell shop that you walk through as a MAD Magazine / MAD TV cartoon city block. It is built with Vite 7 and vanilla JS on canvas.

**Before touching art, environments or rendering, read `docs/HANDOFF.md`.** It covers the owner's requirements, what failed, the disconnects to fix, the engine contracts and the backlog. ChatGPT art prompts are in `art/PROMPTS.md`.

## Commands
```
npm install
npm run dev                                   # http://localhost:5173
npm run build && npx vite preview --port 4173
node tools/shots/shots.mjs --url http://localhost:4173/ --out shots   # screenshots + error check, exits 1 on console errors
python3 tools/art/cut_sheet.py art/<sheet>.png --list                  # cut ChatGPT sheets into WebP sprites
python3 tools/art/rulers.py src/assets/cast/*.webp --out /tmp/rulers.png
```

## Non-negotiables
- **Never draw characters in code.** Characters come from ChatGPT art cut with `tools/art/cut_sheet.py`. Every procedurally drawn character was rejected.
  - If art is missing, add a prompt to `art/PROMPTS.md` and ask the owner for the named files. Do not fake it.
- **Style:**
  - MAD Magazine × MAD TV, with thick hand-inked lines and flat cel color.
  - No vector-perfect or bubbly shapes, no overlapping inner lines, no airbrush gradients.
  - Held-frame animation at 12 fps (`Math.floor(t * 12)`).
- **Store owners:**
  - Behind the counter, waist-deep, facing the customer.
  - The head is never cut off by the header, the back button or the bubble, and the owner never floats above the counter.
- **Shop rules:** Booster Corner items are 50% off or more and found nowhere else. Auction lots are one-offs found nowhere else.
- **Environment art plugs into the existing contracts** (`docs/HANDOFF.md` §5):
  - Facade painters return `{door, top, roofL, roofR, wallL, wallR, windows, neon}`.
  - Dynamic overlays (window stock, neon, ticker, lot screen, van cargo) stay in code.
- **Keep `?inline` image imports** (one portable bundle). Watch the size budget (`docs/HANDOFF.md` D14).

## Before every commit
- `npm run build` passes.
- `tools/shots/shots.mjs` exits 0.
- Street fps is 55 or more on desktop.
- **You opened the screenshots and looked.** The owner judges images, not code.

## Code style
- Match the surrounding code: compact helpers, short comments that explain why, world units in scene code.
- No new runtime dependencies or frameworks.
- Sources go in `art/`, shipped WebP in `src/assets/`. Never hand-edit cut sprites.
- Owner communication: brief and direct.
  - When they ask for a full sweep, do all of it.
  - Offer suggestions only when they move the original idea forward.
