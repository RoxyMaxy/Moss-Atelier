// tests/grounding.test.js - Unit tests for grounding validation and anti-hallucination

import test from 'node:test';
import assert from 'node:assert';
import { validateGroundedPicks } from '../js/grounding.js';

test('Grounding and Hallucination Validator test suite', async (t) => {
  const candidates = [
    { id: 'c1', title: 'Ceramic Pour-Over', price: 28, tags: ['coffee'] },
    { id: 'c2', title: 'Brass Bookmark', price: 14, tags: ['reading'] },
    { id: 'c3', title: 'Linen Garden Apron', price: 38, tags: ['gardening'] },
    { id: 'c4', title: 'Soy Wax Candle', price: 18, tags: ['cozy'] }
  ];

  await t.test('Drops invented IDs not present in retrieved candidates', () => {
    const rawPicks = [
      { id: 'c1', why: 'Great ceramic craftsmanship.' },
      { id: 'c-fake-999', why: 'Made up electronic gadget.' },
      { id: 'c2', why: 'A quiet reading accessory.' }
    ];

    const validated = validateGroundedPicks(rawPicks, candidates, 'coffee');
    const ids = validated.map(v => v.id);
    assert.strictEqual(ids.includes('c-fake-999'), false);
    assert.ok(ids.includes('c1'));
    assert.ok(ids.includes('c2'));
  });

  await t.test('Removes duplicate IDs from model output', () => {
    const rawPicks = [
      { id: 'c1', why: 'Reason one.' },
      { id: 'c1', why: 'Duplicate reason.' }
    ];

    const validated = validateGroundedPicks(rawPicks, candidates, 'coffee');
    const c1Count = validated.filter(v => v.id === 'c1').length;
    assert.strictEqual(c1Count, 1);
  });

  await t.test('Fills missing picks up to at least 3 using template reason', () => {
    const rawPicks = [{ id: 'c1', why: 'Authentic dripper.' }];
    const validated = validateGroundedPicks(rawPicks, candidates, 'coffee');
    assert.strictEqual(validated.length, 3);
    assert.strictEqual(validated[1].why, 'Matches coffee and fits the occasion.');
    assert.strictEqual(validated[2].why, 'Matches coffee and fits the occasion.');
  });

  await t.test('Replaces explanations containing ungrounded numbers with template reason', () => {
    const rawPicks = [
      { id: 'c1', why: 'Costs 999 euros and comes with 50 filters.' } // 999 and 50 are not in data
    ];
    const validated = validateGroundedPicks(rawPicks, candidates, 'coffee');
    assert.strictEqual(validated[0].why, 'Matches coffee and fits the occasion.');
  });
});
