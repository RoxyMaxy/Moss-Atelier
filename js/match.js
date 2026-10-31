// js/match.js - Shared trait matching: accents, plurals, synonyms, and a deterministic tie-break.
// Used by retrieve.js and rank.js so that both agree on what "matches" a trait.

export function removeAccents(str = '') {
  return String(str).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

// Each group lists words that should match each other. Keep groups small and generic.
const SYNONYM_GROUPS = [
  ['sport', 'sports', 'football', 'soccer', 'running', 'run', 'fitness', 'hiking', 'hike', 'cycling', 'bike', 'swimming', 'yoga'],
  ['music', 'vinyl', 'instrument', 'guitar', 'piano', 'concert', 'audio', 'singing', 'song'],
  ['game', 'games', 'gaming', 'board', 'puzzle', 'video', 'chess', 'cards'],
  ['pet', 'pets', 'cat', 'cats', 'dog', 'dogs', 'animal', 'animals'],
  ['book', 'books', 'reading', 'novel', 'poetry', 'literature', 'library'],
  ['travel', 'trip', 'journey', 'adventure', 'explore', 'exploring'],
  ['tech', 'technology', 'gadget', 'gadgets', 'electronics', 'coding', 'computer', 'code'],
  ['coffee', 'espresso', 'cafe'],
  ['tea', 'tisane', 'herbal'],
  ['garden', 'gardening', 'plant', 'plants', 'botanical', 'nature', 'outdoor', 'outdoors'],
  ['cook', 'cooking', 'kitchen', 'baking', 'bake', 'food', 'recipe', 'recipes'],
  ['art', 'painting', 'drawing', 'craft', 'crafts', 'handmade', 'diy', 'sewing', 'knitting'],
  ['wine', 'drink', 'cocktail', 'cocktails', 'beer'],
  ['quiet', 'calm', 'relaxing', 'mindful', 'slow', 'cozy', 'cosy'],
  ['child', 'children', 'kids', 'kid', 'toy', 'toys', 'play'],
  ['writing', 'journal', 'notebook', 'stationery', 'pen'],
  ['photo', 'photography', 'camera'],
  ['candle', 'candles', 'scent', 'fragrance', 'home', 'decor', 'decoration']
];

/** Simple stemming: "games" -> "game", "stories" -> "story", "cats" -> "cat". */
export function stem(word = '') {
  const w = removeAccents(word).replace(/[^a-z0-9-]/g, '');
  if (w.length > 4 && w.endsWith('ies')) return w.slice(0, -3) + 'y';
  if (w.length > 3 && w.endsWith('s') && !w.endsWith('ss')) return w.slice(0, -1);
  return w;
}

/** Splits free text into stemmed tokens. "video games" -> ["video", "game"]. */
export function tokenize(text = '') {
  return removeAccents(text)
    .split(/[^a-z0-9]+/)
    .filter(t => t.length > 1)
    .map(stem);
}

const GROUP_OF = new Map();
for (const group of SYNONYM_GROUPS) {
  const stems = new Set(group.map(stem));
  for (const s of stems) {
    if (!GROUP_OF.has(s)) GROUP_OF.set(s, new Set());
    stems.forEach(other => GROUP_OF.get(s).add(other));
  }
}

/** Expands a trait into its own tokens plus synonyms. */
export function expandTrait(trait = '') {
  const expanded = new Set();
  for (const token of tokenize(trait)) {
    expanded.add(token);
    const group = GROUP_OF.get(token);
    if (group) group.forEach(g => expanded.add(g));
  }
  return expanded;
}

/** Scores one trait against one item: 2.0 tag, 1.5 title, 1.0 summary, 0 otherwise. */
export function matchTrait(trait, item) {
  const expanded = expandTrait(trait);
  if (expanded.size === 0) return 0;
  const tagTokens = new Set((item.tags || []).flatMap(t => tokenize(t)));
  const titleTokens = new Set(tokenize(item.title || ''));
  const summaryTokens = new Set(tokenize(item.summary || ''));
  const hit = set => [...expanded].some(t => set.has(t));
  if (hit(tagTokens)) return 2.0;
  if (hit(titleTokens)) return 1.5;
  if (hit(summaryTokens)) return 1.0;
  return 0;
}

/** Normalised trait score in [0, 1]: best match per trait, averaged. */
export function traitScore(traits = [], item = {}) {
  if (!traits.length) return 0;
  const total = traits.reduce((sum, t) => sum + matchTrait(t, item), 0);
  return Math.min(1, total / (2 * traits.length));
}

/** FNV-1a 32-bit hash, deterministic across runs. */
function hash32(str) {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h >>> 0;
}

/** Seed built from the query itself, so different queries break ties differently. */
export function seedFor(traits = [], occasion = '', minBudget = 0, maxBudget = 0) {
  return [...traits].sort().join('|') + '#' + occasion + '#' + minBudget + '-' + maxBudget;
}

/** Stable tie-break key: same query and item always give the same position. */
export function tieKey(seed, id) {
  return hash32(seed + '|' + id);
}

/** Sorts by score (descending), then by the seeded tie-break. Never by catalogue order. */
export function sortWithTieBreak(items, scoreOf, idOf, seed) {
  return items.slice().sort((a, b) => {
    const diff = scoreOf(b) - scoreOf(a);
    if (diff !== 0) return diff;
    return tieKey(seed, idOf(a)) - tieKey(seed, idOf(b));
  });
}
