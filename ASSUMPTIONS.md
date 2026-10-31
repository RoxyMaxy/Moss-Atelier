# Assumptions
- Sentry: @sentry/browser installed via npm; Agent Tracing doc version: 11.9.0
- Phase 1 Architecture: Built with vanilla ES modules, Node.js http/fs built-in modules, zero bundlers/frameworks.
- Secret Isolation: Client bundle and public configurations are strictly separated via scripts/build-config.mjs.
- Health Check: /healthz reports operational status and readiness booleans without revealing secret values or connection strings.
- Visual Design: Atelier Night theme implemented with Fraunces, Atkinson Hyperlegible, and Press Start 2P typeface hierarchy with system fallbacks and SIL OFL documentation. Custom 64x64 pixel sloth sprite drawn procedurally in code.
- Phase 2 Catalogue: 126 curated entries (106 gifts, 20 DIY projects) released under CC0. All entries are generic without third-party brand trademarks.
- Memory Threshold: build-index.mjs executes free -m and halts if free RAM < 1000 MB. Verified halt with 206 MB free RAM.
- Hybrid Retrieval: Reciprocal Rank Fusion implemented with constant k = 60, combining trait relevance and occasion matching with a +10% max budget tolerance filter.
- Phase 3 Ranking & Grounding: Deterministic scoring weighted 40% trait, 30% occasion, 30% budget fit. Grounding validator strictly discards unretrieved IDs, sanitizes ungrounded numeric claims, and fills up to 3 picks using deterministic templates.
- Phase 4 DIY & Safety: Maximum 6 steps enforced. Keyword scanner monitors knife, cutter, heat, iron, glue gun, solder, bleach, battery and automatically supplies generic safety warning if absent.
- Phase 5 Live Search & Caching: /api/search restricted to google_shopping and youtube with in-memory 24-hour TTL caching (X-Cache header). Parameter search_query used for youtube. Never scrapes third-party shopping sites.
- Phase 6 Memory & Tracing: IndexedDB database 'moss-atelier' stores recipient-specific gift history and persistent DIY checklist indices. Searching a new recipient reinitializes without cross-contaminating previous gifts; re-searching an existing recipient restores their exclusions. AtelierTracer strictly drops recipient names and trait texts from spans before forwarding to Sentry or the local trace panel.
- Phase 7 Documentation & Offline Definition: README clearly distinguishes synthetic browser DevTools offline mode (which blocks localhost sockets) from true system offline operation with local models.
- Phase 8 Deployment: Production manifest defined in render.yaml with secret isolation for keys and plain variables for model names.







- Fix: "same gifts" bug. Cause: exact tag matching scored unknown traits 0, and ties were broken by catalogue order. Now js/match.js provides accent-free matching, simple stemming, a synonym table, and a seeded FNV-1a tie-break derived from the query. Ties never use catalogue order. Covered by tests/variety.test.js.
- Fix: catalogue extended from 126 to 164 entries (38 new gifts for sport, music, games, pets, books, travel, tech, art, cooking, drinks, photography, children). New entries are generic and need author review before the pgvector index is rebuilt.
- Fix: rationale now calls Ollama /api/chat (gemma3:1b, format json, num_ctx 2048) instead of llama.cpp on port 8080. The /healthz check queries Ollama /api/tags. The backend that answered is recorded in the gift.rationale span.
- Known limitation: live search is keyword and synonym based. Embeddings (nomic-embed-text) are planned but not wired in. Some weak matches remain (for example a coffee grinder can match "running" through a summary word); the next step is semantic retrieval.
- Fix: npm test runs node --test tests/*.js, because the directory form fails on the installed Node version.
- The pgvector index (catalog_items) must be rebuilt with catalog/build-index.mjs after the catalogue change, otherwise the database path serves the old 126 entries.
