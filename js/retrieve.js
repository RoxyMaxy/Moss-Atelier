// js/retrieve.js - Hybrid search & Reciprocal Rank Fusion (k = 60)
// Strips accents, scores relevance & occasion, and strictly filters budget (+10% tolerance)

export function removeAccents(str = '') {
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

/**
 * Reciprocal Rank Fusion (RRF)
 * @param {Array<Array<{id: string, item: any}>>} rankedLists - arrays of ranked results
 * @param {number} k - smoothing constant (default: 60)
 */
export function reciprocalRankFusion(rankedLists, k = 60) {
  const scores = new Map();
  const itemMap = new Map();

  for (const list of rankedLists) {
    list.forEach((entry, rankIndex) => {
      const id = entry.id;
      itemMap.set(id, entry.item);
      const currentScore = scores.get(id) || 0;
      // rank is 1-based index (rankIndex + 1)
      const rrfContribution = 1 / (k + (rankIndex + 1));
      scores.set(id, currentScore + rrfContribution);
    });
  }

  const fused = [];
  for (const [id, score] of scores.entries()) {
    fused.push({ id, score, item: itemMap.get(id) });
  }

  // Sort descending by RRF score
  fused.sort((a, b) => b.score - a.score);
  return fused;
}

/**
 * Hybrid retrieval engine across catalog items
 */
export function retrieveCandidates(catalog, query = {}) {
  const {
    traits = [],
    occasion = '',
    minBudget = 0,
    maxBudget = 100,
    kind = 'all' // 'all', 'gift', 'diy'
  } = query;

  const normalizedTraits = traits.map(t => removeAccents(t.trim())).filter(Boolean);
  const normalizedOccasion = removeAccents(occasion.trim());

  // 1. Budget Filter (+10% tolerance)
  const allowedMaxPrice = maxBudget > 0 ? maxBudget * 1.1 : Infinity;

  const eligibleItems = catalog.filter(item => {
    // Kind filter
    if (kind !== 'all' && item.kind !== kind) return false;

    // DIY items have no price; gifts must fit budget
    if (item.kind === 'gift' && typeof item.price === 'number') {
      if (item.price > allowedMaxPrice) return false;
      // Below min budget by more than 20% can also be filtered if strict
    }
    return true;
  });

  // Rank List 1: Trait relevance (keyword / tag overlap)
  const traitRanked = eligibleItems
    .map(item => {
      const itemTitle = removeAccents(item.title);
      const itemSummary = removeAccents(item.summary || '');
      const itemTags = (item.tags || []).map(t => removeAccents(t));

      let matchScore = 0;
      for (const trait of normalizedTraits) {
        if (itemTags.includes(trait)) {
          matchScore += 2.0;
        } else if (itemTitle.includes(trait)) {
          matchScore += 1.5;
        } else if (itemSummary.includes(trait)) {
          matchScore += 1.0;
        }
      }

      return { id: item.id, item, rawScore: matchScore };
    })
    .sort((a, b) => b.rawScore - a.rawScore);

  // Rank List 2: Occasion match
  const occasionRanked = eligibleItems
    .map(item => {
      const occasions = (item.occasions || []).map(o => removeAccents(o));
      let matchScore = 0;
      if (normalizedOccasion && occasions.includes(normalizedOccasion)) {
        matchScore = 2.0;
      }
      return { id: item.id, item, rawScore: matchScore };
    })
    .sort((a, b) => b.rawScore - a.rawScore);

  // Perform Reciprocal Rank Fusion (k = 60)
  const fusedResults = reciprocalRankFusion([traitRanked, occasionRanked], 60);

  // Return the top candidates (up to 8)
  return fusedResults.slice(0, 8).map(res => ({
    ...res.item,
    rrf_score: res.score
  }));
}
