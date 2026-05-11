import { hasService, serviceName } from "@/lib/service-utils";
import type {
  ChecklistSection,
  CostEstimate,
  LaunchPlan,
  ProjectIntake,
  RecommendationOption,
  RepoAnalysis,
  Risk
} from "@/types/planner";

const SECTION_ORDER = [
  "Project Summary",
  "Detected Stack",
  "Missing Information",
  "Recommended Stack",
  "Alternative Stack Options",
  "Required Accounts",
  "Environment Variables",
  "Deployment Steps",
  "Database Setup",
  "Auth Setup",
  "Email Setup",
  "Payments Setup",
  "Domain and DNS Setup",
  "Monitoring and Analytics",
  "Cost Estimate",
  "Production Risks",
  "Launch Checklist",
  "Rollback Plan",
  "Next Actions"
];

export function generateLaunchPlan(input: {
  analysis: RepoAnalysis;
  intake?: ProjectIntake;
  recommendation: RecommendationOption;
  alternatives: RecommendationOption[];
  risks: Risk[];
  costs: CostEstimate;
  checklist: ChecklistSection[];
  generatedAt?: string;
}): LaunchPlan {
  const generatedAt = input.generatedAt ?? new Date().toISOString();
  const sections = SECTION_ORDER.map((title) => ({
    title,
    body: renderSection(title, input)
  }));
  const markdown = sections
    .map((section) => `## ${section.title}\n\n${section.body}`)
    .join("\n\n");

  return {
    projectName: input.analysis.projectName.value,
    generatedAt,
    sections,
    markdown
  };
}

function renderSection(
  title: string,
  input: {
    analysis: RepoAnalysis;
    intake?: ProjectIntake;
    recommendation: RecommendationOption;
    alternatives: RecommendationOption[];
    risks: Risk[];
    costs: CostEstimate;
    checklist: ChecklistSection[];
  }
) {
  switch (title) {
    case "Project Summary":
      return renderProjectSummary(input.analysis, input.intake);
    case "Detected Stack":
      return renderDetectedStack(input.analysis);
    case "Missing Information":
      return renderMissingInformation(input.analysis, input.intake);
    case "Recommended Stack":
      return renderRecommendation(input.recommendation);
    case "Alternative Stack Options":
      return input.alternatives.length > 0
        ? input.alternatives.map(renderRecommendation).join("\n\n")
        : "No alternative stack is needed for this project shape.";
    case "Required Accounts":
      return renderRequiredAccounts(input.recommendation);
    case "Environment Variables":
      return renderEnvironmentVariables(input.analysis);
    case "Deployment Steps":
      return renderDeploymentSteps(input.analysis, input.recommendation);
    case "Database Setup":
      return renderDatabaseSetup(input.analysis, input.recommendation);
    case "Auth Setup":
      return renderAuthSetup(input.analysis);
    case "Email Setup":
      return renderEmailSetup(input.analysis);
    case "Payments Setup":
      return renderPaymentsSetup(input.analysis);
    case "Domain and DNS Setup":
      return renderDomainSetup(input.analysis, input.recommendation);
    case "Monitoring and Analytics":
      return renderMonitoringSetup(input.analysis, input.recommendation);
    case "Cost Estimate":
      return renderCostEstimate(input.costs);
    case "Production Risks":
      return renderRisks(input.risks);
    case "Launch Checklist":
      return input.checklist.map(renderChecklistSection).join("\n\n");
    case "Rollback Plan":
      return renderRollbackPlan(input.analysis);
    case "Next Actions":
      return renderNextActions(input.risks);
    default:
      return "";
  }
}

function renderProjectSummary(analysis: RepoAnalysis, intake?: ProjectIntake) {
  return [
    `${analysis.projectName.value} is being prepared for production deployment.`,
    `The primary goal is: turn this AI-built prototype into a concrete production deployment plan.`,
    `Detected facts, inferred facts, user-provided answers, unknowns, and risks must stay labeled. This plan is not a security certification, compliance audit, or pricing quote.`,
    intake ? `Top priority: ${intake.priority}. Budget range: ${intake.budget}.` : ""
  ]
    .filter(Boolean)
    .join("\n\n");
}

function renderDetectedStack(analysis: RepoAnalysis) {
  return [
    `- App root: ${factValue(analysis.appRoot.value, analysis.appRoot.source, analysis.appRoot.confidence)}`,
    `- Frontend framework: ${factValue(analysis.frontendFramework?.value)}`,
    `- Backend framework: ${factValue(analysis.backendFramework?.value)}`,
    `- Package manager: ${factValue(analysis.packageManager?.value)}`,
    `- Runtime: ${factValue(analysis.runtime?.value)}`,
    `- Build command: ${factValue(analysis.buildCommand?.value)}`,
    `- Start command: ${factValue(analysis.startCommand?.value)}`,
    `- Monorepo: ${analysis.isMonorepo ? factValue(String(analysis.isMonorepo.value)) : "unknown"}`,
    "",
    renderDetectedServices(analysis),
    renderDockerSummary(analysis)
  ]
    .filter(Boolean)
    .join("\n");
}

function renderMissingInformation(analysis: RepoAnalysis, intake?: ProjectIntake) {
  const missing: string[] = [];

  if (!analysis.frontendFramework) missing.push("frontend framework");
  if (!analysis.packageManager) missing.push("package manager");
  if (!analysis.buildCommand) missing.push("production build command");
  if (analysis.backendFramework && !analysis.startCommand) {
    missing.push("production start command");
  }

  if (!intake) {
    missing.push(
      "traffic expectation",
      "monthly budget",
      "custom domain requirement",
      "compliance or data residency requirement"
    );
  } else {
    for (const [field, label] of [
      ["traffic", "traffic expectation"],
      ["budget", "monthly budget"],
      ["priority", "top priority"],
      ["comfort", "technical comfort level"],
      ["domainStatus", "domain ownership"],
      ["compliance", "compliance or data residency requirement"]
    ] as const) {
      if (intake.sources[field] !== "user_provided") {
        missing.push(label);
      }
    }
  }

  if (missing.length === 0) {
    return "No critical launch-planning inputs are currently missing. Re-check provider pricing and dashboard settings before purchase.";
  }

  return `Confirm these before treating the plan as final: ${[...new Set(missing)].join(", ")}.`;
}

function renderRecommendation(recommendation: RecommendationOption) {
  return [
    `### ${recommendation.label}`,
    recommendation.summary,
    "",
    `Why this is recommended: ${recommendation.why}`,
    "",
    `Estimated monthly cost: ${recommendation.estimatedMonthlyCost}`,
    "",
    "| Area | Recommendation |",
    "| --- | --- |",
    `| Hosting | ${recommendation.services.hosting} |`,
    `| Backend/API hosting | ${recommendation.services.backend} |`,
    `| Database | ${recommendation.services.database} |`,
    `| Auth | ${recommendation.services.auth} |`,
    `| File storage | ${recommendation.services.storage} |`,
    `| Email | ${recommendation.services.email} |`,
    `| Payments | ${recommendation.services.payments} |`,
    `| Analytics | ${recommendation.services.analytics} |`,
    `| Error monitoring | ${recommendation.services.monitoring} |`,
    `| CI/CD | ${recommendation.services.ciCd} |`,
    `| Domain/DNS | ${recommendation.services.dns} |`,
    "",
    "Tradeoffs:",
    ...recommendation.tradeoffs.map((tradeoff) => `- ${tradeoff}`),
    "",
    `When not to choose this: ${recommendation.whenNotToChoose}`
  ].join("\n");
}

function renderRequiredAccounts(recommendation: RecommendationOption) {
  const accounts = [
    recommendation.services.hosting,
    recommendation.services.database,
    recommendation.services.auth,
    recommendation.services.storage,
    recommendation.services.email,
    recommendation.services.payments,
    recommendation.services.analytics,
    recommendation.services.monitoring,
    "GitHub repository access",
    "Domain registrar or DNS provider"
  ]
    .filter((value) => value && !/^Not needed/i.test(value))
    .map((value) => value.replace(/ if .+$/i, ""))
    .map((value) => value.split(" or ")[0])
    .map((value) => value.split(",")[0]);

  return [...new Set(accounts)].map((account) => `- ${account}`).join("\n");
}

function renderEnvironmentVariables(analysis: RepoAnalysis) {
  if (analysis.envVars.length === 0) {
    return "No environment variables were detected. Confirm this manually before launch; most production apps need at least an app URL, auth secret, or provider keys.";
  }

  return [
    "| Variable | Required | Exposure | Purpose |",
    "| --- | --- | --- | --- |",
    ...analysis.envVars.map(
      (envVar) =>
        `| ${envVar.name} | ${envVar.required ? "Yes" : "No"} | ${envVar.exposure} | ${envVar.description} |`
    ),
    "",
    "Add required server-only values in the hosting provider's production environment settings. Do not put server secrets in `NEXT_PUBLIC_`, `VITE_`, `PUBLIC_`, or similar client-exposed variables."
  ].join("\n");
}

function renderDeploymentSteps(
  analysis: RepoAnalysis,
  recommendation: RecommendationOption
) {
  const installCommand = installCommandFor(analysis.packageManager?.value);
  const steps = [
    `1. In ${recommendation.services.hosting}, import the GitHub repository.`,
    `2. Set the app root to \`${analysis.appRoot.value}\`.`,
    `3. Set the install command to \`${installCommand}\`.`,
    `4. Set the build command to \`${analysis.buildCommand?.value ?? "the detected framework default"}\`.`,
    `5. Set the start command to \`${analysis.startCommand?.value ?? "the provider default for this framework"}\`.`,
    `6. Set the runtime to \`${analysis.runtime?.value ?? "the provider default that matches the repo"}\`.`,
    "7. Add required production environment variables from the Environment Variables section.",
    "8. Deploy a preview build and run the Launch Checklist before promoting production traffic."
  ];

  if (analysis.frontendFramework?.value === "Vite") {
    steps.splice(
      5,
      0,
      "6. Set the output directory to `dist` unless the repo config says otherwise."
    );
  }

  if (shouldIncludeDockerCommands(analysis, recommendation)) {
    steps.push("", renderDockerCommands(analysis));
  }

  return steps.join("\n");
}

function renderDatabaseSetup(
  analysis: RepoAnalysis,
  recommendation: RecommendationOption
) {
  if (
    !hasService(analysis, "database") &&
    /Not needed/i.test(recommendation.services.database)
  ) {
    return "No production database is required for the detected project shape.";
  }

  const migrations = migrationCommand(analysis);

  return [
    `1. Create the production database in ${recommendation.services.database}.`,
    "2. Copy the production connection string into the hosting provider as `DATABASE_URL` or the provider-specific equivalent.",
    migrations
      ? `3. Run migrations with \`${migrations}\` before sending production traffic.`
      : "3. Confirm the migration command or schema setup step; it was not detected with high confidence.",
    "4. Enable automatic backups, record the retention period, and verify who can restore the database.",
    "5. Check connection limits before launch, especially for serverless deployments."
  ].join("\n");
}

function renderAuthSetup(analysis: RepoAnalysis) {
  if (!hasService(analysis, "auth")) {
    return "No auth provider was detected. If the app has user accounts, add auth setup before launch.";
  }

  return [
    `Detected auth: ${serviceName(analysis, "auth", "Unknown auth provider")}.`,
    "1. Set a strong production auth/session secret such as `AUTH_SECRET`, `NEXTAUTH_SECRET`, or the provider equivalent.",
    "2. Add production callback and redirect URLs using the final production domain.",
    "3. Confirm secure cookies are enabled for HTTPS production traffic.",
    "4. Test sign-up, sign-in, sign-out, password reset or magic links, and blocked access to private pages."
  ].join("\n");
}

function renderEmailSetup(analysis: RepoAnalysis) {
  if (!hasService(analysis, "email")) {
    return "No transactional email provider was detected. Skip this unless the app sends login, invite, receipt, or notification emails.";
  }

  return [
    `Detected email provider: ${serviceName(analysis, "email", "Unknown email provider")}.`,
    "1. Verify the sender domain in the email provider.",
    "2. Add SPF, DKIM, and DMARC DNS records from the provider.",
    "3. Add the production email API key as a server-only environment variable.",
    "4. Send a production test email to confirm delivery and sender reputation."
  ].join("\n");
}

function renderPaymentsSetup(analysis: RepoAnalysis) {
  if (!hasService(analysis, "payments")) {
    return "No payment provider was detected. Skip this unless the app will charge users.";
  }

  return [
    `Detected payments provider: ${serviceName(analysis, "payments", "Stripe")}.`,
    "1. Create live products and prices in Stripe or the detected payment provider.",
    "2. Add live server-side API keys in production environment variables.",
    "3. Configure the production webhook endpoint, for example `https://YOUR_DOMAIN/api/webhooks/stripe`.",
    "4. Add the webhook signing secret such as `STRIPE_WEBHOOK_SECRET`.",
    "5. Verify webhook signatures server-side before granting paid access.",
    "6. Run a live-mode test purchase or provider-supported production verification flow before launch."
  ].join("\n");
}

function renderDomainSetup(analysis: RepoAnalysis, recommendation: RecommendationOption) {
  const appUrlVariable = analysis.envVars.find((envVar) =>
    /(APP_URL|SITE_URL|PUBLIC_URL|NEXTAUTH_URL|AUTH_URL|WEBHOOK)/.test(envVar.name)
  );

  return [
    `1. Add the custom domain in ${recommendation.services.hosting}.`,
    "2. At the DNS provider, add the provider-supplied `A`, `AAAA`, `CNAME`, or nameserver records.",
    "3. Wait for HTTPS certificate provisioning before switching real users.",
    appUrlVariable
      ? `4. Set \`${appUrlVariable.name}\` to the final production URL.`
      : "4. Set any app URL, auth URL, and webhook base URL variables to the final production URL.",
    "5. Update auth callback URLs, email links, and payment webhook URLs to use the production domain."
  ].join("\n");
}

function renderMonitoringSetup(
  analysis: RepoAnalysis,
  recommendation: RecommendationOption
) {
  return [
    `Error monitoring: ${recommendation.services.monitoring}.`,
    `Analytics: ${recommendation.services.analytics}.`,
    "1. Add monitoring and analytics keys as production environment variables.",
    "2. Deploy with source maps when the framework and monitoring provider support them.",
    "3. Trigger one test error in production or staging and confirm it appears in monitoring.",
    "4. Trigger one real product or page-view event and confirm analytics receives it.",
    hasService(analysis, "payments")
      ? "5. Add alerts for failed payment webhooks and checkout errors."
      : "5. Add alert emails for production exceptions."
  ].join("\n");
}

function renderCostEstimate(costs: CostEstimate) {
  return [
    costs.caveat,
    "",
    "| Usage tier | Monthly range | Assumptions |",
    "| --- | --- | --- |",
    ...costs.tiers.map(
      (tier) => `| ${tier.label} | ${tier.monthlyRange} | ${tier.assumptions.join(" ")} |`
    ),
    "",
    "Verify provider pricing before purchase. Free tiers are useful for prototypes, not guaranteed production capacity."
  ].join("\n");
}

function renderRisks(risks: Risk[]) {
  if (risks.length === 0) {
    return "No launch-blocking risks were detected. Still run the checklist before production.";
  }

  const blockers = risks.filter((risk) => risk.launchBlocker);

  return [
    blockers.length > 0
      ? [
          "Do not launch until these are fixed:",
          ...blockers.map((risk) => `- ${risk.title}`)
        ].join("\n")
      : "No launch blockers were detected.",
    "",
    ...risks.map(
      (risk) =>
        `- ${risk.severity.toUpperCase()} (${risk.category}): ${risk.title}. ${risk.fix}`
    )
  ].join("\n");
}

function renderChecklistSection(section: ChecklistSection) {
  if (!section.relevant) {
    return `### ${section.title}\n\n_Not relevant for this detected project shape._`;
  }

  return [
    `### ${section.title}`,
    "",
    ...section.items.map((item) => `- [ ] ${item.text}`)
  ].join("\n");
}

function renderRollbackPlan(analysis: RepoAnalysis) {
  const backupStep = hasService(analysis, "database")
    ? "Take a database backup immediately before launch or before any irreversible migration."
    : "No database rollback step was detected, but keep the previous deployment available.";

  return [
    "1. Keep the previous production deployment available in the hosting provider.",
    "2. If launch fails, redeploy the previous build or revert the launch commit.",
    `3. ${backupStep}`,
    "4. For database-backed apps, avoid irreversible migrations during the first launch unless a restore path is tested.",
    "5. Confirm the project owner has permission to redeploy, roll back, and restore backups."
  ].join("\n");
}

function renderNextActions(risks: Risk[]) {
  const blockers = risks.filter((risk) => risk.launchBlocker);

  if (blockers.length > 0) {
    return [
      "1. Fix the launch blockers listed in Production Risks.",
      "2. Re-run repo analysis and regenerate this plan.",
      "3. Complete the must-finish checklist items.",
      "4. Deploy preview, test the core workflow, then promote production."
    ].join("\n");
  }

  return [
    "1. Confirm missing business inputs and provider account access.",
    "2. Create required provider accounts and production environment variables.",
    "3. Deploy preview and run the launch checklist.",
    "4. Promote production traffic only after monitoring, rollback, and domain checks pass."
  ].join("\n");
}

function renderDetectedServices(analysis: RepoAnalysis) {
  if (analysis.services.length === 0) {
    return "- Services: none detected yet";
  }

  return [
    "- Services:",
    ...analysis.services.map(
      (service) => `  - ${service.category}: ${service.name} (${service.confidence})`
    )
  ].join("\n");
}

function renderDockerSummary(analysis: RepoAnalysis) {
  if (!analysis.docker) {
    return "";
  }

  return [
    "- Docker:",
    `  - Recommendation: ${analysis.docker.recommendation}`,
    `  - Dockerfiles: ${analysis.docker.dockerfiles.map((file) => file.path).join(", ") || "none"}`,
    `  - Compose files: ${analysis.docker.composeFiles.map((file) => file.path).join(", ") || "none"}`,
    analysis.docker.serviceDependencies.length > 0
      ? `  - Compose dependencies: ${analysis.docker.serviceDependencies.join(", ")}`
      : ""
  ]
    .filter(Boolean)
    .join("\n");
}

function shouldIncludeDockerCommands(
  analysis: RepoAnalysis,
  recommendation: RecommendationOption
) {
  if (!analysis.docker || analysis.docker.dockerfiles.length === 0) {
    return false;
  }

  return /docker|container|fly|render|railway/i.test(
    `${recommendation.services.hosting} ${recommendation.services.backend}`
  );
}

function renderDockerCommands(analysis: RepoAnalysis) {
  const dockerfile = analysis.docker?.dockerfiles[0];
  if (!dockerfile) return "";

  const port = dockerfile.exposedPorts[0] ?? "3000";
  const imageName = slug(analysis.projectName.value);
  const composeFile = analysis.docker?.composeFiles[0];

  return [
    "Docker settings:",
    `- Dockerfile path: \`${dockerfile.path}\``,
    `- Build context: \`${analysis.appRoot.value}\``,
    `- Exposed port: \`${port}\``,
    `- Start command: \`${dockerfile.startCommand ?? "confirm from Dockerfile CMD or ENTRYPOINT"}\``,
    `- Health check: \`${dockerfile.healthcheck ?? "not detected"}\``,
    dockerfile.buildArgs.length > 0
      ? `- Required build args: ${dockerfile.buildArgs.map((arg) => `\`${arg}\``).join(", ")}`
      : "- Required build args: none detected",
    "",
    "Docker commands:",
    "```bash",
    `docker build -f ${dockerfile.path} -t ${imageName} ${analysis.appRoot.value}`,
    `docker run --env-file .env -p ${port}:${port} ${imageName}`,
    composeFile ? `docker compose -f ${composeFile.path} up --build` : "",
    "```",
    analysis.docker?.probablyLocalOnly
      ? "Treat Compose databases or queues as local development defaults. Use managed production services unless you intentionally self-host."
      : ""
  ]
    .filter((line) => line !== "")
    .join("\n");
}

function migrationCommand(analysis: RepoAnalysis) {
  if (analysis.services.some((service) => service.name === "Prisma")) {
    return `${analysis.packageManager?.value === "pnpm" ? "pnpm" : "npx"} prisma migrate deploy`;
  }

  if (analysis.services.some((service) => service.name === "Drizzle")) {
    return `${analysis.packageManager?.value === "pnpm" ? "pnpm" : "npx"} drizzle-kit migrate`;
  }

  if (analysis.services.some((service) => service.name === "Django ORM")) {
    return "python manage.py migrate";
  }

  return undefined;
}

function installCommandFor(packageManager?: string) {
  if (packageManager === "pnpm") return "pnpm install";
  if (packageManager === "yarn") return "yarn install --frozen-lockfile";
  if (packageManager === "bun") return "bun install";
  if (packageManager === "pip") return "pip install -r requirements.txt";
  if (packageManager === "poetry") return "poetry install";
  if (packageManager === "uv") return "uv sync";
  if (packageManager === "go") return "go mod download";
  if (packageManager === "bundler") return "bundle install";
  if (packageManager === "composer") return "composer install --no-dev";
  return "npm ci";
}

function factValue(value?: string, source?: string, confidence?: string) {
  if (!value) return "unknown";
  if (!source || !confidence) return value;
  return `${value} (${source}, ${confidence})`;
}

function slug(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
