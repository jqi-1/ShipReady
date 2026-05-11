# ShipReady v0.0.2 TODO

## Goal

Harden the v0.0.1 vertical slice so ShipReady can safely analyze public GitHub repos, produce more reliable launch plans, and pass a basic production-readiness baseline.

## Priority 0 — Safety and stability

- [ ] Add rate limiting to `POST /api/analyze-repo`
  - Limit by IP address
  - Return `429` with a clear error message
  - Add tests for allowed and blocked requests

- [ ] Add timeout protection to repo analysis
  - Cap total API route execution time
  - Abort slow GitHub fetches
  - Return a useful timeout error instead of hanging

- [ ] Add request validation for `/api/analyze-repo`
  - Reject empty repo URLs
  - Reject non-GitHub URLs
  - Reject malformed owner/repo values
  - Reject bodies above the allowed size

- [ ] Add short-term caching for GitHub repo analysis
  - Cache by `owner/repo/defaultBranch`
  - Avoid repeatedly fetching the same repo
  - Include cache hit/miss logging in development

## Priority 1 — Repo analysis accuracy

- [ ] Improve file selection before the 160-file cap
  - Prioritize `package.json`, lockfiles, config files, Dockerfiles, CI files, and deployment files
  - Prioritize app roots such as `apps/web`, `frontend`, `client`, and `app`
  - Avoid wasting file slots on low-value source files

- [ ] Replace simple app-root selection with scored app-root selection
  - Score roots by framework config
  - Score roots by build/start scripts
  - Prefer `apps/*` roots in monorepos when appropriate
  - Penalize root workspace packages that are only orchestration layers

- [ ] Expose selected app root in the analysis result
  - Show selected root in the UI
  - Add warning when confidence is low
  - Allow future support for user override

- [ ] Improve package manager detection
  - Detect `pnpm-lock.yaml`
  - Detect `yarn.lock`
  - Detect `package-lock.json`
  - Detect `bun.lockb` / `bun.lock`
  - Use the detected package manager when generating install/build commands

- [ ] Improve framework detection
  - Next.js
  - Vite
  - Remix
  - Astro
  - SvelteKit
  - FastAPI
  - Express
  - Hono
  - Flask
  - Django

## Priority 2 — Environment and config

- [ ] Add typed environment validation
  - Use `zod`
  - Validate `NEXT_PUBLIC_APP_URL`
  - Validate `AUTH_SECRET`
  - Validate `AI_PROVIDER`
  - Validate `AI_API_KEY`
  - Validate `AI_BASE_URL`
  - Validate `AI_MODEL`
  - Validate `AI_REQUEST_TIMEOUT_MS`
  - Validate GitHub App variables

- [ ] Improve runtime config status output
  - Show missing required values
  - Show optional-but-recommended values
  - Avoid leaking secret values
  - Add tests for valid, partial, and invalid configs

- [ ] Update `.env.example`
  - Group variables by feature
  - Mark required vs optional variables
  - Add safe local defaults where possible

## Priority 3 — Launch plan output

- [ ] Separate launch plan data from rendered markdown
  - Store structured launch plan sections
  - Generate markdown only at export time
  - Avoid storing pre-rendered markdown inside `LaunchPlan`

- [ ] Improve generated launch checklist
  - Add repo-specific setup steps
  - Add deployment-specific steps
  - Add security-specific steps
  - Add testing-specific steps

- [ ] Add confidence indicators to recommendations
  - High confidence: direct evidence from repo files
  - Medium confidence: inferred from dependencies/config
  - Low confidence: fallback/default recommendation

- [ ] Add warnings for incomplete analysis
  - Truncated file list
  - GitHub rate limit hit
  - Unsupported framework
  - Missing build script
  - Missing deployment config
  - Missing env example

## Priority 4 — Tests and CI

- [ ] Add GitHub Actions CI
  - Run lint
  - Run typecheck
  - Run tests
  - Run production build

- [ ] Add API route tests for `/api/analyze-repo`
  - Valid public GitHub repo
  - Invalid URL
  - Nonexistent repo
  - GitHub rate limit response
  - Timeout response
  - Large repo response

- [ ] Add repo-analysis fixture tests
  - Basic Next.js app
  - Vite app
  - Monorepo with `apps/web`
  - Backend-only repo
  - Dockerized repo
  - Repo with missing scripts
  - Repo with multiple possible app roots

- [ ] Add snapshot tests for exported markdown
  - Launch plan markdown
  - Metadata markdown
  - Checklist markdown

## Priority 5 — UI and UX polish

- [ ] Standardize product naming
  - Choose either `ShipReady` or `Launch Architect`
  - Update README
  - Update app metadata
  - Update UI copy
  - Update exported markdown headings

- [ ] Improve analysis loading state
  - Show current phase
  - Show GitHub fetch progress when possible
  - Show retry guidance on failure

- [ ] Improve error messages
  - Invalid repo URL
  - Private repo unsupported
  - GitHub rate limit
  - Network failure
  - Unsupported repo shape

- [ ] Add empty states
  - No repo analyzed yet
  - No launch plan generated yet
  - No checklist items yet

- [ ] Add copy/download actions
  - Copy launch plan markdown
  - Download launch plan markdown
  - Copy checklist
  - Download checklist

## Priority 6 — Documentation

- [ ] Update README for v0.0.2
  - Add current feature scope
  - Add limitations
  - Add local development instructions
  - Add test commands
  - Add deployment notes

- [ ] Add architecture notes
  - App structure
  - Repo analysis flow
  - Planner generation flow
  - Fallback behavior
  - Future backend/GitHub App path

- [ ] Add security notes
  - Public repos only
  - No secret storage in V0
  - API route rate limiting
  - GitHub token usage expectations

## Definition of done

v0.0.2 is complete when:

- [ ] `/api/analyze-repo` has validation, rate limiting, timeout protection, and tests
- [ ] Repo file selection is priority-based instead of first-160 based
- [ ] Monorepo app-root detection is scored and tested
- [ ] Environment variables are validated through one typed config module
- [ ] CI runs lint, typecheck, tests, and build
- [ ] Launch plan markdown export still works
- [ ] README accurately describes the current product name, setup, limitations, and commands