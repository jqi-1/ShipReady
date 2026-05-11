# ShipReady

ShipReady turns AI-built prototypes into production deployment plans. V0 starts with a local planner workflow, basic deterministic repo analysis fixtures, stack recommendations, launch-plan output, cost estimates, risk review, and Markdown export placeholders.

## Local Setup

1. Install dependencies:

```bash
npm install
```

2. Create local environment settings:

```bash
cp .env.example .env
```

3. Fill in any keys you want to test locally. The V0 scaffold can run without GitHub App or AI credentials by using the built-in demo project and deterministic fallback output.

4. Start the app:

```bash
npm run dev
```

5. Open `http://localhost:3000`.

## Verification

Run the core checks before calling a change complete:

```bash
npm run lint
npm run typecheck
npm run test
npm run build
```

## V0 Boundaries

- Draft planner state is stored in browser `localStorage`.
- GitHub App credentials are scaffolded for configuration, but the full installation flow is not implemented yet.
- Provider account creation, DNS automation, one-click deployment, saved projects, team workflows, and production infrastructure automation are intentionally out of scope for V0.

## Backend Direction

V0 can run without a dedicated backend because it uses local planner state and deterministic fallback output. A backend layer should be added after the planner workflow is useful enough to justify live integrations.

Start with Next.js server routes inside this app before considering a separate backend service. The eventual backend should protect GitHub App credentials and AI API keys, inspect repositories server-side, handle GitHub webhooks, generate plans from provider calls, and later support saved projects, team sharing, launch history, and checklist progress.
