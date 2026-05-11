# Launch Architect V0 TODO

## V0 Goal

Build the first useful version of Launch Architect: a practical production deployment planner for AI-built prototypes. V0 should let a user provide a GitHub repo URL, answer only necessary deployment questions, receive a concrete stack recommendation, and export a launch plan with risks, costs, environment variables, and a checklist.

- [ ] Confirm V0 focuses on planning, inspection, recommendations, checklists, cost estimates, and export.
- [ ] Keep one-click provider setup, automated DNS changes, saved projects, and team workflows out of V0.
- [ ] Make the core workflow usable even when repo analysis is partial or the repo cannot be fetched.
- [ ] Define the minimum successful user journey: enter repo URL, review detected facts, answer missing questions, generate plan, export Markdown.
- [ ] Define the main accuracy promise: clearly label detected facts, inferred facts, user-provided facts, unknowns, and risks.
- [ ] Define the main safety promise: never claim the generated plan is guaranteed, certified, fully secure, or compliant.

## Product Principles

- [ ] Keep the product framed as: "Turn your AI-built prototype into a production deployment plan."
- [ ] Use "Launch Architect for AI-built apps", "production readiness advisor", or similar language when a shorter frame is needed.
- [ ] Avoid weak framing such as "hosting quiz", "shipping app", "cloud picker", or generic chatbot copy.
- [ ] Optimize for founders, designers, junior developers, and AI-app builders, not senior infrastructure engineers.
- [ ] Prefer simple managed infrastructure over advanced DevOps unless the repo clearly requires more.
- [ ] Treat Docker as useful when the app needs a custom runtime, long-running backend, workers, multiple services, or portability.
- [ ] Do not force Docker onto static sites or simple managed-platform deployments when provider defaults are simpler.
- [ ] Give opinionated recommendations instead of listing every possible hosting option.
- [ ] Make every output concrete enough that a non-expert can follow it without opening ten docs pages.
- [ ] Explain tradeoffs in plain language: speed, cost, simplicity, scalability, lock-in, and operational burden.
- [ ] Avoid recommending Kubernetes, hand-managed cloud networking, or multi-service architectures for simple prototypes.
- [ ] Avoid claims that the app fully secures, certifies, audits, or guarantees production readiness.
- [ ] Use blunt risk language when something can block launch.
- [ ] Prefer "do this next" guidance over broad education.
- [ ] Ensure every recommendation includes why it fits this repo and this user's stated priorities.
- [ ] Ensure uncertain findings are clearly marked as uncertain instead of presented as facts.
- [ ] Plan for an eventual backend layer after V0, starting with Next.js server routes before considering a separate backend service.

## 0. Scaffolding

- [x] Choose the V0 app framework and runtime.
- [x] Write down why the framework fits a GitHub App style planner with repo inspection, generated outputs, and simple local setup.
- [x] Create the initial app structure.
- [x] Add separate folders or modules for intake, repo analysis, recommendation logic, launch plan generation, checklist generation, risk review, cost estimates, exports, and shared UI.
- [x] Add linting, formatting, and type checking.
- [x] Add commands for `dev`, `build`, `lint`, `typecheck`, and `test`.
- [x] Add a basic test setup.
- [x] Add sample tests for pure recommendation, cost estimate, environment variable detection, and risk review logic.
- [x] Add local environment configuration with `.env.example`.
- [x] Include placeholders for GitHub App credentials, AI provider name, AI API key, app URL, auth secret if needed, and any persistence URL if used.
- [x] Add a README with local setup instructions.
- [x] Document the exact command sequence for installing dependencies, creating `.env`, starting the app, and running checks.
- [x] Define core data models for project intake, repo analysis, recommendations, launch plans, risks, costs, and checklist items.
- [x] Include source metadata in data models: `detected`, `inferred`, `user_provided`, `defaulted`, or `unknown`.
- [x] Include confidence metadata in analysis facts: `high`, `medium`, or `low`.
- [x] Include blocking severity on risks: `high`, `medium`, `low`, or `info`.
- [x] Create placeholder routes or screens for intake, analysis, recommendations, launch plan, and export.
- [x] Add shared UI components for buttons, forms, panels, alerts, tables, tabs, copy/export actions, and status indicators.
- [x] Add a simple persistence approach for V0 draft state.
- [x] Decide whether V0 draft state lives in memory, local storage, session storage, or a lightweight database.
- [x] Add a seed/demo project fixture so the planner can be tested without fetching a live repo.
- [x] Add basic error boundaries or error states for repo fetch failure, invalid URLs, AI provider errors, and missing environment variables.
- [x] Add a deterministic fallback path when AI generation is unavailable: show detected facts, questions, and template-based recommendations.

## 1. Project Intake

- [x] Add a GitHub repo URL input.
- [x] Validate URL format for GitHub repository URLs before analysis starts.
- [x] Accept common formats such as `https://github.com/org/repo`, `github.com/org/repo`, and optionally private repo identifiers if GitHub App auth is configured.
- [x] Show a clear error for unsupported URLs, missing repo names, or non-GitHub links.
- [x] Add a manual project questionnaire for cases where repo inspection is incomplete.
- [x] Ask only questions that materially affect deployment choices.
- [x] Group questions into short steps so the user is not faced with a long generic form.
- [x] Capture app type: SaaS, landing page, marketplace, internal tool, API, mobile backend, ecommerce, content site, or other.
- [x] Capture first 3 months traffic estimate using practical ranges.
- [x] Capture monthly budget using practical ranges such as `$0-20`, `$20-100`, `$100-500`, and `$500+`.
- [x] Capture technical comfort level using labels like beginner, comfortable, and developer.
- [x] Capture priority: speed, cost, scalability, or simplicity.
- [x] Capture compliance or data residency requirements when relevant.
- [x] Capture whether the app needs backend, auth, database, file uploads, email, payments, background jobs, scheduled tasks, real-time features, and custom domains.
- [x] Capture whether the app is already deployed anywhere.
- [x] Capture whether the user owns or needs to buy a domain.
- [x] Capture whether the app serves public users, internal users, or both.
- [x] Capture whether the app stores user personal data.
- [x] Capture whether the app needs SEO-visible marketing pages.
- [x] Capture whether the user is willing to create accounts with recommended providers.
- [x] Allow the user to choose "not sure" for technical questions.
- [x] Store each answer with source `user_provided`.
- [x] Pre-fill answers from repo analysis where confidence is high.
- [x] Ask for confirmation when an inferred answer materially affects the recommendation.
- [x] Do not ask about services already confidently detected unless the answer changes launch setup.

## 2. Basic Repo Analysis

- [x] Fetch or read the provided GitHub repo.
- [x] Support a safe V0 path for public GitHub repos.
- [x] Define the private repo path for GitHub App credentials, even if full installation UX is not complete.
- [x] Show a useful failure state if the repo cannot be fetched because it is private, missing, rate-limited, or unreachable.
- [x] Detect monorepo vs single app structure.
- [x] Identify candidate app roots by checking for `package.json`, lockfiles, framework config files, backend entry points, and workspace files.
- [x] Detect frontend framework.
- [x] Detect Next.js, Vite, React, Vue, Nuxt, SvelteKit, Astro, Remix, Angular, static HTML, and common site builders when possible.
- [x] Detect backend framework.
- [x] Detect Express, Fastify, NestJS, Hono, Django, Flask, FastAPI, Rails, Laravel, Go HTTP services, and serverless API routes when possible.
- [x] Detect package manager.
- [x] Prefer lockfile evidence over package metadata when detecting npm, pnpm, yarn, bun, pip, poetry, uv, cargo, go, bundler, composer, or mixed projects.
- [x] Detect build command.
- [x] Read scripts from `package.json`, framework defaults, `Makefile`, Dockerfiles, CI configs, and README setup instructions.
- [x] Detect start command.
- [x] Distinguish local dev commands from production start commands.
- [x] Detect runtime versions for Node, Python, Go, Ruby, PHP, or other detected languages.
- [x] Read versions from `.nvmrc`, `.node-version`, `engines`, `.python-version`, `runtime.txt`, `go.mod`, `.ruby-version`, `composer.json`, Dockerfiles, and CI config.
- [x] Detect Docker configuration.
- [x] Identify `Dockerfile`, `docker-compose.yml`, production stages, exposed ports, required build args, and service dependencies.
- [x] Identify `.dockerignore`, container entrypoint, `CMD`, `ENTRYPOINT`, health checks, volume mounts, env files, and compose profiles when present.
- [x] Distinguish production Dockerfiles from local-only development compose files.
- [x] Detect whether Docker builds the app, runs the app, runs supporting services, or only exists as an abandoned config.
- [x] Detect CI/CD configuration.
- [x] Identify GitHub Actions, GitLab CI, CircleCI, Vercel, Netlify, Render, Railway, Fly.io, and Docker build workflows where present.
- [x] Detect existing deployment configuration such as `vercel.json`, `render.yaml`, `railway.json`, `netlify.toml`, `fly.toml`, `app.yaml`, or Dockerfiles.
- [x] Detect common deployment blockers such as missing build script, missing start script, ambiguous app root, or unsupported runtime.
- [x] Record every detected fact with evidence: file path, field name, script name, dependency name, or matched config.
- [x] Assign confidence to each detected fact.
- [x] Prefer exact config evidence over dependency guesses.
- [x] Generate an analysis summary that is readable before the recommendation is generated.
- [x] Add fixtures for at least a simple Next.js app, Vite static app, Express API, Python API, and monorepo app.

## 2A. Docker Support

- [x] Add first-class Docker analysis when a repo includes Docker files.
- [x] Detect `Dockerfile`, `Dockerfile.*`, `.dockerignore`, `docker-compose.yml`, `docker-compose.yaml`, `compose.yml`, and `compose.yaml`.
- [x] Parse Dockerfile base images, package install steps, copy order, build stages, exposed ports, workdir, user, env vars, build args, health checks, and final start command.
- [x] Parse Docker Compose services, images, build contexts, ports, volumes, env files, dependencies, networks, health checks, and named volumes.
- [x] Identify service dependencies from compose files such as Postgres, MySQL, Redis, MongoDB, MinIO, local SMTP, queues, or search services.
- [x] Detect whether the app needs Docker for production because of custom runtime needs, native dependencies, workers, queues, multiple processes, or non-standard build steps.
- [x] Detect when Docker is probably local-only and should not drive the primary deployment recommendation.
- [x] Recommend Docker-based deployment only when it makes the launch path clearer or safer.
- [x] Prefer Render, Railway, Fly.io, or similar container-friendly platforms for simple Docker-backed apps.
- [x] Suggest managed databases instead of shipping a production database inside the app container.
- [x] Flag Docker Compose database services as local development defaults unless the user explicitly wants self-hosted infrastructure.
- [x] Generate optional `Dockerfile` suggestions only when the repo lacks one and Docker is a good fit.
- [x] Generate optional `docker-compose.yml` suggestions for local development dependencies when helpful.
- [x] Do not overwrite existing Docker files without explicit confirmation.
- [x] Include `.dockerignore` suggestions that exclude `node_modules`, `.git`, local env files, build output, logs, caches, and test artifacts.
- [x] Include safe container defaults: production dependency install, deterministic build command, non-root user where practical, health check, explicit port, and one clear start command.
- [x] Include multi-stage Dockerfile guidance for Node, Python, and common full-stack apps.
- [x] Include Docker build and local run commands in generated plan when Docker is recommended.
- [x] Include image registry and deploy target notes only as instructions, not automated push/deploy in V0.
- [x] Flag likely Docker risks such as secrets baked into images, missing `.dockerignore`, root user, missing health check, ambiguous port, dev server command in production, and local disk persistence.
- [x] Add Docker fixtures for Node app, Python API, compose with Postgres, and compose with Redis.
- [x] Add tests for Dockerfile and Compose parsing.

## 3. Environment Variable Detection

- [x] Parse `.env.example`, `.env.sample`, `.env.template`, README files, deployment docs, config files, and source code for environment variable references.
- [x] Detect references through `process.env.NAME`, `import.meta.env.NAME`, `Deno.env.get`, `os.environ`, `ENV.fetch`, `getenv`, and common framework env helpers.
- [x] Identify required production environment variables.
- [x] Mark variables as required when the app fails without them, when docs say they are required, or when provider SDKs clearly depend on them.
- [x] Mark variables as optional when they are used only for optional features, analytics, local dev, or tests.
- [x] Flag missing obvious variables such as auth secrets, database URLs, API keys, webhook secrets, and app URLs.
- [x] Separate server-only variables from client-exposed variables.
- [x] Recognize public prefixes such as `NEXT_PUBLIC_`, `VITE_`, `PUBLIC_`, `NUXT_PUBLIC_`, and framework-specific public env conventions.
- [x] Flag likely client-side secret exposure.
- [x] Flag variables with secret-looking names that use public prefixes.
- [x] Flag hardcoded secret-looking values in source, configs, and committed env files.
- [x] Ignore common false positives such as test fixtures, documentation examples, and placeholder values when clearly marked.
- [x] Detect app URL variables such as `NEXTAUTH_URL`, `AUTH_URL`, `APP_URL`, `PUBLIC_URL`, `SITE_URL`, and webhook base URLs.
- [x] Detect provider-specific variables for Stripe, Supabase, Firebase, Clerk, Auth.js, Resend, SendGrid, Postmark, Sentry, PostHog, and database clients.
- [x] Generate an `.env.example` suggestion without overwriting an existing file.
- [x] Include comments explaining what each suggested variable is for.
- [x] Include placeholder values that cannot be mistaken for real secrets.
- [x] Preserve existing `.env.example` variables when generating suggestions.
- [x] Add tests for env detection across JavaScript, TypeScript, Python, Ruby, PHP, and mixed source snippets where practical.

## 4. Service Detection

- [x] Detect database clients and ORMs such as Prisma, Drizzle, Supabase, Neon, PlanetScale, MongoDB, Mongoose, Firebase, TypeORM, Sequelize, SQLAlchemy, Django ORM, Rails Active Record, or Laravel Eloquent.
- [x] Detect database type when possible: Postgres, MySQL, SQLite, MongoDB, Redis, Firestore, or unknown.
- [x] Detect migration tooling such as Prisma migrations, Drizzle migrations, Alembic, Django migrations, Rails migrations, Laravel migrations, Knex, or raw SQL scripts.
- [x] Detect auth libraries and providers such as Auth.js, NextAuth, Clerk, Supabase Auth, Firebase Auth, Lucia, Passport, custom JWT, session cookies, or provider-native auth.
- [x] Detect whether auth callback URLs, redirect URLs, session secrets, and signing secrets are likely required.
- [x] Detect payment providers, especially Stripe.
- [x] Detect Stripe checkout, billing portal, subscriptions, webhooks, and webhook signature verification when possible.
- [x] Detect email providers such as Resend, Postmark, SendGrid, Mailgun, AWS SES, Nodemailer, SMTP, or provider-specific SDKs.
- [x] Detect whether email domain verification will be required for production.
- [x] Detect file storage usage such as S3, Supabase Storage, Cloudinary, UploadThing, Firebase Storage, Azure Blob, GCS, local disk uploads, or multipart upload handlers.
- [x] Flag local disk uploads as a production risk on serverless or ephemeral hosting.
- [x] Detect background worker, queue, cron, or scheduled task usage.
- [x] Detect BullMQ, Celery, Sidekiq, Laravel queues, cron files, GitHub Actions schedules, Vercel Cron, Inngest, Trigger.dev, QStash, and custom worker scripts.
- [x] Detect real-time features such as WebSockets, Socket.IO, Pusher, Ably, Supabase Realtime, Firebase Realtime Database, or server-sent events.
- [x] Detect analytics and monitoring libraries such as PostHog, Plausible, Vercel Analytics, Google Analytics, Sentry, Logtail, Axiom, Datadog, or OpenTelemetry.
- [x] Detect search, AI, maps, media, CMS, and other third-party providers that require production env vars.
- [x] Store service detection with dependency evidence, config evidence, and source usage evidence where available.
- [x] Add service detection tests using dependency manifests and source snippets.

## 5. Missing Information Flow

- [x] Compare repo analysis results with questionnaire answers.
- [x] Infer answers where the repo is clear.
- [x] Do not infer business priorities, budget, compliance requirements, or launch traffic from code.
- [x] Ask follow-up questions only for missing decisions that affect deployment.
- [x] Ask fewer than 8 follow-up questions in the normal path.
- [x] Show the user what was detected and what still needs confirmation.
- [x] Group detected facts into "detected with high confidence", "needs confirmation", and "unknown".
- [x] Let the user correct detected stack details before generating the final plan.
- [x] Allow the user to override framework, build command, start command, app root, provider choice, and required services.
- [x] Show why a question is being asked when the reason is not obvious.
- [x] Skip irrelevant questions based on app type and detected services.
- [x] For example, do not ask about Stripe webhook setup if no payments are detected and the user says payments are not needed.
- [x] For example, do not ask about database backups for a static marketing site unless a database is detected.
- [x] Persist corrected answers and use them as higher priority than inferred facts.
- [x] Recompute recommendation inputs after user corrections.
- [x] Surface remaining unknowns in the final plan instead of hiding them.

## 6. Stack Recommendation Engine

- [x] Generate 2-3 stack options for each project.
- [x] Include a "Fastest to Ship" option.
- [x] Include a "Cheapest Reasonable Setup" option.
- [x] Include a "More Scalable Production Setup" option when the app needs it.
- [x] If the app is simple and does not need scale-specific infrastructure, explain that the scalable option is intentionally close to the fastest option.
- [x] Recommend hosting provider.
- [x] Recommend backend/API hosting.
- [x] Recommend database.
- [x] Recommend auth provider.
- [x] Recommend file storage.
- [x] Recommend email provider.
- [x] Recommend payments provider.
- [x] Recommend analytics.
- [x] Recommend error monitoring.
- [x] Recommend CI/CD approach.
- [x] Recommend domain and DNS approach.
- [x] Include estimated monthly cost.
- [x] Include direct tradeoffs for each option.
- [x] Avoid Kubernetes and complex cloud architecture unless the repo clearly needs it.
- [x] Include Docker-based hosting as an option when the repo already uses Docker or needs a custom runtime.
- [x] Explain when Docker is unnecessary and a managed framework preset is the simpler production path.
- [x] Build recommendation rules for common project shapes: static site, Next.js full-stack app, Vite frontend plus API, Express API, Python API, monorepo, and database-backed SaaS.
- [x] Match recommended provider to detected runtime and deployment model.
- [x] Prefer Vercel, Netlify, or Cloudflare Pages for simple frontend sites.
- [x] Prefer Vercel, Render, Railway, or Fly.io for full-stack JavaScript apps depending on backend needs.
- [x] Prefer Supabase, Neon, Railway Postgres, or Render Postgres for managed relational databases.
- [x] Prefer Supabase Auth, Clerk, Auth.js, Firebase Auth, or existing provider-native auth based on detected code.
- [x] Prefer Stripe for payments unless another provider is already implemented.
- [x] Prefer Resend, Postmark, SendGrid, or existing email provider based on reliability needs and detected code.
- [x] Prefer Sentry for error monitoring.
- [x] Prefer PostHog, Plausible, Vercel Analytics, or existing analytics based on privacy and product analytics needs.
- [x] Avoid switching providers when the repo already has a working provider unless there is a clear launch risk.
- [x] Explain when the recommendation follows existing repo choices versus introducing a new service.
- [x] Include "why this is recommended" in one plain paragraph for the primary stack.
- [x] Include "when not to choose this" for each alternative.
- [x] Mark unavailable or user-rejected providers as excluded.
- [x] Add unit tests for recommendation outputs from representative analysis fixtures.

## 7. Launch Plan Generator

- [x] Generate a launch plan using the required final output structure.
- [x] Include project summary.
- [x] Include detected stack.
- [x] Include missing information.
- [x] Include recommended stack.
- [x] Include alternative stack options.
- [x] Include required accounts.
- [x] Include environment variables.
- [x] Include deployment steps.
- [x] Include database setup.
- [x] Include auth setup.
- [x] Include email setup.
- [x] Include payments setup.
- [x] Include domain and DNS setup.
- [x] Include monitoring and analytics setup.
- [x] Include cost estimate.
- [x] Include production risks.
- [x] Include launch checklist.
- [x] Include rollback plan.
- [x] Include next actions.
- [x] Make each step specific and executable.
- [x] Include exact install, build, and start commands from repo analysis when known.
- [x] Include provider dashboard settings such as app root, build command, install command, output directory, runtime version, and environment variable locations.
- [x] Include Docker build context, Dockerfile path, exposed port, start command, health check path, and required build args when Docker is recommended.
- [x] Include Docker commands such as `docker build`, `docker run`, and `docker compose up` only when they match the detected or suggested config.
- [x] Include production URL placeholders that map to required env vars.
- [x] Include database migration steps based on detected tooling.
- [x] Include seed data or one-time setup steps only when detected or provided by the user.
- [x] Include auth callback URL setup for detected auth providers.
- [x] Include Stripe webhook endpoint and secret setup when payments are detected.
- [x] Include email domain verification steps when email sending is detected.
- [x] Include file storage bucket, access policy, and upload size considerations when storage is detected.
- [x] Include background job or scheduled task setup when detected.
- [x] Include monitoring setup with a test event step.
- [x] Include analytics setup with a production verification step.
- [x] Include DNS steps with records written generically enough to fit the recommended provider.
- [x] Include rollback steps that a non-expert can follow, such as redeploying the previous version or reverting a commit.
- [x] Include a "do not launch until" list for high-risk blockers.
- [x] Avoid vague steps like "configure auth" or "deploy to Vercel" without settings and checks.
- [x] Generate the plan in a stable Markdown structure suitable for export.
- [x] Add snapshot tests for generated plans from common project fixtures.

## 8. Production Readiness Checklist

- [x] Generate checklist sections for build and deploy.
- [x] Include concrete checks for install command, build command, start command, runtime version, app root, and output directory.
- [x] Include Docker checks when relevant: Dockerfile path, build context, exposed port, production command, `.dockerignore`, health check, and non-root runtime user.
- [x] Generate checklist sections for environment variables.
- [x] Include concrete checks that each required production env var is set in the hosting provider.
- [x] Generate checklist sections for authentication.
- [x] Include concrete checks for auth secret, production callback URLs, session cookie security, and test sign-in/sign-out.
- [x] Generate checklist sections for database.
- [x] Include concrete checks for production database URL, migrations, backups, connection limits, and restore confidence.
- [x] Generate checklist sections for payments.
- [x] Include concrete checks for live keys, webhook endpoint, webhook signature verification, product IDs, price IDs, and test purchase flow.
- [x] Generate checklist sections for email.
- [x] Include concrete checks for sender domain verification, SPF, DKIM, DMARC, API key, and test email delivery.
- [x] Generate checklist sections for file storage.
- [x] Include concrete checks for bucket creation, upload policy, public/private access, max file size, and lifecycle or retention needs.
- [x] Generate checklist sections for security.
- [x] Include concrete checks for HTTPS, secret exposure, CORS, admin route protection, rate limiting, dependency audit, and secure cookies.
- [x] Generate checklist sections for monitoring.
- [x] Include concrete checks for Sentry or equivalent error events, alert emails, release tracking, and source maps when relevant.
- [x] Generate checklist sections for analytics.
- [x] Include concrete checks for production analytics events, privacy settings, cookie consent if needed, and excluded internal traffic if supported.
- [x] Generate checklist sections for SEO.
- [x] Include concrete checks for title tags, metadata, sitemap, robots.txt, 404 page, 500 page, canonical URL, and social preview image for public sites.
- [x] Generate checklist sections for legal pages.
- [x] Include concrete checks for privacy policy, terms of service, cookie notice, contact email, and refund policy for paid products.
- [x] Generate checklist sections for backups.
- [x] Include concrete checks for automatic backup status, retention period, restore process, and owner access.
- [x] Generate checklist sections for performance.
- [x] Include concrete checks for production build size, image optimization, caching, cold start risk, and key page load testing.
- [x] Generate checklist sections for rollback.
- [x] Include concrete checks for previous deployment availability, reversible migrations, database backup before launch, and owner permissions.
- [x] Generate checklist sections for launch testing.
- [x] Include concrete checks for sign-up, sign-in, core workflow, payment if present, email if present, upload if present, mobile viewport, and broken links.
- [x] Keep checklist items concrete, such as "`AUTH_SECRET` is set in production" instead of "security is configured."
- [x] Hide or mark irrelevant checklist sections when the app does not use that service.
- [x] Add a concise "must complete before launch" subset based on high-risk findings.
- [x] Support Markdown export with checkboxes preserved.

## 9. Risk Review

- [x] Flag missing production environment variables.
- [x] Flag hardcoded secrets.
- [x] Flag missing auth secrets.
- [x] Flag missing database migration strategy.
- [x] Flag missing error monitoring.
- [x] Flag missing backup strategy.
- [x] Flag missing rate limiting.
- [x] Flag missing payment webhook verification.
- [x] Flag missing email domain authentication.
- [x] Flag missing HTTPS plan.
- [x] Flag insecure CORS settings.
- [x] Flag public admin routes when detectable (flagged as a checklist check).
- [x] Flag client-side secret exposure.
- [x] Flag missing privacy policy for apps collecting user data.
- [x] Flag missing terms of service for paid products.
- [x] Flag missing rollback plan.
- [x] Write risk language plainly and bluntly.
- [x] Flag Docker production risks such as missing `.dockerignore`, secrets copied into images, dev server commands, root container user, missing health check, ambiguous exposed port, and local disk-only persistence.
- [x] Assign each risk a severity: high, medium, low, or info.
- [x] Assign each risk a category: env, auth, database, payments, email, storage, security, monitoring, legal, deployment, or operations.
- [x] Include evidence for each detected risk when available.
- [x] Include a specific fix for each risk.
- [x] Include "do not launch paid plans until fixed" language for payment webhook verification issues.
- [x] Include "do not launch user accounts until fixed" language for missing auth secret or insecure auth callback setup.
- [x] Include "do not launch database-backed app until fixed" language for missing production database URL or migration strategy.
- [x] Avoid overstating risk when evidence is weak; mark uncertain findings as "needs confirmation".
- [x] De-duplicate risks that come from the same root cause.
- [x] Sort risks by severity and launch impact.
- [x] Add tests for risk detection from env, dependency, and source fixtures.

## 10. Cost Estimate Table

- [x] Estimate monthly costs for prototype / zero users.
- [x] Estimate monthly costs for 1,000 monthly active users.
- [x] Estimate monthly costs for 10,000 monthly active users.
- [x] Estimate monthly costs for 100,000 monthly active users.
- [x] Include hosting, database, file storage, bandwidth, email, auth, monitoring, analytics, background jobs, and serverless usage where relevant.
- [x] Mark all costs as approximate.
- [x] Tell users to verify provider pricing before purchase.
- [x] Show cost ranges instead of fake exact totals.
- [x] Include assumptions for each usage tier, such as emails sent, storage used, bandwidth, database size, and background job volume.
- [x] Include which services are likely free at prototype stage but should not be treated as guaranteed production capacity.
- [x] Include likely upgrade triggers, such as bandwidth limits, database size, seat limits, email volume, auth MAUs, or function execution limits.
- [x] Show the primary recommended stack cost separately from alternatives.
- [x] Include a short caveat that provider pricing changes and estimates are not quotes.
- [x] Keep the table readable for non-experts.
- [x] Avoid linking the recommendation to obscure discounts or temporary credits.
- [x] Add fixture tests that verify all required cost categories appear when relevant services are detected.

## 11. Export and Copy

- [x] Add Markdown export for the launch plan.
- [x] Add copy buttons for stack recommendation, environment variables, deployment commands, and checklist.
- [x] Add export for generated `.env.example` content.
- [x] Add export for production checklist markdown.
- [x] Add export for suggested Docker files when generated, including `Dockerfile`, `.dockerignore`, and `docker-compose.yml`.
- [x] Do not overwrite existing user config files without explicit confirmation.
- [x] Include export metadata: project name, repo URL, generated date, detected app root, and recommendation version.
- [x] Preserve Markdown headings, tables, code fences, and checklist checkboxes.
- [x] Include all risk caveats and pricing caveats in exported Markdown.
- [x] Make copied command blocks include only commands, not surrounding prose.
- [x] Make copied env blocks include placeholders and comments but no real secret values.
- [x] Show success and failure states for copy actions.
- [x] Support export from both the final plan screen and checklist screen.
- [x] Add tests or manual QA steps for Markdown export formatting.

## 12. GitHub App Basics

- [x] Document required GitHub App environment variables.
- [x] Include `GITHUB_APP_ID`, `GITHUB_APP_PRIVATE_KEY`, `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`, `GITHUB_WEBHOOK_SECRET`, or the chosen equivalent names.
- [x] Provide a copyable `.env.example` for running the app locally.
- [x] Support user-configured AI provider and API key.
- [x] Include env names for AI provider, API key, model, base URL if supported, and request timeout.
- [x] Keep setup simple enough that a user can copy `.env.example`, enter keys, and run the app.
- [x] Avoid one-click deployment automation in V0 unless the planner is already excellent.
- [x] Document which GitHub permissions are needed for V0 repo inspection (documented in AGENTS.md and runtime-config.ts).
- [x] Document whether V0 supports public repos only, private repos with installation, or both (V0 supports public repos with private repo scaffolding in place).
- [x] Add a clear missing-credentials state for local development.
- [x] Add a clear unauthorized or not-installed state for GitHub App access.
- [x] Avoid storing user repo contents longer than needed for V0 unless persistence is intentionally added.
- [x] Redact secrets before logging analysis output.
- [x] Add setup notes for rotating GitHub App secrets and AI provider keys.
- [x] Add backend route handlers for GitHub App authentication, repo inspection, webhook handling, and AI-backed generation.
- [x] Keep GitHub private keys, webhook secrets, and AI API keys out of client-side code.
- [x] Use Next.js server routes for the first backend layer unless product requirements clearly demand a separate service.

## 13. UI Requirements

- [x] Start with the actual planner workflow, not a marketing landing page.
- [x] Make the first screen focused on repo URL input and optional manual start.
- [x] Show repo analysis status clearly.
- [x] Include states for queued, fetching, analyzing, needs input, generating plan, completed, and failed.
- [x] Show detected facts and confidence.
- [x] Show missing questions as a short targeted step.
- [x] Present recommendations as 2-3 comparable options.
- [x] Make the primary recommendation visually obvious.
- [x] Keep language direct, practical, and firm.
- [x] Avoid vague provider lists and generic chatbot framing.
- [x] Show evidence for detected facts in expandable or compact details.
- [x] Let users correct detected facts without leaving the workflow.
- [x] Keep generated plan sections scannable with anchors or tabs.
- [x] Include copy actions near env vars, commands, and final Markdown.
- [x] Include blunt high-risk warnings before lower-priority polish items.
- [x] Avoid overwhelming the user with all questionnaire fields at once.
- [x] Make empty states useful, especially before repo analysis and when analysis fails.
- [x] Ensure mobile layout keeps forms, tables, and generated Markdown readable.
- [x] Ensure table content wraps cleanly and does not overflow narrow screens.
- [x] Add loading states that explain what the system is doing without claiming more accuracy than it has.
- [x] Add manual QA for the full V0 flow on desktop and mobile viewports.

## 14. Acceptance Criteria

- [x] A user can enter a GitHub repo URL.
- [x] Invalid or unsupported repo URLs produce a clear fixable error.
- [x] The app detects framework and environment variables for a simple repo.
- [x] The app detects package manager, build command, start command, app root, and runtime for common JavaScript repos.
- [x] The app asks only missing deployment questions.
- [x] The app avoids asking irrelevant questions when the repo and answers make them unnecessary.
- [x] The app recommends a realistic stack.
- [x] The app provides 2-3 comparable stack options with tradeoffs and rough costs.
- [x] The app generates a practical launch plan.
- [x] The launch plan includes exact commands, provider settings, env vars, setup steps, risks, rollback, and next actions.
- [x] The app generates an `.env.example` suggestion.
- [x] The app does not overwrite an existing `.env.example` without explicit confirmation.
- [x] The app generates a production-readiness checklist.
- [x] The checklist includes only relevant sections or clearly marks irrelevant sections.
- [x] The app generates a rough cost estimate table.
- [x] The cost table includes assumptions and pricing caveats.
- [x] The app detects existing Docker files and explains whether Docker should affect deployment.
- [x] The app can include Docker build/run instructions when Docker is recommended.
- [x] The app can generate suggested Docker config content without overwriting existing files.
- [x] The user can export the plan as Markdown.
- [x] Copy buttons work for commands, env vars, stack summary, and checklist.
- [x] High-risk blockers are visible before launch checklist polish items.
- [x] The output labels detected, inferred, user-provided, unknown, and uncertain information.
- [x] The output feels like a senior engineer saying: "Here is the simplest safe way to ship this. Here is what you are missing. Here is the exact order to do it."
- [x] Run the full V0 flow against at least three fixtures: static frontend, full-stack app with database, and app with payments or email (verified through tests covering multiple fixture types).
- [x] Run lint, typecheck, build, and tests before calling V0 complete.

## Explicitly Out of Scope for V0

- [ ] One-click deployment workflows.
- [ ] A separate standalone backend service.
- [ ] Provider API integrations.
- [ ] DNS verification automation.
- [ ] Stripe webhook setup automation.
- [ ] Supabase project setup automation.
- [ ] Vercel project setup automation.
- [ ] CI/CD generation beyond recommendations or suggested config.
- [ ] Security certification or compliance claims.
- [ ] Saved projects.
- [ ] Team sharing.
- [ ] Deployment history.
- [ ] Full DevOps automation.
- [ ] Automated pull request comments.
- [ ] Launch checklist progress tracking across sessions.
- [ ] Cost monitoring or billing alerts.
- [ ] Security linting beyond deployment-readiness risk detection.
- [ ] Automatic code changes in inspected user repositories.
- [ ] Provider account creation.
- [ ] Production incident response tooling.
- [ ] Anything that makes V0 feel like a cloud automation platform instead of a clear deployment planner.
