// tests/memory.test.js - Unit tests for local recipient-specific gift history and checklists

import test from 'node:test';
import assert from 'node:assert';
import { memory } from '../js/memory.js';

test('Local Memory & Recipient History test suite', async (t) => {
  await memory.resetAll();

  const candidates = [
    { id: '1', title: 'Ceramic Pour-Over Coffee Dripper', price: 28 },
    { id: '2', title: 'Solid Brass Bookmark', price: 14 },
    { id: '3', title: 'Linen Garden Apron', price: 38 }
  ];

  await t.test('Initial search for Maria returns all candidates', async () => {
    const res = await memory.filterGiftsByHistory(candidates, 'Maria');
    assert.strictEqual(res.removedCount, 0);
    assert.strictEqual(res.kept.length, 3);
  });

  await t.test('Recording a gift for Maria excludes it from future Maria searches', async () => {
    await memory.recordGiftGiven('Maria', 'Ceramic Pour-Over Coffee Dripper');

    const res = await memory.filterGiftsByHistory(candidates, 'Maria');
    assert.strictEqual(res.removedCount, 1);
    assert.strictEqual(res.kept.length, 2);
    assert.strictEqual(res.kept[0].id, '2');
    assert.strictEqual(res.kept[1].id, '3');
  });

  await t.test('Searching for Lucas (a different recipient) is reinitialized without Maria gifts excluded', async () => {
    const res = await memory.filterGiftsByHistory(candidates, 'Lucas');
    // Lucas has no history, so all 3 candidates are kept unharmed
    assert.strictEqual(res.removedCount, 0);
    assert.strictEqual(res.kept.length, 3);
  });

  await t.test('Returning to Maria restores her past gift exclusions unharmed', async () => {
    const res = await memory.filterGiftsByHistory(candidates, 'Maria');
    assert.strictEqual(res.removedCount, 1);
    assert.strictEqual(res.kept.length, 2);
  });

  await t.test('Checklist persistence saves and retrieves checked indices', async () => {
    await memory.saveChecklistState('diy-01', [0, 2]);
    const saved = await memory.getChecklistState('diy-01');
    assert.deepStrictEqual(saved, [0, 2]);

    const empty = await memory.getChecklistState('diy-nonexistent');
    assert.deepStrictEqual(empty, []);
  });

  await t.test('resetAll clears all stores cleanly', async () => {
    await memory.resetAll();
    const mariaRes = await memory.filterGiftsByHistory(candidates, 'Maria');
    assert.strictEqual(mariaRes.removedCount, 0);
    const checklist = await memory.getChecklistState('diy-01');
    assert.deepStrictEqual(checklist, []);
  });
});
