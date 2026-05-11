import { hasService, serviceName } from "@/lib/service-utils";
import type { ProjectIntake, RecommendationOption, RepoAnalysis } from "@/types/planner";

export function buildRecommendationOptions(
  analysis: RepoAnalysis,
  intake?: Partial<ProjectIntake>
): RecommendationOption[] {
  const framework = analysis.frontendFramework?.value.toLowerCase() ?? "";
  const isDockerProject = Boolean(
    analysis.docker?.needsProductionDocker || hasService(analysis, "docker")
  );
  const hasBackendServices =
    hasService(analysis, "database") ||
    hasService(analysis, "auth") ||
    hasService(analysis, "payments") ||
    hasService(analysis, "email") ||
    hasService(analysis, "storage") ||
    hasService(analysis, "background_jobs") ||
    hasService(analysis, "realtime");
  const intakeNeedsBackend =
    intake?.needsBackend === true ||
    intake?.needsAuth === true ||
    intake?.needsDatabase === true ||
    intake?.needsFileUploads === true ||
    intake?.needsEmail === true ||
    intake?.needsPayments === true ||
    intake?.needsBackgroundJobs === true ||
    intake?.needsRealtime === true;
  const hasBackend = hasBackendServices || intakeNeedsBackend;
  const isStatic =
    !hasBackend &&
    (intake?.needsBackend === false ||
      (/(vite|astro|static|react)/i.test(framework) && !/next/i.test(framework)));
  const isApiOnly =
    intake?.appType === "api" ||
    (!analysis.frontendFramework && Boolean(analysis.backendFramework));

  if (isStatic) {
    return orderOptions(staticSiteOptions(), intake?.priority);
  }

  if (isApiOnly) {
    return orderOptions(apiOptions(analysis, isDockerProject), intake?.priority);
  }

  return orderOptions(
    fullStackOptions(analysis, intake, isDockerProject),
    intake?.priority
  );
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
    },
    {
      id: "scalable-static",
      label: "More Scalable Production Setup",
      priority: "scalable",
      summary:
        "Keep the static app on Vercel or Cloudflare Pages and add monitoring, analytics, and DNS discipline.",
      why: "A static site does not need a separate scalable backend. The production upgrade is better observability, domain setup, and cache/CDN settings.",
      services: {
        hosting: "Vercel or Cloudflare Pages",
        backend: "Not needed",
        database: "Not needed",
        auth: "Not needed",
        storage: "Not needed",
        email: "Not needed",
        payments: "Not needed",
        analytics: "Plausible, PostHog, or Cloudflare Web Analytics",
        monitoring: "Sentry for client-side errors if the app is interactive",
        ciCd: "Protected main branch deploys",
        dns: "Managed DNS with documented rollback"
      },
      estimatedMonthlyCost: "$0-50",
      tradeoffs: [
        "Scales static traffic well without extra infrastructure",
        "Does not solve future backend needs by itself"
      ],
      whenNotToChoose:
        "Do not choose this if the app is already a full-stack product with server-side state."
    }
  ];
}

function apiOptions(
  analysis: RepoAnalysis,
  isDockerProject: boolean
): RecommendationOption[] {
  const database = serviceName(
    analysis,
    "database",
    "Neon or Supabase Postgres if persistence is needed"
  );
  const auth = serviceName(
    analysis,
    "auth",
    "Provider-native auth only if the API has user accounts"
  );
  const email = serviceName(analysis, "email", "Resend if transactional email is needed");
  const payments = serviceName(analysis, "payments", "Stripe if payments are needed");

  return [
    {
      id: "fastest-api",
      label: "Fastest to Ship",
      priority: "fastest",
      summary: isDockerProject
        ? "Deploy the API container on Render or Railway and attach managed services."
        : "Deploy the API on Render or Railway using the detected production start command.",
      why: "API projects need a reliable backend process more than a frontend hosting preset. Render and Railway keep setup understandable for V0 launches.",
      services: {
        hosting: isDockerProject
          ? "Render or Railway Docker service"
          : "Render or Railway",
        backend: isDockerProject ? "Docker web service" : "Web service",
        database,
        auth,
        storage: serviceName(
          analysis,
          "storage",
          "S3-compatible storage if uploads are needed"
        ),
        email,
        payments,
        analytics: "PostHog only if product events are needed",
        monitoring: serviceName(analysis, "monitoring", "Sentry"),
        ciCd: "Provider GitHub deploys",
        dns: "Provider DNS instructions with existing registrar"
      },
      estimatedMonthlyCost: "$0-100",
      tradeoffs: [
        "Clear fit for backend APIs",
        "Usually less polished for frontend preview deployments than Vercel"
      ],
      whenNotToChoose:
        "Do not choose this if the app is actually a static frontend or framework app with no long-running API."
    },
    {
      id: "cheapest-api",
      label: "Cheapest Reasonable Setup",
      priority: "cheapest",
      summary:
        "Use Railway, Render, or Fly.io with the smallest managed database tier that fits launch.",
      why: "This keeps early API costs low while avoiding self-hosted production databases.",
      services: {
        hosting: "Railway, Render, or Fly.io starter service",
        backend: "Single API service",
        database,
        auth,
        storage: serviceName(analysis, "storage", "Not needed unless uploads are used"),
        email,
        payments,
        analytics: "PostHog free tier or provider logs only",
        monitoring: "Sentry free tier",
        ciCd: "Provider GitHub deploys",
        dns: "Existing registrar with provider records"
      },
      estimatedMonthlyCost: "$0-75",
      tradeoffs: [
        "Lower spend while validating",
        "Free tiers can sleep, throttle, or require upgrades"
      ],
      whenNotToChoose:
        "Do not choose this if launch reliability matters more than monthly cost."
    },
    {
      id: "scalable-api",
      label: "More Scalable Production Setup",
      priority: "scalable",
      summary:
        "Use Fly.io or Render with managed Postgres, Redis/queue services when needed, and explicit monitoring.",
      why: "This is the sensible path when API latency, background jobs, Docker runtime needs, or paid users matter.",
      services: {
        hosting: isDockerProject
          ? "Fly.io or Render Docker service"
          : "Fly.io, Render, or Railway",
        backend: "Dedicated API service with health checks",
        database: database.includes("Postgres")
          ? "Neon Pro or Supabase Pro Postgres"
          : database,
        auth,
        storage: serviceName(analysis, "storage", "S3-compatible storage"),
        email,
        payments,
        analytics: "PostHog",
        monitoring: "Sentry with alerts enabled",
        ciCd: "Protected branch deploys",
        dns: "Managed DNS with documented rollback"
      },
      estimatedMonthlyCost: "$50-500+",
      tradeoffs: [
        "Better fit for durable backend workloads",
        "More operational settings than a simple framework preset"
      ],
      whenNotToChoose:
        "Do not choose this before there is real backend usage or a concrete reliability requirement."
    }
  ];
}

function fullStackOptions(
  analysis: RepoAnalysis,
  intake: Partial<ProjectIntake> | undefined,
  isDockerProject: boolean
): RecommendationOption[] {
  const database = serviceName(
    analysis,
    "database",
    intake?.needsDatabase === false ? "Not needed" : "Supabase Postgres"
  );
  const auth = serviceName(
    analysis,
    "auth",
    intake?.needsAuth === false ? "Not needed" : "Supabase Auth or Auth.js"
  );
  const email = serviceName(
    analysis,
    "email",
    intake?.needsEmail === false ? "Not needed" : "Resend"
  );
  const payments = serviceName(
    analysis,
    "payments",
    intake?.needsPayments === false ? "Not needed" : "Stripe if payments are needed"
  );
  const storage = serviceName(
    analysis,
    "storage",
    intake?.needsFileUploads === false
      ? "Not needed"
      : "Supabase Storage if uploads are needed"
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
        hosting: isDockerProject
          ? "Vercel for frontend, Render/Fly.io for Docker backend"
          : "Vercel",
        backend: isDockerProject
          ? "Container service for Docker-only backend behavior"
          : "Vercel serverless functions or framework routes",
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
        isDockerProject
          ? "Docker adds platform settings, but it may preserve required runtime behavior"
          : "Serverless limits can matter for long-running jobs or heavy background work"
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
        backend: isDockerProject
          ? "Docker web service"
          : "Render Web Service or Railway service",
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
        hosting: isDockerProject
          ? "Fly.io or Render for Docker-backed runtime"
          : "Vercel for framework apps, Fly.io for persistent backend needs",
        backend: isDockerProject
          ? "Docker app service with health check"
          : "Framework routes on Vercel or Fly.io app service",
        database:
          database === "Supabase Postgres"
            ? "Neon Pro or Supabase Pro Postgres"
            : database,
        auth,
        storage:
          storage === "Supabase Storage if uploads are needed"
            ? "S3-compatible storage or Supabase Storage"
            : storage,
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

function orderOptions(
  options: RecommendationOption[],
  priority: Partial<ProjectIntake>["priority"]
) {
  if (priority === "cost") {
    return sortByPriority(options, ["cheapest", "fastest", "scalable"]);
  }

  if (priority === "scalability") {
    return sortByPriority(options, ["scalable", "fastest", "cheapest"]);
  }

  return sortByPriority(options, ["fastest", "cheapest", "scalable"]);
}

function sortByPriority(
  options: RecommendationOption[],
  priorityOrder: RecommendationOption["priority"][]
) {
  return [...options].sort(
    (left, right) =>
      priorityOrder.indexOf(left.priority) - priorityOrder.indexOf(right.priority)
  );
}
