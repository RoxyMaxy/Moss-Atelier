// tests/diy.test.js - Unit tests for DIY projects and safety enforcement

import test from 'node:test';
import assert from 'node:assert';
import { checkSafetyRequirements, validateDIYIdea, curateDIYIdeas } from '../js/diy.js';

test('DIY Projects & Safety Enforcement test suite', async (t) => {
  await t.test('checkSafetyRequirements attaches generic warning for knife, heat, etc.', () => {
    const stepsWithKnife = [{ text: 'Cut the cardboard carefully using a sharp craft knife.' }];
    assert.strictEqual(
      checkSafetyRequirements(stepsWithKnife),
      'Adult supervision for cutting and heat steps.'
    );

    const stepsWithHeat = [{ text: 'Melt the wax flakes over low heat.' }];
    assert.strictEqual(
      checkSafetyRequirements(stepsWithHeat),
      'Adult supervision for cutting and heat steps.'
    );

    const safeSteps = [{ text: 'Stir loose tea leaves in a ceramic bowl.' }];
    assert.strictEqual(checkSafetyRequirements(safeSteps), null);

    // Explicit custom safety is preserved
    const custom = 'Wear protective leather gloves.';
    assert.strictEqual(checkSafetyRequirements(stepsWithKnife, custom), custom);
  });

  await t.test('validateDIYIdea enforces constraints (max 6 steps, 1-3 diff)', () => {
    const raw = {
      title: 'Wooden Book Stand',
      difficulty: 5, // out of range -> clamp to 3
      minutes: 10,  // below 15 -> clamp to 15
      materials: [{ name: 'Hardwood scrap', qty: '1' }],
      steps: [
        { text: 'Step 1' },
        { text: 'Step 2' },
        { text: 'Step 3' },
        { text: 'Step 4' },
        { text: 'Step 5' },
        { text: 'Step 6' },
        { text: 'Step 7 (should be dropped)' }
      ]
    };

    const validated = validateDIYIdea(raw);
    assert.ok(validated);
    assert.strictEqual(validated.difficulty, 3);
    assert.strictEqual(validated.minutes, 15);
    assert.strictEqual(validated.steps.length, 6);
  });

  await t.test('curateDIYIdeas falls back to fallback list when fewer than 2 valid items exist', () => {
    const fallbackList = [
      {
        title: 'Herb Planter',
        difficulty: 1,
        minutes: 30,
        materials: [{ name: 'Cup', qty: '1' }],
        steps: [{ text: 'Plant the herb' }]
      },
      {
        title: 'Coffee Candle',
        difficulty: 2,
        minutes: 45,
        materials: [{ name: 'Wax', qty: '100g' }],
        steps: [{ text: 'Melt wax over heat' }]
      }
    ];

    const curated = curateDIYIdeas([], fallbackList);
    assert.strictEqual(curated.length, 2);
    assert.strictEqual(curated[0].title, 'Herb Planter');
    assert.strictEqual(curated[1].title, 'Coffee Candle');
  });
});
