# Aeris API

The Aeris API is a dependency-free Node.js service that implements every phase of the Aeris roadmap—from the multi-tenant core through TitanAI automation and security auditing. The stack uses only standard library modules so it can run in offline sandboxes while still modelling the full SaaS platform.

## Capabilities by Phase
- **Phase 0** – `/health` endpoint returns `{ ok, db, ai }`.
- **Phase 1** – Tenant creation, theming, settings, and role bootstrap.
- **Phase 2** – Agent onboarding workflow, CRM lead + task management.
- **Phase 3** – Real-time collaboration feed and direct messaging via Server-Sent Events.
- **Phase 4** – Deal engine with staged automations, document tracking, and finance summaries.
- **Phase 5** – Encrypted integration credential vault and webhook event log.
- **Phase 6** – Marketplace property catalog, search, and recommendation engine.
- **Phase 7** – TitanAI automation bus orchestrating lead routing, deal monitoring, and insights.
- **Phase 8** – Natural language assistant (`/assistant/chat`) and voice console (`/assistant/voice`).
- **Phase 9** – Mobile quick actions and push notification endpoints.
- **Phase 10** – Tenant branding asset management.
- **Phase 11** – Audit trail, notification center, and AI workflow logging.

## Running Locally
```bash
npm run dev    # starts the HTTP server on port 4000
npm test       # executes the end-to-end system test suite
```

No build step is required; the service runs directly from `src/`.

## Key Files
- `src/app.js` – HTTP router, middleware, and route registration.
- `src/modules/*.js` – Domain modules for onboarding, CRM, deals, integrations, marketplace, AI, mobile, and security.
- `tests/system.test.js` – Node test that exercises the full workflow across phases 0–11.
