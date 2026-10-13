// Inventory source of truth. Swap this file (or fetch JSON from an API) to update stock.
// One storefront per region, each repped by a specific neighbourhood. A region with no stock is a construction site.

export const STORES = [
  {
    id: 'north-america',
    name: 'Uptown Thread Exchange',
    region: 'North America',
    countries: ['United States', 'Mexico'],
    owner: 'Tyrell “T-Bone” Washington',
    from: 'Harlem, New York',
    greeting: 'Yo, what’s good? Every piece on these racks got history, B.',
  },
  {
    id: 'canada',
    name: '6ix Side Thrift',
    region: 'Canada',
    countries: ['Canada'],
    owner: 'Jaylen “Fresh” Campbell',
    from: 'Scarborough, Toronto',
    greeting: 'Wagwan fam! Mans got the hardest pieces in the 6, you done know.',
  },
  {
    id: 'south-america',
    name: 'Casa Exclusivo',
    region: 'South America',
    countries: ['Brazil'],
    owner: 'Thiago “Mandrake” Souza',
    from: 'Rocinha, Rio de Janeiro',
    greeting: 'E aí, parceiro! Tá suave? Só peça braba aqui, relíquia pura.',
  },
  {
    id: 'europe',
    name: 'Boutique du Bloc',
    region: 'Europe',
    countries: ['United Kingdom', 'France', 'Belgium', 'Netherlands', 'Italy', 'Germany', 'Sweden'],
    owner: 'Karim “Sacoche” Benali',
    from: 'Saint-Denis (93), Paris',
    greeting: 'Wesh frérot, bien ou quoi ? Ici c’est que des pièces de collection.',
  },
  {
    id: 'africa',
    name: 'Odogwu Vintage',
    region: 'Africa',
    countries: ['Nigeria', 'South Africa'],
    owner: 'Chidi “Odogwu” Okafor',
    from: 'Yaba, Lagos',
    greeting: 'How far, my guy! Correct original dey here, no shaking.',
  },
  {
    id: 'asia',
    name: 'Ura-Hara Stash',
    region: 'Asia',
    countries: ['United Arab Emirates', 'India', 'China', 'Hong Kong SAR', 'South Korea', 'Japan'],
    owner: 'Ryo “Kaiju” Tanaka',
    from: 'Shinjuku, Tokyo',
    greeting: 'Yo, irasshai. Real Ura-Hara grails only. No fakes in here.',
  },
  {
    id: 'oceania',
    name: 'Westie Grails',
    region: 'Oceania',
    countries: ['Australia'],
    owner: 'Jayden “Shaz” Wilson',
    from: 'Mount Druitt, Western Sydney',
    greeting: 'Oi eshay brah! Fully sick heat in here, lad.',
  },
];

// Cities (shown under each piece in the marketplace)
export const LOCATIONS = [
  { id: 'nyc', city: 'New York City', country: 'United States' },
  { id: 'la', city: 'Los Angeles', country: 'United States' },
  { id: 'laguna', city: 'Laguna Beach', country: 'United States' },
  { id: 'beaverton', city: 'Beaverton', country: 'United States' },
  { id: 'chicago', city: 'Chicago', country: 'United States' },
  { id: 'atl', city: 'Atlanta', country: 'United States' },
  { id: 'honolulu', city: 'Honolulu', country: 'United States' },
  { id: 'toronto', city: 'Toronto', country: 'Canada' },
  { id: 'montreal', city: 'Montréal', country: 'Canada' },
  { id: 'vancouver', city: 'Vancouver', country: 'Canada' },
  { id: 'cdmx', city: 'Mexico City', country: 'Mexico' },
  { id: 'rio', city: 'Rio de Janeiro', country: 'Brazil' },
  { id: 'london', city: 'London', country: 'United Kingdom' },
  { id: 'castleford', city: 'Castleford', country: 'United Kingdom' },
  { id: 'stornoway', city: 'Stornoway', country: 'United Kingdom' },
  { id: 'paris', city: 'Paris', country: 'France' },
  { id: 'antwerp', city: 'Antwerp', country: 'Belgium' },
  { id: 'amsterdam', city: 'Amsterdam', country: 'Netherlands' },
  { id: 'milan', city: 'Milan', country: 'Italy' },
  { id: 'florence', city: 'Florence', country: 'Italy' },
  { id: 'ravarino', city: 'Ravarino', country: 'Italy' },
  { id: 'berlin', city: 'Berlin', country: 'Germany' },
  { id: 'herzo', city: 'Herzogenaurach', country: 'Germany' },
  { id: 'stockholm', city: 'Stockholm', country: 'Sweden' },
  { id: 'lagos', city: 'Lagos', country: 'Nigeria' },
  { id: 'jozi', city: 'Johannesburg', country: 'South Africa' },
  { id: 'dubai', city: 'Dubai', country: 'United Arab Emirates' },
  { id: 'kolkata', city: 'Kolkata', country: 'India' },
  { id: 'tokyo', city: 'Tokyo', country: 'Japan' },
  { id: 'kojima', city: 'Kojima', country: 'Japan' },
  { id: 'osaka', city: 'Osaka', country: 'Japan' },
  { id: 'seoul', city: 'Seoul', country: 'South Korea' },
  { id: 'beijing', city: 'Beijing', country: 'China' },
  { id: 'hk', city: 'Hong Kong', country: 'Hong Kong SAR' },
  { id: 'sydney', city: 'Sydney', country: 'Australia' },
  { id: 'torquay', city: 'Torquay', country: 'Australia' },
];

// [locId, name, brand, type, price, size, condition, year, collection, designer, blurb, primary, accent]
const RAW = [
  ['nyc', 'Box Logo Hooded Sweatshirt', 'Supreme', 'hoodie', 780, 'L', 'Used – Excellent', 2017, 'FW17', 'James Jebbia', 'Lafayette Street staple from the brand founded downtown in 1994. Heavyweight fleece, tackle-twill logo.', '#1f2a44', '#d7263d'],
  ['nyc', 'Unisphere Hoodie', 'Aimé Leon Dore', 'hoodie', 260, 'M', 'New w/ Tags', 2021, 'Fall/Winter 2021', 'Teddy Santis', 'Queens-born label nodding to the 1964 World’s Fair Unisphere in Flushing Meadows.', '#3b4a3a', '#efe6d2'],
  ['nyc', 'Williams III Hoodie', 'Kith', 'hoodie', 210, 'XL', 'Used – Like New', 2020, 'Kith Classics', 'Ronnie Fieg', 'From the Ronnie Fieg shop that opened in 2011. Tonal embroidered script, boxy fit.', '#b8a58c', '#ffffff'],
  ['la', 'Horseshoe Pullover Hoodie', 'Chrome Hearts', 'hoodie', 1450, 'L', 'Used – Excellent', 2019, 'Mainline', 'Richard Stark', 'Hollywood-made since 1988. Horseshoe print with sterling-style hardware cues.', '#111111', '#e9e9e9'],
  ['la', 'Fifth Collection Flannel', 'Fear of God', 'shirt', 640, 'M', 'Used – Good', 2017, 'Fifth Collection', 'Jerry Lorenzo', 'Oversized plaid from Lorenzo’s LA studio — the era that defined luxury-streetwear layering.', '#6b2b2b', '#1a1a1a'],
  ['laguna', '8-Ball Tee', 'Stüssy', 'tee', 120, 'L', 'Used – Good', 1992, 'Vintage', 'Shawn Stussy', 'Early-90s surf-to-street graphic from the label born on the Laguna Beach boardwalk in 1980.', '#f2f2f2', '#111111'],
  ['beaverton', 'Air Jordan 1 High “Chicago”', 'Nike', 'sneaker', 9800, 'US 10', 'Vintage – Wearable', 1985, 'Original Release', 'Peter Moore', 'The 1985 OG. Designed at Nike HQ in Beaverton for a rookie named Michael Jordan.', '#ffffff', '#c8102e'],
  ['beaverton', 'Air Max 1 OG “Sport Red”', 'Nike', 'sneaker', 1100, 'US 9.5', 'Vintage – Wearable', 1987, 'Original Release', 'Tinker Hatfield', 'Hatfield’s first visible-air runner, inspired by the Centre Pompidou’s exposed structure.', '#f5f5f5', '#c8102e'],
  ['chicago', 'Just Don Snapback', 'Just Don', 'cap', 180, 'OS', 'New w/ Tags', 2016, 'Mainline', 'Don C', 'Chicago’s own Don C — luxury snapbacks with leather straps and tonal crowns.', '#2e2a26', '#c79a5b'],
  ['chicago', 'Bulls 1996 Champions Jacket', 'Starter', 'jacket', 340, 'XL', 'Vintage – Excellent', 1996, '72–10 Season', 'Starter', 'Satin-finish champ jacket from the record 72–10 season. Kept in the city it was made for.', '#ce1141', '#000000'],
  ['atl', 'Air Jordan 3 Retro “A Ma Maniére”', 'Nike × A Ma Maniére', 'sneaker', 520, 'US 11', 'New – Deadstock', 2021, 'Collaboration', 'James Whitner', 'The Atlanta boutique’s quilted-lining AJ3 — a love letter to Black women.', '#e9e2d8', '#6d1f2a'],
  ['atl', 'Centennial Olympic Games Tee', 'Vintage', 'tee', 95, 'L', 'Vintage – Good', 1996, 'Atlanta ’96', 'Unknown', 'Single-stitch souvenir tee from the 1996 Summer Games held in Atlanta.', '#0a3d91', '#f4c430'],
  ['honolulu', 'Pull-Over Aloha Shirt', 'Reyn Spooner', 'shirt', 150, 'M', 'Vintage – Excellent', 1978, 'Reverse Print', 'Reyn McCullough', 'The reverse-print aloha shirt, dressed down for island business since the 1950s.', '#1c5d7a', '#f2e3c6'],
  ['toronto', 'OVO Owl Hoodie', 'October’s Very Own', 'hoodie', 280, 'L', 'Used – Excellent', 2018, 'Essentials', 'Drake, Oliver El-Khatib & Noah Shebib', 'The 6’s own. Gold-embroidered owl on heavyweight Canadian fleece.', '#0d0d0d', '#c9a227'],
  ['toronto', 'Award Jacket', 'Roots', 'jacket', 360, 'M', 'Vintage – Good', 1998, 'Heritage', 'Michael Budman & Don Green', 'Toronto-made varsity jacket from the brand founded in 1973. Melton wool and leather sleeves.', '#1f3d2b', '#efe6d2'],
  ['montreal', 'Expedition Parka', 'Kanuk', 'coat', 590, 'M', 'Used – Excellent', 2015, 'Winter', 'Montréal atelier', 'Built in Montréal since 1974 for actual −30° winters.', '#7c1d1d', '#2a2a2a'],
  ['vancouver', 'Alpha SV Jacket', 'Arc’teryx', 'jacket', 690, 'L', 'Used – Excellent', 2019, 'Alpha Series', 'Arc’teryx Design Team', 'North Vancouver engineering. Gore-Tex Pro shell, taped seams, coast-mountain proven.', '#ff7a00', '#222222'],
  ['cdmx', 'México ’86 World Cup Jersey', 'Vintage', 'jersey', 230, 'L', 'Vintage – Good', 1986, 'FIFA World Cup', 'Unknown', 'Throwback from the tournament hosted at the Estadio Azteca.', '#006847', '#ffffff'],
  ['rio', 'Brazil 1994 Home Jersey', 'Umbro', 'jersey', 420, 'M', 'Vintage – Excellent', 1994, 'World Cup ’94', 'Umbro', 'The tetra-winning canary kit. Tone-on-tone CBF jacquard weave.', '#ffdf00', '#009739'],
  ['rio', 'Linen Resort Shirt', 'Osklen', 'shirt', 180, 'L', 'Used – Like New', 2019, 'Resort', 'Oskar Metsavaht', 'Ipanema-born label (1989) blending surf culture with sustainable textiles.', '#e9dfc9', '#2b6e8f'],
  ['london', 'Tri-Ferg Hoodie', 'Palace', 'hoodie', 240, 'L', 'Used – Excellent', 2015, 'Autumn 2015', 'Lev Tanju', 'South Bank skate crew turned global — the impossible triangle logo.', '#f2f2f2', '#111111'],
  ['london', 'Alcatraz Cargos', 'Corteiz', 'pants', 310, '32', 'New w/ Tags', 2022, 'Rules The World', 'Clint419', 'Drop-only West London cargos. Sold out via password-locked site in minutes.', '#3d4033', '#e9e9e9'],
  ['london', 'Orb Logo Cardigan', 'Vivienne Westwood', 'jacket', 520, 'S', 'Used – Excellent', 2020, 'Mainline', 'Vivienne Westwood', 'Punk royalty from the King’s Road. Embroidered orb on lambswool.', '#d4b8d8', '#6a2c70'],
  ['castleford', 'Heritage Kensington Trench', 'Burberry', 'coat', 1350, 'M', 'Used – Excellent', 2018, 'Heritage', 'Burberry', 'Gabardine trench cut and sewn at the Castleford, Yorkshire factory.', '#c6a66b', '#3b2f2f'],
  ['stornoway', 'Herringbone Blazer', 'Harris Tweed', 'jacket', 260, '40R', 'Vintage – Excellent', 1980, 'Orb Mark', 'Outer Hebrides weavers', 'Hand-woven by islanders at their homes in the Outer Hebrides. Certified Orb mark.', '#6b5b45', '#a8957a'],
  ['paris', 'Geobasket High-Tops', 'Rick Owens', 'sneaker', 890, 'EU 43', 'Used – Good', 2012, 'Mainline', 'Rick Owens', 'Paris-designed, Italian-made. The oversized-tongue silhouette that shaped the 2010s.', '#111111', '#f5f5f5'],
  ['paris', 'Replica GAT', 'Maison Margiela', 'sneaker', 360, 'EU 42', 'Used – Excellent', 2019, 'Replica', 'Martin Margiela (house)', 'Reissue of the German Army Trainer from a house founded in Paris in 1988.', '#f1ece2', '#8a7a5c'],
  ['antwerp', '“Riot Riot Riot” Bomber', 'Raf Simons', 'jacket', 18500, '48', 'Archive – Excellent', 2001, 'AW01 “Riot Riot Riot”', 'Raf Simons', 'Grail-tier archive. Patched camo bomber from the Antwerp designer’s AW01 show.', '#4a5233', '#c7c3a8'],
  ['amsterdam', 'Script Logo Tee', 'Patta', 'tee', 85, 'M', 'New w/ Tags', 2022, 'Mainline', 'Edson Sabajo & Guillaume Schmidt', 'From the Amsterdam store opened in 2004 — Surinamese-Dutch street culture.', '#111111', '#f2c14e'],
  ['milan', 'Industrial Belt', 'Off-White', 'accessory', 220, 'OS', 'Used – Excellent', 2018, 'SS18', 'Virgil Abloh', 'The yellow strap that took over everything. Designed in Abloh’s Milan studio.', '#f7d417', '#111111'],
  ['milan', 'Linea Rossa Nylon Jacket', 'Prada', 'jacket', 740, 'L', 'Vintage – Excellent', 1999, 'Linea Rossa', 'Miuccia Prada', 'Late-90s technical nylon with the red stripe — the original luxury sportswear.', '#1a1a1a', '#d32f2f'],
  ['florence', 'Velvet Tuxedo Blazer', 'Gucci', 'jacket', 1650, '50', 'Archive – Excellent', 1996, 'FW96', 'Tom Ford', 'Tom Ford-era Gucci, peak 90s glamour. Florentine house founded in 1921.', '#3a0d2c', '#c9a227'],
  ['ravarino', 'Ice Jacket', 'Stone Island', 'jacket', 1900, 'L', 'Archive – Good', 1988, 'Ice Jacket', 'Massimo Osti', 'Thermo-reactive fabric that shifts colour with temperature. Osti-era Emilia-Romagna innovation.', '#3f8f9c', '#f2f2f2'],
  ['berlin', 'J1A-GT Jacket', 'Acronym', 'jacket', 1600, 'M', 'Used – Excellent', 2017, 'FW17', 'Errolson Hugh', 'Berlin techwear lab. Gore-Tex shell with gravity pocket and JacketSling system.', '#1b1b1b', '#5a5a5a'],
  ['herzo', 'Samba OG', 'adidas', 'sneaker', 130, 'US 10', 'New – Deadstock', 2023, 'Originals', 'adidas', 'From the Bavarian town adidas has called home since 1949. Frozen-pitch trainer turned icon.', '#ffffff', '#111111'],
  ['herzo', 'Firebird Track Jacket', 'adidas', 'jacket', 110, 'L', 'Vintage – Good', 1990, 'Originals', 'adidas', 'Three-stripe tricot from adidas’ hometown. Classic early-90s cut.', '#0b2a6b', '#ffffff'],
  ['stockholm', 'Canada Narrow Face Scarf', 'Acne Studios', 'accessory', 160, 'OS', 'Used – Like New', 2021, 'Face', 'Jonny Johansson', 'Stockholm creative collective since 1996. Wool scarf with the face patch.', '#e8c1c5', '#3f3f3f'],
  ['lagos', 'Nigeria Home Jersey', 'Nike', 'jersey', 260, 'L', 'New w/ Tags', 2018, 'World Cup 2018', 'Nike × NFF', 'The Super Eagles kit that sold out worldwide in minutes. Lagos stock.', '#5fb04a', '#ffffff'],
  ['lagos', 'Gender-Fluid Print Shirt', 'Orange Culture', 'shirt', 210, 'M', 'New w/ Tags', 2020, 'SS20', 'Adebayo Oke-Lawal', 'Lagos-based label redefining Nigerian menswear since 2011.', '#f28c28', '#2d1b4e'],
  ['jozi', 'Heritage Pleated Shirt', 'Thebe Magugu', 'shirt', 480, 'S', 'Used – Excellent', 2019, 'Gender Studies', 'Thebe Magugu', 'Johannesburg designer and 2019 LVMH Prize winner.', '#d9c5a0', '#7a2e1e'],
  ['dubai', 'Box Logo Hoodie', 'Louis Vuitton × Supreme', 'hoodie', 3200, 'L', 'Used – Excellent', 2017, 'FW17', 'Kim Jones × James Jebbia', 'The collab that broke the internet. Sourced from our Dubai vault.', '#a3121b', '#ffffff'],
  ['kolkata', 'Hand-Embroidered Bandhgala', 'Sabyasachi', 'jacket', 1400, '40', 'Used – Like New', 2019, 'Heritage', 'Sabyasachi Mukherjee', 'Kolkata atelier craftsmanship. Zardozi embroidery on raw silk.', '#4d0f1c', '#d4af37'],
  ['tokyo', 'Shark Full-Zip Hoodie', 'A Bathing Ape', 'hoodie', 540, 'L', 'Used – Excellent', 2005, '1st Camo', 'Nigo', 'Ura-Harajuku classic. Shark face zips all the way up.', '#5a6b3c', '#111111'],
  ['tokyo', '“Scab” Patchwork Jacket', 'Undercover', 'jacket', 4200, '2', 'Archive – Good', 2003, 'SS03 “Scab”', 'Jun Takahashi', 'Archive Takahashi from one of the most collected Undercover seasons.', '#3b3b3b', '#a01b1b'],
  ['tokyo', 'PLAY Heart Tee', 'Comme des Garçons', 'tee', 95, 'M', 'New w/ Tags', 2023, 'PLAY', 'Rei Kawakubo', 'Filip Pagowski’s heart on a Tokyo-born label founded in 1969.', '#f5f5f5', '#d0021b'],
  ['tokyo', 'FBT Moccasin Sneaker', 'visvim', 'sneaker', 680, 'US 9', 'Used – Good', 2010, 'FBT', 'Hiroki Nakamura', 'Nakamura’s fringed moccasin-sneaker hybrid, made in Japan.', '#8b5a2b', '#e9dfc9'],
  ['kojima', 'Century Denim Jacket', 'Kapital', 'jacket', 920, '3', 'Used – Excellent', 2018, 'Century Denim', 'Kazuhiro Hiraki', 'Japan’s denim capital. Boro-patched, sashiko-stitched, indigo dyed in Okayama.', '#1f3a5f', '#e9dfc9'],
  ['osaka', 'Lot 2000 Gull Jeans', 'Evisu', 'pants', 380, '32', 'Vintage – Good', 1996, 'No.1', 'Hidehiko Yamane', 'Hand-painted seagull from the Osaka denim house founded in 1991.', '#203550', '#ffffff'],
  ['seoul', 'Oversized Logo Hoodie', 'Ader Error', 'hoodie', 290, 'A2', 'Used – Like New', 2020, 'SS20', 'Ader Collective', 'Seoul collective since 2014 — deliberate “errors” in fit and branding.', '#2f6fde', '#f2f2f2'],
  ['beijing', 'China Li-Ning Track Jacket', 'Li-Ning', 'jacket', 240, 'L', 'Used – Excellent', 2018, 'Paris FW18', 'Li Ning', 'The runway moment that relaunched the Beijing brand founded by the Olympic gymnast.', '#c8102e', '#f4c430'],
  ['hk', 'Silk Royale Bomber', 'CLOT', 'jacket', 420, 'L', 'Used – Excellent', 2016, 'Silk Royale', 'Edison Chen & Kevin Poon', 'Hong Kong streetwear OG since 2003. East-meets-West silk print.', '#7a1f2b', '#d4af37'],
  ['sydney', 'Chitch Chitch Jeans', 'Ksubi', 'pants', 230, '32', 'Used – Excellent', 2021, 'Mainline', 'Ksubi', 'Bondi-born denim, founded in Sydney in 2000.', '#2a2a2a', '#c8102e'],
  ['torquay', 'Original Boardshorts', 'Rip Curl', 'pants', 140, '32', 'Vintage – Good', 1989, 'Heritage', 'Doug Warbrick & Brian Singer', 'Torquay surf garage since 1969 — the Bells Beach stomping ground.', '#0b6e8f', '#f4c430'],
];

export const ITEMS = RAW.map((r, i) => ({
  id: `${r[0]}-${i}`,
  locId: r[0],
  name: r[1],
  brand: r[2],
  type: r[3],
  price: r[4],
  size: r[5],
  condition: r[6],
  year: r[7],
  collection: r[8],
  designer: r[9],
  blurb: r[10],
  color: r[11],
  accent: r[12],
}));

export const LOC_BY_ID = Object.fromEntries(LOCATIONS.map((l) => [l.id, l]));
export const STORE_BY_ID = Object.fromEntries(STORES.map((s) => [s.id, s]));
export const STORE_BY_COUNTRY = Object.fromEntries(STORES.flatMap((s) => s.countries.map((c) => [c, s])));
export const storeOfItem = (it) => STORE_BY_COUNTRY[LOC_BY_ID[it.locId].country];

export function itemsForScope(scope) {
  // scope: { level: 'all' | 'store' | 'country', value }
  if (!scope || scope.level === 'all') return ITEMS;
  return ITEMS.filter((it) =>
    scope.level === 'country' ? LOC_BY_ID[it.locId].country === scope.value : storeOfItem(it).id === scope.value
  );
}

export const COUNT_BY_COUNTRY = ITEMS.reduce((m, it) => {
  const c = LOC_BY_ID[it.locId].country;
  m[c] = (m[c] || 0) + 1;
  return m;
}, {});

export const COUNT_BY_STORE = Object.fromEntries(STORES.map((s) => [s.id, itemsForScope({ level: 'store', value: s.id }).length]));
// No stock → the storefront is boarded up and can't be entered
export const isOpen = (store) => COUNT_BY_STORE[store.id] > 0;

// ---------- Booster Corner: half off or less, out the back of a van. None of it is sold anywhere else on the block. ----------
// [name, brand, type, retail, price, size, condition, year, collection, designer, origin, blurb, primary, accent]
const BOOSTER_RAW = [
  ['Air Max 95 “Neon”', 'Nike', 'sneaker', 380, 150, 'US 10', 'New – Box damaged', 2018, 'Retro', 'Sergio Lozano', 'Portland, USA', 'Fell off a pallet. The box is crushed, the shoes are perfect.', '#5a5a5a', '#c6f000'],
  ['Nuptse 1996 Retro Jacket', 'The North Face', 'coat', 330, 140, 'L', 'New – No tags', 2021, 'Icons', 'TNF Design', 'Montréal, Canada', 'Still smells like the warehouse. Tags walked off on their own.', '#111111', '#f4c430'],
  ['Tech Fleece Full-Zip Hoodie', 'Nike', 'hoodie', 140, 55, 'M', 'New w/ Tags', 2023, 'Tech Fleece', 'Nike Sportswear', 'Brooklyn, USA', 'Ten of these came in a bag marked “GYM”. Nine left.', '#3a3f4a', '#c6c2d4'],
  ['Detroit Jacket', 'Carhartt WIP', 'jacket', 260, 110, 'L', 'Used – Like New', 2022, 'Workwear', 'Carhartt WIP', 'Detroit, USA', 'Worn once to a job site. Not his job site.', '#a0662a', '#3a2a1a'],
  ['Dunk Low “Panda”', 'Nike', 'sneaker', 220, 85, 'US 9', 'New – Deadstock', 2022, 'Dunk', 'Peter Moore', 'Shenzhen, China', 'Real pair, factory overrun. Stop asking how.', '#111111', '#f5f5f5'],
  ['990v3 “Made in USA”', 'New Balance', 'sneaker', 210, 90, 'US 11', 'Used – Excellent', 2020, 'Made in USA', 'New Balance', 'Boston, USA', 'Dad shoe energy at half the dad price.', '#9aa0a8', '#2a3f6a'],
  ['Essentials Hoodie', 'Fear of God Essentials', 'hoodie', 120, 45, 'XL', 'New w/ Tags', 2023, 'Essentials', 'Jerry Lorenzo', 'Los Angeles, USA', 'A whole box. Somebody’s inventory count is off.', '#d8cbb4', '#1a1a1a'],
  ['Woven Cargo Pants', 'Nike ACG', 'pants', 160, 60, '32', 'New w/ Tags', 2022, 'All Conditions Gear', 'Nike ACG', 'Portland, USA', 'Trail-ready. Never seen a trail.', '#3d4a3a', '#ff7a00'],
  ['Argentina 1994 Away Jersey (Factory Second)', 'Adidas', 'jersey', 140, 40, 'L', 'New – Misprinted', 1994, 'World Cup ’94', 'Adidas', 'Buenos Aires, Argentina', 'Crest stitched a little crooked. Wear it anyway.', '#1d2a6b', '#ffffff'],
  ['Bermuda Bucket Hat', 'Kangol', 'cap', 60, 22, 'M', 'New w/ Tags', 2021, 'Bermuda', 'Kangol', 'London, UK', 'Came in a crate with forty others. Pick your fighter.', '#e8202a', '#111111'],
  ['Polo Bear Knit Sweater', 'Ralph Lauren', 'shirt', 420, 160, 'M', 'Used – Excellent', 2019, 'Polo Bear', 'Ralph Lauren', 'New York City, USA', 'From a Greenwich estate sale. The bear’s still smiling.', '#f2ede0', '#7a1f2b'],
  ['Champion Reverse Weave Crewneck', 'Champion', 'tee', 90, 30, 'XL', 'Vintage – Good', 1996, 'Reverse Weave', 'Champion', 'Rochester, USA', 'Thrift-bin rescue. Cuffs still tight.', '#7a8aa8', '#e8202a'],
];
export const BOOSTER_ITEMS = BOOSTER_RAW.map((r, i) => ({
  id: `boost-${i}`,
  booster: true,
  name: r[0],
  brand: r[1],
  type: r[2],
  retail: r[3],
  price: r[4],
  off: Math.round((1 - r[4] / r[3]) * 100),
  size: r[5],
  condition: r[6],
  year: r[7],
  collection: r[8],
  designer: r[9],
  origin: r[10],
  blurb: r[11],
  color: r[12],
  accent: r[13],
}));

// ---------- Hammerdome Auction Hall: live lots, none of them sold anywhere else on the block ----------
// [name, brand, type, estimate low, estimate high, opening bid, size, condition, year, collection, designer, provenance, blurb, primary, accent]
const AUCTION_RAW = [
  ['Air Mag “Back to the Future”', 'Nike', 'sneaker', 45000, 70000, 20000, 'US 10', 'Deadstock, charger included', 2016, 'Charity draw', 'Tinker Hatfield', 'Beaverton, USA', 'Power laces. One of 89 pairs ever made, never plugged in.', '#c8ccd4', '#3fb7ff'],
  ['Air Jordan 1 “The Ten” Sample', 'Off-White × Nike', 'sneaker', 12000, 20000, 6000, 'US 9', 'Sample – Unworn', 2017, 'The Ten', 'Virgil Abloh', 'Chicago, USA', 'Pre-release sample with SAMPLE stamped on the tongue.', '#f2f2f2', '#f05a28'],
  ['Astro Biker Jacket', 'Helmut Lang', 'jacket', 9000, 14000, 4000, '48', 'Archive – Excellent', 1999, 'AW99', 'Helmut Lang', 'Vienna, Austria', 'The bondage-strap biker that every archive collector hunts.', '#1a1a1a', '#e5e5e5'],
  ['Virginia Creeper Parka', 'Raf Simons', 'coat', 15000, 25000, 7000, '48', 'Archive – Good', 2002, 'AW02 Virginia Creeper', 'Raf Simons', 'Antwerp, Belgium', 'Patched and painted parka from the darkest Raf season.', '#2e3428', '#c94a2a'],
  ['Chomper Shark Hoodie', 'A Bathing Ape × KAWS', 'hoodie', 3000, 5000, 1200, 'L', 'Used – Excellent', 2005, 'KAWS collab', 'Nigo × KAWS', 'Tokyo, Japan', 'The KAWS Chomper face on the full-zip. Ura-Harajuku royalty.', '#2f6fde', '#111111'],
  ['1997 Tour Tee', 'Wu-Tang Clan', 'tee', 1500, 2500, 400, 'XL', 'Vintage – Faded', 1997, 'Forever tour', 'Tour merch', 'Staten Island, USA', 'Bought at the show, slept in for a decade. Single-stitch.', '#141414', '#f4c430'],
  ['Dream Team Warm-Up Jacket', 'Champion', 'jacket', 8000, 12000, 3000, 'XL', 'Bench-worn', 1992, 'Barcelona Olympics', 'Champion', 'Barcelona, Spain', 'Worn on the bench in Barcelona. Letter of authenticity included.', '#1d3f9f', '#e8202a'],
  ['Lot 501XX “Big E”', 'Levi’s', 'pants', 20000, 35000, 9000, '32', 'Vintage – Repaired', 1947, 'Big E', 'Levi Strauss & Co.', 'San Francisco, USA', 'Pulled out of a Nevada mine shaft. Hand-darned by the original owner.', '#2a3f6a', '#c8902a'],
  ['Air Jordan 1 High “Dior”', 'Dior × Nike', 'sneaker', 9000, 14000, 5000, 'US 10', 'New – Deadstock', 2020, 'Air Dior', 'Kim Jones', 'Paris, France', 'One of 8,500. Italian-made, Oblique swoosh, never laced.', '#d8d8dc', '#7a9ac8'],
];
export const AUCTION_LOTS = AUCTION_RAW.map((r, i) => ({
  id: `lot-${i}`,
  lot: i + 1,
  auction: true,
  name: r[0],
  brand: r[1],
  type: r[2],
  estLow: r[3],
  estHigh: r[4],
  start: r[5],
  price: r[5],
  size: r[6],
  condition: r[7],
  year: r[8],
  collection: r[9],
  designer: r[10],
  origin: r[11],
  blurb: r[12],
  color: r[13],
  accent: r[14],
}));
export const ALL_ITEMS = [...ITEMS, ...BOOSTER_ITEMS, ...AUCTION_LOTS];
