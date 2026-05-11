import { hasService } from "@/lib/service-utils";
import type {
  ChecklistItem,
  ChecklistSection,
  RecommendationOption,
  RepoAnalysis,
  Risk
} from "@/types/planner";

export function generateChecklist(
  analysis: RepoAnalysis,
  recommendation: RecommendationOption,
  risks: Risk[]
): ChecklistSection[] {
  return [
    mustCompleteSection(risks),
    buildAndDeploySection(analysis, recommendation),
    dockerSection(analysis),
    environmentSection(analysis),
    authSection(analysis),
    databaseSection(analysis),
    paymentsSection(analysis),
    emailSection(analysis),
    storageSection(analysis),
    securitySection(analysis),
    monitoringSection(),
    analyticsSection(analysis),
    seoSection(analysis),
    legalSection(analysis),
    backupsSection(analysis),
    performanceSection(),
    rollbackSection(analysis),
    launchTestingSection(analysis)
  ];
}

function mustCompleteSection(risks: Risk[]): ChecklistSection {
  const blockers = risks.filter((risk) => risk.launchBlocker || risk.severity === "high");

  return {
    title: "Must Complete Before Launch",
    relevant: blockers.length > 0,
    items: blockers.map((risk) =>
      item(`must-${risk.id}`, `${risk.title}: ${risk.fix}`, true)
    )
  };
}

function buildAndDeploySection(
  analysis: RepoAnalysis,
  recommendation: RecommendationOption
): ChecklistSection {
  const items = [
    item(
      "provider-import",
      `${recommendation.services.hosting} is connected to the GitHub repository.`,
      true
    ),
    item("app-root", `App root is set to \`${analysis.appRoot.value}\`.`, true),
    item(
      "install-command",
      `Install command is set to \`${installCommandFor(analysis.packageManager?.value)}\`.`,
      true
    ),
    item(
      "build-command",
      `Build command is set to \`${analysis.buildCommand?.value ?? "the detected production build command"}\`.`,
      true
    ),
    item(
      "start-command",
      `Start command is set to \`${analysis.startCommand?.value ?? "the provider default for this framework"}\`.`,
      Boolean(analysis.backendFramework)
    ),
    item(
      "runtime-version",
      `Runtime version is set to \`${analysis.runtime?.value ?? "the provider default that matches the repo"}\`.`,
      true
    )
  ];

  if (analysis.frontendFramework?.value === "Vite") {
    items.push(item("output-directory", "Output directory is set to `dist`.", true));
  }

  return {
    title: "Build and Deploy",
    relevant: true,
    items
  };
}

function dockerSection(analysis: RepoAnalysis): ChecklistSection {
  const docker = analysis.docker;
  const dockerfile = docker?.dockerfiles[0];

  return {
    title: "Docker",
    relevant: Boolean(docker),
    items: dockerfile
      ? [
          item("dockerfile-path", `Dockerfile path is \`${dockerfile.path}\`.`, true),
          item(
            "docker-build-context",
            `Docker build context is \`${analysis.appRoot.value}\`.`,
            true
          ),
          item(
            "docker-port",
            `Container port is \`${dockerfile.exposedPorts[0] ?? "not detected"}\` and matches the hosting provider setting.`,
            true
          ),
          item(
            "docker-command",
            `Docker production command is \`${dockerfile.startCommand ?? "confirmed from CMD or ENTRYPOINT"}\`.`,
            true
          ),
          item(
            "dockerignore",
            "`.dockerignore` excludes `node_modules`, `.git`, env files, build output, logs, caches, and test artifacts.",
            true
          ),
          item(
            "docker-healthcheck",
            "Container health check is configured or the hosting provider has an equivalent health check.",
            false
          ),
          item(
            "docker-non-root",
            "Runtime container uses a non-root user where practical.",
            false
          )
        ]
      : [
          item(
            "compose-managed-services",
            "Compose service dependencies are mapped to managed production services.",
            true
          )
        ]
  };
}

function environmentSection(analysis: RepoAnalysis): ChecklistSection {
  const envItems = analysis.envVars.map((envVar) =>
    item(
      `env-${envVar.name.toLowerCase()}`,
      `\`${envVar.name}\` is set in the production hosting provider${envVar.exposure === "client" ? " and is safe to expose to browsers" : ""}.`,
      envVar.required
    )
  );

  return {
    title: "Environment Variables",
    relevant: envItems.length > 0,
    items: envItems
  };
}

function authSection(analysis: RepoAnalysis): ChecklistSection {
  return {
    title: "Authentication",
    relevant: hasService(analysis, "auth"),
    items: [
      item(
        "auth-secret",
        "`AUTH_SECRET`, `NEXTAUTH_SECRET`, or the provider signing secret is set in production.",
        true
      ),
      item(
        "auth-callbacks",
        "Auth callback and redirect URLs point to the production domain.",
        true
      ),
      item(
        "auth-secure-cookies",
        "Session cookies are secure for HTTPS production traffic.",
        true
      ),
      item(
        "auth-test-flow",
        "Sign-up, sign-in, sign-out, and protected-route access are tested in production or staging.",
        true
      )
    ]
  };
}

function databaseSection(analysis: RepoAnalysis): ChecklistSection {
  return {
    title: "Database",
    relevant: hasService(analysis, "database"),
    items: [
      item(
        "database-url",
        "`DATABASE_URL` or the provider-specific production database URL is set.",
        true
      ),
      item(
        "database-migrations",
        "Production migrations have been run with the detected migration tooling or a confirmed manual process.",
        true
      ),
      item("database-backups", "Automatic database backups are enabled.", true),
      item(
        "database-connection-limits",
        "Connection limits are checked for the hosting model.",
        true
      ),
      item(
        "database-restore",
        "A restore process is documented and owner access is confirmed.",
        true
      )
    ]
  };
}

function paymentsSection(analysis: RepoAnalysis): ChecklistSection {
  return {
    title: "Payments",
    relevant: hasService(analysis, "payments"),
    items: [
      item(
        "payments-live-keys",
        "Live payment provider keys are set in server-only production environment variables.",
        true
      ),
      item(
        "payments-webhook-endpoint",
        "Payment webhook endpoint is configured for the production URL.",
        true
      ),
      item(
        "payments-webhook-signature",
        "Webhook signature verification is implemented server-side.",
        true
      ),
      item(
        "payments-products",
        "Production product IDs and price IDs match the app configuration.",
        true
      ),
      item(
        "payments-test-purchase",
        "A production-safe test purchase or provider verification flow has passed.",
        true
      )
    ]
  };
}

function emailSection(analysis: RepoAnalysis): ChecklistSection {
  return {
    title: "Email",
    relevant: hasService(analysis, "email"),
    items: [
      item("email-domain", "Sender domain is verified with the email provider.", true),
      item("email-spf", "SPF record is added.", true),
      item("email-dkim", "DKIM record is added.", true),
      item("email-dmarc", "DMARC record is added.", true),
      item(
        "email-api-key",
        "Production email API key is set as a server-only variable.",
        true
      ),
      item(
        "email-test-delivery",
        "A production test email is delivered successfully.",
        true
      )
    ]
  };
}

function storageSection(analysis: RepoAnalysis): ChecklistSection {
  return {
    title: "File Storage",
    relevant: hasService(analysis, "storage"),
    items: [
      item("storage-bucket", "Production storage bucket is created.", true),
      item(
        "storage-policy",
        "Upload policy and access rules match public/private file needs.",
        true
      ),
      item("storage-max-size", "Maximum upload size is enforced.", true),
      item(
        "storage-retention",
        "Lifecycle, retention, and deletion behavior are documented.",
        false
      ),
      item(
        "storage-local-disk",
        "No production uploads depend on ephemeral local disk.",
        true
      )
    ]
  };
}

function securitySection(analysis: RepoAnalysis): ChecklistSection {
  return {
    title: "Security",
    relevant: true,
    items: [
      item("security-https", "HTTPS is active on the production domain.", true),
      item(
        "security-secret-exposure",
        "No server secrets use client-exposed env prefixes such as `NEXT_PUBLIC_`, `VITE_`, or `PUBLIC_`.",
        true
      ),
      item(
        "security-cors",
        "CORS is restricted to the required production origins.",
        true
      ),
      item(
        "security-admin-routes",
        "Admin routes are protected by server-side authorization.",
        true
      ),
      item(
        "security-rate-limiting",
        "Rate limiting or abuse protection exists for auth, payments, forms, and public APIs.",
        false
      ),
      item(
        "security-dependency-audit",
        "Dependency audit has been reviewed before launch.",
        false
      ),
      item(
        "security-secure-cookies",
        "Cookies used for sessions are secure, HTTP-only, and same-site where appropriate.",
        hasService(analysis, "auth")
      )
    ]
  };
}

function monitoringSection(): ChecklistSection {
  return {
    title: "Monitoring",
    relevant: true,
    items: [
      item(
        "monitoring-events",
        "Sentry or equivalent error monitoring receives a production test event.",
        false
      ),
      item(
        "monitoring-alerts",
        "Alert emails or notification routing are configured.",
        false
      ),
      item(
        "monitoring-release",
        "Release tracking is attached to production deploys.",
        false
      ),
      item(
        "monitoring-sourcemaps",
        "Source maps are uploaded or intentionally disabled based on risk.",
        false
      )
    ]
  };
}

function analyticsSection(analysis: RepoAnalysis): ChecklistSection {
  return {
    title: "Analytics",
    relevant: hasService(analysis, "analytics") || Boolean(analysis.frontendFramework),
    items: [
      item(
        "analytics-events",
        "Production analytics receives page views or core product events.",
        false
      ),
      item(
        "analytics-privacy",
        "Privacy settings match the app's audience and legal promises.",
        false
      ),
      item(
        "analytics-consent",
        "Cookie consent is added if required by the analytics setup or target market.",
        false
      ),
      item(
        "analytics-internal-traffic",
        "Internal traffic is excluded when the provider supports it.",
        false
      )
    ]
  };
}

function seoSection(analysis: RepoAnalysis): ChecklistSection {
  return {
    title: "SEO",
    relevant: Boolean(analysis.frontendFramework),
    items: [
      item("seo-title", "Public pages have title tags and metadata.", false),
      item(
        "seo-sitemap",
        "`sitemap.xml` exists for public marketing or content pages.",
        false
      ),
      item(
        "seo-robots",
        "`robots.txt` exists and does not block launch pages accidentally.",
        false
      ),
      item("seo-404", "404 page exists.", false),
      item("seo-500", "500/error page exists.", false),
      item("seo-canonical", "Canonical URL uses the production domain.", false),
      item("seo-social-image", "Social preview image is set for public pages.", false)
    ]
  };
}

function legalSection(analysis: RepoAnalysis): ChecklistSection {
  const relevant =
    hasService(analysis, "auth") ||
    hasService(analysis, "payments") ||
    hasService(analysis, "email") ||
    hasService(analysis, "analytics");

  return {
    title: "Legal Pages",
    relevant,
    items: [
      item(
        "legal-privacy",
        "Privacy policy exists for apps collecting user data or analytics.",
        true
      ),
      item(
        "legal-terms",
        "Terms of service exist for accounts, SaaS, marketplaces, or paid products.",
        hasService(analysis, "payments")
      ),
      item(
        "legal-cookie",
        "Cookie notice exists if cookies or consent-requiring analytics are used.",
        false
      ),
      item("legal-contact", "Support or contact email is visible.", false),
      item(
        "legal-refund",
        "Refund policy exists for paid products.",
        hasService(analysis, "payments")
      )
    ]
  };
}

function backupsSection(analysis: RepoAnalysis): ChecklistSection {
  return {
    title: "Backups",
    relevant: hasService(analysis, "database") || hasService(analysis, "storage"),
    items: [
      item(
        "backups-automatic",
        "Automatic backups are enabled for production data.",
        true
      ),
      item("backups-retention", "Backup retention period is documented.", true),
      item("backups-restore", "Restore process has been tested or rehearsed.", true),
      item("backups-owner", "Project owner has access to restore backups.", true)
    ]
  };
}

function performanceSection(): ChecklistSection {
  return {
    title: "Performance",
    relevant: true,
    items: [
      item(
        "performance-build-size",
        "Production build size is reviewed for obvious bloat.",
        false
      ),
      item("performance-images", "Images are optimized for public pages.", false),
      item(
        "performance-caching",
        "Caching headers or provider defaults are understood.",
        false
      ),
      item(
        "performance-cold-starts",
        "Cold start risk is checked for serverless routes or container services.",
        false
      ),
      item(
        "performance-key-pages",
        "Key pages and core workflows load acceptably on mobile and desktop.",
        true
      )
    ]
  };
}

function rollbackSection(analysis: RepoAnalysis): ChecklistSection {
  return {
    title: "Rollback",
    relevant: true,
    items: [
      item(
        "rollback-previous-deploy",
        "Previous production deployment is available for redeploy.",
        true
      ),
      item(
        "rollback-migrations",
        "Database migrations are reversible or backed by a pre-launch backup.",
        hasService(analysis, "database")
      ),
      item(
        "rollback-backup-before-launch",
        "Database backup is taken immediately before launch if production data exists.",
        hasService(analysis, "database")
      ),
      item(
        "rollback-owner-permissions",
        "Owner has permission to redeploy, revert, and restore.",
        true
      )
    ]
  };
}

function launchTestingSection(analysis: RepoAnalysis): ChecklistSection {
  return {
    title: "Launch Testing",
    relevant: true,
    items: [
      item(
        "launch-signup",
        "Sign-up works if authentication exists.",
        hasService(analysis, "auth")
      ),
      item(
        "launch-signin",
        "Sign-in and sign-out work if authentication exists.",
        hasService(analysis, "auth")
      ),
      item(
        "launch-core-workflow",
        "The app's core user workflow works on the production domain.",
        true
      ),
      item(
        "launch-payment",
        "Payment flow works if payments exist.",
        hasService(analysis, "payments")
      ),
      item(
        "launch-email",
        "Email delivery works if email exists.",
        hasService(analysis, "email")
      ),
      item(
        "launch-upload",
        "File upload works if storage exists.",
        hasService(analysis, "storage")
      ),
      item("launch-mobile", "Mobile viewport is usable.", true),
      item(
        "launch-links",
        "No obvious broken links on public pages.",
        Boolean(analysis.frontendFramework)
      )
    ]
  };
}

function item(id: string, text: string, requiredBeforeLaunch: boolean): ChecklistItem {
  return {
    id,
    text,
    requiredBeforeLaunch
  };
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
