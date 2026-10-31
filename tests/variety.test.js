// tests/variety.test.js - Different queries must give different results, never the same first five by default.

import test from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { retrieveCandidates } from '../js/retrieve.js';
import { rankCandidates } from '../js/rank.js';
import { matchTrait, expandTrait } from '../js/match.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const catalog = JSON.parse(fs.readFileSync(path.join(here, '..', 'catalog', 'catalog.json'), 'utf8'));
const gifts = catalog.filter(i => i.kind === 'gift');

const QUERIES = [
  { traits: ['coffee', 'gardening', 'quiet'], occasion: 'birthday', minBudget: 10, maxBudget: 50 },
  { traits: ['football', 'video games', 'music'], occasion: 'birthday', minBudget: 10, maxBudget: 50 },
  { traits: ['cats', 'reading'], occasion: 'thank-you', minBudget: 5, maxBudget: 30 },
  { traits: ['running', 'travel'], occasion: 'holiday', minBudget: 20, maxBudget: 80 }
];

test('synonyms and plurals match the catalogue', () => {
  assert.ok(expandTrait('football').has('sport'));
  assert.ok(expandTrait('cats').has('pet'));
  const yogaMat = gifts.find(g => g.title.startsWith('Adjustable Yoga Mat'));
  assert.ok(matchTrait('running', yogaMat) > 0, 'running should match the sport group');
});

test('four different trait sets give four different top-5 lists', () => {
  const lists = QUERIES.map(q => retrieveCandidates(gifts, q).slice(0, 5).map(i => i.id).join(','));
  assert.strictEqual(new Set(lists).size, QUERIES.length, `lists repeat: ${lists.join(' | ')}`);
});

test('no query returns the first five catalogue entries', () => {
  const firstFive = gifts.slice(0, 5).map(i => i.id).join(',');
  for (const q of QUERIES) {
    const ids = retrieveCandidates(gifts, q).slice(0, 5).map(i => i.id).join(',');
    assert.notStrictEqual(ids, firstFive);
  }
});

test('ranking also varies with the query', () => {
  const lists = QUERIES.map(q => rankCandidates(gifts, q).slice(0, 5).map(i => i.id).join(','));
  assert.strictEqual(new Set(lists).size, QUERIES.length, `ranked lists repeat: ${lists.join(' | ')}`);
});
