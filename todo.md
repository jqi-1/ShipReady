# ShipReady 0.0.1 TODO

## 0.0.1 Goal
ShipReady 0.0.1 should be the first usable, reviewable release of the local planning workflow: a user can enter a public GitHub repo URL, inspect detected deployment facts, answer missing launch questions, receive a deterministic production-readiness plan, and export a Markdown launch plan without needing AI credentials or private-repo access.

## Release Definition
- [ ] Rename or confirm product naming across UI, README, package metadata, and exported Markdown.
  - Current repo name is `ShipReady`.
  - Current README/product copy says `Launch Architect`.
  - Decide whether `ShipReady` is the product name 
- [ ] Bump `package.json` version from `0.0.0` to `0.0.1`.
- [ ] Add a short `CHANGELOG.md` entry for `0.0.1`.
- [ ] Replace the old all-checked V0 TODO with this release-focused TODO.
- [ ] Add a Git tag plan: `v0.0.1` after checks pass.
- [ ] Confirm this release is explicitly scoped to local/public-repo planning, not full GitHub App/private-repo automation.

## Must Work Before Release
- [ ] Fresh install works from a clean clone:
  - [ ] `npm install`
  - [ ] `cp .env.example .env`
  - [ ] `npm run dev`
  - [ ] App opens at `http://localhost:3000`.
- [ ] Required verification commands pass:
  - [ ] `npm run lint`
  - [ ] `npm run typecheck`
  - [ ] `npm run test`
  - [ ] `npm run build`
- [ ] The app works with no AI provider configured.
- [ ] The app works with no GitHub App credentials configured.
- [ ] Demo project flow works from initial page load.
- [ ] Manual project flow works when repo inspection is skipped.
- [ ] Public GitHub repo analysis flow works for at least five real public repos.
- [ ] Failed repo fetch falls back to manual planning without breaking the workflow.

## Product UX
- [ ] Make the landing/intake page explain the promise in one sentence: “Turn a GitHub repo into a production launch plan.”
- [ ] Remove or rewrite any copy that overpromises certification, guaranteed security, or full production readiness.
- [ ] Make the current workflow stage visually obvious: Intake, Analysis, Questions, Recommendation, Launch Plan, Export.
- [ ] Ensure users can continue even when repo inspection is partial, rate-limited, private, or unavailable.
- [ ] Show whether each fact is detected, inferred, user-provided, defaulted, or unknown.
- [ ] Show evidence for detected facts in a readable way.
- [ ] Add a clear “Start over” control that clears local draft state.
- [ ] Add a clear “Load demo” control that resets to a known demo state.
- [ ] Verify localStorage persistence does not cause hydration mismatch, stale UI, or broken reload state.
- [ ] Keep all beginner-facing copy concrete and action-oriented.

## Repo Intake
- [ ] Validate these accepted GitHub URL forms:
  - [ ] `https://github.com/org/repo`
  - [ ] `github.com/org/repo`
  - [ ] URLs with trailing slash.
- [ ] Reject unsupported URLs with a helpful error.
- [ ] Reject malformed owner/repo values with a helpful error.
- [ ] Normalize valid repo URLs before storing them in planner state.
- [ ] Confirm private or missing repos produce a manual fallback path, not a blank state.
- [ ] Confirm rate-limited GitHub API responses produce a manual fallback path.

## Public Repo Analysis
- [ ] Test repo analysis against these project shapes:
  - [ ] Simple Next.js app.
  - [ ] Vite/React static frontend.
  - [ ] Express API.
  - [ ] FastAPI or Flask API.
  - [ ] Monorepo with frontend and backend app roots.
  - [ ] Dockerized app.
  - [ ] Docker Compose with Postgres or Redis.
- [ ] Confirm deployment-relevant files are fetched first or preserved when large repos are truncated.
- [ ] Confirm `package.json` scripts are detected correctly.
- [ ] Confirm lockfiles drive package-manager detection before package metadata guesses.
- [ ] Confirm runtime detection works from `.nvmrc`, `.node-version`, `engines`, `.python-version`, `runtime.txt`, and Dockerfiles where applicable.
- [ ] Confirm frontend framework detection works for Next.js, Vite, Astro, Remix, SvelteKit, Nuxt, and plain static apps.
- [ ] Confirm backend framework detection works for Express, Fastify, Hono, NestJS, FastAPI, Flask, Django, Rails, Laravel, Go HTTP services, and serverless API routes where applicable.
- [ ] Confirm build/start command detection does not confuse dev commands with production commands.
- [ ] Confirm deployment blockers are surfaced for missing build command, missing start command, ambiguous app root, unsupported runtime, and missing production settings.
- [ ] Confirm all detected facts include evidence path and detail.

## Docker Support
- [ ] Confirm Dockerfile detection finds:
  - [ ] Base images.
  - [ ] Build stages.
  - [ ] Workdir.
  - [ ] Install steps.
  - [ ] Copy order.
  - [ ] Exposed ports.
  - [ ] `CMD` or `ENTRYPOINT`.
  - [ ] `HEALTHCHECK`.
  - [ ] `USER`.
  - [ ] Build args.
  - [ ] Env vars.
- [ ] Confirm Compose detection finds:
  - [ ] Services.
  - [ ] Build contexts.
  - [ ] Dockerfile paths.
  - [ ] Ports.
  - [ ] Volumes.
  - [ ] Env files.
  - [ ] Dependencies.
  - [ ] Named volumes.
  - [ ] Networks.
  - [ ] Health checks.
- [ ] Flag local-only Compose databases as development defaults unless the user opts into self-hosting.
- [ ] Flag Docker risks:
  - [ ] Missing `.dockerignore`.
  - [ ] Root runtime user.
  - [ ] Missing health check.
  - [ ] Ambiguous exposed port.
  - [ ] Dev server command used in production.
  - [ ] Secrets copied into image.
  - [ ] Local disk persistence.
- [ ] Only recommend Docker-first deployment when Docker is truly needed or already central to the app.

## Environment Variables and Secrets
- [ ] Detect env vars from source code, config files, README docs, and `.env.example` files.
- [ ] Distinguish server-only vars from client-exposed vars.
- [ ] Flag secret-looking public env vars such as `NEXT_PUBLIC_*SECRET*` or `VITE_*TOKEN*`.
- [ ] Flag hardcoded secret-looking values in source/config.
- [ ] Ignore clear placeholders and test fixtures when safe.
- [ ] Export suggested `.env.example` content without overwriting existing files.
- [ ] Preserve existing `.env.example` variables in suggestions.
- [ ] Include short descriptions and safe placeholder values for suggested env vars.

## Recommendation Engine
- [ ] Confirm every analyzed project gets 2–3 options:
  - [ ] Fastest to Ship.
  - [ ] Cheapest Reasonable Setup.
  - [ ] More Scalable Production Setup when useful.
- [ ] Confirm priority ordering changes when the user chooses cost, speed, scalability, or simplicity.
- [ ] Confirm static sites are not forced into backend infrastructure.
- [ ] Confirm API-only projects get backend-service recommendations instead of frontend hosting defaults.
- [ ] Confirm full-stack apps get managed-service recommendations.
- [ ] Confirm Docker projects include container-friendly options only when appropriate.
- [ ] Confirm existing detected services are preferred over unnecessary provider switching.
- [ ] Add or verify representative tests for static, API, full-stack, Docker, monorepo, and database-backed SaaS projects.

## Launch Plan Output
- [ ] Generated Markdown includes:
  - [ ] Project summary.
  - [ ] Detected stack.
  - [ ] Unknowns and assumptions.
  - [ ] Recommended stack.
  - [ ] Alternative stack options.
  - [ ] Required accounts.
  - [ ] Environment variables.
  - [ ] Deployment steps.
  - [ ] Database setup.
  - [ ] Auth setup.
  - [ ] Email setup.
  - [ ] Payments setup.
  - [ ] Domain/DNS setup.
  - [ ] Monitoring/analytics setup.
  - [ ] Cost estimate.
  - [ ] Risks.
  - [ ] Launch checklist.
  - [ ] Rollback plan.
  - [ ] Next actions.
- [ ] Remove vague plan steps like “configure auth” unless followed by exact settings to check.
- [ ] Include install, build, start, app root, output directory, runtime version, and provider dashboard settings when known.
- [ ] Include Docker build/run/deploy commands only when Docker is detected or recommended.
- [ ] Include risk caveats and pricing caveats in exported Markdown.
- [ ] Include generation metadata: product version, generated date, project name, repo URL, app root, and selected recommendation.

## Checklist and Risk Review
- [ ] Checklist preserves Markdown checkboxes on copy/download.
- [ ] Checklist hides irrelevant sections when a service is not used.
- [ ] Checklist has a “must complete before launch” subset.
- [ ] Risk review sorts by launch impact and severity.
- [ ] High-risk blockers use blunt “do not launch until fixed” wording.
- [ ] Risks include specific fixes, not just warnings.
- [ ] Risks include evidence when available.
- [ ] Duplicate risks are collapsed into one root-cause issue.

## Export and Copy Actions
- [ ] Copy launch plan works.
- [ ] Copy commands works.
- [ ] Copy checklist works.
- [ ] Copy env vars works.
- [ ] Copy `.env.example` suggestion works.
- [ ] Copy Docker config appears only when Docker config is relevant.
- [ ] Download `.md` produces a valid Markdown file.
- [ ] Copied command blocks contain only commands, not surrounding prose.
- [ ] Copied env blocks contain placeholders only, never detected real secret values.
- [ ] Copy success and failure states are visible.

## Tests to Add or Verify
- [ ] URL validation tests.
- [ ] Public GitHub fetch failure mapping tests.
- [ ] Repo truncation/large-repo handling tests.
- [ ] Package-manager detection tests.
- [ ] Framework detection tests.
- [ ] Build/start command detection tests.
- [ ] Runtime detection tests.
- [ ] Env var detection tests.
- [ ] Hardcoded secret detection tests.
- [ ] Service detection tests.
- [ ] Dockerfile parsing tests.
- [ ] Compose parsing tests.
- [ ] Missing-information summary tests.
- [ ] Recommendation ordering tests.
- [ ] Risk review tests.
- [ ] Cost estimate tests.
- [ ] Checklist generation tests.
- [ ] Launch plan snapshot tests.
- [ ] Export Markdown tests.
- [ ] At least one browser smoke test or documented manual smoke path.

## Documentation
- [ ] Update README to match the actual product name and `0.0.1` scope.
- [ ] Document what works in `0.0.1`.
- [ ] Document what does not work yet:
  - [ ] Private repo installation flow.
  - [ ] Provider account creation.
  - [ ] DNS automation.
  - [ ] One-click deployment.
  - [ ] Saved cloud projects.
  - [ ] Team workflows.
  - [ ] Production infrastructure automation.
- [ ] Add a “Known limitations” section.
- [ ] Add a “Manual test script” section.
- [ ] Add a “Release checklist” section.
- [ ] Confirm `.env.example` documents every supported environment variable.

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
- [ ] Add a tiny footer with version `0.0.1`.
- [ ] Add sample public repos in README for testing.
- [ ] Add a one-click “Copy full release report” button.
- [ ] Add a hidden debug panel for fetched file count, default branch, and truncation status.
- [ ] Add a compact “why this recommendation” explanation beside the primary stack option.

## Explicitly Out of Scope for 0.0.1
- [ ] Full private repo GitHub App installation UX.
- [ ] OAuth login.
- [ ] User accounts.
- [ ] Team sharing.
- [ ] Cloud persistence.
- [ ] Actual deployment automation.
- [ ] DNS automation.
- [ ] Provider API provisioning.
- [ ] AI-only plan generation as a requirement.
- [ ] Billing.
- [ ] Compliance certification.

## Release Gate
Do not tag `v0.0.1` until all of these are true:

- [ ] Product name is consistent.
- [ ] Version is bumped to `0.0.1`.
- [ ] README reflects actual scope.
- [ ] Clean install works.
- [ ] `lint`, `typecheck`, `test`, and `build` pass.
- [ ] Demo, manual, valid-public-repo, invalid-url, and repo-fetch-failure flows work.
- [ ] Markdown export works.
- [ ] No copied/exported output contains real secret values.
