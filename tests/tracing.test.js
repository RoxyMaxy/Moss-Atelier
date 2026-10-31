// tests/tracing.test.js - Unit tests for Agent Tracing privacy & span validation

import test from 'node:test';
import assert from 'node:assert';
import { AtelierTracer } from '../js/tracing.js';

test('Agent Tracing & Privacy Guard test suite', async (t) => {
  await t.test('sanitizeAttributes drops recipient names, traits, and text', () => {
    const tracer = new AtelierTracer();

    const dirtyAttrs = {
      recipient: 'Maria Grazia',
      traits: ['coffee', 'quiet'],
      trait_count: 2,
      text: 'AI generated rationale text that must never leak',
      prompt: 'internal system prompt',
      count: 5,
      offline: true
    };

    const cleaned = tracer.sanitizeAttributes(dirtyAttrs);

    assert.strictEqual(cleaned.recipient, undefined);
    assert.strictEqual(cleaned.traits, undefined);
    assert.strictEqual(cleaned.text, undefined);
    assert.strictEqual(cleaned.prompt, undefined);
    assert.strictEqual(cleaned.count, 5);
    assert.strictEqual(cleaned.offline, true);
  });

  await t.test('recordSpan keeps exactly last 20 spans maximum', () => {
    const tracer = new AtelierTracer();

    for (let i = 0; i < 30; i++) {
      tracer.recordSpan('rank.candidates', { iteration: i });
    }

    const recent = tracer.getRecentSpans();
    assert.strictEqual(recent.length, 20);
    // The oldest recorded span should be iteration 10
    assert.strictEqual(recent[0].attributes.iteration, 10);
    assert.strictEqual(recent[19].attributes.iteration, 29);
  });
});
