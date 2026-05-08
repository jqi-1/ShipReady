import type { ProjectIntake, RecommendationOption, RepoAnalysis } from "@/types/planner";
import { hasService, serviceName } from "@/lib/service-utils";

export function buildRecommendationOptions(
  analysis: RepoAnalysis,
  intake?: Partial<ProjectIntake>
): RecommendationOption[] {
  const framework = analysis.frontendFramework?.value.toLowerCase() ?? "";
  const hasBackend =
    hasService(analysis, "database") ||
    hasService(analysis, "auth") ||
    hasService(analysis, "payments") ||
    hasService(analysis, "email") ||
    intake?.needsBackend === true;
  const isStatic =
    !hasBackend &&
    /(vite|astro|static|react)/i.test(framework) &&
    !/next/i.test(framework);

  if (isStatic) {
    return staticSiteOptions();
  }

  return fullStackOptions(analysis);
}

function staticSiteOptions(): RecommendationOption[] {
  return [
    {
      id: "fastest-static",
      label: "Fastest to Ship",
      priority: "fastest",
      summary: "Deploy the static frontend on Vercel using the detected build output.",
      why: "This project looks like a frontend-only site. It does not need a database server or long-running backend to launch.",
      services: {
        hosting: "Vercel",
        backend: "Not needed",
        database: "Not needed",
        auth: "Not needed",
        storage: "Not needed",
        email: "Not needed",
        payments: "Not needed",
        analytics: "Vercel Analytics or Plausible",
        monitoring: "Sentry only if the app has meaningful client-side error risk",
        ciCd: "Vercel GitHub import",
        dns: "Vercel DNS or existing registrar"
      },
      estimatedMonthlyCost: "$0-20",
      tradeoffs: [
        "Very quick setup",
        "Limited backend growth path without adding services"
      ],
      whenNotToChoose:
        "Do not choose this if the app needs auth, a database, payments, or server-side jobs."
    },
    {
      id: "cheapest-static",
      label: "Cheapest Reasonable Setup",
      priority: "cheapest",
      summary: "Use Cloudflare Pages for generous static hosting limits.",
      why: "Cloudflare Pages is a strong fit when cost is the main constraint and the app is mostly static.",
      services: {
        hosting: "Cloudflare Pages",
        backend: "Not needed",
        database: "Not needed",
        auth: "Not needed",
        storage: "Not needed",
        email: "Not needed",
        payments: "Not needed",
        analytics: "Cloudflare Web Analytics",
        monitoring: "Optional Sentry",
        ciCd: "Cloudflare GitHub integration",
        dns: "Cloudflare DNS"
      },
      estimatedMonthlyCost: "$0-10",
      tradeoffs: ["Low cost", "Provider-specific setup can be less familiar than Vercel"],
      whenNotToChoose:
        "Do not choose this if the app needs framework-specific server behavior."
    }
  ];
}

function fullStackOptions(analysis: RepoAnalysis): RecommendationOption[] {
  const database = serviceName(analysis, "database", "Supabase Postgres");
  const auth = serviceName(analysis, "auth", "Supabase Auth or Auth.js");
  const email = serviceName(analysis, "email", "Resend");
  const payments = serviceName(analysis, "payments", "Stripe if payments are needed");
  const hasStorage = hasService(analysis, "storage");
  const storage = serviceName(
    analysis,
    "storage",
    "Supabase Storage if uploads are needed"
  );

  return [
    {
      id: "fastest-managed",
      label: "Fastest to Ship",
      priority: "fastest",
      summary:
        "Use Vercel for the app and managed services for data, auth, email, payments, monitoring, and analytics.",
      why: "This keeps the launch path short while still using production-ready managed services. It follows the repo's detected services where possible instead of forcing a new architecture.",
      services: {
        hosting: "Vercel",
        backend: "Vercel serverless functions or framework routes",
        database,
        auth,
        storage,
        email,
        payments,
        analytics: serviceName(analysis, "analytics", "PostHog"),
        monitoring: serviceName(analysis, "monitoring", "Sentry"),
        ciCd: "Vercel GitHub import",
        dns: "Vercel DNS or existing registrar"
      },
      estimatedMonthlyCost: "$0-100",
      tradeoffs: [
        "Fastest route from prototype to production",
        "Serverless limits can matter for long-running jobs or heavy background work"
      ],
      whenNotToChoose:
        "Do not choose this if the backend needs persistent processes, custom networking, or Docker-only runtime behavior."
    },
    {
      id: "cheapest-managed",
      label: "Cheapest Reasonable Setup",
      priority: "cheapest",
      summary:
        "Use Render or Railway for hosting and free or low-cost managed service tiers until usage proves otherwise.",
      why: "This keeps monthly spend low while avoiding self-hosted databases or fragile production setup.",
      services: {
        hosting: "Render or Railway",
        backend: "Render Web Service or Railway service",
        database:
          database === "Supabase Postgres" ? "Neon or Supabase free tier" : database,
        auth,
        storage,
        email,
        payments,
        analytics: "PostHog free tier or Plausible if privacy analytics matters",
        monitoring: "Sentry free tier",
        ciCd: "Provider GitHub deploys",
        dns: "Provider DNS instructions with existing registrar"
      },
      estimatedMonthlyCost: "$0-50",
      tradeoffs: [
        "Keeps spend low for early validation",
        "Free tiers are not production guarantees and can require upgrades"
      ],
      whenNotToChoose:
        "Do not choose this if launch reliability matters more than minimizing early cost."
    },
    {
      id: "scalable-managed",
      label: "More Scalable Production Setup",
      priority: "scalable",
      summary:
        "Use Vercel or Fly.io with dedicated managed data services and explicit monitoring.",
      why: "This is the sensible upgrade path when the app has real users, paid plans, background work, or stricter reliability needs.",
      services: {
        hosting:
          "Vercel for framework apps, Fly.io for Docker or persistent backend needs",
        backend: "Framework routes on Vercel or Fly.io app service",
        database:
          database === "Supabase Postgres"
            ? "Neon Pro or Supabase Pro Postgres"
            : database,
        auth,
        storage:
          hasStorage
            ? storage
            : "S3-compatible storage or Supabase Storage",
        email,
        payments,
        analytics: "PostHog",
        monitoring: "Sentry with alerts enabled",
        ciCd: "GitHub protected branch deploys",
        dns: "Managed DNS with documented rollback"
      },
      estimatedMonthlyCost: "$50-500+",
      tradeoffs: [
        "Better reliability and room to scale",
        "More accounts, settings, and monthly cost"
      ],
      whenNotToChoose:
        "Do not choose this before there is real usage or a concrete reliability requirement."
    }
  ];
}
