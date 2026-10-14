# Art prompts (ChatGPT image generation)

All character and environment art for this site comes from ChatGPT image generation, in **one ongoing ChatGPT chat** that already holds the cast lineup (`art/cast_lineup.png`). Keeping everything in that chat is what keeps the style and the faces consistent. Each prompt makes images one at a time and waits for `NEXT`.

If a result drifts from the lineup, reply "match the cast lineup exactly" and re-upload `art/cast_lineup.png`. If pieces touch or overlap, ask for it again "with more empty space between every piece". `tools/art/cut_sheet.py` needs those gaps.

Status:
- **Done:** Prompt 1, which produced `art/cast_lineup.png`.
- **Requested but not received yet:** Prompt 2 (auctioneer, crowd, head-on owners).
- **Not yet given to the owner:** Prompt 3 (environments).

---

## Rules every sheet must follow (what the code can adapt)

- **Background:** transparent PNG. If transparency fails, use flat `#00FF00` green and cut with `--chroma`.
- **Spacing:** every figure or piece is completely separate, with at least 40–60px of empty space around it. The cutter finds pieces as separate blobs.
- **No extras:** no text, labels, arrows, ground shadows, frames or backgrounds unless the prompt asks for them.
- **Scale:** the same scale for every figure in one sheet, and across a character's sheets.
- **Facing:**
  - Walkers and street figures face **right** in three-quarter view. The engine mirrors them to walk left. Shirt numbers and text will mirror too, so prefer art without lettering on the back.
  - Owners behind the counter and the auctioneer face **the viewer head-on**, cut off in a **flat horizontal line at the belt**.
- **Pieces for animation:** walking figures need a **visible gap between the legs from crotch to shoes** and **hands that don't overlap the legs**, because the walk splits the legs along that gap (see `docs/HANDOFF.md` §6). Rig parts get rounded, slightly extended joint ends.

---

## Prompt 1 (done): the cast lineup → `art/cast_lineup.png`

The full original prompt asked for:
- a style bible;
- the eight characters;
- model, parts and pose sheets for each character.

Only the first image, the lineup, has been produced and used. The style bible below is the part that matters for every later prompt:

```
• Look: MAD Magazine comic art crossed with the 2010s MAD animated TV show. Gross-out, grotesque, hilarious caricature.
• Line: thick, confident, hand-inked black brush lines with real thick-to-thin variation, tapered ends, outer silhouette heavier than inner detail lines. Slightly wobbly and organic, never vector-perfect, never bubbly or inflated.
• Anatomy: huge droopy noses (sausage, potato, hook, carrot) hanging past the face; bulging googly eyes with tiny pupils and heavy droopy magenta/purple eyelids; big toothy grins with gaps, crooked or gold teeth; long scrawny necks with an Adam's apple or no neck at all; skinny arms; giant knobby hands with sausage fingers and visible knuckles; pot bellies; knobby knees; oversized clown-like shoes.
• Faces: three-quarter view, sweaty, stubbly, wrinkly, warty details, eye bags, nose and ear hair, big expressive brows.
• Exaggerate personality and attitude, NOT ethnicity. Every skin tone natural and respectful; the caricature comes from the shapes.
• Color: flat, saturated cel colors; warm peachy-salmon skin on lighter characters, rich browns on darker ones.
• Lighting: light from the UPPER LEFT; one hard-edged cel-shadow tone (~20% darker, same hue) on the lower-right of every form; a small white specular hit on noses, eyeballs, sneakers, gold and shiny fabric; a thin warm rim light on the right edge of the head and shoulders. No airbrush gradients, no background shadow.
```

The cast it produced, left to right:

| File prefix | Character | Store |
| --- | --- | --- |
| `tbone` | Tyrell "T-Bone" Washington. Stocky, durag, white tee, $ rope chain, gold tooth, Timbs | Uptown Thread Exchange, North America |
| `fresh` | Jaylen "Fresh" Campbell. Tall, black beanie, black puffer, grey track pants | 6ix Side Thrift, Canada |
| `mandrake` | Thiago "Mandrake" Souza. Bleached buzz, blue Juliet shades, Brasil #10, slides | Casa Exclusivo, South America |
| `karim` | Karim "Sacoche" Benali. Black tracksuit, sacoche, blue TNs, boxed beard | Boutique du Bloc, Europe |
| `chidi` | Chidi "Odogwu" Okafor. Cream bucket hat, Naija #9 jersey, cargos, slides with socks | Odogwu Vintage, Africa |
| `ryo` | Ryo "Kaiju" Tanaka. Bleached spikes, camo hoodie, buck teeth | Ura-Hara Stash, Asia |
| `shaz` | Jayden "Shaz" Wilson. Backwards cap, mullet, navy polo, bumbag, yellow TNs | Westie Grails, Oceania |
| `booster` | The Booster. Charcoal hoodie, face in black shadow, white eyes, gold grill | Booster Corner (the van) |

---

## Prompt 2 (requested, not received yet): auctioneer, walking crowd, head-on owners

```
Using the exact style of the cast lineup you drew (same line weight, colors, MAD Magazine / MAD animated-series caricature, flat cel shading, light from the upper left), make these images ONE AT A TIME. After each one, write its file name and wait for me to type NEXT.

RULES FOR EVERY IMAGE
• Transparent PNG, 1536×1024.
• Every figure completely separate, with at least 60px of empty space around it. Nothing touches or overlaps.
• No text, labels, ground shadows, or backgrounds.
• Every figure in an image at the same scale.

1) "auctioneer.png": HOSS HAMMERDOME, owner of the Hammerdome Auction Hall. A big Texas tycoon caricature: enormous white ten-gallon cowboy hat taller than his whole torso, white three-piece suit, bolo tie with a gold steer-head clasp, huge white handlebar moustache, rosy jowls, squinty eyes under heavy lids, giant grin with one gold tooth, wooden gavel in his right hand. Draw him HEAD-ON (facing the viewer), WAIST-UP, cut off in a flat horizontal line at the belt (a podium will hide everything below). 6 poses, 3 per row:
  Row 1: chanting with his mouth wide open · pointing the gavel straight at the viewer · gavel raised high over his head
  Row 2: gavel slammed down (impact, eyes squeezed shut) · arms flung wide yelling SOLD · tipping his hat with a wink

2) "crowd.png": 8 PEDESTRIANS, full body, three-quarter view FACING RIGHT, mid-stroll. IMPORTANT for animation: the legs clearly apart, with a gap of empty space between them all the way from the crotch to the shoes, and the arms held slightly away from the body so the hands never overlap the legs. Varied ages, genders and builds. 4 per row, in this order:
  1 skinny teen boy, big over-ear headphones: navy Supreme box-logo hoodie (red box logo), dark indigo jeans, Air Jordan 1 "Chicago" (white, red, black)
  2 round middle-aged guy, bushy moustache: canary-yellow Brazil 1994 jersey with green trim, teal boardshorts with yellow, white adidas Sambas
  3 tall woman, huge hoop earrings, high ponytail: shiny red satin Chicago Bulls 1996 champions jacket, black skinny jeans, white-and-red Air Max 1
  4 lanky guy: olive camo BAPE shark full-zip hoodie (black shark mouth on the hood, hood down), dark olive cargos, black Rick Owens high-top sneakers
  5 stylish woman, colorful headwrap, big sunglasses: green Nigeria 2018 jersey with black-and-white zigzag sleeves, white wide-leg pants, cream Margiela sneakers
  6 old man, scraggly white beard, knit beanie: bright orange Arc'teryx shell jacket, khaki pants, brown suede fringed moccasin sneakers
  7 young woman with long braids: black OVO hoodie with a gold owl on the chest, black leggings, white sneakers
  8 elegant older lady, grey bob, pearl necklace: belted camel Burberry trench coat, black trousers, black loafers

3) "owners_front.png": the 7 store owners from the lineup, now HEAD-ON (facing the viewer, looking straight into the camera), WAIST-UP, cut off flat at the belt as if standing behind a shop counter, both hands resting flat along the bottom edge. Same faces and outfits as the lineup. Order: T-Bone, Fresh, Mandrake, Karim, Chidi, Ryo, Shaz (4 on top, 3 below).

OPTIONAL, for full gestures behind the counter, one image per owner, "<name>_front_poses.png": 4 head-on waist-up poses with the same flat cut at the belt: big welcome wave · pointing at the viewer · laughing with head thrown back · arms crossed.
```

Each crowd outfit matches a real stock item in `src/data/inventory.js`, so tapping a pedestrian can show and bag the piece:

| # | Piece | Brand |
| --- | --- | --- |
| 1 | Box Logo Hooded Sweatshirt | Supreme |
| 2 | Brazil 1994 Home Jersey | Umbro |
| 3 | Bulls 1996 Champions Jacket | Starter |
| 4 | Shark Full-Zip Hoodie | A Bathing Ape |
| 5 | Nigeria Home Jersey | Nike |
| 6 | Alpha SV Jacket | Arc'teryx |
| 7 | OVO Owl Hoodie | October's Very Own |
| 8 | Heritage Kensington Trench | Burberry |

---

## Prompt 3 (not given yet): environments in the same style

This prompt is the biggest open gap. The environments are still drawn in code as flat vector cartoon (see `docs/HANDOFF.md` §4 D1). Every size, ground line and "leave this empty" instruction below exists so the art drops into the engine's coordinate system without hand-fixing.

```
Same chat, same MAD Magazine / MAD animated-series style as the cast lineup: thick hand-inked uneven black lines, flat saturated cel colors, one hard cel-shadow tone, light from the upper left, grimy funny details (cracks, tags, gum, pigeons' mess). NO PEOPLE OR ANIMALS in any of these. Make them ONE AT A TIME; after each, write the file name and wait for NEXT.

A) STOREFRONTS: one image per building, 1024×1536 portrait, TRANSPARENT background (the sky must be empty/transparent). Draw the building's front face straight on, a flat elevation with NO perspective, so the buildings can stand side by side in a row. The building fills the FULL WIDTH edge to edge. The bottom of the building (where it meets the sidewalk) is exactly the bottom edge of the image. Ground floor: one clear entrance door and one or two shop windows. Leave the shop windows EMPTY and dark (clothes are added in by code). Make the shop sign board big; if you can't spell the sign text exactly, leave the board blank.
  1 "front_north-america.png": Harlem brownstone/tenement, 4 floors, fire escape, water tower on the roof, green ground-floor shopfront. Sign: UPTOWN THREAD EXCHANGE
  2 "front_canada.png": low Scarborough strip-plaza unit, backlit box sign, slush on the ledge. Sign: 6IX SIDE THRIFT
  3 "front_south-america.png": Rocinha favela stack, painted cinderblock in pink, yellow and teal, tangled wires, laundry line. Sign: CASA EXCLUSIVO
  4 "front_europe.png": Saint-Denis 93 tower-block ground floor, grey concrete, satellite dishes, graffiti. Sign: BOUTIQUE DU BLOC
  5 "front_africa.png": Yaba, Lagos two-storey shop with a corrugated awning, painted price board, generator. Sign: ODOGWU VINTAGE
  6 "front_asia.png": Shinjuku narrow building with a vertical neon sign, paper lanterns, vending machines by the door. Sign: URA-HARA STASH
  7 "front_oceania.png": Mount Druitt shop strip with a verandah on posts, roller door, shopping trolley. Sign: WESTIE GRAILS
  8 "front_auction.png": the HAMMERDOME AUCTION HALL. Grand marble front with six columns, a triangular pediment with a gold gavel crest, a big gold dome on top, tall gold double doors, a marquee frame above the doors with an EMPTY BLACK screen inside it, red carpet steps. Sign on the frieze: HAMMERDOME
  9 "front_alley.png": the alley for Booster Corner, 1024×1536. Night-dark navy brick walls on both sides receding to a back wall, a hanging lamp casting a cone of light, purple-and-gold graffiti that says BOOSTER CORNER. Leave the middle of the alley floor EMPTY (a van gets placed there).

B) THE VAN: "van.png", 1536×1024, transparent. The back of a white panel van seen straight on, both rear doors swung open, the cargo space inside lit by a dome light, and the cargo space EMPTY with a dark purple interior (stock gets added in by code), a BOOST licence plate.

C) STORE INTERIORS: one per store, 1536×1024, front view of the back wall and side walls of a small shop, eye level. Clothing racks and shelves full of folded clothes, posters and gag signs on the walls that fit the neighbourhood. Leave the CENTER of the floor EMPTY: a counter and the owner are placed there by code. Keep everything important out of the top 1/8 and bottom 1/8 of the image (it gets cropped to a 2:1 strip). Names: "room_north-america.png", "room_canada.png", "room_south-america.png", "room_europe.png", "room_africa.png", "room_asia.png", "room_oceania.png".

D) COUNTERS: one per store, 1536×1024, TRANSPARENT background: just the shop counter seen straight from the front, spanning the middle 60% of the width and sitting in the bottom third, with the cash register, a bell and a few props on top, matching that store's room. Names: "counter_<store>.png" for the same 7 stores.

E) AUCTION HALL: "room_auction.png", 1536×1024: a plush auction hall with a red velvet curtain, a stage, a chandelier, and a big gold-framed screen on the right that is EMPTY and black. Leave the center of the stage EMPTY. Plus "podium.png", transparent: a carved wooden auctioneer's podium seen from the front with a gold H crest. Same rule: keep the important parts of room_auction.png out of the top 1/8 and bottom 1/8.

F) OPTIONAL STREET PROPS: "props.png", transparent, every prop separate with space around it: a fire hydrant, a trash can overflowing, a mailbox, a newspaper box, a parking meter, a bench, a green lamp post, a traffic light on a pole, a manhole cover, a pile of black trash bags.

G) OPTIONAL CRITTERS AND CARS: "critters.png", transparent, every piece separate: a scruffy bodega cat sitting / walking / sleeping, a mutt dog sitting / trotting (side view facing right, legs apart), three pigeons pecking / standing / flapping. "cars.png", transparent: 6 boxy beat-up cartoon cars in side view facing RIGHT (yellow taxi, red hatchback, blue sedan, white delivery van, green pickup, black lowrider), wheels round and separate from the body line so they can spin.

H) OPTIONAL GARMENT ICONS: "garments.png", transparent, 3 rows of 3, every piece separate: tee, hoodie, jacket, coat, button-up shirt, jersey, pants, cap, sneaker. Each one laid flat, front view, drawn in PURE WHITE with the black ink lines and ONE light-grey cel-shadow tone, no logos, no color at all (code tints each one to the item's color).
```

How each environment piece maps onto the engine (sizes, anchors, layers) is in `docs/HANDOFF.md` §5.
