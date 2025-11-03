# Aeris — Intelligent Real Estate OS

Aeris is a full-stack, AI-assisted brokerage platform that progresses through phases 0–11 of the original roadmap using only self-contained code. The repository ships an offline-capable backend, a static operations console, shared TypeScript contracts, and mobile blueprints.

## Repository Structure
- `api/` – Node.js HTTP service implementing multi-tenant CRM, deals, integrations, TitanAI automation, chat/voice assistant, marketplace, and auditing endpoints.
- `frontend/` – Static control center that exercises health checks, tenant setup, CRM capture, marketplace search, and TitanAI chat.
- `mobile/` – Expo-ready screen blueprints mirroring the mobile roadmap (quick actions, voice console, marketplace).
- `shared/` – TypeScript role constants and domain interfaces reused across layers.

## Getting Started
1. Launch the backend:
   ```bash
   npm run dev
   ```
2. Run the comprehensive system tests:
   ```bash
   npm test
   ```
3. Open `frontend/index.html` in a browser to interact with the platform.

## Phase Coverage
| Phase | Highlights |
| ----- | ---------- |
| 0 | `/health` endpoint with AI readiness |
| 1 | Tenant creation, theming, role seeding |
| 2 | Agent onboarding, CRM leads, tasks |
| 3 | Real-time feed, likes, comments, direct chat |
| 4 | Deal pipeline, automated stage tasks, finance summary |
| 5 | Encrypted integration credentials, webhook events |
| 6 | Marketplace property catalog, search, personalization |
| 7 | TitanAI workflow engine with lead router & deal copilot |
| 8 | Natural language chat + voice transcription endpoints |
| 9 | Mobile quick actions & push notification APIs |
| 10 | Branding asset manager per tenant |
| 11 | Audit logs, notification center, AI workflow logging |

Every phase is validated end-to-end by `api/tests/system.test.js`, ensuring multi-tenant isolation, workflow automation, and AI orchestration all execute within this repository.
