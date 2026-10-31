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





