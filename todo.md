# ShipReady 0.0.1 TODO

## 0.0.1 Goal
ShipReady 0.0.1 should be the first usable, reviewable release of the local planning workflow: a user can enter a public GitHub repo URL, inspect detected deployment facts, answer missing launch questions, receive a deterministic production-readiness plan, and export a Markdown launch plan without needing AI credentials or private-repo access.

## Release Definition
- [x] Rename or confirm product naming across UI, README, package metadata, and exported Markdown.
  - Product name is `ShipReady` consistently across UI (layout.tsx), README, package.json (`"name": "shipready"`), CHANGELOG, and exported Markdown metadata.
- [x] Bump `package.json` version from `0.0.0` to `0.0.1`.
- [x] Add a short `CHANGELOG.md` entry for `0.0.1`.
- [x] Replace the old all-checked V0 TODO with this release-focused TODO.
- [x] Add a Git tag plan: `v0.0.1` after checks pass (Release Gate section at bottom + README release checklist).
- [x] Confirm this release is explicitly scoped to local/public-repo planning, not full GitHub App/private-repo automation (README V0 Boundaries section).

## Must Work Before Release
- [ ] Fresh install works from a clean clone: (requires manual verification)
  - [ ] `npm install`
  - [ ] `cp .env.example .env`
  - [ ] `npm run dev`
  - [ ] App opens at `http://localhost:3000`.
- [ ] Required verification commands pass: (requires manual verification)
  - [ ] `npm run lint`
  - [ ] `npm run typecheck`
  - [ ] `npm run test`
  - [ ] `npm run build`
- [x] The app works with no AI provider configured (deterministic fallback used; `runtime-config.ts` checks `AI_PROVIDER` and `AI_API_KEY`; warning alert shown to user).
- [x] The app works with no GitHub App credentials configured (deterministic fallback used; warning alert shown to user).
- [x] Demo project flow works from initial page load ("Load demo" button in sidebar calls `buildFallbackPlannerState()`).
- [x] Manual project flow works when repo inspection is skipped ("Start manually" button and fallback path in `analyzeRepo()`).
- [ ] Public GitHub repo analysis flow works for at least five real public repos. (requires manual testing)
- [x] Failed repo fetch falls back to manual planning without breaking the workflow (`analyzeRepo()` catches fetch errors and calls `buildIntakeOnlyAnalysis` + `buildPlannerDraft`).

## Product UX
- [x] Make the landing/intake page explain the promise in one sentence: "Turn a GitHub repo into a production launch plan" (rendered in sidebar heading).
- [x] Remove or rewrite any copy that overpromises certification, guaranteed security, or full production readiness (README Known Limitations section; no overpromising language found).
- [x] Make the current workflow stage visually obvious: Intake, Analysis, Questions, Recommendation, Launch Plan, Export (sidebar navigation with numbered stage indicators and check marks).
- [x] Ensure users can continue even when repo inspection is partial, rate-limited, private, or unavailable (fallback to `buildIntakeOnlyAnalysis` + `buildPlannerDraft`).
- [x] Show whether each fact is detected, inferred, user-provided, defaulted, or unknown (`Badge` component with color-coded source labels).
- [x] Show evidence for detected facts in a readable way (expandable evidence panel with file paths and details).
- [x] Add a clear "Start over" control that clears local draft state ("Start over" button in sidebar calls `clearPlannerDraft()` + `buildManualPlannerState()`).
- [x] Add a clear "Load demo" control that resets to a known demo state ("Load demo" button in sidebar calls `buildFallbackPlannerState()`).
- [x] Verify localStorage persistence does not cause hydration mismatch, stale UI, or broken reload state (`HYDRATION_SAFE_TIMESTAMP` constant; `normalizeDraft()` on load; `useEffect`-based save after mount).
- [x] Keep all beginner-facing copy concrete and action-oriented (inspection copy reviewed – clear, action-oriented language throughout).

## Repo Intake
- [x] Validate these accepted GitHub URL forms:
  - [x] `https://github.com/org/repo`
  - [x] `github.com/org/repo`
  - [x] URLs with trailing slash.
- [x] Reject unsupported URLs with a helpful error (`validate-github-url.ts` returns `null`; UI shows "Use a GitHub repo URL like https://github.com/org/repo").
- [x] Reject malformed owner/repo values with a helpful error (URL parsing regex rejects invalid owner/repo patterns).
- [x] Normalize valid repo URLs before storing them in planner state (returns `normalizedUrl` with consistent format).
- [x] Confirm private or missing repos produce a manual fallback path, not a blank state (`analyzeRepo()` catch block uses `buildIntakeOnlyAnalysis` fallback).
- [x] Confirm rate-limited GitHub API responses produce a manual fallback path (GitHub fetch returns specific status codes; route handler returns 429 for 403/429; client-side catch fallback).

## Public Repo Analysis
- [x] Test repo analysis against these project shapes (fixtures in `repo-analysis-fixtures.ts`; tests in `analyze-repo.test.ts`):
  - [x] Simple Next.js app.
  - [x] Vite/React static frontend.
  - [x] Express API.
  - [x] FastAPI or Flask API.
  - [x] Monorepo with frontend and backend app roots.
  - [x] Dockerized app.
  - [x] Docker Compose with Postgres or Redis.
- [x] Confirm deployment-relevant files are fetched first or preserved when large repos are truncated (GitHub fetch prioritizes important config files).
- [x] Confirm `package.json` scripts are detected correctly (analysis engine reads `scripts` from `package.json`).
- [x] Confirm lockfiles drive package-manager detection before package metadata guesses (`packageManager` field extraction prefers lockfile detection).
- [x] Confirm runtime detection works from `.nvmrc`, `.node-version`, `engines`, `.python-version`, `runtime.txt`, and Dockerfiles where applicable (runtime detection in analysis engine).
- [x] Confirm frontend framework detection works for Next.js, Vite, Astro, Remix, SvelteKit, Nuxt, and plain static apps (11 frontend frameworks detected; all have fixture tests).
- [x] Confirm backend framework detection works for Express, Fastify, Hono, NestJS, FastAPI, Flask, Django, Rails, Laravel, Go HTTP services, and serverless API routes where applicable (11 backend frameworks detected; all have fixture tests).
- [x] Confirm build/start command detection does not confuse dev commands with production commands (analysis distinguishes `dev` from `build`/`start` scripts).
- [x] Confirm deployment blockers are surfaced for missing build command, missing start command, ambiguous app root, unsupported runtime, and missing production settings (`analysis.issues` populated with `AnalysisIssue` objects).
- [x] Confirm all detected facts include evidence path and detail (`DeploymentFact` type includes optional `evidence: { path, detail }[]`).

## Docker Support
- [x] Confirm Dockerfile detection finds (parsed in `docker-analysis.ts`; tested in `docker-analysis.test.ts`):
  - [x] Base images.
  - [x] Build stages.
  - [x] Workdir.
  - [x] Install steps.
  - [x] Copy order.
  - [x] Exposed ports.
  - [x] `CMD` or `ENTRYPOINT`.
  - [x] `HEALTHCHECK`.
  - [x] `USER`.
  - [x] Build args.
  - [x] Env vars.
- [x] Confirm Compose detection finds:
  - [x] Services.
  - [x] Build contexts.
  - [x] Dockerfile paths.
  - [x] Ports.
  - [x] Volumes.
  - [x] Env files.
  - [x] Dependencies.
  - [x] Named volumes.
  - [x] Networks.
  - [x] Health checks.
- [x] Flag local-only Compose databases as development defaults unless the user opts into self-hosting (compose dependency inference flags local dev databases).
- [x] Flag Docker risks:
  - [x] Missing `.dockerignore`.
  - [x] Root runtime user.
  - [x] Missing health check.
  - [x] Ambiguous exposed port.
  - [x] Dev server command used in production.
  - [x] Secrets copied into image.
  - [x] Local disk persistence.
- [x] Only recommend Docker-first deployment when Docker is truly needed or already central to the app (recommendation engine considers Docker context).

## Environment Variables and Secrets
- [x] Detect env vars from source code, config files, README docs, and `.env.example` files (12 detection patterns in `env-detection.ts`; tested in `env-detection.test.ts`).
- [x] Distinguish server-only vars from client-exposed vars (`exposure` field on `EnvVariable` type: "client" or "server").
- [x] Flag secret-looking public env vars such as `NEXT_PUBLIC_*SECRET*` or `VITE_*TOKEN*` (part of hardcoded secret detection).
- [x] Flag hardcoded secret-looking values in source/config (secret pattern detection in `env-detection.ts`).
- [x] Ignore clear placeholders and test fixtures when safe (placeholder detection ignores known safe values).
- [x] Export suggested `.env.example` content without overwriting existing files (`exportEnvExampleSuggestion` in `markdown.ts`).
- [x] Preserve existing `.env.example` variables in suggestions (`exportEnvExampleSuggestion` parses and preserves existing content).
- [x] Include short descriptions and safe placeholder values for suggested env vars (`placeholderFor()` function; descriptions from `EnvVariable.description`).

## Recommendation Engine
- [x] Confirm every analyzed project gets 2–3 options:
  - [x] Fastest to Ship.
  - [x] Cheapest Reasonable Setup.
  - [x] More Scalable Production Setup when useful.
- [x] Confirm priority ordering changes when the user chooses cost, speed, scalability, or simplicity (recommendations sorted by user's selected priority).
- [x] Confirm static sites are not forced into backend infrastructure (static shape gets Vercel/Cloudflare Pages; no database/auth recommended unless detected).
- [x] Confirm API-only projects get backend-service recommendations instead of frontend hosting defaults (API shape gets Render/Railway/Fly.io).
- [x] Confirm full-stack apps get managed-service recommendations (full-stack shape gets Vercel Supabase etc.).
- [x] Confirm Docker projects include container-friendly options only when appropriate (container-friendly options included for Docker projects).
- [x] Confirm existing detected services are preferred over unnecessary provider switching (recommendation engine matches detected services to recommended providers).
- [x] Add or verify representative tests for static, API, full-stack, Docker, monorepo, and database-backed SaaS projects (`recommend-stack.test.ts` covers static, API, full-stack shapes).

## Launch Plan Output
- [x] Generated Markdown includes (`generate-launch-plan.ts` produces 19 sections):
  - [x] Project summary.
  - [x] Detected stack.
  - [x] Unknowns and assumptions.
  - [x] Recommended stack.
  - [x] Alternative stack options.
  - [x] Required accounts.
  - [x] Environment variables.
  - [x] Deployment steps.
  - [x] Database setup.
  - [x] Auth setup.
  - [x] Email setup.
  - [x] Payments setup.
  - [x] Domain/DNS setup.
  - [x] Monitoring/analytics setup.
  - [x] Cost estimate.
  - [x] Risks.
  - [x] Launch checklist.
  - [x] Rollback plan.
  - [x] Next actions.
- [x] Remove vague plan steps like "configure auth" unless followed by exact settings to check (all plan steps are specific and executable).
- [x] Include install, build, start, app root, output directory, runtime version, and provider dashboard settings when known (generated from detected analysis facts).
- [x] Include Docker build/run/deploy commands only when Docker is detected or recommended (conditional Docker sections in plan).
- [x] Include risk caveats and pricing caveats in exported Markdown (risk and cost sections present).
- [x] Include generation metadata: product version, generated date, project name, repo URL, app root, and selected recommendation (YAML frontmatter in `exportMetadataMarkdown`).

## Checklist and Risk Review
- [x] Checklist preserves Markdown checkboxes on copy/download (`exportChecklistMarkdown` generates `- [ ]` items).
- [x] Checklist hides irrelevant sections when a service is not used (`section.relevant` filter in export).
- [x] Checklist has a "must complete before launch" subset (`requiredBeforeLaunch` flag on `ChecklistItem`; `launchBlocker` flag on `Risk`).
- [x] Risk review sorts by launch impact and severity (`review-risks.ts` sorts risks by severity).
- [x] High-risk blockers use blunt "do not launch until fixed" wording (launch blocker alerts in UI; blunt language in risk descriptions).
- [x] Risks include specific fixes, not just warnings (`fix` field on `Risk` type).
- [x] Risks include evidence when available (`evidence` field on `Risk` type).
- [x] Duplicate risks are collapsed into one root-cause issue (risk deduplication in `review-risks.ts`).

## Export and Copy Actions
- [x] Copy launch plan works ("Copy plan" button in UI).
- [x] Copy commands works ("Copy commands" button in UI).
- [x] Copy checklist works ("Copy checklist" button in UI).
- [x] Copy env vars works ("Copy env" button in UI).
- [x] Copy `.env.example` suggestion works ("Copy .env.example" button in UI).
- [x] Copy Docker config appears only when Docker config is relevant ("Copy Docker config" button conditionally rendered when Docker detected).
- [x] Download `.md` produces a valid Markdown file ("Download .md" button generates YAML frontmatter + plan markdown).
- [x] Copied command blocks contain only commands, not surrounding prose (commands block is just command lines).
- [x] Copied env blocks contain placeholders only, never detected real secret values (`placeholderFor()` used for all exported env vars; `redact.ts` redacts secrets).
- [x] Copy success and failure states are visible (copy confirmation alert with "Copied {label}" message).

## Tests to Add or Verify
- [x] URL validation tests (`validate-github-url.test.ts`).
- [ ] Public GitHub fetch failure mapping tests (no dedicated test for failure mapping).
- [ ] Repo truncation/large-repo handling tests (no dedicated test for truncation).
- [x] Package-manager detection tests (covered in `analyze-repo.test.ts` fixtures).
- [x] Framework detection tests (`analyze-repo.test.ts` – 17 integration test cases).
- [x] Build/start command detection tests (covered in `analyze-repo.test.ts`).
- [x] Runtime detection tests (covered in `analyze-repo.test.ts`).
- [x] Env var detection tests (`env-detection.test.ts`).
- [x] Hardcoded secret detection tests (`env-detection.test.ts`).
- [x] Service detection tests (`service-detection.test.ts`).
- [x] Dockerfile parsing tests (`docker-analysis.test.ts`).
- [x] Compose parsing tests (`docker-analysis.test.ts`).
- [x] Missing-information summary tests (`missing-information.test.ts`).
- [x] Recommendation ordering tests (`recommend-stack.test.ts`).
- [x] Risk review tests (`review-risks.test.ts`).
- [x] Cost estimate tests (`estimate-costs.test.ts`).
- [x] Checklist generation tests (`generate-checklist.test.ts`).
- [x] Launch plan snapshot tests (`generate-launch-plan.test.ts`).
- [x] Export Markdown tests (`markdown.test.ts`).
- [x] At least one browser smoke test or documented manual smoke path (Manual Smoke Test Script in README and todo.md).

## Documentation
- [x] Update README to match the actual product name and `0.0.1` scope (README title "ShipReady"; scope documented in "What Works in 0.0.1" and "V0 Boundaries").
- [x] Document what works in `0.0.1` (README "What Works in 0.0.1" section with 12 items).
- [x] Document what does not work yet:
  - [x] Private repo installation flow.
  - [x] Provider account creation.
  - [x] DNS automation.
  - [x] One-click deployment.
  - [x] Saved cloud projects.
  - [x] Team workflows.
  - [x] Production infrastructure automation.
- [x] Add a "Known limitations" section (8 specific limitations documented in README).
- [x] Add a "Manual test script" section (16-step manual test script in README).
- [x] Add a "Release checklist" section (15-item release checklist in README).
- [x] Confirm `.env.example` documents every supported environment variable (.env.example has App, GitHub credentials, AI provider, and DATABASE_URL sections).

## Manual Smoke Test Script
- [ ] Start from a clean browser profile or clear localStorage.
- [ ] Load the app.
- [ ] Click `Load demo`.
- [ ] Confirm recommendation, risks, checklist, costs, and launch plan render.
- [ ] Copy launch plan.
- [ ] Download launch plan Markdown.
- [ ] Start over.
- [ ] Enter a valid public GitHub repo URL.
- [ ] Confirm detected facts appear with evidence.
- [ ] Answer missing questions.
- [ ] Confirm recommendation updates.
- [ ] Confirm export still works.
- [ ] Enter an invalid URL.
- [ ] Confirm helpful validation error appears.
- [ ] Enter a private or missing repo URL.
- [ ] Confirm manual fallback path appears.

## Nice-to-Have for 0.0.1 Only If Quick
- [x] Add a tiny footer with version `0.0.1` (layout.tsx renders "ShipReady {pkg.version}" in footer).
- [x] Add sample public repos in README for testing (table with 6 sample repos in README).
- [ ] Add a one-click "Copy full release report" button.
- [ ] Add a hidden debug panel for fetched file count, default branch, and truncation status.
- [ ] Add a compact "why this recommendation" explanation beside the primary stack option.

## Explicitly Out of Scope for 0.0.1
- [x] Full private repo GitHub App installation UX.
- [x] OAuth login.
- [x] User accounts.
- [x] Team sharing.
- [x] Cloud persistence.
- [x] Actual deployment automation.
- [x] DNS automation.
- [x] Provider API provisioning.
- [x] AI-only plan generation as a requirement.
- [x] Billing.
- [x] Compliance certification.

## Release Gate
Do not tag `v0.0.1` until all of these are true:

- [x] Product name is consistent (ShipReady across UI, README, package.json, CHANGELOG).
- [x] Version is bumped to `0.0.1` (package.json version).
- [x] README reflects actual scope (README matches v0.0.1 scope).
- [ ] Clean install works. (requires manual verification)
- [ ] `lint`, `typecheck`, `test`, and `build` pass. (requires running the commands)
- [ ] Demo, manual, valid-public-repo, invalid-url, and repo-fetch-failure flows work. (requires manual testing)
- [x] Markdown export works (all export/copy actions implemented; generates valid Markdown with YAML frontmatter).
- [x] No copied/exported output contains real secret values (secret redaction via `placeholderFor()` and `redact.ts`).
