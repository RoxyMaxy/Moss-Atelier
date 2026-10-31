// tests/retrieve.test.js - Unit tests for hybrid search & Reciprocal Rank Fusion (k = 60)

import test from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { reciprocalRankFusion, retrieveCandidates, removeAccents } from '../js/retrieve.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(__dirname, '..');
const CATALOG_PATH = path.join(ROOT_DIR, 'catalog/catalog.json');

test('Reciprocal Rank Fusion (RRF) test suite', async (t) => {
  await t.test('removeAccents normalizes accented characters and case', () => {
    assert.strictEqual(removeAccents('Café Crème'), 'cafe creme');
    assert.strictEqual(removeAccents('Thé Vert'), 'the vert');
    assert.strictEqual(removeAccents('Gâteau'), 'gateau');
  });

  await t.test('reciprocalRankFusion fuses two ranked lists correctly with k=60', () => {
    const list1 = [
      { id: 'item-A', item: { name: 'A' } },
      { id: 'item-B', item: { name: 'B' } },
      { id: 'item-C', item: { name: 'C' } }
    ];
    const list2 = [
      { id: 'item-B', item: { name: 'B' } },
      { id: 'item-A', item: { name: 'A' } },
      { id: 'item-D', item: { name: 'D' } }
    ];

    const fused = reciprocalRankFusion([list1, list2], 60);

    // item-A: 1/(60+1) + 1/(60+2) = 1/61 + 1/62 = 0.016393 + 0.016129 = 0.032522
    // item-B: 1/(60+2) + 1/(60+1) = 0.032522
    // Both A and B must be at the top ahead of C and D
    assert.strictEqual(fused.length, 4);
    const topIds = [fused[0].id, fused[1].id];
    assert.ok(topIds.includes('item-A'));
    assert.ok(topIds.includes('item-B'));
    assert.ok(fused[2].score < fused[0].score);
  });

  await t.test('retrieveCandidates filters items more than 10% above maxBudget', () => {
    const fixture = [
      { id: '1', kind: 'gift', title: 'Mug', tags: ['tea'], occasions: ['birthday'], price: 30 },
      { id: '2', kind: 'gift', title: 'Infuser', tags: ['tea'], occasions: ['birthday'], price: 54 }, // exactly 108% of 50 -> kept
      { id: '3', kind: 'gift', title: 'Teapot', tags: ['tea'], occasions: ['birthday'], price: 60 }   // 120% of 50 -> dropped
    ];

    const results = retrieveCandidates(fixture, {
      traits: ['tea'],
      occasion: 'birthday',
      maxBudget: 50
    });

    const ids = results.map(r => r.id);
    assert.ok(ids.includes('1'));
    assert.ok(ids.includes('2'));
    assert.strictEqual(ids.includes('3'), false);
  });

  await t.test('Acceptance Check 3: Query "Coffee, birthday, quiet" returns ranked candidates in < 5 seconds', () => {
    const catalog = JSON.parse(fs.readFileSync(CATALOG_PATH, 'utf-8'));
    const start = performance.now();

    const candidates = retrieveCandidates(catalog, {
      traits: ['coffee', 'quiet'],
      occasion: 'birthday',
      minBudget: 10,
      maxBudget: 60
    });

    const duration = performance.now() - start;

    assert.ok(duration < 5000, `Retrieval took ${duration}ms, expected under 5000ms`);
    assert.ok(candidates.length >= 5, `Expected at least 5 candidates, got ${candidates.length}`);

    // Verify top candidates are relevant to coffee/quiet
    const top = candidates[0];
    const topTags = (top.tags || []).join(' ').toLowerCase();
    const topTitle = top.title.toLowerCase();
    assert.ok(
      topTags.includes('coffee') || topTags.includes('quiet') || topTitle.includes('coffee'),
      `Top candidate "${top.title}" should match traits`
    );
  });
});
