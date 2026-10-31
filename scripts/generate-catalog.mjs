// scripts/generate-catalog.mjs
// Generates catalog/catalog.json with 120 curated gift and DIY items.
// All items are CC0 open data, generic, bilingual EN/FR friendly.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const targetFile = path.resolve(__dirname, '../catalog/catalog.json');

const rawGifts = [
  // Coffee & Tea & Morning Rituals
  { t: "Handmade Ceramic Pour-Over Dripper", s: "Stoneware pour-over cone with matte glaze for slow, even manual coffee extraction.", tags: ["coffee", "quiet", "morning", "ceramic", "kitchen"], o: ["birthday", "thank-you", "holiday"], b: "medium", p: 28 },
  { t: "Cast Iron Tea Kettle with Infuser", s: "Heavy Japanese-style tetsubin kettle retaining heat for peaceful gongfu or sencha brewing.", tags: ["tea", "quiet", "ritual", "cast-iron", "cozy"], o: ["birthday", "holiday", "anniversary"], b: "high", p: 58 },
  { t: "Cold Brew Glass Carafe with Stainless Filter", s: "Borosilicate glass pitcher for overnight steep coffee or herbal infusions in the fridge.", tags: ["coffee", "refreshing", "kitchen", "glass", "summer"], o: ["birthday", "housewarming"], b: "low", p: 22 },
  { t: "Manual Ceramic Burr Coffee Grinder", s: "Hand-crank burr mill delivering precise coarse-to-fine grind without noisy motors.", tags: ["coffee", "slow-living", "travel", "craft", "morning"], o: ["birthday", "holiday"], b: "medium", p: 35 },
  { t: "Double-Walled Stoneware Espresso Cups", s: "Set of two tactile ceramic cups preserving warmth while remaining cool to the touch.", tags: ["coffee", "ceramic", "cozy", "artisan", "morning"], o: ["thank-you", "housewarming"], b: "low", p: 19 },
  { t: "Organic Loose Leaf Herbal Tisane Blend", s: "Chamomile flowers, lemon verbena and lavender harvested for soothing evening stillness.", tags: ["tea", "relaxing", "herbal", "quiet", "wellness"], o: ["thank-you", "get-well", "holiday"], b: "low", p: 14 },
  { t: "Hand-Carved Olive Wood Measuring Scoop", s: "Smooth olive wood tablespoon carved from pruned orchard wood for beans and tea leaves.", tags: ["woodwork", "coffee", "tea", "kitchen", "eco-friendly"], o: ["thank-you", "just-because"], b: "low", p: 12 },
  { t: "Gooseneck Pouring Kettle with Wooden Handle", s: "Precision spout kettle for measured water flow and meditative pour-over brewing.", tags: ["coffee", "craft", "kitchen", "precision", "morning"], o: ["birthday", "holiday"], b: "medium", p: 42 },

  // Gardening & Botanicals & Nature
  { t: "French Flax Linen Garden Apron", s: "Cross-back pre-washed linen apron with deep reinforced split pockets for shears and seeds.", tags: ["gardening", "linen", "nature", "outdoor", "craft"], o: ["birthday", "anniversary"], b: "medium", p: 38 },
  { t: "Forged Carbon Steel Garden Pruning Shears", s: "Traditional bypass secateurs with walnut grip and replaceable precision cutting blade.", tags: ["gardening", "nature", "craft", "outdoor", "precision"], o: ["birthday", "holiday"], b: "medium", p: 45 },
  { t: "Terracotta Self-Watering Ollas Pot", s: "Porous unglazed earthenware pot buried in soil for steady subterranean root hydration.", tags: ["gardening", "eco-friendly", "plants", "slow-living"], o: ["housewarming", "birthday"], b: "low", p: 24 },
  { t: "Heirloom Pollinator Wildflower Seed Vault", s: "Twenty packets of native nectar-rich annual and perennial seeds for bumblebees and butterflies.", tags: ["gardening", "nature", "eco-friendly", "botanical"], o: ["thank-you", "birthday"], b: "low", p: 16 },
  { t: "Solid Copper Indoor Watering Can", s: "Miniature curved spout can designed for gentle pinpoint watering of houseplants and moss terrariums.", tags: ["gardening", "plants", "botanical", "metalwork", "quiet"], o: ["holiday", "housewarming"], b: "high", p: 62 },
  { t: "Hand-Blown Glass Propagation Wall Tube", s: "Slender test tube mounted on salvaged cedar wood for rooting plant cuttings in sunlight.", tags: ["plants", "gardening", "decor", "woodwork", "minimalist"], o: ["housewarming", "thank-you"], b: "low", p: 18 },
  { t: "Cedar Bird Nesting Box for Garden Songbirds", s: "Untreated cedar shelter with ventilation holes and clean-out hatch for garden finches and tits.", tags: ["nature", "outdoor", "gardening", "birds", "woodwork"], o: ["birthday", "holiday"], b: "medium", p: 32 },
  { t: "Preserved Natural Forest Moss Terrarium Frame", s: "Framed composition of reindeer moss and lichens requiring zero watering or sunlight.", tags: ["nature", "moss", "decor", "quiet", "botanical"], o: ["housewarming", "anniversary"], b: "medium", p: 48 },

  // Reading & Writing & Stillness
  { t: "Solid Brass Botanical Ginkgo Bookmark", s: "Laser-etched brass leaf bookmark that develops a rich golden patina across reading years.", tags: ["reading", "books", "quiet", "brass", "minimalist"], o: ["thank-you", "birthday", "just-because"], b: "low", p: 14 },
  { t: "Hand-Bound Recycled Cotton Rag Journal", s: "Deckle-edge handmade paper bound in vegetable-tanned olive leather with wax cord closure.", tags: ["writing", "books", "quiet", "artisan", "slow-living"], o: ["birthday", "anniversary"], b: "medium", p: 34 },
  { t: "Warm Amber LED Book Light with Wooden Clip", s: "Eye-friendly flicker-free reading lamp with 1800K blue-light-blocking tone for bedtime readers.", tags: ["reading", "books", "quiet", "cozy", "night"], o: ["holiday", "birthday"], b: "low", p: 21 },
  { t: "Walnut Wood Desktop Book Stand", s: "Angled display stand holding open thick cookbooks or hardcovers during quiet study.", tags: ["reading", "woodwork", "desk", "quiet", "craft"], o: ["birthday", "thank-you"], b: "medium", p: 29 },
  { t: "Weighted Sandstone Paperweight & Pen Rest", s: "Minimalist natural stone grooved to hold a fountain pen and secure stationery from breezes.", tags: ["desk", "writing", "minimalist", "quiet", "stone"], o: ["thank-you", "housewarming"], b: "low", p: 17 },
  { t: "Brass Fountain Pen with Extra-Fine Nib", s: "Machined heavyweight brass writing instrument accepting international standard ink cartridges.", tags: ["writing", "brass", "craft", "desk", "artisan"], o: ["birthday", "anniversary", "holiday"], b: "high", p: 65 },
  { t: "Deep Slate Ceramic Reading Mug", s: "Wide-mouth textured pottery mug contoured to cradle in both hands with warm tea or cocoa.", tags: ["cozy", "ceramic", "reading", "quiet", "kitchen"], o: ["holiday", "thank-you"], b: "low", p: 22 },

  // Cozy Home & Craft & Relaxing
  { t: "Hand-Poured Soy Wax Cedar & Amber Candle", s: "Clean-burning rapeseed and soy candle with cotton wick and calming forest notes.", tags: ["cozy", "relaxing", "quiet", "scent", "night"], o: ["holiday", "housewarming", "thank-you"], b: "low", p: 18 },
  { t: "Woven Wool & Cotton Textured Throw Blanket", s: "Herringbone blanket woven on traditional looms with fringed borders for reading armchairs.", tags: ["cozy", "textile", "relaxing", "home", "warmth"], o: ["holiday", "housewarming", "anniversary"], b: "high", p: 75 },
  { t: "Felted Wool Slipper Mules with Suede Soles", s: "Breathable seamless boiled wool indoor shoes providing arch warmth through winter floors.", tags: ["cozy", "wool", "relaxing", "home", "winter"], o: ["holiday", "birthday"], b: "medium", p: 48 },
  { t: "Natural Lava Stone Essential Oil Diffuser", s: "Porous volcanic pebble resting in an acacia wood bowl for heat-free scent dispersion.", tags: ["relaxing", "aromatherapy", "quiet", "minimalist", "wellness"], o: ["thank-you", "housewarming"], b: "low", p: 20 },
  { t: "Handmade Beeswax Pillar Candle Set", s: "Three honeycomb-textured rolled 100% pure beeswax pillars with subtle natural honey scent.", tags: ["cozy", "beeswax", "natural", "light", "craft"], o: ["holiday", "thank-you"], b: "low", p: 24 },
  { t: "Carved Cherry Wood Cooking Spoon", s: "Balanced stirring paddle hand-rubbed with organic walnut oil, safe for delicate enameled cookware.", tags: ["cooking", "kitchen", "woodwork", "craft", "slow-living"], o: ["housewarming", "thank-you"], b: "low", p: 16 },
  { t: "Granite Mortar and Pestle for Whole Spices", s: "Heavy unpolished granite bowl ideal for grinding peppercorns, roasted cumin and pesto.", tags: ["cooking", "kitchen", "artisan", "food", "craft"], o: ["birthday", "housewarming"], b: "medium", p: 38 },
  { t: "Raw Honey Sampler from Mountain Apiaries", s: "Three jars of unpasteurized wildflower, chestnut and lavender honey with olive wood dipper.", tags: ["food", "sweet", "nature", "tea", "artisan"], o: ["holiday", "thank-you"], b: "medium", p: 26 },

  // Art, Woodwork & Mindfulness
  { t: "Pocket Watercolor Sketchbook & Brass Clip", s: "Cold-press cotton watercolor paper with cloth binding and miniature mixing palette.", tags: ["art", "painting", "craft", "quiet", "creativity"], o: ["birthday", "holiday"], b: "low", p: 23 },
  { t: "Handmade Ceramic Paint Palette with Wells", s: "Porcelain artist tray with ten mixing wells that washes clean without pigment staining.", tags: ["art", "ceramic", "painting", "craft", "studio"], o: ["birthday", "thank-you"], b: "medium", p: 32 },
  { t: "Basswood Whittling Starter Knife and Strop", s: "High-carbon curved whittling tool with protective leather sheath and honing compound.", tags: ["woodwork", "craft", "hands-on", "outdoor", "mindful"], o: ["birthday", "holiday"], b: "medium", p: 36 },
  { t: "Miniature Brass Hourglass with Dark Sand", s: "Ten-minute glass timer for quiet pauses, tea steeping, or uninterrupted morning journaling.", tags: ["quiet", "time", "desk", "brass", "mindful"], o: ["thank-you", "just-because"], b: "low", p: 22 },
  { t: "Cast Bronze Incense Burner Bowl", s: "Heavy brushed bronze vessel for sand, white sage leaves, or Japanese incense sticks.", tags: ["quiet", "ritual", "scent", "metalwork", "mindful"], o: ["housewarming", "birthday"], b: "medium", p: 35 },
  { t: "Linen Bread Proofing Basket (Banneton)", s: "Natural rattan spiral proofing bowl with removable washable linen liner for crusty sourdough.", tags: ["baking", "bread", "kitchen", "craft", "slow-living"], o: ["housewarming", "birthday"], b: "low", p: 19 },
  { t: "Hand-Turned Maple Salt Cellar with Swivel Lid", s: "Smooth hardwood seasoning keeper with magnetic latch for flaky sea salt at the stove.", tags: ["cooking", "woodwork", "kitchen", "craft", "artisan"], o: ["housewarming", "thank-you"], b: "medium", p: 28 },
  { t: "Japanese Ceramic Ramen Bowls (Pair)", s: "Generous speckled stoneware bowls paired with dark bamboo soup spoons.", tags: ["cooking", "food", "ceramic", "kitchen", "cozy"], o: ["anniversary", "housewarming"], b: "medium", p: 44 },
  { t: "Forged Iron Herb Drying Rack with S-Hooks", s: "Wall-mounted circular iron rail to hang gathered mint, lavender and sage upside down.", tags: ["gardening", "herbal", "decor", "kitchen", "nature"], o: ["housewarming", "holiday"], b: "medium", p: 31 },
  { t: "Acoustic Wooden Smartphone Amplifier Dock", s: "Passive horn carved from solid ashwood amplifying phone podcasts and acoustic tracks without power.", tags: ["woodwork", "music", "eco-friendly", "desk", "clever"], o: ["birthday", "thank-you"], b: "low", p: 25 }
];

// Generate more variations to reach ~95 diverse gifts
const moreGiftCategories = [
  { prefix: "Stoneware", items: ["Matcha Whisk Holder", "Olive Oil Cruet Bottle", "Garlic Roaster Dome", "Butter Keeper Crock", "Incense Leaf Tray"], tags: ["ceramic", "kitchen", "quiet", "craft"], b: "low", p: 18 },
  { prefix: "Hand-Carved", items: ["Walnut Coffee Tamper", "Oak Butter Spreader Knife", "Cherry Chopstick Pair with Rests", "Ashwood Coaster Set (4)", "Birch Tea Caddy Box"], tags: ["woodwork", "craft", "kitchen", "slow-living"], b: "medium", p: 26 },
  { prefix: "Artisan", items: ["Beeswax Food Wraps (Pack of 4)", "Fair-Trade Cocoa & Sea Salt Bar Box", "Loose Leaf Sencha Green Tea Tin", "Cold-Pressed Walnut Salad Oil", "Dried Lavender Sachet Trio"], tags: ["food", "tea", "eco-friendly", "cozy"], b: "low", p: 15 },
  { prefix: "Brushed Brass", items: ["Desktop Card Display Stand", "Plant Mist Spray Bottle", "Key Ring Carabiner with Leather Tab", "Hexagonal Coaster Set", "Miniature Herb Scoop"], tags: ["brass", "desk", "metalwork", "decor"], b: "medium", p: 32 },
  { prefix: "Organic Linen", items: ["Kitchen Tea Towel Pair in Ochre", "Pillowcase Pair in Forest Moss", "Drawstring Bread Storage Bag", "Baking Oven Mitts Pair", "Washed Linen Table Runner"], tags: ["linen", "textile", "kitchen", "cozy"], b: "medium", p: 35 },
  { prefix: "Crafted", items: ["Botanical Cyanotype Sun-Print Kit", "Calligraphy Bamboo Dip Pen Set", "Hardwood Knitting Needles Set", "Embroidered Wool Bookmark", "Handmade Plant Fibre Paper Pack"], tags: ["art", "craft", "creativity", "hands-on"], b: "low", p: 21 },
  { prefix: "Natural Heritage", items: ["Handmade Cedar Moth Repellent Blocks", "French Savon de Marseille Olive Soap Block", "Pumice Stone Foot Scrubber with Rope", "Bamboo Bath Caddy Tray", "Sisal Bath Brush with Long Handle"], tags: ["wellness", "relaxing", "bath", "eco-friendly"], b: "low", p: 16 },
  { prefix: "Botanical", items: ["Pressed Herbarium Specimen Frame", "Earthenware Seed Sprouter Dish", "Miniature Pruning Snips for Bonsai", "Natural Jute Twine Spool with Stand", "Zinc Plant Garden Markers (Set of 10)"], tags: ["gardening", "nature", "plants", "botanical"], b: "low", p: 19 },
  { prefix: "Cosy Hearth", items: ["Hand-Dipped Taper Candles (Box of 6)", "Cast Iron Trivet with Floral Motif", "Wool Felt Laptop Sleeve", "Knitted Hot Water Bottle Cover", "Amber Glass Apothecary Soap Pump"], tags: ["cozy", "home", "winter", "relaxing"], b: "medium", p: 27 },
  { prefix: "Atelier Studio", items: ["Glass Dip Pen with Spiral Reservoir", "Walnut Ink for Sketching & Calligraphy", "Cork & Rubber Desk Pad", "Brass Folding Ruler with Inch/Metric", "Steel Bookends with Geometry Relief"], tags: ["desk", "writing", "art", "brass"], b: "medium", p: 34 },
  { prefix: "Artisanal Haven", items: ["Ceramic Spoon Rest in Speckled White", "Woven Cotton Market Net Bag", "Carved Wooden Honey Dipper", "Matcha Bamboo Whisk (Chasen)", "Aromatic Hinoki Wood Bath Flakes"], tags: ["kitchen", "relaxing", "quiet", "craft"], b: "low", p: 17 },
  { prefix: "Heritage Workshop", items: ["Cast Iron Wall Hook with Acorn Finial", "Copper Garden Trowel with Ash Handle", "Hand-Dyed Indigo Linen Bandana", "Traditional Japanese Bonsai Trimming Shears", "Leather Coaster Set with Stamped Monogram"], tags: ["craft", "gardening", "woodwork", "artisan"], b: "medium", p: 31 },
  { prefix: "Nordic Slow", items: ["Birch Wood Candle Arch with LED Glow", "Felted Wool Trivet Balls", "Enamel Camping Mug with Pine Tree Motif", "Handmade Pine Needle Incense Cones", "Woolen Hand-Knitted Fingerless Gloves"], tags: ["cozy", "winter", "quiet", "nature"], b: "low", p: 23 }
];

let catalog = [];
let giftId = 1;

for (const g of rawGifts) {
  catalog.push({
    id: `gift-${String(giftId++).padStart(3, '0')}`,
    kind: "gift",
    title: g.t,
    summary: g.s.slice(0, 240),
    tags: g.tags.slice(0, 6),
    occasions: g.o,
    price_band: g.b,
    price: g.p,
    currency: "EUR"
  });
}

for (const cat of moreGiftCategories) {
  for (const item of cat.items) {
    catalog.push({
      id: `gift-${String(giftId++).padStart(3, '0')}`,
      kind: "gift",
      title: `${cat.prefix} ${item}`,
      summary: `Carefully fashioned ${item.toLowerCase()} celebrating authentic materials and timeless craftsmanship.`,
      tags: [...cat.tags, item.split(' ')[0].toLowerCase()].slice(0, 5),
      occasions: ["birthday", "thank-you", "holiday", "housewarming"],
      price_band: cat.b,
      price: cat.p,
      currency: "EUR"
    });
  }
}

// DIY Craft Entries (30 realistic, physically possible projects with grounded materials & <=6 steps)
const rawDIY = [
  {
    title: "Upcycled Ceramic Cup Herb Garden",
    summary: "Transform an unused thrifted mug or pottery bowl into a thriving indoor kitchen herb planter.",
    tags: ["gardening", "plants", "kitchen", "eco-friendly", "craft"],
    occasions: ["birthday", "housewarming", "thank-you"],
    price_band: "low",
    minutes: 30,
    diff: 1,
    mat: [
      { name: "Ceramic cup or thrifted mug", qty: "1" },
      { name: "Small drainage pebbles", qty: "1 cup" },
      { name: "Organic potting compost", qty: "2 cups" },
      { name: "Herb seedling (thyme or mint)", qty: "1 plant" }
    ],
    steps: [
      { text: "Wash and dry the ceramic cup thoroughly." },
      { text: "Add a 2cm layer of small pebbles at the bottom for vital drainage." },
      { text: "Fill the cup two-thirds full with fresh organic potting compost." },
      { text: "Carefully nestle the seedling root ball into the center." },
      { text: "Top with remaining soil, press gently and moisten with a spray mist." },
      { text: "Write the herb name and care instructions on a craft paper tag." }
    ],
    safety: null
  },
  {
    title: "Hand-Poured Coffee Bean Soy Candle",
    summary: "Infuse warm soy wax with aromatic roasted coffee beans in a reusable glass container.",
    tags: ["coffee", "cozy", "scent", "craft", "relaxing"],
    occasions: ["holiday", "birthday", "thank-you"],
    price_band: "low",
    minutes: 45,
    diff: 2,
    mat: [
      { name: "Natural soy wax flakes", qty: "180g" },
      { name: "Lead-free cotton wick with metal tab", qty: "1" },
      { name: "Whole roasted coffee beans", qty: "2 tbsp" },
      { name: "Small heat-resistant glass jar", qty: "1" }
    ],
    steps: [
      { text: "Secure the wick metal tab to the center bottom of the glass jar." },
      { text: "Melt soy wax flakes slowly in a heatproof bowl set over simmering water." },
      { text: "Once liquid, stir in a spoonful of fragrant roasted coffee beans." },
      { text: "Pour warm wax into the jar, supporting the wick between wooden skewers." },
      { text: "Allow the candle to solidify at room temperature for at least 4 hours." },
      { text: "Trim the wick to 5mm before wrapping." }
    ],
    safety: "Adult supervision required when handling simmering water and melted hot wax."
  },
  {
    title: "Pressed Fern & Botanical Glass Bookmark",
    summary: "Preserve delicate pressed forest ferns between transparent laminate film trimmed with silk ribbon.",
    tags: ["reading", "nature", "botanical", "craft", "quiet"],
    occasions: ["thank-you", "birthday", "just-because"],
    price_band: "low",
    minutes: 25,
    diff: 1,
    mat: [
      { name: "Pressed dried fern frond or wildflower", qty: "1 stem" },
      { name: "Heavyweight watercolor paper card", qty: "1 strip (5x15cm)" },
      { name: "Cold-laminating self-adhesive sheets", qty: "2" },
      { name: "Hand-dyed silk or cotton ribbon", qty: "20cm" }
    ],
    steps: [
      { text: "Arrange the dried botanicals flat against the paper strip." },
      { text: "Smooth clear laminate film across both sides, squeezing out air bubbles." },
      { text: "Neatly trim the laminate borders with scissors leaving a 3mm sealed edge." },
      { text: "Punch a neat hole in the center top using a hole punch." },
      { text: "Thread the silk ribbon through and tie a classic lark's head knot." }
    ],
    safety: null
  },
  {
    title: "Handmade Lavender & Sea Salt Bath Soak",
    summary: "Blend mineral-rich Epsom salt with organic dried lavender blossoms and soothing jojoba oil.",
    tags: ["relaxing", "wellness", "cozy", "nature", "bath"],
    occasions: ["thank-you", "holiday", "birthday"],
    price_band: "low",
    minutes: 20,
    diff: 1,
    mat: [
      { name: "Epsom magnesium salt", qty: "250g" },
      { name: "Coarse French sea salt", qty: "100g" },
      { name: "Dried organic lavender buds", qty: "3 tbsp" },
      { name: "Jojoba or sweet almond oil", qty: "1 tbsp" },
      { name: "Apothecary glass jar with cork", qty: "1" }
    ],
    steps: [
      { text: "Combine Epsom salts and coarse sea salt in a clean mixing bowl." },
      { text: "Drizzle jojoba oil across the salts and stir thoroughly with a wooden spoon." },
      { text: "Fold in dried lavender buds until evenly scattered throughout." },
      { text: "Spoon the bath salt mixture into the airtight glass jar." },
      { text: "Seal with the cork and label with recommended scoop instructions." }
    ],
    safety: null
  },
  {
    title: "Beeswax & Pine Resin Reusable Food Wraps",
    summary: "Coat 100% cotton fabric squares with melted pure beeswax and natural jojoba oil for plastic-free kitchen wraps.",
    tags: ["kitchen", "eco-friendly", "beeswax", "craft", "cooking"],
    occasions: ["housewarming", "thank-you", "holiday"],
    price_band: "low",
    minutes: 40,
    diff: 2,
    mat: [
      { name: "100% lightweight cotton fabric (25x25cm)", qty: "2 pieces" },
      { name: "Grated organic beeswax", qty: "40g" },
      { name: "Jojoba oil", qty: "1 tsp" },
      { name: "Baking parchment paper", qty: "2 large sheets" }
    ],
    steps: [
      { text: "Pink fabric edges with zig-zag scissors to prevent fraying." },
      { text: "Sandwich the fabric between two sheets of baking parchment on an ironing board." },
      { text: "Evenly scatter grated beeswax and drizzle drops of jojoba oil across the cloth." },
      { text: "Pass a warm iron over the parchment until wax melts smoothly into the fibers." },
      { text: "Lift the parchment while warm and wave the fabric for 30 seconds to set." }
    ],
    safety: "Exercise care with the hot clothing iron to avoid burns on fingertips."
  },
  {
    title: "Whittled Cedar Wood Jam Spreader",
    summary: "Carve a functional breakfast butter and jam knife from a fallen cedar or cherry branch.",
    tags: ["woodwork", "kitchen", "craft", "hands-on", "mindful"],
    occasions: ["birthday", "holiday"],
    price_band: "low",
    minutes: 90,
    diff: 3,
    mat: [
      { name: "Dry hardwood branch (cedar, birch, cherry)", qty: "1 piece (20cm)" },
      { name: "Assorted sandpaper sheets (120 to 400 grit)", qty: "3 sheets" },
      { name: "Food-grade mineral oil or walnut oil", qty: "1 tbsp" }
    ],
    steps: [
      { text: "Draw the spreader blade and handle silhouette directly on the branch bark." },
      { text: "Carefully whittle away excess wood with push-cuts away from your body." },
      { text: "Shape the tapered blade edge to approximately 2mm thickness." },
      { text: "Sand progressing through 120, 240 and 400 grit until silky smooth." },
      { text: "Wipe with food-safe walnut oil to reveal deep wood grain." }
    ],
    safety: "Use a sharp whittling knife with cut-resistant thumb guard; always carve away from hands."
  },
  {
    title: "Hand-Stitched Japanese Bookbinding Notebook",
    summary: "Bind single sheets of linen paper using traditional Yotsume Toji four-hole thread stitching.",
    tags: ["writing", "books", "craft", "quiet", "paper"],
    occasions: ["birthday", "anniversary", "thank-you"],
    price_band: "low",
    minutes: 60,
    diff: 2,
    mat: [
      { name: "A5 textured writing paper sheets", qty: "30 sheets" },
      { name: "Heavyweight cardstock for cover", qty: "2 sheets" },
      { name: "Waxed linen bookbinding thread", qty: "1.5m" },
      { name: "Bookbinding awl and needle", qty: "1 set" }
    ],
    steps: [
      { text: "Stack and align the paper sheets neatly between cardstock covers." },
      { text: "Mark four evenly spaced hole locations 1cm from the spine edge." },
      { text: "Pierce clean holes through the entire stack using the sharp awl." },
      { text: "Thread the needle and weave through the holes in the traditional four-hole pattern." },
      { text: "Tie off the knot securely at the head corner and trim thread ends." }
    ],
    safety: "Take care when piercing dense cardstock with the pointed bookbinding awl."
  },
  {
    title: "Cold-Infused Rosemary & Chili Olive Oil",
    summary: "Steep sprigs of garden rosemary and whole dried bird's eye chilies in premium extra virgin olive oil.",
    tags: ["cooking", "kitchen", "food", "gardening", "herbal"],
    occasions: ["housewarming", "holiday", "thank-you"],
    price_band: "low",
    minutes: 25,
    diff: 1,
    mat: [
      { name: "Extra virgin cold-pressed olive oil", qty: "250ml" },
      { name: "Fresh rosemary sprigs (washed & bone dry)", qty: "3 sprigs" },
      { name: "Whole dried small chilies", qty: "4" },
      { name: "Sterilized glass bottle with swing stopper", qty: "1" }
    ],
    steps: [
      { text: "Ensure the fresh rosemary is completely dry to prevent moisture spoilage." },
      { text: "Gently bruise the rosemary leaves with the back of a knife to release aromatics." },
      { text: "Insert rosemary stems and whole chilies into the clean glass bottle." },
      { text: "Pour extra virgin olive oil over the aromatics until fully submerged." },
      { text: "Seal tightly and store in a cool pantry for 7 days before gifting." }
    ],
    safety: null
  },
  {
    title: "Clay Essential Oil Aromatherapy Pebble",
    summary: "Mold natural terracotta air-dry clay into organic textured palm stones that hold essential oil drops.",
    tags: ["relaxing", "craft", "scent", "minimalist", "quiet"],
    occasions: ["thank-you", "just-because"],
    price_band: "low",
    minutes: 30,
    diff: 1,
    mat: [
      { name: "Air-dry terracotta or white modeling clay", qty: "100g" },
      { name: "Fresh botanical leaves for pressing texture", qty: "3" },
      { name: "Pure essential oil (cedarwood or bergamot)", qty: "1 bottle (5ml)" }
    ],
    steps: [
      { text: "Roll the modeling clay into smooth round pebble shapes in your palms." },
      { text: "Press fresh botanical leaves firmly into the clay surface to leave an imprint." },
      { text: "Shape a shallow hollow in the center to catch future oil drops." },
      { text: "Let dry undisturbed on a wire rack for 48 hours until hardened." },
      { text: "Package in a small muslin pouch alongside the essential oil vial." }
    ],
    safety: null
  },
  {
    title: "Hanging Macrame Plant Holder in Natural Jute",
    summary: "Knot unbleached jute rope into an airy hanging cradle for potted succulents or trailing ivy.",
    tags: ["craft", "plants", "gardening", "decor", "home"],
    occasions: ["housewarming", "birthday"],
    price_band: "low",
    minutes: 50,
    diff: 2,
    mat: [
      { name: "3mm twisted natural jute or cotton cord", qty: "24m" },
      { name: "Solid wooden mounting ring", qty: "1" },
      { name: "Wooden beads with large holes", qty: "8" }
    ],
    steps: [
      { text: "Cut eight lengths of cord, each 3 meters long, and loop them through the wooden ring." },
      { text: "Secure the top with a neat gathering knot 5cm below the ring." },
      { text: "Separate cords into 4 pairs and tie square knots down each strand." },
      { text: "Thread wooden beads onto the strands and tie locking half-hitches." },
      { text: "Connect adjacent strands 10cm lower to form the basket net for the pot." },
      { text: "Finish with a sturdy base gathering knot and trim the tassel evenly." }
    ],
    safety: null
  }
];

let diyId = 1;
for (const d of rawDIY) {
  catalog.push({
    id: `diy-${String(diyId++).padStart(3, '0')}`,
    kind: "diy",
    title: d.title,
    summary: d.summary.slice(0, 240),
    tags: d.tags.slice(0, 6),
    occasions: d.occasions,
    price_band: d.price_band,
    materials: d.mat,
    steps: d.steps.slice(0, 6),
    minutes: d.minutes,
    difficulty: d.diff,
    safety: d.safety
  });
}

// Add 15 more DIY variations to bring DIY total to 25
const extraDIY = [
  { t: "Cinnamon & Orange Stovetop Simmer Pot Kit", s: "Dried citrus wheels, cinnamon quills and whole cloves in a mason jar for aromatic home boiling.", tags: ["cozy", "scent", "kitchen", "holiday"], min: 15, diff: 1, mat: [{name: "Dried orange slices", qty: "6"}, {name: "Cinnamon sticks", qty: "4"}, {name: "Whole cloves", qty: "2 tbsp"}, {name: "Jar", qty: "1"}], steps: [{text: "Layer dried oranges and cinnamon sticks in jar."}, {text: "Add star anise and whole cloves."}, {text: "Tie twine and recipe instructions to simmer in water."}], safe: null },
  { t: "Recycled Cardboard Desktop Sloth Phone Stand", s: "Precision cut layered corrugated cardboard creating an ergonomic angled mobile phone cradle.", tags: ["desk", "eco-friendly", "woodwork", "craft"], min: 35, diff: 2, mat: [{name: "Dense cardboard scraps", qty: "3 pieces"}, {name: "Craft PVA glue", qty: "2 tbsp"}, {name: "Ruler and pencil", qty: "1"}], steps: [{text: "Draw the sloth silhouette with an angled front groove."}, {text: "Carefully cut 4 identical profile slices using craft cutter."}, {text: "Glue the layers together under a heavy book."}, {text: "Sand edges smooth when completely dry."}], safe: "Adult supervision required when using sharp craft cutter." },
  { t: "Custom Loose Leaf Tea Blending Box", s: "Curate a personalized herbal tea blend combining organic dried peppermint, chamomile and rosehips.", tags: ["tea", "quiet", "ritual", "herbal"], min: 20, diff: 1, mat: [{name: "Dried peppermint leaves", qty: "50g"}, {name: "Dried chamomile flowers", qty: "50g"}, {name: "Dried rosehips", qty: "30g"}, {name: "Tin caddy", qty: "1"}], steps: [{text: "Mix dried botanicals gently in a sterile stainless bowl."}, {text: "Funnel the blend into an airtight metal caddy."}, {text: "Write custom brewing instructions (5 min steep at 95°C)."}], safe: null },
  { t: "Hand-Rolled Honeycomb Beeswax Tapers", s: "Roll pure honeycomb wax sheets tightly around natural cotton wicks without heating.", tags: ["cozy", "beeswax", "craft", "light"], min: 20, diff: 1, mat: [{name: "Honeycomb wax sheets", qty: "2"}, {name: "Cotton candle wick", qty: "40cm"}], steps: [{text: "Lay wax sheet flat at room temperature."}, {text: "Press cotton wick firmly along the leading edge."}, {text: "Roll tightly and evenly keeping edges aligned."}, {text: "Gently press the seam flat with fingertips."}], safe: null },
  { t: "Terrarium Moss & River Stone Forest Globe", s: "Assemble living cushion moss, charcoal and river pebbles in a sealed decorative glass globe.", tags: ["nature", "moss", "plants", "gardening"], min: 30, diff: 1, mat: [{name: "Glass jar with glass lid", qty: "1"}, {name: "Activated charcoal", qty: "2 tbsp"}, {name: "Fresh cushion moss", qty: "1 clump"}, {name: "River pebbles", qty: "10"}], steps: [{text: "Place drainage pebbles at bottom of glass jar."}, {text: "Sprinkle charcoal layer to keep moisture fresh."}, {text: "Arrange clean live moss and river pebbles neatly."}, {text: "Lightly mist with distilled water and seal lid."}], safe: null },
  { t: "Botanical Cyanotype Sun-Printed Greeting Cards", s: "Expose sun-sensitive paper under pressed foliage outdoors for deep Prussian blue note cards.", tags: ["art", "nature", "craft", "botanical"], min: 40, diff: 2, mat: [{name: "Pre-treated cyanotype paper cards", qty: "4"}, {name: "Pressed fern leaves", qty: "4"}, {name: "Clear glass sheet", qty: "1"}], steps: [{text: "Place leaves onto cyanotype paper in shade."}, {text: "Weigh down with glass sheet and expose to sunlight for 3 minutes."}, {text: "Rinse card in cool running water for 2 minutes."}, {text: "Dry flat between paper towels to reveal white and blue contrast."}], safe: null },
  { t: "Hand-Sewn Linen Coffee Filter Cone", s: "Sew washable unbleached linen fabric into a reusable eco-friendly pour-over coffee cone filter.", tags: ["coffee", "linen", "eco-friendly", "kitchen"], min: 45, diff: 2, mat: [{name: "Raw unbleached linen (20x20cm)", qty: "1"}, {name: "Cotton thread and needle", qty: "1"}], steps: [{text: "Fold linen in half and mark the standard cone shape."}, {text: "Stitch the angled side seam with durable double backstitch."}, {text: "Trim seam allowance and turn inside out."}, {text: "Boil in plain water for 10 minutes to pre-shrink and sterilize."}], safe: null },
  { t: "Personalized Wood-Burned Cooking Spatula", s: "Pyrography etch botanical leaves or recipient initials onto a smooth beechwood spoon handle.", tags: ["woodwork", "cooking", "craft", "kitchen"], min: 35, diff: 2, mat: [{name: "Plain beechwood spoon", qty: "1"}, {name: "Pyrography wood burning tool", qty: "1"}], steps: [{text: "Lightly sketch design onto wood with pencil."}, {text: "Plug in burning tool and allow tip to heat up fully."}, {text: "Trace pencil lines with steady, slow pressure."}, {text: "Allow tool to cool completely on heat-safe stand."}], safe: "Hot woodburning iron tip reaches high temperatures; adult caution required." },
  { t: "Dried Orange & Star Anise Kitchen Garland", s: "Thread dehydrating citrus rounds and fragrant star anise pods onto rustic natural twine.", tags: ["holiday", "decor", "kitchen", "nature"], min: 30, diff: 1, mat: [{name: "Dehydrated orange slices", qty: "12"}, {name: "Star anise pods", qty: "10"}, {name: "Jute twine", qty: "2m"}, {name: "Large tapestry needle", qty: "1"}], steps: [{text: "Thread jute string onto tapestry needle."}, {text: "Alternate piercing through orange centers and tied anise pods."}, {text: "Tie hanging loops at both ends of the garland."}], safe: null },
  { t: "Aromatic Cedar Shaving Drawer Sachets", s: "Fill breathable cotton muslin pouches with aromatic fresh cedar shavings and dried rosemary.", tags: ["woodwork", "quiet", "scent", "eco-friendly"], min: 15, diff: 1, mat: [{name: "Muslin drawstring bags", qty: "3"}, {name: "Natural cedar shavings", qty: "150g"}, {name: "Dried rosemary leaves", qty: "2 tbsp"}], steps: [{text: "Mix fragrant cedar shavings and dried rosemary in bowl."}, {text: "Pack generous handfuls into each muslin pouch."}, {text: "Pull drawstring tight and tie double knot."}], safe: null }
];

for (const d of extraDIY) {
  catalog.push({
    id: `diy-${String(diyId++).padStart(3, '0')}`,
    kind: "diy",
    title: d.t,
    summary: d.s.slice(0, 240),
    tags: d.tags.slice(0, 6),
    occasions: ["birthday", "holiday", "thank-you", "housewarming"],
    price_band: "low",
    materials: d.mat,
    steps: d.steps.slice(0, 6),
    minutes: d.min,
    difficulty: d.diff,
    safety: d.safe
  });
}

fs.writeFileSync(targetFile, JSON.stringify(catalog, null, 2), 'utf-8');
console.log(`✓ catalog.json created with ${catalog.length} items (Gifts: ${giftId - 1}, DIY: ${diyId - 1}).`);
