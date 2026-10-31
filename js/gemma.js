// js/gemma.js - Local Gemma inference client with offline fallback

import { validateGroundedPicks } from './grounding.js';

export async function generateGiftRationale(candidates = [], profile = {}) {
  const { traits = [], occasion = 'birthday', endpoint = 'http://127.0.0.1:8080/v1/chat/completions' } = profile;
  const primaryTrait = traits[0] || 'interests';

  if (!candidates || candidates.length === 0) {
    return [];
  }

  // Format candidates into compact lines
  const candidateLines = candidates.map(c => 
    `- ID: ${c.id} | Title: "${c.title}" | Price: €${c.price || '—'} | Tags: ${(c.tags || []).join(', ')}`
  ).join('\n');

  const systemPrompt = `You are a quiet, thoughtful gift curator for Moss Atelier. Select 3 to 5 gifts from the candidate list that best match the recipient. For each pick, write a calm, 1-sentence reason (under 180 characters) explaining why it fits. Never invent prices or products outside the list. Return strictly JSON in the following format:
{"picks": [{"id": "item-id", "why": "Explanation"}]}`;

  const userPrompt = `Occasion: ${occasion}
Traits: ${traits.join(', ')}
Candidate Gifts:
${candidateLines}

Return JSON with 3 to 5 picks now.`;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 120000); // 120s timeout

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'gemma-3-1b-it',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        max_tokens: 512,
        temperature: 0.2
      }),
      signal: controller.signal
    });

    clearTimeout(timeout);

    if (res.ok) {
      const data = await res.json();
      const rawText = data.choices?.[0]?.message?.content || '';
      
      // Extract JSON from response
      const jsonMatch = rawText.match(/\{[\s\S]*"picks"[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        if (Array.isArray(parsed.picks)) {
          return validateGroundedPicks(parsed.picks, candidates, primaryTrait);
        }
      }
    }
  } catch {
    // Offline or server not responding: fallback cleanly to grounded candidates
  }

  // Fallback: ground top candidates with deterministic reasons
  return validateGroundedPicks([], candidates, primaryTrait);
}
