// js/diy.js - DIY project validation, safety enforcement, and catalogue adaptation

const SAFETY_KEYWORDS = [
  'knife',
  'cutter',
  'heat',
  'iron',
  'glue gun',
  'solder',
  'bleach',
  'battery'
];

const GENERIC_SAFETY_WARNING = 'Adult supervision for cutting and heat steps.';

/**
 * Checks steps for safety hazard keywords and attaches appropriate warning
 * @param {Array<{text: string}>} steps
 * @param {string|null} existingSafety
 * @returns {string|null}
 */
export function checkSafetyRequirements(steps = [], existingSafety = null) {
  if (existingSafety && typeof existingSafety === 'string' && existingSafety.trim().length > 0) {
    return existingSafety.trim();
  }

  const allStepText = steps.map(s => (s.text || '').toLowerCase()).join(' ');
  const hasHazard = SAFETY_KEYWORDS.some(kw => allStepText.includes(kw));

  if (hasHazard) {
    return GENERIC_SAFETY_WARNING;
  }
  return null;
}

/**
 * Validates DIY idea schema and bounds
 * @param {Object} idea
 * @returns {Object|null}
 */
export function validateDIYIdea(idea) {
  if (!idea || typeof idea.title !== 'string') return null;

  const title = idea.title.trim();
  const difficulty = Math.min(3, Math.max(1, Number(idea.difficulty) || 1));
  const minutes = Math.min(240, Math.max(15, Number(idea.minutes) || 30));

  // Materials (max 10 items)
  let materials = Array.isArray(idea.materials) ? idea.materials : [];
  materials = materials
    .filter(m => m && typeof m.name === 'string')
    .slice(0, 10)
    .map(m => ({
      name: m.name.trim(),
      qty: (m.qty || '1').toString().trim()
    }));

  if (materials.length === 0) return null;

  // Steps (up to 6 steps per prompt spec)
  let steps = Array.isArray(idea.steps) ? idea.steps : [];
  steps = steps
    .filter(s => s && typeof s.text === 'string')
    .slice(0, 6)
    .map(s => ({
      text: s.text.trim().slice(0, 200)
    }));

  if (steps.length === 0) return null;

  const safety = checkSafetyRequirements(steps, idea.safety);

  return {
    id: idea.id || `diy-${Math.random().toString(36).slice(2, 8)}`,
    title,
    difficulty,
    minutes,
    materials,
    steps,
    safety
  };
}

/**
 * Validates a list of DIY ideas, falling back to demo set if fewer than 2 valid items exist
 * @param {Array<Object>} rawIdeas
 * @param {Array<Object>} fallbackList
 * @returns {Array<Object>}
 */
export function curateDIYIdeas(rawIdeas = [], fallbackList = []) {
  const valid = [];
  for (const idea of rawIdeas) {
    const sanitized = validateDIYIdea(idea);
    if (sanitized) valid.push(sanitized);
    if (valid.length === 2) break; // We curate 2 DIY ideas
  }

  if (valid.length < 2 && Array.isArray(fallbackList)) {
    for (const fb of fallbackList) {
      if (!valid.some(v => v.title === fb.title)) {
        const sanitizedFb = validateDIYIdea(fb);
        if (sanitizedFb) valid.push(sanitizedFb);
      }
      if (valid.length >= 2) break;
    }
  }

  return valid.slice(0, 2);
}
