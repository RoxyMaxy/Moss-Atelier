# Assumptions
- Sentry: @sentry/browser installed via npm; Agent Tracing doc version: 11.9.0
- Phase 1 Architecture: Built with vanilla ES modules, Node.js http/fs built-in modules, zero bundlers/frameworks.
- Secret Isolation: Client bundle and public configurations are strictly separated via scripts/build-config.mjs.
- Health Check: /healthz reports operational status and readiness booleans without revealing secret values or connection strings.
- Visual Design: Atelier Night theme implemented with Fraunces, Atkinson Hyperlegible, and Press Start 2P typeface hierarchy with system fallbacks and SIL OFL documentation. Custom 64x64 pixel sloth sprite drawn procedurally in code.

