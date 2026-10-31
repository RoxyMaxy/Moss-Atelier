// tests/proxy.test.js - Unit and integration tests for proxy server

import test from 'node:test';
import assert from 'node:assert';
import http from 'node:http';
import { server } from '../server/proxy.mjs';

test('Proxy server & healthcheck test suite', async (t) => {
  const TEST_PORT = 3199;
  
  await new Promise((resolve) => {
    server.listen(TEST_PORT, '127.0.0.1', resolve);
  });

  t.after(() => {
    return new Promise((resolve) => server.close(resolve));
  });

  await t.test('GET /healthz returns status ok without leaking secrets', async () => {
    const res = await fetch(`http://127.0.0.1:${TEST_PORT}/healthz`);
    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.status, 'ok');
    assert.strictEqual(body.offline_ready, true);

    const stringified = JSON.stringify(body);
    // Ensure no secrets leaked
    assert.strictEqual(stringified.includes('AQ.'), false);
    assert.strictEqual(stringified.includes('sk-'), false);
    assert.strictEqual(stringified.includes('postgres://'), false);
    assert.strictEqual(stringified.includes('postgresql://'), false);
  });

  await t.test('GET / serves index.html with Atelier Night title', async () => {
    const res = await fetch(`http://127.0.0.1:${TEST_PORT}/`);
    assert.strictEqual(res.status, 200);
    assert.match(res.headers.get('content-type'), /text\/html/);
    const html = await res.text();
    assert.match(html, /Moss Atelier/);
    assert.match(html, /sloth-canvas/);
    assert.match(html, /brass-band/);
  });

  await t.test('GET /css/theme.css serves valid CSS tokens', async () => {
    const res = await fetch(`http://127.0.0.1:${TEST_PORT}/css/theme.css`);
    assert.strictEqual(res.status, 200);
    assert.match(res.headers.get('content-type'), /text\/css/);
    const css = await res.text();
    assert.match(css, /--accent: #D9A441/);
    assert.match(css, /--bg: #12100D/);
  });

  await t.test('GET /.env is blocked with 403 Forbidden', async () => {
    const res = await fetch(`http://127.0.0.1:${TEST_PORT}/.env`);
    assert.strictEqual(res.status, 403);
  });

  await t.test('GET nonexistent path returns 404', async () => {
    const res = await fetch(`http://127.0.0.1:${TEST_PORT}/nonexistent-file.xyz`);
    assert.strictEqual(res.status, 404);
  });

  await t.test('POST /api/retrieve handles candidate querying', async () => {
    const res = await fetch(`http://127.0.0.1:${TEST_PORT}/api/retrieve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ occasion: 'birthday', traits: ['coffee', 'quiet'] })
    });
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.ok(Array.isArray(data.candidates));
    assert.ok(data.candidates.length > 0);
  });

  await t.test('POST /api/retrieve with body > 16KB returns 413 Payload Too Large', async () => {
    const largePayload = JSON.stringify({ huge: 'x'.repeat(20000) });
    const res = await fetch(`http://127.0.0.1:${TEST_PORT}/api/retrieve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: largePayload
    });
    assert.strictEqual(res.status, 413);
  });
});
