# ShipReady v0.3 TODO

## Goal

Wire up AI provider credentials to generate better launch plans, generate downloadable config files (vercel.json, Dockerfile, CI workflows), make the checklist interactive, and harden the API with rate limiting, caching, and priority-based file selection.

---

## Priority 0 — AI-Powered Plan Generation

- [ ] Build an AI provider client
  - Support OpenAI and OpenAI-compatible providers (generic base URL)
  - Support Anthropic
  - Use `AI_PROVIDER`, `AI_API_KEY`, `AI_MODEL`, `AI_BASE_URL` from env
  - Respect `AI_REQUEST_TIMEOUT_MS`

- [ ] Construct a system prompt for launch plan generation
  - Include repo analysis facts (framework, package manager, build/start commands, services, env vars)
  - Include user intake answers (app type, traffic, budget, needs)
  - Instruct AI to produce structured sections matching the 19-section launch plan format
  - Instruct AI to flag risks, generate checklist items, and estimate costs

- [ ] Update `/api/generate-plan` to call the AI provider
  - Send repo analysis + intake as context
  - Parse AI JSON response into `LaunchPlanSection[]`
  - Fall back to deterministic generation when AI is unavailable, times out, or returns unparseable content
  - Log which path was used (AI vs. deterministic)

- [ ] Add AI/deterministic badge in UI
  - Show on the launch plan section header
  - Show in the export metadata

- [ ] Add tests for AI generation
  - Mock provider responses (valid JSON, malformed JSON, timeout, error)
  - Verify deterministic fallback triggers correctly
  - Verify prompt construction

---

## Priority 1 — Config File Generation

- [ ] Build a config generation module (`src/features/config-generation/`)
  - Accept analysis + recommendation as input
  - Return file name + content pairs

- [ ] Generate `vercel.json`
  - Set framework preset based on detected frontend framework
  - Set build command, install command, and output directory
  - Set runtime version when detected

- [ ] Generate `render.yaml` / `railway.json`
  - Set service type, build filter, start command
  - Set env vars from analysis

- [ ] Generate `Dockerfile`
  - Multi-stage Node.js build for JS/TS projects
  - Python stages for Python projects
  - Set exposed port, workdir, non-root user recommendation

- [ ] Generate `.dockerignore`
  - Exclude `node_modules`, `.git`, `.env`, build output, logs, caches

- [ ] Generate GitHub Actions CI workflow (`.github/workflows/ci.yml`)
  - Run lint, typecheck, test, build
  - Use detected package manager and Node version

- [ ] Add config preview modal in the Export section
  - Syntax-highlighted file content
  - Download button per file
  - "Copy to clipboard" per file

- [ ] Add snapshot tests for generated configs
  - `vercel.json` for Next.js, Vite, Astro
  - `Dockerfile` for Node.js and Python
  - `ci.yml` for npm, pnpm, yarn
  - `render.yaml` for typical stacks

---

## Priority 2 — Interactive Checklist

- [ ] Convert checklist items to interactive `<input type="checkbox">`
  - Wire change handler to update draft state
  - Store checked state as `Set<string>` of item IDs in draft

- [ ] Persist checklist state in localStorage
  - Save checked item IDs alongside planner draft
  - Restore on page load

- [ ] Add progress indicators
  - Per section: "3/5 complete" label
  - Overall: progress bar in sidebar nav
  - Show completion percentage

- [ ] Visual emphasis on must-complete items
  - Bold or icon-highlight required-before-launch items
  - Show launch blocker count update as items are checked

---

## Priority 3 — API Hardening

- [ ] Add rate limiting to `POST /api/analyze-repo`
  - In-memory store keyed by `x-forwarded-for` or IP
  - Limit: 20 requests per minute per IP
  - Return `429` with `Retry-After` header and clear JSON error
  - Add tests for allowed and blocked requests

- [ ] Add request timeout protection
  - Use `AbortController` with timeout race in `analyze-repo` route
  - Cap at `AI_REQUEST_TIMEOUT_MS` or 30s default
  - Return useful timeout error message

- [ ] Add server-side request body validation
  - Validate `repoUrl` is a non-empty GitHub URL
  - Validate body size < 10KB
  - Reject non-GitHub URLs, empty bodies, malformed JSON

- [ ] Add in-memory caching for repo analysis
  - Cache key: `owner/repo/defaultBranch`
  - TTL: 5 minutes
  - Include cache hit/miss logging in development
  - Invalidate on explicit re-analysis

---

## Priority 4 — Priority-Based File Selection

- [ ] Replace simple file filtering with scored file selection
  - Category weights: config files (50), lockfiles (40), framework config (30), CI/deployment config (25), app entry points (15), Docker files (25), env files (20), generic source (5)
  - Sort by score descending before applying the 160-file cap
  - Always include `package.json`, lockfiles, `next.config.*`, Dockerfiles, CI configs, `.env.example`

- [ ] Improve app-root candidate scoring
  - Weight by framework config file presence (next.config.* = 30, vite.config.* = 25, etc.)
  - Weight by build/start scripts in package.json (15 each)
  - Weight by workspace membership in monorepo configs (10)
  - Sort candidates by score descending

- [ ] Expose top 3 app-root candidates in the analysis result
  - Show in the UI with confidence badges
  - Allow user override (future: select different root)

---

## Priority 5 — UI Polish

- [ ] Replace monochrome confidence badges with colored ones
  - `high` = green badge, `medium` = yellow, `low` = red

- [ ] Add config file preview/download panel in Export section
  - "Generated Configs" sub-section
  - Each file shown in a collapsible `<pre>` block with copy + download buttons

- [ ] Add expandable launch plan sections
  - Click section title to expand/collapse
  - Default: first section expanded, rest collapsed
  - Animation for expand/collapse

- [ ] Improve empty states
  - "No repo analyzed yet" illustration/icon
  - "No launch plan generated yet" with prompt to fill intake
  - "No risks detected" positive state

- [ ] Add generation mode badge to launch plan header
  - "AI-generated" with sparkle icon when AI was used
  - "Deterministic" with chip icon when fallback was used

---

## Priority 6 — CI and Tests

- [ ] Add GitHub Actions CI (`.github/workflows/ci.yml`)
  - Trigger: push to main, pull requests
  - Matrix: Node 18, 20, 22
  - Steps: checkout → setup-node → npm ci → lint → typecheck → test → build
  - Cache `node_modules` and Next.js build output

- [ ] Add API route integration tests
  - `POST /api/analyze-repo` with valid URL
  - `POST /api/analyze-repo` with invalid URL → 400
  - `POST /api/analyze-repo` with empty body → 400
  - Rate limit test (rapid requests → 429)
  - Timeout test (mock slow GitHub response)

- [ ] Add AI generation unit tests
  - Mock `fetch` to return valid AI response
  - Mock `fetch` to return 401 (bad key)
  - Mock `fetch` to timeout
  - Mock `fetch` to return unparseable content
  - Verify deterministic fallback in all error cases

- [ ] Add config generation snapshot tests
  - `vercel.json` for Next.js app
  - `Dockerfile` for Node.js app
  - `ci.yml` for pnpm monorepo
  - `render.yaml` for Express API

- [ ] Add checklist persistence tests
  - Save and restore checked items from localStorage
  - Progress calculation accuracy

---

## Definition of Done

v0.3 is complete when:

- [ ] `/api/generate-plan` calls the AI provider and falls back to deterministic when AI is unavailable
- [ ] AI vs. deterministic generation mode is visible in the UI
- [ ] Config files (vercel.json, Dockerfile, CI workflow, render.yaml, railway.json) can be generated, previewed, and downloaded
- [ ] Checklist items are interactive checkboxes with localStorage persistence and progress bars
- [ ] `/api/analyze-repo` has rate limiting, timeout protection, request validation, and in-memory caching
- [ ] File selection is scored by importance, not first-160
- [ ] App-root candidates are scored and top 3 are shown
- [ ] GitHub Actions CI runs lint, typecheck, test, and build
- [ ] All new features have tests
- [ ] `npm run lint`, `npm run typecheck`, `npm run test`, and `npm run build` pass
- [ ] Existing demo, manual, and repo-URL workflows still work end-to-end
