import type { RepoAnalysis, Risk } from "@/types/planner";
import { isLikelySecret } from "@/features/repo-analysis/env-detection";
import { hasService } from "@/lib/service-utils";

const SEVERITY_ORDER = {
  high: 0,
  medium: 1,
  low: 2,
  info: 3
};

export function reviewRisks(analysis: RepoAnalysis): Risk[] {
  const risks: Risk[] = [];
  const envNames = new Set(analysis.envVars.map((envVar) => envVar.name));
  const hasAuth = hasService(analysis, "auth");
  const hasDatabase = hasService(analysis, "database");
  const hasPayments = hasService(analysis, "payments");
  const hasMonitoring = hasService(analysis, "monitoring");
  const hasEmail = hasService(analysis, "email");

  const usedRiskIds = new Set<string>();

  function addRisk(risk: Risk) {
    if (usedRiskIds.has(risk.id)) return;
    usedRiskIds.add(risk.id);
    risks.push(risk);
  }

  for (const envVar of analysis.envVars) {
    if (envVar.exposure === "client" && isLikelySecret(envVar.name)) {
      addRisk({
        id: `client-secret-${envVar.name.toLowerCase()}`,
        severity: "high",
        category: "security",
        title: `Client-exposed secret-looking variable: ${envVar.name}`,
        description:
          "This variable uses a public frontend prefix but looks like a secret. Client-exposed secrets are visible to users.",
        fix: "Move the secret to a server-only environment variable and expose only a safe public identifier if needed.",
        source: "detected",
        confidence: envVar.confidence,
        evidence: envVar.evidence,
        launchBlocker: true
      });
    }
  }

  if (
    hasAuth &&
    !hasAny(envNames, ["AUTH_SECRET", "NEXTAUTH_SECRET", "SESSION_SECRET"])
  ) {
    addRisk({
      id: "missing-auth-secret",
      severity: "high",
      category: "auth",
      title: "Missing production auth secret",
      description:
        "Auth is detected, but no auth/session signing secret was found. Do not launch user accounts until this is configured.",
      fix: "Add a strong production auth secret such as AUTH_SECRET or the provider-specific equivalent.",
      source: "inferred",
      confidence: "medium",
      launchBlocker: true
    });
  }

  if (hasDatabase && !envNames.has("DATABASE_URL")) {
    addRisk({
      id: "missing-database-url",
      severity: "high",
      category: "database",
      title: "Missing production database URL",
      description:
        "A database is detected, but DATABASE_URL was not found. Do not launch a database-backed app until production connection settings are explicit.",
      fix: "Add DATABASE_URL to the env example and configure it in the hosting provider.",
      source: "inferred",
      confidence: "medium",
      launchBlocker: true
    });
  }

  if (hasPayments && !envNames.has("STRIPE_WEBHOOK_SECRET")) {
    addRisk({
      id: "missing-stripe-webhook-secret",
      severity: "high",
      category: "payments",
      title: "Stripe webhook verification is not configured",
      description:
        "Payments are detected, but no Stripe webhook secret was found. Do not launch paid plans until webhooks are verified server-side.",
      fix: "Create the production Stripe webhook endpoint, add STRIPE_WEBHOOK_SECRET, and verify webhook signatures in server code.",
      source: "inferred",
      confidence: "medium",
      launchBlocker: true
    });
  }

  if (hasDatabase) {
    addRisk({
      id: "confirm-database-backups",
      severity: "medium",
      category: "database",
      title: "Database backup strategy needs confirmation",
      description:
        "A database is detected. The launch plan must confirm automatic backups and a restore path before production traffic.",
      fix: "Enable managed database backups, record the retention period, and run a restore rehearsal for production-critical data.",
      source: "inferred",
      confidence: "medium",
      launchBlocker: false
    });
  }

  if (!hasMonitoring) {
    addRisk({
      id: "missing-error-monitoring",
      severity: "medium",
      category: "monitoring",
      title: "No error monitoring detected",
      description:
        "The app can still launch, but production failures will be harder to notice and debug.",
      fix: "Add Sentry or an equivalent error monitoring provider and verify a test event after deployment.",
      source: "inferred",
      confidence: "medium",
      launchBlocker: false
    });
  }

  if (hasDatabase && !analysis.envVars.some((v) => /MIGRAT/i.test(v.name))) {
    addRisk({
      id: "missing-migration-strategy",
      severity: "medium",
      category: "database",
      title: "Database migration strategy not confirmed",
      description:
        "A database is detected but no migration-related environment variable or tooling was found. Skipping migrations can cause schema drift.",
      fix: "Confirm the migration tool, run `prisma migrate deploy`, `drizzle-kit migrate`, or equivalent before production traffic.",
      source: "inferred",
      confidence: "medium",
      launchBlocker: false
    });
  }

  if (!hasAny(envNames, ["RATE_LIMIT", "RATE_LIMITING", "UPSTASH_REDIS_REST_URL"])) {
    addRisk({
      id: "missing-rate-limiting",
      severity: "low",
      category: "security",
      title: "Rate limiting may not be configured",
      description:
        "No rate-limiting env vars or tokens were detected. Unprotected auth routes, forms, or APIs can be abused.",
      fix: "Add rate limiting with Upstash, provider edge middleware, or a framework middleware layer.",
      source: "inferred",
      confidence: "low",
      launchBlocker: false
    });
  }

  if (hasEmail && !hasAny(envNames, ["RESEND_API_KEY", "POSTMARK_API_KEY", "SENDGRID_API_KEY", "MAILGUN_API_KEY", "SMTP_HOST"])) {
    addRisk({
      id: "missing-email-authentication",
      severity: "high",
      category: "email",
      title: "Email domain authentication may not be configured",
      description:
        "Email sending is detected but no production email API key or SMTP credentials were found. Emails may not deliver or may land in spam.",
      fix: "Add the email provider API key, verify the sending domain, and add SPF, DKIM, and DMARC records.",
      source: "inferred",
      confidence: "medium",
      launchBlocker: true
    });
  }

  addRisk({
    id: "verify-https-plan",
    severity: "medium",
    category: "security",
    title: "HTTPS plan should be verified",
    description:
      "HTTPS should be active on the production domain. Most modern hosting providers enable this automatically, but it should be confirmed before launch.",
    fix: "Confirm the hosting provider auto-provisions HTTPS. If using a custom domain, verify the TLS certificate is active on the production URL.",
    source: "inferred",
    confidence: "medium",
    launchBlocker: false
  });

  if (
    analysis.envVars.some((v) =>
      /CORS/i.test(v.name) && v.exposure !== "server"
    )
  ) {
    addRisk({
      id: "insecure-cors",
      severity: "high",
      category: "security",
      title: "CORS may expose the API to unauthorized origins",
      description:
        "CORS is referenced but may be configured to allow broad or client-exposed origins.",
      fix: "Restrict CORS to the specific production domain in server-side configuration.",
      source: "inferred",
      confidence: "low",
      launchBlocker: false
    });
  }

  if (analysis.envVars.length > 0) {
    const requiredNotSet = analysis.envVars.filter(
      (v) => v.required && (v.source === "detected" || v.source === "inferred")
    );

    if (requiredNotSet.length > 0) {
      addRisk({
        id: "missing-required-env-vars",
        severity: "high",
        category: "env",
        title: `${requiredNotSet.length} required environment variables need production values`,
        description: `Required env vars that need production values: ${requiredNotSet.map((v) => `\`${v.name}\``).join(", ")}.`,
        fix: `Set each required env var in the hosting provider's production environment: ${requiredNotSet.map((v) => v.name).join(", ")}.`,
        source: "detected",
        confidence: "high",
        evidence: requiredNotSet.flatMap((v) => v.evidence),
        launchBlocker: false
      });
    }
  }

  if (hasPayments) {
    addRisk({
      id: "missing-terms-of-service",
      severity: "medium",
      category: "legal",
      title: "Terms of service may be needed for paid products",
      description:
        "Payments are detected. Most jurisdictions require terms of service and a refund policy for paid products.",
      fix: "Add terms of service and a refund policy page before launching paid plans.",
      source: "inferred",
      confidence: "medium",
      launchBlocker: false
    });
  }

  if (hasAuth) {
    addRisk({
      id: "missing-privacy-policy",
      severity: "medium",
      category: "legal",
      title: "Privacy policy may be needed for user accounts",
      description:
        "User accounts are detected. Most apps collecting personal data need a privacy policy.",
      fix: "Add a privacy policy page explaining data collection, storage, and sharing practices.",
      source: "inferred",
      confidence: "medium",
      launchBlocker: false
    });
  }

  addRisk({
    id: "confirm-rollback-plan",
    severity: "info",
    category: "operations",
    title: "Rollback plan should be documented",
    description:
      "A clear rollback plan is recommended before the first production launch.",
    fix: "Document how to redeploy the previous version, revert a commit, or restore a database backup.",
    source: "inferred",
    confidence: "medium",
    launchBlocker: false
  });

  const docker = analysis.docker;
  if (docker) {
    if (!docker.hasDockerignore) {
      addRisk({
        id: "docker-missing-dockerignore",
        severity: "medium",
        category: "deployment",
        title: "Missing .dockerignore may bloat the production image",
        description:
          "No `.dockerignore` was found. The Docker build may copy `node_modules`, `.git`, and local env files into the production image.",
        fix: "Add a `.dockerignore` that excludes `node_modules`, `.git`, local env files, build output, logs, caches, and test artifacts.",
        source: "inferred",
        confidence: "medium",
        launchBlocker: false
      });
    }

    for (const dockerfile of docker.dockerfiles) {
      if (dockerfile.user === undefined || dockerfile.user === "root") {
        addRisk({
          id: `docker-root-user-${dockerfile.path}`,
          severity: "low",
          category: "deployment",
          title: `Docker container runs as root in ${dockerfile.path}`,
          description:
            "Containers running as root are a security risk in production.",
          fix: "Add a `USER` directive in the Dockerfile to run as a non-root user.",
          source: "detected",
          confidence: "high",
          evidence: [
            {
              path: dockerfile.path,
              detail: dockerfile.user === undefined
                ? "No USER directive found"
                : "USER is set to root"
            }
          ],
          launchBlocker: false
        });
      }

      if (!dockerfile.healthcheck) {
        addRisk({
          id: `docker-missing-healthcheck-${dockerfile.path}`,
          severity: "low",
          category: "deployment",
          title: `Dockerfile ${dockerfile.path} has no health check`,
          description:
            "The production container may not be automatically restarted if it becomes unhealthy.",
          fix: "Add a HEALTHCHECK instruction to the Dockerfile pointing to the app's health endpoint.",
          source: "detected",
          confidence: "high",
          evidence: [
            {
              path: dockerfile.path,
              detail: "No HEALTHCHECK instruction found"
            }
          ],
          launchBlocker: false
        });
      }

      if (dockerfile.exposedPorts.length === 0) {
        addRisk({
          id: `docker-ambiguous-port-${dockerfile.path}`,
          severity: "medium",
          category: "deployment",
          title: `Dockerfile ${dockerfile.path} does not expose a port`,
          description:
            "The production Dockerfile has no EXPOSE directive, which may cause port mapping issues on container platforms.",
          fix: "Add an `EXPOSE` directive with the port the app listens on.",
          source: "detected",
          confidence: "high",
          evidence: [
            {
              path: dockerfile.path,
              detail: "No EXPOSE port found"
            }
          ],
          launchBlocker: false
        });
      }
    }

    for (const compose of docker.composeFiles) {
      for (const service of compose.services) {
        if (service.volumes.length > 0) {
          addRisk({
            id: `compose-local-storage-${service.name}`,
            severity: "info",
            category: "deployment",
            title: `Docker Compose service "${service.name}" uses local volumes for persistence`,
            description:
              "Local volumes are not reliable for production. Data is tied to the host machine and lost on container migration.",
            fix: "Replace local Compose volumes with managed storage services for production.",
            source: "detected",
            confidence: "high",
            evidence: [
              {
                path: compose.path,
                detail: `Service "${service.name}" uses local volumes`
              }
            ],
            launchBlocker: false
          });
        }
      }
    }
  }

  return risks.sort(
    (left, right) => SEVERITY_ORDER[left.severity] - SEVERITY_ORDER[right.severity]
  );
}

function hasAny(values: Set<string>, candidates: string[]) {
  return candidates.some((candidate) => values.has(candidate));
}
