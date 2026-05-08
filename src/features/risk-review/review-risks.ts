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

  for (const envVar of analysis.envVars) {
    if (envVar.exposure === "client" && isLikelySecret(envVar.name)) {
      risks.push({
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
    risks.push({
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
    risks.push({
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
    risks.push({
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
    risks.push({
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
    risks.push({
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

  return risks.sort(
    (left, right) => SEVERITY_ORDER[left.severity] - SEVERITY_ORDER[right.severity]
  );
}

function hasAny(values: Set<string>, candidates: string[]) {
  return candidates.some((candidate) => values.has(candidate));
}
