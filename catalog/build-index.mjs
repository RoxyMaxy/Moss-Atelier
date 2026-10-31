// catalog/build-index.mjs - Batch index builder for PostgreSQL pgvector
// Strictly enforces RAM availability check (free -m) before processing.

import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(__dirname, '..');
const CATALOG_PATH = path.join(ROOT_DIR, 'catalog/catalog.json');

// Step 1: Memory Verification (Hard constraint: require >= 1000 MB free RAM)
function checkMemoryAvailability() {
  try {
    const output = execSync('free -m', { encoding: 'utf-8' });
    const lines = output.trim().split('\n');
    const memLine = lines.find(l => l.startsWith('Mem:'));
    if (!memLine) {
      throw new Error('Unable to parse free -m output');
    }
    const parts = memLine.split(/\s+/);
    // free -m columns: total used free shared buff/cache available
    const freeMb = parseInt(parts[3], 10);
    const availableMb = parseInt(parts[6], 10);

    console.log(`[Memory Check] Free RAM: ${freeMb} MB | Available RAM: ${availableMb} MB`);

    if (freeMb < 1000) {
      console.warn(`\n======================================================`);
      console.warn(`[INDEXING HALTED] Available free memory (${freeMb} MB) is below the 1000 MB requirement.`);
      console.warn(`Safety rule triggered to avoid OOM killer on low-resource hardware.`);
      console.warn(`The application will continue operating reliably with in-memory RRF on catalog.json.`);
      console.warn(`======================================================\n`);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Failed to verify system memory via free -m:', err.message);
    return false;
  }
}

async function buildIndex() {
  console.log('--- Moss Atelier Index Builder ---');

  const memoryOk = checkMemoryAvailability();
  if (!memoryOk) {
    process.exit(0);
  }

  // Check database URL
  if (!process.env.DATABASE_URL) {
    console.log('No DATABASE_URL configured in .env. Index build skipped.');
    process.exit(0);
  }

  let pg;
  try {
    pg = await import('pg');
  } catch {
    console.log('pg package not available. Index build skipped.');
    process.exit(0);
  }

  const { Pool } = pg.default || pg;
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });

  try {
    const client = await pool.connect();
    console.log('✓ Connected to PostgreSQL');

    // Create pgvector extension and table
    await client.query(`CREATE EXTENSION IF NOT EXISTS vector;`);
    await client.query(`
      CREATE TABLE IF NOT EXISTS catalog_items (
        id TEXT PRIMARY KEY,
        kind TEXT NOT NULL,
        payload JSONB NOT NULL,
        tags TEXT[] NOT NULL,
        embedding vector(384),
        tsv tsvector
      );
    `);

    // Create HNSW cosine index
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_catalog_hnsw 
      ON catalog_items USING hnsw (embedding vector_cosine_ops);
    `);

    // Create full-text GIN index
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_catalog_tsv 
      ON catalog_items USING GIN (tsv);
    `);

    const rawData = fs.readFileSync(CATALOG_PATH, 'utf-8');
    const catalog = JSON.parse(rawData);

    console.log(`Embedding ${catalog.length} items using multilingual-e5-small (vector 384)...`);

    for (const item of catalog) {
      const textToEmbed = `passage: ${item.title}. ${item.summary}. ${(item.tags || []).join(' ')}`;
      let embedding = null;

      try {
        const embedRes = await fetch('http://127.0.0.1:8081/v1/embeddings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            input: textToEmbed,
            model: 'multilingual-e5-small'
          })
        });

        if (embedRes.ok) {
          const resJson = await embedRes.json();
          embedding = resJson.data?.[0]?.embedding || null;
        }
      } catch {
        // Local embedding endpoint not responding
      }

      const tsvText = `${item.title} ${item.summary} ${(item.tags || []).join(' ')}`;
      
      await client.query(
        `INSERT INTO catalog_items (id, kind, payload, tags, embedding, tsv)
         VALUES ($1, $2, $3, $4, $5, to_tsvector('english', $6))
         ON CONFLICT (id) DO UPDATE SET
           payload = EXCLUDED.payload,
           tags = EXCLUDED.tags,
           embedding = EXCLUDED.embedding,
           tsv = EXCLUDED.tsv;`,
        [item.id, item.kind, item.payload || item, item.tags || [], embedding ? `[${embedding.join(',')}]` : null, tsvText]
      );
    }

    console.log('✓ Successfully populated catalog_items with HNSW vector and full-text indexes.');
    client.release();
  } catch (err) {
    console.error('Database index creation error:', err);
  } finally {
    await pool.end();
  }
}

buildIndex();
