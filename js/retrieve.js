// js/retrieve.js - Trait and occasion retrieval with Reciprocal Rank Fusion (k = 60)
// Matching lives in match.js. Ties are broken by a seeded hash of the query, never by catalogue order.

import { removeAccents, traitScore, seedFor, sortWithTieBreak } from './match.js';

export { removeAccents };

/**
 * Reciprocal Rank Fusion (RRF)
 * @param {Array<Array<{id: string, item: any}>>} rankedLists
 * @param {number} k - smoothing constant (default 60)
 */
export function reciprocalRankFusion(rankedLists, k = 60) {
  const scores = new Map();
  const itemMap = new Map();

  for (const list of rankedLists) {
    list.forEach((entry, rankIndex) => {
      itemMap.set(entry.id, entry.item);
      const current = scores.get(entry.id) || 0;
      scores.set(entry.id, current + 1 / (k + (rankIndex + 1)));
    });
  }

  const fused = [];
  for (const [id, score] of scores.entries()) {
    fused.push({ id, score, item: itemMap.get(id) });
  }
  fused.sort((a, b) => b.score - a.score || (a.id < b.id ? -1 : 1));
  return fused;
}

/**
 * Retrieval across catalogue items.
 * @param {Array<Object>} catalog
 * @param {{traits?: string[], occasion?: string, minBudget?: number, maxBudget?: number, kind?: string}} query
 */
export function retrieveCandidates(catalog, query = {}) {
  const {
    traits = [],
    occasion = '',
    minBudget = 0,
    maxBudget = 100,
    kind = 'all'
  } = query;

  const normalizedTraits = traits.map(t => removeAccents(String(t).trim())).filter(Boolean);
  const normalizedOccasion = removeAccents(String(occasion).trim());
  const seed = seedFor(normalizedTraits, normalizedOccasion, minBudget, maxBudget);

  // Budget filter (+10% tolerance on gifts, DIY items have no price)
  const allowedMaxPrice = maxBudget > 0 ? maxBudget * 1.1 : Infinity;
  const eligible = catalog.filter(item => {
    if (kind !== 'all' && item.kind !== kind) return false;
    if (item.kind === 'gift' && typeof item.price === 'number' && item.price > allowedMaxPrice) return false;
    return true;
  });

  // List 1: trait relevance (tags > title > summary, synonyms included)
  const traitRanked = sortWithTieBreak(
    eligible.map(item => ({ id: item.id, item, rawScore: traitScore(normalizedTraits, item) })),
    e => e.rawScore,
    e => e.id,
    seed
  );

  // List 2: occasion match
  const occasionRanked = sortWithTieBreak(
    eligible.map(item => {
      const occasions = (item.occasions || []).map(o => removeAccents(o));
      const hit = normalizedOccasion && occasions.includes(normalizedOccasion);
      return { id: item.id, item, rawScore: hit ? 1 : 0 };
    }),
    e => e.rawScore,
    e => e.id,
    seed
  );

  const fused = reciprocalRankFusion([traitRanked, occasionRanked], 60);
  return fused.slice(0, 8).map(res => ({ ...res.item, rrf_score: res.score }));
}
