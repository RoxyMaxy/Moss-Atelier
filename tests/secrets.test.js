// tests/secrets.test.js - Ensures no secrets or credentials leak into repository files

import test from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(__dirname, '..');

const FORBIDDEN_PATTERNS = [
  /AQ\./,
  /sk-[a-zA-Z0-9_-]{20,}/,
  /postgres(ql)?:\/\/[^:]+:[^@]+@/,
  /GEMINI_API_KEY=[A-Za-z0-9_-]{10,}/,
  /SERPAPI_KEY=[A-Za-z0-9_-]{10,}/
];

const SCAN_DIRS = ['js', 'css', 'server', 'scripts', 'demo', 'fonts'];
const SCAN_FILES = ['index.html', 'manifest.webmanifest', 'sw.js', 'package.json'];

function scanDirectory(dir) {
  const fullDir = path.join(ROOT_DIR, dir);
  if (!fs.existsSync(fullDir)) return [];
  const entries = fs.readdirSync(fullDir, { withFileTypes: true });
  let files = [];
  for (const entry of entries) {
    const fullPath = path.join(fullDir, entry.name);
    if (entry.isDirectory() && entry.name !== 'node_modules' && entry.name !== '.git') {
      files = files.concat(scanDirectory(path.relative(ROOT_DIR, fullPath)));
    } else if (entry.isFile() && !entry.name.startsWith('.env')) {
      files.push(fullPath);
    }
  }
  return files;
}

test('Secrets audit test suite', () => {
  let allFiles = [...SCAN_FILES.map(f => path.join(ROOT_DIR, f))];
  for (const dir of SCAN_DIRS) {
    allFiles = allFiles.concat(scanDirectory(dir));
  }

  // Also include js/config.js if present
  const clientConfig = path.join(ROOT_DIR, 'js/config.js');
  if (fs.existsSync(clientConfig)) {
    allFiles.push(clientConfig);
  }

  for (const file of allFiles) {
    if (!fs.existsSync(file)) continue;
    const content = fs.readFileSync(file, 'utf-8');
    for (const pattern of FORBIDDEN_PATTERNS) {
      const match = pattern.exec(content);
      assert.strictEqual(
        match,
        null,
        `Secret leak detected in ${path.relative(ROOT_DIR, file)}: matched ${pattern}`
      );
    }
  }
});
