// js/rank.js - Deterministic scoring function for gift recommendations
// Weights: 40% trait relevance, 30% occasion match, 30% budget fit

import { removeAccents } from './retrieve.js';

/**
 * Calculates budget fit: 1.0 at midpoint of [minBudget, maxBudget], decaying linearly to 0 at edges.
 * Drops items more than 10% outside maxBudget.
 */
export function calculateBudgetFit(price, minBudget, maxBudget) {
  if (typeof price !== 'number' || isNaN(price)) {
    return 0.5; // neutral for items without explicit price
  }
  const min = Math.max(0, minBudget);
  const max = Math.max(min + 1, maxBudget);

  // If outside 110% of max, return -1 to signal exclusion
  if (price > max * 1.1) {
    return -1;
  }

  const mid = (min + max) / 2;
  const halfRange = (max - min) / 2 || 1;
  const distance = Math.abs(price - mid);

  return Math.max(0, 1 - (distance / halfRange));
}

/**
 * Ranks candidates deterministically.
 * @param {Array<Object>} candidates
 * @param {Object} profile - { traits: string[], occasion: string, minBudget: number, maxBudget: number }
 * @returns {Array<Object>} sorted top candidates
 */
export function rankCandidates(candidates = [], profile = {}) {
  const {
    traits = [],
    occasion = '',
    minBudget = 10,
    maxBudget = 50
  } = profile;

  const normalizedTraits = traits.map(t => removeAccents(t.trim())).filter(Boolean);
  const normalizedOccasion = removeAccents(occasion.trim());

  const scored = [];

  for (const item of candidates) {
    // 1. Budget Fit (30%)
    const bFit = calculateBudgetFit(item.price, minBudget, maxBudget);
    if (bFit < 0) {
      continue; // Filtered: >10% over budget
    }

    // 2. Trait Relevance (40%)
    let traitScore = 0;
    if (normalizedTraits.length > 0) {
      const itemTitle = removeAccents(item.title);
      const itemTags = (item.tags || []).map(t => removeAccents(t));
      let matches = 0;

      for (const trait of normalizedTraits) {
        if (itemTags.includes(trait) || itemTitle.includes(trait)) {
          matches++;
        }
      }
      traitScore = Math.min(1.0, matches / normalizedTraits.length);
    } else {
      traitScore = 0.5;
    }

    // 3. Occasion Match (30%)
    let occasionScore = 0;
    if (normalizedOccasion) {
      const itemOccasions = (item.occasions || []).map(o => removeAccents(o));
      occasionScore = itemOccasions.includes(normalizedOccasion) ? 1.0 : 0.2;
    } else {
      occasionScore = 0.5;
    }

    const finalScore = (0.40 * traitScore) + (0.30 * occasionScore) + (0.30 * bFit);

    scored.push({
      ...item,
      score: Number(finalScore.toFixed(4)),
      scoreBreakdown: {
        relevance: traitScore,
        occasion: occasionScore,
        budgetFit: bFit
      }
    });
  }

  // Sort descending by score
  scored.sort((a, b) => b.score - a.score);

  // Return top 8 candidates
  return scored.slice(0, 8);
}
