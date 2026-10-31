// js/rank.js - Deterministic scoring for gift recommendations
// Weights: 40% trait relevance, 30% occasion match, 30% budget fit

import { removeAccents, traitScore, seedFor, sortWithTieBreak } from './match.js';

/**
 * Budget fit: 1.0 at the midpoint of [min, max], falling linearly to 0 at the edges.
 * Returns -1 when the price is more than 10% above max (excluded).
 */
export function calculateBudgetFit(price, minBudget, maxBudget) {
  if (typeof price !== 'number' || isNaN(price)) {
    return 0.5;
  }
  const min = Math.max(0, minBudget);
  const max = Math.max(min + 1, maxBudget);
  if (price > max * 1.1) {
    return -1;
  }
  const mid = (min + max) / 2;
  const halfRange = (max - min) / 2 || 1;
  return Math.max(0, 1 - (Math.abs(price - mid) / halfRange));
}

/**
 * @param {Array<Object>} candidates
 * @param {{traits?: string[], occasion?: string, minBudget?: number, maxBudget?: number}} profile
 * @returns {Array<Object>} top 8, sorted
 */
export function rankCandidates(candidates = [], profile = {}) {
  const { traits = [], occasion = '', minBudget = 10, maxBudget = 50 } = profile;

  const normalizedTraits = traits.map(t => removeAccents(String(t).trim())).filter(Boolean);
  const normalizedOccasion = removeAccents(String(occasion).trim());
  const seed = seedFor(normalizedTraits, normalizedOccasion, minBudget, maxBudget);

  const scored = [];
  for (const item of candidates) {
    const bFit = calculateBudgetFit(item.price, minBudget, maxBudget);
    if (bFit < 0) continue;

    const relevance = normalizedTraits.length > 0 ? traitScore(normalizedTraits, item) : 0.5;

    let occasionScore = 0.5;
    if (normalizedOccasion) {
      const itemOccasions = (item.occasions || []).map(o => removeAccents(o));
      occasionScore = itemOccasions.includes(normalizedOccasion) ? 1.0 : 0.2;
    }

    const finalScore = (0.40 * relevance) + (0.30 * occasionScore) + (0.30 * bFit);
    scored.push({
      ...item,
      score: Number(finalScore.toFixed(4)),
      scoreBreakdown: { relevance, occasion: occasionScore, budgetFit: bFit }
    });
  }

  return sortWithTieBreak(scored, s => s.score, s => s.id, seed).slice(0, 8);
}
