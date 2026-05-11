# ShipReady

ShipReady turns AI-built prototypes into production deployment plans. Enter a public GitHub repo URL, answer a few questions, and get a complete launch plan with stack recommendations, cost estimates, risk review, and production-ready checklist.

## What Works in 0.0.1

- Public GitHub repo URL intake with validation and normalization
- Deterministic repo analysis: framework, package manager, build/start commands, runtime, Docker, services, env vars
- Deployment-stack recommendation engine with three options per project shape
- 19-section launch plan generation in Markdown
- Production-readiness checklist generator
- Cost estimation table with upgrade triggers
- Risk review with launch blocker detection
- Fallback manual mode when repo inspection is unavailable or rate-limited
- Demo project mode
- Markdown export with metadata frontmatter
- Dockerfile and Compose parsing with risk detection
- Hardcoded-secret detection
- Client-side localStorage draft persistence

## What Does Not Work Yet

- Private repo installation via GitHub App (scaffolded but not wired)
- AI-powered plan generation (env vars defined but not consumed)
- Config file generation (vercel.json, Dockerfile, etc.)
- Provider account creation
- DNS automation
- One-click deployment
- Saved cloud projects
- Team workflows
- Production infrastructure automation

## Known Limitations

1. **GitHub only**: Only public GitHub repos are supported. GitLab, Bitbucket, and self-hosted git are not supported.
2. **No private repo access**: The GitHub App installation flow is scaffolded but private repos cannot be inspected yet.
3. **No AI generation**: All planning is deterministic/rule-based. AI provider credentials are accepted but not yet used.
4. **No saved state**: Drafts persist in browser localStorage only. Clearing your browser data loses in-progress plans.
5. **Static analysis only**: The repo inspector does not run your code. Some detections may be incomplete or incorrect.
6. **No interactive checklist**: Checklist items display as read-only text rather than interactive checkboxes.
7. **No team sharing**: Plans are single-user only.
8. **Generic cost estimates**: Pricing ranges are approximate and not provider-specific. Always verify before purchasing.

## Manual Test Script

Run through these steps before each release to verify the app works end-to-end:

1. Start from a clean browser profile or clear localStorage.
2. Load the app at `http://localhost:3000`.
3. Click **Load demo**.
4. Confirm recommendation, risks, checklist, costs, and launch plan render.
5. Click **Copy plan** and verify the clipboard contains the full markdown.
6. Click **Download .md** and verify the downloaded file opens correctly.
7. Click **Start over** and confirm the app resets to a blank state.
8. Enter a valid public GitHub repo URL (e.g. `https://github.com/vercel/next.js`).
9. Confirm detected facts appear with evidence badges.
10. Answer the missing deployment questions.
11. Confirm recommendation updates based on your answers.
12. Confirm export still works.
13. Enter an invalid URL (e.g. `not-a-url`).
14. Confirm a helpful validation error appears.
15. Enter a private or missing repo URL.
16. Confirm the manual fallback path appears with a clear explanation.

## Sample Public Repos for Testing

| Repo | Shape | Expected Detection |
|---|---|---|
| `https://github.com/vercel/next.js` | Full-stack framework | Next.js, pnpm/npm, build: `next build` |
| `https://github.com/vitejs/vite` | Build tool (Vite repo) | Vite (monorepo), pnpm |
| `https://github.com/expressjs/express` | Backend framework | Express, npm |
| `https://github.com/nuxt/nuxt` | Full-stack framework | Nuxt, pnpm/npm |
| `https://github.com/withastro/astro` | Static/full-stack framework | Astro, pnpm |
| `https://github.com/prisma/prisma` | ORM/database tool | Prisma, npm |

## Release Checklist

Before tagging `v0.0.1`:

- [ ] Product name is consistent across UI, README, package metadata, and exported Markdown.
- [ ] Version is `0.0.1` in `package.json`.
- [ ] README reflects actual scope (this file).
- [ ] Clean install works: `npm install && cp .env.example .env && npm run dev`.
- [ ] `npm run lint` passes with zero warnings.
- [ ] `npm run typecheck` passes with zero errors.
- [ ] `npm run test` passes all tests.
- [ ] `npm run build` produces a successful build.
- [ ] Demo flow: Load demo, verify all sections render.
- [ ] Manual flow: Start over, enter questions manually, verify plan generates.
- [ ] Valid public repo flow: Enter a GitHub URL, verify analysis completes.
- [ ] Invalid URL flow: Enter bad URL, verify helpful error.
- [ ] Repo fetch failure flow: Enter private/missing repo, verify manual fallback.
- [ ] Markdown export: Download .md and verify content structure.
- [ ] No copied/exported output contains real secret values.

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
