// server/proxy.mjs - Single-file Node.js HTTP server & proxy
// Strictly built with Node.js built-ins and pg

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { checkDatabaseHealth } from './db.mjs';
import { globalCache } from './cache.mjs';
import { extractFinalText } from './extract-text.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(__dirname, '..');
const PORT = Number(process.env.PORT) || 3000;

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.ico': 'image/x-icon',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff'
};

async function checkLocalModelHealth(url) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 1200);
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);
    return res.ok || res.status === 404; // Server responded
  } catch {
    return false;
  }
}

const server = http.createServer(async (req, res) => {
  const parsedUrl = new URL(req.url, `http://${req.headers.host || '127.0.0.1'}`);
  const pathname = parsedUrl.pathname;

  // Security Headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'no-referrer');

  // CORS for localhost only
  const origin = req.headers.origin;
  if (origin && (origin.startsWith('http://localhost') || origin.startsWith('http://127.0.0.1'))) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  }

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // 1. Healthcheck Endpoint (/healthz)
  if (pathname === '/healthz' && req.method === 'GET') {
    const dbOk = await checkDatabaseHealth();
    const llamaChatOk = await checkLocalModelHealth('http://127.0.0.1:8080/v1/models');
    const llamaEmbedOk = await checkLocalModelHealth('http://127.0.0.1:8081/v1/models');

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'ok',
      offline_ready: true,
      live: Boolean(process.env.GEMINI_API_KEY && process.env.HOSTED_API_URL),
      database: dbOk,
      models: {
        chat_local: llamaChatOk,
        embed_local: llamaEmbedOk
      },
      cache: globalCache.stats()
    }));
    return;
  }

  // 2. Candidate Retrieval Endpoint (/api/retrieve)
  if (pathname === '/api/retrieve' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => {
      body += chunk;
      if (body.length > 16384) {
        res.writeHead(413, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Payload too large' }));
        req.destroy();
      }
    });

    req.on('end', async () => {
      try {
        const payload = JSON.parse(body || '{}');
        // Serve local catalog fallback
        const catalogPath = path.join(ROOT_DIR, 'demo/catalog.json');
        const catalogData = JSON.parse(fs.readFileSync(catalogPath, 'utf-8'));
        
        // Filter based on traits / occasion
        const queryTraits = (payload.traits || []).map(t => t.toLowerCase());
        const occasion = (payload.occasion || '').toLowerCase();

        let filtered = catalogData.map(item => {
          let score = 0.3; // base score
          const tags = item.tags.map(t => t.toLowerCase());
          const matchCount = queryTraits.filter(t => tags.includes(t) || item.title.toLowerCase().includes(t)).length;
          score += matchCount * 0.2;
          if (occasion && item.occasions.map(o => o.toLowerCase()).includes(occasion)) {
            score += 0.2;
          }
          return { ...item, score };
        });

        filtered.sort((a, b) => b.score - a.score);

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          source: 'local_catalog',
          candidates: filtered.slice(0, 8)
        }));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid JSON request' }));
      }
    });
    return;
  }

  // 3. Static File Serving
  let filePath = pathname === '/' ? '/index.html' : pathname;
  // Prevent directory traversal
  const safePath = path.normalize(filePath).replace(/^(\.\.[\/\\])+/, '');
  const absolutePath = path.join(ROOT_DIR, safePath);

  // Security check: ensure path is within ROOT_DIR
  if (!absolutePath.startsWith(ROOT_DIR)) {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    res.end('Forbidden');
    return;
  }

  // Never serve .env or secret files directly
  const basename = path.basename(absolutePath);
  if (basename.startsWith('.env') || basename === 'package-lock.json') {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    res.end('Forbidden');
    return;
  }

  fs.stat(absolutePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('404 Not Found');
      return;
    }

    const ext = path.extname(absolutePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    res.writeHead(200, { 'Content-Type': contentType });
    fs.createReadStream(absolutePath).pipe(res);
  });
});

if (process.env.NODE_ENV !== 'test') {
  server.listen(PORT, '127.0.0.1', () => {
    console.log(`Moss Atelier server running at http://127.0.0.1:${PORT}`);
  });
}

export { server };
