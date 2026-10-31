// tests/rank.test.js - Unit tests for deterministic ranking function

import test from 'node:test';
import assert from 'node:assert';
import { calculateBudgetFit, rankCandidates } from '../js/rank.js';

test('Deterministic Ranking test suite', async (t) => {
  await t.test('calculateBudgetFit yields 1.0 at midpoint and drops >110% max', () => {
    // Range [20, 40], midpoint = 30
    assert.strictEqual(calculateBudgetFit(30, 20, 40), 1.0);
    // Boundary at 40 -> 0.0
    assert.strictEqual(calculateBudgetFit(40, 20, 40), 0.0);
    // Boundary at 20 -> 0.0
    assert.strictEqual(calculateBudgetFit(20, 20, 40), 0.0);
    // 44 is 110% of 40 -> allowed (returns 0)
    assert.ok(calculateBudgetFit(44, 20, 40) >= 0);
    // 45 is > 110% of 40 -> -1 (excluded)
    assert.strictEqual(calculateBudgetFit(45, 20, 40), -1);
  });

  await t.test('rankCandidates ranks by 40% trait, 30% occasion, 30% budget', () => {
    const candidates = [
      { id: '1', title: 'Tea Mug', tags: ['tea', 'quiet'], occasions: ['birthday'], price: 30 },
      { id: '2', title: 'Coffee Dripper', tags: ['coffee'], occasions: ['holiday'], price: 30 },
      { id: '3', title: 'Garden Shears', tags: ['gardening'], occasions: ['birthday'], price: 100 } // way over budget
    ];

    const ranked = rankCandidates(candidates, {
      traits: ['tea', 'quiet'],
      occasion: 'birthday',
      minBudget: 20,
      maxBudget: 40
    });

    // Item 3 should be dropped
    assert.strictEqual(ranked.length, 2);
    // Item 1 has 100% trait match + 100% occasion match + 100% budget fit
    assert.strictEqual(ranked[0].id, '1');
    assert.strictEqual(ranked[0].score, 1.0);
    // Item 2 has 0% trait match, low occasion, high budget fit
    assert.strictEqual(ranked[1].id, '2');
    assert.ok(ranked[0].score > ranked[1].score);
  });
});
