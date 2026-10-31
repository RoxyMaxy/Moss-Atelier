// server/db.mjs - PostgreSQL & pgvector helper with graceful fallback

let pool = null;
let pgAvailable = false;

// Attempt to dynamically import pg
try {
  const pgModule = await import('pg');
  const { Pool } = pgModule.default || pgModule;
  if (process.env.DATABASE_URL) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 5,
      idleTimeoutMillis: 10000,
      connectionTimeoutMillis: 3000
    });
    pgAvailable = true;
  }
} catch {
  // pg package or connection not present, will report in health check
  pgAvailable = false;
}

export async function checkDatabaseHealth() {
  if (!pgAvailable || !pool) {
    return false;
  }
  try {
    const client = await pool.connect();
    try {
      await client.query('SELECT 1');
      return true;
    } finally {
      client.release();
    }
  } catch {
    return false;
  }
}

export function getPool() {
  return pool;
}
