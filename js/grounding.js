// js/grounding.js - Grounding and hallucination validator for gift picks

/**
 * Validates and sanitizes model output against grounded candidate data.
 * @param {Array<Object>} rawPicks - [{ id: string, why: string, tags?: string[] }]
 * @param {Array<Object>} candidates - Retrieved candidate items
 * @param {string} fallbackTrait - Primary trait for template reasons
 * @returns {Array<Object>} Validated, grounded picks (between 3 and 5)
 */
export function validateGroundedPicks(rawPicks = [], candidates = [], fallbackTrait = 'interests') {
  const candidateMap = new Map();
  candidates.forEach(c => candidateMap.set(c.id, c));

  const validPicks = [];
  const seenIds = new Set();
  const defaultTemplate = `Matches ${fallbackTrait} and fits the occasion.`;

  for (const pick of rawPicks) {
    if (!pick || typeof pick.id !== 'string') continue;
    const item = candidateMap.get(pick.id);

    // Rule 1: ID must exist in candidates
    if (!item) continue;

    // Rule 2: No duplicates
    if (seenIds.has(pick.id)) continue;
    seenIds.add(pick.id);

    // Rule 3: Sanitize reason
    let why = (typeof pick.why === 'string' ? pick.why.trim() : '');
    if (!why || why.length > 200) {
      why = defaultTemplate;
    }

    // Rule 4: Numerical claim validation
    // Extract numbers from explanation (e.g. "costs 45", "contains 10")
    const numbersInWhy = why.match(/\b\d+(\.\d+)?\b/g);
    if (numbersInWhy) {
      const allowedText = `${item.title} ${item.summary || ''} ${item.price || ''}`;
      const hasUngroundedNumber = numbersInWhy.some(num => !allowedText.includes(num));
      if (hasUngroundedNumber) {
        why = defaultTemplate;
      }
    }

    validPicks.push({
      id: item.id,
      title: item.title,
      price: item.price,
      currency: item.currency || 'EUR',
      tags: item.tags || [],
      why,
      grounded: true
    });

    if (validPicks.length === 5) break;
  }

  // Rule 5: Fill missing positions up to at least 3 (and up to 5 if candidates allow)
  if (validPicks.length < 3) {
    for (const cand of candidates) {
      if (!seenIds.has(cand.id)) {
        seenIds.add(cand.id);
        validPicks.push({
          id: cand.id,
          title: cand.title,
          price: cand.price,
          currency: cand.currency || 'EUR',
          tags: cand.tags || [],
          why: defaultTemplate,
          grounded: true
        });
      }
      if (validPicks.length >= 3) break;
    }
  }

  return validPicks;
}
