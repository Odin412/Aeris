# Aeris Frontend

This lightweight web console provides a zero-build interface for exercising the Aeris API across all platform phases. The page is a single static document (`index.html`) styled with vanilla CSS and wired with ES modules to call the backend directly.

## Features
- **Health dashboard** – triggers the `/health` endpoint defined in Phase 0.
- **Tenant onboarding** – creates tenants and seeds an agent to satisfy Phase 1 and Phase 2 flows.
- **CRM capture** – submits leads for Phase 2, kicking off TitanAI automations.
- **Marketplace search** – stores and queries listings per Phase 6 requirements.
- **TitanAI assistant console** – sends chat prompts to the `/assistant/chat` route added in Phase 8.

## Usage
Open `index.html` in any modern browser while the API is running locally (default `http://localhost:4000`). All interactions call the live backend; no bundler or dependency installation is required.
