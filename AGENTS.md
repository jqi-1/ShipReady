# AGENTS.md

## Project: Launch Architect

Launch Architect turns AI-built prototypes into production-ready deployment plans. It helps founders, indie hackers, designers, junior developers, and vibe-coders move from “it works locally” to “it is safely deployed.”

This is not a generic hosting quiz. The product should inspect the project, ask targeted questions, recommend stack options, generate concrete setup steps, and produce a production-readiness checklist.

## Core Product Goal

Given a user’s app or website, Launch Architect should produce:

- A recommended deployment stack
- Alternative stack options for different priorities
- A reasoned explanation of tradeoffs
- Required environment variables
- Build and deployment commands
- Service setup instructions
- Cost estimates
- Production-readiness checklist
- Risk flags and missing pieces
- Optional generated config files

The output should be practical enough that a non-senior technical user can follow it without hunting through ten different docs pages.

## Github App
This project is a Github App, meaning whoever uses it should be able to copy a .env file and enter an API key and provider for usage

## Target User

Primary users:

- Builders using tools like Cursor, Lovable, Bolt, v0, Replit, Insforge, Firebase Studio, or similar
- Founders with a working prototype but no deployment expertise
- Designers or product people who generated an app and need to ship it
- Junior developers who need a deployment path

Do not optimize for senior infrastructure engineers. They are not the core audience.

## Positioning

The app should be framed as:

> Turn your AI-built prototype into a production deployment plan.

Avoid weak framing such as:

- “A shipping app”
- “A hosting recommendation quiz”
- “A tool that tells you where to deploy”

Preferred framing:

- “Launch Architect for AI-built apps”
- “Deploy Copilot for prototypes”
- “Production readiness advisor”
- “From prototype to production”

## Primary Workflow

1. User connects or uploads a project.
2. System inspects the repo.
3. System identifies framework, package manager, build command, runtime, env vars, database hints, auth hints, and deployment blockers.
4. System asks only the missing questions needed to make a deployment recommendation.
5. System recommends stack options.
6. System generates a launch plan.
7. System generates checklists, config suggestions, and setup instructions.
8. User can export or copy the plan.

## Questions to Ask the User

Ask only questions that materially affect deployment choices.

Important questions:

- What is the app type? SaaS, landing page, marketplace, internal tool, API, mobile backend, ecommerce, content site, or other.
- What frontend framework is being used?
- Does the app need a backend?
- Does it need authentication?
- Does it need a database?
- Does it need file uploads?
- Does it need email sending?
- Does it need payments?
- Does it need background jobs or scheduled tasks?
- Does it need real-time features?
- Does it need custom domains?
- What is the expected traffic in the first 3 months?
- What is the monthly budget?
- What is the user’s technical comfort level?
- Are there compliance or data residency requirements?
- Is speed, cost, scalability, or simplicity the top priority?

Do not ask every question blindly. Infer whatever possible from the repo.

## Repo Inspection Agent

The Repo Inspection Agent analyzes a project and extracts deployment-relevant facts.

Responsibilities:

- Detect frontend framework
- Detect backend framework
- Detect package manager
- Detect build command
- Detect start command
- Detect required Node, Python, Go, Ruby, PHP, or other runtime versions
- Detect environment variable usage
- Detect database clients or ORMs
- Detect auth libraries
- Detect payment providers
- Detect email providers
- Detect file storage usage
- Detect background worker usage
- Detect Docker configuration
- Detect CI/CD configuration
- Detect deployment configuration
- Detect monorepo structure
- Detect missing production essentials

Example outputs:

- Framework: Next.js
- Package manager: pnpm
- Build command: pnpm build
- Start command: pnpm start
- Database: Prisma detected
- Auth: NextAuth/Auth.js detected
- Payments: Stripe SDK detected
- Email: Resend SDK detected
- Env vars required: DATABASE_URL, AUTH_SECRET, STRIPE_SECRET_KEY, RESEND_API_KEY
- Risk: No error monitoring detected
- Risk: No database backup strategy detected

## Recommendation Agent

The Recommendation Agent chooses realistic deployment stacks.

It should recommend 2–3 options:

1. Fastest to ship
2. Cheapest reasonable setup
3. More scalable production setup

Each recommendation must include:

- Hosting provider
- Backend/API hosting
- Database
- Auth provider
- File storage
- Email provider
- Payments provider
- Analytics
- Error monitoring
- CI/CD approach
- Domain/DNS approach
- Estimated monthly cost
- Tradeoffs

Example stack options:

### Fastest to Ship

- Vercel for frontend and serverless functions
- Supabase for Postgres, auth, and storage
- Resend for transactional email
- Stripe for payments
- Sentry for error monitoring
- PostHog for analytics

### Cheapest Reasonable Setup

- Render or Railway for app hosting
- Supabase free tier or Neon free tier for Postgres
- Resend free tier for email
- Stripe for payments
- Plausible, PostHog, or simple Vercel Analytics depending on budget

### More Scalable Setup

- Vercel or Fly.io for app hosting
- Neon, Supabase, PlanetScale, or managed Postgres depending on app architecture
- Upstash for Redis and queues
- S3-compatible storage
- Sentry for monitoring
- PostHog or Segment for analytics

## Launch Plan Agent

The Launch Plan Agent converts the recommendation into step-by-step instructions.

The plan should include:

- Prerequisites
- Accounts to create
- Services to configure
- Environment variables
- Database setup
- Build settings
- Deployment commands
- Domain setup
- DNS records
- Email domain verification
- Payment webhook setup
- Auth callback URLs
- Monitoring setup
- Analytics setup
- Backup setup
- Rollback plan
- Final test checklist

Each step should be specific and executable.

Bad:

> Deploy to Vercel.

Good:

> In Vercel, import the GitHub repository, set the framework preset to Next.js, set the build command to `pnpm build`, set the install command to `pnpm install`, and add the required environment variables from `.env.example`.

## Checklist Agent

The Checklist Agent generates production-readiness checklists.

Checklist categories:

- Build and deploy
- Environment variables
- Authentication
- Database
- Payments
- Email
- File storage
- Security
- Monitoring
- Analytics
- SEO
- Legal pages
- Backups
- Performance
- Rollback
- Launch testing

Checklist items should be concrete.

Bad:

- Security is configured

Good:

- `AUTH_SECRET` is set in production
- Auth callback URLs point to the production domain
- Stripe webhook endpoint is configured for the production URL
- Database backups are enabled
- Error monitoring is receiving test events
- 404 and 500 pages exist
- Sitemap and robots.txt exist for public marketing pages

## Cost Estimation Agent

The Cost Estimation Agent gives rough monthly cost projections.

It should estimate costs at:

- Prototype / zero users
- 1,000 monthly active users
- 10,000 monthly active users
- 100,000 monthly active users

Cost estimates should be honest, approximate, and caveated.

Include:

- Hosting
- Database
- File storage
- Bandwidth
- Email
- Auth
- Monitoring
- Analytics
- Background jobs
- Edge functions or serverless usage

Never pretend exact pricing is guaranteed. Pricing changes. Make it clear that estimates should be verified before purchase.

## Risk Review Agent

The Risk Review Agent identifies deployment blockers and dangerous omissions.

Flag issues such as:

- Missing production environment variables
- Hardcoded secrets
- Missing auth secret
- Missing database migration strategy
- No error monitoring
- No backup strategy
- No rate limiting
- No payment webhook verification
- No email domain authentication
- No HTTPS plan
- Insecure CORS settings
- Public admin routes
- Client-side secret exposure
- Missing privacy policy for apps collecting user data
- Missing terms of service for paid products
- No rollback plan

Risk output should be blunt.

Example:

> High risk: Stripe is installed, but no webhook verification logic was detected. Do not launch paid plans until webhooks are verified server-side.

## Config Generation Agent

The Config Generation Agent can generate files such as:

- `.env.example`
- `README-deploy.md`
- `vercel.json`
- `render.yaml`
- `railway.json`
- `Dockerfile`
- `docker-compose.yml`
- GitHub Actions workflow
- Deployment checklist markdown
- DNS checklist
- Launch checklist

Do not overwrite user files without explicit confirmation.

Generated config should include comments explaining what each value does.

## Output Standards

Every recommendation must be:

- Specific
- Practical
- Opinionated
- Justified
- Honest about tradeoffs
- Safe for production use
- Clear enough for a non-expert to follow

Avoid:

- Vague advice
- Fake certainty
- Overengineering
- Suggesting Kubernetes for simple apps
- Recommending expensive infrastructure by default
- Listing every possible option
- Copying provider marketing language
- Pretending free tiers are production guarantees

## Stack Recommendation Principles

Prefer simple, managed infrastructure unless the project clearly needs more.

Default priorities:

1. Ship safely
2. Keep setup understandable
3. Avoid unnecessary infrastructure
4. Keep cost low
5. Allow room to scale
6. Reduce maintenance burden

For simple frontend sites:

- Prefer Vercel, Netlify, Cloudflare Pages, or similar.

For full-stack JavaScript apps:

- Prefer Vercel, Render, Railway, Fly.io, or similar depending on backend needs.

For database-backed prototypes:

- Prefer Supabase, Neon, Railway Postgres, Render Postgres, or similar managed databases.

For auth:

- Prefer Supabase Auth, Clerk, Auth.js, Firebase Auth, or provider-native auth depending on app needs.

For payments:

- Prefer Stripe unless the user has a clear reason otherwise.

For email:

- Prefer Resend, Postmark, SendGrid, or provider-specific options depending on reliability and cost needs.

For monitoring:

- Prefer Sentry for errors.
- Prefer PostHog, Plausible, or Vercel Analytics for analytics depending on privacy and product analytics needs.

## Product Boundaries

The app should not claim to fully secure, audit, or certify a production system.

It can:

- Recommend
- Inspect
- Generate plans
- Generate config suggestions
- Flag risks
- Produce checklists

It should not claim:

- “Your app is secure”
- “Your app is compliant”
- “This cost estimate is guaranteed”
- “This deployment will never fail”
- “This architecture is objectively best”

## Tone of Agent Responses

Responses should be direct, practical, and firm.

Use this tone:

> This app does not need Kubernetes. Use Vercel and Supabase until you have a real scaling problem.

Avoid this tone:

> There are many wonderful options you could consider depending on your preferences.

The product should save the user from indecision.

## MVP Scope

The MVP should include:

- Manual questionnaire
- GitHub repo URL input
- Basic repo analysis
- Framework detection
- Environment variable detection
- Stack recommendation
- Launch plan generation
- `.env.example` generation
- Production checklist generation
- Cost estimate table
- Markdown export

Do not build one-click deployment in the first version unless the basic planner is already excellent.

## V1 Scope

After MVP, add:

- Better repo parsing
- Pull request comments
- Config file generation
- Provider-specific setup guides
- Risk scoring
- Saved projects
- Team sharing
- Launch checklist progress tracking
- GitHub App integration
- Deployment history
- Re-run analysis after repo changes

## Future Scope

Possible later features:

- One-click deployment workflows
- Provider API integrations
- DNS verification
- Stripe webhook setup automation
- Supabase project setup automation
- Vercel project setup automation
- CI/CD generation
- Security linting
- Production readiness score
- Cost monitoring
- Stack migration guidance

Do not start here. These are later features.

## Non-Goals

Do not build:

- A generic no-code app builder
- A hosting marketplace
- A cloud pricing encyclopedia
- A Kubernetes dashboard
- A replacement for provider docs
- A full DevOps automation platform in the MVP
- A generic chatbot with no repo awareness

## Success Criteria

The product is useful when a user can say:

> I had a working prototype but no clue how to deploy it. Launch Architect told me exactly what stack to use, what to configure, what I was missing, and how to launch.

MVP success metrics:

- User completes questionnaire
- User connects or uploads a repo
- App correctly detects framework and env vars
- User receives a useful launch plan
- User exports checklist or config
- User follows the plan to deploy
- User returns for another project

## Failure Criteria

The product fails if it becomes:

- A generic ChatGPT wrapper
- A static deployment quiz
- A list of hosting providers
- A vague recommendation engine
- A tool with impressive UI but weak outputs
- A product that tells users what to use but not how to ship

## Example Final Output Structure

When generating a launch plan, use this structure:

1. Project Summary
2. Detected Stack
3. Missing Information
4. Recommended Stack
5. Alternative Stack Options
6. Required Accounts
7. Environment Variables
8. Deployment Steps
9. Database Setup
10. Auth Setup
11. Email Setup
12. Payments Setup
13. Domain and DNS Setup
14. Monitoring and Analytics
15. Cost Estimate
16. Production Risks
17. Launch Checklist
18. Rollback Plan
19. Next Actions

## Design Principle

The product should feel like a senior engineer looking at your repo and saying:

> Here is the simplest safe way to ship this. Here is what you are missing. Here is the exact order to do it. Do not overcomplicate it.
