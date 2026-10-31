// js/gemma.js - Gemma rationale client: Ollama /api/chat (local, offline), with a deterministic fallback.
// The returned array carries a `backend` property: 'ollama' when the model answered, 'template' otherwise.

import { validateGroundedPicks } from './grounding.js';

const DEFAULT_ENDPOINT = 'http://127.0.0.1:11434/api/chat';
const DEFAULT_MODEL = 'gemma3:1b';

export async function generateGiftRationale(candidates = [], profile = {}) {
  const {
    traits = [],
    occasion = 'birthday',
    endpoint = DEFAULT_ENDPOINT,
    model = DEFAULT_MODEL
  } = profile;
  const primaryTrait = traits[0] || 'interests';

  if (!candidates || candidates.length === 0) {
    const empty = [];
    empty.backend = 'none';
    return empty;
  }

  const candidateLines = candidates.map(c =>
    `- ID: ${c.id} | Title: "${c.title}" | Price: ${c.price ?? 'unknown'} EUR | Tags: ${(c.tags || []).join(', ')}`
  ).join('\n');

  const systemPrompt = 'You are a calm gift curator. Select 3 to 5 gifts from the candidate list that fit the recipient. ' +
    'For each pick write one short sentence (under 180 characters) explaining the fit. ' +
    'Use only the IDs and facts in the list. Reply with JSON only: {"picks": [{"id": "item-id", "why": "explanation"}]}';

  const userPrompt = `Occasion: ${occasion}\nTraits: ${traits.join(', ')}\nCandidates:\n${candidateLines}\n\nReturn JSON with 3 to 5 picks.`;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 120000);

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        stream: false,
        format: 'json',
        options: { temperature: 0.2, num_ctx: 2048, num_predict: 400 },
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ]
      }),
      signal: controller.signal
    });
    clearTimeout(timeout);

    if (res.ok) {
      const data = await res.json();
      const rawText = data.message?.content || '';
      const jsonMatch = rawText.match(/\{[\s\S]*"picks"[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        if (Array.isArray(parsed.picks)) {
          const picks = validateGroundedPicks(parsed.picks, candidates, primaryTrait);
          picks.backend = 'ollama';
          return picks;
        }
      }
    }
  } catch {
    // Ollama not running or slow: fall through to the deterministic fallback
  }

  const picks = validateGroundedPicks([], candidates, primaryTrait);
  picks.backend = 'template';
  return picks;
}
